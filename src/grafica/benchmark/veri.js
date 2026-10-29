// La misura del telefono coi modelli veri dei giochi (docs/core/vecchio-telefono-veri.md): gli FPS VERI, le scene del gioco com'è
// (discese, mondo di sopra, fattoria 3D, asteroidi) con la fascia del telefono. Ogni gioco carica il suo codice con `import()` solo
// quando tocca a lui: un caricamento che fallisce è una riga «non regge», mai un errore. Ogni scena ha un rodaggio (shader, geometrie,
// riserve: il primo fotogramma si tiene a parte) e poi la misura.
import { eventiContesto } from './veri/tela.js'

const LENTO = 33
// [minimo, tetto] in ms; `quadri`: i fotogrammi che una finestra vuole almeno (a 500 ms l'uno, il telefono imitato, il tempo da solo
// darebbe dieci fotogrammi); `fine`: il tetto di una fase anche senza i fotogrammi
const TEMPI = {
  corto: { rodaggio: [120, 300], misura: [250, 500], finestra: 120, quadri: 0, fine: 3000 },        // le prove (`window.__benchmarkCorto`)
  // gli fps veri: il gioco com'è, senza la lettura di un pixel che aspetta la GPU (`vero`: CPU e GPU lavorano insieme), 8 s fermi
  fps: { rodaggio: [2000, 4000], misura: [8000, 8000], finestra: 2000, quadri: 12, fine: 12000, vero: true },
}
// I tetti di tempo: una scena che non finisce (un fotogramma che non torna, una promessa che non si risolve) diventa «non regge: tempo
// scaduto» e la prova va avanti, col gruppo rifatto da capo per la scena dopo. `scena`: in più delle due fasi al loro tetto (`fine`);
// `carica`: il codice e la scena di un gruppo
export const TETTO = { scena: 15000, carica: 30000 }
/** `p` entro `ms`, se no un errore «tempo scaduto (cosa oltre N s)». */
export function conTetto(p, ms, cosa) {
  let t = 0
  const scade = new Promise((_, no) => { t = setTimeout(() => no(new Error(`tempo scaduto (${cosa} oltre ${Math.round(ms / 1000)} s)`)), ms) })
  return Promise.race([p, scade]).finally(() => clearTimeout(t))
}
const scaduto = e => /tempo scaduto/.test(String((e && e.message) || e))

const discese = () => import('./veri/discese.js')
// gli fps veri: le discese (camminare in un piano, lo scontro), il mondo di sopra (il villaggio, lo scontro sul prato), la fattoria 3D
// col suo degrado acceso e gli Asteroidi (il volo, e il volo con le esplosioni)
const fattoria = () => import('./veri/fattoria.js'), sopraVero = () => import('./veri/sopra-vero.js'), asteroidi = () => import('./veri/asteroidi.js')
export const TAPPE_FPS = [
  { gruppo: 'fps', carica: discese, tempi: 'fps', scene: [
    { id: 'fps-piano', nome: 'camminare in un piano del sotterraneo', passeggia: true, stima: 16 },
    ...[3, 6].map(n => ({ id: `fps-sot-${n}`, nome: `scontro nel sotterraneo, ${n} mostri`, mostri: n, colpi: true, stima: 14 })),
  ] },
  { gruppo: 'fps', carica: sopraVero, tempi: 'fps', scene: [
    { id: 'fps-villaggio', nome: 'camminare nel villaggio di sopra', dove: 'villaggio', stima: 18 },
    { id: 'fps-prato', nome: `scontro sul prato, 3 mostri`, dove: 'prato', stima: 16 },
  ] },
  ...[10, 30].map(l => ({ gruppo: 'fps', carica: fattoria, opz: { livello: l, degrado: true }, tempi: 'fps', scene: [{ id: `fps-fat-${l}`, nome: `fattoria 3D del livello ${l}`, stima: 16 }] })),
  { gruppo: 'fps', carica: asteroidi, tempi: 'fps', scene: [
    { id: 'fps-ast', nome: 'asteroidi, il volo con 8 sassi e la nave madre', stima: 14 },
    { id: 'fps-ast-boom', nome: 'asteroidi, un\'esplosione al secondo', boom: true, stima: 12 },
  ] },
]
/** Quanto dura la prova sul Note 7: la somma dei secondi attesi per scena (`stima`, dai log: caricamento, rodaggio e misura). Sul foglio iniziale. */
export function stima() {
  const scene = TAPPE_FPS.reduce((n, t) => n + t.scene.length, 0)
  const secondi = TAPPE_FPS.reduce((n, t) => n + t.scene.reduce((m, x) => m + (x.stima || 14), 0), 0)
  return { scene, secondi, minuti: Math.ceil(secondi / 60) }
}

