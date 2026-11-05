import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CUCINE } from '../../src/data/bancarella.js'
import { cucinaCuoco, passo, usa, tocca, vaiA, arriva, consegna, TAGLI, FILA_MAX } from '../../src/motore/bancarella/cuoco.js'

/* Tocca un posto, lascia camminare il cuoco e fa la mossa, come fa la vista. */
function vai(c, id) {
  assert.ok(tocca(c, id), `si tocca ${id}`)
  for (let t = 0; t < 8 && !c.arrivato; t += 0.05) passo(c, 0.05)
  assert.equal(c.arrivato, id, `il cuoco arriva a ${id}`)
  return arriva(c)
}
const fa = (c, id) => usa(c, vai(c, id))
// il primo della fila
const vai2 = c => { for (let t = 0; t < 8 && !c.arrivato; t += 0.05) passo(c, 0.05); return arriva(c) }
const cucina = n => cucinaCuoco(CUCINE[n])
const aspetta = (c, s) => { for (let t = 0; t < s; t += 0.05) passo(c, 0.05) }
const cella = (c, f) => c.celle.find(f).id
const cassetta = (c, cosa) => cella(c, k => k.cosa === cosa)

test('la stanza ha solo quello che serve alla cucina', () => {
  const c = cucina(0)
  assert.deepEqual(Object.keys(c.stazioni), ['pentola'])
  assert.ok(c.celle.some(k => k.nome === 'pentola'))
  assert.ok(!c.celle.some(k => k.nome === 'forno'))
  assert.ok(!c.celle.some(k => k.cosa === 'impasto'))
  assert.equal(c.celle.filter(k => k.tipo === 'consegna').length, 1)
})

test('il cuoco gira attorno ai banconi e si ferma davanti al posto toccato', () => {
  const c = cucina(0)
  const solido = (x, z) => c.celle.some(k => k.x === Math.floor(x) && k.z === Math.floor(z))
  tocca(c, '3,0')
  for (let i = 0; i < 200 && !c.arrivato; i++) { passo(c, 0.05); assert.ok(!solido(c.cuoco.x, c.cuoco.z), `sul pavimento: ${c.cuoco.x},${c.cuoco.z}`) }
  assert.equal(c.arrivato, '3,0')
  assert.deepEqual([c.cuoco.x, c.cuoco.z], [3.5, 1.5])
  assert.ok(Math.abs(Math.abs(c.cuoco.verso) - Math.PI) < 1e-6, 'guarda il posto')
})

test('si arriva anche agli angoli', () => {
  const c = cucina(0)
  for (const id of ['0,0', '6,0', '0,6', '6,6']) vai(c, id)
})

test('i tocchi si mettono in fila, il pavimento li butta', () => {
  const c = cucina(0)
  tocca(c, cassetta(c, 'pasta')); tocca(c, '1,0')
  assert.equal(c.fila.length, 2)
  usa(c, vai2(c)); usa(c, vai2(c))
  assert.equal(c.stazioni.pentola.fase, 'cuoce')
  assert.equal(c.fila.length, 0)
  for (let i = 0; i <= FILA_MAX; i++) tocca(c, '3,3')
  assert.equal(c.fila.length, FILA_MAX, 'la fila ha un tetto')
  assert.ok(vaiA(c, 5, 5))
  assert.equal(c.fila.length, 0)
  aspetta(c, 3)
  assert.deepEqual([c.cuoco.x, c.cuoco.z], [5.5, 5.5])
})

test('la pasta al pomodoro, dalla cassetta alla consegna', () => {
  const c = cucina(0)
  assert.ok(fa(c, cassetta(c, 'pasta'))); assert.equal(c.cuoco.mano.cosa, 'pasta')
  assert.ok(fa(c, '1,0')); assert.equal(c.stazioni.pentola.fase, 'cuoce'); assert.equal(c.cuoco.mano, null)
  assert.ok(fa(c, '2,6')); assert.ok(c.cuoco.mano.piatto)
  assert.ok(fa(c, cassetta(c, 'sugo')), 'il sugo va dritto sul piatto')
  assert.deepEqual(c.cuoco.mano.cose, ['sugo'])
  assert.equal(fa(c, '1,0'), false); assert.equal(c.perche, 'Sta cuocendo')
  aspetta(c, 7.1)
  assert.equal(c.stazioni.pentola.fase, 'pronta')
  assert.ok(fa(c, '1,0'))
  assert.equal(c.cuoco.mano.pronto, '🍝')
  assert.deepEqual(c.cuoco.mano.cose, ['pasta', 'sugo'], 'il piatto si dispone da sé')
  assert.equal(consegna(c, ['🥪']), false, 'il piatto sbagliato resta in mano')
  assert.ok(c.cuoco.mano)
  assert.ok(consegna(c, ['🍝']))
  assert.equal(c.cuoco.mano, null)
})

