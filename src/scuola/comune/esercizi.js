/* Cosa può chiedere la maestra e come si pescano le domande: la forma di un esercizio, il catalogo per l'editor
   delle lezioni, il pescatore e il racconto breve di una risposta. Gira in Node. Vedi docs/scuola/esercizi.md. */

import { Sorte, sorteQualunque } from '../../quiz/nucleo/sorte.js'
import { anniDelLivello } from '../../quiz/nucleo/classi.js'
import analogie from '../../quiz/moduli/analogie.js'
import animali from '../../quiz/moduli/animali.js'
import bilance from '../../quiz/moduli/bilance.js'
import calendario from '../../quiz/moduli/calendario.js'
import capire from '../../quiz/moduli/capire.js'
import coniugazione from '../../quiz/moduli/coniugazione.js'
import connettivi from '../../quiz/moduli/connettivi.js'
import conti from '../../quiz/moduli/conti.js'
import frazioni from '../../quiz/moduli/frazioni.js'
import geometria from '../../quiz/moduli/geometria.js'
import grafici from '../../quiz/moduli/grafici.js'
import grammatica from '../../quiz/moduli/grammatica.js'
import griglia from '../../quiz/moduli/griglia.js'
import indizi from '../../quiz/moduli/indizi.js'
import lessico from '../../quiz/moduli/lessico.js'
import lettere from '../../quiz/moduli/lettere.js'
import logica from '../../quiz/moduli/logica.js'
import misure from '../../quiz/moduli/misure.js'
import numero from '../../quiz/moduli/numero.js'
import orologio from '../../quiz/moduli/orologio.js'
import ortografia from '../../quiz/moduli/ortografia.js'
import problemi from '../../quiz/moduli/problemi.js'
import sequenze from '../../quiz/moduli/sequenze.js'
import sillabe from '../../quiz/moduli/sillabe.js'
import soldi from '../../quiz/moduli/soldi.js'
import tabelline from '../../quiz/moduli/tabelline.js'
import { SCHEDE } from '../giochi/elenco.js'
import { concettiDi as concettiMente } from '../giochi/asteroidi/scheda.js'

// i moduli che la maestra sceglie per tipologia e gradini (la voce «Le tabelline» usa conti e tabelline da sé)
const SCELTI = [analogie, animali, bilance, calendario, capire, coniugazione, connettivi, conti, frazioni,
  geometria, grafici, grammatica, griglia, indizi, lessico, lettere, logica, misure, numero, orologio,
  ortografia, problemi, sequenze, sillabe, soldi]

// tutti i moduli che una domanda della scuola può toccare: il registro della scuola li elenca uguali (un test lo guarda)
export const MODULI_USATI = [...SCELTI, tabelline]

const MATERIE = [
  { id: 'italiano', nome: 'Italiano', emoji: '📖' },
  { id: 'matematica', nome: 'Matematica', emoji: '🔢' },
  { id: 'spazio', nome: 'Spazio e figure', emoji: '📐' },
  { id: 'tempo', nome: 'Tempo e orologio', emoji: '🕰️' },
  { id: 'logica', nome: 'Logica', emoji: '🧩' },
  { id: 'scienze', nome: 'Scienze', emoji: '🔬' },
  { id: 'inglese', nome: 'Inglese', emoji: '🔤' },
  { id: 'programmazione', nome: 'Programmare', emoji: '🤖' },
]

/* ══════════════ le tabelline ══════════════ */

const TABELLINE = Array.from({ length: 10 }, (_, i) => i + 1)
const FATTORI = TABELLINE                    // la tabellina del 9 è 9 × 1 … 9 × 10
const GRADO_TABELLINA = 7                    // fino al 7 conti.js dà il metodo e i falsi della tabellina, oltre quelli delle colonne
const MODI = [
  { id: 'prodotto', nome: 'Il risultato', esempio: '9 × 7 = ?' },
  { id: 'nascosto', nome: 'Il numero nascosto', esempio: '9 × □ = 63' },
  { id: 'misti', nome: 'Tutti e due, mescolati', esempio: '9 × 7 = ? e 9 × □ = 63' },
]
const NOME_MODO = { prodotto: 'il risultato', nascosto: 'il numero nascosto', misti: 'risultato e numero nascosto' }

