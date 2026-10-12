# Scheda di prompt — i mostri grossi del sotterraneo

I sette mostri grossi (docs/sotterraneo/grossi.md) oggi si vedono con lo
**sprite del bestiario della loro specie, ingrandito, con una corona**
(Re Ossuto e Carbonchio sono lo scheletro e il gigante, Grumo e Zannaverde
l'orco, Fiammetta e Minotto il troll, Gorgo il gigante). Sono i boss, la cosa
che ai bambini piace di più: **li dipinge ChatGPT, non li disegna il codice**,
perché lo stile resti quello dei mostri di `mostri-1.png`. Questa scheda dà i
prompt, **uno per volta, nell'ordine della tabella di grossi.md**: prima i
grossi delle prime discese, che i bambini vedono di più.

Quando un'immagine arriva, **prende da sola il posto del ripiego**: basta che
l'atlante abbia `grosso-<chiave>-fermo-0` (la chiave è quella di
`dati/grossi.js`: `grosso-ossuto-fermo-0`, `grosso-grumo-fermo-0`…), come
`armaiolo-fermo-0` per i mercanti. Non serve toccare il codice. Il dipinto è
a misura vera (32×32 pixel di gioco, due caselle per due) e non porta la
corona: se il mostro ne ha una, la dipinge il modello.

## Le misure che il codice si aspetta

- Ogni fotogramma sta in un quadrato di **32×32 pixel di gioco**, cioè
  128×128 px nell'immagine (un pixel di gioco è un quadrato pieno di 4×4 px,
  scala 4 come i fogli di `sorgenti/creature/`), con i piedi sul bordo basso della figura.
- **Guarda verso destra** (il codice lo specchia quando serve).
- Quattro fotogrammi di **respiro** (`fermo-0` … `fermo-3`): la figura è la
  stessa, cambia di un pixel o due l'altezza del petto e della testa. Da
  sveglio il codice li gira più in fretta.
