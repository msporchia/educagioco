/* ═══════════════════════════════════════════════════════════════════
   GLI ADDOBBI DELLE BESTIE NELLA FATTORIA 3D (docs/fattoria3d/addobbi.md)

   Gli stessi dodici della 2D (prezzi, agganci, la campanella ai gatti,
   il cappello da strega a Halloween), tutti in vendita; si comprano una
   volta e non si consumano, un aggancio tiene una cosa sola; il cassetto
   e quello che porta ogni bestia si salvano; la conversione dalla 2D li
   porta; ogni addobbo ha un modello e ogni corpo i suoi agganci.

   `node test/esegui.mjs fattoria3d-addobbi --niente-build`
   tempo: 1
   ═══════════════════════════════════════════════════════════════════ */
import { ADDOBBI, PER_ID, staA, addobbiPer, guastiDegliAddobbi3d, cassettoInForma } from '../../src/giochi/fattoria3d/dati/addobbi.js'
import { ADDOBBI as ADDOBBI_2D } from '../../src/giochi/fattoria/dati/addobbi.js'
import { ADDOBBI_DISEGNATI, AGGANCI } from '../../src/giochi/fattoria3d/scena3d/modelli-addobbi.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { statoIniziale, normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { statoDa2D, ritoccaLaConversione, MIGRAZIONE } from '../../src/giochi/fattoria3d/motore/migra.js'
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ORA = 1_000_000_000_000
const motoreCon = ({ liv = 70, monete = 1000, stato = null } = {}) => {
  const b = { monete }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => ORA, rnd: () => 0.5 })
  f.s.esperienza = Math.max(f.s.esperienza, sogliaDi(liv))
  return { f, b }
}

// ── i dati: quelli della 2D, tutti in vendita, ognuno disegnato ──
{
  const g = guastiDegliAddobbi3d()
  controlla('i dati degli addobbi non hanno guasti', !g.length, g.join(' · '))
  uguale('gli stessi della 2D, con gli stessi prezzi e agganci', ADDOBBI.map(a => `${a.id}:${a.prezzo}:${a.dove}`).join(), ADDOBBI_2D.map(a => `${a.id}:${a.prezzo}:${a.dove}`).join())
  uguale('ognuno ha il suo modello', ADDOBBI_DISEGNATI.slice().sort().join(), ADDOBBI.map(a => a.id).sort().join())
  for (const [forma, tab] of Object.entries(AGGANCI)) {
    const attesi = forma === 'pappagallo' ? ['testa', 'muso', 'collo'] : ['testa', 'muso', 'collo', 'schiena']
    uguale(`${forma}: un punto per ogni aggancio che porta`, Object.keys(tab).join(), attesi.join())
    controlla(`${forma}: ogni punto sta su un perno, con una scala`, Object.values(tab).every(a => ['testa', 'corpo'].includes(a[0]) && a[4] > 0))
  }
  controlla('la campanella è dei gatti', staA('campanella', 'sherlock') && staA('campanella', 'gatto_rosso') && !staA('campanella', 'watson') && !staA('campanella', 'coniglio'))
  controlla('il pappagallo non porta niente sulla schiena', !staA('zainetto', 'pappagallo') && !staA('mantellina', 'pappagallo') && staA('cilindro', 'pappagallo'))
  controlla('a chi non si cura non sta niente', !staA('fiore', 'drago'))
  controlla('il cappello da strega si vede solo a Halloween', !addobbiPer('watson').some(a => a.id === 'cappello_strega') && addobbiPer('watson', { stagione: 'halloween' })[0].id === 'cappello_strega')
  controlla('…o se ce l\'hai già', addobbiPer('watson', { tieni: ['cappello_strega'] }).some(a => a.id === 'cappello_strega'))
  uguale('il cassetto letto da un salvataggio guasto tiene solo i buoni', JSON.stringify(cassettoInForma({ fiore: 2, drago: 1, corona: -1, cilindro: 'x' })), '{"fiore":2}')
}

