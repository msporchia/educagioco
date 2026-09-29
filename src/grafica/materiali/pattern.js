// Le tessiture come chiamate coi loro colori, non nomi: vedi docs/core/grafica.md.
import { POSE, MURI } from './indice.js'

// tutti gli argomenti facoltativi, in ordine: colori (stringhe), poi opzioni (oggetto)
const fabbrica = (famiglia, che, fn) => {
  const f = (...arg) => {
    const tinte = arg.filter(a => typeof a === 'string')
    const opz = arg.find(a => a && typeof a === 'object') || {}
    return {
      famiglia, che, dipingi: fn,
      tinte: tinte.length ? (tinte.length > 1 ? tinte : [tinte[0], tinte[0]]) : null,
      modo: opz.modo || null,
      seme: opz.seme || 0,   // sposta TUTTO il caso: stessa voce, semi diversi = muri parenti non gemelli
      dove: opz.dove || null,   // senza, un campo tutto suo (disturbo indipendente)
      quanto: opz.quanto ?? null,   // la voce di fondo non ce l'ha: tiene quello che resta
      sporco: opz.sporco ?? 0.12,   // 0 = confine solo sui giunti
    }
  }
  f.modi = fn.modi || ['normale']   // li legge il catalogo, e il validatore per dire «modo inesistente»
  f.che = che
  return f
}

const daRegistro = (famiglia, registro) =>
  Object.fromEntries(Object.entries(registro).map(([k, fn]) => [k, fabbrica(famiglia, k, fn)]))

export const MURA = daRegistro('muro', MURI)
export const SUOLO = daRegistro('suolo', POSE)

// nomi esportati uno per uno: il muro di mattoni non è il pavimento di mattonelle, stesso nome sarebbe ambiguo
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

export const daNome = (famiglia, che, tinte) => {
  const reg = famiglia === 'muro' ? MURA : SUOLO
  const f = reg[che] || reg[Object.keys(reg)[0]]
  return f(...(tinte || []))
}
