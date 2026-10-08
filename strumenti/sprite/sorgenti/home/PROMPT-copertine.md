# Scheda di prompt — le copertine dei giochi in home

Nel carosello della home ogni gioco ha una **copertina**: oggi è un'emoji
grande su un fondo colorato con qualche forma piatta (`Copertina.vue`,
`scene.js`), e docs/core/home.md la dice provvisoria. Qui si chiede quella
vera: **una scena dipinta per gioco**, che fa riconoscere il gioco a colpo
d'occhio, con il soggetto già dentro (niente emoji sopra).

**Si chiede a Grok in modalità agente**, non a una chat che fa un'immagine
alla volta: gli si danno le schermate e la descrizione dei quindici giochi,
e lui fa un'immagine per gioco tenendo da sé la mano. Un'immagine per gioco
e non un foglio a griglia: i fogli a griglia con Grok non sono mai venuti
(DA-GENERARE.md, «I mostri che camminano»), le immagini singole sì.

## Le misure, e perché

- **3:2 orizzontale, 1536×1024.** Nel carosello il disegno è 176×114 px
  (`ARTE` in `Carosello.vue`), cioè 3:2; su un telefono a tre pixel per
  punto servono ~530 px di larghezza, e 1536 basta e avanza.
- **Il soggetto sta nel quadrato centrale** (1024×1024): il riquadro
  «riprendi da qui» mostra la copertina a 64×64 tagliandola in mezzo, e
  l'indice (le tessere da 48 px) potrà prendere lo stesso quadrato al posto
  dell'emoji. Ai lati c'è solo scena, che si può perdere.
- **Gli angoli li arrotonda il codice**, e sotto il disegno c'è il pannello
  bianco col nome: il dipinto arriva fino al bordo, senza cornice.
- **Il colore dominante di ognuno è diverso**: la carta prende il bordo dal
  `fondo` del gioco, e quindici carte in fila devono distinguersi. Nel prompt
  c'è il colore di oggi, che si conosce già.
- **Niente cerchietto giallo in un angolo**: un sole lì sembra il pallino di
  una notifica (docs/core/home.md).

## Cosa allegare

Due immagini:

1. `1-la-home.png` — la home com'è, col carosello: è dove andranno
   (`docs/img/home.png` dopo `npm run scatti home`).
