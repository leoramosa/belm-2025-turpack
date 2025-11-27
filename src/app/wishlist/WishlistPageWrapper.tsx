"use client";
import React, { useEffect, useState } from "react";
import { FiHeart, FiTrash2, FiShoppingCart } from "react-icons/fi";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import Link from "next/link";
import { IProduct } from "@/types/product";

function formatPrice(
  value: number | string | null,
  currency: string = "PEN"
): string {
  if (value === null || value === undefined) return "S/ 0.00";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "S/ 0.00";
  if (!currency) return `S/ ${numValue.toFixed(2)}`;
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(numValue);
  } catch {
    return `S/ ${numValue.toFixed(2)}`;
  }
}

export default function WishlistPageWrapper() {
  const {
    items,
    removeFromWishlist,
    clearWishlist,
    getWishlistCount,
    loadFromBackend,
  } = useWishlistStore();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(true);

  // Cargar wishlist del backend cuando el componente se monte y el usuario esté autenticado
  useEffect(() => {
    const loadWishlist = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        try {
          console.log("Cargando wishlist en WishlistPageWrapper...");
          await loadFromBackend(true); // Forzar carga del backend
          console.log("Wishlist cargada en WishlistPageWrapper");
        } catch (error) {
          console.error(
            "Error cargando wishlist en WishlistPageWrapper:",
            error
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, [isAuthenticated, loadFromBackend]);

  const handleAddToCart = (product: IProduct) => {
    addToCart(product);
  };

  // Función para determinar si un producto es variable (tiene atributos)
  const isVariableProduct = (product: IProduct) => {
    return product.attributes && product.attributes.length > 0;
  };

  const handleRemoveFromWishlist = (productId: number) => {
    removeFromWishlist(String(productId));
  };

  const handleClearWishlist = () => {
    if (confirm("¿Estás seguro de que quieres limpiar tu lista de deseos?")) {
      clearWishlist();
    }
  };

  const handleAddAllToCart = () => {
    // Solo agregar productos simples al carrito
    const simpleProducts = items.filter(
      (product) => !isVariableProduct(product)
    );
    simpleProducts.forEach((product) => addToCart(product));

    // Mostrar mensaje si hay productos variables que no se pueden agregar
    const variableProducts = items.filter((product) =>
      isVariableProduct(product)
    );
    if (variableProducts.length > 0) {
      alert(
        `Se agregaron ${simpleProducts.length} productos al carrito. ${variableProducts.length} productos variables requieren selección de atributos.`
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 animate-fade-in">
              <FiHeart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Tu lista de deseos está vacía
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Inicia sesión para guardar tus productos favoritos y acceder a
                ellos desde cualquier dispositivo.
              </p>
            </div>
            <Link
              href="/login"
              className="block border-2 border-primary rounded-lg px-4 py-2 mx-auto mt-4 text-primary hover:text-primary-dark transition-colors duration-200"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se carga la wishlist
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 animate-fade-in">
              <FiHeart className="w-24 h-24 text-gray-300 mx-auto mb-4 animate-pulse" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Cargando tu lista de deseos...
              </h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (getWishlistCount() === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 animate-fade-in">
              <FiHeart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Tu lista de deseos está vacía
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Comienza a agregar productos que te gusten a tu lista de deseos.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200"
              >
                <FiShoppingCart className="w-5 h-5 mr-2" />
                Explorar productos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mi Lista de Deseos
              </h1>
              <p className="text-gray-600">
                {getWishlistCount()} producto
                {getWishlistCount() !== 1 ? "s" : ""} en tu lista
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Botones de acción */}
              <button
                onClick={handleAddAllToCart}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
              >
                <FiShoppingCart className="w-4 h-4 mr-2" />
                Agregar todo al carrito
              </button>

              <button
                onClick={handleClearWishlist}
                className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                Limpiar lista
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 animate-fade-in"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden rounded-t-xl">
                <Link href={`/productos/${product.slug}`}>
                  <Image
                    src={
                      product.images && product.images.length > 0
                        ? product.images[0].src
                        : "/logo-belm-v2.png"
                    }
                    alt={
                      product.images && product.images.length > 0
                        ? product.images[0].alt || product.name
                        : product.name
                    }
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Remove from wishlist button */}
                <button
                  onClick={() => handleRemoveFromWishlist(product.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors duration-200"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <Link href={`/productos/${product.slug}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors duration-200">
                    {product.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg text-gray-900">
                    {formatPrice(
                      product.pricing?.price || 0,
                      product.pricing?.currency || "PEN"
                    )}
                  </span>
                  {product.pricing?.regularPrice &&
                    product.pricing.regularPrice >
                      (product.pricing?.price || 0) && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(
                          product.pricing.regularPrice,
                          product.pricing?.currency || "PEN"
                        )}
                      </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {isVariableProduct(product) ? (
                    // Producto variable: Botón "Seleccionar" que va a la página del producto
                    <Link
                      href={`/productos/${product.slug}`}
                      className="flex-1 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center justify-center"
                    >
                      <FiShoppingCart className="w-4 h-4 mr-1" />
                      Seleccionar
                    </Link>
                  ) : (
                    // Producto simple: Botón "Agregar" que agrega al carrito
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors duration-200 flex items-center justify-center"
                    >
                      <FiShoppingCart className="w-4 h-4 mr-1" />
                      Agregar
                    </button>
                  )}

                  <Link
                    href={`/productos/${product.slug}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 flex items-center justify-center"
                  >
                    Ver
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state after removing all items */}
        {getWishlistCount() === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <FiHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              No hay productos en tu lista de deseos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
