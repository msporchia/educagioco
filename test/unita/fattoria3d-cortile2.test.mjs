/* Il secondo cortile (conigliera, alpaca, asini, arnie) e le merci che porta (lana d'angora e d'alpaca, concime, miele, fiori per le api, merenda,
   caramelle), giro G5 della parità: ricette, bestie, prezzi, livelli e tempi sono quelli della 2D (un test li confronta); la lana va nel suo
   contatore; i fiori sono un mangime senza ricetta col proprio id; il motore le fa giocare; i profili dei tre stadi e i modelli (ingombro, nessun NaN,
   il prodotto in vista solo da pronte, pochi mesh). Senza browser. Docs: docs/fattoria3d/cortile-2.md, parita/animali.md (A1g–A1k), parita/colture-e-catena.md (C18, C19).
   `node test/esegui.mjs fattoria3d-cortile2`
   tempo: 1 */
import { PRODOTTI, RICETTE as RICETTE_2D } from '../../src/giochi/fattoria3d/da2d/dati/coltivazioni.js'
import { PER_ID as VOCI_2D } from '../../src/giochi/fattoria3d/da2d/dati/catalogo.js'
import { livelloDellaVoce, livelloDellaRicetta as livello2D } from '../../src/giochi/fattoria3d/da2d/dati/livelli.js'
import { PEZZI as ATLANTE } from '../../src/grafica/atlante-fattoria.js'
import { PEZZI, guastiDelCatalogo } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE, MACCHINE, guastiDelleRicette, merceDi } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { ANIMALI, LANA, PRODOTTI_ANIMALI, guastiDegliAnimali, msDelProdotto } from '../../src/giochi/fattoria3d/dati/animali.js'
import { MANGIMI, MANGIMI_DEL_FIENILE, RICETTE_FIENILE, ricetteDelMangime, lavoroDelMangime } from '../../src/giochi/fattoria3d/dati/mangime.js'
import { MANGIMI_SENZA_RICETTA, NUMERI_DEL_CORTILE_2 } from '../../src/giochi/fattoria3d/dati/cortile2.js'
import { guastiDeiLivelli, sogliaDi, livelloDelMangime, livelloDellaRicetta } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { guastiDellaScala, catenaMs, TETTO_ATTESA_MS } from '../../src/giochi/fattoria3d/motore/taratura.js'
import { guastiDeiSilos, siloDi, merciDelSilo } from '../../src/giochi/fattoria3d/dati/silos.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { alberoDi } from '../../src/giochi/fattoria3d/dati/albero.js'
import { dettoDi } from '../../src/giochi/fattoria3d/scena3d/detti.js'
import { schedeDellInventario } from '../../src/giochi/fattoria3d/viste/inventario-puro.js'
import { profiloBestia } from '../../src/giochi/fattoria3d/scena3d/bestie-puro.js'
import { SPECIE_CORTILE_2 } from '../../src/giochi/fattoria3d/scena3d/bestie-puro-cortile2.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const M = await import('../../src/giochi/fattoria3d/scena3d/modelli.js')
const C = await import('../../src/giochi/fattoria3d/scena3d/modelli-cortile2.js')

function mondo({ monete = 100000 } = {}) {
  const b = { monete }, t = { ora: 1_000_000 }
  const f = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  f.s.esperienza = sogliaDi(70)
  return { f, b, t }
}
const postoPer = (f, tipo) => { for (let j = -3; j < 8; j++) for (let i = -6; i < 6; i++) if (f.puoMettere(tipo, i, j).ok) return [i, j]; return [0, 0] }
const metti = (f, tipo) => { f.compraPezzo(tipo); return f.mettiPezzo(tipo, ...postoPer(f, tipo)) }

const BESTIE = { conigliera: 'lana_angora', alpaca: 'lana_alpaca', asini: 'concime', arnie: 'miele' }
const COME_2D = { conigliera: 'conigliera', alpaca: 'recinto_alpaca', asini: 'recinto_asini', arnie: 'arnie' }

