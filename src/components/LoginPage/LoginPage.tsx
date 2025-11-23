import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/services/auth";
import Link from "next/link";

import { FiArrowLeft as ArrowLeft } from "react-icons/fi";
/* import { AiOutlineGoogle as Chrome } from "react-icons/ai";
import { FaApple as Apple } from "react-icons/fa"; */
import { MdMail as Mail } from "react-icons/md";
import { MdLock as Lock } from "react-icons/md";
import { FiEye as Eye, FiEyeOff as EyeOff } from "react-icons/fi";
import { useUserStore } from "@/store/userStore";
import { useAuth } from "@/hooks/useAuth";
import LoadingRedirect from "@/components/shared/LoadingRedirect";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useUserStore((s) => s.setUser);
  const { isAuthenticated } = useAuth();
  // const { getCSRFField } = useCSRF();
  const [redirectTo, setRedirectTo] = useState("/my-account");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [validationErrors] = useState<Record<string, string>>({});

  // Rate limiting: 5 intentos por 15 minutos
  // const rateLimit = useRateLimit({
  //   maxAttempts: 5,
  //   windowMs: 15 * 60 * 1000, // 15 minutos
  //   key: "login",
  // });

  // 🔄 MANEJAR SEARCH PARAMS EN NEXT.JS 15
  useEffect(() => {
    const redirect = searchParams.get("redirect");

    if (redirect) {
      // Decodificar la URL si está codificada
      const decodedRedirect = decodeURIComponent(redirect);
      setRedirectTo(decodedRedirect);
    }
  }, [searchParams]);

  // 🔒 VALIDACIÓN: Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated) {
      // Pequeño delay para evitar redirecciones muy rápidas
      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    }
  }, [isAuthenticated, router, redirectTo]);

  // Si ya está autenticado, mostrar loading mientras redirige
  if (isAuthenticated) {
    return <LoadingRedirect />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const user = await loginUser(formData.email, formData.password);

      setSuccessMsg("Inicio de sesión exitoso");
      setUser(user, user.token);

      // 🔧 GUARDAR TOKEN EN COOKIES PARA EL MIDDLEWARE
      document.cookie = `auth-token=${user.token}; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = `user-token=${user.token}; path=/; max-age=86400; SameSite=Strict`;

      // 🔧 AGREGAR TOKEN A HEADERS PARA REQUESTS FUTUROS
      if (typeof window !== "undefined") {
        // @ts-expect-error - Agregando token al objeto window para requests futuros
        window.authToken = user.token;
      }

      // No redirigir aquí, el useEffect se encargará cuando isAuthenticated cambie
    } catch {
      setErrorMsg("Error en el login. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };
  /* 
  const handleSocialLogin = (provider: string) => {
    // Aquí puedes implementar la lógica de social login si la tienes
    alert(`Social login con ${provider} no implementado.`);
  }; */

  return (
    <div className=" bg-gradient-to-br from-gray-50 to-white">
      <div className="pt-10 pb-12">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary hover:text-third transition-colors"
            >
              <ArrowLeft size={20} />
              Regresar al home
            </Link>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Bienvenido
              </h1>
              <p className="text-gray-600">Inicia sesión en tu cuenta</p>
            </div>
            {/* <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSocialLogin("google")}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-2xl hover:border-[#07D6AF] transition-colors duration-300 group"
              >
                <Chrome
                  size={20}
                  className="text-gray-600 group-hover:text-primary"
                />
                <span className="font-medium text-gray-700 group-hover:text-primary">
                  Continuar con Google
                </span>
              </button>
              <button
                onClick={() => handleSocialLogin("apple")}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-2xl hover:border-[#07D6AF] transition-colors duration-300 group"
              >
                <Apple
                  size={20}
                  className="text-gray-600 group-hover:text-primary"
                />
                <span className="font-medium text-gray-700 group-hover:text-primary">
                  Continuar con Apple
                </span>
              </button>
            </div> */}
            {/* <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  O continúa con email
                </span>
              </div>
            </div> */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              method="POST"
              action="#"
              noValidate
            >
              {/* CSRF Token - Hidden field */}
              {/* <input
                type="hidden"
                name={getCSRFField().name}
                value={getCSRFField().value}
              /> */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none transition-all duration-300"
                    placeholder="Introduce tu email"
                  />
                  {validationErrors.email && (
                    <p className="text-red-600 text-xs mt-1">
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none transition-all duration-300"
                    placeholder="Introduce tu contraseña"
                  />
                  {validationErrors.password && (
                    <p className="text-red-600 text-xs mt-1">
                      {validationErrors.password}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff
                        size={20}
                        className="text-gray-400 hover:text-gray-600"
                      />
                    ) : (
                      <Eye
                        size={20}
                        className="text-gray-400 hover:text-gray-600"
                      />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-primary focus:ring-[#07D6AF]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/reset-password")}
                  className="text-sm text-primary hover:text-secondary transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
              {successMsg && (
                <p className="text-green-600 text-sm">{successMsg}</p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Ingresando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>
            </form>
            <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <p className="text-gray-600">
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => router.push("/register")}
                  className="text-primary hover:text-secondary font-semibold transition-colors"
                >
                  Regístrate
                </button>
              </p>
            </div>
          </div>
          {/* <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Protegido por cifrado SSL de 256 bits
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
