import CartPageWrapper from "./CartPageWrapper";
import type { Metadata } from "next";

// Metadata específica para la página Cart
export const metadata: Metadata = {
  title: "Carrito de Compras",
  description:
    "Revisa los productos en tu carrito de compras en Belm. Modifica cantidades, elimina productos y procede al checkout.",
  keywords: [
    "carrito",
    "compras",
    "productos seleccionados",
    "checkout",
    "cantidad",
  ],
  robots: {
    index: false, // No indexar páginas de carrito
    follow: true,
  },
  openGraph: {
    title: "Carrito de Compras - Belm",
    description:
      "Revisa los productos en tu carrito de compras en Belm. Modifica cantidades y procede al checkout.",
    url: "https://www.belm.pe/cart",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Carrito de Compras - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://www.belm.pe/cart",
  },
};

export default function Cart() {
  return <CartPageWrapper />;
}
