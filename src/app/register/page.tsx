import RegisterPageWrapper from "./RegisterPageWrapper";
import type { Metadata } from "next";

// Metadata específica para la página Register
export const metadata: Metadata = {
  title: "Crear Cuenta",
  description:
    "Crea tu cuenta en Belm y disfruta de una experiencia de compra personalizada. Acceso a ofertas exclusivas y gestión de pedidos.",
  keywords: [
    "crear cuenta",
    "registro",
    "nueva cuenta",
    "registrarse",
    "usuario nuevo",
    "Belm",
  ],
  robots: {
    index: false, // No indexar páginas de registro
    follow: true,
  },
  openGraph: {
    title: "Crear Cuenta - Belm",
    description:
      "Crea tu cuenta en Belm y disfruta de una experiencia de compra personalizada con ofertas exclusivas.",
    url: "https://www.belm.pe/register",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Crear Cuenta - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://www.belm.pe/register",
  },
};

export default function Register() {
  return <RegisterPageWrapper />;
}
