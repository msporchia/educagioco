// Il banco del mondo a percorso (docs/sotterraneo/mondo-aperto-mostri.md, «Le misure»): il curioso parte dalla pietra accesa più avanti
// prima del dungeon k (quella della sua zona se il dungeon le sta dopo, se no quella della zona prima, o il villaggio), con la roba e la
// crescita con cui la sua storia ci arriva (motore/storie.js, ingressoDelCurioso), e cammina fino all'ingresso coi mostri di sopra
// (motore/aperta.js). Due modi: `strada` va dritto per la strada e combatte solo chi lo raggiunge; `giro` passa dalla tana di ogni luogo
// della zona che attraversa e va incontro a ogni branco che vede (il curioso dei dungeon, che apre tutto). Gli scontri li gioca il banco
// di sempre (motore/banco.js, sbriga). Conta scontri, domande, vita all'arrivo, svenimenti, esperienza. Il mondo è caricato tutto. Gira in
// Node; nessuno lo usa nel gioco.
import { ilMondoIntero, terraDelMondo, ingressoDi, baseDi, PASSO_MONDO } from './mondo-sopra.js'
import { INGRESSI_DEL_MONDO } from '../dati/mondo-aperto.js'
import { SOPRA } from '../dati/mondo-aperto-mostri.js'
import { campoVersoLaMeta } from './meta-sopra.js'
import { popolaMondo, cammina, muoviMostri, incontro, apriLoScontro, esitoDelloScontro, alSicuro } from './aperta.js'
import { sbriga, equipaggia, daiIPunti } from './banco.js'
import { ingressoDelCurioso } from './storie.js'
import { GIOCATORI_TIPO, stileDi } from '../dati/giocatori-tipo.js'
import { seminato } from './livello.js'
import { Corredo } from './corredo.js'

const TETTO_SCONTRI = 60   // un tragitto che non finisce
// i dungeon nell'ordine della storia, l'abisso per ultimo (k = 7)
const META = [...Object.entries(INGRESSI_DEL_MONDO).filter(([, d]) => d.indice >= 0).sort((a, b) => a[1].indice - b[1].indice), Object.entries(INGRESSI_DEL_MONDO).find(([, d]) => d.indice === -1)]
  .map(([chiave, d]) => ({ chiave, ...d }))
const arcoDi = (m, c) => baseDi(m, c.x, c.y).arco
// la pietra da cui parte chi va al dungeon: la più avanti lungo la strada fra quelle che stanno prima di lui (il villaggio se nessuna)
export function pietraDiPartenza(m, chiave) {
  const s = arcoDi(m, ingressoDi(m, chiave).accanto)
  let meglio = m.villaggio.pietra
  for (const p of m.pietre) if (p.zona && arcoDi(m, p.accanto) < s && (meglio === m.villaggio.pietra || arcoDi(m, p.accanto) > arcoDi(m, meglio.accanto))) meglio = p
  return meglio
}

