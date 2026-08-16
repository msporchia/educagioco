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

   ── LA PAPPA SI COMPRA, E ANCHE LA PALLINA ────────────────────────
   *Ribalta la regola di prima* («spazzolare e giocare sono gratis,
   perché sono le due cose che un bambino può sempre fare»). Deciso
   così: **giocare costa una monetina, spazzolare no.** Una bestia deve
   costare qualcosa ogni giorno, se no il primo giorno è l'unico che
   conta; e fra i due gesti quello che si ripete di più — e che vale di
   più a chi guarda — è il gioco.

   La conseguenza è nota ed è quella scritta nella regola vecchia: **chi
   è a zero monete non può giocare col suo cane finché non fa
   esercizi.** È il prezzo accettato, e la carezza gratis resta: la
   spazzola non costa niente e nessuno resta con un animale che non può
   toccare.

   ── OGNI BESTIA HA I SUOI CIBI ────────────────────────────────────
   I quattro cibi valevano uguale per tutti e cambiava solo quanto
   riempivano: la bistecca al pappagallo era una scelta come un'altra.
   Adesso ogni cibo dichiara **per chi è** (`per`, le famiglie di
   `dati/animali.js`), e quello sbagliato viene **rifiutato**, non
   pagato meno: un no è una cosa che un bambino vede, mezza barretta in
   meno no. Dentro la famiglia resta la scaletta di sempre — poco caro
   riempie poco, caro riempie tanto ma rende un po' meno al pezzo.
   ═══════════════════════════════════════════════════════════════════ */

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
]

export const cibiPer = famiglia => CIBI.filter(c => c.per.includes(famiglia))
export const gradisce = (cibo, famiglia) => !!cibo && cibo.per.includes(famiglia)

/* La spazzola è gratis, la pallina no: il perché sta in testa al file,
   ed è una decisione presa, non una svista. */
export const COCCOLE = [
  { id: 'spazzola', bisogno: 'pelo',  nome: 'Spazzolalo',   emoji: '🪮', quanto: 0.5,  prezzo: 0 },
  { id: 'gioca',    bisogno: 'gioco', nome: 'Gioca con lui', emoji: '🎾', quanto: 0.55, prezzo: 1 },
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

export function guastiDeiBisogni() {
  const g = []
  if (!(FONDO > 0)) g.push('il fondo dev\'essere sopra zero: una bestia non sta mai male')
  for (const [k, b] of Object.entries(BISOGNI))
    if (!(b.ore > 0)) g.push(`${k}: ore impossibili`)
  const visti = new Set()
  for (const c of CIBI) {
    if (visti.has(c.id)) g.push(`cibo doppio: ${c.id}`)
    visti.add(c.id)
    if (!(c.prezzo > 0)) g.push(`${c.id}: prezzo impossibile`)
    if (!(c.quanto > 0 && c.quanto <= 1)) g.push(`${c.id}: riempie una quantità impossibile`)
    if (!Array.isArray(c.per) || !c.per.length)
      g.push(`${c.id}: non è il cibo di nessuno, e nessuno lo mangerà mai`)
  }
  /* Il cibo caro non deve convenire anche al pezzo, se no gli altri non
     li sceglie più nessuno e tanto vale toglierli. Il confronto è
     **dentro la famiglia**: fra la bistecca del cane e i semi del
     pappagallo non c'è nessuna scelta da fare, e paragonarli darebbe un
     guasto che non vuol dire niente. */
  for (const famiglia of new Set(CIBI.flatMap(c => c.per))) {
    const suoi = cibiPer(famiglia)
    for (let i = 1; i < suoi.length; i++)
      if (suoi[i].quanto / suoi[i].prezzo > suoi[i - 1].quanto / suoi[i - 1].prezzo)
        g.push(`${suoi[i].id}: rende più al pezzo di quello prima — gli altri diventano inutili`)
  }
  for (const c of COCCOLE) {
    if (!BISOGNI[c.bisogno]) g.push(`${c.id}: riempie un bisogno che non esiste`)
    if (!(c.quanto > 0)) g.push(`${c.id}: non riempie niente`)
    if (!(c.prezzo >= 0)) g.push(`${c.id}: prezzo impossibile`)
  }
  /* Una carezza gratis ci dev'essere sempre: è quello che tiene in piedi
     la decisione di far pagare il gioco. Chi è a zero monete deve poter
     comunque toccare il suo cane. */
  if (!COCCOLE.some(c => !c.prezzo))
    g.push('nessuna coccola gratis: chi è a zero monete resta con un animale intoccabile')
  return g
}
