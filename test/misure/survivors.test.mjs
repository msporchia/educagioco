/* Survivors giocato, senza browser: **le nove tappe si vincono
   giocandole davvero** — con un finto giocatore che schiva, non a occhio.
   I dati e i calcoli (le regole svelte) stanno in `unita/survivors`.

   Qui si misura anche la cosa che rende questo gioco quello che è: che la
   carta si paga con una domanda, che sbagliare non è una punizione, e che
   una tappa non la si perde a scuola.

   perché: le nove tappe di Survivors vinte giocandole davvero con un finto giocatore che schiva, e le cose che lo rendono quello che è: la carta si paga con una domanda, sbagliare non punisce, una tappa non si perde a scuola
   a parte perché: `strumenti/survivors-banco.mjs` stampa i numeri di una partita; questa le gioca tutte e fallisce se una tappa non si vince. Le regole svelte sono in unita/survivors
   `node test/esegui.mjs misure/survivors --niente-build`
   tempo: 420 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import manifesto, { CHIAVE } from '../../src/giochi/survivors/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { guastiDelleSfide } from '../../src/giochi/primati.js'
import { CFG, soglia, stellePerFerite, guastiDellaTaratura }
  from '../../src/giochi/survivors/dati/taratura.js'
import { MOSTRI, ammessi, guastiDeiMostri }
  from '../../src/giochi/survivors/dati/mostri.js'
import { SCENARI, guastiDegliScenari } from '../../src/giochi/survivors/dati/scenari.js'
import { OGGETTI, pescaOggetto, guastiDegliOggetti }
  from '../../src/giochi/survivors/dati/oggetti.js'
import { MAZZO, FASCE, PALLINI, prezzoDomanda, maturita, palliniDelPrezzo,
         scalinoDelPrezzo, resa, tettoDi, RESA_OLTRE, RESA_TOTALE, guastiDelMazzo,
         OFFERTA, ARMI_DI_PARTENZA }
  from '../../src/giochi/survivors/dati/mazzo.js'
import { CAMPAGNA, SCALINI, LIBERO, QUANTE_TAPPE, guastiDellaCampagna }
  from '../../src/giochi/survivors/dati/campagna.js'
import { Regole, Partita } from '../../src/giochi/survivors/motore/partita.js'
import { gioca, misura, caso as casoFisso, Pilota } from '../../src/giochi/survivors/motore/banco.js'
import { spostaSemi } from '../aiuto/semi.mjs'
const caso = spostaSemi(casoFisso)
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const campo = { larghezza: 390, altezza: 620 }     // un telefono vero
/* Una quota misurata su `volte` partite oscilla: chi la controlla tiene
   tre deviazioni standard e mezza sotto il valore atteso (misurato su sedici
   semi: `SEMI=1000 node test/esegui.mjs survivors`, vedi docs/core/test.md).
   Vicino a 0 o a 1 la varianza si allarga un po', o una partita persa su
   ventiquattro farebbe cadere il 98% */
const regge = (quota, attesa, volte, quante = 3.5) =>
  quota >= attesa - quante * Math.sqrt(Math.max(attesa * (1 - attesa), 0.05) / volte)

/* ══════════ 4-ter. chi sta fermo finisce dentro il muro ══════════ */
{
  /* ── chi sta fermo ci finisce dentro, chi si muove no ──
     Con la fila da sola in campo, a marea alta (una freccia non la
     buca): quaranta muri, e si conta chi viene preso. Chi sta fermo non
     è preso sempre: una volta su tre il varco gli cade addosso (misurato
     su 200 muri: 64%, chi si sposta 0%). Era «dieci su dieci» finché il
     generatore dei semi piccoli faceva entrare il muro sempre dallo
     stesso lato, col varco lontano. */
  const colpi = { fermo: 0, pilota: 0 }, MURI = 40
  for (const modo of ['fermo', 'pilota']) {
    for (let seme = 1; seme <= MURI; seme++) {
      const p = new Partita(new Regole(CAMPAGNA[8]), { rnd: caso(seme), campo })
      p.tempo = 150
      p.aNascere = -1e9; p.tOggetto = 1e9; p.tMuro = 1e9
      p.nasceMuro()
      const pilota = new Pilota({ rnd: caso(seme + 50), bravura: 1 })
      let ahia = 0
      for (let i = 0; i < 30 * 8 && !p.finita; i++) {
        if (modo === 'pilota') pilota.guida(p, 1 / 30)
        p.avanza(1 / 30)
        ahia += p.svuotaEventi().filter(e => e === 'ahia').length
      }
      if (ahia) colpi[modo]++
    }
  }
  nota(`un muro da solo prende chi sta fermo ${colpi.fermo} volte su ${MURI}, chi si sposta ${colpi.pilota}`)
  controlla('chi sta fermo finisce dentro il muro', colpi.fermo >= MURI * 0.4, `${colpi.fermo} su ${MURI}`)
  controlla('chi si sposta lo scansa', colpi.pilota <= MURI * 0.05, `${colpi.pilota} su ${MURI}`)
}

