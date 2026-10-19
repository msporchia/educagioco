// Il palco di uno scontro di sopra (docs/sotterraneo/mondo-aperto-mostri.md, «Lo scontro»): un `Livello` di una stanza sola, un prato
// senza niente, con l'eroe a sinistra e il branco davanti a lui. Così lo scontro del mondo aperto è quello dei dungeon (motore/scontro.js,
// il campo da sette), giocato da una Corsa vera; la scena lo disegna sul terreno dove è successo. Il Livello lo chiama quando ha `palco`
// (motore/livello.js, scava e arreda); chi lo riempie è motore/aperta.js. Gira in Node.
import { ROCCIA, PAVIMENTO } from '../dati/mondo.js'

export const PALCO = { largo: 17, alto: 11 }
// dove sta l'eroe, e dove i mostri rispetto a lui: tutti entro RAGGIO_SCONTRO (4,5), il primo è chi ha aperto lo scontro
export const EROE_SUL_PALCO = { x: 6, y: 5 }
export const POSTI_SUL_PALCO = [[2, 0], [2, -1], [2, 1], [3, 0], [3, -1], [3, 1], [2, 2], [2, -2], [1, 2], [1, -2]]

export function scavaIlPalco(L) {
  const W = L.largo, H = L.alto
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dentro = x > 0 && y > 0 && x < W - 1 && y < H - 1
    L.celle[y * W + x] = dentro ? PAVIMENTO : ROCCIA
    if (dentro) L.nelle[y * W + x] = 0
  }
  L.stanze.push({ x: 1, y: 1, w: W - 2, h: H - 2, id: 0, vicine: [], porte: [], ruolo: 'ingresso', forma: 'prato', pezzi: [], suolo: [], interno: [],
                  colonne: [], nicchie: [], relitti: [], acqua: [], cx: EROE_SUL_PALCO.x, cy: EROE_SUL_PALCO.y, grande: true })
  L.segnaLeVicinanze()
}

// i mostri arrivano già fatti (le schede del mondo: motore/aperta.js): si mettono ai loro posti, nell'ordine
export function arredaIlPalco(L) {
  const { x, y } = EROE_SUL_PALCO
  ;(L.palco.campo || []).forEach((m, i) => {
    const [dx, dy] = POSTI_SUL_PALCO[i % POSTI_SUL_PALCO.length]
    L.robe.push({ ...structuredClone(m), x: x + dx, y: y + dy })
  })
  for (const c of L.palco.cose || []) L.robe.push({ ...structuredClone(c), x: x + 1, y })
}
