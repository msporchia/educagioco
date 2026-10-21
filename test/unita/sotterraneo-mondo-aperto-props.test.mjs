/* ═══════════════════════════════════════════════════════════════════
   GLI OGGETTI DI SCENA FUORI DAL VILLAGGIO — docs/sotterraneo/mondo-3d.md

   Lapidi, rovine, menhir, palafitte, fumarole, carrelli, accampamenti,
   cartelli e lo scenario attorno a ogni ingresso: si derivano a scena
   dalle celle di una zona caricata del mondo a percorso, senza toccarle.
   Qui: le celle e la firma restano quelle, la stessa zona dà gli stessi
   oggetti da sola o con tutte le altre (a blocchi come tutto insieme),
   mai su una strada, davanti a una porta, nel villaggio o su un confine
   fra due zone, ognuno nella sua zona e nel pezzo giusto, ogni habitat il
   suo repertorio, ognuno dei quattordici ingressi il suo scenario, e il
   costo resta basso. Se la zona si scarica, i suoi oggetti se ne vanno.
   ═══════════════════════════════════════════════════════════════════ */
import { scheletroDelMondo, caricaZona, scaricaZona, caricaTutto, ERBA, ACQUA } from '../../src/giochi/sotterraneo/motore/mondo-percorso.js'
import { propsDellaZona, propsDelPezzo, TABELLA, FORME, SCENARI, scenarioDi } from '../../src/giochi/sotterraneo/scena3d/mondo/props-dove.js'
import { disegnaPropsAperti } from '../../src/giochi/sotterraneo/scena3d/mondo/props-aperto.js'
import { Cantiere } from '../../src/giochi/sotterraneo/scena3d/mondo/kit.js'
import { pezzoDi, grigliaDi } from '../../src/giochi/sotterraneo/scena3d/mondo/pezzi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = caricaTutto(scheletroDelMondo())
const firme = () => JSON.stringify([m.firma, m.carico.map(c => c.firma), Array.from(m.strada).reduce((s, v) => (Math.imul(s, 31) + v) | 0, 7)])
const prima = firme()
const perZona = m.zone.map((_, k) => propsDellaZona(m, k))
const lista = perZona.flat()
const W = m.W

/* ── le celle non cambiano, la stessa zona dà gli stessi oggetti ── */
uguale('derivare i props non cambia le celle né le firme', firme(), prima)
controlla('una seconda volta sulla stessa zona è la stessa lista', propsDellaZona(m, 2) === perZona[2])
{
  // un mondo nuovo con la sola zona 3 caricata (e prima la 1, poi scaricata): la stessa lista che con tutto caricato
  const solo = scheletroDelMondo()
  caricaZona(solo, 1); scaricaZona(solo, 1); caricaZona(solo, 3)
  uguale('a blocchi come tutto insieme: la palude da sola dà gli stessi oggetti', JSON.stringify(propsDellaZona(solo, 3)), JSON.stringify(perZona[3]))
  uguale('una zona non caricata non ha oggetti', propsDellaZona(solo, 1).length, 0)
  const p = pezzoDi(solo, m.pietre[4].x, m.pietre[4].y)
  controlla('un pezzo prende solo gli oggetti delle zone caricate', propsDelPezzo(solo, p).every(o => o.zona === 3))
}
dentro('ce ne sono qualche migliaio in tutto il mondo, non decine di migliaia', lista.length, 1500, 9000)
for (const [k, l] of perZona.entries()) dentro(`${m.zone[k].nome}: qualche centinaio`, l.length, 120, 1800)

