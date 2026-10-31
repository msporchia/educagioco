/* ═══════════════════════════════════════════════════════════════════
   I PEZZI DELL'ATLANTE CHIESTI DAVVERO — la controprova di `npm run sprite:inutilizzati`, che guarda solo se un nome compare in
   `src/`. Questo conta quali pezzi il gioco legge mentre gira.

     node strumenti/pezzi-chiesti.mjs                        # costruisce il file contato, gira le scene, scrive il rapporto
     node strumenti/pezzi-chiesti.mjs --niente-build         # usa il file contato che c'è (tmp/pezzi-chiesti/index.html)
     node strumenti/pezzi-chiesti.mjs --prove sotterraneo    # e lancia anche le prove d'integrazione con quel nome, sul file contato
     node strumenti/pezzi-chiesti.mjs --solo-rapporto        # rilegge tmp/pezzi-chiesti/chiesti.json
     node strumenti/pezzi-chiesti.mjs --gioco sotterraneo    # l'atlante di quale gioco (sotterraneo di difetto)

   Come conta: costruisce il gioco in `tmp/pezzi-chiesti/` con un plugin di Vite in più, che in `src/giochi/<gioco>/dati/atlante.js`
   avvolge `PEZZI` e `NITIDI` in un Proxy: la prima lettura di ogni nome che c'è la segna in `window.__pezziChiesti` e la manda con
   `sendBeacon` a un piccolo server su 127.0.0.1 (così contano anche le prove, che girano in processi loro). Un nome che non c'è
   (le prove come `PEZZI[`${k}-${n}`]` per contare i fotogrammi) non conta. Poi gira le scene di `SCENE` (i cheat dell'indirizzo, coi
   tocchi) e, con `--prove`, i file di `test/integrazione/` che contengono quel testo, con `DIST=` sul file contato.

   Il rapporto (`tmp/pezzi-chiesti/rapporto.txt`, e a schermo): per ogni foglio quanti pezzi e quanti nitidi ha l'atlante, quanti ne
   sono stati chiesti, e i nomi mai chiesti. **Un pezzo mai chiesto non è per forza inutile**: è da seguire nel codice fino a chi lo
   legge (un ramo che nessuna scena ha percorso). Un pezzo chiesto invece si usa. Vedi docs/core/sprite.md, «Gli inutilizzati».
   ═══════════════════════════════════════════════════════════════════ */
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opz = (nome, difetto) => { const i = args.indexOf('--' + nome); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : difetto }
const GIOCO = opz('gioco', 'sotterraneo')
const USCITA = resolve(RADICE, 'tmp/pezzi-chiesti')
const FILE = resolve(USCITA, 'index.html')
const CHIESTI = resolve(USCITA, 'chiesti.json')
const PORTA = Number(opz('porta', 5299))
const ATLANTE = `src/giochi/${GIOCO}/dati/atlante.js`

/* Le scene: i cheat dell'indirizzo (docs/core/comandi.md) e i tocchi, in fila. Una per scenario, il mondo di sopra, le botteghe, lo
   zaino, lo scontro. `aspetta`: ms dopo l'apertura; `tocca`: selettori, uno dopo l'altro; `prima`: un'espressione nella pagina. */
