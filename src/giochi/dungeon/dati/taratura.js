/* ═══════════════════════════════════════════════════════════════════
   LA TARATURA — le manopole dell'equilibrio, tutte insieme

   Nel castello si è imparata la lezione a caro prezzo: se i numeri che
   decidono se una tappa è dura stanno sparsi in cinque file, cambiarne
   uno vuol dire scoprire tre mesi dopo che ne andava cambiato un altro.
   Qui stanno tutti qua, e chi li tocca rilancia il banco di prova
   (`motore/banco.js`, che gira dentro `test/unita/dungeon.test.mjs`):
   quanto spesso un bambino arriva in fondo non si deduce, si misura.

   Le leve, in ordine di quanto pesano:

     ATTESE         quello che il banco deve trovare, tappa per tappa
     bottino        quante gemme rende una stanza, e quindi cosa ci si
                    può comprare dal mercante
     cura           quanto rimette in sesto un fuoco da campo
     allenamento    quanto dà una sessione al fuoco, in attacco o difesa
     lascia         quanto spesso un mostro lascia equipaggiamento

   Le statistiche vere — vita, attacco e difesa di eroe e mostri — non
   stanno qui: sono in `eroe.js` e `mostri.js`, perché lì sono *il
   gioco* e non una manopola. Qui c'è quello che si gira per far
   tornare i conti senza cambiare le regole.

   `ATTESE` è la parte che conta davvero: dice **con quali numeri il
   gioco è considerato tarato**. Chi abbassa quelle soglie per far
   passare il test non ha tarato niente, ha spento l'allarme.
   ═══════════════════════════════════════════════════════════════════ */

export const TARATURA = {
  /* ── le gemme ──
     Una stanza rende `ricchezza × (base + fondo × profondità)`, con un
     po' di ballerino intorno. Più si scende più si trova: chi rischia
     le stanze basse per fare scorta ci guadagna meno di chi tira
     dritto e poi apre lo scrigno del fondo.

     La base è più bassa di quando le discese erano corte: le stanze
     sono il triplo, e con i numeri di prima si arrivava al secondo
     mercante potendo comprare tutta la vetrina — cioè il mercante
     smetteva di essere una scelta. */
  bottino: { base: 3.4, fondo: 3, ballerino: 0.25 },

  /* quante volte un mostro, oltre alle gemme, lascia equipaggiamento.
     Il capo del piano lo lascia **sempre**: è il premio dichiarato di
     quella stanza, ed è il motivo per cui ci si va invece di girarci
     intorno (girarci intorno non si può, ma il bambino non lo sa
     finché non ci arriva: quello che vede è il premio). */
  lascia: { mostro: 0.18, grosso: 0.6, scrigno: 0.65, capo: 1 },

  /* ── il fuoco da campo ──
     Cura in punti vita, non «un cuore»: adesso la vita è un numero.
     Chi è già pieno si allena invece di riposare, e l'allenamento vale
     un punto: due punti renderebbero il fuoco più conveniente di
     qualunque arma trovata, e il bottino tornerebbe una decorazione. */
  cura: 20,
  allenamento: 1,

  /* Il fuoco prima di un capo cura tutto: si arriva a un capo interi o
     la strada da fare prima diventa una lotteria invece di una scelta.
     È anche il punto in cui una discesa lunga si può interrompere e
     riprendere col fiato. */
  curaPrimaDelCapo: true,

  /* ── le stelle di fine tappa ──
     Non contano le gemme e non conta l'equipaggiamento: conta essere
     arrivati interi. La prima riga che va bene vince, e si guarda la
     **frazione** di vita rimasta perché la vita massima cresce lungo
     la campagna: a punti fissi, l'ultima tappa regalerebbe le stelle. */
  stelle: [
    { restaAlmeno: 0.7, stelle: 3 },
    { restaAlmeno: 0.35, stelle: 2 },
    { restaAlmeno: 0, stelle: 1 },
  ],

  /* quanto lontano si vede senza lanterna: due file più in su. Meno
     sarebbe camminare al buio, di più toglierebbe il senso alla
     lanterna. Il capo del piano si vede sempre, come il guardiano. */
  vista: 2,

  /* quanti mercanti al massimo in una discesa: uno per piano. Due
     vetrine nello stesso piano vogliono dire una vetrina vuota. */
  mercantiPerPiano: 1,
}

