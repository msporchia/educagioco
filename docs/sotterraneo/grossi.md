# I mostri grossi

In fondo a ogni discesa della storia, e ogni cinque piani nell'abisso, la
chiave della scala ce l'ha un mostro grosso: col suo nome, due caselle per
due, nella stanza della scala. Quando cade lascia di sicuro un pezzo raro o
migliore più il suo pezzo col nome. Richiesta dell'utente dell'8 ottobre
2026, insieme ai livelli ([livelli.md](livelli.md)).

Il codice: `dati/grossi.js` (chi sono, dove stanno, quanto sono grossi),
`motore/livello.js` (`mostroGrosso`: lo mette al posto del guardiano),
`motore/corsa.js` (`cade`: il bottino), `figuraDelGrosso` in `dati/grossi.js`
(quale sprite), `scena/tela.js` (`grosso`), `viste/Grosso.vue` (la figura
nello scontro e nella barra in cima).

## Chi sono

| discesa | mostro grosso | la creatura che veste | conta come | lascia |
|---|---|---|---|---|
| la cripta dell'altare | Re Ossuto | il negromante (il re scheletro col bastone) | scheletro | il Ciondolo di Re Ossuto (difesa, vita) |
| la scalinata antica | Grumo | l'orco con la mazza | orco | la Mazza di Grumo (vita, rigenera) |
| la torre in rovina | Fiammetta | lo spirito di fuoco | troll | lo Scudo di Fiammetta (difesa, torcia, vita) |
| la grotta della scaletta | Zannaverde | il ragno | orco | l'Anello di Zannaverde (schivata, fortuna) |
| la scala sommersa | Gorgo | il polpo | gigante | l'Amuleto di Gorgo (rigenera, vita, pozioni) |
| la botola segreta | Minotto | la bestia cornuta | troll | il Giubbone di Minotto (difesa, vita, rigenera) |
| la miniera abbandonata | Carbonchio | il drago di lava | gigante | il Martello di Carbonchio (attacco, fuoco) |

