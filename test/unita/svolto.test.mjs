/* ═══════════════════════════════════════════════════════════════════
   L'ESEMPIO SVOLTO, PRIMA DELLA DOMANDA VERA

   Una tipologia al muro, per una settimana, si presenta con un esempio
   già risolto davanti. Era il «Si fa così» della domanda stessa, e in
   molti moduli quel metodo parla dei numeri di quella domanda («42 sta
   fra 40 e 50… si va giù»): mostrato prima conteneva la risposta, il
   bambino rispondeva giusto e il ripasso lo contava come saputo.

   Adesso l'esempio è un'altra domanda della stessa tipologia, fatta
   dallo stesso modulo con un'altra sorte. Le cose da non sbagliare:
   l'esempio ha un'altra risposta giusta e non dice mai quella della
   vera; se in pochi tentativi non se ne trova uno, il metodo resta solo
   se non ha numeri, se no niente; e vale per tutti i moduli, non per
   quelli che si sono provati a mano.

   `node test/esegui.mjs svolto --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { esempioSvolto, generatoreDi, metodoSenzaNumeri, daLeggerePrima, testiDellEsempio,
         rivela, TENTATIVI } from '../../src/quiz/nucleo/svolto.js'
import { tempoDiLettura } from '../../src/quiz/nucleo/domanda.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')
const moduli = []
for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js')))
  moduli.push((await import(pathToFileURL(resolve(CARTELLA, f)).href)).default)
const numero = moduli.find(m => m.id === 'numero')

const giusta = d => d.risposte[d.giusta]
const parolaIntera = (testi, cosa) => {
  const c = String(cosa).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${c}($|[^\\p{L}\\p{N}])`, 'iu')
  return testi.some(t => re.test(t))
}

/* ══════════ 1. il caso da cui nasce ══════════ */
{
  const sorte = new Sorte(42)
  let vera = null
  for (let i = 0; i < 200 && !vera; i++) {
    const d = numero.genera(6, sorte, 'num:arrotonda')
    if (d.testo.includes(' 42 ')) vera = d
  }
  controlla('si trova la domanda dell\'arrotondamento di 42', !!vera)
  controlla('e il suo metodo dice la risposta: il difetto', /\b40\b/.test(vera.aiuto), vera.aiuto)
  const prima = esempioSvolto({ vera, genera: generatoreDi(numero, 6, vera.chiave), sorte })
  const es = prima?.esempio
  controlla('alleggerita, prima c\'è un esempio', !!es)
  uguale('della stessa tipologia', es?.chiave, vera.chiave)
  controlla('con un\'altra risposta giusta', giusta(es).testo !== giusta(vera).testo,
            `${giusta(es).testo} / ${giusta(vera).testo}`)
  controlla('e il 40 non compare da nessuna parte nell\'esempio',
            !parolaIntera(testiDellEsempio(es), '40'), testiDellEsempio(es).join(' · '))
  controlla('e ha il suo «Si fa così»', !!es?.aiuto)
  controlla('e la sua risposta non sta fra i tasti della vera: sarebbe un\'esca',
            !vera.risposte.some(r => r.testo === giusta(es).testo),
            `${giusta(es).testo} fra ${vera.risposte.map(r => r.testo).join(', ')}`)
  nota(`vera: «${vera.testo}» · esempio: «${es?.testo}» → ${giusta(es).testo} — ${es?.aiuto}`)
}

/* ══════════ 2. i ripieghi ══════════ */
{
  const vera = { testo: 'Arrotonda 42', risposte: [{ testo: '40' }, { testo: '50' }], giusta: 0,
                 chiave: 'num:arrotonda', aiuto: '42 sta fra 40 e 50: si va giù' }
  // un modulo che sa fare solo quella domanda: nessun esempio diverso
  const sempreLei = () => ({ ...vera })
  uguale('se non c\'è un esempio diverso e il metodo ha numeri: niente',
         esempioSvolto({ vera, genera: sempreLei, sorte: new Sorte(1) }), null)
  const senzaNumeri = { ...vera, aiuto: 'guarda l\'ultima cifra: sotto la metà si va giù' }
  uguale('col metodo senza numeri: il metodo e basta',
         esempioSvolto({ vera: senzaNumeri, genera: sempreLei, sorte: new Sorte(1) })?.metodo,
         senzaNumeri.aiuto)
  uguale('e senza nessun generatore, lo stesso',
         esempioSvolto({ vera: senzaNumeri, genera: null, sorte: new Sorte(1) })?.metodo,
         senzaNumeri.aiuto)
  // anche senza cifre, un metodo che dice la parola giusta non si mostra
  const parola = { testo: 'Il contrario di alto?', risposte: [{ testo: 'basso' }, { testo: 'largo' }],
                   giusta: 0, chiave: 'les:contrari', aiuto: 'alto e basso sono contrari' }
  uguale('un metodo che dice la risposta, anche a parole, non si mostra', metodoSenzaNumeri(parola), '')
  // un elenco che nomina la giusta insieme a tutti i falsi non la distingue: i giorni della settimana
  const giorni = { testo: 'Che giorno viene 2 giorni dopo lunedì?', giusta: 0, chiave: 'cal:giorni',
                   risposte: [{ testo: 'mercoledì' }, { testo: 'martedì' }, { testo: 'giovedì' }] }
  const elenco = ['i giorni in ordine: lunedì, martedì, mercoledì, giovedì, venerdì']
  controlla('un elenco che le nomina tutte non tradisce la giusta', !rivela(elenco, giorni))
  controlla('ma se nomina la giusta e non i falsi sì',
            rivela(['dopo lunedì viene martedì, poi mercoledì'], giorni))
  controlla('e il 4 non si trova dentro il 40',
            !rivela(['arrotonda 40'], { risposte: [{ testo: '4' }, { testo: '5' }], giusta: 0 }))
  uguale('senza un «Si fa così» non si inventa niente',
         esempioSvolto({ vera: { ...vera, aiuto: undefined }, genera: sempreLei, sorte: new Sorte(1) }), null)
  // un esempio di un'altra tipologia (un modulo senza tipi che pesca altrove) si scarta
  const altra = () => ({ ...vera, chiave: 'num:stima', testo: 'altro', risposte: [{ testo: '90' }] })
  uguale('un esempio di un\'altra tipologia non vale',
         esempioSvolto({ vera, genera: altra, sorte: new Sorte(1) }), null)
  // un generatore che si rompe non rompe la domanda
  const rotto = () => { throw new Error('guasto') }
  uguale('un generatore che lancia: ripiego, non un errore',
         esempioSvolto({ vera: senzaNumeri, genera: rotto, sorte: new Sorte(1) })?.metodo, senzaNumeri.aiuto)
  // i tentativi sono pochi: un modulo lento non tiene ferma la domanda
  let chiamate = 0
  esempioSvolto({ vera, genera: () => { chiamate++; return vera }, sorte: new Sorte(1) })
  uguale('si prova al massimo TENTATIVI volte', chiamate, TENTATIVI)
}

