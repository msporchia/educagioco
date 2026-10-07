/* Il mondo dello zaino di Passo passo (le isole disegnate in codice),
   senza browser: a ogni larghezza da telefono le caselle stanno nello
   schermo e nella loro isola, le isole non si toccano, il ponte del
   coniglio non passa sopra un'isola del cane, il cartello del bivio non
   copre niente; in cima c'è l'isoletta con la tana che torna alla valle, da
   lì si arriva a ogni casella, il coniglio resta coniglio sulla sua strada e
   diventa cane solo da una tana. Vedi docs/passo-passo/mappa.md.
   `node test/esegui.mjs passo-passo-isole --niente-build` */
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { disponiIsole, viaggio, percorso, decori, ANIMALE } from '../../src/giochi/passo-passo/scena/isole.js'
import { nellaValle } from '../../src/giochi/passo-passo/scena/valle.js'
import { stendardo, stemma, stimaNome } from '../../src/giochi/passo-passo/scena/stendardo.js'
import { SCALINI } from '../../src/giochi/passo-passo/dati/campagna.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const S = { ...STRADE, isole: STRADE.isole.filter(s => !nellaValle(s.chiave)) }
const tappe = S.isole.flatMap(s => s.tappe)
const coniglio = STRADE.coniglio.filter(i => tappe.includes(i))
const cane = STRADE.cane.filter(i => tappe.includes(i))
const dentroRett = (x, y, r, m = 0) => x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.h + m
const OPZ = { ingresso: true }

