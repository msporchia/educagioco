// La prova del computer della classe (docs/scuola/prova-computer.md): ogni gioco vero della scuola si gioca per qualche secondo,
// con una regia che fa quello che farebbe un bambino nel momento più pieno (prova-pc-giro.js); si contano le immagini al secondo,
// le pause lunghe e quanto ci mette lo schermo a rispondere a un tocco. Sotto SOGLIA_B si rifà con meno pixel (pixel.js) e, se va
// meglio, il PC se lo ricorda. Qui l'elenco, il verdetto per la maestra e il resoconto da mandare, puri.
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
export const TEMPI = { rodaggio: 1000, misura: 5000 }        // ms: si scarta l'avvio, poi si conta mentre la regia gioca
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

/** Il sistema e il browser in breve dallo user agent: «ChromeOS, Chrome 120», «Windows 10/11, Firefox 128» (Edge e Opera dicono anche Chrome). */
export function sistema(ua = '') {
  const so = /CrOS/.test(ua) ? 'ChromeOS' : /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows NT 6\.1/.test(ua) ? 'Windows 7'
    : /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '?'
  const b = [['Edge', /Edg\/(\d+)/], ['Opera', /OPR\/(\d+)/], ['Firefox', /Firefox\/(\d+)/], ['Chrome', /Chrome\/(\d+)/], ['Safari', /Version\/(\d+).*Safari/]]
    .map(([nome, re]) => [nome, re.exec(ua)]).find(([, m]) => m)
  return `${so}${b ? `, ${b[0]} ${b[1][1]}` : ''}`
}

export const esitoFps = f => (f >= 50 ? 'liscio' : f >= 30 ? 'tratti' : 'scatti')
// la risposta a un tocco (la mediana, in ms): sotto un decimo di secondo non si sente, oltre un terzo sì
export const esitoRisposta = r => (!r ? 'liscio' : r.mediana <= 150 ? 'liscio' : r.mediana <= 350 ? 'tratti' : 'scatti')
const ORDINE = ['liscio', 'tratti', 'scatti']
const peggio = (a, b) => ORDINE[Math.max(ORDINE.indexOf(a), ORDINE.indexOf(b))]
/** L'esito di una misura: il peggio fra le immagini al secondo e la risposta ai tocchi. */
export const esitoDi = m => peggio(esitoFps(m.fps), esitoRisposta(m.risposta))
/** Dopo la misura normale: si prova B? (`soglia` per le prove) */
export const provaB = (a, soglia = SOGLIA_B) => !!a && !a.errore && a.fps < soglia
/** B si tiene se va davvero meglio. */
export const tieniB = (a, b) => !!a && !!b && !b.errore && !a.errore && b.fps >= a.fps + MEGLIO

/**
 * Cosa dice la prova. `dati`: { info: { webgl2, gpu }, js, giochi: [{ id, a, b }] } con a e b { fps, sotto30, fermi, risposta, partito }
 * o { errore } (b solo se si è provata la grafica sgranata). `scheda`: `video`, `processore` (il 3D lo fa il processore: va a scatti),
 * `manca` (niente WebGL 2). Per gioco l'esito, con la grafica che terrà.
 */
export function verdetto(dati) {
  const i = (dati && dati.info) || {}
  const scheda = !i.webgl2 ? 'manca' : SOFTWARE.test(i.gpu || '') ? 'processore' : 'video'
  const fatti = new Map(((dati && dati.giochi) || []).map(g => [g.id, g]))
  const giochi = GIOCHI_PROVA.map(({ id, nome, tred }) => {
    const g = fatti.get(id)
    const vuoto = { id, nome, fps: null, b: null }
    if (!g || !g.a) return { ...vuoto, esito: tred && scheda === 'manca' ? 'non-parte' : 'non-misurato' }
    if (g.a.errore) return { ...vuoto, esito: 'non-parte', perche: g.a.errore }
    const conB = tieniB(g.a, g.b), m = conB ? g.b : g.a
    return { id, nome, esito: esitoDi(m), fps: m.fps, b: g.b ? (conB ? 'tenuta' : 'inutile') : null,
             ...(esitoRisposta(m.risposta) !== 'liscio' ? { perche: `risponde ai tocchi in ${m.risposta.mediana} ms` } : {}) }
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

const virgola = n => String(n).replace('.', ',')
const misura = m => (!m ? '-' : m.errore ? `non parte (${String(m.errore).slice(0, 70)})`
  : `${m.fps} fps${m.sotto30 ? `, sotto i 30 il ${m.sotto30}%` : ''}${m.fermi ? `, ${m.fermi} fermi` : ''}` +
    `${m.risposta ? `, tocco ${m.risposta.mediana}/${m.risposta.p95} ms` : ''}${m.partito != null ? `, partito in ${virgola(m.partito)} s` : ''}`)

/** Il resoconto da mandare: corto, in un invio solo del modulo (il campo regge ~3400 caratteri). */
export function resoconto(dati, { versione = '', ua = '', cpu = null, memoria = null, schermo = '', finestra = '', dpr = 1, dove = '', da = '',
                                  caricata = null, rete = '', quando = new Date() } = {}) {
  const v = verdetto(dati), fatti = new Map(((dati && dati.giochi) || []).map(g => [g.id, g]))
  const righe = [
    `PROVA DEL COMPUTER DELLA SCUOLA ${data(quando)}${versione ? ' v' + versione : ''}${dati && dati.fermata ? ' (FERMATA A METÀ)' : ''}`,
    ...(String(dove).trim() ? [`Quale: ${String(dove).trim().slice(0, 200)}`] : []),
    `${sistema(ua)} | ${cpu ?? '?'} core${memoria ? `, ${memoria} GB` : ''} | schermo ${schermo}${finestra ? `, finestra ${finestra}` : ''} dpr ${dpr} | processore ${v.js ?? '?'} ms (${v.cpu ?? '?'})`,
    `Scheda: ${v.simile ? 'simile a ' : ''}${v.gpu} (${{ video: 'scheda video', processore: 'DISEGNA IL PROCESSORE', manca: 'NIENTE WEBGL 2' }[v.scheda]})`,
    ...(dati?.info?.gpu && dati.info.gpu !== v.gpu ? [`GPU intera: ${String(dati.info.gpu).slice(0, 220)}`] : []),
    ...(da || caricata != null || rete ? [`Pagina ${da || '?'}${caricata != null ? `, caricata in ${String(caricata).replace('.', ',')} s` : ''}${rete ? ` | rete ${rete}` : ''}`] : []),
    ...(dati?.nascosta ? [`ATTENZIONE: durante la prova la pagina è stata nascosta ${dati.nascosta} ${dati.nascosta === 1 ? 'volta' : 'volte'} (i numeri valgono meno)`] : []),
    ...v.giochi.map(g => {
      const f = fatti.get(g.id)
      if (!f || !f.a) return `${g.nome}: non misurato`
      return `${g.nome}: ${misura(f.a)}${f.b ? ` → B ${misura(f.b)}` : ''}${g.b ? ` (B ${g.b})` : ''}`
    }),
  ]
  return righe.join('\n').slice(0, 3400)
}
