/* Verifica dei compagni della fattoria 3D (Watson, i gatti, il contadino nuovo), senza browser: i dati, la scelta delle mete (mai
   su una cella bloccata), i modelli (pochi mesh, piedi a terra, ingombro giusto, pose che non producono numeri sbagliati) e una
   simulazione di tre minuti con tutto il motore vero, col caso finto: non finiscono mai in una cella bloccata.
   `node test/esegui.mjs fattoria3d-compagni`
   tempo: 1 */
import { COMPAGNI, compagniAl, scegliMeta, cellaLiberaVicina, decidiCane, decidiGatto, durataDi, guastiDeiCompagni, ASPETTO_ERO,
  INTERAZIONI_CANE, scegliInterazioneCane, sequenzaCane, sequenzaRichiamo, sequenzaSonno, sequenzaSveglia, carezzaCane, scegliRispostaGatto, sequenzaGatto,
  sequenzaGattoSopra, incontroGattoCane, sequenzaIncontro, scegliMetaAttorno, SOGLIA_RICHIAMO } from '../../src/giochi/fattoria3d/dati/compagni.js'
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
uguale('al livello 1 c\'è già Watson', compagniAl(1).map(c => c.id).join(), 'watson')
uguale('al 2 si aggiunge Sherlock', compagniAl(2).map(c => c.id).join(), 'watson,sherlock')
uguale('al 3 anche Irene', compagniAl(3).map(c => c.id).join(), 'watson,sherlock,irene')
uguale('al 13 sono quattro', compagniAl(13).length, 4)
uguale('«soloQuesto»: al 3 arriva solo Irene', compagniAl(3, true).map(c => c.id).join(), 'irene')
uguale('roba(2) li raccoglie', roba(2).compagni.map(c => c.id).join(), 'sherlock')
controlla('un livello coi soli compagni non è «vuoto» per il conto di roba', roba(3).compagni.length === 1 && roba(3).compagni[0].id === 'irene' && !vuoto({ pezzi: [], edifici: [], colture: [], ricette: [] }) === false)
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
  uguale('il gatto vicino al cane non scappa più da solo', decidiGatto({ vicinoAlCane: true }, r(0.1)).stato, 'vaga')
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
    dentro(`${aspetto}: i mesh sono pochi (fusi per parte: gambe, busto, testa, bracci)`, m.mesh, 4, 12)
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
  for (const v of ['bianconero', 'calico', 'nero']) {
    const gg = creaGatto(v); posaGatto(gg, { stato: 'sta' }); const m = misure(gg)
    dentro(`gatto ${v}: piedi a terra`, m.sotto, -0.02, 0.03)
    dentro(`gatto ${v}: piccolo (orecchie grandi e coda alta: fino a 80 cm, meno di Watson)`, m.altezza, 0.3, 0.8)
    dentro(`gatto ${v}: pochi mesh (pelo fuso per pezzo)`, m.mesh, 12, 45)
  }
  const gatto = creaGatto('calico'), cane2 = creaCane()
  controlla('ogni compagno ha la zona del tocco', !!gatto.userData.colpo && !!cane2.userData.colpo && gatto.userData.colpo.visible === false)
  uguale('creaCompagno per un cane', creaCompagno(compagniAl(1)[0]).userData.tipo, 'cane')
  uguale('creaCompagno per un gatto', creaCompagno(compagniAl(2)[1]).userData.tipo, 'gatto')
  // geometrie condivise: due cani non ne duplicano
  const geoA = new Set(), geoB = new Set()
  creaCane().traverse(o => o.isMesh && geoA.add(o.geometry.uuid)); creaCane().traverse(o => o.isMesh && geoB.add(o.geometry.uuid))
  controlla('le geometrie sono condivise fra due cani', [...geoA].every(k => geoB.has(k)))
  // le pose non rompono niente, in nessuno stato, a nessun tempo
  let guasto = ''
  const finito = o => { o.updateMatrixWorld(true); o.traverse(x => { if (!isFinite(x.position.x + x.position.y + x.position.z + x.rotation.x + x.rotation.y + x.rotation.z + x.scale.x + x.scale.y + x.scale.z)) guasto = x.type }) }
  for (const stato of ['sta', 'siede', 'annusa', 'dorme', 'festa', 'vaga', 'alza', 'mano', 'zampa', 'rotola', 'salta', 'riporta', 'starnuta', 'gira', 'sbadiglia', 'incontra'])
    for (const t of [0, 0.7, 3.3]) for (const p of [0, 0.3, 0.5, 0.9, 1]) for (const sub of ['', 'annusa', 'scodinzola', 'lecca']) { posaCane(cane2, { stato, vel: stato === 'vaga' ? 0.8 : 0, fase: t * 7, t, p, sub }); finito(cane2) }
  for (const stato of ['sta', 'siede', 'lava', 'dorme', 'stiracchia', 'fusa', 'vaga', 'struscia', 'rotola', 'miao', 'volta', 'incontra'])
    for (const t of [0, 0.7, 3.3]) for (const p of [0, 0.5, 1]) for (const sub of ['', 'annusa', 'struscia', 'zampata', 'infastidito']) { posaGatto(gatto, { stato, vel: stato === 'vaga' ? 0.8 : 0, fase: t * 7, t, p, sub }); finito(gatto) }
  uguale('le pose non producono numeri sbagliati', guasto, '')
  // le pose nuove restano dentro l'ingombro: Watson non esce dal suo metro e mezzo, e non affonda nel suolo; il gatto idem
  for (const stato of ['zampa', 'rotola', 'salta', 'riporta', 'starnuta', 'gira', 'sbadiglia', 'mano', 'alza', 'incontra'])
    for (const p of [0.1, 0.5, 0.9]) {
      posaCane(cane2, { stato, t: 1.3, p, fase: 2, sub: 'annusa' }); const m = misure(cane2)
      controlla(`Watson «${stato}» a ${p}: ingombro e piedi`, m.altezza < 1.7 && m.lunghezza < 1.9 && m.larghezza < 1.5 && m.sotto > -0.25, JSON.stringify(m))
    }
  for (const stato of ['struscia', 'rotola', 'miao', 'volta', 'incontra'])
    for (const p of [0.1, 0.5, 0.9]) {
      posaGatto(gatto, { stato, t: 1.3, p, sub: 'zampata' }); const m = misure(gatto)
      controlla(`gatto «${stato}» a ${p}: ingombro e piedi`, m.altezza < 1.1 && m.lunghezza < 1.3 && m.larghezza < 0.9 && m.sotto > -0.25, JSON.stringify(m))
    }
  { const b = cane2.userData.bastone; posaCane(cane2, { stato: 'riporta', p: 0.2 }); const col = b.visible; posaCane(cane2, { stato: 'riporta', p: 0.8 }); const poi = b.visible; posaCane(cane2, { stato: 'sta' })
    controlla('il bastoncino si vede in bocca solo prima di posarlo', col && !poi && !b.visible) }
  { const m = misure(creaCane()), n = creaCane(); n.userData.bastone.removeFromParent()
    controlla('il bastoncino costa un mesh e ~20 triangoli', m.mesh - misure(n).mesh <= 1 && m.triangoli - misure(n).triangoli < 60, `${m.mesh - misure(n).mesh}`) }
  posaCane(cane2, { stato: 'siede' }); const seduto = misure(cane2)
  controlla('Watson seduto è più basso di dietro e non affonda nel suolo', seduto.sotto > -0.05, String(seduto.sotto))
  posaCane(cane2, { stato: 'dorme' }); controlla('Watson che dorme sta basso (meno di due terzi di quando sta in piedi: la testa grande non si schiaccia)', misure(cane2).altezza < 0.66 * cane.altezza, String(misure(cane2).altezza))
  posaGatto(gatto, { stato: 'dorme' }); controlla('il gatto che dorme sta basso (sotto i 48 cm: le orecchie grandi contano)', misure(gatto).altezza < 0.48 && misure(gatto).sotto > -0.03, String(misure(gatto).altezza))
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
  const f2 = mondoVero(sogliaDi(1)), av2 = []
  const c2 = new Compagni(new THREE.Scene(), f2, eroe, fx, { avviso: t => av2.push(t) }, rnd)
  uguale('al livello 1 c\'è già Watson, senza avviso', c2.lista.map(k => k.def.id).join() + av2.length, 'watson0')
  f2.s.esperienza = sogliaDi(2); c2.aggiorna(0.05, 1); c2.aggiorna(0.05, 2); for (let n = 0; n < 30; n++) c2.aggiorna(0.05, 2 + n * 0.05)
  uguale('salendo al 2 arriva Sherlock', c2.lista.map(k => k.def.id).join(), 'watson,sherlock')
  uguale('…con il suo avviso', av2.join('|'), 'Sherlock, il gatto, è arrivato!')
  // il tocco semplice (l'eroe non sta fermo): il vecchio «Bau!»
  const volati = []; c2.fx = { ...fx, volo: t => volati.push(t) }
  eroe.az = { tipo: 'semina' }; eroe.percorso = []; { const w = c2.lista[0]; w.x = eroe.x + 2; w.z = eroe.z - 1; w.seq = null }
  c2.tocca(c2.lista[0]); uguale('toccato mentre l\'eroe lavora, Watson abbaia', volati[0], 'Bau!'); uguale('…e fa festa', c2.lista[0].stato, 'festa')
  eroe.az = null
  const rg = new THREE.Raycaster(); const p = c2.lista[0].grp.position
  c2.aggiorna(0.05, 3); c2.lista[0].grp.updateMatrixWorld(true)
  rg.set(new THREE.Vector3(p.x, 5, p.z), new THREE.Vector3(0, -1, 0))
  uguale('il raggio dall\'alto colpisce Watson', c2.bersaglio(rg)?.def.id, 'watson')
}

