/* ═══════════════════════════════════════════════════════════════════
   GLI ANIMALI E IL LORO CIBO

   Tre gatti che si adottano una volta sola e un cibo che invece finisce.
   La sazietà cala da sola col passare delle ore — la stessa idea del
   decadimento nel motore di apprendimento — e cala anche a gioco chiuso:
   così tornare domani ha un motivo in più della classifica.

   Nessun gatto può ammalarsi, sparire o morire di fame: quando ha fame lo
   fa presente e basta. Un gioco per bambini non deve punire chi torna
   dopo una settimana, deve solo dargli qualcosa da fare quando torna.

   I numeri stanno tutti qui: costi, sazietà e velocità della fame si
   regolano in questo file e da nessun'altra parte.
   ═══════════════════════════════════════════════════════════════════ */

const ORA = 3600000

export const FAME = {
  costo:      30,    // monete per adottare un animale
  oreVuoto:    7,    // ore da ciotola piena a ciotola vuota
  inizio:     45,    // sazietà di un animale appena adottato: un po' di fame subito
  affamato:   30,    // sotto questa soglia chiede da mangiare
  sazio:      75,    // sopra questa fa le fusa
  preferito: 1.35,   // quanto rende di più il piatto preferito
}

/* sazietà 0..100 di un animale adesso: quella dell'ultimo pasto, meno le
   ore passate da allora. Fuori da Vue apposta, così è verificabile da solo. */
export function sazietaDi(p, now = Date.now()) {
  if (!p) return 0
  const ore = Math.max(0, now - (p.pasto || 0)) / ORA
  return Math.max(0, Math.min(100, (p.sat ?? 0) - ore * (100 / FAME.oreVuoto)))
}

/* Ogni gatto è disegnato, non è un'emoji: servono tre manti riconoscibili
   e le emoji dei gatti sono tre volte lo stesso gatto. I colori qui sotto
   finiscono dritti dentro PetSprite.vue. */
export const PETS = [
  {
    id: 'watson', nome: 'Watson', razza: 'bobtail',
    manto: '#f6efe2', pancia: '#ffffff', occhi: '#7ec8e3', coda: 'corta',
    macchie: [{ dove: 'testa', cx: 78, cy: 34, r: 15, c: '#b58c5c' },
              { dove: 'corpo', cx: 44, cy: 96, rx: 15, ry: 20, c: '#b58c5c' }],
    preferito: '🍗',
    descr: 'coda corta e appetito lungo',
  },
  {
    id: 'sherlock', nome: 'Sherlock', razza: 'tuxedo',
    manto: '#2d2d3a', pancia: '#ffffff', occhi: '#8fd06a', coda: 'lunga',
    macchie: [{ dove: 'testa', blaze: true, cx: 60, cy: 38, rx: 8, ry: 20, c: '#ffffff' }],
    preferito: '🍣',
    descr: 'in smoking, mangia solo cose raffinate',
  },
  {
    id: 'irene', nome: 'Irene', razza: 'arancione e nero',
    manto: '#e0872a', pancia: '#ffe7c9', occhi: '#f0b429', coda: 'lunga',
    macchie: [{ dove: 'testa', cx: 42, cy: 38, r: 16, c: '#33292b' },
              { dove: 'corpo', cx: 76, cy: 92, rx: 14, ry: 22, c: '#33292b' }],
    preferito: '🥩',
    descr: 'metà fuoco e metà notte',
  },
]

export const petDi = id => PETS.find(p => p.id === id) || null

/* Il cibo è l'unica cosa che si ricompra: costa poco e si consuma.
   Il sushi costa di più e sazia di più — e c'è chi lo preferisce. */
export const CIBI = [
  { e: '🍗', nome: 'Pollo',      costo: 2, sazia: 34, tipo: 'ciotola' },
  { e: '🥩', nome: 'Carne',      costo: 3, sazia: 50, tipo: 'ciotola' },
  { e: '🍣', nome: 'Nigiri',     costo: 3, sazia: 40, tipo: 'sushi' },
  { e: '🍥', nome: 'Narutomaki', costo: 2, sazia: 30, tipo: 'sushi' },
  { e: '🍤', nome: 'Gambero',    costo: 4, sazia: 46, tipo: 'sushi' },
  { e: '🐟', nome: 'Sashimi',    costo: 5, sazia: 62, tipo: 'sushi' },
]

export const ciboDi = e => CIBI.find(c => c.e === e) || null

export const REPARTI = [
  { tipo: 'ciotola', titolo: 'Nella ciotola' },
  { tipo: 'sushi',   titolo: 'Sushi' },
]

/* come sta, in una parola sola */
export function umore(sat) {
  if (sat >= FAME.sazio) return 'sazio'
  if (sat < FAME.affamato) return 'affamato'
  return 'normale'
}
