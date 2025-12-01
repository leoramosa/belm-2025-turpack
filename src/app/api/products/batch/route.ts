import { NextRequest, NextResponse } from "next/server";
import {
  buildBasicAuthHeader,
  getWordpressApiUrl,
  getWordpressConsumerKey,
  getWordpressConsumerSecret,
} from "@/services/wordpress";

const WORDPRESS_API_URL = getWordpressApiUrl();
const WORDPRESS_WC_CONSUMER_KEY = getWordpressConsumerKey();
const WORDPRESS_WC_CONSUMER_SECRET = getWordpressConsumerSecret();

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required" },
        { status: 400 }
      );
    }

    // Limitar a 50 productos por request para evitar timeouts
    const productIds = ids.slice(0, 50).map((id) => String(id));

    if (
      !WORDPRESS_API_URL ||
      !WORDPRESS_WC_CONSUMER_KEY ||
      !WORDPRESS_WC_CONSUMER_SECRET
    ) {
      return NextResponse.json(
        { error: "WooCommerce credentials not configured" },
        { status: 500 }
      );
    }

    // Construir query string con múltiples IDs
    // WooCommerce permite buscar por múltiples IDs usando el parámetro include
    const includeParam = productIds.join(",");
    const endpoint = `${WORDPRESS_API_URL}/wp-json/wc/v3/products?include=${includeParam}&per_page=${productIds.length}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: buildBasicAuthHeader(
          WORDPRESS_WC_CONSUMER_KEY,
          WORDPRESS_WC_CONSUMER_SECRET
        ),
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 60,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch products: ${response.status}` },
        { status: response.status }
      );
    }

    const products = await response.json();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch products batch" },
      { status: 500 }
    );
  }
}
