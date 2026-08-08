/* ═══════════════════════════════════════════════════════════════════
   INCIDI LE VOCI — `npm run voci`

   Perché esiste: la sintesi vocale del dispositivo (speechSynthesis) è
   una lotteria. Su Android va spesso bene, su Linux esce espeak — che è
   incomprensibile — e su telefoni vecchi non si sa. Per un bambino che
   sta imparando, una pronuncia sbagliata è peggio del silenzio.

   Quindi la pronuncia la incidiamo noi, una volta sola, con una voce
   neurale (edge-tts, le voci di Microsoft), e la infiliamo dentro il
   file HTML. Stessa voce su ogni telefono, anche senza rete.

   ── Perché SPRITE e non un file per parola ──
   L'intestazione di un file audio pesa più o meno quanto mezzo secondo
   di parlato. Con 550 parole da 0,7 secondi l'una, metà del peso
   sarebbe intestazioni. Le parole vengono quindi concatenate per
   categoria in pochi file lunghi (gli "sprite"), e un indice dice a che
   secondo comincia ciascuna: `dog → ['a1', 3.42, 0.61]`. Il peso cala
   di due terzi e la riproduzione diventa immediata, perché lo sprite si
   decodifica una volta sola (vedi `src/voce.js`).

   ── Il lavoro è INCREMENTALE ──
   Le clip già incise stanno in `.voci-cache/` (fuori da git). Aggiungi
   parole a `words.js` o `verbi.js`, rilancia `npm run voci` e incide
   solo le nuove; gli sprite si ricostruiscono da soli, sono veloci.
   Cambiando voce o velocità la cache viene invalidata e si rifà tutto.

   ── Due lingue, due incisioni ──
   L'inglese e lo spagnolo hanno voce, cache e file d'uscita separati:
   `--lingua es` incide `parole-es.js` e `verbi-es.js` con una voce
   boliviana dentro `src/data/voci-es.js`. Senza l'opzione si fa
   l'inglese, come è sempre stato.

   Uso:
     npm run voci                          incide ciò che manca (inglese)
     npm run voci -- --lingua es           lo spagnolo
     npm run voci -- --voce en-GB-LibbyNeural
     npm run voci -- --velocita=-20%
     npm run voci -- --bitrate 24k         più qualità, file più grosso
     npm run voci -- --tutto               reincide da capo
     npm run voci -- --elenca              le voci disponibili per la lingua

   Serve: python3 (per edge-tts, installato da solo in .venv-voci/) e
   ffmpeg con libopus.
   ═══════════════════════════════════════════════════════════════════ */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile, mkdir, readdir, rm, mkdtemp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WORDS } from '../src/data/words.js'
import { VERBI } from '../src/data/verbi.js'
import { PAROLE_ES } from '../src/data/parole-es.js'
import { VERBI_ES } from '../src/data/verbi-es.js'

const esegui = promisify(execFile)
// lo script vive in strumenti/, ma cache, venv e uscita stanno nel repo
const RADICE = join(dirname(fileURLToPath(import.meta.url)), '..')
const VENV = join(RADICE, '.venv-voci')

/* ---------- opzioni ---------- */
const argomenti = process.argv.slice(2)
const opzione = (nome, difetto) => {
  const i = argomenti.findIndex(a => a === '--' + nome || a.startsWith('--' + nome + '='))
  if (i < 0) return difetto
  const a = argomenti[i]
  return a.includes('=') ? a.slice(a.indexOf('=') + 1) : (argomenti[i + 1] ?? difetto)
}
/* ---------- le lingue che si sanno incidere ----------
   L'inglese con una voce britannica, lo spagnolo con una boliviana:
   è la lingua di casa, e vale la pena che i bambini la sentano con
   l'accento che sentono dalla mamma. */
const LINGUE = {
  en: { nome: 'inglese', voce: 'en-GB-SoniaNeural',
        uscita: 'src/data/voci.js', cache: '.voci-cache',
        parole: WORDS, verbi: VERBI, fonti: 'words.js o verbi.js' },
  es: { nome: 'spagnola', voce: 'es-BO-SofiaNeural',
        uscita: 'src/data/voci-es.js', cache: '.voci-cache-es',
        parole: PAROLE_ES, verbi: VERBI_ES, fonti: 'parole-es.js o verbi-es.js' },
}

const LINGUA = opzione('lingua', 'en')
const CFG = LINGUE[LINGUA]
if (!CFG) {
  console.error(`✗ lingua sconosciuta: ${LINGUA}. Ci sono: ${Object.keys(LINGUE).join(', ')}`)
  process.exit(1)
}

