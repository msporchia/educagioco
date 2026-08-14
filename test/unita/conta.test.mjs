/* Verifica di «Conta gli animali», senza browser. Le cose che contano:
   i dati stanno in piedi, il generatore non produce mai una domanda
   ingiusta (risposta assente dalle opzioni, gettoni sovrapposti,
   distrattori mancanti, un'inclusione senza sottoinsieme proprio), e le
   dodici tappe si vincono **giocandole davvero** — anche da un bambino
   che sbaglia una risposta su quattro.
   `node test/esegui.mjs conta --niente-build` */
import { MONDI, guastiDeiMondi } from '../../src/giochi/conta/dati/mondi.js'
import { VERBI, guastiDeiVerbi } from '../../src/giochi/conta/dati/verbi.js'
import { CAMPAGNA, SCALINI, guastiDellaCampagna } from '../../src/giochi/conta/dati/campagna.js'
import { generaDomanda, MIN_DIST } from '../../src/giochi/conta/motore/scena.js'
import { Corsa } from '../../src/giochi/conta/motore/corsa.js'
import { gioca, rispostaGiocatore, caso } from '../../src/giochi/conta/motore/banco.js'
import manifesto from '../../src/giochi/conta/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { misure, statoTraguardo } from '../../src/store/progressi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
const guastiM = guastiDeiMondi()
controlla('i mondi non hanno guasti', guastiM.length === 0, guastiM.join(' · '))
const guastiV = guastiDeiVerbi()
controlla('i verbi non hanno guasti', guastiV.length === 0, guastiV.join(' · '))
const guastiC = guastiDellaCampagna(CAMPAGNA, MONDI, VERBI)
controlla('la campagna non ha guasti', guastiC.length === 0, guastiC.join(' · '))

controlla('quattro scalini', SCALINI.length === 4)
controlla('dodici tappe', CAMPAGNA.length === 12)
controlla('ogni tappa ha un mondo diverso dalla precedente',
          CAMPAGNA.every((t, i) => i === 0 || t.mondo !== CAMPAGNA[i - 1].mondo))
controlla('tutti e nove i verbi compaiono in campagna',
          new Set(CAMPAGNA.map(t => t.verbo)).size === Object.keys(VERBI).length)

const guastiAlbo0 = guastiDellAlbo([manifesto])
controlla('il blocco albo del manifesto non ha guasti', guastiAlbo0.length === 0, guastiAlbo0.join(' · '))

/* ══════════ 2. il generatore: migliaia di domande, mai una ingiusta ══════════ */
function contaPerSpecie(gettoni) {
  const m = new Map()
  for (const g of gettoni) if (g.bersaglio !== false) m.set(g.specie.chiave, (m.get(g.specie.chiave) || 0) + 1)
  return m
}

