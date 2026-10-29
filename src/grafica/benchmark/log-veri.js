// Il log della misura coi modelli veri (grafica/benchmark/veri.js, docs/core/vecchio-telefono-veri.md): una riga per scena (gli fps
// veri; nelle scale lavoro, p95, la parte della CPU e quella della GPU, chiamate, triangoli, la prima apparizione), la LETTURA con i ms
// corretti dal calore, e la riga DATI per lo strumento. Le soglie delle scale sono del fotogramma INTERO di un gioco (lavoro al p95):
// liscio sotto 20 ms, a scatti sopra 33 (30 fps). Niente three qui: si prova senza browser.
import { letturaScala } from './veri/scala.js'

const SOGLIE = { liscio: 20, scatti: 33 }
export const CPU = { veloce: 250, lenta: 500 } // ms della prova JS: un computer da scrivania sta fra 110 e 160
export const LIMITE_CAMPO = 3400   // i caratteri di un invio del modulo dei giudizi (il campo regge ~3,5k)
const segnoVero = p => (p <= SOGLIE.liscio ? 'ok ' : p <= SOGLIE.scatti ? '~  ' : 'XX ')
const misurata = r => r && !r.errore && r.ms != null
const kt = t => (t == null ? '?' : Math.round(t / 1000))
const t1d = x => Math.round(x * 10) / 10

export const data = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
export const modello = ua => {
  const m = /Android[^;)]*;\s*([^;)]+?)(?:\sBuild|\)|;)/.exec(ua || '')
  return m ? m[1].trim() : (/iPhone|iPad/.test(ua || '') ? 'iOS' : 'computer')
}

/** I ms tolto il calore: diviso la deriva del riferimento del gruppo (1 = come al primo), se si scosta più del 5%. */
export const corretta = r => (misurata(r) && r.deriva && Math.abs(r.deriva - 1) > 0.05
  ? { ...r, ms: t1d(r.ms / r.deriva), p95: t1d(r.p95 / r.deriva), js: r.js != null ? t1d(r.js / r.deriva) : r.js, gpu: r.gpu != null ? t1d(r.gpu / r.deriva) : r.gpu } : r)

// gli fps veri (veri.js, TAPPE_FPS): quanti fotogrammi al secondo arrivano davvero, quanti sotto i 30, i fermi; il JS è solo la CPU
const segnoFps = f => (f >= 50 ? 'ok ' : f >= 30 ? '~  ' : 'XX ')
function rigaFps(r) {
  return `${segnoFps(r.fps)}${r.nome}: ${r.fps} fps (sotto i 30 il ${r.sotto30}% dei fotogrammi, p95 ${r.dt95} ms${r.fermi ? `, ${r.fermi} fermi oltre 100 ms` : ''}) js ${r.js ?? '?'} ${r.ch ?? '?'}ch ${kt(r.tri)}kt`
}
const letturaFps = (ris, fascia) => {
  const l = ris.filter(r => r.vero && misurata(r))
  if (!l.length) return []
  const piano = x => (x >= 50 ? 'liscio' : x >= 30 ? 'si gioca, a tratti scatta' : 'a scatti')
  return [`FPS VERI (fascia ${fascia || '?'}, il gioco com'è): ${l.map(r => `${r.nome} ${r.fps} fps (${piano(r.fps)}${r.sotto30 ? `, sotto i 30 il ${r.sotto30}%` : ''})`).join('; ')}.`]
}

function rigaVera(r) {
  if (r.errore) return `XX ${r.nome}: non regge (${r.errore})`
  if (r.vero) return rigaFps(r)
  const c = corretta(r)
  const piu = [c !== r ? `≈${c.ms}` : '', r.primo > Math.max(50, 2 * r.ms) ? `primo ${Math.round(r.primo)}` : '', r.nuovi ? `+${r.nuovi}sh` : '',
               r.pronto > 1500 ? `pronto ${(r.pronto / 1000).toFixed(1)}s` : '', r.stabile === false ? 'instabile' : '', r.nascosta ? 'NASCOSTA' : ''].filter(Boolean).join(' ')
  const parti = r.agg != null ? `: gioco ${r.agg} disegno ${r.dis ?? '?'}` : ''
  return `${/^scala-/.test(r.id) ? '·  ' : segnoVero(r.p95)}${r.nome}: ${r.ms}/${r.p95} ms (js ${r.js ?? '?'}${parti} gpu ${r.gpu ?? '?'}) ${r.fps}fps ${r.ch ?? '?'}ch ${kt(r.tri)}kt${piu ? ' ' + piu : ''}`
}

