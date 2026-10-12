/* ═══════════════════════════════════════════════════════════════════
   I CONTI PURI — e il modo di chiederli senza sporcare gli altri mazzi
   tempo: 20

   `moduli/conti.js` fa un conto di una sola operazione a una grandezza
   (il grado, 1..10). Si prova in due pezzi:

     · il modulo: per ogni tipo e per ogni grado la risposta giusta è
       davvero giusta, i falsi sono interi, diversi, mai negativi, ognuno
       con il suo perché, c'è il «si fa così», e a parità di seme la
       domanda è la stessa;
     · la scelta (`quiz/scelta.js`): il modulo è `soloSuRichiesta`, quindi
       i giochi che non lo nominano (survivors, sotterraneo) ricevono
       ESATTAMENTE le domande di prima — stesso seme, stessa sequenza —
       e chi lo nomina può fissare il tipo (`tipi`) e la grandezza
       (`grado`, o la difficoltà 0..1 sotto un'età).
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import conti from '../../src/quiz/moduli/conti.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { guastiDi } from '../../src/quiz/nucleo/domanda.js'
import { domandaPerGioco, moduliAmmessi, classiAmmesse } from '../../src/quiz/scelta.js'

const CARTELLA = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/quiz/moduli')
const tutti = []
for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js')))
  tutti.push((await import(pathToFileURL(resolve(CARTELLA, f)).href)).default)
const altri = tutti.filter(m => m.id !== 'conti')

const NOMI = ['somma', 'differenza', 'prodotto', 'quoziente']
const FATTO = {
  '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, ':': (a, b) => a / b,
}
const SEGNO = { somma: '+', differenza: '−', prodotto: '×', quoziente: ':' }

/* ═══════════ 1. il modulo ═══════════ */
uguale('è un modulo di matematica', conti.materia, 'matematica')
uguale('dieci gradi', conti.gradi, 10)
uguale('sta fuori dai mazzi generali', conti.soloSuRichiesta, true)
controlla('gli altri moduli no', altri.every(m => !m.soloSuRichiesta))
uguale('le quattro tipologie', conti.tipi.map(t => t.chiave).join(' '),
       NOMI.map(n => 'conti:' + n).join(' '))
controlla('le chiavi hanno il prefisso conti: e nessun altro modulo lo usa',
          altri.every(m => m.tipi.every(t => !t.chiave.startsWith('conti:'))))
uguale('i saperi: prodotto → moltiplicazioni', conti.tipi.find(t => t.chiave === 'conti:prodotto').sa.join(), 'moltiplicazioni')
uguale('i saperi: quoziente → divisioni', conti.tipi.find(t => t.chiave === 'conti:quoziente').sa.join(), 'divisioni')

for (const t of conti.tipi) {
  let su = true
  for (let g = 2; g <= 10; g++) if (!(t.livello[g] > t.livello[g - 1])) su = false
  controlla(`${t.chiave}: il livello dichiarato cresce a ogni grado`, su, JSON.stringify(t.livello))
}

