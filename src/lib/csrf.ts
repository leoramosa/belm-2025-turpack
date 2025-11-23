import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Generar token CSRF
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Verificar token CSRF
export function verifyCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(storedToken, 'hex')
  );
}

// Middleware para verificar CSRF en requests POST
export function validateCSRFRequest(req: NextRequest): boolean {
  const contentType = req.headers.get('content-type');
  
  // Solo verificar en requests que pueden ser CSRF
  if (!contentType?.includes('application/json') && 
      !contentType?.includes('application/x-www-form-urlencoded')) {
    return true; // Permitir otros tipos de requests
  }

  const token = req.headers.get('x-csrf-token');
  const sessionToken = req.cookies.get('csrf-token')?.value;

  if (!token || !sessionToken) {
    return false;
  }

  return verifyCSRFToken(token, sessionToken);
}

// Helper para agregar token CSRF a formularios
export function getCSRFTokenInput(token: string): string {
  return `<input type="hidden" name="_csrf" value="${token}" />`;
}

// Helper para agregar token CSRF a headers de fetch
export function getCSRFHeaders(token: string): Record<string, string> {
  return {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json',
  };
} 