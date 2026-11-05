/* IL CUOCO — la stessa cucina, ma ci si cammina dentro: si tocca un posto, il cuoco
   ci va e fa quello che lì è ovvio. Vedi docs/bancarella/cuoco.md. Puro, gira in Node. */
import { INGREDIENTI, cucinaNuova, dispensaDi, avanza, quantoStazione } from './cucina.js'

export const TAGLI = 5             // i colpi di coltello
const COLPO = 0.3                  // i secondi di un colpo: il cuoco taglia da sé, fino alla fine
export const LARGA = 7, FONDA = 7  // la stanza, in celle
export const FILA_MAX = 6          // i tocchi che il cuoco si ricorda
const VELOCITA = 3.6

/* La pianta: tutto il giro è di banconi, in mezzo c'è l'isola. In fondo la consegna,
   sotto il cliente; i fuochi accanto alla pasta e alla carne, il tagliere accanto all'insalata. */
const FISSE = {
  '1,0': 'pentola', '2,0': 'padella', '4,0': 'forno', '5,6': 'tagliere',
  '3,0': { tipo: 'consegna' }, '2,6': { tipo: 'piatti' }, '1,6': { tipo: 'bidone' },
  '0,1': 'pasta', '0,2': 'carne', '0,3': 'uovo', '0,4': 'impasto',
  '6,1': 'sugo', '6,2': 'formaggio', '6,3': 'pane', '6,4': 'insalata',
}
const ISOLA = ['2,3', '3,3', '4,3']

// qui il formaggio si taglia: col dito no, e le ricette sono le stesse
const vaA = cosa => (cosa === 'formaggio' ? 'tagliere' : INGREDIENTI[cosa].va)

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

/* `camp` è una delle cucine di data/bancarella.js: le stesse del dito.
   `fila`: i posti toccati, in ordine; `strada`: i punti per arrivare al primo;
   `arrivato`: il posto raggiunto, dove chi gioca fa la mossa (`arriva`). */
export function cucinaCuoco(camp) {
  const c = cucinaNuova(camp)
  if (dispensaDi(c).includes('formaggio')) c.stazioni.tagliere ||= libera()
  return { ...c, celle: pianta(c), sopra: {}, fila: [], strada: [], arrivato: '', perche: '', tagliando: false, colpo: 0,
           cuoco: { x: 3.5, z: 4.5, verso: 0, mano: null, cammina: false } }
}

/* ── camminare ── */
const cellaDi = (c, id) => c.celle.find(k => k.id === id)
const pieni = c => new Set(c.celle.map(k => k.id))
const pavimento = (occupate, x, z) => x >= 0 && z >= 0 && x < LARGA && z < FONDA && !occupate.has(`${x},${z}`)

/* La via più corta di casella in casella, fino a una delle `mete`. In diagonale
   solo se i due lati sono liberi: se no si taglierebbe lo spigolo di un bancone. */
function via(occupate, da, mete) {
  const chiave = ([x, z]) => `${x},${z}`
  const prima = new Map([[chiave(da), null]]), coda = [da], cerco = new Set(mete.map(chiave))
  while (coda.length) {
    const q = coda.shift()
    if (cerco.has(chiave(q))) {
      const strada = []
      for (let p = q; p; p = prima.get(chiave(p))) strada.unshift(p)
      return strada
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const n = [q[0] + dx, q[1] + dz]
      if (prima.has(chiave(n)) || !pavimento(occupate, ...n)) continue
      if (dx && dz && !(pavimento(occupate, q[0] + dx, q[1]) && pavimento(occupate, q[0], q[1] + dz))) continue
      prima.set(chiave(n), q)
      coda.push(n)
    }
  }
  return null
}

const dovesta = k => [Math.floor(k.x), Math.floor(k.z)]
const aiCentri = strada => strada.map(([x, z]) => ({ x: x + 0.5, z: z + 0.5 }))

/* Da dove si arriva a una cella: i pavimenti di fianco; per gli angoli, quello in diagonale. */
function postiPer(occupate, q) {
  const lati = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, z]) => [q.x + x, q.z + z]).filter(p => pavimento(occupate, ...p))
  if (lati.length) return lati
  return [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z]) => [q.x + x, q.z + z]).filter(p => pavimento(occupate, ...p))
}

