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

   I TEMPI SI OPPONGONO, NON SOLO LE PERSONE. Per un pezzo ogni
   domanda pescava i falsi dalle *altre persone dello stesso tempo*:
   «Una volta noi ___ (parlare)» usciva con parlavamo / parlavo /
   parlavate, e il bambino sceglieva la persona senza mai dover
   decidere il tempo — l'avverbio davanti era decorativo, perché
   nessuna delle tre opzioni era al presente o al futuro. Ci si
   coniugava benissimo senza avere in testa la differenza fra
   «parliamo», «parlavamo» e «parleremo», che è la cosa che questi
   tempi servono a insegnare. Da qui due tipologie che vivono in cima
   alla scaletta, dove il concetto costa:
     · `coniug:tempo-giusto` — verbo e persona restano fermi, cambia
       solo il tempo, e a sceglierlo è il *quando* della frase
       («Adesso», «Una volta», «Domani»). Gli avverbi devono
       selezionare un tempo solo: «Ogni giorno noi parliamo» è vero
       tanto quanto «ogni giorno noi parlavamo», e una domanda con
       due risposte difendibili passa qualunque controllo di forma;
     · `coniug:riconosci-tempo` — la strada inversa, la forma già
       coniugata e il nome del tempo da dire.

   IL PASSATO REMOTO sta all'ultimo grado insieme ai participi duri,
   perché è il posto dove l'italiano chiede di sapere a memoria e
   basta: «cuocere» fa «io cossi» ma «noi cocemmo», e chi applica la
   regola scrive «cuocei». Le persone irregolari sono la prima, la
   terza e la sesta — le altre tre restano regolari, e distinguere le
   une dalle altre È l'esercizio. I falsi sono i due errori veri: la
   regolarizzazione e l'imperfetto al posto suo («cocevamo» per
   «cocemmo»). Al remoto NON si usa la frase col buco: «Molti anni fa
   noi ___» accetta onestamente anche l'imperfetto, quindi si chiede
   sempre in forma diretta.
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

/* ── il passato remoto ──
   Manca la riga `ere`, e non per dimenticanza: al passato remoto i
   verbi regolari in -ere hanno DUE forme buone («temei» e «temetti»,
   «credé» e «credette»), quindi qualunque falso si scelga rischia di
   essere una risposta onesta. I -ere entrano solo dalla tabella degli
   irregolari, dove la forma vera è una sola. */
const REMOTO_END = {
  are: ['ai', 'asti', 'ò', 'ammo', 'aste', 'arono'],
  ire: ['ii', 'isti', 'ì', 'immo', 'iste', 'irono'],
}
/* le desinenze regolari in -ere servono lo stesso, ma solo a
   COSTRUIRE L'ERRORE: «cuocei» al posto di «cossi» è quello che scrive
   chi la regola la sa e il verbo no. */
const REMOTO_ERE_FINTE = ['ei', 'esti', 'é', 'emmo', 'este', 'erono']

/* Le persone 1ª, 3ª e 6ª del singolare-plurale sono quelle che
   cambiano tema («cossi, cosse, cossero»); la 2ª, la 4ª e la 5ª
   restano regolari sul tema debole («cocesti, cocemmo, coceste»). È
   tutta lì la difficoltà del passato remoto, e per questo si chiedono
   anche quelle: distinguere le une dalle altre È l'esercizio. */
