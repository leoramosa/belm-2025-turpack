import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct } from "@/interface/IProduct";
import { Coupon, CouponDiscount } from "@/services/coupons";

export interface CartItem extends IProduct {
  quantity: number;
  selectedAttributes?: { [key: number]: string };
}

interface CartState {
  cart: CartItem[];
  appliedCoupon: Coupon | null;
  couponDiscount: CouponDiscount | null;
  addToCart: (
    product: IProduct,
    selectedAttributes?: { [key: number]: string }
  ) => void;
  removeFromCart: (
    slug: string,
    selectedAttributes?: { [key: number]: string }
  ) => void;
  incrementQuantity: (
    slug: string,
    selectedAttributes?: { [key: number]: string }
  ) => void;
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
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      appliedCoupon: null,
      couponDiscount: null,
      addToCart: (product, selectedAttributes) => {
        const existing = get().cart.find(
          (item) =>
            item.slug === product.slug &&
            JSON.stringify(item.selectedAttributes || {}) ===
              JSON.stringify(selectedAttributes || {})
        );
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
          set({
            cart: [
              ...get().cart,
              { ...product, quantity: 1, selectedAttributes },
            ],
          });
        }
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
        set({
          cart: get().cart.map((item) =>
            item.slug === slug &&
            JSON.stringify(item.selectedAttributes || {}) ===
              JSON.stringify(selectedAttributes || {})
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        });
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
          const price = parseFloat(item.price) || 0;
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
