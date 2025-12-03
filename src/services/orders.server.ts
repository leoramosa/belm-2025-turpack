import "server-only";
import { IOrder } from "@/interface/IOrder";
import {
  getWordpressApiUrl,
  getWordpressConsumerKey,
  getWordpressConsumerSecret,
  buildBasicAuthHeader,
} from "@/services/wordpress";

/**
 * Función server-side para obtener una orden por ID
 * Usada para generar metadata en páginas del servidor
 */
export async function fetchOrderByIdServer(
  orderId: number
): Promise<IOrder | null> {
  try {
    const apiUrl = getWordpressApiUrl();
    const consumerKey = getWordpressConsumerKey();
    const consumerSecret = getWordpressConsumerSecret();

    const url = `${apiUrl}/wp-json/wc/v3/orders/${orderId}`;
    const authHeader = buildBasicAuthHeader(consumerKey, consumerSecret);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      // Para otros errores, retornar null en lugar de lanzar error
      // ya que esto es para metadata y no queremos bloquear la página
      return null;
    }

    const order = await response.json();
    return order as IOrder;
  } catch (error) {
    console.error("Error fetching order for metadata:", error);
    // Retornar null en lugar de lanzar error para no bloquear la página
    return null;
  }
}
