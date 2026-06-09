import { Suspense } from "react";
import LoginPageWrapper from "./LoginPageWrapper";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description:
    "Accede a tu cuenta en Belm. Inicia sesión para disfrutar de una experiencia de compra personalizada y gestionar tus pedidos.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Iniciar Sesión - Belm",
    description:
      "Accede a tu cuenta en Belm para una experiencia de compra personalizada.",
    url: absoluteUrl("/login"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/login"),
  },
};

export default function Login() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginPageWrapper />
    </Suspense>
  );
}
