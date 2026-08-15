#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   LE QUINDICI TAPPE DEL CASTELLO, PASSATE AI RAGGI X

       node strumenti/valida-percorsi.mjs

   Una `forma` in `data/campagne-castello.js` è una spezzata di sei
   numeri per riga: si legge bene e non dice niente. Questo strumento
   la fa diventare quello che diventa in gioco — la smussa con lo
   stesso Chaikin del motore, ci dispone le postazioni con la stessa
   formula di `motore/battaglia.js` — e poi controlla le cose che a
   occhio non si vedono. Una volta sola, sulle misure del mondo
   (`MONDO` in `data/castello.js`): prima erano due, telefono e
   computer, perché il campo si stirava dentro il riquadro che
   trovava; adesso il mondo è dichiarato e a piegarsi è lo schermo.

   Le distanze sono in **unità di disegno** (`S`), la stessa misura in
   cui sono scritti i raggi delle torri e le piazzole: in pixel non
   vorrebbero dire niente, perché il campo cambia taglia.

   ── che cosa guarda ──

     margini      il tracciato sta dentro il riquadro giocabile, entra
                  dal bordo di sopra ed esce in fondo;

     gomito       quanto si avvicinano due parti del tracciato che
                  distano fino a 200 unità **di cammino**: è una curva
                  che torna su sé stessa, e va bene che si avvicini —
                  nell'incavo di un gomito la torre ci sta apposta. Il
                  minimo serve solo a escludere i tornanti a spillo;

     corridoio    la stessa cosa fra parti che distano più di 200
                  unità di cammino: lì sono due corsie diverse, e
                  devono starsi larghe. Il conto del minimo: 34
                  (quanto sta fuori una postazione) + 15 (la sua
                  piazzola) + 17 (mezza strada) = 66, tenuto a 62;

     piazzole     la distanza fra le due postazioni più vicine, da tre
                  fino a **quante ne avrà davvero questa tappa** —
                  glielo si chiede a `data/castello.js` — più due di
                  margine per il giorno in cui l'economia ne aprisse
                  qualcuna in più;

     presidio     quanta strada tiene sotto tiro una postazione,
                  misurata in raggi d'arciere. Su un tracciato diritto
                  una torre ne batte due, uno per lato: presidio ~1,9.
                  Su un tracciato ripiegato la stessa torre ne batte
                  quattro, e la tappa perdona. È la difficoltà che sta
                  nella mappa invece che nei numeri, ed è per questo
                  che deve **scendere** dal bosco alle mura;

     scoperto     la stessa cosa guardata con **le postazioni che la
                  tappa ha davvero**, che da quando i calcoli sono
                  scesi sono tre o quattro, non otto. È un controllo
                  diverso dal presidio e serve a un'altra paura: il
                  presidio è una media, e una media alta si può fare
                  anche con due torri appiccicate e mezzo tracciato
                  senza nessuno. Quindi qui si guarda il **buco**: il
                  tratto continuo più lungo che nessuna torre vede.
                  Si contano solo i buchi **interni**, fra la prima e
                  l'ultima postazione: quelli in testa e in coda non
                  dipendono dal disegno ma dalla formula che dispone
                  le piazzole a `lunghezza/(n+1)`, che lascia sempre
                  un quarto di strada libero all'ingresso e uno
                  all'uscita, su qualunque mappa;

     debolezze    dove sono accese, ogni mostro deve essere debole a
                  una torre che la tappa mette a disposizione, e in un
                  elenco devono comparire almeno due debolezze diverse.
                  In più — ed è una richiesta di questo file, non una
                  regola del gioco — due ondate di fila non devono
                  chiedere la stessa torre.
   ═══════════════════════════════════════════════════════════════════ */
import { Percorso } from '../src/motore/castello/percorso.js'
import { CAMPAGNE, RACCONTO } from '../src/data/campagne-castello.js'
import { MOSTRI, torreDebole } from '../src/data/mostri.js'
/* Quante piazzole avrà davvero la tappa lo decide l'economia, che sta
   in un altro file e in un altro cantiere. La si legge — non la si
   scrive — perché senza quel numero questo strumento controllerebbe
   una mappa che non esiste: gli stessi tracciati con otto torri e con
   tre non sono la stessa difesa. */
import { postiDi, MONDO } from '../src/data/castello.js'

