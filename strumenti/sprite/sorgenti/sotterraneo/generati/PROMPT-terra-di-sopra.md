# Scheda di prompt — la terra di sopra

La terra di sopra è la mappa da cui si scende nei sotterranei: un prato
grande (24×40 celle) con la nebbia, che l'eroe esplora camminando dove
tocchi. Gli ingressi si trovano esplorando, e c'è chi ti indica la
strada: il vecchio minatore che parla, il cartello all'incrocio, i sassi
che luccicano. Il disegno approvato è il mock del 6 ottobre 2026; le
discese sono sei: le cantine (botola), il pozzo, le gallerie (miniera),
la cisterna (scala di pietra), il labirinto (arco in rovina), il fondo
(scaletta sull'orlo della voragine).

Si usa il modo della cripta (vedi `PROMPT-scenario.md`): **prima una
scena** che fissa la mano, la luce e la tavolozza, **poi i pezzi su
magenta nella stessa chat**. La mappa vera la compone il codice: dalla
scena non si ritaglia il terreno, che è fatto di macchie e non di
caselle; si ritagliano i fondi senza cuciture e le cose dai fogli.

## Come si fa

1. **Una chat nuova.**
2. **La scena** (prompt 1), allegando **solo** `sotterraneo_4.png` (la
   cripta: è lo stile, non i colori).
3. **Nella stessa chat**, uno dopo l'altro, i fogli 2, 3 e 4 su magenta.
   Prima di passare al successivo si guarda il controllo sotto ogni
   prompt; una o due correzioni mirate, oltre si riparte con l'ultima
   buona allegata.
4. Si salvano qui accanto come `sopra_1.png` (la scena), `sopra_2.png`
   (i fondi), `sopra_3.png` (le cose), `sopra_4.png` (i personaggi), e
   in «Com'è andata» si scrive cosa è venuto bene.

## Prompt 1 — la scena

```text
Disegna in pixel art la schermata di un gioco di ruolo a 16 bit: un pezzo di campagna visto dall'alto a tre quarti, in proiezione ortogonale — niente prospettiva: le verticali restano verticali.

Allego un'immagine: la scena di un sotterraneo dello stesso gioco. È lo STILE: stesso contorno scuro, stessa luce da in alto a sinistra, stessa cura, stessa scala dei pixel. I materiali e i colori NON sono i suoi: qui siamo all'aperto, di giorno, in una campagna un po' selvatica sopra le miniere — erba verde piena, terra battuta calda, acqua azzurra, roccia grigio-bruna, chiome di un verde più scuro dell'erba.

L'immagine è 1024×1536 px, verticale, su una griglia invisibile di 16 colonne × 24 righe di celle da 64×64 px. Ogni cella contiene 16×16 pixel del disegno, cioè ogni pixel è un quadrato pieno di 4×4 px. LA GRIGLIA NON SI DISEGNA: il prato è un prato continuo, con macchie d'erba più chiara e più scura che scavalcano le celle, non una scacchiera.

Nella scena non c'è nessuno e non c'è niente da prendere: niente personaggi, animali, mostri, monete, gemme, chiavi, forzieri. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA INTERFACCIA: il cartello ha le frecce di legno ma niente scritte.

Le sei discese devono essere riconoscibili a colpo d'occhio come "qui si scende sotto terra", e diverse fra loro:
- B una botola di legno nel prato, con l'anello di ferro, una cella;
- P un pozzo di pietra col tettuccio e la carrucola, una cella;
- M l'ingresso di una miniera scavato nella parete del monte, con l'armatura di travi e il buio dentro, due celle per due;
- S una scala di pietra che scende sotto terra sulla riva dello stagno, con i gradini che spariscono nel buio, due per due;
- A un arco di pietra in rovina fra le rocce, con i gradini che scendono sotto l'arco, due per due;
- L una scaletta di corda e legno appesa all'orlo della voragine, una cella.

La pianta, cella per cella, 16 caratteri per riga. È una guida per te, non va disegnata:
^ monte: roccia vista da sopra, con creste e picchi, il bordo verso il prato è una parete bassa · T bosco: chiome tonde che si toccano, i tronchi si vedono solo sul bordo verso il prato · . prato · , sentiero di terra battuta, col suo bordo d'erba irregolare · ~ stagno · V voragine: un buco nel terreno, l'orlo di roccia e il buio dentro · H casa: tetto di paglia o di coppi, 3×3 celle · C cartello a tre frecce all'incrocio · le lettere B P M S A L sono le discese qui sopra

^^^^^^^^^^^^^^^^
^^^^^^^^^^^^^^^^
^AA^^^^^^^^^MM^^
TAA.^^^^^^^.MM^T
TT,......,,,,,TT
TT,..TT..,....TT
T,,..TT..,..VVVT
T,.......,..VVVT
T,..~~~..,..VVLT
T,.~~~~~.,....,T
T,.~~~~~SS,,,,,T
T,..~~~.SS...TTT
T,,,,,,,,C,,,,TT
TT.......,....TT
TT..TT...,.....T
T...TT...,.....T
T........,.....T
T..HHH...,..HHHT
T..HHH...,..HHHT
T..HHH.,,,,.HHHT
T......,P.,....T
T......,..,.B..T
TT.....,,,,,,.TT
TTTTTTTTTTTTTTTT

Aggiungi quello che rende viva una campagna così — sassi, cespugli, fiori, una staccionata vicino alle case, un carretto — con un limite solo: niente che si possa scambiare per una cosa da raccogliere o per un'altra discesa.
```

Controllo: le sei discese si distinguono e si capisce che vanno sotto;
il prato non è a scacchiera; nessuna scritta; la scala dei pixel è
quella della cripta (un pixel = 4×4).

## Prompt 2 — i fondi

```text
Su un fondo MAGENTA PIENO (#FF00FF), uniforme, senza sfumature, senza ombre e senza nessuna scacchiera, i FONDI della scena che hai appena fatto: stessi materiali, stessa tavolozza, stessa mano, STESSA SCALA (celle da 64×64 px, ogni pixel del disegno è un quadrato di 4×4 px). Immagine 1024×1536 px verticale. NESSUNA PAROLA SCRITTA, NESSUN NUMERO.

Ogni fondo è un quadrato di 4×4 celle (256×256 px) che si ripete senza cuciture: il bordo destro continua nel sinistro, quello in basso in quello in alto. SENZA CORNICE e senza bordo: il materiale arriva fino al taglio. Fra un quadrato e l'altro almeno mezza cella di magenta. Niente oggetti sopra.

In due colonne, dall'alto in basso:
1. il prato; il prato con più macchie scure e qualche ciuffo;
2. il prato con fiorellini sparsi; l'erba più alta e scura del bordo del bosco;
3. la terra battuta del sentiero; la terra battuta con sassolini;
4. l'acqua dello stagno; la roccia del monte vista da sopra;
5. il buio della voragine (quasi nero, con qualche riflesso di roccia); le chiome del bosco viste da sopra, che si toccano.
```

Controllo: fondo magenta vero; ogni quadrato si ripete senza una riga
visibile (si prova affiancandolo a se stesso); niente cornici.

## Prompt 3 — le cose

```text
Sullo stesso fondo MAGENTA PIENO (#FF00FF), le COSE della scena, della stessa mano e della STESSA SCALA (celle da 64×64 px). Immagine 1024×1536 px verticale. Ogni pezzo sta da solo, staccato dagli altri da almeno mezza cella di magenta; il magenta non compare mai DENTRO un pezzo. Nessun pezzo ha un quadrato di prato, un'ombra o un bagliore attorno: è disegnato solo il pezzo. NESSUNA PAROLA SCRITTA, NESSUN NUMERO.

Dall'alto in basso:
1. Le sei discese della scena, ognuna in DUE stati, uno accanto all'altro: APERTA (si vede il buio che scende) e CHIUSA (sbarrata: assi inchiodate di traverso, o una grata col lucchetto, ma della stessa forma e misura dell'aperta). Botola 1×1, pozzo 1×1, miniera 2×2, scala di pietra 2×2, arco in rovina 2×2, scaletta 1×1 (con un pezzo d'orlo di roccia a cui è appesa). Se servono, usa due righe.
2. Due case diverse, 3×3 celle; una staccionata di legno, un pezzo dritto da una cella e un angolo.
3. Tre alberi diversi visti dall'alto a tre quarti, chioma larga una cella e mezza col tronco in basso; due cespugli; due sassi grandi.
4. Due picchi di monte, 2×2 celle ciascuno, che si possono accostare e sovrapporre.
5. Il cartello a tre frecce di legno, senza scritte; un mucchietto di sassi che luccicano, in tre fotogrammi del luccichio (il sasso uguale, cambia solo la scintilla).
6. Una bussola d'ottone vista da sopra, grande mezza cella, con l'ago.
```

Controllo: ogni discesa chiusa ha la stessa sagoma dell'aperta; i sassi
che luccicano non sembrano monete o gemme; niente quadrato di prato
sotto le cose.

## Prompt 4 — chi ti indica la strada

```text
Sullo stesso fondo MAGENTA PIENO (#FF00FF), tre personaggi della stessa mano e della STESSA SCALA (celle da 64×64 px): ognuno largo una cella e alto una cella e mezza, visto dall'alto a tre quarti, come gli eroi di un gioco di ruolo a 16 bit. Immagine 1024×1536 px verticale. Ogni posa sta da sola, staccata dalle altre da almeno mezza cella di magenta, senza ombra e senza prato sotto. NESSUNA PAROLA SCRITTA, NESSUN FUMETTO.

Una riga per personaggio, tre pose ciascuno: FERMO, CHE PARLA (bocca aperta, una mano alzata), CHE INDICA (il braccio teso di lato, verso destra).
1. Il vecchio minatore: barba bianca, elmetto di cuoio con la candela spenta, piccone in spalla, gentile.
2. La ragazza del pozzo: un secchio in mano, il fazzoletto in testa, sveglia.
3. Il boscaiolo: grande e buono, la scure appoggiata, la camicia a quadri.
Nessuno ha armi in mano rivolte verso chi guarda; sono amici, non nemici.
```

Controllo: le tre pose dello stesso personaggio hanno la stessa
sagoma e gli stessi colori; il braccio che indica si legge; sono alti
come un eroe del gioco, non giganti.

## Prompt 5 — i mercanti

I tre che vendono sulla terra di sopra (docs/sotterraneo/terra-di-sopra.md,
«I mercanti»). Oggi sono figure disegnate in codice; nella stessa chat del
prompt 4, che tiene la mano.

```text
Sullo stesso fondo MAGENTA PIENO (#FF00FF), tre mercanti della stessa mano e della STESSA SCALA dei personaggi di prima (celle da 64×64 px): ognuno largo una cella e alto una cella e mezza, visto dall'alto a tre quarti, come gli eroi di un gioco di ruolo a 16 bit. Immagine 1024×1536 px verticale. Ogni posa sta da sola, staccata dalle altre da almeno mezza cella di magenta, senza ombra, senza prato e senza bancone sotto. NESSUNA PAROLA SCRITTA, NESSUN FUMETTO, NESSUNA MONETA.

Una riga per mercante, tre pose ciascuno: FERMO, CHE SALUTA (una mano alzata), CHE MOSTRA (porge qualcosa con le due mani).
1. L'armaiolo: robusto, testa rasata e barba nera, grembiule di cuoio sopra la camicia rossa, un martello da fabbro in mano.
2. L'erborista: cappuccio verde, un grembiule chiaro, una boccetta in mano e un mazzetto d'erbe alla cintura.
3. Il rigattiere: cappellaccio a tesa larga, giacca viola rattoppata, un grosso sacco in spalla pieno di roba.
Sono amici: nessuna arma rivolta verso chi guarda.
```

Controllo: le tre pose dello stesso mercante hanno la stessa sagoma e
gli stessi colori; si distinguono a colpo d'occhio anche piccoli (il
martello, il verde, il sacco); sono alti come il minatore.

