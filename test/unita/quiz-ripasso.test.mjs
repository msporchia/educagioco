/* ═══════════════════════════════════════════════════════════════════
   IL RIPASSO DELLE DOMANDE — quanto pesa quello che il bambino sa meno
   tempo: 20

   Da quando le risposte alle domande di scuola finiscono in
   `store/srs.js`, la pesca non è più cieca: una tipologia che va male
   esce più spesso di una saputa. Questo test guarda **quanto** più
   spesso, perché è tutta la differenza fra un aiuto e una punizione.

   Il patto, scritto in `nucleo/bisogno.js`, è una banda stretta: 0.5
   per quello che sa, 1.5 per quello che non sa. Con dieci cose che
   pesano un decimo, quella che sa scende al 5% e quella che non sa
   sale al 15%. Le altre continuano a uscire come prima — è il punto:
   qui la domanda è il pedaggio di un gioco d'avventura, e una partita
   di sola geometria a chi la geometria non la capisce sarebbe una
   punizione per essere andato male.

   La cosa che si può sbagliare senza accorgersene è il DOPPIO CONTO. I
   livelli di scelta sono due — prima la classe (modulo, grado), poi la
   tipologia dentro — e mettere il fattore pieno tutte e due le volte
   darebbe un rapporto di nove a uno invece che di tre. Perciò la
   classe usa la *media* dei suoi tipi, e qui si conta che il rapporto
   finale sia davvero quello dichiarato.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'
import { classiDi, pescaClasse } from '../../src/quiz/nucleo/classi.js'
import { BISOGNO, bisognoDa, saputo } from '../../src/quiz/nucleo/bisogno.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { SRS, newItem, record } from '../../src/store/srs.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')

const moduli = []
if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const mod = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
    if (mod) moduli.push(mod)
  }
controlla('i moduli si raccolgono da soli', moduli.length > 0)

const ORA = Date.parse('2026-03-01T10:00:00Z')

/* ═══════════ la banda, che è tutto il patto ═══════════ */
uguale('mai visto è neutro', bisognoDa(undefined, ORA), 1)
uguale('e anche un elemento appena creato', bisognoDa(newItem(), ORA), 1)
uguale('non si sa niente di chi non ha mai risposto', saputo(newItem(), ORA), null)

const sbagliato = record(newItem(), { correct: false, now: ORA })
const saputoBene = (() => {
  let it = newItem()
  for (let i = 0; i < SRS.masterS; i++) it = record(it, { correct: true, now: ORA })
  return it
})()

uguale('chi sbaglia sta in cima alla banda', bisognoDa(sbagliato, ORA), BISOGNO.max)
uguale('chi lo sa sta in fondo', bisognoDa(saputoBene, ORA), BISOGNO.min)
controlla('e in mezzo si sta in mezzo',
          bisognoDa(record(newItem(), { correct: true, now: ORA }), ORA) > BISOGNO.min &&
          bisognoDa(record(newItem(), { correct: true, now: ORA }), ORA) < BISOGNO.max)
uguale('gli estremi sono quelli concordati', `${BISOGNO.min}÷${BISOGNO.max}`, '0.5÷1.5')

/* ── il tempo che passa riporta in cima ──
   Un concetto saputo e poi lasciato per mesi torna a valere quanto uno
   che non si sa: è il decadimento di `srs.js`, e qui serve che arrivi
   fino in fondo invece di fermarsi a metà. */
const fraUnAnno = ORA + 365 * 86400000
controlla('quello che sapeva un anno fa torna in cima alla banda',
          bisognoDa(saputoBene, fraUnAnno) === BISOGNO.max)

/* ═══════════ il rapporto vero, contato esatto ═══════════
   Le probabilità si CALCOLANO invece di stimarle a tiri, e non è
   pigrizia al contrario: una tipologia media esce quattro volte su
   cento, e per distinguere un 1.5 da un 1.3 con quei numeri servono
   decine di migliaia di partite. Il conto esatto è due righe — la
   probabilità di una classe per quella della tipologia dentro — e
   misura proprio la cosa che si vuole provare: che i due livelli si
   compongano in un fattore solo.
   I tiri veri restano più sotto, dove serve guardare le fette. */
function probabilita(bisogno, difficolta = 0.5) {
  const classi = classiDi(moduli, { difficolta, bisogno })
  const totale = classi.reduce((s, c) => s + c.peso, 0)
  const fuori = new Map()
  for (const { modulo, grado, peso } of classi) {
    const tipi = modulo.tipiLiberi(grado)
      .map(t => ({ ...t, peso: t.peso * (bisogno ? bisogno(t.chiave) : 1) }))
    const somma = tipi.reduce((s, t) => s + t.peso, 0)
    for (const t of tipi)
      fuori.set(t.chiave, (fuori.get(t.chiave) || 0) + (peso / totale) * (t.peso / somma))
  }
  return fuori
}

const neutre = probabilita(null)
uguale('le probabilità fanno uno', [...neutre.values()].reduce((s, p) => s + p, 0).toFixed(6), '1.000000')

/* la tipologia di prova: quella che a difficoltà media esce di più */
const [CHIAVE, BASE] = [...neutre.entries()].sort((a, b) => b[1] - a[1])[0]
nota(`la tipologia più frequente a 0.5 è ${CHIAVE}, ${(BASE * 100).toFixed(2)}% dei tiri`)

