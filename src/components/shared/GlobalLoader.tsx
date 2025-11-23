"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalLoaderStore } from "@/store/useGlobalLoaderStore";

export default function GlobalLoader() {
  const pathname = usePathname();
  const { isLoading, loadingText, startLoading, stopLoading } =
    useGlobalLoaderStore();

  useEffect(() => {
    // NO mostrar loader automático para rutas que tienen wrappers específicos o son estáticas
    const hasSpecificWrapper =
      pathname.includes("/product/") ||
      pathname.includes("/categoria/") ||
      pathname.includes("/my-account") ||
      pathname.includes("/orders") ||
      pathname.includes("/checkout") ||
      pathname.includes("/cart") ||
      pathname === "/";

    if (!hasSpecificWrapper) {
      startLoading("Cargando...");

      // Ocultar loader después de un tiempo mínimo
      const timer = setTimeout(() => {
        stopLoading();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname, startLoading, stopLoading]);

  // También mostrar loader en eventos de navegación
  useEffect(() => {
    const handleStart = () => {
      startLoading("Cargando...");
    };

    const handleComplete = () => {
      setTimeout(() => {
        stopLoading();
      }, 300);
    };

    // Escuchar eventos de navegación
    window.addEventListener("beforeunload", handleStart);
    window.addEventListener("load", handleComplete);

    return () => {
      window.removeEventListener("beforeunload", handleStart);
      window.removeEventListener("load", handleComplete);
    };
  }, [startLoading, stopLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-transparent backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center">
            {/* Spinner animado */}
            <div className="relative w-16 h-16 mx-auto mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full"
              />

              {/* Logo en el centro */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Texto de carga */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-600 font-medium"
            >
              {loadingText}
            </motion.p>

            {/* Puntos animados */}
            <div className="flex justify-center gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-primary rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