/* ══════════ 4-quater. il pilota sa mirare ══════════ */
{
  /* ── e il pilota le sa usare: la mira si misura ──
     «Direzione giusta» = la direzione presa sta entro 45° dal grumo di
     mostri più fitto a tiro; `quotaMira` è quante occasioni su cento.
     Deve seguire la manopola `mira`, e non costare la partita. */
  const r = new Regole(CAMPAGNA[6])
  const mirato = misura(r, { volte: 16, bravura: 1, esattezza: 1, mira: 0.65, campo, rnd: caso(70) })
  const distratto = misura(r, { volte: 16, bravura: 1, esattezza: 1, mira: 0.3, campo, rnd: caso(70) })
  const mai = misura(r, { volte: 16, bravura: 1, esattezza: 1, mira: 0, campo, rnd: caso(70) })
  nota(`la mira del pilota: a 0.65 guarda il grumo il ${(mirato.quotaMira * 100).toFixed(0)}% delle volte, ` +
       `a 0.3 il ${(distratto.quotaMira * 100).toFixed(0)}%, a 0 il ${(mai.quotaMira * 100).toFixed(0)}%`)
  controlla('il pilota ha occasioni di mirare', mirato.occasioniMedie > 50)
  /* misurato su sedici semi: 48%, 28% e 9% (a 0 ci si trova girati
     verso il grumo per caso) */
  dentro('chi mira guarda il grumo una buona parte del tempo', mirato.quotaMira, 0.33, 0.8)
  controlla('chi è distratto meno', distratto.quotaMira < mirato.quotaMira)
  controlla('e chi non mira quasi mai', mai.quotaMira < 0.2 && mai.quotaMira < distratto.quotaMira)
  /* che mirare non costi la tappa si guarda sulle nove tappe insieme
     (sezione 5): sedici partite contro sedici davano anche 50% contro 81% */
}

