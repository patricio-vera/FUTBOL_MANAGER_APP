// =============================================================================
// USER SERVICE — capa de negocio
// =============================================================================
// EXCEPCIÓN A LA REGLA 4 DE CLAUDE.md: las funciones de este archivo NO reciben
// `orgId`. No es un descuido ni un hueco de aislamiento — la identidad del
// usuario es global a propósito: la misma persona puede pertenecer a varios
// clubes (un ojeador puede trabajar para CD Los Andes y para Academia Sur a
// la vez). Lo que SÍ es por-organización es la pertenencia, que vive en
// `Membership` (con su propio `organizationId`) y en `Session.activeOrgId`.
//
// authorize() en lib/auth/index.ts necesita encontrar al usuario por su email
// ANTES de saber a qué organización pertenece — el login no elige club, elige
// identidad. Cualquier función que aquí devuelva datos de negocio de un club
// específico (partidos, jugadores, ratings) sigue yendo por los servicios que
// sí llevan `orgId`.
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import type { User } from "@prisma/client";

/** Busca un usuario por su email. Devuelve null si no existe. */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}
