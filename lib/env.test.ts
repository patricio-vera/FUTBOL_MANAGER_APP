import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const VALID = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  DIRECT_DATABASE_URL: "postgresql://u:p@localhost:5433/db",
  AUTH_SECRET: "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres",
};

/** Carga lib/env desde cero con el entorno indicado. */
async function loadWith(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  const snapshot = { ...process.env };

  for (const key of Object.keys(VALID)) delete process.env[key];
  delete process.env.IMAGE_HOST_ALLOWLIST;

  for (const [key, value] of Object.entries({ ...VALID, ...overrides })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await import("./env");
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, snapshot);
  }
}

describe("validación de entorno", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.resetModules());

  it("acepta una configuración válida", async () => {
    const { env } = await loadWith({});
    expect(env.sessionSecret).toBe(VALID.AUTH_SECRET);
    expect(env.isProduction).toBe(false);
  });

  it("falla si no hay ningún secreto de sesión", async () => {
    // El bug del Ciclo 1: `?? ""` dejaba arrancar la app sin secreto.
    await expect(loadWith({ AUTH_SECRET: undefined })).rejects.toThrow(/AUTH_SECRET/);
  });

  it("falla si el secreto es demasiado corto", async () => {
    await expect(loadWith({ AUTH_SECRET: "corto" })).rejects.toThrow(/32 caracteres/);
  });

  it("ya no acepta NEXTAUTH_SECRET: el alias se retiró al cerrar MM-006", async () => {
    // NextAuth v4 se borró en MM-003; el alias que toleraba NEXTAUTH_SECRET
    // mientras duraba la migración a Auth.js v5 no debe seguir funcionando.
    await expect(
      loadWith({
        AUTH_SECRET: undefined,
        NEXTAUTH_SECRET: "otro-secreto-largo-de-mas-de-treinta-y-dos-chars",
      })
    ).rejects.toThrow(/AUTH_SECRET/);
  });

  it("rechaza una DATABASE_URL que no sea PostgreSQL", async () => {
    await expect(loadWith({ DATABASE_URL: "mysql://u:p@localhost/db" })).rejects.toThrow(
      /PostgreSQL/
    );
  });

  it("si DATABASE_URL apunta a Neon, exige que las dos cadenas sean distintas", async () => {
    // El guardrail protege el pooler de Neon, no "producción" en abstracto:
    // dispara por el host, sin importar NODE_ENV.
    const neonUrl =
      "postgresql://u:p@ep-fake-pooler.sa-east-1.aws.neon.tech/db?sslmode=require&pgbouncer=true";
    await expect(
      loadWith({
        DATABASE_URL: neonUrl,
        DIRECT_DATABASE_URL: neonUrl,
      })
    ).rejects.toThrow(/no puede ser igual/);
  });

  it("si DATABASE_URL apunta a Neon, exige DIRECT_DATABASE_URL", async () => {
    const neonUrl =
      "postgresql://u:p@ep-fake-pooler.sa-east-1.aws.neon.tech/db?sslmode=require&pgbouncer=true";
    await expect(
      loadWith({ DATABASE_URL: neonUrl, DIRECT_DATABASE_URL: undefined })
    ).rejects.toThrow(/DIRECT_DATABASE_URL/);
  });

  it("con Postgres local (no Neon) permite que las dos cadenas sean iguales, incluso en producción", async () => {
    // `next build` fuerza NODE_ENV=production incluso en un build local sin
    // pooler: ahí DATABASE_URL y DIRECT_DATABASE_URL son legítimamente iguales.
    const { env } = await loadWith({
      NODE_ENV: "production",
      DIRECT_DATABASE_URL: VALID.DATABASE_URL,
    });
    expect(env.isProduction).toBe(true);
  });

  it("normaliza el allowlist de imágenes", async () => {
    const { env } = await loadWith({
      IMAGE_HOST_ALLOWLIST: " cdn.uno.test , cdn.dos.test ,,",
    });
    expect(env.imageHosts).toEqual(["cdn.uno.test", "cdn.dos.test"]);
  });

  it("sin allowlist no se permite ninguna imagen remota", async () => {
    const { env } = await loadWith({});
    expect(env.imageHosts).toEqual([]);
  });
});
