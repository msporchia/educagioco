# Quanto è difficile una domanda, e a chi arriva

La difficoltà dichiarata da 0 a 100, l'età del bambino, e come la manopola
di un gioco diventa una domanda. Il codice è `src/quiz/nucleo/classi.js`;
l'elenco di tutte le classi è [livelli-delle-domande.md](livelli-delle-domande.md)
(generato, `npm run quiz:livelli`), l'effetto per età è
[chi-vede-cosa.md](chi-vede-cosa.md) (generato, `npm run quiz:eta`).

## La difficoltà è un numero solo, dichiarato

- **Ogni grado di ogni modulo dice `livelli: [25, 38, …]`**: quanto è
  complicato, sulla stessa scala per tutte le materie. 0 = quattro anni
  (materna), 100 = dodici (fine primaria), **12,5 punti per anno**
  (`PUNTI_PER_ANNO`, `livelloDegliAnni`, `anniDelLivello`).
- **Una tipologia può dichiarare il suo** `livello` quando sta fuori dal
  suo grado: un numero (vale per tutti i gradi) o uno per grado
  (`{ 3: 30, 4: 44, 5: 52 }`) quando è la stessa cosa che si allunga — la
  catena da tre del senso del numero non vale quanto il passo singolo.
  Lettura in `livelloVoluto` (`nucleo/modulo.js`).
- **«Fin quando è utile» non si dichiara**: lo decide la finestra del
  bambino. Una coppia di età `[da, a]` per classe era arbitraria in `a`.
- **Provato: derivare la difficoltà dalla posizione in scaletta** (grado 1
  = 0, ultimo = 1). Non funziona: metteva i grado-1 di sedici moduli nello
  stesso punto, e «come si chiama questa figura» accanto a un problema da
  leggere in scioltezza.

## L'età sta sul bambino, e dà due larghezze

L'età è `settings.eta` (la scrive la partenza, vedi
[eta-e-portata.md](eta-e-portata.md)). Da lì due finestre diverse, ed è la
cosa che si sbaglia più facilmente:

| | sotto | sopra | a cosa serve |
|---|---|---|---|
| **ammissione** (`finestraDi`) | 44 punti (3,5 anni) | 25 (2 anni) | chi entra nel mazzo: taglio netto (`adatta`) |
| **mira** (`bersaglio`) | 12 (1 anno) | 25 (fino al tetto dell'ammissione) | dove punta la manopola |

- **Taglio netto in tutte e due le direzioni.** Sotto l'ammissione c'è la
  presa in giro («con che lettera comincia 🐝» come premio di una carta
  tosta a dieci anni), sopra il muro: nessuna delle due si aggiusta
  uscendo di rado.
- **Con una larghezza sola**, a nove anni le ore intere dell'orologio non
  diventavano rare: sparivano.
- La mira sotto resta a −12 apposta: abbassarla renderebbe più facile la
  prima tappa di una campagna, il verso sbagliato.
- Costanti: `TAGLIO_SOTTO`, `TAGLIO_SOPRA`, `MIRA_SOTTO`, `MIRA_SOPRA`.

## La manopola diventa un punto nella finestra

Il gioco chiede una difficoltà 0..1 e non sa chi ha in mano il telefono:
`bersaglio(d, eta)` la mette fra `età − 12` (carta debole) e `età + 25`
(carta tosta). Ogni classe ammessa pesa con una campana intorno al
bersaglio (`pesoDi`). `quantoPesa(livello, finestra)` dice quanto una
domanda è dura *per chi la riceve* (0 fondo, 1 cima), per un gioco che
volesse pagarla di più.

## `BANDA`: quanto è sfocato il tiro

- **`BANDA` = 11** (poco meno di un anno): a quella distanza il peso è a un
  terzo, al doppio è trascurabile.
- **Provato 19**: la campana era larga quasi quanto tutta la corsa della
  manopola. Su una porta della terza tappa del sotterraneo (difficoltà
  0,45, otto anni) il 10% delle domande stava sotto i sei anni e mezzo, e
  due domande di fila distavano 1,1 anni contro 0,25 fra due tappe
  adiacenti: la difficoltà chiesta era deterministica, quella consegnata
  un sorteggio. A 11 la coda sotto i sei anni e mezzo è allo 0,4%, la
  dispersione ±0,55 anni, e la campagna del sotterraneo corre da 7,1 a 9,5
  anni.
- **Ammesse non vuol dire frequenti**: le ore intere restano nel mazzo di
  un bambino di nove anni ma non gli capitano, salvo nel degrado qui sotto.

### Dove il mazzo si dirada, la banda si allarga

Agli estremi le classi scarseggiano (sopra i dieci anni sono tredici), e
con la banda ferma **una classe sola si prendeva il 54% dei tiri** davanti
al capo dell'ultima tappa. `bandaPer` allarga di `ALLARGO_BANDA` (3) a
tentativi finché le classi che contano davvero non sono `VARIETA_MINIMA`
(14) o la banda non arriva a `BANDA_MASSIMA` (25). «Contano davvero» è il
numero effettivo (`quanteContano`: l'inverso della somma dei quadrati dei
pesi). In mezzo alla primaria il primo tentativo è già buono. Col mazzo
svuotato da un grande (solo l'orologio acceso) la banda va al massimo e il
verso resta giusto: ore intere 222 volte su 3000 con la carta debole, 17
con la tosta.

## Si pesca una classe, non un modulo

Una **classe** è la coppia (modulo, grado): «il perimetro», «i contrari».
`classiDi` le raccoglie tutte e `pescaClasse` ne tira una.

- **Provato: pescare il modulo e calcolare il grado** dalla difficoltà.
  Non funziona: i giochi chiedono poche difficoltà fisse (0,15 · 0,50 ·
  0,85 in Survivors), quindi da ogni modulo usciva sempre lo stesso grado,
  e un modulo con sei classi le mostrava una alla volta mentre uno con una
  la mostrava sempre.
- Quante domande diverse sa fare un modulo non pesa: quella è
  ripetitività, e la misura il banco.
- `classi.js` non importa niente e gira in Node, perché la distribuzione va
  contata.

Nei test: `unita/quiz-pesi` (tremila tiri per fascia: tutti i moduli si
vedono, nessuna classe oltre un quinto, una carta facile non consegna una
domanda da carta tosta), `unita/catalogo` (chi non ha dichiarato i livelli).

## Quando decide un grande

I livelli dichiarati sono un punto di partenza: su centosessanta righe
qualcuna è tarata male. Un grande sposta la finestra **per una chiave
sola** (un gruppo o una tipologia) di un gradino da mezzo anno (`PASSO` 6
punti), al massimo tre per verso (`RITOCCO_MAX`, `gradini`), in
`settings.ritocchi`; «per lui è facile» alza. Oltre un anno e mezzo non si
ritocca più, si spegne. I ritocchi di una tipologia e dei suoi gruppi si
sommano. Il gioco **consiglia e non ritocca da sé** (vedi
[la-domanda.md](la-domanda.md), il muro). La ✎ che lo fa sta in
[../genitori/ritocchi.md](../genitori/ritocchi.md).
