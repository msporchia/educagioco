/* ═══════════════════════════════════════════════════════════════════
   I COLORI DEI MATTONI, E LE LETTERE CON CUI SI SCRIVONO IN UNA MAPPA

   Una mappa del costruttore è ASCII, un carattere per cella (la legenda
   intera sta in `dati/legenda.js`). Un mattone si scrive con la lettera
   del suo colore: **minuscola** vuol dire «qui ci va un mattone» (il
   disegno da costruire, che si vede in trasparenza), **maiuscola** vuol
   dire «qui c'è già» (la torre da copiare, il muro coi buchi).

   Dieci colori e non di più: bastano per un castello, una bandiera o una
   scacchiera, e un livello ne offre solo quelli che gli servono — una
   pulsantiera da telefono con dieci quadratini non la sceglie nessuno,
   li scorre.

   `tinta` è il colore pieno, `luce` e `ombra` gli spigoli del mattone:
   stanno qui e non nel pittore perché un mattone rosso deve restare lo
   stesso rosso nella pulsantiera, nella riga del programma e sul campo.
   ═══════════════════════════════════════════════════════════════════ */

export const COLORI = [
  { chiave: 'rosso',   lettera: 'r', nome: 'rosso',   tinta: '#d9482b', luce: '#f28163', ombra: '#9a2e17' },
  { chiave: 'arancio', lettera: 'a', nome: 'arancio', tinta: '#ef8a2c', luce: '#f8b366', ombra: '#a85a14' },
  { chiave: 'giallo',  lettera: 'g', nome: 'giallo',  tinta: '#f2c230', luce: '#fbe07a', ombra: '#b08a14' },
  { chiave: 'verde',   lettera: 'v', nome: 'verde',   tinta: '#4caf50', luce: '#86d189', ombra: '#2d7a31' },
  { chiave: 'blu',     lettera: 'b', nome: 'blu',     tinta: '#3a7bd5', luce: '#7aa9ea', ombra: '#23508f' },
  { chiave: 'viola',   lettera: 'l', nome: 'viola',   tinta: '#8e5cc2', luce: '#b692dc', ombra: '#5d3985' },
  { chiave: 'marrone', lettera: 'm', nome: 'marrone', tinta: '#8b5a2b', luce: '#b9854f', ombra: '#5c3a19' },
  { chiave: 'bianco',  lettera: 'w', nome: 'bianco',  tinta: '#ececec', luce: '#ffffff', ombra: '#b9b9b9' },
  { chiave: 'grigio',  lettera: 'k', nome: 'grigio',  tinta: '#8a8f98', luce: '#b4b8bf', ombra: '#5d6168' },
  /* il nero è arrivato con la scacchiera: col bianco fa il pavimento
     della sala da ballo */
  { chiave: 'nero',    lettera: 'n', nome: 'nero',    tinta: '#2f3036', luce: '#5a5b63', ombra: '#16171a' },
]

export const CHIAVI_COLORI = COLORI.map(c => c.chiave)

export const colore = chiave => COLORI.find(c => c.chiave === chiave) || null

/* lettera minuscola → chiave del colore: `r` → `rosso` */
export const COLORE_DI_LETTERA = Object.fromEntries(COLORI.map(c => [c.lettera, c.chiave]))

export function guastiDeiColori(colori = COLORI) {
  const guasti = []
  const lettere = new Set(), chiavi = new Set()
  for (const c of colori) {
    if (chiavi.has(c.chiave)) guasti.push(`colore «${c.chiave}» ripetuto`)
    chiavi.add(c.chiave)
    if (!/^[a-z]$/.test(c.lettera)) guasti.push(`colore «${c.chiave}»: la lettera deve essere una minuscola sola`)
    if (lettere.has(c.lettera)) guasti.push(`colore «${c.chiave}»: la lettera «${c.lettera}» è già presa`)
    lettere.add(c.lettera)
    for (const campo of ['tinta', 'luce', 'ombra'])
      if (!/^#[0-9a-f]{6}$/i.test(c[campo] || '')) guasti.push(`colore «${c.chiave}»: ${campo} non è un colore`)
  }
  return guasti
}
