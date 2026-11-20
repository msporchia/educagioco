/* Il codice della maestra (docs/scuola/ripieghi.md): quattro cifre che cambiano ogni cinque minuti, calcolate dall'ora
   dalle due pagine, anche senza rete, come i codici a tempo delle banche. Apre il menu della maestra sul PC del bambino e
   «Senza lezione». Ferma i bambini, non un adulto: il segreto è nel file pubblico, e nasconderlo non servirebbe. */
export const FINESTRA = 5 * 60 * 1000
// le finestre accettate attorno a quella del PC del bambino: la maestra lo legge, cammina, lo scrive
const PRIMA = 2, DOPO = 1
const SEGRETO = 'educagioco·scuola·la-maestra-apre'

// cyrb53: un mescolamento a 53 bit, puro e sincrono (crypto.subtle da file:// non c'è dappertutto)
function mescola(testo) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < testo.length; i++) {
    const c = testo.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

const finestra = ms => Math.floor(ms / FINESTRA)
const codiceDella = f => String(mescola(`${SEGRETO}:${f}`) % 10000).padStart(4, '0')

/* il codice valido all'istante `ms`, e quando cambia */
export const codiceAl = ms => codiceDella(finestra(ms))
export const cambiaAl = ms => (finestra(ms) + 1) * FINESTRA

/* il codice scritto sul PC del bambino, con l'ora di quel PC */
export function codiceGiusto(scritto, ms) {
  const c = String(scritto ?? '').replace(/\D/g, '')
  if (c.length !== 4) return false
  const f = finestra(ms)
  for (let d = -PRIMA; d <= DOPO; d++) if (codiceDella(f + d) === c) return true
  return false
}

/* dopo tre sbagli si aspetta un minuto: a tentativi quattro cifre non si indovinano */
export const SBAGLI = 3
export const ATTESA_SBAGLI = 60 * 1000