## Prompt 6 — la mappa si allarga a destra

Con la roba che resta, i mercanti e (poi) le missioni la terra di sopra
diventa stretta. Si allarga **accostando** un secondo pezzo a destra di
`mappa_sotterraneo.png`, non ridisegnandola: quella resta identica. La
giunta cade nel bosco, dove un piccolo scarto non si vede; il sentiero
che esce dal bordo destro (a circa 1140 px dall'alto) continua nel pezzo
nuovo. Si chiede nella chat della mappa, allegandola di nuovo; il pezzo
si salva come `mappa_sotterraneo_2.png`; lo strumento
`strumenti/sprite/terra-di-sopra.py` le accosta (vedi «La giunta» in
`docs/sotterraneo/terra-di-sopra.md`).

```text
Allego la mappa che hai fatto. Disegna la parte di mondo che sta SUBITO A DESTRA di questa, come se la mappa continuasse: un'altra immagine da 1024×1536 px verticale, STESSA SCALA (ogni pixel del disegno è un quadrato di 4×4 px), stessa mano, stessa luce, stessi colori, stessa vista dall'alto a tre quarti.

Il bordo SINISTRO della nuova immagine deve continuare esattamente il bordo DESTRO della mappa allegata: per una striscia larga 2 celle (128 px) a sinistra c'è lo stesso bosco fitto e la stessa roccia che chiudono la mappa a destra, alla stessa altezza; il monte in alto continua; il sentiero di terra battuta che esce dal bordo destro della mappa allegata (in basso, a circa 1140 px dall'alto) entra dal bordo sinistro alla stessa altezza e prosegue.

Cosa c'è nella parte nuova, collegata da sentieri di terra battuta larghi e liberi:
- in basso, IL VILLAGGIO: una piazzetta di terra battuta con un pozzo per l'acqua (senza buco nero: è chiaramente un pozzo da cui si beve, col secchio pieno), tre posti per tre mercanti (un'incudine sotto una tettoia, un banco con boccette e mazzi d'erbe, un carretto di cianfrusaglie) SENZA persone, qualche casa col tetto di paglia, un orto, panni stesi;
- al centro, un fiume che scende dal monte con un ponte di legno, un mulino ad acqua, campi coltivati;
- in alto, su una collina, una torre di guardia in rovina e, fra le rocce, un vecchio altare di pietra coperto di muschio: posti dove un giorno si andrà a cercare qualcosa;
- nessun nuovo buco, scala o passaggio che scenda sotto terra.

Niente personaggi, niente animali, niente scritte, niente numeri, nessuna cornice.
```

Controllo: affiancate le due immagini, bosco, roccia e sentiero
continuano alla giunta; nessuna nuova discesa; il villaggio si legge come
il posto dei mercanti.

## La mappa si tiene intera

Il prompt 1 è uscito così bene (`mappa_sotterraneo.png`) che la mappa si
tiene **com'è**, un'immagine sola per metà: le strade ci sono già, e il
codice ci mette sopra solo le cose che cambiano (il cartello di divieto
delle discese chiuse, chi ti indica la strada, i sassi che luccicano, la
nebbia) e lo spazio dove si cammina. I prompt 2 e 3 non servono più; il 4
(i personaggi) sì, nella stessa chat.

Le discese chiuse **non si chiedono più** come mappa sbarrata: sopra una
chiusa il gioco non posa niente di disegnato dall'esterno, il disegno resta
pulito e, quando l'eroe ci va, pianta un cartello di divieto disegnato in
codice (`DIVIETO` in `viste/pixel.js`). Il prompt «rifai la mappa con i
passaggi sbarrati» e il ritaglio delle pezze dallo strumento sono stati
tolti il 7/10/2026.

I personaggi dei prompt 4 e 5, quando arrivano, si ritagliano come gli
altri fogli (`atlante.py`, un foglietto accanto): il minatore che si chiama
## Prompt 7 — chi dà le missioni (il primo da fare)

Sei personaggi fermi sulla terra di sopra, ognuno nel suo posto
(docs/sotterraneo/missioni.md). Oggi sono figure disegnate in codice
(`viste/pixel.js`). Nella stessa chat dei prompt 4 e 5, che tiene la mano;
il minatore c'è già nel prompt 4.

```text
Sullo stesso fondo MAGENTA PIENO (#FF00FF), sei personaggi della stessa mano e della STESSA SCALA dei personaggi di prima (celle da 64×64 px): ognuno largo una cella e alto una cella e mezza, visto dall'alto a tre quarti, come gli eroi di un gioco di ruolo a 16 bit. Immagine 1024×1536 px verticale. Ogni posa sta da sola, staccata dalle altre da almeno mezza cella di magenta, senza ombra e senza prato sotto. NESSUNA PAROLA SCRITTA, NESSUN FUMETTO, NESSUN PUNTO ESCLAMATIVO.

Una riga per personaggio, due pose ciascuno: FERMO, e CHE PARLA (bocca aperta, una mano alzata).
1. La ragazza del pozzo: fazzoletto rosso in testa, due trecce castane, vestito azzurro col grembiule bianco, un secchio di metallo in mano.
2. Il mugnaio: tutto infarinato, berretto e camicia bianchi, un sacco di farina in spalla, grassoccio e allegro.
3. L'eremita dell'altare: saio grigio col cappuccio, barba bianca lunghissima, un bastone di legno alto più di lui.
4. La guardia della torre: elmo di ferro col pennacchio rosso, cotta di maglia e tunica rossa, una lancia dritta accanto, annoiata.
5. Il pescatore dello stagno: cappello di paglia a tesa larga, giacca blu, la canna da pesca sulla spalla col filo che pende.
6. Il boscaiolo: berretto verde, barba castana, camicia a quadri rossi e neri, l'ascia appoggiata alla spalla.
Sono amici: nessuna arma rivolta verso chi guarda.
```

Controllo: le due pose dello stesso personaggio hanno la stessa sagoma e
gli stessi colori; si distinguono a colpo d'occhio anche piccoli (il
secchio, il sacco bianco, il bastone, la lancia, la canna, l'ascia); sono
alti come il minatore. Nel foglietto: `ragazza-fermo-0`, `ragazza-saluta-0` (il gioco usa il saluto, non «che parla»),
`mugnaio-fermo-0`… (`strumenti/sprite/FORMATO.md`).

## Prompt 8 — le cose delle missioni (il secondo)

Le cose da trovare galleggiano sopra un forziere d'oro, e oggi sono emoji
(`dati/missioni.js`); il mostro col nome porta una corona, anche lei
un'emoji. Nella chat degli oggetti (`bottino-e-arredo.png`), allegandolo,
così la mano è quella delle cose per terra.

```text
Sullo stesso fondo MAGENTA PIENO (#FF00FF) e nella STESSA MANO del foglio di oggetti allegato, sei piccoli oggetti da 16×16 pixel di gioco ciascuno (disegnati a quadrati di 4×4 px: 64×64 px l'uno), staccati fra loro da almeno 32 px di magenta, in una riga. Immagine 1024×256 px. Senza ombra, senza contorno bianco, NESSUNA SCRITTA.
1. Una collana di perle con un ciondolo rosso.
2. Un mazzo di tre chiavi di ferro antiche su un anello.
3. Un'ascia da boscaiolo vecchia, col manico consumato.
4. Una canna da pesca d'oro, corta, col mulinello.
5. Una lanterna da minatore di ottone, spenta.
6. Una piccola corona d'oro con tre punte, da mettere sopra la testa di un mostro.
```

Controllo: si riconoscono a 16×16; l'ascia non sembra un'arma da
impugnare (è vecchia, storta); la corona sta in mezza cella.

`minatore-fermo-0` prende da solo il posto della figura disegnata in codice,
e così `armaiolo-fermo-0`, `erborista-fermo-0`, `rigattiere-fermo-0`, e i
sei del prompt 7 (`ragazza-fermo-0`…). Le cose del prompt 8 vanno in
`dati/missioni.js` come `sprite` della cosa, e la corona in `scena/tela.js`.

## Prompt 9 — l'incantatrice, e nove che mancano (il terzo foglio dei personaggi)

La quarta bottega del villaggio (docs/sotterraneo/bottega.md): **l'incantatrice**, che vende bacchette, bastoni, vesti di
stoffa e le boccette dell'energia. Oggi ha una figura provvisoria (la guaritrice col verde ruotato al viola, `tinta` in
`sopra-personaggi-1.json`): il foglio la rimpiazza. Un foglio da dieci personaggi costa come uno da due, quindi si chiedono pieni:
con lei, altre **nove figure che al gioco mancano**, ognuna con un posto già pensato (il perché sta sotto, e nessuna si ritaglia
finché un ruolo non la usa: la regola degli inutilizzati, `docs/core/sprite.md`).