// «dell'1», «dell'8», «del 9»: l'articolo si elide davanti alla vocale
const elisa = n => n === 1 || n === 8 || n === 11
const con = (prep, n) => (elisa(n) ? `${prep}ll'${n}` : `${prep}l ${n}`)

function nomeTabelline(numeri) {
  const n = [...numeri].sort((a, b) => a - b)
  if (n.length === 1) return `Tabellina ${con('de', n[0])}`
  if (n.length === TABELLINE.length) return 'Tutte le tabelline'
  const filate = n.every((x, i) => i === 0 || x === n[i - 1] + 1)
  if (filate && n.length >= 3) return `Tabelline ${con('da', n[0])} ${con('a', n[n.length - 1])}`
  const nomi = n.map(x => con('de', x))
  return `Tabelline ${nomi.slice(0, -1).join(', ')} e ${nomi[nomi.length - 1]}`
}

/* ══════════════ il catalogo ══════════════ */

// la classe di scuola a cui un livello è adatto: 0 è la scuola dell'infanzia, 1..5 la primaria (6 anni = prima)
const classeDi = livello => Math.max(0, Math.min(5, Math.floor(anniDelLivello(livello)) - 5))

const VOCE_TABELLINE = {
  id: 'tabelline',
  tipo: 'tabelline',
  materia: 'matematica',
  nome: 'Le tabelline',
  icona: '🔟',
  spiega: 'Una o più tabelline a scelta, dal per 1 al per 10, col risultato da trovare o il numero nascosto.',
  tabelline: TABELLINE.map(n => ({ valore: n, nome: `Tabellina ${con('de', n)}` })),
  modi: MODI,
  base: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto' },
}

function voceDelModulo(m) {
  return {
    id: m.id,
    tipo: 'modulo',
    materia: m.materia,
    nome: m.nome,
    icona: m.icona,
    spiega: m.chiaro.charAt(0).toUpperCase() + m.chiaro.slice(1) + '.',
    gradini: m.scaletta.map((nome, i) => ({ grado: i + 1, nome, classe: classeDi(m.livelli[i]) })),
    tipologie: m.tipi.map(t => ({
      id: t.chiave,
      nome: t.nome,
      gradini: Object.keys(t.gradi).map(Number).filter(g => t.gradi[g] > 0).sort((a, b) => a - b),
    })),
    base: { tipo: 'modulo', modulo: m.id, da: 1, a: m.gradi, tipologie: [] },
  }
}

/* i giochi pronti (docs/scuola/giochi.md); quelli con un contenuto loro (`tipo`: i livelli di Passo passo, i capitoli del
   Robot) portano una voce nel catalogo, con `tipo` uguale all'id del tipo, e si fanno solo nel loro gioco */
const PRONTI = SCHEDE.filter(s => s.pronto !== false)
const conTipo = PRONTI.filter(s => s.tipo)
const padroneDi = e => conTipo.find(s => s.tipo.id === e?.tipo) || null
const voceDelGioco = s => ({ ...s.tipo.voce, id: s.tipo.id, tipo: s.tipo.id, materia: s.tipo.materia, gioco: s.id })

export const CATALOGO = {
  materie: MATERIE.map(mat => ({
    ...mat,
    voci: [
      ...(mat.id === 'matematica' ? [VOCE_TABELLINE] : []),
      ...SCELTI.filter(m => m.materia === mat.id).map(voceDelModulo),
      ...conTipo.filter(s => s.tipo.materia === mat.id).map(voceDelGioco),
    ],
  })).filter(mat => mat.voci.length),
}

const perId = id => SCELTI.find(m => m.id === id)

/* ══════════════ i giochi ══════════════ */

