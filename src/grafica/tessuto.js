// Il tessuto della mappa: quale tessitura tocca a ogni punto. Vedi docs/core/grafica.md.
import { dado, mescola } from './comune.js'
import { daNome } from './materiali/pattern.js'
import { SUOLI, MURI } from './materiali/suoli.js'

// rumore a chiazze: valori su una griglia larga `scala` celle, interpolati morbidi (regioni, non puntini)
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

export function semeDi(x) {
  if (typeof x === 'number') return x | 0
  if (!x) return 0
  let h = 2166136261
  for (let i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) % 100000
}

// senza tinte proprie, una voce le riceve dal fondo: nessun colore nuovo entra nella stanza
export const tinteSotto = ([chiaro, scuro], forza = 1) => [
  mescola(mescola(chiaro, scuro, 0.42 * forza), '#3a3026', 0.24 * forza),
  mescola(scuro, '#241d1a', 0.26 * forza),
]

// campi: nome -> larghezza delle chiazze in celle. Due voci con lo stesso `dove` cadono negli stessi posti
const CAMPI = { umido: 5.5, usura: 7, rovina: 3.4 }

export function tessuto({ larghezza, altezza, muro, A, seme = 0,
                          suoli: suoliMappa = {}, muri: muriMappa = {} }) {
  const s = semeDi(seme)

  // una stringa al posto di una chiamata resta ammessa ('lastre' invece di lastre()): stessa cosa più corta
  const lista = (voci, famiglia, dove) => {
    if (!Array.isArray(voci) || !voci.length)
      throw new Error(`ambiente «${A.nome || '?'}»: manca la lista ${dove}`)
    return voci.map(v => (typeof v === 'string' ? daNome(famiglia, v) : v))
  }
  const mura = lista(A.mura, 'muro', 'mura')
  const suolo = lista(A.suolo, 'suolo', 'suolo')
  // i suoli detti dalla mappa (legenda, data/livelli/scrivi.js) si aggiungono in coda e vincono per dichiarazione
  const accoda = (lista, tavola, mappa) => {
    const dove = {}
    for (const nome of new Set(Object.values(mappa))) {
      if (!tavola[nome]) continue
      dove[nome] = lista.length
      lista.push(tavola[nome]())
    }
    return dove
  }
  const indiceDetto = accoda(suolo, SUOLI, suoliMappa)
  const indiceMuro = accoda(mura, MURI, muriMappa)

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
    const k = nome || `#${n}`   // senza `dove`, un campo tutto suo (disturbo indipendente)
    if (!fatti[k]) fatti[k] = chiazze(s + 11 + (nome ? nome.length * 13 : n * 101), scale[nome] || 3.6)
    return fatti[k]
  }

  const dentro = (i, k) => i >= 0 && k >= 0 && i < larghezza && k < altezza
  const pieno = (i, k) => dentro(i, k) && muro(i, k)

  // uno spigolo è un cantonale (l'ultima cosa che cade): cella di muro col vuoto su due lati non opposti
  const spigolo = (i, k) => {
    if (!pieno(i, k)) return false
    const vert = pieno(i, k - 1) && pieno(i, k + 1)
    const oriz = pieno(i - 1, k) && pieno(i + 1, k)
    return !vert && !oriz
  }
  const suMuro = (i, k) => muro(i, k) && !spigolo(i, k)
  const suSuolo = (i, k) => !muro(i, k)

  // quanto:0.17 = 17% della superficie: si taglia al quantile vero, non a una soglia fissa (docs/core/grafica.md)
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

  // la cucitura è sui blocchi non sulle celle (confine sui giunti); vince l'ultima voce che cade
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
    vinceMuro: (n, fx, fy, conSporco) => {
      const detto = muriMappa[Math.floor(fx) + ',' + Math.floor(fy)]
      if (detto && indiceMuro[detto] != null) return n === indiceMuro[detto]
      if (detto) return n === 0
      if (Object.values(indiceMuro).includes(n)) return false
      return vince(M, suMuro)(n, fx, fy, conSporco)
    },
    vinceSuolo: (n, fx, fy, conSporco) => {
      const detto = suoliMappa[Math.floor(fx) + ',' + Math.floor(fy)]
      if (detto && indiceDetto[detto] != null) return n === indiceDetto[detto]
      if (detto) return n === 0
      if (Object.values(indiceDetto).includes(n)) return false
      return vince(S, suSuolo)(n, fx, fy, conSporco)
    },
    valore: (nome, fx, fy) => campo(nome, 0)(fx, fy),   // quanto è bagnato lì: muschio e pozze non cadono a caso
    muroQui: (i, k) => M.find((v, n) => vince(M, suMuro)(n, i + 0.5, k + 0.5, false)) || M[0],
    suoloQui: (i, k) => S.find((v, n) => vince(S, suSuolo)(n, i + 0.5, k + 0.5, false)) || S[0],
  }
}
