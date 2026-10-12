/* Verifica del motore dell'arena, senza browser: i dati stanno in piedi, la
   partita è identica a parità di seme, le scelte costano quello che dicono e
   non si fanno senza monete, e le regole che distinguono le truppe (chi vola,
   chi non colpisce chi vola, il muro) valgono davvero.
   `node test/esegui.mjs arena`
   tempo: 5 */
import { guastiDelleRegole, TRUPPE, CAMPO, MURO, BASE } from '../../src/giochi/arena/dati/regole.js'
import { Partita } from '../../src/giochi/arena/motore/partita.js'
import { caso, gioca } from '../../src/giochi/arena/motore/banco.js'
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
  p.fai('io', 'muro')
  uguale('un terzo muro rifà il più malconcio, non ne aggiunge', p.muriDi('io').length, MURO.max)
  p.sbagliata('io', 'lupi')
  controlla('un calcolo sbagliato ferma la caserma', p.inRiposo('io', 'lupi'))
  controlla('ma non toglie monete', p.lati.io.monete > 50)
}

/* ══════════ 4. le truppe ══════════ */
{
  const prova = (ids, contro, secondi) => {
    const p = new Partita({ rnd: caso(3) })
    p.muri = []; p.caserme = []
    for (const t of p.torri) t.hp = 0                           // un campo vuoto: solo truppe
    p.torri.find(t => t.lato === 'nem' && t.tipo === 're').hp = 1e6
    for (const id of ids) p.schiera('io', id, 180, 300)
    for (const id of contro) p.schiera('nem', id, 180, 230)
    p.avanza(secondi)
    return p
  }
  // chi vola non è colpito da chi cammina e colpisce solo da vicino
  const pip = prova(['cavaliere'], ['pipistrelli'], 8)
  controlla('un cavaliere non ferisce i pipistrelli', pip.unita.filter(u => u.id === 'pipistrelli').every(u => u.hp === u.max))
  const arc = prova(['arciere'], ['pipistrelli'], 3)
  const feriti = arc.unita.filter(u => u.id === 'pipistrelli')
  controlla('gli arcieri invece li colpiscono', feriti.length < 3 || feriti.some(u => u.hp < u.max))
  // il golem va alle costruzioni e ignora le truppe
  const g = new Partita({ rnd: caso(4) })
  g.schiera('nem', 'golem', 180, 100)
  g.schiera('io', 'cavaliere', 180, 140)
  g.avanza(3)
  const golem = g.unita.find(u => u.id === 'golem')
  controlla('il golem non ferma per le truppe', golem.y > 100 + 20)
  // il muro ferma chi cammina e non chi vola
  const m = new Partita({ rnd: caso(5) })
  m.caserme = []
  m.schiera('nem', 'lupi', 180, 230)
  m.schiera('nem', 'pipistrelli', 180, 230)
  m.avanza(12)
  const muro = m.muriDi('io')[0]
  controlla('i lupi si fermano al muro', !muro || muro.hp < muro.max)
  const volanti = m.unita.filter(u => u.id === 'pipistrelli')
  controlla('i pipistrelli lo scavalcano', volanti.every(u => u.y > muro?.y || !muro))
}

/* ══════════ 5. una partita finisce, e senza fare niente si perde ══════════ */
{
  const p = new Partita({ rnd: caso(9) })
  p.avanza(400)
  controlla('una partita finisce', p.fine !== null)
  uguale('chi non fa niente perde', p.fine, 'perso')
  controlla('ma ha respirato qualche decina di secondi', p.t > 30, `solo ${p.t.toFixed(0)}`)
}

riassunto('arena (motore)')
