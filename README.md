# ManagerMetrics

[![CI](https://github.com/patricio-vera/FUTBOL_MANAGER_APP/actions/workflows/ci.yml/badge.svg)](https://github.com/patricio-vera/FUTBOL_MANAGER_APP/actions/workflows/ci.yml)

SaaS de scouting y análisis de rendimiento futbolístico, multi-club. Está diseñado para
que cada organización —un club, una academia— administre sus jugadores, partidos y métricas
de forma aislada del resto (ese aislamiento todavía no está garantizado por la base de
datos: ver más abajo).

Proyecto en desarrollo activo. **Este README describe lo que realmente funciona hoy**, no
lo que está planificado; lo pendiente está señalado como tal.

---

## Estado actual

**Fase 0 (Estabilización) cerrada. Fase 1 (Autenticación y multi-tenancy) en curso.**

`npm run verify` (tipos, lint y 29 tests) y `npm run build` pasan en verde en local, y
`npm audit --audit-level=high` reporta 0 vulnerabilidades. El workflow de CI
(`.github/workflows/ci.yml`) corre lo mismo contra un Postgres 16 real, más el build de
producción, y tiene un job aparte de auditoría de dependencias que falla ante cualquier
vulnerabilidad alta o crítica.

| Fase | Alcance | Estado |
|---|---|---|
| 0 · Estabilización | Reconciliar modelo de datos, CI real, salir de Next 14 (EOL) | **Cerrada** |
| 1 · Autenticación y multi-tenancy | Login (hecho), organizaciones y roles, autorización por sesión, aislamiento con RLS | **En curso** |
| 2 · Motor de datos y de rating | Modelo híbrido de métricas, algoritmo per-90 con percentiles, cohortes, recálculo | Pendiente |
| 3 · Producto y operación | Paginación por cursor, radar real, observabilidad, rate limiting, planes y cuotas | Pendiente |

### Lo que funciona

**Autenticación.** Login con correo y contraseña sobre Auth.js v5, con hash Argon2id
(`@node-rs/argon2`). La verificación de contraseña se ejecuta siempre, incluso cuando el
correo no existe o la cuenta no tiene contraseña, comparando contra un hash señuelo. Los
tres casos de rechazo (correo inexistente, cuenta sin contraseña, contraseña incorrecta)
devuelven la misma respuesta —comprobado por HTTP contra el servidor de desarrollo— y
hacen el mismo cómputo de Argon2id, con la intención de que el tiempo de respuesta no
revele qué correos están registrados. Esa igualdad de tiempos no se ha medido.

**Consulta de datos.** Jugadores, partidos y métricas, con el contrato HTTP validado con
Zod en el borde y la traducción entre el JSON `snake_case` de la API y el dominio
`camelCase` centralizada en un único módulo.

### Lo que todavía no funciona, dicho claro

**No hay protección contra fuerza bruta en el login.** El formulario acepta intentos
ilimitados. Se cierra en MM-021 (rate limiting y auditoría).

**No hay pruebas end-to-end.** El flujo de autenticación se verificó a mano contra el
servidor de desarrollo por HTTP, reproduciendo el mismo protocolo que usa el formulario
(token CSRF y cookies de sesión). Es una verificación real, pero no corre en CI: si
alguien rompe el login, nada lo detecta automáticamente.

**La interfaz es de solo lectura.** Existe un middleware heredado (`middleware.ts`) que
exige `Authorization: Bearer <JWT>` para cualquier petición bajo `/api/` que no sea
`/api/auth/*` ni un `GET` a las tres rutas públicas de lectura (jugadores, partidos, top
de ratings); en la práctica, todo `POST`, `PUT` y `DELETE`. El navegador envía cookie, no
esa cabecera: un `POST /api/players` con una sesión válida devuelve 401 (comprobado contra
el servidor de desarrollo). Retirar ese middleware y pasar la autorización a la sesión es
MM-008; hasta entonces la aplicación solo consulta, a propósito.

**El aislamiento entre clubes todavía no está garantizado por la base de datos.** La
organización activa se resuelve desde una variable de entorno de desarrollo. Row Level
Security entra en MM-009 y las pruebas negativas de acceso cruzado en MM-010, que es la
puerta de salida de la Fase 1.

**La tabla de ratings está vacía a propósito.** El motor de cálculo es parte de la Fase 2;
hasta entonces las pantallas muestran "sin rating" en vez de un número inventado.

**No hay despliegue.** El proyecto corre solo en local.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 |
| Lenguaje | TypeScript en modo estricto |
| Datos | Prisma ORM 5 · PostgreSQL 16 |
| Autenticación | Auth.js v5 (beta, `next-auth@5.0.0-beta.32` fijado exacto) · Argon2id |
| Estilos | Tailwind CSS 3 |
| Pruebas | Vitest |
| CI | GitHub Actions con servicio `postgres:16` (Node 20) |

---

## Cómo levantarlo en local

Necesitas Node 20.12 o superior (el seed usa `process.loadEnvFile`; Next 16 exige 20.9+) y Docker.

```bash
git clone https://github.com/patricio-vera/FUTBOL_MANAGER_APP.git
cd FUTBOL_MANAGER_APP

# 1. Base de datos (Postgres 16 en el puerto 5433)
docker compose up -d

# 2. Dependencias
npm install

# 3. Variables de entorno
cp .env.example .env.local
# y copia las dos cadenas de conexión también a .env — el CLI de Prisma lee .env,
# no .env.local (esa convención es de Next.js)

# 4. Esquema y datos de ejemplo
npm run db:migrate
npm run seed        # imprime los ids de las dos organizaciones: copia uno a DEV_ORG_ID

# 5. Arrancar
npm run dev
```

Tres variables de `.env.local` merecen atención:

**`AUTH_SECRET`** es obligatoria y necesita al menos 32 caracteres. Genérala con
`openssl rand -base64 32`. Sin ella la app no funciona: la configuración se valida
al importarse y lanza un error que dice qué falta.

**`DEV_SEED_PASSWORD`** es la contraseña que el seed le asigna al usuario de ejemplo
(`owner@managermetrics.test`). Si falta, el seed crea el usuario sin contraseña y avisa
por consola: existirá, pero no podrá iniciar sesión. Cada corrida del seed sobrescribe esa
contraseña con lo que diga la variable en ese momento (o con ninguna, si falta), así que
puedes ponerla después y volver a correrlo. No hay ninguna contraseña por defecto escrita
en el repositorio, a propósito.

**`DEV_ORG_ID`** es la organización activa mientras no exista selección por sesión.
`npm run seed` imprime los ids de las dos organizaciones que crea; copia uno.
Sin ella, las páginas de jugadores y las rutas de datos fallan.

El seed crea **dos organizaciones con datos disjuntos**, y no es decorativo: son los
datos contra los que se prueba el aislamiento entre clubes en MM-010.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run verify` | `prisma generate` → `tsc --noEmit` → `eslint` → `vitest`. Es la puerta de calidad. |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:migrate` | `prisma migrate dev`: crea (si el esquema cambió) y aplica migraciones |
| `npm run db:studio` | Explorador visual de la base |
| `npm run seed` | Siembra dos organizaciones e imprime sus ids |

---

## Cómo está organizado

```
app/                 Rutas y API (App Router)
middleware.ts        Middleware heredado de autorización por Bearer (se retira en MM-008)
lib/
  api/               Contrato HTTP: validación Zod y mapeo wire ↔ dominio
  auth/              Auth.js, hash de contraseñas, organización activa (costura temporal)
  db/                Instancia única del cliente de Prisma
  domain/            Lógica pura, sin dependencias de infraestructura
  services/          Acceso a datos — lo único de la app que usa el cliente de Prisma
  env.ts             Validación de variables de entorno
prisma/              Esquema, migraciones y seed
tests/               Preparación del entorno de Vitest (los tests viven junto al código)
docker-compose.yml   Postgres 16 local
.github/workflows/   CI
```

Cuatro decisiones de diseño que explican esa forma:

**Ninguna página consulta la base directamente.** Todo pasa por `lib/services/*`, y cada
servicio recibe el `orgId` como primer argumento. Una consulta de negocio sin
organización es un fallo de aislamiento entre clubes, no un descuido.

**La única excepción es la búsqueda de usuario por correo**, que no lleva organización.
La identidad es global —una persona puede pertenecer a varios clubes— y la pertenencia
vive en `memberships`. Está documentado en el propio archivo para que no se lea como un
fallo de aislamiento.

**El JSON de la API es `snake_case`; el dominio es `camelCase`.** La traducción vive en
`lib/api/schemas.ts` como funciones con nombre. Nunca se pasa el cuerpo de una petición
directo a Prisma.

**La configuración se valida al importarse.** `lib/env.ts` comprueba las variables de
entorno con Zod; si falta una, lanza un error que dice cuál, en vez de fallar más tarde
dentro de una ruta.

### Tablas vacías a propósito

`sessions`, `accounts` y `verification_tokens` existen en el esquema pero todavía no se
usan. Auth.js v5 no admite sesiones en base de datos junto al proveedor de credenciales,
así que la sesión va en un JWT firmado y no hay adaptador conectado. Esas tablas empiezan
a llenarse cuando entre OAuth.

---

## Sobre el Ciclo 1 y por qué existe el Ciclo 2

La primera versión cerró declarándose "sin errores de compilación ni de tipado". No era
cierto, y el motivo es interesante: `prisma generate` nunca se había ejecutado, así que
`@prisma/client` resolvía a `any` y la comprobación de tipos no validaba nada. Detrás de
esa pantalla verde había 17 nombres de campo que no existían en el esquema.

Una auditoría del repositorio encontró eso y otros hallazgos, entre ellos que la
configuración de autenticación no permitía iniciar sesión por ningún camino —no tenía
proveedores declarados— y que el optimizador de imágenes aceptaba cualquier host de
internet, funcionando como proxy abierto.

El Ciclo 2 es el trabajo de corregirlos por fases, cada una con una puerta de salida
verificable, y de construir la infraestructura que hace imposible repetir el error: el CI
ejecuta `prisma generate` **antes** de comprobar tipos, y el linter rechaza `any` y
`@ts-ignore`.

Ese es el sentido de [`CLAUDE.md`](./CLAUDE.md) —las reglas que este código se impone,
derivadas de lo que salió mal— y de [`CHANGELOG.md`](./CHANGELOG.md), que registra qué se
corrigió y por qué. Parte de esas reglas las hace cumplir la máquina (tipos, `any`,
`@ts-ignore`, tests y auditoría de dependencias); otras, como pasar siempre por
`lib/services` con `orgId` o no mostrar datos inventados, son convención revisada a mano.

---

## Licencia

Sin licencia de uso definida todavía.
