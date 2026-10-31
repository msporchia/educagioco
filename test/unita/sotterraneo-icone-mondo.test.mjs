/* ═══════════════════════════════════════════════════════════════════
   LE ICONE DEI POSTI DEL MONDO 3D — docs/sotterraneo/mondo-3d.md («Le icone dei posti»)

   Le fotografa `npm run scatti icone-mondo` (strumenti/icone-mondo.mjs) e le scrive in dati/icone-mondo.js, che non si tocca a
   mano: porta la firma del proprio contenuto. Qui: ogni discesa (e l'abisso) e ogni città ha la sua, piccola e valida; la
   firma torna; il Sotterraneo 3D le legge e quello di sempre i suoi ritagli dipinti. E la home, che le ha dentro i dati, non
   carica three: nessuna delle importazioni statiche che partono da lei arriva a three o a scena3d/.
   ═══════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ICONE_MONDO, FIRMA } from '../../src/giochi/sotterraneo/dati/icone-mondo.js'
import { iconaDi } from '../../src/giochi/sotterraneo/dati/terra.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { INGRESSI_DEL_MONDO } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

// le chiavi: i quattordici ingressi del mondo a percorso (le sette discese, l'abisso, i sei nuovi) e il villaggio, l'unica città
const CITTA = ['villaggio']
stessaLista('un\'icona per ogni ingresso e per il villaggio',
            Object.keys(ICONE_MONDO).sort(), [...Object.keys(INGRESSI_DEL_MONDO), ...CITTA].sort())
controlla('fra gli ingressi ci sono le sette discese e l\'abisso', [...CAMPAGNA.map(t => t.chiave), 'abisso'].every(k => INGRESSI_DEL_MONDO[k]))

// ogni icona è un WebP vero, quadrato, 112 px, piccolo
function misureWebp(uri) {
  const b = Buffer.from(uri.replace(/^data:image\/webp;base64,/, ''), 'base64')
  if (b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return null
  const tipo = b.toString('latin1', 12, 16)
  if (tipo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alfa: !!(b[20] & 0x10), byte: b.length }
  if (tipo === 'VP8L') { const x = b.readUInt32LE(21); return { w: 1 + (x & 0x3fff), h: 1 + ((x >> 14) & 0x3fff), alfa: true, byte: b.length } }
  if (tipo === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alfa: false, byte: b.length }
  return null
}
let totale = 0
for (const [k, uri] of Object.entries(ICONE_MONDO)) {
  const m = typeof uri === 'string' && uri.startsWith('data:image/webp;base64,') ? misureWebp(uri) : null
  controlla(`${k}: un WebP in un data:`, !!m)
  if (!m) continue
  uguale(`${k}: 112×112`, `${m.w}×${m.h}`, '112×112')
  controlla(`${k}: sotto i 9 KB (${m.byte} byte)`, m.byte <= 9 * 1024)
  totale += m.byte
}
controlla(`tutte insieme sotto i 130 KB (${Math.round(totale / 1024)} KB)`, totale <= 130 * 1024)

// la firma: il file non si scrive a mano
const firma = createHash('sha1').update(JSON.stringify(ICONE_MONDO)).digest('hex').slice(0, 12)
uguale('la firma del file generato torna (se no: npm run scatti icone-mondo)', FIRMA, firma)

// chi le legge: ogni discesa e ogni città la sua fotografia
for (const t of [...CAMPAGNA.map(t => t.chiave), 'abisso', ...CITTA]) uguale(`${t}: la sua fotografia`, iconaDi(t), ICONE_MONDO[t])

/* La home non carica three. Si cammina sulle importazioni statiche (non quelle dinamiche, `import('…')`, che sono il
   caricamento a richiesta) dalla home, dal registro dei giochi e dal punto d'ingresso, e non si deve mai arrivare a three né
   a scena3d/ (il Sotterraneo 3D sta dietro `caricaQuando`, giochi/schermate.js). */
const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^;'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g
const visti = new Set()
const cattivi = []
function cammina(file, da) {
  if (visti.has(file)) return
  visti.add(file)
  const testo = readFileSync(file, 'utf8')
  for (const m of testo.matchAll(IMPORT)) {
    const dest = m[1] || m[2]
    if (/^three(\/|$)/.test(dest)) { cattivi.push(`${file.slice(RADICE.length + 1)} → ${dest}`); continue }
    if (!dest.startsWith('.')) continue
    const base = resolve(dirname(file), dest)
    const scelto = [base, base + '.js', base + '.vue', base + '.mjs', base + '/index.js'].find(p => existsSync(p) && /\.(js|vue|mjs)$/.test(p))
    if (!scelto) continue
    if (/scena3d|fattoria3d\/scena|spazio3d/.test(scelto)) { cattivi.push(`${file.slice(RADICE.length + 1)} → ${scelto.slice(RADICE.length + 1)}`); continue }
    cammina(scelto, file)
  }
}
for (const partenza of ['src/main.js', 'src/views/HomeView.vue', 'src/giochi/indice.js'])
  if (existsSync(resolve(RADICE, partenza))) cammina(resolve(RADICE, partenza), null)
controlla(`la home non importa three (visti ${visti.size} file)`, visti.size > 50)
stessaLista('nessuna importazione statica arriva a three o al 3D', cattivi, [])
controlla('…e il file delle icone del mondo è fra quelli che la home porta, come dati', [...visti].some(f => f.endsWith('dati/icone-mondo.js')))

riassunto('le icone dei posti del mondo 3D')