/* ══════════ 1. recinti e bestie sono quelli della 2D ══════════ */
{
  for (const [t, id] of Object.entries(BESTIE)) {
    const d = RICETTE_2D.find(x => x.id === id), v = VOCI_2D[COME_2D[t]], A = ANIMALI[t], P = PEZZI[t]
    uguale(`${t}: prezzo e livello del recinto come la voce 2D «${v.id}»`, [P.prezzo, P.liv, P.cresce].join(), [v.prezzo, livelloDellaVoce(v), v.cresce].join())
    uguale(`${t}: in 2D la ricetta «${id}» è del recinto`, d.dove, t)
    uguale(`${t}: ${d.minuti} minuti e 🪙${d.costo} a pasto, come in 2D`, [A.ms / 60000, A.costo].join(), [d.minuti, d.costo].join())
    uguale(`${t}: mangia ${JSON.stringify(d.prende)} come in 2D`, JSON.stringify([A.mangia[0], A.pasti]), JSON.stringify(Object.entries(d.prende)[0]))
    uguale(`${t}: il prodotto è «${d.da}»`, A.prodotto, d.da)
    controlla(`${t}: è un animale produttivo che sta tra gli animali`, P.categoria === 'animali' && P.produttivo === true && P.w === 4 && P.d === 3)
    controlla(`${t}: i numeri provvisori non ci sono più (livello e prezzo sono letti dalla 2D)`, NUMERI_DEL_CORTILE_2[t].liv === P.liv && NUMERI_DEL_CORTILE_2[t].prezzo === P.prezzo)
  }
  controlla('la peschiera non c\'è: la pesca ne prende il posto', !PEZZI.peschiera && PEZZI.molo.liv === VOCI_2D.peschiera.liv)
  controlla('i conigli e le api sono tra i cartelli dei piccoli recinti: capienze e prezzi delle bestie sensati', Object.values(ANIMALI).every(a => a.posti >= 2 && a.prezzoBestia > 0))
}

