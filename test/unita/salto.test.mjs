/* ═══════════════════════════════════════════════════════════════════
   IL TASTO «SALTA» PER PROVARE I GIOCHI

   Un salto dà una domanda per giusta senza che nessuno abbia risposto, e
   non deve lasciare traccia di quello che il gioco chiede ai bambini:
   niente ripasso (né giusta né sbagliata), niente monete, niente
   contatori. Il browser prova lo schermo (`integrazione/salto`); qui si
   prova ciò che si può provare senza: i motori, uno per uno, dove il
   salto passa per un metodo suo. Il guasto da non rifare è il salto che
   «funziona» perché si limita a chiamare la risposta giusta — e allora
   paga, annota e conta come se l'avesse data un bambino.
   Vedi docs/core/comandi.md.
   `node test/esegui.mjs salto --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { domanda, testo, rispostaSaltata } from '../../src/quiz/nucleo/domanda.js'
import { sorteQualunque } from '../../src/quiz/nucleo/sorte.js'
import { saltoAcceso, accendiSalto, avviaSalto } from '../../src/store/salto.js'
import { load, flush } from '../../src/store/storage.js'
import { newItem } from '../../src/store/srs.js'

import { Sessione as SessioneEn } from '../../src/giochi/inglese/motore/sessione.js'
import { TAPPE as TAPPE_EN } from '../../src/giochi/inglese/dati/mondi.js'
import { rispostaGiusta as libroEn, eGiusta as eGiustaEn } from '../../src/giochi/inglese/motore/libro.js'
import { Sessione as SessioneEs } from '../../src/giochi/spagnolo/motore/sessione.js'
import { TAPPE as TAPPE_ES } from '../../src/giochi/spagnolo/dati/mondi.js'
import { rispostaGiusta as libroEs, eGiusta as eGiustaEs } from '../../src/giochi/spagnolo/motore/libro.js'

import { CAMPAGNA as POZIONI, MONETE_A_DOSE } from '../../src/giochi/pozioni/dati/campagna.js'
import { Partita as PartitaPozioni } from '../../src/giochi/pozioni/motore/partita.js'
import { caso as casoPozioni } from '../../src/giochi/pozioni/motore/banco.js'

import { CAMPAGNA as PRIMA_DOPO } from '../../src/giochi/prima-dopo/dati/campagna.js'
import { VERBI, CHIAVI_VERBI } from '../../src/giochi/prima-dopo/dati/verbi.js'
import { STORIE } from '../../src/giochi/prima-dopo/dati/storie.js'
import { generaQuesito } from '../../src/giochi/prima-dopo/motore/quesito.js'
import { Corsa as CorsaPrimaDopo } from '../../src/giochi/prima-dopo/motore/corsa.js'
import { caso as casoPrimaDopo } from '../../src/giochi/prima-dopo/motore/banco.js'

import { CAMPAGNA as CODICI } from '../../src/giochi/codice-segreto/dati/campagna.js'
import { Regole, Partita as PartitaCodice } from '../../src/giochi/codice-segreto/motore/partita.js'
import { Corsa as CorsaCodice } from '../../src/giochi/codice-segreto/motore/corsa.js'
import { caso as casoCodice } from '../../src/giochi/codice-segreto/motore/banco.js'

import { CAMPAGNA as SOTTERRANEO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { Corsa as CorsaSotterraneo } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'

import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. l'evento di una domanda saltata ══════════ */
{
  const d = domanda({ testo: 'Quanto fa 2 + 2?', buona: testo('4'), falsi: [testo('3'), testo('5')],
                      chiave: 'math:2+2', sorte: sorteQualunque() })
  const e = rispostaSaltata(d)
  uguale('è una risposta giusta', e.giusto, true)
  uguale('porta la bandiera che dice di non contarla', e.saltata, true)
  uguale('l\'indice è quello della risposta giusta', e.indice, d.giusta)
  uguale('la chiave è quella della domanda', e.chiave, 'math:2+2')
  uguale('nessuno l\'ha guardata: tempo zero', e.tempo, 0)
  uguale('e non è «di fretta»: la fretta punisce chi sbaglia', e.diFretta, false)
}

