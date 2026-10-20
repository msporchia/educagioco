// Il banco del mondo aperto (docs/sotterraneo/mondo-aperto-mostri.md, «Le misure»): il curioso esce dalla città che serve il dungeon k
// con la roba e la crescita con cui la sua storia ci arriva (motore/storie.js, ingressoDelCurioso), e cammina fino all'ingresso coi mostri
// di sopra (motore/aperta.js). Due modi: `strada` va dritto per la strada e combatte solo chi lo raggiunge; `giro` passa dalla tana di ogni
// regione che attraversa e va incontro a ogni branco che vede (il curioso dei dungeon, che apre tutto). Gli scontri li gioca il banco di
// sempre (motore/banco.js, sbriga). Conta scontri, domande, vita all'arrivo, svenimenti, esperienza. Gira in Node; nessuno lo usa nel gioco.
import { ilMondo, terraDelMondo, cittaDelDungeon, cittaDi, PASSO_MONDO } from './mondo-sopra-anelli.js'
import { DUNGEON, passaggioAperto } from '../dati/mondo-aperto.js'
import { SOPRA } from '../dati/mondo-aperto-mostri.js'
import { popolaMondo, cammina, muoviMostri, incontro, apriLoScontro, esitoDelloScontro, alSicuro } from './aperta.js'
import { sbriga, equipaggia, daiIPunti } from './banco.js'
import { ingressoDelCurioso } from './storie.js'
import { GIOCATORI_TIPO, stileDi } from '../dati/giocatori-tipo.js'
import { seminato } from './livello.js'
import { Corredo } from './corredo.js'

const TETTO_SCONTRI = 60   // un tragitto che non finisce
// i dungeon nell'ordine della storia, l'abisso per ultimo (k = 7)
const META = [...DUNGEON.filter(d => d.indice >= 0).sort((a, b) => a.indice - b.indice), DUNGEON.find(d => d.indice < 0)]

// Un tragitto: dalla pietra della città che serve il dungeon k al suo ingresso. `come`: 'strada' o 'giro'. `bravura`: le risposte giuste
export function tragitto({ k, eroe = 'cavaliere', seme = 1, come = 'strada', bravura = GIOCATORI_TIPO.curioso.bravura, ingresso = null }) {
  const m = ilMondo()
  const d = META[k]
  const terra = terraDelMondo(m, q => passaggioAperto(q, { finite: k }))
  const citta = cittaDi(m, cittaDelDungeon(m, d.chiave))
  const da = (citta.pietra || citta.portale).accanto
  const meta = m.ingressi.find(i => i.chiave === d.chiave).accanto
  const st = stileDi('curioso')
  const sorte = seminato(seme * 7919 + k * 31 + (come === 'giro' ? 5 : 0))
  let { roba, crescita } = ingresso || ingressoDelCurioso(k, { eroe, seme })
  const c0 = new Corredo({ eroe, roba, crescita })
  c0.sistemaIlCorredo()
  roba = c0.roba
  const stato = popolaMondo({ mondo: m, eroe, giro: seme * 101 + k })
  stato.forze = { vita: c0.vitaConLaRoba, energia: c0.energiaMax }
  const r = { k, come, scontri: 0, mostri: 0, signori: 0, domande: 0, giuste: 0, svenuto: 0, esp: 0, gemme: 0, pozioni: 0, passi: 0, vitaFine: [], vitaArrivo: 0,
              livello0: c0.livelloEroe, livello: c0.livelloEroe, arrivato: 0, guasto: null }

  // le tappe: dritto all'ingresso, o (giro) prima la tana di ogni regione che la strada attraversa, nell'ordine
  const tappe = [meta]
  if (come === 'giro') {
    const via = terra.strada(da, meta) || []
    const viste = []
    for (const c of via) { const R = m.regioni[m.reg[c.y * m.W + c.x]]; if (R && R.anello && !viste.includes(R)) viste.push(R) }
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
  // il prossimo branco da andare a prendere (giro): il più vicino che si vede, della regione dove si è
  const daPrendere = lasciati => {
    if (come !== 'giro' || alSicuro(m, pos.x, pos.y)) return null
    const mia = m.reg[Math.floor(pos.y) * m.W + Math.floor(pos.x)]
    let meglio = null, d0 = SOPRA.vista
    for (const q of stato.mostri) {
      if (q.morto || q.regione !== mia || lasciati.has(q.i)) continue
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
        via = terra.strada(qui, preda && terra.passa(fine.x, fine.y) ? fine : t)
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

// le misure per anello: `semi` storie per eroe, i due modi, i dungeon dall'1 all'abisso. Torna una riga per (come, k)
export function misuraIlMondo({ eroi = ['cavaliere', 'elfa', 'mago', 'nano'], semi = 6, discese = [0, 1, 2, 3, 4, 5, 6, 7], modi = ['strada', 'giro'], bravura = GIOCATORI_TIPO.curioso.bravura } = {}) {
  const righe = []
  for (const come of modi) for (const k of discese) {
    const tutti = []
    for (const eroe of eroi) for (let s = 1; s <= semi; s++) tutti.push(tragitto({ k, eroe, seme: s, come, bravura }))
    const media = f => tutti.reduce((n, x) => n + f(x), 0) / tutti.length
    const fini = tutti.flatMap(x => x.vitaFine)
    righe.push({ come, k, dungeon: META[k].chiave, anello: k <= 3 ? 1 : 2, tragitti: tutti.length,
                 scontri: media(x => x.scontri), mostri: media(x => x.mostri), signori: media(x => x.signori), domande: media(x => x.domande),
                 svenuti: media(x => x.svenuto), vitaArrivo: media(x => (x.svenuto ? 0 : x.vitaArrivo)), vitaFine: fini.length ? fini.reduce((a, b) => a + b, 0) / fini.length : null,
                 livelli: media(x => x.livello - x.livello0), esp: media(x => x.esp), gemme: media(x => x.gemme), pozioni: media(x => x.pozioni), passi: media(x => x.passi),
                 guasti: tutti.filter(x => x.guasto).length })
  }
  return righe
}
