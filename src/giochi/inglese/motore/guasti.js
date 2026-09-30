// I controlli che valgono per ogni frase e ogni capitolo, anche quelli che
// nasceranno: li fa girare test/unita/inglese-mondi e li stampa lo script
// strumenti/inglese/banchi.mjs. Tornano un elenco di guasti in parole.
import { FRASI as FRASI_VECCHIE } from '../../../data/frasi.js'
import { WORDS } from '../../../data/words.js'
import { FORME } from '../dati/forme.js'
import { TRAPPOLE } from '../dati/trappole.js'
import { FRASI } from '../dati/frasi.js'
import { MONDI, mondoDi, tappaDi, pronto } from '../dati/mondi.js'
import { ARGOMENTI, paroleDellArgomento } from '../dati/argomenti.js'
import { componi, TIPI } from '../../../data/domande.js'
import { voceDi } from '../../../data/lessico.js'
import { paroleNote, formeNote, sconosciute, fontiDi, chiaveDellaTappa, formeDelLibro }
  from './grafo.js'
import { eColore, eAggettivo, eNumero, traduci } from './lessico.js'
import { sgrammaticata, APPOSTA } from './grammatica.js'
import { tipiDellaParola } from './sessione.js'
import { trappoleDi } from './trappole.js'
import { costruisci, composta, giudica, contesto, FORMATI_FRASE } from './formati.js'
import { normalizza, accetta, espandi } from './testo.js'
import { mondiDi, racconta, rendi, valoriDi, pagineDi, frasiDelCapitolo, tappaDellaStoria, chiDi,
         lessicoDelCapitolo, paroleDellaStoriaIn, fuoriDalLessico, chiaveDelValore, domandaIn, TIPI_DOMANDA,
         PAROLE_DELLA_STORIA_MAX } from './libro.js'
import { CHI_PARLA } from '../dati/elenchi.js'
import { VERBI } from '../../../data/verbi.js'

export const PERCHE_MAX = 70
// le parole di chi parla: in una frase senza `chi` vogliono dire che è una battuta
const IO_E_TU = new Set(['i', 'me', 'my', 'we', 'us', 'our', 'you', 'your'])

