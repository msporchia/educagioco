/* Le merci della fattoria 3D sono quelle della fattoria di sempre: ogni merce ha la sua faccia nell'atlante, e dove l'id è lo stesso
   di una merce 2D (`PRODOTTI`) anche il nome e il pezzo sono gli stessi; le ricette in comune hanno gli stessi ingredienti e le stesse
   quantità: nessuna ricetta è adattata. Vedi docs/fattoria3d/merci-e-ricette.md. `node test/esegui.mjs fattoria3d-merci`
   tempo: 1 */
import { PEZZI } from '../../src/giochi/fattoria/dati/atlante.js'
import { PRODOTTI, RICETTE as RICETTE_2D, COLTURE as COLTURE_2D, profonditaDi } from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE, MACCHINE, merceDi, pezzoDi, emojiDi, MERCI_VECCHIE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { PRODOTTI_ANIMALI, LANA } from '../../src/giochi/fattoria3d/dati/animali.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// gli id della 3D che nella 2D hanno un altro id (i raccolti al singolare)
const COME_2D = { carota: 'carote', patata: 'patate', zucca: 'zucche', pomodoro: 'pomodori', fragola: 'fragole', melanzana: 'melanzane', cipolla: 'cipolle',
  cavolfiore: 'cavolfiori', peperone: 'peperoni' }     // aglio, barbabietola e riso hanno lo stesso id
const id2d = k => COME_2D[k] || k
// le macchine 3D e la loro sorella 2D (gli id della 3D sono quelli dei salvataggi)
const SORELLA = { mulino: 'mulino', pasticceria: 'pastificio', panificio: 'panificio', caseificio: 'caseificio', conserviera: 'cucina', gelateria: 'gelateria',
  telaio: 'telaio', zuccherificio: 'zuccherificio', sartoria: 'sartoria', tintoria: 'tintoria' }

const merci = [...Object.keys(COLTURE), ...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(LANA), ...Object.keys(RICETTE)]

for (const k of merci) {
  const m = merceDi(k)
  controlla(`${k}: ha il pezzo o dice quale aspetta`, !!(m.pezzo || m.aspetta))
  if (m.pezzo) controlla(`${k}: il pezzo «${m.pezzo}» è nell'atlante`, !!PEZZI[m.pezzo], m.pezzo)
  if (m.aspetta) controlla(`${k}: aspetta «${m.aspetta}», che nell'atlante non c'è ancora (se c'è, prendilo)`, !PEZZI[m.aspetta], m.aspetta)
  uguale(`${k}: pezzoDi dice lo stesso`, pezzoDi(k), m.pezzo || null)
  uguale(`${k}: emojiDi dice lo stesso`, emojiDi(k), m.emoji)
}
uguale('una chiave sconosciuta ha l\'emoji di ripiego e nessun pezzo', [emojiDi('xyz'), pezzoDi('xyz')].join(), '❔,')

// stesso id o stesso raccolto = stessa faccia e stesso nome della 2D
for (const k of merci) {
  const d = PRODOTTI[id2d(k)]
  if (!d) continue
  const m = merceDi(k)
  const r2d = RICETTE_2D.find(x => x.id === k)           // la 2D ha il nome della merce e, per una ricetta, quello più lungo della sua scheda
  controlla(`${k}: il nome è quello della 2D (la merce o la scheda della ricetta)`, m.nome === d.nome || (!!r2d && m.nome === r2d.nome), `${m.nome} / ${d.nome}`)
  uguale(`${k}: la faccia è quella della 2D`, m.pezzo || m.aspetta, d.pezzo || d.aspetta)
}
// le sole che non hanno un'omonima in 2D sono quelle che il nome stesso racconta
controlla('ogni ricetta 3D esiste in 2D con lo stesso id (nessuna ricetta inventata)', Object.keys(RICETTE).every(k => RICETTE_2D.some(r => r.id === k)), Object.keys(RICETTE).filter(k => !RICETTE_2D.some(r => r.id === k)).join())
controlla('ogni coltura 3D esiste in 2D', Object.keys(COLTURE).every(k => COLTURE_2D.some(c => c.id === id2d(k))))

// ingredienti e quantità: gli stessi della 2D (tradotti), senza eccezioni
const in3d = o => Object.fromEntries(Object.entries(o).map(([k, n]) => [Object.keys(COME_2D).find(x => COME_2D[x] === k) || k, n]))
for (const [k, r] of Object.entries(RICETTE)) {
  const d = RICETTE_2D.find(x => x.id === k)
  uguale(`${k}: ingredienti e quantità come in 2D`, JSON.stringify(Object.entries(r.ing).sort()), JSON.stringify(Object.entries(in3d(d.prende)).sort()))
  uguale(`${k}: il tempo è quello della 2D in scala 3D (minuti → secondi)`, r.ms, d.minuti * 1000)
}
uguale('ogni ricetta rende uno (N → 1): le quantità sono interi positivi', Object.values(RICETTE).every(r => Object.values(r.ing).every(n => Number.isInteger(n) && n >= 1)), true)

// le macchine: la sorella 2D fa le stesse ricette
for (const [t, m] of Object.entries(MACCHINE)) {
  const sorella = SORELLA[t]
  controlla(`${t}: la sorella ${sorella} esiste in 2D`, RICETTE_2D.some(r => r.dove === sorella))
  for (const k of Object.keys(m.ricette)) uguale(`${t} → ${k}: in 2D la fa ${sorella}`, RICETTE_2D.find(r => r.id === k).dove, sorella)
}
controlla('nessuna catena 3D supera la profondità della 2D', Object.keys(RICETTE).every(k => profonditaDi(k) < 8))

// i vecchi id non sono merci di oggi, e portano a una ricetta
controlla('i vecchi id non sono merci di oggi', Object.keys(MERCI_VECCHIE).every(v => !merceDi(v)))
controlla('e diventano ricette', Object.values(MERCI_VECCHIE).every(n => !!RICETTE[n]))

riassunto('Fattoria 3D — merci e ricette')