const mediana = v => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.floor(o.length / 2)] : 0 }
const perc = (v, q) => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.min(o.length - 1, Math.floor(q * o.length))] : 0 }
const breve = e => String((e && e.message) || e || '?').replace(/\s+/g, ' ').slice(0, 60)
const tondo = x => Math.round(x * 10) / 10

// Il giro dei fotogrammi di un gruppo: `inizio` gira prima del disegno del gioco e `fine` dopo (i requestAnimationFrame vanno
// nell'ordine in cui si chiedono, e ognuno si richiede per primo: l'ordine resta), così il lavoro di un fotogramma è dal primo al
// terzo, disegno del gioco compreso, più l'attesa della GPU (la lettura di un pixel). Le scene che non hanno un loro giro
// disegnano in `passo`, dentro `fine`.
function creaGiro(f) {
  let vivo = true, a = 0, ultimo = 0, rec = null, guasto = null, attendi = true
  const px = new Uint8Array(4)
  const inizio = () => { if (!vivo) return; requestAnimationFrame(inizio); a = performance.now() }
  const fine = t => {
    if (!vivo) return
    requestAnimationFrame(fine)
    const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 1 / 60
    ultimo = t
    try { if (f.passo) f.passo(t / 1000, dt) } catch (e) { guasto = guasto || e }
    // fin qui la CPU (il JS e l'invio dei comandi); la lettura di un pixel aspetta che la GPU finisca
    const c = performance.now(), gl = f.gl()
    if (attendi && gl && !gl.isContextLost()) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    const e = performance.now()
    if (rec) rec(e - a, t, c - a, e - c)
  }
  requestAnimationFrame(inizio)
  if (f.avvia) f.avvia()
  requestAnimationFrame(fine)
  return {
    get guasto() { return guasto },
    // `prepara()` mette la scena (i suoi fotogrammi sono la prima apparizione: shader, geometrie, riserve), poi il rodaggio
    // (scartato) e la misura a finestre, finché i lenti non si fermano o scade il tetto. Il «primo» è il fotogramma più lungo fra
    // quelli della preparazione e i primi dieci del rodaggio.
    // `prima`: la prima scena di un gruppo, appena costruito: il rodaggio minimo è doppio (trame e shader arrivano ancora)
    async misura(tempi, fermo, prepara, prima = false) {
      guasto = null; attendi = !tempi.vero
      const comparsa = []
      rec = l => { comparsa.push(l) }
      const tp = performance.now()
      try { await prepara() } catch (e) { rec = null; throw e }
      const pronto = Math.round(performance.now() - tp)
      return new Promise(fatto => {
        const t0 = performance.now(), primi = [], lavoro = [], dt = [], finestre = [], cpu = [], gpu = [], conti = []
        let fase = 'rodaggio', tm = 0, tf = 0, prec = null, nascosta = false, finestra = []
        const chiudi = stabile => {
          rec = null
          const somma = dt.reduce((x, y) => x + y, 0)
          // chiamate e triangoli cambiano col fotogramma (chi entra ed esce dall'inquadratura): il più alto dei campioni
          const piu = k => (conti.length ? Math.max(...conti.map(c => c[k] || 0)) : undefined)
          // il JS del pittore diviso: `agg` il giro del gioco (logica, scena, segni), `dis` il disegno di three (i comandi alla GPU)
          const med = k => { const v = conti.map(c => c[k]).filter(x => x != null); return v.length ? tondo(mediana(v)) : undefined }
          // il resto del JS (fra un fotogramma e l'altro) sugli stessi fotogrammi: le mediane prese a parte non si sottraggono
          const resto = conti.filter(c => c.agg != null && c.js != null).map(c => c.js - c.agg - (c.dis || 0))
          fatto({ chMax: piu('ch'), triMax: piu('tri'), agg: med('agg'), dis: med('dis'), ...(resto.length ? { resto: tondo(mediana(resto)) } : {}), ms: tondo(mediana(lavoro)), p95: tondo(perc(lavoro, 0.95)), js: tondo(mediana(cpu)), gpu: tondo(mediana(gpu)), fps: somma ? Math.round(1000 * dt.length / somma) : 0, n: lavoro.length,
                  primo: tondo(Math.max(0, ...comparsa, ...primi.slice(0, 10))), pronto, lenti: lavoro.filter(x => x > LENTO).length, stabile,
                  ...(nascosta ? { nascosta: true } : {}),
                  // gli fps veri: quanti fotogrammi arrivano dopo più di 34 ms (sotto i 30 fps) e dopo più di 100 (un fermo che si vede)
                  ...(tempi.vero ? { vero: true, dt95: tondo(perc(dt, 0.95)), sotto30: Math.round(100 * dt.filter(x => x > 34).length / Math.max(1, dt.length)), fermi: dt.filter(x => x > 100).length } : {}) })
        }
        rec = (l, t, lc, lg) => {
          if (document.hidden) nascosta = true
          const ora = performance.now()
          if (fermo()) return chiudi(false)
          if (fase === 'rodaggio') {
            primi.push(l)
            const e = ora - t0, k = primi.length, w = 10, q = tempi.quadri
            const assestato = k >= 2 * w && Math.abs(mediana(primi.slice(-w)) - mediana(primi.slice(-2 * w, -w))) <= 0.15 * Math.max(1, mediana(primi.slice(-2 * w, -w)))
            if ((e >= tempi.rodaggio[0] * (prima ? 2 : 1) && assestato) || (e >= tempi.rodaggio[1] && k >= 2 * q) || e >= tempi.fine) { fase = 'misura'; tm = tf = ora; prec = t }
            return
          }
          lavoro.push(l); finestra.push(l); cpu.push(lc); gpu.push(lg)
          if (f.conti && lavoro.length % 5 === 1) { try { conti.push({ ...f.conti(), js: lc }) } catch (e) { /* niente conti */ } }
          if (prec) dt.push(t - prec)
          prec = t
          const e = ora - tm, q = tempi.quadri
          if (ora - tf >= tempi.finestra && finestra.length >= q) {
            finestre.push({ lenti: finestra.filter(x => x > LENTO).length / finestra.length, med: mediana(finestra) }); finestra = []; tf = ora
            const [p, u] = finestre.slice(-2)
            const ferma = p && u && Math.abs(u.lenti - p.lenti) <= 0.1 && Math.abs(u.med - p.med) <= 0.2 * Math.max(1, p.med)
            if ((e >= tempi.misura[0] && ferma) || (e >= tempi.misura[1] && lavoro.length >= 2 * q)) return chiudi(!!ferma)
          }
          if (e >= tempi.fine) chiudi(false)
        }
      })
    },
    ferma() { vivo = false; rec = null },
  }
}

