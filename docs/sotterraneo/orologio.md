# L'orologio a passi, il mana che torna camminando e gli incanti preparati

13 ottobre 2026. Tre decisioni dell'utente, una dentro l'altra: **il tempo del sotterraneo si conta in passi dell'eroe**; **il mana
torna camminando**; **le abilità che proteggono si lanciano anche prima dello scontro**. Il perché dell'ultima, con le sue parole: «se
ogni scontro parto da 0 senza buff gli scudi hanno poco senso, perché li attivi solo contro il mega boss». Il codice:
`motore/orologio.js` (i passi, il mana), `motore/preparati.js` (gli incanti), `dati/mondo.js` (`PASSI_PER_TURNO`, `MANA_PER_PASSO`),
`dati/abilita.js` (`preparabile`), `motore/scontro.js`, `motore/sosta.js`, `viste/Preparati.vue`, `viste/BarraDiSotto.vue`,
`viste/campo.js`. Il mana per risposta giusta, i costi e il bastone: [abilita-energia.md](abilita-energia.md).

## L'orologio

- **Un passo è una cella percorsa** (`Corsa.passi`, e `camminati` per quelle davvero camminate: il banco le conta). Fermo, in pausa o
  sotto una domanda il tempo non scorre: un bambino che si ferma a leggere e a pensare non lo paga, ed è la ragione per cui non c'è
  un orologio a secondi (come per la torcia, [roba.md](roba.md#la-torcia-si-accende-da-sé-e-finisce)). **La torcia resta a stanze.**
- **Un turno dell'eroe nello scontro vale `PASSI_PER_TURNO` = 5 passi** (circa un secondo di cammino: `PASSO_EROE` è 5,4 celle al
  secondo), pagati dopo i colpi dei mostri, quando tocca di nuovo a lui: una protezione che dura un turno copre la risposta dei mostri
  a quel turno. Cinque perché un incantesimo preparato regga l'inizio di uno scontro e lì si consumi: quaranta passi sono otto turni.
- **Un turno non dà mana**: i passi dello scontro fanno invecchiare gli incanti ma la ricarica dentro lo scontro resta quella delle
  risposte giuste (e del bastone), o tutte le misure di prima si sposterebbero (`unita/sotterraneo-strade` la tiene ferma).
- **Si salva con la discesa** (`passi`, `mana`, `preparati` in `motore/sosta.js`, senza alzare `VERSIONE`): una sosta di prima senza
  quei campi si rilegge da zero, e un incanto storto (nodo che non esiste, che l'eroe non sa più, passi a zero) si butta.
  Uscire a metà non butta la partita ([../core/ripresa.md](../core/ripresa.md)). Svenire porta via gli incanti addosso.

## Quanti passi fa un piano

Misurato con strumenti che si rifanno: `npm run pianta -- --passi --semi 1-20` (le celle minime, a quattro direzioni: «dritto» è
dall'ingresso a chi ha la chiave e da lui alla scala, «giro» tutte le stanze una dopo l'altra poi la chiave e la scala; `--zona 20`,
`--per-piano`) e `npm run sotterraneo -- --passi` (i passi che il giocatore finto fa davvero, con le deviazioni e gli scontri, a 8/10).

| discesa | piani | stanze | dritto (minimo) | giro (minimo) | giro, il più lungo | banco: dritto | banco: giro |
|---|---|---|---|---|---|---|---|
| altare | 2 | 4 | 33 | 78 | 131 | 62 | 93 |
| cantine | 2 | 16 | 71 | 275 | 417 | 147 | 251 |
| torre | 3 | 8 | 53 | 148 | 269 | 134 | 171 |
| grotta | 5 | 4 | 29 | 70 | 144 | 68 | 90 |
| scala sommersa | 3 | 8 | 72 | 164 | 358 | 158 | 218 |
| botola | 3 | 16 | 77 | 317 | 477 | 144 | 364 |
| miniera | 4 | 8 | 55 | 159 | 276 | 119 | 205 |
| **tutte** | | 8,5 | **54** | **163** | | | |

Passi **per piano**. Una discesa intera, andando dritti, sono da 66 (altare) a 231 (botola) passi minimi, e il banco ne fa da 124 a 451
(girando tutto, da 179 a 701). Le zone dopo la storia hanno piani uguali ma cinque a discesa (`--zona 20`: 55 dritto, 171 il giro).
**Un piano è più piccolo di quanto si pensava**: non cinquecento passi, ma centosessanta se lo giri tutto, e un bambino che gira a
occhio ne fa forse il doppio.

## Il mana torna camminando

**A ogni passo torna `MANA_PER_PASSO` = 0,1% del globo massimo, uguale per tutte le classi** (`ricaricaCamminando`): l'intelligenza conta
già alzando il globo, e il mago, che ne ha di più, ne ritrova di più nello stesso cammino. **Mille passi, tre minuti di cammino, lo
riempiono** (il bersaglio dell'utente); il resto che non fa ancora un punto intero passa al passo dopo (il cavaliere, globo 10, ne
guadagna uno ogni cento passi; il mago, 28, uno ogni trentasei), e a globo pieno si butta.

| | cavaliere | elfa | mago | nano |
|---|---|---|---|---|
| globo di un eroe al livello 8 | 10 | 13 | 28 | 10 |
| passi per un punto | 100 | 77 | 36 | 100 |
| mana in un piano girato (banco, 90–364 passi, in media 200) | 2 | 2,6 | 5,6 | 2 |

**Il secondo numero dell'utente non torna con la misura.** Voleva che «un piano girato tutto» ne ridasse circa metà, ma un piano girato
è 160 passi (al banco 200, a un bambino forse 300–400): a 0,1% a passo ne dà **un quinto**, fino a un terzo. Per la metà servirebbe
0,25% a passo (il globo pieno in 400 passi, un minuto e un quarto). Si è tenuto il bersaglio dei tre minuti: la lamentela da cui nasce è
che il globo era sempre pieno, e una ricarica più veloce ricomincerebbe da lì. **Una manopola sola**: `MANA_PER_PASSO` in `dati/mondo.js`.

La regola regge perché il freno vero è il costo delle abilità, già alzato (l'ultima riga costa quasi tutto il globo: [abilita-energia.md](abilita-energia.md)):
camminare ridà mana fra uno scontro e l'altro, non lo regala dentro. Resta la ricarica con le risposte giuste nello scontro, quella del
bastone e la pozione blu. **La forza** ([forza.md](forza.md)) non è stata ritoccata: conta ancora i due terzi del globo.

## Gli incanti preparati

Alcune abilità che proteggono si lanciano anche **dal campo**, pagando l'energia di sempre (`costoDi`), e restano addosso un numero di
passi (`preparabile` sul nodo, un numero per grado). **Lo scontro comincia con loro già attive**, anche l'agguato. **Il prezzo vero: il
mana speso prima non c'è durante**, e camminare fino al mostro ne consuma i passi. Nello scontro l'abilità funziona come sempre.

| classe | abilità (ramo, riga) | cosa fa preparata | costo | passi (gradi 1·2·3) |
|---|---|---|---|---|
| cavaliere | Scudo alzato (Scudo, 0) | i colpi presi fanno metà | 3 | 40 · 50 · 60 |
| | Fortezza (Scudo, 3) | lo stesso, più a lungo (la cura resta nello scontro) | 5 | 50 · 60 · 70 |
| | Ruggito (Furia, 2) | i mostri partono facendo metà danno per i suoi turni | 4 | 40 · 50 · 60 |
| | Grido di guerra (Giuramento, 3) | lo stesso, per più turni (senza il colpo) | 5 | 40 · 50 · 60 |
| elfa | Rovi (Bosco, 0) | il primo mostro parte facendo metà danno | 4 | 40 · 50 · 60 |
| | Linfa (Bosco, 1) | guarisce un decimo della vita a ogni turno di scontro, al più quanti dice il nodo (senza la cura subito) | 4 | 50 · 60 · 70 |
| mago | Scudo arcano (Arcano, 0) | una barriera che para i danni, finché regge | 4 | 40 · 50 · 60 |
| | Specchio (Arcano, 4) | il primo colpo preso torna al mostro | 40 | 60 · 70 · 80 |
| nano | Pelle di pietra (Pietra, 0) | una barriera che para i danni | 3 | 40 · 50 · 60 |
| | Montagna (Pietra, 4) | nessun colpo ferisce, a lungo quanto i passi (corti: 25 · 30 · 35) | 10 | 25 · 30 · 35 |

I costi sono quelli del grado 1 al livello del nodo (`costoAl`). **Mai le cure** (Preghiera, Fonte arcana, Rune): curarsi fuori
resta alle pozioni e alle fonti, o la ricarica camminando le renderebbe una vita regalata. Non si prepara chi colpisce (la Danza
delle lame ha anche una parata ma è un attacco), né le passive.

- **Un solo incanto per abilità**: lanciarlo di nuovo mentre è «in forze» (più della metà dei suoi passi) dice «ce l'hai già» e non
  costa; con pochi passi addosso si rinnova.
- **Rovi, Ruggito e Grido partono con lo scontro e si consumano** (`apriConIPreparati`: il debole sui mostri in campo, o solo su chi ha
  aperto lo scontro; un mostro che non si gela lo rifiuta come sempre); gli altri restano addosso e calano di cinque passi a turno.
- **Le difese si sommano a quelle dello scontro**: la barriera preparata para per prima, e quando è esaurita se ne va (`assorbiConIPreparati`);
  parato e invulnerabilità valgono finché ci sono i passi; lo specchio al primo colpo preso.
- **L'avviso «in arrivo ti toglie N»** (e lo stop del pericolo, [pericolo.md](pericolo.md)) sottrae la barriera che l'eroe ha addosso, preparata o dello scontro: dice quanto toglie davvero.
- **Chi non ha l'arma non prepara** (Scudo alzato e Fortezza vogliono lo scudo in mano): la riga dice cosa manca.

## Come si vede e come si lancia

- **Dalla casella degli incanti** della barra ([barra.md](barra.md); non più dal globo blu, che apre l'albero): toccandola si apre la
  scelta delle preparabili (`Preparati.vue`, nella cornice col ✕, chiusa anche da un tocco fuori): una riga per abilità, col costo, cosa fa coi numeri veri, quanti passi dura, e perché no («ti manca energia», «serve lo
  scudo», «ce l'hai già»). Un tocco lancia (i primi 320 ms il tocco non conta). In fondo **«L'albero delle abilità»**, col «+» d'oro dei
  punti da imparare: l'albero resta a un tocco, e dalla finestra dell'eroe. La casella c'è sempre: chi non sa nessuna preparabile trova
  la finestra che lo dice e porta all'albero, e sopra (dove non si prepara) dice che si preparano giù. Non c'è una barra nuova
  ([../core/interfaccia.md](../core/interfaccia.md)).
- **Addosso**: una pastiglia per incanto sopra il globo blu (il glifo col colore del suo ramo e i passi, che scendono camminando; la
  barretta sotto si accorcia, agli ultimi dieci passi lampeggia), da toccare come la casella (apre la stessa scelta); la casella dice «addosso/che ne sai». Nello scontro le stesse pastiglie sotto il
  palco (col testo e i passi), la barriera e la parata disegnate sull'eroe come sempre, e sul primo turno dell'eroe nella fila l'incanto
  che finisce prima, coi suoi passi. Nell'albero il riquadro di un nodo dice «si può preparare» e per quanti passi.
- **Il giocatore finto** (`motore/banco.js`): prima di andare incontro a un mostro (la chiave, o quello che ha scelto) si avvicina a venti celle,
  lancia tutto quello che può pagare lasciando il 40% del globo, e arriva (`RISERVA_PREPARATI`, `MARGINE_PREPARATI`; `--senza-preparati` lo spegne).

## Cosa cambia ai numeri

Vittorie a 8/10 · 6/10 · 4/10, il banco (`npm run sotterraneo -- --strada tutte --sintesi --livelli 3,5,8 --semi 40 --contro 9773c4cb`), media delle
sette discese. Prima, solo il mana camminando, tutto insieme (a +5 livelli):

| strada | prima | solo il mana | mana e incanti |
|---|---|---|---|
| cavaliere: baluardo | 79 · 62 · 34 | 81 · 63 · 35 | **81 · 65 · 38** |
| cavaliere: spadone | 71 · 53 · 25 | 73 · 54 · 26 | 73 · 54 · 26 |
| cavaliere: paladino | 78 · 53 · 24 | 82 · 56 · 25 | 83 · 56 · 24 |
| elfa: arciera | 98 · 80 · 52 | 99 · 82 · 55 | 99 · 81 · 53 |
| elfa: lama leggera | 98 · 81 · 51 | 98 · 81 · 56 | 98 · 81 · 54 |
| elfa: Luna | 95 · 70 · 34 | 95 · 75 · 34 | 96 · 74 · 36 |
| mago: guerriero | 38 · 23 · 8 | 43 · 23 · 8 | **46 · 30 · 16** |
| mago: bacchetta | 39 · 26 · 9 | 49 · 28 · 10 | **49 · 31 · 17** |
| mago: pura magia | 48 · 30 · 15 | 57 · 37 · 16 | **60 · 39 · 21** |
| nano: difensore | 90 · 74 · 42 | 91 · 74 · 43 | **93 · 77 · 47** |
| nano: ascia doppia | 81 · 62 · 39 | 83 · 65 · 40 | 83 · 65 · 40 |
| nano: runico | 88 · 73 · 40 | 94 · 75 · 41 | 92 · 76 · 43 |

**Il mana camminando aiuta il mago** (il globo più grande, le abilità più care: +5…+10 punti a 8/10) e poco gli altri; **gli incanti
valgono qualche punto in più** dove la strada li impara (baluardo, nano difensore, i tre maghi) e nulla dove non ci sono (spadone,
ascia doppia: nessuna preparabile nei loro rami). Nessuna classe cala. Le strade restano entro venti punti dentro la classe a 6/10
(`misure/sotterraneo-strade`). A +3 e +8 la forma è la stessa (baluardo 47→57 a 8/10 a +3, il mago pura 28→38; a +8 le classi che non sono il mago stanno sopra il 90 a 8/10). Il banco del cavaliere di storia, con la sua strada (che non impara nessuna preparabile), cambia solo per il mana.

Per tenere verde `unita/sotterraneo-zone` si è allentato di un passo il tetto dei livelli che dà una zona verde vinta (da 2 a 2,2: a +1 seme vinto, 2,02): la taratura che segue lo riporta.

Le quattro unità rosse per bilancio (`sotterraneo`, `sotterraneo-abisso`, `sotterraneo-roba`, `sotterraneo-sosta`: i branchi sono
raddoppiati, e la taratura unica viene dopo) restano rosse e non ne nascono altre: cambiano di qualche cella dentro lo stesso file.

## Cosa non è fatto

- **I gradi dell'incanto non cambiano cosa fa**, solo quanto dura (e la barriera, la linfa): la parata dimezza sempre.
- **Dal campo non si cura**: una cura preparabile andrebbe pensata con la ricarica camminando (resta aperto).
- **Il passo dei mostri** non conta nell'orologio: solo l'eroe.

Nei test: `unita/sotterraneo-orologio` (i passi dell'eroe e che fermo non scorrono, la quota di mana uguale per tutti e mille passi
che lo riempiono, il resto, i turni che non danno mana, lanciare dal campo e il «ce l'hai già», la barriera, la parata, Montagna,
lo specchio, la linfa, i debuff di apertura, la sosta e quella vecchia, lo svenimento). `integrazione/sotterraneo-incanti` (col dito: la casella apre la scelta e il globo l'albero, lanciare paga e mette la pastiglia, «ce l'hai già», l'albero a un tocco col riquadro «si può preparare», lo scontro con la barriera, la pastiglia e il badge nella fila). Dei bersagli: `[data-incanti]` con
`[data-incanto="<id>"][data-passi]` sopra il globo blu; la casella `[data-azione="incanti"]` (`data-n`, `data-preparabili`); `[data-preparati]` (con `[data-prep-sopra]` o `[data-prep-nessuno]` se non c'è niente da scegliere) con `[data-azione="prepara-campo"][data-abilita="<id>"]`
(`data-addosso` coi passi che ha), `[data-azione="apri-albero"]`; nello scontro `[data-stati-eroe] [data-preparato][data-passi]` e
`[data-incanto-fila]`; nell'albero `[data-preparabile]`. Un cheat per guardarli: `#sotterraneo=1&eroe=mago&giu=2&preparati=1`
([../core/comandi.md](../core/comandi.md)).