// dove si fa un esercizio: le schede con tutto il catalogo, un gioco vero con quello che sa fare (`accetta` della sua
// scheda) e col suo contenuto, se ne ha uno (docs/scuola/giochi.md)
const SCHEDE_DOMANDE = { id: 'schede', nome: 'Le domande', spiega: 'Il bambino risponde a una domanda alla volta, su una scheda, toccando la risposta: niente gioco intorno. Va con tutto quello che si può chiedere.' }
export const GIOCHI = [SCHEDE_DOMANDE, ...PRONTI]
const delCatalogo = e => e.tipo === 'tabelline' || e.tipo === 'modulo'
function accetta(g, e) {
  if (e.tipo === 'insieme') return e.parti.every(p => accetta(g, p.esercizio))
  if (!delCatalogo(e)) return g.tipo?.id === e.tipo
  return g.id === 'schede' || !!g.accetta?.(e)
}
/* un blocco che non chiede ancora niente, solo nell'editor: `{ tipo: 'niente', gioco? }`. Non è valido, quindi non si salva
   né parte; una scelta non nasce fatta (la convenzione dei giochi: niente valori di comodo) */
export const NIENTE = Object.freeze({ tipo: 'niente' })

/* quello di un esercizio che si fa a schede, quando il gioco non parte o la maestra chiede le domande: le parti del catalogo
   (le tabelline di un blocco misto col calcolo a mente); null se non resta niente (il contenuto di un gioco, il calcolo solo) */
export function perLeSchede(e) {
  const { gioco, difficolta, ...x } = e || {}
  const parti = x.tipo === 'insieme' ? x.parti.filter(p => delCatalogo(p.esercizio)) : delCatalogo(x) ? [{ esercizio: x }] : []
  if (!parti.length) return null
  return parti.length === 1 ? parti[0].esercizio : { tipo: 'insieme', parti }
}

// i giochi in cui si può fare questo esercizio (il campo `gioco` a parte)
export const giochiPer = e => GIOCHI.filter(g => accetta(g, e))
// quello che un gioco sa fare, per materia: le voci del catalogo che accetta (l'editor sceglie prima il gioco)
export function materieDelGioco(id) {
  const g = GIOCHI.find(x => x.id === id)
  if (!g) return []
  return CATALOGO.materie.map(m => ({ ...m, voci: m.voci.filter(v => accetta(g, v.base)) })).filter(m => m.voci.length)
}
// un gioco che mescola più cose in un blocco: quelli del catalogo, non quelli col contenuto loro
export const mescolaPiuCose = id => id === 'schede' || !!GIOCHI.find(g => g.id === id)?.accetta?.(VOCE_TABELLINE.base)
// un esercizio col contenuto di un gioco si fa sempre in quel gioco, anche senza il campo `gioco`
export const giocoDi = e => e?.gioco || padroneDi(e)?.id || 'schede'

/* la difficoltà del gioco, scelta dalla maestra (docs/scuola/giochi.md): un gioco che la regge ha nella scheda
   `difficolta: { facile, difficile }` (cosa cambia, per la maestra); «normale» è com'è a casa e non si scrive */
export const DIFFICOLTA = [
  { id: 'facile', nome: 'Facile' },
  { id: 'normale', nome: 'Normale' },
  { id: 'difficile', nome: 'Difficile' },
]
export const difficoltaDi = e => e?.difficolta || 'normale'

/* ══════════════ più cose insieme ══════════════ */

// un obiettivo può mescolare più esercizi, ognuno con la sua intensità («tanto l'8, un po' di ripasso del 3, 4, 5 e 6»):
// `{ tipo: 'insieme', parti: [{ esercizio, peso }] }`; una parte «tanto» esce quattro volte una «un po'»
export const PESI = [
  { id: 'poco', nome: 'Un po\'', volte: 1 },
  { id: 'normale', nome: 'Normale', volte: 2 },
  { id: 'tanto', nome: 'Tanto', volte: 4 },
]
export const MAX_PARTI = 6
const volteDi = peso => PESI.find(p => p.id === peso)?.volte ?? 1

/* il limite per gli Asteroidi (docs/asteroidi/scuola.md): le tabelline a gruppi, ognuno con quante volte esce e cosa chiede,
   e il calcolo a mente coi concetti delle sue stazioni e quante volte esce */
