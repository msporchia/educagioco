/* Verifica di Passo passo, senza browser.
   Le cose che contano, in ordine: i dati stanno in piedi; ogni regola
   del mondo fa quello che dice, provata su mappe minuscole scritte qui;
   i cicli girano e la fila si modifica come dice `motore/fila.js`; ogni
   livello della campagna si vince con la carota, e la strada del
   risolutore giocata dal motore vince davvero con tre stelle; ogni
   livello dei gradini 2–5 ha bisogno della sua regola (se no insegna
   un'altra cosa), e ogni livello dello zaino ha bisogno del ciclo; chi
   segue solo gli aiuti arriva a casa, e nello zaino ci sta; il sentiero
   senza fine fa livelli che si vincono; i traguardi scattano a profilo
   finito e non a profilo vuoto, e nessuno torna indietro quando la
   campagna si allunga.
   `node test/esegui.mjs passo-passo --niente-build` */
import { LEGENDA, MOSSE, MASSIMO_FILA, COLONNE_MAX, RIGHE_MAX, guastiDelMondo, guastiDellaMappa }
  from '../../src/giochi/passo-passo/dati/mondo.js'
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, TAPPE_PICCOLE, TAPPE_ZAINO, TEMI, guastiDellaCampagna }
  from '../../src/giochi/passo-passo/dati/campagna.js'
import { CARTE, albero, carteDi, conCicli, daScegliere, guastiDellaFila, programma, ripeti, se, apri,
         apriSe, FINE, chiusuraDi, aperturaDi }
  from '../../src/giochi/passo-passo/dati/carte.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { esegui, stelleDellaVittoria, TANA, SBATTE, SPLASH, STANCO, FINITA, REGOLE, PASSI_MAX }
  from '../../src/giochi/passo-passo/motore/mondo.js'
import { risolvi, suggerisci, serveLaRegola, serveLaCarta, misura, mosseDi }
  from '../../src/giochi/passo-passo/motore/risolutore.js'
