/* La misura coi modelli veri (docs/core/vecchio-telefono-veri.md): le due prove (gli fps veri, le due scale), il log con le righe e
   la LETTURA (gli fps veri, la scala gradino per gradino, dove va il JS, il calore), la riga DATI che si rilegge, un log lungo spezzato
   in invii che stanno nel campo del modulo, le note prima dei DATI. Senza browser. */
import { componiVeri, letturaVeri, spezza, conNote, LIMITE_CAMPO } from '../../src/grafica/benchmark/log-veri.js'
import { PROVE, stima } from '../../src/grafica/benchmark/veri.js'
import { SCALE, sceneDellaScala, ELEMENTI_SCALA } from '../../src/grafica/benchmark/veri/scala.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const s = (id, gruppo, ms, p95, extra = {}) => ({ id, gruppo, nome: id, ms, p95, js: Math.round(ms * 0.3), gpu: Math.round(ms * 0.7), fps: Math.round(Math.min(60, 1000 / p95)), n: 200, ch: 250, tri: 70000, primo: ms * 3, nuovi: 2, pronto: 900, stabile: true, ...extra })
const fpsV = (id, nome, fps, extra = {}) => s(id, 'fps', 10, 17, { nome, vero: true, fps, dt95: 17, sotto30: 0, fermi: 0, js: 10, gpu: 0, ...extra })
// la scala delle discese: il fondo 8 ms; le pareti +9, i mostri +7, l'eroe +5; le pareti rifatte +1 (il rumore)
let quota = 8
const scalaRis = [0, 1, 3, 9, 3, 1, 5, 7, 2].map((d, k) => { quota += d; return s(`scala-${k}`, 'scala', quota, quota + 5, k === 8 ? { agg: 9, dis: 15, resto: 6 } : {}) })
const info = { gpu: 'Adreno (TM) 512', fornitore: 'Qualcomm', versione: 'WebGL 2.0', maxTex: 4096, uniVert: 256, uniFrag: 221, varying: 16,
               precisione: { vsAlta: 23, fsAlta: 23, fsMedia: 10 }, mancanti: ['KHR_parallel_shader_compile'] }
const comune = { tipo: 'veri', js: 435, schermo: '392x774', dpr: 2.75, fascia: 'bassa', fermata: false, info,
  ambiente: { prima: { batteria: { livello: 64, carica: true }, rete: { tipo: '4g', risparmio: false } }, dopo: { batteria: { livello: 58, carica: true } } },
  contesto: { persi: 1, ripresi: 0 }, avvisi: [{ m: 'warn: mostri 3D: troll non si salda', n: 3 }] }
const meta = { versione: 'x', ua: 'Mozilla/5.0 (Linux; Android 10; Redmi Note 7) AppleWebKit', cpu: 8, quando: new Date(2026, 9, 29, 11, 40) }

// gli fps veri
const df = { ...comune, prova: 'fps', gruppi: { fps: { carica: [3400], dpr: [1], luci: { p: 4, s: 1, d: 0, h: 1, ombre: 0 }, programmi: 54, rif: { ms: 27.5, deriva: 1 } } },
  risultati: [fpsV('fps-piano', 'camminare in un piano del sotterraneo', 55, { sotto30: 2, fermi: 2 }), fpsV('fps-villaggio', 'camminare nel villaggio di sopra', 17, { sotto30: 99 }),
    fpsV('fps-prato', 'scontro sul prato, 3 mostri', 42, { sotto30: 12 }), { id: 'fps-fat-10', gruppo: 'fps', nome: 'fattoria 3D del livello 10', errore: 'il motore non parte' }] }