// le luci di una scena: puntiformi, spot, direzionali, emisferiche, e quante fanno ombra
function luciDi(scena) {
  const l = { p: 0, s: 0, d: 0, h: 0, ombre: 0 }
  if (!scena) return l
  scena.traverse(o => {
    if (!o.isLight) return
    if (o.isPointLight) l.p++; else if (o.isSpotLight) l.s++; else if (o.isDirectionalLight) l.d++; else if (o.isHemisphereLight) l.h++
    if (o.castShadow) l.ombre++
  })
  return l
}

// quello che il gioco usa e il telefono può non avere: le estensioni che servono (o aiutano) e la precisione dei float
const ESTENSIONI = ['EXT_color_buffer_half_float', 'EXT_color_buffer_float', 'OES_texture_float_linear', 'EXT_float_blend', 'EXT_texture_filter_anisotropic',
  'KHR_parallel_shader_compile', 'EXT_disjoint_timer_query_webgl2', 'WEBGL_lose_context', 'WEBGL_debug_renderer_info', 'WEBGL_multi_draw']
export function infoGpuVeri() {
  const c = document.createElement('canvas')
  const gl = c.getContext('webgl2')
  if (!gl) return { webgl2: false, gpu: '?', mancanti: [] }
  const e = gl.getExtension('WEBGL_debug_renderer_info')
  const pr = (s, q) => { const f = gl.getShaderPrecisionFormat(s, q); return f ? f.precision : 0 }
  const presenti = gl.getSupportedExtensions() || []
  const i = {
    webgl2: true, gpu: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), fornitore: e ? gl.getParameter(e.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    versione: gl.getParameter(gl.VERSION), maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    uniVert: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS), uniFrag: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS), varying: gl.getParameter(gl.MAX_VARYING_VECTORS),
    unitaTex: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    // i bit di precisione: 23 = float a 32 bit; 0 = non c'è; mediump a 10 bit = mezzo float (luci, normal map e nebbia possono sgranare)
    precisione: { vsAlta: pr(gl.VERTEX_SHADER, gl.HIGH_FLOAT), fsAlta: pr(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT), fsMedia: pr(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT) },
    mezzaPrecisione: presenti.includes('EXT_color_buffer_half_float') || presenti.includes('EXT_color_buffer_float'),
    mancanti: ESTENSIONI.filter(x => !presenti.includes(x)),
  }
  const p = gl.getExtension('WEBGL_lose_context'); if (p) p.loseContext()
  return i
}

