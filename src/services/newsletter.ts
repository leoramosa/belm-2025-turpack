export interface NewsletterResponse {
  success: boolean;
  message?: string;
  customer_id?: number;
  error?: string;
}

export class NewsletterService {
  /**
   * Suscribir email al newsletter
   */
  static async subscribe(email: string): Promise<NewsletterResponse> {
    try {
      if (!email || !this.isValidEmail(email)) {
        return {
          success: false,
          error: "Email inválido",
        };
      }

      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      // Verificar si el mensaje indica que ya está registrado
      if (
        data.message &&
        (data.message.includes("Correo ya registrado") ||
          data.message.includes("Ya estás suscrito"))
      ) {
        return {
          success: true,
          message: data.message,
        };
      }

      // Verificar si el error indica que ya está registrado
      if (
        data.details &&
        (data.details.includes("Ya hay una cuenta registrada") ||
          data.details.includes("already exists") ||
          data.details.includes("email"))
      ) {
        return {
          success: true,
          message: "Correo ya registrado en nuestro newsletter",
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.details || "Error al suscribirse",
        };
      }

      return data;
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            success: false,
            error: "La solicitud tardó demasiado. Intenta nuevamente.",
          };
        }

        if (error.message.includes("fetch")) {
          return {
            success: false,
            error:
              "Error de conexión. Verifica tu internet e intenta nuevamente.",
          };
        }
      }

      return {
        success: false,
        error: "Error inesperado. Intenta nuevamente.",
      };
    }
  }

  /**
   * Validar formato de email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtener suscriptores del newsletter (solo para admin)
   */
  static async getSubscribers(): Promise<unknown[]> {
    try {
      const response = await fetch("/api/newsletter/subscribers");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      return [];
    }
  }
}
