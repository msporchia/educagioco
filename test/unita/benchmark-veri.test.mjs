/* La misura coi modelli veri (docs/core/vecchio-telefono-veri.md): il log si compone con le righe, la LETTURA nomina il limite di
   ogni serie e il collo di bottiglia, la riga DATI si rilegge, un log lungo si spezza in invii che stanno nel campo del modulo, le
   note finiscono prima dei DATI. E le leve sulla scena vera: triangoli × k con la stessa forma, chiamate × k con gli stessi triangoli. */
import { BoxGeometry, Mesh, MeshStandardMaterial, Scene, Box3, SkinnedMesh, Skeleton, Bone, Uint16BufferAttribute, Float32BufferAttribute } from 'three'
import { componiVeri, letturaVeri, limite, spezza, conNote, LIMITE_CAMPO } from '../../src/grafica/benchmark/log-veri.js'
import { dividi, leve } from '../../src/grafica/benchmark/veri/moltiplica.js'
import { TAPPE, QUANTE, TAPPE_VERIFICA, stimaVerifica } from '../../src/grafica/benchmark/veri.js'
import { SCALE, sceneDellaScala } from '../../src/grafica/benchmark/veri/scala.js'
import { SCENE_ELEMENTI } from '../../src/grafica/benchmark/veri/elementi-dati.js'
import { RIFERIMENTO, confronta, dellaScena } from '../../src/grafica/benchmark/veri/riferimento.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const s = (id, gruppo, ms, p95, extra = {}) => ({ id, gruppo, nome: id, ms, p95, js: Math.round(ms * 0.3), gpu: Math.round(ms * 0.7), fps: Math.round(Math.min(60, 1000 / p95)), n: 200, ch: 250, tri: 70000, primo: ms * 3, nuovi: 2, pronto: 900, stabile: true, ...extra })
const serie = (serie, quanti) => ({ serie, quanti })
const dati = {
  tipo: 'veri', js: 520, schermo: '393x851', dpr: 2.75, fascia: 'bassa', fermata: false,
  info: { gpu: 'Adreno (TM) 512', fornitore: 'Qualcomm', versione: 'WebGL 2.0', maxTex: 16384, uniVert: 256, uniFrag: 221, varying: 16,
          precisione: { vsAlta: 23, fsAlta: 23, fsMedia: 10 }, mancanti: ['EXT_float_blend'] },
  gruppi: { discese: { carica: [2300], dpr: [1], luci: { p: 3, s: 1, d: 0, h: 1, ombre: 1 }, programmi: 57, rif: { ms: 30, deriva: 1 } } },
  ambiente: { prima: { batteria: { livello: 64, carica: true }, rete: { tipo: '4g', risparmio: false } }, dopo: { batteria: { livello: 58, carica: true } } },
  contesto: { persi: 1, ripresi: 0 },
  avvisi: [{ m: 'warn: mostri 3D: troll non si salda', n: 3 }],
  risultati: [
    s('vuoto', 'pavimento', 8, 10), s('cubi', 'pavimento', 18, 22),
    s('ab-base', 'togli', 60, 80), s('ab-ombra', 'togli', 52, 70), s('ab-basic', 'togli', 30, 40), s('ab-dpr', 'togli', 40, 50),
    s('cal-1', 'calore', 20, 26),
    s('sot-1', 'discese', 12, 16, serie('discese', 1)), s('sot-3', 'discese', 20, 28, serie('discese', 3)),
    s('sot-6', 'discese', 31, 44, serie('discese', 6)), { id: 'sot-8', gruppo: 'discese', nome: 'sot-8', salta: true, ...serie('discese', 8) },
    s('tri-1', 'discese', 15, 19, { ...serie('triangoli', 1), tri: 70000 }), s('tri-2', 'discese', 15.5, 20, { ...serie('triangoli', 2), tri: 140000 }),
    s('tri-4', 'discese', 16.5, 21, { ...serie('triangoli', 4), tri: 280000 }), s('tri-8', 'discese', 18, 24, { ...serie('triangoli', 8), tri: 560000 }),
    s('ch-2', 'discese', 21, 26, { ...serie('chiamate', 2), ch: 500 }), s('ch-4', 'discese', 33, 40, { ...serie('chiamate', 4), ch: 1000 }),
    s('luci-1', 'luci', 12, 15, serie('luci', 1)), s('luci-6', 'luci', 15, 19, serie('luci', 6)), s('luci-12', 'luci', 25, 30, serie('luci', 12)),
    s('luci-6s', 'luci', 11, 14, serie('luci-senza-ombra', 6)),
    s('px-1', 'pixel', 15, 19, { ...serie('pixel', 1), mpx: 0.33 }), s('px-1.41', 'pixel', 22, 27, { ...serie('pixel', 1.41), mpx: 0.66 }),
    s('senza-nebbia', 'pixel', 10, 13),
    s('per-4', 'sopra', 14, 18, serie('persone', 4)), s('per-8', 'sopra', 18, 24, serie('persone', 8)), s('per-16', 'sopra', 27, 36, serie('persone', 16)),
    s('mos-4', 'sopra', 48, 59, serie('mostri-sopra', 4)), s('mos-8', 'sopra', 78, 93, serie('mostri-sopra', 8)),
    { id: 'zaino-40', gruppo: 'zaino', nome: '40 anteprime', tot: 3100, attesa: 1700, lavoro: 2900, max: 140, fatte: 40, n: 40 },
    s('roba-lame', 'roba', 9, 12, { serie: 'roba' }), s('roba-vesti', 'roba', 19, 24, { serie: 'roba' }),
    { id: 'fat-10', gruppo: 'fattoria', nome: 'fat-10', errore: 'il motore non parte', ...serie('fattoria', 10) },
    s('fat-30', 'fattoria', 66, 88, { ...serie('fattoria', 30), deriva: 1.6 }),
    s('cal-2', 'calore', 25, 31),
  ],
}
const testo = componiVeri(dati, { versione: 'x', ua: 'Mozilla/5.0 (Linux; Android 10; Redmi Note 7) AppleWebKit', cpu: 8, quando: new Date(2026, 9, 22, 11, 40) })
const righe = letturaVeri(dati).join('\n')

