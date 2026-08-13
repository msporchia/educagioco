/* ═══════════════════════════════════════════════════════════════════
   SENTITO — «l'ho sentito io», non «qualcuno l'ha mandato»

   È la domanda che ha smesso di mentire il giorno che il rumore ha
   preso una portata: un cigolio che non ti arriva non l'hai sentito,
   anche se dall'altra parte del castello è successo.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, cartellino, chiFinto } from '../../../aiuto/finto.js'
import { domandaDa } from '../../../../src/motore/generale/domande/indice.js'
import { Unita } from '../../../../src/motore/generale/unita.js'
import { Fila } from '../../../../src/motore/generale/azioni/fila.js'

const cigolio = () => domandaDa({ cond: 'segnale', complemento: 'cigolio' })

{
  const vicino = new Unita({ id: 'vicino', nome: 'il vicino', fazione: 'nostri', x: 0, y: 0, vita: 3, vista: 4 })
  const lontano = new Unita({ id: 'lontano', nome: 'il lontano', fazione: 'nostri', x: 8, y: 4, vita: 3, vista: 4 })
  const mondo = mondoFinto({ cose: [cartellino('cigolio', 'segnale', 'un cigolio')],
                             unita: [vicino, lontano] })
  vicino.parti(new Fila([])); lontano.parti(new Fila([]))
  mondo.segnaliMandati.push('cigolio')

  /* la consegna lo dà solo a chi lo raggiunge: qui lo simuliamo */
  vicino.senti({ segnale: 'cigolio' })

  controlla("chi l'ha sentito risponde di sì", cigolio().valuta(mondo, vicino))
  controlla("chi era troppo lontano risponde di no", !cigolio().valuta(mondo, lontano))
}

{
  /* ── E IL LIVELLO GUARDA IL MONDO ──
     Le condizioni di vittoria non le fa nessun personaggio: lì non c'è
     nessuno che percepisce, e il vincolo non si applica. */
  const mondo = mondoFinto({ cose: [cartellino('cigolio', 'segnale', 'un cigolio')] })
  mondo.segnaliMandati = ['cigolio']
  controlla('senza nessuno che chieda, vale quello che è successo nel mondo',
            cigolio().valuta(mondo, null))
}

{
  const uno = new Unita({ id: 'uno', fazione: 'nostri', x: 0, y: 0, vita: 3, vista: 4 })
  uno.parti(new Fila([]))
  const mondo = mondoFinto({ cose: [cartellino('cigolio', 'segnale', 'un cigolio')], unita: [uno] })
  uno.senti({ segnale: 'cigolio' })
  controlla('rigiocando la scena non si ricorda più niente',
            (uno.azzera(), !cigolio().valuta(mondo, uno)))
}

nota('un segnale sentito è un fatto di chi lo sente, non del mondo')
riassunto('sentito')
