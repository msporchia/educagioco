/* La cache dei modelli della fattoria 3D (scena3d/cache-modelli.js): un modello si costruisce e si fonde una volta, le istanze sono cloni che
   ne condividono geometrie e materiali; i riferimenti a nodi in `userData` e le animazioni seguono il clone; un'istanza non altera le altre
   (il fantasma clona i materiali); e il riscaldamento (scaldo-puro.js). Senza browser. `node test/esegui.mjs fattoria3d-cache`
   tempo: 1 */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const { clonaModello, memoModello, CACHE_MODELLI } = await import('../../src/giochi/fattoria3d/scena3d/cache-modelli.js')
const { creaScaldo } = await import('../../src/giochi/fattoria3d/scena3d/scaldo-puro.js')
const M = await import('../../src/giochi/fattoria3d/scena3d/modelli.js')
const MM = await import('../../src/giochi/fattoria3d/scena3d/modelli-macchine.js')
const MP = await import('../../src/giochi/fattoria3d/scena3d/modelli-passaggi.js')

const meshes = g => { const a = []; g.traverse(o => { if (o.isMesh) a.push(o) }); return a }
const geos = g => new Set(meshes(g).map(o => o.geometry))

/* ══════════ 1. il clone ══════════ */
{
  const m = new THREE.MeshStandardMaterial({ color: 0xff0000 }), geo = new THREE.BoxGeometry(1, 1, 1)
  const base = new THREE.Group(); base.position.set(1, 2, 3)
  const braccio = new THREE.Group(); braccio.rotation.set(0.1, 0.2, 0.3); braccio.add(new THREE.Mesh(geo, m)); base.add(braccio)
  const fermo = new THREE.Mesh(geo, m); fermo.castShadow = true; fermo.receiveShadow = false; fermo.scale.set(2, 1, 1); base.add(fermo)
  base.userData = { braccio, lista: [braccio, fermo], fumo: new THREE.Vector3(1, 2, 3), n: 4, ann: { dentro: [fermo] }, anima: function (dt) { this.braccio.rotation.z += dt } }
  const c = clonaModello(base)
  controlla('il clone non è l\'originale e ha gli stessi nodi', c !== base && c.children.length === 2 && c.children[0].children.length === 1)
  controlla('la posizione, la rotazione e la scala si ricopiano', c.position.equals(base.position) && Math.abs(c.children[0].rotation.y - 0.2) < 1e-9 && c.children[1].scale.x === 2)
  controlla('i flag dell\'ombra si ricopiano', c.children[1].castShadow === true && c.children[1].receiveShadow === false)
  controlla('geometria e materiale sono gli stessi oggetti (condivisi)', c.children[1].geometry === geo && c.children[1].material === m)
  controlla('i riferimenti a nodi vanno ai nodi del clone, anche in una lista o dentro un oggetto', c.userData.braccio === c.children[0] && c.userData.lista[1] === c.children[1] && c.userData.ann.dentro[0] === c.children[1])
  controlla('un vettore si ricopia (non è lo stesso)', c.userData.fumo !== base.userData.fumo && c.userData.fumo.equals(base.userData.fumo))
  c.userData.fumo.x = 9; c.userData.ann.dentro.push(1)
  controlla('cambiare il clone non cambia l\'originale', base.userData.fumo.x === 1 && base.userData.ann.dentro.length === 1)
  c.userData.anima(0.5)
  controlla('l\'animazione (un metodo che legge i nodi da this) muove il clone, non l\'originale', Math.abs(c.children[0].rotation.z - 0.8) < 1e-9 && Math.abs(braccio.rotation.z - 0.3) < 1e-9)
}

