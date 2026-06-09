import WishlistPageWrapper from "./WishlistPageWrapper";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lista de Deseos",
  description:
    "Guarda tus productos favoritos en tu lista de deseos en Belm. Accede a ellos desde cualquier dispositivo y compra cuando estés listo.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Lista de Deseos - Belm",
    description:
      "Guarda tus productos favoritos en tu lista de deseos en Belm. Accede a ellos desde cualquier dispositivo.",
    url: absoluteUrl("/wishlist"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/wishlist"),
  },
};

export default function WishlistPage() {
  return <WishlistPageWrapper />;
}