/* ── i margini del campo ──
   Il campo è verticale: i mostri entrano dal bordo **alto** e scendono
   fino al castello, che sta in basso. Prima entravano da sinistra e
   uscivano a destra, perché il riquadro era quasi quadrato e schiacciato
   fra la barra e il banco dei bottoni; il banco non c'è più, il campo si
   prende lo schermo, e lo schermo di un telefono è alto. */
const X0 = 0.05, X1 = 0.95, Y0 = 0.04, Y1 = 0.95
const INGRESSO = 0.05           // il primo punto sta sul bordo di sopra
const USCITA = 0.90             // l'ultimo arriva davvero in fondo

/* ── le distanze minime, in unità di disegno ── */
const GOMITO = 52               // dentro una curva che rientra
const CORRIDOIO = 62            // fra due corsie diverse
const PIAZZOLE = 40             // fra due postazioni, da 3 a 8
const PIAZZOLE_FITTE = 22       // fra due postazioni, nei due di margine
const VICINO = 80               // sotto questo cammino due punti sono lo stesso tratto
const LONTANO = 200             // oltre questo cammino sono due corsie
const RAGGIO = 92               // il raggio dell'arciere di livello 1
/* Quanta parte finale di una strada è «confluenza»: lì due ingressi si
   avvicinano per forza, perché la porta del castello è una sola, e
   pretendere che stiano larghi vorrebbe dire pretendere due castelli.
   Un quinto è quanto basta a farle arrivare insieme senza che diventino
   una corsia sola per mezza mappa — che è il modo noto di rendere finta
   una mappa a due ingressi: se si uniscono presto, si difende solo il
   tratto comune e i due ingressi non li guarda più nessuno. */
const CONFLUENZA = 0.2
/* Sotto questa distanza due strade **sono la stessa strada**: è una Y
   che si chiude, un anello che si richiude, un canale che si immette.
   È il caso che prima non esisteva — c'erano solo strade separate — e
   che rendeva tutte le mappe a più ingressi due canali paralleli. */
const FUSE = 9
/* e quanto può durare il tratto in cui sono fuse: oltre la metà, una
   mappa a due bocche si difende tutta dopo l'incrocio, e i due ingressi
   diventano un disegno senza conseguenze */
const COMUNE = 0.5
/* ── la via di mezzo ──
   Due strade che si separano passano per forza da venti, trenta,
   quaranta unità: è la forcella, e dura un attimo. Quello che non deve
   esistere è un **tratto lungo** in cui stanno a quella distanza — a
   schermo si legge come una strada sola sbavata, e in gioco sono due
   che nessuna torre riesce a coprire insieme. Quindi non si guarda la
   distanza minima: si guarda per quanta strada si sta in mezzo.

   Diciotto per cento perché una forcella costa il suo, e una mappa può
   averne due: la clessidra della Foce si fonde a metà campo e si
   riapre subito dopo, e ogni passaggio si porta dietro il suo tratto di
   avvicinamento. Sopra questa quota non è più una forcella — è un
   corridoio doppio. */
const IN_MEZZO = 0.18

/* ── le fasce per campagna: lunghezza in unità, presidio in raggi ──
   Non c'è più un «vale per il telefono»: il mondo è uno solo, e queste
   fasce valgono lì. **Sono le stesse di prima del campo verticale**, e
   non è una svista: il mondo nuovo ha la stessa area in unità di quello
   vecchio (vedi `MONDO` in `data/castello.js`), solo girata. Una strada
   misura ancora fra i 400 e i 1000 unità e una torre ne presidia ancora
   due raggi scarsi — quello che è cambiato è la forma, non la quantità
   di gioco. */
const FASCE = {
  bosco:       { lung: [780, 1000], presidio: [2.15, 2.70] },
  sotterraneo: { lung: [520, 950],  presidio: [1.95, 2.40] },
  mura:        { lung: [420, 800],  presidio: [1.80, 2.20] },
  /* La Palude è fuori dalla scala del presidio, e non per svista: le
     sue strade sono corte perché sono due o tre, e la difficoltà non
     sta più in quanto una torre presidia ma in **quanti fronti** ci
     sono. Chiederle di scendere ancora sotto le Mura vorrebbe dire
     rettifili nudi su tre ingressi, cioè una tappa impossibile per una
     ragione che non si vede. */
  palude:      { lung: [420, 720],  presidio: [1.80, 2.15] },
}
const PRESIDIO_MINIMO = 1.85    // il pavimento, ovunque: sotto è un tiro al bersaglio