/* Si è toccato il pavimento: il cuoco lascia tutto e va lì. */
export function vaiA(c, x, z) {
  const occupate = pieni(c), strada = via(occupate, dovesta(c.cuoco), [[x, z]])
  if (!strada) return false
  c.fila = []; c.arrivato = ''; c.tagliando = false
  c.strada = aiCentri(strada)
  return true
}

/* Si è toccato un bancone: il cuoco se lo segna, e ci va dopo quelli di prima. */
export function tocca(c, id) {
  if (c.fila.length >= FILA_MAX || !cellaDi(c, id)) return false
  if (!c.fila.length) c.strada = []
  c.fila.push(id)
  return true
}

function versoIl(c, id) {
  const q = cellaDi(c, id), k = c.cuoco
  k.verso = Math.atan2(q.x + 0.5 - k.x, q.z + 0.5 - k.z)
}

function cammina(c, dt) {
  const k = c.cuoco
  if (!c.strada.length && c.fila.length && !c.arrivato) {
    const occupate = pieni(c), strada = via(occupate, dovesta(k), postiPer(occupate, cellaDi(c, c.fila[0])))
    if (!strada) { c.fila.shift(); return }
    c.strada = aiCentri(strada)
  }
  let resta = VELOCITA * dt
  while (resta > 0 && c.strada.length) {
    const p = c.strada[0], dx = p.x - k.x, dz = p.z - k.z, d = Math.hypot(dx, dz)
    if (d > 1e-6) k.verso = Math.atan2(dx, dz)
    if (d > resta) { k.x += dx / d * resta; k.z += dz / d * resta; resta = 0 }
    else { k.x = p.x; k.z = p.z; resta -= d; c.strada.shift() }
  }
  k.cammina = c.strada.length > 0
  if (!k.cammina && c.fila.length && !c.arrivato) { versoIl(c, c.fila[0]); c.arrivato = c.fila[0] }
}

/* Mentre taglia sta lì: la fila aspetta, e solo il pavimento lo porta via. */
function taglia(c, dt) {
  c.colpo += dt
  if (c.colpo < COLPO) return
  c.colpo -= COLPO
  const s = c.stazioni.tagliere
  if (++s.colpi < TAGLI) return
  s.fase = 'pronta'
  c.tagliando = false
  c.colpo = 0
}

export function passo(c, dt) {
  if (c.tagliando) taglia(c, dt)
  else cammina(c, dt)
  avanza(c, dt)
  return c
}

/* Il cuoco è arrivato: torna il posto, e la fila va avanti. */
export function arriva(c) {
  const q = cellaDi(c, c.arrivato)
  c.arrivato = ''
  c.fila.shift()
  return q
}

/* ── le cose ── */
const crudo = cosa => ({ cosa, fatta: !vaA(cosa), bruciata: false })
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

const nonPronta = o => (vaA(o.cosa) === 'tagliere' ? 'Prima si taglia' : 'Prima si cuoce')

/* Due cose senza piatto: se stanno nella stessa ricetta si uniscono, e il piatto ce lo mette il cuoco. */
function unisci(c, a, b, dopo) {
  if (a.bruciata || b.bruciata) return { perche: 'Quello è bruciato: va nel bidone' }
  const cruda = [a, b].find(o => !o.fatta)
  if (cruda) return { perche: nonPronta(cruda) }
  const p = nuovoPiatto()
  sulPiatto(c, p, a.cosa)
  if (!prendeIl(c, p, b.cosa)) return { perche: 'Questi due non vanno insieme' }
  return { fai: () => { sulPiatto(c, p, b.cosa); dopo(p) } }
}
const libera = () => ({ fase: 'vuota', t: 0, cosa: '', colpi: 0 })

/* Quello che è ovvio fare in un posto: { fai } se si può, { perche } se no. */
function decidi(c, t) {
  const k = c.cuoco, m = k.mano
  if (t.tipo === 'bidone') return m ? { fai: () => { k.mano = null } } : { perche: 'Qui si butta quello che è bruciato' }
  if (t.tipo === 'piatti') {
    if (!m) return { fai: () => { k.mano = nuovoPiatto() } }
    if (ePiatto(m) && !m.cose.length) return { fai: () => { k.mano = null } }
    return { perche: 'Qui stanno i piatti puliti' }
  }
  if (t.tipo === 'cassetta') return dallaCassetta(c, t, m)
  if (t.tipo === 'stazione') return allaStazione(c, t.nome, m)
  return sulBanco(c, t, m)
}