/* ══════════ 2. memoModello ══════════ */
{
  let costruiti = 0
  const crea = memoModello('prova', (k) => { costruiti++; const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial())); g.userData.k = k; return g }, { chiave: k => k % 2, dopo: g => { g.userData.caso = Math.random() } })
  const a = crea(0), b = crea(2), c = crea(1)
  uguale('si costruisce una volta per chiave', costruiti, 2)
  controlla('le istanze della stessa chiave condividono la geometria', a.children[0].geometry === b.children[0].geometry && a.children[0].geometry !== c.children[0].geometry)
  controlla('…ma sono oggetti diversi', a !== b && a.children[0] !== b.children[0])
  controlla('il ritocco `dopo` gira a ogni istanza', a.userData.caso !== b.userData.caso)
  CACHE_MODELLI.acceso = false; crea(0); crea(0)
  uguale('con la cache spenta si costruisce ogni volta', costruiti, 4)
  CACHE_MODELLI.acceso = true
}

/* ══════════ 3. i creatori veri ══════════ */
const TIPI = {
  pasticceria: M.creaPasticceria, mongolfiera: M.creaMongolfiera, mulino: M.creaMulino, panificio: M.creaPanificio, conserviera: M.creaConserviera,
  gelateria: M.creaGelateria, caseificio: M.creaCaseificio, telaio: MM.creaTelaio, zuccherificio: MM.creaZuccherificio, sartoria: MM.creaSartoria, tintoria: MM.creaTintoria, 'fienile-macchina': MM.creaFienileMacchina,
  ponte: MP.creaPonte, passerella: MP.creaPasserella, tavolo: MP.creaTavolo, aiuola: M.creaAiuola, panchina: M.creaPanchina, pozzo: M.creaPozzo,
  spaventapasseri: M.creaSpaventapasseri, fontana: M.creaFontana, trattore: M.creaTrattore, fienile: M.creaFienile, cassa: M.creaCassa, casa: M.creaCasa,
  bancarella: M.creaBancarella, bacheca: M.creaBacheca, recinto: () => M.creaRecinto([{ eta: 'adulta', t0: 0 }]), pollaio: () => M.creaPollaio([{ fine: null }]),
  stalla: () => M.creaStalla([{ fine: null }]), campo: () => M.creaCampo(3),
}
for (const [nome, crea] of Object.entries(TIPI)) {
  const a = crea(), b = crea()
  const ga = meshes(a).filter(o => !o.isInstancedMesh), gb = meshes(b).filter(o => !o.isInstancedMesh)
  uguale(`${nome}: due istanze hanno lo stesso numero di mesh`, meshes(a).length, meshes(b).length)
  controlla(`${nome}: nessuna geometria è propria di un'istanza (le mesh fisse condividono)`, ga.every((o, i) => o.geometry === gb[i].geometry && o.material === gb[i].material))
  controlla(`${nome}: i nodi sono diversi fra le istanze`, a !== b && ga.every((o, i) => o !== gb[i]))
}
{
  // le animazioni muovono il clone che le possiede, non un altro
  const prova = (nome, crea, nodo, campo) => {
    const a = crea(), b = crea(), prima = nodo(b)[campo]
    a.userData.anima(0.3, 1.1)
    controlla(`${nome}: anima muove i nodi di quell'istanza e non dell'altra`, nodo(a)[campo] !== prima && nodo(b)[campo] === prima)
  }
  prova('mulino', M.creaMulino, g => g.userData.pale.rotation, 'z')
  prova('gelateria', M.creaGelateria, g => g.userData.cono.rotation, 'y')
  prova('caseificio', M.creaCaseificio, g => g.userData.ruota.rotation, 'x')
  prova('spaventapasseri', M.creaSpaventapasseri, g => g.userData.corpo.rotation, 'z')
  prova('fontana', M.creaFontana, g => g.userData.gocce[3].position, 'y')
  prova('telaio', MM.creaTelaio, g => g.userData.navetta.position, 'x')
  prova('zuccherificio', MM.creaZuccherificio, g => g.userData.ruota.rotation, 'x')
  prova('sartoria', MM.creaSartoria, g => g.userData.man.rotation, 'y')
  prova('tintoria', MM.creaTintoria, g => g.userData.panni[1].rotation, 'y')
  prova('fienile (macchina)', MM.creaFienileMacchina, g => g.userData.balla.rotation, 'x')
  const pa = M.creaPanificio(); pa.userData.anima(0.1, 1); controlla('panificio: la bocca si accende (resta un nodo del clone)', pa.userData.bocca.parent === pa)
  const pas = M.creaPasticceria(); controlla('pasticceria: il dolce che gira è un nodo del clone', pas.userData.gira.parent === pas)
  const mo = M.creaMongolfiera(); controlla('mongolfiera: volo e fiamma sono nodi del clone', mo.userData.volo.parent === mo && mo.userData.fiamma.parent === mo.userData.volo)
  const ca = M.creaCasa(); controlla('casa: il fumo resta un vettore', ca.userData.fumo.isVector3)
  const ba = M.creaBacheca(), bb = M.creaBacheca(); ba.userData.mostraFogli(5, ['rosa', 'giallo', 'verde']); uguale('bacheca: i foglietti accesi sono quelli dell\'istanza', ba.userData.fogli.filter(f => f.visible).length, 5)
  uguale('…e l\'altra bacheca non cambia', bb.userData.fogli.filter(f => f.visible).length, 3)
  controlla('bacheca: il colore è del foglietto di quell\'istanza', ba.userData.fogli[0].userData.carta.material !== bb.userData.fogli[0].userData.carta.material)
}
{
  // le bestie: ogni gallina e mucca è sua (numeri a caso diversi), la lista delle pecore e delle bestie non è condivisa
  const g1 = M.creaGallina(0), g2 = M.creaGallina(0)
  controlla('gallina: fase e attesa a caso diverse', g1.userData.fase !== g2.userData.fase && g1.userData.attesa !== g2.userData.attesa)
  controlla('gallina: corpo, testa e dono sono suoi', g1.userData.corpo.parent === g1.userData.alto && g1.userData.alto.parent === g1 && g1.userData.dono === g1.userData.uovo && g1.userData.uovo.parent === g1 && g1.userData.meta !== g2.userData.meta)
  const m1 = M.creaMucca(0), m2 = M.creaMucca(2), m3 = M.creaMucca(1)
  controlla('mucca: lo stesso mantello condivide il corpo, l\'altro no', m1.userData.corpo.geometry === m2.userData.corpo.geometry && m1.userData.corpo.geometry !== m3.userData.corpo.geometry)
  const r1 = M.creaRecinto([{ eta: 'adulta', t0: 0 }, { eta: 'adulta', t0: 0 }]), r2 = M.creaRecinto([{ eta: 'adulta', t0: 0 }])
  uguale('recinto: le pecore sono quelle chieste', [r1.userData.pecore.length, r2.userData.pecore.length].join(), '2,1')
  controlla('recinto: le liste delle pecore non sono condivise', r1.userData.pecore !== r2.userData.pecore)
  M.sincronizzaPecore(r1, [{ eta: 'adulta', t0: 0 }]); uguale('…e togliere una pecora a un recinto non tocca l\'altro', [r1.userData.pecore.length, r2.userData.pecore.length].join(), '1,1')
  const p1 = M.creaPollaio([{ fine: null }, { fine: null }]), p2 = M.creaPollaio([{ fine: null }])
  uguale('pollaio: due galline e una', [p1.userData.bestie.length, p2.userData.bestie.length].join(), '2,1')
  const s1 = M.creaStalla([{ fine: null }]); M.muoviBestie(s1, 0.1, 1, [{ fine: null }], Date.now()); controlla('stalla: le mucche si muovono', s1.userData.bestie.length === 1)
  const c1 = M.creaCampo(3), c2 = M.creaCampo(9)
  controlla('campo: le piante a istanze sono sue (matrici e colori propri), la forma è condivisa', c1.userData.grano.parti !== c2.userData.grano.parti && Object.keys(c1.userData.grano.parti).every(k => c1.userData.grano.parti[k].mesh.geometry === c2.userData.grano.parti[k].mesh.geometry && c1.userData.grano.parti[k].mesh !== c2.userData.grano.parti[k].mesh))
  M.aggiornaCampo(c1, [1, 1, 1, 1], 0, 'grano', false)
  const conta = c => Object.values(c.userData.grano.parti).reduce((s, p) => s + p.mesh.count, 0)
  controlla('…e crescere un campo non cresce l\'altro', conta(c1) > 0 && conta(c2) === 0)
}

