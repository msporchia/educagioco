/* ═══════════════════════════════════════════════════════════════════
   LE CLASSI DI DOMANDE, E A CHE ETÀ SERVONO

   Una CLASSE è una coppia (modulo, grado): «il perimetro sulla
   griglia», «i contrari», «le conversioni facili». È l'unità con cui si
   pesca una domanda, e la ragione sta in un difetto rimasto qui dentro
   per un pezzo: prima si tirava a sorte il MODULO e poi il grado si
   calcolava dalla difficoltà, quindi da ogni modulo usciva sempre lo
   stesso grado, e una classe pesava quanto il modulo che se la portava
   dietro. Adesso si pescano tutte le classi insieme, con un peso a
   campana.

   ── PERCHÉ UN NUMERO SOLO, E NON UN GRADO PER MODULO ─────────────
   Il peso stava su una manopola astratta da 0 a 1, dove il primo grado
   di *qualunque* modulo valeva 0 e l'ultimo 1. Comodo, e falso: i
   grado-1 dei sedici moduli finivano tutti nello stesso punto, e non
   sono la stessa cosa. «Come si chiama questa figura» si fa in prima,
   «che ora segna l'orologio» in seconda, «Nina ha 4 mele e ne raccoglie
   3» chiede di leggere una storia in scioltezza. Tre etichette identiche
   per tre età diverse — e chi ne pagava il conto erano i più piccoli,
   perché per loro quella bugia è tutta la differenza fra una domanda e
   un muro.

   Adesso ogni grado di ogni modulo dichiara **un livello da 0 a 100**,
   e quel numero è confrontabile con tutti gli altri: si dichiara invece
   di derivarlo, perché è un'affermazione che un genitore può leggere e
   smentire — la schermata dei grandi la scrive in anni, i tastini
   😴/😰 servono a correggerla, e di lì la si può scavalcare a mano.

   L'ETÀ NON STA SULLA DOMANDA, STA SUL BAMBINO. Una domanda non «è da
   sette anni»: ha una complicazione sua, e sono i sette anni di chi
   gioca a dire se gli arriva. Detta così sembra una sfumatura, ed è la
   differenza fra dover decidere due numeri per riga («da quando» e «fin
   quando») e doverne decidere uno solo.

   ── COME SI PESCA ────────────────────────────────────────────────
   Due conti separati, perché rispondono a due domande diverse:

   1. **chi entra nel mazzo** (`adatta`): l'età di chi gioca diventa una
      **finestra** sulla scala (`finestraDi`), e fuori di lì una classe
      non entra. Taglio netto, non un peso: sotto c'è la presa in giro,
      sopra il muro, e nessuna delle due si aggiusta uscendo di rado.
   2. **quanto pesa chi è entrato** (`pesoDi`): la manopola del gioco —
      «una domanda facile», «una tosta» — diventa un punto dentro quella
      finestra (`bersaglio`), e ogni classe pesa quanto gli è vicina.
      Dentro il mazzo che gli compete la gradualità resta tutta: le
      carte deboli chiedono quello che sa già fare, le toste quello
      dell'anno prossimo.

   Questo file non importa niente e non sa cosa sia un profilo: gira in
   Node, e `test/unita/quiz-pesi` ci conta sopra migliaia di tiri.
   ═══════════════════════════════════════════════════════════════════ */

/* ── LA SCALA È UNA SOLA, DA 0 A 100 ──
   Un numero per classe di domande: **quanto è complicata**, in assoluto
   e rispetto a tutte le altre. Zero è il primo giorno di materna, cento
   è la fine della primaria — e in mezzo ci stanno le sedici materie
   tutte sulla stessa riga, che è l'unico modo di confrontare «quanti
   pallini ci sono» con «il trapassato remoto».

   Prima qui c'era una coppia di età per ogni classe (`[da, a]`), e la
   coppia aveva due difetti. Il primo: **`a` era arbitraria** — «da che
   età questa domanda è banale» è una cosa che nessuno sa dire davvero,
   e infatti veniva quasi sempre `da + 3`. Il secondo: **gli anni sono
   grossi**. Dentro la prima elementare ci stanno «con che lettera
   comincia» e «leggi la parola»: sono due passi diversi, e a numeri
   interi finivano sullo stesso gradino.

   Con un numero solo il «fin quando» non si dichiara: lo decide la
   FINESTRA. Un bambino ha un'età, l'età diventa una finestra sulla
   scala, e quello che gli sta sopra o sotto non gli arriva — la stessa
   classe è tosta per uno e banale per un altro senza che nessuno
   l'abbia scritto da nessuna parte. */
