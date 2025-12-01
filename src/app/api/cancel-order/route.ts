import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id");
  if (!orderId)
    return NextResponse.json({ error: "No order id" }, { status: 400 });

  // Llama a la API de WooCommerce para cancelar la orden
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(
    `${apiUrl}/wp-json/wc/v3/orders/${orderId}?consumer_key=${process.env.WC_CONSUMER_KEY}&consumer_secret=${process.env.WC_CONSUMER_SECRET}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
