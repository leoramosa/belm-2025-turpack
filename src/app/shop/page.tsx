import { ProductGridClient } from "@/components/Product/ProductGridClient";
import { fetchProducts } from "@/services/products";
import type { Metadata } from "next";
import type { IProduct } from "@/types/product";
import { generatePageTitle } from "@/utils/seo";

// Metadata específica para la página Shop
export const metadata: Metadata = {
  title: generatePageTitle("Tienda", "Belm", "Productos Premium"),
  description:
    "Descubre todos nuestros productos premium en la tienda de Belm. Filtra por categoría, precio y características. Envío gratis a todo el Perú.",
  keywords: [
    "tienda",
    "productos",
    "catalogo completo",
    "productos premium",
    "filtros",
    "envío gratis",
    "Perú",
  ],
  openGraph: {
    title: "Tienda - Belm",
    description:
      "Descubre todos nuestros productos premium en la tienda de Belm. Filtra por categoría, precio y características.",
    url: "https://www.belm.pe/shop",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Tienda - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://www.belm.pe/shop",
  },
};

export default async function Shop() {
  let products: IProduct[] = [];

  try {
    products = await fetchProducts({ fetchAll: true });
  } catch (error) {
    console.error("Error loading products:", error);
  }

  const customHeader = (
    <div key="shop-header" className="mb-8">
      <h1 className="text-4xl md:text-5xl font-bold mb-2 text-primary text-center pt-10">
        Tienda - Belm
      </h1>
      <p className="text-gray-600 text-lg text-center">
        Descubre nuestra selección de <strong>productos premium</strong> en{" "}
        <strong>Belm</strong> con los mejores atributos y precios. Explora
        nuestro catálogo completo de productos de belleza premium.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen">
      {products.length > 0 ? (
        <ProductGridClient
          title="Tienda"
          products={products}
          customHeader={customHeader}
        />
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
