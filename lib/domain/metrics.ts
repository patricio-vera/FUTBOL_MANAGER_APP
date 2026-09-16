// =============================================================================
// VOCABULARIO DE MÉTRICAS NÚCLEO
// =============================================================================
// Vive en la capa de dominio, sin dependencia de Prisma, para que el contrato de
// la API (lib/api/schemas.ts) pueda importarlo sin arrastrar el cliente de base
// de datos a cada test.
//
// Cada clave coincide 1:1 con una columna tipada de `Appearance` y con una fila
// de `MetricDefinition`.
// =============================================================================

export const CORE_METRIC_COLUMNS = [
  "goals",
  "assists",
  "shots",
  "keyPasses",
  "passesAttempted",
  "passesCompleted",
  "progressivePasses",
  "dribblesAttempted",
  "dribblesCompleted",
  "tacklesWon",
  "interceptions",
  "aerialDuelsWon",
  "aerialDuelsTotal",
  "pressures",
] as const;

export type CoreMetricColumn = (typeof CORE_METRIC_COLUMNS)[number];

/** camelCase del dominio -> snake_case del contrato público de la API. */
export function toWireKey(column: string): string {
  return column.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
