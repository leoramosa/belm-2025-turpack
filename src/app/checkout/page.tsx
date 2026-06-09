import CheckoutPage from "@/components/CheckoutPage/CheckoutPage";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Finalizar Compra",
  description:
    "Completa tu compra de forma segura en Belm. Revisa tu pedido, selecciona el método de envío y pago. Proceso 100% seguro.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Finalizar Compra - Belm",
    description:
      "Completa tu compra de forma segura en Belm. Proceso 100% seguro.",
    url: absoluteUrl("/checkout"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/checkout"),
  },
};

export default function Checkout() {
  return <CheckoutPage />;
}
