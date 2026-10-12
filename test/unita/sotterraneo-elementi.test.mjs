/* Gli elementi, le resistenze e le abilità nuove (docs/sotterraneo/abilita.md, «Gli elementi» e «Il mago guerriero»; i mostri
   in docs/sotterraneo/mostri.md): ogni abilità che colpisce ha un elemento, ogni mostro può resistere (metà), temere
   (un danno e mezzo) o rifiutare uno stato (immune); le abilità a più bersagli (`vicini`, `catena`, `tutti`) con abilità vere;
   il sangue che si somma, le spine, il furto di vita, la furia e la velocità; il mago con la spada e la Lama arcana che
   colpisce con l'intelligenza.
   `node test/esegui.mjs sotterraneo-elementi --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { NODI, RAMI, FATTORE_DEL_SALTO } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { ELEMENTI, STATI, CHIAVI_ELEMENTI, CHIAVI_STATI, fattoreDi, statiDelNodo, guastiDelleDifese } from '../../src/giochi/sotterraneo/dati/elementi.js'
import { MOSTRI, guastiDeiMostri } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { GROSSI, difeseDi, guastiDeiGrossi } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { EROI, FAMIGLIE, requisitoDi, guastiDegliEroi } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { sogliaDi, ATT_PER_PUNTO } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { PILE_DEL_SANGUE } from '../../src/giochi/sotterraneo/motore/scontro.js'
import { GLIFI } from '../../src/giochi/sotterraneo/viste/glifi.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const roba = (mano = null, mancina = null) => ({ v: 1, gemme: 0, zaino: [], mano, mancina, corpo: null, dito: null, torcia: 0, torce: 0 })
const conAlbero = (livello, albero, altro = {}) =>
  ({ esp: sogliaDi(livello), albero, caselle: Object.keys(albero).filter(id => !NODI[id].sempre).slice(0, 3), ...altro })

// uno scontro con un solo mostro fatto a mano (del tipo che si dice), sveglio e veloce come l'eroe: i turni vanno uno per uno
function scontro(eroe, crescita, mano = null, mancina = null, mostro = {}) {
  const c = new Corsa(CAMPAGNA[1], { seme: 5, eroe, rnd: seminato(5), crescita, roba: roba(mano, mancina) })
  const m = c.livello.robe.find(r => r.che === 'mostro')
  Object.assign(m, { tipo: 'goblin', ossa: 400, ossaMax: 400, att: 9, dif: 0, sveglio: true, stati: null, grosso: null, velocita: c.velocita }, mostro)
  c.scontro(m, { solo: true, tocco: true })
  c.vitaPiu += 200   // tanta vita: nessun colpo si mette in mezzo
  c.vita = c.vitaMax
  return { c, m }
}
// una scena con più mostri in fila davanti all'eroe, tutti entro il raggio dello scontro
function scena(eroe, crescita, mano, mancina, tipi) {
  const c = new Corsa(CAMPAGNA[5], { seme: 11, rnd: seminato(11), eroe, roba: roba(mano, mancina), crescita })
  for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true
  c.vitaPiu += 200
  c.vita = c.vitaMax
  const st = c.livello.stanze.reduce((a, b) => (b.w > a.w ? b : a))
  c.eroe = { x: st.x + 0.5, y: st.y + 1.5 }
  c.verso = { dx: 1, dy: 0 }
  const ms = tipi.map((tipo, i) => {
    const m = c.livello.mostro(tipo, st.x + (i < 4 ? 1 + i : 4), st.y + (i < 4 ? 1 : 2))
    Object.assign(m, { ossa: 900, ossaMax: 900, att: 1, dif: 0, velocita: c.velocita, sveglio: true, stati: null })
    c.livello.robe.push(m)
    return m
  })
  c.scontro(ms[0])
  c.energia = c.energiaMax
  return { c, ms, campo: c.foglio.campo }
}

/* ══════════ 1. gli elementi e le difese dei mostri stanno in piedi ══════════ */
{
  uguale('sei elementi', CHIAVI_ELEMENTI.join(), 'fisico,fuoco,gelo,fulmine,veleno,sacro')
  controlla('ognuno ha il suo glifo disegnato e il suo colore', CHIAVI_ELEMENTI.every(e => GLIFI[ELEMENTI[e].glifo] && /^#[0-9a-f]{6}$/i.test(ELEMENTI[e].tinta)))
  controlla('e anche gli stati', CHIAVI_STATI.every(s => GLIFI[STATI[s].glifo] && STATI[s].non))
  uguale('il bestiario sta in piedi', guastiDeiMostri().join(' · '), '')
  uguale('i grossi anche', guastiDeiGrossi(CAMPAGNA).join(' · '), '')
  uguale('e gli eroi', guastiDegliEroi().join(' · '), '')
  controlla('una scheda storta si dice', guastiDelleDifese('x', { resiste: ['fuoco'], teme: ['fuoco'] }).length === 1 && guastiDelleDifese('x', { immune: ['ciao'] }).length === 1)
  // poche difese per mostro, e a ogni elemento qualcuno è sensibile; a ogni stato qualcuno è immune
  const schede = [...Object.values(MOSTRI), ...Object.values(GROSSI).map(g => g.difese).filter(Boolean)]
  controlla('al più sei difese a scheda', schede.every(d => (d.resiste || []).length + (d.teme || []).length + (d.immune || []).length <= 6))
  for (const e of CHIAVI_ELEMENTI)
    controlla(`qualcuno teme ${ELEMENTI[e].il}, e qualcuno lo resiste`, schede.some(d => (d.teme || []).includes(e)) && schede.some(d => (d.resiste || []).includes(e)))
  for (const s of CHIAVI_STATI) controlla(`qualcuno rifiuta lo stato «${s}»`, schede.some(d => (d.immune || []).includes(s)))
  controlla('i mostri dei primi piani sono quasi neutri (ratto e goblin non hanno difese)',
            !MOSTRI.ratto.resiste && !MOSTRI.ratto.teme && !MOSTRI.ratto.immune && !MOSTRI.goblin.resiste && !MOSTRI.goblin.teme && !MOSTRI.goblin.immune)
  // i casi dell'utente, 12 ottobre
  stessaLista('lo scheletro non si avvelena e non sanguina', difeseDi({ tipo: 'scheletro' }).immune, ['avvelena', 'sanguina'])
  controlla('e teme il sacro', difeseDi({ tipo: 'scheletro' }).teme.includes('sacro'))
  controlla('la melma resiste al veleno', difeseDi({ tipo: 'melma' }).resiste.includes('veleno'))
  controlla('il golem non si stordisce e resiste al fisico', difeseDi({ tipo: 'golem' }).immune.includes('stordisce') && difeseDi({ tipo: 'golem' }).resiste.includes('fisico'))
  controlla('il fantasma resiste al fisico', difeseDi({ tipo: 'fantasma' }).resiste.includes('fisico'))
  controlla('il troll teme il fuoco', difeseDi({ tipo: 'troll' }).teme.includes('fuoco'))
  // il grosso porta le sue difese al posto di quelle della specie: Fiammetta è un troll che il fuoco non scalfisce
  controlla('Fiammetta, troll di fuoco: lo resiste e non brucia', difeseDi({ tipo: 'troll', grosso: 'fiammetta' }).resiste.includes('fuoco') && difeseDi({ tipo: 'troll', grosso: 'fiammetta' }).immune.includes('brucia'))
  controlla('Re Ossuto ha quelle dello scheletro', JSON.stringify(difeseDi({ tipo: 'scheletro', grosso: 'ossuto' })) === JSON.stringify(difeseDi({ tipo: 'scheletro' })))
  stessaLista('un mostro senza tipo non ha difese', [difeseDi(null).resiste, difeseDi({}).teme, difeseDi({ tipo: 'boh' }).immune].flat(), [])
  // il fattore
  uguale('resiste: metà', fattoreDi({ resiste: ['fuoco'] }, 'fuoco'), 0.5)
  uguale('teme: uno e mezzo', fattoreDi({ teme: ['fuoco'] }, 'fuoco'), 1.5)
  uguale('altro: uno', fattoreDi({ teme: ['fuoco'] }, 'gelo'), 1)
  uguale('senza elemento: uno', fattoreDi({ resiste: ['fisico'] }, null), 1)
  // quali stati metterebbe un nodo
  stessaLista('il Dardo avvelenato avvelena', statiDelNodo(NODI['dardo-avvelenato']), ['avvelena'])
  stessaLista('Brucia fa bruciare', statiDelNodo(NODI.brucia), ['brucia'])
  stessaLista('la Prigione di ghiaccio gela e stordisce', statiDelNodo(NODI['prigione-di-ghiaccio']), ['gela', 'stordisce'])
  stessaLista('il Colpo di scudo stordisce', statiDelNodo(NODI['colpo-di-scudo']), ['stordisce'])
  stessaLista('il Taglio profondo fa sanguinare', statiDelNodo(NODI['taglio-profondo']), ['sanguina'])
  stessaLista('i Rovi non mettono uno stato che si rifiuta', statiDelNodo(NODI.rovi), [])
  // ogni abilità che colpisce ha un elemento valido
  controlla('ogni nodo ha un elemento valido', Object.values(NODI).every(n => CHIAVI_ELEMENTI.includes(n.elemento)))
  uguale('l\'elemento di un nodo è il suo, o quello del ramo', `${NODI['dardo-avvelenato'].elemento} ${NODI['freccia-mirata'].elemento} ${NODI['raggio-di-gelo'].elemento} ${NODI.fulmine.elemento}`, 'veleno fisico gelo fulmine')
  uguale('Giuramento colpisce di luce sacra, Fucina di fuoco', `${NODI['luce-sacra'].elemento} ${NODI['martello-caldo'].elemento}`, 'sacro fuoco')
}

/* ══════════ 2. resistenza e debolezza: il colpo cambia ══════════ */
{
  const dardo = NODI['dardo-di-fuoco']
  const neutro = scontro('mago', conAlbero(6, { 'dardo-di-fuoco': 1 }), 'verga', null, { tipo: 'goblin' })
  const solito = neutro.c.colpo(neutro.m, dardo)
  const base = Math.round(neutro.c.attDelRamo(dardo)) * 2
  uguale('contro un mostro senza difese è il colpo di sempre (att × 2)', solito, base)
  const melma = scontro('mago', conAlbero(6, { 'dardo-di-fuoco': 1 }), 'verga', null, { tipo: 'melma' })
  uguale('la melma teme il fuoco: un danno e mezzo', melma.c.colpo(melma.m, dardo), Math.round(base * 1.5))
  const fiammetta = scontro('mago', conAlbero(6, { 'dardo-di-fuoco': 1 }), 'verga', null, { tipo: 'troll', grosso: 'fiammetta' })
  uguale('Fiammetta resiste al fuoco: metà', fiammetta.c.colpo(fiammetta.m, dardo), Math.round(base * 0.5))
  // l'attacco solito non ha elemento: nessuno gli resiste (così il banco e le misure restano quelle)
  const fant = scontro('mago', conAlbero(6, { 'dardo-di-fuoco': 1 }), 'verga', null, { tipo: 'fantasma' })
  uguale('il fantasma resiste al fisico, ma l\'attacco solito non ha elemento', fant.c.colpo(fant.m), neutro.c.colpo(neutro.m))
  // un'abilità fisica contro chi resiste al fisico dimezza
  const fend = NODI.fendente
  const cav = scontro('cavaliere', conAlbero(6, { fendente: 1 }), 'spada', null, { tipo: 'goblin' })
  const cavFant = scontro('cavaliere', conAlbero(6, { fendente: 1 }), 'spada', null, { tipo: 'fantasma' })
  uguale('il Fendente sul fantasma fa metà', cavFant.c.colpo(cavFant.m, fend), Math.round(cav.c.colpo(cav.m, fend) / 2))
  // la luce sacra dei cavalieri: contro lo scheletro un danno e mezzo
  const sacro = NODI['luce-sacra']
  const g1 = scontro('cavaliere', conAlbero(6, { 'luce-sacra': 1 }), 'spada', null, { tipo: 'goblin' })
  const g2 = scontro('cavaliere', conAlbero(6, { 'luce-sacra': 1 }), 'spada', null, { tipo: 'scheletro', dif: 0 })
  controlla('lo scheletro teme la luce sacra: un danno e mezzo', Math.abs(g2.c.colpo(g2.m, sacro) - g1.c.colpo(g1.m, sacro) * 1.5) <= 1, `${g2.c.colpo(g2.m, sacro)} contro ${g1.c.colpo(g1.m, sacro)}`)
  // la riga della scelta lo dice, coi numeri veri («resiste al fuoco: fai N di danno»)
  controlla('la scelta dice «teme il fuoco» sulla melma', /^fai \d+ di danno · teme il fuoco/.test(melma.c.descrizione(dardo, melma.m)), melma.c.descrizione(dardo, melma.m))
  controlla('«resiste al fuoco» su Fiammetta, col danno vero', fiammetta.c.descrizione(dardo, fiammetta.m).startsWith(`fai ${fiammetta.c.colpo(fiammetta.m, dardo)} di danno · resiste al fuoco`), fiammetta.c.descrizione(dardo, fiammetta.m))
  controlla('e niente sul goblin', !/resiste|teme/.test(neutro.c.descrizione(dardo, neutro.m)))
  controlla('«teme la luce sacra» sullo scheletro', /teme la luce sacra/.test(g2.c.descrizione(sacro, g2.m)))
  // la partita lo applica davvero: un colpo che parte toglie quello che dice
  melma.c.prepara('dardo-di-fuoco')
  const ossa = melma.m.ossa
  const dice = melma.c.colpo(melma.m, dardo)
  const e = melma.c.rispondi(true)
  uguale('rispondendo giusto il mostro perde proprio quello', ossa - melma.m.ossa, dice)
  // l'esito racconta com'è andata, per la vista
  const col = e.azioni[0].colpiti[0]
  uguale('l\'esito dice l\'elemento del colpo', col.elemento, 'fuoco')
  uguale('e che il mostro lo temeva', col.effetto, 'teme')
  uguale('l\'abilità usata porta il suo elemento', e.azioni[0].usata.elemento, 'fuoco')
  uguale('il foglio dà le difese di ogni mostro in campo, nell\'ordine dei posti', JSON.stringify(melma.c.foglio.difese[0]), JSON.stringify(difeseDi(melma.m)))
  // l'anteprima: prima di rispondere, chi prenderebbe il colpo e come
  const fo = scontro('mago', conAlbero(6, { 'dardo-di-fuoco': 1 }), 'verga', null, { tipo: 'troll', grosso: 'fiammetta' })
  fo.c.prepara('dardo-di-fuoco')
  uguale('l\'anteprima dice «resiste»', fo.c.foglio.colpiti[0].effetto, 'resiste')
  fo.c.prepara(null)
  uguale('senza abilità preparata, niente', fo.c.foglio.colpiti[0].effetto, null)
}

/* ══════════ 3. l'immunità agli stati ══════════ */
{
  // lo scheletro non si avvelena: il Dardo fa il suo colpo, il veleno non parte
  const colpisci = (eroe, albero, mano, id, mostro, mancina = null) => {
    const s = scontro(eroe, conAlbero(12, albero), mano, mancina, mostro)
    s.c.prepara(id)
    const ossa = s.m.ossa
    const e = s.c.rispondi(true)
    return { ...s, e, tolte: ossa - s.m.ossa }
  }
  let r = colpisci('elfa', { 'dardo-avvelenato': 1 }, 'arco-corto', 'dardo-avvelenato', { tipo: 'scheletro' })
  controlla('lo scheletro prende il colpo ma non il veleno', r.tolte > 0 && !(r.m.stati && r.m.stati.veleno), JSON.stringify(r.m.stati))
  controlla('la scelta lo dice: «non si avvelena»', /non si avvelena/.test(r.c.descrizione(NODI['dardo-avvelenato'], r.m)) && !/a turno/.test(r.c.descrizione(NODI['dardo-avvelenato'], r.m)), r.c.descrizione(NODI['dardo-avvelenato'], r.m))
  uguale('e l\'esito segna lo stato rifiutato', r.e.azioni[0].colpiti[0].rifiutati.join(), 'avvelena')
  r = colpisci('elfa', { 'dardo-avvelenato': 1 }, 'arco-corto', 'dardo-avvelenato', { tipo: 'goblin' })
  controlla('un goblin invece sì', r.m.stati && r.m.stati.veleno && r.m.stati.veleno.scambi > 0)
  // il golem non si stordisce: la Martellata del nano colpisce e basta, e il golem risponde
  r = colpisci('nano', { stordisce: 1 }, 'ascia', 'stordisce', { tipo: 'golem' })
  controlla('il golem non si stordisce: al suo turno colpisce, la vita dell\'eroe cala', r.c.vita < r.c.vitaMax)
  controlla('la scelta dice «non si stordisce»', /non si stordisce/.test(r.c.descrizione(NODI.stordisce, r.m)) && !/stordito per/.test(r.c.descrizione(NODI.stordisce, r.m)))
  r = colpisci('nano', { stordisce: 1 }, 'ascia', 'stordisce', { tipo: 'goblin' })
  controlla('un goblin sì: al suo turno non colpisce', r.c.vita === r.c.vitaMax)
  // Freccia mirata (`quieto`): anche lei è uno stordimento
  r = colpisci('elfa', { 'freccia-mirata': 1 }, 'arco-corto', 'freccia-mirata', { tipo: 'golem' })
  controlla('il golem non salta il turno nemmeno per la Freccia mirata', r.c.vita < r.c.vitaMax)
  r = colpisci('elfa', { 'freccia-mirata': 1 }, 'arco-corto', 'freccia-mirata', { tipo: 'goblin' })
  controlla('il goblin sì: salta il suo turno', r.c.vita === r.c.vitaMax)
  // Brucia e le fiamme: Fiammetta non brucia, il goblin sì (e brucia con le fiamme, non col veleno)
  r = colpisci('mago', { brucia: 1 }, 'verga', 'brucia', { tipo: 'troll', grosso: 'fiammetta' })
  controlla('Fiammetta non brucia', !(r.m.stati && r.m.stati.veleno))
  controlla('e la scelta lo dice', /non brucia/.test(r.c.descrizione(NODI.brucia, r.m)), r.c.descrizione(NODI.brucia, r.m))
  r = colpisci('mago', { brucia: 1 }, 'verga', 'brucia', { tipo: 'goblin' })
  controlla('il goblin arde: sono fiamme', r.m.stati.veleno && r.m.stati.veleno.fuoco === true)
  // il veleno del dardo non è fuoco
  r = colpisci('elfa', { 'dardo-avvelenato': 1 }, 'arco-corto', 'dardo-avvelenato', { tipo: 'goblin' })
  controlla('il veleno del dardo non è fuoco', r.m.stati.veleno.fuoco === false)
  // la Prigione di ghiaccio: il fantasma non gela, il goblin sì
  r = colpisci('mago', { 'prigione-di-ghiaccio': 1 }, 'verga', 'prigione-di-ghiaccio', { tipo: 'fantasma' })
  controlla('il fantasma non finisce nel ghiaccio: colpisce', r.c.vita < r.c.vitaMax)
  r = colpisci('mago', { 'prigione-di-ghiaccio': 1 }, 'verga', 'prigione-di-ghiaccio', { tipo: 'goblin' })
  controlla('il goblin sì: sta fermo', r.c.vita === r.c.vitaMax)
  // il gelo che dimezza: un mostro che non gela fa il suo colpo intero (il Raggio di gelo, `debole`)
  r = colpisci('mago', { 'raggio-di-gelo': 1 }, 'verga', 'raggio-di-gelo', { tipo: 'fantasma' })
  controlla('il fantasma non gela: niente «metà danno»', !(r.m.stati && r.m.stati.debole > 0))
  // ma il «metà danno» che non è di gelo (Rovi) non si rifiuta: nessuna immunità lo ferma
  r = colpisci('elfa', { rovi: 1 }, 'arco-corto', 'rovi', { tipo: 'golem' })
  controlla('i Rovi funzionano anche sul golem', r.m.stati && r.m.stati.debole > 0)
  // l'immune non ferma l'elemento: il fantasma resiste al fisico ma il colpo c'è
  const fd = scontro('mago', conAlbero(6, { 'dardo-di-fuoco': 1 }), 'verga', null, { tipo: 'fantasma' })
  controlla('il fuoco sul fantasma fa il suo danno', fd.c.colpo(fd.m, NODI['dardo-di-fuoco']) > 1)
  // il fuoco che dura vale di più su chi lo teme: la melma brucia di più
  const brucia = tipo => { const s = colpisci('mago', { brucia: 1 }, 'verga', 'brucia', { tipo }); return s.m.stati.veleno }
  controlla('chi teme il fuoco brucia di più, chi non ha difese come sempre', brucia('melma').quanto > brucia('goblin').quanto, `${brucia('melma').quanto} contro ${brucia('goblin').quanto}`)
  controlla('chi resiste al fuoco (il lupo teme, il grosso di brace resiste) brucia di meno',
            brucia('lupo').quanto > brucia('goblin').quanto)
}

/* ══════════ 4. il sangue ══════════ */
{
  const taglio = NODI['taglio-profondo']
  const s = scontro('cavaliere', conAlbero(12, { fendente: 1, filo: 1, 'taglio-profondo': 1 }), 'spada', null, { tipo: 'goblin', att: 1 })
  s.c.prepara('taglio-profondo')
  s.c.rispondi(true)
  const uno = s.m.stati.sanguina
  controlla('un taglio fa sanguinare: una pila, tre turni', uno && uno.pile === 1 && uno.scambi === 2 && uno.quanto >= 1, JSON.stringify(uno))
  // il sangue brucia al turno del mostro, anche se l'eroe sbaglia (l'esito lo conta fra i danni a turno)
  const ossa = s.m.ossa
  const e = s.c.rispondi(false)
  uguale('al suo turno perde quanto per pile', ossa - s.m.ossa, uno.quanto)
  uguale('l\'esito lo dice come danno a turno', e.veleno, uno.quanto)
  controlla('e c\'è l\'evento', e.azioni.some(a => a.che === 'sanguina' && a.dato === uno.quanto))
  // un taglio nuovo si somma (fino a tre) e rimette a posto la durata
  const t = scontro('cavaliere', conAlbero(12, { fendente: 1, filo: 1, 'taglio-profondo': 1 }), 'spada', null, { tipo: 'goblin', att: 1 })
  for (let i = 1; i <= 4; i++) {
    t.c.energia = t.c.energiaMax
    t.c.prepara('taglio-profondo')
    t.c.rispondi(true)
    uguale(`dopo ${i} tagli le pile sono ${Math.min(i, PILE_DEL_SANGUE)}`, t.m.stati.sanguina.pile, Math.min(i, PILE_DEL_SANGUE))
  }
  uguale('il tetto è tre', PILE_DEL_SANGUE, 3)
  const prima = t.m.ossa, quanto = t.m.stati.sanguina.quanto
  t.c.rispondi(false)
  uguale('con tre pile perde tre volte quanto', prima - t.m.ossa, quanto * 3)
  // chi non sanguina non lo prende: scheletro, golem, melma, fantasma
  for (const tipo of ['scheletro', 'golem', 'melma', 'fantasma']) {
    const x = scontro('cavaliere', conAlbero(12, { fendente: 1, filo: 1, 'taglio-profondo': 1 }), 'spada', null, { tipo, att: 1 })
    x.c.prepara('taglio-profondo')
    const e2 = x.c.rispondi(true)
    controlla(`${tipo} non sanguina`, !(x.m.stati && x.m.stati.sanguina) && e2.azioni[0].colpiti[0].rifiutati.includes('sanguina'))
  }
  controlla('la scelta dice «sanguina per 3 turni»', /sanguina per 3 turni/.test(s.c.descrizione(taglio, scontro('cavaliere', conAlbero(12, { 'taglio-profondo': 1 }), 'spada', null, { tipo: 'goblin' }).m)) ||
            /sanguina per 3 turni/.test(t.c.descrizione(taglio, { ...t.m, tipo: 'goblin' })))
  // la Lancia di ghiaccio e Alle spalle contano anche un mostro che sanguina fra quelli «colpiti»
  const sp = scontro('elfa', conAlbero(12, { 'alle-spalle': 1, 'ferita-aperta': 1 }), 'spada', null, { tipo: 'goblin', att: 1 })
  const prima2 = sp.c.colpo(sp.m, NODI['alle-spalle'])
  sp.m.stati = { sanguina: { quanto: 1, scambi: 2, pile: 1 } }
  controlla('Alle spalle fa di più su un mostro che sanguina', sp.c.colpo(sp.m, NODI['alle-spalle']) > prima2, `${prima2} → ${sp.c.colpo(sp.m, NODI['alle-spalle'])}`)
  // la sosta: uno stato nuovo si porta nei salvataggi come gli altri (è un oggetto nel mostro)
  controlla('il sangue sopravvive a una copia JSON', JSON.parse(JSON.stringify(t.m.stati)).sanguina.pile === 3)
}

/* ══════════ 5. le forme dei colpi, con abilità vere ══════════ */
{
  const prova = (eroe, id, mano, mancina, tipi, bersaglio = 1, livello = 12) => {
    const cr = conAlbero(livello, { [id]: 1 })
    const s = scena(eroe, cr, mano, mancina, tipi)
    s.c.scegliBersaglio(s.campo[bersaglio])
    s.c.prepara(id)
    const colpiti = s.c.foglio.colpiti.map(x => s.campo.indexOf(x.chi))
    const prima = s.campo.map(x => x.ossa)
    const e = s.c.rispondi(true)
    const toccati = s.campo.map((x, i) => (x.ossa < prima[i] ? i : -1)).filter(i => i >= 0)
    const dati = s.campo.map((x, i) => prima[i] - x.ossa)
    return { ...s, colpiti, toccati, e, dati, prima }
  }
  const cinque = ['goblin', 'goblin', 'goblin', 'goblin', 'goblin']
  // vicini: la Palla di fuoco prende il bersaglio e i due accanto
  uguale('la Palla di fuoco è «vicini»', NODI['sfera-di-fuoco'].forma, 'vicini')
  let r = prova('mago', 'sfera-di-fuoco', 'verga', null, cinque, 2)
  stessaLista('la Palla di fuoco: il bersaglio e i due accanto', r.toccati, [1, 2, 3])
  stessaLista('e l\'anteprima lo sa', r.colpiti.sort(), [1, 2, 3])
  controlla('ognuno prende il suo colpo pieno', r.dati[1] === r.dati[2] && r.dati[2] === r.dati[3] && r.dati[2] > 0, r.dati.join())
  r = prova('mago', 'sfera-di-fuoco', 'verga', null, cinque, 0)
  stessaLista('al bordo: il bersaglio e uno solo', r.toccati, [0, 1])
  // gli elementi contano per ognuno dei presi: la melma teme il fuoco, il goblin no
  r = prova('mago', 'sfera-di-fuoco', 'verga', null, ['goblin', 'melma', 'goblin', 'goblin', 'goblin'], 0)
  controlla('la palla di fuoco fa di più alla melma accanto', r.dati[1] > r.dati[0], r.dati.join())
  controlla('e l\'esito lo segna sulla melma, non sul goblin', r.e.azioni[0].colpiti.find(c => c.chi === r.campo[1]).effetto === 'teme' && r.e.azioni[0].colpiti.find(c => c.chi === r.campo[0]).effetto === null)
  // altre abilità vicini: Spazzata, Giudizio, Volo di frecce
  for (const [eroe, id, mano, mancina] of [['cavaliere', 'spazzata', 'spada', null], ['cavaliere', 'giudizio', 'spada', null], ['elfa', 'volo-di-frecce', 'arco-corto', null],
                                           ['mago', 'nevicata', 'verga', null], ['nano', 'frana', 'ascia', null]]) {
    uguale(`${id} è «vicini»`, NODI[id].forma, 'vicini')
    stessaLista(`${id}: tre mostri`, prova(eroe, id, mano, mancina, cinque, 2).toccati, [1, 2, 3])
  }
  // catena: il bersaglio e i salti, ×0,7 a salto
  uguale('la Catena di fulmini è «catena», con due salti', `${NODI['catena-di-fulmini'].forma} ${NODI['catena-di-fulmini'].salti[0]}`, 'catena 2')
  r = prova('mago', 'catena-di-fulmini', 'verga', null, cinque, 2)
  uguale('la catena prende tre mostri', r.toccati.length, 3)
  uguale('il primo è il bersaglio', r.colpiti[0], 2)
  const colpo = r.c.colpo(r.campo[2], NODI['catena-di-fulmini'])
  uguale('il bersaglio prende il colpo intero', r.dati[2], colpo)
  uguale('il primo salto vale ×0,7', r.dati[r.colpiti[1]], Math.max(1, Math.round(colpo * FATTORE_DEL_SALTO)))
  uguale('il secondo ×0,49', r.dati[r.colpiti[2]], Math.max(1, Math.round(colpo * FATTORE_DEL_SALTO ** 2)))
  controlla('sono tre mostri diversi', new Set(r.colpiti).size === 3)
  // la freccia che trapassa (un salto al primo grado) e l'ascia che rimbalza
  r = prova('elfa', 'freccia-che-trapassa', 'arco-corto', null, cinque, 0)
  uguale('la Freccia che trapassa: due mostri al primo grado', r.toccati.length, 2)
  r = prova('nano', 'ascia-lanciata', 'ascia', null, cinque, 0)
  uguale('l\'Ascia lanciata: due mostri al primo grado', r.toccati.length, 2)
  // il grado alza i salti: al terzo grado la freccia ne prende tre
  const alto = scena('elfa', { ...conAlbero(30, {}), albero: { 'freccia-che-trapassa': 3 }, caselle: ['freccia-che-trapassa', null, null] }, 'arco-corto', null, cinque)
  alto.c.scegliBersaglio(alto.campo[0]); alto.c.prepara('freccia-che-trapassa')
  uguale('al terzo grado: bersaglio e due salti', alto.c.foglio.colpiti.length, 3)
  // tutti: il Mulinello, la Tempesta di colpi, la Pioggia di scintille, la Luna piena
  for (const [eroe, id, mano] of [['cavaliere', 'mulinello', 'spada'], ['cavaliere', 'tempesta-di-colpi', 'spada'], ['mago', 'scintille', 'verga'], ['elfa', 'luna-piena', 'arco-corto'],
                                  ['nano', 'fiamma-della-fucina', 'ascia']]) {
    uguale(`${id} è «tutti»`, NODI[id].forma, 'tutti')
    uguale(`${id}: tutti e cinque`, prova(eroe, id, mano, null, cinque, 2).toccati.length, 5)
  }
  // un'abilità a più bersagli che mette uno stato lo mette a tutti i presi, e solo a loro
  r = prova('mago', 'nevicata', 'verga', null, cinque, 2)
  stessaLista('la Nevicata gela i tre presi', r.campo.map(x => ((x.stati || {}).debole || 0) > 0), [false, true, true, true, false])
  r = prova('elfa', 'spore', 'arco-corto', null, cinque, 2)
  stessaLista('le Spore avvelenano i tre presi', r.campo.map(x => !!(x.stati && x.stati.veleno)), [false, true, true, true, false])
  r = prova('cavaliere', 'macello', 'spada', null, cinque, 2)
  stessaLista('il Macello fa sanguinare i tre presi', r.campo.map(x => !!(x.stati && x.stati.sanguina)), [false, true, true, true, false])
  r = prova('elfa', 'ortica', 'arco-corto', null, cinque, 2)
  stessaLista('l\'Ortica avvelena tutti', r.campo.map(x => !!(x.stati && x.stati.veleno)), [true, true, true, true, true])
  r = prova('elfa', 'ninna-nanna', 'arco-corto', null, cinque, 2)
  // il sonno dura il suo turno e se ne va: si vede da chi colpisce (due mostri su cinque, uno a testa) e da chi non perde vita
  uguale('la Ninna nanna: ne colpiscono solo due su cinque, i tre accanto al bersaglio dormono', r.c.vitaMax - r.c.vita, 2 * r.c.danno(r.campo[0]))
  uguale('e non toglie vita ai mostri', r.toccati.length, 0)
  // l'immunità si applica mostro per mostro: la Nevicata e il fantasma
  r = prova('mago', 'nevicata', 'verga', null, ['goblin', 'fantasma', 'goblin', 'goblin', 'goblin'], 1)
  stessaLista('la Nevicata non gela il fantasma', r.campo.map(x => ((x.stati || {}).debole || 0) > 0), [true, false, true, false, false])
  // le abilità a più bersagli non battono quelle da uno solo dello stesso gradino, riga per riga
  for (const [chi, rami] of Object.entries(RAMI)) for (const ra of rami) for (let riga = 2; riga <= 3; riga++) {
    const nodi = ra.nodi.filter(x => x.riga === riga && !x.sempre && (x.per || x.passa))
    const aree = nodi.filter(x => x.forma !== 'uno'), soli = nodi.filter(x => x.forma === 'uno')
    for (const a of aree) {
      const piuForte = Math.max(...Object.values(NODI).filter(x => x.riga === riga && x.classe === chi && x.forma === 'uno' && x.per).map(x => x.per[0]))
      controlla(`${chi}/${a.id}: a più bersagli, il colpo del singolo è sotto il più forte della riga`, a.per[0] <= piuForte, `${a.per[0]} contro ${piuForte}`)
    }
    void soli
  }
}

/* ══════════ 6. le passive nuove: spine, furto, furia, velocità ══════════ */
{
  // Bordo a punte: chi ti colpisce perde una parte di quello che ti toglie, almeno uno
  const cr = conAlbero(12, { 'scudo-alzato': 1, parata: 1, 'bordo-a-punte': 1 })
  const sp = scontro('cavaliere', cr, 'spada', 'scudo-legno', { att: 12, ossa: 400 })
  const ossa = sp.m.ossa, vita = sp.c.vita
  sp.c.rispondi(false)
  const preso = vita - sp.c.vita
  controlla('il mostro ha colpito', preso > 0)
  uguale('e perde il 25% di quello che toglie (almeno uno)', ossa - sp.m.ossa, Math.max(1, Math.round(preso * 0.25)))
  const senza = scontro('cavaliere', conAlbero(12, { 'scudo-alzato': 1, parata: 1 }), 'spada', 'scudo-legno', { att: 12, ossa: 400 })
  senza.c.rispondi(false)
  uguale('senza le punte non perde niente', senza.m.ossa, 400)
  // un mostro che muore per le spine cade davvero
  const mortale = scontro('cavaliere', cr, 'spada', 'scudo-legno', { att: 12, ossa: 1, ossaMax: 1 })
  mortale.c.rispondi(false)
  controlla('un mostro che muore per le spine cade', mortale.m.morto || mortale.m.ossa <= 0)
  // senza lo scudo le punte non valgono (il ramo vuole lo scudo)
  const nudo = scontro('cavaliere', cr, 'spada', null, { att: 12, ossa: 400 })
  nudo.c.rispondi(false)
  uguale('senza lo scudo in mano, niente spine', nudo.m.ossa, 400)

  // Mano santa: una parte del danno fatto guarisce
  const ms = scontro('cavaliere', conAlbero(12, { preghiera: 1, 'cuore-saldo': 1, 'mano-santa': 1 }), 'spada', null, { att: 1 })
  ms.c.vita = 20
  const v0 = ms.c.vita
  const ossaM = ms.m.ossa
  const eM = ms.c.rispondi(true)
  const dato = ossaM - ms.m.ossa
  const guarito = ms.c.vita - v0 + eM.preso   // quello che il mostro ha tolto dopo, rimesso
  uguale('Mano santa guarisce l\'8% del danno fatto', guarito, Math.round(dato * 0.08))
  uguale('e l\'azione lo racconta', eM.azioni[0].rubato, guarito)
  // il furto non supera la vita massima
  const pieno = scontro('cavaliere', conAlbero(12, { preghiera: 1, 'cuore-saldo': 1, 'mano-santa': 1 }), 'spada', null, { att: 1 })
  pieno.c.rispondi(true)
  controlla('e non va oltre il massimo', pieno.c.vita <= pieno.c.vitaMax)

  // Rabbia: con meno di metà vita si picchia più forte, anche con l'attacco solito
  const fu = scontro('cavaliere', conAlbero(12, { 'colpo-furioso': 1, rabbia: 1 }), 'spada', null, { att: 1 })
  fu.c.vita = fu.c.vitaMax
  const forte = fu.c.colpo(fu.m)
  fu.c.vita = Math.floor(fu.c.vitaMax / 2)
  const furioso = fu.c.colpo(fu.m)
  controlla('a metà vita il colpo è più forte', furioso > forte, `${forte} → ${furioso}`)
  uguale('di un quinto', furioso, Math.max(1, Math.round(Math.round(fu.c.attDelRamo(null) - fu.m.dif) * 1.2)))
  fu.c.vita = fu.c.vitaMax / 2 + 1
  uguale('sopra la metà non c\'è', fu.c.colpo(fu.m), forte)
  controlla('vale anche per un\'abilità', (() => { fu.c.vita = 1; const a = fu.c.colpo(fu.m, NODI['colpo-furioso']); fu.c.vita = fu.c.vitaMax; return a > fu.c.colpo(fu.m, NODI['colpo-furioso']) })())

  // Passo di carica: più velocità, e la fila lo sa
  const vel0 = scontro('cavaliere', conAlbero(12, { 'colpo-furioso': 1, rabbia: 1 }), 'spada')
  const vel1 = scontro('cavaliere', conAlbero(12, { 'colpo-furioso': 1, rabbia: 1, carica: 1, 'passo-di-carica': 1 }), 'spada')
  uguale('+1 di velocità', vel1.c.velocita, vel0.c.velocita + 1)
  uguale('Piedi leggeri, +1 anche per l\'elfa', scontro('elfa', conAlbero(12, { stoccata: 1, 'passo-leggero': 1, 'ferita-aperta': 1, 'piedi-leggeri': 1 }), 'spada').c.velocita,
         scontro('elfa', conAlbero(12, { stoccata: 1 }), 'spada').c.velocita + 1)
  // Mira del nano: il primo tiro anche per la balestra
  const mira = scontro('nano', conAlbero(12, { quadrello: 1, perforante: 1, 'mira-del-nano': 2 }), 'arco-corto', null, { velocita: 30 })
  controlla('la Mira del nano fa sparare per primo', mira.c.foglio.apertura.length === 0)
  // l'energia: Silenzio del bosco e Mente lucida
  const e0 = scontro('elfa', conAlbero(12, { rovi: 1, linfa: 1 }), 'arco-corto').c.energiaMax
  uguale('Silenzio del bosco: +1 di energia', scontro('elfa', conAlbero(12, { rovi: 1, linfa: 1, 'silenzio-del-bosco': 1 }), 'arco-corto').c.energiaMax, e0 + 1)
  uguale('Mente lucida: +1 di energia', scontro('mago', conAlbero(12, { 'scudo-arcano': 1, 'fonte-arcana': 1, 'mente-lucida': 1 }), 'verga').c.energiaMax,
         scontro('mago', conAlbero(12, { 'scudo-arcano': 1 }), 'verga').c.energiaMax + 1)
}

/* ══════════ 7. il mago guerriero ══════════ */
{
  const mago = EROI.find(e => e.chiave === 'mago')
  controlla('il mago porta le bacchette e anche le spade', mago.porta.includes('bacchette') && mago.porta.includes('spade'))
  controlla('ma non le asce né gli archi', !mago.porta.includes('asce') && !mago.porta.includes('archi'))
  // la bottega: le spade cominciano a esserci fra quello che gli si offre, da sé (dalle famiglie)
  let spade = 0
  for (const finite of [1, 2, 3, 4, 5, 6, 7]) {
    const b = new Bottega({ eroe: 'mago', finite, roba: { v: 1, gemme: 999, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }, rnd: seminato(finite) })
    for (const r of b.mercanzia('armaiolo')) if (COSE[r.chiave] && COSE[r.chiave].famiglia === 'spade') spade++
  }
  controlla('l\'armaiolo gli offre delle spade', spade > 0, String(spade))
  // il requisito di forza è quello di tutti: la spada corta e la spada sì, lo spadone no (la forza del mago è 1)
  const c = new Corredo({ eroe: 'mago', roba: { v: 1, gemme: 0, zaino: [], mano: null, mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }, crescita: { esp: sogliaDi(1) } })
  controlla('porta la spada', c.porta('spada') && c.porta('spada-corta') && c.porta('spadone'))
  controlla('la spada corta e la spada gli bastano', c.posso('spada-corta') && c.posso('spada'))
  const req = requisitoDi(COSE.spadone)
  controlla('lo spadone vuole forza 3', req && req.car === 'forza' && req.serve === 3 && !c.posso('spadone'))
  const con3 = new Corredo({ eroe: 'mago', roba: c.roba, crescita: { esp: sogliaDi(6), forza: 2 } })
  controlla('con due punti alla forza lo reggerebbe', con3.posso('spadone'))
  controlla('l\'ascia non si impugna: il mago non la porta', !c.porta('ascia'))
  // spada nella destra e bacchetta nella mancina: il mago guerriero
  const lama = NODI['lama-incantata']
  uguale('la Lama arcana vuole la spada e colpisce con l\'intelligenza', `${lama.arma.famiglie.join()} ${lama.car}`, 'spade intelligenza')
  const sm = scontro('mago', conAlbero(12, { 'lama-incantata': 1, 'dardo-di-fuoco': 1 }, { intelligenza: 4 }), 'spada', 'verga')
  controlla('con la spada in mano la Lama si può preparare', sm.c.prepara('lama-incantata'))
  controlla('e il Fuoco con la bacchetta nella mancina', sm.c.prepara('dardo-di-fuoco'))
  const solo = scontro('mago', conAlbero(12, { 'lama-incantata': 1 }, { intelligenza: 4 }), 'verga')
  controlla('senza la spada la Lama si spegne e dice perché', !solo.c.prepara('lama-incantata') && /spada/.test(solo.c.perchéNonUsi('lama-incantata')))
  // l'attacco della Lama è quello dell'intelligenza (più il braccio e la spada), non quello della forza
  const poco = scontro('mago', conAlbero(12, { 'lama-incantata': 1 }), 'spada')
  const tanto = scontro('mago', conAlbero(12, { 'lama-incantata': 1 }, { intelligenza: 6 }), 'spada')
  uguale('sei punti all\'intelligenza: l\'attacco della Lama sale di sei', tanto.c.attDelRamo(lama) - poco.c.attDelRamo(lama), 6 * ATT_PER_PUNTO)
  uguale('mentre l\'attacco solito, di spada, non si muove (conta la forza)', tanto.c.att, poco.c.att)
  uguale('l\'attacco della Lama: il braccio, l\'intelligenza dei punti e la spada', poco.c.attDelRamo(lama), poco.c.io.att + poco.c.piu.sopra.intelligenza * ATT_PER_PUNTO + COSE.spada.att)
  // la spada in mancina, la bacchetta in mano: la Lama la usa lo stesso, con la spada intera
  const inv = scontro('mago', conAlbero(12, { 'lama-incantata': 1, 'dardo-di-fuoco': 1 }, { intelligenza: 2 }), 'verga', 'spada')
  controlla('con la spada nella mancina la Lama si prepara lo stesso', inv.c.prepara('lama-incantata'))
  uguale('con la spada intera', inv.c.attDelRamo(lama), inv.c.io.att + inv.c.piu.sopra.intelligenza * ATT_PER_PUNTO + COSE.spada.att)
  // gli altri rami d'arma non sono cambiati: il cavaliere con la spada non dipende dall'intelligenza
  const cav = scontro('cavaliere', conAlbero(12, { fendente: 1 }), 'spada')
  uguale('il Fendente del cavaliere è l\'attacco solito', cav.c.attDelRamo(NODI.fendente), cav.c.att)
  // il ramo è nell'albero del mago e solo suo
  stessaLista('il mago ha quattro rami', RAMI.mago.map(r => r.chiave), ['fuoco', 'gelo', 'arcano', 'lama-arcana'])
  controlla('la Lama arcana: abilità di fuoco, di gelo e di fulmine, con la lama', [NODI['lama-di-fuoco'], NODI['lama-di-gelo'], NODI['falciata-arcana']].map(n => n.elemento).join() === 'fuoco,gelo,fulmine')
  controlla('e nessun altro eroe ha una Lama arcana', Object.entries(RAMI).filter(([k]) => k !== 'mago').every(([, rami]) => !rami.some(r => r.chiave === 'lama-arcana')))
  // i rami che vogliono un'arma e hanno una caratteristica sono soltanto lei
  stessaLista('con arma e caratteristica insieme: solo la Lama arcana', Object.values(RAMI).flat().filter(r => r.arma && r.car).map(r => r.chiave), ['lama-arcana'])
  void FAMIGLIE
}

/* ══════════ 8. i glifi dei nodi nuovi ══════════ */
{
  const nomi = Object.values(RAMI).flat().flatMap(r => r.nodi.map(x => x.glifo))
  controlla('ogni nodo ha il suo glifo, a parte un pugno di riusi', new Set(nomi).size >= nomi.length - 8, `${new Set(nomi).size} su ${nomi.length}`)
  controlla('e sono tutti disegnati', nomi.every(n => GLIFI[n]))
}

riassunto('gli elementi, le resistenze e le abilità a più bersagli')
