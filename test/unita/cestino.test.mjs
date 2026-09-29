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
         eliminaGiocatore, ripristinaCestinato, addCoins,
         anteprimaImportazione, importaTutto } from '../../src/store/profile.js'
import { leggiCestino, svuotaCestino, voceCestinata } from '../../src/store/cestino.js'
import { remove, chiavi, save, load, flush } from '../../src/store/storage.js'
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

/* ── 4. rimettere da un file passa dal cestino ──
   Un file di un'altra famiglia con lo stesso id (`g1`) non deve
   schiacciare il bambino di casa senza che il grande lo veda: prima si
   vede chi verrebbe sostituito, poi — solo se si conferma — si scrive
   sopra, e quello che c'era finisce in cestino. */
await pulisci()
await init()
const casa = await creaGiocatore('Cinque')
addCoins(77)
const dellaCasa = state.profile.coins

const file = {
  tipo: 'giochi-bambini', v: 2, esportato: '2026-09-12T10:00:00.000Z',
  giocatori: [{ id: casa, nome: 'Un\'altra famiglia' }],
  profili: { [casa]: { v: 7, coins: 999, items: {}, totals: {} } },
}

const anteprima = anteprimaImportazione(file)
uguale('si vede chi verrebbe sostituito', anteprima.sostituiti.length, 1)
uguale('col nome di adesso', anteprima.sostituiti[0].nomeAttuale, 'Cinque')
uguale('e con quello che porta il file', anteprima.sostituiti[0].nomeFile, 'Un\'altra famiglia')
uguale('e la data del file arriva intera', anteprima.esportato, file.esportato)

await importaTutto(file)
cesto = await leggiCestino()
uguale('il profilo di casa, prima di essere sostituito, finisce in cestino', cesto[0].nome, 'Cinque')
uguale('col motivo giusto', cesto[0].motivo, 'importazione')
uguale('con le monete di prima', (await voceCestinata(cesto[0].quando)).profilo.coins, dellaCasa)
uguale('e adesso ci sono quelle del file', state.profile.coins, 999)

await ripristinaCestinato(cesto[0].quando)
uguale('rimessa la copia, le monete di casa tornano', state.profile.coins, dellaCasa)

/* Un file senza collisioni (un telefono nuovo) non deve mettere via
   niente: non c'è nessun profilo di casa da proteggere. */
await pulisci()
await init()
const file2 = { tipo: 'giochi-bambini', v: 2, giocatori: [{ id: 'gX', nome: 'Sette' }],
                profili: { gX: { v: 7, coins: 5, items: {}, totals: {} } } }
uguale('senza collisioni non c\'è nessuno da sostituire',
       anteprimaImportazione(file2).sostituiti.length, 0)
await importaTutto(file2)
uguale('e il cestino resta vuoto', (await leggiCestino()).length, 0)

/* ── 5. una migrazione da una versione vecchia lascia una copia ──
   `selectPlayer` la scrive PRIMA che la migrazione tocchi il profilo:
   se la migrazione fosse sbagliata, l'originale non si perde. */
await pulisci()
save('giocatori', [{ id: 'g1', nome: 'Otto' }])
save('profilo:g1', { v: 6, coins: 42, items: {}, totals: {} })
await flush()
await init()

uguale('il profilo è stato migrato alla versione di oggi', state.profile.v, 7)
cesto = await leggiCestino()
uguale('e la versione di ieri è finita in cestino', cesto[0].motivo, 'migrazione')
const primaDellaMigrazione = await voceCestinata(cesto[0].quando)
uguale('con dentro il suo vecchio numero di versione', primaDellaMigrazione.profilo.v, 6)
uguale('e le sue monete', primaDellaMigrazione.profilo.coins, 42)

/* Un profilo già alla versione di oggi non deve rimigrare (e non deve
   riempire il cestino) a ogni riavvio. */
await selectPlayer('g1')
uguale('una seconda lettura, già alla versione giusta, non aggiunge copie',
       (await leggiCestino()).length, 1)

nota('il cestino sta fuori dai profili: dentro morirebbe con quello che si cancella')
riassunto('Il cestino: cancellare non è più per sempre')
