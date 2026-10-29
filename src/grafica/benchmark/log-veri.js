// Il log della misura coi modelli veri (grafica/benchmark/veri.js, docs/core/vecchio-telefono-veri.md): una riga per scena (lavoro,
// p95, la parte della CPU e quella della GPU, chiamate, triangoli, la prima apparizione), la LETTURA (il limite di ogni serie, il
// pavimento, i colli, cosa togliere, il calore, la GPU) con i ms corretti dal calore, e la riga DATI per lo strumento. Le soglie sono
// del fotogramma INTERO di un gioco (lavoro al p95): liscio sotto 20 ms, a scatti sopra 33 (30 fps), molto sopra 66 (15 fps).
import { CPU, data, modello } from './log.js'
import { rigaIngresso, letturaIngresso } from './log-ingresso.js'
import { tabellaElementi, letturaElementi } from './log-elementi.js'
import { RIFERIMENTO, confronta, dif } from './veri/riferimento.js'
import { letturaScala } from './veri/scala.js'

export const SOGLIE_VERI = { liscio: 20, scatti: 33, molto: 66 }
export const LIMITE_CAMPO = 3400   // i caratteri di un invio del modulo dei giudizi (il campo regge ~3,5k)
const segnoVero = p => (p <= SOGLIE_VERI.liscio ? 'ok ' : p <= SOGLIE_VERI.scatti ? '~  ' : 'XX ')
const SERIE = { discese: ['Scontro nelle discese (eroe leggendario, effetti)', 'mostri', 'mostro'], persone: ['Persone 3D di sopra', 'persone', 'persona'],
                'mostri-sopra': ['Mostri 3D di sopra', 'mostri', 'mostro'], fattoria: ['Fattoria 3D', 'edifici', 'edificio'] }
const TOLTO = { 'ab-ombra': 'ombra', 'ab-luci1': 'tutte le luci tranne il cono', 'ab-luci0': 'tutte le luci', 'ab-punti': 'particelle', 'ab-normali': 'normal map',
                'ab-lambert': 'materiali → Lambert', 'ab-basic': 'materiali → Basic', 'ab-nebbia': 'fette di nebbia', 'ab-post': 'passaggio finale', 'ab-dpr': 'pixel ratio 0,6' }
const misurata = r => r && !r.errore && !r.salta && r.ms != null
const kt = t => (t == null ? '?' : Math.round(t / 1000))
const segnato = x => `${x >= 0 ? '+' : ''}${x}`
const t1d = x => Math.round(x * 10) / 10

/** I ms tolto il calore: diviso la deriva del riferimento del gruppo (1 = come al primo), se si scosta più del 5%. */
export const corretta = r => (misurata(r) && r.deriva && Math.abs(r.deriva - 1) > 0.05
  ? { ...r, ms: t1d(r.ms / r.deriva), p95: t1d(r.p95 / r.deriva), js: r.js != null ? t1d(r.js / r.deriva) : r.js, gpu: r.gpu != null ? t1d(r.gpu / r.deriva) : r.gpu } : r)

/**
 * Il limite di una serie che cresce: l'ultima sotto 33 ms al p95 (`regge`), la prima oltre 33 (`oltre`) e la prima oltre 66 (`molto`);
 * un guasto conta come oltre. Con due scene misurate, la `pendenza` (ms al p95 per elemento in più) e il `pavimento` (la retta a zero).
 */
