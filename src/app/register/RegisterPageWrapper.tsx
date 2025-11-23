"use client";
import { Suspense } from "react";
import RegisterPage from "@/components/RegisterPage/RegisterPage";

function RegisterContent() {
  return <RegisterPage />;
}

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
