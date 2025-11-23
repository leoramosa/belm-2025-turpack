import "server-only";

import { getWordpressApiUrl } from "@/services/wordpress";

export interface HeroBannerSlide {
  id: string;
  image: string;
  alt: string;
  url?: string;
  discountCode?: string;
  order: number;
  responsive_url?: string | null;
}

export class HeroBannerService {
  // Obtener banners habilitados para el HeroBanner
  static async getEnabledBanners(): Promise<HeroBannerSlide[]> {
    try {
      const API_URL = getWordpressApiUrl();

      // Usar directamente el endpoint personalizado de WordPress
      const response = await fetch(`${API_URL}/wp-json/belm/v1/banners`, {
        next: {
          revalidate: 60,
        },
      });

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const banners = await response.json();

      // Convertir al formato del HeroBanner
      const heroBanners = banners.map((banner: Record<string, unknown>) => ({
        id: (banner.id as number).toString(),
        image: banner.source_url as string,
        alt: (banner.alt_text as string) || (banner.title as string),
        url: banner.banner_url as string,
        discountCode: banner.discount_code as string,
        order: (banner.order as number) || 0,
        responsive_url: banner.responsive_url as string | null,
      }));

      // Si no hay banners habilitados, usar slides por defecto
      if (heroBanners.length === 0) {
        return [
          {
            id: "default-1",
            image: "/banner.jpg",
            alt: "Banner principal",
            order: 0,
          },
        ];
      }

      return heroBanners;
    } catch (error) {
      console.error("Error fetching enabled banners:", error);
      // Retornar slides por defecto en caso de error
      return [
        {
          id: "default-1",
          image: "/banner.jpg",
          alt: "Banner principal",
          order: 0,
        },
      ];
    }
  }
}