function dallaCassetta(c, t, m) {
  const k = c.cuoco
  if (!m) return { fai: () => { k.mano = crudo(t.cosa) } }
  const o = crudo(t.cosa)
  if (!ePiatto(m)) {
    if (m.cosa === t.cosa && !m.bruciata && m.fatta === o.fatta) return { fai: () => { k.mano = null } }
    return unisci(c, m, o, p => { k.mano = p })
  }
  if (!o.fatta) return { perche: nonPronta(o) }
  return prendeIl(c, m, t.cosa) ? { fai: () => sulPiatto(c, m, t.cosa) } : { perche: 'Su questo piatto non va' }
}

function sulBanco(c, t, m) {
  const k = c.cuoco, o = c.sopra[t.id]
  if (!o && !m) return { perche: 'Qui non c\'è niente' }
  if (!o) return { fai: () => { c.sopra[t.id] = m; k.mano = null } }
  if (!m) return { fai: () => { k.mano = o; delete c.sopra[t.id] } }
  if (!ePiatto(o) && !ePiatto(m)) return unisci(c, o, m, p => { c.sopra[t.id] = p; k.mano = null })
  const [p, cosa] = ePiatto(o) ? [o, m] : [m, o]
  if (ePiatto(cosa)) return { perche: 'Le mani sono piene' }
  if (cosa.bruciata) return { perche: 'Quello è bruciato: va nel bidone' }
  if (!cosa.fatta) return { perche: nonPronta(cosa) }
  if (!prendeIl(c, p, cosa.cosa)) return { perche: 'Su questo piatto non va' }
  return { fai: () => {
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
      if (ePiatto(m) && m.daInfornare) return { fai: () => { c.stazioni.forno = { ...libera(), fase: 'cuoce', cosa: 'pizza' }; k.mano = null } }
      return { perche: 'Qui va la pizza condita, sul piatto' }
    }
    if (!m) return { perche: nome === 'tagliere' ? 'Porta qui quello da tagliare' : 'Porta qui quello da cuocere' }
    if (ePiatto(m) || m.fatta || vaA(m.cosa) !== nome) return { perche: 'Qui non va' }
    return { fai: () => {
      c.stazioni[nome] = { ...libera(), fase: nome === 'tagliere' ? 'taglia' : 'cuoce', cosa: m.cosa }
      c.tagliando = nome === 'tagliere'
      k.mano = null
    } }
  }
  if (s.fase === 'taglia') {
    if (m) return { perche: 'Per tagliare servono le mani libere' }
    return { fai: () => { c.tagliando = true } }
  }
  if (s.fase === 'cuoce') return { perche: 'Sta cuocendo' }
  if (s.fase === 'scotta') {
    if (m) return { perche: 'È bruciato: a mani libere, e nel bidone' }
    return { fai: () => { k.mano = { cosa: s.cosa === 'pizza' ? 'impasto' : s.cosa, fatta: true, bruciata: true }; svuota() } }
  }
  // pronta
  if (forno) {
    if (m && !(ePiatto(m) && !m.cose.length)) return { perche: 'Le mani sono piene' }
    return { fai: () => { k.mano = { ...nuovoPiatto(), cose: ['pizza'], pronto: '🍕' }; svuota() } }
  }
  if (!m) return { fai: () => { k.mano = { cosa: s.cosa, fatta: true, bruciata: false }; svuota() } }
  if (ePiatto(m) && prendeIl(c, m, s.cosa)) return { fai: () => { sulPiatto(c, m, s.cosa); svuota() } }
  if (!ePiatto(m)) return unisci(c, m, { cosa: s.cosa, fatta: true }, p => { k.mano = p; svuota() })
  return { perche: 'Su questo piatto non va' }
}

/* La mossa nel posto `t`. Torna `true` se è successa; se no `perche` dice cosa manca. */
export function usa(c, t) {
  const d = decidi(c, t)
  c.perche = d.perche || ''
  if (!d.fai) return false
  d.fai()
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
