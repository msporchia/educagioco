// I mostri del mondo di sopra (docs/sotterraneo/mondo-aperto-mostri.md): chi vive in ogni zona del mondo a percorso
// (motore/mondo-percorso.js), dove dorme, quando si sveglia, chi entra nello scontro, cosa resta dopo. La mappa non cambia mai; quello
// che ci vive nasce da (eroe, giro), e il giro sale a ogni ritorno in città. Una zona è una stanza grande: i suoi mostri non ne escono,
// e non entrano mai nel villaggio, nella cintura del generatore, su un ponte o un valico. Le zone si popolano quando il mondo le carica e
// si dimenticano quando le butta (i morti restano, per zona). Lo scontro è quello dei dungeon, giocato da una Corsa su un palco di una
// stanza (motore/palco.js). Puro, senza scena: gira in Node. Il contratto con la scena: docs/sotterraneo/mondo-sopra-contratto.md
import { MOSTRI_IN_CAMPO, RAGGIO_SCONTRO, MANA_PER_PASSO } from '../dati/mondo.js'
import { forzaDellaZona, spintaDellaZona, MARGINE } from '../dati/zone.js'
import { COSE } from '../dati/cose.js'
import { rangoDellaRarita } from '../dati/pezzi.js'
import { ABITANTI_DI_SOPRA, CURVA_DI_SOPRA, SOPRA } from '../dati/mondo-aperto-mostri.js'
import { ERBA, livelloDi, zonaDi } from './mondo-percorso.js'
import { Livello, seminato } from './livello.js'
import { Corsa } from './corsa.js'
import { PALCO, EROE_SUL_PALCO } from './palco.js'
import { tiroDalSeme } from './bottino.js'

// 2 dal mondo a percorso (i morti per zona); un salvato di prima (1, i morti per indice del mondo ad anelli) vale come storto
export const VERSIONE_SOPRA = 2
// l'indice di un mostro è `zona × BLOCCO_ZONA + j`: stabile anche ricaricando la zona, e con le zone non caricate che fanno i buchi
export const BLOCCO_ZONA = 1000

/* ═══════════ quanto è forte un mostro di sopra ═══════════ */

// la riga della curva al livello L: in linea retta fra due punti, oltre l'ultimo la curva delle zone (le terre dopo, fino al 71)
export function crescitaDiSopra(L) {
  const c = CURVA_DI_SOPRA, l = Math.max(1, L)
  const ultimo = c[c.length - 1]
  if (l >= ultimo.livello) return { forza: forzaDellaZona(l, null), spinta: Math.max(ultimo.spinta, spintaDellaZona(l)), branco: ultimo.branco, gradi: 1 }
  let i = 0
  while (c[i + 1].livello <= l) i++
  const a = c[i], b = c[i + 1], t = (l - a.livello) / (b.livello - a.livello)
  const tra = (p, q) => Math.round((p + (q - p) * t) * 100) / 100
  return { forza: tra(a.forza, b.forza), spinta: tra(a.spinta, b.spinta), branco: a.branco, gradi: a.gradi ?? 1 }
}

// chi vive in un luogo del mondo: la scheda (i sei delle terre selvagge) o ABITANTI_DI_SOPRA
export const abitantiDi = R => (R.abitanti ? { mostri: R.abitanti, caporale: R.caporale } : ABITANTI_DI_SOPRA[R.chiave] || null)
const fuoriDalVillaggio = R => !!R && R.chiave !== 'villaggio' && !!R.fascia

// una «fabbrica» di mostri: i metodi `mostro` e `faiCaporale` del Livello, al livello L, senza un piano attorno (gli stessi numeri, varianti
// e gradi di un dungeon a quel livello)
function fabbrica(L, rnd) {
  const c = crescitaDiSopra(L)
  const f = Object.create(Livello.prototype)
  f.piano = 0
  f.crescita = { ossa: 0.22, attOgni: 2, forza: c.forza, spinta: c.spinta, caporali: 0, grosso: 0, gradi: c.gradi }
  f.livelloDelPosto = L
  f.rndVarianti = rnd
  return f
}

/* ═══════════ dove possono stare (per mondo, zona per zona) ═══════════ */

const marca = (m, a, x, y, r, v = 1) => {
  const r2 = r * r
  for (let j = Math.max(0, Math.floor(y - r)); j <= Math.min(m.H - 1, Math.ceil(y + r)); j++)
    for (let i = Math.max(0, Math.floor(x - r)); i <= Math.min(m.W - 1, Math.ceil(x + r)); i++)
      if ((i - x) * (i - x) + (j - y) * (j - y) <= r2) a[j * m.W + i] = v
}

