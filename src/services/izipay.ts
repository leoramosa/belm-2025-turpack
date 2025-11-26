// services/izipay.ts - Servicio para integración con Izipay

export interface IzipayPaymentRequest {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  // 🆕 Datos del carrito para el IPN
  cartItems?: Array<{
    product_id: number;
    quantity: number;
    name: string;
    price: string;
    selectedAttributes?: Record<string, string>;
    variations?: Array<{
      id: number;
      attributes: Array<{
        id: number;
        option: string;
      }>;
    }>;
  }>;
  // 🆕 Información de envío para el IPN
  shippingInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    provincia: string;
  };
  // 🆕 URLs para el IPN y redirección
  ipnUrl?: string;
  returnUrl?: string;
  // 🆕 URLs específicas para Izipay
  successUrl?: string;
  errorUrl?: string;
  cancelUrl?: string;
}

export interface IzipayPaymentResponse {
  success: boolean;
  form_token?: string;
  public_key?: string;
  order_id?: number;
  message?: string;
  integration_type?: string;
  error?: string;
}

export interface IzipayValidationRequest {
  "kr-answer": string;
  "kr-hash": string;
}

export interface IzipayValidationResponse {
  success: boolean;
  valid?: boolean;
  message?: string;
  error?: string;
}

/**
 * Crear pago en Izipay y obtener formToken
 */
export async function createIzipayPayment(
  paymentData: IzipayPaymentRequest
): Promise<IzipayPaymentResponse> {
  try {
    const response = await fetch("/api/izipay/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al crear pago en Izipay:", error);
    throw new Error(
      `Error al crear pago: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Validar firma HMAC de Izipay
 */
export async function validateIzipaySignature(
  validationData: IzipayValidationRequest
): Promise<IzipayValidationResponse> {
  try {
    const response = await fetch("/api/izipay/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al validar firma Izipay:", error);
    throw new Error(
      `Error al validar firma: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Crear pago usando método de fallback (Mi Cuenta Web)
 */
export async function createIzipayPaymentFallback(paymentData: {
  amount: number;
  order_id?: number;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
}): Promise<{
  success: boolean;
  order_id: number;
  amount: number;
  payment_url: string;
  signature: string;
  message: string;
  method: string;
  mcw_url: string;
}> {
  try {
    const response = await fetch("/api/mcw/create-payment-fallback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al crear pago fallback:", error);
    throw new Error(
      `Error al crear pago fallback: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
