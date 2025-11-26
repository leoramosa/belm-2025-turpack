import { NextRequest, NextResponse } from "next/server";

interface FreeShippingResponse {
  enabled: boolean;
  threshold: number;
  method_title: string;
  zone_name: string;
  zone_id: number | null;
  currency: string;
  currency_symbol: string;
  cart?: {
    subtotal: number;
    qualifies_for_free_shipping: boolean;
    remaining_for_free_shipping: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCart = searchParams.get("include_cart") === "true";

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!apiUrl || !consumerKey || !consumerSecret) {
      console.warn(
        "WooCommerce credentials not configured, returning default config"
      );
      return NextResponse.json({
        enabled: false,
        threshold: 0,
        method_title: "Envío gratuito",
        zone_name: "",
        zone_id: null,
        currency: "PEN",
        currency_symbol: "S/",
      });
    }

    // Obtener todas las zonas de envío
    const zonesResponse = await fetch(
      `${apiUrl}/wp-json/wc/v3/shipping/zones`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${consumerKey}:${consumerSecret}`
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!zonesResponse.ok) {
      throw new Error(`WooCommerce API error: ${zonesResponse.status}`);
    }

    const zones = await zonesResponse.json();

    // Buscar configuración de envío gratuito
    const freeShippingConfig = {
      enabled: false,
      threshold: 0,
      method_title: "Envío gratuito",
      zone_name: "",
      zone_id: null as number | null,
      currency: "PEN",
      currency_symbol: "S/",
    };

    // Buscar en todas las zonas
    for (const zone of zones) {
      try {
        const methodsResponse = await fetch(
          `${apiUrl}/wp-json/wc/v3/shipping/zones/${zone.id}/methods`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${consumerKey}:${consumerSecret}`
              ).toString("base64")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (methodsResponse.ok) {
          const methods = await methodsResponse.json();

          for (const method of methods) {
            if (method.method_id === "free_shipping" && method.enabled) {
              freeShippingConfig.enabled = true;
              freeShippingConfig.zone_name = zone.name;
              freeShippingConfig.zone_id = zone.id;

              // Obtener el umbral mínimo
              if (method.settings?.min_amount) {
                // Si min_amount es un objeto, extraer el value; si es string/number, usarlo directamente
                const amountValue =
                  typeof method.settings.min_amount === "object"
                    ? method.settings.min_amount.value ||
                      method.settings.min_amount.default ||
                      "0"
                    : method.settings.min_amount;
                freeShippingConfig.threshold = parseFloat(String(amountValue));
              }

              // Obtener el título personalizado
              if (method.settings?.title) {
                // Si title es un objeto, extraer el value; si es string, usarlo directamente
                freeShippingConfig.method_title =
                  typeof method.settings.title === "object"
                    ? method.settings.title.value ||
                      method.settings.title.default ||
                      "Envío gratuito"
                    : method.settings.title;
              }

              // Si encontramos uno habilitado, retornar
              break;
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching methods for zone ${zone.id}:`, error);
        // Continuar con la siguiente zona
      }
    }

    // También revisar la zona "Resto del mundo" (ID 0)
    if (!freeShippingConfig.enabled) {
      try {
        const methodsResponse = await fetch(
          `${apiUrl}/wp-json/wc/v3/shipping/zones/0/methods`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${consumerKey}:${consumerSecret}`
              ).toString("base64")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (methodsResponse.ok) {
          const methods = await methodsResponse.json();

          for (const method of methods) {
            if (method.method_id === "free_shipping" && method.enabled) {
              freeShippingConfig.enabled = true;
              freeShippingConfig.zone_name = "Resto del mundo";
              freeShippingConfig.zone_id = 0;

              if (method.settings?.min_amount) {
                // Si min_amount es un objeto, extraer el value; si es string/number, usarlo directamente
                const amountValue =
                  typeof method.settings.min_amount === "object"
                    ? method.settings.min_amount.value ||
                      method.settings.min_amount.default ||
                      "0"
                    : method.settings.min_amount;
                freeShippingConfig.threshold = parseFloat(String(amountValue));
              }

              if (method.settings?.title) {
                // Si title es un objeto, extraer el value; si es string, usarlo directamente
                freeShippingConfig.method_title =
                  typeof method.settings.title === "object"
                    ? method.settings.title.value ||
                      method.settings.title.default ||
                      "Envío gratuito"
                    : method.settings.title;
              }

              break;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching methods for zone 0:", error);
      }
    }

    const response: FreeShippingResponse = {
      ...freeShippingConfig,
      currency: "PEN",
      currency_symbol: "S/",
    };

    // Si se solicita información del carrito (para futuro uso)
    if (includeCart) {
      response.cart = {
        subtotal: 0, // Se calculará en el frontend
        qualifies_for_free_shipping: false,
        remaining_for_free_shipping: 0,
      };
    }

    console.log("Free shipping config found:", freeShippingConfig);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching free shipping configuration:", error);
    return NextResponse.json(
      {
        enabled: false,
        threshold: 0,
        method_title: "Envío gratuito",
        zone_name: "",
        zone_id: null,
        currency: "PEN",
        currency_symbol: "S/",
        error: "Error fetching free shipping configuration",
      },
      { status: 200 } // Cambiado a 200 para evitar errores en el frontend
    );
  }
}
