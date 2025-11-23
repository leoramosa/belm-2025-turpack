"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { HeroBannerSlide } from "@/services/admin/heroBannerService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { toast } from "sonner";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Interfaz para slides dinámicos
interface DynamicSlide {
  image: string;
  alt: string;
  bannerType: "category" | "product" | "general";
  bannerName: string;
  responsiveImage?: string | null;
}

// Interfaz para slides por defecto
interface DefaultSlide {
  image: string;
  alt: string;
}

// Interfaz para slides del admin
interface AdminSlide {
  id: string;
  image: string;
  alt: string;
  url?: string;
  discountCode?: string;
  order: number;
  responsiveImage?: string | null;
}

// Tipo unión para todos los slides
type Slide = DefaultSlide | DynamicSlide | AdminSlide;

// Función helper para verificar si un slide es dinámico
const isDynamicSlide = (slide: Slide): slide is DynamicSlide => {
  return "bannerType" in slide && "bannerName" in slide;
};

// Función helper para verificar si un slide es del admin
const isAdminSlide = (slide: Slide): slide is AdminSlide => {
  return "id" in slide && "order" in slide;
};

// Slides por defecto (fallback)
const defaultSlides: DefaultSlide[] = [
  {
    image: "/banner.jpg",
    alt: "Banner principal",
  },
];

interface HeroBannerProps {
  initialData?: HeroBannerSlide[];
}

