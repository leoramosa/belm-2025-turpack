import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct } from "@/types/product";

interface RecentlyViewedState {
  products: IProduct[];
  addProduct: (product: IProduct) => void;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  getProducts: () => IProduct[];
  hasProduct: (productId: string) => boolean;
}

const MAX_PRODUCTS = 8;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product: IProduct) => {
        set((state) => {
          // Filtrar el producto si ya existe (evitar duplicados)
          const filtered = state.products.filter((p) => p.id !== product.id);

          // Agregar el nuevo producto al inicio
          const updated = [product, ...filtered];

          // Limitar a MAX_PRODUCTS
          const limited = updated.slice(0, MAX_PRODUCTS);

          return { products: limited };
        });
      },

      removeProduct: (productId: string) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
      },

      clearAll: () => {
        set({ products: [] });
      },

      getProducts: () => {
        return get().products;
      },

      hasProduct: (productId: string) => {
        return get().products.some((p) => p.id === productId);
      },
    }),
    {
      name: "recently-viewed-products",
      // Solo persistir los datos esenciales del producto
      partialize: (state) => ({
        products: state.products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          regular_price: product.regular_price,
          sale_price: product.sale_price,
          image: product.image,
          short_description: product.short_description,
        })),
      }),
    }
  )
);
