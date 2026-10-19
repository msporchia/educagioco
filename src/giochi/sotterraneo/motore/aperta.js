// I mostri del mondo di sopra (docs/sotterraneo/mondo-aperto-mostri.md): chi vive in ogni regione del mondo generato
// (motore/mondo-aperto.js), dove dorme, quando si sveglia, chi entra nello scontro, cosa resta dopo. La mappa non cambia mai; quello
// che ci vive nasce da (eroe, giro), e il giro sale a ogni ritorno in città. Una regione è una stanza grande: i suoi mostri non ne
// escono, e non entrano mai in una città, nella cintura attorno al villaggio, su un ponte o su un valico. Lo scontro è quello dei
// dungeon, giocato da una Corsa su un palco di una stanza (motore/palco.js). Puro, senza scena: gira in Node.
import { MOSTRI_IN_CAMPO, RAGGIO_SCONTRO, MANA_PER_PASSO } from '../dati/mondo.js'
import { forzaDellaZona, spintaDellaZona, MARGINE } from '../dati/zone.js'
import { COSE } from '../dati/cose.js'
import { rangoDellaRarita } from '../dati/pezzi.js'
import { ABITANTI_DI_SOPRA, CURVA_DI_SOPRA, SOPRA } from '../dati/mondo-aperto-mostri.js'
import { ERBA } from './mondo-aperto.js'
import { terraDelMondo } from './mondo-sopra.js'
import { Livello, seminato } from './livello.js'
import { Corsa } from './corsa.js'
import { PALCO } from './palco.js'
import { tiroDalSeme } from './bottino.js'

export const VERSIONE_SOPRA = 1

/* ═══════════ quanto è forte un mostro di sopra ═══════════ */

// la riga della curva al livello L: in linea retta fra due punti, dal 12 la curva delle zone (forma 1)
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

// chi vive in una regione del mondo: la scheda (le sei delle terre selvagge) o ABITANTI_DI_SOPRA
export const abitantiDi = R => (R.abitanti ? { mostri: R.abitanti, caporale: R.caporale } : ABITANTI_DI_SOPRA[R.chiave] || null)

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

/* ═══════════ dove possono stare (per mondo, una volta) ═══════════ */

const OTTO = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
const marca = (m, a, x, y, r, v = 1) => {
  const r2 = r * r
  for (let j = Math.max(0, Math.floor(y - r)); j <= Math.min(m.H - 1, Math.ceil(y + r)); j++)
    for (let i = Math.max(0, Math.floor(x - r)); i <= Math.min(m.W - 1, Math.ceil(x + r)); i++)
      if ((i - x) * (i - x) + (j - y) * (j - y) <= r2) a[j * m.W + i] = v
}

