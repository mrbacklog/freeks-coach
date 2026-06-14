# Freek's Coach — UX/UI Design-artefact
**Versie:** 1.0 — 2026-06-14
**Auteur:** UX/UI Designer (LabTech Phase 3.5)
**Status:** Bindend voor implementatie (Phase 4)
**Skill-basis:** frontend-design

---

## 1. Informatie-architectuur

### 1.1 Navigatiemodel — app-schil

De app bestaat uit een beschermde schil (wachtwoord-gate) met daarbinnen een bottom-navigatie van 4 tabs. Een vijfde toegangspunt ("Meer") ontvouwt een drawer voor secundaire modules. De bottom-nav is de enige persistente navigatie-laag; geen sidebar, geen hamburger.

```
[Login-scherm — /login]
        |
        v (AUTH_PASSWORD correct)
[App-schil — beschermde zone]
        |
        +-- Eerste gebruik → [Onboarding — /onboarding] → genereer week 1 → /
        |
        +-- Bottom-nav (4 tabs + drawer)
            |
            TAB 1: Vandaag  (/)          ← state-aware hub
            TAB 2: Week     (/week)
            TAB 3: Stats    (/measurements)
            TAB 4: Coach    (/exercises)
            [•••] Meer-drawer:
                  Doelen     (/goals)
                  Geschiedenis (/history)
                  Instellingen (/settings)
```

### 1.2 State-aware hub — thuisscherm (/)

Het thuisscherm heeft geen vaste lay-out. Het stelt zichzelf samen op basis van de toestand die de API retourneert via `GET /api/home/state`. De primaire actie verschuift afhankelijk van context — dit is de kern van het "coach"-gevoel.

**Staat A — Dagelijkse check-in verschuldigd (meest voorkomend bij ochtendgebruik)**
Primaire actie: grote check-in-kaart bovenaan ("Hoe sta je erbij vandaag?"). Geschatte duur zichtbaar: "60 sec". Weekplan zichtbaar als secundaire kaart eronder, maar visueel gedempt.

**Staat B — Weekcheck-in verschuldigd (zondag of maandag, nog niet ingevuld)**
Primaire actie: wekelijkse check-in-kaart domineert het volledige bovenste 60% van het scherm. Tekst: "Je coach heeft je terugkoppeling nodig — zo plant hij je volgende week slim in." Weekplan compact onderaan als "vorige week"-samenvatting.

**Staat C — Alles up-to-date (check-in gedaan, weekplan beschikbaar)**
Primaire actie: weekplan domineert. Plan-trouw-indicator prominent bovenaan (horizontale balk + percentage). Dagelijkse check-in-samenvatting als compacte chip rechtsboven (kleur-gecodeerd: groen/amber/rood op vermoeidheid). Coach-inzicht als inklapbare kaart onderaan.

**Staat D — Eerste gebruik (geen profiel)**
Redirect naar `/onboarding`. Geen leeg scherm, nooit.

**Staat E — Veiligheids-blokkade actief**
Rode blokkade-banner overschrijft het volledige scherm (boven weekplan). Weekplan is niet zichtbaar. Tekst volgt EC-5 woordkeuze.

### 1.3 Onboarding-flow (/onboarding)

Stap-voor-stap wizard, 4 stappen, progressie-indicator bovenaan (dots, geen percentages). Na voltooiing: week 1 wordt direct gegenereerd. Redirect naar thuisscherm in staat C.

```
Stap 1: Welkom + naam/geboortedatum (prefilled voor Freek)
Stap 2: Eerste meting — lengte, gewicht, zithoogte
Stap 3: Korfbal-schema — dag-checkboxen (ma–zo) + tijdstip
Stap 4: Eerste doel (aangespoord, optioneel) → "Coach, ik wil..."
```

Knop op elke stap: "Verder →" (rechts). Terug-link linksboven (geen knop). Geen skip-knop voor stap 2 en 3 — ze zijn vereist voor PHV-berekening.

### 1.4 Create = edit = één flow

Doelen, metingen en activiteiten kennen geen aparte "aanmaken"-pagina. De component opent met lege of gevulde velden. URL-patroon:

- `/goals/new` → GoalEdit met lege state
- `/goals/:id` → GoalEdit met bestaande data
- Metingen: inline formulier in `/measurements`, geen aparte route — modal-laag over het scherm

### 1.5 Check-in-flows

**Dagelijkse check-in (/check-in/daily)**
Stap-voor-stap, één vraag per scherm, horizontale slide-animatie. Maximaal 4 taps. Geen "Volgende"-knop bij schalen — tap op de waarde IS de navigatie naar de volgende stap.

