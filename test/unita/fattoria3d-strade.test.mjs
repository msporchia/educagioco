/* Le strade della fattoria 3D, senza browser: i tipi e i bordi si aprono col livello e costano, i vicini decidono dove va il bordo
   (due strade dello stesso tipo si uniscono), il salvataggio si rilegge e una strada di prima torna quella di base.
   `node test/esegui.mjs fattoria3d-strade`
   tempo: 1 */
import { TIPI_STRADA, BORDI_STRADA, prezzoStrada, livelloStrada, aspettoDaCodice, codiceAspetto, stradeAl, TIPI, BORDI } from '../../src/giochi/fattoria3d/dati/strade.js'
import { viciniDi, caso } from '../../src/giochi/fattoria3d/dati/tessere.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

function mondo(monete = 1000) {
  const b = { monete }
  const f = new Fattoria3d({ borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  return { f, b }
}

/* ══════════ i dati ══════════ */
controlla('ogni tipo e ogni bordo ha nome, prezzo e livello', [...Object.values(TIPI_STRADA), ...Object.values(BORDI_STRADA)].every(t => t.nome && t.colore && Number.isInteger(t.prezzo) && t.liv >= 1))
controlla('il tipo di base costa quanto la strada di sempre e si apre subito', TIPI_STRADA.terra.prezzo === 1 && TIPI_STRADA.terra.liv === 1 && BORDI_STRADA.nessuno.prezzo === 0)
controlla('più si apre tardi, più costa (tipi e bordi)', [TIPI, BORDI].every((l, n) => { const t = n ? BORDI_STRADA : TIPI_STRADA; return l.every((k, q) => q === 0 || (t[k].liv >= t[l[q - 1]].liv && t[k].prezzo >= t[l[q - 1]].prezzo)) }))
controlla('la cella più cara non supera 🪙 8 (quattro minuti di esercizio ogni tre celle)', prezzoStrada('mattoni', 'sassi') <= 8)
uguale('prezzo = tipo + bordo', prezzoStrada('ghiaia', 'cordolo'), 3)
uguale('livello = il più tardo dei due', livelloStrada('ghiaia', 'sassi'), 10)
uguale('il codice va e viene', JSON.stringify(aspettoDaCodice(codiceAspetto('mattoni', 'erba'))), '{"tipo":"mattoni","bordo":"erba"}')
for (const brutto of [null, 5, 'x', 'terra', 'oro.nessuno', 'terra.oro', 'terra.nessuno.altro.x']) uguale(`il codice «${brutto}» si butta o si legge intero`, !!aspettoDaCodice(brutto), brutto === 'terra.nessuno.altro.x')
controlla('stradeAl dice cosa arriva a un livello', stradeAl(3).tipi.join() === 'ghiaia' && stradeAl(5).bordi.join() === 'cordolo' && stradeAl(1).tipi.length === 0)

/* ══════════ i vicini ══════════ */
{
  const mappa = new Map()
  const metti = (i, j, tipo) => mappa.set(`${i},${j}`, { tipo })
  const aspettoDi = (i, j) => mappa.get(`${i},${j}`) || null
  const unisce = (a, b) => a.tipo === b.tipo
  metti(0, 0, 'terra'); metti(1, 0, 'terra'); metti(0, 1, 'ghiaia')
  const v = viciniDi(aspettoDi, unisce, 0, 0)
  uguale('uno unito a est, uno diverso a sud, il resto vuoto', v.lati.join(), 'vuoto,unito,altro,vuoto')
  uguale('una cella senza niente non ha vicini', viciniDi(aspettoDi, unisce, 5, 5), null)
  // un angolo rientrante: nord e est uniti, la diagonale nord-est vuota
  metti(0, -1, 'terra')
  const w = viciniDi(aspettoDi, unisce, 0, 0)
  uguale('nord e est uniti e il nord-est vuoto: angolo rientrante', w.angoli.join(), 'true,false,false,false')
  metti(1, -1, 'terra')
  uguale('…ma con il nord-est pieno non serve', viciniDi(aspettoDi, unisce, 0, 0).angoli.join(), 'false,false,false,false')
  controlla('il caso è lo stesso a ogni chiamata e sta fra 0 e 1', caso(3, -4, 2) === caso(3, -4, 2) && caso(3, -4, 2) >= 0 && caso(3, -4, 2) < 1 && caso(3, -4, 2) !== caso(3, -4, 3))
}

/* ══════════ il motore ══════════ */
{
  const { f, b } = mondo()
  const c = [-3, 2]
  controlla('di base è terra senza bordo, 🪙 1', f.disegnaStrada(...c).ok && b.monete === 999 && f.aspettoStrada(...c).tipo === 'terra' && f.aspettoStrada(...c).bordo === 'nessuno')
  uguale('un tipo non ancora aperto no', f.disegnaStrada(-3, 3, { tipo: 'ghiaia' }).motivo, 'livello')
  uguale('…e dice a che livello', f.disegnaStrada(-3, 3, { tipo: 'mattoni' }).livello, 20)
  uguale('un tipo che non c\'è no', f.disegnaStrada(-3, 3, { tipo: 'oro' }).motivo, 'qui-no')
  f.s.esperienza = sogliaDi(20)
  const prima = b.monete
  controlla('al livello 20 i mattoni col bordo di sassi costano 🪙 8', f.disegnaStrada(-3, 3, { tipo: 'mattoni', bordo: 'sassi' }).ok && b.monete === prima - 8)
  uguale('lo stesso aspetto due volte no', f.disegnaStrada(-3, 3, { tipo: 'mattoni', bordo: 'sassi' }).motivo, 'qui-no')
  controlla('un altro aspetto sopra una strada tua la ridipinge (si paga il nuovo)', f.disegnaStrada(-3, 3, { tipo: 'ghiaia', bordo: 'cordolo' }).ok && b.monete === prima - 8 - 3 && f.aspettoStrada(-3, 3).tipo === 'ghiaia')
  uguale('quella di serie non si ridipinge', f.disegnaStrada(0, 3, { tipo: 'ghiaia' }).motivo, 'qui-no')
  controlla('la strada di serie è di base', f.aspettoStrada(0, 3).tipo === 'terra')
  // il salvataggio
  const sal = f.serializza()
  controlla('si salva solo chi non è di base', Object.keys(sal.aspettoStrade).length === 1 && Object.values(sal.aspettoStrade)[0] === 'ghiaia.cordolo' && sal.strade.length === 2)
  const g = new Fattoria3d({ stato: JSON.parse(JSON.stringify(sal)), borsa: { quante: () => 0, paga: () => true }, ora: () => 1_000_000 })
  controlla('si rilegge uguale', g.aspettoStrada(-3, 3).tipo === 'ghiaia' && g.aspettoStrada(-3, 3).bordo === 'cordolo' && g.aspettoStrada(...c).tipo === 'terra')
  // togliere
  uguale('si toglie e l\'aspetto va via', [f.togliStrada(-3, 3).ok, f.aspettoStrada(-3, 3).tipo].join(), 'true,terra')
  uguale('…e non resta nel salvataggio', Object.keys(f.serializza().aspettoStrade).length, 0)
}

/* ══════════ i salvataggi di prima ══════════ */
{
  const vecchio = { v: 10, strade: [525, 526, 600] }
  const n = normalizza(JSON.parse(JSON.stringify(vecchio)))
  uguale('uno stato di prima non ha aspetti: ogni strada è di base', JSON.stringify(n.aspettoStrade), '{}')
  controlla('le strade restano quelle', JSON.stringify(n.strade) === '[525,526,600]')
  const m = normalizza({ v: 10, strade: [525, 526], aspettoStrade: { 525: 'lastricato.erba', 526: 'oro.nessuno', 999: 'ghiaia.nessuno', x: 3 } })
  uguale('si tiene solo ciò che si capisce e che è ancora una strada', JSON.stringify(m.aspettoStrade), '{"525":"lastricato.erba"}')
  for (const rotto of [null, 5, 'x', [], { aspettoStrade: 'no', strade: [1] }, { aspettoStrade: [1, 2], strade: [1] }]) {
    let ok = true; try { normalizza(rotto) } catch { ok = false }
    controlla(`uno stato rotto (${JSON.stringify(rotto)}) non rompe`, ok)
  }
}

riassunto('strade della fattoria 3D')
