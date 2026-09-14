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

## Entorno local

La base de datos de desarrollo es **Postgres 16 en Docker**, no Neon. Neon queda solo
para despliegue.

```
docker compose up -d          # levanta mm-postgres en el puerto 5433
docker compose -p managermetrics down   # bajarlo, SIN -v
```

En esta máquina convive otro proyecto en Docker (sistema de asistencia, MySQL, puerto
5002, de la empresa). Están aislados: distinto motor, distinto puerto, proyecto compose
`managermetrics`, contenedor y volumen con prefijo `mm-`. **Nunca** `docker system prune`,
`docker volume prune` ni `docker compose down -v`: son globales o dependen de la carpeta
en que estés, y se llevan el otro proyecto.

**Dos archivos de entorno, y no son intercambiables.** Next.js lee `.env.local` con
prioridad sobre `.env`; **Prisma CLI solo lee `.env`**. Por eso los dos contienen las
mismas cadenas locales de Docker. Las credenciales de Neon viven en
`.env.local.neon-backup` (ignorado por git) y, cuando se despliegue, en el panel del
proveedor — nunca de vuelta en `.env`, o una `prisma migrate dev` distraída corre contra
producción.

## Comandos

- `npm run verify` — prisma generate && tsc --noEmit && eslint && vitest run
- `npm run build` — build de producción. No despliega nada: compila en `.next/`.
  Next fuerza `NODE_ENV=production` aquí, cosa a tener presente al leer errores.
- `npm run db:migrate` — migración. Usa `DIRECT_DATABASE_URL` de `.env`.
- `npm run seed` — siembra dos organizaciones e imprime sus ids
- `npm run test:e2e` — Playwright

**`tsc` no basta como verificación.** El type-check incluye `.next/types/**`, que Next
genera en el build. Si esa carpeta está vieja, `tsc` puede dar 0 errores contra tipos de
rutas obsoletos. Antes de cerrar cualquier fase: borrar `.next/` y correr `npm run build`.
Y si `tsc` no cambia de resultado tras editar `tsconfig.json`, sospecha de
`tsconfig.tsbuildinfo` antes que del código.

## Dónde vive cada cosa

## Dónde vive cada cosa

- **Repositorio**: `patricio-vera/FUTBOL_MANAGER_APP`
- **Backlog**: Jira, proyecto **MM — ManagerMetrics** (privado, no accesible desde el repo).
  Cuidado: en ese mismo Jira existe el proyecto **KAN**, que es *Sistema de Asistencia* —
  otro proyecto distinto, en Flask/MySQL. No confundirlos.
- **Clave de tickets**: la clave real de Jira (`MM-5`, `MM-18`…) no coincide con el número
  del título (`MM-001`, `MM-014`)...
  
## Estado del Ciclo 2

El backlog está en cuatro fases con puerta de salida cada una:

| Fase | Épica | Tickets | Puerta de salida |
|---|---|---|---|
| 0 · Estabilización | MM-1 | MM-001…005 | `generate && tsc && eslint && audit` verde en Actions contra Postgres real |
| 1 · Auth y multi-tenancy | MM-2 | MM-006…010 | Desde el club A, una consulta a datos del club B devuelve cero filas |
| 2 · Motor de rating | MM-3 | MM-011…016 | `goals_per90 = 0,8` con p95 = 0,9 da percentil alto, no 0 |
| 3 · Producto y operación | MM-4 | MM-017…022 | Ninguna pantalla muestra un número que no venga de la base |

Los `TODO(MM-0xx)` del código apuntan al ticket que los cierra. No borrar un TODO sin
cerrar su ticket.

**Orden real de la Fase 0 → Fase 1.** MM-003 (salida de Next 14) no es opcional ni
posponible: `package.json` trae `next-auth@4`, y MM-006 exige Auth.js v5. MM-006 no puede
empezar antes de que MM-003 esté cerrado.

**Un ticket no se pasa a Finalizada con código escrito.** Se pasa cuando `npm run verify`
corrió en verde en esta máquina. Código en disco sin `prisma generate` reciente no está
verificado: el cliente generado y `prisma/schema.prisma` pueden estar desincronizados y
`tsc` no lo detecta — pasa en silencio porque `@prisma/client` resuelve a `any`.

Costuras temporales conocidas:

- `lib/auth/active-org.ts` — resuelve la organización activa desde `DEV_ORG_ID`.
  Desaparece en MM-008, cuando la sesión de Auth.js pase a ser la fuente.
- `lib/services/rating-aggregator.service.ts` — solo lee ratings. El motor de cálculo
  es MM-014; hasta entonces `player_ratings` está vacía a propósito.

## Definición de terminado

Código + test + migración (si aplica) + entrada en `CHANGELOG.md` + ticket movido en Jira.
