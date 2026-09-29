# Calibrazione: quanto vale una moneta

Quanto deve costare una cosa e quanto deve rendere un gioco. Si legge prima
di scrivere un prezzo, un premio di tappa o un potenziamento che rincara: i
numeri sbagliati sono quasi sempre giusti *da soli* e sbagliati fra loro,
perché scelti guardando il proprio gioco.

## L'unità: 🪙1 = 10 secondi di esercizio

| quanto | monete | perché |
|---|---|---|
| un asteroide abbattuto | 🪙1 | una tabellina è un colpo d'occhio |
| una domanda vera (dungeon, corsa, sotterraneo, survivors, castello) | 🪙3 | leggere una consegna e scegliere fra quattro: mezzo minuto |
| un minuto di esercizi | 🪙6 | |
| **un'ora di esercizi** | **🪙360** | il numero da tenere in testa scrivendo un prezzo |

Un gioco paga **per il tempo di esercizio che ha davvero chiesto**, non per
partita: una tappa da otto domande vale 🪙24, che duri tre minuti o dieci. Il
resto del tempo è il gioco, ed è il premio.

## Nessun gioco paga una risposta sbagliata

Un tasto premuto a caso non è esercizio, quindi non vale una moneta. Quello
che un bambino cerca sono **le monete**: un premio di consolazione diventa il
modo più veloce di farne, a costo zero, e mette fuori scala tutto il resto.
Provato: Survivors dava una monetina a chi sbagliava la domanda del
potenziamento, e nella partita libera era l'unica fonte. Le monete si
prendono arrivando in fondo a una tappa.

## Lo stesso gioco rende sempre meno

Dopo **20 minuti** di oggi sullo stesso gioco le sue monete si
**dimezzano**, dopo **altri 20** finiscono; domani tornano piene. I giochi
⭐ consigliati dal genitore valgono **doppio** nei primi 20 minuti. Le
soglie le sposta il genitore, per tutti o per un gioco
([../genitori/varieta.md](../genitori/varieta.md)).

Non cambia l'unità: **🪙1 resta dieci secondi di esercizio**, ma di un
esercizio *vario*. Il quarantesimo minuto sullo stesso gioco non è
esercizio che manca al bambino, ed è la ragione per cui smette di pagare —
non un castigo, e il gioco resta aperto. Nei conti di questa pagina vuol
dire che **un'ora di esercizi vale 🪙360 se è fatta su tre giochi**; su
uno solo ne vale la metà. Scrivendo un prezzo si conta ancora 🪙360
l'ora: è quello che guadagna chi fa quello che si vuole che faccia.

Il cheat, i traguardi e le spese non passano da qui.

## Il cambio: spendere costa il doppio di studiare

La fattoria è il posto dove si spende. **Cinque minuti a spendere costano
dieci minuti di esercizi**; un gesto (seminare, raccogliere, avviare una
macchina) dura ~10 s, quindi **un gesto = 🪙2**. Costano tanto le
**strutture**, che si comprano una volta e lavorano per sempre.

## La scala delle spese

| fascia | tempo | monete | esempi |
|---|---|---|---|
| un gesto | 10–40 s | 1–4 | seminare, raccogliere, una crocchetta |
| una cosetta | 1–5 min | 6–30 | un cespuglio, una panchina, un cibo buono |
| una cosa vera | 5–25 min | 30–150 | un campo (22), un pezzo di terra (45), silo o dispensa (120) |
| una struttura | 25–60 min | 150–360 | mulino, fienile, pentolone (150), botteghe (170–300), recinti (95–260), un animale (75–120) |
| una spesa lunga | 1–2 ore | 360–720 | gli ingrandimenti alti, la terra dopo il decimo pezzo |

**Sopra le due ore non ci va niente**: un bambino gioca venti-trenta minuti
al giorno, e una settimana per una cosa sola è dove si smette di provarci.
Una spesa che non sta nella scala è sbagliata lei, non la scala.

## Gli aiuti che si comprano

Il 💡 del Generale, di Passo passo e del costruttore (`src/giochi/aiuti.js`):
i primi due gradini sono **gratis** (fanno ragionare), poi

| gradino | prezzo | in esercizio |
|---|---|---|
| un indizio | 🪙10 | 1 min 40 s |
| il primo che scrive | 🪙50 | 8 min |
| il penultimo | 🪙100 | 17 min |
| la soluzione intera | 🪙200 | 33 min |

