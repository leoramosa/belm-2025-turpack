"use client";

import { useEffect, useState } from "react";
import { useLoaderStore } from "@/store/useLoaderStore";
import LoadingSpinner from "./LoadingSpinner";

export default function GlobalLoader() {
  const { isLoading, loadingText } = useLoaderStore();
  const [isMounted, setIsMounted] = useState(false);

  // Asegurar que solo se renderice en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debug: Log cuando cambia el estado
  useEffect(() => {
    if (isMounted) {
      console.log("🔍 GlobalLoader state:", { isLoading, loadingText });
    }
  }, [isMounted, isLoading, loadingText]);

  if (!isMounted || !isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-xl">
        <LoadingSpinner
          size="lg"
          text={loadingText || "Cargando..."}
          showAfter={0}
        />
      </div>
    </div>
  );
}
