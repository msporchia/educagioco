/* ═══════════════════════════════════════════════════════════════════
   IL LIBRETTO DEGLI INCIDENTI

   Quello che si può provare senza browser è la parte che decide COSA
   resta scritto: il tetto e il conteggio dei doppioni. Non è pignoleria
   — è il motivo per cui il libretto esiste. Un errore dentro il giro di
   disegno si ripete a ogni fotogramma, e una lista che li accoglie
   tutti diventa lei il guasto: l'archivio si gonfia, e l'unica riga che
   contava — la prima, quella che dice da dove è partito — viene spinta
   fuori dalle sessanta copie di sé stessa arrivate dopo.

   Il cartello e la riparazione non si provano qui: sono DOM e service
   worker, e non c'è modo di farli girare senza schermo. Si provano
   guardandoli, ed è scritto in `src/incidenti.js` cosa devono fare.
   ═══════════════════════════════════════════════════════════════════ */
import { aggiungi, testoDi, testoDaMandare } from '../../src/incidenti.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const voce = (testo, dove = 'vue') => ({ quando: '2026-08-12T10:00:00.000Z', dove, testo })

/* ══════════ 1. quello che si tiene ══════════ */
const uno = aggiungi([], voce('TypeError: x non è una funzione'))
uguale('il primo guasto entra', uno.length, 1)
uguale('e si conta una volta', uno[0].volte, 1)

const due = aggiungi(uno, voce('altro guasto'))
stessaLista('il più recente sta in coda', due.map(v => v.testo),
            ['TypeError: x non è una funzione', 'altro guasto'])

/* ══════════ 2. il tetto ══════════ */
let tanti = []
for (let i = 0; i < 30; i++) tanti = aggiungi(tanti, voce('guasto numero ' + i), 8)
uguale('non se ne tengono più di otto', tanti.length, 8)
uguale('e sono gli ultimi', tanti[7].testo, 'guasto numero 29')
uguale('i primi se ne sono andati', tanti[0].testo, 'guasto numero 22')

/* ══════════ 3. lo stesso guasto che si ripete ══════════
   È IL CASO CHE CONTA. Sessanta copie al secondo non devono spingere
   fuori niente: restano una riga sola che dice quante volte. */
let martellato = [voce('prima di tutto')]
for (let i = 0; i < 60; i++) martellato = aggiungi(martellato, voce('TypeError: nel disegno'), 8)
uguale('due righe, non sessantuno', martellato.length, 2)
uguale('la prima è ancora lì', martellato[0].testo, 'prima di tutto')
uguale('e il doppione si conta', martellato[1].volte, 60)

/* stesso testo ma da un'altra parte è un altro guasto: sapere se lancia
   il disegno o una promessa è metà della diagnosi */
const altrove = aggiungi(martellato, voce('TypeError: nel disegno', 'promessa'), 8)
uguale('lo stesso testo da un altro posto è una riga sua', altrove.length, 3)

/* ══════════ 4. la lista sporca ══════════
   L'archivio è roba che sopravvive agli aggiornamenti: quello che c'è
   dentro non è detto sia quello che ci si aspetta. */
uguale('una lista che non è una lista non fa cadere niente',
       aggiungi(null, voce('dopo un archivio vuoto')).length, 1)
uguale('e i buchi si buttano',
       aggiungi([null, 'roba', voce('vera')], voce('nuova')).length, 2)

/* ══════════ 5. il testo di un errore ══════════
   Arriva in quattro forme, e nessuna delle quattro deve uscire come
   «[object Object]»: quello che si legge in archivio è tutto quello che
   si avrà in mano. */
uguale('un Error si legge nome e messaggio',
       testoDi(new TypeError('x non è una funzione')), 'TypeError: x non è una funzione')
uguale('una stringa resta sé stessa', testoDi('rotto e basta'), 'rotto e basta')
uguale('niente non è un guasto senza nome', testoDi(null), 'errore senza nome')
controlla('un oggetto qualunque dice qualcosa', typeof testoDi({ a: 1 }) === 'string')

/* ══════════ 6. il testo da mandare ══════════
   Quello che «Copia» e «Invia» danno a chi deve capire: la versione di
   adesso in testa, il guasto più recente per primo, la pila sotto. */
const mandato = testoDaMandare([
  { ...voce('il primo'), versione: 'v1', pila: 'at a (x.js:1)' },
  { ...voce('sotterraneo: l\'altro se n\'è andato', 'sfida'), versione: 'v2', volte: 3, dettagli: ['tick 700'] },
], 'v3')
controlla('in testa la versione di adesso', mandato.startsWith('Ultimi inciampi di Educagioco v3'))
controlla('il più recente prima', mandato.indexOf('sotterraneo') < mandato.indexOf('il primo'))
controlla('con quante volte, la pila e i dettagli', /3 volte/.test(mandato) && mandato.includes('at a (x.js:1)') && mandato.includes('tick 700'))
uguale('un libretto vuoto è la testa sola', testoDaMandare([], 'v3'), 'Ultimi inciampi di Educagioco v3')

riassunto('il libretto degli incidenti')
