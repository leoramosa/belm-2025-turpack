"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/useCartStore";
import { extractBaseProductName } from "@/utils/productName";
import { extractAttributes as extractAttributesUtil } from "@/utils/orderAttributes";
import type { IOrder, IOrderItem } from "@/interface/IOrder";
import type { IProduct } from "@/types/product";
import {
  ShoppingBag,
  Calendar,
  Eye,
  AlertCircle,
  Package,
  RefreshCcw,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

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

// Usar función utilitaria para extraer atributos
const extractAttributes = extractAttributesUtil;

export default function OrdersList() {
  const router = useRouter();
  const { isAuthenticated, requireAuth } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const { orders, loading, error, loadOrders, clearOrders, clearError } =
    useOrdersStore();
  const { addToCart } = useCartStore();

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
    // Solo cargar órdenes si está autenticado, tiene profile y el store está hidratado
    if (isHydrated && isAuthenticated && profile?.id) {
      loadOrders(profile.id, profile.email);
    } else if (isHydrated && !isAuthenticated) {
      clearOrders(); // Limpiar órdenes si no está autenticado
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, isAuthenticated, profile?.id, profile?.email]);

  const handleViewOrder = (orderId: number) => {
    // Verificar autenticación antes de navegar
    if (!requireAuth("/login")) {
      return;
    }
    router.push(`/orders/${orderId}`);
  };

  const handleBuyAgain = async (order: IOrder) => {
    try {
      let addedCount = 0;
      let failedCount = 0;

      // Intentar agregar cada producto de la orden al carrito
      for (const item of order.line_items) {
        try {
          // Crear un producto básico desde el item de la orden
          // Nota: Esto es una aproximación, idealmente deberías obtener el producto completo por ID
          // Tipo específico para productos reconstruidos desde órdenes
          type ReconstructedProduct = Omit<IProduct, "attributes"> & {
            attributes: Array<{
              id: number;
              name: string;
              options: string[];
            }>;
          };

          const productData: ReconstructedProduct = {
            id: item.product_id,
            name: extractBaseProductName(item.name),
            slug: item.name.toLowerCase().replace(/\s+/g, "-"), // Slug aproximado
            type: item.variation_id > 0 ? "variable" : "simple",
            description: "",
            shortDescription: "",
            stockStatus: "instock",
            pricing: {
              price: parseFloat(item.price || item.subtotal) / item.quantity,
              regularPrice:
                parseFloat(item.price || item.subtotal) / item.quantity,
              salePrice: null,
              currency: order.currency || "PEN",
            },
            images: item.image
              ? [
                  {
                    id: 0,
                    alt: item.image.alt || item.name,
                    src: item.image.src,
                  },
                ]
              : [],
            categories: [],
            attributes: [],
            variations: [],
          };

          // Agregar al carrito con la cantidad de la orden
          for (let i = 0; i < item.quantity; i++) {
            // Cast a IProduct ya que el store puede manejar productos parciales
            addToCart(productData as unknown as IProduct);
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
        // Opcional: redirigir al carrito
        // router.push("/cart");
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
                <div className="w-12 h-12 bg-linear-to-r from-primary to-secondary rounded-full flex items-center justify-center">
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
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                      statusMap[order.status]?.color ||
                      "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {statusMap[order.status]?.icon}
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            </div>
            {/* Productos de la orden */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              {order.line_items.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-4">
                  No hay productos en esta orden.
                </div>
              ) : (
                order.line_items.slice(0, 3).map((item) => {
                  const attributes = extractAttributes(item);
                  const itemPrice =
                    parseFloat(item.price || item.subtotal) / item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border bg-order border-gray-100 rounded-xl"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image?.src ? (
                          <img
                            src={item.image.src}
                            alt={item.image.alt || item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate mb-1">
                          {extractBaseProductName(item.name || "(Sin título)")}
                        </p>
                        {attributes.map((attr, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            {attr.name}: {attr.value}
                          </p>
                        ))}
                        <p className="text-xs text-gray-600">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(itemPrice, order.currency)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {order.line_items.length > 3 && (
              <div className="text-xs text-gray-500 mt-1">
                y {order.line_items.length - 3} producto(s) más...
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleViewOrder(order.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                <Eye size={18} />
                Ver Detalles
              </button>
              <button
                onClick={() => handleBuyAgain(order)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:scale-105 transition-all duration-200"
              >
                <RefreshCcw size={18} />
                Volver a Comprar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
