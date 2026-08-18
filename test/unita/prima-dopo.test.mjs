/* Verifica di Prima e dopo, senza browser. Le quattro cose che contano:
   i dati stanno in piedi, il generatore di quesiti non regala mai la
   risposta e non fa mai un intruso o un distrattore giusto, le dieci
   tappe si vincono **giocandole davvero** col giocatore finto — anche
   uno che sbaglia una risposta su quattro — e una tappa rigiocata non
   ripropone sempre la stessa fila di storie.
   `node test/esegui.mjs prima-dopo` */
import { STORIE, CATEGORIE, guastiDelleStorie } from '../../src/giochi/prima-dopo/dati/storie.js'
import { SCENE, CHIAVI_SCENE, èScena, guastiDelleScene } from '../../src/giochi/prima-dopo/dati/scene.js'
import { PITTORI } from '../../src/giochi/prima-dopo/scena/tela.js'
import { LUOGHI } from '../../src/giochi/prima-dopo/scena/cose.js'
import { VERBI, CHIAVI_VERBI, verbo as datiVerbo, guastiDeiVerbi } from '../../src/giochi/prima-dopo/dati/verbi.js'
import { CAMPAGNA, SCALINI, QUANTE_TAPPE, guastiDellaCampagna } from '../../src/giochi/prima-dopo/dati/campagna.js'
import { generaQuesito, spiegazione } from '../../src/giochi/prima-dopo/motore/quesito.js'
import { DIDASCALIE, didascalia, ordinale, guastiDelleDidascalie } from '../../src/giochi/prima-dopo/dati/didascalie.js'
import { storieIdonee } from '../../src/giochi/prima-dopo/motore/corsa.js'
import { gioca, storieProposte, caso } from '../../src/giochi/prima-dopo/motore/banco.js'
import manifesto from '../../src/giochi/prima-dopo/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { misure, statoTraguardo } from '../../src/store/progressi.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
const guastiStorie = guastiDelleStorie(STORIE, SCENE)
controlla('le storie non hanno guasti', guastiStorie.length === 0, guastiStorie.join(' · '))
const guastiDid = guastiDelleDidascalie(STORIE)
controlla('ogni passo ha la sua didascalia, e nessuna avanza',
          guastiDid.length === 0, guastiDid.join(' · '))
const guastiVerbi = guastiDeiVerbi()
controlla('i verbi non hanno guasti', guastiVerbi.length === 0, guastiVerbi.join(' · '))
const guastiCam = guastiDellaCampagna(CAMPAGNA, STORIE, VERBI)
controlla('la campagna non ha guasti', guastiCam.length === 0, guastiCam.join(' · '))

controlla('almeno quaranta storie', STORIE.length >= 40, `sono ${STORIE.length}`)
controlla('sette categorie', CATEGORIE.length === 7, `sono ${CATEGORIE.length}`)
controlla('tre scalini', SCALINI.length === 3)
controlla('dieci tappe', CAMPAGNA.length === 10)
controlla('sei verbi', CHIAVI_VERBI.length === 6)
controlla('la campagna comincia con "ordina3" (tre figure)', CAMPAGNA[0].verbo === 'ordina3')
controlla('la campagna finisce mescolando tutti i verbi', CAMPAGNA.at(-1).verbo === 'mescolato')
controlla('nessuna tappa facile pesca dalle storie ambigue al contrario', CAMPAGNA
  .filter(t => t.scalino === 'facile')
  .every(t => storieIdonee(t, datiVerbo(t.verbo), STORIE).every(s => !s.ambiguaAlContrario)))

