import type { Metadata } from "next";
import { ProductGridClient } from "@/components/Product/ProductGridClient";
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
      title: "Búsqueda | Tienda Store",
      description: "Busca productos en nuestra tienda",
    };
  }

  return {
    title: `Búsqueda: ${query} | Tienda Store`,
    description: `Resultados de búsqueda para "${query}"`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const searchQuery = params.q || "";

  let products: IProduct[] = [];

  try {
    // Obtener todos los productos y filtrarlos por búsqueda
    products = await fetchProducts({
      search: searchQuery,
      fetchAll: true,
    });
  } catch (error) {
    console.error("Error loading search products:", error);
  }

  // Si no hay término de búsqueda, mostrar todos los productos
  if (!searchQuery.trim()) {
    try {
      // Cargar todos los productos cuando no hay búsqueda
      products = await fetchProducts({
        fetchAll: true,
      });
    } catch (error) {
      console.error("Error loading all products:", error);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            {searchQuery.trim()
              ? "Resultados de búsqueda"
              : "Explorar productos"}
          </h1>
          <p className="text-zinc-600">
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

        {products.length > 0 ? (
          <ProductGridClient
            products={products}
            disableAutoCategoryFilter={false}
            initialSearchQuery={searchQuery}
          />
        ) : (
          <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center">
            <div className="rounded-3xl border border-dashed border-zinc-300 p-10 dark:border-zinc-700">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                No se encontraron productos
              </h2>
              <p className="mt-2 max-w-xl text-balance text-sm text-zinc-600 dark:text-zinc-400">
                No encontramos productos que coincidan con &ldquo;
                {searchQuery}&rdquo;. Intenta con otros términos de búsqueda o
                explora nuestras categorías.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/shop"
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors duration-200"
                >
                  Ver todos los productos
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
