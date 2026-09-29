/* ═══════════════════════════════════════════════════════════════════
   L'ARCHIVIO PIÙ ROBUSTO — vedi docs/core/archivio.md

   Gli altri test di `store/storage.js` girano fuori dal browser, dove
   `indexedDB` e `localStorage` non esistono e tutto degrada da sé
   all'archivio in memoria: giusto per il roster e i profili, ma cieco
   proprio sui guasti che contano qui — il timeout che non deve essere
   definitivo, il travaso del ripiego, la corsa fra due `flush()`. Qui
   si finge un IndexedDB e un localStorage veri (`aiuto/archivio-finto.js`)
   per vederli succedere davvero, col tempo scorciato con
   `_impostaTempiPerTest` così la suite resta in secondi.
   ═══════════════════════════════════════════════════════════════════ */
import { load, save, flush, detectBackend, travasaRipiego,
         chiediPersistenza, persistenza, backend,
         _azzeraPerTest, _impostaTempiPerTest } from '../../src/store/storage.js'
import { indexedDBFinta, localStorageFinta, unGiro } from '../aiuto/archivio-finto.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

// tempi scorciati per tutto il file: 40 ms l'attesa di ogni giorno,
// 150 ms quella (più lunga) di avvio
_impostaTempiPerTest({ apertura: 40, avvio: 150 })

function installa(opzioni) {
  _azzeraPerTest()
  const idb = indexedDBFinta(opzioni)
  const ls = localStorageFinta()
  globalThis.indexedDB = idb
  globalThis.localStorage = ls
  return { idb, ls }
}

/* ── 1. IL TIMEOUT NON È DEFINITIVO ──
   IndexedDB risponde più tardi del tempo che una scrittura normale è
   disposta ad aspettare (80 ms contro i 40 di `apertura`): la prima
   scrittura cade sul ripiego. Ma una volta che IndexedDB ha davvero
   risposto, quella dopo lo trova pronto e ci scrive direttamente —
   niente costringe a restare sul ripiego solo perché la prima volta
   non ce l'ha fatta in tempo. */
{
  const { idb, ls } = installa({ ritardoApertura: 80 })

  save('k1', 'vecchio-ripiego')
  await flush()
  controlla('la prima scrittura, troppo lenta, cade sul ripiego', ls._dati.has('k1'))
  controlla('e IndexedDB non ce l\'ha ancora', !idb._store.has('k1'))

  await unGiro(100)   // ora IndexedDB ha davvero risposto (80 ms)

  save('k2', 'fresco')
  await flush()
  controlla('la scrittura dopo, con IndexedDB pronto, ci scrive direttamente',
             idb._store.has('k2'))
  controlla('senza passare dal ripiego', !ls._dati.has('k2'))

  uguale('e si rilegge quello che è', await load('k1'), 'vecchio-ripiego')
  uguale('anche l\'altro', await load('k2'), 'fresco')
}

/* ── 2. ALL'AVVIO SI ASPETTA DI PIÙ ──
   Lo stesso ritardo (80 ms) che sopra faceva cadere sul ripiego qui non
   fa scattare niente, perché `detectBackend()` — la lettura di avvio —
   usa il tempo più lungo (150 ms > 80). Concludere troppo presto che
   IndexedDB non c'è manda un bambino vero a «come ti chiami?». */
{
  installa({ ritardoApertura: 80 })
  const esito = await detectBackend()
  uguale('IndexedDB arriva in tempo per l\'avvio', esito, 'IndexedDB')
  uguale('e l\'archivio lo sa', backend.kind, 'IndexedDB')
}