import { mettiCarta, mettiCiclo, mettiScatola, togliPrima, scegliVolte, scegliTesta, seguiConsiglio }
  from '../../src/giochi/passo-passo/motore/fila.js'
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
const SEGNO = { rosso: '🔴', blu: '🔵', giallo: '🟡', casa: '🏠' }
const inFrecce = f => (f || []).map(m => FRECCE[m] || (m === FINE ? ')'
  : m.startsWith('se-') ? `❓${SEGNO[m.slice(3)] || m.slice(3)}(` : `🔁${SEGNO[m.slice(7)] || m.slice(7)}(`)).join(' ')
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
  const REGOLA = SCALINI.filter(s => !s.carta), CARTA = SCALINI.filter(s => s.carta)
  uguale('cinque gradini di regole del mondo', REGOLA.length, 5)
  controlla('ogni gradino dopo il primo porta una regola che il motore sa spegnere',
            REGOLA.slice(1).every(s => REGOLE.includes(s.regola)) && !REGOLA[0].regola)
  controlla('e dopo, i gradini delle carte: ognuno porta una carta che esiste',
            CARTA.length >= 1 && CARTA.every(s => CARTE[s.carta] && !s.regola) &&
            SCALINI.findIndex(s => s.carta) === REGOLA.length)
  dentro('circa ventiquattro livelli per i piccoli', TAPPE_PICCOLE, 22, 26)
  dentro('e almeno sei con lo zaino', TAPPE_ZAINO, 6, 30)
  uguale('il manifesto conta le tappe giuste', manifesto.tappe, QUANTE_TAPPE)
  uguale('la chiave è «passo»', CHIAVE, 'passo')
  controlla('il gioco è per i piccoli, e sta fra quelli in prova',
            manifesto.piccoli === true && manifesto.sperimentale === true)
  controlla('ma cresce: le partenze dei grandi non lo spengono', manifesto.cresce === true)
  controlla('il gioco sta nell\'area «logica» e si gioca pensando',
            manifesto.area === 'logica' && manifesto.come === 'pensare')
  const ultimaPiccola = CAMPAGNA[TAPPE_PICCOLE - 1]
  controlla('la prima tappa sta a quattro anni, l\'ultima dei piccoli verso i sette e mezzo',
            CAMPAGNA[0].portata <= 6 && ultimaPiccola.portata >= 40 && ultimaPiccola.portata <= 50,
            `${CAMPAGNA[0].portata} … ${ultimaPiccola.portata}`)
  /* lo zaino è da otto anni: a sei deve restare chiuso (la mira di un
     bambino di sei anni arriva a 44, vedi il commento in testa alla
     campagna), e a sette e mezzo deve cominciare */
  controlla('le tappe dello zaino stanno fra i sette anni e mezzo e i dieci',
            CAMPAGNA.slice(TAPPE_PICCOLE).every(t => t.portata > 44 && t.portata <= 75),
            CAMPAGNA.slice(TAPPE_PICCOLE).map(t => t.portata).join(' '))
  controlla('nessuna tappa dichiara un pezzo di scuola', CAMPAGNA.every(t => !t.scuola))
  controlla(`ogni mappa sta in ${COLONNE_MAX} per ${RIGHE_MAX}`, CAMPAGNA.every(t =>
    t.mappa.length <= RIGHE_MAX && t.mappa[0].length <= COLONNE_MAX))
  controlla('ogni tappa ha un tema che esiste', CAMPAGNA.every(t => TEMI.includes(t.tema)))
  controlla('il tetto della fila è alto: non è un par', MASSIMO_FILA >= 30)
  /* nessun livello della campagna è la stessa stanza di un altro */
  uguale('le mappe sono tutte diverse',
         new Set(CAMPAGNA.map(t => t.mappa.join('/'))).size, CAMPAGNA.length)

  /* un guasto va detto, non ingoiato */
  controlla('una lettera sconosciuta è un guasto', guastiDellaMappa(['P.X', '..@', 'c..']).length > 0)
  controlla('una buca senza gemella è un guasto', guastiDellaMappa(['P1.', '..@', 'c..']).length > 0)
  controlla('due tane sono un guasto', guastiDellaMappa(['P.@', '..@', 'c..']).length > 0)
  controlla('una mappa troppo larga è un guasto', guastiDellaMappa(['P........c', '.........@', '..........']).length > 0)
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
  /* la terza è «la strada l'hai trovata tu»: la toglie solo la strada
     intera scritta dal gioco (gli altri aiuti si pagano in monete) */
  uguale('arrivato, con la carota, la strada tua: tre stelle', stelleDellaVittoria({ carota: true, svelato: false }), 3)
  uguale('senza la carota: due', stelleDellaVittoria({ carota: false, svelato: false }), 2)
  uguale('con la strada scritta dal gioco: due', stelleDellaVittoria({ carota: true, svelato: true }), 2)
  uguale('senza niente: una, e basta arrivare', stelleDellaVittoria({ carota: false, svelato: true }), 1)
}

