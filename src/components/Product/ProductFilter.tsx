"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelectCategories } from "@/store/categoryStore";
import { IProductCategoryNode } from "@/types/ICategory";
import { IProduct, ProductAttribute } from "@/types/product";
import { extractColorValue, isColorAttribute } from "@/utils/productAttributes";

export interface ProductFilters {
  search: string;
  category: string | null;
  subcategory: string | null;
  subSubcategory: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  selectedColors: string[];
  selectedTags: string[];
}

interface ProductFilterProps {
  products: IProduct[];
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  disableAutoCategoryFilter?: boolean;
}

function getAllCategoriesFlat(
  categories: IProductCategoryNode[]
): IProductCategoryNode[] {
  const result: IProductCategoryNode[] = [];
  function traverse(nodes: IProductCategoryNode[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  traverse(categories);
  return result;
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

// Obtener atributos de color presentes en los productos
function getColorAttributesFromProducts(
  products: IProduct[]
): ProductAttribute[] {
  const colorAttributes = new Map<number, ProductAttribute>();

  products.forEach((product) => {
    product.attributes.forEach((attr) => {
      if (isColorAttribute(attr)) {
        if (!colorAttributes.has(attr.id)) {
          colorAttributes.set(attr.id, attr);
        }
      }
    });
  });

  return Array.from(colorAttributes.values());
}

// Obtener opciones de color únicas de los productos
function getColorOptionsFromProducts(products: IProduct[]): Array<{
  name: string;
  hex: string | null;
}> {
  const colorMap = new Map<string, { name: string; hex: string | null }>();

  products.forEach((product) => {
    product.attributes.forEach((attr) => {
      if (isColorAttribute(attr)) {
        attr.options.forEach((option) => {
          if (option.name.trim()) {
            const hex = extractColorValue(option);
            const key = option.name.toLowerCase().trim();
            if (!colorMap.has(key)) {
              colorMap.set(key, {
                name: option.name,
                hex: hex || getColorHexFromName(option.name),
              });
            }
          }
        });
      }
    });
  });

  return Array.from(colorMap.values());
}

// Función helper para obtener hex de color por nombre (fallback)
function getColorHexFromName(colorName: string): string {
  const colorMap: Record<string, string> = {
    negro: "#000000",
    blanco: "#FFFFFF",
    rojo: "#FF0000",
    azul: "#0000FF",
    verde: "#008000",
    amarillo: "#FFFF00",
    naranja: "#FFA500",
    rosa: "#FF69B4",
    morado: "#800080",
    gris: "#808080",
    marrón: "#8B4513",
    beige: "#F5F5DC",
    dorado: "#FFD700",
    plateado: "#C0C0C0",
  };

  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || "#CCCCCC";
}

// Componente Range personalizado para el slider de precio
function RangeSlider({
  min,
  max,
  values,
  onChange,
}: {
  min: number;
  max: number;
  values: [number, number];
  onChange: (values: [number, number]) => void;
}) {
  const [localValues, setLocalValues] = useState<[number, number]>(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(parseInt(e.target.value), localValues[1]);
    const newValues: [number, number] = [newMin, localValues[1]];
    setLocalValues(newValues);
    onChange(newValues);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(parseInt(e.target.value), localValues[0]);
    const newValues: [number, number] = [localValues[0], newMax];
    setLocalValues(newValues);
    onChange(newValues);
  };

  const minPercent = ((localValues[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValues[1] - min) / (max - min)) * 100;

  return (
    <div className="relative h-2">
      {/* Track background */}
      <div className="absolute h-2 w-full rounded-full bg-zinc-200"></div>

      {/* Active range */}
      <div
        className="absolute h-2 rounded-full bg-primary"
        style={{
          left: `${minPercent}%`,
          width: `${maxPercent - minPercent}%`,
        }}
      ></div>

      {/* Min thumb */}
      <input
        type="range"
        min={min}
        max={max}
        value={localValues[0]}
        onChange={handleMinChange}
        className="absolute top-0 h-2 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:outline-none [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
      />

      {/* Max thumb */}
      <input
        type="range"
        min={min}
        max={max}
        value={localValues[1]}
        onChange={handleMaxChange}
        className="absolute top-0 h-2 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:outline-none [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-white [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
      />
    </div>
  );
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

export function ProductFilter({
  products,
  filters,
  onFiltersChange,
  disableAutoCategoryFilter = false,
}: ProductFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const allCategories = useSelectCategories();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);
  const [isSubSubcategoryOpen, setIsSubSubcategoryOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);
  const subSubcategoryDropdownRef = useRef<HTMLDivElement>(null);

  // Obtener solo categorías padre (raíz) que tienen hijos
  const rootCategories = useMemo(
    () =>
      allCategories.filter(
        (cat: IProductCategoryNode) =>
          cat.parentId === null && cat.children.length > 0
      ),
    [allCategories]
  );

  // Obtener subcategorías basadas en la categoría seleccionada
  const subcategories = useMemo(() => {
    if (!filters.category) return [];
    const selectedCategory = findCategoryInTree(
      allCategories,
      filters.category
    );
    return selectedCategory?.children || [];
  }, [allCategories, filters.category]);

  // Obtener sub-subcategorías basadas en la subcategoría seleccionada
  const subSubcategories = useMemo(() => {
    if (!filters.subcategory) return [];
    const selectedSubcategory = subcategories.find(
      (cat) => cat.slug === filters.subcategory
    );
    return selectedSubcategory?.children || [];
  }, [subcategories, filters.subcategory]);

  // Obtener colores dinámicamente de los productos
  const colorOptions = useMemo(
    () => getColorOptionsFromProducts(products),
    [products]
  );

  // Rango de precio dinámico basado en productos reales
  const priceRange = useMemo(() => {
    const prices = products
      .map((p) => p.pricing.price)
      .filter((p): p is number => p !== null && !isNaN(p));

    if (prices.length === 0) {
      return { min: 0, max: 1000, hasRange: false };
    }

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    const hasRange = min !== max;

    return { min, max, hasRange };
  }, [products]);

  // Estado local para el rango de precio
  const [currentPriceRange, setCurrentPriceRange] = useState<[number, number]>([
    priceRange.min,
    priceRange.max,
  ]);

  // Sincronizar el rango de precio cuando cambien los filtros o el rango disponible
  useEffect(() => {
    const minValue =
      filters.minPrice !== null ? filters.minPrice : priceRange.min;
    const maxValue =
      filters.maxPrice !== null ? filters.maxPrice : priceRange.max;

    const validMin = Math.max(minValue, priceRange.min);
    const validMax = Math.min(maxValue, priceRange.max);

    setCurrentPriceRange([validMin, validMax]);
  }, [priceRange, filters.minPrice, filters.maxPrice]);

  // Inicializar el rango de precio en los filtros si no está establecido
  useEffect(() => {
    if (
      filters.minPrice === null &&
      filters.maxPrice === null &&
      priceRange.hasRange
    ) {
      onFiltersChange({
        ...filters,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange]);

  // Detectar categoría desde la URL y sincronizar con filtros
  // IMPORTANTE: Este efecto tiene prioridad ABSOLUTA y siempre sincroniza con la URL
  // independientemente de disableAutoCategoryFilter, porque necesitamos mostrar
  // la categoría seleccionada en el filtro UI para feedback visual
  useEffect(() => {
    if (!pathname || allCategories.length === 0) return;

    if (pathname.startsWith("/categorias/")) {
      const categorySlugFromPath =
        pathname.split("/categorias/")[1]?.split("?")[0] || null;

      if (categorySlugFromPath) {
        const hierarchy = getCategoryHierarchy(
          categorySlugFromPath,
          allCategories
        );

        // Solo actualizar si los valores son diferentes para evitar bucles infinitos
        // y evitar actualizaciones innecesarias
        if (
          filters.category !== hierarchy.category ||
          filters.subcategory !== hierarchy.subcategory ||
          filters.subSubcategory !== hierarchy.subSubcategory
        ) {
          // Siempre actualizar los filtros para sincronizar con la URL
          // Esto asegura que cuando navegas desde MegaMenu, los filtros se actualicen
          onFiltersChange({
            ...filters,
            category: hierarchy.category,
            subcategory: hierarchy.subcategory,
            subSubcategory: hierarchy.subSubcategory,
          });
        }
      }
    } else {
      // Si no estamos en una página de categoría, limpiar los filtros de categoría
      if (filters.category || filters.subcategory || filters.subSubcategory) {
        onFiltersChange({
          ...filters,
          category: null,
          subcategory: null,
          subSubcategory: null,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, allCategories]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (
        subcategoryDropdownRef.current &&
        !subcategoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSubcategoryOpen(false);
      }
      if (
        subSubcategoryDropdownRef.current &&
        !subSubcategoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSubSubcategoryOpen(false);
      }
    };

    if (isCategoryOpen || isSubcategoryOpen || isSubSubcategoryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCategoryOpen, isSubcategoryOpen, isSubSubcategoryOpen]);

  // Encontrar la categoría seleccionada (buscar en rootCategories primero, luego en todo el árbol)
  const selectedCategory = useMemo(() => {
    if (!filters.category) return null;

    // Primero buscar en rootCategories
    const rootCategory = rootCategories.find(
      (cat: IProductCategoryNode) => cat.slug === filters.category
    );

    if (rootCategory) return rootCategory;

    // Si no se encuentra en rootCategories, buscar en todo el árbol
    return findCategoryInTree(allCategories, filters.category);
  }, [filters.category, rootCategories, allCategories]);

  const selectedSubcategory = subcategories.find(
    (cat: IProductCategoryNode) => cat.slug === filters.subcategory
  );
  const selectedSubSubcategory = subSubcategories.find(
    (cat: IProductCategoryNode) => cat.slug === filters.subSubcategory
  );

  const handleCategorySelect = (categorySlug: string | null) => {
    if (categorySlug) {
      // Actualizar filtros antes de navegar
      const selectedCategory = rootCategories.find(
        (cat: IProductCategoryNode) => cat.slug === categorySlug
      );
      if (selectedCategory) {
        handleFilterChange({
          category: categorySlug,
          subcategory: null,
          subSubcategory: null,
        });
        // Navegar a la página de la categoría
        router.push(`/categorias/${categorySlug}`);
      }
    } else {
      // Limpiar todas las categorías y navegar al catálogo principal
      handleFilterChange({
        category: null,
        subcategory: null,
        subSubcategory: null,
      });
      router.push("/shop");
    }
  };

  const handleSubcategorySelect = (subcategorySlug: string | null) => {
    if (subcategorySlug) {
      // Si estamos en una página de categoría, solo filtrar sin navegar
      if (pathname?.startsWith("/categorias/")) {
        handleFilterChange({
          subcategory: subcategorySlug,
          subSubcategory: null,
        });
      } else {
        // Si no estamos en una página de categoría, navegar
        handleFilterChange({
          subcategory: subcategorySlug,
          subSubcategory: null,
        });
        router.push(`/categorias/${subcategorySlug}`);
      }
    } else {
      handleFilterChange({
        subcategory: null,
        subSubcategory: null,
      });
    }
  };

  const handleSubSubcategorySelect = (subSubcategorySlug: string | null) => {
    if (subSubcategorySlug) {
      // Si estamos en una página de categoría, solo filtrar sin navegar
      if (pathname?.startsWith("/categorias/")) {
        handleFilterChange({
          subSubcategory: subSubcategorySlug,
        });
      } else {
        // Si no estamos en una página de categoría, navegar
        handleFilterChange({
          subSubcategory: subSubcategorySlug,
        });
        router.push(`/categorias/${subSubcategorySlug}`);
      }
    } else {
      handleFilterChange({
        subSubcategory: null,
      });
    }
  };

  const handleFilterChange = (updates: Partial<ProductFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  // Obtener filtros activos para mostrar
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; label: string; value: string }> = [];

    if (filters.subcategory && selectedSubcategory) {
      active.push({
        key: "subcategory",
        label: selectedSubcategory.name,
        value: filters.subcategory,
      });
    }

    if (filters.subSubcategory && selectedSubSubcategory) {
      active.push({
        key: "subSubcategory",
        label: selectedSubSubcategory.name,
        value: filters.subSubcategory,
      });
    }

    if (filters.selectedColors.length > 0) {
      filters.selectedColors.forEach((color) => {
        active.push({
          key: `color-${color}`,
          label: color,
          value: color,
        });
      });
    }

    if (filters.selectedTags.length > 0) {
      filters.selectedTags.forEach((tag) => {
        active.push({
          key: `tag-${tag}`,
          label: tag,
          value: tag,
        });
      });
    }

    return active;
  }, [filters, selectedSubcategory, selectedSubSubcategory]);

  const handlePriceChange = (values: [number, number]) => {
    setCurrentPriceRange(values);
    handleFilterChange({
      minPrice: values[0],
      maxPrice: values[1],
    });
  };

  const handleClearFilters = () => {
    setCurrentPriceRange([priceRange.min, priceRange.max]);
    onFiltersChange({
      search: "",
      category: null,
      subcategory: null,
      subSubcategory: null,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      inStockOnly: false,
      selectedColors: [],
      selectedTags: [],
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.subcategory ||
    filters.subSubcategory ||
    (filters.minPrice !== null && filters.minPrice !== priceRange.min) ||
    (filters.maxPrice !== null && filters.maxPrice !== priceRange.max) ||
    filters.inStockOnly ||
    filters.selectedColors.length > 0 ||
    filters.selectedTags.length > 0;

  return (
    <div className="hidden lg:block w-80 shrink-0">
      <div className="bg-white rounded-2xl shadow-md p-6 sticky top-4 space-y-6">
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-6">
            <h4 className="text-sm font-semibold text-zinc-700">
              Filtros Activos
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <div
                  key={filter.key}
                  className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                >
                  <span>{filter.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (filter.key === "subcategory") {
                        handleFilterChange({
                          subcategory: null,
                          subSubcategory: null,
                        });
                      } else if (filter.key === "subSubcategory") {
                        handleFilterChange({ subSubcategory: null });
                      } else if (filter.key.startsWith("color-")) {
                        handleFilterChange({
                          selectedColors: filters.selectedColors.filter(
                            (c) => c !== filter.value
                          ),
                        });
                      } else if (filter.key.startsWith("tag-")) {
                        handleFilterChange({
                          selectedTags: filters.selectedTags.filter(
                            (t) => t !== filter.value
                          ),
                        });
                      }
                    }}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Category */}
        <div className="">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <span>{selectedCategory?.name || "Todas"}</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  isCategoryOpen ? "rotate-180" : ""
                }`}
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
            {isCategoryOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleCategorySelect(null);
                    setIsCategoryOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition ${
                    !filters.category
                      ? "bg-blue-500 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Todas
                </button>
                {rootCategories.map((category: IProductCategoryNode) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      handleCategorySelect(category.slug);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition ${
                      filters.category === category.slug
                        ? "bg-blue-500 text-white"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subcategory */}
        {filters.category && subcategories.length > 0 && (
          <div className="">
            <label className="text-sm font-semibold text-zinc-700">
              Subcategoría
            </label>
            <div className="relative" ref={subcategoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSubcategoryOpen(!isSubcategoryOpen)}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <span>{selectedSubcategory?.name || "Todas"}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${
                    isSubcategoryOpen ? "rotate-180" : ""
                  }`}
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
              {isSubcategoryOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleSubcategorySelect(null);
                      setIsSubcategoryOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition ${
                      !filters.subcategory
                        ? "bg-blue-500 text-white"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Todas
                  </button>
                  {subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => {
                        handleSubcategorySelect(subcategory.slug);
                        setIsSubcategoryOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition ${
                        filters.subcategory === subcategory.slug
                          ? "bg-blue-500 text-white"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-subcategory */}
        {filters.subcategory && subSubcategories.length > 0 && (
          <div className="">
            <label className="text-sm font-semibold text-zinc-700">
              Sub-subcategoría
            </label>
            <div className="relative" ref={subSubcategoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSubSubcategoryOpen(!isSubSubcategoryOpen)}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <span>{selectedSubSubcategory?.name || "Todas"}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${
                    isSubSubcategoryOpen ? "rotate-180" : ""
                  }`}
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
              {isSubSubcategoryOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      handleSubSubcategorySelect(null);
                      setIsSubSubcategoryOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition ${
                      !filters.subSubcategory
                        ? "bg-blue-500 text-white"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Todas
                  </button>
                  {subSubcategories.map((subSubcategory) => (
                    <button
                      key={subSubcategory.id}
                      type="button"
                      onClick={() => {
                        handleSubSubcategorySelect(subSubcategory.slug);
                        setIsSubSubcategoryOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition ${
                        filters.subSubcategory === subSubcategory.slug
                          ? "bg-blue-500 text-white"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {subSubcategory.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div className="">
          <label className="text-sm font-semibold text-zinc-700">
            Rango de precio
          </label>
          {priceRange.hasRange ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>S/ {currentPriceRange[0]}</span>
                <span>S/ {currentPriceRange[1]}</span>
              </div>
              <RangeSlider
                min={priceRange.min}
                max={priceRange.max}
                values={currentPriceRange}
                onChange={handlePriceChange}
              />
            </div>
          ) : (
            <div className="text-sm text-zinc-500 py-2">
              Precio único: S/ {priceRange.min}
            </div>
          )}
        </div>

        {/* In Stock Only */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="inStockOnly"
            checked={filters.inStockOnly}
            onChange={(e) =>
              handleFilterChange({ inStockOnly: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
          />
          <label
            htmlFor="inStockOnly"
            className="text-sm font-medium text-zinc-700"
          >
            Solo productos en stock
          </label>
        </div>

        {/* Colors - Dinámicos de los productos */}
        {colorOptions.length > 0 && (
          <div className="">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colores
            </label>
            <div className="space-x-2 grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-y-2">
              {colorOptions.map((colorOption) => {
                const isSelected = filters.selectedColors.includes(
                  colorOption.name
                );
                return (
                  <button
                    key={colorOption.name}
                    type="button"
                    onClick={() => {
                      const newColors = isSelected
                        ? filters.selectedColors.filter(
                            (c) => c !== colorOption.name
                          )
                        : [...filters.selectedColors, colorOption.name];
                      handleFilterChange({ selectedColors: newColors });
                    }}
                    className={`w-6 h-6 rounded-full border-2 relative border-gray-300 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-zinc-300 hover:border-zinc-400"
                    }`}
                    style={{
                      backgroundColor: colorOption.hex || "#CCCCCC",
                    }}
                    title={colorOption.name}
                    aria-label={colorOption.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etiquetas
          </label>
          <div className="space-y-2">
            {["Bolso", "Nuevo", "Oferta"].map((tag) => (
              <div key={tag} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`tag-${tag}`}
                  checked={filters.selectedTags.includes(tag)}
                  onChange={(e) => {
                    const newTags = e.target.checked
                      ? [...filters.selectedTags, tag]
                      : filters.selectedTags.filter((t) => t !== tag);
                    handleFilterChange({ selectedTags: newTags });
                  }}
                  className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <label htmlFor={`tag-${tag}`} className="text-sm text-zinc-700">
                  {tag}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="w-full rounded-lg border-2 border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
