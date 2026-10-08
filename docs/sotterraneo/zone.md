# Le zone che si potenziano

Finita la storia, per trovare mostri all'altezza bisognava riscendere
decine di piani nell'abisso: *«è noioso dover riscendere 30 livelli per
trovare qualcuno di decente»* (l'utente, 8 ottobre 2026). Adesso le sette
discese della storia sono **zone corte** che, una alla volta, **si
potenziano al livello dell'eroe**: il minatore lo racconta, si scende, si
batte il mostro grosso in fondo (potenziato), si risale, e se ne sveglia
un'altra. *«Una volta che ruotiamo la cosa siamo a posto.»* Il pallino
davanti a ogni discesa dice, col colore, quanto è forte per l'eroe; davanti
a una troppo forte sta una sentinella che non fa passare.

Il codice: `dati/zone.js` (l'ordine, i nomi e gli annunci, la forma, quanto
picchiano, le frasi dei colori), `motore/zone.js` (quale zona è sveglia, a
che livello, i gradini e i colori, la roba attesa oltre la storia),
`motore/banco.js` (`misuraLeZone`), `Gioco.vue` (le tappe col colore,
l'annuncio, la zona vinta), `viste/Terra.vue` (il pallino, la sentinella, il
fumetto, il «!» del minatore), `motore/dialoghi.js` (l'annuncio nel dialogo
del minatore), `viste/pixel.js` (`SENTINELLA`).

## Le zone

Le zone sono le sette discese della storia, nello stesso posto della mappa
e con la stessa chiave (le missioni, il mostro grosso e il pallino la
leggono). Si svegliano in quest'ordine (`ORDINE_DELLE_ZONE`), poi si
ricomincia:

| | zona potenziata | discesa | scenario | piani | in fondo |
|---|---|---|---|---|---|
| 1 | La scalinata degli orchi | la scalinata antica | cantine | 5 | Grumo |
| 2 | La grotta delle ragnatele | la grotta della scaletta | cantine | 6 | Zannaverde |
| 3 | Il labirinto del Minotto | la botola segreta | cantine | 5 | Minotto |
| 4 | La torre infernale | la torre in rovina | fornace | 5 | Fiammetta |
| 5 | La miniera infestata | la miniera abbandonata | fornace | 5 | Carbonchio |
| 6 | La cisterna nera | la scala sommersa | cripta | 5 | Gorgo |
| 7 | La cripta profanata | la cripta dell'altare | cripta | 5 | Re Ossuto |

- **Lo scenario resta fisso per qualche zona di fila**: le cantine per le
  prime tre, la fornace (la roccia della miniera) per le due dopo, la cripta
  per le ultime. È l'ordine del giro a raggrupparle; le discese della storia
  restano com'erano (mai lo stesso scenario due volte di fila, ognuna col suo).
- **Zone corte, non una discesa senza fondo**: cinque piani, sei nella
  grotta che li ha piccoli. Nessuno scenario nuovo: la forma dei piani, i
  guardiani e il mostro grosso sono quelli della discesa.

## Quale zona, quando, a che livello

Lo stato sta nell'avventura (`zone: { n, livelli, sentita }`,
[avventure.md](avventure.md)); `svegliaDi` lo legge.

- **La prima si sveglia da sé quando la storia è finita** (`libera`): `n`
  manca e vale 1. Prima non si potenzia niente.
- **La zona sveglia è al livello dell'eroe, finché non ci si scende**: se
  l'eroe sale (nell'abisso, in un'altra zona) la zona sale con lui, così è
  sempre verde. Scesi dentro, il livello è quello scritto nella sosta
  (`potenza`): una zona lasciata a metà non cresce mentre si fa la spesa.
- **Vinta la zona sveglia** (`vintaLaZona`), il suo livello resta in
  `livelli`, `n` sale e la zona dopo nel giro va raccontata (`sentita:
  false`). Rifare una zona vinta prima non sveglia niente.
- **Una zona vinta resta potenziata al livello di allora**: rifarla dà i
  mostri e il bottino di quel livello, e col tempo diventa grigia. Quando il
  giro torna a lei si sveglia di nuovo, al livello di adesso. Una discesa
  mai potenziata resta quella della storia, coi suoi piani e i suoi numeri.
- **Una zona vinta non tocca la storia**: le stelle e il record di fuori
  restano quelli delle discese di allora (medaglie ed esperienza dell'app
  li leggono). I contatori del bambino (`sotPiani`, `sotMostri`…) salgono
  come sempre.

## Com'è fatta una zona potenziata

`zonaPotenziata(k, L)`: la discesa `k` con `potenza: L` e

