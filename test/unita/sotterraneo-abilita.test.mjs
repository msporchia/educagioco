/* L'albero delle abilità (docs/sotterraneo/abilita.md): i rami e i nodi stanno in piedi, i punti dell'albero e
   le loro regole (il gradino, il nodo sopra, il grado), le caselle dello scontro, l'energia che viene dalle
   risposte giuste, alla fonte e dalla pozione blu, e cosa fanno gli effetti nello scontro: il colpo doppio,
   l'abilità che sbagliando resta pronta, il veleno che brucia anche sbagliando, il mostro gelato e quello
   stordito, la parata, la stanza intera, il primo tiro con l'arco, l'ultimo fiato, l'energia nella sosta.
   `node test/esegui.mjs sotterraneo-abilita --niente-build` */
import { RAMI, NODI, ENERGIA, CASELLE_ABILITA, guastiDelleAbilita } from '../../src/giochi/sotterraneo/dati/abilita.js'
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

// uno scontro con un mostro fatto a mano: i conti si leggono senza il caso del bestiario
function scontro(eroe, crescita, mano = null, mancina = null, mostro = {}) {
  const c = new Corsa(CAMPAGNA[1], { seme: 5, eroe, rnd: seminato(5), crescita, roba: roba(mano, mancina) })
  const m = c.livello.robe.find(r => r.che === 'mostro')
  Object.assign(m, { ossa: 200, ossaMax: 200, att: 9, dif: 0, sveglio: true, stati: null }, mostro)
  c.scontro(m)
  return { c, m }
}

/* ══════════ 1. i rami stanno in piedi ══════════ */
{
  const g = guastiDelleAbilita()
  controlla('l\'albero sta in piedi', !g.length, g.join(' · '))
  for (const e of EROI) uguale(`${e.chiave}: tre rami`, (RAMI[e.chiave] || []).length, 3)
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
  controlla('il terzo vuole il suo livello', /dal livello 8/.test(perchéNonImpari(cr, 'elfa', 'freccia-mirata')))
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

  // il veleno brucia a ogni scambio, anche sbagliando
  ;({ c, m } = scontro('elfa', conAlbero(3, { 'dardo-avvelenato': 1 }), 'arco-corto'))
  c.prepara('dardo-avvelenato')
  c.rispondi(true)
  const v = m.stati.veleno
  controlla('avvelenato per tre scambi', v && v.scambi === 3 && v.quanto >= 1, JSON.stringify(m.stati))
  const prima = m.ossa
  const e2 = c.rispondi(false)
  controlla('sbagliando il veleno brucia lo stesso', prima - m.ossa === v.quanto && e2.veleno === v.quanto)

  // gelato colpisce a metà, stordito non colpisce neanche sbagliando
  ;({ c, m } = scontro('mago', conAlbero(4, { 'raggio-di-gelo': 1 }), 'verga'))
  const pieno = c.botta(m, false)
  c.prepara('raggio-di-gelo')
  c.rispondi(true)
  uguale('gelato: sbagliando arriva la metà', c.botta(m, false), Math.floor(pieno / 2))
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
  c.prepara('stordisce')
  c.rispondi(true)
  const vita = c.vita
  c.rispondi(false)
  uguale('stordito: anche sbagliando non colpisce', c.vita, vita)

  // la parata del cavaliere, con lo scudo in mano
  ;({ c, m } = scontro('cavaliere', conAlbero(4, { 'scudo-alzato': 1, parata: 1 }), 'spada', 'scudo-legno'))
  const g = c.graffio(m)
  ;({ c, m } = scontro('cavaliere', conAlbero(4, { 'scudo-alzato': 1 }), 'spada', 'scudo-legno'))
  uguale('la Parata lima ogni graffio di uno', g, c.graffio(m) - 1)
  c.prepara('scudo-alzato')
  const v2 = c.vita
  c.rispondi(true); c.rispondi(true)
  uguale('Scudo alzato: due scambi senza graffio', c.vita, v2)

  // la stanza intera: gli altri mostri svegli prendono lo stesso colpo
  ;({ c, m } = scontro('elfa', conAlbero(12, { 'dardo-avvelenato': 1, 'primo-tiro': 1, 'freccia-mirata': 1, pioggia: 1 }), 'arco-corto'))
  const stanza = c.livello.stanzaDi(Math.floor(c.eroe.x), Math.floor(c.eroe.y))
  const altro = { che: 'mostro', tipo: m.tipo, nome: 'altro', em: m.em, x: stanza.cx, y: stanza.cy, casa: { x: stanza.cx, y: stanza.cy },
                  ossa: 100, ossaMax: 100, att: 3, dif: 0, sveglio: true }
  m.casa = { x: stanza.cx, y: stanza.cy }
  c.livello.robe.push(altro)
  c.prepara('pioggia')
  const e3 = c.rispondi(true)
  controlla('Pioggia di frecce: colpito anche l\'altro', altro.ossa < 100 && e3.colpiti === 1, `${altro.ossa}`)
  controlla('il primo tiro con l\'arco: il mostro non risponde', e3.preso === 0)

  // l'ultimo fiato: una volta per discesa
  ;({ c, m } = scontro('cavaliere', conAlbero(12, { preghiera: 1, 'cuore-saldo': 1, grido: 1, 'ultimo-fiato': 1 }), 'spada'))
  c.vita = 1
  c.rispondi(false)
  controlla('Ultimo fiato: invece di svenire resta a 1', c.vita === 1 && c.foglio && c.foglio.che === 'scontro' && c.fiatoUsato)
  c.rispondi(false)
  controlla('la seconda volta si sviene', c.foglio && c.foglio.che === 'svenuto')

  // la sosta tiene l'energia
  ;({ c } = scontro('cavaliere', conAlbero(3, { fendente: 1 }), 'spada'))
  c.chiudi()
  c.energia = 3
  const dato = scrivi(c, 1)
  const r = leggi(dato, CAMPAGNA[1], roba('spada'), [], conAlbero(3, { fendente: 1 }))
  uguale('riprendendo l\'energia è quella di prima', r && r.energia, 3)
}

riassunto('l\'albero delle abilità')
