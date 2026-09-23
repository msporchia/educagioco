/* Verifica di Passo passo, senza browser.
   Le cose che contano, in ordine: i dati stanno in piedi; ogni regola
   del mondo fa quello che dice, provata su mappe minuscole scritte qui;
   ogni livello della campagna si vince con la carota, e la strada del
   risolutore giocata dal motore vince davvero con tre stelle; ogni
   livello dei gradini 2–5 ha bisogno della sua regola (se no insegna
   un'altra cosa); chi segue solo gli aiuti arriva a casa; il sentiero
   senza fine fa livelli che si vincono; i traguardi scattano a profilo
   finito e non a profilo vuoto.
   `node test/esegui.mjs passo-passo --niente-build` */
import { LEGENDA, MOSSE, MASSIMO_FILA, COLONNE_MAX, RIGHE_MAX, guastiDelMondo, guastiDellaMappa }
  from '../../src/giochi/passo-passo/dati/mondo.js'
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, TEMI, guastiDellaCampagna }
  from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui, stelleDellaVittoria, TANA, SBATTE, SPLASH, FINITA, REGOLE }
  from '../../src/giochi/passo-passo/motore/mondo.js'
import { risolvi, suggerisci, serveLaRegola, misura, mosseDi }
  from '../../src/giochi/passo-passo/motore/risolutore.js'
import { generaSentiero, caso, GRADINI } from '../../src/giochi/passo-passo/motore/generatore.js'
import { Proiezione, fotogrammaIniziale } from '../../src/giochi/passo-passo/scena/proiezione.js'
import manifesto, { CHIAVE, SENZA_FINE } from '../../src/giochi/passo-passo/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { guastiDelleSfide } from '../../src/giochi/primati.js'
import { misure, statoTraguardo } from '../../src/store/progressi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const L = (mappa, salti = false) => new Livello(mappa, { salti })
const FRECCE = { su: '↑', giu: '↓', sinistra: '←', destra: '→',
                 'salto-su': '⇑', 'salto-giu': '⇓', 'salto-sinistra': '⇐', 'salto-destra': '⇒' }
const inFrecce = f => (f || []).map(m => FRECCE[m]).join(' ')
const dove = (r) => r.mondo.pos

/* ══════════ 1. i dati stanno in piedi ══════════ */
{
  const g1 = guastiDelMondo()
  controlla('il vocabolario del mondo non ha guasti', g1.length === 0, g1.join(' · '))
  const g2 = guastiDellaCampagna()
  controlla('la campagna non ha guasti', g2.length === 0, g2.join(' · '))
  const g3 = guastiDellAlbo([manifesto])
  controlla('il blocco albo del manifesto non ha guasti', g3.length === 0, g3.join(' · '))
  const g4 = guastiDelleSfide([manifesto])
  controlla('la sfida senza fine è dichiarata bene', g4.length === 0, g4.join(' · '))

  uguale('otto mosse: quattro passi e quattro salti', Object.keys(MOSSE).length, 8)
  uguale('cinque gradini', SCALINI.length, 5)
  controlla('ogni gradino dopo il primo porta una regola che il motore sa spegnere',
            SCALINI.slice(1).every(s => REGOLE.includes(s.regola)) && !SCALINI[0].regola)
  dentro('circa ventiquattro livelli', CAMPAGNA.length, 22, 26)
  uguale('il manifesto conta le tappe giuste', manifesto.tappe, QUANTE_TAPPE)
  uguale('la chiave è «passo»', CHIAVE, 'passo')
  controlla('il gioco è per i piccoli, e sta fra quelli in prova',
            manifesto.piccoli === true && manifesto.sperimentale === true)
  controlla('il gioco sta nell\'area «logica» e si gioca pensando',
            manifesto.area === 'logica' && manifesto.come === 'pensare')
  controlla('la prima tappa sta a quattro anni, l\'ultima verso i sette e mezzo',
            CAMPAGNA[0].portata <= 6 && CAMPAGNA.at(-1).portata >= 40 && CAMPAGNA.at(-1).portata <= 50,
            `${CAMPAGNA[0].portata} … ${CAMPAGNA.at(-1).portata}`)
  controlla('nessuna tappa dichiara un pezzo di scuola', CAMPAGNA.every(t => !t.scuola))
  controlla('ogni mappa sta in sette per nove', CAMPAGNA.every(t =>
    t.mappa.length <= RIGHE_MAX && t.mappa[0].length <= COLONNE_MAX))
  controlla('ogni tappa ha un tema che esiste', CAMPAGNA.every(t => TEMI.includes(t.tema)))
  controlla('il tetto della fila è alto: non è un par', MASSIMO_FILA >= 30)
  /* nessun livello della campagna è la stessa stanza di un altro */
  uguale('ventiquattro mappe tutte diverse',
         new Set(CAMPAGNA.map(t => t.mappa.join('/'))).size, CAMPAGNA.length)

  /* un guasto va detto, non ingoiato */
  controlla('una lettera sconosciuta è un guasto', guastiDellaMappa(['P.X', '..@', 'c..']).length > 0)
  controlla('una buca senza gemella è un guasto', guastiDellaMappa(['P1.', '..@', 'c..']).length > 0)
  controlla('due tane sono un guasto', guastiDellaMappa(['P.@', '..@', 'c..']).length > 0)
  controlla('una mappa troppo larga è un guasto', guastiDellaMappa(['P......c', '.......@', '........']).length > 0)
  controlla('una mappa giusta non ha guasti', guastiDellaMappa(['P.c', '...', '..@']).length === 0)
}

