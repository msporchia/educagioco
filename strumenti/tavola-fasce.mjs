/* ═══════════════════════════════════════════════════════════════════
   LA TAVOLA DELLE FASCE — le stesse scene del Sotterraneo 3D in più fasce, affiancate

   Per ogni vista (una riga) e ogni colonna (una fascia, o una fascia con
   una leva tolta o rimessa) apre il gioco servito da Vite col cheat della
   vista e quello della colonna, fotografa la sola tela 3D e mette tutto
   in una tavola. Con `--conta` misura anche, a scena ferma, i conti che
   non dipendono dal carico del computer: chiamate, triangoli, programmi in
   uso, chiamate a WebGL di un disegno (useProgram, uniform, bindTexture) e
   i frammenti pesati (poc/appiattimento-3d/conta.js: frammenti, luci per
   frammento, trame per frammento). I ms veri li dà il telefono.

     npx vite --port 5201 --strictPort &
     node strumenti/tavola-fasce.mjs --porta 5201                     # scontro, cantina, fuoco, vicino × alta | bassa di oggi | bassa
     node strumenti/tavola-fasce.mjs --porta 5201 --conta --viste scontro
     node strumenti/tavola-fasce.mjs --porta 5201 --colonne 'bassa=qualita=bassa|senza-rilievo=qualita=bassa&spegni=rilievo' --nome rilievo

   `--colonne 'nome=cheat|nome=cheat'` (di difetto: alta, `oggi` = la bassa
   con `&riaccendi=lucePerVertice`, cioè la bassa di prima della luce per
   vertice, e `bassa`); `--viste scontro,cantina` (VISTE qui sotto); `--seme`,
   `--aspetta 7000`, `--larghezza 390`. Le foto in tmp/scatti/fasce/, la
   tavola in tmp/scatti/<nome>.png (`fasce` di difetto), i conti a terminale
   in una tabella e in tmp/scatti/<nome>.json.
   `--shader` stampa, per ogni pezzo del piano, quello che il suo shader di
   frammento fa di caro (letture di trame, derivate, righe), dal sorgente
   che three dà a WebGL, coi #define risolti e solo quello che main()
   raggiunge (i sorgenti interi in tmp/scatti/fasce/, da confrontare).
   ═══════════════════════════════════════════════════════════════════ */
import { apriBrowser, apriGioco } from '../test/aiuto/browser.mjs'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const QUI = dirname(fileURLToPath(import.meta.url))
const SCATTI = resolve(QUI, '../tmp/scatti')
const FOTO = resolve(SCATTI, 'fasce')
const args = process.argv.slice(2)
const opz = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d }
const porta = opz('porta', null)
if (!porta) { console.error('serve --porta (il server di Vite: i conti importano poc/appiattimento-3d/conta.js)'); process.exit(1) }
mkdirSync(FOTO, { recursive: true })

const seme = opz('seme', '7')
// le viste: lo scontro della misura del telefono, una stanza accesa tutta senza mostri, la torcia accesa, l'eroe da vicino (lo
// scontro con un mostro, e la foto è il quarto di tela attorno all'eroe, ingrandito: `vicino` nel cheat)
const VISTE = {
  scontro: `sotterraneo3d=1&sotterraneo=branco&mostri=3&seme=${seme}`,
  cantina: `sotterraneo3d=1&stanza=grande&luce=stanza&seme=11&via-mostri`,
  fuoco: `sotterraneo3d=1&stanza=grande&torcia=accesa&seme=11&via-mostri`,
  vicino: `sotterraneo3d=1&sotterraneo=branco&mostri=1&seme=${seme}&vicino`,
}
const COLONNE = 'alta=qualita=alta|oggi=qualita=bassa&riaccendi=lucePerVertice|bassa=qualita=bassa'
const colonne = opz('colonne', COLONNE).split('|').map(x => { const i = x.indexOf('='); return { nome: x.slice(0, i), cheat: x.slice(i + 1) } })
const viste = (opz('viste', '') || Object.keys(VISTE).join(',')).split(',').filter(k => VISTE[k])
const larghezza = Number(opz('larghezza', 390)), nome = opz('nome', 'fasce'), conta = args.includes('--conta')

