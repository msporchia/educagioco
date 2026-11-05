/* IL CUOCO — la stessa cucina, ma ci si cammina dentro: una levetta muove il cuoco,
   un tasto prende e posa, uno taglia. Vedi docs/bancarella/cuoco.md. Puro, gira in Node. */
import { INGREDIENTI, cucinaNuova, dispensaDi, avanza, quantoStazione } from './cucina.js'

export const TAGLI = 5             // i colpi di tasto per tagliare: col dito sul tasto si fa prima che col coltello
export const LARGA = 7, FONDA = 6  // la stanza, in celle
const VELOCITA = 3.4
const RAGGIO = 0.32                // quanto è largo il cuoco
const PORTATA = 0.55               // quanto arrivano le mani, da dove sono: mai alle spalle
const DAVANTI = 0.6

/* La pianta: tutto il giro è di banconi, in mezzo c'è l'isola. In fondo la consegna,
   sotto il cliente; i fuochi accanto alla pasta e alla carne, il tagliere accanto all'insalata. */
const FISSE = {
  '1,0': 'pentola', '2,0': 'padella', '4,0': 'forno', '5,5': 'tagliere',
  '3,0': { tipo: 'consegna' }, '2,5': { tipo: 'piatti' }, '1,5': { tipo: 'bidone' },
  '0,1': 'pasta', '0,2': 'carne', '0,3': 'uovo', '0,4': 'impasto',
  '6,1': 'sugo', '6,2': 'formaggio', '6,3': 'pane', '6,4': 'insalata',
}
const ISOLA = ['2,2', '3,2', '4,2']

function pianta(c) {
  const celle = [], cose = dispensaDi(c)
  for (let z = 0; z < FONDA; z++) for (let x = 0; x < LARGA; x++) {
    const id = `${x},${z}`
    if (x && z && x < LARGA - 1 && z < FONDA - 1 && !ISOLA.includes(id)) continue
    const f = FISSE[id]
    const cella = { id, x, z, tipo: 'banco' }
    if (f?.tipo) cella.tipo = f.tipo
    else if (c.stazioni[f]) { cella.tipo = 'stazione'; cella.nome = f }
    else if (cose.includes(f)) { cella.tipo = 'cassetta'; cella.cosa = f }
    celle.push(cella)
  }
  return celle
}

/* `camp` è una delle cucine di data/bancarella.js: le stesse del dito. */
export function cucinaCuoco(camp) {
  const c = cucinaNuova(camp)
  return { ...c, celle: pianta(c), sopra: {}, leva: { x: 0, z: 0 }, perche: '',
           cuoco: { x: 3.5, z: 4, verso: 0, mano: null, cammina: false } }
}

/* ── camminare ── */
function urta(c, x, z) {
  return c.celle.some(k => {
    const dx = x - Math.max(k.x, Math.min(x, k.x + 1)), dz = z - Math.max(k.z, Math.min(z, k.z + 1))
    return dx * dx + dz * dz < RAGGIO * RAGGIO
  })
}

function cammina(c, dt) {
  const k = c.cuoco, forza = Math.min(1, Math.hypot(c.leva.x, c.leva.z))
  k.cammina = forza > 0.15
  if (!k.cammina) return
  k.verso = Math.atan2(c.leva.x, c.leva.z)
  const passo = VELOCITA * forza * dt
  const dx = Math.sin(k.verso) * passo, dz = Math.cos(k.verso) * passo
  // un asse per volta: contro un bancone si scivola, non ci si ferma
  if (!urta(c, k.x + dx, k.z)) k.x += dx
  if (!urta(c, k.x, k.z + dz)) k.z += dz
}

export function passo(c, dt) {
  cammina(c, dt)
  avanza(c, dt)
  return c
}

/* La cella davanti alle mani: quella che il tasto tocca. */
export function bersaglio(c) {
  const k = c.cuoco
  const px = k.x + Math.sin(k.verso) * DAVANTI, pz = k.z + Math.cos(k.verso) * DAVANTI
  const lontana = (x, z, q) => Math.hypot(x - Math.max(q.x, Math.min(x, q.x + 1)), z - Math.max(q.z, Math.min(z, q.z + 1)))
  let meglio = null, vicino = Infinity
  for (const q of c.celle) {
    const d = lontana(px, pz, q) + Math.hypot(px - q.x - 0.5, pz - q.z - 0.5) * 0.01
    if (lontana(px, pz, q) > PORTATA) continue
    if (d < vicino) { vicino = d; meglio = q }
  }
  return meglio
}