export const LIVELLO_MIN = 0
export const LIVELLO_MAX = 100

/* Il ponte con gli anni, che è la lingua in cui si ragiona quando si
   decide dove mettere una domanda — e l'unica che un genitore può
   giudicare a colpo d'occhio nella sua schermata. Quattro anni sta a
   zero, dodici a cento: dodici punti e mezzo per anno. */
export const ANNI_MIN = 4
export const ANNI_MAX = 12
export const PUNTI_PER_ANNO = (LIVELLO_MAX - LIVELLO_MIN) / (ANNI_MAX - ANNI_MIN)
export const livelloDegliAnni = anni => (anni - ANNI_MIN) * PUNTI_PER_ANNO
export const anniDelLivello = livello => ANNI_MIN + livello / PUNTI_PER_ANNO

/* ── DUE LARGHEZZE, NON UNA ──
   Qui c'era un numero solo, e faceva due mestieri diversi: decideva
   **chi poteva uscire** e **dove mirava la manopola**. Con tre anni di
   apertura la mira era giusta e l'ammissione stretta da matti: a nove
   anni sparivano le ore intere dell'orologio — che sono di seconda, ma
   restano una domanda onesta per chiunque — e sparivano *del tutto*,
   non «più di rado».

   È scremare l'albero. Dal mazzo va tolto solo quello che a quel
   bambino non si può proprio chiedere, in un verso o nell'altro; il
   resto lo fa già la manopola dei giochi, che è lì apposta — mentre
   giochicchi arriva roba facile, quando vuoi la carta buona arriva roba
   seria.

   · L'AMMISSIONE è larga: tre anni e mezzo sotto, due sopra. Sotto quel
     limite c'è la presa in giro — «con che lettera comincia 🐝» a un
     bambino di nove anni — sopra c'è il muro, roba che non ha ancora
     nessuno strumento per ragionare. In mezzo ci sta tutto, comprese le
     cose che sa già fare: servono, e sono quelle che escono quando il
     gioco chiede poco.

   · LA MIRA va da un anno indietro con la carta debole fino al tetto
     dell'ammissione con quella tosta. È il punto intorno a cui pesca la
     manopola, e non c'entra con chi è ammesso: una classe a due anni e
     mezzo di distanza dal bersaglio pesa il due per cento — c'è, e
     capita ogni tanto. Che è esattamente quello che deve succedere alle
     ore intere di un bambino di nove anni.

     Sopra la mira arrivava a +19, sei punti sotto il tetto: mezzo anno
     di scala che nessuna manopola raggiungeva mai, nemmeno a fondo
     corsa davanti al capo dell'ultima tappa. Adesso arriva a +25, cioè
     dove finisce il mazzo. Sotto resta a −12, e non è simmetria
     mancata: abbassarla renderebbe *più facile* la prima tappa di una
     campagna, che è il verso sbagliato — quello che mancava era la
     cima, non il fondo. */
export const TAGLIO_SOTTO = 44
export const TAGLIO_SOPRA = 25
export const MIRA_SOTTO = 12
export const MIRA_SOPRA = 25

export const finestraDi = eta => {
  if (eta == null) return null
  const qui = livelloDegliAnni(eta)
  return [qui - TAGLIO_SOTTO, qui + TAGLIO_SOPRA]
}

/* ── QUANTO È SFOCATO IL TIRO ──
   La banda è la larghezza della campana intorno al bersaglio: a quella
   distanza il peso è già sceso a un terzo, al doppio è trascurabile.

   Era 19 — un anno e mezzo — e la mira ne correva 37 in tutto: la rosa
   era larga quanto metà del poligono, quindi ovunque puntasse la
   manopola ci finiva dentro mezzo mazzo. Misurato su una porta della
   terza tappa del sotterraneo, a un bambino di otto anni: il 41% delle
   domande stava sotto gli otto anni e il 10% sotto i sei e mezzo, e due
   domande di fila distavano in media 1,1 anni — mentre due tappe
   adiacenti ne distavano 0,25. Il rumore batteva il segnale quattro a
   uno, ed è tutto qui il «un po' facile, un po' difficile, a caso» che
   si sentiva giocando.

   A 11 la campana è larga poco meno di un anno: la manopola si sente,
   la gradualità resta. Più stretta di così si tornerebbe a un binario —
   una classe sola per ogni giro di manopola, cioè la stessa domanda
   ogni volta. */
