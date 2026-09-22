# Scheda di prompt — un foglio di edifici

Il metodo: si allega **un'immagine di base già fatta bene** e si dice
«nello stesso stile di questa». La scheda dice tutto quello che il
generatore altrimenti inventa: misura, vista, fondo, ombra, tavolozza,
appoggio, griglia. Il perché sta in
[`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md), §6.

Il prompt usato **si conserva nel foglietto** del foglio che ne esce
(campo `prompt`, vedi `FORMATO.md`): copiarlo e cambiare la riga
dell'oggetto è il modo di rigenerare un pezzo nello stesso stile. E si
copia **nello stesso momento in cui si salva il PNG** — rimandarlo vuol
dire perderlo, ed è già successo: di questa tornata si è conservato un
prompt su cinque.

## Cosa allegare — **l'ultimo foglio buono**, non `edifici.png`

Il primo foglio si allega a `edifici.png` intero (1536×1024), che ha il
fienile, il mulino a vento e il silo: gli edifici accanto a cui i nuovi
devono stare.

**Dal secondo in poi si allega il foglio buono precedente.** Non è la
stessa cosa: `edifici_2.png` porta con sé, gratis, la disciplina che nel
testo costa cinque righe — niente terreno sotto, niente ombra, il
disegno che finisce sul muro. Un'immagine dice quelle cose meglio di un
paragrafo, e il generatore le copia senza che gliele si spieghi.

## Il prompt

Le parti fra parentesi quadre si riempiono; il resto si manda così.

> Disegna un foglio di sprite in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza (legno caldo, tegole rosse e blu, pietra
> grigia), stesso contorno scuro di un pixel, stessa vista — facciata
> frontale vista da tre quarti dall'alto, come gli edifici allegati — e
> stessa luce da in alto a sinistra.
>
> Il foglio è 1536×1024 px, su **fondo trasparente** (PNG). Disponi
> **[N] edifici** su una griglia dichiarata di [4] colonne × [2] righe,
> celle di [384×512] px, ognuno centrato nella sua cella e appoggiato al
> bordo di sotto della cella lasciando 32 px di margine. Nessun edificio
> tocca il bordo della cella. Ogni edificio è largo circa 256 px e alto
> fra 220 e 290 px (nel gioco diventa 64×56–72 px: una cella del gioco
> sono 16 px, l'edificio occupa 4 celle di larghezza).
>
> **Il disegno finisce dove l'edificio tocca terra**: la soglia della
> porta, il gradino di pietra, il piede dei pali. Sotto e di fianco è
> tutto trasparente. **Niente prato, niente terra battuta, niente
> aiuola, niente ciuffi d'erba, niente ombra proiettata e nessuna
> macchia sotto**: il terreno e l'ombra li mette il gioco, e un edificio
> che se li porta addosso si vede perché ha una chiazza verde sotto
> mentre tutti gli altri no.
>
> **NESSUNA PAROLA SCRITTA, da nessuna parte**: né insegne con testo, né
> cartelli, né numeri, né lettere sui muri. Dove serve un'insegna è **un
> oggetto**: un cupcake, un gomitolo con l'ago, un paio di forbici, una
> pagnotta.
>
> Quello che appartiene a un edificio dev'essere **attaccato al suo
> disegno in un pezzo solo**: il fumo tocca il comignolo, le briciole
> toccano il davanzale, il vapore tocca la pentola. Niente pezzetti
> staccati che galleggiano nel vuoto.
>
> Da sinistra a destra, riga per riga:
> 1. [descrizione in una riga]
> 2. [descrizione in una riga]
> …

## Le due righe che erano sbagliate, e cosa hanno prodotto

Restano scritte perché il difetto che hanno fatto non si vede finché
non si guarda il foglio con l'occhio giusto.

**«con un filo d'erba o di fiori ai piedi come negli originali».** Era
falsa: fienile, stalla, pollaio e serra di `edifici.png` finiscono di
netto sul muro, senza niente sotto. Il generatore ha fatto quello che
c'era scritto e ha disegnato un prato con la terra battuta sotto ogni
edificio — e il pezzo più largo dello sprite non era l'edificio, era
l'ellisse d'erba. Al suo posto adesso c'è una regola che dice **dove
finisce il disegno**.

**«Niente scritte né insegne con parole»**, in tondo, in fondo a un
paragrafo. È il punto in cui ogni generatore scrive qualcosa lo stesso.
Va in maiuscolo, e le insegne vanno **dichiarate come oggetti**: dire
cosa disegnare funziona, dire cosa non disegnare no.

## Come si guarda se è venuto bene

Tre controlli, in quest'ordine — e nessuno dei tre è «sembra carino».

1. **Dov'è la riga più larga.** Si ritaglia ogni sprite dall'alfa e si
   guarda a che quota dell'altezza sta la riga con più pixel pieni. Se
   sta al **76–85%** c'è un prato: la cosa più larga del disegno è
   l'erba sotto. Se sta al **44–58%** è l'edificio, cioè il corpo della
   casa. È il controllo che ha trovato il difetto, e costa dieci righe
   di Python.
2. **La misura di gioco, che è la prova vera.** Si rimpicciolisce ogni
   pezzo alla misura a cui si vedrà — **63–70 px** per un edificio — e
   si guarda se il mestiere si distingue ancora. Un foglio bello che a
   sessantacinque pixel non dice niente è inutile: il bambino non vede
   mai il foglio.
3. **Accanto a quelli che ci sono già.** Il fienile è 78×54, il mulino a
   vento 44×70: un edificio nuovo che venisse 90 px sarebbe la cosa più
   grande del podere senza che nessuno l'abbia deciso.

**La scala non si dà per scontata, si misura.** `edifici_2.png` è
tornato 1248×832 e va a scala 4; `edifici_3.png` 1536×1024 e va a scala
5 — due fogli dallo stesso generatore, a due settimane di distanza, con
misure diverse. `python3 strumenti/sprite/misura.py <png> --figure`
stampa il rettangolo di ogni macchia, e da lì si sceglie il divisore che
porta i pezzi nella fascia giusta.

## Ritoccare o rifare

**Il ritocco è la via più economica quando il disegno è buono e sbaglia
una cosa sola.** «Togli il prato e la terra battuta sotto ogni edificio,
non toccare altro» ha funzionato al primo colpo, e ha salvato un foglio
che era giusto in tutto il resto.

Ma **l'editing di un'immagine ha un tetto di passaggi**: dopo un po' il
generatore smette di correggere e ricomincia a reinventare. Esaurito il
tetto si riparte da zero — e allora si allega **l'ultimo foglio buono**,
non l'originale.

## Il foglietto che ne esce

```json
{
  "__": "Gli edifici delle botteghe: telaio, panificio, caseificio…",
  "prompt": {
    "scheda": "PROMPT-edificio.md",
    "base": "edifici_2.png",
    "generatore": "[quale, e quando]",
    "testo": "[il prompt intero, così com'è stato mandato]"
  },
  "scala": 4,
  "fondo": "trasparente",
  "foglio": [312, 208],
  "cella": [1, 1],
  "famiglia": "figura",
  "sprite": {
    "telaio":   {"da": [7, 26], "cella": [65, 65]},
    "dispensa": {"da": [85, 20], "cella": [61, 67], "misura": [45, 49]}
  }
}
```

`"cella": [1, 1]` e coordinate in pixel del foglio ridotto: è quello che
serve quando il generatore la griglia non la rispetta fino in fondo, ed
è il caso normale. `misura` rimette in riga il pezzo che dal fattore
comune esce sbagliato — la dispensa era stata chiesta a 128 px ed è
venuta grande come le altre.

**`misura` non è solo estetica**: il piede di una voce di catalogo lo
ricava `piedeDalDisegno` dalla larghezza dello sprite, quindi un pezzo
più largo **occupa più celle**. Sostituire il disegno di una cosa che i
bambini hanno già posato in mappa senza rimetterla alla sua misura vuol
dire allargarle l'ingombro sotto i piedi.
