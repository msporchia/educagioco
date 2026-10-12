/* Verifica del motore dell'arena, senza browser: i dati stanno in piedi, la
   partita è identica a parità di seme, le scelte costano quello che dicono e
   non si fanno senza monete, e le regole che distinguono le truppe (chi vola,
   chi non colpisce chi vola, il muro) valgono davvero.
   `node test/esegui.mjs arena`
   tempo: 5 */
import { guastiDelleRegole, TRUPPE, CAMPO, BASE } from '../../src/giochi/arena/dati/regole.js'
import { Partita } from '../../src/giochi/arena/motore/partita.js'
import { caso, gioca } from '../../src/giochi/arena/motore/banco.js'
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, guastiDellaCampagna, operazioniDi, operazionePer, stellePer, sfidaDi }
  from '../../src/giochi/arena/dati/campagna.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/giochi/arena/motore/sosta.js'
import { firmaEquilibrio } from '../../src/giochi/arena/motore/firma.js'
import { FIRMA, NEMICO } from '../../src/giochi/arena/dati/taratura.js'
import { guastiDelleFigure } from '../../src/giochi/arena/scena/figure.js'
import manifesto from '../../src/giochi/arena/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati ══════════ */
const guasti = guastiDelleRegole()
controlla('i dati delle regole non hanno guasti', guasti.length === 0, guasti.join(' · '))

/* ══════════ 2. la partita è determinata dal seme ══════════ */
const uguali = gioca({ seme: 7 }), uguali2 = gioca({ seme: 7 })
controlla('stesso seme, stessa partita', JSON.stringify(uguali) === JSON.stringify(uguali2))

/* ══════════ 3. le scelte ══════════ */
{
  const p = new Partita({ rnd: caso(1) })
  uguale('si parte con una caserma sola, quella di base', p.casermeDi('io').map(c => c.id).join(), BASE)
  uguale('e con un muro per parte', p.muri.length, 2)
  controlla('il castello spara da solo dal primo secondo: ha vita, danno e una gittata che copre il muro',
            p.castello('io').hp > 0 && p.castello('io').y - p.muro('io').y < 150)
  uguale('le monete di partenza', p.lati.io.monete, 14)
  uguale('costruire i lupi costa 8', p.prezzo('io', 'costruisci', 'lupi'), 8)
  controlla('non si può costruire la caserma che c\'è già', p.prezzo('io', 'costruisci', BASE) === null)
  p.lati.io.monete = 0
  controlla('senza monete non si fa niente', !p.fai('io', 'costruisci', 'lupi') && p.casermeDi('io').length === 1)
  p.lati.io.monete = 20
  controlla('con le monete si costruisce', p.fai('io', 'costruisci', 'lupi'))
  uguale('e si pagano', p.lati.io.monete, 12)
  uguale('la caserma nuova c\'è', p.casermeDi('io').length, 2)
  const nuova = p.casermeDi('io').find(c => c.id === 'lupi')
  controlla('sta sulla metà del giocatore', nuova.y > CAMPO.fiume.basso)
  const sopra = new Partita({ rnd: caso(1) }).casermeDi('nem')[0]
  controlla('quella del nemico è specchiata', sopra.y < CAMPO.fiume.alto)
  p.lati.io.monete = 100
  p.fai('io', 'potenzia', 'lupi')
  uguale('una caserma sale di livello', nuova.liv, 2)
  p.fai('io', 'miniera')
  uguale('la miniera sale', p.lati.io.miniera, 2)
  controlla('e rende di più al secondo', p.alSecondo('io') > p.alSecondo('nem') * 0 + 0.83 * 1.29)
  controlla('il muro non si costruisce: non c\'è nemmeno la scelta', p.prezzo('io', 'muro') === null)
  uguale('il castello sale come le caserme', p.fai('io', 'castello') && p.castello('io').liv, 2)
  p.muro('io').hp = 0
  controlla('un muro crollato si ricostruisce riparando', p.riparabili('io').includes(p.muro('io')) && p.fai('io', 'ripara') && p.muro('io').hp > 0)
  p.sbagliata('io', 'lupi')
  controlla('un calcolo sbagliato ferma la caserma', p.inRiposo('io', 'lupi'))
  controlla('ma non toglie monete', p.lati.io.monete > 50)
}

/* ══════════ 4. le truppe ══════════ */
{
  const prova = (ids, contro, secondi) => {
    const p = new Partita({ rnd: caso(3) })
    p.muri = []; p.caserme = []
    for (const c of p.castelli) c.hp = c.max = 1e6              // un campo vuoto: solo truppe, e i castelli non cadono
    for (const id of ids) p.schiera('io', id, 180, 300)
    for (const id of contro) p.schiera('nem', id, 180, 230)
    p.avanza(secondi)
    return p
  }
  // chi vola non è colpito da chi cammina e colpisce solo da vicino
  const pip = prova(['guardiano'], ['pipistrelli'], 8)
  controlla('un guardiano non ferisce i pipistrelli', pip.unita.filter(u => u.id === 'pipistrelli').every(u => u.hp === u.max))
  const arc = prova(['scheletri'], ['pipistrelli'], 3)
  const feriti = arc.unita.filter(u => u.id === 'pipistrelli')
  controlla('gli arcieri invece li colpiscono', feriti.length < 3 || feriti.some(u => u.hp < u.max))
  // il golem va alle costruzioni e ignora le truppe
  const g = new Partita({ rnd: caso(4) })
  g.schiera('nem', 'golem', 180, 100)
  g.schiera('io', 'guardiano', 180, 140)
  g.avanza(3)
  const golem = g.unita.find(u => u.id === 'golem')
  controlla('il golem non ferma per le truppe', golem.y > 100 + 20)
  // il muro ferma chi cammina e non chi vola
  const m = new Partita({ rnd: caso(5) })
  m.caserme = []
  m.schiera('nem', 'lupi', 180, 230)
  m.schiera('nem', 'pipistrelli', 180, 230)
  m.avanza(4)
  const muro = m.muro('io')
  controlla('i lupi si fermano al muro e lo colpiscono', muro.hp > 0 && muro.hp < muro.max)
  const lupi = m.unita.filter(u => u.id === 'lupi')
  controlla('e non l\'hanno ancora passato', lupi.length > 0 && lupi.every(u => u.y < muro.y))
  const volanti = m.unita.filter(u => u.id === 'pipistrelli')
  controlla('i pipistrelli invece lo scavalcano', volanti.length > 0 && volanti.every(u => u.y > muro.y))
}

