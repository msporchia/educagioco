/* Il filo fra due telefoni (src/insieme/rete.js, docs/core/insieme.md) e il tavolo del servizio (servizio/inoltro/src/tavolo.js),
   su una rete finta e cattiva con l'orologio finto (test/aiuto/rete-finta.mjs): i messaggi arrivano tutti, una volta sola e in
   ordine anche quando il filo cade, muore in silenzio o si pianta; chi cade riprende il suo posto; chi se ne va lo si sa. */
import { Canale, PEZZO } from '../../src/insieme/rete.js'
import * as tavolo from '../../servizio/inoltro/src/tavolo.js'
import { caso } from '../../src/giochi/arena/motore/banco.js'
import { orologioFinto, reteFinta } from '../aiuto/rete-finta.mjs'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const POSTO_A = 'aaaaaaaaaaaaaaaaaaaa', POSTO_B = 'bbbbbbbbbbbbbbbbbbbb'

function due({ seme = 1, min = 40, max = 160 } = {}) {
  const orologio = orologioFinto()
  const rete = reteFinta({ orologio, rnd: caso(seme), min, max })
  const codice = rete.nuovo(POSTO_A)
  const telefono = posto => {
    const t = { arrivati: [], cambi: 0 }
    t.c = new Canale(codice, { posto, servizio: 'https://finto', WebSocketImpl: rete.WebSocketImpl, tempo: orologio, ascolta: false,
                               alMessaggio: d => t.arrivati.push(d), alCambio: () => { t.cambi++ } })
    return t
  }
  const a = telefono(POSTO_A)
  orologio.avanti(500)
  const b = telefono(POSTO_B)
  orologio.avanti(500)
  return { orologio, rete, codice, a, b, telefono }
}
/* manda `quanti` messaggi numerati da tutti e due, uno ogni `ogni` ms */
function chiacchiera({ orologio, a, b }, quanti, ogni = 100, da = 0, guasto = null) {
  for (let i = da; i < da + quanti; i++) {
    a.c.manda({ i, da: 'a' }); b.c.manda({ i, da: 'b' })
    orologio.avanti(ogni)
    if (guasto) guasto(i)
  }
}
const inFila = (t, n) => t.arrivati.length === n && t.arrivati.every((m, i) => m.i === i)

