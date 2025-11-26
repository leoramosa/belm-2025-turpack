import { useState, useEffect, useCallback, useMemo } from "react";
import {
  freeShippingService,
  FreeShippingConfig,
  FreeShippingCalculation,
} from "@/services/freeShipping";

export interface UseFreeShippingReturn {
  config: FreeShippingConfig;
  isLoading: boolean;
  error: string | null;
  qualifiesForFreeShipping: boolean;
  remainingForFreeShipping: number;
  shippingCost: number;
  isFreeShipping: boolean;
  calculation: FreeShippingCalculation | null;
  refresh: () => Promise<void>;
  calculateShipping: (subtotal: number) => Promise<void>;
}

export function useFreeShipping(
  subtotal: number = 0,
  originalShippingCost: number = 0
): UseFreeShippingReturn {
  const [config, setConfig] = useState<FreeShippingConfig>({
    enabled: false,
    threshold: 0,
    method_title: "Envío gratuito",
    zone_name: "",
    zone_id: null,
    currency: "PEN",
    currency_symbol: "S/",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculation, setCalculation] =
    useState<FreeShippingCalculation | null>(null);

  // Función para cargar la configuración
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newConfig = await freeShippingService.getFreeShippingConfig();
      setConfig(newConfig);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("Error loading free shipping config:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para calcular el costo de envío
  const calculateShipping = useCallback(async (currentSubtotal: number) => {
    try {
      const calc = await freeShippingService.calculateFreeShipping(
        currentSubtotal
      );

      setCalculation(calc);
    } catch (err) {
      console.error("Error calculating shipping:", err);
    }
  }, []);

  // Cargar configuración al montar el componente
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Recalcular cuando cambie el subtotal
  useEffect(() => {
    if (subtotal > 0) {
      calculateShipping(subtotal);
    }
  }, [subtotal, calculateShipping]);

  // Valores calculados
  const qualifiesForFreeShipping = useMemo(() => {
    const qualifies = config.enabled && subtotal >= config.threshold;
    console.log("Qualifies calculation:", {
      configEnabled: config.enabled,
      subtotal,
      threshold: config.threshold,
      qualifies,
    });
    return qualifies;
  }, [config.enabled, config.threshold, subtotal]);

  const remainingForFreeShipping = useMemo(() => {
    if (!config.enabled || qualifiesForFreeShipping) {
      return 0;
    }
    return Math.max(0, config.threshold - subtotal);
  }, [config.enabled, config.threshold, qualifiesForFreeShipping, subtotal]);

  const shippingCost = useMemo(() => {
    if (!config.enabled) {
      return originalShippingCost;
    }

    // Debug logs
    console.log("Free Shipping Debug:", {
      subtotal,
      threshold: config.threshold,
      qualifiesForFreeShipping,
      originalShippingCost,
      config,
    });

    return qualifiesForFreeShipping ? 0 : originalShippingCost;
  }, [config, qualifiesForFreeShipping, originalShippingCost, subtotal]);

  const isFreeShipping = useMemo(() => {
    return qualifiesForFreeShipping;
  }, [qualifiesForFreeShipping]);

  return {
    config,
    isLoading,
    error,
    qualifiesForFreeShipping,
    remainingForFreeShipping,
    shippingCost,
    isFreeShipping,
    calculation,
    refresh,
    calculateShipping,
  };
}
