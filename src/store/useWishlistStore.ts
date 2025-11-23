import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct } from "@/types/product";
import { WishlistSyncService } from "@/services/wishlistSync";

interface WishlistState {
  items: IProduct[];
  addToWishlist: (product: IProduct) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  loadFromBackend: () => Promise<void>;
  getWishlistCount: () => number;
  isInWishlist: (productId: string) => boolean;
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
      removeFromWishlist: (productId) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });

        // Sincronizar con backend en segundo plano con debounce
        setTimeout(() => {
          WishlistSyncService.syncRemoveFromBackend(productId);
        }, 100);
      },
      clearWishlist: () => {
        set({ items: [] });

        // Sincronizar con backend en segundo plano
        WishlistSyncService.clearBackend();
      },
      loadFromBackend: async () => {
        try {
          // Evitar llamadas duplicadas verificando si ya hay items
          const currentItems = get().items;
          if (currentItems.length > 0) {
            return; // Ya hay items cargados, no hacer llamada duplicada
          }

          const backendItems = await WishlistSyncService.loadFromBackend();
          set({ items: backendItems });
        } catch (error) {
          console.error("Error loading from backend:", error);
        }
      },
      getWishlistCount: () => {
        return get().items.length;
      },
      isInWishlist: (productId) => {
        const items = get().items;
        return items.some((item) => item.id === productId);
      },
    }),
    {
      name: "wishlist-storage",
    }
  )
);
