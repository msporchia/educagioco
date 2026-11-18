/* Il giro del bambino a scuola (`src/scuola/bambini/giro.js`): le schermate, la lezione a blocchi (soglie a giuste, a
   domande e a minuti, «Avanti tutti», in tondo), la ripresa a pagina riaperta e il ricordo in localStorage.
   Docs: docs/scuola/bambini.md */
import * as G from '../../src/scuola/bambini/giro.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ES = { tipo: 'tabelline', tabelline: [7], modo: 'prodotto' }
const ORO = { tipo: 'modulo', modulo: 'orologio', da: 1, a: 3, tipologie: [] }
const MIN = 60 * 1000
const lezione = (blocchi, inTondo = false) => ({ id: 'l1', nome: 'Prova', blocchi, inTondo })
const L = lezione([{ esercizio: ES, passa: { domande: 3 } }, { esercizio: ORO, passa: null }])
const alunni = [{ id: 'a1', nome: 'Lorenzo', preso: true }, { id: 'a2', nome: 'Marta', preso: false }]
const st = (fase, io = { id: 'a1', nome: 'Lorenzo' }, lez = L, avanti = 0) => ({ fase, lezione: lez, avanti, io, alunni })
const c0 = (p = 0, extra = {}) => ({ ...G.nuovoCammino('a1', p), ...extra })
// una domanda chiusa nel blocco in corso
const rispondi = (c, lez, giusta, ora, ultima) => G.rispostaData(c, lez, { blocco: c.p, giusta, ultima }, ora)

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
const sch = (codice, stato, cammino) => G.schermata({ codice, stato, cammino })
uguale('senza codice: il codice', sch(null, null, null), 'codice')
uguale('codice e niente stato ancora: mi collego', sch('ABCDE', null, null), 'collego')
uguale('nessun nome: chi sei', sch('ABCDE', st('attesa', null), null), 'nome')
uguale('nome e attesa: aspetta', sch('ABCDE', st('attesa'), null), 'aspetta')
uguale('nome e via: il primo blocco', sch('ABCDE', st('via'), null), 'blocco')
uguale('chiusa vince anche senza nome', sch('ABCDE', st('chiusa', null), null), 'chiusa')
uguale('il nome liberato dalla maestra torna a chi sei', sch('ABCDE', st('via', null), c0()), 'nome')
uguale('superato un blocco: il passaggio', sch('ABCDE', st('via'), c0(0, { p: 1 })), 'passaggio')
uguale('toccato «Continua»: il blocco', sch('ABCDE', st('via'), c0(1)), 'blocco')
uguale('oltre l\'ultimo blocco: finito, senza passaggio', sch('ABCDE', st('via'), c0(0, { p: 2 })), 'finito')
uguale('il cammino di un altro nome non conta', sch('ABCDE', st('via'), { ...c0(2), alunno: 'a2' }), 'blocco')
uguale('chi arriva tardi comincia dal pavimento, senza passaggio', sch('ABCDE', st('via', undefined, L, 1), null), 'blocco')
uguale('un «Avanti tutti» non ancora seguito mostra già il passaggio', sch('ABCDE', st('via', undefined, L, 1), c0()), 'passaggio')
uguale('un esercizio storto non si apre', sch('ABCDE', st('via', undefined, lezione([{ esercizio: { tipo: 'boh' }, passa: null }])), null), 'guasta')
uguale('una soglia storta nemmeno', sch('ABCDE', st('via', undefined, lezione([{ esercizio: ES, passa: { domande: 0 } }])), null), 'guasta')

console.log('\nLA LEZIONE NELLA FORMA DI PRIMA')
{
  const vecchia = { id: 'l1', nome: 'Prova', obiettivo: { esercizio: ES, quante: 3, minuti: null }, dopo: ORO }
  const s = G.statoDa({ t: 'stato', fase: 'via', lezione: vecchia, io: { id: 'a1', nome: 'Lorenzo' }, alunni, preso: 4 })
  stessaLista('si converte in due blocchi', s.lezione, L)
  uguale('senza avanti il pavimento è zero', s.avanti, 0)
  controlla('il resto del messaggio non si tiene', !('preso' in s) && !('t' in s))
  uguale('e si gioca', G.schermata({ codice: 'ABCDE', stato: s, cammino: null }), 'blocco')
}

