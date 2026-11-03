/* Dentro la casa (docs/fattoria3d/casa.md): le stanze, i mobili, i colori e le trame, le finiture di pavimento e pareti. Dato puro, senza
   three: lo leggono il motore (motore/interni.js), la scena (scena3d/casa3d.js) e il foglio (viste/Casa.vue). Gli id non si rinominano:
   sono nel salvataggio (`stato.interni`). Un id che non c'è più si butta alla rilettura, quindi un mobile non si toglie dall'elenco. */

// ── la pianta: sei stanze su due file, con un muro di una cella fra l'una e l'altra ──
export const STANZA = { w: 6, d: 5 }                  // le celle dentro una stanza
export const COLONNE = 3, RIGHE = 2
/** Le sei stanze: `c` la colonna (da ovest), `r` la riga (0 dietro, 1 davanti). La 0 è quella con la porta di casa e c'è sempre. */
export const STANZE = [
  { id: 0, c: 1, r: 1 }, { id: 1, c: 0, r: 1 }, { id: 2, c: 2, r: 1 },
  { id: 3, c: 1, r: 0 }, { id: 4, c: 0, r: 0 }, { id: 5, c: 2, r: 0 },
]
export const MAX_STANZE = STANZE.length
/** Quanto costa la stanza numero n (contando quelle già tue): la seconda 60, la sesta 360 («una struttura», docs/apprendimento/calibrazione.md). */
export const PREZZI_STANZE = [0, 60, 120, 180, 260, 360]
export const prezzoDellaStanza = quante => PREZZI_STANZE[Math.max(0, Math.min(PREZZI_STANZE.length - 1, quante))]

/** Le celle dentro una stanza: dalla `i0, j0` (angolo a nord-ovest) per `STANZA.w × STANZA.d`. Fra due stanze c'è una riga di muro. */
export const origine = s => ({ i0: 1 + s.c * (STANZA.w + 1), j0: 1 + s.r * (STANZA.d + 1) })
export const LARGHEZZA = 1 + COLONNE * (STANZA.w + 1), PROFONDITA = 1 + RIGHE * (STANZA.d + 1)
export const stanzaDi = (i, j) => STANZE.find(s => { const { i0, j0 } = origine(s); return i >= i0 && i < i0 + STANZA.w && j >= j0 && j < j0 + STANZA.d }) || null
export const confinano = (a, b) => Math.abs(a.c - b.c) + Math.abs(a.r - b.r) === 1

/** La porta fra due stanze che confinano: la cella del muro in mezzo. */
export function portaFra(a, b) {
  const A = origine(a), B = origine(b)
  if (a.r === b.r) return { i: Math.max(A.i0, B.i0) - 1, j: A.j0 + 2 }
  return { i: A.i0 + 3, j: Math.max(A.j0, B.j0) - 1 }
}
/** La porta di casa: nel muro davanti della stanza 0. Fuori da lì si esce. */
export const PORTA_DI_CASA = (() => { const { i0, j0 } = origine(STANZE[0]); return { i: i0 + 3, j: j0 + STANZA.d } })()
/** Dove compare il contadino entrando: la prima cella dentro la porta. */
export const INGRESSO = { i: PORTA_DI_CASA.i, j: PORTA_DI_CASA.j - 1 }

/** Le celle davanti a ogni porta possibile di una stanza (anche verso una stanza non ancora tua): restano libere, se no non si passa. */
export function soglieDi(s) {
  const out = []
  for (const t of STANZE) if (t !== s && confinano(s, t)) {
    const p = portaFra(s, t), { i0, j0 } = origine(s)
    out.push([Math.min(Math.max(p.i, i0), i0 + STANZA.w - 1), Math.min(Math.max(p.j, j0), j0 + STANZA.d - 1)])
  }
  if (s.id === 0) out.push([INGRESSO.i, INGRESSO.j])
  return out
}

