# Il sotterraneo: da fare

Le voci aperte, ognuna con quello che serve per farla. Le voci del giro del 16 ottobre 2026 (3D, mondo aperto, pergamena, botti, pensieri, torcia) stanno in
[da-fare-3d-e-mondo.md](da-fare-3d-e-mondo.md). Il progetto dettagliato
dell'abisso sta in [abisso-progetto.md](abisso-progetto.md).

## La pergamena del portale (16 ottobre 2026)

Fatta senza ritarare (l'utente: «fallo e basta»):
[portale-e-sosta.md](portale-e-sosta.md#la-pergamena-del-portale). Resta:

- **Da ritarare**: il prezzo (25 gemme), quanto cade (il 3% di forzieri e
  curiosità, solo dopo il quaderno) e l'effetto sulle risalite: una
  pergamena è una spesa e una cura gratis sopra a metà discesa, che il banco
  e i giocatori tipo non sanno usare.
- **Lo sprite** (22 ottobre): un rotolo col sigillo, ritagliato da `scudi.png` (`pergamena-portale` nel suo foglietto).
- **La casella della barra** come la pozione: per ora si apre dallo zaino.
- **Il mondo nuovo**: una sola che vende (l'incantatrice del villaggio).
  Le altre città potranno avere un suo banco dopo la missione; e
  `ultimoPostoSicuro()` aspetta che il mondo scriva `mondo.sicuro` (la città o
  la pietra toccata per ultima) e che `viste/Mondo3d.vue` ci porti l'eroe.
- **L'abisso**: la pergamena là è «torno su per stasera» (niente gemello);
  «ripartire dall'inizio del tratto» non c'è, si riprende come oggi dopo la
  risalita.

## Da ritarare dopo la torcia del 16 ottobre 2026

Non ritarato apposta (l'utente: «non stare a ritarare, fallo e basta»): la
torcia ha cono 9,5, alone 3,8, apertura 300° e, accesa, niente agguati
([luce.md](luce.md)). Da guardare quando si ritara:

- Il curioso col cavaliere a 4/10 vince il fondo 4 volte su 6 (era 2): il
  bersaglio di `unita/sotterraneo-roba` tiene per ora un posto in più per il
  fondo. A 9/10 vince tutte le discese.
- La sveglia (`SVEGLIA` 7) è ora più corta della vista con la torcia (~8): i
  mostri si vedono dormire. Se la torcia rende il gioco comodo, le leve sono
  il prezzo (5 gemme), quante ne lasciano i mostri, `ALONE_TORCIA` o
  `APERTURA_TORCIA`; non la regola degli agguati, che è dell'utente.
- Il banco (`npm run sotterraneo -- --torce 40`) non la sente: va dritto e
  non si volta, e gli agguati erano già pochi (2% → 0%).

## Le botti da rompere

**Fatto, solo nel sotterraneo**: botti in alcune stanze (una su quattro o cinque nelle cantine e nella miniera, rade e
vecchie nella cripta e nel tempio, marce nella palude, un accampamento nella grotta, niente nel ghiaccio, nella neve, nella
fornace e nell'inferno), si toccano, l'eroe le rompe, restano rotte (anche nella sosta), e **una su cinque lascia una
boccetta o una o due gemme**, per terra come il bottino dei mostri. La regola è del motore (`motore/botti.js`, la tabella in
`dati/botti.js`) ma **spenta di difetto**: la accende il gioco (`Corsa.botti`), il banco non la conosce, quindi
`npm run taratura` e `npm run test:misure` misurano il gioco di prima ([paesaggi-3d.md](paesaggi-3d.md#le-botti)).

**Resta**: ricalibrare il bottino coi giocatori tipo (`npm run taratura`, [giocatori-tipo.md](giocatori-tipo.md)) con le botti
accese. L'altra metà dell'idea, **niente domanda per aprire
libri, forzieri e simili** ([regole.md](regole.md), [arredo.md](arredo.md)), non è fatta: va decisa insieme alla taratura.

## Il disegno 3D

Resta, in quest'ordine: l'arredo per
ambientazione modellato (oggi sono le figure dell'atlante), i muri obliqui, la prova su un
telefono vero (i numeri di [grafica-3d-costi.md](grafica-3d-costi.md) sono di SwiftShader). Le voci piccole stanno lì,
in «Cosa manca».

## Dopo il giro del 14 ottobre 2026

Le voci rimaste aperte dalla sferzata (scontro a gruppi, branchi, fabbro, pozioni, giocatori tipo), da riprendere
coi numeri di `npm run taratura` ([giocatori-tipo.md](giocatori-tipo.md)) e con l'utente nel giro.

- **Quanto costa vincere, fuori dalle discese** (30 ottobre, [costo-di-vincere.md](costo-di-vincere.md)): le zone, l'abisso e il
  mondo di sopra sono stati portati in proporzione, ma non hanno ancora la misura del costo (svenimenti e volte a 9, 8 e 6 su 10).
- **Chi non usa le abilità** abbatte un comune in 5–7 risposte invece di 2–3: da guardare col dito se un bambino non spende i
  punti dell'albero ([costo-di-vincere.md](costo-di-vincere.md#cosa-resta)).
- **Le quattro unità rosse sono riallineate** (15 ottobre): misurano il curioso, non il finto che va dritto ([giocatori-tipo.md](giocatori-tipo.md)). L'abisso:
  il tetto di un piano è 60 domande e non 45 (un piano rifatto dopo uno svenimento ne costa 57 al seme 7, gli altri sei semi stanno sotto 38; la media dei semi
  resta sotto 35). `misure/sotterraneo` misura il curioso, anche nelle zone (la-grande-storia.md e zone.md, «Le misure»); resta rosso solo il fondo a 4/10 (40% contro il 30%), da decidere se allargare.
- **I pezzi utili per discesa** dalla torre in giù sono 1,7–2,3 contro il bersaglio di circa 3: quelli trovati servono
  poco perché il fabbro dà già il meglio del livello ([risalite.md](risalite.md)).
- **La figura della balestra**: anche girata e piccola non si legge come una balestra (è un arco con un dardo); va
  rifatta dal prompt di `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-armi.md`.
- **L'incantatrice vera**: oggi è la guaritrice ritinta; il terzo foglio dei personaggi è il prompt 9 di
  `PROMPT-terra-di-sopra.md` (con lei, la sentinella, il cartografo e altri sei).

## L'abisso

- **La lettura unica `cosa(k)`** e le chiavi `base#N` (punto 1 del progetto):
  oggi le letture `COSE[` fuori da `dati/cose.js` sono una sessantina, e
  nessun controllo le vieta. Niente cambia a schermo.
- **Il bottino graduato** (punto 3): `G(p) = floor(p / 2)`, il guardiano che
  lascia sempre, i mercanti di sopra a `G(f)−1`, prezzi `× (1 + N × 0,5)`, il grado
  sulla mano che comanda (`attaccoMancino` sulla scheda nuda), i nomi
  accordati col campo `genere: 'f'` e il suo controllo in `guastiDelleCose`.
  È il pezzo che manca per andare oltre la decina di piani.
- **Le scorte che si diradano e la scorta del guardiano**: le due leve
  proposte e **mai misurate**. La fonte da una per piano (l'altra stanza è
  del portale) a una ogni due; dove il capo è ormai il gigante, un secondo mostro nella
  stanza della scala (indurisce il minimo senza allungare il giro). Vanno
  provate sul banco insieme al bottino graduato, non prima: oggi la discesa
  si ferma per l'arma che non cresce.
- **Le soglie mancanti del banco** in `unita/sotterraneo-abisso`: costo per
  piano 10–25 fino al 30, forbice oltre 2×, guardiano ≤ 8 risposte con l'arma
  del piano (la sosta sotto i 10 KB e la risalita senza perdite sono fatte:
  [scala-che-sale.md](scala-che-sale.md)).
- **La freccina della missione e la scala che sale**: una missione di un piano
  di sopra non è più sfuggita (si risale, [scala-che-sale.md](scala-che-sale.md)),
  ma la freccina giù non la indica: `rotta` salta le missioni di un piano già
  passato. Da fare: puntare alla scala che sale (un `verso: 'su'`, con la riga del
  promemoria che già dice «risali»).

## Il gioco

- **Altri scenari**: la fornace e la grotta di cristallo hanno il blocco
  pronto nella scheda
  `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-scenario.md`, da
  fare come la cripta: la scena, poi i pezzi che mancano nella stessa chat.
  Poi i foglietti, una voce in `SCENARI` e un tratto
  in `TRATTI_DELL_ABISSO` (con la sua coppia di mostri) (vedi [scenari.md](scenari.md) e
  [abisso.md](abisso.md#il-posto-cambia-scendendo)).
- **Un secondo stile di cripta**: il sotterraneo è andato avanti (storia
  a discese, missioni, abisso) e c'è una base da cui scendere, quindi un
  altro posto della famiglia della cripta, più profondo, va bene accanto
  alla fornace e alla grotta. Le immagini si chiedono a fogli fitti
  (decine di pezzi per foglio), non otto alla volta.
- **Le fuliggini della fornace** non sono state usate (alone magenta).
- **Gli orpelli della grotta di cristallo e delle cantine nuove**: ogni scenario ha la sua
  lista in `dati/orpelli.js` ([arredo.md](arredo.md)); un posto nuovo ne vuole una, a fogli fitti.
- **Il suono**: c'è il minimo (passo, colpo, errore, il graffio). Col suono
  spento il gioco deve restare intero.

## Il mondo di sopra

- **Le persone nuove** (la sentinella per le discese rosse, il cartografo che dà la bussola, l'ortolana, il bambino, i nonni, il
  cantastorie, la lavandaia): da fare come modelli 3D in `poc/persone-3d/` ([persone-3d.md](persone-3d.md)), non più come fogli
  dipinti: le persone di sopra non hanno sprite, chi è lontano ha la foto del suo modello ([sagome-3d.md](sagome-3d.md)). Il prompt 9
  di `PROMPT-terra-di-sopra.md` è superato.
- **La bussola del mock** (il minatore che la dà, lei che punta alla prossima discesa) non è fatta: il gesto va nel modello del minatore.
- **Le missioni dopo la prima volta**: diciassette in tutto (un albero, tre rami, cinque da contare),
  e consegnate non tornano. Se piacciono, ne servono altre per chi rigioca,
  altri rami più lunghi (oggi i seguiti sono di un solo passo), e una forma
  oltre a «trova», «sconfiggi» e «sconfiggi N» ([missioni-conteggio.md](missioni-conteggio.md)): accompagnare, portare giù qualcosa.
  I requisiti «il piano N toccato» e «un pezzo di roba» non ci sono: vedi
  il perché in [missioni.md](missioni.md). Da guardare col dito: se il tetto
  di tre basta, o se un bambino con tre in mano e nessun «!» pensa che le
  missioni siano finite (il diario lo dice, ma non da sola il mondo).
- **La grande storia da guardare col dito**
  ([la-grande-storia.md](la-grande-storia.md)): la grotta ha piani da quattro
  stanze e quindi niente forzieri (il pezzo lo dà il mostro grosso
  dell'ultimo piano, il resto il banco).

## I livelli e la roba

- **Le abilità dopo lo scontro in due fasi** (9 ottobre): fatti costi per gradino, energia più scarsa, l'ultimo
  gradino contro i boss, i bonus in percentuale, la legenda delle passive, pozioni impilate e tasche a gemme, il
  fabbro con più scelta e prezzi per rarità. **Restano:** (1) la **forza del mago** — oggi la forza è requisito e
  attacco solo di spade e asce, quindi a un mago non serve a niente (come in Diablo, ma qui pesa): proposta, darle un
  secondo uso a tutti — armature e scudi pesanti che la chiedono, e una tasca in più ogni quattro punti; (2)
  **calibrare coi numeri finiti dell'equipaggiamento**: il banco deve usare le abilità dell'albero e quelle dei pezzi,
  non solo `att` e `dif` della roba, o la taratura sbaglia (regola dell'utente, 9 ottobre); una strada per ramo, due per
  classe nelle misure; (3) le **boccette di mana** ci sono già (`pozione-blu`, dall'incantatrice e nei forzieri): da vedere se
  ne servono di più grandi, con nomi epici e lo stesso disegno; (4) la **grafica del duello**: animazioni più lunghe e
  leggibili, una per tipo d'attacco (scudo e cura non scattano in avanti), e il mostro che attacca davvero nel disegno.
  (5) **un effetto grafico diverso per ogni abilità** (l'utente, 9 ottobre): oggi tutte volano con il loro simbolo e il colore
  del ramo, e c'è solo il fendente da vicino; vanno disegnate una per una (fiamma che esplode, lancia di ghiaccio che
  gela il mostro, fulmine che scende, radici che escono dal pavimento, scudo che si forma…).
  Vedi [abilita.md](abilita.md).
- **L'albero delle abilità da tarare**: c'è (9 ottobre), ma il banco non lo
  usa e le misure non lo vedono. Cosa manca e da dove si comincia:
  [abilita.md](abilita.md#cosa-non-è-ancora-fatto). Dal 12 ottobre ha quattro rami da sette nodi, gli elementi e
  le difese dei mostri ([abilita-rami.md](abilita-rami.md), [mostri.md](mostri.md)): il banco non le usa, quindi anche
  le resistenze aspettano le misure (chi preme a caso non le sente). **Restano**: un'animazione per ogni abilità e
  per ogni stato (fiamme, gelo, sonno, sangue) con la vista nuova dello scontro; la pastiglia di ogni difesa del
  mostro sulla vista (oggi la dice solo la riga della scelta); il giocatore finto che sceglie l'abilità giusta per il
  mostro, perché il bambino se ne accorga da solo (l'utente voleva questo).
- **L'abisso coi livelli**: non è stato ritarato. I mostri crescono col
  piano come prima, l'eroe arriva al livello 12 o più con pezzi rari e i
  pezzi dei grossi: i primi piani sono facili. Va rifatto insieme al bottino
  graduato qui sopra.
- **Le classi si somigliano in fondo**: lo Scudo di Fiammetta e il Ciondolo
  di Re Ossuto non hanno famiglia e battono gli scudi e i gioielli della
  fila, quindi nella roba attesa li portano tutti fino alla miniera, e il
  nano tiene la Mazza di Grumo perché le sue asce sono a due mani
  ([grossi.md](grossi.md)). Strade: un pezzo dei grossi per classe, o pezzi
  della fila più forti in fondo.
- **Il cavaliere resta il più duro** (a sei su dieci vince dal 25 al 55%
  delle discese, l'elfa e il nano dal 65 al 95%), come prima dei livelli.
- **Chi gira tutto arriva tre livelli sopra** e a quattro su dieci vince
  metà delle discese ([la-grande-storia.md](la-grande-storia.md#le-misure)):
  è il premio dell'esplorare, ma se a guardarlo è troppo la leva è
  la curva dell'esperienza (`CURVA_DELL_ESPERIENZA`) o la probabilità dei pezzi dai mostri.
- **La scalinata a mani nude** (con la roba di una discesa prima) non si fa
  più neanche a otto su dieci: il minatore lo dice, l'armaiolo ha la spada
  corta.
- **Le porte che si aprono**: una discesa appena aperta non ha ancora un
  momento suo nel mondo (le assi che cadono, la grata che si alza).
- Da guardare col dito: la velocità del passo, quanto si vede attorno
  (`VISTA_MONDO`, `LUCE`), e se la strada si trova senza sassi che luccicano.

## Da guardare col dito

Cose tarate a occhio o provate solo dai test: le giudica solo un bambino con
il telefono in mano.

- **Quanto sono più lenti i mostri** (`PASSO_MOSTRO` 3,1 contro `PASSO_EROE`
  5,4) **e i tre secondi di calma** dopo una fuga (`CALMA`, `dati/mondo.js`):
  decidono se una stanza fa paura o fa arrabbiare.
- **Quante stanze per piano** (da quattro a sedici): se un piano non finisce
  mai, la scala smette di essere un traguardo.
- **I gesti**: il tocco che manda a camminare, il dito tenuto premuto che fa
  inseguire, il pizzico dello zoom, i mostri che vengono addosso.
- **Lo scontro al centro**: la modale in mezzo allo schermo con la scena
  ferma non è mai stata vista a schermo — pilotare l'esplorazione da fuori
  non ha mai portato a un incontro (~400 tocchi in tre tentativi). Guardare
  anche **quanto ci mette un incontro a capitare**, che è un dato sospetto.
- **Le domande che si incatenano** (riguarda anche Survivors:
  passano tutti e due da `quiz/Domanda.vue`): il componente si azzera
  da sé fra una domanda e l'altra, ma i **320 ms di finestra cieca** al
  montaggio vanno sentiti col dito — sono la differenza fra un tocco fantasma
  ingoiato e un tasto che sembra lento.
- **I relitti e l'acqua da dipingere**: macerie, crolli, rocce, travi, stalagmiti, il
  carro rovesciato, i binari e le pozze sono fatti in codice (`scena3d/relitti.js`), tranne
  le macerie e le rocce della cripta (`sotterraneo_4_3.png`); per le cantine e la fornace non c'è nessun pezzo dipinto; da guardare col dito se le grotte (passaggi stretti, un solo varco per stanza) si leggono sul telefono
  ([piani-caverne.md](piani-caverne.md)).

## Le strade e le caratteristiche (13 ottobre)

Aperte dopo il lavoro di [strade.md](strade.md):

- **La destrezza** valeva più delle altre (a +5 livelli 69 contro 25–34 nel mago): la sera del 13 ottobre la velocità è passata a 7 più un punto per punto
  (`VELOCITA_PER_DESTREZZA`), e ora sta vicina all'intelligenza ([abilita-energia.md](abilita-energia.md#la-fila-dei-turni)). Restano da guardare col dito il cavaliere
  (a 6/10 il più debole) e chi non spende i punti dell'albero ([taratura-branchi.md](taratura-branchi.md#cosa-resta-da-decidere)).
- **Le armi a una mano che mancano**: una bacchetta di secondo gradino (la strada «bacchetta» usa la verga fino alla grotta) e un
  bastone di terzo (la «pura magia» tiene il bastone di secondo fino in fondo).
- **La taratura dei mostri** dopo le armi a due mani: l'attacco a due mani è raddoppiato o più (3 · 6 · 9 contro 2 · 3 · 4), quindi
  nano, elfa e arcieri colpiscono molto di più di quanto i branchi si aspettino; la difesa e la vita sono in [strade.md](strade.md#difesa-e-vita).
- **Da guardare col dito**: la pagina dell'eroe con il «+» che dice la velocità (⚡), il bastone nel pannello («🔷 +50% ricarica») e che
  l'energia torni davvero più in fretta, l'elisir del toro bevuto in paese.
