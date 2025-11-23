"use client";

import { IOrder } from "@/interface/IOrder";

// Helper para obtener credenciales del cliente (usando variables de entorno públicas)
const getClientWordpressConfig = () => {
  const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  const consumerKey = process.env.NEXT_PUBLIC_WORDPRESS_WC_CONSUMER_KEY;
  const consumerSecret = process.env.NEXT_PUBLIC_WORDPRESS_WC_CONSUMER_SECRET;

  if (!apiUrl || !consumerKey || !consumerSecret) {
    throw new Error(
      "Las credenciales de WordPress no están configuradas para el cliente"
    );
  }

  // Crear header de Basic Auth
  const credentials = `${consumerKey}:${consumerSecret}`;
  const encoded = btoa(credentials);
  const authHeader = `Basic ${encoded}`;

  return { apiUrl, authHeader };
};

export const fetchOrdersByCustomerId = async (
  customerId: number
): Promise<IOrder[]> => {
  try {
    const { apiUrl, authHeader } = getClientWordpressConfig();
    const url = `${apiUrl}/wp-json/wc/v3/orders?customer=${customerId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const orders = await response.json();
    return Array.isArray(orders) ? orders : [];
  } catch {
    throw new Error("No se pudieron obtener las órdenes del usuario.");
  }
};

export const fetchOrderById = async (
  orderId: number,
  customerId?: number,
  customerEmail?: string
): Promise<IOrder> => {
  try {
    const { apiUrl, authHeader } = getClientWordpressConfig();
    const url = `${apiUrl}/wp-json/wc/v3/orders/${orderId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 404) {
        throw new Error("No tienes permisos para ver esta orden.");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const order = await response.json();

    // Validación de propiedad de la orden (igual que en la ruta API)
    if (customerId || customerEmail) {
      const orderCustomerId = order.customer_id;
      const orderEmail = order.billing?.email;

      const isOwner =
        (customerId && orderCustomerId === parseInt(customerId.toString())) ||
        (customerEmail && orderEmail === customerEmail);

      if (!isOwner) {
        throw new Error("No tienes permisos para ver esta orden.");
      }
    }

    return order;
  } catch (error) {
    if (error instanceof Error && error.message.includes("permisos")) {
      throw error; // Re-lanzar error de permisos
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
    const { apiUrl, authHeader } = getClientWordpressConfig();

    // Intentar obtener órdenes por customerId primero
    let ordersByCustomer: IOrder[] = [];
    try {
      const byIdUrl = `${apiUrl}/wp-json/wc/v3/orders?customer=${customerId}`;
      const byIdRes = await fetch(byIdUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      if (byIdRes.ok) {
        const data = await byIdRes.json();
        ordersByCustomer = Array.isArray(data) ? data : [];
      }
    } catch {
      // Error silencioso
    }

    // Intentar obtener órdenes por email
    let ordersByEmail: IOrder[] = [];
    try {
      const byEmailUrl = `${apiUrl}/wp-json/wc/v3/orders?billing_email=${encodeURIComponent(
        email
      )}&per_page=100`;
      const byEmailRes = await fetch(byEmailUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      if (byEmailRes.ok) {
        const data = await byEmailRes.json();
        ordersByEmail = Array.isArray(data) ? data : [];
      }
    } catch {
      // Error silencioso
    }

    // Filtrar pedidos por email - si el email coincide, es válido (incluso si customer_id es 0)
    const validOrdersByEmail = ordersByEmail.filter((order) => {
      const emailMatches = order.billing?.email === email;
      return emailMatches;
    });

    // Combinar y eliminar duplicados por id
    const allOrders = [...ordersByCustomer, ...validOrdersByEmail].filter(
      (order, index, self) => index === self.findIndex((o) => o.id === order.id)
    );

    return allOrders;
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
    const { apiUrl, authHeader } = getClientWordpressConfig();

    // Intentar obtener órdenes por customerId primero
    let ordersByCustomer: IOrder[] = [];
    try {
      const byIdUrl = `${apiUrl}/wp-json/wc/v3/orders?customer=${customerId}`;
      const byIdRes = await fetch(byIdUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      if (byIdRes.ok) {
        const data = await byIdRes.json();
        ordersByCustomer = Array.isArray(data) ? data : [];
      }
    } catch {
      // Error silencioso
    }

    // Intentar obtener órdenes por email
    let ordersByEmail: IOrder[] = [];
    try {
      const byEmailUrl = `${apiUrl}/wp-json/wc/v3/orders?billing_email=${encodeURIComponent(
        email
      )}&per_page=100`;
      const byEmailRes = await fetch(byEmailUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      if (byEmailRes.ok) {
        const data = await byEmailRes.json();
        ordersByEmail = Array.isArray(data) ? data : [];
      }
    } catch {
      // Error silencioso
    }

    // Filtrar pedidos por email - si el email coincide, es válido (incluso si customer_id es 0)
    const validOrdersByEmail = ordersByEmail.filter((order) => {
      const emailMatches = order.billing?.email === email;
      return emailMatches;
    });

    // Si no hay órdenes de ninguna fuente, devolver 0
    if (ordersByCustomer.length === 0 && validOrdersByEmail.length === 0) {
      return 0;
    }

    // Combinar y eliminar duplicados por id
    const allOrders = [...ordersByCustomer, ...validOrdersByEmail].filter(
      (order, index, self) => index === self.findIndex((o) => o.id === order.id)
    );

    return allOrders.length;
  } catch {
    // En caso de error, devolver 0 en lugar de lanzar excepción
    return 0;
  }
};
