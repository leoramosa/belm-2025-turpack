"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { IProduct } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { isColorAttribute, extractColorValue } from "@/utils/productAttributes";
import Image from "next/image";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

interface ProductShowcaseProps {
  products?: IProduct[];
}

const ProductShowcase = ({ products = [] }: ProductShowcaseProps) => {
  const { addToCart } = useCartStore();
  const { openCart } = useUIStore();

  const getDiscountedPrice = (product: IProduct) => {
    const regularPrice =
      product.pricing.regularPrice ?? product.pricing.price ?? 0;
    const salePrice = product.pricing.salePrice ?? product.pricing.price ?? 0;
    const currentPrice = product.pricing.price ?? 0;
    const hasDiscount = salePrice > 0 && salePrice < regularPrice;

    return {
      originalPrice: regularPrice,
      currentPrice: hasDiscount ? salePrice : currentPrice,
      discountPercentage:
        hasDiscount && regularPrice > 0
          ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
          : 0,
    };
  };

  const getProductImage = (product: IProduct) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    return "/product.png";
  };

  const getMainCategory = (product: IProduct) => {
    if (!product.categories || product.categories.length === 0)
      return "General";

    // Retornar la primera categoría del producto
    return product.categories[0]?.name || "General";
  };

  const isProductSimple = (product: IProduct) => {
    return !product.variations || product.variations.length === 0;
  };

  const handleAddToCart = async (product: IProduct) => {
    try {
      if (isProductSimple(product)) {
        addToCart(product);
        openCart(); // Abrir cartDrawer
      } else {
        // Para productos variables, redirigir al detalle
        window.location.href = `/productos/${product.slug}`;
      }
    } catch {
      // Error silencioso
      console.error("Error al agregar al carrito:", product.name);
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  // Limitar a 6 productos
  const displayProducts = products.slice(0, 6);

  return (
    <section className="py-20 bg-linear-to-br from-gray-50 to-white">
      <div className="container max-w-8xl mx-auto px-4 lg:px-8">
        <div className="relative">
          {/* Left Section - Background Image (60% width) */}
          <div className="w-full lg:w-[60%] relative transition-opacity duration-500">
            {/* Background Image */}
            <div className="relative group cursor-pointer transition-transform duration-300">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/facial.png"
                  alt="Product Showcase"
                  width={600}
                  height={600}
                  className="w-full h-[600px] object-cover transition-transform duration-300 group-hover:scale-105"
                  priority={true}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Right Section - Product Slider (superpuesto sobre la imagen) */}
          <div className="absolute top-1/2 right-0 w-full lg:w-[55%] transform -translate-y-1/2 z-10 transition-opacity duration-500">
            {/* Header with "Ver más" link */}
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900"></h3>

              <a
                href="/categorias/moda-y-accesorios"
                className="flex items-center text-primary hover:text-purple-700 font-medium transition-colors group"
              >
                VER MÁS
                <svg
                  className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>

            {/* Product Slider con Swiper */}
            <div className="relative">
              <Swiper
                modules={[Navigation]}
                navigation={{
                  nextEl: ".swiper-button-next-custom",
                  prevEl: ".swiper-button-prev-custom",
                }}
                slidesPerView={3}
                spaceBetween={24}
                loop={displayProducts.length > 3}
                breakpoints={{
                  320: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                className="!pb-12"
              >
                {displayProducts.map((product, index) => (
                  <SwiperSlide key={`${product.id}-${index}`} className="!p-4">
                    <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105 hover:-translate-y-1">
                      {/* Category Tag */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                          {getMainCategory(product)}
                        </span>
                      </div>
                      {/* Product Image */}
                      <div className="relative overflow-hidden">
                        <Image
                          src={getProductImage(product)}
                          alt={product.name}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent"></div>
                      </div>
                      {/* Product Info */}
                      <div className="p-4 bg-white">
                        <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-primary">
                            S/{" "}
                            {getDiscountedPrice(product).currentPrice.toFixed(
                              2
                            )}
                          </span>
                          {getDiscountedPrice(product).originalPrice >
                            getDiscountedPrice(product).currentPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              S/{" "}
                              {getDiscountedPrice(
                                product
                              ).originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {/* Color Selector - Solo mostrar si el producto tiene atributos de color */}
                        {(() => {
                          const colorAttr =
                            product.attributes?.find(isColorAttribute);
                          const firstColor = colorAttr?.options?.[0];

                          if (!firstColor) return null;

                          // Extraer el valor del color usando extractColorValue
                          const colorValue = extractColorValue(firstColor);

                          // Solo mostrar si encontramos un valor de color válido
                          if (!colorValue) return null;

                          return (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs text-gray-600">
                                Colores:
                              </span>
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor: colorValue,
                                }}
                              ></div>
                            </div>
                          );
                        })()}
                        {/* Action Button */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full py-2 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary transition-colors text-sm"
                        >
                          {isProductSimple(product)
                            ? "Agregar al carrito"
                            : "Ver detalle"}
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Flechas de navegación personalizadas - FUERA del Swiper */}
              <div className="swiper-button-prev-custom absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 w-12 h-12 bg-purple-100 hover:bg-purple-200 text-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-10 cursor-pointer">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="swiper-button-next-custom absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 w-12 h-12 bg-purple-100 hover:bg-purple-200 text-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-10 cursor-pointer">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
