"use client";

import { IProduct } from "@/types/product";
import { useUserStore } from "@/store/userStore";

// Obtener URL base del backend desde variables de entorno públicas
function getWordpressApiUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  // Intentar diferentes nombres de variables de entorno
  return (
    process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  );
}

function getAuthToken() {
  const storeToken = useUserStore.getState().token;
  if (storeToken) {
    return storeToken;
  }
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

      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.warn("WordPress API URL no está configurado");
        return;
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist/add`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: product.id }),
        cache: "no-store",
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

      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.warn("WordPress API URL no está configurado");
        return;
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist/remove`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
        cache: "no-store",
      });

      if (!response.ok) {
        console.warn("Error removiendo producto del backend:", productId);
      }
    } catch (error) {
      console.error("Error en syncRemoveFromBackend:", error);
    }
  }

  // Cargar wishlist del backend al iniciar sesión
  static async loadFromBackend(): Promise<IProduct[]> {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No hay token, no se puede cargar wishlist del backend");
        return [];
      }

      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.warn("WordPress API URL no está configurado");
        return [];
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist`;
      console.log("Fetching wishlist from:", endpoint);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta del backend (raw):", data);

        // Intentar diferentes estructuras de respuesta
        const wishlist =
          data.wishlist ||
          data.data?.wishlist ||
          data.data?.data?.wishlist ||
          (Array.isArray(data) ? data : []) ||
          [];

        console.log("Wishlist parseada:", wishlist.length, "productos");

        // Validar que sean productos válidos
        if (Array.isArray(wishlist) && wishlist.length > 0) {
          const validProducts = wishlist.filter(
            (item: any) => item && item.id && item.name
          );
          console.log("Productos válidos:", validProducts.length);
          return validProducts;
        }

        return [];
      } else {
        const errorText = await response.text();
        console.warn(
          "Error cargando wishlist del backend:",
          response.status,
          errorText
        );
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

      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.warn("WordPress API URL no está configurado");
        return;
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist/clear`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (!response.ok) {
        console.warn("Error limpiando wishlist del backend");
      }
    } catch (error) {
      console.error("Error en clearBackend:", error);
    }
  }
}
