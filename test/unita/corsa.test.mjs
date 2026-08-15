/* Verifica della Corsa dei numeri, senza browser. Le quattro cose che la
   convenzione chiede (`src/giochi/CONVENZIONE.md`): i dati stanno in
   piedi, il calcolo è giusto dove è facile sbagliarsi, **le nove tappe
   si vincono giocandole davvero** con un finto giocatore che legge i
   cancelli, e i traguardi scattano.

   Qui si misura anche il patto che rende questo gioco quello che è: il
   cancello d'oro è **un'offerta**, non un pedaggio. Cioè si deve poter
   finire tutta la campagna senza fare un solo esercizio, e sbagliarne
   uno non deve costare niente — nemmeno una stella.

   `node test/esegui.mjs corsa --niente-build`
   tempo: 240 */
import manifesto, { CHIAVE } from '../../src/giochi/corsa/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { CAMBIO, ORDINI, TETTO, scomponi, figure, aParole, guastiDegliOrdini }
  from '../../src/giochi/corsa/dati/ordini.js'
import { VESTI, veste, guastiDelleVesti } from '../../src/giochi/corsa/dati/vesti.js'
import { CAMPAGNA, SCALINI, LIBERA, TETTI, QUANTE_TAPPE, secondiCirca,
         tappeDelloScalino, guastiDellaCampagna } from '../../src/giochi/corsa/dati/campagna.js'
import { generaCancelli, tondo, resaPrevista, guastiDeiCancelli }
  from '../../src/giochi/corsa/motore/cancelli.js'
import { Regole, Partita, ORIZZONTE, INGAGGIO } from '../../src/giochi/corsa/motore/corsa.js'
import { gioca, misura, caso } from '../../src/giochi/corsa/motore/banco.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. i dati stanno in piedi ══════════ */
for (const [che, guasti] of [
  ['i gradi della truppa', guastiDegliOrdini()],
  ['i vestiti', guastiDelleVesti()],
  ['i cancelli', guastiDeiCancelli({ rnd: caso(7) })],
  ['la campagna', guastiDellaCampagna(CAMPAGNA, VESTI)],
  /* il proprio manifesto, non l'elenco globale: questo test non deve
     diventare rosso per come è fatto un altro gioco */
  ["l'albo", guastiDellAlbo([manifesto])],
]) controlla(`${che} non ha guasti`, guasti.length === 0, guasti.join(' · '))

uguale('nove tappe', CAMPAGNA.length, 9)
uguale('tre scalini', SCALINI.length, 3)
uguale('il manifesto dice quante sono', manifesto.tappe, QUANTE_TAPPE)
uguale('la chiave è una sola', manifesto.chiave, CHIAVE)
controlla('il gioco è ancora in prova', manifesto.sperimentale === true,
          'finché è sperimentale la carta non arriva ai bambini per sbaglio')
controlla('la corsa infinita non finisce mai da sola', !Number.isFinite(LIBERA.metri))
controlla('ogni scalino ha le sue tappe',
          SCALINI.every(s => tappeDelloScalino(s.chiave).length > 0))

/* ── il tempo di pensare, che è tutto il punto ──
   Il prototipo correva al doppio, e leggere tre cancelli in due secondi
   non è calcolare: è tirare a indovinare. Questo controllo è la ragione
   per cui i numeri della campagna sono quelli. */
for (const t of CAMPAGNA) {
  const respiro = t.fraCancelli / t.punta
  controlla(`«${t.nome}»: c'è tempo di leggere i cancelli`, respiro >= 4,
            `${respiro.toFixed(1)}s da un cancello all'altro`)
}
nota('secondi per tappa:', CAMPAGNA.map(secondiCirca).join(' · '))
nota('respiro fra i cancelli:',
     CAMPAGNA.map(t => (t.fraCancelli / t.punta).toFixed(1) + 's').join(' · '))
controlla('nessuna tappa passa i tre minuti',
          CAMPAGNA.every(t => secondiCirca(t) <= 180))
