// La misura del telefono coi modelli veri dei giochi (docs/core/vecchio-telefono-veri.md): le scene vere del Sotterraneo 3D, del
// mondo di sopra, dello zaino, della roba e della fattoria 3D, una alla volta, a schermo. Ogni gruppo di scene carica il suo codice
// con `import()` solo quando tocca a lui: un caricamento che fallisce è una riga «non regge», mai un errore. Ogni scena ha un rodaggio
// (shader, geometrie, riserve: il primo fotogramma si tiene a parte) e poi la misura, finché i fotogrammi lenti non si fermano.
import { proveCpu } from './prove.js'
import { eventiContesto } from './veri/tela.js'
import { tappeDegliElementi } from './veri/elementi-dati.js'

export const SOGLIA = 33          // ms di lavoro al p95: oltre, a scatti (30 fps)
export const SALTA_OLTRE = 400    // una scena oltre questo al p95: il resto della sua serie che cresce non si misura (il telefono si pianterebbe)
const LENTO = 33
// [minimo, tetto] in ms; `quadri`: i fotogrammi che una finestra vuole almeno (a 500 ms l'uno, il telefono imitato, il tempo da solo
// darebbe dieci fotogrammi); `fine`: il tetto di una fase anche senza i fotogrammi
const TEMPI = {
  normale: { rodaggio: [2000, 5000], misura: [5000, 8000], finestra: 1500, quadri: 15, fine: 20000 },
  corto: { rodaggio: [120, 300], misura: [250, 500], finestra: 120, quadri: 0, fine: 3000 },        // le prove (`window.__benchmarkCorto`)
  // il riferimento del calore all'inizio di ogni gruppo, dopo la pausa che fa raffreddare
  rif: { rodaggio: [1000, 2500], misura: [2000, 3000], finestra: 1000, quadri: 10, fine: 8000 },
  // chi pesa, un elemento alla volta (docs/core/vecchio-telefono-elementi.md): tante scene corte
  elementi: { rodaggio: [1500, 3500], misura: [3000, 4500], finestra: 1000, quadri: 12, fine: 12000 },
}
const RAFFREDDA = 8000   // ms a schermo nero fra un gruppo e l'altro

