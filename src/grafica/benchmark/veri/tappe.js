// Le scene degli fps veri di casa (docs/core/vecchio-telefono-veri.md), da passare a `eseguiVeri({ tappe })`. Ogni gioco carica il suo
// codice con `import()` solo quando tocca a lui. La scuola ha il suo elenco (scuola/bambini/prova-pc.js): questo porta la fattoria.
const discese = () => import('./discese.js')
// gli fps veri: le discese (camminare in un piano, lo scontro), il mondo di sopra (il villaggio, lo scontro sul prato), la fattoria 3D
// col suo degrado acceso e gli Asteroidi (il volo, e il volo con le esplosioni)
const fattoria = () => import('./fattoria.js'), sopraVero = () => import('./sopra-vero.js'), asteroidi = () => import('./asteroidi.js')
export const TAPPE_FPS = [
  { gruppo: 'fps', carica: discese, tempi: 'fps', scene: [
    { id: 'fps-piano', nome: 'camminare in un piano del sotterraneo', passeggia: true, stima: 16 },
    ...[3, 6].map(n => ({ id: `fps-sot-${n}`, nome: `scontro nel sotterraneo, ${n} mostri`, mostri: n, colpi: true, stima: 14 })),
  ] },
  { gruppo: 'fps', carica: sopraVero, tempi: 'fps', scene: [
    { id: 'fps-villaggio', nome: 'camminare nel villaggio di sopra', dove: 'villaggio', stima: 18 },
    { id: 'fps-prato', nome: `scontro sul prato, 3 mostri`, dove: 'prato', stima: 16 },
  ] },
  ...[10, 30].map(l => ({ gruppo: 'fps', carica: fattoria, opz: { livello: l, degrado: true }, tempi: 'fps', scene: [{ id: `fps-fat-${l}`, nome: `fattoria 3D del livello ${l}`, stima: 16 }] })),
  { gruppo: 'fps', carica: asteroidi, tempi: 'fps', scene: [
    { id: 'fps-ast', nome: 'asteroidi, il volo con 8 sassi e la nave madre', stima: 14 },
    { id: 'fps-ast-boom', nome: 'asteroidi, un\'esplosione al secondo', boom: true, stima: 12 },
  ] },
]
