// `misura` di motore/banco.js, su tutti i core: le partite sono indipendenti e ognuna parte da un
// seme suo, quindi si dividono in fette fra i lavoratori e i conteggi si sommano. Dà lo stesso esito
// del `misura` in fila (stessi semi). Serve a `npm run tara:arena`: la taratura gioca migliaia di
// partite da cinque minuti, e in fila usava un core solo su venti (docs/core/comandi.md).
import { Worker } from 'node:worker_threads'
import { availableParallelism } from 'node:os'

const LAVORATORE = new URL('./banco-lavoratore.mjs', import.meta.url)
let squadra = null
const lavoratori = () => squadra ||= Array.from({ length: Math.max(1, availableParallelism()) }, () => new Worker(LAVORATORE))

let coda = Promise.resolve()          // una misura per volta: usa già tutti i lavoratori

/* stessa firma di `misura`, ma torna una promessa */
export function misuraParallela(args = {}) {
  const fatta = coda.then(() => misuraSubito(args))
  coda = fatta.catch(() => {})
  return fatta
}

async function misuraSubito({ volte = 50, seme = 1, sfida = {}, pilota = {}, limite = Infinity }) {
  const ws = lavoratori()
  const fette = Math.min(ws.length, volte)
  const parti = await Promise.all(Array.from({ length: fette }, (_, k) => new Promise((ok, no) => {
    const w = ws[k]
    const finito = r => { w.off('error', fallito); ok(r) }
    const fallito = e => { w.off('message', finito); no(e) }
    w.once('message', finito); w.once('error', fallito)
    w.postMessage({ da: Math.floor(k * volte / fette), a: Math.floor((k + 1) * volte / fette), seme, sfida, pilota, limite })
  })))
  const r = { volte, vinte: 0, perse: 0, pari: 0, secondi: 0 }
  for (const p of parti) { r.vinte += p.vinte; r.perse += p.perse; r.pari += p.pari; r.secondi += p.secondi }
  r.secondi = +(r.secondi / volte).toFixed(0)
  return r
}

/* a lavoro finito i lavoratori si chiudono (se no il processo non esce) */
export function chiudiBanco() { for (const w of squadra || []) w.terminate(); squadra = null }
