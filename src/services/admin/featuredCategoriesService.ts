import "server-only";

import { getWordpressApiUrl } from "@/services/wordpress";

export interface FeaturedCategorySlide {
  id: string;
  image: string;
  alt: string;
  name: string;
  url?: string;
  discountCode?: string;
  order: number;
  responsive_url?: string | null;
}

export class FeaturedCategoriesService {
  // Obtener featured categories habilitados
  static async getEnabledFeaturedCategories(): Promise<
    FeaturedCategorySlide[]
  > {
    try {
      const API_URL = getWordpressApiUrl();

      // Usar directamente el endpoint personalizado de WordPress
      const response = await fetch(
        `${API_URL}/wp-json/belm/v1/featured-categories`,
        {
          next: {
            revalidate: 60,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const featuredCategories = await response.json();

      // Convertir al formato del FeaturedCategories
      const featuredSlides = featuredCategories.map(
        (featured: Record<string, unknown>) => ({
          id: (featured.id as number).toString(),
          image: featured.source_url as string,
          alt: (featured.alt_text as string) || (featured.title as string),
          name: (featured.category_name as string) || "",
          url: featured.featured_url as string,
          discountCode: featured.discount_code as string,
          order: (featured.order as number) || 0,
          responsive_url: featured.responsive_url as string | null,
        })
      );

      // Si no hay featured categories habilitados, usar slides por defecto
      if (featuredSlides.length === 0) {
        return [
          {
            id: "default-1",
            image: "/hair.jpg",
            alt: "Cabello",
            name: "Cabello",
            order: 0,
          },
          {
            id: "default-2",
            image: "/body.jpg",
            alt: "Cuidado Corporal",
            name: "Cuidado Corporal",
            order: 1,
          },
          {
            id: "default-3",
            image: "/facial.jpg",
            alt: "Cuidado Facial",
            name: "Cuidado Facial",
            order: 2,
          },
          {
            id: "default-4",
            image: "/fraga.jpg",
            alt: "Fragancias",
            name: "Fragancias",
            order: 3,
          },
          {
            id: "default-5",
            image: "/make.jpg",
            alt: "Maquillaje",
            name: "Maquillaje",
            order: 4,
          },
          {
            id: "default-6",
            image: "/acce.jpg",
            alt: "Moda y Accesorios",
            name: "Moda y Accesorios",
            order: 5,
          },
        ];
      }

      return featuredSlides;
    } catch (error) {
      console.error("Error fetching enabled featured categories:", error);
      // Retornar slides por defecto en caso de error
      return [
        {
          id: "default-1",
          image: "/hair.jpg",
          alt: "Cabello",
          name: "Cabello",
          order: 0,
        },
        {
          id: "default-2",
          image: "/body.jpg",
          alt: "Cuidado Corporal",
          name: "Cuidado Corporal",
          order: 1,
        },
        {
          id: "default-3",
          image: "/facial.jpg",
          alt: "Cuidado Facial",
          name: "Cuidado Facial",
          order: 2,
        },
        {
          id: "default-4",
          image: "/fraga.jpg",
          alt: "Fragancias",
          name: "Fragancias",
          order: 3,
        },
        {
          id: "default-5",
          image: "/make.jpg",
          alt: "Maquillaje",
          name: "Maquillaje",
          order: 4,
        },
        {
          id: "default-6",
          image: "/acce.jpg",
          alt: "Moda y Accesorios",
          name: "Moda y Accesorios",
          order: 5,
        },
      ];
    }
  }
}
