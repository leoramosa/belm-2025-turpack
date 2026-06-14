import type { IProduct } from "@/types/product";
import { absoluteUrl } from "@/lib/site";
import { resolveProductBrandName } from "@/utils/productAttributes";

const DESCRIPTION_MAX = 8000;

function stripHtmlToPlain(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toAbsoluteImageUrl(src: string | undefined, baseUrl: string): string | null {
  if (!src?.trim()) return null;
  const s = src.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${baseUrl}${path}`;
}

function mapAvailability(
  stockStatus: string | null
): "https://schema.org/InStock" | "https://schema.org/OutOfStock" | "https://schema.org/BackOrder" {
  const s = (stockStatus || "").toLowerCase();
  if (s === "outofstock" || s === "out_of_stock") {
    return "https://schema.org/OutOfStock";
  }
  if (s === "onbackorder" || s === "on_backorder") {
    return "https://schema.org/BackOrder";
  }
  return "https://schema.org/InStock";
}

function formatOfferPrice(product: IProduct): string {
  const raw =
    product.pricing.salePrice ??
    product.pricing.price ??
    product.pricing.regularPrice;
  if (raw == null || Number.isNaN(Number(raw))) {
    return "0.00";
  }
  return Number(raw).toFixed(2);
}

function collectProductImages(product: IProduct, baseUrl: string): string[] {
  const urls: string[] = [];
  for (const img of product.images ?? []) {
    const abs = toAbsoluteImageUrl(img.src, baseUrl);
    if (abs && !urls.includes(abs)) urls.push(abs);
  }
  if (urls.length === 0) {
    urls.push(absoluteUrl("/opengraph-image"));
  }
  return urls;
}

/**
 * Objeto JSON-LD Schema.org Product para rich results.
 */
export function buildProductJsonLd(
  product: IProduct,
  baseUrl: string
): Record<string, unknown> {
  // Descripción corta primero (como en ProductDetail / meta), luego la larga
  const shortHtml = (product.shortDescription ?? "").trim();
  const longHtml = (product.description ?? "").trim();
  const htmlForSchema = shortHtml.length > 0 ? shortHtml : longHtml;
  const plainDesc = stripHtmlToPlain(htmlForSchema);
  const description =
    plainDesc.length > DESCRIPTION_MAX
      ? plainDesc.slice(0, DESCRIPTION_MAX)
      : plainDesc;

  const productPath = `/productos/${product.slug}`;
  const productPageUrl = `${baseUrl}${productPath}`;
  const currency = (product.pricing.currency || "PEN").toUpperCase();
  const categoryName = product.categories?.[0]?.name;
  const sku =
    typeof product.sku === "string" && product.sku.trim().length > 0
      ? product.sku.trim()
      : String(product.id);
  const brandName = resolveProductBrandName(product) || "Belm";

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: description || product.name,
    image: collectProductImages(product, baseUrl),
    sku,
    url: productPageUrl,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: productPageUrl,
      priceCurrency: currency,
      price: formatOfferPrice(product),
      availability: mapAvailability(product.stockStatus),
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Belm",
        url: baseUrl,
      },
    },
  };

  if (categoryName) {
    payload.category = categoryName;
  }

  const ratingCount = product.ratingCount ?? 0;
  const avg =
    product.averageRating != null && product.averageRating > 0
      ? product.averageRating
      : null;
  if (ratingCount > 0 && avg != null) {
    payload.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: ratingCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return payload;
}
