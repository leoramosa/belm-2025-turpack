"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCartStore } from "@/store/useCartStore";
import {
  CouponService,
  type CartItem as CouponCartItem,
} from "@/services/coupons";
import { FiTag, FiX, FiCheck, FiLoader } from "react-icons/fi";

interface CouponSectionProps {
  className?: string;
}

export default function CouponSection({ className = "" }: CouponSectionProps) {
  const {
    cart,
    appliedCoupon,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    couponDiscount,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getTotal,
    getDiscountAmount,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Estado para evitar errores de hidratación
  const [isClient, setIsClient] = useState(false);

  // Ref para evitar loops infinitos
  const isRecalculating = useRef(false);

  // Evitar errores de hidratación
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Recalcular descuento automáticamente solo cuando cambia el carrito (no cuando se aplica el cupón)
  // Esto evita llamadas redundantes después de aplicar un cupón
  const cartKey = useMemo(
    () => cart.map((item) => `${item.id}-${item.quantity}`).join(","),
    [cart]
  );

  useEffect(() => {
    const recalculateCouponDiscount = async () => {
      // Solo recalcular si hay un cupón aplicado y hay items en el carrito
      // Y solo si el carrito realmente cambió (no cuando se acaba de aplicar el cupón)
      if (appliedCoupon && cart.length > 0 && !isRecalculating.current) {
        isRecalculating.current = true;

        try {
          // Convertir cart items al formato esperado por el servicio
          const cartItems: CouponCartItem[] = cart.map((item) => ({
            id: String(item.id),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedAttributes: item.selectedAttributes,
          }));

          // Revalidar el cupón con los items actuales
          const result = await CouponService.validateCoupon(
            appliedCoupon.code,
            cartItems
          );

          if (result.valid && result.coupon && result.discount) {
            // Solo actualizar si el descuento es diferente
            const currentDiscount = getDiscountAmount();
            if (Math.abs(result.discount.amount - currentDiscount) > 0.01) {
              applyCoupon(result.coupon, result.discount);
            }
          } else {
            // Si el cupón ya no es válido, removerlo
            removeCoupon();
            setMessage({
              type: "info",
              text: `El cupón "${appliedCoupon.code}" ya no es válido para los productos actuales`,
            });
          }
        } catch {
          // En caso de error, no hacer nada para no interrumpir la experiencia
        } finally {
          isRecalculating.current = false;
        }
      }
    };

    // Debounce: esperar 1 segundo antes de recalcular para evitar llamadas excesivas
    const timeoutId = setTimeout(() => {
      recalculateCouponDiscount();
    }, 1000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]); // Solo cuando cambia el carrito, no cuando cambia el cupón

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage({
        type: "error",
        text: "Por favor ingresa un código de cupón",
      });
      return;
    }

    if (!CouponService.isValidCouponCode(couponCode)) {
      setMessage({
        type: "error",
        text: "Formato de código de cupón inválido",
      });
      return;
    }

    if (cart.length === 0) {
      setMessage({
        type: "error",
        text: "Agrega productos al carrito para usar un cupón",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Convertir cart items al formato esperado por el servicio
      const cartItems: CouponCartItem[] = cart.map((item) => ({
        id: String(item.id),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedAttributes: item.selectedAttributes,
      }));

      const result = await CouponService.applyCoupon(couponCode, cartItems);

      if (result.success && result.coupon && result.discount) {
        applyCoupon(result.coupon, result.discount);
        setMessage({
          type: "success",
          text: `¡Cupón "${result.coupon.code}" aplicado exitosamente! Descuento: ${result.discount.formatted_amount}`,
        });
        setCouponCode("");
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error al aplicar el cupón",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Error de conexión. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!appliedCoupon) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await CouponService.removeCoupon(appliedCoupon.code);

      if (result.success) {
        removeCoupon();
        setMessage({
          type: "info",
          text: "Cupón removido exitosamente",
        });

        // Auto-ocultar mensaje después de 3 segundos
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Error al remover el cupón",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Error de conexión. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleApplyCoupon();
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <FiTag className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">
          Cupón de Descuento
        </h3>
      </div>

      {!appliedCoupon ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa tu código de cupón"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
              disabled={isLoading}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isLoading || !couponCode.trim()}
              className="px-4 py-3 sm:px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto sm:min-w-[120px]"
            >
              {isLoading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiCheck className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Aplicar</span>
              <span className="sm:hidden">✓</span>
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blueimage.png-700 border border-blue-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <FiCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  Cupón &quot;{appliedCoupon.code}&quot; aplicado
                </p>
                <p className="text-sm text-green-700">
                  {appliedCoupon.description || "Descuento aplicado"}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              disabled={isLoading}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}

      {/* Resumen de precios */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              S/ {isClient ? getSubtotal().toFixed(2) : "0.00"}
            </span>
          </div>

          {isClient && getDiscountAmount() > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Descuento:</span>
              <span className="font-medium text-green-600">
                -S/ {getDiscountAmount().toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span className="text-primary">
              S/ {isClient ? getTotal().toFixed(2) : "0.00"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
