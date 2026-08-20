/* ═══════════════════════════════════════════════════════════════════
   AREA E PERIMETRO — misurare, non contare a dito.

   Il modulo aveva in cima due gradi di confronto: «quale di queste
   quattro ha gli stessi quadretti ma il bordo diverso?». Otto conti a
   dito su figure storte, che non hanno una forma da cui dedurre
   niente: il concetto si afferra in tre secondi e il minuto dopo lo
   occupa l'indice sullo schermo. Chi aveva capito e chi non aveva
   capito ci mettevano lo stesso tempo, e sbagliava chi perdeva il
   conto — la domanda misurava la pazienza.

   Le quattro cose che devono restare vere:

     · **il confronto non c'è più**, in nessun grado;
     · **al grado 6 si misura**: la figura è sempre un rettangolo
       pieno, e i numeri sono grossi abbastanza da non invogliare a
       contare;
     · **la scorciatoia dice il vero**: il conto scritto nella dritta
       («7 × 7 = 49») fa davvero la risposta giusta. Una formula
       sbagliata scritta bene non la vede nessuno;
     · **la dritta arriva a chi le serve**: chi sbaglia, e chi
       indovina ma ci ha messo troppo — cioè chi ha contato a dito.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { serveLaDritta, LENTO } from '../../src/quiz/nucleo/domanda.js'
import griglia from '../../src/quiz/moduli/griglia.js'

const TIRI = 150

/* ══════════ 1. il confronto non c'è più ══════════ */
{
  uguale('la scaletta ha sei gradi', griglia.scaletta.length, 6)
  const chiavi = griglia.tipi.map(t => t.chiave)
  controlla('nessuna tipologia di confronto', !chiavi.some(c => c.includes('confronto')), chiavi.join(' '))
  uguale('area e perimetro sono due chiavi in tutto',
         chiavi.filter(c => c.startsWith('gri:')).length, 6)
  nota(`le tipologie: ${chiavi.join(' · ')}`)
}

/* ══════════ 2. al grado 6 si misura ══════════
   Un rettangolo pieno si riconosce dalle celle: tante quante il suo
   ingombro, e nessun buco. */
const rettangoloPieno = celle => {
  const w = Math.max(...celle.map(c => c[0])) - Math.min(...celle.map(c => c[0])) + 1
  const h = Math.max(...celle.map(c => c[1])) - Math.min(...celle.map(c => c[1])) + 1
  return celle.length === w * h ? [w, h] : null
}

{
  let piuPiccolo = 99
  for (const chiave of ['gri:area', 'gri:perimetro']) {
    for (let i = 0; i < TIRI; i++) {
      const d = griglia.genera(6, new Sorte(i * 37 + 6), chiave)
      const celle = d.soggetto?.scena?.celle || []
      const misure = rettangoloPieno(celle)
      controlla('al grado 6 la figura è un rettangolo pieno', !!misure, d.testo)
      if (misure) piuPiccolo = Math.min(piuPiccolo, Math.min(...misure))
      controlla('e porta la sua scorciatoia', !!d.dritta, d.testo)
      uguale('con quattro risposte', d.risposte.length, 4)
    }
  }
  controlla('mai un lato solo: un 1×6 è una riga, e lì moltiplicare è contare',
            piuPiccolo >= 2, `il lato più corto visto è ${piuPiccolo}`)
  nota(`al grado 6 il lato più corto è ${piuPiccolo}`)
}

/* ══════════ 3. la scorciatoia dice il vero ══════════
   Si rifà il conto scritto nella dritta e si guarda se torna la
   risposta buona. Le due forme sono «a × b = c» e «a + b = s, e il
   doppio fa g». */
{
  let quante = 0
  for (const grado of [4, 5, 6]) {
    for (const chiave of ['gri:area', 'gri:perimetro']) {
      for (let i = 0; i < TIRI; i++) {
        const d = griglia.genera(grado, new Sorte(i * 19 + grado * 5), chiave)
        if (!d.dritta) continue
        quante++
        const buona = Number(d.risposte[d.giusta].testo)
        const perProdotto = d.dritta.match(/(\d+) × (\d+) = (\d+)/)
        const perDoppio = d.dritta.match(/(\d+) \+ (\d+) = (\d+), e il doppio fa (\d+)/)
        controlla('la dritta porta il suo conto', !!(perProdotto || perDoppio), d.dritta)
        if (perProdotto) {
          const [, a, b, c] = perProdotto.map(Number)
          uguale(`«${d.dritta}» fa il conto giusto`, a * b, c)
          uguale('e il conto è la risposta buona', c, buona)
        } else if (perDoppio) {
          const [, a, b, s, g] = perDoppio.map(Number)
          uguale(`«${d.dritta}» fa il conto giusto`, a + b, s)
          uguale('e il doppio è la risposta buona', s * 2, g)
          uguale('che è quella giusta', g, buona)
        }
      }
    }
  }
  nota(`scorciatoie controllate: ${quante}`)
}

/* ══════════ 4. la dritta arriva a chi le serve ══════════
   Non è un dettaglio di schermata: senza la soglia, la scorciatoia si
   legge anche a chi ha risposto in tre secondi — cioè a chi la strada
   corta ce l'ha già — e diventa una pausa in premio per aver saputo. */
{
  const conFormula = { dritta: '6 × 6 = 36: lato per lato' }
  const senza = { aiuto: 'contali uno per uno' }

  controlla('chi sbaglia la legge sempre', serveLaDritta(conFormula, { giusto: false, tempo: 2 }))
  controlla('chi indovina contando a dito la legge',
            serveLaDritta(conFormula, { giusto: true, tempo: LENTO + 1 }))
  controlla('chi indovina in fretta no',
            !serveLaDritta(conFormula, { giusto: true, tempo: 3 }))
  controlla('e una domanda senza formula non ne ha mai una',
            !serveLaDritta(senza, { giusto: false, tempo: 90 }))
  nota(`la soglia è ${LENTO} secondi`)
}

riassunto('area e perimetro')