export function limite(ris, serie) {
  const l = ris.filter(r => r.serie === serie && !r.salta)
  if (!l.length) return null
  const i = l.findIndex(r => r.errore || r.p95 > SOGLIE_VERI.scatti)
  const molto = l.find(r => r.errore || r.p95 > SOGLIE_VERI.molto) || null
  const ok = l.filter(misurata)
  let pendenza = null, pavimento = null
  if (ok.length > 1) {
    const [a, b] = [ok[0], ok[ok.length - 1]]
    pendenza = t1d((b.p95 - a.p95) / (b.quanti - a.quanti))
    pavimento = t1d(a.p95 - pendenza * a.quanti)
  }
  return { regge: i === -1 ? l[l.length - 1] : i > 0 ? l[i - 1] : null, oltre: i === -1 ? null : l[i], molto, tutte: i === -1, pendenza, pavimento }
}

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
  if (r.tipo === 'ingresso') return rigaIngresso(r)
  if (r.salta) return `-- ${r.nome}: saltata (la prima di questa serie era oltre 400 ms)`
  if (r.vero) return rigaFps(r)
  if (r.tot != null) return `${segnoVero(r.max)}${r.nome}: ${r.tot} ms in tutto, attesa ${r.attesa}, lavoro ${r.lavoro}, fotogramma max ${r.max}${r.fatte < r.n ? `, ${r.n - r.fatte} vuote` : ''}`
  const c = corretta(r)
  const piu = [c !== r ? `≈${c.ms}` : '', r.primo > Math.max(50, 2 * r.ms) ? `primo ${Math.round(r.primo)}` : '', r.nuovi ? `+${r.nuovi}sh` : '',
               r.pronto > 1500 ? `pronto ${(r.pronto / 1000).toFixed(1)}s` : '', r.stabile === false ? 'instabile' : '', r.nascosta ? 'NASCOSTA' : ''].filter(Boolean).join(' ')
  const parti = r.agg != null ? `: gioco ${r.agg} disegno ${r.dis ?? '?'}` : ''
  return `${/^(scala|leve)-/.test(r.id) ? '·  ' : segnoVero(r.p95)}${r.nome}: ${r.ms}/${r.p95} ms (js ${r.js ?? '?'}${parti} gpu ${r.gpu ?? '?'}) ${r.fps}fps ${r.ch ?? '?'}ch ${kt(r.tri)}kt${piu ? ' ' + piu : ''}`
}

const confrontabile = r => (misurata(r) || (r.tot != null && !r.errore && !r.salta)) && r.tipo !== 'ingresso'

/** La riga sotto una scena della verifica: com'è contro l'ultima misura vera (ms tolto il calore); null se la scena non ha il riferimento. */
export function rigaRispetto(r) {
  const c = confrontabile(r) ? confronta(r) : null
  if (!c) return null
  const testa = `   rispetto all'ultima misura vera (${RIFERIMENTO.quando}): `
  if (c.tot) return `${testa}${dif(c.tot)} in tutto, fotogramma più lungo ${dif(c.max)}`
  const parola = { meglio: 'meglio', peggio: 'peggio', uguale: 'come prima' }
  const parte = (n, v) => (v ? `${n} ${v.d < 0 ? '−' : '+'}${Math.abs(v.d)}` : '')
  return `${testa}${dif(c.ms)}, ${parola[c.ms.g]}; p95 ${c.p95.d < 0 ? '−' : '+'}${Math.abs(c.p95.d)}, ${[parte('js', c.js), parte('gpu', c.gpu)].filter(Boolean).join(' ')}`
}

// dove va il JS dello scontro con 3 mostri (o della cima di una scala): il giro del gioco, il disegno di three e il resto, misurato sugli stessi fotogrammi (veri.js)
function letturaJs(ris) {
  const j = [ris.find(r => r.id === 'sot-3'), ...ris.filter(r => /^scala-(sopra-)?\d+$/.test(r.id)).reverse()].find(r => misurata(r) && r.agg != null && r.js != null)
  if (!j) return []
  return [`Dove va il JS (${j.nome}): ${j.js} ms, di cui il giro del gioco ${j.agg}, il disegno di three ${j.dis ?? '?'}` +
    (j.resto != null ? `, il resto ${j.resto} (fra un fotogramma e l'altro)` : '') + '.']
}