- **La creatura giusta** (12 ottobre 2026, l'utente: «Zannaverde il ragno, Carbonchio il drago di lava, Minotto la bestia cornuta, Gorgo il
  polpo, Fiammetta lo spirito di fuoco, Grumo l'orco, Re Ossuto lo scheletro, ingranditi con la corona»). `figura` in `dati/grossi.js` dice quale
  creatura del catalogo comune veste ([../core/creature.md](../core/creature.md)); senza, quella di `tipo`. **Re Ossuto è il negromante**: uno scheletro
  col cappuccio, il bastone e (ingrandito) la corona è un re più di uno scheletro grande, e nella cripta lo scheletro è già l'abitante. Il ragno e il polpo
  stanno anche fra gli abitanti del loro posto ([mostri.md](mostri.md)): il grosso è la stessa creatura, grande.
- **Le statistiche non cambiano**: `tipo` resta la base (il troll di Fiammetta e di Minotto, il gigante di Gorgo e di Carbonchio, l'orco di Grumo e
  Zannaverde, lo scheletro di Re Ossuto) con le ossa moltiplicate (`ossa`: da 1,1 a 1,3, e 1,9 e 1,95 per Grumo e Zannaverde, che si reggono sull'orco: da
  quando le specie di strada hanno tutte otto ossa l'orco ne ha 8 e non 12, e il grosso è rimasto com'era) e un colpo in più (`att`, Re Ossuto no; Grumo e
  Zannaverde +3, perché l'orco da caporale della scalinata picchia meno di prima e il grosso è rimasto com'era); poi la discesa lo cresce come gli altri
  (`forza`, `spinta`). Re Ossuto è il più tenero: la cripta perdona (dove la forza è piccola, 0,25, un grosso ha comunque almeno due ossa più del suo simile: `mostroGrosso`). Il troll e il gigante non si disegnano più (solo statistiche): il troll è uscito
  dall'atlante del sotterraneo.
- **I suoi pezzi non hanno famiglia**: li porta chiunque, perché il mostro
  grosso è di tutti e quattro gli eroi. La mazza e il martello sono armi
  nuove senza famiglia (`deiGrossi` in `dati/cose.js`), che non si vendono e
  non si pescano. Provato la mazza a ⚔️ 2 con l'attacco fra le abilità:
  batteva le armi di tutte le classi fino in fondo; a ⚔️ 1 con vita e
  rigenera è una buona arma per la torre e la grotta, poi spada e scettro la
  superano. Il nano la tiene: le sue asce sono a due mani e gli farebbero
  posare lo Scudo di Fiammetta.
- **Lo Scudo di Fiammetta e il Ciondolo di Re Ossuto restano addosso a
  tutti fino in fondo** nella roba attesa: nessuno scudo o gioiello della
  fila li batte sui numeri. Un'arma a due mani che farebbe posare uno scudo
  col nome si giudica sui numeri (`migliora` in `motore/storia.js`), così il
  guardiano non regala uno spadone peggiore di spada e scudo.
- **Sono roba attesa**: li lascia di sicuro, quindi la tabella della storia
  li conta ([la-grande-storia.md](la-grande-storia.md#la-tabella-dellequipaggiamento)).
  Il pezzo raro che lascia insieme no: è pescato a caso.

## Dove sta

- **Nella stanza della scala, al posto del guardiano** (`mostroGrosso`):
  accanto alla scala, sopra o sotto, o ai lati se lì non c'è posto. Se nella
  stanza non c'è posto diventa grosso il mostro più lontano dall'ingresso.
- **Davanti a lui l'anticamera coi caporali** (nelle sette discese, non
  nell'abisso): la stanza subito prima sulla strada, con due o tre mostri
  più duri e col segno dei galloni ([piani.md](piani.md#i-mostri-branchi-appostati-caporali)).
  Per questo il piano col grosso nasce diverso da quello senza: ha una stanza
  col suo ruolo e il resto dei mostri è tre quarti per stanza meno i caporali.
- **Nell'abisso uno ogni cinque piani** (`GROSSO_OGNI`: il 5°, il 10°…), a
  giro (`GIRO_DELL_ABISSO`), più forti perché cresce il piano.
- **Come gli altri mostri dorme finché non si entra nella sua stanza.**

## Come si vede

- **Lo sprite della creatura che veste, ingrandito, con la corona** (`figuraDelGrosso` in `dati/grossi.js`; l'utente, 12 ottobre 2026: i boss li fa
  dipingere ChatGPT, perché lo stile resti lo stesso del bestiario, e finché non ci sono si prende uno sprite che c'è già, ingrandito e con la corona).
  Lo sprite `fermo`/`corsa` di quella creatura ingrandito dentro la sua scatola (alto al più 1,9 altezze dell'eroe, largo al più 3 larghezze, a quarti:
  `ingrandimentoDelGrosso`; con un'altezza sola un ragno usciva largo il doppio del palco e la corona era grande quanto lui), la corona
  👑 sopra la testa (un terzo della figura; quella del bersaglio di una missione è più grande) e un chiarore della sua `tinta` dietro, che distingue Re Ossuto da Carbonchio.
  Sulla tela respira (più svelto da sveglio) e, se la creatura ha i passi (il ragno, l'orco), **cammina da sveglia**; guarda verso l'eroe, ha l'alone
  rosso più largo, il nome sopra la corona quando è in luce, la chiave, il sonno e la barretta come gli altri. **Nello scontro** (`viste/Grosso.vue`)
  è la posa di lato ferma per chi ha i passi (il ragno, l'orco, specchiati verso l'eroe), il respiro per gli altri, con la scala dell'eroe
  per l'ingrandimento (`scalaDelGrosso`) e la stessa corona. La figura disegnata in codice (`scena/grossi.js`, 32×32) è stata tolta: non serve più, e un boss dipinto da chi non è il modello
  avrebbe cambiato stile.
- **L'immagine dipinta prende il posto da sola**: se l'atlante ha
  `grosso-<chiave>-fermo-0` (come `armaiolo-fermo-0` per i mercanti) si usa
  quella, a misura vera (32×32), senza corona né ingrandimento; se no il
  ripiego. I prompt, uno per volta e nell'ordine della tabella:
  `strumenti/sprite/sorgenti/sotterraneo/generati/PROMPT-grossi.md`.
- **La sua vita in cima allo schermo** (`[data-grosso]` in `Gioco.vue`): da
  quando si sveglia (si entra nella sua stanza) e mentre lo si combatte, con
  la sua faccia, il nome e la barra rossa che cala a ogni colpo. Nello
  scontro c'è la sua figura al posto dello sprite.
- **Quando cade** non lo dice nessuna riga (la barra in cima sparisce, si
  vede: [dialoghi.md](dialoghi.md#le-scritte)); per terra intorno a lui il suo
  pezzo col nome, un pezzo raro o leggendario e, nella storia, il pezzo
  della riga dopo.

## Quanto conta

- **L'esperienza**: la sua potenza (ossa, attacco, poteri: [livelli.md](livelli.md#lesperienza-viene-solo-dai-mostri)),
  che con le sue ossa e il suo colpo in più è molto: spesso il livello che si prende in una discesa.
- **Le domande** (misurate prima del 12 ottobre, con i mostri di strada di allora; il grosso non è cambiato): con la roba e il livello attesi Re Ossuto chiede da tre a
  sei risposte giuste, Grumo e Fiammetta da cinque a otto, Gorgo da otto a
  undici, Carbonchio da undici a sedici (il mago e l'elfa, che picchiano di
  più, stanno in basso). Provato con le ossa fino a 1,9: oltre venti
  risposte, un compito. La domanda rincara come quella di un capo
  (`RINCARO.capo`).

Nei test: `unita/sotterraneo-rarita` (in fondo a ogni discesa il suo mostro
grosso, nella stanza della scala, con la chiave e il nome, più grosso del
suo simile; battuto lascia il suo pezzo e un raro o meglio; nell'abisso ogni
cinque piani; la figura è la creatura che veste, ingrandita a due caselle,
o la chiave d'atlante dipinta se c'è, e ogni tinta è un colore),
`unita/sotterraneo-storia` (in fondo alla discesa la chiave ce l'ha il
grosso), `integrazione/sotterraneo-eroe` (col dito: Re Ossuto con la sua
vita in cima e la sua figura nello scontro con la corona `.sot-corona`,
battuto la vita in cima se ne va). La barra in cima `[data-grosso]` con
`data-chi` e `data-ossa`; la figura `[data-figura-grosso]`.
