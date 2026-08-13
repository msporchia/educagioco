/* ═══════════════════════════════════════════════════════════════════
   OGGETTO — chi ricevi «prendi»
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../../../aiuto/verifica.mjs'
import { banco, chiFinto } from '../../../aiuto/finto.js'
import { Oggetto } from '../../../../src/motore/generale/elementi/oggetto.js'

function bancoOggetto (opts) {
  const q = banco(opts)
  q.mondo.livello = {}   // basta a nomeIn(): nessun nome dichiarato, si legge l'id
  return q
}

{
  /* si prende: passa nello zaino di chi l'ha preso, e il mondo lo sa */
  const chiave = new Oggetto('chiave', { x: 0, y: 0 })
  const eroe = chiFinto({ id: 'eroe' })
  const q = bancoOggetto({ chi: eroe })
  const risposta = chiave.ricevi('prendi', eroe, q.contesto)
  controlla('oggetto: preso, e il battito è speso', risposta.esito.finito && risposta.esito.speso)
  controlla('oggetto: risulta di chi l\'ha preso', chiave.preso === 'eroe')
  controlla('oggetto: e finisce nel suo zaino', eroe.ha('chiave'))
  controlla('oggetto: un evento «presa» parte', q.mondo.eventi.includes('presa'))
  nota('dice:', risposta.penso)
}
{
  /* chi ce l'ha già in mano non perde il turno per riscoprirlo */
  const chiave = new Oggetto('chiave', { x: 0, y: 0 })
  const eroe = chiFinto({ id: 'eroe' })
  const q = bancoOggetto({ chi: eroe })
  chiave.ricevi('prendi', eroe, q.contesto)
  const risposta = chiave.ricevi('prendi', eroe, q.contesto)
  controlla('oggetto: già in mano risponde finitoSubito',
            risposta.esito.finito && !risposta.esito.speso)
}
{
  /* un altro l'ha già presa: resta sua, e lo dice — ma il battito di
     chi ha provato è speso lo stesso (Esito.finito(), non rotto: la
     fila di chi ha chiesto prosegue con l'ordine dopo) */
  const chiave = new Oggetto('chiave', { x: 0, y: 0 })
  const primo = chiFinto({ id: 'primo' })
  const secondo = chiFinto({ id: 'secondo' })
  const q = bancoOggetto({ chi: primo })
  chiave.ricevi('prendi', primo, q.contesto)
  const risposta = chiave.ricevi('prendi', secondo, q.contesto)
  controlla('oggetto: resta di chi l\'ha presa per primo', chiave.preso === 'primo')
  controlla('oggetto: il secondo non la ottiene, ma il battito è speso',
            risposta.esito.finito && risposta.esito.speso)
  controlla('oggetto: e spiega perché', risposta.penso.includes('già'))
  /* e la marca NON riuscita: `Contesto.consegna` scrive verde tutto
     quello che non porta `riuscito: false`, e solo le righe non
     riuscite si portano dietro il `motivo` — cioè la frase che chi
     rilegge il registro sta cercando */
  controlla('oggetto: il rifiuto è dichiarato tale, se no la riga esce verde e senza motivo',
            risposta.riuscito === false)
}
{
  /* un comando che non la riguarda: non risponde niente */
  const chiave = new Oggetto('chiave', { x: 0, y: 0 })
  const q = bancoOggetto({ chi: chiFinto() })
  uguale('oggetto: un comando estraneo torna null', chiave.ricevi('apri', q.chi, q.contesto), null)
}

riassunto('oggetto')
