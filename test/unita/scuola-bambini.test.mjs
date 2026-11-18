/* Il giro del bambino a scuola (`src/scuola/bambini/giro.js`): le schermate, l'obiettivo a domande e a minuti, la ripresa
   a pagina riaperta e il ricordo in localStorage. Docs: docs/scuola/bambini.md */
import * as G from '../../src/scuola/bambini/giro.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ES = { tipo: 'tabelline', tabelline: [7], modo: 'prodotto' }
const ORO = { tipo: 'modulo', modulo: 'orologio', da: 1, a: 3, tipologie: [] }
const MIN = 60 * 1000
const lezione = (obiettivo, dopo = null) => ({ id: 'l1', nome: 'Prova', obiettivo: { esercizio: ES, quante: null, minuti: null, ...obiettivo }, dopo })
const alunni = [{ id: 'a1', nome: 'Lorenzo', preso: true }, { id: 'a2', nome: 'Marta', preso: false }]
const st = (fase, io = { id: 'a1', nome: 'Lorenzo' }, lez = lezione({ quante: 3 })) => ({ fase, lezione: lez, io, alunni })

class Archivio {
  constructor() { this.m = new Map() }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null }
  setItem(k, v) { this.m.set(k, String(v)) }
  removeItem(k) { this.m.delete(k) }
}

console.log('\nIL CODICE')
uguale('minuscole e spazi diventano il codice', G.pulisciCodice(' ab cde '), 'ABCDE')
uguale('si tengono solo le lettere, al più cinque', G.pulisciCodice('a1b-c.dèfgh'), 'ABCDF')
controlla('cinque lettere sono un codice', G.codiceCompleto('ABCDE'))
controlla('quattro no', !G.codiceCompleto('ABCD'))
controlla('le minuscole no (si puliscono prima)', !G.codiceCompleto('abcde'))

console.log('\nLE SCHERMATE')
const sch = (codice, stato, avanzamento) => G.schermata({ codice, stato, avanzamento })
uguale('senza codice: il codice', sch(null, null, null), 'codice')
uguale('codice e niente stato ancora: mi collego', sch('ABCDE', null, null), 'collego')
uguale('nessun nome: chi sei', sch('ABCDE', st('attesa', null), null), 'nome')
uguale('nome e attesa: aspetta', sch('ABCDE', st('attesa'), null), 'aspetta')
uguale('nome e via: l\'obiettivo', sch('ABCDE', st('via'), null), 'obiettivo')
uguale('chiusa vince anche senza nome', sch('ABCDE', st('chiusa', null), null), 'chiusa')
uguale('il nome liberato dalla maestra torna a chi sei', sch('ABCDE', st('via', null), G.nuovoAvanzamento('a1')), 'nome')
uguale('obiettivo finito senza «dopo»', sch('ABCDE', st('via'), { ...G.nuovoAvanzamento('a1'), parte: 'finito' }), 'finito')
uguale('un «dopo» chiesto ma che la lezione non ha resta «finito»', sch('ABCDE', st('via'), { ...G.nuovoAvanzamento('a1'), parte: 'dopo' }), 'finito')
uguale('il «dopo» quando c\'è', sch('ABCDE', st('via', undefined, lezione({ quante: 3 }, ORO)), { ...G.nuovoAvanzamento('a1'), parte: 'dopo' }), 'dopo')
uguale('l\'avanzamento di un altro nome non conta', sch('ABCDE', st('via'), { ...G.nuovoAvanzamento('a2'), parte: 'finito' }), 'obiettivo')
uguale('un esercizio storto non si apre', sch('ABCDE', st('via', undefined, lezione({ quante: 3, esercizio: { tipo: 'boh' } })), null), 'guasta')
controlla('haDopo: sì con un esercizio valido, no con null', G.haDopo(lezione({}, ORO)) && !G.haDopo(lezione({})))

