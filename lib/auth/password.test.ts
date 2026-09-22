import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("hash + verify de la misma contraseña -> true", async () => {
    const hash = await hashPassword("correcta-123");
    await expect(verifyPassword(hash, "correcta-123")).resolves.toBe(true);
  });

  it("hash + verify de otra contraseña -> false", async () => {
    const hash = await hashPassword("correcta-123");
    await expect(verifyPassword(hash, "incorrecta-456")).resolves.toBe(false);
  });

  it("dos hashes de la misma contraseña son distintos (sal aleatoria)", async () => {
    const [a, b] = await Promise.all([hashPassword("misma-pass"), hashPassword("misma-pass")]);
    expect(a).not.toBe(b);
  });

  it("storedHash null verifica contra el señuelo y devuelve false", async () => {
    await expect(verifyPassword(null, "cualquier-cosa")).resolves.toBe(false);
  });

  it("storedHash undefined verifica contra el señuelo y devuelve false", async () => {
    await expect(verifyPassword(undefined, "cualquier-cosa")).resolves.toBe(false);
  });
});
