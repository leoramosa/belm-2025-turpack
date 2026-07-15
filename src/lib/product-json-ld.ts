import type { IProduct } from "@/types/product";
import type { IProductReview } from "@/interface/IProductReview";
import { absoluteUrl } from "@/lib/site";
import { resolveProductBrandName } from "@/utils/productAttributes";

const DESCRIPTION_MAX = 8000;
const JSON_LD_REVIEW_BODY_MAX = 5000;
const JSON_LD_MAX_REVIEWS = 8;

/** Envío para Google Product rich results (OfferShippingDetails). */
const PRODUCT_SHIPPING_DETAILS = [
  {
    "@type": "OfferShippingDetails",
    shippingLabel: "Lima Metropolitana y Callao",
    shippingRate: {
      "@type": "MonetaryAmount",
      minValue: 10.0,
      maxValue: 15.0,
      currency: "PEN",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "PE",
      addressRegion: "Lima",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 3,
        unitCode: "DAY",
      },
    },
  },
  {
    "@type": "OfferShippingDetails",
    shippingLabel: "Provincias",
    shippingRate: {
      "@type": "MonetaryAmount",
      minValue: 21.0,
      maxValue: 30.0,
      currency: "PEN",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "PE",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 5,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
  },
  {
    "@type": "OfferShippingDetails",
    shippingLabel: "Envío gratis desde S/ 149",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: 0.0,
      currency: "PEN",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "PE",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
  },
] as const;

/** Política de devoluciones para Google Product rich results (MerchantReturnPolicy). */
const PRODUCT_MERCHANT_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "PE",
  returnPolicyCategory:
    "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 7,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/FreeReturn",
  refundType: [
    "https://schema.org/ExchangeRefund",
    "https://schema.org/FullRefund",
    "https://schema.org/StoreCreditRefund",
  ],
  url: "https://www.belm.pe/politicas/politicas-de-cambio-y-devoluciones",
  description:
    "Devoluciones aceptadas únicamente por fallas de fabricación. El cliente debe notificar vía correo electrónico dentro de los 7 días calendario desde la recepción del producto. BELM asume el costo de devolución en casos de defecto de origen. La resolución puede ser cambio de producto, reembolso al medio de pago original o nota de crédito.",
} as const;

export interface BuildProductJsonLdOptions {
  /** Reseñas aprobadas (WooCommerce); solo se incluyen en el grafo si hay al menos una válida. */
  approvedReviews?: IProductReview[];
}

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

function mapReviewToJsonLd(
  r: IProductReview,
  productName: string
): Record<string, unknown> {
  const reviewBody = stripHtmlToPlain(r.review).slice(0, JSON_LD_REVIEW_BODY_MAX);
  const authorName = (r.reviewer || "Cliente").trim() || "Cliente";
  const rating = Math.min(
    5,
    Math.max(1, Math.round(Number(r.rating)))
  );
  return {
    "@type": "Review",
    author: {
      "@type": "Person",
      name: authorName,
    },
    datePublished: r.date_created_gmt || r.date_created,
    reviewBody:
      reviewBody.length > 0
        ? reviewBody
        : `Valoración del producto: ${productName}`,
    reviewRating: {
      "@type": "Rating",
      ratingValue: String(rating),
      bestRating: "5",
      worstRating: "1",
    },
  };
}

/**
 * Objeto JSON-LD Schema.org Product para rich results.
 */
export function buildProductJsonLd(
  product: IProduct,
  baseUrl: string,
  options?: BuildProductJsonLdOptions
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
      shippingDetails: PRODUCT_SHIPPING_DETAILS,
      hasMerchantReturnPolicy: PRODUCT_MERCHANT_RETURN_POLICY,
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
  // Solo datos reales de WooCommerce: no inventar "0 estrellas" (políticas de Google / datos engañosos).
  if (ratingCount > 0 && avg != null) {
    payload.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: ratingCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  const reviewCandidates =
    options?.approvedReviews?.filter((r) => {
      if (r.status !== "approved") return false;
      const rr = Number(r.rating);
      return Number.isFinite(rr) && rr >= 1 && rr <= 5;
    }) ?? [];
  if (reviewCandidates.length > 0) {
    payload.review = reviewCandidates
      .slice(0, JSON_LD_MAX_REVIEWS)
      .map((r) => mapReviewToJsonLd(r, product.name));
  }

  return payload;
}
