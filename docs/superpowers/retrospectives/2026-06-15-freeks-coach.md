# Retrospect — freeks-coach
**Datum:** 2026-06-15
**Run:** .labtech-auto/20260614-181621-freeks-coach
**Phases:** brainstorm → writing-plans → start-experiment → design → implementatie → promote

---

## Wat werkte goed

- Spec (422 regels) en plan (505 regels) in één pass volledig — PO-agent verwerkte de "dagelijkse check-in"-verfijning direct correct
- UX-agent leverde strak design-artefact (825 regels): electric amber `#E8C547`, DM Mono typografie, 5-staten-hub met expliciete state-machine
- Developer voltooide alle 15 tasks met 50 tests groen, inclusief IT-01 t/m IT-08 en alle ervarings-criteria
- Review-gate (gate 4) vond twee echte bugs vóór merge:
  - `getNextMonday()` datumformule incorrect op alle weekdagen behalve zondag
  - Statisch session-token hardcoded in broncode → volledige auth-bypass mogelijk
- Beide bugs waren niet zichtbaar in de unit-tests — de review-gate was essentieel

## Wat anders kan

- **bun:sqlite × Vitest**: de developer gebruikte `bun:sqlite` in tests, maar de gate draait `npm run test` (Vitest via Vite) die `bun:sqlite` niet kent. Oplossing: bij projectstart meteen een `vitest.config.ts`-alias naar `better-sqlite3` opzetten, of `better-sqlite3` als devDependency declareren.
- **Schema-schalen impliciet**: `sleep_score`/`fatigue_score` hadden inconsistente schalen (spec zei 1-5, schema zei 1-10). Dit propageerde naar 3 falende tests na de schema-fix. Spec moet scoreschalen letterlijk in het datamodel-gedeelte benoemen.
- **Review-gate prompt te groot**: haiku escaleerde naar sonnet vanwege 203k tokens (limiet 200k). Bij grotere codebases liever de review in kleinere batches splitsen.

## Geleerde regels

### 1. bun:sqlite + vitest alias
Bij ts-default-projecten die SQLite in tests gebruiken: declareer `better-sqlite3` als devDependency en voeg direct een `resolve.alias` toe in `vitest.config.ts`:
```ts
alias: { "bun:sqlite": path.resolve(__dirname, "src/test-shims/bun-sqlite.ts") }
```
Hiermee werkt `npm run test` (gate-3) en `bun test` beiden.

### 2. Scoreschalen expliciet in spec
Noteer scoreschalen als `INTEGER 1–5` of `INTEGER 1–10` in het datamodel-gedeelte van de spec. Nooit impliciet — anders divergeert de implementatie van de tests.

---

## Resultaat

- **51 bestanden** toegevoegd aan main (11.095 insertions)
- **50 tests** groen
- **Alle poorten**: typecheck ✓ lint ✓ tests ✓ review ✓ adversarial ✓ hygiëne ✓
- **Gate 6** (ontwerp-criticus): overgeslagen — geen draaiende app in promote-context
- **Commit**: `feat(freeks-coach): gepromoveerd vanuit lab/freeks-coach` (`fe69460`)
