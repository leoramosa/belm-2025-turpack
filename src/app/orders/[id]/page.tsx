import type { Metadata } from "next";
import OrderDetail from "@/components/Orders/OrderDetail";
import { fetchOrderByIdServer } from "@/services/orders.server";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const orderId = Number(id);

  if (!orderId || isNaN(orderId)) {
    return {
      title: "Pedido no encontrado - Belm",
      description: "No se pudo encontrar el pedido solicitado.",
    };
  }

  // Intentar cargar la orden para obtener información
  const order = await fetchOrderByIdServer(orderId);

  if (!order) {
    return {
      title: `Pedido #${orderId} - Belm`,
      description: `Detalles del pedido #${orderId}`,
      robots: {
        index: false, // No indexar páginas de pedidos (privadas)
        follow: false,
      },
    };
  }

  const orderDate = new Date(order.date_created).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusLabels: Record<string, string> = {
    completed: "Completado",
    processing: "Procesando",
    pending: "Pendiente",
    "on-hold": "En Espera",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };

  const statusLabel = statusLabels[order.status] || order.status;

  const title = `Pedido #${order.id} - ${statusLabel} | Belm`;
  const description = `Detalles del pedido #${order.id} realizado el ${orderDate}. Estado: ${statusLabel}. Total: ${order.currency} ${order.total}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    robots: {
      index: false, // No indexar páginas de pedidos (privadas)
      follow: false,
    },
  };
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const orderId = Array.isArray(id) ? id[0] : id;

  if (!orderId) {
    return <div>No se encontró la orden</div>;
  }

  return <OrderDetail orderId={orderId} />;
}