/* Quante gemme dà una stanza a una certa profondità (0 in cima, 1 in
   fondo). Il caso arriva da fuori come sempre. */
export function bottinoDi(ricchezza, profondita, rnd = Math.random) {
  if (!ricchezza) return 0
  const { base, fondo, ballerino } = TARATURA.bottino
  const medio = ricchezza * (base + fondo * profondita)
  const scarto = 1 + (rnd() * 2 - 1) * ballerino
  return Math.max(1, Math.round(medio * scarto))
}

/* Le stelle di una tappa portata a casa, data la vita che è avanzata. */
export function stellePerVita(rimasta, massima) {
  const q = massima > 0 ? Math.max(0, rimasta) / massima : 0
  return (TARATURA.stelle.find(s => q >= s.restaAlmeno) || { stelle: 1 }).stelle
}

/* ── quello che il banco di prova deve trovare ──
   Tre giocatori finti, tre soglie. Il secondo è il bambino vero: ne
   sbaglia una su quattro e **deve arrivare in fondo lo stesso**, quasi
   sempre. Il terzo è chi tira a indovinare: se anche lui vincesse, le
   domande non servirebbero a niente e tanto varrebbe un tasto «avanti».

   La soglia del bambino è più bassa di prima (0,6 invece di 0,7) e la
   ragione è dichiarata: adesso una discesa si può anche **sbagliare
   come strategia** — arrivare al guardiano senza essersi equipaggiati
   — e perderla lì è il modo in cui il gioco insegna a equipaggiarsi.
   Un gioco che si vince comunque non ha niente da insegnare; uno che
   si perde più di due volte su cinque lo si molla. */
export const ATTESE = [
  { chiave: 'sicuro', nome: 'chi risponde sempre giusto', bravura: 1, minimo: 0.95 },
  { chiave: 'bambino', nome: 'chi ne sbaglia una su quattro', bravura: 0.75, minimo: 0.6 },
  { chiave: 'a caso', nome: 'chi tira a indovinare', bravura: 0.3, massimo: 0.4 },
]

/* ── quanto costa una discesa, in domande ──

   ═══ QUESTO NUMERO NON È PIÙ QUELLO DEL CASTELLO ═══
   Nel castello il numero di operazioni è **l'input**: una tappa
   dichiara che costa 12 calcoli e tutto il resto si deriva da lì, con
   30 come tetto oltre il quale una partita diventa un compito. Quel
   tetto stava anche qui, ed era sbagliato averlo copiato.

   Nel dungeon il numero di domande è **il risultato**: dipende da come
   combatti e da come ti equipaggi, e chi trova la lama del drago ne fa
   meno di chi gira largo dai mostri grossi. Tenere il tetto a trenta
   avrebbe voluto dire discese corte, e discese corte vogliono dire che
   la spada trovata combattendo si usa per due stanze — cioè che il
   bottino, che è il motivo per cui si scende, non serve a niente.

   Quello che si perde a fare così, detto per intero: una discesa non è
   più «un compito da dieci minuti». È una partita da mezz'ora, e per
   quello ci sono i tre piani — si può smettere in fondo a un piano.
   Quello che **non** si perde è il conto: le domande si contano lo
   stesso, il banco le stampa, e se una tappa ne chiede il doppio di
   quella prima è un guasto di taratura che si vede subito.

   ═══ QUANTO DURA DAVVERO, DETTO IN MINUTI ═══
   Perché il numero qui sotto non sembri astratto: a cinque secondi per
   domanda (che è quanto ci mette un bambino che sa la risposta), la
   prima cantina è **una decina di minuti** e il covo del drago **una
   ventina**. Sono i numeri di una partita, non di un esercizio, ed è
   la cosa che questa scelta compra. Sono anche il motivo per cui i
   piani sono tre e non uno: si smette in fondo a un piano.

   Se un giorno una tappa sfonda il massimo, la domanda giusta non è
   «alzo il tetto» ma **«perché costa così»**: quasi sempre è perché
   l'equipaggiamento non sta arrivando (la colonna `arma` del banco
   sotto il 70%) e i mostri si stanno abbattendo a colpi da uno. Le
   leve sono `lascia` qui sopra e le ossa in `mostri.js`, non questa
   riga.

   Il minimo resta e conta più del massimo: sotto, non è una discesa,
   è un corridoio. */
