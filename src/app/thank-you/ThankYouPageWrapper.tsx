"use client";
import { Suspense } from "react";
import ThankYouPage from "@/components/ThankYouPage/ThankYouPage";
import { useSearchParams } from "next/navigation";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return <ThankYouPage status="success" params={query} />;
}

export default function ThankYouPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Cargando...
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
