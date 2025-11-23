"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import Image from "next/image";
import { IProductCategoryNode } from "@/types/ICategory";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

interface CategorySubcategoriesProps {
  subcategories: IProductCategoryNode[];
  parentCategoryName?: string;
}

export default function CategorySubcategories({
  subcategories,
  parentCategoryName,
}: CategorySubcategoriesProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<IProductCategoryNode | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(true);
  const [currentSlidesPerView, setCurrentSlidesPerView] = useState(2);

  // Si no hay subcategorías, no mostrar nada
  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  // Determinar qué categorías mostrar
  const categoriesToShow = selectedCategory?.children || subcategories;
  const currentTitle = selectedCategory
    ? selectedCategory.name
    : parentCategoryName || "Subcategorías";

  // Calcular si se deben habilitar las flechas
  const shouldEnableArrows = categoriesToShow.length > currentSlidesPerView;

  // Actualizar slidesPerView según el tamaño de pantalla
  useEffect(() => {
    const updateSlidesPerView = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setCurrentSlidesPerView(4);
      } else if (width >= 768) {
        setCurrentSlidesPerView(4);
      } else if (width >= 640) {
        setCurrentSlidesPerView(3);
      } else {
        setCurrentSlidesPerView(2);
      }
    };

    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);
    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  const updateNavigationState = (swiper: SwiperType) => {
    setCanGoPrev(swiper.isBeginning === false);
    setCanGoNext(swiper.isEnd === false);
  };

  // Función para navegar
  const goToPrev = () => {
    if (swiperInstance && shouldEnableArrows) {
      swiperInstance.slidePrev();
    }
  };

  const goToNext = () => {
    if (swiperInstance && shouldEnableArrows) {
      swiperInstance.slideNext();
    }
  };

  const handleCategoryClick = (category: IProductCategoryNode) => {
    // Si la categoría tiene hijos, mostrar los hijos
    if (category.children && category.children.length > 0) {
      setSelectedCategory(category);
    } else {
      // Si no tiene hijos, navegar a la página de la categoría
      window.location.href = `/categorias/${category.slug}`;
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  // Obtener imagen de categoría o imagen por defecto
  const getCategoryImage = (category: IProductCategoryNode): string => {
    if (category.image?.src) {
      return category.image.src;
    }
    // Imagen por defecto si no tiene imagen
    return "/logo-belm-v2.png";
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título centrado */}
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {currentTitle}
          </h2>
          {selectedCategory && (
            <button
              onClick={handleBack}
              className="mt-4 text-sm text-gray-600 hover:text-primary transition-colors underline"
            >
              ← Volver
            </button>
          )}
        </div>

        {/* Carrusel de subcategorías */}
        <div className="relative px-12">
          <Swiper
            modules={[Navigation]}
            onSwiper={setSwiperInstance}
            onSlideChange={updateNavigationState}
            onInit={updateNavigationState}
            loop={false}
            spaceBetween={24}
            slidesPerView={2}
            breakpoints={{
              640: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="pb-4"
          >
            {categoriesToShow.map((category) => (
              <SwiperSlide key={category.id}>
                <div
                  onClick={() => handleCategoryClick(category)}
                  className="group cursor-pointer flex flex-col items-center"
                >
                  {/* Imagen circular - más grande como en la imagen */}
                  <div className="relative w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-gray-200 group-hover:border-primary transition-all duration-300 shadow-lg mb-3">
                    <Image
                      src={getCategoryImage(category)}
                      alt={category.image?.alt || category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 640px) 128px, (max-width: 768px) 144px, 160px"
                    />
                  </div>

                  {/* Nombre de la categoría centrado debajo */}
                  <h3 className="text-sm md:text-base font-medium text-gray-900 text-center group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Flechas de navegación */}
          {shouldEnableArrows && (
            <>
              <button
                onClick={goToPrev}
                disabled={!canGoPrev}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  canGoPrev
                    ? "bg-primary text-white border border-gray-200 hover:bg-primary-dark hover:text-white hover:shadow-lg cursor-pointer"
                    : "bg-gray-300 text-gray-500 border border-gray-300 cursor-not-allowed opacity-50"
                }`}
                aria-label="Categoría anterior"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
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

              <button
                onClick={goToNext}
                disabled={!canGoNext}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  canGoNext
                    ? "bg-primary text-white border border-gray-200 hover:bg-primary-dark hover:text-white hover:shadow-lg cursor-pointer"
                    : "bg-gray-300 text-gray-500 border border-gray-300 cursor-not-allowed opacity-50"
                }`}
                aria-label="Categoría siguiente"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
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
            </>
          )}
        </div>
      </div>
    </section>
  );
}
