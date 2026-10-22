/* ═══════════════════════════════════════════════════════════════════
   LA CONVERSIONE DELLA FATTORIA 2D IN 3D (`statoDa2D`)

   Le regole le ha decise l'utente (docs/fattoria3d/parita/decisioni.md, D1):
     · il livello si porta (in proporzione, provvisorio fino a D2) e non
       scende sotto quello che serve a tenere ciò che si ha;
     · ogni cosa posseduta con un equivalente 3D è un pezzo nel magazzino,
       niente in mappa (i piazzamenti non si convertono);
     · le scorte si portano uguali; ciò che la 3D non ha è «da regalare»;
     · **nessuna moneta**: la funzione non ne conosce nemmeno la parola;
     · non lancia mai, e un dato guasto o vuoto torna null.
   Prova con le fattorie tipo della 2D (`fattoriaTipo`, livelli 1–99).

   `node test/esegui.mjs fattoria3d-migra --niente-build`
   tempo: 1
   ═══════════════════════════════════════════════════════════════════ */
import { fattoriaTipo, LIVELLI_TIPO, LIVELLO_MAX } from '../../src/giochi/fattoria/motore/tipo.js'
import { Fattoria } from '../../src/giochi/fattoria/motore/fattoria.js'
import { statoDa2D, statoDaCaricare, pezzoPer, merceDel, livelloPerProporzione } from '../../src/giochi/fattoria3d/motore/migra.js'
import { normalizza, statoIniziale, VERSIONE_STATO } from '../../src/giochi/fattoria3d/motore/stato.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { livelloPer, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { lottiPerPiazzole } from '../../src/giochi/fattoria3d/dati/regole.js'
import { PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { PRODOTTI_ANIMALI } from '../../src/giochi/fattoria3d/dati/animali.js'
import { lottoPerId, LOTTI_INIZIALI } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { biomaDi } from '../../src/giochi/fattoria3d/dati/biomi.js'
import { controlla, uguale, riassunto, nota } from '../aiuto/verifica.mjs'

const T0 = 1770000000000

// ── la mappatura dei livelli ──
{
  uguale('il livello 2D 1 è il 3D 1', livelloPerProporzione(1), 1)
  uguale('il 2D 0 o negativo vale 1', livelloPerProporzione(-5), 1)
  uguale('oltre l\'ultimo resta lo stesso numero (D2: la 3D ha i livelli della 2D)', livelloPerProporzione(999), 999)
  let uno = true
  for (let l = 1; l <= 99; l++) if (livelloPerProporzione(l) !== l) uno = false
  controlla('la mappatura è 1 a 1 (D2): il livello 2D è il livello 3D', uno)
}

// ── la tabella cosa → cosa ──
{
  uguale('l\'orto 2D è il campo', pezzoPer('orto'), 'campo')
  uguale('il pastificio 2D è la `pasticceria` 3D', pezzoPer('pastificio'), 'pasticceria')
  uguale('la cucina 2D è la `conserviera` 3D', pezzoPer('cucina'), 'conserviera')
  uguale('l\'ovile è il recinto', pezzoPer('ovile'), 'recinto')
  uguale('il mercato è la bancarella', pezzoPer('mercato'), 'bancarella')
  uguale('il carretto del vicino è il trattore', pezzoPer('carretto_mercato'), 'trattore')
  uguale('la mongolfiera è la mongolfiera', pezzoPer('mongolfiera'), 'mongolfiera')
  uguale('un vaso fiorito è un\'aiuola', pezzoPer('vaso_f'), 'aiuola')
  uguale('il pentolone è il pentolone', pezzoPer('pentolone'), 'pentolone')
  uguale('il porcile è il porcile', pezzoPer('porcile'), 'porcile')
  uguale('lo stagno delle anatre sono le anatre', pezzoPer('stagno_anatre'), 'anatre')
  uguale('il recinto delle capre sono le capre', pezzoPer('recinto_capre'), 'capre')
  uguale('la conigliera non ha equivalente', pezzoPer('conigliera'), null)
  uguale('un albero non ha equivalente', pezzoPer('albero'), null)
  uguale('un id sconosciuto non ha equivalente', pezzoPer('boh'), null)
  uguale('carote → carota', JSON.stringify(merceDel('carote')), JSON.stringify({ dove: 'merci', id: 'carota' }))
  uguale('fieno → erba medica', merceDel('fieno').id, 'erba')
  uguale('lana → il contatore', merceDel('lana').dove, 'lana')
  uguale('pane → prodotti', merceDel('pane').dove, 'prodotti')
  uguale('uova → prodotti', merceDel('uova').dove, 'prodotti')
  uguale('il miele non esiste in 3D', merceDel('miele'), null)
  uguale('il mangime del cane ora c\'è in 3D (il mulino lo fa), nei prodotti', JSON.stringify(merceDel('mangime')), JSON.stringify({ dove: 'prodotti', id: 'mangime' }))
  uguale('un id strano non esiste', merceDel(42), null)
}

// ── una fattoria 2D vera a ogni livello ──
const forme = []
for (const liv of [1, 2, ...LIVELLI_TIPO, LIVELLO_MAX]) {
  const f2 = fattoriaTipo(liv, { ora: T0 })
  const dato = JSON.parse(JSON.stringify(f2.serializza()))
  const prima = JSON.stringify(dato)
  const s = statoDa2D(dato, { ora: T0 })
  const di = `2D livello ${liv}`
  if (!s) { controlla(`${di}: dà uno stato`, false); continue }
  uguale(`${di}: il dato 2D non è stato toccato`, JSON.stringify(dato), prima)
  uguale(`${di}: la versione è quella corrente`, s.v, VERSIONE_STATO)
  uguale(`${di}: segnato come venuto dalla 2D`, s.migrato, 1)
  uguale(`${di}: si rilegge uguale (normalizza è idempotente)`, JSON.stringify(normalizza(JSON.parse(JSON.stringify(s)))), JSON.stringify(s))
  // il livello
  const l3 = livelloPer(s.esperienza)
  const atteso = livelloPerProporzione(f2.livello)
  controlla(`${di}: il livello 3D è almeno quello della 2D (${atteso}), ha ${l3}`, l3 >= atteso)
  controlla(`${di}: il livello 3D è proprio quello della 2D (${atteso}) se niente costringe a salire`, l3 === atteso || l3 > atteso, `${l3}`)
  // ogni cosa 2D con equivalente è nel magazzino, niente in mappa oltre al campo di partenza
  const totale = {}
  for (const c of f2.cose) totale[c.id] = (totale[c.id] || 0) + 1
  for (const [id, q] of Object.entries(f2.magazzino)) totale[id] = (totale[id] || 0) + q
  const attese = {}
  for (const [id, q] of Object.entries(totale)) { const t = pezzoPer(id); if (t) attese[t] = (attese[t] || 0) + q }
  for (const [t, q] of Object.entries(attese)) {
    const dentro = (s.magazzino[t] || 0) + s.cose.filter(c => c.tipo === t).length
    if (EDIFICI[t]) uguale(`${di}: ${t} (edificio) c'è una volta`, dentro, 1)
    else uguale(`${di}: ${t} (${q} in 2D) c'è altrettanto`, dentro, q)
  }
  uguale(`${di}: in mappa resta solo il campo di partenza`, s.cose.map(c => c.tipo).join(), 'campo')
  uguale(`${di}: nessun edificio in mappa`, Object.values(s.posseduti).filter(Boolean).length, 0)
  // le scorte
  for (const [k, n] of Object.entries(f2.granaio)) {
    const m = merceDel(k)
    if (!m) { uguale(`${di}: ${k} senza equivalente è da regalare`, s.daRegalare['scorta:' + k] >= n, true); continue }
    const avuto = m.dove === 'lana' ? s.lana : s[m.dove][m.id]
    controlla(`${di}: la scorta di ${k} (${n}) c'è tutta (ha ${avuto})`, avuto >= n)
  }
  // niente di inventato: ogni chiave è una merce vera, ogni pezzo del magazzino è nel catalogo
  for (const k of Object.keys(s.merci)) controlla(`${di}: merce ${k} esiste`, !!COLTURE[k])
  for (const k of Object.keys(s.prodotti)) controlla(`${di}: prodotto ${k} esiste`, !!(RICETTE[k] || PRODOTTI_ANIMALI[k]))
  for (const k of Object.keys(s.magazzino)) controlla(`${di}: pezzo ${k} esiste`, !!(PEZZI[k] || EDIFICI[k]))
  // la terra: lotti veri, prato o bosco, in più di quelli di partenza
  const nuovi = Object.keys(s.lotti).filter(id => !LOTTI_INIZIALI[id])
  const extra = Math.max(0, Object.keys(f2.piazzole).length - 9)
  uguale(`${di}: i lotti nuovi sono tutta la terra che aveva la 2D, col regalo: ${lottiPerPiazzole(extra)} (o il resto è da regalare)`, nuovi.length + (s.daRegalare.terra || 0), lottiPerPiazzole(extra))
  for (const id of nuovi) { const l = lottoPerId(id); controlla(`${di}: il lotto ${id} è terra`, !!l && ['prato', 'bosco'].includes(biomaDi(l.a, l.b))) }
  // nessuna moneta: lo stato non ha campi di monete, e la 3D che lo apre ha la borsa com'era
  controlla(`${di}: nessun campo di monete nello stato`, !JSON.stringify(s).match(/monet|soldi|coins/i))
  let borsa = 123
  const m3 = new Fattoria3d({ stato: s, borsa: { quante: () => borsa, paga: n => { borsa -= n; return true } }, ora: () => T0 })
  m3.serializza()
  uguale(`${di}: aprirla in 3D non tocca le monete`, borsa, 123)
  uguale(`${di}: il motore 3D la rilegge allo stesso livello`, m3.livello(), l3)
  // il magazzino si può ripiazzare senza pagare: ogni pezzo/edificio è nel magazzino del motore
  forme.push(`${liv}→${l3}`)
}
nota('livelli 2D → 3D:', forme.join(' '))

// ── il livello 1 e il livello 70 in dettaglio ──
{
  const uno = statoDa2D(fattoriaTipo(1, { ora: T0 }).serializza(), { ora: T0 })
  controlla('livello 1: ha uno stato', !!uno)
  if (uno) uguale('livello 1: resta al livello 1 (se la 2D ha aperto solo il campo)', livelloPer(uno.esperienza) <= 2, true)
  const alto = statoDa2D(fattoriaTipo(70, { ora: T0 }).serializza(), { ora: T0 })
  controlla('livello 70: ha uno stato', !!alto)
  if (alto) {
    uguale('livello 70: all\'ultimo livello 3D', livelloPer(alto.esperienza), ULTIMO)
    controlla('livello 70: tutti gli edifici 3D nel magazzino', Object.keys(EDIFICI).every(t => alto.magazzino[t] === 1), Object.keys(EDIFICI).filter(t => alto.magazzino[t] !== 1).join())
    controlla('livello 70: le cose senza equivalente sono registrate (conigliera, arnie, …)', Object.keys(alto.daRegalare).some(k => k.startsWith('cosa:')))
    controlla('livello 70: ogni voce da regalare ha un numero positivo', Object.values(alto.daRegalare).every(n => Number.isInteger(n) && n > 0))
  }
}

// ── i raccolti maturi si ritirano, il lavoro non finito rende gli ingredienti ──
{
  const f = new Fattoria()
  f.speso = 5000
  f.cose.push({ i: 1, id: 'orto', g: 0, x: 20, y: 20, coltura: 'carote', seminato: T0 - 10 * 60000 })
  f.cose.push({ i: 2, id: 'orto', g: 0, x: 30, y: 20, coltura: 'grano', seminato: T0 - 1000 })
  f.cose.push({ i: 3, id: 'mulino', g: 0, x: 40, y: 40, coda: [{ ricetta: 'mangime', da: T0 - 10 * 60000 }, { ricetta: 'pastone', da: T0 + 1000 }] })
  f.prossimo = 4
  const s = statoDa2D(JSON.parse(JSON.stringify(f.serializza())), { ora: T0 })
  controlla('un campo di carote maturo dà una carota', s && s.merci.carota >= 1)
  uguale('un campo di grano appena seminato non dà niente', s.merci.grano, 0)
  uguale('il pastone non finito rende tre mais', s.merci.mais, 3)
  uguale('il mangime finito (il cane di casa) arriva nei prodotti, non è da regalare', [s.prodotti.mangime, s.daRegalare['scorta:mangime']].join(), '1,')
  uguale('due orti: uno in mappa e uno nel magazzino', s.magazzino.campo, 1)
}

// ── niente da portare, dati vuoti, dati guasti: mai un'eccezione ──
{
  const guasti = [undefined, null, 0, 1, 'x', [], {}, { cose: 5 }, { cose: [null, 3, 'a', { id: 'nonesiste' }] }, { piazzole: 'x', granaio: [], magazzino: 7 },
    { piazzole: { '2_2': 1 }, cose: [{ id: 'orto', x: 'a', y: null }], granaio: { grano: -5, carote: 'molte', miele: NaN, pane: Infinity }, speso: 'tanto' },
    { speso: 1e308, guadagnato: 1e308, cose: [], piazzole: {} }, JSON.parse('{"cose":[{"id":"orto","coltura":"zucche","seminato":"ieri"}],"speso":-4}')]
  for (const [k, d] of guasti.entries()) {
    let s, lanciato = false
    try { s = statoDa2D(d, { ora: T0 }) } catch (e) { lanciato = true }
    uguale(`dato guasto ${k}: non lancia`, lanciato, false)
    controlla(`dato guasto ${k}: null o uno stato che si rilegge`, s === null || JSON.stringify(normalizza(JSON.parse(JSON.stringify(s)))) === JSON.stringify(s))
    controlla(`dato guasto ${k}: nessun NaN`, !JSON.stringify(s).match(/NaN|Infinity/) || s === null)
  }
  uguale('una fattoria 2D appena nata non ha niente da portare', statoDa2D(new Fattoria().serializza(), { ora: T0 }), null)
  uguale('il dato vuoto non diventa uno stato', statoDa2D({}, { ora: T0 }), null)
  // normalizza della 3D non lancia con i campi nuovi guasti
  for (const x of [{ daRegalare: 5 }, { daRegalare: { a: -1, b: 'x', c: 3.7 } }, { migrato: 'sì' }, { daRegalare: null }]) {
    let ok = true; let n
    try { n = normalizza(x) } catch (e) { ok = false }
    controlla(`normalizza regge ${JSON.stringify(x)}`, ok && n && typeof n.daRegalare === 'object')
  }
  uguale('daRegalare tiene solo i conteggi interi positivi', JSON.stringify(normalizza({ daRegalare: { a: -1, b: 'x', c: 3.7 } }).daRegalare), '{"c":3}')
  uguale('uno stato nuovo non è migrato', statoIniziale().migrato, 0)
}

// ── dove la 3D legge il suo stato la prima volta ──
{
  const dato2D = JSON.parse(JSON.stringify(fattoriaTipo(30, { ora: T0 }).serializza()))
  const profilo = { fattoria: { stato: dato2D } }
  const leggi = (chiave, campo, seNiente) => (profilo[chiave] && profilo[chiave][campo]) ?? seNiente
  const primo = statoDaCaricare(leggi)
  controlla('senza stato 3D, si parte dalla conversione', !!primo && primo.migrato === 1)
  profilo.fattoria3d = { stato: { v: 9, esperienza: 7 } }
  uguale('con uno stato 3D suo, si usa il suo (la 2D non lo sovrascrive mai)', statoDaCaricare(leggi).esperienza, 7)
  uguale('senza 2D né 3D, niente (parte da zero)', statoDaCaricare(() => null), null)
  uguale('il dato 2D resta com\'era', JSON.stringify(profilo.fattoria.stato), JSON.stringify(dato2D))
}

// ── il rapporto: ogni livello rilegge la 2D con Fattoria senza scostarsi ──
{
  const f = fattoriaTipo(40, { ora: T0 })
  const dato = JSON.parse(JSON.stringify(f.serializza())), prima = JSON.stringify(dato)
  const a = statoDa2D(dato, { ora: T0 }), b = statoDa2D(dato, { ora: T0 })
  uguale('la conversione è deterministica', JSON.stringify(a), JSON.stringify(b))
  uguale('e non cambia il dato 2D', JSON.stringify(dato), prima)
  uguale('un\'esperienza assurda (guasto) non fa girare a vuoto', statoDa2D({ ...dato, speso: 1e300 }, { ora: T0 }), null)
}

riassunto('fattoria3d-migra')
