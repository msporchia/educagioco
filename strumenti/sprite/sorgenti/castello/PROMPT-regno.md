# Scheda di prompt — la mappa del regno di Difendi il Castello

La scelta dei campi del castello diventa **una mappa del regno dipinta**,
come la terra di sopra del sotterraneo
(`../sotterraneo/generati/PROMPT-terra-di-sopra.md`): un fondale tenuto
com'è, più grande dello schermo nei due versi, con la vista che segue il
segnalino. Il codice ci posa sopra solo i posti dei campi, il segnalino,
le stelle, i lucchetti e il fumetto. Le quattro campagne
(`src/data/campagne-castello.js`) sono quattro regioni dello stesso regno,
non isole: si va a piedi, non per mare.

Una chat nuova. Si allega la schermata di una partita
(`docs/img/castello-gioco.png`): è lo stile dei campi, e il regno deve
sembrare lo stesso mondo visto da più in alto.

## Prompt 1 — il regno

```text
Disegna in pixel art a 16 bit, vista dall'alto a tre quarti, la MAPPA DEL REGNO di un gioco di difesa del castello per bambini: un fondale ORIZZONTALE da 1536×1024 px, ogni pixel del disegno è un quadrato di 4×4 px. La mappa si esplora nelle due direzioni, quindi le cose sono sparse su tutta l'immagine.

Allego una schermata di una partita: è lo STILE (lo stesso bosco di abeti, lo stesso sentiero di terra battuta, lo stesso castello dai tetti blu, la stessa luce allegra). Il regno è lo stesso mondo, visto da più in alto: le cose sono più piccole.

AL CENTRO il CASTELLO dai tetti blu con le bandiere rosse, sulla sua collina, con un villaggio ai piedi: è la casa da difendere. Dal castello partono quattro strade di terra battuta verso QUATTRO REGIONI, una per angolo:
1. in basso a sinistra, IL BOSCO: abeti fitti, una radura grande, un guado su un ruscello, un grande albero cavo con le radici;
2. in alto a sinistra, IL SOTTERRANEO: montagne di roccia grigia, l'ingresso di una grotta e di una miniera con le travi, una gola stretta fra le rocce, un'antica cripta di pietra (senza teschi);
3. in alto a destra, LE MURA: una lunga cinta di mura merlate con un camminamento, un cortile, un torrione alto, una porta col ponte levatoio;
4. in basso a destra, LA PALUDE: acqua verde e canne, isolotti, passerelle di legno, un delta che va verso il mare in un angolo.
In ogni regione la strada continua e SERPEGGIA toccando cinque o sei posti diversi della regione (radure, ponti, ingressi, piazzali): è lì che metterò i livelli, quindi la strada resta larga e libera, senza alberi o rocce sopra.

Niente personaggi, niente soldati, niente mostri, niente scritte, niente numeri, nessuna interfaccia, nessuna cornice.
```

Controllo: il castello al centro si riconosce; le quattro regioni si
distinguono a colpo d'occhio; ogni regione ha la sua strada continua e
libera con cinque o sei posti; niente scritte. Una o due correzioni
mirate; oltre, si riparte con l'ultima buona allegata.

## Com'è andata

(vuoto: si scrive quando arriva il fondale)
