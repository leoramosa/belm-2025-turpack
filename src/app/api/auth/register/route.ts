import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";

// Interfaces para manejar errores de WooCommerce
interface WooCommerceError {
  code?: string;
  message?: string;
  data?:
    | {
        status?: number;
        message?: string;
        error?: string;
      }
    | WooCommerceError[];
}

interface WooCommerceErrorResponse {
  code?: string;
  message?: string;
  error?: string;
  data?:
    | {
        status?: number;
        message?: string;
        error?: string;
      }
    | WooCommerceError[];
}

type ErrorData =
  | WooCommerceErrorResponse
  | WooCommerceError[]
  | string
  | Record<string, unknown>;

export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name, username } =
      await request.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!apiUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: "WooCommerce credentials not configured" },
        { status: 500 }
      );
    }

    // Generar OAuth signature
    const generateOAuthSignature = (
      url: string,
      method: string = "POST",
      params: Record<string, string | number> = {}
    ) => {
      const nonce = Math.random().toString(36).substring(2);
      const timestamp = Math.floor(Date.now() / 1000);
      const oauthParams: Record<string, string | number> = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: timestamp,
        oauth_version: "1.0",
      };
      const allParams = { ...oauthParams, ...params };
      const paramString = Object.keys(allParams)
        .sort()
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(
              allParams[key] as string
            )}`
        )
        .join("&");
      const baseUrl = url.split("?")[0];
      const baseString = `${method.toUpperCase()}&${encodeURIComponent(
        baseUrl
      )}&${encodeURIComponent(paramString)}`;
      const signingKey = `${encodeURIComponent(consumerSecret)}&`;
      const signature = CryptoJS.HmacSHA1(baseString, signingKey).toString(
        CryptoJS.enc.Base64
      );
      return { ...oauthParams, oauth_signature: encodeURIComponent(signature) };
    };

    const url = `${apiUrl}/wp-json/wc/v3/customers`;
    const oauthParams = generateOAuthSignature(url, "POST");

    // Construir URL con parámetros OAuth
    const queryString = new URLSearchParams(
      oauthParams as Record<string, string>
    ).toString();
    const fullUrl = `${url}?${queryString}`;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        first_name,
        last_name,
        username: username || email,
      }),
    });

    if (!response.ok) {
      let errorMessage =
        "Error al crear la cuenta. Por favor, intenta nuevamente.";

      try {
        // Intentar parsear como JSON primero
        let errorData: ErrorData;
        try {
          errorData = (await response.json()) as ErrorData;
        } catch {
          // Si no es JSON, intentar como texto
          const errorText = await response.text();
          errorData = { message: errorText, error: errorText };
        }

        // Log para debug
        console.log("🔍 Registration Error Response:", {
          status: response.status,
          errorData,
          fullError: JSON.stringify(errorData),
        });

        // Obtener el texto del error de múltiples fuentes posibles
        // WooCommerce puede devolver errores en diferentes formatos:
        // 1. { code: "woocommerce_rest_customer_invalid_email", message: "...", data: { status: 400 } }
        // 2. { message: "Email already exists" }
        // 3. { error: "Email already exists" }
        // 4. { data: { message: "..." } }
        // 5. Array de errores: [{ code: "...", message: "..." }]

        let errorText = "";

        // Si es un array de errores (WooCommerce a veces devuelve arrays)
        if (Array.isArray(errorData)) {
          errorText = errorData
            .map(
              (err: WooCommerceError) =>
                err.message || err.code || JSON.stringify(err)
            )
            .join(" ")
            .toLowerCase();
        }
        // Si tiene una propiedad 'data' que es un array
        else if (
          typeof errorData === "object" &&
          errorData !== null &&
          "data" in errorData &&
          Array.isArray((errorData as WooCommerceErrorResponse).data)
        ) {
          const errorDataObj = errorData as WooCommerceErrorResponse;
          const dataArray = errorDataObj.data as WooCommerceError[];
          errorText = dataArray
            .map(
              (err: WooCommerceError) =>
                err.message || err.code || JSON.stringify(err)
            )
            .join(" ")
            .toLowerCase();
        }
        // Formato estándar
        else {
          const errorDataObj = errorData as WooCommerceErrorResponse;
          errorText = (
            errorDataObj.message ||
            errorDataObj.error ||
            (typeof errorDataObj.data === "object" &&
            errorDataObj.data !== null &&
            !Array.isArray(errorDataObj.data)
              ? errorDataObj.data.message || errorDataObj.data.error
              : undefined) ||
            errorDataObj.code ||
            (typeof errorData === "string"
              ? errorData
              : JSON.stringify(errorData))
          ).toLowerCase();
        }

        // Detectar errores de EMAIL ya registrado (prioridad alta)
        // WooCommerce puede devolver códigos como:
        // - "registration-error-email-exists" (WordPress/WooCommerce)
        // - "woocommerce_rest_customer_invalid_email"
        // - "woocommerce_rest_customer_invalid_duplicate"
        // - "rest_customer_invalid_email"
        const errorDataObj = errorData as WooCommerceErrorResponse;
        const isEmailDuplicate =
          response.status === 409 ||
          errorDataObj.code === "registration-error-email-exists" ||
          errorDataObj.code === "woocommerce_rest_customer_invalid_email" ||
          errorDataObj.code === "woocommerce_rest_customer_invalid_duplicate" ||
          errorDataObj.code === "rest_customer_invalid_email" ||
          errorDataObj.code === "woocommerce_rest_customer_duplicate" ||
          (errorText.includes("email") &&
            (errorText.includes("already") ||
              errorText.includes("exists") ||
              errorText.includes("ya existe") ||
              errorText.includes("duplicate") ||
              errorText.includes("registered") ||
              errorText.includes("taken") ||
              errorText.includes("en uso") ||
              errorText.includes("is already registered") ||
              errorText.includes("already registered") ||
              errorText.includes("email already exists") ||
              errorText.includes("customer already exists") ||
              errorText.includes("user already exists") ||
              errorText.includes("already in use") ||
              errorText.includes("invalid_email") ||
              errorText.includes("customer_invalid_email") ||
              errorText.includes("customer_invalid_duplicate") ||
              errorText.includes("registration-error-email-exists")));

        if (isEmailDuplicate) {
          // Si el backend ya proporciona un mensaje descriptivo, usarlo
          // De lo contrario, usar nuestro mensaje genérico
          if (errorDataObj.message && errorDataObj.message.trim()) {
            errorMessage = errorDataObj.message;
          } else {
            errorMessage =
              "Ya existe una cuenta con este email. Por favor, usa otro email o intenta iniciar sesión si ya tienes una cuenta.";
          }
        }
        // Detectar errores de USERNAME ya en uso
        else if (
          errorText.includes("username") &&
          (errorText.includes("already") ||
            errorText.includes("exists") ||
            errorText.includes("ya existe") ||
            errorText.includes("taken") ||
            errorText.includes("en uso") ||
            errorText.includes("already in use"))
        ) {
          errorMessage =
            "Este nombre de usuario ya está en uso. Por favor, elige otro.";
        }
        // Detectar errores de EMAIL inválido
        else if (
          errorText.includes("invalid email") ||
          errorText.includes("email inválido") ||
          errorText.includes("email is not valid") ||
          errorText.includes("invalid_email")
        ) {
          errorMessage =
            "El email ingresado no es válido. Por favor, verifica que esté escrito correctamente.";
        }
        // Detectar errores de CONTRASEÑA débil
        else if (
          errorText.includes("password") &&
          (errorText.includes("weak") ||
            errorText.includes("débil") ||
            errorText.includes("too short") ||
            errorText.includes("muy corta"))
        ) {
          errorMessage =
            "La contraseña es muy débil. Por favor, usa una contraseña más segura con al menos 8 caracteres.";
        }
        // Si es status 400, puede ser email duplicado o datos inválidos
        else if (response.status === 400) {
          // Verificar si es un error de email duplicado por código o texto
          const isEmailError =
            errorDataObj.code === "registration-error-email-exists" ||
            errorDataObj.code === "woocommerce_rest_customer_invalid_email" ||
            errorDataObj.code ===
              "woocommerce_rest_customer_invalid_duplicate" ||
            errorDataObj.code === "rest_customer_invalid_email" ||
            errorDataObj.code === "woocommerce_rest_customer_duplicate" ||
            (errorText.includes("email") &&
              (errorText.includes("already") ||
                errorText.includes("exists") ||
                errorText.includes("duplicate") ||
                errorText.includes("taken") ||
                errorText.includes("invalid_email") ||
                errorText.includes("customer_invalid_email") ||
                errorText.includes("registration-error-email-exists")));

          if (isEmailError) {
            // Si el backend ya proporciona un mensaje descriptivo, usarlo
            if (errorDataObj.message && errorDataObj.message.trim()) {
              errorMessage = errorDataObj.message;
            } else {
              errorMessage =
                "Ya existe una cuenta con este email. Por favor, usa otro email o intenta iniciar sesión si ya tienes una cuenta.";
            }
          } else {
            errorMessage =
              "Los datos ingresados no son válidos. Por favor, verifica todos los campos.";
          }
        }
        // Status 409 es conflicto, generalmente email duplicado
        else if (response.status === 409) {
          errorMessage =
            "Ya existe una cuenta con este email. Por favor, usa otro email o intenta iniciar sesión si ya tienes una cuenta.";
        }
      } catch (parseError) {
        // Si no se puede parsear el error, usar mensaje según el código de estado
        console.error("Error parsing registration error:", parseError);
        if (response.status === 409) {
          errorMessage =
            "Ya existe una cuenta con este email. Por favor, usa otro email o intenta iniciar sesión si ya tienes una cuenta.";
        } else if (response.status === 400) {
          errorMessage =
            "Los datos ingresados no son válidos. Por favor, verifica todos los campos.";
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);

    // Si el error ya tiene un mensaje descriptivo, usarlo
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Ocurrió un error al crear tu cuenta. Por favor, intenta nuevamente.";

    return NextResponse.json(
      { error: errorMessage },
      {
        status:
          error instanceof Error && errorMessage.includes("ya está registrado")
            ? 409
            : 500,
      }
    );
  }
}
