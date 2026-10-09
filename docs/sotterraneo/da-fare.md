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
  Poi i foglietti, una voce in `SCENARI`, un branco in `BRANCHI` e un tratto
  in `TRATTI_DELL_ABISSO` (vedi [scenari.md](scenari.md) e
  [abisso.md](abisso.md#il-posto-cambia-scendendo)).
- **Le fuliggini della fornace** non sono state usate (alone magenta).
- **L'arredo della cripta**: la fornace ha il suo (`arredo` e `dice` nella voce
  di `SCENARI`), le cantine e la cripta no, e botti, casse e stendardi rossi
  nella cripta sembrano portati dalle cantine. La scena della cripta ha
  sarcofagi, statue, candelabri e colonne spezzate ma col pavimento dietro:
  vanno chiesti su fondo magenta e mappati con `arredo`.
- **La fontana della cripta** è ancora quella di `sotterraneo_3.png`, piena e
  asciutta: quella del foglio dei pezzi è a muro, e bevendo cambierebbe forma.
- **Un mostro di quinta fascia per ogni posto**: oggi il golem sta in tutti
  i branchi, e cantine e cripta si separano solo fino alla quarta. Con un
  terzo posto conviene anche una seconda faccia per le fasce che ne hanno una
  sola (il ratto nelle cantine, pipistrello, fantasma e scheletro nella
  cripta).
- **I guardiani dell'abisso per posto**: la scaletta è misurata e non guarda
  il tratto, quindi lo scheletro fa la guardia alle cantine. Da rifare sul
  banco insieme al bottino graduato.
- **Il suono**: c'è il minimo (passo, colpo, errore, il graffio). Col suono
  spento il gioco deve restare intero.

## La terra di sopra

- **Gli sprite dei mercanti**: armaiolo, erborista e rigattiere sono figure
  disegnate in codice (`viste/pixel.js`); `armaiolo-fermo-0` e gli altri
  nell'atlante prendono il loro posto da soli.

- **Gli sprite di chi dà le missioni**: ragazza, mugnaio, eremita,
  guardia, pescatore e boscaiolo sono figure disegnate in codice
  (`viste/pixel.js`); `<nome>-fermo-0` nell'atlante prende il loro posto da
  solo. I prompt sono nella scheda `PROMPT-terra-di-sopra.md`. La bussola del
  mock (il minatore che la dà, lei che punta alla prossima discesa) non è fatta.
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
  classe nelle misure; (3) le **boccette di mana** ci sono già (`pozione-blu`, dall'erborista e nei forzieri): da vedere se
  ne servono di più grandi, con nomi epici e lo stesso disegno; (4) la **grafica del duello**: animazioni più lunghe e
  leggibili, una per tipo d'attacco (scudo e cura non scattano in avanti), e il mostro che attacca davvero nel disegno.
  (5) **un effetto grafico diverso per ogni abilità** (l'utente, 9 ottobre): oggi tutte volano con il loro simbolo e il colore
  del ramo, e c'è solo il fendente da vicino; vanno disegnate una per una (fiamma che esplode, lancia di ghiaccio che
  gela il mostro, fulmine che scende, radici che escono dal pavimento, scudo che si forma…).
  Vedi [abilita.md](abilita.md).
- **L'albero delle abilità da tarare**: c'è (9 ottobre), ma il banco non lo
  usa e le misure non lo vedono. Cosa manca e da dove si comincia:
  [abilita.md](abilita.md#cosa-non-è-ancora-fatto).
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
  `ESP_PER_LIVELLO_DEL_POSTO` o la probabilità dei pezzi dai mostri.
- **La scalinata a mani nude** (con la roba di una discesa prima) non si fa
  più neanche a otto su dieci: il minatore lo dice, l'armaiolo ha la spada
  corta.
- **Dipingere i mostri grossi**, se piacciono disegnati in codice: la
  scheda `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-grossi.md`.
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
