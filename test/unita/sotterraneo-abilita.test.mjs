/* L'albero delle abilità (docs/sotterraneo/abilita.md): i rami e i nodi stanno in piedi (quattro rami da sette nodi in cinque
   righe, due nodi fra cui scegliere in due righe, gli id di prima ancora tutti lì), i punti dell'albero e
   le loro regole (il gradino, la riga sopra, il grado), le caselle dello scontro, l'energia che viene dalle
   risposte giuste, alla fonte e dalla pozione blu, e cosa fanno gli effetti nello scontro: il colpo doppio,
   l'abilità che sbagliando resta pronta, il veleno che brucia al turno del mostro, il mostro gelato e quello
   stordito, la parata, il Grido a tutti, il primo tiro con l'arco, l'ultimo fiato, l'energia nella sosta.
   Gli effetti si contano nei turni di chi li porta (docs/sotterraneo/scontro.md).
   `node test/esegui.mjs sotterraneo-abilita --niente-build` */
import { RAMI, NODI, ENERGIA, CASELLE_ABILITA, GRADINI, COSTO_DEL_GRADINO, guastiDelleAbilita } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { sogliaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { SORSO } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { puntiAbilita, perchéNonImpari, impara, caselleDella, metti } from '../../src/giochi/sotterraneo/motore/abilita.js'
import { rileggiCrescita } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { GLIFI } from '../../src/giochi/sotterraneo/viste/glifi.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const roba = (mano = null, mancina = null) => ({ v: 1, gemme: 0, zaino: [], mano, mancina, corpo: null, dito: null, torcia: 0, torce: 0 })
const conAlbero = (livello, albero) => ({ esp: sogliaDi(livello), albero, caselle: Object.keys(albero).filter(id => !NODI[id].sempre).slice(0, 3) })

// uno scontro con un mostro fatto a mano: i conti si leggono senza il caso del bestiario. Solo lui in campo, sveglio, e veloce
// come l'eroe: a parità tocca all'eroe, quindi i turni vanno uno per uno (eroe, mostro, eroe, mostro…)
function scontro(eroe, crescita, mano = null, mancina = null, mostro = {}) {
  const c = new Corsa(CAMPAGNA[1], { seme: 5, eroe, rnd: seminato(5), crescita, roba: roba(mano, mancina) })
  const m = c.livello.robe.find(r => r.che === 'mostro')
  // (un goblin: la scalinata ha ratti e melme, e la melma non si avvelena, che qui non è quello che si prova)
  Object.assign(m, { tipo: 'goblin', ossa: 200, ossaMax: 200, att: 9, dif: 0, sveglio: true, stati: null, velocita: c.velocita }, mostro)
  c.scontro(m, { solo: true, tocco: true })
  return { c, m }
}

/* ══════════ 1. i rami stanno in piedi ══════════ */
{
  const g = guastiDelleAbilita()
  controlla('l\'albero sta in piedi', !g.length, g.join(' · '))
  for (const e of EROI) uguale(`${e.chiave}: quattro rami`, (RAMI[e.chiave] || []).length, 4)
  // sette nodi per ramo, in cinque righe: uno, uno, due, due, uno (nelle righe da due si sceglie)
  for (const [chi, rami] of Object.entries(RAMI)) for (const r of rami) {
    uguale(`${chi}/${r.chiave}: sette nodi in cinque righe (1,1,2,2,1)`, GRADINI.map((_, i) => r.nodi.filter(x => x.riga === i).length).join(), '1,1,2,2,1')
    controlla(`${chi}/${r.chiave}: ogni abilità costa quanto la sua riga`, r.nodi.every(x => x.sempre || x.costo === COSTO_DEL_GRADINO[x.riga]))
    controlla(`${chi}/${r.chiave}: la prima riga si usa e il resto ha una passiva o due`, !r.nodi[0].sempre && r.nodi.some(x => x.sempre) && r.nodi.some(x => !x.sempre && x.riga > 0))
  }
  uguale('ventotto nodi per classe', EROI.map(e => RAMI[e.chiave].reduce((n, r) => n + r.nodi.length, 0)).join(), '28,28,28,28')
  // la regola dell'utente: ogni classe si difende al livello 2 (senz'armi) e si cura entro il 4
  for (const e of EROI) {
    const tutti = RAMI[e.chiave].flatMap(r => r.nodi.map(x => ({ ...x, dal: GRADINI[x.riga], arma: r.arma })))
    controlla(`${e.chiave}: una difesa al livello 2 senza armi`, tutti.some(x => x.difende && x.dal === 2 && !x.arma))
    controlla(`${e.chiave}: una cura entro il livello 4`, tutti.some(x => x.cura && x.dal <= 4))
  }
  // gli id di prima sono chiavi del salvataggio: tutti ancora lì, nello stesso ramo, e un albero vecchio si rilegge intero
  const VECCHI = {
    cavaliere: 'fendente filo affondo turbine scudo-alzato parata colpo-di-scudo muro preghiera cuore-saldo grido ultimo-fiato',
    elfa: 'dardo-avvelenato primo-tiro freccia-mirata pioggia stoccata passo-leggero danza alle-spalle rovi linfa respiro radici',
    mago: 'dardo-di-fuoco fiamma-viva brucia palla-di-fuoco raggio-di-gelo gelo-profondo lancia-di-ghiaccio tempesta scudo-arcano fonte-arcana fulmine specchio',
    nano: 'spaccaroccia mani-pesanti stordisce terremoto quadrello perforante chiodi-roventi polvere-da-mina pelle-di-pietra rune testa-dura montagna',
  }
  for (const [chi, ids] of Object.entries(VECCHI)) {
    const lista = ids.split(' ')
    controlla(`${chi}: i dodici nodi di prima ci sono ancora, della sua classe`, lista.every(id => NODI[id] && NODI[id].classe === chi), lista.filter(id => !NODI[id]).join())
    const letto = rileggiCrescita({ esp: sogliaDi(40), albero: Object.fromEntries(lista.map(id => [id, 1])), caselle: [] }, chi)
    uguale(`${chi}: un albero di prima si rilegge intero`, Object.keys(letto.albero).length, 12)
  }
  uguale('tre caselle nello scontro', CASELLE_ABILITA, 3)
  // le icone sono disegnate in codice (viste/glifi.js): un nome che non c'è sarebbe un medaglione vuoto
  const nomi = Object.values(RAMI).flat().flatMap(r => [r.glifo, r.arma && r.arma.glifo, ...r.nodi.map(x => x.glifo)]).filter(Boolean)
  const mancano = nomi.filter(x => !GLIFI[x])
  controlla('ogni icona dell\'albero è disegnata', !mancano.length, mancano.join(', '))
  controlla('e nessuna è un\'emoji', !Object.values(RAMI).flat().some(r => r.em || r.nodi.some(x => x.em)))
}

/* ══════════ 2. i punti dell'albero ══════════ */
{
  uguale('al livello 1 nessun punto', puntiAbilita({ esp: 0 }), 0)
  uguale('al livello 5, quattro', puntiAbilita({ esp: sogliaDi(5) }), 4)
  let cr = { esp: sogliaDi(5), albero: {}, caselle: [] }
  controlla('il secondo nodo vuole il primo', /prima Dardo avvelenato/.test(perchéNonImpari(cr, 'elfa', 'primo-tiro')))
  controlla('Freccia mirata sta al livello 8, come prima', /dal livello 8/.test(perchéNonImpari(cr, 'elfa', 'freccia-mirata')))
  uguale('i gradini si aprono ai livelli 2, 4, 6, 8 e 12', GRADINI.join(), '2,4,6,8,12')
  controlla('un nodo di un altro eroe non si impara', !!perchéNonImpari(cr, 'elfa', 'fendente'))
  cr = impara(cr, 'elfa', 'dardo-avvelenato')
  controlla('il primo nodo si impara, e va da sé in una casella', cr && cr.albero['dardo-avvelenato'] === 1 &&
            caselleDella(cr)[0] === 'dardo-avvelenato')
  controlla('il secondo grado vuole due livelli in più', /dal livello 4/.test(perchéNonImpari({ ...cr, esp: sogliaDi(3) }, 'elfa', 'dardo-avvelenato')))
  cr = impara(cr, 'elfa', 'primo-tiro')
  controlla('un nodo «sempre» non va nelle caselle', cr && !caselleDella(cr).includes('primo-tiro'))
  uguale('restano due punti', puntiAbilita(cr), 2)
  const spostato = metti(cr, 2, 'dardo-avvelenato')
  stessaLista('messa in un\'altra casella, si sposta', caselleDella(spostato), [null, null, 'dardo-avvelenato'])
  controlla('una casella si svuota', !caselleDella(metti(cr, 0, null)).includes('dardo-avvelenato'))
  controlla('un nodo «sempre» non entra', metti(cr, 1, 'primo-tiro') === null)
  const due = impara({ ...cr, esp: sogliaDi(5) }, 'elfa', 'rovi')
  stessaLista('due abilità si scambiano di posto', caselleDella(metti(due, 0, 'rovi')), ['rovi', 'dardo-avvelenato', null])
  const r = rileggiCrescita({ esp: sogliaDi(3), albero: { 'dardo-avvelenato': 3, fendente: 1, 'primo-tiro': 2, ciao: 1 },
                              caselle: ['fendente', 'primo-tiro', 'dardo-avvelenato'] }, 'elfa')
  controlla('rileggendo: via i nodi di altri e quelli oltre i punti', r.albero['dardo-avvelenato'] === 2 && !r.albero.fendente &&
            !r.albero['primo-tiro'] && !r.albero.ciao, JSON.stringify(r.albero))
  stessaLista('e le caselle tengono solo le abilità imparate', r.caselle, [null, null, 'dardo-avvelenato'])
}

/* ══════════ 2b. le righe da due nodi: una scelta ══════════ */
{
  // la riga si apre quando si è imparato almeno un nodo della riga sopra: uno qualunque dei due
  let cr = { esp: sogliaDi(12), albero: {}, caselle: [] }
  cr = impara(impara(cr, 'cavaliere', 'fendente'), 'cavaliere', 'filo')
  controlla('prima il Taglio profondo e la Spazzata sono pronti entrambi', !perchéNonImpari(cr, 'cavaliere', 'taglio-profondo') && !perchéNonImpari(cr, 'cavaliere', 'spazzata'))
  controlla('ma l\'Affondo (due righe più giù) vuole l\'una o l\'altra', /prima Taglio profondo o Spazzata/.test(perchéNonImpari(cr, 'cavaliere', 'affondo')), perchéNonImpari(cr, 'cavaliere', 'affondo'))
  const una = impara(cr, 'cavaliere', 'spazzata')
  controlla('una sola basta: dopo la Spazzata l\'Affondo e il Mulinello si aprono', !perchéNonImpari(una, 'cavaliere', 'affondo') && !perchéNonImpari(una, 'cavaliere', 'mulinello'))
  const due = impara(una, 'cavaliere', 'taglio-profondo')
  controlla('e si possono prendere tutte e due, coi punti', due && due.albero.spazzata === 1 && due.albero['taglio-profondo'] === 1)
  uguale('costano un punto l\'una', puntiAbilita(cr) - puntiAbilita(due), 2)
  controlla('il Colpo del campione vuole una delle due righe da due: l\'Affondo o il Mulinello', /prima Affondo o Mulinello/.test(perchéNonImpari(due, 'cavaliere', 'turbine')))
  controlla('una passiva e un\'abilità nella stessa riga si scelgono uguale', RAMI.cavaliere[1].nodi.filter(x => x.riga === 2).some(x => x.sempre) &&
            RAMI.cavaliere[1].nodi.filter(x => x.riga === 2).some(x => !x.sempre))
  // i livelli: la riga nuova si apre al 6
  controlla('la riga nuova vuole il livello 6', /dal livello 6/.test(perchéNonImpari({ esp: sogliaDi(5), albero: { fendente: 1, filo: 1 }, caselle: [] }, 'cavaliere', 'spazzata')))
  // un nodo di un'altra classe si rifiuta, anche se il suo posto sarebbe aperto
  controlla('il Raggio di luna è dell\'elfa', !!perchéNonImpari(cr, 'cavaliere', 'raggio-di-luna'))
}

/* ══════════ 3. l'energia ══════════ */
{
  const { c, m } = scontro('cavaliere', conAlbero(3, { fendente: 1 }), 'spada')
  uguale('si scende con l\'energia piena', c.energia, c.energiaMax)
  c.energia = 4
  c.rispondi(false)
  uguale('sbagliare non la toglie e non la dà', c.energia, 4)
  c.rispondi(true)
  uguale('una risposta giusta sola non basta a fare un punto', c.energia, 4)
  c.rispondi(true)
  uguale('ogni due risposte giuste, un punto', c.energia, 5)
  m.ossa = -1; c.chiudi()
  const fonte = { che: 'fonte', x: 1, y: 1 }
  c.energia = 0; c.vita = 1
  c.foglio = { che: 'fonte', chi: fonte }
  c.rispondi(true)
  uguale('la fonte la riempie', c.energia, c.energiaMax)
  controlla('e cura come sempre', c.vita === 1 + SORSO)
  c.energia = 0
  c.zaino = ['pozione-blu']
  c.usa(0)
  controlla('la pozione blu ne dà otto', c.energia === 8 && !c.zaino.length)
}

/* ══════════ 4. lo scontro ══════════ */
{
  // il colpo doppio, e l'abilità che sbagliando resta pronta senza costare
  let { c, m } = scontro('cavaliere', conAlbero(3, { fendente: 1 }), 'spada')
  const solito = c.colpo(m)
  controlla('si prepara', c.prepara('fendente') && c.pronta === 'fendente')
  c.rispondi(false)
  controlla('sbagliando resta pronta e non costa', c.pronta === 'fendente' && c.energia === c.energiaMax)
  const ossa = m.ossa
  const e = c.rispondi(true)
  controlla('rispondendo giusto parte: il doppio', e.usata && e.usata.id === 'fendente' && ossa - m.ossa === solito * 2, `${ossa - m.ossa} contro ${solito}`)
  uguale('e costa la sua energia', c.energia, c.energiaMax - NODI.fendente.costo)
  controlla('dopo, torna il colpo solito', c.pronta === null)
  c.energia = 1
  controlla('senza energia non si prepara', !c.prepara('fendente') && /energia/.test(c.perchéNonUsi('fendente')))

  // senza l'arma del ramo, la casella si spegne e dice perché
  ;({ c, m } = scontro('elfa', conAlbero(3, { 'dardo-avvelenato': 1 }), 'spada'))
  controlla('senza arco il dardo non parte', !c.prepara('dardo-avvelenato') && /arco/.test(c.perchéNonUsi('dardo-avvelenato')))

  // il veleno brucia al turno del mostro avvelenato, anche se l'eroe sbaglia: tre turni, il primo già bruciato
  ;({ c, m } = scontro('elfa', conAlbero(3, { 'dardo-avvelenato': 1 }), 'arco-corto'))
  c.prepara('dardo-avvelenato')
  const ossaIniziali = m.ossa
  const colpoDato = c.colpo(m, NODI['dardo-avvelenato'])
  c.rispondi(true)
  const v = m.stati.veleno
  controlla('avvelenato: ha già bruciato una volta, ne restano due', v && v.scambi === 2 && v.quanto >= 1 && ossaIniziali - m.ossa === colpoDato + v.quanto, JSON.stringify(m.stati))
  const prima = m.ossa
  const e2 = c.rispondi(false)
  controlla('sbagliando il veleno brucia lo stesso', prima - m.ossa === v.quanto && e2.veleno === v.quanto)
  c.rispondi(false)
  controlla('e dopo tre turni è finito', !m.stati.veleno, JSON.stringify(m.stati))

  // gelato colpisce a metà, stordito non colpisce neanche sbagliando
  ;({ c, m } = scontro('mago', conAlbero(4, { 'raggio-di-gelo': 1 }), 'verga'))
  const pieno = c.botta(m)
  c.prepara('raggio-di-gelo')
  c.rispondi(true)
  uguale('gelato: arriva la metà', c.botta(m), Math.floor(pieno / 2))
  controlla('la riga della scelta dice il danno vero', c.descrizione(NODI['raggio-di-gelo'], m).startsWith(`fai ${c.colpo(m, NODI['raggio-di-gelo'])} di danno`) && /metà danno per 2 turni/.test(c.descrizione(NODI['raggio-di-gelo'], m)), c.descrizione(NODI['raggio-di-gelo'], m))
  // lo scambio dice da dove viene il danno e cosa se lo è portato via (la riga dello scontro, viste/Scontro.vue)
  const eg = c.rispondi(false)
  controlla('col gelo lo scambio lo dice', eg.gelato === true && eg.preso === Math.floor(pieno / 2), JSON.stringify(eg))
  // un'abilità difensiva prende il posto dell'attacco: lo scudo arcano non fa danno, e non uccide
  {
  const { c: cs, m: ms } = scontro('mago', conAlbero(2, { 'scudo-arcano': 1 }), 'verga', null, { ossa: 3, ossaMax: 3, att: 1 })
  cs.prepara('scudo-arcano')
  const eScudo = cs.rispondi(true)
  controlla('lo scudo non colpisce: il mostro è ancora in piedi', ms.ossa === 3 && eScudo.dato === 0 && eScudo.che !== 'caduto', JSON.stringify(eScudo))
  controlla('ma lo scudo c\'è', (cs.foglio ? cs.foglio.io.scudo : 0) > 0)
}
  ;({ c, m } = scontro('nano', conAlbero(9, { spaccaroccia: 1, 'mani-pesanti': 1, stordisce: 1 }), 'ascia'))
  const vita = c.vita
  c.prepara('stordisce')
  c.rispondi(true)
  uguale('stordito: salta il suo turno', c.vita, vita)
  c.rispondi(false)
  controlla('e al turno dopo colpisce di nuovo', c.vita < vita, `${c.vita} contro ${vita}`)

  // la parata del cavaliere, con lo scudo in mano
  ;({ c, m } = scontro('cavaliere', conAlbero(4, { 'scudo-alzato': 1, parata: 1 }), 'spada', 'scudo-legno'))
  const g = c.botta(m)
  ;({ c, m } = scontro('cavaliere', conAlbero(4, { 'scudo-alzato': 1 }), 'spada', 'scudo-legno'))
  uguale('la Parata lima ogni colpo di uno', g, c.botta(m) - 1)
  c.prepara('scudo-alzato')
  const v2 = c.vita
  const mezzo = Math.ceil(c.danno(m) / 2)
  c.rispondi(true); c.rispondi(true)
  uguale('Scudo alzato: per due turni dell\'eroe i colpi presi fanno metà', v2 - c.vita, mezzo * 2)
  const v3 = c.vita
  c.rispondi(true)
  uguale('e al terzo no', v3 - c.vita, c.danno(m))

  // il Grido di guerra è `forma: 'tutti'`: lo stesso colpo e gli stessi effetti a tutti i mostri in campo
  {
    const c = new Corsa(CAMPAGNA[1], { seme: 5, eroe: 'cavaliere', rnd: seminato(5), crescita: conAlbero(12, { preghiera: 1, 'cuore-saldo': 1, grido: 1 }), roba: roba('spada') })
    const m = c.livello.robe.find(r => r.che === 'mostro')
    const stanza = c.livello.stanzaDi(m.x, m.y)
    const altro = c.livello.mostro(m.tipo, m.x, m.y)
    Object.assign(m, { ossa: 100, ossaMax: 100, att: 3, dif: 0, sveglio: true, velocita: c.velocita, stati: null })
    Object.assign(altro, { ossa: 100, ossaMax: 100, att: 3, dif: 0, sveglio: true, velocita: c.velocita, casa: { x: m.x, y: m.y } })
    c.livello.robe.push(altro)
    c.eroe = { x: m.x + 1.5, y: m.y + 0.5 }
    c.scontro(m, { tocco: true })
    uguale('in campo sono due', c.foglio.campo.length, 2)
    c.prepara('grido')
    controlla('la scelta prepara entrambi', c.foglio.colpiti.length === 2, String(c.foglio.colpiti.length))
    const e3 = c.rispondi(true)
    controlla('Grido di guerra: colpito anche l\'altro', altro.ossa < 100 && e3.colpiti === 1, `${altro.ossa}`)
    controlla('e anche l\'altro colpisce a metà', altro.stati && altro.stati.debole >= 0 && (m.stati.debole > 0 || altro.stati.debole > 0))
    void stanza
  }

  // il primo tiro con l'arco: l'elfa agisce per prima in ogni scontro, prima anche della fila, e il primo colpo ha il suo bonus
  {
    const bonus = conAlbero(12, { 'dardo-avvelenato': 1, 'primo-tiro': 2 })
    const senza = conAlbero(12, { 'dardo-avvelenato': 1 })
    ;({ c, m } = scontro('elfa', senza, 'arco-corto', null, { velocita: 30 }))
    controlla('senza il primo tiro, un mostro velocissimo ha già colpito', c.foglio.apertura.length > 0 && c.vita < c.vitaMax)
    ;({ c, m } = scontro('elfa', bonus, 'arco-corto', null, { velocita: 30 }))
    controlla('con il primo tiro l\'elfa agisce prima della fila', c.foglio.apertura.length === 0 && c.vita === c.vitaMax)
    const solito = c.colpo(m)
    const prima = m.ossa
    const e4 = c.rispondi(true)
    controlla('e il primo colpo ha il suo bonus (+25%)', e4.primoTiro && prima - m.ossa === Math.round(solito * 1.25), `${prima - m.ossa} contro ${solito}`)
    const dopo = m.ossa
    c.rispondi(true)
    uguale('il secondo è il colpo solito', dopo - m.ossa, solito)
  }

  // Radici: il mostro bloccato non attacca e subisce di più finché resta fermo
  ;({ c, m } = scontro('elfa', conAlbero(12, { 'dardo-avvelenato': 1, radici: 1 }), 'arco-corto', null, { ossa: 500, ossaMax: 500, att: 9 }))
  const colpoPrima = c.colpo(m)
  c.prepara('radici')
  const eR = c.rispondi(true)
  controlla('Radici: il mostro è bloccato e esposto', m.stati.esposto && m.stati.esposto.piu === 50 && eR.preso === 0 && m.stati.fermo === 2, JSON.stringify(m.stati))
  controlla('e subisce di più mentre dura', c.colpo(m) > colpoPrima, `${colpoPrima} → ${c.colpo(m)}`)
  for (let i = 0; i < 5; i++) c.rispondi(true)
  controlla('poi le radici cedono', !(m.stati.esposto && m.stati.esposto.scambi > 0))

  // l'ultimo gradino: molto di più contro un capo, normale contro uno qualunque
  ;({ c, m } = scontro('mago', conAlbero(12, { 'dardo-di-fuoco': 1, 'palla-di-fuoco': 1 }), 'verga'))
  const normale = c.colpo(m, NODI['palla-di-fuoco'])
  const capo = { ...m, grosso: 'ossuto' }
  controlla('Meteora: contro un grosso vale più del doppio di un mostro comune', c.èCapo(capo) && c.colpo(capo, NODI['palla-di-fuoco']) >= normale * 1.7, `${normale} contro ${c.colpo(capo, NODI['palla-di-fuoco'])}`)
  controlla('e non è più un\'area', !NODI['palla-di-fuoco'].stanza)

  // l'ultimo fiato: una volta per discesa
  ;({ c, m } = scontro('cavaliere', conAlbero(12, { preghiera: 1, 'cuore-saldo': 1, grido: 1, 'ultimo-fiato': 1 }), 'spada'))
  c.vita = 1
  c.rispondi(false)
  controlla('Ultimo fiato: invece di svenire resta a 1', c.vita === 1 && c.foglio && c.foglio.che === 'scontro' && c.fiatoUsato)
  c.rispondi(false)
  controlla('la seconda volta si sviene', c.foglio && c.foglio.che === 'svenuto')

  // la passiva del ramo è solo una percentuale (il 30% al primo grado), l'attiva con `passa` ignora metà della difesa
  // (l'utente, 12 ottobre: «ignora la difesa» valeva il doppio o più, in base al mostro)
  const dif = { ossa: 500, ossaMax: 500, att: 9, dif: 4 }
  {
    const { c: c0, m: m0 } = scontro('mago', conAlbero(12, { 'dardo-di-fuoco': 1 }), 'verga', null, dif)
    const { c: c1, m: m1 } = scontro('mago', conAlbero(12, { 'dardo-di-fuoco': 1, 'fiamma-viva': 1 }), 'verga', null, dif)
    const senza = c0.colpo(m0, NODI['dardo-di-fuoco'])
    controlla('Fiamma viva al primo grado: il colpo del ramo vale 1,3 volte, la difesa conta ancora',
      NODI['fiamma-viva'].rami.passa === undefined && c1.colpo(m1, NODI['dardo-di-fuoco']) === Math.round(Math.round((c0.att - 4) * 1.3) * 2.0),
      `${senza} → ${c1.colpo(m1, NODI['dardo-di-fuoco'])}`)
    controlla('e la riga lo dice', NODI['fiamma-viva'].fa(1) === 'il fuoco fa il 30% di danno in più' && NODI['perforante'].rami.passa === undefined && NODI['perforante'].fa(3) === 'i quadrelli fanno il 50% di danno in più')
    controlla('fuori dal ramo la passiva non c\'è', c1.colpo(m1) === c0.colpo(m0))
  }
  {
    const { c: ca, m: ma } = scontro('mago', conAlbero(12, { fulmine: 1 }), 'verga', null, dif)
    const nodo = NODI.fulmine
    uguale('Fulmine ignora metà della difesa: att − dif/2, per 2,5', ca.colpo(ma, nodo), Math.round(Math.round(ca.att - 4 / 2) * 2.5))
    uguale('e Stoccata ha lo stesso valore di campo', NODI.stoccata.passa, 0.5)
    controlla('lo scontro e la riga lo dicono', /ignora metà della sua difesa/.test(ca.descrizione(nodo, ma)) && /metà della difesa/.test(nodo.fa(1)), ca.descrizione(nodo, ma))
    ma.stati = { rotto: true }
    uguale('un mostro rotto non ha difesa del tutto', ca.colpo(ma, nodo), Math.round(ca.att * 2.5))
  }

  // la sosta tiene l'energia
  ;({ c } = scontro('cavaliere', conAlbero(3, { fendente: 1 }), 'spada'))
  c.chiudi()
  c.energia = 3
  const dato = scrivi(c, 1)
  const r = leggi(dato, CAMPAGNA[1], roba('spada'), [], conAlbero(3, { fendente: 1 }))
  uguale('riprendendo l\'energia è quella di prima', r && r.energia, 3)
}

riassunto('l\'albero delle abilità')
