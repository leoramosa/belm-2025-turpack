import { ProductGridClient } from "@/components/Product/ProductGridClient";
import { fetchProducts } from "@/services/products";
import type { IProduct } from "@/types/product";

export default async function Shop() {
  let products: IProduct[] = [];

  try {
    products = await fetchProducts({ fetchAll: true });
  } catch (error) {
    console.error("Error loading products:", error);
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-primary text-center pt-10">
          Tienda
        </h1>
        <p className="text-gray-600 text-lg text-center">
          Descubre nuestra selección de productos con los mejores atributos y
          precios.
        </p>
      </div>
      {products.length > 0 ? (
        <ProductGridClient title="Tienda" products={products} />
      ) : (
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
      )}
    </div>
  );
}
