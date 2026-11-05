import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CUCINE } from '../../src/data/bancarella.js'
import { cucinaNuova, passo, usa, tocca, vaiA, arriva, consegna, passiRicetta, TAGLI, FILA_MAX } from '../../src/motore/bancarella/cucina.js'
import { RICETTE, INGREDIENTI, ATTREZZI, attrezziDi, cucinaPulita, compraAttrezzo } from '../../src/data/bancarella-cucine.js'
import { bancoPulito } from '../../src/data/bancarella-banco.js'

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
// le prove di mossa stanno nella cucina con tutto, a piatti che non finiscono
const cucina = () => cucinaNuova({ ...CUCINE.at(-1), piatti: 0 })
const aspetta = (c, s) => { for (let t = 0; t < s; t += 0.05) passo(c, 0.05) }
const cella = (c, f) => c.celle.find(f).id
const cassetta = (c, cosa) => cella(c, k => k.cosa === cosa)

test('la stanza ha solo quello che serve alla cucina', () => {
  const c = cucinaNuova(CUCINE[0])
  assert.deepEqual(Object.keys(c.stazioni), ['tagliere'], 'la prima è a crudo: niente fuochi')
  assert.ok(!c.celle.some(k => k.nome === 'forno'))
  assert.ok(!c.celle.some(k => k.cosa === 'impasto'))
  assert.ok(!c.celle.some(k => k.tipo === 'lavello'), 'prima dei piatti sporchi il lavello non c\'è')
  assert.equal(c.celle.filter(k => k.tipo === 'consegna').length, 1)
})

test('il cuoco gira attorno ai banconi e si ferma davanti al posto toccato', () => {
  const c = cucina()
  const solido = (x, z) => c.celle.some(k => k.x === Math.floor(x) && k.z === Math.floor(z))
  tocca(c, '3,0')
  for (let i = 0; i < 200 && !c.arrivato; i++) { passo(c, 0.05); assert.ok(!solido(c.cuoco.x, c.cuoco.z), `sul pavimento: ${c.cuoco.x},${c.cuoco.z}`) }
  assert.equal(c.arrivato, '3,0')
  assert.deepEqual([c.cuoco.x, c.cuoco.z], [3.5, 1.5])
  assert.ok(Math.abs(Math.abs(c.cuoco.verso) - Math.PI) < 1e-6, 'guarda il posto')
})

test('si arriva anche agli angoli', () => {
  const c = cucina()
  for (const id of ['0,0', '6,0', '0,8', '6,8']) vai(c, id)
})

test('i tocchi si mettono in fila, il pavimento li butta', () => {
  const c = cucina()
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
  const c = cucina()
  assert.ok(fa(c, cassetta(c, 'pasta'))); assert.equal(c.cuoco.mano.cosa, 'pasta')
  assert.ok(fa(c, '1,0')); assert.equal(c.stazioni.pentola.fase, 'cuoce'); assert.equal(c.cuoco.mano, null)
  assert.ok(fa(c, '2,8')); assert.ok(c.cuoco.mano.piatto)
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
  const c = cucina()
  fa(c, '2,8')
  assert.ok(fa(c, '3,3'), 'il piatto si posa sull\'isola')
  assert.ok(c.sopra['3,3'].piatto)
  fa(c, cassetta(c, 'pasta'))
  assert.equal(fa(c, '3,3'), false); assert.equal(c.perche, 'Prima si cuoce')
  c.cuoco.mano = null
  fa(c, cassetta(c, 'sugo'))
  assert.ok(fa(c, '3,3'), 'quello che ho in mano va sul piatto')
  assert.equal(c.cuoco.mano, null)
  assert.deepEqual(c.sopra['3,3'].cose, ['sugo'])
  assert.ok(fa(c, '3,3'), 'a mani vuote il piatto si prende')
  assert.ok(c.cuoco.mano.piatto)
  assert.equal(c.sopra['3,3'], undefined)
})

