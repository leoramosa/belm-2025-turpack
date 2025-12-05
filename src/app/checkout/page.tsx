import CheckoutPage from "@/components/CheckoutPage/CheckoutPage";
import type { Metadata } from "next";

// Metadata específica para la página de Checkout
export const metadata: Metadata = {
  title: "Finalizar Compra",
  description:
    "Completa tu compra de forma segura en Belm. Revisa tu pedido, selecciona el método de envío y pago. Proceso 100% seguro.",
  keywords: [
    "finalizar compra",
    "checkout",
    "pago seguro",
    "carrito",
    "pedido",
    "envío",
  ],
  robots: {
    index: false, // No indexar páginas de checkout
    follow: true,
  },
  openGraph: {
    title: "Finalizar Compra - Belm",
    description:
      "Completa tu compra de forma segura en Belm. Proceso 100% seguro.",
    url: "https://www.belm.pe/checkout",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Finalizar Compra - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://www.belm.pe/checkout",
  },
};

export default function Checkout() {
  return <CheckoutPage />;
}
