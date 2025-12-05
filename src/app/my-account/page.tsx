import MyAccountPageWrapper from "./MyAccountPageWrapper";
import type { Metadata } from "next";

// Metadata específica para la página My Account
export const metadata: Metadata = {
  title: "Mi Cuenta",
  description:
    "Gestiona tu cuenta en Belm. Actualiza tu información personal, revisa tus pedidos, direcciones y configuración de cuenta.",
  keywords: [
    "mi cuenta",
    "perfil",
    "pedidos",
    "direcciones",
    "configuración",
    "usuario",
  ],
  robots: {
    index: false, // No indexar páginas de cuenta privada
    follow: true,
  },
  openGraph: {
    title: "Mi Cuenta - Belm",
    description:
      "Gestiona tu cuenta en Belm. Actualiza tu información personal y revisa tus pedidos.",
    url: "https://www.belm.pe/my-account",
    images: [
      {
        url: "/belm-rs.jpg",
        width: 1200,
        height: 630,
        alt: "Mi Cuenta - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://www.belm.pe/my-account",
  },
};

export default function MyAccountPageContainer() {
  return <MyAccountPageWrapper />;
}
