import { useState } from "react";

interface UseNewsletterResendReturn {
  email: string;
  message: string;
  isLoading: boolean;
  setEmail: (email: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  closeMessage: () => void;
  status: "success" | "error" | null;
}

export function useNewsletterResend(
  successMessage?: string
): UseNewsletterResendReturn {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Por favor ingresa tu email");
      setStatus("error");
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/newsletter/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al suscribirse");
      }

      // Verificar si es un caso especial de suscriptor pendiente
      if (data.success === false && data.status === "pending") {
        setMessage(
          data.message ||
            "Ya tienes una suscripción pendiente. Revisa tu email para confirmar."
        );
        setStatus("error");
        setEmail(""); // Limpiar el campo
      } else {
        setMessage(data.message || successMessage || "¡Suscripción exitosa!");
        setStatus("success");
        setEmail(""); // Limpiar el campo después del éxito
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error inesperado";
      setMessage(errorMessage);
      setStatus("error");
      console.error("Newsletter subscription error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeMessage = () => {
    setMessage("");
    setStatus(null);
  };

  return {
    email,
    message,
    isLoading,
    setEmail,
    handleSubmit,
    closeMessage,
    status,
  };
}
