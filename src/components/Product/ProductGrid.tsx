import { fetchProducts } from "@/services/products";
import { ProductGridClient } from "@/components/Product/ProductGridClient";

interface ProductGridProps {
  title?: string;
  search?: string;
}

export async function ProductGrid({
  title = "Productos destacados",
  search,
}: ProductGridProps) {
  try {
    const products = await fetchProducts({ search, fetchAll: true });

    if (!products.length) {
      return (
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center">
          <div className="rounded-3xl border border-dashed border-zinc-300 p-10 dark:border-zinc-700">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Sin productos por ahora
            </h2>
            <p className="mt-2 max-w-xl text-balance text-sm text-zinc-600 dark:text-zinc-400">
              Una vez tengas productos publicados en tu WordPress, aparecerán
              automáticamente aquí.
            </p>
          </div>
        </section>
      );
    }

    return <ProductGridClient title={title} products={products} />;
  } catch (error) {
    console.error(error);

    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400">
          No pudimos cargar los productos
        </h2>
      </section>
    );
  }
}