/* ══════════ 2. le merci nuove ══════════ */
{
  controlla('lana d\'angora e d\'alpaca sono la lana dell\'ovile: un contatore solo', LANA.lana.anche.join() === 'conigliera,alpaca' && ANIMALI.conigliera.prodotto === 'lana' && !PRODOTTI_ANIMALI.lana)
  for (const k of ['miele', 'concime']) {
    uguale(`${k}: nome e faccia come la merce 2D`, [PRODOTTI_ANIMALI[k].nome, PRODOTTI_ANIMALI[k].pezzo].join(), [PRODOTTI[k].nome, PRODOTTI[k].pezzo].join())
    controlla(`${k}: la faccia è nell'atlante`, !!ATLANTE[PRODOTTI_ANIMALI[k].pezzo])
    uguale(`${k}: sta nel silo della stalla`, siloDi(k), 'stalla')
  }
  uguale('i fiori: nome e faccia della 2D, mangime del fienile', [MANGIMI_SENZA_RICETTA.fiori.nome, MANGIMI_SENZA_RICETTA.fiori.pezzo, MANGIMI_SENZA_RICETTA.fiori.mangime].join(), [PRODOTTI.fiori.nome, PRODOTTI.fiori.pezzo, true].join())
  controlla('i fiori hanno nome e faccia per i testi, e il silo della stalla', merceDi('fiori').nome === 'Fiori' && siloDi('fiori') === 'stalla' && merciDelSilo('stalla').includes('fiori'))
  for (const id of ['fiorume', 'fiorume_concime']) {
    const r = RICETTE_FIENILE[id], d = RICETTE_2D.find(x => x.id === id)
    uguale(`${id}: minuti, costo, livello e prodotto come in 2D`, [r.ms / 60000, r.costo, r.liv, r.da].join(), [d.minuti, d.costo || 0, livello2D(d), d.da].join())
    controlla(`${id}: è mangime e lo fa il fienile`, r.mangime === true && RICETTE[id].dove === 'fienile')
  }
  uguale('fiorume: cipolle e aglio', JSON.stringify(RICETTE.fiorume.ing), JSON.stringify({ cipolla: 1, aglio: 1 }))
  uguale('prato fiorito: concime ed erba medica (il fieno della 2D)', JSON.stringify(RICETTE.fiorume_concime.ing), JSON.stringify({ concime: 1, erba: 1 }))
  uguale('due strade per i fiori', ricetteDelMangime('fiori').map(([id]) => id).join(), 'fiorume,fiorume_concime')
  controlla('i fiori sono un mangime in più, il livello è quello della strada più precoce (44)', MANGIMI.includes('fiori') && MANGIMI_DEL_FIENILE.includes('fiori') && livelloDelMangime('fiori') === 44)
  controlla('il lavoro dei fiori conta la strada dei raccolti (il concime non è un raccolto)', Number.isFinite(lavoroDelMangime('fiori', 2)) && lavoroDelMangime('fiori') === RICETTE.fiorume.ms + COLTURE.cipolla.ms + COLTURE.aglio.ms)
  for (const [id, dove] of [['merenda', 'panificio'], ['caramelle', 'zuccherificio']]) {
    const d = RICETTE_2D.find(x => x.id === id), r = RICETTE[id]
    uguale(`${id}: la fa ${dove} come in 2D`, [r.dove, d.dove].join(), [dove, dove].join())
    uguale(`${id}: minuti, costo e livello della 2D`, [r.ms / 60000, r.costo, r.liv].join(), [d.minuti, d.costo || 0, livello2D(d)].join())
    controlla(`${id}: vuole il miele e arriva dopo le arnie`, r.ing.miele === 1 && livelloDellaRicetta(id) >= PEZZI.arnie.liv)
    uguale(`${id}: nome e faccia della 2D`, [r.nome, r.pezzo].join(), [PRODOTTI[id].nome, PRODOTTI[id].pezzo].join())
  }
  controlla('il miele e il concime hanno una catena finita e sotto il tetto d\'attesa', ['miele', 'concime', 'merenda', 'caramelle'].every(k => Number.isFinite(catenaMs(k)) && catenaMs(k) <= TETTO_ATTESA_MS), ['miele', 'concime', 'merenda', 'caramelle'].map(k => Math.round(catenaMs(k) / 60000)).join())
  controlla('il tempo del miele conta i fiori', msDelProdotto('miele') > ANIMALI.arnie.ms)
  uguale('i dati non hanno guasti', JSON.stringify([guastiDelCatalogo(), guastiDelleRicette(COLTURE, null).filter(g => !/senza edificio/.test(g)), guastiDegliAnimali(PEZZI), guastiDeiSilos(), guastiDeiLivelli(), guastiDellaScala()]), JSON.stringify([[], [], [], [], [], []]))
}

