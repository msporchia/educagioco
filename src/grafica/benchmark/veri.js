// La misura del telefono coi modelli veri dei giochi (docs/core/vecchio-telefono-veri.md): le scene vere del Sotterraneo 3D, del
// mondo di sopra, dello zaino, della roba e della fattoria 3D, una alla volta, a schermo. Ogni gruppo di scene carica il suo codice
// con `import()` solo quando tocca a lui: un caricamento che fallisce è una riga «non regge», mai un errore. Ogni scena ha un rodaggio
// (shader, geometrie, riserve: il primo fotogramma si tiene a parte) e poi la misura, finché i fotogrammi lenti non si fermano.
import { proveCpu } from './prove.js'
import { eventiContesto } from './veri/tela.js'
import { tappeDegliElementi } from './veri/elementi-dati.js'
import { sceneDellaScala, MOSTRI_SCALA } from './veri/scala.js'

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
  // la verifica compatta: rodaggio ~2 s e misura 3-4,5 s (docs/core/vecchio-telefono-veri.md, «La verifica»)
  verifica: { rodaggio: [1500, 3000], misura: [3000, 4500], finestra: 1000, quadri: 12, fine: 10000 },
  // chi pesa, un elemento alla volta (docs/core/vecchio-telefono-elementi.md): tante scene corte
  elementi: { rodaggio: [1500, 3500], misura: [3000, 4500], finestra: 1000, quadri: 12, fine: 12000 },
}
const RAFFREDDA = 8000   // ms a schermo nero fra un gruppo e l'altro (le misure complete)
// I tetti di tempo (docs/core/vecchio-telefono-elementi.md, «Il tetto di tempo e il lettore»): una scena che non finisce (un fotogramma che non torna, una
// promessa che non si risolve) diventa «non regge: tempo scaduto» e la prova va avanti, col gruppo rifatto da capo per la scena dopo.
// `scena`: in più delle due fasi al loro tetto (`fine`); `carica`: il codice e la scena di un gruppo; `misura`: le scene che si misurano da sé (l'ingresso)
export const TETTO = { scena: 15000, carica: 30000, misura: 150000 }
/** `p` entro `ms`, se no un errore «tempo scaduto (cosa oltre N s)». */
export function conTetto(p, ms, cosa) {
  let t = 0
  const scade = new Promise((_, no) => { t = setTimeout(() => no(new Error(`tempo scaduto (${cosa} oltre ${Math.round(ms / 1000)} s)`)), ms) })
  return Promise.race([p, scade]).finally(() => clearTimeout(t))
}
const scaduto = e => /tempo scaduto/.test(String((e && e.message) || e))
const RAFFREDDA_BREVE = 4500   // la verifica compatta: i gruppi sono pochi e le scene corte