/* ══════════ 5. le nove tappe si vincono davvero ══════════ */
const VOLTE = 24
const bravi = [], bimbi = [], centri = [], livelli = [], distratti = [], scalini = {}
nota('tappa                     sa   distratto  sbaglia  schiva   fermo   livello  domande  casse  liv.centro')
nota('                        rispondere  (mira .3)  1su3  a sprazzi')
for (const [i, t] of CAMPAGNA.entries()) {
  const r = new Regole(t)
  /* Il giocatore di riferimento non è più «uno che schiva bene»: è **uno
     che risponde**. Da quando la carta si perde sbagliando e i mostri
     hanno vita da vendere, saper schivare non basta a passare le ultime
     tappe — bisogna aver preso le carte che picchiano, e quelle si pagano
     con le domande toste. `esattezza` è la manopola che dice quante ne
     indovina, sempre, e serve a misurare proprio questo.

     E da quando le cose si trovano in giro, il pilota **va in giro**: a
     prendere gemme e oggetti, a scansare i muri, e — con un'arma che
     guarda dove corre — verso il grumo di mostri (`mira`, vedi 4-quater).
     «Distratto» è lo stesso giocatore che mira una volta su tre invece
     di due: serve a vedere che mirare aiuta, o almeno non costa. */
  const sa = misura(r, { volte: VOLTE, bravura: 1, esattezza: 0.95, mira: 0.65, campo, rnd: caso(100 + i) })
  const distratto = misura(r, { volte: VOLTE, bravura: 1, esattezza: 0.95, mira: 0.3, campo, rnd: caso(120 + i) })
  const sbaglia = misura(r, { volte: VOLTE, bravura: 1, esattezza: 0.66, mira: 0.65, campo, rnd: caso(150 + i) })
  const bimbo = misura(r, { volte: VOLTE, bravura: 0.55, esattezza: 0.7, mira: 0.3, campo, rnd: caso(200 + i) })
  const fermo = misura(r, { volte: 12, fermo: true, campo, rnd: caso(300 + i) })
  /* **chi sta al centro**: lo stesso giocatore bravo, che però le cose
     per terra non le guarda (`raccolta: 0`) e raccoglie solo quello che
     calpesta scappando. Da quando la calamita di base non c'è più, è la
     misura di quanto conta andare in giro — ed è su questo scarto che è
     tarata la scaletta dell'esperienza (`soglia` in `taratura.js`) */
  const centro = misura(r, { volte: VOLTE, bravura: 1, esattezza: 0.95, mira: 0.65, raccolta: 0,
                             campo, rnd: caso(400 + i) })
  centri.push(centro.livelloMedio); livelli.push(sa.livelloMedio)
  bravi.push(sa.quota); bimbi.push(bimbo.quota); distratti.push(distratto.quota)
  nota(`${(i + 1 + '. ' + t.nome).padEnd(24)}` +
       `${(sa.quota * 100).toFixed(0).padStart(4)}%` +
       `${(distratto.quota * 100).toFixed(0).padStart(9)}%` +
       `${(sbaglia.quota * 100).toFixed(0).padStart(8)}%` +
       `${(bimbo.quota * 100).toFixed(0).padStart(9)}%` +
       `${(fermo.quota * 100).toFixed(0).padStart(8)}%` +
       `${sa.livelloMedio.toFixed(1).padStart(10)}` +
       `${sa.domandeMedie.toFixed(1).padStart(9)}` +
       `${sa.casseMedie.toFixed(2).padStart(7)}` +
       `${centro.livelloMedio.toFixed(1).padStart(12)}`)

  /* ── la cassa resta un di più, non una seconda fonte ──
     Ogni cassa è un'offerta in più di quelle che hanno pagato le gemme:
     sotto un terzo, o le carte si prendono girando in tondo ad aspettare
     che ne compaia una invece di raccogliere (`CFG.oggetti.cassa`) */
  controlla(`tappa ${i + 1} (${t.nome}): le casse restano meno di un terzo delle offerte`,
            sa.casseMedie <= (sa.domandeMedie - sa.casseMedie) / 3 + 0.05,
            `${sa.casseMedie.toFixed(2)} casse su ${sa.domandeMedie.toFixed(1)} offerte`)

  /* ── quanto deve essere dura ──
     Il primo scalino insegna e si vince quasi sempre, l'ultimo è una
     salita che chiede di aver risposto bene: si scende. Chi perde non
     perde niente e riprova, e intanto ha fatto i suoi conti.

     Le attese sono misurate (288 partite per tappa, il 31/10/2026, con
     l'offerta a quattro carte: `node strumenti/survivors-banco.mjs
     --volte 288 --tappe N`): chi risponde bene 100·100·96·85·72·66·68·54·59%,
     chi schiva a sprazzi 100·98·82·64·42·28·33·23·24%. Ventiquattro partite
     oscillano di dieci punti, quindi una casella da sola regge solo un
     crollo (`regge`); lo scalino intero, tre tappe insieme, tiene una
     soglia più stretta. */
  const attesaSa = [1.00, 1.00, 0.96, 0.85, 0.72, 0.66, 0.68, 0.54, 0.59]
  const attesaBimbo = [1.00, 0.98, 0.82, 0.64, 0.42, 0.28, 0.33, 0.23, 0.24]
  controlla(`tappa ${i + 1} (${t.nome}): chi risponde bene la porta a casa`,
            regge(sa.quota, attesaSa[i], VOLTE), `ce la fa il ${(sa.quota * 100).toFixed(0)}%`)
  controlla(`tappa ${i + 1} (${t.nome}): chi schiva a sprazzi non resta fuori`,
            regge(bimbo.quota, attesaBimbo[i], VOLTE), `ce la fa il ${(bimbo.quota * 100).toFixed(0)}%`)
  /* mirare meno non deve costare una tappa: la mira è un di più, e una
     manopola che spegnendola fa perdere non è una manopola, è un obbligo */
  controlla(`tappa ${i + 1} (${t.nome}): chi mira meno non resta fuori`,
            regge(distratto.quota, attesaSa[i] - 0.1, VOLTE), `ce la fa il ${(distratto.quota * 100).toFixed(0)}%`)
  scalini[t.scalino] ||= { sa: [], bimbo: [], attesaSa: [], attesaBimbo: [] }
  scalini[t.scalino].sa.push(sa.quota); scalini[t.scalino].bimbo.push(bimbo.quota)
  scalini[t.scalino].attesaSa.push(attesaSa[i]); scalini[t.scalino].attesaBimbo.push(attesaBimbo[i])
  /* il gioco non si deve giocare da solo: chi non muove il dito perde.
     Era «al massimo il 45%», e da fermo si vinceva la terza tappa una
     volta su tre: le gemme arrivavano da sole. Adesso non arriva niente */
  controlla(`tappa ${i + 1} (${t.nome}): chi sta fermo non la vince`,
            fermo.quota <= 0.2,
            `da fermo ce la fa il ${(fermo.quota * 100).toFixed(0)}%`)
  /* le domande sono il prezzo delle carte, e sono anche il motivo per cui
     questo gioco esiste: una tappa lunga ne deve chiedere di più */
  dentro(`tappa ${i + 1} (${t.nome}): quante domande in una partita`,
         Number(sa.domandeMedie.toFixed(1)), 3, 20)
}
{
  /* lo scalino intero: tre tappe, settantadue partite per profilo; a
     quattro deviazioni, perché tre tappe molto diverse (100, 98 e 82%)
     oscillano più di quanto dice il conto, e resta più stretta lo stesso
     della casella sola */
  const media = v => v.reduce((a, b) => a + b, 0) / v.length
  for (const [chiave, sc] of Object.entries(scalini)) {
    const n = VOLTE * sc.sa.length
    controlla(`scalino «${chiave}»: chi risponde bene ci arriva come atteso`,
              regge(media(sc.sa), media(sc.attesaSa), n, 4), `${(media(sc.sa) * 100).toFixed(0)}%`)
    controlla(`scalino «${chiave}»: chi schiva a sprazzi ci arriva come atteso`,
              regge(media(sc.bimbo), media(sc.attesaBimbo), n, 4), `${(media(sc.bimbo) * 100).toFixed(0)}%`)
  }
  /* mirare non costa la tappa: chi mira due volte su tre contro chi mira
     una su tre, sulle nove tappe insieme (misurato: 71% contro 73%) */
  const n = VOLTE * bravi.length
  controlla('mirare non costa la tappa',
            media(bravi) >= media(distratti) - 3 * Math.sqrt(2 * 0.25 / n),
            `${(media(bravi) * 100).toFixed(0)}% contro ${(media(distratti) * 100).toFixed(0)}%`)
  const primi = bimbi.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const ultimi = bimbi.slice(-3).reduce((a, b) => a + b, 0) / 3
  controlla('la campagna diventa più dura andando avanti', ultimi < primi,
            `primo scalino ${(primi * 100).toFixed(0)}%, ultimo ${(ultimi * 100).toFixed(0)}%`)

  /* ── l'esperienza si va a prendere, e la scaletta è tarata su questo ──
     Chi raccoglie fa più o meno i livelli di sempre (una decina a
     tappa); chi sta al centro e schiva e basta ne fa pochi, e non è
     una punizione — è che le gemme restano dove cadono e nessuna
     calamita gliele porta. Prima della carta-sola la differenza non
     esisteva quasi: il risucchio di base faceva arrivare l'esperienza
     addosso anche a lui. */
  const chiRaccoglie = media(livelli), chiSta = media(centri)
  nota(`livelli medi per tappa: chi raccoglie ${chiRaccoglie.toFixed(1)}, ` +
       `chi sta al centro ${chiSta.toFixed(1)}`)
  dentro('chi raccoglie fa più o meno i livelli di sempre', Number(chiRaccoglie.toFixed(1)), 8, 13)
  controlla('e chi sta al centro molti di meno', chiSta < chiRaccoglie - 3,
            `${chiSta.toFixed(1)} contro ${chiRaccoglie.toFixed(1)}`)
}

