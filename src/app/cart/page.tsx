import CartPageWrapper from "./CartPageWrapper";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Carrito de Compras",
  description:
    "Revisa los productos en tu carrito de compras en Belm. Modifica cantidades, elimina productos y procede al checkout.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Carrito de Compras - Belm",
    description:
      "Revisa los productos en tu carrito de compras en Belm. Modifica cantidades y procede al checkout.",
    url: absoluteUrl("/cart"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/cart"),
  },
};

export default function Cart() {
  return <CartPageWrapper />;
}
