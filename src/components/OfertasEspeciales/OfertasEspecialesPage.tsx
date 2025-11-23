"use client";
import { useState, useMemo, useEffect } from "react";
import { IProductAttributeGlobal, IProductTag } from "@/services/products";
import { IProduct } from "@/interface/IProduct";
import { ICategory } from "@/interface/ICategory";
import ShopFilters from "../Product/ShopFilters";
import ShopProductCard from "../Product/ShopProductCard";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

interface OfertasEspecialesPageProps {
  products: IProduct[];
  categories: ICategory[];
  attributes: IProductAttributeGlobal[];
}

export default function OfertasEspecialesPage({
  products,
  categories,
  attributes,
}: OfertasEspecialesPageProps) {
  // Hook para manejar el carrito
  const { addToCart } = useCartStore();

  // Filtros seleccionados (a definir en ShopFilters)
  const [filters, setFilters] = useState<
    Record<string, string | number | boolean | string[]>
  >({});
  // Estado para vista grid/lista y ordenamiento
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // sortBy no se usa en esta página ya que siempre muestra ofertas
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  // PRODUCTS_PER_PAGE dinámico según el tamaño de pantalla
  const [productsPerPage, setProductsPerPage] = useState(8); // Por defecto 8 para móvil

  // Estado para controlar si los filtros están abiertos en mobile
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Función para agregar al carrito
  const handleAddToCart = (product: IProduct) => {
    addToCart(product);
  };

  // Función para contar filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (key === "search" && typeof value === "string" && value.trim()) {
        count++;
      } else if (key === "category" && typeof value === "number") {
        count++;
      } else if (key === "subcategory" && typeof value === "number") {
        count++;
      } else if (key === "subSubcategory" && typeof value === "number") {
        count++;
      } else if (key === "maxPrice" && typeof value === "number" && value > 0) {
        count++;
      } else if (key === "inStock" && typeof value === "boolean" && value) {
        count++;
      } else if (Array.isArray(value) && value.length > 0) {
        count++;
      }
    });
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Hook para detectar el tamaño de pantalla y ajustar productos por página
  useEffect(() => {
    const updateProductsPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // sm breakpoint
        setProductsPerPage(8); // 2 columnas x 4 filas = 8 productos
      } else if (width < 1024) {
        // lg breakpoint
        setProductsPerPage(8); // 2 columnas x 4 filas = 8 productos
      } else {
        // xl breakpoint
        setProductsPerPage(9); // 3 columnas x 3 filas = 9 productos
      }
    };

    // Ejecutar al cargar
    updateProductsPerPage();

    // Escuchar cambios de tamaño
    window.addEventListener("resize", updateProductsPerPage);

    return () => window.removeEventListener("resize", updateProductsPerPage);
  }, []);

  // Función para limpiar HTML
  const stripHtml = (html: string) => {
    if (!html) return "";
    // Elimina etiquetas HTML usando regex (compatible SSR)
    return html.replace(/<[^>]+>/g, "");
  };

  // Lógica de filtrado (igual que ShopPage)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filtrado por etiquetas (tags)
    if (
      filters.tags &&
      Array.isArray(filters.tags) &&
      filters.tags.length > 0
    ) {
      result = result.filter((product: IProduct) =>
        product.tags?.some(
          (tag: IProductTag) =>
            Array.isArray(filters.tags) && filters.tags.includes(tag.slug)
        )
      );
    }
    // Búsqueda
    if (filters.search && typeof filters.search === "string") {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.short_description?.toLowerCase().includes(q)
      );
    }
    // Categoría principal
    if (filters.category && typeof filters.category === "number") {
      result = result.filter((p) =>
        p.categories?.some((c) => c.id === filters.category)
      );
    }
    // Subcategoría
    if (filters.subcategory && typeof filters.subcategory === "number") {
      result = result.filter((p) =>
        p.categories?.some((c) => c.id === filters.subcategory)
      );
    }
    // Sub-subcategoría
    if (filters.subSubcategory && typeof filters.subSubcategory === "number") {
      result = result.filter((p) =>
        p.categories?.some((c) => c.id === filters.subSubcategory)
      );
    }
    // Precio mínimo
    if (filters.minPrice && typeof filters.minPrice === "number") {
      result = result.filter(
        (p) => parseFloat(p.price) >= (filters.minPrice as number)
      );
    }
    // Precio máximo
    if (filters.maxPrice && typeof filters.maxPrice === "number") {
      result = result.filter(
        (p) => parseFloat(p.price) <= (filters.maxPrice as number)
      );
    }
    // Solo en stock
    if (filters.inStock === true) {
      result = result.filter((p) => p.stock_status === "instock");
    }
    // Atributos específicos (colores, tallas, etc.)
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        // Verificar si es un atributo (no es category, subcategory, etc.)
        const isAttribute = ![
          "category",
          "subcategory",
          "subSubcategory",
          "tags",
          "search",
          "minPrice",
          "maxPrice",
          "inStock",
        ].includes(key);

        if (isAttribute) {
          result = result.filter((product) => {
            // Buscar el atributo por slug (como lo hace ShopFilters)
            const productAttr = product.attributes?.find((attr) => {
              // Normalizar nombres para comparar
              const attrName = attr.name.toLowerCase();
              const keyName = key.toLowerCase();

              // Buscar por coincidencia exacta o parcial
              return (
                attrName === keyName ||
                attrName.includes(keyName) ||
                keyName.includes(attrName)
              );
            });

            if (!productAttr) return false;

            // Verificar si alguno de los valores seleccionados está en las opciones
            return value.some((selectedValue) =>
              productAttr.options?.includes(selectedValue)
            );
          });
        }
      }
    });

    // Ordenamiento (para ofertas, ordenar por mayor descuento)
    result.sort((a, b) => {
      const discountA =
        a.sale_price && a.regular_price
          ? (parseFloat(a.regular_price) - parseFloat(a.sale_price)) /
            parseFloat(a.regular_price)
          : 0;
      const discountB =
        b.sale_price && b.regular_price
          ? (parseFloat(b.regular_price) - parseFloat(b.sale_price)) /
            parseFloat(b.regular_price)
          : 0;
      return discountB - discountA; // Mayor descuento primero
    });

    return result;
  }, [products, filters]);

  // Paginación: calcular productos a mostrar
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Función para calcular el porcentaje de descuento
  const calculateDiscountPercentage = (product: IProduct) => {
    const regularPrice = product.regular_price;
    const salePrice = product.sale_price;

    if (!salePrice || !regularPrice) return 0;
    if (parseFloat(salePrice) >= parseFloat(regularPrice)) return 0;

    const discount =
      ((parseFloat(regularPrice) - parseFloat(salePrice)) /
        parseFloat(regularPrice)) *
      100;
    return Math.round(discount);
  };

  // Función para obtener la categoría principal de un producto
  const getMainCategory = (product: IProduct) => {
    if (!product.categories || product.categories.length === 0) return null;

    // Buscar la categoría raíz real en el array global de categorías
    let rootCategory: ICategory | null = null;
    for (const cat of product.categories) {
      let current = categories.find((c) => c.id === cat.id);
      while (current && current.parent !== 0) {
        const parentCategory = categories.find((c) => c.id === current!.parent);
        if (!parentCategory) break;
        current = parentCategory;
      }
      if (current && current.parent === 0) {
        rootCategory = current;
        break;
      }
    }

    return rootCategory;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header visual */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-primary text-center pt-10">
          Ofertas especiales
        </h1>
        <p className="text-gray-600 text-lg text-center">
          Descubre nuestras mejores ofertas y promociones. Productos con
          descuentos especiales.
        </p>
      </div>

      {/* Barra de búsqueda y controles */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={(filters.search as string) || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-primary outline-none"
          />
        </div>
        <div className="flex gap-3 items-center">
          <button
            className="flex items-center gap-2 border border-primary rounded-xl p-2.5 text-primary hover:text-primary transition-colors duration-300 md:hidden"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            {/* Ícono de filtro azul */}
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
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
            {/* Texto "Filtros" */}
            <span className="font-semibold">Filtros</span>
            {/* Número de filtros activos */}
            {activeFiltersCount > 0 && (
              <span className="font-semibold">({activeFiltersCount})</span>
            )}
            {/* Flecha hacia abajo */}
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="flex bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 transition-colors duration-300 ${
                viewMode === "grid"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect
                  x="3"
                  y="3"
                  width="7"
                  height="7"
                  rx="2"
                  fill="currentColor"
                />
                <rect
                  x="14"
                  y="3"
                  width="7"
                  height="7"
                  rx="2"
                  fill="currentColor"
                />
                <rect
                  x="14"
                  y="14"
                  width="7"
                  height="7"
                  rx="2"
                  fill="currentColor"
                />
                <rect
                  x="3"
                  y="14"
                  width="7"
                  height="7"
                  rx="2"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 transition-colors duration-300 ${
                viewMode === "list"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="3"
                  rx="1.5"
                  fill="currentColor"
                />
                <rect
                  x="3"
                  y="10.5"
                  width="18"
                  height="3"
                  rx="1.5"
                  fill="currentColor"
                />
                <rect
                  x="3"
                  y="17"
                  width="18"
                  height="3"
                  rx="1.5"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          <select
            defaultValue="name"
            className="px-3 py-2 sm:px-4 sm:py-3 bg-white rounded-2xl border border-gray-200 focus:border-primary outline-none text-sm sm:text-base w-[120px] sm:w-[140px] md:w-[160px] lg:w-auto overflow-hidden text-ellipsis whitespace-nowrap"
            style={{
              textOverflow: "ellipsis",
            }}
          >
            <option value="name">Ordenar por nombre</option>
            <option value="price-low">Precio: menor a mayor</option>
            <option value="price-high">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      {/* Contador de productos */}
      <div className="mb-6 text-gray-600">
        Mostrando {filteredProducts.length} de {products.length} productos
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filtros - Desktop */}
        <div className="hidden md:block">
          <ShopFilters
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            attributes={attributes}
            products={products}
          />
        </div>

        {/* Filtros - Mobile Drawer */}
        {isFiltersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm "
              onClick={() => setIsFiltersOpen(false)}
            />
            {/* Drawer desde la izquierda */}
            <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
                  <button
                    onClick={() => setIsFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Filtros Activos - Versión Móvil */}
                {(() => {
                  const activeFilters: Array<{
                    key: string;
                    label: string;
                    value: string | number | boolean | string[];
                  }> = [];

                  // Búsqueda activa
                  if (
                    filters.search &&
                    typeof filters.search === "string" &&
                    filters.search.trim()
                  ) {
                    activeFilters.push({
                      key: "search",
                      label: `"${filters.search}"`,
                      value: filters.search,
                    });
                  }

                  // Categoría activa
                  if (filters.category) {
                    const category = categories.find(
                      (cat) => cat.id === filters.category
                    );
                    if (category) {
                      activeFilters.push({
                        key: "category",
                        label: category.name,
                        value: filters.category,
                      });
                    }
                  }

                  // Subcategoría activa
                  if (filters.subcategory) {
                    const subcategory = categories.find(
                      (cat) => cat.id === filters.subcategory
                    );
                    if (subcategory) {
                      activeFilters.push({
                        key: "subcategory",
                        label: subcategory.name,
                        value: filters.subcategory,
                      });
                    }
                  }

                  // Sub-subcategoría activa
                  if (filters.subSubcategory) {
                    const subSubcategory = categories.find(
                      (cat) => cat.id === filters.subSubcategory
                    );
                    if (subSubcategory) {
                      activeFilters.push({
                        key: "subSubcategory",
                        label: subSubcategory.name,
                        value: filters.subSubcategory,
                      });
                    }
                  }

                  // Rango de precio activo
                  if (filters.minPrice || filters.maxPrice) {
                    const minPrice =
                      typeof filters.minPrice === "number"
                        ? filters.minPrice
                        : 0;
                    const maxPrice =
                      typeof filters.maxPrice === "number"
                        ? filters.maxPrice
                        : 1000;
                    activeFilters.push({
                      key: "priceRange",
                      label: `S/ ${minPrice} - S/ ${maxPrice}`,
                      value: `${minPrice}-${maxPrice}`,
                    });
                  }

                  // Solo en stock activo
                  if (
                    filters.inStock &&
                    typeof filters.inStock === "boolean" &&
                    filters.inStock
                  ) {
                    activeFilters.push({
                      key: "inStock",
                      label: "Solo en stock",
                      value: filters.inStock,
                    });
                  }

                  // Atributos activos
                  Object.entries(filters).forEach(([key, value]) => {
                    if (Array.isArray(value) && value.length > 0) {
                      value.forEach((val) => {
                        activeFilters.push({
                          key: `${key}-${val}`,
                          label: val as string,
                          value: val,
                        });
                      });
                    }
                  });

                  return activeFilters.length > 0 ? (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Filtros Activos
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeFilters.map((filter) => (
                          <div
                            key={filter.key}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            <span>{filter.label}</span>
                            <button
                              onClick={() => {
                                if (filter.key === "search") {
                                  setFilters({ ...filters, search: "" });
                                } else if (filter.key === "category") {
                                  setFilters({ ...filters, category: "" });
                                } else if (filter.key === "subcategory") {
                                  setFilters({
                                    ...filters,
                                    subcategory: "",
                                    subSubcategory: "",
                                  });
                                } else if (filter.key === "subSubcategory") {
                                  setFilters({
                                    ...filters,
                                    subSubcategory: "",
                                  });
                                } else if (filter.key === "priceRange") {
                                  setFilters({
                                    ...filters,
                                    minPrice: "",
                                    maxPrice: "",
                                  });
                                } else if (filter.key === "inStock") {
                                  setFilters({ ...filters, inStock: false });
                                } else {
                                  // Remover atributo específico
                                  const [attrKey, attrValue] =
                                    filter.key.split("-");
                                  const currentValues =
                                    (filters[attrKey] as string[]) || [];
                                  const newValues = currentValues.filter(
                                    (v) => v !== attrValue
                                  );
                                  setFilters({
                                    ...filters,
                                    [attrKey]: newValues,
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
                  ) : null;
                })()}

                {/* Usar el mismo componente ShopFilters que desktop */}
                <ShopFilters
                  filters={filters}
                  setFilters={setFilters}
                  categories={categories}
                  attributes={attributes}
                  products={products}
                  mobileOnly={true}
                  onCloseMobileDrawer={() => setIsFiltersOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Productos */}
        <div className="flex-1">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {paginatedProducts.map((product) => {
                const rootCategory = getMainCategory(product);
                const discountPercentage = calculateDiscountPercentage(product);
                const hasDiscount = discountPercentage > 0;

                const badges = [];
                if (hasDiscount) {
                  badges.push({
                    text: `-${discountPercentage}%`,
                    color: "#3b82f6",
                    position: "top-left" as const,
                  });
                }
                badges.push({
                  text: "Oferta",
                  color: "#f97316",
                  position: "top-right" as const,
                });

                return (
                  <ShopProductCard
                    key={product.id}
                    product={product}
                    viewMode="grid"
                    mainCategory={rootCategory}
                    description={stripHtml(
                      product.short_description || product.description
                    )}
                    showNewestBadges={false}
                    customBadges={badges}
                    onAddToCart={handleAddToCart}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-6 mb-8">
              {paginatedProducts.map((product) => {
                const rootCategory = getMainCategory(product);
                const discountPercentage = calculateDiscountPercentage(product);
                const hasDiscount = discountPercentage > 0;

                const badges = [];
                if (hasDiscount) {
                  badges.push({
                    text: `-${discountPercentage}%`,
                    color: "#3b82f6",
                    position: "top-left" as const,
                  });
                }
                badges.push({
                  text: "Oferta",
                  color: "#f97316",
                  position: "top-right" as const,
                });

                return (
                  <ShopProductCard
                    key={product.id}
                    product={product}
                    viewMode="list"
                    mainCategory={rootCategory}
                    description={stripHtml(
                      product.short_description || product.description
                    )}
                    showNewestBadges={false}
                    customBadges={badges}
                    onAddToCart={handleAddToCart}
                  />
                );
              })}
            </div>
          )}

          {/* Estado vacío */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">
                No se encontraron productos
              </h3>
              <p className="mb-6">
                Intenta ajustar los filtros o buscar con otros términos.
              </p>
              <button
                onClick={() => setFilters({})}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              <button
                className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`px-4 py-2 rounded-lg border ${
                    currentPage === i + 1
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setCurrentPage(i + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          )}

          {/* Link de regreso a tienda */}
          <div className="text-center mt-8">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
