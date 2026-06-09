import RegisterPageWrapper from "./RegisterPageWrapper";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Crear Cuenta",
  description:
    "Crea tu cuenta en Belm y disfruta de una experiencia de compra personalizada. Acceso a ofertas exclusivas y gestión de pedidos.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Crear Cuenta - Belm",
    description:
      "Crea tu cuenta en Belm y disfruta de una experiencia de compra personalizada con ofertas exclusivas.",
    url: absoluteUrl("/register"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/register"),
  },
};

export default function Register() {
  return <RegisterPageWrapper />;
}
