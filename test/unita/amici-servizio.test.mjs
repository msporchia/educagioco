/* Le regole del servizio degli amici (`servizio/inoltro/src/coppia.js` e `codici.js`), senza Cloudflare: due posti, chi rientra
   prende il suo posto, i messaggi controllati; i codici brevi, i tentativi sbagliati. Docs: docs/core/amici.md */
import { dichiara, chiudi, inoltra, controllaMessaggio, MAX_BYTE, MAX_AL_SECONDO, MAX_CHIAVI, ID, CHIAVE } from '../../servizio/inoltro/src/presenza.js'
import { nuovoCodice, contaErrore, bloccato, CODICE, ALFABETO, ERRORI_AL_MINUTO } from '../../servizio/inoltro/src/codici.js'
import { leggiRichiesta, usa, SCADENZA, MAX_DATI } from '../../servizio/inoltro/src/bacheca.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ugualeJ = (cosa, a, b) => uguale(cosa, JSON.stringify(a), JSON.stringify(b))
{
  const K1 = 'a'.repeat(32), K2 = 'b'.repeat(32), K3 = 'c'.repeat(32)
  const W = nome => ({ nome })
  const [leo, mel, estraneo, leo2] = [W('leo'), W('mel'), W('estraneo'), W('leo2')]
  const dest = (invii, ws) => invii.filter(i => i.a === ws).map(i => i.msg)
  // un telefono solo: non c'è nessuno
  let soci = []
  let r = dichiara(soci, leo, 'leonardo1', [K1, K2])
  ugualeJ('il primo si presenta: nessun amico c\'è', dest(r.invii, leo)[0].presenti, [])
  soci = [{ ws: leo, id: 'leonardo1', chiavi: r.chiavi }]
  // l'amico arriva: lui sa che c\'è, e chi c\'era lo sa
  r = dichiara(soci, mel, 'melody001', [K1])
  ugualeJ('chi arriva vede che l\'amico c\'è', dest(r.invii, mel)[0].presenti, [K1])
  controlla('e chi c\'era riceve «su» per quella chiave sola', JSON.stringify(dest(r.invii, leo)) === JSON.stringify([{ t: 'su', chiave: K1 }]))
  soci.push({ ws: mel, id: 'melody001', chiavi: r.chiavi })
  // inoltro: solo sulle chiavi che si hanno, e solo all\'altro
  controlla('un messaggio per un amico arriva all\'altro, incartato con la chiave', JSON.stringify(inoltra(soci, leo, K1, { k: 'invito' })) === JSON.stringify([{ a: mel, msg: { t: 'da', chiave: K1, m: { k: 'invito' } } }]))
  controlla('su una chiave che non si ha non va da nessuna parte', inoltra(soci, mel, K2, { k: 'x' }).length === 0)
  controlla('una chiave senza l\'altro collegato: nessuno', inoltra(soci, leo, K2, { k: 'x' }).length === 0)
  controlla('un messaggio che non è un oggetto non si gira', inoltra(soci, leo, K1, 'ciao').length === 0 && inoltra(soci, leo, K1, [1]).length === 0)
  // un terzo con la stessa chiave: è di due e basta
  r = dichiara(soci, estraneo, 'estraneo01', [K1, K3])
  ugualeJ('un terzo non entra in un\'amicizia di due', r.chiavi, [K3])
  controlla('e nessuno lo vede', !r.invii.some(i => i.a === leo || i.a === mel))
  // chi rientra con lo stesso id prende il suo posto, senza avvisi
  r = dichiara(soci, leo2, 'leonardo1', [K1, K2])
  ugualeJ('il vecchio collegamento dello stesso bambino va chiuso', r.sostituiti, [leo])
  controlla('chi rientra ritrova l\'amico', dest(r.invii, leo2)[0].presenti.includes(K1))
  // aggiungere e togliere un\'amicizia a collegamento aperto
  r = dichiara([{ ws: mel, id: 'melody001', chiavi: [K1] }, { ws: leo2, id: 'leonardo1', chiavi: [K1] }], leo2, 'leonardo1', [K1, K2])
  controlla('una chiave in più: nessun avviso a chi non c\'entra', r.invii.length === 1)
  r = dichiara([{ ws: mel, id: 'melody001', chiavi: [K1] }, { ws: leo2, id: 'leonardo1', chiavi: [K1] }], leo2, 'leonardo1', [])
  controlla('togliere un\'amicizia lo dice all\'altro («giù»)', JSON.stringify(dest(r.invii, mel)) === JSON.stringify([{ t: 'giu', chiave: K1 }]))
  // chiusura
  const chi = chiudi([{ ws: mel, id: 'melody001', chiavi: [K1] }, { ws: leo2, id: 'leonardo1', chiavi: [K1, K2] }], leo2)
  controlla('se uno se ne va, l\'altro lo sa, per ogni chiave in comune', JSON.stringify(dest(chi, mel)) === JSON.stringify([{ t: 'giu', chiave: K1 }]))
  controlla('un collegamento che non si è mai presentato non avvisa nessuno', chiudi([], W('x')).length === 0)
  controlla('al massimo sei chiavi', dichiara([], W('x'), 'prova00001', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(c => c.repeat(32))).chiavi.length === MAX_CHIAVI)
  controlla('gli id sono corti, in minuscolo, senza simboli', ID.test('leonardo1') && !ID.test('Leo') && !ID.test('a b c d e f g h') && !ID.test('x'.repeat(40)))
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
  controlla('una richiesta senza chiave o senza id è storta', !leggiRichiesta({ id: 'melody001' }).ok && !leggiRichiesta({ chiave: K }).ok)
  controlla('dati null: si legge soltanto', leggiRichiesta({ chiave: K, id: 'melody001', dati: null }).testo === null)
  controlla('dati che non sono un oggetto: no', !leggiRichiesta({ chiave: K, id: 'melody001', dati: [1] }).ok && !leggiRichiesta({ chiave: K, id: 'melody001', dati: 'x' }).ok)
  controlla('dati troppo grandi: no', !leggiRichiesta({ chiave: K, id: 'melody001', dati: { x: 'y'.repeat(MAX_DATI) } }).ok)
  let r = usa(undefined, 'melody001', '{"a":1}')
  controlla('la prima scrive e non trova nessuno', r.scritto && r.altro === null && r.posti.melody001 === '{"a":1}')
  r = usa(r.posti, 'leonardo1', null)
  controlla('l\'amico legge senza scrivere e trova la prima', !r.scritto && r.altro === '{"a":1}' && !('leonardo1' in r.posti))
  r = usa(r.posti, 'leonardo1', '{"b":2}')
  controlla('e scrivendo prende il suo posto', r.scritto && r.altro === '{"a":1}' && r.posti.leonardo1 === '{"b":2}')
  r = usa(r.posti, 'melody001', '{"a":3}')
  controlla('chi riscrive sostituisce la sua e legge quella dell\'altro', r.posti.melody001 === '{"a":3}' && r.altro === '{"b":2}')
  const terzo = usa(r.posti, 'estraneo01', '{"c":1}')
  controlla('un terzo non entra in una bacheca di due, nemmeno per leggere', terzo.rifiutato && !terzo.altro && !('estraneo01' in terzo.posti))
}
riassunto('amici: le regole del servizio')
