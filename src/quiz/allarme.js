/* Il momento in cui un muro (consiglio.js) si dice a un grande: un avviso
   nella posta (store/posta.js), una volta sola per bambino e per chiave,
   solo il muro e mai il pedaggio. Non ritocca da sé: porta il numero
   sotto gli occhi di chi decide. Vedi docs/apprendimento/la-domanda.md. */

import { MODULI } from './nucleo/registro.js'
import { contoDi, consiglioDa } from './consiglio.js'
import { avvisaUnaVolta } from '../store/posta.js'
import { state, nomeCorrente } from '../store/profile.js'

// il nome leggibile di una tipologia (dichiarato dai moduli); senza nome non si avvisa affatto
let nomi = null
export function nomeDelTipo(chiave) {
  if (!nomi) {
    nomi = new Map()
    for (const m of MODULI)
      for (const t of m.tipi || []) nomi.set(t.chiave, t.nome)
  }
  return nomi.get(chiave) || ''
}

// pura: l'unica cosa che un test guarda senza un archivio; dice il numero, non il giudizio, e cosa c'è da fare
export function frasePerIlGrande({ chi, nome, detto }) {
  return `${chi}: «${nome}» — ${detto}. ` +
    'Guarda se è roba che a scuola non hanno ancora fatto: in «Come va» ' +
    'trovi la riga con tutti i numeri, e da lì si rimanda o si rende più facile.'
}

// chiamata a ogni risposta: costa un conto su una chiave sola, e non aspetta nessuno (la scrittura è async)
export function guardaComeVa(chiave, { items = state.profile?.items,
                                       chi = nomeCorrente(),
                                       player = state.player } = {}) {
  if (!chiave || !items) return null
  const consiglio = consiglioDa(contoDi([chiave], items))
  if (!consiglio || consiglio.verso !== -1) return null // solo il muro
  const nome = nomeDelTipo(chiave)
  if (!nome) return null
  const testo = frasePerIlGrande({ chi: chi || 'Chi gioca', nome, detto: consiglio.detto })
  // «Come va» è il seguito naturale: la riga di cui parla sta in cima, l'elenco è ordinato dalla peggiore
  avvisaUnaVolta(`${player || '?'}:${chiave}`, testo,
                 { testo: 'guarda com\'è andata', scheda: 'comeva' })
    .catch(() => {})
  return testo
}