// un caso ripetibile: la stessa frase deve dare gli stessi banchi
export function sorte(seme = 1) {
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const VECCHIE = new Map(FRASI_VECCHIE.map(f => [f.id, f]))
const PAROLE = new Set(WORDS.map(w => w[0]))

export function guastiDellaFrase(f, { semi = 6 } = {}) {
  const g = []
  const dove = `frase ${f.id}`
  const tappa = tappaDi(f.tappa)
  if (!tappa || tappa.mondo !== f.mondo) g.push(`${dove}: la tappa ${f.tappa} non è del mondo ${f.mondo}`)
  if (!FORME[f.forma]) g.push(`${dove}: forma sconosciuta ${f.forma}`)
  if (!f.it || !f.en) g.push(`${dove}: manca it o en`)
  if (/[?.!]/.test(f.en)) g.push(`${dove}: en senza punteggiatura (la mette la fila)`)
  for (const n of f.niente || [])
    if (!TRAPPOLE.some(t => t.id === n)) g.push(`${dove}: niente cita una regola che non c'è (${n})`)
  // lo stesso id vuol dire la stessa frase: è la chiave SRS
  const v = VECCHIE.get(f.id)
  if (v && normalizza(v.en) !== normalizza(f.en))
    g.push(`${dove}: l'id è di data/frasi.js ma la frase è un'altra («${v.en}»)`)
  if (!tappa || !FORME[f.forma]) return g
  if (!tappa.frasi) g.push(`${dove}: sta in una tappa di parole (${f.tappa}): le frasi vanno nelle tappe di frasi`)

  // almeno un segno della struttura della tappa: una frase di «C'è» che non dice there non ripassa niente
  const segni = (tappa.forme || []).flatMap(x => FORME[x].segni)
  const T = espandi(f.en)
  const haSegno = segni.some(sg => (sg === '#c' ? T.some(eColore) : sg === '#j' ? T.some(eAggettivo)
    : sg === '#n' ? T.some(eNumero) : T.includes(sg.toLowerCase())))
  if (segni.length && !haSegno) g.push(`${dove}: non usa la struttura della sua tappa (${segni.join(', ')})`)

  for (const testo of [f.en, ...(f.varianti || [])]) {
    const storta = sgrammaticata(testo)
    if (storta) g.push(`${dove}: «${testo}» è sgrammaticata: ${storta}`)
  }

  const note = paroleNote(f.mondo, f.tappa)
  for (const testo of [f.en, ...(f.varianti || [])]) {
    const ignote = sconosciute(testo, note)
    if (ignote.length) g.push(`${dove}: parole non ancora note a ${f.tappa}: ${ignote.join(', ')}`)
  }
  if (!formeNote(f.mondo, f.tappa).has(f.forma)) g.push(`${dove}: la forma ${f.forma} arriva dopo la sua tappa`)

  for (const t of f.trappole || []) {
    if (!t.en || !t.perche) g.push(`${dove}: trappola a mano senza en o perché`)
    if (t.parola && !PAROLE.has(t.parola)) g.push(`${dove}: trappola a mano su «${t.parola}», che non è in words.js`)
  }
  const ctx0 = contesto(f, { tappa, altre: FRASI.filter(x => x.tappa === f.tappa) })
  const tr = trappoleDi(f, ctx0)
  if (tr.length < 3) g.push(`${dove}: solo ${tr.length} trappole, ne servono 3`)
  for (const t of tr) {
    if (t.perche.length > PERCHE_MAX) g.push(`${dove}: perché troppo lungo (${t.perche.length}): ${t.perche}`)
    if (/[{}]/.test(t.perche)) g.push(`${dove}: perché con un buco vuoto: ${t.perche}`)
    if (accetta(t.en, f)) g.push(`${dove}: la trappola «${t.en}» è una risposta giusta`)
    // sbagliata sì, ma per il motivo che dice: niente «a trousers» o «two dog» per sbaglio
    const storta = !APPOSTA.has(t.id) && sgrammaticata(t.en)
    if (storta) g.push(`${dove}: la trappola ${t.id} «${t.en}» è sgrammaticata per caso: ${storta}`)
  }

  // ogni formato si costruisce e sta in piedi, con più tiri del caso
  for (let s = 1; s <= semi; s++) {
    const ctx = contesto(f, { tappa, altre: FRASI.filter(x => x.tappa === f.tappa || x.mondo === f.mondo),
                              rnd: sorte(s * 97 + f.id.length) })
    for (const formato of FORMATI_FRASE) {
      const forza = FORMATI_FRASE.indexOf(formato) + (s % 2)
      const d = costruisci(f, formato, ctx, { forza })
      const qui = `${dove} (${formato})`
      if (d.opzioni) {
        const giuste = d.opzioni.filter(o => o.giusta)
        if (giuste.length !== 1) g.push(`${qui}: ${giuste.length} opzioni giuste`)
        if (d.opzioni.length !== 4) g.push(`${qui}: ${d.opzioni.length} opzioni invece di 4`)
        const testi = d.opzioni.map(o => normalizza(o.testo))
        if (new Set(testi).size !== testi.length) g.push(`${qui}: due opzioni uguali`)
        if (formato === 'scegli' && d.opzioni.some(o => !o.giusta && accetta(o.testo, f)))
          g.push(`${qui}: un'opzione sbagliata è una variante giusta`)
        const es = giudica(f, d, giuste[0], { ctx })
        if (!es.giusta) g.push(`${qui}: la giusta non è giudicata giusta`)
      } else {
        const giuste = ordineGiusto(d)
        if (!giuste) { g.push(`${qui}: le tessere non bastano a comporre la frase`); continue }
        if (!accetta(composta(d, giuste), f)) g.push(`${qui}: la fila giusta non è accettata`)
        const es = giudica(f, d, giuste, { ctx })
        if (!es.giusta) g.push(`${qui}: la fila giusta non è giudicata giusta`)
        if (formato === 'completa' && d.tessere.length !== d.righe.filter(r => r.buco !== undefined).length + d.inPiu)
          g.push(`${qui}: le tessere non sono quante i buchi più quella di troppo`)
        if (formato === 'scegliMonta') {
          if (!d.inPiu) g.push(`${qui}: nessuna tessera trappola`)
          const dentro = new Set(d.soluzione.map(w => w.toLowerCase()))
          if (d.tessere.some(t => t.id >= d.soluzione.length && dentro.has(t.testo.toLowerCase())))
            g.push(`${qui}: una tessera in più è già nella frase`)
        }
      }
    }
  }
  return g
}

// gli id delle tessere nell'ordine giusto (per «completa»: nell'ordine dei buchi)
export function ordineGiusto(d) {
  const libere = d.tessere.slice()
  const prendi = testo => {
    const i = libere.findIndex(t => t.testo === testo)
    return i < 0 ? null : libere.splice(i, 1)[0].id
  }
  const voluti = d.formato === 'completa'
    ? d.righe.map((r, i) => (r.buco !== undefined ? d.soluzione[i] : null)).filter(x => x !== null)
    : d.soluzione
  const ids = voluti.map(prendi)
  return ids.includes(null) ? null : ids
}

export function guastiDelleFrasi() {
  const g = []
  const viste = new Set()
  for (const f of FRASI) {
    if (viste.has(f.id)) g.push(`frase doppia: ${f.id}`)
    viste.add(f.id)
    g.push(...guastiDellaFrase(f))
  }
  return g
}

/* Le domande sulle parole di una tappa: le risposte sbagliate sono parole
   del suo argomento (o degli argomenti vicini), mai di tutta la lingua — il
   🔴 fra 🏥🐶📓 — e ce ne sono abbastanza da fare una domanda vera. */
export function guastiDelleParole({ giri = 4 } = {}) {
  const g = []
  for (const m of MONDI) for (const t of m.tappe) {
    if (!t.argomento) continue
    const a = ARGOMENTI[t.argomento]
    const pre = a.verbi ? 'verbo:' : 'en:'
    const ammesse = new Set([t.argomento, ...(a.vicini || [])].flatMap(paroleDellArgomento).map(p => pre + p))
    for (const p of t.parole) {
      const chiave = chiaveDellaTappa(t, p)
      const v = voceDi(chiave)
      if (!v) { g.push(`${t.id}: «${p}» non ha una voce nel lessico`); continue }
      for (const tipo of tipiDellaParola(chiave)) {
        if (!TIPI[tipo].puoUsare(v, () => true)) continue
        for (let i = 0; i < giri; i++) {
          const d = componi(v, tipo, 'inglese', { fonti: fontiDi(chiave, voceDi) })
          const sbagliate = d.opzioni.filter(o => !o.giusta)
          if (d.opzioni.length < 4) g.push(`${t.id}: «${p}» (${tipo}) ha solo ${d.opzioni.length} risposte`)
          // si risale dalla risposta mostrata alla voce: figura mostra l'emoji, tradIt l'italiano, tradStra l'inglese
          const mostra = TIPI[tipo].figure ? x => x.emoji : tipo === 'tradStra' ? x => x.str : x => x.it
          const daTesto = new Map([...ammesse].map(k => voceDi(k)).filter(Boolean).map(x => [mostra(x), x]))
          for (const o of sbagliate)
            if (!daTesto.has(o.testo)) g.push(`${t.id}: «${p}» (${tipo}) ha una risposta fuori argomento: ${o.testo}`)
        }
      }
    }
  }
  return [...new Set(g)]
}

// Una parola nuova di una storia sta in data/words.js (o in verbi.js) con la
// categoria di un mondo: così finisce nel 📦 cassetto, e lo SRS la ripassa lì.
const CATEGORIA = new Map(WORDS.map(w => [w[0].toLowerCase(), w[3]]))
const VERBO = new Set(VERBI.map(v => v[0]))
const conUnMondo = w => (VERBO.has(w) && MONDI.some(m => m.verbi)) ||
  (CATEGORIA.has(w) && MONDI.some(m => m.categorie.includes(CATEGORIA.get(w))))
const CON_OPZIONI = new Set(['scelta', 'vf', 'chi'])

// Un capitolo si controlla da sé: ogni frase si accende, ogni «se» a volte
// è falso, nessuna pagina resta vuota, ogni domanda ha una sola giusta, e
// le parole sono quelle note alla tappa da cui si apre più quelle della
// storia (docs/lingue/libro.md).
export function guastiDelCapitolo(cap) {
  const g = []
  const dove = `capitolo ${cap.id}`
  const m = mondoDi(cap.mondo)
  if (!m || !pronto(m)) return [`${dove}: il mondo ${cap.mondo} non c'è o non ha tappe`]
  if (cap.pagine && cap.frasi) g.push(`${dove}: o pagine o frasi, non tutte e due`)
  const pagine = pagineDi(cap)
  if (!cap.titolo || !pagine.length || !cap.domande?.length) g.push(`${dove}: senza titolo, frasi o domande`)
  pagine.forEach((p, i) => { if (!Array.isArray(p) || !p.length) g.push(`${dove}: la pagina ${i + 1} è vuota`) })
  if (cap.dopo) {
    const t = tappaDi(cap.dopo)
    if (!t) return [...g, `${dove}: dopo una tappa che non c'è (${cap.dopo})`]
    if (t.mondo !== cap.mondo) g.push(`${dove}: dopo ${cap.dopo}, che è del mondo ${t.mondo}`)
  }
  if (cap.nuove !== undefined && !Array.isArray(cap.nuove)) g.push(`${dove}: nuove non è un elenco`)
  if (cap.serie !== undefined || cap.puntata !== undefined)
    if (!(typeof cap.serie === 'string' && cap.serie && Number.isInteger(cap.puntata) && cap.puntata >= 1))
      g.push(`${dove}: una puntata vuole serie (un id) e puntata (1, 2, 3…)`)
  if (g.length) return g
  const { tappa, note, nuove, storia } = lessicoDelCapitolo(cap)
  const forme = formeDelLibro(cap.mondo, tappa)
  const frasi = frasiDelCapitolo(cap)
  for (const f of frasi)
    if (f.forma && !forme.has(f.forma)) g.push(`${dove}: la forma ${f.forma} non è nota a ${tappa}`)

  // le parole nuove: davvero nuove, e con un cassetto dove ripassarle
  for (const w of nuove) {
    if (note.has(w)) g.push(`${dove}: «${w}» fra le nuove è già nota a ${tappa}`)
    if (!conUnMondo(w)) g.push(`${dove}: «${w}» fra le nuove non è in data/words.js o verbi.js con la categoria di un mondo`)
  }
  // le frasi con un nome (per le domande), e «Nella puntata prima…» in testa alle puntate dopo la prima
  const ids = frasi.filter(f => f.id).map(f => f.id)
  for (const id of new Set(ids)) if (ids.filter(x => x === id).length > 1) g.push(`${dove}: due frasi con l'id ${id}`)
  const dopoLaPrima = !!cap.serie && cap.puntata > 1
  frasi.forEach((f, i) => {
    if (f.riassunto && (!dopoLaPrima || i > 0)) g.push(`${dove}: «Nella puntata prima…» sta solo in testa a una puntata dopo la prima`)
    if (f.riassunto && (f.se || f.chi)) g.push(`${dove}: «Nella puntata prima…» c'è sempre, ed è il narratore`)
  })
  if (dopoLaPrima && !(frasi[0] && frasi[0].riassunto))
    g.push(`${dove}: la puntata ${cap.puntata} comincia con «Nella puntata prima…» (una frase con riassunto: true)`)
  cap.domande.forEach((d, i) => {
    const tipo = d.tipo || 'scelta'
    const qui = `${dove}: la domanda ${i + 1}`
    if (!TIPI_DOMANDA[tipo]) g.push(`${qui} ha un tipo sconosciuto (${tipo})`)
    if ((tipo === 'chi' || tipo === 'frase') && !d.frase) g.push(`${qui} non dice a quale frase rimanda`)
    if ((tipo === 'chi' || tipo === 'frase') && typeof d.frase === 'string' && !ids.includes(d.frase))
      g.push(`${qui} rimanda a una frase che non c'è (${d.frase})`)
    if (tipo === 'frase' && !d.testo) g.push(`${qui} non chiede niente: a «frase» serve il testo`)
    if (tipo === 'ordine' && !Array.isArray(d.fatti)) g.push(`${qui}: a «ordine» servono i fatti`)
  })
  if (g.length) return [...new Set(g)]
  let mondi
  try {
    for (const nome of Object.keys(cap.variabili)) valoriDi(cap, nome)
    mondi = mondiDi(cap)
  } catch (e) { return [...g, `${dove}: ${e.message}`] }
  if (!mondi.length) return [...g, `${dove}: nessuna combinazione rispetta i vincoli`]
  // le variabili di una serie si salvano per chiave: due valori con la stessa si confonderebbero
  if (cap.serie)
    for (const nome of Object.keys(cap.variabili)) {
      const chiavi = valoriDi(cap, nome).map(chiaveDelValore)
      if (new Set(chiavi).size !== chiavi.length) g.push(`${dove}: la variabile ${nome} ha due valori con la stessa chiave`)
    }

  const accese = new Map(), spente = new Map(), poste = new Map()
  const usate = new Set()                   // le parole della storia, in tutte le varianti
  for (const v of mondi) {
    pagine.forEach((p, i) => { if (!p.some(f => !f.se || f.se(v))) g.push(`${dove}: la pagina ${i + 1} a volte resta vuota`) })
    for (const [i, f] of frasi.entries()) {
      const on = !f.se || f.se(v)
      ;(on ? accese : spente).set(i, true)
      if (!on) continue
      let testo
      try { testo = rendi(f.en, v) } catch (e) { g.push(`${dove}: ${e.message}`); continue }
      const ignote = fuoriDalLessico(testo, cap)
      if (ignote.length) g.push(`${dove}: «${testo}» usa parole non note a ${tappa}: ${ignote.join(', ')}`)
      for (const b of paroleDellaStoriaIn(testo, cap).values()) usate.add(b)
      const storta = sgrammaticata(testo)
      if (storta) g.push(`${dove}: «${testo}» è sgrammaticata: ${storta}`)
      // ogni parola si tocca: deve avere una traduzione
      for (const w of testo.match(/[A-Za-z]+(?:[’'][A-Za-z]+)?/g) || [])
        if (!traduci(w).it) g.push(`${dove}: «${w}» toccata non dice niente`)
      // chi parla: un personaggio noto, una persona sola; la narrazione non dice io né tu
      const chi = chiDi(f, v)
      if (chi && !CHI_PARLA[chi]) g.push(`${dove}: «${testo}» la dice «${chi}», che non è un personaggio`)
      if (chi && /\?\s*(Yes|No)\b/.test(testo)) g.push(`${dove}: «${testo}» è domanda e risposta: due battute`)
      if (!chi && (/[“"]/.test(testo) || espandi(testo).some(w => IO_E_TU.has(w))))
        g.push(`${dove}: «${testo}» è detta da qualcuno: manca chi`)
    }
    const r = racconta(cap, v, sorte(7))
    for (const [i, d] of cap.domande.entries()) {
      if (d.se && !d.se(v)) continue
      poste.set(i, true)
      const tipo = d.tipo || 'scelta'
      const qui = `${dove}: la domanda ${i + 1} (${tipo})`
      const x = domandaIn(cap, d, v, sorte(7), r.righe)
      if (!x) {
        g.push(tipo === 'ordine' ? `${qui} ha meno di due fatti`
          : `${qui} rimanda a una frase che non si accende${tipo === 'chi' ? ' o che non è una battuta' : ''}`)
        continue
      }
      if (CON_OPZIONI.has(tipo)) {
        const nome = x.testo || x.citazione
        const giuste = x.opzioni.filter(o => o.giusta)
        if (giuste.length !== 1) g.push(`${dove}: «${nome}» ha ${giuste.length} risposte giuste`)
        if (x.opzioni.length < 2) g.push(`${dove}: «${nome}» ha una risposta sola`)
        // una scelta fra due si indovina una volta su due: vero/falso sì, una domanda a scelta no
        else if (tipo !== 'vf' && x.opzioni.length < 3) g.push(`${dove}: «${nome}» ha solo due risposte (servono \`anche\`)`)
        if (new Set(x.opzioni.map(o => o.testo)).size !== x.opzioni.length)
          g.push(`${dove}: «${nome}» ha due opzioni uguali`)
      }
      // la stessa battuta detta da due persone, o la stessa frase due volte: non c'è una giusta sola
      if (tipo === 'chi' && r.righe.some(y => y.en === x.citazione && y.chi !== r.righe[x.riga].chi))
        g.push(`${qui}: «${x.citazione}» la dicono in due`)
      if (tipo === 'frase' && r.righe.filter(y => y.en === x.soluzione).length > 1)
        g.push(`${qui}: «${x.soluzione}» è nel testo due volte`)
      if (tipo === 'ordine') {
        if (x.soluzione.length < 3 || x.soluzione.length > 4) g.push(`${qui} ha ${x.soluzione.length} fatti (ne vanno 3 o 4)`)
        if (new Set(x.soluzione).size !== x.soluzione.length) g.push(`${qui} ha due fatti uguali`)
      }
    }
  }
  frasi.forEach((f, i) => {
    if (!accese.has(i)) g.push(`${dove}: la frase ${i + 1} non si accende mai`)
    if (f.se && !spente.has(i)) g.push(`${dove}: la frase ${i + 1} ha un «se» che è sempre vero`)
  })
  cap.domande.forEach((d, i) => { if (!poste.has(i)) g.push(`${dove}: la domanda ${i + 1} non si fa mai`) })
  for (const v of Object.values(cap.variabili))
    if (v.da && v.fra) for (const en of v.fra)
      if (!note.has(en.toLowerCase()) && !storia.has(en.toLowerCase())) g.push(`${dove}: «${en}» non è nota a ${tappa}`)
  // le parole della storia: al massimo otto, e ogni nuova si usa
  if (usate.size > PAROLE_DELLA_STORIA_MAX)
    g.push(`${dove}: ${usate.size} parole della storia (al massimo ${PAROLE_DELLA_STORIA_MAX}): ${[...usate].join(', ')}`)
  for (const w of nuove) if (!note.has(w) && !usate.has(w)) g.push(`${dove}: «${w}» fra le nuove non si usa mai`)
  return [...new Set(g)]
}

// Le storie a puntate, tutte insieme: le puntate vanno 1, 2, 3… nello stesso
// mondo e in ordine di tappa, e ogni mondo tirato in una puntata si ritrova
// in quelle dopo, sulle variabili che hanno in comune (docs/lingue/libro.md).
export function guastiDelleSerie(capitoli) {
  const g = []
  const serie = new Map()
  for (const c of capitoli) if (c.serie) serie.set(c.serie, [...(serie.get(c.serie) || []), c])
  for (const [id, tutte] of serie) {
    const dove = `serie ${id}`
    const p = tutte.slice().sort((a, b) => a.puntata - b.puntata)
    if (p.length < 2) g.push(`${dove}: una puntata sola`)
    if (p.some((c, i) => c.puntata !== i + 1)) g.push(`${dove}: le puntate vanno 1, 2, 3… (${p.map(c => c.puntata).join(', ')})`)
    if (new Set(p.map(c => c.mondo)).size > 1) g.push(`${dove}: puntate in mondi diversi`)
    const m = mondoDi(p[0].mondo)
    const posto = c => (m ? m.tappe.findIndex(t => t.id === tappaDellaStoria(c)) : 0)
    for (let i = 1; i < p.length; i++)
      if (posto(p[i]) < posto(p[i - 1])) g.push(`${dove}: la puntata ${p[i].puntata} si apre prima della ${p[i - 1].puntata}`)
    for (let j = 1; j < p.length; j++) for (let i = 0; i < j; i++) {
      const comuni = Object.keys(p[i].variabili).filter(n => n in p[j].variabili)
      if (!comuni.length) continue
      const proietta = v => comuni.map(n => chiaveDelValore(v[n])).join(' | ')
      const dopo = new Set(mondiDi(p[j]).map(proietta))
      const manca = mondiDi(p[i]).map(proietta).find(k => !dopo.has(k))
      if (manca) g.push(`${dove}: la puntata ${p[j].puntata} non ha «${manca}» (${comuni.join(', ')}) della puntata ${p[i].puntata}`)
    }
  }
  return g
}