/* ── il tavolo, da solo ── */
{
  let s = tavolo.nuovoTavolo(0, 'p'.repeat(16))
  const r0 = tavolo.entra(tavolo.nuovoTavolo(0, 'p'.repeat(16)), [], 'q'.repeat(16), 10)
  uguale('chi arriva prima di chi ha creato il tavolo è l\'ospite (il posto dell\'host è prenotato)', r0.ruolo, 'ospite')
  const r1 = tavolo.entra(s, [], 'p'.repeat(16), 10)
  uguale('chi ha creato il tavolo è l\'host', r1.ruolo, 'host')
  controlla('e sa che l\'altro non c\'è ancora', r1.ciao.altro === false)
  const wsA = { n: 'a' }
  const r2 = tavolo.entra(s, [{ ws: wsA, posto: 'p'.repeat(16) }], 'q'.repeat(16), 20)
  controlla('il secondo è l\'ospite, sa che l\'host c\'è, e l\'host lo sa', r2.ruolo === 'ospite' && r2.ciao.altro && r2.invii[0]?.a === wsA && r2.invii[0].msg.t === 'su')
  controlla('arrivato il secondo, il tavolo dura un\'ora e mezza', s.scade === 20 + tavolo.DURATA)
  uguale('un terzo non si siede', tavolo.entra(s, [], 'z'.repeat(16), 30).esito, 'piena')
  const wsB = { n: 'b' }
  const r3 = tavolo.entra(s, [{ ws: wsA, posto: 'p'.repeat(16) }, { ws: wsB, posto: 'q'.repeat(16) }], 'p'.repeat(16), 40)
  controlla('chi rientra col suo posto riprende il suo ruolo, e il filo vecchio va chiuso', r3.ruolo === 'host' && r3.sostituiti[0] === wsA)
  const giu = tavolo.esce(s, [{ ws: wsA, posto: 'p'.repeat(16) }], 'q'.repeat(16), 100)
  controlla('chi cade: l\'altro sente «giù», non «via»', giu.invii[0]?.msg.t === 'giu' && !giu.fine)
  uguale('il prossimo allarme è alla fine della grazia', tavolo.prossimo(s), 100 + tavolo.GRAZIA)
  const presto = tavolo.allarme(s, [{ ws: wsA, posto: 'p'.repeat(16) }], 100 + tavolo.GRAZIA - 1)
  uguale('prima della grazia non succede niente', presto.invii.length, 0)
  const tardi = tavolo.allarme(s, [{ ws: wsA, posto: 'p'.repeat(16) }], 100 + tavolo.GRAZIA)
  controlla('dopo la grazia il posto è perso, e l\'altro sente «via»', tardi.invii[0]?.msg.t === 'via')
  uguale('chi torna tardi non si risiede', tavolo.entra(s, [], 'q'.repeat(16), 100 + tavolo.GRAZIA + 5).esito, 'andato')
  s = tavolo.nuovoTavolo(0, 'p'.repeat(16))
  tavolo.entra(s, [], 'p'.repeat(16), 1)
  const fine = tavolo.allarme(s, [{ ws: wsA, posto: 'p'.repeat(16) }], tavolo.ATTESA)
  controlla('un tavolo dove l\'altro non arriva si chiude dopo cinque minuti, e lo si dice', fine.fine && fine.invii[0].msg.t === 'no' && fine.invii[0].msg.perche === 'chiuso')
  let sec = undefined, passati = 0
  for (let i = 0; i < 400; i++) { const r = tavolo.secchio(sec, 1000); sec = r.s; if (r.ok) passati++ }
  uguale('un\'onda di messaggi nello stesso istante: ne passano 300', passati, tavolo.SECCHIO.pieno)
  passati = 0
  for (let i = 0; i < 400; i++) { const r = tavolo.secchio(sec, 9000 + i * 25); sec = r.s; if (r.ok) passati++ }
  uguale('a 40 al secondo passano tutti', passati, 400)
  uguale('un messaggio troppo grande si rifiuta', tavolo.leggiMessaggio('x'.repeat(3000)).codice, 1009)
  uguale('e uno che non è JSON', tavolo.leggiMessaggio('ciao').codice, 1003)
}

/* ── una chiacchierata tranquilla ── */
{
  const d = due()
  controlla('tutti e due seduti, coi ruoli giusti', d.a.c.ruolo === 'host' && d.b.c.ruolo === 'ospite' && d.a.c.io === 'su' && d.b.c.io === 'su')
  controlla('e ognuno vede l\'altro', d.a.c.altro === 'su' && d.b.c.altro === 'su')
  chiacchiera(d, 100)
  d.orologio.avanti(2000)
  controlla('cento messaggi per parte: arrivano tutti, in fila', inFila(d.a, 100) && inFila(d.b, 100), `${d.a.arrivati.length} ${d.b.arrivati.length}`)
  controlla('e l\'altro li ha confermati tutti (niente in sospeso)', d.a.c.fuori.length === 0 && d.b.c.fuori.length === 0, `${d.a.c.fuori.length}`)
  const lungo = { foto: Array.from({ length: 400 }, (_, i) => ({ i, nome: `pezzo "${i}"` })) }
  d.a.c.manda(lungo)
  d.orologio.avanti(2000)
  controlla(`un oggetto lungo (${JSON.stringify(lungo).length} caratteri) arriva intero, a pezzi da ${PEZZO}`, JSON.stringify(d.b.arrivati.at(-1)) === JSON.stringify(lungo))
  d.orologio.avanti(60000)
  controlla('un minuto senza niente da dire: il filo resta su, nessuno è «muto»', d.a.c.io === 'su' && d.b.c.altro === 'su' && d.a.c.diario.cadute === 0)
}

