"use client";

interface NewsletterInputProps {
  email: string;
  setEmail: (email: string) => void;
  isLoading: boolean;
  placeholder?: string;
  variant?: "default" | "footer";
}

export default function NewsletterInput({
  email,
  setEmail,
  isLoading,
  placeholder = "Ingresa tu email",
  variant = "default",
}: NewsletterInputProps) {
  if (variant === "footer") {
    return (
      <div className="flex-1 relative">
        {/* Icono de email para footer */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-12 pr-4 py-3 rounded-full bg-white text-primary border border-white/30 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all duration-200 placeholder-primary"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      />
    </div>
  );
}