/* ══════════ 3. il motore: comprare, nutrire, raccogliere ══════════ */
{
  const { f, b, t } = mondo()
  // la conigliera: due foraggi per una lana d'angora; la lana va nel contatore
  controlla('la conigliera si compra e si mette', f.compraPezzo('conigliera').ok && metti(f, 'conigliera').ok)
  const co = f.s.cose.find(c => c.tipo === 'conigliera')
  f.s.prodotti.foraggio = 1
  uguale('con un foraggio solo dice cosa serve', JSON.stringify(f.provaCuraBestie(co.id)), JSON.stringify({ azione: null, motivo: 'manca-mangime', servono: 2, mangia: ['foraggio'] }))
  f.s.prodotti.foraggio = 4
  controlla('il foraggio nutre il coniglio (🪙1)', f.nutriBestie(co.id).ok && f.s.prodotti.foraggio === 2)
  t.ora += ANIMALI.conigliera.ms - 1
  uguale('prima di quattordici minuti niente', f.provaCuraBestie(co.id).motivo, 'lavora')
  t.ora += 2
  const lana0 = f.s.lana, r = f.raccogliProdotti(co.id)
  controlla('i conigli danno lana nel contatore, non in prodotti', r.ok && r.prodotto === 'lana' && f.s.lana === lana0 + 1 && !f.s.prodotti.lana)
  f.s.lana = 8
  controlla('si comprano altri conigli fino a sei', (() => { let ok = true; for (let k = 1; k < ANIMALI.conigliera.posti; k++) ok = ok && f.compraBestia(co.id).ok; return ok && f.compraBestia(co.id).motivo === 'pieno' })())
  // l'alpaca: un foraggio, cinque minuti
  controlla('il recinto degli alpaca si compra e si mette', f.compraPezzo('alpaca').ok && metti(f, 'alpaca').ok)
  const al = f.s.cose.find(c => c.tipo === 'alpaca')
  f.s.lana = 2; f.s.prodotti.foraggio = 1
  controlla('un foraggio nutre un\'alpaca', f.nutriBestie(al.id).ok && f.s.prodotti.foraggio === undefined)
  t.ora += ANIMALI.alpaca.ms
  controlla('l\'alpaca dà lana (cinque minuti)', f.raccogliProdotti(al.id).ok && f.s.lana === 3)
  controlla('la lana d\'alpaca serve al telaio come quella dell\'ovile', f.scortaDi('lana') === 3)
  // gli asini: due foraggi → concime
  controlla('il recinto degli asini si compra e si mette', f.compraPezzo('asini').ok && metti(f, 'asini').ok)
  const as = f.s.cose.find(c => c.tipo === 'asini')
  f.s.prodotti.foraggio = 2
  controlla('gli asini mangiano foraggio', f.nutriBestie(as.id).ok)
  t.ora += ANIMALI.asini.ms
  const ra = f.raccogliProdotti(as.id)
  controlla('gli asini danno concime (dieci minuti)', ra.ok && ra.prodotto === 'concime' && f.s.prodotti.concime === 1)
  // il fienile fa i fiori in due modi
  controlla('il fienile si compra', f.compraEdificio('fienile').ok)
  f.s.merci.cipolla = 1; f.s.merci.aglio = 1
  controlla('«fiori di cipolla e aglio» parte', f.avviaRicettaIn('fienile', 'fiorume').ok)
  t.ora += RICETTE.fiorume.ms; f.tick()
  uguale('i fiori sono pronti nel fienile (chiave del prodotto)', f.macchina('fienile').pronti.fiori, 1)
  controlla('si ritirano e stanno in dispensa', f.ritiraDa('fienile').ok && f.s.prodotti.fiori === 1)
  f.compraPosto('fienile'); f.s.merci.erba = 1
  controlla('«prato fiorito» vuole il concime e l\'erba medica (la seconda strada)', f.avviaRicettaIn('fienile', 'fiorume_concime').ok && f.s.prodotti.concime === undefined)
  t.ora += RICETTE.fiorume_concime.ms; f.tick(); f.ritiraDa('fienile')
  uguale('altri fiori: due in tutto', f.s.prodotti.fiori, 2)
  // le arnie mangiano fiori e danno miele
  controlla('le arnie si comprano e si mettono', f.compraPezzo('arnie').ok && metti(f, 'arnie').ok)
  const ar = f.s.cose.find(c => c.tipo === 'arnie')
  controlla('due fiori nutrono un\'arnia', f.provaCuraBestie(ar.id).azione === 'nutri' && f.nutriBestie(ar.id).ok && f.s.prodotti.fiori === undefined)
  t.ora += ANIMALI.arnie.ms
  const rm = f.raccogliProdotti(ar.id)
  controlla('le arnie danno miele (dodici minuti)', rm.ok && rm.prodotto === 'miele' && f.s.prodotti.miele === 1)
  // merenda e caramelle
  f.compraEdificio('panificio'); f.compraEdificio('zuccherificio')
  f.s.merci.fragola = 2; f.s.prodotti.miele = 2; f.s.prodotti.zucchero = 1
  controlla('la merenda vuole fragole e miele', f.avviaRicettaIn('panificio', 'merenda').ok && f.s.prodotti.miele === 1)
  controlla('le caramelle vogliono zucchero e miele', f.avviaRicettaIn('zuccherificio', 'caramelle').ok && f.s.prodotti.miele === undefined)
  // il dettato, l'inventario e «come si fa»
  controlla('senza fiori il rifiuto dice dove si fanno', /fiori/.test(dettoDi('manca-mangime', { mangia: ['fiori'], servono: 2 })) && /fienile/.test(dettoDi('manca-mangime', { mangia: ['fiori'], servono: 2 })))
  f.s.prodotti.fiori = 3; f.s.prodotti.concime = 1
  const sc = schedeDellInventario(f.s, 70, k => f.capienzaDi(k))
  controlla('l\'inventario mostra i fiori e il concime', sc.prodotti.some(v => v.k === 'fiori' && v.n === 3) || sc.altro.some(v => v.k === 'fiori'), JSON.stringify(sc.prodotti.map(v => v.k)))
  const albero = alberoDi(f, 'miele')
  controlla('«come si fa» il miele risale ai fiori e ai raccolti', albero && albero.rami.length === 1 && albero.rami[0].k === 'fiori' && albero.rami[0].rami.length >= 1, albero && JSON.stringify(albero.rami.map(r => r.k)))
  // salvare e rileggere: i pronti di fiori non si perdono
  f.s.macchine.fienile.pronti.fiori = 2
  const r2 = normalizza(JSON.parse(JSON.stringify(f.s)))
  controlla('lo stato si rilegge uguale: i quattro recinti con le loro bestie e i fiori pronti', ['conigliera', 'alpaca', 'asini', 'arnie'].every(tp => r2.cose.some(c => c.tipo === tp)) && r2.cose.find(c => c.tipo === 'conigliera').bestie.length === 6 && r2.macchine.fienile.pronti.fiori === 2)
  const q = f.infoBestie(co)
  controlla('il quadro dice bestia, emoji e capienza', q.bestia === 'coniglio' && q.emoji === '🐇' && q.max === 6)
}