test('due cose della stessa ricetta si uniscono anche senza piatto', () => {
  const c = cucina()
  fa(c, cassetta(c, 'impasto'))
  assert.ok(fa(c, cassetta(c, 'sugo')), 'con l\'impasto in mano, sul sugo')
  assert.ok(c.cuoco.mano.piatto)
  assert.deepEqual(c.cuoco.mano.cose, ['impasto', 'sugo'])
  assert.equal(fa(c, cassetta(c, 'formaggio')), false)
  assert.equal(c.perche, 'Prima si taglia')
  c.stazioni.tagliere = { fase: 'pronta', t: 0, cosa: 'formaggio', colpi: TAGLI }
  assert.ok(fa(c, '5,8'), 'il formaggio tagliato va sul piatto')
  assert.ok(c.cuoco.mano.daInfornare)
  assert.ok(fa(c, '4,0'), 'e va in forno')

  const b = cucina()                 // sul bancone: il piatto resta lì
  fa(b, cassetta(b, 'pane')); fa(b, '3,3')
  fa(b, cassetta(b, 'insalata'))
  assert.equal(fa(b, '3,3'), false); assert.equal(b.perche, 'Prima si taglia')
  b.cuoco.mano = { cosa: 'insalata', fatta: true, bruciata: false }
  assert.ok(fa(b, '3,3'))
  assert.equal(b.cuoco.mano, null)
  assert.deepEqual(b.sopra['3,3'].cose, ['pane', 'insalata'])

  const s = cucina()                 // dal fuoco: la carne pronta va col pane in mano
  fa(s, cassetta(s, 'carne')); fa(s, '2,0'); aspetta(s, 5.1)
  fa(s, cassetta(s, 'pane'))
  assert.ok(fa(s, '2,0'))
  assert.deepEqual(s.cuoco.mano.cose, ['pane', 'carne'])
  assert.equal(s.stazioni.padella.fase, 'vuota')

  const n = cucina()                 // quello che non sta in nessuna ricetta resta in mano
  fa(n, cassetta(n, 'sugo'))
  assert.equal(fa(n, cassetta(n, 'riso')), false)
  assert.equal(n.perche, 'Questi due non vanno insieme')
  assert.equal(n.cuoco.mano.cosa, 'sugo')
})

test('il tagliere: un tocco, e il cuoco taglia fino alla fine', () => {
  const c = cucina()
  fa(c, cassetta(c, 'insalata'))
  assert.ok(fa(c, '5,8')); assert.equal(c.stazioni.tagliere.fase, 'taglia')
  assert.ok(c.tagliando, 'comincia da solo')
  tocca(c, '5,8')
  aspetta(c, 0.7)
  assert.equal(c.fila.length, 1, 'la fila aspetta che abbia finito')
  assert.ok(c.stazioni.tagliere.colpi > 0 && c.stazioni.tagliere.colpi < TAGLI)
  aspetta(c, 1)
  assert.equal(c.stazioni.tagliere.fase, 'pronta')
  assert.equal(c.tagliando, '')
  assert.ok(usa(c, vai2(c)), 'il tocco di prima prende l\'insalata')
  assert.deepEqual({ ...c.cuoco.mano }, { cosa: 'insalata', fatta: true, bruciata: false })
})

test('chi lascia a metà riprende con un tocco; con le mani piene no', () => {
  const c = cucina()
  fa(c, cassetta(c, 'insalata')); fa(c, '5,8')
  aspetta(c, 0.7)
  const colpi = c.stazioni.tagliere.colpi
  assert.ok(vaiA(c, 3, 4))
  assert.equal(c.tagliando, '')
  aspetta(c, 2)
  assert.equal(c.stazioni.tagliere.colpi, colpi, 'senza il cuoco non si taglia')
  fa(c, cassetta(c, 'pane'))
  assert.equal(fa(c, '5,8'), false)
  assert.equal(c.perche, 'Per tagliare servono le mani libere')
  c.cuoco.mano = null
  assert.ok(fa(c, '5,8'))
  aspetta(c, 1.5)
  assert.equal(c.stazioni.tagliere.fase, 'pronta')
})

test('l\'insalata: si tagliano tutte e due, si uniscono e si serve', () => {
  const c = cucina()
  fa(c, cassetta(c, 'insalata')); fa(c, '5,8'); aspetta(c, 1.6)
  fa(c, '5,8'); fa(c, '3,3')
  fa(c, cassetta(c, 'formaggio')); fa(c, '5,8'); aspetta(c, 1.6)
  assert.equal(c.stazioni.tagliere.cosa, 'formaggio')
  fa(c, '5,8')
  assert.deepEqual({ ...c.cuoco.mano }, { cosa: 'formaggio', fatta: true, bruciata: false })
  assert.ok(fa(c, '3,3'), 'il formaggio tagliato sull\'insalata tagliata')
  assert.equal(c.sopra['3,3'].pronto, '🥗')
})