export function limiteAsteroidi(e) {
  const { gioco, difficolta, ...x } = e
  const parti = x.tipo === 'insieme' ? x.parti : [{ esercizio: x, peso: 'normale' }]
  const tab = parti.filter(p => p.esercizio.tipo === 'tabelline')
  const mente = parti.filter(p => p.esercizio.tipo === 'mente')
  const solo = parti.length === 1
  return {
    gruppi: tab.map(p => ({ tabelline: [...p.esercizio.tabelline], volte: solo ? 1 : volteDi(p.peso), modo: p.esercizio.modo })),
    ...(mente.length ? { mente: { concetti: [...new Set(mente.flatMap(p => concettiMente(p.esercizio)))],
                                  volte: solo ? 1 : mente.reduce((n, p) => n + volteDi(p.peso), 0) } } : {}),
  }
}

/* ══════════════ valido ══════════════ */

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)
const soloChiavi = (x, chiavi) => Object.keys(x).every(k => chiavi.includes(k))
const interi = (lista, da, a) => Array.isArray(lista) &&
  lista.every(n => Number.isInteger(n) && n >= da && n <= a) && new Set(lista).size === lista.length

// le classi (grado, tipologia) che l'esercizio lascia aperte; vuoto se l'esercizio non chiede niente
function classiDi(m, { da, a, tipologie }) {
  const out = []
  for (let g = da; g <= a; g++)
    for (const t of m.tipiDi(g))
      if (!tipologie.length || tipologie.includes(t.chiave)) out.push({ grado: g, tipo: t.chiave })
  return out
}

// anche contro un link manomesso: niente chiavi in più, niente valori fuori dal catalogo
// `nelGioco`: l'esercizio ha il suo gioco scritto, e allora un insieme può mescolare anche il contenuto di quel gioco che lo
// permette (`siMescola`: il calcolo a mente con le tabelline negli Asteroidi); senza, le parti sono solo del catalogo
export function valido(e, nelGioco = false) {
  if (!oggetto(e)) return false
  if ('difficolta' in e) {
    const { difficolta, ...resto } = e
    const g = GIOCHI.find(x => x.id === giocoDi(resto))
    return !!g?.difficolta && (difficolta === 'facile' || difficolta === 'difficile') && valido(resto, nelGioco)
  }
  if ('gioco' in e) {
    const g = GIOCHI.find(x => x.id === e.gioco)
    const { gioco, ...resto } = e
    return !!g && valido(resto, true) && accetta(g, resto)
  }
  if (e.tipo === 'insieme') {
    return soloChiavi(e, ['tipo', 'parti']) && Array.isArray(e.parti) && e.parti.length >= 2 && e.parti.length <= MAX_PARTI &&
      e.parti.every(p => oggetto(p) && soloChiavi(p, ['esercizio', 'peso']) && PESI.some(x => x.id === p.peso) &&
        oggetto(p.esercizio) && (delCatalogo(p.esercizio) || (nelGioco && !!padroneDi(p.esercizio)?.tipo.siMescola)) &&
        !('gioco' in p.esercizio) && valido(p.esercizio))
  }
  const padrone = padroneDi(e)
  if (padrone) { try { return padrone.tipo.valido(e) === true } catch { return false } }
  if (e.tipo === 'tabelline') {
    return soloChiavi(e, ['tipo', 'tabelline', 'modo']) &&
      interi(e.tabelline, 1, TABELLINE.length) && e.tabelline.length > 0 &&
      MODI.some(m => m.id === e.modo)
  }
  if (e.tipo === 'modulo') {
    if (!soloChiavi(e, ['tipo', 'modulo', 'da', 'a', 'tipologie'])) return false
    const m = typeof e.modulo === 'string' ? perId(e.modulo) : null
    if (!m || !m.tipi.length) return false
    if (!Number.isInteger(e.da) || !Number.isInteger(e.a) || e.da < 1 || e.a > m.gradi || e.da > e.a) return false
    if (!Array.isArray(e.tipologie) || new Set(e.tipologie).size !== e.tipologie.length) return false
    if (!e.tipologie.every(c => typeof c === 'string' && m.tipi.some(t => t.chiave === c))) return false
    return classiDi(m, e).length > 0
  }
  return false
}

/* ══════════════ descrivi ══════════════ */

const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)

