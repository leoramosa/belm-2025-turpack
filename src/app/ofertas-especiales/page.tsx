import OfertasEspecialesPage from "@/components/OfertasEspeciales/OfertasEspecialesPage";
import { fetchSaleProducts } from "@/services/products";
import type { Metadata } from "next";

// Metadata específica para la página Ofertas especiales
export const metadata: Metadata = {
  title: "Ofertas especiales - Belm",
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
    url: "https://belm.pe/ofertas-especiales",
    images: [
      {
        url: "/og-ofertas-especiales.jpg",
        width: 1200,
        height: 630,
        alt: "Ofertas especiales - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://belm.pe/ofertas-especiales",
  },
};

export default async function OfertasEspecialesRoutePage() {
  // Usar EXACTAMENTE la misma función y parámetros que funciona en home
  // En home se usa: fetchSaleProducts(9, false)
  // Usamos un límite alto pero con includeOutOfStock=false para mantener la misma lógica
  // Esta función ya filtra productos con descuento (simples y variables)
  const saleProducts = await fetchSaleProducts(500, false);

  return <OfertasEspecialesPage products={saleProducts} />;
}
