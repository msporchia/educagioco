/* ═══════════════════════════════════════════════════════════════════
   COME STA UNA BESTIA, E COSA LE SERVE

   Tre bisogni che calano da soli e tre modi di riempirli. Il dato è qui;
   il conto lo fa il motore, il disegno la scena.

   ── CALANO CON LE ORE VERE, NON COI FOTOGRAMMI ────────────────────
   Se il gioco resta chiuso una settimana, al ritorno il cane ha fame:
   è giusto, ed è quello che rende una bestia una bestia invece di una
   figurina. Ma il fondo è **0,15 e non zero**: non sta mai male, non si
   ammala, non muore. Questo posto è il premio per gli esercizi fatti
   altrove — un animale che ti fa sentire in colpa se non apri l'app lo
   trasformerebbe nell'ennesimo compito, e il compito lo si smette.

   ── OGNI GESTO COSTA UNA MONETINA ─────────────────────────────────
   *Ribalta due volte la stessa regola.* Prima erano gratis tutte e due
   («sono le due cose che un bambino può sempre fare»), poi è diventata
   a pagamento la pallina e gratis la spazzola («nessuno resta con un
   animale che non può toccare»). Adesso **costano una monetina tutte e
   due**, ed è una decisione presa sapendo cosa comporta: chi è a zero
   monete non può fare niente col suo animale finché non fa un
   esercizio.

   Il motivo è che una bestia deve costare qualcosa ogni giorno — se no
   il primo giorno è l'unico che conta — e che un gesto gratis in mezzo
   a gesti che costano non si legge come un regalo: si legge come quello
   che si preme sempre, e gli altri due diventano decorazione. Una
   monetina è dieci secondi di esercizio (`CALIBRAZIONE.md`): è il
   prezzo più piccolo che esista qui dentro, non una tassa.

   ── OGNI BESTIA HA I SUOI CIBI ────────────────────────────────────
   I quattro cibi valevano uguale per tutti e cambiava solo quanto
   riempivano: la bistecca al pappagallo era una scelta come un'altra.
   Adesso ogni cibo dichiara **per chi è** (`per`, le famiglie di
   `dati/animali.js`), e quello sbagliato viene **rifiutato**, non
   pagato meno: un no è una cosa che un bambino vede, mezza barretta in
   meno no. Dentro la famiglia resta la scaletta di sempre — poco caro
   riempie poco, caro riempie tanto ma rende un po' meno al pezzo.

   ── E DUE CIBI CHE NON SI COMPRANO ────────────────────────────────
   Il mangime e il pastone escono dal mulino (`dati/coltivazioni.js`) e
   costano **zero monete**: sono già stati pagati coltivando. Un cibo
   dichiara quindi *o* un `prezzo` in monete *o* un `da`, cioè il
   prodotto che si scala dal granaio — non entrambi, se no non si
   saprebbe cosa si sta spendendo.

   Vanno bene per **tutte** le famiglie, e non è una scorciatoia: un
   mangime per cani, uno per gatti e uno per pappagalli vorrebbero dire
   tre catene di produzione parallele per la stessa mossa, e la fattoria
   diventerebbe un lavoro d'ufficio. Quello che cambia fra le famiglie
   resta la roba buona che si compra — l'osso, il pesce, i semi.
   ═══════════════════════════════════════════════════════════════════ */
/* L'unico import, e va in una direzione sola: dato che guarda dato. Le
   ricette servono a `serveA()`, in fondo al file. Il catalogo invece
   importa **da qui**, quindi da qui non si importa lui: chi mostra le
   cose ci mette il nome della macchina. */
import { RICETTE, PRODOTTI } from './coltivazioni.js'

export const FONDO = 0.15

export const BISOGNI = {
  pancia: { nome: 'Pancia', icona: '🍖', ore: 14, colore: '#e0a33c' },
  pelo:   { nome: 'Pelo',   icona: '🪮', ore: 30, colore: '#7fb4e0' },
  gioco:  { nome: 'Voglia di giocare', icona: '🎾', ore: 20, colore: '#8fcf6f' },
}

export const CHIAVI = Object.keys(BISOGNI)

