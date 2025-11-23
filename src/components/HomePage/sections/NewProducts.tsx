"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { IProduct, ProductAttributeOption } from "@/types/product";
import { extractColorValue } from "@/utils/productAttributes";
// Imports removidos - ahora usamos API route
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface NewProductsProps {
  products?: IProduct[];
}

const NewProducts = ({ products: initialProducts }: NewProductsProps) => {
  const [products, setProducts] = useState<IProduct[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);

  // Si recibimos productos como prop, usarlos directamente
  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
    }
  }, [initialProducts]);

  // Función para actualizar el estado de las flechas
  const updateNavigationState = (swiper: SwiperType) => {
    setCanGoPrev(swiper.isBeginning === false);
    setCanGoNext(swiper.isEnd === false);
  };

  // Función para navegar
  const goToPrev = () => {
    if (swiperInstance) {
      swiperInstance.slidePrev();
    }
  };

  const goToNext = () => {
    if (swiperInstance) {
      swiperInstance.slideNext();
    }
  };

  // Solo cargar si no tenemos productos iniciales
  useEffect(() => {
    // Los productos ya vienen desde el servidor en initialProducts
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
    } else {
      // Si no hay productos iniciales, no mostrar nada
      setProducts([]);
      setLoading(false);
    }
  }, [initialProducts]);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">
              Cargando productos nuevos...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="lg:py-16 py-8 bg-white">
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Lo más nuevo
          </h2>
          <Link
            href="/lo-mas-nuevo"
            className="border border-primary text-white bg-primary lg:px-6 lg:py-3 px-4 py-2 rounded-lg hover:bg-primary-dark hover:text-white transition-colors duration-300"
          >
            Ver Más
          </Link>
        </div>

        {/* Swiper */}
        <Swiper
          modules={[Navigation]}
          onSwiper={setSwiperInstance}
          onSlideChange={updateNavigationState}
          onInit={updateNavigationState}
          loop={false}
          spaceBetween={16}
          slidesPerView={2.3}
          pagination={{ clickable: true }}
          breakpoints={{
            640: {
              slidesPerView: 2.3,
            },
            768: {
              slidesPerView: 3,
            },
            1024: {
              slidesPerView: 4,
            },
            1280: {
              slidesPerView: 5,
            },
          }}
          className="pb-12"
        >
          {products.map((product) => {
            // Extraer colores del producto usando isColorAttribute
            const colorAttr = product.attributes?.find(
              (a) =>
                a.name.toLowerCase() === "color" ||
                a.name.toLowerCase() === "colores"
            );
            const colors = colorAttr?.options || [];

            const isVariableProduct =
              product.variations && product.variations.length > 0;

            // Obtener la primera variación para productos variables
            const getDefaultVariationForPricing = () => {
              if (!product.variations || product.variations.length === 0)
                return null;
              return product.variations[0];
            };
            const defaultVariationForPricing = getDefaultVariationForPricing();

            // Determinar precios y descuento basado en primera variación o producto principal
            const currentPrice =
              defaultVariationForPricing?.price ?? product.pricing.price;
            const currentRegularPrice =
              defaultVariationForPricing?.regularPrice ??
              product.pricing.regularPrice;
            const currentSalePrice =
              defaultVariationForPricing?.salePrice ??
              product.pricing.salePrice;

            const hasDiscount =
              currentSalePrice !== null &&
              currentRegularPrice !== null &&
              currentSalePrice < currentRegularPrice;

            // Obtener imagen del producto - PRIORIZAR PRIMER COLOR DEL BACKEND
            const getProductImage = () => {
              // Extraer colores del producto
              const colorAttr = product.attributes?.find(
                (a) =>
                  a.name.toLowerCase() === "color" ||
                  a.name.toLowerCase() === "colores"
              );
              const colors = colorAttr?.options || [];

              // 🎯 BUSCAR VARIACIÓN DEL PRIMER COLOR (según orden del backend)
              if (
                product.variations &&
                product.variations.length > 0 &&
                colors.length > 0
              ) {
                const firstColor = colors[0]; // Primer color según orden del backend

                // Buscar la variación que corresponda al primer color
                const firstColorVariation = product.variations.find(
                  (variation) => {
                    // Buscar el atributo de color en esta variación
                    const variationColorAttr = variation.attributes?.find(
                      (attr) =>
                        attr.name.toLowerCase() === "color" ||
                        attr.name.toLowerCase() === "colores"
                    );

                    // Si coincide con el primer color
                    if (
                      variationColorAttr?.option &&
                      firstColor &&
                      variationColorAttr.option.toLowerCase().trim() ===
                        firstColor.name.toLowerCase().trim()
                    ) {
                      return true;
                    }
                    return false;
                  }
                );

                // Si encontramos la variación del primer color y tiene imagen, usarla
                if (firstColorVariation?.image?.src) {
                  return firstColorVariation.image.src;
                }

                // Si no tiene imagen, buscar cualquier variación con imagen
                for (const variation of product.variations) {
                  if (variation.image?.src) {
                    return variation.image.src;
                  }
                }
              }

              // Si hay variaciones pero no encontramos ninguna con imagen, usar la primera
              if (
                product.variations &&
                product.variations.length > 0 &&
                product.variations[0].image?.src
              ) {
                return product.variations[0].image.src;
              }

              // Fallback a imágenes principales si no hay variaciones con imagen
              if (product.images && product.images.length > 0) {
                return product.images[0].src;
              }
              return "/product.png";
            };

            return (
              <SwiperSlide key={product.id} className="relative h-full py-5">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                  {/* Imagen del producto */}
                  <div className="relative aspect-square w-full flex-shrink-0">
                    <Link href={`/product/${product.slug}`}>
                      <Image
                        src={getProductImage()}
                        alt={product.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {/* Badge OFERTA - solo si hay descuento */}
                      {/*  {hasDiscount && (
                        <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                          Oferta
                        </div>
                      )} */}
                    </div>
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {/* Badge NUEVO - siempre visible en productos nuevos */}
                      <div className="bg-green-500 text-xs lg:text-sm text-white px-2 py-1 rounded  font-semibold">
                        NUEVO
                      </div>
                    </div>

                    {/* Colores */}
                    <div className="absolute bottom-2 right-0 justify-center left-2">
                      {colors.length > 0 && (
                        <div className="flex items-center gap-2 w-full ">
                          <div className="flex items-center py-1 px-2 rounded-md mb-2 m-auto bg-white/80 backdrop-blur-sm justify-center">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Colores:
                            </span>
                            <div className="flex gap-1">
                              {colors
                                .slice(0, 3)
                                .map((color: ProductAttributeOption) => {
                                  const colorValue = extractColorValue(color);
                                  const hex = colorValue || "#CCCCCC";

                                  return (
                                    <span
                                      key={color.name || color.id}
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{
                                        backgroundColor: hex,
                                      }}
                                      title={color.name}
                                    />
                                  );
                                })}
                              {colors.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{colors.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido - Usando flex para distribuir el espacio */}
                  <div className="p-4 flex flex-col flex-grow">
                    <Link href={`/product/${product.slug}`}>
                      <h3
                        className="font-semibold text-xs lg:text-lg text-gray-900  hover:text-primary transition-colors h-8 lg:h-12 overflow-hidden text-ellipsis"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {product.name}
                      </h3>
                    </Link>

                    {/* Precio */}
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      <span className="text-lg font-bold text-primary">
                        S/{" "}
                        {hasDiscount
                          ? currentSalePrice?.toFixed(2) ?? "0.00"
                          : currentPrice?.toFixed(2) ?? "0.00"}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-gray-500 line-through">
                          S/ {currentRegularPrice?.toFixed(2) ?? "0.00"}
                        </span>
                      )}
                    </div>

                    {/* Botón - Se mantiene al final */}
                    <Link
                      href={`/product/${product.slug}`}
                      className="w-full bg-primary text-xs md:text-base text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors duration-300 text-center block mt-auto"
                    >
                      {isVariableProduct ? "Seleccionar" : "Ver Producto"}
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Flechas de navegación inteligentes */}
        {canGoPrev && (
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 lg:w-15 lg:h-15 w-12 h-12 bg-primary hover:bg-primary-dark cursor-pointer  text-white border border-gray-200 rounded-full flex items-center justify-center  hover:text-white hover:shadow-lg transition-all duration-300 shadow-sm"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {canGoNext && (
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 lg:w-15 lg:h-15 w-12 h-12 bg-primary  text-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark hover:shadow-lg transition-all duration-300 shadow-sm"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
};

export default NewProducts;