/* ══════════ 2. le regole del mondo, su mappe minuscole ══════════ */
{
  /* prato e tana */
  let r = esegui(L(['P.@', 'c..']), ['destra', 'destra'])
  uguale('sul prato si cammina, e la tana vince', r.esito, TANA)
  r = esegui(L(['P@.', 'c..']), ['destra', 'giu', 'giu'])
  controlla('arrivati alla tana si vince subito: le frecce dopo non contano',
            r.esito === TANA && r.dove === 0, JSON.stringify({ esito: r.esito, dove: r.dove }))
  r = esegui(L(['P..', 'c.@']), ['destra'])
  controlla('la fila finita prima della tana non è un errore',
            r.esito === FINITA && dove(r).x === 1 && dove(r).y === 0)

  /* ostacoli e bordo */
  r = esegui(L(['P.S', 'c.@']), ['destra', 'destra', 'giu'])
  controlla('contro un sasso si sbatte, e la fila si ferma lì',
            r.esito === SBATTE && r.dove === 1 && dove(r).x === 1, JSON.stringify({ e: r.esito, d: r.dove }))
  r = esegui(L(['P.A', 'c.@']), ['destra', 'destra'])
  uguale('contro un albero si sbatte', r.esito, SBATTE)
  r = esegui(L(['PB.', 'c.@']), ['destra'])
  uguale('contro un cespuglio si sbatte', r.esito, SBATTE)
  r = esegui(L(['Pt.', 'c.@'], true), ['destra'])
  uguale('anche contro un tronco, camminando, si sbatte', r.esito, SBATTE)
  r = esegui(L(['P-.', 'c.@'], true), ['destra'])
  uguale('e contro la staccionata', r.esito, SBATTE)
  r = esegui(L(['P..', 'c.@']), ['su'])
  controlla('contro il bordo della mappa si sbatte', r.esito === SBATTE && r.dove === 0)

  /* acqua */
  r = esegui(L(['P~.', 'c.@']), ['destra', 'giu'])
  controlla('nell\'acqua si fa splash, e la fila si ferma lì', r.esito === SPLASH && r.dove === 0)

  /* il salto */
  r = esegui(L(['Pt.', 'c.@'], true), ['salto-destra', 'giu'])
  controlla('il salto scavalca un tronco (basso)', r.esito === TANA, r.esito)
  r = esegui(L(['P-.', 'c.@'], true), ['salto-destra', 'giu'])
  controlla('e una staccionata (bassa)', r.esito === TANA, r.esito)
  r = esegui(L(['P~.', 'c.@'], true), ['salto-destra', 'giu'])
  controlla('e l\'acqua', r.esito === TANA, r.esito)
  r = esegui(L(['PS.', 'c.@'], true), ['salto-destra'])
  controlla('ma non un sasso (alto): si sbatte', r.esito === SBATTE && dove(r).x === 0)
  r = esegui(L(['PA.', 'c.@'], true), ['salto-destra'])
  uguale('né un albero', r.esito, SBATTE)
  r = esegui(L(['Pm.', 'c.@'], true), ['salto-destra'])
  uguale('né un masso', r.esito, SBATTE)
  r = esegui(L(['P.~', 'c.@'], true), ['salto-destra'])
  uguale('atterrando nell\'acqua si fa splash', r.esito, SPLASH)
  r = esegui(L(['P.S', 'c.@'], true), ['salto-destra'])
  uguale('atterrando su un sasso si sbatte', r.esito, SBATTE)
  r = esegui(L(['.P.', 'c.@'], true), ['salto-destra'])
  uguale('saltando fuori dalla mappa si sbatte', r.esito, SBATTE)
  r = esegui(L(['Pc.', '..@'], true), ['salto-destra'])
  controlla('saltando sopra la carota non la si prende', r.esito === FINITA && !r.carota)
  r = esegui(L(['P.c', '..@'], true), ['salto-destra'])
  controlla('atterrandoci sopra sì', r.carota === true)
  r = esegui(L(['P@.', 'c..'], true), ['salto-destra'])
  controlla('saltando sopra la tana non si vince: il salto è lungo due',
            r.esito === FINITA && dove(r).x === 2, r.esito)
  r = esegui(L(['P.**S', 'c...@'], true), ['salto-destra'])
  controlla('atterrando sul ghiaccio si scivola', r.esito === FINITA && dove(r).x === 3, JSON.stringify(dove(r)))

  /* il ghiaccio */
  r = esegui(L(['P***S', 'c...@']), ['destra'])
  controlla('sul ghiaccio si scivola fino al sasso, e ci si ferma sul ghiaccio (non è un errore)',
            r.esito === FINITA && dove(r).x === 3, JSON.stringify({ e: r.esito, p: dove(r) }))
  r = esegui(L(['P**O.', 'c...@']), ['destra'])
  controlla('anche contro un sasso piantato nel ghiaccio', r.esito === FINITA && dove(r).x === 2)
  r = esegui(L(['P***', 'c..@']), ['destra'])
  controlla('e contro il bordo', r.esito === FINITA && dove(r).x === 3)
  r = esegui(L(['P**..', 'c...@']), ['destra'])
  controlla('uscendo dal ghiaccio ci si ferma sulla prima cella d\'erba',
            r.esito === FINITA && dove(r).x === 3, JSON.stringify(dove(r)))
  r = esegui(L(['P**~.', 'c...@']), ['destra'])
  controlla('scivolando nell\'acqua si fa splash', r.esito === SPLASH && r.dove === 0)
  r = esegui(L(['P*C*.', '....@']), ['destra'])
  controlla('scivolando si prende la carota', r.carota === true && dove(r).x === 4)
  r = esegui(L(['P**@.', 'c....']), ['destra'])
  uguale('e scivolando nella tana si vince', r.esito, TANA)
  r = esegui(L(['P**m.', 'c...@']), ['destra'])
  controlla('un masso ferma chi scivola, senza essere spinto',
            r.esito === FINITA && dove(r).x === 2 && r.mondo.massi.includes(3))
  /* andata: si scivola oltre il ghiaccio fino all'erba; ritorno: si
     riscivola indietro fino alla cella di partenza */
  r = esegui(L(['P*..', 'c..@']), ['destra', 'sinistra'])
  controlla('sul ghiaccio si scivola in ogni direzione, anche all\'indietro',
            r.esito === FINITA && dove(r).x === 0, JSON.stringify(dove(r)))

  /* i massi */
  let liv = L(['Pm..', 'c..@'])
  r = esegui(liv, ['destra'])
  controlla('camminando contro un masso lo si spinge di una cella, e si entra dove stava',
            r.esito === FINITA && dove(r).x === 1 && r.mondo.massi.includes(2) && liv.massi.includes(1))
  r = esegui(L(['Pm~.', 'c..@']), ['destra', 'destra', 'destra'])
  controlla('spinto nell\'acqua il masso affonda e diventa un ponte: ci si cammina sopra',
            r.esito === FINITA && dove(r).x === 3 && r.mondo.ponti.includes(2) && r.mondo.massi.length === 0,
            JSON.stringify({ e: r.esito, p: dove(r) }))
  r = esegui(L(['Pm**.S', 'c....@']), ['destra'])
  controlla('spinto sul ghiaccio il masso scivola finché il ghiaccio non finisce',
            r.mondo.massi.includes(4), JSON.stringify(r.mondo.massi))
  r = esegui(L(['Pm**S.', 'c....@']), ['destra'])
  controlla('o finché non trova un sasso', r.mondo.massi.includes(3), JSON.stringify(r.mondo.massi))
  r = esegui(L(['Pm*~..', 'c....@']), ['destra'])
  controlla('e se scivola nell\'acqua ci affonda', r.mondo.ponti.includes(3) && !r.mondo.massi.length)
  r = esegui(L(['PmS.', 'c..@']), ['destra'])
  controlla('un masso contro un sasso non si muove: si sbatte',
            r.esito === SBATTE && dove(r).x === 0 && r.mondo.massi.includes(1))
  uguale('un masso contro un altro masso non si muove', esegui(L(['Pmm.', 'c..@']), ['destra']).esito, SBATTE)
  uguale('né contro il bordo', esegui(L(['.Pm', 'c.@']), ['destra']).esito, SBATTE)
  uguale('né sulla tana', esegui(L(['Pm@', 'c..']), ['destra']).esito, SBATTE)
  uguale('né sulla carota', esegui(L(['Pmc', '..@']), ['destra']).esito, SBATTE)
  uguale('né su una buca', esegui(L(['Pm1.', 'c..@', '1...']), ['destra']).esito, SBATTE)

  /* le buche */
  r = esegui(L(['P1S1.', 'c...@']), ['destra', 'destra'])
  controlla('entrando in una buca si esce dalla gemella', dove(r).x === 4 && r.esito === FINITA,
            JSON.stringify(dove(r)))
  r = esegui(L(['P*1S1.', 'c....@']), ['destra'])
  controlla('e il movimento finisce lì anche scivolando', dove(r).x === 4 && r.esito === FINITA,
            JSON.stringify(dove(r)))
  r = esegui(L(['P1S1.', 'c...@']), ['destra', 'destra', 'sinistra'])
  controlla('ripassandoci sopra si rifà il viaggio, all\'indietro', dove(r).x === 1, JSON.stringify(dove(r)))
  r = esegui(L(['P1S1.', 'c...@']), ['destra', 'destra'], { senza: 'buche' })
  controlla('senza la regola delle buche la seconda freccia sbatte contro il sasso',
            r.esito === SBATTE && r.dove === 1)

  /* le stelle */
  uguale('arrivato, con la carota, senza aiuti: tre stelle', stelleDellaVittoria({ carota: true, aiutato: false }), 3)
  uguale('senza la carota: due', stelleDellaVittoria({ carota: false, aiutato: false }), 2)
  uguale('con un aiuto: due', stelleDellaVittoria({ carota: true, aiutato: true }), 2)
  uguale('senza niente: una, e basta arrivare', stelleDellaVittoria({ carota: false, aiutato: true }), 1)
}

