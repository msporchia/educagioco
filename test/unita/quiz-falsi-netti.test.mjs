/* ═══════════════════════════════════════════════════════════════════
   I FALSI SONO SBAGLIATI SENZA DISCUSSIONE — senza browser.
   `node test/esegui.mjs quiz-falsi --niente-build`

   Il banco guarda la forma; qui si guarda che fra le scelte non ci sia
   mai una seconda risposta che «tutto sommato va bene» (vedi il punto 2
   di docs/apprendimento/quiz-moduli.md). Ogni controllo gioca qualche
   migliaio di domande e conta i casi dubbi: devono essere zero.
   ═══════════════════════════════════════════════════════════════════ */
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import lessico from '../../src/quiz/moduli/lessico.js'
import misure from '../../src/quiz/moduli/misure.js'
import geometria from '../../src/quiz/moduli/geometria.js'
import sillabe from '../../src/quiz/moduli/sillabe.js'
import connettivi from '../../src/quiz/moduli/connettivi.js'
import calendario from '../../src/quiz/moduli/calendario.js'
import { altreVoci, vociFinoA, GRADI } from '../../src/quiz/inglese.js'
import { SIMILI, WORDS } from '../../src/data/words.js'
import { SIMILI_ES, PAROLE_ES } from '../../src/data/parole-es.js'
import { voceDi, chiaveParolaDi } from '../../src/data/lessico.js'
import { componi } from '../../src/data/domande.js'
import { controlla, nota, riassunto } from '../aiuto/verifica.mjs'

const N = 3000
const gioca = (modulo, grado, tipo, f) => { for (let i = 1; i <= N; i++) f(modulo.genera(grado, new Sorte(i), tipo), i) }
const falsiDi = d => d.risposte.filter((_, k) => k !== d.giusta)

// il quadrato non sta mai con il rombo e il rettangolo, né fra i nomi né fra le figure
{
  const litiga = (a, b) => [['quadrato', 'rombo'], ['quadrato', 'rettangolo']].some(c => c.includes(a) && c.includes(b))
  let male = 0
  for (const tipo of ['geo:figure', 'geo:quadrilateri']) gioca(geometria, 1, tipo, d => {
    const bersaglio = d.soggetto?.scena?.forma ?? d.testo.match(/è un (\w+)\?/)?.[1]
    if (falsiDi(d).some(x => litiga(bersaglio, x.testo ?? x.scena?.forma))) male++
  })
  controlla('geometria: nessun falso è anche un caso della giusta', male === 0, `${male} domande`)
}

// un taglio dentro st/sp/sc non è mai un falso (pas-ta, mi-nes-tra)
{
  let male = 0
  gioca(sillabe, 2, 'sil:dividi', d => { if (falsiDi(d).some(x => /s-[^aeiou-]/.test(x.testo))) male++ })
  controlla('sillabe: nessun falso taglia fra la s e la consonante', male === 0, `${male} domande`)
}

// le unità false di «con che cosa misuri» sono lontane: mai un pane in kg o una passeggiata in m
{
  const FATTORE = { mm: 1, cm: 10, m: 1000, km: 1e6, g: 1, kg: 1e3, q: 1e5, t: 1e6, ml: 1, cl: 10, l: 1e3 }
  const TIPO = { mm: 'L', cm: 'L', m: 'L', km: 'L', g: 'P', kg: 'P', q: 'P', t: 'P', ml: 'C', cl: 'C', l: 'C' }
  const COSE = [
    ['un pane', 500, 'g'], ['una passeggiata al parco', 2, 'km'], ['un elefante', 5, 't'], ['un cavallo', 500, 'kg'],
    ['una bottiglia d\'acqua', 1.5, 'l'], ['una lattina di bibita', 330, 'ml'], ['una penna', 14, 'cm'], ['una maratona', 42, 'km'],
  ]
  let male = 0
  gioca(misure, 1, 'mis:unita', d => {
    const cosa = COSE.find(c => d.testo.includes(c[0]))
    if (!cosa) return
    const base = cosa[1] * FATTORE[cosa[2]]
    for (const f of falsiDi(d)) {
      if (TIPO[f.testo] !== TIPO[cosa[2]]) continue
      const v = base / FATTORE[f.testo]
      if (v >= 0.01 && v < 1e5) male++
    }
  })
  controlla('misure: nessuna unità falsa è in uso per la cosa', male === 0, `${male} falsi`)
}

