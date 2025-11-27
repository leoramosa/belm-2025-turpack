export async function loginUser(email: string, password: string) {
  try {
    // Usar API interna de login
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const res = await response.json();

    // Verificar si hay error en la respuesta
    if (res.error) {
      throw new Error(res.error);
    }

    // Verificar si hay token en la respuesta
    if (!res.token) {
      throw new Error("Credenciales inválidas");
    }

    // Devolver el token en la estructura esperada por el frontend
    return {
      token: res.token,
      user_email: res.user_email || email,
      user_login: res.user_login,
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
