/* I tre stadi delle bestie (fame, al lavoro, pronta) di gallina, mucca e pecora: il profilo puro (scena3d/bestie-puro.js, soglie, monotonia,
   nessun NaN, il giro fame→lavora→pronta→fame) e i modelli che lo applicano (ingombro, nessun NaN, i nodi nuovi ricollegati nel clone della
   cache, l'uovo e il secchio visibili solo da pronte). Senza browser. Docs: docs/fattoria3d/animali.md, «I tre stadi».
   `node test/esegui.mjs fattoria3d-bestie`
   tempo: 1 */
import { statoDaFine, statoPecora, progressoBestia, progressoPecora, stadioBestia, pienezza, profiloBestia, avvicina, SPECIE, PIENO_MIN, PIENO_MAX } from '../../src/giochi/fattoria3d/scena3d/bestie-puro.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const M = await import('../../src/giochi/fattoria3d/scena3d/modelli.js')
const { ANIMALI } = await import('../../src/giochi/fattoria3d/dati/animali.js')
const { PECORE } = await import('../../src/giochi/fattoria3d/dati/regole.js')

/* ══════════ 1. lo stato, il progresso, lo stadio ══════════ */
{
  const T = 1e6
  uguale('fame: fine null', statoDaFine(null, T), 'fame')
  uguale('lavora: fine nel futuro', statoDaFine(T + 5, T), 'lavora')
  uguale('pronta: fine passata o ora', [statoDaFine(T - 1, T), statoDaFine(T, T)].join(), 'pronta,pronta')
  uguale('pecora: t0 null = fame', statoPecora(null, T, 25000), 'fame')
  uguale('pecora: a metà lavora, a fine pronta', [statoPecora(T - 1000, T, 25000), statoPecora(T - 25000, T, 25000)].join(), 'lavora,pronta')
  const ms = ANIMALI.stalla.ms
  uguale('progresso: appena nutrita 0', progressoBestia(T + ms, T, ms), 0)
  uguale('progresso: a metà 0,5', progressoBestia(T + ms / 2, T, ms), 0.5)
  uguale('progresso: pronta 1, fame 0', [progressoBestia(T - 5, T, ms), progressoBestia(null, T, ms)].join(), '1,0')
  uguale('progresso: oltre il tempo (catalogo) resta 0', progressoBestia(T + 9e6, T, ms), 0)
  uguale('progresso: ms sbagliato non dà NaN', progressoBestia(T + 5, T, 0), 1)
  uguale('pecora: progresso a metà', progressoPecora(T - PECORE.laneMs / 2, T, PECORE.laneMs), 0.5)
  uguale('stadi dallo stato', [stadioBestia('fame', 0.9), stadioBestia('lavora', 0.4), stadioBestia('lavora', 1), stadioBestia('pronta', 1)].join(), '0,1,2,2')
  uguale('pienezza: 0, estremi del lavoro, 1', [pienezza(0, 0.5), pienezza(1, 0), pienezza(1, 1), pienezza(2, 0)].join(), [0, PIENO_MIN, PIENO_MAX, 1].join())
}

