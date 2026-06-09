import OrderTrackPage from "@/components/OrderTrack/OrderTrackPage";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rastrear Pedido",
  description:
    "Rastrea el estado de tu pedido en Belm. Ingresa tu número de pedido para ver el estado actual de tu compra.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Rastrear Pedido - Belm",
    description:
      "Rastrea el estado de tu pedido en Belm. Ingresa tu número de pedido para ver el estado actual.",
    url: absoluteUrl("/order-track"),
    siteName: "Belm",
  },
  alternates: {
    canonical: absoluteUrl("/order-track"),
  },
};

export default function OrderTrackPageRoute() {
  return <OrderTrackPage />;
}
