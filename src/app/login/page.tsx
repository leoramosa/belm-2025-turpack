import { Suspense } from "react";
import LoginPageWrapper from "./LoginPageWrapper";
import type { Metadata } from "next";

// Metadata específica para la página de Login
export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description:
    "Accede a tu cuenta en Belm. Inicia sesión para disfrutar de una experiencia de compra personalizada y gestionar tus pedidos.",
  keywords: ["iniciar sesión", "login", "cuenta", "acceso", "usuario", "Belm"],
  robots: {
    index: false, // No indexar páginas de login
    follow: true,
  },
  openGraph: {
    title: "Iniciar Sesión - Belm",
    description:
      "Accede a tu cuenta en Belm para una experiencia de compra personalizada.",
    url: "https://belm.pe/login",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Iniciar Sesión - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://belm.pe/login",
  },
};

export default function Login() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginPageWrapper />
    </Suspense>
  );
}
