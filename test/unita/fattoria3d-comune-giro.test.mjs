/* Il contadino nello stesso giro delle mosse (docs/fattoria3d/in-comune.md, «I due contadini»): due `Sessione` vere davanti alle
   regole vere del servizio, con una fetch finta che si può spegnere. Una mossa persa si rimanda, una posizione no; chi riceve tiene
   l'ultima; la fila non si riempie e la fotografia parte lo stesso.
   `node test/esegui.mjs fattoria3d-comune-giro`
   tempo: 2 */
import { Sessione } from '../../src/giochi/fattoria3d/comune.js'
import { Strada, quiInForma, MAX_PUNTI, SPARISCE } from '../../src/giochi/fattoria3d/contadino-amico.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { registra } from '../../src/giochi/fattoria3d/motore/registro.js'
import { leggiRichiesta, usa, MAX_MOSSE } from '../../servizio/inoltro/src/comune.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const CHIAVE = 'k'.repeat(32), ABITO = { persona: 'contadina', cappello: 'paglia' }
let tempo = 1_000_000
const ora = () => tempo
function servizio() {
  const s = { stato: undefined, rifiutate: 0, spento: new Set() }
  s.fetchImpl = id => async (_, { body }) => {
    if (s.spento.has(id)) throw new Error('niente rete')
    const l = leggiRichiesta(JSON.parse(body))
    if (!l.ok) { s.rifiutate++; return { status: 400, ok: false, json: async () => l } }
    const r = usa(s.stato, l); s.stato = r.stato
    const d = r.risposta
    return { status: 200, ok: true, json: async () => ({ ...d, foto: d.foto ? { seq: d.foto.seq, stato: JSON.parse(d.foto.testo) } : null, mosse: d.mosse.map(x => ({ ...x, m: JSON.parse(x.m) })) }) }
  }
  return s
}
function telefono(s, id, corsia) {
  const motore = new Fattoria3d({ stato: null, borsa: { quante: () => 1e6, paga: () => true }, ora })
  const t = new Sessione({ chiave: CHIAVE, mio: id, motore, seq: 0, corsia, ora, opzioni: { servizio: 'https://finto', fetchImpl: s.fetchImpl(id) } })
  t.strada = new Strada(); t.visti = []
  t.mioQui = () => t.strada.prendi(ABITO)
  t.alQui = m => t.visti.push(m)
  return t
}
const cammina = (t, x, z = 0) => t.strada.segna({ x, z, d: 1 })
const posto = m => { for (let j = -3; j < 8; j++) for (let i = -6; i < 6; i++) if (m.puoMettere('campo', i, j).ok) return [i, j] }

/* ── la strada ── */
{
  const s = new Strada()
  uguale('prima di sapere dove si è, niente', s.prendi(ABITO), null)
  s.segna({ x: 1.04, z: 2, d: 0.5 }); s.segna({ x: 1.01, z: 2, d: 0.5 }); s.segna({ x: 3, z: 2, d: 0.5, r: true, g: 'falcia' })
  const m = s.prendi(ABITO)
  controlla('la strada del giro, senza ripetere un punto, con la corsa, il gesto e l\'abito', m.p.length === 2 && m.r && m.g === 'falcia' && m.a.cappello === 'paglia')
  const n = s.prendi(ABITO)
  controlla('il giro dopo riparte da dove era, senza abito, e il gesto è finito', n.p.length === 1 && n.p[0][0] === 3 && !n.a && !n.g && !n.r)
  for (let i = 0; i < 30; i++) s.segna({ x: i, z: 0, d: 0 })
  const l = s.prendi(ABITO)
  controlla('un giro lungo tiene gli ultimi punti, ma ci sta', l.p.length === MAX_PUNTI && l.p.at(-1)[0] === 29 && JSON.stringify(l).length < 1024)
  const q = quiInForma({ k: 'qui', p: [[1, 2]], d: 0, g: 'balla', a: { cappello: '<b>' } })
  controlla('un gesto che non c\'è diventa «niente», un capo con simboli si toglie', q.g === null && q.a === null)
  controlla('una strada storta non passa', quiInForma({ k: 'qui', p: [[1e9, 0]], d: 0 }) === null && quiInForma({ k: 'qui', p: [], d: 0 }) === null && quiInForma({ k: 'qui', p: 'x', d: 0 }) === null)
  controlla('una mossa non è un contadino', quiInForma({ n: 'semina', a: [] }) === null && quiInForma({ k: 'via' })?.k === 'via')
}

