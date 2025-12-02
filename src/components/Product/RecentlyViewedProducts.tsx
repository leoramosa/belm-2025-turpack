"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FiX, FiEye, FiClock } from "react-icons/fi";
import { IProduct } from "@/types/product";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import { useCartStore } from "@/store/useCartStore";

interface RecentlyViewedProductsProps {
  currentProductId?: string | number; // Para excluir el producto actual
}

export default function RecentlyViewedProducts({
  currentProductId,
}: RecentlyViewedProductsProps) {
  const { products, removeProduct, clearAll } = useRecentlyViewedStore();
  const { addToCart } = useCartStore();

  // Debug: verificar que el store funciona

  // Filtrar el producto actual si está en la lista y limitar a 6 productos
  // El store mantiene 7 productos, así que al filtrar el actual siempre quedan 6
  const filteredProducts = products
    .filter((product: IProduct) => {
      if (typeof currentProductId === "string") {
        return product.id.toString() !== currentProductId;
      }
      return product.id !== currentProductId;
    })
    .slice(0, 6); // Limitar a 6 productos máximo para mostrar

  if (filteredProducts.length === 0) {
    return null;
  }

  const handleAddToCart = (product: IProduct) => {
    addToCart(product);
  };

  return (
    <section className="py-16 bg-gray-50">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group relative opacity-100 transform translate-y-0"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Remove button */}
              <button
                onClick={() => removeProduct(product.id.toString())}
                className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <FiX className="w-3 h-3" />
              </button>

              {/* Product Image */}
              <Link href={`/productos/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-t-xl">
                  <Image
                    src={
                      product.images && product.images.length > 0
                        ? product.images[0].src
                        : "/logo-belm-v2.png"
                    }
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                </div>
              </Link>

              {/* Product Info */}
              <div className="p-3">
                <Link href={`/productos/${product.slug}`}>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
                    {product.name}
                  </h3>
                </Link>

                {(() => {
                  // Determinar precio a mostrar (similar a ProductCard)
                  const isVariableProduct =
                    product.variations && product.variations.length > 0;
                  const firstVariation =
                    isVariableProduct && product.variations?.[0]
                      ? product.variations[0]
                      : null;

                  let displayPrice: number | null = null;
                  let displayRegularPrice: number | null = null;

                  if (isVariableProduct && firstVariation) {
                    // Producto variable: usar precio de la primera variación
                    if (
                      firstVariation.salePrice !== null &&
                      firstVariation.regularPrice !== null
                    ) {
                      displayPrice = firstVariation.salePrice;
                      displayRegularPrice = firstVariation.regularPrice;
                    } else if (firstVariation.price !== null) {
                      displayPrice = firstVariation.price;
                      displayRegularPrice = firstVariation.regularPrice;
                    }
                  } else if (product.pricing) {
                    // Producto simple: usar pricing del producto
                    displayPrice = product.pricing.price;
                    displayRegularPrice = product.pricing.regularPrice;
                  }

                  const hasDiscount =
                    displayRegularPrice !== null &&
                    displayPrice !== null &&
                    displayRegularPrice > displayPrice;

                  return (
                    <div className="flex items-center justify-between mb-3">
                      {displayPrice !== null ? (
                        <span className="font-bold text-primary text-sm">
                          S/ {displayPrice.toFixed(2)}
                        </span>
                      ) : (
                        <span className="font-bold text-primary text-xs">
                          Precio no disponible
                        </span>
                      )}
                      {hasDiscount && displayRegularPrice !== null && (
                        <span className="text-xs text-gray-500 line-through">
                          S/ {displayRegularPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  <FiEye className="w-3 h-3" />
                  <span>Ver producto</span>
                </button>
              </div>
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
