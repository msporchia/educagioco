/* ═══════════════════════════════════════════════════════════════════
   APERTA
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { mondoFinto, cosaFinta, cartellino, chiFinto } from '../../../aiuto/finto.js'
import { domandaDa } from '../../../../src/motore/generale/domande/indice.js'
import { NonPossoSaperlo } from '../../../../src/motore/generale/domande/domanda.js'

{
  const porta = cosaFinta({ id: 'porta', nome: 'il portone', tipo: 'porta', stato: { aperta: true } })
  const eroe = chiFinto({ id: 'eroe', vede: () => true })
  const mondo = mondoFinto({ cose: [porta], unita: [eroe] })
  const aperta = domandaDa({ cond: 'aperta', complemento: 'porta' })
  controlla('aperta: lo chiede alla porta', aperta.valuta(mondo, eroe))
  uguale('aperta: e il contrario si dice «chiuso»',
         domandaDa({ cond: 'aperta', complemento: 'porta', non: true }).testo(mondo),
         'il portone è chiuso')
}
{
  /* IL VINCOLO CHE TIENE IN PIEDI IL GIOCO: quello che non vedi non lo
     puoi sapere. Rispondere «chiusa» sarebbe una bugia comoda. */
  const porta = cosaFinta({ id: 'porta', nome: 'il portone', tipo: 'porta', stato: { aperta: true } })
  const lontano = chiFinto({ id: 'eroe', vede: () => false })
  const mondo = mondoFinto({ cose: [porta], unita: [lontano] })
  const aperta = domandaDa({ cond: 'aperta', complemento: 'porta' })
  let lanciato = null
  try { aperta.valuta(mondo, lontano) } catch (e) { lanciato = e }
  controlla('aperta: da lontano non risponde — lo dichiara', lanciato instanceof NonPossoSaperlo)
  controlla('aperta: e spiega che serve un messaggio',
            !!lanciato && lanciato.perche.includes('me lo deve dire qualcuno'))
  /* ma quando a chiedere è il LIVELLO non c'è nessun `chi`, e nessun
     vincolo: quello è il mondo che si guarda dall'alto */
  controlla('aperta: il livello invece può chiedere sempre', aperta.valuta(mondo, null))
}

riassunto('aperta')
