/* ═══════════════════════════════════════════════════════════════════
   IL TESSUTO DELLA MAPPA — quale tessitura tocca a ogni punto

   ── i due tentativi sbagliati, perché non si rifacciano ──
   1. **materiali alla pari, mescolati a chiazze.** Concetto giusto
      (una stanza deve avere dei luoghi, non un valore medio), resa
      pessima: tinte scelte a mano per materiale danno due famiglie
      cromatiche che non si conoscono, e il confine tagliava le celle.
   2. **una sola anomalia, cablata nel motore** (`sotto:`). Meglio da
      guardare, ma il motore decideva che l'anomalia è una e dove sta:
      per averne due — o una macchia di disturbo qualsiasi — bisognava
      riaprire questo file.

   ── quello che c'è adesso ──
   Un ambiente dichiara **due liste**: `mura` e `suolo`. La prima voce
   è il fondo, quelle dopo si prendono una fetta di superficie dove
   dice il loro campo. Qui dentro non è scritto **che cosa** siano —
   roccia, mattoni rotti, terra battuta è affar loro — solo **quanta
   superficie** ognuna si prende e **dove**.

   Tre regole che restano di questo file:
   · la fetta è esatta, perché la soglia esce dal **quantile** dei
     valori veri e non da un numero a caso;
   · il confine si decide **per blocco** e non per cella, così passa
     dai giunti: è la cucitura;
   · **i cantonali non si sfaldano** — la struttura è l'ultima cosa che
     cade, e un muro che si sbriciola sugli spigoli non legge come
     costruito.
   ═══════════════════════════════════════════════════════════════════ */
import { dado, mescola } from './comune.js'
import { daNome } from './materiali/pattern.js'

/* ── il rumore a chiazze ──
   Valori casuali su una griglia larga `scala` celle, interpolati con
   una curva morbida. È il minimo che fa regioni invece di puntini, e
   costa quattro `dado` per punto. */
export function chiazze(seme, scala) {
  const morbida = t => t * t * (3 - 2 * t)
  return (i, k) => {
    const x = i / scala, y = k / scala
    const x0 = Math.floor(x), y0 = Math.floor(y)
    const fx = morbida(x - x0), fy = morbida(y - y0)
    const a = dado(x0, y0, seme), b = dado(x0 + 1, y0, seme)
    const c = dado(x0, y0 + 1, seme), d = dado(x0 + 1, y0 + 1, seme)
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy
  }
}

/* un seme può arrivare come numero o come nome di livello: da qui esce
   sempre un intero, e lo stesso nome dà sempre lo stesso intero */
export function semeDi(x) {
  if (typeof x === 'number') return x | 0
  if (!x) return 0
  let h = 2166136261
  for (let i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) % 100000
}

/* ── LA PARENTELA, per chi non dichiara i colori ──
   Una voce senza tinte le riceve dal fondo, spente e appena più calde.
   Nessun colore nuovo entra nella stanza, quindi non può stonare —
   ed è il ripiego, non la regola: quando i colori contano si scrivono
   nella chiamata, che è tutto il punto di averla. */
export const tinteSotto = ([chiaro, scuro], forza = 1) => [
  mescola(mescola(chiaro, scuro, 0.42 * forza), '#3a3026', 0.24 * forza),
  mescola(scuro, '#241d1a', 0.26 * forza),
]

/* i campi di una stanza: nome → quanto sono larghe le sue chiazze, in
   celle. Un ambiente può dichiararne altri (`campi: { sangue: 2.5 }`)
   e una voce li nomina con `dove`. Due voci che nominano lo stesso
   campo cadono **negli stessi posti**, ed è così che si correlano le
   cose che hanno la stessa causa. */
const CAMPI = { umido: 5.5, usura: 7, rovina: 3.4 }

