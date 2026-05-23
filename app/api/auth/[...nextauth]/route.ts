// =============================================================================
// NEXTAUTH ROUTE HANDLER
// =============================================================================
// NextAuth.js v4 usa la ruta /api/auth/[...nextauth] para manejar
// todos los flujos OAuth: signin, signout, callback, session, csrf, etc.
// El Prisma Adapter persiste usuarios y sesiones en la BD automáticamente.
// =============================================================================

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import type { NextAuthOptions } from "next-auth";

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

  secret: process.env.NEXTAUTH_SECRET,

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
    signIn: "/auth/signin",     // Página de login personalizada (a crear)
    error:  "/auth/error",      // Página de error de auth (a crear)
  },
};

const handler = NextAuth(authOptions);

// Next.js App Router requiere exportar GET y POST por separado
export { handler as GET, handler as POST };