// `casa[k]`: la regione dove un mostro può camminare in quella cella (−1: mai, è città, cintura, ponte, valico, acqua, roccia…);
// `nido[k]`: lì può nascere un branco (lontano dalle strade e dai posti). `cintura` la tiene la scena per dire «qui sei al sicuro»
const SPAZI = new WeakMap()
export function spaziDi(m) {
  let s = SPAZI.get(m)
  if (s) return s
  const N = m.W * m.H
  const cintura = new Uint8Array(N)
  const villaggio = m.citta.findIndex(c => c.chiave === 'villaggio')
  // attorno al villaggio: la sua zona più SOPRA.cintura (di bordo basta marcare dalle celle sul margine della zona)
  for (let k = 0; k < N; k++) {
    if (m.zonaCitta[k] !== villaggio + 1) continue
    const x = k % m.W, y = (k / m.W) | 0
    if (OTTO.some(([dx, dy]) => m.zonaCitta[(y + dy) * m.W + x + dx] !== villaggio + 1)) marca(m, cintura, x, y, SOPRA.cintura)
    cintura[k] = 1
  }
  // lungo la strada dalla piazza al primo dungeon
  const primo = m.ingressi.find(i => i.indice === 0)
  const via = primo ? terraDelMondo(m, () => true).strada(m.partenza, primo.accanto) || [] : []
  for (const c of [m.partenza, ...via]) marca(m, cintura, c.x, c.y, SOPRA.cintura)
  // un margine attorno alle altre città
  const margine = new Uint8Array(N)
  for (let k = 0; k < N; k++) if (m.zonaCitta[k]) {
    const x = k % m.W, y = (k / m.W) | 0
    if (OTTO.some(([dx, dy]) => !m.zonaCitta[(y + dy) * m.W + x + dx])) marca(m, margine, x, y, SOPRA.margineCitta)
  }
  const casa = new Int16Array(N).fill(-1)
  for (let k = 0; k < N; k++) {
    const R = m.regioni[m.reg[k]]
    if (!R || !R.anello || m.terreno[k] !== ERBA || m.ponte[k] >= 0 || m.varco[k] >= 0 || m.blocco[k] || m.isola[k] || m.zonaCitta[k]
        || cintura[k] || margine[k] || m.passi[k] < 0) continue
    casa[k] = m.reg[k]
  }
  // dove nasce un branco: non accanto a una strada, a un ingresso, a una pietra, a un antro, a chi sta fermo
  const vietato = new Uint8Array(N)
  for (let k = 0; k < N; k++) if (m.strada[k]) marca(m, vietato, k % m.W, (k / m.W) | 0, SOPRA.daStrada)
  for (const p of m.posti) for (const c of [p.accanto, p.piede]) if (c) marca(m, vietato, c.x, c.y, SOPRA.daiPosti)
  const nido = new Uint8Array(N)
  for (let k = 0; k < N; k++) if (casa[k] >= 0 && !vietato[k]) nido[k] = 1
  s = { casa, nido, cintura }
  SPAZI.set(m, s)
  return s
}
// una cella dove si è al sicuro (in città o nella cintura): lì nessuno si sveglia e nessuno insegue
export function alSicuro(m, x, y) {
  const k = Math.floor(y) * m.W + Math.floor(x), s = spaziDi(m)
  return !!(m.zonaCitta[k] || s.cintura[k] || !m.regioni[m.reg[k]] || !m.regioni[m.reg[k]].anello)
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

// Lo stato del mondo coi mostri: `mostri` (uno per mostro, nell'ordine in cui nascono: l'indice è il suo nome), `branchi` (gli indici di
// ogni branco), `tane` (una per regione), più quello che si salva (`passi`, `forze`, `perTerra`, i morti sui mostri). `eroe`: la chiave
// dell'avventura (il seme del contenuto), `giro`: quante volte si è entrati in una città. `seme`: per le prove, al posto di (eroe, giro)
export function popolaMondo({ mondo: m, eroe = 'eroe', giro = 0, seme = null }) {
  const { casa, nido } = spaziDi(m)
  const base = seme != null ? seme >>> 0 : fnv(m.seme, eroe, giro)
  const mostri = [], branchi = [], tane = []
  m.regioni.forEach((R, r) => {
    const chi = R.anello ? abitantiDi(R) : null
    if (!chi) return
    const rnd = seminato(fnv(base, R.chiave))
    const rndV = seminato(fnv(base, R.chiave, 'varianti'))
    const celle = []
    for (let k = 0; k < m.W * m.H; k++) if (nido[k] && m.reg[k] === r) celle.push(k)
    if (!celle.length) return
    // il livello cresce coi passi dalla piazza: dentro la regione, dall'inizio alla fine della fascia
    let pmin = Infinity, pmax = -Infinity
    for (const k of celle) { pmin = Math.min(pmin, m.passi[k]); pmax = Math.max(pmax, m.passi[k]) }
    const [da, a] = R.fascia
    const livelloIn = k => da + Math.round((a - da) * (pmax > pmin ? (m.passi[k] - pmin) / (pmax - pmin) : 0))
    const occupate = new Set()
    const libera = k => casa[k] === r && !occupate.has(k)
    const nuovo = (tipo, k, L, branco, extra = {}) => {
      const x = k % m.W, y = (k / m.W) | 0
      const f = fabbrica(L, rndV)
      let s = f.mostro(tipo, x, y)
      if (extra.caporale) s = f.faiCaporale(s)
      if (extra.signore) {
        s.ossa = s.ossaMax = Math.round(s.ossa * SOPRA.signore.ossa)
        s.att += SOPRA.signore.att
        s.nome = `Il signore ${dellaRegione(R.nome)}`
        s.signore = true
      }
      const i = mostri.length
      s.branco = branco
      s.mondo = i
      occupate.add(k)
      mostri.push({ i, id: `${R.chiave}:${i}`, regione: r, branco, tipo, livello: L, casa: { x, y }, fx: x + 0.5, fy: y + 0.5,
                    sveglio: false, calmo: 0, morto: false, torna: null, morti: 0, ossa: s.ossa, scheda: s,
                    caporale: !!extra.caporale, signore: !!extra.signore })
      return i
    }
    // un branco attorno a un'ancora: le celle libere più vicine, entro due
    const vicine = k0 => {
      const x0 = k0 % m.W, y0 = (k0 / m.W) | 0, l = []
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const k = (y0 + dy) * m.W + x0 + dx
        if (x0 + dx >= 0 && x0 + dx < m.W && y0 + dy >= 0 && y0 + dy < m.H && libera(k)) l.push({ k, d: Math.hypot(dx, dy) + rnd() * 0.5 })
      }
      return l.sort((p, q) => p.d - q.d).map(o => o.k)
    }
    const mettiIlBranco = (tipi, k0, L, extra = []) => {
      const id = branchi.length, chiDentro = []
      for (const k of vicine(k0)) {
        if (chiDentro.length >= tipi.length) break
        chiDentro.push(nuovo(tipi[chiDentro.length], k, L, id, extra[chiDentro.length] || {}))
      }
      if (chiDentro.length) branchi.push(chiDentro)
      return chiDentro
    }

    // la tana: il centro della regione (riservato dal generatore), o se lì non si può la cella più lontana dalla piazza
    const kt = R.tana ? R.tana.y * m.W + R.tana.x : -1
    const tana = kt >= 0 && nido[kt] && m.reg[kt] === r ? kt : celle.reduce((p, q) => (m.passi[q] > m.passi[p] ? q : p))
    const Lt = Math.min(a, da + SOPRA.signore.livello)
    const [g0, g1] = SOPRA.guardieDelSignore[R.anello] || [1, 1]
    const guardie = g0 + Math.floor(rnd() * (g1 - g0 + 1))
    const delSignore = mettiIlBranco(Array(1 + guardie).fill(chi.caporale), tana, Lt, [{ caporale: true, signore: true }, ...Array(guardie).fill({ caporale: true })])
    tane.push({ regione: r, chiave: R.chiave, x: tana % m.W, y: (tana / m.W) | 0, branco: delSignore.length ? mostri[delSignore[0]].branco : null })

    // i branchi sparsi: uno ogni SOPRA.cellePerBranco celle, lontani fra loro e dalla tana
    const quanti = Math.round(celle.length / SOPRA.cellePerBranco)
    const ancore = []
    const lontano = (k, l, d) => l.every(q => Math.hypot(q % m.W - k % m.W, ((q / m.W) | 0) - ((k / m.W) | 0)) >= d)
    for (const k of mescola([...celle], rnd)) {
      if (ancore.length >= quanti) break
      if (!libera(k) || !lontano(k, [tana], SOPRA.dallaTana) || !lontano(k, ancore, SOPRA.fraBranchi)) continue
      const L = livelloIn(k)
      const tetto = Math.max(2, Math.min(crescitaDiSopra(L).branco, MOSTRI_IN_CAMPO - 1))
      const n = 2 + Math.floor(Math.pow(rnd(), 1.6) * (tetto - 1))
      const tipi = Array.from({ length: n }, () => chi.mostri[Math.floor(rnd() * chi.mostri.length)])
      if (mettiIlBranco(tipi, k, L).length) ancore.push(k)
    }
  })
  return { v: VERSIONE_SOPRA, mondo: m, eroe, giro, base, mostri, branchi, tane, passi: 0, forze: null, perTerra: [], manaResto: 0 }
}

