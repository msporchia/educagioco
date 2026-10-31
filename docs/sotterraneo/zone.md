# Le zone

Finita la storia, per trovare mostri all'altezza bisognava riscendere
decine di piani nell'abisso: *«è noioso dover riscendere 30 livelli per
trovare qualcuno di decente»* (l'utente, 8 ottobre 2026). Adesso ogni dungeon
del mondo ha il **livello della sua zona** (la fascia di quattro livelli da
cui nasce) e si rigenera quando lo si ripulisce
([dungeon-che-si-rigenerano.md](dungeon-che-si-rigenerano.md)): le zone non
rinascono più forti, il livello resta quello del posto. Il colore nel fumetto
di ogni discesa dice quanto è forte per l'eroe; davanti a una troppo forte sta
una sentinella che non fa passare.

Provato: la zona sveglia che segue l'eroe (una alla volta, al livello
dell'eroe, a giro): l'utente vuole fasce fisse, che si vedano avanzare.

**Il colore si legge dalla forza dell'eroe, non dal suo livello**
([forza.md](forza.md)); sotto, «l'eroe» per un colore è l'atteso, la cui forza è il livello.

Il codice: `dati/zone.js` (l'ordine, le fasce, i volti, quanto picchiano,
l'esperienza), `motore/zone.js` (la fascia di adesso, i colori, la roba
attesa), `motore/forza.js` (la forza), `motore/banco.js` (`misuraLeZone`), `Gioco.vue`,
`viste/FumettoMondo.vue` e `viste/Mondo3d.vue` (il colore, la sentinella, il fumetto).

## Le fasce

Una fascia è di **quattro livelli** (`LARGA`): «livello 14–17». Il colore si
legge dalla fascia del dungeon contro la forza dell'eroe (`coloreDellaFascia`):

| colore | la forza | cosa succede | la fascia 16–19 |
|---|---|---|---|
| rosso | più di 4 livelli sotto l'inizio | la sentinella non fa scendere | eroe fino all'11 |
| arancio | da 1 a 4 livelli sotto l'inizio | si scende; il minatore dice che sono più forti | dal 12 al 15 |
| verde | dentro la fascia | niente da dire | dal 16 al 19 |
| grigio | da 1 a 4 livelli sopra la fine | si scende; il minatore dice che rende poco | dal 20 al 23 |

- **Si scrive il massimo della forza** (`zone.forza`): la fascia dipende dal più
  alto fra livello, forza di adesso e forza massima raggiunta
  ([forza.md](forza.md#il-massimo-della-forza)): vendere un'arma non fa
  tornare indietro un colore.

## Nella storia

Le discese in fila, coi colori e la sentinella secondo il livello atteso,
come prima. **Un gradino è il passo fra due discese di fila**: i livelli
attesi 1 · 2 · 3 · 5 · 7 · 8 · 10 · 12 ([la-grande-storia.md](la-grande-storia.md))
sono i gradini da 0 a 7. Due gradini sopra la forza dell'eroe rosso, uno sopra arancio,
due sotto grigio, il resto verde (`coloreNellaStoria`): la scalinata (2) al
livello 1 arancio, la torre (3) rossa, la scala sommersa (7) al 4 rossa e al
5 arancio. Il blocco della storia resta il divieto di sempre; la sentinella
ferma in più chi è molto indietro, e la strada è farsi le ossa dove è verde. `coloreDi` sceglie: fascia se la storia è finita, gradini
se no.

## Il colore e la sentinella

- **La rossa ha la sentinella** davanti all'ingresso, all'angolo dove sta il
  divieto delle chiuse (che non è mai insieme: una chiusa non ha colore): la
  guardia, così non la si scambia con quelle delle missioni. Nel fumetto «Alt! Laggiù
  è troppo pericoloso per te: non ti faccio passare…» e niente «scendo»;
  `avvia` rifiuta lo stesso una discesa rossa.
- **Grigia e arancio dicono, non vietano**: la frase sta nel fumetto con la
  voce del minatore («Il minatore ti ha visto passare»). L'arancio tace nella
  storia se il minatore ha già detto cosa manca con la roba in mano
  ([la-grande-storia.md](la-grande-storia.md#chi-e-sotto-il-livello-lo-sa-prima-di-scendere)).
- **Il fumetto dice la fascia**, «livello 14–17» nel colore (nella storia il
  livello atteso, «livello 3»).
- **L'abisso non ha colore**: resta chiaro, perché un piano dopo
  l'altro passa da grigio a rosso.

## Com'è fatta una zona

`zonaPotenziata(k, L)`: la discesa `k` con la fascia che comincia a L
(`potenza`) e

- **il nome e la dritta del volto** (`voltaDi`), nel fumetto, nel titolo e
  nella carta «riprendi»; sotto il campo «livello 14 · piano 1 di 5»;
- **zone corte**: cinque piani, sei nella grotta che li ha piccoli. La forma
  dei piani, lo scenario, i guardiani e il mostro grosso sono quelli della
  discesa ([grossi.md](grossi.md)); il grosso chiede da 7 a 13 risposte giuste;
- **le domande dell'abisso**: `dif` da 0,92 a 1, in cima alla finestra
  dell'età ([abisso.md](abisso.md#le-domande-smettono-presto-di-salire));
- **il livello del posto è L** (più uno ogni due piani): dice il livello
  del bottino, le gemme e l'esperienza dei mostri ([livelli.md](livelli.md));
- **i mostri del livello L**: gli abitanti e il caporale della discesa ([mostri.md](mostri.md): una zona tiene i suoi per sempre) con
  `forza` = (5,8 + 0,35 · (L − 12)) × la forma e `spinta` = 10 + 1 · (L − 12), a un decimo (`CURVA_DELLE_ZONE`; dal 30 ottobre, quando i comuni sono passati a due o tre
  risposte: [costo-di-vincere.md](costo-di-vincere.md); prima 2,2 + 0,15 e 9,5 + 1,3). In linea retta, mai esponenziali. La forma
  (`FORMA_DELLA_ZONA`) dice quanto gli abitanti sono più comodi o più duri a pari livello: cripta ×1,7, scalinata ×1, torre ×0,9, grotta ×1,4, botola ×0,85, scala
  sommersa ×1,2, miniera ×1,2. Ritarate la sera del 13 ottobre sui branchi grossi ([taratura-branchi.md](taratura-branchi.md); prima forza 4 + 0,6 a livello e spinta 13 + 1,0, forme 2,2 · 0,75 · 0,9 · 1,4 · 0,85 · 0,95 · 1,35).
- **il bottino come nell'abisso** (`indiceDella` dà −1): i forzieri danno un
  pezzo a tono sei volte su dieci, il mostro grosso il suo pezzo col nome e
  un raro del livello.
- **Una zona vinta non tocca la storia** e non scrive niente: le stelle e il
  record di fuori restano quelli delle discese di allora; i contatori del
  bambino (`sotPiani`, `sotMostri`…) salgono come sempre.

## L'esperienza

Una zona verde vinta vale **più o meno un livello**, a ogni altezza.

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
  Finché la sosta c'è, quella discesa è la zona di quando si è scesi, anche
  se intanto l'eroe l'ha superata (`potenzaDi`).
- **`zone` nell'avventura è `{ forza }`**, il massimo della forza raggiunta. Un salvataggio senza `forza` vale come
  «il livello dell'eroe». Niente da azzerare, `MONDO` resta 4; una sosta vecchia con la sua potenza si riprende uguale.

## Le misure

`misure/sotterraneo`, otto storie del **curioso** per zona e per eroe (`misuraLeZoneDelCurioso`, [giocatori-tipo.md](giocatori-tipo.md)): la roba e le pozioni
dell'ingresso della sua ultima discesa, il livello rifatto all'inizio della fascia (la verde più dura) con i punti dati come li dà il banco, la spesa con le gemme che ha.
Una zona troppo dura per lui va bene («uno esce, si ricarica o fa altre zone»): i bersagli sono la misura del 15 ottobre arrotondata al 5%, e si segnala solo ciò che è
fuori scala. Vinte in media fra le sette zone e i quattro eroi, a 9/10 · 6/10, e livelli presi:

| fascia | a 9/10 | a 6/10 | forza di ingresso | livelli presi | bersaglio (9/10 almeno · 6/10 al più) |
|---|---|---|---|---|---|
| 12–15 | 76% | 40% | 10,4 | 3,1 | 75 · 45% |
| 16–19 | 69% | 25% | 13,0 | 2,9 | 65 · 25% |
| 20–23 | 57% | 16% | 14,7 | 2,7 | 55 · 20% |
| 24–27 | 51% | 11% | 16,4 | 2,5 | 50 · 15% |
| 30–33 | 48% | 12% | 21,0 | 2,4 | 45 · 15% |

- **L'esperienza** di una zona vinta: fra 0,8 e 3,5 livelli (prima 0,8–2 per il dritto; il curioso gira tutto e ne prende di più).
- **Il colore** è quello del gioco, non una cifra: `coloreDellaFascia(da, forza)` sulla forza di `forzaDi` (forza.js) del curioso a quel livello, a punti
  dati. La sua forza resta 1–4 livelli sotto il livello (la roba non è al passo), quindi su una fascia 16–19 l'eroe del 11 e del 12 è rosso o arancio (26 · 6 storie su 32),
  del 15 per lo più rosso e arancio, del 16 arancio, del 20 arancio: il verde e il grigio non si vedono. Vinte a 9/10 con l'eroe del 11 · 12 · 15 · 16 · 20: 20 · 22 · 53 · 69 · 86%;
  a 6/10 4 · 5 · 18 · 25 · 60%. Bersagli: rosso e arancio duro ≤ 25% a 9/10 e ≤ 10% a 6/10, l'arancio facile fra 45 e 60%, il 16 almeno 65%, il 20 almeno 80% (a 6/10 55%), e più si è
  avanti più si vince.
- **Fuori scala** non ce n'è: la zona più dura è la cantine al 30 (25% a 9/10, 0% a 6/10) contro l'altare 84% e il fondo 56%, ma a 9/10 si vince ancora una volta su quattro.

Nei test: `unita/sotterraneo-forza` (la forza: [forza.md](forza.md#nei-test)),
`unita/sotterraneo-zone` (i colori con gli esempi qui sopra, i gradini della storia, la sosta che tiene la potenza, com'è fatta una
zona e il suo grosso, la sosta che la rifà col suo volto, la curva oltre il 12, un quarto nelle grigie, una torre verde vinta che
vale più o meno un livello), `misure/sotterraneo` (le tabelle qui sopra), `integrazione/sotterraneo-zone` (col dito: i colori e la
sentinella nella storia, la verde «livello 12–15», giù nella torre, la sosta con la potenza). Sul fumetto di una discesa
`[data-livello-zona]` con `data-livello`, `data-fascia` («12-15») e `data-colore` (`grigio`, `verde`, `arancio`, `rosso`),
`[data-detto-colore]` e `[data-ferma]`; la sentinella è una persona del mondo, `sentinella:<dungeon>`.