- **Non è un mercato, è un freno.** Un livello rende 🪙4–30 la prima volta,
  la scala intera costa 🪙350–390 (dieci livelli). La domanda da farsi è
  «cosa succede se preme il 💡 finché il livello non si risolve da solo».
  Provato: la stella come prezzo. Non funziona: una stella in meno non si
  sente, e il livello era bruciato.
- **Nessun aiuto rende monete**: il premio alla prima vittoria è sempre
  molto meno della scala.
- **Un gradino pagato resta** (Generale, costruttore): pagarlo due volte
  per un tocco di troppo sarebbe una moneta tolta senza niente in cambio.

## Le curve: mai esponenziali

Una cosa che si compra più volte deve rincarare, ma **mai in modo
esponenziale**: le monete si guadagnano sempre allo stesso ritmo, quindi lo
sforzo riparte da zero ogni volta e il prezzo va scritto in ore.

- **Lineare** (`base · (1 + n·k)`) quando ogni copia vale la prima: campi e
  recinti della fattoria (`cresce` nel catalogo, k = 0,6 → 🪙22, 35, 48, 62…).
- **Logaritmica** (`base + passo · ln(1+n)`) quando migliora sempre la
  stessa cosa: gli ingrandimenti del silo (🪙40, 130, 185, 220, 250…: mai più
  di un'ora).
- **Il controllo a mente**: quanto costa la decima volta, in ore? Più di
  due → la curva è sbagliata.
- **L'eccezione è una curva col tetto vicino**: la fila delle macchine della
  fattoria raddoppia (🪙20 · 40 · 80 · 160 · 320, `giochi/fattoria/dati/coda.js`)
  e si ferma al quinto posto; l'ultimo costa meno di un'ora. Il tetto delle
  due ore lo controlla `guastiDellaFila`.

## Dentro una partita: l'energia del castello

L'energia ⚡ non esce dalla partita e non si cambia in monete: le monete di
una tappa sono **i calcoli che la tappa promette** (una ogni dieci, per il
livello), qualunque cosa costi una torre. La promessa regge perché il piano
dei calcoli conta i prezzi delle torri che il giocatore modello compra
davvero (`sequenzaTorri`, `pianoDi`). Due regole gemelle di quelle qui sopra:

- **un ⚡ rende lo stesso ovunque** (a meno di un premio per le torri
  avanzate), e lo misura `npm run dps`, non l'occhio;
- **la fretta si paga poco**: chiamare l'ondata prima rende al più sei ⚡,
  due acquisti in più per tappa. Di più diventerebbe un obbligo.

## Il livello di un gioco che si spende

La fattoria sale di livello **con le monete spese lì dentro**
(`giochi/fattoria/dati/livelli.js`), forma riusabile: soglia
`A·(n-1)² + B·(n-1)`, tanti livelli che danno poco, quello che arriva
mostrato in una pagina dei livelli e non spento nel negozio, mai un livello
che non porta niente.

- **La roba di un livello non paga il livello dopo**: ogni salto è il passo
  della formula più il costo di quello che il livello apre
  (`costoDelLivello`). Se no si compra, si sale, arriva altro: il livello
  misura il listino. Il controllo: comprato tutto quello appena arrivato,
  quanto manca al prossimo? «Quasi niente» è sbagliato.
- **Le altre sorgenti pagano esperienza, mai monete**, sulla stessa scala:

| cosa | rende | il freno |
|---|---|---|
| un ordine del mercato | ⭐ 6 + 2·gesti, +20% per fase oltre la prima (8 un grano, 110 una lasagna); +25% in bottega, i bonus della mongolfiera | mai più del tempo di campo che chiede (`guastiDelMercato`) |
| una bestia di casa rimessa a posto (tre bisogni a «sta benissimo») | ⭐ un quindicesimo del prezzo: 6 cane, 5 gatto, 8 pappagallo | una volta per ciclo: non prima che un bisogno riscenda sotto «sta bene» (≥ tre ore) |

Senza il ciclo, tre coccole da una monetina sarebbero una zecca di livelli.

## Dove stanno i numeri

- `src/giochi/fattoria/dati/coltivazioni.js` — gesti, silos, `costoIngrandimento`
- `src/giochi/fattoria/dati/catalogo.js` — prezzi, e `cresce` per chi rincara
- `src/giochi/fattoria/dati/mondo.js` — il pezzo di terra e il suo rincaro
- `src/giochi/*/dati/campagna.js` — i premi delle tappe, gioco per gioco

Quello che ancora non torna è in [da-fare.md](da-fare.md).
