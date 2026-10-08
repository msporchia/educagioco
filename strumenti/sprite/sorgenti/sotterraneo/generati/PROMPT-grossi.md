# Scheda di prompt — i mostri grossi del sotterraneo

I sette mostri grossi (docs/sotterraneo/grossi.md) sono disegnati in codice
(`src/giochi/sotterraneo/scena/grossi.js`): 32×32 pixel, due caselle per
due, quattro figure e sette tavolozze. **Questa scheda si usa solo quando
l'utente li ha approvati così** e vuole renderli epici: allora si fanno
dipingere, e il foglio entra come gli altri mostri (un foglietto `.json`
accanto all'immagine, `strumenti/sprite/FORMATO.md`).

## Le misure che il codice si aspetta

Ogni mostro sta in un quadrato di 32×32 pixel di gioco, cioè 128×128 px
nell'immagine (un pixel del disegno è un quadrato pieno di 4×4 px), guarda
verso destra (il codice lo specchia), poggia i piedi sul bordo basso, e
lascia due pixel di gioco liberi tutto intorno per il contorno.

| | nome | com'è oggi in codice | colori |
|---|---|---|---|
| 1 | Re Ossuto | il re scheletro col mantello e la corona | osso, mantello viola, corona d'oro |
| 2 | Grumo | l'orco con la mazza alzata | pelle verde, mazza di legno scuro |
| 3 | Fiammetta | la melma di fuoco, due occhi | arancio e giallo, cuore bianco |
| 4 | Zannaverde | il ragno con otto occhi | nero e verde veleno |
| 5 | Gorgo | la melma d'acqua nera | blu notte, riflessi azzurri |
| 6 | Minotto | il bruto con le corna | marrone, corna color osso |
| 7 | Carbonchio | il re scheletro di brace | ossa annerite, crepe arancio |

## Come si fa

1. **Una chat nuova**, allegando `sotterraneo_4.png` (la cripta: è lo
   stile), `mostri-1.png` (la misura e il contorno dei mostri di oggi) e
   uno scatto dei grossi in codice (`node test/esegui.mjs sotterraneo-eroe
   --scatti`, `test/scatti/eroe-grosso.png`): è la forma.
2. Il prompt qui sotto. Una o due correzioni mirate; oltre si riparte con
   l'ultima buona allegata.
3. Si salva qui accanto come `grossi_1.png` col suo `grossi_1.json`, e in
   «Com'è andata» si scrive cosa è venuto bene.

## Il prompt

```
Disegna in pixel art a 16 bit sette mostri grossi di un gioco di ruolo per bambini dai sei ai dodici anni, nello stile dell'immagine allegata della cripta: stesso contorno scuro di un pixel, stessa luce da in alto a sinistra, ogni pixel del disegno è un quadrato pieno di 4×4 px. Sono i boss in fondo a ogni sotterraneo: devono fare un po' paura, come in Diablo, ma niente sangue né cose orribili. L'altra immagine allegata (mostri-1) dà la misura dei mostri normali: questi sono grandi il doppio in altezza e in larghezza.

Su un fondo MAGENTA PIENO (#FF00FF), in una riga, sette quadrati di 128×128 px separati da 32 px di magenta:
1. Re Ossuto: un re scheletro con una corona d'oro storta e un mantello viola strappato, uno scettro d'osso.
2. Grumo: un orco verde massiccio con una mazza di legno alzata sopra la testa.
3. Fiammetta: una melma di fuoco arancio e gialla, il cuore bianco, due occhi cattivi, gocce di fuoco che cadono.
4. Zannaverde: un ragno nero grande con otto occhi verdi e le zanne verdi di veleno.
5. Gorgo: una melma d'acqua nera e blu notte con riflessi azzurri, una bocca larga.
6. Minotto: un bruto marrone con due corna color osso, i pugni grossi, un anello al naso.
7. Carbonchio: un re scheletro di brace, le ossa annerite piene di crepe arancio che brillano, una corona di ferro.

Ogni mostro guarda verso destra, poggia i piedi sul bordo basso del suo quadrato e lascia 8 px liberi intorno. Niente ombra per terra, niente testo, niente sfondo dentro i quadrati: solo magenta.
```

## Com'è andata

Non ancora fatta.