/* ══════════ 2. l'interruttore è del dispositivo e si ricorda ══════════ */
{
  uguale('di partenza è spento', saltoAcceso.value, false)
  await accendiSalto(true)
  uguale('acceso', saltoAcceso.value, true)
  await flush()
  const letto = await load('tasto-salta')
  controlla('in archivio sta un oggetto, mai il booleano nudo (docs/core/archivio.md)',
            letto && letto.acceso === true, JSON.stringify(letto))
  saltoAcceso.value = false
  uguale('alla ripartenza si rilegge acceso', await avviaSalto(), true)
  await accendiSalto(false)
  uguale('spento di nuovo', saltoAcceso.value, false)
  uguale('e si ricorda spento', (await load('tasto-salta')).acceso, false)
}

/* ══════════ 3. inglese e spagnolo: la tappa avanza, il ripasso non sente ══════════ */
for (const [nome, Sessione, TAPPE, libro, eGiusta] of [
  ['inglese', SessioneEn, TAPPE_EN, libroEn, eGiustaEn],
  ['spagnolo', SessioneEs, TAPPE_ES, libroEs, eGiustaEs],
]) {
  const frasi = TAPPE.find(t => t.frasi && !t.bandiera)
  for (const [che, tappa, presenta] of [['parole', TAPPE.find(t => t.parole && t.parole.length && !t.frasi), false],
                                        ['frasi', frasi, false],
                                        ['frasi con la presentazione', frasi, true]]) {
    if (!tappa) { controlla(`${nome}: c'è una tappa di ${che}`, false); continue }
    const items = {}
    const itemDi = k => items[k] || (items[k] = newItem())
    const s = new Sessione({ tappa, itemDi, presenta })
    let giri = 0, registrate = 0, pagate = 0
    while (!s.finita && giri++ < 400) {
      const q = s.prossima()
      if (!q) break
      const dopo = JSON.stringify(items)
      const e = s.salta(q)
      registrate += e.registra.length
      if (e.paga) pagate++
      if (JSON.stringify(items) !== dopo) registrate++
    }
    controlla(`${nome} (${che}): saltando si arriva in fondo alla tappa`, s.finita, `giri ${giri}`)
    uguale(`${nome} (${che}): niente da mandare al ripasso`, registrate, 0)
    uguale(`${nome} (${che}): niente da pagare`, pagate, 0)
    uguale(`${nome} (${che}): nessun errore`, s.errori, 0)
    controlla(`${nome} (${che}): le giuste arrivano al bersaglio`, s.giuste >= s.bersaglio,
              `${s.giuste}/${s.bersaglio}`)
  }

  // le domande del libro: la risposta giusta si trova per ogni tipo
  const finte = [
    { tipo: 'scelta', opzioni: [{ giusta: false }, { giusta: true }] },
    { tipo: 'frase', giusta: 3 },
    { tipo: 'ordine', soluzione: ['a', 'b', 'c'] },
  ]
  for (const dom of finte)
    controlla(`${nome}: la risposta giusta del libro (${dom.tipo}) è giusta davvero`,
              eGiusta(dom, libro(dom)))
}

/* ══════════ 4. le pozioni: la dose è fatta, ma non vale monete né stelle ══════════ */
{
  const t = POZIONI[1]
  const p = new PartitaPozioni(t, { rnd: casoPozioni(3) })
  let annotate = 0, giri = 0
  while (!p.finita && giri++ < 200) {
    const e = p.salta()
    if (!e) break
    if (e.annota) annotate++
    uguale('l\'esito è una dose giusta', e.tipo, 'giusto')
    p.riprendi()
  }
  controlla('saltando si arriva in fondo alla tappa', p.finita, `giri ${giri}`)
  uguale('niente da annotare', annotate, 0)
  uguale('nessuna dose conta come giusta: niente monete', p.monete, 0)
  uguale('e quindi MONETE_A_DOSE non scatta mai', p.dosiGiuste * MONETE_A_DOSE, 0)
  uguale('nessuno sbaglio', p.sbagli, 0)
  uguale('una pozione saltata non è perfetta', p.perfette, 0)
  controlla('le pozioni vanno avanti comunque', p.pozioni === t.clienti, `${p.pozioni}/${t.clienti}`)
  controlla('ogni dose ha una riga, e nessuna con una chiave per il ripasso',
            p.dosi.length > 0 && p.dosi.every(d => d.chiave === null && !d.chiesta))
}
{
  const t = POZIONI[1]
  const p = new PartitaPozioni(t, { rnd: casoPozioni(4) })
  uguale('un salto e un tentativo vero non si mischiano: dopo un esito il salto non fa nulla',
         (p.prendi(p.ricetta.scaffale.find(s => !p.ricetta.ingredienti.some(i => i.nome === s.nome)).nome), p.salta()), null)
}

