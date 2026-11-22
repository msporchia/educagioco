// La prova del computer della classe (docs/scuola/prova-computer.md): ogni gioco vero della scuola gira ~15 secondi con un pilota
// che lo fa muovere, si contano le immagini al secondo; sotto SOGLIA_B si rifà con meno pixel (pixel.js) e, se va meglio, il PC se
// lo ricorda. Qui l'elenco, il verdetto per la maestra e il resoconto da mandare, puri.
import { CPU, data } from '../../grafica/benchmark/log-veri.js'

// in ordine dal più leggero: un PC che si pianta col 3D ha già detto il resto. Gli esercizi sono quelli delle prove della scuola;
// `tela: false` per chi non disegna su una tela (si conta appena è montato). `massimo`: la scena al massimo, oltre a quella base:
// `gioco` è il gioco stesso portato al suo peggio da `window.__estremo` (che registra lui), `veri` una scena della misura di casa
// (grafica/benchmark/veri/: l'esplosione al secondo, lo scontro con sei mostri leggendari)
const asteroidiVeri = () => import('../../grafica/benchmark/veri/asteroidi.js')
const disceseVeri = () => import('../../grafica/benchmark/veri/discese.js')
export const GIOCHI_PROVA = [
  { id: 'inglese', nome: 'English', tela: false, esercizio: { tipo: 'inglese', isola: 'prima', tappe: ['prima-colori'] } },
  { id: 'passo-passo', nome: 'Passo passo', esercizio: { tipo: 'passo', protagonista: 'coniglio', gradini: ['passi'] } },
  { id: 'robot', nome: 'Robot', esercizio: { tipo: 'robot', capitoli: ['cantiere'] } },
  { id: 'castello', nome: 'Il castello', massimo: 'gioco', esercizio: { tipo: 'castello', tappa: 'bosco/Il sentiero' } },
  { id: 'castle-battle', nome: 'Castle Battle', massimo: 'gioco', esercizio: { tipo: 'battaglia', tappa: 'ponte', difficolta: 'facile' } },
  { id: 'survivors', nome: 'Survivors', massimo: 'gioco', esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto', gioco: 'survivors' } },
  { id: 'asteroidi', nome: 'Asteroidi', tred: true, esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto', gioco: 'asteroidi' },
    massimo: 'veri', veri: { carica: asteroidiVeri, scena: { id: 'fps-ast-boom', nome: 'asteroidi, un\'esplosione al secondo', boom: true } } },
  { id: 'pozioni', nome: 'Pozioni', tred: true, esercizio: { tipo: 'pozioni', famiglie: ['massa'], gradini: ['banco', 'grande', 'grandi'] } },
  { id: 'cucina', nome: 'Cucina', tred: true, esercizio: { tipo: 'cucina', da: 1, a: 6 } },
  { id: 'sotterraneo', nome: 'Sotterraneo', tred: true, esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto', gioco: 'sotterraneo' },
    massimo: 'veri', veri: { carica: disceseVeri, scena: { id: 'fps-sot-6', nome: 'scontro nel sotterraneo, 6 mostri', mostri: 6, colpi: true } } },
]
/** Le scene di un gioco: quella base e, se c'è, quella al massimo. */
export const sceneDi = g => (g.massimo ? ['base', 'massimo'] : ['base'])
export const TEMPI = { rodaggio: 2500, misura: 10000 }       // ms: si scarta l'avvio, poi si conta
export const SOGLIA_B = 40                                   // sotto, si prova la soluzione B
const MEGLIO = 5                                             // B si tiene se dà almeno tanti fps in più

// il 3D disegnato dal processore invece che dalla scheda video: SwiftShader (Chrome), llvmpipe (Linux), il driver base di Windows
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i

/** Il nome della scheda video, senza il giro di ANGLE: «ANGLE (Intel, Intel(R) UHD Graphics 600 (0x3185) Direct3D11 …)» → «Intel(R) UHD Graphics 600». */
export function nomeScheda(gpu) {
  const s = String(gpu || '').trim().replace(/,?\s*or similar$/i, '')
  const m = /^ANGLE \((.*)\)$/.exec(s)
  if (!m) return s || '?'
  const parti = m[1].split(/,\s*/)
  return (parti[1] || parti[0]).replace(/\s*\(0x[0-9a-f]+\)/i, '').replace(/\s+(Direct3D|OpenGL|Vulkan|Metal).*$/i, '').trim()
}

/** Il sistema in breve dallo user agent: «ChromeOS, Chrome 120». */
export function sistema(ua = '') {
  const so = /CrOS/.test(ua) ? 'ChromeOS' : /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows NT 6\.1/.test(ua) ? 'Windows 7'
    : /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '?'
  const c = /Chrome\/(\d+)/.exec(ua)
  return `${so}${c ? `, Chrome ${c[1]}` : ''}`
}

export const esitoFps = f => (f >= 50 ? 'liscio' : f >= 30 ? 'tratti' : 'scatti')
/** Dopo la misura normale: si prova B? (`soglia` per le prove) */
export const provaB = (a, soglia = SOGLIA_B) => !!a && !a.errore && a.fps < soglia
/** B si tiene se va davvero meglio. */
export const tieniB = (a, b) => !!a && !!b && !b.errore && !a.errore && b.fps >= a.fps + MEGLIO

const fpsCon = (s, conB) => (conB && s.b && !s.b.errore ? s.b : s.a)

/**
 * Cosa dice la prova. `dati`: { info: { webgl2, gpu }, js, giochi: [{ id, scene: [{ tipo: 'base'|'massimo', a, b }] }] } con a e b
 * { fps, sotto30, fermi } o { errore } (b solo se si è provata la grafica sgranata). `scheda`: `video`, `processore` (il 3D lo fa il
 * processore: va a scatti), `manca` (niente WebGL 2). B si decide sulla scena peggiore e vale per tutto il gioco; per gioco l'esito
 * della scena base e di quella al massimo, con la grafica che terrà.
 */
export function verdetto(dati) {
  const i = (dati && dati.info) || {}
  const scheda = !i.webgl2 ? 'manca' : SOFTWARE.test(i.gpu || '') ? 'processore' : 'video'
  const fatti = new Map(((dati && dati.giochi) || []).map(g => [g.id, g]))
  const giochi = GIOCHI_PROVA.map(({ id, nome, tred }) => {
    const g = fatti.get(id), scene = (g && g.scene) || []
    const vuoto = { id, nome, fps: null, b: null, massimo: null }
    if (!scene.length || !scene[0].a) return { ...vuoto, esito: tred && scheda === 'manca' ? 'non-parte' : 'non-misurato' }
    const rotta = scene.find(s => s.a && s.a.errore)
    if (rotta) return { ...vuoto, esito: 'non-parte', perche: `${rotta.tipo === 'massimo' ? 'al massimo: ' : ''}${rotta.a.errore}` }
    const misurate = scene.filter(s => s.a)
    const peggiore = misurate.reduce((x, y) => (y.a.fps < x.a.fps ? y : x))
    const conB = tieniB(peggiore.a, peggiore.b)
    const base = fpsCon(misurate[0], conB), mx = misurate.find(s => s.tipo === 'massimo')
    return { id, nome, esito: esitoFps(base.fps), fps: base.fps, b: peggiore.b ? (conB ? 'tenuta' : 'inutile') : null,
             massimo: mx ? esitoFps(fpsCon(mx, conB).fps) : null }
  })
  const js = dati && dati.js != null ? dati.js : null
  const cpu = js == null ? null : js <= CPU.veloce ? 'veloce' : js <= CPU.lenta ? 'media' : 'lenta'
  // Chrome non dice più il modello vero: risponde con una famiglia, «…, or similar» (il modello è solo indicativo)
  return { scheda, gpu: nomeScheda(i.gpu), simile: /or similar/i.test(i.gpu || ''), giochi, cpu, js }
}

export const FRASE_ESITO = {
  liscio: 'va liscio',
  tratti: 'si gioca, ogni tanto scatta',
  scatti: 'va a scatti: meglio un altro gioco',
  'non-parte': 'non parte',
  'non-misurato': 'non misurato',
}

/** Le frasi per la maestra sotto i giochi. */
export function frasi(v) {
  const r = []
  if (v.scheda === 'manca') r.push('Questo computer non ha la grafica 3D (WebGL 2): Asteroidi, sotterraneo, pozioni e cucina non partono.')
  if (v.scheda === 'processore') r.push('Chrome disegna il 3D col processore invece che con la scheda video, e i giochi 3D vanno a scatti. ' +
    'Si può provare ad accendere in Chrome: Impostazioni → Sistema → «Usa l\'accelerazione grafica quando disponibile», e rifare la prova.')
  const b = v.giochi.filter(g => g.b === 'tenuta').map(g => g.nome)
  if (b.length) r.push(`${b.join(', ')}: su questo computer ${b.length > 1 ? 'vanno' : 'va'} meglio con la grafica più sgranata, e da ora ${b.length > 1 ? 'partono' : 'parte'} così da ${b.length > 1 ? 'soli' : 'solo'}.`)
  return r
}

const misura = m => (!m ? '-' : m.errore ? `non parte (${m.errore})` : `${m.fps} fps${m.sotto30 ? `, sotto i 30 il ${m.sotto30}%` : ''}${m.fermi ? `, ${m.fermi} fermi` : ''}`)

/** Il resoconto da mandare: corto, in un invio solo del modulo (il campo regge ~3400 caratteri). */
export function resoconto(dati, { versione = '', ua = '', cpu = null, memoria = null, schermo = '', dpr = 1, dove = '', quando = new Date() } = {}) {
  const v = verdetto(dati), fatti = new Map(((dati && dati.giochi) || []).map(g => [g.id, g]))
  const righe = [
    `PROVA DEL COMPUTER DELLA SCUOLA ${data(quando)}${versione ? ' v' + versione : ''}${dati && dati.fermata ? ' (FERMATA A METÀ)' : ''}`,
    ...(String(dove).trim() ? [`Quale: ${String(dove).trim().slice(0, 200)}`] : []),
    `${sistema(ua)} | ${cpu ?? '?'} core${memoria ? `, ${memoria} GB` : ''} | schermo ${schermo} dpr ${dpr} | processore ${v.js ?? '?'} ms (${v.cpu ?? '?'})`,
    `Scheda: ${v.simile ? 'simile a ' : ''}${v.gpu} (${{ video: 'scheda video', processore: 'DISEGNA IL PROCESSORE', manca: 'NIENTE WEBGL 2' }[v.scheda]})`,
    ...v.giochi.map(g => {
      const f = fatti.get(g.id)
      if (!f || !(f.scene || []).length) return `${g.nome}: non misurato`
      const scene = f.scene.map(x => `${x.tipo === 'massimo' ? 'al massimo ' : ''}${misura(x.a)}${x.b ? ` → B ${misura(x.b)}` : ''}`)
      return `${g.nome}: ${scene.join(' | ')}${g.b ? ` (B ${g.b})` : ''}`
    }),
  ]
  return righe.join('\n').slice(0, 3400)
}
