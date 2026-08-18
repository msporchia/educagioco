/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE SI COLTIVA, E COSA CI SI FA

   Dato puro: nessuna funzione che gioca, nessun `import` di motore o di
   Vue. Le regole stanno in `motore/fattoria.js`, il disegno in `scena/`.

   ── IL FRENO È IL TEMPO, NON IL PREZZO ────────────────────────────
   La fattoria è **l'unico money pit**: le monete si guadagnano facendo
   esercizi negli altri giochi e qui si bruciano. Una catena di
   produzione è la cosa che più rischia di ribaltarlo, quindi due regole
   che non si toccano.

   La prima: **niente si vende**. Grano, mais, mangime sono valuta
   interna e non tornano monete, mai. Il verso è sempre monete → cose. È
   lo stesso motivo per cui sgomberare il bosco costa e non rende
   (`motore/fattoria.js`): una seconda fonte di monete che non passa da
   nessun esercizio farebbe smettere di fare esercizi.

   La seconda: **coltivare costa meno che comprare, ma costa tempo
   vero**. Il mangime prodotto viene sui 3 contro i 5 del cibo comprato,
   e il pastone sui 7 contro 14 — cioè si risparmia circa la metà, non
   l'80%. Il resto del freno lo mette l'orologio: quindici minuti veri
   per un giro di grano, e la capacità installata (quanti campi hai) è
   il tetto di quanto puoi produrre in una sera. Chi vuole dar da
   mangiare *adesso* compra, come ha sempre fatto. Chi ha aspettato
   risparmia. Ed è per questo che il money pit regge: l'attrezzatura —
   il campo, il mulino, i silos — si paga **prima**, in monete grosse, e
   si ripaga in decine di raccolti.

   ── NIENTE MARCISCE. MAI. ─────────────────────────────────────────
   Un campo maturo resta maturo per sempre: se il gioco sta chiuso una
   settimana, al ritorno il grano è lì. È la stessa decisione del fondo
   0,15 di `bisogni.js` — la bestia ha fame ma non muore — applicata al
   raccolto, e per lo stesso motivo: questo posto è il premio per gli
   esercizi fatti altrove, non un altro compito. Un campo che si perde
   se non apri l'app trasforma il premio in un dovere, e il dovere si
   smette. Tutto è **in pausa**, niente è in scadenza.

   Da qui viene anche la regola sulle monete: raccogliere costa, ma chi
   è a zero monete **non perde il raccolto** — il campo resta pronto e
   aspetta il primo esercizio fatto. Vedi `raccogli()` nel motore.

   ── GLI STADI SONO NOMI DI TESSERE ────────────────────────────────
   Ogni coltura dichiara come si vede mano a mano che cresce: una
   tessera per stadio. Erano **ripieghi** — un germoglio generico, un
   mucchio di fieno — in attesa del foglio dei campi a stadi; il foglio
   è arrivato (`sorgenti/gfx/campi.png`) ed è cambiata questa tabella e
   nient'altro, come c'era scritto. La scena disegna il nome che le
   arriva e non sa cosa sia il grano.

   Sette stati per una coltura sono tanti **apposta** — il tempo di
   crescita è vero, e in dieci minuti deve succedere qualcosa a ogni
   occhiata, se no il campo sembra fermo e non ci si torna più. Il primo
   è già visibile (vedi `CRESCE`): un campo appena seminato deve dire di
   essere stato seminato.

   ── E NON SI RIPETONO PIÙ SU OGNI CELLA ───────────────────────────
   *Ribalta la scelta di prima.* Uno stadio si ripeteva su ogni cella del
   piede finché era una tesserina da 16 px: quattro germogli su un campo
   2×2 erano un campo che cresce, uno solo in mezzo era un ciuffo d'erba.
   Adesso uno stadio **è il campo intero**, aiuola compresa, disegnato
   una volta sola sul piede 2×2 — e le piante alte sbordano in su, che è
   il motivo per cui un campo di mais maturo si vede da lontano.
   ═══════════════════════════════════════════════════════════════════ */

/* L'unico import, e va in una direzione sola: dato che guarda dato.
   Serve al controllo in fondo — uno stadio che l'atlante non ha è un
   campo che cresce senza vedersi crescere, e non lo dice nessuno. */
import { PEZZI } from './atlante.js'

/* Un minuto in millisecondi, scritto una volta: i tempi qui sotto sono
   in minuti veri, che è l'unità in cui si ragiona tarandoli. */
export const MINUTO = 60000

