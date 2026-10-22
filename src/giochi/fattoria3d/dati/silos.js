/* I silos della fattoria 3D: come nella 2D ogni merce ha il suo scomparto da 8 pezzi, e un ingrandimento ne aggiunge 2 a tutti gli scomparti
   di quel silo insieme (decisione D11 del 22/10/2026, docs/fattoria3d/parita/decisioni.md). Nella forma più piccola: i tre silos della 2D
   (raccolti, stalla, dispensa) qui sono tre magazzini che ci sono da subito, senza pezzi da comprare e da mettere in mappa; si ingrandiscono
   dall'inventario. Le misure e il prezzo dell'ingrandimento (`40 + 130·ln(1+n)`) sono quelli della 2D (dati/parita2d.js). Uno scomparto pieno non si
   riempie più: non si raccoglie e non si paga, il lavoro resta lì ad aspettare. Vedi docs/fattoria3d/livelli.md («Gli scomparti»). */
import { COLTURE } from './colture.js'
import { RICETTE } from './ricette.js'
import { LANA, PRODOTTI_ANIMALI } from './animali.js'
import { coltura2d, siloDelProdotto2D, postiPerMerce, costoDelPassoDelSilo, SCOMPARTO_BASE, SCOMPARTO_PIU } from './parita2d.js'

/** I tre silos: l'id è quello della 2D (`terra`, `stalla`, `bottega`). */
export const SILOS = {
  terra:   { nome: 'Magazzino dei raccolti', breve: 'Raccolti', emoji: '🌾' },
  stalla:  { nome: 'Magazzino della stalla', breve: 'Stalla', emoji: '🥛' },
  bottega: { nome: 'Dispensa', breve: 'Dispensa', emoji: '📦' },
}
export const TIPI_DI_SILO = Object.keys(SILOS)

/** In quale silo sta una merce (la chiave che sta in `merci`, `prodotti` o `lana`), o null se non è una merce. */
export function siloDi(k) {
  if (COLTURE[k]) return siloDelProdotto2D(coltura2d(k).da)
  if (LANA[k]) return 'stalla'
  if (RICETTE[k]) return siloDelProdotto2D(RICETTE[k].da || k)         // `da`: il prodotto, se non è l'id (due strade per lo stesso foraggio)
  if (PRODOTTI_ANIMALI[k]) return siloDelProdotto2D(k)
  return null
}

/** Le merci di un silo, nell'ordine di colture, bestie e ricette (per il foglio dell'inventario). */
export function merciDelSilo(silo) {
  return [...Object.keys(COLTURE), ...Object.keys(LANA), ...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(RICETTE)].filter((k, i, a) => a.indexOf(k) === i && !(RICETTE[k] && RICETTE[k].da) && siloDi(k) === silo)
}

export { postiPerMerce, SCOMPARTO_BASE, SCOMPARTO_PIU }
/** Il prezzo del prossimo ingrandimento di un silo già ingrandito `n` volte. */
export const prezzoDelPasso = n => costoDelPassoDelSilo(n)

export function guastiDeiSilos() {
  const g = []
  for (const k of [...Object.keys(COLTURE), ...Object.keys(LANA), ...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(RICETTE)]) {
    const s = siloDi(k)
    if (!s || !SILOS[s]) g.push(`${k}: non sta in nessun silo (${s})`)
  }
  for (const k of Object.keys(COLTURE)) if (siloDi(k) !== 'terra') g.push(`${k}: un raccolto sta nel silo della terra`)
  if (!(SCOMPARTO_BASE === 8 && SCOMPARTO_PIU === 2)) g.push('gli scomparti non sono 8 più 2 come in 2D')
  for (let n = 0; n < 6; n++) if (!(prezzoDelPasso(n + 1) > prezzoDelPasso(n))) g.push(`l'ingrandimento ${n + 2} non costa più del precedente`)
  for (const t of TIPI_DI_SILO) if (!merciDelSilo(t).length) g.push(`il silo ${t} non tiene niente`)
  return g
}
