/* ═══════════════════════════════════════════════════════════════════
   LEVA — chi ricevi «premi», e manda «apri» a chi è collegata
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, chiFinto } from '../../../aiuto/finto.js'
import { Leva } from '../../../../src/motore/generale/elementi/leva.js'

function bancoLeva (opts) {
  const q = banco(opts)
  q.mondo.livello = {}          // basta a nomeIn(): nessun nome dichiarato, si legge l'id
  q.mondo.comandiPendenti = []  // qui la leva accoda i comandi per chi è collegata
  return q
}

{
  /* premuta: scatta, e accoda un comando per ognuno dei collegati — non
     lo manda subito (arriva al battito dopo, dalla coda dei congegni) */
  const leva = new Leva('leva', { x: 0, y: 0, collegata: ['cancello', 'grata'] })
  const eroe = chiFinto()
  const q = bancoLeva({ chi: eroe })
  const risposta = leva.ricevi('premi', eroe, q.contesto)
  controlla('leva: premuta, e il battito è speso', risposta.esito.finito && risposta.esito.speso)
  controlla('leva: risulta premuta', leva.premuta)
  controlla('leva: accoda un comando per ogni collegato', q.mondo.comandiPendenti.length === 2)
  controlla('leva: e sono «apri» per i due nomi giusti',
            q.mondo.comandiPendenti.every(c => c.cmd === 'apri') &&
            q.mondo.comandiPendenti.map(c => c.a).sort().join(',') === 'cancello,grata')
  controlla('leva: il mittente è la leva stessa', q.mondo.comandiPendenti[0].mittente === leva)
  nota('dice:', risposta.penso)
}
{
  /* premuta una volta, fatto per sempre: non è un interruttore */
  const leva = new Leva('leva', { x: 0, y: 0, collegata: ['cancello'] })
  const eroe = chiFinto()
  const q = bancoLeva({ chi: eroe })
  leva.ricevi('premi', eroe, q.contesto)
  const risposta = leva.ricevi('premi', eroe, q.contesto)
  controlla('leva: ripremuta risponde finitoSubito',
            risposta.esito.finito && !risposta.esito.speso)
  controlla('leva: e non accoda un secondo comando', q.mondo.comandiPendenti.length === 1)
}
{
  /* un comando che non la riguarda: non risponde niente */
  const leva = new Leva('leva', { x: 0, y: 0 })
  const q = bancoLeva({ chi: chiFinto() })
  uguale('leva: un comando estraneo torna null', leva.ricevi('apri', q.chi, q.contesto), null)
}

riassunto('leva')