// ── i colori e le trame ──
// `stoffa`: divani, letti, tappeti (anche la trama); `legno`: tavoli, armadi, scaffali; `vernice`: le cose di casa dipinte o smaltate
export const COLORI = {
  stoffa: [
    { id: 'rosso', nome: 'Rosso', c: '#d9534f' }, { id: 'arancio', nome: 'Arancio', c: '#ef8a3c' }, { id: 'giallo', nome: 'Giallo', c: '#f2c94c' },
    { id: 'verde', nome: 'Verde', c: '#6fbf73' }, { id: 'azzurro', nome: 'Azzurro', c: '#63b3ed' }, { id: 'blu', nome: 'Blu', c: '#3f6fd1' },
    { id: 'viola', nome: 'Viola', c: '#9b6fd1' }, { id: 'rosa', nome: 'Rosa', c: '#f29ac0' }, { id: 'bianco', nome: 'Bianco', c: '#f3efe6' },
    { id: 'grigio', nome: 'Grigio', c: '#9aa0a6' }, { id: 'marrone', nome: 'Marrone', c: '#8a5a3b' },
  ],
  legno: [
    { id: 'chiaro', nome: 'Chiaro', c: '#d8b07a' }, { id: 'miele', nome: 'Miele', c: '#c08a4a' }, { id: 'noce', nome: 'Noce', c: '#8a5a33' },
    { id: 'scuro', nome: 'Scuro', c: '#5a3a22' }, { id: 'bianco', nome: 'Bianco', c: '#efe9df' }, { id: 'azzurro', nome: 'Azzurro', c: '#8fc3e0' },
    { id: 'verde', nome: 'Verde', c: '#9cc79a' }, { id: 'rosa', nome: 'Rosa', c: '#f0b6c8' }, { id: 'rosso', nome: 'Rosso', c: '#c9564a' },
  ],
  vernice: [
    { id: 'bianco', nome: 'Bianco', c: '#f4f4f0' }, { id: 'crema', nome: 'Crema', c: '#f1e3c4' }, { id: 'azzurro', nome: 'Azzurro', c: '#8cc8ea' },
    { id: 'verde', nome: 'Verde', c: '#8fd19e' }, { id: 'rosa', nome: 'Rosa', c: '#f5a9c4' }, { id: 'giallo', nome: 'Giallo', c: '#f6d36b' },
    { id: 'rosso', nome: 'Rosso', c: '#e0574f' }, { id: 'nero', nome: 'Nero', c: '#3b3b40' },
  ],
}
export const TRAME = [
  { id: 'unita', nome: 'Tinta unita' }, { id: 'righe', nome: 'A righe' }, { id: 'quadri', nome: 'A quadri' }, { id: 'pois', nome: 'A pois' },
  { id: 'fiori', nome: 'A fiori' }, { id: 'cuori', nome: 'A cuori' }, { id: 'stelle', nome: 'A stelle' },
]
export const coloreDi = (materiale, id) => (COLORI[materiale] || []).find(x => x.id === id) || null
export const tramaDi = id => TRAME.find(t => t.id === id) || null

// ── le finiture di una stanza: il pavimento, il colore delle pareti e la carta ──
export const PAVIMENTI = [
  { id: 'parquet', nome: 'Parquet', c: '#c89a62', motivo: 'assi' }, { id: 'parquet-scuro', nome: 'Parquet scuro', c: '#7d5435', motivo: 'assi' },
  { id: 'piastrelle', nome: 'Piastrelle', c: '#ece8e0', motivo: 'piastrelle' }, { id: 'scacchi', nome: 'A scacchi', c: '#ece8e0', motivo: 'scacchi' },
  { id: 'cotto', nome: 'Cotto', c: '#c46a45', motivo: 'piastrelle' }, { id: 'moquette-azzurra', nome: 'Moquette azzurra', c: '#8db9dd', motivo: 'liscio' },
  { id: 'moquette-rosa', nome: 'Moquette rosa', c: '#e8a8c0', motivo: 'liscio' }, { id: 'moquette-verde', nome: 'Moquette verde', c: '#9fc98f', motivo: 'liscio' },
]
export const PARETI = [
  { id: 'crema', nome: 'Crema', c: '#f2e6cf' }, { id: 'bianco', nome: 'Bianco', c: '#f6f4ef' }, { id: 'azzurro', nome: 'Azzurro', c: '#bcdcf0' },
  { id: 'rosa', nome: 'Rosa', c: '#f5cdd8' }, { id: 'menta', nome: 'Menta', c: '#c6ead2' }, { id: 'lilla', nome: 'Lilla', c: '#d9cdf0' },
  { id: 'giallo', nome: 'Giallo', c: '#f6e7a6' }, { id: 'pesca', nome: 'Pesca', c: '#f7cfae' },
]
/** La carta da parati: le stesse trame dei tessuti, tranne i quadri (su un muro sembrano piastrelle). */
export const CARTE = TRAME.filter(t => t.id !== 'quadri')
export const FINITURA_DI_SERIE = Object.freeze({ pavimento: 'parquet', pareti: 'crema', carta: 'unita' })

