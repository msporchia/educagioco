/* ═══════════════════════════════════════════════════════════════════
   IL FILO DEL CONTADINO (docs/fattoria3d/in-comune.md, «La linea del contadino»)

   Il contadino dell'amico viaggia sul collegamento degli amici, le mosse no: se il filo muore in silenzio il contadino sparisce
   mentre le mosse arrivano. Qui due `Ponte` veri sulla presenza finta, a orologio finto, con e senza il battito svelto.
   ═══════════════════════════════════════════════════════════════════ */
import { dueContadini, CHIAVE } from '../aiuto/contadini-finti.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { spedizione, ANCORA_QUI } from '../../src/giochi/fattoria3d/contadino-amico.js'
import { BATTITO_GIOCO } from '../../src/amici/rete.js'

const piuLunga = t => Math.max(0, ...t.assenze, t.assenteDa === null ? 0 : Infinity)

/* ── un filo morto in silenzio: il guasto segnalato ── */
{
  const com = dueContadini({ inGioco: false, sparisce: 6000 })
  com.rete.buco(com.a.id); com.orologio.avanti(70000)
  controlla('al battito lento il contadino sparisce per mezzo minuto', piuLunga(com.b) > 25000, `${piuLunga(com.b)} ms`)

  for (const chi of ['a', 'b']) {
    const d = dueContadini()
    d.rete.buco(d[chi].id); d.orologio.avanti(70000)
    uguale(`a battito svelto no, chiunque dei due perda il filo (${chi})`, [...d.a.assenze, ...d.b.assenze, d.a.assenteDa, d.b.assenteDa].filter(Boolean).length, 0)
    controlla('il filo morto si è lasciato e riaperto', d[chi].cadute === 1 && d[chi].ponte.aperto && d[chi].ponte.presenti.has(CHIAVE))
  }
}

/* ── la rete che si pianta: le posizioni non si accumulano ── */
{
  const com = dueContadini({ inGioco: false })
  com.a.cammina = true; com.rete.ferma(com.a.id, 8000); com.orologio.avanti(12000)
  controlla('al battito lento arrivano tutte insieme e il servizio chiude il filo', com.rete.conta.rifiutati > 0)
  const d = dueContadini()
  d.a.cammina = true; d.rete.ferma(d.a.id, 8000); d.orologio.avanti(12000)
  uguale('a battito svelto il servizio non ha niente da chiudere', d.rete.conta.rifiutati, 0)
  uguale('e il contadino non sparisce', d.b.assenze.length + (d.b.assenteDa === null ? 0 : 1), 0)
  const e = dueContadini()
  e.a.cammina = true; e.rete.ferma(e.a.id, 3000); e.orologio.avanti(BATTITO_GIOCO.fermo + 700)
  controlla('a filo fermo non si mette in coda niente', !e.a.ponte.fresco && e.a.ponte.aperto)
  e.orologio.avanti(3000)
  controlla('e riparte da solo', e.a.ponte.fresco)
}

/* ── fuori dalla fattoria in comune il collegamento resta quieto ── */
{
  const quieti = dueContadini({ inGioco: false })
  const ping = () => { let n = 0; const m = quieti.a.ponte.manda.bind(quieti.a.ponte); quieti.a.ponte.manda = o => { if (o === '{"t":"ping"}') n++; return m(o) }; return () => n }
  const conta = ping(); quieti.orologio.avanti(60000)
  uguale('un ping ogni quindici secondi, come sempre', conta(), 4)
  const d = dueContadini()
  d.a.ponte.inGioco(false); d.rete.buco(d.a.id); d.orologio.avanti(20000)
  controlla('uscendo dal gioco si torna al battito lento', d.a.ponte.aperto)
}

/* ── chi non è partito riprova ── */
{
  let t = 5000, passa = true; const partiti = []
  const s = spedizione(m => { if (passa) partiti.push(m); return passa }, () => t)
  const m = { k: 'qui', x: 1 }, abito = { cappello: 'paglia' }
  s(m, abito)
  controlla('la prima porta l\'abito', partiti[0]?.a?.cappello === 'paglia')
  t += 200; s(m, abito)
  uguale('da fermo non si ripete', partiti.length, 1)
  t += ANCORA_QUI; s(m, abito)
  uguale('ma dopo un po\' sì, con l\'abito', partiti.length, 2)
  passa = false; t += 200; s({ k: 'qui', x: 2 }, abito)
  passa = true; t += 200; s({ k: 'qui', x: 2 }, abito)
  controlla('una posizione che non è partita riparte al giro dopo', partiti.length === 3 && partiti[2].x === 2)
  controlla('e il messaggio di chi chiama non cambia', m.a === undefined)
}

riassunto('il filo del contadino')
