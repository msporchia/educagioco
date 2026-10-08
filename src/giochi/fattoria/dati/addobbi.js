/* Gli addobbi delle bestie (dato puro): dove si attaccano lo dice la scheda dell'animale (dati/animali.js).
   Sono emoji, per ora solo in testa e sul muso (collo e schiena sono sospesi) — vedi docs/fattoria/animali.md. */
import { AGGANCI_TUTTI, famigliaDi, portaDi } from './animali.js'

// dove è l'aggancio, misura in pixel dello sprite (non dello schermo, resta la stessa taglia a ogni zoom).
// per restringe a una famiglia; assente vuol dire a tutte.
export const ADDOBBI = [
  /* ── in testa ── */
  { id: 'fiore',      nome: 'Fiorellino',  emoji: '🌸', prezzo: 6,  dove: 'testa', misura: 8 },
  { id: 'cappellino', nome: 'Cappellino',  emoji: '🧢', prezzo: 12, dove: 'testa', misura: 10 },
  { id: 'cilindro',   nome: 'Cilindro',    emoji: '🎩', prezzo: 18, dove: 'testa', misura: 11 },
  { id: 'corona',     nome: 'Coroncina',   emoji: '👑', prezzo: 24, dove: 'testa', misura: 10 },
  // Della festa: in vendita solo a Halloween, ma chi l'ha comprato lo tiene. È disegnato in pixel
  // (scena/pixel-festa.js), e misura è la sua larghezza in pixel dello sprite.
  { id: 'cappello_strega', nome: 'Cappello da strega', disegno: 'cappello_strega', prezzo: 8,
    dove: 'testa', misura: 10, stagione: 'halloween' },
  // sul muso: di spalle non si vedono (l'aggancio muso non esiste nel verso "su").
  { id: 'occhialini', nome: 'Occhialini',  emoji: '👓', prezzo: 10, dove: 'muso', misura: 9 },
  { id: 'occhiali',   nome: 'Occhiali da sole', emoji: '🕶️', prezzo: 16, dove: 'muso', misura: 9 },
  // al collo — sospesi (le emoji non stanno su una bestia a quattro zampe, si rifanno come sprite)
  { id: 'fiocco',     nome: 'Fiocco',      emoji: '🎀', prezzo: 8,  dove: 'collo', misura: 9,
    sospeso: true },
  { id: 'sciarpa',    nome: 'Sciarpa',     emoji: '🧣', prezzo: 14, dove: 'collo', misura: 10,
    sospeso: true },
  // La campanella è dei gatti: l'unica riga che si restringe a una famiglia.
  { id: 'campanella', nome: 'Campanella',  emoji: '🔔', prezzo: 10, dove: 'collo',
    misura: 8, per: ['gatto'], sospeso: true },
  // sulla schiena — sospesi, come il collo. Il pappagallo non ce l'ha (porta): ha le ali.
  { id: 'mantellina', nome: 'Mantellina',  emoji: '🧥', prezzo: 20, dove: 'schiena', misura: 11,
    sospeso: true },
  { id: 'zainetto',   nome: 'Zainetto',    emoji: '🎒', prezzo: 22, dove: 'schiena', misura: 10,
    sospeso: true },
  // Il maglione della sartoria era qui (stesso guasto): adesso è una merce, la vuole la sarta.
]

export const PER_ID = Object.fromEntries(ADDOBBI.map(a => [a.id, a]))
export const addobbo = id => PER_ID[id] || null

// Quelli comprabili oggi: il catalogo intero serve a chi rilegge un salvataggio.
export const IN_VENDITA = ADDOBBI.filter(a => !a.sospeso)
export const inVendita = id => !!PER_ID[id] && !PER_ID[id].sospeso

// Due domande separate: la famiglia (gusto, qui) e l'aggancio (un fatto del disegno, in dati/animali.js).
export function staA(id, chi) {
  const a = PER_ID[id]
  if (!a || !chi) return false
  if (a.per && !a.per.includes(famigliaDi(chi))) return false
  return portaDi(chi).includes(a.dove)
}

// Ordinati per aggancio poi prezzo; tieni mostra i sospesi già comprati (un fiocco pagato ieri resta un
// tasto), e così quelli di una festa finita. Quelli della festa di oggi vengono per primi.
export const addobbiPer = (chi, tieni = [], stagione = '') =>
  ADDOBBI.filter(a => staA(a.id, chi) && (!a.sospeso || tieni.includes(a.id)) &&
                      (!a.stagione || a.stagione === stagione || tieni.includes(a.id)))
    .slice()
    .sort((x, y) => AGGANCI_TUTTI.indexOf(x.dove) - AGGANCI_TUTTI.indexOf(y.dove) ||
                    !!y.stagione - !!x.stagione || x.prezzo - y.prezzo)

// La figura e la taglia, non il nome dell'aggancio: dove cade il punto lo mette chi conosce l'animale.
export function addossoA(portati = {}) {
  const fuori = []
  for (const dove of AGGANCI_TUTTI) {
    const a = PER_ID[portati[dove]]
    if (a) fuori.push({ id: a.id, dove, testo: a.emoji, disegno: a.disegno, misura: a.misura })
  }
  return fuori
}

export function guastiDegliAddobbi() {
  const g = []
  const visti = new Set()
  for (const a of ADDOBBI) {
    if (visti.has(a.id)) g.push(`id doppio fra gli addobbi: ${a.id}`)
    visti.add(a.id)
    if (!a.nome) g.push(`${a.id}: senza nome`)
    if (!a.emoji && !a.pezzo && !a.disegno) g.push(`${a.id}: non si sa come disegnarlo`)
    if (!AGGANCI_TUTTI.includes(a.dove))
      g.push(`${a.id}: l'aggancio «${a.dove}» non esiste`)
    if (!(a.misura > 0)) g.push(`${a.id}: misura impossibile`)
    // La fascia "una cosetta": un cappello fuori scala non lo compra nessuno, o si smette di costruire per comprarlo.
    if (!(a.prezzo >= 6 && a.prezzo <= 30))
      g.push(`${a.id}: 🪙${a.prezzo} è fuori dalla fascia di una cosetta (6–30)`)
  }
  // Ogni aggancio deve avere qualcosa da metterci, anche sospeso.
  for (const dove of AGGANCI_TUTTI)
    if (!ADDOBBI.some(a => a.dove === dove))
      g.push(`sull'aggancio «${dove}» non si può mettere niente`)
  // Ma un negozio vuoto sì: sospendere tutto è togliere il vestiario senza dirlo.
  if (!IN_VENDITA.length) g.push("non c'è nessun addobbo in vendita")
  return g
}