/* ── 3. IL TRAVASO: TRACCIATO VINCE, VECCHIO NO ──
   «Il ripiego è il più recente» è vero SOLO per le chiavi che questo
   stesso codice ha scritto lui e non ha ancora ripulito (il registro
   `__ripiego__`): un telefono vero può avere in localStorage chiavi
   vecchie di mesi, nate quando IndexedDB falliva prima che questa pulizia
   esistesse, con IndexedDB nel frattempo pieno di dati più freschi — per
   quelle vince IndexedDB, come sempre. */
{
  // 80 ms: più dei 40 di `apertura` (la scrittura cade sul ripiego), meno
  // dei 150 di `avvio` (il travaso, che aspetta di più, trova IndexedDB)
  const { idb, ls } = installa({ ritardoApertura: 80 })

  // una scrittura VERA, tracciata: cade sul ripiego perché IndexedDB non
  // risponde in tempo
  save('tracciata', 'valore-fresco')
  await flush()
  controlla('è caduta sul ripiego', ls._dati.has('tracciata'))

  // IndexedDB nel frattempo AVEVA già una sua copia per quella stessa
  // chiave (uno scenario possibile: un valore vecchio scritto prima
  // dell'interruzione) — la tracciata vince comunque, perché è lei
  // l'ultima scrittura fatta per davvero
  idb._store.set('tracciata', 'idb-piu-vecchio-di-lei')

  // una chiave VECCHIA, mai passata da `save`/`flush` in questa sessione:
  // localStorage com'era mesi fa, da prima che il ripiego si ripulisse da
  // solo. IndexedDB ha già la sua, più fresca: non si tocca.
  idb._store.set('vecchia-con-idb-pieno', 'idb-vero-e-fresco')
  ls._dati.set('vecchia-con-idb-pieno', JSON.stringify('ls-spazzatura-di-mesi-fa'))

  // una chiave vecchia ma con IndexedDB vuoto: qui non c'è niente da
  // proteggere, quindi si sposta per riempire il buco
  ls._dati.set('vecchia-con-idb-vuoto', JSON.stringify('unico-valore-che-esiste'))

  // il probe di `detectBackend` non è un dato del gioco: non si tocca
  ls._dati.set('__probe__', '1')

  const quante = await travasaRipiego()

  uguale('la chiave tracciata vince anche su una copia già in IndexedDB',
         idb._store.get('tracciata'), 'valore-fresco')
  controlla('e sparisce dal ripiego', !ls._dati.has('tracciata'))

  uguale('la chiave vecchia NON scrive sopra IndexedDB, che vince',
         idb._store.get('vecchia-con-idb-pieno'), 'idb-vero-e-fresco')

  uguale('ma una chiave vecchia senza niente in IndexedDB riempie il buco',
         idb._store.get('vecchia-con-idb-vuoto'), 'unico-valore-che-esiste')

  controlla('il probe di avvio non si travasa', ls._dati.has('__probe__'))
  controlla('e non finisce in IndexedDB', !idb._store.has('__probe__'))

  uguale('due chiavi davvero spostate (la terza, vecchia, perde e resta ferma)', quante, 2)
}

/* ── 4. FLUSH SERIALIZZATO ──
   Due `flush()` in corsa non devono poter scrivere una chiave vecchia
   sopra una nuova. Qui la scrittura vecchia è quella lenta (60 ms
   contro 5): senza una coda che li mette in fila, la scrittura nuova
   (svelta) potrebbe arrivare su disco per prima, e quella vecchia
   arrivarci sopra un attimo dopo — cancellando la risposta giusta con
   quella di prima. */
{
  const { idb } = installa({ ritardiPut: [60, 5] })

  save('k', 'vecchio')
  const p1 = flush()
  await unGiro(5)          // lascia partire la scrittura lenta prima di aggiungerne un'altra
  save('k', 'nuovo')
  const p2 = flush()
  await Promise.all([p1, p2])

  uguale('vince la scrittura nuova, non quella arrivata dopo su disco',
         idb._store.get('k'), 'nuovo')
  uguale('e si rilegge quella giusta', await load('k'), 'nuovo')
}

/* ── 5. `navigator.storage.persist()` ──
   Chiesto una volta sola: una seconda chiamata non tocca più il
   browser, e senza supporto (il caso di default fuori da un vero
   browser) resta «non si sa». */
{
  installa({})
  uguale('senza supporto, non si sa', await chiediPersistenza(), null)
  uguale('e lo dice anche lo stato', persistenza.concessa, null)
  controlla('ma segna che l\'ha già chiesto', persistenza.chiesta)

  _azzeraPerTest()
  let chiamate = 0
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { storage: { persist: async () => { chiamate++; return true } } },
  })
  uguale('con il supporto, la risposta del browser', await chiediPersistenza(), true)
  uguale('una seconda volta non richiede di nuovo', await chiediPersistenza(), true)
  uguale('il browser è stato interpellato una volta sola', chiamate, 1)
}

nota('IndexedDB e localStorage qui sono finti: aiuto/archivio-finto.js')
riassunto('L\'archivio più robusto: timeout, travaso, flush in coda')
