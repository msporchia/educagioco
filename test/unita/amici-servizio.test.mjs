/* Le regole del servizio degli amici (`servizio/inoltro/src/coppia.js` e `codici.js`), senza Cloudflare: due posti, chi rientra
   prende il suo posto, i messaggi controllati; i codici brevi, i tentativi sbagliati. Docs: docs/core/amici.md */
import { dichiara, chiudi, inoltra, controllaMessaggio, MAX_BYTE, MAX_AL_SECONDO, MAX_CHIAVI, ID, CHIAVE } from '../../servizio/inoltro/src/presenza.js'
import { nuovoCodice, contaErrore, bloccato, CODICE, ALFABETO, ERRORI_AL_MINUTO } from '../../servizio/inoltro/src/codici.js'
import { leggiRichiesta, usa, SCADENZA, MAX_DATI } from '../../servizio/inoltro/src/bacheca.js'
import * as comune from '../../servizio/inoltro/src/comune.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ugualeJ = (cosa, a, b) => uguale(cosa, JSON.stringify(a), JSON.stringify(b))
{
  const K1 = 'a'.repeat(32), K2 = 'b'.repeat(32), K3 = 'c'.repeat(32)
  const W = nome => ({ nome })
  const [lor, mar, estraneo, lor2] = [W('lor'), W('mar'), W('estraneo'), W('lor2')]
  const dest = (invii, ws) => invii.filter(i => i.a === ws).map(i => i.msg)
  // un telefono solo: non c'è nessuno
  let soci = []
  let r = dichiara(soci, lor, 'lorenzo01', [K1, K2])
  ugualeJ('il primo si presenta: nessun amico c\'è', dest(r.invii, lor)[0].presenti, [])
  soci = [{ ws: lor, id: 'lorenzo01', chiavi: r.chiavi }]
  // l'amico arriva: lui sa che c\'è, e chi c\'era lo sa
  r = dichiara(soci, mar, 'marta0001', [K1])
  ugualeJ('chi arriva vede che l\'amico c\'è', dest(r.invii, mar)[0].presenti, [K1])
  controlla('e chi c\'era riceve «su» per quella chiave sola', JSON.stringify(dest(r.invii, lor)) === JSON.stringify([{ t: 'su', chiave: K1 }]))
  soci.push({ ws: mar, id: 'marta0001', chiavi: r.chiavi })
  // inoltro: solo sulle chiavi che si hanno, e solo all\'altro
  controlla('un messaggio per un amico arriva all\'altro, incartato con la chiave', JSON.stringify(inoltra(soci, lor, K1, { k: 'invito' })) === JSON.stringify([{ a: mar, msg: { t: 'da', chiave: K1, m: { k: 'invito' } } }]))
  controlla('su una chiave che non si ha non va da nessuna parte', inoltra(soci, mar, K2, { k: 'x' }).length === 0)
  controlla('una chiave senza l\'altro collegato: nessuno', inoltra(soci, lor, K2, { k: 'x' }).length === 0)
  controlla('un messaggio che non è un oggetto non si gira', inoltra(soci, lor, K1, 'ciao').length === 0 && inoltra(soci, lor, K1, [1]).length === 0)
  // un terzo con la stessa chiave: è di due e basta
  r = dichiara(soci, estraneo, 'estraneo01', [K1, K3])
  ugualeJ('un terzo non entra in un\'amicizia di due', r.chiavi, [K3])
  controlla('e nessuno lo vede', !r.invii.some(i => i.a === lor || i.a === mar))
  // chi rientra con lo stesso id prende il suo posto, senza avvisi
  r = dichiara(soci, lor2, 'lorenzo01', [K1, K2])
  ugualeJ('il vecchio collegamento dello stesso bambino va chiuso', r.sostituiti, [lor])
  controlla('chi rientra ritrova l\'amico', dest(r.invii, lor2)[0].presenti.includes(K1))
  // aggiungere e togliere un\'amicizia a collegamento aperto
  r = dichiara([{ ws: mar, id: 'marta0001', chiavi: [K1] }, { ws: lor2, id: 'lorenzo01', chiavi: [K1] }], lor2, 'lorenzo01', [K1, K2])
  controlla('una chiave in più: nessun avviso a chi non c\'entra', r.invii.length === 1)
  r = dichiara([{ ws: mar, id: 'marta0001', chiavi: [K1] }, { ws: lor2, id: 'lorenzo01', chiavi: [K1] }], lor2, 'lorenzo01', [])
  controlla('togliere un\'amicizia lo dice all\'altro («giù»)', JSON.stringify(dest(r.invii, mar)) === JSON.stringify([{ t: 'giu', chiave: K1 }]))
  // chiusura
  const chi = chiudi([{ ws: mar, id: 'marta0001', chiavi: [K1] }, { ws: lor2, id: 'lorenzo01', chiavi: [K1, K2] }], lor2)
  controlla('se uno se ne va, l\'altro lo sa, per ogni chiave in comune', JSON.stringify(dest(chi, mar)) === JSON.stringify([{ t: 'giu', chiave: K1 }]))
  controlla('un collegamento che non si è mai presentato non avvisa nessuno', chiudi([], W('x')).length === 0)
  controlla('al massimo sei chiavi', dichiara([], W('x'), 'prova00001', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(c => c.repeat(32))).chiavi.length === MAX_CHIAVI)
  controlla('gli id sono corti, in minuscolo, senza simboli', ID.test('lorenzo01') && !ID.test('Leo') && !ID.test('a b c d e f g h') && !ID.test('x'.repeat(40)))
  controlla('la chiave è di 32 caratteri', CHIAVE.test('a'.repeat(32)) && !CHIAVE.test('a'.repeat(31)) && !CHIAVE.test('A'.repeat(32)))
}
{
  const ok = controllaMessaggio(JSON.stringify({ k: 'invito', gioco: 'arena' }), [], 1000)
  controlla('un messaggio con la forma giusta passa', ok.ok && ok.recenti.length === 1)
  uguale('troppo grande: 1009', controllaMessaggio(JSON.stringify({ k: 'x', d: 'y'.repeat(MAX_BYTE) }), [], 1000).codice, 1009)
  uguale('non è un oggetto: 1003', controllaMessaggio('"ciao"', [], 1000).codice, 1003)
  uguale('senza k: 1003', controllaMessaggio('{"a":1}', [], 1000).codice, 1003)
  uguale('non è JSON: 1003', controllaMessaggio('non json', [], 1000).codice, 1003)
  uguale('binario: 1009', controllaMessaggio(new ArrayBuffer(4), [], 1000).codice, 1009)
  let recenti = [], ultimo
  for (let i = 0; i < MAX_AL_SECONDO + 1; i++) { ultimo = controllaMessaggio('{"k":"a"}', recenti, 5000 + i); if (ultimo.ok) recenti = ultimo.recenti }
  uguale('troppi in un secondo: 1008', ultimo.codice, 1008)
  controlla('passato il secondo si riparte', controllaMessaggio('{"k":"a"}', recenti, 9000).ok)
}
{
  const caso = Array.from({ length: 5 }, (_, i) => i * 37 + 3)
  const c = nuovoCodice(caso)
  controlla('un codice ha cinque lettere dell\'alfabeto', CODICE.test(c) && [...c].every(x => ALFABETO.includes(x)), c)
  controlla('l\'alfabeto non ha I né O', !ALFABETO.includes('I') && !ALFABETO.includes('O'))
  uguale('sono 24 lettere: 24⁵ = 7 962 624 codici', ALFABETO.length ** 5, 7962624)
  let st = null
  for (let i = 0; i < ERRORI_AL_MINUTO - 1; i++) st = contaErrore(st, 1000 + i)
  controlla('nove errori non bloccano', !bloccato(st, 2000))
  st = contaErrore(st, 2000)
  controlla('il decimo sì: per un minuto non si prova più', bloccato(st, 3000))
  controlla('passato un minuto si riparte', !bloccato(st, 70_000))
  uguale('e il conto si azzera', contaErrore(st, 70_000).n, 1)
}
/* la bacheca (docs/core/amici-bacheca.md): di due, scade in una settimana, il servizio non legge */
{
  const K = 'a'.repeat(32)
  uguale('la bacheca scade una settimana dopo l\'ultima scrittura', SCADENZA, 7 * 24 * 3600 * 1000)
  controlla('una richiesta senza chiave o senza id è storta', !leggiRichiesta({ id: 'marta0001' }).ok && !leggiRichiesta({ chiave: K }).ok)
  controlla('dati null: si legge soltanto', leggiRichiesta({ chiave: K, id: 'marta0001', dati: null }).testo === null)
  controlla('dati che non sono un oggetto: no', !leggiRichiesta({ chiave: K, id: 'marta0001', dati: [1] }).ok && !leggiRichiesta({ chiave: K, id: 'marta0001', dati: 'x' }).ok)
  controlla('dati troppo grandi: no', !leggiRichiesta({ chiave: K, id: 'marta0001', dati: { x: 'y'.repeat(MAX_DATI) } }).ok)
  let r = usa(undefined, 'marta0001', '{"a":1}')
  controlla('la prima scrive e non trova nessuno', r.scritto && r.altro === null && r.posti.marta0001 === '{"a":1}')
  r = usa(r.posti, 'lorenzo01', null)
  controlla('l\'amico legge senza scrivere e trova la prima', !r.scritto && r.altro === '{"a":1}' && !('lorenzo01' in r.posti))
  r = usa(r.posti, 'lorenzo01', '{"b":2}')
  controlla('e scrivendo prende il suo posto', r.scritto && r.altro === '{"a":1}' && r.posti.lorenzo01 === '{"b":2}')
  r = usa(r.posti, 'marta0001', '{"a":3}')
  controlla('chi riscrive sostituisce la sua e legge quella dell\'altro', r.posti.marta0001 === '{"a":3}' && r.altro === '{"b":2}')
  const terzo = usa(r.posti, 'estraneo01', '{"c":1}')
  controlla('un terzo non entra in una bacheca di due, nemmeno per leggere', terzo.rifiutato && !terzo.altro && !('estraneo01' in terzo.posti))
}
/* la fattoria in comune (docs/fattoria3d/in-comune.md): la fila delle mosse dei due e l'ultima fotografia */
{
  const K = 'f'.repeat(32), C = comune
  const chiedi = (stato, id, dopo, mosse = [], foto) => C.usa(stato, C.leggiRichiesta({ chiave: K, id, dopo, mosse, foto }))
  controlla('una richiesta senza chiave o con un dopo storto è rifiutata', !C.leggiRichiesta({ id: 'marta0001' }).ok && !C.leggiRichiesta({ chiave: K, id: 'marta0001', dopo: 1.5 }).ok)
  controlla('troppe mosse o una troppo grande sono rifiutate', !C.leggiRichiesta({ chiave: K, id: 'marta0001', mosse: Array(C.MAX_MOSSE + 1).fill({}) }).ok &&
    !C.leggiRichiesta({ chiave: K, id: 'marta0001', mosse: [{ a: 'x'.repeat(C.MAX_MOSSA) }] }).ok)
  controlla('una fotografia troppo grande è rifiutata', !C.leggiRichiesta({ chiave: K, id: 'marta0001', foto: { seq: 0, stato: { a: 'x'.repeat(C.MAX_FOTO) } } }).ok)
  // la prima apre la fattoria vuota con la sua fotografia
  let r = chiedi(null, 'marta0001', -1, [], { seq: 0, stato: { cose: 1 } })
  controlla('su una fattoria vuota la prima fotografia entra', r.stato.foto?.s === 0 && r.stato.ultimo === 0)
  r = chiedi(r.stato, 'lorenzo01', -1)
  controlla('chi arriva dopo riceve la fotografia', r.risposta.foto?.seq === 0 && r.risposta.foto.testo === '{"cose":1}' && r.risposta.mosse.length === 0)
  uguale('il secondo arrivato ha la corsia 1', r.risposta.corsia, 1)
  r = chiedi(r.stato, 'lorenzo01', 0, [{ n: 'semina' }, { n: 'tosa' }])
  ugualeJ('le mosse prendono i numeri in fila', r.risposta.mosse.map(x => [x.s, x.id]), [[1, 'lorenzo01'], [2, 'lorenzo01']])
  r = chiedi(r.stato, 'marta0001', 0, [{ n: 'abbatti' }])
  ugualeJ('l\'altro riceve le mosse dopo il suo ultimo numero, compresa la sua', r.risposta.mosse.map(x => x.s), [1, 2, 3])
  uguale('il terzo numero è la sua', r.risposta.mosse[2].id, 'marta0001')
  const terzo = chiedi(r.stato, 'estraneo01', -1)
  controlla('un terzo non entra in una fattoria di due, nemmeno per guardare', terzo.rifiutato && !terzo.risposta)
  // la fotografia di chi esce: vince se non è più vecchia, e le mosse lette da tutti e due e già dentro si buttano
  r = chiedi(r.stato, 'lorenzo01', 3, [], { seq: 3, stato: { cose: 4 } })
  controlla('la fotografia nuova vince', r.stato.foto.s === 3)
  uguale('le mosse lette da tutti e due e già nella fotografia non si tengono più', r.stato.mosse.length, 0)
  const vecchia = chiedi(r.stato, 'marta0001', 3, [], { seq: 1, stato: { cose: 2 } })
  uguale('una fotografia più vecchia non sostituisce quella tenuta', vecchia.stato.foto.testo, '{"cose":4}')
  const avanti = chiedi(r.stato, 'marta0001', 3, [], { seq: 99, stato: { cose: 9 } })
  uguale('una fotografia oltre l\'ultimo numero non entra in una fattoria viva', avanti.stato.foto.s, 3)
  r = chiedi(r.stato, 'marta0001', 3, [{ n: 'semina' }])
  r = chiedi(r.stato, 'lorenzo01', -1)
  controlla('chi riapre da capo riceve la fotografia e le mosse dopo', r.risposta.foto.seq === 3 && r.risposta.mosse.map(x => x.s).join() === '4')
  // scaduta sul servizio: la copia di un telefono la rimette in piedi
  r = chiedi(null, 'marta0001', 57, [], { seq: 57, stato: { cose: 7 } })
  controlla('una fattoria scaduta riparte dalla fotografia di un telefono, col suo numero', r.stato.foto.s === 57 && r.stato.ultimo === 57)
  let lunga = C.vuota()
  for (let i = 0; i < C.MAX_FILA + 30; i++) lunga = chiedi(lunga, 'marta0001', i, [{ n: 'semina' }]).stato
  uguale('la fila non supera il tetto', lunga.mosse.length, C.MAX_FILA)
  uguale('la fattoria in comune dura due mesi dall\'ultima volta', C.SCADENZA, 60 * 24 * 3600 * 1000)
}
/* ── i tetti della fattoria in comune: si fissa il minuto, gli altri vengono da lì ── */
{
  const { contaTetti, TETTI_COMUNE: T, COMUNE_MINUTO: M } = comune
  uguale('un\'ora vale 45 minuti pieni, un giorno cinque ore piene', T.map(t => t[0]).join(), [M, M * 45, M * 300].join())
  const gioca = (telefoni, minuti, partenza = 0, conti = null) => {
    let ok = true
    for (let m = 0; m < minuti; m++) for (let i = 0; i < telefoni * 20; i++) {
      const r = contaTetti(conti, T, partenza + m * 60000 + i * 10); conti = r.conti; ok &&= r.ok
    }
    return { ok, conti }
  }
  controlla('quattro telefoni sulla stessa wifi giocano un\'ora intera senza toccarli', gioca(4, 60).ok)
  controlla('sette telefoni sulla stessa wifi no: 140 al minuto', !gioca(7, 1).ok)
  let conti = null, r
  for (let i = 0; i <= M; i++) { r = contaTetti(conti, T, i); conti = r.conti }
  controlla('oltre il minuto ci si ferma', !r.ok)
  r = contaTetti(conti, T, 61000)
  controlla('e al minuto dopo si riparte', r.ok)
  let piano = null, minuti = 0
  for (; minuti < 60; minuti++) {                     // un bug al massimo del minuto
    let fermo = false
    for (let i = 0; i < M; i++) { const x = contaTetti(piano, T, minuti * 61000 + i); piano = x.conti; fermo ||= !x.ok }
    if (fermo) break
  }
  controlla('un bug al massimo si ferma dopo 45 minuti', minuti === 44 || minuti === 45, `al minuto ${minuti}`)
}

riassunto('amici: le regole del servizio')