// la LETTURA della verifica: cosa è migliorato e cosa no (JS e GPU a parte), e lo scontro contro i 33 ms
function letturaRispetto(ris) {
  const conf = ris.filter(confrontabile).map(r => ({ r, c: confronta(r) })).filter(x => x.c && x.c.js)
  if (!conf.length) return []
  const righe = []
  const elenco = (k, g) => conf.filter(x => x.c[k] && x.c[k].g === g).map(x => `${x.r.nome} ${x.c[k].d < 0 ? '−' : '+'}${Math.abs(x.c[k].d)} ms`)
  const dire = l => (l.length ? l.join(', ') : 'nessuna scena')
  const fermi = k => conf.filter(x => x.c[k] && x.c[k].g === 'uguale').length
  righe.push(`MIGLIORATO rispetto all'ultima misura vera (${RIFERIMENTO.quando}, ${conf.length} scene confrontate) — JS: ${dire(elenco('js', 'meglio'))}; GPU: ${dire(elenco('gpu', 'meglio'))}.`)
  righe.push(`NON MIGLIORATO — JS: ${dire(elenco('js', 'peggio'))}${fermi('js') ? `, come prima in ${fermi('js')}` : ''}; GPU: ${dire(elenco('gpu', 'peggio'))}${fermi('gpu') ? `, come prima in ${fermi('gpu')}` : ''}.`)
  const tot = conf.reduce((n, x) => n + x.c.ms.d, 0)
  righe.push(`In tutto le scene confrontate: ${tot < 0 ? '−' : '+'}${Math.abs(t1d(tot))} ms (somma delle differenze del lavoro per fotogramma).`)
  const zz = ris.filter(confrontabile).map(r => ({ r, c: confronta(r) })).find(x => x.c && x.c.tot)
  if (zz) righe.push(`Zaino (${zz.r.n} anteprime): ${dif(zz.c.tot)} in tutto, fotogramma più lungo ${dif(zz.c.max)}.`)
  const A = ris.find(r => r.id === 'sot-1' && misurata(r))
  // lavoro in fila (si aspetta la GPU a ogni fotogramma): non è il fotogramma, che lo dicono gli fps veri
  if (A) righe.push(`Scontro nelle discese (1 mostro, effetti), lavoro in fila: p95 ${A.p95} ms (telefono poi scheda; quanti fotogrammi arrivano lo dicono gli FPS VERI).`)
  return righe
}

