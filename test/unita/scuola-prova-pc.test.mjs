/* La prova del computer della classe (docs/scuola/prova-computer.md): i giochi provati e i loro esercizi, quando si prova la
   soluzione B e quando si tiene, il verdetto per la maestra e il resoconto da mandare. Puro.
   `node test/esegui.mjs scuola-prova-pc`
   tempo: 1 */
import { GIOCHI_PROVA, verdetto, frasi, resoconto, nomeScheda, sistema, provaB, tieniB, SOGLIA_B } from '../../src/scuola/bambini/prova-pc.js'
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

/* ── la soluzione B ── */
controlla(`sotto ${SOGLIA_B} fps si prova B, sopra no, e mai se non parte`, provaB({ fps: 22 }) && !provaB({ fps: 55 }) && !provaB({ errore: 'x' }) && !provaB(null))
controlla('B si tiene se dà almeno 5 fps in più', tieniB({ fps: 22 }, { fps: 41 }) && !tieniB({ fps: 22 }, { fps: 25 }) && !tieniB({ fps: 22 }, { errore: 'x' }))

/* ── il verdetto ── */
uguale('la scheda senza il giro di ANGLE', nomeScheda(INTEL), 'Intel(R) UHD Graphics 600')
uguale('una scheda detta così com\'è', nomeScheda('Mali-G52'), 'Mali-G52')
const m = fps => ({ fps, sotto30: fps < 30 ? 60 : 0, fermi: 0 })
const dati = {
  info: { webgl2: true, gpu: INTEL }, js: 420,
  giochi: [
    { id: 'inglese', a: m(60), b: null },
    { id: 'asteroidi', a: m(35), b: m(52) },
    { id: 'sotterraneo', a: m(18), b: m(20) },
    { id: 'pozioni', a: { errore: 'il gioco non parte' }, b: null },
  ],
}
const v = verdetto(dati)
uguale('la scheda video fa il 3D', v.scheda, 'video')
const di = id => v.giochi.find(g => g.id === id)
stessaLista('per gioco l\'esito con la grafica che terrà',
            ['inglese', 'asteroidi', 'sotterraneo', 'pozioni', 'robot'].map(id => `${id}:${di(id).esito}:${di(id).b}`),
            ['inglese:liscio:null', 'asteroidi:liscio:tenuta', 'sotterraneo:scatti:inutile', 'pozioni:non-parte:null', 'robot:non-misurato:null'])
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
          /^Asteroidi: 35 fps → B: 52 fps, tenuta$/m.test(r) && /^Robot: non misurato$/m.test(r), r)
controlla('sta in un invio solo del modulo', r.length <= 3400)

riassunto('la prova del computer della classe')