/* ── le postazioni che ci sono davvero ──
   `postiDi()` ne dà **tre o quattro** per tappa: sono scese da
   otto-dieci quando il numero di calcoli è sceso, e i percorsi qui
   dentro erano stati disegnati prima. Con tre torri al posto di otto
   un tracciato può lasciare scoperti tratti che con otto non si
   vedevano, e la fascia di presidio non se ne accorge — è una media, e
   le medie non hanno buchi.
   Si guarda il numero vero della tappa, non un numero di comodo: a tre
   e a quattro le piazzole non stanno negli stessi posti, e una mappa
   che regge a quattro può avere un buco a tre. Se un giorno l'economia
   cambia quel numero, questo controllo se ne accorge da solo. */
const postiVeri = t => postiDi(t)
/* In più si prova sempre il caso più magro — **tre** postazioni, il
   minimo che `postiDi` possa dare — anche se oggi nessuna tappa ci
   arriva. Non fa fallire niente: è un avvertimento, perché quanto
   spendere e quante piazzole aprire è una manopola che si gira spesso,
   e se domani una tappa scende a tre è meglio saperlo prima che dopo. */
const MAGRO = 3
/* Il pavimento del presidio si abbassa quando le postazioni sono
   poche: con tre torri su un rettifilo delle mura non si può chiedere
   la densità che ne fanno sei. Quello che non si sconta è il buco. */
const PRESIDIO_POCHI = 1.78
/* Quanto può essere lungo un tratto interno che nessuna torre vede.
   Sessanta unità sono due terzi scarsi di un raggio d'arciere: il
   nemico ci passa senza prendere niente, ma non fa in tempo a
   riprendere fiato. Oggi la peggiore delle quindici sta a 42. */
const BUCO_INTERNO = 60
/* e l'ordine fra le campagne, che è il punto di tutto: il bosco
   perdona più del sotterraneo, che perdona più delle mura */
const SCALINO = 0.12

/* La misura del campo, e adesso è **una sola**: il mondo è dichiarato
   in `data/castello.js` e non si piega più allo schermo — è la
   telecamera a incorniciarlo. Prima qui ce n'erano due, telefono e
   computer, e metà dei controlli esisteva per dire quanto peggiorava
   la seconda. */
const MISURE = [{ nome: 'campo', W: MONDO.W, H: MONDO.H }]
/* la scala non si calcola più: la dichiara il mondo */
const scalaDi = () => MONDO.S

/* ── il campo, chiesto al motore ──
   Prima queste nove righe erano una copia fedele della geometria di
   `motore/battaglia.js`, tenuta uguale a mano. Non lo sono più: da
   quando le piazzole stanno in una classe esportata (`Percorso`) si
   importa quella, e la copia — che nel frattempo era **divergita**,
   perché occupava ancora le postazioni partendo dal castello mentre il
   gioco le occupa dall'ingresso — non c'è più. Questo strumento
   controlla il campo su cui si gioca davvero, e non c'è più niente da
   tenere allineato.

   `forme` può essere una spezzata sola o un elenco: le tappe a due
   ingressi hanno due strade, e il `Percorso` le spartisce le piazzole
   da sé. */
