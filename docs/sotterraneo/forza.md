# La forza dell'eroe

Il colore delle discese (grigio, verde, arancio, rosso, e la sentinella sulla
rossa) confrontava solo il **livello** dell'eroe con la fascia della zona, e i
mostri sono tarati sulla roba *attesa*, senza abilità: un bambino con roba
buona e abilità forti abbatteva tutto con un colpo anche nelle verdi.
L'utente, 12 ottobre 2026: *«un calcolo che tenga conto dei danni medi che
può fare questo personaggio, equipaggiato come è equipaggiato in quel
momento, considerando di usare almeno 2 abilità forti a scontro; su quello
basiamo la difficoltà del dungeon; può darsi dovremo ruotare più
rapidamente i dungeon e si ritroverà prima in dungeon difficili, ma è
corretto»*, e *«va calcolata a run-time, è più una formula da creare che un
algoritmo»*. Quindi: una formula sui numeri veri, nessuna partita finta.

Il codice: `motore/forza.js` (la formula, per tutti i pezzi), `motore/zone.js`
(`rinascitaDi`, `zoneConForza`, i colori che prendono la forza), `Gioco.vue`
(`forzaOra`, il watch che scrive il massimo), `motore/corsa.js` (la grigia che
dà un quarto), `viste/PaginaEroe.vue` (la riga «Forza N»).

## La regola

**Il livello di forza è il più alto livello L tale che l'eroe, così com'è
vestito e con le abilità che sa, regge i mostri di L almeno quanto l'eroe che
il gioco si aspetta a L.** Un eroe mal vestito vale meno del suo livello, uno
ben vestito vale di più; 1 se non regge nemmeno il primo livello. I colori
delle discese si leggono da lì; il livello vero resta per tutto il resto
(esperienza, requisiti delle armi, punti, livello dei drop, cure).

## La formula, in parole

Tutto in `motore/forza.js`, sul `Corredo` (un eroe vero, una `Corsa`, o un
eroe atteso). Niente caso: due chiamate danno lo stesso numero.

1. **Il mostro di riferimento a L** (`mostroDiRiferimento`): uno scheletro al
   terzo piano di una zona di livello L, con le formule con cui le zone fanno
   i loro mostri: `forza` sulle ossa e `spinta` sull'attacco
   («Com'è fatta una zona» in [zone.md](zone.md)). Dal 12 sono le formule delle
   zone; sotto, le discese della storia, ognuna al livello con cui ci si entra,
   e fra una e l'altra in linea retta. Le ossa non scendono mai col livello
   (la botola e la miniera hanno una «forma» più dura, e un livello più su non
   ha mostri più molli).
2. **L'offesa** (`offesa`): il colpo come lo conta `Corsa.colpo` (attacco meno
   difesa, le percentuali dei nodi «sempre» come Filo affilato, il fuoco dei
   pezzi). Poi le **due abilità forti a scontro**: fra quelle nelle caselle
   (o, se le caselle sono vuote, fra quelle che sa) che hanno l'arma che
   vogliono in mano, le due che tolgono di più, ognuna una volta. Un'abilità
   toglie il colpo × `per` (`capi` non conta: il riferimento non è un capo), più
   il veleno, che brucia metà del colpo solito per i suoi turni; Affondo e
   Spaccaroccia (`rompe`) tolgono la difesa ai colpi dopo; `passa` è un numero
   da 0 a 1 (`true` vale 1) e dice quanta difesa non conta. Un'abilità che non
   toglie più di un colpo solito non è «forte» e non si conta. Le ossa meno quello
   che fanno le due abilità, diviso il colpo solito, sono le altre risposte
   giuste. Le **risposte giuste** per abbatterlo, divise per le risposte che si
   azzeccano (8 su 10, il «patto» delle misure) sono i **turni** (`TTK`).