const NOME_LINGUA = CFG.nome
const USCITA = join(RADICE, CFG.uscita)
const CACHE = join(RADICE, CFG.cache)          // una cache per lingua: le clip non si mescolano
const VOCE = opzione('voce', CFG.voce)
const VELOCITA = opzione('velocita', '-10%')     // un filo lenta: sono bambini
const BITRATE = opzione('bitrate', '16k')        // opus: a 16k il parlato è già pulito
const RIFAI_TUTTO = argomenti.includes('--tutto')
const SOLO_ELENCO = argomenti.includes('--elenca')
const PARALLELE = 6
const STACCO = 0.25                              // silenzio fra una parola e l'altra
const PER_SPRITE = 30                            // parole per sprite: ~25 s l'uno

/* ---------- da incidere: tutto il lessico della lingua ---------- */
const DA_INCIDERE = [
  ...CFG.parole.map(w => ({ parola: w[0], gruppo: w[3] })),
  ...CFG.verbi.map(v => ({ parola: v[0], gruppo: 'v' })),
]

/* I nomi che il DOS si tenne per sé — CON, PRN, AUX, NUL, COM1…LPT9 — su
   Windows sono vietati **anche con l'estensione**: `con.wav` non si crea,
   non si scompatta e non si clona. Sembra un caso di scuola e invece
   capita: in spagnolo «con» è una preposizione, e la sua clip finiva lì.
   Chi ci casca se ne accorge solo su Windows, con un errore che parla di
   permessi e non di nomi. Un underscore in coda e il file torna un file. */
const RISERVATI = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i
const slug = p => {
  const s = p.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  return RISERVATI.test(s) ? s + '_' : s
}
const nelCache = p => join(CACHE, slug(p) + '.wav')

/* ---------- edge-tts: c'è, o me lo installo ---------- */
async function trovaEdgeTts() {
  const nelVenv = join(VENV, 'bin/edge-tts')
  if (existsSync(nelVenv)) return nelVenv
  try { await esegui('edge-tts', ['--version']); return 'edge-tts' } catch { /* lo installiamo */ }
  console.log('· edge-tts non c\'è: lo installo in .venv-voci/ (una volta sola, serve la rete)')
  await esegui('python3', ['-m', 'venv', VENV])
  await esegui(join(VENV, 'bin/pip'), ['install', '--quiet', 'edge-tts'])
  return nelVenv
}

async function verificaFfmpeg() {
  try {
    const { stdout } = await esegui('ffmpeg', ['-encoders'])
    if (!stdout.includes('libopus')) throw new Error('manca libopus')
  } catch (e) {
    console.error('✗ serve ffmpeg con libopus: ' + e.message)
    process.exit(1)
  }
}

/* ---------- la cache sa con che voce è stata incisa ---------- */
const firma = () => `${VOCE} ${VELOCITA}`
async function cacheValida() {
  if (RIFAI_TUTTO) return false
  try { return (await readFile(join(CACHE, 'firma.txt'), 'utf8')).trim() === firma() }
  catch { return false }
}

/* ---------- incidere una parola nella cache ---------- */
const TAGLIA = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05'

async function incidi(parola, edgeTts) {
  const cartella = await mkdtemp(join(tmpdir(), 'voce-'))
  const grezzo = join(cartella, 'g.mp3')
  try {
    await esegui(edgeTts, ['--voice', VOCE, '--rate=' + VELOCITA,
                           '--text', parola, '--write-media', grezzo])
    // silenzio via da davanti e da dietro, poi wav pieno: la compressione
    // vera avviene una volta sola, quando si costruisce lo sprite
    await esegui('ffmpeg', ['-y', '-loglevel', 'error', '-i', grezzo,
      '-af', `${TAGLIA},areverse,${TAGLIA},areverse`,
      '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', nelCache(parola)])
  } finally {
    await rm(cartella, { recursive: true, force: true })
  }
}

async function durata(file) {
  const { stdout } = await esegui('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration', '-of', 'csv=p=0', file])
  return Math.round(parseFloat(stdout) * 1000) / 1000
}

/* ═══════════ via ═══════════ */
const edgeTts = await trovaEdgeTts()

if (SOLO_ELENCO) {
  const { stdout } = await esegui(edgeTts, ['--list-voices'])
  const suo = new RegExp('^' + LINGUA + '-|Name')
  console.log(stdout.split('\n').filter(r => suo.test(r)).join('\n'))
  process.exit(0)
}

await verificaFfmpeg()

if (!(await cacheValida()) && existsSync(CACHE)) {
  console.log('· voce o velocità cambiate: butto la cache e reincido tutto')
  await rm(CACHE, { recursive: true, force: true })
}
await mkdir(CACHE, { recursive: true })
await writeFile(join(CACHE, 'firma.txt'), firma())

/* ---------- 1. incidere ciò che manca ---------- */
const mancanti = DA_INCIDERE.filter(x => !existsSync(nelCache(x.parola)))
console.log(`· ${DA_INCIDERE.length} parole, ${mancanti.length} da incidere con ${VOCE} (${VELOCITA})`)

