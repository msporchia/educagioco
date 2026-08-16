/* ═══════════════════════════════════════════════════════════════════
   IL GESTORE DELLE TABELLINE — chi decide QUALE calcolo chiedere.

   Stava dentro `views/MathGame.vue`, in mezzo al canvas e agli
   asteroidi, e lì non si poteva provare: la scelta delle domande è la
   cosa che decide se una tappa insegna o fa perdere tempo, ed è anche
   l'unica parte del gioco che gira benissimo senza schermo. Da qui in
   avanti sta in un file suo, come `store/calcolo.js` fa per il calcolo
   a mente, e si gioca una tappa intera in un test di unità.

   Come `store/calcolo.js`, questo file non importa il profilo: riceve
   `items` e basta. Così gira anche in Node e non crea cicli di import.

   Tre risposte, e sono tutte quelle che il gioco chiede:

     · cosa può uscire in questa tappa?   → `poolTappa`
     · e nel volo libero?                 → `poolLibero`
     · cosa chiede il boss?               → `chiaveDelBoss`
   ═══════════════════════════════════════════════════════════════════ */
import { strength, overdue, weight, activeSet, isMastered, SRS } from './srs.js'
import { CAMPAGNA, chiaveCalcolo, fattoriDi, calcoliTabellina } from '../data/tabelline.js'

const VUOTO = { s: 0, ok: 0, err: 0, last: 0, seen: 0, t: 0 }
/* letto e non creato: chiedere se una casella è forte non deve scriverla
   in archivio, se no il profilo si riempie di calcoli mai chiesti */
export const leggi = (items, k) => (items && items[k]) || VUOTO

export const TUTTE_LE_TABELLE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/* ═══════════ QUANTO È DIFFICILE UN CALCOLO ═══════════
   Decide l'ordine con cui i calcoli entrano nell'insieme in lavorazione:
   prima i facili, dopo i difficili. Due strati, e il secondo vince.

   1. LA STIMA, che serve solo finché di questo bambino non si sa niente.
      La fatica non sta nella taglia del prodotto ma in quanti dei due
      fattori vanno saputi a memoria: 8×2 è facile e 8×7 no, benché 8 ci
      sia in tutti e due. Per questo 2×9 sta molto prima di 4×7.
   2. LA MISURA: il tempo medio di risposta di QUESTO bambino. Appena c'è
      abbastanza materiale prende il posto della stima, perché difficile
      è quello che risulta difficile a lui, non quello che ci aspettiamo.

   Non c'è nessun bonus per i quadrati né sconti per il 9: 9×9 e 7×8 sono
   fatti da sapere come gli altri, e se poi uno dei due è facile per il
   bambino lo dirà il cronometro. */

/* 1 e 10 non sono fatti da imparare: sono regole. 2, 3 e 5 si contano a
   mente in un attimo. Il resto va saputo, ed è lì che sta la fatica. */
const durezza = n => (n === 1 || n === 10) ? 0
                   : (n === 2 || n === 3 || n === 5) ? 1 : 2

export const IN_FONDO = 9        // ×1 e ×10 si introducono per ultimi
export const banale = k => { const [lo, hi] = fattoriDi(k); return lo === 1 || hi === 10 }

export function stima(k) {
  if (banale(k)) return IN_FONDO
  const [lo, hi] = fattoriDi(k)
  // quanti dei due vanno saputi a memoria: è la classe. Dentro la classe
  // ordina la taglia, che sposta poco perché conta molto meno.
  return durezza(lo) + durezza(hi) + (lo * hi) / 200
}

/* Il tempo medio riportato sulla stessa scala della stima: un secondo
   vale come il calcolo più facile, quattro come il più difficile.
   Comprende anche il colpire l'asteroide, ma quel costo è uguale per
   tutti i calcoli e quindi non sposta l'ordine. */
const daTempo = ms => 1.2 + (ms / 1000) * 0.8

export function ordineDi(items, now = Date.now()) {
  return k => {
    const it = items && items[k]                 // letto e non creato
    const s = stima(k)
    if (!it || !it.t || it.seen < 3) return s    // non si sa ancora niente

    // I banali non sono su questa scala: stanno in fondo per principio, e
    // il cronometro può solo tirarli fuori di lì. Uno che risponde 7×10 in
    // quattro secondi ha un buco vero; se invece va spedito resta in fondo,
    // e non deve risalire solo perché la media con la sentinella lo alza.
    if (banale(k)) return it.t > SRS.slowMs ? daTempo(it.t) : IN_FONDO

    const fiducia = Math.min(1, (it.seen - 2) / 6) // piena dopo otto incontri
    return s * (1 - fiducia) + daTempo(it.t) * fiducia
  }
}

/* ═══════════ le chiavi in gioco ═══════════ */
export const chiaviDelle = tabelle => [...new Set(
  tabelle.flatMap(a => Array.from({ length: 10 }, (_, i) => chiaveCalcolo(a, i + 1))))]

