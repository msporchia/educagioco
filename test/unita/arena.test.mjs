/* Verifica del motore dell'arena, senza browser: i dati stanno in piedi, la
   partita è identica a parità di seme, le scelte costano quello che dicono e
   non si fanno senza monete, e le regole che distinguono le truppe (chi vola,
   chi non colpisce chi vola, il muro) valgono davvero.
   `node test/esegui.mjs arena`
   tempo: 5 */
import { guastiDelleRegole, TRUPPE, EDIFICI, CAMPO, CRESCITA, BOMBA, CASTELLO, MURO, SQUADRA_MAX, TERRENI, ESCLUSIVE, TRUPPE_DEL_TERRENO, truppeDelTerreno } from '../../src/giochi/arena/dati/regole.js'
import { GIOCATORE } from '../../src/giochi/arena/dati/regole.js'
import { Partita } from '../../src/giochi/arena/motore/partita.js'
import { caso, gioca } from '../../src/giochi/arena/motore/banco.js'
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, INFINITA, scalinoDi, guastiDellaCampagna, operazioniDi, operazionePer, senzaSaperi, stellePer, sfidaDi, sfidaInfinita, terrenoDiverso, LIVELLI, livelloValido }
  from '../../src/giochi/arena/dati/campagna.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/giochi/arena/motore/sosta.js'
import { firmaEquilibrio } from '../../src/giochi/arena/motore/firma.js'
import { FIRMA, NEMICO, NEMICO_PER_LIVELLO } from '../../src/giochi/arena/dati/taratura.js'
import { guastiDeiDettagli, dettaglioTruppa, dettaglioAzione, ruoloDi } from '../../src/giochi/arena/motore/dettagli.js'
import { guastiDelleFigure } from '../../src/giochi/arena/scena/figure.js'
import manifesto from '../../src/giochi/arena/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { GRADO_A_MENTE, PARTENZA_MAX, partenza, basi, gradoDi, dopoLaRisposta, gradoDelleTabelline, gradoDellEta }
  from '../../src/giochi/arena/bravura.js'
