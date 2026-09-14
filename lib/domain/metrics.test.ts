import { describe, it, expect } from "vitest";
import { CORE_METRIC_COLUMNS, toWireKey } from "./metrics";

describe("vocabulario de métricas núcleo", () => {
  it("no tiene claves repetidas", () => {
    expect(new Set(CORE_METRIC_COLUMNS).size).toBe(CORE_METRIC_COLUMNS.length);
  });

  it("todas las claves son camelCase", () => {
    for (const column of CORE_METRIC_COLUMNS) {
      expect(column).toMatch(/^[a-z][a-zA-Z]*$/);
    }
  });

  it("traduce camelCase del dominio a snake_case del wire", () => {
    expect(toWireKey("dribblesCompleted")).toBe("dribbles_completed");
    expect(toWireKey("aerialDuelsTotal")).toBe("aerial_duels_total");
    expect(toWireKey("goals")).toBe("goals");
  });

  it("la traducción es inyectiva: dos métricas nunca colisionan en el wire", () => {
    const wireKeys = CORE_METRIC_COLUMNS.map(toWireKey);
    expect(new Set(wireKeys).size).toBe(wireKeys.length);
  });
});