/* ── le cose ── */
const crudo = cosa => ({ cosa, fatta: !INGREDIENTI[cosa].va, bruciata: false })
const nuovoPiatto = () => ({ piatto: true, cose: [], pronto: '', daInfornare: false })
const ePiatto = o => !!o?.piatto

// sul piatto si posa in qualunque ordine; così si dispone, perché il disegno ci conta
const ORDINE = ['impasto', 'pasta', 'uovo', 'pane', 'carne', 'insalata', 'sugo', 'formaggio']
const prendeIl = (c, p, cosa) => !p.pronto && !p.daInfornare && !p.cose.includes(cosa) &&
  c.ricette.some(r => [...p.cose, cosa].every(x => r.passi.includes(x)))

function sulPiatto(c, p, cosa) {
  p.cose = [...p.cose, cosa].sort((a, b) => ORDINE.indexOf(a) - ORDINE.indexOf(b))
  const r = c.ricette.find(x => x.passi.length === p.cose.length && x.passi.every(k => p.cose.includes(k)))
  if (r?.forno) p.daInfornare = true
  else if (r) p.pronto = r.emoji
}

const nonPronta = o => (INGREDIENTI[o.cosa].va === 'tagliere' ? 'Prima va tagliata' : 'Prima va cotta')
const libera = () => ({ fase: 'vuota', t: 0, cosa: '', colpi: 0 })

/* Cosa farebbe il tasto: { nome, fai } se si può, { perche } se no. La tela lo legge
   a ogni fotogramma per scrivere il tasto; `usa` lo esegue. */
export function decidi(c) {
  const t = bersaglio(c), k = c.cuoco, m = k.mano
  if (!t) return { perche: m ? 'Avvicinati a un bancone' : 'Avvicinati a qualcosa' }
  if (t.tipo === 'consegna') return ePiatto(m) && m.pronto ? { nome: 'Servi', consegna: true } : { perche: 'Qui si porta il piatto finito' }
  if (t.tipo === 'bidone') return m ? { nome: 'Butta', fai: () => { k.mano = null } } : { perche: 'Qui si butta quello che è bruciato' }
  if (t.tipo === 'piatti') {
    if (!m) return { nome: 'Prendi', fai: () => { k.mano = nuovoPiatto() } }
    if (ePiatto(m) && !m.cose.length) return { nome: 'Posa', fai: () => { k.mano = null } }
    return { perche: 'Qui stanno i piatti puliti' }
  }
  if (t.tipo === 'cassetta') return dallaCassetta(c, t, m)
  if (t.tipo === 'stazione') return allaStazione(c, t.nome, m)
  return sulBanco(c, t, m)
}

function dallaCassetta(c, t, m) {
  const k = c.cuoco
  if (!m) return { nome: 'Prendi', fai: () => { k.mano = crudo(t.cosa) } }
  if (!ePiatto(m)) return m.cosa === t.cosa && !m.bruciata && m.fatta === crudo(t.cosa).fatta ? { nome: 'Posa', fai: () => { k.mano = null } } : { perche: 'Le mani sono piene' }
  const o = crudo(t.cosa)
  if (!o.fatta) return { perche: nonPronta(o) }
  return prendeIl(c, m, t.cosa) ? { nome: 'Metti', fai: () => sulPiatto(c, m, t.cosa) } : { perche: 'Su questo piatto non va' }
}

