import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!apiUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "WooCommerce credentials not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/wp-json/wc/v3/shipping/zones`, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${consumerKey}:${consumerSecret}`
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const zones = await response.json();

    if (!Array.isArray(zones)) {
      return NextResponse.json([]);
    }

    return NextResponse.json(zones, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=900", // 30 minutos
      },
    });
  } catch (error) {
    console.error("Error fetching shipping zones:", error);
    return NextResponse.json(
      { error: "Error fetching shipping zones" },
      { status: 500 }
    );
  }
}
