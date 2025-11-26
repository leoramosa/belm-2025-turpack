export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: "percent" | "fixed_cart" | "fixed_product";
  amount: string;
  discount_amount: number;
  minimum_amount?: string;
  maximum_amount?: string;
  usage_limit?: number;
  usage_count: number;
  date_expires?: string;
}

export interface CouponDiscount {
  amount: number;
  type: string;
  formatted_amount: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  discount?: CouponDiscount;
}

export interface CouponApplyResponse {
  success: boolean;
  error?: string;
  coupon?: Coupon;
  discount?: CouponDiscount;
}

export interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  selectedAttributes?: { [key: number]: string };
}

export class CouponService {
  /**
   * Valida un cupón con los items del carrito
   */
  static async validateCoupon(
    code: string,
    cartItems: CartItem[]
  ): Promise<CouponValidationResponse> {
    try {
      if (!code || !cartItems || cartItems.length === 0) {
        return {
          valid: false,
          error: "Código de cupón y items del carrito son requeridos",
        };
      }

      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            cart_items: cartItems,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          return {
            valid: false,
            error: errorData.error || "Error al validar el cupón",
          };
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return {
            valid: false,
            error: "Timeout: La validación del cupón tardó demasiado",
          };
        }

        throw fetchError;
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      return {
        valid: false,
        error: "Error de conexión. Intenta nuevamente.",
      };
    }
  }

  /**
   * Aplica un cupón a los items del carrito
   */
  static async applyCoupon(
    code: string,
    cartItems: CartItem[],
    customerId?: number
  ): Promise<CouponApplyResponse> {
    try {
      if (!code || !cartItems || cartItems.length === 0) {
        return {
          success: false,
          error: "Código de cupón y items del carrito son requeridos",
        };
      }

      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch("/api/coupons/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            cart_items: cartItems,
            customer_id: customerId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || "Error al aplicar el cupón",
          };
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return {
            success: false,
            error: "Timeout: La aplicación del cupón tardó demasiado",
          };
        }

        throw fetchError;
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      return {
        success: false,
        error: "Error de conexión. Intenta nuevamente.",
      };
    }
  }

  /**
   * Remueve un cupón aplicado
   */
  static async removeCoupon(
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!code) {
        return {
          success: false,
          error: "Código de cupón es requerido",
        };
      }

      const response = await fetch("/api/coupons/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Error al remover el cupón",
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error removing coupon:", error);
      return {
        success: false,
        error: "Error de conexión. Intenta nuevamente.",
      };
    }
  }

  /**
   * Calcula el total del carrito con descuento aplicado
   */
  static calculateTotalWithDiscount(
    cartItems: CartItem[],
    discountAmount: number = 0
  ): {
    subtotal: number;
    discount: number;
    total: number;
    formatted_subtotal: string;
    formatted_discount: string;
    formatted_total: string;
  } {
    const subtotal = cartItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + price * item.quantity;
    }, 0);

    const discount = Math.min(discountAmount, subtotal);
    const total = Math.max(0, subtotal - discount);

    const formatter = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      subtotal,
      discount,
      total,
      formatted_subtotal: formatter.format(subtotal),
      formatted_discount: formatter.format(discount),
      formatted_total: formatter.format(total),
    };
  }

  /**
   * Valida formato de código de cupón
   */
  static isValidCouponCode(code: string): boolean {
    if (!code || typeof code !== "string") return false;

    // Código debe tener entre 3 y 20 caracteres
    const trimmedCode = code.trim();
    if (trimmedCode.length < 3 || trimmedCode.length > 20) return false;

    // Solo letras, números, guiones y guiones bajos
    const validPattern = /^[A-Z0-9_-]+$/i;
    return validPattern.test(trimmedCode);
  }
}
