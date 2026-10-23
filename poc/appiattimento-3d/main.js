// La pagina: senza `livello` né `leve` è il confronto affiancato (alta e bassa, o anche bassa+, una cornice ciascuno); con
// `livello` o `leve` è una scena sola a tutta pagina, quella che misura `window.__prova` (vedi poc/appiattimento-3d.md).
// I parametri stanno nella query o nell'hash (lo strumento del vecchio telefono passa l'hash): livello, leve, vista, dpr.
import { Vector3, Color } from 'three'
import { montaScena, piedi, VISTE } from './scena.js'
import { ricetta, LIVELLI, SCENE } from './leve.js'
import { creaLuceVertice } from './piatto.js'
import { creaCarichi } from './carichi.js'
import { creaMacchie, creaBagliori } from './finti.js'
import { contaLavoro } from './conta.js'
import { aspettoDi, paesaggioDi } from '../../src/giochi/sotterraneo/scena3d/aspetti.js'
import { piantaDi } from '../../src/giochi/sotterraneo/scena3d/pianta.js'

const P = new URLSearchParams(location.search + '&' + location.hash.slice(1))
const prendi = k => P.get(k)
const pausa = ms => new Promise(r => setTimeout(r, ms))
const finche = async (f, ms) => { const t = performance.now(); while (performance.now() - t < ms) { try { if (f()) return true } catch (e) { /* non ancora */ } await pausa(50) } return false }

if (P.has('telefono')) telefono()
else if (!prendi('livello') && !prendi('leve')) confronto()
else scena().catch(e => { console.error(e); document.getElementById('riga').textContent = 'non parte: ' + e.message })

// ── il confronto: una cornice per livello, la stessa vista ──
function confronto() {
  document.body.classList.add('confronto')
  const vista = prendi('vista') || 'scontro'
  const livelli = (prendi('livelli') || 'alta,bassa').split(',').filter(l => LIVELLI[l])
  const tela = document.getElementById('palco')
  for (const l of livelli) {
    const f = document.createElement('div'); f.className = 'cornice'
    const t = document.createElement('div'); t.className = 'titolo'; t.textContent = LIVELLI[l].nome
    const i = document.createElement('iframe'); i.src = `appiattimento-3d.html?livello=${encodeURIComponent(l)}&vista=${vista}`
    f.append(t, i); tela.appendChild(f)
  }
  const bott = document.getElementById('bottoni')
  for (const [k, nome] of Object.entries(VISTE)) {
    const b = document.createElement('button'); b.textContent = k; b.title = nome
    if (k === vista) b.className = 'acceso'
    b.onclick = () => { P.set('vista', k); location.search = `?vista=${k}&livelli=${livelli.join(',')}` }
    bott.appendChild(b)
  }
  document.getElementById('riga').textContent = VISTE[vista]
}

