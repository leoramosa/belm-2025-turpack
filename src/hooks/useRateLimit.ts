import { useState, useCallback, useRef, useEffect } from "react";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  key?: string;
}

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  isBlocked: boolean;
  remainingTime: number;
}

export const useRateLimit = (config: RateLimitConfig) => {
  const { maxAttempts, windowMs } = config;
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    lastAttempt: 0,
    isBlocked: false,
    remainingTime: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const attempt = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastAttempt = now - state.lastAttempt;

    // Si ha pasado el tiempo de ventana, resetear intentos
    if (timeSinceLastAttempt > windowMs) {
      setState((prev) => ({
        ...prev,
        attempts: 0,
        isBlocked: false,
        remainingTime: 0,
      }));
    }

    // Si está bloqueado, verificar si ya puede intentar de nuevo
    if (state.isBlocked) {
      const remaining = windowMs - timeSinceLastAttempt;
      if (remaining <= 0) {
        setState((prev) => ({
          ...prev,
          attempts: 0,
          isBlocked: false,
          remainingTime: 0,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          remainingTime: remaining,
        }));
        return false;
      }
    }

    const newAttempts = state.attempts + 1;

    if (newAttempts >= maxAttempts) {
      setState((prev) => ({
        ...prev,
        attempts: newAttempts,
        lastAttempt: now,
        isBlocked: true,
        remainingTime: windowMs,
      }));

      // Limpiar intervalo anterior si existe
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Configurar intervalo para actualizar remainingTime
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const elapsed = Date.now() - prev.lastAttempt;
          const remaining = Math.max(0, windowMs - elapsed);

          if (remaining <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return {
              ...prev,
              attempts: 0,
              isBlocked: false,
              remainingTime: 0,
            };
          }

          return {
            ...prev,
            remainingTime: remaining,
          };
        });
      }, 1000);

      return false;
    }

    setState((prev) => ({
      ...prev,
      attempts: newAttempts,
      lastAttempt: now,
    }));

    return true;
  }, [
    state.attempts,
    state.lastAttempt,
    state.isBlocked,
    maxAttempts,
    windowMs,
  ]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState({
      attempts: 0,
      lastAttempt: 0,
      isBlocked: false,
      remainingTime: 0,
    });
  }, []);

  return {
    attempt,
    reset,
    isBlocked: state.isBlocked,
    remainingTime: state.remainingTime,
    attempts: state.attempts,
    maxAttempts,
  };
};