const PER_GRADO = 250
for (const nome of NOMI) {
  const chiave = 'conti:' + nome
  for (let g = 1; g <= 10; g++) {
    const guasti = new Set()
    let ripetibile = true
    const viste = new Set()
    for (let i = 0; i < PER_GRADO; i++) {
      const seme = g * 7919 + i
      const d = conti.genera(g, new Sorte(seme), chiave)
      const m = /^(\d+) ([+−×:]) (\d+) = \?$/.exec(d.testo)
      if (!m) { guasti.add(`testo non è un conto: «${d.testo}»`); continue }
      const [a, segno, b] = [Number(m[1]), m[2], Number(m[3])]
      if (segno !== SEGNO[nome]) guasti.add(`segno ${segno} per ${nome}`)
      const vero = FATTO[segno](a, b)
      const buona = d.risposte[d.giusta]
      if (Number(buona.testo) !== vero) guasti.add(`${d.testo} la giusta è ${buona.testo}, vale ${vero}`)
      if (!Number.isInteger(vero)) guasti.add(`${d.testo} non è esatto`)
      if (vero < 1) guasti.add(`${d.testo} fa ${vero}`)
      if (nome === 'differenza' && b >= a) guasti.add(`${d.testo}: il secondo non sta nel primo`)
      if (d.chiave !== chiave) guasti.add(`chiave ${d.chiave}`)
      if (d.risposte.length !== 4) guasti.add(`${d.risposte.length} risposte`)
      const numeri = d.risposte.map(r => Number(r.testo))
      if (new Set(numeri).size !== numeri.length) guasti.add(`risposte doppie in ${d.testo}`)
      if (numeri.some(n => !Number.isInteger(n) || n < 0)) guasti.add(`falso negativo o non intero in ${d.testo}`)
      d.risposte.forEach((r, k) => {
        if (k !== d.giusta && !r.perche) guasti.add(`un falso di ${d.testo} senza perché`)
        if (k === d.giusta && r.perche) guasti.add(`la giusta di ${d.testo} ha un perché`)
      })
      if (!d.aiuto || !d.aiuto.includes(String(vero))) guasti.add(`l'aiuto di ${d.testo} non arriva al risultato: «${d.aiuto}»`)
      guastiDi(d).forEach(x => guasti.add(x))
      viste.add(d.testo)
      if (i < 20 && JSON.stringify(conti.genera(g, new Sorte(seme), chiave)) !== JSON.stringify(d)) ripetibile = false
    }
    controlla(`${nome} grado ${g}: giuste, falsi buoni, aiuto`, guasti.size === 0, [...guasti].slice(0, 3).join(' | '))
    controlla(`${nome} grado ${g}: ripetibile col seme`, ripetibile)
    controlla(`${nome} grado ${g}: abbastanza conti diversi`, viste.size >= 18, `solo ${viste.size}`)
  }
}

// la grandezza dei numeri cresce fra i gradi-ponte (dentro il dieci, le decine, il cento, le centinaia): non a ogni passo,
// perché «passare la decina» (grado 3) è più difficile di 18 + 1 (grado 2) con numeri più piccoli
for (const nome of ['somma', 'differenza']) {
  const grosso = g => {
    let tot = 0
    for (let i = 0; i < 200; i++) {
      const m = /^(\d+) . (\d+)/.exec(conti.genera(g, new Sorte(i + g * 31), 'conti:' + nome).testo)
      tot += Math.max(Number(m[1]), Number(m[2]))
    }
    return tot / 200
  }
  const ponti = [1, 4, 7, 8, 9, 10].map(grosso)
  controlla(`${nome}: i numeri crescono fra i gradi 1, 4, 7, 8, 9, 10`, ponti.every((x, i) => i === 0 || x > ponti[i - 1]),
            ponti.map(x => x.toFixed(0)).join(' '))
}

// senza tipo il modulo ne sceglie uno, e uno spento non esce
{
  const viste = new Set()
  for (let i = 0; i < 200; i++) viste.add(conti.chiedi(5, new Sorte(i)).chiave)
  uguale('chiedi senza tipo li fa uscire tutti e quattro', viste.size, 4)
  let uscite = 0
  for (let i = 0; i < 200; i++) if (conti.chiedi(5, new Sorte(i), ['divisioni']).chiave === 'conti:quoziente') uscite++
  uguale('spente le divisioni il quoziente non esce', uscite, 0)
  uscite = 0
  for (let i = 0; i < 200; i++) if (conti.chiedi(5, new Sorte(i), ['conti:prodotto']).chiave === 'conti:prodotto') uscite++
  uguale('spenta la sola tipologia prodotto non esce', uscite, 0)
}

/* ═══════════ 2. la scelta: il registro è passato a mano (in Node non c'è) ═══════════ */
const CON = [...altri, conti]
const SENZA = altri
const ids = lista => lista.map(m => m.id).join(' ')