// ── i mobili ──
// `strato`: `pavimento` (occupa le celle), `tappeto` (sta sotto i mobili, ma un tappeto non va su un altro), `muro` (appeso alla parete di
// fondo: solo la prima fila di celle della stanza, e non occupa il pavimento). `tinte`: il materiale che si colora; `trame`: se si sceglie anche
// la trama. `scheda`: dove sta nel catalogo. Prezzi nella fascia «una cosetta» (6–30).
const M = (id, nome, scheda, w, d, prezzo, tinte, extra = {}) => ({ id, nome, scheda, w, d, prezzo, tinte, strato: 'pavimento', trame: tinte === 'stoffa', ...extra })
export const MOBILI = Object.fromEntries([
  M('armadio', 'Armadio', 'camera', 2, 1, 0, 'legno', { diSerie: true, colore: 'noce' }),
  M('divano', 'Divano', 'soggiorno', 3, 1, 26, 'stoffa', { colore: 'blu' }),
  M('poltrona', 'Poltrona', 'soggiorno', 1, 1, 14, 'stoffa', { colore: 'rosso' }),
  M('pouf', 'Pouf', 'soggiorno', 1, 1, 8, 'stoffa', { colore: 'arancio', trame: true }),
  M('tavolino', 'Tavolino', 'soggiorno', 2, 1, 10, 'legno', { colore: 'miele' }),
  M('libreria', 'Libreria', 'soggiorno', 2, 1, 18, 'legno', { colore: 'noce' }),
  M('camino', 'Camino', 'soggiorno', 2, 1, 30, 'vernice', { colore: 'crema' }),
  M('tv', 'Televisore', 'soggiorno', 2, 1, 24, 'legno', { colore: 'scuro' }),
  M('lampada', 'Lampada', 'soggiorno', 1, 1, 9, 'vernice', { colore: 'giallo' }),
  M('pianta', 'Pianta', 'soggiorno', 1, 1, 8, 'vernice', { colore: 'bianco' }),
  M('tavolo', 'Tavolo', 'cucina', 2, 2, 16, 'legno', { colore: 'chiaro' }),
  M('sedia', 'Sedia', 'cucina', 1, 1, 6, 'legno', { colore: 'miele' }),
  M('fornelli', 'Cucina col forno', 'cucina', 2, 1, 22, 'vernice', { colore: 'bianco' }),
  M('frigo', 'Frigorifero', 'cucina', 1, 1, 20, 'vernice', { colore: 'azzurro' }),
  M('credenza', 'Credenza', 'cucina', 2, 1, 16, 'legno', { colore: 'verde' }),
  M('lavello', 'Lavello', 'cucina', 1, 1, 12, 'vernice', { colore: 'bianco' }),
  M('letto', 'Letto', 'camera', 2, 3, 30, 'stoffa', { colore: 'rosa' }),
  M('comodino', 'Comodino', 'camera', 1, 1, 8, 'legno', { colore: 'bianco' }),
  M('cassettiera', 'Cassettiera', 'camera', 2, 1, 14, 'legno', { colore: 'rosa' }),
  M('scrivania', 'Scrivania', 'camera', 2, 1, 16, 'legno', { colore: 'chiaro' }),
  M('giochi', 'Cesta dei giochi', 'camera', 1, 1, 10, 'legno', { colore: 'azzurro' }),
  M('orsetto', 'Orsetto', 'camera', 1, 1, 8, 'stoffa', { colore: 'marrone', trame: false }),
  M('cuccia', 'Cuccia', 'camera', 1, 1, 12, 'stoffa', { colore: 'rosso' }),
  M('tiragraffi', 'Tiragraffi', 'camera', 1, 1, 10, 'stoffa', { colore: 'grigio', trame: false }),
  M('vasca', 'Vasca da bagno', 'bagno', 2, 1, 26, 'vernice', { colore: 'bianco' }),
  M('lavandino', 'Lavandino', 'bagno', 1, 1, 12, 'vernice', { colore: 'bianco' }),
  M('wc', 'Gabinetto', 'bagno', 1, 1, 12, 'vernice', { colore: 'bianco' }),
  M('cesto', 'Cesto della biancheria', 'bagno', 1, 1, 6, 'legno', { colore: 'chiaro' }),
  M('tappeto', 'Tappeto', 'tappeti', 3, 2, 12, 'stoffa', { strato: 'tappeto', colore: 'rosso', trama: 'righe' }),
  M('tappeto-tondo', 'Tappeto tondo', 'tappeti', 2, 2, 10, 'stoffa', { strato: 'tappeto', colore: 'azzurro', trama: 'pois' }),
  M('tappetino', 'Tappetino', 'tappeti', 2, 1, 6, 'stoffa', { strato: 'tappeto', colore: 'verde' }),
  M('quadro', 'Quadro', 'muro', 1, 1, 10, 'legno', { strato: 'muro', colore: 'miele' }),
  M('finestra', 'Finestra', 'muro', 1, 1, 14, 'stoffa', { strato: 'muro', colore: 'rosa', trame: true }),
  M('orologio', 'Orologio', 'muro', 1, 1, 9, 'vernice', { strato: 'muro', colore: 'rosso' }),
  M('specchio', 'Specchio', 'muro', 1, 1, 12, 'legno', { strato: 'muro', colore: 'bianco' }),
  M('mensola', 'Mensola', 'muro', 2, 1, 8, 'legno', { strato: 'muro', colore: 'noce' }),
].map(m => [m.id, m]))
export const SCHEDE_MOBILI = [
  { id: 'soggiorno', nome: 'Soggiorno' }, { id: 'cucina', nome: 'Cucina' }, { id: 'camera', nome: 'Camera' },
  { id: 'bagno', nome: 'Bagno' }, { id: 'tappeti', nome: 'Tappeti' }, { id: 'muro', nome: 'Pareti' },
]
/** L'armadio di serie: c'è sempre (si sposta, si colora, non si mette via) e toccarlo apre il guardaroba. */
export const ARMADIO = 'armadio'
export const POSTO_ARMADIO = (() => { const { i0, j0 } = origine(STANZE[0]); return { i: i0, j: j0, rot: 0 } })()