/* ═══════════ quello che si salva ═══════════
   Nel campo `mondo` dell'avventura, sotto `sopra` (docs/sotterraneo/mondo-aperto-dati.md): i morti col passo a cui tornano, il conto dei
   passi, la vita e l'energia di sopra, le cose rimaste per terra. Le posizioni e chi è sveglio no: rientrando ognuno dorme a casa sua */
export function inSalvo(stato) {
  const morti = []
  for (const q of stato.mostri) if (q.morto) morti.push([q.i, q.torna == null ? -1 : q.torna])
  return { v: VERSIONE_SOPRA, eroe: stato.eroe, giro: stato.giro, passi: stato.passi, morti,
           forze: stato.forze ? { ...stato.forze } : null, perTerra: stato.perTerra.map(c => ({ ...c })) }
}
// Riprende il mondo: lo rifà da (eroe, giro) e ci rimette i morti, se il salvato è di quell'eroe e di quel giro (un giro nuovo è un mondo
// nuovo: i morti tornano tutti). Un salvato storto vale come nessuno
export function riprendiMondo({ mondo, eroe = 'eroe', giro = 0, salvato = null }) {
  const stato = popolaMondo({ mondo, eroe, giro })
  const s = salvato && typeof salvato === 'object' && salvato.v === VERSIONE_SOPRA ? salvato : null
  if (!s) return stato
  stato.passi = Number.isFinite(s.passi) && s.passi >= 0 ? s.passi : 0
  if (s.forze && Number.isFinite(s.forze.vita) && Number.isFinite(s.forze.energia)) stato.forze = { vita: Math.max(1, s.forze.vita), energia: Math.max(0, s.forze.energia) }
  if (Array.isArray(s.perTerra)) stato.perTerra = s.perTerra.filter(c => c && COSE[c.cosa] && Number.isInteger(c.x) && Number.isInteger(c.y)).map(c => ({ cosa: c.cosa, x: c.x, y: c.y }))
  if (s.eroe === eroe && s.giro === giro && Array.isArray(s.morti)) {
    for (const [i, torna] of s.morti) {
      const q = stato.mostri[i]
      if (!q) continue
      q.morto = true
      q.torna = Number.isFinite(torna) && torna >= 0 ? torna : null
    }
  }
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
  const r2 = raggio * raggio
  return stato.mostri.filter(q => !q.morto && (q.fx - x) * (q.fx - x) + (q.fy - y) * (q.fy - y) <= r2)
}
// la tana di una regione (per la veduta e per le quest), con il suo signore vivo o no
export const tanaDi = (stato, chiaveRegione) => {
  const t = stato.tane.find(q => q.chiave === chiaveRegione)
  if (!t) return null
  const signore = stato.mostri.find(q => q.branco === t.branco && q.signore)
  return { ...t, signore: signore ? { nome: signore.scheda.nome, tipo: signore.tipo, vivo: !signore.morto } : null }
}

