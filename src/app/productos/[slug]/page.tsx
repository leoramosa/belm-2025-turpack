import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetail from "@/components/Product/ProductDetail";
import ProductJsonLd from "@/components/Product/ProductJsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { fetchProductBySlug, fetchProducts } from "@/services/products";
import { fetchProductCategoriesTree } from "@/services/categories";
import type { IProduct } from "@/types/product";
import {
	optimizeMetaDescription,
	generateProductMetaDescription,
	optimizeTitle,
} from "@/utils/seo";
import { absoluteUrl, SITE_URL } from "@/lib/site";

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

  let recommendations: IProduct[] = [];
  try {
    const mainCategory = product.categories?.[0];
    if (mainCategory) {
      const categoryProducts = await fetchProducts({
        category: mainCategory.id,
        perPage: 10,
        includeOutOfStock: false,
      });

      recommendations = categoryProducts
        .filter((p) => p.id !== product.id)
        .slice(0, 4);
    }
  } catch (error) {
    console.error("Error loading recommendations:", error);
  }

  const mainCat = product.categories?.[0];
  const breadcrumbItems = [
    { name: "Inicio", path: "/" },
    ...(mainCat
      ? [{ name: mainCat.name, path: `/categorias/${mainCat.slug}` }]
      : []),
    { name: product.name, path: `/productos/${product.slug}` },
  ];

  return (
    <>
      <ProductJsonLd product={product} siteUrl={SITE_URL} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="min-h-screen ">
        <ProductDetail
          product={product}
          categories={categories}
          recommendations={recommendations}
        />
      </div>
    </>
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

  const categoryName = product.categories?.[0]?.name;
  const absoluteTitle = optimizeTitle(
    categoryName
      ? `${product.name} — ${categoryName} | Belm · Perú`
      : `${product.name} | Belm · Perú`,
    "Belm"
  );

  const rawDescription = extractPlainText(
    product.shortDescription || product.description
  );

  const price = product.pricing.salePrice ?? product.pricing.price ?? 0;

  const description = rawDescription
    ? optimizeMetaDescription(rawDescription)
    : generateProductMetaDescription(product.name, categoryName, price);

  const primaryImage = product.images?.[0];
  const hasRealProductImage = Boolean(
    primaryImage?.src?.trim() &&
      !primaryImage.src.includes("belm-rs.jpg") &&
      (primaryImage.src.startsWith("http://") ||
        primaryImage.src.startsWith("https://") ||
        primaryImage.src.startsWith("/"))
  );

  const regularPrice =
    product.pricing.regularPrice ?? product.pricing.price ?? 0;
  const hasDiscount =
    product.pricing.salePrice !== null &&
    product.pricing.salePrice > 0 &&
    product.pricing.regularPrice !== null &&
    product.pricing.regularPrice > 0 &&
    product.pricing.salePrice < product.pricing.regularPrice;

  const canonical = absoluteUrl(`/productos/${slug}`);

  return {
    title: { absolute: absoluteTitle },
    description,
    openGraph: {
      title: absoluteTitle,
      description,
      url: canonical,
      siteName: "Belm",
      // Next.js solo admite tipos OG concretos (p. ej. website, article). "product" lanza en servidor.
      type: "website",
      ...(hasRealProductImage && primaryImage?.src
        ? {
            images: [
              {
                url: primaryImage.src,
                width: 1200,
                height: 630,
                alt: product.name,
              },
            ],
          }
        : {}),
    },
    ...(hasRealProductImage && primaryImage?.src
      ? {
          twitter: {
            card: "summary_large_image",
            title: absoluteTitle,
            description,
            images: [primaryImage.src],
          },
        }
      : {
          twitter: {
            card: "summary_large_image",
            title: absoluteTitle,
            description,
          },
        }),
    alternates: {
      canonical,
    },
    other: {
      "product:price:amount": price.toString(),
      "product:price:currency": (product.pricing.currency || "PEN").toUpperCase(),
      ...(hasDiscount && {
        "product:original_price:amount": regularPrice.toString(),
        "product:original_price:currency": (
          product.pricing.currency || "PEN"
        ).toUpperCase(),
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
