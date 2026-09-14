// =============================================================================
// FOTOS DE JUGADOR — MM-005
// =============================================================================
// `next/image` revienta en tiempo de ejecución si la URL apunta a un host que no
// está en `remotePatterns`. Como `photoUrl` es un dato que introduce el usuario,
// puede apuntar a cualquier sitio: hay que comprobarlo ANTES de renderizar y
// caer al marcador genérico si no está permitido.
// =============================================================================

import { env } from "@/lib/env";

/**
 * ¿Puede `next/image` servir esta URL con la configuración actual?
 * Solo https, y solo hosts declarados en IMAGE_HOST_ALLOWLIST.
 */
export function isOptimizableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return env.imageHosts.includes(parsed.hostname);
  } catch {
    // URL malformada guardada en base: se trata como si no hubiera foto.
    return false;
  }
}