const SCENE = [
  ...['cantine', 'cripta', 'fornace', 'inferno'].flatMap(sc => [
    { hash: `sotterraneo=0&eroe=cavaliere&seme=7&stanza=sala&luce=stanza&zoom=2&scenario=${sc}`, aspetta: 6000 },
    { hash: `sotterraneo=roba&giu=1&seme=812&piano=9&stanza=uscita&luce=stanza&zoom=2&scenario=${sc}`, aspetta: 6000 },
    { hash: `sotterraneo=1&eroe=mago&sotterraneo=branco&mostri=6&seme=11&luce=stanza&scenario=${sc}`, aspetta: 7000 },
  ]),
  ...[1, 2, 3, 4, 5, 6].map(g => ({ hash: `sotterraneo=${g}&eroe=nano&seme=${g * 5}&luce=stanza&zoom=2`, aspetta: 6000 })),
  { hash: 'sotterraneo=abisso&eroe=elfa&abisso=12&seme=3&luce=stanza&zoom=2', aspetta: 6000 },
  { hash: 'sotterraneo=1&eroe=cavaliere&sotterraneo=roba&seme=11', aspetta: 6000, tocca: ['[data-azione="zaino"]'] },
  { hash: 'sotterraneo=1&eroe=elfa&sotterraneo=branco&mostri=3&tipo=lupo,pianta&seme=11', aspetta: 9000 },
  { hash: 'sotterraneo=mondo&eroe=cavaliere&nebbia=no', aspetta: 9000 },
  { hash: 'sotterraneo=mondo&eroe=cavaliere&nebbia=no', aspetta: 7000, prima: "window.__mondo3d && window.__mondo3d.vai('mercante:villaggio:armaiolo')" },
  ...['armaiolo', 'incantatrice', 'erborista', 'rigattiere'].map(b => ({ hash: `sotterraneo=mondo&eroe=cavaliere&bottega=${b}&livello=12&roba=rara&gemme=800`, aspetta: 8000 })),
]

/* ── il file contato ── */
const AVVOLGI = `
const __pezziVisti = (globalThis.__pezziChiesti = globalThis.__pezziChiesti || [])
const __pezziSet = new Set()
function __contaPezzi(tipo, o) {
  return new Proxy(o, { get(t, k, r) {
    if (typeof k === 'string' && Object.prototype.hasOwnProperty.call(t, k)) {
      const c = tipo + ':' + k
      if (!__pezziSet.has(c)) {
        __pezziSet.add(c); __pezziVisti.push(c)
        try { navigator.sendBeacon('http://127.0.0.1:${PORTA}/', c) } catch (e) { /* senza server si conta solo nella pagina */ }
      }
    }
    return Reflect.get(t, k, r)
  } })
}
`
function contaPlugin() {
  return {
    name: 'conta-pezzi', enforce: 'pre',
    transform(codice, id) {
      if (!id.endsWith(ATLANTE)) return null
      let n = 0
      const nuovo = codice.replace(/^export const (PEZZI|NITIDI) = (.*)$/gm, (_t, nome, valore) => { n++; return `export const ${nome} = __contaPezzi('${nome === 'PEZZI' ? 'p' : 'n'}', ${valore})` })
      if (!n) throw new Error(`${ATLANTE}: non trovo «export const PEZZI = …»`)
      return { code: AVVOLGI + nuovo, map: null }
    },
  }
}
async function costruisci() {
  const { build } = await import('vite')
  await build({ configFile: resolve(RADICE, 'vite.config.js'), root: RADICE, logLevel: 'warn', plugins: [contaPlugin()],
                build: { outDir: USCITA, emptyOutDir: true } })
  if (!existsSync(FILE)) throw new Error(`manca ${FILE} dopo la build`)
}

/* ── chi raccoglie ── */
const chiesti = new Set(existsSync(CHIESTI) && (args.includes('--niente-build') || args.includes('--solo-rapporto')) ? JSON.parse(readFileSync(CHIESTI, 'utf8')) : [])
function server() {
  const s = createServer((req, res) => {
    let corpo = ''
    req.on('data', d => { corpo += d })
    req.on('end', () => { if (corpo) chiesti.add(corpo); res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); res.end() })
  })
  return new Promise(ok => s.listen(PORTA, '127.0.0.1', () => ok(s)))
}

