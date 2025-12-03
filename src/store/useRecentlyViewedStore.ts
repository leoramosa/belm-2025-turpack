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

const MAX_PRODUCTS = 6; // Mantener 7 para que al filtrar el producto actual siempre queden 6

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
        set((state) => {
          // Convertir productId (string) a número para comparar con p.id (number)
          const productIdNum = parseInt(productId, 10);
          return {
            products: state.products.filter((p) => p.id !== productIdNum),
          };
        });
      },

      clearAll: () => {
        set({ products: [] });
      },

      getProducts: () => {
        return get().products;
      },

      hasProduct: (productId: string) => {
        // Convertir productId (string) a número para comparar con p.id (number)
        const productIdNum = parseInt(productId, 10);
        return get().products.some((p) => p.id === productIdNum);
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
          pricing: product.pricing,
          images: product.images,
          shortDescription: product.shortDescription,
        })),
      }),
    }
  )
);
