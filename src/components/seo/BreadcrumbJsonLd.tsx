import { serializeJsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site";

export interface BreadcrumbJsonLdItem {
  name: string;
  path: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbJsonLdItem[];
}

export default function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  if (!items.length) return null;

  const listElements = items.map((item, index) => ({
    "@type": "ListItem" as const,
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path.startsWith("/") ? item.path : `/${item.path}`),
  }));

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: listElements,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }}
    />
  );
}
