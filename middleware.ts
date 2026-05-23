// =============================================================================
// MIDDLEWARE RBAC — Scouting & Performance Analytics Hub
// =============================================================================
// Este archivo corre en el Edge Runtime de Next.js 14 (lightweight V8 isolate).
// Se ejecuta ANTES de que el request llegue a cualquier Route Handler o página.
//
// Flujo de autorización:
//   1. ¿Es ruta pública GET? → permite sin token (rol: guest)
//   2. ¿Tiene header Authorization: Bearer <JWT>?
//      - Válido → extrae rol del payload → verifica permisos
//      - Inválido/ausente → 401 Unauthorized para rutas protegidas
//   3. ¿Rol autorizado para el método? → 200 OK / 403 Forbidden
//
// SQL Server analogy: esto sería como un login trigger o un stored procedure
// de validación que se ejecuta antes de cualquier operación DML.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// CONFIGURACIÓN DE RUTAS PÚBLICAS (solo lectura — rol: guest)
// GET requests a estas rutas NO requieren autenticación
// ---------------------------------------------------------------------------
const PUBLIC_GET_ROUTES: RegExp[] = [
  /^\/api\/players(\/[^/]+)?(\/metrics|\/contracts)?$/,
  /^\/api\/matches(\/[^/]+)?$/,
  /^\/api\/ratings\/top$/,
];

// ---------------------------------------------------------------------------
// CONFIGURACIÓN DE RUTAS POR ROL
// scout: puede registrar métricas y partidos (POST a rutas específicas)
// admin: control total (POST/PUT/DELETE en cualquier ruta /api/)
// ---------------------------------------------------------------------------
const SCOUT_ALLOWED_ROUTES: RegExp[] = [
  /^\/api\/players\/[^/]+\/metrics$/,  // POST /api/players/:id/metrics
  /^\/api\/matches$/,                   // POST /api/matches
];

// ---------------------------------------------------------------------------
// Helper: obtiene el JWT secret como Uint8Array (requerido por jose en Edge)
// ---------------------------------------------------------------------------
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Helper: verifica y decodifica el token JWT
// Devuelve el payload o null si es inválido/expirado
// ---------------------------------------------------------------------------
async function verifyToken(
  token: string
): Promise<{ sub: string; role: string; iat: number; exp: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { sub: string; role: string; iat: number; exp: number };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: extrae el token del header Authorization: Bearer <token>
// ---------------------------------------------------------------------------
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

// ---------------------------------------------------------------------------
// Helper: respuesta de error JSON (igual que un 401/403 en una API REST)
// ---------------------------------------------------------------------------
function errorResponse(status: 401 | 403, message: string): NextResponse {
  return NextResponse.json(
    { error: message, status },
    { status }
  );
}

// =============================================================================
// MIDDLEWARE PRINCIPAL
// =============================================================================
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // ── 1. Rutas no-API → pasar directamente (páginas Next.js, assets, etc.)
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── 2. Excluir ruta de autenticación de NextAuth (maneja su propio flujo)
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // ── 3. Rutas públicas GET → acceso libre (rol: guest)
  if (method === "GET") {
    const isPublic = PUBLIC_GET_ROUTES.some((pattern) =>
      pattern.test(pathname)
    );
    if (isPublic) {
      // Añadir header informativo (útil para debugging)
      const response = NextResponse.next();
      response.headers.set("X-Auth-Role", "guest");
      return response;
    }
  }

  // ── 4. Para métodos de escritura (POST/PUT/DELETE) → JWT obligatorio
  const token = extractBearerToken(request);

  if (!token) {
    return errorResponse(
      401,
      "Autenticación requerida. Incluye: Authorization: Bearer <token>"
    );
  }

  // ── 5. Verificar firma y expiración del JWT
  const payload = await verifyToken(token);

  if (!payload) {
    return errorResponse(401, "Token inválido o expirado.");
  }

  const role = payload.role as "guest" | "scout" | "admin";

  // ── 6. Admin: acceso total a todas las rutas de escritura
  if (role === "admin") {
    const response = NextResponse.next();
    response.headers.set("X-Auth-Role", "admin");
    response.headers.set("X-Auth-UserId", payload.sub);
    return response;
  }

  // ── 7. Scout: solo puede acceder a rutas específicas de escritura
  if (role === "scout") {
    const isAllowed = SCOUT_ALLOWED_ROUTES.some((pattern) =>
      pattern.test(pathname)
    );
    if (isAllowed) {
      const response = NextResponse.next();
      response.headers.set("X-Auth-Role", "scout");
      response.headers.set("X-Auth-UserId", payload.sub);
      return response;
    }
    return errorResponse(
      403,
      "Rol 'scout' no tiene permisos para esta operación."
    );
  }

  // ── 8. Rol 'guest' intentando ruta de escritura → 403
  return errorResponse(
    403,
    "Acceso denegado. Se requiere rol 'scout' o 'admin'."
  );
}

// =============================================================================
// CONFIG DEL MATCHER — Define sobre qué rutas actúa el middleware
// Solo corre en rutas /api/* (excluye archivos estáticos, _next, etc.)
// En SQL Server analogy: es como un BEFORE INSERT/UPDATE trigger a nivel de BD
// =============================================================================
export const config = {
  matcher: [
    "/api/:path*",
  ],
};
