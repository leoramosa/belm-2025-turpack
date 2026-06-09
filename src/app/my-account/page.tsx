import MyAccountPageWrapper from "./MyAccountPageWrapper";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mi Cuenta",
  description:
    "Gestiona tu cuenta en Belm. Actualiza tu información personal, revisa tus pedidos, direcciones y configuración de cuenta.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Mi Cuenta - Belm",
    description:
      "Gestiona tu cuenta en Belm. Actualiza tu información personal y revisa tus pedidos.",
    url: absoluteUrl("/my-account"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/my-account"),
  },
};

export default function MyAccountPageContainer() {
  return <MyAccountPageWrapper />;
}
