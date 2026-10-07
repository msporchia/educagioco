# Scheda di prompt — il giro del mondo e le piazze della bancarella

Il giro del mondo della bancarella (docs/bancarella/mappa.md) è per ora
**disegnato in codice**, piatto e pulito. Questa scheda prepara i **fondali
dipinti** che ne prendono il posto: **un'immagine per il mondo e una per
ogni piazza**, nello stile degli altri fondali del gioco (la terra di sopra
del sotterraneo, `../sotterraneo/generati/PROMPT-terra-di-sopra.md`, e la mappa
delle isole di Passo passo, `../passo-passo/PROMPT-mappa.md`): pixel art a 16
bit, ogni pixel del disegno un quadrato di 4×4 px, colori pieni, **nessuna
scritta**, nessun personaggio.

Sui fondali **il codice posa solo quello che cambia**: i tondi col numero e il
loro stato, le rotte tratteggiate, l'aereo, i banchi coi loro numeri e le
stelle, il carretto, il cartello per tornare al mondo, i fumetti. Per questo
i dipinti **non hanno** aerei, banchi, carretti, personaggi, cartelli,
tondi, lucchetti o rotte; e hanno **le strade libere** dove quelle cose
andranno.

## Ordine di priorità

1. **`mondo.webp` — il giro del mondo** (1536×1040): serve prima di tutto,
   è la schermata che si apre ogni volta.
2. **`piazza-bologna`**, 3. **`piazza-roma`**, 4. **`piazza-parigi`**,
   5. **`piazza-new-york`**, 6. **`piazza-rio`**, 7. **`piazza-tokyo`**,
   8. **`piazza-cairo`** (1040×1680 ciascuna): nell'ordine in cui il bambino
   le incontra.

Si lavora in **una chat sola** (una mano sola): la prima volta si allega la
schermata del mondo disegnato in codice, che mostra dove stanno le città e
com'è la tavolozza (la rifà `npm run scatti`; in `test/scatti/` c'è
`bancarella-mondo-apertura.png` dopo `node test/esegui.mjs bancarella-mondo
--scatti`), e ci si aggancia alla mano di Passo passo allegando
`../passo-passo/passo-stile.png`. Dopo ogni immagine si guarda il controllo
sotto il prompt; una o due correzioni mirate, oltre si riparte dall'ultima
buona. Si salvano come `mondo.png`, `piazza-<città>.png`, e si guarda in
«Com'è andata» cosa è venuto.

Nel gioco entrano da `src/assets/bancarella/` come `mondo.webp` e
`piazza-<città>.webp` (qualità ~75): `src/data/bancarella-fondali.js` li trova
da solo, e sostituiscono il disegno in codice. I punti delle città e dei banchi
si **rileggono sul dipinto** e si scrivono nel codice (docs/bancarella/mappa.md).

## Prompt 1 — il giro del mondo