/* ── il filo cade: ci si ricollega, si riprende il posto, non si perde niente ── */
{
  const d = due({ seme: 2 })
  chiacchiera(d, 120, 100, 0, i => { if (i === 30) d.rete.taglia(POSTO_B); if (i === 70) d.rete.taglia(POSTO_A) })
  d.orologio.avanti(5000)
  controlla('due cadute, una per parte: tutti i messaggi arrivano, in fila e una volta sola', inFila(d.a, 120) && inFila(d.b, 120), `${d.a.arrivati.length} ${d.b.arrivati.length}`)
  controlla('chi è caduto ha ripreso il suo ruolo', d.a.c.ruolo === 'host' && d.b.c.ruolo === 'ospite' && d.a.c.io === 'su' && d.b.c.io === 'su')
  controlla('le cadute sono scritte nel diario', d.a.c.diario.cadute === 1 && d.b.c.diario.cadute === 1, `${d.a.c.diario.cadute} ${d.b.c.diario.cadute}`)
  uguale('nessuno ha finito', `${d.a.c.finito}/${d.b.c.finito}`, 'null/null')
}

/* ── il filo muore in silenzio (il telefono crede di essere collegato) ── */
{
  const d = due({ seme: 3 })
  chiacchiera(d, 40, 100, 0, i => { if (i === 10) d.rete.buco(POSTO_A) })
  d.orologio.avanti(8000)
  controlla('chi ha il filo morto se ne accorge da solo (il ping non torna) e se ne apre un altro', d.a.c.diario.cadute === 1 && d.a.c.diario.ultima?.ragione === 'sordo', JSON.stringify(d.a.c.diario))
  controlla('e quello che si era perso nel filo morto arriva lo stesso', inFila(d.a, 40) && inFila(d.b, 40), `${d.a.arrivati.length} ${d.b.arrivati.length}`)
  controlla('l\'altro intanto ha visto «muto» o «giù», e poi di nuovo «su»', d.b.c.altro === 'su')
}

/* ── la rete si pianta per otto secondi e poi consegna tutto in blocco ── */
{
  const d = due({ seme: 4 })
  chiacchiera(d, 60, 100, 0, i => { if (i === 20) d.rete.ferma(POSTO_B, 8000) })
  d.orologio.avanti(15000)
  controlla('dopo il blocco arriva tutto, in fila', inFila(d.a, 60) && inFila(d.b, 60), `${d.a.arrivati.length} ${d.b.arrivati.length}`)
  controlla('e nessuno ha finito', !d.a.c.finito && !d.b.c.finito)
  uguale('il servizio non ha mai dovuto chiudere qualcuno per troppi messaggi', d.rete.conta.rifiutati, 0)
}

/* ── un telefono senza rete per mezzo minuto (galleria, ascensore) ── */
{
  const d = due({ seme: 5 })
  const visti = new Set()
  chiacchiera(d, 100, 100, 0, i => { if (i === 10) d.rete.spegni(POSTO_B, 30000); visti.add(d.a.c.altro) })
  d.orologio.avanti(40000)
  chiacchiera(d, 20, 100, 100)
  d.orologio.avanti(5000)
  controlla('chi resta vede l\'altro «muto» o «giù» mentre manca', visti.has('muto') || visti.has('giu'), [...visti].join(','))
  controlla('torna la rete: si riprende il posto e arriva tutto, in fila', inFila(d.a, 120) && inFila(d.b, 120), `${d.a.arrivati.length} ${d.b.arrivati.length}`)
  controlla('e il tavolo è sempre quello (nessuno ha finito)', !d.a.c.finito && !d.b.c.finito && d.b.c.ruolo === 'ospite')
}

