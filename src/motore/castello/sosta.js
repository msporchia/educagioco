// La partita lasciata a metà (docs/castello/sosta.md). La carta, le ondate e
// i regali si rifanno dalla tappa e dal profilo; si scrive solo quello che è
// successo: il tabellone, le torri (per piazzola, non per pixel), chi è in
// campo e a che punto è l'ondata. I colpi in volo e gli schizzi no.
import { Nemico } from './nemico.js'
import { Torre } from './torre.js'
import { TAPPE, liberaDi, chiaveTappa } from '../../data/castello.js'

export const VERSIONE = 1

// la tappa del salvataggio, se c'è ancora: si cerca per chiave, perché
// l'indice da solo resterebbe buono anche con una tappa nuova in mezzo
export function tappaDi(dato) {
  if (!dato || dato.v !== VERSIONE) return null
  const t = dato.tappa < 0 ? liberaDi(dato.chiave) : TAPPE[dato.tappa]
  return t && (dato.tappa < 0 ? t.chiave : chiaveTappa(t)) === dato.chiave ? t : null
}

// cosa dice la mappa in cima: dove si era, senza aprire la partita
export function dice(dato) {
  const t = tappaDi(dato)
  if (!t) return null
  const s = dato.stato || {}
  return { nome: t.nome, emoji: t.emoji, libera: dato.tappa < 0, onda: s.onda || 0,
           ondate: t.ondate, cuori: s.cuori, energia: s.energia, torri: (dato.torri || []).length }
}

// i decimali di un nemico: abbastanza per non spostarlo, pochi per l'archivio
const tondo = n => (typeof n === 'number' ? Math.round(n * 1000) / 1000 : n)

// quello che un nemico ha di diverso da come nasce: il resto lo rimette il costruttore
const DEL_NEMICO = ['d', 'via', 'onda', 'vita', 'vitaMax', 'vel', 'bestia', 'vola', 'immune',
  'abilita', 'divisioni', 'capo', 'paga', 'taglia', 'pezzo', 'gelo', 'freno', 'fragile',
  'male', 'perQuanto', 'aTerra', 'risorto', 'malTipo']

// `tappa`: l'indice nella campagna, -1 per una partita libera. Una partita
// finita non si scrive: torna null e la sosta si toglie.
export function scrivi(b, tappa, extra = {}) {
  if (!b || b.finito) return null
  const chiave = tappa < 0 ? b.tappa.chiave : chiaveTappa(b.tappa)
  const torri = b.torri.map(t => ({ posto: b.postoDi(t), tipo: t.tipo, lv: t.lv,
                                    ramo: t.ramo, ricarica: tondo(t.ricarica) }))
  // una torre fuori da ogni piazzola non si saprebbe dove rimetterla
  if (torri.some(t => t.posto < 0)) return null
  return {
    v: VERSIONE, tappa, chiave,
    stato: b.tabellone.foto(), resto: tondo(b.tabellone.resto || 0),
    torri,
    nemici: [...b.nemici, ...b.nati].filter(n => n.vivo)
      .map(n => Object.fromEntries(DEL_NEMICO.map(k => [k, tondo(n[k])]))),
    daGenerare: b.daGenerare, prossimo: tondo(b.prossimo), pausa: tondo(b.pausa),
    tempo: tondo(b.tempo), usciti: b.usciti, aperte: [...b.aperte],
    daScegliere: b.daScegliere,
    ...extra,
  }
}

// Rimette la partita dentro una battaglia appena apparecchiata sulla stessa
// tappa. `false` se il salvataggio non torna (versione, tappa cambiata,
// piazzola sparita): chi chiama butta la sosta e la tappa ricomincia.
export function leggi(dato, b) {
  if (!dato || dato.v !== VERSIONE || !b) return false
  const posti = b.postazioni
  if (!Array.isArray(dato.torri) || dato.torri.some(t => !posti[t.posto])) return false
  b.inizia()
  b.tabellone.riprendi(dato.stato)
  b.tabellone.resto = dato.resto || 0
  b.torri = dato.torri.map(t => Torre.da({ ...posti[t.posto], tipo: t.tipo, lv: t.lv,
                                           ramo: t.ramo, ricarica: t.ricarica, doni: b.doni }))
  b.nemici = (dato.nemici || []).map(n => Object.assign(new Nemico({ vita: n.vitaMax }), n))
  b.daGenerare = dato.daGenerare || 0
  b.prossimo = dato.prossimo || 0
  b.pausa = dato.pausa || 0
  b.tempo = dato.tempo || 0
  b.usciti = dato.usciti || 0
  b.aperte = new Map(dato.aperte || [])
  b.daScegliere = dato.daScegliere || 0
  b.bestia = b.ondate.bestiaDi(Math.max(1, b.tabellone.onda))
  return true
}
