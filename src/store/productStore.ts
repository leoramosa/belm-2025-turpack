"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { IProduct } from "@/types/product";

export interface ProductState {
  products: IProduct[];
  selectedProduct: IProduct | null;
  lastUpdated: number | null;
  setProducts: (products: IProduct[]) => void;
  setSelectedProduct: (product: IProduct | null) => void;
  upsertProduct: (product: IProduct) => void;
  clear: () => void;
}

const initialState: Pick<
  ProductState,
  "products" | "selectedProduct" | "lastUpdated"
> = {
  products: [],
  selectedProduct: null,
  lastUpdated: null,
};

export const useProductStore = create<ProductState>()(
  devtools<ProductState>(
    (set, get) => ({
      ...initialState,
      setProducts: (products: IProduct[]) =>
        set((state: ProductState) => {
          if (areProductsEqual(state.products, products)) {
            return state;
          }
          return {
            products,
            lastUpdated: Date.now(),
          };
        }),
      setSelectedProduct: (product: IProduct | null) =>
        set(() => ({
          selectedProduct: product,
        })),
      upsertProduct: (product: IProduct) =>
        set(() => {
          const existing = get().products;
          const index = existing.findIndex(
            (item: IProduct) => item.id === product.id
          );
          if (index === -1) {
            return {
              products: [...existing, product],
              lastUpdated: Date.now(),
            };
          }
          const updated = [...existing];
          updated[index] = product;
          return {
            products: updated,
            lastUpdated: Date.now(),
          };
        }),
      clear: () => set(() => ({ ...initialState })),
    }),
    {
      name: "product-store",
      enabled:
        typeof window !== "undefined" && process.env.NODE_ENV !== "production",
    }
  )
);

export function useSelectProducts() {
  return useProductStore((state) => state.products);
}

export function useSelectSelectedProduct() {
  return useProductStore((state) => state.selectedProduct);
}

export function useSelectProductBySlug(slug: string) {
  return useProductStore(
    (state) => state.products.find((product) => product.slug === slug) ?? null
  );
}

function areProductsEqual(current: IProduct[], next: IProduct[]): boolean {
  if (current === next) return true;
  if (current.length !== next.length) return false;
  for (let index = 0; index < current.length; index += 1) {
    if (current[index].id !== next[index].id) {
      return false;
    }
  }
  return true;
}