/* La ciotola. Due cibi per famiglia — uno da poco e uno buono — perché
   con uno solo non c'è nessuna scelta da fare, e con quattro uguali per
   tutti non c'era niente da imparare. Il cibo buono riempie di più ma
   rende un po' meno al pezzo: spendere tanto in una volta è una
   comodità, non la mossa ovvia.

   `per` sono le famiglie di `dati/animali.js` (`cane-beagle` → `cane`).
   Un cibo che non è per te viene rifiutato: vedi `gradisce()`. */
export const CIBI = [
  { id: 'osso',    nome: 'Osso',    emoji: '🦴', prezzo: 5,  quanto: 0.30, per: ['cane'] },
  { id: 'bistecca', nome: 'Bistecca', emoji: '🥩', prezzo: 14, quanto: 0.70, per: ['cane'] },
  { id: 'pesce',   nome: 'Pesce',   emoji: '🐟', prezzo: 5,  quanto: 0.30, per: ['gatto'] },
  { id: 'pate',    nome: 'Paté',    emoji: '🥫', prezzo: 14, quanto: 0.70, per: ['gatto'] },
  { id: 'semi',    nome: 'Semini',  emoji: '🌰', prezzo: 5,  quanto: 0.30, per: ['pappagallo'] },
  { id: 'frutta',  nome: 'Frutta',  emoji: '🍎', prezzo: 14, quanto: 0.70, per: ['pappagallo'] },
  /* quelli che non si comprano: costano zero monete e un pezzo di
     granaio — il perché sta in testa al file. Due vengono dal mulino,
     tre dai recinti, e la scaletta è la stessa di sempre: il mangime
     riempie poco, il tartufo riempie quasi tutto e costa una catena
     lunga (zucche → porcile → mezz'ora). */
  { id: 'mangime', nome: 'Mangime', emoji: '🥣', prezzo: 0, da: 'mangime',
    quanto: 0.30, per: ['cane', 'gatto', 'pappagallo'] },
  { id: 'uova', nome: 'Uovo', emoji: '🥚', prezzo: 0, da: 'uova',
    quanto: 0.45, per: ['cane', 'gatto', 'pappagallo'] },
  { id: 'latte', nome: 'Ciotola di latte', emoji: '🥛', prezzo: 0, da: 'latte',
    quanto: 0.55, per: ['cane', 'gatto'] },
  { id: 'pastone', nome: 'Pastone', emoji: '🍲', prezzo: 0, da: 'pastone',
    quanto: 0.70, per: ['cane', 'gatto', 'pappagallo'] },
  { id: 'tartufi', nome: 'Tartufo', emoji: '🍄', prezzo: 0, da: 'tartufi',
    quanto: 0.90, per: ['cane', 'gatto', 'pappagallo'] },
]

export const cibiPer = famiglia => CIBI.filter(c => c.per.includes(famiglia))
export const gradisce = (cibo, famiglia) => !!cibo && cibo.per.includes(famiglia)
/* Quelli che si comprano con le monete, e sono la maggioranza: serve a
   chi confronta i prezzi fra loro, che col mangime a zero non ha senso. */
export const cibiComprati = CIBI.filter(c => !c.da)

/* La spazzola è gratis, la pallina no: il perché sta in testa al file,
   ed è una decisione presa, non una svista.

   La copertina è la terza, ed è la prima coccola che si paga **col
   granaio** invece che con le monete: stessa forma dei cibi (`da`, e
   niente `prezzo`), e stesso motivo. Serve a dare un mestiere alla
   lana, che è l'unica roba dei recinti che non si mangia, e serve a che
   oltre la ciotola ci sia qualcos'altro da desiderare. */
export const COCCOLE = [
  { id: 'spazzola', bisogno: 'pelo',  nome: 'Spazzolalo',   emoji: '🪮', quanto: 0.5,  prezzo: 1 },
  { id: 'gioca',    bisogno: 'gioco', nome: 'Gioca con lui', emoji: '🎾', quanto: 0.55, prezzo: 1 },
  { id: 'copertina', bisogno: 'pelo', nome: 'Copertina di lana', emoji: '🧶',
    quanto: 0.95, prezzo: 0, da: 'lana' },
]

