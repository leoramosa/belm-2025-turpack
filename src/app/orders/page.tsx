import OrdersList from "@/components/Orders/OrdersList";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mis Pedidos",
  description:
    "Revisa el historial de tus pedidos en Belm. Ve el estado, detalles y rastrea todos tus pedidos anteriores.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Mis Pedidos - Belm",
    description:
      "Revisa el historial de tus pedidos en Belm. Ve el estado y detalles de todos tus pedidos.",
    url: absoluteUrl("/orders"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/orders"),
  },
};

export default function OrdersPage() {
  return <OrdersList />;
}