export function tessuto({ larghezza, altezza, muro, A, seme = 0 }) {
  const s = semeDi(seme)

  /* ── le due liste ──
     Un ambiente le dichiara tutte e due, e non c'è più nessuna strada
     che parte da `muratura:`/`posa:`: quel modo di dire le cose è
     finito, e tenerne due in piedi vorrebbe dire che una delle due
     smette di essere provata senza che nessuno se ne accorga. Una
     stringa al posto di una chiamata resta ammessa — `'lastre'` invece
     di `lastre()` — perché è la stessa cosa detta più corta. */
  const lista = (voci, famiglia, dove) => {
    if (!Array.isArray(voci) || !voci.length)
      throw new Error(`ambiente «${A.nome || '?'}»: manca la lista ${dove}`)
    return voci.map(v => (typeof v === 'string' ? daNome(famiglia, v) : v))
  }
  const mura = lista(A.mura, 'muro', 'mura')
  const suolo = lista(A.suolo, 'suolo', 'suolo')

  /* le tinte mancanti si derivano da quelle del fondo della sua lista */
  const vesti = (voci, forza) => {
    const fondo = voci[0].tinte || ['#7a7168', '#4a443e']
    voci.forEach((v, n) => { if (!v.tinte) v.tinte = n ? tinteSotto(fondo, forza) : fondo })
    return voci
  }
  vesti(mura, 1)
  vesti(suolo, 0.6)

  const scale = { ...CAMPI, ...(A.campi || {}) }
  const fatti = {}
  const campo = (nome, n) => {
    /* senza `dove` la voce ha un campo tutto suo, scorrelato da ogni
       altra cosa: è quello che serve a un disturbo indipendente */
    const k = nome || `#${n}`
    if (!fatti[k]) fatti[k] = chiazze(s + 11 + (nome ? nome.length * 13 : n * 101), scale[nome] || 3.6)
    return fatti[k]
  }

  const dentro = (i, k) => i >= 0 && k >= 0 && i < larghezza && k < altezza
  const pieno = (i, k) => dentro(i, k) && muro(i, k)

  /* ── LA STRUTTURA NON SI SFALDA ──
     Uno spigolo è un cantonale: nella muratura vera è fatto di conci
     squadrati e messi apposta, ed è l'ultima cosa che cade. Qui è una
     cella di muro che ha il vuoto su due lati che non sono opposti. */
  const spigolo = (i, k) => {
    if (!pieno(i, k)) return false
    const vert = pieno(i, k - 1) && pieno(i, k + 1)
    const oriz = pieno(i - 1, k) && pieno(i + 1, k)
    return !vert && !oriz
  }
  const suMuro = (i, k) => muro(i, k) && !spigolo(i, k)
  const suSuolo = (i, k) => !muro(i, k)

  /* ── LA FETTA È ESATTA ──
     `quanto: 0.17` vuol dire il 17% della superficie, non «una soglia
     a 0,83»: si guardano i valori del campo su tutte le celle
     candidate, si ordinano, e si taglia al quantile giusto. Con una
     soglia fissa la media di due rumori la superava una cella su
     cento, e la stanza tornava a tinta unita senza dire niente. */
  const preparaLista = (voci, ammessa) => voci.map((v, n) => {
    if (!n || v.quanto == null) return { ...v, campo: null, taglio: 2 }
    const f = campo(v.dove, n)
    const val = []
    for (let k = 0; k < altezza; k++)
      for (let i = 0; i < larghezza; i++) if (ammessa(i, k)) val.push(f(i + 0.5, k + 0.5))
    val.sort((a, b) => a - b)
    const q = Math.min(0.6, Math.max(0, v.quanto))
    const taglio = val.length ? val[Math.min(val.length - 1, Math.floor(val.length * (1 - q)))] : 2
    return { ...v, campo: f, taglio }
  })
  const M = preparaLista(mura, suMuro)
  const S = preparaLista(suolo, suSuolo)

  /* ── LA CUCITURA SI FA SUI BLOCCHI, NON SULLE CELLE ──
     La domanda arriva dal centro di un mattone, non dal centro di una
     casella: il confine passa allora lungo i giunti — mancano blocchi
     interi — che è come un paramento se ne va davvero. E `sporco` fa
     cadere qualche blocco di qua e di là del bordo, così i due
     materiali si interdigitano invece di allinearsi.

     Chi vince: **l'ultima voce che cade**, cioè l'ordine di
     dichiarazione è l'ordine di sovrapposizione. */
  const vince = (voci, ammessa) => (n, fx, fy, conSporco) => {
    const i = Math.floor(fx), k = Math.floor(fy)
    if (!dentro(i, k) || !ammessa(i, k)) return n === 0
    let alto = 0
    for (let j = voci.length - 1; j > 0; j--) {
      const v = voci[j]
      if (!v.campo) continue
      const sp = conSporco
        ? (dado(Math.round(fx * 97), Math.round(fy * 97), 909 + j) - 0.5) * v.sporco : 0
      if (v.campo(fx, fy) + sp > v.taglio) { alto = j; break }
    }
    return alto === n
  }

  return {
    mura: M, suolo: S, seme: s,
    uniforme: M.length < 2 && S.length < 2,
    vinceMuro: vince(M, suMuro),
    vinceSuolo: vince(S, suSuolo),
    /* quanto è bagnato lì: serve ai dettagli, che non cadono più dove
       capita — il muschio e le pozze stanno dove cola */
    valore: (nome, fx, fy) => campo(nome, 0)(fx, fy),
    /* la voce che si vede in quella cella, per chi ragiona a caselle */
    muroQui: (i, k) => M.find((v, n) => vince(M, suMuro)(n, i + 0.5, k + 0.5, false)) || M[0],
    suoloQui: (i, k) => S.find((v, n) => vince(S, suSuolo)(n, i + 0.5, k + 0.5, false)) || S[0],
  }
}
