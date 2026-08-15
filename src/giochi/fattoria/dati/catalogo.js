/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE SI PUÒ METTERE NELLA FATTORIA

   Dato puro. Ogni voce dice **cosa si vede** (`pezzo`, un nome
   dell'atlante), **quanto occupa per terra** (`piede`, in celle) e
   **quanto costa**. Nient'altro: come si disegna lo sa `scena/`, se si
   può posare lì lo sa `motore/`.

   ── IL PIEDE NON È LA FIGURA ──────────────────────────────────────
   Una casa occupa 4×2 celle per terra ma è alta cinque tessere: il
   tetto sta **sopra** il suo piede, non dentro. Tenere separate le due
   cose è quello che permette a un personaggio di passare dietro il
   tetto e davanti al muro. Senza la distinzione i tetti coprono la roba
   che sta dietro, e la scena si appiattisce.

   ── `giri` — GIRARE NON È RUOTARE ─────────────────────────────────
   La pixel art ruotata si sfarina. Una staccionata si gira perché nel
   set esiste *la stessa staccionata in piedi*, ed è quella tessera che
   si mette al posto dell'altra. Quindi la staccionata è **una voce sola
   che si gira**, non due voci diverse. Dove il set non ha la variante,
   `giri` non c'è e il gioco non offre il tasto: meglio niente che un
   tasto che fa una cosa storta.

   ── `sotto` — CHI STA PER TERRA ───────────────────────────────────
   Un orto, uno stagno, dei fiori sono *terreno*, non oggetti: vanno
   disegnati sotto tutto il resto, se no un fiore alto tre pixel finisce
   davanti a una casa perché è più in basso nello schermo.
   ═══════════════════════════════════════════════════════════════════ */
import { PEZZI } from './atlante.js'

const V = (id, pezzo, nome, prezzo, piede, extra) =>
  ({ id, pezzo, nome, prezzo, piede, ...extra })

export const CATEGORIE = [
  { chiave: 'verde', nome: 'Verde', icona: '🌳', voci: [
    V('albero',    'albero',      'Albero',        18, [2, 1]),
    V('siepe',     'siepe',       'Siepe',          8, [2, 1]),
    V('radura',    'radura',      'Radura',        12, [3, 3], { sotto: true }),
    V('fiori0',    'fiori0',      'Fiorellini',     4, [1, 1], { sotto: true }),
    V('fiori1',    'fiori1',      'Fiori bianchi',  4, [1, 1], { sotto: true }),
    V('fiori2',    'fiori2',      'Fioritura',      5, [1, 1], { sotto: true }),
    V('orto',      'orto',        'Orto',          22, [2, 2], { sotto: true }),
  ] },
  { chiave: 'acqua', nome: 'Acqua', icona: '💧', voci: [
    V('stagno',    'stagno',      'Stagno',        34, [3, 3], { sotto: true }),
    /* la fontana è l'unica cosa animata: tre fotogrammi in giro */
    V('fontana',   'fontana0',    'Fontana',       60, [3, 2],
      { anima: ['fontana0', 'fontana1', 'fontana2'] }),
    V('ninfea',    'ninfea',      'Ninfea',         3, [1, 1], { sotto: true }),
    V('ninfee',    'ninfee',      'Ninfee',         6, [2, 1], { sotto: true }),
  ] },
  { chiave: 'recinti', nome: 'Recinti', icona: '🚧', voci: [
    V('staccio',   'staccionata', 'Staccionata',    6, [2, 1], { giri: [
      { pezzo: 'staccionata', piede: [2, 1] },     // sdraiata
      { pezzo: 'palo',        piede: [1, 2] },     // in piedi
    ] }),
    V('cancello',  'cancello',    'Cancello',      12, [2, 1]),
    V('ringhiera', 'ringhiera',   'Ringhiera',      9, [3, 1]),
  ] },
  { chiave: 'case', nome: 'Case', icona: '🏚️', voci: [
    /* una voce sola che si gira: davanti c'è la porta, dietro il muro
       cieco. Erano due voci di catalogo, ed era la stessa casa. */
    V('casa',      'casa',        'Casa',         120, [5, 2], { giri: [
      { pezzo: 'casa',       piede: [5, 2] },     // il davanti, con la porta
      { pezzo: 'casa_retro', piede: [5, 2] },     // il dietro
    ] }),
    V('casetta',   'casetta',     'Casetta',       55, [2, 1]),
    V('cantina',   'pozzo',       'Cantina',       40, [2, 1]),
  ] },
  { chiave: 'arredo', nome: 'Arredo', icona: '🪑', voci: [
    V('panchina',  'panchina',    'Panchina',      14, [3, 1]),
    V('panchina2', 'panchina2',   'Panchina 2',    14, [3, 1]),
    V('tavolo',    'tavolo',      'Tavolino',       9, [1, 1]),
    V('bancone',   'bancone',     'Bancone',       16, [1, 1]),
    V('cassa',     'cassa',       'Cassa',          7, [1, 1]),
    V('barile',    'barile',      'Barile',         7, [1, 1]),
    V('barile2',   'barile2',     'Barile fiorito', 9, [1, 1]),
    V('sacco',     'sacco',       'Sacco',          5, [1, 1]),
    V('colonna',   'colonna',     'Colonna',       11, [1, 1]),
    V('cartello',  'cartello',    'Cartello',      10, [2, 1]),
  ] },
  { chiave: 'banco', nome: 'Banco', icona: '🥕', voci: [
    V('cassetta0', 'cassetta0',   'Cassetta gialla', 8, [1, 1]),
    V('cassetta1', 'cassetta1',   'Cassetta verde',  8, [1, 1]),
    V('cassetta2', 'cassetta2',   'Cassetta rossa',  8, [1, 1]),
    V('cassetta3', 'cassetta3',   'Cassetta mais',   8, [1, 1]),
    V('vaso_f',    'vaso_fiore',  'Vaso fiorito',    6, [1, 1]),
    V('vaso_p',    'vaso_pianta', 'Vaso alto',       7, [1, 1]),
    V('vaso_a',    'vaso_azzurro', 'Vaso azzurro',   6, [1, 1]),
  ] },
]

export const CATALOGO = CATEGORIE.flatMap(c => c.voci)
export const PER_ID = Object.fromEntries(CATALOGO.map(v => [v.id, v]))

/* Le tre funzioni che reggono una voce sconosciuta senza esplodere. Un
   salvataggio di ieri può contenere un id che oggi non c'è più — è già
   successo, con il `palo` diventato una staccionata girata — e il gioco
   deve continuare a disegnare tutto il resto. */
export const versoDi = cosa => (cosa && cosa.g) || 0

export function piedeDi(cosa, v = PER_ID[cosa && cosa.id]) {
  if (!v) return [1, 1]
  return v.giri ? v.giri[versoDi(cosa) % v.giri.length].piede : v.piede
}

export function pezzoDi(cosa, v = PER_ID[cosa && cosa.id]) {
  if (!v) return null
  return v.giri ? v.giri[versoDi(cosa) % v.giri.length].pezzo : v.pezzo
}

export const puoGirare = v => !!(v && v.giri && v.giri.length > 1)

/* La fattoria del primo giorno. Aprire su un prato vuoto non dice
   niente: due cose già in mezzo mostrano che si può mettere roba. */
export const PARTENZA = [
  { id: 'casetta',  dx: 7,  dy: 4 },
  { id: 'orto',     dx: 4,  dy: 9 },
  { id: 'staccio',  dx: 4,  dy: 8 },
  { id: 'staccio',  dx: 6,  dy: 8 },
  { id: 'staccio',  dx: 8,  dy: 8 },
  { id: 'staccio',  dx: 10, dy: 8, g: 1 },
  { id: 'fiori0',   dx: 11, dy: 6 },
  { id: 'fiori1',   dx: 3,  dy: 12 },
  { id: 'panchina', dx: 8,  dy: 11 },
  { id: 'barile',   dx: 10, dy: 4 },
  { id: 'cassa',    dx: 11, dy: 4 },
  { id: 'vaso_f',   dx: 6,  dy: 4 },
  { id: 'albero',   dx: 12, dy: 10 },
]

export function guastiDelCatalogo() {
  const g = []
  const visti = new Set()
  for (const v of CATALOGO) {
    if (visti.has(v.id)) g.push(`id doppio nel catalogo: ${v.id}`)
    visti.add(v.id)
    if (!PEZZI[v.pezzo]) g.push(`${v.id}: la tessera «${v.pezzo}» non è nell'atlante`)
    if (!(v.prezzo > 0)) g.push(`${v.id}: prezzo impossibile`)
    if (!Array.isArray(v.piede) || v.piede.length !== 2 || v.piede.some(n => n < 1))
      g.push(`${v.id}: piede impossibile`)
    for (const nome of v.anima || [])
      if (!PEZZI[nome]) g.push(`${v.id}: il fotogramma «${nome}» non è nell'atlante`)
    for (const giro of v.giri || []) {
      if (!PEZZI[giro.pezzo]) g.push(`${v.id}: il giro «${giro.pezzo}» non è nell'atlante`)
      if (!Array.isArray(giro.piede) || giro.piede.length !== 2)
        g.push(`${v.id}: un giro senza piede`)
    }
    if (v.giri && v.giri.length < 2)
      g.push(`${v.id}: un solo giro non è un giro — meglio niente tasto`)
  }
  const cat = new Set()
  for (const c of CATEGORIE) {
    if (cat.has(c.chiave)) g.push(`categoria doppia: ${c.chiave}`)
    cat.add(c.chiave)
    if (!c.voci.length) g.push(`categoria vuota: ${c.chiave}`)
  }
  for (const p of PARTENZA)
    if (!PER_ID[p.id]) g.push(`la fattoria di partenza cita «${p.id}», che non è in catalogo`)
  return g
}