Si chiede in una **chat nuova**, allegando `sopra-personaggi-1.png` (è la mano: contorno scuro, luce da in alto a sinistra,
pixel grossi, la stessa scala; il testo del prompt 7 non si è conservato, e questo lo rimpiazza). Il fondo e le pose sono quelli dei
primi due fogli: **fermo** e **che saluta**, perché il gioco usa il saluto, non «che parla».

```text
Allego un foglio di personaggi di un gioco di ruolo a 16 bit in pixel art. È lo STILE da seguire, senza copiare i personaggi: stesso contorno scuro, stessa luce da in alto a sinistra, stessi pixel grossi e regolari, stessa cura nei visi e nei vestiti, stessi colori caldi e un po' spenti, STESSA SCALA (ogni figura alta circa come quelle del foglio allegato, un adulto circa 260 px su 1536).

Disegna un foglio nuovo, 1024×1536 px verticale, su un fondo MAGENTA PIENO (#FF00FF), uniforme, senza sfumature, senza ombre e senza nessuna scacchiera. Una griglia invisibile di 4 colonne per 5 righe: dieci personaggi, ognuno in DUE pose affiancate nella sua riga. Prima posa: FERMO, in piedi, di tre quarti, lo sguardo verso chi guarda. Seconda posa: CHE SALUTA, la stessa figura con la stessa sagoma, gli stessi colori e gli stessi piedi nello stesso punto, ma la mano libera alzata e un sorriso con la bocca aperta. Ogni posa sta da sola, staccata dalle altre da almeno mezza figura di magenta, senza ombra a terra, senza prato, senza banco e senza oggetti sparsi; il magenta non compare mai DENTRO una figura. NESSUNA PAROLA SCRITTA, NESSUN FUMETTO, NESSUN NUMERO, NESSUN PUNTO ESCLAMATIVO.

I dieci personaggi, due per riga, dall'alto in basso:
1. L'incantatrice: una donna alta e sottile, una veste lunga viola scuro con ricami d'argento sull'orlo e sulle maniche larghe, i capelli neri sciolti con un cerchietto d'argento, una bacchetta lunga col cristallo azzurro in una mano e una boccetta blu alla cintura, un libro chiuso sotto il braccio. SENZA cappello a punta.
2. La cacciatrice del bosco: giubba di cuoio marrone, sciarpa rossa al collo, un arco corto e una faretra sulla schiena, stivali alti, i capelli raccolti in una treccia.
3. L'ortolana: cappello di paglia a tesa larga, grembiule color terra, un cesto di carote al braccio, le maniche rimboccate, allegra.
4. Il bambino del villaggio: alto due terzi degli adulti, capelli arruffati, camicia troppo grande e bretelle, una spada di legno infilata nella cintura (non in mano), sveglio.
5. La nonna: piccola e tonda, scialle grigio, chignon bianco, occhiali, un bastone e un gomitolo di lana nella tasca del grembiule.
6. Il nonno: magro, baffi bianchi, berretto di lana, giacca rattoppata, la pipa spenta in mano, un bastone da passeggio sotto il braccio.
7. Il cartografo viandante: cappello a tesa larga, lungo cappotto blu polvere, una bussola d'ottone aperta in una mano, rotoli di mappe sotto il braccio e un cannocchiale alla cintura.
8. La sentinella: elmo di ferro chiuso col naso, cotta di maglia, tunica rossa, uno scudo a goccia al braccio e la lancia appoggiata dritta accanto; nella seconda posa, invece di salutare, FA ALT: il braccio libero teso in avanti con il palmo aperto e un'espressione severa ma non cattiva.
9. Il cantastorie: berretto rosso con una piuma, giubba verde a righe, un liuto sulla schiena, la barba corta, un aspetto da chi ha girato il mondo.
10. La lavandaia: fazzoletto celeste in testa, vestito di lino chiaro con le maniche rimboccate, una grossa cesta di panni bianchi sul fianco, le braccia forti.

Sono tutti amici del villaggio: nessuna arma rivolta verso chi guarda, nessuno minaccioso. Ogni personaggio deve distinguersi a colpo d'occhio anche rimpicciolito (la bacchetta col cristallo, l'arco, il cesto di carote, il bambino piccolo, gli occhiali, la pipa, la bussola, lo scudo, il liuto, i panni).
```

