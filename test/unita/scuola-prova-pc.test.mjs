/* La prova del computer della classe (docs/scuola/prova-computer.md): i giochi provati e i loro esercizi, quando si prova la
   soluzione B e quando si tiene, il verdetto per la maestra e il resoconto da mandare. Puro.
   `node test/esegui.mjs scuola-prova-pc`
   tempo: 1 */
import { GIOCHI_PROVA, verdetto, frasi, resoconto, nomeScheda, sistema, provaB, tieniB, SOGLIA_B, esitoDi } from '../../src/scuola/bambini/prova-pc.js'
import { GIOCHI_CON_REGIA } from '../../src/scuola/bambini/prova-pc-giro.js'
import { SCHEDE } from '../../src/scuola/giochi/elenco.js'
import { VISTE } from '../../src/scuola/giochi/viste.js'
import { valido, giocoDi } from '../../src/scuola/comune/esercizi.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const INTEL = 'ANGLE (Intel, Intel(R) UHD Graphics 600 (0x00003185) Direct3D11 vs_5_0 ps_5_0, D3D11)'

/* ── i giochi: tutti quelli della scuola, ognuno col suo esercizio ── */
stessaLista('si provano tutti i giochi della scuola', GIOCHI_PROVA.map(g => g.id).sort(), SCHEDE.map(s => s.id).sort())
stessaLista('e hanno tutti una vista', GIOCHI_PROVA.map(g => g.id).filter(id => !VISTE[id]), [])
for (const g of GIOCHI_PROVA) {
  controlla(`${g.nome}: l'esercizio è valido e si fa in quel gioco`, valido(g.esercizio) && giocoDi(g.esercizio) === g.id, JSON.stringify(g.esercizio))
  uguale(`${g.nome}: in 3D come dice la sua scheda`, !!g.tred, !!SCHEDE.find(s => s.id === g.id).tred)
}

stessaLista('ogni gioco ha la sua regia: si misura giocato, non aperto', GIOCHI_PROVA.map(g => g.id).filter(id => !GIOCHI_CON_REGIA.includes(id)), [])

/* ── la soluzione B ── */
controlla(`sotto ${SOGLIA_B} fps si prova B, sopra no, e mai se non parte`, provaB({ fps: 22 }) && !provaB({ fps: 55 }) && !provaB({ errore: 'x' }) && !provaB(null))
controlla('B si tiene se dà almeno 5 fps in più', tieniB({ fps: 22 }, { fps: 41 }) && !tieniB({ fps: 22 }, { fps: 25 }) && !tieniB({ fps: 22 }, { errore: 'x' }))