/* ══════════ 5-quater. IL RISCALDAMENTO ══════════
   All'inizio non si ha nessuna carta e un colpo è un cuore su tre: senza
   riscaldamento chi schiva a sprazzi ne perdeva uno nei primi trenta
   secondi quasi una partita su due. Il riscaldamento (`CFG.avvio`) toglie
   mostri e fretta all'inizio, non l'esperienza: i livelli restano quelli. */
{
  let ferite = 0, pulite = 0, livelli = 0, partite = 0
  for (const [i, t] of [...CAMPAGNA, LIBERO].entries()) {
    const r = new Regole(t), rnd = caso(700 + i)
    for (let v = 0; v < 24; v++, partite++) {
      const p = new Partita(r, { rnd, campo })
      const pilota = new Pilota({ rnd, bravura: 0.55, esattezza: 0.7, mira: 0.3 })
      while (p.tempo < CFG.avvio.secondi && !p.finita) {
        if (p.inPausa) { pilota.rispondi(p); continue }
        pilota.guida(p, 1 / 30)
        p.avanza(1 / 30)
        p.svuotaEventi()
      }
      ferite += p.ferite; livelli += p.livello
      if (!p.ferite) pulite++
    }
  }
  nota(`nei primi ${CFG.avvio.secondi}s chi schiva a sprazzi prende ${(ferite / partite).toFixed(2)} ` +
       `ferite, e ${(pulite / partite * 100).toFixed(0)}% delle partenze sono pulite (livello ${(livelli / partite).toFixed(1)})`)
  /* senza riscaldamento: 0.67 ferite e partenze pulite al 55%; con, su
     trentadue semi, 0.30 (al più 0.42) e 77% (almeno 71%) */
  controlla('nel riscaldamento chi schiva a sprazzi non perde quasi mai un cuore',
            ferite / partite <= 0.48, `${(ferite / partite).toFixed(2)} ferite a partita`)
  controlla('e almeno due partenze su tre sono pulite', pulite / partite >= 0.65,
            `${(pulite / partite * 100).toFixed(0)}%`)
  controlla('le carte arrivano lo stesso', livelli / partite >= 2.5,
            `livello ${(livelli / partite).toFixed(1)} alla fine del riscaldamento`)
}

