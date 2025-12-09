import OfertasEspecialesPage from "@/components/OfertasEspeciales/OfertasEspecialesPage";
import { fetchSaleProducts } from "@/services/products";
import type { Metadata } from "next";
import { generatePageTitle } from "@/utils/seo";

// Metadata específica para la página Ofertas especiales
export const metadata: Metadata = {
  title: generatePageTitle("Ofertas especiales", "Belm", "Descuentos"),
  description:
    "Descubre nuestras mejores ofertas y promociones. Productos con descuentos especiales y precios únicos.",
  keywords: [
    "ofertas especiales",
    "descuentos",
    "promociones",
    "productos en oferta",
    "precios especiales",
    "rebajas",
  ],
  openGraph: {
    title: "Ofertas especiales - Belm",
    description:
      "Descubre nuestras mejores ofertas y promociones. Productos con descuentos especiales.",
    url: "https://www.belm.pe/ofertas-especiales",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Ofertas especiales - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://www.belm.pe/ofertas-especiales",
  },
};

export default async function OfertasEspecialesRoutePage() {
  // Máximo 72 productos para la página completa
  // Esta función ya filtra productos con descuento (simples y variables)
  const saleProducts = await fetchSaleProducts(72, false);

  return <OfertasEspecialesPage products={saleProducts} />;
}
