/* I conti di «Come va» per un grande: le mattonelle delle materie (quanto
   è saputo, e la freccia rispetto a due settimane fa) e la settimana
   (minuti, difficili, migliorate). Puro (test/unita/settimana): il profilo,
   il catalogo e l'archivio arrivano da fuori. Vedi docs/genitori/come-va.md. */

import { saputo } from './nucleo/bisogno.js'
import { consiglioDa } from './consiglio.js'
import { alleggeritaDa, ancoraDifficile, contoDopo } from './alleggerire.js'

const GIORNO = 86400000

// le materie dei quiz (quiz/scelta.js, MATERIE) dette a un grande
export const MATERIE_QUIZ = [
  { id: 'italiano', nome: 'Italiano', emoji: '📖' },
  { id: 'matematica', nome: 'Matematica', emoji: '🔢' },
  { id: 'spazio', nome: 'Spazio e figure', emoji: '📐' },
  { id: 'tempo', nome: 'Tempo e orologio', emoji: '🕰️' },
  { id: 'logica', nome: 'Logica', emoji: '🧩' },
  { id: 'scienze', nome: 'Scienze', emoji: '🔬' },
]

// nell'albo parole, verbi e frasi sono tre barre; per un grande la lingua è una
export const INSIEME = [
  { id: 'inglese', nome: 'Inglese', emoji: '🇬🇧', dentro: ['inglese', 'verbi', 'frasi'] },
  { id: 'spagnolo', nome: 'Spagnolo', emoji: '🇪🇸', dentro: ['parole-es', 'verbi-es', 'frasi-es'] },
]

// le tipologie che arrivano davvero: non le tolte per età, non le spente
const ARRIVANO = new Set(['facili', 'medie', 'toste'])

export const SOGLIA_FRECCIA = 3   // punti percentuali: sotto, è rumore del decadimento
export const DUE_SETTIMANE = 12   // giorni: le fotografie sono settimanali, e non cadono al minuto
export const UNA_SETTIMANA = 6
export const PER_CONFRONTO = 5    // risposte per parte, prima di dire «da 4 a 9»
export const SALTO = 2            // su dieci: meno, non è un miglioramento che si racconta

export function frecciaDa(ora, prima) {
  if (prima == null || ora == null) return null
  if (ora - prima >= SOGLIA_FRECCIA) return 'su'
  if (prima - ora >= SOGLIA_FRECCIA) return 'giu'
  return 'pari'
}

// abilita: [{ id, nome, emoji, padronanza, visti, totale }] da store/progressi.js; pesati sul totale
export function mattonelleAlbo(abilita = []) {
  const gruppi = new Map()
  for (const a of abilita) {
    const ins = INSIEME.find(g => g.dentro.includes(a.id))
    const id = ins ? ins.id : a.id
    if (!gruppi.has(id))
      gruppi.set(id, { id, nome: ins ? ins.nome : a.nome, emoji: ins ? ins.emoji : a.emoji,
                       tipo: 'albo', mappa: a.id === 'mate' ? 'tabelline' : null,
                       somma: 0, totale: 0, visti: 0, parti: [] })
    const g = gruppi.get(id)
    g.somma += (a.padronanza || 0) * (a.totale || 0)
    g.totale += a.totale || 0
    g.visti += a.visti || 0
    g.parti.push({ id: a.id, nome: a.nome, visti: a.visti || 0, imparati: a.imparati || 0,
                   totale: a.totale || 0 })
  }
  return [...gruppi.values()].map(({ somma, ...g }) => ({
    ...g, pct: g.totale ? Math.round(somma / g.totale * 100) : 0,
  }))
}

