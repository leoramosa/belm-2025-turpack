import { NextRequest, NextResponse } from "next/server";

// Cache simple en memoria para rate limiting
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimit(request: NextRequest) {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";
    const now = Date.now();

    // Limpiar entradas expiradas
    for (const [key, value] of rateLimitCache.entries()) {
      if (now > value.resetTime) {
        rateLimitCache.delete(key);
      }
    }

    const key = `${ip}:${request.nextUrl.pathname}`;
    const current = rateLimitCache.get(key);

    if (!current || now > current.resetTime) {
      // Primera request o ventana expirada
      rateLimitCache.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Permitir request
    }

    if (current.count >= config.maxRequests) {
      // Rate limit excedido
      return NextResponse.json(
        { error: "Too many requests", message: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Incrementar contador
    current.count++;
    return null; // Permitir request
  };
}

// Configuraciones predefinidas
export const apiRateLimit = createRateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // 15 minutos
});

export const authRateLimit = createRateLimiter({
  maxRequests: 5, // 5 intentos
  windowMs: 15 * 60 * 1000, // 15 minutos
});

export const checkoutRateLimit = createRateLimiter({
  maxRequests: 10, // 10 requests
  windowMs: 60 * 1000, // 1 minuto
});
