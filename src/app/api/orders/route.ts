import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";

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

    let ordersByCustomer: any[] = [];
    let ordersByEmail: any[] = [];

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
          const data = await byIdRes.json();
          ordersByCustomer = Array.isArray(data) ? data : [];
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
          const data = await byEmailRes.json();
          ordersByEmail = Array.isArray(data) ? data : [];
        }
      } catch {
        // Error silencioso
      }
    }

    // Filtrar pedidos por email - si el email coincide, es válido (incluso si customer_id es 0)
    const validOrdersByEmail = ordersByEmail.filter((order) => {
      const emailMatches = order.billing?.email === email;
      return emailMatches;
    });

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

export async function POST(request: NextRequest) {
  try {
    const orderPayload = await request.json();

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
      const oauthParams: Record<string, string | number> = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: timestamp,
        oauth_version: "1.0",
      };
      const allParams = { ...oauthParams, ...params };
      const paramString = Object.keys(allParams)
        .sort()
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(
              allParams[key] as string
            )}`
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
      return { ...oauthParams, oauth_signature: encodeURIComponent(signature) };
    };

    const url = `${apiUrl}/wp-json/wc/v3/orders`;
    const oauthParams = generateOAuthSignature(url, "POST");

    // Construir URL con parámetros OAuth
    const queryString = new URLSearchParams(
      oauthParams as Record<string, string>
    ).toString();
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
