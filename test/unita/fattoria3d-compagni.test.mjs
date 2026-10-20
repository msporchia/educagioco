/* Verifica dei compagni della fattoria 3D (Watson, i gatti, il contadino nuovo), senza browser: i dati, la scelta delle mete (mai
   su una cella bloccata), i modelli (pochi mesh, piedi a terra, ingombro giusto, pose che non producono numeri sbagliati) e una
   simulazione di tre minuti con tutto il motore vero, col caso finto: non finiscono mai in una cella bloccata.
   `node test/esegui.mjs fattoria3d-compagni`
   tempo: 1 */
import { COMPAGNI, compagniAl, scegliMeta, cellaLiberaVicina, decidiCane, decidiGatto, durataDi, guastiDeiCompagni, ASPETTO_ERO } from '../../src/giochi/fattoria3d/dati/compagni.js'
import { roba, sogliaDi, guastiDeiLivelli, vuoto } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'

// un canvas finto: la faccia del contadino è una trama, qui basta che si possa disegnare
const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const { creaContadino, creaCane, creaGatto, posaCane, posaGatto, creaCompagno, misure } = await import('../../src/giochi/fattoria3d/scena3d/modelli-compagni.js')
const { Compagni } = await import('../../src/giochi/fattoria3d/scena3d/compagni.js')

/* ══════════ 1. i dati ══════════ */
const g = guastiDeiCompagni()
controlla('i dati dei compagni non hanno guasti', g.length === 0, g.join(' · '))
controlla('i dati dei livelli reggono con i compagni', guastiDeiLivelli().length === 0, guastiDeiLivelli().join(' · '))
uguale('al livello 2 non c\'è nessuno', compagniAl(2).length, 0)
uguale('Watson arriva al 3', compagniAl(3)[0].id, 'watson')
uguale('al livello 5 sono due, il gatto è il secondo', compagniAl(5).map(c => c.id).join(), 'watson,briciola')
uguale('al 13 sono quattro', compagniAl(13).length, 4)
uguale('«soloQuesto»: al 9 arriva solo Zenzero', compagniAl(9, true).map(c => c.id).join(), 'zenzero')
uguale('roba(5) li raccoglie', roba(5).compagni.map(c => c.id).join(), 'briciola')
controlla('un livello coi soli compagni non è «vuoto» per il conto di roba', roba(3).compagni.length === 1 && !vuoto({ pezzi: [], edifici: [], colture: [], ricette: [] }) === false)
controlla('i quattro compagni sono due specie e tre mantelli', new Set(Object.values(COMPAGNI).map(c => c.variante)).size === 4)
controlla('l\'aspetto del contadino è uno dei due', ['contadino', 'contadina'].includes(ASPETTO_ERO))

/* ══════════ 2. la scelta della meta ══════════ */
{
  const bloccate = new Set(['3,3', '4,3', '3,4'])
  const libera = (i, j) => i >= 0 && i < 8 && j >= 0 && j < 8 && !bloccate.has(`${i},${j}`)
  let seme = 7; const rnd = () => (seme = (seme * 9301 + 49297) % 233280) / 233280
  let male = 0, nulle = 0
  for (let n = 0; n < 400; n++) {
    const m = scegliMeta({ libera, centro: [3.5, 3.5], rMin: 1, rMax: 3, rnd })
    if (!m) nulle++; else if (!libera(...m)) male++
  }
  uguale('la meta non cade mai su una cella bloccata', male, 0)
  uguale('con spazio attorno una meta c\'è sempre', nulle, 0)
  const sempre0 = () => 0
  const m0 = scegliMeta({ libera, centro: [3.5, 3.5], rMin: 1, rMax: 3, rnd: sempre0 })
  controlla('con un caso che pesca sempre la stessa cella bloccata, la ricerca a tappeto ne trova un\'altra', m0 && libera(...m0), JSON.stringify(m0))
  const lontana = scegliMeta({ libera, centro: [3.5, 3.5], rMin: 1, rMax: 3, rnd, evita: [[3.5, 3.5, 2.5]] })
  controlla('«evita» tiene lontano', !lontana || Math.hypot(lontana[0] + 0.5 - 3.5, lontana[1] + 0.5 - 3.5) >= 2.5, JSON.stringify(lontana))
  uguale('niente spazio: null', scegliMeta({ libera: () => false, centro: [3, 3], rnd }), null)
  controlla('cellaLiberaVicina trova una cella libera', libera(...cellaLiberaVicina(libera, 3.5, 3.5)))
}