// `casa[k]`: la zona dove un mostro può camminare in quella cella (−1: mai, è villaggio, cintura, ponte, valico, vicino a un confine,
// acqua, roccia…); `nido[k]`: lì può nascere un branco (lontano dalle strade e dai posti). `cintura` è quella del generatore. Si fanno
// per una zona quando le sue celle sono scritte (caricata almeno una volta), e restano: le celle non cambiano più
const SPAZI = new WeakMap()
export function spaziDi(m) {
  let s = SPAZI.get(m)
  if (!s) {
    const N = m.W * m.H
    const presso = new Uint8Array(N)
    for (const c of m.confini) for (const p of c.celle) marca(m, presso, p.x, p.y, SOPRA.daConfine)
    s = { casa: new Int8Array(N).fill(-1), nido: new Uint8Array(N), cintura: m.cintura, presso, vietato: new Uint8Array(N), fatte: new Set() }
    SPAZI.set(m, s)
  }
  for (let k = 0; k < m.zone.length; k++) if (!s.fatte.has(k) && m.zone[k].area != null) spaziDellaZona(m, s, k)
  return s
}
function spaziDellaZona(m, s, k) {
  const Z = m.zone[k], { x0, y0, x1, y1 } = Z.rettangolo, W = m.W
  const { casa, nido, presso, vietato } = s
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const c = y * W + x
    if (m.zona[c] !== k) continue
    if (m.strada[c]) marca(m, vietato, x, y, SOPRA.daStrada)
    if (!(m.reg[c] > 0) || m.terreno[c] !== ERBA || m.ponte[c] >= 0 || m.varco[c] >= 0 || m.blocco[c] || m.isola[c] || m.zonaCitta[c]
        || m.cintura[c] || presso[c]) continue
    casa[c] = k
  }
  for (const p of m.posti) if (p.zona === Z.chiave) for (const c of [p.accanto, p.piede]) if (c) marca(m, vietato, c.x, c.y, SOPRA.daiPosti)
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = y * W + x; if (casa[c] === k && !vietato[c]) nido[c] = 1 }
  s.fatte.add(k)
}
// una cella dove si è al sicuro (il villaggio, la cintura, un ponte o un varco, una zona mai caricata): lì nessuno si sveglia e nessuno insegue
export function alSicuro(m, x, y) {
  const X = Math.floor(x), Y = Math.floor(y)
  if (X < 0 || Y < 0 || X >= m.W || Y >= m.H) return true
  const k = Y * m.W + X
  return m.zona[k] < 0 || !!m.zonaCitta[k] || !!m.cintura[k] || m.ponte[k] >= 0 || m.varco[k] >= 0 || !(m.reg[k] > 0)
}

/* ═══════════ chi vive sopra, per (eroe, giro) ═══════════ */

