// =============================================================================
// VALIDACIÓN DE ENTORNO — MM-004
// =============================================================================
// Antes: `process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? ""`.
// Si ninguna variable existía, la aplicación arrancaba igual y fallaba en
// tiempo de ejecución, en producción, justo en la ruta de autenticación.
//
// Ahora: el módulo valida al importarse. Si falta algo, el proceso muere en el
// arranque diciendo exactamente qué variable falta y por qué.
// =============================================================================

import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // --- Base de datos ---
    // Neon expone dos cadenas y NO son intercambiables:
    //   DATABASE_URL        -> pooled, la que usa la app en cada invocación
    //   DIRECT_DATABASE_URL -> directa, solo para migraciones
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL es obligatoria")
      .refine((value) => value.startsWith("postgres"), {
        message: "DATABASE_URL debe ser una cadena de conexión PostgreSQL",
      }),
    DIRECT_DATABASE_URL: z
      .string()
      .refine((value) => value.startsWith("postgres"), {
        message: "DIRECT_DATABASE_URL debe ser una cadena de conexión PostgreSQL",
      })
      .optional(),

    // --- Autenticación ---
    // NextAuth v4 (NEXTAUTH_*) se borró en MM-003. El alias NEXTAUTH_SECRET que
    // aceptaba esta validación mientras duraba la migración se retiró al cerrar
    // MM-006: ahora AUTH_SECRET es la única variable y es obligatoria.
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET necesita al menos 32 caracteres"),
    AUTH_URL: z.string().url().optional(),

    // --- OAuth (opcionales) ---
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // --- Imágenes: hosts permitidos para next/image, separados por coma ---
    IMAGE_HOST_ALLOWLIST: z.string().optional(),

    // --- Costura temporal, desaparece en MM-008 ---
    DEV_ORG_ID: z.string().optional(),

    // --- Costura de desarrollo: contraseña del usuario sembrado por el seed.
    // Solo la lee prisma/seed.ts. Si falta, el seed deja passwordHash en null
    // en vez de inventar una contraseña — ninguna contraseña se escribe en el
    // repositorio.
    DEV_SEED_PASSWORD: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    // Este guardrail protege el pooler de Neon (pgbouncer), no "producción" en
    // abstracto: si DATABASE_URL y DIRECT_DATABASE_URL son la misma cadena
    // pooled, las migraciones agotan las conexiones agrupadas bajo carga.
    // Antes disparaba con NODE_ENV === "production", pero `next build` fuerza
    // NODE_ENV=production incluso en un build local contra Postgres en Docker
    // (sin pooler, donde ambas cadenas son legítimamente la misma). Por eso se
    // ata a si la conexión es a Neon (host `neon.tech`), sin importar NODE_ENV:
    // un `next dev` apuntando a Neon por error corre el mismo riesgo que un
    // deploy real.
    const usesNeon =
      value.DATABASE_URL.includes("neon.tech") ||
      (value.DIRECT_DATABASE_URL?.includes("neon.tech") ?? false);

    if (usesNeon && !value.DIRECT_DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DIRECT_DATABASE_URL"],
        message:
          "DATABASE_URL apunta a Neon: DIRECT_DATABASE_URL es obligatoria y debe ser DISTINTA " +
          "de DATABASE_URL para las migraciones — si ambas apuntan a la misma cadena se anula " +
          "el pooling de Neon.",
      });
    }

    if (usesNeon && value.DIRECT_DATABASE_URL === value.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DIRECT_DATABASE_URL"],
        message:
          "DIRECT_DATABASE_URL no puede ser igual a DATABASE_URL cuando se usa Neon: la " +
          "primera es la conexión directa (migraciones), la segunda la agrupada (runtime).",
      });
    }
  });

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  · ${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Configuración de entorno inválida. Revisa tu .env.local:\n${detail}\n` +
        `Referencia completa en .env.example`
    );
  }

  const value = parsed.data;

  return {
    ...value,
    /** Secreto de sesión. Alias explícito: el resto del código usa este nombre. */
    sessionSecret: value.AUTH_SECRET,
    /** Hosts permitidos para imágenes remotas, ya normalizados. */
    imageHosts: (value.IMAGE_HOST_ALLOWLIST ?? "")
      .split(",")
      .map((host) => host.trim())
      .filter(Boolean),
    isProduction: value.NODE_ENV === "production",
    isDevelopment: value.NODE_ENV === "development",
  };
}

export const env = loadEnv();