/* ══════════ 2b. le carte: i cicli, e la fila modificata col dito ══════════ */
{
  /* la fila piatta e il suo albero */
  const f = programma('destra', ripeti(3, 'giu', ripeti(2, 'destra')), 'su')
  uguale('una fila coi cicli resta un elenco piatto', f.join(' '),
         'destra ripeti-3 giu ripeti-2 destra fine fine su')
  uguale('le chiusure non sono carte: nello zaino ne occupa sei', carteDi(f), 6)
  const a = albero(f)
  controlla('l\'albero sa dove sta ogni carta nella fila piatta',
            a.length === 3 && a[1].che === 'ripeti' && a[1].i === 1 && a[1].fine === 6 &&
            a[1].corpo[1].che === 'ripeti' && a[1].corpo[1].corpo[0].i === 4, JSON.stringify(a))
  uguale('la chiusura di un\'apertura', chiusuraDi(f, 1), 6)
  uguale('e l\'apertura di una chiusura', aperturaDi(f, 5), 3)
  controlla('una fila appaiata non ha guasti', guastiDellaFila(f).length === 0)
  controlla('una chiusura di troppo è un guasto', guastiDellaFila(['destra', FINE]).length > 0)
  controlla('un ciclo non chiuso è un guasto', guastiDellaFila([apri(3), 'destra']).length > 0)
  controlla('un ciclo vuoto è un guasto', guastiDellaFila([apri(3), FINE]).length > 0)
  controlla('ripetere dieci volte non si può', guastiDellaFila([apri(10), 'destra', FINE]).length > 0)
  uguale('una N ancora da scegliere si trova', daScegliere([apri(null), 'destra', FINE]).join(','), '0')

  /* eseguire */
  let r = esegui(L(['P....@', 'c.....']), programma(ripeti(5, 'destra')))
  controlla('🔁5 (→) fa cinque passi, e arriva', r.esito === TANA && r.passi.length === 5)
  controlla('la stessa carta torna a ogni giro, e si sa a che giro è',
            r.passi.every(p => p.i === 1) && r.passi.map(p => p.giri[0][1]).join('') === '12345' &&
            r.passi[0].giri[0][0] === 0 && r.passi[0].giri[0][2] === 5)
  r = esegui(L(['P....@', 'c.....']), programma(ripeti(9, 'destra')))
  controlla('arrivati alla tana si vince anche a metà di un ciclo', r.esito === TANA && r.passi.length === 5)
  r = esegui(L(['P...A.', 'c....@']), programma(ripeti(5, 'destra')))
  controlla('dentro un ciclo si sbatte come fuori, e si sa a che giro',
            r.esito === SBATTE && r.dove === 1 && r.passi.at(-1).giri[0][1] === 4,
            JSON.stringify(r.passi.at(-1).giri))
  r = esegui(L(['P......', '.......', '......@', 'c......']), programma(ripeti(2, ripeti(3, 'destra'), 'giu')))
  controlla('un ciclo dentro un ciclo: due giri fuori, tre dentro',
            r.esito === TANA && r.passi.length === 8 &&
            JSON.stringify(r.passi[1].giri) === JSON.stringify([[0, 1, 2], [1, 2, 3]]),
            JSON.stringify(r.passi.map(p => p.giri)))
  r = esegui(L(['P...', 'c..@']), [apri(null), 'destra', FINE, 'giu'])
  controlla('una N non scelta vale zero giri', r.passi.length === 1 && r.passi[0].mossa === 'giu')
  r = esegui(L(['P..', 'c.@']), programma(ripeti(9, ripeti(9, 'destra', 'sinistra'))))
  controlla('avanti e indietro senza fine: al coniglio gira la testa, e la fila si ferma',
            r.esito === STANCO && r.passi.length === PASSI_MAX, `${r.esito} dopo ${r.passi.length}`)

  /* modificare col dito: `motore/fila.js` */
  let m = mettiCiclo(['destra', 'giu'], 1)
  uguale('🔁 mette una scatola dove sta il cursore', m.fila.join(' '), 'destra ripeti-N fine giu')
  controlla('col cursore dentro, e la N da scegliere',
            m.cursore === 2 && m.apertura === 1 && daScegliere(m.fila)[0] === 1)
  m = mettiCarta(m.fila, m.cursore, 'destra')
  uguale('la carta dopo entra nella scatola', m.fila.join(' '), 'destra ripeti-N destra fine giu')
  uguale('il numero si sceglie', scegliVolte(m.fila, 1, 4).join(' '), 'destra ripeti-4 destra fine giu')
  const cinque = ['destra', apri(4), 'destra', 'giu', FINE, 'su']
  let t = togliPrima(cinque, 5)
  controlla('⌫ subito dopo una scatola la toglie intera',
            t.fila.join(' ') === 'destra su' && t.cursore === 1, JSON.stringify(t))
  t = togliPrima(cinque, 2)
  controlla('⌫ in cima al corpo toglie il 🔁 e lascia le sue frecce',
            t.fila.join(' ') === 'destra destra giu su' && t.cursore === 1, JSON.stringify(t))
  t = togliPrima(cinque, 4)
  controlla('⌫ dentro la scatola toglie la freccia prima',
            t.fila.join(' ') === 'destra ripeti-4 destra fine su' && t.cursore === 3, JSON.stringify(t))
  controlla('e nessuna modifica tocca la fila che riceve', cinque.join(' ') === 'destra ripeti-4 destra giu fine su')
  t = togliPrima(['destra'], 0)
  controlla('⌫ col cursore all\'inizio non toglie niente', t.fila.length === 1 && t.cursore === 0)
}

