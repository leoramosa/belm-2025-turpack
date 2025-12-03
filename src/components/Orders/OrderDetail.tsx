"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/userStore";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { extractBaseProductName } from "@/utils/productName";
import { extractAttributes as extractAttributesUtil } from "@/utils/orderAttributes";
import {
  ShoppingBag,
  Calendar,
  AlertCircle,
  ArrowLeft,
  MapPin,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
  Package,
  /* Download, */
  Phone,
  Mail,
  MessageCircle,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

function formatPrice(value: number | string | null, currency: string): string {
  if (value === null || value === undefined) return "S/ 0.00";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "S/ 0.00";
  if (!currency) return `S/ ${numValue.toFixed(2)}`;
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(numValue);
  } catch {
    return `S/ ${numValue.toFixed(2)}`;
  }
}

// Usar función utilitaria para extraer atributos
const extractAttributes = extractAttributesUtil;

interface OrderDetailProps {
  orderId: string | number;
}

const statusMap: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Completado",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: <CheckCircle size={16} className="text-green-500 mr-1" />,
  },
  processing: {
    label: "Procesando",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: <Clock size={16} className="text-blue-500 mr-1" />,
  },
  pending: {
    label: "Pendiente",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    icon: <Clock size={16} className="text-orange-500 mr-1" />,
  },
  "on-hold": {
    label: "En Espera",
    color: "bg-yellow-100 text-yellow-600 border-yellow-600",
    icon: <Clock size={16} className="text-yellow-600 mr-1" />,
  },
  refunded: {
    label: "Reembolsado",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: <RefreshCcw size={16} className="text-blue-500 mr-1" />,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: <XCircle size={16} className="text-red-500 mr-1" />,
  },
  failed: {
    label: "Fallido",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: <XCircle size={16} className="text-red-500 mr-1" />,
  },
  shipped: {
    label: "Enviado",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    icon: <Package size={16} className="text-purple-500 mr-1" />,
  },
  delivered: {
    label: "Entregado",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: <CheckCircle size={16} className="text-green-500 mr-1" />,
  },
};