/* ── dove stanno ── */
{
  let fuori = 0, sbagliato = 0, strada = 0, lotto = 0, villaggio = 0, porta = 0, cellaDoppia = 0, altraZona = 0, confine = 0
  const celle = new Set()
  for (const o of lista) {
    const cx = Math.floor(o.x), cy = Math.floor(o.z), k = cy * W + cx
    if (cx < 0 || cy < 0 || cx >= W || cy >= m.H) { fuori++; continue }
    if (o.pezzo !== pezzoDi(m, o.x, o.z)) sbagliato++
    const acqua = FORME[o.tipo].acqua
    if (m.terreno[k] !== (acqua ? ACQUA : ERBA)) sbagliato++
    if (m.zona[k] !== o.zona) altraZona++
    if (m.strada[k]) strada++
    if (m.blocco[k] === 1 || (m.riservato[k] && !o.tana) || m.campo[k] || m.ponte[k] >= 0 || m.varco[k] >= 0) lotto++
    const v = m.villaggio
    if (m.zonaCitta[k] || !m.reg[k] || (cx >= v.x - 3 && cy >= v.y - 3 && cx < v.x + v.w + 3 && cy < v.y + v.h + 3)) villaggio++
    for (const c of m.confini) if ((c.da === m.zone[o.zona].chiave || c.a === m.zone[o.zona].chiave) && Math.abs(m.arco[k] - c.s) < 7 && !acqua) confine++
    for (const p of m.posti) if (p.accanto && Math.hypot(p.accanto.x + 0.5 - o.x, p.accanto.y + 0.5 - o.z) < 1.2) porta++
    if (celle.has(k)) cellaDoppia++
    celle.add(k)
  }
  uguale('tutti dentro la mappa', fuori, 0)
  uguale('tutti sul terreno giusto (erba, o acqua per le ninfee e i pali) e nel pezzo del loro centro', sbagliato, 0)
  uguale('ognuno su una cella della sua zona', altraZona, 0)
  uguale('nessuno sopra una strada', strada, 0)
  uguale('nessuno su un lotto, un campo, un ponte, un valico o davanti a una porta riservata (il segno di una tana sta nel quadrato che il generatore le riserva: sotto, il suo test)', lotto, 0)
  uguale('nessuno nel villaggio (né attorno)', villaggio, 0)
  uguale('nessuno sul confine fra due zone (il fiume col ponte, la cresta col valico)', confine, 0)
  uguale('nessuno nella cella dove l\'eroe si ferma davanti a un posto', porta, 0)
  uguale('due oggetti non stanno mai nella stessa cella', cellaDoppia, 0)
}
{
  let vicini = 0
  for (const o of lista) for (const q of m.confini) for (const c of q.celle || []) if (Math.abs(c.x + 0.5 - o.x) < 3 && Math.abs(c.y + 0.5 - o.z) < 3) vicini++
  uguale('nessuno attaccato a un ponte o a un valico', vicini, 0)
  let sopra = 0
  const decoro = m.carico.flatMap(c => c.decoro)
  for (const o of lista) for (const d of decoro) if (d.blocca && Math.abs(d.x - o.x) < 2 && Math.abs(d.y - o.z) < 2 && Math.hypot(d.x - o.x, d.y - o.z) < 0.35 + d.s * 0.4 - 0.001) sopra++
  uguale('nessuno dentro un albero o un ingombro del decoro', sopra, 0)
}
{
  // lungo le strade: accanto a una strada e a distanza fra loro
  const lungo = lista.filter(o => o.strada)
  dentro('cartelli, totem e pietre miliari lungo le strade ce ne sono', lungo.length, 30, 400)
  let lontani = 0, vicini = 0
  for (const o of lungo) {
    const x = Math.floor(o.x), y = Math.floor(o.z)
    if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.strada[(y + dy) * W + x + dx])) lontani++
    for (const q of lungo) if (q !== o && q.zona === o.zona && Math.hypot(q.x - o.x, q.z - o.z) < 6) vicini++
  }
  uguale('tutti accanto a una strada', lontani, 0)
  uguale('mai a meno di sei celle l\'uno dall\'altro (nella stessa zona)', vicini, 0)
  uguale('i tipi lungo la strada sono tre', new Set(lungo.map(o => o.tipo)).size <= 3, true)
}

/* ── ogni habitat il suo repertorio ── */
{
  const ripetitorio = {}
  for (const o of lista) { if (o.ingresso || o.strada || o.tana) continue; const h = m.regioni[m.reg[Math.floor(o.z) * W + Math.floor(o.x)]].habitat; (ripetitorio[h] ||= new Set()).add(o.tipo) }
  const presenti = new Set(m.regioni.map(r => r.habitat))
  for (const [h, tab] of Object.entries(TABELLA)) {
    if (!presenti.has(h)) continue
    const ammessi = new Set(tab.map(t => t[0])), trovati = [...(ripetitorio[h] || [])]
    controlla(`${h}: ci sono oggetti del suo repertorio`, trovati.length >= 2, JSON.stringify(trovati))
    controlla(`${h}: niente che non sia in tabella`, trovati.every(t => ammessi.has(t)), JSON.stringify(trovati))
  }
  const tipi = new Set(lista.map(o => o.tipo))
  for (const t of ['tomba', 'cripta', 'cancello', 'arcoRotto', 'colonnaRotta', 'menhir', 'tronco', 'funghiGiganti', 'ragnatela', 'palafitta', 'ninfee', 'fumarola', 'rocciaSpaccata', 'ossa', 'tridente', 'carrello', 'minerale', 'accampamento', 'carro', 'cartello', 'totem', 'miliare'])
    controlla(`nel mondo c'è almeno un ${t}`, tipi.has(t))
}