/* ══════════ 3. le decisioni ══════════ */
{
  const r = v => () => v
  uguale('il cane lontano corre dall\'eroe', decidiCane({ dist: 9, eroeFermo: true }, r(0.5)).fretta, true)
  uguale('l\'eroe cammina e il cane è indietro: lo segue', decidiCane({ dist: 4, eroeFermo: false }, r(0.9)).stato, 'segue')
  uguale('l\'eroe lavora e il cane è vicino: si siede', decidiCane({ dist: 2, eroeFermo: false, eroeLavora: true }, r(0.9)).stato, 'siede')
  uguale('con l\'eroe fermo il cane annusa i campi', decidiCane({ dist: 2, eroeFermo: true, eroeInattivo: 0 }, r(0.4)).vai, 'campo')
  uguale('dorme solo se l\'eroe sta fermo da un po\'', decidiCane({ dist: 2, eroeFermo: true, eroeInattivo: 30 }, r(0.95)).stato, 'dorme')
  uguale('…e se no si siede', decidiCane({ dist: 2, eroeFermo: true, eroeInattivo: 2 }, r(0.95)).stato, 'siede')
  uguale('il gatto vicino al cane scappa', decidiGatto({ vicinoAlCane: true }, r(0.1)).stato, 'fugge')
  uguale('il gatto dorme sulla panchina se c\'è', decidiGatto({ dormePosto: true }, r(0.8)).vai, 'posto')
  uguale('…e se no dorme dov\'è', decidiGatto({ dormePosto: false }, r(0.8)).vai, undefined)
  dentro('una durata sta nel suo intervallo', durataDi('dorme', r(0.5)), 9, 18)
}

