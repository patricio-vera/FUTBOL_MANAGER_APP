import { describe, it, expect } from "vitest";
import { isOptimizableImageUrl } from "./images";

// El allowlist de los tests es "cdn.managermetrics.test" (ver tests/setup.ts).
describe("isOptimizableImageUrl", () => {
  it("acepta hosts declarados en el allowlist", () => {
    expect(isOptimizableImageUrl("https://cdn.managermetrics.test/p/1.jpg")).toBe(true);
  });

  it("rechaza cualquier otro host", () => {
    // Exactamente lo que el comodín hostname:"**" permitía antes.
    expect(isOptimizableImageUrl("https://tmssl.akamaized.net/foto.jpg")).toBe(false);
    expect(isOptimizableImageUrl("https://evil.example.com/payload.png")).toBe(false);
  });

  it("rechaza http, aunque el host esté permitido", () => {
    expect(isOptimizableImageUrl("http://cdn.managermetrics.test/p/1.jpg")).toBe(false);
  });

  it("no revienta con datos basura guardados en base", () => {
    expect(isOptimizableImageUrl("no-es-una-url")).toBe(false);
    expect(isOptimizableImageUrl("")).toBe(false);
    expect(isOptimizableImageUrl(null)).toBe(false);
    expect(isOptimizableImageUrl(undefined)).toBe(false);
  });
});