export function descrivi(e, nelGioco = false) {
  if (!valido(e, nelGioco)) return 'Esercizio non valido'
  if ('difficolta' in e) { const { difficolta, ...resto } = e; return `${descrivi(resto, nelGioco)} · ${difficolta}` }
  if ('gioco' in e && e.gioco !== 'schede') { const { gioco, ...resto } = e; return `${descrivi(resto, true)} · ${GIOCHI.find(g => g.id === gioco).nei}` }
  if ('gioco' in e) { const { gioco, ...resto } = e; return descrivi(resto, true) }
  const padrone = padroneDi(e)
  if (padrone) return padrone.tipo.descrivi(e)
  if (e.tipo === 'insieme')
    return e.parti.map(p => `${descrivi(p.esercizio)} (${minuscola(PESI.find(x => x.id === p.peso).nome)})`).join(' + ')
  if (e.tipo === 'tabelline') return `${nomeTabelline(e.tabelline)} · ${NOME_MODO[e.modo]}`
  const m = perId(e.modulo)
  const parti = [m.nome]
  if (e.da === e.a) parti.push(m.scaletta[e.da - 1])
  else if (e.da > 1 || e.a < m.gradi) parti.push(`da «${m.scaletta[e.da - 1]}» a «${m.scaletta[e.a - 1]}»`)
  if (e.tipologie.length)
    parti.push('solo ' + m.tipi.filter(t => e.tipologie.includes(t.chiave)).map(t => minuscola(t.nome)).join(', '))
  return parti.join(' · ')
}

/* ══════════════ il pescatore ══════════════ */

// un giro mescolato di tutti gli elementi; il primo del giro nuovo non è l'ultimo del vecchio
function giri(lista, sorte, uguali) {
  let coda = []
  let ultimo = null
  return () => {
    if (!coda.length) {
      coda = sorte.mescola(lista)
      if (ultimo !== null && coda.length > 1 && uguali(coda[0], ultimo)) [coda[0], coda[1]] = [coda[1], coda[0]]
    }
    ultimo = coda.shift()
    return ultimo
  }
}

const RICORDA = 5        // un modulo non ripete una domanda fra le ultime cinque, se riesce
const TENTATIVI = 12

const impronta = d => JSON.stringify([d.testo, d.soggetto ?? null, d.risposte[d.giusta]])

function pescatoreTabelline(e, sorte) {
  const fatti = e.tabelline.flatMap(n => FATTORI.map(f => ({ n, f })))
  const prossimo = giri(fatti, sorte, (x, y) => x.n === y.n && x.f === y.f)
  const formaDi = new Map() // nei misti un fatto alterna le due forme da un giro all'altro
  const titolo = `${tabelline.icona} ${nomeTabelline(e.tabelline)}`
  return {
    prossima() {
      const { n, f } = prossimo()
      let forma = e.modo
      if (forma === 'misti') {
        const k = `${n}x${f}`
        const prima = formaDi.get(k)
        forma = prima ? (prima === 'prodotto' ? 'nascosto' : 'prodotto') : (sorte.forse() ? 'prodotto' : 'nascosto')
        formaDi.set(k, forma)
      }
      const d = conti.conto('conti:prodotto', GRADO_TABELLINA, n, f, sorte)
      const domanda = forma === 'nascosto' ? tabelline.nascosto(d, sorte) : { ...d, chiave: 'tab:prodotto' }
      return { domanda, pittori: {}, titolo }
    },
  }
}

function pescatoreModulo(e, sorte) {
  const m = perId(e.modulo)
  const prossima = giri(classiDi(m, e), sorte, (x, y) => x.grado === y.grado && x.tipo === y.tipo)
  const recenti = []
  const titolo = `${m.icona} ${m.nome}`
  return {
    prossima() {
      const { grado, tipo } = prossima()
      let d = m.genera(grado, sorte, tipo)
      for (let i = 0; i < TENTATIVI && recenti.includes(impronta(d)); i++) d = m.genera(grado, sorte, tipo)
      // se in dodici tentativi torna sempre una delle ultime, basta che non sia proprio l'ultima
      for (let i = 0; i < TENTATIVI && impronta(d) === recenti[recenti.length - 1]; i++) d = m.genera(grado, sorte, tipo)
      recenti.push(impronta(d))
      if (recenti.length > RICORDA) recenti.shift()
      return { domanda: d, pittori: m.pittori, titolo }
    },
  }
}

