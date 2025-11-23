"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, Calendar, Eye, AlertCircle, Package } from "lucide-react";
import { formatPrice } from "@/utils/formatPrice";

export default function OrdersList() {
  const router = useRouter();
  const { isAuthenticated, requireAuth } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const { orders, loading, error, loadOrders, clearOrders, clearError } =
    useOrdersStore();

  // 🔒 PROTECCIÓN DE AUTENTICACIÓN
  useEffect(() => {
    if (!requireAuth("/login")) {
      return; // El hook ya redirige
    }
  }, [requireAuth]);

  useEffect(() => {
    // Solo cargar órdenes si está autenticado y tiene profile
    if (isAuthenticated && profile?.id) {
      loadOrders(profile.id, profile.email);
    } else {
      clearOrders(); // Limpiar órdenes si no está autenticado
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profile?.id, profile?.email]);

  const handleViewOrder = (orderId: number) => {
    // Verificar autenticación antes de navegar
    if (!requireAuth("/login")) {
      return;
    }
    router.push(`/orders/${orderId}`);
  };

  // 🔒 REDIRECCIÓN SI NO ESTÁ AUTENTICADO
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">
            Debes iniciar sesión para ver tus órdenes
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
          <p className="text-gray-600">Cargando órdenes...</p>
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
              Error al cargar órdenes
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

  // Filtrar solo órdenes relevantes para mostrar al usuario
  const visibleOrders = orders.filter((order) =>
    ["processing", "completed", "on-hold"].includes(order.status)
  );

  if (visibleOrders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">No tienes órdenes aún</h2>
          <p className="text-gray-600">
            Cuando realices tu primera compra, aparecerá aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Mis Órdenes</h1>
      <div className="space-y-6">
        {visibleOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
              <div className="flex items-center gap-4 mb-4 lg:mb-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[#07D6AF] to-[#ED0AA2] rounded-full flex items-center justify-center">
                  <ShoppingBag size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Orden #{order.id}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(order.date_created).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">
                        {order.line_items.length}
                      </span>{" "}
                      producto(s)
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(order.total, order.currency)}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {order.status}
                  </p>
                </div>
                <button
                  className="flex items-center gap-2 text-gray-700 hover:text-[#07D6AF] font-medium"
                  onClick={() => handleViewOrder(order.id)}
                >
                  <Eye size={18} /> Ver Detalles
                </button>
              </div>
            </div>
            {/* Productos de la orden */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              {order.line_items.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-4">
                  No hay productos en esta orden.
                </div>
              ) : (
                order.line_items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.image?.src ? (
                        <img
                          src={item.image.src}
                          alt={item.image.alt || item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.name || "(Sin título)"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {order.line_items.length > 3 && (
              <div className="text-xs text-gray-500 mt-1">
                y {order.line_items.length - 3} producto(s) más...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