export const nuovo = (ora = Date.now()) =>
  ({ pancia: 0.8, pelo: 0.9, gioco: 0.7, quando: ora })

/* Quanto è calato da `quando` a ora. Chi legge lo stato lo fa scendere
   e riscrive l'orologio: così il calo non dipende da quanto spesso si
   guarda, che è l'errore classico di questi conti. */
export function scendi(b, ora = Date.now()) {
  const ore = Math.max(0, (ora - (b.quando || ora)) / 3600000)
  if (ore <= 0.02) return b
  for (const k of CHIAVI)
    b[k] = Math.max(FONDO, Math.min(1, (b[k] ?? 0.8) - ore / BISOGNI[k].ore))
  b.quando = ora
  return b
}

export const umore = b => CHIAVI.reduce((s, k) => s + (b[k] ?? 0), 0) / CHIAVI.length
export const haBisogno = b => CHIAVI.some(k => (b[k] ?? 1) < 0.35)

/* Le frasi valgono per **tutte** le bestie: un pappagallo che scodinzola
   e porta la pallina era il prezzo di averle scritte pensando al cane. */
export function comeSta(b, nome = 'Sta') {
  const u = umore(b)
  if (u > 0.78) return `${nome} sta benissimo. Ti viene incontro appena ti vede.`
  if (u > 0.55) return `${nome} sta bene.`
  if (b.pancia < 0.35) return `${nome} ha fame: guarda te, poi la ciotola.`
  if (b.gioco < 0.35) return `${nome} si annoia: gira in tondo e ti guarda.`
  if (b.pelo < 0.35) return `${nome} ha il pelo tutto arruffato.`
  return `${nome} potrebbe stare meglio.`
}

/* ── A COSA SERVE UNA ROBA DEL SILO ───────────────────────────────
   Premendo il grano dentro un silo si legge chi lo usa. È l'unica cosa
   utile che una riga di scaffale possa dire — «non si vende, serve alle
   macchine» è vero per tutto e quindi non dice niente di *questo*
   prodotto — ed è anche il modo in cui la catena si scopre da dentro:
   chi guarda il fieno legge che ci si fa il latte, e sa cosa comprare.

   Sta qui e non nella vista perché è dato che guarda dato: le ricette,
   la ciotola e le coccole sono tre tabelle diverse, e metterle insieme
   in un componente vorrebbe dire che il prossimo modo di spendere una
   roba non compare in questo elenco senza che nessuno se ne accorga.

   Torna righe già pronte per essere lette, ma **non frasi**: il nome
   della macchina lo sa il catalogo (che importa da qui, quindi da qui
   non si può importare lui) e la frase la compone chi mostra. */
/* ── I GESTI CHE RIEMPIONO UN BISOGNO ─────────────────────────────
   La scheda di una bestia è fatta di **tre blocchi**, uno per bisogno,
   e dentro ognuno stanno le cose che quel bisogno lo riempiono: sotto
   la pancia la ciotola, sotto il pelo la spazzola e la copertina, sotto
   il gioco la pallina. Era un elenco di cibi e una fila di tasti in
   fondo, e non si capiva quale tasto muovesse quale barretta.

   `famiglia` toglie di mezzo quello che questa bestia rifiuta: era
   mostrato apposta («che un gatto non mangi i semini si impara vedendo
   il semino accanto al pesce»), e la lezione c'era, ma il prezzo era
   una ciotola di dieci tasti di cui sei spenti — su un telefono, sotto
   il dito di chi ha quattro anni. Chi vuole imparare cosa mangia un
   gatto adesso lo legge dove serve: nella riga «gli piace». */
export function gestiPer(bisogno, famiglia = null) {
  if (bisogno === 'pancia')
    return CIBI.filter(c => !famiglia || c.per.includes(famiglia))
      .map(c => ({ che: 'cibo', ...c }))
  return COCCOLE.filter(c => c.bisogno === bisogno).map(c => ({ che: 'coccola', ...c }))
}