3. **La resistenza** (`resistenza`): la vita con la roba (`vitaConLaRoba`, senza
   la vita dei piani) più una cura o uno scudo (`riparo`): la migliore fra
   quelle che l'eroe ha in casella, una sola, col conto di `inVita` come
   `usaAbilita`. Contro il danno che il mostro fa (`dannoPerTurno`): il suo
   colpo, `COLPO_DEL_MOSTRO` × (attacco − difesa) almeno 1, qualunque sia la
   risposta ([scontro.md](scontro.md)), ridotto dalla Parata e dalla schivata, e per i primi dimezzato
   dalla Testa dura; i suoi turni sono quelli che la sua velocità gli dà mentre
   l'eroe, con la sua (10 più la destrezza), gioca i `turni` che gli servono.
   Il tempo per cadere è `resistenza / danno a turno` (`TTD`).
4. **Il rapporto** `R = TTD / TTK`: quanti mostri così regge per ogni mostro
   che ci mette a battere.
5. **L'eroe atteso a L** (`eroeAtteso`): la roba con cui il gioco lo aspetta e la
   crescita come la dà il banco, **senza abilità** (è così che i mostri sono
   tarati). Nella storia la roba con cui si entra nella discesa del livello atteso
   (`robaAttesa`, `LIVELLI_ATTESI`), dal 12 `robaAttesaA` e `crescitaAttesaA`
   («Oltre la storia» in [zone.md](zone.md)).
6. **Il livello di forza** (`livelloDiForza`): si sale da 2 e si tiene il più alto L
   con `R(eroe, L) ≥ R(eroe atteso a L, L)`; si smette quando `R(eroe, L)` scende
   sotto 1 (non regge nemmeno un mostro: più su non può andare meglio), o al
   `TETTO` di 200. Il rapporto dell'eroe atteso ha qualche gobba (la roba sale a
   scalini): per questo conta il più alto L che passa, non la prima volta che
   fallisce.

