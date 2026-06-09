import type { IProduct } from "@/types/product";
import { serializeJsonLd } from "@/lib/json-ld";
import { buildProductJsonLd } from "@/lib/product-json-ld";
import { SITE_URL } from "@/lib/site";

interface ProductJsonLdProps {
  product: IProduct;
  siteUrl?: string;
}

export default function ProductJsonLd({
  product,
  siteUrl = SITE_URL,
}: ProductJsonLdProps) {
  const payload = buildProductJsonLd(product, siteUrl);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }}
    />
  );
}