```text
Disegna in pixel art a 16 bit la MAPPA DEL MONDO di un gioco per bambini, un planisfero STILIZZATO e allegro, visto dall'alto in proiezione piatta, come la mappa di Super Mario World ma di tutta la Terra: un fondale ORIZZONTALE da 1536×1040 px, ogni pixel del disegno è un quadrato di 4×4 px. La mappa si esplora scorrendo, quindi le cose sono sparse su tutta l'immagine.

Allego una schermata del gioco: mostra le terre come le ho disegnate io in modo grezzo (mare azzurro chiaro, terre verdi e sabbia, nuvole bianche, ghiaccio in basso e in alto) e DOVE stanno le città. Tieni la tavolozza allegra e a colori pieni e la stessa disposizione, ma dipingila come si deve: coste frastagliate con spiaggette, fiumi, laghi, catene di monti con la neve in cima, boschi, deserti con le dune, qualche isola, onde e scogli nel mare.

Le terre: il NORD AMERICA in alto a sinistra con l'America centrale che scende verso il SUD AMERICA, al centro in basso a sinistra; l'EUROPA e l'ASIA formano un'unica massa grande in alto, da centro fino a destra, con la penisola dell'Italia a forma di stivale che scende verso il Mediterraneo e il Giappone come isola sul bordo destro; l'AFRICA sotto l'Europa, con la sabbia del Sahara; un'AUSTRALIA piccola in basso a destra; banchi di ghiaccio in basso e in alto, la Groenlandia in alto a sinistra.

Sette POSTI, ognuno un'area libera e quasi piana di circa 140×140 px (con altri 120 px liberi alla sua destra, dove si poserà un aereo), SENZA niente di disegnato sopra — né edifici né segni: sono posti dove poi metterò io i segnaposto. Posizioni approssimate (x, y in px, a ±60): Bologna (867, 280) nel nord dell'Italia, Roma (891, 435) sulla costa dello stivale, Parigi (667, 213) nell'Europa dell'ovest, New York (395, 296) sulla costa est del Nord America, Rio de Janeiro (584, 755) sulla costa est del Sud America, Tokyo (1403, 357) sul Giappone, Il Cairo (1029, 587) nel nord-est dell'Africa vicino a un fiume.

Il mare è vivo ma non copre i posti. Niente aerei, navi con persone, animali grandi, personaggi, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice, niente linee di confine.
```

Controllo: si riconoscono i sei continenti a colpo d'occhio, in questa
disposizione; i sette posti sono liberi e c'è spazio a destra di ognuno; niente
scritte né confini; le terre non occupano tutta l'immagine (mare attorno).

## Prompt 2 — la piazza di Bologna

Le sette piazze hanno la **stessa composizione**: cambiano la città, i colori e
il monumento. Verticali, 1040×1680 px: in alto (fino a circa 430 px) il cielo
con le case della città e il suo monumento; sotto, il selciato della piazza.
Sul selciato non ci sono banchi: il codice ne posa fino a quattro, **alternati
a sinistra e a destra di un viale libero largo circa 210 px al centro**, ognuno
grande circa 250×220 px, e in basso il cartello per tornare al mondo. In fondo al viale, sotto il monumento, **una
fontana** (che è nel disegno).

```text
Disegna in pixel art a 16 bit la PIAZZA di Bologna in un gioco per bambini, vista da davanti e un po' dall'alto, un fondale VERTICALE da 1040×1680 px, ogni pixel del disegno è un quadrato di 4×4 px. Stessa mano e stessa tavolozza della mappa del mondo che hai appena fatto: colori pieni e allegri, contorni puliti.

Nella parte alta (i primi 430 px circa): un cielo chiaro e caldo con qualche nuvola, una fila di case bolognesi color terracotta e ocra con i portici, e davanti a loro, grande al centro, le DUE TORRI di mattoni rossi (una alta e dritta, una più bassa e inclinata). Un filo di bandierine colorate sospeso fra le case.

Sotto: la piazza, un selciato di lastre quadre color sabbia, a tutta larghezza, tutto libero. Ai lati in alto due vasi grandi con un alberello. In fondo al viale centrale, sotto le torri, una fontana di pietra rotonda con l'acqua azzurra. Nella metà bassa il selciato è vuoto e senza niente: spazio per mettere banchi di mercato a destra e a sinistra e un viale libero in mezzo.

NIENTE banchi, niente persone, niente animali, niente carretti, niente cartelli, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: le due torri sono riconoscibili; il selciato è libero dalla metà
in giù e al centro; fontana in fondo al viale; niente scritte.

## Prompt 3 — la piazza di Roma

```text
Disegna in pixel art a 16 bit la PIAZZA di Roma in un gioco per bambini, vista da davanti e un po' dall'alto, un fondale VERTICALE da 1040×1680 px, ogni pixel del disegno è un quadrato di 4×4 px. Stessa mano e stessa tavolozza delle immagini che hai già fatto: colori pieni e allegri, contorni puliti.

Nella parte alta (i primi 430 px circa): un cielo giallo caldo con qualche nuvola, case romane color ocra e crema con i tetti di coppi, e davanti a loro, grande al centro, il COLOSSEO con le sue tre file di archi e un lato un po' crollato. Un filo di bandierine gialle e bianche sospeso fra le case.