/* ══════════ 1-bis. le storie disegnate ══════════
   Quello che una vignetta *sembra* non lo dice nessun test — gli occhi
   ce li mette `strumenti/banco/storie.html`. Qui si controlla il resto,
   che è la parte che si rompe in silenzio: una scena nominata da una
   storia e mai disegnata sarebbe un riquadro vuoto in partita, e un
   `che` senza pittore una figura che non compare. */
{
  const guastiScene = guastiDelleScene(SCENE, LUOGHI, PITTORI)
  controlla('le scene non hanno guasti', guastiScene.length === 0, guastiScene.join(' · '))

  const disegnate = STORIE.filter(s => s.disegnata)
  controlla('ci sono storie disegnate', disegnate.length >= 10, `sono ${disegnate.length}`)
  /* con una sola storia disegnata in una categoria, i distrattori della
     stessa famiglia non bastano e il quesito ripiega sulle emoji (è
     dichiarato in `motore/quesito.js`, ma è un ripiego). Due per
     categoria è il minimo perché una tappa monocategoria — la 1, la 2,
     la 3 — possa fare una domanda tutta disegnata. */
  for (const c of new Set(disegnate.map(s => s.categoria))) {
    const quante = disegnate.filter(s => s.categoria === c).length
    controlla(`la categoria "${c}" ha almeno due storie disegnate`, quante >= 2, `ne ha ${quante}`)
  }
  controlla('una storia disegnata lo è in tutti i suoi passi',
            disegnate.every(s => s.passi.every(èScena)))
  controlla('e nessuna storia a emoji nomina una scena',
            STORIE.filter(s => !s.disegnata).every(s => s.passi.every(p => !èScena(p))))

  /* una scena disegnata e mai usata è lavoro buttato, e soprattutto è
     il segno che una storia è stata riscritta lasciandosi indietro un
     pezzo */
  const usate = new Set(STORIE.flatMap(s => s.passi))
  const orfane = CHIAVI_SCENE.filter(c => !usate.has(c))
  controlla('nessuna scena resta senza storia', orfane.length === 0, orfane.join(' · '))
}

/* ══════════ 2. il generatore: migliaia di quesiti ══════════ */
{
  const rnd = caso(1234)
  let generati = 0
  let spargimentoOrdinato = 0        // le vignette sparse arrivate già in ordine: un regalo
  let rispostaStorta = 0             // zero o più di una opzione "giusta", o non è quella attesa
  let distrattoreNellaStoria = 0     // un distrattore che è anche un passo vero della storia
  let opzioniDoppie = 0              // due opzioni con la stessa emoji
  let intrusoVero = 0                // l'intruso che in realtà appartiene alla storia

  for (const t of CAMPAGNA) {
    for (let i = 0; i < 400; i++) {
      const v = t.verbo === 'mescolato'
        ? datiVerbo(CHIAVI_VERBI[Math.floor(rnd() * CHIAVI_VERBI.length)])
        : datiVerbo(t.verbo)
      const idonee = storieIdonee(t, v, STORIE)
      if (!idonee.length) continue
      const storia = idonee[Math.floor(rnd() * idonee.length)]
      const altre = idonee.filter(s => s.chiave !== storia.chiave)
      const q = generaQuesito(v, storia, altre, rnd)
      generati++

      if (q.tipo === 'ordina') {
        if (q.sparse.every((x, idx) => x.id === idx)) spargimentoOrdinato++
      } else if (q.tipo === 'scegli') {
        const giuste = q.opzioni.filter(o => o.giusta)
        if (giuste.length !== 1 || giuste[0].emoji !== q.corretta) rispostaStorta++
        for (const o of q.opzioni)
          if (!o.giusta && storia.passi.includes(o.emoji)) distrattoreNellaStoria++
        if (new Set(q.opzioni.map(o => o.emoji)).size !== q.opzioni.length) opzioniDoppie++
      } else if (q.tipo === 'intruso') {
        const intruso = q.vignette.find(x => x.intruso)
        if (storia.passi.includes(intruso.emoji)) intrusoVero++
      }
    }
  }

  controlla('generati migliaia di quesiti', generati >= 2000, `solo ${generati}`)
  controlla('le vignette sparse non arrivano mai già in ordine giusto',
            spargimentoOrdinato === 0, `${spargimentoOrdinato} volte su ${generati}`)
  controlla('la risposta giusta è sempre fra le opzioni, e una sola volta',
            rispostaStorta === 0, `${rispostaStorta} quesiti storti`)
  controlla("i distrattori non sono mai un'emoji della storia in corso",
            distrattoreNellaStoria === 0, `${distrattoreNellaStoria} volte`)
  controlla('le tre opzioni non hanno mai doppioni', opzioniDoppie === 0, `${opzioniDoppie} volte`)
  controlla("l'intruso non appartiene mai davvero alla storia",
            intrusoVero === 0, `${intrusoVero} volte`)
}