console.log('\nL\'OBIETTIVO A DOMANDE')
{
  const ob = { esercizio: ES, quante: 3, minuti: null }
  let av = G.entraNellObiettivo(G.nuovoAvanzamento('a1'), ob, 1000)
  uguale('si parte dalla prima', G.segno(av, ob, 1000), '1 di 3')
  av = G.rispostaData(av, ob, 2000)
  uguale('una fatta: la seconda', G.segno(av, ob, 2000), '2 di 3')
  av = G.rispostaData(av, ob, 3000)
  uguale('ancora obiettivo', av.parte, 'obiettivo')
  av = G.rispostaData(av, ob, 4000)
  uguale('la terza chiude', av.parte, 'finito')
  uguale('il segno non va oltre il totale', G.segno(av, ob, 4000), '3 di 3')
  uguale('dopo l\'obiettivo le risposte non contano', G.rispostaData(av, ob, 5000).fatte, 3)
  av = G.continua(av)
  uguale('continua porta al «dopo»', av.parte, 'dopo')
  uguale('nel «dopo» non si conta', G.rispostaData(av, ob, 6000).fatte, 3)
  // negli Asteroidi un colpo sbagliato lascia la domanda aperta: va alla maestra, ma conta solo quando la domanda si chiude
  const g = G.entraNellObiettivo(G.nuovoAvanzamento('a1'), ob, 1000)
  uguale('un colpo con la domanda ancora aperta (`ultima: false`) non conta', G.rispostaData(g, ob, 2000, false).fatte, 0)
  uguale('quello che la chiude sì', G.rispostaData(g, ob, 2000, true).fatte, 1)
  uguale('le schede non lo dicono: ogni risposta chiude', G.rispostaData(g, ob, 2000).fatte, 1)
  uguale('il tempo parte alla prima domanda e non riparte', G.entraNellObiettivo({ ...G.nuovoAvanzamento('a1'), inizio: 5 }, ob, 99).inizio, 5)
}

console.log('\nL\'OBIETTIVO A MINUTI: TEMPO DI PARETE')
{
  const ob = { esercizio: ES, quante: null, minuti: 10 }
  const t0 = 1_000_000
  let av = G.nuovoAvanzamento('a1')
  uguale('prima di cominciare: tutti i minuti', G.segno(av, ob, t0), 'Ancora 10 minuti')
  av = G.entraNellObiettivo(av, ob, t0)
  uguale('l\'inizio è quando comincia', av.inizio, t0)
  uguale('dopo 30 s: ancora 10 (si arrotonda in su)', G.segno(av, ob, t0 + 30_000), 'Ancora 10 minuti')
  uguale('dopo 9 min e 1 s: ancora 1 minuto', G.segno(av, ob, t0 + 9 * MIN + 1000), 'Ancora 1 minuto')
  uguale('allo scadere: l\'ultima domanda', G.segno(av, ob, t0 + 10 * MIN), 'Ultima domanda')
  av = G.rispostaData(av, ob, t0 + 5 * MIN)
  uguale('a metà tempo una risposta non chiude', av.parte, 'obiettivo')
  uguale('a tempo scaduto un colpo sbagliato non chiude: la domanda è ancora a schermo',
    G.rispostaData(av, ob, t0 + 10 * MIN + 2000, false).parte, 'obiettivo')
  av = G.rispostaData(av, ob, t0 + 10 * MIN + 4000)
  uguale('la risposta dopo lo scadere chiude (la domanda a schermo si finisce)', av.parte, 'finito')
  uguale('e conta anche lei', av.fatte, 2)
  // la pagina riaperta dopo lo scadere: niente domanda nuova
  const ripreso = G.entraNellObiettivo({ ...G.nuovoAvanzamento('a1'), inizio: t0 }, ob, t0 + 11 * MIN)
  uguale('riaprendo a tempo scaduto l\'obiettivo è finito', ripreso.parte, 'finito')
  const presto = G.entraNellObiettivo({ ...G.nuovoAvanzamento('a1'), inizio: t0 }, ob, t0 + 4 * MIN)
  uguale('riaprendo prima: si riprende col tempo che resta', G.segno(presto, ob, t0 + 4 * MIN), 'Ancora 6 minuti')
  uguale('un orologio che torna indietro non regala minuti', G.segno(presto, ob, t0 - 5 * MIN), 'Ancora 10 minuti')
}

