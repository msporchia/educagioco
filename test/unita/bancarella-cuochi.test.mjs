import { test } from 'node:test'
import assert from 'node:assert/strict'
import { vesteInForma, chiaveVeste, CHIAVE_DI_SERIE, VESTE_DI_SERIE, vociDelCuoco, valoriDellaVeste, vesteDeiValori, coloriDellaVeste, CHI, ANIMALI,
         SCHEDE_CUOCO } from '../../src/data/bancarella-cuochi.js'
import { bancoPulito } from '../../src/data/bancarella-cucine.js'
import { partitaNuova, motoreDi, mossaValida, vistaDi } from '../../src/motore/bancarella/in-due.js'

test('il cuoco si salva in una riga, e qualunque cosa torna un cuoco intero', () => {
  assert.equal(chiaveVeste(null), CHIAVE_DI_SERIE)
  assert.equal(chiaveVeste('roba.a.caso'), CHIAVE_DI_SERIE)
  const v = { ...VESTE_DI_SERIE, chi: 'cuoca', pelle: 'scura', taglio: 'trecce', capelli: 'rossi', grembiule: 'pois', stoffa: 'viola', cappello: 'bandana', colCappello: 'giallo', collo: 'papillon', colCollo: 'verde' }
  assert.deepEqual(vesteInForma(chiaveVeste(v)), v, 'la riga torna la stessa veste')
  assert.equal(vesteInForma({ chi: 'gatto' }).manto, 'bianconero', 'un animale senza manto prende il primo')
  assert.equal(vesteInForma({ chi: 'gatto', manto: 'panda' }).manto, 'bianconero', 'il manto di un altro animale non gli sta')
  assert.equal(bancoPulito({ cuoco: chiaveVeste(v) }).cuoco, chiaveVeste(v))
  assert.equal(bancoPulito({ cuoco: 42 }).cuoco, CHIAVE_DI_SERIE)
})

test('ogni scelta del foglio torna nella veste', () => {
  for (const chi of CHI) {
    const prima = chiaveVeste({ chi })
    const voci = vociDelCuoco(prima)
    for (const s of SCHEDE_CUOCO) assert.ok(voci.some(x => x.scheda === s.id), `${chi}: la scheda ${s.id} non è vuota`)
    assert.deepEqual(vesteInForma(vesteDeiValori(valoriDellaVeste(prima), prima)), vesteInForma(prima), `${chi}: avanti e indietro`)
    for (const voce of voci) for (const c of voce.colori || [{ id: null }]) for (const f of voce.forme || [{ id: null }]) {
      const dopo = vesteDeiValori({ [voce.posto]: { oggetto: voce.id, forma: f.id, colore: c.id } }, prima)
      const torna = valoriDellaVeste(dopo)[voce.posto]
      if (voce.posto !== 'chi') assert.equal(torna.oggetto, voce.id, `${chi}: ${voce.id}`)
      if (c.id) assert.equal(torna.colore, c.id, `${chi}: ${voce.id} ${c.id}`)
      if (f.id) assert.equal(torna.forma, f.id, `${chi}: ${voce.id} ${f.id}`)
      assert.ok(coloriDellaVeste(dopo), 'i colori si leggono')
    }
  }
  const gatto = vesteDeiValori({ chi: { oggetto: 'gatto' } }, chiaveVeste({ chi: 'orsetto', manto: 'panda' }))
  assert.equal(gatto.manto, ANIMALI.gatto.manti[0].id, 'cambiando animale si parte dal suo primo manto')
})

test('in due l\'altro telefono sa com\'è fatto il mio cuoco', () => {
  const m = motoreDi(partitaNuova({ seme: 3, minuti: 5, menu: 'pochi' }))
  const mia = chiaveVeste({ chi: 'coniglio', manto: 'pezzato' })
  assert.ok(mossaValida(['veste', mia]))
  assert.ok(!mossaValida(['veste', 7]))
  m.applica('ospite', ['veste', mia])
  assert.equal(vistaDi(m.S, 'host').altro.veste, mia)
  m.applica('host', ['veste', 'non.si.sa'])
  assert.equal(vistaDi(m.S, 'ospite').altro.veste, CHIAVE_DI_SERIE)
})
