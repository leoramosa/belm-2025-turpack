"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@/services/auth";

// Función de validación de email simple
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
import {
  FiArrowLeft as ArrowLeft,
  FiLock as Lock,
  FiEye as Eye,
  FiEyeOff as EyeOff,
} from "react-icons/fi";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Estados para el formulario de solicitud
  const [email, setEmail] = useState("");

  // Estados para el formulario de restablecimiento
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Obtener token y login de la URL
  const token = searchParams.get("key"); // WordPress usa 'key' no 'token'
  const login = searchParams.get("login");

  useEffect(() => {
    // Si hay token y login en la URL, ir directamente al paso de restablecimiento
    if (token && login) {
      setStep("reset");
    }
  }, [token, login]);

  // Función para solicitar restablecimiento de contraseña
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Validar email
      if (!email.trim()) {
        setError("Por favor, ingresa tu email");
        setLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        setError("Por favor, ingresa un email válido");
        setLoading(false);
        return;
      }

      // Solicitar restablecimiento usando el servicio
      await requestPasswordReset(email.trim());

      setMessage(
        "Te hemos enviado un enlace de restablecimiento a tu email. Revisa tu bandeja de entrada y spam."
      );
      setEmail("");
    } catch (err: unknown) {
      console.error("Error al solicitar restablecimiento:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(
        errorMessage ||
          "Error al enviar el enlace de restablecimiento. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para restablecer contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Validaciones
      if (!password.trim()) {
        setError("Por favor, ingresa una nueva contraseña");
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }

      if (!token || !login) {
        setError("Enlace de restablecimiento inválido");
        setLoading(false);
        return;
      }

      // Restablecer contraseña usando el servicio
      await resetPassword({
        key: token!, // WordPress espera 'key' no 'token'
        login: login!,
        password: password.trim(),
      });

      setMessage(
        "Contraseña restablecida exitosamente. Redirigiendo al login..."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error al restablecer contraseña:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(
        errorMessage ||
          "Error al restablecer la contraseña. El enlace puede haber expirado."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full pt-30 pb-30 bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {step === "request" ? "Restablecer contraseña" : "Nueva contraseña"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === "request"
            ? "Ingresa tu email para recibir un enlace de restablecimiento"
            : "Ingresa tu nueva contraseña"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === "request" ? (
            // Formulario de solicitud de restablecimiento
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                  {message}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Enviando..."
                    : "Enviar enlace de restablecimiento"}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-sm text-gray-600 hover:text-primary flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al login
                </button>
              </div>
            </form>
          ) : (
            // Formulario de restablecimiento de contraseña
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nueva contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirmar contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Repite la contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                  {message}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Restableciendo..." : "Restablecer contraseña"}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-sm text-gray-600 hover:text-primary flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