Controllo: fondo magenta vero; dieci figure da due pose, ognuna con la stessa sagoma e gli stessi piedi nelle due pose (la mano alzata sporge, il resto no); alte come i personaggi del foglio allegato (il bambino più basso); nessun magenta dentro; nessuna scritta. Se la scala è sbagliata si rifà
con «riduci tutte le figure di un quarto» (o si allarga) nella stessa chat; più di due correzioni, si riparte con l'ultima buona allegata.

Cosa se ne fa, figura per figura (da cercare nel gioco e da scrivere nel foglietto `sopra-personaggi-3.json`, con le chiavi fra parentesi, `<chiave>-fermo-0` e `<chiave>-saluta-0` come gli altri):
- **L'incantatrice** (`incantatrice`): subito. Si toglie la riga `tinta` dai suoi due sprite in `sopra-personaggi-1.json`, che ha lo stesso nome, e si ritaglia dal foglio nuovo (stessa mano, `misura` e `nitido` come i dieci di prima). Il banco, il posto sulla mappa e le parole ci sono già.
- **La sentinella** (`sentinella`): dà il posto alla guardia disegnata in codice che si pianta davanti alle discese rosse ([zone.md](../../../../../docs/sotterraneo/zone.md#il-pallino-e-la-sentinella)); la posa «alt» è quella che serve a lei (non saluta: non fa passare).
- **Il cartografo** (`cartografo`): chi dà la bussola della mappa, che [da-fare.md](../../../../../docs/sotterraneo/da-fare.md) tiene ancora da fare.
- **La cacciatrice, l'ortolana, il bambino, la nonna e il nonno** (`cacciatrice`, `ortolana`, `bambino`, `nonna`, `nonno`): chi dà le missioni nuove (dodici oggi, sei persone): la collana è della nonna, la lanterna del nonno; la cacciatrice per le discese a cui servono archi, l'ortolana per l'orto del villaggio, il bambino per le missioni «accompagna / porta giù».
- **Il cantastorie e la lavandaia** (`cantastorie`, `lavandaia`): al villaggio, che ha i panni stesi e nessuno che li stenda, con «Novità?» che dà ai piccoli qualcosa da ascoltare.

## Com'è andata

- `mappa_sotterraneo.png` — il prompt 1, al primo colpo, il 6/10/2026:
  tutte le discese riconoscibili, i sentieri continui, nessuna scritta.
  I pozzi sono due (in alto a sinistra e in basso al centro): sette
  aperture per sei discese. Nel gioco dal 6/10/2026, com'è
  ([docs/sotterraneo/terra-di-sopra.md](../../../../../docs/sotterraneo/terra-di-sopra.md)).
  Non è pixel art vera: il pixel è morbido e non cade su una griglia di 4,
  quindi non si riduce a 256×384 (verrebbe impastata) ma si tiene intera.
- `mappa_sotterraneo_2.png` — il prompt 6, al primo colpo, il 7/10/2026:
  il villaggio con la piazzetta, il pozzo da cui si beve e i tre banchi
  senza persone (incudine sotto la tettoia, banco di boccette e erbe,
  carretto), il fiume col mulino e il ponte, i campi, la torre in rovina e
  l'altare. Nessuna discesa nuova, nessuna scritta. Il bosco non combacia
  del tutto con la prima mappa alla giunta (a sinistra il prato arriva al
  bordo in due punti, a destra è bosco ovunque) e il sentiero che esce a
  1147 px dall'alto non entra: ci pensa lo strumento (sfuma la giunta a
  blocchi nel bosco e stende un pezzo di sentiero già disegnato). Il
  risultato regge a occhio sul telefono; il difetto che resta è un sasso
  tagliato dal bordo che si ripete specchiato (riquadro [980, 940, 90, 140]
  sulla tela). Nel gioco dal 7/10/2026.
- `sopra-personaggi-1.png` e `sopra-personaggi-2.png` — i prompt 4, 5 e 7 messi insieme, 13/10/2026, dall'utente (copie di un foglio «Griglia Pixel Art di Personaggi Fantasy» e di `sopra_4.png`; il testo esatto non si è conservato): dieci personaggi, ognuno in due pose, **fermo e che saluta** (non «che parla» né «che indica»: il gioco usa il saluto, `<nome>-saluta-0`). Venuti bene al primo colpo: stessa mano, stessa luce, riconoscibili a colpo d'occhio (il martello, il cappuccio verde, il sacco viola, il sacco bianco, il bastone, la lancia, la canna, il secchio, l'ascia), le due pose con la stessa sagoma e gli stessi colori. Il primo foglio ha 8 personaggi in 4 righe da due; il secondo il minatore, la ragazza e il boscaiolo, che escono **più grandi** di circa un quarto (una scala per foglio, scritta nel foglietto). Non venuto: **il minatore del primo foglio nella seconda posa non saluta, mostra una bussola** (bella, tenuta nelle note del foglietto per la bussola della mappa); sta nel gioco il minatore del secondo. **La canna da pesca**: il filo bianco di un pixel sul magenta lascia un rosa chiaro e chiude una macchia di magenta fra canna, filo e mano che l'allagamento non raggiunge: lo toglie `buchi` con tolleranza larga (90), e il filo resta un filo. Nel gioco dal 13/10/2026 col pezzo nitido: a 22 pixel un viso dipinto era una macchia.
