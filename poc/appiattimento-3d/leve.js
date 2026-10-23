// I livelli e le leve, come dati: un livello è una fascia del gioco (`qualita`), un pixel ratio e una lista di leve; una leva è un
// gettone `nome:valore` (`luci:6`, `tri:4`, `ombra:macchia`). I gettoni che il prototipo non conosce vanno dritti al gioco come
// pezzi di ACCESI da spegnere o accendere (`fuochi:6`, `lampi:1`, `post:1`, `nebbia`), come il cheat `&spegni=`.

// alta: il gioco com'è oggi nella fascia alta (il Pixel 9a). oggi: la fascia bassa di oggi (quella che il Note 7 fa a 10-14 fps).
// bassa: il pacchetto scelto dal catalogo del budget (docs/sotterraneo/appiattimento-3d.md). bassa+: in più la scala di disegno.
export const LIVELLI = {
  alta: { qualita: 'alta', dpr: 1.5, leve: [], nome: 'alta (come oggi)' },
  oggi: { qualita: 'bassa', dpr: 1, leve: [], nome: 'bassa di oggi' },
  bassa: { qualita: 'bassa', dpr: 1, nome: 'bassa nuova',
    // la luce per vertice coi fuochi, il lampo, la magia, il palco e il rimbalzo tutti accesi (per vertice costano niente), la nebbia
    // per vertice, l'ombra a macchia, la penombra cotta
    leve: ['luce:vertice', 'nebbia:vertice', 'luce:cotta', 'ombra:macchia', 'fuochi:6', 'lampi:1', 'palco:1'] },
  'bassa+': { qualita: 'bassa', dpr: 0.75, nome: 'bassa nuova a 0,75',
    leve: ['luce:vertice', 'nebbia:vertice', 'luce:cotta', 'ombra:macchia', 'fuochi:6', 'lampi:1', 'palco:1'] },
}

/**
 * Dai parametri della pagina (`livello`, `leve` coi gettoni uniti da `+`, `dpr`) alla ricetta:
 * { qualita, dpr, spegni (per creaSotterraneo3d), vertice: null | { nebbia, cotta, suddividi }, macchie, bagliori, carichi: [[nome, n]] }
 */
export function ricetta({ livello = 'oggi', leve = '', dpr = null } = {}) {
  const L = LIVELLI[livello] || LIVELLI.oggi
  const r = { qualita: L.qualita, dpr: L.dpr, spegni: [], vertice: null, macchie: false, bagliori: false, carichi: [], gettoni: [] }
  const tutte = [...L.leve, ...String(leve || '').split(/[+ ]/).filter(Boolean)]
  const vert = () => (r.vertice = r.vertice || { nebbia: false, cotta: false, suddividi: true })
  for (const g of tutte) {
    r.gettoni.push(g)
    const [k, v = ''] = g.split(':')
    const n = Number(v)
    if (k === 'luce' && v === 'vertice') vert()
    else if (k === 'luce' && v === 'vertice-intera') vert().suddividi = false            // la luce per vertice senza suddividere niente
    else if (k === 'luce' && v === 'cotta') vert().cotta = true
    else if (k === 'nebbia' && v === 'vertice') vert().nebbia = true
    else if (k === 'fette' && n === 0) r.spegni.push('nebbia')
    else if (k === 'ombra' && v === 'no') r.spegni.push('ombre')
    else if (k === 'ombra' && v === 'macchia') { r.spegni.push('ombre'); r.macchie = true }
    else if (k === 'ombra' && v === '1024') r.spegni.push('ombraMappa:1024', 'ombraOgni:1')
    else if (k === 'bagliori') r.bagliori = true
    else if (k === 'via' && v === 'luci') r.senzaLuci = true                                // tutte le luci puntiformi e il cono, come `ab-luci0`
    else if (k === 'luci') { r.spegni.push('fuochi:0'); r.carichi.push(['luci', n]) }   // come le scene `luci-N` del telefono
    else if (k === 'dpr') r.dpr = n
    else if (['tri', 'ch', 'add', 'punti', 'pelle', 'rigide'].includes(k)) r.carichi.push([k, n])
    else if (k === 'mat') r.carichi.push(['mat', v])
    else if (k === 'senza') r.carichi.push(['senza', v])                                  // senza:normali, senza:trame
    else r.spegni.push(g)                                                                   // un pezzo di ACCESI (scena3d/costanti.js)
  }
  if (dpr) r.dpr = Number(dpr)
  return r
}

