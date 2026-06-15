export function mirwaldOffset(
  lengteCm: number | null,
  zithoogteCm: number | null,
  gewichtKg: number | null,
  leeftijdDec: number | null,
): number | null {
  if (
    lengteCm === null ||
    zithoogteCm === null ||
    gewichtKg === null ||
    leeftijdDec === null
  ) {
    return null;
  }

  const beenlengte = lengteCm - zithoogteCm;

  return (
    -9.236 +
    0.0002708 * (beenlengte * zithoogteCm) -
    0.001663 * (leeftijdDec * beenlengte) +
    0.007216 * (leeftijdDec * zithoogteCm) +
    0.02292 * ((gewichtKg / lengteCm) * 100)
  );
}

export function isInPhvVenster(offset: number): boolean {
  return offset >= -1.0 && offset <= 1.0;
}

export function formatPhvDisplay(offset: number): string {
  if (offset < -1.0) {
    const maanden = Math.round(Math.abs(offset) * 12);
    return `Geschatte afstand tot PHV: over ~${maanden} maanden`;
  }
  if (offset <= 1.0) {
    return "Je zit waarschijnlijk in je groeispurt — wees voorzichtig met zware sprongen.";
  }
  const maandenGeleden = Math.round((offset - 1.0) * 12);
  return `Je groeispurt ligt ~${maandenGeleden} maanden achter je.`;
}