/** Il colore e la trama di serie di un mobile; una scelta che non va per quel mobile torna quella di serie. */
export function tintaInForma(tipo, colore, trama) {
  const m = MOBILI[tipo]; if (!m) return { colore: null, trama: null }
  const col = coloreDi(m.tinte, colore) ? colore : (m.colore || COLORI[m.tinte][0].id)
  const tr = m.trame ? (tramaDi(trama) ? trama : (m.trama || 'unita')) : null
  return { colore: col, trama: tr }
}
/** Le misure di un mobile girato: `rot` 1 e 3 scambiano larghezza e profondità. Le cose appese non si girano. */
export function misureMobile(tipo, rot = 0) {
  const m = MOBILI[tipo]; if (!m) return null
  return m.strato !== 'muro' && rot % 2 ? { w: m.d, d: m.w } : { w: m.w, d: m.d }
}
/** Si gira tutto quello che sta per terra (anche una sedia 1×1: guarda da un'altra parte); le cose appese no. */
export const ruotabileMobile = tipo => !!MOBILI[tipo] && MOBILI[tipo].strato !== 'muro'

/** Gli errori dei dati: un test li tiene a zero (unita/fattoria3d-casa). */
export function guastiDegliInterni() {
  const g = []
  for (const m of Object.values(MOBILI)) {
    if (!COLORI[m.tinte]) g.push(`${m.id}: il materiale «${m.tinte}» non c'è`)
    if (!coloreDi(m.tinte, m.colore)) g.push(`${m.id}: il colore di serie «${m.colore}» non è fra quelli del ${m.tinte}`)
    if (m.trama && !tramaDi(m.trama)) g.push(`${m.id}: la trama di serie «${m.trama}» non c'è`)
    if (!m.diSerie && !(m.prezzo >= 6 && m.prezzo <= 30)) g.push(`${m.id}: il prezzo ${m.prezzo} è fuori dalla fascia 6–30`)
    if (!SCHEDE_MOBILI.some(s => s.id === m.scheda)) g.push(`${m.id}: la scheda «${m.scheda}» non c'è`)
    if (m.strato === 'muro' && m.d !== 1) g.push(`${m.id}: una cosa appesa è profonda una cella`)
    if (Math.max(m.w, m.d) > Math.min(STANZA.w, STANZA.d)) g.push(`${m.id}: non entra in una stanza`)
  }
  for (let n = 1; n < PREZZI_STANZE.length; n++) if (!(PREZZI_STANZE[n] > PREZZI_STANZE[n - 1])) g.push(`la stanza ${n + 1} non costa più della ${n}`)
  if (PREZZI_STANZE.length !== MAX_STANZE) g.push('un prezzo per ogni stanza')
  if (PREZZI_STANZE[MAX_STANZE - 1] > 360) g.push('l\'ultima stanza sopra la fascia di una struttura')
  return g
}