// Un tragitto: dalla pietra di partenza all'ingresso del dungeon k. `come`: 'strada' o 'giro'. `bravura`: le risposte giuste
export function tragitto({ k, eroe = 'cavaliere', seme = 1, come = 'strada', bravura = GIOCATORI_TIPO.curioso.bravura, ingresso = null }) {
  const m = ilMondoIntero()
  const d = META[k]
  const terra = terraDelMondo(m)
  const ing = ingressoDi(m, d.chiave)
  const partenza = pietraDiPartenza(m, d.chiave)
  const da = partenza.accanto
  const meta = ing.accanto
  const st = stileDi('curioso')
  const sorte = seminato(seme * 7919 + k * 31 + (come === 'giro' ? 5 : 0))
  let { roba, crescita } = ingresso || ingressoDelCurioso(k, { eroe, seme })
  const c0 = new Corredo({ eroe, roba, crescita })
  c0.sistemaIlCorredo()
  roba = c0.roba
  const stato = popolaMondo({ mondo: m, eroe, giro: seme * 101 + k })
  stato.forze = { vita: c0.vitaConLaRoba, energia: c0.energiaMax }
  const r = { k, come, zona: ing.zona, da: partenza.chiave, scontri: 0, mostri: 0, signori: 0, domande: 0, giuste: 0, svenuto: 0, esp: 0, gemme: 0, pozioni: 0, passi: 0, vitaFine: [], vitaArrivo: 0,
              livello0: c0.livelloEroe, livello: c0.livelloEroe, arrivato: 0, guasto: null }

  // le tappe: dritto all'ingresso, o (giro) prima la tana di ogni luogo che la strada attraversa, nell'ordine. La strada verso una tappa
  // la dà il campo delle distanze (motore/meta-sopra.js: l'A* su 504×300 celle costa troppo per rifarlo a ogni scontro)
  const campi = new Map()
  const campoDi = t => { const c = `${t.x},${t.y}`; if (!campi.has(c)) campi.set(c, campoVersoLaMeta(terra, t)); return campi.get(c) }
  const tappe = [meta]
  if (come === 'giro') {
    const via = (campoDi(meta) && campoDi(meta).strada(da)) || []
    const viste = []
    for (const c of via) { const R = m.regioni[m.reg[c.y * m.W + c.x]]; if (R && R.chiave !== 'villaggio' && !viste.includes(R)) viste.push(R) }
    const tane = viste.map(R => stato.tane.find(t => t.chiave === R.chiave)).filter(Boolean)
      .map(t => ({ x: t.x, y: t.y })).filter(c => terra.passa(c.x, c.y))
    tappe.unshift(...tane)
  }
  let pos = { x: da.x + 0.5, y: da.y + 0.5 }, verso = { dx: 1, dy: 0 }
  const dt = 1 / PASSO_MONDO
  const conto = { pozioni: 0, fonti: 0, scale: [] }
  let energiaMax = c0.energiaMax

  // uno scontro, giocato dal banco fino in fondo; torna false se si è svenuti
  const combatti = inc => {
    r.scontri++
    const corsa = apriLoScontro(stato, inc, { eroe, roba, crescita, verso, rnd: sorte })
    const vita0 = corsa.vitaMax
    let giri = 0
    while (corsa.foglio && corsa.foglio.che === 'scontro' && giri++ < 2000) sbriga(corsa, bravura, sorte, conto, st)
    const e = esitoDelloScontro(stato, corsa, { terra })
    r.domande += e.domande; r.giuste += e.giuste; r.esp += e.esp; r.gemme += e.gemme
    r.mostri += e.uccisi.length; r.signori += e.uccisi.filter(t => t.signore).length
    if (e.come === 'svenuto') { r.svenuto = 1; r.vitaFine.push(0); roba = e.roba; crescita = e.crescita; return false }
    // dopo lo scontro: i punti dei livelli presi e le pozioni, come fa il banco fra un mostro e l'altro
    daiIPunti(corsa, 'strada')
    equipaggia(corsa, st, conto)
    roba = corsa.roba; crescita = corsa.crescita
    stato.forze = { vita: corsa.vita, energia: corsa.energia }
    energiaMax = corsa.energiaMax
    r.vitaFine.push(corsa.vita / vita0)
    return true
  }
  // un passo verso la cella `c` (vicina), col tempo e i mostri che si muovono
  const passo = c => {
    const tx = c.x + 0.5, ty = c.y + 0.5, l = Math.hypot(tx - pos.x, ty - pos.y)
    if (l > 1e-6) verso = { dx: (tx - pos.x) / l, dy: (ty - pos.y) / l }
    pos = { x: tx, y: ty }
    r.passi += l
    cammina(stato, l, { x: pos.x, y: pos.y, energiaMax })
    muoviMostri(stato, pos, l * dt)
  }
  // il prossimo branco da andare a prendere (giro): il più vicino che si vede, della zona dove si è
  const daPrendere = lasciati => {
    if (come !== 'giro' || alSicuro(m, pos.x, pos.y)) return null
    const mia = m.zona[Math.floor(pos.y) * m.W + Math.floor(pos.x)]
    let meglio = null, d0 = SOPRA.vista
    for (const q of stato.lista) {
      if (q.morto || q.zona !== mia || lasciati.has(q.i)) continue
      const d = Math.hypot(q.fx - pos.x, q.fy - pos.y)
      if (d < d0) { d0 = d; meglio = q }
    }
    return meglio
  }

  // la strada si calcola una volta per meta (l'A* sul mondo intero costa): di nuovo dopo uno scontro, o se la preda cambia o si sposta
  const lasciati = new Set()
  for (const t of tappe) {
    let via = null, verso_ = null
    for (let giri = 0; giri < 6000; giri++) {
      if (r.scontri >= TETTO_SCONTRI) { r.guasto = 'troppi scontri'; break }
      const qui = { x: Math.floor(pos.x), y: Math.floor(pos.y) }
      if (qui.x === t.x && qui.y === t.y) break
      const preda = daPrendere(lasciati)
      if (preda && Math.hypot(preda.fx - pos.x, preda.fy - pos.y) <= SOPRA.tocco) {
        const inc = incontro(stato, pos, { tocco: preda.i })
        if (inc) { if (!combatti(inc)) return chiudi(); via = null; continue }
      }
      const chi = preda ? `p${preda.i}` : 't'
      if (!via || !via.length || chi !== verso_ || (preda && giri % 3 === 0)) {
        const fine = preda ? { x: Math.floor(preda.fx), y: Math.floor(preda.fy) } : t
        via = preda && terra.passa(fine.x, fine.y) ? terra.strada(qui, fine) : (campoDi(t) ? campoDi(t).strada(qui) : null)
        verso_ = chi
        if (!via || !via.length) { if (preda) { lasciati.add(preda.i); via = null; continue } r.guasto = 'non si arriva'; break }
      }
      passo(via.shift())
      const inc = incontro(stato, pos)
      if (inc) { if (!combatti(inc)) return chiudi(); via = null }
    }
  }
  r.arrivato = r.guasto ? 0 : 1
  r.vitaArrivo = stato.forze.vita / new Corredo({ eroe, roba, crescita }).vitaConLaRoba
  return chiudi()

  function chiudi() {
    const c = new Corredo({ eroe, roba, crescita })
    r.livello = c.livelloEroe
    r.pozioni = conto.pozioni
    return r
  }
}

