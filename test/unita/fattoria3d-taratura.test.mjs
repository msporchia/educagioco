/* La scala della fattoria 3D sul metro di calibrazione.md (🪙1 = 10 s di esercizio): dal 22/10/2026 è quella della 2D (70 livelli, ~200 ore di
   esercizio, tempi in minuti veri), con la pesca al posto della peschiera. Qui si tiene ferma la parità voce per voce (prezzi, livelli, tempi,
   costi dei gesti, scomparti), il livello 2 in quarantacinque minuti, nessuna attesa in catena sopra l'ora, nessun prezzo fuori scala col suo
   livello, nessun premio sopra il tetto, la terra che costa come in 2D cella per cella. I numeri si leggono dai dati: se cambiano, cambiano anche
   i confronti. `npm run tara:fattoria3d` stampa la tabella. `node test/esegui.mjs fattoria3d-taratura`
   tempo: 1 */
import { sogliaDi, ULTIMO, SCARTO_DELLA_PESCA } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { sogliaDi as sogliaDi2D } from '../../src/giochi/fattoria3d/da2d/dati/livelli.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { PEZZI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { PESCA } from '../../src/giochi/fattoria3d/dati/pesca.js'
import { MONETE_AL_MINUTO } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { TERRA, prezzoDelLotto } from '../../src/giochi/fattoria3d/dati/regole.js'
import { LIVELLO_PESCA } from '../../src/giochi/fattoria3d/dati/parita2d.js'
import { postiPerMerce, prezzoDelPasso } from '../../src/giochi/fattoria3d/dati/silos.js'
import { catenaMs, tabellaLivelli, tabellaLotti, guastiDellaScala, guastiDiParita, TETTO_LIVELLO_2_MIN, TETTO_ULTIMO_MIN, TETTO_ATTESA_MS } from '../../src/giochi/fattoria3d/motore/taratura.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const guasti = guastiDellaScala()
controlla('la scala della fattoria 3D non ha guasti', guasti.length === 0, guasti.join(' · '))

const t = tabellaLivelli()
uguale('la tabella ha una riga per livello', t.length, ULTIMO)
controlla(`il livello 2 costa al più ${TETTO_LIVELLO_2_MIN} minuti di esercizio`, sogliaDi(2) / MONETE_AL_MINUTO <= TETTO_LIVELLO_2_MIN, String(sogliaDi(2) / MONETE_AL_MINUTO))
controlla(`il livello ${ULTIMO} costa al più ${TETTO_ULTIMO_MIN} minuti di esercizio (~200 ore)`, sogliaDi(ULTIMO) / MONETE_AL_MINUTO <= TETTO_ULTIMO_MIN)
controlla('ogni livello costa più del precedente', t.every((r, i) => !i || r.soglia > t[i - 1].soglia))

// catena: un raccolto è il suo tempo, un prodotto è più lungo dei suoi ingredienti
uguale('un raccolto matura nel suo tempo', catenaMs('grano'), COLTURE.grano.ms)
controlla('la farina arriva dopo il grano, il pane dopo la farina, la lasagna dopo la pasta', catenaMs('farina') > catenaMs('grano') && catenaMs('pane') > catenaMs('farina') && catenaMs('lasagne') > catenaMs('pasta'))
controlla(`nessuna cosa chiesta fa attendere più di ${TETTO_ATTESA_MS / 60000} minuti in catena`, t.every(r => r.lenta <= TETTO_ATTESA_MS))
controlla('le colture si contano in minuti veri, come in 2D: da 4 a 12', Math.min(...Object.values(COLTURE).map(c => c.ms)) === 4 * 60000 && Math.max(...Object.values(COLTURE).map(c => c.ms)) === 12 * 60000)