/* ══════════ 4. il fantasma non cambia ciò che è condiviso ══════════ */
{
  const vero = M.creaAiuola(), f = M.creaAiuola()
  const prima = meshes(vero).map(o => [o.material, o.material.opacity, o.material.transparent, o.material.emissive.getHex(), o.castShadow])
  M.fantasma(f); M.tingi(f, false)
  controlla('il fantasma ha materiali suoi, semitrasparenti', meshes(f).every(o => o.material.transparent && o.material.opacity === 0.5 && !meshes(vero).some(v => v.material === o.material)))
  controlla('…e le istanze vere non cambiano (materiale, opacità, luce propria, ombra)', meshes(vero).every((o, i) => o.material === prima[i][0] && o.material.opacity === prima[i][1] && o.material.transparent === prima[i][2] && o.material.emissive.getHex() === prima[i][3] && o.castShadow === prima[i][4]))
  controlla('…e la geometria resta quella della cache', meshes(f).every((o, i) => o.geometry === meshes(vero)[i].geometry))
  let buttati = 0; for (const o of meshes(f)) o.material.addEventListener('dispose', () => buttati++)
  const g = new Set(geos(f)); let geoButtate = 0; for (const x of g) x.addEventListener('dispose', () => geoButtate++)
  M.buttaFantasma(f)
  uguale('buttare un fantasma butta i suoi materiali', buttati, meshes(f).length)
  uguale('…e non le geometrie della cache', geoButtate, 0)
}