- **il nome e la dritta suoi** (`POTENZIATE`), nel fumetto, nel titolo e
  nella carta «riprendi»; sotto il campo «livello 14 · piano 1 di 5»;
- **le domande dell'abisso**: `dif` da 0,92 a 1, in cima alla finestra
  dell'età ([abisso.md](abisso.md#le-domande-smettono-presto-di-salire));
- **il livello del posto è L** (più uno ogni due piani): dice il livello
  del bottino, le gemme e l'esperienza dei mostri ([livelli.md](livelli.md));
- **i mostri del livello**: `forza` = (4 + 0,5 · (L − 12)) × la forma,
  `spinta` = 15 + 0,65 · (L − 12), arrotondata. In linea retta, mai
  esponenziali. La forma (`FORMA_DELLA_ZONA`) corregge le zone che a pari
  livello vengono più comode o più dure: la cripta, piccola, ×1,6; la torre
  ×1,05; la scala sommersa, la botola e la miniera ×0,9;
- **il bottino come nell'abisso** (`indiceDella` dà −1): il pezzo della riga
  la storia l'ha già dato, i forzieri danno un pezzo a tono sei volte su
  dieci, il mostro grosso il suo pezzo col nome e un raro del livello.
- Il mostro grosso potenziato chiede da 7 a 13 risposte giuste (Re Ossuto
  del 12 sette, Gorgo del 20 tredici), come quelli della storia.

## L'annuncio

Il vecchio minatore, che nella storia indica la prossima discesa, finita la
storia la apre il suo dialogo ([dialoghi.md](dialoghi.md)) raccontando la
zona sveglia (`annuncio` in `POTENZIATE`, con in coda «Adesso laggiù è tutto
alla tua altezza.»), poi dice la strada; «cosa c'è laggiù» dice il suo
mostro grosso (`strada` e `laggiuDalMinatore` in `motore/dialoghi.js`, con
`annuncio` nel `ctx`). Finché non l'ha raccontata ha il «!» d'oro sopra la
testa e la riga in fondo dice «Il minatore ha una notizia: vai a
sentirla.»; appena gli si parla l'avventura segna `sentita` e il «!» si
spegne. Il pallino della zona sveglia pulsa, come quello della prossima
discesa nella storia.

## Il pallino e la sentinella

**Un gradino è il passo fra due discese di fila della storia**: i livelli
attesi 1 · 2 · 3 · 5 · 7 · 8 · 10 · 12 ([la-grande-storia.md](la-grande-storia.md))
sono i gradini da 0 a 7, e oltre il 12 se ne sale uno ogni due livelli
(`PASSO_OLTRE`). Il livello di una discesa è la sua potenza, o quello atteso
nella storia. Il colore dice quanti gradini stanno fra la discesa e l'eroe
(`coloreDi`):

| colore | discesa − eroe | cosa succede | esempi |
|---|---|---|---|
| rosso | due gradini sopra, o più | la sentinella non fa scendere | la torre (3) al livello 1; una zona del 16 al 12 |
| arancio | un gradino sopra | si scende; il minatore dice che sono più forti | la scalinata (2) al livello 1; la scala sommersa (7) al 5; una zona del 16 al 14 |
| verde | uno sotto, pari | niente da dire | la miniera (10) al 12; la zona sveglia |
| grigio | due gradini sotto, o più | si scende; il minatore dice che non c'è niente alla sua altezza | la botola (8) al 12; una zona del 16 al 20 |

- **La rossa ha la sentinella** davanti all'ingresso, all'angolo dove sta
  il divieto delle chiuse (che non è mai insieme: una chiusa non ha
  pallino): la guardia della torre in ferro scuro e mantello nero, disegnata
  in codice, così non la si scambia con quella delle missioni. Nel fumetto
  «Alt! Laggiù è troppo pericoloso per te: non ti faccio passare…» e niente
  «scendo»; `avvia` rifiuta lo stesso una discesa rossa.
