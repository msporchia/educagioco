/* L'ARCHIVIO DELLA SCUOLA STA IN MEMORIA

   `src/scuola/sostituti/storage.js` prende il posto di `store/storage.js` nella pagina dei bambini: salva e rilegge
   copie, e non tocca mai il disco del PC della classe (un IndexedDB e un localStorage finti contano gli accessi).
   Vedi docs/scuola/architettura.md. `node test/esegui.mjs scuola-archivio --niente-build` */
import { indexedDBFinta, localStorageFinta } from '../aiuto/archivio-finto.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

let accessi = 0
const contato = o => new Proxy(o, { get(t, k, r) { accessi++; const v = Reflect.get(t, k, r); return typeof v === 'function' ? v.bind(t) : v } })
globalThis.indexedDB = contato(indexedDBFinta())
globalThis.localStorage = contato(localStorageFinta())
globalThis.sessionStorage = contato(localStorageFinta())

const A = await import('../../src/scuola/sostituti/storage.js')

console.log('\nSALVA E RILEGGE COPIE')
uguale('il backend è la memoria', await A.detectBackend(), 'memoria')
controlla('ed è pronto', A.backend.ready)
const profilo = { coins: 3, items: { 'math:7x9': { s: 1 } } }
A.save('profilo:g1', profilo)
profilo.coins = 99
uguale('cambiare l\'oggetto dopo averlo salvato non cambia il salvato', (await A.load('profilo:g1')).coins, 3)
const letto = await A.load('profilo:g1')
letto.items['math:7x9'].s = 42
uguale('cambiare quello che si è letto nemmeno', (await A.load('profilo:g1')).items['math:7x9'].s, 1)
uguale('una chiave mai scritta è null', await A.load('niente'), null)
A.save('profilo:g2', { coins: 0 })
A.save('qualita', { scelta: 'bassa' })
stessaLista('le chiavi per prefisso, in ordine', await A.chiavi('profilo:'), ['profilo:g1', 'profilo:g2'])
await A.remove('profilo:g1')
stessaLista('una chiave tolta non c\'è più', await A.chiavi('profilo:'), ['profilo:g2'])
await A.flush()
uguale('il travaso non sposta niente', await A.travasaRipiego(), 0)
uguale('la persistenza non si chiede', await A.chiediPersistenza(), null)
A._azzeraPerTest()
uguale('azzerato, l\'archivio è vuoto', (await A.chiavi()).length, 0)

console.log('\nIL DISCO NON SI TOCCA')
uguale('nessun accesso a IndexedDB, localStorage o sessionStorage', accessi, 0)

riassunto("l'archivio della scuola")
