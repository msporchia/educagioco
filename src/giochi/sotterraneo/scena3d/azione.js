// Il tocco come in un punta-e-clicca: si sceglie una cosa (scena3d/dito.js), l'eroe ci va per la strada vera e, arrivato, la
// usa. Usarla è il motore (`vaiVerso`, che da vicino la apre come nel 2D): porte, forzieri, fonti, mostri fanno quello che fanno
// nel gioco. Una cosa non ancora in luce (o di là da qualcosa): si va alla cella raggiungibile più vicina e lì si riprova. Un
// tocco oltre una porta chiusa porta alla porta e prova ad aprirla. Un altro tocco annulla. Niente regole qui: solo quale
// cella chiedere al motore. Puro, senza three: unita/sotterraneo-3d.
import { percorso, raggiungibili } from '../../../motore/passi.js'

// la cella libera più vicina a (x, z) a cui si arriva davvero
export function vicinoA(corsa, x, z) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  let mig = null, dm = Infinity
  for (const k of raggiungibili(corsa.buona(), da)) {   // le chiavi sono «x,y» (motore/passi.js)
    const i = k.indexOf(',')
    const cx = +k.slice(0, i), cy = +k.slice(i + 1)
    const d = Math.hypot(cx + 0.5 - x, cy + 0.5 - z)
    if (d < dm) { dm = d; mig = { x: cx, y: cy } }
  }
  return mig
}

// il punto toccato oltre una porta chiusa: la strada che ci arriverebbe passando dalle porte, e la prima porta chiusa su di essa
export function portaSullaStrada(corsa, c) {
  const da = { x: Math.floor(corsa.eroe.x), y: Math.floor(corsa.eroe.y) }
  if (percorso(corsa.buona(), da, c)) return null
  const liv = corsa.livello
  const strada = percorso((x, y) => liv.calpestabile(x, y), da, c)
  if (!strada) return null
  for (const p of strada) { const r = liv.robe.find(q => q.che === 'porta' && !q.aperta && q.x === p.x && q.y === p.y); if (r) return r }
  return null
}

export function creaAzione() {
  let azione = null   // { roba } finché l'eroe ci sta andando

  function mira(corsa, r) {
    azione = { roba: r }
    if (corsa.toccabile(r)) { corsa.vaiVerso({ x: r.x, y: r.y }, true); return }
    const meta = vicinoA(corsa, (r.fx ?? r.x + 0.5), (r.fy ?? r.y + 0.5))
    if (meta) corsa.vaiVerso(meta, false)
  }

  return {
    get roba() { return azione ? azione.roba : null },
    annulla() { azione = null },
    // il dito si è posato: su una cosa (`roba`) o su una cella del pavimento (`cella`)
    tocca(corsa, { roba = null, cella = null }) {
      azione = null
      if (!corsa || corsa.foglio || corsa.finita) return
      if (roba) return mira(corsa, roba)
      if (!cella) return
      const porta = portaSullaStrada(corsa, cella)
      if (porta) return mira(corsa, porta)
      corsa.vaiVerso(cella, true)
    },
    // trascinando, l'eroe insegue il dito senza aprire niente
    trascina(corsa, cella) {
      azione = null
      if (corsa && !corsa.foglio && !corsa.finita && cella) corsa.vaiVerso(cella, false)
    },
    // a ogni fotogramma: arrivati (fermi) accanto alla cosa, ci si gira e la si usa col tocco del motore
    passo(corsa) {
      if (!azione || !corsa) return
      if (corsa.foglio || corsa.finita) { azione = null; return }
      if (corsa.strada && corsa.strada.length) return
      const r = azione.roba
      if (r.presa || r.morto) { azione = null; return }
      const x = r.fx ?? r.x + 0.5, z = r.fy ?? r.y + 0.5
      azione = null
      if (Math.hypot(x - corsa.eroe.x, z - corsa.eroe.y) > 1.6) { corsa.dillo('di là non si arriva'); return }
      corsa.giraVerso(x - corsa.eroe.x, z - corsa.eroe.y)
      corsa.aggiornaLuce()
      if (corsa.toccabile(r)) corsa.vaiVerso({ x: r.x, y: r.y }, true)
      else corsa.dillo('di qui non si vede')
    },
  }
}
