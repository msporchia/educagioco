/* ═══════════════════════════════════════════════════════════════════
   CONNETTIVI — le paroline che legano due frasi e dicono che rapporto
   c'è fra loro: perché, quindi, ma, quando, se, anche se…

   Non sono lessico da ricordare: sono LOGICA da leggere. La stessa
   coppia di fatti — «pioveva» e «ho preso l'ombrello» — sta in piedi
   con «perché» e con «quindi», e cade con «ma» (non c'è nessun
   contrasto) o con «quindi» messo dalla parte sbagliata (l'effetto non
   può causare la causa). I FALSI SONO GLI ERRORI VERI: la direzione
   girata di causa ed effetto, il contrasto inventato dove le due cose
   vanno d'accordo, l'ipotesi («se») su un fatto già successo.

   LE COPPIE SONO GENERATE da un elenco di situazioni quotidiane, con
   la relazione già dichiarata nel dato (`CAUSALI`, `CONTRASTI`,
   `CONDIZIONI`, `QUANDO`, `MENTRE`): la risposta giusta si ricava dalla
   relazione, non da una frase scritta a mano parola per parola.

   PERCHÉ LA CAUSA REGGE SEMPRE «QUINDI»/«QUANDO»/«SE» COME FALSI, E
   MAI «MA». In `CAUSALI` la causa è un tratto abituale (presente:
   «ha molta paura dei temporali») e l'effetto un fatto specifico e
   datato (passato con «ieri», «stamattina»…): con questo scarto di
   tempo «quando» e «se» stonano sempre (non è un'ipotesi, è già
   successo; non è un istante, è un modo di essere) e «quindi» capovolge
   la direzione. «Ma» invece resta per il contrasto (`CONTRASTI`), dove
   NON deve mai comparire insieme a «però»/«invece» fra le risposte di
   una stessa domanda: sono sinonimi, e messi insieme la domanda avrebbe
   due risposte giuste — sono i tre nomi della stessa relazione, mai
   tre risposte alternative.

   «PRIMA CHE» NON C'È. Vorrebbe il congiuntivo, che in questa casa
   nasce spento di default (`congiuntivo` in `data/saperi.js`,
   `difetto: false`): un connettivo che funziona solo con un modo
   verbale che la maggioranza dei bambini non ha ancora incontrato non
   insegnerebbe i connettivi, insegnerebbe il congiuntivo. «Prima di» e
   «dopo aver» restano fuori per lo stesso motivo dall'altro lato: senza
   verbi coniugati per ogni situazione la frase richiederebbe un
   infinito o un participio combinato a mano per ogni voce, ed è un
   lavoro diverso da quello che questo file fa (coppie di fatti intere,
   non pezzi di frase da incollare).

   IL SAPERE È «LESSICO», RIUSATO. Capire cosa dice una parolina è la
   stessa famiglia di capire cosa dice un modo di dire — non c'è una
   lezione di grammatica da aver fatto, c'è da sapere cosa vuol dire
   quella parola lì — e `lessico.js` dichiara già lo stesso `sa` per
   tutte le sue tipologie: chi lo spegne toglie il modulo intero, ed è
   la stessa scelta qui.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1)
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)

/* ── CAUSALI: causa (un tratto abituale, al presente) → effetto (un
   fatto specifico e datato, al passato). Lo scarto di tempo è quello
   che rende sempre falsi «quando» e «se»: vedi il cappello del file. */