{
  const rnd = caso(1)
  let generate = 0
  let sovrapposti = 0, opzioniStorte = 0, doppioni = 0, senzaDistrattore = 0
  let inclusioneStorta = 0, fuoriScala = 0
  let dipiuTotali = 0, dipiuUguali = 0

  for (const t of CAMPAGNA) {
    for (let i = 0; i < 300; i++) {
      const d = generaDomanda(t, rnd)
      generate++

      if (d.opzioni) {
        if (!d.opzioni.some(o => Object.is(o.valore, d.rispostaGiusta))) opzioniStorte++
        if (new Set(d.opzioni.map(o => o.valore)).size !== d.opzioni.length) doppioni++
      }

      /* i gettoni non si sovrappongono, dentro ogni gruppo */
      for (const g of d.gruppi)
        for (let a = 0; a < g.gettoni.length; a++)
          for (let b = a + 1; b < g.gettoni.length; b++) {
            const dx = g.gettoni[a].x - g.gettoni[b].x, dy = g.gettoni[a].y - g.gettoni[b].y
            if (Math.hypot(dx, dy) < MIN_DIST - 0.01) sovrapposti++
          }

      if (d.verbo === 'quantiDi' || d.verbo === 'insieme')
        if (!d.gruppi[0].gettoni.some(g => g.bersaglio === false)) senzaDistrattore++

      if (d.verbo === 'inclusione' && d.rispostaGiusta !== 'insieme') inclusioneStorta++

      if (d.verbo === 'dipiu') {
        dipiuTotali++
        if (d.rispostaGiusta === 'uguale') dipiuUguali++
      }

      /* le quantità restano dentro l'intervallo dichiarato dalla tappa */
      const dentroRange = v => v >= t.min && v <= t.max
      switch (d.verbo) {
        case 'quanti': case 'stessi': case 'quantiDi':
          if (!dentroRange(d.rispostaGiusta)) fuoriScala++
          break
        case 'porta':
          if (!dentroRange(d.n)) fuoriScala++
          break
        case 'dipiu': case 'unisci':
          if (!dentroRange(d.gruppi[0].gettoni.length) || !dentroRange(d.gruppi[1].gettoni.length)) fuoriScala++
          break
        case 'insieme': case 'inclusione':
          if ([...contaPerSpecie(d.gruppi[0].gettoni).values()].some(n => n > t.max)) fuoriScala++
          break
        case 'piuUno': {
          const totale = d.gruppi[0].gettoni.length
          const iniziale = d.direzione === 'arriva' ? totale - 1 : totale
          if (!dentroRange(iniziale)) fuoriScala++
          break
        }
      }
    }
  }

  nota(`${generate} domande generate su ${CAMPAGNA.length} tappe`)
  controlla('la risposta giusta è sempre fra le opzioni', opzioniStorte === 0, `${opzioniStorte} storte`)
  controlla('le opzioni non hanno mai doppioni', doppioni === 0, `${doppioni} domande con doppioni`)
  controlla('i gettoni non si sovrappongono mai', sovrapposti === 0, `${sovrapposti} coppie troppo vicine`)
  controlla('«quantiDi» e «insieme» hanno sempre almeno un distrattore',
            senzaDistrattore === 0, `${senzaDistrattore} senza`)
  controlla('«inclusione» ha sempre il sottoinsieme proprio (mai capre = animali)',
            inclusioneStorta === 0, `${inclusioneStorta} ingiuste`)
  controlla('le quantità stanno nei limiti dichiarati dalla tappa', fuoriScala === 0, `${fuoriScala} fuori scala`)
  nota(`«sono uguali» in dipiu: ${dipiuUguali}/${dipiuTotali}`)
  dentro('«sono uguali» capita davvero, ma non sempre', dipiuUguali, dipiuTotali * 0.1, dipiuTotali * 0.5)
}

/* varietà: la stessa tappa, giocata con due semi diversi, non fa mai
   la stessa identica fila di domande */
{
  const t = CAMPAGNA[0]
  const unaFila = rnd => Array.from({ length: 6 }, () => generaDomanda(t, rnd).rispostaGiusta)
  const fila1 = unaFila(caso(10)), fila2 = unaFila(caso(77))
  controlla('due partite della stessa tappa non si somigliano identiche',
            JSON.stringify(fila1) !== JSON.stringify(fila2))
}

/* ══════════ 3. la corsa: una domanda sbagliata non avanza ══════════ */
{
  const t = CAMPAGNA[0]
  const corsa = new Corsa(t, { rnd: caso(5) })
  const primaDomanda = corsa.domanda
  const rispostaStorta = primaDomanda.opzioni
    ? primaDomanda.opzioni.find(o => !Object.is(o.valore, primaDomanda.rispostaGiusta)).valore
    : primaDomanda.n + 1

  controlla('rispondere storto non fa avanzare la corsa', corsa.rispondi(rispostaStorta) === false)
  uguale('la domanda resta la stessa: si conta insieme, non se ne genera un\'altra',
         corsa.domanda, primaDomanda)
  uguale('e l\'errore si conta', corsa.errori, 1)

  controlla('rispondere giusto invece avanza', corsa.rispondi(primaDomanda.rispostaGiusta) === true)
  controlla('e la domanda è cambiata', corsa.domanda !== primaDomanda)

  /* si finisce la tappa sbagliando ogni tanto: mai sotto una stella */
  while (!corsa.finita) {
    const d = corsa.domanda
    const storta = d.opzioni ? d.opzioni.find(o => !Object.is(o.valore, d.rispostaGiusta)).valore : d.n + 1
    corsa.rispondi(storta)      // un altro errore
    corsa.rispondi(d.rispostaGiusta)
  }
  controlla('anche sbagliando spesso si arriva comunque in fondo', corsa.finita)
  controlla('e vale almeno una stella', corsa.stelle >= 1)
}