Il risultato si ricorda per roba e crescita (`forzaDelCorredo`): la prima volta
per un eroe costa una cinquantina di millisecondi (si calcolano i rapporti
dell'eroe atteso, per sempre), poi mezzo millisecondo; la stessa roba la
chiede la mappa a ogni disegno.

### Il controllo di sanità

L'eroe atteso a ogni livello, per ciascuno dei quattro eroi, ha forza uguale al
suo livello, al più uno di scarto (`unita/sotterraneo-forza` lo prova da 1 a 45):
oggi è esatto dappertutto tranne il mago al 9, che vale 10. Se si ritocca la
formula o il mostro e il controllo si rompe, è la formula da sistemare, non il
test.

## Le zone ruotano col massimo

La rinascita (`fasciaDi`) dipendeva dal livello, che non scende mai. Ora dipende
da `rinascitaDi = max(livello dell'eroe, forza di adesso, zone.forza)`, con
`zone.forza` il livello di forza più alto mai raggiunto, **scritto
nell'avventura** (`zoneConForza`): chi è forte fa ruotare le zone prima, ma la
forza scende vendendo un'arma e una zona già rinata non deve tornare indietro.

- **Quando si scrive** (`Gioco.vue`, un `watch`): sulla terra di sopra (non
  durante una discesa, non nella scelta dell'eroe), appena si arriva, a ogni
  cambio di roba o di livello; e **solo se la forza supera il massimo scritto e
  il livello** (se no `rinascitaDi` prenderebbe già quello).
- **Salvataggi vecchi**: senza `zone.forza` il massimo vale zero e la
  rinascita è il livello dell'eroe. Niente da azzerare. Scrivere `forza` e
  scrivere la notizia sentita non si cancellano a vicenda (`zoneConSentita`).
- **La sosta** dentro una zona tiene la sua `potenza` come prima.
- **I colori**, invece, si leggono dalla forza di *adesso*: se si vende l'arma,
  la forza cala e le zone già rinate tornano rosse. Le fasce non tornano, i
  colori sì.

Il rovescio è voluto: un eroe forte arriva prima a zone «rinate», cioè difficili, e
le trova al loro posto.

## Esempi misurati

Livello di forza, calcolato dal test (`nota`), con la roba attesa del livello,
a mani nude, con la roba di dodici livelli più su, e con tutto l'albero delle
abilità imparato (le tre caselle riempite a mano con le più forti, con l'arma
che hanno in mano: senza la lama giusta le abilità della lama non contano):

| eroe, livello | atteso | nudo | roba +12 livelli | con abilità |
|---|---|---|---|---|
| cavaliere 12 | 12 | 5 | 16 | 14 |
| cavaliere 20 | 20 | 9 | 27 | 26 |
| elfa 12 | 12 | 4 | 16 | 14 |
| elfa 20 | 20 | 8 | 28 | 26 |
| mago 12 | 12 | 5 | 16 | 15 |
| mago 20 | 20 | 7 | 28 | 27 |
| nano 12 | 12 | 6 | 16 | 14 |
| nano 20 | 20 | 11 | 28 | 27 |

Un conto intero, il mago del 20 con lo scettro in mano contro il mostro di
riferimento del 20 (106 ossa, attacco 24, difesa 1):

- senza abilità: colpo 19, 5,6 risposte giuste, 7,0 turni; vita 124, 7,35 danni
  a turno → regge 16,9 turni, `R` = 2,41: **forza 14** (lo scettro è meno della
  roba attesa del 20);
- con Fulmine e Brucia nelle caselle e una cura: 2,3 risposte giuste, 2,9 turni;
  resistenza 124 + 62 = 186, regge 25,3 turni, `R` = 8,69: **forza 24**.

L'eroe atteso del 20 (cavaliere) ha `R` = 4,69: regge circa quattro mostri
così per ogni mostro che batte, ed è il livello 20.

## Cosa cambia a chi gioca

- Il pallino, la sentinella, il fumetto («laggiù sono più forti di te», «non
  c'è più niente alla tua altezza»), il minatore che indica le zone verdi e la
  grigia che dà un quarto dell'esperienza leggono la forza.
- **Nella storia** i gradini si contano dalla forza (`coloreNellaStoria`): un
  eroe del 12 a mani nude vale 5, e l'ultima discesa gli sembra rossa. È voluto;
  la strada è il fabbro e la roba.
- La pagina dell'eroe dice «Forza N» sotto il livello (`[data-forza-eroe]`).

## Cosa non fa ancora

- **Le misure col giocatore finto.** La formula non è stata confrontata con
  partite vere: ha come unica taratura che l'eroe atteso valga il suo livello.
  Il peso di ogni pezzo (le due abilità, le risposte giuste a 8/10, il mostro
  tipico) si controlla quando si misura.
- **Lo scontro a gruppi.** Il mostro di riferimento è uno; quando arriveranno gli
  scontri con più mostri cambieranno gli ingressi (quanti mostri, quanto
  picchiano insieme, il colpo a tutta la stanza), non la forma della formula.
- **L'energia** non è un limite: si supponga che le due abilità siano sempre
  pagate (ne servono 10–18, l'eroe parte da 9–13 e la ricarica con le risposte
  giuste). Gli effetti che non fanno danno (stordire, gelare, parare) non
  contano come difesa; i capi e i grossi non ci sono.
- **Il mostro di riferimento è neutro**: lo scheletro tipico senza le difese di [mostri.md](mostri.md) (nel conto non ha `tipo`),
  e la formula conta il colpo senza elemento. Un eroe che vive di veleno non vale meno solo perché lo scheletro non si
  avvelena; nel gioco la scelta fra le abilità è di chi ha il mostro davanti. Il sangue, le spine e il furto di vita
  ([abilita-rami.md](abilita-rami.md#le-passive-nuove)) non entrano nel conto; la velocità sì (`c.velocita`).
- **Le abilità non sono nelle misure** della storia
  ([abilita.md](abilita.md), «Cosa non è ancora fatto»): la forza le conta, i mostri
  no.

## Nei test

`unita/sotterraneo-forza`: il controllo di sanità per i quattro eroi (1, 5, 12,
20, 30, e da 1 a 45 ±1), il mostro di riferimento che non si indebolisce, i pezzi
del calcolo, la roba che alza (+12 livelli, la sola arma) e toglie (a mani nude),
le due abilità forti che alzano la forza, l'arma che manca che le toglie dalle
caselle, il colpo uguale a quello di `Corsa.colpo` (con `passa` come numero), i
colori dalla forza, la rinascita che non torna indietro vendendo, il campo che
manca nei salvataggi vecchi, la memoria. Sulla pagina dell'eroe
`[data-forza-eroe][data-forza]`.
