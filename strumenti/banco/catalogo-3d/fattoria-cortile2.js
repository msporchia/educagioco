/* Le voci del secondo cortile della Fattoria 3D (conigliera, alpaca, asini, arnie) per il catalogo 3D (strumenti/banco/catalogo-3d.html). Formato e
   regole: docs/core/catalogo-3d.md. Stessa forma di fattoria.js: `crea` chiama i costruttori veri di scena3d/modelli-cortile2.js, `dove` si ricava dai
   dati. Ogni bestia ha le tre voci dei suoi stadi (ha fame, al lavoro a metà, pronta). Docs: docs/fattoria3d/cortile-2.md. */
import { muoviBestie } from '../../../src/giochi/fattoria3d/scena3d/modelli.js'
import { creaConigliera, creaRecintoAlpaca, creaRecintoAsini, creaApiario, creaConiglio, creaAlpaca, creaAsino, creaArnia } from '../../../src/giochi/fattoria3d/scena3d/modelli-cortile2.js'
import { ANIMALI } from '../../../src/giochi/fattoria3d/dati/animali.js'
import { PEZZI } from '../../../src/giochi/fattoria3d/dati/catalogo.js'

const MC2 = 'src/giochi/fattoria3d/scena3d/modelli-cortile2.js'
const pezzo = t => `pezzo del vassoio, livello ${PEZZI[t].liv}, ${PEZZI[t].w}×${PEZZI[t].d} celle`
const FINE = Date.now() - 1000
const statiRecinto = (n) => Array.from({ length: n }, (_, k) => ({ fine: k % 3 === 0 ? FINE : k % 3 === 1 ? null : Date.now() + 9e6 }))      // pronta, fame, al lavoro, a giro

const MS = { coniglio: ANIMALI.conigliera.ms, alpaca: ANIMALI.alpaca.ms, asino: ANIMALI.asini.ms, arnia: ANIMALI.arnie.ms }
const CREA = { coniglio: creaConiglio, alpaca: creaAlpaca, asino: creaAsino, arnia: creaArnia }
const statoBestia = (specie, stadio) => { const t = Date.now(); return { fine: stadio === 'fame' ? null : stadio === 'pronta' ? t - 1000 : t + MS[specie] * 0.5 } }
function inStadio (specie, stadio) {
  const passo = (g, dt, t) => muoviBestie({ userData: { bestie: [g] } }, dt, t, [statoBestia(specie, stadio)], Date.now())
  return {
    crea: () => { const g = CREA[specie](0); g.userData.attesa = 1e9; passo(g, 0.016, 0.6); return g },
    anima: (g, dt, t) => { g.userData.attesa = 1e9; passo(g, dt, t + 0.6) },
  }
}
const NOMI_STADIO = { fame: 'ha fame', lavora: 'al lavoro (a metà)', pronta: 'pronta' }
const stadi = (specie, nome, dove) => ['fame', 'lavora', 'pronta'].map(st => ({
  id: `fattoria:${specie}-${st}`, nome: `${nome} · ${NOMI_STADIO[st]}`, gioco: 'fattoria', categoria: 'animale', dove: `${dove}: lo stadio «${NOMI_STADIO[st]}» (bestie-puro-cortile2.js)`, file: `${MC2}:crea${nome.split(' ')[0]}`, ...inStadio(specie, st),
}))
const recinto = (id, nome, tipo, crea, n, come) => ({
  id: `fattoria:${id}`, nome, gioco: 'fattoria', categoria: 'edificio', dove: pezzo(tipo) + ': ' + come, file: `${MC2}:${crea.name}`, misure: `${PEZZI[tipo].w}×${PEZZI[tipo].d}`,
  crea: () => crea(statiRecinto(n)), anima: (g, dt, t) => muoviBestie(g, dt, t, statiRecinto(n), Date.now()),
})

export const VOCI = [
  recinto('conigliera', 'Conigliera', 'conigliera', creaConigliera, 6, 'la conigliera di legno su gambe, la tana, le carote e fino a sei conigli d\'angora'),
  recinto('recinto-alpaca', 'Recinto degli alpaca', 'alpaca', creaRecintoAlpaca, 4, 'la tettoia di paglia con la coperta andina, il fieno e fino a quattro alpaca'),
  recinto('recinto-asini', 'Recinto degli asini', 'asini', creaRecintoAsini, 4, 'la stalla di pietra, la carriola e il mucchio di letame, fino a quattro asini'),
  recinto('apiario', 'Arnie (apiario)', 'arnie', creaApiario, 4, 'il prato fiorito, il tavolo dell\'apicoltore e fino a quattro arnie'),
  ...stadi('coniglio', 'Coniglio', 'nella conigliera'),
  ...stadi('alpaca', 'Alpaca', 'nel recinto degli alpaca'),
  ...stadi('asino', 'Asino', 'nel recinto degli asini'),
  ...stadi('arnia', 'Arnia', 'nell\'apiario'),
  { id: 'fattoria:coniglio-bianco', nome: 'Coniglio bianco', gioco: 'fattoria', categoria: 'animale', dove: 'nella conigliera, posti pari', file: `${MC2}:creaConiglio`, crea: () => creaConiglio(0) },
  { id: 'fattoria:coniglio-crema', nome: 'Coniglio crema', gioco: 'fattoria', categoria: 'animale', dove: 'nella conigliera, posti dispari', file: `${MC2}:creaConiglio`, crea: () => creaConiglio(1) },
  { id: 'fattoria:alpaca-chiara', nome: 'Alpaca chiara', gioco: 'fattoria', categoria: 'animale', dove: 'nel recinto degli alpaca, posti pari', file: `${MC2}:creaAlpaca`, crea: () => creaAlpaca(0) },
  { id: 'fattoria:alpaca-bruna', nome: 'Alpaca bruna', gioco: 'fattoria', categoria: 'animale', dove: 'nel recinto degli alpaca, posti dispari', file: `${MC2}:creaAlpaca`, crea: () => creaAlpaca(1) },
  { id: 'fattoria:asino-grigio', nome: 'Asino grigio', gioco: 'fattoria', categoria: 'animale', dove: 'nel recinto degli asini, posti pari', file: `${MC2}:creaAsino`, crea: () => creaAsino(0) },
  { id: 'fattoria:asino-bruno', nome: 'Asino bruno', gioco: 'fattoria', categoria: 'animale', dove: 'nel recinto degli asini, posti dispari', file: `${MC2}:creaAsino`, crea: () => creaAsino(1) },
]
