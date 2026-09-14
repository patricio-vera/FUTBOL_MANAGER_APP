// =============================================================================
// SEED — Ciclo 2
// =============================================================================
// Siembra DOS organizaciones con datos distintos. No es decorativo: es lo que
// permite escribir las pruebas negativas de aislamiento del ticket MM-010
// ("desde el contexto del club A, los datos del club B devuelven cero filas").
//
// Sin fotos de terceros: el seed anterior enlazaba en caliente imágenes del CDN
// de Transfermarkt, que no son nuestras y dependen de un host ajeno.
// =============================================================================

import { PrismaClient, Position, Foot, OrgPlan, MemberRole, MetricUnit } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Catálogo de métricas.
// La clave coincide 1:1 con la columna tipada de `Appearance` que la alimenta.
// ---------------------------------------------------------------------------
const METRIC_DEFINITIONS = [
  { key: "goals", label: "Goles", unit: MetricUnit.COUNT },
  { key: "assists", label: "Asistencias", unit: MetricUnit.COUNT },
  { key: "shots", label: "Remates", unit: MetricUnit.COUNT },
  { key: "keyPasses", label: "Pases clave", unit: MetricUnit.COUNT },
  { key: "passesAttempted", label: "Pases intentados", unit: MetricUnit.COUNT },
  { key: "passesCompleted", label: "Pases completados", unit: MetricUnit.COUNT },
  { key: "progressivePasses", label: "Pases progresivos", unit: MetricUnit.COUNT },
  { key: "dribblesAttempted", label: "Regates intentados", unit: MetricUnit.COUNT },
  { key: "dribblesCompleted", label: "Regates completados", unit: MetricUnit.COUNT },
  { key: "tacklesWon", label: "Entradas ganadas", unit: MetricUnit.COUNT },
  { key: "interceptions", label: "Intercepciones", unit: MetricUnit.COUNT },
  { key: "aerialDuelsWon", label: "Duelos aéreos ganados", unit: MetricUnit.COUNT },
  { key: "aerialDuelsTotal", label: "Duelos aéreos disputados", unit: MetricUnit.COUNT },
  { key: "pressures", label: "Presiones", unit: MetricUnit.COUNT },
] as const;

// ---------------------------------------------------------------------------
// Pesos del modelo "baseline" v1.
// INVARIANTE: los pesos de cada posición suman exactamente 1.0000.
// El Ciclo 1 tenía dos juegos contradictorios — uno en el seed que sumaba 1,0 y
// otro en TypeScript que sumaba 4,4 — y el algoritmo usaba el segundo.
// ---------------------------------------------------------------------------
const BASELINE_WEIGHTS: Record<string, Array<[string, string, number]>> = {
  ST: [
    ["goals", "Definición", 0.3],
    ["shots", "Volumen de remate", 0.15],
    ["assists", "Asociación", 0.1],
    ["dribblesCompleted", "Regate", 0.15],
    ["aerialDuelsWon", "Juego aéreo", 0.15],
    ["pressures", "Presión", 0.15],
  ],
  LW: [
    ["dribblesCompleted", "Regate", 0.25],
    ["keyPasses", "Pases clave", 0.2],
    ["goals", "Definición", 0.2],
    ["assists", "Asistencias", 0.15],
    ["progressivePasses", "Progresión", 0.1],
    ["pressures", "Presión", 0.1],
  ],
  RW: [
    ["dribblesCompleted", "Regate", 0.25],
    ["keyPasses", "Pases clave", 0.2],
    ["goals", "Definición", 0.2],
    ["assists", "Asistencias", 0.15],
    ["progressivePasses", "Progresión", 0.1],
    ["pressures", "Presión", 0.1],
  ],
  CM: [
    ["passesCompleted", "Circulación", 0.25],
    ["progressivePasses", "Progresión", 0.2],
    ["keyPasses", "Pases clave", 0.2],
    ["tacklesWon", "Recuperación", 0.15],
    ["pressures", "Presión", 0.1],
    ["dribblesCompleted", "Conducción", 0.1],
  ],
  DM: [
    ["tacklesWon", "Recuperación", 0.3],
    ["interceptions", "Anticipación", 0.25],
    ["pressures", "Presión", 0.2],
    ["passesCompleted", "Circulación", 0.15],
    ["progressivePasses", "Progresión", 0.1],
  ],
  CB: [
    ["aerialDuelsWon", "Juego aéreo", 0.3],
    ["interceptions", "Anticipación", 0.25],
    ["tacklesWon", "Entradas", 0.2],
    ["passesCompleted", "Salida", 0.15],
    ["progressivePasses", "Progresión", 0.1],
  ],
};

