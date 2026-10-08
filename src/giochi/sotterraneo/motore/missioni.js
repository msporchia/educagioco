// Le missioni dei personaggi, senza schermo (docs/sotterraneo/missioni.md). Lo stato di un'avventura è
// `cfg.avventure[eroe].missioni`: { [id]: 'presa' | 'fatta' | 'consegnata' }, una missione mai presa non c'è.
// Qui: quali missioni si sono sbloccate (l'albero), quante se ne offrono insieme, cosa dice un personaggio, il
// segno sopra la sua testa, prendere e consegnare, il diario e il promemoria, e dove la discesa mette la cosa da
// trovare e il mostro col nome. Gira in Node.
import { MISSIONI, PERSONAGGI, personaDi, missioneDi, premioDetto, PIU_DURO, TETTO, posto } from '../dati/missioni.js'
import { MOSTRI } from '../dati/mostri.js'
import { CAMPAGNA, guardianoDi } from '../dati/campagna.js'
import { seminato } from './livello.js'

export const PRESA = 'presa', FATTA = 'fatta', CONSEGNATA = 'consegnata'

const statoDi = (stati, id) => (stati && typeof stati === 'object' ? stati[id] || null : null)

// L'ordine della storia: la discesa in fila (dati/campagna.js), poi il piano
const indiceDi = chiave => { const i = posto(chiave); return i < 0 ? 999 : i }
const dellaStoria = (a, b) => indiceDi(a.discesa) - indiceDi(b.discesa) || a.piano - b.piano

export const titoloDi = m => (m.tipo === 'trova' ? m.cosa.nome : m.mostro.nome)

/* ═══════════ l'albero: cosa si sblocca da sola ═══════════ */

// `tappe` sono quelle dell'avventura, [{ chiave, aperta, fatta }] (come le dà Gioco.vue)
function soddisfatto(r, stati, tappe) {
  if (r.fatta) { const t = tappe.find(x => x.chiave === r.fatta); return !!(t && t.fatta) }
  if (r.consegnata) return statoDi(stati, r.consegnata) === CONSEGNATA
  return false   // un requisito che non si conosce non si sblocca mai (guastiDelleMissioni lo dice)
}

// sbloccata: la sua discesa è aperta e ci sono tutti i suoi requisiti. Non dice se è già stata presa
export function sbloccata(m, stati, tappe) {
  const giu = tappe || []
  const t = giu.find(x => x.chiave === m.discesa)
  return !!(t && t.aperta) && (m.richiede || []).every(r => soddisfatto(r, stati, giu))
}

// le missioni sbloccate e mai toccate, quelle che si potrebbero proporre: la discesa più avanti prima (è la più
// vicina a dove è arrivato l'eroe), a pari discesa il piano più in alto
export function sbloccate(stati, tappe) {
  return MISSIONI.filter(m => !statoDi(stati, m.id) && sbloccata(m, stati, tappe))
    .sort((a, b) => indiceDi(b.discesa) - indiceDi(a.discesa) || a.piano - b.piano)
}

// quelle che l'eroe ha in mano: prese, o fatte e da consegnare (anche se uno stato di prima ne ha di più)
export const inMano = stati =>
  MISSIONI.filter(m => [PRESA, FATTA].includes(statoDi(stati, m.id))).sort(dellaStoria)

// quelle che il mondo offre adesso, col «!»: le sbloccate, finché con quelle in mano non si arriva al TETTO.
// Chi ne ha tante in mano non ne vede altre finché non ne consegna una
export const offerte = (stati, tappe) =>
  sbloccate(stati, tappe).slice(0, Math.max(0, TETTO - inMano(stati).length)).sort(dellaStoria)

// tutte le aperte insieme, nell'ordine della storia
export const aperte = (stati, tappe) => [...inMano(stati), ...offerte(stati, tappe)].sort(dellaStoria)

