# La forza dell'eroe

Il colore delle discese (grigio, verde, arancio, rosso, e la sentinella sulla
rossa) confrontava solo il **livello** dell'eroe con la fascia della zona, e i
mostri erano tarati sulla roba *attesa*, senza abilità: un bambino con roba
buona e abilità forti abbatteva tutto con un colpo anche nelle verdi (adesso sono tarati anche sulle abilità).
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
   crescita come la dà il banco, **con le abilità della strada della sua classe**
   (`STRADA` in `motore/abilita.js`, `conLaStrada`: i punti dell'albero spesi in
   fila, le caselle vuote, quindi vale tutto quello che sa fare). Dal 12 ottobre i
   mostri sono tarati sul giocatore finto che usa le abilità ([scontro-bilancio.md](scontro-bilancio.md)),
   e l'eroe atteso le ha: un eroe senza albero vale meno del suo livello, uno che
   sceglie bene vale di più. Nella storia la roba con cui si entra nella discesa del
   livello atteso (`robaAttesa`, `LIVELLI_ATTESI`), dal 12 `robaAttesaA` e
   `crescitaAttesaA` («Oltre la storia» in [zone.md](zone.md)).
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
suo livello, al più uno di scarto (`unita/sotterraneo-forza` lo prova da 1 a 45).
`npm run sotterraneo -- --forza 1,5,12,20,30` lo stampa, e con `--rapporti` o `--dettagli` mostra le gobbe del suo rapporto. Se si ritocca la
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

Livello di forza, calcolato dal test (`nota`), tutti con i punti dell'albero spesi sulla strada del banco come l'eroe atteso:
con la roba attesa del livello, a mani nude, con la sola arma di dodici livelli più su, con tutta la roba di dodici livelli più su, e
(ultima colonna) con i punti spesi a caso nei rami in ordine, senza guardare l'arma in mano, e le tre caselle riempite con le più
forti: un albero scelto male vale molto meno dell'atteso, che è proprio il punto della strada:

| eroe, livello | atteso | nudo | arma +12 livelli | roba +12 livelli | albero a caso |
|---|---|---|---|---|---|
| cavaliere 12 | 12 | 5 | 12 | 15 | 10 |
| cavaliere 20 | 20 | 12 | 21 | 25 | 16 |
| elfa 12 | 12 | 5 | 12 | 16 | 7 |
| elfa 20 | 20 | 10 | 23 | 26 | 16 |
| mago 12 | 12 | 6 | 12 | 16 | 8 |
| mago 20 | 20 | 8 | 22 | 26 | 19 |
| nano 12 | 12 | 8 | 12 | 14 | 7 |
| nano 20 | 20 | 11 | 23 | 26 | 14 |

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
  partite vere: ha come unica taratura che l'eroe atteso valga il suo livello. Il giocatore finto, però, usa le stesse
  abilità (due forti a scontro, la cura sotto la metà) e i mostri sono tarati su di lui: l'eroe atteso e il banco sono lo stesso eroe.
- **Lo scontro a gruppi.** Il mostro di riferimento è uno; il banco combatte gruppi veri (l'area con tre mostri), la formula no.
  Contare quanti mostri e quanto picchiano insieme cambierebbe gli ingressi, non la forma della formula.
- **L'energia** è un limite solo a grandi linee: conta l'abilità che l'**energia di partenza tipica di uno scontro** paga,
  i due terzi del globo per eccesso (`energiaTipica`, `ENERGIA_TIPICA` in `motore/forza.js`; il banco entra in uno scontro con il
  40–60% del globo, [scontro-bilancio.md](scontro-bilancio.md)). Il cavaliere e il nano, con dieci di energia, contano le
  abilità fino a 7 (le prime due righe); il mago, con ventidue e più, quasi tutte. Il conto vale anche per l'eroe atteso, quindi la
  sanità (l'eroe atteso vale il suo livello) non si muove. Gli effetti che non fanno danno (stordire, gelare, parare) non
  contano come difesa; i capi e i grossi non ci sono.
- **Il mostro di riferimento è neutro**: lo scheletro tipico senza le difese di [mostri.md](mostri.md) (nel conto non ha `tipo`),
  e la formula conta il colpo senza elemento. Un eroe che vive di veleno non vale meno solo perché lo scheletro non si
  avvelena; nel gioco la scelta fra le abilità è di chi ha il mostro davanti. Il sangue, le spine e il furto di vita
  ([abilita-rami.md](abilita-rami.md#le-passive-nuove)) non entrano nel conto; la velocità sì (`c.velocita`).
- **Le abilità sono nelle misure** dal 12 ottobre (il banco ha una strada per classe, [abilita.md](abilita.md)), ma solo quella
  strada: un bambino che sceglie altri rami vale quello che il suo albero dà.

## Nei test

`unita/sotterraneo-forza`: il controllo di sanità per i quattro eroi (1, 5, 12,
20, 30, e da 1 a 45 ±1), il mostro di riferimento che non si indebolisce, i pezzi
del calcolo, la roba che alza (+12 livelli, la sola arma) e toglie (a mani nude),
le due abilità forti che alzano la forza, l'arma che manca che le toglie dalle
caselle, il colpo uguale a quello di `Corsa.colpo` (con `passa` come numero), i
colori dalla forza, la rinascita che non torna indietro vendendo, il campo che
manca nei salvataggi vecchi, la memoria. Sulla pagina dell'eroe
`[data-forza-eroe][data-forza]`.