import { calcoliTabellina } from '../../src/data/tabelline.js'
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
  uguale('si parte senza caserme: la prima mossa è la cripta', p.casermeDi('io').length, 0)
  uguale('e con un muro per parte, la porta in fondo al ponte', p.muri.length, 2)
  controlla('il castello spara da solo dal primo secondo: ha vita, danno e una gittata che copre la porta',
            p.castello('io').hp > 0 && p.castello('io').y - p.muro('io').y < CASTELLO.gitt)
  uguale('le monete di partenza', p.lati.io.monete, 14)
  uguale('le due truppe di un edificio costano uguale', `${p.prezzo('io', 'costruisci', 'scheletri')}/${p.prezzo('io', 'costruisci', 'guardiano')}`, '6/6')
  p.lati.io.monete = 0
  controlla('senza monete non si fa niente', !p.fai('io', 'costruisci', 'guardiano') && p.casermeDi('io').length === 0)
  p.lati.io.monete = 20
  controlla('con le monete si costruisce la cripta, scegliendo gli opliti', p.fai('io', 'costruisci', 'guardiano'))
  uguale('e si pagano', p.lati.io.monete, 14)
  const cripta = p.casermeDi('io')[0]
  uguale('la cripta fa opliti', `${cripta.ed}/${cripta.id}`, 'cripta/guardiano')
  controlla('le piazzole sono libere: anche una seconda cripta, di arcieri', p.prezzo('io', 'costruisci', 'scheletri') === 6)
  controlla('sta su uno dei posti fissi, fra la porta del ponte e il castello', cripta.y > p.muro('io').y && cripta.y < p.castello('io').y)
  const libera = p.postiLiberi('io')[0]
  controlla('si costruisce sulla piazzola che si sceglie', p.fai('io', 'costruisci', 'lupi', libera) && p.casermaIn('io', libera).id === 'lupi')
  const tana = p.casermaIn('io', libera)
  const sopra = new Partita({ rnd: caso(1) })
  sopra.lati.nem.monete = 20; sopra.fai('nem', 'costruisci', 'scheletri')
  controlla('quella del nemico è specchiata', sopra.casermeDi('nem')[0].y < CAMPO.fiume.alto)
  p.lati.io.monete = 100
  p.fai('io', 'potenzia', libera)
  uguale('una caserma sale di livello', tana.liv, 2)
  uguale('e la vita in più arriva subito: non resta ferita', tana.hp, tana.max)
  controlla('una seconda caserma uguale parte dal livello 1', p.fai('io', 'costruisci', 'lupi') && p.casermeDi('io').filter(c => c.id === 'lupi').map(c => c.liv).sort().join() === '1,2')
  // vendere: metà di quello che ci si è speso, e la piazzola torna libera
  const prima = p.lati.io.monete, spesa = tana.spesa
  uguale('la spesa conta costruzione e potenziamenti', spesa, 8 + 8)
  controlla('si vende', p.fai('io', 'vendi', libera))
  uguale('e ridà metà della spesa', p.lati.io.monete - prima, spesa / 2)
  controlla('la piazzola torna libera', !p.casermaIn('io', libera) && p.postiLiberi('io').includes(libera))
  tana.hp = 0
  const altra = p.casermeDi('io').find(c => c.id === 'lupi')
  altra.hp = 0
  p.avanza(0.1)
  controlla('crollata, la caserma sparisce e il posto torna libero', !p.casermeDi('io').some(c => c.id === 'lupi'))
  controlla('si rifà, anche con un\'altra truppa, dal livello 1', p.fai('io', 'costruisci', 'pipistrelli') && p.casermeDi('io').find(c => c.id === 'pipistrelli').liv === 1)
  // la miniera è un edificio su una piazzola: le monete salgono finché sta in piedi
  const prima2 = p.alSecondo('io')
  controlla('la miniera si costruisce su una piazzola', p.fai('io', 'costruisci', 'miniera') && p.miniereDi('io').length === 1)
  uguale('e il livello di miniera sale', p.lati.io.miniera, 2)
  controlla('e rende di più al secondo', p.alSecondo('io') > prima2 * 1.69)
  const mina = p.miniereDi('io')[0]
  controlla('si potenzia come una caserma', p.fai('io', 'potenzia', mina.posto) && mina.liv === 2 && p.lati.io.miniera === 3)
  controlla('il nemico la vede fra le cose da assediare', p.edificiContro({ lato: 'nem', vola: false }).includes(mina))
  mina.hp = 0
  p.avanza(0.1)
  uguale('abbattuta, le monete tornano quelle di prima', p.lati.io.miniera, 1)
  controlla('e la piazzola torna libera', !p.edificioIn('io', mina.posto))
  controlla('«più monete» in una mossa: la costruisce se non c\'è', p.fai('io', 'miniera') && p.miniereDi('io').length === 1)
  controlla('il muro non si costruisce: non c\'è nemmeno la scelta', p.prezzo('io', 'muro') === null)
  uguale('il castello sale come le caserme', p.fai('io', 'castello') && p.castello('io').liv, 2)
  p.muro('io').hp = 0
  controlla('una porta crollata si ricostruisce riparando', p.riparabili('io').includes(p.muro('io')) && p.fai('io', 'ripara') && p.muro('io').hp > 0)
  p.sbagliata('io', cripta.posto)
  controlla('un calcolo sbagliato ferma la caserma', p.inRiposo('io', cripta.posto))
  controlla('ma non toglie monete', p.lati.io.monete > 30)
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
  const pip = prova(['guardiano'], ['pipistrelli'], 3)     // prima che i pipistrelli arrivino a tiro del castello
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
  m.muoviCastello = () => {}          // qui conta il muro: il castello ad area spazzerebbe i pipistrelli prima
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