/* ══════════ 6. quando ci premi: le scelte pure ══════════ */
const generatore = seme => () => (seme = (seme * 16807) % 2147483647) / 2147483647
{
  const rnd = generatore(11)
  let ultima = null, doppie = 0; const viste = new Set()
  for (let n = 0; n < 4000; n++) { const i = scegliInterazioneCane(ultima, rnd); if (i === ultima) doppie++; viste.add(i); ultima = i }
  uguale('Watson non fa mai la stessa festa due volte di fila', doppie, 0)
  uguale('…e le fa tutte (otto)', viste.size, 8)
  uguale('nessuna interazione fuori dall\'elenco', [...viste].every(i => INTERAZIONI_CANE.includes(i)), true)
  uguale('con un caso al massimo non esce dall\'elenco', INTERAZIONI_CANE.includes(scegliInterazioneCane(null, () => 0.9999999)), true)
  for (const id of INTERAZIONI_CANE) {
    const q = sequenzaCane(id), tot = q.reduce((a, x) => a + x.dur, 0)
    dentro(`la festa «${id}» dura fra 2 e 4,2 secondi`, tot, 2, 4.2)
    uguale(`la festa «${id}» apre con la base: scodinzola e «Bau!»`, q[0].stato === 'festa' && q[0].ev.some(e => e[1] === 'bau'), true)
    controlla(`la festa «${id}»: gli eventi cadono dentro il passo`, q.every(x => (x.ev || []).every(([t]) => t >= 0 && t < x.dur)))
  }
  uguale('il richiamo: alza la testa (0,4 s) e poi corre dall\'eroe', sequenzaRichiamo().map(x => x.stato || (x.va.corsa ? 'corri' : 'va')).join(), 'alza,corri')
  uguale('…e arriva a meno di due celle', sequenzaRichiamo()[1].va.r[1] <= 2, true)
  // le carezze
  let car = null, dorme = 0
  for (let n = 0; n < 6; n++) { car = carezzaCane(car, 100 + n * 2); if (car.dorme) dorme = n + 1 }
  uguale('alla sesta carezza ravvicinata Watson si addormenta', dorme, 6)
  uguale('…e il contatore riparte da zero', carezzaCane(car, 112).n, 1)
  uguale('carezze lontane nel tempo non si sommano', carezzaCane({ n: 5, ultimo: 100 }, 140).dorme, false)
  uguale('il sonno: si siede e poi dorme, con gli «Zzz»', sequenzaSonno(() => 0.5).map(x => x.stato).join() + sequenzaSonno(() => 0.5)[1].ev.length, 'siede,dorme3')
  uguale('svegliato: uno sbadiglio', sequenzaSveglia()[0].stato, 'sbadiglia')

  // i gatti: le percentuali (55/20/15/10, con un'indole per gatto)
  const conta = (variante, n = 40000) => { const r = generatore(5), c = { avvicina: 0, fusaQui: 0, volta: 0, buffo: 0 }; for (let k = 0; k < n; k++) c[scegliRispostaGatto(5, r, variante)]++; for (const k in c) c[k] /= n; return c }
  const comune = conta(null)
  dentro('gatto qualunque: si avvicina il 55%', comune.avvicina, 0.53, 0.57); dentro('…resta lì a fare le fusa il 20%', comune.fusaQui, 0.18, 0.22)
  dentro('…si volta il 15%', comune.volta, 0.13, 0.17); dentro('…fa una cosa buffa il 10%', comune.buffo, 0.08, 0.12)
  const sh = conta('bianconero'), ir = conta('calico'), pe = conta('nero')
  controlla('Sherlock accetta di avvicinarsi più spesso degli altri', sh.avvicina > ir.avvicina && sh.avvicina > pe.avvicina, `${sh.avvicina} ${ir.avvicina} ${pe.avvicina}`)
  controlla('Pepe è schivo: si volta più degli altri', pe.volta > sh.volta * 2 && pe.volta > ir.volta * 2, `${pe.volta}`)
  controlla('Irene è giocosa: la cosa buffa è la sua', ir.buffo > sh.buffo * 1.5 && ir.buffo > pe.buffo * 1.5, `${ir.buffo}`)
  controlla('la media dei tre gatti resta vicina al 55/20/15/10', Math.abs((sh.avvicina + ir.avvicina + pe.avvicina) / 3 - 0.55) < 0.06)
  const sS = sequenzaGatto('avvicina', 'bianconero', false), sI = sequenzaGatto('avvicina', 'calico', false, () => 0.1), sP = sequenzaGatto('avvicina', 'nero', false)
  uguale('Sherlock si siede composto a una cella e mezza, senza strusciarsi', [sS[0].va.r.join(), sS[1].stato].join(), '1.4,1.7,siede')
  uguale('Irene si struscia e poi si rotola', sI.map(x => x.stato || 'va').join(), 'va,struscia,rotola')
  uguale('Pepe si struscia e basta', sP.map(x => x.stato || 'va').join(), 'va,struscia')
  uguale('già vicino, il gatto che si strofina non cammina', sequenzaGatto('avvicina', 'nero', true).map(x => x.stato || 'va').join(), 'struscia')
  uguale('le fusa dov\'è: nessun movimento', sequenzaGatto('fusaQui', 'nero', false).map(x => x.stato).join(), 'fusa')
  uguale('l\'indifferenza: si stiracchia e si volta', sequenzaGatto('volta', 'nero', false).map(x => x.stato).join(), 'stiracchia,volta')
  uguale('la cosa buffa: il miagolio o la rotolata', ['miao', 'rotola'].join() , [sequenzaGatto('buffo', 'nero', false, () => 0.2)[0].stato, sequenzaGatto('buffo', 'nero', false, () => 0.8)[0].stato].join())
  uguale('sulla panchina si sveglia stiracchiandosi e resta', sequenzaGattoSopra().map(x => x.stato).join(), 'stiracchia,dorme')
  for (const v of ['bianconero', 'calico', 'nero']) for (const r of ['avvicina', 'fusaQui', 'volta', 'buffo'])
    controlla(`${v}/${r}: i passi hanno durata e i versi cadono dentro`, sequenzaGatto(r, v, false, () => 0.3).every(x => x.va || (x.dur > 0 && (x.ev || []).every(([t]) => t < x.dur))))

  // l'incontro gatto-cane: cooldown, di rado, la fuga quasi mai
  const rr = generatore(21); let ora = 0, prossimo = 0, saluti = 0, fughe = 0, prove = 0; const esiti = { struscia: 0, zampata: 0, lecca: 0 }, intervalli = []; let ultimoEsito = null
  for (let n = 0; n < 40000; n++) {
    ora += 0.5; prove++
    const r = incontroGattoCane({ dist: 1.5, ora, prossimo }, rr)
    if (r.esito) { if (ultimoEsito !== null) intervalli.push(ora - ultimoEsito); ultimoEsito = ora; r.esito === 'fuga' ? fughe++ : (saluti++, esiti[r.esito]++) }
    prossimo = r.prossimo
  }
  dentro('incontro: fra due incontri passano almeno 25 secondi', Math.min(...intervalli), 25, 1e9)
  dentro('incontro: in media 25-45 secondi (cooldown + attesa del 35%)', intervalli.reduce((a, b) => a + b, 0) / intervalli.length, 30, 50)
  controlla('la fuga è rara (~10% degli incontri) e il saluto è la regola', fughe / (fughe + saluti) > 0.06 && fughe / (fughe + saluti) < 0.14, `${fughe} fughe, ${saluti} saluti`)
  controlla('i tre saluti capitano tutti', Object.values(esiti).every(v => v > 100), JSON.stringify(esiti))
  uguale('troppo lontani: niente incontro', incontroGattoCane({ dist: 4, ora: 100, prossimo: 0 }, () => 0).esito, null)
  uguale('durante il cooldown: niente incontro', incontroGattoCane({ dist: 1, ora: 10, prossimo: 30 }, () => 0).esito, null)
  controlla('incontro con un caso al minimo: saluto o fuga, mai un errore', ['fuga', 'struscia', 'zampata', 'lecca'].includes(incontroGattoCane({ dist: 1, ora: 10, prossimo: 0 }, () => 0).esito))
  for (const e of ['struscia', 'zampata', 'lecca']) {
    const q = sequenzaIncontro(e)
    controlla(`incontro «${e}»: va dal cane, annusa naso a naso, poi l'esito`, q[0].va.verso === 'cane' && q[1].sub === 'annusa' && q[1].cane.sub === 'annusa' && q.length >= 3)
    controlla(`incontro «${e}»: il cane resta in posa un filo più del gatto`, q.every(x => !x.cane || x.cane.dur > x.dur))
  }
  uguale('la zampata: il gatto se ne va a coda alta', sequenzaIncontro('zampata').at(-1).va.verso, 'lontano')
  uguale('la lecconata: il gatto si lava, infastidito', sequenzaIncontro('lecca').map(x => x.sub || x.stato).join(), ',annusa,infastidito,lava')
  // scegliMetaAttorno: celle a distanza giusta, mai bloccate
  const libera = (i, j) => !(i === 3 && j === 3)
  let male = 0; for (let n = 0; n < 300; n++) { const m = scegliMetaAttorno({ libera, centro: [3.5, 3.5], rMin: 1, rMax: 1.9, rnd: rr }); const d = Math.hypot(m[0] + 0.5 - 3.5, m[1] + 0.5 - 3.5); if (!libera(...m) || d < 1 || d > 1.9) male++ }
  uguale('la meta attorno all\'eroe sta fra 1 e 1,9 celle ed è libera', male, 0)
  uguale('niente intorno: nessuna meta', scegliMetaAttorno({ libera: () => false, centro: [3.5, 3.5], rMin: 1, rMax: 2, rnd: rr }), null)
}