/* ══════════ 3. un quesito, da vicino ══════════ */
{
  const storia = STORIE.find(s => s.chiave === 'seme-albero')
  const q = generaQuesito(datiVerbo('ordina3'), storia, [], caso(1))
  uguale('la sequenza corretta è la storia intera', JSON.stringify(q.sequenza), JSON.stringify(storia.passi))
  controlla('si comincia senza niente in nessuna buca', q.posate.every(x => x === null))
  /* si tocca nell'ordine giusto: la buca 0 prende il primo id, e così via */
  const inOrdine = q.sequenza.map((_, id) => id)
  inOrdine.forEach(id => q.tocca(id))
  uguale('toccando nell\'ordine giusto il quesito è vinto', q.esito, 'giusta')

  const q2 = generaQuesito(datiVerbo('ordina3'), storia, [], caso(2))
  const invertito = q2.sequenza.map((_, id) => id).reverse()
  invertito.forEach(id => q2.tocca(id))
  uguale('toccando alla rovescia il quesito è perso', q2.esito, 'sbagliata')

  /* si tocca due volte la stessa vignetta: la prima la posa, la seconda la toglie */
  const q3 = generaQuesito(datiVerbo('ordina3'), storia, [], caso(3))
  uguale('la prima volta la posa', q3.tocca(0), 'posata')
  uguale('la seconda volta la toglie', q3.tocca(0), 'tolta')
  controlla('e la buca torna vuota', q3.posate.every(x => x === null))
}
{
  /* "manca": tre passi di fila della storia, quello in mezzo tolto.
     La storia è quella disegnata della mattina — quattro passi, quindi
     la finestra può cominciare dal primo o dal secondo: il quesito è lo
     stesso che una fila di emoji, ed è il punto — il motore non
     distingue. */
  const storia = STORIE.find(s => s.chiave === 'la-mattina')
  const altre = storieIdonee(CAMPAGNA[3], datiVerbo('manca'), STORIE).filter(s => s !== storia)
  const q = generaQuesito(datiVerbo('manca'), storia, altre.length ? altre : STORIE, caso(4))
  controlla('il buco è nel mezzo', q.mostrati[1] === null)
  const da = storia.passi.indexOf(q.mostrati[0])
  controlla('quello che si vede sono tre passi di fila della storia',
            da >= 0 && storia.passi[da + 1] === q.corretta && storia.passi[da + 2] === q.mostrati[2],
            `mostrati ${JSON.stringify(q.mostrati)}, giusta "${q.corretta}"`)
  controlla('tre opzioni, di cui una giusta', q.opzioni.length === 3 && q.opzioni.filter(o => o.giusta).length === 1)
}

/* ══════════ 3-bis. la spiegazione dopo un errore ══════════
   Quello che si fa vedere quando si è sbagliato è **una fila vera e di
   fila della storia**, sempre: è l'unica cosa che il bambino ha davanti
   nel momento in cui sta imparando, e una fila di comodo lì gli
   insegnerebbe una storia che non esiste. Si controlla su tutta la
   campagna, sbagliando apposta. */
{
  const rnd = caso(4242)
  let provate = 0
  let filaFinta = 0          // una fila che nella storia non c'è, o non di fila
  let senzaParole = 0        // un passo della spiegazione senza didascalia
  let titoloMuto = 0

  for (const t of CAMPAGNA) {
    for (let i = 0; i < 120; i++) {
      const v = t.verbo === 'mescolato'
        ? datiVerbo(CHIAVI_VERBI[Math.floor(rnd() * CHIAVI_VERBI.length)])
        : datiVerbo(t.verbo)
      const idonee = storieIdonee(t, v, STORIE)
      if (!idonee.length) continue
      const storia = idonee[Math.floor(rnd() * idonee.length)]
      const q = generaQuesito(v, storia, idonee.filter(s => s !== storia), rnd)

      /* si sbaglia apposta: la prima cosa che non è quella giusta */
      if (q.tipo === 'ordina') q.sequenza.map((_, id) => id).reverse().forEach(id => q.tocca(id))
      else if (q.tipo === 'scegli') q.tocca(q.opzioni.find(o => !o.giusta).emoji)
      else q.tocca(q.vignette.find(x => !x.intruso).id)
      if (q.esito !== 'sbagliata') continue

      const sp = spiegazione(q)
      provate++
      if (!sp.titolo) titoloMuto++
      const da = storia.passi.indexOf(sp.passi[0])
      if (da < 0 || !sp.passi.every((p, k) => storia.passi[da + k] === p)) filaFinta++
      for (const p of sp.passi) if (!didascalia(p)) senzaParole++
      if (sp.scelta && !didascalia(sp.scelta)) senzaParole++
      if (sp.intruso && !didascalia(sp.intruso)) senzaParole++
    }
  }

  controlla('spiegate centinaia di risposte sbagliate', provate >= 500, `solo ${provate}`)
  controlla('la spiegazione fa sempre vedere passi veri e di fila della storia',
            filaFinta === 0, `${filaFinta} volte su ${provate}`)
  controlla('e ogni passo spiegato ha la sua parola', senzaParole === 0, `${senzaParole} muti`)
  controlla('la spiegazione dice sempre di che storia si tratta', titoloMuto === 0)
  uguale('la fila si legge «prima, poi, infine»',
         [0, 1, 2].map(i => ordinale(i, 3)).join(' '), 'Prima Poi Infine')
  uguale('e con quattro passi il «poi» si ripete',
         [0, 1, 2, 3].map(i => ordinale(i, 4)).join(' '), 'Prima Poi Poi Infine')
  nota(`didascalie: ${Object.keys(DIDASCALIE).length} passi con la loro parola`)
}