Sotto: la piazza, un selciato di lastre quadre color travertino, a tutta larghezza, tutto libero. Ai lati in alto due vasi grandi con un alberello. In fondo al viale centrale una fontana di pietra rotonda con l'acqua azzurra. Nella metà bassa il selciato è vuoto: spazio per banchi di mercato a destra e a sinistra e un viale libero in mezzo.

NIENTE banchi, niente persone, niente animali, niente carretti, niente cartelli, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: il Colosseo si riconosce e non è troppo alto (sta nel cielo); resto
come sopra.

## Prompt 4 — la piazza di Parigi

```text
Disegna in pixel art a 16 bit la PIAZZA di Parigi in un gioco per bambini, vista da davanti e un po' dall'alto, un fondale VERTICALE da 1040×1680 px, ogni pixel del disegno è un quadrato di 4×4 px. Stessa mano e stessa tavolozza delle immagini che hai già fatto: colori pieni e allegri, contorni puliti.

Nella parte alta (i primi 430 px circa): un cielo azzurro-lilla con qualche nuvola, palazzi parigini color crema con i tetti grigi di zinco e i balconi di ferro, e dietro di loro, grande al centro, la TORRE EIFFEL in ferro grigio-blu. Un filo di bandierine blu e bianche sospeso fra i palazzi.

Sotto: la piazza, un selciato di lastre quadre grigio chiaro, a tutta larghezza, tutto libero. Ai lati in alto due vasi grandi con un alberello potato a palla. In fondo al viale centrale una fontana di pietra rotonda con l'acqua azzurra. Nella metà bassa il selciato è vuoto: spazio per banchi di mercato a destra e a sinistra e un viale libero in mezzo.

NIENTE banchi, niente persone, niente animali, niente carretti, niente cartelli, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: la torre sta nel cielo (non scende sul selciato) e si riconosce
dalla sagoma; resto come sopra.

## Prompt 5 — la piazza di New York

```text
Disegna in pixel art a 16 bit la PIAZZA di New York in un gioco per bambini, vista da davanti e un po' dall'alto, un fondale VERTICALE da 1040×1680 px, ogni pixel del disegno è un quadrato di 4×4 px. Stessa mano e stessa tavolozza delle immagini che hai già fatto: colori pieni e allegri, contorni puliti.

Nella parte alta (i primi 430 px circa): un cielo azzurro limpido con qualche nuvola, una fila di grattacieli grigio-blu con le finestre gialle accese, e in primo piano al centro la STATUA DELLA LIBERTÀ verde acqua col braccio alzato e la fiaccola dorata, su un piedistallo di pietra. Un filo di bandierine rosse, bianche e blu sospeso fra i grattacieli.

Sotto: la piazza, un selciato di lastre quadre grigio-azzurro, a tutta larghezza, tutto libero. Ai lati in alto due aiuole con un albero. In fondo al viale centrale una fontana rotonda con l'acqua azzurra. Nella metà bassa il selciato è vuoto: spazio per banchi di mercato a destra e a sinistra e un viale libero in mezzo.

NIENTE banchi, niente persone, niente animali, niente carretti, niente cartelli, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: la statua si riconosce (corona, braccio e fiaccola); i grattacieli
non hanno insegne scritte.

## Prompt 6 — la piazza di Rio de Janeiro

