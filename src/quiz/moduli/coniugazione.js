/* ═══════════════════════════════════════════════════════════════════
   CONIUGAZIONE — coniugare i verbi italiani, dal presente ai tempi
   che si sbagliano davvero.

   La scaletta segue quello che un bambino incontra a scuola: prima il
   presente regolare (tre famiglie, -are -ere -ire), poi gli irregolari
   di ogni giorno (essere, avere, andare…), poi il passato prossimo —
   che sono DUE errori diversi, l'ausiliare sbagliato («ho andato») e
   il participio sbagliato («aprito») — poi imperfetto e futuro, e in
   cima i participi più duri insieme alle frasi intere, dove i due
   errori del passato prossimo si vedono insieme.

   I FALSI SONO ERRORI VERI, non lettere a caso, e per lo più si
   COSTRUISCONO invece di scriverli tutti a mano:
     · la «regolarizzazione» — un bambino che applica la regola giusta
       al verbo sbagliato («io ando» invece di «vado») — si calcola dal
       verbo stesso (`regolarizza`), e si scarta da sola quando
       coincide col vero (capita spesso: «noi andiamo» è regolare
       anche per davvero);
     · lo scambio -isc-/niente («capo» invece di «capisco») si toglie
       dalla desinenza vera;
     · lo scambio -evo/-ivo all'imperfetto («facivo» invece di
       «facevo») si calcola con un `replace`;
     · il futuro che tiene la vocale dell'infinito («parlarò» invece
       di «parlerò») si calcola dalla radice.
   Il passato prossimo (`PARTICIPI`) resta scritto a mano, parola per
   parola: lì non c'è una regola da applicare male, c'è solo la forma
   vera da sapere o non sapere, come le parole di `ortografia.js`.

   TRE FORMATI, alternati con `sorte.forse()`: la frase col buco
   («Marta ___ (fare) i compiti»), la domanda diretta («qual è la
   forma di «mangiare» con «tu»?» / «qual è il passato di…?») e la
   frase intera da riconoscere fra tre versioni — quest'ultima è dove
   ausiliare e participio sbagliano insieme, come li sbaglia un
   bambino per davvero.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

/* ── il presente regolare ──
   Le desinenze delle quattro famiglie (la quarta è la stessa dei verbi
   in -ire che mettono -isc- in mezzo: capire, non dormire). Servono
   anche a «regolarizzare» un verbo irregolare — vedi più sotto. */
const DESINENZE = {
  are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'],
  ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'],
  ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono'],
  ireIsc: ['isco', 'isci', 'isce', 'iamo', 'ite', 'iscono'],
}
const PRONOMI = ['io', 'tu', 'lui', 'noi', 'voi', 'loro']

const formeRegolari = (infinito, tipo) => {
  const radice = infinito.slice(0, infinito.length - 3)
  return DESINENZE[tipo].map(fin => radice + fin)
}

const REGOLARI = {
  are: {
    dritta: 'i verbi in -are al presente fanno: -o, -i, -a, -iamo, -ate, -ano',
    verbi: ['mangiare', 'giocare', 'parlare', 'cantare', 'saltare', 'guardare', 'ascoltare',
      'disegnare', 'lavare', 'portare', 'aiutare', 'chiamare', 'cucinare', 'comprare',
      'lavorare', 'nuotare', 'volare', 'suonare'],
  },
  ere: {
    dritta: 'i verbi in -ere al presente fanno: -o, -i, -e, -iamo, -ete, -ono',
    verbi: ['credere', 'vedere', 'leggere', 'scrivere', 'correre', 'ridere', 'prendere',
      'chiudere', 'mettere', 'perdere', 'vivere', 'ripetere', 'temere', 'vendere'],
  },
  ire: {
    dritta: 'i verbi in -ire (quelli semplici) al presente fanno: -o, -i, -e, -iamo, -ite, -ono',
    verbi: ['dormire', 'partire', 'aprire', 'sentire', 'seguire', 'offrire', 'servire',
      'vestire', 'coprire', 'soffrire'],
  },
  ireIsc: {
    dritta: 'molti verbi in -ire mettono -isc- in mezzo: capire fa capisco, non capo',
    verbi: ['capire', 'finire', 'preferire', 'pulire', 'costruire', 'spedire', 'unire',
      'colpire', 'guarire', 'agire', 'punire', 'gestire'],
  },
}

