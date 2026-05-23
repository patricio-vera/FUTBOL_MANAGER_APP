// =============================================================================
// PLAYER SERVICE — Capa de negocio
// =============================================================================
import { prisma } from "@/lib/db/prisma";

// ... (tus interfaces CreatePlayerInput, etc.)

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
      include: {
        aggregatedRatings: {
          orderBy: { computedAt: "desc" },
          take: 1,
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
    include: {
      aggregatedRatings: {
        orderBy: { computedAt: "desc" },
        take: 1,
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