/* ══════════ 2. il profilo: nessun NaN, estremi, monotonia, giro ══════════ */
{
  for (const sp of SPECIE) {
    let nan = 0
    for (const st of [0, 1, 2]) for (let p = 0; p <= 1.0001; p += 0.1) for (const [k, v] of Object.entries(profiloBestia(sp, st, p))) if (!Number.isFinite(v)) nan++
    uguale(sp + ': nessun valore non finito in nessuno stadio', nan, 0)
  }
  const m0 = profiloBestia('mucca', 0, 0), m1 = profiloBestia('mucca', 1, 0.5), m2 = profiloBestia('mucca', 2, 1)
  controlla('mucca a fame: corpo ridotto di circa il 30%', m0.sx <= 0.72 && m0.sy <= 0.68)
  controlla('mucca pronta: tonda (oltre il 100%)', m2.sx >= 1 && m2.sy >= 1)
  controlla('mucca: la testa è più bassa a fame e più alta da pronta', m0.testaY < m1.testaY && m1.testaY < m2.testaY && m0.testaX > m2.testaX)
  controlla('mucca: la mammella cresce, la pallida sparisce', m0.mammella < m1.mammella && m1.mammella < m2.mammella && m0.pallida === 1 && m2.pallida === 0)
  controlla('mucca: secchio, alone e scintillio solo da pronta', m0.dono === 0 && m1.dono === 0 && m2.dono === 1 && m0.alone === 0 && m2.alone === 1 && m2.scintilla === 1)
  controlla('mucca: la goccia di latte solo al lavoro oltre un terzo', profiloBestia('mucca', 1, 0.1).goccia === 0 && profiloBestia('mucca', 1, 0.6).goccia === 1 && m2.goccia === 0)
  const g0 = profiloBestia('gallina', 0, 0), g1 = profiloBestia('gallina', 1, 0.5), g2 = profiloBestia('gallina', 2, 1)
  controlla('gallina a fame: niente uovo, piccola e appiattita', g0.uovo === 0 && g0.sy < 0.6 && g0.sx < 0.8)
  controlla('gallina: l\'uovo cresce col progresso, da pronta è enorme', profiloBestia('gallina', 1, 0).uovo > 0 && g1.uovo > profiloBestia('gallina', 1, 0).uovo && g2.uovo > g1.uovo && g2.uovo >= 2.5)
  controlla('gallina pronta: sollevata sull\'uovo, cresta dritta, zampe penzoloni', g2.altoY > g1.altoY && g1.altoY > g0.altoY && g2.cresta > g0.cresta && g2.gAperta > 0 && g2.gLen <= 0.1)
  controlla('gallina pronta: sta ferma sull\'uovo e dondola', g2.passo === 0 && g2.ondeggia === 1 && g0.ondeggia === 0 && g0.passo === 1)
  controlla('gallina: il corpo sta sopra l\'uovo', g2.altoY + 0.17 - 0.11 * 0.9 * g2.sy >= 0.09 * g2.uovo * 0.8)
  const p0 = profiloBestia('pecora', 0, 0), p1 = profiloBestia('pecora', 1, 0.5), p2 = profiloBestia('pecora', 2, 1)
  controlla('pecora tosata: niente lana, orecchie giù, pelle magra', p0.lana === 0 && p0.orecchie < -1 && p0.pelleY < 0.75)
  controlla('pecora: la lana ricresce, da pronta oltre 1,25 e coi riccioli', p0.lana < p1.lana && p1.lana < p2.lana && p2.lana >= 1.25 && p0.ricci0 === 0 && p2.ricci0 === 1 && p2.ricci1 === 1 && p2.ricci2 === 1)
  controlla('pecora: i riccioli arrivano a gradini', profiloBestia('pecora', 1, 0.3).ricci0 === 0 && profiloBestia('pecora', 1, 0.7).ricci0 > 0 && profiloBestia('pecora', 1, 0.7).ricci2 < 1)
  // monotonia: durante il lavoro nulla va all'indietro (si riempie, mai si sgonfia)
  const cresce = { mucca: ['sx', 'sy', 'sz', 'testaY', 'mammella', 'coda', 'lento'], gallina: ['sx', 'sy', 'uovo', 'altoY', 'cresta', 'gX'], pecora: ['lana', 'ricci0', 'ricci1', 'ricci2', 'pelleX', 'pelleY'] }
  for (const sp of SPECIE) {
    let giu = 0, prec = null
    for (let p = 0; p <= 1.0001; p += 0.02) { const x = profiloBestia(sp, 1, p, {}); if (prec) for (const k of cresce[sp]) if (x[k] < prec[k] - 1e-9) giu++; prec = x }
    // …e dal fondo del lavoro alla pronta, e dalla fame all'inizio del lavoro
    const ult = profiloBestia(sp, 1, 1), pr = profiloBestia(sp, 2, 1), f0 = profiloBestia(sp, 0, 0), i0 = profiloBestia(sp, 1, 0)
    for (const k of cresce[sp]) { if (pr[k] < ult[k] - 1e-9) giu++; if (i0[k] < f0[k] - 1e-9) giu++ }
    uguale(sp + ': nutrire riempie, aspettare riempie, mai il contrario', giu, 0)
  }
  // il giro: fame → lavora → pronta → fame, il filo `f`
  const giro = [[0, 0], [1, 0], [1, 0.5], [1, 0.99], [2, 1], [0, 0]].map(([s, p]) => profiloBestia('mucca', s, p).f)
  controlla('il giro: f sale da 0 a 1 e poi torna a 0', giro.slice(0, 5).every((x, i, a) => !i || x > a[i - 1]) && giro[5] === 0)
  controlla('soglie: lavora parte sopra la fame e finisce sotto la pronta', PIENO_MIN > 0 && PIENO_MAX < 1)
  // smussare: si arriva al bersaglio in circa mezzo secondo, mai oltre; il primo fotogramma si copia
  const a = {}, b = { x: 1, dono: 1 }; avvicina(a, b, 0.016); uguale('il primo fotogramma copia il bersaglio', a.x, 1)
  let c = { x: 0, dono: 0 }; const tg = { x: 1, dono: 1 }; for (let i = 0; i < 25; i++) avvicina(c, tg, 0.016, { dono: true })
  controlla('in 0,4 s si è a più di metà, e il prodotto (veloce) di più', c.x > 0.5 && c.x < 1 && c.dono > c.x)
}

