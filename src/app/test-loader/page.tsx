"use client";

import { useLoader } from "@/hooks/useLoader";
import { useState } from "react";

export default function TestLoaderPage() {
  const { showLoader, hideLoader, withLoader } = useLoader();
  const [message, setMessage] = useState("");

  const handleShowLoader = () => {
    showLoader("Probando loader global...");
    setTimeout(() => {
      hideLoader();
      setMessage("Loader ocultado después de 2 segundos");
    }, 2000);
  };

  const handleWithLoader = async () => {
    setMessage("");
    const result = await withLoader(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return "Completado";
    }, "Cargando con withLoader...");
    setMessage(`Resultado: ${result}`);
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Test del Loader Global</h1>
      <div className="space-y-4">
        <button
          onClick={handleShowLoader}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Mostrar Loader (manual)
        </button>
        <button
          onClick={handleWithLoader}
          className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark ml-4"
        >
          Mostrar Loader (withLoader)
        </button>
        {message && (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
