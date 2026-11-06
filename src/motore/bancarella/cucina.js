/* LA CUCINA — ci si cammina dentro: si tocca un posto, il cuoco ci va e fa quello che
   lì è ovvio, poi la cassa di sempre. Vedi docs/bancarella/cucina.md. Puro, gira in Node. */
import { INGREDIENTI, CUCINE, ricetteDi, attrezziDi } from '../../data/bancarella-cucine.js'

export const TAGLI = 5             // i colpi di coltello
const COLPO = 0.3                  // i secondi di un colpo: il cuoco taglia da sé, fino alla fine
const LAVATA = 1.4                 // i secondi per lavare un piatto
const RITORNO = 6                  // quanto ci mette un piatto a tornare sporco
const PIZZA = { cuoce: 8, tiene: 45 }  // nel forno
const VELOCITA = 4.2

/* La pianta, a zone: in fondo si finisce (lavello, piatti, consegna), a sinistra si taglia, a destra
   si cuoce, davanti la dispensa. La stanza è grande quanto serve: chi ha poche cose non corre.
   `:2` è l'attrezzo doppio. */
const A_SINISTRA = ['tagliere', 'tagliere:2', 'pomodoro', 'insalata', 'formaggio', 'pesce']
const A_DESTRA = ['pentola', 'pentola:2', 'padella', 'padella:2', 'forno', 'forno:2', 'pasta', 'carne', 'uovo']
const DAVANTI = ['pane', 'sugo', 'riso', 'alga', 'impasto']
const RIGHE_ISOLE = [2, 3]         // gli appoggi, nella colonna di mezzo
const LIBERI = 3                   // i banconi vuoti che si cerca di lasciare
const MINIMO = 5, MASSIMO = 10     // quanto è fonda

export const tipoDi = nome => nome.split(':')[0]
const libera = () => ({ fase: 'vuota', t: 0, cosa: '', colpi: 0 })

/* Gli ingredienti che servono alle ricette della cucina: le cassette. */
export const dispensaDi = c => [...new Set(c.ricette.flatMap(r => r.passi))]

function pianta(c, quanteIsole) {
  const cose = dispensaDi(c), servono = l => l.filter(k => c.stazioni[k] || cose.includes(k))
  const sinistra = servono(A_SINISTRA), destra = servono(A_DESTRA), dispensa = servono(DAVANTI)
  const largo = c.puliti !== null || quanteIsole ? 5 : 4
  const fondo = (() => {
    const roba = sinistra.length + destra.length + dispensa.length
    let f = Math.min(MASSIMO, Math.max(MINIMO, sinistra.length + 2, destra.length + 2, quanteIsole ? RIGHE_ISOLE[quanteIsole - 1] + 3 : 0))
    while (f < MASSIMO && roba + LIBERI > 2 * (f - 2) + largo - 2) f++
    return f
  })()
  /* Negli angoli si arriva solo di sbieco: niente attrezzi, e cassette solo se non ci stanno altrove.
     Le liste cominciano dagli attrezzi, quindi quello che avanza è sempre una cassetta. */
  const posti = fondo - 2
  const davanti = dispensa.splice(0, largo - 2)
  for (const k of dispensa.splice(0)) (sinistra.length <= destra.length ? sinistra : destra).push(k)
  const angoli = [...sinistra.splice(posti), ...destra.splice(posti)]
  const inFondo = largo === 5 ? [c.puliti !== null ? 'lavello' : '', 'piatti', 'consegna'] : ['piatti', 'consegna']
  const isole = RIGHE_ISOLE.slice(0, quanteIsole).map(z => `2,${z}`)
  const cosaC = (x, z) => {
    if (z === fondo - 1) return x === largo - 1 ? 'bidone' : x === 0 ? angoli[0] : davanti[x - 1]
    if (z === 0) return x === 0 ? angoli[1] : x === largo - 1 ? angoli[2] : inFondo[x - 1]
    return x === 0 ? sinistra[z - 1] : x === largo - 1 ? destra[z - 1] : undefined
  }
  const celle = []
  for (let z = 0; z < fondo; z++) for (let x = 0; x < largo; x++) {
    const id = `${x},${z}`
    if (x && z && x < largo - 1 && z < fondo - 1 && !isole.includes(id)) continue
    const f = cosaC(x, z), cella = { id, x, z, tipo: 'banco' }
    if (['lavello', 'piatti', 'consegna', 'bidone'].includes(f)) cella.tipo = f
    else if (c.stazioni[f]) { cella.tipo = 'stazione'; cella.nome = f }
    else if (f) { cella.tipo = 'cassetta'; cella.cosa = f }
    celle.push(cella)
  }
  return { celle, largo, fondo }
}

