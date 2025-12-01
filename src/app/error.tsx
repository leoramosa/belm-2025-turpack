"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 via-white to-zinc-100 px-4">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-red-200 bg-white p-10 text-center shadow-lg">
        {/* Error Icon */}
        <div className="rounded-full bg-red-100 p-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-zinc-900">Algo salió mal</h1>

        {/* Description */}
        <p className="text-base text-zinc-600 max-w-md">
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo o regresa
          al inicio.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <details className="w-full mt-4 text-left">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-700 hover:text-zinc-900">
              Detalles del error (solo desarrollo)
            </summary>
            <div className="mt-4 p-4 bg-zinc-100 rounded-lg text-xs font-mono text-zinc-700 overflow-auto">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              {error.digest && (
                <div className="mb-2">
                  <strong>Digest:</strong> {error.digest}
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap text-xs">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/10 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