/* a quali tabelline *in gioco* appartiene un calcolo: 6×7 vale sia per la 6
   sia per la 7, e l'insieme attivo gira a turno fra queste per non
   riempirsi solo di 1× e ×10, che sono le più facili di tutte */
export function tabellineDi(k, tabelle) {
  const [lo, hi] = fattoriDi(k)
  const g = []
  if (tabelle.includes(lo)) g.push(lo)
  if (hi !== lo && tabelle.includes(hi)) g.push(hi)
  return g.length ? g : [lo]
}

/* la tabellina del pianeta è dentro il calcolo, da una parte o dall'altra:
   6×7 è del pianeta del 6 e anche del pianeta del 7 */
export const dellaTabellina = (n, k) => !!n && fattoriDi(k).includes(n)

/* quanti calcoli tenere in lavorazione: chi ha dieci tabelline in gioco
   deve vederle tutte, non le due più facili */
export const insiemeDi = tabelle =>
  Math.max(10, Math.min(16, Math.round(tabelle.length * 1.5)))

/* ═══════════ IL POOL DI UNA TAPPA ═══════════
   Per più di metà la tabellina nuova, il resto ripasso delle precedenti.
   Senza questa sproporzione la tabellina del pianeta uscirebbe una volta
   su sei e la tappa diventerebbe un'attesa; con tutto il pool sulla
   nuova, invece, le vecchie si dimenticherebbero una dopo l'altra.

   IL CUORE DELLA TAPPA NON PUÒ RESTARE IN DUE — ed è qui che stava il
   guasto. `activeSet` restituisce solo quello che NON è ancora imparato:
   una tabellina facile come quella del 10 si impara in mezza partita, e
   man mano che le caselle passano da «in lavorazione» a «imparata» il
   lato della tappa si assottiglia. Non rientrano nemmeno dal ripasso: un
   fatto imparato dieci minuti fa non è scaduto, torna fra tre giorni. Si
   arrivava così a UNA chiave sola — cioè la stessa domanda ripetuta, la
   stessa domanda due volte di fila — e a zero chiavi appena l'ultima
   casella cedeva, e a quel punto era il ripasso a prendersi la partita
   dentro il pianeta che doveva insegnare il 10.

   Qui si ripesca dalla tabellina del pianeta, dalla casella meno salda
   alla più salda, finché il cuore non è di nuovo largo. Una casella
   imparata stamattina che ritorna dieci minuti dopo non è tempo perso: è
   esattamente quello che una tappa dedicata a una tabellina deve fare. */
export const CUORE = 6

export function poolTappa(tappa, items, now = Date.now(), quanti = null) {
  const dammi = k => leggi(items, k)
  const ordine = ordineDi(items, now)
  const tabelle = tappa.tabelle
  const tutte = chiaviDelle(tabelle)
  const quante = quanti || insiemeDi(tabelle)
  const scaduti = (lista, max) => lista
    .sort((x, y) => overdue(dammi(y), now) - overdue(dammi(x), now)).slice(0, max)

  // il Sole: nessuna tabellina nuova, tutto insieme e senza sconti
  if (!tappa.nuova) {
    const { learning, due } = activeSet(tutte, dammi, ordine, now, quante,
                                        k => tabellineDi(k, tabelle))
    const p = [...new Set([...learning, ...scaduti(due, 4)])]
    return p.length ? p : tutte
  }

  const sue = calcoliTabellina(tappa.nuova)
  const altre = tutte.filter(k => !sue.includes(k))
  const A = activeSet(sue, dammi, ordine, now, Math.max(CUORE, Math.round(quante * 0.6)))

  const cuore = [...A.learning]
  if (cuore.length < CUORE) {
    // le già imparate rientrano dalla meno salda: è ripasso della tappa,
    // non ripasso di ieri, e tiene il pool abbastanza largo perché la
    // stessa domanda non debba uscire due volte di fila
    const tornano = sue.filter(k => !cuore.includes(k))
      .sort((x, y) => weight(dammi(y), now, { useTime: true }) -
                      weight(dammi(x), now, { useTime: true }))
    cuore.push(...tornano.slice(0, CUORE - cuore.length))
  }

  /* IL RIPASSO NON SUPERA MAI IL CUORE. Prima gli scaduti si sommavano
     alla quota del ripasso invece di starci dentro: il pool veniva su
     con sei caselle della tabellina nuova e otto di quelle vecchie, cioè
     l'opposto della ricetta scritta qui sopra. */
  const spazio = Math.max(2, Math.min(quante - CUORE, cuore.length))
  const B = activeSet(altre, dammi, ordine, now, spazio, k => tabellineDi(k, tabelle))
  const vecchi = [...new Set([...B.learning,
                              ...scaduti([...A.due, ...B.due], spazio)])].slice(0, spazio)

  return [...new Set([...cuore, ...vecchi])]
}

