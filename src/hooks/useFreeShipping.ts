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
      // Limpiar cache antes de calcular para asegurar valores frescos
      freeShippingService.clearCache();
      const calc = await freeShippingService.calculateFreeShipping(
        currentSubtotal
      );

      console.log("📦 Shipping calculation result:", {
        subtotal: currentSubtotal,
        qualifies: calc.qualifies_for_free_shipping,
        threshold: calc.threshold,
      });

      setCalculation(calc);
    } catch (err) {
      console.error("Error calculating shipping:", err);
      // En caso de error, resetear el cálculo
      setCalculation(null);
    }
  }, []);

  // Cargar configuración al montar el componente (solo una vez)
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar, no en cada render

  // Recalcular cuando cambie el subtotal (con debounce para evitar llamadas excesivas)
  useEffect(() => {
    // Solo recalcular si el subtotal es válido y mayor o igual a 0
    if (subtotal < 0 || isNaN(subtotal)) return;

    // Debounce: esperar 1 segundo antes de recalcular para evitar llamadas excesivas
    // Solo recalcular si el subtotal cambió significativamente
    const timeoutId = setTimeout(() => {
      calculateShipping(subtotal);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [subtotal, calculateShipping]);

  // Valores calculados
  const qualifiesForFreeShipping = useMemo(() => {
    // Asegurar que el subtotal sea un número válido
    const validSubtotal =
      typeof subtotal === "number" && !isNaN(subtotal) ? subtotal : 0;
    const validThreshold =
      typeof config.threshold === "number" && !isNaN(config.threshold)
        ? config.threshold
        : 0;
    const qualifies = config.enabled && validSubtotal >= validThreshold;
    console.log("🔄 Qualifies calculation:", {
      configEnabled: config.enabled,
      subtotal: validSubtotal,
      threshold: validThreshold,
      qualifies,
      calculation: calculation?.qualifies_for_free_shipping,
    });
    // Si hay un cálculo del backend, usarlo como fuente de verdad
    if (calculation !== null) {
      return calculation.qualifies_for_free_shipping;
    }
    return qualifies;
  }, [config.enabled, config.threshold, subtotal, calculation]);

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
