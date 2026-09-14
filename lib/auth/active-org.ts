// =============================================================================
// CONTEXTO DE ORGANIZACIÓN — COSTURA TEMPORAL
// =============================================================================
// El modelo de datos del Ciclo 2 exige `organizationId` en toda consulta de
// negocio, pero la sesión de usuario todavía no existe (MM-006) ni el selector
// de organización activa (MM-007).
//
// Este módulo es la ÚNICA costura donde ese hueco está representado. Cuando
// MM-008 aterrice, `getActiveOrgId()` pasa a leer la sesión de Auth.js y este
// archivo desaparece; nada más del código tiene que cambiar, porque los
// servicios ya reciben el orgId como primer argumento.
//
// Deliberadamente NO tiene un valor por defecto silencioso: si la variable no
// está, falla ruidosamente en desarrollo y se niega a arrancar en producción.
// =============================================================================

import { env } from "@/lib/env";

/**
 * Devuelve la organización activa.
 *
 * TODO(MM-008): reemplazar por la sesión de Auth.js:
 *   const session = await auth();
 *   return session.user.activeOrgId;
 */
export async function getActiveOrgId(): Promise<string> {
  if (env.isProduction) {
    throw new Error(
      "getActiveOrgId(): no hay sesión de usuario. Bloqueado en producción " +
        "hasta que MM-008 conecte la autorización por sesión."
    );
  }

  const devOrgId = env.DEV_ORG_ID;
  if (!devOrgId) {
    throw new Error(
      "Falta DEV_ORG_ID en .env.local. El seed imprime el id de las " +
        "organizaciones de ejemplo al terminar; copia uno ahí."
    );
  }

  return devOrgId;
}