/* ══════════ 5. il riscaldamento ══════════ */
{
  const ordine = []
  const s = creaScaldo([{ nome: 'a', fai: () => ordine.push('a') }, { nome: 'b', fai: () => ordine.push('b') }, { nome: 'c', fai: () => { throw new Error('guasto') } }, { nome: 'd', fai: () => ordine.push('d') }])
  let t = 0; const ora = () => (t += 1)
  uguale('prima di cominciare restano tutti', s.restanti, 4)
  controlla('con un fotogramma lento non si fa niente', s.passo({ dtMs: 50, fps: 60, ora }) === null && s.restanti === 4)
  controlla('con gli fps bassi non si fa niente', s.passo({ dtMs: 16, fps: 20, ora }) === null && s.restanti === 4)
  controlla('con la pagina nascosta non si fa niente', s.passo({ dtMs: 16, fps: 60, attivo: false, ora }) === null && s.restanti === 4)
  controlla('con un fotogramma veloce si fa un compito, il primo', s.passo({ dtMs: 16, fps: 60, ora }).nome === 'a' && ordine.join() === 'a')
  controlla('uno solo per fotogramma, in ordine', s.passo({ dtMs: 16, fps: 60, ora }).nome === 'b' && ordine.join() === 'a,b')
  s.passo({ dtMs: 16, fps: 0, ora })
  uguale('un compito che si rompe non ferma gli altri', s.restanti, 1)
  s.passo({ dtMs: 16, fps: 60, ora }); uguale('…e si arriva in fondo', ordine.join(), 'a,b,d')
  controlla('finito, non fa più niente', s.passo({ dtMs: 16, fps: 60, ora }) === null && s.restanti === 0)
  const lento = creaScaldo([{ nome: 'x', fai: () => {} }, { nome: 'y', fai: () => {} }])
  let k = 0; const ora2 = () => (k += 20)           // ogni compito «dura» 20 ms
  lento.passo({ dtMs: 16, ora: ora2 })
  controlla('dopo un compito lungo si lascia riposare qualche fotogramma', lento.passo({ dtMs: 16, ora: ora2 }) === null && lento.restanti === 1)
  lento.abbandona(); uguale('abbandonare svuota la coda', lento.restanti, 0)
}
riassunto('Fattoria 3D — la cache dei modelli e il riscaldamento')
