# Changelog

## [1.0.0] — 2026-06-14

### Added
- Intelligente personal athletic-coach-app voor Freek Laban (korfballer, geb. 15-05-2012)
- State-aware thuisscherm (5 staten: dagelijkse check-in / weekcheck-in / weekplan / onboarding / veiligheids-blokkade)
- Dagelijkse check-in: slaap, vermoeidheid, pijn/klachten, energie (max 4 taps)
- Uitgebreide wekelijkse check-in: alle activiteitstypen (korfbal, wedstrijd, toernooi, schoolsport, toetsweek, rust) + RPE
- Adaptive planning engine: Banister/Foster load-formule + PHV-aanpassing + dag-structuur-logica
- Veiligheidsprotocollen (non-negotiable): knie/hiel pijn → STOP + medische verwijzing, groeisnelheid >1cm/maand → plyometrie conservatiever, 3+ weken hoge vermoeidheid → load-reductie
- Mirwald 2002 PHV-formule met groeisnelheidsberekening
- Asymmetrie-detectie (>15% op bilaterale meting → waarschuwing)
- Doelen module: resultaatdoelen + procesdoelen, gekoppeld aan weekplan
- Metingen module: lengte, gewicht, zithoogte, verticale sprong, 10m sprint, enkelbeen-sprong L/R, balance L/R, medicine ball L/R
- Oefenbibliotheek: 20 korfbal-specifieke oefeningen (NSCA-based, 5 categorieën, instructies voor tieners)
- Sessie-uitvoering met voltooiingsberichten en PR-viering
- Statistieken en historieoverzicht
- Coach-inzichten (week 4+ gepersonaliseerde uitleg)
- Plan-trouw-indicator altijd boven de vouw
- Dark athletic design: #0F0F15 achtergrond, #E8C547 accent, DM Mono + Barlow Condensed typografie
- Single-user authenticatie via AUTH_PASSWORD env-var
- 50 tests (unit + interactietests IT-01 t/m IT-08)
