/* Gli alleati della discesa (src/giochi/sotterraneo/motore/persone.js, docs/sotterraneo/in-due.md): quello che è dell'eroe sta nella
   persona, il mondo nella discesa. Dopo una discesa intera nessun campo dell'eroe è rimasto sulla discesa, e due persone non si
   pestano: quello che fa l'una non tocca l'altra, il mondo è lo stesso. `node test/esegui.mjs sotterraneo-persone --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { CAMPI_DELLA_PERSONA } from '../../src/giochi/sotterraneo/motore/persone.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. dopo una discesa giocata, i campi dell'eroe stanno tutti nella persona ══════════ */
for (const [k, eroe] of [[1, 'cavaliere'], [3, 'mago'], [5, 'elfa'], [6, 'nano']]) {
  const g = gioca(CAMPAGNA[k], { seme: 17 + k, come: 'tutto', eroe })
  const c = g.corsa
  const fuori = Object.keys(c).filter(n => CAMPI_DELLA_PERSONA.includes(n))
  uguale(`${CAMPAGNA[k].chiave}, ${eroe}: nessun campo dell'eroe sulla discesa`, fuori.join(' '), '')
  controlla(`${CAMPAGNA[k].chiave}, ${eroe}: una persona sola`, c.persone.length === 1 && c.persone[0] === c.persona)
  // i campi della persona sono quelli dell'elenco: uno nuovo che il gioco scrive e l'elenco non ha resterebbe del mondo
  const ignoti = Object.keys(c.persona).filter(n => !CAMPI_DELLA_PERSONA.includes(n))
  uguale(`${CAMPAGNA[k].chiave}, ${eroe}: la persona ha solo campi dell'elenco`, ignoti.join(' '), '')
}

/* ══════════ 2. due persone nella stessa discesa ══════════ */
const a = new Corsa(CAMPAGNA[2], { seme: 5, rnd: seminato(5), eroe: 'cavaliere' })
const b = new Corsa(CAMPAGNA[2], { seme: 5, rnd: seminato(5), eroe: 'mago' })
a.persone.push(b.persona)
const prima = JSON.stringify({ vita: a.vita, gemme: a.gemme, eroe: a.eroe, zaino: a.zaino })
const daB = { att: b.att, vitaMax: b.vitaMax, energiaMax: b.energiaMax, chiEro: b.chiEro }
uguale('come il secondo: la sua classe', a.come(1, () => a.chiEro), 'mago')
uguale('come il secondo: i conti del corredo sono i suoi', JSON.stringify(a.come(1, () => ({ att: a.att, vitaMax: a.vitaMax, energiaMax: a.energiaMax, chiEro: a.chiEro }))), JSON.stringify(daB))
a.come(1, () => { a.vita -= 3; a.gemme += 7; a.eroe = { x: a.eroe.x + 1, y: a.eroe.y } })
uguale('quello che fa il secondo non tocca il primo', JSON.stringify({ vita: a.vita, gemme: a.gemme, eroe: a.eroe, zaino: a.zaino }), prima)
uguale('il secondo ha preso le sue gemme', b.persona.gemme, 7)
controlla('il mondo è lo stesso per tutti e due', a.come(1, () => a.livello) === a.livello && a.come(1, () => a.piano) === a.piano)
controlla('finito «come», si torna al primo', a.persona === a.persone[0])
let guasto = null
try { a.come(1, () => { throw new Error('a metà') }) } catch (e) { guasto = e }
controlla('anche se si rompe a metà', guasto && a.persona === a.persone[0])

riassunto('Il sotterraneo, gli alleati della discesa')