```text
Disegna in pixel art a 16 bit la PIAZZA di Rio de Janeiro in un gioco per bambini, vista da davanti e un po' dall'alto, un fondale VERTICALE da 1040×1680 px, ogni pixel del disegno è un quadrato di 4×4 px. Stessa mano e stessa tavolozza delle immagini che hai già fatto: colori pieni e allegri, contorni puliti.

Nella parte alta (i primi 430 px circa): un cielo turchese con qualche nuvola, case colorate (gialle, rosa, verdi, arancioni) e dietro di loro una collina verde con in cima, grande al centro, il CRISTO REDENTORE bianco con le braccia aperte. Un filo di bandierine gialle, verdi e blu sospeso fra le case.

Sotto: la piazza, un selciato a onde bianche e nere come il lungomare di Copacabana (ma tenue, color sabbia e crema, per non stancare l'occhio), a tutta larghezza, tutto libero. Ai lati in alto due palme in vaso. In fondo al viale centrale una fontana rotonda con l'acqua azzurra. Nella metà bassa il selciato è vuoto: spazio per banchi di mercato a destra e a sinistra e un viale libero in mezzo.

NIENTE banchi, niente persone, niente animali, niente carretti, niente cartelli, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: il Cristo si riconosce dalla sagoma; il selciato a onde non è così
contrastato da confondere i banchi che ci andranno sopra.

## Prompt 7 — la piazza di Tokyo

```text
Disegna in pixel art a 16 bit la PIAZZA di Tokyo in un gioco per bambini, vista da davanti e un po' dall'alto, un fondale VERTICALE da 1040×1680 px, ogni pixel del disegno è un quadrato di 4×4 px. Stessa mano e stessa tavolozza delle immagini che hai già fatto: colori pieni e allegri, contorni puliti.

Nella parte alta (i primi 430 px circa): un cielo rosa pallido con qualche nuvola, il MONTE FUJI azzurro con la cima bianca in lontananza, case basse giapponesi con i tetti di tegole grigie, e davanti, grande al centro, un TORII rosso. Un filo di lanterne di carta rosse e bianche sospeso fra le case.

Sotto: la piazza, un selciato di lastre quadre grigio chiaro con qualche petalo di ciliegio, a tutta larghezza, tutto libero. Ai lati in alto due ciliegi in fiore in vaso. In fondo al viale centrale una fontana di pietra rotonda con l'acqua azzurra. Nella metà bassa il selciato è vuoto: spazio per banchi di mercato a destra e a sinistra e un viale libero in mezzo.

NIENTE banchi, niente persone, niente animali, niente carretti, niente cartelli, niente scritte (nemmeno ideogrammi sulle lanterne), niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: nessun ideogramma; il torii si riconosce e il Fuji non copre il
monumento.

## Prompt 8 — la piazza del Cairo

```text
Disegna in pixel art a 16 bit la PIAZZA del Cairo in un gioco per bambini, vista da davanti e un po' dall'alto, un fondale VERTICALE da 1040×1680 px, ogni pixel del disegno è un quadrato di 4×4 px. Stessa mano e stessa tavolozza delle immagini che hai già fatto: colori pieni e allegri, contorni puliti.

Nella parte alta (i primi 430 px circa): un cielo dorato con un sole grande e qualche nuvola, case basse color sabbia con le finestre ad arco e un minareto, e dietro di loro, grandi al centro, tre PIRAMIDI. Un filo di bandierine viola e gialle sospeso fra le case.

Sotto: la piazza, un selciato di lastre quadre color sabbia calda, a tutta larghezza, tutto libero. Ai lati in alto due palme in vaso. In fondo al viale centrale una fontana di pietra rotonda con l'acqua azzurra. Nella metà bassa il selciato è vuoto: spazio per banchi di mercato a destra e a sinistra e un viale libero in mezzo.

NIENTE banchi, niente persone, niente animali (niente cammelli), niente carretti, niente cartelli, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: le tre piramidi si riconoscono; è la piazza della giornata libera,
con un banco solo (il resto del selciato resta vuoto).

## Dopo i dipinti

- Si salvano in `src/assets/bancarella/` (`mondo.webp`, `piazza-<città>.webp`):
  il gioco li prende da solo.
- Si rileggono i punti: le città sul mondo (`x, y` di `CITTA`, in coordinate
  della scena da 1152×780, cioè 3/4 dei pixel del dipinto) e i banchi nella
  piazza; `unita/bancarella-mondo` dice se si pestano.
- In «Com'è andata» (qui sotto, quando i dipinti ci sono) si scrive cosa è
  venuto bene e cosa si è girato nel codice.

## Com'è andata

Niente ancora: i prompt sono pronti, le immagini no.