controlla('la testa dice modello, GPU, fascia e precisione', /Redmi Note 7/.test(testo) && /Adreno/.test(testo) && /fascia bassa/.test(testo) && /mediump f 10/.test(testo))
controlla('le estensioni che mancano', /mancano EXT_float_blend/.test(testo))
controlla('i gruppi hanno la testa con le luci, i programmi, il riferimento', /\[discese\] codice 2300 ms, dpr 1, luci 3p 1s 0d 1h ombre 1, prog 57, rif 30 ms x1/.test(testo), testo)
controlla('la batteria e la rete in testa', /batteria 64% in carica → 58% in carica \| rete 4g/.test(testo))
controlla('una scena: ms, p95, CPU e GPU, fps, chiamate, triangoli', /~  sot-3: 20\/28 ms \(js 6 gpu 14\) 36fps 250ch 70kt/.test(testo), testo.split('\n').find(r => /sot-3/.test(r)))
controlla('una scena scaldata ha il valore corretto', /fat-30: 66\/88 ms .* ≈41\.3/.test(testo), testo.split('\n').find(r => /fat-30/.test(r)))
controlla('quelle oltre sono XX, saltate e guaste dette', /XX sot-6/.test(testo) && /-- sot-8: saltata/.test(testo) && /XX fat-10: non regge \(il motore non parte\)/.test(testo))
controlla('lo zaino ha i suoi numeri', /40 anteprime: 3100 ms in tutto, attesa 1700, lavoro 2900, fotogramma max 140/.test(testo))
controlla('gli avvisi della console', /AVVISI\n- 3x warn: mostri 3D: troll/.test(testo))