// la batteria (un telefono quasi scarico o in risparmio energetico va più piano) e la rete, se il browser le dice
async function ambiente() {
  const a = {}
  try { if (navigator.getBattery) { const b = await navigator.getBattery(); a.batteria = { livello: Math.round(b.level * 100), carica: !!b.charging } } } catch (e) { /* non la dice */ }
  const c = navigator.connection
  if (c) a.rete = { tipo: c.effectiveType || c.type || '?', risparmio: !!c.saveData }
  return a
}

/**
 * Le scene nel `contenitore` (un elemento a tutto schermo). `progresso(i, n, nome)`, `fermo()` per interrompere, `corto` per le prove,
 * `solo`: gli inizi degli id da fare (`['fps-sot', 'fps-ast']`, e `js` per la prova di CPU).
 * → { tipo: 'veri', info, js, risultati, gruppi, avvisi, contesto, schermo, dpr, fascia, fermata }
 */
export async function eseguiVeri({ contenitore, progresso = () => {}, fermo = () => false, corto = false, solo = null, fascia = null,
                                   tetti = TETTO, tappe: proprie = null, parziale = null }) {
  const info = infoGpuVeri()
  const tappe = (proprie || TAPPE_FPS)
    .map(t => ({ ...t, scene: t.scene.filter(s => !solo || solo.some(p => s.id.startsWith(p) || t.gruppo.startsWith(p))) })).filter(t => t.scene.length)
  const tot = tappe.reduce((n, t) => n + t.scene.length, 0)
  const risultati = [], gruppi = {}, avvisi = new Map()
  // gli avvisi e gli errori della console mentre gira (shader che non compilano, modelli che non si saldano…): si riassumono nel log
  const orig = { warn: console.warn, error: console.error }
  const prendi = tipo => (...a) => {
    const m = a.map(x => (x && x.message) || String(x)).join(' ').replace(/\s+/g, ' ').slice(0, 90)
    const k = `${tipo}: ${m}`; avvisi.set(k, (avvisi.get(k) || 0) + 1)
    orig[tipo].apply(console, a)
  }
  console.warn = prendi('warn'); console.error = prendi('error')
  // un errore nel giro di disegno di un gioco (non passa da qui): la scena «non regge», e il cartello del guasto non copre la prova
  const guasti = []
  const guasto = e => { guasti.push(breve(e.error || e.reason || e.message)); e.stopImmediatePropagation(); e.preventDefault() }
  window.addEventListener('error', guasto, true); window.addEventListener('unhandledrejection', guasto, true)
  const persi0 = eventiContesto.persi, ripresi0 = eventiContesto.ripresi
  const prima = await ambiente()
  let k = 0
  const dati = (dopo, extra) => ({ tipo: 'veri', info, risultati, gruppi, fascia, ambiente: { prima, dopo }, avvisi: [...avvisi].map(([m, n]) => ({ m, n })).sort((a, b) => b.n - a.n),
    contesto: { persi: eventiContesto.persi - persi0, ripresi: eventiContesto.ripresi - ripresi0 },
    schermo: `${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`, dpr: window.devicePixelRatio || 1, ...extra })
  // a ogni scena misurata, quello che c'è fin lì (`parziale`): se il telefono si pianta le scene fatte restano (docs/core/vecchio-telefono-veri.md)
  let salvate = 0
  const salva = () => { if (!parziale || risultati.length === salvate) return; salvate = risultati.length; try { parziale(dati(prima, { js: null, fermata: true, aMeta: [risultati.length, tot] })) } catch (e) { /* si salva la prossima */ } }
  try {
    for (const tappa of tappe) {
      if (fermo()) break
      const g = gruppi[tappa.gruppo] || (gruppi[tappa.gruppo] = { carica: [], dpr: [], luci: null, programmi: 0 })
      progresso(k, tot, `${tappa.gruppo}: si carica…`)
      const opzTappa = (typeof tappa.opz === 'function' ? tappa.opz(risultati) : tappa.opz) || {}
      let f = null, giro = null, errore = null, scaduta = false
      // il codice e la scena del gruppo, col tetto: una scena che arriva dopo il tetto si butta appena arriva (la sua tela tiene un contesto)
      const apri = async () => {
        const t0 = performance.now()
        try {
          const m = await conTetto(tappa.carica(), tetti.carica, 'il codice')
          const pp = Promise.resolve(m.prepara({ contenitore, opz: opzTappa, corto }))
          try { f = await conTetto(pp, tetti.carica, 'la preparazione') } catch (e) { pp.then(x => { try { x && x.via() } catch (_) { /* già via */ } }, () => {}); throw e }
        } catch (e) { errore = breve(e); f = null }
        g.carica.push(Math.round(performance.now() - t0))
        if (!f) return
        if (f.dpr && !g.dpr.includes(tondo(f.dpr))) g.dpr.push(tondo(f.dpr))
        giro = creaGiro(f)
      }
      const chiudi = () => { if (giro) giro.ferma(); giro = null; try { if (f) f.via() } catch (e) { /* è già andata */ } f = null }
      await apri()
      if (!f) { for (const s of tappa.scene) { risultati.push({ ...riga(s, tappa), errore }); k++ } salva(); continue }
      try {
        for (const s of tappa.scene) {
          if (fermo()) break
          progresso(k++, tot, `${tappa.gruppo}: ${s.nome}`)
          // dopo un tempo scaduto il gruppo si rifà da capo: la scena di prima può aver lasciato il gioco a metà
          if (scaduta) { scaduta = false; chiudi(); await apri(); if (!f) { risultati.push({ ...riga(s, tappa), errore }); continue } }
          const g0 = guasti.length
          try {
            const prima = f.conti ? f.conti().programmi : 0
            // nelle prove corte i tempi corti, ma gli fps veri restano senza la lettura che aspetta la GPU
            const tm = corto ? { ...TEMPI.corto, vero: !!(TEMPI[tappa.tempi] || {}).vero } : TEMPI[tappa.tempi] || TEMPI.fps
            // le due fasi stanno sotto `fine` l'una (se arrivano fotogrammi), più la preparazione della scena
            let r = await conTetto(giro.misura(tm, fermo, () => f.scena(s), s === tappa.scene[0]), 2 * tm.fine + tetti.scena, 'la scena')
            if (giro.guasto) throw giro.guasto
            const c = f.conti ? f.conti() : {}
            if (f.gl() && f.gl().isContextLost()) throw new Error('contesto WebGL perso')
            r = { ...r, ch: r.chMax ?? c.ch, tri: r.triMax ?? c.tri, nuovi: Math.max(0, (c.programmi || 0) - prima), geo: c.geo, tex: c.tex }
            g.programmi = Math.max(g.programmi, c.programmi || 0)
            const l = luciDi(f.scena3d && f.scena3d())
            if (!g.luci || l.p + l.s > g.luci.p + g.luci.s) g.luci = l
            if (guasti.length > g0) throw new Error(`errore nel gioco: ${guasti[g0]}`)
            risultati.push({ ...riga(s, tappa), ...r })
          } catch (e) {
            risultati.push({ ...riga(s, tappa), errore: breve(e) })
            if (scaduto(e)) scaduta = true
          }
          salva()
        }
      } finally { chiudi() }
      await new Promise(r => setTimeout(r, corto ? 30 : 250))
    }
  } finally {
    console.warn = orig.warn; console.error = orig.error
    window.removeEventListener('error', guasto, true); window.removeEventListener('unhandledrejection', guasto, true)
    for (const m of new Set(guasti)) avvisi.set(`errore: ${m}`, guasti.filter(x => x === m).length)
  }
  const js = fermo() || (solo && !solo.includes('js')) ? null : proveCpu()
  return dati(await ambiente(), { js, fermata: fermo() })
}

const riga = (s, t) => ({ id: s.id, gruppo: t.gruppo, nome: s.nome })

// la CPU da sola: calcolo, oggetti da allocare e ordinare (il JS di un gioco), niente disegno
export function proveCpu() {
  const una = () => {
    const t = performance.now(); let s = 0
    for (let i = 0; i < 4e6; i++) s += Math.sin(i * 0.001) * Math.sqrt(i + 1)
    const a = []; for (let i = 0; i < 150000; i++) a.push({ x: Math.cos(i) * 1000, y: i, n: 'k' + (i % 97) })
    a.sort((p, q) => p.x - q.x)
    return performance.now() - t + (s === 1 ? 1 : 0)
  }
  una()
  const v = [una(), una(), una()].sort((a, b) => a - b)
  return Math.round(v[1])
}
