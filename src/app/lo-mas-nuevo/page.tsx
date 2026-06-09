import LoMasNuevoPage from "@/components/LoMasNuevo/LoMasNuevoPage";
import { fetchNewProducts } from "@/services/products";
import type { Metadata } from "next";
import { generatePageTitle } from "@/utils/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: generatePageTitle("Lo más nuevo", "Belm", "Productos Nuevos"),
  description:
    "Descubre nuestros productos más recientes con las últimas tendencias y ofertas. Productos nuevos agregados recientemente a nuestra tienda.",
  openGraph: {
    title: "Lo más nuevo - Belm",
    description:
      "Descubre nuestros productos más recientes con las últimas tendencias y ofertas.",
    url: absoluteUrl("/lo-mas-nuevo"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/lo-mas-nuevo"),
  },
};

export default async function LoMasNuevoRoutePage() {
  const newProducts = await fetchNewProducts(72, false);

  return <LoMasNuevoPage products={newProducts} />;
}
