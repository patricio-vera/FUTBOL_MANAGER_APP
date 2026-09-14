/**
 * La edad se DERIVA de la fecha de nacimiento; nunca se almacena.
 * El schema anterior guardaba `age Int`, que envejece mal desde el día que se
 * escribe: un jugador registrado con 17 años sigue teniendo 17 tres años después.
 */
export function ageFromDateOfBirth(
  dateOfBirth: Date | null,
  reference: Date = new Date()
): number | null {
  if (!dateOfBirth) return null;

  let age = reference.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDelta = reference.getUTCMonth() - dateOfBirth.getUTCMonth();

  if (monthDelta < 0 || (monthDelta === 0 && reference.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }

  return age;
}

/** Marca de menor de edad, usada para el control de consentimiento (art. 8 GDPR). */
export function isMinorAt(dateOfBirth: Date | null, reference: Date = new Date()): boolean {
  const age = ageFromDateOfBirth(dateOfBirth, reference);
  return age !== null && age < 18;
}