// Il colore di una regione per l'eroe, lo stesso conto del pallino delle zone (docs/sotterraneo/zone.md): dentro la fascia verde, sotto di
// poco (fino a MARGINE) arancio, oltre rosso, sopra grigio. `forza`: il livello di forza dell'eroe (motore/forza.js)
export function coloreDellaRegione(fascia, forza) {
  if (forza < fascia[0] - MARGINE) return 'rosso'
  if (forza < fascia[0]) return 'arancio'
  if (forza <= fascia[1]) return 'verde'
  return 'grigio'
}
const SEGNO = { verde: '🟢', arancio: '🟠', rosso: '🔴', grigio: '⚪' }
// L'annuncio di dove si è: in città il suo nome (sicura), in una regione il nome, la fascia e il colore per questo eroe. La scena lo dice
// entrando (la riga in fondo), una volta per regione
export function annuncioDi(m, x, y, forza) {
  const k = Math.floor(y) * m.W + Math.floor(x)
  const z = m.zonaCitta[k]
  if (z) { const c = m.citta[z - 1]; return { citta: c.chiave, nome: c.nome, sicura: true, testo: c.nome } }
  const R = m.regioni[m.reg[k]]
  if (!R) return null
  if (!R.anello || !R.fascia) return { regione: R.chiave, nome: R.nome, sicura: true, testo: R.nome }
  const colore = coloreDellaRegione(R.fascia, forza)
  return { regione: R.chiave, nome: R.nome, fascia: [...R.fascia], colore, segno: SEGNO[colore], sicura: false,
           testo: `${SEGNO[colore]} ${R.nome} · livello ${R.fascia[0]}–${R.fascia[1]}` }
}

/* ═══════════ il tempo: i passi e i secondi ═══════════ */

