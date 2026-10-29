/* ═══════════════════════════════════════════════════════════════════
   DUE TELEFONI CHE GIOCANO IN DUE SU UNA RETE FINTA

   Due Incontri veri (src/insieme/) sulla rete finta e cattiva
   (rete-finta.mjs), col seme: la stessa partita con gli stessi guasti
   si rifà identica. Il gioco dà la regola, le scelte di chi crea e le
   mosse dei due bambini finti (sfide/<gioco>.mjs); i guasti arrivano a
   caso con la frequenza dello `scenario`. Lo usano i test (unita/arena-sfida)
   e il banco che tara la tolleranza (strumenti/banco-rete.mjs).
   ═══════════════════════════════════════════════════════════════════ */
import { caso } from '../../src/giochi/arena/motore/banco.js'
import { Incontro } from '../../src/insieme/incontro.js'
import { orologioFinto, reteFinta } from './rete-finta.mjs'

export const POSTO = { host: 'hhhhhhhhhhhhhhhhhhhh', ospite: 'oooooooooooooooooooo' }

/* la rete: latenza da `min` a `max` ms; guasti al minuto, e quanto durano (ms) i blocchi e le reti spente */
export const SCENARI = {
  calma:   { min: 30, max: 120, alMinuto: 0, spenta: [0, 0], ferma: [0, 0] },
  casa:    { min: 30, max: 200, alMinuto: 0.5, spenta: [1000, 5000], ferma: [500, 3000] },
  melody:  { min: 40, max: 400, alMinuto: 3, spenta: [2000, 30000], ferma: [1000, 8000] },
  pessima: { min: 60, max: 900, alMinuto: 8, spenta: [5000, 60000], ferma: [2000, 15000] },
}
const fra = (r, [a, b]) => a + r() * (b - a)

/* una partita: fino alla fine, o a `minuti` di tempo vero. `gioco`: sfide/<gioco>.mjs; `tempi` cambia i tempi del canale
   (rete.js TEMPI), per tararli; `firme` diverse fanno due versioni che non si accordano. */
export function partitaInDue({ gioco, seme = 1, scenario = SCENARI.melody, minuti = 30, tempi = {}, firme = ['F', 'F'] }) {
  const orologio = orologioFinto()
  const rete = reteFinta({ orologio, rnd: caso(seme), min: scenario.min, max: scenario.max })
  const codice = rete.nuovo(POSTO.host)
  const opzioni = posto => ({ posto, servizio: 'https://finto', WebSocketImpl: rete.WebSocketImpl, tempo: orologio, ascolta: false, tempi })
  const host = new Incontro({ codice, regola: gioco.regola({ firma: firme[0] }), scelte: gioco.scelte(seme), opzioni: opzioni(POSTO.host) })
  orologio.avanti(400)
  const ospite = new Incontro({ codice, regola: gioco.regola({ firma: firme[1] }), opzioni: opzioni(POSTO.ospite) })
  const r = caso(seme * 31)
  const guasti = { taglia: 0, buco: 0, spegni: 0, ferma: 0 }
  const linee = new Set()
  const conLinea = { host: 0, ospite: 0 }          // ms passati col cartello della linea (oltre 1,5 s di guasto di fila, come Gioco.vue)
  const guasta = { host: 0, ospite: 0 }
  const PASSO = 16, perPasso = scenario.alMinuto / 60000 * PASSO
  let t = 0
  for (; t < minuti * 60000; t += PASSO) {
    orologio.avanti(PASSO)
    for (const [nome, inc] of [['host', host], ['ospite', ospite]]) {
      inc.avanza(PASSO / 1000)
      const l = inc.linea
      linee.add(`${l.io}/${l.altro}`)
      guasta[nome] = inc.stato === 'gioco' && (l.io !== 'su' || l.altro !== 'su') ? guasta[nome] + PASSO : 0
      if (guasta[nome] > 1500) conLinea[nome] += PASSO
      if (inc.stato === 'gioco') gioco.muovi(nome, inc, r)
    }
    if (r() < perPasso) {
      const chi = POSTO[r() < 0.5 ? 'host' : 'ospite'], x = r()
      if (x < 0.3) { guasti.taglia++; rete.taglia(chi) } else if (x < 0.5) { guasti.buco++; rete.buco(chi) }
      else if (x < 0.75) { guasti.spegni++; rete.spegni(chi, fra(r, scenario.spenta)) } else { guasti.ferma++; rete.ferma(chi, fra(r, scenario.ferma)) }
    }
    const finite = [host, ospite].every(i => i.motore?.fine() || i.stato === 'rotta' || i.stato === 'finita')
    if (finite) break
  }
  return { host, ospite, rete, guasti, linee, conLinea, durata: t, orologio }
}
