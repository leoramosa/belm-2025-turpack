const WORDPRESS_API_URL = process.env.WORDPRESS_HEADLESS_BASE_URL;
const WORDPRESS_WC_CONSUMER_KEY = process.env.WORDPRESS_WC_CONSUMER_KEY;
const WORDPRESS_WC_CONSUMER_SECRET = process.env.WORDPRESS_WC_CONSUMER_SECRET;
const WORDPRESS_DEFAULT_CURRENCY =
  process.env.WORDPRESS_DEFAULT_CURRENCY ?? "PEN";

function assertEnv(value: string | undefined, message: string): string {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

export function getWordpressApiUrl(): string {
  return assertEnv(
    WORDPRESS_API_URL,
    "WORDPRESS_HEADLESS_BASE_URL no está definido. Añade la URL base (sin namespace) en tu archivo de entorno."
  );
}

export function getWordpressConsumerKey(): string {
  return assertEnv(
    WORDPRESS_WC_CONSUMER_KEY,
    "WORDPRESS_WC_CONSUMER_KEY no está definido. Añade la clave de consumidor de WooCommerce en tu archivo de entorno."
  );
}

export function getWordpressConsumerSecret(): string {
  return assertEnv(
    WORDPRESS_WC_CONSUMER_SECRET,
    "WORDPRESS_WC_CONSUMER_SECRET no está definido. Añade el secreto de WooCommerce en tu archivo de entorno."
  );
}

export function getDefaultCurrency(): string {
  return WORDPRESS_DEFAULT_CURRENCY;
}

export function buildBasicAuthHeader(key: string, secret: string): string {
  const credentials = `${key}:${secret}`;
  let encoded: string;
  if (typeof Buffer !== "undefined") {
    encoded = Buffer.from(credentials).toString("base64");
  } else if (typeof btoa !== "undefined") {
    encoded = btoa(credentials);
  } else {
    throw new Error(
      "El runtime no soporta codificación Base64 para Basic Auth."
    );
  }
  return `Basic ${encoded}`;
}
