/* ═══════════════════════════════════════════════════════════════════
   RUMORE — arriva a chi è abbastanza vicino, e i muri non lo fermano

   Il messaggio sa da sé a chi arriva: non c'è nessuna lista di
   iscritti da consultare, c'è una domanda che ognuno fa a sé.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, campoFinto, chiFinto } from '../../../aiuto/finto.js'
import { Rumore } from '../../../../src/motore/generale/messaggi/rumore.js'

{
  const chiSuona = chiFinto({ id: 'ladra', x: 0, y: 0 })
  const vicino = chiFinto({ id: 'vicino', x: 3, y: 0 })
  const lontano = chiFinto({ id: 'lontano', x: 8, y: 4 })
  const mondo = mondoFinto({ campo: campoFinto({ larghezza: 9, altezza: 5 }),
                             unita: [chiSuona, vicino, lontano] })
  const cigolio = new Rumore('cigolio', chiSuona, 5)
  controlla('un cigolio lo sente chi è vicino', cigolio.arrivaA(mondo, vicino))
  controlla('e non chi è lontano', !cigolio.arrivaA(mondo, lontano))

  const fracasso = new Rumore('fracasso', chiSuona, 40)
  controlla('un fracasso li sveglia tutti e due',
            fracasso.arrivaA(mondo, vicino) && fracasso.arrivaA(mondo, lontano))
}
{
  /* IL POSTO SI COPIA QUANDO PARTE: fra un battito chi l'ha mandato si
     sarà mosso, il rumore no */
  const chiSuona = chiFinto({ id: 'ladra', x: 2, y: 2 })
  const rumore = new Rumore('richiamo', chiSuona, 20)
  chiSuona.x = 8
  uguale('il rumore resta dov\'è successo', rumore.x, 2)
}
{
  const chiSuona = chiFinto({ id: 'ladra', x: 0, y: 0 })
  const rumore = new Rumore('richiamo', chiSuona, 20)
  controlla('un rumore fa alzare la testa a chi corre al rumore', rumore.eRumore)
  controlla('e se non lo sente nessuno lo dice',
            rumore.racconto('un rumore', []).siVede === 'grida nel vuoto')
}

nota('il messaggio sa da sé a chi arriva: il mondo si limita a propagare')
riassunto('il rumore')
