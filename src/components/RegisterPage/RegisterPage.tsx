import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerCustomer } from "@/services/auth";
import { useUserStore } from "@/store/userStore";
import { registerSchema } from "@/lib/validation";
import { validateAndSanitizeEmail, sanitizeString } from "@/lib/validation";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useCSRF } from "@/hooks/useCSRF";
import { useAuth } from "@/hooks/useAuth";
import LoadingRedirect from "@/components/shared/LoadingRedirect";

import { FiArrowLeft as ArrowLeft } from "react-icons/fi";
/* import { AiOutlineGoogle as Chrome } from "react-icons/ai";
import { FaApple as Apple } from "react-icons/fa"; */
import { MdMail as Mail } from "react-icons/md";
import { MdLock as Lock } from "react-icons/md";
import { FiEye as Eye, FiEyeOff as EyeOff } from "react-icons/fi";
import { FaUser as User } from "react-icons/fa";
import Link from "next/link";

export default function RegisterPage() {
  const searchParamsPromise = useSearchParams();
  const { getCSRFField } = useCSRF();
  const { isAuthenticated } = useAuth();
  const [redirectTo, setRedirectTo] = useState("/my-account");
  const [emailFromQuery, setEmailFromQuery] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: emailFromQuery,
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);

  // Rate limiting: 3 intentos por 30 minutos
  const rateLimit = useRateLimit({
    maxAttempts: 10,
    windowMs: 30 * 60 * 1000, // 30 minutos
    key: "register",
  });

  // 🔄 MANEJAR SEARCH PARAMS EN NEXT.JS 15
  useEffect(() => {
    const getSearchParams = async () => {
      try {
        const searchParams = await searchParamsPromise;
        const redirect = searchParams.get("redirect");
        const email = searchParams.get("email");

        if (redirect) {
          setRedirectTo(redirect);
        }
        if (email) {
          setEmailFromQuery(email);
          setFormData((prev) => ({ ...prev, email }));
        }
      } catch {
        // Error silencioso al obtener parámetros
      }
    };

    getSearchParams();
  }, [searchParamsPromise]);

  // 🔒 VALIDACIÓN: Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
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
    setValidationErrors({});

    // Verificar rate limiting
    if (!rateLimit.attempt()) {
      setErrorMsg(
        `Demasiados intentos de registro. Intenta de nuevo en ${Math.ceil(
          rateLimit.remainingTime / 60000
        )} minutos.`
      );
      return;
    }

    try {
      // Validar con Zod
      const validatedData = registerSchema.parse(formData);

      // Sanitizar datos
      const sanitizedData = {
        ...validatedData,
        firstName: sanitizeString(validatedData.firstName),
        lastName: sanitizeString(validatedData.lastName),
        email: validateAndSanitizeEmail(validatedData.email),
      };

      setIsLoading(true);

      const user = (await registerCustomer({
        email: sanitizedData.email,
        password: sanitizedData.password,
        first_name: sanitizedData.firstName,
        last_name: sanitizedData.lastName,
        username: sanitizedData.email,
      })) as {
        email: string;
        username: string;
        first_name?: string;
        id?: number;
      };

      setSuccessMsg(
        `Usuario ${user.username || user.email} registrado con éxito.`
      );

      // 🔧 GUARDAR USUARIO CORRECTAMENTE
      setUser({
        email: user.email,
        nicename: user.username,
        displayName: user.first_name || user.username || user.email,
        id: user.id,
      });

      // 🔄 REDIRECCIÓN POST-REGISTER
      router.push(redirectTo);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        // Errores de validación de Zod
        const errors: Record<string, string> = {};
        (
          error as { errors: Array<{ path: string[]; message: string }> }
        ).errors.forEach((err) => {
          if (err.path && err.path[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errors);
      } else {
        // Error de registro
        setErrorMsg(
          (error as { message?: string })?.message ||
            "Ocurrió un error al registrar. Verifica los datos o si el usuario ya existe."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /*   const handleSocialLogin = (provider: string) => {
    alert(`Social login con ${provider} no implementado.`);
  }; */

  return (
    <div className=" bg-gradient-to-br from-gray-50 to-white">
      <div className="pt-10 pb-12">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-primary hover:text-third transition-colors"
            >
              <ArrowLeft size={20} />
              Regresar
            </button>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="text-center ">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Crear cuenta
              </h1>
              <p className="text-gray-600">Únete y comienza a comprar</p>
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
                  Registrarse con Google
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
                  Registrarse con Apple
                </span>
              </button>
            </div> */}
            {/* <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  O crea tu cuenta con email
                </span>
              </div>
            </div> */}
            <div className="relative pt-5 pb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* CSRF Token - Hidden field */}
              <input
                type="hidden"
                name={getCSRFField().name}
                value={getCSRFField().value}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none transition-all duration-300"
                      placeholder="Nombre"
                    />
                    {validationErrors.firstName && (
                      <p className="text-red-600 text-xs mt-1">
                        {validationErrors.firstName}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:border-[#07D6AF] focus:ring-2 focus:ring-[#07D6AF]/20 outline-none transition-all duration-300"
                    placeholder="Apellido"
                  />
                  {validationErrors.lastName && (
                    <p className="text-red-600 text-xs mt-1">
                      {validationErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
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
                    placeholder="Crea una contraseña"
                  />
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
                  {validationErrors.password && (
                    <p className="text-red-600 text-xs mt-1">
                      {validationErrors.password}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-2xl focus:ring-2 focus:ring-[#07D6AF]/20 outline-none transition-all duration-300 ${
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-[#07D6AF]"
                    }`}
                    placeholder="Confirma tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
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
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      Las contraseñas no coinciden
                    </p>
                  )}
                {validationErrors.confirmPassword && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-[#07D6AF]"
                  />
                  <span className="text-sm text-gray-600">
                    Acepto los{" "}
                    <Link
                      href="/politicas/terminos-y-condiciones"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-secondary underline"
                    >
                      Términos de servicio
                    </Link>{" "}
                    y{" "}
                    <a
                      href="/politicas/politicas-de-privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-secondary underline"
                    >
                      Política de privacidad
                    </a>
                  </span>
                </label>
                {validationErrors.agreeToTerms && (
                  <p className="text-red-600 text-xs mt-1">
                    {validationErrors.agreeToTerms}
                  </p>
                )}
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="subscribeNewsletter"
                    checked={formData.subscribeNewsletter}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-gray-300 text-primary focus:ring-[#07D6AF]"
                  />
                  <span className="text-sm text-gray-600">
                    Suscribirme al newsletter
                  </span>
                </label>
              </div>
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-800 text-sm font-medium flex-1">
                    {errorMsg}
                  </p>
                </div>
              )}
              {successMsg && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-green-800 text-sm font-medium flex-1">
                    {successMsg}
                  </p>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading || !formData.agreeToTerms}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  isLoading || !formData.agreeToTerms
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:scale-105"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </form>
            <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <p className="text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="text-primary hover:text-secondary font-semibold transition-colors"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
          {/* <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Tus datos están protegidos con cifrado SSL de 256 bits
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