// ── il motore: comprare è mettere, un aggancio tiene una cosa, togliere rimette nel cassetto ──
{
  const { f, b } = motoreCon({ liv: 20, monete: 100 })
  uguale('una bestia che non hai', f.cura.vesti('beagle', 'fiore').motivo, 'non-e-tua')
  const r = f.cura.vesti('watson', 'cilindro')
  controlla('Watson mette il cilindro, e lo paga', r.ok && r.costo === PER_ID.cilindro.prezzo && b.monete === 100 - PER_ID.cilindro.prezzo, JSON.stringify(r))
  uguale('lo porta', f.cura.addossoA('watson').testa, 'cilindro')
  uguale('rimetterlo non lo ricompra', f.cura.vesti('watson', 'cilindro').motivo, 'gia-addosso')
  const m0 = b.monete, r2 = f.cura.vesti('watson', 'corona')
  controlla('la corona cambia il cilindro, che torna nel cassetto', r2.ok && r2.tolto === 'cilindro' && f.cura.quantiNelCassetto('cilindro') === 1 && b.monete === m0 - PER_ID.corona.prezzo)
  const r3 = f.cura.vesti('sherlock', 'cilindro')
  controlla('il cilindro nel cassetto va a Sherlock gratis', r3.ok && r3.costo === 0 && f.cura.quantiNelCassetto('cilindro') === 0)
  uguale('al cane niente campanella', f.cura.vesti('watson', 'campanella').motivo, 'non-gli-sta')
  uguale('fuori stagione il cappello da strega non si compra', f.cura.vesti('watson', 'cappello_strega').motivo, 'fuori-stagione')
  controlla('a Halloween sì', f.cura.vesti('watson', 'cappello_strega', { stagione: 'halloween' }).ok)
  const t = f.cura.spoglia('watson', 'testa')
  controlla('togliere è gratis e rimette nel cassetto', t.ok && t.costo === 0 && f.cura.quantiNelCassetto('cappello_strega') === 1)
  uguale('…e passata la festa lo rimetti, perché è tuo', f.cura.vesti('watson', 'cappello_strega').ok, true)
  uguale('niente da togliere', f.cura.spoglia('watson', 'schiena').motivo, 'non-lo-porta')
  const povero = motoreCon({ liv: 20, monete: 3 })
  uguale('senza monete dice quante servono', povero.f.cura.vesti('watson', 'zainetto').costo, PER_ID.zainetto.prezzo)
  const v = f.cura.vestiarioDi('watson')
  controlla('il vestiario dice cosa porta e cosa hai', v.find(a => a.id === 'cappello_strega').addosso && v.find(a => a.id === 'corona').hai === 1)
  const letto = normalizza(JSON.parse(JSON.stringify(f.s)))
  uguale('quello che porta si salva', JSON.stringify(letto.casa.watson.addobbi), '{"testa":"cappello_strega"}')
  uguale('il cassetto si salva', JSON.stringify(letto.addobbi), '{"corona":1}')
  uguale('uno stato di prima ha il cassetto vuoto', JSON.stringify(normalizza({ v: 10 }).addobbi), '{}')
  uguale('un addobbo sull\'aggancio sbagliato si butta', JSON.stringify(normalizza({ ...statoIniziale(), casa: { watson: { addobbi: { muso: 'corona', testa: 'fiore' } } } }).casa.watson.addobbi), '{"testa":"fiore"}')
}

// ── la conversione dalla 2D: il guardaroba è il cassetto, quello che le bestie portano lo portano ancora ──
{
  const f = new Fattoria()
  f.speso = 300
  f.guardaroba = { cilindro: 1, fiocco: 2 }
  f.bestie.push({ chi: 'cane-beagle', nome: 'Birba', x: 10, y: 10, addobbi: { testa: 'corona', muso: 'occhiali' } })
  f.bestie.push({ chi: 'pappagallo', nome: 'Coco', x: 11, y: 10, addobbi: { testa: 'fiore' } })
  f.bestie.push({ chi: 'gatto-tuxedo', nome: 'Ombra', x: 12, y: 10, addobbi: { collo: 'campanella' } })
  f.reclamati = {}
  const s = statoDa2D(JSON.parse(JSON.stringify(f.serializza())), { ora: ORA })
  uguale('il guardaroba diventa il cassetto', JSON.stringify(s.addobbi), '{"cilindro":1,"fiocco":2}')
  uguale('il beagle porta ancora corona e occhiali', JSON.stringify(s.casa.beagle.addobbi), '{"testa":"corona","muso":"occhiali"}')
  uguale('il pappagallo il fiore', JSON.stringify(s.casa.pappagallo.addobbi), '{"testa":"fiore"}')
  uguale('Sherlock (il gatto bianco e nero) la campanella', JSON.stringify(s.casa.sherlock.addobbi), '{"collo":"campanella"}')
  controlla('nessun addobbo è più «da regalare»', !Object.keys(s.daRegalare).some(k => k.startsWith('addobbo:')), JSON.stringify(s.daRegalare))
  const vecchio = { ...s, migrato: 2, addobbi: {}, daRegalare: { 'addobbo:zainetto': 2, 'scorta:tartufi': 1 } }
  const r = ritoccaLaConversione(vecchio, f.serializza(), { ora: ORA })
  uguale('chi era convertito prima riceve gli addobbi che aspettavano', r.addobbi.zainetto, 2)
  uguale('…e resta da regalare il resto', JSON.stringify(r.daRegalare), '{"scorta:tartufi":1}')
  uguale('con la conversione nuova', r.migrato, MIGRAZIONE)
}

riassunto('fattoria3d-addobbi')
