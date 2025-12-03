"use client";

import React from "react";
import Link from "next/link";
import { FiX, FiClock, FiEye } from "react-icons/fi";
import { IProduct } from "@/types/product";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import { ProductCard } from "./ProductCard";

interface RecentlyViewedProductsProps {
  currentProductId?: string | number; // Para excluir el producto actual
}

export default function RecentlyViewedProducts({
  currentProductId,
}: RecentlyViewedProductsProps) {
  const { products, removeProduct, clearAll } = useRecentlyViewedStore();

  // Filtrar el producto actual si está en la lista y limitar a 6 productos
  // El store mantiene 7 productos, así que al filtrar el actual siempre quedan 6
  const filteredProducts = products
    .filter((product: IProduct) => {
      if (typeof currentProductId === "string") {
        return product.id.toString() !== currentProductId;
      }
      return product.id !== currentProductId;
    })
    .slice(0, 5); // Limitar a 6 productos máximo para mostrar

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-full">
              <FiClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Vistos recientemente
              </h2>
              <p className="text-gray-600 text-sm">
                Productos que has explorado últimamente
              </p>
            </div>
          </div>

          <button
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors duration-200 flex items-center space-x-1"
          >
            <FiX className="w-4 h-4" />
            <span>Limpiar todo</span>
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="relative group"
              style={{
                animation: `fadeIn 0.5s ease-out ${index * 100}ms forwards`,
              }}
            >
              {/* Usar ProductCard para mostrar el producto */}
              <ProductCard
                product={product}
                viewMode="grid"
                hideWishlistButton={true}
              />

              {/* Remove button - aparece en hover, posicionado en esquina superior derecha con offset para no interferir con wishlist button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeProduct(product.id.toString());
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute top-2 right-2 z-50 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
                aria-label="Remover de vistos recientemente"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {filteredProducts.length >= 4 && (
          <div className="text-center mt-8">
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 bg-white border-2 border-primary text-primary px-6 py-3 rounded-full font-semibold hover:bg-primary hover:text-white transition-all duration-200"
            >
              <span>Ver todos los productos</span>
              <FiEye className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
