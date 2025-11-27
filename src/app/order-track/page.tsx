import OrderTrackPage from "@/components/OrderTrack/OrderTrackPage";
import type { Metadata } from "next";

// Metadata específica para la página Order Track
export const metadata: Metadata = {
  title: "Rastrear Pedido",
  description:
    "Rastrea el estado de tu pedido en Belm. Ingresa tu número de pedido para ver el estado actual de tu compra.",
  keywords: [
    "rastrear pedido",
    "seguimiento",
    "estado pedido",
    "número pedido",
    "envío",
  ],
  robots: {
    index: false, // No indexar páginas de rastreo
    follow: true,
  },
  openGraph: {
    title: "Rastrear Pedido - Belm",
    description:
      "Rastrea el estado de tu pedido en Belm. Ingresa tu número de pedido para ver el estado actual.",
    url: "https://belm.pe/order-track",
    images: [
      {
        url: "/og-order-track.jpg",
        width: 1200,
        height: 630,
        alt: "Rastrear Pedido - Belm",
      },
    ],
  },
  alternates: {
    canonical: "https://belm.pe/order-track",
  },
};

export default function OrderTrackPageRoute() {
  return <OrderTrackPage />;
}