/* ══════════ 4. i modelli ══════════ */
{
  const vecchio = { altezza: 1.26 }                       // l'eroe a scatole di prima, tolto: i gesti e la camera sono tarati su lui
  for (const aspetto of ['contadino', 'contadina']) {
    const m = misure(creaContadino(aspetto))
    dentro(`${aspetto}: l'altezza è vicina a quella di prima`, m.altezza, vecchio.altezza - 0.2, vecchio.altezza + 0.1)
    dentro(`${aspetto}: i piedi stanno a terra`, m.sotto, -0.01, 0.01)
    dentro(`${aspetto}: non è più largo di un metro`, m.larghezza, 0.3, 0.9)
    dentro(`${aspetto}: i mesh sono pochi`, m.mesh, 20, 60)
    const u = creaContadino(aspetto).userData
    controlla(`${aspetto}: ha gli stessi perni dell'eroe di prima`, ['gambe', 'busto', 'testa', 'bracci', 'falce', 'ascia'].every(k => u[k]) && u.gambe.length === 2 && u.bracci.length === 2)
  }
  const c0 = creaCane(); posaCane(c0, { stato: 'sta' }); const cane = misure(c0)
  dentro('Watson: i piedi a terra', cane.sotto, -0.02, 0.03)
  dentro('Watson: è un cane grande (lungo)', cane.lunghezza, 0.9, 1.6)
  dentro('Watson: ma non è alto più dell\'eroe', cane.altezza, 0.7, 1.1)
  dentro('Watson: pochi mesh', cane.mesh, 15, 45)
  dentro('Watson: il pelo a ciocche resta sotto gli 8000 triangoli', cane.triangoli, 3000, 8000)
  // niente coda a vista: il punto più indietro è il moncherino, che non sporge più di un palmo oltre il corpo
  const dietro = (() => { const b = new THREE.Box3().setFromObject(creaCane()); return -b.min.z })()
  dentro('Watson: dietro non sporge niente di lungo (il bobtail non ha coda)', dietro, 0.3, 0.75)
  for (const v of ['bianconero', 'rosso', 'nero']) {
    const gg = creaGatto(v); posaGatto(gg, { stato: 'sta' }); const m = misure(gg)
    dentro(`gatto ${v}: piedi a terra`, m.sotto, -0.02, 0.03)
    dentro(`gatto ${v}: piccolo`, m.altezza, 0.3, 0.75)
    dentro(`gatto ${v}: pochi mesh`, m.mesh, 15, 45)
  }
  const gatto = creaGatto('rosso'), cane2 = creaCane()
  controlla('ogni compagno ha la zona del tocco', !!gatto.userData.colpo && !!cane2.userData.colpo && gatto.userData.colpo.visible === false)
  uguale('creaCompagno per un cane', creaCompagno(compagniAl(3)[0]).userData.tipo, 'cane')
  uguale('creaCompagno per un gatto', creaCompagno(compagniAl(5)[1]).userData.tipo, 'gatto')
  // geometrie condivise: due cani non ne duplicano
  const geoA = new Set(), geoB = new Set()
  creaCane().traverse(o => o.isMesh && geoA.add(o.geometry.uuid)); creaCane().traverse(o => o.isMesh && geoB.add(o.geometry.uuid))
  controlla('le geometrie sono condivise fra due cani', [...geoA].every(k => geoB.has(k)))
  // le pose non rompono niente, in nessuno stato, a nessun tempo
  let guasto = ''
  const finito = o => { o.updateMatrixWorld(true); o.traverse(x => { if (!isFinite(x.position.x + x.position.y + x.position.z + x.rotation.x + x.rotation.y + x.rotation.z + x.scale.x + x.scale.y + x.scale.z)) guasto = x.type }) }
  for (const stato of ['sta', 'siede', 'annusa', 'dorme', 'festa', 'vaga'])
    for (const t of [0, 0.7, 3.3]) { posaCane(cane2, { stato, vel: stato === 'vaga' ? 0.8 : 0, fase: t * 7, t, p: 0.5 }); finito(cane2) }
  for (const stato of ['sta', 'siede', 'lava', 'dorme', 'stiracchia', 'fusa', 'vaga'])
    for (const t of [0, 0.7, 3.3]) { posaGatto(gatto, { stato, vel: stato === 'vaga' ? 0.8 : 0, fase: t * 7, t, p: 0.5 }); finito(gatto) }
  uguale('le pose non producono numeri sbagliati', guasto, '')
  posaCane(cane2, { stato: 'siede' }); const seduto = misure(cane2)
  controlla('Watson seduto è più basso di dietro e non affonda nel suolo', seduto.sotto > -0.05, String(seduto.sotto))
  posaCane(cane2, { stato: 'dorme' }); controlla('Watson che dorme sta basso (meno di due terzi di quando sta in piedi: la testa grande non si schiaccia)', misure(cane2).altezza < 0.66 * cane.altezza, String(misure(cane2).altezza))
  posaGatto(gatto, { stato: 'dorme' }); controlla('il gatto che dorme sta sotto i 30 cm', misure(gatto).altezza < 0.35, String(misure(gatto).altezza))
}

