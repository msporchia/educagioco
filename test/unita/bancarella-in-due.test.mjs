/* La cucina in due: la consegna che prenota da sola, il pulsantino, i conti che fermano solo chi li fa, l'orologio, e due telefoni
   che restano la stessa partita anche su una rete cattiva. Vedi docs/bancarella/in-due.md.
   tempo: 2 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { partitaNuova, avanza, applica, motoreDi, mossaValida, regolaCucina, vistaDi, PASSO } from '../../src/motore/bancarella/in-due.js'
import { MENU_IN_DUE, RICETTE, ricetteDi, campInDue, attrezziDi } from '../../src/data/bancarella-cucine.js'
import cucina from '../aiuto/sfide/cucina.mjs'
import { partitaInDue, SCENARI } from '../aiuto/sfida-finta.mjs'

const nuova = (fatti = {}) => partitaNuova({ seme: 7, minuti: 5, menu: 'pochi', ...fatti })
const scorri = (S, s) => { for (let t = 0; t < s && !S.fine; t += PASSO) avanza(S) }
const cella = (S, tipo) => S.cucina.celle.find(k => k.tipo === tipo).id
const piattoPronto = emoji => ({ piatto: true, cose: [], pronto: emoji, daInfornare: false, forno: '' })
// il piatto in mano a uno dei due, della prima ordinazione della lista
const conIlPiatto = (S, ruolo, o = S.ordini[0]) => { S.cuochi[ruolo].cuoco.mano = piattoPronto(o.piatto); return o }

test('i due cuochi stanno nella stessa stanza e si muovono ognuno per sé', () => {
  const S = nuova()
  assert.notEqual(S.cuochi.host.cuoco.x, S.cuochi.ospite.cuoco.x)
  const prima = S.cuochi.ospite.cuoco.x
  applica(S, 'host', ['tocca', cella(S, 'piatti')])
  scorri(S, 4)
  assert.ok(S.cuochi.host.cuoco.mano?.piatto, 'ha preso un piatto')
  assert.equal(S.cuochi.ospite.cuoco.x, prima, 'l\'altro non si è mosso')
  assert.equal(S.cuochi.ospite.cuoco.mano, null)
  assert.equal(S.cucina.puliti, 7, 'la pila è una sola')
})

test('andando a consegnare l\'ordinazione diventa tua, e cambiando strada la lasci', () => {
  const S = nuova(), o = conIlPiatto(S, 'host')
  applica(S, 'host', ['tocca', cella(S, 'consegna')])
  assert.equal(o.di, 'host')
  applica(S, 'host', ['tocca', cella(S, 'bidone')])
  assert.equal(o.di, '', 'ha cambiato idea')
})

test('l\'ordinazione prenotata dall\'altro non si serve', () => {
  const S = nuova()
  for (const x of S.ordini) applica(S, 'host', ['prenota', x.id])
  const o = conIlPiatto(S, 'ospite')
  applica(S, 'ospite', ['tocca', cella(S, 'consegna')])
  scorri(S, 4)
  assert.equal(o.di, 'host')
  assert.equal(S.cuochi.ospite.calcola, 0)
  assert.ok(S.cuochi.ospite.cuoco.mano, 'il piatto resta in mano')
  assert.match(S.cuochi.ospite.detto, /prenotata/)
})

test('il pulsantino: prende il colore, si lascia, e quella dell\'altro non si tocca', () => {
  const S = nuova(), o = S.ordini[0]
  applica(S, 'host', ['prenota', o.id]); assert.equal(o.di, 'host')
  applica(S, 'ospite', ['prenota', o.id]); assert.equal(o.di, 'host', 'non si ruba')
  applica(S, 'host', ['prenota', o.id]); assert.equal(o.di, '', 'un secondo tocco la lascia')
})

test('chi consegna fa i conti da fermo, l\'altro va avanti e l\'ordinazione non scade', () => {
  const S = nuova(), o = conIlPiatto(S, 'host')
  applica(S, 'host', ['tocca', cella(S, 'consegna')])
  scorri(S, 4)
  assert.equal(S.cuochi.host.calcola, o.id)
  assert.equal(S.cuochi.host.cuoco.mano, null)
  applica(S, 'host', ['tocca', cella(S, 'piatti')])
  applica(S, 'ospite', ['tocca', cella(S, 'piatti')])
  const resta = o.resta
  scorri(S, 4)
  assert.equal(S.cuochi.host.cuoco.mano, null, 'chi calcola non si muove')
  assert.ok(S.cuochi.ospite.cuoco.mano, 'l\'altro sì')
  assert.equal(o.resta, resta, 'mentre si conta non scade')
  applica(S, 'host', ['pagata', o.id])
  assert.equal(S.serviti.host, 1)
  assert.equal(S.cuochi.host.calcola, 0)
  assert.ok(!S.ordini.some(x => x.id === o.id))
  scorri(S, PASSO)
  assert.equal(S.ordini.length, 4, 'ne arriva un\'altra')
})

test('una scaduta sparisce e ne arriva un\'altra; a zero la partita finisce', () => {
  const S = nuova()
  S.ordini[0].resta = 0.01
  scorri(S, 0.1)
  assert.equal(S.scadute, 1)
  assert.equal(S.ordini.length, 4)
  S.resta = 0.2
  scorri(S, 1)
  assert.equal(S.fine, 'tempo')
})

test('due tagliano lo stesso tagliere, due lavano l\'ultimo piatto: i conti tornano', () => {
  const S = nuova(), { cucina: c } = S
  c.stazioni.tagliere = { fase: 'taglia', t: 0, cosa: 'pomodoro', colpi: 0 }
  const tagliere = c.celle.find(k => k.nome === 'tagliere').id
  applica(S, 'host', ['tocca', tagliere]); applica(S, 'ospite', ['tocca', tagliere])
  scorri(S, 5)
  assert.equal(c.stazioni.tagliere.fase, 'pronta')
  assert.equal(S.cuochi.host.tagliando + S.cuochi.ospite.tagliando, '')
  c.sporchi = 1; const puliti = c.puliti
  const lavello = cella(S, 'lavello')
  applica(S, 'host', ['tocca', lavello]); applica(S, 'ospite', ['tocca', lavello])
  scorri(S, 6)
  assert.equal(c.sporchi, 0)
  assert.equal(c.puliti, puliti + 1)
})

test('le pietanze: chi sceglie di più ha più roba, e ogni menù ha i suoi attrezzi doppi', () => {
  assert.ok(MENU_IN_DUE.pochi.ricette.length < MENU_IN_DUE.tante.ricette.length)
  assert.equal(MENU_IN_DUE.tutte.ricette.length, RICETTE.length)
  for (const [menu, m] of Object.entries(MENU_IN_DUE)) {
    assert.equal(ricetteDi(m.ricette).length, m.ricette.length, `${menu}: nessuna ricetta inventata`)
    const S = nuova({ menu })
    for (const t of attrezziDi(campInDue(menu))) assert.ok(S.cucina.stazioni[`${t}:2`], `${menu}: ${t} doppio`)
    assert.ok(S.cucina.celle.some(k => k.tipo === 'lavello'))
  }
  assert.deepEqual(Object.keys(nuova().cucina.stazioni).sort(), ['tagliere', 'tagliere:2'], 'a crudo niente fuochi')
})

test('la vista: il mio cuoco è `cuoco`, l\'altro sta in `altro`', () => {
  const S = nuova(), v = {}
  vistaDi(S, 'ospite', v)
  assert.equal(v.cuoco, S.cuochi.ospite.cuoco)
  assert.equal(v.altro, S.cuochi.host)
  assert.equal(v.mio, 'ospite')
  assert.equal(vistaDi(S, 'host', v), v, 'sempre lo stesso oggetto')
  assert.equal(v.cuoco, S.cuochi.host.cuoco)
})

test('solo mosse di questo gioco', () => {
  for (const m of [['tocca', '1,3'], ['vai', 2, 4], ['prenota', 3], ['pagata', 3]]) assert.ok(mossaValida(m), m[0])
  for (const m of [null, ['tocca', 3], ['vai', -1, 2], ['prenota', 'x'], ['ruba', 1], ['tocca', '1,3', 2]]) assert.ok(!mossaValida(m), JSON.stringify(m))
  const r = regolaCucina()
  assert.equal(r.accetta(r.proponi({ minuti: 10, menu: 'tante' })), null)
  assert.ok(r.accetta({ seme: 1, minuti: 7, menu: 'tante' }))
  assert.ok(r.accetta({ seme: 1, minuti: 5, menu: 'nessuno' }))
})

test('la fotografia rimette tutto, e una stessa partita viene uguale', () => {
  const gioca = S => { applica(S, 'host', ['tocca', cella(S, 'piatti')]); applica(S, 'ospite', ['tocca', cella(S, 'lavello')]); scorri(S, 30) }
  const a = motoreDi(nuova()), b = motoreDi(nuova())
  gioca(a.S); gioca(b.S)
  assert.ok(a.simili(a.impronta(), b.impronta()))
  const c = motoreDi(nuova({ seme: 99 }))
  c.rimetti(a.foto())
  assert.ok(a.simili(a.impronta(), c.impronta()))
  scorri(a.S, 5); scorri(c.S, 5)
  assert.ok(a.simili(a.impronta(), c.impronta()), 'e da lì vanno avanti uguali')
})

for (const [nome, scenario] of [['calma', SCENARI.calma], ['agitata', SCENARI.agitata]]) test(`due telefoni su una rete ${nome}: la stessa cucina fino in fondo`, () => {
  const { host, ospite } = partitaInDue({ gioco: cucina, seme: 3, scenario, minuti: 8 })
  const uguali = host.motore?.S.fine && ospite.motore?.S.fine
  if (scenario === SCENARI.calma) assert.ok(uguali, 'finisce')
  if (uguali) {
    assert.deepEqual(host.motore.S.serviti, ospite.motore.S.serviti)
    assert.equal(host.lockstep.riallineamenti, 0, 'le copie non si separano')
    assert.ok(host.motore.S.ordinazioni > 4)
  }
})