const REMOTO_FORTI = [0, 2, 5]
const REMOTO_IRR = [
  { infinito: 'essere', forme: ['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono'] },
  { infinito: 'avere', forme: ['ebbi', 'avesti', 'ebbe', 'avemmo', 'aveste', 'ebbero'] },
  { infinito: 'fare', forme: ['feci', 'facesti', 'fece', 'facemmo', 'faceste', 'fecero'] },
  { infinito: 'dire', forme: ['dissi', 'dicesti', 'disse', 'dicemmo', 'diceste', 'dissero'] },
  { infinito: 'stare', forme: ['stetti', 'stesti', 'stette', 'stemmo', 'steste', 'stettero'] },
  { infinito: 'dare', forme: ['diedi', 'desti', 'diede', 'demmo', 'deste', 'diedero'] },
  { infinito: 'venire', forme: ['venni', 'venisti', 'venne', 'venimmo', 'veniste', 'vennero'] },
  { infinito: 'tenere', forme: ['tenni', 'tenesti', 'tenne', 'tenemmo', 'teneste', 'tennero'] },
  { infinito: 'volere', forme: ['volli', 'volesti', 'volle', 'volemmo', 'voleste', 'vollero'] },
  { infinito: 'sapere', forme: ['seppi', 'sapesti', 'seppe', 'sapemmo', 'sapeste', 'seppero'] },
  { infinito: 'vedere', forme: ['vidi', 'vedesti', 'vide', 'vedemmo', 'vedeste', 'videro'] },
  { infinito: 'cuocere', forme: ['cossi', 'cocesti', 'cosse', 'cocemmo', 'coceste', 'cossero'] },
  { infinito: 'chiedere', forme: ['chiesi', 'chiedesti', 'chiese', 'chiedemmo', 'chiedeste', 'chiesero'] },
  { infinito: 'rispondere', forme: ['risposi', 'rispondesti', 'rispose', 'rispondemmo', 'rispondeste', 'risposero'] },
  { infinito: 'scrivere', forme: ['scrissi', 'scrivesti', 'scrisse', 'scrivemmo', 'scriveste', 'scrissero'] },
  { infinito: 'leggere', forme: ['lessi', 'leggesti', 'lesse', 'leggemmo', 'leggeste', 'lessero'] },
  { infinito: 'prendere', forme: ['presi', 'prendesti', 'prese', 'prendemmo', 'prendeste', 'presero'] },
  { infinito: 'mettere', forme: ['misi', 'mettesti', 'mise', 'mettemmo', 'metteste', 'misero'] },
  { infinito: 'chiudere', forme: ['chiusi', 'chiudesti', 'chiuse', 'chiudemmo', 'chiudeste', 'chiusero'] },
  { infinito: 'perdere', forme: ['persi', 'perdesti', 'perse', 'perdemmo', 'perdeste', 'persero'] },
  { infinito: 'decidere', forme: ['decisi', 'decidesti', 'decise', 'decidemmo', 'decideste', 'decisero'] },
  { infinito: 'vincere', forme: ['vinsi', 'vincesti', 'vinse', 'vincemmo', 'vinceste', 'vinsero'] },
  { infinito: 'correre', forme: ['corsi', 'corresti', 'corse', 'corremmo', 'correste', 'corsero'] },
  { infinito: 'rompere', forme: ['ruppi', 'rompesti', 'ruppe', 'rompemmo', 'rompeste', 'ruppero'] },
  { infinito: 'nascere', forme: ['nacqui', 'nascesti', 'nacque', 'nascemmo', 'nasceste', 'nacquero'] },
  { infinito: 'vivere', forme: ['vissi', 'vivesti', 'visse', 'vivemmo', 'viveste', 'vissero'] },
  { infinito: 'bere', forme: ['bevvi', 'bevesti', 'bevve', 'bevemmo', 'beveste', 'bevvero'] },
  { infinito: 'scegliere', forme: ['scelsi', 'scegliesti', 'scelse', 'scegliemmo', 'sceglieste', 'scelsero'] },
  { infinito: 'conoscere', forme: ['conobbi', 'conoscesti', 'conobbe', 'conoscemmo', 'conosceste', 'conobbero'] },
  { infinito: 'rimanere', forme: ['rimasi', 'rimanesti', 'rimase', 'rimanemmo', 'rimaneste', 'rimasero'] },
]

/* ── condizionale e congiuntivo ──
   Il condizionale presente sta sullo stesso tema del futuro (parlerò →
   parlerei), e questa è la ragione per cui l'errore giusto da mettergli
   accanto è proprio il futuro: chi non li distingue scrive «domani
   mangerei». Gli irregolari sono gli stessi del futuro, desinenze a
   parte, quindi la tabella non si riscrive: si riusa `FUTURO_IRR`
   togliendo la coda. */
const CONDIZIONALE_END = ['ei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero']
/* dal futuro al suo tema, che è lo stesso: «sarò» → «sar-». La prima
   persona del futuro finisce sempre in una vocale sola, quindi il tema
   è tutto quello che le sta davanti. */
const temaDalFuturo = forme => forme[0].slice(0, -1)

/* Il congiuntivo presente ha una faccia sola per io/tu/lui («che io
   mangi, che tu mangi, che lui mangi»), ed è la cosa che lo rende
   difficile da chiedere: tre persone su sei danno la stessa risposta.
   Perciò le domande sul congiuntivo presente si fanno solo su noi/voi/
   loro, dove la forma è unica — le altre tre si vedono nell'aiuto. */
