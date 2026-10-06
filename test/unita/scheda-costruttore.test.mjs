/* La scheda del robot, senza browser: a ogni larghezza da telefono i led
   stanno dentro, uno sopra l'altro in ordine; la pista è una sola, a tratti
   dritti o a 45°, e tocca tutti i led nell'ordine della fila; niente si
   sovrappone (decoro, chip, led, robot, componenti sopra la pista); il
   robot va da ogni led al dopo. Vedi docs/costruttore/scheda.md.
   `node test/esegui.mjs scheda-costruttore --niente-build` */
import { CAPITOLI, LIVELLI } from '../../src/giochi/costruttore/dati/livelli.js'
import { disponiScheda, stradaDelRobot, durataViaggio, lunghezza, toccano, ALONE, ROBOT, MISURE, LARGO_MAX }
  from '../../src/giochi/costruttore/motore/scheda.js'
import { disegnaDecoro, disegnaCoperchi } from '../../src/giochi/costruttore/scena/scheda.js'
import { guidaScheda, SULLA_SCHEDA } from '../../src/giochi/costruttore/motore/guida.js'
import { impronta } from '../../src/giochi/costruttore/motore/zaino.js'
import { programma, fai } from '../../src/giochi/costruttore/dati/scrivi.js'
import { controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'

const capitoli = CAPITOLI.map(c => ({ chiave: c.chiave, quanti: LIVELLI.filter(l => l.capitolo === c.chiave).length }))
const scatola = (x, y, w, h) => ({ x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 })
const vicino = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.5

for (const W of [300, 340, 390, 430, 480]) {
  const s = disponiScheda(W, capitoli)
  const leds = s.nodi.filter(n => n.tipo === 'led')
  const chips = s.nodi.filter(n => n.tipo === 'chip')
  uguale(`${W} px: un led per livello`, leds.map(n => n.indice).join(), LIVELLI.map((l, i) => i).join())
  uguale(`${W} px: un chip per capitolo, nell'ordine`, chips.map(n => n.cap).join(), CAPITOLI.map(c => c.chiave).join())
  controlla(`${W} px: ogni led nel capitolo del suo livello`, leds.every(n => n.cap === LIVELLI[n.indice].capitolo))
  controlla(`${W} px: si parte dal basso, e ogni led sta sopra quello prima`,
            leds.every((n, i) => !i || n.y < leds[i - 1].y - 2 * ALONE))
  controlla(`${W} px: i led stanno dentro lo schermo`, leds.every(n => n.x - ALONE >= 30 && n.x + ALONE <= W - 30))
  controlla(`${W} px: e i chip`, chips.every(n => n.x - n.mezzo - 9 >= 8 && n.x + n.mezzo + 9 <= W - 8))
  controlla(`${W} px: il cantiere libero è in fondo`, s.connettore.y > chips[0].y)

  /* la pista: una sola, un tratto per coppia di nodi, dritta o a 45° */
  const guasti = []
  s.tratti.forEach((t, k) => {
    if (t.k !== k) guasti.push(`il tratto ${k} non è al suo posto`)
    const a = s.nodi[k], b = s.nodi[k + 1]
    const da = a.tipo === 'chip' ? [a.x, a.y - 40] : [a.x, a.y], fino = b.tipo === 'chip' ? [b.x, b.y + 40] : [b.x, b.y]
    if (!vicino(t.punti[0], da) || !vicino(t.punti.at(-1), fino)) guasti.push(`il tratto ${k} non unisce i suoi nodi`)
    for (let i = 1; i < t.punti.length; i++) {
      const dx = Math.abs(t.punti[i][0] - t.punti[i - 1][0]), dy = t.punti[i - 1][1] - t.punti[i][1]
      if (dy < -0.01) guasti.push(`il tratto ${k} scende`)
      if (dx > 0.01 && Math.abs(dx - dy) > 0.01) guasti.push(`il tratto ${k} non è a 45°`)
    }
  })
  uguale(`${W} px: la pista è una e sale a tratti dritti o a 45°`, guasti.join(' · '), '')
  uguale(`${W} px: tanti tratti quanti nodi meno uno`, s.tratti.length, s.nodi.length - 1)

  /* niente sopra niente */
  const sopra = []
  const ingombri = [
    ...leds.map(n => ({ nome: `led ${n.indice + 1}`, r: scatola(n.x, n.y, 2 * ALONE, 2 * ALONE) })),
    ...leds.map(n => ({ nome: `robot del ${n.indice + 1}`, r: scatola(n.robot.x, n.robot.y, ROBOT.largo, ROBOT.alto) })),
    ...chips.map(n => ({ nome: `chip ${n.cap}`, r: scatola(n.x, n.y, 2 * n.mezzo + 18, 80) })),
    ...s.coperchi.map((c, i) => ({ nome: `coperchio ${i}`, r: scatola(c.x, c.y, c.w, c.h) })),
    ...s.decoro.map((d, i) => ({ nome: `${d.tipo} ${i}`, r: scatola(d.x, d.y, d.w, d.h), decoro: true })),
    { nome: 'cantiere libero', r: scatola(s.connettore.x, s.connettore.y, 160, 46) },
  ]
  for (let i = 0; i < ingombri.length; i++) for (let j = i + 1; j < ingombri.length; j++) {
    const a = ingombri[i], b = ingombri[j]
    // il robot di un led e un altro robot possono stare vicini: non ci sono mai due robot
    if (a.nome.startsWith('robot') && b.nome.startsWith('robot')) continue
    if (toccano(a.r, b.r, 1)) sopra.push(`${a.nome} / ${b.nome}`)
  }
  for (const g of ingombri) {
    if (g.r.x0 < 0 || g.r.x1 > W || g.r.y0 < 0 || g.r.y1 > s.H) sopra.push(`${g.nome} esce dalla scheda`)
    // la pista non passa sotto il decoro né sotto il robot posato
    if ((g.decoro || g.nome.startsWith('robot')) && s.puntiPista.some(p => p[0] > g.r.x0 - 2 && p[0] < g.r.x1 + 2 &&
                                                                        p[1] > g.r.y0 - 2 && p[1] < g.r.y1 + 2))
      sopra.push(`la pista passa sotto ${g.nome}`)
  }
  uguale(`${W} px: niente sopra niente`, sopra.slice(0, 6).join(' · '), '')

  /* i passaggi sotto un componente: ci sono, e le vie stanno sulla pista, fuori dal componente */
  controlla(`${W} px: in qualche punto la pista passa sotto un componente`, s.coperchi.length >= 6, `${s.coperchi.length}`)
  controlla(`${W} px: le vie stanno ai due lati, fuori dal componente`, s.coperchi.every(c =>
    c.vie.every(([x, y]) => Math.abs(x - c.x) > c.w / 2 || Math.abs(y - c.y) > c.h / 2)))
  controlla(`${W} px: un componente sopra la pista è uno di quelli grossi`, s.coperchi.every(c => MISURE[c.tipo].w >= 46))

  /* il robot: da ogni led al dopo, dal suo posto al posto dell'altro, toccando tutti i nodi fra i due */
  const viaggi = leds.slice(1).map(n => stradaDelRobot(s, n.indice - 1, n.indice))
  controlla(`${W} px: da ogni led il robot va al dopo`, viaggi.every(v => v && v.punti.length >= 4))
  controlla(`${W} px: partendo accanto al suo led e arrivando accanto all'altro`, viaggi.every((v, i) =>
    vicino(v.punti[0], [leds[i].robot.x, leds[i].robot.y]) && vicino(v.punti.at(-1), [leds[i + 1].robot.x, leds[i + 1].robot.y])))
  controlla(`${W} px: passando per ogni nodo, anche i chip`, viaggi.every((v, i) =>
    v.tappe.map(t => t.k).join() === Array.from({ length: leds[i + 1].k - leds[i].k + 1 }, (_, j) => leds[i].k + j).join()))
  const tutta = stradaDelRobot(s, 0, LIVELLI.length - 1)
  uguale(`${W} px: dal primo all'ultimo la strada tocca tutti i led in ordine`,
         leds.map(n => tutta.punti.findIndex(p => vicino(p, [n.x, n.y]))).every((q, i, a) => q >= 0 && (!i || q > a[i - 1])), true)
  controlla(`${W} px: e si nasconde sotto ogni componente che la copre`, tutta.nascosti.length === s.coperchi.length)
  const durate = viaggi.map(v => durataViaggio(v.L))
  dentro(`${W} px: un viaggio dura fra 0,9 e 2,8 s`, Math.min(...durate), 0.9, 2.8)
  dentro(`${W} px: anche il più lungo`, Math.max(...durate), 0.9, 2.8)
  uguale(`${W} px: lunghezza e tappe tornano`, Math.round(tutta.tappe.at(-1).s) <= Math.round(lunghezza(tutta.punti)), true)
  uguale(`${W} px: indietro non si va`, stradaDelRobot(s, 3, 2), null)

  const d = disegnaDecoro(s), c = disegnaCoperchi(s)
  controlla(`${W} px: il decoro si disegna`, d.strati.corpo.length > 1000 && !/NaN|undefined/.test(Object.values(d.strati).join('')))
  controlla(`${W} px: e i componenti sopra la pista`, c.strati.fondo.length > 0 && !/NaN|undefined/.test(Object.values(c.strati).join('')))
}

uguale('la stessa scheda a ogni apertura', JSON.stringify(disponiScheda(390, capitoli)), JSON.stringify(disponiScheda(390, capitoli)))
uguale('più larga del massimo resta al massimo', disponiScheda(900, capitoli).W, LARGO_MAX)

/* la guida sulla scheda: il led del primo livello, poi «▶ costruisci» */
uguale('la guida indica il led 1', guidaScheda({}).dove, SULLA_SCHEDA.led)
uguale('col fumetto del primo aperto, «▶ costruisci»', guidaScheda({ aperto: 0 }).dove, SULLA_SCHEDA.costruisci)
uguale('col fumetto di un altro, di nuovo il led 1', guidaScheda({ aperto: 'libero' }).dove, SULLA_SCHEDA.led)
uguale('vinto il primo tace', guidaScheda({ primoVinto: true }), null)

/* lasciato a metà: l'impronta non guarda gli id */
{
  const a = programma({ principale: [fai.metti('rosso'), fai.vai('destra')] })
  const b = programma({ principale: [{ ...fai.metti('rosso'), id: 'n40' }, fai.vai('destra')] })
  uguale('due programmi uguali a meno degli id hanno la stessa impronta', impronta(a), impronta(b))
  const c = programma({ principale: [fai.metti('rosso'), fai.vai('destra'), fai.metti('rosso')] })
  controlla('una riga in più cambia l\'impronta', impronta(a) !== impronta(c))
}

riassunto('costruttore — la scheda del robot')
