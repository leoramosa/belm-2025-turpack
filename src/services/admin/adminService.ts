import { AdminStats, AdminModule } from "@/types/admin";
import type { HeroBannerSlide } from "./heroBannerService";
import type { FeaturedCategorySlide } from "./featuredCategoriesService";

// Función auxiliar server-only para obtener estadísticas
async function getStatsServerOnly(): Promise<AdminStats> {
  const { BannerService } = await import("./bannerService");
  const { HeroBannerService } = await import("./heroBannerService");
  const { FeaturedCategoriesService } = await import(
    "./featuredCategoriesService"
  );

  try {
    // Obtener estadísticas de banners
    const bannerStats = await BannerService.getBannerStats();

    // Obtener banners del hero banner
    let heroBanners: HeroBannerSlide[] = [];
    try {
      heroBanners = await HeroBannerService.getEnabledBanners();
    } catch {
      // Si falla, continuar con array vacío
    }

    // Obtener categorías destacadas
    let featuredCategories: FeaturedCategorySlide[] = [];
    try {
      featuredCategories =
        await FeaturedCategoriesService.getEnabledFeaturedCategories();
    } catch {
      // Si falla, continuar con array vacío
    }

    // FeaturedCategorySlide no tiene isEnabled, todas las que se obtienen del servicio ya están habilitadas
    return {
      totalBanners: bannerStats.total,
      enabledBanners: bannerStats.enabled,
      totalCategories: featuredCategories.length,
      featuredCategories: featuredCategories.length, // Todas están habilitadas si vienen del servicio
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
}

export class AdminService {
  // Obtener estadísticas generales del dashboard (server-only)
  static async getStats(): Promise<AdminStats> {
    return getStatsServerOnly();
  }

  // Obtener módulos disponibles (puede usarse en cliente - no usa server-only)
  static getModules(): AdminModule[] {
    return [
      {
        id: "banners",
        name: "Gestión de Banners",
        path: "/admin/banners",
        icon: "🖼️",
        isActive: true,
      },
      {
        id: "categories",
        name: "Categorías Destacadas",
        path: "/admin/categories",
        icon: "📂",
        isActive: false, // Por implementar
      },
      {
        id: "products",
        name: "Gestión de Productos",
        path: "/admin/products",
        icon: "🛍️",
        isActive: false, // Por implementar
      },
      {
        id: "coupons",
        name: "Cupones de Descuento",
        path: "/admin/coupons",
        icon: "🎫",
        isActive: false, // Por implementar
      },
    ];
  }

  // Verificar si el usuario es administrador (server-only)
  static async isAdmin(): Promise<boolean> {
    // TODO: Implementar verificación real de autenticación
    // Por ahora permitimos acceso sin autenticación
    return true;
  }
}
