"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { FeaturedCategorySlide } from "@/services/admin/featuredCategoriesService";
import { toast } from "sonner";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { SwiperRef } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Interfaz para las categorías en el componente
interface CategoryItem {
  id: string;
  name: string;
  subtitle: string;
  productInfo: string;
  image: string;
  responsiveImage?: string | null;
  href: string;
  discountCode?: string;
  order: number;
}

interface FeaturedCategoriesProps {
  initialData?: FeaturedCategorySlide[];
}

// Categorías por defecto (fuera del componente para evitar problemas de orden)
const getDefaultCategories = (): CategoryItem[] => [
  {
    id: "default-1",
    name: "Cabello",
    subtitle: "Nourishes & softens",
    productInfo: "16 FL OZ / 473 ml",
    image: "/hair.jpg",
    href: "/categoria/cabello",
    order: 0,
  },
  {
    id: "default-2",
    name: "Cuidado Corporal",
    subtitle: "Nourishes & softens",
    productInfo: "16 FL OZ / 473 ml",
    image: "/body.jpg",
    href: "/categoria/cuidado-corporal",
    order: 1,
  },
  {
    id: "default-3",
    name: "Cuidado Facial",
    subtitle: "Cleanses & revitalizes",
    productInfo: "16 FL OZ / 473 ml",
    image: "/facial.jpg",
    href: "/categoria/cuidado-facial",
    order: 2,
  },
  {
    id: "default-4",
    name: "Fragancias",
    subtitle: "Deep conditioning",
    productInfo: "8 FL OZ / 237 ml",
    image: "/fraga.jpg",
    href: "/categoria/fragancias",
    order: 3,
  },
  {
    id: "default-5",
    name: "Maquillaje",
    subtitle: "Repairs & protects",
    productInfo: "4 FL OZ / 118 ml",
    image: "/make.jpg",
    href: "/categoria/maquillaje",
    order: 4,
  },
  {
    id: "default-6",
    name: "Moda y Accesorios",
    subtitle: "Hydrates & nourishes",
    productInfo: "2 FL OZ / 59 ml",
    image: "/acce.jpg",
    href: "/categoria/moda-y-accesorios",
    order: 5,
  },
];

