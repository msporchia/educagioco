#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   IL LANCIATORE

     node test/esegui.mjs              tutto
     node test/esegui.mjs unita        solo quelli che non aprono il browser
     node test/esegui.mjs integrazione solo quelli nel browser
     node test/esegui.mjs animali      solo i file che contengono "animali"
     node test/esegui.mjs --niente-build   non ricompila prima
     node test/esegui.mjs --tempo=600      alza il tempo massimo per test
     node test/esegui.mjs torri --scatti   lascia anche le foto in test/scatti/

   Ogni test è un processo a sé: uno che va in crash non porta via gli
   altri, e il codice di uscita è quello che conta. Chi esce con 0 è
   passato, chiunque altro no.

   E ognuno ha un tempo massimo. Serve perché è già capitato che una
   simulazione lunga tenesse in ostaggio tutta la suite per un quarto
   d'ora: un test che non finisce è un test rotto, e va detto subito
   invece di far aspettare al buio.

   I test di integrazione girano su `dist/index.html`, quindi la build
   la fa il lanciatore: dimenticarsela vuol dire provare la versione di
   ieri e non accorgersene.

   Le foto invece **non** si fanno da sole. Nessun test le guarda: sono
   per gli occhi di chi lavora, e farle a ogni giro costa secondi e
   lascia in giro immagini che cambiano da sole (il gioco è pieno di
   caso). Si chiedono con `--scatti`, quando servono davvero, e finiscono
   tutte in `test/scatti/`, che git non guarda.
   ═══════════════════════════════════════════════════════════════════ */
import { spawn } from 'node:child_process'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '..')
const GRUPPI = ['unita', 'integrazione']

const argomenti = process.argv.slice(2)
const senzaBuild = argomenti.includes('--niente-build')
const conScatti = argomenti.includes('--scatti')
const filtri = argomenti.filter(a => !a.startsWith('--'))
const TEMPO = Number(argomenti.find(a => a.startsWith('--tempo='))?.slice(8)) || 240

/* Un test può chiedersi più tempo scrivendo `tempo: 900` fra i primi
   commenti: le simulazioni lunghe sono legittime, purché lo dichiarino.
   Chi non dice niente ha il tempo normale, e se sfora è rotto. */
function tempoDichiarato(file) {
  const testa = readFileSync(file, 'utf8').slice(0, 1200)
  const m = /tempo:\s*(\d{1,4})/.exec(testa)
  return m ? Number(m[1]) : 0
}

function raccogli() {
  const fuori = []
  for (const g of GRUPPI) {
    const dir = resolve(QUI, g)
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).sort())
      if (f.endsWith('.test.mjs')) {
        const file = resolve(dir, f)
        fuori.push({ gruppo: g, nome: f.replace('.test.mjs', ''), file, suo: tempoDichiarato(file) })
      }
  }
  if (!filtri.length) return fuori
  return fuori.filter(t => filtri.some(f => t.gruppo === f || t.nome.includes(f)))
}

function esegui(comando, argomenti, opzioni = {}) {
  const { secondi = 0, ...resto } = opzioni
  return new Promise(ok => {
    const p = spawn(comando, argomenti, { cwd: RADICE, stdio: 'inherit', ...resto })
    let scaduto = false
    const sveglia = secondi ? setTimeout(() => { scaduto = true; p.kill('SIGKILL') }, secondi * 1000) : null
    p.on('close', codice => { clearTimeout(sveglia); ok(scaduto ? 'tempo' : (codice ?? 1)) })
    p.on('error', () => { clearTimeout(sveglia); ok(1) })
  })
}

const prove = raccogli()
if (!prove.length) {
  console.log('nessun test trovato' + (filtri.length ? ' per: ' + filtri.join(', ') : ''))
  process.exit(1)
}

const serveBrowser = prove.some(t => t.gruppo === 'integrazione')
if (serveBrowser && !senzaBuild) {
  console.log('· ricompilo dist/index.html')
  const codice = await esegui('npm', ['run', 'build'], { stdio: 'ignore' })
  if (codice !== 0) { console.log('❌ la build fallisce: i test non direbbero niente di utile'); process.exit(1) }
}

console.log(`\n▶ ${prove.length} test\n`)
const esiti = []
for (const t of prove) {
  const etichetta = `${t.gruppo}/${t.nome}`
  console.log(`── ${etichetta} ${'─'.repeat(Math.max(0, 56 - etichetta.length))}`)
  const inizio = Date.now()
  const suo = Math.max(TEMPO, t.suo)
  const ambiente = conScatti ? { ...process.env, SCATTI: '1' } : process.env
  const codice = await esegui('node', [relative(RADICE, t.file)], { secondi: suo, env: ambiente })
  if (codice === 'tempo')
    console.log(`   ⏱ fermato dopo ${suo}s — se ci mette davvero tanto, scriva "tempo: ${suo * 2}" in cima`)
  esiti.push({ ...t, codice, secondi: ((Date.now() - inizio) / 1000).toFixed(1) })
  console.log('')
}

const rotti = esiti.filter(e => e.codice !== 0)
console.log('═'.repeat(60))
for (const e of esiti) {
  const segno = e.codice === 0 ? '✅' : e.codice === 'tempo' ? '⏱' : '❌'
  console.log(` ${segno} ${e.gruppo}/${e.nome}`.padEnd(46) + `${e.secondi}s`)
}
console.log('═'.repeat(60))
console.log(rotti.length ? `❌ ${rotti.length} test su ${esiti.length} non passano`
                         : `✅ tutti e ${esiti.length} passano`)
process.exit(rotti.length ? 1 : 0)