/* ── chi non torna più: dopo la grazia è finita, per tutti e due ── */
{
  const d = due({ seme: 6 })
  chiacchiera(d, 10)
  d.rete.spegni(POSTO_B, 10 * 60 * 1000)
  d.orologio.avanti(60000)
  controlla('dopo un minuto si aspetta ancora', !d.a.c.finito)
  d.orologio.avanti(80000)
  uguale('dopo la grazia, chi resta sa che l\'altro se n\'è andato', d.a.c.finito, 'via')
  uguale('e chi è rimasto senza rete sa che la linea non è tornata', d.b.c.finito, 'caduto')
}

/* ── chi esce per scelta: l'altro lo sa subito, e quello che aveva mandato arriva prima ── */
{
  const d = due({ seme: 7 })
  chiacchiera(d, 10)
  d.a.c.manda({ i: 10, da: 'a', ultimo: true })
  d.a.c.chiudi()
  d.orologio.avanti(4000)
  controlla('l\'ultimo messaggio di chi esce arriva', d.b.arrivati.at(-1)?.ultimo === true)
  uguale('chi esce ha finito per scelta sua', d.a.c.finito, 'mio')
  uguale('e l\'altro sa che se n\'è andato (non che è caduto)', d.b.c.finito, 'via')
}

/* ── i no del servizio, detti per bene ── */
{
  const d = due({ seme: 8 })
  const terzo = d.telefono('cccccccccccccccccccc')
  d.orologio.avanti(2000)
  uguale('un terzo telefono: «in due giocano già»', terzo.c.finito, 'piena')
  const sbagliato = new Canale('ZZZZZ', { posto: 'dddddddddddddddddddd', servizio: 'https://finto', WebSocketImpl: d.rete.WebSocketImpl, tempo: d.orologio, ascolta: false })
  d.orologio.avanti(2000)
  uguale('un codice che non c\'è: «nessuno»', sbagliato.finito, 'nessuno')
  controlla('e i due seduti non se ne accorgono', !d.a.c.finito && !d.b.c.finito && d.a.c.altro === 'su')
}

/* ── un telefono che non riesce mai ad aprire ── */
{
  const orologio = orologioFinto()
  const rete = reteFinta({ orologio, rnd: caso(9) })
  rete.nuovo(POSTO_A)
  rete.spegni(POSTO_A, 10 * 60 * 1000)
  const c = new Canale('ABCDE', { posto: POSTO_A, servizio: 'https://finto', WebSocketImpl: rete.WebSocketImpl, tempo: orologio, ascolta: false })
  orologio.avanti(30000)
  uguale('senza rete dall\'inizio, dopo qualche tentativo si dice che serve internet', c.finito, 'rete')
}

/* ── tanti guasti a caso per dieci minuti ── */
for (const seme of [11, 12, 13]) {
  const d = due({ seme, min: 30, max: 400 })
  const r = caso(seme * 7)
  const guasti = { taglia: 0, buco: 0, spegni: 0, ferma: 0 }
  chiacchiera(d, 6000, 100, 0, () => {
    if (r() > 0.004) return
    const chi = r() < 0.5 ? POSTO_A : POSTO_B
    const x = r()
    if (x < 0.3) { guasti.taglia++; d.rete.taglia(chi) } else if (x < 0.5) { guasti.buco++; d.rete.buco(chi) }
    else if (x < 0.75) { guasti.spegni++; d.rete.spegni(chi, 2000 + r() * 40000) } else { guasti.ferma++; d.rete.ferma(chi, 1000 + r() * 10000) }
  })
  d.orologio.avanti(60000)
  const n = Object.values(guasti).reduce((s, x) => s + x, 0)
  controlla(`dieci minuti con ${n} guasti a caso (seme ${seme}: ${JSON.stringify(guasti)}): arrivano tutti i 6000 messaggi per parte, in fila`,
            inFila(d.a, 6000) && inFila(d.b, 6000) && !d.a.c.finito && !d.b.c.finito,
            `${d.a.arrivati.length} ${d.b.arrivati.length} ${d.a.c.finito} ${d.b.c.finito}`)
  uguale(`e il servizio non ha mai chiuso nessuno per troppi messaggi (seme ${seme})`, d.rete.conta.rifiutati, 0)
}
riassunto('insieme: il filo e il tavolo')
