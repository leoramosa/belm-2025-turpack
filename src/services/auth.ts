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

      // Manejar respuesta no exitosa del JWT
      if (!jwtResponse.ok) {
        let errorMessage =
          "Las credenciales ingresadas son incorrectas. Por favor, verifica tu email y contraseña.";

        try {
          const errorData = await jwtResponse.json();
          const errorText = (
            errorData.message ||
            errorData.data?.message ||
            ""
          ).toLowerCase();

          // Log para debug (puedes removerlo después)
          console.log("🔍 JWT Error Response:", {
            status: jwtResponse.status,
            errorText,
            fullError: errorData,
          });

          // Detectar errores de CONTRASEÑA incorrecta
          if (
            errorText.includes("incorrect password") ||
            errorText.includes("contraseña incorrecta") ||
            errorText.includes("wrong password") ||
            errorText.includes("password is incorrect") ||
            errorText.includes("invalid password") ||
            errorText.includes("incorrect_password") ||
            errorText.includes("password incorrect") ||
            (errorText.includes("password") &&
              errorText.includes("incorrect")) ||
            (errorText.includes("password") && errorText.includes("wrong"))
          ) {
            errorMessage =
              "La contraseña que ingresaste es incorrecta. Por favor, verifica e intenta nuevamente.";
          }
          // Detectar errores de EMAIL/USUARIO no encontrado
          else if (
            errorText.includes("invalid username") ||
            errorText.includes("usuario no encontrado") ||
            errorText.includes("user not found") ||
            errorText.includes("unknown email") ||
            errorText.includes("invalid_email") ||
            errorText.includes("username does not exist") ||
            errorText.includes("email does not exist") ||
            errorText.includes("user does not exist") ||
            errorText.includes("invalid_username") ||
            errorText.includes("unknown_user") ||
            (errorText.includes("username") && errorText.includes("invalid")) ||
            (errorText.includes("email") && errorText.includes("not found")) ||
            (errorText.includes("user") && errorText.includes("not exist"))
          ) {
            errorMessage =
              "No encontramos una cuenta con este email. Verifica que esté escrito correctamente.";
          }
          // Si hay un mensaje pero no coincide con ningún patrón, traducirlo si está en inglés
          else if (errorText) {
            // Intentar traducir mensajes comunes en inglés
            if (
              errorText.includes("authentication failed") ||
              errorText.includes("invalid credentials") ||
              errorText.includes("incorrect credentials")
            ) {
              errorMessage =
                "Las credenciales ingresadas son incorrectas. Por favor, verifica tu email y contraseña.";
            } else {
              // Si el mensaje está en inglés, usar uno genérico en español
              errorMessage =
                "Las credenciales ingresadas son incorrectas. Por favor, verifica tu email y contraseña.";
            }
          }
        } catch {
          // Si no se puede parsear, usar mensaje genérico según el código de estado
          if (jwtResponse.status === 403) {
            errorMessage =
              "Tu cuenta ha sido bloqueada. Por favor, contacta con soporte.";
          } else if (jwtResponse.status === 401) {
            errorMessage =
              "Las credenciales ingresadas son incorrectas. Por favor, verifica tu email y contraseña.";
          }
        }

        throw new Error(errorMessage);
      }

      const jwtData = await jwtResponse.json();

      // Verificar si hay error en la respuesta (aunque status sea 200)
      if (jwtData.error || jwtData.code) {
        const errorMessage = (
          jwtData.message ||
          jwtData.data?.message ||
          ""
        ).toLowerCase();

        // Log para debug
        console.log("🔍 JWT Data Error:", {
          error: jwtData.error,
          code: jwtData.code,
          message: errorMessage,
          fullData: jwtData,
        });

        // Detectar errores de CONTRASEÑA incorrecta
        if (
          errorMessage.includes("incorrect password") ||
          errorMessage.includes("contraseña incorrecta") ||
          errorMessage.includes("wrong password") ||
          errorMessage.includes("password is incorrect") ||
          errorMessage.includes("invalid password") ||
          errorMessage.includes("incorrect_password") ||
          errorMessage.includes("password incorrect") ||
          (errorMessage.includes("password") &&
            errorMessage.includes("incorrect")) ||
          (errorMessage.includes("password") && errorMessage.includes("wrong"))
        ) {
          throw new Error(
            "La contraseña que ingresaste es incorrecta. Por favor, verifica e intenta nuevamente."
          );
        }
        // Detectar errores de EMAIL/USUARIO no encontrado
        if (
          errorMessage.includes("invalid username") ||
          errorMessage.includes("usuario no encontrado") ||
          errorMessage.includes("user not found") ||
          errorMessage.includes("unknown email") ||
          errorMessage.includes("invalid_email") ||
          errorMessage.includes("username does not exist") ||
          errorMessage.includes("email does not exist") ||
          errorMessage.includes("user does not exist") ||
          errorMessage.includes("invalid_username") ||
          errorMessage.includes("unknown_user") ||
          (errorMessage.includes("username") &&
            errorMessage.includes("invalid")) ||
          (errorMessage.includes("email") &&
            errorMessage.includes("not found")) ||
          (errorMessage.includes("user") && errorMessage.includes("not exist"))
        ) {
          throw new Error(
            "No encontramos una cuenta con este email. Verifica que esté escrito correctamente."
          );
        }
        // Mensaje genérico en español si no se puede identificar el tipo de error
        throw new Error(
          "Las credenciales ingresadas son incorrectas. Por favor, verifica tu email y contraseña."
        );
      }

      // Verificar si hay token en la respuesta
      if (!jwtData.token) {
        throw new Error(
          "Las credenciales ingresadas son incorrectas. Por favor, verifica tu email y contraseña."
        );
      }

      return {
        token: jwtData.token,
        user_email: jwtData.user_email || email,
        user_login: jwtData.user_login || jwtData.user_nicename,
        user_display_name: jwtData.user_display_name,
      };
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
      const errorText = (
        errorData.message ||
        errorData.data?.message ||
        ""
      ).toLowerCase();

      // Log para debug
      console.log("🔍 Simple JWT Error Response:", {
        status: simpleJwtResponse.status,
        errorText,
        fullError: errorData,
      });

      // Mensajes más amigables según el tipo de error y código de estado
      if (
        simpleJwtResponse.status === 400 ||
        simpleJwtResponse.status === 401
      ) {
        // Detectar errores de CONTRASEÑA incorrecta
        if (
          errorText.includes("incorrect password") ||
          errorText.includes("contraseña incorrecta") ||
          errorText.includes("wrong password") ||
          errorText.includes("password is incorrect") ||
          errorText.includes("invalid password") ||
          errorText.includes("incorrect_password") ||
          errorText.includes("password incorrect") ||
          (errorText.includes("password") && errorText.includes("incorrect")) ||
          (errorText.includes("password") && errorText.includes("wrong"))
        ) {
          throw new Error(
            "La contraseña que ingresaste es incorrecta. Por favor, verifica e intenta nuevamente."
          );
        }
        // Detectar errores de EMAIL/USUARIO no encontrado
        if (
          errorText.includes("invalid username") ||
          errorText.includes("usuario no encontrado") ||
          errorText.includes("user not found") ||
          errorText.includes("unknown email") ||
          errorText.includes("invalid_email") ||
          errorText.includes("username does not exist") ||
          errorText.includes("email does not exist") ||
          errorText.includes("user does not exist") ||
          errorText.includes("invalid_username") ||
          errorText.includes("unknown_user") ||
          (errorText.includes("username") && errorText.includes("invalid")) ||
          (errorText.includes("email") && errorText.includes("not found")) ||
          (errorText.includes("user") && errorText.includes("not exist"))
        ) {
          throw new Error(
            "No encontramos una cuenta con este email. Verifica que esté escrito correctamente."
          );
        }
        // Mensaje genérico en español
        throw new Error(
          "Las credenciales ingresadas son incorrectas. Por favor, verifica tu email y contraseña."
        );
      }

      if (simpleJwtResponse.status === 403) {
        throw new Error(
          "Tu cuenta ha sido bloqueada. Por favor, contacta con soporte."
        );
      }

      // Mensaje genérico en español
      throw new Error(
        "Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente."
      );
    }

    const simpleJwtData = await simpleJwtResponse.json();

    if (!simpleJwtData.success || !simpleJwtData.data?.jwt) {
      throw new Error(
        "Las credenciales ingresadas son incorrectas. Por favor, verifica tu email y contraseña."
      );
    }

    return {
      token: simpleJwtData.data.jwt,
      user_email: simpleJwtData.data.user_email,
      user_login: simpleJwtData.data.user_login,
      user_display_name: simpleJwtData.data.user_display_name,
    };
  } catch (error: unknown) {
    // Si el error ya tiene un mensaje amigable, re-lanzarlo
    if (error instanceof Error) {
      throw error;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
      const errorMessage = (error as { message?: string }).message;
      // Si el mensaje ya es amigable, usarlo; si no, usar uno genérico
      if (errorMessage && !errorMessage.includes("Error de autenticación:")) {
        throw new Error(errorMessage);
      }
    }
    throw new Error(
      "Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente."
    );
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
      let errorMessage =
        "Ocurrió un error al crear tu cuenta. Por favor, intenta nuevamente.";

      try {
        const errorData = await response.json();

        // Log para debug (puedes removerlo después)
        console.log("🔍 Frontend Registration Error:", {
          status: response.status,
          errorData,
          fullError: JSON.stringify(errorData),
        });

        // El error ya viene con un mensaje amigable desde la API
        // El backend devuelve { error: "mensaje" } en el catch
        // Priorizar el mensaje del backend si está disponible
        if (errorData.error) {
          // Usar el mensaje de error de la API (ya viene traducido y amigable)
          errorMessage = errorData.error;
        } else if (response.status === 409) {
          errorMessage =
            "Ya existe una cuenta con este email. Por favor, usa otro email o intenta iniciar sesión si ya tienes una cuenta.";
        } else if (response.status === 400) {
          errorMessage =
            "Los datos ingresados no son válidos. Por favor, verifica todos los campos.";
        }
      } catch (parseError) {
        // Si no se puede parsear, usar mensaje según el código de estado
        console.error("Error parsing registration error:", parseError);
        if (response.status === 409) {
          errorMessage =
            "Ya existe una cuenta con este email. Por favor, usa otro email o intenta iniciar sesión si ya tienes una cuenta.";
        } else if (response.status === 400) {
          errorMessage =
            "Los datos ingresados no son válidos. Por favor, verifica todos los campos.";
        }
      }

      throw new Error(errorMessage);
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
