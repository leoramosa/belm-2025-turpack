import type { IProduct } from "@/types/product";
import type { IProductReview } from "@/interface/IProductReview";
import { serializeJsonLd } from "@/lib/json-ld";
import { buildProductJsonLd } from "@/lib/product-json-ld";
import { SITE_URL } from "@/lib/site";

interface ProductJsonLdProps {
  product: IProduct;
  siteUrl?: string;
  /** Reseñas aprobadas para `review` en JSON-LD (opcional). */
  approvedReviews?: IProductReview[];
}

export default function ProductJsonLd({
  product,
  siteUrl = SITE_URL,
  approvedReviews,
}: ProductJsonLdProps) {
  const payload = buildProductJsonLd(product, siteUrl, {
    approvedReviews,
  });
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }}
    />
  );
}