export const BANDA = 11

/* ── E QUANDO IL MAZZO FINISCE, LA BANDA SI ALLARGA ──
   Stringere la campana ha un prezzo che si paga solo agli estremi della
   scala, dove le classi scarseggiano: a dieci anni, sopra i dieci, il
   catalogo intero ne ha tredici, e con la banda ferma a 11 **una sola
   classe si prendeva il 54% dei tiri** davanti al capo dell'ultima
   tappa. Che è ripetitività, cioè l'altro modo di rovinare la stessa
   cosa — e il difetto è del catalogo, non del bambino: quelle domande
   lì non le abbiamo ancora scritte.

   Il rimedio è un degrado felice, a tentativi: si guarda quante classi
   contano davvero intorno al bersaglio; se sono poche si allarga la
   banda di un po' e si riprova, finché non ce ne sono abbastanza o
   finché la campana non è tornata larga come prima. Chi sta in mezzo
   alla primaria non se ne accorge mai — lì la banda resta 11 e il primo
   tentativo è già buono.

   «Quante contano davvero» non è «quante ce ne sono»: una classe con
   peso un millesimo c'è e non esce mai. Si conta col numero effettivo
   (l'inverso della somma dei quadrati dei pesi), che dà 14 quando
   quattordici classi se la giocano alla pari e scende verso 1 man mano
   che una sola se le mangia tutte. È la stessa misura che il test
   `unita/quiz-pesi` guarda dall'altro lato quando pretende che nessuna
   classe superi un quinto dei tiri. */
export const VARIETA_MINIMA = 14
export const ALLARGO_BANDA = 3
export const BANDA_MASSIMA = 25

const dentro01 = x => Math.min(1, Math.max(0, x || 0))

/* Il bersaglio della manopola: il gioco gira da 0 a 1 e non sa chi ha
   davanti, e quel numero diventa un punto **intorno all'età di chi
   gioca**. Non il fondo e la cima dell'ammissione: quella è larga
   apposta, e mirarci dentro da un capo all'altro vorrebbe dire
   consegnare i pallini da contare ogni volta che un gioco chiede una
   domanda facile. */
export const bersaglio = (difficolta, eta = null) => {
  if (eta == null) return (LIVELLO_MIN + LIVELLO_MAX) / 2
  const qui = livelloDegliAnni(eta)
  return qui - MIRA_SOTTO + (MIRA_SOTTO + MIRA_SOPRA) * dentro01(difficolta)
}

/* questa domanda è roba per chi ha quella finestra?
   Il pelo di tolleranza non è pignoleria: il livello di un grado è la
   media pesata dei suoi tipi, e una media di dieci noni fa 95.000000001
   — che senza questa riga cade fuori da una finestra che finisce a 95,
   una volta ogni tanto e senza che si capisca perché. */
const PELO = 1e-9
export const adatta = (livello, finestra) =>
  !finestra || (livello >= finestra[0] - PELO && livello <= finestra[1] + PELO)

export const pesoDi = (livello, target, banda = BANDA) =>
  Math.exp(-((Math.abs(livello - target) / banda) ** 2))

/* quante classi se la giocano davvero, dati i loro pesi: il numero
   effettivo. Uno solo vuol dire che una classe si prende tutto. */
export const quanteContano = pesi => {
  const tot = pesi.reduce((s, p) => s + p, 0)
  if (!(tot > 0)) return 0
  return 1 / pesi.reduce((s, p) => s + (p / tot) ** 2, 0)
}

/* La banda da usare per questo tiro: quella di sempre, allargata a
   tentativi finché il mazzo intorno al bersaglio non è abbastanza
   vario. `livelli` sono quelli delle classi ammesse, già visti con gli
   occhi di questo bambino. */