const CAUSALI = [
  { causa: 'ha molta paura dei temporali', effetto: 'Ieri sera si è nascosto sotto il letto', emoji: '⛈️' },
  { causa: 'è allergico ai gatti', effetto: 'Stamattina ha starnutito dieci volte', emoji: '🐱' },
  { causa: 'non sa ancora nuotare', effetto: 'Oggi è rimasto seduto sul bagnasciuga', emoji: '🏖️' },
  { causa: 'ha sempre una fame tremenda dopo la scuola', effetto: 'Oggi ha mangiato due merende', emoji: '🍞' },
  { causa: 'si stanca subito in salita', effetto: 'Ieri si è seduto a metà del sentiero', emoji: '⛰️' },
  { causa: 'non sopporta i rumori forti', effetto: "Stamattina si è tappato le orecchie ai fuochi d'artificio", emoji: '🎆' },
  { causa: 'ama disegnare gli animali', effetto: 'Oggi ha riempito tre pagine di elefanti', emoji: '🐘' },
  { causa: "dimentica sempre l'ombrello", effetto: 'Ieri è arrivato a casa fradicio', emoji: '☔' },
  { causa: 'ha il sonno leggerissimo', effetto: 'Stanotte si è svegliato al minimo rumore', emoji: '😴' },
  { causa: 'è molto goloso di cioccolato', effetto: 'Ieri ha finito tutta la tavoletta', emoji: '🍫' },
  { causa: 'ha paura del buio', effetto: 'Stanotte ha lasciato la luce accesa', emoji: '🌙' },
  { causa: 'è molto ordinato', effetto: 'Ieri sera ha rifatto il letto due volte', emoji: '🛏️' },
  { causa: "soffre il mal d'auto", effetto: 'Oggi ha aperto il finestrino durante il viaggio', emoji: '🚗' },
  { causa: 'adora osservare gli insetti', effetto: "Ieri ha passato un'ora a guardare le formiche", emoji: '🐜' },
  { causa: 'è molto timido con gli sconosciuti', effetto: 'Oggi si è nascosto dietro la mamma', emoji: '🙈' },
  { causa: 'ha una memoria di ferro', effetto: 'Ieri ha ricordato tutti i nomi dei compagni nuovi', emoji: '🧠' },
  { causa: 'si emoziona facilmente', effetto: 'Ieri ha pianto guardando il film', emoji: '🎬' },
  { causa: 'è molto curioso', effetto: 'Oggi ha fatto cento domande alla maestra', emoji: '❓' },
  { causa: 'ha le mani sempre fredde', effetto: 'Stamattina ha indossato i guanti anche in casa', emoji: '🧤' },
  { causa: 'è appassionato di dinosauri', effetto: 'Ieri ha chiesto tre libri sui dinosauri in biblioteca', emoji: '🦖' },
]
const FALSI_CAUSA = {
  quindi: 'quindi introduce quello che viene DOPO la causa: qui verrebbe prima',
  se: "«se» serve per un'ipotesi: questo invece è già successo davvero",
  'anche se': "«anche se» segnala un ostacolo: qui invece l'effetto è proprio quello che ci si aspetta dalla causa",
}
/* usati anche nella forma «causa, connettivo effetto» di `senso()` */
const FALSI_CAUSA_GIRATA = {
  'perché': "così sembra che l'effetto sia la causa: è al contrario",
  ma: "qui non c'è nessun contrasto: le due cose vanno perfettamente d'accordo",
  se: "con «se» sembra un'ipotesi, ma questo è già successo davvero",
}

/* ── CONTRASTI: cosa ci aspettavamo (atteso) → cosa succede davvero,
   contro quell'aspettativa (sorpresa). `spiegazioneAttesa` è la stessa
   aspettativa detta a parole, e serve a «cosa dice la parolina». */
