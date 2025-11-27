"use client";
import OrderDetail from "@/components/Orders/OrderDetail";
import { useParams } from "next/navigation";

export default function OrderDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  if (!id) return <div>No se encontró la orden</div>;
  return <OrderDetail orderId={id} />;
}
