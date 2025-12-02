"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/userStore";
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
} from "lucide-react";

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
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: <Clock size={16} className="text-yellow-500 mr-1" />,
  },
  pending: {
    label: "Pendiente",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    icon: <Clock size={16} className="text-orange-500 mr-1" />,
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
};

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter();
  const { isAuthenticated, requireAuth } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const { currentOrder, loading, error, loadOrderById, clearError } =
    useOrdersStore();

  // 🔒 PROTECCIÓN DE AUTENTICACIÓN
  useEffect(() => {
    if (!requireAuth("/login")) {
      return; // El hook ya redirige
    }
  }, [requireAuth]);

  useEffect(() => {
    // Solo cargar orden si está autenticado y tiene profile
    if (isAuthenticated && orderId && profile) {
      loadOrderById(Number(orderId), profile.id, profile.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, orderId, profile]);

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

      // Verificar que la orden pertenezca al usuario actual
      const isOwner =
        orderCustomerId === profile.id || orderEmail === profile.email;

      if (!isOwner) {
        // 🔒 ACCESO NO AUTORIZADO - Redirigir
        router.push("/orders");
        return;
      }
    }
  }, [currentOrder, profile, router]);

  // 🔒 REDIRECCIÓN SI NO ESTÁ AUTENTICADO
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#07D6AF] mx-auto mb-4"></div>
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
              className="px-6 py-3 bg-gradient-to-r from-[#07D6AF] to-[#ED0AA2] text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
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

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-[#07D6AF] mb-4 transition-colors"
      >
        <ArrowLeft size={20} /> Volver a mis pedidos
      </button>
      <div className="bg-white rounded-3xl p-6 shadow-lg mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="w-16 h-16 bg-gradient-to-r from-[#07D6AF] to-[#ED0AA2] rounded-full flex items-center justify-center">
              <ShoppingBag size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pedido #{order.id}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
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
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${status.color}`}
                  title={status.label}
                >
                  {status.icon}
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatPrice(order.total, order.currency)}
            </div>
            <div className="mt-2 flex items-center justify-end">
              <CreditCard size={16} className="mr-1 text-[#07D6AF]" />
              <span className="text-sm text-gray-600">
                {order.payment_method_title}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Productos */}
      <div className="bg-white rounded-3xl p-6 shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-6">Productos</h2>
        <div className="space-y-4">
          {order.line_items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 border-b border-gray-100 pb-4"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.image?.src ? (
                  <img
                    src={item.image.src}
                    alt={item.image.alt || item.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Package size={40} className="text-gray-300 mx-auto my-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {item.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Cantidad: {item.quantity}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Subtotal: {formatPrice(item.subtotal, order.currency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Dirección de envío */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <MapPin size={24} className="text-[#07D6AF]" />
            <h3 className="text-lg font-semibold text-gray-900">
              Dirección de Envío
            </h3>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              {order.shipping.first_name} {order.shipping.last_name}
            </p>
            <p>
              {order.shipping.address_1} {order.shipping.address_2}
            </p>
            <p>
              {order.shipping.city}, {order.shipping.state},{" "}
              {order.shipping.postcode}
            </p>
            <p>{order.shipping.country}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <MapPin size={24} className="text-[#ED0AA2]" />
            <h3 className="text-lg font-semibold text-gray-900">
              Dirección de Facturación
            </h3>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              {order.billing.first_name} {order.billing.last_name}
            </p>
            <p>
              {order.billing.address_1} {order.billing.address_2}
            </p>
            <p>
              {order.billing.city}, {order.billing.state},{" "}
              {order.billing.postcode}
            </p>
            <p>{order.billing.country}</p>
            <p>Email: {order.billing.email}</p>
            <p>Tel: {order.billing.phone}</p>
          </div>
        </div>
      </div>
      {/* Resumen */}
      <div className="bg-white rounded-3xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Resumen</h2>
        {/* 🆕 Calcular subtotal desde line_items si order.subtotal es 0 o no está disponible */}
        {(() => {
          const calculatedSubtotal = order.line_items.reduce((sum, item) => {
            const itemSubtotal = parseFloat(item.subtotal || item.total || "0");
            return sum + itemSubtotal;
          }, 0);

          // Usar el subtotal calculado si order.subtotal es 0 o inválido
          const displaySubtotal =
            parseFloat(order.subtotal || "0") > 0
              ? parseFloat(order.subtotal || "0")
              : calculatedSubtotal;

          return (
            <div className="flex justify-between text-gray-700">
              <span>Subtotal de artículos</span>
              <span>{formatPrice(displaySubtotal, order.currency)}</span>
            </div>
          );
        })()}
        <div className="flex justify-between text-gray-700">
          <span>Envío</span>
          <span>{formatPrice(order.shipping_total, order.currency)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Impuestos</span>
          <span>{formatPrice(order.total_tax, order.currency)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Descuentos</span>
          <span>-{formatPrice(order.discount_total, order.currency)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 text-lg mt-2">
          <span>Total del pedido</span>
          <span>{formatPrice(order.total, order.currency)}</span>
        </div>
        {order.customer_note && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-gray-700">
            <span className="font-semibold">Nota del pedido:</span>{" "}
            {order.customer_note}
          </div>
        )}
      </div>
    </div>
  );
}
