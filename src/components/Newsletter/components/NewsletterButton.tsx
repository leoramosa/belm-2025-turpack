"use client";

interface NewsletterButtonProps {
  isLoading: boolean;
  disabled: boolean;
  buttonText?: string;
  variant?: "default" | "footer";
}

export default function NewsletterButton({
  isLoading,
  disabled,
  buttonText = "Suscribirse",
  variant = "default",
}: NewsletterButtonProps) {
  const baseClasses =
    "px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed";

  const defaultClasses =
    "bg-white/40 text-emerald-700 shadow-lg backdrop-blur-md border border-white/30 ring-1 ring-white/40 hover:bg-white/60 hover:text-teal-800";

  const footerClasses =
    "bg-secondary text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap justify-center";

  const className = `${baseClasses} ${
    variant === "footer" ? footerClasses : defaultClasses
  }`;

  return (
    <button type="submit" disabled={disabled} className={className}>
      {isLoading ? "Suscribiendo..." : buttonText}

      {/* Icono de flecha para footer */}
      {variant === "footer" && (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </button>
  );
}