// dove va il JS in cima a ogni scala: il giro del gioco, il disegno di three e il resto, misurato sugli stessi fotogrammi (veri.js)
function letturaJs(ris) {
  const cime = ['scala', 'scala-sopra'].map(g => ris.filter(r => r.gruppo === g && /-\d+$/.test(r.id)).reverse().find(r => misurata(r) && r.agg != null && r.js != null)).filter(Boolean)
  return cime.map(j => `Dove va il JS (${j.gruppo === 'scala' ? 'lo scontro' : 'il villaggio'}, ${j.nome}): ${j.js} ms, di cui il giro del gioco ${j.agg}, il disegno di three ${j.dis ?? '?'}` +
    (j.resto != null ? `, il resto ${j.resto} (fra un fotogramma e l'altro)` : '') + '.')
}

/** Cosa dice la prova, coi ms tolto il calore. */
export function letturaVeri(dati) {
  const crudi = dati.risultati || [], ris = crudi.map(corretta), righe = []
  const derive = crudi.some(r => r.deriva) ? crudi.filter(misurata).map(r => r.deriva ?? 1) : []
  righe.push(...letturaFps(crudi, dati.fascia))
  righe.push(...letturaJs(ris))
  righe.push(...letturaScala(ris))
  if (derive.length) righe.push(`Calore: il riferimento di ogni gruppo da x${Math.min(...derive)} a x${Math.max(...derive)} del più fresco` +
    (Math.max(...derive) > 1.15 ? `; la lettura usa i ms divisi per quella deriva (le righe: ≈).` : ': stabile.'))
  if (dati.js != null) righe.push(`CPU: ${dati.js} ms (computer 110-160): ${dati.js <= CPU.veloce ? 'veloce' : dati.js <= CPU.lenta ? 'media' : 'lenta, il JS dei giochi pesa'}.`)
  const a = (dati.ambiente || {}).prima || {}, z = (dati.ambiente || {}).dopo || {}
  if (a.batteria && !a.batteria.carica && a.batteria.livello < 30) righe.push(`Batteria al ${a.batteria.livello}% e non in carica: il telefono può essere in risparmio energetico (CPU a metà).`)
  if (a.batteria && z.batteria && a.batteria.livello - z.batteria.livello >= 5) righe.push(`La prova ha consumato il ${a.batteria.livello - z.batteria.livello}% di batteria.`)
  // la CPU o la GPU: delle scene delle scale, quanto del lavoro è attesa della scheda (gli fps veri non aspettano la GPU)
  const conGpu = ris.filter(r => misurata(r) && !r.vero && r.gpu != null && r.js != null)
  if (conGpu.length) {
    const g = conGpu.reduce((n, r) => n + r.gpu, 0), j = conGpu.reduce((n, r) => n + r.js, 0)
    const quota = Math.round(100 * g / Math.max(0.1, g + j))
    righe.push(`CPU o GPU: la GPU tiene il ${quota}% del lavoro (js ${t1d(j / conGpu.length)} ms, gpu ${t1d(g / conGpu.length)} ms in media)` +
      (quota >= 60 ? ' = il collo è la scheda (pixel, luci, ombre).' : quota <= 40 ? ' = il collo è il JS (e le chiamate).' : '.'))
  }
  const primi = ris.filter(r => misurata(r) && r.primo > 100).sort((x, y) => y.primo - x.primo).slice(0, 3)
  const sh = ris.reduce((n, r) => n + (r.nuovi || 0), 0), prog = Math.max(0, ...Object.values(dati.gruppi || {}).map(g => g.programmi || 0))
  const parallelo = !((dati.info || {}).mancanti || []).includes('KHR_parallel_shader_compile')
  if (primi.length || sh) righe.push(`Prima apparizione: ${primi.map(r => `${r.nome} ${Math.round(r.primo)} ms`).join(', ') || 'nessuna sopra 100 ms'}; ${sh} shader nuovi, ` +
    `fino a ${prog} programmi in un gruppo` + (parallelo ? '.' : '; senza KHR_parallel_shader_compile si compilano bloccando: vanno precompilati (renderer.compileAsync) a una schermata di caricamento.'))
  const i = dati.info || {}, p = i.precisione
  if (p) righe.push(`GPU: highp nei frammenti ${p.fsAlta ? 'si' : 'NO'}, mediump a ${p.fsMedia} bit` +
    (!p.fsAlta ? ' = luci, normal map e nebbia a mezza precisione: guarda se sgranano o fanno strisce.' : '.') +
    (i.uniFrag && i.uniFrag < 256 ? ` Poche uniform nel frammento (${i.uniFrag}): tante luci non ci stanno.` : ''))
  const c = dati.contesto || {}
  if (c.persi) righe.push(`Il contesto WebGL si è perso ${c.persi} volte (${c.ripresi || 0} ripreso): la memoria della GPU non basta.`)
  const no = crudi.filter(r => r.errore)
  if (no.length) righe.push(`Non reggono: ${no.map(r => r.nome).join(', ')}.`)
  if ((dati.avvisi || []).length) righe.push(`Avvisi in console: ${dati.avvisi.reduce((n, x) => n + x.n, 0)} (sotto, AVVISI).`)
  return righe
}

