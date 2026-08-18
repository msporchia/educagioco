/* ═══════════════════════════════════════════════════════════════════
   IL MODULO — un mazzo di domande di una materia, e niente altro.

   Un modulo è una classe che sa fare UNA cosa: dato un grado di
   difficoltà e una sorte, consegnare una domanda. Non sa chi gliela ha
   chiesta, non disegna, non tiene punteggi, non sa se il bambino ha
   risposto. Per questo lo stesso modulo serve Survivors quando si sale
   di livello, il dungeon a un bivio e il castello prima di comprare una
   torre: chi lo usa decide *quando* chiedere, il modulo decide *cosa*.

   COME SE NE SCRIVE UNO

     import { Modulo } from '../nucleo/modulo.js'
     import { domanda, testo } from '../nucleo/domanda.js'

     class Ortografia extends Modulo {
       constructor() {
         super({
           id: 'ortografia', nome: 'Ortografia', icona: '✏️',
           materia: 'italiano',
           chiaro: 'le parole che si scrivono diverse da come si sentono',
           scaletta: ['gn e gl', 'sc e cqu', '…'],   // una riga per grado
         })
       }
       genera(grado, sorte) { … return domanda({…}) }
     }
     export default new Ortografia()          // ← si esporta l'ISTANZA

   IL GRADO va da 1 a `scaletta.length` ed è l'unico asse di difficoltà:
   niente stato interno, niente «memoria» di cosa è già uscito. Un
   modulo è una funzione pura travestita da classe, e questa è la
   ragione per cui il banco di prova può girarne mille senza browser.
   Chi tiene il conto di quanto va bene un bambino è il gioco, e un
   domani `store/srs.js`.

   I PITTORI stanno nel modulo perché una scena la sa disegnare solo chi
   l'ha inventata: `{ che: 'orologio', ore, minuti }` non vuol dire
   niente al di fuori del modulo orologio. Dichiararli qui — invece che
   in una tabella comune — è anche il motivo per cui due moduli non si
   pestano mai i piedi.

   I TIPI sono le classi di domande che il modulo sa fare, dichiarate
   una per una — «il plurale», «l'ausiliare giusto», «i quarti d'ora» —
   con il peso che ognuna ha a ogni grado:

     tipi: [
       { chiave: 'ora:intere', nome: 'Le ore intere', sa: 'orologio',
         gradi: { 1: 1, 2: 0.55, 3: 0.2, 4: 0.03 } },
       …
     ]
     genera(grado, sorte, tipo) { … }      // il tipo arriva già scelto

   Prima la tipologia se la sceglieva il generatore per conto suo
   (`sorte.forse(0.55) ? plurale() : genere()`), e questo costava tre
   cose. Le proporzioni stavano sparse dentro gli `if` di undici file e
   nessuno poteva controllarle. I genitori potevano spegnere al massimo
   un grado intero, mentre un grado ne mescola due o tre: spegnere gli
   accenti portava via anche la lettera h. E la chiave — quella che un
   domani andrà a `store/srs.js` — si scopriva solo a domanda fatta,
   quindi non si poteva né chiedere né evitare.

   Dichiarati, il tipo lo pesca il nucleo fra quelli ancora accesi e lo
   passa a `genera`, che diventa uno switch. Un modulo che non dichiara
   niente continua a funzionare come prima: `genera(grado, sorte)` e
   basta.

   IL `sa` DI UN TIPO dice cosa quella domanda dà per scontato che il
   bambino abbia fatto a scuola — le chiavi sono i gruppi di
   `data/saperi.js`. Il genitore può spegnere il gruppo intero o la
   singola tipologia: per il modulo è lo stesso, sono due chiavi nella
   stessa lista di spenti. Il modulo non importa quel file e non legge
   nessun profilo: dichiara e basta.

   `saperi:` (una voce per grado) è la forma vecchia, senza tipi, e vale
   ancora per chi non li ha ancora dichiarati.
   ═══════════════════════════════════════════════════════════════════ */

import { pescaClasse, adatta, LIVELLO_MAX, livelloDegliAnni } from './classi.js'

/* ── QUANTO È COMPLICATO UN GRADO ──
   Ogni grado dichiara un numero da 0 a 100 sulla scala comune di
   `nucleo/classi.js`. Il perché sta lì; in due righe è questo: derivare
   la difficoltà dalla posizione nella scaletta metteva i grado-1 di
   tutti i moduli nello stesso punto, e «come si chiama questa figura»
   non è «Nina ha 4 mele e ne raccoglie 3».

   Chi non dichiara niente ricade su una scaletta stesa fra i sei e gli
   undici anni. È un ripiego onesto e visibile — un modulo nuovo
   funziona subito — ma resta un'ipotesi: `test/unita/catalogo` elenca
   chi non si è pronunciato, perché quel numero è la sola cosa che
   decide se una domanda arriva a un bambino o no. */
