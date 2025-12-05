import { z } from "zod";

// Esquema de validación para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Formato de email inválido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Esquema de validación para registro
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre no puede exceder 50 caracteres"),
    lastName: z
      .string()
      .min(1, "El apellido es requerido")
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(50, "El apellido no puede exceder 50 caracteres"),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Formato de email inválido"),
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número"
      ),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    agreeToTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "Debes aceptar los términos y condiciones"
      ),
    subscribeNewsletter: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Esquema de validación para información de envío
export const shippingSchema = z.object({
  firstName: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  lastName: z
    .string()
    .min(1, "El apellido es requerido")
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres"),
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Formato de email inválido"),
  phone: z
    .string()
    .min(1, "El teléfono es requerido")
    .regex(/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido"),
  address: z
    .string()
    .min(1, "La dirección es requerida")
    .min(5, "La dirección debe tener al menos 10 caracteres"),
  apartment: z.string().optional(),
  city: z.string().min(1, "La ciudad es requerida"),
  state: z.string().min(1, "La provincia es requerida"),
  zipCode: z
    .string()
    .min(1, "El código postal es requerido")
    .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;

// Esquema de validación para búsqueda
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, "El término de búsqueda es requerido")
    .min(2, "El término de búsqueda debe tener al menos 2 caracteres")
    .max(100, "El término de búsqueda no puede exceder 100 caracteres"),
});

export type SearchFormData = z.infer<typeof searchSchema>;

// Esquema de validación para checkout completo
export const checkoutSchema = z.object({
  // Información personal
  firstName: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  lastName: z
    .string()
    .min(1, "El apellido es requerido")
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres"),
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Formato de email inválido"),
  phone: z
    .string()
    .min(1, "El teléfono es requerido")
    .regex(/^\+?[\d\s\-\(\)]+$/, "Formato de teléfono inválido"),

  // Dirección de envío
  address: z
    .string()
    .min(1, "La dirección es requerida")
    .min(5, "La dirección debe tener al menos 10 caracteres"),
  apartment: z.string().optional(),
  city: z.string().min(1, "La ciudad es requerida"),
  state: z.string().min(1, "La provincia es requerida"),
  zipCode: z
    .string()
    .min(1, "El código postal es requerido")
    .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),

  // Método de envío
  shippingMethod: z.string().min(1, "Selecciona un método de envío"),

  // Método de pago
  paymentMethod: z.string().min(1, "Selecciona un método de pago"),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Función helper para sanitizar strings
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, "") // Remover < y >
    .replace(/javascript:/gi, "") // Remover javascript:
    .replace(/on\w+=/gi, ""); // Remover event handlers
};

// Función helper para validar y sanitizar email
export const validateAndSanitizeEmail = (email: string): string => {
  const sanitized = sanitizeString(email).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    throw new Error("Formato de email inválido");
  }

  return sanitized;
};

// Función helper para validar y sanitizar teléfono
export const validateAndSanitizePhone = (phone: string): string => {
  const sanitized = sanitizeString(phone);
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;

  if (!phoneRegex.test(sanitized)) {
    throw new Error("Formato de teléfono inválido");
  }

  return sanitized;
};
