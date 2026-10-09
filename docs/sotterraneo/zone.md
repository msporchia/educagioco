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

Il codice: `dati/zone.js` (l'ordine, le fasce, i volti, quanto picchiano,
l'esperienza), `motore/zone.js` (la fascia di adesso, i colori, la notizia,
la roba attesa), `motore/banco.js` (`misuraLeZone`), `Gioco.vue`,
`viste/Terra.vue` (il pallino, la sentinella, il fumetto, il «!»),
`motore/dialoghi.js` (l'annuncio e le verdi), `viste/pixel.js` (`SENTINELLA`).

## Le fasce

Una fascia è di **quattro livelli** (`LARGA`): «livello 14–17». Le sette zone
nascono a due livelli l'una dall'altra (`PASSO`), dalla scalinata alla
cripta (`ORDINE_DELLE_ZONE`, `NASCITA`): 6–9, 8–11, … 18–21. Il colore si
legge dalla fascia contro il livello dell'eroe (`coloreDellaFascia`):

| colore | l'eroe | cosa succede | la fascia 16–19 |
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
- **Non si scrive niente**: la fascia dipende solo dal livello dell'eroe, che
  non scende mai (`fasciaDi`: la più bassa delle sue, `NASCITA + 14·n`, non
  ancora superata). Un eroe che sale tre livelli in una discesa trova al
  ritorno le zone già rinate. Si scrive solo la notizia sentita.
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
sono i gradini da 0 a 7. Due gradini sopra l'eroe rosso, uno sopra arancio,
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
- **i mostri del livello L**: `forza` = (4 + 0,5 · (L − 12)) × la forma,
  `spinta` = 15 + 0,65 · (L − 12), arrotondata. In linea retta, mai
  esponenziali. La forma (`FORMA_DELLA_ZONA`) corregge le zone che a pari
  livello vengono più comode o più dure: la cripta, piccola, ×1,6; la torre
  ×1,05; la scala sommersa, la botola e la miniera ×0,9;
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
  uno. Dentro la storia la curva non cambia. Provato: il cubo di m, messo per
  l'abisso: una zona al 12 valeva 2,3 livelli, al 16 0,4, al 20 0,15, al 26
  0,07; la ruota non sarebbe girata mai.
- **Nella grigia un quarto** (`ESP_GRIGIA`, `espNellaZona`): l'esperienza di
  un mostro cresce piano col livello del posto, e una grigia, facile, rendeva
  0,9 livelli contro gli 1,1 di una verde. Adesso 0,26.
- **Nell'abisso un terzo** (`esp` in `L_ABISSO`): i suoi mostri sono molto
  più deboli di quelli di una zona dello stesso livello (non hanno la
  `forza`), e per domanda rendeva tre volte una verde (22 contro 8): con la
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
- **`zone` nell'avventura è `{ sentita }`**. Quello di prima (`{ n, livelli,
  sentita: true }`, la zona sveglia) si rilegge come «mai sentita»: il minatore
  ha la notizia e dice cosa è cambiato. Le fasce non hanno bisogno di niente
  dal vecchio stato. Niente da azzerare, `MONDO` resta 4; una sosta vecchia
  con la sua potenza si riprende uguale.

## Le misure

`misure/sotterraneo`, dieci semi per zona e per eroe, dritti alla scala, con
la roba attesa al livello (`robaAttesaA`: quella con cui si esce dalla
storia coi pezzi rifatti a L − 1, le pozioni dell'abisso) e la crescita
attesa. L'eroe all'inizio della fascia, la verde più dura. Vinte, in media
fra i quattro eroi, nell'ordine della storia (cripta, scalinata, torre,
grotta, sommersa, botola, miniera):

| | a 8/10 | a 6/10 | a 4/10 | livelli presi (8/10) |
|---|---|---|---|---|
| zone 12–15 | 95–100% | 57 · 57 · 68 · 75 · 65 · 55 · 65% | 0–15% | 0,8 · 1,6 · 1,6 · 1,3 · 1,6 · 1,8 · 1,5 |
| zone 16–19 | 100% | 78 · 57 · 63 · 73 · 70 · 65 · 78% | 0–23% | 0,7 · 1,4 · 1,5 · 1,2 · 1,5 · 1,6 · 1,4 |
| zone 20–23 | 100% | 78 · 80 · 73 · 75 · 78 · 75 · 75% | 0–20% | 0,7 · 1,3 · 1,4 · 1,1 · 1,4 · 1,5 · 1,3 |
| zone 30–33 | 100% | 57 · 60 · 57 · 68 · 63 · 63 · 63% | 0–10% | 0,6 · 1,2 · 1,3 · 1,0 · 1,2 · 1,4 · 1,2 |

- **Come una discesa della storia**: a otto sempre, a sei due volte su tre,
  a quattro di rado. Fra il 24 e il 28 a sei su dieci si scende verso il 40%
  (al 24 il 56%, al 27 il 38%; a otto 98–100%): la roba attesa sale a scalini, e la difesa salta al 30. Provato:
  `spinta` 0,55 a livello: il buco si chiude, ma al 20 e oltre il 30 a sei
  su dieci si vinceva nove volte su dieci. Un punto di `spinta` sposta il sei
  su dieci di dieci punti.
- **Le domande per zona** (a 8/10): al 12 da 45 (la cripta, che rende anche
  meno: quattro stanze a piano) a 71, al 20 da 65 a 100. Oltre le 85 di una
  seduta la zona si fa in due sere, con la sosta.

E i colori, su una zona 16–19 (a 8/10 · a 6/10):

| eroe | colore | vinte | livelli |
|---|---|---|---|
| dell'11 | rosso | 40% · 0% | |
| del 12 | arancio, il più duro | 58% · 0% | |
| del 15 | arancio, il più facile | 99% · 50% | |
| del 16 | verde, il più duro | 100% · 69% | 1,3 |
| del 20 | grigio | 100% · 100% (a 4/10 61%) | 0,26 |

Nei test: `unita/sotterraneo-zone` (le fasce alla nascita, due grigie, due
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
