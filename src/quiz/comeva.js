/* I conti di «Come va» per un grande: le mattonelle delle materie (quanto
   è saputo, e la freccia rispetto a due settimane fa) e la settimana
   (minuti, difficili, migliorate). Puro (test/unita/settimana): il profilo,
   il catalogo e l'archivio arrivano da fuori. Vedi docs/genitori/come-va.md. */

import { saputo } from './nucleo/bisogno.js'
import { consiglioDa, MINIME } from './consiglio.js'
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
  { id: 'inglese', nome: 'Inglese', emoji: '🇬🇧' },
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

/* la misura che si mostra: le risposte giuste su quelle date, in percentuale (null se non ha ancora risposto). Più leggibile di «quanto è saputo»,
   che è la forza del ripasso e scende da sola se non si ripassa. */
export const giustePerCento = x => {
  const n = (x.ok || 0) + (x.err || 0)
  return n ? Math.round((x.ok || 0) / n * 100) : null
}

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
                       somma: 0, totale: 0, visti: 0, ok: 0, err: 0, parti: [] })
    const g = gruppi.get(id)
    g.somma += (a.padronanza || 0) * (a.totale || 0)
    g.totale += a.totale || 0
    g.visti += a.visti || 0
    g.ok += a.ok || 0; g.err += a.err || 0
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
    const ok = tipi.reduce((n, t) => n + (items[t]?.ok || 0), 0), err = tipi.reduce((n, t) => n + (items[t]?.err || 0), 0)
    return { ...m, tipo: 'quiz', mappa: null, tipi, visti, totale: tipi.length, ok, err,
             pct: tipi.length ? Math.round(somma / tipi.length * 100) : 0 }
  }).filter(m => m.totale)
}

// prima: la fotografia di due settimane fa (store/istantanee.js), o null
export function mattonelleDi({ albo = [], righe = [], items = {}, prima = null, now = Date.now() } = {}) {
  const tutte = [...mattonelleQuiz(righe, items, now), ...mattonelleAlbo(albo)]
    .map(m => {
      const allora = prima?.a?.[m.id]
      const giuste = giustePerCento(m)
      return { ...m, giuste, risposte: (m.ok || 0) + (m.err || 0), prima: allora ?? null, freccia: frecciaDa(giuste, allora) }
    })
  return { viste: tutte.filter(m => m.visti), nonAncora: tutte.filter(m => !m.visti) }
}