function campoDi(forme, W, H, S, quante) {
  const p = new Percorso(forme, quante, { W, H, S })
  return { via: p.via, vie: p.vie, postazioni: p.postazioni }
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const dove = (p, M) => p ? `(${(p.x / M.W).toFixed(2)}, ${(p.y / M.H).toFixed(2)})` : '—'

/* quanto si sfiorano due parti del tracciato, distinguendo il gomito
   (poco cammino in mezzo) dalla corsia parallela (molto cammino) */
function ravvicinamenti(vie, S) {
  const passo = 4 * S
  let gomito = Infinity, corridoio = Infinity, dg = null, dc = null
  let comune = 0                  // quanta parte di strada due vie fanno insieme
  let inMezzo = 0                 // e quanta ne fanno né insieme né larghe
  for (const via of vie) {
    const camp = via.campiona(passo)
    for (let i = 0; i < camp.length; i++)
      for (let k = i + 1; k < camp.length; k++) {
        const cammino = (k - i) * passo / S
        if (cammino < VICINO) continue
        const d = dist(camp[i], camp[k]) / S
        if (cammino < LONTANO) { if (d < gomito) { gomito = d; dg = camp[i] } }
        else if (d < corridoio) { corridoio = d; dc = camp[i] }
      }
  }
  /* ── e fra due strade diverse ──
     Due ingressi vogliono dire due corsie che vivono in parallelo, e
     valgono le stesse distanze di due corsie della stessa strada. Con
     una differenza: **in fondo si toccano per forza**, perché la porta
     del castello è una sola. L'ultimo pezzo di ciascuna è quindi fuori
     dal conto — lì convergere è il disegno, non un difetto. */
  for (let a = 0; a < vie.length; a++)
    for (let b = a + 1; b < vie.length; b++) {
      const ca = vie[a].campiona(passo), cb = vie[b].campiona(passo)
      const fineA = Math.floor(ca.length * (1 - CONFLUENZA))
      const fineB = Math.floor(cb.length * (1 - CONFLUENZA))
      let fusi = 0, mezzo = 0
      for (let i = 0; i < fineA; i++) {
        let vicino = Infinity
        for (let k = 0; k < fineB; k++) vicino = Math.min(vicino, dist(ca[i], cb[k]) / S)
        if (vicino <= FUSE) { fusi++; continue }    // qui sono la stessa strada
        if (vicino < CORRIDOIO) { mezzo++; if (vicino < corridoio) { corridoio = vicino; dc = ca[i] } }
      }
      comune = Math.max(comune, fusi / ca.length)
      inMezzo = Math.max(inMezzo, mezzo / ca.length)
    }
  return { gomito, corridoio, dg, dc, comune, inMezzo }
}

/* Le due postazioni più vicine, dalle tre di magra fino a quante ne
   avrà davvero questa tappa (`fino`), più due di margine per il giorno
   in cui l'economia ne chiedesse qualcuna in più.

   Prima si provava sempre fino a dodici, ed era una domanda senza
   risposta: una mappa del bosco con dodici piazzole non esiste — ne ha
   quattro — e pretendere che le regga tutte vuol dire raddrizzare le
   anse che sono il motivo per cui quel bosco perdona. Si controlla
   quello che il gioco fa, non quello che potrebbe fare in un mondo
   parallelo. */
function piazzoleStrette(forme, W, H, S, fino = 8) {
  let larga = Infinity, fitta = Infinity, quante = 0
  for (let q = 3; q <= fino + 2; q++) {
    const { postazioni } = campoDi(forme, W, H, S, q)
    for (let i = 0; i < postazioni.length; i++)
      for (let k = i + 1; k < postazioni.length; k++) {
        const d = dist(postazioni[i], postazioni[k]) / S
        if (q <= fino) { if (d < larga) { larga = d; quante = q } }
        else if (d < fitta) fitta = d
      }
  }
  return { larga, fitta, quante }
}

/* Il presidio. Si misura con sei postazioni — il numero di mezzo fra
   quelli che una tappa può avere — così le quindici mappe si
   confrontano fra loro con lo stesso metro. */
function presidioDi(forme, W, H, S, quante = 6) {
  /* Con due ingressi si misura **strada per strada**, come se ognuna
     fosse una tappa a sé: sei postazioni sulla sua, e quanto ne
     presidiano. Se no il numero verrebbe fuori più alto solo perché le
     strade sono corte — e il presidio non è «quanto è comoda la mappa»,
     è «quanta strada tiene una torre», che deve restare confrontabile
     fra una tappa a un ingresso e una a due. */
  const strade = Array.isArray(forme[0][0]) ? forme : [forme]
  const presidi = strade.map(f => {
    const { via, postazioni } = campoDi(f, W, H, S, quante)
    const passo = 3 * S
    const camp = via.campiona(passo)
    const R = RAGGIO * S
    let totale = 0
    for (const t of postazioni)
      for (const c of camp) if (dist(c, t) <= R) totale += passo
    return totale / postazioni.length / R
  })
  return presidi.reduce((s, p) => s + p, 0) / presidi.length
}

/* La tappa vista con le postazioni che ha davvero. Torna il presidio e
   il buco interno più lungo — il tratto continuo che nessuna delle
   `quante` torri raggiunge, contato solo fra la prima e l'ultima
   piazzola. Il raggio è quello dell'arciere: è la torre che si compra
   per prima e quella con cui si copre, non il ghiaccio a 86 né le
   bombe a 132. */
function conPochePostazioni(forme, W, H, S, quante) {
  const { vie, postazioni } = campoDi(forme, W, H, S, quante)
  const passo = 3 * S
  /* con due strade il buco si cerca su tutte e due, ma una per volta:
     la fine di una e l'inizio dell'altra non sono un tratto continuo */
  const camp = vie.flatMap(v => v.campiona(passo))
  const confini = []
  let acc = 0
  for (const v of vie) { acc += v.campiona(passo).length; confini.push(acc) }
  const R = RAGGIO * S
  const visto = camp.map(c => postazioni.some(t => dist(c, t) <= R))
  const primo = visto.indexOf(true), ultimo = visto.lastIndexOf(true)
  let totale = 0
  for (const t of postazioni)
    for (const c of camp) if (dist(c, t) <= R) totale += passo
  let buco = 0, peggiore = 0, punto = null
  for (let i = primo; i <= ultimo; i++) {
    if (visto[i] || confini.includes(i)) { buco = 0; continue }
    buco += passo
    if (buco > peggiore) { peggiore = buco; punto = camp[i] }
  }
  return { presidio: totale / postazioni.length / R, buco: peggiore / S, punto }
}

/* ═══════════ la geometria di una tappa ═══════════ */
function esaminaForma(t) {
  const guasti = [], avvisi = []
  /* una strada o due: una tappa a due ingressi dichiara `forme`, e da
     qui in giù cambia solo il plurale */
  const forme = t.forme || [t.forma]
  const f = forme[0]

  forme.forEach((g, k) => {
    const chi = forme.length > 1 ? `strada ${k + 1}: ` : ''
    if (!g || g.length < 4) guasti.push(`${chi}solo ${g ? g.length : 0} punti: non è un percorso`)
    for (const [i, [x, y]] of g.entries())
      if (x < X0 - 1e-9 || x > X1 + 1e-9 || y < Y0 - 1e-9 || y > Y1 + 1e-9)
        guasti.push(`${chi}punto ${i} (${x}, ${y}) fuori dal riquadro [${X0}–${X1}] × [${Y0}–${Y1}]`)
    if (g[0][1] > INGRESSO) guasti.push(`${chi}non entra dal bordo di sopra (y = ${g[0][1]})`)
    if (g[g.length - 1][1] < USCITA) guasti.push(`${chi}non arriva in fondo (y = ${g[g.length - 1][1]})`)
  })
  /* e tutte devono finire nello stesso punto: il castello è uno solo, e
     due strade che arrivano in due posti diversi sono due partite */
  if (forme.length > 1) {
    const porta = forme[0][forme[0].length - 1]
    for (const g of forme.slice(1)) {
      const suo = g[g.length - 1]
      if (Math.hypot(suo[0] - porta[0], suo[1] - porta[1]) > 0.02)
        guasti.push(`due strade e due porte: ${JSON.stringify(suo)} invece di ${JSON.stringify(porta)}`)
    }
  }

  const misure = []
  for (const M of MISURE) {
    const S = scalaDi(M.W, M.H)
    const { vie } = campoDi(forme, M.W, M.H, S, 6)
    const r = ravvicinamenti(vie, S)
    const p = piazzoleStrette(forme, M.W, M.H, S, postiVeri(t))
    const presidio = presidioDi(forme, M.W, M.H, S)
    /* la lunghezza si guarda **strada per strada**, non sommata: un
       mostro ne percorre una sola, ed è su quella che si misura quanto
       tempo la difesa ha per fermarlo. Due ingressi non fanno una tappa
       lunga il doppio — fanno due tappe corte da difendere insieme, che
       è un'altra cosa e si paga in piazzole (vedi `postiDi`). */
    const lunghe = vie.map(v => v.lunghezza / S)
    const lung = Math.max(...lunghe)
    const fascia = FASCE[t.campagna]

    if (r.gomito < GOMITO)
      guasti.push(`${M.nome}: tornante a spillo, ${r.gomito.toFixed(0)}u ` +
                  `(minimo ${GOMITO}) attorno a ${dove(r.dg, M)}`)
    if (r.inMezzo > IN_MEZZO)
      guasti.push(`${M.nome}: due strade restano nella via di mezzo per il ` +
                  `${(r.inMezzo * 100).toFixed(0)}% (massimo ${IN_MEZZO * 100}%): ` +
                  `né larghe ${CORRIDOIO}u né la stessa strada, attorno a ${dove(r.dc, M)}`)
    if (r.comune > COMUNE)
      guasti.push(`${M.nome}: le strade stanno insieme per il ` +
                  `${(r.comune * 100).toFixed(0)}% (massimo ${COMUNE * 100}%): ` +
                  `gli ingressi non contano più`)
    if (p.larga < PIAZZOLE)
      guasti.push(`${M.nome}: due piazzole a ${p.larga.toFixed(0)}u ` +
                  `(minimo ${PIAZZOLE}) con ${p.quante} postazioni`)
    if (p.fitta < PIAZZOLE_FITTE)
      guasti.push(`${M.nome}: due piazzole a ${p.fitta.toFixed(0)}u ` +
                  `(minimo ${PIAZZOLE_FITTE}) con qualche postazione in più`)
    lunghe.forEach((l, k) => {
      if (l < fascia.lung[0] || l > fascia.lung[1])
        guasti.push(`${M.nome}: ${vie.length > 1 ? `strada ${k + 1} ` : ''}lunga ` +
                    `${l.toFixed(0)}u, fuori dalla fascia ` +
                    `${fascia.lung[0]}–${fascia.lung[1]} della campagna`)
    })
    if (presidio < fascia.presidio[0] || presidio > fascia.presidio[1])
      guasti.push(`${M.nome}: presidio ${presidio.toFixed(2)}, fuori dalla fascia ` +
                  `${fascia.presidio[0]}–${fascia.presidio[1]} della campagna`)
    if (presidio < PRESIDIO_MINIMO)
      guasti.push(`${M.nome}: presidio ${presidio.toFixed(2)}, sotto il pavimento ` +
                  `di ${PRESIDIO_MINIMO}: non c'è tempo di tirare`)

    /* e la stessa mappa con le postazioni che avrà davvero */
    const q = postiVeri(t)
    const poche = conPochePostazioni(forme, M.W, M.H, S, q)
    if (poche.presidio < PRESIDIO_POCHI)
      guasti.push(`${M.nome}: con le sue ${q} postazioni il presidio scende a ` +
                  `${poche.presidio.toFixed(2)}, sotto ${PRESIDIO_POCHI}`)
    if (poche.buco > BUCO_INTERNO)
      guasti.push(`${M.nome}: con le sue ${q} postazioni restano ${poche.buco.toFixed(0)}u ` +
                  `di strada che nessuna torre vede (massimo ${BUCO_INTERNO}) ` +
                  `attorno a ${dove(poche.punto, M)}`)

    /* e il caso più magro, che non fa fallire ma si dice */
    if (q > MAGRO) {
      const v = conPochePostazioni(forme, M.W, M.H, S, MAGRO)
      if (v.buco > BUCO_INTERNO)
        avvisi.push(`${M.nome}: se scendesse a ${MAGRO} postazioni resterebbero ` +
                    `${v.buco.toFixed(0)}u scoperti attorno a ${dove(v.punto, M)}`)
      if (v.presidio < PRESIDIO_POCHI)
        avvisi.push(`${M.nome}: se scendesse a ${MAGRO} postazioni il presidio ` +
                    `sarebbe ${v.presidio.toFixed(2)}`)
    }

    misure.push({ ...M, S, lung, ...r, ...p, presidio, poche, posti: q, vie: vie.length })
  }
  return { guasti, avvisi, misure }
}

/* ═══════════ chi arriva, e a che cosa è debole ═══════════ */
function esaminaMostri(t) {
  const guasti = []
  if (!t.mostri || !t.mostri.length) return ['nessun mostro']
  for (const m of t.mostri) if (!MOSTRI[m]) guasti.push(`mostro sconosciuto: ${m}`)
  if (!t.debolezze) {
    if (t.torri.length > 1)
      guasti.push(`ha ${t.torri.length} torri ma le debolezze spente: la scelta non conta`)
    return guasti
  }
  const deboli = t.mostri.map(m => torreDebole(m))
  for (const [i, d] of deboli.entries()) {
    if (!d) { guasti.push(`${t.mostri[i]} non ha una debolezza`); continue }
    if (!t.torri.includes(d))
      guasti.push(`${t.mostri[i]} è debole a «${d}», che questa tappa non mette a disposizione`)
  }
  if (new Set(deboli).size < 2)
    guasti.push('una sola debolezza in tutto l\'elenco: la risposta è sempre la stessa')
  if (deboli.length > 1)
    for (const [i, d] of deboli.entries())
      if (d && d === deboli[(i + 1) % deboli.length])
        guasti.push(`${t.mostri[i]} e ${t.mostri[(i + 1) % deboli.length]} ` +
                    `chiedono la stessa torre in due ondate di fila (${d})`)
  return guasti
}

/* ═══════════ la stampa ═══════════ */
let rotti = 0
const medie = {}
const avvertimenti = []

console.log('\n  ═══ LE QUINDICI TAPPE DEL CASTELLO ═══════════════════════════════════\n')
console.log('      tappa                  lung   presidio  gomito corsie  piazzole 3-8 9-12  post: presidio  buco')
console.log('      ' + '─'.repeat(88))

for (const c of CAMPAGNE) {
  console.log(`\n      ${c.emoji} ${c.nome.toUpperCase()}`)
  const presidi = []
  for (const tappa of c.tappe) {
    const t = { ...tappa, campagna: c.id, debolezze: !!tappa.debolezze }
    const { guasti, avvisi, misure } = esaminaForma(t)
    const tutti = [...guasti, ...esaminaMostri(t)]
    for (const a of avvisi) avvertimenti.push(`${t.nome}: ${a}`)
    const [m] = misure
    presidi.push(m.presidio)
    console.log(`    ${tutti.length ? '✗' : ' '} ${(t.nome + ' ' + t.emoji).padEnd(21)}` +
      `${m.lung.toFixed(0).padStart(5)} ` +
      `${m.presidio.toFixed(2).padStart(7)} ` +
      `${m.gomito.toFixed(0).padStart(7)} ` +
      `${m.corridoio.toFixed(0).padStart(6)} ` +
      `${m.larga.toFixed(0).padStart(8)} ` +
      `${m.fitta.toFixed(0).padStart(4)}  ` +
      `${m.posti}: ${m.poche.presidio.toFixed(2)} ` +
      `buco ${m.poche.buco.toFixed(0).padStart(3)}u`)
    if (tutti.length) { rotti++; for (const g of tutti) console.log(`        ✗ ${g}`) }
  }
  medie[c.id] = presidi.reduce((s, v) => s + v, 0) / presidi.length
}

console.log('\n      ' + '─'.repeat(88))
console.log(`      (campo ${MONDO.W}×${MONDO.H} · distanze in unità di disegno)`)
console.log(`      minimi: gomito ${GOMITO}u · corsie ${CORRIDOIO}u · ` +
            `piazzole ${PIAZZOLE}u (fino alle sue) e ${PIAZZOLE_FITTE}u (due in più)`)
console.log(`      con le postazioni vere della tappa: presidio almeno ${PRESIDIO_POCHI} · ` +
            `buco interno al massimo ${BUCO_INTERNO}u`)

/* l'ordine fra le campagne: il presidio medio deve scendere, e di un
   passo che si senta */
/* Il presidio deve scendere lungo i **primi tre** archi: è la lezione
   che raccontano — sentieri che si ripiegano e perdonano, poi cunicoli,
   poi rettifili. La Palude non ci entra: lì a crescere sono gli
   ingressi, e il presidio delle sue strade è un numero che parla
   d'altro. */
const ordine = ['bosco', 'sotterraneo', 'mura']
console.log('\n      presidio medio: ' +
  ordine.map(k => `${k} ${medie[k].toFixed(2)}`).join('  >  '))
for (let i = 1; i < ordine.length; i++)
  if (medie[ordine[i - 1]] - medie[ordine[i]] < SCALINO) {
    console.log(`      ✗ fra ${ordine[i - 1]} e ${ordine[i]} il presidio scende di ` +
      `${(medie[ordine[i - 1]] - medie[ordine[i]]).toFixed(2)}, meno di ${SCALINO}`)
    rotti++
  }

if (avvertimenti.length) {
  console.log(`\n      ⚠ se le postazioni scendessero a ${MAGRO} (oggi sono ` +
              `${[...new Set(RACCONTO.map(postiVeri))].join(', ')}):`)
  for (const a of avvertimenti) console.log(`        ⚠ ${a}`)
}

if (rotti) { console.log(`\n  ✗ ${rotti} cose da sistemare su ${RACCONTO.length} tappe\n`); process.exit(1) }
console.log(`\n  ✓ tutte e ${RACCONTO.length} in regola\n`)
