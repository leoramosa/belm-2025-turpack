/* eslint-disable @typescript-eslint/no-unused-vars */

// Buscar cliente WooCommerce por email
export const getCustomerIdByEmail = async (
  email: string
): Promise<number | null> => {
  try {
    const response = await fetch(
      `/api/customers?email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].id;
    }
    throw new Error(
      `[DEBUG] Cliente WooCommerce no encontrado. Resultado crudo: "${JSON.stringify(
        data
      )}"`
    );
  } catch (error) {
    return null;
  }
};

// Crear cliente en WooCommerce si no existe
export const createCustomerInWooCommerce = async (
  email: string
): Promise<number> => {
  try {
    const customerData = {
      email: email,
      first_name: "Usuario",
      last_name: "Cliente",
      username: email,
      billing: {
        first_name: "Usuario",
        last_name: "Cliente",
        email: email,
      },
      shipping: {
        first_name: "Usuario",
        last_name: "Cliente",
      },
    };

    const response = await fetch("/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    throw error;
  }
};

export const fetchUserAccountData = async (email: string) => {
  try {
    // Intentar buscar el cliente por email
    let userId = await getCustomerIdByEmail(email);

    // Si no existe el cliente en WooCommerce, crearlo
    if (!userId) {
      try {
        userId = await createCustomerInWooCommerce(email);
      } catch (error) {
        throw new Error(
          `No se pudo crear el cliente en WooCommerce. Error: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      }
    }

    // Obtener datos del cliente
    const response = await fetch(`/api/customers/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const customerData = await response.json();

    // Verificar que customerData no sea null
    if (!customerData) {
      throw new Error("Los datos del cliente están vacíos");
    }

    // Crear datos por defecto si no existen
    const defaultData = {
      id: customerData.id || userId,
      email: customerData.email || email,
      first_name:
        customerData.first_name ||
        customerData.billing?.first_name ||
        "Usuario",
      last_name:
        customerData.last_name || customerData.billing?.last_name || "Cliente",
      username: customerData.username || email,
      billing: customerData.billing || {
        first_name: "Usuario",
        last_name: "Cliente",
        email: email,
        address_1: "",
        city: "",
        state: "",
        postcode: "",
        country: "PE",
        phone: "",
      },
      shipping: customerData.shipping || {
        first_name: "Usuario",
        last_name: "Cliente",
        address_1: "",
        city: "",
        state: "",
        postcode: "",
        country: "PE",
      },
    };

    return defaultData;
  } catch (error) {
    throw new Error(
      `No se pudo obtener los datos del cliente. Error: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};

// Definir el tipo WooAddress para evitar 'any'
export interface WooAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  company?: string;
  phone?: string;
  id?: string | number;
  isDefault?: boolean;
}

// Actualizar datos del cliente WooCommerce (nombre, apellido, email, billing, shipping)
export const updateCustomerData = async (
  userId: number,
  data: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    billing: Partial<WooAddress>;
    shipping: Partial<WooAddress>;
  }>
) => {
  try {
    const response = await fetch(`/api/customers/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error("No se pudo actualizar el perfil o dirección.");
  }
};

// Actualizar solo dirección de facturación
export const updateCustomerBilling = async (
  userId: number,
  billing: Partial<WooAddress>
) => {
  return updateCustomerData(userId, { billing });
};

// Actualizar solo dirección de envío
export const updateCustomerShipping = async (
  userId: number,
  shipping: Partial<WooAddress>
) => {
  return updateCustomerData(userId, { shipping });
};

// Cambiar contraseña del usuario WordPress
export const changeUserPassword = async (
  userId: number,
  newPassword: string,
  jwtToken: string
) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error("API URL not configured");
    }

    const response = await fetch(`${apiUrl}/wp-json/wp/v2/users/${userId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error("No se pudo cambiar la contraseña.");
  }
};
