import "server-only";

import { AdminBanner, AdminBannerFormData } from "@/types/admin";
import {
  buildBasicAuthHeader,
  getWordpressApiUrl,
  getWordpressConsumerKey,
  getWordpressConsumerSecret,
} from "@/services/wordpress";

// Interfaz MediaItem duplicada localmente para evitar dependencia circular
interface MediaItem {
  id: number;
  title: {
    rendered: string;
  };
  source_url: string;
  media_type: string;
  alt_text: string;
  date: string;
}

const WORDPRESS_API_URL = getWordpressApiUrl();
const WORDPRESS_WC_CONSUMER_KEY = getWordpressConsumerKey();
const WORDPRESS_WC_CONSUMER_SECRET = getWordpressConsumerSecret();

export class BannerService {
  // Obtener todos los banners
  static async getBanners(): Promise<AdminBanner[]> {
    try {
      const endpoint = `${WORDPRESS_API_URL}/wp-json/belm/v1/admin/banners`;

      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 60,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const banners = await response.json();

      // Transformar la respuesta del backend al formato AdminBanner
      return banners.map((banner: any) => ({
        id: banner.id.toString(),
        mediaItem: {
          id: banner.id,
          title:
            typeof banner.title === "string"
              ? banner.title
              : banner.title?.rendered || `Banner ${banner.id}`,
          source_url: banner.source_url || banner.banner_url || "",
          alt_text: banner.alt_text || `Banner ${banner.id}`,
        },
        isEnabled: banner.is_enabled ?? true,
        url: banner.banner_url || "",
        discountCode: banner.discount_code || "",
        order: banner.order || 0,
        createdAt: banner.created_at || new Date().toISOString(),
        updatedAt: banner.updated_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching banners:", error);
      throw error;
    }
  }

  // Obtener un banner específico
  static async getBanner(id: string): Promise<AdminBanner> {
    try {
      // Primero obtener el media item desde WordPress
      const mediaEndpoint = `${WORDPRESS_API_URL}/wp-json/wp/v2/media/${id}`;
      const mediaResponse = await fetch(mediaEndpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: buildBasicAuthHeader(
            WORDPRESS_WC_CONSUMER_KEY,
            WORDPRESS_WC_CONSUMER_SECRET
          ),
        },
      });

      if (!mediaResponse.ok) {
        throw new Error(`Error ${mediaResponse.status}: Media item not found`);
      }

      const mediaItem = await mediaResponse.json();

      // Intentar obtener los datos del banner desde el endpoint personalizado
      const bannerEndpoint = `${WORDPRESS_API_URL}/wp-json/belm/v1/admin/banners/${id}`;
      const bannerResponse = await fetch(bannerEndpoint, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      let bannerData: any = {};
      if (bannerResponse.ok) {
        bannerData = await bannerResponse.json();
      }

      return {
        id: id,
        mediaItem: {
          id: mediaItem.id,
          title:
            typeof mediaItem.title === "string"
              ? mediaItem.title
              : mediaItem.title?.rendered || `Banner ${id}`,
          source_url: mediaItem.source_url,
          alt_text:
            mediaItem.alt_text ||
            (typeof mediaItem.title === "string"
              ? mediaItem.title
              : mediaItem.title?.rendered) ||
            `Banner ${id}`,
        },
        isEnabled: bannerData.is_enabled ?? true,
        url: bannerData.banner_url || "",
        discountCode: bannerData.discount_code || "",
        order: bannerData.order || parseInt(id) || 0,
        createdAt: mediaItem.date || new Date().toISOString(),
        updatedAt: mediaItem.modified || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching banner:", error);
      throw error;
    }
  }

  // Crear un nuevo banner
  static async createBanner(
    mediaItemId: number,
    formData: AdminBannerFormData
  ): Promise<AdminBanner> {
    try {
      // En un sistema real, esto se guardaría en el backend de WordPress
      // Por ahora retornamos un banner simulado con los datos proporcionados
      const endpoint = `${WORDPRESS_API_URL}/wp-json/wp/v2/media/${mediaItemId}`;

      const mediaResponse = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: buildBasicAuthHeader(
            WORDPRESS_WC_CONSUMER_KEY,
            WORDPRESS_WC_CONSUMER_SECRET
          ),
        },
      });

      if (!mediaResponse.ok) {
        throw new Error(`Error ${mediaResponse.status}: Media item not found`);
      }

      const mediaItem = await mediaResponse.json();

      // Aquí deberías crear el banner en el backend usando el endpoint personalizado
      // Por ahora retornamos un banner simulado
      const newBanner: AdminBanner = {
        id: mediaItemId.toString(),
        mediaItem: {
          id: mediaItem.id,
          title:
            typeof mediaItem.title === "string"
              ? mediaItem.title
              : mediaItem.title?.rendered || `Banner ${mediaItemId}`,
          source_url: mediaItem.source_url,
          alt_text:
            mediaItem.alt_text ||
            (typeof mediaItem.title === "string"
              ? mediaItem.title
              : mediaItem.title?.rendered) ||
            `Banner ${mediaItemId}`,
        },
        isEnabled: formData.isEnabled ?? false,
        url: formData.url || "",
        discountCode: formData.discountCode || "",
        order: formData.order || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return newBanner;
    } catch (error) {
      console.error("Error creating banner:", error);
      throw error;
    }
  }

  // Actualizar un banner
  static async updateBanner(
    id: string,
    formData: Partial<AdminBannerFormData>
  ): Promise<AdminBanner> {
    try {
      const endpoint = `${WORDPRESS_API_URL}/wp-json/belm/v1/admin/banners/${id}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isEnabled: formData.isEnabled,
          url: formData.url || "",
          discountCode: formData.discountCode || "",
          order: formData.order || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const updatedBanner = await response.json();

      // Obtener el media item para completar los datos
      const mediaEndpoint = `${WORDPRESS_API_URL}/wp-json/wp/v2/media/${id}`;
      const mediaResponse = await fetch(mediaEndpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: buildBasicAuthHeader(
            WORDPRESS_WC_CONSUMER_KEY,
            WORDPRESS_WC_CONSUMER_SECRET
          ),
        },
      });

      const mediaItem = mediaResponse.ok ? await mediaResponse.json() : null;

      return {
        id: id,
        mediaItem: mediaItem
          ? {
              id: mediaItem.id,
              title:
                typeof mediaItem.title === "string"
                  ? mediaItem.title
                  : mediaItem.title?.rendered || `Banner ${id}`,
              source_url: mediaItem.source_url,
              alt_text:
                mediaItem.alt_text ||
                (typeof mediaItem.title === "string"
                  ? mediaItem.title
                  : mediaItem.title?.rendered) ||
                `Banner ${id}`,
            }
          : {
              id: parseInt(id),
              title: `Banner ${id}`,
              source_url: "",
              alt_text: `Banner ${id}`,
            },
        isEnabled: updatedBanner.is_enabled ?? formData.isEnabled ?? true,
        url: updatedBanner.banner_url || formData.url || "",
        discountCode:
          updatedBanner.discount_code || formData.discountCode || "",
        order: updatedBanner.order || formData.order || 0,
        createdAt: updatedBanner.created_at || new Date().toISOString(),
        updatedAt: updatedBanner.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error updating banner:", error);
      throw error;
    }
  }

  // Eliminar un banner
  static async deleteBanner(id: string): Promise<void> {
    try {
      // En un sistema real, esto eliminaría el banner del backend
      // Por ahora solo verificamos que el endpoint existe o lanzamos un error
      const endpoint = `${WORDPRESS_API_URL}/wp-json/belm/v1/admin/banners/${id}`;

      // Intentar hacer DELETE si el endpoint lo soporta
      // Si no existe, simplemente no hacemos nada (el banner se puede "eliminar" deshabilitándolo)
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Si el endpoint no soporta DELETE o no existe, no es un error crítico
      if (!response.ok && response.status !== 404 && response.status !== 405) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      throw error;
    }
  }

  // Obtener estadísticas de banners
  static async getBannerStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    withUrl: number;
    withDiscountCode: number;
  }> {
    try {
      // Obtener todos los banners y calcular estadísticas
      const banners = await this.getBanners();

      const stats = {
        total: banners.length,
        enabled: banners.filter((b) => b.isEnabled).length,
        disabled: banners.filter((b) => !b.isEnabled).length,
        withUrl: banners.filter((b) => b.url && b.url.length > 0).length,
        withDiscountCode: banners.filter(
          (b) => b.discountCode && b.discountCode.length > 0
        ).length,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching banner stats:", error);
      throw error;
    }
  }

  // Obtener imágenes disponibles para crear banners
  static async getBannerImages(): Promise<MediaItem[]> {
    try {
      // Llamar directamente al backend de WordPress para obtener banners
      // Similar a como lo hace el servicio de media
      const endpoint = `${WORDPRESS_API_URL}/wp-json/belm/v1/banners`;

      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: buildBasicAuthHeader(
            WORDPRESS_WC_CONSUMER_KEY,
            WORDPRESS_WC_CONSUMER_SECRET
          ),
        },
        next: {
          revalidate: 60,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const bannerItems = await response.json();

      // Transformar al formato MediaItem
      return bannerItems.map((item: any) => ({
        id: item.id,
        title: {
          rendered: item.title || `Banner ${item.id}`,
        },
        source_url: item.source_url,
        alt_text: item.alt_text || item.title || `Banner ${item.id}`,
        media_type: "image",
        date: item.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching banner images:", error);
      throw error;
    }
  }
}