/* ══════════ 5-ter. SBAGLIARE LE DOMANDE SI PAGA ══════════
   È la promessa del gioco, e senza una misura resta una promessa: chi
   risponde bene deve arrivare in fondo, chi tira a indovinare no. Non è
   una punizione che arriva dal gioco — nessun cuore tolto, nessuna ondata
   di castigo — è che il potenziamento mancato non torna e i mostri hanno
   troppa vita per l'arco di partenza.

   Si misura sull'ultima tappa, che è quella dove il margine è zero: nelle
   prime si vince lo stesso, ed è giusto così. */
{
  const r = new Regole(CAMPAGNA.at(-1))
  const TASSI = [1, 0.85, 0.66, 0.5], TANTE = 40
  const quote = TASSI.map((e, k) =>
    misura(r, { volte: TANTE, bravura: 1, esattezza: e, campo, rnd: caso(600 + k) }).quota)
  nota('ultima tappa, per quante domande indovina:  ' +
       TASSI.map((e, k) => `${(e * 100).toFixed(0)}% → ${(quote[k] * 100).toFixed(0)}%`).join('   '))
  /* Misurato su sedici semi: 49·35·16·6%. Che chi risponde a tutto la
     passi una volta su due è voluto: se la deve sudare, e il pilota non
     sceglie le carte meglio di un bambino. Non si alza il danno delle
     armi: si pagano con una domanda, e alzarle vorrebbe dire che chi le
     ha scelte vince la campagna al posto di chi risponde. La forma resta:
     più si sbaglia, meno si vince. */
  controlla('chi risponde a tutto la porta a casa', regge(quote[0], 0.49, TANTE),
            `ce la fa il ${(quote[0] * 100).toFixed(0)}%`)
  controlla('chi ne sbaglia una su tre non ce la fa quasi mai',
            quote[2] <= 0.45, `ce la fa il ${(quote[2] * 100).toFixed(0)}%`)
  controlla('e chi tira a indovinare non la vede nemmeno',
            quote[3] <= 0.25, `ce la fa il ${(quote[3] * 100).toFixed(0)}%`)
  /* 66% e 50% stanno tutte e due vicino a zero, e fra loro decide il
     seme: si confrontano i gradini che distano davvero */
  controlla('più si sbaglia meno si vince', quote[0] > quote[2] && quote[1] > quote[3],
            quote.map(q => (q * 100).toFixed(0) + '%').join(' → '))

  /* e la prima tappa **no**: là si vince anche sbagliando tutto, o un
     bambino che non sa ancora le tabelline non entrerebbe nel gioco */
  const primaSbagliando = misura(new Regole(CAMPAGNA[0]),
    { volte: 20, bravura: 1, esattezza: 0, campo, rnd: caso(650) })
  controlla('la prima tappa si vince anche sbagliando tutte le domande',
            primaSbagliando.quota >= 0.6,
            `ce la fa il ${(primaSbagliando.quota * 100).toFixed(0)}%`)
}

