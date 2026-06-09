import LoMasVendidoPage from "@/components/LoMasVendido/LoMasVendidoPage";
import { fetchBestSellerProducts } from "@/services/products";
import type { Metadata } from "next";
import { generatePageTitle } from "@/utils/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: generatePageTitle("Lo m?s vendido", "Belm", "Productos Populares"),
  description:
    "Descubre nuestros productos m?s populares y vendidos. Los favoritos de nuestros clientes con las mejores calificaciones.",
  openGraph: {
    title: "Lo m?s vendido - Belm",
    description:
      "Descubre nuestros productos m?s populares y vendidos. Los favoritos de nuestros clientes.",
    url: absoluteUrl("/lo-mas-vendido"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/lo-mas-vendido"),
  },
};

export default async function LoMasVendidoRoutePage() {
  const bestSellerProducts = await fetchBestSellerProducts(72, false);

  return <LoMasVendidoPage products={bestSellerProducts} />;
}