// le parti a turno pesato e liscio: con «tanto» e «un po'» quattro della prima per una della seconda, sparse e non a blocchi
function pescatoreInsieme(e, sorte) {
  const parti = e.parti.map(p => ({ pesca: pescatore(p.esercizio, sorte), volte: volteDi(p.peso), credito: 0 }))
  const totale = parti.reduce((s, x) => s + x.volte, 0)
  return {
    prossima() {
      for (const x of parti) x.credito += x.volte
      const scelta = parti.reduce((a, b) => (b.credito > a.credito ? b : a))
      scelta.credito -= totale
      return scelta.pesca.prossima()
    },
  }
}

export function pescatore(e, sorte = sorteQualunque()) {
  if (!valido(e)) throw new Error(`esercizio non valido: ${JSON.stringify(e)?.slice(0, 200)}`)
  if (!(sorte instanceof Sorte)) sorte = new Sorte(Number(sorte) || 1)
  { const { gioco, difficolta, ...resto } = e; e = resto }
  if (!delCatalogo(e) && e.tipo !== 'insieme') throw new Error(`questo esercizio si fa solo nel suo gioco: ${e.tipo}`)
  return e.tipo === 'insieme' ? pescatoreInsieme(e, sorte) : e.tipo === 'tabelline' ? pescatoreTabelline(e, sorte) : pescatoreModulo(e, sorte)
}

/* ══════════════ racconta ══════════════ */

export const LUNGO = 40

// una riga sola, tagliata a una parola intera con i puntini
function corto(s, max = LUNGO) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const taglio = t.slice(0, max - 1)
  const spazio = taglio.lastIndexOf(' ')
  return (spazio > max / 2 ? taglio.slice(0, spazio) : taglio).replace(/[\s,.;:]+$/, '') + '…'
}

// di più righe si tiene l'ultima che chiede (in «indizi» e «logica» la domanda è in fondo), se no la prima
function rigaDellaDomanda(testo) {
  const righe = String(testo ?? '').split('\n').map(r => r.trim()).filter(Boolean)
  const chiede = righe.filter(r => r.endsWith('?'))
  return (chiede.length ? chiede[chiede.length - 1] : righe[0]) || ''
}

function rispostaDetta(d, i) {
  const r = Number.isInteger(i) ? d?.risposte?.[i] : null
  if (!r) return '—'
  if (r.testo !== undefined) return corto(r.testo)
  if (r.nome) return corto(r.emoji ? `${r.emoji} ${r.nome}` : r.nome)
  if (r.emoji) return r.emoji
  return `la figura ${i + 1}` // un disegno senza nome: il posto in cui il bambino l'ha visto
}

export function racconta(d, indice) {
  const conto = /^(.+) = \?$/.exec(String(d?.testo ?? '').trim()) // «9 × 7 = ?» si dice «9 × 7»
  let fatto
  if (conto) fatto = conto[1]
  else {
    const s = d?.soggetto
    const chiede = rigaDellaDomanda(d?.testo)
    if (typeof s?.testo === 'string') fatto = `${chiede} ${s.testo}`
    else if (s?.nome) fatto = `${[s.emoji, s.nome].filter(Boolean).join(' ')} · ${chiede}`
    else fatto = [s?.emoji, chiede].filter(Boolean).join(' ')
  }
  return { fatto: corto(fatto), data: rispostaDetta(d, indice), attesa: rispostaDetta(d, d?.giusta) }
}

/* una risposta degli Asteroidi (docs/asteroidi/scuola.md): `testo` «9 × 7 = ?», `data` il numero del sasso colpito (null se il
   giusto è caduto), `attesa` il risultato */
export function raccontaAsteroide({ testo, data, attesa } = {}) {
  const conto = /^(.+) = \?$/.exec(String(testo ?? '').trim())
  return { fatto: corto(conto ? conto[1] : testo), data: data == null ? '—' : corto(data), attesa: attesa == null ? '—' : corto(attesa) }
}