// nella pagina: i conti di un disegno fermo (il renderer e la telecamera li dà il primo disegno, come nel prototipo)
async function conti(page) {
  return page.evaluate(async () => {
    const p = window.__sotterraneo3d, scena = p.scena
    let renderer = null, camera = null
    const prima = scena.onBeforeRender
    scena.onBeforeRender = function (r, s, c, ...a) { renderer = r; camera = c; if (prima) prima.call(this, r, s, c, ...a) }
    for (let i = 0; i < 40 && !renderer; i++) await new Promise(f => setTimeout(f, 50))
    const g = p.grafica()
    // i programmi che la scena usa adesso (renderer.info.programs tiene anche quelli già usati e rimasti in cache)
    const vivi = new Set()
    scena.traverse(o => { for (const m of o.material ? [].concat(o.material) : []) { const q = renderer.properties.get(m).currentProgram; if (q) vivi.add(q) } })
    // le chiamate a WebGL di tre disegni
    const gl = renderer.getContext(), n = {}, vecchie = {}
    for (const k of Object.getOwnPropertyNames(WebGL2RenderingContext.prototype)) {
      if (typeof gl[k] !== 'function' || k === 'constructor') continue
      const f = gl[k]; vecchie[k] = f
      gl[k] = function (...a) { n[k] = (n[k] || 0) + 1; return f.apply(this, a) }
    }
    p.ferma()
    try { p.banco(1) } finally { for (const [k, f] of Object.entries(vecchie)) gl[k] = f }
    const somma = re => Math.round(Object.entries(n).filter(([k]) => re.test(k)).reduce((s, [, v]) => s + v, 0) / 3)
    const { contaLavoro } = await import('/poc/appiattimento-3d/conta.js')
    const lavoro = contaLavoro({ scena, renderer, camera, perVertice: m => !!(m.customProgramCacheKey && /\|pv/.test(m.customProgramCacheKey())) })
    p.avvia()
    return { ch: g.chiamate, tri: g.triangoli, programmi: vivi.size, glProgrammi: Math.round((n.useProgram || 0) / 3), glUniform: somma(/^uniform/),
             glTrame: Math.round((n.bindTexture || 0) / 3), luci: lavoro.luci, fr: lavoro.frammenti, luceFr: lavoro.luciFrammenti, trameFr: lavoro.trameFrammenti,
             famiglie: Object.fromEntries(Object.entries(lavoro.famiglie).filter(([, v]) => v)) }
  })
}