test('la pizza entra col piatto ed esce pronta; il bruciato va nel bidone', () => {
  const c = cucina()
  c.cuoco.mano = { piatto: true, cose: ['impasto', 'sugo', 'formaggio'], pronto: '', daInfornare: true, forno: '🍕' }
  assert.ok(fa(c, '4,0')); assert.equal(c.stazioni.forno.cosa, 'pizza'); assert.equal(c.cuoco.mano, null)
  aspetta(c, 8.1)
  assert.ok(fa(c, '4,0')); assert.equal(c.cuoco.mano.pronto, '🍕')
  c.cuoco.mano = null
  fa(c, cassetta(c, 'carne'))
  fa(c, '2,0')
  aspetta(c, 49)
  assert.equal(c.stazioni.padella.fase, 'pronta', 'a bruciare ci si deve impegnare')
  aspetta(c, 2)
  assert.equal(c.stazioni.padella.fase, 'scotta')
  assert.ok(fa(c, '2,0')); assert.ok(c.cuoco.mano.bruciata)
  assert.ok(fa(c, '1,8')); assert.equal(c.cuoco.mano, null)
})

test('il ricettario dice dove passa ogni cosa', () => {
  const pizza = RICETTE.find(r => r.emoji === '🍕')
  assert.deepEqual(passiRicetta(pizza).map(p => [p.nome, p.come]), [
    ['impasto', 'va dritto sul piatto'], ['sugo', 'va dritto sul piatto'], ['formaggio', 'si taglia sul tagliere'],
    ['forno', 'tutto insieme sul piatto, poi in forno'],
  ])
})

test('il piatto pronto cresce: dalla pasta alla pasta col formaggio', () => {
  const c = cucina()
  c.sopra['3,3'] = { piatto: true, cose: ['pasta', 'sugo'], pronto: '🍝', daInfornare: false, forno: '' }
  c.cuoco.mano = { cosa: 'formaggio', fatta: true, bruciata: false }
  assert.ok(fa(c, '3,3'))
  assert.equal(c.sopra['3,3'].pronto, '🍝🧀')
})

test('i piatti: finiscono, tornano sporchi, si lavano con un tocco', () => {
  const c = cucinaNuova({ ...CUCINE.at(-1), piatti: 2 })
  const conta = () => c.puliti + c.sporchi + c.ritorni.length + (c.cuoco.mano?.piatto ? 1 : 0) + Object.values(c.sopra).filter(o => o.piatto).length
  assert.ok(fa(c, '2,8')); assert.equal(c.puliti, 1)
  c.cuoco.mano = { ...c.cuoco.mano, cose: ['pane', 'formaggio'], pronto: '🥪' }
  assert.ok(consegna(c, ['🥪']))
  assert.equal(conta(), 2)
  c.ritorni = [1000]                  // torna quando lo diciamo noi: il cuoco qui cammina parecchio
  assert.equal(c.ritorni.length, 1)
  fa(c, '2,8'); fa(c, '3,3')
  assert.equal(c.puliti, 0)
  assert.equal(fa(c, '2,8'), false)
  assert.equal(c.perche, 'Non ci sono piatti puliti: lavali')
  fa(c, cassetta(c, 'pane')); c.cuoco.mano = null
  fa(c, cassetta(c, 'riso'))
  fa(c, cassetta(c, 'alga'))
  assert.equal(c.perche, 'Non ci sono piatti puliti: lavali', 'unire vuole un piatto')
  c.cuoco.mano = null
  assert.equal(fa(c, '3,8'), false, 'il lavello è vuoto finché il piatto è in giro')
  c.ritorni = [0.1]
  aspetta(c, 0.2)
  assert.equal(c.sporchi, 1)
  assert.ok(fa(c, '3,8'))
  assert.ok(c.lavando)
  aspetta(c, 1.6)
  assert.equal(c.lavando, false)
  assert.equal(c.puliti, 1); assert.equal(c.sporchi, 0)
  assert.equal(conta(), 2)
})

test('il piatto nel bidone torna nel lavello', () => {
  const c = cucinaNuova({ ...CUCINE.at(-1), piatti: 2 })
  fa(c, '2,8'); fa(c, '1,8')
  assert.equal(c.sporchi, 1)
  assert.equal(c.puliti, 1)
})

