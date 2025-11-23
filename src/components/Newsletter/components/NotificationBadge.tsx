"use client";

import { useEffect } from "react";

interface NotificationBadgeProps {
  message: string;
  type: "success" | "warning" | "error";
  onClose: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function NotificationBadge({
  message,
  type,
  onClose,
  autoHide = true,
  duration = 10000,
}: NotificationBadgeProps) {
  // Auto-ocultar mensaje después del tiempo especificado
  useEffect(() => {
    if (autoHide && message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, autoHide, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  const isWarning = type === "warning";

  return (
    <div
      className={`mt-4 px-6 py-3 rounded-xl text-sm font-medium flex items-center justify-between max-w-md mx-auto shadow-xl border backdrop-blur-sm transition-all duration-500 ease-out animate-in slide-in-from-top-3 fade-in-0 zoom-in-95 ${
        isSuccess
          ? "bg-green-500 text-white border-green-500 shadow-lg"
          : isWarning
          ? "bg-amber-400 text-white border-amber-400 shadow-lg"
          : "bg-gray-600 text-white border-gray-600 shadow-lg"
      }`}
      role="alert"
      aria-live="polite"
    >
      {/* Contenido del mensaje */}
      <div className="flex items-center gap-3">
        {/* Icono de estado */}
        <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
          {isSuccess ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : isWarning ? (
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.334-.213 2.986-1.742 2.986H3.48c-1.53 0-2.492-1.652-1.743-2.986L8.257 3.1z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Texto del mensaje */}
        <span className="text-sm font-medium leading-tight">{message}</span>
      </div>

      {/* Botón de cierre */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
        aria-label="Cerrar notificación"
        type="button"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
