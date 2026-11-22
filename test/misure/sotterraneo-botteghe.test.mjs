/* Il giro intero dei banchi del sotterraneo: le linguette dei quattro eroi in cinque prove (al livello della storia, con roba rara,
   a livelli fissi) per otto discese finite, con le quote («quasi tutte arrivano a dieci», «di solito due»), e i salti e i sogni dei
   quattro eroi a dodici livelli. `unita/sotterraneo-roba` fa le stesse regole su un campione, a ogni commit.
   perché: il giro intero dei banchi del sotterraneo: le linguette dei quattro eroi in cinque prove per otto discese finite, e i salti e i sogni a dodici livelli
   a parte perché: le stesse regole su un campione girano a ogni commit in unita/sotterraneo-roba; `npm run bottega` è il banco a mano. Questo è il giro pieno, con le quote
   `node test/esegui.mjs misure/sotterraneo-botteghe --niente-build` */
import { giroDelleLinguette, giroDeiSalti } from '../aiuto/sotterraneo-botteghe-giro.mjs'
import { riassunto } from '../aiuto/verifica.mjs'

giroDelleLinguette()
giroDeiSalti()

riassunto('il giro intero dei banchi del sotterraneo')
