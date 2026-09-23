// =============================================================================
// AUTH.JS v5 — MM-006
// =============================================================================
// Alcance: SOLO credenciales (email + contraseña). Nada de OAuth todavía.
//
// Estrategia de sesión: JWT, obligatorio con el proveedor Credentials — Auth.js
// v5 no soporta sesiones en base de datos con este proveedor. Por eso las
// tablas `sessions`, `accounts` y `verification_tokens` quedan vacías a
// propósito: no hay adaptador de base de datos conectado (@auth/prisma-adapter
// NO se instala; con credenciales + JWT no se usa).
//
// Este módulo corre en el Node.js runtime (importa @node-rs/argon2, un binario
// nativo). NO debe importarse desde middleware.ts, que corre en el Edge
// Runtime — eso rompería el build.
// =============================================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { findUserByEmail } from "@/lib/services/user.service";
import { verifyPassword } from "@/lib/auth/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await findUserByEmail(email);

        // Siempre se llama a verifyPassword, exista o no el usuario: así el
        // caso "correo inexistente" y el caso "contraseña incorrecta" hacen
        // el mismo trabajo de cómputo (ver lib/auth/password.ts).
        const isValid = await verifyPassword(user?.passwordHash, password);

        // Los tres casos de rechazo colapsan en esta única condición:
        //   - correo inexistente            -> user es null
        //   - usuario con passwordHash null -> verifyPassword ya dio false
        //   - contraseña incorrecta         -> verifyPassword ya dio false
        if (!user || !isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      // `user` solo está presente en el sign-in (viene de authorize).
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
