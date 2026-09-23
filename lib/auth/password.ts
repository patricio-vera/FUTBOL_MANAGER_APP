// =============================================================================
// HASH DE CONTRASEÑAS — MM-006
// =============================================================================
// Argon2id, parámetros por defecto de @node-rs/argon2 (m=19456 KiB, t=2, p=1):
// es el algoritmo y los parámetros que la propia librería recomienda por
// normativa. No los tocamos sin un motivo documentado.
//
// Módulo nativo de Node (binario precompilado, sin node-gyp): NO puede entrar
// al bundle de middleware.ts, que corre en el Edge Runtime. Por eso vive
// aislado acá y solo lo importan authorize() (Node runtime) y el seed.
// =============================================================================

import { hash, verify } from "@node-rs/argon2";

// Hash Argon2id válido de una cadena aleatoria que no es la contraseña de
// ningún usuario real. Sirve solo para que verifyPassword() haga el mismo
// trabajo de cómputo cuando no hay un hash real contra el cual comparar
// (usuario inexistente, o usuario solo-OAuth con passwordHash null) — así el
// tiempo de respuesta no delata qué correos están registrados.
const DECOY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$Hly3ZZHwxDdvDmiw95IWIQ$xJBuadr+urFnWtFFI7CWgOqDEQEO9BJuBkaDX1bqehA";

/** Hashea una contraseña en texto plano. Cada llamada usa una sal aleatoria nueva. */
export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

/**
 * Verifica una contraseña contra un hash almacenado.
 *
 * `storedHash` es `string | null | undefined` a propósito: acepta directo el
 * `User.passwordHash` de Prisma (nulo para usuarios que algún día entren solo
 * por OAuth). Cuando es nulo, igual corre `verify()` contra un señuelo en vez
 * de devolver `false` de inmediato — de lo contrario, un atacante podría medir
 * el tiempo de respuesta y distinguir "no existe / sin contraseña" (rápido)
 * de "existe con contraseña" (el cómputo real de Argon2id, más lento).
 */
export async function verifyPassword(
  storedHash: string | null | undefined,
  password: string
): Promise<boolean> {
  if (!storedHash) {
    await verify(DECOY_HASH, password);
    return false;
  }

  return verify(storedHash, password);
}
