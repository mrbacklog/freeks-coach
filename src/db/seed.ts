import type { Database } from "bun:sqlite";

interface Exercise {
  name: string;
  category: "beensterkte" | "bovenlichaam" | "kern" | "plyometrie" | "herstel";
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