```
Stap 1: Slaapkwaliteit       → 5 grote icon-knoppen (maan-symboliek, 1–5)
Stap 2: Vermoeidheid         → 10-delige kleur-balk tap-interface (groen→rood)
Stap 3: Pijn/klachten        → 4 keuze-blokken (Nee / Licht / Matig / Ernstig)
         [Als Matig/Ernstig] → follow-up: locatie-picker + bewegingsvraag
Stap 4: Motivatie            → 5 grote icon-knoppen (vlam-symboliek, 1–5)
```

Na stap 4: samenvatting-animatie + terugkeer naar thuisscherm. Bij ernstige pijn + bewegingsbeperking: veiligheids-blokkade-scherm (geen samenvatting).

**Wekelijkse check-in (/check-in/weekly)**
Stap-voor-stap, 4 stappen, progressie-balk bovenaan. Geschatte duur: "3–5 min".

```
Stap 1: Activiteiten-dag-grid (ma–zo, pre-filled vanuit voltooide sessies)
Stap 2: Lichaamsrespons (energie, spierpijn, slaap, vrij veld)
Stap 3: Korfbal-check (alleen bij korfbal-activiteiten die week)
Stap 4: Samenvatting + "Plan genereren voor volgende week"
```

### 1.6 Sessie-uitvoering (/session/:id)

Losse schermlaag boven het weekplan (sheet die van onderen opschuift). Bereikbaar via weekplan-kaart. Heeft geen eigen tab in de bottom-nav — is een modaal scherm.

### 1.7 Navigatie tussen schermen

```
Thuisscherm
  → [check-in widget tap]     → /check-in/daily   (full-screen modal)
  → [weekcheck-in tap]        → /check-in/weekly  (full-screen modal)
  → [sessie-blok tap]         → /session/:id      (bottom sheet)
  → [coach-inzicht tap]       → /exercises/:id    (push)

Weekplan (/week)
  → [dag-blok tap]            → /session/:id      (bottom sheet)
  → [coach-toelichting]       → inline inklapbaar, geen navigatie

Stats (/measurements)
  → [nieuwe meting]           → modal over /measurements
  → [metriek-grafiek tap]     → inline uitklappen, geen navigatie

Coach (/exercises)
  → [oefening tap]            → /exercises/:id    (push)

Meer-drawer
  → /goals       → [doel tap]        → /goals/:id
  → /goals/new   (FAB-knop op /goals)
  → /history
  → /settings
```

---

## 2. Schermkaart

### 2.1 Dekkingstabel

| Module | Route | Scherm-sectie | Status |
|--------|-------|---------------|--------|
| Dagelijkse check-in | `/check-in/daily` | 2.3 | Bereikbaar scherm |
| Wekelijkse check-in | `/check-in/weekly` | 2.4 | Bereikbaar scherm |
| Adaptief weekplan (bekijken) | `/week` | 2.6 | Bereikbaar scherm |
| Doelen (overzicht) | `/goals` | 2.9 | Bereikbaar scherm |
| Doelen (aanmaken/bewerken) | `/goals/new` + `/goals/:id` | 2.10 | Bereikbaar scherm |
| Metingen (invoer + grafiek + asymmetrie) | `/measurements` | 2.7 | Bereikbaar scherm |
| Oefenbibliotheek (browse) | `/exercises` | 2.11 | Bereikbaar scherm |
| Oefening-detail | `/exercises/:id` | 2.12 | Bereikbaar scherm |
| Sessie-uitvoering | `/session/:id` | 2.8 | Bereikbaar scherm |
| Veiligheids-blokkade | Inline op `/` + `/week` + `/check-in/daily` | 2.5 | Bereikbaar scherm |
| Persoonlijke records + viering | Onderdeel `/measurements` + sessie-afronden | 2.7 + 2.8 | Bereikbaar scherm |
| Groeicurve PHV | Onderdeel `/measurements` | 2.7 | Bereikbaar scherm |
| Activiteiten-log | `/check-in/weekly` stap 1 + `/history` | 2.4 + 2.13 | Bereikbaar scherm |
| Instellingen | `/settings` | 2.14 | Bereikbaar scherm |
| Coach-uitleg planwijziging | Inklapbare sectie op `/week` + `/` staat C | 2.6 | Bereikbaar scherm |
| Onboarding | `/onboarding` | 2.2 | Bereikbaar scherm |
| Login | `/login` | 2.15 | Bereikbaar scherm |
| Notificaties/reminders | — | — | `later:` buiten MVP |

### 2.2 Onboarding (/onboarding)

**Doel:** Eerste-sessie-setup zodat week 1 direct gepersonaliseerd is. Nooit lege staat tonen.