2. `2-i-giochi.png` — una tavola con una schermata per gioco, numerate come
   nel prompt: le `*-gioco.png` di `npm run scatti` (per l'inglese la mappa),
   più `../passo-passo/passo-stile.png` per Passo passo e la cripta dipinta
   `../sotterraneo/generati/sotterraneo_4.png` per il sotterraneo, perché
   la sua `-gioco` è la scelta dell'eroe. Una tavola sola tiene corto
   l'elenco degli allegati.

## Prompt 1 — tutte, con le prime tre come prova

```text
Ti chiedo le COPERTINE dei giochi di un'app educativa per bambini dai 4 ai 12 anni: quindici immagini, una per gioco, tutte della STESSA MANO, come le copertine di una collana.

Allego due immagini. La prima è la home dell'app: c'è un carosello di carte, e la parte alta di ogni carta (oggi un'emoji su un fondo colorato) è il posto della copertina. La seconda è una tavola con una schermata per ogni gioco, numerate come l'elenco qui sotto: è il mondo di ogni gioco, e la copertina deve sembrare lo stesso mondo.

PER OGNI GIOCO un'immagine ORIZZONTALE 3:2, 1536×1024 px, PNG.
- Una piccola scena del mondo del gioco, con un SOGGETTO grande che fa capire il gioco a colpo d'occhio. Il soggetto sta tutto nel QUADRATO CENTRALE (1024×1024): l'immagine verrà mostrata anche tagliata a quadrato e piccolissima, 64×64 px, e deve ancora riconoscersi. Ai lati solo scena.
- Il disegno arriva fino al bordo: nessuna cornice, nessun angolo arrotondato, nessun margine bianco.
- NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA LETTERA, nessuna interfaccia, nessun pulsante, nessun logo. Neanche sui cartelli, sulle bandiere, sui libri o sulle etichette.
- Niente sole o cerchio giallo negli angoli.
- Ogni gioco ha il suo COLORE DOMINANTE (scritto sotto): quindici copertine in fila devono distinguersi a colpo d'occhio.

LO STILE, uguale per tutte: pixel art a 16 bit, allegra e pulita, colori pieni, contorno scuro sottile, luce da in alto a sinistra, ogni pixel del disegno è un quadrato di 4×4 px. Vista dall'alto a tre quarti o di lato, come preferisci, ma la stessa scelta per tutte. Il riferimento più vicino è la schermata 10 (Passo passo) e la 14 (il sotterraneo). Per bambini: niente sangue, niente teschi, i mostri sono buffi più che paurosi.

I GIOCHI. Ti dico cosa fa il bambino e cosa c'è nel mondo: la scena scegli tu.
1. ASTEROIDI (blu notte) — tabelline e calcolo a mente: un'astronave bianca nello spazio colpisce l'asteroide che porta il risultato giusto; si vola di pianeta in pianeta.
2. DIFENDI IL CASTELLO (azzurro cielo) — un tower defense: i mostri (melme, lupi, ragni, un drago) scendono lungo un sentiero di terra nel bosco verso un castello dai tetti blu, e il bambino costruisce torri che li fermano.
3. LA BANCARELLA (giallo caldo, con rosso) — si fa il venditore al mercato: una bancarella con la tenda a strisce rosse e bianche, cassette di frutta e verdura, monete e banconote per dare il resto; la bancarella gira il mondo in aereo, da Bologna a Tokyo.
4. IL LABORATORIO DELLE POZIONI (viola) — un apprendista alchimista pesa e misura ingredienti strani (conchiglie pestate, stelle tritate) con bilance, brocche graduate e metri, per fare pozioni che bollono nel calderone.
5. CONTA GLI ANIMALI (azzurro chiaro, con legno) — il gioco dei più piccoli, quattro anni: animali da contare su un prato con la staccionata (pecore, scoiattoli, cervi), tondi e simpatici.
6. ENGLISH (blu mare) — imparare l'inglese navigando su una mappa del tesoro: un veliero va di isola in isola, ogni isola un gruppo di parole (i colori, gli animali, i giocattoli), e c'è un libro di storie.
7. ESPAÑOL (rosso caldo, con giallo) — come English, lo stesso veliero e la stessa mappa del tesoro, ma su un mare caldo: è lo spagnolo della Bolivia, quindi niente bandiera della Spagna; se vuoi un segno, i colori dei tessuti andini o un lama sulla riva.
8. IL GENERALE (legno e ocra) — si scrive un piano di ordini per una piccola squadra di eroi in una fortezza di pietra vista dall'alto (apri il forziere, aspetta la guardia, passa dalla porta), e la squadra lo esegue alla lettera.
9. CODICE SEGRETO (grigio ardesia) — deduzione, tipo Mastermind: si indovina una combinazione nascosta di animaletti (cane, gatto, coniglio, volpe) leggendo gli indizi; un lucchetto, una lente, tessere coperte.
10. PASSO PASSO (verde prato) — un coniglietto bianco deve tornare alla sua tana su un prato a caselle, raccogliendo la carota; il bambino gli scrive gli ordini in fila. Più avanti c'è un cane pastore che porta le pecore nel recinto.
11. IL ROBOT (verde scheda elettronica) — si programma un robottino bianco e grigio coi cingoli che costruisce cose (un muro, una scala, un castello di blocchi) in un cantiere; il mondo è una scheda elettronica con piste di rame.
12. PRIMA E DOPO (rosa) — rimettere in fila una storia: il seme, il germoglio, l'albero; tre momenti di una stessa cosa che cambia.
13. LA FATTORIA (verde chiaro, con rosso) — una fattoria da far crescere, alla Hay Day: il fienile rosso, i campi di grano, il mulino a vento, le galline nel recinto, un cane bianco e grigio (un bobtail).
14. IL SOTTERRANEO (bruno terra) — un piccolo eroe con la torcia scende per una scala di pietra in un sotterraneo; dentro stanze di pietra, forzieri, porte chiuse, qualche mostro.
15. SURVIVORS (bordeaux scuro) — un eroe con l'arco resiste a ondate di mostriciattoli che arrivano da tutti i lati in un bosco al crepuscolo, raccogliendo gemme che brillano.

COME PROCEDERE: fai prima le copertine 2, 10 e 14 e confrontale fra loro: devono sembrare della stessa collana (stessa grana dei pixel, stessa luce, stesso contorno). Poi fai le altre tenendo quelle tre come riferimento. Dammi ogni immagine col suo numero e il nome del gioco.
```

## Prompt 2 — il seguito, quattro alla volta

Al primo giro l'agente ha finito i token dopo quattro immagini. Il seguito si
chiede **a giri da quattro**, ognuno in una conversazione che si regge da
sola: si allega **la collana** (tutte le copertine buone fatte finora in
una tavola, `tmp/copertine/collana.png` dopo `python3
strumenti/sprite/copertine.py --collana`) come stile, più `2-i-giochi.png`
per i mondi, e il testo descrive solo i quattro giochi del giro. La collana
si rifà prima di ogni giro: cresce, e il generatore vede tutto quello che
c'è già. Si salta quello che non serve a lui: niente
confronti, niente bozze.

L'intestazione è la stessa per ogni giro; sotto si incolla il blocco del giro.

```text
Ti chiedo QUATTRO copertine per i giochi di un'app educativa per bambini dai 4 ai 12 anni. Allego una tavola con le copertine della collana già fatte: sono lo STILE da tenere identico (stessa pixel art a 16 bit, stessa grana dei pixel, stessa luce da in alto a sinistra, stesso contorno scuro sottile, stessi colori pieni, mostri buffi e non paurosi). Allego anche una tavola con una schermata per ogni gioco, numerata: è il mondo di ogni gioco.

Ogni copertina: un'immagine ORIZZONTALE 3:2, 1536×1024 px, una piccola scena del mondo del gioco con un SOGGETTO grande che fa capire il gioco a colpo d'occhio, tutto dentro il QUADRATO CENTRALE (l'immagine verrà mostrata anche tagliata a quadrato a 64×64 px). Il disegno arriva fino al bordo, senza cornice. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA LETTERA, nessuna interfaccia, nemmeno su cartelli, bandiere o libri. Niente sole o cerchio giallo negli angoli. Il COLORE DOMINANTE di ognuna è scritto accanto al nome.

Fai direttamente le quattro immagini, una per gioco, senza bozze e senza varianti: dammi ognuna col suo numero e il nome del gioco.
```

**Giro A**

```text
1. ASTEROIDI (blu notte) — tabelline e calcolo a mente: un'astronave bianca nello spazio colpisce l'asteroide che porta il risultato giusto; si vola di pianeta in pianeta.
3. LA BANCARELLA (giallo caldo, con rosso) — si fa il venditore al mercato: una bancarella con la tenda a strisce rosse e bianche, cassette di frutta e verdura, monete e banconote per dare il resto; la bancarella gira il mondo in aereo.
4. IL LABORATORIO DELLE POZIONI (viola) — un apprendista alchimista pesa e misura ingredienti strani (conchiglie pestate, stelle tritate) con bilance, brocche graduate e metri, per fare pozioni che bollono nel calderone.
5. CONTA GLI ANIMALI (azzurro chiaro, con legno) — il gioco dei più piccoli, quattro anni: animali da contare su un prato con la staccionata (pecore, scoiattoli, cervi), tondi e simpatici.
```

**Giro B**

```text
6. ENGLISH (blu mare) — imparare l'inglese navigando su una mappa del tesoro: un veliero va di isola in isola, ogni isola un gruppo di parole (i colori, gli animali, i giocattoli), e c'è un libro di storie.
7. ESPAÑOL (rosso caldo, con giallo) — come English, lo stesso veliero e la stessa mappa del tesoro, ma su un mare caldo: è lo spagnolo della Bolivia, quindi niente bandiera della Spagna; se vuoi un segno, i colori dei tessuti andini o un lama sulla riva.
9. CODICE SEGRETO (grigio ardesia) — deduzione, tipo Mastermind: si indovina una combinazione nascosta di animaletti (cane, gatto, coniglio, volpe) leggendo gli indizi; un lucchetto, una lente, tessere coperte.
11. IL ROBOT (verde scheda elettronica) — si programma un robottino bianco e grigio coi cingoli che costruisce cose (un muro, una scala, un castello di blocchi) in un cantiere; il mondo è una scheda elettronica con piste di rame.
```

**Giro C**

```text
8. IL GENERALE (legno e ocra) — si scrive un piano di ordini per una piccola squadra di eroi in una fortezza di pietra vista dall'alto (apri il forziere, aspetta la guardia, passa dalla porta), e la squadra lo esegue alla lettera.
12. PRIMA E DOPO (rosa) — rimettere in fila una storia: il seme, il germoglio, l'albero; tre momenti di una stessa cosa che cambia.
13. LA FATTORIA (verde chiaro, con rosso) — una fattoria da far crescere, alla Hay Day: il fienile rosso, i campi di grano, il mulino a vento, le galline nel recinto, un cane bianco e grigio (un bobtail).
15. SURVIVORS (bordeaux scuro) — un eroe con l'arco resiste a ondate di mostriciattoli che arrivano da tutti i lati in un bosco al crepuscolo, raccogliendo gemme che brillano.
```

Se un giro si tronca ancora, si richiede solo quello che manca, col
blocco ridotto alle voci mancanti.

## Prompt 3 — con ChatGPT, quattro in un foglio

ChatGPT non ha la modalità agente ma fa un'immagine grande per messaggio: se
ne approfitta con **un foglio 2×2 da 1536×1024**, quattro copertine da
768×512 (3:2 esatto) separate da una croce bianca. Tre messaggi nella stessa
chat fanno i dodici giochi che mancavano. Al primo si allegano la collana
aggiornata e `2-i-giochi.png`. I fogli si salvano qui accanto
(`foglio_1.png`…) e si scrivono in `fogli.json` con le quattro chiavi in
ordine; lo strumento taglia a croce e toglie il bianco. Un quadro sbagliato si
rifà da solo come `copertina-<chiave>`, e si toglie dal foglio (`null` al suo
posto in `fogli.json`).

Primo messaggio:

```text
Ti chiedo le COPERTINE dei giochi di un'app educativa per bambini dai 4 ai 12 anni, QUATTRO PER IMMAGINE.

Allego due tavole. La prima ha le copertine della collana già fatte: sono lo STILE da tenere identico (stessa pixel art a 16 bit, stessa grana dei pixel, stessa luce da in alto a sinistra, stesso contorno scuro sottile, stessi colori pieni, mostri buffi e non paurosi). La seconda ha una schermata per ogni gioco, numerata: è il mondo di ogni gioco.

L'immagine è ORIZZONTALE, 1536×1024 px, divisa in QUATTRO QUADRI uguali da 768×512 px (due sopra, due sotto), separati da una sottile croce BIANCA PURA. Ogni quadro è la copertina di un gioco: una piccola scena del suo mondo, con un SOGGETTO grande che fa capire il gioco a colpo d'occhio, e il soggetto sta tutto nel QUADRATO CENTRALE del suo quadro (ogni copertina verrà mostrata anche tagliata a quadrato a 64×64 px). Ogni quadro arriva fino alla croce, senza cornice, e niente esce dal suo quadro.

In nessun quadro: PAROLE SCRITTE, NUMERI, LETTERE, interfaccia, nemmeno su cartelli, bandiere o libri. Niente sole o cerchio giallo negli angoli. Ogni quadro ha il COLORE DOMINANTE scritto accanto al nome.

In alto a sinistra — …
In alto a destra — …
In basso a sinistra — …
In basso a destra — …
```

con le quattro righe prese dai giri del prompt 2 («IL GENERALE (legno e
ocra): …»). Ai fogli dopo basta:

```text
Stessa collana, stesso stile, stesso foglio da quattro quadri con la croce bianca. I prossimi quattro:
```

e le quattro righe.

## Come si guarda se è venuta bene

- **Rimpicciolita a 64×64 e tagliata a quadrato si riconosce ancora**: è la
  prova vera, perché è il riquadro «riprendi da qui».
- Messe in fila, sono della stessa mano e si distinguono per colore.
- Nessuna scritta, nemmeno finta (le lettere storpiate sui cartelli sono il
  difetto più comune).
- Una copertina sbagliata si rifà da sola, allegando una delle buone come
  riferimento di stile.

Si salvano qui accanto come `copertina-<chiave>.png`, con la chiave del
gioco: `mate`, `torri`, `bancarella`, `pozioni`, `conta`, `inglese`,
`spagnolo`, `generale`, `codice`, `passo`, `costruttore`, `prima`,
`fattoria`, `sotterraneo`, `survivors`.

## Dopo le immagini

```bash
python3 strumenti/sprite/copertine.py   # rifà src/components/home/copertine-dipinte.js
```

Ogni `copertina-<chiave>` qui accanto entra da sola: 528×352 con
`codifica.py` (~100 KB l'una), e la carta prende per bordo il colore medio
del dipinto. **L'icona** dell'indice e di «riprendi» è un quadrato ritagliato
dal sorgente: si sceglie a occhio e si scrive in `icone.json` (`[x, y,
lato]` in pixel del sorgente), stretto sul soggetto; senza voce si prende il
quadrato centrale. Un gioco senza copertina dipinta resta com'era.

## Com'è andata

- **Prompt 1, Grok agente, l'8/10/2026**: quattro immagini, poi i token
  finiti. Due castelli, il sotterraneo, Passo passo; tutte senza scritte,
  della stessa mano, e nel gioco «un altro mondo». Le sorgenti sono gli
  originali scaricati da Grok (JPEG 1728×1152).
- **Il castello è quello di lato** (`copertina-torri.jpg`): a 64 px si
  leggono castello e melma. Quello dall'alto (`non-usate/`) è più coerente
  con la vista degli altri due, ma piccolo diventa un tappeto di alberi.
- **Le icone si ritagliano dalle copertine** (idea sua): il castello senza
  la melma, l'eroe con la torcia e il forziere, il coniglio con la carota.
  Con le icone dipinte l'indice è passato a cinque tessere per riga.
- **I tre fogli di ChatGPT, prompt 3, l'8/10/2026**, tutti al primo colpo e
  nella stessa mano delle tre di Grok (gli si era allegata la collana); croce
  bianca pulita, quadri da 762×505 dopo il taglio. `foglio_1.png`: Generale,
  Prima e dopo, fattoria, Survivors. `foglio_2.png`: asteroidi, bancarella
  (su una mongolfiera: «gira il mondo»), pozioni, conta. `foglio_3.png`:
  English, Español (il lama e i tessuti andini), Codice Segreto, il Robot.
- **Due scarti dal prompt, tenuti**: gli asteroidi hanno i numeri sopra, ma
  sono cifre pulite ed è proprio quello che si vede nel gioco; il Robot ha un
  pannellino di frecce, che sono i suoi comandi, senza scritte.
- **Le icone**: il generale con la mappa, il germoglio che diventa albero, il
  fienile, l'arciere, il razzo sul 12, il banco sotto la tenda, la maghetta
  col calderone, le pecore, il veliero con l'ancora, il lama (due velieri
  vicini nell'indice si confondevano), il detective con la lente, il
  robottino.
- **Pesano 2,1 MB nel file unico**, quindici a 528×352 con le icone. A 352
  (due volte la carta) sarebbero circa la metà, un filo più morbide sui
  telefoni a 3×.
- **Il prompt 2 (Grok a giri da quattro) non è servito**: resta se una
  copertina va rifatta.