/* ── il presente irregolare ──
   Solo le forme vere: la «dritta» e l'errore-per-regolarizzazione si
   calcolano da qui, non si scrivono a mano (`regolarizza`, sotto). */
const IRREGOLARI = [
  { infinito: 'essere', forme: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'] },
  { infinito: 'avere', forme: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'] },
  { infinito: 'andare', forme: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'] },
  { infinito: 'fare', forme: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'] },
  { infinito: 'dare', forme: ['do', 'dai', 'dà', 'diamo', 'date', 'danno'] },
  { infinito: 'stare', forme: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'] },
  { infinito: 'venire', forme: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'] },
  { infinito: 'dire', forme: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'] },
  { infinito: 'uscire', forme: ['esco', 'esci', 'esce', 'usciamo', 'uscite', 'escono'] },
  { infinito: 'potere', forme: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono'] },
  { infinito: 'volere', forme: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'] },
  { infinito: 'sapere', forme: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'] },
]

/* l'errore di un bambino che tratta un irregolare come se fosse
   regolare: «andare» → «io ando», non «vado». Capita che coincida col
   vero (dare → noi «diamo» è regolare per davvero): chi chiama questa
   funzione controlla sempre che il risultato sia diverso dal vero. */
const regolarizza = (infinito, idx) => {
  const tipo = infinito.slice(-3)
  const radice = infinito.slice(0, infinito.length - 3)
  return radice + DESINENZE[tipo][idx]
}

/* ── il passato prossimo: ausiliare e participio ──
   Ogni voce: l'infinito, il participio vero, l'ausiliare, due errori
   che un bambino scrive davvero, un'emoji se aiuta a capire di cosa si
   parla, e — solo per i verbi che si prestano a una frase intera — un
   `compl` per costruirla («Luca ___ (andare) al parco»).
   `irregolare: true` sono i participi che non seguono -ato/-uto/-ito:
   sono quelli della tappa più dura. */
const PARTICIPI = [
  { infinito: 'andare', participio: 'andato', ausiliare: 'essere', errori: ['anduto', 'andito'], compl: 'al parco', emoji: '🚶', irregolare: false },
  { infinito: 'venire', participio: 'venuto', ausiliare: 'essere', errori: ['venito', 'veniuto'], compl: 'a casa nostra', emoji: '🏠', irregolare: false },
  { infinito: 'tornare', participio: 'tornato', ausiliare: 'essere', errori: ['tornuto', 'tornito'], compl: 'a casa', irregolare: false },
  { infinito: 'uscire', participio: 'uscito', ausiliare: 'essere', errori: ['usciuto', 'uscato'], compl: 'con gli amici', irregolare: false },
  { infinito: 'entrare', participio: 'entrato', ausiliare: 'essere', errori: ['entruto', 'entrito'], compl: 'in classe', irregolare: false },
  { infinito: 'partire', participio: 'partito', ausiliare: 'essere', errori: ['partuto', 'partato'], compl: 'per il mare', emoji: '✈️', irregolare: false },
  { infinito: 'arrivare', participio: 'arrivato', ausiliare: 'essere', errori: ['arrivuto', 'arrivito'], compl: 'in ritardo', irregolare: false },
  { infinito: 'cadere', participio: 'caduto', ausiliare: 'essere', errori: ['cadito', 'cadato'], compl: 'dalle scale', irregolare: false },
  { infinito: 'nascere', participio: 'nato', ausiliare: 'essere', errori: ['nasciuto', 'nascuto'], compl: 'in inverno', emoji: '👶', irregolare: true },
  { infinito: 'rimanere', participio: 'rimasto', ausiliare: 'essere', errori: ['rimanuto', 'rimanato'], compl: 'a casa', irregolare: true },
  { infinito: 'diventare', participio: 'diventato', ausiliare: 'essere', errori: ['diventuto', 'diventito'], compl: 'famoso', agg: true, irregolare: false },
  { infinito: 'stare', participio: 'stato', ausiliare: 'essere', errori: ['stauto', 'statito'], compl: 'zitto', agg: true, irregolare: true },
  { infinito: 'essere', participio: 'stato', ausiliare: 'essere', errori: ['essuto', 'essato'], compl: 'contento', agg: true, irregolare: true },
  { infinito: 'mangiare', participio: 'mangiato', ausiliare: 'avere', errori: ['mangiuto', 'mangito'], compl: 'la pizza', emoji: '🍕', irregolare: false },
  { infinito: 'guardare', participio: 'guardato', ausiliare: 'avere', errori: ['guarduto', 'guardito'], compl: 'un film', emoji: '📺', irregolare: false },
  { infinito: 'leggere', participio: 'letto', ausiliare: 'avere', errori: ['legguto', 'leggato'], compl: 'un libro', emoji: '📖', irregolare: true },
  { infinito: 'scrivere', participio: 'scritto', ausiliare: 'avere', errori: ['scrivuto', 'scrivato'], compl: 'una lettera', emoji: '✍️', irregolare: true },
  { infinito: 'prendere', participio: 'preso', ausiliare: 'avere', errori: ['prenduto', 'prendato'], compl: 'il pallone', emoji: '⚽', irregolare: true },
  { infinito: 'vedere', participio: 'visto', ausiliare: 'avere', errori: ['vedato', 'vedito'], compl: 'un film', emoji: '👀', irregolare: true },
  { infinito: 'fare', participio: 'fatto', ausiliare: 'avere', errori: ['fato', 'faciuto'], compl: 'i compiti', emoji: '📝', irregolare: true },
  { infinito: 'dire', participio: 'detto', ausiliare: 'avere', errori: ['dito', 'diciuto'], compl: 'la verità', irregolare: true },
  { infinito: 'comprare', participio: 'comprato', ausiliare: 'avere', errori: ['compruto', 'comprito'], compl: 'un gelato', emoji: '🍦', irregolare: false },
  { infinito: 'giocare', participio: 'giocato', ausiliare: 'avere', errori: ['giocuto', 'giocito'], compl: 'a calcio', emoji: '⚽', irregolare: false },
  { infinito: 'rompere', participio: 'rotto', ausiliare: 'avere', errori: ['romputo', 'rompato'], irregolare: true },
  { infinito: 'chiudere', participio: 'chiuso', ausiliare: 'avere', errori: ['chiuduto', 'chiudato'], irregolare: true },
  { infinito: 'aprire', participio: 'aperto', ausiliare: 'avere', errori: ['aprito', 'apruto'], irregolare: true },
  { infinito: 'mettere', participio: 'messo', ausiliare: 'avere', errori: ['mettuto', 'mettato'], irregolare: true },
  { infinito: 'perdere', participio: 'perso', ausiliare: 'avere', errori: ['perdito', 'perdato'], irregolare: true },
  { infinito: 'chiedere', participio: 'chiesto', ausiliare: 'avere', errori: ['chiedito', 'chiedato'], irregolare: true },
  { infinito: 'rispondere', participio: 'risposto', ausiliare: 'avere', errori: ['rispondito', 'rispondato'], irregolare: true },
  { infinito: 'decidere', participio: 'deciso', ausiliare: 'avere', errori: ['decidito', 'decidato'], irregolare: true },
  { infinito: 'vincere', participio: 'vinto', ausiliare: 'avere', errori: ['vinciuto', 'vincuto'], irregolare: true },
  { infinito: 'scegliere', participio: 'scelto', ausiliare: 'avere', errori: ['sceglito', 'scegliuto'], irregolare: true },
  { infinito: 'correre', participio: 'corso', ausiliare: 'avere', errori: ['corruto', 'correto'], irregolare: true },
  { infinito: 'offrire', participio: 'offerto', ausiliare: 'avere', errori: ['offrito', 'offruto'], irregolare: true },
  { infinito: 'dormire', participio: 'dormito', ausiliare: 'avere', errori: ['dormuto', 'dormato'], irregolare: false },
  { infinito: 'credere', participio: 'creduto', ausiliare: 'avere', errori: ['credato', 'credito'], irregolare: false },
  { infinito: 'ascoltare', participio: 'ascoltato', ausiliare: 'avere', errori: ['ascoltuto', 'ascoltito'], irregolare: false },
  { infinito: 'pulire', participio: 'pulito', ausiliare: 'avere', errori: ['pulato', 'puluto'], irregolare: false },
  { infinito: 'vendere', participio: 'venduto', ausiliare: 'avere', errori: ['vendato', 'vendito'], irregolare: false },
  { infinito: 'finire', participio: 'finito', ausiliare: 'avere', errori: ['finato', 'finuto'], irregolare: false },
  { infinito: 'temere', participio: 'temuto', ausiliare: 'avere', errori: ['temato', 'temito'], irregolare: false },
  { infinito: 'bere', participio: 'bevuto', ausiliare: 'avere', errori: ['beuto', 'bevato'], irregolare: true },
]
const CON_COMPLEMENTO = PARTICIPI.filter(v => v.compl)
const femminile = p => p.slice(0, -1) + 'a'
const SOGGETTI = [{ nome: 'Luca', genere: 'm' }, { nome: 'Marta', genere: 'f' }]

/* ── l'accordo col soggetto ──
   Col passato prossimo di ESSERE tutto quello che segue si accorda:
   il participio («Marta è andata»), il participio SBAGLIATO dei falsi
   («è anduta», che se restasse maschile si scarterebbe a occhio senza
   sapere niente) e il complemento quando è un aggettivo — `agg: true`,
   cioè «famoso», «zitto», «contento». Con avere non si accorda niente
   («Marta ha mangiato la pizza»), ed è proprio la differenza che
   questo grado insegna. Prima si accordava solo il participio, e usciva
   «Ieri Marta è diventata famoso». */
const accorda = (parola, v, sog) =>
  v.ausiliare === 'essere' && sog.genere === 'f' ? femminile(parola) : parola
const complementoDi = (v, sog) => (v.agg ? accorda(v.compl, v, sog) : v.compl)

/* ── imperfetto e futuro: gli irregolari veri ──
   Andare, stare e i verbi in -are in generale sono regolari a questi
   due tempi (andavo, andrò con la sola radice che cambia): gli
   irregolari da imparare a memoria sono questi. */
const IMPERFETTO_IRR = [
  { infinito: 'essere', forme: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'] },
  { infinito: 'fare', forme: ['facevo', 'facevi', 'faceva', 'facevamo', 'facevate', 'facevano'] },
  { infinito: 'dire', forme: ['dicevo', 'dicevi', 'diceva', 'dicevamo', 'dicevate', 'dicevano'] },
  { infinito: 'bere', forme: ['bevevo', 'bevevi', 'beveva', 'bevevamo', 'bevevate', 'bevevano'] },
]
const FUTURO_IRR = [
  { infinito: 'essere', forme: ['sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno'] },
  { infinito: 'avere', forme: ['avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno'] },
  { infinito: 'andare', forme: ['andrò', 'andrai', 'andrà', 'andremo', 'andrete', 'andranno'] },
  { infinito: 'fare', forme: ['farò', 'farai', 'farà', 'faremo', 'farete', 'faranno'] },
  { infinito: 'venire', forme: ['verrò', 'verrai', 'verrà', 'verremo', 'verrete', 'verranno'] },
  { infinito: 'potere', forme: ['potrò', 'potrai', 'potrà', 'potremo', 'potrete', 'potranno'] },
  { infinito: 'vedere', forme: ['vedrò', 'vedrai', 'vedrà', 'vedremo', 'vedrete', 'vedranno'] },
  { infinito: 'sapere', forme: ['saprò', 'saprai', 'saprà', 'sapremo', 'saprete', 'sapranno'] },
  { infinito: 'dovere', forme: ['dovrò', 'dovrai', 'dovrà', 'dovremo', 'dovrete', 'dovranno'] },
  { infinito: 'volere', forme: ['vorrò', 'vorrai', 'vorrà', 'vorremo', 'vorrete', 'vorranno'] },
  { infinito: 'stare', forme: ['starò', 'starai', 'starà', 'staremo', 'starete', 'staranno'] },
]
const IMPERFETTO_END = {
  are: ['avo', 'avi', 'ava', 'avamo', 'avate', 'avano'],
  ere: ['evo', 'evi', 'eva', 'evamo', 'evate', 'evano'],
  ire: ['ivo', 'ivi', 'iva', 'ivamo', 'ivate', 'ivano'],
}
const FUTURO_END = ['ò', 'ai', 'à', 'emo', 'ete', 'anno']
const futuroStem = (infinito, tipo) => {
  const radice = infinito.slice(0, infinito.length - 3)
  return tipo === 'ire' ? radice + 'ir' : radice + 'er'
}

/* verbi «sicuri» per la coniugazione regolare a imperfetto e futuro:
   niente -ciare/-giare/-care/-gare, che al futuro cambiano ortografia
   (mangerò, non mangerò... anzi «giocherò» con la h) — una cosa in
   più da spiegare che non è la coniugazione. */
const ARE_SICURI = ['parlare', 'cantare', 'saltare', 'guardare', 'ascoltare', 'lavare', 'portare',
  'aiutare', 'chiamare', 'comprare', 'lavorare', 'nuotare', 'suonare', 'guidare', 'cucinare',
  'disegnare', 'aspettare']
const ERE_SICURI = ['credere', 'leggere', 'scrivere', 'prendere', 'chiudere', 'mettere', 'perdere',
  'ripetere', 'temere', 'vendere', 'correre']
const IRE_SICURI = ['dormire', 'partire', 'sentire', 'seguire', 'servire', 'coprire', 'vestire',
  'capire', 'finire', 'preferire', 'pulire', 'spedire', 'unire', 'colpire', 'guarire', 'punire',
  'gestire']

const SCALETTA = [
  'il presente dei verbi regolari (-are, -ere, -ire)',
  'il presente dei verbi irregolari di ogni giorno',
  'il passato prossimo: ausiliare e participio',
  'imperfetto e futuro',
  'i participi più difficili e gli errori che si fanno davvero',
]

/* Le tipologie. Il presente è un gruppo suo: si coniuga parlando, e un
   bambino che dice «noi andiamo» lo sa fare prima di sapere che si
   chiama presente indicativo. Dal passato prossimo in poi sono i tempi
   che si *studiano*, e chi non li ha ancora visti resta al presente
   invece di restare fuori. */
const TIPI = [
  { chiave: 'verbo:presente-regolare', nome: 'Il presente dei verbi regolari', sa: 'presente', gradi: { 1: 0.75 } },
  { chiave: 'verbo:presente-isc', nome: 'I verbi in -isc (finire, capire)', sa: 'presente', gradi: { 1: 0.25 } },
  { chiave: 'verbo:presente-irregolare', nome: 'Il presente dei verbi irregolari', sa: 'presente', gradi: { 2: 1 } },
  { chiave: 'verbo:ausiliare', nome: 'Essere o avere nel passato prossimo', sa: 'tempi-verbali', gradi: { 3: 0.5, 5: 0.55 } },
  { chiave: 'verbo:participio', nome: 'Il participio passato regolare', sa: 'tempi-verbali', gradi: { 3: 0.25 } },
  { chiave: 'verbo:participio-irregolare', nome: 'I participi irregolari (preso, scritto)', sa: 'tempi-verbali', gradi: { 3: 0.25, 5: 0.45 } },
  { chiave: 'verbo:imperfetto', nome: "L'imperfetto", sa: 'tempi-verbali', gradi: { 4: 0.5 } },
  { chiave: 'verbo:futuro', nome: 'Il futuro', sa: 'tempi-verbali', gradi: { 4: 0.5 } },
]

/* due forme diverse da quella giusta, prese da `lista` (le altre
   persone della stessa tabella): il gesto più comune di questo file. */
function altreDue(lista, giusta, sorte, scarta) {
  const buone = lista.filter(f => f !== giusta && f !== scarta)
  const scelte = sorte.alcuni(buone, 2)
  while (scelte.length < 2) scelte.push(sorte.uno(buone.length ? buone : lista))
  return scelte
}

/* la domanda su una persona coniugata: buco o forma diretta, a
   seconda della sorte — le due domande allenano la stessa cosa ma non
   si somigliano.

   `avverbio` e `nomeTempo` fissano il TEMPO nella consegna: senza,
   «lui ___ (vendere)» si risponde giusto anche al presente («vende»)
   e il bambino sceglie fra i falsi guardando solo che forma hanno,
   non sapendo il verbo. Al presente (gradi 1-2) non servono: è il
   tempo che si dà per scontato quando non si dice altro. */
function domandaPersona({ sorte, pronome, infinito, formaGiusta, falsi, chiave, aiuto, avverbio, nomeTempo }) {
  const buco = sorte.forse(0.55)
  return domanda({
    testo: buco
      ? (avverbio ? `${cap(avverbio)} ${pronome} ___ (${infinito}).` : `${cap(pronome)} ___ (${infinito}).`)
      : (nomeTempo ? `Qual è ${nomeTempo} di «${infinito}» con «${pronome}»?` : `Qual è la forma di «${infinito}» con «${pronome}»?`),
    buona: testo(formaGiusta),
    falsi: falsi.map(f => testo(f, aiuto)),
    chiave,
    aiuto,
    sorte,
  })
}

/* avverbi che fissano imperfetto e futuro nelle frasi col buco —
   invarianti col soggetto (niente «da piccolo/a/i» che vorrebbe
   l'accordo). */
const AVVERBI_IMPERFETTO = ['Una volta', 'Ieri', 'Ogni giorno', 'Tutti i giorni', 'In quegli anni']
const AVVERBI_FUTURO = ['Domani', "L'anno prossimo", 'Fra poco', 'Il prossimo mese']

class Coniugazione extends Modulo {
  constructor() {
    super({
      id: 'coniugazione',
      nome: 'Coniugazione',
      icona: '🗣️',
      materia: 'italiano',
      chiaro: 'coniugare i verbi italiani: presente, passato, imperfetto e futuro',
      scaletta: SCALETTA,
      /* il presente lo usa chi parla; passato prossimo, imperfetto e
         futuro sono i tempi che si studiano, e chi non li ha ancora
         visti resta al presente invece di restare fuori */
      tipi: TIPI,
    })
  }

  /* L'ausiliare si chiede in due modi: al grado 3 con la frase col buco,
     al grado 5 con la frase intera da giudicare. È la stessa cosa da
     sapere e quindi la stessa chiave — cambia quanto costa vederlo, che
     è esattamente cosa vuol dire «grado». */
  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'verbo:presente-isc': return this.presenteRegolare(sorte, true)
      case 'verbo:presente-irregolare': return this.presenteIrregolare(sorte)
      case 'verbo:ausiliare': return grado >= 5 ? this.fraseIntera(sorte) : this.ausiliareFrase(sorte)
      case 'verbo:participio': return this.participioDiretto(sorte, false)
      case 'verbo:participio-irregolare': return this.participioDiretto(sorte, true)
      case 'verbo:imperfetto': return this.imperfetto(sorte)
      case 'verbo:futuro': return this.futuro(sorte)
      default: return this.presenteRegolare(sorte, false)
    }
  }

  /* ── grado 1: presente regolare ── */
  presenteRegolare(sorte, soloIsc) {
    const tipo = soloIsc ? 'ireIsc' : sorte.uno(['are', 'ere', 'ire'])
    const dati = REGOLARI[tipo]
    const infinito = sorte.uno(dati.verbi)
    const idx = sorte.fra(0, 5)
    const forme = formeRegolari(infinito, tipo)
    const formaGiusta = forme[idx]

    let falsi
    if (tipo === 'ireIsc' && [0, 1, 2, 5].includes(idx) && sorte.forse(0.5)) {
      /* l'errore che si sente di più: dimenticare -isc- */
      const radice = infinito.slice(0, infinito.length - 3)
      const senzaIsc = radice + DESINENZE.ire[idx]
      falsi = [senzaIsc, ...altreDue(forme, formaGiusta, sorte, senzaIsc)].slice(0, 2)
    } else {
      falsi = altreDue(forme, formaGiusta, sorte)
    }

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi,
      chiave: tipo === 'ireIsc' ? 'verbo:presente-isc' : 'verbo:presente-regolare',
      aiuto: dati.dritta,
    })
  }

  /* ── grado 2: presente irregolare ── */
  presenteIrregolare(sorte) {
    const v = sorte.uno(IRREGOLARI)
    const idx = sorte.fra(0, 5)
    const formaGiusta = v.forme[idx]
    const reg = regolarizza(v.infinito, idx)

    const candidati = []
    if (reg !== formaGiusta) candidati.push(reg)
    for (const f of altreDue(v.forme, formaGiusta, sorte, reg)) {
      if (candidati.length < 2 && !candidati.includes(f)) candidati.push(f)
    }
    let falsi = candidati.slice(0, 2)

    /* il tocco in più: l'errore che si sente per davvero su «venire» */
    if (v.infinito === 'venire' && idx === 1 && sorte.forse(0.5) && !falsi.includes('venghi')) {
      falsi = ['venghi', falsi[0]]
    }

    const aiuto = `«${v.infinito}» è irregolare al presente: ` +
      PRONOMI.map((p, i) => `${p} ${v.forme[i]}`).join(', ')
    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito: v.infinito, formaGiusta, falsi,
      chiave: 'verbo:presente-irregolare', aiuto,
    })
  }

  /* ── il participio da solo: «qual è il passato di…?» ──
     regolari e irregolari sono due tipologie diverse e il pool si
     divide di conseguenza: «mangiato» si ricava dalla regola, «preso»
     si sa o non si sa. */
  participioDiretto(sorte, irregolari) {
    const pool = PARTICIPI.filter(v => !!v.irregolare === !!irregolari)
    const v = sorte.uno(pool)
    const aiuto = `il passato di «${v.infinito}» è «${v.participio}»`
    return domanda({
      testo: `Qual è il passato di «${v.infinito}»?`,
      soggetto: v.emoji ? { emoji: v.emoji } : undefined,
      buona: testo(v.participio),
      falsi: v.errori.map(e => testo(e, aiuto)),
      chiave: v.irregolare ? 'verbo:participio-irregolare' : 'verbo:participio',
      aiuto,
      sorte,
    })
  }

  /* ── grado 3: la frase col buco, ausiliare + participio insieme ── */
  ausiliareFrase(sorte) {
    const v = sorte.uno(CON_COMPLEMENTO)
    const sog = sorte.uno(SOGGETTI)
    const partForma = accorda(v.participio, v, sog)
    const giusto = v.ausiliare === 'essere' ? 'è' : 'ha'
    const sbagliato = v.ausiliare === 'essere' ? 'ha' : 'è'
    const erroreParticipio = accorda(sorte.uno(v.errori), v, sog)

    const aiuto = `«${v.infinito}» vuole «${v.ausiliare}»: ${v.ausiliare === 'essere' ? 'sono, sei, è…' : 'ho, hai, ha…'}`
    return domanda({
      testo: `Ieri ${sog.nome} ___ (${v.infinito}) ${complementoDi(v, sog)}.`,
      soggetto: v.emoji ? { emoji: v.emoji } : undefined,
      buona: testo(`${giusto} ${partForma}`),
      falsi: [
        testo(`${sbagliato} ${partForma}`, `«${v.infinito}» vuole «${v.ausiliare}», non «${v.ausiliare === 'essere' ? 'avere' : 'essere'}»`),
        testo(`${giusto} ${erroreParticipio}`, aiuto),
      ],
      chiave: 'verbo:ausiliare',
      aiuto,
      sorte,
    })
  }

  /* ── grado 5: la frase intera, dove i due errori si vedono insieme ── */
  fraseIntera(sorte) {
    const v = sorte.uno(CON_COMPLEMENTO)
    const sog = sorte.uno(SOGGETTI)
    const partForma = accorda(v.participio, v, sog)
    const giusto = v.ausiliare === 'essere' ? 'è' : 'ha'
    const sbagliato = v.ausiliare === 'essere' ? 'ha' : 'è'
    const erroreParticipio = accorda(sorte.uno(v.errori), v, sog)

    const compl = complementoDi(v, sog)
    const corretta = `Ieri ${sog.nome} ${giusto} ${partForma} ${compl}.`
    const ausiliareStorto = `Ieri ${sog.nome} ${sbagliato} ${partForma} ${compl}.`
    const participioStorto = `Ieri ${sog.nome} ${giusto} ${erroreParticipio} ${compl}.`

    return domanda({
      testo: 'Quale frase è scritta giusta?',
      buona: testo(corretta),
      falsi: [
        testo(ausiliareStorto, `«${v.infinito}» vuole «${v.ausiliare}», non «${v.ausiliare === 'essere' ? 'avere' : 'essere'}»`),
        testo(participioStorto, `il passato di «${v.infinito}» è «${v.participio}»`),
      ],
      chiave: 'verbo:ausiliare',
      aiuto: `«${v.infinito}» vuole «${v.ausiliare}» e il passato è «${v.participio}»`,
      sorte,
    })
  }

  /* ── grado 4: imperfetto ── */
  imperfetto(sorte) {
    let infinito, forme, aiuto
    if (sorte.forse(0.35)) {
      const v = sorte.uno(IMPERFETTO_IRR)
      infinito = v.infinito
      forme = v.forme
      aiuto = `«${infinito}» è irregolare all'imperfetto: ` + PRONOMI.map((p, i) => `${p} ${forme[i]}`).join(', ')
    } else {
      const tipo = sorte.uno(['are', 'ere', 'ire'])
      const lista = tipo === 'are' ? ARE_SICURI : tipo === 'ere' ? ERE_SICURI : IRE_SICURI
      infinito = sorte.uno(lista)
      const radice = infinito.slice(0, infinito.length - 3)
      forme = IMPERFETTO_END[tipo].map(fin => radice + fin)
      aiuto = `l'imperfetto dei verbi in -${tipo} fa: ${IMPERFETTO_END[tipo].join(', ')}`
    }
    const idx = sorte.fra(0, 5)
    const formaGiusta = forme[idx]

    let falsi = null
    if (formaGiusta.includes('ev') && sorte.forse(0.55)) {
      const scambiato = formaGiusta.replace('ev', 'iv')
      if (scambiato !== formaGiusta) falsi = [scambiato, ...altreDue(forme, formaGiusta, sorte, scambiato)].slice(0, 2)
    }
    if (!falsi) falsi = altreDue(forme, formaGiusta, sorte)

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi, chiave: 'verbo:imperfetto', aiuto,
      avverbio: sorte.uno(AVVERBI_IMPERFETTO), nomeTempo: "l'imperfetto",
    })
  }

  /* ── grado 4: futuro ── */
  futuro(sorte) {
    let infinito, forme, aiuto
    if (sorte.forse(0.35)) {
      const v = sorte.uno(FUTURO_IRR)
      infinito = v.infinito
      forme = v.forme
      aiuto = `«${infinito}» è irregolare al futuro: ` + PRONOMI.map((p, i) => `${p} ${forme[i]}`).join(', ')
    } else {
      const tipo = sorte.uno(['are', 'ere', 'ire'])
      const lista = tipo === 'are' ? ARE_SICURI : tipo === 'ere' ? ERE_SICURI : IRE_SICURI
      infinito = sorte.uno(lista)
      const stem = futuroStem(infinito, tipo)
      forme = FUTURO_END.map(fin => stem + fin)
      aiuto = `il futuro dei verbi in -${tipo} fa: ${FUTURO_END.join(', ')} sul tema «${stem}-»`
    }
    const idx = sorte.fra(0, 5)
    const formaGiusta = forme[idx]

    let falsi = null
    if (infinito.endsWith('are')) {
      /* l'errore più sentito: tenere la vocale dell'infinito
         («parlarò» invece di «parlerò») */
      const radice = infinito.slice(0, infinito.length - 3)
      const erroreVocale = radice + 'ar' + FUTURO_END[idx]
      if (erroreVocale !== formaGiusta) falsi = [erroreVocale, ...altreDue(forme, formaGiusta, sorte, erroreVocale)].slice(0, 2)
    }
    if (!falsi) falsi = altreDue(forme, formaGiusta, sorte)

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi, chiave: 'verbo:futuro', aiuto,
      avverbio: sorte.uno(AVVERBI_FUTURO), nomeTempo: 'il futuro',
    })
  }
}

export default new Coniugazione()
