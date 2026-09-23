# ManagerMetrics — reglas del proyecto

Contexto: SaaS de scouting y análisis de rendimiento, multi-club.
El Ciclo 1 quedó con el esquema de datos y el código desincronizados; estas reglas
existen para que eso no se repita.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Prisma 5 + PostgreSQL 16 ·
Auth.js v5 (`next-auth@5.0.0-beta.32`, versión exacta) + Argon2id · Tailwind · Vitest

**No hay pruebas end-to-end**: `@playwright/test` no está en `package.json` y no existe
`npm run test:e2e`. Si algún día se añaden, este bloque se actualiza en el mismo commit
que los instala.

## Reglas no negociables

1. **Una sola fuente de verdad de datos**: `prisma/schema.prisma`. Todo campo lleva `@map`
   a snake_case y todo modelo `@@map`. Nunca escribir un nombre de columna a mano en código.
   Única excepción: los campos de `Account` (`refresh_token`, `access_token`, `id_token`…),
   que el adaptador de Auth.js exige con ese nombre exacto.
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

La base de datos de desarrollo es **Postgres 16 en Docker**. No hay base en la nube: el
proyecto de Neon se eliminó el 22-09-2026 junto con su credencial. Cuando llegue el
despliegue habrá que elegir proveedor otra vez; hasta entonces **no existe "producción"**.

```
docker compose up -d                      # levanta mm-postgres en el puerto 5433
docker compose -p managermetrics down     # bajarlo, SIN -v
```

En esta máquina convive otro proyecto en Docker (sistema de asistencia, MySQL, puerto
5002, de la empresa). Están aislados: distinto motor, distinto puerto, proyecto compose
`managermetrics`, contenedor y volumen con prefijo `mm-`. **Nunca** `docker system prune`,
`docker volume prune` ni `docker compose down -v`: son globales o dependen de la carpeta
en que estés, y se llevan el otro proyecto.

**Dos archivos de entorno, y no son intercambiables.** Next.js lee `.env.local` con
prioridad sobre `.env`; **Prisma CLI solo lee `.env`**. Por eso los dos contienen las
mismas cadenas locales de Docker. Ninguno de los dos debe contener jamás una cadena que
apunte fuera de esta máquina: `prisma migrate dev` corre contra lo que diga
`DIRECT_DATABASE_URL`, sin preguntar y sin avisar.

## Comandos

- `npm run verify` — prisma generate && tsc --noEmit && eslint && vitest run
- `npm run build` — build de producción. No despliega nada: compila en `.next/`.
  Next fuerza `NODE_ENV=production` aquí, cosa a tener presente al leer errores.
- `npm run db:migrate` — migración. Usa `DIRECT_DATABASE_URL` de `.env`.
- `npm run seed` — siembra dos organizaciones e imprime sus ids

**`tsc` no basta como verificación.** El type-check incluye `.next/types/**`, que Next
genera en el build. Si esa carpeta está vieja, `tsc` puede dar 0 errores contra tipos de
rutas obsoletos. Antes de cerrar cualquier fase: borrar `.next/` y correr `npm run build`.
Y si `tsc` no cambia de resultado tras editar `tsconfig.json`, sospecha de
`tsconfig.tsbuildinfo` antes que del código.

## Dónde vive cada cosa

- **Repositorio**: `patricio-vera/FUTBOL_MANAGER_APP`
- **Backlog**: Jira, proyecto **MM — ManagerMetrics** (privado, no accesible desde el repo).
  Cuidado: en ese mismo Jira existe el proyecto **KAN**, que es *Sistema de Asistencia* —
  otro proyecto distinto, en Flask/MySQL. No confundirlos.
- **Clave de tickets**: la clave real de Jira (`MM-5`, `MM-18`…) **no coincide** con el
  número del título (`MM-001`, `MM-014`). Los `TODO(MM-0xx)` del código usan el **número
  del título**. Equivalencia: **clave de Jira = número del título + 4**.
  Ejemplo: el ticket titulado `MM-006` es `MM-10` en Jira.

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

**Fase 0 cerrada** — PR #1, merge `f2b318b`. La rama de trabajo actual es `ciclo2/fase-1`.

**Un ticket no se pasa a Finalizada con código escrito.** Se pasa cuando `npm run verify`
corrió en verde en esta máquina. Código en disco sin `prisma generate` reciente no está
verificado: el cliente generado y `prisma/schema.prisma` pueden estar desincronizados y
`tsc` no lo detecta — pasa en silencio porque `@prisma/client` resuelve a `any`.

### Reconocimiento de MM-006 (verificado el 22-09-2026, no asumido)

- `prisma/schema.prisma` **ya tiene** `User`, `Account`, `Session` y `VerificationToken`,
  y `User.passwordHash` existe con `@map("password_hash")`. `Session` ya trae `activeOrgId`.
  **MM-006 no necesita migración de esquema.**
- `@node-rs/argon2` 2.2.1 publica binario precompilado para `win32-x64-msvc` (esta máquina)
  y `linux-x64-gnu` (el runner de CI). No hace falta compilar nada.
- Auth.js v5 sigue en beta: `5.0.0-beta.32`; el `latest` de npm es todavía `next-auth@4.24.15`,
  que es el que se borró en MM-003 por tres vulnerabilidades críticas. No hay alternativa
  estable. Se instala **con versión exacta**, nunca con la etiqueta `@beta` flotante.
- `prisma/seed.ts` crea `owner@managermetrics.test` **sin `passwordHash`**. MM-006 tiene
  que sembrarle una contraseña o el login no tendrá con quién probarse.

**El choque que hay que respetar.** `middleware.ts` exige `Authorization: Bearer <JWT>`
para todo POST/PUT/DELETE bajo `/api/*`. Su `matcher` es solo `/api/:path*` y ya excluye
`/api/auth/`, así que **no bloquea `/login`** y MM-006 se puede implementar sin tocarlo.
Pero en cuanto exista sesión por cookie, cualquier POST desde la interfaz recibirá 401:
el navegador manda cookie, no cabecera. Retirar ese middleware es **MM-008**, no MM-006.
Hasta entonces la interfaz es de solo lectura, a propósito.

Costuras temporales conocidas:

- `lib/auth/active-org.ts` — resuelve la organización activa desde `DEV_ORG_ID`.
  Desaparece en MM-008, cuando la sesión de Auth.js pase a ser la fuente.
- `lib/services/rating-aggregator.service.ts` — solo lee ratings. El motor de cálculo
  es MM-014; hasta entonces `player_ratings` está vacía a propósito.
- `eslint` está fijado en 9.39.5: `eslint-plugin-react@7.37.5` revienta con ESLint 10
  (`context.getFilename is not a function`). Revisar cuando el plugin publique soporte.
- Las tablas `sessions`, `accounts` y `verification_tokens` están **vacías a propósito**.
  MM-006 usa el proveedor Credentials con estrategia `session: { strategy: "jwt" }` —
  Auth.js v5 no soporta sesiones en base de datos con Credentials, así que no hay
  adaptador conectado (`@auth/prisma-adapter` deliberadamente no se instala). Esas tablas
  empiezan a llenarse recién cuando entre OAuth.

## Definición de terminado

Código + test + migración (si aplica) + entrada en `CHANGELOG.md` + ticket movido en Jira.
