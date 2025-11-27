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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const endpoint = `${WORDPRESS_API_URL}/wp-json/wc/v3/products/${id}`;

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
        { error: `Product not found: ${id}` },
        { status: response.status }
      );
    }

    const product = await response.json();
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
