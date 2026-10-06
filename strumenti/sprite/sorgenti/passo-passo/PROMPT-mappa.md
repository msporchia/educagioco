# Scheda di prompt — la mappa delle isole di Passo passo

La mappa delle isole (docs/passo-passo/mappa.md) disegnata in codice è
«troppo grezza». Si fa come la terra di sopra del sotterraneo (vedi
`../sotterraneo/generati/PROMPT-terra-di-sopra.md`): **un fondale dipinto**
tenuto com'è, e il codice ci posa sopra solo le caselle delle tappe, il
segnalino, le stelline, i lucchetti e il fumetto. Le caselle seguono una
strada segnata a mano sul fondale (un foglietto), non quella che il
generatore avrà disegnato a caso.

Tre fondali, uno per pezzo di mappa, **nella stessa chat**, così hanno una
mano sola:

1. `isole_1.png` — il mondo del coniglio dei piccoli: prato, salto, ghiaccio, massi, buche (24 tappe);
2. `isole_2.png` — il pascolo del cane (11 tappe), e le quattro isolette del cane;
3. `isole_3.png` — il mondo dello zaino: ripeti, fino a, se, tutto il mondo (21 tappe del coniglio).

Si allega al primo prompt la foto di una partita (`test/scatti/passo-grande.png`
o una schermata del telefono): è lo stile del gioco.

## Prompt 1 — il mondo del coniglio

```text
Disegna in pixel art a 16 bit, vista dall'alto a tre quarti, la MAPPA DEL MONDO di un gioco per bambini, come la mappa delle isole di Super Mario World: un fondale verticale da 1024×1536 px, ogni pixel del disegno è un quadrato di 4×4 px.

Allego una schermata del gioco: è lo STILE (lo stesso prato, gli stessi cespugli, la stessa tana, la stessa luce allegra e i colori pieni). Un coniglietto bianco ci dovrà saltare da una tappa all'altra.

Dal basso verso l'alto, CINQUE ISOLE nel mare azzurro, ognuna più grande di quanto sembri (circa un terzo della larghezza dell'immagine, tranne la prima che è più larga), unite da ponti di assi di legno:
1. in basso, IL PRATO: erba, fiori, un orto con le carote, la tana del coniglio da cui si parte;
2. IL SALTO: un ruscello che taglia l'isola, con tronchi e sassi per saltare;
3. IL GHIACCIO: un lago gelato e un po' di neve, sassi che spuntano dal ghiaccio;
4. I MASSI: grandi massi tondi e un fiumiciattolo con un ponte di sasso;
5. in alto, LE BUCHE: terra smossa con buche dai bordi colorati (rosso, blu, giallo) a coppie.
Su ogni isola un SENTIERO di terra battuta che serpeggia da un ponte all'altro, ben visibile e largo: è lì che metterò le tappe, quindi niente alberi o sassi sopra il sentiero.
In cima, sull'ultima isola, un CARTELLO di legno a due frecce senza scritte, accanto a una seconda tana più grande: è il bivio.

Il mare attorno vive: onde, qualche scoglio, un'anatra, ninfee vicino alle rive. Niente personaggi sul sentiero, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: le cinque isole si distinguono a colpo d'occhio; il sentiero è
continuo da un ponte all'altro e libero; niente scritte. Se il sentiero è
interrotto o coperto, una correzione mirata («rifai uguale ma col sentiero
libero da un ponte all'altro»).

## Prompt 2 — il pascolo del cane

```text
Nella stessa mano e alla stessa scala della mappa che hai appena fatto, un secondo fondale verticale da 1024×1536 px: IL PASCOLO DEL CANE PASTORE.
In basso una tana uguale a quella del bivio, da cui sbuca il cane. Sopra, una GRANDE ISOLA di pascolo: erba più chiara e più gialla del prato, staccionate di legno, cespugli, un ruscello col guado, un laghetto gelato in un angolo, e in cima un grande RECINTO col cancello aperto e un fienile: è dove finisce la strada. Un SENTIERO di terra battuta largo e libero serpeggia dalla tana al recinto.
Ai lati, staccate dall'isola grande e nel mare, QUATTRO ISOLETTE piccole tutte diverse, ognuna con una tana e una piccola stalla di legno.
Niente animali, niente personaggi, niente scritte, niente numeri, nessuna cornice.
```

## Prompt 3 — il mondo dello zaino

```text
Nella stessa mano e alla stessa scala, un terzo fondale verticale da 1024×1536 px: IL MONDO DELLO ZAINO, per i bambini più grandi: un po' più magico e ordinato del primo.
Dal basso verso l'alto, QUATTRO ISOLE unite da ponti di legno:
1. IL RIPETI: colline a terrazze e un viale alberato dritto, file di cose uguali che si ripetono (alberi in fila, stalle in fila);
2. FINO A: scale e pianerottoli di pietra che salgono, e lastre colorate nel terreno (rosse e blu);
3. IL SE: colline morbide con cartelli senza scritte e lastre colorate agli incroci;
4. TUTTO IL MONDO: in cima, un'isola che mescola tutto — un po' di ghiaccio, massi, un ruscello, lastre colorate — con una spirale di sentiero.
Su ogni isola un SENTIERO largo e libero da un ponte all'altro. In fondo a sinistra la tana da cui si arriva dal bivio.
Niente personaggi, niente scritte, niente numeri, nessuna cornice.
```

## Com'è andata

(vuoto: si scrive quando arrivano i fondali)