/* ══════════ 4b. si marcia lungo la corsia, e l'assedio ha un ordine ══════════ */
{
  const marcia = lato => {
    const p = new Partita({ rnd: caso(6) })
    p.muri = []; p.caserme = []
    for (const c of p.castelli) c.hp = c.max = 1e6
    p.schiera(lato, 'guardiano', 80, lato === 'io' ? 400 : 140)
    p.avanza(8)
    return p.unita.find(u => u.id === 'guardiano')
  }
  const mio = marcia('io'), suo = marcia('nem')
  controlla('una truppa nata al lato va verso la strada, non verso un lato', Math.abs(mio.x - 180) < Math.abs(80 - 180) && Math.abs(suo.x - 180) < 100)
  // chi cammina sfonda prima la porta, poi le caserme, e il castello per ultimo
  const q = new Partita({ rnd: caso(7) })
  q.lati.nem.monete = 50; q.fai('nem', 'costruisci', 'scheletri')
  const caserma = q.casermeDi('nem')[0], porta = q.muro('nem')
  const u = { lato: 'io', x: 180, y: 300, vola: false }
  uguale('chi cammina va prima alla porta', q.obiettivo(u), porta)
  porta.hp = 0
  uguale('crollata la porta, alle caserme', q.obiettivo(u), caserma)
  uguale('chi vola scavalca la porta ma va comunque prima alle caserme', q.obiettivo({ ...u, vola: true }), caserma)
  caserma.hp = 0; q.caserme = []
  uguale('e il castello per ultimo', q.obiettivo(u), q.castello('nem'))
  // nella propria metà si accorre ai nemici vicini al castello
  const d = new Partita({ rnd: caso(8) })
  d.muri = []; d.caserme = []
  for (const c of d.castelli) c.hp = c.max = 1e6
  d.schiera('io', 'guardiano', 60, 490)
  d.schiera('nem', 'golem', 240, 430)                              // il golem non si ferma per le truppe: resta lì vicino
  const golem = d.unita.find(x => x.id === 'golem')
  const difensore = d.unita.find(x => x.lato === 'io')
  const da = Math.hypot(difensore.x - golem.x, difensore.y - golem.y)
  d.avanza(2)
  controlla('chi è nella sua metà accorre al nemico sotto il castello, anche se è lontano',
            Math.hypot(difensore.x - golem.x, difensore.y - golem.y) < da - 40, `da ${da.toFixed(0)}`)
}

