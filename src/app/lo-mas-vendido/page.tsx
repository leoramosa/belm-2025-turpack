import LoMasVendidoPage from "@/components/LoMasVendido/LoMasVendidoPage";
import { fetchBestSellerProducts } from "@/services/products";
import type { Metadata } from "next";

// Metadata específica para la página Lo más vendido
export const metadata: Metadata = {
  title: "Lo más vendido - Belm",
  description:
    "Descubre nuestros productos más populares y vendidos. Los favoritos de nuestros clientes con las mejores calificaciones.",
  keywords: [
    "productos más vendidos",
    "lo más vendido",
    "productos populares",
    "best seller",
    "productos favoritos",
    "más comprados",
  ],
  openGraph: {
    title: "Lo más vendido - Belm",
    description:
      "Descubre nuestros productos más populares y vendidos. Los favoritos de nuestros clientes.",
    url: "https://belm.pe/lo-mas-vendido",
    images: [
      {
        url: "/og-lo-mas-vendido.jpg",
        width: 1200,
        height: 630,
        alt: "Lo más vendido - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://belm.pe/lo-mas-vendido",
  },
};

export default async function LoMasVendidoRoutePage() {
  // Usar EXACTAMENTE la misma función y parámetros que funciona en home
  // En home se usa: fetchBestSellerProducts(9, false)
  // Usamos un límite alto pero con includeOutOfStock=false para mantener la misma lógica
  const bestSellerProducts = await fetchBestSellerProducts(500, false);

  return <LoMasVendidoPage products={bestSellerProducts} />;
}
