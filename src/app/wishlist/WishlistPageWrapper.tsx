"use client";
import React from "react";
import { FiHeart, FiTrash2, FiShoppingCart } from "react-icons/fi";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { ProductCard } from "@/components/Product/ProductCard";

export default function WishlistPageWrapper() {
  const { items, removeFromWishlist, clearWishlist, getWishlistCount } =
    useWishlistStore();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCartStore();

  const handleRemoveFromWishlist = (productId: string | number) => {
    removeFromWishlist(String(productId));
  };

  const handleClearWishlist = () => {
    if (confirm("¿Estás seguro de que quieres limpiar tu lista de deseos?")) {
      clearWishlist();
    }
  };

  const handleAddAllToCart = () => {
    // Solo agregar productos simples al carrito (productos sin variaciones)
    const simpleProducts = items.filter(
      (product) => !product.variations || product.variations.length === 0
    );
    simpleProducts.forEach((product) => addToCart(product));

    // Mostrar mensaje si hay productos variables que no se pueden agregar
    const variableProducts = items.filter(
      (product) => product.variations && product.variations.length > 0
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
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode="grid"
              wishlistMode={true}
              onRemoveFromWishlist={handleRemoveFromWishlist}
            />
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
