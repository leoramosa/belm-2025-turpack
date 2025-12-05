import WishlistPageWrapper from "./WishlistPageWrapper";
import type { Metadata } from "next";

// Metadata específica para la página Wishlist
export const metadata: Metadata = {
  title: "Lista de Deseos",
  description:
    "Guarda tus productos favoritos en tu lista de deseos en Belm. Accede a ellos desde cualquier dispositivo y compra cuando estés listo.",
  keywords: [
    "lista de deseos",
    "favoritos",
    "productos guardados",
    "wishlist",
    "productos favoritos",
  ],
  robots: {
    index: false, // No indexar páginas privadas
    follow: true,
  },
  openGraph: {
    title: "Lista de Deseos - Belm",
    description:
      "Guarda tus productos favoritos en tu lista de deseos en Belm. Accede a ellos desde cualquier dispositivo.",
    url: "https://www.belm.pe/wishlist",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Lista de Deseos - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://www.belm.pe/wishlist",
  },
};

export default function WishlistPage() {
  return <WishlistPageWrapper />;
}
