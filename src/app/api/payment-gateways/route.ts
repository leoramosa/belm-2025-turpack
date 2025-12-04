import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!apiUrl || !consumerKey || !consumerSecret) {
      console.error("Payment gateways: Missing WooCommerce credentials");
      return NextResponse.json(
        { error: "Payment gateways configuration error" },
        { status: 500 }
      );
    }

    // Agregar timeout para evitar que la petición se cuelgue
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    try {
      const response = await fetch(`${apiUrl}/wp-json/wc/v3/payment_gateways`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${consumerKey}:${consumerSecret}`
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Si es 404, devolver array vacío (no hay gateways configurados)
        if (response.status === 404) {
          return NextResponse.json([], {
            headers: {
              "Cache-Control":
                "public, s-maxage=1800, stale-while-revalidate=900",
            },
          });
        }

        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `WooCommerce API error: ${response.status} - ${errorText}`
        );
      }

      // Validar que la respuesta sea JSON válido
      let gateways;
      try {
        gateways = await response.json();
      } catch (jsonError) {
        console.error("Error parsing payment gateways JSON:", jsonError);
        // Si no es JSON válido, devolver array vacío
        return NextResponse.json([], {
          headers: {
            "Cache-Control":
              "public, s-maxage=1800, stale-while-revalidate=900",
          },
        });
      }

      if (!Array.isArray(gateways)) {
        console.warn(
          "Payment gateways: Response is not an array, returning empty array"
        );
        return NextResponse.json([], {
          headers: {
            "Cache-Control":
              "public, s-maxage=1800, stale-while-revalidate=900",
          },
        });
      }

      return NextResponse.json(gateways, {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=900", // 30 minutos
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Si es un error de timeout o red, devolver array vacío en lugar de error 500
      if (
        fetchError instanceof Error &&
        (fetchError.name === "AbortError" ||
          fetchError.message.includes("fetch failed") ||
          fetchError.message.includes("network"))
      ) {
        console.warn(
          "Payment gateways: Network error, returning empty array:",
          fetchError.message
        );
        return NextResponse.json([], {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120", // Cache más corto para errores
          },
        });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching payment gateways:", error);

    // En producción, devolver array vacío en lugar de error para evitar romper el checkout
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      return NextResponse.json([], {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error fetching payment gateways",
      },
      { status: 500 }
    );
  }
}
