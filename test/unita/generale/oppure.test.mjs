/* ═══════════════════════════════════════════════════════════════════
   L'OPPURE — la disgiunzione che mancava a `vince` e `perde`
     node test/esegui.mjs oppure --niente-build

   `vince: [...]` e `perde: [...]` sono liste, e una lista è sempre
   stata una **e**: ci vogliono tutte. Mancava l'*oppure*, e da lì
   venivano finali assurdi — una lastra che esisteva solo per ragioni di
   sintassi, e un capitolo dove chi prende il ladro non vince e non
   perde, perché il suo obiettivo era «o l'uno o l'altro» e non c'era
   modo di scriverlo.

   La forma scelta è **una domanda che ne contiene altre**, non una
   seconda regola di lettura della lista:

       vince: [{ cond: 'oppure', fra: [se.ha(eroe, tesoro),
                                       se.caduto(ladro)] }]

   perché così vale **ovunque valga una domanda** — la guardia di un
   ciclo, i rami di un bivio, «aspetta che» — e non solo in fondo al
   livello. `entrambe` è il suo gemello, e serve a annidare: un `oppure`
   di `entrambe` è «o hai fatto tutte queste, o tutte quelle».
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, riassunto } from '../../aiuto/verifica.mjs'
import { livello, campo, cose, chi, fai, se } from '../../../src/data/livelli/scrivi.js'
import { creaMondo, esegui, guaiDi, testoCond, valutabile } from '../../../src/motore/generale.js'

const gioca = (liv, piano) => esegui(creaMondo(liv, 0), piano)
const detto = e => e.traccia.map(r => r.testo).join(' | ')
/* le due scorciatoie che un livello scriverà con `se.oppure(...)` il
   giorno che le fabbriche di `scrivi.js` le elencheranno: quello che
   producono è questo dato qui, identico */
const oppure = (...fra) => ({ cond: 'oppure', fra })
const entrambe = (...fra) => ({ cond: 'entrambe', fra })

/* ═══════════ 1. o l'uno o l'altro, e vince chi ne fa uno ═══════════ */
{
  const eroe = chi.eroe('eroe', { vista: 9 })
  const tesoro = cose.tesoro()
  const uscita = cose.posto('uscita', "l'uscita")
  const ladro = chi.nemico('ladro', 'il ladro', { vista: 0, vita: 1, sa: ['vai'] })

  const LIV = livello({
    id: 'prova-oppure-due-strade', nome: 'Il tesoro o il ladro', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##',
      '##|@@|..|T$|..|u1|..|##',
      '##|..|..|..|..|..|l1|##',
      '##|##|##|##|##|##|##|##',
    ], { '@@': eroe, 'T$': tesoro, 'u1': uscita, 'l1': ladro }),
    vince: [oppure(se.ha(eroe, tesoro), se.caduto(ladro))],
  })

  const col = gioca(LIV, { eroe: [fai.prendi(tesoro)] })
  controlla('oppure: basta il primo ramo', col.vinto, col.motivo)

  const contro = gioca(LIV, { eroe: [fai.attacca(ladro)] })
  controlla('oppure: e basta il secondo', contro.vinto, contro.motivo)

  const niente = gioca(LIV, { eroe: [fai.vai(uscita)] })
  controlla('oppure: ma non basta niente', !niente.vinto, niente.motivo)

  /* la lista resta una **e**: due voci accanto vogliono tutte e due */
  const ETUTTE = livello({ ...LIV, id: 'prova-oppure-e',
                           vince: [se.ha(eroe, tesoro), se.caduto(ladro)] })
  controlla('oppure: la lista di fianco resta una «e»',
            !gioca(ETUTTE, { eroe: [fai.prendi(tesoro)] }).vinto)
  controlla('oppure: e con tutte e due si vince',
            gioca(ETUTTE, { eroe: [fai.prendi(tesoro), fai.attacca(ladro)] }).vinto)

  /* ── COME SI LEGGE ──
     Una domanda sa dirsi da sé, e questa dice anche il suo contrario in
     italiano: non «non (A oppure B)», ma «né A né B». */
  const m = creaMondo(LIV, 0)
  const q = oppure(se.ha(eroe, tesoro), se.caduto(ladro))
  uguale('oppure: si legge come si direbbe', testoCond(m, q),
         'hai il tesoro oppure il ladro è fuori combattimento')
  uguale('oppure: e il suo contrario è «né … né …»', testoCond(m, { ...q, non: true }),
         'né hai il tesoro né il ladro è fuori combattimento')
  uguale('entrambe: si legge con la e', testoCond(m, entrambe(se.ha(eroe, tesoro), se.caduto(ladro))),
         'hai il tesoro e il ladro è fuori combattimento')

  /* ── E NON SI VALUTA QUELLO CHE NON STA IN PIEDI ──
     Un `oppure` vuoto non è «sempre vero», è una domanda scritta male;
     e uno che nomina una cosa che in questa stanza non c'è va rifiutato
     come qualunque altra domanda. */
  controlla('oppure: uno vuoto non è valutabile', !valutabile(m, oppure()))
  controlla('oppure: uno che nomina una cosa che non c\'è nemmeno',
            !valutabile(m, oppure(se.ha(eroe, tesoro), se.aperto('portoneCheNonEsiste'))))
  controlla('oppure: uno tutto sano sì', valutabile(m, oppure(se.ha(eroe, tesoro), se.caduto(ladro))))
}

