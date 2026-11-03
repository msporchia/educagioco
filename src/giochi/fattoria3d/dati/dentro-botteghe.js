/* Dentro una bottega del paese (docs/fattoria3d/botteghe.md, «Dentro»): la sala, dove stanno il bancone e i tavolini, dove aspetta ogni
   cliente, e l'aspetto della sala per bottega. Dato puro, senza three: lo leggono la scena (scena3d/bottega3d.js) e i test. Le regole dei
   clienti restano quelle di motore/botteghe.js: qui si decide solo dove si vedono. */
import { CATEGORIE, opzioniDi, normalizzaAbito } from './abiti.js'

export const SALA = { i0: 1, j0: 1, w: 9, d: 6 }                    // le celle dentro la sala
export const PORTA = { i: SALA.i0 + 4, j: SALA.j0 + SALA.d }          // nel muro davanti, in mezzo
export const INGRESSO_SALA = { i: PORTA.i, j: PORTA.j - 1 }
export const FILA_BANCONE = SALA.j0                                   // il bancone occupa la prima fila, contro la parete di fondo
/** Un posto per bancone (fino a tre): il tavolino, dove aspetta il cliente (dietro il tavolino, guarda la camera) e da dove lo si serve. */
export const POSTI = [0, 1, 2].map(k => {
  const i = SALA.i0 + 1 + 3 * k
  return { k, tavolo: { i, j: SALA.j0 + 3 }, cliente: { i, j: SALA.j0 + 2 }, servi: { i, j: SALA.j0 + 4 } }
})

/** Si cammina dentro la sala, tranne sul bancone e sui tavolini, e sulla porta (da lì si esce). */
export function calpestabileInSala(i, j) {
  if (i === PORTA.i && j === PORTA.j) return true
  if (i < SALA.i0 || i >= SALA.i0 + SALA.w || j < SALA.j0 || j >= SALA.j0 + SALA.d) return false
  if (j === FILA_BANCONE && i > SALA.i0 && i < SALA.i0 + SALA.w - 1) return false
  return !POSTI.some(p => p.tavolo.i === i && p.tavolo.j === j)
}

/** Com'è ogni sala: le pareti, il pavimento (`{ c, motivo }` come PAVIMENTI), il legno del bancone e cosa c'è sopra. */
export const TEMI = {
  bottega_pasticceria: { pareti: '#f5cdd8', carta: 'righe', pavimento: { c: '#f2e8ec', motivo: 'scacchi' }, bancone: '#c2788f', merce: 'torte' },
  bottega_osteria: { pareti: '#ead6b4', carta: 'unita', pavimento: { c: '#c46a45', motivo: 'piastrelle' }, bancone: '#7a4f2c', merce: 'botti' },
  bottega_mensa: { pareti: '#f6e7a6', carta: 'unita', pavimento: { c: '#cfe3f2', motivo: 'piastrelle' }, bancone: '#4f8fc8', merce: 'vassoi' },
  bottega_merceria: { pareti: '#d9cdf0', carta: 'pois', pavimento: { c: '#c89a62', motivo: 'assi' }, bancone: '#8a68b8', merce: 'bobine' },
}

// un numero da una parola, sempre lo stesso: il cliente numero 7 della pasticceria ha sempre la stessa faccia
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
/** L'abito di un cliente: lei o lui dal nome del mestiere («La pasticcera», «Il cuoco»), il resto pescato dal numero del cliente fra i capi
    gratis (niente festa, livello o capelli di fantasia). Cliente diverso, persona diversa; lo stesso cliente, sempre uguale. */
export function abitoDelCliente(mestiere, id) {
  const persona = /^la\s/i.test(String(mestiere || '').trim()) ? 'contadina' : 'contadino'
  const capi = {}
  CATEGORIE.forEach((c, n) => {
    const scelte = opzioniDi(c, persona).filter(o => !o.liv && !o.stagione && !o.prezzo)
    if (scelte.length) capi[c] = scelte[hash(`${mestiere}:${id}:${n}`) % scelte.length].id
  })
  if (persona === 'contadina') capi.barba = 'nessuna'
  return { ...normalizzaAbito(capi, persona), persona }
}
