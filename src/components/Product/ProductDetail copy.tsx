"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { IoCartOutline, IoHeartOutline } from "react-icons/io5";
import { IoStarOutline } from "react-icons/io5";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { Product, ProductAttribute, ProductImage } from "@/types/product";
import { extractColorValue, isColorAttribute } from "@/utils/productAttributes";
import { useSelectCategories } from "@/store/categoryStore";
import { ProductCategoryNode } from "@/types/ICategory";

interface ProductDetailProps {
  product: Product;
}

function findCategoryInTree(
  nodes: ProductCategoryNode[],
  slug: string
): ProductCategoryNode | null {
  for (const node of nodes) {
    if (node.slug === slug) {
      return node;
    }
    const found = findCategoryInTree(node.children, slug);
    if (found) {
      return found;
    }
  }
  return null;
}

function buildBreadcrumbs(
  productCategories: Product["categories"],
  allCategories: ProductCategoryNode[]
): string[] {
  if (!productCategories.length || !allCategories.length) return [];

  const category = findCategoryInTree(allCategories, productCategories[0].slug);
  if (!category) return [productCategories[0].name];

  const breadcrumbs: string[] = [];
  let current: ProductCategoryNode | null = category;

  const categoryMap = new Map<number, ProductCategoryNode>();
  function buildMap(nodes: ProductCategoryNode[]) {
    for (const node of nodes) {
      categoryMap.set(node.id, node);
      buildMap(node.children);
    }
  }
  buildMap(allCategories);

  while (current) {
    breadcrumbs.unshift(current.name);
    if (current.parentId === null) break;
    current = categoryMap.get(current.parentId) || null;
  }

  return breadcrumbs;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const {
    pricing,
    images: productImages,
    categories,
    attributes,
    variations,
    stockStatus,
  } = product;

  const allCategories = useSelectCategories();
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(categories, allCategories),
    [categories, allCategories]
  );

  const images = useMemo(
    () => (productImages.length ? productImages : []),
    [productImages]
  );

  const imageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    images.forEach((image, index) => map.set(image.src, index));
    return map;
  }, [images]);

  const colorAttribute = useMemo(
    () => attributes.find((attribute) => isColorAttribute(attribute)),
    [attributes]
  );

  const colorImageMap = useMemo(
    () => buildColorImageMap(variations),
    [variations]
  );

  const initialColor = useMemo(() => {
    if (!colorAttribute) return null;
    const firstOption = colorAttribute.options.find(
      (option) => option.name.trim().length
    );
    return firstOption?.name ?? null;
  }, [colorAttribute]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialColor
  );
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedColor(initialColor);
  }, [initialColor, product.id]);

  useEffect(() => {
    if (!images.length) {
      setActiveImageIndex(0);
      return;
    }

    if (selectedColor) {
      const matchIndex = getImageIndexForColor(
        images,
        colorImageMap,
        selectedColor
      );
      if (matchIndex !== null) {
        setActiveImageIndex(matchIndex);
        return;
      }
    }

    setActiveImageIndex((prev) =>
      prev < images.length ? prev : Math.max(images.length - 1, 0)
    );
  }, [images, selectedColor, colorImageMap]);

  const activeImage = images[activeImageIndex];

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
  };

  const handleColorSelect = (option: ProductAttribute["options"][number]) => {
    setSelectedColor(option.name);
    const matchIndex = getImageIndexForColor(
      images,
      colorImageMap,
      option.name
    );
    if (matchIndex !== null) {
      setActiveImageIndex(matchIndex);
    }
  };

  const formattedPrice = formatPrice(pricing.price, pricing.currency);
  const formattedRegularPrice = formatPrice(
    pricing.regularPrice,
    pricing.currency
  );

  const hasDiscount =
    pricing.regularPrice &&
    pricing.price &&
    pricing.regularPrice > pricing.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((pricing.regularPrice! - pricing.price!) / pricing.regularPrice!) * 100
      )
    : 0;

  const isInStock = stockStatus === "instock";

  const colorOptions = colorAttribute
    ? colorAttribute.options.filter((option) => option.name.trim().length)
    : [];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left Column - Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">
            {activeImage ? (
              <>
                <Image
                  key={activeImage.id}
                  src={activeImage.src}
                  alt={activeImage.alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  priority
                />
                {/* Discount Badge */}
                {hasDiscount && discountPercentage > 0 && (
                  <div className="absolute top-3 left-3 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white">
                    -{discountPercentage}%
                  </div>
                )}
                {/* Stock Badge */}
                {isInStock && (
                  <div className="absolute top-3 right-3 rounded-lg bg-green-500 px-3 py-1.5 text-sm font-semibold text-white">
                    En stock
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-zinc-500">
                Sin imagen disponible
              </div>
            )}
          </div>

          {/* Thumbnail Carousel */}
          {images.length > 1 && (
            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={8}
                navigation
                pagination={{ clickable: true }}
                slidesPerView="auto"
                className="!pb-8 [&_.swiper-button-next]:-right-2 [&_.swiper-button-prev]:-left-2 [&_.swiper-button-next]:text-zinc-600 [&_.swiper-button-prev]:text-zinc-600 [&_.swiper-pagination-bullet-active]:bg-primary"
              >
                {images.map((image, index) => {
                  const isActive = index === activeImageIndex;
                  return (
                    <SwiperSlide key={image.id} className="!w-20">
                      <button
                        type="button"
                        onClick={() => handleThumbnailClick(index)}
                        className={`relative block aspect-square w-full overflow-hidden rounded-lg border-2 transition ${
                          isActive
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <Image
                          src={image.src}
                          alt={image.alt || product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="flex flex-col gap-6">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="text-sm text-zinc-600">
              {breadcrumbs.map((crumb, index) => (
                <span key={index}>
                  {index > 0 && <span className="mx-2">/</span>}
                  <span>{crumb}</span>
                </span>
              ))}
            </nav>
          )}

          {/* Product Name */}
          <h1 className="text-3xl font-bold uppercase text-zinc-900 lg:text-4xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <IoStarOutline key={star} className="h-5 w-5 text-zinc-300" />
              ))}
            </div>
            <span className="text-sm text-zinc-500">(0)</span>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              {formattedPrice && (
                <span className="text-3xl font-bold text-zinc-900">
                  {formattedPrice}
                </span>
              )}
              {hasDiscount && formattedRegularPrice && (
                <>
                  <span className="text-lg text-zinc-400 line-through">
                    {formattedRegularPrice}
                  </span>
                  <span className="text-lg font-semibold text-red-500">
                    -{discountPercentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Stock Status */}
          {isInStock && (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-medium text-zinc-700">
                En stock
              </span>
            </div>
          )}

          {/* Description */}
          {product.shortDescription && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-zinc-600">
                {extractPlainText(product.shortDescription)}
              </p>
              <p className="text-base font-medium italic text-zinc-700">
                El mini bolso que tus outfits estaban pidiendo
              </p>
            </div>
          )}

          {/* Colors */}
          {colorOptions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                Colores
              </h3>
              <div className="grid grid-cols-6 gap-3 sm:grid-cols-8">
                {colorOptions.map((option) => {
                  const swatchColor = extractColorValue(option);
                  const isSelected = selectedColor === option.name;
                  return (
                    <button
                      key={option.id || option.name}
                      type="button"
                      onClick={() => handleColorSelect(option)}
                      className={`relative h-12 w-12 rounded-full border-2 transition ${
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-zinc-300 hover:border-zinc-400"
                      }`}
                      style={{
                        backgroundColor: swatchColor || "#CCCCCC",
                      }}
                      title={option.name}
                      aria-label={option.name}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
              Cantidad
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 transition hover:bg-zinc-50"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="h-10 w-20 rounded-lg border border-zinc-300 text-center text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 transition hover:bg-zinc-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-200 px-6 py-3 font-semibold text-zinc-800 transition hover:bg-zinc-300">
                <IoCartOutline className="h-5 w-5" />
                Agregar al carrito
              </button>
              <button className="relative flex h-12 w-12 items-center justify-center rounded-lg border-2 border-zinc-300 text-zinc-700 transition hover:bg-zinc-50">
                <IoHeartOutline className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-500"></span>
              </button>
            </div>
            <button className="w-full rounded-lg bg-zinc-200 px-6 py-3 font-semibold text-zinc-800 transition hover:bg-zinc-300">
              Comprar ahora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatPrice(value: number | null, currency: string): string | null {
  if (value === null) return null;
  if (!currency) return value.toFixed(2);
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function extractPlainText(html: string): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function buildColorImageMap(variations: Product["variations"]) {
  const map = new Map<string, ProductImage>();
  variations.forEach((variation) => {
    if (!variation.image) return;
    variation.attributes.forEach((attribute) => {
      if (isColorSlug(attribute.slug)) {
        map.set(
          normalizeText(attribute.option),
          variation.image as ProductImage
        );
      }
    });
  });
  return map;
}

function getImageIndexForColor(
  images: Product["images"],
  colorMap: Map<string, ProductImage>,
  colorName: string
): number | null {
  if (!colorName) return null;
  const normalizedColor = normalizeText(colorName);
  const fromMap = colorMap.get(normalizedColor);
  if (fromMap) {
    const matchIndex = images.findIndex((image) => image.src === fromMap.src);
    if (matchIndex !== -1) return matchIndex;
  }

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const alt = normalizeText(image.alt || "");
    const src = normalizeText(image.src || "");
    if (alt.includes(normalizedColor) || src.includes(normalizedColor)) {
      return index;
    }
  }
  return null;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isColorSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const normalized = slug.toLowerCase();
  return normalized.includes("color") || normalized.includes("colour");
}
