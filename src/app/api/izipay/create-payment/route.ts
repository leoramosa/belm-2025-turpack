import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json();

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

    const url = `${apiUrl}/wp-json/izipay/v1/create-payment`;
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
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Izipay API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error creating Izipay payment:", error);
    return NextResponse.json(
      { error: "Error creating Izipay payment" },
      { status: 500 }
    );
  }
}
