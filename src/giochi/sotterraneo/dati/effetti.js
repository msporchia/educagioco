// Gli effetti grafici dello scontro (docs/sotterraneo/scontro-effetti.md): cosa si vede quando l'eroe usa un'abilità. Dato
// puro, senza import oltre a elementi.js e abilita.js: lo leggono viste/racconto.js (i tempi e le cose da posare sul palco) e scena3d/effetti3d/gestore.js
// (come si disegnano). Le famiglie sono poche e i nodi tanti: un nodo non scrive il suo effetto, lo ricava da `elemento`,
// `forma` e da cosa fa (`effettoDi`); solo le abilità importanti hanno il loro, con `effetto: '<chiave>'` sul nodo
// (dati/abilita.js). Un nodo nuovo ne ha già uno da sé.
//
// Una famiglia (`via`) dice da dove viene il colpo e dove arriva:
//   vicino    l'eroe si fa sotto e sul mostro compare il segno         attorno   un turbine intorno all'eroe, poi i segni
//   lancio    qualcosa parte dall'eroe e vola (`corpo`), poi il segno  fascio    un raggio dall'eroe al mostro
//   cielo     qualcosa cade sul mostro dall'alto                       catena    salta da un mostro all'altro, in fila
//   terra     esce dal pavimento sotto il mostro                       su-chi    nasce sul mostro (una nube, un'esplosione)
//   onda      parte dall'eroe e attraversa il campo                    su-me     solo sull'eroe (scudo, cura…)
// `corpo` è la cosa che si muove o nasce, `segno` quello che resta sul mostro quando arriva; `arrivo` quando tocca (ms),
// `passo` quanto dopo tocca il successivo (per chi sta più lontano dal bersaglio), `dura` il totale (mai oltre 800 ms: la
// regola dell'utente, 12 ottobre, è che un'abilità non rallenti il turno). `alBersaglio`: vola solo verso il bersaglio e gli altri
// presi sentono lo scoppio; `oltre`: una freccia sola che li trapassa tutti; `piu`: il corpo è più grande; `scuote`: il palco
// trema; `eroe`: come si muove lui (scatta, tira, gira, protegge).

import { ELEMENTI } from './elementi.js'
import { colpisce } from './abilita.js'

export const VIE = ['vicino', 'attorno', 'lancio', 'fascio', 'cielo', 'catena', 'terra', 'su-chi', 'onda', 'su-me']

// Tutto quello che effetti3d sa disegnare (un guasto se una scheda ne nomina uno che manca)
export const CORPI = [
  'palla', 'dardo', 'freccia', 'quadrello', 'scheggia', 'lancia', 'ascia', 'falce', 'arco', 'fascio', 'fulmine', 'colonna', 'meteora',
  'frecce', 'massi', 'brace', 'neve', 'radici', 'crepa', 'blocco', 'nube', 'esplosione', 'rogo', 'fiammata', 'onda', 'turbine', 'sonno',
  'scudo', 'sfera', 'pietra', 'cura', 'specchio', 'muro',
]
export const SEGNI = ['taglio', 'croce', 'affondo', 'urto', 'arco', 'scoppio', 'scintilla', 'colpo', 'brina', 'luce', 'scossa', 'nube', 'rogo', 'rimbalzo']

