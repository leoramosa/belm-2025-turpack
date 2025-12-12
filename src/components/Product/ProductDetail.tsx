"use client";
import { IProduct } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import Image from "next/image";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isColorAttribute, extractColorValue } from "@/utils/productAttributes";
import { IProductCategoryNode } from "@/types/ICategory";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import RecentlyViewedProducts from "./RecentlyViewedProducts";
import ProductRecommendations from "./ProductRecommendations";
import WishlistButton from "./WishlistButton";
import ProductReviews from "./ProductReviews";
import ShareProduct from "./ShareProduct";

// import { motion, AnimatePresence } from "framer-motion"; // Removido para usar solo Tailwind
import { toast } from "sonner";

// 🆕 Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import "swiper/css/thumbs";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ShoppingCart,
  Star,
  Check,
  X,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Eye,
} from "lucide-react";

interface ProductDetailProps {
  product: IProduct;
  categories?: IProductCategoryNode[];
  recommendations?: IProduct[];
}

// Componente optimizado para el rating
function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`w-4 h-4 ${
          i <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    );
  }
  return (
    <div className="flex items-center gap-1">
      {stars}
      <span className="ml-2 text-sm text-gray-500">({count})</span>
    </div>
  );
}

export default function ProductDetail({
  product,
  categories = [],
  recommendations = [],
}: ProductDetailProps) {
  // Función para procesar y limpiar la descripción HTML del backend
  const processedDescription = useMemo(() => {
    if (!product.description) return "";

    let html = product.description;

    // Remover estilos que limitan el ancho y padding/margin que puedan interferir
    html = html.replace(/style="([^"]*)"/gi, (match, styles) => {
      const cleanStyles = styles
        .split(";")
        .map((s: string) => s.trim())
        .filter((s: string) => {
          if (!s) return false;
          const prop = s.split(":")[0]?.trim().toLowerCase();
          // Remover propiedades que limitan el ancho y padding/margin que puedan interferir
          return ![
            "max-width",
            "width",
            "flex-shrink",
            "flex-basis",
            "padding",
            "padding-left",
            "padding-right",
            "padding-top",
            "padding-bottom",
            "margin-left",
            "margin-right",
          ].includes(prop);
        })
        .join("; ");

      return cleanStyles ? `style="${cleanStyles}"` : "";
    });

    // Solo remover la clase flex-shrink-0 que causa problemas
    html = html.replace(
      /class="([^"]*)\bflex-shrink-0\b([^"]*)"/gi,
      (match, before, after) => {
        const classes = `${before} ${after}`.trim().replace(/\s+/g, " ");
        return classes ? `class="${classes}"` : "";
      }
    );

    // Asegurar que los divs y sections tengan ancho completo
    html = html.replace(/<div([^>]*)>/gi, (match, attrs) => {
      if (!attrs.includes("style")) {
        return `<div${attrs} style="width: 100%; max-width: 100%;">`;
      }
      if (!attrs.match(/width/i)) {
        return match.replace(
          /style="([^"]*)"/,
          'style="$1; width: 100%; max-width: 100%;"'
        );
      }
      return match;
    });

    html = html.replace(/<section([^>]*)>/gi, (match, attrs) => {
      if (!attrs.includes("style")) {
        return `<section${attrs} style="width: 100%; max-width: 100%;">`;
      }
      if (!attrs.match(/width/i)) {
        return match.replace(
          /style="([^"]*)"/,
          'style="$1; width: 100%; max-width: 100%;"'
        );
      }
      return match;
    });

    // Reemplazar enlaces de belm.pe (sin www) a www.belm.pe para evitar redirecciones internas
    html = html.replace(
      /https?:\/\/(?:www\.)?belm\.pe(\/[^"'\s<>]*)?/gi,
      (match) => {
        // Si ya tiene www, dejarlo igual
        if (match.includes("www.belm.pe")) {
          return match;
        }
        // Si no tiene www, agregarlo
        return match.replace(/https?:\/\/belm\.pe/gi, (url) => {
          return url.replace("belm.pe", "www.belm.pe");
        });
      }
    );

    return html;
  }, [product.description]);

  // Debug: Verificar la descripción recibida
  useEffect(() => {
    if (product.description) {
      console.log(
        "📝 Longitud de descripción original:",
        product.description.length
      );
      console.log(
        "📝 Longitud de descripción procesada:",
        processedDescription.length
      );
      console.log(
        "📝 Primeros 200 caracteres:",
        product.description.substring(0, 200)
      );
      console.log(
        "📝 Últimos 200 caracteres:",
        product.description.substring(product.description.length - 200)
      );
    }
  }, [product.description, processedDescription]);

  const { addToCart, cart } = useCartStore();
  const { addProduct } = useRecentlyViewedStore();
  const { openCart } = useUIStore();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<{
    [key: number]: string;
  }>({});

  // 🆕 Ref para evitar re-renders innecesarios del check
  const isUpdatingImageRef = useRef(false);

  // 🆕 Estados para Swiper
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  // 🆕 Sincronizar Swiper de miniaturas con imagen seleccionada
  useEffect(() => {
    if (thumbsSwiper && thumbsSwiper.slides) {
      thumbsSwiper.slideTo(selectedImage);
    }
  }, [selectedImage, thumbsSwiper]);

  // Agregar producto a vistos recientemente cuando se monta el componente
  useEffect(() => {
    addProduct(product);
  }, [product, addProduct]);

  const allAttributesSelected =
    !product.attributes ||
    product.attributes.length === 0 ||
    product.attributes.every((attr) => selectedAttributes[attr.id]);

  // Para productos variables: obtener la variación seleccionada según los atributos
  // Usar useMemo para evitar recálculos innecesarios que causan re-renders
  const selectedVariation = useMemo(() => {
    if (!product.variations || product.variations.length === 0) return null;
    return product.variations.find((variation) =>
      variation.attributes.every(
        (attr) => selectedAttributes[attr.id] === attr.option
      )
    );
  }, [product.variations, selectedAttributes]);

  // Para productos variables: usar la primera variación como "default" para mostrar precios
  // pero sin seleccionar visualmente ningún atributo hasta que el usuario haga clic
  const getDefaultVariationForPricing = () => {
    if (!product.variations || product.variations.length === 0) return null;
    return product.variations[0]; // Usar la primera variación
  };

  const defaultVariationForPricing = getDefaultVariationForPricing();

  // Obtener el stock disponible del producto o variación seleccionada
  const getAvailableStock = useMemo(() => {
    // Si hay una variación seleccionada, usar su stock
    if (
      selectedVariation?.stockQuantity !== null &&
      selectedVariation?.stockQuantity !== undefined
    ) {
      return selectedVariation.stockQuantity;
    }
    // Si no hay variación seleccionada pero hay una default, usar su stock
    if (
      defaultVariationForPricing?.stockQuantity !== null &&
      defaultVariationForPricing?.stockQuantity !== undefined
    ) {
      return defaultVariationForPricing.stockQuantity;
    }
    // Usar el stock del producto base
    return product.stockQuantity ?? null;
  }, [selectedVariation, defaultVariationForPricing, product.stockQuantity]);

  // Obtener la cantidad actual en el carrito para este producto/variación
  const getCurrentCartQuantity = useMemo(() => {
    const cartItem = cart.find(
      (item) =>
        item.slug === product.slug &&
        JSON.stringify(item.selectedAttributes || {}) ===
          JSON.stringify(selectedAttributes || {})
    );
    return cartItem ? cartItem.quantity : 0;
  }, [cart, product.slug, selectedAttributes]);

  // Calcular la cantidad máxima que se puede agregar
  const maxQuantity = useMemo(() => {
    if (getAvailableStock === null) return null; // Sin límite si no hay stock definido
    return Math.max(0, getAvailableStock - getCurrentCartQuantity);
  }, [getAvailableStock, getCurrentCartQuantity]);

  // 🆕 Determinar si el producto está sin stock (considerando stockStatus y stockQuantity)
  const isOutOfStock = useMemo(() => {
    // Primero verificar stockStatus
    if (product.stockStatus) {
      const status = product.stockStatus.toLowerCase().trim();
      if (
        status === "outofstock" ||
        status === "out-of-stock" ||
        status === "out_of_stock"
      ) {
        return true;
      }
    }

    // Si hay stock disponible calculado, verificar si es 0
    if (getAvailableStock !== null) {
      return getAvailableStock === 0;
    }

    // Si stockStatus no es "instock" ni "onbackorder", considerar sin stock
    if (product.stockStatus) {
      const status = product.stockStatus.toLowerCase().trim();
      if (status !== "instock" && status !== "onbackorder") {
        return true;
      }
    }

    // Si no hay información de stock, asumir que tiene stock (por defecto)
    return false;
  }, [product.stockStatus, getAvailableStock]);

  // Ajustar la cantidad local si excede el máximo disponible
  useEffect(() => {
    if (maxQuantity !== null && quantity > maxQuantity) {
      setQuantity(maxQuantity);
    }
    // Si la variación seleccionada no tiene stock, resetear cantidad a 0
    if (maxQuantity !== null && maxQuantity === 0) {
      setQuantity(0);
    }
  }, [maxQuantity, quantity]);

  // 🆕 GALERÍA ORDENADA SEGÚN ATRIBUTOS DE COLOR CON useMemo
  const galleryImages = useMemo(() => {
    const orderedImages: typeof product.images = [];
    const addedImageSrcs = new Set<string>(); // Para evitar duplicados

    // Si el producto tiene variaciones, ordenar según atributos de color
    if (product.variations && product.variations.length > 0) {
      // Obtener el atributo de color
      const colorAttribute = product.attributes?.find(
        (attr) =>
          attr.name.toLowerCase().includes("color") ||
          attr.name.toLowerCase().includes("colores")
      );

      if (colorAttribute && colorAttribute.options) {
        // Crear mapa de color -> imagen
        const colorImageMap = new Map<
          string,
          { id: number; src: string; alt: string }
        >();

        // Mapear cada variación a su color e imagen
        product.variations.forEach((variation) => {
          if (variation.image?.src) {
            // Buscar el color de esta variación
            const colorAttr = variation.attributes.find(
              (attr) => attr.id === colorAttribute.id
            );
            if (colorAttr?.option) {
              colorImageMap.set(colorAttr.option, variation.image);
            }
          }
        });

        // 🆕 AGREGAR IMÁGENES EN EL ORDEN DE LOS COLORES DEFINIDOS EN EL ATRIBUTO
        colorAttribute.options.forEach((colorOption) => {
          const variationImage = colorImageMap.get(colorOption.name);
          if (variationImage && !addedImageSrcs.has(variationImage.src)) {
            orderedImages.push(variationImage);
            addedImageSrcs.add(variationImage.src);
          }
        });

        // 🆕 AGREGAR IMÁGENES DE VARIACIONES QUE NO TIENEN ATRIBUTO DE COLOR EXPLÍCITO
        product.variations.forEach((variation) => {
          if (
            variation.image?.src &&
            !addedImageSrcs.has(variation.image.src)
          ) {
            // Verificar si esta variación ya fue añadida por su color principal
            const isAlreadyAddedByColor = colorAttribute.options.some(
              (option) => {
                const mappedImage = colorImageMap.get(option.name);
                return mappedImage?.src === variation.image?.src;
              }
            );

            if (!isAlreadyAddedByColor) {
              orderedImages.push(variation.image);
              addedImageSrcs.add(variation.image.src);
            }
          }
        });

        // 🆕 AGREGAR IMÁGENES PRINCIPALES DEL PRODUCTO AL FINAL (si no están ya incluidas)
        if (product.images && product.images.length > 0) {
          product.images.forEach((mainImage) => {
            if (!addedImageSrcs.has(mainImage.src)) {
              orderedImages.push(mainImage);
              addedImageSrcs.add(mainImage.src);
            }
          });
        }
      } else {
        // Si no hay atributo de color, agregar variaciones en orden original
        product.variations.forEach((variation) => {
          if (
            variation.image?.src &&
            !addedImageSrcs.has(variation.image.src)
          ) {
            orderedImages.push(variation.image);
            addedImageSrcs.add(variation.image.src);
          }
        });

        // Agregar imágenes principales al final
        if (product.images && product.images.length > 0) {
          product.images.forEach((mainImage) => {
            if (!addedImageSrcs.has(mainImage.src)) {
              orderedImages.push(mainImage);
              addedImageSrcs.add(mainImage.src);
            }
          });
        }
      }
    } else {
      // Si no hay variaciones, usar solo las imágenes principales
      if (product.images && product.images.length > 0) {
        product.images.forEach((mainImage) => {
          if (!addedImageSrcs.has(mainImage.src)) {
            orderedImages.push(mainImage);
            addedImageSrcs.add(mainImage.src);
          }
        });
      }
    }

    // 🆕 FALLBACK: Si no hay imágenes en absoluto, usar la imagen principal del producto
    if (
      orderedImages.length === 0 &&
      product.images &&
      product.images.length > 0
    ) {
      orderedImages.push(product.images[0]);
    }

    return orderedImages;
  }, [product]); // Depende del producto para recalcular cuando cambie

  // 🆕 INICIALIZAR selectedImage CON LA PRIMERA VARIACIÓN DE COLOR (solo al montar o cambiar de producto)
  useEffect(() => {
    // Solo inicializar si no hay atributos seleccionados aún
    if (
      galleryImages.length > 0 &&
      Object.keys(selectedAttributes).length === 0
    ) {
      // Buscar la imagen de la primera variación de color en la galería
      const colorAttribute = product.attributes?.find(
        (attr) =>
          attr.name.toLowerCase().includes("color") ||
          attr.name.toLowerCase().includes("colores")
      );

      if (
        colorAttribute &&
        colorAttribute.options &&
        colorAttribute.options.length > 0
      ) {
        const firstColorOption = colorAttribute.options[0];
        const firstColorVariation = product.variations?.find((variation) =>
          variation.attributes?.some(
            (attr) =>
              (attr.name.toLowerCase().includes("color") ||
                attr.name.toLowerCase().includes("colores")) &&
              attr.option === firstColorOption.name
          )
        );

        if (firstColorVariation?.image?.src) {
          const firstColorImageIndex = galleryImages.findIndex(
            (img) => img.src === firstColorVariation.image!.src
          );
          if (firstColorImageIndex !== -1) {
            setSelectedImage(firstColorImageIndex);
            return; // Ya encontramos la imagen del primer color, salimos
          }
        }
      }
      // Si no se encuentra una imagen de variación de color, o no hay variaciones,
      // o no hay atributo de color, simplemente selecciona la primera imagen de la galería.
      setSelectedImage(0);
    }
    // galleryImages ya depende de product, así que solo necesitamos product.id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, selectedAttributes]);

  // 🆕 MEJORAR useEffect PARA MEJOR MATCHING DE IMÁGENES CON VARIACIONES
  // Solo actualizar la imagen cuando hay una variación completa seleccionada
  useEffect(() => {
    // Solo actualizar si hay una variación completa (todos los atributos seleccionados)
    if (
      selectedVariation &&
      selectedVariation.image?.src &&
      galleryImages.length > 0 &&
      !isUpdatingImageRef.current
    ) {
      isUpdatingImageRef.current = true;
      // Buscar el índice de la imagen de la variación en la galería
      const imageIndex = galleryImages.findIndex(
        (img) => img.src === selectedVariation.image!.src
      );

      // Si encontramos la imagen, cambiar a ese índice
      if (imageIndex !== -1) {
        setSelectedImage(imageIndex);
      }
      // Resetear el flag después de un breve delay con cleanup
      const timeoutId = setTimeout(() => {
        isUpdatingImageRef.current = false;
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
    // NO actualizar la imagen si no hay variación completa
    // Esto permite que el check se mantenga visible cuando solo se selecciona un color
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariation]); // Solo depende de selectedVariation para evitar re-renders innecesarios

  const handleAddToCart = async () => {
    if (!allAttributesSelected) {
      toast.error("Por favor selecciona todas las opciones disponibles");
      return;
    }

    // 🆕 Validar que la variación seleccionada tenga stock
    if (selectedVariation) {
      const variationStock = selectedVariation.stockQuantity;
      if (
        variationStock !== null &&
        variationStock !== undefined &&
        variationStock === 0
      ) {
        toast.error(
          "Esta variación no tiene stock disponible. Por favor, selecciona otra opción."
        );
        return;
      }
    }

    // Validar stock disponible
    if (maxQuantity !== null && (maxQuantity === 0 || quantity > maxQuantity)) {
      if (maxQuantity === 0) {
        toast.error(
          "Esta variación no tiene stock disponible. Por favor, selecciona otra opción."
        );
      } else {
        toast.error(
          `No se puede agregar más de ${maxQuantity} producto${
            maxQuantity !== 1 ? "s" : ""
          } de este artículo`
        );
      }
      return;
    }

    setIsAddingToCart(true);

    try {
      // Simular delay para la animación
      await new Promise((resolve) => setTimeout(resolve, 800));

      for (let i = 0; i < quantity; i++) {
        const success = addToCart(product, selectedAttributes);
        if (!success) {
          // Si falla al agregar, mostrar error y salir
          toast.error(
            `No se puede agregar más de ${maxQuantity} producto${
              maxQuantity !== 1 ? "s" : ""
            } de este artículo`
          );
          setIsAddingToCart(false);
          return;
        }
      }

      toast.success(
        `${quantity} ${quantity === 1 ? "producto" : "productos"} agregado${
          quantity === 1 ? "" : "s"
        } al carrito`,
        {
          description: product.name,
          action: {
            label: "Ver carrito",
            onClick: () => router.push("/cart"),
          },
        }
      );

      openCart(); // Abrir el CartDrawer automáticamente
    } catch (error) {
      console.error("Error agregando al carrito:", error);
      toast.error("Error al agregar el producto al carrito");
    } finally {
      setIsAddingToCart(false);
    }

    setIsAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (!allAttributesSelected) {
      toast.error("Por favor selecciona todas las opciones disponibles");
      return;
    }

    // 🆕 Validar que la variación seleccionada tenga stock
    if (selectedVariation) {
      const variationStock = selectedVariation.stockQuantity;
      if (
        variationStock !== null &&
        variationStock !== undefined &&
        variationStock === 0
      ) {
        toast.error(
          "Esta variación no tiene stock disponible. Por favor, selecciona otra opción."
        );
        return;
      }
    }

    // Validar stock disponible
    if (maxQuantity !== null && (maxQuantity === 0 || quantity > maxQuantity)) {
      if (maxQuantity === 0) {
        toast.error(
          "Esta variación no tiene stock disponible. Por favor, selecciona otra opción."
        );
      } else {
        toast.error(
          `No se puede agregar más de ${maxQuantity} producto${
            maxQuantity !== 1 ? "s" : ""
          } de este artículo`
        );
      }
      return;
    }

    setIsAddingToCart(true);

    try {
      for (let i = 0; i < quantity; i++) {
        const success = addToCart(product, selectedAttributes);
        if (!success) {
          // Si falla al agregar, mostrar error y salir
          toast.error(
            `No se puede agregar más de ${maxQuantity} producto${
              maxQuantity !== 1 ? "s" : ""
            } de este artículo`
          );
          setIsAddingToCart(false);
          return;
        }
      }

      toast.success("Producto agregado al carrito", {
        description: "Redirigiendo al checkout...",
      });

      // Pequeña pausa para que el toast se muestre
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push("/checkout");
    } catch {
      toast.error("Error al agregar el producto al carrito");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Obtener la jerarquía de categorías de raíz a hoja usando el array global
  function getDeepestCategoryPath(
    productCategories: Array<{ id: number; name: string; slug: string }>,
    allCategories: IProductCategoryNode[]
  ): IProductCategoryNode[] {
    if (
      !productCategories ||
      !productCategories.length ||
      !allCategories.length
    )
      return [];

    // Función recursiva para encontrar una categoría por ID en el árbol
    const findCategoryById = (
      categories: IProductCategoryNode[],
      id: number
    ): IProductCategoryNode | null => {
      for (const cat of categories) {
        if (cat.id === id) return cat;
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryById(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    // Función recursiva para obtener el path desde la raíz hasta una categoría
    const getPathToCategory = (
      category: IProductCategoryNode,
      allCategories: IProductCategoryNode[]
    ): IProductCategoryNode[] => {
      const path: IProductCategoryNode[] = [category];
      if (category.parentId === null) {
        return path;
      }

      const parent = findCategoryById(allCategories, category.parentId);
      if (parent) {
        return [...getPathToCategory(parent, allCategories), ...path];
      }

      return path;
    };

    let maxPath: IProductCategoryNode[] = [];
    for (const cat of productCategories) {
      const foundCategory = findCategoryById(allCategories, cat.id);
      if (foundCategory) {
        const path = getPathToCategory(foundCategory, allCategories);
        if (path.length > maxPath.length) {
          maxPath = path;
        }
      }
    }
    return maxPath;
  }

  const categoryPath = getDeepestCategoryPath(
    product.categories || [],
    categories || []
  );

  // Breadcrumbs - Solo mostrar la categoría padre principal (primera del path)
  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    ...(categoryPath.length > 0
      ? [
          {
            label: categoryPath[0].name,
            href: `/categorias/${categoryPath[0].slug}`,
          },
        ]
      : []),
    { label: product.name, href: `/productos/${product.slug}` },
  ];

  // Usar precios de la variación seleccionada si existe, sino usar precios de la primera variación (para productos variables)
  // o precios del producto principal (para productos simples)
  const currentPrice =
    selectedVariation?.price ??
    defaultVariationForPricing?.price ??
    product.pricing.price ??
    0;
  const currentRegularPrice =
    selectedVariation?.regularPrice ??
    defaultVariationForPricing?.regularPrice ??
    product.pricing.regularPrice ??
    0;
  const currentSalePrice =
    selectedVariation?.salePrice ??
    defaultVariationForPricing?.salePrice ??
    product.pricing.salePrice ??
    null;

  const hasDiscount =
    currentSalePrice !== null &&
    currentSalePrice > 0 &&
    currentRegularPrice > 0 &&
    currentSalePrice < currentRegularPrice;

  const discountPercentage =
    hasDiscount && currentRegularPrice > 0
      ? Math.round(
          ((currentRegularPrice - currentSalePrice) / currentRegularPrice) * 100
        )
      : 0;

  const shortDescriptionHtml = useMemo(() => {
    if (!product.shortDescription) return "";

    let html = product.shortDescription;

    if (!/<p[\s>]/i.test(html.trim())) {
      html = html
        .replace(/\r\n/g, "\n")
        .replace(/\n{2,}/g, "</p><p>")
        .replace(/^/, "<p>")
        .replace(/$/, "</p>");
    }

    html = html
      .replace(/align="(left|start)"/gi, "")
      .replace(/style="([^"]*)"/gi, (_match: string, styles: string) => {
        const filtered = styles
          .split(";")
          .map((style: string) => style.trim())
          .filter(Boolean)
          .filter((style: string) => !/^text-align\s*:/i.test(style));
        return filtered.length > 0 ? `style="${filtered.join("; ")}"` : "";
      });

    return html;
  }, [product.shortDescription]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Breadcrumbs mejorados */}
      <nav className="max-w-7xl mx-auto pt-6 px-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 ">
          {breadcrumbs.map((b, i) => (
            <div key={b.href} className="flex items-center gap-2">
              <Link
                href={b.href}
                className={`hover:text-primary transition-colors text-nowrap duration-200 ${
                  i === breadcrumbs.length - 1
                    ? "max-w-[100px] sm:max-w-none truncate"
                    : ""
                }`}
              >
                {b.label}
              </Link>
              {i < breadcrumbs.length - 1 && (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galería de imágenes moderna */}
          <div className="animate-slide-in-left">
            {galleryImages && galleryImages.length > 0 ? (
              <div className="space-y-6">
                {/* Imagen principal con zoom */}
                <div className="relative group">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={galleryImages[selectedImage]?.src}
                        alt={galleryImages[selectedImage]?.alt || product.name}
                        width={600}
                        height={600}
                        className={`object-cover w-full h-full transition-transform duration-300 ${
                          isZoomed ? "scale-110" : "scale-100"
                        }`}
                        priority
                      />

                      {/* Overlay con controles */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                        <button
                          onClick={() => setShowLightbox(true)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transform hover:scale-110"
                        >
                          <ZoomIn className="w-6 h-6 text-gray-700" />
                        </button>
                      </div>

                      {/* Badge de descuento */}
                      {hasDiscount && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          -{discountPercentage}%
                        </div>
                      )}

                      {/* Badge de stock */}
                      <div className="absolute top-4 right-4">
                        {!isOutOfStock ? (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            En stock
                          </div>
                        ) : (
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            Sin stock
                          </div>
                        )}
                      </div>

                      {/* Navegación de imágenes */}
                      {galleryImages.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setSelectedImage(
                                selectedImage === 0
                                  ? galleryImages.length - 1
                                  : selectedImage - 1
                              )
                            }
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                          </button>
                          <button
                            onClick={() =>
                              setSelectedImage(
                                selectedImage === galleryImages.length - 1
                                  ? 0
                                  : selectedImage + 1
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Indicadores de progreso */}
                  {galleryImages.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {galleryImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            selectedImage === idx
                              ? "bg-primary w-8"
                              : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 🆕 Miniaturas con Swiper */}
                {galleryImages.length > 1 && (
                  <div className="relative w-full">
                    <Swiper
                      onSwiper={setThumbsSwiper}
                      spaceBetween={12}
                      slidesPerView={6}
                      /*  freeMode={true} */
                      watchSlidesProgress={true}
                      modules={[FreeMode, Navigation, Thumbs]}
                      navigation={{
                        nextEl: ".swiper-button-next-thumbs",
                        prevEl: ".swiper-button-prev-thumbs",
                      }}
                      className="w-full"
                      loop={false}
                      allowTouchMove={true}
                      centeredSlides={false}
                      breakpoints={{
                        320: {
                          slidesPerView: 3,
                          spaceBetween: 8,
                        },
                        640: {
                          slidesPerView: 4,
                          spaceBetween: 10,
                        },
                        768: {
                          slidesPerView: 5,
                          spaceBetween: 12,
                        },
                        1024: {
                          slidesPerView: 6,
                          spaceBetween: 12,
                        },
                      }}
                    >
                      {galleryImages.map((img, idx) => (
                        <SwiperSlide
                          key={`${img.id}-${idx}`}
                          className="!w-auto"
                        >
                          <button
                            onClick={() => setSelectedImage(idx)}
                            className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
                              selectedImage === idx
                                ? "border-primary shadow-lg"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Image
                              src={img.src}
                              alt={img.alt || product.name}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover"
                            />
                            {selectedImage === idx && (
                              <div className="absolute inset-0 bg-primary/20 transition-all duration-300" />
                            )}
                          </button>
                        </SwiperSlide>
                      ))}
                    </Swiper>

                    {/* 🆕 Flechas de navegación para miniaturas */}
                    {galleryImages.length > 6 && (
                      <>
                        <button
                          className="swiper-button-prev-thumbs absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                          aria-label="Anterior"
                          onClick={() => {
                            if (thumbsSwiper) {
                              thumbsSwiper.slidePrev();
                            }
                          }}
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          className="swiper-button-next-thumbs absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                          aria-label="Siguiente"
                          onClick={() => {
                            if (thumbsSwiper) {
                              thumbsSwiper.slideNext();
                            }
                          }}
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-3xl w-full h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Sin imagen disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="space-y-8 animate-slide-in-right">
            {/* Categoría */}
            {categoryPath.length > 0 && (
              <div>
                <span className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {categoryPath.map((cat) => cat.name).join(" / ")}
                </span>
              </div>
            )}

            {/* Título y compartir */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-xl lg:text-4xl font-bold text-gray-900 leading-tight flex-1">
                {product.name}
              </h1>
              <ShareProduct
                productName={product.name}
                productUrl={`/productos/${product.slug}`}
                productImage={product.images?.[0]?.src}
                className="flex-shrink-0"
              />
            </div>

            {/* Rating y reviews */}
            <div className="flex items-center mb-2">
              <StarRating rating={0} count={0} />
              {false && (
                <a
                  href="#reviews"
                  className="text-primary hover:text-primary/80 transition-colors duration-200 underline text-sm"
                >
                  Ver comentarios
                </a>
              )}
            </div>

            {/* Precios */}
            <div className="space-y-2 mb-2">
              {hasDiscount ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl lg:text-4xl text-primary font-bold">
                    S/. {currentSalePrice}
                  </span>
                  <span className="text-xl lg:text-2xl text-gray-400 line-through">
                    S/. {currentRegularPrice}
                  </span>
                  <span className="text-lg lg:text-xl text-red-500 font-semibold">
                    -{discountPercentage}%
                  </span>
                </div>
              ) : (
                <span className="text-2xl lg:text-4xl text-primary font-bold">
                  S/. {currentPrice}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-0 lg:mb-3">
              {!isOutOfStock ? (
                <div className="flex items-center gap-2 text-green-600 font-medium mb-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  En stock
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Sin stock
                </div>
              )}
            </div>

            <hr className="my-4 border-gray-300 lg:hidden" />

            {/* Descripción corta - Desktop (versión principal para SEO) */}
            {product.shortDescription && (
              <div
                className="hidden lg:block text-gray-700 leading-relaxed w-full [&_p]:text-justify [&_p]:mb-6 [&_p]:first-child:mt-0 [&_p]:last-child:mb-0 [&_p]:w-full"
                itemProp="description"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                  __html: shortDescriptionHtml,
                }}
                style={{
                  lineHeight: "1.7",
                  textAlign: "justify",
                }}
              />
            )}

            {/* Atributos seleccionables modernos */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="space-y-6">
                {product.attributes.map((attr) => {
                  console.log("🔍 Atributo completo:", attr);
                  console.log(
                    "🔄 Variaciones del producto:",
                    product.variations
                  );
                  const isColorAttr = isColorAttribute(attr);

                  // Obtener información del color seleccionado si es un atributo de color
                  let selectedColorInfo: {
                    name: string;
                    hex: string;
                    termDescription?: string;
                  } | null = null;
                  if (isColorAttr && selectedAttributes[attr.id]) {
                    // Buscar la opción seleccionada en los atributos del producto
                    const selectedOption = attr.options.find(
                      (opt) =>
                        opt.name.toLowerCase() ===
                        selectedAttributes[attr.id].toLowerCase()
                    );
                    if (selectedOption) {
                      const hex = extractColorValue(selectedOption);
                      selectedColorInfo = {
                        name: selectedOption.name,
                        hex: hex || "#CCCCCC",
                        termDescription:
                          selectedOption.description || undefined,
                      };
                    }
                    console.log(
                      "🎨 Color seleccionado info:",
                      selectedColorInfo
                    );
                  }

                  // Buscar la descripción del término seleccionado

                  return (
                    <div key={attr.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {attr.name}
                        </h3>
                        {selectedAttributes[attr.id] && (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Check className="w-4 h-4" />
                            <span>{selectedAttributes[attr.id]}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {attr.options.map((option) => {
                          // Normalizar comparación para evitar problemas de case
                          const selectedValue = selectedAttributes[attr.id];
                          const isSelected = selectedValue
                            ? selectedValue.toLowerCase().trim() ===
                              option.name.toLowerCase().trim()
                            : false;
                          const isColor = isColorAttr;

                          // 🆕 Encontrar la variación que corresponde a esta opción
                          // Para esto, simulamos la selección de esta opción y buscamos la variación
                          const tempSelectedAttributes = {
                            ...selectedAttributes,
                            [attr.id]: option.name,
                          };
                          const variationForThisOption =
                            product.variations?.find((variation) =>
                              variation.attributes.every(
                                (variationAttr) =>
                                  tempSelectedAttributes[variationAttr.id] ===
                                  variationAttr.option
                              )
                            );

                          // 🆕 Verificar si esta variación tiene stock disponible
                          const hasStock =
                            variationForThisOption?.stockQuantity === null ||
                            variationForThisOption?.stockQuantity ===
                              undefined ||
                            (variationForThisOption.stockQuantity !== null &&
                              variationForThisOption.stockQuantity > 0);

                          // 🆕 Verificar si esta variación está en el carrito
                          const cartItemForThisVariation = cart.find(
                            (item) =>
                              item.slug === product.slug &&
                              JSON.stringify(item.selectedAttributes || {}) ===
                                JSON.stringify(tempSelectedAttributes)
                          );
                          const cartQuantity = cartItemForThisVariation
                            ? cartItemForThisVariation.quantity
                            : 0;

                          // 🆕 Calcular stock disponible considerando el carrito
                          const availableStockForThisOption =
                            variationForThisOption?.stockQuantity !== null &&
                            variationForThisOption?.stockQuantity !== undefined
                              ? Math.max(
                                  0,
                                  variationForThisOption.stockQuantity -
                                    cartQuantity
                                )
                              : null;

                          const isOutOfStock =
                            variationForThisOption?.stockQuantity !== null &&
                            variationForThisOption?.stockQuantity !==
                              undefined &&
                            availableStockForThisOption !== null &&
                            availableStockForThisOption === 0;

                          return (
                            <button
                              key={option.id || option.name}
                              onClick={() => {
                                if (isOutOfStock) {
                                  toast.error(
                                    `La variación "${option.name}" no tiene stock disponible`
                                  );
                                  return;
                                }
                                setSelectedAttributes((prev) => ({
                                  ...prev,
                                  [attr.id]: option.name,
                                }));
                                // Resetear cantidad a 1 cuando se cambia la variación
                                setQuantity(1);
                              }}
                              disabled={isOutOfStock}
                              className={`relative group transition-all duration-300 ${
                                isOutOfStock
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:scale-105 active:scale-95"
                              } ${
                                isColor
                                  ? "w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2"
                                  : "px-6 py-3 rounded-2xl border-2 font-medium"
                              } ${
                                isSelected
                                  ? isColor
                                    ? "border-primary shadow-lg scale-110"
                                    : "border-primary bg-primary text-white shadow-lg"
                                  : isOutOfStock
                                  ? isColor
                                    ? "border-gray-200"
                                    : "border-gray-200 text-gray-400"
                                  : isColor
                                  ? "border-gray-300 hover:border-gray-400"
                                  : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                              style={
                                isColor
                                  ? {
                                      background: (() => {
                                        const colorValue =
                                          extractColorValue(option);
                                        return colorValue || "#CCCCCC";
                                      })(),
                                      boxShadow: isSelected
                                        ? "0 0 0 3px rgba(59, 130, 246, 0.3)"
                                        : undefined,
                                    }
                                  : undefined
                              }
                            >
                              {!isColor && option.name}
                              {!isColor && (
                                <div
                                  className={`absolute inset-0 bg-primary-100 rounded-2xl transition-all duration-300 ${
                                    isSelected
                                      ? "opacity-100"
                                      : "opacity-0 pointer-events-none"
                                  }`}
                                />
                              )}
                              {/* Check siempre en el DOM, controlado por clases CSS */}
                              <div
                                className={`absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center z-10 transition-all duration-200 ${
                                  isSelected
                                    ? "opacity-100 scale-100"
                                    : "opacity-0 scale-0 pointer-events-none"
                                }`}
                              >
                                <Check className="w-3 h-3" />
                              </div>
                              {/* 🆕 Indicador de sin stock */}
                              {isOutOfStock && !isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/60 rounded-full">
                                  <X className="w-4 h-4 text-gray-500" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cantidad */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-lg">Cantidad</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl overflow-hidden px-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 bg-accent rounded-l-xl hover:bg-secondary transition-colors duration-200 cursor-pointer"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="px-6 py-3 font-bold text-lg min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (maxQuantity !== null && quantity >= maxQuantity) {
                        toast.error(
                          `No se puede agregar más de ${maxQuantity} producto${
                            maxQuantity !== 1 ? "s" : ""
                          } de este artículo`
                        );
                        return;
                      }
                      setQuantity((prev) => {
                        // Asegurarse de no exceder el máximo
                        if (maxQuantity !== null && prev + 1 > maxQuantity) {
                          return maxQuantity;
                        }
                        return prev + 1;
                      });
                    }}
                    disabled={
                      maxQuantity !== null &&
                      (maxQuantity === 0 || quantity >= maxQuantity)
                    }
                    className={`p-3 bg-accent rounded-r-xl transition-colors duration-200 ${
                      maxQuantity !== null &&
                      (maxQuantity === 0 || quantity >= maxQuantity)
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-secondary cursor-pointer"
                    }`}
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* {typeof (
                  selectedVariation?.stock_quantity ||
                  defaultVariationForPricing?.stock_quantity ||
                  product.stock_quantity
                ) === "number" && (
                  <span className="text-sm text-gray-500">
                    {selectedVariation?.stock_quantity ||
                      defaultVariationForPricing?.stock_quantity ||
                      product.stock_quantity}{" "}
                    disponibles
                  </span>
                )} */}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={
                    !allAttributesSelected ||
                    isAddingToCart ||
                    isOutOfStock ||
                    (maxQuantity !== null &&
                      (maxQuantity === 0 ||
                        quantity === 0 ||
                        quantity > maxQuantity))
                  }
                  className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    allAttributesSelected &&
                    !isAddingToCart &&
                    !isOutOfStock &&
                    !(
                      maxQuantity !== null &&
                      (maxQuantity === 0 ||
                        quantity === 0 ||
                        quantity > maxQuantity)
                    )
                      ? "border-2 border-primary text-primary hover:bg-primary/90 hover:text-white shadow-lg hover:shadow-xl"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isAddingToCart ? (
                    <div className="animate-spin">
                      <RotateCcw className="w-6 h-6" />
                    </div>
                  ) : (
                    <ShoppingCart className="w-6 h-6" />
                  )}
                  {isAddingToCart ? "Agregando..." : "Agregar al carrito"}
                </button>

                <WishlistButton product={product} size="lg" />
              </div>

              <button
                onClick={handleBuyNow}
                disabled={
                  !allAttributesSelected ||
                  isAddingToCart ||
                  isOutOfStock ||
                  (maxQuantity !== null &&
                    (maxQuantity === 0 ||
                      quantity === 0 ||
                      quantity > maxQuantity))
                }
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-102 active:scale-98 ${
                  allAttributesSelected &&
                  !isAddingToCart &&
                  !isOutOfStock &&
                  !(
                    maxQuantity !== null &&
                    (maxQuantity === 0 ||
                      quantity === 0 ||
                      quantity > maxQuantity)
                  )
                    ? "bg-primary text-white hover:bg-primary shadow-lg hover:shadow-xl"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Comprar ahora
              </button>
            </div>

            {/* Descripción corta - Mobile (oculta para SEO para evitar duplicación) */}
            {product.shortDescription && (
              <div
                className="border-t lg:hidden border-gray-200 pt-5 text-gray-700 leading-relaxed w-full [&_p]:text-justify [&_p]:mb-6 [&_p]:first-child:mt-0 [&_p]:last-child:mb-0 [&_p]:w-full"
                data-noindex="true"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                  __html: shortDescriptionHtml,
                }}
                style={{
                  lineHeight: "1.7",
                  textAlign: "justify",
                }}
              />
            )}

            {/* Nota de compra - Propiedad purchase_note no disponible en IProduct */}
            {/* {product.purchase_note && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <span className="font-semibold text-yellow-800">Nota:</span>{" "}
                    <span className="text-yellow-700">
                      {product.purchase_note}
                    </span>
                  </div>
                </div>
              </div>
            )} */}

            {/* Beneficios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm">
                <div className="p-2 bg-green-100 rounded-full">
                  <Truck size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Envío gratis
                  </div>
                  <div className="text-gray-600 text-xs">
                    En compras mayores de S/.149.00
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Shield size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Garantia por los 12 meses
                  </div>
                  <div className="text-gray-600 text-xs">Garantía anual</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm">
                <div className="p-2 bg-orange-100 rounded-full">
                  <RotateCcw size={20} className="text-orange-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    7 Días de devolucion.
                  </div>
                  <div className="text-gray-600 text-xs">
                    Si el producto no esta como se describio
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags y categorías */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="space-y-4 text-sm text-gray-500">
            {product.categories && product.categories.length > 0 && (
              <div className="space-y-2">
                <span className="font-medium text-gray-700 block">
                  Categoría:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Tags - Propiedad tags no disponible en IProduct */}
            {/* {product.tags && product.tags.length > 0 && (
              <div className="space-y-2">
                <span className="font-medium text-gray-700 block">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* Descripción larga */}
        {product.description && (
          <div className="mt-12 w-full ">
            <div
              className="w-full prose prose-lg max-w-none [&_*]:max-w-none [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 [&_h1]:w-full [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:w-full [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:text-gray-900 [&_h3]:w-full [&_p]:mb-4 [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:text-justify [&_p]:w-full [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mr-6 [&_ul]:mb-4 [&_ul]:space-y-2 [&_ul]:max-w-[calc(100%-3rem)] [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mr-6 [&_ol]:mb-4 [&_ol]:space-y-2 [&_ol]:max-w-[calc(100%-3rem)] [&_li]:text-gray-700 [&_li]:leading-relaxed [&_li]:text-justify [&_li]:w-full [&_strong]:font-bold [&_strong]:text-gray-900 [&_em]:italic [&_em]:text-gray-700 [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary-dark [&_table]:border-collapse [&_table]:w-full [&_table]:mb-4 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-100 [&_th]:font-bold [&_div]:w-full [&_div]:!max-w-full [&_section]:w-full [&_section]:!max-w-full"
              style={{
                overflow: "visible",
                paddingLeft: "1rem",
                paddingRight: "1rem",
              }}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: processedDescription,
              }}
            />
          </div>
        )}

        {/* Reviews */}
        <ProductReviews
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
        />

        {/* Productos recomendados */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <ProductRecommendations
              recommendations={recommendations}
              currentProduct={product}
              title="También te puede interesar"
            />
          </div>
        )}

        {/* Productos vistos recientemente */}
        <div>
          <RecentlyViewedProducts currentProductId={product.id.toString()} />
        </div>
      </div>

      {/* Lightbox */}
      <div>
        {showLightbox && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLightbox(false)}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <Image
                src={galleryImages[selectedImage]?.src}
                alt={galleryImages[selectedImage]?.alt || product.name}
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* 🆕 Estilos mínimos para Swiper y animaciones Tailwind */}
      <style jsx global>{`
        .swiper-slide {
          width: 80px !important;
          flex-shrink: 0;
        }

        .swiper-button-prev-thumbs::after,
        .swiper-button-next-thumbs::after {
          display: none !important;
        }

        .swiper-button-prev-thumbs.swiper-button-disabled,
        .swiper-button-next-thumbs.swiper-button-disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        @media (max-width: 640px) {
          .swiper-slide {
            width: 70px !important;
          }
        }

        /* Animaciones personalizadas con Tailwind */
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