const CONTRASTI = [
  { atteso: 'Luca era stanchissimo', sorpresa: 'Ha continuato a correre', spiegazioneAttesa: 'che si sarebbe fermato a riposare', emoji: '🏃' },
  { atteso: 'Il cane aveva molta fame', sorpresa: 'Non ha toccato la ciotola', spiegazioneAttesa: 'che avrebbe mangiato subito tutto', emoji: '🐕' },
  { atteso: 'Il cielo era pieno di nuvole nere', sorpresa: 'Non è caduta nemmeno una goccia', spiegazioneAttesa: 'che sarebbe arrivato un temporale', emoji: '⛈️' },
  { atteso: 'Aveva studiato pochissimo', sorpresa: 'Ha preso un voto ottimo', spiegazioneAttesa: 'che avrebbe preso un voto brutto', emoji: '📝' },
  { atteso: 'La torta sembrava bruciata', sorpresa: 'Era buonissima', spiegazioneAttesa: 'che avesse un sapore cattivo', emoji: '🎂' },
  { atteso: 'Era il giocatore più basso della squadra', sorpresa: 'Ha segnato più canestri di tutti', spiegazioneAttesa: 'che avrebbe segnato pochi canestri', emoji: '🏀' },
  { atteso: 'Pioveva a dirotto', sorpresa: 'I bambini sono usciti a giocare lo stesso', spiegazioneAttesa: 'che sarebbero rimasti in casa', emoji: '🌧️' },
  { atteso: 'Non aveva mai sciato prima', sorpresa: 'È arrivato primo alla fine della pista', spiegazioneAttesa: 'che sarebbe stato lentissimo', emoji: '⛷️' },
  { atteso: 'Il vaso era caduto a terra', sorpresa: 'Non si è rotto', spiegazioneAttesa: 'che si sarebbe rotto in mille pezzi', emoji: '🏺' },
  { atteso: "Era arrivato con mezz'ora di ritardo", sorpresa: 'Ha trovato ancora tutti ad aspettarlo', spiegazioneAttesa: 'che gli altri se ne sarebbero già andati', emoji: '⏰' },
  { atteso: "Il gatto odiava l'acqua", sorpresa: 'È saltato in piscina senza pensarci', spiegazioneAttesa: "che sarebbe scappato lontano dall'acqua", emoji: '🐱' },
  { atteso: 'Era buio pesto in giardino', sorpresa: 'Ha trovato subito le chiavi cadute', spiegazioneAttesa: 'che avrebbe faticato a trovarle', emoji: '🔑' },
  { atteso: 'Non conosceva nessuno alla festa', sorpresa: 'Dopo un\'ora aveva già dieci nuovi amici', spiegazioneAttesa: 'che sarebbe rimasto in un angolo da solo', emoji: '🎉' },
  { atteso: 'Il ghiaccio sembrava sottilissimo', sorpresa: 'Ha retto benissimo il peso di tutti', spiegazioneAttesa: 'che si sarebbe rotto sotto il peso', emoji: '🧊' },
  { atteso: 'Aveva perso tutte le partite quella settimana', sorpresa: 'Ha vinto il torneo il sabato dopo', spiegazioneAttesa: 'che avrebbe perso anche quella volta', emoji: '🏆' },
  { atteso: 'La strada era piena di buche', sorpresa: 'Siamo arrivati senza il minimo problema', spiegazioneAttesa: 'che avremmo avuto qualche guaio', emoji: '🚗' },
  { atteso: 'Il pacco sembrava piccolissimo', sorpresa: "Dentro c'era una bicicletta intera", spiegazioneAttesa: 'che dentro ci fosse qualcosa di piccolo', emoji: '📦' },
  { atteso: "Era il compito più difficile dell'anno", sorpresa: 'Lo ha finito in dieci minuti', spiegazioneAttesa: 'che ci avrebbe messo molto tempo', emoji: '📚' },
]
const FALSI_CONTRASTO = {
  'perché': "qui non c'è nessun motivo da spiegare: le due cose non si spiegano a vicenda",
  quindi: 'con «quindi» sembra che la seconda cosa venga proprio da questa: qui invece è il contrario',
  se: "«se» serve per un'ipotesi: questo invece è già successo davvero",
}

/* ── CONDIZIONI: un'ipotesi vera — non ancora decisa — e quello che
   succederebbe. Sempre al futuro o su un esito ancora sconosciuto:
   è quello che rende «se» l'unica scelta onesta, e «quando» (che dà
   per certo l'esito) sempre un po' troppo sicuro di sé. */