function sulBanco(c, t, m) {
  const k = c.cuoco, o = c.sopra[t.id]
  if (!o && !m) return { perche: 'Qui non c\'è niente' }
  if (!o) return { nome: 'Posa', fai: () => { c.sopra[t.id] = m; k.mano = null } }
  if (!m) return { nome: 'Prendi', fai: () => { k.mano = o; delete c.sopra[t.id] } }
  const [p, cosa] = ePiatto(o) ? [o, m] : [m, o]
  if (!ePiatto(p) || ePiatto(cosa)) return { perche: 'Le mani sono piene' }
  if (cosa.bruciata) return { perche: 'Quello è bruciato: va nel bidone' }
  if (!cosa.fatta) return { perche: nonPronta(cosa) }
  if (!prendeIl(c, p, cosa.cosa)) return { perche: 'Su questo piatto non va' }
  return { nome: 'Metti', fai: () => {
    sulPiatto(c, p, cosa.cosa)
    if (p === o) k.mano = null
    else delete c.sopra[t.id]
  } }
}

function allaStazione(c, nome, m) {
  const k = c.cuoco, s = c.stazioni[nome], forno = nome === 'forno'
  const svuota = () => { c.stazioni[nome] = libera() }
  if (s.fase === 'vuota') {
    if (forno) {
      if (ePiatto(m) && m.daInfornare) return { nome: 'Inforna', fai: () => { c.stazioni.forno = { ...libera(), fase: 'cuoce', cosa: 'pizza' }; k.mano = null } }
      return { perche: 'Qui va la pizza condita, sul piatto' }
    }
    if (!m) return { perche: nome === 'tagliere' ? 'Porta qui l\'insalata' : 'Porta qui quello da cuocere' }
    if (ePiatto(m) || m.fatta || INGREDIENTI[m.cosa].va !== nome) return { perche: 'Qui non va' }
    return { nome: nome === 'tagliere' ? 'Posa' : 'Cuoci', fai: () => {
      c.stazioni[nome] = { ...libera(), fase: nome === 'tagliere' ? 'taglia' : 'cuoce', cosa: m.cosa }
      k.mano = null
    } }
  }
  if (s.fase === 'taglia') return { perche: 'Premi taglia' }
  if (s.fase === 'cuoce') return { perche: 'Sta cuocendo' }
  if (s.fase === 'scotta') {
    if (m) return { perche: 'È bruciato: a mani libere, e nel bidone' }
    return { nome: 'Prendi', fai: () => { k.mano = { cosa: s.cosa === 'pizza' ? 'impasto' : s.cosa, fatta: true, bruciata: true }; svuota() } }
  }
  // pronta
  if (forno) {
    if (m && !(ePiatto(m) && !m.cose.length)) return { perche: 'Le mani sono piene' }
    return { nome: 'Prendi', fai: () => { k.mano = { ...nuovoPiatto(), cose: ['pizza'], pronto: '🍕' }; svuota() } }
  }
  if (!m) return { nome: 'Prendi', fai: () => { k.mano = { cosa: s.cosa, fatta: true, bruciata: false }; svuota() } }
  if (ePiatto(m) && prendeIl(c, m, s.cosa)) return { nome: 'Metti', fai: () => { sulPiatto(c, m, s.cosa); svuota() } }
  return { perche: ePiatto(m) ? 'Su questo piatto non va' : 'Le mani sono piene' }
}

/* Il tasto grande. Torna `true` se è successo; se no `perche` dice cosa manca. */
export function usa(c) {
  const d = decidi(c)
  c.perche = d.perche || ''
  if (!d.fai) return false
  d.fai()
  return true
}

/* Il tasto del coltello: a mani libere, davanti al tagliere con l'insalata sopra. */
export const puoTagliare = c => {
  const t = bersaglio(c)
  return !c.cuoco.mano && t?.nome === 'tagliere' && c.stazioni.tagliere.fase === 'taglia'
}
export function taglia(c) {
  c.perche = ''
  if (!puoTagliare(c)) { c.perche = c.stazioni.tagliere ? 'Vai al tagliere, con le mani libere' : ''; return false }
  const s = c.stazioni.tagliere
  if (++s.colpi >= TAGLI) s.fase = 'pronta'
  return true
}

/* Il piatto in mano va al cliente, se è uno di quelli che vuole. */
export function consegna(c, vuole) {
  const m = c.cuoco.mano
  if (!m?.pronto || !vuole.includes(m.pronto)) return false
  c.cuoco.mano = null
  return true
}

// la barra sulla stazione, da 0 a 1
export const quanto = s => (s.fase === 'taglia' ? s.colpi / TAGLI : quantoStazione(s))
