/* ═══════════════════════════════════════════════════════════════════
   LA TARATURA — tutti i numeri del gioco in un posto solo

   Qui non si gioca e non si disegna: si dichiara soltanto quanto corre
   l'eroe, quanto spesso tira, quanto vale una gemma. Il motore legge
   questa tabella e non ha numeri suoi — chi vuole un gioco più gentile
   cambia una riga qui e rilancia il banco di prova, non va a cercare i
   numeri sparsi in mezzo alle regole.

   Le tre leve che decidono se una partita è dura sono in fondo, e sono
   funzioni del tempo: quanti mostri nascono al secondo, quanta vita
   hanno, quanto vanno di fretta. Una tappa le moltiplica per i propri
   `ritmo`, `vigore` e `fretta` (vedi `campagna.js`), e questo è tutto
   quello che distingue la prima tappa dall'ultima.
   ═══════════════════════════════════════════════════════════════════ */

export const CFG = {
  /* ── l'eroe ── */
  velocitaEroe: 152,        // pixel al secondo, prima degli stivali
  raggioEroe: 15,
  cuoriIniziali: 3,
  invulnerabilita: 1.7,     // secondi di lampeggio dopo un colpo preso

  /* ── l'arco, che tira da solo ──
     Di partenza tira piano apposta: da fermo l'eroe non sta dietro a
     quanti ne nascono, e questo è quello che costringe a muovere il dito.
     A far male sono le carte — ed è per questo che scegliere quale
     prendere è una decisione e non una figurina. */
  cadenza: 0.50,            // secondi fra un tiro e l'altro
  gittata: 275,
  velocitaFreccia: 430,
  apertura: 0.16,           // quanto si aprono a ventaglio le frecce in più

  /* ── le gemme ──
     **Una gemma resta dove cade.** Prima quelle lontane si incamminavano
     da sole verso l'eroe, e alla fine correvano più di lui (178 contro
     152): sembrava una gentilezza — «a sette anni non si torna indietro
     a raccogliere quella dietro l'angolo» — ed era il motivo per cui il
     gioco si giocava da fermi. L'esperienza ti veniva addosso, i mostri
     da fermo arrivavano comodi da tutti i lati, l'arco tirava da solo:
     il dito non serviva. Adesso le cose si trovano in giro, e ci si va.

     ── e la calamita c'è solo con la carta ──
     Di base una gemma si prende **a contatto**: il raggio dell'eroe più
     un dito (`raggioEroe` + 12, in `muoviGemme`), e quella a un passo
     resta lì finché non ci si passa sopra. C'era un raggio di 115 pixel
     per tutti — «la sensazione da non perdere» — ed era l'altra metà
     del giocare da fermi: con un quarto di schermo che tira da solo,
     basta girare intorno a un mostro per raccogliere tutto quello che
     cade. La carta **Calamita** (`magnete` in `mazzo.js`) è l'unico
     modo di averne una: la prima copia dà `prima` pixel — un raggio e
     mezzo dell'eroe oltre il contatto: si sente, ma non cambia come si
     gioca — e ogni copia dopo ne aggiunge `inPiu`. A cinque copie sono
     195 pixel, mezzo schermo: più del vecchio raggio di base, meno di
     dove arrivava la vecchia carta al tetto (307). È così che prenderla
     costa un posto che sarebbe andato a un'arma, e vale la pena solo se
     la si potenzia. L'oggetto calamita a terra (`dati/oggetti.js`) è
     l'altra strada, e da oggi vale di più: senza la carta è l'unico
     risucchio che esiste. */
  calamita: { prima: 55, inPiu: 35 },

  /* ── gli oggetti a terra (`dati/oggetti.js`) ──
     Compaiono a tempo, sempre dentro lo schermo ma mai sotto i piedi
     (`vicino`..`lontano`, in pixel), restano `durata` secondi e poi
     svaniscono: per prenderli bisogna andarci. Più la marea sale, più
     spesso ne arriva uno — è anche il modo di dare un cuore a chi ne
     ha bisogno quando la partita si fa dura. */
  oggetti: {
    primo: 7,                                   // secondi prima del primo
    ogni: m => Math.max(7, 15 - 3 * Math.max(0, m)),
    durata: 9,
    massimo: 5,                                 // in campo nello stesso momento
    vicino: 140, lontano: 260,
    grosso: 5,                                  // vita base da cui un mostro è «grosso»
    daiGrossi: 0.3,                             // quante volte su cento ne lascia uno
    /* ── la cassa è rara, e il tetto è un conto e non un peso ──
       Una cassa è un'offerta intera: una domanda in più con una carta
       in palio, come una salita di livello che non si è sudata. Il
       `peso` in `oggetti.js` dice solo quanto spesso esce *fra* i tre,
       e con la marea gli oggetti arrivano ogni sette secondi: senza un
       tetto, alla tana le casse erano quasi un quarto delle offerte, e
       i livelli — cioè le gemme, cioè l'andare in giro — contavano di
       meno. Tre limiti, e valgono anche per quella lasciata da un
       mostro grosso: mai nei primi `primaDi` secondi (prima si vede
       com'è fatta la partita), **mai due in campo insieme**, e in tutto
       non più di una ogni `ogni` secondi di partita — un tetto che
       cresce col tempo, così è lo stesso conto per una tappa da 45
       secondi (una cassa) e per la Sopravvivenza al decimo minuto. Il
       banco (`unita/survivors`, sezione 5) conta quante offerte in più
       dà una tappa intera al pilota rispetto ai livelli, e le tiene
       sotto un terzo. */
    cassa: { primaDi: 10, ogni: 45 },
  },

  /* ── i muri ──
     Ogni tanto una fila di mostri deboli attraversa lo schermo da un
     lato scelto a caso, dritta, senza inseguire nessuno: chi sta fermo
     ci finisce dentro, e si scansa spostandosi — verso il varco, o
     correndo via, che l'eroe è più svelto. È l'altra metà del motivo
     per cui il dito serve (la prima sono le gemme che restano dove
     cadono). Con la marea arrivano più spesso, ma mai a raffica: fra
     un muro e l'altro c'è sempre il tempo di respirare. */
  muro: {
    primo: 12,                                  // secondi prima del primo
    ogni: m => Math.max(7, 20 - 5 * Math.max(0, m)),
    passo: 44,                                  // fra un mostro e l'altro nella fila
    varco: 130,                                 // il buco, in pixel
  },

  /* ── la folla ──
     **Il tetto sale col tempo**, e non è un dettaglio tecnico: è la
     differenza fra un gioco che si vince e uno che si perde. Con un tetto
     fisso, appena l'arco tira più forte di quanto la folla nasce la
     partita è decisa — cinque frecce e non si torna più indietro, perché
     più di novantacinque non ne potevano esistere. Con il tetto che sale,
     l'unico modo di stare a galla è **continuare a far male più in
     fretta**, e le carte che picchiano si pagano rispondendo.

     Il massimo assoluto è lì solo perché un telefono deve disegnarli
     tutti: a quel punto della partita sei già morto da un pezzo. */
  maxNemici: m => Math.min(380, 60 + 150 * Math.max(0, m)),

  /* ── la stazza: quanto la marea ha impastato i mostri ──
     Le frecce, la cometa e l'anello di fuoco non spingono tutti allo
     stesso modo, e il freddo non prende tutti allo stesso modo: botta e
     gelo si dividono per la stazza. Non è la mole del singolo mostro — è
     **quanto in là è andata la partita**, misurata sullo stesso
     moltiplicatore che gli dà la vita.

     Serviva perché oltre il traguardo il gioco si spegneva da solo: con
     le comete che girano e l'anello di fuoco addosso, ogni mostro che
     entrava nel cerchio veniva rispedito indietro prima di poter toccare
     l'eroe, e non contava quanti fossero né quanto fossero duri. Misurato
     sul banco: quindici minuti in mezzo a trecentottanta mostri, cinque
     cuori intatti, **mai uno che arrivasse a un braccio di distanza**.
     Spinta e gelo erano diventati un muro permanente invece di un colpo e
     di un rallentamento.

     La soglia è cinque, e cinque è esattamente dove finisce la campagna:
     l'ultima tappa al traguardo sta a 5,03. **Dentro le nove tappe la
     stazza vale 1 e non cambia niente** — le melme volano via come
     sempre, e le soglie di riuscita tarate lì restano quelle. Da lì in
     poi sale: a dieci minuti un mostro pesa tre volte e mezzo, a quindici
     dieci, e la cometa comincia a sfiorarlo invece di buttarlo fuori dal
     cerchio. */
  stazza: mult => Math.max(1, Math.pow(Math.max(1, mult) / 5, 0.85)),
  /* Quanti nascono **davanti** a chi sta correndo, e dentro che apertura.
     Senza questo il gioco si vince scappando sempre dalla stessa parte:
     il mondo non ha muri, l'eroe corre più di tutti, e chi scappa dritto
     non incontra mai nessuno — né i mostri né le proprie gemme. Mettendo
     un po' di folla sulla strada, la fuga diventa una curva, e la curva
     riporta dove sono cadute le gemme. È la differenza fra un gioco e
     una passeggiata. */
  nasconoAvanti: 0.42,
  aperturaNascita: 1.15,    // radianti a destra e a sinistra della corsa
  /* Chi resta indietro **non sparisce**: ti segue, e prima o poi torna.
     Prima si cancellava dopo poco più di una schermata, e voleva dire che
     scappare in tondo era gratis — i mostri lasciati indietro si
     scioglievano nel nulla e non ammazzarli non costava niente. Adesso si
     toglie di mezzo solo chi è a tre schermate, che con l'eroe che corre
     più di tutti vuol dire quasi nessuno: **il codazzo di chi non hai
     ucciso è il conto che ti presenta il gioco**, ed è il motivo per cui
     servono le carte che picchiano e non solo quelle che fanno correre. */
  troppoLontano: 3.0,       // in schermate

  /* ── il ritmo, che cresce dentro la partita ──
     `q` è la quota di tappa già passata (0 all'inizio, 1 al traguardo):
     così una tappa da 40 secondi e una da 120 salgono con la stessa curva
     invece che a caso.

     **Oltre il traguardo le curve non si fermano, e cambiano forma.**
     Dentro la tappa salgono in linea retta, perché lì la partita dura
     pochi minuti e il bambino deve sentire la salita, non subirla. Dopo,
     si **moltiplicano**: ogni tappa-tipo che passa la folla e la vita si
     ripassano per una costante.

     Non è un vezzo, è l'unico modo di stare dietro all'eroe. La potenza
     di chi gioca non cresce in linea retta: una freccia in più moltiplica
     il fuoco, «mani veloci» lo moltiplica di nuovo, «frecce grosse»
     un'altra volta. Misurato sul banco, un giocatore che risponde bene
     passa da 2 a 1300 danni al secondo — **seicento volte** — mentre le
     vecchie curve lineari, nello stesso quarto d'ora, portavano la marea
     da 1,9 a 12: sei volte. Il risultato era che dopo il traguardo non si
     poteva più perdere: quindici minuti con cinque cuori intatti e
     nessun mostro che riuscisse ad arrivare a un braccio di distanza.
     Contro una crescita moltiplicativa non c'è retta che tenga, per
     ripida che sia — solo un'altra moltiplicazione.

       nascite   ×1.62 ogni tappa-tipo: la folla si infittisce fino al tetto
       vita      ×1.95 ogni tappa-tipo, ed è **questa** la ghigliottina: le
                 magie ad area salgono a scalini (quattro copie e sono
                 finite), la vita no, e a un certo punto l'anello di fuoco
                 smette di ripulire e comincia solo a graffiare
       fretta    +0.09 al minuto, e resta una retta apposta: nessuno deve
                 poter correre il doppio dell'eroe, o scappare — l'unica
                 cosa che il bambino sa fare — smette di essere una mossa

     La vita cresce più della folla, e stavolta è voluto: cento mostri
     molli si spazzano con una magia, dieci mostri duri no. Ma cresce da
     una base bassa e in un tempo che il bambino sente arrivare — si
     comincia a perdere terreno, si vede il fronte che non arretra più, e
     un minuto dopo ti prendono. */
  natePerSecondo: q => q <= 1 ? 1.2 + 2.8 * Math.max(0, q) : 4 * Math.pow(1.62, q - 1),
  vitaNemico: q => q <= 1 ? 1 + 1.35 * Math.max(0, q) : 2.35 * Math.pow(1.95, q - 1),
  frettaNemico: q => 1 + 0.35 * Math.min(q, 1) + 0.09 * Math.max(0, q - 1),

  /* quanto dura una tappa «tipo»: è l'orologio del gioco libero, che non
     ha una fine, e quello di chi resta in campo dopo aver vinto */
  tappaTipo: 175,

  /* ── dove si va a finire oltre il traguardo ──
     Le tre leve della tappa si spengono piano e lasciano il posto a
     queste, uguali per tutti, nel giro di un paio di minuti. Se no il
     «resto in campo» del prato verde sarebbe una passeggiata infinita —
     le sue leve sono gentili apposta, perché è la tappa che insegna — e
     uno ci resterebbe dieci minuti senza rischiare niente. Dopo il
     traguardo la tappa non c'entra più: c'è solo la marea. */
  oltre: { ritmo: 1.25, vigore: 1.95, fretta: 1.06 },
}