const CONDIZIONI = [
  { condizione: 'domani non piove', conseguenza: 'Andremo al parco', emoji: '🌳' },
  { condizione: 'la squadra vince la partita', conseguenza: 'Festeggeremo con una pizza', emoji: '⚽' },
  { condizione: 'trovo il tempo stasera', conseguenza: 'Ti aiuterò con i compiti', emoji: '📖' },
  { condizione: 'il pullman arriva in orario', conseguenza: 'Non perderemo la lezione di nuoto', emoji: '🚌' },
  { condizione: 'riesci a finire il livello', conseguenza: 'Sbloccherai un nuovo personaggio', emoji: '🎮' },
  { condizione: 'nevica abbastanza', conseguenza: 'Potremo fare la slitta', emoji: '⛄' },
  { condizione: 'i biglietti non sono già finiti', conseguenza: 'Andremo al cinema sabato', emoji: '🎬' },
  { condizione: 'il veterinario ci dà il permesso', conseguenza: 'Lo rimetteremo nella vasca grande', emoji: '🐠' },
  { condizione: 'vinco alla lotteria della scuola', conseguenza: 'Comprerò un gelato per tutti', emoji: '🍦' },
  { condizione: 'il campo non è troppo bagnato', conseguenza: 'Usciremo a giocare a pallone', emoji: '⚽' },
  { condizione: 'trovi le chiavi', conseguenza: 'Potremo entrare in casa', emoji: '🔑' },
  { condizione: 'il gufo esce dal nascondiglio', conseguenza: 'Riusciremo a fotografarlo', emoji: '🦉' },
  { condizione: 'finiamo presto la cena', conseguenza: 'Avremo tempo per un gioco', emoji: '🍽️' },
  { condizione: 'riusciamo a evitare il traffico', conseguenza: 'Arriveremo in tempo per il film', emoji: '🚗' },
  { condizione: "superi l'esame di nuoto", conseguenza: 'Potrai fare la gara vera', emoji: '🏊' },
  { condizione: 'restano ancora posti liberi', conseguenza: 'Ci iscriveremo anche noi', emoji: '📋' },
]
const FALSI_CONDIZIONE = {
  quando: '«quando» dà per certo che succederà; qui invece non si sa ancora',
  'perché': "«perché» spiega un motivo già certo; qui invece non sappiamo se succederà",
  quindi: 'con «quindi» sembra che questo causi quello che sta scritto dopo: qui è al contrario',
}

/* ── QUANDO: uno sfondo che dura (all'imperfetto) e un fatto puntuale
   che ci arriva sopra (al passato). Le due cose non hanno NESSUN
   legame causale — è pura coincidenza di tempo — così «perché»,
   «quindi» e «se» restano falsi senza bisogno di altro. */
const QUANDO = [
  { sfondo: 'Stavo facendo la doccia', evento: 'È suonato il telefono', emoji: '🚿' },
  { sfondo: 'Stavamo guardando un film', evento: 'È saltata la luce', emoji: '🎬' },
  { sfondo: 'Il bambino dormiva', evento: 'È arrivato un temporale', emoji: '⛈️' },
  { sfondo: 'Stavamo facendo merenda', evento: 'È arrivata la zia in visita', emoji: '🍪' },
  { sfondo: 'Il gatto dormiva sul divano', evento: 'È entrato il postino', emoji: '🐱' },
  { sfondo: 'Stavo leggendo un fumetto', evento: 'Si è spenta la luce', emoji: '📖' },
  { sfondo: 'I bambini facevano merenda', evento: "È arrivato l'autobus", emoji: '🚌' },
  { sfondo: 'Stavamo giocando a carte', evento: 'È scoppiato un temporale', emoji: '🌩️' },
  { sfondo: 'La torta cuoceva nel forno', evento: 'È squillato il campanello', emoji: '🎂' },
  { sfondo: 'Stavo facendo i compiti', evento: 'Si è rotta la matita', emoji: '✏️' },
  { sfondo: 'Il cane dormiva vicino al camino', evento: 'È entrato un topolino in cucina', emoji: '🐹' },
  { sfondo: "Stavamo aspettando l'autobus", evento: 'Ha cominciato a piovere', emoji: '🚏' },
  { sfondo: 'La mamma cucinava', evento: 'È esploso il popcorn nel microonde', emoji: '🍿' },
  { sfondo: 'Stavamo facendo un puzzle', evento: 'Si è addormentato il gatto sui pezzi', emoji: '🧩' },
]
/* ── MENTRE: due azioni che durano insieme (all'imperfetto), di due
   soggetti diversi e senza nessun legame causale. */