- **Fondo magenta pieno** (#FF00FF), mai «trasparente»: ChatGPT dipinge la
  scacchiera. Nel foglietto `.json` si scrive `"fondo": [255, 0, 255]`
  (`strumenti/sprite/FORMATO.md`).

## Come si fa (per ognuno dei fogli)

1. **Una chat nuova per ogni foglio.**
2. Si allega **`mostri-1.png`** (in `strumenti/sprite/sorgenti/creature/`): è il riferimento di
   stile, la mano, il contorno scuro e i bagliori dei mostri che il gioco usa
   già. Non si allega altro: il resto lo dice il prompt.
3. Si incolla il prompt **uno per volta**, nell'ordine qui sotto: il primo
   prima del secondo. Una o due correzioni mirate; oltre, si riparte da una
   chat nuova con l'ultima immagine buona allegata.
4. Si salva qui accanto come `grossi-1.png`, `grossi-2.png` con il suo
   foglietto `.json` (`prompt` con la scheda e il testo usato, `scala` 4, i
   sedici o dodici `sprite` con la loro cella), e in «Com'è andata» si scrive
   cosa è venuto bene.

## Prompt 1 — i tre delle prime discese

Re Ossuto (la cripta dell'altare), Grumo (la scalinata antica), Fiammetta
(la torre in rovina). I tre che si incontrano per primi.

```text
Allego un foglio di mostri di un gioco di ruolo a 16 bit per bambini: è lo STILE da copiare, uguale, con lo stesso contorno scuro di un pixel, la stessa luce da in alto a sinistra, gli stessi colori pieni e gli stessi piccoli bagliori attorno ai mostri. Ogni pixel del disegno è un quadrato pieno di 4×4 px.

Disegna sullo stesso stile tre MOSTRI GROSSI, i boss in fondo ai sotterranei: devono fare un po' paura, come in Diablo, ma niente sangue e niente cose orribili. Sono grandi più o meno il doppio dei mostri normali del foglio allegato, e ognuno ha una faccia sola, inconfondibile.

Su un fondo MAGENTA PIENO (#FF00FF), uniforme, senza sfumature, senza ombre e senza scacchiera, immagine 1024×768 px: tre righe, una per mostro, quattro colonne, cioè quattro FOTOGRAMMI DI RESPIRO dello stesso mostro. Ogni fotogramma sta al centro di un quadrato di 256×256 px; il mostro è alto circa 128 px (mai più di 160), ha i PIEDI sullo stesso bordo basso in tutti e quattro i fotogrammi e guarda verso DESTRA. I quattro fotogrammi sono quasi identici: cambia solo di 4 px su o giù il petto e la testa, come un respiro. Il magenta non compare mai DENTRO un mostro. Niente ombra per terra, niente testo, niente numeri, niente cornice.

1. RE OSSUTO: un re scheletro alto e storto, una corona d'oro un po' storta sul teschio, un mantello viola strappato che gli cade dalle spalle, uno scettro d'osso in mano. Ossa color avorio, occhi neri con un puntino di luce.
2. GRUMO: un orco verde massiccio e panciuto, grosso come una porta, un gran dente storto, una mazza di legno scuro con i chiodi sollevata in una mano. Pelle verde oliva, una cintura di cuoio.
3. FIAMMETTA: una grande melma di fuoco, un cumulo arancio e giallo con il cuore bianco incandescente, due occhi cattivi, gocce di fuoco che cadono dal bordo. Resta una melma: niente braccia né gambe.
```

Controllo: i tre sono riconoscibili a mezza dimensione; stesso contorno e
stessa luce del foglio allegato; i piedi dei quattro fotogrammi di una riga
stanno alla stessa altezza; nessun pezzo di magenta dentro le figure.

## Prompt 2 — i quattro delle discese di mezzo e di fondo

Zannaverde (la grotta della scaletta), Gorgo (la scala sommersa), Minotto
(la botola segreta), Carbonchio (la miniera abbandonata). **Una chat nuova**,
con `mostri-1.png` allegato come sopra; se il primo foglio è piaciuto, si
allega anche `grossi-1.png` per tenere la mano.

```text
Allego un foglio di mostri di un gioco di ruolo a 16 bit per bambini: è lo STILE da copiare, uguale, con lo stesso contorno scuro di un pixel, la stessa luce da in alto a sinistra, gli stessi colori pieni e gli stessi piccoli bagliori attorno ai mostri. Ogni pixel del disegno è un quadrato pieno di 4×4 px.

Disegna sullo stesso stile quattro MOSTRI GROSSI, i boss in fondo ai sotterranei: devono fare un po' paura, come in Diablo, ma niente sangue e niente cose orribili. Sono grandi più o meno il doppio dei mostri normali del foglio allegato, e ognuno ha una faccia sola, inconfondibile.

Su un fondo MAGENTA PIENO (#FF00FF), uniforme, senza sfumature, senza ombre e senza scacchiera, immagine 1024×1024 px: quattro righe, una per mostro, quattro colonne, cioè quattro FOTOGRAMMI DI RESPIRO dello stesso mostro. Ogni fotogramma sta al centro di un quadrato di 256×256 px; il mostro è alto circa 128 px (mai più di 160), ha i PIEDI sullo stesso bordo basso in tutti e quattro i fotogrammi e guarda verso DESTRA. I quattro fotogrammi sono quasi identici: cambia solo di 4 px su o giù il petto e la testa, come un respiro. Il magenta non compare mai DENTRO un mostro. Niente ombra per terra, niente testo, niente numeri, niente cornice.

1. ZANNAVERDE: un ragno nero lungo come un carro, otto zampe, otto occhi verdi che brillano e due zanne color verde veleno che gocciolano.
2. GORGO: una grande melma d'acqua nera e blu notte, con riflessi azzurri, una bocca larga piena di bolle, due occhi pallidi. Resta una melma: niente braccia né gambe.
3. MINOTTO: un bruto marrone alto e curvo, due corna color osso, i pugni grossi come casse, un anello di ferro al naso, il petto peloso.
4. CARBONCHIO: un re scheletro di brace, le ossa annerite piene di crepe arancio che brillano, una corona di ferro nero, due occhi di fuoco.
```

Controllo: come il primo; Carbonchio non è uno scheletro uguale a Re Ossuto
(qui nero e arancio, lì avorio e viola); Zannaverde e Gorgo si leggono come
un ragno e una melma anche a mezza dimensione.

## Dopo l'immagine

1. Si salva con il suo foglietto `.json` (com'erano quelli dei mostri, in
   `git log -- strumenti/sprite/sorgenti/sotterraneo/generati/mostri-1.json`: `famiglia: "attore"`, `scala: 4`, `fondo: [255, 0, 255]`, e per
   ogni fotogramma `grosso-<chiave>-fermo-<n>` con `da` e `cella`).
2. Si rifà l'atlante (`python3 strumenti/sprite/atlante.py sotterraneo`,
   `docs/core/comandi.md`): `grosso-ossuto-fermo-0` e gli altri prendono da soli
   il posto del ripiego. Il test
   `unita/sotterraneo-rarita` controlla che ogni grosso abbia una figura
   (dipinta o di ripiego), quindi un nome sbagliato nel foglietto lo scopre
   il browser, non l'unità: si guarda uno scatto di `sotterraneo-eroe`.
3. Un grosso dipinto non porta la corona di ripiego: se il boss deve averla
   la dipinge il modello (Re Ossuto e Carbonchio sì).

## Com'è andata

Non ancora fatta: oggi ogni grosso è lo sprite della sua specie con la
corona (12 ottobre 2026).
