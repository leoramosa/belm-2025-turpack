/**
 * Servicio para manejar la configuración de envío gratuito
 */

export interface FreeShippingConfig {
  enabled: boolean;
  threshold: number;
  method_title: string;
  zone_name: string;
  zone_id: number | null;
  currency: string;
  currency_symbol: string;
  cart?: {
    subtotal: number;
    qualifies_for_free_shipping: boolean;
    remaining_for_free_shipping: number;
  };
}

export interface FreeShippingCalculation {
  qualifies_for_free_shipping: boolean;
  subtotal: number;
  threshold: number;
  remaining: number;
  method_title: string;
  zone_name: string;
  enabled: boolean;
  currency: string;
}

class FreeShippingService {
  private cache: FreeShippingConfig | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos (aumentado porque la configuración rara vez cambia)

  /**
   * Obtener configuración de envío gratuito desde el backend
   */
  async getFreeShippingConfig(
    includeCart: boolean = false
  ): Promise<FreeShippingConfig> {
    const now = Date.now();

    // Verificar cache
    if (this.cache && now - this.cacheTime < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const url = `/api/shipping/free-shipping-config${
        includeCart ? "?include_cart=true" : ""
      }`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const config = await response.json();

      // Actualizar cache
      this.cache = config;
      this.cacheTime = now;

      return config;
    } catch (error) {
      console.error("Error fetching free shipping config:", error);

      // Retornar configuración por defecto en caso de error
      return {
        enabled: false,
        threshold: 0,
        method_title: "Envío gratuito",
        zone_name: "",
        zone_id: null,
        currency: "PEN",
        currency_symbol: "S/",
      };
    }
  }

  /**
   * Calcular si un subtotal califica para envío gratuito
   */
  async calculateFreeShipping(
    subtotal: number
  ): Promise<FreeShippingCalculation> {
    // Usar cache si está disponible (no hacer nueva llamada si ya tenemos la config)
    const config = this.cache || (await this.getFreeShippingConfig());

    const qualifies = config.enabled && subtotal >= config.threshold;
    const remaining = config.enabled
      ? Math.max(0, config.threshold - subtotal)
      : 0;

    return {
      qualifies_for_free_shipping: qualifies,
      subtotal,
      threshold: config.threshold,
      remaining,
      method_title: config.method_title,
      zone_name: config.zone_name,
      enabled: config.enabled,
      currency: config.currency_symbol,
    };
  }

  /**
   * Obtener el costo de envío considerando envío gratuito
   */
  async getShippingCost(
    subtotal: number,
    originalShippingCost: number
  ): Promise<{ cost: number; isFree: boolean; reason?: string }> {
    const config = await this.getFreeShippingConfig();

    if (!config.enabled) {
      return {
        cost: originalShippingCost,
        isFree: false,
      };
    }

    if (subtotal >= config.threshold) {
      return {
        cost: 0,
        isFree: true,
        reason: `Envío gratuito aplicado (pedido ≥ ${config.currency_symbol}${config.threshold})`,
      };
    }

    return {
      cost: originalShippingCost,
      isFree: false,
      reason: `Faltan ${config.currency_symbol}${(
        config.threshold - subtotal
      ).toFixed(2)} para envío gratuito`,
    };
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTime = 0;
  }

  /**
   * Verificar si el cache es válido
   */
  isCacheValid(): boolean {
    const now = Date.now();
    return this.cache !== null && now - this.cacheTime < this.CACHE_DURATION;
  }

  /**
   * Obtener estado del cache
   */
  getCacheStatus(): { hasCache: boolean; age: number } {
    const now = Date.now();
    return {
      hasCache: this.cache !== null,
      age: this.cache ? now - this.cacheTime : 0,
    };
  }
}

// Instancia singleton
export const freeShippingService = new FreeShippingService();

// Funciones de conveniencia
export const getFreeShippingConfig = (includeCart?: boolean) =>
  freeShippingService.getFreeShippingConfig(includeCart);

export const calculateFreeShipping = (subtotal: number) =>
  freeShippingService.calculateFreeShipping(subtotal);

export const getShippingCost = (subtotal: number, originalCost: number) =>
  freeShippingService.getShippingCost(subtotal, originalCost);

export const clearFreeShippingCache = () => freeShippingService.clearCache();
