"use client";

// Helper para obtener configuración del cliente
const getClientWordpressConfig = () => {
  const apiUrl =
    process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "La URL de la API de WordPress no está configurada para el cliente"
    );
  }

  return { apiUrl };
};

/**
 * Iniciar sesión con email/username y password
 * Llama directamente al backend de WordPress usando JWT Auth
 */
export async function loginUser(email: string, password: string) {
  try {
    const { apiUrl } = getClientWordpressConfig();

    // Usar email o username para la autenticación
    const loginIdentifier = email;

    // Intentar con JWT Auth primero
    try {
      const jwtResponse = await fetch(`${apiUrl}/wp-json/jwt-auth/v1/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: loginIdentifier, password }),
        cache: "no-store",
      });

      if (jwtResponse.ok) {
        const jwtData = await jwtResponse.json();

        // Verificar si hay error en la respuesta
        if (jwtData.error || jwtData.code) {
          throw new Error(jwtData.message || "Credenciales inválidas");
        }

        // Verificar si hay token en la respuesta
        if (!jwtData.token) {
          throw new Error("Credenciales inválidas");
        }

        return {
          token: jwtData.token,
          user_email: jwtData.user_email || email,
          user_login: jwtData.user_login || jwtData.user_nicename,
          user_display_name: jwtData.user_display_name,
        };
      }
    } catch (jwtError) {
      console.log("JWT Auth failed, trying Simple JWT Login");
    }

    // Fallback a Simple JWT Login
    const simpleJwtResponse = await fetch(
      `${apiUrl}/?rest_route=/jwt-auth/v1/token/auth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: loginIdentifier, password }),
        cache: "no-store",
      }
    );

    if (!simpleJwtResponse.ok) {
      const errorData = await simpleJwtResponse.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error de autenticación: ${simpleJwtResponse.status}`
      );
    }

    const simpleJwtData = await simpleJwtResponse.json();

    if (!simpleJwtData.success || !simpleJwtData.data?.jwt) {
      throw new Error("Credenciales inválidas");
    }

    return {
      token: simpleJwtData.data.jwt,
      user_email: simpleJwtData.data.user_email,
      user_login: simpleJwtData.data.user_login,
      user_display_name: simpleJwtData.data.user_display_name,
    };
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "message" in error) {
      throw new Error(
        (error as { message?: string }).message || "Error al iniciar sesión"
      );
    }
    throw new Error("Error al iniciar sesión");
  }
}

/**
 * Registrar un nuevo cliente
 * Mantiene la llamada a la API porque requiere OAuth (credenciales del servidor)
 */
export async function registerCustomer({
  email,
  password,
  first_name,
  last_name,
  username,
}: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}) {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        first_name,
        last_name,
        username: username || email,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error al registrar: ${response.status}`
      );
    }

    const res = await response.json();
    return res;
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "message" in error) {
      throw new Error(
        (error as { message?: string }).message ||
          "No se pudo registrar el cliente. Verifica los datos o si el usuario ya existe."
      );
    }
    throw new Error(
      "No se pudo registrar el cliente. Verifica los datos o si el usuario ya existe."
    );
  }
}

/**
 * Solicitar recuperación de contraseña
 * Llama directamente al backend de WordPress
 */
export async function requestPasswordReset(user_login: string) {
  try {
    const { apiUrl } = getClientWordpressConfig();

    if (!user_login) {
      throw new Error("El email o nombre de usuario es requerido");
    }

    const response = await fetch(
      `${apiUrl}/wp-json/wp/v2/users/lost-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_login: user_login.trim(),
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WordPress API error:", response.status, errorText);
      throw new Error(
        "No se pudo procesar la solicitud de recuperación de contraseña"
      );
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "message" in error) {
      throw error;
    }
    throw new Error("Error al solicitar recuperación de contraseña");
  }
}

/**
 * Restablecer contraseña con key de reset
 * Llama directamente al backend de WordPress
 */
export async function resetPassword({
  key,
  login,
  password,
}: {
  key: string;
  login: string;
  password: string;
}) {
  try {
    const { apiUrl } = getClientWordpressConfig();

    if (!key || !login || !password) {
      throw new Error("key, login y password son requeridos");
    }

    const response = await fetch(
      `${apiUrl}/wp-json/wp/v2/users/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: key,
          login: login,
          password: password.trim(),
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WordPress API error:", response.status, errorText);
      throw new Error("No se pudo restablecer la contraseña");
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "message" in error) {
      throw error;
    }
    throw new Error("Error al restablecer la contraseña");
  }
}
