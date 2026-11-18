/* IL PROFILO IN MEMORIA DEI GIOCHI VERI A SCUOLA

   `bambinoInMemoria` (src/scuola/bambini/profilo.js) crea il profilo di casa per un alunno, coi sostituti della scuola
   applicati come nella build: muto, grafica bassa, niente disco; lo stesso alunno lo tiene, un altro riparte da zero;
   un traguardo non lascia `state.festa` piena (fermerebbe il gioco). Vedi docs/scuola/bambini.md.
   `node test/esegui.mjs scuola-profilo --niente-build` */
import { usati } from '../aiuto/sostituti-scuola.mjs'
import { indexedDBFinta, localStorageFinta } from '../aiuto/archivio-finto.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

let accessi = 0
const contato = o => new Proxy(o, { get(t, k, r) { accessi++; const v = Reflect.get(t, k, r); return typeof v === 'function' ? v.bind(t) : v } })
globalThis.indexedDB = contato(indexedDBFinta())
globalThis.localStorage = contato(localStorageFinta())

const { bambinoInMemoria } = await import('../../src/scuola/bambini/profilo.js')
const P = await import('../../src/store/profile.js')
const { fasciaAttiva } = await import('../../src/store/qualita.js')
const { acceso } = await import('../../src/audio.js')
const { chiavi } = await import('../../src/store/storage.js')

console.log('\nI SOSTITUTI')
controlla("l'archivio è quello in memoria", usati.has('src/scuola/sostituti/storage.js'))
controlla('i traguardi sono quelli vuoti', usati.has('src/scuola/sostituti/progressi.js'))

console.log('\nUN ALUNNO')
const id = await bambinoInMemoria('a1', 'Lorenzo')
uguale('è lui che gioca', P.state.player, id)
uguale('col suo nome', P.nomeCorrente(), 'Lorenzo')
controlla('il suono è spento', !acceso.value && P.state.profile.settings.sound === false)
uguale('la grafica è la bassa', fasciaAttiva(), 'bassa')
controlla('il profilo sta nell\'archivio in memoria', (await chiavi('profilo:')).includes('profilo:' + id))

console.log('\nLO STESSO ALUNNO LO TIENE, UN ALTRO RIPARTE')
P.answer('math:7x9', { correct: true, ms: 2000 })
uguale('lo stesso alunno (dall\'obiettivo al «dopo») ha lo stesso profilo', await bambinoInMemoria('a1', 'Lorenzo'), id)
controlla('con quello che ha già fatto', !!P.state.profile.items['math:7x9'])
const altro = await bambinoInMemoria('a2', 'Marta')
controlla('un altro alunno ha un profilo nuovo', altro !== id && P.state.player === altro)
controlla('che riparte da zero', !P.state.profile.items['math:7x9'])
const insieme = await Promise.all([bambinoInMemoria('a3', 'Ada'), bambinoInMemoria('a3', 'Ada')])
controlla('due richieste insieme danno un profilo solo', insieme[0] === insieme[1])
uguale('senza nome si chiama «Bambino»', (await bambinoInMemoria('a4', '  '), P.nomeCorrente()), 'Bambino')

console.log('\nLA FESTA NON FERMA IL GIOCO')
P.segna('math', 5000)
P.segnaBest('serieMath', 500)
uguale('tante giuste non riempiono la festa (i traguardi della scuola sono vuoti)', P.state.festa.length, 0)
P.state.festa = [{ id: 'prova' }]
uguale('e se qualcuno la riempie si svuota subito', P.state.festa.length, 0)

console.log('\nIL DISCO NON SI TOCCA')
uguale('nessun accesso a IndexedDB né a localStorage', accessi, 0)

riassunto('il profilo della scuola')