/* `camp` è una delle CUCINE: dice lei quanti attrezzi, appoggi e piatti ci sono.
   `fila`: il posto toccato, finché il cuoco non ci arriva; `strada`: i punti per arrivarci;
   `arrivato`: il posto raggiunto, dove chi gioca fa la mossa (`arriva`).
   `puliti`: i piatti in pila, `null` se non finiscono; `sporchi`: quelli nel lavello;
   `ritorni`: i secondi che mancano a quelli in giro. */
export function cucinaNuova(camp = CUCINE[0]) {
  const nomi = attrezziDi(camp).flatMap(t => (camp.copie?.[t] ? [t, `${t}:2`] : [t]))
  const c = { stazioni: Object.fromEntries(nomi.map(n => [n, libera()])), ricette: ricetteDi(camp.ricette),
              puliti: camp.piatti || null, sporchi: 0, ritorni: [] }
  const stanza = pianta(c, camp.appoggi || 0)
  return { ...c, ...stanza, sopra: {}, fila: [], strada: [], arrivato: '', perche: '', tagliando: '', colpo: 0, lavando: false, lavata: 0,
           cuoco: { x: 1.5, z: stanza.fondo - 1.5, verso: 0, mano: null, cammina: false } }
}

const tempiDi = s => (s.cosa === 'pizza' ? PIZZA : INGREDIENTI[s.cosa])

/* Il tempo passa solo su quello che è sul fuoco: `cuoce` → `pronta` → `scotta`. */
function fuochi(c, dt) {
  for (const s of Object.values(c.stazioni)) {
    if (s.fase !== 'cuoce' && s.fase !== 'pronta') continue
    if (!s.cosa || !tempiDi(s)?.cuoce) continue
    const { cuoce, tiene } = tempiDi(s)
    s.t += dt
    if (s.fase === 'cuoce' && s.t >= cuoce) { s.fase = 'pronta'; s.t -= cuoce }
    if (s.fase === 'pronta' && s.t >= tiene) { s.fase = 'scotta'; s.t = 0 }
  }
}

function ritorni(c, dt) {
  c.ritorni = c.ritorni.map(t => t - dt)
  const tornati = c.ritorni.filter(t => t <= 0).length
  if (!tornati) return
  c.sporchi += tornati
  c.ritorni = c.ritorni.filter(t => t > 0)
}

// la barra sulla stazione, da 0 a 1
export function quanto(s) {
  if (s.fase === 'taglia') return s.colpi / TAGLI
  const tempi = s.cosa ? tempiDi(s) : null
  if (!tempi?.cuoce) return 0
  return s.fase === 'cuoce' ? s.t / tempi.cuoce : s.fase === 'pronta' ? 1 - s.t / tempi.tiene : 0
}
export const quantoLavato = c => c.lavata / LAVATA

/* ── camminare ── */
const cellaDi = (c, id) => c.celle.find(k => k.id === id)
const pieni = c => Object.assign(new Set(c.celle.map(k => k.id)), { largo: c.largo, fondo: c.fondo })
const pavimento = (occupate, x, z) => x >= 0 && z >= 0 && x < occupate.largo && z < occupate.fondo && !occupate.has(`${x},${z}`)

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
  c.fila = []; c.arrivato = ''; c.tagliando = ''; c.lavando = false
  c.strada = aiCentri(strada)
  return true
}