/* ══════════ 5. prima e dopo: ogni forma di quesito si risolve da sola ══════════ */
{
  const vistiTipi = new Set()
  for (const chiave of CHIAVI_VERBI) {
    const verbo = VERBI[chiave]
    const idonee = STORIE.filter(s => s.passi.length >= (verbo.minPassi || 3))
    const rnd = casoPrimaDopo(11)
    const q = generaQuesito(verbo, idonee[0], idonee.slice(1), rnd)
    vistiTipi.add(q.tipo)
    controlla(`${chiave}: si risolve`, q.risolvi() === true)
    uguale(`${chiave}: l'esito è giusto`, q.esito, 'giusta')
    uguale(`${chiave}: finita`, q.finita, true)
    uguale(`${chiave}: una volta chiusa non si risolve due volte`, q.risolvi(), false)
  }
  controlla('si sono provate tutte e tre le forme (ordina, scegli, intruso)', vistiTipi.size === 3,
            [...vistiTipi].join(','))
  for (const t of [PRIMA_DOPO[0], PRIMA_DOPO.at(-1)]) {
    const c = CorsaPrimaDopo.perTappa(t, { rnd: casoPrimaDopo(5) })
    let giri = 0
    while (!c.finita && giri++ < 100) { c.quesito.risolvi(); c.registraSuccesso(); c.avanti() }
    controlla(`${t.nome}: saltando la tappa si finisce`, c.finita, `giri ${giri}`)
    uguale(`${t.nome}: zero errori`, c.errori, 0)
    uguale(`${t.nome}: tre stelle`, c.stelle, 3)
  }
}

/* ══════════ 6. codice segreto: indovinato alla prima riga, ma non paga ══════════ */
{
  const regole = Regole.perTappa(CODICI[0])
  const p = new PartitaCodice(regole, { rnd: casoCodice(7) })
  const prova = p.salta()
  controlla('il salto dà una prova tutta piena', prova && prova.giusta)
  uguale('la partita è vinta', p.vinta, true)
  uguale('è finita', p.finita, true)
  uguale('è segnata come saltata', p.saltata, true)
  uguale('non vale monete', p.monete, 0)
  controlla('le stelle ci sono (la tappa deve poter finire)', p.stelle >= 1, `${p.stelle}`)
  uguale('una partita finita non si salta due volte', p.salta(), null)
  const c = CorsaCodice.perTappa(CODICI[0], { rnd: casoCodice(8) })
  let giri = 0
  while (!c.finita && giri++ < 50) { c.partita.salta(); c.registra(); c.avanti() }
  controlla('saltando la tappa si finisce', c.finita, `giri ${giri}`)
  uguale('e la tappa non ha incassato niente', c.monete, 0)
}

/* ══════════ 7. sotterraneo: il mondo risponde, ma la domanda non è data ══════════ */
{
  const apri = seme => {
    const c = new CorsaSotterraneo(SOTTERRANEO[1], { seme, rnd: seminato(seme) })
    const f = c.livello.robe.find(r => r.che === 'forziere')
    c.foglio = { che: 'forziere', chi: f }
    return c
  }
  const vera = apri(21), salta = apri(21)
  const ev = vera.rispondi(true)
  const es = salta.rispondi(true, { saltata: true })
  uguale('la risposta vera conta una domanda', vera.domande, 1)
  uguale('e una giusta', vera.giuste, 1)
  uguale('il salto non conta domande', salta.domande, 0)
  uguale('e non conta giuste (che pagano l\'abisso)', salta.giuste, 0)
  uguale('ma nel mondo succede la stessa cosa', es.che, ev.che)
}

nota('il salto passa dai motori senza lasciare traccia')
riassunto()