console.log('\nA DOMANDE')
{
  let c = G.entraNelBlocco(c0(), L, 1000)
  uguale('il segno dice la domanda a schermo', G.segno(L.blocchi[0].passa, c.conto, 1000), '1 di 3')
  c = rispondi(c, L, false, 2000)
  uguale('anche una sbagliata conta', G.segno(L.blocchi[0].passa, c.conto, 2000), '2 di 3')
  c = rispondi(c, L, true, 3000, false)
  uguale('un colpo con la domanda ancora aperta (`ultima: false`) non conta', c.conto.fatte, 1)
  c = rispondi(c, L, true, 3000)
  uguale('ancora nel primo blocco', c.p, 0)
  c = rispondi(c, L, true, 4000)
  uguale('la terza fa passare', c.p, 1)
  stessaLista('e il conto riparte', c.conto, G.nuovoConto())
  uguale('passato, si vede il passaggio', sch('ABCDE', st('via'), c), 'passaggio')
  uguale('nel passaggio una risposta non conta', G.rispostaData(c, L, { blocco: 1, giusta: true }, 5000), c)
  uguale('né una del blocco di prima', G.rispostaData(G.continua(c), L, { blocco: 0, giusta: true }, 5000).conto.fatte, 0)
  c = G.entraNelBlocco(G.continua(c), L, 6000)
  uguale('il tempo del blocco nuovo parte quando ci si entra', c.conto.inizio, 6000)
  uguale('quando lo dice la maestra: nessun segno', G.segno(L.blocchi[1].passa, c.conto, 6000), '')
  for (let i = 0; i < 50; i++) c = rispondi(c, L, true, 7000 + i)
  uguale('e il blocco non passa da solo', c.p, 1)
  uguale('il tempo parte una volta sola', G.entraNelBlocco(c, L, 99_999).conto.inizio, 6000)
}

console.log('\nA GIUSTE')
{
  const lez = lezione([{ esercizio: ES, passa: { giuste: 2 } }, { esercizio: ORO, passa: null }])
  let c = G.entraNelBlocco(c0(), lez, 0)
  uguale('il segno dice le giuste', G.segno(lez.blocchi[0].passa, c.conto, 0), '0 di 2 giuste')
  c = rispondi(c, lez, false, 1)
  c = rispondi(c, lez, false, 2)
  uguale('le sbagliate non fanno passare', c.p, 0)
  c = rispondi(c, lez, true, 3)
  uguale('una giusta', G.segno(lez.blocchi[0].passa, c.conto, 3), '1 di 2 giuste')
  c = rispondi(c, lez, true, 4, false)
  uguale('un colpo con la domanda aperta non conta nemmeno se giusto', c.conto.giuste, 1)
  c = rispondi(c, lez, true, 5)
  uguale('la seconda giusta fa passare', c.p, 1)
}

