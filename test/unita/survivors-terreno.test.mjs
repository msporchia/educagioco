/* Il terreno di Survivors e le figure che lo abitano
   (`src/giochi/survivors/motore/terreno.js`, `scena/figure.js`).

   Si prova quello che, sbagliato, si vede solo giocando a lungo:
     · nessun recinto: fra due ostacoli passano sempre due colossi
       affiancati, e il punto di partenza è libero — un bambino chiuso
       fra un bosco e uno stagno non ha più niente da fare;
     · la carta è la stessa ogni volta che si torna in un posto, e la
       stessa riprendendo la partita (non si salva: si rifà);
     · chi entra in un ostacolo ne esce, e chi ci punta contro ci gira
       intorno invece di restarci incollato;
     · ogni mostro ha la sua figura in ogni scenario, e l'atlante del
       castello (da cui la prende in prestito) la porta davvero: se il
       castello smette di usarne una, il suo atlante la perde e qui si
       vedrebbe una palla al posto del troll.
   `node test/esegui.mjs survivors-terreno --niente-build` */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Terreno, RIQUADRO, semeDi } from '../../src/giochi/survivors/motore/terreno.js'
import { TERRENO, guastiDelTerreno } from '../../src/giochi/survivors/dati/terreno.js'
import { SCENARI } from '../../src/giochi/survivors/dati/scenari.js'
import { MOSTRI } from '../../src/giochi/survivors/dati/mostri.js'
import { BESTIARIO, figuraDi, esiste } from '../../src/giochi/survivors/scena/figure.js'
import { VESTE } from '../../src/giochi/survivors/scena/fondale.js'
import { PEZZI as VESTITI } from '../../src/giochi/castello/dati/vestiti.js'

uguale('il terreno sta in piedi', guastiDelTerreno(TERRENO, SCENARI).join('; '), '')

const COLOSSO = Math.max(...Object.values(MOSTRI).map(m => m.r))
const fuori = (o, x, y, r = 0) => ((x - o.x) / (o.rx + r)) ** 2 + ((y - o.y) / (o.ry + r)) ** 2 >= 1

/* ── nessun recinto, e si parte liberi ── */
for (const scenario of Object.keys(SCENARI)) {
  const t = new Terreno(scenario, semeDi(scenario))
  let quanti = 0, stretto = Infinity
  const tutti = []
  for (let j = -6; j <= 6; j++)
    for (let i = -6; i <= 6; i++) tutti.push(...t.riquadro(i, j).ostacoli)
  for (const o of tutti) {
    quanti++
    const i = Math.floor(o.x / RIQUADRO), j = Math.floor(o.y / RIQUADRO)
    const dentro = o.x - o.rx >= i * RIQUADRO && o.x + o.rx <= (i + 1) * RIQUADRO
                && o.y - o.ry >= j * RIQUADRO && o.y + o.ry <= (j + 1) * RIQUADRO
    if (!dentro) controlla(`${scenario}: un ostacolo resta nel suo riquadro`, false, JSON.stringify(o))
  }
  /* il varco più stretto fra due ostacoli, misurato camminando sul
     bordo dell'uno: un passo largo quanto due colossi deve starci */
  for (let a = 0; a < tutti.length; a++)
    for (let b = a + 1; b < tutti.length; b++) {
      const p = tutti[a], q = tutti[b]
      if (Math.hypot(p.x - q.x, p.y - q.y) > p.rx + q.rx + 300) continue
      for (let k = 0; k < 48; k++) {
        const ang = k / 48 * 6.283
        const x = p.x + Math.cos(ang) * p.rx, y = p.y + Math.sin(ang) * p.ry
        for (let d = 0; d < stretto && d < 200; d += 2)
          if (!fuori(q, x + Math.cos(ang) * d, y + Math.sin(ang) * d)) { stretto = Math.min(stretto, d); break }
      }
    }
  controlla(`${scenario}: fra due ostacoli passano due colossi`, stretto >= 4 * COLOSSO,
            `il varco più stretto è ${stretto.toFixed(0)}`)
  controlla(`${scenario}: si parte liberi`, t.libero(0, 0, 200))
  nota(`${scenario}: ${quanti} ostacoli in 169 riquadri, varco più stretto ${stretto.toFixed(0)}`)
}

/* ── la stessa carta ogni volta ── */
{
  const a = new Terreno('bosco', 7), b = new Terreno('bosco', 7)
  b.riquadro(3, 3); b.cache.clear()                // svuotata e rifatta: uguale
  uguale('la stessa carta, rifatta', JSON.stringify(b.riquadro(2, -1)), JSON.stringify(a.riquadro(2, -1)))
  const c = new Terreno('bosco', 8)
  let diverse = 0
  for (let i = 0; i < 10; i++)
    if (JSON.stringify(c.riquadro(i, 1).ostacoli) !== JSON.stringify(a.riquadro(i, 1).ostacoli)) diverse++
  controlla('un altro seme, un\'altra carta', diverse > 3, `${diverse} riquadri su 10 cambiano`)
}

/* ── chi entra esce, chi punta contro gira ── */
{
  const t = new Terreno('bosco', semeDi('radura'))
  let o = null
  for (let i = 1; !o && i < 30; i++) o = t.riquadro(i, 0).ostacoli[0]
  controlla('c\'è un ostacolo da provare', !!o)
  const c = { x: o.x + 3, y: o.y + 2 }
  t.spingiFuori(c, 15)
  controlla('chi è dentro viene messo fuori', fuori(o, c.x, c.y, 14.9), `${c.x.toFixed(1)}, ${c.y.toFixed(1)}`)
  // dritto contro il centro, da sinistra: deve prendere una tangente
  const x = o.x - o.rx - 20, y = o.y
  const [ux, uy] = t.aggira(x, y, 15, 1, 0)
  controlla('chi ci punta contro gira', Math.abs(uy) > 0.5, `direzione ${ux.toFixed(2)}, ${uy.toFixed(2)}`)
  // e cammina intorno fino a passare oltre
  const m = { x, y }
  for (let k = 0; k < 600; k++) {
    const [vx, vy] = t.aggira(m.x, m.y, 15, 1, 0, 4)
    m.x += vx * 3; m.y += vy * 3
    t.spingiFuori(m, 15)
  }
  controlla('e lo supera', m.x > o.x + o.rx, `è a ${(m.x - o.x).toFixed(0)} dal centro, raggio ${o.rx.toFixed(0)}`)
}

/* ── ogni mostro ha la sua figura, in ogni scenario ── */
uguale('il bestiario ha tutti e soli i mostri', Object.keys(BESTIARIO).sort().join(), Object.keys(MOSTRI).sort().join())
for (const scenario of Object.keys(SCENARI))
  for (const tipo of Object.keys(MOSTRI)) {
    const chi = figuraDi(scenario, tipo)
    if (!esiste(chi)) controlla(`${scenario} · ${tipo}: la figura "${chi}" è negli atlanti`, false)
  }
for (const [scenario, v] of Object.entries(VESTE)) {
  controlla(`${scenario}: il foglio "${v.foglio}" c'è`, !!VESTITI[v.foglio])
  for (const nome of ['fondo', 'prato:0', 'fitto:0', 'albero:0', 'grande:1', 'decoro:2', 'stagno'])
    if (!VESTITI[v.foglio]?.[nome]) controlla(`${scenario}: il pezzo "${nome}" c'è`, false)
}
uguale('ogni scenario ha la sua veste', Object.keys(VESTE).sort().join(), Object.keys(SCENARI).sort().join())

riassunto('survivors — il terreno e le figure')
