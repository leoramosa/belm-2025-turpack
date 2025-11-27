"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiHeart, FiUser } from "react-icons/fi";
import { IProduct } from "@/types/product";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface WishlistButtonProps {
  product: IProduct;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function WishlistButton({
  product,
  size = "md",
  showText = false,
  className = "",
}: WishlistButtonProps) {
  // Normalizar ID del producto una vez usando useMemo para evitar recálculos
  const productId = useMemo(() => {
    return typeof product.id === "string"
      ? parseInt(product.id, 10)
      : product.id;
  }, [product.id]);

  // Selector personalizado que calcula isInWishlist reactivamente
  // Esto se actualiza automáticamente cuando items cambia
  const inWishlist = useWishlistStore((state) => {
    return state.items.some((item) => {
      const itemId =
        typeof item.id === "string" ? parseInt(item.id, 10) : item.id;
      return itemId === productId;
    });
  });

  const { addToWishlist, removeFromWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Combinar autenticación con estado de wishlist
  const isInWishlist = isAuthenticated && inWishlist;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleToggleWishlist = () => {
    setIsAnimating(true);

    if (!isAuthenticated) {
      toast.warning(
        "Debes iniciar sesión para agregar productos a tu wishlist. Inicia sesión o regístrate."
      );
      setTimeout(() => setIsAnimating(false), 300);
      return;
    }

    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isAnimating}
      className={`
        relative flex items-center justify-center rounded-full border-2 transition-all duration-200
        transform hover:scale-105 active:scale-95
        ${
          isInWishlist
            ? "bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600"
            : "bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500"
        }
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Icono de corazón con animación */}
      <div className="relative">
        {isInWishlist ? (
          <FiHeart
            key="filled"
            className={`${iconSizes[size]} fill-current transition-all duration-200 transform scale-100`}
          />
        ) : (
          <FiHeart
            key="outline"
            className={`${iconSizes[size]} transition-all duration-200 transform scale-100`}
          />
        )}
      </div>

      {/* Indicador de usuario no logueado */}
      {!isAuthenticated && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center opacity-100 transform scale-100 transition-all duration-300">
          <FiUser className="w-2 h-2 text-white" />
        </div>
      )}

      {/* Texto opcional */}
      {showText && (
        <span className="ml-2 text-sm font-medium">
          {isInWishlist ? "En lista" : "Agregar"}
        </span>
      )}

      {/* Animación de partículas al agregar */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-full bg-red-400 opacity-100 transform scale-100 transition-all duration-300 animate-ping" />
      )}
    </button>
  );
}
