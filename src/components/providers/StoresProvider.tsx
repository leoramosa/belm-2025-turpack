"use client";

import { useEffect, useRef } from "react";
import { useCategories } from "@/store/useCategories";
import { useProducts } from "@/store/useProducts";

interface StoresProviderProps {
  children: React.ReactNode;
}

export default function StoresProvider({ children }: StoresProviderProps) {
  const {
    refetch: fetchCategories,
    isInitialized: categoriesInitialized,
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const {
    refetch: fetchProducts,
    isInitialized: productsInitialized,
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();

  const hasInitialized = useRef(false);

  useEffect(() => {
    // Solo inicializar una vez
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Inicializar stores en paralelo solo si no están inicializados y no tienen datos
    if (
      !categoriesInitialized &&
      !categoriesLoading &&
      categories.length === 0
    ) {
      fetchCategories().catch((error: unknown) => {
        console.error("Error inicializando categorías:", error);
      });
    }

    if (
      !productsInitialized &&
      !productsLoading &&
      products.length === 0
    ) {
      fetchProducts().catch((error: unknown) => {
        console.error("Error inicializando productos:", error);
      });
    }
  }, [
    categoriesInitialized,
    productsInitialized,
    categoriesLoading,
    productsLoading,
    categories.length,
    products.length,
  ]);

  // Log de errores solo si existen
  useEffect(() => {
    if (categoriesError) {
      console.error("Error en store de categorías:", categoriesError);
    }
    if (productsError) {
      console.error("Error en store de productos:", productsError);
    }
  }, [categoriesError, productsError]);

  return <>{children}</>;
}