export function serveA(prodotto) {
  const usi = []
  for (const r of RICETTE)
    if ((r.prende || {})[prodotto])
      usi.push({ che: 'ricetta', dove: r.dove, quanti: r.prende[prodotto],
                 emoji: r.emoji, nome: r.nome, resa: r.resa, minuti: r.minuti })
  for (const c of CIBI)
    if (c.da === prodotto)
      usi.push({ che: 'cibo', emoji: c.emoji, nome: c.nome, quanto: c.quanto })
  for (const c of COCCOLE)
    if (c.da === prodotto)
      usi.push({ che: 'coccola', emoji: c.emoji, nome: c.nome,
                 bisogno: (BISOGNI[c.bisogno] || {}).nome || c.bisogno })
  return usi
}

export function guastiDeiBisogni() {
  const g = []
  /* Una roba che non serve a niente si accumula in un silo che ha
     quattro posti: dopo un po' quel silo è pieno di roba inutile e non
     entra più niente, e non c'è niente a schermo che lo dica. */
  for (const id of Object.keys(PRODOTTI))
    if (!serveA(id).length) g.push(`${id}: non serve a niente, e occuperebbe un posto per sempre`)
  if (!(FONDO > 0)) g.push('il fondo dev\'essere sopra zero: una bestia non sta mai male')
  for (const [k, b] of Object.entries(BISOGNI))
    if (!(b.ore > 0)) g.push(`${k}: ore impossibili`)
  const visti = new Set()
  for (const c of CIBI) {
    if (visti.has(c.id)) g.push(`cibo doppio: ${c.id}`)
    visti.add(c.id)
    /* O si paga in monete o si scala dal granaio, non entrambi: un cibo
       che costa 5 monete **e** un mangime non si saprebbe raccontare, e
       il pannello mostrerebbe un prezzo che è solo metà del vero. */
    if (c.da && c.prezzo) g.push(`${c.id}: costa monete e roba insieme — decidi quale`)
    if (!c.da && !(c.prezzo > 0)) g.push(`${c.id}: prezzo impossibile`)
    if (!(c.quanto > 0 && c.quanto <= 1)) g.push(`${c.id}: riempie una quantità impossibile`)
    if (!Array.isArray(c.per) || !c.per.length)
      g.push(`${c.id}: non è il cibo di nessuno, e nessuno lo mangerà mai`)
  }
  /* Il cibo caro non deve convenire anche al pezzo, se no gli altri non
     li sceglie più nessuno e tanto vale toglierli. Il confronto è
     **dentro la famiglia**: fra la bistecca del cane e i semi del
     pappagallo non c'è nessuna scelta da fare, e paragonarli darebbe un
     guasto che non vuol dire niente. */
  /* Il confronto vale solo fra i cibi **comprati**: il mangime del
     mulino costa zero monete e renderebbe all'infinito al pezzo, cioè
     darebbe un guasto a ogni giro dicendo una cosa vera e inutile — che
     coltivare conviene. Conviene, ed è il punto: costa tempo. */
  for (const famiglia of new Set(CIBI.flatMap(c => c.per))) {
    const suoi = cibiPer(famiglia).filter(c => !c.da)
    for (let i = 1; i < suoi.length; i++)
      if (suoi[i].quanto / suoi[i].prezzo > suoi[i - 1].quanto / suoi[i - 1].prezzo)
        g.push(`${suoi[i].id}: rende più al pezzo di quello prima — gli altri diventano inutili`)
  }
  for (const c of COCCOLE) {
    if (!BISOGNI[c.bisogno]) g.push(`${c.id}: riempie un bisogno che non esiste`)
    if (!(c.quanto > 0)) g.push(`${c.id}: non riempie niente`)
    if (!(c.prezzo >= 0)) g.push(`${c.id}: prezzo impossibile`)
    /* Stessa regola dei cibi, e per lo stesso motivo: monete o roba, non
       tutte e due, se no il pannello mostra metà del prezzo vero. */
    if (c.da && c.prezzo) g.push(`${c.id}: costa monete e roba insieme — decidi quale`)
  }
  /* Una carezza gratis ci dev'essere sempre: è quello che tiene in piedi
     la decisione di far pagare il gioco. Chi è a zero monete deve poter
     comunque toccare il suo cane. */
  if (!COCCOLE.some(c => !c.prezzo))
    g.push('nessuna coccola gratis: chi è a zero monete resta con un animale intoccabile')
  return g
}
