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

## Prompt 5 — i mercanti del villaggio

Dal 7/10/2026 la roba si porta su e il mercante sta fuori, sulla terra di
sopra, come in Diablo. Si chiede nella chat della mappa, dopo il prompt 4,
alla stessa scala.

```text
Sullo stesso fondo MAGENTA PIENO (#FF00FF), tre mercanti del villaggio, della stessa mano e della STESSA SCALA della mappa (celle da 64×64 px, ogni pixel del disegno è un quadrato di 4×4 px): ognuno largo una cella e alto una cella e mezza, visto dall'alto a tre quarti come gli eroi di un gioco di ruolo a 16 bit, dietro un piccolo banco o accanto alla sua merce. Immagine 1024×1536 px verticale. Ogni posa sta da sola, staccata dalle altre da almeno mezza cella di magenta, senza ombra e senza prato sotto. NESSUNA PAROLA SCRITTA, NESSUN FUMETTO.

Una riga per mercante, due pose ciascuno: FERMO, e CHE SALUTA (una mano alzata, sorridente).
1. L'armaiolo: grembiule di cuoio, braccia forti, un'incudine e una spada appoggiata accanto.
2. L'erborista: mantella verde, un cesto di boccette colorate e mazzi d'erbe, una torcia spenta appesa al banco.
3. Il rigattiere: cappello a tesa larga, un carretto o un banco pieno di cianfrusaglie (un elmo ammaccato, un calice, un sacco), l'aria furba ma simpatica.
Sono amici del villaggio: nessuno punta un'arma verso chi guarda.
```

Controllo: le due pose dello stesso mercante hanno la stessa sagoma e gli
stessi colori; si capisce a colpo d'occhio chi vende armi, chi pozioni e
chi compra; sono alti come un eroe del gioco.

## La mappa si tiene intera

Il prompt 1 è uscito così bene (`mappa_sotterraneo.png`) che la mappa si
tiene **com'è**, un'immagine sola: le strade ci sono già, e il codice ci
mette sopra solo le cose che cambiano (le discese chiuse, chi ti indica
la strada, i sassi che luccicano, la nebbia) e lo spazio dove si cammina.
I prompt 2 e 3 non servono più; il 4 (i personaggi) sì, nella stessa chat.

Le discese chiuse si chiedono **come la stessa mappa ritoccata**, sempre
nella chat della mappa: il codice ritaglia dal ritocco solo il riquadro
di ogni discesa e lo posa sopra l'originale, quindi conta che dentro quei
riquadri le cose stiano esattamente dov'erano.

```text
Rifai ESATTAMENTE questa mappa, identica in ogni pixel — stessa inquadratura, stessa misura (1024×1536), stessi alberi, sentieri, case e sassi, nello stesso posto — con una sola differenza: tutti i passaggi che scendono sotto terra sono CHIUSI, sbarrati in modo che si capisca che per ora non si entra, e che un giorno si aprirà:
- i due pozzi: un coperchio di assi inchiodate sulla bocca;
- la botola di legno: due assi inchiodate di traverso e una catena col lucchetto;
- l'ingresso della miniera: assi inchiodate a croce sull'armatura, il binario resta;
- la scala nello stagno e la scala sotto l'arco di pietra: una grata di ferro col lucchetto sopra i gradini;
- il buco con la scaletta: la scaletta tirata su e assi di traverso sulla bocca.
Le chiusure stanno DENTRO la sagoma di ogni passaggio, non la allargano. Nient'altro cambia. NESSUNA PAROLA SCRITTA.
```

Controllo: affiancata all'originale, fuori dalle sette discese non deve
cambiare niente (si guarda ai bordi dei riquadri).

### Come entra nel gioco

Il meccanismo c'è già: ogni posto ha il suo riquadro nel foglietto
`../terra-di-sopra.json` (`posti.<nome>.riquadro`, in pixel della mappa), e
sopra una discesa chiusa il gioco posa il ritaglio di quel riquadro; finché
il ritaglio non c'è, un velo scuro col lucchetto.

1. Si salva qui accanto come **`mappa_sotterraneo_chiusa.png`** (se torna a
   un'altra misura, lo strumento la riporta a 1024×1536 prima di ritagliare).
2. `python3 strumenti/sprite/terra-di-sopra.py --provino` e si guarda
   `tmp/terra/provino.png`: ogni sbarramento deve stare dentro il suo
   riquadro giallo. Se ne esce, si allarga il riquadro nel foglietto (non
   l'immagine).
3. `python3 strumenti/sprite/terra-di-sopra.py`: il modulo
   `src/giochi/sotterraneo/dati/terra-mappa.js` ora ha le sette `PEZZE`, e
   il gioco smette da solo di disegnare il velo.
4. Si guarda col dito il confine di ogni pezza aprendo una discesa chiusa
   (`node test/esegui.mjs sotterraneo-terra --scatti`, foto `terra-chiusa`):
   un riquadro che si vede è un ritocco che ha spostato qualcosa.

I personaggi del prompt 4, quando arrivano, si ritagliano come gli altri
fogli (`atlante.py`, un foglietto accanto): il minatore che si chiama
`minatore-fermo-0` prende da solo il posto della figura disegnata in codice.

## Com'è andata

- `mappa_sotterraneo.png` — il prompt 1, al primo colpo, il 6/10/2026:
  tutte le discese riconoscibili, i sentieri continui, nessuna scritta.
  I pozzi sono due (in alto a sinistra e in basso al centro): sette
  aperture per sei discese. Nel gioco dal 6/10/2026, com'è
  ([docs/sotterraneo/terra-di-sopra.md](../../../../../docs/sotterraneo/terra-di-sopra.md)).
  Non è pixel art vera: il pixel è morbido e non cade su una griglia di 4,
  quindi non si riduce a 256×384 (verrebbe impastata) ma si tiene intera.