const HeroBanner = ({ initialData }: HeroBannerProps) => {
  // Si tenemos datos iniciales, usarlos directamente sin estado de loading
  const [slides, setSlides] = useState<Slide[]>(() => {
    if (initialData && initialData.length > 0) {
      return initialData.map((banner: HeroBannerSlide) => ({
        ...banner,
        responsiveImage: banner.responsive_url || null,
      }));
    }
    return defaultSlides;
  });
  const [loading, setLoading] = useState(!initialData); // No loading si tenemos datos iniciales
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const hasLoaded = useRef(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [canGoPrev, setCanGoPrev] = useState(true);
  const [canGoNext, setCanGoNext] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Cargar banners dinámicos
  useEffect(() => {
    const loadBannerShowcases = async () => {
      // Evitar cargar múltiples veces
      if (hasLoaded.current) return;

      try {
        setLoading(true);

        // Si tenemos datos iniciales, usarlos directamente
        if (initialData && initialData.length > 0) {
          const adminSlidesWithResponsive = initialData.map(
            (banner: HeroBannerSlide) => ({
              ...banner,
              responsiveImage: banner.responsive_url || null,
            })
          );
          setSlides(adminSlidesWithResponsive);
          console.log(`✅ Usando ${initialData.length} banners del servidor`);
          setLoading(false);
          hasLoaded.current = true;
          return;
        }

        // Si no hay datos iniciales, usar slides por defecto
        console.log("⚠️ No se encontraron banners, usando slides por defecto");
        setSlides(defaultSlides);

        hasLoaded.current = true;
      } catch (err) {
        console.error("💥 Error cargando banners:", err);
        setSlides(defaultSlides); // Usar slides por defecto en caso de error
      } finally {
        setLoading(false);
      }
    };

    loadBannerShowcases();
  }, [initialData]);

  // Detectar tamaño de pantalla para responsive
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Verificar tamaño inicial
    checkScreenSize();

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Función para actualizar el estado de las flechas
  const updateNavigationState = (swiper: SwiperType) => {
    setCanGoPrev(swiper.isBeginning === false);
    setCanGoNext(swiper.isEnd === false);
    setCurrentSlideIndex(swiper.activeIndex);
  };

  // Función para navegar
  const goToPrev = () => {
    if (swiperInstance) {
      swiperInstance.slidePrev();
    }
  };

  const goToNext = () => {
    console.log("Next clicked, swiperInstance:", swiperInstance);
    if (swiperInstance) {
      console.log("Calling slideNext()");
      swiperInstance.slideNext();
    } else {
      console.log("No swiperInstance available");
    }
  };

  const goToSlide = (index: number) => {
    if (swiperInstance) {
      swiperInstance.slideTo(index);
    }
  };

  const handleBannerClick = async (slideIndex: number) => {
    const normalizedIndex = slideIndex % slides.length;
    const currentSlideData = slides[normalizedIndex];

    if (isAdminSlide(currentSlideData)) {
      // Si tiene código de cupón, copiarlo y mostrar notificación
      if (currentSlideData.discountCode) {
        try {
          await navigator.clipboard.writeText(currentSlideData.discountCode);
          toast.success("Código de cupón copiado", {
            description: `Código: ${currentSlideData.discountCode}`,
            duration: 3000,
          });
        } catch {
          // Fallback para navegadores que no soportan clipboard API
          const textArea = document.createElement("textarea");
          textArea.value = currentSlideData.discountCode;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);

          toast.success("Código de cupón copiado", {
            description: `Código: ${currentSlideData.discountCode}`,
            duration: 3000,
          });
        }
      }

      // Si tiene URL, redirigir
      if (currentSlideData.url) {
        window.open(currentSlideData.url, "_blank", "noopener,noreferrer");
      }
    }
  };

  // Función para obtener la URL de imagen responsive
  const getResponsiveImageUrl = (slide: Slide): string => {
    // Solo aplicar lógica responsive en el cliente
    if (typeof window === "undefined") {
      return slide.image;
    }

    // Debug solo si hay responsive image
    if ("responsiveImage" in slide && slide.responsiveImage) {
      console.log("🔍 Responsive image disponible:", {
        isMobile,
        responsiveImage: slide.responsiveImage,
      });
    }

    // Verificar si es AdminSlide o DynamicSlide con responsiveImage
    if (
      ("responsiveImage" in slide && slide.responsiveImage) ||
      (isAdminSlide(slide) && slide.responsiveImage) ||
      (isDynamicSlide(slide) && slide.responsiveImage)
    ) {
      if (isMobile) {
        // Usar la URL responsive del backend si existe
        const responsiveUrl = isAdminSlide(slide)
          ? slide.responsiveImage
          : isDynamicSlide(slide)
          ? slide.responsiveImage
          : null;

        console.log(
          `📱 Usando imagen responsive: ${
            responsiveUrl || "fallback a desktop"
          }`
        );
        return responsiveUrl || slide.image;
      }
    }

    return slide.image;
  };

  // Mostrar loading si está cargando
  if (loading) {
    return (
      <section className="relative w-full overflow-hidden">
        <div className="w-full h-[200px] sm:h-[300px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando banners...</p>
          </div>
        </div>
      </section>
    );
  }

  // Determinar si hay suficientes slides para el loop
  // Para loop funcione bien, necesitas al menos slidesPerView * 2 slides

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Swiper Slider */}
      <div className="relative">
        <Swiper
          modules={[Navigation]}
          onSwiper={setSwiperInstance}
          onSlideChange={updateNavigationState}
          onInit={updateNavigationState}
          /*  autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }} */
          spaceBetween={4}
          slidesPerView={1}
          pagination={{ clickable: true }}
          breakpoints={{
            320: {
              slidesPerView: 1,
              spaceBetween: 8,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 8,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 8,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 4,
            },
          }}
          className="pb-12"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div
                className="relative w-full cursor-pointer pt-2"
                onClick={() => handleBannerClick(index)}
              >
                <Image
                  src={getResponsiveImageUrl(slide)}
                  alt={slide.alt}
                  width={1920}
                  height={1080}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
                  className="w-full h-auto object-contain rounded-lg"
                  priority={index === 0}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Flechas de navegación inteligentes */}
      {canGoPrev && (
        <button
          onClick={goToPrev}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 lg:w-15 lg:h-15 w-12 h-12 bg-primary hover:bg-primary-dark cursor-pointer text-white border border-gray-200 rounded-full flex items-center justify-center hover:text-white hover:shadow-lg transition-all duration-300 shadow-sm ${
            isMobile
              ? "opacity-100" // En móvil siempre visible
              : isHovered
              ? "opacity-100" // En desktop solo visible en hover
              : "opacity-0 pointer-events-none" // En desktop oculto cuando no hay hover
          }`}
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
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 lg:w-15 lg:h-15 w-12 h-12 bg-primary text-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark hover:shadow-lg transition-all duration-300 shadow-sm ${
            isMobile
              ? "opacity-100" // En móvil siempre visible
              : isHovered
              ? "opacity-100" // En desktop solo visible en hover
              : "opacity-0 pointer-events-none" // En desktop oculto cuando no hay hover
          }`}
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

      {/* Custom Pagination Dots */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2 z-20">
        {slides.map((_, index) => {
          // Normalizar el índice actual para comparar correctamente con loop
          const normalizedCurrentIndex = currentSlideIndex % slides.length;
          return (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === normalizedCurrentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          );
        })}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-black/50 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm z-20">
        {(currentSlideIndex % slides.length) + 1} / {slides.length}
      </div>

      {/* Banner Info (solo si es dinámico) */}
      {(() => {
        const normalizedIndex = currentSlideIndex % slides.length;
        const currentSlide = slides[normalizedIndex];
        return (
          currentSlide &&
          isDynamicSlide(currentSlide) && (
            <div className="absolute bottom-12 sm:bottom-20 left-4 sm:left-8 bg-black/50 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm z-20">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs opacity-75">Banner:</span>
                <span className="font-medium capitalize">
                  {currentSlide.bannerName}
                </span>
                <span className="text-xs opacity-75 hidden sm:inline">
                  ({currentSlide.bannerType})
                </span>
              </div>
            </div>
          )
        );
      })()}
    </section>
  );
};

export default HeroBanner;
