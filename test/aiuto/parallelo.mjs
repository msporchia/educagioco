// Le misure lunghe su più processi (docs/core/test.md): un compito è una funzione esportata da un modulo e i suoi argomenti; ognuno gira
// in un processo suo e torna un JSON. `posti` limita i processi (la macchina ha poca memoria). Le misure del sotterraneo erano un
// processo solo: sei otto minuti per giocare ventimila discese una dopo l'altra, quando il banco da riga di comando ne gioca quattro alla volta.
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const QUI = fileURLToPath(import.meta.url)
const RADICE = resolve(dirname(QUI), '../..')

if (process.argv[2] === '--lavoro') {
  let dentro = ''
  for await (const d of process.stdin) dentro += d
  const { modulo, funzione, args } = JSON.parse(dentro)
  const m = await import(pathToFileURL(resolve(RADICE, modulo)).href)
  process.stdout.write(JSON.stringify(m[funzione](...args)), () => process.exit(0))
  await new Promise(() => {})
}

// compiti: [{ modulo: 'src/…/banco.js', funzione: 'misuraLaStoria', args: [{…}] }] → i risultati nello stesso ordine
export async function inParallelo(compiti, { posti = 4 } = {}) {
  const risultati = new Array(compiti.length)
  let prossimo = 0
  const uno = () => new Promise((ok, no) => {
    const i = prossimo++
    if (i >= compiti.length) return ok()
    const p = spawn('node', [QUI, '--lavoro'], { stdio: ['pipe', 'pipe', 'inherit'] })
    let out = ''
    p.stdout.on('data', d => { out += d })
    p.on('close', codice => {
      if (codice) return no(new Error(`un compito è finito male (${codice}): ${compiti[i].funzione}`))
      risultati[i] = JSON.parse(out)
      uno().then(ok, no)
    })
    p.stdin.end(JSON.stringify(compiti[i]))
  })
  await Promise.all(Array.from({ length: Math.min(posti, compiti.length) }, uno))
  return risultati
}
