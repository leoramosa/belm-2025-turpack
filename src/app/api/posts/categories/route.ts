import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const perPage = searchParams.get("per_page") || "100";

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
      `${apiUrl}/wp-json/wp/v2/categories?per_page=${perPage}`,
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
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const categories = await response.json();

    if (!Array.isArray(categories)) {
      return NextResponse.json([]);
    }

    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=900", // 30 minutos
      },
    });
  } catch (error) {
    console.error("Error fetching post categories:", error);
    return NextResponse.json(
      { error: "Error fetching post categories" },
      { status: 500 }
    );
  }
}
