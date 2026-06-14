import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { checkoutRateLimit } from "@/lib/rateLimit";
import {
  isSuccessfulTransaction,
  mapMCWStatusToWC,
  validateIPNFields,
} from "@/lib/micuentaweb-config";

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
                          
  // 🔍 PASO 1: Validar campos requeridos del IPN
  const fieldValidation = validateIPNFields(body);
  if (!fieldValidation.valid) {
        return NextResponse.json({
      ignored: true,
      reason: "missing_required_fields",
      missingFields: fieldValidation.missingFields,
    });
  }

  // 🔍 PASO 2: Extraer datos del IPN de Mi Cuenta Web
  const {
    kr_answer, // Respuesta de la transacción
    kr_hash, // Hash de seguridad
    kr_transaction_id, // ID de transacción
    kr_amount, // Monto
    kr_status, // Estado de la transacción
    kr_order_id, // ID de orden (si existe)
    kr_customer_email, // Email del cliente
    kr_customer_name, // Nombre del cliente
    kr_cart_items, // Items del carrito
    kr_shipping_info, // Información de envío
  } = body;

  if (!kr_answer || !kr_hash) {
        return NextResponse.json({ ignored: true, reason: "missing_payment_data" });
  }

  try {
    // 🔍 PASO 2: Validar el pago con la API de Izipay
    
    const validationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/wp-json/izipay/v1/validate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "kr-answer": kr_answer,
          "kr-hash": kr_hash,
        }),
      }
    );

    if (!validationResponse.ok) {
            return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    const validationResult = await validationResponse.json();
    
    // 🔍 PASO 3: Verificar si la validación fue exitosa
    if (!validationResult.valid || !validationResult.success) {
            return NextResponse.json({
        ignored: true,
        reason: "payment_not_validated",
      });
    }

    // 🔍 PASO 4: Verificar si la transacción es exitosa según Mi Cuenta Web
    if (!isSuccessfulTransaction(kr_status)) {
            return NextResponse.json({
        ignored: true,
        reason: "transaction_not_successful",
        status: kr_status,
      });
    }

    // 🎯 PASO 5: Pago confirmado exitosamente - Procesar orden
                
    // Mapear estado de Mi Cuenta Web a WooCommerce
    const wcStatus = mapMCWStatusToWC(kr_status);
    
    let wcOrder;

    if (kr_order_id) {
      // Si ya existe una orden, actualizarla
      try {
        const existingOrderRes = await axios.get(
          `${WC_API_URL}/wp-json/wc/v3/orders/${kr_order_id}?consumer_key=${WC_CK}&consumer_secret=${WC_CS}`
        );
        wcOrder = existingOrderRes.data;
              } catch {
              }
    }

    if (wcOrder) {
      // 🔄 Actualizar orden existente
      
      await axios.put(
        `${WC_API_URL}/wp-json/wc/v3/orders/${kr_order_id}?consumer_key=${WC_CK}&consumer_secret=${WC_CS}`,
        {
          status: wcStatus,
          set_paid: wcStatus === "processing",
          payment_method: "izipay",
          payment_method_title: "Pago con Izipay",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

          } else {
      // 🆕 Crear nueva orden con los datos del pago confirmado
      
      // 🛒 Construir line_items desde los datos del carrito
      let lineItems = [];

      if (
        kr_cart_items &&
        Array.isArray(kr_cart_items) &&
        kr_cart_items.length > 0
      ) {
                lineItems = kr_cart_items.map(
          (item: {
            product_id: number;
            quantity: number;
            name?: string;
            price?: string;
            variations?: Array<{
              id: number;
              attributes: Array<{
                id: number;
                option: string;
              }>;
            }>;
            selectedAttributes?: Record<number, string>;
          }) => {
            const lineItem: {
              product_id: number;
              quantity: number;
              name: string;
              total: string;
              variation_id?: number;
            } = {
              product_id: item.product_id,
              quantity: item.quantity,
              name: item.name || "Producto",
              total: (parseFloat(item.price || "0") * item.quantity).toFixed(2),
            };

            // Agregar variation_id si existe
            if (item.variations && item.selectedAttributes) {
              const match = item.variations.find(
                (v: {
                  id: number;
                  attributes: Array<{
                    id: number;
                    option: string;
                  }>;
                }) => {
                  return v.attributes.every(
                    (a: { id: number; option: string }) => {
                      const selected = item.selectedAttributes?.[a.id];
                      return selected && selected === a.option;
                    }
                  );
                }
              );
              if (match) {
                lineItem.variation_id = match.id;
              }
            }

            return lineItem;
          }
        );
      } else {
        // 🚨 PROBLEMA: No hay datos del carrito en el IPN
                                        
        // 🆕 SOLUCIÓN: Llamar al webhook para obtener los datos del checkout
        
        try {
          const webhookResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/izipay/webhook`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                kr_answer: kr_answer,
                kr_hash: kr_hash,
                amount: kr_amount,
                transaction_id: kr_transaction_id,
                status: kr_status,
                // 🆕 Incluir datos del checkout que se enviaron desde el frontend
                cartItems: body.cartItems || [],
                shippingInfo: body.shippingInfo || {},
                customerEmail: body.customerEmail || "",
                customerName: body.customerName || "",
              }),
            }
          );

          if (webhookResponse.ok) {
            const webhookResult = await webhookResponse.json();
            
            // 🆕 Usar los datos del webhook para crear la orden
            if (webhookResult.order_created || webhookResult.order_updated) {
                            return NextResponse.json({
                success: true,
                message: "Orden procesada por webhook",
                webhook_processed: true,
                transaction_id: kr_transaction_id,
                amount: kr_amount,
                status: kr_status,
              });
            }
          }
        } catch (webhookError) {
          console.error("❌ Error llamando al webhook:", webhookError);
        }

        // 🆕 Si el webhook falla, crear orden con datos genéricos
                lineItems = [
          {
            product_id: 1, // Producto por defecto
            quantity: 1,
            name: "Pago Izipay - Productos del carrito",
            total: kr_amount || "0.00",
          },
        ];
      }

      // 📍 Construir datos de facturación y envío
                        
      const billingShipping = {
        first_name: kr_customer_name?.split(" ")[0] || "Cliente",
        last_name: kr_customer_name?.split(" ").slice(1).join(" ") || "Izipay",
        email: kr_customer_email || "cliente@izipay.com",
        address_1: kr_shipping_info?.address || "",
        city: kr_shipping_info?.city || "",
        state: kr_shipping_info?.state || "",
        postcode: kr_shipping_info?.zipCode || "",
        country: "PE",
      };

      
      const newOrderData = {
        status: wcStatus,
        set_paid: wcStatus === "processing",
        payment_method: "izipay",
        payment_method_title: "Pago con Izipay",
        total: kr_amount || "0.00",
        billing: billingShipping,
        shipping: billingShipping,
        line_items: lineItems,
        meta_data: [
          {
            key: "_izipay_payment_id",
            value: kr_transaction_id || "unknown",
          },
          {
            key: "_izipay_transaction_status",
            value: kr_status || "unknown",
          },
          {
            key: "_izipay_customer_email",
            value: kr_customer_email || "unknown",
          },
          {
            key: "_izipay_ipn_received",
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
      transaction_id: kr_transaction_id,
      amount: kr_amount,
      status: kr_status,
      wc_status: wcStatus,
    });
  } catch (error) {
    console.error("💥 Error procesando IPN Mi Cuenta Web:", error);
    return NextResponse.json(
      {
        error: "Error procesando IPN",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