/* ══════════ 4. le dieci tappe si vincono davvero ══════════ */
nota('tappa                          ragiona sempre     sbaglia 1 su 4')
for (const [i, t] of CAMPAGNA.entries()) {
  const perfetta = gioca(t, { rnd: caso(500 + i), probErrore: 0 })
  controlla(`tappa ${i + 1} (${t.nome}): si vince ragionando sempre`,
            perfetta.finita && perfetta.fatte === t.quante && perfetta.errori === 0,
            `fatte ${perfetta.fatte}/${t.quante}, errori ${perfetta.errori}`)
  uguale(`tappa ${i + 1} (${t.nome}): senza errori vale tre stelle`, perfetta.stelle, 3)

  const distratta = gioca(t, { rnd: caso(700 + i), probErrore: 0.25 })
  controlla(`tappa ${i + 1} (${t.nome}): si vince anche sbagliando una risposta su quattro`,
            distratta.finita && distratta.fatte === t.quante,
            `fatte ${distratta.fatte}/${t.quante}`)
  controlla(`tappa ${i + 1} (${t.nome}): qui non si perde mai, almeno una stella c'è sempre`,
            distratta.stelle >= 1)
  nota(`${(i + 1 + '. ' + t.nome).padEnd(30)} ${String(perfetta.stelle).padStart(3)}⭐` +
       `${String(distratta.errori).padStart(20)} errori, ${distratta.stelle}⭐`)
}

/* la tappa con più errori del previsto: le stelle scendono ma la tappa finisce lo stesso */
{
  const t = CAMPAGNA[0]
  const disastrosa = gioca(t, { rnd: caso(999), probErrore: 0.9 })
  controlla('anche una tappa piena di errori si finisce', disastrosa.finita)
  controlla('con più di due errori restano comunque una stella', disastrosa.errori > 2 ? disastrosa.stelle === 1 : true)
  dentro('e le stelle restano sempre in una scala sensata', disastrosa.stelle, 1, 3)
}

/* ══════════ 5. varietà: una tappa rigiocata non è sempre la stessa fila ══════════ */
{
  let cambiate = 0
  for (const t of CAMPAGNA) {
    const a = storieProposte(t, { rnd: caso(11) })
    const b = storieProposte(t, { rnd: caso(97) })
    uguale(`tappa "${t.chiave}": tante storie quante ne chiede`, a.length, t.quante)
    if (JSON.stringify(a) !== JSON.stringify(b)) cambiate++
  }
  controlla('quasi tutte le tappe, rigiocate, cambiano la fila di storie',
            cambiate >= CAMPAGNA.length - 1, `solo ${cambiate} su ${CAMPAGNA.length} sono cambiate`)
}

