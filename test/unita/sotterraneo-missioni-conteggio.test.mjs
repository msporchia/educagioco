/* Le missioni «sconfiggi N» (docs/sotterraneo/missioni-conteggio.md): una specie da battere N volte, per imparare a farmare. Il conto
   vale solo dopo la presa e solo nella discesa della missione, conta anche i mostri tornati (la ricomparsa), non ha freccina né
   bersaglio, si salva con l'avventura, e N sta sotto quanti ne ha un giro intero della discesa.
   `node test/esegui.mjs sotterraneo-missioni-conteggio --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MISSIONI, missioneDi, guastiDelleMissioni } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { RICOMPARSA_BASE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { puoTornare } from '../../src/giochi/sotterraneo/motore/ricomparsa.js'
import { scrivi, leggi } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { apertura } from '../../src/giochi/sotterraneo/motore/dialoghi.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { prendi, fatte, consegna, presePer, diario, promemoria, rotta, discesaDaSeguire, cosaDice, chiTiCerca,
         PRESA, FATTA, CONSEGNATA } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

const conta = MISSIONI.filter(m => m.tipo === 'conta')
const tappeAl = n => CAMPAGNA.map((t, i) => ({ chiave: t.chiave, nome: t.nome, aperta: i <= n, fatta: i < n }))
const tappaDi = m => CAMPAGNA.find(t => t.chiave === m.discesa)
const nuova = (m, conti = {}, seme = 5) => new Corsa(tappaDi(m), { seme, rnd: seminato(seme), eroe: 'cavaliere', missioni: [m], conti })
// i mostri della specie nel piano di adesso che possono cadere uno alla volta
const dellaSpecie = (c, m) => c.livello.robe.filter(r => r.che === 'mostro' && r.tipo === m.specie && !r.morto && !r.missione)

/* ══════════ 1. i dati ══════════ */
{
  uguale('cinque missioni da contare', conta.length, 5)
  controlla('i dati stanno in piedi', guastiDelleMissioni().length === 0, guastiDelleMissioni().join(' · '))
  stessaLista('in cinque discese diverse', new Set(conta.map(m => m.discesa)).size, 5)
  controlla('premi in gemme, sotto il resto della discesa', conta.every(m => m.premio.gemme >= 10 && m.premio.gemme <= 20 && !m.premio.monete))

  // i guasti si vedono davvero
  const m = missioneDi('topi')
  const specie = m.specie
  m.specie = 'lupo'
  controlla('una specie che nella discesa non c\'è è un guasto', guastiDelleMissioni().some(x => /topi.*lupo non abita/.test(x)))
  m.specie = 'unicorno'
  controlla('una specie che non esiste pure', guastiDelleMissioni().some(x => /topi.*non c'è/.test(x)))
  m.specie = specie
  const n = m.quanti
  m.quanti = 1
  controlla('un solo mostro non è un conto', guastiDelleMissioni().some(x => /topi/.test(x)))
  m.quanti = n
  uguale('rimesse a posto, nessun guasto', guastiDelleMissioni().length, 0)

  // N sta sotto quanti ne ha un giro intero (la mediana su dodici semi): il resto lo fa la ricomparsa
  for (const q of conta) {
    const t = tappaDi(q), per = []
    for (let seme = 1; seme <= 12; seme++) {
      const c = new Corsa(t, { seme, rnd: seminato(seme) })
      let quanti = 0
      for (let p = 0; p < t.piani; p++) {
        quanti += c.livello.robe.filter((r, i) => r.che === 'mostro' && r.tipo === q.specie && puoTornare(c.robeDelSeme, i)).length
        if (p < t.piani - 1) { c.piano++; c.nuovoPiano() }
      }
      per.push(quanti)
    }
    per.sort((a, b) => a - b)
    controlla(`${q.id}: ${q.quanti} ${q.nomi}, e un giro ne ha ${per[6]} (da ${per[0]} a ${per[11]})`, q.quanti <= per[6])
  }
}

/* ══════════ 2. il conto: solo dopo la presa, solo nella discesa, anche con la ricomparsa ══════════ */
{
  const m = missioneDi('topi')
  // non presa: la Corsa non la conosce, e niente si conta
  const senza = new Corsa(CAMPAGNA[1], { seme: 5, rnd: seminato(5), eroe: 'cavaliere', missioni: presePer({}, 'cantine') })
  for (const r of dellaSpecie(senza, m).slice(0, 3)) senza.cade(r)
  stessaLista('senza averla presa non si conta', senza.conti, {})
  stessaLista('e presa, la discesa giusta la sa', presePer({ topi: PRESA }, 'cantine').map(x => x.id), ['topi'])
  stessaLista('un\'altra discesa no', presePer({ topi: PRESA }, 'torre').map(x => x.id), [])
  stessaLista('né una già fatta', presePer({ topi: FATTA }, 'cantine').map(x => x.id), [])

  // presa: ogni ratto che cade conta
  const c = nuova(m)
  stessaLista('si parte da zero', c.conti, { topi: 0 })
  const ratti = dellaSpecie(c, m)
  for (const r of ratti.slice(0, 3)) c.cade(r)
  uguale('tre ratti, tre', c.conti.topi, 3)
  controlla('e non è ancora fatta', !c.missioniFatte.has('topi'))
  // un altro mostro non conta
  const altro = c.livello.robe.find(r => r.che === 'mostro' && r.tipo !== 'ratto' && !r.morto && !r.chiave)
  c.cade(altro)
  uguale('un goblin non conta', c.conti.topi, 3)
  // il bersaglio di una missione, anche della stessa specie, non conta
  const finto = { ...ratti[0], morto: false, missione: 'altra', torna: undefined }
  c.livello.robe.push(finto)
  c.cade(finto)
  uguale('né un bersaglio di un\'altra missione', c.conti.topi, 3)

  // la ricomparsa: uno che torna e cade ancora conta ancora (farmare è il punto)
  const uno = ratti[0]
  const dentro = c.livello.stanze[0]
  c.eroe = { x: dentro.cx + 0.5, y: dentro.cy + 0.5 }
  c.aggiornaLuce()
  c.passi += 3 * RICOMPARSA_BASE
  c.faiTornareIMostri()
  const tornati = ratti.slice(0, 3).filter(r => !r.morto)
  controlla('dei tre caduti almeno uno è tornato (fuori dalla stanza e dalla luce)', tornati.length > 0 || ratti.slice(0, 3).every(r => c.livello.stanzaDi(uno.x, uno.y) === c.livello.stanzaDi(dentro.cx, dentro.cy)))
  if (tornati.length) {
    c.cade(tornati[0])
    uguale('caduto ancora conta ancora', c.conti.topi, 4)
  }

  // a N è fatta, una volta sola
  let guardati = 0
  while (c.conti.topi < m.quanti && guardati++ < 200) {
    const r = dellaSpecie(c, m)[0]
    if (!r) { c.piano++; c.nuovoPiano(); continue }
    c.cade(r)
  }
  uguale('arrivata a N', c.conti.topi, m.quanti)
  controlla('è fatta', c.missioniFatte.has('topi'))
  controlla('lo si dice', c.avvisi.some(a => /8 ratti/.test(a)), c.avvisi.join('|'))
  const prima = c.conti.topi
  const ancora = dellaSpecie(c, m)[0] || (c.piano++, c.nuovoPiano(), dellaSpecie(c, m)[0])
  c.cade(ancora)
  uguale('fatta, non si conta oltre', c.conti.topi, prima)

  // fatta giù, si consegna sopra come le altre
  const stati = fatte({ topi: PRESA }, [...c.missioniFatte])
  uguale('sopra è «fatta»', stati.topi, FATTA)
  const b = new Corredo({ eroe: 'cavaliere', roba: robaAttesa('cavaliere', 1, { pozioni: false }) })
  const gemme = b.gemme
  const r = consegna(stati, 'topi', b)
  uguale('si consegna', r.stati.topi, CONSEGNATA)
  uguale('con le sue gemme', b.gemme, gemme + m.premio.gemme)
}

/* ══════════ 3. il conto passa nell'avventura e nella sosta ══════════ */
{
  const m = missioneDi('cinghiali')
  const c = nuova(m, { cinghiali: 4 })
  uguale('si riparte da dove era l\'avventura', c.conti.cinghiali, 4)
  c.cade(dellaSpecie(c, m)[0])
  uguale('il conto sale', c.conti.cinghiali, 5)
  // la sosta si rilegge con il conto dell'avventura (Gioco.vue lo scrive insieme alle fatte)
  const dato = JSON.parse(JSON.stringify(scrivi(c, CAMPAGNA.indexOf(tappaDi(m)))))
  const l = leggi(dato, tappaDi(m), null, [m], null, { cinghiali: c.conti.cinghiali })
  controlla('la sosta si rilegge', !!l)
  uguale('col conto di prima', l.conti.cinghiali, 5)
  // una sosta senza conto (o un avventura di prima) riparte da zero, senza rompere
  const l0 = leggi(dato, tappaDi(m), null, [m])
  uguale('senza conto riparte da zero', l0.conti.cinghiali, 0)
  // un conto storto si butta
  uguale('un valore che non è un numero vale zero', nuova(m, { cinghiali: 'tanti' }).conti.cinghiali, 0)
  uguale('e un negativo pure', nuova(m, { cinghiali: -3 }).conti.cinghiali, 0)
  // le missioni di altro tipo non hanno un conto
  stessaLista('chi non conta non ha un conto', new Corsa(CAMPAGNA[2], { seme: 5, missioni: [missioneDi('rosicchione')], conti: { rosicchione: 5 } }).conti, {})
}

/* ══════════ 4. si vede: il diario, il promemoria, il dialogo; niente freccina ══════════ */
{
  const m = missioneDi('topi')
  const t1 = tappeAl(1)
  const presa = { badessa: CONSEGNATA, collana: CONSEGNATA, topi: PRESA }
  const d = diario(presa, t1, null, { topi: 3 })
  const v = d.inMano.find(x => x.id === 'topi')
  stessaLista('il diario dice 3 di 8', v.progresso, { fatti: 3, quanti: 8 })
  controlla('senza piano e con la faccia del ratto', v.piano === null && v.cosa.tipo === 'conta' && v.cosa.mostro === 'ratto', JSON.stringify(v.cosa))
  uguale('il titolo', v.titolo, '8 ratti')
  uguale('non si segue (niente freccina)', v.seguibile, false)
  uguale('prima di cominciare, 0 di 8', diario(presa, t1).inMano[0].progresso.fatti, 0)
  uguale('mai oltre N', diario(presa, t1, null, { topi: 99 }).inMano[0].progresso.fatti, 8)
  uguale('fatta: 8 di 8', diario({ topi: FATTA }, t1, null, { topi: 8 }).pronte[0].progresso.fatti, 8)
  uguale('e la riga di consegna', diario({ topi: FATTA }, t1).pronte[0].torna, 'Torna dal mugnaio: hai battuto 8 ratti')
  const offerta = diario({ badessa: CONSEGNATA, collana: CONSEGNATA }, t1).offerte.find(x => x.id === 'topi')
  controlla('offerta, ha il suo dettaglio', offerta && offerta.dice.length > 20 && offerta.progresso.fatti === 0)

  // il promemoria in discesa: a che punto sei, su qualunque piano
  for (const piano of [1, 2]) {
    const pm = promemoria({ topi: PRESA }, 'cantine', piano, { topi: 3 })
    uguale(`piano ${piano}: il promemoria dice a che punto sei`, pm[0].testo, 'Missione: sconfiggi 8 ratti (3 di 8)')
    uguale('ed è «qui» ovunque', pm[0].dove, 'qui')
  }
  uguale('fatta, ricorda a chi riportarla', promemoria({ topi: FATTA }, 'cantine', 1)[0].testo, 'Missione compiuta: 8 ratti, torna dal mugnaio')

  // nessuna freccina: né giù né sulla mappa
  const c = nuova(m)
  uguale('giù non c\'è una rotta', rotta(c), null)
  uguale('e nessuna cosa messa nel piano', c.livello.robe.filter(r => r.missione === 'topi').length, 0)
  uguale('sopra la freccia non punta alla discesa', discesaDaSeguire({ topi: PRESA }, { x: 0, y: 0 }, { cantine: { x: 5, y: 5 } }, null, null), null)

  // il personaggio: la richiesta, l'attesa, la consegna
  const ctx = stati => ({ stati, tappe: t1, forze: null })
  const chiede = apertura('mugnaio', ctx({ badessa: CONSEGNATA, collana: CONSEGNATA }))
  controlla('il mugnaio chiede i ratti', chiede.some(p => p.missione === 'topi' && /ratti/.test(p.testo)), JSON.stringify(chiede))
  const aspetta = apertura('mugnaio', ctx(presa))
  controlla('presa, dice cosa gli serve ancora', aspetta.some(p => p.missione === 'topi' && /Me ne servono ancora: 8 ratti/.test(p.testo)), JSON.stringify(aspetta))
  uguale('il minatore la nomina fra le attese', chiTiCerca(presa, t1).some(r => /aspetta ancora: 8 ratti/.test(r)), true)
  uguale('segno «?» per chi aspetta', cosaDice('mugnaio', presa, t1).fase, 'aspetta')
  uguale('prendendola, il tetto vale come per le altre', prendi({ badessa: CONSEGNATA, collana: CONSEGNATA }, 'topi', t1).topi, PRESA)
}

nota('missioni da contare:', conta.map(m => `${m.id} ${m.quanti} ${m.nomi} (${m.discesa}, 💎 ${m.premio.gemme})`).join(' · '))
riassunto('le missioni «sconfiggi N»')
