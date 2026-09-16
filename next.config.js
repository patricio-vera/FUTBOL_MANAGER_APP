// =============================================================================
// CONFIGURACIÓN DE NEXT — MM-005
// =============================================================================
// Se elimina `remotePatterns: [{ protocol: "https", hostname: "**" }]`.
// Ese comodín convertía el optimizador de imágenes del despliegue en un proxy
// abierto: cualquiera podía hacer que tu servidor descargara y cacheara
// imágenes de cualquier host de internet, a tu costo y desde tu IP.
//
// Ahora la lista es explícita y viene de IMAGE_HOST_ALLOWLIST (hosts separados
// por coma). Vacía por defecto: mientras no exista el bucket propio de fotos,
// lo correcto es no servir imágenes remotas en absoluto.
// =============================================================================

const imageHosts = (process.env.IMAGE_HOST_ALLOWLIST ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

/**
 * Cabeceras de seguridad.
 * `unsafe-inline` en estilos es necesario mientras Tailwind inyecte estilos en
 * línea; `unsafe-eval` solo en desarrollo, que es lo que usa el hot reload.
 * TODO(MM-020): pasar a CSP con nonce por petición.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data:${imageHosts.length ? ` ${imageHosts.map((h) => `https://${h}`).join(" ")}` : ""}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname })),
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Nota: se elimina `experimental.serverActions.allowedOrigins: ["localhost:3000"]`.
// Esa lista es la de orígenes permitidos para Server Actions; fijada a localhost
// rompe cualquier despliegue real.

module.exports = nextConfig;
