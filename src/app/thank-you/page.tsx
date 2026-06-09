import ThankYouPageWrapper from "./ThankYouPageWrapper";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gracias por tu Compra",
  description:
    "¡Tu compra en Belm ha sido confirmada! Te hemos enviado un email con los detalles de tu pedido. Gracias por confiar en nosotros.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Gracias por tu Compra - Belm",
    description:
      "¡Tu compra en Belm ha sido confirmada! Te hemos enviado un email con los detalles.",
    url: absoluteUrl("/thank-you"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/thank-you"),
  },
};

export default function ThankYou() {
  return <ThankYouPageWrapper />;
}