/* ══════════ 3. la campagna si vince, e ogni gradino insegna la sua regola ══════════ */
nota('tappa                        mosse  senza carota  la regola')
for (const [i, t] of CAMPAGNA.entries()) {
  const liv = Livello.da(t)
  const s = SCALINI.find(x => x.chiave === t.scalino)
  const m = misura(liv)
  const qui = `tappa ${i + 1} (${t.nome})`
  controlla(`${qui}: si vince con la carota`, !!m.conCarota)
  if (!m.conCarota) continue
  const r = esegui(liv, m.conCarota)
  controlla(`${qui}: la strada del risolutore, giocata, vince con la carota`,
            r.esito === TANA && r.carota, `${r.esito} in ${inFrecce(m.conCarota)}`)
  uguale(`${qui}: e senza aiuti vale tre stelle`, stelleDellaVittoria({ carota: r.carota, aiutato: false }), 3)
  controlla(`${qui}: si vince anche senza la carota, e non più lunga`,
            !!m.senzaCarota && m.corta <= m.lunga)
  if (s.chiave === 'passi') {
    dentro(`${qui}: nei primi passi la strada va da 2 a 8 frecce`, m.lunga, 2, 8)
    controlla(`${qui}: nei primi passi non ci sono salti`, !t.salti)
  } else {
    controlla(`${qui}: ha bisogno della sua regola («${s.regola}»)`, serveLaRegola(liv, s.regola),
              `la strada ${inFrecce(m.conCarota)} regge anche senza`)
  }
  /* chi accende la seconda fila di frecce deve usarla: una fila di tasti
     che non servono è una fila di tasti da provare a caso */
  if (t.salti) controlla(`${qui}: accende i salti, e la strada giusta salta`,
                         m.conCarota.some(x => x.startsWith('salto-')))
  dentro(`${qui}: la strada sta nella fila senza scorrere troppo`, m.lunga, 2, 16)
  nota(`${String(i + 1).padStart(2)}. ${t.nome.padEnd(26)} ${String(m.lunga).padStart(3)}  ${String(m.corta).padStart(8)}      ` +
       `${s.regola || '—'}   ${inFrecce(m.conCarota)}`)
}

