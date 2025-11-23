"use client";

import { useCartStore } from "@/store/useCartStore";
import type { CartItem } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { X, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/utils/formatPrice"; // Usa tu formateador "S/."
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const isOpen = useUIStore((s) => s.isCartOpen);
  const close = useUIStore((s) => s.closeCart);
  const router = useRouter();
  const { cart, removeFromCart, clearCart, addToCart } = useCartStore();

  // Suma total
  const getTotal = () =>
    cart.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);

  // Handler para cambiar cantidad
  const handleQuantity = (item: CartItem, delta: number) => {
    if (delta === -1 && item.quantity === 1) {
      // No hacer nada si la cantidad es 1 y se intenta disminuir
      return;
    }

    if (delta === -1) {
      // Disminuir cantidad usando decrementQuantity
      const { decrementQuantity } = useCartStore.getState();
      decrementQuantity(item.slug, item.selectedAttributes || {});
    } else if (delta === 1) {
      // Aumentar cantidad usando addToCart
      addToCart(item, item.selectedAttributes || {});
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "visible" : "invisible"}`}>
      {/* Fondo negro semitransparente */}
      <div
        className="absolute inset-0 backdrop-blur-lg bg-black opacity-25 transition-opacity"
        onClick={close}
      ></div>
      {/* Panel del carrito */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={24} />
              Tu Carrito
              {cart.length > 0 && (
                <span className="bg-primary text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </h2>
            <button
              onClick={close}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>
          {/* Cuerpo del carrito */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                <p>Tu carrito está vacío</p>
                <p className="text-sm text-gray-500 mt-1">
                  Agrega algunos productos para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item: CartItem) => (
                  <div
                    key={
                      item.slug + JSON.stringify(item.selectedAttributes || {})
                    }
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <Image
                        src={
                          (item.variations &&
                            item.selectedAttributes &&
                            item.variations.find((v) =>
                              v.attributes.every(
                                (a) =>
                                  item.selectedAttributes?.[a.id] === a.option
                              )
                            )?.image?.src) ||
                          (typeof item.image === "string"
                            ? item.image
                            : item.image?.sourceUrl || "/logo-belm-v2.png")
                        }
                        alt={item.name}
                        fill
                        className="rounded-xl object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {item.name}
                      </h3>
                      {/* Mostrar atributos seleccionados */}
                      {item.selectedAttributes &&
                        Object.keys(item.selectedAttributes).length > 0 && (
                          <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
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
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">
                          {formatPrice(
                            (parseFloat(item.price) * item.quantity).toFixed(2)
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantity(item, -1)}
                            className="p-1 hover:bg-gray-200 rounded-full transition disabled:opacity-50"
                          >
                            <Minus size={14} className="text-gray-600" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantity(item, 1)}
                            className="p-1 hover:bg-gray-200 rounded-full transition disabled:opacity-50"
                          >
                            <Plus size={14} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        removeFromCart(item.slug, item.selectedAttributes || {})
                      }
                      className="p-1 hover:bg-red-100 rounded-full transition"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="w-full py-2 text-sm text-red-600 hover:text-red-700 transition"
                  >
                    Vaciar carrito
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total:</span>
                <span className="text-primary">
                  {formatPrice(getTotal().toFixed(2))}
                </span>
              </div>
              <button
                onClick={() => {
                  close();
                  // Pequeña pausa para que el drawer se cierre antes de navegar
                  setTimeout(() => {
                    router.push("/checkout");
                  }, 100);
                }}
                className="w-full py-3 bg-primary text-white rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
              >
                Ir a pagar
              </button>
              <button
                onClick={() => {
                  close();
                  // Pequeña pausa para que el drawer se cierre antes de navegar
                  setTimeout(() => {
                    router.push("/shop");
                  }, 10);
                }}
                className="w-full mt-4 py-3  text-text border-2 border-gray-400 rounded-2xl font-semibold hover:scale-105 transition-transform duration-300"
              >
                Continuar comprando
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
