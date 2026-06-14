import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { checkoutRateLimit } from "@/lib/rateLimit";

// ⚠️ IMPORTANTE: Este webhook se mantiene como respaldo
// La implementación principal ahora usa IPN de Mi Cuenta Web en /api/izipay/ipn
// Este archivo se puede eliminar una vez que el IPN esté funcionando correctamente

const WC_API_URL = process.env.NEXT_PUBLIC_API_URL;
const WC_CK = process.env.WC_CONSUMER_KEY;
const WC_CS = process.env.WC_CONSUMER_SECRET;

export async function POST(req: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = checkoutRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const body = await req.json();
  
  // Extraer datos del webhook de Izipay
  const paymentData = body.kr_answer || body.clientAnswer;
  const hash = body.kr_hash || body.hash;
  const orderId = body.order_id || body.metadata?.order_id;
  const amount = body.amount;
  const transactionId = body.transaction_id || body.kr_transaction_id;
  const status = body.status || body.kr_status;

  // 🆕 Extraer datos del carrito y envío directamente del webhook
  const cartItems = body.cartItems || body.cart_items || [];
  const shippingInfo = body.shippingInfo || body.shipping_info || {};
  const customerEmail = body.customerEmail || body.customer_email || body.email;
  const customerName = body.customerName || body.customer_name || body.name;

                    
  if (!paymentData || !hash) {
        return NextResponse.json({ ignored: true, reason: "missing_payment_data" });
  }

  try {
    // 🔍 PASO 1: Validar el pago con la API de Izipay
    
    const validationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/wp-json/izipay/v1/validate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "kr-answer": paymentData,
          "kr-hash": hash,
        }),
      }
    );

    if (!validationResponse.ok) {
            return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    const validationResult = await validationResponse.json();
    
    // 🔍 PASO 2: Verificar si la validación fue exitosa
    if (!validationResult.valid || !validationResult.success) {
            return NextResponse.json({
        ignored: true,
        reason: "payment_not_validated",
      });
    }

    // 🎯 PASO 3: Pago confirmado exitosamente - Crear/actualizar orden
    
    let wcOrder;

    if (orderId) {
      // Si ya existe una orden, actualizarla
      try {
        const existingOrderRes = await axios.get(
          `${WC_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${WC_CK}&consumer_secret=${WC_CS}`
        );
        wcOrder = existingOrderRes.data;
              } catch {
              }
    }

    if (wcOrder) {
      // 🔄 Actualizar orden existente
      
      await axios.put(
        `${WC_API_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${WC_CK}&consumer_secret=${WC_CS}`,
        {
          status: "processing",
          set_paid: true,
          payment_method: "izipay",
          payment_method_title: "Pago con Izipay",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

          } else {
      // 🆕 Crear nueva orden con los datos del pago confirmado
      
      // 🆕 Usar datos del webhook en lugar de depender de la validación
                        
      // 🆕 Construir line_items desde los datos del carrito del webhook
      let lineItems = [];

      if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
        lineItems = cartItems.map((item: Record<string, unknown>) => {
          const lineItem: Record<string, unknown> = {
            product_id: item.product_id,
            quantity: item.quantity,
            name: item.name || "Producto",
            total: (
              parseFloat(String(item.price || "0")) * Number(item.quantity)
            ).toFixed(2),
          };

          // Agregar variation_id si existe
          if (item.variations && item.selectedAttributes) {
            const match = (
              item.variations as Array<Record<string, unknown>>
            ).find((v: Record<string, unknown>) => {
              return (v.attributes as Array<Record<string, unknown>>).every(
                (a: Record<string, unknown>) => {
                  const selected = (
                    item.selectedAttributes as Record<string, unknown>
                  )[a.id as string];
                  return selected && selected === a.option;
                }
              );
            });
            if (match) {
              lineItem.variation_id = match.id;
            }
          }

          return lineItem;
        });
      } else {
        // 🚨 Fallback: crear item genérico si no hay datos del carrito
                lineItems = [
          {
            product_id: 1, // Producto por defecto
            quantity: 1,
            name: "Producto Izipay",
            total: amount || "0.00",
          },
        ];
      }

      // 📍 Construir datos de facturación y envío desde el webhook
                        
      const billingShipping = {
        first_name:
          shippingInfo.firstName || customerName?.split(" ")[0] || "Cliente",
        last_name:
          shippingInfo.lastName ||
          customerName?.split(" ").slice(1).join(" ") ||
          "Izipay",
        email: customerEmail || "cliente@izipay.com",
        address_1: shippingInfo.address || "",
        city: shippingInfo.city || "",
        state: shippingInfo.state || "",
        postcode: shippingInfo.zipCode || "",
        country: "PE",
      };

      
      const newOrderData = {
        status: "processing",
        set_paid: true,
        payment_method: "izipay",
        payment_method_title: "Pago con Izipay",
        total: amount || "0.00",
        billing: billingShipping,
        shipping: billingShipping,
        line_items: lineItems,
        meta_data: [
          {
            key: "_izipay_payment_id",
            value: validationResult.payment_id || "unknown",
          },
          {
            key: "_izipay_transaction_id",
            value: validationResult.transaction_id || "unknown",
          },
          {
            key: "_izipay_webhook_received",
            value: new Date().toISOString(),
          },
        ],
      };

                        
      await axios.post(
        `${WC_API_URL}/wp-json/wc/v3/orders?consumer_key=${WC_CK}&consumer_secret=${WC_CS}`,
        newOrderData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
          }

    return NextResponse.json({
      success: true,
      message: "Orden procesada exitosamente",
      order_updated: !!wcOrder,
      order_created: !wcOrder,
      transaction_id: transactionId,
      amount: amount,
      status: status,
      webhook_processed: true,
    });
  } catch (error) {
    console.error("💥 Error procesando webhook Izipay:", error);
    return NextResponse.json(
      {
        error: "Error procesando webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
