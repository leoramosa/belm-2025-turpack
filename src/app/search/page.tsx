import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/Product/ProductCard";
import { fetchProducts } from "@/services/products";
import type { IProduct } from "@/types/product";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";

  if (!query) {
    return {
      title: "Búsqueda | BELM",
      description: "Busca productos en nuestra tienda",
    };
  }

  return {
    title: `Búsqueda: ${query} | BELM`,
    description: `Resultados de búsqueda para "${query}"`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const searchQuery = params.q || "";

  let products: IProduct[] = [];

  try {
    if (searchQuery.trim()) {
      // Buscar productos con el query
      products = await fetchProducts({
        search: searchQuery,
        fetchAll: true,
      });
    } else {
      // Si no hay query, mostrar todos los productos
      products = await fetchProducts({
        fetchAll: true,
      });
    }
  } catch (error) {
    console.error("Error loading search products:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">
            {searchQuery.trim()
              ? "Resultados de búsqueda"
              : "Explorar productos"}
          </h1>
          <p className="text-gray-600">
            {searchQuery.trim() ? (
              products.length > 0 ? (
                <>
                  {products.length} producto{products.length !== 1 ? "s" : ""}{" "}
                  encontrado{products.length !== 1 ? "s" : ""} para &ldquo;
                  {searchQuery}&rdquo;
                </>
              ) : (
                <>
                  No se encontraron productos para &ldquo;{searchQuery}&rdquo;
                </>
              )
            ) : (
              <>
                {products.length} producto{products.length !== 1 ? "s" : ""}{" "}
                disponible{products.length !== 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors duration-200"
          >
            Ver todos los productos
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium rounded-xl transition-colors duration-200"
          >
            Ir a la tienda
          </Link>
        </div>

        {/* Productos */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode="grid"
                showCategoryBadge={true}
              />
            ))}
          </div>
        ) : (
          <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center">
            <div className="rounded-3xl border border-dashed border-gray-300 p-10">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold text-gray-900">
                No se encontraron productos
              </h2>
              <p className="mt-2 max-w-xl text-balance text-sm text-gray-600">
                No encontramos productos que coincidan con &ldquo;
                {searchQuery}&rdquo;. Intenta con otros términos de búsqueda o
                explora nuestras categorías.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/shop"
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors duration-200"
                >
                  Ver todos los productos
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium rounded-xl transition-colors duration-200"
                >
                  Ir a la tienda
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