**Lay-out:**
```
[Progressie-dots: • • • •]           ← bovenaan, 4 dots

[Stap-inhoud, vertical center]
  Stap 1:  "Hoi, ik ben je coach."
           Naam-veld (prefilled: Freek Laban)
           Geboortedatum-veld (prefilled: 15-05-2012)

  Stap 2:  "Even een basismeting."
           Lengte (cm) — numpad keyboard
           Gewicht (kg)
           Zithoogte (cm) — met uitlegpictogram (wat is zithoogte?)

  Stap 3:  "Wanneer speel je korfbal?"
           Dag-grid 7 blokken (ma–zo), tap = selecteren
           Tijdstip-picker per geselecteerde dag

  Stap 4:  "Wat wil je dit seizoen bereiken?"
           Vrij tekstveld + type-kiezer (sprint / sprong / algemeen)
           "Sla over" link onderaan (enige stap die overgeslagen mag worden)

[Verder → knop]                        ← onderaan, vol breedte
```

**Terugkerende gebruiker:** Geen onboarding — redirect naar thuisscherm.

**Primaire actie:** "Verder →" per stap.

### 2.3 Dagelijkse check-in (/check-in/daily)

**Doel:** Maximaal 4 taps, 60 seconden, hoge datakwaliteit.

**Lay-out (full-screen modal, donkere overlay op thuisscherm):**
```
[× sluit]   [Stap 1 van 4]             ← topbalk
─────────────────────────────────────
[Grote vraag-tekst, centraal]
  "Hoe heb je geslapen?"

[5 icon-knoppen, horizontale rij]
  🌑 · 🌒 · 🌓 · 🌔 · 🌕
  1    2    3    4    5
  (tap = selecteer + ga naar stap 2)

[slide-animatie naar stap 2]
─────────────────────────────────────
  "Hoe moe ben je nu?"

[10-delige tap-balk]
  [1][2][3][4][5][6][7][8][9][10]
   groen ←─────────────────→ rood
  (tap = selecteer + ga naar stap 3)

─────────────────────────────────────
  "Heb je ergens last van?"

[4 grote keuze-blokken, 2×2 grid]
  [ Nee ]      [ Lichte klacht ]
  [ Matige     [ Ernstige      ]
    klacht ]     klacht        ]

  Bij Matig/Ernstig → uitschuivende follow-up:
  "Waar?" [knie L] [knie R] [hiel L] [hiel R] [rug] [anders]
  "Beïnvloedt dit je beweging?" [Ja] [Nee]

─────────────────────────────────────
  "Hoe gemotiveerd ben je om te trainen?"

[5 icon-knoppen, horizontale rij]
  🔥·🔥·🔥·🔥·🔥  (1–5, vlam-opbouw)
  (tap = selecteer + voltooi)
```

**Na voltooiing (normaal):** Animatie — check-mark in accentkleur explodeert vanuit het midden. Daarna fade-out naar samenvatting-chip en terugkeer thuisscherm.

**Na voltooiing (ernstige pijn + beweging beïnvloed):** Veiligheids-blokkade-scherm (zie 2.5) vervangt de check-in.

**Terugkerende gebruiker (check-in al gedaan):** Knop is grayed out op thuisscherm. Direct naar `/check-in/daily` navigeren toont "Je hebt vandaag al ingecheckt" met samenvatting.

### 2.4 Wekelijkse check-in (/check-in/weekly)

**Doel:** 3–5 minuten, gesprekachtig, volledig beeld van de afgelopen week geven aan de planning-engine.

**Lay-out (full-screen, eigen scherm — niet modal):**
```
[← Terug]  [Weekcheck-in]  [Stap 1/4]
[Progressie-balk ████░░░░ 25%]
─────────────────────────────────────
STAP 1: "Wat deed je afgelopen week?"

  [Dag-grid, verticale lijst]
  Maandag     [+ voeg activiteit toe]
              [App-sessie — automatisch ingevuld]
  Dinsdag     [Korfbal training]  [RPE: 7] [60 min]
              [+ voeg activiteit toe]
  Woensdag    [+ voeg activiteit toe]
  ...

  Per activiteit-toevoegen:
  Bottom sheet met type-kiezer:
  [Korfbal training] [Korfbal wedstrijd] [Toernooi]
  [Schoolsport]      [Toetsweek]         [Rust]
  [Andere sport]
  → RPE slider (1–10) + duur (min)

─────────────────────────────────────
STAP 2: "Hoe voelde je lichaam?"

  Energie deze week:     [1][2][3][4][5]
  Spierpijn/stijfheid:   [geen][licht][behoorlijk][erg]
  Slaap over de week:    [1][2][3][4][5]
  Bijzonderheden:        [Vrij tekstveld, 280 tekens]

─────────────────────────────────────
STAP 3: "Hoe ging het korfbal?"
  (Alleen tonen als korfbal-activiteiten aanwezig)

  Spelpositie: [Aanval] [Verdediging] [Beide]
  Explosiviteit: [1][2][3][4][5]
  Wat ging goed / aandacht nodig: [Vrij veld]

─────────────────────────────────────
STAP 4: Samenvatting + bevestiging

  [Samenvatting van alle ingevoerde data]
  [← Pas aan] knop per sectie

  [Plan genereren voor volgende week →]
  ← vol-breedte knop, accentkleur
```

