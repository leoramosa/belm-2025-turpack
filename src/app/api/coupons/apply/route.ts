import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code, cart_items } = await request.json();

    if (!code || !cart_items || !Array.isArray(cart_items)) {
      return NextResponse.json(
        { error: "Código de cupón y items del carrito son requeridos" },
        { status: 400 }
      );
    }

    // Obtener credenciales de WooCommerce
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!consumerKey || !consumerSecret || !baseUrl) {
      return NextResponse.json(
        { error: "Configuración de WooCommerce no encontrada" },
        { status: 500 }
      );
    }

    // Crear controlador de aborto para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

    try {
      // Buscar cupón por código
      const searchUrl = `${baseUrl}/wp-json/wc/v3/coupons?code=${encodeURIComponent(
        code
      )}&per_page=1`;

      const searchResponse = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${consumerKey}:${consumerSecret}`
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!searchResponse.ok) {
        return NextResponse.json(
          { error: "Error al buscar cupón" },
          { status: searchResponse.status }
        );
      }

      const searchData = await searchResponse.json();

      if (!searchData || searchData.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Cupón no encontrado",
        });
      }

      const coupon = searchData[0];

      // Debug: Verificar free_shipping del cupón
      console.log("🔍 Cupón aplicado:", {
        code: coupon.code,
        free_shipping: coupon.free_shipping,
        free_shipping_type: typeof coupon.free_shipping,
      });

      // Verificar si el cupón está activo
      if (coupon.status !== "publish") {
        return NextResponse.json({
          success: false,
          error: "Cupón no está activo",
        });
      }

      // Verificar fecha de expiración
      if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
        return NextResponse.json({
          success: false,
          error: "Cupón ha expirado",
        });
      }

      // Verificar límite de uso
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return NextResponse.json({
          success: false,
          error: "Cupón ha alcanzado su límite de uso",
        });
      }

      // Calcular descuento basado en los items del carrito
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalAmount = cart_items.reduce((total: number, item: any) => {
        const price = parseFloat(item.price) || 0;
        return total + price * item.quantity;
      }, 0);

      let discountAmount = 0;
      const discountType = coupon.discount_type;

      if (coupon.discount_type === "percent") {
        discountAmount = (totalAmount * parseFloat(coupon.amount)) / 100;
      } else if (coupon.discount_type === "fixed_cart") {
        discountAmount = parseFloat(coupon.amount);
      } else if (coupon.discount_type === "fixed_product") {
        // Para descuento por producto, calcular por cada item
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discountAmount = cart_items.reduce((total: number, item: any) => {
          const price = parseFloat(item.price) || 0;
          const itemDiscount = (price * parseFloat(coupon.amount)) / 100;
          return total + itemDiscount;
        }, 0);
      }

      // Verificar monto mínimo
      if (
        coupon.minimum_amount &&
        totalAmount < parseFloat(coupon.minimum_amount)
      ) {
        return NextResponse.json({
          success: false,
          error: `El monto mínimo para este cupón es S/ ${coupon.minimum_amount}`,
        });
      }

      // Verificar monto máximo (solo si es mayor a 0)
      if (
        coupon.maximum_amount &&
        parseFloat(coupon.maximum_amount) > 0 &&
        totalAmount > parseFloat(coupon.maximum_amount)
      ) {
        return NextResponse.json({
          success: false,
          error: `El monto máximo para este cupón es S/ ${coupon.maximum_amount}`,
        });
      }

      return NextResponse.json({
        success: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          amount: coupon.amount,
          discount_amount: discountAmount,
          minimum_amount: coupon.minimum_amount,
          maximum_amount: coupon.maximum_amount,
          usage_limit: coupon.usage_limit,
          usage_count: coupon.usage_count,
          date_expires: coupon.date_expires,
          // free_shipping puede ser boolean o string "yes"/"no" en WooCommerce
          free_shipping:
            coupon.free_shipping === true ||
            coupon.free_shipping === "yes" ||
            coupon.free_shipping === 1,
        },
        discount: {
          amount: discountAmount,
          type: discountType,
          formatted_amount: `S/ ${discountAmount.toFixed(2)}`,
        },
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Timeout al aplicar cupón" },
          { status: 408 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error en apply API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
