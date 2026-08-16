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

import { pescaClasse } from './classi.js'

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

export class Modulo {
  constructor({ id, nome, icona, materia, chiaro, scaletta,
                saperi = null, tipi = null, pittori = {} }) {
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

  tipiLiberi(grado, spenti = []) {
    const qui = this.tipiDi(grado)
    return spenti.length ? qui.filter(t => !this.tipoSpento(t, spenti)) : qui
  }

  /* questo grado si può ancora chiedere? */
  puo(grado, spenti = []) {
    if (this.tipi.length) return this.tipiLiberi(grado, spenti).length > 0
    return !this.serve(grado).some(s => spenti.includes(s))
  }

  /* i gradi che restano, dal più facile al più difficile. Vuoto vuol
     dire che il modulo intero non ha più niente da chiedere — e allora
     sparisce dall'estrazione invece di consegnare domande mute. */
  gradiLiberi(spenti = []) {
    const out = []
    for (let g = 1; g <= this.gradi; g++) if (this.puo(g, spenti)) out.push(g)
    return out
  }

  /* IL DEGRADO. Il gioco chiede un grado, e se quel grado è chiuso non
     si rinuncia alla domanda: si scende. Verso il basso apposta — un
     grado più facile è sempre onesto, uno più difficile chiederebbe al
     bambino qualcosa che non gli è ancora stato insegnato — e solo se
     sotto non c'è più niente si guarda sopra. `null` se non resta
     niente. È la stessa scelta del castello che con le divisioni spente
     chiede moltiplicazioni invece di saltare la torre. */
  gradoVicino(grado, spenti = []) {
    const liberi = this.gradiLiberi(spenti)
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
  bisognoMedio(grado, spenti = [], bisogno = null) {
    if (!bisogno || !this.tipi.length) return 1
    const qui = this.tipiLiberi(grado, spenti)
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
  chiedi(grado, sorte, spenti = [], bisogno = null) {
    const g = Math.max(1, Math.min(this.gradi, Math.round(grado || 1)))
    if (!this.tipi.length) return this.genera(g, sorte)
    let liberi = this.tipiLiberi(g, spenti)
    if (bisogno && liberi.length)
      liberi = liberi.map(t => ({ ...t, peso: t.peso * bisogno(t.chiave) }))
    const scelto = pescaClasse(sorte, liberi) || pescaClasse(sorte, this.tipiDi(g))
    return this.genera(g, sorte, scelto?.chiave || null)
  }
}