/* ── L'INTERRUTTORE DEI GENITORI ──────────────────────────────────
   La coltivazione è **una variante** (`store/profile.js`): non è un
   gioco — la carta della fattoria resta in home — e non è un pezzo di
   scuola. È metà di un posto, che si può togliere senza togliere il
   posto. Spenta: i campi e il mulino già costruiti restano in mappa come
   disegno, il granaio non si svuota, e la pappa si compra a monete come
   si è sempre fatto.

   La chiave sta qui e non in `Gioco.vue` perché la legge anche la pagina
   dei grandi, e un componente Vue non è un posto da cui importare una
   costante: il calco è `CHIAVE_MENTE` in `data/asteroidi.js`. */
export const CHIAVE_VARIANTE = 'fattoria:coltivazione'

/* ── quello che finisce in granaio ────────────────────────────────
   `nome` ed `emoji` sono per chi guarda; `cibo` (facoltativo) dice che
   quella roba, oltre a stare in granaio, si può mettere nella ciotola —
   il legame vero sta in `bisogni.js`, che la pesca da qui. */
export const PRODOTTI = {
  /* dai campi */
  grano:   { nome: 'Grano',   emoji: '🌾' },
  mais:    { nome: 'Mais',    emoji: '🌽' },
  carote:  { nome: 'Carote',  emoji: '🥕' },
  zucche:  { nome: 'Zucche',  emoji: '🎃' },
  fieno:   { nome: 'Fieno',   emoji: '🌿' },
  /* dal mulino */
  mangime: { nome: 'Mangime', emoji: '🥣' },
  pastone: { nome: 'Pastone', emoji: '🍲' },
  /* dai recinti */
  uova:    { nome: 'Uova',    emoji: '🥚' },
  latte:   { nome: 'Latte',   emoji: '🥛' },
  tartufi: { nome: 'Tartufi', emoji: '🍄' },
  lana:    { nome: 'Lana',    emoji: '🧶' },
}

/* I sette stati di una coltura, scritti una volta: sono i sette
   riquadri del foglio, in fila. Si scrive qui e non riga per riga perché
   il foglio è fatto così per tutte e cinque, e ricopiare sette nomi
   cinque volte è il modo di sbagliarne uno e accorgersene fra un mese.

   **Il primo stato non è più `null`.** Lo era — «appena seminato non si
   vede niente, la terra mossa è già il disegno del campo» — ed era il
   difetto che si vedeva a occhio: per il primo settimo della crescita un
   campo seminato era *identico* a un campo vuoto, quindi non si capiva
   se seminare avesse funzionato. Adesso il primo riquadro sono **i semi
   per terra**, e compaiono nell'istante in cui si semina.

   Quello che resta a raccontare il campo vuoto è il pezzo del catalogo
   (`campo_vuoto`): terra nuda, non lavorata, presa da un'altra riga del
   foglio apposta. Da lì a un'aiuola col bordo e i semi la differenza si
   vede da lontano — è il campo che è stato arato. */
const CRESCE = coltura => Array.from({ length: 7 }, (_, i) => `campo_${coltura}${i}`)

/* ── le colture ───────────────────────────────────────────────────
   `semina` e `raccolta` sono monete, `minuti` è tempo vero, `resa` è
   quanti prodotti escono da un campo. Il rapporto fra le tre cose è
   tutta l'economia: vedi `unita/coltivazioni`, che rifiuta una coltura
   che costa più del cibo che sostituisce. */
export const COLTURE = [
  /* L'erba medica è la più veloce e la meno cara, e non è cibo per
     nessuno: serve ai recinti, che è il modo di dire «prima il fieno,
     poi gli animali» senza scriverlo da nessuna parte. */
  {
    id: 'erba', nome: 'Erba medica', emoji: '🌿',
    semina: 1, raccolta: 1, minuti: 8, resa: 4, da: 'fieno',
    stadi: CRESCE('erba'),
  },
  {
    id: 'grano', nome: 'Grano', emoji: '🌾',
    semina: 2, raccolta: 2, minuti: 10, resa: 3, da: 'grano',
    stadi: CRESCE('grano'),
  },
  {
    id: 'carote', nome: 'Carote', emoji: '🥕',
    semina: 3, raccolta: 2, minuti: 12, resa: 3, da: 'carote',
    stadi: CRESCE('carote'),
  },
  {
    id: 'mais', nome: 'Mais', emoji: '🌽',
    semina: 2, raccolta: 2, minuti: 18, resa: 5, da: 'mais',
    stadi: CRESCE('mais'),
  },
  /* La più lenta e la più cara, e l'unica che i maiali cercano: è la
     coltura che si semina quando si ha già tutto il resto. */
  {
    id: 'zucche', nome: 'Zucche', emoji: '🎃',
    semina: 4, raccolta: 3, minuti: 25, resa: 2, da: 'zucche',
    stadi: CRESCE('zucche'),
  },
]

