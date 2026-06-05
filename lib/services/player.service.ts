// =============================================================================
// PLAYER SERVICE — Capa de negocio (ACTUALIZADO Y BLINDADO)
// =============================================================================
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// FUNCIÓN: getPlayers (Plural)
// ---------------------------------------------------------------------------
export async function getPlayers(filters: any = {}) {
  try {
    const { position, name } = filters;
    const where: any = {};

    if (position) where.position = position;
    if (name) where.fullName = { contains: name, mode: "insensitive" };

    const players = await prisma.player.findMany({
      where,
      orderBy: { fullName: "asc" },
      // 🛡️ Cambiado include por select: Solo extrae datos autorizados públicamente
      select: {
        id: true,
        fullName: true,
        position: true,
        nationality: true,
        age: true,
        photoUrl: true,
        createdAt: true,
        aggregatedRatings: {
          orderBy: { computedAt: "desc" },
          take: 1,
          select: {
            overallRating: true,
            radarSnapshot: true,
          }
        },
      },
    });

    return { data: players };
  } catch (error) {
    console.error("Error en getPlayers:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// FUNCIÓN: createPlayer (Singular)
// ---------------------------------------------------------------------------
export async function createPlayer(data: any) {
  return await prisma.player.create({
    data: {
      fullName: data.fullName,
      position: data.position || "N/A",
      nationality: data.nationality || "N/A",
      age: Number(data.age) || 0,
      photoUrl: data.photoUrl || "",
    }
  });
}

// ---------------------------------------------------------------------------
// OBTENER UN JUGADOR POR ID (Para el GET de /api/players/[id])
// ---------------------------------------------------------------------------
export async function getPlayerById(id: string) {
  return await prisma.player.findUnique({
    where: { id },
    // 🛡️ Blindaje extremo: Evita que campos privados o futuros viajen al navegador
    select: {
      id: true,
      fullName: true,
      position: true,
      nationality: true,
      age: true,
      photoUrl: true,
      createdAt: true,
      aggregatedRatings: {
        orderBy: { computedAt: "desc" },
        take: 1,
        select: {
          overallRating: true,
          radarSnapshot: true,
        }
      },
    },
  });
}

// ---------------------------------------------------------------------------
// ACTUALIZAR JUGADOR (Para el PUT de /api/players/[id])
// ---------------------------------------------------------------------------
export async function updatePlayer(id: string, data: any) {
  return await prisma.player.update({
    where: { id },
    data: {
      fullName: data.full_name,
      position: data.position,
      nationality: data.nationality,
      age: data.age,
      photoUrl: data.photo_url,
    },
  });
}

// ---------------------------------------------------------------------------
// ELIMINAR JUGADOR (Para el DELETE de /api/players/[id])
// ---------------------------------------------------------------------------
export async function deletePlayer(id: string) {
  return await prisma.player.delete({
    where: { id },
  });
}