/** Cosa dice la serie, coi ms tolto il calore. */
export function letturaVeri(dati) {
  const crudi = dati.risultati || [], ris = crudi.map(corretta), righe = [], T = SOGLIE_VERI.scatti
  const m = id => { const r = ris.find(x => x.id === id); return misurata(r) ? r : null }
  const d = (a, b) => t1d(a.ms - b.ms)
  const derive = crudi.some(r => r.deriva) ? crudi.filter(misurata).map(r => r.deriva ?? 1) : []
  righe.push(...letturaFps(crudi, dati.fascia))
  if (dati.verifica) righe.push(...letturaRispetto(ris))
  if (dati.verifica) righe.push(...letturaJs(ris))
  righe.push(...letturaScala(ris))
  if (derive.length) righe.push(`Calore: il riferimento di ogni gruppo da x${Math.min(...derive)} a x${Math.max(...derive)} del più fresco` +
    (Math.max(...derive) > 1.15 ? `; la lettura usa i ms divisi per quella deriva (le righe: ≈).` : ': stabile.'))
  if (dati.js != null) righe.push(`CPU: ${dati.js} ms (computer 110-160): ${dati.js <= CPU.veloce ? 'veloce' : dati.js <= CPU.lenta ? 'media' : 'lenta, il JS dei giochi pesa'}.`)
  const a = (dati.ambiente || {}).prima || {}, z = (dati.ambiente || {}).dopo || {}
  if (a.batteria && !a.batteria.carica && a.batteria.livello < 30) righe.push(`Batteria al ${a.batteria.livello}% e non in carica: il telefono può essere in risparmio energetico (CPU a metà).`)
  if (a.batteria && z.batteria && a.batteria.livello - z.batteria.livello >= 5) righe.push(`La prova ha consumato il ${a.batteria.livello - z.batteria.livello}% di batteria.`)
  // il pavimento: un fotogramma che non disegna niente, e 100 oggetti semplici
  const vu = m('vuoto'), cu = m('cubi')
  if (vu) righe.push(`Pavimento: schermo vuoto ${vu.ms} ms (js ${vu.js}, gpu ${vu.gpu})` + (cu ? `, 100 cubi semplici ${cu.ms} ms (~${t1d((cu.ms - vu.ms) / 10)} ms ogni 10 chiamate)` : '') + '.')
  for (const [s, [nome, molti, uno]] of Object.entries(SERIE)) {
    const l = limite(ris, s)
    if (!l) continue
    const u = n => `${n} ${n === 1 ? uno : molti}`, di = r => (r.errore ? 'non regge' : `p95 ${r.p95}`)
    const pend = l.pendenza != null ? `; ogni ${uno} in più ${segnato(l.pendenza)} ms al p95, con zero ~${l.pavimento} ms` : ''
    righe.push(`${nome}: LIMITE ` + (l.tutte ? `oltre la prova, regge anche ${u(l.regge.quanti)} (p95 ${l.regge.p95} ms)`
      : (l.regge ? `${u(l.regge.quanti)} sotto 33 ms (p95 ${l.regge.p95}); oltre da ${l.oltre.quanti} (${di(l.oltre)})` : `già ${u(l.oltre.quanti)} oltre 33 ms (${di(l.oltre)})`) +
        (l.molto ? `, oltre 66 da ${l.molto.quanti} (${di(l.molto)})` : ', mai oltre 66')) + pend + '.')
  }
  righe.push(...letturaIngresso(crudi))
  righe.push(...letturaElementi(ris))
  // la scomposizione: la scena intera e una cosa tolta alla volta; ordinate per quanto si guadagna
  const ab = m('ab-base')
  if (ab) {
    const via = Object.keys(TOLTO).map(id => [id, m(id)]).filter(([, r]) => r).map(([id, r]) => [TOLTO[id], t1d(ab.ms - r.ms)]).sort((x, y) => y[1] - x[1])
    if (via.length) righe.push(`TOGLIERE (1 mostro con effetti: ${ab.ms} ms, js ${ab.js} gpu ${ab.gpu}): ${via.map(([n, g]) => `${n} ${segnato(-g)}`).join(', ')} ms.`)
  }
  // i tre colli: triangoli (stesse chiamate), chiamate (stessi triangoli), pixel e luci
  const t1 = m('tri-1'), costi = []
  const tk = [2, 4, 8].map(k => m(`tri-${k}`)).filter(Boolean)
  if (t1 && tk.length) {
    const u = tk[tk.length - 1], fino = [t1, ...tk].filter(r => r.p95 <= T).pop()
    const poco = u.ms - t1.ms <= Math.max(4, 0.25 * t1.ms)
    righe.push(`Triangoli (stesse chiamate): x1 ${t1.ms} ms (${kt(t1.tri)}k), x${u.quanti} ${u.ms} ms (${kt(u.tri)}k). ` +
      (poco ? `Costano poco: c'è margine per ~${u.quanti}x di dettaglio.` : fino ? `Pesano: sotto ${T} ms al p95 si arriva a x${fino.quanti}.`
        : `Pesano: x${u.quanti} costa ${segnato(d(u, t1))} ms (${segnato(Math.round(100 * (u.ms - t1.ms) / Math.max(0.1, t1.ms)))}%).`))
    if (m('tri-2')) costi.push(['triangoli', d(m('tri-2'), t1)])
  }
  const ck = [2, 4].map(k => m(`ch-${k}`)).filter(Boolean)
  if (t1 && ck.length) {
    const u = ck[ck.length - 1], per = u.ch > t1.ch ? t1d(100 * (u.ms - t1.ms) / (u.ch - t1.ch)) : '?'
    righe.push(`Chiamate (stessi triangoli): x1 ${t1.ch} ${t1.ms} ms, x${u.quanti} ${u.ch} ${u.ms} ms: ~${segnato(per)} ms ogni 100 chiamate.`)
    if (m('ch-2')) costi.push(['chiamate', d(m('ch-2'), t1)])
  }
  const px = ris.filter(r => r.serie === 'pixel' && misurata(r))
  if (px.length > 1) {
    const [p1, pn] = [px[0], px[px.length - 1]], per = pn.mpx > p1.mpx ? t1d((pn.ms - p1.ms) / (pn.mpx - p1.mpx)) : '?'
    righe.push(`Pixel: ${px.map(r => `dpr ${r.quanti} ${r.ms} ms (gpu ${r.gpu})`).join(', ')}: ~${per} ms ogni milione di pixel.`)
    const p2 = m('px-1.41'), q1 = m('px-1')
    if (q1 && p2) costi.push(['pixel', d(p2, q1)])
  }
  const lu = ris.filter(r => r.serie === 'luci' && misurata(r))
  if (lu.length > 1) {
    let salto = null
    for (let i = 1; i < lu.length; i++) if (!salto || lu[i].ms - lu[i - 1].ms > salto[2]) salto = [lu[i - 1].quanti, lu[i].quanti, t1d(lu[i].ms - lu[i - 1].ms)]
    righe.push(`Luci: ${lu.map(r => `${r.quanti} ${r.ms}`).join(', ')} ms; il salto più grande da ${salto[0]} a ${salto[1]} fuochi (${segnato(salto[2])} ms).`)
    const l6 = m('luci-6'), l12 = m('luci-12')
    if (l6 && l12) costi.push(['luci', d(l12, l6)])
  }
  const om = [6, 12, 1].map(n => [m(`luci-${n}`), m(`luci-${n}s`)]).find(([x, y]) => x && y)
  if (om) righe.push(`L'ombra del cono costa ~${segnato(d(om[0], om[1]))} ms (con ${om[0].quanti} fuochi).`)
  const sn = m('senza-nebbia')
  if (sn && t1) righe.push(`La nebbia costa ~${segnato(d(t1, sn))} ms.`)
  if (costi.length > 1) {
    const [chi, quanto] = costi.slice().sort((x, y) => y[1] - x[1])[0]
    const altri = costi.filter(c => c[0] !== chi).map(c => `${c[0]} ${segnato(c[1])}`).join(', ')
    // sotto il rumore (un millisecondo, o il 5% della scena) non c'è un collo fra quelli provati
    righe.push(quanto > Math.max(1, 0.05 * (t1 ? t1.ms : 0)) ? `COLLO DI BOTTIGLIA: ${chi} (a raddoppiarli ${segnato(quanto)} ms; ${altri}).`
      : `COLLO DI BOTTIGLIA: nessuno fra quelli provati (a raddoppiarli: ${chi} ${segnato(quanto)}, ${altri} ms): il tempo sta altrove.`)
  }
  // la CPU o la GPU: di tutte le scene misurate, quanto del lavoro è attesa della scheda
  const conGpu = ris.filter(r => misurata(r) && !r.el && !r.vero && r.gpu != null && r.js != null)
  if (conGpu.length) {
    const g = conGpu.reduce((n, r) => n + r.gpu, 0), j = conGpu.reduce((n, r) => n + r.js, 0)
    const quota = Math.round(100 * g / Math.max(0.1, g + j))
    righe.push(`CPU o GPU: la GPU tiene il ${quota}% del lavoro (js ${t1d(j / conGpu.length)} ms, gpu ${t1d(g / conGpu.length)} ms in media)` +
      (quota >= 60 ? ' = il collo è la scheda (pixel, luci, ombre).' : quota <= 40 ? ' = il collo è il JS (e le chiamate).' : '.'))
  }
  const roba = ris.filter(r => r.serie === 'roba' && misurata(r))
  if (roba.length > 1) {
    const o = roba.slice().sort((x, y) => y.ms - x.ms), [su, giu] = [o[0], o[o.length - 1]]
    righe.push(`Roba: la più cara ${su.nome} (${su.ms} ms, ${su.ch} ch), la più leggera ${giu.nome} (${giu.ms} ms)${su.ms > 1.5 * giu.ms && su.ms - giu.ms > 3 ? ' = pesa' : ': nessuna pesa più delle altre'}.`)
  }
  for (const zz of ris.filter(r => r.tot != null && !r.errore)) {
    righe.push(`Zaino: ${zz.n} anteprime in ${zz.tot} ms (${Math.round(zz.tot / Math.max(1, zz.n))} l'una), fotogramma più lungo ${zz.max} ms${zz.max > 100 ? ' = si vede lo scatto' : ''}.`)
  }
  const fn = m('fat-natale'), f30 = m('fat-30')
  if (fn && f30) righe.push(`La festa (Natale) costa ${d(fn, f30)} ms in più di 30 edifici (p95 ${fn.p95}).`)
  const c1 = crudi.find(r => r.id === 'cal-1'), c2 = crudi.find(r => r.id === 'cal-2')
  if (misurata(c1) && misurata(c2)) {
    const k = c2.ms / Math.max(0.1, c1.ms)
    righe.push(`Lo scontro con 8 mostri: ${c1.ms} ms all'inizio, ${c2.ms} alla fine (x${k.toFixed(2)})` +
      (k > 1.15 ? ' = il telefono si è scaldato e rallenta.' : k < 0.87 ? ': all\'inizio stava ancora caricando.' : ': stabile.'))
  }
  const primi = ris.filter(r => misurata(r) && r.primo > 100).sort((x, y) => y.primo - x.primo).slice(0, 3)
  const sh = ris.reduce((n, r) => n + (r.nuovi || 0), 0), prog = Math.max(0, ...Object.values(dati.gruppi || {}).map(g => g.programmi || 0))
  const parallelo = !((dati.info || {}).mancanti || []).includes('KHR_parallel_shader_compile')
  if (primi.length || sh) righe.push(`Prima apparizione: ${primi.map(r => `${r.nome} ${Math.round(r.primo)} ms`).join(', ') || 'nessuna sopra 100 ms'}; ${sh} shader nuovi, ` +
    `fino a ${prog} programmi in un gruppo` + (parallelo ? '.' : '; senza KHR_parallel_shader_compile si compilano bloccando: vanno precompilati (renderer.compileAsync) a una schermata di caricamento.'))
  const pesante = ris.filter(r => misurata(r) && !r.el && !r.vero && !/^(scala|leve)-/.test(r.id) && r.p95 != null).sort((x, y) => y.p95 - x.p95)[0]
  if (pesante) righe.push(`Chi pesa di più: ${pesante.nome} (p95 ${pesante.p95} ms, ${pesante.ch} chiamate, ${kt(pesante.tri)}k triangoli).`)
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
    `MISURA COI MODELLI VERI ${data(quando)}${versione ? ' v' + versione : ''}${dati.verifica ? ' (verifica compatta)' : ''}${dati.aMeta ? ` (A METÀ: ${dati.aMeta[0]} scene di ${dati.aMeta[1]}, la prova non è finita)` : dati.fermata ? ' (INTERROTTA)' : ''}`,
    `${nome || modello(ua)} | schermo ${dati.schermo} dpr ${dati.dpr} | CPU ${cpu ?? '?'} core${memoria ? ', ' + memoria + ' GB' : ''} | fascia ${dati.fascia || '?'}`,
    `batteria ${batteria(a.batteria)} → ${batteria(z.batteria)}${a.rete ? ` | rete ${a.rete.tipo}${a.rete.risparmio ? ', risparmio dati' : ''}` : ''} | risparmio energetico: il browser non lo dice`,
    `GPU ${i.gpu || '?'} | ${i.fornitore || '?'} | ${i.versione || ''}`,
    `tex ${i.maxTex} | uniform v/f ${i.uniVert}/${i.uniFrag} | varying ${i.varying} | highp v/f ${p.vsAlta}/${p.fsAlta} mediump f ${p.fsMedia}${(i.mancanti || []).length ? ' | mancano ' + i.mancanti.join(' ') : ''}`,
  ]
  const corpo = []
  let gr = '', vista = new Set()
  // chi pesa (docs/core/vecchio-telefono-elementi.md): niente righe per scena, la sua tabella in fondo
  for (const r of (dati.risultati || []).filter(x => !x.el)) {
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
    const rv = dati.verifica ? rigaRispetto(corretta(r)) : null
    if (rv) corpo.push(rv)
  }
  const crudi = dati.risultati || [], el = tabellaElementi(crudi.map(corretta), crudi)
  if (el.length) corpo.push(...(corpo.length ? [''] : []), 'CHI PESA (elemento: da solo / tolto dalla scena intera, ms tolto il calore)', ...el)
  const avvisi = (dati.avvisi || []).slice(0, 6).map(x => `- ${x.n}x ${x.m}`)
  const dd = { v: 2, k: 'veri', ...(dati.verifica ? { vf: RIFERIMENTO.versione } : {}), i: { g: i.gpu, v: i.fornitore, t: i.maxTex, u: [i.uniVert, i.uniFrag], p: [p.vsAlta, p.fsAlta, p.fsMedia], m: i.mancanti || [] },
    s: dati.schermo, d: dati.dpr, f: dati.fascia, js: dati.js, b: a.batteria ? [a.batteria.livello, a.batteria.carica ? 1 : 0, z.batteria ? z.batteria.livello : null] : null,
    c: Object.fromEntries(Object.entries(dati.gruppi || {}).map(([k, g]) => [k, (g.carica || []).reduce((x, y) => x + y, 0)])),
    x: { p: (dati.contesto || {}).persi || 0, r: (dati.contesto || {}).ripresi || 0, a: (dati.avvisi || []).length },
    // [id, ms, p95, fps, chiamate, ktriangoli, primo, shader nuovi, js, gpu, deriva]: le prime otto come prima (lo strumento legge la seconda)
    r: (dati.risultati || []).map(r => r.errore ? [r.id, 'err'] : r.salta ? [r.id, 'salta'] : r.tipo === 'ingresso' ? [r.id, 'ing', r.max, r.lenti, r.att, r.sh, r.p1, r.p3]
      : r.tot != null ? [r.id, r.tot, r.max, r.lavoro, r.attesa]
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