/* ══════════ 4c. la bomba, e gli omini che crescono ══════════ */
{
  const p = new Partita({ rnd: caso(3) })
  controlla('all\'inizio non c\'è nessuna bomba', p.lati.io.bombe === 0 && p.prezzo('io', 'bomba') === null)
  p.avanza(BOMBA.ogni + 1)
  uguale('ogni tot ne arriva una in regalo, a tutti e due', `${p.lati.io.bombe}/${p.lati.nem.bombe}`, '1/1')
  p.unita = []
  p.schiera('nem', 'scheletri', 180, 400); p.schiera('nem', 'guardiano', 190, 405); p.schiera('nem', 'lupi', 175, 410)   // nella metà di chi gioca
  const lontano = new Partita({ rnd: caso(9) })
  lontano.lati.io.bombe = 1; lontano.schiera('nem', 'guardiano', 180, 120, 30)
  controlla('è un\'arma difensiva: truppe nemiche ancora lontane, nella loro metà, non si bombardano', !lontano.puoFare('io', 'bomba'))
  const monete = p.lati.io.monete
  const nemici = p.unita.filter(u => u.lato === 'nem')
  controlla('ci sono truppe nemiche da colpire e la bomba non costa monete', nemici.length > 0 && p.prezzo('io', 'bomba') === 0)
  controlla('la bomba parte', p.fai('io', 'bomba'))
  uguale('e non costa monete', Math.round(p.lati.io.monete), Math.round(monete))
  uguale('ne resta zero', p.lati.io.bombe, 0)
  p.avanza(0.1)
  controlla('spazza le truppe che stavano insieme', p.unita.filter(u => u.lato === 'nem' && u.hp > 0 && Math.hypot(u.x - 180, u.y - 405) < 60).length === 0)
  p.avanza(BOMBA.ogni * 4)
  controlla('non se ne accumulano più di BOMBA.max', p.lati.io.bombe <= BOMBA.max)
  const q = new Partita({ rnd: caso(4) })
  q.lati.io.bombe = 1; q.unita = []
  controlla('senza truppe nemiche la bomba non si lancia', !q.puoFare('io', 'bomba'))

  const r = new Partita({ rnd: caso(5) })
  r.lati.io.monete = 20; r.fai('io', 'costruisci', 'scheletri')
  r.caserme[0].liv = 9; r.caserme[0].t = 0
  r.avanza(0.1)
  uguale('al livello 9 una squadra di arcieri ha tre omini in più', r.unita.filter(u => u.lato === 'io' && u.id === 'scheletri').length, TRUPPE.scheletri.n + 3)
  uguale('una truppa in più ogni tre livelli', [1, 2, 3, 5, 6, 9].map(l => CRESCITA.omini(l, 4)).join(), '0,0,1,1,2,3')
  uguale('fino al tetto, poi più niente', [30, 99].map(l => TRUPPE.scheletri.n + CRESCITA.omini(l, TRUPPE.scheletri.n)).join(), `${SQUADRA_MAX},${SQUADRA_MAX}`)
  // il bilancio: la potenza di una squadra (truppe × forza di una) sale sempre, senza buchi né salti brutali, e la forza di una truppa non scende
  for (const [id, k] of Object.entries(TRUPPE)) {
    let prec = null, fprec = 0
    for (let l = 1; l <= 40; l++) {
      const f = CRESCITA.forza(l, k.n), tot = (k.n + CRESCITA.omini(l, k.n)) * f
      controlla(`${id} liv ${l}: la forza di ogni truppa non scende`, f >= fprec - 1e-9)
      if (prec !== null) controlla(`${id} liv ${l}: la squadra sale, senza saltare più del doppio`, tot > prec && tot / prec < (k.n < 3 ? 2.1 : 1.6), `${prec.toFixed(2)} → ${tot.toFixed(2)}`)
      prec = tot; fprec = f
    }
  }
  controlla('il castello e il muro sono robusti (le partite non devono finire in un minuto)', CASTELLO.hp >= 4000 && MURO.hp >= 1000)
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
  controlla('la neve porta le divisioni', operazioniDi(CAMPAGNA[7]).includes('÷'))
  uguale('un\'azione che vuole ÷ in una tappa di somme ripiega su +', operazionePer('÷', ['+']), '+')
  uguale('e in una di somme e sottrazioni su −', operazionePer('÷', ['+', '−']), '−')
  uguale('un\'operazione ammessa resta quella', operazionePer('×', ['+', '−', '×']), '×')
  uguale('senza divisioni la neve non le chiede', senzaSaperi(operazioniDi(CAMPAGNA[7]), { div: false }).join(), '+,−,×')
  uguale('e un\'azione che vuole ÷ ripiega su ×', operazionePer('÷', senzaSaperi(operazioniDi(CAMPAGNA[7]), { div: false })), '×')
  uguale('senza né divisioni né moltiplicazioni ripiega su −', operazionePer('÷', senzaSaperi(operazioniDi(CAMPAGNA[7]), { div: false, mul: false })), '−')
  uguale('coi saperi accesi non cambia niente', senzaSaperi(['+', '÷']).join(), '+,÷')
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
    controlla(`${t.chiave}: parte e gira, e il nemico si è fatto la cripta`, !p.fine && p.casermeDi('nem').some(c => c.ed === 'cripta'))
  }
}