/* ══════════ 3. i modelli ══════════ */
{
  const adesso = Date.now()
  const stati = {
    fame: { fine: null }, lavora: { fine: adesso + ANIMALI.pollaio.ms * 0.5 }, pronta: { fine: adesso - 1000 },
  }
  const alto = g => { const b = new THREE.Box3().setFromObject(g); return b }
  for (const [nome, crea, specie] of [['gallina', () => M.creaGallina(0), 'gallina'], ['mucca', () => M.creaMucca(0), 'mucca']]) {
    for (const [stadio, st] of Object.entries(stati)) {
      const b = crea(); b.userData.attesa = 1e9
      const casa = { userData: { bestie: [b] } }
      for (let i = 0; i < 40; i++) M.muoviBestie(casa, 0.05, i * 0.05, [st], adesso)
      const box = alto(b), pieno = Number.isFinite(box.min.y) && Number.isFinite(box.max.x)
      controlla(`${nome} ${stadio}: l'ingombro è un numero e i piedi non sono sotto terra`, pieno && box.min.y > -0.05)
      controlla(`${nome} ${stadio}: sta in un metro e mezzo per il lato`, box.max.x - box.min.x < 1.5 && box.max.z - box.min.z < 1.5 && box.max.y < 1.5)
      const dono = b.userData.dono.visible
      controlla(`${nome} ${stadio}: il prodotto si vede ${specie === 'mucca' ? '(il secchio)' : '(l\'uovo)'} solo se c'è qualcosa`, specie === 'mucca' ? dono === (stadio === 'pronta') : dono === (stadio !== 'fame'))
      controlla(`${nome} ${stadio}: alone e scintillio solo da pronta`, b.userData.alone.visible === (stadio === 'pronta'))
      let nan = 0; b.traverse(o => { for (const v of [o.position.x, o.position.y, o.position.z, o.scale.x, o.scale.y, o.scale.z, o.rotation.x, o.rotation.z]) if (!Number.isFinite(v)) nan++ })
      uguale(`${nome} ${stadio}: nessuna posa non finita`, nan, 0)
    }
  }
  // la mucca: da fame a pronta il corpo cresce e le zampe restano le stesse (nodo `corpo` sì, non il prodotto)
  const mf = M.creaMucca(0), mp = M.creaMucca(0)
  M.muoviBestie({ userData: { bestie: [mf] } }, 0.05, 0, [stati.fame], adesso); M.muoviBestie({ userData: { bestie: [mp] } }, 0.05, 0, [stati.pronta], adesso)
  controlla('mucca: la pronta ha il corpo più grande e la testa più alta della affamata', mp.userData.corpo.scale.x > mf.userData.corpo.scale.x * 1.4 && mp.userData.testa.position.y > mf.userData.testa.position.y)
  controlla('mucca: la pronta ha la mammella rosea, la affamata la pallida', mp.userData.mammella.visible && !mf.userData.mammella.visible && mf.userData.pallida.visible && !mp.userData.pallida.visible)
  // la gallina pronta è su, con l'uovo enorme; la affamata è bassa
  const gf = M.creaGallina(0), gp = M.creaGallina(0)
  M.muoviBestie({ userData: { bestie: [gf] } }, 0.05, 0, [stati.fame], adesso); M.muoviBestie({ userData: { bestie: [gp] } }, 0.05, 0, [stati.pronta], adesso)
  controlla('gallina: pronta, il corpo è molto più in alto e l\'uovo è enorme', gp.userData.alto.position.y > gf.userData.alto.position.y + 0.15 && gp.userData.uovo.scale.y > 2.5 * 1.05 * 0.99)
  // i nodi nuovi si ricollegano nel clone della cache: il clone anima sé stesso, non l'originale
  const c1 = M.creaMucca(0), c2 = M.creaMucca(0)
  controlla('mucca: i nodi nuovi sono del clone', ['mammella', 'pallida', 'goccia', 'alone', 'scintilla', 'sbuffo', 'dono'].every(k => c1.userData[k] && c1.userData[k] !== c2.userData[k] && c1.getObjectById(c1.userData[k].id)))
  const h1 = M.creaGallina(0), h2 = M.creaGallina(0)
  controlla('gallina: i nodi nuovi sono del clone', ['alto', 'cresta', 'alone', 'scintilla', 'sbuffo', 'uovo'].every(k => h1.userData[k] && h1.userData[k] !== h2.userData[k] && h1.getObjectById(h1.userData[k].id)) && h1.userData.zampe.every((z, i) => z !== h2.userData.zampe[i]))
  M.muoviBestie({ userData: { bestie: [c1] } }, 0.05, 0, [stati.pronta], adesso)
  controlla('…e muovere un clone non muove l\'altro', c1.userData.dono.visible && !c2.userData.dono.visible && !c2.userData.pr)
  // raccogliere: pronta → fame, c'è lo sbuffo e il secchio sparisce senza mai tornare grande
  let grande = 0
  M.muoviBestie({ userData: { bestie: [c1] } }, 0.05, 0, [{ fine: null }], adesso); const sbuffo = c1.userData.sbuffo.visible
  for (let i = 0; i < 40; i++) { M.muoviBestie({ userData: { bestie: [c1] } }, 0.05, i * 0.05, [{ fine: null }], adesso); if (c1.userData.dono.scale.x > 1.51) grande++ }
  controlla('raccolta: lo sbuffo parte e il secchio sparisce', sbuffo && !c1.userData.dono.visible && grande === 0)
  // nutrire: la mucca affamata si riempie, il corpo non diminuisce mai
  const m = M.creaMucca(1); let prec = 0, calo = 0, t0 = Date.now()
  for (let i = 0; i <= 200; i++) {
    const now = t0 + i * 200, st = { fine: i === 0 ? null : t0 + ANIMALI.stalla.ms }
    M.muoviBestie({ userData: { bestie: [m] } }, 0.2, i * 0.2, [st], now)
    const w = m.userData.corpo.scale.x; if (i > 2 && w < prec - 1e-6) calo++; prec = w
  }
  uguale('mucca nutrita: da affamata a pronta il corpo non si sgonfia mai', calo, 0)

  // la pecora: i tre stadi nel recinto
  const ora = Date.now(), r = M.creaRecinto([{ eta: 'adulta', t0: null }, { eta: 'adulta', t0: ora - PECORE.laneMs / 2 }, { eta: 'adulta', t0: ora - PECORE.laneMs - 1 }, { eta: 'agnello', t0: null }])
  r.userData.pecore.forEach(p => { p.userData.attesa = 1e9 })
  for (let i = 0; i < 30; i++) M.muoviPecore(r, 0.05, i * 0.05, null, [{ eta: 'adulta', t0: null }, { eta: 'adulta', t0: ora - PECORE.laneMs / 2 }, { eta: 'adulta', t0: ora - PECORE.laneMs - 1 }, { eta: 'agnello', t0: null }], ora)
  const [pf, pl, pp, pa] = r.userData.pecore.map(p => p.userData)
  controlla('pecora tosata: niente lana e pelle in vista', !pf.fiocchi.visible && pf.pelle.visible && pf.orecchie[0].rotation.z < -1)
  controlla('pecora al lavoro: la nuvola c\'è ma è più piccola di quella pronta, niente riccioli', pl.fiocchi.visible && pl.fiocchi.scale.x < pp.fiocchi.scale.x && !pl.ricci[2].visible)
  controlla('pecora pronta: nuvola oltre 1,25, tre riccioli, alone e scintilla', pp.fiocchi.scale.x >= 1.25 && pp.ricci.every(x => x.visible) && pp.alone.visible)
  controlla('l\'agnello non fa la pecora: lana in mezzo, niente alone', pa.fiocchi.visible && !pa.alone.visible && pa.orecchie[0].rotation.z > -0.5)
  for (const p of r.userData.pecore) { const b = new THREE.Box3().setFromObject(p); controlla('pecora: ingombro finito e piccolo', Number.isFinite(b.max.y) && b.max.y < 1.2 && b.min.y > -0.05) }
  // i nodi nuovi della pecora si ricollegano
  const s1 = M.creaPecora(), s2 = M.creaPecora()
  controlla('pecora: orecchie, riccioli, alone sono del clone', s1.userData.orecchie.every((o, i) => o !== s2.userData.orecchie[i] && s1.getObjectById(o.id)) && s1.userData.ricci.length === 3 && s1.userData.alone !== s2.userData.alone)
}

riassunto('Fattoria 3D — i tre stadi delle bestie')