const discese = () => import('./veri/discese.js')
const base = () => import('./veri/base.js')
const tre = n => ({ mostri: 3, ...n })
const uno = n => ({ mostri: 1, colpi: true, ...n })   // la scomposizione: un mostro con gli effetti, una cosa tolta alla volta
// l'ingresso da freddo, per primo (il browser tiene da parte gli shader già visti: dopo sarebbe più caldo del vero), ogni scena tre
// volte da capo; le stesse a riscaldamento spento dopo, perché il confronto non lo favorisca
const INGRESSO = { gruppo: 'ingresso', carica: () => import('./veri/ingresso.js'), scene: [
  { id: 'ing-sot', nome: 'entrare in un piano, poi 3 attacchi', ingresso: 'discesa' },
  { id: 'ing-presto', nome: 'attacco a 0,5 s dall\'ingresso', ingresso: 'discesa', presto: true },
  { id: 'ing-zaino', nome: 'entrare e aprire lo zaino', ingresso: 'discesa', zaino: true },
  { id: 'ing-mondo', nome: 'entrare nel mondo di sopra', ingresso: 'mondo' },
  { id: 'ing-sot-x', nome: 'entrare, 3 attacchi, senza riscaldamento', ingresso: 'discesa', riscaldamento: false },
  { id: 'ing-presto-x', nome: 'attacco a 0,5 s, senza riscaldamento', ingresso: 'discesa', presto: true, riscaldamento: false },
  { id: 'ing-mondo-x', nome: 'il mondo di sopra, senza riscaldamento', ingresso: 'mondo', riscaldamento: false },
] }
/** Le scene delle MISURE COMPLETE, in ordine. `serie` e `quanti` dicono dove cercare il limite; `gruppo` è la sezione del log. */
export const TAPPE = [
  // l'ingresso da freddo, per primo (il browser tiene da parte gli shader già visti: dopo sarebbe più caldo del vero), ogni scena tre
  // volte da capo; le stesse a riscaldamento spento dopo, perché il confronto non lo favorisca
  INGRESSO,
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
/**
 * La VERIFICA (il tasto «Avvia coi modelli veri», ~4 minuti, `stimaVerifica`): solo quello che serve a decidere, con i ms messi contro l'ultima
 * misura vera (`veri/riferimento.js`). Le serie lunghe (triangoli, chiamate, luci, pixel, roba, fattoria, 24 persone, 16 mostri) sono già
 * misurate: stanno in `TAPPE`, le «Misure complete». Il riferimento del calore è quello fisso che ogni gruppo ha già; la scala rifà il suo gradino 1.
 */
export const RISOLUZIONI = [0.75, 0.6]
export const TAPPE_VERIFICA = [
  // l'ingresso: il primo attacco col riscaldamento acceso e spento, un giro solo (le tre ripetizioni stanno nelle misure complete)
  { gruppo: 'ingresso', carica: INGRESSO.carica, opz: { giri: 1 }, tempi: 'verifica', scene: INGRESSO.scene.filter(s => s.id === 'ing-sot' || s.id === 'ing-sot-x').map(s => ({ ...s, stima: 18 })) },
  // la scala (veri/scala.js): lo scontro dal fondo piatto alla scena intera, un gradino alla volta, nello stesso Sotterraneo
  { gruppo: 'scala', carica: () => import('./veri/elementi-sot.js'), opz: { mostri: MOSTRI_SCALA }, tempi: 'verifica', scene: sceneDellaScala() },
  // lo scontro com'è da 1 a 6 mostri, quanto degrada (la serie dà il LIMITE); `sot-1` contro l'ultima misura vera (veri/riferimento.js)
  { gruppo: 'discese', carica: discese, tempi: 'verifica', scene: [1, 2, 3, 4, 6].map(n => ({ id: `sot-${n}`, nome: `${n} mostr${n > 1 ? 'i' : 'o'} con gli effetti`, mostri: n, colpi: true, serie: 'discese', quanti: n, cresce: true, stima: 12 })) },
  // la risoluzione: lo stesso scontro con 3 mostri a 0,75 e a 0,6 (il gioco vero scende da sé fino a 0,6 sopra i 26 ms, contesto.js)
  ...RISOLUZIONI.map(d => ({ gruppo: 'risoluzione', carica: discese, opz: { dpr: d }, tempi: 'verifica', scene: [{ id: `res-${d}`, nome: `3 mostri, risoluzione ${String(d).replace('.', ',')}`, mostri: 3, colpi: true, stima: 12 }] })),
  { gruppo: 'sopra', carica: () => import('./veri/sopra.js'), tempi: 'verifica', scene: [
    { id: 'per-8', nome: '8 persone', persone: 8, stima: 10 }, { id: 'mos-8', nome: '8 mostri sul prato', mostri: 8, stima: 10 },
  ] },
  { gruppo: 'sopra', carica: () => import('./veri/zaino.js'), tempi: 'verifica', scene: [{ id: 'zaino-15', nome: '15 anteprime', anteprime: 15, stima: 6 }] },
]
/**
 * Quanto dura la verifica sul Note 7: la somma dei secondi attesi per scena (`stima`, dai log: una scena del Sotterraneo è un Sotterraneo
 * nuovo, ~13 s con shader, rodaggio e misura) più, a ogni gruppo nuovo, la pausa che raffredda, il riferimento (~5 s) e il caricamento.
 * Scritta nell'avviso iniziale; sopra gli 8 minuti si tagliano scene.
 */
export function stimaVerifica() {
  const gruppi = new Set(TAPPE_VERIFICA.map(t => t.gruppo)).size
  const scene = TAPPE_VERIFICA.reduce((n, t) => n + t.scene.length, 0)
  const secondi = TAPPE_VERIFICA.reduce((n, t) => n + t.scene.reduce((m, x) => m + (x.stima || 10), 0), 0) + gruppi * (RAFFREDDA_BREVE / 1000 + 6)
  return { scene, secondi, minuti: Math.ceil(secondi / 60) }
}
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
          // il JS del pittore diviso: `agg` il giro del gioco (logica, scena, segni), `dis` il disegno di three (i comandi alla GPU)
          const med = k => { const v = conti.map(c => c[k]).filter(x => x != null); return v.length ? tondo(mediana(v)) : undefined }
          fatto({ chMax: piu('ch'), triMax: piu('tri'), agg: med('agg'), dis: med('dis'), ms: tondo(mediana(lavoro)), p95: tondo(perc(lavoro, 0.95)), js: tondo(mediana(cpu)), gpu: tondo(mediana(gpu)), fps: somma ? Math.round(1000 * dt.length / somma) : 0, n: lavoro.length,
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
export async function eseguiVeri({ contenitore, progresso = () => {}, fermo = () => false, corto = false, solo = null, fascia = null, raffredda = null, completa = false,
                                   tetti = TETTO, tappe: proprie = null, parziale = null }) {
  if (raffredda == null) raffredda = completa || solo ? RAFFREDDA : RAFFREDDA_BREVE
  const tempi = corto ? TEMPI.corto : TEMPI.normale
  const info = infoGpuVeri()
  // `solo` sceglie per id o per gruppo (fra tutte, una scena una volta sola); senza, la verifica compatta o, con `completa`, le misure
  // complete (gli elementi no: sono una prova a parte)
  const visti = new Set()
  const nuova = s => !visti.has(s.id) && !!visti.add(s.id)
  const tappe = (proprie || (solo ? [...TAPPE, ...TAPPE_VERIFICA, ...TAPPE_ELEMENTI] : completa ? TAPPE : TAPPE_VERIFICA))
    .map(t => ({ ...t, scene: t.scene.filter(s => (!solo || solo.some(p => s.id.startsWith(p) || t.gruppo.startsWith(p))) && (!solo || nuova(s))) })).filter(t => t.scene.length)
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
  const verifica = !completa && !(solo || []).some(p => /^el(ementi|-)/.test(p))
  const dati = (dopo, extra) => ({ tipo: 'veri', verifica, info, risultati, gruppi, fascia, ambiente: { prima, dopo }, avvisi: [...avvisi].map(([m, n]) => ({ m, n })).sort((a, b) => b.n - a.n),
    contesto: { persi: eventiContesto.persi - persi0, ripresi: eventiContesto.ripresi - ripresi0 },
    schermo: `${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`, dpr: window.devicePixelRatio || 1, ...extra })
  // a ogni scena misurata, quello che c'è fin lì (`parziale`): se il telefono si pianta le scene fatte restano (docs/core/vecchio-telefono-veri.md)
  let salvate = 0
  const salva = () => { if (!parziale || risultati.length === salvate) return; salvate = risultati.length; try { parziale(dati(prima, { js: null, fermata: true, aMeta: [risultati.length, tot] })) } catch (e) { /* si salva la prossima */ } }
  const rifs = []
  try {
    for (const tappa of tappe) {
      if (fermo()) break
      const nuovo = tappa.gruppo !== ultimo
      const g = gruppi[tappa.gruppo] || (gruppi[tappa.gruppo] = { carica: [], dpr: [], luci: null, programmi: 0 })
      // a ogni gruppo nuovo: la pausa e il riferimento (a fine prova, diviso il più svelto: di quanto il telefono è rallentato)
      if (nuovo) {
        let r = null
        try { r = await conTetto(riferimento({ contenitore, fermo, corto, progresso, k, tot, raffredda }), raffredda + tetti.carica + tetti.scena, 'il riferimento') } catch (e) { r = null }
        // un riferimento più che doppio del più svelto si rifà una volta (subito, senza pausa): un intoppo non deve correggere un gruppo intero;
        // e il primo si rifà sempre: è freddo (shader e trame del riferimento ancora da compilare)
        if (r && r.ms && (!rifs.length || r.ms > 2 * Math.min(...rifs))) {
          try { const r2 = await conTetto(riferimento({ contenitore, fermo, corto, progresso, k, tot, raffredda: 0 }), tetti.carica + tetti.scena, 'il riferimento'); if (r2 && r2.ms && r2.ms < r.ms) r = r2 } catch (e) { /* si tiene il primo */ }
        }
        if (r && r.ms) {
          rifOra = r.ms; rifs.push(r.ms)
          if (!g.rif) g.rif = { ms: r.ms, p95: r.p95, js: r.js, gpu: r.gpu }
        }
      }
      ultimo = tappa.gruppo
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
        giro = f.misura ? null : creaGiro(f)
      }
      const chiudi = () => { if (giro) giro.ferma(); giro = null; try { if (f) f.via() } catch (e) { /* è già andata */ } f = null }
      await apri()
      if (!f) { for (const s of tappa.scene) { risultati.push({ ...riga(s, tappa), errore }); k++ } salva(); continue }
      try {
        for (const s of tappa.scene) {
          if (fermo()) break
          progresso(k++, tot, `${tappa.gruppo}: ${s.nome}`)
          if (s.serie && saltate.has(s.serie)) { risultati.push({ ...riga(s, tappa), salta: true }); continue }
          // dopo un tempo scaduto il gruppo si rifà da capo: la scena di prima può aver lasciato il gioco a metà
          if (scaduta) { scaduta = false; chiudi(); await apri(); if (!f) { risultati.push({ ...riga(s, tappa), errore }); continue } }
          const g0 = guasti.length
          try {
            let r
            if (f.misura) r = await conTetto(f.misura(s), tetti.misura, 'la scena')
            else {
              const prima = f.conti ? f.conti().programmi : 0
              const tm = corto ? tempi : TEMPI[tappa.tempi] || tempi
              // le due fasi stanno sotto `fine` l'una (se arrivano fotogrammi), più la preparazione della scena
              r = await conTetto(giro.misura(tm, fermo, () => f.scena(s), s === tappa.scene[0]), 2 * tm.fine + tetti.scena, 'la scena')
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
  // la deriva del calore: il riferimento di ogni gruppo diviso il più svelto (il telefono più fresco; il primo è spesso freddo di
  // shader e trame, e prenderlo come metro triplicava tutto)
  const fresco = rifs.length ? Math.min(...rifs) : null
  if (fresco) {
    for (const r of risultati) if (r.rif) r.deriva = Math.round(r.rif / fresco * 100) / 100
    for (const g of Object.values(gruppi)) if (g.rif) g.rif.deriva = Math.round(g.rif.ms / fresco * 100) / 100
  }
  const js = fermo() || (solo && !solo.includes('js')) ? null : proveCpu()
  return dati(await ambiente(), { js, fermata: fermo() })
}

const riga = (s, t) => ({ id: s.id, gruppo: t.gruppo, nome: s.nome, ...(s.serie ? { serie: s.serie, quanti: s.quanti } : {}), ...(s.el ? { el: s.el } : {}) })
