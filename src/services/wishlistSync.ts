import { IProduct, WordpressProductAttribute } from "@/types/product";
import { useUserStore } from "@/store/userStore";

function getAuthToken() {
  const state = useUserStore.getState();

  // 1. Buscar en el campo token del store (prioridad)
  if (state.token) {
    return state.token;
  }

  // 2. Buscar dentro del objeto user (como antes)
  if (state.user?.token) {
    return state.user.token;
  }

  // 3. Buscar en localStorage como fallback
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }

  return null;
}

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export class WishlistSyncService {
  // Sincronizar productos agregados al backend
  static async syncAddToBackend(product: IProduct): Promise<void> {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`/api/wishlist`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: product.id }),
      });

      if (!response.ok) {
        console.warn("Error agregando producto al backend:", product.id);
      }
    } catch (error) {
      console.error("Error en syncAddToBackend:", error);
    }
  }

  // Sincronizar productos removidos del backend
  static async syncRemoveFromBackend(productId: string): Promise<void> {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`/api/wishlist/remove`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        console.warn("Error removiendo producto del backend:", productId);
      }
    } catch (error) {
      console.error("Error en syncRemoveFromBackend:", error);
    }
  }

  // Obtener producto completo desde WooCommerce por ID
  private static async fetchFullProductById(
    productId: number
  ): Promise<IProduct | null> {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      const product = await response.json();

      // Mapear producto de WooCommerce a IProduct
      const price = product.price ? parseFloat(product.price) : null;
      const regularPrice = product.regular_price
        ? parseFloat(product.regular_price)
        : null;
      const salePrice = product.sale_price
        ? parseFloat(product.sale_price)
        : null;

      // Mapear imágenes
      const images =
        product.images?.map(
          (img: { id: number; src: string; alt?: string }) => ({
            id: img.id,
            src: img.src,
            alt: img.alt || product.name,
          })
        ) || [];

      // Mapear categorías
      const categories =
        product.categories?.map(
          (cat: { id: number; name: string; slug: string }) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          })
        ) || [];

      // Mapear atributos básicos (sin enriquecer términos, eso requiere server-side)
      const attributes =
        product.attributes?.map((attr: WordpressProductAttribute) => ({
          id: attr.id || 0,
          name: attr.name || "",
          slug:
            attr.slug || attr.name?.toLowerCase().replace(/\s+/g, "-") || "",
          visible: attr.visible !== false,
          variation: attr.variation === true,
          options: (attr.options || []).map((opt: string) => ({
            id: null,
            name: opt,
            slug: opt.toLowerCase().replace(/\s+/g, "-"),
            description: null,
          })),
        })) || [];

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        type: product.type || "simple",
        permalink: product.permalink,
        description: product.description || "",
        shortDescription: product.short_description || "",
        sku: product.sku || null,
        stockStatus: product.stock_status || null,
        pricing: {
          price,
          regularPrice,
          salePrice,
          currency: product.currency || "PEN",
        },
        images,
        categories,
        attributes,
        variations: [], // Las variaciones requieren llamadas adicionales, se pueden cargar después si es necesario
      };
    } catch (error) {
      console.error("Error fetching full product:", error);
      return null;
    }
  }

  // Cargar wishlist del backend al iniciar sesión
  static async loadFromBackend(): Promise<IProduct[]> {
    try {
      const token = getAuthToken();
      if (!token) {
        return [];
      }

      const response = await fetch(`/api/wishlist`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const wishlist = data.wishlist || data.data?.wishlist || [];

        // Extraer solo los IDs de los productos
        // El backend puede devolver el ID como string o number, o dentro de un objeto
        interface WishlistItem {
          id?: string | number;
          product_id?: string | number;
        }

        const productIds = (wishlist as WishlistItem[])
          .map((item) => {
            const id = item.id || item.product_id;
            return id ? parseInt(String(id), 10) : null;
          })
          .filter((id: number | null): id is number => id !== null);

        if (productIds.length === 0) {
          return [];
        }

        console.log(
          "Obteniendo productos completos para IDs:",
          productIds.length,
          "productos"
        );

        // Obtener productos completos desde WooCommerce
        const fullProducts = await Promise.all(
          productIds.map((id: number) => this.fetchFullProductById(id))
        );

        // Filtrar nulls y retornar productos completos
        const completeProducts = fullProducts.filter(
          (product): product is IProduct => product !== null
        );

        console.log("Productos completos obtenidos:", completeProducts.length);
        return completeProducts;
      } else {
        console.warn("Error cargando wishlist del backend");
        return [];
      }
    } catch (error) {
      console.error("Error en loadFromBackend:", error);
      return [];
    }
  }

  // Limpiar wishlist del backend
  static async clearBackend(): Promise<void> {
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`/api/wishlist/clear`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        console.warn("Error limpiando wishlist del backend");
      }
    } catch (error) {
      console.error("Error en clearBackend:", error);
    }
  }
}
