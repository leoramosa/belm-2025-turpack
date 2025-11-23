"use client";

import { useState, useEffect } from "react";
import { IProduct } from "@/interface/IProduct";
import { ICategory } from "@/interface/ICategory";
import {
  IProductAttributeGlobal,
  fetchProductAttributes,
} from "@/services/products";
import { fetchProductCategories } from "@/services/categories";
import ShopProductCard from "@/components/Product/ShopProductCard";
import ShopFilters from "@/components/Product/ShopFilters";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";

interface SearchResultsProps {
  searchParams: {
    q?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    orderby?: string;
  };
}

export default function SearchResults({ searchParams }: SearchResultsProps) {
  // Hook para manejar el carrito
  const { addToCart } = useCartStore();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [attributes, setAttributes] = useState<IProductAttributeGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const router = useRouter();

  // PRODUCTS_PER_PAGE dinámico según el tamaño de pantalla
  const [productsPerPage, setProductsPerPage] = useState(8); // Por defecto 8 para móvil

  // Función para agregar al carrito
  const handleAddToCart = (product: IProduct) => {
    addToCart(product);
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

  // Función para limpiar HTML
  const stripHtml = (html: string) => {
    if (!html) return "";
    // Elimina etiquetas HTML usando regex (compatible SSR)
    return html.replace(/<[^>]+>/g, "");
  };

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
        setProductsPerPage(12); // 3 columnas x 4 filas = 12 productos
      }
    };

    // Ejecutar al cargar
    updateProductsPerPage();

    // Escuchar cambios de tamaño
    window.addEventListener("resize", updateProductsPerPage);

    return () => window.removeEventListener("resize", updateProductsPerPage);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        // Cargar categorías y atributos en paralelo
        const [cats, attrs] = await Promise.all([
          fetchProductCategories(),
          fetchProductAttributes(),
        ]);

        setCategories(cats);
        setAttributes(attrs);
      } catch {
        // Error silencioso
      }
    };

    loadInitialData();
  }, []);

  // Cargar productos de búsqueda
  useEffect(() => {
    const loadSearchResults = async () => {
      try {
        setLoading(true);
        setCurrentPage(1);

        const searchParamsForAPI = {
          search: searchParams.q,
          category: searchParams.category
            ? parseInt(searchParams.category)
            : undefined,
          min_price: searchParams.min_price
            ? parseFloat(searchParams.min_price)
            : undefined,
          max_price: searchParams.max_price
            ? parseFloat(searchParams.max_price)
            : undefined,
          orderby: searchParams.orderby || "date",
          page: 1,
          per_page: productsPerPage,
        };

        // Usar API segura en lugar de servicio directo
        const queryParams = new URLSearchParams();
        if (searchParamsForAPI.search)
          queryParams.append("search", searchParamsForAPI.search);
        if (searchParamsForAPI.category)
          queryParams.append(
            "category",
            searchParamsForAPI.category.toString()
          );
        if (searchParamsForAPI.min_price)
          queryParams.append(
            "min_price",
            searchParamsForAPI.min_price.toString()
          );
        if (searchParamsForAPI.max_price)
          queryParams.append(
            "max_price",
            searchParamsForAPI.max_price.toString()
          );
        if (searchParamsForAPI.orderby)
          queryParams.append("orderby", searchParamsForAPI.orderby);
        if (searchParamsForAPI.page)
          queryParams.append("page", searchParamsForAPI.page.toString());
        if (searchParamsForAPI.per_page)
          queryParams.append(
            "per_page",
            searchParamsForAPI.per_page.toString()
          );

        const response = await fetch(`/api/products?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const results = await response.json();

        setProducts(results);
        setTotalResults(results.length);
        setHasMore(results.length === productsPerPage);
      } catch {
        setProducts([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    if (searchParams.q) {
      loadSearchResults();
    } else {
      setProducts([]);
      setTotalResults(0);
      setLoading(false);
    }
  }, [
    searchParams.q,
    searchParams.category,
    searchParams.min_price,
    searchParams.max_price,
    searchParams.orderby,
    productsPerPage,
  ]);

  // Cargar más productos
  const loadMoreProducts = async () => {
    try {
      const nextPage = currentPage + 1;

      const searchParamsForAPI = {
        search: searchParams.q,
        category: searchParams.category
          ? parseInt(searchParams.category)
          : undefined,
        min_price: searchParams.min_price
          ? parseFloat(searchParams.min_price)
          : undefined,
        max_price: searchParams.max_price
          ? parseFloat(searchParams.max_price)
          : undefined,
        orderby: searchParams.orderby || "date",
        page: nextPage,
        per_page: productsPerPage,
      };

      // Usar API segura para cargar más productos
      const queryParams = new URLSearchParams();
      if (searchParamsForAPI.search)
        queryParams.append("search", searchParamsForAPI.search);
      if (searchParamsForAPI.category)
        queryParams.append("category", searchParamsForAPI.category.toString());
      if (searchParamsForAPI.min_price)
        queryParams.append(
          "min_price",
          searchParamsForAPI.min_price.toString()
        );
      if (searchParamsForAPI.max_price)
        queryParams.append(
          "max_price",
          searchParamsForAPI.max_price.toString()
        );
      if (searchParamsForAPI.orderby)
        queryParams.append("orderby", searchParamsForAPI.orderby);
      if (searchParamsForAPI.page)
        queryParams.append("page", searchParamsForAPI.page.toString());
      if (searchParamsForAPI.per_page)
        queryParams.append("per_page", searchParamsForAPI.per_page.toString());

      const response = await fetch(`/api/products?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const moreProducts = await response.json();

      if (moreProducts.length > 0) {
        setProducts((prev) => [...prev, ...moreProducts]);
        setCurrentPage(nextPage);
        setHasMore(moreProducts.length === productsPerPage);
      } else {
        setHasMore(false);
      }
    } catch {
      // Error silencioso
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Resultados de búsqueda
          </h1>
          {searchParams.q && (
            <p className="text-lg text-gray-600">
              {totalResults} producto{totalResults !== 1 ? "s" : ""} encontrado
              {totalResults !== 1 ? "s" : ""} para &ldquo;{searchParams.q}
              &rdquo;
            </p>
          )}
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <div className="lg:w-1/4">
            <ShopFilters
              categories={categories}
              attributes={attributes}
              filters={{
                category: searchParams.category
                  ? parseInt(searchParams.category)
                  : "",
                minPrice: searchParams.min_price
                  ? parseFloat(searchParams.min_price)
                  : 0,
                maxPrice: searchParams.max_price
                  ? parseFloat(searchParams.max_price)
                  : 1000,
                orderby: searchParams.orderby || "date",
              }}
              setFilters={(newFilters) => {
                const params = new URLSearchParams();

                // Mantener el término de búsqueda actual
                if (searchParams.q) {
                  params.set("q", searchParams.q);
                }

                if (newFilters.category && newFilters.category !== "") {
                  params.set("category", newFilters.category.toString());
                }

                if (
                  newFilters.minPrice &&
                  typeof newFilters.minPrice === "number" &&
                  newFilters.minPrice > 0
                ) {
                  params.set("min_price", newFilters.minPrice.toString());
                }

                if (
                  newFilters.maxPrice &&
                  typeof newFilters.maxPrice === "number" &&
                  newFilters.maxPrice < 1000
                ) {
                  params.set("max_price", newFilters.maxPrice.toString());
                }

                if (newFilters.orderby && newFilters.orderby !== "date") {
                  params.set("orderby", newFilters.orderby.toString());
                }

                router.push(`/search?${params.toString()}`);
              }}
              products={products}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  No se encontraron productos
                </h2>
                <p className="text-gray-600 mb-6">
                  {searchParams.q
                    ? `No encontramos productos que coincidan con &ldquo;${searchParams.q}&rdquo;`
                    : "Intenta con otros términos de búsqueda"}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-primary hover:bg-secondary text-white font-medium rounded-xl transition-colors duration-200"
                  >
                    Volver atrás
                  </button>
                  <button
                    onClick={() => (window.location.href = "/shop")}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200"
                  >
                    Ver todos los productos
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <ShopProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                        mainCategory={getMainCategory(product)}
                        description={stripHtml(
                          product.short_description || product.description
                        )}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={loadMoreProducts}
                      className="px-8 py-3 bg-secondary hover:bg-primary text-white font-medium rounded-xl transition-colors duration-200 flex items-center gap-2 mx-auto"
                    >
                      Cargar más productos
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
