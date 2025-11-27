import LoMasNuevoPage from "@/components/LoMasNuevo/LoMasNuevoPage";
import { fetchNewProducts } from "@/services/products";
import type { Metadata } from "next";

// Metadata específica para la página Lo más nuevo
export const metadata: Metadata = {
  title: "Lo más nuevo - Belm",
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
    url: "https://belm.pe/lo-mas-nuevo",
    images: [
      {
        url: "/og-lo-mas-nuevo.jpg",
        width: 1200,
        height: 630,
        alt: "Lo más nuevo - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://belm.pe/lo-mas-nuevo",
  },
};

export default async function LoMasNuevoRoutePage() {
  // Usar EXACTAMENTE la misma función y parámetros que funciona en home
  // En home se usa: fetchNewProducts(9, false)
  // Usamos un límite alto pero con includeOutOfStock=false para mantener la misma lógica
  const newProducts = await fetchNewProducts(500, false);

  return <LoMasNuevoPage products={newProducts} />;
}
