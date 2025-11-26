import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "ID de orden inválido" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!apiUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "Credenciales de WordPress no configuradas" },
        { status: 500 }
      );
    }

    const url = `${apiUrl}/wp-json/wc/v3/orders/${orderId}`;

    // Crear header de Basic Auth
    const credentials = `${consumerKey}:${consumerSecret}`;
    const encoded = Buffer.from(credentials).toString("base64");
    const authHeader = `Basic ${encoded}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 404) {
        return NextResponse.json(
          { error: "No se encontró la orden o no tienes permisos para verla" },
          { status: response.status }
        );
      }
      const errorData = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Error del servidor: ${response.status} - ${errorData}` },
        { status: response.status }
      );
    }

    const order = await response.json();

    // Obtener email del cliente desde los headers o query params si es necesario
    const customerEmail = request.headers.get("x-customer-email") || null;
    const customerId = request.headers.get("x-customer-id") || null;

    // Validación de propiedad de la orden (opcional)
    if (customerId || customerEmail) {
      const orderCustomerId = order.customer_id;
      const orderEmail = order.billing?.email;

      const isOwner =
        (customerId && orderCustomerId === parseInt(customerId.toString())) ||
        (customerEmail && orderEmail === customerEmail);

      if (!isOwner) {
        return NextResponse.json(
          { error: "No tienes permisos para ver esta orden" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(order, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "No se pudo obtener el detalle de la orden" },
      { status: 500 }
    );
  }
}
