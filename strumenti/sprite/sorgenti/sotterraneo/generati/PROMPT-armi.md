# Scheda di prompt — sei pezzi di roba da rifare

Il giro dell'8 ottobre 2026 ha raddrizzato e bucato le figure della roba
(`buchi` e `specchia` nei foglietti di `bottino-e-arredo`, `scudi` e
`armature-e-vesti`; `strumenti/sprite/FORMATO.md`). Sei pezzi non si
correggono con un foglietto, perché il difetto è il disegno. **Questa
scheda si usa solo quando l'utente vuole farli rifare**: allora si fa un
foglio nuovo (`armi-2.png` + `armi-2.json`, a scala 3 come
`bottino-e-arredo`) e i pezzi vecchi si tolgono dai foglietti vecchi.

| pezzo (chiave nel gioco) | oggi | perché si rifà |
|---|---|---|
| Balestra (`balestra`) | un arco con due diagonali incrociate: sembra una trappola | la balestra vera ha il fusto in verticale e l'arco in croce in cima |
| Pugnale vampiro (`arma-1`) | pixel art 0x72, contorno bianco e nero | un'altra mano: accanto alle armi dipinte sembra di un altro gioco |
| Spada del ladro (`arma-2`) | pixel art 0x72, azzurra | come sopra |
| Bipenne solare (`arma-3`) | pixel art 0x72, azzurra, grande 16×24 | come sopra, e fuori scala |
| Amuleto d'ossa (`ossa`) | un grumo di ossa azzurrine, non si capisce cos'è | deve leggersi come un ciondolo |
| Scudo di ferro (`scudo-ferro`) | quasi nero, senza dettagli | accanto agli altri cinque non ha una faccia |

## Come si fa

1. **Una chat nuova**, allegando `bottino-e-arredo.png` (è lo stile, la
   misura e il fondo) e `scudi.png` (per lo scudo).
2. Il prompt qui sotto. Una o due correzioni mirate; oltre si riparte
   con l'ultima buona allegata.
3. Si salva qui accanto come `armi-2.png` con un `armi-2.json` fatto sul
   modello di `bottino-e-arredo.json` (`"scala": 3`, `"foglio": [418, 418]`,
   `"fondo": "auto"`, `"colori": 0`), **con `"buchi": true` sui pezzi che
   hanno un vuoto** (la balestra, il ciondolo): il vuoto resta nero sul foglio
   e lo toglie l'attrezzo. Si scrive il prompt mandato nel foglietto
   (`prompt`), subito.
4. In «Com'è andata» si scrive cosa è venuto bene.

## Il prompt

```
Disegna in pixel art dipinta a 16 bit sei oggetti per un gioco di ruolo per bambini, nello stesso stile, con la stessa luce da in alto a sinistra, lo stesso contorno scuro e la stessa grana delle immagini allegate (bottino-e-arredo e scudi). Su un fondo NERO PIENO (#000000), in due righe da tre, ogni oggetto in una casella da 200×200 px, centrato, con almeno 40 px di nero tutto intorno. Un solo oggetto per casella, niente ombra per terra, niente testo, niente mani.

Gli oggetti si vedono di fronte, dritti, in verticale:
- le armi sono in piedi, con la punta (la lama, la testa dell'ascia, il dardo) verso l'ALTO e l'impugnatura in basso, mai in diagonale;
- ogni vuoto chiuso (l'occhio, lo spazio fra due parti) è nero pieno #000000, non grigio e non sfumato.

1. Una balestra, puntata verso l'alto: il fusto di legno scuro in verticale, l'arco di ferro e corda in croce in cima, un dardo nel solco. Alta circa 70 px.
2. Un pugnale dalla lama rosso scuro con un filo nero, l'elsa nera e oro, un rubino sul pomo. Alto circa 60 px.
3. Una spada dritta dalla lama grigio acciaio, la guardia d'oro con due punte curve, l'impugnatura di cuoio rosso, un sacchetto di monete appeso al pomo. Alta circa 70 px.
4. Una bipenne: manico di legno, due lame grandi e tonde, color rame e oro, con una luce arancio come di sole sul filo. Alta circa 72 px.
5. Un ciondolo di ossa su una cordicella di cuoio: tre ossicini legati a stella con una pietra grigia in mezzo, la cordicella forma un anello aperto in cima. Alto circa 60 px.
6. Uno scudo di ferro a goccia: grigio-blu freddo con riflessi chiari, un bordo rialzato, quattro borchie, una croce di rinforzo in rilievo; più chiaro e dettagliato di uno scudo nero. Alto circa 66 px.
```

## Com'è andata

Non ancora fatta.
