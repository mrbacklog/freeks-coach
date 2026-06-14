// 10+ unique, age-appropriate completion messages for Freek (NOT "Goed gedaan!")
export const COMPLETION_MESSAGES = [
  "Strak werk vandaag — zo leg je de basis voor sneller korfbal.",
  "Klaar. Je lichaam wordt sterker dan gisteren.",
  "Sessie afgerond. Zo bouw je korfbal-kracht op.",
  "Je bent klaar. Morgen pak je dit weer op — sterker dan vandaag.",
  "Herstel is net zo belangrijk als de training zelf — zorg goed voor jezelf.",
  "Training afgerond. Je spieren groeien nu — geef ze de tijd.",
  "Dat was werk. Precies wat je lichaam nodig heeft voor het veld.",
  "Check. Je bent een stap dichter bij je doelen.",
  "Sessie in de boeken. Consistentie is het echte geheim.",
  "Klaar voor vandaag. Zorg voor voeding en slaap — dat is waar de winst zit.",
  "Afgerond. Elke sessie telt, ook als het zwaar voelde.",
  "Je hebt het gedaan. Korfbal wordt makkelijker elke keer dat je dit doet.",
];

export function getRandomMessage(): string {
  return COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
}

export function getPrMessage(metric: string, value: number | string, improvement: string): string {
  return `Nieuw PR — ${metric} ${value} (${improvement} beter dan je vorige beste)`;
}