const discese = () => import('./veri/discese.js')
const base = () => import('./veri/base.js')
const tre = n => ({ mostri: 3, ...n })
const uno = n => ({ mostri: 1, colpi: true, ...n })   // la scomposizione: un mostro con gli effetti, una cosa tolta alla volta
/** Le scene, in ordine. `serie` e `quanti` dicono dove cercare il limite; `gruppo` è la sezione del log. */
export const TAPPE = [
  // l'ingresso da freddo, per primo (il browser tiene da parte gli shader già visti: dopo sarebbe più caldo del vero), ogni scena tre
  // volte da capo; le stesse a riscaldamento spento dopo, perché il confronto non lo favorisca
  { gruppo: 'ingresso', carica: () => import('./veri/ingresso.js'), scene: [
    { id: 'ing-sot', nome: 'entrare in un piano, poi 3 attacchi', ingresso: 'discesa' },
    { id: 'ing-presto', nome: 'attacco a 0,5 s dall\'ingresso', ingresso: 'discesa', presto: true },
    { id: 'ing-zaino', nome: 'entrare e aprire lo zaino', ingresso: 'discesa', zaino: true },
    { id: 'ing-mondo', nome: 'entrare nel mondo di sopra', ingresso: 'mondo' },
    { id: 'ing-sot-x', nome: 'entrare, 3 attacchi, senza riscaldamento', ingresso: 'discesa', riscaldamento: false },
    { id: 'ing-presto-x', nome: 'attacco a 0,5 s, senza riscaldamento', ingresso: 'discesa', presto: true, riscaldamento: false },
    { id: 'ing-mondo-x', nome: 'il mondo di sopra, senza riscaldamento', ingresso: 'mondo', riscaldamento: false },
  ] },
  { gruppo: 'calore', carica: discese, scene: [{ id: 'cal-1', nome: 'riferimento, 8 mostri con gli effetti', mostri: 8, colpi: true }] },
  // il pavimento: quanto costa un fotogramma che non disegna niente, e 100 oggetti semplici
  { gruppo: 'pavimento', carica: base, scene: [{ id: 'vuoto', nome: 'schermo vuoto (solo pulito)', base: 'vuoto' }, { id: 'cubi', nome: '100 cubi semplici', base: 'cubi' }] },
  { gruppo: 'discese', carica: discese, scene: [
    ...[1, 3, 6, 8].map(n => ({ id: `sot-${n}`, nome: `${n} mostr${n > 1 ? 'i' : 'o'} con gli effetti`, mostri: n, colpi: true, serie: 'discese', quanti: n, cresce: true })),
    ...[1, 2, 4, 8].map(k => tre({ id: `tri-${k}`, nome: `triangoli x${k}`, tri: k, serie: 'triangoli', quanti: k })),
    ...[2, 4].map(k => tre({ id: `ch-${k}`, nome: `chiamate x${k}`, ch: k, serie: 'chiamate', quanti: k })),
  ] },
  { gruppo: 'togli', carica: discese, scene: [
    uno({ id: 'ab-base', nome: 'scena intera (1 mostro, effetti)' }), uno({ id: 'ab-ombra', nome: 'senza ombra', via: 'ombra' }),
    uno({ id: 'ab-luci1', nome: 'una luce sola (il cono)', via: 'luci1' }), uno({ id: 'ab-luci0', nome: 'nessuna luce puntiforme', via: 'luci0' }),
    uno({ id: 'ab-punti', nome: 'senza particelle', via: 'punti' }), uno({ id: 'ab-normali', nome: 'senza normal map', via: 'normali' }),
    uno({ id: 'ab-lambert', nome: 'materiali Lambert', via: 'lambert' }), uno({ id: 'ab-basic', nome: 'materiali Basic (niente luce)', via: 'basic' }),
  ] },
  { gruppo: 'togli', carica: discese, opz: { spegni: ['nebbia'] }, scene: [uno({ id: 'ab-nebbia', nome: 'senza fette di nebbia' })] },
  { gruppo: 'togli', carica: discese, opz: { spegni: ['post'] }, scene: [uno({ id: 'ab-post', nome: 'senza passaggio finale' })] },
  { gruppo: 'togli', carica: discese, opz: { dpr: 0.6 }, scene: [uno({ id: 'ab-dpr', nome: 'pixel ratio 0,6' })] },
  { gruppo: 'luci', carica: discese, opz: { spegni: ['fuochi:0'] }, scene: [
    ...[1, 2, 4, 6, 12].map(n => tre({ id: `luci-${n}`, nome: `${n} fuoc${n > 1 ? 'hi' : 'o'} e l'ombra del cono`, fuochi: n, serie: 'luci', quanti: n })),
    ...[1, 6, 12].map(n => tre({ id: `luci-${n}s`, nome: `${n} fuoc${n > 1 ? 'hi' : 'o'} senza ombra`, fuochi: n, ombra: false, serie: 'luci-senza-ombra', quanti: n })),
  ] },
  ...[1, 1.41, 2].map(d => ({ gruppo: 'pixel', carica: discese, opz: { dpr: d }, scene: [tre({ id: `px-${d}`, nome: `pixel ratio ${d}`, serie: 'pixel', quanti: d })] })),
  { gruppo: 'pixel', carica: discese, opz: { spegni: ['nebbia'] }, scene: [tre({ id: 'senza-nebbia', nome: 'senza nebbia' })] },
  { gruppo: 'sopra', carica: () => import('./veri/sopra.js'), scene: [
    ...[4, 8, 16, 24].map(n => ({ id: `per-${n}`, nome: `${n} persone`, persone: n, serie: 'persone', quanti: n, cresce: true })),
    ...[4, 8, 16].map(n => ({ id: `mos-${n}`, nome: `${n} mostri sul prato`, mostri: n, serie: 'mostri-sopra', quanti: n, cresce: true })),
  ] },
  { gruppo: 'zaino', carica: () => import('./veri/zaino.js'), scene: [
    { id: 'zaino-15', nome: '15 anteprime', anteprime: 15 }, { id: 'zaino-40', nome: '40 anteprime', anteprime: 40, salta: 15 },
  ] },
  { gruppo: 'roba', carica: () => import('./veri/roba.js'), scene: ['lame', 'bastoni', 'scudi', 'vesti', 'gioielli', 'pozioni'].map(f => ({ id: `roba-${f}`, nome: `24 ${f}`, roba: f, serie: 'roba' })) },
  { gruppo: 'fattoria', carica: () => import('./veri/fattoria.js'), scene: [
    ...[10, 30, 60].map(n => ({ id: `fat-${n}`, nome: `${n} edifici`, edifici: n, serie: 'fattoria', quanti: n, cresce: true })),
    { id: 'fat-bestie', nome: '4 pollai e 4 stalle (bestie)', pollai: 4, stalle: 4 },
  ] },
  { gruppo: 'fattoria', carica: () => import('./veri/fattoria.js'), opz: { stagione: 'natale' }, scene: [{ id: 'fat-natale', nome: 'Natale, 30 edifici', edifici: 30 }] },
  { gruppo: 'calore', carica: discese, scene: [{ id: 'cal-2', nome: 'riferimento, di nuovo alla fine', mostri: 8, colpi: true }] },
]
export const QUANTE = TAPPE.reduce((n, t) => n + t.scene.length, 0)
/** Chi pesa (docs/core/vecchio-telefono-elementi.md): a parte, solo se `solo` li chiede (`['elementi']`, o i gruppi e gli id). */
export const TAPPE_ELEMENTI = tappeDegliElementi()