export const EFFETTI = {
  // da vicino
  taglio:   { via: 'vicino', segno: 'taglio', arrivo: 190, dura: 480 },
  croce:    { via: 'vicino', segno: 'croce', arrivo: 190, dura: 540 },
  affondo:  { via: 'vicino', segno: 'affondo', arrivo: 170, dura: 480 },
  urto:     { via: 'vicino', segno: 'urto', arrivo: 200, dura: 540 },
  spazzata: { via: 'vicino', segno: 'arco', arrivo: 190, passo: 70, dura: 580 },
  turbine:  { via: 'attorno', corpo: 'turbine', segno: 'taglio', arrivo: 300, passo: 70, dura: 760, eroe: 'gira' },
  // da lontano
  palla:    { via: 'lancio', corpo: 'palla', segno: 'scoppio', alBersaglio: true, arrivo: 340, passo: 100, dura: 720 },
  dardo:    { via: 'lancio', corpo: 'dardo', segno: 'scintilla', arrivo: 300, passo: 40, dura: 560 },
  freccia:  { via: 'lancio', corpo: 'freccia', segno: 'colpo', arrivo: 280, passo: 40, dura: 520 },
  'freccia-fuoco':  { via: 'lancio', corpo: 'freccia', segno: 'scoppio', arrivo: 280, dura: 600 },
  'freccia-veleno': { via: 'lancio', corpo: 'freccia', segno: 'nube', arrivo: 280, dura: 640 },
  quadrello: { via: 'lancio', corpo: 'quadrello', segno: 'colpo', arrivo: 260, dura: 520 },
  trapassa: { via: 'lancio', corpo: 'freccia', segno: 'colpo', oltre: true, arrivo: 260, passo: 120, dura: 700 },
  scheggia: { via: 'lancio', corpo: 'scheggia', segno: 'brina', arrivo: 320, passo: 40, dura: 680 },
  lancia:   { via: 'lancio', corpo: 'lancia', segno: 'brina', piu: true, arrivo: 300, dura: 720 },
  falce:    { via: 'lancio', corpo: 'falce', segno: 'luce', arrivo: 300, passo: 50, dura: 620 },
  fascio:   { via: 'fascio', corpo: 'fascio', segno: 'scintilla', arrivo: 140, passo: 70, dura: 520 },
  // dall'alto
  fulmine:  { via: 'cielo', corpo: 'fulmine', segno: 'scintilla', arrivo: 200, passo: 80, dura: 560 },
  luce:     { via: 'cielo', corpo: 'colonna', segno: 'luce', arrivo: 240, passo: 80, dura: 700 },
  meteora:  { via: 'cielo', corpo: 'meteora', segno: 'scoppio', piu: true, scuote: true, arrivo: 380, dura: 780 },
  pioggia:  { via: 'cielo', corpo: 'frecce', segno: 'colpo', arrivo: 330, passo: 60, dura: 720 },
  massi:    { via: 'cielo', corpo: 'massi', segno: 'urto', arrivo: 340, passo: 80, dura: 720 },
  brace:    { via: 'cielo', corpo: 'brace', segno: 'scintilla', arrivo: 300, passo: 50, dura: 640 },
  nevicata: { via: 'cielo', corpo: 'neve', segno: 'brina', arrivo: 380, passo: 70, dura: 760 },
  // a catena
  catena:   { via: 'catena', corpo: 'arco', segno: 'scintilla', arrivo: 130, passo: 140, dura: 720 },
  ascia:    { via: 'catena', corpo: 'ascia', segno: 'taglio', arrivo: 230, passo: 190, dura: 780 },
  // dal pavimento
  radici:   { via: 'terra', corpo: 'radici', arrivo: 280, passo: 70, dura: 760 },
  terremoto: { via: 'terra', corpo: 'crepa', segno: 'urto', arrivo: 240, passo: 60, dura: 760, eroe: 'scatta', scuote: true },
  // sul mostro
  nube:     { via: 'su-chi', corpo: 'nube', arrivo: 150, passo: 60, dura: 760 },
  esplode:  { via: 'su-chi', corpo: 'esplosione', arrivo: 110, passo: 90, dura: 720, eroe: 'tira', scuote: true },
  rogo:     { via: 'su-chi', corpo: 'rogo', arrivo: 140, passo: 60, dura: 760, eroe: 'tira' },
  blocco:   { via: 'su-chi', corpo: 'blocco', arrivo: 200, passo: 60, dura: 760, eroe: 'tira' },
  sonno:    { via: 'su-chi', corpo: 'sonno', arrivo: 120, passo: 60, dura: 780, eroe: 'tira' },
  // attraverso il campo
  onda:     { via: 'onda', corpo: 'onda', segno: 'scossa', arrivo: 240, passo: 60, dura: 660 },
  fiammata: { via: 'onda', corpo: 'fiammata', segno: 'scoppio', arrivo: 220, passo: 60, dura: 680 },
  // solo sull'eroe
  scudo:    { via: 'su-me', corpo: 'scudo', dura: 680 },
  sfera:    { via: 'su-me', corpo: 'sfera', dura: 700 },
  pietra:   { via: 'su-me', corpo: 'pietra', dura: 740 },
  cura:     { via: 'su-me', corpo: 'cura', dura: 780 },
  preghiera: { via: 'su-me', corpo: 'colonna', dura: 780 },
  specchio: { via: 'su-me', corpo: 'specchio', dura: 700 },
  muro:     { via: 'su-me', corpo: 'muro', dura: 700 },
}
export const CHIAVI_EFFETTI = Object.keys(EFFETTI)

