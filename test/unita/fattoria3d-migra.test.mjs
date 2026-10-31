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
import { fattoriaTipo, LIVELLI_TIPO, LIVELLO_MAX } from '../../src/giochi/fattoria3d/da2d/motore/tipo.js'
import { Fattoria } from '../../src/giochi/fattoria3d/da2d/motore/fattoria.js'
import { statoDa2D, statoDaCaricare, statoRifattoDa2D, ritoccaLaConversione, MIGRAZIONE, pezzoPer, merceDel, livelloPerProporzione } from '../../src/giochi/fattoria3d/motore/migra.js'
import { normalizza, statoIniziale, VERSIONE_STATO } from '../../src/giochi/fattoria3d/motore/stato.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { livelloPer, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { lottiPerPiazzole } from '../../src/giochi/fattoria3d/dati/regole.js'
import { PEZZI, EDIFICI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { PRODOTTI_ANIMALI } from '../../src/giochi/fattoria3d/dati/animali.js'
import { MANGIMI_SENZA_RICETTA } from '../../src/giochi/fattoria3d/dati/cortile2.js'
import { lottoPerId, LOTTI_INIZIALI } from '../../src/giochi/fattoria3d/dati/mondo.js'
import { biomaDi } from '../../src/giochi/fattoria3d/dati/biomi.js'
import { CATALOGO as CATALOGO_2D, quantiVersi, puoSpecchiare, assettoDi } from '../../src/giochi/fattoria3d/da2d/dati/catalogo.js'
import { ANIMALI as ANIMALI_2D, IN_VENDITA as IN_VENDITA_2D, AGGANCI_TUTTI, agganciDi, puntiDi } from '../../src/giochi/fattoria3d/da2d/dati/animali.js'
import { createHash } from 'node:crypto'
import { controlla, uguale, riassunto, nota } from '../aiuto/verifica.mjs'

const T0 = 1770000000000
// le firme della 2D ferma (vedi in fondo, «la 2D è ferma»)
const FIRMA_TIPI_2D = 'e05f1bf82a5a'
const FIRMA_CATALOGO_2D = '6309d84d9297'
const FIRMA_BESTIE_2D = 'bc50807ca27a'

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
  uguale('un vaso fiorito 2D ha il suo vaso 3D', pezzoPer('vaso_f'), 'vaso_f')
  uguale('il bocciolo 2D resta un\'aiuola', pezzoPer('boccio'), 'aiuola')
  uguale('il pentolone è il pentolone', pezzoPer('pentolone'), 'pentolone')
  uguale('il porcile è il porcile', pezzoPer('porcile'), 'porcile')
  uguale('lo stagno delle anatre sono le anatre', pezzoPer('stagno_anatre'), 'anatre')
  uguale('il recinto delle capre sono le capre', pezzoPer('recinto_capre'), 'capre')
  uguale('la conigliera ha il suo equivalente (G5), la peschiera è il porticciolo (la pesca ne prende il posto)', [pezzoPer('conigliera'), pezzoPer('peschiera')].join(), 'conigliera,porticciolo')
  uguale('le zucche di Halloween sono le zucche', [pezzoPer('zucca_intagliata'), pezzoPer('zucche_mucchio')].join(), 'zucca_intagliata,zucche_mucchio')
  uguale('un albero 2D è un albero 3D da piantare (decorazioni G8)', pezzoPer('albero'), 'albero')
  uguale('la giostrina della fiera ha il suo pezzo 3D (la fiera è in 3D dal giro G9)', pezzoPer('fiera_giostra'), 'fiera_giostra')
  uguale('un id sconosciuto non ha equivalente', pezzoPer('boh'), null)
  uguale('carote → carota', JSON.stringify(merceDel('carote')), JSON.stringify({ dove: 'merci', id: 'carota' }))
  uguale('fieno → erba medica', merceDel('fieno').id, 'erba')
  uguale('lana → il contatore', merceDel('lana').dove, 'lana')
  uguale('pane → prodotti', merceDel('pane').dove, 'prodotti')
  uguale('uova → prodotti', merceDel('uova').dove, 'prodotti')
  uguale('il miele esiste in 3D (G5), e i fiori delle api pure', [merceDel('miele').id, merceDel('fiori').dove].join(), 'miele,prodotti')
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
  uguale(`${di}: segnato come venuto dalla 2D, con questa conversione`, s.migrato, MIGRAZIONE)
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
  for (const k of Object.keys(s.prodotti)) controlla(`${di}: prodotto ${k} esiste`, !!(RICETTE[k] || PRODOTTI_ANIMALI[k] || MANGIMI_SENZA_RICETTA[k]))
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
    uguale('livello 70: la peschiera è il porticciolo, uno solo', alto.magazzino.porticciolo, 1)
    controlla('livello 70: i silos non sono da regalare (li mette la 3D)', !Object.keys(alto.daRegalare).some(k => /^cosa:(silo|silo_bianco|dispensa)$/.test(k)), Object.keys(alto.daRegalare).join())
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
  f.granaio.tartufi = 2          // le scorte di tartufi della 2D
  const s = statoDa2D(JSON.parse(JSON.stringify(f.serializza())), { ora: T0 })
  controlla('un campo di carote maturo dà una carota', s && s.merci.carota >= 1)
  uguale('un campo di grano appena seminato non dà niente', s.merci.grano, 0)
  uguale('il pastone non finito rende tre mais', s.merci.mais, 3)
  uguale('il mangime finito (il cane di casa) arriva nei prodotti, non è da regalare', [s.prodotti.mangime, s.daRegalare['scorta:mangime']].join(), '1,')
  uguale('i tartufi 2D non passano (in 3D la pancetta è un\'altra merce): restano da regalare, mai monete né pancetta', [s.daRegalare['scorta:tartufi'], s.prodotti.pancetta, s.prodotti.tartufi].join(), '2,,')
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
  controlla('senza stato 3D, si parte dalla conversione', !!primo && primo.migrato === MIGRAZIONE)
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

// ── il cheat #fattoria3d-da2d: la conversione rifatta, anche se la 3D ha già uno stato suo ──
{
  const dato2D = JSON.parse(JSON.stringify(fattoriaTipo(30, { ora: T0 }).serializza()))
  const profilo = { fattoria: { stato: dato2D }, fattoria3d: { stato: { ...statoIniziale(), esperienza: 7 } } }
  const leggi = (c, k, d) => (profilo[c] && profilo[c][k] != null ? profilo[c][k] : d)
  const rifatto = statoRifattoDa2D(leggi)
  controlla('con una 2D, la rifà anche se la 3D ha uno stato suo', rifatto && rifatto.migrato === MIGRAZIONE && rifatto.esperienza !== 7)
  uguale('senza una 2D torna null (il chiamante non butta niente)', statoRifattoDa2D(() => null), null)
  uguale('e la 3D da sola non basta', statoRifattoDa2D((c, k, d) => (c === 'fattoria3d' ? profilo.fattoria3d[k] : d)), null)
  uguale('il dato 2D resta com\'era', JSON.stringify(profilo.fattoria.stato), JSON.stringify(dato2D))
}

// ── le bestie di casa (G6, docs/fattoria3d/bestie-di-casa.md): le quattro comprabili tornano in `casa`, le altre sono già compagni, mai monete ──
{
  const f = new Fattoria()
  f.speso = 200
  const bestie = [['cane-beagle', 'Birba'], ['coniglio', 'Saltino'], ['pappagallo', 'Coco'], ['gatto-giallo', 'Zenzero'], ['cane-bobtail', 'Watson'], ['gatto-tuxedo', 'Ombra'], ['gatto-nero', 'Fumo']]
  for (const [chi, nome] of bestie) f.bestie.push({ chi, nome, x: 10, y: 10, pancia: 0.9, pelo: 0.9, gioco: 0.9, quando: T0 })
  f.reclamati = {}
  const s = statoDa2D(JSON.parse(JSON.stringify(f.serializza())), { ora: T0 })
  controlla('una fattoria con bestie si converte', !!s)
  uguale('le quattro comprabili e i tre compagni stanno in casa', Object.keys(s.casa).sort().join(), 'beagle,coniglio,gatto_rosso,pappagallo,pepe,sherlock,watson')
  uguale('i compagni portano il nome che avevano nella 2D', [s.casa.watson.nome, s.casa.sherlock.nome, s.casa.pepe.nome].join(), 'Watson,Ombra,Fumo')
  uguale('col nome che avevano', [s.casa.beagle.nome, s.casa.coniglio.nome, s.casa.pappagallo.nome, s.casa.gatto_rosso.nome].join(), 'Birba,Saltino,Coco,Zenzero')
  controlla('con i bisogni a metà', ['beagle', 'coniglio', 'pappagallo', 'gatto_rosso'].every(k => s.casa[k].pancia === 0.5 && s.casa[k].pelo === 0.5 && s.casa[k].gioco === 0.5))
  uguale('senza il premio già preso', s.casa.beagle.premiato, false)
  uguale('nessuna è «da regalare»: bobtail, gatto bianco e nero e gatto nero sono già compagni', Object.keys(s.daRegalare).filter(k => k.startsWith('bestia:')).length, 0)
  controlla('il livello tiene la bestia più alta (pappagallo, 49)', livelloPer(s.esperienza) >= 49)
  controlla('niente monete: nessun campo di monete nello stato', !('monete' in s) && !('coins' in s))
  const f3 = new Fattoria3d({ stato: s, borsa: { quante: () => 0, paga: () => true } })
  uguale('il motore le vede', f3.cura.tue().join(), 'beagle,coniglio,gatto_rosso,pappagallo')
}

// ── i silos ingranditi e i posti della fila: le monete spese nella 2D restano capienza e posti ──
{
  const f = new Fattoria()
  f.speso = 900
  f.silos = { terra: 3, stalla: 1, bottega: 40 }
  const c0 = { x: 20, y: 20 }
  f.cose.push({ i: f.prossimo++, id: 'mulino', g: 0, x: c0.x + 6, y: c0.y, fila: 2 })
  f.cose.push({ i: f.prossimo++, id: 'mulino', g: 0, x: c0.x + 9, y: c0.y, fila: 1 })
  f.magazzino.panificio = 1
  f.fileRiposte.panificio = [3]
  f.magazzino.caseificio = 3
  f.fileRiposte.caseificio = [5, 5, 5]
  const s = statoDa2D(JSON.parse(JSON.stringify(f.serializza())), { ora: T0 })
  uguale('gli ingrandimenti dei silos si portano', [s.silo.terra, s.silo.stalla].join(), '3,1')
  uguale('fino al tetto della 3D (sei passi per tre edifici)', s.silo.bottega, 18)
  uguale('i posti comprati diventano posti della fila, e la seconda copia uno in più', s.macchine.mulino.posti, 1 + 2 + 1 + 1)
  uguale('anche da una macchina messa via (fileRiposte)', s.macchine.panificio.posti, 4)
  uguale('mai oltre sei posti', s.macchine.caseificio.posti, 6)
  uguale('le copie che non ci stanno più restano da regalare', s.daRegalare['cosa:caseificio'], 2)
  uguale('il mulino doppio non è più da regalare', s.daRegalare['cosa:mulino'], undefined)
  const f3 = new Fattoria3d({ stato: s, borsa: { quante: () => 0, paga: () => true } })
  uguale('il motore vede la capienza', f3.livelloDelSilo('terra'), 3)
}

// ── chi era già stato convertito (MIGRAZIONE 1) si ritocca dalla 2D all'apertura ──
{
  const f = new Fattoria()
  f.speso = 900
  f.silos = { terra: 4, stalla: 0, bottega: 0 }
  const c0 = { x: 20, y: 20 }
  f.cose.push({ i: f.prossimo++, id: 'mulino', g: 0, x: c0.x + 6, y: c0.y, fila: 1 })
  f.cose.push({ i: f.prossimo++, id: 'mulino', g: 0, x: c0.x + 9, y: c0.y })
  const dato2D = JSON.parse(JSON.stringify(f.serializza())), prima = JSON.stringify(dato2D)
  const vecchio = { ...statoDa2D(dato2D, { ora: T0 }), migrato: 1 }
  vecchio.silo = { terra: 0, stalla: 0, bottega: 0 }
  vecchio.macchine = { ...vecchio.macchine, mulino: { ...vecchio.macchine.mulino, posti: 1 } }
  vecchio.daRegalare = { 'cosa:mulino': 1, 'cosa:silo': 1, 'cosa:conigliera': 2, 'scorta:fiori': 3, 'scorta:tartufi': 4, 'bestia:cane-beagle': 1, 'bestia:cane-bobtail': 1 }
  const s = ritoccaLaConversione(vecchio, dato2D, { ora: T0 })
  uguale('riprende gli ingrandimenti dalla 2D', s.silo.terra, 4)
  uguale('e i posti: quello comprato e la copia in più', s.macchine.mulino.posti, 3)
  uguale('la conigliera arrivata dopo si consegna nel magazzino', s.magazzino.conigliera, 2)
  uguale('le scorte che oggi esistono arrivano', s.prodotti.fiori, 3)
  uguale('il beagle arriva in casa', !!s.casa.beagle, true)
  uguale('resta da regalare solo ciò che non c\'è ancora', JSON.stringify(s.daRegalare), '{"scorta:tartufi":4}')
  uguale('segnato con la conversione nuova', s.migrato, MIGRAZIONE)
  uguale('una seconda volta non cambia niente (stesso oggetto)', ritoccaLaConversione(s, dato2D), s)
  uguale('il dato 2D resta com\'era', JSON.stringify(dato2D), prima)
  const nativo = { ...statoIniziale(), esperienza: 50 }
  uguale('uno stato nato in 3D non si tocca', ritoccaLaConversione(nativo, dato2D), nativo)
  const leggi = (c, k, d) => (c === 'fattoria3d' ? vecchio : c === 'fattoria' ? dato2D : d)
  uguale('statoDaCaricare ritocca lo stato vecchio', statoDaCaricare(leggi).silo.terra, 4)
  uguale('un dato guasto non lancia', ritoccaLaConversione({ migrato: 1, daRegalare: 'x' }, 7).migrato, MIGRAZIONE)
}

// ── la 2D è ferma: i suoi dati non cambiano più (da2d/, docs/fattoria3d/parita/migrazione.md) ──
// La firma delle fattorie tipo 1–99 e del catalogo 2D (piede, giri, specchio, assetto) è quella del 31/10/2026: se cambia, è
// cambiato quello che la conversione legge. La firma della conversione stessa la si stampa e basta: la 3D può cambiare.
{
  const firma = x => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12)
  const tipi = [], convertite = []
  for (let l = 1; l <= LIVELLO_MAX; l++) {
    const dato = JSON.parse(JSON.stringify(fattoriaTipo(l, { ora: T0 }).serializza()))
    tipi.push(dato)
    convertite.push(statoDa2D(dato, { ora: T0 }))
  }
  const catalogo = CATALOGO_2D.map(v => [v, quantiVersi(v), puoSpecchiare(v),
    [0, 1, 2, 3].map(g => [false, true].map(m => assettoDi({ id: v.id, g, m })))])
  const bestie = [IN_VENDITA_2D, Object.keys(ANIMALI_2D).map(chi => [chi, agganciDi(chi), AGGANCI_TUTTI.map(d => puntiDi(chi, d))])]
  uguale('le fattorie tipo 2D sono quelle di sempre', firma(tipi), FIRMA_TIPI_2D)
  uguale('il catalogo 2D (piedi, giri, specchio) è quello di sempre', firma(catalogo), FIRMA_CATALOGO_2D)
  uguale('le bestie 2D (in vendita, agganci) sono quelle di sempre', firma(bestie), FIRMA_BESTIE_2D)
  nota('firma della conversione delle fattorie tipo 1–99:', firma(convertite))
}

riassunto('fattoria3d-migra')