/* la corsa più veloce di tutte è comunque **più lenta** di quella del
   prototipo, che partiva a 5.5 m/s e arrivava a 10 */
controlla('si corre piano anche in cima',
          Math.max(...CAMPAGNA.map(t => t.punta)) <= 5,
          'sopra i cinque metri al secondo il cancello arriva prima della lettura')

/* il riassunto in home: deve dire qualcosa in tutti e tre gli stati */
controlla('il riassunto parla del profilo vuoto', /tappa 1 di 9/.test(manifesto.riassunto()))
controlla('il riassunto parla della corsa infinita',
          /primato 900 m/.test(manifesto.riassunto({ tappa: 9, libera: true, stelle: {}, cfg: { primato: 900 } })))
controlla('il riassunto conta le stelle',
          /⭐ 5/.test(manifesto.riassunto({ tappa: 2, stelle: { 0: 3, 1: 2 }, cfg: {} })))

/* ══════════ 2. il calcolo, dove è facile sbagliarsi ══════════ */

/* ── la truppa è un numero scritto in terra ── */
uguale('si cambia ogni cinque', CAMBIO, 5)
uguale('quattro gradi', ORDINI.length, 4)
uguale('il tetto è 624', TETTO, 624)
uguale('87 si scrive con tre gruppi', scomponi(87).length, 3)
uguale('87 sono tre blu', scomponi(87)[0].quanti, 3)
uguale('87 sono due rossi', scomponi(87)[1].quanti, 2)
uguale('87 sono due verdi', scomponi(87)[2].quanti, 2)
uguale('87 a parole', aParole(87), '3 blu · 2 rossi · 2 verdi')
uguale('zero non ha gruppi', scomponi(0).length, 0)
uguale('al tetto la truppa è di sedici figure', figure(TETTO).length, 16)
/* il numero scritto e quello che corre in terra sono la stessa cosa,
   sempre: se si scollano, il raggruppamento non si impara — si subisce */
for (let n = 0; n <= TETTO; n++) {
  const somma = figure(n).reduce((t, g) => t + ORDINI[g].v, 0)
  if (somma !== n) { controlla(`${n} in terra fa ${somma}`, false); break }
}
controlla('ogni numero fino al tetto si scrive in terra identico', true)
uguale('i tetti sono quelli dei gradi', TETTI.join(','), '4,24,124,624')

/* ── i cancelli non sono mai una scelta finta ── */
{
  const rnd = caso(3)
  let terne = 0, conLibro = 0, oroInPrimaCorsia = 0
  for (let i = 0; i < 600; i++) {
    const n = 1 + Math.floor(rnd() * 300)
    const ops = generaCancelli(n, { rnd, libri: 0.34, tetto: 624 })
    terne++
    if (ops.some(o => o.libro)) {
      conLibro++
      if (ops[0].libro) oroInPrimaCorsia++
    }
  }
  dentro('il cancello d\'oro esce circa un terzo delle volte', conLibro / terne, 0.25, 0.45)
  /* la corsia buona non è sempre la stessa: se lo fosse si imparerebbe la
     posizione invece del conto, e il gioco diventerebbe un riflesso */
  dentro('l\'oro non sta sempre nella stessa corsia', oroInPrimaCorsia / conLibro, 0.2, 0.47)
}
uguale('tondo arrotonda a numeri che si sommano a mente', tondo(87, 0.35), 30)
uguale('tondo non scende sotto due', tondo(1, 0.35), 2)
/* il libro si conta come un ×2 quando si prevede il futuro: tarare i
   mostri sul caso perfetto vuol dire mandare un esercito contro chi ha
   sbagliato il conto */
uguale('il libro vale un ×2 nelle previsioni',
       resaPrevista({ libro: true, f: v => v * 5 })(10), 20)

