import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetail from "@/components/Product/ProductDetail";
import { fetchProductBySlug, fetchProducts } from "@/services/products";
import { fetchProductCategoriesTree } from "@/services/categories";
import type { IProduct } from "@/types/product";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [product, categories] = await Promise.all([
    fetchProductBySlug(slug),
    fetchProductCategoriesTree(),
  ]);

  if (!product) {
    notFound();
  }

  // Cargar recomendaciones de la misma categoría principal
  let recommendations: IProduct[] = [];
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
      <ProductDetail
        product={product}
        categories={categories}
        recommendations={recommendations}
      />
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
      title: "Producto no encontrado - Belm",
    };
  }

  const title = `${product.name} | Tienda Belm`;
  const description = extractPlainText(
    product.shortDescription || product.description
  );

  // Obtener la imagen principal
  const primaryImage = product.images?.[0];
  const imageUrl = primaryImage?.src || "/belm-rs.jpg";

  // Obtener precios
  const price = product.pricing.salePrice ?? product.pricing.price ?? 0;
  const regularPrice =
    product.pricing.regularPrice ?? product.pricing.price ?? 0;
  const hasDiscount =
    product.pricing.salePrice !== null &&
    product.pricing.salePrice > 0 &&
    product.pricing.regularPrice !== null &&
    product.pricing.regularPrice > 0 &&
    product.pricing.salePrice < product.pricing.regularPrice;

  return {
    title,
    description,
    keywords: [
      product.name.toLowerCase(),
      "producto premium",
      "envío gratis",
      "Perú",
      ...(product.categories?.map((cat) => cat.name.toLowerCase()) || []),
    ],
    openGraph: {
      title,
      description,
      url: `https://belm.pe/productos/${slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: "website",
      siteName: "Belm",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `https://belm.pe/productos/${slug}`,
    },
    other: {
      "product:price:amount": price.toString(),
      "product:price:currency": "PEN",
      ...(hasDiscount && {
        "product:original_price:amount": regularPrice.toString(),
        "product:original_price:currency": "PEN",
      }),
    },
  };
}

function extractPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