export const schedaDi = chiave => EFFETTI[chiave] || EFFETTI.taglio

// come si muove l'eroe mentre agisce: si fa sotto (scatta), tira indietro il braccio (tira), gira su sé stesso, resta fermo e brilla
const MOTO_DELLA_VIA = { vicino: 'scatta', attorno: 'gira', 'su-me': 'protegge' }
export const motoDell = chiave => { const s = schedaDi(chiave); return s.eroe || MOTO_DELLA_VIA[s.via] || 'tira' }

// il colore di un colpo: quello dell'elemento, o un acciaio chiaro per i colpi fisici (il colore del ramo sta sul nome)
export const tintaDelColpo = elemento => (elemento && elemento !== 'fisico' && ELEMENTI[elemento] ? ELEMENTI[elemento].tinta : '#e6ebf6')

// Cosa protegge o cura l'eroe in un'abilità, un'aura per campo del nodo (anche quando l'abilità colpisce pure: la Danza delle lame
// fa danno e para): dalle auras si vede quello che resta addosso
const AURE = [['scudo', 'sfera'], ['parato', 'scudo'], ['intoccabile', 'pietra'], ['specchio', 'specchio'], ['cura', 'cura'], ['linfa', 'cura']]
export function aureDelNodo(nodo) {
  if (!nodo) return []
  return [...new Set(AURE.filter(([campo]) => nodo[campo]).map(([, corpo]) => corpo))]
}

const daVicino = a => !!a && (a.scudo || (a.famiglie || []).some(f => f === 'spade' || f === 'asce'))

// L'effetto di un'abilità: quello scritto sul nodo, se no ricavato da cosa fa, dall'elemento, dalla forma e dall'arma del ramo.
// `famiglia`: l'arma che l'eroe ha in mano (archi, bacchette…) per i nodi senza arma, che colpiscono con quello che c'è
export function effettoDi(nodo, famiglia = null) {
  if (!nodo) return effettoDelColpo(famiglia)
  if (nodo.effetto) return nodo.effetto
  if (!colpisce(nodo)) {
    if (nodo.scudo) return 'sfera'
    if (nodo.parato) return 'scudo'
    if (nodo.intoccabile) return 'pietra'
    if (nodo.specchio) return 'specchio'
    if (nodo.cura || nodo.linfa) return 'cura'
    if (nodo.fermo) return 'sonno'
    if (nodo.debole) return nodo.forma === 'tutti' ? 'onda' : nodo.elemento === 'gelo' ? 'blocco' : 'nube'
    return 'cura'
  }
  const el = nodo.elemento || 'fisico'
  const forma = nodo.forma || 'uno'
  const arma = nodo.arma
  const arco = !!arma && (arma.famiglie || []).includes('archi')
  const vicino = daVicino(arma) || (!arma && (famiglia === null || !['archi', 'bacchette'].includes(famiglia)) && (el === 'fisico' || el === 'fuoco'))
  if (forma === 'catena') return el === 'fulmine' ? 'catena' : arco ? 'trapassa' : 'ascia'
  if (arco) return forma === 'uno' ? (nodo.veleno ? (el === 'veleno' ? 'freccia-veleno' : 'freccia-fuoco') : 'freccia') : 'pioggia'
  if (vicino) {
    if (forma === 'vicini') return 'spazzata'
    if (forma === 'tutti') return 'turbine'
    return nodo.rompe || nodo.fermo || nodo.quieto ? 'urto' : nodo.sanguina ? 'croce' : nodo.passa ? 'affondo' : 'taglio'
  }
  if (el === 'fuoco') return forma === 'uno' ? (nodo.veleno && !nodo.per ? 'rogo' : 'palla') : forma === 'vicini' ? 'esplode' : 'fiammata'
  if (el === 'gelo') return forma === 'uno' ? 'scheggia' : 'nevicata'
  if (el === 'fulmine') return 'fulmine'
  if (el === 'sacro') return 'luce'
  if (el === 'veleno') return forma === 'uno' && !nodo.per ? 'freccia-veleno' : 'nube'
  return forma === 'uno' ? 'dardo' : forma === 'vicini' ? 'spazzata' : 'turbine'
}

