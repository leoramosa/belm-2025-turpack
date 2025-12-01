// Servicio para el sistema de newsletter con Resend
export interface NewsletterResponse {
  success: boolean;
  message: string;
  subscriber_id?: string;
}

export interface NewsletterError {
  error: string;
  message?: string;
  status?: number;
}

class NewsletterResendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_WORDPRESS_URL ||
      "";

    if (!this.baseUrl) {
      console.error(
        "NewsletterResendService: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_WORDPRESS_URL environment variable is not configured"
      );
    }
  }

  /**
   * Suscribirse al newsletter
   */
  async subscribe(email: string): Promise<NewsletterResponse> {
    if (!this.baseUrl) {
      throw new Error(
        "API URL not configured. Please set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_WORDPRESS_URL environment variable."
      );
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/wp-json/belm/v1/newsletter/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      if (!response.ok) {
        const errorData: NewsletterError = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al suscribirse"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      throw error;
    }
  }

  /**
   * Confirmar suscripción
   */
  async confirm(token: string, email: string): Promise<NewsletterResponse> {
    if (!this.baseUrl) {
      throw new Error(
        "API URL not configured. Please set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_WORDPRESS_URL environment variable."
      );
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/wp-json/belm/v1/newsletter/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            email,
          }),
        }
      );

      if (!response.ok) {
        const errorData: NewsletterError = await response.json();
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Error al confirmar suscripción"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error confirming subscription:", error);
      throw error;
    }
  }

  /**
   * Dar de baja del newsletter
   */
  async unsubscribe(email: string): Promise<NewsletterResponse> {
    if (!this.baseUrl) {
      throw new Error(
        "API URL not configured. Please set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_WORDPRESS_URL environment variable."
      );
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/wp-json/belm/v1/newsletter/unsubscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      if (!response.ok) {
        const errorData: NewsletterError = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error al dar de baja"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error unsubscribing from newsletter:", error);
      throw error;
    }
  }

  /**
   * Probar conexión con el sistema
   */
  async testConnection(): Promise<NewsletterResponse> {
    if (!this.baseUrl) {
      throw new Error(
        "API URL not configured. Please set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_WORDPRESS_URL environment variable."
      );
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/wp-json/belm/v1/newsletter/test`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData: NewsletterError = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Error de conexión"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error testing newsletter connection:", error);
      throw error;
    }
  }
}

export const newsletterResendService = new NewsletterResendService();
