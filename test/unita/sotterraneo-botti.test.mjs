/* Le botti da rompere del Sotterraneo 3D (docs/sotterraneo/paesaggi-3d.md, «Le botti»), senza browser: quanto ce ne sono per
   paesaggio (solo alcune stanze, mai dove non hanno senso), dove stanno (mai nei corridoi, mai vicino a porte, scale, fonte o
   portale, mai sulla strada fra due di questi, sempre contro un muro, a gruppetti), lo stesso seme le stesse botti.
   `node test/esegui.mjs sotterraneo-botti --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { PAESAGGI, inPaesaggio } from '../../src/giochi/sotterraneo/dati/paesaggi.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { percorso } from '../../src/motore/passi.js'
import { piantaDi } from '../../src/giochi/sotterraneo/scena3d/pianta.js'
import { postiDelleBotti, premioDellaBotte } from '../../src/giochi/sotterraneo/motore/botti.js'
import { BOTTI_PER_PAESAGGIO, PREMI_DELLE_BOTTI } from '../../src/giochi/sotterraneo/dati/botti.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. la tabella: dove hanno senso ══════════ */
for (const k of ['ghiaccio', 'neve', 'inferno', 'fornace']) controlla(`${k}: niente botti`, !BOTTI_PER_PAESAGGIO[k])
for (const k of Object.keys(BOTTI_PER_PAESAGGIO)) controlla(`${k}: è un paesaggio`, !!PAESAGGI[k])
for (const [k, r] of Object.entries(BOTTI_PER_PAESAGGIO)) controlla(`${k}: rare (al più una stanza su quattro)`, (r.stanze || 0) <= 0.25 && (r.accampamento || 0) <= 0.5)

/* ══════════ 2. sui piani veri: quante, dove ══════════ */
for (const k of Object.keys(PAESAGGI)) {
  const regola = BOTTI_PER_PAESAGGIO[k]
  let stanze = 0, conBotti = 0, botti = 0, corridoio = 0, vicine = 0, sullaStrada = 0, senzaMuro = 0, gruppiGrossi = 0, sopra = 0
  for (const [i, t] of CAMPAGNA.entries()) for (const seme of [3, 11, 29]) {
    const c = new Corsa(inPaesaggio(t, k), { seme, rnd: seminato(seme) }), liv = c.livello, p = piantaDi(liv)
    const posti = postiDelleBotti(liv, regola, seme * 131 + 3).map(b => ({ ...b, cella: { x: b.x, y: b.y } }))
    stanze += liv.stanze.length; botti += posti.length
    const perStanza = new Map()
    for (const b of posti) perStanza.set(b.stanza, (perStanza.get(b.stanza) || 0) + 1)
    conBotti += perStanza.size
    for (const n of perStanza.values()) if (n > 4) gruppiGrossi++
    if (regola && regola.accampamento) controlla(`${k}: un accampamento al più per piano`, perStanza.size <= 1)
    const suolo = new Set(liv.stanze.flatMap(s => s.suolo.map(q => p.id(q.x, q.y))))
    const passaggi = liv.robe.filter(q => ['porta', 'scala', 'fonte', 'portale'].includes(q.che)).concat(liv.stanze.flatMap(s => s.porte))
    const robe = new Set(liv.robe.map(q => p.id(q.x, q.y)))
    for (const b of posti) {
      const { x, y } = b.cella
      if (!suolo.has(p.id(x, y))) corridoio++
      if (robe.has(p.id(x, y))) sopra++
      if (passaggi.some(q => Math.abs(q.x - x) + Math.abs(q.y - y) < 3)) vicine++
      if (![[0, -1], [1, 0], [-1, 0], [0, 1]].some(([dx, dy]) => p.roccia(x + dx, y + dy))) senzaMuro++
    }
    // la strada fra due passaggi della stessa stanza non passa mai da una botte
    for (const s of liv.stanze) {
      const su = new Set(s.suolo.map(q => p.id(q.x, q.y)))
      const varchi = passaggi.filter(q => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => su.has(p.id(q.x + dx, q.y + dy))))
      const qui = new Set(posti.filter(b => b.stanza === s.id).map(b => p.id(b.cella.x, b.cella.y)))
      if (!qui.size) continue
      for (let a = 0; a < varchi.length; a++) for (let z = a + 1; z < varchi.length; z++)
        for (const q of percorso((x, y) => p.calpestabile(x, y), varchi[a], varchi[z]) || []) if (qui.has(p.id(q.x, q.y))) sullaStrada++
    }
    if (i === 1 && seme === 11) uguale(`${k}: lo stesso seme, le stesse botti`, JSON.stringify(postiDelleBotti(liv, regola, seme * 131 + 3).map(b => ({ ...b, cella: { x: b.x, y: b.y } }))), JSON.stringify(posti))
  }
  nota(`${k}: ${botti} botti in ${conBotti} stanze su ${stanze}`)
  if (!regola) { uguale(`${k}: nessuna botte`, botti, 0); continue }
  if (regola.stanze) dentro(`${k}: solo alcune stanze ne hanno`, conBotti / stanze, regola.stanze * 0.4, regola.stanze * 1.7)
  controlla(`${k}: qualche botte c'è`, botti > 0)
  uguale(`${k}: mai nei corridoi`, corridoio, 0)
  uguale(`${k}: mai sulla roba del piano`, sopra, 0)
  uguale(`${k}: mai a meno di tre passi da porte, scale, fonte, portale`, vicine, 0)
  uguale(`${k}: mai sulla strada fra due passaggi`, sullaStrada, 0)
  uguale(`${k}: sempre contro un muro`, senzaMuro, 0)
  if (!regola.magazzino) uguale(`${k}: gruppetti da uno a quattro`, gruppiGrossi, 0)
}
{
  const c = new Corsa(inPaesaggio(CAMPAGNA[1], 'cantine'), { seme: 11, rnd: seminato(11) }), p = piantaDi(c.livello)
  void p
  const a = JSON.stringify(postiDelleBotti(c.livello, BOTTI_PER_PAESAGGIO.cantine, 1)), b = JSON.stringify(postiDelleBotti(c.livello, BOTTI_PER_PAESAGGIO.cantine, 2))
  controlla('un altro seme, altre botti', a !== b)
}