// l'attacco solito, senza abilità: dipende solo da quello che si ha in mano
export function effettoDelColpo(famiglia) {
  if (famiglia === 'archi') return 'freccia'
  if (famiglia === 'bacchette') return 'dardo'
  return 'taglio'
}

// Quali stati mette addosso un'abilità, nelle chiavi di `statiDel` (viste/campo.js: veleno, debole, fermo, sanguina, esposto, rotto),
// senza quelli che il mostro rifiuta (`rifiutati`, le chiavi di STATI: avvelena, brucia, gela, stordisce, sanguina)
const RIFIUTO_DI = { avvelena: 'veleno', brucia: 'veleno', sanguina: 'sanguina', stordisce: 'fermo' }
export function statiDelNodo(nodo, rifiutati = []) {
  if (!nodo) return []
  const no = new Set(rifiutati.map(r => RIFIUTO_DI[r] || (r === 'gela' ? (nodo.fermo || nodo.quieto ? 'fermo' : 'debole') : r)))
  const s = []
  if (nodo.veleno) s.push('veleno')
  if (nodo.debole) s.push('debole')
  if (nodo.fermo || nodo.quieto) s.push('fermo')
  if (nodo.sanguina) s.push('sanguina')
  if (nodo.esposto) s.push('esposto')
  if (nodo.rompe) s.push('rotto')
  return s.filter(x => !no.has(x))
}

// I guasti degli effetti: ogni scheda ha una famiglia, un corpo e un segno che si sanno disegnare, e ogni abilità del gioco
// (`nodi`, dati/abilita.js NODI) ha un effetto che esiste
export function guastiDegliEffetti(nodi = {}) {
  const g = []
  for (const [k, s] of Object.entries(EFFETTI)) {
    if (!VIE.includes(s.via)) g.push(`l'effetto ${k}: la famiglia "${s.via}" non esiste`)
    if (s.corpo && !CORPI.includes(s.corpo)) g.push(`l'effetto ${k}: il corpo "${s.corpo}" non si disegna`)
    if (s.segno && !SEGNI.includes(s.segno) && !CORPI.includes(s.segno)) g.push(`l'effetto ${k}: il segno "${s.segno}" non si disegna`)
    if (!(s.dura > 0 && s.dura <= 800)) g.push(`l'effetto ${k}: dura ${s.dura}, ne vuole tra 1 e 800`)
    if (s.via !== 'su-me' && !(s.arrivo > 0 && s.arrivo < s.dura)) g.push(`l'effetto ${k}: arriva a ${s.arrivo}, dopo la fine`)
    if (s.via !== 'vicino' && s.via !== 'attorno' && s.via !== 'terra' && !s.corpo) g.push(`l'effetto ${k}: senza corpo`)
  }
  for (const [id, n] of Object.entries(nodi)) {
    if (n.sempre) continue
    if (n.effetto && !EFFETTI[n.effetto]) g.push(`${id}: l'effetto "${n.effetto}" non esiste`)
    if (!EFFETTI[effettoDi(n)]) g.push(`${id}: l'effetto ricavato "${effettoDi(n)}" non esiste`)
  }
  return g
}
