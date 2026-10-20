/* L'inventario della fattoria 3D: quali merci stanno in quale scheda, l'ordine, «a cosa serve» e la roba nuova. Senza DOM.
   Vedi docs/fattoria3d/file.md. `node test/esegui.mjs fattoria3d-inventario`
   tempo: 1 */
import { schedeDellInventario, tipiDi, serveA, dettaglioDi, robaNuova, contoDi } from '../../src/giochi/fattoria3d/viste/inventario-puro.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { livelloDellaColtura } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
const ugualeJ = (nome, a, b) => uguale(nome, JSON.stringify(a), JSON.stringify(b))

const s = { merci: { grano: 9, carota: 0 }, prodotti: { farina: 2, uova: 3, latte: 0 }, lana: 5 }
const q = schedeDellInventario(s, 1)
ugualeJ('i raccolti sono le colture del livello, nell\'ordine dei dati', q.raccolti.map(v => v.k), Object.keys(COLTURE).filter(k => livelloDellaColtura(k) <= 1))
controlla('grano pieno, le altre velate', q.raccolti.find(v => v.k === 'grano').n === 9 && q.raccolti.filter(v => v.k !== 'grano').every(v => v.velata))
controlla('un raccolto che hai ma non è del livello si vede lo stesso', schedeDellInventario({ merci: { riso: 2 } }, 1).raccolti.some(v => v.k === 'riso' && !v.velata))
ugualeJ('i prodotti sono solo le ricette che hai', q.prodotti.map(v => v.k), ['farina'])
ugualeJ('lana e altro: lana, uova (non il latte a zero)', q.altro.map(v => v.k), ['lana', 'uova'])
ugualeJ('i tipi si contano per n > 0', [tipiDi(q.raccolti), tipiDi(q.prodotti), tipiDi(q.altro)], [1, 1, 2])
ugualeJ('niente roba: schede di prodotti e altro vuote', [schedeDellInventario({}, 1).prodotti.length, schedeDellInventario({}, 1).altro.length], [0, 0])
controlla('la farina serve al pane', serveA('farina').includes('Pane'))
controlla('il dettaglio della farina dice dove si fa e a cosa serve', /Mulino/.test(dettaglioDi('farina')) && /Pane/.test(dettaglioDi('farina')))
controlla('una merce che nessuna ricetta usa lo dice', /banco|mongolfiera/.test(dettaglioDi('berretto')))
ugualeJ('una chiave sconosciuta non dice niente', dettaglioDi('boh'), '')
const visto = contoDi(s)
controlla('uguale a prima: niente di nuovo', !robaNuova(visto, s))
controlla('consumare non è roba nuova', !robaNuova(visto, { ...s, merci: { grano: 3 } }))
controlla('un aumento è roba nuova', robaNuova(visto, { ...s, merci: { grano: 10 } }))
controlla('un tipo mai visto è roba nuova', robaNuova(visto, { ...s, prodotti: { ...s.prodotti, pane: 1 } }))
controlla('la lana nuova conta', robaNuova(visto, { ...s, lana: 6 }))
riassunto()
