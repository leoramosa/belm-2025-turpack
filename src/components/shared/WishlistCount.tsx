"use client";

import { useWishlistStore } from "@/store/useWishlistStore";
import { memo, useState, useEffect } from "react";
// import { useAuth } from "@/hooks/useAuth"; // Ocultado temporalmente para uso futuro

const WishlistCount = memo(function WishlistCount() {
  // Suscribirse a items para reactividad
  const items = useWishlistStore((state) => state.items);
  // const { isAuthenticated } = useAuth(); // Ocultado temporalmente para uso futuro
  const isAuthenticated = true; // Temporal: mostrar siempre hasta implementar useAuth

  const count = items.length;
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Animar entrada y salida
  useEffect(() => {
    if (count > 0 && isAuthenticated) {
      setShouldRender(true);
      // Pequeño delay para trigger de animación
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Esperar a que termine la animación de salida antes de desmontar
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count, isAuthenticated]);

  if (!shouldRender) {
    return null;
  }

  return (
    <span
      className={`absolute top-0 right-0 z-50 bg-primary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border border-white transition-all duration-300 ease-out ${
        isVisible
          ? "scale-100 opacity-100 rotate-0"
          : "scale-0 opacity-0 rotate-180"
      } hover:scale-125 hover:rotate-[360deg] active:scale-90`}
    >
      {count}
    </span>
  );
});

export default WishlistCount;