async function giraLeScene() {
  process.env.DIST = FILE
  const { apriBrowser, apriGioco } = await import('../test/aiuto/browser.mjs')
  const browser = await apriBrowser()
  for (const sc of SCENE) {
    const { page, errori } = await apriGioco(browser, { hash: sc.hash, attesa: null, indirizzo: pathToFileURL(FILE).href })
    await page.waitForTimeout(1200 + (sc.aspetta || 0))
    if (sc.prima) { await page.evaluate(sc.prima).catch(e => errori.push('prima: ' + e.message)); await page.waitForTimeout(5000) }
    for (const sel of sc.tocca || []) {
      const el = await page.$(sel)
      if (el) { await el.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(2500) }
      else errori.push(`niente da toccare: ${sel}`)
    }
    const visti = await page.evaluate(() => globalThis.__pezziChiesti || []).catch(() => [])
    visti.forEach(c => chiesti.add(c))
    console.log(`  ${String(visti.length).padStart(4)} chiesti · ${sc.hash}${sc.tocca ? ' + ' + sc.tocca.join(', ') : ''}${errori.length ? '\n       ⚠ ' + errori.slice(0, 3).join(' · ') : ''}`)
    await page.close()
  }
  await browser.close()
}

function giraLeProve(filtro) {
  const cartella = resolve(RADICE, 'test/integrazione')
  const file = readdirSync(cartella).filter(f => f.endsWith('.test.mjs') && f.includes(filtro)).sort()
  return file.reduce((p, f) => p.then(() => new Promise(ok => {
    const t0 = Date.now()
    const c = spawn(process.execPath, [resolve(cartella, f)], { env: { ...process.env, DIST: FILE }, stdio: ['ignore', 'ignore', 'ignore'] })
    c.on('exit', codice => { console.log(`  ${codice === 0 ? '✅' : '❌'} ${f} (${Math.round((Date.now() - t0) / 1000)} s) · ${chiesti.size} chiesti in tutto`); ok() })
  })), Promise.resolve())
}

/* ── il rapporto ── */
async function rapporto() {
  const A = await import(pathToFileURL(resolve(RADICE, ATLANTE)).href)
  const perFoglio = new Map()
  for (const v of A.VOCI) {
    const f = perFoglio.get(v.da) || { pezzi: [], nitidi: [], voci: [] }
    const nomi = [...new Set(Object.values(v.pose || {}).flat())]
    f.voci.push({ id: v.id, nomi })
    for (const n of nomi) { f.pezzi.push(n); if (A.NITIDI && A.NITIDI[n]) f.nitidi.push(n) }
    perFoglio.set(v.da, f)
  }
  const righe = [`I pezzi dell'atlante di ${GIOCO} chiesti mentre il gioco girava (${chiesti.size} letture diverse)`, '']
  for (const [foglio, f] of [...perFoglio].sort((a, b) => a[0].localeCompare(b[0]))) {
    const p = f.pezzi.filter(n => chiesti.has('p:' + n)).length, q = f.nitidi.filter(n => chiesti.has('n:' + n)).length
    righe.push(`${foglio}: pezzi ${p}/${f.pezzi.length}, nitidi ${q}/${f.nitidi.length}`)
    const mai = f.voci.filter(v => !v.nomi.some(n => chiesti.has('p:' + n) || chiesti.has('n:' + n))).map(v => v.id)
    if (mai.length) righe.push(`   voci mai chieste: ${mai.join(' ')}`)
    const nitidiMai = f.voci.filter(v => v.nomi.some(n => A.NITIDI && A.NITIDI[n]) && !v.nomi.some(n => chiesti.has('n:' + n)) && !mai.includes(v.id)).map(v => v.id)
    if (nitidiMai.length) righe.push(`   chieste, ma mai il nitido: ${nitidiMai.join(' ')}`)
  }
  const testo = righe.join('\n')
  writeFileSync(resolve(USCITA, 'rapporto.txt'), testo + '\n')
  console.log('\n' + testo)
}

mkdirSync(USCITA, { recursive: true })
if (!args.includes('--solo-rapporto')) {
  if (!args.includes('--niente-build') || !existsSync(FILE)) { console.log('costruisco il file contato…'); await costruisci() }
  const s = await server()
  console.log('le scene:')
  await giraLeScene()
  const prove = opz('prove', null)
  if (prove) { console.log(`le prove con «${prove}»:`); await giraLeProve(prove) }
  await new Promise(ok => setTimeout(ok, 500))
  s.close()
  writeFileSync(CHIESTI, JSON.stringify([...chiesti].sort()))
}
await rapporto()