console.log('\nA MINUTI: TEMPO DI PARETE')
{
  const lez = lezione([{ esercizio: ES, passa: { minuti: 10 } }, { esercizio: ORO, passa: null }])
  const passa = lez.blocchi[0].passa
  const t0 = 1_000_000
  let c = c0()
  uguale('prima di cominciare: tutti i minuti', G.segno(passa, c.conto, t0), 'Ancora 10 minuti')
  c = G.entraNelBlocco(c, lez, t0)
  uguale('l\'inizio è quando comincia', c.conto.inizio, t0)
  uguale('dopo 30 s: ancora 10 (si arrotonda in su)', G.segno(passa, c.conto, t0 + 30_000), 'Ancora 10 minuti')
  uguale('dopo 9 min e 1 s: ancora 1 minuto', G.segno(passa, c.conto, t0 + 9 * MIN + 1000), 'Ancora 1 minuto')
  uguale('allo scadere: l\'ultima domanda', G.segno(passa, c.conto, t0 + 10 * MIN), 'Ultima domanda')
  c = rispondi(c, lez, true, t0 + 5 * MIN)
  uguale('a metà tempo una risposta non fa passare', c.p, 0)
  uguale('a tempo scaduto un colpo sbagliato non fa passare: la domanda è ancora a schermo',
    rispondi(c, lez, false, t0 + 10 * MIN + 2000, false).p, 0)
  uguale('la risposta dopo lo scadere fa passare (la domanda a schermo si finisce)', rispondi(c, lez, false, t0 + 10 * MIN + 4000).p, 1)
  const ripreso = G.entraNelBlocco(c0(0, { conto: { fatte: 3, giuste: 2, inizio: t0 } }), lez, t0 + 11 * MIN)
  uguale('riaprendo a tempo scaduto il blocco è passato', ripreso.p, 1)
  uguale('e si vede il passaggio', sch('ABCDE', st('via', undefined, lez), ripreso), 'passaggio')
  const presto = G.entraNelBlocco(c0(0, { conto: { fatte: 1, giuste: 1, inizio: t0 } }), lez, t0 + 4 * MIN)
  uguale('riaprendo prima: si riprende col tempo che resta', G.segno(passa, presto.conto, t0 + 4 * MIN), 'Ancora 6 minuti')
  uguale('un orologio che torna indietro non regala minuti', G.segno(passa, presto.conto, t0 - 5 * MIN), 'Ancora 10 minuti')
}

console.log('\nAVANTI TUTTI')
{
  let c = rispondi(G.entraNelBlocco(c0(), L, 0), L, true, 1)
  uguale('il pavimento non c\'è: si resta', G.segui(c, 'a1', 0), c)
  c = G.segui(c, 'a1', 1)
  uguale('il pavimento porta avanti', c.p, 1)
  stessaLista('e fa ripartire il conto', c.conto, G.nuovoConto())
  uguale('col passaggio', sch('ABCDE', st('via', undefined, L, 1), c), 'passaggio')
  c = G.segui(G.continua(c), 'a1', 1)
  uguale('lo stesso pavimento ripetuto non cambia niente', c.visto, 1)
  const avanti = c0(0, { p: 3, visto: 3, conto: { fatte: 4, giuste: 4, inizio: 9 } })
  uguale('chi era già avanti resta dov\'è', G.segui(avanti, 'a1', 2), avanti)
  uguale('un pavimento oltre l\'ultimo blocco: finito', sch('ABCDE', st('via', undefined, L, 2), G.segui(c, 'a1', 2)), 'finito')
  const dopo = G.segui(G.segui(c0(), 'a1', 1), 'a1', 2)
  uguale('due «Avanti tutti» di fila portano al pavimento', dopo.p, 2)
}

console.log('\nIN TONDO')
{
  const tondo = lezione([{ esercizio: ES, passa: { domande: 1 } }, { esercizio: ORO, passa: { domande: 1 } }], true)
  let c = G.entraNelBlocco(c0(), tondo, 0)
  c = G.entraNelBlocco(G.continua(rispondi(c, tondo, true, 1)), tondo, 2)
  c = G.entraNelBlocco(G.continua(rispondi(c, tondo, true, 3)), tondo, 4)
  uguale('oltre l\'ultimo blocco si ricomincia: la posizione cresce', c.p, 2)
  uguale('mai finito', sch('ABCDE', st('via', undefined, tondo), c), 'blocco')
  uguale('un «Avanti tutti» oltre la fine non finisce niente', sch('ABCDE', st('via', undefined, tondo, 9), G.segui(c, 'a1', 9)), 'passaggio')
}

console.log('\nUN ALTRO NOME SULLO STESSO PC')
{
  const c = c0(0, { p: 1, visto: 1, conto: { fatte: 4, giuste: 3, inizio: 10 } })
  controlla('lo stesso nome tiene il cammino', G.segui(c, 'a1') === c)
  stessaLista('un nome diverso riparte da zero', G.segui(c, 'a2'), G.nuovoCammino('a2'))
  stessaLista('o dal pavimento, se c\'è', G.segui(c, 'a2', 1), G.nuovoCammino('a2', 1))
  stessaLista('senza cammino si parte da zero', G.segui(null, 'a1'), G.nuovoCammino('a1'))
}