/* ═══════════ IL VOLO LIBERO ═══════════
   Qui non si chiede più «quali tabelline vuoi allenare?»: è una domanda
   a cui un bambino non sa rispondere — chi non conosce il 7 non sceglie
   il 7 — e la risposta sbagliata rovina la partita. Il volo libero pesca
   da solo quello che si ricorda meno, su tutte e dieci le tabelline.

   E se uno ricorda tutto bene? Allora non c'è niente «in lavorazione» e
   niente di scaduto: si torna sugli ULTIMI PIANETI GIOCATI, che sono
   anche i più difficili, invece di ripescare 1×3 perché è l'unica cosa
   che il motore trova da ridire. */
export function poolLibero(items, now = Date.now(), quanti = 16, tappaRaggiunta = 0) {
  const dammi = k => leggi(items, k)
  const tutte = chiaviDelle(TUTTE_LE_TABELLE)
  const { learning, due } = activeSet(tutte, dammi, ordineDi(items, now), now, quanti,
                                      k => tabellineDi(k, TUTTE_LE_TABELLE))
  const scaduti = due
    .sort((x, y) => overdue(dammi(y), now) - overdue(dammi(x), now)).slice(0, 4)
  const p = [...new Set([...learning, ...scaduti])]
  if (p.length) return p
  return chiaviDelle(ultimeTabelline(tappaRaggiunta))
}

/* le tabelline degli ultimi pianeti giocati, dal più recente */
export function ultimeTabelline(tappaRaggiunta, quante = 3) {
  const out = []
  for (let i = Math.min(tappaRaggiunta, CAMPAGNA.length) - 1; i >= 0 && out.length < quante; i--)
    if (CAMPAGNA[i].nuova) out.push(CAMPAGNA[i].nuova)
  return out.length ? out : TUTTE_LE_TABELLE
}

/* ═══════════ IL BOSS VIENE DAL PIANETA DOPO ═══════════
   Un boss che chiede una domanda come tutte le altre non è un boss: è una
   domanda con la musica. Quello che lo rende un avversario è che **arriva
   da dove non sei ancora stato** — al pianeta del 6 il boss porta un
   calcolo del 7. Batterlo è un assaggio del futuro, e perderlo non è una
   sconfitta: è roba che non hai ancora imparato.

   E un boss non chiede mai un CALCOLO-NULLA. Ne era uscito uno che
   chiedeva 1×1, e il guasto non era la mancanza di una lista nera: era
   che quando il «dopo» non c'è — l'ultimo pianeta, il Sole, il volo
   libero — si ripiegava sulla domanda «più in bilico», cioè quella col
   peso più alto. Ma il peso premia chi non si è MAI visto, e le caselle
   mai viste sono proprio quelle che nessuna tappa si degna di chiedere:
   1×1, 1×2, 1×3. Il ripiego pescava con precisione il contrario di
   quello che serviva. Adesso, quando un «dopo» non c'è, il boss chiede
   la casella più TOSTA fra quelle che ancora non reggono. */
export const eNulla = k => {
  const [lo, hi] = fattoriDi(k)
  return lo === 1 || (lo <= 3 && hi <= 3)     // ×1 e i conti che si contano
}

export function chiaveDelBoss(tappa, prossima, items, now = Date.now(),
                              sorte = Math.random, vietata = null) {
  /* Fra i tre in cima, e a sorte: sempre lo stesso calcolo diventerebbe la
     faccia del boss invece di un assaggio. Mai quella appena chiesta — il
     divieto di ripetersi due volte di fila vale anche per il boss — e per
     questo si passa una riserva: se togliendo quella non resta nessuno,
     si allarga invece di ripetersi. */
  const fraTre = (...liste) => {
    for (const lista of liste) {
      const l = lista.filter(k => k !== vietata)
      if (l.length) return l.slice(0, 3)[Math.floor(sorte() * Math.min(3, l.length))]
    }
    return null
  }
  const dalPiuFacile = l => [...l].sort((x, y) => stima(x) - stima(y))
  const dalPiuTosto = l => [...l].sort((x, y) => stima(y) - stima(x))

  if (prossima && prossima.nuova) {
    // quelli che le tabelline in gioco non coprono già: il boss del pianeta
    // del 6 deve portare 7×7, non 7×2 che si fa da tre pianeti
    const gia = new Set(chiaviDelle(tappa.tabelle))
    const suoi = calcoliTabellina(prossima.nuova).filter(k => !eNulla(k))
    const fuori = suoi.filter(k => !gia.has(k))
    return fraTre(dalPiuFacile(fuori), dalPiuFacile(suoi))
  }

  /* Niente ×1, niente ×10 e niente conti che si contano: sono regole, non
     fatti da sapere, e un boss che le chiede è un boss per finta. Poi la
     più tosta fra quelle che ancora non reggono — e la stima dei banali
     (`IN_FONDO`) qui non si guarda proprio, se no risulterebbero loro i
     calcoli più difficili di tutti. */
  const tutte = chiaviDelle(tappa.tabelle).filter(k => !eNulla(k))
  const vere = tutte.filter(k => !banale(k))
  const fatti = vere.length ? vere : tutte
  const deboli = fatti.filter(k => !isMastered(leggi(items, k), now))
  return fraTre(dalPiuTosto(deboli), dalPiuTosto(fatti))
}