/* i gradini crescono: la strada media non si accorcia di netto, e il
   ghiaccio fa le strade corte e i pensieri lunghi */
{
  const media = k => {
    const ls = CAMPAGNA.filter(t => t.scalino === k).map(t => misura(Livello.da(t)).lunga)
    return ls.reduce((a, b) => a + b, 0) / ls.length
  }
  nota('strada media per gradino:', SCALINI.map(s => `${s.nome} ${media(s.chiave).toFixed(1)}`).join(' · '))
  controlla('il gradino del ghiaccio usa davvero le scivolate',
            CAMPAGNA.filter(t => t.scalino === 'ghiaccio')
              .every(t => misura(Livello.da(t)).usa.scivola > 0))
  controlla('il gradino dei massi spinge davvero',
            CAMPAGNA.filter(t => t.scalino === 'massi').every(t => misura(Livello.da(t)).usa.spinta > 0))
  controlla('il gradino delle buche ci passa davvero',
            CAMPAGNA.filter(t => t.scalino === 'buche').every(t => misura(Livello.da(t)).usa.buca > 0))
  controlla('almeno un masso diventa un ponte',
            CAMPAGNA.some(t => misura(Livello.da(t)).usa.affonda > 0))
  controlla('l\'ultima tappa mescola tutto: salto, ghiaccio, spinta, buca', (() => {
    const u = misura(Livello.da(CAMPAGNA.at(-1))).usa
    return u.salto > 0 && u.scivola > 0 && u.spinta > 0 && u.buca > 0
  })())
}

