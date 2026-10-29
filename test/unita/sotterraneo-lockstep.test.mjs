/* La discesa deve venire uguale al bit su due telefoni con lo stesso seme e gli stessi comandi: è la condizione per scendere in
   due scambiandosi solo le mosse (docs/sotterraneo/in-due.md, «Il caso e i conti uguali»). Due browser possono dare numeri
   diversi da `Math.random` (sempre) e dalle funzioni che la specifica lascia arrotondare a piacere (`hypot`, la trigonometria,
   `pow`, `exp`, `log`): il giocatore finto scende in ogni dungeon del 3D, con le botti e i copricapi, e nessuna di queste deve
   essere chiamata. `sqrt` e le quattro operazioni sono esatte ovunque. `node test/esegui.mjs sotterraneo-lockstep --niente-build` */
import { tappaDelMondo, CHIAVI_DEI_DUNGEON } from '../../src/giochi/sotterraneo/motore/rigenera.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { robaAttesaA, crescitaAttesaA } from '../../src/giochi/sotterraneo/motore/zone.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const VIETATE = ['random', 'hypot', 'atan2', 'atan', 'acos', 'asin', 'cos', 'sin', 'tan', 'pow', 'exp', 'expm1', 'log', 'log1p',
  'log2', 'log10', 'cbrt', 'sinh', 'cosh', 'tanh']
const EROI = ['cavaliere', 'elfa', 'mago', 'nano']
const LIVELLO = 14

/* chi chiama una funzione vietata mentre gira `fai`: { 'hypot motore/corsa.js:470': quante } */
function chiamateVietate(fai) {
  const prima = {}, viste = new Map()
  for (const k of VIETATE) {
    prima[k] = Math[k]
    Math[k] = function (...a) {
      const riga = (new Error().stack.split('\n').slice(2).find(r => r.includes('/src/')) || '?').replace(/^.*\/src\//, '').replace(/\)$/, '')
      viste.set(`${k} ${riga}`, (viste.get(`${k} ${riga}`) || 0) + 1)
      return prima[k].apply(Math, a)
    }
  }
  try { fai() } finally { for (const k of VIETATE) Math[k] = prima[k] }
  return viste
}

/* una discesa del 3D giocata dal giocatore finto, e la sua impronta: dove sono tutti, quanto hanno, cosa è successo */
function discesa(chiave, i, seme) {
  const eroe = EROI[i % EROI.length]
  const tappa = tappaDelMondo(chiave, { eroe, livello: LIVELLO })
  const corsa = new Corsa(tappa, { seme, rnd: seminato(seme), eroe, roba: robaAttesaA(eroe, LIVELLO), crescita: crescitaAttesaA(eroe, LIVELLO),
    botti: true, copricapi: true })
  const g = gioca(tappa, { da: corsa, seme, come: 'tutto', eroe })
  const c = g.corsa
  return JSON.stringify({
    esito: g.esito, piano: c.piano, passi: c.passi, vita: c.vita, energia: c.energia, eroe: [c.eroe.x, c.eroe.y],
    roba: c.roba, gemme: c.gemme, mostri: c.livello.robe.filter(r => r.che === 'mostro').map(m => [m.x, m.y, m.fx, m.fy, m.ossa, !!m.morto]),
  })
}

const impronte = []
const viste = chiamateVietate(() => {
  CHIAVI_DEI_DUNGEON.forEach((chiave, i) => impronte.push(discesa(chiave, i, 101 + i * 37)))
})
for (const [dove, n] of viste) nota(`${dove} (${n} volte)`)
uguale('nessuna funzione che due browser arrotondano diversa, e niente Math.random', viste.size, 0)

/* la stessa discesa due volte dà la stessa impronta (qui lo stesso motore: il guasto che prende è il caso nascosto, uno stato
   che resta fra una partita e l'altra) */
CHIAVI_DEI_DUNGEON.forEach((chiave, i) => controlla(`${chiave}: la stessa discesa, la stessa impronta`, discesa(chiave, i, 101 + i * 37) === impronte[i]))

riassunto('Il sotterraneo, la discesa uguale sui due telefoni')