/* ══════════ 2c. le lastre, il «fino a» e il «se» ══════════ */
{
  /* le lastre: si camminano come il prato, fermano chi scivola, e un
     masso non ci va sopra */
  let r = esegui(L(['P**r*.', 'c....@']), ['destra'])
  controlla('una lastra ferma chi scivola sul ghiaccio, come il prato', r.esito === FINITA && dove(r).x === 3,
            JSON.stringify(dove(r)))
  uguale('un masso non si spinge su una lastra', esegui(L(['Pmr.', 'c..@']), ['destra']).esito, SBATTE)

  /* il «fino a»: si fa un giro, e alla fine di ogni giro si guarda sotto */
  r = esegui(L(['P..r.@', 'c.....']), programma(ripeti('rosso', 'destra')))
  controlla('🔁 fino al rosso (→) va avanti finché non arriva sulla lastra rossa',
            r.esito === FINITA && dove(r).x === 3 && r.passi.length === 3, JSON.stringify(dove(r)))
  controlla('e il giro si sa, ma senza totale', JSON.stringify(r.passi.map(p => p.giri[0][1])) === '[1,2,3]' &&
            r.passi[0].giri[0][2] === 'rosso')
  r = esegui(L(['r..r.@', 'P.....']), ['su', ...programma(ripeti('rosso', 'destra'))])
  controlla('almeno un giro sempre: chi parte dal rosso va al rosso dopo',
            dove(r).x === 3 && r.passi.length === 4, JSON.stringify(dove(r)))
  r = esegui(L(['P..r.@', 'c.....']), programma(ripeti('rosso', 'destra', 'destra')))
  controlla('guarda alla fine del giro, non a metà: due passi per giro scavalcano il rosso',
            r.esito === TANA && r.passi.length === 5, `${r.esito} dopo ${r.passi.length} passi`)
  r = esegui(L(['P....A', 'c...@.']), programma(ripeti('rosso', 'destra')))
  uguale('senza il rosso davanti si va finché si sbatte', r.esito, SBATTE)
  r = esegui(L(['P.....', 'c....@']), programma('giu', ripeti('casa', 'destra')))
  uguale('🔁 fino a casa (→) arriva a casa', r.esito, TANA)

  /* il «se»: si guarda una volta, e si fa o si salta */
  r = esegui(L(['Pr..@', 'c....']), programma('destra', se('rosso', 'destra'), 'destra'))
  controlla('❓ sul rosso: fa quello che ha dentro', r.esito === FINITA && dove(r).x === 3, JSON.stringify(dove(r)))
  r = esegui(L(['Pu..@', 'c....']), programma('destra', se('rosso', 'giu'), 'destra'))
  controlla('❓ non sul rosso: lo salta', r.esito === FINITA && dove(r).x === 2 && dove(r).y === 0,
            JSON.stringify(dove(r)))
  r = esegui(L(['Pur.@', 'c....']), programma('destra', ripeti('casa', se('blu', 'destra'), se('rosso', 'destra', 'destra'))))
  uguale('il coniglio legge le lastre una per una, fino a casa', r.esito, TANA)
  r = esegui(L(['P...@', 'c....']), programma(ripeti('casa', se('rosso', 'destra'))))
  controlla('un giro che non muove il coniglio non lo muoverà mai: la fila si ferma',
            r.esito === STANCO && r.passi.length === 0, r.esito)

  /* le teste nuove si scrivono, si leggono e si scelgono */
  controlla('le teste che non esistono sono un guasto',
            guastiDellaFila([apriSe(5), 'destra', FINE]).length > 0 &&
            guastiDellaFila([apri('verde'), 'destra', FINE]).length > 0 &&
            guastiDellaFila(programma(ripeti('casa', se('giallo', 'su')))).length === 0)
  const m = mettiScatola(['destra'], 1, apriSe(null))
  controlla('❓ nasce da scegliere, come il 🔁', m.fila.join(' ') === 'destra se-N fine' && daScegliere(m.fila)[0] === 1)
  uguale('e il colore si sceglie', scegliTesta(m.fila, 1, 'blu').join(' '), 'destra se-blu fine')
  uguale('come il fino a di un 🔁', scegliTesta(['ripeti-N', 'destra', FINE], 0, 'rosso').join(' '), 'ripeti-rosso destra fine')
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
  uguale(`${qui}: e trovata da soli vale tre stelle`, stelleDellaVittoria({ carota: r.carota, svelato: false }), 3)
  controlla(`${qui}: si vince anche senza la carota, e non più lunga`,
            !!m.senzaCarota && m.corta <= m.lunga)
  if (s.carta) {
    /* ── lo zaino ──
       La strada scritta freccia per freccia non ci sta (è il punto del
       gradino); le soluzioni scritte ci stanno, vincono con la carota e
       usano la carta; le mosse ingenue no. Nessuna soluzione fa più di
       cinquanta passi: `PASSI_MAX` deve restare lontano da una strada
       vera. */
    controlla(`${qui}: scritta freccia per freccia, la strada non sta nello zaino (${t.zaino})`,
              serveLaCarta(liv), `la più corta senza carota è di ${m.corta}`)
    for (const [k, sol] of t.soluzioni.entries()) {
      const rs = esegui(liv, sol)
      controlla(`${qui}: la soluzione ${k + 1} vince con la carota`, rs.esito === TANA && rs.carota,
                `${inFrecce(sol)} → ${rs.esito}`)
      controlla(`${qui}: e sta nello zaino, con dentro un ciclo`,
                carteDi(sol) <= t.zaino && conCicli(sol), `${carteDi(sol)} carte`)
      dentro(`${qui}: e fa meno di cinquanta passi`, rs.passi.length, 2, 50)
    }
    for (const fr of t.fragili || []) {
      const rf = esegui(liv, fr)
      controlla(`${qui}: la mossa ingenua ${inFrecce(fr)} non vince con la carota`,
                !(rf.esito === TANA && rf.carota), rf.esito)
    }
    nota(`${String(i + 1).padStart(2)}. ${t.nome.padEnd(26)} zaino ${String(t.zaino).padStart(2)}, ` +
         `sciolta ${String(m.corta).padStart(2)}   ${inFrecce(t.soluzioni[0])}`)
    continue
  }
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
  controlla('l\'ultima tappa dei piccoli mescola tutto: salto, ghiaccio, spinta, buca', (() => {
    const u = misura(Livello.da(CAMPAGNA[TAPPE_PICCOLE - 1])).usa
    return u.salto > 0 && u.scivola > 0 && u.spinta > 0 && u.buca > 0
  })())
}

