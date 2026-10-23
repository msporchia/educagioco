/* Le carte del menu «Costruisci qui» (viste/CostruisciQui.vue): cosa si offre in ogni scheda, ordinato per livello, tutto dai dati
   (`PEZZI` e `EDIFICI` di catalogo.js, ognuno con la sua `categoria`). Puro: niente Vue, niente disegno; la vista le mostra, il
   coordinatore dice cosa farne. `DISEGNI` dice quale pezzo dell'atlante della fattoria di sempre (fattoria/dati/atlante.js) è il
   disegno di una carta; dove manca resta l'emoji, su una piastrella del colore della scheda. Vedi docs/fattoria3d/scena.md. */
import { PEZZI, EDIFICI, CATEGORIE } from './catalogo.js'
import { livelloDelPezzo } from './livelli.js'
import { COSTI } from './regole.js'

/** carta → pezzo dell'atlante 2D (gli id dei salvataggi restano: `pasticceria` è il Pastificio, `conserviera` la Cucina). Mancano passerella, trattore, stagno, laghetto, molo, molo girato e porticciolo (e la strada e la gomma): lì c'è l'emoji. */
export const DISEGNI = {
  campo: 'campo_vuoto', recinto: 'recinto_pecore_calmo', pollaio: 'recinto_galline_calmo', stalla: 'recinto_mucche_calmo',
  bancarella: 'bancarella', bacheca: 'cartello', aiuola: 'fioriera_mista', panchina: 'panchina', fontana: 'fontana0', pozzo: 'pozzo_giardino0',
  spaventapasseri: 'spaventapasseri', ponte: 'ponte', tavolo: 'tavolo',
  pasticceria: 'pastificio', mongolfiera: 'mongolfiera', mulino: 'mulino_vento', panificio: 'panificio', caseificio: 'caseificio', conserviera: 'cucina', gelateria: 'gelateria',
  telaio: 'telaio', zuccherificio: 'zuccherificio', sartoria: 'sartoria', tintoria: 'tintoria', friggitoria: 'friggitoria', sushi_bar: 'sushi_bar', fienile: 'fienile0',
  bottega_pasticceria: 'pasticceria', bottega_osteria: 'rosticceria', bottega_mensa: 'mensa', bottega_merceria: 'merceria',
  pentolone: 'pentolone', anatre: 'recinto_anatre_calmo', porcile: 'recinto_maiali_calmo', capre: 'recinto_capre_calmo',
  conigliera: 'recinto_conigli_calmo', alpaca: 'recinto_alpaca_calmo', asini: 'recinto_asini_calmo', arnie: 'recinto_api_calmo',
}

/** Gli strumenti del pennello, nella scheda delle strade: non sono pezzi, scegliendoli si disegna col dito. */
export const STRUMENTI = {
  strada: { nome: 'Strada', emoji: '🛣️', nota: `🪙 ${COSTI.strada}/pezzo` },
  gomma:  { nome: 'Gomma',  emoji: '🧽', nota: 'gratis' },
}

/**
 * Le carte di una scheda. `stato`: { livello, prezzoPezzo(tipo), nelMagazzino(tipo), posseduti: { edificio: true } }.
 * `stato.stagione`: la festa in corso (dati/stagioni3d.js) o niente: le carte con `stagione` si vedono solo allora.
 * Ogni carta: { id, genere: 'pezzo' | 'edificio' | 'strumento', nome, emoji, disegno, etichetta, liv, bloccata, segnala }. Un edificio già
 * in mappa non si offre (uno per tipo); i pezzi e gli edifici già nel magazzino sì (`📦 ×N`, si mettono senza pagare). `segnala` è il
 * «!»: un edificio che il livello ha aperto e non è ancora in mappa (mai per un pezzo, mai per una carta chiusa).
 */
export function carteDi(categoria, stato) {
  const carte = []
  for (const [id, p] of Object.entries(PEZZI)) {
    if (p.categoria !== categoria) continue
    const mag = stato.nelMagazzino(id), liv = livelloDelPezzo(id)
    if (p.fiera && !mag) continue                                              // la fiera non si compra: si vince dalla mongolfiera, e la carta c'è solo se ce l'hai
    if (p.stagione && p.stagione !== stato.stagione && !mag) continue          // una festa: si offre solo in stagione (ciò che è nel magazzino si rimette sempre)
    carte.push({ id, genere: 'pezzo', nome: p.nome, emoji: p.emoji, disegno: DISEGNI[id] || null,
      etichetta: mag ? '📦 ×' + mag : '🪙 ' + stato.prezzoPezzo(id), liv, bloccata: liv > stato.livello, segnala: false })
  }
  for (const [id, e] of Object.entries(EDIFICI)) {
    if (e.categoria !== categoria || stato.posseduti[id]) continue
    const mag = stato.nelMagazzino(id)
    carte.push({ id, genere: 'edificio', nome: e.nome, emoji: e.emoji, disegno: DISEGNI[id] || null,
      etichetta: mag ? '📦 ×' + mag : '🪙 ' + e.prezzo, liv: e.liv, bloccata: e.liv > stato.livello, segnala: e.liv <= stato.livello })
  }
  carte.sort((a, b) => (b.segnala ? 1 : 0) - (a.segnala ? 1 : 0) || a.liv - b.liv || a.nome.localeCompare(b.nome, 'it'))      // chi ha il «!» sta in cima
  if (CATEGORIE[categoria] && CATEGORIE[categoria].strumenti) {
    for (const [id, s] of Object.entries(STRUMENTI)) carte.push({ id, genere: 'strumento', nome: s.nome, emoji: s.emoji, disegno: null, etichetta: s.nota, liv: 1, bloccata: false })
  }
  return carte
}

/** Le schede che hanno una carta con il «!» (una scheda sola per ora: Edifici), per il pallino sulla linguetta e sul tasto 🏗️. */
export const schedeSegnalate = schede => Object.keys(schede).filter(c => schede[c].some(x => x.segnala))

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