let fatte = 0, fallite = []
for (let i = 0; i < mancanti.length; i += PARALLELE) {
  await Promise.all(mancanti.slice(i, i + PARALLELE).map(async ({ parola }) => {
    try {
      await incidi(parola, edgeTts)
      process.stdout.write(`\r  incise ${++fatte}/${mancanti.length}  (${parola})               `)
    } catch (e) {
      fallite.push(parola)
      console.error(`\n  ✗ «${parola}»: ${e.message.split('\n')[0]}`)
    }
  }))
}
if (mancanti.length) console.log('')

/* ---------- 2. costruire gli sprite ---------- */
const presenti = DA_INCIDERE.filter(x => existsSync(nelCache(x.parola)))

/* un gruppo per categoria, spezzato in blocchi: uno sprite lunghissimo
   sarebbe pesante da tenere in memoria sul telefono */
const blocchi = new Map()
for (const { parola, gruppo } of presenti) {
  const lista = blocchi.get(gruppo) || []
  lista.push(parola)
  blocchi.set(gruppo, lista)
}

const cartella = await mkdtemp(join(tmpdir(), 'sprite-'))
const silenzio = join(cartella, 'zitto.wav')
await esegui('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi',
  '-i', `anullsrc=r=24000:cl=mono`, '-t', String(STACCO), '-c:a', 'pcm_s16le', silenzio])

const SPRITE = {}, INDICE = {}
let pezzi = 0
try {
  for (const [gruppo, parole] of blocchi) {
    for (let b = 0; b * PER_SPRITE < parole.length; b++) {
      const fetta = parole.slice(b * PER_SPRITE, (b + 1) * PER_SPRITE)
      const nome = gruppo + (b + 1)
      const lista = join(cartella, nome + '.txt')
      const uscita = join(cartella, nome + '.opus')

      let righe = '', t = 0
      for (const parola of fetta) {
        const d = await durata(nelCache(parola))
        INDICE[parola] = [nome, Math.round(t * 1000) / 1000, d]
        righe += `file '${nelCache(parola)}'\nfile '${silenzio}'\n`
        t += d + STACCO
      }
      await writeFile(lista, righe)
      await esegui('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
        '-i', lista, '-c:a', 'libopus', '-b:a', BITRATE, '-ac', '1', '-ar', '24000',
        '-application', 'voip', uscita])
      SPRITE[nome] = 'data:audio/ogg;base64,' + (await readFile(uscita)).toString('base64')
      pezzi++
      process.stdout.write(`\r  sprite ${pezzi}: ${nome} (${fetta.length} parole, ${Math.round(t)} s)        `)
    }
  }
} finally {
  await rm(cartella, { recursive: true, force: true })
}
console.log('')

/* ---------- 3. scrivere il file ---------- */
const peso = Math.round(Object.values(SPRITE).reduce((s, v) => s + v.length, 0) / 1024)
const righeSprite = Object.entries(SPRITE)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n')
const righeIndice = Object.entries(INDICE)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n')

const COMANDO = LINGUA === 'en' ? 'npm run voci' : `npm run voci -- --lingua ${LINGUA}`

await writeFile(USCITA, `/* GENERATO da \`${COMANDO}\` — non modificare a mano.

   La pronuncia ${NOME_LINGUA}, incisa una volta sola e infilata nel file:
   stessa voce su ogni telefono, anche senza rete, invece della sintesi
   del dispositivo (che su parecchi sistemi è incomprensibile).

   Le parole non stanno in un file ciascuna ma concatenate in pochi
   SPRITE, uno per categoria: l'intestazione di un file audio pesa quanto
   mezzo secondo di parlato, e con ${Object.keys(INDICE).length} parole sarebbe stata metà del peso.
   INDICE dice dove trovare ciascuna: parola → [sprite, secondo d'inizio,
   durata]. Chi le suona è src/voce.js.

   voce ${VOCE} · velocità ${VELOCITA} · opus ${BITRATE}
   ${Object.keys(INDICE).length} parole in ${pezzi} sprite · ~${peso} KB
   Aggiunte parole a ${CFG.fonti}? Rilancia \`${COMANDO}\`. */
export const SPRITE = {
${righeSprite}
}

export const INDICE = {
${righeIndice}
}
`)

const senza = DA_INCIDERE.filter(x => !INDICE[x.parola]).map(x => x.parola)
console.log(`✅ ${Object.keys(INDICE).length} parole in ${pezzi} sprite → ${CFG.uscita} (~${peso} KB)`)
if (senza.length) console.log(`⚠ senza voce: ${senza.join(', ')}`)
if (fallite.length) console.log(`⚠ non incise: ${fallite.join(', ')}`)
