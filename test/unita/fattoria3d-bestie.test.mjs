/* Le bestie di casa della fattoria 3D (G6, docs/fattoria3d/bestie-di-casa.md), senza browser: i numeri sono quelli della 2D (parità), i bisogni
   non scendono sotto FONDO, il cibo sbagliato è rifiutato col perché (prima del pagamento), il premio è una volta per ciclo ed è esperienza,
   il nome e la posizione si salvano, la migrazione dalla 2D, il vecchio stato letto dritto, la veterinaria al banco (C32).
   `node test/esegui.mjs fattoria3d-bestie`
   tempo: 1 */
import { BESTIE, IDS_BESTIE, guastiDelleBestie, CIBI, COCCOLE_3D, cibiPer, gestiPer, nomiPer, pulisciNome, casaInForma, bestiaInForma, COMPAGNO_DI, idDa2D, perche,
  bestieAl, FONDO, BENISSIMO, BENE, scortaDi3D } from '../../src/giochi/fattoria3d/dati/bestie.js'
import { ANIMALI_2D, premioBenessere } from '../../src/giochi/fattoria3d/dati/parita2d.js'
import { CIBI as CIBI_2D, COCCOLE as COCCOLE_2D, BISOGNI } from '../../src/giochi/fattoria/dati/bisogni.js'
import { COMPAGNI } from '../../src/giochi/fattoria3d/dati/compagni.js'
import { sogliaDi, guastiDeiLivelli, roba } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { statoIniziale, normalizza } from '../../src/giochi/fattoria3d/motore/stato.js'
import { controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'

const ORA = 1_000_000_000_000, ORE = 3600_000
const motoreCon = ({ liv = 70, monete = 100000, t = { ora: ORA }, stato = null } = {}) => {
  const b = { monete }
  const f = new Fattoria3d({ stato, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora, rnd: () => 0.5 })
  f.s.esperienza = Math.max(f.s.esperienza, sogliaDi(liv))
  return { f, b, t }
}

/* ══════════ 1. i dati: la parità con la 2D ══════════ */
{
  const g = guastiDelleBestie()
  controlla('i dati delle bestie non hanno guasti', g.length === 0, g.join(' · '))
  controlla('i livelli reggono con le bestie', guastiDeiLivelli().length === 0, guastiDeiLivelli().join(' · '))
  uguale('quattro bestie da comprare', IDS_BESTIE.join(), 'beagle,coniglio,gatto_rosso,pappagallo')
  const attesi = { beagle: [90, 15], gatto_rosso: [75, 35], coniglio: [85, 12], pappagallo: [120, 49] }
  for (const [id, [prezzo, liv]] of Object.entries(attesi)) {
    uguale(`${id}: prezzo della 2D`, BESTIE[id].prezzo, prezzo)
    uguale(`${id}: livello della 2D`, BESTIE[id].liv, liv)
    uguale(`${id}: prezzo uguale alla voce 2D`, BESTIE[id].prezzo, ANIMALI_2D[BESTIE[id].chi].prezzo)
    uguale(`${id}: premio = quello della 2D (un quindicesimo)`, BESTIE[id].premio, premioBenessere(BESTIE[id].chi))
  }
  uguale('premio del cane 6', BESTIE.beagle.premio, 6)
  uguale('premio del gatto 5', BESTIE.gatto_rosso.premio, 5)
  uguale('premio del pappagallo 8', BESTIE.pappagallo.premio, 8)
  uguale('premio del coniglio 6', BESTIE.coniglio.premio, 6)
  // i bisogni sono i dati della 2D, non una copia
  uguale('tre bisogni: pancia, pelo, gioco', Object.keys(BISOGNI).join(), 'pancia,pelo,gioco')
  uguale('la pancia cala in 14 ore, il pelo in 30, il gioco in 20', Object.values(BISOGNI).map(b => b.ore).join(), '14,30,20')
  uguale('FONDO 0,15', FONDO, 0.15)
  uguale('soglie 0,55 e 0,78', [BENE, BENISSIMO].join(), '0.55,0.78')
  // la ciotola: 8 cibi comprati + 6 del granaio, come la 2D
  uguale('otto cibi comprati', CIBI.filter(c => !c.da).length, 8)
  uguale('sei cibi del granaio', CIBI.filter(c => c.da).length, 6)
  uguale('gli stessi id della 2D', CIBI.map(c => c.id).join(), CIBI_2D.map(c => c.id).join())
  for (const c of CIBI_2D) {
    const t = CIBI.find(x => x.id === c.id)
    controlla(`${c.id}: prezzo, quanto e per chi come in 2D`, t.prezzo === c.prezzo && t.quanto === c.quanto && t.per.join() === c.per.join())
  }
  uguale('i prezzi dei comprati: osso 5, bistecca 14, pesce 5, paté 14, semini 5, frutta 14, carota 5, insalata 14', CIBI.filter(c => !c.da).map(c => c.prezzo).join(), '5,14,5,14,5,14,5,14')
  uguale('il fieno è l\'erba medica della 3D', scortaDi3D('fieno'), 'erba')
  controlla('ogni cibo del granaio si scala da una scorta vera', CIBI.filter(c => c.da).every(c => ['mangime', 'uova', 'pastone', 'erba', 'formaggio', 'minestrone'].includes(c.da)))
  // le coccole
  uguale('cinque coccole come in 2D', COCCOLE_3D.map(c => c.id).join(), COCCOLE_2D.map(c => c.id).join())
  const sempre = COCCOLE_3D.filter(c => !c.da)
  uguale('spazzola e gioca sono sempre disponibili', sempre.map(c => c.id).join(), 'spazzola,gioca')
  uguale('spazzola e gioca costano 🪙1', sempre.map(c => c.prezzo).join(), '1,1')
  uguale('copertina dalla lana, festa dalla torta, bagnetto dal sapone', COCCOLE_3D.filter(c => c.da).map(c => `${c.id}:${c.da}`).join(), 'copertina:lana,festa:torta,bagnetto:sapone')
  // chi mangia cosa
  const id = f => cibiPer(f).map(c => c.id)
  controlla('il coniglio non mangia carne né uova né formaggio', !id('coniglio').some(k => ['osso', 'bistecca', 'uova', 'formaggio', 'pastone'].includes(k)))
  controlla('il gatto non mangia formaggio né minestrone', !id('gatto').some(k => ['formaggio', 'minestrone'].includes(k)))
  controlla('formaggio e minestrone solo al cane', IDS_BESTIE.filter(i => id(BESTIE[i].famiglia).includes('formaggio')).every(i => BESTIE[i].famiglia === 'cane'))
  controlla('ogni bestia ha almeno due cibi da comprare', IDS_BESTIE.every(i => cibiPer(BESTIE[i].famiglia).filter(c => !c.da).length >= 2))
  uguale('i gesti della pancia sono i cibi della famiglia', gestiPer('pancia', 'gatto').map(c => c.id).join(), id('gatto').join())
  // i nomi
  controlla('i nomi da toccare ci sono per ogni bestia', IDS_BESTIE.every(i => nomiPer(i).length >= 4))
  controlla('i nomi sono quelli della 2D', nomiPer('beagle').includes('Birba') && nomiPer('coniglio').includes('Batuffolo') && nomiPer('pappagallo').includes('Coco'))
  uguale('un nome si pulisce e si taglia a 16', pulisciNome('  Batuffolo   il   grande e bello  '), 'Batuffolo il gra')
  uguale('un nome vuoto resta vuoto', pulisciNome(null), '')
  // compagni gratis
  uguale('Watson, Sherlock, Irene e Pepe sono ancora compagni gratis', Object.keys(COMPAGNI).join(), 'watson,sherlock,irene,pepe')
  controlla('nessuna bestia da comprare è anche un compagno', IDS_BESTIE.every(i => !COMPAGNI[i]))
  uguale('il bobtail 2D è Watson', COMPAGNO_DI['cane-bobtail'], 'watson')
  uguale('il gatto bianco e nero 2D è Sherlock', COMPAGNO_DI['gatto-tuxedo'], 'sherlock')
  uguale('il gatto nero 2D è Pepe', COMPAGNO_DI['gatto-nero'], 'pepe')
  uguale('la 2D «gatto-giallo» è il gatto rosso', idDa2D('gatto-giallo'), 'gatto_rosso')
  uguale('al 12 si apre il coniglio', bestieAl(12, true).map(b => b.id).join(), 'coniglio')
}

/* ══════════ 2. lo stato: rimesso in forma, mai un'eccezione ══════════ */
{
  uguale('uno stato di prima non ha bestie di casa', Object.keys(normalizza(statoIniziale()).casa).length, 0)
  uguale('uno stato senza il campo si legge dritto', Object.keys(normalizza({ v: 10, esperienza: 5 }).casa).length, 0)
  let ok = true
  for (const brutto of [null, 5, 'x', [], { beagle: 3 }, { beagle: { pancia: 'x', pelo: NaN, gioco: -4, quando: 'ieri', nome: 7, i: 'a' } }, { drago: { pancia: 1 } }, { casa: 1 }]) {
    try { normalizza({ ...statoIniziale(), casa: brutto }) } catch (e) { ok = false }
  }
  controlla('uno stato guasto non lancia mai', ok)
  const r = bestiaInForma({ pancia: -3, pelo: 2, gioco: 'x', quando: 'ieri', nome: '  Birba  ', i: 3, j: -2 }, ORA)
  uguale('un bisogno sotto zero sale al fondo', r.pancia, FONDO)
  uguale('un bisogno sopra uno scende a uno', r.pelo, 1)
  controlla('un bisogno non numero torna al valore di una bestia nuova', r.gioco > FONDO && r.gioco <= 1)
  uguale('il nome si pulisce', r.nome, 'Birba')
  uguale('la posizione si legge', `${r.i},${r.j}`, '3,-2')
  controlla('senza posizione valida non c\'è posizione', bestiaInForma({ i: 1.5, j: 2 }, ORA).i === undefined)
  uguale('una bestia che non esiste si butta', Object.keys(casaInForma({ drago: { pancia: 1 }, beagle: {} })).join(), 'beagle')
  // andata e ritorno
  const { f } = motoreCon()
  const cella = (() => { for (let i = -8; i < 8; i++) for (let j = -8; j < 8; j++) if (f.cellaPropria(i, j) && f.libera(i, j)) return [i, j]; return null })()
  f.cura.compra('beagle'); f.cura.battezza('beagle', 'Birba'); f.cura.sposta('beagle', ...cella)
  const letto = new Fattoria3d({ stato: JSON.parse(JSON.stringify(f.serializza())), borsa: { quante: () => 0, paga: () => true } })
  uguale('il nome si salva', letto.cura.nomeDi('beagle'), 'Birba')
  uguale('la posizione si salva', String(letto.cura.casaDi('beagle')), String(cella))
  uguale('la versione dello stato non è cambiata', f.serializza().v, 10)
}

/* ══════════ 3. il motore ══════════ */
{
  // comprare
  let { f, b } = motoreCon({ liv: 14, monete: 1000 })
  let r = f.cura.compra('beagle')
  uguale('sotto il livello 15 il beagle è chiuso', r.motivo, 'non-sbloccato'); uguale('...e dice il livello', r.liv, 15)
  uguale('niente monete spese', b.monete, 1000)
  ;({ f, b } = motoreCon({ liv: 15, monete: 89 }))
  r = f.cura.compra('beagle')
  uguale('con 89 monete il beagle (90) non si prende', r.motivo, 'poche-monete'); uguale('...e dice il costo', r.costo, 90)
  ;({ f, b } = motoreCon({ liv: 15, monete: 500 }))
  const xp0 = f.esperienza()
  r = f.cura.compra('beagle')
  controlla('con 90 monete si prende', r.ok && r.costo === 90)
  uguale('costa 90 monete', b.monete, 410)
  uguale('la spesa conta come esperienza, come ogni acquisto', f.esperienza() - xp0, 90)
  uguale('due volte no', f.cura.compra('beagle').motivo, 'gia-tua')
  uguale('una bestia che non esiste', f.cura.compra('drago').motivo, 'sconosciuta')
  const st = f.cura.stato('beagle')
  controlla('nasce con i bisogni a metà-alto, non a posto', st.pancia < BENISSIMO || st.pelo < BENISSIMO || st.gioco < BENISSIMO)
  uguale('il premio non è ancora preso', st.premiato, false)
  uguale('non ha nome (il battesimo lo dà)', f.cura.nomeScelto('beagle'), '')
  uguale('prima del nome si chiama come la razza', f.cura.nomeDi('beagle'), 'Beagle')
}
{
  // i bisogni non scendono sotto FONDO e non si muore
  const { f, t } = motoreCon({ liv: 70 })
  for (const id of IDS_BESTIE) f.cura.compra(id)
  t.ora += 400 * ORE                                                // più di due settimane senza una carezza
  for (const id of IDS_BESTIE) {
    const s = f.cura.stato(id)
    controlla(`${id}: dopo 400 ore i bisogni sono al fondo, non sotto`, s.pancia === FONDO && s.pelo === FONDO && s.gioco === FONDO, JSON.stringify(s))
    controlla(`${id}: c'è ancora (non muore)`, f.cura.ho(id))
  }
  // il calo è col tempo, non con quante volte si guarda
  const { f: g, t: u } = motoreCon({ liv: 70 })
  g.cura.compra('coniglio')
  const p0 = g.cura.stato('coniglio').pancia
  u.ora += 7 * ORE
  for (let k = 0; k < 50; k++) g.cura.stato('coniglio')            // guardarla spesso non la fa calare di più
  dentro('mezza pancia in 7 ore (cala in 14)', p0 - g.cura.stato('coniglio').pancia, 0.45, 0.55)
}
{
  // il cibo sbagliato è rifiutato con il perché, prima di pagare
  const { f, b } = motoreCon({ liv: 70, monete: 500 })
  f.cura.compra('gatto_rosso'); f.cura.compra('coniglio')
  const dopo = b.monete
  f.s.prodotti.formaggio = 3; f.s.prodotti.uova = 3
  const brutti = [['gatto_rosso', 'formaggio'], ['gatto_rosso', 'minestrone'], ['coniglio', 'osso'], ['coniglio', 'uova'], ['coniglio', 'formaggio'], ['gatto_rosso', 'carota']]
  for (const [id, cibo] of brutti) {
    const r = f.cura.nutri(id, cibo)
    controlla(`${id} rifiuta ${cibo}`, !r.ok && r.motivo === 'non-gli-piace')
    controlla(`${id} rifiuta ${cibo} dicendo il perché`, typeof r.perche === 'string' && r.perche.length > 20 && r.perche.includes('!'), r.perche)
  }
  uguale('rifiutare non costa monete', b.monete, dopo)
  uguale('rifiutare non toglie roba dal granaio', f.s.prodotti.formaggio, 3)
  controlla('il perché del coniglio parla di verdura', perche('coniglio', 'osso').includes('verdura'))
  controlla('il perché del gatto parla di pesce', perche('gatto_rosso', 'formaggio').includes('pesce'))
}
{
  // nutrire: monete e granaio
  const { f, b, t } = motoreCon({ liv: 70, monete: 500 })
  f.cura.compra('beagle')
  f.cura.casa.beagle.pancia = 0.3
  let r = f.cura.nutri('beagle', 'osso')
  controlla('l\'osso (5) riempie 0,30', r.ok && r.costo === 5)
  dentro('la pancia sale di 0,30', f.cura.stato('beagle').pancia, 0.59, 0.61)
  uguale('l\'osso costa 5', b.monete, 500 - 90 - 5)
  f.cura.casa.beagle.pancia = 0.2
  r = f.cura.nutri('beagle', 'formaggio')
  uguale('senza formaggio nel granaio', r.motivo, 'manca-roba'); uguale('...dice quale', r.prodotto, 'formaggio')
  f.s.prodotti.formaggio = 2
  r = f.cura.nutri('beagle', 'formaggio')
  controlla('col formaggio nel granaio si nutre senza monete', r.ok && r.costo === 0 && r.prodotto === 'formaggio')
  uguale('il formaggio scende di uno', f.s.prodotti.formaggio, 1)
  f.cura.casa.beagle.pancia = 0.95
  uguale('a pancia piena non ha fame', f.cura.nutri('beagle', 'bistecca').motivo, 'non-ha-fame')
  f.cura.casa.beagle.pancia = 0.1
  b.monete = 3
  uguale('con 3 monete la bistecca (14) non si dà', f.cura.nutri('beagle', 'bistecca').motivo, 'poche-monete')
  uguale('e non si perde nulla', b.monete, 3)
  uguale('il mangime del mulino è un cibo del granaio', f.cura.nutri('beagle', 'mangime').motivo, 'manca-roba')
  f.s.merci.erba = 2
  f.cura.casa.beagle.pancia = 0.1
  uguale('il cane non mangia l\'erba', f.cura.nutri('beagle', 'erba').motivo, 'non-gli-piace')
  const c = motoreCon({ liv: 70, monete: 500 })
  c.f.cura.compra('coniglio'); c.f.s.merci.erba = 2; c.f.cura.casa.coniglio.pancia = 0.2
  r = c.f.cura.nutri('coniglio', 'fieno')
  controlla('il coniglio mangia l\'erba medica del campo', r.ok && r.prodotto === 'erba' && c.f.s.merci.erba === 1, JSON.stringify(r))
  void t
}
{
  // le coccole: una gratis c'è sempre, anche a zero monete
  const { f, b } = motoreCon({ liv: 70, monete: 200 })
  f.cura.compra('pappagallo')
  b.monete = 0
  f.cura.casa.pappagallo.pelo = 0.2
  let r = f.cura.coccola('pappagallo', 'spazzola')
  controlla('spazzolare costa 🪙1: con zero monete si resta senza', !r.ok && r.motivo === 'poche-monete' && r.costo === 1)
  // «gratis» nel senso del bambino: le due coccole sempre disponibili costano una monetina, la copertina/festa/bagnetto roba del granaio.
  controlla('le coccole sempre disponibili costano al più 🪙1', COCCOLE_3D.filter(c => !c.da).every(c => c.prezzo <= 1))
  b.monete = 50
  r = f.cura.coccola('pappagallo', 'spazzola')
  controlla('con una moneta spazzola', r.ok && r.costo === 1)
  dentro('il pelo sale di 0,5', f.cura.stato('pappagallo').pelo, 0.69, 0.71)
  f.cura.casa.pappagallo.gioco = 0.3
  r = f.cura.coccola('pappagallo', 'gioca')
  controlla('gioca', r.ok && r.costo === 1)
  uguale('la copertina vuole lana', f.cura.coccola('pappagallo', 'copertina').motivo, 'manca-roba')
  uguale('una carezza è gratis sempre, anche a zero monete', (b.monete = 0, f.cura.carezza('pappagallo').ok && b.monete === 0), true)
  uguale('...e a una bestia non tua no', f.cura.carezza('beagle').motivo, 'non-e-tua')
  f.cura.casa.pappagallo.pelo = 0.1
  uguale('la copertina senza lana', f.cura.coccola('pappagallo', 'copertina').motivo, 'manca-roba')
  f.s.lana = 2
  r = f.cura.coccola('pappagallo', 'copertina')
  controlla('la copertina con la lana', r.ok && r.prodotto === 'lana' && f.s.lana === 1)
  dentro('la copertina riempie 0,95', f.cura.stato('pappagallo').pelo, 0.99, 1)
  uguale('un bisogno pieno non ha bisogno di coccole', f.cura.coccola('pappagallo', 'copertina').motivo, 'non-serve')
  uguale('una coccola che non esiste', f.cura.coccola('pappagallo', 'drago').motivo, 'sconosciuta')
  uguale('una bestia non tua', f.cura.coccola('beagle', 'spazzola').motivo, 'non-e-tua')
}
{
  // il premio: esperienza, mai monete, una volta per ciclo
  const { f, b, t } = motoreCon({ liv: 70, monete: 1000 })
  f.cura.compra('beagle')
  const c = f.cura.casa.beagle
  Object.assign(c, { pancia: 0.5, pelo: 0.95, gioco: 0.95, premiato: false, quando: t.ora })
  const xp = f.esperienza(), m0 = b.monete
  let r = f.cura.nutri('beagle', 'bistecca')                 // 0,5 + 0,7 -> pieno: tutto a posto
  controlla('rimessa a posto paga il premio', r.premio && r.premio.xp === 6, JSON.stringify(r.premio))
  uguale('il premio è esperienza (6 + 14 della bistecca)', f.esperienza() - xp, 6 + 14)
  uguale('mai monete in più', b.monete, m0 - 14)
  uguale('segnato come preso', f.cura.casa.beagle.premiato, true)
  // di nuovo a posto subito dopo: niente premio
  Object.assign(c, { pancia: 0.7, quando: t.ora })
  r = f.cura.coccola('beagle', 'gioca')                       // il gioco è a 0,95: non serve
  uguale('non serve se è a posto', r.motivo, 'non-serve')
  r = f.cura.nutri('beagle', 'bistecca')
  controlla('ancora a posto: nessun secondo premio', r.ok && !r.premio)
  // scende sotto «sta bene», si riarma
  t.ora += 20 * ORE
  f.cura.stato('beagle')
  uguale('dopo qualche ora di calo si riarma', f.cura.casa.beagle.premiato, false)
  Object.assign(f.cura.casa.beagle, { pancia: 0.3, pelo: 0.95, gioco: 0.95, quando: t.ora })
  r = f.cura.nutri('beagle', 'bistecca')
  controlla('un secondo ciclo, un secondo premio', r.ok && r.premio && r.premio.xp === 6)
  // un salvataggio già in forma non regala il primo premio
  const d = motoreCon({ liv: 70 }); d.f.cura.compra('coniglio')
  Object.assign(d.f.cura.casa.coniglio, { pancia: 0.99, pelo: 0.99, gioco: 0.99, premiato: false, quando: d.t.ora })
  controlla('già a posto prima del gesto: nessun premio', !d.f.cura.coccola('coniglio', 'gioca').premio)
  // i quattro premi
  uguale('i premi 6, 6, 5, 8', IDS_BESTIE.map(i => BESTIE[i].premio).join(), '6,6,5,8')
}
{
  // battesimo e posizione
  const { f } = motoreCon({ liv: 70 })
  f.cura.compra('coniglio')
  uguale('un nome', f.cura.battezza('coniglio', 'Batuffolo').nome, 'Batuffolo')
  uguale('si cambia gratis', f.cura.battezza('coniglio', 'Carota').nome, 'Carota')
  uguale('vuoto = torna la razza', f.cura.battezza('coniglio', '   ').nome, 'Coniglio')
  uguale('non tua', f.cura.battezza('beagle', 'x').motivo, 'non-e-tua')
  uguale('la compagnia nella scena porta il nome scelto', f.cura.compagniPresi()[0].nome, 'Coniglio')
  f.cura.battezza('coniglio', 'Saltino')
  uguale('...e il nome nuovo', f.cura.compagniPresi()[0].nome, 'Saltino')
  uguale('spostare un\'altra: no', f.cura.sposta('beagle', 0, 0).motivo, 'non-e-tua')
  const libera = (() => { for (let i = -8; i < 8; i++) for (let j = -8; j < 8; j++) if (f.cellaPropria(i, j) && f.libera(i, j)) return [i, j]; return null })()
  controlla('c\'è una cella libera nel terreno di partenza', !!libera)
  const m0 = f.monete()
  const r = f.cura.sposta('coniglio', ...libera)
  controlla('spostare è gratis', r.ok && r.costo === 0 && f.monete() === m0)
  uguale('dove l\'hai messa', String(f.cura.casaDi('coniglio')), String(libera))
  uguale('lontano dal tuo terreno no', f.cura.sposta('coniglio', 500, 500).motivo, 'non-ci-sta')
  uguale('...e resta dov\'era', String(f.cura.casaDi('coniglio')), String(libera))
}

riassunto('Fattoria 3D — le bestie di casa (dati, stato, motore)')
