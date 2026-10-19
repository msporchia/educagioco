/* ═══════════════════════════════════════════════════════════════════
   GLI OGGETTI DI SCENA FUORI DALLE CITTÀ — docs/sotterraneo/mondo-3d.md

   Lapidi, rovine, menhir, palafitte, fumarole, carrelli, accampamenti,
   cartelli e lo scenario attorno a ogni ingresso: si derivano a scena
   dalle celle che il generatore ha già fatto, senza toccare la pianta.
   Qui: la pianta e la firma restano quelle (e si può rifare), le
   posizioni sono deterministiche, mai su una strada, davanti a una porta,
   in una città o nel villaggio, ognuno nel pezzo giusto, ogni habitat ha il
   suo repertorio, ogni ingresso il suo scenario, e il costo resta basso.
   ═══════════════════════════════════════════════════════════════════ */
import { generaMondoAperto, ERBA, ACQUA } from '../../src/giochi/sotterraneo/motore/mondo-aperto.js'
import { MONDO_APERTO } from '../../src/giochi/sotterraneo/dati/mondo-aperto.js'
import { propsDelMondo, propsDelPezzo, TABELLA, FORME, SCENARI } from '../../src/giochi/sotterraneo/scena3d/mondo/props-dove.js'
import { disegnaPropsAperti } from '../../src/giochi/sotterraneo/scena3d/mondo/props-aperto.js'
import { Cantiere } from '../../src/giochi/sotterraneo/scena3d/mondo/kit.js'
import { pezzoDi, grigliaDi } from '../../src/giochi/sotterraneo/scena3d/mondo/pezzi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const m = generaMondoAperto(MONDO_APERTO.seme)
const prima = JSON.stringify([m.firma, Array.from(m.terreno), Array.from(m.blocco), Array.from(m.strada), Array.from(m.riservato), m.decoro.length, m.posti.length])
const lista = propsDelMondo(m)
const W = m.W

/* ── la pianta non cambia ── */
uguale('derivare i props non cambia la pianta né la firma', JSON.stringify([m.firma, Array.from(m.terreno), Array.from(m.blocco), Array.from(m.strada), Array.from(m.riservato), m.decoro.length, m.posti.length]), prima)
uguale('la firma è ancora quella della scheda', m.firma, MONDO_APERTO.firma)
controlla('una seconda volta sullo stesso mondo è la stessa lista', propsDelMondo(m) === lista)
{
  const m2 = generaMondoAperto(MONDO_APERTO.seme)
  uguale('da un altro mondo con lo stesso seme escono gli stessi props, nello stesso ordine', JSON.stringify(propsDelMondo(m2)), JSON.stringify(lista))
}
dentro('ce ne sono centinaia, non migliaia', lista.length, 250, 1500)

/* ── dove stanno ── */
{
  let fuori = 0, sbagliato = 0, strada = 0, lotto = 0, citta = 0, villaggio = 0, porta = 0, cellaDoppia = 0
  const celle = new Set()
  for (const o of lista) {
    const cx = Math.floor(o.x), cy = Math.floor(o.z), k = cy * W + cx
    if (cx < 0 || cy < 0 || cx >= W || cy >= m.H) { fuori++; continue }
    if (o.pezzo !== pezzoDi(m, o.x, o.z)) sbagliato++
    const acqua = FORME[o.tipo].acqua
    if (m.terreno[k] !== (acqua ? ACQUA : ERBA)) sbagliato++
    if (m.strada[k]) strada++
    if (m.blocco[k] === 1 || m.riservato[k] || m.campo[k] || m.ponte[k] >= 0 || m.varco[k] >= 0) lotto++
    if (m.zonaCitta[k] || m.citta.some(c => Math.hypot(c.centro.x - o.x, c.centro.y - o.z) < c.raggio + 2)) citta++
    if (m.regioni[m.reg[k]].anello < 1) villaggio++
    for (const p of m.posti) if (p.accanto && Math.hypot(p.accanto.x + 0.5 - o.x, p.accanto.y + 0.5 - o.z) < 1.2) porta++
    if (celle.has(k)) cellaDoppia++
    celle.add(k)
  }
  uguale('tutti dentro la mappa', fuori, 0)
  uguale('tutti sul terreno giusto (erba, o acqua per le ninfee e i pali) e nel pezzo del loro centro', sbagliato, 0)
  uguale('nessuno sopra una strada', strada, 0)
  uguale('nessuno su un lotto, un campo, un ponte, un valico o davanti a una porta riservata', lotto, 0)
  uguale('nessuno in una città (né attorno)', citta, 0)
  uguale('nessuno nel villaggio', villaggio, 0)
  uguale('nessuno nella cella dove l\'eroe si ferma davanti a un posto', porta, 0)
  uguale('due oggetti non stanno mai nella stessa cella', cellaDoppia, 0)
}
{
  // sui bordi dei passaggi (ponti, valichi, grate) non ce n'è
  let vicini = 0
  for (const o of lista) for (const q of m.passaggi) for (const c of q.celle || []) if (Math.abs(c.x + 0.5 - o.x) < 1.5 && Math.abs(c.y + 0.5 - o.z) < 1.5) vicini++
  uguale('nessuno attaccato a un ponte o a un valico', vicini, 0)
  // né dentro un albero o un ingombro del decoro
  let sopra = 0
  for (const o of lista) for (const d of m.decoro) if (d.blocca && Math.hypot(d.x - o.x, d.y - o.z) < 0.35 + d.s * 0.4 - 0.001) sopra++
  uguale('nessuno dentro un albero o un ingombro del decoro', sopra, 0)
}
{
  // lungo le strade: accanto a una strada e a distanza fra loro
  const lungo = lista.filter(o => o.strada)
  dentro('cartelli, totem e pietre miliari lungo le strade ce ne sono', lungo.length, 8, 80)
  let lontani = 0, vicini = 0
  for (const o of lungo) {
    const x = Math.floor(o.x), y = Math.floor(o.z)
    if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.strada[(y + dy) * W + x + dx])) lontani++
    for (const q of lungo) if (q !== o && Math.hypot(q.x - o.x, q.z - o.z) < 6) vicini++
  }
  uguale('tutti accanto a una strada', lontani, 0)
  uguale('mai a meno di sei celle l\'uno dall\'altro', vicini, 0)
  uguale('i tipi lungo la strada sono tre', new Set(lungo.map(o => o.tipo)).size <= 3, true)
}

