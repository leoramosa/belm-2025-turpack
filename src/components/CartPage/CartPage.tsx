import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import {
  FiArrowLeft as ArrowLeft,
  FiX as X,
  FiTruck as Truck,
  FiShield as Shield,
  FiRotateCcw as RotateCcw,
  FiShoppingBag as ShoppingBag,
  FiCreditCard as CreditCard,
  FiPlus as Plus,
  FiMinus as Minus,
} from "react-icons/fi";

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    clearCart,
    incrementQuantity,
    decrementQuantity,
  } = useCartStore();
  // const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = () => {
    router.push("/checkout");
  };

  // Adaptar estructura del carrito si es necesario
  const total = cart.reduce(
    (acc, item) => acc + parseFloat(item.price) * item.quantity,
    0
  );
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 ">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/shop"
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={20} />
              Seguir comprando
            </Link>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold gradient-text mb-4">
              Carrito de compras
            </h1>
            <p className="text-gray-600 text-lg">
              Revisa tus productos y procede al checkout cuando estés listo.
            </p>
          </div>
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-3xl p-12 shadow-lg max-w-md mx-auto">
                <ShoppingBag size={64} className="mx-auto text-gray-400 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-600 mb-8">
                  Aún no has agregado productos a tu carrito.
                </p>
                <button
                  onClick={() => router.push("/shop")}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
                >
                  Ir a la tienda
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      Productos ({totalQuantity})
                    </h2>
                    <button
                      onClick={clearCart}
                      // disabled={isLoading}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      Vaciar carrito
                    </button>
                  </div>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={
                          item.slug +
                          JSON.stringify(item.selectedAttributes || {})
                        }
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl"
                      >
                        <div className="w-20 h-20 flex-shrink-0">
                          <img
                            src={
                              (item.variations &&
                                item.selectedAttributes &&
                                item.variations.find((v) =>
                                  v.attributes.every(
                                    (a) =>
                                      item.selectedAttributes?.[a.id] ===
                                      a.option
                                  )
                                )?.image?.src) ||
                              (typeof item.image === "string"
                                ? item.image
                                : item.image?.sourceUrl || "/logo-belm-v2.png")
                            }
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">
                            {item.name}
                          </h3>
                          {/* Mostrar atributos seleccionados */}
                          {item.selectedAttributes &&
                            Object.keys(item.selectedAttributes).length > 0 && (
                              <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2">
                                {Object.entries(item.selectedAttributes).map(
                                  ([attrId, value]) => (
                                    <span
                                      key={attrId}
                                      className="bg-gray-100 rounded px-2 py-0.5"
                                    >
                                      {(() => {
                                        const attr = item.attributes?.find(
                                          (a) => String(a.id) === String(attrId)
                                        );
                                        return attr
                                          ? `${attr.name}: ${value}`
                                          : value;
                                      })()}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          {/* <div className="text-sm text-gray-600 mt-1">{item.category || 'Sin categoría'}</div> */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  decrementQuantity(
                                    item.slug,
                                    item.selectedAttributes
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                              >
                                <Minus size={16} className="text-gray-600" />
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  incrementQuantity(
                                    item.slug,
                                    item.selectedAttributes
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                              >
                                <Plus size={16} className="text-gray-600" />
                              </button>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">
                                S/. {parseFloat(item.price) * item.quantity}
                              </div>
                              <div className="text-sm text-gray-500">
                                S/. {item.price} c/u
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.slug)}
                          // disabled={isLoading}
                          className="p-2 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Truck size={24} className="text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Envío gratis
                    </h3>
                    <p className="text-sm text-gray-600">
                      Compras mayores de S/. 149.00
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield size={24} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Garantia por los 12 meses
                    </h3>
                    <p className="text-sm text-gray-600">Garantía anual</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <RotateCcw size={24} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      7 Dias de devolucion
                    </h3>
                    <p className="text-sm text-gray-600">
                      Si el producto no esta como se describio
                    </p>
                  </div>
                </div>
              </div>
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl p-6 shadow-lg sticky top-24">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Resumen
                  </h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Subtotal ({totalQuantity} productos)
                      </span>
                      <span className="font-medium">
                        S/. {total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envío</span>
                      <span className=" text-gray-500">
                        Se calculará en el checkout
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="gradient-text">
                          S/. {total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    // disabled={isLoading}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mb-4"
                  >
                    <CreditCard size={20} />
                    Ir a pagar
                  </button>
                  <Link
                    href="/shop"
                    className="w-full flex items-center justify-center py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-primary hover:text-primary transition-colors"
                  >
                    Seguir comprando
                  </Link>
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Pago seguro
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