// Función helper para obtener el estado traducido
const getStatusLabel = (status: string): string => {
  return statusMap[status]?.label || status;
};

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const { isAuthenticated, requireAuth } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const { currentOrder, loading, error, loadOrderById, clearError } =
    useOrdersStore();
  const { addToCart } = useCartStore();
  const { openCart } = useUIStore();

  // Estado para verificar si el store está hidratado
  const [isHydrated, setIsHydrated] = useState(false);

  // Esperar a que el store se hidrate antes de verificar autenticación
  useEffect(() => {
    // Pequeño delay para permitir que Zustand persist se hidrate
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 🔒 PROTECCIÓN DE AUTENTICACIÓN (solo después de hidratación)
  useEffect(() => {
    if (!isHydrated) return; // Esperar a que el store se hidrate

    if (!isAuthenticated) {
      // Solo redirigir si realmente no está autenticado después de la hidratación
      router.push("/login");
      return;
    }
  }, [isAuthenticated, isHydrated, router]);

  useEffect(() => {
    // Solo cargar orden si está autenticado, tiene profile y el store está hidratado
    if (isHydrated && isAuthenticated && orderId && profile) {
      loadOrderById(Number(orderId), profile.id, profile.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, isAuthenticated, orderId, profile]);

  const handleBack = () => {
    if (!requireAuth("/login")) {
      return;
    }
    router.push("/orders");
  };

  // 🔒 VERIFICAR QUE LA ORDEN PERTENEZCA AL USUARIO
  useEffect(() => {
    if (currentOrder && profile) {
      const orderCustomerId = currentOrder.customer_id;
      const orderEmail = currentOrder.billing?.email;

      const isOwner =
        orderCustomerId === profile.id || orderEmail === profile.email;

      if (!isOwner) {
        router.push("/orders");
        return;
      }
    }
  }, [currentOrder, profile, router]);

  // Función para convertir atributos a selectedAttributes (formato del carrito)
  // También crea un array de atributos para mostrar en el carrito
  const convertAttributesToSelectedAttributes = (
    item: any
  ): {
    selectedAttributes: { [key: number]: string };
    attributesForDisplay: Array<{
      id: number;
      name: string;
      options: string[];
    }>;
  } => {
    const extractedAttrs = extractAttributes(item);
    const selectedAttributes: { [key: number]: string } = {};
    const attributesForDisplay: Array<{
      id: number;
      name: string;
      options: string[];
    }> = [];

    // Crear atributos con IDs generados y estructura para el carrito
    extractedAttrs.forEach((attr, index) => {
      // Generar un ID único basado en el nombre del atributo
      const attrId = Math.abs(
        attr.name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0) +
          index * 1000
      );

      selectedAttributes[attrId] = attr.value;

      // Crear estructura de atributo para que el CartDrawer pueda mostrarlo
      attributesForDisplay.push({
        id: attrId,
        name: attr.name,
        options: [attr.value],
      });
    });

    return { selectedAttributes, attributesForDisplay };
  };

  const handleBuyAgain = async () => {
    if (!currentOrder) return;

    try {
      let addedCount = 0;
      let failedCount = 0;

      for (const item of currentOrder.line_items) {
        try {
          // Extraer nombre base del producto (sin variaciones)
          const baseName = extractBaseProductName(item.name);

          // Calcular precio unitario correcto
          // En WooCommerce, item.subtotal es el precio total (precio unitario × cantidad)
          // item.price puede ser el precio unitario, pero es más confiable calcular desde subtotal
          const unitPrice =
            item.subtotal && item.quantity > 0
              ? parseFloat(item.subtotal) / item.quantity
              : item.price
              ? parseFloat(item.price)
              : 0;

          // Extraer atributos y convertirlos al formato del carrito
          const { selectedAttributes, attributesForDisplay } =
            convertAttributesToSelectedAttributes(item);

          const productData: any = {
            id: item.product_id,
            name: baseName, // Nombre base sin variaciones
            slug: baseName.toLowerCase().replace(/\s+/g, "-"),
            type: item.variation_id > 0 ? "variable" : "simple",
            description: "",
            shortDescription: "",
            stockStatus: "instock",
            pricing: {
              price: unitPrice,
              regularPrice: unitPrice,
              salePrice: null,
              currency: currentOrder.currency || "PEN",
            },
            images: item.image
              ? [
                  {
                    id: 0,
                    alt: item.image.alt || baseName,
                    src: item.image.src,
                  },
                ]
              : [],
            categories: [],
            attributes: attributesForDisplay, // Atributos para que el CartDrawer los muestre
            variations: [],
          };

          // Agregar el producto con la cantidad correcta
          // Agregar uno por uno para que el store maneje correctamente la cantidad
          for (let i = 0; i < item.quantity; i++) {
            addToCart(productData, selectedAttributes);
          }
          addedCount += item.quantity;
        } catch (error) {
          console.error(`Error agregando producto ${item.name}:`, error);
          failedCount += item.quantity;
        }
      }

      if (addedCount > 0) {
        toast.success(
          `${addedCount} producto${addedCount > 1 ? "s" : ""} agregado${
            addedCount > 1 ? "s" : ""
          } al carrito`,
          {
            description:
              failedCount > 0
                ? `${failedCount} producto(s) no se pudieron agregar`
                : undefined,
          }
        );
        // Abrir el CartDrawer automáticamente
        openCart();
      } else {
        toast.error("No se pudieron agregar los productos al carrito");
      }
    } catch (error) {
      console.error("Error en handleBuyAgain:", error);
      toast.error("Error al agregar productos al carrito");
    }
  };

  // Mostrar loading mientras se hidrata el store
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // 🔒 REDIRECCIÓN SI NO ESTÁ AUTENTICADO (solo después de hidratación)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">
            Debes iniciar sesión para ver los detalles de la orden
          </h2>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-6 py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Error al cargar el pedido
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={clearError}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">No se encontró el pedido</h2>
        </div>
      </div>
    );
  }

  const order = currentOrder;
  const status = statusMap[order.status] || {
    label: order.status,
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: <AlertCircle size={16} className="text-gray-400 mr-1" />,
  };

  // Calcular fecha estimada de entrega (7 días después de la fecha de creación)
  const estimatedDeliveryDate = new Date(order.date_created);
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

  // Timeline de estados del pedido basado en estados reales de WooCommerce
  const getOrderTimeline = () => {
    // Fechas disponibles del backend
    const dateCreated = new Date(order.date_created);
    const datePaid = order.date_paid ? new Date(order.date_paid) : null;
    const dateCompleted = order.date_completed
      ? new Date(order.date_completed)
      : null;

    // Buscar fecha de envío en meta_data
    const shippingDateMeta = order.meta_data?.find(
      (m: any) =>
        m.key === "shipping_date" ||
        m.key === "date_shipped" ||
        m.key === "_date_shipped"
    );
    const dateShipped = shippingDateMeta
      ? new Date(shippingDateMeta.value as string)
      : null;

    // Determinar estados basados en el status de WooCommerce
    // Estados: pending, failed, processing, on-hold, completed, cancelled, refunded, shipped, delivered

    // Lógica del timeline según el flujo real:
    // 1. on-hold (pago por transferencia): Pedido creado → Pendiente de pago
    // 2. processing (pago confirmado): Pedido confirmado
    // 3. completed: Pedido preparado y enviado

    const isOnHold = order.status === "on-hold";
    const isProcessing = order.status === "processing";
    const isCompleted = order.status === "completed";
    const isShipped = order.status === "shipped";
    const isDelivered = order.status === "delivered";

    // Si está en "on-hold", mostrar timeline completo con pago pendiente
    if (isOnHold) {
      return [
        {
          step: 1,
          label: "Pedido creado",
          description: "Tu pedido ha sido registrado exitosamente",
          date: dateCreated,
          completed: true,
          icon: <CheckCircle size={20} className="text-green-500" />,
        },
        {
          step: 2,
          label: "Pendiente de pago",
          description: "Esperando confirmación del pago por transferencia",
          date: null,
          completed: false,
          icon: <Clock size={20} className="text-orange-500" />,
        },
        {
          step: 3,
          label: "Pedido confirmado",
          description: "Tu pedido está siendo preparado",
          date: null,
          completed: false,
          icon: <Clock size={20} className="text-gray-400" />,
        },
        {
          step: 4,
          label: "Pedido preparado y enviado",
          description: "Tu pedido ha sido preparado y enviado",
          date: null,
          completed: false,
          icon: <Clock size={20} className="text-gray-400" />,
        },
      ];
    }

    // Si está en "processing", mostrar timeline completo con preparación en curso
    if (isProcessing) {
      return [
        {
          step: 1,
          label: "Pedido creado",
          description: "Tu pedido ha sido registrado exitosamente",
          date: dateCreated,
          completed: true,
          icon: <CheckCircle size={20} className="text-green-500" />,
        },
        {
          step: 2,
          label: "Pendiente de pago",
          description: "Pago confirmado y verificado",
          date: datePaid || dateCreated,
          completed: true,
          icon: <CheckCircle size={20} className="text-green-500" />,
        },
        {
          step: 3,
          label: "Pedido confirmado",
          description: "Tu pedido está siendo preparado",
          date: datePaid || dateCreated,
          completed: true,
          icon: <CheckCircle size={20} className="text-green-500" />,
        },
        {
          step: 4,
          label: "Pedido preparado y enviado",
          description: "Tu pedido ha sido preparado y enviado",
          date: null,
          completed: false,
          icon: <Clock size={20} className="text-gray-400" />,
        },
      ];
    }

    // Si está en "completed", mostrar preparado y enviado
    if (isCompleted) {
      return [
        {
          step: 1,
          label: "Pedido creado",
          description: "Tu pedido ha sido registrado exitosamente",
          date: dateCreated,
          completed: true,
          icon: <CheckCircle size={20} className="text-green-500" />,
        },
        {
          step: 2,
          label: "Pendiente de pago",
          description: "Pago confirmado y verificado",
          date: datePaid || dateCreated,
          completed: true,
          icon: <CheckCircle size={20} className="text-green-500" />,
        },
        {
          step: 3,
          label: "Pedido confirmado",
          description: "Tu pedido está siendo preparado",
          date: datePaid || dateCreated,
          completed: true,
          icon: <CheckCircle size={20} className="text-green-500" />,
        },
        {
          step: 4,
          label: "Pedido preparado y enviado",
          description: "Tu pedido ha sido preparado y enviado",
          date: dateCompleted || dateShipped || datePaid || dateCreated,
          completed: true,
          icon: <Package size={20} className="text-blue-500" />,
        },
      ];
    }

    // Para otros estados (shipped, delivered, etc.)
    const isConfirmed =
      datePaid !== null ||
      ["processing", "shipped", "delivered", "completed"].includes(
        order.status
      );

    const timeline = [
      {
        step: 1,
        label: "Pedido creado",
        description: "Tu pedido ha sido registrado exitosamente",
        date: dateCreated,
        completed: true,
        icon: <CheckCircle size={20} className="text-green-500" />,
      },
      {
        step: 2,
        label: "Pedido confirmado",
        description: isConfirmed
          ? "Tu pedido está siendo preparado"
          : "Esperando confirmación del pago",
        date: datePaid || dateCreated,
        completed: isConfirmed,
        icon: isConfirmed ? (
          <CheckCircle size={20} className="text-green-500" />
        ) : (
          <Clock size={20} className="text-orange-500" />
        ),
      },
      ...(isShipped || isDelivered
        ? [
            {
              step: 3,
              label: "Pedido enviado",
              description: "Tu pedido está en camino",
              date: dateShipped || datePaid || dateCreated,
              completed: true,
              icon: <Truck size={20} className="text-purple-500" />,
            },
          ]
        : []),
      ...(isDelivered
        ? [
            {
              step: 4,
              label: "Pedido entregado",
              description: "Tu pedido ha sido entregado exitosamente",
              date: dateCompleted || dateShipped || datePaid || dateCreated,
              completed: true,
              icon: <CheckCircle size={20} className="text-green-500" />,
            },
          ]
        : []),
    ];
    return timeline;
  };

  const timeline = getOrderTimeline();

  // Calcular subtotal
  const calculatedSubtotal = order.line_items.reduce((sum, item) => {
    const itemSubtotal = parseFloat(item.subtotal || item.total || "0");
    return sum + itemSubtotal;
  }, 0);
  const displaySubtotal =
    parseFloat(order.subtotal || "0") > 0
      ? parseFloat(order.subtotal || "0")
      : calculatedSubtotal;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Botón volver */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Volver a mis pedidos
        </button>

        {/* Header del pedido */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">
                <span className="">Pedido</span>{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  #{order.id}
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  {new Date(order.date_created).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {order.meta_data?.find(
                  (m: any) => m.key === "tracking_number"
                ) && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Tracking:</span>
                    <span>
                      {
                        order.meta_data.find(
                          (m: any) => m.key === "tracking_number"
                        )?.value
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${status.color}`}
              >
                {status.icon}
                {status.label}
              </span>
              {/* <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download size={18} className="text-gray-600" />
              </button> */}
            </div>
          </div>
        </div>

        {/* Banner de estado dinámico */}
        {(() => {
          if (order.status === "on-hold") {
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6">
                <p className="text-orange-900 font-medium mb-2">
                  Estamos esperando el pago para proceder con tu pedido
                </p>
                <p className="text-orange-700 text-sm">
                  Una vez confirmado el pago, comenzaremos a preparar tu pedido
                  inmediatamente.
                </p>
              </div>
            );
          }

          if (order.status === "processing") {
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <p className="text-blue-900 font-medium mb-2">
                  Tu pedido fue procesado y confirmado
                </p>
                <p className="text-blue-700 text-sm">
                  Ahora lo estamos preparando para que pronto lo tengas en tus
                  manos.
                </p>
                <p className="text-blue-600 text-xs mt-2">
                  Entrega estimada:{" "}
                  {estimatedDeliveryDate.toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            );
          }

          if (order.status === "completed") {
            return (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                <p className="text-green-900 font-medium mb-2">
                  Tu pedido pronto llegará a tus manos
                </p>
                <p className="text-green-700 text-sm">
                  Tu pedido ha sido preparado y enviado exitosamente.
                </p>
              </div>
            );
          }

          return null;
        })()}

        {/* Layout principal: dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Columna izquierda: Estado del Pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline de estado */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Estado del Pedido
              </h2>
              <div className="space-y-6">
                {timeline.map((step, index) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          step.completed
                            ? "bg-green-100 border-green-500"
                            : "bg-gray-100 border-gray-300"
                        }`}
                      >
                        {step.completed ? (
                          step.icon
                        ) : (
                          <span className="text-gray-400 font-semibold">
                            {step.step}
                          </span>
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-12 mt-2 ${
                            step.completed ? "bg-green-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <span
                            className={`font-semibold block ${
                              step.completed ? "text-gray-900" : "text-gray-500"
                            }`}
                          >
                            {step.label}
                          </span>
                          {step.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {step.description}
                            </p>
                          )}
                        </div>
                        {step.date && (
                          <div className="text-right ml-4 flex-shrink-0">
                            <span className="text-sm font-medium text-gray-900 block">
                              {step.date.toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {step.date.toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      {!step.completed && (
                        <span className="text-sm text-gray-500">Pendiente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Productos ({order.line_items.length})
              </h2>
              <div className="space-y-4">
                {order.line_items.map((item) => {
                  const attributes = extractAttributes(item);
                  // Precio total del item (precio unitario * cantidad)
                  // item.subtotal ya incluye la cantidad, si no existe, calcular: precio * cantidad
                  const itemTotalPrice = item.subtotal
                    ? parseFloat(item.subtotal)
                    : parseFloat(item.price || "0") * item.quantity;

                  // Precio unitario para mostrar debajo si es necesario
                  const itemUnitPrice = item.price
                    ? parseFloat(item.price)
                    : item.subtotal
                    ? parseFloat(item.subtotal) / item.quantity
                    : 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image?.src ? (
                          <Image
                            src={item.image.src}
                            alt={item.image.alt || item.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Package size={32} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {extractBaseProductName(item.name)}
                        </h3>
                        {attributes.map((attr, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            {attr.name}: {attr.value}
                          </p>
                        ))}
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatPrice(itemUnitPrice, order.currency)} c/u
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-semibold text-gray-900">
                          {formatPrice(itemTotalPrice, order.currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dirección de Envío */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <MapPin size={24} className="text-primary" />
                <h2 className="text-xl font-bold text-gray-900">
                  Dirección de Envío
                </h2>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="font-medium text-gray-900">
                  {order.shipping.first_name} {order.shipping.last_name}
                </p>
                <p>{order.shipping.address_1}</p>
                {order.shipping.address_2 && <p>{order.shipping.address_2}</p>}
                <p>
                  {order.shipping.city}, {order.shipping.state}{" "}
                  {order.shipping.postcode}
                </p>
                {order.billing.phone && (
                  <div className="flex items-center gap-1 mt-2">
                    <Phone size={14} className="text-gray-400" />
                    <span>{order.billing.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: Resumen y Método de Pago */}
          <div className="space-y-6">
            {/* Resumen del Pedido */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Resumen del Pedido
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(displaySubtotal, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío:</span>
                  <span
                    className={`font-medium ${
                      parseFloat(order.shipping_total || "0") === 0
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {parseFloat(order.shipping_total || "0") === 0
                      ? "Gratis"
                      : formatPrice(order.shipping_total, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos:</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(order.total_tax, order.currency)}
                  </span>
                </div>
                {parseFloat(order.discount_total || "0") > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuentos:</span>
                    <span className="font-medium text-red-600">
                      -{formatPrice(order.discount_total, order.currency)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(order.total, order.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Método de Pago
              </h2>
              <div className="flex items-center gap-3">
                <CreditCard size={24} className="text-primary" />
                <div>
                  <p className="font-medium text-gray-900">
                    {order.payment_method_title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.payment_method === "izipay" && "•••• •••• •••• 4242"}
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={handleBuyAgain}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:scale-105 transition-all duration-200"
              >
                <RefreshCcw size={18} />
                Volver a Comprar
              </button>
              <button
                onClick={() => router.push("/contact")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                <MessageCircle size={18} />
                Contactar Soporte
              </button>
            </div>

            {/* Sección de ayuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Nuestro equipo de soporte está disponible 24/7
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={16} className="text-gray-500" />
                  <span>hola@belm.pe</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={16} className="text-gray-500" />
                  <span>+51 913 393 134</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
