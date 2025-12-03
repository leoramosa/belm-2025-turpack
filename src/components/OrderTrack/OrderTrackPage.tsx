"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useAuth } from "@/hooks/useAuth";

import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
  User,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
} from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  subtotal: string;
  image?: {
    src: string;
    alt?: string;
  };
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

export default function OrderTrackPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { currentOrder, loading, error, loadOrderById, clearError } =
    useOrdersStore();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Redirigir a /orders si el usuario está autenticado
  useEffect(() => {
    // Pequeño delay para verificar autenticación
    const checkAuth = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsCheckingAuth(false);
      if (isAuthenticated) {
        router.replace("/orders");
      }
    };
    checkAuth();
  }, [isAuthenticated, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (isCheckingAuth || isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      return;
    }

    setIsSearching(true);
    clearError();

    try {
      // Buscar orden por ID y validar que el email coincida
      await loadOrderById(Number(orderId), undefined, email);
    } catch (error) {
      console.error("Error buscando orden:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateAccount = () => {
    router.push(`/register?email=${encodeURIComponent(email)}`);
  };

  const handleLogin = () => {
    router.push(`/login?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Seguimiento de Pedidos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Rastrea el estado de tus pedidos ingresando tu número de orden y
            correo electrónico
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Formulario de seguimiento */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Buscar Pedido</h2>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Número de pedido
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Ej: 12345"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white rounded-2xl font-semibold hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-2"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    Buscar pedido
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
                {error}
              </div>
            )}

            {/* Resultado del pedido */}
            {currentOrder && !loading && !error && (
              <div className="mt-8 bg-linear-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Pedido Encontrado
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estado:</span>
                    {(() => {
                      const status = statusMap[currentOrder.status] || {
                        label: currentOrder.status,
                        color: "bg-gray-100 text-gray-700 border-gray-300",
                        icon: (
                          <Clock size={16} className="text-gray-500 mr-1" />
                        ),
                      };
                      return (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${status.color}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-semibold">
                      {new Date(currentOrder.date_created).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold text-lg">
                      {formatPrice(currentOrder.total, currentOrder.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-semibold">
                      {currentOrder.line_items?.length}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleCreateAccount}
                    className="w-full py-3 bg-linear-to-br from-primary to-secondary text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Crear cuenta con este correo
                  </button>
                  <button
                    onClick={handleLogin}
                    className="w-full py-3 bg-white border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Iniciar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sección de beneficios */}
          <div className="space-y-6">
            {/* Tarjeta de beneficios */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold">
                  ¿Por qué crear una cuenta?
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg mt-1">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Historial completo de pedidos
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Accede a todos tus pedidos anteriores y su estado actual
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg mt-1">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Seguimiento en tiempo real
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Recibe notificaciones automáticas sobre el estado de tus
                      pedidos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg mt-1">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Acceso seguro y privado
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Tus datos están protegidos y solo tú puedes ver tu
                      información
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-linear-to-br-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20">
                <h3 className="font-semibold text-gray-900 mb-2">
                  ¿Ya tienes una cuenta?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Inicia sesión para acceder a tu historial completo de pedidos
                  y recibir actualizaciones automáticas.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Iniciar sesión
                </button>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Información importante
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    El número de pedido se encuentra en el correo de
                    confirmación
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    Usa el mismo correo con el que realizaste la compra
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    Crear una cuenta te dará acceso completo a tu historial
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resultado detallado de búsqueda */}
        {currentOrder && !loading && !error && (
          <div className="mt-8 bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
              <div className="flex items-center gap-4 mb-4 lg:mb-0">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-[#ED0AA2] rounded-full flex items-center justify-center">
                  <Package size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Pedido #{currentOrder.id}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(currentOrder.date_created).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                        statusMap[currentOrder.status]?.color ||
                        "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {statusMap[currentOrder.status]?.icon}
                      {statusMap[currentOrder.status]?.label ||
                        currentOrder.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatPrice(currentOrder.total, currentOrder.currency)}
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <CreditCard size={16} className="mr-1 text-primary" />
                  <span className="text-sm text-gray-600">
                    {currentOrder.payment_method_title}
                  </span>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-xl font-bold mb-4">Productos</h3>
              <div className="space-y-4">
                {currentOrder.line_items?.map((item: OrderItem) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-b border-gray-100 pb-4"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.image?.src ? (
                        <img
                          src={item.image.src}
                          alt={item.image.alt || item.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package size={32} className="text-gray-300" />
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
                        Subtotal:{" "}
                        {formatPrice(item.subtotal, currentOrder.currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Información de envío */}
            {currentOrder.shipping && (
              <div className=" border-gray-100 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin size={24} className="text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dirección de Envío
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    {currentOrder.shipping.first_name}{" "}
                    {currentOrder.shipping.last_name}
                  </p>
                  <p>
                    {currentOrder.shipping.address_1}{" "}
                    {currentOrder.shipping.address_2}
                  </p>
                  <p>
                    {currentOrder.shipping.city}, {currentOrder.shipping.state},{" "}
                    {currentOrder.shipping.postcode}
                  </p>
                  <p>{currentOrder.shipping.country}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