/* ══════════ 4. i tre stadi (profili) ══════════ */
{
  const cresce = { coniglio: ['sx', 'sy', 'sz', 'testaY', 'pelo', 'lento'], alpaca: ['sx', 'sy', 'sz', 'testaY', 'collo', 'lana', 'lento'], asino: ['sx', 'sy', 'sz', 'testaY', 'mucchio', 'coda', 'lento'], arnia: ['miele', 'api', 'lento'] }
  uguale('quattro specie nuove', SPECIE_CORTILE_2.join(), 'coniglio,alpaca,asino,arnia')
  for (const sp of SPECIE_CORTILE_2) {
    let nan = 0, giu = 0, prec = null
    for (const st of [0, 1, 2]) for (let p = 0; p <= 1.0001; p += 0.1) for (const v of Object.values(profiloBestia(sp, st, p))) if (!Number.isFinite(v)) nan++
    uguale(`${sp}: nessun valore non finito`, nan, 0)
    for (let p = 0; p <= 1.0001; p += 0.02) { const x = profiloBestia(sp, 1, p, {}); if (prec) for (const k of cresce[sp]) if (x[k] < prec[k] - 1e-9) giu++; prec = x }
    const ult = profiloBestia(sp, 1, 1), pr = profiloBestia(sp, 2, 1), f0 = profiloBestia(sp, 0, 0), i0 = profiloBestia(sp, 1, 0)
    for (const k of cresce[sp]) { if (pr[k] < ult[k] - 1e-9) giu++; if (i0[k] < f0[k] - 1e-9) giu++ }
    uguale(`${sp}: nutrire riempie, aspettare riempie, mai il contrario`, giu, 0)
    const a = profiloBestia(sp, 0, 0), b = profiloBestia(sp, 1, 0.5), c = profiloBestia(sp, 2, 1)
    controlla(`${sp}: alone e scintillio solo da pronto, il prodotto con lui`, a.alone === 0 && b.alone === 0 && c.alone === 1 && c.scintilla === 1 && a.dono === 0 && b.dono === 0 && c.dono === 1)
  }
  const k0 = profiloBestia('coniglio', 0, 0), k2 = profiloBestia('coniglio', 2, 1)
  controlla('coniglio: pelo scarso a fame, almeno tre volte più nuvola da pronto; le orecchie si alzano', k2.pelo >= 3 * k0.pelo && k0.orecchie > 1 && k2.orecchie < 0.2 && k0.salto === 0 && k2.salto === 1)
  const l0 = profiloBestia('alpaca', 0, 0), l2 = profiloBestia('alpaca', 2, 1)
  controlla('alpaca: il collo si allunga, il vello cresce, il ciuffo spunta solo da pronta', l0.collo < l2.collo && l0.lana * 3 < l2.lana && l0.ciuffo === 0 && l2.ciuffo === 1)
  const s1 = profiloBestia('asino', 1, 0.5)
  controlla('asino: il mucchio cresce col lavoro e a fame non c\'è', profiloBestia('asino', 0, 0).mucchio === 0 && s1.mucchio > 0.2 && profiloBestia('asino', 2, 1).mucchio === 1 && s1.dono === 0)
  const r0 = profiloBestia('arnia', 0, 0), r1 = profiloBestia('arnia', 1, 0.5), r2 = profiloBestia('arnia', 2, 1)
  controlla('arnia: il favo è vuoto a fame, a metà e colmo da pronta; la goccia solo oltre un terzo del lavoro', r0.miele === 0 && r1.miele > 0.3 && r1.miele < 0.7 && r2.miele === 1 && profiloBestia('arnia', 1, 0.1).gocciola === 0 && r1.gocciola === 1 && r2.gocciola === 0)
}

