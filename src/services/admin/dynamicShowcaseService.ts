import "server-only";

import { getWordpressApiUrl } from "@/services/wordpress";

export interface DynamicShowcaseSlide {
  id: number;
  title: string;
  category_key: string;
  category_name: string;
  source_url: string;
  responsive_url?: string | null;
  alt_text: string;
  showcase_url?: string | null;
  discount_code?: string | null;
  order: number;
  is_default?: boolean;
}

export class DynamicShowcaseService {
  // Obtener dynamic showcases habilitados (igual que FeaturedCategoriesService)
  static async getEnabledDynamicShowcases(): Promise<DynamicShowcaseSlide[]> {
    try {
      const API_URL = getWordpressApiUrl();

      // Usar directamente el endpoint personalizado de WordPress
      const response = await fetch(
        `${API_URL}/wp-json/belm/v1/dynamic-showcases`,
        {
          next: {
            revalidate: 300, // Cache por 5 minutos
            tags: ["dynamic-showcases"],
          },
        }
      );

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const dynamicShowcases = await response.json();

      // Convertir al formato del DynamicShowcase
      const showcaseSlides = dynamicShowcases.map(
        (showcase: Record<string, unknown>) => ({
          id: showcase.id as number,
          title: (showcase.title as string) || "",
          category_key: showcase.category_key as string,
          category_name: (showcase.category_name as string) || "",
          source_url: showcase.source_url as string,
          responsive_url: showcase.responsive_url as string | null,
          alt_text: (showcase.alt_text as string) || "",
          showcase_url: showcase.showcase_url as string,
          discount_code: showcase.discount_code as string,
          order: (showcase.order as number) || 0,
        })
      );

      // Si no hay dynamic showcases habilitados, usar slides por defecto
      if (showcaseSlides.length === 0) {
        return this.getDefaultDynamicShowcases();
      }

      return showcaseSlides;
    } catch (error) {
      console.error("Error fetching enabled dynamic showcases:", error);
      // Retornar slides por defecto en caso de error
      return this.getDefaultDynamicShowcases();
    }
  }

  private static getDefaultDynamicShowcases(): DynamicShowcaseSlide[] {
    return [
      {
        id: 0,
        title: "Cabello",
        category_key: "cabello",
        category_name: "Cabello",
        source_url: "/hair.jpg",
        responsive_url: null,
        alt_text: "Cabello",
        showcase_url: null,
        discount_code: null,
        order: 0,
        is_default: true,
      },
      {
        id: 1,
        title: "Cuidado Corporal",
        category_key: "cuidado-corporal",
        category_name: "Cuidado Corporal",
        source_url: "/body.jpg",
        responsive_url: null,
        alt_text: "Cuidado Corporal",
        showcase_url: null,
        discount_code: null,
        order: 1,
        is_default: true,
      },
      {
        id: 2,
        title: "Cuidado Facial",
        category_key: "cuidado-facial",
        category_name: "Cuidado Facial",
        source_url: "/facial.jpg",
        responsive_url: null,
        alt_text: "Cuidado Facial",
        showcase_url: null,
        discount_code: null,
        order: 2,
        is_default: true,
      },
      {
        id: 3,
        title: "Fragancias",
        category_key: "fragancias",
        category_name: "Fragancias",
        source_url: "/fraga.jpg",
        responsive_url: null,
        alt_text: "Fragancias",
        showcase_url: null,
        discount_code: null,
        order: 3,
        is_default: true,
      },
      {
        id: 4,
        title: "Maquillaje",
        category_key: "maquillaje",
        category_name: "Maquillaje",
        source_url: "/make.jpg",
        responsive_url: null,
        alt_text: "Maquillaje",
        showcase_url: null,
        discount_code: null,
        order: 4,
        is_default: true,
      },
      {
        id: 5,
        title: "Moda y Accesorios",
        category_key: "moda-y-accesorios",
        category_name: "Moda y Accesorios",
        source_url: "/acce.jpg",
        responsive_url: null,
        alt_text: "Moda y Accesorios",
        showcase_url: null,
        discount_code: null,
        order: 5,
        is_default: true,
      },
    ];
  }
}

export default DynamicShowcaseService;
