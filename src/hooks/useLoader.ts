import { useLoaderStore } from "@/store/useLoaderStore";
import { useCallback } from "react";

/**
 * Hook para manejar el loader global
 *
 * @example
 * const { showLoader, hideLoader, withLoader } = useLoader();
 *
 * // Mostrar loader manualmente
 * showLoader("Cargando productos...");
 * // ... hacer algo
 * hideLoader();
 *
 * // O usar withLoader para mostrar/ocultar automáticamente
 * await withLoader(async () => {
 *   const products = await fetchProducts();
 *   return products;
 * }, "Cargando productos...");
 */
export function useLoader() {
  const { showLoader, hideLoader } = useLoaderStore();

  const withLoader = useCallback(
    async <T>(asyncFn: () => Promise<T>, loadingText?: string): Promise<T> => {
      try {
        showLoader(loadingText);
        const result = await asyncFn();
        return result;
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  return {
    showLoader,
    hideLoader,
    withLoader,
  };
}
