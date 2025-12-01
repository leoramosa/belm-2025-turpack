"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import LoadingSpinner from "./LoadingSpinner";

export default function PageTransitionLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    // Mostrar loader solo en navegaciones entre categorías
    if (pathname.includes("/categorias/")) {
      setIsLoading(true);
      setLoadingText("Cargando categoría...");

      // Ocultar después de un tiempo mínimo para evitar parpadeos
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-xl">
        <LoadingSpinner size="lg" text={loadingText} showAfter={0} />
      </div>
    </div>
  );
}