const RIPIEGO = [livelloDegliAnni(6), livelloDegliAnni(11)]

/* un livello per grado, col ripiego per chi tace */
function perGradoLivello(livelli, gradi) {
  return Array.from({ length: gradi }, (_, i) => {
    const v = livelli?.[i]
    if (Number.isFinite(v)) return Math.min(LIVELLO_MAX, Math.max(0, v))
    return Math.round(gradi > 1
      ? RIPIEGO[0] + (RIPIEGO[1] - RIPIEGO[0]) * (i / (gradi - 1))
      : RIPIEGO[0])
  })
}

/* i saperi in forma normale: un array lungo quanto la scaletta, ogni
   voce un elenco (spesso vuoto) di chiavi. Si accetta una stringa sola
   — «tutto il modulo vuole questo» — perché è il caso dell'orologio, e
   scriverlo cinque volte uguale è solo un modo per sbagliarne una. */
function perGrado(saperi, gradi) {
  const vuoti = Array.from({ length: gradi }, () => [])
  if (!saperi) return vuoti
  if (typeof saperi === 'string') return vuoti.map(() => [saperi])
  return vuoti.map((_, i) => {
    const v = saperi[i]
    return !v ? [] : (Array.isArray(v) ? v : [v])
  })
}

/* i saperi grado per grado, ricavati dai tipi: un grado si chiude solo
   se il sapere spento se li porta via TUTTI. Il grado 5 di grammatica è
   soggetto-predicato più i nomi propri, tutti e due analisi
   grammaticale: spenta quella, di quel grado non resta niente. Il grado
   5 di ortografia invece è accenti più la lettera h, e spegnere gli
   accenti non lo chiude: lo assottiglia. */
function saperiDaiTipi(tipi, gradi) {
  return Array.from({ length: gradi }, (_, i) => {
    const qui = tipi.filter(t => t.gradi[i + 1] > 0)
    if (!qui.length) return []
    return qui[0].sa.filter(s => qui.every(t => t.sa.includes(s)))
  })
}

/* ── IL RITOCCO DI UN GRANDE ──
   I livelli che dichiariamo sono nostri, e ogni tanto sono sbagliati:
   per *questo* bambino le tabelline sono avanti di un anno e i verbi
   indietro di sei mesi, e nessuno lo sa meglio di chi gli sta seduto
   accanto. Il ritocco è quello: **un gradino su o giù** su un gruppo o
   su una singola tipologia, non un blocco da scegliere fra tre.

   Un gradino è mezzo anno di scuola (`PASSO`), e più di tre non se ne
   fanno: oltre un anno e mezzo di scarto non si sta più ritoccando una
   taratura, si sta dicendo un'altra cosa — e quell'altra cosa è
   spegnere il gruppo, che si fa con un tasto suo.

   Il verso è quello che si dice a parole: **«per lui è facile» alza**
   (arrivano domande più toste e spariscono quelle sotto), «per lui è
   difficile» abbassa. Nel dato è un numero con segno, che è l'unica
   forma che si somma senza doverci pensare. */
export const PASSO = 6
export const RITOCCO_MAX = 3
export const gradini = n => Math.max(-RITOCCO_MAX, Math.min(RITOCCO_MAX, Math.round(n || 0)))

export class Modulo {
  constructor({ id, nome, icona, materia, chiaro, scaletta,
                saperi = null, tipi = null, pittori = {}, livelli = null }) {
    this.id = id                  // 'ortografia' — anche il prefisso delle chiavi
    this.nome = nome              // 'Ortografia' — quello che si legge
    this.icona = icona            // un'emoji sola
    this.materia = materia        // 'italiano' | 'matematica' | 'spazio' | 'tempo'
    this.chiaro = chiaro          // cosa allena, detto a un genitore
    this.scaletta = scaletta      // una riga per grado: cosa si chiede lì
    this.tipi = (tipi || []).map(t => ({ ...t, sa: t.sa ? [].concat(t.sa) : [] }))
    this.saperi = this.tipi.length            // cosa serve aver fatto a scuola
      ? saperiDaiTipi(this.tipi, scaletta.length)
      : perGrado(saperi, scaletta.length)
    this.pittori = pittori        // { nomeScena: (pennello, scena) => … }
    /* quanto è complicato ogni grado, da 0 a 100: uno per riga di
       scaletta. Chi tace ricade sul ripiego, e si vede. */
    this.livelli = perGradoLivello(livelli, scaletta.length)
    this.livelloDichiarato = Array.isArray(livelli) && livelli.length > 0
  }

  get gradi() { return this.scaletta.length }