// `--shader`: il sorgente degli shader del piano (i materiali con la maschera, tranne le figure) come three lo dà a WebGL, passato dal
// preprocessore e ridotto a quello che main() raggiunge, e quanto c'è dentro di caro per pixel: letture di trame, derivate
// (dFdx/dFdy: le tangenti calcolate, il flat shading, la ruvidezza della geometria), normalize, pow, le righe. Per pezzo del piano
async function sorgenti(page) {
  return page.evaluate(async () => {
    const p = window.__sotterraneo3d, scena = p.scena
    let renderer = null
    const prima = scena.onBeforeRender
    scena.onBeforeRender = function (r, ...a) { renderer = r; if (prima) prima.call(this, r, ...a) }
    for (let i = 0; i < 40 && !renderer; i++) await new Promise(f => setTimeout(f, 50))
    scena.onBeforeRender = prima
    const gl = renderer.getContext()
    const conta = (t, re) => (t.match(re) || []).length
    // il preprocessore (#define, #if/#ifdef/#elif/#else/#endif): il sorgente di three porta ogni variante, decidono i #define
    const prepara = t => {
      const def = {}, pila = [], out = []
      const vale = e => {
        const x = e.replace(/defined\s*\(\s*(\w+)\s*\)|defined\s+(\w+)/g, (_, a, b) => ((a || b) in def ? '1' : '0'))
          .replace(/\b[A-Za-z_]\w*\b/g, n => (n in def ? (Number(def[n]) || (def[n] === '' ? 1 : 0)) : 0))
        try { return !!Function('return (' + x + ')')() } catch (er) { return false }
      }
      const attivo = () => pila.every(q => q.su)
      for (const r of t.split('\n')) {
        const d = r.trim().match(/^#\s*(\w+)\s*(.*)$/)
        if (!d) { if (attivo()) out.push(r); continue }
        const [, k, resto] = d
        if (k === 'ifdef' || k === 'ifndef' || k === 'if') {
          const su = attivo() && (k === 'if' ? vale(resto) : (resto.trim() in def) === (k === 'ifdef'))
          pila.push({ su, preso: su, fuori: !attivo() })
        } else if (k === 'elif') { const q = pila[pila.length - 1]; q.su = !q.fuori && !q.preso && (pila.slice(0, -1).every(x => x.su)) && vale(resto); q.preso = q.preso || q.su }
        else if (k === 'else') { const q = pila[pila.length - 1]; q.su = !q.fuori && !q.preso && pila.slice(0, -1).every(x => x.su); q.preso = true }
        else if (k === 'endif') pila.pop()
        else if (attivo()) { if (k === 'define') { const [n, ...v] = resto.split(/\s+/); if (!/\(/.test(n)) def[n] = v.join(' ') } else if (k === 'undef') delete def[resto.trim()]; out.push(r) }
      }
      return out.join('\n')
    }
    // solo il codice che main() raggiunge: il sorgente porta tutte le funzioni di three, anche quelle che nessuno chiama
    const raggiunto = t => {
      const fn = {}, re = /\b[A-Za-z_]\w*\s+([A-Za-z_]\w*)\s*\([^;{)]*\)\s*\{/g
      let m
      while ((m = re.exec(t))) {
        let i = re.lastIndex, d = 1
        while (d && i < t.length) { if (t[i] === '{') d++; else if (t[i] === '}') d--; i++ }
        fn[m[1]] = (fn[m[1]] || '') + t.slice(re.lastIndex, i)
      }
      const visti = new Set(), coda = ['main']
      while (coda.length) { const n = coda.pop(); if (visti.has(n) || !fn[n]) continue; visti.add(n); for (const c of fn[n].matchAll(/\b([A-Za-z_]\w*)\s*\(/g)) coda.push(c[1]) }
      return [...visti].map(n => fn[n]).join('\n')
    }
    const per = {}
    scena.traverse(o => {
      for (const m of o.material ? [].concat(o.material) : []) {
        const k = m.customProgramCacheKey && m.customProgramCacheKey()
        if (!k || !k.startsWith('maschera-') || /figure/.test(k)) continue
        const q = renderer.properties.get(m).currentProgram
        if (!q || per[k]) continue
        const [v, f] = gl.getAttachedShaders(q.program).sort((a, b) => gl.getShaderParameter(a, gl.SHADER_TYPE) - gl.getShaderParameter(b, gl.SHADER_TYPE)).reverse()
        const testo = sh => gl.getShaderSource(sh)   // il tradotto (WEBGL_debug_shaders) in Chrome senza schermo torna vuoto
        const fs = raggiunto(prepara(testo(f))), vs = raggiunto(prepara(testo(v)))
        per[k] = { trame: conta(fs, /\b(texture|texture2D|texelFetch|textureLod)\s*\(/g), derivate: conta(fs, /\b(dFdx|dFdy|fwidth)\s*\(/g),
                   normalize: conta(fs, /\bnormalize\s*\(/g), pow: conta(fs, /\bpow\s*\(/g), righe: fs.split('\n').filter(r => r.trim()).length,
                   righeV: vs.split('\n').filter(r => r.trim()).length, trameV: conta(vs, /\b(texture|texture2D|texelFetch|textureLod)\s*\(/g), fs: testo(f), vs: testo(v) }
      }
    })
    return per
  })
}

const browser = await apriBrowser()
const righe = []
for (const v of viste) {
  const riga = { vista: v, foto: [] }
  for (const c of colonne) {
    const hash = `${VISTE[v]}&eroe=cavaliere&dpr=1&pensieri=no&${c.cheat}`
    const { page, errori } = await apriGioco(browser, { viewport: { width: larghezza, height: 844 }, hash, attesa: null, indirizzo: `http://localhost:${porta}/` })
    await page.waitForTimeout(1500)
    // la stanza senza mostri (uno sveglio aprirebbe lo scontro); restano nella lista, spenti (come tavola-paesaggi.mjs)
    if (hash.includes('via-mostri')) await page.evaluate(() => { const c = window.__sotterraneo3d && window.__sotterraneo3d.corsa; if (c) { c.ricomparsa = false; for (const r of c.livello.robe) if (r.che === 'mostro') { r.presa = true; r.morto = true; r.sveglio = false } } }).catch(() => {})
    await page.waitForTimeout(Number(opz('aspetta', 7000)))
    const tela = await page.$('[data-tela="3d"]')
    const file = resolve(FOTO, `${nome}-${v}-${c.nome}.png`)
    const b = tela && await tela.boundingBox()
    const alto = b ? Math.min(b.height, b.width * 1.25) : 0
    let clip = b ? { x: b.x, y: b.y + (b.height - alto) / 2 - b.height * 0.07, width: b.width, height: alto } : null
    // da vicino: il riquadro di metà lato attorno all'eroe, fotografato a scala doppia
    const e = b && hash.includes('vicino') ? await page.evaluate(() => { const p = window.__sotterraneo3d, d = p.eroe.disegnato; return d ? p.aSchermo(d.x, 0.6, d.z) : null }).catch(() => null) : null
    if (e) clip = { x: b.x + Math.max(0, Math.min(b.width / 2, e[0] - b.width / 4)), y: b.y + Math.max(0, e[1] - alto / 4), width: b.width / 2, height: alto / 2 }
    await page.screenshot({ path: file, ...(clip ? { clip, scale: 'device' } : {}) })
    const k = conta ? await conti(page).catch(e => ({ errore: e.message })) : null
    console.log(`${errori.length ? '✗' : '✓'} ${v} · ${c.nome}${k ? ' ' + JSON.stringify(k) : ''}  ${errori.slice(0, 2).join(' · ')}`)
    if (args.includes('--shader')) {
      const sh = await sorgenti(page).catch(e => ({ errore: e.message }))
      console.log(`  i programmi del piano (${c.nome}):`)
      // i sorgenti accanto alle foto, per confrontarli (diff) fra una colonna e l'altra
      for (const [kk, x] of Object.entries(sh)) {
        const base = resolve(FOTO, `${nome}-${v}-${c.nome}-${kk.replace(/[^\w-]+/g, '_')}`)
        if (x.fs) { writeFileSync(base + '.frag', x.fs); writeFileSync(base + '.vert', x.vs); delete x.fs; delete x.vs }
        console.log(`    ${kk.padEnd(48)} ${JSON.stringify(x)}`)
      }
    }
    riga.foto.push({ colonna: c.nome, file, conti: k })
    await page.close()
  }
  righe.push(riga)
}

// la tavola: una riga per vista, una colonna per fascia, il nome sopra
const lato = 300
const pagina = await browser.newPage({ viewport: { width: colonne.length * (lato + 8) + 8, height: 400 }, deviceScaleFactor: 1 })
const html = `<html><head><meta charset="utf-8"></head><body style="margin:0;background:#111;font:600 15px system-ui;color:#ddd">
  <div style="display:grid;grid-template-columns:repeat(${colonne.length},${lato}px);gap:8px;padding:8px">
  ${righe.flatMap(r => r.foto.map(f => `<figure style="margin:0"><figcaption style="padding:2px;white-space:nowrap;overflow:hidden;font-size:13px">${r.vista} · ${f.colonna}<span style="float:right;font-weight:400;color:#999">${f.conti && !f.conti.errore ? `${f.conti.ch} ch · ${Math.round(f.conti.tri / 1000)}k tr · ${f.conti.luceFr}M luce·fr` : ''}</span></figcaption>
    <img src="data:image/png;base64,${readFileSync(f.file).toString('base64')}" style="width:${lato}px;display:block"></figure>`)).join('')}
  </div></body></html>`
const fileHtml = resolve(FOTO, `${nome}.html`)
writeFileSync(fileHtml, html)
await pagina.goto(`file://${fileHtml}`)
await pagina.waitForTimeout(300)
const esce = resolve(SCATTI, `${nome}.png`)
await pagina.screenshot({ path: esce, fullPage: true })
await browser.close()

if (conta) {
  console.log('\n| vista | colonna | chiamate | triangoli | programmi | useProgram | uniform | bindTexture | luci per pixel | M frammenti | M luce·fr | M trame·fr | famiglie (M fr) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const r of righe) for (const f of r.foto) {
    const k = f.conti
    if (!k || k.errore) { console.log(`| ${r.vista} | ${f.colonna} | ${k ? k.errore : ''} |`); continue }
    console.log(`| ${r.vista} | ${f.colonna} | ${k.ch} | ${Math.round(k.tri / 1000)}k | ${k.programmi} | ${k.glProgrammi} | ${k.glUniform} | ${k.glTrame} | ${k.luci} | ${k.fr} | ${k.luceFr} | ${k.trameFr} | ${Object.entries(k.famiglie).map(([a, b]) => a + ' ' + b).join(', ')} |`)
  }
  writeFileSync(resolve(SCATTI, `${nome}.json`), JSON.stringify(righe, null, 1))
}
console.log(`→ ${esce}`)
