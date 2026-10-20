/* Le carte del menu «Costruisci qui» (viste/CostruisciQui.vue): cosa si offre in ogni scheda, ordinato per livello, tutto dai dati
   (`PEZZI` e `EDIFICI` di catalogo.js, ognuno con la sua `categoria`). Puro: niente Vue, niente disegno; la vista le mostra, il
   coordinatore dice cosa farne. `DISEGNI` dice quale pezzo dell'atlante della fattoria di sempre (fattoria/dati/atlante.js) è il
   disegno di una carta; dove manca resta l'emoji, su una piastrella del colore della scheda. Vedi docs/fattoria3d/scena.md. */
import { PEZZI, EDIFICI, CATEGORIE } from './catalogo.js'
import { livelloDelPezzo } from './livelli.js'
import { COSTI } from './regole.js'

/** carta → pezzo dell'atlante 2D (gli id dei salvataggi restano: `pasticceria` è il Pastificio, `conserviera` la Cucina). Mancano passerella e trattore (e la strada e la gomma): lì c'è l'emoji. */
export const DISEGNI = {
  campo: 'campo_vuoto', recinto: 'recinto_pecore_calmo', pollaio: 'recinto_galline_calmo', stalla: 'recinto_mucche_calmo',
  bancarella: 'bancarella', bacheca: 'cartello', aiuola: 'fioriera_mista', panchina: 'panchina', fontana: 'fontana0', pozzo: 'pozzo_giardino0',
  spaventapasseri: 'spaventapasseri', ponte: 'ponte', tavolo: 'tavolo',
  pasticceria: 'pastificio', mongolfiera: 'mongolfiera', mulino: 'mulino_vento', panificio: 'panificio', caseificio: 'caseificio', conserviera: 'cucina', gelateria: 'gelateria',
  telaio: 'telaio', zuccherificio: 'zuccherificio', sartoria: 'sartoria', tintoria: 'tintoria',
}

/** Gli strumenti del pennello, nella scheda delle strade: non sono pezzi, scegliendoli si disegna col dito. */
export const STRUMENTI = {
  strada: { nome: 'Strada', emoji: '🛣️', nota: `🪙 ${COSTI.strada}/pezzo` },
  gomma:  { nome: 'Gomma',  emoji: '🧽', nota: 'gratis' },
}

/**
 * Le carte di una scheda. `stato`: { livello, prezzoPezzo(tipo), nelMagazzino(tipo), posseduti: { edificio: true } }.
 * Ogni carta: { id, genere: 'pezzo' | 'edificio' | 'strumento', nome, emoji, disegno, etichetta, liv, bloccata }. Un edificio già
 * comprato non si offre; i pezzi, anche quelli già nel magazzino (`📦 ×N`, si mettono senza pagare).
 */
export function carteDi(categoria, stato) {
  const carte = []
  for (const [id, p] of Object.entries(PEZZI)) {
    if (p.categoria !== categoria) continue
    const mag = stato.nelMagazzino(id), liv = livelloDelPezzo(id)
    carte.push({ id, genere: 'pezzo', nome: p.nome, emoji: p.emoji, disegno: DISEGNI[id] || null,
      etichetta: mag ? '📦 ×' + mag : '🪙 ' + stato.prezzoPezzo(id), liv, bloccata: liv > stato.livello })
  }
  for (const [id, e] of Object.entries(EDIFICI)) {
    if (e.categoria !== categoria || stato.posseduti[id]) continue
    carte.push({ id, genere: 'edificio', nome: e.nome, emoji: e.emoji, disegno: DISEGNI[id] || null,
      etichetta: '🪙 ' + e.prezzo, liv: e.liv, bloccata: e.liv > stato.livello })
  }
  carte.sort((a, b) => a.liv - b.liv || a.nome.localeCompare(b.nome, 'it'))
  if (CATEGORIE[categoria] && CATEGORIE[categoria].strumenti) {
    for (const [id, s] of Object.entries(STRUMENTI)) carte.push({ id, genere: 'strumento', nome: s.nome, emoji: s.emoji, disegno: null, etichetta: s.nota, liv: 1, bloccata: false })
  }
  return carte
}

/** Tutte le schede, nell'ordine di `CATEGORIE`: { campi: [carte], … }. */
export function schedeDi(stato) {
  return Object.fromEntries(Object.keys(CATEGORIE).map(c => [c, carteDi(c, stato)]))
}

export function guastiDelleCarte() {
  const g = []
  // il disegno d'atlante è dichiarato sulla carta e controllato dal test (l'atlante pesa: qui non si importa)
  for (const k of Object.keys(DISEGNI)) if (!PEZZI[k] && !EDIFICI[k]) g.push(`${k}: un disegno per una carta che non c'è`)
  return g
}