/* ══════════ 3. le nove tappe si vincono giocandole ══════════ */
const LIVELLI = [
  { nome: 'chi legge i cancelli', bravura: 1, sapienza: 0.9, minimo: 0.8 },
  { nome: 'un bambino medio', bravura: 0.7, sapienza: 0.65, minimo: 0.5 },
  /* chi non calcola quasi mai deve poter finire **le prime tappe**: la
     campagna insegna, non seleziona */
  { nome: 'chi tira a indovinare', bravura: 0.4, sapienza: 0.4, minimo: 0 },
]

for (const [i, t] of CAMPAGNA.entries()) {
  const regole = new Regole(t)
  for (const liv of LIVELLI) {
    const m = misura(regole, { volte: 24, rnd: caso(500 + i * 7), bravura: liv.bravura,
                               sapienza: liv.sapienza })
    if (liv.minimo) {
      controlla(`«${t.nome}»: ${liv.nome} la porta a casa`, m.quota >= liv.minimo,
                `vinta ${(m.quota * 100).toFixed(0)}% delle volte`)
    }
    if (liv.bravura === 1) {
      nota(`${t.nome}: chi legge vince ${(m.quota * 100).toFixed(0)}%`,
           `· ${m.stelleMedie.toFixed(1)}⭐ · truppa ≈ ${Math.round(m.truppaMedia)}`,
           `· ${m.domandeMedie.toFixed(1)} esercizi`)
      /* una tappa in cui la terza stella non si prende mai è una tappa in
         cui la mira è tarata male, e non se ne accorgerebbe nessuno */
      controlla(`«${t.nome}»: la terza stella si può prendere`, m.treStelle >= 0.4,
                `presa ${(m.treStelle * 100).toFixed(0)}% delle volte da chi legge i cancelli`)
    }
  }
  /* chi tira a indovinare non deve **stravincere**: se ci riuscisse, i
     cancelli non sarebbero una scelta e il gioco sarebbe un video */
  const caso40 = misura(regole, { volte: 24, rnd: caso(900 + i), bravura: 0.3, sapienza: 0.3 })
  controlla(`«${t.nome}»: indovinare a caso non basta per tre stelle`,
            caso40.treStelle <= 0.5, `tre stelle ${(caso40.treStelle * 100).toFixed(0)}% delle volte`)
}

/* ── IL PATTO DEL CANCELLO D'ORO ──
   Le tre condizioni che lo rendono un'offerta e non un pedaggio, provate
   una per una. Se una qualunque cade, la matematica torna a essere una
   tassa che i bambini pagano svogliati. */
for (const [i, t] of CAMPAGNA.entries()) {
  const m = misura(new Regole(t), { volte: 24, rnd: caso(300 + i), bravura: 1,
                                    sapienza: 0.9, gusto: 'svelto' })
  controlla(`«${t.nome}»: si finisce senza fare un solo esercizio`, m.quota >= 0.7,
            `chi tira sempre dritto la vince ${(m.quota * 100).toFixed(0)}% delle volte`)
  controlla(`«${t.nome}»: e senza esercizi si prendono lo stesso le stelle`,
            m.stelleMedie >= 1.8, `${m.stelleMedie.toFixed(1)}⭐ di media`)
  uguale(`«${t.nome}»: chi tira dritto non fa domande`, Math.round(m.domandeMedie * 10) <= 5, true)
}

/* sbagliare l'esercizio non toglie niente: si resta esattamente com'era */
{
  const p = new Partita(new Regole(CAMPAGNA[2]), { rnd: caso(21) })
  let trovato = false
  for (let giro = 0; giro < 40000 && !trovato; giro++) {
    if (p.finita) break
    if (p.inPausa) {
      const prima = p.truppa
      const esito = p.rispondi(false)
      uguale('sbagliare l\'esercizio non toglie un soldato', p.truppa, prima)
      uguale('e il motore lo dice', esito.dopo, prima)
      trovato = true
      break
    }
    const c = p.cose.filter(x => x.tipo === 'cancelli' && !x.fatto)
      .sort((a, b) => a.z - b.z)[0]
    const oro = c ? c.ops.findIndex(o => o.libro) : -1
    if (oro >= 0) p.punta(oro - 1)
    p.avanza(1 / 30)
    p.svuotaEventi()
  }
  controlla('il cancello d\'oro arriva davvero, giocando', trovato)
}

