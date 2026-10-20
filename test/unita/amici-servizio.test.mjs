/* Le regole del servizio degli amici (`servizio/inoltro/src/coppia.js` e `codici.js`), senza Cloudflare: due posti, chi rientra
   prende il suo posto, i messaggi controllati; i codici brevi, i tentativi sbagliati. Docs: docs/core/amici.md */
import { ammetti, altroDi, controllaMessaggio, MAX_BYTE, MAX_AL_SECONDO, ID, CHIAVE } from '../../servizio/inoltro/src/coppia.js'
import { nuovoCodice, contaErrore, bloccato, CODICE, ALFABETO, ERRORI_AL_MINUTO } from '../../servizio/inoltro/src/codici.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

{
  const a = { id: 'leonardo1' }, b = { id: 'melody001' }
  uguale('il primo entra', ammetti([], 'leonardo1').esito, 'nuovo')
  uguale('il secondo entra', ammetti([a], 'melody001').esito, 'nuovo')
  uguale('un terzo non entra', ammetti([a, b], 'estraneo01').esito, 'piena')
  const r = ammetti([a, b], 'melody001')
  controlla('chi rientra con lo stesso id prende il posto del suo collegamento', r.esito === 'sostituisce' && r.vecchio === b)
  controlla('anche se è solo, e il posto non si raddoppia', ammetti([a], 'leonardo1').esito === 'sostituisce')
  const ws1 = {}, ws2 = {}, s1 = { id: 'leonardo1', ws: ws1 }, s2 = { id: 'melody001', ws: ws2 }
  controlla('l\'altro di un collegamento è l\'altro', altroDi([s1, s2], ws1) === s2 && altroDi([s1], ws1) === null)
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
riassunto('amici: le regole del servizio')