function assertWeightsSumToOne(): void {
  for (const [position, weights] of Object.entries(BASELINE_WEIGHTS)) {
    const total = weights.reduce((sum, [, , weight]) => sum + weight, 0);
    if (Math.abs(total - 1) > 1e-9) {
      throw new Error(`Los pesos de ${position} suman ${total}, deben sumar exactamente 1.0`);
    }
  }
}

async function main() {
  assertWeightsSumToOne();
  console.log("Sembrando base de datos…");

  // --- Catálogo global de métricas -----------------------------------------
  for (const definition of METRIC_DEFINITIONS) {
    await prisma.metricDefinition.upsert({
      where: { key: definition.key },
      update: { label: definition.label, unit: definition.unit },
      create: { key: definition.key, label: definition.label, unit: definition.unit },
    });
  }

  // --- Modelo de rating global ---------------------------------------------
  let baseline = await prisma.ratingModel.findFirst({
    where: { organizationId: null, name: "baseline", version: 1 },
  });

  if (!baseline) {
    baseline = await prisma.ratingModel.create({
      data: {
        name: "baseline",
        version: 1,
        isActive: true,
        minMinutes: 450,
        notes: "Modelo inicial. Pesos por posición, suman 1.0 en cada una.",
      },
    });
  }

  for (const [position, weights] of Object.entries(BASELINE_WEIGHTS)) {
    for (const [metricKey, axisLabel, weight] of weights) {
      await prisma.ratingModelWeight.upsert({
        where: {
          ratingModelId_position_metricKey: {
            ratingModelId: baseline.id,
            position: position as Position,
            metricKey,
          },
        },
        update: { axisLabel, weight },
        create: {
          ratingModelId: baseline.id,
          position: position as Position,
          metricKey,
          axisLabel,
          weight,
        },
      });
    }
  }

  // --- Usuario propietario --------------------------------------------------
  const owner = await prisma.user.upsert({
    where: { email: "owner@managermetrics.test" },
    update: {},
    create: { email: "owner@managermetrics.test", name: "Cuenta de desarrollo" },
  });

  // --- Dos organizaciones con datos disjuntos -------------------------------
  const organizations = [
    {
      slug: "cd-los-andes",
      name: "CD Los Andes",
      country: "CL",
      plan: OrgPlan.CLUB,
      players: [
        { fullName: "Matías Fuentealba", position: Position.LW, dob: "2003-04-11", foot: Foot.RIGHT },
        { fullName: "Rodrigo Salcedo", position: Position.DM, dob: "1998-09-02", foot: Foot.RIGHT },
        { fullName: "Ignacio Rebolledo", position: Position.CB, dob: "2000-01-23", foot: Foot.LEFT },
        { fullName: "Cristóbal Varela", position: Position.ST, dob: "2001-06-30", foot: Foot.RIGHT },
      ],
      matches: [
        { home: "CD Los Andes", away: "Deportes Quillota", competition: "Primera B", tier: 3 },
        { home: "Curicó Unido", away: "CD Los Andes", competition: "Primera B", tier: 3 },
      ],
    },
    {
      slug: "academia-sur",
      name: "Academia Sur",
      country: "CL",
      plan: OrgPlan.ACADEMY,
      players: [
        { fullName: "Emilia Cárcamo", position: Position.CM, dob: "2004-02-17", foot: Foot.LEFT },
        { fullName: "Tomás Aguayo", position: Position.RW, dob: "2005-11-05", foot: Foot.RIGHT },
        { fullName: "Vicente Nahuelpán", position: Position.CB, dob: "2003-08-14", foot: Foot.RIGHT },
      ],
      matches: [
        { home: "Academia Sur", away: "Cantera Valdivia", competition: "Torneo Formativo", tier: 5 },
      ],
    },
  ];

  const season = "2025-26";
  const createdOrgs: Array<{ name: string; id: string }> = [];

  for (const spec of organizations) {
    const organization = await prisma.organization.upsert({
      where: { slug: spec.slug },
      update: { name: spec.name, plan: spec.plan },
      create: { slug: spec.slug, name: spec.name, country: spec.country, plan: spec.plan },
    });

    createdOrgs.push({ name: organization.name, id: organization.id });

    await prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: organization.id, userId: owner.id } },
      update: { role: MemberRole.OWNER, acceptedAt: new Date() },
      create: {
        organizationId: organization.id,
        userId: owner.id,
        role: MemberRole.OWNER,
        acceptedAt: new Date(),
      },
    });

    // Jugadores
    const players = [];
    for (const playerSpec of spec.players) {
      const dateOfBirth = new Date(`${playerSpec.dob}T00:00:00.000Z`);
      const isMinor =
        new Date().getUTCFullYear() - dateOfBirth.getUTCFullYear() < 18;

      const player = await prisma.player.upsert({
        where: {
          organizationId_fullName_dateOfBirth: {
            organizationId: organization.id,
            fullName: playerSpec.fullName,
            dateOfBirth,
          },
        },
        update: { position: playerSpec.position, foot: playerSpec.foot },
        create: {
          organizationId: organization.id,
          fullName: playerSpec.fullName,
          position: playerSpec.position,
          dateOfBirth,
          nationality: "CL",
          foot: playerSpec.foot,
          isMinor,
          photoUrl: null,
        },
      });

      players.push(player);
    }

    // Partidos
    const matches = [];
    for (const [index, matchSpec] of spec.matches.entries()) {
      const kickoffAt = new Date(Date.UTC(2026, 2, 7 + index * 7, 20, 0, 0));

      const existing = await prisma.match.findFirst({
        where: { organizationId: organization.id, homeTeam: matchSpec.home, kickoffAt },
      });

      const match =
        existing ??
        (await prisma.match.create({
          data: {
            organizationId: organization.id,
            homeTeam: matchSpec.home,
            awayTeam: matchSpec.away,
            homeScore: 1 + (index % 3),
            awayScore: index % 2,
            kickoffAt,
            competition: matchSpec.competition,
            tier: matchSpec.tier,
            season,
          },
        }));

      matches.push(match);
    }

    // Participaciones: valores plausibles, no espectaculares.
    for (const player of players) {
      for (const [index, match] of matches.entries()) {
        await prisma.appearance.upsert({
          where: { playerId_matchId: { playerId: player.id, matchId: match.id } },
          update: {},
          create: {
            organizationId: organization.id,
            playerId: player.id,
            matchId: match.id,
            minutesPlayed: 70 + ((index * 7) % 21),
            positionPlayed: player.position,
            startedMatch: true,
            goals: player.position === Position.ST ? (index % 2) + 1 : index % 2,
            assists: index % 2,
            shots: player.position === Position.CB ? 0 : 2 + (index % 3),
            keyPasses: 1 + (index % 3),
            passesAttempted: 40 + index * 5,
            passesCompleted: 33 + index * 4,
            progressivePasses: 4 + (index % 4),
            dribblesAttempted: 3 + (index % 4),
            dribblesCompleted: 1 + (index % 3),
            tacklesWon: player.position === Position.DM ? 4 + index : 1 + (index % 2),
            interceptions: player.position === Position.CB ? 3 + index : 1,
            aerialDuelsWon: player.position === Position.CB ? 4 : 1,
            aerialDuelsTotal: player.position === Position.CB ? 6 : 3,
            pressures: 12 + index * 3,
          },
        });
      }
    }
  }

  console.log("\nOrganizaciones sembradas:");
  for (const organization of createdOrgs) {
    console.log(`  ${organization.name.padEnd(16)} ${organization.id}`);
  }
  console.log(
    "\nCopia uno de esos ids en DEV_ORG_ID dentro de .env.local para poder navegar la app\n" +
      "hasta que MM-008 conecte la sesión de usuario.\n"
  );
  console.log(
    "NOTA: la tabla player_ratings queda VACÍA a propósito. El motor de rating es MM-014;\n" +
      "hasta entonces las pantallas muestran 'sin rating' en vez de un número inventado.\n"
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
