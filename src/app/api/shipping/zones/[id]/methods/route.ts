import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const zoneId = parseInt(id);

    if (isNaN(zoneId)) {
      return NextResponse.json({ error: "Invalid zone ID" }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!apiUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "WooCommerce credentials not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${apiUrl}/wp-json/wc/v3/shipping/zones/${zoneId}/methods`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${consumerKey}:${consumerSecret}`
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const methods = await response.json();

    if (!Array.isArray(methods)) {
      return NextResponse.json([]);
    }

    return NextResponse.json(methods, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=900", // 30 minutos
      },
    });
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return NextResponse.json(
      { error: "Error fetching shipping methods" },
      { status: 500 }
    );
  }
}
