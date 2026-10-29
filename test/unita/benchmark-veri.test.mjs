/* La misura coi modelli veri (docs/core/vecchio-telefono-veri.md): le scene degli fps veri, il log con le righe e la LETTURA, la riga
   DATI che si rilegge, un log lungo spezzato in invii che stanno nel campo del modulo, le note prima dei DATI. Senza browser. */
import { componiVeri, letturaVeri, spezza, conNote, LIMITE_CAMPO } from '../../src/grafica/benchmark/log-veri.js'
import { TAPPE_FPS, stima } from '../../src/grafica/benchmark/veri.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const s = (id, gruppo, ms, p95, extra = {}) => ({ id, gruppo, nome: id, ms, p95, js: Math.round(ms * 0.3), gpu: Math.round(ms * 0.7), fps: Math.round(Math.min(60, 1000 / p95)), n: 200, ch: 250, tri: 70000, primo: ms * 3, nuovi: 2, pronto: 900, stabile: true, ...extra })
const fpsV = (id, nome, fps, extra = {}) => s(id, 'fps', 10, 17, { nome, vero: true, fps, dt95: 17, sotto30: 0, fermi: 0, js: 10, gpu: 0, ...extra })
const info = { gpu: 'Adreno (TM) 512', fornitore: 'Qualcomm', versione: 'WebGL 2.0', maxTex: 4096, uniVert: 256, uniFrag: 221, varying: 16,
               precisione: { vsAlta: 23, fsAlta: 23, fsMedia: 10 }, mancanti: ['KHR_parallel_shader_compile'] }
const comune = { tipo: 'veri', js: 435, schermo: '392x774', dpr: 2.75, fascia: 'bassa', fermata: false, info,
  ambiente: { prima: { batteria: { livello: 64, carica: true }, rete: { tipo: '4g', risparmio: false } }, dopo: { batteria: { livello: 58, carica: true } } },
  contesto: { persi: 1, ripresi: 0 }, avvisi: [{ m: 'warn: mostri 3D: troll non si salda', n: 3 }] }
const meta = { versione: 'x', ua: 'Mozilla/5.0 (Linux; Android 10; Redmi Note 7) AppleWebKit', cpu: 8, quando: new Date(2026, 9, 29, 11, 40) }

// gli fps veri
const df = { ...comune, gruppi: { fps: { carica: [3400], dpr: [1], luci: { p: 4, s: 1, d: 0, h: 1, ombre: 0 }, programmi: 54 } },
  risultati: [fpsV('fps-piano', 'camminare in un piano del sotterraneo', 55, { sotto30: 2, fermi: 2 }), fpsV('fps-villaggio', 'camminare nel villaggio di sopra', 17, { sotto30: 99 }),
    fpsV('fps-prato', 'scontro sul prato, 3 mostri', 42, { sotto30: 12 }), { id: 'fps-fat-10', gruppo: 'fps', nome: 'fattoria 3D del livello 10', errore: 'il motore non parte' }] }
