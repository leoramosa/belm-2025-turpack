import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code, cart_items } = await request.json();

    console.log("🔍 TEST API - Datos recibidos:", {
      code,
      cart_items: JSON.stringify(cart_items, null, 2),
    });

    if (!code || !cart_items || !Array.isArray(cart_items)) {
      return NextResponse.json(
        { error: "Código de cupón y items del carrito son requeridos" },
        { status: 400 }
      );
    }

    // Calcular total manualmente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalAmount = cart_items.reduce((total: number, item: any) => {
      const price = parseFloat(item.price) || 0;
      const itemTotal = price * item.quantity;
      console.log("🔍 ITEM:", {
        name: item.name,
        price: item.price,
        parsedPrice: price,
        quantity: item.quantity,
        itemTotal,
      });
      return total + itemTotal;
    }, 0);

    console.log("🔍 TOTAL CALCULADO:", totalAmount);

    // Simular cupón de 10%
    const discountAmount = (totalAmount * 10) / 100;

    console.log("🔍 DESCUENTO CALCULADO:", discountAmount);

    return NextResponse.json({
      success: true,
      test: true,
      data: {
        code,
        totalAmount,
        discountAmount,
        discountPercent: 10,
        finalTotal: totalAmount - discountAmount,
        formatted: {
          subtotal: `S/ ${totalAmount.toFixed(2)}`,
          discount: `-S/ ${discountAmount.toFixed(2)}`,
          total: `S/ ${(totalAmount - discountAmount).toFixed(2)}`,
        },
      },
    });
  } catch (error) {
    console.error("Error en test API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