export const PER_COLTURA = Object.fromEntries(COLTURE.map(c => [c.id, c]))

/* ── le ricette: dove la roba diventa un'altra roba ───────────────
   Una ricetta sta in una **macchina** (`dove`, un id di catalogo): senza
   quell'oggetto in mappa non si può fare, ed è lì il money pit vero —
   il mulino costa più di trenta pappe comprate, e si ripaga solo a chi
   coltiva per giorni.

   Costano anche monete (`costo`), poche: il gesto di far partire una
   macchina è un gesto come seminare.

   ── UN RECINTO È UNA MACCHINA ─────────────────────────────────────
   E non un'altra meccanica. Gli si dà quello che è cresciuto nei campi,
   passa del tempo vero, e rende la sua roba: sono esattamente i verbi
   del mulino — `avvia`, aspetta, `ritira` — quindi il motore è quello
   che c'è già e non c'è niente di nuovo da imparare né da parte di chi
   gioca né da parte di chi legge il codice.

   Quello che un recinto ha di suo è che **si vede in che stato è**: il
   foglio degli animali disegna ogni specie sei volte (calmo, ha fame,
   mangia, contento, dorme, pronto) e il catalogo dice quale pezzo va con
   quale stato. Da lontano, senza aprire niente, si legge se c'è da fare
   qualcosa — che è lo stesso mestiere del 💭 sopra un cane affamato.

   La catena, per intero: campo → granaio → recinto → granaio → ciotola.
   Il verso resta uno solo, e non torna mai indietro in monete. */
export const RICETTE = [
  {
    id: 'mangime', nome: 'Mangime', emoji: '🥣', dove: 'mulino',
    prende: { grano: 3 }, costo: 2, minuti: 5, da: 'mangime', resa: 2,
  },
  {
    id: 'pastone', nome: 'Pastone', emoji: '🍲', dove: 'mulino',
    prende: { mais: 4 }, costo: 4, minuti: 8, da: 'pastone', resa: 1,
  },
  {
    id: 'uova', nome: 'Uova', emoji: '🥚', dove: 'pollaio',
    prende: { grano: 3 }, costo: 2, minuti: 12, da: 'uova', resa: 2,
  },
  {
    id: 'latte', nome: 'Latte', emoji: '🥛', dove: 'stalla',
    prende: { fieno: 6 }, costo: 4, minuti: 20, da: 'latte', resa: 2,
  },
  {
    id: 'lana', nome: 'Lana', emoji: '🧶', dove: 'ovile',
    prende: { fieno: 2 }, costo: 2, minuti: 25, da: 'lana', resa: 1,
  },
  /* Due strade per la stessa lana, e non è una svista: la conigliera
     costa un terzo dell'ovile e ci mette meno, ma mangia carote, che
     sono la coltura di mezzo. Chi ha poche monete e tanta pazienza
     arriva alla copertina lo stesso. */
  {
    id: 'lana_angora', nome: 'Lana d\'angora', emoji: '🧶', dove: 'conigliera',
    prende: { carote: 2 }, costo: 1, minuti: 18, da: 'lana', resa: 1,
  },
  {
    id: 'tartufi', nome: 'Tartufi', emoji: '🍄', dove: 'porcile',
    prende: { zucche: 2 }, costo: 3, minuti: 30, da: 'tartufi', resa: 1,
  },
]

export const PER_RICETTA = Object.fromEntries(RICETTE.map(r => [r.id, r]))

export const ricetteDi = dove => RICETTE.filter(r => r.dove === dove)

/* ── il granaio ───────────────────────────────────────────────────
   Un tetto **da subito**, e generoso. Illimitato adesso e limitato
   dopo sarebbe una regressione — «prima ci stava tutto» — e il silo che
   si compra dev'essere un miglioramento, non il rimedio a una
   punizione arrivata a metà partita. Ogni silo posato in mappa alza il
   tetto: è il modo di spendere monete che la produzione stessa fa
   desiderare. */
export const GRANAIO = 30
export const GRANAIO_PER_SILO = 30