export const DOMANDE = { minimo: 20, massimo: 130 }

export function guastiDellaTaratura(t = TARATURA, attese = ATTESE, domande = DOMANDE) {
  const guasti = []
  const { base, fondo, ballerino } = t.bottino || {}
  if (!(base > 0)) guasti.push(`bottino di partenza ${base}`)
  if (!(fondo >= 0)) guasti.push(`la crescita col fondo è ${fondo}`)
  if (!(ballerino >= 0 && ballerino < 1)) guasti.push(`il ballerino ${ballerino} è fuori scala`)
  if (!(t.cura >= 1)) guasti.push('un fuoco da campo che non cura niente non è un riposo')
  if (!(t.allenamento >= 1)) guasti.push('un allenamento che non allena niente non è una scelta')
  for (const [tipo, quanto] of Object.entries(t.lascia || {}))
    if (!(quanto >= 0 && quanto <= 1)) guasti.push(`lascia.${tipo} ${quanto} non è una frequenza`)
  /* IL PATTO DEL BOTTINO: chi è più grosso lascia più spesso. È l'altra
     metà di «lascia roba migliore», e senza questa riga il mostro
     grosso potrebbe promettere di più e mantenere di meno. */
  if (!(t.lascia.capo >= t.lascia.grosso && t.lascia.grosso > t.lascia.mostro))
    guasti.push('un mostro piccolo lascia equipaggiamento spesso quanto uno grosso')
  if (!(t.vista >= 1)) guasti.push('senza vista non si sceglie niente: si cammina al buio')
  if (!(t.mercantiPerPiano >= 1)) guasti.push('senza mercanti le gemme sono un numero che sale')

  /* le stelle devono essere una scala che scende, e finire con una
     riga che prende tutti: se no c'è un modo di vincere senza voto */
  const s = t.stelle || []
  if (!s.length || s.at(-1).restaAlmeno !== 0) guasti.push('le stelle non coprono tutti i casi')
  for (let i = 1; i < s.length; i++)
    if (!(s[i].restaAlmeno < s[i - 1].restaAlmeno && s[i].stelle < s[i - 1].stelle))
      guasti.push('le stelle non scendono man mano che si arriva conciati male')

  /* le attese: una scala di bravure che scende, e almeno un giocatore
     che NON deve farcela — se no il test non può accorgersi di niente */
  for (let i = 1; i < attese.length; i++)
    if (!(attese[i].bravura < attese[i - 1].bravura))
      guasti.push('le attese non sono in ordine di bravura')
  if (!attese.some(a => a.massimo !== undefined))
    guasti.push('nessuna attesa dice chi NON deve farcela: il test non proverebbe niente')
  if (!attese.some(a => a.minimo !== undefined))
    guasti.push('nessuna attesa dice chi deve farcela')

  if (!(domande.minimo >= 15)) guasti.push('una discesa a tre piani che costa meno di quindici domande è un corridoio')
  if (!(domande.massimo > domande.minimo)) guasti.push('la forbice delle domande è chiusa')
  return guasti
}
