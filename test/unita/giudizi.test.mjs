/* ═══════════════════════════════════════════════════════════════════
   IL QUADERNO DEI GIUDIZI

   Quello che si può provare senza browser è la parte che decide **cosa
   parte davvero**: chi tocca due volte lo stesso tastino, e quanto è
   lungo il pacco una volta finito dentro un indirizzo.

   Il secondo è il controllo che conta, ed è l'unica cosa che qui dentro
   può rompersi in silenzio. I giudizi non hanno un server dove andare:
   viaggiano nella querystring del modulo di segnalazione, dove ogni
   carattere fuori dall'alfabeto ne occupa tre e ogni a capo pure. Un
   pacco troppo lungo non dà nessun errore — si fa tagliare a metà riga
   da un limite di qualcun altro, e quello che manca non lo sa nessuno.
   Quindi la misura si prende qui, su righe piene come quelle vere.

   I tre tastini e l'interruttore non si provano qui: sono schermo, e
   stanno in `test/integrazione/genitori.test.mjs`.
   ═══════════════════════════════════════════════════════════════════ */
import { aggiungi, riga, pacco, TETTO_INVIO, verdettoDi, VERDETTI }
  from '../../src/store/giudizi.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto }
  from '../aiuto/verifica.mjs'

const voce = (id, verdetto = 'difficile', extra = {}) => ({
  id, verdetto, quando: '2026-08-15T18:22:00.000Z',
  chi: 'Melody', gioco: 'dungeon', modulo: 'ortografia', grado: 3,
  chiave: 'orto:gn', tempo: 12.4, esito: 'sbagliata',
  testo: 'Quale parola si scrive con GN?', ...extra,
})

/* ══════════ 1. quello che si tiene ══════════ */
const uno = aggiungi([], voce('a'))
uguale('il primo giudizio entra', uno.length, 1)

const due = aggiungi(uno, voce('b', 'facile'))
stessaLista('il più recente sta in coda', due.map(v => v.id), ['a', 'b'])

/* ══════════ 2. il ripensamento ══════════
   È IL CASO CHE CONTA. `id` è una domanda comparsa a schermo una volta
   sola: chi tocca 😰 e poi ci ripensa e tocca 😴 ha cambiato idea su
   quella domanda, non ne ha giudicate due — e due righe che si
   contraddicono nel pacco sono peggio di nessuna. */
const ripensato = aggiungi(due, voce('a', 'facile'))
uguale('un secondo verdetto non aggiunge una riga', ripensato.length, 2)
uguale('vale l\'ultimo', ripensato.find(v => v.id === 'a').verdetto, 'facile')
uguale('e va in coda, che è dove sta il più recente',
       ripensato[ripensato.length - 1].id, 'a')

/* una voce senza id non si fonde con niente: è il caso di chi arriva
   da fuori (un import, una migrazione) e non porta l'id dietro */
const senzaId = aggiungi([voce('a')], { verdetto: 'storta' })
uguale('senza id si accoda e basta', senzaId.length, 2)

/* ══════════ 3. il tetto in archivio ══════════ */
let tanti = []
for (let i = 0; i < 30; i++) tanti = aggiungi(tanti, voce('n' + i), 8)
uguale('non se ne tengono più del tetto', aggiungi(tanti, voce('x'), 8).length, 8)

/* ══════════ 4. la riga ══════════ */
const r = riga(voce('a'))
controlla('il verdetto è il primo campo', r.startsWith('difficile'), r)
controlla('c\'è il modulo col grado', r.includes('ortografia 3'), r)
controlla('c\'è la tipologia', r.includes('orto:gn'), r)
controlla('c\'è quanto ci ha messo e com\'è finita', r.includes('12s sbagliata'), r)
controlla('e il testo per riconoscerla', r.includes('Quale parola'), r)
nota(r)

const lungo = riga(voce('a', 'facile', {
  testo: 'Quale di queste parole contiene il gruppo GN, quello che si legge tutto attaccato?' }))
controlla('un testo lungo si taglia', lungo.length < 130, lungo.length + ' caratteri')
controlla('e si vede che è tagliato', lungo.endsWith('…'), lungo)

const scarno = riga({ verdetto: 'storta', chiave: 'ora:quarti' })
controlla('i campi che non ci sono non lasciano vuoti',
          !scarno.includes('|  |') && !scarno.includes('| |'), scarno)

/* ══════════ 5. il pacco ══════════ */
uguale('senza giudizi non c\'è niente da mandare', pacco([]).testo, '')

const dieci = Array.from({ length: 10 }, (_, i) => voce('n' + i))
const p = pacco(dieci)
uguale('ci sono tutti', p.mandati, 10)
uguale('e non resta indietro nessuno', p.lasciati, 0)
controlla('in testa quanti sono', p.testo.startsWith('10 giudizi'), p.testo.split('\n')[0])
uguale('una riga per giudizio, più la testa', p.testo.split('\n').length, 11)

/* ══════════ 6. quando sono troppi ══════════
   Si mandano gli ultimi, e il pacco lo dice: un pacco corto che sa di
   esserlo si può completare, uno troncato da altri no. */
const troppi = Array.from({ length: TETTO_INVIO + 15 }, (_, i) => voce('n' + i))
const tagliato = pacco(troppi)
uguale('ne parte quanti ne regge un indirizzo', tagliato.mandati, TETTO_INVIO)
uguale('gli altri restano a casa', tagliato.lasciati, 15)
controlla('ed è scritto in testa', tagliato.testo.split('\n')[0].includes('piu recenti'),
          tagliato.testo.split('\n')[0])

/* ══════════ 7. LA MISURA CHE CONTA ══════════
   Il pacco pieno, codificato come ci finisce dentro l'indirizzo. Il
   tetto prudente è 6000: i browser reggono molto di più, ma un modulo
   dall'altra parte può avere il suo limite, e qui non si gioca al
   limite — si sta larghi e si lascia il resto in archivio. */
const pieno = pacco(Array.from({ length: TETTO_INVIO }, (_, i) => voce('n' + i, 'difficile', {
  /* la riga più cattiva possibile: nomi lunghi e testo che arriva al taglio */
  chi: 'Melody', gioco: 'survivors', modulo: 'coniugazione', chiave: 'verbi:congiuntivo',
  testo: 'Come si coniuga il verbo andare alla prima persona plurale del congiuntivo?',
})))
/* misurato come lo compone la schermata dei grandi — `URLSearchParams`,
   che gli spazi li scrive `+` e non `%20`: con una riga fatta quasi
   tutta di parole, è la differenza fra starci e non starci */
const dentroIndirizzo = new URLSearchParams({ giudizi: pieno.testo }).toString().length
nota(`il pacco pieno occupa ${dentroIndirizzo} caratteri nell'indirizzo`)
dentro('sta largo dentro un indirizzo', dentroIndirizzo, 1, 6000)

/* ══════════ 8. i verdetti ══════════ */
uguale('sono tre', VERDETTI.length, 3)
uguale('e si ritrovano per id', verdettoDi('facile').ico, '😴')
uguale('uno che non esiste non è un guasto', verdettoDi('boh'), null)

riassunto('Il quaderno dei giudizi')