/* ══════════ 4. gli aiuti ══════════ */
{
  /* chi segue soltanto gli aiuti, dalla fila vuota, arriva a casa con
     la carota: l'aiuto non manda mai in un vicolo cieco */
  for (const [i, t] of CAMPAGNA.entries()) {
    const liv = Livello.da(t)
    const fila = []
    let giri = 0, ultimo = null
    while (giri++ < 40) {
      ultimo = suggerisci(liv, fila)
      if (!ultimo || ultimo.che === 'via') break
      fila.splice(ultimo.cursore, 0, ultimo.mossa)
    }
    const r = esegui(liv, fila)
    controlla(`tappa ${i + 1}: seguendo solo gli aiuti si arriva a casa con la carota`,
              ultimo && ultimo.che === 'via' && r.esito === TANA && r.carota,
              `${inFrecce(fila)} → ${r.esito}`)
  }

  /* un aiuto a metà di una fila sbagliata: il cursore va dove la fila
     smette di andare bene, non in fondo */
  const liv = Livello.da(CAMPAGNA[1])       // il cespuglio: dritti si sbatte
  const s = suggerisci(liv, ['destra', 'destra', 'destra'])
  controlla('con la prima freccia sbagliata, l\'aiuto mette il cursore all\'inizio',
            s && s.che === 'mossa' && s.cursore === 0, JSON.stringify(s))
  controlla('e accende una freccia che gira attorno al cespuglio',
            s && (s.mossa === 'giu' || s.mossa === 'su'), JSON.stringify(s))
  const sol = risolvi(liv)
  uguale('se la fila vince già con la carota, l\'aiuto dice solo ▶', suggerisci(liv, sol).che, 'via')
  const parziale = suggerisci(liv, sol.slice(0, 2))
  controlla('a fila giusta ma incompleta, l\'aiuto mette il cursore in fondo',
            parziale && parziale.cursore === 2, JSON.stringify(parziale))
  /* una freccia che non sbaglia ma porta in un vicolo senza ritorno: il
     masso spinto contro il muro chiude la strada, e l'aiuto lo sa */
  const massi = Livello.da(CAMPAGNA.find(t => t.chiave === 'due-massi'))
  const chiusa = suggerisci(massi, ['destra', 'destra'])
  controlla('l\'aiuto non si fida di una fila che non sbaglia ma chiude la strada',
            chiusa && chiusa.cursore < 2, JSON.stringify(chiusa))
}

