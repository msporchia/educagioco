/* La mappa delle isole di Passo passo, senza browser: a ogni larghezza da
   telefono le caselle stanno nello schermo e nella loro isola, le isole
   non si toccano, il ponte del coniglio non passa sopra un'isola del cane,
   il cartello del bivio non copre niente; da ogni casella si arriva a ogni
   altra, il coniglio resta coniglio sulla sua strada e diventa cane solo
   passando da una tana. Vedi docs/passo-passo/mappa.md.
   `node test/esegui.mjs passo-passo-isole --niente-build` */
import { CAMPAGNA } from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE } from '../../src/giochi/passo-passo/motore/strade.js'
import { disponiIsole, viaggio, percorso, decori, ANIMALE } from '../../src/giochi/passo-passo/scena/isole.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const S = STRADE
const dentroRett = (x, y, r, m = 0) => x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.h + m

for (const W of [320, 360, 390, 430, 520]) {
  const q = disponiIsole(W, S)
  const caselle = q.nodi.filter(n => n.tipo !== 'tana')
  uguale(`${W} px: una casella per tappa, più il sentiero`, caselle.length, CAMPAGNA.length + 1)
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
  controlla(`${W} px: le tane del cane una sopra l'altra`,
            q.archi.filter(e => e.tipo === 'tunnel').every(e => q.nodi.find(n => n.id === e.a).x === q.nodi.find(n => n.id === e.b).x))
  controlla(`${W} px: le cose sparse non stanno sotto una casella`, decori(q).every(c =>
    caselle.every(n => Math.hypot(n.x - c.x, n.y - c.y) > n.lato / 2)))

  // da ogni casella si arriva a ogni altra
  const ids = caselle.map(n => n.id)
  controlla(`${W} px: da ogni casella si arriva a ogni altra`, ids.every(id => percorso(q, ids[0], id)))
  // il coniglio resta coniglio sulla sua strada: fra due tappe del coniglio nessuna tana
  const conTana = []
  for (let k = 1; k < S.coniglio.length; k++) {
    const v = viaggio(q, S.coniglio[k - 1], S.coniglio[k])
    if (v.some(p => p.che !== 'salto' || p.animale !== 'coniglio')) conTana.push(S.coniglio[k])
  }
  uguale(`${W} px: sulla strada maestra salta sempre il coniglio`, conTana.join(' '), '')
  const sulCane = viaggio(q, 0, S.cane[0])
  uguale(`${W} px: dal prato al primo gregge si passa da una tana sola`,
         sulCane.filter(p => p.che !== 'salto').map(p => `${p.che}:${p.animale}`).join(' '), 'entra:coniglio esce:cane')
  controlla(`${W} px: e ogni salto lo fa l'animale dell'isola dove atterra`, sulCane.every(p =>
    p.che !== 'salto' || p.animale === q.nodi.find(n => n.id === p.al).animale))
  const traIsole = viaggio(q, S.cane.at(-1), S.cane[0])
  controlla(`${W} px: da un'isola del cane all'altra si torna coniglio in mezzo`,
            traIsole.filter(p => p.che === 'esce').map(p => p.animale).join(' ') === 'coniglio cane')
}

// la stessa mappa a ogni apertura
uguale('la stessa mappa a ogni apertura', JSON.stringify(disponiIsole(390, S)), JSON.stringify(disponiIsole(390, S)))
uguale('e le stesse cose sparse', JSON.stringify(decori(disponiIsole(390, S))), JSON.stringify(decori(disponiIsole(390, S))))

riassunto('passo passo — la mappa delle isole')
