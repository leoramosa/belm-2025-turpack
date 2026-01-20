"use client";

import React, { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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
    selectedBrand: null,
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

  // Sincronizar searchQuery con initialSearchQuery cuando cambia (desde URL)
  // Esto asegura que el input muestre el query correcto inicialmente
  useEffect(() => {
    if (pathname === "/search") {
      if (initialSearchQuery) {
        // Inicializar con el query de la URL
        setSearchQuery(initialSearchQuery);
        // Limpiar el input después de un delay muy corto para que se muestren los productos primero
        const timer = setTimeout(() => {
          setSearchQuery("");
        }, 100);
        return () => clearTimeout(timer);
      } else {
        // Si no hay query en la URL, limpiar el input
        setSearchQuery("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, initialSearchQuery]);

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

    const isSearchPage = pathname === "/search";
    const hasInitialSearchQuery = Boolean(
      initialSearchQuery && initialSearchQuery.trim() !== ""
    );

    // CRÍTICO: Si estamos en /search y hay initialSearchQuery, los productos YA vienen filtrados del servidor
    // NO aplicar NINGÚN filtro de búsqueda, solo aplicar otros filtros (categoría, precio, etc.)
    const skipSearchFilters = isSearchPage && hasInitialSearchQuery;

    const filtered = sourceProducts.filter((product) => {
      // Helper para obtener la marca del producto
      const getProductBrand = (product: IProduct): string | null => {
        // Primero buscar en brands (si viene de la API)
        if (product.brands && product.brands.length > 0) {
          return product.brands[0].name;
        }
        // Fallback: buscar en atributos
        for (const attr of product.attributes) {
          const slug = attr.slug.toLowerCase();
          const name = attr.name.toLowerCase();
          if (
            slug.includes("brand") ||
            slug.includes("marca") ||
            name.includes("brand") ||
            name.includes("marca")
          ) {
            if (attr.options && attr.options.length > 0) {
              return attr.options[0].name;
            }
          }
        }
        return null;
      };

      // Search filter (from sidebar) - NO aplicar si hay initialSearchQuery
      if (!skipSearchFilters && filters.search) {
        const searchLower = filters.search.toLowerCase().trim();
        const productBrand = getProductBrand(product);
        const productBrandLower = productBrand ? productBrand.toLowerCase().trim() : "";
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.shortDescription?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          (productBrandLower && (productBrandLower === searchLower || productBrandLower.includes(searchLower) || searchLower.includes(productBrandLower)));
        if (!matchesSearch) return false;
      }

      // Search filter (from top bar) - NO aplicar si hay initialSearchQuery
      if (!skipSearchFilters && searchQuery && searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase().trim();
        const productBrand = getProductBrand(product);
        const productBrandLower = productBrand ? productBrand.toLowerCase().trim() : "";
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.shortDescription?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          (productBrandLower && (productBrandLower === searchLower || productBrandLower.includes(searchLower) || searchLower.includes(productBrandLower)));
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

      // Brand filter - primero desde brands (API), sino desde atributos
      if (filters.selectedBrand) {
        let productBrandName: string | null = null;
        
        // Primero buscar en brands (si viene de la API)
        if (product.brands && product.brands.length > 0) {
          productBrandName = product.brands[0].name.trim();
        } else {
          // Fallback: buscar en atributos
          for (const attr of product.attributes) {
            const slug = attr.slug.toLowerCase();
            const name = attr.name.toLowerCase();
            if (
              slug.includes("brand") ||
              slug.includes("marca") ||
              name.includes("brand") ||
              name.includes("marca")
            ) {
              if (attr.options && attr.options.length > 0) {
                productBrandName = attr.options[0].name.trim();
                break;
              }
            }
          }
        }
        
        if (!productBrandName || 
            productBrandName.toLowerCase().trim() !== filters.selectedBrand.toLowerCase().trim()) {
          return false;
        }
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
  }, [
    productList,
    products,
    filters,
    searchQuery,
    sortBy,
    pathname,
    initialSearchQuery,
  ]);

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
      <div className="mb-6">
        {/* Mobile: Search Bar en línea completa, controles abajo */}
        {/* Desktop: Todo en una sola línea */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3">
          {/* Search Bar - Línea completa en mobile */}
          <div className="relative w-full lg:flex-1">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 pointer-events-none"
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
              onChange={(e) => {
                const newQuery = e.target.value;
                setSearchQuery(newQuery);
                // Si estamos en la página de búsqueda, actualizar la URL inmediatamente
                if (pathname === "/search") {
                  // Usar replace para evitar agregar entradas al historial
                  if (newQuery.trim()) {
                    router.replace(
                      `/search?q=${encodeURIComponent(newQuery.trim())}`
                    );
                  } else {
                    router.replace("/search");
                  }
                }
              }}
              onKeyDown={(e) => {
                // Si presiona Enter, navegar a la página de búsqueda
                if (e.key === "Enter" && pathname !== "/search") {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    router.push(
                      `/search?q=${encodeURIComponent(searchQuery.trim())}`
                    );
                  }
                }
              }}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300"
            />
          </div>

          {/* Controles - Segunda línea en mobile, misma línea en desktop */}
          <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto">
            {/* Filters Button - Mobile Only */}
            <button
              type="button"
              onClick={() => setIsFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-white rounded-2xl border border-primary/30 text-primary font-medium text-sm sm:text-base hover:bg-primary/10 transition-colors duration-200 shrink-0"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="6"
                  cy="6"
                  r="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="12"
                  r="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="6"
                  cy="18"
                  r="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span>Filtros</span>
              <svg
                className="w-4 h-4"
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
            </button>

            {/* View Toggle */}
            <div className="relative flex rounded-full bg-white lg:p-1 shadow-sm border border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`relative z-10 flex items-center justify-center rounded-tl-full rounded-bl-full px-4 py-2.5 transition-all duration-300 ${
                  viewMode === "grid"
                    ? "bg-primary text-white"
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

            {/* Sort Dropdown */}
            <div className="relative flex-1 lg:flex-none lg:min-w-[180px] shrink-0">
              <select
                value={sortBy}
                onChange={(e) => {
                  const value = e.target.value as SortOption;

                  // Redirigir a rutas específicas para ciertas opciones
                  if (value === "sale") {
                    router.push("/ofertas-especiales");
                    return;
                  }
                  if (value === "popularity") {
                    router.push("/lo-mas-vendido");
                    return;
                  }
                  if (value === "newest") {
                    router.push("/lo-mas-nuevo");
                    return;
                  }

                  // Para otras opciones, solo cambiar el ordenamiento
                  setSortBy(value);
                }}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white rounded-2xl border border-gray-200 focus:border-primary outline-none text-sm sm:text-base overflow-hidden text-ellipsis whitespace-nowrap appearance-none pr-8"
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
        {/* Contador de productos - Solo mostrar si hay productos */}
        {filteredProducts.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Mostrando {filteredProducts.length} de {products.length} productos
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar - Filters (Desktop) */}
        <ProductFilter
          products={products}
          filters={filters}
          onFiltersChange={setFilters}
          disableAutoCategoryFilter={disableAutoCategoryFilter}
        />

        {/* Mobile Filters Drawer */}
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
              isFiltersOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsFiltersOpen(false)}
          />
          {/* Drawer */}
          <div
            className={`fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
              isFiltersOpen
                ? "translate-x-0"
                : "-translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Cerrar filtros"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {/* Filters Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <ProductFilter
                  products={products}
                  filters={filters}
                  onFiltersChange={(newFilters) => {
                    setFilters(newFilters);
                  }}
                  disableAutoCategoryFilter={disableAutoCategoryFilter}
                  isMobile={true}
                  onFilterApplied={() => setIsFiltersOpen(false)}
                />
              </div>
            </div>
          </div>
        </>

        {/* Main Content - Product Grid */}
        <div className="flex-1">
          {/* Top Bar - Search, View Toggle, Sort */}

          {/* Products Grid/List */}
          {viewMode === "grid" ? (
            <div
              className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              itemScope
              itemType="https://schema.org/ItemList"
            >
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product: IProduct) => {
                  // Detectar si estamos en la ruta /lo-mas-nuevo, /lo-mas-vendido o /ofertas-especiales
                  const isLoMasNuevoPage = pathname === "/lo-mas-nuevo";
                  const isLoMasVendidoPage = pathname === "/lo-mas-vendido";
                  const isOfertasEspecialesPage =
                    pathname === "/ofertas-especiales";

                  // Calcular porcentaje de descuento para /ofertas-especiales
                  const calculateDiscountPercentage = () => {
                    if (!isOfertasEspecialesPage) return undefined;

                    const isVariableProduct =
                      product.variations && product.variations.length > 0;

                    // Obtener la primera variación para productos variables
                    const getDefaultVariationForPricing = () => {
                      if (
                        !product.variations ||
                        product.variations.length === 0
                      )
                        return null;
                      return product.variations[0];
                    };
                    const defaultVariationForPricing =
                      getDefaultVariationForPricing();

                    // Determinar precios y descuento basado en primera variación o producto principal
                    const currentRegularPrice =
                      defaultVariationForPricing?.regularPrice ??
                      product.pricing.regularPrice;
                    const currentSalePrice =
                      defaultVariationForPricing?.salePrice ??
                      product.pricing.salePrice;

                    const hasDiscount =
                      currentSalePrice &&
                      currentRegularPrice &&
                      currentSalePrice !== currentRegularPrice;

                    if (!hasDiscount) return undefined;

                    const regular = currentRegularPrice ?? 0;
                    const sale = currentSalePrice ?? 0;
                    if (regular === 0) return undefined;

                    return Math.round(((regular - sale) / regular) * 100);
                  };

                  const discountPercentage = calculateDiscountPercentage();

                  // Determinar contexto según la página
                  const getContext = ():
                    | "home"
                    | "category"
                    | "recommendation"
                    | "related"
                    | "default" => {
                    if (isLoMasNuevoPage) return "default";
                    if (isLoMasVendidoPage) return "default";
                    if (isOfertasEspecialesPage) return "default";
                    if (pathname?.startsWith("/categorias")) return "category";
                    if (pathname === "/shop") return "default";
                    return "default";
                  };

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode="grid"
                      context={getContext()}
                      customBadge={
                        isLoMasNuevoPage
                          ? {
                              text: "NUEVO",
                              className: "bg-green-500",
                            }
                          : isLoMasVendidoPage
                          ? {
                              text: "Más Vendido",
                              className: "bg-yellow-500",
                            }
                          : isOfertasEspecialesPage
                          ? {
                              text: "Oferta",
                              className: "bg-orange-500",
                            }
                          : undefined
                      }
                      discountPercentage={discountPercentage}
                      showCategoryBadge={
                        isLoMasNuevoPage ||
                        isLoMasVendidoPage ||
                        isOfertasEspecialesPage
                      }
                    />
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <svg
                      className="w-16 h-16 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No se encontraron productos
                      </h3>
                      <p className="text-sm text-zinc-600 max-w-md">
                        Intenta ajustar los filtros o buscar con otros términos
                        para encontrar lo que buscas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6" data-noindex="true">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product: IProduct) => {
                  // Detectar si estamos en la ruta /lo-mas-nuevo, /lo-mas-vendido o /ofertas-especiales
                  const isLoMasNuevoPage = pathname === "/lo-mas-nuevo";
                  const isLoMasVendidoPage = pathname === "/lo-mas-vendido";
                  const isOfertasEspecialesPage =
                    pathname === "/ofertas-especiales";

                  // Calcular porcentaje de descuento para /ofertas-especiales
                  const calculateDiscountPercentage = () => {
                    if (!isOfertasEspecialesPage) return undefined;

                    const isVariableProduct =
                      product.variations && product.variations.length > 0;

                    // Obtener la primera variación para productos variables
                    const getDefaultVariationForPricing = () => {
                      if (
                        !product.variations ||
                        product.variations.length === 0
                      )
                        return null;
                      return product.variations[0];
                    };
                    const defaultVariationForPricing =
                      getDefaultVariationForPricing();

                    // Determinar precios y descuento basado en primera variación o producto principal
                    const currentRegularPrice =
                      defaultVariationForPricing?.regularPrice ??
                      product.pricing.regularPrice;
                    const currentSalePrice =
                      defaultVariationForPricing?.salePrice ??
                      product.pricing.salePrice;

                    const hasDiscount =
                      currentSalePrice &&
                      currentRegularPrice &&
                      currentSalePrice !== currentRegularPrice;

                    if (!hasDiscount) return undefined;

                    const regular = currentRegularPrice ?? 0;
                    const sale = currentSalePrice ?? 0;
                    if (regular === 0) return undefined;

                    return Math.round(((regular - sale) / regular) * 100);
                  };

                  const discountPercentage = calculateDiscountPercentage();

                  // Determinar contexto según la página
                  const getContext = ():
                    | "home"
                    | "category"
                    | "recommendation"
                    | "related"
                    | "default" => {
                    if (isLoMasNuevoPage) return "default";
                    if (isLoMasVendidoPage) return "default";
                    if (isOfertasEspecialesPage) return "default";
                    if (pathname?.startsWith("/categorias")) return "category";
                    if (pathname === "/shop") return "default";
                    return "default";
                  };

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode="list"
                      context={getContext()}
                      customBadge={
                        isLoMasNuevoPage
                          ? {
                              text: "NUEVO",
                              className: "bg-green-500",
                            }
                          : isLoMasVendidoPage
                          ? {
                              text: "Más Vendido",
                              className: "bg-yellow-500",
                            }
                          : isOfertasEspecialesPage
                          ? {
                              text: "Oferta",
                              className: "bg-orange-500",
                            }
                          : undefined
                      }
                      discountPercentage={discountPercentage}
                      showCategoryBadge={
                        isLoMasNuevoPage ||
                        isLoMasVendidoPage ||
                        isOfertasEspecialesPage
                      }
                    />
                  );
                })
              ) : (
                <div className="py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <svg
                      className="w-16 h-16 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No se encontraron productos
                      </h3>
                      <p className="text-sm text-zinc-600 max-w-md">
                        Intenta ajustar los filtros o buscar con otros términos
                        para encontrar lo que buscas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paginación - Solo mostrar si hay productos */}
          {filteredProducts.length > 0 && (
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={productList.length}
              filteredItems={filteredProducts.length}
            />
          )}
        </div>
      </div>
    </section>
  );
}
