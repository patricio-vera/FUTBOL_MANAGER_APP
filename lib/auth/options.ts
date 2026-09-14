// =============================================================================
// NEXTAUTH OPTIONS
// =============================================================================
// Vive fuera de app/api/auth/[...nextauth]/route.ts a propósito: un route.ts de
// App Router solo puede exportar handlers HTTP (GET, POST, ...) y un puñado de
// campos reservados (config, dynamic, revalidate, ...). Exportar `authOptions`
// desde ahí rompe la validación de tipos que Next.js genera en .next/types — es
// exactamente el error que reveló `npm run build` una vez que se limpió .next/.
// =============================================================================

import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // ---------------------------------------------------------------------------
  // Proveedores de autenticación
  // Credenciales simples para desarrollo; añade OAuth en producción
  // ---------------------------------------------------------------------------
  providers: [
    // Para añadir Google OAuth:
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],

  // ---------------------------------------------------------------------------
  // Estrategia JWT: el token viaja en cookie segura (HttpOnly, SameSite=Lax)
  // El middleware.ts usa jose para verificar el mismo secret
  // ---------------------------------------------------------------------------
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },

  secret: env.sessionSecret,

  callbacks: {
    // Incluye el rol del usuario en el JWT → el middleware puede leerlo
    async jwt({ token, user }) {
      if (user) {
        // Al crear el token por primera vez, añade el rol
        token.role = (user as { role?: string }).role ?? "guest";
        token.sub = user.id;
      }
      return token;
    },

    // Expone el rol en la sesión del cliente
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { role?: string; id?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.sub as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin", // Página de login personalizada (a crear)
    error: "/auth/error", // Página de error de auth (a crear)
  },
};
