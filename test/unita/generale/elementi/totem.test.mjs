/* ═══════════════════════════════════════════════════════════════════
   TOTEM — chi ricevi «premi», e CONTA — una leva scatta al primo
   tocco, il totem manda solo quando arriva alla soglia
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, chiFinto } from '../../../aiuto/finto.js'
import { Totem } from '../../../../src/motore/generale/elementi/totem.js'

function bancoTotem (opts) {
  const q = banco(opts)
  q.mondo.livello = {}          // basta a nomeIn(): nessun nome dichiarato, si legge l'id
  q.mondo.comandiPendenti = []  // il totem, arrivato alla soglia, ci accoda i comandi
  return q
}

{
  /* un tocco sotto la soglia: sale la tacca, ma non manda niente */
  const totem = new Totem('totem', { x: 0, y: 0, tacche: 3, collegata: ['porta'] })
  const eroe = chiFinto()
  const q = bancoTotem({ chi: eroe })
  const risposta = totem.ricevi('premi', eroe, q.contesto)
  controlla('totem: il tocco è speso', risposta.esito.finito && risposta.esito.speso)
  controlla('totem: la tacca sale', totem.n === 1)
  controlla('totem: non ancora mandato', !totem.mandato)
  controlla('totem: e non accoda niente', q.mondo.comandiPendenti.length === 0)
  nota('dice:', risposta.penso)
}
{
  /* arrivato alla soglia: manda, una volta sola, come farebbe una leva */
  const totem = new Totem('totem', { x: 0, y: 0, tacche: 2, collegata: ['porta'] })
  const eroe = chiFinto()
  const q = bancoTotem({ chi: eroe })
  totem.ricevi('premi', eroe, q.contesto)
  const risposta = totem.ricevi('premi', eroe, q.contesto)
  controlla('totem: alla soglia scatta', totem.mandato)
  controlla('totem: e accoda il comando per il collegato',
            q.mondo.comandiPendenti.length === 1 && q.mondo.comandiPendenti[0].a === 'porta')
  controlla('totem: la risposta dice che è scattato', risposta.penso.includes('scatta'))
}
{
  /* dopo che ha mandato, altri tocchi non contano più */
  const totem = new Totem('totem', { x: 0, y: 0, tacche: 1, collegata: ['porta'] })
  const eroe = chiFinto()
  const q = bancoTotem({ chi: eroe })
  totem.ricevi('premi', eroe, q.contesto)   // arriva subito alla soglia e manda
  const risposta = totem.ricevi('premi', eroe, q.contesto)
  controlla('totem: dopo mandato risponde finitoSubito',
            risposta.esito.finito && !risposta.esito.speso)
  controlla('totem: non accoda un secondo comando', q.mondo.comandiPendenti.length === 1)
}
{
  /* un comando che non la riguarda: non risponde niente */
  const totem = new Totem('totem', { x: 0, y: 0 })
  const q = bancoTotem({ chi: chiFinto() })
  uguale('totem: un comando estraneo torna null', totem.ricevi('apri', q.chi, q.contesto), null)
}

riassunto('totem')
