/* La misura coi modelli veri (docs/core/vecchio-telefono-veri.md): il log si compone con le righe, la LETTURA nomina il limite di
   ogni serie e il collo di bottiglia, la riga DATI si rilegge, un log lungo si spezza in invii che stanno nel campo del modulo, le
   note finiscono prima dei DATI. E le leve sulla scena vera: triangoli × k con la stessa forma, chiamate × k con gli stessi triangoli. */
import { BoxGeometry, Mesh, MeshStandardMaterial, Scene, Box3, SkinnedMesh, Skeleton, Bone, Uint16BufferAttribute, Float32BufferAttribute } from 'three'
import { componiVeri, letturaVeri, limite, spezza, conNote, LIMITE_CAMPO } from '../../src/grafica/benchmark/log-veri.js'
import { dividi, leve } from '../../src/grafica/benchmark/veri/moltiplica.js'
import { TAPPE, QUANTE } from '../../src/grafica/benchmark/veri.js'
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

riassunto('la misura coi modelli veri')
