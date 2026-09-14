// =============================================================================
// RESPUESTAS DE API TIPADAS
// =============================================================================
// Sustituye el patrón `console.error(e); return { error: "Error interno" }`,
// que en producción no permitía saber qué falló ni para quién.
// La instrumentación completa (pino, Sentry, requestId propagado) es MM-020;
// esto es el mínimo para que los códigos de error existan desde ya.
// =============================================================================

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export function apiError(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status: STATUS_BY_CODE[code] }
  );
}

/** Punto único donde un fallo inesperado se registra y se convierte en 500. */
export function handleUnexpected(scope: string, error: unknown) {
  if (error instanceof ZodError) {
    return apiError("VALIDATION_ERROR", "Datos inválidos", error.flatten());
  }

  // TODO(MM-020): sustituir por logger estructurado con requestId y orgId.
  console.error(`[${scope}]`, error);

  return apiError("INTERNAL", "Error interno del servidor");
}
