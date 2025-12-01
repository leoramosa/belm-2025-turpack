"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface DecodedData {
  token?: string;
  email?: string;
  queueId?: string;
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const dataParam = searchParams.get("data");
  const tokenParam = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [message, setMessage] = useState("Procesando...");
  const [decodedData, setDecodedData] = useState<DecodedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para confirmar suscripción en el backend
  const confirmSubscription = async (token: string, email: string) => {
    try {
      const response = await fetch("/api/newsletter/resend/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al confirmar suscripción");
      }

      return await response.json();
    } catch (error) {
      console.error("Error confirmando suscripción:", error);
      throw error;
    }
  };

  useEffect(() => {
    const processSubscriptionAction = async () => {
      try {
        let token = "";
        let email = "";

        // Caso 1: Parámetros directos (nueva implementación)
        if (tokenParam && emailParam) {
          token = tokenParam;
          email = emailParam;
          setDecodedData({ token, email });
        }
        // Caso 2: Parámetro data codificado (implementación anterior)
        else if (dataParam) {
          const decoded = Buffer.from(dataParam, "base64").toString("utf8");
          const parsed: DecodedData = JSON.parse(decoded);
          setDecodedData(parsed);
          token = parsed.token || "";
          email = parsed.email || "";
        }
        // Caso 3: Sin parámetros
        else {
          setMessage("No se encontró información de suscripción.");
          setIsLoading(false);
          return;
        }

        if (action === "confirm") {
          // Confirmar la suscripción llamando al backend
          if (token && email) {
            const result = await confirmSubscription(token, email);
            // Usar el mensaje del backend
            setMessage(
              result.message ||
                "¡Tu suscripción ha sido confirmada exitosamente!"
            );
          } else {
            setMessage("¡Tu suscripción ha sido confirmada exitosamente!");
          }
        } else if (action === "unsubscribe") {
          setMessage(
            "Te has dado de baja de nuestro newsletter correctamente."
          );
          // Aquí podrías hacer una llamada a tu API si necesitas registrar la baja
        } else if (action === "manage") {
          setMessage("Página de gestión de suscripción.");
          // Aquí podrías mostrar opciones para gestionar la suscripción
        } else {
          setMessage("Acción de suscripción no reconocida.");
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error procesando datos de MailPoet:", error);
        setMessage("Error al procesar la información de suscripción.");
        setIsLoading(false);
      }
    };

    processSubscriptionAction();
  }, [action, dataParam, tokenParam, emailParam]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-lg text-gray-600">Procesando...</p>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50">
      {/* Header similar al de tu sitio */}

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            {/* Ícono de estado */}
            <div className="mb-6">
              {action === "confirm" ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {action === "confirm"
                ? "Suscripción Confirmada"
                : "Baja de Suscripción"}
            </h1>

            {/* Mensaje */}
            <p className="text-lg text-gray-600 mb-6">{message}</p>

            {/* Información del usuario */}
            {decodedData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2 text-gray-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium">{decodedData.email}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Mensaje adicional */}
            {action === "confirm" ? (
              <p className="text-gray-600 mb-6">
                ¡Gracias por suscribirte! Recibirás nuestras mejores ofertas y
                novedades muy pronto.
              </p>
            ) : (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Lamentamos verte partir. Si fue un error, puedes volver a
                  suscribirte en cualquier momento.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center text-primary hover:text-primary font-medium"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Volver a suscribirme
                </Link>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary transition-colors"
              >
                Ir a la página principal
              </Link>
              <Link
                href="/shop"
                className="px-6 py-3 border border-primary text-primary rounded-md hover:bg-purple-50 transition-colors"
              >
                Ver productos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component para Suspense
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-lg text-gray-600">Cargando...</p>
    </div>
  );
}

// Componente principal que envuelve todo en Suspense
export default function SubscriptionStatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionContent />
    </Suspense>
  );
}