console.log('\nIL RICORDO')
{
  const a = new Archivio()
  const ora = 5_000_000
  uguale('niente ricordo: null', G.leggiRicordo(ora, a), null)
  const c = c0(0, { p: 1, conto: { fatte: 0, giuste: 0, inizio: null } })
  G.ricorda({ codice: 'ABCDE', nato: ora - 1000, stato: { ...st('via', undefined, L, 1), preso: 7 }, cammino: c }, a)
  controlla('sta sotto scuola:', [...a.m.keys()].every(k => k.startsWith('scuola:')))
  const r = G.leggiRicordo(ora, a)
  uguale('il codice', r?.codice, 'ABCDE')
  uguale('la fase', r?.stato?.fase, 'via')
  uguale('il nome', r?.stato?.io?.id, 'a1')
  uguale('il pavimento', r?.stato?.avanti, 1)
  stessaLista('il cammino', r?.cammino, c)
  controlla('il resto del messaggio non si ricorda', r?.stato && !('preso' in r.stato))
  uguale('da quel ricordo si torna dov\'era: il passaggio', G.schermata(r), 'passaggio')
  uguale('dopo tre ore il ricordo non vale più', G.leggiRicordo(ora + 3 * 60 * MIN, a), null)
  G.ricorda({ codice: 'ABCDE', nato: ora, stato: st('chiusa'), cammino: c }, a)
  uguale('a lezione chiusa il ricordo si toglie', a.getItem(G.RICORDO), null)
  G.ricorda({ codice: 'ABCDE', nato: ora, stato: null, cammino: null }, a)
  uguale('appena entrati: solo il codice', G.schermata(G.leggiRicordo(ora, a)), 'collego')
  G.dimentica(a)
  uguale('dimentica toglie tutto', a.getItem(G.RICORDO), null)
  a.setItem(G.RICORDO, JSON.stringify({ codice: 'ABCDE', nato: ora, stato: st('via', undefined, { id: 'l1', nome: 'Prova', obiettivo: { esercizio: ES, quante: 3 }, dopo: null }),
    avanzamento: { alunno: 'a1', fatte: 2, inizio: null, parte: 'obiettivo' } }))
  uguale('un ricordo nella forma di prima (obiettivo e «dopo») è nessun ricordo', G.leggiRicordo(ora, a), null)
  a.setItem(G.RICORDO, '{rotto')
  uguale('un ricordo guasto è nessun ricordo', G.leggiRicordo(ora, a), null)
  a.setItem(G.RICORDO, JSON.stringify({ forma: 'blocchi', codice: 'abc', nato: ora }))
  uguale('un codice storto è nessun ricordo', G.leggiRicordo(ora, a), null)
  a.setItem(G.RICORDO, JSON.stringify({ forma: 'blocchi', codice: 'ABCDE', nato: ora, stato: { fase: 'via' }, cammino: { alunno: 'a1', p: 0, visto: 1, conto: G.nuovoConto() } }))
  const mezzo = G.leggiRicordo(ora, a)
  controlla('stato e cammino guasti si buttano, il codice resta', mezzo?.codice === 'ABCDE' && mezzo.stato === null && mezzo.cammino === null)
  const vietato = { getItem() { throw new Error('vietato') }, setItem() { throw new Error('vietato') }, removeItem() { throw new Error('vietato') } }
  uguale('un localStorage vietato non rompe la lettura', G.leggiRicordo(ora, vietato), null)
  G.ricorda({ codice: 'ABCDE', nato: ora, stato: null, cammino: null }, vietato)
  controlla('né la scrittura', true)
  uguale('senza localStorage: null', G.leggiRicordo(ora, null), null)
}

riassunto('il giro del bambino a scuola')