uguale('senza nominarlo il mazzo non ha i conti', ids(moduliAmmessi({ elenco: CON })), ids(SENZA))
uguale('nemmeno restringendo per materia',
       ids(moduliAmmessi({ elenco: CON, materie: ['matematica'] })),
       ids(SENZA.filter(m => m.materia === 'matematica')))
uguale('nemmeno con dei saperi spenti',
       ids(moduliAmmessi({ elenco: CON, spenti: ['frazioni', 'moltiplicazioni'] })),
       ids(moduliAmmessi({ elenco: SENZA, spenti: ['frazioni', 'moltiplicazioni'] })))
uguale('nominato, c\'è', ids(moduliAmmessi({ elenco: CON, moduli: ['conti'] })), 'conti')
uguale('nominato insieme a un altro, ci sono tutti e due',
       ids(moduliAmmessi({ elenco: CON, moduli: ['conti', 'frazioni'] })).split(' ').sort().join(' '), 'conti frazioni')

{ // «le domande di survivors e sotterraneo non cambiano»: stesso seme, stessa sequenza, con o senza il modulo nuovo
  const giro = (elenco, regole) => {
    const sorte = new Sorte(20261012)
    const out = []
    let evita
    for (let i = 0; i < 400; i++) {
      const q = domandaPerGioco({ difficolta: [0.15, 0.5, 0.85][i % 3], evita, sorte, elenco,
                                  spenti: [], bisogno: null, regole })
      evita = q.modulo
      out.push(`${q.modulo}/${q.grado}/${JSON.stringify(q.domanda)}`)
    }
    return out
  }
  for (const regole of [null, { eta: 8 }]) {
    const prima = giro(SENZA, regole), dopo = giro(CON, regole)
    controlla(`400 domande di giochi generali identiche con e senza i conti (${regole ? 'età 8' : 'senza età'})`,
              prima.every((x, i) => x === dopo[i]))
    controlla('e nessuna è un conto puro', dopo.every(x => !x.startsWith('conti/')))
  }
  // le stesse coi saperi spenti: il ripiego (spento tutto) non va a ripescare i conti
  const sorte = new Sorte(5)
  const tuttiSpenti = ['numeri', 'moltiplicazioni', 'divisioni', 'decine', 'stima', 'misure', 'conversioni', 'frazioni',
                       'dati', 'problemi', 'bilance', 'denaro', 'decimali']
  let ripescati = 0
  for (let i = 0; i < 200; i++)
    if (domandaPerGioco({ elenco: CON, sorte, spenti: tuttiSpenti, bisogno: null, regole: null,
                          materie: ['matematica'], difficolta: 0.5 }).modulo === 'conti') ripescati++
  uguale('anche spento tutto, il ripiego non ripesca i conti', ripescati, 0)
}

/* ═══════════ 3. chi lo nomina: il tipo e la grandezza ═══════════ */
const chiedi = (opz, n = 120, seme = 1) => {
  const sorte = new Sorte(seme)
  return Array.from({ length: n }, () =>
    domandaPerGioco({ elenco: CON, sorte, spenti: [], bisogno: null, regole: null, moduli: ['conti'], ...opz }))
}

{
  const q = chiedi({ tipi: ['prodotto'], grado: 6 }, 1)[0]
  // il formato che Domanda.vue si aspetta: domanda, pittori, titolo da modulo/nome/icona, origine con modulo/grado/materia
  controlla('il risultato ha tutto quello che Domanda.vue legge',
            q.domanda && q.pittori && q.modulo === 'conti' && q.nome && q.icona && q.materia === 'matematica' && q.grado === 6)
  uguale('e la domanda è ben formata', guastiDi(q.domanda, { pittori: q.pittori }).length, 0)
}

