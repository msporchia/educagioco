/* Il codice della maestra (docs/scuola/ripieghi.md): quattro cifre che cambiano ogni ora, calcolate dall'ora dalle due
   pagine, anche senza rete, come i codici a tempo delle banche. Apre il menu della maestra sul PC del bambino e «Senza
   lezione». Ferma i bambini, non un adulto: il segreto è nel file pubblico, e nasconderlo non servirebbe. */
export const FINESTRA = 60 * 60 * 1000
// le finestre accettate attorno a quella del PC del bambino: un codice letto vale almeno tre ore (la maestra se lo segna a
// inizio mattina), e un'ora prima per un orologio un po' indietro
const PRIMA = 3, DOPO = 1
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

/* il codice da leggere all'istante `ms`, e fino a quando il PC lo accetta */
export const codiceAl = ms => codiceDella(finestra(ms))
export const valeFinoAl = ms => (finestra(ms) + PRIMA + 1) * FINESTRA

/* il codice scritto sul PC del bambino, con l'ora di quel PC */
export function codiceGiusto(scritto, ms) {
  const c = String(scritto ?? '').replace(/\D/g, '')
  if (c.length !== 4) return false
  const f = finestra(ms)
  for (let d = -PRIMA; d <= DOPO; d++) if (codiceDella(f + d) === c) return true
  return false
}

/* dopo tre sbagli si aspetta, e ogni volta il doppio (un minuto, due, quattro… fino a mezz'ora): un codice che vale ore
   a tentativi non si indovina. Il conto resta a pagina riaperta (bambini/viste/CodiceMaestra.vue) */
export const SBAGLI = 3
export const ATTESA_SBAGLI = 60 * 1000
export const attesaDopo = giri => Math.min(30 * 60 * 1000, ATTESA_SBAGLI * 2 ** Math.max(0, giri - 1))