**Na bevestiging:** Laad-animatie ("Je coach verwerkt alles..."), dan redirect naar `/week`.

**Terugkerende gebruiker (weekcheck-in al gedaan):** Scherm toont de ingevulde data als read-only samenvatting. Geen "Plan genereren"-knop meer.

### 2.5 Veiligheids-blokkade (inline component)

**Doel:** Onontkoombaar en duidelijk bij ernstige pijn + bewegingsbeperking (EC-5).

**Verschijnt op:** Thuisscherm (vervangt weekplan), `/week` (vervangt sessie-grid), na dagelijkse check-in.

**Lay-out:**
```
[Rode balk, vol breedte]
⚠ TRAINING GEPAUZEERD

"Je meldt pijn die je beweging beïnvloedt.
Alle spring- en krachtoefeningen zijn gepauzeerd.
Laat dit beoordelen door een fysiotherapeut of arts."

[Mobiliteit & herstel-oefeningen bekijken →]
← enige actie-knop (leidt naar /exercises?category=herstel)

[Klacht is opgelost? Bevestig hier]
← secundaire tekst-link, leidt naar clearance-flow:
   "Heb je een arts of fysio geraadpleegd?" [Ja] [Nee]
   Ja → blokkade opheffing
   Nee → "Doe dat eerst. Je veiligheid gaat voor."
```

