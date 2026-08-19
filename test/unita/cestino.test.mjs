/* ═══════════════════════════════════════════════════════════════════
   IL CESTINO — cancellare non è più per sempre

   Il codice davanti alla schermata dei grandi non ha mai protetto dal
   caso che capita davvero: il grande stanco che tocca la carta rossa e
   conferma. Da qui in poi ogni gesto distruttivo lascia dietro una
   copia, e questo file prova che la copia c'è, che rimetterla riporta
   indietro i progressi, e che un bambino eliminato torna anche
   nell'elenco di chi gioca — un profilo che nessuno nomina sarebbe un
   salvataggio invisibile.

   Senza browser: `store/storage.js` degrada da sé all'archivio in
   memoria, che qui è un archivio come un altro.
   ═══════════════════════════════════════════════════════════════════ */
import { state, init, creaGiocatore, selectPlayer, resetPlayer,
         eliminaGiocatore, ripristinaCestinato, addCoins } from '../../src/store/profile.js'
import { leggiCestino, svuotaCestino } from '../../src/store/cestino.js'
import { remove, chiavi } from '../../src/store/storage.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

async function pulisci() {
  for (const k of await chiavi('')) await remove(k)
  state.giocatori = []
  state.player = ''
  await svuotaCestino()
}

/* ── 1. cancellare i progressi ── */
await pulisci()
await init()
await creaGiocatore('Uno')
addCoins(120)
/* quante ne ha davvero: il profilo nuovo ne regala qualcuna per conto
   suo (la giornata aperta), e il cestino deve rimettere *quelle*. */
const prima = state.profile.coins
await resetPlayer()

uguale('cancellare azzera davvero le monete', state.profile.coins, 0)
let cesto = await leggiCestino()
uguale('e nel cestino c\'è una copia', cesto.length, 1)
uguale('col nome di chi è', cesto[0].nome, 'Uno')

await ripristinaCestinato(cesto[0].quando)
/* «almeno» e non «uguale»: rimettere una copia passa da `selectPlayer`,
   che riapre la giornata e ricontrolla i traguardi — un premio che al
   momento della copia non era ancora stato riscosso arriva adesso. È il
   comportamento giusto, e legarci un numero esatto renderebbe questo
   test rosso ogni volta che si tocca un traguardo. */
controlla('rimessa, le monete tornano', state.profile.coins >= prima)

cesto = await leggiCestino()
uguale('e la copia resta lì: un ripristino sbagliato si annulla col giusto',
       cesto.length, 1)

/* ── 2. eliminare un bambino ──
   Il caso peggiore: il profilo sparisce dall'archivio *e* il nome
   dall'elenco. Rimetterlo deve rifare tutti e due. */
await pulisci()
await init()
const a = await creaGiocatore('Due')
addCoins(50)
const sue = state.profile.coins
const b = await creaGiocatore('Tre')          // così ne resta uno dopo
await selectPlayer(a)
await eliminaGiocatore(a)

controlla('eliminato, non è più nell\'elenco', !state.giocatori.some(g => g.id === a))
cesto = await leggiCestino()
uguale('ma la copia c\'è', cesto[0].nome, 'Due')

await ripristinaCestinato(cesto[0].quando)
controlla('rimesso, torna nell\'elenco', state.giocatori.some(g => g.id === a))
uguale('e il gioco passa a lui', state.player, a)
controlla('coi suoi progressi', state.profile.coins >= sue)

/* ── 3. quante se ne tengono ──
   Tre, e le più recenti: su localStorage — il ripiego quando IndexedDB
   non risponde — tenerne dieci farebbe fallire la scrittura del profilo
   vero, che è il contrario dello scopo. */
await pulisci()
await init()
await creaGiocatore('Quattro')
for (let i = 0; i < 5; i++) { addCoins(1); await resetPlayer() }
cesto = await leggiCestino()
uguale('non se ne accumulano più di tre', cesto.length, 3)
controlla('e la prima è la più fresca',
          cesto[0].quando >= cesto[cesto.length - 1].quando)

nota('il cestino sta fuori dai profili: dentro morirebbe con quello che si cancella')
riassunto('Il cestino: cancellare non è più per sempre')
