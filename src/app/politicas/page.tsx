import PoliticasSection from "@/components/Politicas/PoliticasSection";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export default function PoliticasPage() {
  return <PoliticasSection />;
}

export const metadata: Metadata = {
  title: "Políticas y Términos",
  description:
    "Conoce nuestras políticas de privacidad, términos y condiciones, y políticas de envío y devolución en Belm.",
  openGraph: {
    title: "Políticas y Términos - Belm",
    description:
      "Conoce nuestras políticas de privacidad, términos y condiciones en Belm.",
    url: absoluteUrl("/politicas"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/politicas"),
  },
};
