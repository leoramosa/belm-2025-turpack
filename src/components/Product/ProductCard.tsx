"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoCartOutline } from "react-icons/io5";
import { useMemo } from "react";

import {
  IProduct,
  ProductAttribute,
  ProductAttributeOption,
} from "@/types/product";
import { extractColorValue, isColorAttribute } from "@/utils/productAttributes";
import { useSelectCategories } from "@/store/categoryStore";
import { IProductCategoryNode } from "@/types/ICategory";
import WishlistButton from "./WishlistButton";

interface ProductCardProps {
  product: IProduct;
  viewMode?: "grid" | "list";
  customBadge?: {
    text: string;
    className?: string;
  };
  discountPercentage?: number;
  showCategoryBadge?: boolean; // Si es true, muestra el badge de categoría incluso si hay customBadge
}

function findCategoryInTree(
  nodes: IProductCategoryNode[],
  slug: string
): IProductCategoryNode | null {
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

function findRootCategory(
  categorySlug: string,
  categories: IProductCategoryNode[]
): IProductCategoryNode | null {
  const category = findCategoryInTree(categories, categorySlug);
  if (!category) return null;

  if (category.parentId === null) {
    return category;
  }

  let current = category;
  const categoryMap = new Map<number, IProductCategoryNode>();

  function buildMap(nodes: IProductCategoryNode[]) {
    for (const node of nodes) {
      categoryMap.set(node.id, node);
      buildMap(node.children);
    }
  }

  buildMap(categories);

  while (current.parentId !== null) {
    const parent = categoryMap.get(current.parentId);
    if (!parent) break;
    if (parent.parentId === null) {
      return parent;
    }
    current = parent;
  }

  return current;
}

export function ProductCard({
  product,
  viewMode = "grid",
  customBadge,
  discountPercentage,
  showCategoryBadge = false,
}: ProductCardProps) {
  const primaryImage = product.images[0] ?? null;
  const { pricing } = product;
  const allCategories = useSelectCategories();
  const router = useRouter();

  const rootCategory = useMemo(() => {
    if (!product.categories || product.categories.length === 0) {
      return null;
    }

    // Si el store tiene categorías, buscar la categoría padre
    if (allCategories && allCategories.length > 0) {
      for (const productCategory of product.categories) {
        const root = findRootCategory(productCategory.slug, allCategories);
        if (root) {
          return root;
        }
      }
    }

    // Si el store no tiene categorías o no encontró la raíz, usar la primera categoría del producto
    // Esto asegura que siempre se muestre un badge si el producto tiene categorías
    if (product.categories.length > 0) {
      return {
        id: product.categories[0].id,
        name: product.categories[0].name,
        slug: product.categories[0].slug,
      };
    }

    return null;
  }, [product.categories, allCategories]);

  const colorAttribute = product.attributes.find(
    (attribute: ProductAttribute) => isColorAttribute(attribute)
  );
  const colorOptions = colorAttribute
    ? colorAttribute.options.filter(
        (option: ProductAttributeOption) => option.name.trim().length
      )
    : [];
  const maxVisibleColors = 3;
  const visibleColors = colorOptions.slice(0, maxVisibleColors);
  const remainingColors = colorOptions.length - visibleColors.length;

  const isVariableProduct = product.variations && product.variations.length > 0;

  // Para productos variables, usar la primera variación para mostrar precio y descuento
  const firstVariation =
    isVariableProduct && product.variations?.[0] ? product.variations[0] : null;

  // Determinar el precio y precio regular a mostrar
  let displayPrice: number | null = null;
  let displayRegularPrice: number | null = null;
  const currency = pricing.currency;

  if (isVariableProduct && firstVariation) {
    // Producto variable: usar precio de la primera variación
    // Si tiene salePrice y regularPrice, usar esos
    if (
      firstVariation.salePrice !== null &&
      firstVariation.regularPrice !== null
    ) {
      displayPrice = firstVariation.salePrice;
      displayRegularPrice = firstVariation.regularPrice;
    } else if (firstVariation.price !== null) {
      // Si solo tiene price, usarlo como precio actual
      displayPrice = firstVariation.price;
      displayRegularPrice = firstVariation.regularPrice;
    }
  } else {
    // Producto simple: usar pricing del producto
    displayPrice = pricing.price;
    displayRegularPrice = pricing.regularPrice;
  }

  // Determinar si hay descuento
  const hasDiscount =
    displayRegularPrice !== null &&
    displayPrice !== null &&
    displayRegularPrice > displayPrice;

  const formattedPrice = formatPrice(displayPrice, currency);
  const formattedRegularPrice = formatPrice(displayRegularPrice, currency);

  // Vista horizontal (lista)
  if (viewMode === "list") {
    return (
      <Link className="cursor-pointer" href={`/productos/${product.slug}`}>
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row gap-6 transition hover:shadow-lg">
          {/* Image Section */}
          <div className="relative h-48 w-full overflow-hidden rounded-t-2xl md:h-auto md:w-56 md:rounded-l-2xl md:rounded-tr-none">
            {primaryImage ? (
              <Image
                src={primaryImage.src}
                alt={primaryImage.alt || product.name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 224px, 100vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm font-medium text-zinc-500">
                Sin imagen
              </div>
            )}
            {/* Badges Container - Mostrar customBadge y discountPercentage lado a lado si ambos existen */}
            {customBadge &&
            discountPercentage !== undefined &&
            discountPercentage > 0 ? (
              <div className="absolute top-2 left-2 flex gap-1 z-10">
                <span
                  className={`rounded-lg px-2 py-1 text-xs lg:text-sm font-semibold text-white ${
                    customBadge.className || "bg-green-500"
                  }`}
                >
                  {customBadge.text}
                </span>
                <span className="rounded-lg bg-primary px-2 py-1 text-xs lg:text-sm font-semibold text-white">
                  -{discountPercentage}%
                </span>
              </div>
            ) : (
              <>
                {/* Discount Badge - Mostrar solo si no hay customBadge */}
                {discountPercentage !== undefined &&
                  discountPercentage > 0 &&
                  !customBadge && (
                    <span className="absolute top-2 left-2 rounded-lg bg-primary px-2 py-1 text-xs lg:text-sm font-semibold text-white z-10">
                      -{discountPercentage}%
                    </span>
                  )}
                {/* Custom Badge - Mostrar solo si no hay discountPercentage o si discountPercentage es 0 */}
                {customBadge && (
                  <span
                    className={`absolute ${
                      discountPercentage !== undefined && discountPercentage > 0
                        ? "top-10 left-2"
                        : "top-2 left-2"
                    } rounded-lg px-2 py-1 text-xs lg:text-sm font-semibold text-white z-10 ${
                      customBadge.className || "bg-green-500"
                    }`}
                  >
                    {customBadge.text}
                  </span>
                )}
              </>
            )}
            {/* Category Badge - Mostrar si showCategoryBadge es true o si no hay customBadge ni discountBadge */}
            {((showCategoryBadge && rootCategory) ||
              (!customBadge && !discountPercentage && rootCategory)) && (
              <span
                className={`absolute ${
                  customBadge &&
                  discountPercentage !== undefined &&
                  discountPercentage > 0
                    ? "top-10 left-2"
                    : customBadge
                    ? "top-10 left-2"
                    : discountPercentage !== undefined && discountPercentage > 0
                    ? "top-10 left-2"
                    : "top-2 left-2"
                } rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white z-10`}
              >
                {rootCategory.name}
              </span>
            )}
            {/* Wishlist Button */}
            <div
              className="absolute top-2 right-2 z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <WishlistButton product={product} size="sm" />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex flex-1 flex-col gap-3 p-4 md:justify-between">
            <div className="flex-1">
              {/* Product Name */}
              <h3 className="font-bold text-sm lg:text-lg mb-1 line-clamp-1 cursor-pointer">
                {product.name}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-xs lg:text-sm mb-2 line-clamp-2">
                {extractPlainText(
                  product.shortDescription || product.description
                )}
              </p>

              {/* Colors */}
              {visibleColors.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-700">
                    Color:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {visibleColors.map((option: ProductAttributeOption) => {
                      const swatchColor = extractColorValue(option);
                      return (
                        <span
                          key={option.id || option.name}
                          className="h-5 w-5 rounded-full border border-zinc-300"
                          style={{
                            backgroundColor: swatchColor || "#CCCCCC",
                          }}
                          title={option.name}
                          aria-label={option.name}
                        />
                      );
                    })}
                    {remainingColors > 0 && (
                      <span className="text-xs text-zinc-500">
                        +{remainingColors}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-end justify-between gap-4">
              {/* Pricing */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  {formattedPrice ? (
                    <span className="text-primary font-bold text-md lg:text-xl">
                      {formattedPrice}
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-500">
                      Precio no disponible
                    </span>
                  )}
                  {hasDiscount && formattedRegularPrice && (
                    <span className="text-sm text-zinc-400 line-through">
                      {formattedRegularPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/productos/${product.slug}`);
                }}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary/90"
              >
                <IoCartOutline className="h-5 w-5" />
                <span>{isVariableProduct ? "Seleccionar" : "Agregar"}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vista vertical (grid) - por defecto
  return (
    <Link className="cursor-pointer" href={`/productos/${product.slug}`}>
      <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg">
        {/* Image Section */}
        <div className="relative object-cover aspect-square w-full overflow-hidden rounded-t-2xl">
          {primaryImage ? (
            <Image
              src={primaryImage.src}
              alt={primaryImage.alt || product.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm font-medium text-zinc-500">
              Sin imagen
            </div>
          )}
          {/* Badges Container - Mostrar customBadge y discountPercentage lado a lado si ambos existen */}
          {customBadge &&
          discountPercentage !== undefined &&
          discountPercentage > 0 ? (
            <div className="absolute top-2 left-2 flex gap-1 z-10">
              <span
                className={`rounded-lg px-2 py-1 text-xs lg:text-sm font-semibold text-white ${
                  customBadge.className || "bg-green-500"
                }`}
              >
                {customBadge.text}
              </span>
              <span className="rounded-lg bg-primary px-2 py-1 text-xs lg:text-sm font-semibold text-white">
                -{discountPercentage}%
              </span>
            </div>
          ) : (
            <>
              {/* Discount Badge - Mostrar solo si no hay customBadge */}
              {discountPercentage !== undefined &&
                discountPercentage > 0 &&
                !customBadge && (
                  <span className="absolute top-2 left-2 rounded-lg bg-primary px-2 py-1 text-xs lg:text-sm font-semibold text-white z-10">
                    -{discountPercentage}%
                  </span>
                )}
              {/* Custom Badge - Mostrar solo si no hay discountPercentage o si discountPercentage es 0 */}
              {customBadge && (
                <span
                  className={`absolute ${
                    discountPercentage !== undefined && discountPercentage > 0
                      ? "top-10 left-2"
                      : "top-2 left-2"
                  } rounded-lg px-2 py-1 text-xs lg:text-sm font-semibold text-white z-10 ${
                    customBadge.className || "bg-green-500"
                  }`}
                >
                  {customBadge.text}
                </span>
              )}
            </>
          )}
          {/* Category Badge - Mostrar si showCategoryBadge es true o si no hay customBadge ni discountBadge */}
          {((showCategoryBadge && rootCategory) ||
            (!customBadge && !discountPercentage && rootCategory)) && (
            <span
              className={`absolute ${
                customBadge &&
                discountPercentage !== undefined &&
                discountPercentage > 0
                  ? "top-10 left-2"
                  : customBadge
                  ? "top-10 left-2"
                  : discountPercentage !== undefined && discountPercentage > 0
                  ? "top-10 left-2"
                  : "top-2 left-2"
              } rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white z-10`}
            >
              {rootCategory.name}
            </span>
          )}
          {/* Wishlist Button */}
          <div
            className="absolute top-2 right-2 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <WishlistButton product={product} size="sm" />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 flex flex-col justify-between grow">
          {/* Product Name */}
          <h3 className="font-semibold text-sm lg:text-[16px] mb-1 line-clamp-1 cursor-pointer">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-xs lg:text-sm mb-2 line-clamp-2">
            {extractPlainText(product.shortDescription || product.description)}
          </p>

          {/* Pricing */}
          <div className="flex items-end gap-2 mb-2">
            {formattedPrice ? (
              <span className="text-primary font-bold text-md lg:text-xl">
                {formattedPrice}
              </span>
            ) : (
              <span className="text-sm text-zinc-500">
                Precio no disponible
              </span>
            )}
            {hasDiscount && formattedRegularPrice && (
              <span className="text-sm text-zinc-400 line-through">
                {formattedRegularPrice}
              </span>
            )}
          </div>

          {/* Colors */}
          {visibleColors.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-zinc-500">Colores:</span>
              <div className="flex items-center gap-1.5">
                {visibleColors.map((option: ProductAttributeOption) => {
                  const swatchColor = extractColorValue(option);
                  return (
                    <span
                      key={option.id || option.name}
                      className="h-4 w-4 rounded-full border border-zinc-300"
                      style={{
                        backgroundColor: swatchColor || "#CCCCCC",
                      }}
                      title={option.name}
                      aria-label={option.name}
                    />
                  );
                })}
                {remainingColors > 0 && (
                  <span className="text-xs text-zinc-500">
                    +{remainingColors}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/productos/${product.slug}`);
            }}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary/90"
          >
            <IoCartOutline className="h-5 w-5" />
            <span>{isVariableProduct ? "Seleccionar" : "Comprar"}</span>
          </button>
        </div>
      </div>
    </Link>
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
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

export default ProductCard;