export const bandaPer = (livelli, target) => {
  let banda = BANDA
  while (banda < BANDA_MASSIMA &&
         quanteContano(livelli.map(l => pesoDi(l, target, banda))) < VARIETA_MINIMA)
    banda += ALLARGO_BANDA
  return Math.min(banda, BANDA_MASSIMA)
}

/* quanto è complicata **per chi la riceve**: zero al fondo della sua
   finestra, uno in cima. È il numero che un gioco potrebbe usare per
   decidere quanto vale una domanda — la stessa classe è un passeggio
   per uno e una salita per un altro, e questa frazione lo dice. */
export const quantoPesa = (livello, finestra) => {
  if (!finestra) return dentro01(livello / LIVELLO_MAX)
  const [da, a] = finestra
  return dentro01((livello - da) / (a - da))
}

/* per chi deve disegnare: dove cade un livello sulla barra 0..1 */
export const postoDi = livello => dentro01(livello / LIVELLO_MAX)

/* ── le classi giocabili, con il loro peso ──
   `spenti` sono i macrogruppi (e le singole tipologie) che i genitori
   hanno tolto: i gradi che li davano per scontato non entrano proprio
   nell'elenco.

   `regole` è quello che dipende dal bambino e non dal modulo:
   `{ eta, livelli }`. Senza, non si taglia niente per età — ed è il
   caso del banco di prova e della schermata dei grandi, che guardano
   tutto quello che esiste e non quello che arriverebbe a un bambino
   solo.

   `bisogno` è il ripasso: una funzione `chiave → fattore` (1 = neutro,
   la banda vera è 0.5÷1.5 e sta in `nucleo/bisogno.js`). Qui entra come
   *media* della classe — quanto in generale c'è da rivedere in quel
   grado — e il resto lo fa `Modulo.chiedi`, che pesa la singola
   tipologia. È un parametro e non un import proprio perché questo file
   non deve sapere che esista un profilo. */
export function classiDi(moduli, { spenti = [], difficolta = 0, bisogno = null,
                                   regole = null } = {}) {
  /* La finestra si calcola qui, una volta sola, e si passa già fatta ai
     moduli: chi chiama può dare l'età o la finestra, e i due modi non
     devono divergere. Senza questa riga un `{ eta: 6 }` arriverebbe al
     modulo senza finestra e il taglio non taglierebbe niente —
     silenziosamente, che è il modo peggiore. */
  const finestra = regole?.finestra ?? finestraDi(regole?.eta ?? null)
  const qui = regole ? { ...regole, finestra } : null
  const target = bersaglio(difficolta, regole?.eta ?? null)

  /* Prima si raccoglie chi è ammesso, poi si pesa: la banda dipende da
     **quante classi ci sono** intorno al bersaglio, quindi non si può
     sapere prima di averle contate. È l'unico motivo per cui questo giro
     è in due passate invece che in una. */
  const fuori = []
  for (const m of moduli)
    for (const g of m.gradiLiberi(spenti, qui))
      fuori.push({
        modulo: m,
        grado: g,
        livello: m.livelloDi(g, spenti, qui),
        /* il peso guarda il livello **come lo vede questo bambino**: un
           ritocco di un grande sposta la classe, non la finestra */
        visto: m.livelloVisto(g, spenti, qui),
      })

  /* La banda si misura sulla sola distanza dal bersaglio, prima che il
     ripasso ci metta mano: se no un bambino con tante cose da rivedere
     si troverebbe la campana allargata per il motivo sbagliato — il
     mazzo è vario lo stesso, è il bisogno che pende da una parte. */
  const banda = bandaPer(fuori.map(v => v.visto), target)
  for (const v of fuori) {
    v.peso = pesoDi(v.visto, target, banda) *
             v.modulo.bisognoMedio(v.grado, spenti, bisogno, qui)
    delete v.visto
  }
  return fuori
}

/* la pesca col peso: `sorte.frazione` una volta sola, così a parità di
   seme esce sempre la stessa classe — è quello che permette di provare
   la distribuzione invece di guardarla girare */
export function pescaClasse(sorte, voci) {
  if (!voci.length) return null
  const tot = voci.reduce((s, v) => s + v.peso, 0)
  if (!(tot > 0)) return sorte.uno(voci)
  let x = sorte.frazione * tot
  for (const v of voci) { x -= v.peso; if (x <= 0) return v }
  return voci[voci.length - 1]
}
