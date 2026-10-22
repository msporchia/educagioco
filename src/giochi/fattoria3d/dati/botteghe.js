/* Le quattro botteghe del paese della fattoria 3D (giro G7 della parità, docs/fattoria3d/botteghe.md): pasticceria, osteria, mensa e
   merceria. Sono edifici unici come gli altri (si costruiscono dal menu e si mettono dove si vuole) ma non lavorano: ogni bottega ha il
   suo elenco chiuso di merci e i suoi clienti per mestiere, e chiede una merce sola a ogni bancone. TUTTI i numeri sono quelli della 2D
   (src/giochi/fattoria/dati/botteghe.js: pezzi 2–4, attesa 10–20 minuti, +25% del banco, cinque cuori per un bancone, fino a tre; prezzo e
   livello di ogni bottega dal catalogo 2D): qui si legge soltanto, mai si riscrive. Cambia solo il nome delle merci: la 3D chiama
   `carota` quel che la 2D chiama `carote` (`MERCE_3D`, `PRODOTTO_2D`), e i clienti sono quelli per mestiere della 2D (oste, pizzaiolo…).
   Foglia di catalogo.js (come cortile.js): importa solo dati della 2D e le tabelle delle merci, mai catalogo, livelli o ordini. */
import { POSTI as POSTI_2D, PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX, PIU_DEL_BANCO, premioInBottega } from '../../fattoria/dati/botteghe.js'
import { COLTURE } from './colture.js'
import { RICETTE } from './ricette.js'
import { PRODOTTI_ANIMALI, LANA } from './animali.js'
import { prezzoDa2D, livelloDa2D, coltura2d } from './parita2d.js'

export { PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX, PIU_DEL_BANCO, premioInBottega }

/** Il tipo 3D di ogni bottega → la voce del catalogo 2D (stessi id: la 3D prefissa `bottega_` perché `pasticceria` è già il Pastificio). */
export const SORELLA_2D = {
  bottega_pasticceria: 'pasticceria', bottega_osteria: 'osteria', bottega_mensa: 'mensa', bottega_merceria: 'merceria',
}
export const TIPI_DI_BOTTEGA = Object.keys(SORELLA_2D)
export const eBottega = tipo => Object.prototype.hasOwnProperty.call(SORELLA_2D, tipo)

/** Una merce della 3D → come la chiama la 2D (`carota` → `carote`, un prodotto → il suo `da`, tutto il resto uguale). */
export function prodotto2D(k) {
  if (COLTURE[k]) return coltura2d(k).da
  if (RICETTE[k]) return RICETTE[k].da || k
  return k
}
/** Il contrario: la merce 3D di un prodotto 2D, o null se la 3D non lo fa (la merenda e le caramelle non ci sono). La prima strada vince. */
const INVERSA = new Map()
for (const k of Object.keys(COLTURE)) INVERSA.set(prodotto2D(k), k)
for (const k of Object.keys(RICETTE)) if (!INVERSA.has(prodotto2D(k))) INVERSA.set(prodotto2D(k), k)
for (const k of [...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(LANA)]) if (!INVERSA.has(k)) INVERSA.set(k, k)
export const MERCE_3D = p2 => INVERSA.get(p2) || null

const posto2D = tipo => POSTI_2D.find(v => v.id === SORELLA_2D[tipo])

/** Ogni bottega 3D: il suo elenco (chiavi 3D, nell'ordine della 2D; le merci che la 3D non ha cadono) e i suoi clienti (id dei mestieri 2D). */
export const BOTTEGHE = Object.fromEntries(TIPI_DI_BOTTEGA.map(tipo => {
  const p = posto2D(tipo).posto
  return [tipo, { merci: p.chiede.map(MERCE_3D).filter(Boolean), chiede2D: p.chiede, clienti: p.clienti }]
}))

/** Le voci del catalogo (EDIFICI di catalogo.js): prezzo e livello dalla 2D, 3×3 come le macchine. `bottega: true` le distingue (niente ricette, niente posti). */
const E = (tipo, nome, emoji, art) => [tipo, {
  nome, emoji, art, w: 3, d: 3, prezzo: prezzoDa2D(tipo), liv: livelloDa2D(tipo), categoria: 'edifici', bottega: true,
}]
export const EDIFICI_BOTTEGHE = Object.fromEntries([
  E('bottega_pasticceria', 'Pasticceria', '🧁', 'la'),
  E('bottega_osteria', 'Osteria', '🍷', 'la'),
  E('bottega_mensa', 'Mensa della scuola', '🏫', 'la'),
  E('bottega_merceria', 'Merceria', '🧶', 'la'),
])