**Visuele taal:** Rode achtergrond (#FF4757 met 15% opacity) op de kaart. Witte tekst. Geen zacht of vergoelijkend design — dit moet voelen als een stop-sign.

### 2.6 Weekplan (/week)

**Doel:** Het hart van de app — wat doe ik deze week en waarom?

**Lay-out:**
```
[Week van 14–20 jun]  [← vorige]  [volgende →]

[Plan-trouw-indicator]
  ████████░░  67%  (2/3 sessies afgerond)
  ← horizontale balk, accentkleur-vulling, wit label

[Coach-toelichting — standaard open]
  ▾ "Waarom dit plan?"
  "Vorige week gaf je dinsdag na korfbal een
   vermoeidheid van 8/10. Woensdag houd ik daarom
   licht. Je 10m sprint-doel staat centraal deze week:
   2x explosiviteitstraining ingepland."
  ← inklapbaar, tap op header

[Dag-grid — verticale lijst]
  MAANDAG 15 jun
    [Korfbal training — extern]   ← grijs, niet klikbaar
  DINSDAG 16 jun
    [Beensterkte — 45 min]        ← accentkleur, klikbaar
    → tap → /session/:id
  WOENSDAG 17 jun
    [Herstel — 20 min]            ← lichtgroen accent
  DONDERDAG 18 jun
    [Vrij]
  VRIJDAG 19 jun
    [Explosiviteit — 30 min]      ← accentkleur, klikbaar
  ZATERDAG 20 jun
    [Korfbal wedstrijd — extern]  ← grijs, niet klikbaar
  ZONDAG 21 jun
    [Vrij / herstel]

[Doelkoppeling — per actief doel één zin]
  "Sprint-doel (<1.65s): deze week 2x horizontale
   explosiviteit — direct effect op je 10m sprint."
```

**Terugkerende gebruiker:** Vorige weken zijn navigeerbaar via pijlen. Voltooide sessies tonen een check-mark. De coach-toelichting verandert elke week (EC-1).

**Primaire actie:** Tap op een sessie-blok → sessie-uitvoering.

**Veiligheids-blokkade:** Als actief — rode banner vervangt dag-grid (zie 2.5).

### 2.7 Metingen (/measurements)

**Doel:** Inzicht in fysieke ontwikkeling, asymmetrie-detectie, PHV-bewustzijn.

**Lay-out:**
```
[Metingen]                    [+ Nieuwe meting]

[PHV-sectie — bovenaan als prominent informatie-blok]
  ┌────────────────────────────────────┐
  │  GROEIFASE                         │
  │  Maturity offset: -0.8 jaar        │
  │  "Je nadert waarschijnlijk je      │
  │   groeipiek. Wees extra voorzich-  │
  │   tig met plyometrie."             │
  └────────────────────────────────────┘

[Asymmetrie-banner — alleen als gap >15%]
  ⚠ ASYMMETRIE — Sprong links/rechts: 22% verschil
  ← gele banner, klikbaar naar grafiek van dat paar

[Metriek-kaarten — scrollbare lijst]
  Elke kaart:
  ┌──────────────────────────────────┐
  │ 10m sprint                       │
  │ 1.71s  ← meest recente waarde    │
  │ [Tijdlijn-grafiek, klein]        │
  │ Doel: <1.65s    🏆 PR: 1.68s    │
  └──────────────────────────────────┘

  Sprong links / rechts (bilateraal paar naast elkaar)
  Balance links / rechts
  Medicine ball links / rechts
  Verticale sprong
  Lengte / Gewicht / Zithoogte

[Nieuwe meting toevoegen — modal]
  Slide-up sheet met alle meetvelden
  Invullen → opslaan → PR-check → viering indien PR
```

**PR-viering (EC-2):**
Animatie die het kaart-oppervlak "oplicht" in accentkleur. Tekst:
"Nieuw PR — 10m sprint 1.68s (0.03s sneller dan je vorige beste)"
Niet "Goed gedaan!" maar specifiek en feitelijk.

**Terugkerende gebruiker:** Grafieken groeien met elke meting. PR wordt permanent gemarkeerd als gouden datapunt op de grafiek.

### 2.8 Sessie-uitvoering (/session/:id)

**Doel:** Freek afvinken terwijl hij traint — snel, duidelijk, geen afleiding.

**Lay-out (bottom sheet, 90% schermhoogte):**
```
[Beensterkte — 45 min]   [× sluiten]
─────────────────────────────────────
[Voortgangsbalk: ██░░░░░░ 1/4 oefeningen]

[Actieve oefening]
  GOBLET SQUAT
  ┌──────────────────────────────────┐
  │ ⚠ Let op je knieën: houd ze     │
  │   boven je voeten, niet naar    │
  │   binnen. Stop bij pijn.        │
  └──────────────────────────────────┘
  ← oranje/amber veiligheids-cue balk

  "Waarom? Zo bouw je de beenkracht die je
   bij korfbal nodig hebt om laag in positie
   te blijven."
  ← cursief, korfbal-context

  3 sets × 10 herhalingen  |  90 sec pauze

  [Set 1 ✓]  [Set 2 ✓]  [Set 3 ○]
  ← tap op set-cirkel = afvinken

[Volgende oefening →]   [← Vorige]
─────────────────────────────────────
[Sessie afronden]  ← verschijnt pas als alle sets ✓
```

**Voltooiingsboodschap:**
Full-screen momentje (2–3 seconden):
- Normaal: "Klaar. Je lichaam wordt sterker dan gisteren."
- PR: specifieke PR-boodschap + gouden glinstering op cijfer

**Primaire actie:** Set afvinken (tap op set-cirkel).

### 2.9 Doelen-overzicht (/goals)

**Doel:** Actieve doelen inzichtelijk + behaalde doelen als motivatie.

**Lay-out:**
```
[Doelen]

[Actieve doelen]
  ┌──────────────────────────────────┐
  │ 10m sprint < 1.65s              │
  │ Huidige waarde: 1.71s           │
  │ Streefdatum: september 2026     │
  │ ████████░░  71% dichter bij doel │
  └──────────────────────────────────┘

  ┌──────────────────────────────────┐
  │ 3x per week krachttraining      │
  │ Deze week: 1/3                  │
  │ ██░░░░░░░░  33%                 │
  └──────────────────────────────────┘

[Behaalde doelen]
  ✓ Verticale sprong >40cm  (behaald 3 jun)
  ← compacte lijst, geen grafiek

[FAB: + Nieuw doel]  ← drijvende knop rechtsonder
```

**Primaire actie:** Tap op doel → `/goals/:id` (bewerken/detail).

**Terugkerende gebruiker:** Voortgangsindicatoren groeien. Behaalde doelen zakken naar de onderste sectie met confetti-moment bij behalen.

### 2.10 Doel aanmaken/bewerken (/goals/new en /goals/:id)

**Doel:** Zelfde component, lege of gevulde staat.

**Lay-out:**
```
[← Doelen]  [Doel bewerken / Nieuw doel]

  Titel         [10m sprint onder 1.65s       ]
  Type          [Resultaatdoel ▾]
  Streefwaarde  [1.65]  seconden
  Streefdatum   [september 2026]
  Notitie       [optioneel vrij veld]

  [Opslaan]   ← vol breedte, accentkleur

  [Doel verwijderen]  ← tekst-link, destructief rood
  (Alleen zichtbaar bij bestaand doel)
```

### 2.11 Oefenbibliotheek (/exercises)

**Doel:** Browsen en begrijpen wat in het weekplan staat — en extra context ophalen.

**Lay-out:**
```
[Coach]  ← tab-naam

[Zoekbalk: "Zoek een oefening..."]

[Filter-tabs — horizontaal scrollbaar]
  [Alle] [Beensterkte] [Bovenlichaam] [Kern] [Plyometrie] [Herstel]

[Oefening-kaarten — lijst]
  ┌──────────────────────────────────┐
  │ GOBLET SQUAT                    │
  │ Beensterkte · Beginner          │
  │ PHV: toegestaan                 │
  └──────────────────────────────────┘
  ← tap → /exercises/:id
```

**Primaire actie:** Tap op kaart → oefening-detail.

### 2.12 Oefening-detail (/exercises/:id)

**Doel:** Alles wat Freek nodig heeft om de oefening goed en veilig uit te voeren.

**Lay-out:**
```
[← Terug]

[GOBLET SQUAT]
Beensterkte · Beginner · Bilateraal

┌──────────────────────────────────┐
│ ⚠ VEILIGHEID                    │
│ Houd knieën boven voeten.       │
│ Stop direct bij kniepijn.       │
└──────────────────────────────────┘
← oranje/amber balk, prominent

[Instructie]
  "Pak een kettlebell of dumbbell voor je borst.
   Voeten iets breder dan heupenbreed. Zak diep
   neer terwijl je rug recht blijft. Druk jezelf
   terug omhoog via je hielen."
  ← max 150 woorden, tiener-taal

[Korfbal-context]
  "Zo bouw je de beenkracht om laag in verdediging
   te blijven en explosief op te springen."
  ← cursief, amber accentkleur

[Standaard schema]
  3 sets × 10 herhalingen  |  90 sec pauze

[PHV-status]
  ✓ Toegestaan tijdens groeipiek
```

### 2.13 Geschiedenis (/history)

**Doel:** Activiteiten-log per week, voltooide sessies, load-overzicht.

**Lay-out:**
```
[← Vorige week]  [week van 7–13 jun]  [volgende week →]

[Week-samenvatting]
  Load-score: 1.840  |  Plan-trouw: 2/3 sessies

[Activiteiten per dag — verticale lijst]
  Maandag 8 jun:   Korfbal training  RPE 7  60 min
  Dinsdag 9 jun:   Beensterkte (app)  ✓ voltooid
  Woensdag 10 jun: Rust
  ...

[Check-in samenvatting]
  Dagelijks gem. vermoeidheid: 5.2 / 10
  Slaap gem.: 3.8 / 5
```

### 2.14 Instellingen (/settings)

**Doel:** Profiel beheren, korfbal-schema aanpassen, data exporteren.

**Lay-out:**
```
[Instellingen]

[Sectie: Profiel]
  Naam            Freek Laban         [bewerken]
  Geboortedatum   15 mei 2012         [bewerken]

[Sectie: Korfbal-schema]
  Trainingen: di, do, za              [bewerken]
  → dag-grid opent

[Sectie: App]
  Versie: 1.0.0
  [Data exporteren (JSON)]
  [Uitloggen]                         ← rood
```

### 2.15 Login (/login)

**Doel:** Wachtwoord-gate, enige barrière vóór de app.

**Lay-out:**
```
[Freek's Coach]  ← logo/wordmark, centered

[Wachtwoord]  ← groot input-veld
[Inloggen →]  ← vol-breedte knop

[Foutboodschap bij fout wachtwoord]
  "Onjuist wachtwoord — probeer opnieuw."
```

**Geen "Wachtwoord vergeten"** — single-user, AUTH_PASSWORD via env.

---

## 3. Visuele richting

### 3.1 Toon en sfeer

De app voelt als een serieus gereedschap voor een serieuze jonge atleet. Geen speelgoedgevoeligheid, geen corporate fitness-neutraliteit. De toon is die van een coach die je kent en respecteert — direct, specifiek, bemoedigend zonder te vleien. De interface zwijgt waar het kan en spreekt waar het telt.

Sfeer-referenties (conceptueel, niet visueel kopiëren):
- De precision van een race-dashboard
- De densiteit van een sporttelemetrie-scherm
- De rust van een high-end studio

### 3.2 Kleurenpalet

Alle waarden zijn CSS-variabelen, nergens hardcoded in componenten.

```css
:root {
  /* Achtergronden */
  --bg-void:      #08080C;   /* diepste laag — achtergrond van het scherm zelf */
  --bg-primary:   #0F0F15;   /* hoofd-achtergrond */
  --bg-surface:   #17171F;   /* kaarten, bottom sheets */
  --bg-elevated:  #1F1F28;   /* inputs, hover-states, modals */

  /* Accentkleur — electric amber */
  --accent:       #E8C547;   /* primaire accentkleur: amber-goud */
  --accent-dim:   #A88B2A;   /* gedimde variant voor secundaire elementen */
  --accent-glow:  rgba(232, 197, 71, 0.12); /* glow-effect achtergrond */

  /* Status-kleuren */
  --success:      #3DBA7A;   /* groen — lage vermoeidheid, goed score */
  --warning:      #F0A030;   /* oranje-amber — matige klacht, asymmetrie */
  --danger:       #E84040;   /* rood — blokkade, ernstige pijn */
  --info:         #4A90D9;   /* blauw — neutrale info-banners */

  /* Tekst */
  --text-primary:   #F2F2F0;   /* hoofdtekst */
  --text-secondary: #8A8A98;   /* labels, metadata */
  --text-ghost:     #4A4A58;   /* placeholder, disabled */

  /* Randen en lijnen */
  --border:         rgba(255,255,255,0.07);
  --border-accent:  rgba(232,197,71,0.25);
}
```

**Niet gebruiken:** blauw-paarse gradienten, neon-groen op zwart (gamer-look), pastelkleuren, witte achtergronden, standaard-grijzen uit system UI.

**Accentkleur-motivatie:** Electric amber (#E8C547) voelt atletisch zonder neon-matigheid. Het verwijst naar stopwatch-displays en sporttelemetrie. Het contrast op #0F0F15 is 8.2:1 — ruim boven WCAG AA. Het contrast met het vurige rood van de blokkade-schermen is intentioneel: amber = ga, rood = stop.

### 3.3 Typografie

**Display/metrics (getallen, scores, grote waarden):**
`DM Mono` (Google Fonts) — monospaced, precies, leesbaarheid van meetwaarden.
Gebruik: alle numerieke UI-elementen (scorebalken, grafieken, RPE-waarden, PR-getallen, tijden).

**Koppen en navigatielabels:**
`Barlow Condensed` gewicht 600–700 (Google Fonts) — atletisch smal, hoge informatiedichtheid.
Gebruik: schermnamen, dag-labels, oefening-namen, stat-koppen.

**Body en instructie-tekst:**
`Inter` gewicht 400–500 — enige uitzondering op het anti-Inter-principe: hier is functionele leesbaarheid van instructie-tekst het zwaarste criterium. Maar: strak bijgehouden, geen standaard-groottes, licht negatieve letter-spacing (−0.01em).

**Grootte-schaal:**
```
--text-xs:   11px  (metadata, badges)
--text-sm:   13px  (secondary labels)
--text-base: 15px  (body, instructie)
--text-lg:   18px  (vraag-tekst check-in)
--text-xl:   22px  (sectie-koppen)
--text-2xl:  28px  (scherm-koppen)
--text-metric: 36px  (grote meetwaarden, PR-getallen — DM Mono)
--text-hero:   52px  (check-in score bij voltooiing — DM Mono)
```

### 3.4 Component-stijl

**Knoppen — primair:**
```
background: var(--accent)
color: #0F0F15  (donker op licht — bewust omgekeerd)
border-radius: 10px
font: Barlow Condensed 600, 15px, letter-spacing: 0.04em
padding: 16px 24px
border: none
```

**Knoppen — secundair/ghost:**
```
background: transparent
border: 1px solid var(--border)
color: var(--text-secondary)
(hover: border-color → var(--border-accent))
```

**Kaarten (sessie-blokken, metriek-kaarten, doel-kaarten):**
```
background: var(--bg-surface)
border: 1px solid var(--border)
border-radius: 12px
padding: 16px
(hover/focus: border-color → var(--border-accent), subtle amber glow)
```

**Actieve sessie-blokken (klikbaar):**
```
border-left: 3px solid var(--accent)  ← linker amber streep als visuele markering
```

**Veiligheids-cue-balken (oranje):**
```
background: rgba(240, 160, 48, 0.15)
border-left: 3px solid var(--warning)
border-radius: 0 8px 8px 0
```

**Blokkade-banner (rood):**
```
background: rgba(232, 64, 64, 0.12)
border: 1px solid rgba(232, 64, 64, 0.4)
border-radius: 12px
```

**Scores/schalen (tap-balk vermoeidheid):**
10 blokken horizontaal. Kleur interpoleert van `--success` (#3DBA7A) bij 1 tot `--danger` (#E84040) bij 10. Geselecteerde waarde: vol gevuld + lichte glow. Niet geselecteerd: 20% opacity.

**Icon-knoppen (slaap, motivatie):**
Grote touch-targets (min. 56×56px). Geselecteerde staat: amber-ring eromheen (box-shadow: 0 0 0 2px var(--accent)). Niet: color-fill van het icoon zelf.

**Plan-trouw-indicator:**
Horizontale balk. Hoogte: 6px. Achtergrond: `--bg-elevated`. Vulling: `--accent`. Border-radius: 3px. Percentage-label in DM Mono naast de balk. Label-kleur: `--accent`.

**Bottom-nav:**
```
background: var(--bg-surface)
border-top: 1px solid var(--border)
height: 64px
Actieve tab: accent-punt (3px cirkel) onder het label + label in --accent
Inactieve tab: icon + label in --text-ghost
```

**Geen box-shadow over de hele app** — depth via achtergrondverschil (bg-void → bg-primary → bg-surface → bg-elevated), niet via schaduwen. Uitzondering: subtiele glow-effecten op hover (accentkleur, laag opacity).

### 3.5 Micro-animaties

**Check-in voltooiing:** Accentkleur-cirkel (scale 0 → 1.5 → 0) vanuit scherm-midden, 400ms ease-out. Daarna fade van check-in-modal.

**Stap-overgang check-in:** Horizontale slide (translate-x 100% → 0%), 200ms ease-in-out. Voelt als bladeren, niet als pagina laden.

**PR-viering:** Gouden "burst" op de metriek-kaart — keyframe-animatie die border-color en background-color laat oplichten en faden, 800ms. Geen confetti-bibliotheek.

**Sessie-afronden:** Voortgangsbalk vult volledig op in 600ms, daarna voltooiings-boodschap fade-in.

**Kaart hover (desktop/tablet):** `transform: translateY(-2px)` + `border-color: var(--border-accent)`, 150ms.

**Geen:** parallax, zwevende deeltjes, lottie-animaties, loading spinners langer dan 1 seconde zonder inhoud.

### 3.6 Anti-generieke-AI-look — manifest

Het volgende is expliciet verboden in de implementatie (EC-7):

| Verboden patroon | Reden | Alternatief |
|------------------|-------|-------------|
| Blauw-paarse gradient op achtergrond | Meest gebruikte AI-app-look | Diepe effen donkere achtergrond |
| Emoji in knoppen of koppen | Kinderachtige toon | Typografische hiërarchie + kleur |
| Generic card-stacks met gelijke hoogte | Informatieloze raster-esthetiek | Variabele kaart-inhoud, links-accent-streep voor prioriteit |
| Zachte pastel-accenten (mint, lavendel) | Corporate wellness-look | Electric amber op bijna-zwart |
| System-font stacks zonder aanpassing | Geen visuele intentie | DM Mono + Barlow Condensed + Inter |
| Grote gekleurde achtergrond-blokken per sectie | Dashboard-cliché | Kleur via randen en typografie, niet vlakken |
| "Goed gedaan!" voltooiings-tekst | Generiek, onpersoonlijk | Specifieke, feitelijke voltooiings-taal (EC-2) |
| Lottie/confetti bij elke actie | Overweldigend, afleidend | Één scherp animatie-moment (PR) |
| Standaard React-component-bibliotheek styling | Herkenbaarheid veroorzaakt generiek gevoel | Alle interactieve elementen zijn custom gestyled |

### 3.7 Koppeling aan ervaringscriteria van de Product Owner

| EC | Design-beslissing die dit afdwingert |
|----|--------------------------------------|
| EC-1 (Intelligente coach-beleving) | Coach-toelichting sectie altijd open op `/week`; zinnen in eerste persoon coach-stem; concrete data-referenties in amber gemarkeerd |
| EC-2 (Vierende voltooiing) | PR-animatie op metriek-kaart; specifieke tekst-generatie; voltooiingsboodschap is scherm-vullend moment, niet een toast |
| EC-3 (Plan-trouw-indicator prominent) | Horizontale balk bovenaan `/week` én op thuisscherm staat C; DM Mono getal; amber-vulling; nooit onder een scroll-fold |
| EC-4 (Doelkoppeling in weekplan) | Vaste "Doelkoppeling"-sectie onderaan `/week`, altijd zichtbaar als doel actief is |
| EC-5 (Veiligheids-blokkade onontkoombaar) | Rood blok overschrijft weekplan volledig; geen scroll-away mogelijk; enige actie is richting herstel |
| EC-6 (Asymmetrie-signalering) | Gele banner bovenaan `/measurements` bij >15%; verwijst naar de specifieke meting; verdwijnt zodra gap < 15% |
| EC-7 (Premium design — hard oordeel) | Anti-generiek manifest (3.6); custom component-stijl (3.4); DM Mono voor metrics; amber op bijna-zwart; geen standaard-bibliotheek-defaults |

---

*Einde design-artefact. Dit document is bindend voor de Developer-rol (Phase 4). Afwijkingen vereisen expliciete afstemming met de Product Owner.*