/* ═══════════ cosa dice un personaggio ═══════════ */

const FASI = ['consegna', 'offre', 'aspetta']

// Cosa ha da dire `chi` adesso: tutte le sue missioni aperte, ognuna con la sua fase (da consegnare, nuova,
// presa e non ancora fatta); `fase` è quella che conta per il segno: prima il da consegnare, poi la nuova, poi
// l'attesa. Senza niente di aperto, saluta e basta
export function cosaDice(chi, stati, tappe) {
  const voci = []
  for (const m of inMano(stati)) if (m.da === chi) voci.push({ missione: m, fase: statoDi(stati, m.id) === FATTA ? 'consegna' : 'aspetta' })
  for (const m of offerte(stati, tappe)) if (m.da === chi) voci.push({ missione: m, fase: 'offre' })
  voci.sort((a, b) => FASI.indexOf(a.fase) - FASI.indexOf(b.fase) || dellaStoria(a.missione, b.missione))
  const prima = voci[0] || null
  return { fase: prima ? prima.fase : 'saluto', missione: prima ? prima.missione : null, voci }
}

// il segno sopra la testa, come nei giochi di ruolo: 'nuova' («!» d'oro) ha una missione per te; 'attesa' («?»
// grigio, fermo) l'hai presa e non è ancora fatta; 'consegna' («?» d'oro che pulsa) l'hai fatta, torna da lui.
// Se ne ha più d'una vince la consegna, poi la nuova, poi l'attesa; niente a tutti gli altri
const SEGNI = { consegna: 'consegna', offre: 'nuova', aspetta: 'attesa' }
export const GLIFO = { nuova: '!', attesa: '?', consegna: '?' }
export function segnoDi(chi, stati, tappe) {
  return SEGNI[cosaDice(chi, stati, tappe).fase] || null
}

// chi aspetta una consegna adesso: le chiavi dei personaggi (e del minatore) con una missione fatta da riportare
export const chiAspetta = stati => [...new Set(MISSIONI.filter(m => statoDi(stati, m.id) === FATTA).map(m => m.da))]

