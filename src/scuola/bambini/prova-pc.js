// La prova del computer della classe (docs/scuola/prova-computer.md): ogni gioco vero della scuola gira ~15 secondi con un pilota
// che lo fa muovere, si contano le immagini al secondo; sotto SOGLIA_B si rifà con meno pixel (pixel.js) e, se va meglio, il PC se
// lo ricorda. Qui l'elenco, il verdetto per la maestra e il resoconto da mandare, puri.
import { CPU, data } from '../../grafica/benchmark/log-veri.js'

// in ordine dal più leggero: un PC che si pianta col 3D ha già detto il resto. Gli esercizi sono quelli delle prove della scuola;
// `tela: false` per chi non disegna su una tela (si conta appena è montato)
export const GIOCHI_PROVA = [
  { id: 'inglese', nome: 'English', tela: false, esercizio: { tipo: 'inglese', isola: 'prima', tappe: ['prima-colori'] } },
  { id: 'passo-passo', nome: 'Passo passo', esercizio: { tipo: 'passo', protagonista: 'coniglio', gradini: ['passi'] } },
  { id: 'robot', nome: 'Robot', esercizio: { tipo: 'robot', capitoli: ['cantiere'] } },
  { id: 'castello', nome: 'Il castello', esercizio: { tipo: 'castello', tappa: 'bosco/Il sentiero' } },
  { id: 'castle-battle', nome: 'Castle Battle', esercizio: { tipo: 'battaglia', tappa: 'ponte', difficolta: 'facile' } },
  { id: 'survivors', nome: 'Survivors', esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto', gioco: 'survivors' } },
  { id: 'asteroidi', nome: 'Asteroidi', tred: true, esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto', gioco: 'asteroidi' } },
  { id: 'pozioni', nome: 'Pozioni', tred: true, esercizio: { tipo: 'pozioni', famiglie: ['massa'], gradini: ['banco', 'grande', 'grandi'] } },
  { id: 'cucina', nome: 'Cucina', tred: true, esercizio: { tipo: 'cucina', da: 1, a: 6 } },
  { id: 'sotterraneo', nome: 'Sotterraneo', tred: true, esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto', gioco: 'sotterraneo' } },
]
export const TEMPI = { rodaggio: 3000, misura: 12000 }       // ms: si scarta l'avvio, poi si conta
export const SOGLIA_B = 40                                   // sotto, si prova la soluzione B
const MEGLIO = 5                                             // B si tiene se dà almeno tanti fps in più

// il 3D disegnato dal processore invece che dalla scheda video: SwiftShader (Chrome), llvmpipe (Linux), il driver base di Windows
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i

/** Il nome della scheda video, senza il giro di ANGLE: «ANGLE (Intel, Intel(R) UHD Graphics 600 (0x3185) Direct3D11 …)» → «Intel(R) UHD Graphics 600». */
export function nomeScheda(gpu) {
  const s = String(gpu || '').trim()
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

/**
 * Cosa dice la prova. `dati`: { info: { webgl2, gpu }, js, giochi: [{ id, a: misura, b: misura|null }] } con misura { fps, sotto30, fermi }
 * o { errore }. `scheda`: `video`, `processore` (il 3D lo fa il processore: va a scatti), `manca` (niente WebGL 2). Per gioco l'esito
 * con la grafica che terrà (B se è tenuta).
 */
export function verdetto(dati) {
  const i = (dati && dati.info) || {}
  const scheda = !i.webgl2 ? 'manca' : SOFTWARE.test(i.gpu || '') ? 'processore' : 'video'
  const fatti = new Map(((dati && dati.giochi) || []).map(g => [g.id, g]))
  const giochi = GIOCHI_PROVA.map(({ id, nome, tred }) => {
    const g = fatti.get(id)
    if (!g || !g.a) return { id, nome, esito: tred && scheda === 'manca' ? 'non-parte' : 'non-misurato', fps: null, b: null }
    if (g.a.errore) return { id, nome, esito: 'non-parte', fps: null, b: null }
    const conB = tieniB(g.a, g.b), m = conB ? g.b : g.a
    return { id, nome, esito: esitoFps(m.fps), fps: m.fps, b: g.b ? (conB ? 'tenuta' : 'inutile') : null }
  })
  const js = dati && dati.js != null ? dati.js : null
  const cpu = js == null ? null : js <= CPU.veloce ? 'veloce' : js <= CPU.lenta ? 'media' : 'lenta'
  return { scheda, gpu: nomeScheda(i.gpu), giochi, cpu, js }
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
    `Scheda: ${v.gpu} (${{ video: 'scheda video', processore: 'DISEGNA IL PROCESSORE', manca: 'NIENTE WEBGL 2' }[v.scheda]})`,
    ...v.giochi.map(g => {
      const f = fatti.get(g.id)
      return `${g.nome}: ${f ? misura(f.a) : 'non misurato'}${f && f.b ? ` → B: ${misura(f.b)}, ${g.b}` : ''}`
    }),
  ]
  return righe.join('\n').slice(0, 3400)
}