// Le scene del catalogo del budget: una leva alla volta sopra la bassa di oggi (lo scontro con 3 mostri fermo, la scena `tri-1` della
// misura coi modelli veri), e i livelli. `tel`: la riga del log del Note 7 (redmi-note7-veri-22ott.txt) con la stessa scena. Le misura
// il computer (misura.mjs: i conti, e i ms solo come ordine di grandezza) e il telefono (la pagina con `?telefono=1`).
const s = (gruppo, leve, nome, tel = null) => ({ id: `${gruppo}:${leve}`, gruppo, q: `livello=oggi&leve=${leve}`, leve, nome, tel })
export const SCENE = [
  { id: 'livelli:alta', gruppo: 'livelli', q: 'livello=alta', nome: 'alta (come oggi, dpr 1,5)' },
  { id: 'livelli:oggi', gruppo: 'livelli', q: 'livello=oggi', nome: 'bassa di oggi (dpr 1)', tel: 'tri-1' },
  { id: 'livelli:bassa', gruppo: 'livelli', q: 'livello=bassa', nome: 'bassa nuova' },
  { id: 'livelli:bassa+', gruppo: 'livelli', q: 'livello=bassa%2B', nome: 'bassa nuova a 0,75' },
  s('triangoli', 'tri:2', 'triangoli ×2', 'tri-2'), s('triangoli', 'tri:4', 'triangoli ×4', 'tri-4'), s('triangoli', 'tri:8', 'triangoli ×8', 'tri-8'),
  s('chiamate', 'ch:2', 'chiamate ×2', 'ch-2'), s('chiamate', 'ch:4', 'chiamate ×4', 'ch-4'),
  s('materiali', 'mat:lambert', 'Lambert per pixel'), s('materiali', 'mat:basic', 'Basic (niente luce)'),
  s('materiali', 'luce:vertice-intera', 'luce per vertice, niente suddiviso'), s('materiali', 'luce:vertice', 'luce per vertice, terreno suddiviso'),
  s('luci', 'luci:1', '1 fuoco vero', 'luci-1'), s('luci', 'luci:2', '2 fuochi veri', 'luci-2'), s('luci', 'luci:4', '4 fuochi veri', 'luci-4'),
  s('luci', 'luci:6', '6 fuochi veri', 'luci-6'), s('luci', 'luci:12', '12 fuochi veri', 'luci-12'),
  s('luci', 'luci:1+ombra:no', '1 fuoco senza ombra', 'luci-1s'), s('luci', 'luci:6+ombra:no', '6 fuochi senza ombra', 'luci-6s'), s('luci', 'luci:12+ombra:no', '12 fuochi senza ombra', 'luci-12s'),
  s('luci', 'fuochi:0', 'nessun fuoco vero'), s('luci', 'fuochi:0+bagliori', 'nessun fuoco vero, bagliori finti'),
  s('luci', 'luce:vertice+fuochi:6+lampi:1+palco:1', 'per vertice: 6 fuochi, lampo, magia, palco, rimbalzo'),
  s('ombre', 'ombra:no', 'senza ombra'), s('ombre', 'ombra:macchia', 'ombra a macchia'), s('ombre', 'ombra:1024', 'ombra a 1024, ogni fotogramma'),
  s('trasparenze', 'add:8', '8 additivi grandi sovrapposti'), s('trasparenze', 'add:32', '32 additivi grandi sovrapposti'),
  s('trasparenze', 'punti:0', 'senza particelle'), s('trasparenze', 'punti:2000', '2000 scintille da 8 px in più'),
  s('nebbia', 'fette:0', 'senza fette di nebbia', 'senza-nebbia'), s('nebbia', 'ottaveNebbia:4', 'nebbia con 4 strati di rumore'),
  s('nebbia', 'luce:vertice+nebbia:vertice', 'per vertice, nebbia per vertice'),
  s('trame', 'senza:normali', 'senza normal map'), s('trame', 'senza:trame', 'senza trame (colore pieno)'),
  s('pelle', 'rigide:6', '6 persone rigide'), s('pelle', 'pelle:6', '6 persone con la pelle (SkinnedMesh)'),
  s('pixel', 'dpr:0.6', 'pixel ratio 0,6'), s('pixel', 'dpr:0.75', 'pixel ratio 0,75'), s('pixel', 'dpr:1.41', 'pixel ratio 1,41', 'px-1.41'), s('pixel', 'dpr:2', 'pixel ratio 2', 'px-2'),
  s('schermo', 'post:1', 'col passaggio finale'),
  // la scomposizione del telefono (`ab-*`): un mostro, i colpi a ripetizione, una cosa tolta alla volta; e quello che resta del
  // pavimento di ~60 ms (js 27, gpu 33) anche coi Basic e senza luci, tolto un pezzo dopo l'altro
  ...[['-', 'scena intera (1 mostro, effetti)', 'ab-base'], ['ombra:no', 'senza ombra', 'ab-ombra'], ['via:luci', 'nessuna luce puntiforme', 'ab-luci0'],
    ['punti:0', 'senza particelle', 'ab-punti'], ['senza:normali', 'senza normal map', 'ab-normali'], ['mat:lambert', 'Lambert', 'ab-lambert'],
    ['mat:basic', 'Basic', 'ab-basic'], ['fette:0', 'senza fette di nebbia', 'ab-nebbia'], ['post:1', 'col passaggio finale', 'ab-post'], ['dpr:0.6', 'pixel ratio 0,6', 'ab-dpr'],
    ['luce:vertice', 'luce per vertice'], ['luce:vertice+nebbia:vertice+ombra:macchia', 'per vertice, nebbia per vertice, macchie'],
    ['mat:basic+via:luci', 'Basic senza luci (il fondo)'], ['mat:basic+via:luci+ombra:no+punti:0+fette:0', 'il fondo senza ombra, particelle, nebbia'],
    ['mat:basic+via:luci+ombra:no+punti:0+fette:0+effetti3d', '…e senza effetti 3D'], ['mat:basic+via:luci+ombra:no+punti:0+fette:0+effetti3d+mostri3d:0', '…e i mostri sprite'],
    ['bassa', 'la bassa nuova', null, 'bassa']]
    .map(([leve, nome, tel, livello]) => ({ id: `togli:${leve}`, gruppo: 'togli', q: livello ? `livello=${livello}&mostri=1&colpi=1` : `livello=oggi&mostri=1&colpi=1&leve=${leve}`, leve, nome, tel })),
]
