# 🗄️ Configuración de Base de Datos — Scouting & Performance Analytics Hub

## ⚡ Opción A: Neon (PostgreSQL gratuito en la nube) — RECOMENDADO

**Tiempo estimado: 2-3 minutos**

1. Ve a https://neon.tech y crea una cuenta gratuita (con GitHub)
2. Crea un nuevo proyecto → nombre: `futbol-manager`
3. En el dashboard, copia el **Connection String** que tiene este formato:
   ```
   postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. Crea el archivo `.env.local` en la raíz del proyecto con este contenido:
   ```env
   DATABASE_URL="postgresql://TU_USER:TU_PASSWORD@TU_HOST/neondb?sslmode=require"
   NEXTAUTH_SECRET="dev-secret-change-this-min-32-characters-long-abc"
   NEXTAUTH_URL="http://localhost:3000"
   JWT_SECRET="dev-jwt-secret-change-this-in-production-abc"
   JWT_EXPIRY="7d"
   ```

5. Ejecuta en la terminal de VS Code:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```

6. Abre http://localhost:3000/api/players para ver los datos ✅

---

## 💻 Opción B: PostgreSQL Local

**Tiempo estimado: 10-15 minutos**

1. Descarga el instalador: https://www.postgresql.org/download/windows/
   - Versión recomendada: PostgreSQL 16
   - Durante la instalación: password = `postgres`, puerto = `5432`

2. Abre pgAdmin o la terminal y ejecuta:
   ```sql
   CREATE DATABASE futbol_manager;
   ```

3. Crea el archivo `.env.local` en la raíz del proyecto:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/futbol_manager?schema=public"
   NEXTAUTH_SECRET="dev-secret-change-this-min-32-characters-long-abc"
   NEXTAUTH_URL="http://localhost:3000"
   JWT_SECRET="dev-jwt-secret-change-this-in-production-abc"
   JWT_EXPIRY="7d"
   ```

4. Ejecuta en la terminal de VS Code:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```

---

## 🔍 Verificar que el seed funcionó

Después del seed, estos endpoints deben devolver datos:

| URL | Descripción |
|-----|-------------|
| http://localhost:3000/api/players | Lista los 5 jugadores |
| http://localhost:3000/api/players?position=LW | Filtra por posición |
| http://localhost:3000/api/matches | Lista los 6 partidos |
| http://localhost:3000/api/ratings/top | Top ratings con radar_snapshot |

---

## 📊 Prisma Studio (visualizador de BD)

Para ver los datos visualmente como pgAdmin pero para Prisma:
```bash
npx prisma studio
```
Abre http://localhost:5555 con interfaz gráfica de todas las tablas.

---

## 🔑 Generar NEXTAUTH_SECRET seguro

En la terminal de VS Code:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