/* ══════════ 6. quello che il gioco porta all'albo ══════════
   Il gioco non è ancora registrato in `src/giochi/indice.js` (lo fa un
   altro agente in parallelo, vedi le istruzioni del compito): `TRAGUARDI`
   e `XP_AREA` di `store/progressi.js` sono costruiti da quell'elenco e
   quindi non conoscono ancora "prima". Si prova perciò il blocco `albo`
   del manifesto direttamente, con `statoTraguardo()` — la stessa
   funzione che l'albo vero userà una volta collegato: la differenza è
   solo da dove arriva la lista dei traguardi. */
{
  const guastiAlbo = guastiDellAlbo([manifesto])
  controlla('il blocco albo del manifesto non ha guasti',
            guastiAlbo.length === 0, guastiAlbo.join(' · '))
  controlla('almeno quattro traguardi', manifesto.albo.traguardi.length >= 4)
  controlla('l\'area ha nome ed emoji', !!manifesto.albo.area.nome && !!manifesto.albo.area.emoji)

  /* la stessa trasformazione che fa `src/giochi/albo.js` per ogni gioco:
     l'id dell'area è la chiave del gioco, e non si scrive nel traguardo */
  const traguardi = manifesto.albo.traguardi.map(t => ({ ...t, area: manifesto.chiave }))

  const vuoto = { totals: {}, best: {}, items: {}, campagne: {} }
  const mVuoto = misure(vuoto)
  controlla('a profilo vuoto non se n\'è preso nessun traguardo',
            traguardi.every(t => statoTraguardo(t, mVuoto).grado === 0))
  uguale('e il gioco non risulta nemmeno provato', manifesto.albo.provato(mVuoto), false)
  uguale('a mani vuote l\'esperienza vale zero', manifesto.albo.xp(mVuoto), 0)

  /* un bambino che ha finito la campagna con tutte e dieci le tappe a
     tre stelle, e ha rimesso in fila un bel po' di storie */
  const finito = {
    totals: { storie: 210 }, best: { serieStorie: 22 }, items: {},
    campagne: { prima: { tappa: CAMPAGNA.length, libera: true,
                         stelle: Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3])) } },
  }
  const mFinito = misure(finito)
  const presi = traguardi.map(t => statoTraguardo(t, mFinito))
  controlla('chi finisce tutto li prende tutti d\'oro',
            presi.every(s => s.finito),
            presi.filter(s => !s.finito).map(s => `${s.id} fermo a ${s.valore}`).join(' · '))
  controlla('il gioco risulta provato', manifesto.albo.provato(mFinito) === true)
  controlla('e l\'area vale esperienza', manifesto.albo.xp(mFinito) > 0)

  uguale('le tappe si leggono dalla campagna nel profilo', mFinito.tappeDi(manifesto.chiave), CAMPAGNA.length)
  uguale('le stelle sono la somma dei primati per tappa', mFinito.stelleDi(manifesto.chiave), CAMPAGNA.length * 3)
  uguale('e la campagna finita si vede', mFinito.finita(manifesto.chiave), 1)
  uguale('a mani vuote quelle misure valgono zero',
         mVuoto.tappeDi(manifesto.chiave) + mVuoto.stelleDi(manifesto.chiave) + mVuoto.finita(manifesto.chiave), 0)
}

/* ══════════ 7. disegni con disegni, emoji con emoji ══════════
   Un distrattore di un'altra famiglia si riconosce per *come è fatto*
   invece che per quello che racconta: in mezzo a tre vignette
   disegnate, un'emoji è la risposta che salta all'occhio — e la
   domanda smette di misurare quello che voleva misurare. */
{
  const rnd = caso(77)
  let quesiti = 0, sporchi = 0
  for (let giro = 0; giro < 400; giro++) {
    for (const t of CAMPAGNA) {
      const v = datiVerbo(t.verbo === 'mescolato' ? CHIAVI_VERBI[Math.floor(rnd() * 6)] : t.verbo)
      const idonee = storieIdonee(t, v, STORIE)
      const storia = idonee[Math.floor(rnd() * idonee.length)]
      if (!storia) continue
      const altre = idonee.filter(s => s.chiave !== storia.chiave)
      /* si guarda solo dove una scelta c'era: se in quella tappa non
         esiste nessun'altra storia della stessa famiglia, mescolare è
         il male minore ed è dichiarato in `motore/quesito.js` */
      if (!altre.some(s => !!s.disegnata === !!storia.disegnata)) continue
      const q = generaQuesito(v, storia, altre, rnd)
      const mostrati = q.tipo === 'scegli' ? q.opzioni.map(o => o.emoji)
                     : q.tipo === 'intruso' ? q.vignette.map(x => x.emoji)
                     : q.sequenza
      quesiti++
      if (mostrati.some(e => èScena(e) !== !!storia.disegnata)) sporchi++
    }
  }
  controlla('nessun quesito mescola vignette disegnate ed emoji',
            sporchi === 0, `${sporchi} sporchi su ${quesiti}`)
  controlla('e i quesiti provati sono tanti', quesiti > 500, `sono ${quesiti}`)
}

riassunto('prima e dopo')
