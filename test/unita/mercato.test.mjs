/* IL MERCATO DELLA FATTORIA, SENZA BROWSER

   Le cose che questo file difende, e sono decisioni di prodotto:
     1. **un ordine chiede solo quello che si può davvero produrre** —
        e non a occhio: si ricava dal livello (`merciDelLivello`) e si
        controlla per **ogni** livello, dal primo all'ultimo;
     2. **il mercato non paga monete** — mai, in nessun caso: le monete
        entrano solo dagli esercizi degli altri giochi, e un banco che
        comprasse il grano chiuderebbe l'anello (`CALIBRAZIONE.md`);
     3. **un ordine non rende più del tempo che costa produrlo**;
     4. **rifiutare costa attesa** — se no si scorre finché esce quello
        facile, e il mercato diventa una slot machine;
     5. **una fattoria di ieri si riapre senza rompersi**, e senza
        ordini fantasma.
   `node test/esegui.mjs mercato --niente-build` */
import { Fattoria, borsaInfinita } from '../../src/giochi/fattoria/motore/fattoria.js'
import {
  mercatoIn, merciOrdinabili, aggiornaIlMercato, ordiniDi, riposiDi, ordineDi,
  consegna, rifiuta, cheMancaPer, puoiConsegnare, qualcosaDaConsegnare, bancoDi,
} from '../../src/giochi/fattoria/motore/mercato.js'
import {
  guastiDelMercato, CLIENTI, POSTI, PEZZI_MAX, MERCI_MAX, RIPOSO_MIN,
  merciDelLivello, valoreDi, minutiDi, premioPer, PREMIO_BASE, premioDelPezzo, gestiDi, pesoDellaMerce,
  MONETE_AL_MINUTO, clientiPer,
} from '../../src/giochi/fattoria/dati/mercato.js'
import { PRODOTTI, RICETTE, COLTURE } from '../../src/giochi/fattoria/dati/coltivazioni.js'
import { ULTIMO, sogliaDi, livelloDelProdotto }
  from '../../src/giochi/fattoria/dati/livelli.js'
import { PER_ID } from '../../src/giochi/fattoria/dati/catalogo.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* Una sorte seminabile: una partita si deve poter rifare identica, se no
   il test racconta ogni volta una storia diversa. */
