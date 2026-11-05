/* La cura sul prato (docs/fattoria3d/cura-sul-prato.md), senza browser: ogni animale nasce con la sua ciotola col nome, la tinozza arriva col primo, il prezzo sale come per il
   terreno, chi ha fame insiste solo se c'è qualcosa da dargli, la scappatoia a monete c'è sempre, giocare riempie solo chi non è felice, lavare lo lascia pulito, chi aveva già
   gli animali trova ciotole e tinozza. In scena: va alla ciotola, uno alla volta ti chiama, mangia, fa il bagno, si annoia.
   `node test/esegui.mjs fattoria3d-cura-prato`
   tempo: 1 */
import * as THREE from 'three'
import { BESTIE, CURATI, RINCARO_ADOZIONE, prezzoAdozione, FAME, FELICE, NOIA, SPORCO, FONDO, sporcoDi, ciboChiesto, cibiPer, cibiComprati } from '../../src/giochi/fattoria3d/dati/bestie.js'
import { PEZZI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { schedeDi } from '../../src/giochi/fattoria3d/dati/carte.js'
import { scegliNoia, sequenzaNoia, sequenzaFame, sequenzaPasto } from '../../src/giochi/fattoria3d/dati/compagni.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { adottaCompagni } from '../aiuto/adozioni.mjs'
import { controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : k === 'measureText' ? () => ({ width: 10 }) : () => ({ addColorStop () {} })), set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const { Compagni } = await import('../../src/giochi/fattoria3d/scena3d/compagni.js')
const { preparaSporco, impostaSporco } = await import('../../src/giochi/fattoria3d/scena3d/sporco.js')
const { creaBestia } = await import('../../src/giochi/fattoria3d/scena3d/modelli-bestie.js')

const ORA = 1_000_000_000_000, ORE = 3600_000
const motore = ({ liv = 70, monete = 1000, t = { ora: ORA }, stato = null } = {}) => {
  const b = { monete }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  f.s.esperienza = Math.max(f.s.esperienza, sogliaDi(liv))
  return { f, b, t }
}

/* ══════════ la ciotola e la tinozza nascono con gli animali ══════════ */
{
  const { f, b } = motore()
  uguale('senza animali né ciotole né tinozza', f.s.cose.filter(c => PEZZI[c.tipo]?.dono).length, 0)
  const r = f.cura.compra('labrador')
  const k = f.cura.ciotolaDi('labrador')
  controlla('il labrador nasce con la sua ciotola', r.ok && !!k && k.bestia === 'labrador')
  controlla('e arriva la tinozza', !!f.cura.tinozza())
  uguale('il prezzo è quello della razza', r.costo, BESTIE.labrador.prezzo)
  uguale('la ciotola è nel prezzo', 1000 - b.monete, BESTIE.labrador.prezzo)
  f.cura.compra('beagle')
  uguale('una ciotola per animale, tinozza una sola', [f.s.cose.filter(c => c.tipo === 'ciotola_bestia').length, f.s.cose.filter(c => c.tipo === 'tinozza').length].join(), '2,1')
  uguale('la ciotola non si compra', f.compraPezzo('ciotola_bestia').motivo, 'non-in-vendita')
  uguale('non si mette via', f.mettiVia(k.id).motivo, 'dono')
  const [i, j] = [k.i + 2, k.j + 2], prima = b.monete
  const s = f.spostaPezzo(k.id, i, j)
  controlla('si sposta dove vuoi', s.ok && k.i === i && k.j === j, JSON.stringify(s))
  uguale('gratis', prima - b.monete, 0)
  const schede = Object.values(schedeDi({ stagione: '', livello: 99, prezzoPezzo: () => 1, nelMagazzino: () => 0, posseduti: {}, bestieTue: [] })).flat()
  controlla('non stanno nel menu', !schede.some(c => c.id === 'ciotola_bestia' || c.id === 'tinozza'))
  const letta = motore({ stato: JSON.parse(JSON.stringify(f.s)) }).f
  controlla('la ciotola si salva col suo padrone', letta.cura.ciotolaDi('labrador')?.i === i)
  uguale('rileggendo non ne nascono altre', letta.s.cose.filter(c => c.tipo === 'ciotola_bestia').length, 2)
}
{
  const { f } = motore()
  adottaCompagni(f, ['watson', 'sherlock'])
  f.s.cose = f.s.cose.filter(c => !PEZZI[c.tipo]?.dono)
  const stato = JSON.parse(JSON.stringify(f.s))
  const g = motore({ stato }).f
  controlla('chi aveva già gli animali trova le ciotole', !!g.cura.ciotolaDi('watson') && !!g.cura.ciotolaDi('sherlock'))
  controlla('e la tinozza', !!g.cura.tinozza())
  stato.cose.push({ id: 900, tipo: 'ciotola_bestia', i: 3, j: 3, bestia: 'fantasma' })
  uguale('una ciotola senza padrone si butta', motore({ stato }).f.s.cose.filter(c => c.bestia === 'fantasma').length, 0)
  const vicino = new Fattoria3d({ stato: { ...stato, cose: stato.cose.filter(c => !PEZZI[c.tipo]?.dono) }, magazzini: false, borsa: { quante: () => 0, paga: () => false }, ora: () => ORA, rnd: () => 0.5 })
  uguale('nella fattoria di un vicino non si mette niente', vicino.s.cose.filter(c => PEZZI[c.tipo]?.dono).length, 0)
}

/* ══════════ il prezzo sale come per il terreno ══════════ */
{
  uguale('lo scatto è quello del terreno', RINCARO_ADOZIONE, 20)
  uguale('con tre animali un labrador', prezzoAdozione(95, 3), 155)
  const { f } = motore({ monete: 100000 })
  const prezzi = ['coniglio', 'beagle', 'labrador'].map(id => [f.cura.prezzoDi(id), f.cura.compra(id).costo])
  uguale('il prezzo detto è quello pagato, e sale', prezzi.join(' '), '85,85 110,110 135,135')
  const carte = schedeDi({ stagione: '', livello: 99, prezzoPezzo: () => 1, nelMagazzino: () => 0, posseduti: {}, bestieTue: ['coniglio', 'beagle', 'labrador'] }).animali
  uguale('la carta dice il prezzo di adesso', carte.find(c => c.id === 'bestia:collie').etichetta, '🪙 ' + (100 + 60))
  const tutti = motore({ monete: 1e6 }).f, ids = [...Object.keys(BESTIE), ...Object.keys(CURATI)]
  let ultimo = 0
  for (const id of ids) { tutti.cura.casa[id] = undefined; delete tutti.cura.casa[id] }
  for (const id of ids) ultimo = Math.max(ultimo, tutti.cura.compra(id).costo || 0)
  dentro('l\'ultimo costa meno delle due ore di esercizio (720)', ultimo, 300, 720)
}

/* ══════════ la fame ══════════ */
{
  const { f, b, t } = motore({ monete: 1000 })
  f.cura.compra('beagle')
  controlla('appena preso non ha fame', !f.cura.haFame('beagle'))
  t.ora += 10 * ORE
  controlla('dopo dieci ore ha fame e insiste', f.cura.haFame('beagle') && f.cura.insiste('beagle'))
  const g = f.cura.perLaCiotola('beagle')
  uguale('il primo gettone è quello che chiede', g[0].vuole, true)
  for (const c of cibiComprati('cane')) controlla(`${c.nome}: la scappatoia a monete c'è`, g.some(x => x.id === c.id && x.prezzo === c.prezzo && x.ok))
  b.monete = 0
  controlla('senza monete né scorte smette di insistere', f.cura.haFame('beagle') && !f.cura.insiste('beagle'))
  b.monete = 5
  controlla('con cinque monete insiste di nuovo', f.cura.insiste('beagle'))
  const r = f.cura.riempi('beagle', 'osso')
  controlla('l\'osso costa 5', r.ok && b.monete === 0, JSON.stringify(r))
  controlla('dopo il cibo piccolo non insiste più: basta poco', !f.cura.insiste('beagle') || f.cura.stato('beagle').pancia >= FAME - 0.2)
  uguale('il pasto si conta', f.cura.casa.beagle.pasti, 1)
  f.cura.casa.beagle.pancia = 0.9
  uguale('senza fame non si mangia', f.cura.riempi('beagle', 'osso').motivo, 'non-ha-fame')
  f.s.prodotti.torta = 1
  uguale('nemmeno la torta', [f.cura.riempi('beagle', 'festa').motivo, f.s.prodotti.torta].join(), 'non-ha-fame,1')
  f.cura.casa.beagle.pancia = 0.2
  uguale('il cibo di un altro non va', f.cura.riempi('beagle', 'pesce').motivo, 'non-gli-piace')
}
{
  const hai = { uova: 2 }, q = k => hai[k] || 0
  uguale('chiede quello che hai', ciboChiesto('cane', 0, q).id, 'uova')
  const senza = () => 0
  const giro = new Set([0, 1, 2, 3].map(p => ciboChiesto('cane', p, senza).id))
  controlla('cambia da un pasto all\'altro', giro.size > 1)
  for (const c of giro) controlla(`${c} è un cibo del cane`, cibiPer('cane').some(x => x.id === c))
}
{
  const { f } = motore()
  f.cura.compra('beagle')
  f.s.prodotti.torta = 1
  controlla('la torta si offre solo se ce l\'hai', f.cura.perLaCiotola('beagle').some(g => g.id === 'festa'))
  f.cura.casa.beagle.pancia = 0.3; f.cura.casa.beagle.gioco = 0.3
  const r = f.cura.riempi('beagle', 'festa'), b = f.cura.stato('beagle')
  controlla('la torta nella ciotola fa festa e riempie la pancia', r.ok && b.gioco === 1 && b.pancia > 0.7, JSON.stringify(b))
}

/* ══════════ il gioco ══════════ */
{
  const { f } = motore()
  f.cura.compra('beagle')
  const b = f.cura.casa.beagle
  b.gioco = FELICE + 0.1
  const r = f.cura.gioca('beagle')
  controlla('da felice ci giochi, ma non ne viene niente', r.ok && r.felice && b.gioco === FELICE + 0.1)
  b.gioco = FELICE - 0.1
  const s = f.cura.gioca('beagle')
  controlla('da non felice a felice: gratis, e la barra si riempie', s.ok && !s.felice && s.costo === 0 && b.gioco === 1)
  b.pancia = 0.9; b.pelo = 0.9; b.gioco = 0.3; b.premiato = false
  const xp = f.s.esperienza, p = f.cura.gioca('beagle')
  controlla('se era l\'ultima cosa che mancava, c\'è il premio', !!p.premio && f.s.esperienza > xp, JSON.stringify(p))
  uguale('giocarci ancora non premia', f.cura.gioca('beagle').premio, undefined)
}

/* ══════════ lo sporco e la tinozza ══════════ */
{
  uguale('pulito non si vede', sporcoDi(0.9), 0)
  uguale('al fondo è tutto', sporcoDi(FONDO), 1)
  const { f, b } = motore({ monete: 10 })
  f.cura.compra('coniglio', b.monete = 1000)
  f.cura.compra('beagle')
  f.cura.casa.coniglio.pelo = 0.5; f.cura.casa.beagle.pelo = 0.3
  uguale('il più sporco è il primo', f.cura.sporche().join(), 'beagle,coniglio')
  const prima = b.monete, r = f.cura.lava('beagle')
  controlla('🪙1 e torna pulito del tutto', r.ok && prima - b.monete === 1 && f.cura.casa.beagle.pelo === 1, JSON.stringify(r))
  uguale('pulito non serve', f.cura.lava('beagle').motivo, 'non-serve')
  b.monete = 0
  uguale('senza monete non si comincia', f.cura.rifiutoBagno('coniglio').motivo, 'poche-monete')
  f.cura.sporca('coniglio', 5)
  uguale('non si scende sotto il fondo', f.cura.casa.coniglio.pelo, FONDO)
}
{
  const g = creaBestia({ id: 'beagle', ...BESTIE.beagle, daCurare: true })
  preparaSporco(g)
  let con = 0, senza = 0
  g.traverse(o => { if (o.isMesh) { if (o.geometry.attributes.aSporco) con++; else senza++ } })
  controlla('i pezzi col pelo hanno le soglie dello sporco', con > 5, `${con} con, ${senza} senza`)
  impostaSporco(g, 0.5)
  controlla('il livello è per animale', g.userData.sporco.value > 0.5)
  const altro = creaBestia({ id: 'beagle', ...BESTIE.beagle, daCurare: true })
  preparaSporco(altro)
  uguale('due animali non si sporcano insieme', altro.userData.sporco.value, 0)
}

/* ══════════ la noia: le sequenze ══════════ */
{
  for (const tipo of ['cane', 'gatto', 'coniglio', 'pappagallo']) {
    const viste = new Set()
    for (let r = 0; r < 1; r += 0.05) { const q = scegliNoia(tipo, () => r); viste.add(q); controlla(`${tipo}/${q}: ha passi`, sequenzaNoia(q, tipo).length >= 2) }
    if (tipo === 'coniglio' || tipo === 'pappagallo') controlla(`${tipo}: niente da portare`, !viste.has('porta'))
    else controlla(`${tipo}: porta il gioco`, viste.has('porta'))
  }
  controlla('chi ha fame non si ferma se cammini', sequenzaFame(true).ostinata && sequenzaPasto(true, false).ostinata)
}

/* ══════════ in scena ══════════ */
function scena ({ rnd = () => 0.4, t = { ora: ORA } } = {}) {
  const { f, b } = motore({ t })
  const eroe = { x: 0.5, z: 2.5, fermo: true, percorso: [], az: null, faccia () {}, avvia () {} }
  const voli = []
  const fx = { volo: x => voli.push(x), scoppietta () {}, parla () {}, fumata () {} }
  const c = new Compagni(new THREE.Scene(), f, eroe, fx, { avviso () {}, cambio () {} }, rnd)
  return { f, b, c, eroe, voli, t }
}
const scorri = (c, da, secondi) => { let tt = da; for (let k = 0; k < secondi * 20; k++) { tt += 0.05; c.aggiorna(0.05, tt) } return tt }
{
  const s = scena(), { f, c, t } = s
  f.cura.compra('watson'); f.cura.compra('beagle'); c.sync(true)
  t.ora += 10 * ORE
  const tt = scorri(c, 0, 30)
  const vicino = id => { const k = f.cura.ciotolaDi(id), a = c.lista.find(o => o.def.id === id); return Math.hypot(a.x - k.i - 0.5, a.z - k.j - 0.5) }
  dentro('la bestia di casa affamata sta alla sua ciotola', vicino('beagle'), 0, 2.5)
  controlla('ha chiamato il contadino almeno una volta', s.voli.includes('🥣'), s.voli.slice(0, 8).join())
  const prima = c.lista.find(o => o.def.id === 'beagle')
  f.cura.riempi('beagle', 'bistecca'); let tolto = false; c.cibo = (id, si) => { tolto = id === 'beagle' && si === false }
  c.mangia('beagle')
  scorri(c, tt, 9)
  controlla('ha mangiato e il cibo è sparito', tolto)
  uguale('non ha più fame', prima.fame, false)
}
{
  const s = scena(), { f, c } = s
  f.cura.compra('beagle'); c.sync(true)
  f.cura.casa.beagle.pelo = 0.3
  const t = f.cura.tinozza(), d = f.misureCosa(t)
  const a = c.alBagno('beagle', { id: t.id, tipo: t.tipo, i: t.i, j: t.j, x: t.i + d.w / 2, z: t.j + d.d / 2 })
  const tt = scorri(c, 0, 25)
  controlla('è saltato nella tinozza e ci resta', a.inBagno?.dentro && !!a.sopra, JSON.stringify(a.inBagno))
  c.esceDalBagno('beagle', true)
  scorri(c, tt, 6)
  controlla('esce e torna a terra', !a.inBagno && !a.sopra && a.grp.position.y < 0.05)
}
{
  const s = scena({ rnd: () => 0.1 }), { f, c } = s
  f.cura.compra('beagle'); c.sync(true)
  const a = c.lista[0]
  f.cura.casa.beagle.gioco = NOIA - 0.1; f.cura.casa.beagle.pancia = 0.9
  let tt = 0
  while (!a.giocattolo && tt < 90) tt = scorri(c, tt, 0.5)
  controlla('annoiato ti porta il gioco', !!a.giocattolo, a.stato)
  while (a.giocattolo && a.giocattolo.modo !== 'posato' && tt < 120) tt = scorri(c, tt, 0.5)
  uguale('e lo posa ai tuoi piedi', a.giocattolo?.modo, 'posato')
  c.tocca(a)
  controlla('il tocco lo prende, e si gioca', !a.giocattolo && f.cura.casa.beagle.gioco === 1)
  scorri(c, c.t, 20)
  controlla('felice non combina più niente', !a.giocattolo)
}
riassunto('La cura sul prato')