// nelle frasi di contrasto di «mentre» i due fatti non sono contemporanei: niente «ieri… oggi» a metà
{
  let senza = 0
  gioca(connettivi, 5, 'conn:mentre-doppio', d => {
    if (d.risposte[d.giusta].testo !== 'invece') return
    if (!/(da piccol[oa]|ieri|oggi|adesso|anno|lunedì|estate|inizio|capitolo)/i.test(d.soggetto.testo)) senza++
  })
  controlla('connettivi: ogni «invece» ha due momenti diversi', senza === 0, `${senza} domande`)
}

// «perché» col «se» regge quasi sempre («andremo al parco perché domani non piove»): non si offre
{
  let male = 0
  for (const tipo of ['conn:condizione', 'conn:concessione']) gioca(connettivi, 5, tipo, d => {
    if (d.risposte[d.giusta].testo === 'se' && falsiDi(d).some(x => x.testo === 'perché')) male++
  })
  controlla('connettivi: col «se» non c\'è mai «perché» fra le scelte', male === 0, `${male} domande`)
}

// le date delle stagioni stanno a due settimane da tutti i cambi, anche da quello dei meteorologi
{
  const GG = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
  const giorno = (m, g) => GG.slice(0, m).reduce((a, b) => a + b, 0) + g
  const cambi = [[2, 1], [2, 21], [5, 1], [5, 21], [8, 1], [8, 23], [11, 1], [11, 21]].map(([m, g]) => giorno(m, g))
  let vicine = 0
  gioca(calendario, 3, 'cal:stagioni', d => {
    const m = d.testo.match(/cade il (\d+) (\w+)\?/)
    if (!m) return
    const quando = giorno(MESI.indexOf(m[2]), +m[1])
    if (cambi.some(c => Math.min(Math.abs(quando - c), 365 - Math.abs(quando - c)) < 14)) vicine++
  })
  controlla('calendario: nessuna data a meno di due settimane da un cambio di stagione', vicine === 0, `${vicine} domande`)
}

// «Il bambino ___ sul letto»: restano sempre tre falsi, e nessuno è un verbo che il soggetto sa fare
{
  let poche = 0, corse = 0
  gioca(lessico, 4, 'less:frase', d => {
    if (d.risposte.length < 4) poche++
    const soggetto = d.testo.split(' ___')[0]
    if (/^(Il|La) (bambin[oa])$/.test(soggetto) && falsiDi(d).some(x => ['corse', 'ballò', 'starnutì'].includes(x.testo)) &&
        /sul letto/.test(d.testo)) corse++
  })
  controlla('lessico: ogni frase ha tre falsi', poche === 0, `${poche} frasi`)
  controlla('lessico: un bambino che salta sul letto non ha «corse» fra i falsi', corse === 0, `${corse} frasi`)
}

// le coppie di SIMILI esistono, e le due voci non escono mai insieme
{
  const en = new Set(WORDS.map(v => v[0])), es = new Set(PAROLE_ES.map(v => v[0]))
  const mancano = [...SIMILI.flat().filter(x => !en.has(x)), ...SIMILI_ES.flat().filter(x => !es.has(x))]
  controlla('lingue: ogni voce dei SIMILI esiste', mancano.length === 0, mancano.join(', '))
  const simili = new Set(SIMILI.flatMap(([a, b]) => [`en:${a}|en:${b}`, `en:${b}|en:${a}`]))
  let insieme = 0
  for (let g = 1; g <= GRADI; g++) {
    const sorte = new Sorte(g)
    for (const voce of vociFinoA(g))
      for (let i = 0; i < 6; i++)
        if (altreVoci(voce, g, sorte, 3).some(x => simili.has(`${voce.chiave}|${x.chiave}`))) insieme++
  }
  controlla('lingue: i distrattori non sono mai una voce simile alla giusta', insieme === 0, `${insieme} domande`)

  // e nemmeno nei giochi English ed Español, che pescano da `distrattori()` di data/domande.js
  let nelGioco = 0, provate = 0
  for (const [lingua, coppie] of [['en', SIMILI], ['es', SIMILI_ES]])
    for (const [a, b] of coppie) for (const [x, y] of [[a, b], [b, a]]) {
      const v = voceDi(chiaveParolaDi(lingua)(x)), w = voceDi(chiaveParolaDi(lingua)(y))
      for (let i = 0; i < 40; i++) {
        const d = componi(v, 'tradIt'); provate++
        if (d.opzioni.some(o => !o.giusta && o.testo === w.it)) nelGioco++
      }
    }
  controlla('lingue: nei giochi una voce simile non è mai fra le risposte', nelGioco === 0, `${nelGioco} su ${provate}`)
}

nota(`${N} domande per controllo`)
riassunto('i falsi delle domande sono sbagliati senza discussione')
