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

   ── LA PAPPA SI COMPRA, LE COCCOLE NO ─────────────────────────────
   Dare da mangiare costa: è il motivo per cui una bestia è un impegno e
   non solo una spesa una tantum. Spazzolare e giocare sono gratis,
   perché sono le due cose che un bambino può sempre fare — se anche le
   attenzioni costassero, chi è a zero monete si ritroverebbe con un
   cane che non può nemmeno accarezzare.
   ═══════════════════════════════════════════════════════════════════ */

export const FONDO = 0.15

export const BISOGNI = {
  pancia: { nome: 'Pancia', icona: '🍖', ore: 14, colore: '#e0a33c' },
  pelo:   { nome: 'Pelo',   icona: '🪮', ore: 30, colore: '#7fb4e0' },
  gioco:  { nome: 'Voglia di giocare', icona: '🎾', ore: 20, colore: '#8fcf6f' },
}

export const CHIAVI = Object.keys(BISOGNI)

/* La ciotola. Più costa più riempie, ma **non in proporzione**: il cibo
   caro conviene un po' meno al pezzo, così spendere tanto in una volta
   è una comodità e non la scelta ovvia. */
export const CIBI = [
  { id: 'croccantini', nome: 'Croccantini', emoji: '🥣', prezzo: 4,  quanto: 0.25 },
  { id: 'pollo',       nome: 'Pollo',       emoji: '🍗', prezzo: 7,  quanto: 0.40 },
  { id: 'pappa',       nome: 'Pappa',       emoji: '🍲', prezzo: 11, quanto: 0.60 },
  { id: 'carne',       nome: 'Carne',       emoji: '🥩', prezzo: 16, quanto: 0.85 },
]

/* Le due cose che non costano niente. */
export const COCCOLE = [
  { id: 'spazzola', bisogno: 'pelo',  nome: 'Spazzolalo',   emoji: '🪮', quanto: 0.5 },
  { id: 'gioca',    bisogno: 'gioco', nome: 'Gioca con lui', emoji: '🎾', quanto: 0.55 },
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

export function comeSta(b, nome = 'Sta') {
  const u = umore(b)
  if (u > 0.78) return `${nome} sta benissimo. Scodinzola appena ti vede.`
  if (u > 0.55) return `${nome} sta bene.`
  if (b.pancia < 0.35) return `${nome} ha fame: guarda te, poi la ciotola.`
  if (b.gioco < 0.35) return `${nome} si annoia. Ti ha portato la pallina due volte.`
  if (b.pelo < 0.35) return `${nome} ha il pelo tutto arruffato.`
  return `${nome} potrebbe stare meglio.`
}

export function guastiDeiBisogni() {
  const g = []
  if (!(FONDO > 0)) g.push('il fondo dev\'essere sopra zero: una bestia non sta mai male')
  for (const [k, b] of Object.entries(BISOGNI))
    if (!(b.ore > 0)) g.push(`${k}: ore impossibili`)
  for (const c of CIBI) {
    if (!(c.prezzo > 0)) g.push(`${c.id}: prezzo impossibile`)
    if (!(c.quanto > 0 && c.quanto <= 1)) g.push(`${c.id}: riempie una quantità impossibile`)
  }
  /* il cibo caro non deve convenire anche al pezzo, se no gli altri
     non li sceglie più nessuno e tanto vale toglierli */
  const perMoneta = CIBI.map(c => c.quanto / c.prezzo)
  for (let i = 1; i < perMoneta.length; i++)
    if (perMoneta[i] > perMoneta[i - 1])
      g.push(`${CIBI[i].id}: rende più al pezzo di quello prima — gli altri diventano inutili`)
  for (const c of COCCOLE) {
    if (!BISOGNI[c.bisogno]) g.push(`${c.id}: riempie un bisogno che non esiste`)
    if (!(c.quanto > 0)) g.push(`${c.id}: non riempie niente`)
  }
  return g
}