/* ══════════ 5-bis. si può restare in campo, e prima o poi ti prendono ══════════
   È la promessa del gioco: dopo il traguardo la marea non si ferma più.
   Se qui il pilota sopravvivesse per sempre vorrebbe dire che a un certo
   punto la partita si è appiattita, e il punteggio sarebbe soltanto
   quanta pazienza si ha. */
{
  const r = new Regole(CAMPAGNA[0])
  /* si vince, si resta, e la stella non si tocca più: l'eroe è
     intoccabile, perché qui serve una tappa vinta e non una fortunata */
  const vincente = new Partita(r, { rnd: caso(800), campo })
  vincente.eroe.invuln = Infinity
  const { partita } = gioca(r, { rnd: caso(800), campo, bravura: 1, sapienza: 0.9, oltre: 20, da: vincente })
  controlla('la tappa resta vinta anche restando in campo', partita.vinta)
  controlla('e il tempo va oltre il traguardo', partita.tempo > r.durata)
  controlla('i secondi regalati si contano', partita.extra > 0)

  /* la marea sale davvero: più tardi si sta, più ne nascono e più sono duri */
  controlla('oltre il traguardo ne nascono di più',
            r.nascite(r.durata + 300) > r.nascite(r.durata))
  controlla('e sono più duri', r.vitaNemico(r.durata + 300) > r.vitaNemico(r.durata))
  controlla('e non smette mai di crescere',
            r.vitaNemico(r.durata + 900) > r.vitaNemico(r.durata + 300))
  /* e la tappa che aveva una bestia sola non resta una tappa con una
     bestia sola: dopo il traguardo entrano tutte */
  controlla('dopo il traguardo arriva anche chi la tappa non aveva',
            r.squadraOra(r.durata + 240).length > r.squadraOra(r.durata).length,
            r.squadraOra(r.durata + 240).join(' '))

  /* nessuno resiste per sempre: dieci minuti di regalo, e ti prendono */
  const fini = []
  for (let i = 0; i < 5; i++)
    fini.push(gioca(r, { rnd: caso(810 + i), campo, bravura: 1, sapienza: 0.9, oltre: 600 }).partita)
  const morti = fini.filter(p => p.esito === 'persa').length
  nota(`restando in campo dopo il traguardo si resiste in media ` +
       `${(fini.reduce((a, p) => a + p.extra, 0) / fini.length).toFixed(0)}s`)
  controlla('restando in campo prima o poi ti prendono', morti >= 4,
            `su 5 partite ne finiscono ${morti}`)

  /* ── e vale anche per chi non sbaglia una domanda ──
     Il controllo qui sopra usa un giocatore che ne sbaglia qualcuna, e
     per anni è bastato: è passato mentre il gioco, per chi rispondeva a
     **tutto**, era diventato impossibile da perdere. Misurato: un quarto
     d'ora in campo, cinque cuori intatti, trecentottanta mostri intorno e
     nemmeno uno che arrivasse a un braccio di distanza — la potenza
     dell'eroe si moltiplica (una freccia in più, poi più svelte, poi più
     grosse: da 2 a 1300 danni al secondo) e nessuna curva che sale in
     linea retta le sta dietro.

     Quindi il giocatore di riferimento di questa prova è il più forte che
     esista: schiva sempre, indovina sempre, e resta in campo venti
     minuti. Deve morire anche lui, e non al primo inciampo — il quarto
     d'ora è il punto in cui un bambino ha già messo giù il telefono.
     Con la marea del 9/10 resiste in media sei minuti; quattro partite
     oscillano fra due e otto. */
  const forti = []
  for (let i = 0; i < 4; i++)
    forti.push(gioca(r, { rnd: caso(880 + i), campo, bravura: 1, esattezza: 1, oltre: 1200 }).partita)
  const extraMedio = forti.reduce((a, p) => a + p.extra, 0) / forti.length
  nota(`chi risponde a tutto e non sbaglia una schivata resiste ${extraMedio.toFixed(0)}s oltre il traguardo`)
  controlla('nemmeno chi risponde a tutto resiste per sempre',
            forti.every(p => p.esito === 'persa'),
            `${forti.filter(p => p.esito === 'persa').length} su 4`)
  dentro('e non lo prendono nemmeno subito', Math.round(extraMedio), 100, 1100)
}