controlla('LIMITE dello scontro: 3 mostri, mai oltre 66', /Scontro nelle discese.*LIMITE 3 mostri sotto 33 ms \(p95 28\); oltre da 6 \(p95 44\), mai oltre 66; ogni mostro in più \+5\.6 ms al p95, con zero ~10\.4 ms/.test(righe), righe)
controlla('LIMITE già oltre alla prima: la pendenza', /Mostri 3D di sopra: LIMITE già 4 mostri oltre 33 ms \(p95 59\), oltre 66 da 8 \(p95 93\); ogni mostro in più \+8\.5 ms al p95, con zero ~25 ms/.test(righe), righe)
controlla('il pavimento', /Pavimento: schermo vuoto 8 ms \(js 2, gpu 6\), 100 cubi semplici 18 ms \(~1 ms ogni 10 chiamate\)/.test(righe), righe)
controlla('la scomposizione, dal guadagno più grande', /TOGLIERE \(1 mostro con effetti: 60 ms, js 18 gpu 42\): materiali → Basic -30, pixel ratio 0,6 -20, ombra -8 ms/.test(righe), righe)
controlla('la CPU o la GPU', /CPU o GPU: la GPU tiene il 70% del lavoro .* = il collo è la scheda/.test(righe), righe)
controlla('i ms corretti dal calore', /Calore: il riferimento di ogni gruppo da x1 a x1\.6 del più fresco; la lettura usa i ms divisi/.test(righe), righe)
controlla('LIMITE delle persone: 8', /Persone 3D di sopra: LIMITE 8 persone sotto 33 ms/.test(righe))
controlla('la fattoria che non parte è oltre già al primo', /Fattoria 3D: LIMITE già 10 edifici oltre 33 ms \(non regge\), oltre 66 da 10/.test(righe), righe)
controlla('i triangoli costano poco', /Triangoli \(stesse chiamate\): x1 15 ms \(70k\), x8 18 ms \(560k\)\. Costano poco: c'è margine per ~8x/.test(righe), righe)
controlla('le chiamate: ms ogni 100', /Chiamate \(stessi triangoli\).*~\+2\.4 ms ogni 100 chiamate/.test(righe), righe)
controlla('i pixel: ms per milione', /Pixel: dpr 1 15 ms \(gpu 11\), dpr 1\.41 22 ms \(gpu 15\): ~21\.2 ms ogni milione/.test(righe), righe)
controlla('le luci: il salto più grande', /Luci: 1 12, 6 15, 12 25 ms; il salto più grande da 6 a 12 fuochi \(\+10 ms\)/.test(righe), righe)
controlla('l\'ombra del cono e la nebbia', /L'ombra del cono costa ~\+4 ms \(con 6 fuochi\)/.test(righe) && /La nebbia costa ~\+5 ms/.test(righe))
controlla('il collo di bottiglia è il più caro a raddoppiare', /COLLO DI BOTTIGLIA: luci \(a raddoppiarli \+10 ms; triangoli \+0\.5, chiamate \+6, pixel \+7\)/.test(righe), righe)
controlla('la roba che pesa', /Roba: la più cara roba-vesti .* = pesa/.test(righe))
controlla('lo zaino si vede scattare', /Zaino: 40 anteprime in 3100 ms .* = si vede lo scatto/.test(righe))
controlla('lo scontro con 8 mostri all\'inizio e alla fine', /Lo scontro con 8 mostri: .*x1\.25\) = il telefono si è scaldato/.test(righe), righe)
controlla('i programmi e la precompilazione', /fino a 57 programmi in un gruppo; senza KHR_parallel_shader_compile .*compileAsync/.test(righe) || !/KHR/.test(JSON.stringify(dati.info.mancanti)), righe)
controlla('il contesto perso e chi non regge', /contesto WebGL si è perso 1 volte/.test(righe) && /Non reggono: fat-10/.test(righe))
controlla('poche uniform nel frammento', /Poche uniform nel frammento \(221\)/.test(righe))

const dd = JSON.parse(testo.split('DATI ')[1])
uguale('la riga DATI: versione 2, coi modelli veri', `${dd.v} ${dd.k}`, '2 veri')
uguale('la riga DATI ha tutte le scene', dd.r.length, dati.risultati.length)
controlla('le righe DATI: ms in seconda colonna (lo strumento legge quella)', dd.r.find(r => r[0] === 'sot-3')[1] === 20 && dd.r.find(r => r[0] === 'sot-8')[1] === 'salta')
controlla('le righe DATI: js, gpu e deriva in coda', JSON.stringify(dd.r.find(r => r[0] === 'fat-30').slice(8)) === '[20,46,1.6]', JSON.stringify(dd.r.find(r => r[0] === 'fat-30')))

// i triangoli che pesano, e nessun collo quando raddoppiare non cambia niente
const pesanti = letturaVeri({ risultati: [s('tri-1', 'd', 100, 120, serie('triangoli', 1)), s('tri-8', 'd', 170, 200, serie('triangoli', 8)),
  s('ch-2', 'd', 100.5, 121, serie('chiamate', 2)), s('tri-2', 'd', 100.2, 120, serie('triangoli', 2))] }).join('\n')
controlla('i triangoli che pesano: quanto costa x8', /Pesano: x8 costa \+70 ms \(\+70%\)/.test(pesanti), pesanti)
controlla('nessun collo sotto il rumore', /COLLO DI BOTTIGLIA: nessuno fra quelli provati/.test(pesanti), pesanti)

// il limite: tutte, nessuna, il guasto conta come oltre
const L = (...p95) => p95.map((p, k) => ({ serie: 'x', quanti: k + 1, p95: p, ms: p }))
controlla('limite: tutte sotto', limite(L(10, 20, 30), 'x').tutte)
uguale('limite: la prima oltre e quella prima', limite(L(10, 40, 50), 'x').regge.quanti, 1)
uguale('limite: già la prima oltre', limite(L(40, 50), 'x').regge, null)
uguale('limite: un guasto è un limite', limite([...L(10), { serie: 'x', quanti: 2, errore: 'no' }], 'x').oltre.quanti, 2)

// spezza e note
const lungo = conNote(testo + '\n' + 'riga di prova '.repeat(30).split('prova').join('prova\n'), 'la nebbia è a strisce\ncolori giusti')
controlla('le note stanno prima dei DATI', /NOTE\n- la nebbia è a strisce\n- colori giusti\n\nDATI /.test(lungo))
const parti = spezza(lungo + '\n' + 'x'.repeat(80).concat('\n').repeat(60), LIMITE_CAMPO)
controlla('un log lungo va in più invii', parti.length >= 2, String(parti.length))
controlla('ogni invio sta nel campo', parti.every(p => p.length <= LIMITE_CAMPO), parti.map(p => p.length).join(','))
controlla('ogni invio dice parte k/n', parti.every((p, k) => p.split('\n')[0].endsWith(`(parte ${k + 1}/${parti.length})`)))
controlla('la riga DATI resta intera', parti.some(p => p.split('\n').some(r => r.startsWith('DATI {') && r.endsWith('}'))))
uguale('un log corto è un invio solo', spezza('corto').length, 1)

// le scene: tutte con un id solo, e le serie in ordine crescente
const ids = TAPPE.flatMap(t => t.scene.map(x => x.id))
uguale('gli id delle scene sono tutti diversi', new Set(ids).size, QUANTE)
controlla('l\'ingresso per primo, il calore all\'inizio e alla fine', ids[0] === 'ing-sot' && ids.includes('cal-1') && ids[ids.length - 1] === 'cal-2')

// le leve: triangoli × k (stessa scatola, normali lunghe 1) e chiamate × k (stessi triangoli)
const box = new BoxGeometry(1, 2, 3)
for (const k of [2, 4, 8]) {
  const g = dividi(box, k)
  uguale(`triangoli x${k}`, g.index.count / 3, (box.index.count / 3) * k)
  g.computeBoundingBox()
  const b = new Box3().setFromBufferAttribute(box.attributes.position)
  controlla(`x${k}: la forma è la stessa`, g.boundingBox.min.distanceTo(b.min) < 1e-6 && g.boundingBox.max.distanceTo(b.max) < 1e-6)
  const n = g.attributes.normal
  controlla(`x${k}: le normali restano lunghe 1`, Array.from({ length: n.count }, (_, i) => Math.hypot(n.getX(i), n.getY(i), n.getZ(i))).every(l => Math.abs(l - 1) < 1e-5))
  uguale(`x${k}: i gruppi si allungano`, g.groups.reduce((a, x) => a + x.count, 0), box.groups.reduce((a, x) => a + x.count, 0) * k)
}
const scena = new Scene(), mat = new MeshStandardMaterial(), m1 = new Mesh(box, mat), m2 = new Mesh(new BoxGeometry(), mat)
scena.add(m1, m2)
const lv = leve(scena)
lv.triangoli(4)
uguale('leve: la mesh ha i triangoli x4', m1.geometry.index.count, box.index.count * 4)
lv.chiamate(3)
controlla('leve: le chiamate x3 tornano ai triangoli di prima', m1.geometry === box && Array.isArray(m1.material) && m1.material.length === 3)
uguale('leve: i gruppi coprono tutti i triangoli', box.groups.reduce((a, x) => a + x.count, 0), box.index.count)
lv.ripristina()
controlla('leve: ripristina rimette materiali e gruppi', m1.material === mat && m2.material === mat && box.groups.length === 6)

// la pelle (salda3d.js): anche le SkinnedMesh si moltiplicano, e un vertice nuovo ha ossa intere (quelle di un capo del lato)
const pelle = new BoxGeometry(1, 1, 1), nv = pelle.attributes.position.count
pelle.setAttribute('skinIndex', new Uint16BufferAttribute(Array.from({ length: nv * 4 }, (_, i) => (i % 4 === 0 ? (Math.floor(i / 4) % 3) : 0)), 4))
pelle.setAttribute('skinWeight', new Float32BufferAttribute(Array.from({ length: nv * 4 }, (_, i) => (i % 4 === 0 ? 1 : 0)), 4))
const g8 = dividi(pelle, 8), si = g8.attributes.skinIndex
controlla('la pelle si divide, con indici d\'osso interi', g8 && g8.index.count === pelle.index.count * 8 && Array.from(si.array).every(x => Number.isInteger(x) && x <= 2))
const ossa = [new Bone(), new Bone(), new Bone()], sk = new SkinnedMesh(pelle, mat); sk.add(ossa[0]); sk.bind(new Skeleton(ossa))
const sp = new Scene(); sp.add(sk)
const lp = leve(sp)
lp.triangoli(2); uguale('leve: la SkinnedMesh ha i triangoli x2', sk.geometry.index.count, pelle.index.count * 2)
lp.chiamate(4); controlla('leve: e le chiamate x4', Array.isArray(sk.material) && sk.material.length === 4)
lp.ripristina()

// la verifica compatta: la scala del mondo di sopra, poi gli fps veri
const idV = TAPPE_VERIFICA.flatMap(t => t.scene.map(x => x.id))
const stima = stimaVerifica()
controlla('la verifica ha 23 scene tutte diverse, senza le serie lunghe', idV.length === 23 && new Set(idV).size === 23 && !idV.some(i => /^(tri|ch|luci|px|roba|fat|cal|sot|v-|ver-)/.test(i)), idV.join(','))
controlla('la verifica: la scala del mondo di sopra, le leve, poi gli fps veri', idV[0] === 'scala-sopra-0' && idV[10] === 'scala-sopra-ancora' && idV.slice(11, 16).every(i => i.startsWith('leve-sopra-')) && idV.slice(16).every(i => i.startsWith('fps-')))
const leveV = TAPPE_VERIFICA.filter(t => t.gruppo === 'leve-sopra')
controlla('le leve: un mondo per scena, la prima con tutte, poi una riaccesa ciascuna', leveV.length === 5 && leveV.every(t => t.scene.length === 1 && t.opz.riaccendi.join() === t.scene[0].riaccendi.join()) && leveV[0].opz.riaccendi.length === 0 && leveV.slice(1).every(t => t.opz.riaccendi.length === 1 && t.scene[0].accesi.join() === leveV[0].scene[0].accesi.join()))
const fps = TAPPE_VERIFICA.filter(t => t.gruppo === 'fps')
controlla('gli fps veri: un gruppo solo, tutti senza aspettare la GPU, discese, mondo di sopra e fattoria col degrado', fps.every(t => t.tempi === 'fps') &&
  ['fps-piano', 'fps-sot-3', 'fps-villaggio', 'fps-prato', 'fps-fat-10', 'fps-fat-30'].every(i => idV.includes(i)) && fps.filter(t => t.opz && t.opz.degrado).length === 2)
// le due scale: ogni gradino sopra quello di prima, in fondo il gradino del rumore rifatto, in cima tutti gli elementi della scena e solo quelli
const inSalita = gr => gr[0].accesi.length === 0 && gr.every((x, k) => !k || (gr[k - 1].accesi.every(a => x.accesi.includes(a)) && x.accesi.length > gr[k - 1].accesi.length))
for (const [k, el, rumore] of [['sot', 'sot', 'pareteVicina'], ['sopra', 'sopra', 'terreno']]) {
  const S = SCALE[k], sc = sceneDellaScala(k), gr = sc.slice(0, S.gradini.length), cima = gr[gr.length - 1].accesi
  controlla(`la scala ${k}: da niente acceso, ogni gradino sopra quello di prima`, inSalita(gr))
  controlla(`la scala ${k}: in fondo il gradino del rumore rifatto`, sc.length === S.gradini.length + 1 && sc[S.gradini.length].id === `${S.id}-ancora` && sc[S.gradini.length].accesi.join() === gr[S.rumore].accesi.join() && gr[S.rumore].accesi.includes(rumore))
  controlla(`la scala ${k}: l'ultimo gradino accende tutti gli elementi della scena, e solo quelli`, cima.length === SCENE_ELEMENTI[el].elementi.length && SCENE_ELEMENTI[el].elementi.every(a => cima.includes(a)), cima.join())
}
controlla('la scala del mondo di sopra nella verifica', TAPPE_VERIFICA.find(t => t.gruppo === 'scala-sopra').scene.length === SCALE.sopra.gradini.length + 1)
controlla('la stima: 23 scene, sui 6 minuti (il testo del foglio)', stima.scene === 23 && stima.minuti === 6, JSON.stringify(stima))
controlla('lo scontro delle complete ha il riferimento', ['sot-1', 'sot-3', 'sot-6'].every(i => dellaScena(i)))
const rif = dellaScena('sot-1')
uguale('il riferimento è tolto il calore (83.1 / 1.13)', rif.ms, 73.5)
controlla('il riferimento dice data e versione', RIFERIMENTO.quando === '22/10' && /^2026\.10\.22/.test(RIFERIMENTO.versione))
const cf = confronta({ id: 'sot-1', ms: 63.5, p95: 90, js: 25, gpu: 33 })
uguale('confronto: meglio di 10 ms (-14%)', `${cf.ms.d} ${cf.ms.pct} ${cf.ms.g}`, '-10 -14 meglio')
uguale('confronto: la GPU separata dal JS', `${cf.js.g} ${cf.gpu.g}`, 'meglio meglio')
uguale('confronto: nel rumore è uguale', confronta({ id: 'sot-1', ms: 74.5, p95: 90, js: 28.5, gpu: 45.7 }).ms.g, 'uguale')
uguale('una scena senza riferimento non si confronta', confronta({ id: 'ing-sot', ms: 5 }), null)

// la scala: il fondo 8 ms; le pareti +9, i mostri +7, l'eroe +5; le pareti rifatte +1 (il rumore)
let quota = 8
const scalaRis = [0, 1, 3, 9, 3, 1, 5, 7, 2].map((d, k) => { quota += d; return s(`scala-${k}`, 'scala', quota, quota + 5) })
const dv = {
  ...dati, verifica: true, gruppi: {},
  risultati: [...scalaRis, s('scala-ancora', 'scala', 22, 27), s('sot-1', 'discese', 60, 66, { js: 26, gpu: 36 }), s('sot-3', 'discese', 70, 80, { js: 30, gpu: 40, agg: 9, dis: 15, resto: 6 }), s('per-8', 'sopra', 52, 60, { js: 22, gpu: 30 }), { id: 'zaino-15', gruppo: 'sopra', nome: '15 anteprime', tot: 1500, attesa: 800, lavoro: 1400, max: 200, fatte: 15, n: 15 },
    { id: 'mos-8', gruppo: 'sopra', nome: 'mos-8', errore: 'x' },
    s('fps-sot-3', 'fps', 18, 30, { nome: 'scontro nel sotterraneo, 3 mostri', vero: true, fps: 42, dt95: 36, sotto30: 12, fermi: 1, js: 18, gpu: 0 }),
    s('fps-fat-10', 'fps', 9, 12, { nome: 'fattoria 3D del livello 10', vero: true, fps: 58, dt95: 18, sotto30: 0, fermi: 0, js: 9, gpu: 0 }),
    s('fps-villaggio', 'fps', 16, 30, { nome: 'camminare nel villaggio di sopra', vero: true, fps: 17, dt95: 66, sotto30: 99, fermi: 2, js: 16, gpu: 0 }),
    s('scala-sopra-0', 'scala-sopra', 10, 14), s('scala-sopra-1', 'scala-sopra', 13, 18), s('scala-sopra-2', 'scala-sopra', 25, 30),
    s('leve-sopra-tutte', 'leve-sopra', 40, 45, { gpu: 28 }), s('leve-sopra-lambertSopra', 'leve-sopra', 52, 58, { gpu: 39 }), s('leve-sopra-quantaErba', 'leve-sopra', 41, 46, { gpu: 29 })],
  fascia: 'bassa',
}
const tv = componiVeri(dv, { versione: 'x', ua: 'Redmi Note 7', quando: new Date(2026, 9, 23, 10, 0) })
controlla('verifica: la testa lo dice', /\(verifica compatta\)/.test(tv.split('\n')[0]))
controlla('verifica: sotto la scena con riferimento la riga «rispetto all\'ultima misura vera»', /sot-1: 60\/66[^\n]*\n +rispetto all'ultima misura vera \(22\/10\): −13\.5 ms \(−18%\), meglio; p95 [−+]/.test(tv), tv)
controlla('verifica: lo zaino a parte', /rispetto all'ultima misura vera \(22\/10\): −375 ms \(−20%\) in tutto, fotogramma più lungo −233 ms/.test(tv), tv)
controlla('verifica: la scena guasta non ha il confronto', !/mos-8[^\n]*\n +rispetto/.test(tv))
const lv2 = letturaVeri(dv).join('\n')
controlla('LETTURA: la scala gradino per gradino, col salto', /SCALA \(lo scontro con 3 mostri/.test(lv2) && /  0 niente disegnato \(il giro del gioco\): 8 ms/.test(lv2) && /  3 \+ pareti: 21 ms \(p95 26, js 6, gpu 15, 250 ch\) → \+9 ms \(js \+2, gpu \+7\)/.test(lv2), lv2)
controlla('LETTURA: il rumore e i gradini più cari', /Rumore: il gradino 3 rifatto in fondo 22 ms contro 21 \(\+1\): un gradino che si sposta meno di così è rumore\./.test(lv2) && /I gradini più cari: pareti \+9 ms \(GPU\), mostri \+7 ms \(GPU\), eroe \+5 ms \(GPU\)/.test(lv2), lv2)
const fermo6 = { ...dv, fermata: true, aMeta: [9, 19], risultati: [...scalaRis.slice(0, 6), { id: 'scala-6', gruppo: 'scala', nome: 'scala-6', errore: 'tempo scaduto (la scena oltre 15 s)' }] }
const lf = letturaVeri(fermo6).join('\n')
controlla('una scala a metà: i gradini fatti restano, quello che non regge la chiude', /  5 \+ rilievo, torcia, fuochi, lampi, nebbia: 25 ms/.test(lf) && /  6 \+ eroe: non regge \(tempo scaduto[^\n]*la scala si ferma qui/.test(lf) && !/  7 /.test(lf), lf)
controlla('una prova a metà lo dice in testa', /\(A METÀ: 9 scene di 19, la prova non è finita\)/.test(componiVeri(fermo6, {}).split('\n')[0]))
controlla('la riga degli fps veri', /~  scontro nel sotterraneo, 3 mostri: 42 fps \(sotto i 30 il 12% dei fotogrammi, p95 36 ms, 1 fermi oltre 100 ms\)/.test(tv) && /ok fattoria 3D del livello 10: 58 fps \(sotto i 30 il 0%/.test(tv), tv)
controlla('LETTURA: gli fps veri con la fascia', /FPS VERI \(fascia bassa, il gioco com'è\): scontro nel sotterraneo, 3 mostri 42 fps \(si gioca, a tratti scatta, sotto i 30 il 12%\); fattoria 3D del livello 10 58 fps \(liscio\); camminare nel villaggio/.test(lv2), lv2)
controlla('gli fps veri non sono «chi pesa di più» (il loro p95 è solo la CPU)', !/Chi pesa di più: (scontro nel|fattoria 3D)/.test(lv2), lv2)
controlla('LETTURA: dove va il JS (il giro del gioco, il disegno, il resto)', /Dove va il JS \(sot-3\): 30 ms, di cui il giro del gioco 9, il disegno di three 15, il resto 6/.test(lv2), lv2)
controlla('la riga della scena dice il JS diviso', /sot-3: 70\/80 ms \(js 30: gioco 9 disegno 15 gpu 40\)/.test(tv), tv)
controlla('LETTURA: lo scontro è lavoro in fila, non il fotogramma', /Scontro nelle discese \(1 mostro, effetti\), lavoro in fila: p95 66 ms \(telefono poi scheda/.test(lv2) && !/ancora oltre i 33/.test(lv2), lv2)
controlla('LETTURA: la scala del mondo di sopra a parte, fin dove è misurata', /SCALA \(il villaggio di sopra con 4 persone e 3 mostri/.test(lv2) && /  2 \+ mare: 25 ms[^\n]*→ \+12 ms/.test(lv2) && /  3 \+ terreno: non misurato; la scala si ferma qui/.test(lv2), lv2)
controlla('LETTURA: le leve di sopra, quanto toglie ciascuna, la più cara prima', /LEVE DI SOPRA \(il villaggio intero, lavoro in fila\): con tutte 40 ms \(gpu 28\); [^\n]*: la luce fisica invece di Lambert \+12 ms \(gpu \+11\), tutta l'erba \+1 ms \(gpu \+1\)\./.test(lv2), lv2)
controlla('le righe della scala senza ok/XX (lavoro in fila)', /\n·  scala-sopra-2: 25\/30 ms/.test(tv) && /\n·  scala-3: /.test(tv), tv)
controlla('i DATI dicono la versione di riferimento', JSON.parse(tv.split('DATI ')[1]).vf === RIFERIMENTO.versione)
controlla('una misura completa non ha il confronto', !/rispetto all'ultima misura vera/.test(componiVeri({ ...dv, verifica: false }, {})) && !/MIGLIORATO/.test(letturaVeri({ ...dv, verifica: false }).join('')))
controlla('i DATI vecchi restano: stessa forma, righe invariate', JSON.parse(testo.split('DATI ')[1]).vf === undefined && dd.r.length === dati.risultati.length)

riassunto('la misura coi modelli veri')