// quello che si fotografa: le percentuali (`m`, la forza del ripasso) e le giuste sulle risposte date (`a`, quella che «Come va» mostra), e il conto delle tipologie che hanno risposte
export function fotoDa(mattonelle = [], items = {}, tipi = []) {
  const m = {}, a = {}
  for (const x of mattonelle) { m[x.id] = x.pct; const g = giustePerCento(x); if (g != null) a[x.id] = g }
  const c = {}
  for (const t of tipi) {
    const it = items[t]
    if (it && (it.ok || it.err)) c[t] = [it.ok || 0, it.err || 0]
  }
  return { m, a, c }
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

/* ── Il giudizio in una frase ──
   Quello con cui un genitore entra: «sta andando bene», «ha difficoltà con le domande più difficili», «ha difficoltà con alcune domande».
   Non è una media: guarda **quali** domande vanno male. Una difficile che è un passo avanti (`dove: 'toste'`) è normale che faccia fatica;
   una del suo livello no. `viste` sono le righe di `andamentoDi` (con `classi` che portano `dove`), `difficili` quelle di `settimanaDi`.
   Tono: 'attesa' (poco da dire), 'bene', 'normale' (solo le difficili), 'alcune', 'tante'. */
export const POCHE_RISPOSTE = 20
const solo = (r, fasce) => !!r.classi?.length && r.classi.every(c => fasce.includes(c.dove))
export function giudizioDi({ viste = [], difficili = [], migliorate = 0 } = {}) {
  const valutate = viste.filter(r => !r.poche)
  const risposte = viste.reduce((n, r) => n + r.quante, 0)
  if (risposte < POCHE_RISPOSTE || valutate.length < 3)
    return { tono: 'attesa', titolo: 'Ha ancora giocato poco', testo: 'Servono qualche giorno e un po\' di domande per capire come va: intanto si può solo guardare.' }
  const nd = difficili.length
  if (!nd)
    return { tono: 'bene', titolo: 'Sta andando bene',
             testo: migliorate ? `Nessuna domanda gli va male, e questa settimana è migliorato su ${migliorate}.` : 'Nessuna domanda gli va male.' }
  if (difficili.every(r => solo(r, ['toste', 'sopra'])))
    return { tono: 'normale', titolo: 'Ha difficoltà con le domande più difficili',
             testo: nd === 1 ? 'Una sola, ed è un passo avanti: è normale. Quelle del suo livello vanno bene.'
                             : `${nd}, e sono tutte un passo avanti: è normale. Quelle del suo livello vanno bene.` }
  if (nd <= Math.max(3, Math.round(valutate.length * 0.25)))
    return { tono: 'alcune', titolo: 'Ha difficoltà con alcune domande',
             testo: `${nd === 1 ? 'Una' : nd} su ${valutate.length} ${nd === 1 ? 'va' : 'vanno'} male: sotto le trovi, e puoi provarle, spostarle o non chiedergliele più.` }
  return { tono: 'tante', titolo: 'Fa fatica con parecchie domande',
           testo: `${nd} su ${valutate.length} vanno male: forse i giochi sono tarati troppo avanti. Prova ad abbassare l'età a mano (Bambino › Tara a mano).` }
}

/* ── Le aree ──
   Le materie sono una dozzina (quelle dei quiz, quelle dell'albo, quelle dei giochi): troppe per un colpo d'occhio. Si raggruppano in poche
   aree fisse — sempre le stesse, così il disegno ha la stessa forma per tutti i bambini e si confronta nel tempo — e dall'area si scende alle
   materie e da lì alle domande (docs/genitori/come-va.md). Una materia che qui non c'è finisce in «Logica e scienze». */
export const AREE = [
  { id: 'numeri', nome: 'Numeri', emoji: '🔢', materie: ['matematica', 'mate', 'mente', 'torri', 'soldi', 'pozioni'] },
  { id: 'italiano', nome: 'Italiano', emoji: '📖', materie: ['italiano'] },
  { id: 'lingue', nome: 'Lingue', emoji: '🌍', materie: ['inglese', 'spagnolo'] },
  { id: 'spazio', nome: 'Spazio e tempo', emoji: '📐', materie: ['spazio', 'tempo'] },
  { id: 'logica', nome: 'Logica e scienze', emoji: '🧩', materie: ['logica', 'ordini', 'scienze'] },
]
export const areaDi = id => (AREE.find(a => a.materie.includes(id)) || AREE[AREE.length - 1]).id

export const DIFFERENZA = 15   // punti fra la materia migliore e la peggiore di un'area, sotto i quali non si dice «va meglio/peggio»
const media = v => (v.length ? Math.round(v.reduce((n, x) => n + x, 0) / v.length) : null)

/* viste / nonAncora: le mattonelle di `mattonelleDi`. Sempre tutte le aree, nell'ordine di AREE; pct è null se nessuna materia è stata giocata. */
export function areeDi({ viste = [], nonAncora = [] } = {}) {
  return AREE.map(a => {
    const mie = viste.filter(m => areaDi(m.id) === a.id)
    const mai = nonAncora.filter(m => areaDi(m.id) === a.id)
    const ok = mie.reduce((n, m) => n + (m.ok || 0), 0), err = mie.reduce((n, m) => n + (m.err || 0), 0)
    const risposte = ok + err
    const pct = giustePerCento({ ok, err })
    const prima = media(mie.filter(m => m.prima != null).map(m => m.prima))
    // «va meglio/peggio» solo fra materie con abbastanza risposte per dirlo
    const solide = mie.filter(m => m.giuste != null && m.risposte >= MINIME)
    const alte = Math.max(...solide.map(m => m.giuste)), basse = Math.min(...solide.map(m => m.giuste))
    const confronto = solide.length >= 2 && alte - basse >= DIFFERENZA
    return {
      id: a.id, nome: a.nome, emoji: a.emoji, pct, risposte, poche: risposte > 0 && risposte < MINIME, prima,
      freccia: frecciaDa(pct, prima),
      materie: mie.map(m => ({ ...m, meglio: confronto && solide.includes(m) && m.giuste === alte,
                                    peggio: confronto && solide.includes(m) && m.giuste === basse })),
      nonAncora: mai,
    }
  })
}
