"use client";
import ThankYouPage from "@/components/ThankYouPage/ThankYouPage";
import { useSearchParams, useParams } from "next/navigation";

export default function PaymentResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const status = params.status as string;

  // Convierte searchParams a objeto
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return <ThankYouPage status={status} params={query} />;
}