/* ══════════ 4. gli aiuti ══════════ */
{
  /* chi segue soltanto gli aiuti, dalla fila vuota, arriva a casa con
     la carota: l'aiuto non manda mai in un vicolo cieco */
  for (const [i, t] of CAMPAGNA.entries()) {
    const liv = Livello.da(t)
    let fila = [], cur = 0, giri = 0, ultimo = null, sfora = false
    while (giri++ < 40) {
      ultimo = suggerisci(liv, fila)
      if (!ultimo || ultimo.che === 'via') break
      ;({ fila, cursore: cur } = seguiConsiglio(fila, cur, ultimo))
      if (t.zaino && carteDi(fila) > t.zaino) sfora = true
    }
    const r = esegui(liv, fila)
    controlla(`tappa ${i + 1}: seguendo solo gli aiuti si arriva a casa con la carota`,
              ultimo && ultimo.che === 'via' && r.esito === TANA && r.carota,
              `${inFrecce(fila)} → ${r.esito}`)
    if (t.zaino) controlla(`tappa ${i + 1}: e la fila degli aiuti non sfora mai lo zaino`, !sfora)
  }

  /* con lo zaino l'aiuto dice quattro cose diverse, e tutte e quattro si
     vedono nel viale (🔁5 (→) ↓) */
  const viale = Livello.da(CAMPAGNA[TAPPE_PICCOLE])
  let z = suggerisci(viale, [])
  controlla('a fila vuota, nel viale, l\'aiuto dice: qui ci va un 🔁 da cinque',
            z && z.che === 'scatola' && z.testa === 'ripeti-5' && z.cursore === 0, JSON.stringify(z))
  z = suggerisci(viale, programma(ripeti(4, 'destra')))
  controlla('con la scatola da quattro, dice di cambiarne il numero',
            z && z.che === 'testa' && z.apri === 0 && z.valore === 5, JSON.stringify(z))
  z = suggerisci(viale, programma(ripeti(5, 'destra', 'destra')))
  controlla('con una freccia di troppo nella scatola, dice di toglierla',
            z && z.che === 'togli' && z.cursore === 3, JSON.stringify(z))
  z = suggerisci(viale, programma(ripeti(5, 'destra')))
  controlla('con la scatola giusta, la freccia che manca, fuori dalla scatola',
            z && z.che === 'mossa' && z.mossa === 'giu' && z.cursore === 3, JSON.stringify(z))
  uguale('e a fila giusta, ▶', suggerisci(viale, CAMPAGNA[TAPPE_PICCOLE].soluzioni[0]).che, 'via')
  /* e coi colori: nei gradini storti la seconda scatola va «fino al rosso» */
  const storti = Livello.da(CAMPAGNA.find(t => t.chiave === 'gradini-storti'))
  z = suggerisci(storti, programma(ripeti(3)))
  controlla('dentro la scatola, l\'aiuto consiglia una scatola «fino al rosso»',
            z && z.che === 'scatola' && z.testa === 'ripeti-rosso' && z.cursore === 1, JSON.stringify(z))
  z = suggerisci(storti, programma(ripeti(3, ripeti(2, 'destra'), 'giu')))
  controlla('e una scatola da due, lì, la fa diventare «fino al rosso»',
            z && z.che === 'testa' && z.apri === 1 && z.valore === 'rosso', JSON.stringify(z))
  z = suggerisci(viale, [apri(null), 'destra', FINE])
  controlla('una N lasciata vuota: l\'aiuto dice quale numero',
            z && z.che === 'testa' && z.valore === 5, JSON.stringify(z))

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

  /* coi cicli: ogni battuta sa a che passo e a che giro è, e la parte già
     vista si conta in passi, non in carte */
  const t = CAMPAGNA.find(x => x.chiave === 'scala')
  const scala = Livello.da(t)
  const e = esegui(scala, t.soluzioni[0])
  const pc = new Proiezione(scala, e)
  controlla('coi cicli ogni battuta sa il suo passo e il suo giro',
            pc.battute.every(b => Number.isInteger(b.n) && b.giri && b.giri.length === 1))
  const b5 = pc.battute[5]
  const f5 = pc.fotogramma(b5.t0 + 0.001)
  controlla('e il fotogramma lo ripete, per la testa della scatola', f5.passo === b5.n && f5.giri === b5.giri)
  const sv = new Proiezione(scala, e, { veloci: 10 })
  controlla('i passi già visti scorrono veloci anche dentro un ciclo', sv.durata < pc.durata * 0.75,
            `${sv.durata.toFixed(2)} contro ${pc.durata.toFixed(2)}`)
  const stanco = esegui(L(['P..', 'c.@']), programma(ripeti(9, ripeti(9, 'destra', 'sinistra'))))
  const ps = new Proiezione(L(['P..', 'c.@']), stanco)
  controlla('quando gira la testa c\'è la scenetta, e poi si torna alla partenza',
            ps.errore && ps.fotogramma(ps.tScenetta + 0.1).coniglio.posa === 'stordito' &&
            ps.fotogramma(ps.durata + 0.5).tornato)
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
  /* le stelle dell'ultima medaglia sono tutte quelle delle tappe dei
     piccoli: la campagna si è allungata, e chi le aveva prese tutte
     non deve vedersi l'oro diventare d'argento */
  uguale('le stelle dell\'oro sono tre per ogni tappa dei piccoli', manifesto.albo.traguardi
    .find(t => t.id === 'pp-stelle').soglie.at(-1), TAPPE_PICCOLE * 3)
  const diIeri = {
    totals: { ppProve: 90, ppTane: 30, ppCarote: 20, ppDaSolo: 25 }, best: {}, items: {},
    campagne: { passo: { tappa: TAPPE_PICCOLE, libera: true,
                         stelle: Object.fromEntries(CAMPAGNA.slice(0, TAPPE_PICCOLE).map((_, i) => [i, 3])) } },
  }
  const mIeri = misure(diIeri)
  for (const id of ['pp-tappe', 'pp-stelle', 'pp-campagna'])
    controlla(`chi aveva finito le tappe dei piccoli tiene l'oro di «${id}»`,
              statoTraguardo(traguardi.find(t => t.id === id), mIeri).finito)
  uguale('e lo zaino comincia da zero', statoTraguardo(traguardi.find(t => t.id === 'pp-zaino'), mIeri).grado, 0)

  /* la riga della home */
  uguale('in home, all\'inizio', manifesto.riassunto({ tappa: 0, stelle: {} }), `tappa 1 di ${QUANTE_TAPPE} · Il prato`)
  controlla('a campagna finita parla del sentiero',
            manifesto.riassunto({ tappa: QUANTE_TAPPE, stelle: { 0: 3 } }).startsWith('tutte le tane'))
  controlla('e col record lo dice', manifesto.riassunto({ tappa: QUANTE_TAPPE, stelle: {},
    primato: { best: 5, quando: 1, partite: 2, ultime: [] } }).includes('5 di fila'))
  controlla('arrivato allo zaino, il record del sentiero lo dice lo stesso',
    manifesto.riassunto({ tappa: TAPPE_PICCOLE, stelle: {},
      primato: { best: 4, quando: 1, partite: 2, ultime: [] } }).includes('sentiero 4 di fila'))
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