/* ── ogni habitat il suo repertorio ── */
{
  const ripetitorio = {}
  for (const o of lista) { if (o.ingresso || o.strada) continue; const h = m.regioni[m.reg[Math.floor(o.z) * W + Math.floor(o.x)]].habitat; (ripetitorio[h] ||= new Set()).add(o.tipo) }
  for (const [h, tab] of Object.entries(TABELLA)) {
    const ammessi = new Set(tab.map(t => t[0])), trovati = [...(ripetitorio[h] || [])]
    controlla(`${h}: ci sono oggetti del suo repertorio`, trovati.length >= 2, JSON.stringify(trovati))
    controlla(`${h}: niente che non sia in tabella`, trovati.every(t => ammessi.has(t)), JSON.stringify(trovati))
  }
  const tipi = new Set(lista.map(o => o.tipo))
  for (const t of ['tomba', 'cripta', 'cancello', 'arcoRotto', 'colonnaRotta', 'menhir', 'tronco', 'funghiGiganti', 'ragnatela', 'palafitta', 'ninfee', 'fumarola', 'rocciaSpaccata', 'ossa', 'tridente', 'carrello', 'minerale', 'accampamento', 'carro', 'cartello', 'totem', 'miliare'])
    controlla(`nel mondo c'è almeno un ${t}`, tipi.has(t))
}

/* ── ogni ingresso il suo scenario ── */
{
  const TEMA = { altare: ['tomba', 'croce', 'cripta', 'cancello'], arco: ['palizzata', 'sacchi', 'teschio', 'carro'], torre: ['trave', 'macerie'], grotta: ['ragnatela', 'bozzolo'],
                 stagno: ['pozza', 'palo', 'ninfee', 'canneto', 'barca'], botola: ['braciere', 'teschio', 'tridente', 'rocciaSpaccata'], miniera: ['carrello', 'minerale', 'travi', 'argano', 'binari'], pozzo: ['menhir', 'ossa', 'croce'] }
  uguale('gli scenari sono otto', Object.keys(SCENARI).length, 8)
  uguale('gli ingressi sono otto', m.ingressi.length, 8)
  for (const g of m.ingressi) {
    const suoi = lista.filter(o => o.ingresso === g.chiave)
    controlla(`${g.chiave}: almeno tre oggetti attorno`, suoi.length >= 3, suoi.length)
    controlla(`${g.chiave}: dice cosa c'è sotto (${TEMA[g.monumento].join(', ')})`, suoi.some(o => TEMA[g.monumento].includes(o.tipo)), suoi.map(o => o.tipo).join(','))
    controlla(`${g.chiave}: sta vicino (a meno di nove celle)`, suoi.every(o => Math.hypot(o.x - (g.x + g.w / 2), o.z - (g.y + g.h / 2)) < 9))
  }
}

/* ── il pezzo, il disegno e quanto costa ── */
{
  const { n } = grigliaDi(m)
  let tot = 0, max = 0, mats = new Set(), disegnati = 0
  const cose = { camini: [], braci: [], fuochi: [], spruzzi: [] }
  for (let p = 0; p < n; p++) {
    const sue = propsDelPezzo(m, p)
    controlla(`il pezzo ${p}: i suoi oggetti stanno nel suo riquadro`, sue.every(o => pezzoDi(m, o.x, o.z) === p))
    const c = new Cantiere()
    disegnaPropsAperti(m, p, c, cose)
    for (const nome of Object.keys(c.liste)) mats.add(nome)
    tot += c.tri; max = Math.max(max, c.tri); disegnati += sue.length
  }
  uguale('ogni oggetto viene disegnato in un pezzo', disegnati, lista.length)
  controlla('solo materiali che i pezzi hanno già (pietra, legno, liscio, e luce dove brilla)', [...mats].every(x => ['pietra', 'legno', 'liscio', 'luce'].includes(x)), [...mats].join(','))
  dentro('triangoli in tutto il mondo (senza ombra)', tot, 20000, 140000)
  dentro('il pezzo più carico (nove si vedono insieme)', max, 1000, 12000)
  controlla('le fumarole mandano fumo e i bracieri braci', cose.camini.length >= 3 && cose.braci.length >= 2 && cose.fuochi.length >= 2)
  nota(`${lista.length} oggetti, ${Math.round(tot / 1000)}k triangoli in tutto, il pezzo più carico ${Math.round(max / 1000)}k`)
}

riassunto('gli oggetti di scena fuori dalle città')
