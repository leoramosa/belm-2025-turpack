import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct } from "@/types/product";
import { WishlistSyncService } from "@/services/wishlistSync";

interface WishlistState {
  items: IProduct[];
  addToWishlist: (product: IProduct) => void;
  removeFromWishlist: (productId: string | number) => void;
  clearWishlist: () => void;
  loadFromBackend: (force?: boolean) => Promise<void>;
  getWishlistCount: () => number;
  isInWishlist: (productId: string | number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addToWishlist: (product) => {
        const existing = get().items.find((item) => item.id === product.id);
        if (!existing) {
          set({
            items: [...get().items, product],
          });

          // Sincronizar con backend en segundo plano con debounce
          setTimeout(() => {
            WishlistSyncService.syncAddToBackend(product);
          }, 100);
        }
      },
      removeFromWishlist: (productId: string | number) => {
        const id =
          typeof productId === "string" ? parseInt(productId, 10) : productId;
        set({
          items: get().items.filter((item) => item.id !== id),
        });

        // Sincronizar con backend en segundo plano con debounce
        setTimeout(() => {
          WishlistSyncService.syncRemoveFromBackend(String(productId));
        }, 100);
      },
      clearWishlist: () => {
        set({ items: [] });

        // Sincronizar con backend en segundo plano
        WishlistSyncService.clearBackend();
      },
      loadFromBackend: async (force: boolean = false) => {
        try {
          // Si no es forzado, evitar llamadas duplicadas verificando si ya hay items
          const currentItems = get().items;
          if (!force && currentItems.length > 0) {
            console.log("Wishlist ya tiene items, omitiendo carga del backend");
            return; // Ya hay items cargados, no hacer llamada duplicada
          }

          console.log("Cargando wishlist del backend...");
          const backendItems = await WishlistSyncService.loadFromBackend();
          console.log(
            "Wishlist cargada del backend:",
            backendItems.length,
            "productos"
          );

          if (backendItems && backendItems.length > 0) {
            set({ items: backendItems });
          } else if (force) {
            // Si es forzado y no hay items, limpiar el store
            set({ items: [] });
          }
        } catch (error) {
          console.error("Error loading from backend:", error);
        }
      },
      getWishlistCount: () => {
        return get().items.length;
      },
      isInWishlist: (productId: string | number) => {
        const items = get().items;
        const id =
          typeof productId === "string" ? parseInt(productId, 10) : productId;
        return items.some((item) => item.id === id);
      },
    }),
    {
      name: "wishlist-storage",
    }
  )
);
