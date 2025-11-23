"use client";

import { useEffect, useRef } from "react";
import { useProductsStore } from "@/store/useProducts";

interface ProductsProviderProps {
  children: React.ReactNode;
}

export function ProductsProvider({ children }: ProductsProviderProps) {
  const { fetchProducts, isInitialized, products } = useProductsStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Solo inicializar una vez y si no está ya inicializado
    if (!hasInitialized.current && !isInitialized && products.length === 0) {
      hasInitialized.current = true;
      fetchProducts();
    }
  }, [isInitialized, products.length]); // Removido fetchProducts de dependencias

  return <>{children}</>;
}