/* ── ognuno dei quattordici ingressi il suo scenario ── */
{
  const TEMA = { altare: ['tomba', 'croce', 'cripta', 'cancello'], cantine: ['palizzata', 'sacchi', 'teschio', 'carro'], torre: ['trave', 'macerie'], gallerie: ['ragnatela', 'bozzolo'],
                 cerchio: ['tumulo', 'menhir', 'cespoErica', 'cairn'], corvaia: ['ossa', 'palo', 'teschio', 'ragnatela'],
                 cisterna: ['pozza', 'palo', 'ninfee', 'canneto', 'barca'], palafitta: ['canneto', 'palo', 'barca', 'pozza'],
                 labirinto: ['braciere', 'teschio', 'tridente', 'rocciaSpaccata'], fornace: ['fumarola', 'rocciaSpaccata', 'braciere'],
                 fondo: ['carrello', 'minerale', 'travi', 'argano', 'binari'], cava: ['carrello', 'minerale', 'travi', 'argano', 'binari'],
                 abisso: ['menhir', 'ossa', 'croce'], tombe: ['tomba', 'croce', 'colonnaRotta', 'menhir'] }
  uguale('gli ingressi sono quattordici', m.ingressi.length, 14)
  for (const g of m.ingressi) {
    const suoi = lista.filter(o => o.ingresso === g.chiave)
    controlla(`${g.chiave}: ha il suo scenario`, !!scenarioDi(g))
    controlla(`${g.chiave}: almeno tre oggetti attorno`, suoi.length >= 3, suoi.length)
    controlla(`${g.chiave}: dice cosa c'è sotto (${TEMA[g.chiave].join(', ')})`, suoi.some(o => TEMA[g.chiave].includes(o.tipo)), suoi.map(o => o.tipo).join(','))
    controlla(`${g.chiave}: sta vicino (a meno di nove celle)`, suoi.every(o => Math.hypot(o.x - (g.x + g.w / 2), o.z - (g.y + g.h / 2)) < 9))
  }
  controlla('la cava gelata e il pozzo dei corvi hanno uno scenario loro (non quello del monumento che usano)', SCENARI.cava !== SCENARI.miniera && SCENARI.corvaia !== SCENARI.pozzo)
}

/* ── il pezzo, il disegno e quanto costa ── */
{
  const { n } = grigliaDi(m)
  let tot = 0, max = 0, disegnati = 0
  const mats = new Set(), cose = { camini: [], braci: [], fuochi: [], spruzzi: [] }
  for (let p = 0; p < n; p++) {
    const sue = propsDelPezzo(m, p)
    if (!sue.every(o => pezzoDi(m, o.x, o.z) === p)) controlla(`il pezzo ${p}: i suoi oggetti stanno nel suo riquadro`, false)
    const c = new Cantiere()
    disegnaPropsAperti(m, p, c, cose)
    for (const nome of Object.keys(c.liste)) mats.add(nome)
    tot += c.tri; max = Math.max(max, c.tri); disegnati += sue.length
  }
  uguale('ogni oggetto viene disegnato in un pezzo', disegnati, lista.length)
  controlla('solo materiali che i pezzi hanno già (pietra, legno, liscio, e luce dove brilla)', [...mats].every(x => ['pietra', 'legno', 'liscio', 'luce'].includes(x)), [...mats].join(','))
  dentro('il pezzo più carico (nove si vedono insieme)', max, 1000, 14000)
  controlla('le fumarole mandano fumo e i bracieri braci', cose.camini.length >= 3 && cose.braci.length >= 2 && cose.fuochi.length >= 2)
  nota(`${lista.length} oggetti, ${Math.round(tot / 1000)}k triangoli in tutto il mondo, il pezzo più carico ${Math.round(max / 1000)}k`)
}

/* ── la zona se ne va, coi suoi oggetti ── */
{
  const p = pezzoDi(m, m.pietre[2].x, m.pietre[2].y)
  controlla('il pezzo della pietra del bosco ha oggetti', propsDelPezzo(m, p).some(o => o.zona === 1))
  scaricaZona(m, 1)
  controlla('scaricato il bosco, nel suo pezzo non ce ne sono più', !propsDelPezzo(m, p).some(o => o.zona === 1))
  caricaZona(m, 1)
  uguale('ricaricato, tornano gli stessi', JSON.stringify(propsDellaZona(m, 1)), JSON.stringify(perZona[1]))
}

riassunto('gli oggetti di scena fuori dal villaggio')