/* ══════════ 5. la proiezione: il motore messo in movimento ══════════ */
{
  for (const t of [CAMPAGNA[0], CAMPAGNA.find(x => x.scalino === 'ghiaccio'), CAMPAGNA.at(-1)]) {
    const liv = Livello.da(t)
    const r = esegui(liv, risolvi(liv))
    const p = new Proiezione(liv, r)
    let finiti = true
    for (let x = 0; x <= p.durata; x += 0.05) {
      const f = p.fotogramma(x)
      if (!Number.isFinite(f.coniglio.x) || !Number.isFinite(f.coniglio.y)) finiti = false
    }
    controlla(`«${t.nome}»: il coniglio sta sempre da qualche parte`, finiti)
    /* e si vede sempre, finché non entra nella tana: nelle pause fra una
       freccia e l'altra spariva, perché lì si credeva già arrivato */
    const sparito = p.battute.filter(b => b.e.che !== 'tana')
      .some(b => p.fotogramma(b.t1 + 0.01).coniglio.alfa < 1)
    controlla(`«${t.nome}»: il coniglio non sparisce mai prima della tana`, !sparito)
    const fine = p.fotogramma(p.durata + 1)
    controlla(`«${t.nome}»: alla fine è in casa, con la carota`, fine.festa && fine.carota.presa)
  }
  /* uno sbaglio: la tessera colpevole è quella giusta, e poi si torna alla partenza */
  const liv = Livello.da(CAMPAGNA[1])
  const r = esegui(liv, ['destra'])
  const p = new Proiezione(liv, r)
  const durante = p.fotogramma(p.tScenetta + 0.1)
  controlla('durante la scenetta la cella contro cui si è sbattuto è segnata',
            durante.guasto && durante.guasto.x === 1 && durante.guasto.y === 1, JSON.stringify(durante.guasto))
  const dopo = p.fotogramma(p.durata + 0.5)
  const via = fotogrammaIniziale(liv)
  controlla('e alla fine il coniglio è tornato alla partenza',
            dopo.tornato && dopo.coniglio.x === via.coniglio.x && dopo.coniglio.y === via.coniglio.y)
  /* la parte già vista scorre veloce */
  const lungo = Livello.da(CAMPAGNA[4])
  const sol = risolvi(lungo)
  const piano = new Proiezione(lungo, esegui(lungo, sol))
  const svelto = new Proiezione(lungo, esegui(lungo, sol), { veloci: sol.length - 1 })
  controlla('la parte già riuscita al giro prima scorre molto più veloce',
            svelto.durata < piano.durata * 0.6, `${svelto.durata.toFixed(2)} contro ${piano.durata.toFixed(2)}`)
}