/* Quanta esperienza serve per passare dal livello `l` al successivo.
   Cresce col quadrato: i primi potenziamenti arrivano subito (ed è quello
   che fa venir voglia di continuare), gli ultimi si sudano.

   La scaletta è stata abbassata quando le domande sono diventate un
   prezzo vero — chi sbaglia non prende più la carta di consolazione — e
   le tappe si sono allungate. Con la vecchia salita un bambino che ne
   sbagliava metà restava a tre potenziamenti su una partita di tre
   minuti: non perdeva perché era difficile, perdeva perché non gli era
   arrivato niente. Adesso i livelli piovono più fitti: si sbaglia, si
   riprova due minuti dopo, e intanto di conti se ne sono fatti il doppio
   — che poi è il motivo per cui questo gioco esiste.

   **E si è abbassata di nuovo il giorno in cui è sparita la calamita di
   base.** Non è un ritocco di gusto: una gemma adesso si prende solo
   passandoci sopra, quindi il pilota del banco che gioca come prima ne
   raccoglie circa la metà di quelle che cadono, e con la vecchia
   scaletta (`2 + 0.9l + 0.15l²`) i livelli medi di una tappa scendevano
   da 11,0 a 6,1 — cioè metà dei potenziamenti e **metà delle domande**,
   che è il motivo per cui il gioco esiste. Da `0.5l + 0.08l²` un
   giocatore che raccoglie bene rifà gli stessi undici livelli di prima,
   e chi **sta al centro** (il pilota con `raccolta: 0`, che schiva e
   basta) ne fa meno di due. Era quello il difetto da togliere: prima
   quel giocatore lì arrivava lo stesso a 5,8, perché la calamita gli
   portava l'esperienza addosso. Le gemme valgono meno e si vanno a
   cercare: sono la stessa cosa detta due volte. */