const batteria = b => (b ? `${b.livello}%${b.carica ? ' in carica' : ''}` : '?')

/** Il resoconto. `nome`: il modello del telefono se il browser lo dice (userAgentData), se no dallo user agent. */
export function componiVeri(dati, { versione = '', ua = '', nome = '', cpu = null, memoria = null, quando = new Date() } = {}) {
  const i = dati.info || {}, p = i.precisione || {}, amb = dati.ambiente || {}, a = amb.prima || {}, z = amb.dopo || {}
  const testa = [
    `MISURA COI MODELLI VERI ${data(quando)}${versione ? ' v' + versione : ''}${dati.prova === 'scale' ? ' (dove pesa)' : ' (fps veri)'}${dati.aMeta ? ` (A METÀ: ${dati.aMeta[0]} scene di ${dati.aMeta[1]}, la prova non è finita)` : dati.fermata ? ' (INTERROTTA)' : ''}`,
    `${nome || modello(ua)} | schermo ${dati.schermo} dpr ${dati.dpr} | CPU ${cpu ?? '?'} core${memoria ? ', ' + memoria + ' GB' : ''} | fascia ${dati.fascia || '?'}`,
    `batteria ${batteria(a.batteria)} → ${batteria(z.batteria)}${a.rete ? ` | rete ${a.rete.tipo}${a.rete.risparmio ? ', risparmio dati' : ''}` : ''} | risparmio energetico: il browser non lo dice`,
    `GPU ${i.gpu || '?'} | ${i.fornitore || '?'} | ${i.versione || ''}`,
    `tex ${i.maxTex} | uniform v/f ${i.uniVert}/${i.uniFrag} | varying ${i.varying} | highp v/f ${p.vsAlta}/${p.fsAlta} mediump f ${p.fsMedia}${(i.mancanti || []).length ? ' | mancano ' + i.mancanti.join(' ') : ''}`,
  ]
  const corpo = []
  let gr = '', vista = new Set()
  for (const r of dati.risultati || []) {
    if (r.gruppo !== gr) {
      gr = r.gruppo
      const g = (dati.gruppi || {})[gr] || {}, l = g.luci, rr = (dati.risultati || []).filter(x => x.gruppo === gr)
      const mem = Math.max(0, ...rr.map(x => x.geo || 0)), tex = Math.max(0, ...rr.map(x => x.tex || 0))
      const rif = g.rif && !vista.has(gr) ? `, rif ${g.rif.ms} ms x${g.rif.deriva}` : ''
      vista.add(gr)
      corpo.push(`[${gr}] codice ${(g.carica || []).reduce((x, y) => x + y, 0)} ms` + (g.dpr && g.dpr.length ? `, dpr ${g.dpr.join('/')}` : '') +
        (l ? `, luci ${l.p}p ${l.s}s ${l.d}d ${l.h}h ombre ${l.ombre}` : '') + (mem ? `, mem ${mem}g ${tex}t` : '') + (g.programmi ? `, prog ${g.programmi}` : '') + rif)
    }
    corpo.push(rigaVera(r))
  }
  const avvisi = (dati.avvisi || []).slice(0, 6).map(x => `- ${x.n}x ${x.m}`)
  const dd = { v: 3, k: 'veri', p: dati.prova, i: { g: i.gpu, v: i.fornitore, t: i.maxTex, u: [i.uniVert, i.uniFrag], p: [p.vsAlta, p.fsAlta, p.fsMedia], m: i.mancanti || [] },
    s: dati.schermo, d: dati.dpr, f: dati.fascia, js: dati.js, b: a.batteria ? [a.batteria.livello, a.batteria.carica ? 1 : 0, z.batteria ? z.batteria.livello : null] : null,
    c: Object.fromEntries(Object.entries(dati.gruppi || {}).map(([k, g]) => [k, (g.carica || []).reduce((x, y) => x + y, 0)])),
    x: { p: (dati.contesto || {}).persi || 0, r: (dati.contesto || {}).ripresi || 0, a: (dati.avvisi || []).length },
    // [id, ms, p95, fps, chiamate, ktriangoli, primo, shader nuovi, js, gpu, deriva, gioco, disegno] (lo strumento legge la seconda)
    r: (dati.risultati || []).map(r => r.errore ? [r.id, 'err']
      : [r.id, r.ms, r.p95, r.fps, r.ch, kt(r.tri), Math.round(r.primo || 0), r.nuovi || 0, r.js ?? null, r.gpu ?? null, r.deriva ?? 1, ...(r.agg != null ? [r.agg, r.dis ?? null] : [])]) }
  return [...testa, '', ...corpo, ...(avvisi.length ? ['', 'AVVISI', ...avvisi] : []), '', `CPU prova JS: ${dati.js ?? '?'} ms`, '',
    'LETTURA', ...letturaVeri(dati).map(r => '- ' + r), '', `DATI ${JSON.stringify(dd)}`].join('\n')
}

