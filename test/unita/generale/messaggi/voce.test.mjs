/* ═══════════════════════════════════════════════════════════════════
   VOCE — arriva solo a chi si ha davanti

   «Quello che vedi lo puoi aspettare, quello che non vedi te lo deve
   dire qualcuno»: un messaggio diretto a distanza infinita
   cancellerebbe quel principio, quindi si guarda con gli occhi di chi
   parla, e nell'istante in cui arriva.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, chiFinto } from '../../../aiuto/finto.js'
import { Voce } from '../../../../src/motore/generale/messaggi/voce.js'

{
  const visti = { compagno: true, nascosto: false }
  const chiParla = chiFinto({ id: 'capo', x: 0, y: 0, vede: (m, a) => !!visti[a.id] })
  const compagno = chiFinto({ id: 'compagno', x: 1, y: 0 })
  const nascosto = chiFinto({ id: 'nascosto', x: 2, y: 0 })
  const mondo = mondoFinto({ unita: [chiParla, compagno, nascosto] })
  const voce = new Voce('ora', chiParla)
  controlla('la voce arriva a chi il mittente vede', voce.arrivaA(mondo, compagno))
  controlla('e non a chi non vede', !voce.arrivaA(mondo, nascosto))
  controlla('non fa rumore, quindi non chiama chi accorre', !voce.eRumore)
}
{
  /* si guarda NELL'ISTANTE IN CUI ARRIVA, non quando è partita: nel
     frattempo qualcuno può essersi tolto di mezzo */
  let vede = true
  const chiParla = chiFinto({ id: 'capo', vede: () => vede })
  const altro = chiFinto({ id: 'altro' })
  const mondo = mondoFinto({ unita: [chiParla, altro] })
  const voce = new Voce('ora', chiParla)
  vede = false
  controlla('chi si è tolto di mezzo nel frattempo non sente', !voce.arrivaA(mondo, altro))
}
{
  const morto = chiFinto({ id: 'capo' })
  morto.inPiedi = false
  const altro = chiFinto({ id: 'altro' })
  const mondo = mondoFinto({ unita: [morto, altro] })
  controlla('un caduto non parla', !new Voce('ora', morto).arrivaA(mondo, altro))
}

nota('la voce si consegna a vista, ed è quello che la distingue da un grido')
riassunto('la voce')
