import { describe, it, expect } from "vitest";
import { ageFromDateOfBirth, isMinorAt } from "./age";

const at = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

describe("ageFromDateOfBirth", () => {
  it("devuelve null si no hay fecha de nacimiento", () => {
    expect(ageFromDateOfBirth(null, at("2026-09-10"))).toBeNull();
  });

  it("no cuenta el cumpleaños hasta que llega", () => {
    const dob = at("2000-12-31");
    expect(ageFromDateOfBirth(dob, at("2026-12-30"))).toBe(25);
    expect(ageFromDateOfBirth(dob, at("2026-12-31"))).toBe(26);
  });

  it("resuelve bien el cambio de mes", () => {
    const dob = at("2004-03-15");
    expect(ageFromDateOfBirth(dob, at("2026-02-28"))).toBe(21);
    expect(ageFromDateOfBirth(dob, at("2026-03-15"))).toBe(22);
  });

  it("la edad no se congela: el mismo dato envejece con el tiempo", () => {
    // Este es el bug del Ciclo 1: `age Int` guardaba 17 para siempre.
    const dob = at("2008-01-01");
    expect(ageFromDateOfBirth(dob, at("2026-01-01"))).toBe(18);
    expect(ageFromDateOfBirth(dob, at("2029-01-01"))).toBe(21);
  });
});

describe("isMinorAt", () => {
  it("marca menores de 18", () => {
    expect(isMinorAt(at("2009-06-01"), at("2026-09-10"))).toBe(true);
    expect(isMinorAt(at("2008-06-01"), at("2026-09-10"))).toBe(false);
  });

  it("sin fecha de nacimiento no se asume que sea menor", () => {
    expect(isMinorAt(null, at("2026-09-10"))).toBe(false);
  });
});
