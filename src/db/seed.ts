import type { Database } from "bun:sqlite";

interface Exercise {
  name: string;
  category: "beensterkte" | "bovenlichaam" | "kern" | "plyometrie" | "herstel" | "coordinatie" | "snelheid";
  description: string;
  safety_cue: string;
  korfbal_context: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  is_bilateral: 0 | 1;
  phv_safety: "allowed" | "caution" | "restricted";
  sets: number;
  reps: string;
  rest_seconds: number;
}

const EXERCISES: Exercise[] = [
  // Beensterkte (5)
  {
    name: "Goblet Squat",
    category: "beensterkte",
    description:
      "Houd een gewicht voor je borst en zak door je knieën tot ze 90 graden zijn gebogen. " +
      "Houd je rug recht en je borst omhoog. Duw je knieën naar buiten zodat ze boven je tenen blijven. " +
      "Dit is een van de beste oefeningen om je benen sterker te maken voor korfbal.",
    safety_cue:
      "Houd altijd je rug recht en laat je knieën nooit naar binnen zakken. " +
      "Stop als je pijn voelt in je knieën of rug.",
    korfbal_context:
      "Sterke benen helpen je hoger te springen voor schoten en verdediging in korfbal.",
    difficulty: "beginner",
    is_bilateral: 1,
    phv_safety: "allowed",
    sets: 3,
    reps: "10",
    rest_seconds: 90,
  },
  {
    name: "Romanian Deadlift",
    category: "beensterkte",
    description:
      "Sta rechtop met een gewicht in je handen. Kantel je bovenlichaam voorwaarts door je heupen naar achteren te duwen, " +
      "terwijl je knieën licht gebogen blijven. Voel de rek in je hamstrings en kom terug omhoog. " +
      "Dit traint je hamstrings en bilspieren voor krachtige afzetten.",
    safety_cue:
      "Houd je rug altijd recht - buig nooit vanuit je onderrug. " +
      "Ga alleen zo ver naar beneden als je rug recht kan blijven.",
    korfbal_context:
      "Sterke hamstrings beschermen je knieën bij het landen na sprongen in korfbal.",
    difficulty: "intermediate",
    is_bilateral: 1,
    phv_safety: "caution",
    sets: 3,
    reps: "8",
    rest_seconds: 90,
  },
  {
    name: "Bulgarian Split Squat",
    category: "beensterkte",
    description:
      "Zet je achterste voet op een bank en je voorste voet een stap naar voren. " +
      "Zak langzaam naar beneden door je voorste knie te buigen. " +
      "Houd je romp recht en duw je knie niet voorbij je teen. " +
      "Dit is een krachtige eenbeens oefening voor balans en beenkracht.",
    safety_cue:
      "Begin zonder gewicht om de beweging te leren. " +
      "Zorg dat je voorste knie niet naar binnen kantelt.",
    korfbal_context:
      "Eenbeens kracht is essentieel voor de snelle richtingsveranderingen in korfbal.",
    difficulty: "intermediate",
    is_bilateral: 0,
    phv_safety: "caution",
    sets: 3,
    reps: "8 per been",
    rest_seconds: 90,
  },
  {
    name: "Step-up met knie-hef",
    category: "beensterkte",
    description:
      "Stap omhoog op een bank of kist met één been en til het andere been op door je knie hoog te heffen. " +
      "Stap gecontroleerd terug naar beneden. " +
      "Deze oefening traint je bilspieren, quadriceps en coördinatie tegelijk. " +
      "Begin laag en bouw de hoogte langzaam op.",
    safety_cue:
      "Gebruik altijd een stabiele kist of bank. " +
      "Stap gecontroleerd terug - spring niet naar beneden.",
    korfbal_context: "De explosieve knie-hef bootst het aanlopen voor een schot in korfbal na.",
    difficulty: "beginner",
    is_bilateral: 0,
    phv_safety: "allowed",
    sets: 3,
    reps: "10 per been",
    rest_seconds: 60,
  },
  {
    name: "Nordic Hamstring Curl",
    category: "beensterkte",
    description:
      "Kniel op een mat met je voeten vastgehouden. Val langzaam voorover en rem af met je hamstrings. " +
      "Gebruik je armen om te stoppen als je niet meer kunt en duw jezelf terug. " +
      "Dit is een van de beste oefeningen om hamstring blessures te voorkomen.",
    safety_cue:
      "Bouw dit heel langzaam op - begin met alleen de excentrische fase. " +
      "Doe dit nooit als je hamstring pijn hebt.",
    korfbal_context:
      "Sterke hamstrings verminderen het risico op spierscheuren bij sprint- en schietbewegingen.",
    difficulty: "advanced",
    is_bilateral: 1,
    phv_safety: "caution",
    sets: 3,
    reps: "5",
    rest_seconds: 120,
  },

  // Bovenlichaam (4)
  {
    name: "Push-up variaties",
    category: "bovenlichaam",
    description:
      "Vanuit een plankpositie laat je je lichaam zakken door je ellebogen te buigen, " +
      "dan duw je jezelf terug omhoog. Houd je lichaam als een rechte plank. " +
      "Begin op je knieën als standaard push-ups nog te zwaar zijn. " +
      "Gevorderden kunnen met verhoogde voeten oefenen.",
    safety_cue:
      "Houd je heupen op gelijke hoogte met je schouders - laat ze niet zakken. " +
      "Zorg dat je ellebogen niet te ver uitstaan.",
    korfbal_context:
      "Bovenlichaamkracht helpt bij het schieten en het opvangen van ballen in korfbal.",
    difficulty: "beginner",
    is_bilateral: 1,
    phv_safety: "allowed",
    sets: 3,
    reps: "10",
    rest_seconds: 60,
  },
  {
    name: "Schouder Press",
    category: "bovenlichaam",
    description:
      "Houd halters of een barbell op schouderhoogte en duw ze recht omhoog boven je hoofd. " +
      "Laat ze gecontroleerd terug zakken naar je schouders. " +
      "Houd je kern gespannen en je rug recht tijdens de beweging. " +
      "Dit bouwt kracht in je schouders en armen.",
    safety_cue:
      "Gebruik nooit te zwaar gewicht - je rug moet recht blijven. " +
      "Stop als je pijn voelt in je schouders of nek.",
    korfbal_context:
      "Schoudersterkte is direct belangrijk voor krachtige en accurate schoten in korfbal.",
    difficulty: "intermediate",
    is_bilateral: 1,
    phv_safety: "caution",
    sets: 3,
    reps: "10",
    rest_seconds: 90,
  },
  {
    name: "Roeien met weerstandsband",
    category: "bovenlichaam",
    description:
      "Bevestig een weerstandsband aan iets stevigs op borsthoogte. " +
      "Trek de band naar je toe door je ellebogen naar achteren te trekken. " +
      "Knijp je schouderbladen samen aan het einde van de beweging. " +
      "Dit traint je rugspieren en verbetert je houding.",
    safety_cue:
      "Gebruik een band met de juiste weerstand - niet te zwaar. " +
      "Houd je schouders omlaag en weg van je oren.",
    korfbal_context:
      "Trekkkracht in je rug helpt bij het vangen van hoge ballen en het handhaven van goede houding.",
    difficulty: "beginner",
    is_bilateral: 1,
    phv_safety: "allowed",
    sets: 3,
    reps: "12",
    rest_seconds: 60,
  },
  {
    name: "Y-T-W Schouderstabiliteit",
    category: "bovenlichaam",
    description:
      "Lig op je buik of leun voorover. Beweeg je armen in de vormen van een Y, T en W. " +
      "Bij de Y hef je armen schuin omhoog, bij de T recht opzij, en bij de W buig je ze als een W. " +
      "Gebruik lichte gewichten of doe het zonder gewicht. " +
      "Deze oefening versterkt de kleine spieren rondom je schouderbladen.",
    safety_cue:
      "Doe dit altijd met licht gewicht of zonder gewicht. " +
      "Als je pijn voelt in je schouder, stop dan meteen.",
    korfbal_context:
      "Schouderblad stabiliteit voorkomt blessures bij het gooien en vangen in korfbal.",
    difficulty: "beginner",
    is_bilateral: 1,
    phv_safety: "allowed",
    sets: 3,
    reps: "10 van elke vorm",
    rest_seconds: 60,
  },

  // Kern (4)
  {
    name: "Dead Bug",
    category: "kern",
    description:
      "Lig op je rug met je armen omhoog en je benen in een tafelblad positie (90 graden). " +
      "Laat langzaam één arm achterwaarts en het tegenovergestelde been naar beneden zakken, " +
      "zonder je rug van de grond te heffen. Kom terug en wissel. " +
      "Dit traint je kernstabiliteit op een veilige manier.",
    safety_cue:
      "Je lage rug moet altijd op de vloer blijven - druk hem lichtjes aan. " +
      "Ga nooit zo ver dat je rug begint te bollen.",
    korfbal_context:
      "Kernstabiliteit is de basis van alle korfbalbewegingen - van schieten tot springen.",
    difficulty: "beginner",
    is_bilateral: 0,
    phv_safety: "allowed",
    sets: 3,
    reps: "8 per kant",
    rest_seconds: 60,
  },
  {
    name: "Pallof Press",
    category: "kern",
    description:
      "Sta zijdelings naast een bevestigde weerstandsband op borsthoogte. " +
      "Houd de band voor je borst en duw hem recht vooruit, houd 2 seconden vast en trek terug. " +
      "Je kern werkt hard om rotatie te weerstaan. " +
      "Dit is een anti-rotatie oefening die functionele kernkracht opbouwt.",
    safety_cue:
      "Gebruik een lichte band om de techniek te leren. " +
      "Houd je heupen stil - laat ze niet draaien.",
    korfbal_context:
      "Anti-rotatie kracht helpt je stabieler te blijven bij het schieten en dribbelen.",
    difficulty: "intermediate",
    is_bilateral: 0,
    phv_safety: "allowed",
    sets: 3,
    reps: "10 per kant",
    rest_seconds: 60,
  },
  {
    name: "Plank variaties",
    category: "kern",
    description:
      "Ondersteun je lichaam op je ellebogen en voeten, houd je lichaam als een rechte plank. " +
      "Gevorderde variaties: verhoogde voeten, één arm optillen, één been optillen, " +
      "of bewegen naar een hoge plank op je handen. " +
      "Bouw de tijd geleidelijk op - begin met 20 seconden.",
    safety_cue:
      "Laat je heupen niet zakken of te hoog komen. " + "Stop als je lage rug begint te pijn doen.",
    korfbal_context:
      "Een sterke kern geeft je meer controle over je lichaam bij alle korfbalbewegingen.",
    difficulty: "beginner",
    is_bilateral: 1,
    phv_safety: "allowed",
    sets: 3,
    reps: "30 seconden",
    rest_seconds: 60,
  },
  {
    name: "Side Plank",
    category: "kern",
    description:
      "Ondersteun je lichaam op één elleboog en de zijkant van je voet. " +
      "Je lichaam vormt een rechte lijn van hoofd tot voeten. " +
      "Houd je heupen omhoog - laat ze niet zakken. " +
      "Dit traint de zijkanten van je kern (obliques) en helpt bij laterale stabiliteit.",
    safety_cue:
      "Begin kort (15-20 seconden) en bouw op. " + "Als je heupen zakken, stop dan en rust.",
    korfbal_context:
      "Laterale kernkracht helpt je stabiel te blijven bij zijwaartse bewegingen in korfbal.",
    difficulty: "beginner",
    is_bilateral: 0,
    phv_safety: "allowed",
    sets: 3,
    reps: "20 seconden per kant",
    rest_seconds: 60,
  },

  // Plyometrie (4)
  {
    name: "Box Jump",
    category: "plyometrie",
    description:
      "Sta voor een stevige kist of platform. Spring explosief omhoog en land zacht op de kist " +
      "door door je knieën te buigen. Stap (niet spring) naar beneden en reset. " +
      "Focus op een zachte, gecontroleerde landing - niet op de hoogte. " +
      "Dit traint explosiviteit en springkracht.",
    safety_cue:
      "Land altijd met gebogen knieën en zachte voeten - nooit stijfbeens. " +
      "Kies altijd een kist die comfortabel lager is dan je maximum.",
    korfbal_context:
      "Explosieve springkracht is direct toepasbaar bij het schieten op het doel in korfbal.",
    difficulty: "intermediate",
    is_bilateral: 1,
    phv_safety: "caution",
    sets: 4,
    reps: "5",
    rest_seconds: 120,
  },
  {
    name: "Lateral Bound",
    category: "plyometrie",
    description:
      "Spring zijwaarts van één been naar het andere. " +
      "Land op één been en absorbeer de kracht door door je knie en heup te buigen. " +
      "Houd je balans een moment vast voordat je weer springt. " +
      "Begin klein en vergroot de afstand geleidelijk.",
    safety_cue:
      "Land altijd met een gebogen knie - nooit op een gestrekt been. " +
      "Begin op een vlak, niet-glad oppervlak.",
    korfbal_context:
      "Zijwaartse explosiviteit helpt bij het ontwijken van tegenstanders in korfbal.",
    difficulty: "intermediate",
    is_bilateral: 0,
    phv_safety: "caution",
    sets: 3,
    reps: "6 per kant",
    rest_seconds: 90,
  },
  {
    name: "Drop Jump",
    category: "plyometrie",
    description:
      "Stap (niet spring) van een lage kist en spring direct omhoog zodra je de grond raakt. " +
      "De contacttijd met de grond moet zo kort mogelijk zijn. " +
      "Dit traint het stretchverkort-cyclus reactievermogen van je spieren. " +
      "Begin met een lage kist van 20-30 cm.",
    safety_cue:
      "Gebruik alleen een lage kist (max 30 cm) voor jeugd. " +
      "Doe dit nooit als je vermoeid bent - de risico op blessures is dan hoger.",
    korfbal_context:
      "Reactief springvermogen helpt bij het snel omhoog komen voor kopballen en afzetten.",
    difficulty: "advanced",
    is_bilateral: 1,
    phv_safety: "caution",
    sets: 4,
    reps: "5",
    rest_seconds: 120,
  },
  {
    name: "Ankle Hops",
    category: "plyometrie",
    description:
      "Spring snel op en neer op de ballen van je voeten, gebruik minimale kniebewegingen. " +
      "De beweegkracht komt bijna volledig uit je enkels. " +
      "Probeer zo snel mogelijk contact te herstellen met de grond. " +
      "Begin langzaam en verhoog het tempo als je comfortabel bent.",
    safety_cue:
      "Begin op een zachte ondergrond zoals gras of een gymmat. " +
      "Stop als je pijn voelt in je enkels of scheenbenen.",
    korfbal_context: "Snelle enkelfunctie verbetert je loopsnelheid en afzet in korfbal.",
    difficulty: "beginner",
    is_bilateral: 1,
    phv_safety: "allowed",
    sets: 3,
    reps: "20",
    rest_seconds: 60,
  },

  // Herstel (3)
  {
    name: "Foam Roll Beenspieren",
    category: "herstel",
    description:
      "Rol langzaam over je quadriceps, hamstrings, kuiten en IT-band met een foam roller. " +
      "Stop bij gevoelige plekken en houd 30-60 seconden druk vast. " +
      "Dit helpt spierspanning los te maken en herstel te versnellen. " +
      "Rol elke spiergroep 1-2 minuten.",
    safety_cue:
      "Rol nooit over gewrichten zoals knieën of enkels. " +
      "Vermijd directe druk op al pijnlijke spieren na een zware training.",
    korfbal_context:
      "Regelmatig foam rollen na korfbaltraining vermindert spierpijn en versnelt herstel.",
    difficulty: "beginner",
    is_bilateral: 0,
    phv_safety: "allowed",
    sets: 1,
    reps: "2 minuten per spiergroep",
    rest_seconds: 0,
  },
  {
    name: "Hip Flexor Stretch",
    category: "herstel",
    description:
      "Kniel op één knie (lunge positie) en duw je heupen licht naar voren " +
      "totdat je een rek voelt aan de voorkant van je heup en bovenbeen. " +
      "Houd 30-60 seconden vast per kant. " +
      "Veel sporters hebben stijve heupbuigers door veel zitten - dit is een belangrijke stretch.",
    safety_cue:
      "Ga niet te ver in de stretch - je moet geen pijn voelen, alleen een trekgevoel. " +
      "Houd je rug recht en duw je heupen niet te hard naar voren.",
    korfbal_context:
      "Flexibele heupbuigers geven je een groter bewegingsbereik bij het schieten en springen.",
    difficulty: "beginner",
    is_bilateral: 0,
    phv_safety: "allowed",
    sets: 2,
    reps: "45 seconden per kant",
    rest_seconds: 30,
  },
  {
    name: "Thoracale Mobiliteit",
    category: "herstel",
    description:
      "Lig op je rug over een foam roller of opgerolde handdoek op borsthoogte. " +
      "Laat je borstwervelkolom langzaam uitstrekken over de rol. " +
      "Je kunt ook zittend op een stoel draaibewegingen maken met je bovenlichaam. " +
      "Goede thoracale mobiliteit verbetert je houding en schouderbeweging.",
    safety_cue:
      "Doe dit nooit over je lendenwervels - alleen over de borstwervelkolom. " +
      "Bewoog langzaam en geforceerd nooit.",
    korfbal_context:
      "Goede rugbewegelijkheid verbetert je schouterrotatie bij het gooien en schieten in korfbal.",
    difficulty: "beginner",
    is_bilateral: 1,
    phv_safety: "allowed",
    sets: 2,
    reps: "10 bewegingen",
    rest_seconds: 30,
  },

  // COORDINATIE (5)
  {
    name: "Ladderrun Lateraal",
    category: "coordinatie" as const,
    description:
      "Zet een ladderoefening uit op de grond. Stap snel zijwaarts door de vakjes: links in, rechts in, links uit, rechts uit. " +
      "Houd je knieën licht gebogen en je romp stabiel. Oefen eerst langzaam, dan steeds sneller. " +
      "Dit traint je coördinatie en voetenwerk voor snelle zijwaartse bewegingen.",
    safety_cue:
      "Kijk voor je, niet naar je voeten. Stop direct als je een enkel verzwikt.",
    korfbal_context:
      "Snel lateraal voetenwerk is essentieel voor het in en uit dekken van tegenstanders in korfbal.",
    difficulty: "beginner" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 3,
    reps: "4 lengtes",
    rest_seconds: 60,
  },
  {
    name: "Ladderrun Voorwaarts-Achterwaarts",
    category: "coordinatie" as const,
    description:
      "Loop voorwaarts door elk vak van de ladder (één voet per vak), draai dan en loop terug achterwaarts. " +
      "Houd je armen actief en je houding rechtop. Begin langzaam en verhoog de snelheid. " +
      "Dit verbetert voor-achterwaartse acceleratie en coördinatie.",
    safety_cue:
      "Zorg voor een vlakke ondergrond. Loop achterwaarts alleen als je de ruimte kent.",
    korfbal_context:
      "In- en uitlopen achter de post vereist snelle voor-achterwaartse versnellingen typisch voor korfbal.",
    difficulty: "beginner" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 3,
    reps: "4 lengtes",
    rest_seconds: 60,
  },
  {
    name: "Mirror Drill",
    category: "coordinatie" as const,
    description:
      "Sta tegenover een partner of spiegel op 2 meter afstand. De leider maakt willekeurige bewegingen — zijwaarts, voorwaarts, achterwaarts. " +
      "Jij volgt zo snel mogelijk. Wissel elke 20 seconden de rol. " +
      "Dit traint reactiesnelheid en anticipatie op tegenstanders.",
    safety_cue: "Houd voldoende ruimte om je heen. Stop bij duizeligheid.",
    korfbal_context:
      "Directe reactie op tegenstander-bewegingen is de kern van één-op-één-verdediging in korfbal.",
    difficulty: "intermediate" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 4,
    reps: "20 sec per rol",
    rest_seconds: 45,
  },
  {
    name: "Laterale Shuffle",
    category: "coordinatie" as const,
    description:
      "Sta met gebogen knieën in een lage atletische houding. Schuifel snel zijwaarts 5 meter, tik de grond aan, schuifel terug. " +
      "Kruis je voeten niet. Houd je hoofd omhoog en je gewicht op de voorvoet. " +
      "Dit bouwt laterale snelheid en stabiliteit.",
    safety_cue:
      "Kruis je voeten niet — dit vergroot het valrisico. Houd je knieën licht gebogen.",
    korfbal_context:
      "Snel zijwaarts bewegen zonder de dekking te verliezen is een basistechniek in korfbalverdediging.",
    difficulty: "beginner" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 4,
    reps: "5m heen en terug",
    rest_seconds: 45,
  },
  {
    name: "Richtingswisselloop",
    category: "coordinatie" as const,
    description:
      "Zet vier pionnen uit in een T-vorm. Ren vooruit naar het midden, shuffle links, shuffle rechts, " +
      "shuffle terug naar midden en sprint achteruit naar start. Houd altijd je gezicht naar de voorste pion. " +
      "Dit is een klassieke wendbaarheidstest.",
    safety_cue:
      "Vermijd plotselinge stops op harde ondergrond — verlaag je zwaartepunt voor elke wisseling.",
    korfbal_context:
      "De T-drill spiegelt de snelle richtingsveranderingen bij aanvallen en verdedigen in korfbal.",
    difficulty: "intermediate" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 4,
    reps: "1 volledige T",
    rest_seconds: 90,
  },

  // SNELHEID (5)
  {
    name: "A-Skip",
    category: "snelheid" as const,
    description:
      "Loop voorwaarts terwijl je afwisselend een knie hoog optilt tot heuphogte en de andere voet actief neerzet. " +
      "Duw jezelf omhoog met de steunvoet en houd je armen actief. " +
      "Dit verbetert je sprintmechanica.",
    safety_cue:
      "Houd je romp rechtop — buig niet vanuit de heup. Begin op lage snelheid.",
    korfbal_context:
      "Goede sprintmechanica verhoogt je maximale snelheid bij uitbreken naar vrije ruimte in korfbal.",
    difficulty: "beginner" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 3,
    reps: "20m",
    rest_seconds: 60,
  },
  {
    name: "Build-up Sprint",
    category: "snelheid" as const,
    description:
      "Start vanuit stilstand en verhoog je snelheid geleidelijk over 40 meter: 0-10m = 50%, 10-25m = 75%, 25-40m = 95% van je max. " +
      "Focus op vloeiende loopmechanica, geen plotselinge acceleraties. Herstel 2 minuten tussen sprints.",
    safety_cue:
      "Nooit een build-up sprint doen zonder 10 minuten warming-up. Stop bij pijn in de hamstring.",
    korfbal_context:
      "Snelheidsopbouw over 30-40m spiegelt de uitbraaksituaties in korfbal na het winnen van de bal.",
    difficulty: "intermediate" as const,
    is_bilateral: 1 as const,
    phv_safety: "caution" as const,
    sets: 4,
    reps: "40m",
    rest_seconds: 120,
  },
  {
    name: "Hoge Knieloop",
    category: "snelheid" as const,
    description:
      "Loop voorwaarts met maximale knieheffing: elke knie komt tot heuphogte bij elke stap. " +
      "Houd contact met de grond kort en veerkrachtig. Armen bewegen krachtig in tegengestelde richting.",
    safety_cue:
      "Niet op de hielen landen — land op de middenvoet. Begin op halve snelheid.",
    korfbal_context:
      "Hoge stapfrequentie zorgt voor een snellere eerste stap in verdedigingssituaties.",
    difficulty: "beginner" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 3,
    reps: "20m",
    rest_seconds: 60,
  },
  {
    name: "Hielbijtloop",
    category: "snelheid" as const,
    description:
      "Loop voorwaarts terwijl je bij elke stap je hiel richting je bilspieren brengt. " +
      "Houd een hoge kniepositie. Voeten landen snel onder je lichaam. " +
      "Dit traint hamstring-activatie voor explosieve sprongen en sprints.",
    safety_cue:
      "Wees voorzichtig bij hamstring-klachten. Stop bij steken achter in het bovenbeen.",
    korfbal_context:
      "Actieve hamstring-betrokkenheid vermindert blessurerisico bij snelle afzetstappen in korfbal.",
    difficulty: "beginner" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 3,
    reps: "20m",
    rest_seconds: 60,
  },
  {
    name: "Acceleratiesprint 10m",
    category: "snelheid" as const,
    description:
      "Start vanuit een split-start. Explodeer maximaal voorwaarts over 10 meter. " +
      "De eerste 3 stappen zijn klein en krachtig. Herstel volledig tussen pogingen.",
    safety_cue:
      "Alleen uitvoeren na volledige warming-up (10+ min). Maximale inspanning zonder warming-up veroorzaakt hamstring-scheuren.",
    korfbal_context:
      "De 0-10m acceleratie is de meest gebruikte sprint in korfbal — voor vrijlopen en verdedigen.",
    difficulty: "intermediate" as const,
    is_bilateral: 1 as const,
    phv_safety: "caution" as const,
    sets: 5,
    reps: "10m max",
    rest_seconds: 120,
  },

  // EXTRA PLYOMETRIE (3)
  {
    name: "Lateral Box Jump",
    category: "plyometrie" as const,
    description:
      "Sta naast een lage box (20-30cm). Spring zijwaarts op de box, land met beide voeten tegelijk en gedempt. " +
      "Stap af aan de andere kant en herhaal. Focus op stille, gecontroleerde landing.",
    safety_cue:
      "Stap altijd af — spring nooit van de box af. Begin met een lage box.",
    korfbal_context:
      "Laterale explosiviteit is nodig voor het zijwaarts uitsteken naar de bal bij verdedigingsacties.",
    difficulty: "intermediate" as const,
    is_bilateral: 1 as const,
    phv_safety: "caution" as const,
    sets: 3,
    reps: "6",
    rest_seconds: 90,
  },
  {
    name: "Tuck Jump",
    category: "plyometrie" as const,
    description:
      "Spring verticaal omhoog en trek je knieën maximaal op naar je borst. Land zacht op de middenvoet. " +
      "Focus op maximale hoogte én maximale knieheffing.",
    safety_cue:
      "Alleen bij goede basistechniek. Land altijd gedempt — nooit op gestrekte knieën.",
    korfbal_context:
      "Knieheffing in de lucht vergroot de maximale spronghoogte bij kopballen en verlengen in korfbal.",
    difficulty: "advanced" as const,
    is_bilateral: 1 as const,
    phv_safety: "caution" as const,
    sets: 3,
    reps: "5",
    rest_seconds: 120,
  },
  {
    name: "Bounding",
    category: "plyometrie" as const,
    description:
      "Ren voorwaarts met overdreven grote stappen: duw krachtig af en zweef zo lang mogelijk. " +
      "Hoog knieheffing, lange zweeffase, actieve armbeweging.",
    safety_cue:
      "Alleen met goede hamstring-kracht. Stop bij pijn in enkel of knie. Begin op gras.",
    korfbal_context:
      "Bounding bouwt de explosieve kracht voor de lange eerste stap bij aanvalsacties in korfbal.",
    difficulty: "advanced" as const,
    is_bilateral: 0 as const,
    phv_safety: "caution" as const,
    sets: 3,
    reps: "20m",
    rest_seconds: 120,
  },

  // EXTRA BEENSTERKTE (2)
  {
    name: "Single Leg Squat progressie",
    category: "beensterkte" as const,
    description:
      "Sta op één been. Zak langzaam neer op het steunbeen tot de dij parallel aan de grond is. " +
      "Gebruik een stoel voor ondersteuning als je er nog niet bent. Duw jezelf terug omhoog.",
    safety_cue:
      "Begin met ondersteuning. Laat je knie nooit naar binnen zakken.",
    korfbal_context:
      "Maximale eenbeens kracht is de basis voor afzettechnieken bij doelpogingen in korfbal.",
    difficulty: "advanced" as const,
    is_bilateral: 0 as const,
    phv_safety: "caution" as const,
    sets: 3,
    reps: "5 per been",
    rest_seconds: 120,
  },
  {
    name: "Glute Bridge",
    category: "beensterkte" as const,
    description:
      "Lig op je rug met gebogen knieën. Duw je heupen omhoog tot je lichaam een rechte lijn vormt. " +
      "Knijp je bilspieren samen bovenin en houd 2 seconden vast. Laat langzaam zakken.",
    safety_cue:
      "Duw niet zo hoog dat je onderrug overstrekt. Houd je kern gespannen.",
    korfbal_context:
      "Sterke bilspieren zijn de motor achter elke versnelling en sprong in korfbal.",
    difficulty: "beginner" as const,
    is_bilateral: 1 as const,
    phv_safety: "allowed" as const,
    sets: 3,
    reps: "15",
    rest_seconds: 60,
  },
];

export function seedExercises(db: Database): void {
  const count = (db.query("SELECT COUNT(*) as count FROM exercise").get() as { count: number })
    .count;

  if (count > 0) {
    return; // Already seeded
  }

  const insert = db.prepare(`
    INSERT INTO exercise (
      name, category, description, safety_cue, korfbal_context,
      difficulty, is_bilateral, phv_safety, sets, reps, rest_seconds
    ) VALUES (
      $name, $category, $description, $safety_cue, $korfbal_context,
      $difficulty, $is_bilateral, $phv_safety, $sets, $reps, $rest_seconds
    )
  `);

  const insertMany = db.transaction((exercises: Exercise[]) => {
    for (const ex of exercises) {
      insert.run({
        $name: ex.name,
        $category: ex.category,
        $description: ex.description,
        $safety_cue: ex.safety_cue,
        $korfbal_context: ex.korfbal_context,
        $difficulty: ex.difficulty,
        $is_bilateral: ex.is_bilateral,
        $phv_safety: ex.phv_safety,
        $sets: ex.sets,
        $reps: ex.reps,
        $rest_seconds: ex.rest_seconds,
      });
    }
  });

  insertMany(EXERCISES);
}