const mediana = v => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.floor(o.length / 2)] : 0 }
const perc = (v, q) => { const o = v.slice().sort((a, b) => a - b); return o.length ? o[Math.min(o.length - 1, Math.floor(q * o.length))] : 0 }
const breve = e => String((e && e.message) || e || '?').replace(/\s+/g, ' ').slice(0, 60)
const tondo = x => Math.round(x * 10) / 10

// Il giro dei fotogrammi di un gruppo: `inizio` gira prima del disegno del gioco e `fine` dopo (i requestAnimationFrame vanno
// nell'ordine in cui si chiedono, e ognuno si richiede per primo: l'ordine resta), così il lavoro di un fotogramma è dal primo al
// terzo, disegno del gioco compreso, più l'attesa della GPU (la lettura di un pixel). Le scene che non hanno un loro giro
// disegnano in `passo`, dentro `fine`.
function creaGiro(f) {
  let vivo = true, a = 0, ultimo = 0, rec = null, guasto = null
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
    if (gl && !gl.isContextLost()) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
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
      guasto = null
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
          fatto({ chMax: piu('ch'), triMax: piu('tri'), ms: tondo(mediana(lavoro)), p95: tondo(perc(lavoro, 0.95)), js: tondo(mediana(cpu)), gpu: tondo(mediana(gpu)), fps: somma ? Math.round(1000 * dt.length / somma) : 0, n: lavoro.length,
                  primo: tondo(Math.max(0, ...comparsa, ...primi.slice(0, 10))), pronto, lenti: lavoro.filter(x => x > LENTO).length, stabile,
                  ...(nascosta ? { nascosta: true } : {}) })
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
          if (f.conti && lavoro.length % 15 === 1) { try { conti.push(f.conti()) } catch (e) { /* niente conti */ } }
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

// il riferimento del calore: la pausa a schermo nero, poi la stessa scena fissa (veri/base.js), corta
async function riferimento({ contenitore, fermo, corto, progresso, k, tot, raffredda }) {
  if (!corto && raffredda > 0) {
    for (let s = Math.round(raffredda / 1000); s > 0 && !fermo(); s--) { progresso(k, tot, `pausa per raffreddare, ${s} s`); await new Promise(r => setTimeout(r, 1000)) }
  }
  if (fermo()) return null
  progresso(k, tot, 'riferimento del calore')
  const m = await base(), f = await m.prepara({ contenitore })
  const giro = creaGiro(f)
  try { return await giro.misura(corto ? TEMPI.corto : TEMPI.rif, fermo, () => f.scena({ base: 'rif' }), true) } finally { giro.ferma(); f.via() }
}

/**
 * Tutte le scene nel `contenitore` (un elemento a tutto schermo). `progresso(i, n, nome)`, `fermo()` per interrompere, `corto` per le
 * prove, `solo`: gli inizi degli id da fare (`['sot-', 'zaino']`, e `js` per la prova di CPU), `raffredda`: i ms di pausa fra i gruppi.
 * → { tipo: 'veri', info, js, risultati, gruppi, avvisi, contesto, schermo, dpr, fascia, fermata }
 */
export async function eseguiVeri({ contenitore, progresso = () => {}, fermo = () => false, corto = false, solo = null, fascia = null, raffredda = RAFFREDDA }) {
  const tempi = corto ? TEMPI.corto : TEMPI.normale
  const info = infoGpuVeri()
  // `solo` sceglie per id o per gruppo; senza, le scene di sempre (gli elementi no: sono una prova a parte)
  const tappe = (solo ? [...TAPPE, ...TAPPE_ELEMENTI] : TAPPE)
    .map(t => ({ ...t, scene: t.scene.filter(s => !solo || solo.some(p => s.id.startsWith(p) || t.gruppo.startsWith(p))) })).filter(t => t.scene.length)
  const tot = tappe.reduce((n, t) => n + t.scene.length, 0)
  const risultati = [], gruppi = {}, saltate = new Set(), avvisi = new Map()
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
  let k = 0, ultimo = null, rifOra = null
  const rifs = []
  try {
    for (const tappa of tappe) {
      if (fermo()) break
      const nuovo = tappa.gruppo !== ultimo
      const g = gruppi[tappa.gruppo] || (gruppi[tappa.gruppo] = { carica: [], dpr: [], luci: null, programmi: 0 })
      // a ogni gruppo nuovo: la pausa e il riferimento (a fine prova, diviso il più svelto: di quanto il telefono è rallentato)
      if (nuovo) {
        let r = null
        try { r = await riferimento({ contenitore, fermo, corto, progresso, k, tot, raffredda }) } catch (e) { r = null }
        // un riferimento più che doppio del più svelto si rifà una volta (subito, senza pausa): un intoppo non deve correggere un gruppo intero;
        // e il primo si rifà sempre: è freddo (shader e trame del riferimento ancora da compilare)
        if (r && r.ms && (!rifs.length || r.ms > 2 * Math.min(...rifs))) {
          try { const r2 = await riferimento({ contenitore, fermo, corto, progresso, k, tot, raffredda: 0 }); if (r2 && r2.ms && r2.ms < r.ms) r = r2 } catch (e) { /* si tiene il primo */ }
        }
        if (r && r.ms) {
          rifOra = r.ms; rifs.push(r.ms)
          if (!g.rif) g.rif = { ms: r.ms, p95: r.p95, js: r.js, gpu: r.gpu }
        }
      }
      ultimo = tappa.gruppo
      progresso(k, tot, `${tappa.gruppo}: si carica…`)
      const t0 = performance.now()
      let f = null, errore = null
      try { const m = await tappa.carica(); f = await m.prepara({ contenitore, opz: tappa.opz || {}, corto }) } catch (e) { errore = breve(e) }
      g.carica.push(Math.round(performance.now() - t0))
      if (!f) { for (const s of tappa.scene) { risultati.push({ ...riga(s, tappa), errore }); k++ } continue }
      if (f.dpr && !g.dpr.includes(tondo(f.dpr))) g.dpr.push(tondo(f.dpr))
      const giro = f.misura ? null : creaGiro(f)
      try {
        for (const s of tappa.scene) {
          if (fermo()) break
          progresso(k++, tot, `${tappa.gruppo}: ${s.nome}`)
          if (s.serie && saltate.has(s.serie)) { risultati.push({ ...riga(s, tappa), salta: true }); continue }
          const g0 = guasti.length
          try {
            let r
            if (f.misura) r = await f.misura(s)
            else {
              const prima = f.conti ? f.conti().programmi : 0
              r = await giro.misura(corto ? tempi : TEMPI[tappa.tempi] || tempi, fermo, () => f.scena(s), s === tappa.scene[0])
              if (giro.guasto) throw giro.guasto
              const c = f.conti ? f.conti() : {}
              if (f.gl() && f.gl().isContextLost()) throw new Error('contesto WebGL perso')
              r = { ...r, ch: r.chMax ?? c.ch, tri: r.triMax ?? c.tri, nuovi: Math.max(0, (c.programmi || 0) - prima), geo: c.geo, tex: c.tex,
                    mpx: f.tela ? tondo(f.tela.width * f.tela.height / 1e6) : null }
              g.programmi = Math.max(g.programmi, c.programmi || 0)
              const l = luciDi(f.scena3d && f.scena3d())
              if (!g.luci || l.p + l.s > g.luci.p + g.luci.s) g.luci = l
            }
            if (guasti.length > g0) throw new Error(`errore nel gioco: ${guasti[g0]}`)
            risultati.push({ ...riga(s, tappa), ...r, ...(rifOra ? { rif: rifOra } : {}) })
            // solo le serie che crescono (più mostri, più persone…): le leve dei colli e la roba si confrontano fra loro, si fanno tutte
            if (s.cresce && r.p95 > SALTA_OLTRE && !corto) saltate.add(s.serie)   // nelle prove corte si fanno tutte
          } catch (e) { risultati.push({ ...riga(s, tappa), errore: breve(e) }) }
        }
      } finally {
        if (giro) giro.ferma()
        try { f.via() } catch (e) { /* è già andata */ }
      }
      await new Promise(r => setTimeout(r, corto ? 30 : 250))
    }
  } finally {
    console.warn = orig.warn; console.error = orig.error
    window.removeEventListener('error', guasto, true); window.removeEventListener('unhandledrejection', guasto, true)
    for (const m of new Set(guasti)) avvisi.set(`errore: ${m}`, guasti.filter(x => x === m).length)
  }
  // la deriva del calore: il riferimento di ogni gruppo diviso il più svelto (il telefono più fresco; il primo è spesso freddo di
  // shader e trame, e prenderlo come metro triplicava tutto)
  const fresco = rifs.length ? Math.min(...rifs) : null
  if (fresco) {
    for (const r of risultati) if (r.rif) r.deriva = Math.round(r.rif / fresco * 100) / 100
    for (const g of Object.values(gruppi)) if (g.rif) g.rif.deriva = Math.round(g.rif.ms / fresco * 100) / 100
  }
  const js = fermo() || (solo && !solo.includes('js')) ? null : proveCpu()
  const dopo = await ambiente()
  return { tipo: 'veri', info, js, risultati, gruppi, fascia, ambiente: { prima, dopo }, avvisi: [...avvisi].map(([m, n]) => ({ m, n })).sort((a, b) => b.n - a.n),
           contesto: { persi: eventiContesto.persi - persi0, ripresi: eventiContesto.ripresi - ripresi0 },
           schermo: `${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`, dpr: window.devicePixelRatio || 1, fermata: fermo() }
}

const riga = (s, t) => ({ id: s.id, gruppo: t.gruppo, nome: s.nome, ...(s.serie ? { serie: s.serie, quanti: s.quanti } : {}), ...(s.el ? { el: s.el } : {}) })
