// =============================================================================
// NEXTAUTH ROUTE HANDLER
// =============================================================================
// NextAuth.js v4 usa la ruta /api/auth/[...nextauth] para manejar
// todos los flujos OAuth: signin, signout, callback, session, csrf, etc.
// El Prisma Adapter persiste usuarios y sesiones en la BD automáticamente.
//
// `authOptions` vive en lib/auth/options.ts, no acá: un route.ts de App Router
// solo puede exportar handlers HTTP y un puñado de campos reservados.
// =============================================================================

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

const handler = NextAuth(authOptions);

// Next.js App Router requiere exportar GET y POST por separado
export { handler as GET, handler as POST };
