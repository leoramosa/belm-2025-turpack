import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";
import { validateOrderStock } from "@/lib/stockValidation";

interface WooCommerceOrder {
  id: number;
  billing?: {
    email?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

type OrderPayload = Record<string, unknown>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer");
    const email = searchParams.get("email");

    const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!apiUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "Credenciales de WordPress no configuradas" },
        { status: 500 }
      );
    }

    // Crear header de Basic Auth
    const credentials = `${consumerKey}:${consumerSecret}`;
    const encoded = Buffer.from(credentials).toString("base64");
    const authHeader = `Basic ${encoded}`;

    let ordersByCustomer: WooCommerceOrder[] = [];
    let ordersByEmail: WooCommerceOrder[] = [];

    // Intentar obtener órdenes por customerId primero
    if (customerId) {
      try {
        const byIdUrl = `${apiUrl}/wp-json/wc/v3/orders?customer=${customerId}`;
        const byIdRes = await fetch(byIdUrl, {
          method: "GET",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        if (byIdRes.ok) {
          const data: unknown = await byIdRes.json();
          ordersByCustomer = Array.isArray(data)
            ? (data as WooCommerceOrder[])
            : [];
        }
      } catch {
        // Error silencioso
      }
    }

    // Intentar obtener órdenes por email
    if (email) {
      try {
        const byEmailUrl = `${apiUrl}/wp-json/wc/v3/orders?billing_email=${encodeURIComponent(
          email
        )}&per_page=100`;
        const byEmailRes = await fetch(byEmailUrl, {
          method: "GET",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        if (byEmailRes.ok) {
          const data: unknown = await byEmailRes.json();
          ordersByEmail = Array.isArray(data)
            ? (data as WooCommerceOrder[])
            : [];
        }
      } catch {
        // Error silencioso
      }
    }

    // Filtrar pedidos por email - si el email coincide, es válido (incluso si customer_id es 0)
    const validOrdersByEmail = ordersByEmail.filter(
      (order) => order.billing?.email === email
    );

    // Combinar y eliminar duplicados por id
    const allOrders = [...ordersByCustomer, ...validOrdersByEmail].filter(
      (order, index, self) => index === self.findIndex((o) => o.id === order.id)
    );

    return NextResponse.json(allOrders, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener las órdenes" },
      { status: 500 }
    );
  }
}

const normalizeParams = (input: Record<string, string | number>) =>
  Object.entries(input).reduce<Record<string, string>>(
    (accumulator, [key, value]) => {
      accumulator[key] = String(value);
      return accumulator;
    },
    {}
  );

export async function POST(request: NextRequest) {
  try {
    const orderPayload = (await request.json()) as OrderPayload;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!apiUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "WooCommerce credentials not configured" },
        { status: 500 }
      );
    }

    // Generar OAuth signature
    const generateOAuthSignature = (
      url: string,
      method: string = "POST",
      params: Record<string, string | number> = {}
    ) => {
      const nonce = Math.random().toString(36).substring(2);
      const timestamp = Math.floor(Date.now() / 1000);
      const oauthParams = normalizeParams({
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: timestamp,
        oauth_version: "1.0",
      });
      const allParams = {
        ...oauthParams,
        ...normalizeParams(params),
      };
      const paramString = Object.keys(allParams)
        .sort()
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`
        )
        .join("&");
      const baseUrl = url.split("?")[0];
      const baseString = `${method.toUpperCase()}&${encodeURIComponent(
        baseUrl
      )}&${encodeURIComponent(paramString)}`;
      const signingKey = `${encodeURIComponent(consumerSecret)}&`;
      const signature = CryptoJS.HmacSHA1(baseString, signingKey).toString(
        CryptoJS.enc.Base64
      );
      return {
        ...oauthParams,
        oauth_signature: encodeURIComponent(signature),
      };
    };

    // 🆕 VALIDAR STOCK ANTES DE CREAR LA ORDEN
    // Esto previene que se creen órdenes cuando no hay stock disponible
    const lineItems =
      (orderPayload.line_items as Array<{
        product_id: number;
        variation_id?: number;
        quantity: number;
        meta_data?: Array<{ key: string; value: string | number | boolean }>;
      }>) || [];

    if (lineItems.length > 0) {
      // Crear header de Basic Auth para validación de stock
      const credentials = `${consumerKey}:${consumerSecret}`;
      const encoded = Buffer.from(credentials).toString("base64");
      const authHeader = `Basic ${encoded}`;

      // Validar stock de todos los productos
      const stockValidation = await validateOrderStock(
        lineItems,
        apiUrl,
        authHeader
      );

      if (!stockValidation.isValid) {
        // Construir mensaje de error detallado con nombre del producto y atributos
        const errorMessages = stockValidation.errors.map((error) => {
          // Construir parte de atributos
          let attributesText = "";
          if (error.attributes && error.attributes.length > 0) {
            const attributesList = error.attributes
              .map((attr) => `${attr.name}: ${attr.value}`)
              .join(", ");
            attributesText = `, ${attributesList}`;
          }

          // Construir mensaje completo
          return `${
            error.baseProductName || error.productName
          }${attributesText}, solicitaste ${
            error.requestedQuantity
          } pero solo hay ${error.availableStock} disponible${
            error.availableStock !== 1 ? "s" : ""
          }`;
        });

        return NextResponse.json(
          {
            error: "Stock insuficiente",
            message: `No hay suficiente stock para los siguientes productos: ${errorMessages.join(
              "; "
            )}`,
            details: stockValidation.errors,
          },
          { status: 400 }
        );
      }
    }

    const url = `${apiUrl}/wp-json/wc/v3/orders`;
    const oauthParams = generateOAuthSignature(url, "POST");

    // Construir URL con parámetros OAuth
    const queryString = new URLSearchParams(oauthParams).toString();
    const fullUrl = `${url}?${queryString}`;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `WooCommerce API error: ${response.status} - ${errorData}`
      );
    }

    const order = await response.json();

    return NextResponse.json(order, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 }
    );
  }
}
