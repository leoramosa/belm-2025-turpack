"use client";

import { IOrder } from "@/interface/IOrder";

export const fetchOrdersByCustomerId = async (
  customerId: number
): Promise<IOrder[]> => {
  try {
    // Usar la ruta API en lugar de llamar directamente a WordPress
    const url = `/api/orders?customer=${customerId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error del servidor: ${response.status}`
      );
    }

    const orders = await response.json();
    return Array.isArray(orders) ? orders : [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("No se pudieron obtener las órdenes del usuario.");
  }
};

export const fetchOrderById = async (
  orderId: number,
  customerId?: number,
  customerEmail?: string
): Promise<IOrder> => {
  try {
    // Usar la ruta API en lugar de llamar directamente a WordPress
    const url = `/api/orders/${orderId}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Agregar headers de validación si se proporcionan
    if (customerId) {
      headers["x-customer-id"] = customerId.toString();
    }
    if (customerEmail) {
      headers["x-customer-email"] = customerEmail;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Error desconocido",
      }));

      if (response.status === 403 || response.status === 404) {
        throw new Error(
          errorData.error ||
            "No se encontró la orden o no tienes permisos para verla"
        );
      }
      throw new Error(
        errorData.error || `Error del servidor: ${response.status}`
      );
    }

    const order = await response.json();
    return order;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Re-lanzar error con mensaje específico
    }
    throw new Error("No se pudo obtener el detalle de la orden.");
  }
};

// Esta función necesita OAuth para crear órdenes, así que se mantiene como server-only
// Se puede usar server action o mantener una ruta API mínima solo para creación
export const createOrder = async (
  orderPayload: Record<string, string | number | boolean | object | undefined>
) => {
  try {
    // Para crear órdenes se necesita OAuth, así que por ahora mantenemos la ruta API
    // TODO: Mover a server action con OAuth
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error del servidor: ${response.status} - ${
          errorData.message || "Error desconocido"
        }`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("tardó demasiado")) {
        throw new Error("La petición tardó demasiado tiempo");
      }
      if (error.message.includes("conexión")) {
        throw new Error(
          "No se recibió respuesta del servidor. Verifica la conexión."
        );
      }
      throw error; // Re-lanzar error con mensaje específico
    }

    throw new Error("No se pudo crear la orden. Intenta de nuevo.");
  }
};

export const fetchOrdersForUser = async (
  customerId: number,
  email: string
): Promise<IOrder[]> => {
  try {
    // Usar la ruta API en lugar de llamar directamente a WordPress
    const url = `/api/orders?customer=${customerId}&email=${encodeURIComponent(
      email
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // En caso de error, devolver array vacío en lugar de lanzar excepción
      return [];
    }

    const orders = await response.json();
    return Array.isArray(orders) ? orders : [];
  } catch {
    // En caso de error, devolver array vacío en lugar de lanzar excepción
    return [];
  }
};

export const fetchOrdersCountForUser = async (
  customerId: number,
  email: string
): Promise<number> => {
  try {
    // Usar fetchOrdersForUser y obtener la longitud
    const orders = await fetchOrdersForUser(customerId, email);
    return orders.length;
  } catch {
    // En caso de error, devolver 0 en lugar de lanzar excepción
    return 0;
  }
};
