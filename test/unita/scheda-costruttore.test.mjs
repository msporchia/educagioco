/* La scheda del robot, senza browser: a ogni larghezza da telefono i led
   stanno dentro, uno sopra l'altro in ordine; la pista è una sola, a tratti
   dritti o a 45°, e tocca tutti i led nell'ordine della fila; niente si
   sovrappone (decoro, chip, led, robot, stelline, componenti sopra la pista);
   il robot va da ogni led a ogni altro, avanti e indietro, e riparte anche
   da un punto della strada. Vedi docs/costruttore/scheda.md.
   `node test/esegui.mjs scheda-costruttore --niente-build` */
import { CAPITOLI, LIVELLI } from '../../src/giochi/costruttore/dati/livelli.js'
import { disponiScheda, stradaDelRobot, stradaDaPunto, partenzaDa, pistaIntera, durataViaggio, lunghezza, lungo, toccano, ALONE, ROBOT, MISURE,
         LARGO_MAX, STELLE_MAX }
  from '../../src/giochi/costruttore/motore/scheda.js'
import { disegnaDecoro, disegnaCoperchi } from '../../src/giochi/costruttore/scena/scheda.js'
import { guidaScheda, SULLA_SCHEDA } from '../../src/giochi/costruttore/motore/guida.js'
import { impronta } from '../../src/giochi/costruttore/motore/zaino.js'
import { pezzi, ALTO, PIEDI } from '../../src/giochi/costruttore/scena/robot.js'
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
    ...leds.map(n => ({ nome: `stelline del ${n.indice + 1}`, stelline: true,
                        r: n.stelline && scatola(n.x + n.stelline.dx, n.y + n.stelline.dy, n.stelline.w, n.stelline.h) })),
    ...chips.map(n => ({ nome: `chip ${n.cap}`, r: scatola(n.x, n.y, 2 * n.mezzo + 18, 80) })),
    ...s.coperchi.map((c, i) => ({ nome: `coperchio ${i}`, r: scatola(c.x, c.y, c.w, c.h) })),
    ...s.decoro.map((d, i) => ({ nome: `${d.tipo} ${i}`, r: scatola(d.x, d.y, d.w, d.h), decoro: true })),
    { nome: 'cantiere libero', r: scatola(s.connettore.x, s.connettore.y, 160, 46) },
  ]
  controlla(`${W} px: ogni led ha il posto per le sue stelline`, leds.every(n => n.stelline && n.stelline.w >= STELLE_MAX * 10))
  for (let i = ingombri.length - 1; i >= 0; i--) if (!ingombri[i].r) ingombri.splice(i, 1)
  for (let i = 0; i < ingombri.length; i++) for (let j = i + 1; j < ingombri.length; j++) {
    const a = ingombri[i], b = ingombri[j]
    // il robot di un led e un altro robot possono stare vicini: non ci sono mai due robot
    if (a.nome.startsWith('robot') && b.nome.startsWith('robot')) continue
    if (toccano(a.r, b.r, 1)) sopra.push(`${a.nome} / ${b.nome}`)
  }
  for (const g of ingombri) {
    if (g.r.x0 < 0 || g.r.x1 > W || g.r.y0 < 0 || g.r.y1 > s.H) sopra.push(`${g.nome} esce dalla scheda`)
    // la pista non passa sotto il decoro, le stelline né il robot posato
    if ((g.decoro || g.stelline || g.nome.startsWith('robot')) && s.puntiPista.some(p => p[0] > g.r.x0 - 2 && p[0] < g.r.x1 + 2 &&
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
  uguale(`${W} px: da un led a se stesso non si va`, stradaDelRobot(s, 3, 3), null)

  /* e indietro: la stessa strada al contrario, dal posto accanto al led alto a quello del basso */
  const avanti = stradaDelRobot(s, 2, 9), indietro = stradaDelRobot(s, 9, 2)
  controlla(`${W} px: indietro si va`, indietro && indietro.punti.length === avanti.punti.length && !indietro.avanti)
  controlla(`${W} px: e la strada è la stessa`, Math.abs(indietro.L - avanti.L) < 0.5 &&
    vicino(indietro.punti[0], [leds[9].robot.x, leds[9].robot.y]) && vicino(indietro.punti.at(-1), [leds[2].robot.x, leds[2].robot.y]))
  controlla(`${W} px: i nodi si incontrano in ordine, dall'alto al basso`, indietro.tappe.map(t => t.k).join() ===
    Array.from({ length: leds[9].k - leds[2].k + 1 }, (_, j) => leds[9].k - j).join() &&
    indietro.tappe.every((t, i, a) => !i || t.s >= a[i - 1].s))
  uguale(`${W} px: si nasconde sotto gli stessi componenti`, indietro.nascosti.length, avanti.nascosti.length)
  controlla(`${W} px: indietro i pezzi nascosti stanno dentro la strada`, indietro.nascosti.every(([p, q]) => p < q && p >= -1 && q <= indietro.L + 1))
  for (const [da, a] of [[0, 1], [5, 3], [LIVELLI.length - 1, 0], [12, 20]]) {
    const v = stradaDelRobot(s, da, a)
    controlla(`${W} px: ${da + 1} → ${a + 1}: dura fra 0,9 e 2,8 s anche da lontano`,
              v && durataViaggio(v.L) >= 0.9 && durataViaggio(v.L) <= 2.8)
  }

  /* chi cambia meta in volo riparte da dov'è: un punto qualunque della strada, anche dentro un chip */
  {
    const lunga = stradaDelRobot(s, 0, LIVELLI.length - 1)
    const guasti = []
    for (const q of [0.05, 0.2, 0.37, 0.5, 0.66, 0.83, 0.97]) {
      const d = lunga.L * q, [x, y] = lungo(lunga.punti, d)
      for (const meta of [0, 7, 11, LIVELLI.length - 1]) {
        const v = stradaDaPunto(s, { x, y, s: lunga.suPista(d) }, meta)
        if (!v) { guasti.push(`da ${q} a ${meta}: nessuna strada`); continue }
        if (!vicino(v.punti[0], [x, y])) guasti.push(`da ${q} a ${meta}: non parte da dov'è`)
        if (!vicino(v.punti.at(-1), [leds[meta].robot.x, leds[meta].robot.y])) guasti.push(`da ${q} a ${meta}: non arriva`)
        if (v.nascosti.some(([p, r]) => !(p < r))) guasti.push(`da ${q} a ${meta}: pezzo nascosto storto`)
      }
    }
    uguale(`${W} px: da un punto della strada si va a ogni altro led`, guasti.slice(0, 4).join(' · '), '')
    const sosta = partenzaDa(s, 4), led = leds[4]
    controlla(`${W} px: il robot fermo accanto a un led si aggancia alla pista sul led`,
              vicino([sosta.x, sosta.y], [led.robot.x, led.robot.y]) && vicino(lungo(pistaIntera(s).punti, sosta.s), [led.x, led.y]))
  }

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

/* il robot è uno solo (scena/robot.js): ogni posa sta fra l'antenna e i
   cingoli, e in piedi è largo quanto il suo posto sulla scheda */
{
  const confini = posa => {
    const xs = [], ys = []
    for (const k of pezzi(posa)) {
      if (k.t === 'rett') { xs.push(k.x, k.x + k.w); ys.push(k.y, k.y + k.h) }
      else if (k.t === 'cerchio') { xs.push(k.x - k.r, k.x + k.r); ys.push(k.y - k.r, k.y + k.r) }
      else for (const [x, y] of k.punti) { xs.push(x); ys.push(y) }
    }
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
  }
  const pose = []
  for (const verso of ['fronte', 'destra', 'sinistra', 'retro'])
    for (const braccia of ['giu', 'avanti', 'su'])
      for (const occhi of ['aperti', 'spalancati', 'contenti', 'strizzati'])
        pose.push({ verso, braccia, occhi, giro: 1.3 })
  controlla('ogni posa del robot sta fra l\'antenna e i cingoli', pose.every(p => {
    const c = confini(p)
    return c.y0 >= PIEDI - ALTO - 0.01 && c.y1 <= PIEDI + 0.01 && c.x0 >= -15 && c.x1 <= 15
  }))
  const fermo = confini({})
  controlla('in piedi è largo quanto il suo posto sulla scheda', fermo.x1 - fermo.x0 <= ROBOT.largo)
  /* sulla scheda dondola tutto tranne i cingoli: quello che non è suolo sta sopra */
  controlla('i cingoli sono il suolo, e il resto sta sopra',
            pezzi({}).some(k => k.suolo) && pezzi({}).every(k => k.suolo || k.t !== 'rett' || k.y + k.h <= 11.5))
}

riassunto('costruttore — la scheda del robot')