const MENTRE = [
  { azione1: 'La mamma cucinava', azione2: 'i bambini giocavano in giardino', emoji: '👩‍🍳' },
  { azione1: 'Il papà lavava la macchina', azione2: "il cane dormiva all'ombra", emoji: '🚗' },
  { azione1: 'I nonni facevano una passeggiata', azione2: 'noi guardavamo un cartone', emoji: '🚶' },
  { azione1: 'La maestra scriveva alla lavagna', azione2: 'gli alunni prendevano appunti', emoji: '📝' },
  { azione1: 'Il vento soffiava forte', azione2: 'le onde si alzavano sul mare', emoji: '🌊' },
  { azione1: 'Gli uccellini cantavano', azione2: 'il sole sorgeva piano piano', emoji: '🐦' },
  { azione1: 'Io facevo i compiti', azione2: 'mio fratello suonava il pianoforte', emoji: '🎹' },
  { azione1: 'Il fornaio impastava il pane', azione2: 'il forno si scaldava', emoji: '🍞' },
  { azione1: 'I pesci nuotavano nella vasca', azione2: 'i bambini li osservavano', emoji: '🐠' },
  { azione1: 'Il treno correva veloce', azione2: 'i passeggeri chiacchieravano', emoji: '🚆' },
  { azione1: 'La pioggia cadeva sul tetto', azione2: 'noi giocavamo a carte', emoji: '🌧️' },
  { azione1: 'Il cuoco tagliava le verdure', azione2: 'il sugo bolliva in pentola', emoji: '🍅' },
  { azione1: 'I bambini costruivano un castello di sabbia', azione2: 'i genitori prendevano il sole', emoji: '🏖️' },
  { azione1: 'Le foglie cadevano dagli alberi', azione2: 'i bambini le raccoglievano', emoji: '🍂' },
]
const FALSI_TEMPO = {
  'perché': "qui non c'è nessun motivo: le due cose capitano insieme per caso, non una per colpa dell'altra",
  quindi: "con «quindi» sembra che una causi l'altra: qui invece capitano solo insieme",
  se: "«se» serve per un'ipotesi: queste invece sono cose che succedono davvero",
}

/* ── MENTRE_SENSO: lo stesso «mentre» può dire due cose diverse, e qui
   non si sceglie una parola — si capisce quale delle due sta dicendo
   questa frase. Metà delle voci è temporale (due cose insieme), metà
   è di contrasto (due cose diverse, quasi opposte). */
const MENTRE_SENSO = [
  { frase: 'La mamma stirava mentre il bambino faceva i compiti.', senso: 'tempo' },
  { frase: 'I nonni giocavano a carte mentre i nipoti guardavano un cartone.', senso: 'tempo' },
  { frase: 'Il cuoco preparava la pasta mentre il camino scoppiettava.', senso: 'tempo' },
  { frase: 'Il postino suonava il campanello mentre il cane abbaiava furioso.', senso: 'tempo' },
  { frase: 'Le foglie cadevano mentre il vento soffiava forte.', senso: 'tempo' },
  { frase: 'Il pubblico applaudiva mentre gli attori uscivano dal palco.', senso: 'tempo' },
  { frase: 'Il treno partiva mentre correvo verso il binario.', senso: 'tempo' },
  { frase: 'La pioggia cadeva mentre aspettavamo sotto la pensilina.', senso: 'tempo' },
  { frase: 'Io adoro la verdura, mentre mio fratello non la mangia mai.', senso: 'contrasto' },
  { frase: 'La mia squadra ha vinto, mentre quella di Marco ha perso.', senso: 'contrasto' },
  { frase: 'A me piace il mare, mentre a mia sorella piace la montagna.', senso: 'contrasto' },
  { frase: 'Alcuni bambini erano già pronti, mentre altri dormivano ancora.', senso: 'contrasto' },
  { frase: 'Il gatto ama dormire tutto il giorno, mentre il cane vuole sempre giocare.', senso: 'contrasto' },
  { frase: "Un fratello è alto e magro, mentre l'altro è basso e robusto.", senso: 'contrasto' },
  { frase: 'La maglietta rossa costava poco, mentre quella blu costava il triplo.', senso: 'contrasto' },
  { frase: "Metà della classe ha scelto il disegno, mentre l'altra metà ha scelto la musica.", senso: 'contrasto' },
]
const SENSO_MENTRE = {
  tempo: 'che due cose succedono nello stesso momento',
  contrasto: 'che due cose sono diverse, quasi il contrario',
}

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  'perché: la causa',
  'ma, però, invece: il contrasto',
  'quindi, quando, mentre: la conseguenza e il tempo',
  'se: la condizione',
  'anche se, e il doppio senso di «mentre»',
]