/* ══════════ 3. il motore: spento di difetto, cosa lascia una botte rotta ══════════ */
{
  // il premio: una su cinque, dal seme; sempre piccolo (la pozione più piccola, una o due gemme)
  let premi = 0, gemme = 0, pozioni = 0, altro = 0
  for (let seme = 0; seme < 40; seme++) for (let piano = 0; piano < 5; piano++) for (let i = 0; i < 20; i++) {
    const q = premioDellaBotte(seme, piano, i)
    uguale('lo stesso tiro dà lo stesso premio', JSON.stringify(premioDellaBotte(seme, piano, i)), JSON.stringify(q))
    if (!q) continue
    premi++
    if (q.che === 'gemme' && q.quante >= 1 && q.quante <= 2) gemme++
    else if (q.che === 'cosa' && q.cosa === 'pozione-piccola') pozioni++
    else altro++
  }
  nota(`premi: ${premi} su 4000 botti (${gemme} gemme, ${pozioni} pozioni)`)
  dentro('una botte su cinque lascia qualcosa', premi / 4000, 0.17, 0.23)
  uguale('mai roba grossa: solo la pozione più piccola o una o due gemme', altro, 0)
  controlla('ci sono sia gemme sia pozioni', gemme > 100 && pozioni > 100)
  controlla('la pozione è la più piccola del gioco', !!COSE['pozione-piccola'] && PREMI_DELLE_BOTTI.premi.every(p => p.che === 'gemme' || p.cosa === 'pozione-piccola'))

  // spenta di difetto: il 2D e il banco non hanno botti
  const t = inPaesaggio(CAMPAGNA[1], 'cantine')
  uguale('spenta di difetto: nessuna botte', new Corsa(t, { seme: 11, rnd: seminato(11) }).bottiQui().length, 0)
  // accesa: rompere davvero, accanto; una volta sola; il premio è per terra e si raccoglie
  let trovate = 0, rotte = 0, conPremio = null
  for (let seme = 1; seme < 60 && !conPremio; seme++) {
    const c = new Corsa(t, { seme, rnd: seminato(seme), botti: true })
    const bb = c.bottiQui()
    trovate += bb.length
    for (const b of bb) {
      uguale('lontano non si rompe', c.rompiBotte(b.i) === null || Math.hypot(b.fx - c.eroe.x, b.fy - c.eroe.y) <= 1.9, true)
      const prima = { gemme: c.gemme, vita: c.vita, esp: c.esperienza, robe: c.livello.robe.length }
      c.eroe = { x: b.x + 0.5, y: b.y + 0.5 }
      const r = c.rompiBotte(b.i)
      if (!r) continue
      rotte++
      controlla('rotta: la botte lo sa', b.rotta)
      uguale('una seconda volta no', c.rompiBotte(b.i), null)
      uguale('rompere non dà gemme da sé né vita né esperienza', JSON.stringify([c.gemme, c.vita, c.esperienza]), JSON.stringify([prima.gemme, prima.vita, prima.esp]))
      controlla('il segno nel piano è già preso (il 2D non lo vede)', c.livello.robe.some(q => q.che === 'botte' && q.botte === b.i && q.presa))
      if (r.premio) {
        const per = c.livello.robe.slice(prima.robe).find(q => q.che === r.premio.che && !q.presa)
        controlla('il premio è per terra', !!per)
        conPremio = { c, r, per }
        break
      }
    }
  }
  controlla('accese, le botti ci sono', trovate > 0, trovate)
  controlla('se ne rompono', rotte > 0, rotte)
  controlla('qualcuna lascia qualcosa', !!conPremio)
  if (conPremio && conPremio.r.premio.che === 'gemme') {
    const { c, per } = conPremio, g = c.gemme
    c.eroe = { x: per.x + 0.5, y: per.y + 0.5 }; c.raccogli()
    controlla('le gemme della botte si raccolgono davvero', c.gemme > g, `${g} → ${c.gemme}`)
  }
  // la sosta: rientrando la botte è ancora rotta (il segno sta fra le cose nuove del piano)
  if (conPremio) {
    const { scrivi, leggi } = await import('../../src/giochi/sotterraneo/motore/sosta.js')
    const dato = scrivi(conPremio.c, 1)
    const di = leggi(dato, t, null, [], null, {})
    if (di) {
      di.botti = true
      controlla('ripresa dalla sosta, la botte resta rotta', di.bottiQui().filter(b => b.rotta).length >= 1)
    } else nota('(la sosta non si rilegge qui: provato solo col dito)')
  }
}

riassunto('le botti da rompere')
