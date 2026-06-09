import OfertasEspecialesPage from "@/components/OfertasEspeciales/OfertasEspecialesPage";
import { fetchSaleProducts } from "@/services/products";
import type { Metadata } from "next";
import { generatePageTitle } from "@/utils/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: generatePageTitle("Ofertas especiales", "Belm", "Descuentos"),
  description:
    "Descubre nuestras mejores ofertas y promociones. Productos con descuentos especiales y precios únicos.",
  openGraph: {
    title: "Ofertas especiales - Belm",
    description:
      "Descubre nuestras mejores ofertas y promociones. Productos con descuentos especiales.",
    url: absoluteUrl("/ofertas-especiales"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/ofertas-especiales"),
  },
};

export default async function OfertasEspecialesRoutePage() {
  const saleProducts = await fetchSaleProducts(72, false);

  return <OfertasEspecialesPage products={saleProducts} />;
}
