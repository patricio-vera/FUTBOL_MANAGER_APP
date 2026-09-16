// Entorno mínimo para que lib/env.ts valide en los tests unitarios.
// No hay base de datos detrás: los tests que la necesiten son de integración
// y se levantan con el Postgres del workflow de CI.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/test";
process.env.DIRECT_DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/test";
process.env.AUTH_SECRET ??= "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres";
process.env.IMAGE_HOST_ALLOWLIST ??= "cdn.managermetrics.test";