/** Le note scritte a mano in fondo alla prova, prima della riga DATI. */
export function conNote(testo, note) {
  const n = String(note || '').trim()
  if (!n) return testo
  const righe = testo.split('\n'), i = righe.findIndex(r => r.startsWith('DATI '))
  const blocco = ['NOTE', ...n.split('\n').map(r => '- ' + r.trim()).filter(r => r.length > 2), '']
  righe.splice(i < 0 ? righe.length : i, 0, ...blocco)
  return righe.join('\n')
}

/** Il log in pezzi che stanno nel campo del modulo (`max` caratteri), tagliati fra una riga e l'altra; ognuno dice «parte k/n». */
export function spezza(testo, max = LIMITE_CAMPO) {
  if (testo.length <= max) return [testo]
  const righe = testo.split('\n'), testa = righe[0], parti = [[]]
  const segno = 24   // lo spazio per « (parte 10/10)» in testa
  let lung = testa.length + segno
  for (const r of righe.slice(1)) {
    if (lung + r.length + 1 > max && parti[parti.length - 1].length) { parti.push([]); lung = testa.length + segno }
    parti[parti.length - 1].push(r); lung += r.length + 1
  }
  return parti.map((p, k) => [`${testa} (parte ${k + 1}/${parti.length})`, ...p].join('\n'))
}
