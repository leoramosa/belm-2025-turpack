import PoliticasSection from "@/components/Politicas/PoliticasSection";
import type { Metadata } from "next";

export default function PoliticasPage() {
  return <PoliticasSection />;
}

// Metadata mejorada para la página Políticas
export const metadata: Metadata = {
  title: "Políticas y Términos",
  description:
    "Conoce nuestras políticas de privacidad, términos y condiciones, y políticas de envío y devolución en Belm.",
  keywords: [
    "políticas de privacidad",
    "términos y condiciones",
    "políticas de envío",
    "políticas de devolución",
    "términos de uso",
    "privacidad",
  ],
  openGraph: {
    title: "Políticas y Términos - Belm",
    description:
      "Conoce nuestras políticas de privacidad, términos y condiciones en Belm.",
    url: "https://belm.pe/politicas",
    images: [
      {
        url: "/og-politicas.jpg",
        width: 1200,
        height: 630,
        alt: "Políticas y Términos - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://belm.pe/politicas",
  },
};