- **Vale anche nella storia**: il blocco della storia (la discesa dopo si
  apre finendo quella prima) resta il divieto di sempre, e la sentinella
  ferma in più chi è due gradini sotto. Con la fila misurata
  ([livelli.md](livelli.md#le-misure)) non capita a chi va avanti;
  capita a chi è rimasto molto indietro, e la strada è farsi le ossa dove
  il pallino è verde.
- **Grigia e arancio dicono, non vietano**: la frase sta nel fumetto con la
  voce del minatore («Il minatore ti ha visto passare»). L'arancio tace se
  il minatore ha già detto cosa manca con la roba in mano
  ([la-grande-storia.md](la-grande-storia.md#chi-e-sotto-il-livello-lo-sa-prima-di-scendere)).
- **Dopo la storia il rosso e l'arancio non si vedono quasi mai**: la zona
  sveglia segue l'eroe e quelle vinte stanno sotto. Restano per chi cambia
  eroe e per la storia.
- **L'abisso non ha colore**: il pallino resta chiaro, perché un piano dopo
  l'altro passa da grigio a rosso.

## L'abisso

Resta com'è, e resta la sfida del primato: il fondo nell'avventura, il
primato `sotFondo`, il traguardo «Giù per il buco» e la riga della home non
cambiano ([abisso.md](abisso.md)). Non è più il posto dove farsi le ossa
dopo la storia: lo sono le zone. Toglierlo avrebbe tolto un record che i
bambini hanno; ritararlo coi livelli è un altro lavoro.

## La sosta e i salvataggi

- **La sosta scrive `potenza`** (`scrivi` in `motore/sosta.js`) e rientrando
  `zonaDi(tappa, potenza)` rifà la stessa zona dal seme: il portale, la ✕ e
  «riprendi da qui» funzionano come nelle altre discese
  ([../core/ripresa.md](../core/ripresa.md), [portale-e-sosta.md](portale-e-sosta.md)).
  Una sosta senza `potenza` è la discesa della storia: `VERSIONE` non sale.
- **`zone` è un campo nuovo dell'avventura, che manca a tutte**: mancante
  vale «la prima zona, da raccontare». Niente da azzerare, `MONDO` resta 4.

## Le misure

`misure/sotterraneo`, dieci semi per zona e per eroe, dritti alla scala, con
la roba attesa al livello (`robaAttesaA`: quella con cui si esce dalla
storia coi pezzi rifatti a L − 1, le pozioni dell'abisso) e la crescita
attesa. Vinte, in media fra i quattro eroi, nell'ordine della storia
(cripta, scalinata, torre, grotta, sommersa, botola, miniera):

| | a 8/10 | a 6/10 | a 4/10 |
|---|---|---|---|
| zone al 12 | 98–100% | 57 · 60 · 75 · 80 · 63 · 63 · 63% | 0–15% |
| zone al 16 | 98–100% | 78 · 55 · 57 · 68 · 68 · 48 · 78% | 0–18% |
| zone al 20 | 100% | 75 · 78 · 70 · 70 · 75 · 70 · 75% | 0–23% |

E i colori, su una zona del 16 (a 8/10 · a 6/10):

| eroe | colore | vinte |
|---|---|---|
| del 12 | rosso | 57% · 1% |
| del 14 | arancio | 83% · 9% |
| del 16 | verde | 100% · 65% |
| del 20 | grigio | 100% · 100% (a 4/10 61%) |

- **Come una discesa della storia**: a otto sempre, a sei due volte su tre,
  a quattro di rado. Provato: `forza` 7 e `spinta` 13 al 12, i mostri delle
  ultime discese: a sei si vinceva una volta su dieci, e servivano cento
  domande. Le ossa allungano, l'attacco indurisce: la zona sta sull'attacco.
- **Le domande per zona** (a 8/10): al 12 da 46 (la cripta) a 71, al 20 da
  65 a 102. Oltre le 85 di una seduta la zona si fa in due sere, con la sosta.
- **L'esperienza**: una zona al 12 vale 2,3 livelli, al 14 0,9, al 16 0,4, al
  20 0,15, al 25 0,08. È il cubo oltre il 12 delle soglie
  ([livelli.md](livelli.md#le-soglie)), messo per l'abisso: dal 18 in su
  l'eroe sale piano, e le zone con lui.

Nei test: `unita/sotterraneo-zone` (il giro, quando e a che livello, la
sosta che tiene il livello, la zona vinta, com'è fatta una zona e il suo
grosso, la sosta che la rifà uguale e la carta «riprendi», i gradini e i
colori con gli esempi qui sopra, la roba attesa), `misure/sotterraneo` (le
tabelle qui sopra), `integrazione/sotterraneo-zone` (col dito: i colori e la
sentinella nella storia, il «!» e l'annuncio, le grigie, la zona sveglia e
giù a livello 14, la sosta con la potenza). Sul pallino
`[data-pallino][data-colore]` (`grigio`, `verde`, `arancio`, `rosso`), la
sentinella `[data-guardia="<posto>"]`; nel fumetto `[data-livello-zona]` con
`data-livello` e `data-colore`, `[data-detto-colore]` e `[data-ferma]`; il
«!» del minatore `[data-segno-di="annuncio"]`, nel suo dialogo `[data-annuncio]`; sotto il campo
`.sot-piede[data-livello-posto]`.