const FeaturedCategories = ({ initialData }: FeaturedCategoriesProps) => {
  // Si tenemos datos iniciales, usarlos directamente sin estado de loading
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    if (initialData && initialData.length > 0) {
      const hrefMap: Record<string, string> = {
        Cabello: "/categoria/cabello",
        "Cuidado Corporal": "/categoria/cuidado-corporal",
        "Cuidado Facial": "/categoria/cuidado-facial",
        Fragancias: "/categoria/fragancias",
        Maquillaje: "/categoria/maquillaje",
        "Moda y Accesorios": "/categoria/moda-y-accesorios",
      };

      return initialData.map((featured: FeaturedCategorySlide) => ({
        id: featured.id,
        name: featured.name || featured.alt || "Categoría",
        subtitle: "Nourishes & softens",
        productInfo: "16 FL OZ / 473 ml",
        image: featured.image,
        responsiveImage: featured.responsive_url,
        href: featured.url || hrefMap[featured.name] || "#",
        discountCode: featured.discountCode,
        order: featured.order,
      }));
    }
    return getDefaultCategories();
  });
  const [loading, setLoading] = useState(!initialData); // No loading si tenemos datos iniciales
  const [isMobile, setIsMobile] = useState(false);
  const swiperRef = useRef<SwiperRef>(null);

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

  // Actualizar categorías solo cuando cambia initialData (no cuando cambia isMobile)
  useEffect(() => {
    if (!initialData || initialData.length === 0) {
      setCategories(getDefaultCategories());
      setLoading(false);
      return;
    }

    // Mapear categorías solo cuando cambia initialData
    const hrefMap: Record<string, string> = {
      Cabello: "/categoria/cabello",
      "Cuidado Corporal": "/categoria/cuidado-corporal",
      "Cuidado Facial": "/categoria/cuidado-facial",
      Fragancias: "/categoria/fragancias",
      Maquillaje: "/categoria/maquillaje",
      "Moda y Accesorios": "/categoria/moda-y-accesorios",
    };

    const mappedCategories = initialData.map(
      (featured: FeaturedCategorySlide) => ({
        id: featured.id,
        name: featured.name || featured.alt || "Categoría",
        subtitle: "Nourishes & softens",
        productInfo: "16 FL OZ / 473 ml",
        image: featured.image,
        responsiveImage: featured.responsive_url,
        href: featured.url || hrefMap[featured.name] || "#",
        discountCode: featured.discountCode,
        order: featured.order,
      })
    );

    setCategories(mappedCategories);
    setLoading(false);
  }, [initialData]); // Solo depende de initialData, no de isMobile

  // Función para obtener la URL de imagen responsive (se usa en el render, no en el estado)
  const getResponsiveImageUrl = (category: CategoryItem): string => {
    if (isMobile && category.responsiveImage) {
      return category.responsiveImage;
    }
    return category.image;
  };

  // Función para manejar clic en categoría
  const handleCategoryClick = async (category: CategoryItem) => {
    // Si tiene código de descuento, copiarlo y mostrar notificación
    if (category.discountCode) {
      try {
        await navigator.clipboard.writeText(category.discountCode);
        toast.success("Código de cupón copiado", {
          description: `Código: ${category.discountCode}`,
          duration: 3000,
        });
      } catch {
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = category.discountCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        toast.success("Código de cupón copiado", {
          description: `Código: ${category.discountCode}`,
          duration: 3000,
        });
      }
    }

    // Si tiene URL personalizada, redirigir
    if (category.href && category.href !== "#") {
      window.open(category.href, "noopener,noreferrer");
    }
  };

  // Animaciones removidas - ahora usando Tailwind CSS

  // Mostrar loading si está cargando
  if (loading) {
    return (
      <section className="mx-auto py-10 bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50">
        <div className="container max-full mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">
              Cargando categorías destacadas...
            </p>
          </div>

          {/* Skeleton loading */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="relative flex h-120 rounded-2xl overflow-hidden bg-gray-200 animate-pulse"
              >
                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-8 w-4/5 bg-white/70 backdrop-blur-sm rounded-lg h-12"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto pb-15 pt-10 bg-gradient-to-br from-purple-50 via-purple-50 to-indigo-50">
      <div className="w-full mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 animate-fade-in-up">
          <h2 className="text-3xl lg:text-3xl font-bold text-primary mb-4 animate-fade-in-up animation-delay-200">
            Nuestras Categorías
          </h2>
          <p className="text-md text-gray-600 animate-fade-in-up animation-delay-400">
            Descubre nuestra línea completa de cuidado personal
          </p>
        </div>

        {/* Swiper Slider */}
        <div className="relative">
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Autoplay]}
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
                slidesPerView: 4,
                spaceBetween: 60,
              },
              1480: {
                slidesPerView: 6,
                spaceBetween: 60,
              },
            }}
            navigation={{
              nextEl: ".category-button-next",
              prevEl: ".category-button-prev",
            }}
            className="w-full py-4"
          >
            {categories.map((cat) => (
              <SwiperSlide key={cat.id}>
                <div
                  className="relative md:aspect-square md:h-auto h-[200px] w-full flex  rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg hover:scale-105 transition-all duration-300"
                  style={{
                    backgroundImage: `url(${getResponsiveImageUrl(cat)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center top",
                  }}
                  onClick={() => handleCategoryClick(cat)}
                >
                  <div className="p-10 flex flex-col justify-center items-center w-full">
                    {/* Glassmorphism Overlay */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-5 w-4/5 bg-white/70 backdrop-blur-sm rounded-lg group-hover:translate-y-2 transition-transform duration-300 ease-out">
                      {/* Main Title */}
                      <h3 className="text-md lg:text-xl font-bold text-primary text-center py-2 px-2 transition-transform duration-300 ease-out">
                        {cat.name}
                      </h3>
                    </div>

                    {/* Link Overlay - solo si no tiene código de descuento */}
                    {!cat.discountCode && (
                      <Link href={cat.href} className="absolute inset-0 z-20">
                        <span className="sr-only">Ver {cat.name}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows */}

          <button className="category-button-prev absolute left-0 top-1/2 transform -translate-x-4 -translate-y-1/2 z-10 lg:w-15 lg:h-15 w-12 h-12 bg-primary text-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark hover:shadow-lg transition-all duration-300 shadow-sm">
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

          <button className="category-button-next absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 lg:w-15 lg:h-15 w-12 h-12 bg-primary text-white text-primary border border-gray-200 rounded-full flex items-center cursor-pointer justify-center hover:bg-primary-dark hover:shadow-lg transition-all duration-300 shadow-sm">
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
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
