// =============================================================================
// NEXTAUTH ROUTE HANDLER
// =============================================================================
// SOLO reexporta los handlers. En App Router, un route.ts únicamente puede
// exportar manejadores HTTP y un puñado de campos reservados — exportar algo
// más (como `authOptions` en NextAuth v4) rompe la validación de tipos que
// Next.js genera en .next/types. Eso fue exactamente lo que rompió el build
// en la Fase 0; la configuración real vive en lib/auth/index.ts.
// =============================================================================

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