console.log('\nUN ALTRO NOME SULLO STESSO PC')
{
  const av = { alunno: 'a1', fatte: 4, inizio: 10, parte: 'finito' }
  controlla('lo stesso nome tiene l\'avanzamento', G.perAlunno(av, 'a1') === av)
  stessaLista('un nome diverso riparte da zero', G.perAlunno(av, 'a2'), G.nuovoAvanzamento('a2'))
  stessaLista('senza avanzamento si parte da zero', G.perAlunno(null, 'a1'), G.nuovoAvanzamento('a1'))
}

console.log('\nIL RICORDO')
{
  const a = new Archivio()
  const ora = 5_000_000
  uguale('niente ricordo: null', G.leggiRicordo(ora, a), null)
  const av = { alunno: 'a1', fatte: 2, inizio: ora - 1000, parte: 'obiettivo' }
  G.ricorda({ codice: 'ABCDE', nato: ora - 1000, stato: { ...st('via'), preso: 7 }, avanzamento: av }, a)
  controlla('sta sotto scuola:', [...a.m.keys()].every(k => k.startsWith('scuola:')))
  const r = G.leggiRicordo(ora, a)
  uguale('il codice', r?.codice, 'ABCDE')
  uguale('la fase', r?.stato?.fase, 'via')
  uguale('il nome', r?.stato?.io?.id, 'a1')
  stessaLista('l\'avanzamento', r?.avanzamento, av)
  controlla('il resto del messaggio non si ricorda', r?.stato && !('preso' in r.stato))
  uguale('da quel ricordo si torna alle domande', G.schermata(r), 'obiettivo')
  uguale('dopo tre ore il ricordo non vale più', G.leggiRicordo(ora + 3 * 60 * MIN, a), null)
  G.ricorda({ codice: 'ABCDE', nato: ora, stato: st('chiusa'), avanzamento: av }, a)
  uguale('a lezione chiusa il ricordo si toglie', a.getItem(G.RICORDO), null)
  G.ricorda({ codice: 'ABCDE', nato: ora, stato: null, avanzamento: null }, a)
  uguale('appena entrati: solo il codice', G.schermata(G.leggiRicordo(ora, a)), 'collego')
  G.dimentica(a)
  uguale('dimentica toglie tutto', a.getItem(G.RICORDO), null)
  a.setItem(G.RICORDO, '{rotto')
  uguale('un ricordo guasto è nessun ricordo', G.leggiRicordo(ora, a), null)
  a.setItem(G.RICORDO, JSON.stringify({ codice: 'abc', nato: ora }))
  uguale('un codice storto è nessun ricordo', G.leggiRicordo(ora, a), null)
  a.setItem(G.RICORDO, JSON.stringify({ codice: 'ABCDE', nato: ora, stato: { fase: 'via' }, avanzamento: { alunno: 'a1', fatte: -1, inizio: null, parte: 'obiettivo' } }))
  const mezzo = G.leggiRicordo(ora, a)
  controlla('stato e avanzamento guasti si buttano, il codice resta', mezzo?.codice === 'ABCDE' && mezzo.stato === null && mezzo.avanzamento === null)
  const vietato = { getItem() { throw new Error('vietato') }, setItem() { throw new Error('vietato') }, removeItem() { throw new Error('vietato') } }
  uguale('un localStorage vietato non rompe la lettura', G.leggiRicordo(ora, vietato), null)
  G.ricorda({ codice: 'ABCDE', nato: ora, stato: null, avanzamento: null }, vietato)
  controlla('né la scrittura', true)
  uguale('senza localStorage: null', G.leggiRicordo(ora, null), null)
}

riassunto('il giro del bambino a scuola')
