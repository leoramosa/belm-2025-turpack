import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct } from "@/types/product";
import { Coupon, CouponDiscount } from "@/services/coupons";

export interface CartItem extends IProduct {
  quantity: number;
  selectedAttributes?: { [key: number]: string };
  price: string; // Precio calculado al agregar al carrito para compatibilidad
  image?: { sourceUrl?: string } | string; // Para compatibilidad con diferentes formatos de imagen
}

interface CartState {
  cart: CartItem[];
  appliedCoupon: Coupon | null;
  couponDiscount: CouponDiscount | null;
  addToCart: (
    product: IProduct,
    selectedAttributes?: { [key: number]: string }
  ) => boolean; // Retorna true si se agregó exitosamente, false si no hay stock
  removeFromCart: (
    slug: string,
    selectedAttributes?: { [key: number]: string }
  ) => void;
  incrementQuantity: (
    slug: string,
    selectedAttributes?: { [key: number]: string }
  ) => boolean; // Retorna true si se incrementó exitosamente, false si no hay stock
  decrementQuantity: (
    slug: string,
    selectedAttributes?: { [key: number]: string }
  ) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon, discount: CouponDiscount) => void;
  removeCoupon: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getDiscountAmount: () => number;
  getAvailableStock: (
    product: IProduct,
    selectedAttributes?: { [key: number]: string }
  ) => number | null; // Retorna el stock disponible para un producto/variación
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      appliedCoupon: null,
      couponDiscount: null,
      // Helper para obtener el stock disponible de un producto/variación
      getAvailableStock: (product, selectedAttributes) => {
        // Si hay variaciones, buscar la variación que coincida con los atributos seleccionados
        if (
          product.variations &&
          product.variations.length > 0 &&
          selectedAttributes
        ) {
          const variation = product.variations.find((variation) =>
            variation.attributes.every(
              (attr) => selectedAttributes[attr.id] === attr.option
            )
          );
          if (
            variation?.stockQuantity !== null &&
            variation?.stockQuantity !== undefined
          ) {
            return variation.stockQuantity;
          }
        }
        // Usar el stock del producto base
        return product.stockQuantity ?? null;
      },
      addToCart: (product, selectedAttributes) => {
        const availableStock = get().getAvailableStock(
          product,
          selectedAttributes
        );
        const existing = get().cart.find(
          (item) =>
            item.slug === product.slug &&
            JSON.stringify(item.selectedAttributes || {}) ===
              JSON.stringify(selectedAttributes || {})
        );

        // Validar stock disponible
        if (availableStock !== null) {
          const currentQuantity = existing ? existing.quantity : 0;
          if (currentQuantity + 1 > availableStock) {
            return false; // No hay stock suficiente
          }
        }

        if (existing) {
          set({
            cart: get().cart.map((item) =>
              item.slug === product.slug &&
              JSON.stringify(item.selectedAttributes || {}) ===
                JSON.stringify(selectedAttributes || {})
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Calcular el precio a partir de pricing
          const price = product.pricing?.price?.toString() || "0";
          // Agregar compatibilidad con imagen
          const image =
            product.images && product.images.length > 0
              ? product.images[0]
              : undefined;

          set({
            cart: [
              ...get().cart,
              {
                ...product,
                quantity: 1,
                selectedAttributes,
                price,
                image: image ? { sourceUrl: image.src } : undefined,
              },
            ],
          });
        }
        return true; // Se agregó exitosamente
      },
      removeFromCart: (slug, selectedAttributes) => {
        set({
          cart: get().cart.filter(
            (item) =>
              !(
                item.slug === slug &&
                JSON.stringify(item.selectedAttributes || {}) ===
                  JSON.stringify(selectedAttributes || {})
              )
          ),
        });
      },
      incrementQuantity: (slug, selectedAttributes) => {
        const currentCart = get().cart;
        const item = currentCart.find(
          (item) =>
            item.slug === slug &&
            JSON.stringify(item.selectedAttributes || {}) ===
              JSON.stringify(selectedAttributes || {})
        );

        if (!item) return false;

        // Validar stock disponible
        const availableStock = get().getAvailableStock(
          item,
          selectedAttributes
        );
        if (availableStock !== null && item.quantity + 1 > availableStock) {
          return false; // No hay stock suficiente
        }

        set({
          cart: currentCart.map((item) =>
            item.slug === slug &&
            JSON.stringify(item.selectedAttributes || {}) ===
              JSON.stringify(selectedAttributes || {})
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        });
        return true; // Se incrementó exitosamente
      },
      decrementQuantity: (slug, selectedAttributes) => {
        const currentCart = get().cart;
        const item = currentCart.find(
          (item) =>
            item.slug === slug &&
            JSON.stringify(item.selectedAttributes || {}) ===
              JSON.stringify(selectedAttributes || {})
        );

        if (item && item.quantity > 1) {
          set({
            cart: currentCart.map((item) =>
              item.slug === slug &&
              JSON.stringify(item.selectedAttributes || {}) ===
                JSON.stringify(selectedAttributes || {})
                ? { ...item, quantity: item.quantity - 1 }
                : item
            ),
          });
        } else if (item && item.quantity === 1) {
          // Si la cantidad es 1, eliminar el producto
          set({
            cart: currentCart.filter(
              (item) =>
                !(
                  item.slug === slug &&
                  JSON.stringify(item.selectedAttributes || {}) ===
                    JSON.stringify(selectedAttributes || {})
                )
            ),
          });
        }
      },
      clearCart: () => {
        set({
          cart: [],
          appliedCoupon: null,
          couponDiscount: null,
        });
      },
      applyCoupon: (coupon, discount) => {
        set({
          appliedCoupon: coupon,
          couponDiscount: discount,
        });
      },
      removeCoupon: () => {
        set({
          appliedCoupon: null,
          couponDiscount: null,
        });
      },
      getSubtotal: () => {
        const cart = get().cart;
        return cart.reduce((total, item) => {
          // Usar price si existe, sino usar pricing.price
          const price = item.price
            ? parseFloat(item.price)
            : item.pricing?.price || 0;
          return total + price * item.quantity;
        }, 0);
      },
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },
      getDiscountAmount: () => {
        const discount = get().couponDiscount;
        return discount ? discount.amount : 0;
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
