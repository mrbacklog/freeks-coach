export interface PhvResult {
  maturityOffset: number; // years (negative = before PHV, positive = after PHV)
  estimatedPhvAge: number; // estimated age at PHV
  phvStatus: "pre" | "near" | "post"; // pre-PHV, near PHV (within 1 year), post-PHV
  message: string;
  plyoCaution: boolean;
}

export function calculatePhv(
  heightCm: number,
  weightKg: number,
  sittingHeightCm: number,
  ageDays: number, // age in days
): PhvResult {
  const ageYears = ageDays / 365.25;
  const legLength = heightCm - sittingHeightCm;

  // Mirwald 2002 formula for boys
  const maturityOffset =
    -9.236 +
    0.0002708 * (legLength * sittingHeightCm) -
    0.001663 * (ageYears * legLength) +
    0.007216 * (ageYears * sittingHeightCm) +
    0.02292 * ((weightKg / heightCm) * 100);

  const estimatedPhvAge = ageYears - maturityOffset;

  let phvStatus: PhvResult["phvStatus"];
  let message: string;
  let plyoCaution: boolean;

  if (maturityOffset < -1) {
    phvStatus = "pre";
    message = "Je bent nog ruim voor je groeipiek. Bouw kracht op met veilige basisoefeningen.";
    plyoCaution = false;
  } else if (maturityOffset < 1) {
    phvStatus = "near";
    message = "Je nadert waarschijnlijk je groeipiek. Wees extra voorzichtig met plyometrie.";
    plyoCaution = true;
  } else {
    phvStatus = "post";
    message = "Je groeipiek ligt achter je. Je lichaam is stabiel voor alle oefenvormen.";
    plyoCaution = false;
  }

  return {
    maturityOffset: Math.round(maturityOffset * 10) / 10,
    estimatedPhvAge: Math.round(estimatedPhvAge * 10) / 10,
    phvStatus,
    message,
    plyoCaution,
  };
}

export function calculateAsymmetry(left: number, right: number): number {
  const maxVal = Math.max(left, right);
  if (maxVal === 0) return 0;
  return Math.abs(left - right) / maxVal;
}
