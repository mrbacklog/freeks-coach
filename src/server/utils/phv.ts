import { isInPhvVenster, mirwaldOffset } from "./mirwald";

export interface PhvResult {
  maturityOffset: number;
  estimatedPhvAge: number;
  phvStatus: "pre" | "near" | "post";
  message: string;
  plyoCaution: boolean;
  phvVensterActief: boolean;
}

export function calculatePhv(
  heightCm: number,
  weightKg: number,
  sittingHeightCm: number,
  ageDays: number,
): PhvResult {
  const ageYears = ageDays / 365.25;
  const maturityOffset = mirwaldOffset(heightCm, sittingHeightCm, weightKg, ageYears);

  if (maturityOffset === null) {
    return {
      maturityOffset: 0,
      estimatedPhvAge: 0,
      phvStatus: "pre",
      message: "Onvoldoende gegevens voor PHV-schatting. Voeg zithoogte toe bij je metingen.",
      plyoCaution: false,
      phvVensterActief: false,
    };
  }

  const estimatedPhvAge = ageYears - maturityOffset;
  const phvVensterActief = isInPhvVenster(maturityOffset);

  let phvStatus: PhvResult["phvStatus"];
  let message: string;
  let plyoCaution: boolean;

  if (maturityOffset < -1.0) {
    phvStatus = "pre";
    message = "Je bent nog ruim voor je groeipiek. Bouw kracht op met veilige basisoefeningen.";
    plyoCaution = false;
  } else if (maturityOffset <= 1.0) {
    phvStatus = "near";
    message =
      "Je zit waarschijnlijk in je groeispurt. Extra voorzichtig met plyometrie — je gewrichten zijn kwetsbaarder.";
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
    phvVensterActief,
  };
}

export function calculateAsymmetry(left: number, right: number): number {
  const maxVal = Math.max(left, right);
  if (maxVal === 0) return 0;
  return Math.abs(left - right) / maxVal;
}