controlla('lo zaino ha isole del coniglio e del cane', S.isole.some(s => s.animale === 'coniglio') && S.isole.some(s => s.animale === 'cane'))
for (const W of [320, 360, 390, 430, 520]) {
  const q = disponiIsole(W, S, OPZ)
  const caselle = q.nodi.filter(n => n.tipo !== 'tana')
  uguale(`${W} px: una casella per tappa dello zaino`, caselle.map(n => n.id).sort((a, b) => a - b).join(','),
         [...tappe].sort((a, b) => a - b).join(','))
  controlla(`${W} px: le caselle stanno nello schermo`,
            caselle.every(n => n.x - n.lato / 2 >= 4 && n.x + n.lato / 2 <= W - 4))
  controlla(`${W} px: e nella loro isola`, caselle.every(n => {
    const s = q.isole[n.isola]
    return n.x - n.lato / 2 >= s.x && n.x + n.lato / 2 <= s.x + s.w && n.y - n.lato / 2 >= s.y && n.y + n.lato / 2 <= s.y + s.h
  }), caselle.filter(n => !dentroRett(n.x, n.y, q.isole[n.isola])).map(n => n.id).join(','))
  controlla(`${W} px: l'animale seduto sulla prima riga sta dentro l'isola`,
            caselle.every(n => n.piede.y - ANIMALE.alto >= q.isole[n.isola].y - 4))
  const sovrapposte = []
  q.isole.forEach((a, i) => q.isole.slice(i + 1).forEach(b => {
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) sovrapposte.push(`${a.chiave}/${b.chiave}`)
  }))
  uguale(`${W} px: le isole non si toccano`, sovrapposte.join(' '), '')
  const vicine = []
  caselle.forEach((a, i) => caselle.slice(i + 1).forEach(b => {
    if (Math.abs(a.x - b.x) < (a.lato + b.lato) / 2 + 8 && Math.abs(a.y - b.y) < (a.lato + b.lato) / 2 + 8) vicine.push(`${a.id}/${b.id}`)
  }))
  uguale(`${W} px: fra due caselle c'è sempre posto per un dito`, vicine.join(' '), '')
  // ogni isola del cane sta fuori dalla strada maestra: il ponte del coniglio le gira attorno
  const maestra = q.strade.find(s => s.tipo === 'maestra').punti
  const sopra = q.isole.filter(s => s.animale === 'cane').filter(s => maestra.some(([x, y]) => dentroRett(x, y, s, 8)))
  uguale(`${W} px: il ponte del coniglio non passa sopra un'isola del cane`, sopra.map(s => s.chiave).join(' '), '')
  uguale(`${W} px: un bivio per ramo del cane`, q.bivi.length, S.isole.filter(s => s.animale === 'cane').length)
  controlla(`${W} px: il cartello del bivio non copre una casella né la tana`, q.bivi.every(b =>
    caselle.every(n => Math.abs(n.x - b.x) > n.lato / 2 + 26 || Math.abs(n.y - b.y) > n.lato / 2 + 24) &&
    q.nodi.filter(n => n.tipo === 'tana').every(t => Math.hypot(t.x - b.x, t.y - b.y) > 40)))
  // lo stendardo di ogni isola (e lo stemma di un'isoletta di una casella sola) sta nella sua isola,
  // non copre una casella né una strada né una tana; nome più largo che un carattere di riserva può dare
  const strade = q.strade.filter(e => e.tipo !== 'tunnel').map(e => e.punti)
  const ingombri = []
  for (const s of q.isole.filter(s => s.scalino)) {
    const sc = SCALINI.find(x => x.chiave === s.scalino)
    let r
    if (s.cartello) {
      const b = stendardo(stimaNome(sc.nome), s.animale, s.cartello.max)
      if (b.testoW < 0.6 * stimaNome(sc.nome)) ingombri.push(`${s.chiave} nome troppo stretto`)
      r = { x: s.cartello.lato > 0 ? s.x + s.w - 14 - b.w : s.x + 14, y: s.cartello.y, w: b.w, h: b.h }
    } else if (s.isolotto) {
      const t = q.nodi.find(n => n.isola === s.k && n.tipo === 'tana')
      const e = stemma(s.animale)
      r = { x: s.x + (t.x < s.x + s.w / 2 ? s.w - 36 : 10), y: s.y + 8, w: e.w, h: e.h }
    } else continue
    const dove = `${s.chiave}`
    if (r.x < s.x || r.x + r.w > s.x + s.w || r.y < s.y || r.y + r.h > s.y + s.h) ingombri.push(`${dove} fuori dall'isola`)
    for (const n of caselle) if (n.isola === s.k &&
        r.x < n.x + n.lato / 2 + 4 && r.x + r.w > n.x - n.lato / 2 - 4 && r.y < n.y + n.lato / 2 + 4 && r.y + r.h > n.y - n.lato / 2) ingombri.push(`${dove}/${n.id}`)
    for (const t of q.nodi.filter(n => n.tipo === 'tana' && n.isola === s.k))
      if (Math.abs(t.x - (r.x + r.w / 2)) < r.w / 2 + 24 && Math.abs(t.y - (r.y + r.h / 2)) < r.h / 2 + 18) ingombri.push(`${dove}/${t.id}`)
    for (const pts of strade) for (let i = 1; i < pts.length; i++) for (let u = 0; u <= 1; u += 0.02) {
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u
      if (x > r.x - 12 && x < r.x + r.w + 12 && y > r.y - 12 && y < r.y + r.h + 12) ingombri.push(`${dove}/strada`)
    }
  }
  uguale(`${W} px: lo stendardo (o lo stemma) sta nella sua isola e non copre niente`, [...new Set(ingombri)].join(' | '), '')
  controlla(`${W} px: le tane del cane una sopra l'altra`,
            q.archi.filter(e => e.tipo === 'tunnel').every(e => q.nodi.find(n => n.id === e.a).x === q.nodi.find(n => n.id === e.b).x))
  controlla(`${W} px: le cose sparse non stanno sotto una casella`, decori(q).every(c =>
    caselle.every(n => Math.hypot(n.x - c.x, n.y - c.y) > n.lato / 2)))

  // in cima, la tana che torna alla valle: sta su un'isoletta sua, sopra tutte le altre
  const uscita = q.nodi.find(n => n.id === 'tana:valle')
  controlla(`${W} px: in cima c'è la tana che torna alla valle`, !!uscita && q.nodi.every(n => n === uscita || n.y > uscita.y))
  controlla(`${W} px: e il suo nome ci sta accanto`, !!uscita && uscita.etichetta.largo >= 100 && uscita.etichetta.x > uscita.x)
  // da lì si arriva a ogni casella
  controlla(`${W} px: dalla tana si arriva a ogni casella`, caselle.every(n => percorso(q, 'tana:valle', n.id)))
  uguale(`${W} px: e alla prima del coniglio si va saltando, da coniglio`,
         viaggio(q, 'tana:valle', coniglio[0]).map(p => `${p.che}:${p.animale}`).join(' '), 'salto:coniglio')
  // il coniglio resta coniglio sulla sua strada: fra due tappe del coniglio nessuna tana
  const conTana = []
  for (let k = 1; k < coniglio.length; k++) {
    const v = viaggio(q, coniglio[k - 1], coniglio[k])
    if (v.some(p => p.che !== 'salto' || p.animale !== 'coniglio')) conTana.push(coniglio[k])
  }
  uguale(`${W} px: sulla strada maestra salta sempre il coniglio`, conTana.join(' '), '')
  const sulCane = viaggio(q, coniglio[0], cane[0])
  uguale(`${W} px: dalla prima del coniglio alla prima del cane si passa da una tana sola`,
         sulCane.filter(p => p.che !== 'salto').map(p => `${p.che}:${p.animale}`).join(' '), 'entra:coniglio esce:cane')
  controlla(`${W} px: e ogni salto lo fa l'animale dell'isola dove atterra`, sulCane.every(p =>
    p.che !== 'salto' || p.animale === q.nodi.find(n => n.id === p.al).animale))
  const traIsole = viaggio(q, cane.at(-1), cane[0])
  controlla(`${W} px: da un'isola del cane all'altra si torna coniglio in mezzo`,
            traIsole.filter(p => p.che === 'esce').map(p => p.animale).join(' ') === 'coniglio cane')
}

// la stessa mappa a ogni apertura
uguale('la stessa mappa a ogni apertura', JSON.stringify(disponiIsole(390, S, OPZ)), JSON.stringify(disponiIsole(390, S, OPZ)))
uguale('e le stesse cose sparse', JSON.stringify(decori(disponiIsole(390, S, OPZ))), JSON.stringify(decori(disponiIsole(390, S, OPZ))))

riassunto('passo passo — il mondo dello zaino')