/* ═══════════ 2. anche la sconfitta ═══════════ */
{
  const eroe = chi.eroe('eroe', { vista: 9 })
  const chiave = cose.chiave()
  const rossa = cose.oggetto('rossa', 'la rossa', { pittore: 'chiave', tasca: true })
  const portone = cose.porta('portone', 'il portone', { chiave: 'chiave' })
  const tesoro = cose.forziere()

  const LIV = livello({
    id: 'prova-oppure-perde', nome: 'Una chiave sola', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##',
      '##|@@|..|k1|..|p1|T$|##',
      '##|..|..|r1|..|##|..|##',
      '##|##|##|##|##|##|##|##',
    ], { '@@': eroe, 'k1': chiave, 'r1': rossa, 'p1': portone, 'T$': tesoro }),
    vince: [se.aperto(tesoro)],
    /* si perde se te le porti via tutte e due: è un `entrambe` dentro
       `perde`, cioè l'altra metà della stessa cosa */
    perde: [entrambe(se.ha(eroe, chiave), se.ha(eroe, rossa))],
    motivoSconfitta: 'Non si portano via tutte e due le chiavi.',
  })

  const buono = gioca(LIV, { eroe: [fai.prendi(chiave), fai.apri(portone), fai.apri(tesoro)] })
  controlla('oppure: con una chiave sola si vince', buono.vinto, buono.motivo)

  const ingordo = gioca(LIV, {
    eroe: [fai.prendi(chiave), fai.prendi(rossa), fai.apri(portone), fai.apri(tesoro)],
  })
  controlla('oppure: con tutte e due si perde', !ingordo.vinto)
  uguale('oppure: e con il motivo scritto dal livello', ingordo.motivo,
         'Non si portano via tutte e due le chiavi.')
}