/* ── nello stesso giro ── */
{
  const s = servizio(), a = telefono(s, 'lorenzo01', 0), b = telefono(s, 'marta0001', 1)
  cammina(a, 1); await a.giro(); cammina(b, 5); await b.giro()
  controlla('il contadino arriva col giro', b.visti.at(-1)?.p.at(-1)[0] === 1)
  cammina(a, 2); await a.giro(); cammina(a, 3); await a.giro(); await b.giro()
  uguale('di tante posizioni arrivate insieme si tiene solo l\'ultima', b.visti.length, 2)
  uguale('ed è la più nuova', b.visti.at(-1).p.at(-1)[0], 3)

  /* una mossa e una posizione nel giro che si perde */
  const fine = registra(a.motore, m => a.coda.push(m), { corsia: 0 })
  const [i, j] = posto(a.motore)
  a.motore.compraEMetti('campo', i, j); fine()
  s.spento.add('lorenzo01')
  cammina(a, 4); await a.giro()
  s.spento.delete('lorenzo01')
  uguale('senza rete la mossa aspetta', a.coda.length, 1)
  cammina(a, 6); await a.giro(); await b.giro()
  controlla('e arriva al giro dopo', !!b.motore.cosaSu(i, j))
  uguale('la posizione persa no: arriva la più nuova', b.visti.at(-1).p.at(-1)[0], 6)
  uguale('in fila niente doppioni di mosse', s.stato.mosse.filter(x => JSON.parse(x.m).n === 'compraEMetti').length, 1)

  /* mosse a raffica: il contadino non fa sforare il tetto del servizio */
  for (let n = 0; n < 30; n++) a.coda.push({ n: 'semina', a: [0, 'grano'], f: {} })
  await a.giro(); await a.giro()
  uguale('venti per richiesta, contadino compreso: niente rifiutato', s.rifiutate, 0)
  controlla('e il tetto è quello', MAX_MOSSE === 20)

  /* uscendo */
  await b.giro(); await a.chiudi(); await b.giro()
  uguale('chi esce lo dice nell\'ultimo giro', b.visti.at(-1).k, 'via')
}

/* ── la fila non si riempie ── */
{
  const s = servizio(), a = telefono(s, 'lorenzo01', 0)
  for (let n = 0; n < 100; n++) { cammina(a, n); await a.giro(); tempo += 3000 }
  const posizioni = s.stato.mosse.filter(x => JSON.parse(x.m).k === 'qui').length
  controlla('da solo si dice di esserci ogni tanto, non a ogni giro', posizioni > 5 && posizioni < 25, `${posizioni} su 100 giri`)
  const b = telefono(s, 'marta0001', 1)
  cammina(b, 1); await b.giro(); await a.giro()
  const prima = a.detto
  tempo += 3000; cammina(a, 200); await a.giro()
  controlla('arrivato l\'amico, a ogni giro', a.detto > prima)
  tempo += SPARISCE + 1; await a.giro()
  const dopo = a.detto; tempo += 3000; await a.giro()
  uguale('sparito l\'amico, si torna a farlo ogni tanto', a.detto, dopo)
}

/* ── la fotografia parte anche se il contadino cammina, e per una posizione non letta l'amico non si riapre ── */
{
  const s = servizio(), a = telefono(s, 'lorenzo01', 0), b = telefono(s, 'marta0001', 1)
  let riaperto = false
  b.alCambio = c => { riaperto ||= c.ricarica }
  cammina(a, 1); await a.giro(); cammina(b, 1); await b.giro(); await a.giro()
  cammina(a, 2); await a.giro()
  cammina(a, 3); await a.giro({ foto: true })
  controlla('una posizione nel giro non ferma la fotografia', !!s.stato.foto)
  await b.giro()
  controlla('l\'amico indietro di sole posizioni non riparte dalla fotografia', !riaperto && b.visti.at(-1)?.p.at(-1)[0] === 3)
}

riassunto('il contadino nello stesso giro delle mosse')
