/* Il carretto del vicino in 3D (C15, docs/fattoria3d/vicini.md «Il carretto»): 5 contro 1, roba con roba, mai monete e mai esperienza; serve a
   svuotare uno scomparto pieno. Senza browser. `node test/esegui.mjs fattoria3d-carretto`
   tempo: 1 */
import { cosaPuoiDare, cosaOffre, scambia, scompartiColmi, MERCI_DEL_CARRETTO, DAI, RICEVI } from '../../src/giochi/fattoria3d/motore/carretto.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

function casa(liv = 25) {
  const b = { monete: 500 }
  const m = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  m.s.esperienza = sogliaDi(liv)
  return { m, b }
}

uguale('cinque contro uno, come la 2D', [DAI, RICEVI].join(), '5,1')
controlla('il mangime non si scambia', !MERCI_DEL_CARRETTO.includes('mangime') && MERCI_DEL_CARRETTO.includes('grano') && MERCI_DEL_CARRETTO.includes('uova'))

{
  const { m, b } = casa()
  uguale('senza scorte non c\'è niente da dare', cosaPuoiDare(m).length, 0)
  m.s.merci.grano = 7
  m.s.merci.carota = 4
  const dai = cosaPuoiDare(m)
  controlla('si dà solo quello che ne ha almeno cinque', dai.length === 1 && dai[0].k === 'grano' && dai[0].quanti === 7 && !dai[0].colmo)
  controlla('si ricevono merci aperte dal livello, mai quella data', cosaOffre(m, 'grano').every(r => r.k !== 'grano') && cosaOffre(m, 'grano').some(r => r.k === 'carota'))
  uguale('per prime quelle che hai di meno', cosaOffre(m, 'grano')[0].quanti <= cosaOffre(m, 'grano').at(-1).quanti, true)
  const xp = m.s.esperienza
  const r = scambia(m, 'grano', 'carota')
  controlla('5 grano → 1 carota', r.ok && r.ricevuti === 1 && m.scortaDi('grano') === 2 && m.scortaDi('carota') === 5)
  controlla('mai monete e mai esperienza', b.monete === 500 && m.s.esperienza === xp)
  controlla('con meno di cinque si rifiuta e non cambia niente', scambia(m, 'grano', 'carota').motivo === 'poca-roba' && m.scortaDi('grano') === 2)
  controlla('una merce che non c\'è si rifiuta', scambia(m, 'unicorno', null).motivo === 'non-esiste')
}

{
  const { m } = casa()
  const max = m.capienzaDi('grano')
  m.s.merci.grano = max
  controlla('lo scomparto pieno è in oro (colmo) e per primo se ne ha di più', cosaPuoiDare(m)[0].k === 'grano' && cosaPuoiDare(m)[0].colmo)
  controlla('e il carretto lo segnala', scompartiColmi(m).includes('grano'))
  controlla('una merce con lo scomparto pieno non si riceve', !cosaOffre(m, 'carota').some(r => r.k === 'grano'))
  m.s.merci.carota = 5
  uguale('ricevere dove non c\'è posto si rifiuta e non toglie niente', [scambia(m, 'carota', 'grano').motivo, m.scortaDi('carota')].join(), 'non-ci-sta,5')
  const r = scambia(m, 'grano', null)
  controlla('il regalo svuota di cinque e basta', r.ok && r.ricevuti === 0 && m.scortaDi('grano') === max - DAI)
  controlla('e libera lo scomparto: di nuovo si raccoglie', m.spazioPer('grano') === DAI && !scompartiColmi(m).includes('grano'))
}

{
  const { m } = casa(1)
  m.s.merci.grano = 6
  controlla('una merce non ancora aperta dal livello non si offre', !cosaOffre(m, 'grano').some(r => r.k === 'melanzana'))
}

riassunto('Fattoria 3D — il carretto del vicino')
