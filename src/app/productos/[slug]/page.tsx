import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetail from "@/components/Product/ProductDetail";
import { fetchProductBySlug, fetchProducts } from "@/services/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Cargar recomendaciones de la misma categoría principal
  let recommendations = [];
  try {
    const mainCategory = product.categories?.[0];
    if (mainCategory) {
      const categoryProducts = await fetchProducts({
        category: mainCategory.id,
        perPage: 10,
        includeOutOfStock: false,
      });

      // Filtrar el producto actual y limitar a 4
      recommendations = categoryProducts
        .filter((p) => p.id !== product.id)
        .slice(0, 4);
    }
  } catch (error) {
    console.error("Error loading recommendations:", error);
  }

  return (
    <div className="min-h-screen ">
      <ProductDetail product={product} recommendations={recommendations} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  const title = `${product.name} | Tienda Store`;
  const description = extractPlainText(
    product.shortDescription || product.description
  );
  const primaryImage = product.images[0];

  return {
    title,
    description,
    openGraph: primaryImage
      ? {
          title,
          description,
          images: [
            {
              url: primaryImage.src,
              alt: primaryImage.alt || product.name,
            },
          ],
        }
      : undefined,
  };
}

function extractPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
