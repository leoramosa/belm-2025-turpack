import OrdersList from "@/components/Orders/OrdersList";
import type { Metadata } from "next";

// Metadata específica para la página Orders
export const metadata: Metadata = {
  title: "Mis Pedidos",
  description:
    "Revisa el historial de tus pedidos en Belm. Ve el estado, detalles y rastrea todos tus pedidos anteriores.",
  keywords: [
    "mis pedidos",
    "historial pedidos",
    "estado pedidos",
    "pedidos anteriores",
    "compras",
  ],
  robots: {
    index: false, // No indexar páginas privadas
    follow: true,
  },
  openGraph: {
    title: "Mis Pedidos - Belm",
    description:
      "Revisa el historial de tus pedidos en Belm. Ve el estado y detalles de todos tus pedidos.",
    url: "https://belm.pe/orders",
    images: [
      {
        url: "/og-orders.jpg",
        width: 1200,
        height: 630,
        alt: "Mis Pedidos - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://belm.pe/orders",
  },
};

export default function OrdersPage() {
  return <OrdersList />;
}