function sorte(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

/* Una borsa che tiene il conto: serve solo a provare che il mercato
   **non la tocca mai**. */
function borsaTracciata(iniziale) {
  let n = iniziale
  return { quante: () => n, paga: c => { n -= c; return true }, saldo: () => n }
}

/* Una fattoria a un certo livello, con la bancarella in mappa e tutti i
   premi presi. `speso` si scrive a mano perché quello che si prova qui
   non è come si sale di livello (quello è `unita/livelli-fattoria`). */
function conIlMercato(livello = 26, borsa = borsaInfinita()) {
  const f = new Fattoria({ borsa })
  f.speso = sogliaDi(livello)
  f.reclamaTutto()
  /* La bancarella arriva al livello 4: sotto non si posa, ed è giusto
     così. Quello che si prova ai primi tre livelli è **cosa si può
     chiedere**, che non ha bisogno del banco in mappa. */
  if (f.sbloccata('mercato')) {
    const dove = f.cellaLibera(14, 14)
    const r = f.posa('mercato', dove.x, dove.y)
    if (!r.ok) throw new Error('la bancarella non si posa: ' + r.motivo)
  }
  /* E i silos — tutti e tre, la dispensa compresa: senza, la capienza
     è **zero** e non si tiene in mano niente (`dati/coltivazioni.js`).
     Non è una comodità del test — è la fattoria vera di chi arriva al
     mercato, che il silo ce l'ha da prima del banco. */
  for (const [id, x, y] of [['silo', 22, 22], ['silo_bianco', 26, 22], ['dispensa', 20, 26]]) {
    if (!f.sbloccata(id)) continue
    const dove = f.cellaLibera(x, y)
    const r = f.posa(id, dove.x, dove.y)
    if (!r.ok) throw new Error(`${id} non si posa: ${r.motivo}`)
  }
  return f
}

/* ══════════ 1. i dati stanno in piedi ══════════ */
const guasti = guastiDelMercato()
controlla('il mercato non ha guasti', guasti.length === 0, guasti.join(' · '))
controlla('i clienti sono almeno quattro', CLIENTI.length >= 4)
uguale('i posti al banco sono tre', POSTI, 3)

/* ══════════ 1b. CHI ORDINA È UNO A CUI QUELLA ROBA SERVE ══════════
   Il cliente era pescato fra tutti, e con sette merci non si notava:
   con ventidue sì — il pizzaiolo che chiede la lana fa sembrare il
   banco una lotteria invece di un mercato. Adesso si pesca prima la
   roba e poi la faccia (`clientiPer`), e qui si controlla sulla
   scaletta intera che non esca mai un mestiere a sproposito. */
{
  const f = conIlMercato(ULTIMO)
  let quanti = 0, storti = 0
  const facce = new Set()
  for (let s = 1; s <= 200; s++) {
    f.ordini = []
    aggiornaIlMercato(f, 1000, sorte(s))
    for (const o of ordiniDi(f)) {
      quanti++
      facce.add(o.chi)
      const c = CLIENTI.find(x => x.id === o.chi)
      if (c.vuole && !c.vuole.some(p => o.chiede[p])) storti++
    }
  }
  uguale(`nessun mestiere chiede roba che non gli serve (${quanti} ordini)`, storti, 0)
  controlla('e al banco si vedono quasi tutti', facce.size >= CLIENTI.length - 2,
            `${facce.size} facce su ${CLIENTI.length}`)
  /* Chi prende di tutto è il ripiego che tiene: una merce che nessun
     mestiere cita di suo deve poter uscire lo stesso. */
  controlla('una merce che nessuno vuole per mestiere trova comunque un cliente',
            clientiPer({ verzatorta: 1 }).length > 0)
}

/* I due conti che risalgono la catena rifanno **esatti** i numeri della
   tabella in `docs/fattoria.md`: è il modo di sapere che non se li sono
   inventati, e diventa rosso il giorno che qualcuno ritocca una ricetta
   senza aggiornare la documentazione. */
{
  /* Uova e tartufi hanno **cambiato minuti e non prezzo**, ed è
     esattamente quello che l'orto doveva fare: le anatre fanno l'uovo
     in 33 minuti invece dei 36 del pollaio e la zuppa di pomodori
     porta il tartufo da 72 a 60, ma tutti e due costano ancora 🪙5 e
     🪙9 — una bocca nuova guadagna sul tempo e sui campi, mai sul
     prezzo, se no svaluterebbe quella di chi c'è arrivato prima. */
  const attesi = { mangime: [3, 14], uova: [5, 33], latte: [5, 36],
                   pastone: [7, 30], tartufi: [9, 60],
                   miele: [5, 56], merenda: [8, 84], concime: [5, 38] }
  for (const [p, [v, m]] of Object.entries(attesi)) {
    uguale(`${p} costa 🪙${v} a produrlo`, valoreDi(p), v)
    uguale(`e ci vogliono ${m} minuti`, minutiDi(p), m)
  }
}

/* ══════════ 2. si chiede solo quello che si può produrre ══════════
   È il controllo che il committente ha chiesto per nome, e si fa **per
   ogni livello**: una fattoria al livello L, con tutto quello che L
   apre già preso, non deve mai vedersi chiedere una merce che a L non
   esiste. Il caso da cui nasce: le zucche arrivano al 26, e un ordine
   di zucche al livello 5 sarebbe un tasto che non si può premere per
   ventimila monete. */
{
  let guasti = 0, visti = new Set(), ordini = 0
  for (let liv = 1; liv <= ULTIMO; liv++) {
    const f = conIlMercato(liv)
    const lecite = new Set(merciDelLivello(liv))
    /* venti giri di sorte diversa per livello: un ordine solo non
       proverebbe niente, perché ne pesca una a caso */
    for (let s = 1; s <= 20; s++) {
      f.ordini = []
      aggiornaIlMercato(f, 1000, sorte(liv * 1000 + s))
      for (const o of ordiniDi(f)) {
        ordini++
        for (const p of Object.keys(o.chiede)) {
          visti.add(p)
          if (!lecite.has(p) || livelloDelProdotto(p) > liv) {
            if (guasti < 3) nota(`al livello ${liv} è uscito ${p}`)
            guasti++
          }
        }
      }
    }
  }
  uguale(`nessun ordine chiede roba di là da venire (${ordini} ordini provati)`, guasti, 0)
  /* E il contrario: in tutta la scaletta si arriva a chiedere **tutte**
     le merci. Un filtro che lasciasse passare solo il grano
     supererebbe il controllo di sopra e sarebbe un mercato rotto. */
  uguale('e prima o poi si chiedono tutte le merci',
         Object.keys(PRODOTTI).filter(p => !visti.has(p)).join(' '), '')
}

/* Al primo livello si produce **solo grano**, e il mercato lo dice: è
   la prova che il filtro guarda la catena e non una lista scritta a
   mano. (La bancarella arriva al 4, ma il motore deve rispondere
   giusto a qualunque livello — un motore che accetta tutto è un buco.) */
{
  const f = conIlMercato(1)
  uguale('al livello 1 si può ordinare solo il grano',
         merciOrdinabili(f).join(' '), 'grano')
  const g = conIlMercato(9)
  controlla('al livello 9 ci sono le uova', merciOrdinabili(g).includes('uova'))
  controlla('ma non i tartufi', !merciOrdinabili(g).includes('tartufi'))
  nota(`livello 8: si può ordinare ${merciOrdinabili(g).join(', ')}`)
}

/* Un ordine resta piccolo: «tre grano» si conta sulle dita, e a sei
   anni è la differenza fra un obiettivo e un compito. */
{
  const f = conIlMercato(26)
  let merciMax = 0, pezziMax = 0, quanti = 0
  for (let s = 1; s <= 300; s++) {
    f.ordini = []
    aggiornaIlMercato(f, 1000, sorte(s))
    for (const o of ordiniDi(f)) {
      quanti++
      merciMax = Math.max(merciMax, Object.keys(o.chiede).length)
      pezziMax = Math.max(pezziMax, ...Object.values(o.chiede))
      for (const n of Object.values(o.chiede))
        controlla('mai zero pezzi di qualcosa', n >= 1)
    }
  }
  dentro(`al massimo ${merciMax} merci per ordine`, merciMax, 1, MERCI_MAX)
  dentro(`e al massimo ${pezziMax} pezzi di ognuna`, pezziMax, 1, PEZZI_MAX)
  nota(`${quanti} ordini pescati con 300 semi diversi`)
}

/* ══════════ 3. il premio: esperienza, mai monete ══════════ */
{
  const borsa = borsaTracciata(1000)
  const f = conIlMercato(26, borsa)
  const dopoLaBancarella = borsa.saldo()
  f.ordini = []
  aggiornaIlMercato(f, 1000, sorte(7))
  const o = ordiniDi(f)[0]
  for (const [p, n] of Object.entries(o.chiede)) f.metti(p, n)

  const primaEsperienza = f.esperienza
  const r = consegna(f, o.id, 2000, sorte(9))
  controlla('un ordine con la roba in mano si consegna', r.ok, r.motivo)
  uguale('consegnare non tocca le monete', borsa.saldo(), dopoLaBancarella)
  uguale('e l\'esperienza sale del premio dell\'ordine',
         f.esperienza - primaEsperienza, o.xp)
  uguale('che è quello che il motore aveva promesso', r.xp, o.xp)
  uguale('la merce esce dal granaio',
         Object.keys(o.chiede).reduce((n, p) => n + f.quantoHo(p), 0), 0)
  uguale('e il posto si riempie subito', ordiniDi(f).length, POSTI)
  controlla('con un ordine diverso da quello appena consegnato',
            !ordineDi(f, o.id))

  /* La formula, scritta una volta e provata qui: base più i gesti,
     con un bonus per ogni fase oltre la prima. */
  uguale('il premio è base + 2 × i gesti, per il crudo',
         premioPer({ grano: 3 }), PREMIO_BASE + 2 * 3)
  uguale('una torta sono diciotto gesti in cinque fasi', gestiDi('torta'), 18)
  uguale('e rende 71', premioPer({ torta: 1 }), 71)
}

/* ── LA CATENA LUNGA NON PUÒ RENDERE MENO ─────────────────────────
   È il difetto per cui il premio è stato rifatto: pagava le monete
   spese e non il lavoro, e un raccolto crudo rendeva il triplo per
   gesto di un maglione alla lavanda. Qui si pretende il verso giusto:
   per ogni ricetta, un pezzo rende **per gesto** almeno quanto il più
   generoso dei suoi ingredienti — sulla strada che il premio conta,
   cioè quella coi gesti minimi. Le altre possono rendere meno, ed è
   giusto: il fiorume col concime è l'anello che torna alla terra, e
   passarci costa più lavoro di quanto paghi. */
{
  for (const p of Object.keys(PRODOTTI)) {
    const g = gestiDi(p)
    if (!Number.isFinite(g) || g <= 1) continue
    const suo = premioDelPezzo(p) / g
    const gestiDella = r => Object.entries(r.prende).reduce((n, [k, q]) => n + q * gestiDi(k), 1)
    const ricette = RICETTE.filter(r => r.da === p && gestiDella(r) === g)
    for (const r of ricette)
      for (const k of Object.keys(r.prende)) {
        const loro = premioDelPezzo(k) / gestiDi(k)
        controlla(`${p} rende per gesto almeno quanto ${k}`, suo >= loro - 1e-9,
                  `${suo.toFixed(2)} contro ${loro.toFixed(2)}`)
      }
  }
}

/* ── IL RITMO DEI LIVELLI NON ACCELERA ────────────────────────────
   Il premio nuovo paga i gesti e non le monete, e sopra ci sono le
   botteghe (+25%), la mongolfiera coi suoi bonus e la fila nelle
   macchine. Con `PER_GESTO = 3` un raccolto portato al banco rendeva
   il 20–30% in più di prima, e tutto insieme la roba nuova sarebbe
   arrivata prima di aver giocato con quella che c'era. Qui si tiene
   fermo il tetto: **al banco, in media, un raccolto non rende più di
   ⭐6,8** (prima erano ⭐7,2–7,4; il resto lo mettono botteghe e
   mongolfiera). La media è pesata come la pesca vera, su un ordine da
   due pezzi, e i raccolti si contano lungo la strada dei gesti minimi.
   È un conto su una tabella, non su una partita: se un giorno si vuole
   misurare davvero, questo è il numero da confrontare. */
{
  const racc = {}
  const raccolti = p => {
    if (p in racc) return racc[p]
    racc[p] = Infinity
    let meglio = Infinity, n = Infinity
    if (COLTURE.some(c => c.da === p)) { meglio = 1; n = 1 }
    for (const r of RICETTE.filter(r => r.da === p)) {
      let g = 1, k = 0
      for (const [q, m] of Object.entries(r.prende)) { g += m * gestiDi(q); k += m * raccolti(q) }
      if (g < meglio) { meglio = g; n = k }
    }
    return (racc[p] = n)
  }
  let peggio = 0, dove = 0
  for (let l = 5; l <= ULTIMO; l += 5) {
    const merci = merciDelLivello(l).filter(p => Number.isFinite(raccolti(p)))
    let xp = 0, rc = 0, pesi = 0
    for (const p of merci) {
      const w = pesoDellaMerce(p, l)
      xp += w * (premioPer({ [p]: 2 }) - PREMIO_BASE * (1 - 1 / 1.75))
      rc += w * 2 * raccolti(p); pesi += w
    }
    const media = xp / rc
    if (media > peggio) { peggio = media; dove = l }
  }
  controlla(`al banco un raccolto rende al più ⭐6,8 (il massimo è ${peggio.toFixed(1)}, al ${dove})`,
            peggio <= 6.8)
}

/* La pesca pesa: una merce profonda esce più di una cruda, e una
   appena arrivata più di tutte. */
{
  controlla('la torta pesa più del grano', pesoDellaMerce('torta', 40) > pesoDellaMerce('grano', 40))
  controlla('una merce appena arrivata pesa di più',
            pesoDellaMerce('torta', 20) > pesoDellaMerce('torta', 40))
}

/* Il tetto: quattro volte il costo in monete non può superare quello
   che varrebbe il tempo di produrre la roba (🪙6 al minuto). È il freno
   che tiene il mercato lontano dall'essere la scorciatoia per salire di
   livello senza fare esercizi. */
{
  let peggio = 0, peggioNome = ''
  for (const p of Object.keys(PRODOTTI)) {
    const reso = premioPer({ [p]: PEZZI_MAX })
    const tempo = MONETE_AL_MINUTO * minutiDi(p) * PEZZI_MAX
    controlla(`${PEZZI_MAX} ${p} rendono meno del tempo che costano`, reso <= tempo,
              `${reso} contro ${tempo}`)
    if (reso / tempo > peggio) { peggio = reso / tempo; peggioNome = p }
  }
  nota(`il caso più generoso è ${peggioNome}: rende il ${Math.round(peggio * 100)}% ` +
       'di quello che varrebbe il suo tempo')
}

/* E consegnare **può far salire di livello**: è tutto il senso della
   seconda sorgente di esperienza (`dati/livelli.js`). */
{
  const f = conIlMercato(4)
  f.speso = sogliaDi(5) - 1                 // a una moneta dal livello 5
  f.reclamaTutto()
  f.ordini = []
  aggiornaIlMercato(f, 1000, sorte(3))
  const o = ordiniDi(f)[0]
  for (const [p, n] of Object.entries(o.chiede)) f.metti(p, n)
  const prima = f.livello
  const r = consegna(f, o.id, 2000, sorte(4))
  controlla('a un passo dal livello, un ordine lo fa scattare', r.salito,
            `${prima} → ${f.livello}`)
  controlla('e il livello è salito davvero', f.livello > prima)
}

/* ══════════ 4. quello che manca, e cosa non si può fare ══════════ */
{
  const f = conIlMercato(26)
  f.ordini = []
  aggiornaIlMercato(f, 1000, sorte(11))
  const o = ordiniDi(f)[0]
  const manca = cheMancaPer(f, o)
  controlla('a granaio vuoto manca tutto', manca.length === Object.keys(o.chiede).length)
  controlla('e non si consegna', !puoiConsegnare(f, o))
  const no = consegna(f, o.id, 1000, sorte(1))
  uguale('il motore dice di no', no.ok, false)
  uguale('col suo perché', no.motivo, 'manca-roba')
  controlla('e non ha toccato niente', ordiniDi(f).some(x => x.id === o.id))

  /* Mezzo ordine non si consegna: se la roba non basta non esce
     niente dal granaio. È l'unica cosa che, in tutta la fattoria,
     potrebbe far sparire il lavoro di un bambino. */
  const [p, n] = Object.entries(o.chiede)[0]
  f.metti(p, n)
  const meta = consegna(f, o.id, 1000, sorte(1))
  if (Object.keys(o.chiede).length > 1) {
    uguale('con metà roba non si consegna', meta.ok, false)
    uguale('e quella metà resta in granaio', f.quantoHo(p), n)
  }
}

/* Senza bancarella in mappa non si consegna niente: una comprata e
   lasciata nel baule non fa niente, come un silo nel baule non contiene
   niente. */
{
  const f = new Fattoria({ borsa: borsaInfinita() })
  f.speso = sogliaDi(26)
  f.reclamaTutto()
  uguale('senza bancarella non c\'è mercato', mercatoIn(f), null)
  aggiornaIlMercato(f, 1000, sorte(5))
  const o = ordiniDi(f)[0]
  for (const [p, n] of Object.entries(o.chiede)) f.metti(p, n)
  uguale('e non si consegna', consegna(f, o.id, 1000, sorte(1)).motivo, 'niente-mercato')
  controlla('la bancarella è unica come i silos', !!PER_ID.mercato.unico)
}

/* ══════════ 5. rifiutare costa attesa ══════════ */
{
  const f = conIlMercato(26)
  f.ordini = []
  aggiornaIlMercato(f, 1000, sorte(13))
  uguale('al banco ci sono tre ordini', ordiniDi(f).length, POSTI)
  const o = ordiniDi(f)[0]
  const r = rifiuta(f, o.id, 1000)
  controlla('un ordine si rifiuta', r.ok)
  uguale('e il posto resta vuoto', ordiniDi(f).length, POSTI - 1)
  uguale('con un\'attesa davanti', riposiDi(f).length, 1)

  aggiornaIlMercato(f, 1000 + 60000, sorte(14))
  uguale('un minuto dopo non è ancora arrivato niente', ordiniDi(f).length, POSTI - 1)
  aggiornaIlMercato(f, 1000 + (RIPOSO_MIN + 1) * 60000, sorte(15))
  uguale(`dopo ${RIPOSO_MIN} minuti il posto è di nuovo pieno`,
         ordiniDi(f).length, POSTI)
  /* Il modo di vedere da fuori che l'attesa serve: rifiutando all'
     infinito non si arriva mai a tre ordini nuovi in un colpo. */
  const g = conIlMercato(26)
  aggiornaIlMercato(g, 1000, sorte(21))
  for (const x of ordiniDi(g)) rifiuta(g, x.id, 1000)
  aggiornaIlMercato(g, 1500, sorte(22))
  uguale('rifiutati tutti, il banco resta vuoto', ordiniDi(g).length, 0)
}

/* ══════════ 6. il fumetto, e quello che la schermata riceve ══════════ */
{
  const f = conIlMercato(26)
  f.ordini = []
  aggiornaIlMercato(f, 1000, sorte(17))
  const bancarella = mercatoIn(f)
  uguale('a granaio vuoto la bancarella non chiama nessuno',
         (f.aspettoDellaCosa(bancarella, 1000) || {}).fumetto, undefined)
  const o = ordiniDi(f)[0]
  for (const [p, n] of Object.entries(o.chiede)) f.metti(p, n)
  controlla('con la roba in mano c\'è qualcosa da consegnare', qualcosaDaConsegnare(f))
  uguale('e la bancarella lo dice da lontano',
         (f.aspettoDellaCosa(bancarella, 1000) || {}).fumetto, '📋')

  const banco = bancoDi(f, 1000)
  uguale('il banco consegna alla schermata tutti gli ordini',
         banco.ordini.length, POSTI)
  controlla('con dentro chi ordina', banco.ordini.every(x => x.cliente && x.cliente.nome))
  controlla('e cosa manca, già contato',
            banco.ordini.every(x => x.righe.every(r => typeof r.hai === 'number')))
  controlla('e chi è pronto', banco.ordini.some(x => x.pronto))
}

/* ══════════ 7. un salvataggio si riapre uguale ══════════ */
{
  const f = conIlMercato(26)
  f.ordini = []
  aggiornaIlMercato(f, 1000, sorte(19))
  const o = ordiniDi(f)[0]
  for (const [p, n] of Object.entries(o.chiede)) f.metti(p, n)
  consegna(f, o.id, 2000, sorte(20))

  const dato = JSON.parse(JSON.stringify(f.serializza()))
  const g = new Fattoria({ borsa: borsaInfinita(), dato })
  uguale('gli ordini si rileggono', ordiniDi(g).length, ordiniDi(f).length)
  uguale('e l\'esperienza guadagnata pure', g.guadagnato, f.guadagnato)
  uguale('e il livello è lo stesso', g.livello, f.livello)
  /* Gli id non si riusano mai: un ordine consegnato e uno nuovo con la
     stessa chiave sarebbero lo stesso ordine consegnato due volte. */
  controlla('e gli id non ripartono da capo', g.prossimoOrdine > ordiniDi(g).length)

  /* Una fattoria di ieri: nessun mercato nel salvataggio. Deve aprirsi
     senza rompersi e senza ordini fantasma. */
  delete dato.ordini
  delete dato.guadagnato
  delete dato.prossimoOrdine
  const vecchia = new Fattoria({ borsa: borsaInfinita(), dato })
  uguale('una fattoria di ieri non ha ordini aperti', ordiniDi(vecchia).length, 0)
  uguale('né esperienza guadagnata al banco', vecchia.guadagnato, 0)
  controlla('e il mercato riparte da lì', aggiornaIlMercato(vecchia, 5000, sorte(2)))
  uguale('con i suoi tre ordini', ordiniDi(vecchia).length, POSTI)

  /* E un ordine che chiede una merce sparita dal catalogo si butta: un
     posto occupato da un tasto che non si può premere è peggio di un
     posto vuoto. */
  const storto = JSON.parse(JSON.stringify(f.serializza()))
  storto.ordini = [{ id: 99, chi: 'fornaio', chiede: { verzatorta: 3 }, xp: 40 }, null, null]
  const pulita = new Fattoria({ borsa: borsaInfinita(), dato: storto })
  uguale('un ordine di roba che non esiste più non si rilegge',
         ordiniDi(pulita).length, 0)
}

riassunto('Il mercato della fattoria')
