"use client";

import React, { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { IoGridOutline, IoListOutline } from "react-icons/io5";

import { ProductCard } from "@/components/Product/ProductCard";
import {
  ProductFilter,
  ProductFilters,
} from "@/components/Product/ProductFilter";
import { ProductPagination } from "@/components/Product/ProductPagination";
import { IProduct } from "@/types/product";
import {
  useSelectProducts,
  useProductStore,
  ProductState,
} from "@/store/productStore";
import { useSelectCategories } from "@/store/categoryStore";
import { isColorAttribute, extractColorValue } from "@/utils/productAttributes";
import { IProductCategoryNode } from "@/types/ICategory";

interface ProductGridClientProps {
  title?: string; // Hacer opcional porque si hay customHeader, no se usa
  products: IProduct[];
  disableAutoCategoryFilter?: boolean; // Para desactivar el filtro automático de categoría cuando los productos ya vienen filtrados
  initialSearchQuery?: string; // Término de búsqueda inicial desde la URL
  customHeader?: React.ReactNode; // Header personalizado opcional
  defaultSortBy?: SortOption; // Ordenamiento por defecto
}

type SortOption =
  | "name"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "popularity"
  | "sale";
type ViewMode = "grid" | "list";

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

function getCategoryHierarchy(
  categorySlug: string,
  allCategories: IProductCategoryNode[]
): {
  category: string | null;
  subcategory: string | null;
  subSubcategory: string | null;
} {
  const category = findCategoryInTree(allCategories, categorySlug);
  if (!category) {
    return { category: null, subcategory: null, subSubcategory: null };
  }

  // Si es una categoría raíz
  if (category.parentId === null) {
    return { category: categorySlug, subcategory: null, subSubcategory: null };
  }

  // Buscar el padre
  const current: IProductCategoryNode | null = category;
  const categoryMap = new Map<number, IProductCategoryNode>();

  function buildMap(nodes: IProductCategoryNode[]) {
    for (const node of nodes) {
      categoryMap.set(node.id, node);
      buildMap(node.children);
    }
  }

  buildMap(allCategories);

  // Si tiene un padre, verificar si el padre es raíz
  if (current.parentId !== null) {
    const parent = categoryMap.get(current.parentId);
    if (parent) {
      if (parent.parentId === null) {
        // Es una subcategoría
        return {
          category: parent.slug,
          subcategory: categorySlug,
          subSubcategory: null,
        };
      } else {
        // Es una sub-subcategoría
        const grandParent = categoryMap.get(parent.parentId);
        if (grandParent && grandParent.parentId === null) {
          return {
            category: grandParent.slug,
            subcategory: parent.slug,
            subSubcategory: categorySlug,
          };
        }
      }
    }
  }

  return { category: null, subcategory: null, subSubcategory: null };
}

export function ProductGridClient({
  title,
  products,
  disableAutoCategoryFilter = false,
  initialSearchQuery = "",
  customHeader,
  defaultSortBy = "name",
}: ProductGridClientProps) {
  const pathname = usePathname();
  const setProducts = useProductStore(
    (state: ProductState) => state.setProducts
  );
  const productList = useSelectProducts();
  const allCategories = useSelectCategories();
  // Estado de paginación - resetear cuando cambian los filtros importantes
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024 ? 8 : 9;
    }
    return 9;
  });
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>(defaultSortBy);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  // Detectar si estamos en una página de categoría y actualizar filtros
  const categorySlugFromPath = useMemo(() => {
    if (pathname?.startsWith("/categorias/")) {
      return pathname.split("/categorias/")[1] || null;
    }
    return null;
  }, [pathname]);

  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    category: null,
    subcategory: null,
    subSubcategory: null,
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
    selectedColors: [],
    selectedTags: [],
  });

  // NOTA: La sincronización de filtros de categoría con la URL ahora se maneja
  // completamente en ProductFilter para evitar conflictos. ProductFilter tiene
  // prioridad sobre la sincronización de categorías desde la URL.
  // Este efecto ya no maneja filtros de categoría cuando disableAutoCategoryFilter está activo.

  useEffect(() => {
    // Limpiar y actualizar el store con los productos recibidos, preservando el orden
    // Esto asegura que no haya productos residuales de otras páginas
    if (products && products.length > 0) {
      setProducts(products);
    }
  }, [products, setProducts]);

  // Sincronizar searchQuery cuando cambia initialSearchQuery (desde URL)
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchQuery]);

  // Sincronizar searchQuery cuando cambia initialSearchQuery (desde URL)
  useEffect(() => {
    if (initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchQuery]);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 1024 ? 8 : 9);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredProducts = useMemo(() => {
    // Usar productList del store (que se actualiza con los productos recibidos)
    // pero si está vacío, usar los productos recibidos directamente
    const sourceProducts = productList.length > 0 ? productList : products;
    const filtered = sourceProducts.filter((product) => {
      // Search filter (from sidebar)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.shortDescription.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Search filter (from top bar)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.shortDescription.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter (hierarchical)
      if (filters.category || filters.subcategory || filters.subSubcategory) {
        const targetSlug =
          filters.subSubcategory || filters.subcategory || filters.category;
        if (targetSlug) {
          const matchesCategory = product.categories.some(
            (cat) => cat.slug === targetSlug
          );
          if (!matchesCategory) return false;
        }
      }

      // Price range filter
      const productPrice = product.pricing.price;
      if (productPrice !== null) {
        if (filters.minPrice !== null && productPrice < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice !== null && productPrice > filters.maxPrice) {
          return false;
        }
      }

      // Stock filter
      if (filters.inStockOnly && product.stockStatus !== "instock") {
        return false;
      }

      // Color filter - ahora filtra por nombre de opción
      if (filters.selectedColors.length > 0) {
        const productColorNames = new Set<string>();
        product.attributes.forEach((attr) => {
          if (isColorAttribute(attr)) {
            attr.options.forEach((option) => {
              if (option.name.trim()) {
                productColorNames.add(option.name.toLowerCase().trim());
              }
            });
          }
        });
        const hasSelectedColor = filters.selectedColors.some((colorName) =>
          productColorNames.has(colorName.toLowerCase().trim())
        );
        if (!hasSelectedColor) return false;
      }

      // Tags filter - soporta tags reales (IProductTag) y nombres de categorías como fallback
      if (filters.selectedTags.length > 0) {
        // Primero intentar con tags reales del producto
        let hasSelectedTag = false;
        if (product.tags && product.tags.length > 0) {
          const productTagSlugs = product.tags.map((tag) =>
            tag.slug.toLowerCase()
          );
          hasSelectedTag = filters.selectedTags.some((tag) =>
            productTagSlugs.includes(tag.toLowerCase())
          );
        }
        // Si no hay tags reales o no coinciden, usar nombres de categorías como fallback
        if (!hasSelectedTag) {
          const productCategoryNames = product.categories.map((cat) =>
            cat.name.toLowerCase()
          );
          hasSelectedTag = filters.selectedTags.some((tag) =>
            productCategoryNames.includes(tag.toLowerCase())
          );
        }
        if (!hasSelectedTag) return false;
      }

      return true;
    });

    // Sort products
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc":
          const priceA = a.pricing.price ?? 0;
          const priceB = b.pricing.price ?? 0;
          return priceA - priceB;
        case "price-desc":
          const priceA2 = a.pricing.price ?? 0;
          const priceB2 = b.pricing.price ?? 0;
          return priceB2 - priceA2;
        case "newest":
          // Mantener el orden original del servidor (ya viene ordenado por fecha)
          // No reordenar para preservar el orden que viene del backend
          return 0;
        case "popularity":
          // Mantener el orden original del servidor (ya viene ordenado por popularidad)
          // No reordenar para preservar el orden que viene del backend
          return 0;
        case "sale":
          // Mantener el orden original del servidor (productos en oferta ya filtrados)
          // No reordenar para preservar el orden que viene del backend
          return 0;
        default:
          return 0;
      }
    });

    return sorted;
  }, [productList, products, filters, searchQuery, sortBy]);

  // Resetear a página 1 cuando cambian los filtros importantes o los productos filtrados
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.category,
    filters.subcategory,
    filters.subSubcategory,
    filters.minPrice,
    filters.maxPrice,
    filters.inStockOnly,
    filters.selectedColors,
    filters.selectedTags,
    filters.search,
    searchQuery,
    sortBy,
    filteredProducts.length, // Resetear cuando cambia el número de productos filtrados
  ]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 lg:py-12">
      {/* Mostrar customHeader si existe, sino mostrar título por defecto */}
      {/* IMPORTANTE: Si hay customHeader, NO mostrar el título por defecto */}
      {customHeader && <>{customHeader}</>}
      {!customHeader && title && (
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-primary text-center pt-10">
            {title}
          </h1>
          <p className="text-gray-600 text-lg text-center">
            Descubre nuestra selección de productos con los mejores atributos y
            precios.
          </p>
        </div>
      )}
      <div className="">
        {/* Search Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 w-full">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300"
            />
          </div>
          {/* View Toggle */}
          <div className="relative flex rounded-full bg-white p-1 shadow-sm border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`relative z-10 flex items-center justify-center rounded-tl-full rounded-bl-full px-4 py-2.5 transition-all duration-300 ${
                viewMode === "grid"
                  ? "bg-primary text-white "
                  : "text-gray-600 hover:text-gray-900"
              }`}
              aria-label="Vista de cuadrícula"
            >
              <IoGridOutline className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`relative z-10 flex items-center justify-center rounded-tr-full rounded-br-full px-4 py-2.5 transition-all duration-300 ${
                viewMode === "list"
                  ? "bg-primary text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              aria-label="Vista de lista"
            >
              <IoListOutline className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 sm:px-4 sm:py-3 bg-white rounded-2xl border border-gray-200 focus:border-primary outline-none text-sm sm:text-base w-[120px] sm:w-[140px] md:w-[160px] lg:w-auto overflow-hidden text-ellipsis whitespace-nowrap"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="newest">Más recientes</option>
                <option value="popularity">Más vendidos</option>
                <option value="sale">Ofertas</option>
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar - Filters */}
        <ProductFilter
          products={products}
          filters={filters}
          onFiltersChange={setFilters}
          disableAutoCategoryFilter={disableAutoCategoryFilter}
        />

        {/* Main Content - Product Grid */}
        <div className="flex-1">
          {/* Top Bar - Search, View Toggle, Sort */}

          {/* Products Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product: IProduct) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode="grid"
                  />
                ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className="text-zinc-500">No se encontraron productos</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product: IProduct) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode="list"
                  />
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-zinc-500">No se encontraron productos</p>
                </div>
              )}
            </div>
          )}

          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={productList.length}
            filteredItems={filteredProducts.length}
          />
        </div>
      </div>
    </section>
  );
}