export const soglia = l => Math.round(2 + 0.6 * l + 0.08 * l * l)

/* Quante stelle vale una tappa portata a casa: si contano le ferite, non
   i cuori rimasti — le carte cambiano i cuori massimi e un voto che
   dipende da quale carta è uscita non è un voto. */
export const STELLE = [
  { ferite: 0, stelle: 3 },
  { ferite: 2, stelle: 2 },
  { ferite: Infinity, stelle: 1 },
]

export const stellePerFerite = ferite =>
  (STELLE.find(s => ferite <= s.ferite) || { stelle: 1 }).stelle

export function guastiDellaTaratura(cfg = CFG) {
  const guasti = []
  const positivi = ['velocitaEroe', 'raggioEroe', 'cuoriIniziali', 'invulnerabilita',
                    'cadenza', 'gittata', 'velocitaFreccia']
  for (const k of positivi)
    if (!(cfg[k] > 0)) guasti.push(`CFG.${k} vale ${cfg[k]}`)

  /* ── la calamita della carta ──
     La prima copia deve arrivare oltre il contatto (se no la carta non
     fa niente) e restare piccola (se no la prima copia è già il gioco
     di prima); le copie in più devono allargarla, e a cinque copie non
     deve superare mezzo schermo di telefono — a quel punto sarebbe di
     nuovo «sto fermo e guardo», solo pagato. */
  const cal = cfg.calamita || {}
  if (!(cal.prima > cfg.raggioEroe + 12 && cal.prima <= 80))
    guasti.push(`la prima Calamita tira da ${cal.prima} pixel: o non si sente o è già il gioco da fermi`)
  if (!(cal.inPiu >= 20 && cal.inPiu <= 60))
    guasti.push(`ogni copia di Calamita in più allarga di ${cal.inPiu} pixel`)
  if (!(cal.prima + 4 * cal.inPiu <= 200))
    guasti.push(`a cinque copie la Calamita tira da ${cal.prima + 4 * cal.inPiu} pixel: più di mezzo schermo`)

  /* una freccia più lenta del mostro che insegue non lo prende mai */
  if (!(cfg.velocitaFreccia > cfg.velocitaEroe))
    guasti.push('le frecce non sono più veloci dell\'eroe')
  /* la gittata deve stare dentro mezzo schermo, se no si spara a chi non
     si vede ancora e il bersaglio arriva già morto */
  if (!(cfg.gittata > 120)) guasti.push(`gittata ${cfg.gittata}: troppo corta per vedere l'effetto`)

  for (const q of [0, 0.5, 1]) {
    if (!(cfg.natePerSecondo(q) > 0)) guasti.push(`natePerSecondo(${q}) non è positiva`)
    if (!(cfg.vitaNemico(q) >= 1)) guasti.push(`vitaNemico(${q}) è sotto 1`)
    if (!(cfg.frettaNemico(q) >= 1)) guasti.push(`frettaNemico(${q}) è sotto 1`)
  }
  /* le tre leve devono salire: una tappa che finisce come è cominciata
     non è una partita, è un'attesa */
  if (!(cfg.natePerSecondo(1) > cfg.natePerSecondo(0)))
    guasti.push('i mostri non diventano più fitti col passare del tempo')
  if (!(cfg.vitaNemico(1) > cfg.vitaNemico(0)))
    guasti.push('i mostri non diventano più duri col passare del tempo')

  /* quanti ne può tenere il campo: deve salire, o appena l'arco supera le
     nascite la partita è decisa e non si può più perdere */
  if (!(cfg.maxNemici(0) >= 40)) guasti.push(`il campo comincia con ${cfg.maxNemici(0)} posti`)
  if (!(cfg.maxNemici(2) > cfg.maxNemici(0.5)))
    guasti.push('il tetto della folla non sale col tempo')
  if (!(cfg.maxNemici(50) <= 400))
    guasti.push(`a partita lunghissima il campo tiene ${cfg.maxNemici(50)} mostri: un telefono non li disegna`)

  /* e devono continuare a salire **oltre** il traguardo, o chi resta in
     campo dopo aver vinto si trova in una partita che non può perdere */
  for (const [k, quanto] of [['natePerSecondo', 1], ['vitaNemico', 0.5], ['frettaNemico', 0.05]]) {
    if (!(cfg[k](3) - cfg[k](2) >= quanto * 0.5))
      guasti.push(`${k} si appiattisce dopo il traguardo: da q=2 a q=3 sale di ${(cfg[k](3) - cfg[k](2)).toFixed(2)}`)
    if (!(cfg[k](10) > cfg[k](3)))
      guasti.push(`${k} ha un tetto: a q=10 vale come a q=3`)
  }
  /* ── la vita è la ghigliottina, e deve essere la più ripida ──
     Qui c'era il controllo opposto: la vita doveva salire **meno** della
     folla, perché «si deve perdere terreno, non essere travolti». Il
     banco ha detto che era il ragionamento sbagliato. Cento mostri molli
     si spazzano con una magia — la potenza dell'eroe è già ad area — e a
     tenere in piedi la partita è quanto sono duri, non quanti sono. Con
     la vita più lenta della folla si arrivava a quindici minuti con
     trecentottanta mostri intorno e cinque cuori intatti.

     Quello che va tenuto in riga non è la ripidezza, è **il tempo di
     accorgersene**: la vita non deve raddoppiare in meno di una tappa
     tipo, o si passa dallo stare bene al morire senza aver visto arrivare
     niente. */
  for (const q of [1.5, 3, 6]) {
    const raddoppio = cfg.vitaNemico(q + 1) / cfg.vitaNemico(q)
    if (!(raddoppio <= 2.05))
      guasti.push(`la vita si moltiplica per ${raddoppio.toFixed(2)} in una tappa tipo (a q=${q}): ` +
                  'travolge invece di far perdere terreno')
  }
  if (!(cfg.vitaNemico(4) / cfg.vitaNemico(2) > cfg.natePerSecondo(4) / cfg.natePerSecondo(2)))
    guasti.push('dopo il traguardo la vita non cresce più della folla: la ghigliottina non taglia')

  /* ── la stazza ──
     Dentro la campagna deve valere 1: le nove tappe sono tarate con le
     spinte piene, e una stazza che morde là dentro le cambia tutte
     insieme senza che nessuno l'abbia chiesto. Oltre, deve salire e non
     avere tetto, o le magie ad area tornano a essere un muro. */
  if (cfg.stazza(cfg.vitaNemico(1) * 2.1) !== 1)
    guasti.push('la stazza si sente già dentro la campagna')
  if (!(cfg.stazza(cfg.vitaNemico(4)) > 2))
    guasti.push(`oltre il traguardo i mostri pesano ${cfg.stazza(cfg.vitaNemico(4)).toFixed(2)}: le botte li spazzano ancora`)
  if (!(cfg.stazza(cfg.vitaNemico(9)) > cfg.stazza(cfg.vitaNemico(6))))
    guasti.push('la stazza ha un tetto')

  /* ── gli oggetti a terra ──
     Devono comparire dentro lo schermo di un telefono (390×620: mezza
     larghezza è 195) ma non sotto i piedi, restare abbastanza da
     essere raggiunti — a 152 pixel al secondo la distanza massima si
     copre in meno di due secondi — e arrivare più spesso con la marea. */
  const o = cfg.oggetti || {}
  if (!(o.vicino >= 100 && o.lontano > o.vicino && o.lontano <= 280))
    guasti.push(`gli oggetti compaiono fra ${o.vicino} e ${o.lontano} pixel: o sotto i piedi o fuori dallo schermo`)
  if (!(o.durata >= 6 && o.durata <= 15))
    guasti.push(`un oggetto resta a terra ${o.durata} secondi: o non si arriva o non svanisce mai`)
  if (!(o.ogni?.(0) > 0 && o.ogni(3) < o.ogni(0) && o.ogni(50) >= 5))
    guasti.push('gli oggetti non arrivano più spesso con la marea, o arrivano a raffica')
  if (!(o.massimo >= 2 && o.massimo <= 8)) guasti.push(`al massimo ${o.massimo} oggetti in campo`)
  if (!(o.daiGrossi > 0 && o.daiGrossi <= 0.6)) guasti.push(`i grossi lasciano un oggetto ${o.daiGrossi} volte`)
  /* la cassa: non subito, e non più di una ogni tre quarti di minuto —
     abbastanza rada perché in una tappa corta ne esca una sola, non
     tanto da sparire dalla Sopravvivenza */
  const ca = o.cassa || {}
  if (!(ca.primaDi >= 8 && ca.primaDi <= 20))
    guasti.push(`la prima cassa può uscire dopo ${ca.primaDi} secondi`)
  if (!(ca.ogni >= 40 && ca.ogni <= 60))
    guasti.push(`una cassa ogni ${ca.ogni} secondi: o troppo fitte o non si vedono mai`)

  /* ── i muri ──
     Il varco deve essere più largo dell'eroe con un margine da dito, e
     più stretto di mezzo schermo, o non è un muro; il passo fra un
     mostro e l'altro più stretto del varco, o il varco non si distingue
     da un buco qualunque. E devono arrivare più spesso con la marea, mai
     però più di uno ogni pochi secondi. */
  const mu = cfg.muro || {}
  if (!(mu.varco >= cfg.raggioEroe * 4 && mu.varco <= 180))
    guasti.push(`il varco del muro è largo ${mu.varco} pixel`)
  if (!(mu.passo >= 30 && mu.passo < mu.varco))
    guasti.push(`la fila del muro ha un passo di ${mu.passo} pixel`)
  if (!(mu.primo >= 8 && mu.ogni?.(0) > 0 && mu.ogni(3) < mu.ogni(0) && mu.ogni(50) >= 5))
    guasti.push('i muri non arrivano più spesso con la marea, o arrivano a raffica')

  /* la scaletta dell'esperienza deve salire sempre, o un livello costa
     meno del precedente e i potenziamenti piovono tutti insieme */
  for (let l = 1; l < 20; l++)
    if (!(soglia(l + 1) > soglia(l))) { guasti.push(`la soglia del livello ${l + 1} non sale`); break }

  if (stellePerFerite(0) !== 3) guasti.push('senza ferite non si prendono tre stelle')
  if (stellePerFerite(99) !== 1) guasti.push('sopravvivere conciati male non vale una stella')
  return guasti
}
