/* Il banco, senza stato: come si compone un ordine e come si rimette in forma uno letto. Funzioni pure (il caso arriva da
   `rnd`, così i test lo tengono fermo). Chi tiene gli ordini aperti è la Fattoria3d. Vedi docs/fattoria3d/ordini.md. */
import { CLIENTI, clienteDi, CHIEDE_MAX, QUANTI_RACCOLTI, QUANTI_PRODOTTI, chiedibili, premioDi, livelloDelOrdine } from '../dati/ordini.js'
import { COLTURE } from '../dati/colture.js'
import { RICETTE } from '../dati/ricette.js'

const scegli = (v, rnd) => v[Math.min(v.length - 1, Math.floor(rnd() * v.length))]
const fra = ([a, b], rnd) => a + Math.min(b - a, Math.floor(rnd() * (b - a + 1)))

/** Un ordine nuovo adatto al livello: 1–3 cose diverse, tutte già fattibili. `clientiOccupati`: chi è già al banco. */
export function nuovoOrdine(livello, rnd, id, clientiOccupati = []) {
  const { raccolti, prodotti } = chiedibili(livello)
  const chiede = {}
  const quante = 1 + Math.min(CHIEDE_MAX - 1, Math.floor(rnd() * CHIEDE_MAX))
  for (let k = 0; k < quante; k++) {
    // coi prodotti a disposizione, uno slot su due ne chiede uno (la fatica delle macchine deve servire)
    const unProdotto = prodotti.length > 0 && rnd() < 0.5
    const lista = (unProdotto ? prodotti : raccolti).filter(x => !(x in chiede))
    if (!lista.length) continue
    const x = scegli(lista, rnd)
    chiede[x] = fra(unProdotto ? QUANTI_PRODOTTI : QUANTI_RACCOLTI, rnd)
  }
  if (!Object.keys(chiede).length) chiede[raccolti[0]] = 1
  const liberi = CLIENTI.filter(c => !clientiOccupati.includes(c.id))
  return { id, cliente: scegli(liberi.length ? liberi : CLIENTI, rnd).id, chiede, premio: premioDi(chiede), liv: livelloDelOrdine(chiede) }
}

/** Un ordine letto da un salvataggio, rimesso in forma; premio e livello si ricalcolano dai dati di oggi. Null se è da buttare. */
export function ordineInForma(o) {
  if (!o || typeof o !== 'object' || !o.chiede || typeof o.chiede !== 'object' || Array.isArray(o.chiede)) return null
  const chiede = {}
  for (const [k, n] of Object.entries(o.chiede)) {
    if ((COLTURE[k] || RICETTE[k]) && Number.isInteger(n) && n >= 1 && n <= 20) chiede[k] = n
  }
  if (!Object.keys(chiede).length) return null
  const cliente = typeof o.cliente === 'string' ? clienteDi(o.cliente).id : CLIENTI[0].id
  return { id: Number.isInteger(o.id) && o.id >= 1 ? o.id : 1, cliente, chiede, premio: premioDi(chiede), liv: livelloDelOrdine(chiede) }
}