// `n` passi dell'eroe sopra (le celle percorse): il conto sale, il mana torna come giù (MANA_PER_PASSO del globo) se si dà `energiaMax`,
// e i morti il cui passo è arrivato tornano a casa, se la loro casa non è sotto gli occhi dell'eroe (x, y)
export function cammina(stato, n, { x = null, y = null, energiaMax = null } = {}) {
  if (!(n > 0)) return []
  stato.passi += n
  if (stato.forze && energiaMax > 0 && stato.forze.energia < energiaMax) {
    stato.manaResto += n * energiaMax * MANA_PER_PASSO
    const interi = Math.floor(stato.manaResto + 1e-9)
    if (interi > 0) { stato.manaResto -= interi; stato.forze.energia = Math.min(energiaMax, stato.forze.energia + interi) }
  }
  const tornati = []
  for (const q of stato.mostri) {
    if (!q.morto || q.torna == null || q.torna > stato.passi) continue
    if (x != null && Math.hypot(q.casa.x + 0.5 - x, q.casa.y + 0.5 - y) <= SOPRA.vista + 2) continue
    q.morto = false; q.torna = null; q.ossa = q.scheda.ossaMax
    q.fx = q.casa.x + 0.5; q.fy = q.casa.y + 0.5; q.sveglio = false; q.calmo = 0
    tornati.push(q)
  }
  return tornati
}

// un passo di `v` celle verso (tx, ty), dentro la sua regione: dritto, o di lato se dritto non si può
function muovi(m, casa, q, tx, ty, v) {
  const dx = tx - q.fx, dy = ty - q.fy, d = Math.hypot(dx, dy)
  if (d < 1e-6) return
  const s = Math.min(v, d)
  const qui = (x, y) => casa[Math.floor(y) * m.W + Math.floor(x)] === q.regione
  const nx = q.fx + dx / d * s, ny = q.fy + dy / d * s
  if (qui(nx, ny)) { q.fx = nx; q.fy = ny; return }
  if (dx && qui(q.fx + Math.sign(dx) * s, q.fy)) { q.fx += Math.sign(dx) * s; return }
  if (dy && qui(q.fx, q.fy + Math.sign(dy) * s)) q.fy += Math.sign(dy) * s
}

// `dt` secondi: chi è vicino all'eroe (x, y) e nella sua regione si sveglia col suo branco e gli va incontro; oltre SOPRA.insegue, o se
// l'eroe è al sicuro o in un'altra regione, torna a casa. Torna quelli che si sono appena svegliati (la scena può farli ringhiare)
export function muoviMostri(stato, { x, y }, dt) {
  const m = stato.mondo, { casa } = spaziDi(m)
  const sicuro = alSicuro(m, x, y)
  const mia = m.reg[Math.floor(y) * m.W + Math.floor(x)]
  const svegli = []
  const vicino = SOPRA.insegue + 6
  for (const q of stato.mostri) {
    if (q.morto || Math.abs(q.fx - x) > vicino || Math.abs(q.fy - y) > vicino) {
      if (!q.morto && q.sveglio) { q.sveglio = false }
      if (!q.morto && !q.sveglio && (q.fx !== q.casa.x + 0.5 || q.fy !== q.casa.y + 0.5)) muovi(m, casa, q, q.casa.x + 0.5, q.casa.y + 0.5, SOPRA.passoRientro * dt)
      continue
    }
    if (q.calmo > 0) q.calmo = Math.max(0, q.calmo - dt)
    const d = Math.hypot(q.fx - x, q.fy - y)
    if (!q.sveglio && !sicuro && mia === q.regione && q.calmo <= 0 && d <= SOPRA.sveglia) {
      for (const j of stato.branchi[q.branco]) {
        const p = stato.mostri[j]
        if (!p.morto && !p.sveglio && p.calmo <= 0) { p.sveglio = true; svegli.push(p) }
      }
    }
    if (q.sveglio && (sicuro || mia !== q.regione || Math.hypot(q.fx - (q.casa.x + 0.5), q.fy - (q.casa.y + 0.5)) > SOPRA.insegue + 4 || d > SOPRA.insegue)) q.sveglio = false
    if (q.sveglio) { if (d > SOPRA.contatto * 0.8) muovi(m, casa, q, x, y, SOPRA.passoMostro * dt) }
    else muovi(m, casa, q, q.casa.x + 0.5, q.casa.y + 0.5, SOPRA.passoRientro * dt)
  }
  return svegli
}

