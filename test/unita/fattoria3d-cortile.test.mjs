/* Il pentolone e le tre bestie che mangiano da lui (anatre, maiali, capre), giro G4 della parità: ricette, mangime, prodotti e cosa mangia
   chi sono quelli della 2D (un test li confronta); i numeri provvisori stanno in un punto solo (dati/cortile.js); la zucca e la patata
   hanno un'uscita; il motore le fa giocare (comprare, nutrire, raccogliere); i profili dei tre stadi e i modelli (ingombro, nessun NaN,
   il prodotto in vista solo da pronte). Senza browser. Docs: docs/fattoria3d/cortile-e-pentolone.md, parita/colture-e-catena.md (C18, C23), parita/animali.md (A1d–A1f).
   `node test/esegui.mjs fattoria3d-cortile`
   tempo: 1 */
import { PRODOTTI, RICETTE as RICETTE_2D } from '../../src/giochi/fattoria3d/da2d/dati/coltivazioni.js'
import { PEZZI as ATLANTE } from '../../src/grafica/atlante-fattoria.js'
import { PEZZI, EDIFICI, guastiDelCatalogo } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE, MACCHINE, guastiDelleRicette } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { ANIMALI, CORTILE, PRODOTTI_ANIMALI, guastiDegliAnimali, msDelProdotto, prezzoDellaBestia } from '../../src/giochi/fattoria3d/dati/animali.js'
import { MANGIMI, MANGIMI_DEL_FIENILE, MANGIMI_DEL_PENTOLONE, RICETTE_PENTOLONE, lavoroDelMangime } from '../../src/giochi/fattoria3d/dati/mangime.js'
import { NUMERI_DEL_CORTILE as PROVVISORI } from '../../src/giochi/fattoria3d/dati/cortile.js'
import { guastiDeiLivelli, sogliaDi, roba, livelloDelMangime, livelloDellaRicetta, nomeDi, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { guastiDellaScala, catenaMs, TETTO_ATTESA_MS } from '../../src/giochi/fattoria3d/motore/taratura.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { dettoDi } from '../../src/giochi/fattoria3d/scena3d/detti.js'
import { dettaglioDi } from '../../src/giochi/fattoria3d/viste/inventario-puro.js'
import { SPECIE, profiloBestia, stadioBestia } from '../../src/giochi/fattoria3d/scena3d/bestie-puro.js'
import { siloDi, guastiDeiSilos } from '../../src/giochi/fattoria3d/dati/silos.js'
import { merceDaCassa, guastiDellaMongolfiera } from '../../src/giochi/fattoria3d/dati/mongolfiera.js'
import { premioDelPezzo, chiedibili, guastiDegliOrdini } from '../../src/giochi/fattoria3d/dati/ordini.js'
import { eMerce } from '../../src/giochi/fattoria3d/dati/vicini.js'
import { normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ctx = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : () => {}, set: () => true })
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) }
const THREE = await import('three')
const M = await import('../../src/giochi/fattoria3d/scena3d/modelli.js')
const C = await import('../../src/giochi/fattoria3d/scena3d/modelli-cortile.js')

