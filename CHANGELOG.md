# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las entradas se agrupan por fase del Ciclo 2. Cada una nombra el ticket que la cierra.

## [Sin publicar] — Fase 1 · Autenticación y multi-tenancy

En curso. Ticket activo: **MM-006** (login con Auth.js v5 + Argon2id).

### Añadido

- **MM-006** · Login por credenciales con Auth.js v5 (`next-auth@5.0.0-beta.32`, versión
  exacta) y sesión JWT. Sin OAuth, sin adaptador de base de datos: con el proveedor
  Credentials, Auth.js v5 no soporta sesiones en base de datos.
- **MM-006** · `lib/auth/password.ts`: `hashPassword`/`verifyPassword` sobre
  `@node-rs/argon2` (Argon2id, parámetros por defecto). `verifyPassword` compara contra un
  hash señuelo cuando no hay hash real, para que el tiempo de respuesta no delate qué
  correos están registrados.
- **MM-006** · `lib/services/user.service.ts`: `findUserByEmail`, única excepción
  documentada a la regla 4 de `CLAUDE.md` — la identidad de usuario es global, la
  pertenencia a organización vive en `Membership`.
- **MM-006** · `app/login/page.tsx` conectado de verdad: valida con Zod, llama a
  `signIn("credentials")`, mismo mensaje de error para correo inexistente y contraseña
  incorrecta. `app/layout.tsx` muestra el email de la sesión y un botón de cerrar sesión.
- **MM-006** · `DEV_SEED_PASSWORD` (opcional, en `.env.local`): si existe, `prisma/seed.ts`
  hashea y se la asigna a `owner@managermetrics.test`; si no, `passwordHash` queda `null`
  y el seed avisa por consola. Ninguna contraseña se escribe en el repositorio.

### Corregido

- `CLAUDE.md` declaraba Neon y Playwright en el stack. Ninguno de los dos existe en el
  proyecto: el proyecto de Neon se eliminó y `@playwright/test` nunca se instaló.
- `CLAUDE.md` tenía la sección «Dónde vive cada cosa» duplicada y la regla de equivalencia
  de claves de Jira truncada a mitad de frase — justo la regla que evita tocar el ticket
  equivocado.
- **MM-006** · `lib/env.ts`: `AUTH_SECRET` pasa a obligatoria; se retira el alias
  `NEXTAUTH_SECRET` (NextAuth v4 se borró en MM-003, el alias ya no tenía sentido).
- **MM-006** · `npm run seed` no podía importar nada de `lib/` con el alias `@/`:
  `tsconfig-paths` estaba instalado pero nunca conectado al script. Ahora sí.
- **MM-006** · Next 16 reescribe un bloque en `CLAUDE.md` en cada `next dev` (avisos de
  breaking changes para agentes de IA). Desactivado con `agentRules: false` en
  `next.config.js`: `CLAUDE.md` es un documento mantenido a mano.

### Cambiado

- **MM-006** · `app/layout.tsx` llama a `auth()` para mostrar el email de la sesión y el
  botón de cerrar sesión. Efecto colateral: `npm run build` ya no pre-renderiza NINGUNA
  ruta como estática (antes `/`, `/matches`, `/ratings/top` y `/reclutamiento` sí lo
  hacían) — toda la app pasa a `ƒ` (dinámica). Es el patrón estándar de Auth.js v5 para
  un nav consciente de sesión; se deja anotado por si en algún momento conviene acotar el
  alcance de `auth()` a una parte más chica del árbol.

### Eliminado

- `SETUP_DATABASE.md`: documentaba el alta en Neon y variables (`JWT_SECRET`,
  `NEXTAUTH_URL`, `JWT_EXPIRY`) que `lib/env.ts` ya no reconoce. Contradecía a `CLAUDE.md`
  en todos sus puntos. El arranque local vive ahora en `CLAUDE.md` y `docker-compose.yml`.
- Proyecto de Neon `futbol_manager_app` y su credencial, dados de baja: el proyecto
  no tiene despliegue y no hay razón para mantener una cadena de conexión viva.

## [Fase 0] — Estabilización — 2026-09-14

Cerrada. PR #1, merge `f2b318b`. Épica MM-1.

### Contexto

El Ciclo 1 se declaró cerrado «sin errores de compilación ni de tipado». No era cierto:
`prisma generate` nunca se había ejecutado, así que `@prisma/client` resolvía a `any` y la
comprobación de tipos no validaba nada. Detrás de esa pantalla verde había 17 nombres de
campo que no existían en el esquema.

Cuatro tickets figuraban «En revisión» sobre código escrito el 10 de septiembre que
**nunca se había ejecutado**: cliente de Prisma obsoleto (3 KB frente a 21 KB), vitest sin
instalar, migración antigua presente y ningún workflow de CI.

### Añadido

- **MM-002** · Workflow de GitHub Actions con servicio `postgres:16` y dos trabajos,
  `verify` y `audit`. El orden importa: `prisma generate` corre **antes** que `tsc`.
- **MM-002** · `docker-compose.yml` con proyecto `managermetrics` y puerto 5433, aislado
  del proyecto MySQL de la empresa que convive en la misma máquina.
- **MM-004** · `lib/env.ts`: validación de todas las variables de entorno con Zod en el
  momento del import. Si falta una, el proceso muere diciendo cuál.
- **MM-004** · `.env.example` documentado.

### Cambiado

- **MM-003** · Next.js 14 (fin de soporte) → 16.3.5; React 19; Turbopack.
- **MM-003** · `.eslintrc.json` → `eslint.config.mjs` (flat config).
- **MM-003** · vitest 2.1.9 → 4.1.11: arrastraba vite/esbuild/vite-node vulnerables.
  Con esto, `npm audit` cerró en 0 (venía de 5 tras retirar NextAuth y aplicar
  `npm audit fix`; el total al empezar MM-003 era 20).
- **MM-004** · La comprobación de cadenas pooled/directa se ató al **proveedor**
  (el host contiene `neon.tech`) en lugar de a `NODE_ENV`, que impedía compilar en local.

### Corregido

- **MM-001** · Esquema, código y migración reconciliados.
- **MM-005** · `next.config.js` tenía `hostname: "**"` en `remotePatterns`, lo que
  convertía el optimizador de imágenes en un proxy abierto hacia cualquier host de
  internet. Sustituido por una lista blanca explícita (`IMAGE_HOST_ALLOWLIST`).
- ESLint no aplicaba la regla 2 de `CLAUDE.md`: faltaba declarar el plugin
  `@typescript-eslint`, así que `no-explicit-any` y `ban-ts-comment` no se evaluaban.
- `.env` apuntaba a la base de producción sin `DIRECT_DATABASE_URL`. Reescrito a Docker
  local antes de que una `prisma migrate dev` corriera contra datos reales.
- `authOptions` se exportaba desde `app/api/auth/[...nextauth]/route.ts`; en App Router un
  archivo de ruta solo puede exportar manejadores HTTP.
- `app/players` se prerenderizaba en el build y chocaba con el bloqueo de producción de
  `getActiveOrgId()`. Marcado `export const dynamic = "force-dynamic"`.

### Eliminado

- **MM-003** · NextAuth v4 completo. No tenía proveedores declarados: no permitía iniciar
  sesión por ningún camino, y ahí vivían tres de las vulnerabilidades críticas.
