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
  // Primero intentar obtener del store de Zustand
  const storeToken = useUserStore.getState().token;
  if (storeToken) {
    return storeToken;
  }

  // Si no hay en el store, intentar del localStorage
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("authToken");
    return localToken;
  }
  return null;
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }
  return { "Content-Type": "application/json" };
}

export class WishlistService {
  static async getUserWishlist(): Promise<IProduct[]> {
    try {
      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.error("WordPress API URL no está configurado");
        return [];
      }

      const token = getAuthToken();
      if (!token) {
        console.warn(
          "No hay token de autenticación, no se puede obtener wishlist"
        );
        return [];
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Intentar diferentes estructuras de respuesta (el backend tiene estructura anidada)
      const wishlist =
        data.wishlist || data.data?.wishlist || data.data?.data?.wishlist || [];

      return wishlist;
    } catch (error) {
      console.error("Error fetching user wishlist:", error);
      return [];
    }
  }

  static async saveUserWishlist(products: IProduct[]): Promise<boolean> {
    try {
      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.error("WordPress API URL no está configurado");
        return false;
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: products }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error saving user wishlist:", error);
      return false;
    }
  }

  static async addToWishlist(
    product: IProduct
  ): Promise<{ success: boolean; added: boolean; message: string }> {
    try {
      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.error("WordPress API URL no está configurado");
        return {
          success: false,
          added: false,
          message: "API URL no configurada",
        };
      }

      const token = getAuthToken();
      if (!token) {
        return {
          success: false,
          added: false,
          message: "Usuario no autenticado",
        };
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist/add`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: product.id }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Verificar si realmente se agregó o si ya existía
      const added =
        data.success && data.message !== "Producto ya está en el wishlist";

      return {
        success: data.success,
        added: added,
        message: data.message || "Unknown response",
      };
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      return {
        success: false,
        added: false,
        message: "Error adding to wishlist",
      };
    }
  }

  static async removeFromWishlist(productId: string): Promise<boolean> {
    try {
      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.error("WordPress API URL no está configurado");
        return false;
      }

      const token = getAuthToken();
      if (!token) {
        console.warn(
          "No hay token de autenticación, no se puede remover de wishlist"
        );
        return false;
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist/remove`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      return false;
    }
  }

  static async clearWishlist(): Promise<boolean> {
    try {
      const apiUrl = getWordpressApiUrl();
      if (!apiUrl) {
        console.error("WordPress API URL no está configurado");
        return false;
      }

      const token = getAuthToken();
      if (!token) {
        console.warn(
          "No hay token de autenticación, no se puede limpiar wishlist"
        );
        return false;
      }

      const endpoint = `${apiUrl}/wp-json/belm/v1/wishlist/clear`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      return false;
    }
  }
}
