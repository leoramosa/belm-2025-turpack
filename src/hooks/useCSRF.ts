import { useState, useEffect } from "react";
import { generateCSRFToken } from "@/lib/csrf";

export const useCSRF = () => {
  const [csrfToken, setCsrfToken] = useState<string>("");

  useEffect(() => {
    // Generar token CSRF al cargar el componente
    const token = generateCSRFToken();
    setCsrfToken(token);

    // Guardar token en sessionStorage para persistencia (solo en cliente)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("csrf-token", token);
    }
  }, []);

  // Función para obtener headers CSRF para fetch
  const getCSRFHeaders = () => {
    const token =
      csrfToken ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("csrf-token")
        : null) ||
      "";
    return {
      "X-CSRF-Token": token,
      "Content-Type": "application/json",
    };
  };

  // Función para agregar token a formularios
  const getCSRFField = () => {
    const token =
      csrfToken ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("csrf-token")
        : null) ||
      "";
    return { name: "_csrf", value: token };
  };

  return {
    csrfToken,
    getCSRFHeaders,
    getCSRFField,
  };
};
