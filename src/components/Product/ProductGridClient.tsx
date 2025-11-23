"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { IoGridOutline, IoListOutline } from "react-icons/io5";

import { ProductCard } from "@/components/Product/ProductCard";
import {
  ProductFilter,
  ProductFilters,
} from "@/components/Product/ProductFilter";
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
  title: string;
  products: IProduct[];
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
          currentPage === 1
            ? "cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        Anterior
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            currentPage === page
              ? "border-primary bg-primary text-white"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
          currentPage === totalPages
            ? "cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        Siguiente
      </button>
    </div>
  );
}

type SortOption = "name" | "price-asc" | "price-desc" | "newest";
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
  let current: IProductCategoryNode | null = category;
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

export function ProductGridClient({ title, products }: ProductGridClientProps) {
  const pathname = usePathname();
  const setProducts = useProductStore(
    (state: ProductState) => state.setProducts
  );
  const productList = useSelectProducts();
  const allCategories = useSelectCategories();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024 ? 8 : 9;
    }
    return 9;
  });
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Sincronizar filtros con la URL cuando cambia la ruta
  useEffect(() => {
    if (categorySlugFromPath) {
      const hierarchy = getCategoryHierarchy(
        categorySlugFromPath,
        allCategories
      );
      setFilters((prev) => ({
        ...prev,
        category: hierarchy.category,
        subcategory: hierarchy.subcategory,
        subSubcategory: hierarchy.subSubcategory,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        category: null,
        subcategory: null,
        subSubcategory: null,
      }));
    }
  }, [categorySlugFromPath, allCategories]);

  useEffect(() => {
    setProducts(products);
  }, [products, setProducts]);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 1024 ? 8 : 9);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = productList.filter((product) => {
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

      // Tags filter (using category names as tags for now)
      if (filters.selectedTags.length > 0) {
        const productCategoryNames = product.categories.map((cat) =>
          cat.name.toLowerCase()
        );
        const hasSelectedTag = filters.selectedTags.some((tag) =>
          productCategoryNames.includes(tag.toLowerCase())
        );
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
          return b.id - a.id;
        default:
          return 0;
      }
    });

    return sorted;
  }, [productList, filters, searchQuery, sortBy]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 lg:py-12">
      <header className="mb-8 flex flex-col gap-2 text-left">
        <span className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Catálogo
        </span>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
      </header>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar - Filters */}
        <ProductFilter
          products={productList}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Main Content - Product Grid */}
        <div className="flex-1">
          {/* Top Bar - Search, View Toggle, Sort */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
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
                  className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* View Toggle and Sort */}
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-zinc-300 bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition ${
                    viewMode === "grid"
                      ? "bg-primary text-white"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                  aria-label="Vista de cuadrícula"
                >
                  <IoGridOutline className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition ${
                    viewMode === "list"
                      ? "bg-primary text-white"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                  aria-label="Vista de lista"
                >
                  <IoListOutline className="h-5 w-5" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none rounded-lg border border-zinc-300 bg-white px-4 py-2 pr-8 text-sm text-zinc-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="name">Ordenar por nombre</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="newest">Más recientes</option>
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
            <div className="space-y-4">
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </section>
  );
}
