/* Il tetto di tempo della misura coi modelli veri (docs/core/vecchio-telefono-veri.md, «Il tetto di tempo e il lettore»): una scena che non finisce
   (la sua preparazione non si risolve, o non arrivano fotogrammi) diventa «non regge: tempo scaduto», il gruppo si rifà da capo e la
   scena dopo si misura; un gruppo che non si carica entro il tetto è «non regge» per tutte le sue scene. Senza browser: finti
   requestAnimationFrame, finestra e documento. */
import { eseguiVeri, conTetto } from '../../src/grafica/benchmark/veri.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const tela = { getContext: () => null }
globalThis.window ??= globalThis
globalThis.addEventListener ??= () => {}
globalThis.removeEventListener ??= () => {}
globalThis.innerWidth ??= 400; globalThis.innerHeight ??= 800
globalThis.document ??= { hidden: false, createElement: () => tela }
globalThis.requestAnimationFrame ??= f => setTimeout(() => f(performance.now()), 16)

let r = null
try { await conTetto(new Promise(() => {}), 30, 'la prova') } catch (e) { r = e.message }
uguale('conTetto: una promessa che non torna scade', r, 'tempo scaduto (la prova oltre 0 s)')
uguale('conTetto: una che torna passa', await conTetto(Promise.resolve(7), 1000, 'x'), 7)

// una famiglia finta: `scena` della scena «ferma» non si risolve mai; si conta quante volte il gruppo si prepara e si butta
let preparate = 0, buttate = 0
const famiglia = () => ({
  prepara: async () => {
    preparate++
    return { gl: () => null, conti: () => ({ ch: 3, tri: 1000, programmi: 1 }), scena: s => (s.ferma ? new Promise(() => {}) : Promise.resolve()), via() { buttate++ } }
  },
})
const tappe = [
  { gruppo: 'prova', carica: async () => famiglia(), scene: [{ id: 'a', nome: 'prima' }, { id: 'ferma', nome: 'ferma', ferma: true }, { id: 'b', nome: 'dopo' }] },
  { gruppo: 'lento', carica: () => new Promise(() => {}), scene: [{ id: 'c', nome: 'mai caricata' }] },
  { gruppo: 'ultimo', carica: async () => famiglia(), scene: [{ id: 'd', nome: 'ultima' }] },
]
const nomi = []
const dati = await eseguiVeri({ contenitore: null, corto: true, raffredda: 0, solo: ['a', 'ferma', 'b', 'c', 'd'], tappe, tetti: { scena: 200, carica: 300 },
  progresso: (i, n, nome) => nomi.push(`${i + 1}/${n} ${nome}`) })
const di = id => dati.risultati.find(x => x.id === id)
controlla('la scena prima si misura', di('a') && !di('a').errore && di('a').ms != null, JSON.stringify(di('a')))
controlla('quella ferma non regge per il tempo', di('ferma') && /tempo scaduto/.test(di('ferma').errore), JSON.stringify(di('ferma')))
controlla('la prova va avanti: la scena dopo si misura', di('b') && !di('b').errore && di('b').ms != null, JSON.stringify(di('b')))
uguale('il gruppo si è rifatto da capo dopo il tempo scaduto (e l\'ultimo gruppo una volta)', preparate, 3)
uguale('e ogni preparazione è stata buttata', buttate, 3)
controlla('il gruppo che non si carica non regge', di('c') && /tempo scaduto/.test(di('c').errore), JSON.stringify(di('c')))
controlla('e l\'ultimo si misura', di('d') && !di('d').errore)
uguale('il totale sono le scene, non le pause', nomi.filter(x => /^\d+\/5 /.test(x)).length, nomi.length)
riassunto('il tetto di tempo della misura')