/* ══════════ 3. il tempo di lettura conta l'esempio ══════════ */
{
  const vera = { testo: 'Arrotonda 42 alla decina più vicina.',
                 risposte: [{ testo: '40' }, { testo: '50' }], giusta: 0 }
  const es = { testo: 'Arrotonda 67 alla decina più vicina.', risposte: [{ testo: '70' }], giusta: 0,
               aiuto: '67 sta fra 60 e 70: l\'ultima cifra è 7, quindi si va su' }
  const inPiu = daLeggerePrima({ esempio: es })
  controlla('le parole dell\'esempio si contano', inPiu.includes('67 sta fra') && inPiu.includes('70'))
  controlla('e allungano il tempo di lettura',
            tempoDiLettura({ ...vera, testo: `${vera.testo} ${inPiu}` }) > tempoDiLettura(vera))
  uguale('il solo metodo si conta anche lui', daLeggerePrima({ metodo: 'guarda l\'ultima cifra' }),
         'guarda l\'ultima cifra')
  uguale('niente prima, niente in più', daLeggerePrima(null), '')
}

/* ══════════ 4. tutti i moduli, tutte le tipologie ══════════
   Il modo è uno per tutti (il modulo e il grado da cui viene la domanda,
   la tipologia come chiave): si prova su ogni classe del catalogo che
   l'esempio sia della stessa tipologia, con un'altra risposta giusta, e
   non dica mai quella della vera. */
{
  let classi = 0
  let conEsempio = 0
  let soloMetodo = 0
  let niente = 0
  let esche = 0
  const guasti = []
  const senza = []
  for (const m of moduli) {
    for (let g = 1; g <= m.gradi; g++) {
      for (const t of m.tipiDi(g)) {
        classi++
        const genera = generatoreDi(m, g, t.chiave)
        let esempi = 0
        let metodi = 0
        for (let seme = 1; seme <= 4; seme++) {
          const sorte = new Sorte(seme * 7919 + g * 31)
          const vera = m.genera(g, sorte, t.chiave)
          if (vera.chiave !== t.chiave) guasti.push(`${m.id}/${g}/${t.chiave}: genera dà ${vera.chiave}`)
          const prima = esempioSvolto({ vera, genera, sorte })
          if (prima?.esempio) {
            esempi++
            const es = prima.esempio
            const vg = giusta(vera)
            const eg = giusta(es)
            if (es.chiave !== vera.chiave) guasti.push(`${m.id}/${t.chiave}: esempio di ${es.chiave}`)
            if (JSON.stringify(eg) === JSON.stringify(vg))
              guasti.push(`${m.id}/${t.chiave}: stessa risposta giusta`)
            if (vera.risposte.some(r => JSON.stringify(r) === JSON.stringify(eg))) esche++
            if (rivela(testiDellEsempio(es), vera))
              guasti.push(`${m.id}/${t.chiave}: l'esempio dice «${vg.testo ?? vg.emoji}»`)
          } else if (prima?.metodo) {
            metodi++
            if (/\d/.test(prima.metodo)) guasti.push(`${m.id}/${t.chiave}: metodo con numeri`)
          }
        }
        if (esempi) conEsempio++
        else if (metodi) soloMetodo++
        else { niente++; senza.push(`${m.id}/${g}/${t.chiave}`) }
      }
    }
  }
  controlla('in nessuna classe l\'esempio tradisce la domanda vera', guasti.length === 0,
            guasti.slice(0, 5).join(' | '))
  // la gran parte ha un esempio vero: se crollasse, il ripiego sarebbe diventato la regola
  controlla('quasi tutte le classi hanno un esempio', conEsempio / classi > 0.85,
            `${conEsempio} su ${classi}`)
  nota(`${classi} classi: ${conEsempio} con l'esempio, ${soloMetodo} col solo metodo, ${niente} senza niente`)
  nota(`esempi la cui risposta sta fra i tasti della vera (dove non c'era di meglio): ${esche}`)
  if (senza.length) nota(`senza niente: ${senza.slice(0, 12).join(', ')}${senza.length > 12 ? '…' : ''}`)
}

riassunto('l\'esempio svolto')
