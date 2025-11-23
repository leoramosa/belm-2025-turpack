"use client";

import { useState, useEffect } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "gray";
  text?: string;
  showAfter?: number; // Mostrar después de X ms
}

export default function LoadingSpinner({
  size = "md",
  color = "primary",
  text,
  showAfter = 300,
}: LoadingSpinnerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), showAfter);
    return () => clearTimeout(timer);
  }, [showAfter]);

  if (!show) return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    primary: "text-primary",
    white: "text-white",
    gray: "text-gray-500",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 border-t-current ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && (
        <p className={`mt-2 text-sm ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
}
