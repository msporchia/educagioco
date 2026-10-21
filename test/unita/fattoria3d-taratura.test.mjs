/* La scala della fattoria 3D sul metro di calibrazione.md (🪙1 = 10 s di esercizio): il livello 2 in dieci minuti, l'ultimo
   in poche ore, nessuna attesa in catena sopra i due minuti, nessun prezzo fuori scala col suo livello, nessun premio
   sopra il tetto. I numeri si leggono dai dati: se cambiano, cambiano anche i confronti. `npm run tara:fattoria3d` stampa
   la tabella. `node test/esegui.mjs fattoria3d-taratura`
   tempo: 1 */
import { sogliaDi, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { MONETE_AL_MINUTO } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { catenaMs, tabellaLivelli, tabellaLotti, guastiDellaScala, TETTO_LIVELLO_2_MIN, TETTO_ULTIMO_MIN, TETTO_ATTESA_MS } from '../../src/giochi/fattoria3d/motore/taratura.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const guasti = guastiDellaScala()
controlla('la scala della fattoria 3D non ha guasti', guasti.length === 0, guasti.join(' · '))

const t = tabellaLivelli()
uguale('la tabella ha una riga per livello', t.length, ULTIMO)
controlla(`il livello 2 costa al più ${TETTO_LIVELLO_2_MIN} minuti di esercizio`, sogliaDi(2) / MONETE_AL_MINUTO <= TETTO_LIVELLO_2_MIN, String(sogliaDi(2) / MONETE_AL_MINUTO))
controlla(`il livello ${ULTIMO} costa poche ore (al più ${TETTO_ULTIMO_MIN} minuti)`, sogliaDi(ULTIMO) / MONETE_AL_MINUTO <= TETTO_ULTIMO_MIN)
controlla('ogni livello costa più del precedente', t.every((r, i) => !i || r.soglia > t[i - 1].soglia))

// catena: un raccolto è il suo tempo, un prodotto è più lungo dei suoi ingredienti
uguale('un raccolto matura nel suo tempo', catenaMs('grano'), COLTURE.grano.ms)
controlla('la farina arriva dopo il grano, il pane dopo la farina, la lasagna dopo la pasta', catenaMs('farina') > catenaMs('grano') && catenaMs('pane') > catenaMs('farina') && catenaMs('lasagne') > catenaMs('pasta'))
controlla(`nessuna cosa chiesta fa attendere più di ${TETTO_ATTESA_MS / 1000} secondi in catena`, t.every(r => r.lenta <= TETTO_ATTESA_MS))
controlla('le prime colture si contano in secondi, le ultime restano sotto i due minuti', COLTURE.carota.ms <= 20000 && Math.max(...Object.values(COLTURE).map(c => c.ms)) < TETTO_ATTESA_MS)

// i lotti: il mondo non ha confini, il prezzo li limita
const lotti = tabellaLotti()
controlla('il prezzo dei lotti sale a ogni riga della tabella', lotti.every((x, i) => !i || x.prezzo > lotti[i - 1].prezzo))
controlla('il 33° lotto costa 680, come l\'ultimo di prima', lotti.find(x => x.n === 33).prezzo === 680)
controlla('il centesimo lotto costa più di una settimana di esercizio', lotti.find(x => x.n === 100).minuti >= 210)
controlla('un lotto non dà mai più esperienza del tetto', lotti.every(x => x.esperienza <= 680))

riassunto('Fattoria 3D — la scala')
