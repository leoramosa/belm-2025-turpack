"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheck as Check } from "react-icons/fi";
import { useCartStore } from "@/store/useCartStore";
import { fetchOrderById } from "@/services/orders";
import type { IOrder } from "@/interface/IOrder";

// Función para formatear meta_data de productos
const formatProductMetaData = (
  metaData: Array<{ key: string; value: string | number | boolean }>
) => {
  if (!Array.isArray(metaData) || metaData.length === 0) return null;

  // Filtrar y formatear meta_data
  const formattedData = metaData
    .filter((meta) => {
      // Filtrar _reduced_stock y otros campos técnicos
      if (meta.key.toLowerCase().startsWith("_reduced")) return false;
      return true;
    })
    .map((meta) => {
      // Formatear nombres de claves amigables
      let displayKey = meta.key;
      if (meta.key.toLowerCase() === "pa_colores") {
        displayKey = "Color";
      }
      return { ...meta, displayKey, value: meta.value };
    });

  return formattedData;
};

export default function ThankYouPage({
  status,
  params,
}: {
  status?: string;
  params?: Record<string, string>;
}) {
  // console.log("ThankYouPage montado", { status, params });
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId =
    params?.order ||
    params?.external_reference ||
    searchParams.get("order") ||
    searchParams.get("external_reference");
  type OrderType = IOrder;
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const clearCart = useCartStore((s) => s.clearCart);
  const [cuentasBancarias, setCuentasBancarias] = useState<
    Record<string, unknown>[]
  >([]);

  // 🆕 Estados para mejoras de UX de transferencia bancaria
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 23, minutes: 59, seconds: 59 });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [cancelAttempted, setCancelAttempted] = useState(false);

  useEffect(() => {
    // Solo limpiar carrito si es success y hay orderId
    if (status === "success" && orderId && orderId !== "null") {
      clearCart();
    }
    // Si la orden es pending y el status es failure, cancelar la orden automáticamente (solo una vez)
    if (
      order &&
      status === "failure" &&
      order.status === "pending" &&
      !cancelAttempted
    ) {
      setCancelAttempted(true);
      fetch(`/api/cancel-order?id=${order.id}`, { method: "POST" });
    }
    // Si no hay orderId y es failure o pending, redirigir al carrito tras 3 segundos
    if (
      (status === "failure" || status === "pending") &&
      (!orderId || orderId === "null")
    ) {
      const timeout = setTimeout(() => {
        router.replace("/cart");
      }, 7000);
      return () => clearTimeout(timeout);
    }
    // Buscar la orden con máximo 2 reintentos y 1s de espera
    let retries = 0;
    async function fetchOrderWithRetry() {
      if (!orderId || orderId === "null") {
        setOrder(null);
        setLoading(false);
        return;
      }
      try {
        const numericOrderId = Number(orderId);
        if (!isNaN(numericOrderId)) {
          const data = await fetchOrderById(numericOrderId);
          setOrder(data as OrderType);
          setLoading(false);
          return;
        }
        throw new Error("orderId no es un número válido");
      } catch (error) {
        console.error("Error fetching order:", error);
        if (retries < 1) {
          retries++;
          setTimeout(fetchOrderWithRetry, 1000);
        } else {
          setOrder(null);
          setLoading(false);
        }
      }
    }
    // Buscar la orden si el status es success, failure o pending
    if (["success", "failure", "pending"].includes(status || "")) {
      fetchOrderWithRetry();
    } else {
      setLoading(false);
    }
  }, [orderId, status, router, order, cancelAttempted]); // Removido clearCart de dependencias

  useEffect(() => {
    const isTransferPeru = order?.payment_method === "transfer-peru";
    if (isTransferPeru) {
      fetch("/api/transfer-peru-accounts")
        .then((res) => res.json())
        .then((data) => setCuentasBancarias(Array.isArray(data) ? data : []));
    }
  }, [order?.payment_method]);

  // 🆕 useEffect para el timer de transferencia bancaria
  useEffect(() => {
    if (order?.payment_method === "transfer-peru" && order?.date_created) {
      calculateTimeRemaining();

      // Actualizar cada segundo
      const interval = setInterval(calculateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }
  }, [order?.payment_method, order?.date_created]);

  const handleContinueShopping = () => {
    router.push("/shop");
  };
  const handleBackToHome = () => {
    router.push("/");
  };

  // 🆕 FUNCIONES PARA MEJORAS DE UX DE TRANSFERENCIA BANCARIA

  // Función para copiar texto al portapapeles
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setShowCopyNotification(true);

      // Ocultar notificación después de 2 segundos
      setTimeout(() => {
        setShowCopyNotification(false);
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  // Función para generar mensaje de WhatsApp
  const generateWhatsAppMessage = () => {
    if (!order) return "";

    const orderNumber = order.id;
    const customerName =
      order.billing?.first_name && order.billing?.last_name
        ? `${order.billing.first_name} ${order.billing.last_name}`
        : "Cliente";
    const total = order.total;

    return (
      `Hola! He realizado la transferencia bancaria para mi pedido #${orderNumber}.\n\n` +
      `Datos del pedido:\n` +
      `- Número: #${orderNumber}\n` +
      `- Cliente: ${customerName}\n` +
      `- Total: S/. ${total}\n\n` +
      `Adjunto el voucher de pago.`
    );
  };

  // Función para abrir WhatsApp
  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const phoneNumber = "51913393134"; // Número sin + y sin espacios
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  // Función para calcular tiempo restante
  const calculateTimeRemaining = () => {
    if (!order?.date_created) return;

    const orderDate = new Date(order.date_created);
    const deadline = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000); // 24 horas después
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining({ hours, minutes, seconds });
  };

  // Función para obtener color del timer según tiempo restante
  const getTimerColor = () => {
    const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes;
    if (totalMinutes <= 60) return "text-red-600"; // Menos de 1 hora
    if (totalMinutes <= 180) return "text-orange-600"; // Menos de 3 horas
    return "text-green-600"; // Más de 3 horas
  };

  if (loading) {
    // console.log("Renderizando estado: loading", { status, orderId });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">
          Buscando tu orden, por favor espera...
        </div>
      </div>
    );
  }
  // Si no hay orden y no es success, mostrar mensaje y botón
  if (!order && status !== "success") {
    // console.log("Renderizando estado: !order && status !== success", {
    //   status,
    //   orderId,
    //   order,
    // });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-lg text-red-600 mb-4">
          No se encontró la orden o el pago fue cancelado.
          <br />
          Serás redirigido al carrito.
        </div>
        <button
          onClick={() => router.push("/cart")}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
        >
          Volver al carrito
        </button>
      </div>
    );
  }
  // Si la orden existe pero no está pagada, mostrar mensaje claro y opciones
  if (order && status !== "success") {
    // console.log("Renderizando estado: order && status !== success", {
    //   status,
    //   orderId,
    //   order,
    // });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-lg text-blue-900 mb-2 text-center font-semibold">
          Tu pago no fue completado o fue cancelado.
        </div>
        <div className="text-base text-yellow-800 mb-4 text-center">
          Estado de la orden: <b>{order.status}</b>.<br />
          Puedes intentar nuevamente o elegir otro método de pago.
        </div>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => router.push("/cart")}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
          >
            Volver al carrito
          </button>
          <button
            onClick={() => router.push("/shop")}
            className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-[#07D6AF] hover:text-[#07D6AF] transition-colors"
          >
            Seguir comprando
          </button>
        </div>
        {order.payment_url && (
          <button
            onClick={() => {
              if (order.payment_url) {
                window.location.href = order.payment_url;
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
          >
            Reintentar pago
          </button>
        )}
      </div>
    );
  }
  // Si la orden existe y está pagada (processing), mostrar el resumen como hasta ahora
  if (order && status === "success") {
    // console.log("Renderizando estado: order && status === success", {
    //   status,
    //   orderId,
    //   order,
    // });
    // Log completo de la orden para inspección
    // console.log("DETALLE COMPLETO DE LA ORDEN:", order);
    const isTransferPeru = order.payment_method === "transfer-peru";
    // Extraer detalles bancarios de meta_data si existen
    const bankDetails: { [key: string]: string } = {};
    if (isTransferPeru && Array.isArray(order.meta_data)) {
      order.meta_data.forEach((meta) => {
        if (
          typeof meta.key === "string" &&
          meta.key.startsWith("_transfer_peru_")
        ) {
          bankDetails[meta.key.replace("_transfer_peru_", "")] = String(
            meta.value
          );
        }
      });
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="pt-20 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white rounded-3xl p-12 shadow-lg">
              <div
                className={`w-20 h-20 ${
                  isTransferPeru ? "bg-yellow-100" : "bg-green-100"
                } rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                <Check
                  size={40}
                  className={
                    isTransferPeru ? "text-yellow-600" : "text-green-600"
                  }
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                ¡Pedido confirmado!
              </h1>
              {isTransferPeru && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Pago pendiente
                  </span>
                </div>
              )}
              <p className="text-gray-600 mb-6">
                {isTransferPeru
                  ? "Tu pedido ha sido registrado. Completa la transferencia bancaria para procesar tu compra."
                  : "Gracias por tu compra. Tu pedido ha sido registrado y será procesado pronto."}
              </p>
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <div className="text-sm text-gray-600 mb-2">
                  Número de orden
                </div>
                <div className="text-2xl font-bold gradient-text">
                  #{order.id}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Fecha: {new Date(order.date_created).toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold">S/. {order.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{order.billing.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dirección de envío</span>
                  <span className="font-medium text-right">
                    {order.shipping.address_1}
                    <br />
                    {order.shipping.city}, {order.shipping.state}{" "}
                    {order.shipping.postcode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos</span>
                  <span className="font-medium">
                    {order.line_items.length} item(s)
                  </span>
                </div>
              </div>
              {/* 📋 Instrucciones paso a paso - Solo para transferencia bancaria */}
              {isTransferPeru && (
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200 mb-6">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Instrucciones paso a paso
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        1
                      </div>
                      <p className="text-green-800 flex-1 text-left">
                        Realiza la transferencia bancaria con los datos de abajo
                      </p>
                    </div>
                    <div className="flex items-start gap-3 text-left">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        2
                      </div>
                      <p className="text-green-800 flex-1 text-left">
                        Toma una captura del voucher de pago
                      </p>
                    </div>
                    <div className="flex items-start gap-3 text-left">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        3
                      </div>
                      <p className="text-green-800 flex-1 text-justify">
                        Envía el voucher de pago al número de WhatsApp: +51
                        913-393-134, indicar el número de pedido (ID).
                      </p>
                    </div>
                    <div className="flex items-start gap-3 text-left">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        4
                      </div>
                      <p className="text-green-800 flex-1">
                        Tiene plazo de 1 día para enviar la información, de lo
                        contrario se cancelará el pedido
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mostrar detalles bancarios si es transferencia bancaria */}
              {isTransferPeru && (
                <div className="bg-yellow-50 rounded-2xl p-6 mb-8 text-left">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Detalles bancarios para transferencia
                  </h3>
                  {cuentasBancarias.length > 0
                    ? cuentasBancarias.map((cuenta, index) => (
                        <div key={index} className="">
                          <p>
                            <strong>Banco:</strong>{" "}
                            {String(cuenta.bank_name || "")}
                          </p>
                          <p>
                            <strong>Tipo de Cuenta:</strong>{" "}
                            {String(cuenta.account_type || "")}
                          </p>
                          <p>
                            <strong>Nombre de Cuenta:</strong>{" "}
                            {String(cuenta.account_name || "")}
                          </p>
                          <p className="flex items-center gap-2">
                            <strong>Número de Cuenta:</strong>{" "}
                            <span className="font-medium">
                              {String(cuenta.account_number || "")}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  String(cuenta.account_number || ""),
                                  "número de cuenta"
                                )
                              }
                              className="text-yellow-600 hover:text-yellow-800 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          </p>
                          <p className="flex items-center gap-2">
                            <strong>CCI:</strong>{" "}
                            <span className="font-medium">
                              {String(cuenta.account_number_cci || "")}
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  String(cuenta.account_number_cci || ""),
                                  "CCI"
                                )
                              }
                              className="text-yellow-600 hover:text-yellow-800 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          </p>
                        </div>
                      ))
                    : null}
                </div>
              )}

              {/* 🆕 MEJORADA: Sección de transferencia bancaria con mejor UX */}
              {isTransferPeru && (
                <div className="space-y-6 mb-8">
                  {/* ⏰ Contador regresivo */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900">
                        Tiempo restante para transferir
                      </h3>
                    </div>
                    <div
                      className={`text-3xl font-bold text-center ${getTimerColor()}`}
                    >
                      {timeRemaining.hours.toString().padStart(2, "0")}:
                      {timeRemaining.minutes.toString().padStart(2, "0")}:
                      {timeRemaining.seconds.toString().padStart(2, "0")}
                    </div>
                    <p className="text-sm text-blue-700 text-center mt-2">
                      Tienes 24 horas para completar la transferencia
                    </p>
                  </div>

                  {/* 📱 Botón de WhatsApp */}
                  <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      Enviar voucher por WhatsApp
                    </h3>
                    <p className="text-green-700 text-sm mb-4">
                      Después de realizar la transferencia, envía el voucher con
                      los datos de tu pedido
                    </p>
                    <button
                      onClick={openWhatsApp}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                      Abrir WhatsApp
                    </button>
                  </div>
                </div>
              )}
              {/* Resumen de productos */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Resumen del pedido
                </h3>
                <div className="space-y-3">
                  {order.line_items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <img
                        src={item.image?.src || "/logo-belm-v2.png"}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{item.name}</div>
                        {(() => {
                          const formattedMeta = formatProductMetaData(
                            item.meta_data || []
                          );
                          return formattedMeta && formattedMeta.length > 0 ? (
                            <div className="text-xs text-gray-600 space-x-2">
                              {formattedMeta.map((meta, i) => (
                                <span key={meta.key}>
                                  {meta.displayKey}: {meta.value}
                                  {i < formattedMeta.length - 1 && " • "}
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">
                          Cant: {item.quantity}
                        </span>
                        <div className="font-medium">S/. {item.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ¿Qué sigue?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Recibirás un email de confirmación en breve</li>
                  <li>
                    • Te enviaremos información de seguimiento cuando tu pedido
                    sea despachado
                  </li>
                  <li>• Entrega estimada: 3-7 días hábiles</li>
                  <li>• ¿Dudas? Contáctanos en hola@belm.pe</li>
                </ul>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleContinueShopping}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
                >
                  Seguir comprando
                </button>
                <button
                  onClick={handleBackToHome}
                  className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">No se encontró la orden.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-lg">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Pedido confirmado!
            </h1>
            <p className="text-gray-600 mb-6">
              Gracias por tu compra. Tu pedido ha sido registrado y será
              procesado pronto.
            </p>
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <div className="text-sm text-gray-600 mb-2">Número de orden</div>
              <div className="text-2xl font-bold gradient-text">
                #{order.id}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Fecha: {new Date(order.date_created).toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-bold">S/. {order.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span className="font-medium">{order.billing.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dirección de envío</span>
                <span className="font-medium text-right">
                  {order.shipping.address_1}
                  <br />
                  {order.shipping.city}, {order.shipping.state}{" "}
                  {order.shipping.postcode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Productos</span>
                <span className="font-medium">
                  {order.line_items.length} item(s)
                </span>
              </div>
            </div>
            {/* Resumen de productos */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">
                Resumen del pedido
              </h3>
              <div className="space-y-3">
                {order.line_items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <img
                      src={item.image?.src || "/logo-belm-v2.png"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.name}</div>
                      {(() => {
                        const formattedMeta = formatProductMetaData(
                          item.meta_data || []
                        );
                        return formattedMeta && formattedMeta.length > 0 ? (
                          <div className="text-xs text-gray-600 space-x-2">
                            {formattedMeta.map((meta, i) => (
                              <span key={meta.key}>
                                {meta.displayKey}: {meta.value}
                                {i < formattedMeta.length - 1 && " • "}
                              </span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">
                        Cant: {item.quantity}
                      </span>
                      <div className="font-medium">S/. {item.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">¿Qué sigue?</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Recibirás un email de confirmación en breve</li>
                <li>
                  • Te enviaremos información de seguimiento cuando tu pedido
                  sea despachado
                </li>
                <li>• Entrega estimada: 5-7 días hábiles</li>
                <li>• ¿Dudas? Contáctanos en soporte@tutienda.com</li>
              </ul>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleContinueShopping}
                className="w-full py-4 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
              >
                Seguir comprando
              </button>
              <button
                onClick={handleBackToHome}
                className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-[#07D6AF] hover:text-[#07D6AF] transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🆕 Notificación de copiado */}
      {showCopyNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>¡{copiedField} copiado al portapapeles!</span>
        </div>
      )}
    </div>
  );
}
