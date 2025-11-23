"use client";

import { useNewsletterResend } from "@/hooks/useNewsletterResend";
import NotificationBadge from "@/components/Newsletter/components/NotificationBadge";
import NewsletterInput from "@/components/Newsletter/components/NewsletterInput";
import NewsletterButton from "@/components/Newsletter/components/NewsletterButton";

interface NewsletterFormProps {
  className?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  variant?: "default" | "footer";
}

export default function NewsletterForm({
  className = "",
  placeholder = "Ingresa tu email",
  buttonText = "Suscribirse",
  successMessage = "¡Gracias por suscribirte! Te enviaremos las mejores ofertas.",
  variant = "default",
}: NewsletterFormProps) {
  const {
    email,
    message,
    isLoading,
    setEmail,
    handleSubmit,
    closeMessage,
    status,
  } = useNewsletterResend(successMessage);

  return (
    <div className={`newsletter-form ${className} flex flex-col`}>
      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full md:flex-row gap-2 sm:gap-4"
      >
        <NewsletterInput
          email={email}
          setEmail={setEmail}
          isLoading={isLoading}
          placeholder={placeholder}
          variant={variant}
        />

        <NewsletterButton
          isLoading={isLoading}
          disabled={isLoading || !email.trim()}
          buttonText={buttonText}
          variant={variant}
        />
      </form>

      {/* Badge de notificación */}
      {message && status && (
        <NotificationBadge
          message={message}
          type={status}
          onClose={closeMessage}
          autoHide={true}
          duration={5000}
        />
      )}
    </div>
  );
}
