export type VermoeidheidsRichting = "stijgend" | "stabiel" | "dalend";
export type AdherentieNiveau = "hoog" | "matig" | "laag";

export interface TrendResult {
  vermoeidheid: VermoeidheidsRichting;
  adherentie: AdherentieNiveau;
  overreaching: boolean;
  signaal: "ok" | "caution" | "warn";
  boodschap: string | null;
}

// Vermoeidheidsscores (1-5) per week, chronologisch oudste eerst
export function vermoeidheidsTrend(weekScores: number[]): VermoeidheidsRichting {
  if (weekScores.length < 2) return "stabiel";

  const n = weekScores.length;
  const xGem = (n - 1) / 2;
  const yGem = weekScores.reduce((s, v) => s + v, 0) / n;
  let teller = 0;
  let noemer = 0;
  for (let i = 0; i < n; i++) {
    teller += (i - xGem) * (weekScores[i] - yGem);
    noemer += (i - xGem) ** 2;
  }
  const slope = noemer === 0 ? 0 : teller / noemer;

  if (slope > 0.2) return "stijgend";
  if (slope < -0.2) return "dalend";
  return "stabiel";
}

// Adherentiescores (0.0-1.0) per week, chronologisch oudste eerst
export function adherentieTrend(weekScores: number[]): AdherentieNiveau {
  if (weekScores.length === 0) return "matig";
  const gem = weekScores.reduce((s, v) => s + v, 0) / weekScores.length;
  if (gem >= 0.75) return "hoog";
  if (gem >= 0.4) return "matig";
  return "laag";
}

// Overreaching: stijgende vermoeidheid EN dalende adherentie over 2+ weken
export function overreachingRisico(
  vermoeidheidsScores: number[],
  adherentieScores: number[],
): boolean {
  if (vermoeidheidsScores.length < 2 || adherentieScores.length < 2) return false;

  const vTrend = vermoeidheidsTrend(vermoeidheidsScores);
  const aEerste = adherentieScores[0];
  const aLaatste = adherentieScores[adherentieScores.length - 1];
  const adherentieDaalt = aLaatste < aEerste - 0.15;

  return vTrend === "stijgend" && adherentieDaalt;
}

// Samengestelde analyse voor gebruik in planningEngine
export function analyseerTrend(
  vermoeidheidsPerWeek: number[],
  adherentiePerWeek: number[],
): TrendResult {
  const vermoeidheid = vermoeidheidsTrend(vermoeidheidsPerWeek);
  const adherentie = adherentieTrend(adherentiePerWeek);
  const overreaching = overreachingRisico(vermoeidheidsPerWeek, adherentiePerWeek);

  let signaal: TrendResult["signaal"] = "ok";
  let boodschap: string | null = null;

  if (overreaching) {
    signaal = "warn";
    boodschap =
      "Stijgende vermoeidheid + dalende trainingsfrequentie — risico op overbelasting. Plan houdt het rustiger.";
  } else if (vermoeidheid === "stijgend" && vermoeidheidsPerWeek.length >= 2) {
    signaal = "caution";
    boodschap = `Je vermoeidheid stijgt al ${vermoeidheidsPerWeek.length} weken — dit plan houdt het rustiger.`;
  }

  return { vermoeidheid, adherentie, overreaching, signaal, boodschap };
}
