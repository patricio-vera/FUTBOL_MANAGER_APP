// =============================================================================
// ESLINT — flat config (ESLint 9+, MM-003)
// =============================================================================
// eslint-config-next/core-web-vitals ya es un array de flat config: incluye un
// bloque `next/typescript` que registra el plugin @typescript-eslint (vía el
// paquete `typescript-eslint`) para .ts/.tsx. Antes, con el .eslintrc.json
// legado, había que registrar ese plugin a mano porque next/core-web-vitals
// solo configuraba el parser, no el plugin — acá ya viene resuelto.
//
// Las dos reglas de abajo son el gate contra `any` y `@ts-ignore` (regla 2 de
// CLAUDE.md). Si se pierden en una futura migración de config, se pierde ese
// gate en silencio: `npm run verify` seguiría en verde con un `any` adentro.
// =============================================================================

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "coverage/**"],
  },
];

export default eslintConfig;