/* ── il verdetto ── */
uguale('la scheda senza il giro di ANGLE', nomeScheda(INTEL), 'Intel(R) UHD Graphics 600')
uguale('una scheda detta così com\'è', nomeScheda('Mali-G52'), 'Mali-G52')
uguale('Chrome dice solo la famiglia: «or similar» si toglie', nomeScheda('ANGLE (NVIDIA, NVIDIA GeForce GTX 980 Direct3D11 vs_5_0 ps_5_0), or similar'), 'NVIDIA GeForce GTX 980')
controlla('e il verdetto lo sa', verdetto({ info: { webgl2: true, gpu: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 980 Direct3D11 vs_5_0 ps_5_0), or similar' } }).simile)
const m = (fps, risposta = null) => ({ fps, sotto30: fps < 30 ? 60 : 0, fermi: 0, risposta })
const tocco = mediana => ({ mediana, p95: mediana * 2, tocchi: 8 })
const dati = {
  info: { webgl2: true, gpu: INTEL }, js: 420,
  giochi: [
    { id: 'inglese', a: m(60, tocco(40)), b: null },
    { id: 'passo-passo', a: m(60, tocco(420)), b: null },
    { id: 'asteroidi', a: m(35), b: m(52) },
    { id: 'sotterraneo', a: m(18), b: m(20) },
    { id: 'pozioni', a: { errore: 'il gioco non parte' }, b: null },
  ],
}
const v = verdetto(dati)
uguale('la scheda video fa il 3D', v.scheda, 'video')
const di = id => v.giochi.find(g => g.id === id)
stessaLista('per gioco l\'esito, con la grafica che terrà',
            ['inglese', 'asteroidi', 'sotterraneo', 'pozioni', 'robot'].map(id => `${id}:${di(id).esito}:${di(id).b}`),
            ['inglese:liscio:null', 'asteroidi:liscio:tenuta', 'sotterraneo:scatti:inutile', 'pozioni:non-parte:null', 'robot:non-misurato:null'])
uguale('a 60 immagini ma lento a rispondere ai tocchi: a scatti, e dice perché', `${di('passo-passo').esito} · ${di('passo-passo').perche}`,
       'scatti · risponde ai tocchi in 420 ms')
uguale('veloce a rispondere: conta solo le immagini', esitoDi(m(40, tocco(60))), 'tratti')
controlla('la frase dice quale va meglio sgranato', frasi(v).some(f => /^Asteroidi: su questo computer va meglio con la grafica più sgranata/.test(f)))

const sw = verdetto({ info: { webgl2: true, gpu: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)' }, js: 900, giochi: [] })
uguale('SwiftShader: il 3D lo fa il processore', sw.scheda, 'processore')
controlla('e la frase dice come accendere la scheda video', frasi(sw).some(f => /accelerazione grafica/.test(f)))
uguale('llvmpipe è lo stesso', verdetto({ info: { webgl2: true, gpu: 'llvmpipe (LLVM 15.0.7, 256 bits)' } }).scheda, 'processore')
const senza = verdetto({ info: { webgl2: false }, giochi: [] })
stessaLista('niente WebGL 2: i giochi 3D non partono, gli altri non misurati', senza.giochi.filter(g => g.esito === 'non-parte').map(g => g.id),
            GIOCHI_PROVA.filter(g => g.tred).map(g => g.id))

/* ── il resoconto ── */
uguale('il sistema in breve', sistema('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'), 'ChromeOS, Chrome 120')
const r = resoconto(dati, { versione: 'x', ua: 'Windows NT 10.0 Chrome/119.0', cpu: 4, memoria: 4, schermo: '1366x768', dpr: 1, dove: 'aula 3, vicino alla finestra' })
controlla('il resoconto: quale computer, la scheda, una riga per gioco con B', /^Quale: aula 3, vicino alla finestra$/m.test(r) && /^Scheda: Intel\(R\) UHD Graphics 600 \(scheda video\)$/m.test(r) &&
          /^Asteroidi: 35 fps → B 52 fps \(B tenuta\)$/m.test(r) && /^English: 60 fps, tocco 40\/80 ms$/m.test(r) && /^Robot: non misurato$/m.test(r), r)
controlla('sta in un invio solo del modulo', r.length <= 3400)
uguale('Firefox si dice Firefox', sistema('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0'), 'Windows 10/11, Firefox 128')
uguale('ed Edge Edge, anche se dice Chrome', sistema('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0'), 'Windows 10/11, Edge 120')
{
  // quello che serve per capire un PC senza tornare dalla maestra: la finestra, la pagina, la rete, quando è partito ogni gioco,
  // se la pagina è stata nascosta, la GPU intera; e il caso peggiore (tutte le scene con B e un errore lungo) sta in un invio
  const pieno = { info: { webgl2: true, gpu: INTEL }, js: 900, nascosta: 2,
    giochi: GIOCHI_PROVA.map(g => ({ id: g.id, a: { fps: 23, sotto30: 61, fermi: 12, partito: 14.2, risposta: tocco(1234) }, b: { errore: 'x'.repeat(130) } })) }
  const t = resoconto(pieno, { versione: 'abc1234', ua: 'Windows NT 10.0 Firefox/128.0', cpu: 4, memoria: 4, schermo: '1366x768', finestra: '1366x657',
                               dpr: 1, dove: 'x'.repeat(200), da: 'dal sito', caricata: 12.4, rete: '4g, ~3.5 Mbit/s' })
  controlla('il resoconto dice finestra, pagina, rete, partenza, pagina nascosta e GPU intera',
            /finestra 1366x657/.test(t) && /Pagina dal sito, caricata in 12,4 s \| rete 4g/.test(t) && /partito in 14,2 s/.test(t) &&
            /nascosta 2 volte/.test(t) && /^GPU intera: ANGLE/m.test(t), t)
  controlla('anche il caso peggiore sta in un invio solo, intero', t.length <= 3400 && /^Sotterraneo: /m.test(t), t.length)
}

riassunto('la prova del computer della classe')