/* ══════════ 6b. la battaglia infinita ══════════ */
{
  uguale('i terreni sono quelli degli scalini', TERRENI.join(), SCALINI.map(s => s.vestito).join())
  const firma = { bosco: 'pipistrelli', palude: 'lupi', neve: 'golem', lava: 'diavoletto' }
  for (const terreno of TERRENI) {
    const ammesse = truppeDelTerreno(terreno)
    controlla(`${terreno}: c'è la truppa firma (${firma[terreno]}) e non quelle degli altri terreni`,
              ammesse.includes(firma[terreno]) && Object.entries(firma).every(([t, id]) => t === terreno || !ammesse.includes(id)))
    controlla(`${terreno}: le quattro truppe comuni ci sono sempre`, ['scheletri', 'guardiano', 'negromante', 'drago'].every(id => ammesse.includes(id)))
    controlla(`${terreno}: ogni edificio ha una truppa da costruire, la cripta compresa`,
              Object.values(EDIFICI).every(e => e.varianti.some(id => ammesse.includes(id))))
  }
  controlla('le bestie cornute sono della tana, e solo di neve e lava', EDIFICI.tana.varianti.includes('bestie') && ESCLUSIVE.bestie.join() === 'neve,lava' &&
            !TRUPPE_DEL_TERRENO.bosco.includes('bestie') && !TRUPPE_DEL_TERRENO.palude.includes('bestie'))
  controlla('la campagna segue il terreno: le truppe di ogni scalino sono tutte di quel terreno',
            CAMPAGNA.every(t => t.truppe.every(id => truppeDelTerreno(scalinoDi(t).vestito).includes(id))))
  controlla('palude: mummie sì, pipistrelli e golem no', CAMPAGNA[3].truppe.includes('lupi') && !CAMPAGNA[3].truppe.includes('pipistrelli') && !CAMPAGNA[4].truppe.includes('golem'))
  controlla('neve: bestie e golem, niente diavoletti né mummie', CAMPAGNA[7].truppe.includes('bestie') && CAMPAGNA[7].truppe.includes('golem') && !CAMPAGNA[7].truppe.includes('diavoletto') && !CAMPAGNA[7].truppe.includes('lupi'))
  controlla('lava: diavoletti e bestie, niente golem', CAMPAGNA[11].truppe.includes('diavoletto') && CAMPAGNA[11].truppe.includes('bestie') && !CAMPAGNA[11].truppe.includes('golem'))
  controlla('un\'operazione arriva solo con la truppa che la insegna: la ÷ col drago, alle nevi, non prima', operazioniDi(CAMPAGNA[6]).join() === '+,−,×' && operazioniDi(CAMPAGNA[7]).includes('÷') && CAMPAGNA.slice(0, 7).every(t => !operazioniDi(t).includes('÷')))
  controlla('le bestie hanno una figura, e non fanno la fiammata', guastiDelleFigure().length === 0)
  uguale('terreno diverso: mai lo stesso di fila', TERRENI.every(u => [0, 0.3, 0.6, 0.99].every(r => terrenoDiverso(u, () => r) !== u)), true)
  uguale('e senza ultimo ne dà uno vero', TERRENI.includes(terrenoDiverso(null, () => 0.5)), true)
  uguale('la battaglia infinita ha la scheda del nemico dell\'ultima tappa e nessun timer', `${INFINITA.nemico === NEMICO.trono}/${sfidaInfinita('neve').durata}`, 'true/Infinity')
  uguale('si apre alla portata dell\'ultima tappa', INFINITA.portata, CAMPAGNA[QUANTE_TAPPE - 1].portata)
  uguale('con tutte e quattro le operazioni', INFINITA.operazioni.join(), '+,−,×,÷')
  controlla('la battaglia infinita non ha record: il manifesto non dichiara una sfida senza fine', !manifesto.senzaFine)
  for (const terreno of TERRENI) {
    const p = new Partita({ rnd: caso(5), sfida: sfidaInfinita(terreno) })
    p.avanza(60)
    const ammesse = truppeDelTerreno(terreno)
    controlla(`${terreno}: senza timer (il tempo che resta non scende) e il nemico costruisce solo le truppe del terreno`,
              p.resto === Infinity && !p.fine && p.casermeDi('nem').length > 0 && p.casermeDi('nem').every(c => ammesse.includes(c.id)), p.casermeDi('nem').map(c => c.id).join())
    controlla(`${terreno}: chi gioca non può costruire quelle degli altri`, Object.keys(TRUPPE).every(id => (p.prezzo('io', 'costruisci', id) !== null) === ammesse.includes(id)))
  }
  // senza fare niente il castello cade: la battaglia finisce comunque, con un perso e mai con un pari
  const sola = new Partita({ rnd: caso(9), sfida: sfidaInfinita('lava') })
  for (let s = 0; s < 3000 && !sola.fine; s += 5) sola.avanza(5)
  controlla('chi sta fermo perde, e il tempo è quello resistito', sola.fine === 'perso' && sola.t > 20 && sola.t < 3000, `${sola.fine} ${Math.round(sola.t)}`)
  // le bestie in campo: camminano, colpiscono chi cammina e non chi vola
  const b = new Partita({ rnd: caso(3), sfida: sfidaInfinita('neve') })
  b.muri = []; b.caserme = []
  for (const c of b.castelli) c.hp = c.max = 1e6
  b.schiera('io', 'bestie', 180, 300); b.schiera('nem', 'pipistrelli', 180, 230)
  b.avanza(3)
  controlla('le bestie non feriscono i pipistrelli', b.unita.filter(u => u.id === 'pipistrelli').every(u => u.hp === u.max))
}