/* ══════════ 6. il sentiero senza fine ══════════ */
{
  let tutti = 0, buoni = 0, regole = 0, conRegola = 0
  const lunghe = []
  for (let fatti = 0; fatti < GRADINI.length * 2; fatti++) {
    for (let seme = 1; seme <= 6; seme++) {
      const t = generaSentiero(fatti, caso(97 * fatti + seme))
      tutti++
      const g = guastiDellaMappa(t.mappa)
      const liv = Livello.da(t)
      const m = misura(liv)
      if (!g.length && m.conCarota && esegui(liv, m.conCarota).esito === TANA) buoni++
      const gr = GRADINI[t.gradino]
      if (gr.regola) { regole++; if (serveLaRegola(liv, gr.regola)) conRegola++ }
      if (seme === 1) lunghe.push(m.lunga)
    }
  }
  uguale('ogni sentiero generato è una mappa scritta bene e si vince con la carota', buoni, tutti)
  controlla('quasi sempre la regola del gradino serve davvero', conRegola >= regole * 0.9,
            `${conRegola} su ${regole}`)
  nota('sentieri: strada con la carota per gradino →', lunghe.join(' '))
  const a = generaSentiero(5, caso(42)), b = generaSentiero(5, caso(42))
  uguale('lo stesso seme fa lo stesso sentiero', a.mappa.join('/'), b.mappa.join('/'))
  controlla('i salti compaiono solo dove il gradino li porta',
            GRADINI.every((g, i) => !!generaSentiero(i * 2, caso(7)).salti === !!g.salti))
  controlla('le mosse di un livello senza salti sono quattro', mosseDi(Livello.da(CAMPAGNA[0])).length === 4)
}

/* ══════════ 7. quello che il gioco porta all'albo ══════════ */
{
  const traguardi = manifesto.albo.traguardi.map(t => ({ ...t, area: manifesto.chiave }))
  controlla('gli id dei traguardi cominciano per «pp-»', traguardi.every(t => t.id.startsWith('pp-')))
  controlla('almeno tre traguardi', traguardi.length >= 3)

  const vuoto = { totals: {}, best: {}, items: {}, campagne: {} }
  const mVuoto = misure(vuoto)
  controlla('a profilo vuoto non se n\'è preso nessuno',
            traguardi.every(t => statoTraguardo(t, mVuoto).grado === 0))
  uguale('e il gioco non risulta provato', manifesto.albo.provato(mVuoto), false)
  uguale('a mani vuote l\'esperienza vale zero', manifesto.albo.xp(mVuoto), 0)

  const finito = {
    totals: { ppProve: 400, ppTane: 120, ppCarote: 60, ppDaSolo: 80 },
    best: { ppFila: 14 }, items: {},
    campagne: { passo: { tappa: QUANTE_TAPPE, libera: true,
                         stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3])) } },
  }
  const mFinito = misure(finito)
  const presi = traguardi.map(t => statoTraguardo(t, mFinito))
  controlla('chi ha finito tutto li prende tutti d\'oro', presi.every(s => s.finito),
            presi.filter(s => !s.finito).map(s => `${s.id} fermo a ${s.valore}`).join(' · '))
  controlla('il gioco risulta provato', manifesto.albo.provato(mFinito) === true)
  controlla('e l\'area vale esperienza', manifesto.albo.xp(mFinito) > 0)
  uguale('le stelle sono la somma dei primati per tappa', mFinito.stelleDi(CHIAVE), QUANTE_TAPPE * 3)
  uguale('le stelle possibili sono tre per tappa', manifesto.albo.traguardi
    .find(t => t.id === 'pp-stelle').soglie.at(-1), QUANTE_TAPPE * 3)

  /* la riga della home */
  uguale('in home, all\'inizio', manifesto.riassunto({ tappa: 0, stelle: {} }), `tappa 1 di ${QUANTE_TAPPE} · Il prato`)
  controlla('a campagna finita parla del sentiero',
            manifesto.riassunto({ tappa: QUANTE_TAPPE, stelle: { 0: 3 } }).startsWith('tutte le tane'))
  controlla('e col record lo dice', manifesto.riassunto({ tappa: QUANTE_TAPPE, stelle: {},
    primato: { best: 5, quando: 1, partite: 2, ultime: [] } }).includes('5 di fila'))
  uguale('la misura del sentiero è «di fila»', SENZA_FINE.misura, 'fila')
}

/* le lettere della legenda che la campagna usa davvero: una lettera mai
   usata è un disegno che nessuno ha mai visto a schermo */
{
  const usate = new Set(CAMPAGNA.flatMap(t => t.mappa.join('').split('')))
  const mai = Object.keys(LEGENDA).filter(ch => !usate.has(ch) && !['2', '3'].includes(ch))
  nota('lettere della legenda mai usate dalla campagna:', mai.join(' ') || 'nessuna')
}

riassunto('passo passo')