// la parità con la 2D, voce per voce (T21): prezzi, livelli, tempi, costi dei gesti, scomparti
const pari = guastiDiParita()
controlla('la 3D non ha numeri suoi dove la 2D ne ha uno', pari.length === 0, pari.join(' · '))
stessaLista('il livello 2 e il 70 sono quelli della 2D (il 70 con lo scarto della pesca)', [sogliaDi(2), sogliaDi(70)], [sogliaDi2D(2), sogliaDi2D(70) + SCARTO_DELLA_PESCA])
uguale('i livelli sono 70', ULTIMO, 70)
controlla('la pesca sposta le soglie di poco (meno del 2%) e solo dopo il suo livello', Math.abs(SCARTO_DELLA_PESCA) < sogliaDi(70) * 0.02 && sogliaDi(LIVELLO_PESCA) === sogliaDi2D(LIVELLO_PESCA) && sogliaDi(LIVELLO_PESCA + 1) === sogliaDi2D(LIVELLO_PESCA + 1) + SCARTO_DELLA_PESCA)
stessaLista('la pesca sta dove la peschiera della 2D: molo, molo girato, porticciolo', ['molo', 'molo_v', 'porticciolo'].map(k => PEZZI[k].liv), [LIVELLO_PESCA, LIVELLO_PESCA, LIVELLO_PESCA])
uguale('un banco dà un pesce ogni quindici minuti come la peschiera', (PESCA.ms + PESCA.riposoMs) / 60000, 15)
controlla('i costi dei gesti sono quelli della 2D: 🪙1 il grano, 🪙2 il mais, 🪙1 il pane, 🪙2 la torta', [COLTURE.grano.raccolta, COLTURE.mais.raccolta, RICETTE.pane.costo, RICETTE.torta.costo].join() === '1,2,1,2')

// i lotti: il mondo non ha confini, il prezzo li limita; la terra costa come in 2D, cella per cella (un po' meno: nel dubbio si regala)
const lotti = tabellaLotti()
controlla('il prezzo dei lotti sale a ogni riga della tabella', lotti.every((x, i) => !i || x.prezzo > lotti[i - 1].prezzo))
controlla('il centesimo lotto costa più di una settimana di esercizio', lotti.find(x => x.n === 100).minuti >= 210)
controlla('un lotto non dà mai più esperienza del tetto', lotti.every(x => x.esperienza <= 680))
{
  const perCella = n => prezzoDelLotto(n) / TERRA.celleLotto
  // alla terra con cui parte la 2D (324 celle) il prezzo per cella è quello della piazzola da 🪙45 (1,25 a cella); più avanti segue il rincaro ×1,38
  const n324 = Math.round(TERRA.celleDiPartenza2D / TERRA.celleLotto) - TERRA.lottiDiPartenza
  controlla('alle 324 celle della 2D la terra costa 1,25 a cella (45 su 36), o un po\' meno', perCella(n324) <= 45 / 36 * 1.05 && perCella(n324) >= 45 / 36 * 0.7, String(perCella(n324)))
  for (const piazzole of [1, 2, 4, 6]) {
    const celle = TERRA.celleDiPartenza2D + piazzole * TERRA.cellePiazzola
    const k = Math.round(celle / TERRA.celleLotto) - TERRA.lottiDiPartenza
    const attesa = 45 * 1.38 ** piazzole / 36
    controlla(`con ${piazzole} piazzole in più (${celle} celle) la terra costa a cella come in 2D o poco meno (nel dubbio si regala)`, perCella(k) <= attesa * 1.05 && perCella(k) >= attesa * 0.6, `${perCella(k).toFixed(2)} contro ${attesa.toFixed(2)}`)
  }
  controlla('a pari monete se ne ha almeno quanta ne dava la 2D', TERRA.regalo >= 1)
}

// gli scomparti: otto pezzi, +2 a ogni ingrandimento, il prezzo della 2D
stessaLista('postiPerMerce: 8, 10, 12', [0, 1, 2].map(postiPerMerce), [8, 10, 12])
stessaLista('il prezzo dell\'ingrandimento è quello della 2D (40, 130, 185, 220…)', [0, 1, 2, 3].map(prezzoDelPasso), [40, 130, 185, 220])

riassunto('Fattoria 3D — la scala')