/* ═══════════ lo scontro ═══════════ */

// Si apre uno scontro? Se l'eroe in (x, y) ha toccato un mostro (`tocco`: il suo indice, entro SOPRA.tocco) o se uno sveglio gli è arrivato
// addosso (SOPRA.contatto). Entra il branco di chi apre (entro RAGGIO_SCONTRO dall'eroe) e chi è già sveglio e a un passo (SOPRA.aUnPasso),
// della stessa regione, al più MOSTRI_IN_CAMPO, i più vicini; chi apre è sempre il primo. Torna null o
// { chi, campo: [indici], tocco, regione, x, y } (x, y: dove l'eroe è, per la scena e per l'esito)
export function incontro(stato, { x, y }, { tocco = null } = {}) {
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
    for (const q of stato.mostri) {
      if (q.morto || !q.sveglio || Math.abs(q.fx - x) > 2 || Math.abs(q.fy - y) > 2) continue
      if (lontano(q) <= SOPRA.contatto && (!chi || lontano(q) < lontano(chi))) chi = q
    }
  }
  if (!chi) return null
  const altri = stato.mostri.filter(q => q !== chi && !q.morto && q.regione === chi.regione &&
    ((q.branco === chi.branco && lontano(q) <= RAGGIO_SCONTRO) || (q.sveglio && lontano(q) <= SOPRA.aUnPasso)))
    .sort((p, q) => lontano(p) - lontano(q))
  const campo = [chi, ...altri].slice(0, MOSTRI_IN_CAMPO).map(q => q.i)
  return { chi: chi.i, campo, tocco: toccato, regione: m.regioni[chi.regione].chiave, x, y }
}

// la discesa finta di uno scontro di sopra: una tappa di un piano, con le domande della regione e il livello del suo inizio (il bottino, e
// l'esperienza grigia per chi la supera di tanto: `potenza`, dati/zone.js)
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
// (docs/sotterraneo/scontro.md). `verso`: dove guardava l'eroe nel mondo (l'agguato alle spalle). `missioni`: solo le «sconfiggi N»
export function apriLoScontro(stato, inc, { eroe = 'cavaliere', roba = null, crescita = null, forze = null, verso = null, missioni = [], conti = {}, rnd = null, seme = null } = {}) {
  const m = stato.mondo, chi = stato.mostri[inc.chi], R = m.regioni[chi.regione]
  const campo = inc.campo.map(i => { const q = stato.mostri[i]; return { ...structuredClone(q.scheda), ossa: q.ossa, sveglio: q.sveglio, mondo: q.i } })
  const s = seme != null ? seme : fnv(stato.base, 'scontro', stato.passi, inc.chi) % 100000
  const corsa = new Corsa(tappaDelPalco(stato, R, campo), { seme: s, rnd: rnd || seminato(s * 31 + 17), eroe, roba, crescita, ricomparsa: false, botti: false,
                                                         missioni: (missioni || []).filter(q => q.tipo === 'conta'), conti })
  const f = forze || stato.forze
  if (f) { corsa.vita = Math.max(1, Math.min(corsa.vitaMax, f.vita)); corsa.energia = Math.max(0, Math.min(corsa.energiaMax, f.energia)) }
  corsa.verso = daVerso(verso, chi.fx - inc.x, chi.fy - inc.y)
  corsa.dalMondo = { x: inc.x, y: inc.y, regione: R.chiave }
  const primo = corsa.livello.robe.find(r => r.che === 'mostro' && r.mondo === chi.i)
  corsa.scontro(primo, { tocco: inc.tocco })
  return corsa
}

// Una taglia: cosa vale un mostro ucciso per una quest di caccia (docs/sotterraneo/mondo-aperto-quest.md). L'esito ne dà una per morto
export const tagliaDi = (q, R) => ({ specie: q.tipo, regione: R.chiave, anello: R.anello, livello: q.livello, caporale: q.caporale, signore: q.signore, id: q.id })
// quante delle `taglie` contano per una quest che chiede quella specie (o qualunque, null) in quella regione (o ovunque, null); `signore`:
// solo i signori. È l'aggancio per chi scrive le quest: le taglie arrivano dall'esito di ogni scontro (`uccisi`)
export const taglieDaContare = (taglie, { specie = null, regione = null, signore = false, anello = null } = {}) =>
  (taglie || []).filter(t => (!specie || t.specie === specie) && (!regione || t.regione === regione) && (!signore || t.signore) && (anello == null || t.anello === anello)).length

