/* ═══════════════════════════════════════════════════════════════════
   I PATTERN — le tessiture, chiamate con i loro colori

   ── perché non basta un nome ──
   Prima un ambiente diceva `muratura: 'mattoni'` e i colori li pescava
   da un dizionario suo (`A.muro`, `A.lastra`). Due conseguenze, tutte
   e due sbagliate: **una stanza aveva una tinta sola per famiglia** —
   non si potevano avere due murature di mattoni di due colori — e il
   legame fra la tessitura e il suo colore era implicito, scritto in
   due punti lontani del file.

   Qui una tessitura è una **chiamata**, e si porta dietro tutto:

       mattoni('#8f6146', '#5c3a29')
       roccia('#5f5148', '#332a25', { dove: 'umido', quanto: 0.17 })
       mattoni('#7d5540', '#4e3226', { modo: 'rotto', quanto: 0.12 })

   Da qui viene la varietà a buon mercato: **la stessa tessitura con
   due colori vicini sono due voci**, e due voci si mescolano. Non
   serve un pittore nuovo per avere un muro meno monotono, serve una
   riga in più.

   ── una lista, non un caso speciale ──
   Un ambiente dichiara `mura: [...]` e `suolo: [...]`. **La prima voce
   è il fondo**; quelle dopo si prendono una fetta di superficie
   (`quanto`) dove dice il loro campo (`dove`), e si applicano
   nell'ordine — l'ultima che cade è quella che si vede. Aggiungere o
   togliere una variante è aggiungere o togliere una riga, e non esiste
   più «l'anomalia», al singolare, decisa dal motore.

   ── e i modi stanno dentro il pittore ──
   Un disturbo non è uno strato di vernice steso da fuori: **è la
   tessitura che si sa fare in più modi**. Un muro di mattoni sa venire
   nuovo, vecchio o mezzo caduto, e quei modi li conosce lui — chi lo
   chiama dice `modo: 'rotto'` e basta. Quando i modi non bastano, la
   risposta è un pittore nuovo, non un velo sopra: così ogni tessitura
   resta guardabile e provabile **da sola**, e il catalogo
   (`strumenti/banco/catalogo.html`) le stampa tutte con i loro modi.

   Aggiungere una tessitura è un file in `materiali/` più una riga nel
   registro: le fabbriche qui sotto si generano dai registri, quindi
   non c'è un secondo elenco da tenere allineato.
   ═══════════════════════════════════════════════════════════════════ */
import { POSE, MURI } from './indice.js'

/* Una fabbrica accetta, in quest'ordine e tutti facoltativi: i colori
   (stringhe) e le opzioni (oggetto). Così `mattoni()`, `mattoni('#a')`,
   `mattoni('#a', '#b')` e `mattoni('#a', '#b', { quanto: .2 })` sono
   tutte scritture buone, e quella che si legge meglio è quella corta. */
const fabbrica = (famiglia, che, fn) => {
  const f = (...arg) => {
    const tinte = arg.filter(a => typeof a === 'string')
    const opz = arg.find(a => a && typeof a === 'object') || {}
    return {
      famiglia, che, dipingi: fn,
      tinte: tinte.length ? (tinte.length > 1 ? tinte : [tinte[0], tinte[0]]) : null,
      /* quale dei modi che quella tessitura sa fare */
      modo: opz.modo || null,
      /* il seme sposta TUTTO il caso di quella voce: due voci uguali
         con due semi diversi sono due muri parenti e non gemelli */
      seme: opz.seme || 0,
      /* `dove` è il nome di un campo della stanza (`umido`, `usura`, o
         uno che l'ambiente si dichiara). Senza, l'anomalia ha un campo
         tutto suo e non si correla con nient'altro — che è quello che
         serve a un disturbo indipendente. */
      dove: opz.dove || null,
      /* la frazione di superficie che si prende. La voce di fondo non
         ce l'ha: tiene tutto quello che gli altri non si prendono. */
      quanto: opz.quanto ?? null,
      /* quanto si interdigita il confine: qualche blocco che cade di
         là e qualcuno che regge di qua. Zero = il confine segue solo i
         giunti, che è comunque meglio del bordo di una casella. */
      sporco: opz.sporco ?? 0.12,
    }
  }
  /* i modi che quella tessitura dichiara di saper fare: li legge il
     catalogo per stamparli tutti, e il validatore per dire «questo modo
     non esiste» invece di disegnare la variante sbagliata in silenzio */
  f.modi = fn.modi || ['normale']
  f.che = che
  return f
}

const daRegistro = (famiglia, registro) =>
  Object.fromEntries(Object.entries(registro).map(([k, fn]) => [k, fabbrica(famiglia, k, fn)]))

export const MURA = daRegistro('muro', MURI)
export const SUOLO = daRegistro('suolo', POSE)

/* I nomi si esportano uno per uno perché in un ambiente si leggano
   nudi — `mattoni(...)`, `lastre(...)` — e perché due famiglie hanno
   tessiture che si chiamano uguale: il muro di mattoni non è il
   pavimento di mattonelle, e lo stesso nome renderebbe ambigua la riga. */
export const pietra = MURA.pietra
export const mattoni = MURA.mattoni
export const roccia = MURA.roccia
export const legno = MURA.legno
export const ferro = MURA.ferro
export const marmo = MURA.marmo
export const alberi = MURA.alberi

export const lastre = SUOLO.lastre
export const mattonelle = SUOLO.mattoni
export const pietraia = SUOLO.roccia
export const terra = SUOLO.terra
export const erba = SUOLO.erba
export const metallo = SUOLO.metallo
export const mosaico = SUOLO.mosaico
export const tappeto = SUOLO.tappeto
export const binari = SUOLO.binari
export const bagnato = SUOLO.umido

/* per chi ha ancora `muratura: 'mattoni'` e `posa: 'lastre'`: la
   stessa voce, costruita da un nome invece che da una chiamata */
export const daNome = (famiglia, che, tinte) => {
  const reg = famiglia === 'muro' ? MURA : SUOLO
  const f = reg[che] || reg[Object.keys(reg)[0]]
  return f(...(tinte || []))
}