  /* ── i saperi: cosa un grado dà per scontato ──
     Il grado 3 di `misure` chiede di convertire, e chi non sa quanto è
     un litro lì non ragiona: tira a indovinare. Dichiararlo qui — di
     fianco alla riga di scaletta che lo descrive — è quello che
     permette ai genitori di spegnerlo da `data/saperi.js` senza che
     nessun gioco sappia niente di misure. Un grado che non dà niente
     per scontato non dichiara niente, ed è il caso normale. */
  serve(grado) { return this.saperi[grado - 1] || [] }

  /* ── i tipi di un grado ──
     con il peso che hanno lì: è quello che dà le proporzioni di sempre
     («il plurale esce un po' più spesso del genere») senza doverle
     scrivere dentro il generatore. */
  tipiDi(grado) {
    return this.tipi.filter(t => t.gradi[grado] > 0)
      .map(t => ({ ...t, peso: t.gradi[grado] }))
  }

  /* spento vuol dire due cose, e per chi chiede sono la stessa: o il
     genitore ha tolto la tipologia, o ha tolto il gruppo che se la
     porta dietro */
  tipoSpento(tipo, spenti = []) {
    return spenti.includes(tipo.chiave) || tipo.sa.some(s => spenti.includes(s))
  }

  /* ── quanto è complicata una tipologia ──
     Come il suo grado, a meno che non l'abbia dichiarato per sé: nei
     gradi che ne mescolano due — «le doppie» e «cqu» insieme — capita
     che una delle due stia un gradino più in là, e allora lo dice. */
  livelloDelTipo(tipo, grado) {
    return Number.isFinite(tipo.livello) ? tipo.livello : this.livelli[grado - 1]
  }

  /* ── il livello di un grado ──
     La media di quello che ancora si può chiedere lì dentro: se un
     genitore ha spento la metà difficile di un grado, quel grado si
     abbassa davvero invece di continuare a dichiararsi com'era. */
  livelloDi(grado, spenti = [], regole = null) {
    return this.mediaDei(grado, spenti, regole, t => this.livelloDelTipo(t, grado))
  }

  /* ── il livello COME LO VEDE QUESTO BAMBINO ──
     Lo stesso numero, meno il ritocco che un grande ha messo su quel
     gruppo: «per lui questo è facile» vuol dire che per lui quella roba
     sta più in basso, e da lì viene tutto il resto — entra nel mazzo
     roba che prima era troppo su, ed esce quando il gioco chiede poco.
     Il livello vero non si tocca: quello è del catalogo, e non cambia
     da un bambino all'altro. */
  livelloVistoDelTipo(tipo, grado, regole = null) {
    return this.livelloDelTipo(tipo, grado) - this.ritoccoDelTipo(tipo, regole?.ritocchi)
  }

  livelloVisto(grado, spenti = [], regole = null) {
    return this.mediaDei(grado, spenti, regole, t => this.livelloVistoDelTipo(t, grado, regole))
  }

  /* la media pesata di quello che in quel grado si può ancora chiedere;
     arrotondata a un decimale perché una media di dieci noni si presenta
     come 95.00000000001 in ogni elenco che la mostra */
  mediaDei(grado, spenti, regole, quanto) {
    const qui = this.tipiLiberi(grado, spenti, regole)
    if (!qui.length) return this.livelli[grado - 1]
    const tot = qui.reduce((s, t) => s + t.peso, 0)
    if (!(tot > 0)) return this.livelli[grado - 1]
    return Math.round(qui.reduce((s, t) => s + t.peso * quanto(t), 0) / tot * 10) / 10
  }

  /* ── quanto in su, dentro questo modulo, va una chiave ──
     Serve ai tre livelli che i genitori possono scegliere al posto di
     spegnere (`facile`, `medio`, `tutto`): il taglio è **relativo a
     quello che quella chiave offre qui dentro**, e non una soglia
     d'età fissa. Altrimenti «facile» su un gruppo che comincia a nove
     anni — le conversioni — non lascerebbe niente, e un interruttore
     che a volte svuota tutto è peggio di non averlo. */
  /* Il ritocco che tocca a questa tipologia: la somma di quelli scritti
     sulla tipologia stessa e sui gruppi che se la portano dietro. Si
     sommano invece di scegliere il più forte perché sono affermazioni
     diverse — «l'ortografia gli viene bene» e «le doppie in particolare
     gli vengono bene» dicono due cose, e insieme ne dicono una terza. */
  ritoccoDelTipo(tipo, ritocchi) {
    if (!ritocchi) return 0
    let somma = 0
    for (const chiave of [tipo.chiave, ...tipo.sa]) somma += ritocchi[chiave] || 0
    return gradini(somma) * PASSO
  }

  tipiLiberi(grado, spenti = [], regole = null) {
    let qui = this.tipiDi(grado)
    if (spenti.length) qui = qui.filter(t => !this.tipoSpento(t, spenti))
    if (!regole) return qui
    /* si guarda il livello **visto da questo bambino**: il ritocco di un
       grande abbassa o alza la classe, e da lì viene sia chi entra sia
       quanto pesa */
    return qui.filter(t => adatta(this.livelloVistoDelTipo(t, grado, regole), regole.finestra))
  }

