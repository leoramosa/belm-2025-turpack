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

// Normalizar ID a número para comparaciones consistentes
const normalizeProductId = (id: string | number): number => {
  return typeof id === "string" ? parseInt(id, 10) : id;
};

// Eliminar duplicados por ID
const dedupeById = (products: IProduct[]): IProduct[] => {
  const seen = new Set<number>();
  return products.filter((product) => {
    const id = normalizeProductId(product.id);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addToWishlist: (product) => {
        const normalizedId = normalizeProductId(product.id);
        const existing = get().items.find(
          (item) => normalizeProductId(item.id) === normalizedId
        );
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
        const normalizedId = normalizeProductId(productId);
        set({
          items: get().items.filter(
            (item) => normalizeProductId(item.id) !== normalizedId
          ),
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
          const currentItems = get().items;

          // Si no es forzado y ya hay items, no recargar (evitar sobrescribir datos locales)
          if (!force && currentItems.length > 0) {
            return; // Ya hay items cargados, no hacer llamada duplicada
          }

          const backendItems = await WishlistSyncService.loadFromBackend();

          if (backendItems && backendItems.length > 0) {
            // Los productos del backend ya vienen completos desde WooCommerce
            // Normalizar y deduplicar
            const normalizedBackend = dedupeById(backendItems);

            // Si hay items locales, hacer merge inteligente en lugar de sobrescribir
            if (currentItems.length > 0 && !force) {
              // Crear un mapa de IDs del backend para búsqueda rápida
              const backendIds = new Set(
                normalizedBackend.map((item) => normalizeProductId(item.id))
              );

              // Agregar items locales que no están en el backend (cambios recientes)
              const localOnlyItems = currentItems.filter(
                (item) => !backendIds.has(normalizeProductId(item.id))
              );

              // Combinar: backend items + items locales que no están en backend
              const mergedItems = [...normalizedBackend, ...localOnlyItems];
              set({ items: dedupeById(mergedItems) });
            } else {
              // Si no hay items locales o es forzado, usar directamente los del backend
              set({ items: normalizedBackend });
            }
          } else if (force && currentItems.length === 0) {
            // Solo limpiar si es forzado Y no hay items locales
            set({ items: [] });
          }
        } catch (error) {
          console.error("Error loading from backend:", error);
        }
      },
      getWishlistCount: () => {
        return get().items.length;
      },
      isInWishlist: (productId) => {
        const items = get().items;
        const normalizedId = normalizeProductId(productId);
        return items.some(
          (item) => normalizeProductId(item.id) === normalizedId
        );
      },
    }),
    {
      name: "wishlist-storage",
    }
  )
);