/* ══════════ 7. il gioco libero non finisce da solo ══════════ */
{
  const r = new Regole(LIBERO)
  const { partita } = gioca(r, { rnd: caso(600), campo, bravura: 1, sapienza: 0.8, fino: 45 })
  controlla('a 45 secondi la sopravvivenza è ancora in piedi (o si è persa)',
            partita.esito !== 'vinta')
  const tempi = []
  for (let i = 0; i < 8; i++)
    tempi.push(gioca(r, { rnd: caso(700 + i), campo, bravura: 0.7, sapienza: 0.6, fino: 300 }).partita.tempo)
  const medio = tempi.reduce((a, b) => a + b, 0) / tempi.length
  nota(`sopravvivenza: si resiste in media ${medio.toFixed(0)} secondi`)
  dentro('la sopravvivenza dura quanto una partita vera', medio, 30, 240)
}

{
  /* ── e adesso si gioca ──
     Un eroe col mazzo già finito, dal primo secondo della Sopravvivenza:
     è la situazione che il bambino ha trovato dopo un pomeriggio. Non
     deve più esserci nemmeno una salita di livello a vuoto, e la partita
     deve finirla la marea — non c'è nessuna vittoria da dichiarare, o il
     primato avrebbe un tetto sopra e rigiocare non servirebbe più. */
  const partite = []
  for (const seme of [3001, 3113]) {
    const p = new Partita(new Regole(LIBERO), { rnd: caso(seme), campo })
    for (const x of MAZZO) p.potenziamenti[x.chiave] = x.max
    p.eroe.cuoriMax += MAZZO.find(x => x.chiave === 'cuore').max
    p.eroe.cuori = p.eroe.cuoriMax
    p.livello = 76                       // le settantacinque copie sono state prese
    p.ricalcola()
    /* si gioca a mano invece di chiamare `gioca`, perché la cosa da
       contare è proprio quella che il banco non riporta: le salite di
       livello che non hanno portato nessuna carta */
    const pilota = new Pilota({ rnd: caso(seme + 7), bravura: 1, esattezza: 1 })
    const dt = 1 / 30
    let vuote = 0, passi = 0
    while (passi++ < 3600 / dt && !p.finita) {
      if (p.inPausa) { pilota.rispondi(p); continue }
      const prima = p.livello
      pilota.guida(p, dt)
      const daParte = p.daSpendere
      p.avanza(dt)
      if (p.eventi.length) p.svuotaEventi()
      if (p.livello > prima && !(p.daSpendere > daParte)) vuote++
    }
    partite.push({ partita: p, pilota, vuote })
  }
  for (const { partita, vuote } of partite) {
    controlla('col mazzo finito la marea vince comunque', partita.esito === 'persa',
              `finisce ${partita.esito}`)
    controlla('e non si vince niente', !partita.vinta && partita.stelle === 0)
    uguale('nessuna salita di livello resta senza carta', vuote, 0)
  }
  const medio = partite.reduce((a, x) => a + x.partita.tempo, 0) / partite.length
  const oltre = partite.reduce((a, x) => a + MAZZO.reduce(
    (s, c) => s + Math.max(0, (x.partita.potenziamenti[c.chiave] || 0) - c.max), 0), 0) / partite.length
  const chieste = partite.reduce((a, x) => a + x.pilota.domande, 0) / partite.length
  nota(`col mazzo finito si resiste ancora ${medio.toFixed(0)}s, ` +
       `con ${chieste.toFixed(0)} domande e ${oltre.toFixed(0)} copie oltre il tetto`)
  controlla('il secondo giro consegna delle carte, non dei livelli a vuoto', oltre >= 10,
            `solo ${oltre.toFixed(0)} copie in più`)
  /* «ancora un po'», non «il doppio»: con la marea di adesso si
     resiste in media 620 secondi in questa situazione (col vecchio mazzo
     e la marea più lenta erano 859, con ventidue salite di livello
     buttate) */
  dentro('e si resiste ancora un po\', non il doppio', Math.round(medio), 450, 1250)
}


riassunto('survivors')