const soloQuella = f => chiave => (chiave === CHIAVE ? f : 1)
const su = probabilita(soloQuella(BISOGNO.max)).get(CHIAVE) / BASE
const giu = probabilita(soloQuella(BISOGNO.min)).get(CHIAVE) / BASE
nota(`${CHIAVE}: non saputa ×${su.toFixed(3)}, saputa ×${giu.toFixed(3)}, ` +
     `rapporto ${(su / giu).toFixed(2)}`)

dentro('chi non la sa esce una volta e mezza', su, 1.45, 1.5)
dentro('chi la sa esce la metà', giu, 0.5, 0.52)
/* poco meno di tre e non tre esatti: alzare una tipologia alza anche il
   totale su cui si normalizza, quindi ognuna guadagna un filo meno di
   quanto dice il suo fattore. È il conto giusto, non un errore */
dentro('e fra i due estremi ci sono tre volte, non nove', su / giu, 2.85, 3.0)

/* ── il doppio conto, guardato in faccia ──
   Se il fattore entrasse pieno tutte e due le volte, una tipologia che
   condivide il grado con altre andrebbe a 2.25 invece che a 1.5. Si
   cerca apposta una tipologia che NON sia sola nel suo grado: dove è
   sola i due conti coincidono e il difetto non si vedrebbe. */
const inCompagnia = (() => {
  for (const m of moduli)
    for (let g = 1; g <= m.gradi; g++) {
      const tipi = m.tipiDi(g)
      if (tipi.length >= 3) return tipi[0].chiave
    }
  return null
})()
if (inCompagnia) {
  const base = neutre.get(inCompagnia)
  const alzata = probabilita(k => (k === inCompagnia ? BISOGNO.max : 1)).get(inCompagnia)
  nota(`${inCompagnia} (in un grado affollato): ×${(alzata / base).toFixed(3)}`)
  dentro('una tipologia che divide il grado con altre sale di una volta e mezza, non del quadrato',
         alzata / base, 1.4, 1.55)
}

/* ── il ripasso sposta la frequenza, non l'elenco ──
   Nessuna tipologia deve andare a zero perché il bambino sa bene
   qualcos'altro: sono le stesse domande di prima, in ordine diverso. */
const conRipasso = probabilita(k => (k.startsWith('gri:') ? BISOGNO.max : BISOGNO.min))
const sparite = [...neutre.keys()].filter(k => !(conRipasso.get(k) > 0))
uguale('col ripasso acceso non sparisce nessuna tipologia', sparite.length, 0)

/* ═══════════ e adesso i tiri veri ═══════════ */
const TIRI = 6000

const conta = (bisogno, difficolta = 0.5, seme = 7) => {
  const sorte = new Sorte(seme)
  const classi = classiDi(moduli, { difficolta, bisogno })
  const quante = new Map()
  for (let i = 0; i < TIRI; i++) {
    const { modulo, grado } = pescaClasse(sorte, classi)
    const d = modulo.chiedi(grado, sorte, [], bisogno)
    const k = d.chiave || `${modulo.id}/${grado}`
    quante.set(k, (quante.get(k) || 0) + 1)
  }
  return quante
}

/* ═══════════ e il tetto: neanche il caso peggiore travolge ═══════════
   Un bambino che sbaglia tutta una materia. Deve vederla più spesso,
   non solo quella: le altre non scendono mai sotto la metà, e nessuna
   classe si prende più di un quinto dei tiri — la stessa soglia di
   `unita/quiz-pesi`, che qui va tenuta anche col ripasso acceso. */
const materiaNera = moduli.find(m => m.materia === 'spazio') || moduli[0]
const chiaviNere = new Set(materiaNera.tipi.map(t => t.chiave))
const tuttoSbagliato = chiave => (chiaviNere.has(chiave) ? BISOGNO.max : BISOGNO.min)

for (const d of [0.15, 0.5, 0.85]) {
  const quante = conta(tuttoSbagliato, d, 3)
  const totale = [...quante.values()].reduce((s, n) => s + n, 0)
  const suaFetta = [...quante.entries()]
    .filter(([k]) => chiaviNere.has(k)).reduce((s, [, n]) => s + n, 0) / totale
  const massima = Math.max(...quante.values()) / totale
  controlla(`a ${d} la materia sbagliata non si prende mezza partita`, suaFetta < 0.4,
            `${materiaNera.id} prende il ${(suaFetta * 100).toFixed(1)}%`)
  controlla(`a ${d} nessuna tipologia oltre un quinto dei tiri`, massima <= 0.2,
            `la più frequente prende il ${(massima * 100).toFixed(1)}%`)
  nota(`a ${d}: ${materiaNera.id} sbagliato tutto prende il ${(suaFetta * 100).toFixed(1)}% ` +
       `(la più frequente ${(massima * 100).toFixed(1)}%)`)
}

/* ── e il caso è ancora ripetibile ── */
const righe = m => [...m.entries()].sort().map(([k, n]) => `${k}:${n}`).join(' ')
uguale('stesso seme e stesso ripasso, stessa distribuzione',
       righe(conta(tuttoSbagliato, 0.5, 11)), righe(conta(tuttoSbagliato, 0.5, 11)))

riassunto('il ripasso delle domande di scuola')