/* ══════════ 5. una partita finisce, e senza fare niente si perde ══════════ */
{
  const p = new Partita({ rnd: caso(9) })
  p.avanza(400)
  controlla('una partita finisce', p.fine !== null)
  uguale('chi non fa niente perde', p.fine, 'perso')
  controlla('ma ha respirato qualche decina di secondi', p.t > 30, `solo ${p.t.toFixed(0)}`)
}

/* ══════════ 6. la campagna ══════════ */
{
  const g = guastiDellaCampagna()
  controlla('la campagna non ha guasti', g.length === 0, g.join(' · '))
  uguale('dodici tappe', QUANTE_TAPPE, 12)
  controlla('la prima tappa è di sole somme', operazioniDi(CAMPAGNA[0]).join() === '+')
  controlla('la palude porta le moltiplicazioni', operazioniDi(CAMPAGNA[3]).includes('×'))
  controlla('la neve porta le divisioni', operazioniDi(CAMPAGNA[6]).includes('÷'))
  uguale('un\'azione che vuole ÷ in una tappa di somme ripiega su +', operazionePer('÷', ['+']), '+')
  uguale('e in una di somme e sottrazioni su −', operazionePer('÷', ['+', '−']), '−')
  uguale('un\'operazione ammessa resta quella', operazionePer('×', ['+', '−', '×']), '×')
  uguale('vincere dà una stella', stellePer({ vinto: true, vitaBase: 0.2 }), 1)
  uguale('col castello oltre la metà due', stellePer({ vinto: true, vitaBase: 0.6 }), 2)
  uguale('col castello quasi intatto tre', stellePer({ vinto: true, vitaBase: 0.9 }), 3)
  uguale('perdere zero', stellePer({ vinto: false, vitaBase: 0.9 }), 0)
  const gg = guastiDelleFigure()
  controlla('le figure delle truppe esistono', gg.length === 0, gg.join(' · '))
  const ga = guastiDellAlbo([manifesto])
  controlla('il manifesto e il suo albo stanno in piedi', ga.length === 0, ga.join(' · '))
  for (const t of CAMPAGNA) {
    const p = new Partita({ rnd: caso(2), sfida: sfidaDi(t) })
    p.avanza(5)
    controlla(`${t.chiave}: parte e gira`, !p.fine && p.casermeDi('io').length === 1)
  }
}

/* ══════════ 7. la sosta ══════════ */
{
  const tappa = 4
  const p = new Partita({ rnd: caso(11), sfida: sfidaDi(CAMPAGNA[tappa]) })
  p.lati.io.monete = 200
  p.fai('io', 'costruisci', 'lupi'); p.fai('io', 'miniera'); p.fai('io', 'castello')
  p.avanza(40)
  const dato = scrivi(p, tappa)
  controlla('una partita in corso si salva', dato && dato.v === VERSIONE)
  const letto = leggi(JSON.parse(JSON.stringify(dato)), { rnd: caso(1) })
  controlla('e si rilegge', letto && letto.indice === tappa)
  const q = letto.partita
  uguale('stesse monete', Math.round(q.lati.io.monete), Math.round(p.lati.io.monete))
  uguale('stessa miniera', q.lati.io.miniera, p.lati.io.miniera)
  uguale('stesse caserme', q.casermeDi('io').map(c => c.id + c.liv).sort().join(), p.casermeDi('io').map(c => c.id + c.liv).sort().join())
  uguale('stesso castello', q.castello('io').liv, p.castello('io').liv)
  uguale('stesse truppe in campo', q.unita.length, p.unita.length)
  q.avanza(5)
  controlla('la partita ripresa continua', q.t > p.t)
  uguale('niente da salvare a partita appena cominciata', scrivi(new Partita({ rnd: caso(1) }), 0), null)
  const rotto = JSON.parse(JSON.stringify(dato)); rotto.caserme[0].id = 'inesistente'
  uguale('un salvataggio storto si butta', leggi(rotto), null)
  const vecchio = { ...JSON.parse(JSON.stringify(dato)), v: VERSIONE + 1 }
  uguale('e uno di un\'altra versione pure', leggi(vecchio), null)
  controlla('la carta della mappa dice dove si era', dice(dato) && dice(dato).nome === CAMPAGNA[tappa].nome)
}

/* ══════════ 8. la taratura è fresca ══════════ */
controlla('la taratura è fresca: se questo è rosso, rilancia `npm run tara:arena`',
          FIRMA === firmaEquilibrio(), `la firma è ${firmaEquilibrio()}, la taratura ha ${FIRMA}`)
controlla('ogni tappa ha la sua scheda del nemico', CAMPAGNA.every(t => NEMICO[t.chiave] && t.nemico === NEMICO[t.chiave]))

riassunto('arena (motore)')