const TIPI = [
  { chiave: 'conn:causa', nome: 'Perché: la causa', sa: 'lessico', gradi: { 1: 1, 2: 0.25 } },
  { chiave: 'conn:conseguenza', nome: 'Quindi e così: la conseguenza', sa: 'lessico', gradi: { 1: 0.3, 2: 0.35, 3: 0.2 } },
  { chiave: 'conn:contrasto', nome: 'Ma, però, invece: il contrasto', sa: 'lessico', gradi: { 2: 1, 3: 0.3 } },
  { chiave: 'conn:capisci', nome: 'Cosa dice la parolina', sa: 'lessico', gradi: { 2: 0.4, 3: 0.25 } },
  { chiave: 'conn:tempo', nome: 'Quando e mentre: il tempo', sa: 'lessico', gradi: { 3: 1 } },
  { chiave: 'conn:senso', nome: 'Quale frase ha senso', sa: 'lessico', gradi: { 2: 0.3, 3: 0.4, 4: 0.2 } },
  { chiave: 'conn:condizione', nome: 'Se: la condizione', sa: 'lessico', gradi: { 4: 1 } },
  { chiave: 'conn:concessione', nome: 'Anche se, contro se', livello: 81, sa: 'lessico', gradi: { 4: 0.25, 5: 1 } },
  { chiave: 'conn:mentre-doppio', nome: 'Il doppio senso di «mentre»', livello: 85, sa: 'lessico', gradi: { 5: 0.6 } },
]