// righe: le classi del catalogo per questo bambino (quiz/catalogo.js, fasceDelBambino); una tipologia conta una volta
export function mattonelleQuiz(righe = [], items = {}, now = Date.now()) {
  return MATERIE_QUIZ.map(m => {
    const tipi = [...new Set(righe
      .filter(r => r.tipo && r.materia === m.id && !r.spenta && ARRIVANO.has(r.dove))
      .map(r => r.tipo))]
    const visti = tipi.filter(t => items[t]?.last).length
    const somma = tipi.reduce((n, t) => n + (saputo(items[t], now) || 0), 0)
    return { ...m, tipo: 'quiz', mappa: null, tipi, visti, totale: tipi.length,
             pct: tipi.length ? Math.round(somma / tipi.length * 100) : 0 }
  }).filter(m => m.totale)
}

// prima: la fotografia di due settimane fa (store/istantanee.js), o null
export function mattonelleDi({ albo = [], righe = [], items = {}, prima = null, now = Date.now() } = {}) {
  const tutte = [...mattonelleQuiz(righe, items, now), ...mattonelleAlbo(albo)]
    .map(m => {
      const allora = prima?.m?.[m.id]
      return { ...m, prima: allora ?? null, freccia: frecciaDa(m.pct, allora) }
    })
  return { viste: tutte.filter(m => m.visti), nonAncora: tutte.filter(m => !m.visti) }
}

// quello che si fotografa: le percentuali, e il conto delle tipologie che hanno risposte
export function fotoDa(mattonelle = [], items = {}, tipi = []) {
  const m = {}
  for (const x of mattonelle) m[x.id] = x.pct
  const c = {}
  for (const t of tipi) {
    const it = items[t]
    if (it && (it.ok || it.err)) c[t] = [it.ok || 0, it.err || 0]
  }
  return { m, c }
}

// da mezzanotte di sei giorni fa, come i «7 giorni» di components/TempoDiGioco.vue
export function inizioSettimana(now = Date.now()) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime() - 6 * GIORNO
}

// «da 4 a 9 su 10»: il conto di allora contro le risposte arrivate da allora
export function miglioramento(it, allora) {
  if (!it || !allora) return null
  const [ok0, err0] = allora
  const n0 = ok0 + err0
  const ok = it.ok || 0
  const err = it.err || 0
  if (ok < ok0 || err < err0) return null            // conto azzerato: non si confronta
  const dOk = ok - ok0
  const dN = dOk + (err - err0)
  if (n0 < PER_CONFRONTO || dN < PER_CONFRONTO) return null
  const da = Math.round(ok0 / n0 * 10)
  const a = Math.round(dOk / dN * 10)
  return a - da >= SALTO ? { da, a } : null
}

/* righe: quelle di quiz/andamento.js (tutte); prima: la fotografia di una
   settimana fa; vaBene/alleggerite: i segni di settings; voci: le sessioni */
export function settimanaDi({ righe = [], items = {}, prima = null, vaBene = {},
                              alleggerite = {}, voci = [], now = Date.now() } = {}) {
  const da = inizioSettimana(now)
  const secondi = voci.filter(v => v.t >= da && v.t <= now).reduce((n, v) => n + v.s, 0)

  const migliorate = []
  for (const r of righe) {
    const su = miglioramento(items[r.tipo], prima?.c?.[r.tipo])
    if (su) migliorate.push({ ...r, ...su })
  }
  migliorate.sort((x, y) => (y.a - y.da) - (x.a - x.da) || x.nome.localeCompare(y.nome))
  const salite = new Set(migliorate.map(r => r.tipo))

  // una migliorata non sta anche fra le difficili: il conto intero può essere ancora basso, la settimana dice altro
  const difficili = righe
    .filter(r => !salite.has(r.tipo) && ancoraDifficile(items[r.tipo], vaBene[r.tipo]))
    .map(r => {
      const conto = contoDopo(items[r.tipo], vaBene[r.tipo])
      return { ...r, detto: consiglioDa(conto)?.detto || '',
               alleggerita: alleggeritaDa(alleggerite[r.tipo], now) }
    })
    .sort((x, y) => x.quota - y.quota || x.nome.localeCompare(y.nome))

  return { minuti: Math.round(secondi / 60), difficili, migliorate, confronto: !!prima }
}