const CONG_PRES_END = {
  are: ['i', 'i', 'i', 'iamo', 'iate', 'ino'],
  ere: ['a', 'a', 'a', 'iamo', 'iate', 'ano'],
  ire: ['a', 'a', 'a', 'iamo', 'iate', 'ano'],
  ireIsc: ['isca', 'isca', 'isca', 'iamo', 'iate', 'iscano'],
}
const CONG_IMPF_END = {
  are: ['assi', 'assi', 'asse', 'assimo', 'aste', 'assero'],
  ere: ['essi', 'essi', 'esse', 'essimo', 'este', 'essero'],
  ire: ['issi', 'issi', 'isse', 'issimo', 'iste', 'issero'],
}
const CONG_PRES_IRR = [
  { infinito: 'essere', forme: ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'] },
  { infinito: 'avere', forme: ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'] },
  { infinito: 'andare', forme: ['vada', 'vada', 'vada', 'andiamo', 'andiate', 'vadano'] },
  { infinito: 'fare', forme: ['faccia', 'faccia', 'faccia', 'facciamo', 'facciate', 'facciano'] },
  { infinito: 'dare', forme: ['dia', 'dia', 'dia', 'diamo', 'diate', 'diano'] },
  { infinito: 'stare', forme: ['stia', 'stia', 'stia', 'stiamo', 'stiate', 'stiano'] },
  { infinito: 'venire', forme: ['venga', 'venga', 'venga', 'veniamo', 'veniate', 'vengano'] },
  { infinito: 'dire', forme: ['dica', 'dica', 'dica', 'diciamo', 'diciate', 'dicano'] },
  { infinito: 'uscire', forme: ['esca', 'esca', 'esca', 'usciamo', 'usciate', 'escano'] },
  { infinito: 'potere', forme: ['possa', 'possa', 'possa', 'possiamo', 'possiate', 'possano'] },
  { infinito: 'volere', forme: ['voglia', 'voglia', 'voglia', 'vogliamo', 'vogliate', 'vogliano'] },
  { infinito: 'sapere', forme: ['sappia', 'sappia', 'sappia', 'sappiamo', 'sappiate', 'sappiano'] },
]
const CONG_IMPF_IRR = [
  { infinito: 'essere', forme: ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'] },
  { infinito: 'fare', forme: ['facessi', 'facessi', 'facesse', 'facessimo', 'faceste', 'facessero'] },
  { infinito: 'dire', forme: ['dicessi', 'dicessi', 'dicesse', 'dicessimo', 'diceste', 'dicessero'] },
  { infinito: 'bere', forme: ['bevessi', 'bevessi', 'bevesse', 'bevessimo', 'beveste', 'bevessero'] },
  { infinito: 'dare', forme: ['dessi', 'dessi', 'desse', 'dessimo', 'deste', 'dessero'] },
  { infinito: 'stare', forme: ['stessi', 'stessi', 'stesse', 'stessimo', 'steste', 'stessero'] },
]

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

/* ── un verbo, un tempo, sei forme ──
   L'unico posto che sa dire come si coniuga qualcosa: prima guarda se
   quel verbo ha una tabella sua a quel tempo, se no applica la regola.
   Serve alle domande che oppongono i TEMPI fra loro, dove lo stesso
   verbo va coniugato in tre modi diversi nella stessa domanda —
   `imperfetto()` e `futuro()` continuano invece a fare da sé, perché
   hanno bisogno di sapere se la forma è uscita dalla regola o dalla
   tabella per scrivere l'aiuto giusto.
   Torna `null` quando quel verbo a quel tempo non lo sappiamo fare in
   modo sicuro: chi chiama filtra, invece di rischiare una forma
   inventata. */
const ISC = new Set(REGOLARI.ireIsc.verbi)
const tabellaDi = (lista, infinito) => (lista.find(v => v.infinito === infinito) || {}).forme || null
const radiceDi = infinito => infinito.slice(0, infinito.length - 3)

function formeDi(infinito, tempo) {
  const fin = infinito.slice(-3)
  const radice = radiceDi(infinito)
  const famiglia = ISC.has(infinito) ? 'ireIsc' : fin
  switch (tempo) {
    case 'presente':
      return tabellaDi(IRREGOLARI, infinito) || formeRegolari(infinito, famiglia)
    case 'imperfetto':
      return tabellaDi(IMPERFETTO_IRR, infinito) || IMPERFETTO_END[fin].map(f => radice + f)
    case 'futuro':
      return tabellaDi(FUTURO_IRR, infinito) || FUTURO_END.map(f => futuroStem(infinito, fin) + f)
    case 'remoto':
      return tabellaDi(REMOTO_IRR, infinito) ||
        (REMOTO_END[fin] ? REMOTO_END[fin].map(f => radice + f) : null)
    case 'condizionale': {
      const fut = tabellaDi(FUTURO_IRR, infinito)
      const tema = fut ? temaDalFuturo(fut) : futuroStem(infinito, fin)
      return CONDIZIONALE_END.map(f => tema + f)
    }
    case 'congiuntivo':
      return tabellaDi(CONG_PRES_IRR, infinito) || CONG_PRES_END[famiglia].map(f => radice + f)
    case 'congiuntivo-imperfetto':
      return tabellaDi(CONG_IMPF_IRR, infinito) || CONG_IMPF_END[fin].map(f => radice + f)
    default:
      return null
  }
}

/* i verbi di cui sappiamo dire presente, imperfetto e futuro senza
   sbagliare: le tre liste «sicure» più gli irregolari che hanno una
   tabella per ogni tempo che serve. «dovere» resta fuori di proposito —
   il futuro ce l'ha in tabella, ma il presente («devo») no, e la regola
   direbbe «dovo». */
const IRR_COMPLETI = ['essere', 'avere', 'andare', 'fare', 'dire', 'venire', 'stare',
  'potere', 'volere', 'sapere', 'vedere', 'uscire']
const VERBI_TEMPI = [...ARE_SICURI, ...ERE_SICURI, ...IRE_SICURI, ...IRR_COMPLETI]

/* «avere» coniugato serve tutte le volte che si compone un tempo:
   passato prossimo («ho mangiato») e trapassato («avevo mangiato»). */
const AVERE_PRESENTE = formeDi('avere', 'presente')
const AVERE_IMPERFETTO = formeDi('avere', 'imperfetto')

/* al passato remoto i regolari sono -are e -ire: i -ere hanno due
   forme buone e stanno solo nella tabella degli irregolari */
const REMOTO_REGOLARI = [...REGOLARI.are.verbi, ...REGOLARI.ire.verbi, ...REGOLARI.ireIsc.verbi]

/* il passato remoto come lo scriverebbe chi applica la regola a un
   verbo che non la segue: «cuocei» per «cossi». Torna `null` per i
   verbi dalla radice troppo corta («bere» → «b-»), dove l'errore
   costruito non somiglia a niente che un bambino scriverebbe. */
function remotoRegolarizzato(infinito, idx) {
  const fin = infinito.slice(-3)
  const radice = radiceDi(infinito)
  if (radice.length < 3) return null
  const fine = fin === 'ere' ? REMOTO_ERE_FINTE[idx] : (REMOTO_END[fin] || [])[idx]
  return fine ? radice + fine : null
}

/* ── i falsi, in ordine di preferenza ──
   Un candidato è `[forma, perché]`: entra il primo che vale, si smette
   a due. Si scarta da sé quello nullo, quello uguale alla risposta
   giusta e quello già preso — e non è un caso di scuola: questi errori
   si *costruiscono*, e un errore costruito ogni tanto è la forma vera
   («noi cocemmo» è regolare per davvero). Chi scriveva questi controlli
   a mano, domanda per domanda, prima o poi ne dimenticava uno. */
function raccogli(formaGiusta, candidati) {
  const presi = []
  for (const c of candidati) {
    if (!c || !c[0] || c[0] === formaGiusta) continue
    if (presi.some(p => p[0] === c[0])) continue
    presi.push(c)
    if (presi.length === 2) break
  }
  return presi.map(([forma, perche]) => testo(forma, perche))
}

/* Come si chiama un tempo quando lo si nomina in una consegna, e come
   si chiama quando è una risposta da toccare (lì l'articolo davanti
   sarebbe rumore). */
const NOME_TEMPO = {
  presente: 'il presente',
  imperfetto: "l'imperfetto",
  futuro: 'il futuro',
  prossimo: 'il passato prossimo',
  trapassato: 'il trapassato prossimo',
  remoto: 'il passato remoto',
  condizionale: 'il condizionale',
  congiuntivo: 'il congiuntivo',
  'congiuntivo-imperfetto': 'il congiuntivo imperfetto',
}
const ETICHETTA = {
  presente: 'presente',
  imperfetto: 'imperfetto',
  futuro: 'futuro',
  prossimo: 'passato prossimo',
  trapassato: 'trapassato prossimo',
  remoto: 'passato remoto',
}
/* a cosa serve quel tempo, detto a un bambino: è l'aiuto che compare
   quando sbaglia, e deve dire *perché* era quello e non un altro */
const SPIEGA = {
  presente: 'quello che si fa adesso',
  imperfetto: 'quello che si faceva una volta, e durava',
  futuro: 'quello che si farà',
  prossimo: 'quello che si è fatto da poco',
  trapassato: "quello che si era già fatto prima d'allora",
  remoto: 'quello che si fece tanto tempo fa',
}

/* ── il *quando* della frase, che è quello che sceglie il tempo ──
   Un avverbio qui dentro deve lasciare in piedi UN tempo solo. «Ieri» e
   «Ogni giorno» sono fuori per questo: «ogni giorno noi parliamo» è
   vero quanto «ogni giorno noi parlavamo», e una domanda con due
   risposte difendibili passa qualunque controllo di forma senza che
   nessuno se ne accorga. Sono invariabili anche al soggetto — niente
   «da piccolo/a/i», che vorrebbe l'accordo. */
const QUANDO = {
  presente: ['Adesso', 'In questo momento', 'Proprio ora'],
  imperfetto: ['Una volta', 'In quegli anni', 'Tanti anni fa', "Quell'estate"],
  futuro: ['Domani', "L'anno prossimo", 'Fra poco', 'Il prossimo mese'],
}

const SCALETTA = [
  'il presente dei verbi regolari (-are, -ere, -ire)',
  'il presente dei verbi irregolari di ogni giorno',
  'il passato prossimo: ausiliare e participio',
  'imperfetto e futuro',
  'riconoscere il tempo e scegliere quello che la frase chiede',
  'i participi duri, il passato remoto e i modi che si fanno dopo',
]

/* Le tipologie. Il presente è un gruppo suo: si coniuga parlando, e un
   bambino che dice «noi andiamo» lo sa fare prima di sapere che si
   chiama presente indicativo. Dal passato prossimo in poi sono i tempi
   che si *studiano*, e chi non li ha ancora visti resta al presente
   invece di restare fuori.

   IL PREFISSO È `coniug:` E NON `verbo:`, che sarebbe il nome ovvio.
   `verbo:` è già preso: sono i verbi inglesi in `store/srs.js`
   (`progressi.js`, materia «Verbi inglesi», e il conto che si legge in
   home). Finché queste chiavi restavano fra le domande non faceva
   danno; da quando il ripasso le scrive nel profilo (`quiz/memoria.js`)
   la coniugazione italiana andrebbe a gonfiare la padronanza
   d'inglese — e i traguardi con lei. Un prefisso è uno spazio di nomi
   condiviso da tutto il repo: si sceglie guardando gli altri. */
const TIPI = [
  { chiave: 'coniug:presente-regolare', nome: 'Il presente dei verbi regolari', sa: 'presente', gradi: { 1: 0.75 } },
  { chiave: 'coniug:presente-isc', nome: 'I verbi in -isc (finire, capire)', sa: 'presente', gradi: { 1: 0.25 } },
  { chiave: 'coniug:presente-irregolare', nome: 'Il presente dei verbi irregolari', sa: 'presente', gradi: { 2: 1 } },
  { chiave: 'coniug:ausiliare', nome: 'Essere o avere nel passato prossimo', sa: 'tempi-verbali', gradi: { 3: 0.5, 5: 0.2, 6: 0.1 } },
  { chiave: 'coniug:participio', nome: 'Il participio passato regolare', sa: 'tempi-verbali', gradi: { 3: 0.25 } },
  { chiave: 'coniug:participio-irregolare', nome: 'I participi irregolari (preso, scritto)', sa: 'tempi-verbali', gradi: { 3: 0.25, 6: 0.25 } },
  { chiave: 'coniug:imperfetto', nome: "L'imperfetto", sa: 'tempi-verbali', gradi: { 4: 0.5 } },
  { chiave: 'coniug:futuro', nome: 'Il futuro', sa: 'tempi-verbali', gradi: { 4: 0.5 } },
  /* le due che oppongono i tempi invece delle persone: stanno in alto
     perché scegliere fra «parliamo», «parlavamo» e «parleremo» è un
     gradino sopra lo scegliere fra «parlavamo» e «parlavate» — che
     resta dov'era, ai gradi 1-4, e resta importante */
  { chiave: 'coniug:tempo-giusto', nome: 'Scegliere il tempo che la frase chiede', sa: 'tempi-verbali', gradi: { 5: 0.5, 6: 0.1 } },
  { chiave: 'coniug:riconosci-tempo', nome: 'Riconoscere il tempo di un verbo', sa: 'tempi-verbali', gradi: { 5: 0.3, 6: 0.05 } },
  /* i tempi che a scuola arrivano dopo: ognuno col suo interruttore,
     e tutti e quattro spenti finché un genitore non dice di sì
     (`difetto: false` in `data/saperi.js`) */
  { chiave: 'coniug:passato-remoto', nome: 'Il passato remoto (andò, cossi, mangiammo)', sa: 'passato-remoto', gradi: { 6: 0.2 } },
  { chiave: 'coniug:trapassato', nome: 'Il trapassato prossimo (avevo mangiato)', sa: 'trapassato', gradi: { 6: 0.1 } },
  { chiave: 'coniug:condizionale', nome: 'Il condizionale (vorrei, mangerei)', sa: 'condizionale', gradi: { 6: 0.1 } },
  { chiave: 'coniug:congiuntivo', nome: 'Il congiuntivo (che io sia, se io fossi)', sa: 'congiuntivo', gradi: { 6: 0.1 } },
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
function domandaPersona({ sorte, pronome, infinito, formaGiusta, falsi, chiave, aiuto,
  avverbio, nomeTempo, soloDiretta }) {
  const buco = !soloDiretta && sorte.forse(0.55)
  return domanda({
    testo: buco
      ? (avverbio ? `${cap(avverbio)} ${pronome} ___ (${infinito}).` : `${cap(pronome)} ___ (${infinito}).`)
      : (nomeTempo ? `Qual è ${nomeTempo} di «${infinito}» con «${pronome}»?` : `Qual è la forma di «${infinito}» con «${pronome}»?`),
    buona: testo(formaGiusta),
    /* un falso può arrivare già confezionato (`testo(forma, perché)`)
       quando ha una spiegazione sua: alle domande che oppongono i tempi
       serve dire *che tempo era* quello sbagliato, non ripetere l'aiuto
       generale */
    falsi: falsi.map(f => (typeof f === 'string' ? testo(f, aiuto) : f)),
    chiave,
    aiuto,
    sorte,
  })
}

/* avverbi che fissano imperfetto e futuro nelle frasi col buco —
   invarianti col soggetto (niente «da piccolo/a/i» che vorrebbe
   l'accordo). */
/* gli avverbi stanno in `QUANDO`, uno solo per tutte le domande che ne
   hanno bisogno: erano due elenchi, e in quello dell'imperfetto
   c'erano «Ieri», «Ogni giorno» e «Tutti i giorni» — che l'imperfetto
   lo *permettono* ma non lo *impongono* («ogni giorno noi parliamo» è
   una frase giusta). Finché i falsi erano altre persone dello stesso
   tempo nessuno se ne accorgeva; adesso che si oppongono i tempi
   sarebbero domande con due risposte buone. */

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
      case 'coniug:presente-isc': return this.presenteRegolare(sorte, true)
      case 'coniug:presente-irregolare': return this.presenteIrregolare(sorte)
      case 'coniug:ausiliare': return grado >= 5 ? this.fraseIntera(sorte) : this.ausiliareFrase(sorte)
      case 'coniug:participio': return this.participioDiretto(sorte, false)
      case 'coniug:participio-irregolare': return this.participioDiretto(sorte, true)
      case 'coniug:imperfetto': return this.imperfetto(sorte)
      case 'coniug:futuro': return this.futuro(sorte)
      case 'coniug:tempo-giusto': return this.tempoGiusto(sorte)
      case 'coniug:riconosci-tempo': return this.riconosciTempo(sorte)
      case 'coniug:passato-remoto': return this.passatoRemoto(sorte)
      case 'coniug:trapassato': return this.trapassato(sorte)
      case 'coniug:condizionale': return this.condizionale(sorte)
      case 'coniug:congiuntivo': return this.congiuntivo(sorte, grado)
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
      chiave: tipo === 'ireIsc' ? 'coniug:presente-isc' : 'coniug:presente-regolare',
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
      chiave: 'coniug:presente-irregolare', aiuto,
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
      chiave: v.irregolare ? 'coniug:participio-irregolare' : 'coniug:participio',
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
      chiave: 'coniug:ausiliare',
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
      chiave: 'coniug:ausiliare',
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
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi, chiave: 'coniug:imperfetto', aiuto,
      avverbio: sorte.uno(QUANDO.imperfetto), nomeTempo: "l'imperfetto",
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
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi, chiave: 'coniug:futuro', aiuto,
      avverbio: sorte.uno(QUANDO.futuro), nomeTempo: 'il futuro',
    })
  }

  /* ── grado 5: il tempo che la frase chiede ──
     Verbo e persona restano fermi, cambia solo il tempo: è la domanda
     che i gradi 1-4 non fanno mai, perché lì i falsi sono le altre
     persone. A deciderlo è il *quando* davanti («Adesso», «Una volta»,
     «Domani»), o il nome del tempo se esce la forma diretta. */
  tempoGiusto(sorte) {
    const TERNA = ['presente', 'imperfetto', 'futuro']
    const infinito = sorte.uno(VERBI_TEMPI)
    const idx = sorte.fra(0, 5)
    const pron = PRONOMI[idx]
    const forma = {}
    for (const t of TERNA) forma[t] = formeDi(infinito, t)[idx]

    const quale = sorte.uno(TERNA)
    const formaGiusta = forma[quale]
    const aiuto = `con «${pron}»: adesso ${forma.presente}, una volta ${forma.imperfetto}, domani ${forma.futuro}`

    const falsi = raccogli(formaGiusta, [
      ...TERNA.filter(t => t !== quale)
        .map(t => [forma[t], `«${forma[t]}» è ${NOME_TEMPO[t]}: ${SPIEGA[t]}`]),
      /* tappo: due tempi diversi non danno mai la stessa forma sulla
         stessa persona, ma se succedesse resterebbe una domanda con due
         risposte sole */
      ...altreDue(formeDi(infinito, quale), formaGiusta, sorte).map(f => [f, aiuto]),
    ])

    return domandaPersona({
      sorte, pronome: pron, infinito, formaGiusta, falsi,
      chiave: 'coniug:tempo-giusto', aiuto,
      avverbio: sorte.uno(QUANDO[quale]), nomeTempo: NOME_TEMPO[quale],
    })
  }

  /* ── grado 5: e come si chiama, questo tempo? ──
     La strada inversa: la forma è già coniugata, il nome è la risposta.
     Sono due domande diverse per lo stesso concetto — si può saper
     coniugare senza saper nominare, e viceversa — e la seconda è quella
     che serve quando a scuola la maestra dice «mettilo all'imperfetto».
     Il passato prossimo entra solo con l'ausiliare «avere», così non si
     porta dietro l'accordo del participio, che è un'altra lezione. */
  riconosciTempo(sorte) {
    const scelte = ['presente', 'imperfetto', 'futuro', 'prossimo']
    const quale = sorte.uno(scelte)
    const idx = sorte.fra(0, 5)
    let forma
    if (quale === 'prossimo') {
      const v = sorte.uno(PARTICIPI.filter(p => p.ausiliare === 'avere'))
      forma = `${AVERE_PRESENTE[idx]} ${v.participio}`
    } else {
      forma = formeDi(sorte.uno(VERBI_TEMPI), quale)[idx]
    }
    const dettoBene = `${PRONOMI[idx]} ${forma}`
    const aiuto = `«${dettoBene}» è ${NOME_TEMPO[quale]}: ${SPIEGA[quale]}`

    return domanda({
      testo: `Che tempo è «${dettoBene}»?`,
      buona: testo(ETICHETTA[quale]),
      falsi: sorte.alcuni(scelte.filter(t => t !== quale), 2).map(t => testo(ETICHETTA[t], aiuto)),
      chiave: 'coniug:riconosci-tempo',
      aiuto,
      sorte,
    })
  }

  /* ── grado 6: il passato remoto ──
     Sempre in forma diretta: «Molti anni fa noi ___ (cuocere)» accetta
     onestamente anche l'imperfetto, e una domanda con due risposte
     buone non si vede da nessun controllo. I due falsi sono i due
     errori veri — la regola applicata a un verbo che non la segue
     («cuocei») e l'imperfetto al posto suo («cocevamo») — più le altre
     persone quando quelli non si possono costruire. */
  passatoRemoto(sorte) {
    const irregolare = sorte.forse(0.7)
    const infinito = irregolare ? sorte.uno(REMOTO_IRR).infinito : sorte.uno(REMOTO_REGOLARI)
    const forme = formeDi(infinito, 'remoto')
    /* le persone forti sono quelle che insegnano qualcosa, ma le altre
       si chiedono lo stesso: sapere che «noi cocemmo» resta regolare è
       metà dell'esercizio */
    const idx = irregolare && sorte.forse(0.6) ? sorte.uno(REMOTO_FORTI) : sorte.fra(0, 5)
    const formaGiusta = forme[idx]

    const aiuto = `il passato remoto di «${infinito}» fa: ` +
      PRONOMI.map((p, i) => `${p} ${forme[i]}`).join(', ')
    const regolare = remotoRegolarizzato(infinito, idx)
    const imperfetto = formeDi(infinito, 'imperfetto')[idx]
    const falsi = raccogli(formaGiusta, [
      forme.includes(regolare) ? null
        : [regolare, `«${infinito}» al passato remoto non segue la regola: fa «${formaGiusta}»`],
      [imperfetto, `«${imperfetto}» è l'imperfetto: quello che si faceva, non quello che si fece`],
      ...altreDue(forme, formaGiusta, sorte).map(f => [f, aiuto]),
    ])

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi,
      chiave: 'coniug:passato-remoto', aiuto,
      nomeTempo: 'il passato remoto', soloDiretta: true,
    })
  }

  /* ── grado 6: il trapassato prossimo ──
     Un passato che sta prima di un altro passato, e si costruisce con
     l'ausiliare all'imperfetto: «avevo mangiato». Solo verbi con
     «avere», per la stessa ragione di `riconosciTempo`. Il falso che
     conta è il passato prossimo — la differenza fra «ho mangiato» e
     «avevo mangiato» è tutta lì. */
  trapassato(sorte) {
    const v = sorte.uno(PARTICIPI.filter(p => p.ausiliare === 'avere'))
    const idx = sorte.fra(0, 5)
    const altra = sorte.uno([0, 1, 2, 3, 4, 5].filter(i => i !== idx))
    const formaGiusta = `${AVERE_IMPERFETTO[idx]} ${v.participio}`

    const aiuto = `il trapassato prossimo si fa con «avere» all'imperfetto: ${AVERE_IMPERFETTO[idx]} ${v.participio}`
    const falsi = raccogli(formaGiusta, [
      [`${AVERE_PRESENTE[idx]} ${v.participio}`,
        `«${AVERE_PRESENTE[idx]} ${v.participio}» è il passato prossimo: quello che si è fatto da poco`],
      [`${AVERE_IMPERFETTO[altra]} ${v.participio}`, `con «${PRONOMI[idx]}» ci vuole «${AVERE_IMPERFETTO[idx]}»`],
    ])

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito: v.infinito, formaGiusta, falsi,
      chiave: 'coniug:trapassato', aiuto,
      nomeTempo: 'il trapassato prossimo', soloDiretta: true,
    })
  }

  /* ── grado 6: il condizionale ──
     Sta sullo stesso tema del futuro (parlerò → parlerei), ed è per
     questo che il falso giusto da mettergli accanto è proprio il
     futuro: chi non li distingue scrive «domani mangerei». In forma
     diretta, perché ogni inciso che regge il condizionale («con più
     tempo…») regge onestamente anche il futuro. */
  condizionale(sorte) {
    const infinito = sorte.uno(VERBI_TEMPI)
    const idx = sorte.fra(0, 5)
    const forme = formeDi(infinito, 'condizionale')
    const formaGiusta = forme[idx]
    const futuro = formeDi(infinito, 'futuro')[idx]

    const aiuto = `il condizionale di «${infinito}» fa: ` +
      PRONOMI.map((p, i) => `${p} ${forme[i]}`).join(', ')
    const falsi = raccogli(formaGiusta, [
      [futuro, `«${futuro}» è il futuro: quello che si farà, non quello che si farebbe`],
      ...altreDue(forme, formaGiusta, sorte).map(f => [f, aiuto]),
    ])

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi,
      chiave: 'coniug:condizionale', aiuto,
      nomeTempo: 'il condizionale', soloDiretta: true,
    })
  }

  /* ── grado 6: il congiuntivo ──
     Qui la frase col buco torna, ed è l'unico modo onesto di chiederlo:
     «Penso che» e «Vorrei che» reggono il congiuntivo e nient'altro,
     mentre il nome del modo da solo non dice a un bambino quando
     serve. Il falso è l'errore che fanno anche i grandi — l'indicativo
     al suo posto, «penso che voi siete».

     Le persone si scelgono, e non per varietà. Al presente io/tu/lui
     danno tutte e tre la stessa forma («che io mangi, che tu mangi») e
     con «noi» il congiuntivo è identico all'indicativo («mangiamo»):
     restano voi e loro, le uniche due dove la risposta è una sola e
     l'errore vero — l'indicativo — è distinguibile. All'imperfetto si
     sovrappongono solo io e tu («fossi»), e le altre quattro valgono. */
  congiuntivo(sorte) {
    const passato = sorte.forse(0.45)
    const tempo = passato ? 'congiuntivo-imperfetto' : 'congiuntivo'
    const infinito = sorte.uno(VERBI_TEMPI)
    const forme = formeDi(infinito, tempo)
    const idx = sorte.uno(passato ? [2, 3, 4, 5] : [4, 5])
    const formaGiusta = forme[idx]
    const indicativo = formeDi(infinito, passato ? 'imperfetto' : 'presente')[idx]
    const regge = passato ? 'vorrei che' : 'penso che'

    const aiuto = `dopo «${regge}» ci vuole il congiuntivo: ` +
      PRONOMI.map((p, i) => `che ${p} ${forme[i]}`).slice(passato ? 2 : 4).join(', ')
    const falsi = raccogli(formaGiusta, [
      [indicativo, `«${indicativo}» è l'indicativo: dopo «${regge}» ci vuole «${formaGiusta}»`],
      ...altreDue([...new Set(forme)], formaGiusta, sorte).map(f => [f, aiuto]),
    ])

    return domandaPersona({
      sorte, pronome: PRONOMI[idx], infinito, formaGiusta, falsi,
      chiave: 'coniug:congiuntivo', aiuto,
      avverbio: passato ? 'Vorrei che' : 'Penso che',
      nomeTempo: passato ? 'il congiuntivo imperfetto' : 'il congiuntivo',
    })
  }
}

export default new Coniugazione()
