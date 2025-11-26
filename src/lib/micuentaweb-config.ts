// Configuración para Mi Cuenta Web IPN
export const MCW_CONFIG = {
  // URLs de IPN
  IPN_URL: "/api/izipay/ipn",
  RETURN_URL: "/payment-result/success",

  // Estados de transacción según documentación de Mi Cuenta Web
  TRANSACTION_STATUS: {
    AUTHORISED: "AUTHORISED", // Transacción autorizada
    CAPTURED: "CAPTURED", // Transacción capturada
    PENDING: "PENDING", // Transacción pendiente
    FAILED: "FAILED", // Transacción fallida
    CANCELLED: "CANCELLED", // Transacción cancelada
    REFUNDED: "REFUNDED", // Transacción reembolsada
  },

  // Estados de WooCommerce correspondientes
  WC_STATUS_MAPPING: {
    AUTHORISED: "on-hold", // Autorizado pero no capturado
    CAPTURED: "processing", // Pagado y procesando
    PENDING: "on-hold", // Pendiente
    FAILED: "failed", // Fallido
    CANCELLED: "cancelled", // Cancelado
    REFUNDED: "refunded", // Reembolsado
  },

  // Campos requeridos para el IPN
  REQUIRED_FIELDS: [
    "kr_answer",
    "kr_hash",
    "kr_transaction_id",
    "kr_amount",
    "kr_status",
  ],

  // Campos opcionales pero útiles
  OPTIONAL_FIELDS: [
    "kr_order_id",
    "kr_customer_email",
    "kr_customer_name",
    "kr_cart_items",
    "kr_shipping_info",
  ],
};

// Función para validar si un estado de transacción es exitoso
export function isSuccessfulTransaction(status: string): boolean {
  return (
    status === MCW_CONFIG.TRANSACTION_STATUS.AUTHORISED ||
    status === MCW_CONFIG.TRANSACTION_STATUS.CAPTURED
  );
}

// Función para mapear estado de Mi Cuenta Web a WooCommerce
export function mapMCWStatusToWC(mcwStatus: string): string {
  return (
    MCW_CONFIG.WC_STATUS_MAPPING[
      mcwStatus as keyof typeof MCW_CONFIG.WC_STATUS_MAPPING
    ] || "on-hold"
  );
}

// Función para validar campos requeridos del IPN
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateIPNFields(body: any): {
  valid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  MCW_CONFIG.REQUIRED_FIELDS.forEach((field) => {
    if (!body[field]) {
      missingFields.push(field);
    }
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
