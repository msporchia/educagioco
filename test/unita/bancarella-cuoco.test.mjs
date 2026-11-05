import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CUCINE } from '../../src/data/bancarella.js'
import { cucinaCuoco, passo, usa, taglia, bersaglio, decidi, consegna, TAGLI } from '../../src/motore/bancarella/cuoco.js'

/* Porta il cuoco davanti a una cella, a passi di levetta come farebbe il dito. */
function vai(c, id) {
  const q = c.celle.find(k => k.id === id)
  const dentro = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const x = dentro(q.x + 0.5, 1.4, 5.6), z = dentro(q.z + 0.5, 1.4, 4.6)
  c.cuoco.x = x; c.cuoco.z = z
  // accanto all'isola il posto giusto è sotto
  if (q.z === 2 && q.x >= 2 && q.x <= 4) c.cuoco.z = 3.5
  c.cuoco.verso = Math.atan2(q.x + 0.5 - c.cuoco.x, q.z + 0.5 - c.cuoco.z)
  assert.equal(bersaglio(c)?.id, id, `il cuoco guarda ${id}`)
}
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

test('il cuoco non attraversa i banconi e ci scivola contro', () => {
  const c = cucina(0)
  c.leva.x = -1; c.leva.z = 0
  aspetta(c, 3)
  assert.ok(c.cuoco.x >= 1.31, `resta nella stanza: ${c.cuoco.x}`)
  c.leva.x = -0.7; c.leva.z = 0.7
  const z = c.cuoco.z
  aspetta(c, 0.2)
  assert.ok(c.cuoco.z > z, 'scivola lungo il banco')
})

test('la pasta al pomodoro, dalla cassetta alla consegna', () => {
  const c = cucina(0)
  vai(c, cassetta(c, 'pasta')); assert.ok(usa(c)); assert.equal(c.cuoco.mano.cosa, 'pasta')
  vai(c, '1,0'); assert.ok(usa(c)); assert.equal(c.stazioni.pentola.fase, 'cuoce'); assert.equal(c.cuoco.mano, null)
  vai(c, '2,5'); assert.ok(usa(c)); assert.ok(c.cuoco.mano.piatto)
  vai(c, cassetta(c, 'sugo')); assert.ok(usa(c), 'il sugo va dritto sul piatto')
  assert.deepEqual(c.cuoco.mano.cose, ['sugo'])
  vai(c, '1,0'); assert.equal(usa(c), false); assert.equal(c.perche, 'Sta cuocendo')
  aspetta(c, 7.1)
  assert.equal(c.stazioni.pentola.fase, 'pronta')
  assert.ok(usa(c))
  assert.equal(c.cuoco.mano.pronto, '🍝')
  assert.deepEqual(c.cuoco.mano.cose, ['pasta', 'sugo'], 'il piatto si dispone da sé')
  vai(c, '3,0')
  assert.ok(decidi(c).consegna)
  assert.equal(consegna(c, ['🥪']), false, 'il piatto sbagliato resta in mano')
  assert.ok(c.cuoco.mano)
  assert.ok(consegna(c, ['🍝']))
  assert.equal(c.cuoco.mano, null)
})

test('il crudo non va sul piatto e il banco tiene la roba', () => {
  const c = cucina(0)
  vai(c, '2,5'); usa(c)
  vai(c, '3,2'); assert.ok(usa(c), 'il piatto si posa sull\'isola')
  assert.ok(c.sopra['3,2'].piatto)
  vai(c, cassetta(c, 'pasta')); usa(c)
  vai(c, '3,2'); assert.equal(usa(c), false); assert.equal(c.perche, 'Prima va cotta')
})

test('l\'insalata si taglia a mani libere e con cinque colpi', () => {
  const c = cucina(1)
  assert.equal(taglia(c), false)
  vai(c, cassetta(c, 'insalata')); usa(c)
  vai(c, '5,5'); assert.equal(taglia(c), false, 'con le mani piene no')
  assert.ok(usa(c)); assert.equal(c.stazioni.tagliere.fase, 'taglia')
  for (let i = 0; i < TAGLI; i++) assert.ok(taglia(c))
  assert.equal(c.stazioni.tagliere.fase, 'pronta')
  assert.ok(usa(c)); assert.deepEqual({ ...c.cuoco.mano }, { cosa: 'insalata', fatta: true, bruciata: false })
})

test('la pizza entra col piatto ed esce pronta; il bruciato va nel bidone', () => {
  const c = cucina(3)
  c.cuoco.mano = { piatto: true, cose: ['impasto', 'sugo', 'formaggio'], pronto: '', daInfornare: true }
  vai(c, '4,0'); assert.ok(usa(c)); assert.equal(c.stazioni.forno.cosa, 'pizza'); assert.equal(c.cuoco.mano, null)
  aspetta(c, 8.1)
  assert.ok(usa(c)); assert.equal(c.cuoco.mano.pronto, '🍕')
  c.cuoco.mano = null
  vai(c, cassetta(c, 'carne')); usa(c)
  vai(c, '2,0'); usa(c)
  aspetta(c, 11)
  assert.equal(c.stazioni.padella.fase, 'scotta')
  assert.ok(usa(c)); assert.ok(c.cuoco.mano.bruciata)
  vai(c, '1,5'); assert.ok(usa(c)); assert.equal(c.cuoco.mano, null)
})

test('ogni ricetta di ogni cucina si può finire', () => {
  for (const camp of CUCINE) {
    const c = cucinaCuoco(camp)
    for (const r of c.ricette) {
      const p = { piatto: true, cose: [], pronto: '', daInfornare: false }
      c.sopra['3,2'] = p
      vai(c, '3,2')
      for (const cosa of [...r.passi].reverse()) { c.cuoco.mano = { cosa, fatta: true, bruciata: false }; assert.ok(usa(c), `${r.nome}: ${cosa}`) }
      assert.ok(c.sopra['3,2'].pronto === r.emoji || c.sopra['3,2'].daInfornare, r.nome)
      delete c.sopra['3,2']
    }
  }
})