/* ══════════ 4. le dodici tappe si vincono davvero ══════════ */
nota('tappa                              stelle (0 errori)   stelle (1 su 4)   errori')
for (const [i, t] of CAMPAGNA.entries()) {
  const perfetto = gioca(t, { rnd: caso(100 + i), tassoErrore: 0 })
  controlla(`tappa ${i + 1} (${t.nome}): chi non sbaglia mai prende tre stelle`,
            perfetto.finita && perfetto.stelle === 3)

  const distratto = gioca(t, { rnd: caso(200 + i), tassoErrore: 0.25 })
  controlla(`tappa ${i + 1} (${t.nome}): chi sbaglia una risposta su quattro arriva in fondo lo stesso`,
            distratto.finita && distratto.stelle >= 1)
  nota(`${(i + 1 + '. ' + t.nome).padEnd(34)} ${String(perfetto.stelle).padStart(15)}⭐` +
       `${String(distratto.stelle).padStart(18)}⭐${String(distratto.errori).padStart(10)}`)
}

/* ══════════ 5. il banco risponde come dice la domanda ══════════ */
{
  const t = CAMPAGNA.find(x => x.verbo === 'porta')
  const d = generaDomanda(t, caso(9))
  uguale('senza sbagliare, il banco tocca esattamente quanti gliene chiedono',
         rispostaGiocatore(d, caso(1), { tassoErrore: 0 }), d.n)
}

/* ══════════ 6. quello che il gioco porta all'albo ══════════
   Il gioco non è ancora registrato in `src/giochi/indice.js` — lo fa un
   altro lavoro in corso in parallelo sugli stessi file — quindi
   `TRAGUARDI`, `AREE` e `XP_AREA` (che leggono da lì) non vedono ancora
   «conta». Si controlla direttamente il blocco `albo` del manifesto, con
   `statoTraguardo()` e `misure()`: sono generiche, non passano dal
   registro, ed è la stessa strada che farà `progressi.js` una volta che
   il gioco sarà agganciato. */
{
  const vuoto = { totals: {}, best: {}, items: {}, campagne: {} }
  const mVuoto = misure(vuoto)
  controlla('a profilo vuoto non se n\'è preso nessuno',
            manifesto.albo.traguardi.every(t => statoTraguardo(t, mVuoto).grado === 0))
  uguale('e il gioco non risulta nemmeno provato', manifesto.albo.provato(mVuoto), false)
  uguale('e non vale esperienza', manifesto.albo.xp(mVuoto), 0)

  /* un bambino che ha finito la campagna con tutte e dodici le tappe a tre stelle */
  const finito = {
    totals: { contate: 500 }, best: { serieConta: 20 }, items: {},
    campagne: { conta: { tappa: CAMPAGNA.length, libera: true,
                         stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3])) } },
  }
  const mFinito = misure(finito)
  const presi = manifesto.albo.traguardi.map(t => statoTraguardo(t, mFinito))
  controlla('chi finisce tutto li prende tutti d\'oro', presi.every(s => s.finito),
            presi.filter(s => !s.finito).map(s => `${s.id} fermo a ${s.valore}`).join(' · '))
  controlla('e il gioco vale esperienza', manifesto.albo.xp(mFinito) > 0)
  controlla('e risulta provato', manifesto.albo.provato(mFinito) === true)

  uguale('le tappe si leggono dalla campagna nel profilo', mFinito.tappeDi(manifesto.chiave), CAMPAGNA.length)
  uguale('le stelle sono la somma dei primati per tappa', mFinito.stelleDi(manifesto.chiave), CAMPAGNA.length * 3)
  uguale('e la campagna finita si vede', mFinito.finita(manifesto.chiave), 1)
}

riassunto('conta gli animali')