const tf = componiVeri(df, meta), lf = letturaVeri(df).join('\n')
controlla('la testa dice la prova, il modello, la GPU, la fascia e la precisione', /\(fps veri\)/.test(tf.split('\n')[0]) && /Redmi Note 7/.test(tf) && /Adreno/.test(tf) && /fascia bassa/.test(tf) && /mediump f 10/.test(tf))
controlla('le estensioni che mancano, la batteria e la rete', /mancano KHR_parallel_shader_compile/.test(tf) && /batteria 64% in carica → 58% in carica \| rete 4g/.test(tf))
controlla('il gruppo ha la testa con le luci, i programmi, il riferimento', /\[fps\] codice 3400 ms, dpr 1, luci 4p 1s 0d 1h ombre 0, prog 54, rif 27.5 ms x1/.test(tf), tf)
controlla('la riga degli fps veri', /ok camminare in un piano del sotterraneo: 55 fps \(sotto i 30 il 2% dei fotogrammi, p95 17 ms, 2 fermi oltre 100 ms\)/.test(tf) && /XX camminare nel villaggio di sopra: 17 fps/.test(tf), tf)
controlla('una scena guasta non regge', /XX fattoria 3D del livello 10: non regge \(il motore non parte\)/.test(tf) && /Non reggono: fattoria 3D del livello 10/.test(lf))
controlla('LETTURA: gli fps veri con la fascia', /FPS VERI \(fascia bassa, il gioco com'è\): camminare in un piano del sotterraneo 55 fps \(liscio, sotto i 30 il 2%\); camminare nel villaggio di sopra 17 fps \(a scatti, sotto i 30 il 99%\); scontro sul prato, 3 mostri 42 fps \(si gioca, a tratti scatta/.test(lf), lf)
controlla('gli fps veri non entrano in «CPU o GPU» (il loro js è solo la CPU)', !/CPU o GPU/.test(lf), lf)
controlla('la CPU, il contesto perso, le uniform, la precompilazione', /CPU: 435 ms \(computer 110-160\): media/.test(lf) && /contesto WebGL si è perso 1 volte/.test(lf) && /Poche uniform nel frammento \(221\)/.test(lf) && /compileAsync/.test(lf), lf)
controlla('gli avvisi della console', /AVVISI\n- 3x warn: mostri 3D: troll/.test(tf))

// dove pesa: le due scale
const ds = { ...comune, prova: 'scale', gruppi: {},
  risultati: [...scalaRis, s('scala-ancora', 'scala', 22, 27), s('scala-sopra-0', 'scala-sopra', 10, 14), s('scala-sopra-1', 'scala-sopra', 13, 18),
    s('scala-sopra-2', 'scala-sopra', 25, 30, { deriva: 1.3 })] }
const ts = componiVeri(ds, meta), ls = letturaVeri(ds).join('\n')
controlla('la testa dice «dove pesa»', /\(dove pesa\)/.test(ts.split('\n')[0]))
controlla('le righe della scala senza ok/XX (lavoro in fila), col JS diviso', /\n·  scala-3: 21\/26 ms/.test(ts) && /\n·  scala-8: 39\/44 ms \(js 12: gioco 9 disegno 15 gpu 27\)/.test(ts), ts)
controlla('una scena scaldata ha il valore corretto', /scala-sopra-2: 25\/30 ms .* ≈19\.2/.test(ts), ts.split('\n').find(r => /scala-sopra-2/.test(r)))
controlla('LETTURA: la scala gradino per gradino, col salto', /SCALA \(lo scontro con 3 mostri/.test(ls) && /  0 niente disegnato \(il giro del gioco\): 8 ms/.test(ls) && /  3 \+ pareti: 21 ms \(p95 26, js 6, gpu 15, 250 ch\) → \+9 ms \(js \+2, gpu \+7\)/.test(ls), ls)
controlla('LETTURA: il rumore e i gradini più cari', /Rumore: il gradino 3 rifatto in fondo 22 ms contro 21 \(\+1\): un gradino che si sposta meno di così è rumore\./.test(ls) && /I gradini più cari: pareti \+9 ms \(GPU\), mostri \+7 ms \(GPU\), eroe \+5 ms \(GPU\)/.test(ls), ls)
controlla('LETTURA: la scala di sopra fin dove è misurata', /SCALA \(il villaggio di sopra con 4 persone e 3 mostri/.test(ls) && /  3 \+ terreno: non misurato; la scala si ferma qui/.test(ls), ls)
controlla('LETTURA: dove va il JS in cima alla scala', /Dove va il JS \(lo scontro, scala-8\): 12 ms, di cui il giro del gioco 9, il disegno di three 15, il resto 6/.test(ls), ls)
controlla('LETTURA: il calore e la CPU o la GPU', /Calore: il riferimento di ogni gruppo da x1 a x1\.3 del più fresco; la lettura usa i ms divisi/.test(ls) && /CPU o GPU: la GPU tiene il \d+% del lavoro/.test(ls), ls)
const aMeta = { ...ds, fermata: true, aMeta: [7, 21], risultati: [...scalaRis.slice(0, 6), { id: 'scala-6', gruppo: 'scala', nome: 'scala-6', errore: 'tempo scaduto (la scena oltre 15 s)' }] }
const la = letturaVeri(aMeta).join('\n')
controlla('una scala a metà: i gradini fatti restano, quello che non regge la chiude', /  5 \+ rilievo, torcia, fuochi, lampi, nebbia: 25 ms/.test(la) && /  6 \+ eroe: non regge \(tempo scaduto[^\n]*la scala si ferma qui/.test(la) && !/  7 /.test(la), la)
controlla('una prova a metà lo dice in testa', /\(A METÀ: 7 scene di 21, la prova non è finita\)/.test(componiVeri(aMeta, {}).split('\n')[0]))

// la riga DATI
const dd = JSON.parse(ts.split('DATI ')[1])
uguale('la riga DATI: versione 3, coi modelli veri, la prova', `${dd.v} ${dd.k} ${dd.p}`, '3 veri scale')
uguale('la riga DATI ha tutte le scene', dd.r.length, ds.risultati.length)
controlla('le righe DATI: ms in seconda colonna (lo strumento legge quella), js gpu deriva gioco disegno in coda', dd.r.find(r => r[0] === 'scala-3')[1] === 21 &&
  JSON.stringify(dd.r.find(r => r[0] === 'scala-8').slice(8)) === '[12,27,1,9,15]', JSON.stringify(dd.r.find(r => r[0] === 'scala-8')))
uguale('una scena guasta nei DATI', JSON.stringify(JSON.parse(tf.split('DATI ')[1]).r.find(r => r[0] === 'fps-fat-10')), '["fps-fat-10","err"]')

// spezza e note
const lungo = conNote(ts + '\n' + 'riga di prova '.repeat(30).split('prova').join('prova\n'), 'la nebbia è a strisce\ncolori giusti')
controlla('le note stanno prima dei DATI', /NOTE\n- la nebbia è a strisce\n- colori giusti\n\nDATI /.test(lungo))
const parti = spezza(lungo + '\n' + 'x'.repeat(80).concat('\n').repeat(60), LIMITE_CAMPO)
controlla('un log lungo va in più invii', parti.length >= 2, String(parti.length))
controlla('ogni invio sta nel campo', parti.every(p => p.length <= LIMITE_CAMPO), parti.map(p => p.length).join(','))
controlla('ogni invio dice parte k/n', parti.every((p, k) => p.split('\n')[0].endsWith(`(parte ${k + 1}/${parti.length})`)))
controlla('la riga DATI resta intera', parti.some(p => p.split('\n').some(r => r.startsWith('DATI {') && r.endsWith('}'))))
uguale('un log corto è un invio solo', spezza('corto').length, 1)

// le due prove
const idDi = p => PROVE[p].flatMap(t => t.scene.map(x => x.id))
const idF = idDi('fps'), idS = idDi('scale')
controlla('gli fps veri: 7 scene tutte diverse, un gruppo solo, senza aspettare la GPU, la fattoria col degrado', idF.length === 7 && new Set(idF).size === 7 &&
  PROVE.fps.every(t => t.gruppo === 'fps' && t.tempi === 'fps') && ['fps-piano', 'fps-sot-3', 'fps-sot-6', 'fps-villaggio', 'fps-prato', 'fps-fat-10', 'fps-fat-30'].every(i => idF.includes(i)) &&
  PROVE.fps.filter(t => t.opz && t.opz.degrado).length === 2, idF.join(','))
controlla('dove pesa: le due scale intere, ogni scena una volta', idS.length === SCALE.sot.gradini.length + SCALE.sopra.gradini.length + 2 && new Set(idS).size === idS.length && idS[0] === 'scala-0' && idS[idS.length - 1] === 'scala-sopra-ancora', idS.join(','))
const sf = stima('fps'), ss = stima('scale')
controlla('le stime del foglio: 7 scene sui 3 minuti, 21 sui 4', sf.scene === 7 && sf.minuti === 3 && ss.scene === 21 && ss.minuti === 4, JSON.stringify([sf, ss]))
// le due scale: ogni gradino sopra quello di prima, in fondo il gradino del rumore rifatto, in cima tutti gli elementi della scena e solo quelli
const inSalita = gr => gr[0].accesi.length === 0 && gr.every((x, k) => !k || (gr[k - 1].accesi.every(a => x.accesi.includes(a)) && x.accesi.length > gr[k - 1].accesi.length))
for (const [k, rumore] of [['sot', 'pareteVicina'], ['sopra', 'terreno']]) {
  const S = SCALE[k], sc = sceneDellaScala(k), gr = sc.slice(0, S.gradini.length), cima = gr[gr.length - 1].accesi
  controlla(`la scala ${k}: da niente acceso, ogni gradino sopra quello di prima`, inSalita(gr))
  controlla(`la scala ${k}: in fondo il gradino del rumore rifatto`, sc.length === S.gradini.length + 1 && sc[S.gradini.length].id === `${S.id}-ancora` && sc[S.gradini.length].accesi.join() === gr[S.rumore].accesi.join() && gr[S.rumore].accesi.includes(rumore))
  controlla(`la scala ${k}: l'ultimo gradino accende tutti gli elementi della scena, e solo quelli`, cima.length === ELEMENTI_SCALA[k].length && ELEMENTI_SCALA[k].every(a => cima.includes(a)), cima.join())
}

riassunto('la misura coi modelli veri')