/* ══════════ 7. cinque minuti di tocchi sulla scena, col motore vero ══════════ */
{
  const mondoVero = esp => {
    const b = { monete: 100000 }
    const f = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
    f.s.esperienza = esp
    return f
  }
  const f = mondoVero(sogliaDi(13))
  const eroe = { x: 0.5, z: 5.5, az: null, percorso: [], dir: 0, get fermo() { return !this.az && !this.percorso.length }, faccia(v) { this.dir = Math.atan2(v.x - this.x, v.z - this.z); this.guardato = v },
    avvia(tipo, dur) { this.az = { tipo, t: 0, dur } } }
  const dette = [], versi = []
  const fx = { volo: t => versi.push(t), scoppietta() {}, parla: t => dette.push(t) }
  const rnd = generatore(99)
  const c = new Compagni(new THREE.Scene(), f, eroe, fx, { avviso() {} }, rnd)
  const cane = c.lista.find(k => k.tipo === 'cane'), gatti = c.lista.filter(k => k.tipo === 'gatto')
  const dt = 0.05; let tt = 0
  const passa = sec => { for (let n = 0; n < sec / dt; n++) { tt += dt; if (eroe.az && (eroe.az.t += dt) >= eroe.az.dur) eroe.az = null; c.aggiorna(dt, tt); controlli() } }
  const coppie = new Set(); let fuori = 0, sovrapposti = 0, sbagliati = 0; const dallaSeq = new Map(), troppo = []
  const controlli = () => {
    for (const k of c.lista) {
      if (!isFinite(k.x + k.z + k.dir)) sbagliati++
      if (!k.sopra && !k.salto && !f.libera(Math.floor(k.x), Math.floor(k.z))) fuori++
      if (k.seq) { if (!dallaSeq.has(k)) dallaSeq.set(k, tt); else if (tt - dallaSeq.get(k) > 40) { troppo.push(k.def.id); dallaSeq.set(k, tt + 1e6) } } else dallaSeq.delete(k)
    }
    for (let a = 0; a < c.lista.length; a++) for (let b = a + 1; b < c.lista.length; b++) if (!c.lista[a].velo && !c.lista[b].velo && Math.hypot(c.lista[a].x - c.lista[b].x, c.lista[a].z - c.lista[b].z) < 0.2) { sovrapposti++; coppie.add(`${c.lista[a].def.id}+${c.lista[b].def.id}:${c.lista[a].stato}/${c.lista[b].stato}`) }
  }
  passa(20)
  // 1. Watson lontano: «Watson!», alza la testa, corre, arriva a meno di due celle e fa festa
  cane.x = eroe.x + 12; cane.z = eroe.z - 3; cane.percorso = []; cane.seq = null; cane.stato = 'sta'; cane.tStato = 0; cane.dur = 99
  if (!f.libera(Math.floor(cane.x), Math.floor(cane.z))) { const v = cellaLiberaVicina((i, j) => f.libera(i, j), cane.x, cane.z); cane.x = v[0] + 0.5; cane.z = v[1] + 0.5 }
  dette.length = 0; versi.length = 0
  c.tocca(cane)
  uguale('toccato lontano: il contadino dice «Watson!»', dette[0], 'Watson!')
  uguale('…si gira verso di lui e fa il gesto', [eroe.guardato.x === cane.x, eroe.az?.tipo].join(), 'true,chiama')
  const lontano = Math.hypot(cane.x - eroe.x, cane.z - eroe.z)
  passa(0.2); uguale('Watson alza la testa', cane.stato, 'alza')
  let tArrivo = -1; for (let n = 0; n < 400 && tArrivo < 0; n++) { passa(0.05); if (Math.hypot(cane.x - eroe.x, cane.z - eroe.z) <= 2) tArrivo = n * 0.05 }
  controlla(`il richiamo lo porta a due celle in un tempo ragionevole (da ${lontano.toFixed(1)} celle)`, tArrivo >= 0 && tArrivo < 6, `arrivo a ${tArrivo}`)
  passa(0.5); controlla('…e fa la festa (ha abbaiato)', versi.includes('Bau!') && !!cane.seq)
  uguale('mentre la festa va un secondo tocco non la riavvia', (() => { const p = cane.seq, i = cane.iSeq; c.tocca(cane); return cane.seq === p && cane.iSeq === i })(), true)
  passa(8); controlla('la festa finisce da sola', !cane.seq)
  // 2. vicino: niente richiamo, subito la festa; tutte e otto le interazioni escono, mai due uguali di fila
  const fatte = []; let prima = null
  for (let n = 0; n < 40; n++) {
    cane.x = eroe.x + 1.8; cane.z = eroe.z - 0.5; cane.percorso = []; cane.seq = null; cane.stato = 'sta'; cane.carezze = null
    dette.length = 0; c.tocca(cane); if (dette.length) fatte.push('richiamo')
    const q = c.ultimaCane; fatte.push(q); if (q === prima) fatte.push('DOPPIA'); prima = q
    passa(5.5)
    eroe.az = null
  }
  controlla('vicino, nessun richiamo', !fatte.includes('richiamo'))
  controlla('…e mai la stessa festa due volte di fila', !fatte.includes('DOPPIA'))
  uguale('…ed escono tutte e otto', new Set(fatte).size, 8)
  controlla('i versi ci sono: Bau, Ciù, Hrrr, Zzz…', ['Bau!', 'Ciù!', 'Hrrr'].every(v => versi.includes(v)))
  // 3. il contatore di carezze: la sesta addormenta, la settima sveglia con uno sbadiglio
  cane.x = eroe.x + 1.8; cane.z = eroe.z - 0.5; cane.seq = null; cane.carezze = null; cane.stato = 'sta'
  for (let n = 0; n < 6; n++) { c.tocca(cane); passa(4.6) }
  uguale('dopo sei carezze ravvicinate Watson si addormenta contento', cane.stato, 'dorme')
  passa(3); versi.length = 0; c.tocca(cane); uguale('toccato che dorme: si sveglia con uno sbadiglio', cane.stato, 'sbadiglia')
  passa(4)
  // 4. i gatti: ogni tocco una risposta, nessuna si pianta
  for (let giro = 0; giro < 30; giro++) for (const g of gatti) { if (g.sopra) continue; g.seq = null; c.tocca(g); passa(2); eroe.az = null }
  passa(10)
  // 5. cinque minuti di tutto, con l'eroe che ogni tanto si muove e lavora: nessuno su una cella bloccata, sequenze che finiscono
  const incontri0 = c.incontri
  for (let n = 0; n < 5 * 60 / 3; n++) {
    if (n % 7 === 3) { eroe.x += (rnd() - 0.5) * 3; eroe.z += (rnd() - 0.5) * 3; eroe.percorso = [[0, 0]]; passa(1.5); eroe.percorso = [] }
    if (n % 11 === 5) { eroe.az = { tipo: 'semina', t: 0, dur: 1.5 }; passa(1) }
    const k = c.lista[Math.floor(rnd() * c.lista.length)]
    c.tocca(k); passa(3)
  }
  uguale('in tutto il tempo nessun numero sbagliato', sbagliati, 0)
  uguale('…nessun compagno su una cella bloccata', fuori, 0)
  controlla('…né due compagni fermi nello stesso punto', sovrapposti < 20, `${sovrapposti} fotogrammi: ${[...coppie].slice(0, 6).join(' ')}`)
  uguale('…nessuna sequenza che non finisce mai', troppo.join(), '')
  // gli incontri gatto-cane: ci sono, ma di rado, e restano a posto
  for (const k of c.lista) { k.seq = null; k.stato = 'sta'; k.tStato = 0 }
  eroe.percorso = []; eroe.az = null; passa(10)
  const i0 = c.incontri
  for (let n = 0; n < 600; n++) passa(1)
  controlla(`in dieci minuti ci sono incontri gatto-cane, ma pochi (${c.incontri - i0})`, c.incontri - i0 >= 2 && c.incontri - i0 < 80, String(c.incontri - i0))
  uguale('…e nessun compagno su una cella bloccata neanche dopo', fuori, 0)
  controlla('…nessuna sequenza bloccata', troppo.length === 0)
  controlla(`il richiamo vale oltre ${SOGLIA_RICHIAMO} celle`, SOGLIA_RICHIAMO === 4)
}

riassunto('fattoria3d-compagni')