// le misure per dungeon (e la sua zona): `semi` storie per eroe, i due modi, i dungeon dall'1 all'abisso. Torna una riga per (come, k)
export function misuraIlMondo({ eroi = ['cavaliere', 'elfa', 'mago', 'nano'], semi = 6, discese = [0, 1, 2, 3, 4, 5, 6, 7], modi = ['strada', 'giro'], bravura = GIOCATORI_TIPO.curioso.bravura } = {}) {
  const righe = []
  for (const come of modi) for (const k of discese) {
    const tutti = []
    for (const eroe of eroi) for (let s = 1; s <= semi; s++) tutti.push(tragitto({ k, eroe, seme: s, come, bravura }))
    const media = f => tutti.reduce((n, x) => n + f(x), 0) / tutti.length
    const fini = tutti.flatMap(x => x.vitaFine)
    righe.push({ come, k, dungeon: META[k].chiave, zona: tutti[0].zona, da: tutti[0].da, tragitti: tutti.length,
                 scontri: media(x => x.scontri), mostri: media(x => x.mostri), signori: media(x => x.signori), domande: media(x => x.domande),
                 svenuti: media(x => x.svenuto), vitaArrivo: media(x => (x.svenuto ? 0 : x.vitaArrivo)), vitaFine: fini.length ? fini.reduce((a, b) => a + b, 0) / fini.length : null,
                 livelli: media(x => x.livello - x.livello0), esp: media(x => x.esp), gemme: media(x => x.gemme), pozioni: media(x => x.pozioni), passi: media(x => x.passi),
                 guasti: tutti.filter(x => x.guasto).length })
  }
  return righe
}