// svenire sopra (la decisione 6 dell'utente): metà delle gemme, le tasche vuote tranne i pezzi rari (gli «epici», col nome temprato, runico…)
// e i leggendari; quello che si porta addosso resta, come giù
export const SI_TIENE_SVENENDO = k => !!(COSE[k] && rangoDellaRarita(COSE[k].rarita) >= rangoDellaRarita('raro'))
export function perdeSvenendo(roba) {
  return { ...roba, gemme: Math.floor((roba.gemme || 0) / 2), zaino: (roba.zaino || []).filter(SI_TIENE_SVENENDO) }
}
// la città dove ci si risveglia: la più vicina a piedi da (x, y) coi passaggi di adesso (`terra`, motore/mondo-sopra.js terraDelMondo), accanto
// alla sua pietra; senza `terra`, o se nessuna si raggiunge, il villaggio
export function cittaDelRisveglio(m, x, y, terra = null) {
  const villaggio = m.citta.find(c => c.chiave === 'villaggio')
  const dove = c => ({ citta: c.chiave, nome: c.nome, x: (c.pietra || c.portale).accanto.x, y: (c.pietra || c.portale).accanto.y })
  if (!terra) return dove(villaggio)
  const dist = terra.raggiungibili({ x: Math.floor(x), y: Math.floor(y) })
  let meglio = null, d0 = Infinity
  for (const c of m.citta) {
    const a = (c.pietra || c.portale).accanto, d = dist.get(a.y * m.W + a.x)
    if (d != null && d < d0) { d0 = d; meglio = c }
  }
  return dove(meglio || villaggio)
}

// Com'è finito lo scontro della Corsa `corsa` (aperta da apriLoScontro), e cosa cambia nel mondo. `come`: 'vinto', 'scappato', 'svenuto', o
// 'aperto' (il foglio è ancora lì: non cambia niente). Vinto: si raccoglie quello che è caduto (come nei dungeon: le gemme, e le cose che
// vanno addosso o in tasca; quelle che non ci stanno restano per terra nel mondo, `stato.perTerra`), i morti tornano a passi (i caporali e il
// signore no, fino al giro dopo). Svenuto: ci si risveglia nella città più vicina con metà delle gemme e le tasche vuote, tranne rari e
// leggendari; tutti i mostri tornano a casa a dormire. Lo stato ha le forze nuove (`stato.forze`); `roba`, `crescita`, `forze` sono da
// riportare nell'avventura. `terra`: per la città del risveglio
export function esitoDelloScontro(stato, corsa, { terra = null } = {}) {
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
      q.torna = q.caporale || q.signore ? null : Math.round(stato.passi + SOPRA.ricomparsa * (1 + tiroDalSeme(47, stato.base, q.i, q.morti)))
      uccisi.push(tagliaDi(q, m.regioni[q.regione]))
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
    const d = corsa.dalMondo || {}
    risveglio = cittaDelRisveglio(m, d.x ?? m.partenza.x, d.y ?? m.partenza.y, terra)
    for (const q of stato.mostri) if (!q.morto) { q.sveglio = false; q.calmo = 0; q.ossa = q.scheda.ossaMax; q.fx = q.casa.x + 0.5; q.fy = q.casa.y + 0.5 }
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
  const R = stato.mondo.regioni[stato.mondo.reg[c.y * stato.mondo.W + c.x]] || stato.mondo.regioni.find(q => q.anello)
  const corsa = new Corsa(tappaDelPalco(stato, R.fascia ? R : stato.mondo.regioni.find(q => q.anello), [], [{ che: 'cosa', cosa: c.cosa, em: COSE[c.cosa].em }]),
                          { seme: 1, rnd: seminato(7), eroe, roba, crescita, ricomparsa: false })
  const r = corsa.livello.robe.find(q => q.che === 'cosa')
  corsa.trovata(r)
  if (r.presa) stato.perTerra.splice(i, 1)
  return { presa: !!r.presa, roba: corsa.roba, avvisi: corsa.avvisi }
}