/* ══════════ 5. tre minuti sulla scena, col motore vero ══════════ */
{
  const mondoVero = esp => {
    const b = { monete: 100000 }, t = { ora: 1_000_000 }
    const f = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
    f.s.esperienza = esp
    return f
  }
  const f = mondoVero(sogliaDi(13))
  const scena = new THREE.Scene()
  const eroe = { x: 0.5, z: 5.5, az: null, percorso: [], get fermo() { return !this.az && !this.percorso.length } }
  const fx = { volo() {}, scoppietta() {}, parla() {} }
  const avvisi = []
  let seme = 3; const rnd = () => (seme = (seme * 9301 + 49297) % 233280) / 233280
  const c = new Compagni(scena, f, eroe, fx, { avviso: t => avvisi.push(t) }, rnd)
  uguale('al caricamento ci sono tutti e quattro', c.lista.length, 4)
  uguale('…e senza avvisi (non sono novità)', avvisi.length, 0)
  controlla('ognuno parte su una cella libera', c.lista.every(k => f.libera(Math.floor(k.x), Math.floor(k.z))))
  const dt = 0.05; let tt = 0, fuori = 0, sbagliati = 0
  const spostaEroe = () => { eroe.x += (rnd() - 0.5) * 0.8; eroe.z += (rnd() - 0.5) * 0.8; eroe.percorso = rnd() < 0.5 ? [[0, 0]] : []; eroe.az = rnd() < 0.2 ? { tipo: 'semina' } : null }
  for (let n = 0; n < 3600; n++) {
    tt += dt
    if (n % 40 === 0) spostaEroe()
    if (n === 1200) { for (const [i, j] of [[0, 4], [1, 4], [0, 5], [1, 5]]) if (f.libera(i, j)) f.s.cose.push({ id: 900 + i * 10 + j, tipo: 'campo', i, j }) }
    c.aggiorna(dt, tt)
    for (const k of c.lista) {
      if (!isFinite(k.x + k.z) || !isFinite(k.grp.position.y)) sbagliati++
      if (!k.sopra && !k.salto && !f.libera(Math.floor(k.x), Math.floor(k.z))) fuori++
    }
  }
  uguale('in tre minuti nessun compagno ha numeri sbagliati', sbagliati, 0)
  controlla('…e quasi mai su una cella bloccata (a un pezzo appena messo sotto i piedi ci si sposta)', fuori < 40, `${fuori} fotogrammi su ${3600 * 4}`)
  controlla('si sono mossi davvero', c.lista.every(k => Math.hypot(k.x - 0.5, k.z + 6.5) > 0.5 || k.stato !== 'sta'))
  // l'arrivo di un livello nuovo
  const f2 = mondoVero(sogliaDi(2)), av2 = []
  const c2 = new Compagni(new THREE.Scene(), f2, eroe, fx, { avviso: t => av2.push(t) }, rnd)
  uguale('al livello 2 non c\'è nessuno', c2.lista.length, 0)
  f2.s.esperienza = sogliaDi(3); c2.aggiorna(0.05, 1); c2.aggiorna(0.05, 2); for (let n = 0; n < 30; n++) c2.aggiorna(0.05, 2 + n * 0.05)
  uguale('salendo al 3 arriva Watson', c2.lista.map(k => k.def.id).join(), 'watson')
  uguale('…con il suo avviso', av2.join('|'), 'Watson è arrivato!')
  // il tocco
  const volati = []; c2.fx = { ...fx, volo: t => volati.push(t) }
  c2.tocca(c2.lista[0]); uguale('toccato, Watson abbaia', volati[0], 'Bau!'); uguale('…e fa festa', c2.lista[0].stato, 'festa')
  const rg = new THREE.Raycaster(); const p = c2.lista[0].grp.position
  c2.aggiorna(0.05, 3); c2.lista[0].grp.updateMatrixWorld(true)
  rg.set(new THREE.Vector3(p.x, 5, p.z), new THREE.Vector3(0, -1, 0))
  uguale('il raggio dall\'alto colpisce Watson', c2.bersaglio(rg)?.def.id, 'watson')
}

riassunto('fattoria3d-compagni')