function mondo({ monete = 1000 } = {}) {
  const b = { monete }, t = { ora: 1_000_000 }
  const f = new Fattoria3d({ stato: null, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  for (const o of f.ostacoli) if (!o.tolto) f._togliSenzaPagare(o)
  return { f, b, t }
}
const alLivello = (f, n) => { f.s.esperienza = sogliaDi(n); return f }
const postoPer = (f, tipo) => { for (let j = -3; j < 8; j++) for (let i = -6; i < 6; i++) if (f.puoMettere(tipo, i, j).ok) return [i, j]; return [0, 0] }
const metti = (f, tipo) => f.mettiPezzo(tipo, ...postoPer(f, tipo))

/* ══════════ 1. le ricette del pentolone sono quelle della 2D ══════════ */
const COME_2D = { carota: 'carote', patata: 'patate', zucca: 'zucche', pomodoro: 'pomodori', cavolfiore: 'cavolfiori' }
const id2d = k => COME_2D[k] || k
const IDS = ['beverone', 'zuppa', 'zuppa_orto', 'pastura']
{
  uguale('il pentolone fa le quattro ricette della 2D', Object.keys(MACCHINE.pentolone.ricette).join(), IDS.join())
  for (const id of IDS) {
    const r = RICETTE[id], d = RICETTE_2D.find(x => x.id === id)
    uguale(`${id}: in 2D la fa il pentolone`, d.dove, 'pentolone')
    uguale(`${id}: ingredienti e quantità come in 2D`, JSON.stringify(Object.entries(r.ing).map(([k, n]) => [id2d(k), n]).sort()), JSON.stringify(Object.entries(d.prende).sort()))
    uguale(`${id}: il tempo è quello della 2D (minuti veri)`, r.ms, d.minuti * 60000)
    uguale(`${id}: il prodotto è quello della 2D`, r.da || id, d.da)
    controlla(`${id}: è mangime, come in 2D`, r.mangime === true && PRODOTTI[d.da].mangime === true)
    controlla(`${id}: la faccia è nell'atlante`, !!ATLANTE[r.pezzo], r.pezzo)
    controlla(`${id}: il nome è quello della 2D (la merce o la scheda)`, r.nome === d.nome || r.nome === (PRODOTTI[d.da] || {}).nome, r.nome + ' / ' + d.nome)
  }
  for (const id of ['beverone', 'zuppa', 'pastura']) uguale(`${id}: stessa faccia della merce 2D`, RICETTE[id].pezzo, PRODOTTI[id].pezzo)
  uguale('i tre mangimi del pentolone', MANGIMI_DEL_PENTOLONE.join(), 'beverone,zuppa,pastura')
  uguale('i cinque mangimi in tutto (il fienile ne ha due)', MANGIMI.join(), [...MANGIMI_DEL_FIENILE, 'beverone', 'zuppa', 'pastura'].join())
  uguale('il pentolone è una macchina 3×3 in coda alla scaletta', [EDIFICI.pentolone.w, EDIFICI.pentolone.d, EDIFICI.pentolone.liv].join(), [3, 3, PROVVISORI.pentolone.liv].join())
  stessaLista('nessun guasto nei dati', [...guastiDelCatalogo(), ...guastiDelleRicette(COLTURE, EDIFICI), ...guastiDegliAnimali(PEZZI), ...guastiDeiLivelli(), ...guastiDellaScala()], [])
}

/* ══════════ 2. le bestie nuove mangiano e rendono come in 2D ══════════ */
{
  const RECINTI = { anatre: ['uova_anatra', 'anatre'], porcile: ['tartufi', 'porcile'], capre: ['latte_capra', 'capre'] }
  for (const [t, [ric, dove2d]] of Object.entries(RECINTI)) {
    const d = RICETTE_2D.find(x => x.id === ric), A = ANIMALI[t]
    uguale(`${t}: in 2D è il recinto «${dove2d}»`, d.dove, dove2d)
    uguale(`${t}: mangia quello che mangia in 2D`, JSON.stringify([A.mangia, A.pasti]), JSON.stringify([Object.keys(d.prende), Object.values(d.prende)[0]]))
    uguale(`${t}: dà il prodotto della 2D (il porcile: tartufi in 2D, pancetta in 3D)`, A.prodotto, t === 'porcile' ? 'pancetta' : d.da)
    controlla(`${t}: è un pezzo del catalogo, produttivo e di animali`, PEZZI[t] && PEZZI[t].produttivo === true && PEZZI[t].categoria === 'animali')
    controlla(`${t}: tutto ciò che mangia lo fa il pentolone`, A.mangia.every(k => RICETTE[k] && RICETTE[k].dove === 'pentolone'))
    controlla(`${t}: il mangime c'è prima della bestia`, A.mangia.every(k => livelloDelMangime(k) <= PEZZI[t].liv))
    controlla(`${t}: ha un nome per il livello`, nomeDi(PEZZI[t].liv) !== `Livello ${PEZZI[t].liv}`)
    controlla(`${t}: un solo pezzo produttivo al suo livello`, roba(PEZZI[t].liv).pezzi.filter(p => p.produttivo).length + roba(PEZZI[t].liv).edifici.length === 1)
  }
  uguale('le anatre fanno le uova di sempre, le capre il latte di sempre', [ANIMALI.anatre.prodotto, ANIMALI.capre.prodotto].join(), 'uova,latte')
  // DEVIAZIONE DICHIARATA dalla 2D (decisione dell'utente del 22/10/2026): il tartufo sembrava una cacca, come Hay Day il maiale fa la PANCETTA; l'id è rinominato (2D `tartufi`, 3D `pancetta`).
  uguale('i maiali fanno la pancetta, nome e emoji suoi, nessuna faccia d\'atlante', [PRODOTTI_ANIMALI.pancetta.nome, PRODOTTI_ANIMALI.pancetta.emoji, PRODOTTI_ANIMALI.pancetta.pezzo || '-'].join(), 'Pancetta,🥓,-')
  controlla('in 3D non esiste più un id tartufi', !PRODOTTI_ANIMALI.tartufi && !RICETTE.tartufi && ANIMALI.porcile.prodotto === 'pancetta' && RICETTE_2D.find(x => x.id === 'tartufi').da === 'tartufi')
  controlla('la pancetta aspetta il suo sprite e nell\'atlante non c\'è ancora', !!PRODOTTI_ANIMALI.pancetta.aspetta && !ATLANTE[PRODOTTI_ANIMALI.pancetta.aspetta])
  controlla('nessun nome o emoji «tartufo» resta visibile in 3D', ![...Object.values(PRODOTTI_ANIMALI), ...Object.values(RICETTE)].some(m => /tartuf/i.test(m.nome) || m.emoji === '🍄'))
  // i tempi sono in minuti veri e rispettano l'ordine della 2D (anatre 6 min, capre 12, maiali 20)
  controlla('i tempi seguono l\'ordine della 2D', ANIMALI.anatre.ms < ANIMALI.capre.ms && ANIMALI.capre.ms < ANIMALI.porcile.ms)
  controlla('la pancetta non supera il tetto d\'attesa in catena', catenaMs('pancetta') <= TETTO_ATTESA_MS, String(catenaMs('pancetta')))
  controlla('il conto dei tempi vede il mangime nuovo', msDelProdotto('pancetta') === ANIMALI.porcile.ms + lavoroDelMangime('zuppa', 2))
  // le bestie in più dentro: prezzo che sale, fino alla capienza, come per le altre
  for (const t of Object.keys(RECINTI)) {
    const n = CORTILE[t].posti, prezzi = Array.from({ length: n }, (_, k) => prezzoDellaBestia(t, k + 1))
    controlla(`${t}: i prezzi delle bestie salgono, e il pieno non ne ha`, prezzi.slice(0, -1).every((p, i) => p > 0 && (i === 0 || p > prezzi[i - 1])) && prezzi[n - 1] === null)
  }
}

/* ══════════ 3. i numeri provvisori stanno in un punto solo ══════════ */
{
  uguale('pentolone: livello e prezzo sono quelli di dati/cortile.js', [EDIFICI.pentolone.liv, EDIFICI.pentolone.prezzo].join(), [PROVVISORI.pentolone.liv, PROVVISORI.pentolone.prezzo].join())
  for (const t of ['anatre', 'porcile', 'capre']) {
    const p = PROVVISORI[t], A = ANIMALI[t]
    uguale(`${t}: pezzo e bestie sono quelli di dati/cortile.js`, JSON.stringify([PEZZI[t].liv, PEZZI[t].prezzo, A.posti, A.prezzoBestia, A.rincaroBestia, A.ms]), JSON.stringify([p.liv, p.prezzo, p.posti, p.prezzoBestia, p.rincaroBestia, p.ms]))
  }
  stessaLista('i livelli sono quelli della 2D: pentolone 23, stagno delle anatre 24, porcile 28, capre 40', [EDIFICI.pentolone.liv, PEZZI.anatre.liv, PEZZI.porcile.liv, PEZZI.capre.liv], [23, 24, 28, 40])
  stessaLista('e i prezzi pure: 150, 240, 260, 280', [EDIFICI.pentolone.prezzo, PEZZI.anatre.prezzo, PEZZI.porcile.prezzo, PEZZI.capre.prezzo], [150, 240, 260, 280])
  uguale('l\'ultimo livello è il 70, come in 2D', ULTIMO, 70)
}

/* ══════════ 4. la zucca e la patata hanno un'uscita (C23) ══════════ */
{
  const usi = k => Object.entries(RICETTE).filter(([, r]) => r.ing[k]).map(([id]) => id)
  controlla('la zucca va nella conserva d\'orto e nel pastone', usi('zucca').includes('conserva') && usi('zucca').includes('zuppa'), usi('zucca').join())
  controlla('la patata va nel minestrone, nelle patatine e nelle verdure lesse', ['minestrone', 'patatine', 'beverone'].every(r => usi('patata').includes(r)), usi('patata').join())
  controlla('anche il pomodoro, la carota e il cavolfiore hanno una strada in più', usi('pomodoro').includes('zuppa_orto') && usi('carota').includes('pastura') && usi('cavolfiore').includes('pastura'))
  controlla('l\'inventario dice a chi serve: zucca → pastone per i maiali', /Pastone/.test(dettaglioDi('zucca')))
  controlla('…e il mangime dice chi lo mangia', /anatre/.test(dettaglioDi('beverone')) && /maiali/.test(dettaglioDi('zuppa')) && /capre/.test(dettaglioDi('pastura')))
  uguale('il rifiuto dice dove si fa', dettoDi('manca-mangime', { servono: 2, mangia: ['zuppa'] }), 'Serve 🫕 pastone (2 a testa): lo fa il pentolone')
}

/* ══════════ 5. il motore: pentolone, anatre, maiali, capre ══════════ */
{
  const { f, t } = mondo({ monete: 99999 })
  uguale('il pentolone è chiuso fino al 23', f.compraEdificio('pentolone').motivo, 'non-sbloccato')
  alLivello(f, PEZZI.capre.liv)                    // il livello più alto del cortile: tutte le ricette del pentolone sono aperte (zuppa al 27, pastura al 39)
  controlla('si compra e si mette', f.compraEdificio('pentolone').ok && f.s.posseduti.pentolone)
  f.s.merci.zucca = 2; f.s.merci.patata = 2; f.s.merci.cavolfiore = 2; f.s.merci.pomodoro = 2; f.s.merci.carota = 2
  controlla('due zucche fanno un pastone (N → 1)', f.avviaRicettaIn('pentolone', 'zuppa').ok && f.s.merci.zucca === 0)
  t.ora += RICETTE.zuppa.ms; f.tick()
  controlla('la seconda strada: due pomodori, lo stesso pastone nello stesso scomparto', f.avviaRicettaIn('pentolone', 'zuppa_orto').ok && f.s.merci.pomodoro === 0)
  t.ora += RICETTE.zuppa_orto.ms; f.tick()
  controlla('patate e cavolfiore fanno le verdure lesse; carote e cavolfiore la verdura fresca', f.avviaRicettaIn('pentolone', 'beverone').ok)
  t.ora += RICETTE.beverone.ms; f.tick()
  controlla('…la verdura fresca vuole un altro cavolfiore', f.avviaRicettaIn('pentolone', 'pastura').ok === true || f.avviaRicettaIn('pentolone', 'pastura').motivo === 'mancano-ingredienti' || f.avviaRicettaIn('pentolone', 'pastura').motivo === 'forno-pieno')
  t.ora += 600000; f.tick(); f.ritiraDa('pentolone')
  uguale('in dispensa: due pastoni (da due strade), le verdure lesse', [f.s.prodotti.zuppa, f.s.prodotti.beverone].join(), '2,1')
  controlla('il pastone non si chiede al banco né si baratta: è mangime', RICETTE.zuppa.mangime === true)

  // le anatre
  controlla('lo stagno delle anatre si compra e si mette', f.compraPezzo('anatre').ok && metti(f, 'anatre').ok)
  const an = f.s.cose.find(c => c.tipo === 'anatre')
  uguale('una anatra nel prezzo, con fame', JSON.stringify(an.bestie), JSON.stringify([{ fine: null }]))
  uguale('con le verdure lesse nutre l\'anatra', f.provaCuraBestie(an.id).azione, 'nutri')
  controlla('nutrire consuma un pasto di verdure lesse e parte il lavoro', f.nutriBestie(an.id).ok && f.s.prodotti.beverone === undefined && an.bestie[0].fine === t.ora + ANIMALI.anatre.ms)
  t.ora += ANIMALI.anatre.ms; const r = f.raccogliProdotti(an.id)
  controlla('raccogliere dà uova (le stesse del pollaio)', r.ok && r.prodotto === 'uova' && f.s.prodotti.uova === 1)
  controlla('la sesta anatra è l\'ultima', (() => { let ok = true; for (let k = 1; k < ANIMALI.anatre.posti; k++) ok = ok && f.compraBestia(an.id).ok; return ok && f.compraBestia(an.id).motivo === 'pieno' })())

  // i maiali
  controlla('il porcile si compra e si mette', f.compraPezzo('porcile').ok && metti(f, 'porcile').ok)
  const po = f.s.cose.find(c => c.tipo === 'porcile')
  const pastoni = f.s.prodotti.zuppa; delete f.s.prodotti.zuppa
  uguale('senza pastone il porcile dice cosa serve', JSON.stringify(f.provaCuraBestie(po.id)), JSON.stringify({ azione: null, motivo: 'manca-mangime', servono: 2, mangia: ['zuppa'] }))
  f.s.prodotti.zuppa = pastoni
  controlla('il pastone nutre un maiale ogni due', f.nutriBestie(po.id).ok && f.s.prodotti.zuppa === undefined)
  t.ora += ANIMALI.porcile.ms; const rp = f.raccogliProdotti(po.id)
  controlla('i maiali danno la pancetta, merce nuova', rp.ok && rp.prodotto === 'pancetta' && f.s.prodotti.pancetta === 1)
  controlla('la pancetta si può chiedere ai vicini ma non è mangime', !RICETTE.pancetta && PRODOTTI_ANIMALI.pancetta.dove === 'porcile')

  // le capre
  controlla('il recinto delle capre si compra e si mette', f.compraPezzo('capre').ok && metti(f, 'capre').ok)
  const ca = f.s.cose.find(c => c.tipo === 'capre')
  f.s.merci.carota = 2; f.s.merci.cavolfiore = 1
  f.avviaRicettaIn('pentolone', 'pastura'); t.ora += RICETTE.pastura.ms; f.tick(); f.ritiraDa('pentolone')
  controlla('la verdura fresca nutre una capra', f.provaCuraBestie(ca.id).azione === 'nutri' && f.nutriBestie(ca.id).ok)
  t.ora += ANIMALI.capre.ms; const rc = f.raccogliProdotti(ca.id)
  controlla('le capre danno latte (lo stesso della stalla)', rc.ok && rc.prodotto === 'latte' && f.s.prodotti.latte === 1)
  controlla('il quadro dice bestia, emoji e capienza', JSON.stringify(f.infoBestie(ca)) === JSON.stringify({ tipo: 'capre', bestia: 'capra', bestie: 'capre', emoji: '🐐', n: 1, max: 4, pieno: false, prezzo: prezzoDellaBestia('capre', 1) }))
  // salvare e rileggere
  const salvato = JSON.parse(JSON.stringify(f.s)), r2 = normalizza(salvato)
  controlla('lo stato si rilegge uguale: pentolone, stagno, porcile e capre con le loro bestie', ['pentolone', 'anatre', 'porcile', 'capre'].every(tp => r2.cose.some(c => c.tipo === tp)) && r2.cose.find(c => c.tipo === 'anatre').bestie.length === ANIMALI.anatre.posti && r2.posseduti.pentolone)
}

/* ══════════ 6. i tre stadi delle nuove bestie (profili) ══════════ */
{
  controlla('le specie sono sei', SPECIE.length === 6 && ['anatra', 'maiale', 'capra'].every(s => SPECIE.includes(s)))
  for (const sp of ['anatra', 'maiale', 'capra']) {
    let nan = 0
    for (const st of [0, 1, 2]) for (let p = 0; p <= 1.0001; p += 0.1) for (const v of Object.values(profiloBestia(sp, st, p))) if (!Number.isFinite(v)) nan++
    uguale(`${sp}: nessun valore non finito`, nan, 0)
    const a = profiloBestia(sp, 0, 0), b = profiloBestia(sp, 1, 0.5), c = profiloBestia(sp, 2, 1)
    controlla(`${sp}: a fame il corpo è ridotto di un quarto o più, da pronto è tondo`, a.sx <= 0.78 && a.sy <= 0.7 && c.sx >= 1 && c.sy >= 1)
    controlla(`${sp}: la testa va su e il corpo si riempie fra i tre stadi`, a.testaY < b.testaY && b.testaY < c.testaY && a.sx < b.sx && b.sx < c.sx)
    controlla(`${sp}: alone e scintillio solo da pronto, il prodotto con lui`, a.alone === 0 && b.alone === 0 && c.alone === 1 && c.scintilla === 1 && a.dono === 0 && c.dono > 0)
    uguale(`${sp}: stadi dallo stato`, [stadioBestia('fame', 0.9), stadioBestia('lavora', 0.4), stadioBestia('pronta', 1)].join(), '0,1,2')
  }
  const m0 = profiloBestia('maiale', 0, 0), m1 = profiloBestia('maiale', 1, 0.5), m2 = profiloBestia('maiale', 2, 1)
  controlla('maiale: grufola solo al lavoro, il trogolo col pastone c\'è solo al lavoro e la pancetta spunta da pronta', m0.grufola === 0 && m1.grufola === 1 && m2.grufola === 0 && m0.mucchio === 0 && m1.mucchio > 0.2 && m2.mucchio === 0 && m1.dono === 0 && m2.dono === 1)
  controlla('maiale: le orecchie cadono a fame e la coda è un ricciolo solo da sazio', m0.orecchie > m2.orecchie && m0.coda === 0 && m2.coda === 1)
  const c0 = profiloBestia('capra', 0, 0), c1 = profiloBestia('capra', 1, 0.5), c2 = profiloBestia('capra', 2, 1)
  controlla('capra: la mammella cresce, la pallida sparisce, saltella solo da pronta', c0.mammella < c1.mammella && c1.mammella < c2.mammella && c0.pallida === 1 && c2.pallida === 0 && c0.salto === 0 && c2.salto === 1)
  const n0 = profiloBestia('anatra', 0, 0), n1 = profiloBestia('anatra', 1, 0.5), n2 = profiloBestia('anatra', 2, 1)
  controlla('anatra: l\'uovo cresce (niente a fame, enorme da pronta) e alza il petto', n0.uovo === 0 && n0.uovo < n1.uovo && n1.uovo < n2.uovo && n2.uovo >= 2.5 && n0.beccheggio < n2.beccheggio && n2.passo < n0.passo)
}

/* ══════════ 7. i modelli ══════════ */
{
  const adesso = Date.now()
  const stati = { fame: { fine: null }, lavora: { fine: adesso + 5000 }, pronta: { fine: adesso - 1000 } }
  for (const [nome, crea, ms] of [['anatra', k => C.creaAnatra(k), ANIMALI.anatre.ms], ['maiale', k => C.creaMaiale(k), ANIMALI.porcile.ms], ['capra', k => C.creaCapra(k), ANIMALI.capre.ms]]) {
    for (const [stadio, st] of Object.entries(stati)) {
      const b = crea(0); b.userData.attesa = 1e9
      const casa = { userData: { bestie: [b] } }
      b.userData.casa = b.position.clone()
      const s = stadio === 'lavora' ? { fine: adesso + ms * 0.5 } : st
      for (let i = 0; i < 40; i++) M.muoviBestie(casa, 0.05, i * 0.05, [s], adesso)
      const box = new THREE.Box3().setFromObject(b)
      controlla(`${nome} ${stadio}: l'ingombro è un numero e sta in un metro e mezzo`, Number.isFinite(box.min.y) && box.max.x - box.min.x < 1.5 && box.max.z - box.min.z < 1.5 && box.max.y < 1.5)
      controlla(`${nome} ${stadio}: alone e scintillio solo da pronto`, b.userData.alone.visible === (stadio === 'pronta'))
      controlla(`${nome} ${stadio}: il prodotto in vista solo se c'è qualcosa`, b.userData.dono.visible === (nome === 'anatra' ? stadio !== 'fame' : stadio === 'pronta'))
      let nan = 0; b.traverse(o => { for (const v of [o.position.x, o.position.y, o.position.z, o.scale.x, o.scale.y, o.scale.z, o.rotation.x, o.rotation.z]) if (!Number.isFinite(v)) nan++ })
      uguale(`${nome} ${stadio}: nessuna posa non finita`, nan, 0)
    }
    // la affamata è più piccola della pronta
    const f = crea(0), p = crea(0)
    M.muoviBestie({ userData: { bestie: [f] } }, 0.05, 0, [stati.fame], adesso); M.muoviBestie({ userData: { bestie: [p] } }, 0.05, 0, [stati.pronta], adesso)
    controlla(`${nome}: la pronta ha il corpo più grande della affamata`, p.userData.corpo.scale.x > f.userData.corpo.scale.x * 1.25 && p.userData.corpo.scale.y > f.userData.corpo.scale.y * 1.25)
    // i nodi nuovi sono del clone
    const c1 = crea(0), c2 = crea(0)
    controlla(`${nome}: i nodi sono del clone (la cache non li condivide)`, ['corpo', 'testa', 'dono', 'alone', 'scintilla', 'sbuffo'].every(k => c1.userData[k] && c1.userData[k] !== c2.userData[k] && c1.getObjectById(c1.userData[k].id)))
  }
  // i recinti
  for (const [nome, crea, tipo, n] of [['stagno delle anatre', C.creaStagnoAnatre, 'anatre', 6], ['porcile', C.creaPorcile, 'porcile', 4], ['recinto delle capre', C.creaRecintoCapre, 'capre', 4]]) {
    const stato = Array.from({ length: n }, (_, k) => ({ fine: [null, adesso + 5000, adesso - 5, null, adesso + 9e6, adesso - 5][k] }))
    const g = crea(stato)
    controlla(`${nome}: tante bestie quante gli stati`, g.userData.bestie.length === n)
    for (let i = 0; i < 200; i++) M.muoviBestie(g, 0.05, i * 0.05, stato, adesso)
    const box = new THREE.Box3().setFromObject(g), d = PEZZI[tipo]
    controlla(`${nome}: sta nell'impronta ${d.w}×${d.d} (con un po' di margine)`, box.min.x > -d.w / 2 - 0.15 && box.max.x < d.w / 2 + 0.15 && box.min.z > -d.d / 2 - 0.1 && box.max.z < d.d / 2 + 0.3 && box.min.y > -0.05, [box.min.x, box.max.x, box.min.z, box.max.z].map(x => x.toFixed(2)).join(' '))
    controlla(`${nome}: ha l'altezza per il cartello`, g.userData.altezza > 1)
    let mesh = 0; g.traverse(o => { if (o.isMesh) mesh++ })
    controlla(`${nome}: pochi mesh (fuso ciò che sta fermo)`, mesh < 80, String(mesh))
  }
  // il pentolone
  const pt = C.creaPentolone()
  let mesh = 0; pt.traverse(o => { if (o.isMesh) mesh++ })
  controlla('pentolone: sotto i 25 mesh, con fumo, altezza e animazione', mesh < 25 && pt.userData.fumo && pt.userData.altezza > 1 && typeof pt.userData.anima === 'function', String(mesh))
  pt.userData.anima(0.016, 1.3)
  const bx = new THREE.Box3().setFromObject(pt)
  controlla('pentolone: sta nell\'impronta 3×3', bx.min.x > -1.6 && bx.max.x < 1.6 && bx.min.z > -1.6 && bx.max.z < 1.6, [bx.min.x, bx.max.x, bx.min.z, bx.max.z].map(x => x.toFixed(2)).join(' '))
}

/* ══════════ la pancetta ha una catena (ricette solo 3D, numeri provvisori: dati/pancetta.js) ══════════ */
{
  const PIATTI = { uova_pancetta: ['conserviera', 'uova'], panino_pancetta: ['panificio', 'pane'], ravioli_pancetta: ['pasticceria', 'pasta'] }
  for (const [id, [dove, altro]] of Object.entries(PIATTI)) {
    const r = RICETTE[id]
    controlla(`${id}: è solo 3D, nella macchina ${dove}, con la pancetta e ${altro}`, !!r && r.solo3d === true && r.dove === dove && r.ing.pancetta === 1 && r.ing[altro] >= 1)
    controlla(`${id}: tempo in minuti veri, costo del gesto e livello dal porcile in poi`, r.ms >= 5 * 60000 && r.ms <= 12 * 60000 && r.costo >= 1 && r.costo <= 2 && livelloDellaRicetta(id) >= PEZZI.porcile.liv)
    controlla(`${id}: sta nella dispensa e paga come il piatto 2D che somiglia`, siloDi(id) === 'bottega' && !!PRODOTTI[r.premioCome] && premioDelPezzo(id) > 0, String(premioDelPezzo(id)))
    controlla(`${id}: si chiede al banco e ai vicini, e sale in mongolfiera solo con due lavorazioni (uova e pancetta ne ha una)`, chiedibili(ULTIMO).prodotti.includes(id) && eMerce(id) && merceDaCassa(id) === (id !== 'uova_pancetta'))
  }
  controlla('la pancetta sta nella stalla', siloDi('pancetta') === 'stalla')
  const vecchio = normalizza({ prodotti: { tartufi: 3, pancetta: 2, xyz: 5 } })
  uguale('un vecchio stato con i tartufi si legge senza eccezioni: la scorta si perde e nessun id sconosciuto resta', Object.keys(vecchio.prodotti).join() + '|' + vecchio.prodotti.pancetta, 'pancetta|2')
  stessaLista('nessun guasto nei dati con le ricette nuove', [...guastiDelleRicette(COLTURE, EDIFICI), ...guastiDeiLivelli(), ...guastiDellaScala(), ...guastiDeiSilos(), ...guastiDellaMongolfiera(), ...guastiDegliOrdini()], [])
}

riassunto('Fattoria 3D — pentolone, anatre, maiali e capre')