const fnv = (...cose) => {
  let h = 2166136261
  for (const c of cose) for (const ch of String(c)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}
// «Il cimitero vecchio» → «del cimitero vecchio», «Le rovine del guado» → «delle rovine del guado»
const ARTICOLATE = { il: 'del', la: 'della', i: 'dei', le: 'delle', lo: 'dello', gli: 'degli', "l'": "dell'" }
export const dellaRegione = nome => nome.replace(/^(Il|La|I|Le|Lo|Gli|L')\s*/i, (_, a) => `${ARTICOLATE[a.toLowerCase()]}${a.endsWith("'") ? '' : ' '}`)
const mescola = (lista, rnd) => { for (let i = lista.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [lista[i], lista[j]] = [lista[j], lista[i]] } return lista }
export const cellePerBranco = k => (Array.isArray(SOPRA.cellePerBranco) ? SOPRA.cellePerBranco[Math.min(k, SOPRA.cellePerBranco.length - 1)] : SOPRA.cellePerBranco)

// Lo stato del mondo coi mostri: `mostri` (per indice, coi buchi delle zone non caricate: `zona × BLOCCO_ZONA + j`), `lista` (gli stessi in
// fila, per scorrerli), `branchi` (per indice di branco), `tane` (una per luogo delle zone caricate), `zone` (quelle popolate), `mortiFuori`
// (i morti delle zone dimenticate, per chiave di zona), più quello che si salva (`passi`, `forze`, `perTerra`). `eroe`: la chiave
// dell'avventura (il seme del contenuto), `giro`: quante volte si è entrati in città. `seme`: per le prove, al posto di (eroe, giro)
function statoNuovo(m, eroe, giro, seme) {
  const base = seme != null ? seme >>> 0 : fnv(m.seme, eroe, giro)
  return { v: VERSIONE_SOPRA, mondo: m, eroe, giro, base, mostri: [], lista: [], branchi: {}, tane: [], zone: new Set(), mortiFuori: {}, signoriMorti: new Set(),
           passi: 0, forze: null, perTerra: [], manaResto: 0 }
}
export function popolaMondo({ mondo: m, eroe = 'eroe', giro = 0, seme = null }) {
  const stato = statoNuovo(m, eroe, giro, seme)
  allineaZone(stato)
  return stato
}

// Le zone dello stato come quelle del mondo: si popolano quelle appena caricate, si dimenticano quelle buttate (i morti che devono ancora
// tornare restano in `mortiFuori`, e tornano morti ricaricando). La chiamano da sé muoviMostri, cammina e incontro. Torna { nate, dimenticate }
export function allineaZone(stato) {
  const m = stato.mondo, nate = [], dimenticate = []
  for (let k = 0; k < m.zone.length; k++) {
    const su = !!m.zonaCaricata[k], c = stato.zone.has(k)
    if (su && !c) { popolaZona(stato, k); nate.push(k) } else if (!su && c) { dimenticaZona(stato, k); dimenticate.push(k) }
  }
  if (nate.length || dimenticate.length) stato.lista = stato.mostri.filter(Boolean)
  return { nate, dimenticate }
}

function popolaZona(stato, k) {
  const m = stato.mondo, Z = m.zone[k], { casa, nido } = spaziDi(m)
  const { x0, y0, x1, y1 } = Z.rettangolo
  const [fa, fb] = Z.fascia
  let j = 0, nb = 0
  // le celle dove può nascere un branco, per luogo
  const per = new Map()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const c = y * m.W + x
    if (!nido[c]) continue
    const r = m.reg[c]
    if (!per.has(r)) per.set(r, [])
    per.get(r).push(c)
  }
  // la tana di ogni luogo della zona, prima di tutto: i branchi stanno lontani da tutte, non solo dalla propria. E le ancore dei branchi
  // già messi, di tutta la zona (SOPRA.fraBranchi vale anche fra un luogo e l'altro)
  const tane = new Map(), ancore = []
  m.regioni.forEach((R, r) => {
    const celle = per.get(r) || []
    if (R.zona !== k || !fuoriDalVillaggio(R) || !abitantiDi(R) || !celle.length) return
    const kt = R.tana ? R.tana.y * m.W + R.tana.x : -1
    tane.set(r, kt >= 0 && nido[kt] && m.reg[kt] === r ? kt : celle.reduce((p, q) => (m.arco[q] > m.arco[p] ? q : p)))
  })
  const dellaTana = [...tane.values()]
  m.regioni.forEach((R, r) => {
    if (R.zona !== k || !fuoriDalVillaggio(R)) return
    const chi = abitantiDi(R), celle = per.get(r) || []
    if (!chi || !celle.length) return
    const rnd = seminato(fnv(stato.base, R.chiave))
    const rndV = seminato(fnv(stato.base, R.chiave, 'varianti'))
    // il livello sale lungo la strada della zona: all'entrata l'inizio della fascia, in fondo la fine (livelloDi del generatore)
    const livelloIn = c => Math.max(fa, Math.min(fb, Math.round(livelloDi(m, c % m.W, (c / m.W) | 0))))
    const occupate = new Set()
    const libera = c => casa[c] === k && m.reg[c] === r && !occupate.has(c)
    const nuovo = (tipo, c, L, branco, extra = {}) => {
      const x = c % m.W, y = (c / m.W) | 0
      const f = fabbrica(L, rndV)
      let s = f.mostro(tipo, x, y)
      if (extra.caporale) s = f.faiCaporale(s)
      if (extra.signore) {
        s.ossa = s.ossaMax = Math.round(s.ossa * SOPRA.signore.ossa)
        s.att += SOPRA.signore.att
        s.nome = `Il signore ${dellaRegione(R.nome)}`
        s.signore = true
      }
      const i = k * BLOCCO_ZONA + j++
      s.branco = branco
      s.mondo = i
      occupate.add(c)
      stato.mostri[i] = { i, id: `${R.chiave}:${i}`, regione: r, zona: k, branco, tipo, livello: L, casa: { x, y }, fx: x + 0.5, fy: y + 0.5,
                          sveglio: false, calmo: 0, morto: false, torna: null, morti: 0, ossa: s.ossa, scheda: s,
                          caporale: !!extra.caporale, signore: !!extra.signore }
      return i
    }
    // un branco attorno a un'ancora: le celle libere più vicine, entro due
    const vicine = c0 => {
      const x0 = c0 % m.W, y0 = (c0 / m.W) | 0, l = []
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const c = (y0 + dy) * m.W + x0 + dx
        if (x0 + dx >= 0 && x0 + dx < m.W && y0 + dy >= 0 && y0 + dy < m.H && libera(c)) l.push({ c, d: Math.hypot(dx, dy) + rnd() * 0.5 })
      }
      return l.sort((p, q) => p.d - q.d).map(o => o.c)
    }
    const mettiIlBranco = (tipi, c0, L, extra = []) => {
      const id = k * BLOCCO_ZONA + nb, chiDentro = []
      for (const c of vicine(c0)) {
        if (chiDentro.length >= tipi.length) break
        chiDentro.push(nuovo(tipi[chiDentro.length], c, L, id, extra[chiDentro.length] || {}))
      }
      if (chiDentro.length) { stato.branchi[id] = chiDentro; nb++ }
      return chiDentro
    }

    // la tana: quella che il generatore riserva al luogo, o se lì non si può la cella più avanti lungo la strada
    const tana = tane.get(r)
    const Lt = Math.max(fa, Math.min(R.fascia[1], R.fascia[0] + SOPRA.signore.livello))
    const g = SOPRA.guardieDelSignore
    const [g0, g1] = (Array.isArray(g) ? g[Math.min(k, g.length - 1)] : null) || [1, 1]
    const guardie = g0 + Math.floor(rnd() * (g1 - g0 + 1))
    const delSignore = mettiIlBranco(Array(1 + guardie).fill(chi.caporale), tana, Lt, [{ caporale: true, signore: true }, ...Array(guardie).fill({ caporale: true })])
    stato.tane.push({ regione: r, chiave: R.chiave, zona: k, x: tana % m.W, y: (tana / m.W) | 0, branco: delSignore.length ? stato.mostri[delSignore[0]].branco : null })

    // i branchi sparsi: uno ogni cellePerBranco celle, lontani fra loro e dalla tana
    const quanti = Math.round(celle.length / cellePerBranco(k))
    let nuovi = 0
    const lontano = (c, l, d) => l.every(q => Math.hypot(q % m.W - c % m.W, ((q / m.W) | 0) - ((c / m.W) | 0)) >= d)
    for (const c of mescola([...celle], rnd)) {
      if (nuovi >= quanti) break
      if (!libera(c) || !lontano(c, dellaTana, SOPRA.dallaTana) || !lontano(c, ancore, SOPRA.fraBranchi)) continue
      const L = livelloIn(c)
      const tetto = Math.max(2, Math.min(crescitaDiSopra(L).branco, MOSTRI_IN_CAMPO - 1))
      const n = 2 + Math.floor(Math.pow(rnd(), 1.6) * (tetto - 1))
      const tipi = Array.from({ length: n }, () => chi.mostri[Math.floor(rnd() * chi.mostri.length)])
      if (mettiIlBranco(tipi, c, L).length) { ancore.push(c); nuovi++ }
    }
  })
  // i morti di quando la zona era stata buttata: chi deve ancora tornare torna morto
  const via = stato.mortiFuori[Z.chiave]
  if (via) {
    for (const [jj, torna] of via) {
      const q = stato.mostri[k * BLOCCO_ZONA + jj]
      if (!q || (torna >= 0 && torna <= stato.passi)) continue
      q.morto = true; q.torna = torna >= 0 ? torna : null
      if (q.signore) stato.signoriMorti.add(stato.mondo.regioni[q.regione].chiave)
    }
    delete stato.mortiFuori[Z.chiave]
  }
  stato.zone.add(k)
}

function dimenticaZona(stato, k) {
  const Z = stato.mondo.zone[k], morti = []
  for (let i = k * BLOCCO_ZONA; i < (k + 1) * BLOCCO_ZONA; i++) {
    const q = stato.mostri[i]
    if (!q) continue
    if (q.morto && q.signore) stato.signoriMorti.add(stato.mondo.regioni[q.regione].chiave)
    if (q.morto && (q.torna == null || q.torna > stato.passi)) morti.push([i - k * BLOCCO_ZONA, q.torna == null ? -1 : q.torna])
    delete stato.mostri[i]
  }
  for (const b of Object.keys(stato.branchi)) if (Math.floor(b / BLOCCO_ZONA) === k) delete stato.branchi[b]
  stato.tane = stato.tane.filter(t => t.zona !== k)
  if (morti.length) stato.mortiFuori[Z.chiave] = morti
  else delete stato.mortiFuori[Z.chiave]
  stato.zone.delete(k)
}

/* ═══════════ quello che si salva ═══════════
   Nel campo `mondo` dell'avventura, sotto `sopra` (docs/sotterraneo/mondo-aperto-dati.md): i morti per zona col passo a cui tornano (anche
   quelli delle zone dimenticate), il conto dei passi, la vita e l'energia di sopra, le cose rimaste per terra. Le posizioni e chi è
   sveglio no: rientrando ognuno dorme a casa sua */
export function inSalvo(stato) {
  const morti = {}
  for (const [z, l] of Object.entries(stato.mortiFuori)) morti[z] = l.map(v => [...v])
  for (const q of stato.lista) if (q.morto) (morti[stato.mondo.zone[q.zona].chiave] ||= []).push([q.i - q.zona * BLOCCO_ZONA, q.torna == null ? -1 : q.torna])
  return { v: VERSIONE_SOPRA, eroe: stato.eroe, giro: stato.giro, passi: stato.passi, morti, signori: [...stato.signoriMorti],
           forze: stato.forze ? { ...stato.forze } : null, perTerra: stato.perTerra.map(c => ({ ...c })) }
}
// Riprende il mondo: lo rifà da (eroe, giro) e ci rimette i morti, se il salvato è di quell'eroe e di quel giro (un giro nuovo è un mondo
// nuovo: i morti tornano tutti). Un salvato storto, o di prima del percorso, vale come nessuno
export function riprendiMondo({ mondo, eroe = 'eroe', giro = 0, salvato = null }) {
  const stato = statoNuovo(mondo, eroe, giro, null)
  const s = salvato && typeof salvato === 'object' && salvato.v === VERSIONE_SOPRA ? salvato : null
  if (s) {
    stato.passi = Number.isFinite(s.passi) && s.passi >= 0 ? s.passi : 0
    if (s.forze && Number.isFinite(s.forze.vita) && Number.isFinite(s.forze.energia)) stato.forze = { vita: Math.max(1, s.forze.vita), energia: Math.max(0, s.forze.energia) }
    if (Array.isArray(s.perTerra)) stato.perTerra = s.perTerra.filter(c => c && COSE[c.cosa] && Number.isInteger(c.x) && Number.isInteger(c.y)).map(c => ({ cosa: c.cosa, x: c.x, y: c.y }))
    if (s.eroe === eroe && s.giro === giro && s.morti && typeof s.morti === 'object' && !Array.isArray(s.morti)) {
      for (const Z of mondo.zone) {
        const l = s.morti[Z.chiave]
        if (!Array.isArray(l)) continue
        const buoni = l.filter(v => Array.isArray(v) && Number.isInteger(v[0]) && v[0] >= 0 && v[0] < BLOCCO_ZONA && Number.isFinite(v[1]))
        if (buoni.length) stato.mortiFuori[Z.chiave] = buoni.map(([j, t]) => [j, t >= 0 ? t : -1])
      }
      // i signori morti, anche di zone lontane mai riviste (il teschio della veduta, il fumo e le braci della tana)
      if (Array.isArray(s.signori)) for (const c of s.signori) if (mondo.regioni.some(q => q.chiave === c)) stato.signoriMorti.add(c)
    }
  }
  allineaZone(stato)
  return stato
}
// a ogni ritorno in città il giro sale: si rifà quello che vive sopra, tenendo il conto dei passi, le forze e le cose per terra
export function nuovoGiro(stato, giro) {
  if (giro === stato.giro) return stato
  const nuovo = popolaMondo({ mondo: stato.mondo, eroe: stato.eroe, giro })
  nuovo.passi = stato.passi; nuovo.forze = stato.forze; nuovo.perTerra = stato.perTerra; nuovo.manaResto = stato.manaResto
  return nuovo
}

/* ═══════════ cosa vede la scena ═══════════ */

// i mostri vivi entro `raggio` da (x, y), coi dati per disegnarli; sono gli oggetti dello stato: la scena li legge e basta
export function mostriVicini(stato, x, y, raggio = SOPRA.vista) {
  allineaZone(stato)
  const r2 = raggio * raggio
  return stato.lista.filter(q => !q.morto && (q.fx - x) * (q.fx - x) + (q.fy - y) * (q.fy - y) <= r2)
}
// i luoghi il cui signore è morto, anche di zone dimenticate (`signoriMorti`: lo scrive chi lo uccide, o lo ritrova morto): la tana
// resta, è il suo segno di vita che si spegne (il fumo, le braci) e quello della veduta che si fa grigio. Si salva (`signori` in inSalvo)
// È vivo il signore di quel luogo? true/false, o null se non lo si sa (zona dimenticata e mai vista, mai vista morta)
export const signoreVivo = (stato, chiaveRegione) => {
  if (stato.signoriMorti.has(chiaveRegione)) return false
  const t = tanaDi(stato, chiaveRegione)
  return t && t.signore ? t.signore.vivo : null
}
// la tana di un luogo (per la veduta e per le quest), con il suo signore vivo o no; null se la sua zona non è caricata
export const tanaDi = (stato, chiaveRegione) => {
  const t = stato.tane.find(q => q.chiave === chiaveRegione)
  if (!t) return null
  const signore = (stato.branchi[t.branco] || []).map(i => stato.mostri[i]).find(q => q && q.signore)
  return { ...t, signore: signore ? { nome: signore.scheda.nome, tipo: signore.tipo, vivo: !signore.morto } : null }
}

// Il colore di una zona per l'eroe, lo stesso conto del pallino delle zone (docs/sotterraneo/zone.md): dentro la fascia verde, sotto di
// poco (fino a MARGINE) arancio, oltre rosso, sopra grigio. `forza`: il livello di forza dell'eroe (motore/forza.js)
export function coloreDellaRegione(fascia, forza) {
  if (forza < fascia[0] - MARGINE) return 'rosso'
  if (forza < fascia[0]) return 'arancio'
  if (forza <= fascia[1]) return 'verde'
  return 'grigio'
}
export const coloreDellaZona = coloreDellaRegione
const SEGNO = { verde: '🟢', arancio: '🟠', rosso: '🔴', grigio: '⚪' }
// L'annuncio di dove si è: nel villaggio il suo nome (sicuro); in una zona il nome, la fascia e il colore per questo eroe, e il luogo. La
// scena lo dice quando cambia la zona (la riga in fondo)
export function annuncioDi(m, x, y, forza) {
  const X = Math.floor(x), Y = Math.floor(y)
  if (X < 0 || Y < 0 || X >= m.W || Y >= m.H) return null
  const k = Y * m.W + X
  const z = m.zonaCitta[k]
  if (z) { const c = m.citta[z - 1]; return { citta: c.chiave, nome: c.nome, sicura: true, testo: c.nome } }
  const Z = m.zone[zonaDi(m, X, Y)]
  if (!Z) return null
  const R = m.regioni[m.reg[k]]
  if (!fuoriDalVillaggio(R)) return { citta: 'villaggio', zona: Z.chiave, regione: 'villaggio', nome: m.villaggio.nome, sicura: true, testo: m.villaggio.nome }
  const colore = coloreDellaRegione(Z.fascia, forza)
  return { zona: Z.chiave, nome: Z.nome, luogo: R.chiave, nomeLuogo: R.nome, regione: R.chiave, fascia: [...Z.fascia], colore, segno: SEGNO[colore],
           sicura: false, testo: `${SEGNO[colore]} ${Z.nome} · livello ${Z.fascia[0]}–${Z.fascia[1]}` }
}

/* ═══════════ il tempo: i passi e i secondi ═══════════ */

// `n` passi dell'eroe sopra (le celle percorse): il conto sale, il mana torna come giù (MANA_PER_PASSO del globo) se si dà `energiaMax`,
// e i morti il cui passo è arrivato tornano a casa, se la loro casa non è sotto gli occhi dell'eroe (x, y)
export function cammina(stato, n, { x = null, y = null, energiaMax = null } = {}) {
  if (!(n > 0)) return []
  allineaZone(stato)
  stato.passi += n
  if (stato.forze && energiaMax > 0 && stato.forze.energia < energiaMax) {
    stato.manaResto += n * energiaMax * MANA_PER_PASSO
    const interi = Math.floor(stato.manaResto + 1e-9)
    if (interi > 0) { stato.manaResto -= interi; stato.forze.energia = Math.min(energiaMax, stato.forze.energia + interi) }
  }
  const tornati = []
  for (const q of stato.lista) {
    if (!q.morto || q.torna == null || q.torna > stato.passi) continue
    if (x != null && Math.hypot(q.casa.x + 0.5 - x, q.casa.y + 0.5 - y) <= SOPRA.vista + 2) continue
    q.morto = false; q.torna = null; q.ossa = q.scheda.ossaMax
    q.fx = q.casa.x + 0.5; q.fy = q.casa.y + 0.5; q.sveglio = false; q.calmo = 0
    tornati.push(q)
  }
  return tornati
}

// un passo di `v` celle verso (tx, ty), dentro la sua zona: dritto, o di lato se dritto non si può
function muovi(m, casa, q, tx, ty, v) {
  const dx = tx - q.fx, dy = ty - q.fy, d = Math.hypot(dx, dy)
  if (d < 1e-6) return
  const s = Math.min(v, d)
  const qui = (x, y) => casa[Math.floor(y) * m.W + Math.floor(x)] === q.zona
  const nx = q.fx + dx / d * s, ny = q.fy + dy / d * s
  if (qui(nx, ny)) { q.fx = nx; q.fy = ny; return }
  if (dx && qui(q.fx + Math.sign(dx) * s, q.fy)) { q.fx += Math.sign(dx) * s; return }
  if (dy && qui(q.fx, q.fy + Math.sign(dy) * s)) q.fy += Math.sign(dy) * s
}

// `dt` secondi: chi è vicino all'eroe (x, y) e nella sua zona si sveglia col suo branco e gli va incontro; oltre SOPRA.insegue, o se
// l'eroe è al sicuro o in un'altra zona, torna a casa. Torna quelli che si sono appena svegliati (la scena può farli ringhiare)
export function muoviMostri(stato, { x, y }, dt) {
  allineaZone(stato)
  const m = stato.mondo, { casa } = spaziDi(m)
  const sicuro = alSicuro(m, x, y)
  const mia = zonaDi(m, Math.floor(x), Math.floor(y))
  const svegli = []
  const vicino = SOPRA.insegue + 6
  for (const q of stato.lista) {
    if (q.morto || Math.abs(q.fx - x) > vicino || Math.abs(q.fy - y) > vicino) {
      if (!q.morto && q.sveglio) { q.sveglio = false }
      if (!q.morto && !q.sveglio && (q.fx !== q.casa.x + 0.5 || q.fy !== q.casa.y + 0.5)) muovi(m, casa, q, q.casa.x + 0.5, q.casa.y + 0.5, SOPRA.passoRientro * dt)
      continue
    }
    if (q.calmo > 0) q.calmo = Math.max(0, q.calmo - dt)
    const d = Math.hypot(q.fx - x, q.fy - y)
    if (!q.sveglio && !sicuro && mia === q.zona && q.calmo <= 0 && d <= SOPRA.sveglia) {
      for (const j of stato.branchi[q.branco]) {
        const p = stato.mostri[j]
        if (p && !p.morto && !p.sveglio && p.calmo <= 0) { p.sveglio = true; svegli.push(p) }
      }
    }
    if (q.sveglio && (sicuro || mia !== q.zona || Math.hypot(q.fx - (q.casa.x + 0.5), q.fy - (q.casa.y + 0.5)) > SOPRA.insegue + 4 || d > SOPRA.insegue)) q.sveglio = false
    if (q.sveglio) { if (d > SOPRA.contatto * 0.8) muovi(m, casa, q, x, y, SOPRA.passoMostro * dt) }
    else muovi(m, casa, q, q.casa.x + 0.5, q.casa.y + 0.5, SOPRA.passoRientro * dt)
  }
  return svegli
}

/* ═══════════ lo scontro ═══════════ */

// Si apre uno scontro? Se l'eroe in (x, y) ha toccato un mostro (`tocco`: il suo indice, entro SOPRA.tocco) o se uno sveglio gli è arrivato
// addosso (SOPRA.contatto). Entra il branco di chi apre (entro RAGGIO_SCONTRO dall'eroe) e chi è già sveglio e a un passo (SOPRA.aUnPasso),
// della stessa zona, al più MOSTRI_IN_CAMPO, i più vicini; chi apre è sempre il primo. Torna null o
// { chi, campo: [indici], tocco, regione, zona, x, y } (x, y: dove l'eroe è, per la scena e per l'esito)
export function incontro(stato, { x, y }, { tocco = null } = {}) {
  allineaZone(stato)
  const m = stato.mondo
  if (alSicuro(m, x, y)) return null
  const lontano = q => Math.hypot(q.fx - x, q.fy - y)
  let chi = null
  if (tocco != null) {
    const q = stato.mostri[tocco]
    if (q && !q.morto && lontano(q) <= SOPRA.tocco) chi = q
  }
  const toccato = !!chi
  if (!chi) {
    for (const q of stato.lista) {
      if (q.morto || !q.sveglio || Math.abs(q.fx - x) > 2 || Math.abs(q.fy - y) > 2) continue
      if (lontano(q) <= SOPRA.contatto && (!chi || lontano(q) < lontano(chi))) chi = q
    }
  }
  if (!chi) return null
  // o sono fuori o sono dentro: ogni vivo della zona entro SOPRA.dentro celle dall'eroe o da chi apre entra (di qualunque branco, anche
  // se dorme), i più vicini all'eroe fino al massimo
  const daChi = q => Math.hypot(q.fx - chi.fx, q.fy - chi.fy)
  const altri = stato.lista.filter(q => q !== chi && !q.morto && q.zona === chi.zona &&
    ((q.branco === chi.branco && lontano(q) <= RAGGIO_SCONTRO) || (q.sveglio && lontano(q) <= SOPRA.aUnPasso) ||
     lontano(q) <= SOPRA.dentro || daChi(q) <= SOPRA.dentro))
    .sort((p, q) => lontano(p) - lontano(q))
  const campo = [chi, ...altri].slice(0, MOSTRI_IN_CAMPO).map(q => q.i)
  return { chi: chi.i, campo, tocco: toccato, regione: m.regioni[chi.regione].chiave, zona: m.zone[chi.zona].chiave, x, y }
}

// la discesa finta di uno scontro di sopra: una tappa di un piano, con le domande della zona e il livello dell'inizio del luogo (il
// bottino, e l'esperienza grigia per chi la supera di tanto: `potenza`, dati/zone.js)
function tappaDelPalco(stato, R, campo, cose = []) {
  const chi = abitantiDi(R) || { mostri: ['ratto'], caporale: 'goblin' }
  const c = crescitaDiSopra(R.fascia[0])
  return { chiave: `sopra:${R.chiave}`, nome: R.nome, icona: '⚔️', palco: { campo, cose }, piani: 1, misura: PALCO.largo, largo: PALCO.largo, alto: PALCO.alto, giri: 0,
           dif: [R.dif, R.dif], potenza: R.fascia[0], livello: R.fascia[0], forza: c.forza, spinta: c.spinta, gradi: c.gradi,
           mostri: chi.mostri, caporale: chi.caporale, tettoBranco: c.branco }
}
const daVerso = (verso, dx, dy) => {
  // il verso dell'eroe sul palco, ruotato come nel mondo rispetto a chi apre (che sul palco sta a destra): l'agguato alle spalle resta tale
  if (!verso || !(Math.hypot(verso.dx, verso.dy) > 1e-6) || !(Math.hypot(dx, dy) > 1e-6)) return null
  const a = Math.atan2(verso.dy, verso.dx) - Math.atan2(dy, dx)
  return { dx: Math.cos(a), dy: Math.sin(a) }
}

// Apre lo scontro dell'incontro `inc`: una Corsa vera sul palco (motore/palco.js) col branco, l'eroe con la sua roba, la sua crescita e le
// forze di sopra (`forze`, o quelle dello stato, o piene), e lo scontro già partito: `corsa.foglio` è il foglio di sempre
// (docs/sotterraneo/scontro.md). `copricapi`: i copricapi nel bottino (docs/sotterraneo/elmo.md), che il gioco 3D accende e il banco no. `verso`: dove guardava l'eroe nel mondo (l'agguato alle spalle). `missioni`: solo le «sconfiggi N»
export function apriLoScontro(stato, inc, { eroe = 'cavaliere', roba = null, crescita = null, forze = null, verso = null, missioni = [], conti = {}, rnd = null, seme = null, copricapi = false } = {}) {
  const m = stato.mondo, chi = stato.mostri[inc.chi], R = m.regioni[chi.regione]
  const campo = inc.campo.map(i => { const q = stato.mostri[i]; return { ...structuredClone(q.scheda), ossa: q.ossa, sveglio: q.sveglio, mondo: q.i } })
  const s = seme != null ? seme : fnv(stato.base, 'scontro', stato.passi, inc.chi) % 100000
  const corsa = new Corsa(tappaDelPalco(stato, R, campo), { seme: s, rnd: rnd || seminato(s * 31 + 17), eroe, roba, crescita, ricomparsa: false, botti: false, copricapi,
                                                         missioni: (missioni || []).filter(q => q.tipo === 'conta'), conti })
  const f = forze || stato.forze
  if (f) { corsa.vita = Math.max(1, Math.min(corsa.vitaMax, f.vita)); corsa.energia = Math.max(0, Math.min(corsa.energiaMax, f.energia)) }
  corsa.verso = daVerso(verso, chi.fx - inc.x, chi.fy - inc.y)
  corsa.dalMondo = { x: inc.x, y: inc.y, regione: R.chiave }
  const primo = corsa.livello.robe.find(r => r.che === 'mostro' && r.mondo === chi.i)
  corsa.scontro(primo, { tocco: inc.tocco })
  scostaChiNonEntra(stato, inc)
  return corsa
}

// Chi era vicino ma non è entrato (il campo era pieno) non resta a guardare dentro l'area del palco: viene portato appena fuori, alla cella
// calpestabile più vicina della sua zona, e lì sta (nessuno si muove durante lo scontro). Finito, riprende a rincorrere come sempre.
// L'area è quella del palco posata sul mondo con l'eroe sulla sua cella (EROE_SUL_PALCO), più un giro di margine
export function scostaChiNonEntra(stato, inc) {
  const m = stato.mondo, { casa } = spaziDi(m)
  const dentro = new Set(inc.campo)
  const x0 = Math.floor(inc.x) - EROE_SUL_PALCO.x - 1, x1 = x0 + PALCO.largo + 1
  const y0 = Math.floor(inc.y) - EROE_SUL_PALCO.y - 1, y1 = y0 + PALCO.alto + 1
  const sulPalco = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1
  for (const q of stato.lista) {
    if (q.morto || dentro.has(q.i) || !sulPalco(Math.floor(q.fx), Math.floor(q.fy))) continue
    let meglio = null, dm = Infinity
    for (let y = y0 - 5; y <= y1 + 5; y++) for (let x = x0 - 5; x <= x1 + 5; x++) {
      if (sulPalco(x, y) || x < 0 || y < 0 || x >= m.W || y >= m.H || casa[y * m.W + x] !== q.zona) continue
      const d = Math.hypot(x + 0.5 - q.fx, y + 0.5 - q.fy)
      if (d < dm) { dm = d; meglio = [x + 0.5, y + 0.5] }
    }
    if (meglio) { q.fx = meglio[0]; q.fy = meglio[1] }
  }
}

// Una taglia: cosa vale un mostro ucciso per una quest di caccia (docs/sotterraneo/mondo-aperto-quest.md). L'esito ne dà una per morto.
// `regione` è il luogo (le chiavi delle regioni di sempre), `zona` la chiave della zona
export const tagliaDi = (q, R, Z = null) => ({ specie: q.tipo, regione: R.chiave, zona: Z ? Z.chiave : null, livello: q.livello, caporale: q.caporale, signore: q.signore, id: q.id })
// quante delle `taglie` contano per una quest che chiede quella specie (o qualunque, null) in quel luogo o in quella zona (o ovunque,
// null); `signore`: solo i signori. È l'aggancio per chi scrive le quest: le taglie arrivano dall'esito di ogni scontro (`uccisi`)
export const taglieDaContare = (taglie, { specie = null, regione = null, signore = false, zona = null } = {}) =>
  (taglie || []).filter(t => (!specie || t.specie === specie) && (!regione || t.regione === regione) && (!signore || t.signore) && (zona == null || t.zona === zona)).length

// svenire sopra (la decisione 6 dell'utente): metà delle gemme, le tasche vuote tranne i pezzi rari (gli «epici», col nome temprato, runico…)
// e i leggendari; quello che si porta addosso resta, come giù
export const SI_TIENE_SVENENDO = k => !!(COSE[k] && rangoDellaRarita(COSE[k].rarita) >= rangoDellaRarita('raro'))
export function perdeSvenendo(roba) {
  return { ...roba, gemme: Math.floor((roba.gemme || 0) / 2), zaino: (roba.zaino || []).filter(SI_TIENE_SVENENDO) }
}
// dove ci si risveglia: il villaggio, l'unica città, accanto alla sua pietra (gli altri parametri di prima non servono più)
export function cittaDelRisveglio(m) {
  const c = m.villaggio, p = (c.pietra || c.portale).accanto
  return { citta: c.chiave, nome: c.nome, x: p.x, y: p.y }
}

// Com'è finito lo scontro della Corsa `corsa` (aperta da apriLoScontro), e cosa cambia nel mondo. `come`: 'vinto', 'scappato', 'svenuto', o
// 'aperto' (il foglio è ancora lì: non cambia niente). Vinto: si raccoglie quello che è caduto (come nei dungeon: le gemme, e le cose che
// vanno addosso o in tasca; quelle che non ci stanno restano per terra nel mondo, `stato.perTerra`), i morti tornano a passi (i caporali e il
// signore no, fino al giro dopo). Svenuto: ci si risveglia al villaggio con metà delle gemme e le tasche vuote, tranne rari e leggendari;
// tutti i mostri tornano a casa a dormire. Lo stato ha le forze nuove (`stato.forze`); `roba`, `crescita`, `forze` sono da riportare
// nell'avventura
export function esitoDelloScontro(stato, corsa) {
  const f = corsa.foglio
  if (f && f.che === 'scontro') return { come: 'aperto' }
  const m = stato.mondo
  const svenuto = !!(f && f.che === 'svenuto')
  const sulPalco = corsa.livello.robe.filter(r => r.che === 'mostro' && r.mondo != null)
  const vinto = !svenuto && sulPalco.every(r => r.morto)
  stato.passi += corsa.passi
  const uccisi = []
  for (const r of sulPalco) {
    const q = stato.mostri[r.mondo]
    if (!q) continue
    if (r.morto) {
      q.morto = true; q.sveglio = false; q.morti++
      if (q.signore) stato.signoriMorti.add(m.regioni[q.regione].chiave)
      q.torna = q.caporale || q.signore ? null : Math.round(stato.passi + SOPRA.ricomparsa * (1 + tiroDalSeme(47, stato.base, q.i, q.morti)))
      uccisi.push(tagliaDi(q, m.regioni[q.regione], m.zone[q.zona]))
    } else {
      q.ossa = svenuto ? q.scheda.ossaMax : r.ossa
      q.sveglio = false; q.calmo = SOPRA.calma
    }
  }
  const presi = [], rimasti = []
  let gemme = 0
  if (vinto) {
    for (const r of corsa.livello.robe) {
      if (r.presa || r.morto) continue
      if (r.che === 'gemme') { const n = Math.round(r.quante * corsa.valoreGemme); corsa.gemme += n; gemme += n; r.presa = true }
      else if (r.che === 'cosa') { corsa.trovata(r); if (r.presa) presi.push(r.cosa); else rimasti.push(r.cosa) }
    }
    const d = corsa.dalMondo || { x: 0, y: 0 }
    for (const k of rimasti) stato.perTerra.push({ cosa: k, x: Math.floor(d.x), y: Math.floor(d.y) })
  }
  let roba = corsa.roba, forze = { vita: corsa.vita, energia: corsa.energia }, risveglio = null
  if (svenuto) {
    roba = perdeSvenendo(roba)
    forze = { vita: Math.max(6, Math.round(corsa.vitaMax / 2)), energia: corsa.energia }
    risveglio = cittaDelRisveglio(m)
    for (const q of stato.lista) if (!q.morto) { q.sveglio = false; q.calmo = 0; q.ossa = q.scheda.ossaMax; q.fx = q.casa.x + 0.5; q.fy = q.casa.y + 0.5 }
  }
  stato.forze = forze
  return { come: svenuto ? 'svenuto' : vinto ? 'vinto' : 'scappato', roba, crescita: corsa.crescita, forze, preparati: corsa.preparati,
           esp: corsa.espPresa, gemme, presi, rimasti, uccisi, risveglio, eventi: corsa.eventi, avvisi: corsa.avvisi,
           domande: corsa.domande, giuste: corsa.giuste, passi: corsa.passi, conti: corsa.conti, missioniFatte: [...corsa.missioniFatte] }
}

// Raccoglie la cosa `i` di `stato.perTerra` (quelle che dopo uno scontro non stavano in tasca): una Corsa sul palco vuoto la prende come giù
// (addosso se è meglio, in tasca se c'è posto). Torna { presa, roba, avvisi }
export function raccogliDaTerra(stato, i, { eroe = 'cavaliere', roba = null, crescita = null } = {}) {
  const c = stato.perTerra[i]
  if (!c) return { presa: false, roba, avvisi: [] }
  const m = stato.mondo, qui = m.regioni[m.reg[c.y * m.W + c.x]]
  const R = fuoriDalVillaggio(qui) ? qui : m.regioni.find(fuoriDalVillaggio)
  const corsa = new Corsa(tappaDelPalco(stato, R, [], [{ che: 'cosa', cosa: c.cosa, em: COSE[c.cosa].em }]),
                          { seme: 1, rnd: seminato(7), eroe, roba, crescita, ricomparsa: false })
  const r = corsa.livello.robe.find(q => q.che === 'cosa')
  corsa.trovata(r)
  if (r.presa) stato.perTerra.splice(i, 1)
  return { presa: !!r.presa, roba: corsa.roba, avvisi: corsa.avvisi }
}