// ── la misura sul telefono vero: le scene del catalogo una dopo l'altra, ognuna nella sua cornice (un modulo nuovo, il contesto
// WebGL buttato a scena finita), il banco e il conto; alla fine il resoconto da copiare (poc/appiattimento-3d.md) ──
async function telefono() {
  document.body.classList.add('telefono')
  const gruppi = prendi('gruppi') ? prendi('gruppi').split(',') : null
  const scene = SCENE.filter(x => !gruppi || gruppi.includes(x.gruppo))
  const riga = document.getElementById('riga'), palco = document.getElementById('palco')
  const testa = `APPIATTIMENTO ${new Date().toISOString().slice(0, 16)} | ${innerWidth}x${innerHeight} dpr ${devicePixelRatio} | ${navigator.userAgent.replace(/^.*?\(([^)]*)\).*$/, '$1')}`
  const righe = [testa], dati = []
  for (const [i, x] of scene.entries()) {
    riga.textContent = `${i + 1}/${scene.length} ${x.nome}…`
    const f = document.createElement('iframe')
    Object.assign(f.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', border: '0' })
    f.src = `appiattimento-3d.html?${x.q}&vista=scontro&pulito=1`
    palco.appendChild(f)
    let r = null
    try {
      const w = await new Promise((ok, no) => { f.onload = () => ok(f.contentWindow); setTimeout(() => no(new Error('non si apre')), 30000) })
      if (!await finche(() => w.__prova && w.__prova.pronto, 60000)) throw new Error('non è pronta')
      await pausa(1500)
      const b = w.__prova.banco(20, 3), c = w.__prova.conta()
      r = { ...b, ...c }
      righe.push(`${x.id.padEnd(44)} ${String(r.ms).padStart(6)} ms (cpu ${r.cpu}, gpu ${r.gpu}, ±${r.rumore}%) ${r.ch} ch ${Math.round(r.tri / 1000)}k tri ${r.programmi} sh · ${r.frammenti}M fr ${r.luciFrammenti}M luce·fr ${r.trameFrammenti}M trame·fr ${r.ombraFrammenti}M ombra·fr`)
      dati.push([x.id, r.ms, r.cpu, r.gpu, r.rumore, r.ch, r.tri, r.programmi, r.frammenti, r.luciFrammenti, r.trameFrammenti, r.ombraFrammenti])
    } catch (e) { righe.push(`${x.id.padEnd(44)} non regge: ${e.message}`); dati.push([x.id, 'no']) }
    try { const gl = f.contentWindow.document.querySelector('canvas').getContext('webgl2'); const e = gl && gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext() } catch (e) { /* già andato */ }
    f.remove()
    await pausa(800)
  }
  righe.push('DATI ' + JSON.stringify({ v: 1, k: 'appiattimento', s: `${innerWidth}x${innerHeight}`, d: devicePixelRatio, r: dati }))
  const t = document.createElement('textarea'); t.value = righe.join('\n'); t.readOnly = true
  Object.assign(t.style, { position: 'absolute', inset: '40px 8px 70px', font: '10px monospace', background: '#111', color: '#eee' })
  palco.appendChild(t)
  const b = document.createElement('button'); b.textContent = 'Copia'
  b.onclick = async () => { try { await navigator.clipboard.writeText(t.value); b.textContent = 'Copiato' } catch (e) { t.select(); document.execCommand('copy'); b.textContent = 'Copiato' } }
  document.getElementById('bottoni').appendChild(b)
  riga.textContent = `fatto: ${scene.length} scene`
  window.__resoconto = righe.join('\n')
}

// ── una scena sola ──
async function scena() {
  const R = ricetta({ livello: prendi('livello') || 'oggi', leve: prendi('leve'), dpr: prendi('dpr') })
  const vista = prendi('vista') || 'scontro'
  // la fascia del gioco la legge `fasciaAttiva()` dall'hash (store/qualita.js): si scrive prima di montare
  const h = new URLSearchParams(location.hash.slice(1)); h.set('qualita', R.qualita)
  history.replaceState(null, '', location.pathname + location.search + '#' + h.toString())
  const riga = document.getElementById('riga')
  riga.textContent = `${prendi('livello') || ''} ${R.gettoni.join(' ')} · ${vista}…`
  const S = await montaScena(document.getElementById('palco'), { vista, dpr: R.dpr, spegni: R.spegni, mostri: Number(prendi('mostri') || 3) })
  const { pittore, corsa } = S
  const scena3d = pittore.scena
  // il renderer e la telecamera del gioco non escono dal pittore: li dà il primo disegno (Scene.onBeforeRender)
  let renderer = null, camera = null, msRender = 0
  const primoGiro = scena3d.onBeforeRender
  scena3d.onBeforeRender = (r, s, c, ...a) => { renderer = r; camera = c; if (primoGiro) primoGiro.call(scena3d, r, s, c, ...a) }
  // le fiamme fatte dal pittore prima del piano sono quella della torcia dell'eroe: i fuochi del piano sono le altre
  const fiammeEroe = new Set(); scena3d.traverse(o => { if (o.geometry && o.geometry.attributes && o.geometry.attributes.aFiamma) fiammeEroe.add(o) })
  const quanti = vista === 'cantina' ? 0 : Number(prendi('mostri') || 3)
  await finche(() => pittore.grafica().scenario && pittore.grafica().mostri3d >= quanti && (quanti === 0 || pittore.palco) && renderer, 12000)
  await pausa(300)

  const aspetto = aspettoDi(paesaggioDi(corsa))
  const colore = new Color(aspetto.torcia)
  const fuochi = []
  scena3d.traverse(o => {
    if (!o.isInstancedMesh || fiammeEroe.has(o) || !o.geometry.attributes.aFiamma) return
    const m = o.instanceMatrix.array
    for (let i = 0; i < o.count; i++) fuochi.push({ pos: new Vector3(m[i * 16 + 12], m[i * 16 + 13] + 0.16, m[i * 16 + 14] + 0.16), colore, forza: 4.5, raggio: 7 })
  })
  const pianta = piantaDi(corsa.livello)
  const pieni = new Set([...pianta.muri, ...pianta.colonne].map(c => pianta.id(c.x, c.y)))
  const muro = (x, z) => x < 0 || z < 0 || x >= pianta.W || z >= pianta.H || pieni.has(pianta.id(Math.floor(x), Math.floor(z)))
  const centro = () => { const e = pittore.eroe.disegnato || { x: corsa.eroe.x, z: corsa.eroe.y }; return { x: e.x + 1.2, z: e.z - 0.6 } }

  // le leve
  const carichi = creaCarichi(scena3d, { centro })
  for (const [k, n] of R.carichi) {
    if (k === 'tri') carichi.triangoli(n); else if (k === 'ch') carichi.chiamate(n); else if (k === 'add') carichi.additivi(n)
    else if (k === 'punti') carichi.punti(n); else if (k === 'luci') carichi.luci(n); else if (k === 'pelle') carichi.persone(n)
    else if (k === 'rigide') carichi.persone(n, true); else if (k === 'mat') carichi.materiali(n); else if (k === 'senza') carichi.senza(n)
  }
  const vertice = R.vertice ? creaLuceVertice(scena3d, { ...R.vertice, cotta: R.vertice.cotta ? { fuochi: () => fuochi, muro } : false }) : null
  if (vertice) vertice.converti()
  if (R.senzaLuci) scena3d.traverse(o => { if (o.isPointLight || o.isSpotLight) o.visible = false })
  const macchie = R.macchie ? creaMacchie(scena3d) : null
  const bagliori = R.bagliori ? creaBagliori(scena3d, fuochi) : null
  let lampo = null; scena3d.traverse(o => { if (o.isPointLight && o.distance === 5 && o.decay === 1.5) lampo = lampo || o })
  const giro = scena3d.onBeforeRender
  scena3d.onBeforeRender = (...a) => {
    if (macchie) macchie.metti(piedi(pittore, corsa))
    if (bagliori && lampo) bagliori.lampo(lampo)
    if (giro) giro.apply(scena3d, a)
  }
  // gli effetti nascono dopo: i loro materiali si convertono anche loro
  setInterval(() => { carichi.ripassa(); if (vertice) vertice.converti() }, 250)
  // il tempo dentro `renderer.render` (il JS di three e i comandi a WebGL): la CPU del disegno; il resto del banco è attesa della GPU
  const render0 = renderer.render
  renderer.render = function (...a) { const t = performance.now(); render0.apply(this, a); msRender += performance.now() - t }

  // i colpi a ripetizione, come la scomposizione del telefono (veri/discese.js: un'abilità dell'eroe e un attacco del mostro a turno)
  if (P.has('colpi')) { const COLPI = ['palla', 'fulmine', 'spazzata', 'meteora', 'catena', 'esplode', 'nevicata', 'fiammata']; let k = 0
    setInterval(() => { const n = Math.max(1, quanti), i = k % n; try { pittore.prova(k % 2 ? 'mostro' : COLPI[(k >> 1) % COLPI.length], i) } catch (e) { /* niente */ } k++ }, 700) }
  if (vista === 'fuoco') { S.colpo('fiammata'); setInterval(() => S.colpo(Math.random() < 0.5 ? 'fiammata' : 'palla'), 1600) }
  await pausa(1500)   // gli shader nuovi (conversioni, effetti) si compilano qui, non nella misura
  // gli shader che la scena usa adesso (renderer.info.programs conta anche quelli di prima delle leve, rimasti in cache)
  const vivi = () => { const s = new Set(); scena3d.traverse(o => { for (const m of o.material ? [].concat(o.material) : []) { const p = renderer.properties.get(m).currentProgram; if (p) s.add(p) } }); return s.size }
  // quello che il JS di three gira a ogni fotogramma: i nodi della scena (matrici), le mesh visibili, chi fa ombra (la passata d'ombra
  // li ridisegna), le luci che contano per pixel
  const nodi = () => {
    let n = 0, mat = 0, vis = 0, ombra = 0, luci = 0, punti = 0
    scena3d.traverse(o => {
      n++; if (o.matrixAutoUpdate) mat++
      let v = true; for (let q = o; q; q = q.parent) if (!q.visible) { v = false; break }
      if (!v) return
      if (o.isMesh || o.isPoints || o.isSprite) { vis++; if (o.castShadow) ombra++; if (o.isPoints) punti += o.geometry.attributes.position.count }
      if (o.isPointLight || o.isSpotLight) luci++
    })
    return { nodi: n, matrici: mat, visibili: vis, ombreggianti: ombra, luciVere: luci, punti }
  }
  const conti = () => { const g = pittore.grafica(); return { ch: g.chiamate, tri: g.triangoli, programmi: vivi(), compilati: g.programmi, dpr: g.dpr, mostri3d: g.mostri3d, msJs: g.msJs, ...nodi() } }
  const prova = window.__prova = {
    pronto: true, livello: prendi('livello'), leve: R.gettoni, vista, ricetta: R, fuochi: fuochi.length,
    conti,
    vertice: vertice ? vertice.conti : null,
    colpo: k => S.colpo(k),
    /** Il banco: `n` disegni della scena ferma, ognuno aspettato (la lettura di un pixel). cpu = dentro `render`, gpu = l'attesa. */
    /**
     * Il banco: `giri` volte `n` disegni della scena ferma, ognuno aspettato (la lettura di un pixel); la mediana di ogni giro e il
     * minimo fra i giri (un computer carico sporca i giri, non li accorcia). cpu = il tempo dentro `render`, gpu = l'attesa. `rumore`:
     * quanto si allontana il giro peggiore dal migliore, in %.
     */
    banco(n = 20, giri = 3) {
      const c = conti()
      pittore.ferma()
      const med = v => v.slice().sort((a, b) => a - b)[v.length >> 1]
      const esiti = []
      for (let g = 0; g < giri; g++) {
        const tot = [], cpu = []
        for (let i = 0; i < n + 2; i++) {
          msRender = 0
          const t0 = performance.now()
          pittore.banco(1)   // tre disegni aspettati (il banco del gioco ne scarta due): i ms sono di tre
          if (i >= 2) { tot.push((performance.now() - t0) / 3); cpu.push(msRender / 3) }
        }
        esiti.push({ ms: med(tot), cpu: med(cpu) })
      }
      pittore.avvia()
      esiti.sort((a, b) => a.ms - b.ms)
      const r1 = x => Math.round(x * 10) / 10, m = esiti[0]
      return { ms: r1(m.ms), cpu: r1(m.cpu), gpu: r1(m.ms - m.cpu), rumore: Math.round((esiti[esiti.length - 1].ms / m.ms - 1) * 100), ...c, fuochi: fuochi.length }
    },
    /**
     * Le chiamate a WebGL di un disegno (contate, non cronometrate): il lavoro che il processo della GPU del telefono fa sulla CPU
     * (ANGLE e il driver: ogni cambio di programma, uniform, trama, buffer) e che il banco conta come «gpu» perché la lettura del pixel
     * lo aspetta. `byte`: quanto va in GPU a ogni disegno (buffer e trame aggiornati).
     */
    contaGL() {
      const gl = renderer.getContext(), conti = {}, vecchie = {}
      let byte = 0
      for (const k of Object.keys(Object.getPrototypeOf(gl)).concat(Object.getOwnPropertyNames(WebGL2RenderingContext.prototype))) {
        if (vecchie[k] || typeof gl[k] !== 'function' || k === 'constructor') continue
        const f = gl[k]; vecchie[k] = f
        gl[k] = function (...a) {
          conti[k] = (conti[k] || 0) + 1
          if (k === 'bufferSubData' || k === 'bufferData') byte += a[2] && a[2].byteLength ? a[2].byteLength : 0
          if (/^tex(Sub)?Image[23]D$/.test(k)) { const d = a.find(x => x && x.byteLength); if (d) byte += d.byteLength }
          return f.apply(this, a)
        }
      }
      pittore.ferma()
      try { pittore.banco(1) } finally { for (const [k, f] of Object.entries(vecchie)) gl[k] = f; pittore.avvia() }
      const t = k => Math.round((conti[k] || 0) / 3)
      const somma = re => Math.round(Object.entries(conti).filter(([k]) => re.test(k)).reduce((s, [, v]) => s + v, 0) / 3)
      return { glDisegni: somma(/^draw/), glProgrammi: t('useProgram'), glUniform: somma(/^uniform/), glTrame: t('bindTexture'), glBuffer: somma(/^(bindBuffer|bindVertexArray)/),
               glStato: somma(/^(enable|disable|blend|depth|cullFace|frontFace|polygonOffset|colorMask|stencil)/), glKB: Math.round(byte / 3 / 1024),
               glTutte: Math.round(Object.values(conti).reduce((x, y) => x + y, 0) / 3) }
    },
    /** Il lavoro per pixel contato (conta.js): non dipende dal carico del computer. */
    conta() {
      pittore.ferma()
      try { return { ...conti(), ...prova.contaGL(), ...contaLavoro({ scena: scena3d, renderer, camera, perVertice: m => !!(vertice && vertice.ha(m)) }) } } finally { pittore.avvia() }
    },
  }
  const c = conti()
  riga.textContent = `${prendi('livello') || ''} ${R.gettoni.join(' ')} · ${vista} · dpr ${c.dpr} · ${c.ch} ch · ${Math.round(c.tri / 1000)}k tri · ${c.programmi} shader`
  if (P.has('pulito')) riga.hidden = true
  return prova
}