const maiuscola = s => s.charAt(0).toUpperCase() + s.slice(1)
const ARTICOLO = /^(la|il|lo|le|i|gli|l')\b\s*/i
// «La collana della nonna» in mezzo a una frase è «la collana…»; «Rosicchione» resta com'è
export const inFrase = nome => (ARTICOLO.test(nome) ? nome.charAt(0).toLowerCase() + nome.slice(1) : nome)
const NUMERI = ['', 'un', 'due', 'tre', 'quattro']

// le frasi con cui il minatore, indicando la strada, dice chi ha qualcosa per te: una riga per chi, prima chi ti
// aspetta per la consegna, poi chi ha un favore da chiederti, poi chi aspetta ancora. Niente per lui stesso
export function chiTiCerca(stati, tappe) {
  const per = new Map()   // chi → voci
  for (const m of aperte(stati, tappe)) {
    if (m.da === 'minatore' || !PERSONAGGI[m.da]) continue
    const fase = statoDi(stati, m.id) === FATTA ? 'consegna' : statoDi(stati, m.id) === PRESA ? 'aspetta' : 'offre'
    if (!per.has(m.da)) per.set(m.da, [])
    per.get(m.da).push({ m, fase })
  }
  const righe = []
  for (const [da, voci] of per) {
    const Chi = maiuscola(PERSONAGGI[da].chi)
    const fase = FASI.find(f => voci.some(v => v.fase === f))
    const queste = voci.filter(v => v.fase === fase)
    const testo = fase === 'consegna' ? `${Chi} ti aspetta: quello che ti ha chiesto l'hai fatto.`
      : fase === 'offre' ? `${Chi} ha ${queste.length === 1 ? 'un favore' : `${NUMERI[queste.length] || queste.length} favori`} da chiederti.`
      : `${Chi} aspetta ancora: ${queste.map(v => inFrase(titoloDi(v.m))).join(', ')}.`
    righe.push({ fase, testo })
  }
  return righe.sort((a, b) => FASI.indexOf(a.fase) - FASI.indexOf(b.fase)).map(r => r.testo)
}

/* ═══════════ prendere, fare, consegnare ═══════════ */

// le funzioni che cambiano lo stato tornano lo stato nuovo, o null se non c'era niente da fare. Si prende solo
// una missione che il mondo offre adesso: sbloccata e dentro il tetto
export function prendi(stati, id, tappe) {
  if (!missioneDi(id) || statoDi(stati, id)) return null
  if (!offerte(stati, tappe).some(m => m.id === id)) return null
  return { ...(stati || {}), [id]: PRESA }
}

export function fatte(stati, ids) {
  const nuovi = { ...(stati || {}) }
  let cambiato = false
  for (const id of ids) if (statoDi(stati, id) === PRESA) { nuovi[id] = FATTA; cambiato = true }
  return cambiato ? nuovi : null
}

// il premio va sulla roba (un Corredo): le gemme si sommano, una cosa va addosso se è meglio, se no in tasca. A
// tasche piene la consegna aspetta (torna 'pieno'). Le monete non sono della roba: le torna in `monete`, e le
// paga chi chiama (Gioco.vue, dalla borsa del gioco: passano dal salvadanaio della varietà come ogni altra)
export function consegna(stati, id, corredo) {
  const m = missioneDi(id)
  if (!m || statoDi(stati, id) !== FATTA) return null
  const p = m.premio
  if (p.cosa) {
    if (corredo.nonCiStarebbe(p.cosa)) return { stati, esito: 'pieno', monete: 0 }
    corredo.prendi(p.cosa)
  }
  if (p.gemme) corredo.gemme += p.gemme
  return { stati: { ...stati, [id]: CONSEGNATA }, esito: 'consegnata', monete: p.monete || 0 }
}

// le missioni prese che riguardano questa discesa: la Corsa le mette nei piani
export const presePer = (stati, chiaveTappa) =>
  MISSIONI.filter(m => m.discesa === chiaveTappa && statoDi(stati, m.id) === PRESA)

/* ═══════════ il diario e il promemoria ═══════════ */

const PIANI = ['', 'primo', 'secondo', 'terzo', 'quarto', 'quinto']
const alPiano = n => `al ${PIANI[n] || n + '°'} piano`
const nomeDiscesa = chiave => (CAMPAGNA.find(t => t.chiave === chiave) || {}).nome || chiave
// «da la ragazza» non si dice: dalla ragazza, dal mugnaio, dall'eremita
export const daLui = chi => chi.replace(/^la /, 'dalla ').replace(/^il /, 'dal ').replace(/^l'/, 'dall\'')

function voceDiario(m, stato) {
  const p = personaDi(m.da)
  return {
    id: m.id, stato, tipo: m.tipo, da: m.da,
    titolo: titoloDi(m), em: m.tipo === 'trova' ? m.cosa.em : '👑',
    chi: p.nome, chiFrase: p.chi,
    discesa: m.discesa, dove: nomeDiscesa(m.discesa), piano: m.piano + 1,
    premio: premioDetto(m.premio),
    ...(stato === FATTA ? { tornaDa: daLui(p.chi), torna: `Torna ${daLui(p.chi)}: ${m.tipo === 'trova' ? 'hai' : 'hai battuto'} ${inFrase(titoloDi(m))}` } : {}),
  }
}

// Il riassunto delle missioni di un'avventura, per la terra di sopra: quelle in mano (da fare, o fatte e da
// consegnare), quelle che aspettano di essere prese, quelle già consegnate. `nascoste` sono sbloccate ma non
// offerte per il tetto: il diario lo dice, o chi ne ha tre in mano non capirebbe perché non ne arrivano
export function diario(stati, tappe) {
  const mano = inMano(stati).map(m => voceDiario(m, statoDi(stati, m.id)))
  const offerta = offerte(stati, tappe).map(m => voceDiario(m, 'offerta'))
  const finite = MISSIONI.filter(m => statoDi(stati, m.id) === CONSEGNATA).sort(dellaStoria).map(m => voceDiario(m, CONSEGNATA))
  return {
    inMano: mano, pronte: mano.filter(v => v.stato === FATTA), daFare: mano.filter(v => v.stato !== FATTA),
    offerte: offerta, consegnate: finite,
    aperte: mano.length + offerta.length,
    nascoste: Math.max(0, sbloccate(stati, tappe).length - offerta.length),
    tetto: TETTO,
  }
}

// La riga in cima a una discesa, per ogni missione che la riguarda e non è ancora consegnata: cosa, e a che piano.
// Sul piano giusto dice cosa cercare (il forziere d'oro, il mostro con la corona), oltre quel piano che è sfuggita;
// una volta fatta ricorda a chi riportarla. `piano` è quello di adesso, da 1 (null fuori da una discesa)
export function promemoria(stati, chiaveTappa, piano = null) {
  const queste = MISSIONI.filter(m => m.discesa === chiaveTappa && [PRESA, FATTA].includes(statoDi(stati, m.id))).sort(dellaStoria)
  return queste.map(m => {
    const em = m.tipo === 'trova' ? m.cosa.em : '👑'
    const nome = inFrase(titoloDi(m))
    if (statoDi(stati, m.id) === FATTA)
      return { id: m.id, dove: 'fatta', em, testo: `Missione compiuta: ${nome}, torna ${daLui(personaDi(m.da).chi)}` }
    const giusto = m.piano + 1
    const dove = piano == null || piano < giusto ? 'sopra' : piano === giusto ? 'qui' : 'oltre'
    const testo = dove === 'qui'
      ? (m.tipo === 'trova' ? `${nome} è su questo piano: cerca il forziere d'oro` : `${nome} è su questo piano: cerca il mostro con la corona`)
      : dove === 'oltre'
        ? `${nome} era ${alPiano(giusto)}: ti è sfuggita, la riprendi con un'altra discesa`
        // più in basso: la freccina punta alla scala (rotta), e la riga dice cosa fare
        : (m.tipo === 'trova' ? `${nome} è ${alPiano(giusto)}: scendi` : `${nome} sta ${alPiano(giusto)}: scendi`)
    return { id: m.id, dove, em, testo: `Missione: ${testo}` }
  })
}

/* ═══════════ la freccina: da che parte andare ═══════════ */

const verso = (da, a) => Math.round(Math.atan2(a.y - da.y, a.x - da.x) * 180 / Math.PI)   // 0 a destra, in senso orario
const distanza = (da, a) => Math.hypot(a.x - da.x, a.y - da.y)

// In discesa: da che parte sta la missione presa e non ancora fatta più vicina (docs/sotterraneo/missioni.md, «La
// freccina»). Sul piano giusto punta alla cosa (il forziere d'oro, il mostro con la corona), più in basso alla scala
// che scende; una già sfuggita (piano passato) o fatta non c'è. È una direzione e non una strada, e non guarda
// la nebbia: indica anche verso il buio, che è il motivo per andarci. `c` è la Corsa (o quel che le somiglia:
// `missioni`, `missioniFatte`, `piano`, `eroe`, `livello.robe`). Senza niente da seguire torna null
export function rotta(c) {
  const robe = c.livello.robe
  const scala = robe.find(r => r.che === 'scala')
  let meglio = null
  for (const m of c.missioni || []) {
    if (c.missioniFatte.has(m.id) || m.piano < c.piano) continue
    let dove, quale
    if (m.piano === c.piano) {
      const r = robe.find(x => x.missione === m.id && !x.morto && !x.aperto)
      if (!r) continue
      dove = { x: r.fx != null ? r.fx : r.x + 0.5, y: r.fy != null ? r.fy : r.y + 0.5 }
      quale = 'qui'
    } else {
      if (!scala) continue
      dove = { x: scala.x + 0.5, y: scala.y + 0.5 }
      quale = 'scala'
    }
    const d = distanza(c.eroe, dove)
    if (!meglio || d < meglio.distanza) meglio = { id: m.id, verso: quale, x: dove.x, y: dove.y, distanza: d }
  }
  if (!meglio) return null
  const m = missioneDi(meglio.id)
  return { ...meglio, gradi: verso(c.eroe, meglio), em: m.tipo === 'trova' ? m.cosa.em : '👑', nome: inFrase(titoloDi(m)) }
}

// Sulla terra di sopra: la discesa verso cui puntare. Quella con una missione presa e non fatta, la più vicina a
// `da`; `posti` dice dove sta ogni discesa ({ [chiave]: { x, y } }). Se qualcuno aspetta una consegna la freccia
// d'oro ha la precedenza (chiAspetta) e questa non c'è: una cosa alla volta da ricordare
export function discesaDaSeguire(stati, da, posti) {
  if (chiAspetta(stati).length) return null
  let meglio = null
  for (const m of MISSIONI) {
    if (statoDi(stati, m.id) !== PRESA || !posti[m.discesa]) continue
    const d = distanza(da, posti[m.discesa])
    if (!meglio || d < meglio.distanza) meglio = { discesa: m.discesa, distanza: d }
  }
  return meglio ? meglio.discesa : null
}

/* ═══════════ dove sta, giù ═══════════ */

// Dove sta, in un piano già fatto, la cosa di una missione: in una stanza che non è l'ingresso, la scala o il
// portale, su una cella libera lontana dalle porte. Un caso tutto suo (seme del piano e nome della missione): il
// caso della discesa non si sposta, e rientrando la cosa è nello stesso posto
export function postoPer(livello, m) {
  let h = 7
  for (const ch of m.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const rnd = seminato(livello.seme * 13 + livello.piano * 7919 + h)
  const buone = livello.stanze.filter(s => !['ingresso', 'uscita', 'portale'].includes(s.ruolo))
  const stanze = buone.length ? buone : livello.stanze.filter(s => s.ruolo !== 'ingresso')
  for (let giro = 0; giro < 60; giro++) {
    const s = stanze[Math.floor(rnd() * stanze.length)]
    if (!s) return null
    const x = s.x + 1 + Math.floor(rnd() * Math.max(1, s.w - 2)), y = s.y + 1 + Math.floor(rnd() * Math.max(1, s.h - 2))
    if (livello.calpestabile(x, y) && !livello.robeSu(x, y).length && !livello.porteVicine(x, y)) return { x, y }
  }
  return null
}

// la roba di una missione per un piano: il forziere che si riconosce, o il mostro col nome più duro dei suoi
export function robaDellaMissione(livello, m, tappa) {
  const dove = postoPer(livello, m)
  if (!dove) return null
  if (m.tipo === 'trova')
    return { che: 'forziere', x: dove.x, y: dove.y, em: m.cosa.em, nome: m.cosa.nome,
             pelle: 'forziere-oro-chiuso', aperto: false, missione: m.id }
  const r = livello.mostro(m.mostro.tipo, dove.x, dove.y)
  const g = livello.mostro(guardianoDi(tappa, livello.piano), dove.x, dove.y)
  r.ossa = r.ossaMax = Math.round(Math.max(r.ossa * PIU_DURO.ossa, g.ossa))
  r.att = Math.max(r.att, g.att) + PIU_DURO.att
  r.dif = Math.max(r.dif, MOSTRI[m.mostro.tipo].dif)
  return { ...r, nome: m.mostro.nome, missione: m.id }
}
