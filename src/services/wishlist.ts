import { IProduct } from "@/types/product";
import { useUserStore } from "@/store/userStore";

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
      const response = await fetch("/api/wishlist", {
        headers: getAuthHeaders(),
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
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: products }),
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
      const response = await fetch("/api/wishlist/add", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: product.id }),
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
      const response = await fetch("/api/wishlist/remove", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
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
      const response = await fetch("/api/wishlist/clear", {
        method: "POST",
        headers: getAuthHeaders(),
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