/* ═══════════ 3. e vale ovunque valga una domanda ═══════════ */
{
  const eroe = chi.eroe('eroe', { vista: 9 })
  const chiave = cose.chiave()
  const rossa = cose.oggetto('rossa', 'la rossa', { pittore: 'chiave', tasca: true })
  const portone = cose.porta('portone', 'il portone', { chiave: 'chiave' })
  const tesoro = cose.forziere()

  const LIV = livello({
    id: 'prova-oppure-bivio', nome: 'L\'oppure nel bivio', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##',
      '##|@@|..|k1|..|p1|T$|##',
      '##|..|..|r1|..|##|..|##',
      '##|##|##|##|##|##|##|##',
    ], { '@@': eroe, 'k1': chiave, 'r1': rossa, 'p1': portone, 'T$': tesoro }),
    vince: [se.aperto(tesoro)],
  })

  /* «se hai una qualsiasi delle due chiavi vai dritto, se no vai a
     prenderne una»: prima si scriveva con due bivi annidati */
  const piano = { eroe: [
    fai.bivio(oppure(se.ha(eroe, chiave), se.ha(eroe, rossa)),
              [fai.apri(portone)],
              [fai.prendi(chiave), fai.apri(portone)]),
    fai.apri(tesoro),
  ] }
  uguale('oppure: un piano che ne contiene uno non viene rifiutato',
         guaiDi(creaMondo(LIV, 0), piano).length, 0)
  const e = gioca(LIV, piano)
  controlla('oppure: e si gioca dentro un bivio', e.vinto, e.motivo)
  controlla('oppure: la riga di registro lo racconta per esteso',
            detto(e).includes('hai la chiave oppure hai la rossa'), detto(e))

  /* dentro un ciclo, come guardia d'uscita: si smette quando UNA delle
     due è vera */
  const ciclo = { eroe: [
    fai.ripeti([fai.vai(rossa), fai.vai(chiave), fai.prendi(chiave)],
               oppure(se.ha(eroe, chiave), se.ha(eroe, rossa))),
    fai.apri(portone), fai.apri(tesoro),
  ] }
  controlla('oppure: e come uscita di un ciclo', gioca(LIV, ciclo).vinto)

  /* annidato: «o le hai tutte e due, oppure hai aperto il portone» */
  const misto = oppure(entrambe(se.ha(eroe, chiave), se.ha(eroe, rossa)), se.aperto(portone))
  const MISTO = livello({ ...LIV, id: 'prova-oppure-misto', vince: [misto] })
  controlla('oppure: si annidano — due su due da una parte',
            gioca(MISTO, { eroe: [fai.prendi(chiave), fai.prendi(rossa)] }).vinto)
  controlla('oppure: … o l\'altra strada dall\'altra',
            gioca(MISTO, { eroe: [fai.prendi(chiave), fai.apri(portone)] }).vinto)
  controlla('oppure: e mezza da una parte non basta',
            !gioca(MISTO, { eroe: [fai.prendi(rossa)] }).vinto)
}

/* ═══════════ 4. e non mente su quello che non si può sapere ═══════════
   Una domanda può rifiutarsi di rispondere a un personaggio che non
   vede (`NonPossoSaperlo`: il portone dall'altra parte della mappa).
   L'`oppure` non trasforma quel rifiuto in un «falso» comodo: risponde
   quando la risposta è decisa comunque, e negli altri casi ripropaga il
   dubbio. */
{
  const eroe = chi.eroe('eroe', { vista: 2 })
  const chiave = cose.chiave()
  const lontano = cose.porta('lontano', 'il portone in fondo', { aperta: false, aMano: false })
  const tesoro = cose.forziere()

  const LIV = livello({
    id: 'prova-oppure-buio', nome: 'Quello che non si vede', prove: 0,
    scena: campo([
      '##|##|##|##|##|##|##|##|##|##|##',
      '##|@@|k1|..|..|..|..|..|..|p9|##',
      '##|..|..|..|..|..|..|..|..|T$|##',
      '##|##|##|##|##|##|##|##|##|##|##',
    ], { '@@': eroe, 'k1': chiave, 'p9': lontano, 'T$': tesoro }),
    vince: [se.ha(eroe, chiave)],
  })

  /* il ramo che l'eroe SA rispondere è vero: la risposta è decisa, e il
     portone che non vede non c'entra più niente */
  const deciso = { eroe: [
    fai.prendi(chiave),
    fai.bivio(oppure(se.ha(eroe, chiave), se.aperto(lontano)), [fai.vai(chiave)], []),
  ] }
  const d = gioca(LIV, deciso)
  controlla('oppure: un ramo vero decide, anche se un altro è al buio', d.vinto, d.motivo)
  controlla('oppure: e nessuno si ferma a chiedere lumi',
            !detto(d).includes('me lo deve dire qualcuno'), detto(d))

  /* se invece nessun ramo è deciso, il dubbio arriva a chi ha chiesto —
     e chi aspetta si ferma dicendo che glielo deve dire qualcuno */
  const alBuio = { eroe: [
    fai.aspettaChe(oppure(se.ha(eroe, chiave), se.aperto(lontano))),
  ] }
  const b = gioca(LIV, alBuio)
  controlla('oppure: se nessun ramo è deciso, il dubbio resta un dubbio',
            detto(b).includes('me lo deve dire qualcuno'), detto(b))
  controlla('oppure: e la scena si chiude dicendo perché', !b.vinto, b.motivo)
}

riassunto('oppure')