/* ══════════ 7. la sosta ══════════ */
{
  const tappa = 4
  const p = new Partita({ rnd: caso(11), sfida: sfidaDi(CAMPAGNA[tappa]) })
  p.lati.io.monete = 200
  p.fai('io', 'costruisci', 'scheletri'); p.fai('io', 'costruisci', 'lupi'); p.fai('io', 'costruisci', 'lupi')
  p.fai('io', 'potenzia', p.casermeDi('io').find(c => c.id === 'lupi').posto); p.fai('io', 'miniera'); p.fai('io', 'castello')
  p.avanza(40)
  const dato = scrivi(p, tappa)
  controlla('una partita in corso si salva', dato && dato.v === VERSIONE)
  const letto = leggi(JSON.parse(JSON.stringify(dato)), { rnd: caso(1) })
  controlla('e si rilegge', letto && letto.indice === tappa)
  const q = letto.partita
  uguale('stesse monete', Math.round(q.lati.io.monete), Math.round(p.lati.io.monete))
  uguale('stessa miniera', q.lati.io.miniera, p.lati.io.miniera)
  uguale('stesse caserme', q.casermeDi('io').map(c => c.id + c.liv).sort().join(), p.casermeDi('io').map(c => c.id + c.liv).sort().join())
  uguale('con la spesa di ognuna, per vendere', q.casermeDi('io').map(c => c.spesa).sort().join(), p.casermeDi('io').map(c => c.spesa).sort().join())
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
{
  // la battaglia infinita lasciata a metà: il terreno, le regole del terreno e il tempo che passa, non quello che resta
  const p = new Partita({ rnd: caso(21), sfida: sfidaInfinita('neve') })
  p.lati.io.monete = 100
  p.fai('io', 'costruisci', 'bestie'); p.fai('io', 'costruisci', 'golem')
  p.avanza(20)   // il nemico di oggi in un minuto abbatte le caserme di chi sta fermo: qui conta la sosta, non l'assedio
  const dato = scrivi(p, { infinita: 'neve' })
  controlla('si salva col suo terreno e senza il tempo che resta', dato && dato.chiave === 'infinita' && dato.terreno === 'neve' && dato.resto === 0)
  const letto = leggi(JSON.parse(JSON.stringify(dato)), { rnd: caso(1) })
  controlla('e si rilegge: terreno, nessun timer, le stesse caserme', letto && letto.terreno === 'neve' && letto.indice === -1 && letto.partita.resto === Infinity &&
            letto.partita.casermeDi('io').map(c => c.id).sort().join() === 'bestie,golem')
  uguale('con le regole del terreno (non si costruiscono i lupi)', letto.partita.prezzo('io', 'costruisci', 'lupi'), null)
  letto.partita.avanza(5)
  controlla('la ripresa continua', letto.partita.t > p.t && !letto.partita.fine)
  const d = dice(dato)
  controlla('la carta della mappa dice il tempo trascorso e il terreno', d && d.infinita && d.terreno === 'neve' && /^\d+:\d\d$/.test(d.restano))
  const storto = JSON.parse(JSON.stringify(dato)); storto.terreno = 'deserto'
  uguale('un terreno che non esiste si butta', leggi(storto), null)
  const intruso = JSON.parse(JSON.stringify(dato)); intruso.caserme[0].id = 'lupi'
  uguale('e una truppa di un altro terreno pure', leggi(intruso), null)
  uguale('niente da salvare a battaglia appena cominciata', scrivi(new Partita({ rnd: caso(1), sfida: sfidaInfinita('neve') }), { infinita: 'neve' }), null)
}

/* ══════════ 6c. il nemico non spreca le monete sul muro ══════════ */
{
  const p = new Partita({ rnd: caso(31), sfida: sfidaDi(CAMPAGNA[5], 'difficile') })
  p.ia.riparaMuro = true
  let ripara = 0
  const fai = p.fai.bind(p)
  p.fai = (lato, azione, ...r) => { const ok = fai(lato, azione, ...r); if (ok && lato === 'nem' && azione === 'ripara') ripara++; return ok }
  const muro = p.muro('nem')
  for (let t = 0; t < 24 && !p.fine; t += 0.25) {          // chi martella il muro lo butta giù di continuo
    muro.hp = 0; muro.crollato = true
    p.lati.nem.monete = 100
    p.avanza(0.25)
  }
  controlla('il muro che crolla di continuo si rifà al più ogni 12 secondi, non a ogni pensiero', ripara >= 1 && ripara <= 3, `riparazioni ${ripara}`)
}

/* ══════════ 7a. i livelli di difficoltà ══════════ */
{
  uguale('i livelli sono tre', LIVELLI.map(l => l.chiave).join(), 'facile,medio,difficile')
  uguale('un livello sconosciuto vale il medio', livelloValido('impossibile'), 'medio')
  uguale('e nessun livello vale il medio', livelloValido(undefined), 'medio')
  controlla('ogni livello ha la scheda di ogni tappa', LIVELLI.every(l => CAMPAGNA.every(t => NEMICO_PER_LIVELLO[l.chiave][t.chiave])))
  controlla('l\'ultima tappa: il difficile è più bravo del facile (pensa prima, più furbo)',
            sfidaDi(CAMPAGNA[11], 'difficile').nemico.furbizia > sfidaDi(CAMPAGNA[11], 'facile').nemico.furbizia &&
            sfidaDi(CAMPAGNA[11], 'difficile').nemico.pensa < sfidaDi(CAMPAGNA[11], 'facile').nemico.pensa)
  controlla('e non più ricco oltre la parità: monete e forza al massimo come le tue',
            LIVELLI.every(l => CAMPAGNA.every(t => sfidaDi(t, l.chiave).nemico.forza <= 1 && sfidaDi(t, l.chiave).nemico.moneteAlSecondo <= GIOCATORE.moneteAlSecondo + 1e-9)))
  uguale('le stesse truppe a ogni livello', sfidaDi(CAMPAGNA[5], 'facile').truppe, sfidaDi(CAMPAGNA[5], 'difficile').truppe)
  uguale('senza livello è il medio', sfidaDi(CAMPAGNA[5]).nemico, NEMICO_PER_LIVELLO.medio[CAMPAGNA[5].chiave])
  const p = new Partita({ rnd: caso(8), sfida: sfidaDi(CAMPAGNA[2], 'difficile') })
  p.avanza(30)
  const dato = scrivi(p, 2, 'difficile')
  uguale('la sosta ricorda il livello', dato.livello, 'difficile')
  const letto = leggi(dato)
  uguale('e lo riprende col nemico di quel livello', letto.livello + '/' + (letto.partita.nemicoCfg.d === NEMICO_PER_LIVELLO.difficile.radura.d), 'difficile/true')
  const vecchio = { ...dato }; delete vecchio.livello
  uguale('una sosta senza livello è del medio', leggi(vecchio).livello, 'medio')
}

/* ══════════ 7b. i dettagli ══════════ */
{
  const g = guastiDeiDettagli()
  controlla('i dettagli non hanno guasti', g.length === 0, g.join(' · '))
  const riga = (d, nome) => d.righe.find(r => r.nome === nome)
  const d1 = dettaglioTruppa('lupi', 1), d2 = dettaglioTruppa('lupi', 2)
  controlla('salire di livello fa arrivare le squadre più spesso',
            parseFloat(riga(d2, 'Una squadra ogni').dopo) < parseFloat(riga(d2, 'Una squadra ogni').ora))
  controlla('e le truppe sono più forti', Number(riga(d1, 'Vita di ogni truppa').dopo) > Number(riga(d1, 'Vita di ogni truppa').ora))
  controlla('ci sono i numeri veri e non percentuali', d1.righe.every(r => !String(r.ora).includes('%') && !String(r.dopo).includes('%')))
  const d0 = dettaglioTruppa('lupi', 0)
  controlla('da costruire si vede com\'è appena nata e com\'è potenziata', d0.etichette.ora === 'Livello 1' && d0.etichette.dopo === 'Livello 2' && d0.righe.every(r => r.dopo !== null))
  uguale('e le etichette di una caserma costruita dicono adesso e il livello dopo', `${d2.etichette.ora}/${d2.etichette.dopo}`, 'Adesso/Livello 3')
  controlla('le etichette sono corte (una riga sola)', Object.values(d0.etichette).concat(Object.values(d2.etichette)).every(e => e.length <= 12))
  uguale('da costruire costa il prezzo della caserma', dettaglioTruppa('drago', 0).prezzo, TRUPPE.drago.costo)
  const rifatta = dettaglioTruppa('lupi', 3, { costruire: true })
  controlla('da rifare costa la prima pietra e parte dal livello che l\'edificio aveva',
            rifatta.prezzo === TRUPPE.lupi.costo && rifatta.etichette.ora === 'Livello 3' && rifatta.etichette.dopo === 'Livello 4')
  controlla('ogni edificio ha due truppe (la tana tre) allo stesso prezzo', Object.values(EDIFICI).every(e => e.varianti.length >= 2 && e.varianti.length <= 3 && e.varianti.every(id => TRUPPE[id].costo === TRUPPE[e.varianti[0]].costo)))
  controlla('non c\'è un livello massimo: anche al 20 c\'è un «dopo» e un prezzo', dettaglioTruppa('lupi', 20).prezzo > 0 && dettaglioTruppa('lupi', 20).righe.every(r => r.dopo !== null))
  controlla('il golem dice che ignora le truppe e il drago che vola', ruoloDi('golem')[0].includes('costruzioni') && ruoloDi('drago')[1].includes('vola'))
  const m0 = dettaglioAzione('miniera', { miniera: 0 }), m1 = dettaglioAzione('miniera', { miniera: 1 })
  controlla('una miniera rende il 70% in più a livello', m1.righe[1].ora === '+70%' && m1.righe[1].dopo === '+140%')
  controlla('e costa quanto dice il motore', m0.prezzo === new Partita({ rnd: caso(1) }).prezzo('io', 'costruisci', 'miniera'))
}

/* ══════════ 8. la taratura è fresca ══════════ */
controlla('la taratura è fresca: se questo è rosso, rilancia `npm run tara:arena`',
          FIRMA === firmaEquilibrio(), `la firma è ${firmaEquilibrio()}, la taratura ha ${FIRMA}`)
controlla('ogni tappa ha la sua scheda del nemico', CAMPAGNA.every(t => NEMICO[t.chiave] && t.nemico === NEMICO[t.chiave]))

/* ══════════ la base del bambino (bravura.js) ══════════ */
{
  const fino7 = {}
  for (let n = 2; n <= 7; n++) for (const k of calcoliTabellina(n)) fino7[k] = { s: 6 }
  uguale('chi sa le tabelline fino al 7 parte da «fino al 9»', gradoDelleTabelline(fino7), 5)
  uguale('chi non è mai passato dagli asteroidi non ha una base dalle tabelline', gradoDelleTabelline({}), 0)
  controlla('a 8 anni le somme partono più su che a 6', gradoDellEta('+', 8) > gradoDellEta('+', 6), `${gradoDellEta('+', 6)} → ${gradoDellEta('+', 8)}`)
  uguale('a 6 anni, con le tabelline fino al 7, i prodotti partono dagli asteroidi', partenza('×', { eta: 6, items: fino7 }), 5)
  uguale('e le divisioni un gradino sotto', partenza('÷', { eta: 6, items: fino7 }), 4)
  controlla('la partenza non passa mai il suo tetto', ['+', '−', '×', '÷'].every(op => partenza(op, { eta: 12 }) <= PARTENZA_MAX))
  uguale('una base salvata vince sulla partenza', basi({ '+': 6.4 }, { eta: 6 })['+'], 6.4)
  uguale('la prima caserma chiede la base', gradoDi(4, 3), 4)
  uguale('una scelta cara sale di un grado ogni due di peso', gradoDi(4, 7), 6)
  uguale('ma non oltre il calcolo a mente', gradoDi(6, 10), GRADO_A_MENTE)
  uguale('tre giusti e svelti fanno un grado', +[1, 2, 3].reduce(b => dopoLaRisposta(b, { giusto: true, tempo: 3 }), 4).toFixed(6), 5)
  uguale('giusto ma lento non muove', dopoLaRisposta(4, { giusto: true, tempo: 12 }), 4)
  uguale('sbagliato scende di mezzo grado', dopoLaRisposta(4, { giusto: false, tempo: 3 }), 3.5)
  uguale('mai sotto il primo grado', dopoLaRisposta(1, { giusto: false, tempo: 3 }), 1)
}

riassunto('arena (motore)')