test('gli attrezzi comprati stanno nella stanza', () => {
  const c = cucinaNuova(CUCINE.at(-1), { pentola: 1, forno: 1, padella: 1, tagliere: 1, piatti: 2 })
  assert.deepEqual(Object.keys(c.stazioni).sort(), ['forno', 'forno:2', 'padella', 'padella:2', 'pentola', 'pentola:2', 'tagliere', 'tagliere:2'])
  assert.equal(c.puliti, CUCINE.at(-1).piatti + 2)
  for (const n of Object.keys(c.stazioni)) assert.ok(c.celle.some(k => k.nome === n), `${n} ha il suo posto`)
  fa(c, cassetta(c, 'pasta')); fa(c, '1,0')
  fa(c, cassetta(c, 'pasta')); assert.ok(fa(c, '5,0'), 'due pentole insieme')
  aspetta(c, 7.1)
  assert.equal(c.stazioni['pentola:2'].fase, 'pronta')
  fa(c, cassetta(c, 'pesce')); assert.ok(fa(c, '4,8'), 'il secondo tagliere')
  aspetta(c, 1.6)
  assert.equal(c.stazioni['tagliere:2'].fase, 'pronta')
  c.cuoco.mano = { piatto: true, cose: ['impasto', 'sugo', 'formaggio'], pronto: '', daInfornare: true, forno: '🍕' }
  assert.ok(fa(c, '6,7'), 'il secondo forno')
  assert.equal(c.stazioni['forno:2'].cosa, 'pizza')
})

test('si comprano col banco, e il banco li ricorda', () => {
  const a = ATTREZZI.find(x => x.che === 'tagliere')
  const b = bancoPulito({ cassa: a.prezzo + 100, cucina: { fatte: 3 } })
  assert.deepEqual(bancoPulito(b).cucina, b.cucina)
  const dopo = compraAttrezzo(b, 'tagliere')
  assert.equal(dopo.cassa, 100); assert.equal(dopo.cucina.tagliere, 1)
  assert.equal(compraAttrezzo(dopo, 'tagliere'), null, 'uno solo in più')
  assert.equal(compraAttrezzo({ ...b, cassa: 0 }, 'tagliere'), null, 'la cassa non va sotto zero')
  assert.equal(compraAttrezzo({ ...b, cassa: 100000 }, 'forno'), null, 'prima di arrivarci non si vede')
  assert.equal(cucinaPulita({ fatte: 999, piatti: 99 }).fatte, CUCINE.length)
})

test('i livelli: tanti, a crudo i primi, ogni ricetta ha i suoi attrezzi', () => {
  assert.ok(CUCINE.length >= 24)
  for (const c of CUCINE.slice(0, 6)) assert.ok(!attrezziDi(c).some(t => t !== 'tagliere'), `${c.nome} è a crudo`)
  assert.equal(new Set(CUCINE.map(c => c.id)).size, CUCINE.length)
  for (const c of CUCINE) {
    const k = cucinaNuova(c)
    assert.equal(k.ricette.length, c.ricette.length, c.nome)
    assert.ok(c.ricette.includes(c.foto) || RICETTE.some(r => r.emoji === c.foto), `${c.nome}: la foto è di un piatto`)
    assert.ok(k.ricette.every(r => r.prezzo <= c.tetto), c.nome)
    for (const cosa of new Set(k.ricette.flatMap(r => r.passi))) assert.ok(k.celle.some(q => q.cosa === cosa), `${c.nome}: la cassetta di ${cosa}`)
  }
  const usati = new Set(CUCINE.flatMap(c => c.ricette))
  for (const r of RICETTE) assert.ok(usati.has(r.emoji), `${r.nome} sta in qualche cucina`)
  assert.ok(Object.values(INGREDIENTI).every(i => !i.cuoce || i.tiene >= 40))
})

test('ogni ricetta di ogni cucina si può finire', () => {
  for (const camp of CUCINE) {
    const c = cucinaNuova({ ...camp, piatti: 0 })
    const isola = c.celle.find(k => k.id === '3,3')
    for (const r of c.ricette) {
      c.sopra['3,3'] = { piatto: true, cose: [], pronto: '', daInfornare: false }
      for (const cosa of [...r.passi].reverse()) { c.cuoco.mano = { cosa, fatta: true, bruciata: false }; assert.ok(usa(c, isola), `${r.nome}: ${cosa}`) }
      assert.ok(c.sopra['3,3'].pronto === r.emoji || c.sopra['3,3'].forno === r.emoji, r.nome)
      delete c.sopra['3,3']
    }
  }
})