  /* questo grado si può ancora chiedere? */
  puo(grado, spenti = [], regole = null) {
    if (this.tipi.length) return this.tipiLiberi(grado, spenti, regole).length > 0
    if (this.serve(grado).some(s => spenti.includes(s))) return false
    return !regole || adatta(this.livelli[grado - 1], regole.finestra)
  }

  /* i gradi che restano, dal più facile al più difficile. Vuoto vuol
     dire che il modulo intero non ha più niente da chiedere — e allora
     sparisce dall'estrazione invece di consegnare domande mute. */
  gradiLiberi(spenti = [], regole = null) {
    const out = []
    for (let g = 1; g <= this.gradi; g++) if (this.puo(g, spenti, regole)) out.push(g)
    return out
  }

  /* IL DEGRADO. Il gioco chiede un grado, e se quel grado è chiuso non
     si rinuncia alla domanda: si scende. Verso il basso apposta — un
     grado più facile è sempre onesto, uno più difficile chiederebbe al
     bambino qualcosa che non gli è ancora stato insegnato — e solo se
     sotto non c'è più niente si guarda sopra. `null` se non resta
     niente. È la stessa scelta del castello che con le divisioni spente
     chiede moltiplicazioni invece di saltare la torre. */
  gradoVicino(grado, spenti = [], regole = null) {
    const liberi = this.gradiLiberi(spenti, regole)
    if (!liberi.length) return null
    const sotto = liberi.filter(g => g <= grado)
    return sotto.length ? sotto[sotto.length - 1] : liberi[0]
  }

  /* L'unico metodo che un modulo deve scrivere. `tipo` è la chiave già
     pescata fra quelle ancora accese — `null` per i moduli che i tipi
     non li dichiarano. */
  genera(grado, sorte, tipo) { // eslint-disable-line no-unused-vars
    throw new Error(`il modulo ${this.id} non sa generare domande`)
  }

  /* ── il ripasso, che è metà qui e metà in `classi.js` ──
     `bisogno` è una funzione `chiave → fattore` (1 = neutro): quanto
     spesso questa tipologia va rivista, dato quello che il bambino ha
     già risposto. Il modulo non sa da dove venga — la calcola
     `nucleo/bisogno.js` leggendo `store/srs.js` — e senza di lei tutto
     resta com'era.

     Il bisogno MEDIO di un grado serve a chi sceglie la classe: una
     classe piena di roba che il bambino non sa deve uscire più spesso
     di una che sa a memoria. È la media pesata coi pesi delle
     tipologie, e non è un dettaglio: è la media *giusta*, quella che
     fa comporre i due livelli senza raddoppiare. Scegliendo la classe
     con la media e la tipologia dentro con il proprio fattore diviso
     quella media, la probabilità finale di una tipologia risulta
     esattamente proporzionale al suo fattore — la media si semplifica.
     Con due fattori pieni invece il rapporto fra estremi sarebbe il
     quadrato (nove a uno invece di tre a uno), e la banda stretta
     scelta apposta non varrebbe più niente. */
  bisognoMedio(grado, spenti = [], bisogno = null, regole = null) {
    if (!bisogno || !this.tipi.length) return 1
    const qui = this.tipiLiberi(grado, spenti, regole)
    const tot = qui.reduce((s, t) => s + t.peso, 0)
    if (!(tot > 0)) return 1
    return qui.reduce((s, t) => s + t.peso * bisogno(t.chiave), 0) / tot
  }

  /* Comodità per chi lo usa: tiene il grado dentro i binari, così un
     gioco può chiedere «grado 9» a un modulo che ne ha 5 senza doverlo
     sapere. `spenti` serve a scegliere il tipo: il grado è già stato
     scelto da chi chiama, la tipologia dentro quel grado no.
     Se non resta niente di acceso si tira lo stesso — chi ha scelto il
     grado doveva guardare `gradiLiberi`, e una domanda in più è meno
     peggio di una schermata di gioco vuota. */
  chiedi(grado, sorte, spenti = [], bisogno = null, regole = null) {
    const g = Math.max(1, Math.min(this.gradi, Math.round(grado || 1)))
    if (!this.tipi.length) return this.genera(g, sorte)
    let liberi = this.tipiLiberi(g, spenti, regole)
    if (bisogno && liberi.length)
      liberi = liberi.map(t => ({ ...t, peso: t.peso * bisogno(t.chiave) }))
    const scelto = pescaClasse(sorte, liberi) || pescaClasse(sorte, this.tipiDi(g))
    return this.genera(g, sorte, scelto?.chiave || null)
  }
}