for (const nome of NOMI) {
  const breve = chiedi({ tipi: [nome] }, 150)
  controlla(`tipi: ['${nome}'] dà solo ${nome}`, breve.every(q => q.domanda.chiave === 'conti:' + nome))
  const intera = chiedi({ tipi: ['conti:' + nome] }, 50)
  controlla(`la chiave intera conti:${nome} fa lo stesso`, intera.every(q => q.domanda.chiave === 'conti:' + nome))
  controlla(`${SEGNO[nome]} è il segno della consegna`, breve.every(q => q.domanda.testo.includes(` ${SEGNO[nome]} `)))
  for (const g of [1, 4, 7, 10]) {
    const fissi = chiedi({ tipi: [nome], grado: g }, 40)
    controlla(`${nome}, grado: ${g} dà il grado ${g}`, fissi.every(q => q.grado === g))
  }
}
controlla('due tipi insieme: escono tutti e solo quei due',
          (() => {
            const chiavi = new Set(chiedi({ tipi: ['somma', 'differenza'] }, 200).map(q => q.domanda.chiave))
            return chiavi.size === 2 && chiavi.has('conti:somma') && chiavi.has('conti:differenza')
          })())
controlla('senza tipi escono tutti e quattro', new Set(chiedi({}, 200).map(q => q.domanda.chiave)).size === 4)
controlla('un tipo che non esiste non rompe il gioco: ricade su tutti',
          chiedi({ tipi: ['radice'] }, 20).length === 20)
controlla('un grado fuori scala resta dentro', chiedi({ grado: 99 }, 10).every(q => q.grado === 10) &&
                                              chiedi({ grado: 0.4 }, 10).every(q => q.grado >= 1))

// con un'età la campana dei gradi ammessi si stringe: il grado chiesto scende al più alto aperto, mai sale
{
  const cinque = { eta: 5 }
  const q = chiedi({ tipi: ['quoziente'], grado: 10, regole: cinque }, 30)
  const aperti = classiAmmesse({ elenco: CON, moduli: ['conti'], tipi: ['quoziente'], regole: cinque, difficolta: 1 })
  controlla('a cinque anni il grado 10 delle divisioni è chiuso, e si scende a un grado più basso',
            q.every(x => x.grado <= 10) && q.every(x => x.grado === q[0].grado),
            `gradi ${[...new Set(q.map(x => x.grado))]}`)
  nota(`a cinque anni, quoziente grado 10 → grado ${q[0].grado} (aperti: ${[...new Set(aperti.map(c => c.grado))]})`)
}

// la difficoltà 0..1 sotto un'età sceglie la grandezza: la media del grado non scende mai
for (const nome of NOMI) {
  const medie = [0, 0.25, 0.5, 0.75, 1].map(difficolta => {
    const gradi = chiedi({ tipi: [nome], difficolta, regole: { eta: 9 } }, 300, 11).map(q => q.grado)
    return gradi.reduce((s, x) => s + x, 0) / gradi.length
  })
  controlla(`${nome}: più difficoltà, grado medio mai più basso (a nove anni)`,
            medie.every((m, i) => i === 0 || m >= medie[i - 1] - 0.05), medie.map(m => m.toFixed(2)).join(' '))
  controlla(`${nome}: tra difficoltà 0 e 1 il grado medio sale davvero`, medie[4] - medie[0] >= 1, medie.map(m => m.toFixed(2)).join(' '))
  nota(`${nome}, grado medio per difficoltà 0 .25 .5 .75 1: ${medie.map(m => m.toFixed(1)).join(' ')}`)
}

// i saperi spenti dai genitori tolgono il tipo, anche se è proprio lui che si chiede
{
  const q = chiedi({ tipi: ['quoziente'], spenti: ['divisioni'] }, 20)
  controlla('chiesto un tipo spento il gioco ha comunque una domanda', q.length === 20 && q.every(x => x.domanda.risposte.length === 4))
  const altro = chiedi({ spenti: ['divisioni'] }, 200)
  controlla('spente le divisioni, senza chiedere un tipo il quoziente non esce',
            altro.every(x => x.domanda.chiave !== 'conti:quoziente'))
}

riassunto('i conti puri')
