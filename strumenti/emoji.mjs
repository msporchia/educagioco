/* ═══════════════════════════════════════════════════════════════════
   LE EMOJI DEL GIOCO — `npm run emoji`

   Perché esiste: ogni telefono disegna le emoji a modo suo, e lo stesso
   gioco cambia faccia da un dispositivo all'altro. Il gioco porta con sé
   le sue: il font Twemoji (strumenti/emoji/), ridotto alle sole emoji che
   `src/` usa, dentro il file unico.

   Cosa fa: cerca le emoji in `src/`, taglia il font a quelle, controlla
   che ognuna si disegni (famiglie e bandiere comprese) e scrive
     src/emoji/emoji.woff2   il font ridotto
     src/emoji/emoji.css     il @font-face, con l'unicode-range
     strumenti/emoji/elenco.json   cosa contiene (lo legge il test)

   Si rilancia ogni volta che si scrive un'emoji nuova: se ci si scorda,
   il test delle unità lo dice. Tutto in docs/core/emoji.md.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import {
  RADICE, FONTE, ELENCO, USCITA_FONT, USCITA_CSS, trovaEmoji, leggiFont, intervalli, cssDelFont,
} from './emoji/lib.mjs'

/* Python con fontTools e brotli: quello che dici tu (PYTHON=…), quello di
   sistema se li ha, altrimenti un venv in .venv-emoji/ (una volta sola, vuole la rete) */
function trovaPython () {
  const ha = py => spawnSync(py, ['-c', 'import fontTools, brotli'], { stdio: 'ignore' }).status === 0
  if (process.env.PYTHON) return process.env.PYTHON
  const venv = join(RADICE, '.venv-emoji/bin/python')
  if (existsSync(venv) && ha(venv)) return venv
  if (ha('python3')) return 'python3'
  console.log('· fontTools non c\'è: lo installo in .venv-emoji/ (una volta sola, serve la rete)')
  for (const a of [['-m', 'venv', join(RADICE, '.venv-emoji')], null]) {
    const r = a ? spawnSync('python3', a, { stdio: 'inherit' })
                : spawnSync(venv, ['-m', 'pip', 'install', '--quiet', 'fonttools', 'brotli'], { stdio: 'inherit' })
    if (r.status !== 0) { console.error('✗ non riesco a installare fonttools e brotli: pip install fonttools brotli'); process.exit(1) }
  }
  return venv
}

const sha = b => createHash('sha256').update(b).digest('hex')
const cp = c => c.codePointAt(0)
const esa = c => 'U+' + cp(c).toString(16).toUpperCase()

const { emoji, testo, punti, conflitti, dove } = trovaEmoji()

if (conflitti.length) {
  console.error('\nQuesti caratteri sono emoji in un posto e testo in un altro, e il font non')
  console.error('li sa distinguere: o tutti con FE0F (emoji) o tutti senza (testo).\n')
  for (const c of conflitti) console.error(`  ${c} ${esa(c)}  (${testo.get(c)} volte nudo, es. in ${dove.get(c)})`)
  process.exit(1)
}

const sorgente = readFileSync(FONTE)
const intero = leggiFont(new Uint8Array(sorgente))
const mancano = [...emoji.keys()].filter(s => !intero.disegna(s, { senzaCmap14: true }))
if (mancano.length) {
  console.error('\nIl font non ha queste emoji (Twemoji è fermo a Emoji 14): se ne sceglie un\'altra.\n')
  for (const s of mancano) console.error(`  ${s} ${[...s].map(esa).join(' ')}  (${emoji.get(s)} volte, es. in ${dove.get(s)})`)
  process.exit(1)
}

// i punti da tenere: ogni carattere usato, più i collanti delle sequenze
const tenere = new Set(punti)
for (const n of [0xFE0F, 0x200D, 0x20E3]) tenere.add(n)

// il taglio lo fa fontTools (taglia.py), in una cartella che se ne va da sola
const lavoro = mkdtempSync(join(tmpdir(), 'emoji-'))
const fuori = { json: join(lavoro, 'punti.json'), woff2: join(lavoro, 'emoji.woff2'), ttf: join(lavoro, 'emoji.ttf') }
writeFileSync(fuori.json, JSON.stringify([...tenere].sort((a, b) => a - b)))
const py = spawnSync(trovaPython(),
  [join(RADICE, 'strumenti/emoji/taglia.py'), FONTE, fuori.json, fuori.woff2, fuori.ttf],
  { encoding: 'utf8' })
if (py.status !== 0) {
  console.error(py.stderr || py.error || 'taglia.py non è partito (serve Python con: pip install fonttools brotli)')
  rmSync(lavoro, { recursive: true, force: true })
  process.exit(1)
}
const woff2 = readFileSync(fuori.woff2)
const ridotto = leggiFont(new Uint8Array(readFileSync(fuori.ttf)))
rmSync(lavoro, { recursive: true, force: true })
const persi = [...emoji.keys()].filter(s => !ridotto.disegna(s))
if (persi.length) {
  console.error('\nDopo il taglio queste emoji non si disegnano (manca la cmap 14 o una legatura):')
  for (const s of persi) console.error(`  ${s} ${[...s].map(esa).join(' ')}`)
  process.exit(1)
}

const range = intervalli(punti)
mkdirSync(dirname(USCITA_FONT), { recursive: true })
writeFileSync(USCITA_FONT, woff2)
writeFileSync(USCITA_CSS, cssDelFont(range))
const elenco = {
  GENERATO: 'da `npm run emoji` — non si modifica a mano (docs/core/emoji.md)',
  fonte: sha(sorgente),
  woff2: sha(woff2),
  intervalli: range,
  emoji: [...emoji.keys()].sort(),
}
writeFileSync(ELENCO, JSON.stringify(elenco, null, 1) + '\n')

console.log(`${emoji.size} emoji in src/ → ${(woff2.length / 1024).toFixed(0)} KB (da ${(sorgente.length / 1024).toFixed(0)} KB, ${ridotto.glifi} punti di codice nel sottoinsieme)`)
if (testo.size) console.log(`restano testo, disegnati dal sistema: ${[...testo.keys()].filter(c => intero.punti.has(cp(c))).join(' ')}`)
