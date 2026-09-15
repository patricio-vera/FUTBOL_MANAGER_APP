// =============================================================================
// PRISMA CLIENT SINGLETON
// =============================================================================
// Problema: en desarrollo, Next.js recarga módulos frecuentemente (Hot Reload).
// Sin singleton, cada recarga crearía una nueva conexión a la BD,
// agotando el pool de conexiones de PostgreSQL.
//
// Solución: guardamos la instancia en `globalThis` en desarrollo.
// En producción (proceso único), simplemente instanciamos una vez.
//
// SQL Server analogy: equivale a reutilizar la misma SqlConnection
// en vez de abrir/cerrar una nueva en cada request.
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

// Extendemos el tipo global de Node.js para incluir el campo prisma
declare global {
  var prisma: PrismaClient | undefined;
}

// En producción: nueva instancia. En desarrollo: reutiliza la del hot-reload.
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log:
      env.isDevelopment
        ? ["query", "error", "warn"]  // Muestra las queries SQL en la consola
        : ["error"],
  });

if (!env.isProduction) {
  globalThis.prisma = prisma;
}

export default prisma;