/* Si è toccato un bancone: l'ultimo tocco comanda. Se sta tagliando o lavando finisce, e poi ci va. */
export function tocca(c, id) {
  if (!cellaDi(c, id)) return false
  if (!c.tagliando && !c.lavando) { c.strada = []; c.arrivato = '' }
  c.fila = [id]
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
  const s = c.stazioni[c.tagliando]
  if (++s.colpi < TAGLI) return
  s.fase = 'pronta'
  c.tagliando = ''
  c.colpo = 0
}

/* Un tocco, un piatto. */
function lava(c, dt) {
  c.lavata += dt
  if (c.lavata < LAVATA) return
  c.lavata = 0
  c.sporchi--
  c.puliti++
  c.lavando = false
}

export function passo(c, dt) {
  if (c.tagliando) taglia(c, dt)
  else if (c.lavando) lava(c, dt)
  else cammina(c, dt)
  fuochi(c, dt)
  ritorni(c, dt)
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
const crudo = cosa => ({ cosa, fatta: !INGREDIENTI[cosa].va, bruciata: false })
const nuovoPiatto = () => ({ piatto: true, cose: [], pronto: '', daInfornare: false, forno: '' })
const ePiatto = o => !!o?.piatto
const senzaPiatti = c => c.puliti === 0
const usaPiatto = c => { if (c.puliti !== null) c.puliti-- }
const sporcaPiatto = c => { if (c.puliti !== null) c.sporchi++ }

// sul piatto si posa in qualunque ordine; così si dispone, perché il disegno ci conta
const ORDINE = ['impasto', 'pasta', 'riso', 'uovo', 'pane', 'carne', 'pesce', 'alga', 'insalata', 'pomodoro', 'sugo', 'formaggio']
const prendeIl = (c, p, cosa) => !p.cose.includes(cosa) && c.ricette.some(r => [...p.cose, cosa].every(x => r.passi.includes(x)))

function sulPiatto(c, p, cosa) {
  p.cose = [...p.cose, cosa].sort((a, b) => ORDINE.indexOf(a) - ORDINE.indexOf(b))
  const r = c.ricette.find(x => x.passi.length === p.cose.length && x.passi.every(k => p.cose.includes(k)))
  p.pronto = r && !r.forno ? r.emoji : ''
  p.daInfornare = !!r?.forno
  p.forno = r?.forno ? r.emoji : ''
}

const nonPronta = o => (INGREDIENTI[o.cosa].va === 'tagliere' ? 'Prima si taglia' : 'Prima si cuoce')
const LAVALI = 'Non ci sono piatti puliti: lavali'
export const SERVE_PIATTO = 'Serve un piatto: passa dalla pila'
const SOLO_SUL_PIATTO = ['sugo', 'riso']     // in mano non si tengono: come il cotto e il tagliato

/* Due cose senza piatto: se stanno nella stessa ricetta si uniscono, ma il piatto non compare
   da solo: restano `nudo`, e prima di servire si passa dai piatti. */
function unisci(c, a, b, dopo) {
  if (a.bruciata || b.bruciata) return { perche: 'Quello è bruciato: va nel bidone' }
  const cruda = [a, b].find(o => !o.fatta)
  if (cruda) return { perche: nonPronta(cruda) }
  const p = { ...nuovoPiatto(), nudo: true }
  sulPiatto(c, p, a.cosa)
  if (!prendeIl(c, p, b.cosa)) return { perche: 'Questi due non vanno insieme' }
  return { fai: () => { sulPiatto(c, p, b.cosa); dopo(p) } }
}

/* Due mucchi, o un mucchio e un piatto: quello senza piatto passa sull'altro. */
function travaso(c, t, o, m) {
  const k = c.cuoco
  if (!o.nudo && !m.nudo) return { perche: 'Le mani sono piene' }
  const [dentro, via] = o.nudo ? [m, o] : [o, m]
  const prova = { ...dentro, cose: [...dentro.cose] }
  for (const cosa of via.cose) {
    if (!prendeIl(c, prova, cosa)) return { perche: 'Su questo piatto non va' }
    sulPiatto(c, prova, cosa)
  }
  return { fai: () => {
    Object.assign(dentro, prova)
    if (dentro === o) k.mano = null
    else delete c.sopra[t.id]
  } }
}

/* Dalla pila: un piatto a mani vuote; con qualcosa in mano, ci finisce sopra. */
function dallaPila(c, m) {
  const k = c.cuoco
  if (ePiatto(m) && !m.nudo) return m.cose.length ? { perche: 'Qui stanno i piatti puliti' } : { fai: () => { if (c.puliti !== null) c.puliti++; k.mano = null } }
  if (m?.bruciata) return { perche: 'Quello è bruciato: va nel bidone' }
  if (m && !ePiatto(m) && !m.fatta) return { perche: nonPronta(m) }
  if (senzaPiatti(c)) return { perche: LAVALI }
  if (!m) return { fai: () => { usaPiatto(c); k.mano = nuovoPiatto() } }
  if (ePiatto(m)) return { fai: () => { usaPiatto(c); m.nudo = false } }
  return { fai: () => { const p = nuovoPiatto(); sulPiatto(c, p, m.cosa); usaPiatto(c); k.mano = p } }
}

/* Quello che è ovvio fare in un posto: { fai } se si può, { perche } se no. */
function decidi(c, t) {
  const k = c.cuoco, m = k.mano
  if (t.tipo === 'bidone') {
    if (!m) return { perche: 'Qui si butta quello che è bruciato' }
    return { fai: () => { if (ePiatto(m) && !m.nudo) sporcaPiatto(c); k.mano = null } }
  }
  if (t.tipo === 'piatti') return dallaPila(c, m)
  if (t.tipo === 'lavello') {
    if (m) return { perche: 'Per lavare servono le mani libere' }
    if (!c.sporchi) return { perche: 'Non c\'è niente da lavare' }
    return { fai: () => { c.lavando = true } }
  }
  if (t.tipo === 'cassetta') return dallaCassetta(c, t, m)
  if (t.tipo === 'stazione') return allaStazione(c, t.nome, m)
  return sulBanco(c, t, m)
}

function dallaCassetta(c, t, m) {
  const k = c.cuoco, o = crudo(t.cosa)
  if (!m) return SOLO_SUL_PIATTO.includes(t.cosa) ? { perche: SERVE_PIATTO } : { fai: () => { k.mano = o } }
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
  if (ePiatto(o) && ePiatto(m)) return travaso(c, t, o, m)
  const [p, cosa] = ePiatto(o) ? [o, m] : [m, o]
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
  const k = c.cuoco, s = c.stazioni[nome], tipo = tipoDi(nome), forno = tipo === 'forno'
  const svuota = () => { c.stazioni[nome] = libera() }
  if (s.fase === 'vuota') {
    if (forno) {
      if (m?.nudo && m.daInfornare) return { perche: SERVE_PIATTO }
      if (ePiatto(m) && m.daInfornare) return { fai: () => { c.stazioni[nome] = { ...libera(), fase: 'cuoce', cosa: 'pizza', piatto: m }; k.mano = null } }
      return { perche: ePiatto(m) && m.cose.includes('impasto') ? 'Alla pizza manca ancora qualcosa' : 'Qui va la pizza condita, sul piatto' }
    }
    if (!m) return { perche: tipo === 'tagliere' ? 'Porta qui quello da tagliare' : 'Porta qui quello da cuocere' }
    if (ePiatto(m) || m.fatta || INGREDIENTI[m.cosa].va !== tipo) return { perche: 'Qui non va' }
    return { fai: () => {
      c.stazioni[nome] = { ...libera(), fase: tipo === 'tagliere' ? 'taglia' : 'cuoce', cosa: m.cosa }
      c.tagliando = tipo === 'tagliere' ? nome : ''
      k.mano = null
    } }
  }
  if (s.fase === 'taglia') {
    if (m) return { perche: 'Per tagliare servono le mani libere' }
    return { fai: () => { c.tagliando = nome } }
  }
  if (s.fase === 'cuoce') return { perche: 'Sta cuocendo' }
  if (s.fase === 'scotta') {
    if (m) return { perche: 'È bruciato: a mani libere, e nel bidone' }
    return { fai: () => {
      k.mano = { cosa: s.cosa === 'pizza' ? 'impasto' : s.cosa, fatta: true, bruciata: true }
      if (forno) sporcaPiatto(c)
      svuota()
    } }
  }
  // pronta
  if (forno) {
    if (m && !(ePiatto(m) && !m.cose.length)) return { perche: 'Le mani sono piene' }
    return { fai: () => {
      if (m && c.puliti !== null) c.puliti++
      k.mano = { ...nuovoPiatto(), cose: ['pizza', ...s.piatto.cose.filter(x => x === 'carne')], pronto: s.piatto.forno }
      svuota()
    } }
  }
  if (!m) return s.cosa === 'formaggio' ? { fai: () => { k.mano = { cosa: s.cosa, fatta: true, bruciata: false }; svuota() } } : { perche: SERVE_PIATTO }
  if (ePiatto(m)) return prendeIl(c, m, s.cosa) ? { fai: () => { sulPiatto(c, m, s.cosa); svuota() } } : { perche: 'Su questo piatto non va' }
  return unisci(c, m, { cosa: s.cosa, fatta: true }, p => { k.mano = p; svuota() })
}

/* La mossa nel posto `t`. Torna `true` se è successa; se no `perche` dice cosa manca. */
export function usa(c, t) {
  const d = decidi(c, t)
  c.perche = d.perche || ''
  if (!d.fai) return false
  d.fai()
  return true
}

/* Il piatto in mano va al cliente, se è uno di quelli che vuole; poi torna sporco. */
export function consegna(c, vuole) {
  const m = c.cuoco.mano
  if (!m?.pronto || m.nudo || !vuole.includes(m.pronto)) return false
  c.cuoco.mano = null
  if (c.puliti !== null) c.ritorni.push(RITORNO)
  return true
}

/* Alla consegna con quello che non va: si guarda l'ordinazione a cui somiglia di più, e si dice
   cosa manca invece di «non l'ha ordinato nessuno». `ordinati`: i piatti ancora da servire. */
const daFare = k => ({ pentola: ', da cuocere', padella: ', da cuocere', tagliere: ', da tagliare' }[INGREDIENTI[k].va] || '')
export function cheManca(c, m, ordinati) {
  if (m.bruciata) return 'Quello è bruciato: va nel bidone'
  if (!ePiatto(m) && !m.fatta) return nonPronta(m)
  const cose = ePiatto(m) ? m.cose : [m.cosa]
  const simili = c.ricette.filter(r => ordinati.includes(r.emoji) && cose.every(k => r.passi.includes(k)))
    .sort((a, b) => a.passi.length - b.passi.length)
  if (!simili.length) return 'Questo non l\'ha ordinato nessuno'
  const r = simili[0], mancano = r.passi.filter(k => !cose.includes(k))
  if (!mancano.length) return r.forno ? 'Prima va in forno' : SERVE_PIATTO
  if (mancano.length === 1) return `Manca ${INGREDIENTI[mancano[0]].il}${daFare(mancano[0])}`
  return `Mancano ${mancano.map(k => INGREDIENTI[k].il).join(' e ')}`
}

/* Le righe della ricetta. */
const COME = { pentola: 'si cuoce in pentola', padella: 'si cuoce in padella', tagliere: 'si taglia sul tagliere' }
export const passiRicetta = r => [
  ...r.passi.map(k => ({ foto: 'cosa:' + k, nome: INGREDIENTI[k].nome, come: COME[INGREDIENTI[k].va] || 'va dritto sul piatto' })),
  ...(r.forno ? [{ foto: 'attrezzo:forno', nome: 'forno', come: 'tutto insieme sul piatto, poi in forno' }] : []),
]
