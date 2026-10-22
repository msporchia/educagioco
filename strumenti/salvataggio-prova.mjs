/* Un salvataggio da caricare («Salvataggi › Rimetti da un file») per vedere «Come va» e le impostazioni con un bambino che ha già giocato.
   Aggiunge un bambino di prova col suo id (`prova-<scenario>`): non sostituisce nessuno, e si elimina da Bambino › Elimina.
   Fuori dal profilo non c'è niente (le sessioni, le fotografie settimanali): «Quanto ha giocato» e le frecce partono vuote.
   Uso: node strumenti/salvataggio-prova.mjs [--scenario alcune|bene|tante|piu-difficili] [--nome Prova] [--out file.json]
   Scenari (cosa dice la frase in cima a «Come va»): `bene` nessuna domanda va male; `alcune` tre del suo livello vanno male (una già alleggerita
   dal gioco); `piu-difficili` va male solo qualcuna di un passo avanti; `tante` molte vanno male. Docs: docs/core/comandi.md */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d }
const scenario = arg('scenario', 'alcune')
const nome = arg('nome', 'Prova')
const id = `prova-${scenario}`
const ORA = Date.now(), GIORNO = 86400000

/* [chiave, giuste, sbagliate]: le tipologie dei quiz che a otto anni arrivano (una per tipo di materia), i conti delle tabelline e qualche parola inglese */
const BUONE = [
  ['num:confronto', 14, 2], ['num:linea', 9, 3], ['num:ordine', 11, 2],
  ['ora:intere', 12, 0], ['gri:area', 7, 3], ['sil:rima', 9, 1], ['conn:capisci', 8, 2],
  ['indizi:forme', 8, 2], ['ana:figure', 9, 3], ['cal:giorni', 10, 1],
]
const SCENARI = {
  bene: [],
  alcune: [['num:posiziona', 4, 6], ['ora:quarti', 10, 10], ['capire:indizio', 3, 9]],
  'piu-difficili': [['gri:perimetro', 3, 7]],
  tante: [['num:posiziona', 3, 8], ['ora:quarti', 4, 8], ['capire:indizio', 2, 9], ['gri:perimetro', 3, 7], ['conn:capisci', 3, 9], ['indizi:forme', 3, 7]],
}
if (!SCENARI[scenario]) { console.error(`scenario sconosciuto: ${scenario} (${Object.keys(SCENARI).join(', ')})`); process.exit(1) }
const quiz = new Map(BUONE.map(([k, ok, err]) => [k, [ok, err]]))
for (const [k, ok, err] of SCENARI[scenario]) quiz.set(k, [ok, err])

const items = {}
const voce = (ok, err, i) => ({ s: ok > err ? 3 : 1, ok, err, seen: ok + err, t: 5000 + i * 200, last: ORA - (i % 6) * GIORNO })
let i = 0
for (const [k, v] of quiz) items[k] = voce(v[0], v[1], i++)
for (const [t, [ok, err]] of Object.entries({ '3x4': [4, 0], '6x7': [5, 2], '7x8': [3, 4], '9x6': [6, 1] }))
  items['math:' + t] = voce(ok, err, i++)
for (const [w, [ok, err]] of Object.entries({ dog: [6, 0], cat: [5, 1], apple: [4, 2], house: [5, 0] }))
  items['en:' + w] = voce(ok, err, i++)

/* la classe che a ottobre/gennaio è «terza» (8 anni): come `etaDiClasse` in src/data/nascita.js */
const oggi = new Date(), anno = oggi.getMonth() >= 8 ? oggi.getFullYear() : oggi.getFullYear() - 1
const settings = { sound: true, eta: 8, nascita: { m: 2, a: anno - 8 }, scarto: 0, giochi: {}, sa: {}, ritocchi: {}, tuttoAperto: false }
if (quiz.has('num:posiziona') && SCENARI[scenario].some(r => r[0] === 'num:posiziona'))
  settings.alleggerite = { 'num:posiziona': { quando: ORA - 2 * GIORNO, ok: 4, err: 6 } }

const profilo = { v: 7, coins: 120, items, settings, totals: { math: 18, mente: 0, en: 20 }, campagne: {} }
const dati = { tipo: 'giochi-bambini', v: 2, esportato: new Date().toISOString(), giocatori: [{ id, nome }], profili: { [id]: profilo } }
const fuori = resolve(arg('out', resolve(QUI, '..', 'tmp', `salvataggio-prova-${scenario}.json`)))
mkdirSync(dirname(fuori), { recursive: true })
writeFileSync(fuori, JSON.stringify(dati, null, 1) + '\n')
console.log(`${fuori}\n  scenario «${scenario}», bambino «${nome}» (id ${id}), ${Object.keys(items).length} tipologie con risposte`)
