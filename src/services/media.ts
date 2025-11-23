import "server-only";

import {
  buildBasicAuthHeader,
  getWordpressApiUrl,
  getWordpressConsumerKey,
  getWordpressConsumerSecret,
} from "@/services/wordpress";

const WORDPRESS_API_URL = getWordpressApiUrl();
const WORDPRESS_WC_CONSUMER_KEY = getWordpressConsumerKey();
const WORDPRESS_WC_CONSUMER_SECRET = getWordpressConsumerSecret();

export interface MediaItem {
  id: number;
  title: {
    rendered: string;
  };
  source_url: string;
  media_type: string;
  alt_text: string;
  date: string;
  // Campos adicionales del backend de banners
  is_enabled?: boolean;
  banner_url?: string;
  discount_code?: string;
  order?: number;
  responsive_url?: string | null;
}

export interface CategoryShowcase {
  mediaItem: MediaItem;
  categoryName: string;
  categorySlug: string;
}

export interface BannerShowcase {
  mediaItem: MediaItem;
  bannerName: string;
  bannerType: "category" | "product" | "general";
  bannerSlug: string;
  bannerUrl?: string;
  discountCode?: string;
  order?: number;
  responsiveUrl?: string | null;
}

// Cache global singleton para media (compartido entre server y client)
class MediaCache {
  private static instance: MediaCache;
  private bannerCache: MediaItem[] = [];
  private bannerCacheTime: number = 0;
  private categoryCache: MediaItem[] = [];
  private categoryCacheTime: number = 0;
  private categoryFetchingPromise: Promise<MediaItem[]> | null = null;
  private bannerFetchingPromise: Promise<MediaItem[]> | null = null;

  // Cache de 5 minutos para categorías
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  private constructor() {}

  public static getInstance(): MediaCache {
    if (!MediaCache.instance) {
      MediaCache.instance = new MediaCache();
    }
    return MediaCache.instance;
  }

  public async getCategoryImages(): Promise<MediaItem[]> {
    const now = Date.now();

    // Si tenemos cache válido, retornarlo
    if (
      this.categoryCache.length > 0 &&
      now - this.categoryCacheTime < this.CACHE_DURATION
    ) {
      console.log("📦 MediaCache.getCategoryImages: Usando cache");
      return this.categoryCache;
    }

    // Si ya hay un fetch en progreso, esperar
    if (this.categoryFetchingPromise) {
      console.log(
        "⏳ MediaCache.getCategoryImages: Esperando fetch en progreso"
      );
      return this.categoryFetchingPromise;
    }

    // Iniciar nuevo fetch
    this.categoryFetchingPromise = this.fetchCategoryImages();
    try {
      const images = await this.categoryFetchingPromise;
      // Actualizar cache
      this.categoryCache = images;
      this.categoryCacheTime = now;
      return images;
    } finally {
      this.categoryFetchingPromise = null;
    }
  }

  public async getBannerImages(): Promise<MediaItem[]> {
    // SIN CACHE - Siempre obtener datos frescos del backend
    // para reflejar cambios inmediatos en la configuración
    console.log(
      "🔄 MediaCache.getBannerImages: Obteniendo datos frescos (sin cache)"
    );
    return this.fetchBannerImages();
  }

