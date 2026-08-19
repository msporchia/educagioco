/* ═══════════════════════════════════════════════════════════════════
   LA POSTA DEI GRANDI — che arrivi, e che non arrivi a chi non serve

   Il canale verso il genitore non esiste: niente server, niente
   indirizzo di posta, e chi ha ricevuto il gioco da un'altra famiglia
   non lo conosce nessuno. Questa è tutta la macchina che ha preso il
   posto del dirlo a voce, e le due cose che deve azzeccare sono
   entrambe silenziose se sbagliate:

   - **chi installa oggi non riceve la storia del progetto in faccia**;
   - **chi c'era già non si perde quello che è cambiato**.

   Fra le due c'è un solo bivio, e non costa nessuno stato in più: al
   primo avvio, se in casa non c'è nemmeno un profilo è
   un'installazione nuova.
   ═══════════════════════════════════════════════════════════════════ */
import { scegli, initPosta, laPosta, segnaLetta, avvisa, daLeggere } from '../../src/store/posta.js'
import { NOTE, ULTIMA } from '../../src/guide/novita.js'
import { save, remove, chiavi, flush } from '../../src/store/storage.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

async function pulisci() { for (const k of await chiavi('')) await remove(k) }

/* ── 1. la regola, con note finte ──
   Il contenuto di `novita.js` cambia ogni volta che c'è qualcosa da
   dire; la regola no, e si prova su note che non cambiano mai. */
const FINTE = [
  { id: 1, titolo: 'una' },
  { id: 2, titolo: 'due' },
  { id: 3, titolo: 'tre, per chi ha un bambino grande', riguarda: { etaDa: 8 } }
]

uguale('mai letto niente: si vede tutto', scegli(FINTE, undefined).length, 3)
uguale('le più fresche in cima', scegli(FINTE, 0)[0].id, 3)
uguale('letto fino alla seconda: ne resta una', scegli(FINTE, 2).length, 1)
uguale('letto tutto: niente', scegli(FINTE, 3).length, 0)

uguale('la nota mirata non arriva a chi ha solo bambini piccoli',
       scegli(FINTE, 2, [6]).length, 0)
uguale('e arriva a chi ne ha uno grande', scegli(FINTE, 2, [6, 9]).length, 1)
uguale('senza sapere le età si mostra lo stesso: non sapere non è nascondere',
       scegli(FINTE, 2, []).length, 1)

/* ── 2. il primo avvio di un'installazione nuova ──
   Archivio vuoto: nessun profilo, quindi nessuno a cui interessi cosa è
   cambiato la primavera scorsa. */
await pulisci()
uguale('installazione nuova: niente da leggere', await initPosta(), 0)

/* ── 3. il primo avvio di una casa che giocava già ──
   Il profilo c'è, il segno no: queste note non le ha mai viste nessuno,
   perché prima non c'era dove metterle. */
await pulisci()
save('profilo:Uno', { v: 6, coins: 0, items: {}, settings: {} })
await flush()
uguale('chi giocava già le vede tutte', await initPosta(), NOTE.length)
controlla('e il nastro in home lo sa', daLeggere.value === NOTE.length)

/* ── 4. «ho letto» ── */
uguale('letto: il pallino si spegne', await segnaLetta(), 0)
uguale('e il segno arriva all\'ultima nota scritta', (await laPosta()).note.length, 0)

/* ── 5. gli avvisi ──
   Non sono note dichiarate: sono fatti capitati su questo telefono — il
   codice rimesso a 0000 — che un grande deve poter scoprire anche se non
   c'era. */
uguale('un avviso riaccende la posta', await avvisa('il codice è tornato a 0000'), 1)
uguale('e si legge com\'è stato scritto',
       (await laPosta()).avvisi[0].testo, 'il codice è tornato a 0000')
uguale('«ho letto» li butta: sono fatti, non consigli', await segnaLetta(), 0)

nota('ULTIMA vale ' + ULTIMA + ': gli id non si riusano mai, nemmeno ritirando una nota')
riassunto('La posta dei grandi: chi la riceve e chi no')
