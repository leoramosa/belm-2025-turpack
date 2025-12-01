import ThankYouPageWrapper from "./ThankYouPageWrapper";
import type { Metadata } from "next";

// Metadata específica para la página Thank You
export const metadata: Metadata = {
  title: "Gracias por tu Compra",
  description:
    "¡Tu compra en Belm ha sido confirmada! Te hemos enviado un email con los detalles de tu pedido. Gracias por confiar en nosotros.",
  keywords: [
    "gracias",
    "compra confirmada",
    "pedido exitoso",
    "confirmación",
    "email",
  ],
  robots: {
    index: false, // No indexar páginas de confirmación
    follow: true,
  },
  openGraph: {
    title: "Gracias por tu Compra - Belm",
    description:
      "¡Tu compra en Belm ha sido confirmada! Te hemos enviado un email con los detalles.",
    url: "https://belm.pe/thank-you",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Gracias por tu Compra - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://belm.pe/thank-you",
  },
};

export default function ThankYou() {
  return <ThankYouPageWrapper />;
}