  private async fetchCategoryImages(): Promise<MediaItem[]> {
    try {
      console.log("🌐 MediaCache.fetchCategoryImages: Iniciando...");
      // Obtener TODAS las imágenes de categorías con paginación automática
      const allMediaItems: MediaItem[] = [];
      let page = 1;
      const perPage = 50;

      while (true) {
        const endpoint = `${WORDPRESS_API_URL}/wp-json/wp/v2/media?search=categoria-&media_type=image&per_page=${perPage}&page=${page}`;

        const response = await fetch(endpoint, {
          headers: {
            "Content-Type": "application/json",
            Authorization: buildBasicAuthHeader(
              WORDPRESS_WC_CONSUMER_KEY,
              WORDPRESS_WC_CONSUMER_SECRET
            ),
          },
          next: {
            revalidate: 300,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const mediaItems = (await response.json()) as MediaItem[];

        if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
          // No más imágenes en esta página
          break;
        }

        allMediaItems.push(...mediaItems);

        // Si esta página tiene menos imágenes que el límite, es la última página
        if (mediaItems.length < perPage) {
          break;
        }

        page++;
      }

      return allMediaItems;
    } catch (error) {
      console.error("Error fetching category images:", error);
      return [];
    }
  }

  private async fetchBannerImages(): Promise<MediaItem[]> {
    try {
      console.log(
        "🌐 MediaCache.fetchBannerImages: Obteniendo banners del backend..."
      );

      // Interfaz para los datos que devuelve el endpoint de banners del backend
      interface BackendBannerItem {
        id: number;
        title: string;
        source_url: string;
        alt_text: string;
        is_enabled: boolean;
        banner_url: string;
        discount_code: string;
        order: number;
        created_at: string;
        updated_at: string;
      }

      // Llamar directamente al endpoint del backend
      const endpoint = `${WORDPRESS_API_URL}/wp-json/belm/v1/banners`;

      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: buildBasicAuthHeader(
            WORDPRESS_WC_CONSUMER_KEY,
            WORDPRESS_WC_CONSUMER_SECRET
          ),
        },
        // Sin cache - siempre datos frescos
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const bannerItems = (await response.json()) as BackendBannerItem[];

      if (!Array.isArray(bannerItems)) {
        console.warn("MediaCache.fetchBannerImages: Respuesta no es un array");
        return [];
      }

      // Transformar a formato MediaItem compatible con el frontend existente
      const mediaItems: MediaItem[] = bannerItems.map((item) => ({
        id: item.id,
        title: {
          rendered: item.title,
        },
        source_url: item.source_url,
        alt_text: item.alt_text,
        media_type: "image",
        date: item.created_at,
        // Campos adicionales del backend
        is_enabled: item.is_enabled,
        banner_url: item.banner_url,
        discount_code: item.discount_code,
        order: item.order,
      }));

      console.log(
        `🎯 MediaCache.fetchBannerImages: Obtenidos ${mediaItems.length} banners`
      );
      return mediaItems;
    } catch (error) {
      console.error("Error fetching banner images:", error);
      return [];
    }
  }

  public clearCache(): void {
    this.bannerCache = [];
    this.bannerCacheTime = 0;
    this.categoryCache = [];
    this.categoryCacheTime = 0;
  }
}

/**
 * Obtiene todas las imágenes que empiecen con "categoria-" desde WordPress Media
 */
export async function getCategoryImages(): Promise<MediaItem[]> {
  return MediaCache.getInstance().getCategoryImages();
}

/**
 * Obtiene todas las imágenes que empiecen con "banner_" desde WordPress Media
 */
export async function getBannerImages(): Promise<MediaItem[]> {
  return MediaCache.getInstance().getBannerImages();
}

/**
 * Limpia el cache de imágenes de categorías
 */
export function clearMediaCache(): void {
  MediaCache.getInstance().clearCache();
}

/**
 * Fuerza una recarga de las imágenes de categorías
 */
export async function refreshCategoryImages(): Promise<MediaItem[]> {
  clearMediaCache();
  return getCategoryImages();
}

/**
 * Extrae el nombre de la categoría desde el título del archivo
 * Ejemplo: "categoria-maquillaje.jpg" → "maquillaje"
 */
export function extractCategoryFromTitle(title: string): string {
  // Extraer de formato "categoria-nombre-categoria.extension"
  const match = title.match(/categoria-(.+)\.(jpg|jpeg|png|webp)$/i);
  if (match) {
    return match[1].replace(/-/g, " ").toLowerCase();
  }

  // Fallback: buscar después de "categoria-"
  const fallbackMatch = title.toLowerCase().match(/categoria-(.+)/);
  if (fallbackMatch) {
    return fallbackMatch[1].replace(/[-_]/g, " ").trim();
  }

  return "";
}

/**
 * Extrae el nombre del banner desde el título del archivo
 * Ejemplo: "banner_maquillaje.jpg" → "maquillaje"
 * Ejemplo: "banner_producto_especifico.jpg" → "producto_especifico"
 * Ejemplo: "banner-123.jpg" → "banner 123"
 * Ejemplo: "banner-456.png" → "banner 456"
 * Ejemplo: "banner-1" → "banner 1" (sin extensión)
 */
export function extractBannerFromTitle(title: string): {
  name: string;
  type: "category" | "product" | "general";
} {
  // Primero intentar con extensión: "banner_nombre.extension" o "banner-nombre.extension"
  const matchWithExtension = title.match(
    /banner[-_](.+)\.(jpg|jpeg|png|webp)$/i
  );
  if (matchWithExtension) {
    const bannerName = matchWithExtension[1]
      .replace(/[-_]/g, " ")
      .toLowerCase()
      .trim();
    return processBannerName(bannerName);
  }

  // Luego intentar sin extensión: "banner-nombre" o "banner_nombre"
  const matchWithoutExtension = title.match(/banner[-_](.+)$/i);
  if (matchWithoutExtension) {
    const bannerName = matchWithoutExtension[1]
      .replace(/[-_]/g, " ")
      .toLowerCase()
      .trim();
    return processBannerName(bannerName);
  }

  // Si el título es exactamente "banner" o "banner-1", "banner-2", etc.
  if (title.toLowerCase() === "banner") {
    return { name: "banner general", type: "general" };
  }

  const exactMatch = title.match(/^banner-?(\d+)$/i);
  if (exactMatch) {
    return { name: `banner ${exactMatch[1]}`, type: "general" };
  }

  return { name: "", type: "general" };
}

/**
 * Procesa el nombre del banner para determinar su tipo
 */
function processBannerName(bannerName: string): {
  name: string;
  type: "category" | "product" | "general";
} {
  // Si solo contiene números, es un banner general
  if (/^\d+$/.test(bannerName)) {
    return { name: `banner ${bannerName}`, type: "general" };
  }

  let type: "category" | "product" | "general" = "general";

  if (bannerName.includes("categoria") || bannerName.includes("category")) {
    type = "category";
  } else if (
    bannerName.includes("producto") ||
    bannerName.includes("product")
  ) {
    type = "product";
  }

  return { name: bannerName, type };
}

/**
 * Convierte nombre de categoría a slug
 * Ejemplo: "cuidado facial" → "cuidado-facial"
 */
export function categoryNameToSlug(categoryName: string): string {
  return categoryName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

/**
 * Procesa las imágenes de categorías y las convierte en datos útiles para showcase
 */
export async function getCategoryShowcases(): Promise<CategoryShowcase[]> {
  try {
    const mediaItems = await getCategoryImages();

    const showcases: CategoryShowcase[] = mediaItems
      .map((item) => {
        const categoryName = extractCategoryFromTitle(item.title.rendered);

        if (!categoryName) {
          return null;
        }

        return {
          mediaItem: item,
          categoryName,
          categorySlug: categoryNameToSlug(categoryName),
        };
      })
      .filter((item): item is CategoryShowcase => item !== null);

    return showcases;
  } catch (error) {
    console.error("Error processing category showcases:", error);
    return [];
  }
}

/**
 * Procesa las imágenes de banners y las convierte en datos útiles para HeroBanner
 */
export async function getBannerShowcases(): Promise<BannerShowcase[]> {
  try {
    const mediaItems = await getBannerImages();

    const showcases = mediaItems
      .map((item) => {
        const { name: bannerName, type: bannerType } = extractBannerFromTitle(
          item.title.rendered
        );

        if (!bannerName) {
          return null;
        }

        return {
          mediaItem: item,
          bannerName,
          bannerType,
          bannerSlug: categoryNameToSlug(bannerName),
          // Campos adicionales del backend
          bannerUrl: item.banner_url || undefined,
          discountCode: item.discount_code || undefined,
          order: item.order || undefined,
          responsiveUrl: item.responsive_url || null,
        } as BannerShowcase;
      })
      .filter((item): item is BannerShowcase => item !== null);

    // Ordenar por el campo 'order' del backend si está disponible
    showcases.sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });

    console.log(
      `🎯 getBannerShowcases: Procesados ${showcases.length} banners`
    );
    return showcases;
  } catch (error) {
    console.error("Error processing banner showcases:", error);
    return [];
  }
}