class Connettivi extends Modulo {
  constructor() {
    super({
      id: 'connettivi',
      nome: 'Connettivi',
      icona: '🧵',
      materia: 'italiano',
      chiaro: 'capire il rapporto fra due frasi legate da una parolina come perché, ma o quando',
      scaletta: SCALETTA,
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — stessa scala di
         tutte le materie, 12,5 punti per anno. «Perché» e «ma» sono
         di prima-seconda, «quindi/quando/mentre» di terza, «se» di
         quarta, «anche se» e il doppio senso di «mentre» di quarta
         inoltrata e quinta. */
      livelli: [31, 38, 50, 69, 81],
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'conn:conseguenza': return this.conseguenza(sorte)
      case 'conn:contrasto': return this.contrasto(sorte)
      case 'conn:capisci': return this.capisci(sorte)
      case 'conn:tempo': return this.tempo(sorte)
      case 'conn:senso': return this.senso(sorte)
      case 'conn:condizione': return this.condizione(sorte)
      case 'conn:concessione': return this.concessione(sorte)
      case 'conn:mentre-doppio': return this.mentreDoppio(sorte)
      default: return this.causa(sorte)
    }
  }

  /* grado 1 — «perché»: la parolina che manca, causa ed effetto */
  causa(sorte) {
    const c = sorte.uno(CAUSALI)
    const falsi = sorte.alcuni(Object.keys(FALSI_CAUSA), 2)
    return domanda({
      testo: `${c.effetto} ___ ${c.causa}.`,
      soggetto: { emoji: c.emoji },
      buona: testo('perché'),
      falsi: falsi.map(f => testo(f, FALSI_CAUSA[f])),
      chiave: 'conn:causa',
      aiuto: '«perché» introduce il motivo: quello che spiega come è nato l\'effetto',
      sorte,
    })
  }

  /* grado 1-3 — «quindi»/«così»: la stessa coppia, ma detta al
     contrario — prima la causa, poi quello che ne viene */
  conseguenza(sorte) {
    const c = sorte.uno(CAUSALI)
    const buona = sorte.uno(['quindi', 'così'])
    const falsi = sorte.alcuni(['perché', 'anche se', 'quando'], 2)
    const perche = { 'perché': FALSI_CAUSA_GIRATA['perché'], 'anche se': "«anche se» segnala un ostacolo, e qui non ce n'è nessuno", quando: '«quando» dà per certo un momento preciso; qui invece è solo un modo di essere' }
    return domanda({
      testo: `${maiuscola(c.causa)}, ___ ${minuscola(c.effetto)}.`,
      soggetto: { emoji: c.emoji },
      buona: testo(buona),
      falsi: falsi.map(f => testo(f, perche[f])),
      chiave: 'conn:conseguenza',
      aiuto: '«quindi» e «così» introducono l\'effetto: quello che succede dopo, per colpa della causa',
      sorte,
    })
  }

  /* grado 2 — «ma»/«però»/«invece»: il contrasto con quello che
     ci si aspettava */
  contrasto(sorte) {
    const c = sorte.uno(CONTRASTI)
    const buona = sorte.uno(['ma', 'però', 'invece'])
    const falsi = sorte.alcuni(Object.keys(FALSI_CONTRASTO), 2)
    return domanda({
      testo: `${c.atteso}, ___ ${minuscola(c.sorpresa)}.`,
      soggetto: { emoji: c.emoji },
      buona: testo(buona),
      falsi: falsi.map(f => testo(f, FALSI_CONTRASTO[f])),
      chiave: 'conn:contrasto',
      aiuto: '«ma», «però» e «invece» dicono che è successo il contrario di quello che ci si aspettava',
      sorte,
    })
  }

  /* grado 2-3 — «cosa dice la parolina»: non si completa una frase,
     si legge cosa segnala «ma» dentro una frase già scritta */
  capisci(sorte) {
    const c = sorte.uno(CONTRASTI)
    const falsi = sorte.distrattori(CONTRASTI, 3, x => x === c).map(x => x.spiegazioneAttesa)
    return domanda({
      testo: 'Leggendo questa frase, cosa ci aspettavamo che succedesse?',
      soggetto: { testo: `${c.atteso}, ma ${minuscola(c.sorpresa)}.` },
      buona: testo(c.spiegazioneAttesa),
      falsi: falsi.map(f => testo(f, 'non è questo che dice la frase: guarda cosa c\'è scritto prima di «ma»')),
      chiave: 'conn:capisci',
      aiuto: '«ma» avverte che sta arrivando il contrario di quello che la prima parte della frase faceva pensare',
      sorte,
    })
  }

  /* grado 3 — «quando»/«mentre»: il tempo, senza nessun legame di
     causa (per questo «perché», «quindi» e «se» restano sempre falsi) */
  tempo(sorte) {
    if (sorte.forse(0.5)) {
      const c = sorte.uno(QUANDO)
      const falsi = sorte.alcuni(Object.keys(FALSI_TEMPO), 2)
      return domanda({
        testo: `${c.sfondo}, ___ ${minuscola(c.evento)}.`,
        soggetto: { emoji: c.emoji },
        buona: testo('quando'),
        falsi: falsi.map(f => testo(f, FALSI_TEMPO[f])),
        chiave: 'conn:tempo',
        aiuto: '«quando» dice IN CHE MOMENTO succede una cosa',
        sorte,
      })
    }
    const c = sorte.uno(MENTRE)
    const falsi = sorte.alcuni(Object.keys(FALSI_TEMPO), 2)
    return domanda({
      testo: `${c.azione1}, ___ ${minuscola(c.azione2)}.`,
      soggetto: { emoji: c.emoji },
      buona: testo('mentre'),
      falsi: falsi.map(f => testo(f, FALSI_TEMPO[f])),
      chiave: 'conn:tempo',
      aiuto: '«mentre» dice che due cose succedono nello stesso momento',
      sorte,
    })
  }

  /* grado 2-4 — «quale frase ha senso»: la stessa coppia di fatti,
     quattro connettivi diversi, una sola logica */
  senso(sorte) {
    const c = sorte.uno(CAUSALI)
    if (sorte.forse(0.5)) {
      const cap = maiuscola(c.causa), eff = minuscola(c.effetto)
      return domanda({
        testo: 'Quale frase ha senso?',
        soggetto: { emoji: c.emoji },
        buona: testo(`${cap}, quindi ${eff}.`),
        falsi: [
          testo(`${cap}, perché ${eff}.`, FALSI_CAUSA_GIRATA['perché']),
          testo(`${cap}, ma ${eff}.`, FALSI_CAUSA_GIRATA.ma),
          testo(`${cap}, se ${eff}.`, FALSI_CAUSA_GIRATA.se),
        ],
        chiave: 'conn:senso',
        aiuto: '«quindi» introduce quello che succede dopo, per colpa di quello che viene prima',
        sorte,
      })
    }
    const eff = c.effetto, cau = minuscola(c.causa)
    return domanda({
      testo: 'Quale frase ha senso?',
      soggetto: { emoji: c.emoji },
      buona: testo(`${eff} perché ${cau}.`),
      falsi: [
        testo(`${eff} quindi ${cau}.`, FALSI_CAUSA.quindi),
        testo(`${eff} ma ${cau}.`, "qui non c'è nessun contrasto: le due cose vanno perfettamente d'accordo"),
        testo(`${eff} se ${cau}.`, FALSI_CAUSA.se),
      ],
      chiave: 'conn:senso',
      aiuto: '«perché» introduce il motivo: quello che spiega come è nato l\'effetto',
      sorte,
    })
  }

  /* grado 4 — «se»: un'ipotesi ancora aperta, non un fatto */
  condizione(sorte) {
    const c = sorte.uno(CONDIZIONI)
    const falsi = sorte.alcuni(Object.keys(FALSI_CONDIZIONE), 2)
    return domanda({
      testo: `${c.conseguenza} ___ ${c.condizione}.`,
      soggetto: { emoji: c.emoji },
      buona: testo('se'),
      falsi: falsi.map(f => testo(f, FALSI_CONDIZIONE[f])),
      chiave: 'conn:condizione',
      aiuto: '«se» dice che non sappiamo ancora se succederà: tutto dipende da questo',
      sorte,
    })
  }

  /* grado 4-5 — «anche se» contro «se»: la condizione (non si sa
     ancora) contro la concessione (si sa già, ed è un ostacolo) */
  concessione(sorte) {
    if (sorte.forse(0.5)) {
      const c = sorte.uno(CONDIZIONI)
      const falsi = ['anche se', 'quando']
      const perche = { 'anche se': "«anche se» si usa quando la cosa è già vera; qui invece non si sa ancora", quando: FALSI_CONDIZIONE.quando }
      return domanda({
        testo: `${c.conseguenza} ___ ${c.condizione}.`,
        soggetto: { emoji: c.emoji },
        buona: testo('se'),
        falsi: falsi.map(f => testo(f, perche[f])),
        chiave: 'conn:concessione',
        aiuto: '«se» si usa quando ancora non sappiamo se succederà',
        sorte,
      })
    }
    const c = sorte.uno(CONTRASTI)
    const falsi = ['se', 'quindi']
    const perche = { se: "«se» serve per un'ipotesi: questo invece è già successo davvero", quindi: FALSI_CONTRASTO.quindi }
    return domanda({
      testo: `${c.sorpresa} ___ ${minuscola(c.atteso)}.`,
      soggetto: { emoji: c.emoji },
      buona: testo('anche se'),
      falsi: falsi.map(f => testo(f, perche[f])),
      chiave: 'conn:concessione',
      aiuto: '«anche se» dice che qualcosa è successo nonostante un ostacolo già vero',
      sorte,
    })
  }

  /* grado 5 — il doppio senso di «mentre»: nello stesso momento,
     oppure invece? Si legge tutta la frase per saperlo */
  mentreDoppio(sorte) {
    const c = sorte.uno(MENTRE_SENSO)
    const altro = c.senso === 'tempo' ? 'contrasto' : 'tempo'
    const falsi = [
      testo(SENSO_MENTRE[altro], "guarda bene: qui «mentre» non sta dicendo questo"),
      testo('che una cosa è la causa dell\'altra', '«mentre» non spiega motivi'),
      testo("che una cosa succede solo se l'altra è vera", "«mentre» non è un'ipotesi"),
    ]
    return domanda({
      testo: 'Cosa dice «mentre» in questa frase?',
      soggetto: { testo: c.frase },
      buona: testo(SENSO_MENTRE[c.senso]),
      falsi,
      chiave: 'conn:mentre-doppio',
      aiuto: '«mentre» a volte vuol dire «nello stesso momento», a volte vuol dire «invece»: bisogna leggere tutta la frase',
      sorte,
    })
  }
}

export default new Connettivi()