/* Quanto ci sta di ogni prodotto, con i silos che si hanno. Il conto
   sta qui e non nel motore perché è un numero, non una regola. */
export const capienza = silos => GRANAIO + GRANAIO_PER_SILO * Math.max(0, silos | 0)

/* ── leggere l'orologio ───────────────────────────────────────────
   Quanto è cresciuto qualcosa che è cominciato a `da` e vuole `minuti`.
   Si ferma a 1 e non va oltre: **niente marcisce**, quindi oltre il
   maturo non c'è nessun altro stato.

   Il massimo con zero serve a un orologio che va indietro — succede su
   un telefono a cui si cambia la data, e senza il taglio un campo
   seminato risulterebbe seminato *nel futuro* e non maturerebbe più. */
export function quantoCresciuto(da, minuti, ora = Date.now()) {
  if (!da || !(minuti > 0)) return 1
  return Math.max(0, Math.min(1, (ora - da) / (minuti * MINUTO)))
}

/* Quale stadio mostrare, fra quelli dichiarati. L'ultimo è il maturo, e
   ci si arriva solo a crescita finita: se no un campo al 99% sembrerebbe
   pronto e chi lo tocca troverebbe un tasto spento. */
export function stadioDi(coltura, quanto) {
  const st = (coltura && coltura.stadi) || []
  if (!st.length) return null
  if (quanto >= 1) return st[st.length - 1]
  const q = Math.max(0, Math.min(0.999, quanto))
  return st[Math.floor(q * (st.length - 1))]
}

/* Quanto manca, in minuti interi arrotondati per eccesso: «fra 3 minuti»
   è una cosa che si può dire a un bambino, «fra 154 secondi» no. Zero
   vuol dire pronto. */
export function minutiCheMancano(da, minuti, ora = Date.now()) {
  const q = quantoCresciuto(da, minuti, ora)
  if (q >= 1) return 0
  return Math.max(1, Math.ceil((1 - q) * minuti))
}

export function guastiDelleColture() {
  const g = []
  const visti = new Set()
  for (const c of COLTURE) {
    if (visti.has(c.id)) g.push(`coltura doppia: ${c.id}`)
    visti.add(c.id)
    if (!PRODOTTI[c.da]) g.push(`${c.id}: rende «${c.da}», che non è un prodotto`)
    if (!(c.minuti > 0)) g.push(`${c.id}: tempo impossibile`)
    if (!(c.resa >= 1)) g.push(`${c.id}: non rende niente`)
    if (!(c.semina >= 0) || !(c.raccolta >= 0)) g.push(`${c.id}: prezzo impossibile`)
    /* Un campo che non si vede crescere è un campo che sembra rotto: gli
       stadi devono essere almeno due, seminato e maturo. */
    if (!Array.isArray(c.stadi) || c.stadi.length < 2)
      g.push(`${c.id}: meno di due stadi — la crescita non si vedrebbe`)
    /* Uno stadio che l'atlante non ha è **muto**: `drawImage` con un
       argomento non finito torna senza disegnare e senza lanciare, quindi
       il campo cresce e non si vede crescere, e non c'è niente in
       console. È il motivo per cui i nomi si controllano qui. */
    for (const s of c.stadi || [])
      if (s && !PEZZI[s]) g.push(`${c.id}: lo stadio «${s}» non è nell'atlante`)
  }
  const idRicette = new Set()
  for (const r of RICETTE) {
    if (idRicette.has(r.id)) g.push(`ricetta doppia: ${r.id}`)
    idRicette.add(r.id)
    if (!PRODOTTI[r.da]) g.push(`${r.id}: fa «${r.da}», che non è un prodotto`)
    if (!(r.resa >= 1)) g.push(`${r.id}: non rende niente`)
    if (!(r.minuti > 0)) g.push(`${r.id}: tempo impossibile`)
    for (const k of Object.keys(r.prende || {})) {
      if (!PRODOTTI[k]) g.push(`${r.id}: prende «${k}», che non è un prodotto`)
      if (!(r.prende[k] >= 1)) g.push(`${r.id}: prende una quantità impossibile di ${k}`)
    }
    if (!Object.keys(r.prende || {}).length)
      g.push(`${r.id}: non prende niente — sarebbe una fonte di roba dal nulla`)
  }
  if (!(GRANAIO > 0)) g.push('un granaio da zero non tiene niente')
  if (!(GRANAIO_PER_SILO > 0)) g.push('un silo che non aggiunge niente non si compra')
  return g
}
