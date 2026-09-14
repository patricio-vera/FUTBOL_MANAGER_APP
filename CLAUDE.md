# ManagerMetrics — reglas del proyecto

Contexto: SaaS de scouting y análisis de rendimiento, multi-club.
El Ciclo 1 quedó con el esquema de datos y el código desincronizados; estas reglas
existen para que eso no se repita.

## Stack

Next.js (App Router) · TypeScript strict · Prisma + PostgreSQL (Neon) · Auth.js v5 · Tailwind · Vitest + Playwright

## Reglas no negociables

1. **Una sola fuente de verdad de datos**: `prisma/schema.prisma`. Todo campo lleva `@map`
   a snake_case y todo modelo `@@map`. Nunca escribir un nombre de columna a mano en código.
2. **Nada de `any`, `as any`, `@ts-ignore`.** Si el tipo no cierra, el modelo de datos está mal.
3. **Ningún componente de página consulta Prisma directamente.** Siempre a través de `lib/services/*`.
4. **Todo servicio recibe `orgId` como primer argumento.** Una consulta de negocio sin
   organización es un bug de seguridad, no un descuido. Cuando MM-009 aterrice, el acceso
   pasará además por `getTenantDb(orgId)` y RLS.
5. **El JSON de la API es snake_case; el dominio es camelCase.** La traducción vive en
   `lib/api/schemas.ts` como funciones con nombre. **Prohibido** `prisma.x.create({ data: { ...body } })`:
   ese spread es exactamente lo que rompió el Ciclo 1.
6. **Sin datos inventados en la UI.** Si no hay dato, se muestra estado vacío explícito.
   Prohibidos los valores de relleno tipo `?? 70`.
7. **Dinero y ratings en `Decimal`**, nunca `Float`.
8. **Nada de borrado físico sobre historial.** Baja lógica con `deletedAt`.
9. Validación de entrada con Zod en el borde, incluidos los `searchParams`.
   Tipos derivados con `z.infer`, nunca escritos dos veces.
10. Cada PR: `npm run verify` en verde. Sin excepciones.

## Comandos

- `npm run verify` — prisma generate && tsc --noEmit && eslint && vitest run
- `npm run db:migrate` — migración con la conexión **directa** de Neon (`DIRECT_DATABASE_URL`)
- `npm run seed` — siembra dos organizaciones e imprime sus ids
- `npm run test:e2e` — Playwright

## Estado del Ciclo 2

El backlog vive en Jira (proyecto KAN), en cuatro fases con puerta de salida cada una.
Los `TODO(MM-0xx)` del código apuntan al ticket que los cierra. No borrar un TODO sin
cerrar su ticket.

Costuras temporales conocidas:

- `lib/auth/active-org.ts` — resuelve la organización activa desde `DEV_ORG_ID`.
  Desaparece en MM-008, cuando la sesión de Auth.js pase a ser la fuente.
- `lib/services/rating-aggregator.service.ts` — solo lee ratings. El motor de cálculo
  es MM-014; hasta entonces `player_ratings` está vacía a propósito.

## Definición de terminado

Código + test + migración (si aplica) + entrada en `CHANGELOG.md` + ticket movido en Jira.
