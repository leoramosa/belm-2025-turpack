import LoMasNuevoPage from "@/components/LoMasNuevo/LoMasNuevoPage";
import { fetchNewProducts } from "@/services/products";
import type { Metadata } from "next";
import { generatePageTitle } from "@/utils/seo";

// Metadata específica para la página Lo más nuevo
export const metadata: Metadata = {
  title: generatePageTitle("Lo más nuevo", "Belm", "Productos Nuevos"),
  description:
    "Descubre nuestros productos más recientes con las últimas tendencias y ofertas. Productos nuevos agregados recientemente a nuestra tienda.",
  keywords: [
    "productos nuevos",
    "lo más nuevo",
    "últimas tendencias",
    "productos recientes",
    "nuevos productos",
    "ofertas nuevas",
  ],
  openGraph: {
    title: "Lo más nuevo - Belm",
    description:
      "Descubre nuestros productos más recientes con las últimas tendencias y ofertas.",
    url: "https://www.belm.pe/lo-mas-nuevo",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Lo más nuevo - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://www.belm.pe/lo-mas-nuevo",
  },
};

export default async function LoMasNuevoRoutePage() {
  // Máximo 72 productos para la página completa
  const newProducts = await fetchNewProducts(72, false);

  return <LoMasNuevoPage products={newProducts} />;
}