const tf = componiVeri(df, meta), lf = letturaVeri(df).join('\n')
controlla('la testa dice la prova, il modello, la GPU, la fascia e la precisione', /\(fps veri\)/.test(tf.split('\n')[0]) && /Redmi Note 7/.test(tf) && /Adreno/.test(tf) && /fascia bassa/.test(tf) && /mediump f 10/.test(tf))
controlla('le estensioni che mancano, la batteria e la rete', /mancano KHR_parallel_shader_compile/.test(tf) && /batteria 64% in carica → 58% in carica \| rete 4g/.test(tf))
controlla('il gruppo ha la testa con le luci e i programmi', /\[fps\] codice 3400 ms, dpr 1, luci 4p 1s 0d 1h ombre 0, prog 54\n/.test(tf), tf)
controlla('la riga degli fps veri', /ok camminare in un piano del sotterraneo: 55 fps \(sotto i 30 il 2% dei fotogrammi, p95 17 ms, 2 fermi oltre 100 ms\)/.test(tf) && /XX camminare nel villaggio di sopra: 17 fps/.test(tf), tf)
controlla('una scena guasta non regge', /XX fattoria 3D del livello 10: non regge \(il motore non parte\)/.test(tf) && /Non reggono: fattoria 3D del livello 10/.test(lf))
controlla('LETTURA: gli fps veri con la fascia', /FPS VERI \(fascia bassa, il gioco com'è\): camminare in un piano del sotterraneo 55 fps \(liscio, sotto i 30 il 2%\); camminare nel villaggio di sopra 17 fps \(a scatti, sotto i 30 il 99%\); scontro sul prato, 3 mostri 42 fps \(si gioca, a tratti scatta/.test(lf), lf)
controlla('la CPU, il contesto perso, le uniform, la precompilazione', /CPU: 435 ms \(computer 110-160\): media/.test(lf) && /contesto WebGL si è perso 1 volte/.test(lf) && /Poche uniform nel frammento \(221\)/.test(lf) && /compileAsync/.test(lf), lf)
controlla('gli avvisi della console', /AVVISI\n- 3x warn: mostri 3D: troll/.test(tf))

const aMeta = { ...df, fermata: true, aMeta: [2, 9], risultati: df.risultati.slice(0, 2) }
controlla('una prova a metà lo dice in testa', /\(A METÀ: 2 scene di 9, la prova non è finita\)/.test(componiVeri(aMeta, {}).split('\n')[0]))

// la riga DATI
const dd = JSON.parse(tf.split('DATI ')[1])
uguale('la riga DATI: versione 4, coi modelli veri', `${dd.v} ${dd.k}`, '4 veri')
uguale('la riga DATI ha tutte le scene', dd.r.length, df.risultati.length)
controlla('le righe DATI: ms in seconda colonna (lo strumento legge quella), sotto i 30 e fermi in coda', JSON.stringify(dd.r.find(r => r[0] === 'fps-piano').slice(8)) === '[10,2,2]', JSON.stringify(dd.r.find(r => r[0] === 'fps-piano')))
uguale('una scena guasta nei DATI', JSON.stringify(JSON.parse(tf.split('DATI ')[1]).r.find(r => r[0] === 'fps-fat-10')), '["fps-fat-10","err"]')

// spezza e note
const lungo = conNote(tf + '\n' + 'riga di prova '.repeat(30).split('prova').join('prova\n'), 'la nebbia è a strisce\ncolori giusti')
controlla('le note stanno prima dei DATI', /NOTE\n- la nebbia è a strisce\n- colori giusti\n\nDATI /.test(lungo))
const parti = spezza(lungo + '\n' + 'x'.repeat(80).concat('\n').repeat(60), LIMITE_CAMPO)
controlla('un log lungo va in più invii', parti.length >= 2, String(parti.length))
controlla('ogni invio sta nel campo', parti.every(p => p.length <= LIMITE_CAMPO), parti.map(p => p.length).join(','))
controlla('ogni invio dice parte k/n', parti.every((p, k) => p.split('\n')[0].endsWith(`(parte ${k + 1}/${parti.length})`)))
controlla('la riga DATI resta intera', parti.some(p => p.split('\n').some(r => r.startsWith('DATI {') && r.endsWith('}'))))
uguale('un log corto è un invio solo', spezza('corto').length, 1)

// le scene
const idF = TAPPE_FPS.flatMap(t => t.scene.map(x => x.id))
controlla('gli fps veri: 9 scene tutte diverse, un gruppo solo, senza aspettare la GPU, la fattoria col degrado', idF.length === 9 && new Set(idF).size === 9 &&
  TAPPE_FPS.every(t => t.gruppo === 'fps' && t.tempi === 'fps') && ['fps-piano', 'fps-sot-3', 'fps-sot-6', 'fps-villaggio', 'fps-prato', 'fps-fat-10', 'fps-fat-30', 'fps-ast', 'fps-ast-boom'].every(i => idF.includes(i)) &&
  TAPPE_FPS.filter(t => t.opz && t.opz.degrado).length === 2, idF.join(','))
const sf = stima()
controlla('la stima del foglio: 9 scene sui 3 minuti', sf.scene === 9 && sf.minuti === 3, JSON.stringify(sf))

riassunto('la misura coi modelli veri')