/* prendere il cancello d'oro conta come scelta giusta anche sbagliando
   l'esercizio: se no la stella della mira sarebbe una punizione per aver
   provato, che è il contrario di quello che si vuole insegnare */
{
  const p = new Partita(new Regole(CAMPAGNA[4]), { rnd: caso(33) })
  let provato = false
  for (let giro = 0; giro < 60000 && !provato; giro++) {
    if (p.finita) break
    if (p.inPausa) {
      const meglioPrima = p.meglio
      p.rispondi(false)
      controlla('chi prova il cancello d\'oro ha comunque scelto bene',
                p.meglio === meglioPrima, 'la mira si conta prima di rispondere')
      provato = true
      break
    }
    /* si va sempre dove c'è l'oro, se c'è */
    const c = p.cose.filter(x => x.tipo === 'cancelli' && !x.fatto)
      .sort((a, b) => a.z - b.z)[0]
    const oro = c?.ops.findIndex(o => o.libro)
    if (oro >= 0) p.punta(oro - 1)
    p.avanza(1 / 30)
    p.svuotaEventi()
  }
  controlla('l\'oro si è potuto scegliere apposta', provato)
}

/* ── la partita si ferma davvero quando c'è una domanda a schermo ──
   «I conti si fanno da fermi» non è una frase: se il tempo passasse, il
   bambino tornerebbe dalla domanda con un mostro addosso. */
{
  const p = new Partita(new Regole(CAMPAGNA[2]), { rnd: caso(21) })
  while (!p.finita && !p.inPausa) {
    p.vai(1)
    p.avanza(1 / 30)
    p.svuotaEventi()
  }
  if (p.inPausa) {
    const dove = p.dist
    for (let i = 0; i < 100; i++) p.avanza(1 / 30)
    uguale('con la domanda a schermo la corsa non avanza', p.dist, dove)
  }
}

/* ══════════ LA SPINTA NON RUBA IL TEMPO DI LEGGERE ══════════
   Un tocco fa correre più forte, così i venti metri vuoti fra un cancello
   e l'altro non si stanno lì ad aspettare. Ma davanti alla scelta la
   spinta si spegne da sola, e **quello è il pezzo che non si negozia**: a
   sei anni non si sa ancora di aver bisogno di qualche secondo per
   leggere tre numeri, quindi non si può lasciare che il dito se li porti
   via. Qui si misura giocando, con un pilota che martella lo schermo. */
for (const [i, t] of [[0, CAMPAGNA[0]], [8, CAMPAGNA[8]]]) {
  const p = new Partita(new Regole(t), { rnd: caso(61 + i) })
  let vicino = 0, lontano = 0        // secondi spesi sotto e sopra i 16 m
  let piuVeloce = 0
  while (!p.finita) {
    if (p.inPausa) { p.rispondi(true); continue }
    p.spingi()
    const c = p.cose.filter(x => x.tipo === 'cancelli' && !x.fatto && x.z - p.dist > 0)
      .sort((a, b) => a.z - b.z)[0]
    const quanto = c ? c.z - p.dist : Infinity
    if (quanto <= 16) { vicino += 1 / 30; piuVeloce = Math.max(piuVeloce, p.spintaOra) }
    else lontano += 1 / 30
    p.avanza(1 / 30)
    p.svuotaEventi()
  }
  uguale(`«${t.nome}»: sotto i 16 metri dal cancello si va al passo`,
         Math.round(piuVeloce * 1000) / 1000, 1)
  controlla(`«${t.nome}»: ma nel vuoto si vola`, lontano > 0,
            'il tratto libero esiste e la spinta ci lavora')
}

