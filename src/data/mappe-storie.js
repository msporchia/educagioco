/* ═══════════════════════════════════════════════════════════════════
   LE MAPPE DELLE STORIE — raccolte da sole

   `data/storie-generale.js` dice cosa succede in un capitolo; la scena
   vera — griglia, unità, obiettivo, tre varianti — sta in un file suo
   dentro `data/livelli/`, uno per capitolo, e li scrivono altri.
   Questo file non li elenca a mano: li **raccoglie**, così un capitolo
   diventa giocabile il giorno in cui il suo file compare, senza che
   nessuno debba ricordarsi di aggiungere una riga da qualche parte.

   Il nome del file dice a chi appartiene: `fondi-1.js` è il primo
   capitolo della storia dei Fondi. Se il livello lo dice da sé — con
   `storia: 'fondi'` e `capitolo: 'magazzino'` oppure `capitolo: 0` —
   vince quello che dice il livello, che è più esplicito del nome.

   ⚠️ `import.meta.glob` è roba di Vite: questo file lo importano le
   viste, non i moduli che devono girare anche in Node.
   ═══════════════════════════════════════════════════════════════════ */
import { STORIA } from './storie-generale.js'

const MODULI = import.meta.glob('./livelli/*.js', { eager: true })

/* un modulo può esportare il livello come default o con un nome: si
   prende il primo oggetto che assomiglia a un livello (ha una griglia) */
function estrai (mod) {
  if (!mod || typeof mod !== 'object') return null
  const forse = [mod.default, mod.LIVELLO, mod.livello, ...Object.values(mod)]
  return forse.find(v => v && typeof v === 'object' && !Array.isArray(v) &&
                         (v.griglia || v.unita)) || null
}

/* Da quello che il livello dichiara all'indice vero. I capitoli si
   contano **da uno** dappertutto — nel nome del file (`fondi-1.js`) e
   nel campo `capitolo: 1` — perché è come li conta un bambino; qui
   dentro invece sono indici, e cominciano da zero. La conversione
   avviene in questo punto e in nessun altro. */
function indiceDi (storiaId, liv, daNome) {
  const capitoli = STORIA[storiaId]?.capitoli || []
  const perId = chiave => capitoli.findIndex(c => c.id === chiave)
  if (typeof liv.capitolo === 'string') {
    const i = perId(liv.capitolo)
    if (i >= 0) return i
  }
  if (Number.isInteger(liv.capitolo)) return liv.capitolo - 1
  /* niente numero: si prova con la chiave del livello, che spesso è
     quella del capitolo («pozzo») o quella col nome della storia
     davanti («fondi-magazzino») */
  if (typeof liv.id === 'string') {
    const i = Math.max(perId(liv.id), perId(liv.id.replace(storiaId + '-', '')))
    if (i >= 0) return i
  }
  return daNome
}

/* 'fondi/0' -> il livello */
const MAPPE = {}
const SPAIATE = []

for (const [via, mod] of Object.entries(MODULI)) {
  const liv = estrai(mod)
  const nome = via.split('/').pop().replace(/\.js$/, '')
  if (!liv) { SPAIATE.push(nome + ': non esporta nessun livello'); continue }
  const pezzi = /^(.+)-(\d+)$/.exec(nome)
  const storiaId = liv.storia || (pezzi ? pezzi[1] : null)
  if (!storiaId || !STORIA[storiaId]) { SPAIATE.push(nome + ': non si capisce di quale storia sia'); continue }
  const n = indiceDi(storiaId, liv, pezzi ? Number(pezzi[2]) - 1 : null)
  if (n == null || !STORIA[storiaId].capitoli[n]) { SPAIATE.push(nome + ': capitolo che non esiste'); continue }
  MAPPE[storiaId + '/' + n] = liv
}

/* la mappa di un capitolo, o `null` se non è ancora stata disegnata:
   è **la** domanda che fa la schermata dei capitoli, perché un capitolo
   senza mappa si vede e si legge ma non si gioca. */
export const mappaDi = (storiaId, n) => MAPPE[storiaId + '/' + n] || null
export const giocabile = (storiaId, n) => !!mappaDi(storiaId, n)
export const quanteMappe = storiaId =>
  Object.keys(MAPPE).filter(k => !storiaId || k.startsWith(storiaId + '/')).length
/* i file che non si è riusciti ad appaiare: si guardano in console
   quando un capitolo nuovo non compare */
export const mappeSpaiate = () => [...SPAIATE]
