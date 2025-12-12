"use client";

import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IProduct } from "@/types/product";
import { IProductCategory } from "@/types/ICategory";
import { ProductCard } from "@/components/Product/ProductCard";
import type { Swiper as SwiperType } from "swiper";
import { DynamicShowcase } from "@/interface/IDynamicShowcase";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface DynamicProductShowcaseProps {
  backgroundImage: string;
  categoryName: string;
  categorySlug: string;
  alt?: string;
  products?: IProduct[];
  categoryData?: IProductCategory;
}

const DynamicProductShowcase: React.FC<DynamicProductShowcaseProps> = ({
  backgroundImage,
  categoryName,
  categorySlug,
  alt = "Product Showcase",
  products: initialProducts,
  categoryData: initialCategoryData,
}) => {
  const router = useRouter();
  // Exactamente como NewProducts
  const [products, setProducts] = useState<IProduct[]>(initialProducts || []);
  const [categoryData, setCategoryData] = useState<IProductCategory | null>(
    initialCategoryData || null
  );
  const [loading, setLoading] = useState(!initialProducts);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);

  // Refs para evitar actualizaciones innecesarias si los props no cambiaron realmente
  const prevInitialProductsRef = useRef<string>(""); // Almacenar string JSON de IDs para comparar
  const prevInitialCategoryDataRef = useRef<string>(""); // Almacenar string de id+slug para comparar

  // Actualizar productos y categoría solo si realmente cambiaron
  useEffect(() => {
    // Crear una clave única basada en los IDs de productos
    const currentProductsKey = initialProducts
      ? JSON.stringify(initialProducts.map((p) => p.id).sort())
      : "";

    // Crear una clave única para categoryData
    const currentCategoryKey = initialCategoryData
      ? `${initialCategoryData.id}-${initialCategoryData.slug}`
      : "";

    const productsChanged =
      currentProductsKey !== prevInitialProductsRef.current;
    const categoryChanged =
      currentCategoryKey !== prevInitialCategoryDataRef.current;

    if (productsChanged || categoryChanged) {
      if (initialProducts) {
        setProducts(initialProducts);
        setCategoryData(initialCategoryData || null);
        setLoading(false);
        prevInitialProductsRef.current = currentProductsKey;
        prevInitialCategoryDataRef.current = currentCategoryKey;
      } else if (prevInitialProductsRef.current === "") {
        // Solo establecer loading si no hay productos previos ni actuales
        setLoading(false);
        prevInitialProductsRef.current = currentProductsKey;
        prevInitialCategoryDataRef.current = currentCategoryKey;
      }
    }
  }, [initialProducts, initialCategoryData]);

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

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Skeleton loading */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="animate-pulse">
                <div className="bg-gray-200 rounded-3xl h-[600px]"></div>
              </div>
              <div className="animate-pulse">
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(25)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-2xl h-48"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // TEMPORAL: Comentado para debugging - mostrar todas las categorías
  // if (products.length === 0) {
  //   return null;
  // }

  return (
    <section className="pb-2 lg:pb-20 bg-gradient-to-br from-gray-50 lg:pt-20 to-white">
      <div className="container max-w-8xl mx-auto px-4 lg:px-8">
        <div className="relative flex flex-col lg:flex-row">
          {/* Left Section - Background Image (60% width) */}
          <div className="w-full lg:w-[30%] relative animate-fade-in-left">
            {/* Background Image */}
            <div className="relative group cursor-pointer animate-fade-in-up animation-delay-200">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="h-[200px] lg:h-[500px]">
                  <Image
                    src={backgroundImage}
                    alt={alt}
                    fill
                    className="w-full  lg:object-center object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={false}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                {/* Content overlay */}
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">
                    {categoryName}
                  </h2>
                  <p className="text-sm lg:text-base opacity-95 drop-shadow-md">
                    Descubre nuestra selección premium
                  </p>
                </div>
                <button
                  onClick={() =>
                    router.push(
                      `/categorias/${categoryData?.slug || categorySlug}`
                    )
                  }
                  className="absolute bottom-6 right-6 text-xs md:text-sm lg:hidden  text-primary bg-white flex items-center  justify-center xl:w-auto rounded-lg border border-primary  px-3 py-3 hover:bg-primary hover:text-white transition-colors"
                >
                  Ver Más
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
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Product Slider (superpuesto sobre la imagen) */}
          <div className="w-full lg:px-10 lg:w-[70%] flex flex-col-reverse lg:flex-col animate-fade-in-right">
            {/* Header with "Ver más" link */}
            <div className="flex justify-center w-full xl:w-auto lg:justify-end items-center px-4 mb-8">
              <h3 className="text-2xl font-bold text-primary capitalize animate-fade-in-up animation-delay-300 hidden ">
                {categoryName}
              </h3>

              <button
                onClick={() =>
                  router.push(
                    `/categorias/${categoryData?.slug || categorySlug}`
                  )
                }
                className="hidden lg:flex items-center justify-center w-full lg:w-auto text-center font-medium transition-colors animate-fade-in-right animation-delay-400 cursor-pointer duration-300 xl:w-auto rounded-2xl bg-primary px-4 py-3 border border-primary text-white hover:bg-primary-dark hover:text-white hover:border hover:border-primary"
              >
                Ver más
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
              </button>
            </div>

            {/* Product Slider con Swiper */}
            <div className="relative">
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
                    slidesPerView: 3,
                  },
                  1280: {
                    slidesPerView: 4,
                  },
                }}
                className="pb-12"
              >
                {products.map((product, index) => {
                  return (
                    <SwiperSlide
                      key={`${product.id}-${index}`}
                      className="relative h-full py-5"
                    >
                      <ProductCard
                        product={product}
                        viewMode="grid"
                        context="home"
                        customBadge={
                          categoryName
                            ? {
                                text: categoryName,
                                className: "bg-primary",
                              }
                            : undefined
                        }
                      />
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default DynamicProductShowcase;

// Componente wrapper para múltiples showcases
interface DynamicProductShowcasesProps {
  showcases: DynamicShowcase[];
}

export function DynamicProductShowcases({
  showcases,
}: DynamicProductShowcasesProps) {
  if (showcases.length === 0) {
    return (
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 font-medium">
              No se encontraron showcases dinámicos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showcases.map((showcase) => (
        <DynamicProductShowcase
          key={`${showcase.mediaItem.id}-${showcase.categorySlug}`}
          backgroundImage={showcase.mediaItem.source_url}
          categoryName={showcase.categoryName}
          categorySlug={showcase.categorySlug}
          alt={
            showcase.mediaItem.alt_text || `Imagen de ${showcase.categoryName}`
          }
          products={showcase.products}
          categoryData={showcase.categoryData || undefined}
        />
      ))}
    </>
  );
}
