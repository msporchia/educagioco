/* Verifica della macchina delle sorprese, senza browser. Le due cose che
   contano davvero sono che non escano doppioni e che una serie non si possa
   saltare: il resto è aritmetica sui prezzi. Il profilo vero vive dentro
   Vue, quindi qui se ne rifà un gemello minimo con le stesse regole di
   store/profile.js.  `node test/esegui.mjs capsule` */
import { SERIE, TUTTI, POSTI, mancanti, estrai, pezzoDi, postoDi,
         serieDelPezzo, costoSerie, costoTotale } from '../../src/data/capsule.js'
import { PRODOTTI } from '../../src/data/pets.js'
import { ITEMS } from '../../src/data/shop.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
controlla('sei serie', SERIE.length === 6)
controlla('id delle serie unici', new Set(SERIE.map(s => s.id)).size === SERIE.length)
controlla('ogni serie ha lo stesso numero di pezzi',
          new Set(SERIE.map(s => s.pezzi.length)).size === 1)
controlla('dodici pezzi per serie', SERIE.every(s => s.pezzi.length === 12))
controlla('nessun accessorio ripetuto fra serie',
          new Set(TUTTI.map(p => p.e)).size === TUTTI.length)
controlla('ogni pezzo ha un nome', TUTTI.every(p => p.nome && p.nome.length > 2))
controlla('ogni pezzo sta in un posto vero',
          TUTTI.every(p => POSTI.some(x => x.k === p.posto)))
controlla('nessun posto resta senza accessori',
          POSTI.every(x => TUTTI.some(p => p.posto === x.k)))
controlla('ogni serie veste almeno tre posti diversi',
          SERIE.every(s => new Set(s.pezzi.map(p => p.posto)).size >= 3))

/* il prezzo deve salire di serie in serie: è quello che rende la macchina
   un pozzo senza fondo invece di una spesa che si esaurisce */
controlla('il prezzo delle capsule sale sempre',
          SERIE.every((s, i) => i === 0 || s.costo > SERIE[i - 1].costo))
/* La prima serie deve restare alla portata di chi ha appena cominciato:
   la capsula di prova è in regalo, ma la seconda si paga, e se costasse
   come un animale la macchina resterebbe una cosa vista una volta. Il
   tetto è salito con tutti gli altri prezzi della cameretta — quello
   che conta è il rapporto con quanto si guadagna, non il numero. */
controlla('la prima capsula non spaventa', SERIE[0].costo <= 60)
controlla('l\'ultima serie costa parecchio', SERIE[SERIE.length - 1].costo >= 200)

/* un accessorio non deve essere anche un oggetto della cameretta o un
   prodotto del negozio: due cose diverse con la stessa faccia confondono */
const altrove = new Set([...ITEMS.map(i => i[0]), ...PRODOTTI.map(c => c.e)])
controlla('nessun accessorio si confonde con un oggetto o un prodotto',
          TUTTI.every(p => !altrove.has(p.e)))

controlla('pezzoDi trova', pezzoDi('🎩')?.nome === 'Cilindro')
controlla('postoDi sa dove va', postoDi('🎩') === 'testa')
controlla('postoDi su roba che non esiste', postoDi('🚜') === null)
controlla('serieDelPezzo risale alla serie', serieDelPezzo('🎩')?.id === 'festa')

/* ══════════ 2. la macchina: niente doppioni, niente salti ══════════ */
const prof = { coins: 0, accessori: [], serie: 0, capsule: 0, speso: 0 }

const serieOra = () => SERIE[Math.min(prof.serie, SERIE.length - 1)]
const finite = () => prof.serie >= SERIE.length
const costoCapsula = () => (prof.capsule ? serieOra().costo : 0)

const apri = rnd => {
  if (finite()) return false
  const s = serieOra()
  const resta = mancanti(s, prof.accessori)
  if (!resta.length) return false
  const costo = costoCapsula()
  if (prof.coins < costo) return false
  prof.coins -= costo
  prof.speso += costo
  const pezzo = estrai(resta, rnd)
  prof.accessori.push(pezzo.e)
  prof.capsule++
  if (!mancanti(s, prof.accessori).length) prof.serie++
  return pezzo
}

/* una sorgente casuale che si ripete uguale a ogni esecuzione */
let seme = 7
const dado = () => { seme = (seme * 1103515245 + 12345) % 2147483648; return seme / 2147483648 }

controlla('senza monete non si apre niente... tranne la prima', !!apri(dado))
controlla('la prima è gratis', prof.coins === 0 && prof.capsule === 1)
controlla('e ha dato un pezzo', prof.accessori.length === 1)
controlla('dalla prima serie', serieDelPezzo(prof.accessori[0]).id === SERIE[0].id)

controlla('la seconda invece si paga', apri(dado) === false)
prof.coins = SERIE[0].costo
controlla('con le monete si apre', !!apri(dado))
controlla('e le monete se ne vanno', prof.coins === 0)

/* si finisce la prima serie: mai un doppione, e a 12 su 12 si passa oltre */
prof.coins = 100000
while (mancanti(SERIE[0], prof.accessori).length) {
  const p = apri(dado)
  controlla('la capsula dà sempre qualcosa', !!p)
  controlla(`${p.e} non era già in casa`,
            prof.accessori.filter(e => e === p.e).length === 1)
}
controlla('la prima serie è tutta lì', prof.accessori.length === 12)
controlla('nessun doppione in dodici capsule', new Set(prof.accessori).size === 12)
controlla('finita la prima, si passa alla seconda', prof.serie === 1)
controlla('la capsula adesso costa di più', costoCapsula() === SERIE[1].costo)
controlla('completare la prima serie costa quanto dichiarato, meno il regalo',
          prof.speso === costoSerie(SERIE[0]) - SERIE[0].costo)

/* fino in fondo: tutte le serie, nell'ordine, senza mai un doppione */
prof.coins = 1000000
while (!finite()) controlla('si continua', !!apri(dado))
controlla('tutti i pezzi presi', prof.accessori.length === TUTTI.length)
controlla('nessun doppione in tutta la collezione',
          new Set(prof.accessori).size === TUTTI.length)
controlla('una capsula per pezzo, non una di più', prof.capsule === TUTTI.length)
controlla('a collezione finita la macchina si ferma', apri(dado) === false)

/* la prima gratis è l'unico sconto: il conto totale lo dice */
const spesoDavvero = costoTotale() - SERIE[0].costo
controlla('speso in tutto quanto costa la collezione meno il regalo',
          prof.speso === spesoDavvero)

/* ══════════ 3. estrai non esce mai dal seminato ══════════ */
const lista = [1, 2, 3]
controlla('estrai col dado a zero', estrai(lista, () => 0) === 1)
controlla('estrai col dado quasi a uno', estrai(lista, () => 0.999999) === 3)
controlla('estrai non sfonda nemmeno con un dado rotto',
          estrai(lista, () => 1) === 3)

/* ══════════ 4. il conto della spesa ══════════ */
for (const s of SERIE)
  nota(`${s.emoji} ${s.nome}`.padEnd(14), `${s.costo} 🪙 a capsula ·`,
       `${costoSerie(s)} 🪙 per completarla`)
nota(`in tutto: ${costoTotale()} 🪙 per ${TUTTI.length} accessori,`,
     `${spesoDavvero} 🪙 pagati (la prima è in regalo)`)
nota('posti addosso:', POSTI.map(p => p.nome.toLowerCase()).join(' · '))

riassunto('Macchina delle sorprese')
