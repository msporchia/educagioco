# Il sotterraneo: da fare

Le voci aperte, ognuna con quello che serve per farla. Il progetto dettagliato
dell'abisso sta in [abisso-progetto.md](abisso-progetto.md).

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
- **La fontana della cripta** è ancora quella di `sotterraneo_3.png`, piena e
  asciutta: quella del foglio dei pezzi è a muro, e bevendo cambierebbe forma.
- **Il suono**: c'è il minimo (passo, colpo, errore, il graffio). Col suono
  spento il gioco deve restare intero.

## La terra di sopra

- **Il terzo foglio dei personaggi** (prompt 9 di `PROMPT-terra-di-sopra.md`, da chiedere a ChatGPT): la figura vera
  dell'incantatrice, che ha una provvisoria (la guaritrice ruotata al viola), e nove che il gioco non ha, ognuna con un ruolo
  da scrivere quando arriva: la sentinella dipinta per le discese rosse, il cartografo che dà la bussola, la cacciatrice, l'ortolana, il
  bambino, la nonna e il nonno per le missioni nuove, il cantastorie e la lavandaia per il villaggio. Si ritaglia solo chi ha un ruolo
  ([sprite.md](../core/sprite.md#gli-inutilizzati)).
- **La bussola del mock** (il minatore che la dà, lei che punta alla prossima
  discesa) non è fatta. La posa del minatore con la bussola in mano c'è, nel
  primo foglio dei personaggi (`sopra-personaggi-1.png`, riquadro nel suo
  foglietto), ma non è nell'atlante: non la nomina nessuno.
- **Le missioni dopo la prima volta**: dodici in tutto (un albero, tre rami),
  e consegnate non tornano. Se piacciono, ne servono altre per chi rigioca,
  altri rami più lunghi (oggi i seguiti sono di un solo passo), e una seconda
  forma oltre a «trova» e «sconfiggi» (accompagnare, portare giù qualcosa).
  I requisiti «il piano N toccato» e «un pezzo di roba» non ci sono: vedi
  il perché in [missioni.md](missioni.md). Da guardare col dito: se il tetto
  di tre basta, o se un bambino con tre in mano e nessun «!» pensa che le
  missioni siano finite (il diario lo dice, ma non da sola la mappa).
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
- **Gli sprite dei mostri grossi**: oggi sono lo sprite della loro specie
  ingrandito con la corona; `grosso-<chiave>-fermo-0` nell'atlante prende il
  loro posto da solo. I prompt per ChatGPT, in ordine, sono nella scheda
  `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-grossi.md`.
- **Le porte che si aprono**: una discesa appena aperta non ha ancora un
  momento suo sulla mappa (le assi che cadono, la grata che si alza).
- Da guardare col dito: la velocità del passo (`PASSO_TERRA`), quanto
  presto scorre la vista (`BORDO`, `MORBIDA`), quanto si vede attorno
  (`VISTA`, `LUCE`), e se senza i sassi la strada si trova lo stesso.

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
  carro rovesciato, i binari e le pozze sono disegnati in codice (`scena/relitti.js`), tranne
  le macerie e le rocce della cripta (`sotterraneo_4_3.png`); per le cantine e la fornace non c'è nessun pezzo dipinto; da guardare col dito anche **l'eroe
  che passa davanti a un relitto alto invece che dietro** quando gli sta a nord, e
  se le grotte (passaggi stretti, un solo varco per stanza) si leggono sul telefono
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
