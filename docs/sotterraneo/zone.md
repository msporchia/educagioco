# Le zone

Finita la storia, per trovare mostri all'altezza bisognava riscendere
decine di piani nell'abisso: *«è noioso dover riscendere 30 livelli per
trovare qualcuno di decente»* (l'utente, 8 ottobre 2026). Adesso le sette
discese della storia sono **zone corte con una fascia di livelli fissa**:
*«un dungeon ha un suo livello alla nascita, tipo 10-16, e ci rimane fino a
che non sei a livello 24, dove non ha più senso di esistere; a quel punto
salta di grado»* (l'utente, 9 ottobre). Ci sono **quattro gruppi sempre
attivi**, uno debole, uno giusto, uno medio-forte e uno troppo forte, e
**quando una zona diventa troppo debole rinasce troppo forte**, con un nome
e una storia nuovi che il minatore racconta. Il pallino davanti a ogni
discesa dice il gruppo col colore; davanti alla troppo forte sta una
sentinella che non fa passare.

Provato: la zona sveglia che segue l'eroe (una alla volta, al livello
dell'eroe, a giro): l'utente vuole fasce fisse, che si vedano avanzare.

**Il colore si legge dalla forza dell'eroe, non dal suo livello**
([forza.md](forza.md)); sotto, «l'eroe» per un colore è l'atteso, la cui forza è il livello.

Il codice: `dati/zone.js` (l'ordine, le fasce, i volti, quanto picchiano,
l'esperienza), `motore/zone.js` (la fascia di adesso, i colori, la notizia,
la roba attesa), `motore/forza.js` (la forza), `motore/banco.js` (`misuraLeZone`), `Gioco.vue`,
`viste/Terra.vue` (il pallino, la sentinella, il fumetto, il «!»),
`motore/dialoghi.js` (l'annuncio e le verdi), `viste/pixel.js` (`SENTINELLA`).

## Le fasce

Una fascia è di **quattro livelli** (`LARGA`): «livello 14–17». Le sette zone
nascono a due livelli l'una dall'altra (`PASSO`), dalla scalinata alla
cripta (`ORDINE_DELLE_ZONE`, `NASCITA`): 6–9, 8–11, … 18–21. Il colore si
legge dalla fascia contro la forza dell'eroe (`coloreDellaFascia`):

| colore | la forza | cosa succede | la fascia 16–19 |
|---|---|---|---|
| rosso | più di 4 livelli sotto l'inizio | la sentinella non fa scendere | eroe fino all'11 |
| arancio | da 1 a 4 livelli sotto l'inizio | si scende; il minatore dice che sono più forti | dal 12 al 15 |
| verde | dentro la fascia | niente da dire | dal 16 al 19 |
| grigio | da 1 a 4 livelli sopra la fine | si scende; il minatore dice che rende poco | dal 20 al 23 |
| — | più di 4 sopra la fine | la zona rinasce in cima | dal 24: 30–33 |

- **La fascia non segue l'eroe**: la torre è 12–15 dall'eroe dell'8 a quello
  del 19, e intanto cambia colore (rossa al 7, arancio all'8, verde al 12,
  grigia al 16).
- **Rinascere**: superata la fine di più di quattro livelli (`MARGINE`), la
  zona prende la fascia `GIRO` = 14 livelli più su, cioè due sopra la più alta
  delle altre: è la nuova rossa. La torre 12–15 al 20 diventa 26–29.
- **Sempre due grigie, due verdi, due arancio e una rossa**: la fascia è
  larga quanto il margine e quanto due passi, quindi ogni gruppo copre quattro
  livelli di inizi e prende due zone; la rossa è la settima.
  `guastiDelleZone` lo pretende, `unita/sotterraneo-zone` lo prova dall'8 al 90.
- **Si scrive il massimo della forza** (`zone.forza`): la fascia dipende dal più
  alto fra livello, forza di adesso e forza massima raggiunta (`rinascitaDi`,
  [forza.md](forza.md#le-zone-ruotano-col-massimo)): vendere un'arma non fa
  tornare indietro una zona rinata. Si scrive anche la notizia sentita.
- **Le fasce sono a due livelli, non a sei come nell'esempio dell'utente**:
  un livello di differenza cambia molto ([Le misure](#le-misure)): con fasce
  di sette l'arancio arrivava a sei livelli sopra l'eroe, dove a otto su
  dieci non si vince.

### Un eroe che sale dal 12 al 30

I nomi brevi sono le discese della storia; il volto della zona cambia a ogni
rinascita.

| eroe | grigie | verdi | arancio | rossa |
|---|---|---|---|---|
| 12 | scalinata 6–9, grotta 8–11 | botola 10–13, torre 12–15 | miniera 14–17, sommersa 16–19 | cripta 18–21 |
| 14 | grotta 8–11, botola 10–13 | torre 12–15, miniera 14–17 | sommersa 16–19, cripta 18–21 | scalinata 20–23 |
| 16 | botola 10–13, torre 12–15 | miniera 14–17, sommersa 16–19 | cripta 18–21, scalinata 20–23 | grotta 22–25 |
| 18 | torre 12–15, miniera 14–17 | sommersa 16–19, cripta 18–21 | scalinata 20–23, grotta 22–25 | botola 24–27 |
| 20 | miniera 14–17, sommersa 16–19 | cripta 18–21, scalinata 20–23 | grotta 22–25, botola 24–27 | torre 26–29 |
| 24 | cripta 18–21, scalinata 20–23 | grotta 22–25, botola 24–27 | torre 26–29, miniera 28–31 | sommersa 30–33 |
| 30 | botola 24–27, torre 26–29 | miniera 28–31, sommersa 30–33 | cripta 32–35, scalinata 34–37 | grotta 36–39 |

Ogni due livelli una zona rinasce, nell'ordine della nascita: tre delle
cantine, due della fornace, due della cripta, e lo scenario resta lo stesso
per qualche rinascita di fila. La scalinata al 14 è «La scalinata del clan»,
al 28 «La scalinata di ferro», al 42 di nuovo «degli orchi» (`VOLTI`, tre per
zona, `voltoDi`).

## Nella storia

Le discese in fila, coi colori e la sentinella secondo il livello atteso,
come prima. **Un gradino è il passo fra due discese di fila**: i livelli
attesi 1 · 2 · 3 · 5 · 7 · 8 · 10 · 12 ([la-grande-storia.md](la-grande-storia.md))
sono i gradini da 0 a 7. Due gradini sopra la forza dell'eroe rosso, uno sopra arancio,
due sotto grigio, il resto verde (`coloreNellaStoria`): la scalinata (2) al
livello 1 arancio, la torre (3) rossa, la scala sommersa (7) al 4 rossa e al
5 arancio. Il blocco della storia resta il divieto di sempre; la sentinella
ferma in più chi è molto indietro, e la strada è farsi le ossa dove il
pallino è verde. `coloreDi` sceglie: fascia se la storia è finita, gradini
se no.

## Il pallino e la sentinella

- **La rossa ha la sentinella** davanti all'ingresso, all'angolo dove sta il
  divieto delle chiuse (che non è mai insieme: una chiusa non ha pallino): la
  guardia della torre in ferro scuro e mantello nero, disegnata in codice,
  così non la si scambia con quella delle missioni. Nel fumetto «Alt! Laggiù
  è troppo pericoloso per te: non ti faccio passare…» e niente «scendo»;
  `avvia` rifiuta lo stesso una discesa rossa.
- **Grigia e arancio dicono, non vietano**: la frase sta nel fumetto con la
  voce del minatore («Il minatore ti ha visto passare»). L'arancio tace nella
  storia se il minatore ha già detto cosa manca con la roba in mano
  ([la-grande-storia.md](la-grande-storia.md#chi-e-sotto-il-livello-lo-sa-prima-di-scendere)).
- **Il fumetto dice la fascia**, «livello 14–17» nel colore del pallino
  (nella storia il livello atteso, «livello 3»).
- **L'abisso non ha colore**: il pallino resta chiaro, perché un piano dopo
  l'altro passa da grigio a rosso.

## La notizia

**La notizia è la zona nata per ultima** (la fascia più alta, sempre la
rossa): `notiziaDi`. Il vecchio minatore la racconta aprendo il suo dialogo
([dialoghi.md](dialoghi.md)): la sua storia (`annuncio` del volto) e in coda
«Per adesso è troppo forte per te, e la sentinella non ti fa passare: fatti
le ossa dove il pallino è verde.». **La prima volta**, a storia appena
finita, prima dice cosa è cambiato (`PRIMA_NOTIZIA`). Poi dice dov'è, e
**le due verdi** («Alla tua altezza c'è la torre infernale: …»); sentita la
notizia, aprendo dice solo le verdi. «Cosa c'è laggiù» dice il mostro grosso
della zona nuova.

Finché non l'ha raccontata ha il «!» d'oro sopra la testa, il pallino della
zona nuova pulsa e la riga in fondo dice «Il minatore ha una notizia: vai a
sentirla.»; appena gli si parla l'avventura segna `zone.sentita` («cantine:20»,
la zona e l'inizio della fascia) e il «!» si spegne. Rinasce la prossima, e
il «!» torna.

## Com'è fatta una zona

`zonaPotenziata(k, L)`: la discesa `k` con la fascia che comincia a L
(`potenza`) e

- **il nome e la dritta del volto** di quella rinascita (`voltaDi`), nel
  fumetto, nel titolo e nella carta «riprendi»; sotto il campo «livello 14 ·
  piano 1 di 5»;
- **zone corte**: cinque piani, sei nella grotta che li ha piccoli. La forma
  dei piani, lo scenario, i guardiani e il mostro grosso sono quelli della
  discesa ([grossi.md](grossi.md)); il grosso chiede da 7 a 13 risposte giuste;
- **le domande dell'abisso**: `dif` da 0,92 a 1, in cima alla finestra
  dell'età ([abisso.md](abisso.md#le-domande-smettono-presto-di-salire));
- **il livello del posto è L** (più uno ogni due piani): dice il livello
  del bottino, le gemme e l'esperienza dei mostri ([livelli.md](livelli.md));
- **i mostri del livello L**: gli abitanti e il caporale della discesa ([mostri.md](mostri.md): una zona tiene i suoi per sempre) con
  `forza` = (2,2 + 0,15 · (L − 12)) × la forma e `spinta` = 9,5 + 1,3 · (L − 12), a un decimo (`CURVA_DELLE_ZONE`). In linea retta, mai esponenziali. La forma
  (`FORMA_DELLA_ZONA`) dice quanto gli abitanti sono più comodi o più duri a pari livello: cripta ×1,7, scalinata ×1, torre ×0,9, grotta ×1,4, botola ×0,85, scala
  sommersa ×1,2, miniera ×1,2. Ritarate la sera del 13 ottobre sui branchi grossi ([taratura-branchi.md](taratura-branchi.md); prima forza 4 + 0,6 a livello e spinta 13 + 1,0, forme 2,2 · 0,75 · 0,9 · 1,4 · 0,85 · 0,95 · 1,35).
- **il bottino come nell'abisso** (`indiceDella` dà −1): i forzieri danno un
  pezzo a tono sei volte su dieci, il mostro grosso il suo pezzo col nome e
  un raro del livello.
- **Una zona vinta non tocca la storia** e non scrive niente: le stelle e il
  record di fuori restano quelli delle discese di allora; i contatori del
  bambino (`sotPiani`, `sotMostri`…) salgono come sempre.

## L'esperienza

Una zona verde vinta vale **più o meno un livello**, a ogni altezza: così
la ruota gira, e chi gioca normale vede una zona rinascere ogni due zone
vinte o poco più.

- **La curva oltre la storia** ([livelli.md](livelli.md#le-soglie)): dal 12
  ogni livello costa in più 120 + 10 · (2m + 1), con m i livelli sopra il 12
  (`ESP_R`, `ESP_Q`). Cresce in linea retta come l'esperienza di una zona
  (da 470 al 12 a 1310 al 40, misurata), quindi il rapporto resta vicino a
  uno. Provato: il cubo di m: una zona valeva 2,3 livelli al 12 e 0,07 al 26.
- **Nella grigia un quarto** (`ESP_GRIGIA`, `espNellaZona`): l'esperienza di
  un mostro cresce piano col livello del posto, e una grigia, facile, rendeva
  0,9 livelli contro gli 1,1 di una verde. Adesso 0,26. «Grigia» è per la
  forza dell'eroe, non per il suo livello (`Corsa` la legge da `forzaDelCorredo`).
- **Nell'abisso un terzo** (`esp` in `L_ABISSO`): i suoi mostri erano molto
  più deboli di quelli di una zona dello stesso livello (non avevano la
  `forza`, adesso ce l'hanno: [abisso.md](abisso.md#come-crescono-i-mostri)), e per domanda rendeva tre volte una verde (22 contro 8): con la
  curva nuova l'abisso sarebbe diventato il posto dove farsi le ossa. Con un
  terzo, dal 12 con la roba attesa, quaranta piani portano al 21 (prima della
  curva nuova al 20), e per domanda rende come una zona.

## L'abisso

Resta com'è, e resta la sfida del primato: il fondo nell'avventura, il
primato `sotFondo`, il traguardo «Giù per il buco» e la riga della home non
cambiano ([abisso.md](abisso.md)). Non è il posto dove farsi le ossa: lo sono
le zone.

## La sosta e i salvataggi

- **La sosta scrive `potenza`** (`scrivi` in `motore/sosta.js`) e rientrando
  `zonaDi(tappa, potenza)` rifà la stessa zona dal seme, col suo volto: il
  portale, la ✕ e «riprendi da qui» funzionano come nelle altre discese
  ([../core/ripresa.md](../core/ripresa.md), [portale-e-sosta.md](portale-e-sosta.md)).
  Finché la sosta c'è, quella discesa sulla mappa è la zona di quando si è
  scesi, anche se intanto l'eroe l'ha superata (`potenzaDi`).
- **`zone` nell'avventura è `{ sentita, forza }`**. Quello di prima (`{ n, livelli,
  sentita: true }`, la zona sveglia) si rilegge come «mai sentita»: il minatore
  ha la notizia e dice cosa è cambiato. Un salvataggio senza `forza` vale come
  «il livello dell'eroe». Scrivere una delle due non cancella l'altra
  (`zoneConForza`, `zoneConSentita`). Niente da azzerare, `MONDO` resta 4; una
  sosta vecchia con la sua potenza si riprende uguale.

## Le misure

`misure/sotterraneo` (o `npm run sotterraneo -- --zone 12,16,20,30 --verifica`), dieci semi per zona e per eroe, dritti alla scala,
con la roba attesa al livello (`robaAttesaA`: quella con cui si esce dalla storia coi pezzi rifatti a L − 1, le pozioni
dell'abisso), la crescita attesa e le abilità della strada del banco ([scontro-bilancio.md](scontro-bilancio.md)). L'eroe
all'inizio della fascia, la verde più dura. Vinte, in media fra i quattro eroi, nell'ordine della storia (cripta, scalinata,
torre, grotta, sommersa, botola, miniera), a 8/10 · 6/10 · 4/10 (13 ottobre sera):

| | a 8/10 | a 6/10 | a 4/10 | domande (8/10) |
|---|---|---|---|---|
| zone 12–15 | 95 · 98 · 98 · 98 · 100 · 93 · 98% | 85 · 73 · 83 · 63 · 73 · 68 · 50% | 13 · 5 · 25 · 10 · 30 · 8 · 15% | 64 · 90 · 58 · 76 · 79 · 96 · 71 |
| zone 16–19 | 93 · 95 · 100 · 93 · 98 · 93 · 95% | 80 · 78 · 80 · 83 · 75 · 57 · 55% | 20 · 18 · 28 · 8 · 25 · 8 · 13% | 64 · 92 · 59 · 75 · 83 · 97 · 75 |
| zone 20–23 | 98 · 98 · 100 · 90 · 100 · 98 · 98% | 73 · 68 · 73 · 65 · 63 · 63 · 45% | 5 · 3 · 13 · 3 · 15 · 0 · 10% | 72 · 97 · 63 · 82 · 89 · 105 · 79 |
| zone 30–33 | 98 · 98 · 93 · 95 · 100 · 95 · 100% | 73 · 68 · 83 · 83 · 68 · 50 · 50% | 13 · 5 · 8 · 10 · 15 · 0 · 10% | 77 · 104 · 66 · 91 · 91 · 111 · 85 |

- **Come una discesa della storia**: a otto quasi sempre, a sei due volte su tre, a quattro di rado (fra il 24 e il 27 a sei il 54%).
  I livelli presi vanno da 0,8 a 2,2 (l'esperienza di un mostro di strada è il 35%, [taratura-branchi.md](taratura-branchi.md)).
- **Le domande per zona** (a 8/10, dritti): al 12 da 58 a 96, al 20 da 63 a 105, al 30 da 66 a 111; prima del 13 ottobre 41–66, 61–99, 71–119. Oltre le 85 di una seduta
  la zona si fa in due sere, con la sosta; la botola e la scalinata (sedici stanze) sono le più lunghe.

E i colori, su una zona 16–19 (a 8/10 · a 6/10):

| eroe | colore | vinte | livelli |
|---|---|---|---|
| dell'11 | rosso | 7% · 1% | |
| del 12 | arancio, il più duro | 14% · 2% | |
| del 15 | arancio, il più facile | 88% · 49% | |
| del 20 | grigio | 100% · 83% (a 6/10 · 4/10) | 0,29 |

Il 12 contro la zona 16–19 vince una volta su sette (il 12 ottobre una su quattro, prima una su due): quattro livelli sotto, con le abilità e i branchi
che li contano, pesano molto (il bersaglio è ≥ 10%).

Nei test: `unita/sotterraneo-forza` (la forza: [forza.md](forza.md#nei-test)),
`unita/sotterraneo-zone` (le fasce alla nascita, due grigie, due
verdi, due arancio e una rossa a ogni livello, la fascia fissa e la
rinascita rossa sopra la più alta, i colori con gli esempi qui sopra, i
gradini della storia, la notizia e lo stato di prima, il minatore che dice
l'annuncio e le verdi, la sosta che tiene la potenza, com'è fatta una zona e
il suo grosso, la sosta che la rifà col suo volto, la curva oltre il 12, un
quarto nelle grigie, una torre verde vinta che vale più o meno un livello),
`misure/sotterraneo` (le tabelle qui sopra), `integrazione/sotterraneo-zone`
(col dito: i colori e la sentinella nella storia; al 14 il «!», la notizia
con la presentazione, le fasce coi colori, la rossa rinata col suo nome, la
grigia che si dice, la verde «livello 12–15», giù nella torre, la sosta con
la potenza). Sul pallino `[data-pallino][data-colore]` (`grigio`, `verde`,
`arancio`, `rosso`), la sentinella `[data-guardia="<posto>"]`; nel fumetto
`[data-livello-zona]` con `data-livello`, `data-fascia` («12-15») e
`data-colore`, `[data-detto-colore]` e `[data-ferma]`; il «!» del minatore
`[data-segno-di="annuncio"]`, nel suo dialogo `[data-annuncio]`; sotto il
campo `.sot-piede[data-livello-posto]`.