/* ══════════ 5. i modelli ══════════ */
{
  const adesso = Date.now()
  const stati = { fame: { fine: null }, lavora: { fine: adesso + 5000 }, pronta: { fine: adesso - 1000 } }
  const bestie = [['coniglio', k => C.creaConiglio(k), ANIMALI.conigliera.ms, 'pelo'], ['alpaca', k => C.creaAlpaca(k), ANIMALI.alpaca.ms, 'manto'], ['asino', k => C.creaAsino(k), ANIMALI.asini.ms, 'corpo'], ['arnia', k => C.creaArnia(k), ANIMALI.arnie.ms, 'favo']]
  for (const [nome, crea, ms] of bestie) {
    for (const [stadio, st] of Object.entries(stati)) {
      const b = crea(0); b.userData.attesa = 1e9
      const casa = { userData: { bestie: [b] } }
      b.userData.casa = b.position.clone()
      const s = stadio === 'lavora' ? { fine: adesso + ms * 0.5 } : st
      for (let i = 0; i < 40; i++) M.muoviBestie(casa, 0.05, i * 0.05, [s], adesso)
      const box = new THREE.Box3().setFromObject(b)
      controlla(`${nome} ${stadio}: l'ingombro è un numero e sta in un metro e mezzo`, Number.isFinite(box.min.y) && box.max.x - box.min.x < 1.5 && box.max.z - box.min.z < 1.5 && box.max.y < 1.9, [box.min.y, box.max.x - box.min.x, box.max.y].map(x => x.toFixed(2)).join(' '))
      controlla(`${nome} ${stadio}: alone e scintillio solo da pronto`, b.userData.alone.visible === (stadio === 'pronta'))
      controlla(`${nome} ${stadio}: il prodotto in vista solo da pronto`, b.userData.dono.visible === (stadio === 'pronta'))
      let nan = 0, mesh = 0; b.traverse(o => { if (o.isMesh) mesh++; for (const v of [o.position.x, o.position.y, o.position.z, o.scale.x, o.scale.y, o.scale.z, o.rotation.x, o.rotation.z]) if (!Number.isFinite(v)) nan++ })
      uguale(`${nome} ${stadio}: nessuna posa non finita`, nan, 0)
      controlla(`${nome} ${stadio}: ${mesh} mesh, sotto i 40`, mesh < 40)
    }
    // i nodi sono del clone
    const c1 = crea(0), c2 = crea(0)
    controlla(`${nome}: i nodi sono del clone (la cache non li condivide)`, ['dono', 'alone', 'scintilla', 'sbuffo'].every(k => c1.userData[k] && c1.userData[k] !== c2.userData[k] && c1.getObjectById(c1.userData[k].id)))
  }
  // la differenza fra gli stadi si vede
  const prova = (crea, st, f) => { const b = crea(0); b.userData.attesa = 1e9; for (let i = 0; i < 40; i++) M.muoviBestie({ userData: { bestie: [b] } }, 0.05, i * 0.05, [st], adesso); return f(b) }
  controlla('coniglio: la nuvola di pelo pronta è tripla di quella a fame', prova(C.creaConiglio, stati.pronta, b => b.userData.pelo.scale.x) > 3 * prova(C.creaConiglio, stati.fame, b => b.userData.pelo.scale.x))
  controlla('alpaca: il collo pronto è più lungo, il ciuffo si vede solo da pronta', prova(C.creaAlpaca, stati.pronta, b => b.userData.collo.scale.y) > prova(C.creaAlpaca, stati.fame, b => b.userData.collo.scale.y) && prova(C.creaAlpaca, stati.pronta, b => b.userData.ciuffo.visible) && !prova(C.creaAlpaca, stati.fame, b => b.userData.ciuffo.visible))
  controlla('asino: il mucchio c\'è al lavoro e da pronto, a fame no', !prova(C.creaAsino, stati.fame, b => b.userData.mucchio.visible) && prova(C.creaAsino, { fine: adesso + ANIMALI.asini.ms * 0.5 }, b => b.userData.mucchio.visible) && prova(C.creaAsino, stati.pronta, b => b.userData.mucchio.visible))
  controlla('arnia: il favo sale (vuoto, a metà, colmo) e le api compaiono', prova(C.creaArnia, stati.fame, b => b.userData.favo.scale.y) < 0.01 && prova(C.creaArnia, { fine: adesso + ANIMALI.arnie.ms * 0.5 }, b => b.userData.favo.scale.y) > 0.08 && prova(C.creaArnia, stati.pronta, b => b.userData.favo.scale.y) > 0.28
    && prova(C.creaArnia, stati.fame, b => b.userData.api.filter(a => a.visible).length) === 0 && prova(C.creaArnia, stati.pronta, b => b.userData.api.filter(a => a.visible).length) === 3)
  // i recinti
  const recinti = [['conigliera', C.creaConigliera, 'conigliera', 6], ['recinto degli alpaca', C.creaRecintoAlpaca, 'alpaca', 4], ['recinto degli asini', C.creaRecintoAsini, 'asini', 4], ['apiario', C.creaApiario, 'arnie', 4]]
  for (const [nome, crea, tipo, n] of recinti) {
    const stato = Array.from({ length: n }, (_, k) => ({ fine: [null, adesso + 5000, adesso - 5, null, adesso + 9e6, adesso - 5][k] }))
    const g = crea(stato)
    controlla(`${nome}: tante bestie quante gli stati`, g.userData.bestie.length === n)
    for (let i = 0; i < 200; i++) M.muoviBestie(g, 0.05, i * 0.05, stato, adesso)
    const box = new THREE.Box3().setFromObject(g), d = PEZZI[tipo]
    controlla(`${nome}: sta nell'impronta ${d.w}×${d.d} (con un po' di margine)`, box.min.x > -d.w / 2 - 0.2 && box.max.x < d.w / 2 + 0.2 && box.min.z > -d.d / 2 - 0.1 && box.max.z < d.d / 2 + 0.3 && box.min.y > -0.05, [box.min.x, box.max.x, box.min.z, box.max.z].map(x => x.toFixed(2)).join(' '))
    controlla(`${nome}: ha l'altezza per il cartello`, g.userData.altezza > 1)
    const vuoto = crea([]); let m0 = 0; vuoto.traverse(o => { if (o.isMesh) m0++ })
    let mesh = 0; g.traverse(o => { if (o.isMesh) mesh++ })
    controlla(`${nome}: pochi mesh (vuoto ${m0}, pieno ${mesh}, fuso ciò che sta fermo)`, m0 < 60 && mesh < 130, `${m0}/${mesh}`)
    // i posti non si sovrappongono: due bestie a posti diversi stanno ad almeno 0,4 di distanza
    const P = Array.from({ length: n }, (_, k) => g.userData.posto(k))
    let vicine = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (P[i].distanceTo(P[j]) < 0.4) vicine++
    uguale(`${nome}: le bestie hanno ognuna il suo posto`, vicine, 0)
  }
}

riassunto('Fattoria 3D — secondo cortile (conigliera, alpaca, asini, arnie)')