/* e con la spinta la tappa dura meno, se no non serviva a niente */
{
  const regole = new Regole(CAMPAGNA[4])
  const calmo = gioca(regole, { rnd: caso(71), bravura: 1, sapienza: 1 })
  const svelto = gioca(regole, { rnd: caso(71), bravura: 1, sapienza: 1, fretta: true })
  const giri = p => p.partita.dist / regole.metri
  controlla('chi tocca lo schermo arriva prima',
            svelto.partita.dist >= calmo.partita.dist * 0.99 && giri(svelto) >= 0.99,
            'la spinta deve accorciare i tratti vuoti, non la tappa')
  uguale('e la vince lo stesso', svelto.partita.vinta, true)
  /* il conto degli scontri non cambia: il danno si conta per metro, non
     per secondo, ed è per questo che si può correre più forte senza che
     un mostro diventi più facile */
  uguale('gli scontri finiscono uguale', svelto.partita.persi, calmo.partita.persi)
}

/* ── il mostro non è mai imbattibile ──
   Un nemico che non si può battere non è difficile, è rotto — e lo
   prende in faccia proprio chi ha scelto meglio di tutti. */
{
  let peggiore = 0, quanti = 0
  for (const [i, t] of CAMPAGNA.entries()) {
    const { partita } = gioca(new Regole(t), { rnd: caso(41 + i), bravura: 1, sapienza: 1 })
    for (const c of partita.cose) if (c.tipo === 'nemici') quanti++
    peggiore = Math.max(peggiore, partita.persi)
  }
  controlla('chi gioca perfetto non perde più di uno scontro per tappa', peggiore <= 1,
            `ne ha persi ${peggiore}`)
}

/* ── la corsa infinita finisce sempre, e non subito ── */
{
  const m = misura(new Regole(LIBERA), { volte: 12, rnd: caso(77), bravura: 0.7,
                                         sapienza: 0.7, fino: 1500 })
  dentro('la corsa infinita dura il giusto', m.metriMedi, 250, 1500)
  nota('corsa infinita: in media', Math.round(m.metriMedi), 'metri')
}

/* ══════════ 4. le stelle e i traguardi ══════════ */
{
  const t = CAMPAGNA[0]
  const p = new Partita(new Regole(t), { rnd: caso(5) })
  uguale('a partita in corso nessuna stella', p.stelle, 0)
  uguale('e nessuna moneta', p.monete, 0)
}

/* i traguardi: a profilo finito si prendono tutti, a profilo vuoto
   nessuno. Un traguardo che nessuno può prendere non si vede da nessuna
   parte, e senza questo controllo non se ne accorge nessuno. */
{
  const vuoto = { tot: () => 0, best: () => 0, tappeDi: () => 0,
                  stelleDi: () => 0, finita: () => 0 }
  const pieno = { tot: () => 100000, best: () => 100000, tappeDi: () => QUANTE_TAPPE,
                  stelleDi: () => QUANTE_TAPPE * 3, finita: () => 1 }
  for (const tr of manifesto.albo.traguardi) {
    controlla(`«${tr.nome}» non scatta a profilo vuoto`, tr.valore(vuoto) < tr.soglie[0])
    controlla(`«${tr.nome}» si prende a profilo finito`,
              tr.valore(pieno) >= tr.soglie[tr.soglie.length - 1])
  }
  controlla('a profilo vuoto il gioco non risulta provato', !manifesto.albo.provato(vuoto))
  controlla('a profilo pieno sì', manifesto.albo.provato(pieno))
  controlla("l'esperienza cresce col gioco", manifesto.albo.xp(pieno) > manifesto.albo.xp(vuoto))
}

/* ── le costanti che la scena dà per buone ── */
uguale('si vede quaranta e passa metri di pista', ORIZZONTE, 46)
uguale('si spara da sedici metri', INGAGGIO, 16)
controlla('ogni tappa ha un vestito che esiste', CAMPAGNA.every(t => veste(t.veste).nome))

riassunto('la corsa dei numeri')