test('sul piatto si deposita, a mani vuote si prende', () => {
  const c = cucina(0)
  fa(c, '2,6')
  assert.ok(fa(c, '3,3'), 'il piatto si posa sull\'isola')
  assert.ok(c.sopra['3,3'].piatto)
  fa(c, cassetta(c, 'pasta'))
  assert.equal(fa(c, '3,3'), false); assert.equal(c.perche, 'Prima va cotta')
  c.cuoco.mano = null
  fa(c, cassetta(c, 'sugo'))
  assert.ok(fa(c, '3,3'), 'quello che ho in mano va sul piatto')
  assert.equal(c.cuoco.mano, null)
  assert.deepEqual(c.sopra['3,3'].cose, ['sugo'])
  assert.ok(fa(c, '3,3'), 'a mani vuote il piatto si prende')
  assert.ok(c.cuoco.mano.piatto)
  assert.equal(c.sopra['3,3'], undefined)
})

test('il tagliere: si posa, si taglia a tocchi, poi si prende', () => {
  const c = cucina(1)
  fa(c, cassetta(c, 'insalata'))
  assert.ok(fa(c, '5,6')); assert.equal(c.stazioni.tagliere.fase, 'taglia')
  for (let i = 0; i < TAGLI; i++) { assert.equal(c.stazioni.tagliere.colpi, i); assert.ok(fa(c, '5,6')) }
  assert.equal(c.stazioni.tagliere.fase, 'pronta')
  assert.ok(fa(c, '5,6')); assert.deepEqual({ ...c.cuoco.mano }, { cosa: 'insalata', fatta: true, bruciata: false })
  c.cuoco.mano = null
  fa(c, cassetta(c, 'insalata')); fa(c, '5,6'); fa(c, cassetta(c, 'pane'))
  assert.equal(fa(c, '5,6'), false, 'con le mani piene non si taglia')
  assert.equal(c.perche, 'Per tagliare servono le mani libere')
})

test('la pizza entra col piatto ed esce pronta; il bruciato va nel bidone', () => {
  const c = cucina(3)
  c.cuoco.mano = { piatto: true, cose: ['impasto', 'sugo', 'formaggio'], pronto: '', daInfornare: true }
  assert.ok(fa(c, '4,0')); assert.equal(c.stazioni.forno.cosa, 'pizza'); assert.equal(c.cuoco.mano, null)
  aspetta(c, 8.1)
  assert.ok(fa(c, '4,0')); assert.equal(c.cuoco.mano.pronto, '🍕')
  c.cuoco.mano = null
  fa(c, cassetta(c, 'carne'))
  fa(c, '2,0')
  aspetta(c, 11)
  assert.equal(c.stazioni.padella.fase, 'scotta')
  assert.ok(fa(c, '2,0')); assert.ok(c.cuoco.mano.bruciata)
  assert.ok(fa(c, '1,6')); assert.equal(c.cuoco.mano, null)
})

test('ogni ricetta di ogni cucina si può finire', () => {
  for (const camp of CUCINE) {
    const c = cucinaCuoco(camp)
    const isola = c.celle.find(k => k.id === '3,3')
    for (const r of c.ricette) {
      c.sopra['3,3'] = { piatto: true, cose: [], pronto: '', daInfornare: false }
      for (const cosa of [...r.passi].reverse()) { c.cuoco.mano = { cosa, fatta: true, bruciata: false }; assert.ok(usa(c, isola), `${r.nome}: ${cosa}`) }
      assert.ok(c.sopra['3,3'].pronto === r.emoji || c.sopra['3,3'].daInfornare, r.nome)
      delete c.sopra['3,3']
    }
  }
})
