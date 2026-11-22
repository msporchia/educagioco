/* ═══════════════════════════════════════════════════════════════════
   LA RADURA GRANDE: I MOSTRI SCENDONO PER TUTTI E DUE I BRACCI

   La radura (`libera-bosco`) è l'unica carta scritta a mano: una bocca
   sola che si sdoppia in due bracci e si richiude prima della porta
   (`unita/castello-carta` ne guarda la forma). Qui la regola che la rende
   una difesa da dividere: le ondate si alternano fra i due bracci, e
   quella che arriva «da tutte e due» si spartisce davvero. Lo guardava
   `integrazione/torri-figure` chiamando tre ondate in tempo reale.
   ═══════════════════════════════════════════════════════════════════ */
import { LIBERE, MONDO } from '../../src/data/castello.js'
import { creaBattaglia } from '../../src/motore/battaglia.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const radura = LIBERE.find(l => l.chiave === 'libera-bosco')
const nuova = () => {
  const b = creaBattaglia({ tappa: radura, misure: { ...MONDO }, stato: {} })
  b.inizia()
  b.costruisci('add', {})
  return b
}

{
  const b = nuova()
  uguale('la radura: il motore ha due strade', b.percorso.vie.length, 2)
  const lati = [1, 2].map(o => b.ondate.viaDi(o, 2))
  uguale('le prime due ondate scendono una per braccio', lati.slice().sort().join(), '0,1')
}

{
  const b = nuova()
  const quando = b.ondate.daQuandoInsieme
  const insieme = [quando, quando + 1, quando + 2].find(n => b.ondate.viaDi(n, 2) < 0)
  controlla('un\'ondata arriva da tutte e due le parti', insieme > 0, `dalla ${quando}ª non ce n'è una`)
  for (let n = 0; n < insieme; n++) b.nuovaOnda()
  for (let i = 0; i < 80; i++) b.avanza(0.05)
  uguale('e in campo i suoi mostri stanno su tutti e due i bracci', [...new Set(b.nemici.map(n => n.via))].sort().join(), '0,1')
}

riassunto('la radura grande: due bracci')
