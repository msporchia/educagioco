# Le quindici tappe del castello

Che cosa racconta ogni campagna, perché i percorsi sono quelli, e che cosa dei
terreni del **Generale** si è potuto riusare e che cosa no.

I dati stanno in `src/data/campagne-castello.js` — nomi, terreni, mostri,
tracciati — e i disegni in `src/grafica/terreni/`. Qui non c'è un numero di
equilibrio: quelli li mette `src/data/castello.js`, che di una tappa legge
`calcoli` e `cap` e ne ricava ondate, energia, prezzi e postazioni.

Per controllare che le quindici mappe stiano in piedi:

```bash
node strumenti/valida-percorsi.mjs
```

---

## 1 · Le tre campagne

| | racconto | torri | debolezze | calcoli |
|---|---|---|---|---|
| 🌲 **Bosco** | la scuola: si impara a costruire e a potenziare | entrano una alla volta, `add` → `sub` → `mul` → `div` | dalla seconda tappa | 6 · 7 · 8 · 10 · 12 |
| 🕯️ **Sotterraneo** | tutte e quattro aperte: non si sblocca più niente, si sceglie | tutte | sì | 9 · 11 · 13 · 16 · 19 |
| 🏰 **Mura** | dentro il castello, addosso al portone | tutte | sì | 14 · 18 · 22 · 26 · 30 |

Ogni campagna riparte più bassa della fine della precedente e arriva più in
alto: è il modello del Generale. Un calcolo = un acquisto, una torre costruita
o un gradino salito.

### Le quindici tappe, una riga a testa

| # | tappa | terreno | percorso | mostri (debolezza a giro) |
|---|---|---|---|---|
| 1 | Il sentiero 🌱 | `bosco-chiaro` | tre risvolte fra i tronchi, il tracciato più ripiegato del gioco | slime · goblin — *l'unica tappa senza debolezze* |
| 2 | Il guado 💧 | `bosco-guado` | si scende alla riva, si costeggia l'acqua, si risale | 🏹 goblin · 🔮 slime |
| 3 | La radura 🍀 | `bosco-radura` | il sentiero gira **attorno** alla radura: una torre in mezzo batte due tratti | 🏹 ragno · 🔮 slime · 🏹 pipistrello · 🔮 golem |
| 4 | Il folto 🌳 | `bosco-fitto` | quattro denti stretti, su e giù senza respiro | 🏹 pipistrello · 🔮 golem · 🏹 goblin · 🔮 fantasma |
| 5 | La radice 🪵 | `bosco-notte` | due grandi tornanti; il bosco si apre e i tracciati cominciano ad accorciarsi | 🏹 ragno · 🔮 fantasma · 💣 scheletro · 🏹 goblin · 🔮 golem · 💣 orco |
| 6 | La grotta 🕳️ | `grotta` | la caverna più larga, con il pilastro in mezzo | 🏹 pipistrello · 🔮 golem · 💣 scheletro |
| 7 | La miniera ⛏️ | `miniera` | gallerie a squadra, una sotto l'altra | 💣 scheletro · 🏹 goblin · 🔮 golem |
| 8 | Le fogne 🕸️ | `fogne` | due salti di quota dentro il collettore | 🔮 slime · 🏹 ragno · 💣 orco |
| 9 | La cripta ⚰️ | `cripta` | una scala regolare di loculo in loculo, tutta ad angoli retti | 🔮 fantasma · 🏹 arpia · 💣 scheletro · 🔮 golem · 🏹 pipistrello · 💣 orco |
| 10 | La gola ⛰️ | `gola` | stretta e quasi diritta, due gomiti e sei fuori | 💣 orco · 🔮 golem · 🏹 arpia · 💣 scheletro · 🔮 fantasma · 🏹 ragno |
| 11 | Il cortile 🚪 | `cortile` | si gira attorno al pozzo e si sale al camminamento | 🔮 golem · 💣 orco · 🏹 arpia |
| 12 | Il camminamento 🧱 | `camminamento` | la ronda sopra le mura, un lungo rettifilo e giù | 🏹 arpia · 🔮 fantasma · 💣 scheletro — due su tre volano |
| 13 | Il corridoio 🗝️ | `corridoio` | un dritto, un gomito, un dritto | 🏹 pipistrello · 🔮 slime · 💣 scheletro · 🏹 arpia · 🔮 fantasma · 💣 orco |
| 14 | La sala del trono 👑 | `trono` | si taglia la sala in diagonale; nessun tornante | 🔮 golem · 🏹 arpia · 💣 orco · 🔮 fantasma · 🏹 pipistrello · 💣 drago |
| 15 | Il torrione 🏰 | `bastione` | la rampa finale: quattro segmenti dall'ingresso alla porta | 🏹 ragno · 🔮 golem · 💣 orco · 🏹 arpia · 🔮 fantasma · 💣 drago |

---

## 2 · Perché quei percorsi

### Il riquadro non è verticale

Il gioco è in verticale, il campo no. `.campo` in `TowerDefense.vue` è alto
`min(52vh, 420px)` e largo al massimo 520px: su un telefono fa **390×420**, su
un computer **520×420**. È un riquadro quasi quadrato, semmai largo. Le mappe
sono disegnate per quella forma, e il validatore le misura su tutte e due.

Dentro ci sono i margini: `x ∈ [0.03, 0.97]` (una strada che tocca il bordo
sembra tagliata) e `y ∈ [0.25, 0.92]` (in alto a destra c'è la scheda del
mostro, e il castello in fondo al percorso è alto una cinquantina di unità
sopra il suo piede). Restano circa 370×280 unità utili: un nastro largo, non
una colonna.

### La difficoltà che sta nella mappa si chiama presidio

La lunghezza da sola non dice quasi niente. Il raggio di una torre va da 86 a
132 unità — su un campo largo 400, una torre ne vede un bel pezzo — e il danno
che un nemico incassa attraversando la tappa vale

```
    Σ (strada che ogni torre tiene sotto tiro)  ×  danno
    ──────────────────────────────────────────────────────
                     velocità del nemico
```

cioè dipende da **quanta strada ciascuna torre batte**, non da quanto è lunga
la strada. Una via diritta si fa battere da una torre una volta sola; una che
si ripiega si fa battere due o tre volte dalla stessa torre. Quel numero — la
strada per postazione, misurata in raggi d'arciere — è il `presidio`, ed è la
leva vera:

| campagna | presidio medio | lunghezza (telefono) |
|---|---|---|
| Bosco | **2,38** | 818 – 944 unità |
| Sotterraneo | **2,14** | 551 – 895 |
| Mura | **1,97** | 474 – 742 |

Il bosco si ripiega e perdona; le mura tirano dritto e non perdonano. Il
carattere segue: nel bosco curve larghe e diagonali, sotto terra gomiti netti e
rettifili, dentro il castello angoli retti e tracciati corti. L'ordine regge
qualunque sia il numero di postazioni (a 3, a 4 e a 6 postazioni il presidio
medio scende sempre nello stesso verso); il validatore lo misura a 6, che è il
numero di mezzo, per confrontare le quindici mappe con lo stesso metro.

**Dove le quindici si somigliano ancora troppo.** Il carattere è netto fra una
campagna e l'altra, meno *dentro* il bosco: *il sentiero* e *il folto* sono
quasi la stessa mappa — stesso numero di risvolte, stesso verso, lunghezze a
944 e 888 unità — e *il guado* e *la radice* ne sono due parenti stretti. Nel
bosco l'unica forma davvero sua è *la radura*, che gira attorno a un anello.
Sotto terra e sulle mura invece nessuna si ripete: la scala della cripta, la U
della miniera, il rettifilo del camminamento e la diagonale del trono si
riconoscono a colpo d'occhio. Se un giorno si vuole dare più faccia al bosco, i
due da rifare sono il sentiero e il folto — sapendo che rifare un tracciato
significa **ritarare** (`npm run tara`), perché la vita dei nemici è stata
trovata giocando su queste forme e non su altre.

### Il presidio è una media, e le medie non hanno buchi

Il presidio dice quanta strada batte una torre *in media*, e una media alta si
può fare anche male: due torri appiccicate su un tornante, e mezzo tracciato
senza nessuno. Finché le postazioni erano otto o dieci la cosa non poteva
succedere — così tante torri si distribuiscono da sole — ma quel numero non è
fermo: dipende da quanti `calcoli` costa la tappa, che è la manopola che si
gira più spesso di tutte. Questi tracciati sono stati disegnati quando le
postazioni erano tante.

Perciò accanto al presidio il validatore misura il **buco**: il tratto continuo
più lungo che nessuna torre vede, con le postazioni che la tappa ha davvero —
quel numero glielo dice `postiDi()`, non se lo inventa. E conta solo i buchi
*interni*, fra la prima e l'ultima piazzola: quelli in testa e in coda non
dipendono da come è disegnata la mappa ma dalla formula che dispone le
postazioni a `lunghezza/(n+1)`, che su qualunque tracciato lascia libero un
pezzo all'ingresso e uno davanti al castello.

Il risultato è che **le quindici mappe non hanno buchi interni**: il peggiore
sta a 42 unità su un raggio d'arciere di 92, ed è la grotta. È la conferma che i
tracciati non contavano sul numero di torri per essere coperti — si coprono da
soli, perché si ripiegano.

L'unico punto che vale la pena ricordare: **se una tappa scendesse a tre
postazioni**, la grotta lascerebbe 78 unità scoperte a metà percorso su uno
schermo largo. Oggi non succede e il validatore non fallisce per questo, ma lo
scrive in coda ogni volta che gira, perché è la sola delle quindici che a tre
postazioni non si copre da sola.

### Le due distanze minime, e perché sono due

Una postazione sta a 34 unità dal centro della strada, la sua piazzola ne è
larga 15, mezza strada ne misura 17. Fanno **66**: sotto quella distanza, una
piazzola finisce sopra l'altra corsia.

Ma il conto vale fra **corsie parallele**, non dentro un gomito: nell'incavo di
una curva la torre ci sta apposta, ed è metà del mestiere di chi la piazza — è
proprio da lì che viene il presidio. Il validatore distingue i due casi dalla
distanza *lungo il cammino*: fino a 200 unità è un gomito (minimo 52), oltre
sono due corsie diverse (minimo 62). La prima versione del controllo non
distingueva, e bocciava tutte le mappe interessanti tenendo buone solo le
diritte.

Le due cose che il validatore ha trovato e che a occhio non si vedono:

* **lo smussamento stringe i tornanti.** Chaikin sposta un vertice a
  `¼·prima + ½·vertice + ¼·dopo`: una risvolta a U fatta con due soli punti
  perde metà del suo raggio, e le due corsie si avvicinano molto più di quanto
  dice la spezzata. Le U si scrivono con quattro punti, o non si scrivono.
* **le postazioni si accavallano dove il tracciato rientra.** Le sei mappe di
  ieri arrivavano ad avere due piazzole a 7 unità l'una dall'altra: due torri
  disegnate una sopra l'altra. Le quindici di oggi stanno sopra le 47 unità
  nella fascia di postazioni che il gioco usa davvero.

### Le debolezze

Sono accese in quattordici tappe su quindici. Resta fuori solo la prima, che ha
una torre sola: con una torre sola la debolezza non è una scelta, è
un'etichetta. Due regole, verificate dal validatore:

1. ogni mostro dell'elenco è debole a una torre **che quella tappa mette a
   disposizione** — altrimenti la scheda indicherebbe un bottone chiuso;
2. in un elenco compaiono almeno due debolezze diverse.

Gli elenchi fanno di più: girano i tre bersagli (🏹 arciere, 🔮 magica,
💣 bombe) in modo che **due ondate di fila non chiedano mai la stessa torre**.
Chi tiene una torre sola altissima si trova scoperto un'ondata su tre. Il
ghiaccio non compare fra le debolezze: non fa danno, e il doppio di zero è zero.

Nel Bosco 2-4 le torri sono ancora due o tre, quindi lì gli elenchi alternano
solo arciere e magica; orco, scheletro e drago — che sono deboli alle bombe —
entrano da *La radice* in poi, che è la tappa in cui si comprano le bombe.

---

## 3 · I terreni: che cosa si è preso dal Generale e che cosa no

Gli ambienti del Generale (`src/grafica/ambienti/`) sono fatti per una **mappa a
griglia di caselle**: c'è un pavimento, ci sono muri che occupano celle intere,
e le torce si appendono alla faccia di un muro. Il campo del castello non ha
caselle e non ha muri: ha un riquadro libero, una strada che lo attraversa e
delle piazzole. Quindi il riuso non è tutto o niente.

### Si riusa (tutto `src/grafica/materiali/` e `luce.js`)

Sono già scritti per ricevere **una regione** e disegnarci dentro, non una
griglia. Prendono il contesto 2D nudo e un record di tavolozza, e funzionano
tali e quali su un campo libero:

* `POSE` — `erba` fa il prato del bosco, `roccia` il fondo scavato del
  sotterraneo, `lastre` il selciato delle mura;
* `variazioni` e `POSATURE` — usura, ombra, detriti, licheni, polvere,
  umidiccio: sono le macchie che fanno sì che due angoli dello stesso campo non
  siano la stessa fotografia;
* `DETTAGLI` — ciuffi, fiori, foglie, funghi, ciottoli, crepe, ossa, cristalli,
  ragnatele, monete;
* `semina`, `masso`, `concio`, `crepa` — gli attrezzi;
* `luceEBuio` e `torciaFerma` da `luce.js`: il velo di buio **bucato** dalle
  pozze delle torce, che è la cosa più difficile del disegno di un sotterraneo
  e sarebbe stato assurdo riscriverla. Ragiona in caselle, ma solo per ricavare
  due coordinate: le si passano le torce già convertite;
* `chiazzeDiLuce`, il sole che passa fra le foglie, che è nato per il bosco del
  Generale e serve identico al bosco del castello.

### Non si riusa

* **`MURI` e `dipingiMuri`.** Camminano sulla griglia cella per cella e
  decidono l'ombra portata da quali vicini sono pieni. Nel campo del castello
  non c'è una sola cella piena: quello che nel Generale è un muro, qui è un
  albero o uno spuntone, cioè un oggetto con la sua posizione.
* **`dipingiMappa` e `creaFondale` di `mappa.js`.** Mettono in fila i passaggi
  di una stanza (posa → variazioni → dettagli → torce → muri → buio) su una tela
  grande quanto la mappa, che poi scorre. Il campo del castello non scorre e non
  ha muri: la fila dei passaggi è un'altra, e sta in `terreni/indice.js`.
* **I record di `ambienti/`.** Le tavolozze *si potevano* importare, e non lo si
  è fatto apposta: sono i colori delle stanze del Generale, e un ritocco fatto
  là per una stanza di quel gioco non deve cambiare il colore di una tappa del
  castello. Le quindici tavolozze di `terreni/` sono partite da quelle — grotta,
  miniera, fogne, cripta, cortile, camminamento, corridoio, trono si chiamano
  così apposta — ma da qui in avanti vivono per conto loro.

### Che cosa c'è di nuovo

Tre cose, che in una stanza a caselle non esistono:

* **`terreni/vie.js`** — la strada. Tre tecniche: `battuto` (terra e ghiaia, il
  bosco), `acciottolato` (ciottoli bagnati con il filo d'acqua nel mezzo, il
  sotterraneo), `lastricato` (lastre squadrate con il cordolo, le mura).
* **la roba sparsa** — alberi, cespugli, sassi; spuntoni e grappoli di
  cristallo; casse, barili, bracieri, blocchi. Messi *lontano dalla strada e
  dalle piazzole* e ordinati per profondità, che è il motivo per cui non si
  possono seminare come un dettaglio.
* **le piazzole** — terra spianata col giro di sassi nel bosco, lastrone
  chiaro nella roccia, piattaforma bordata d'oro nel castello.

### Come sono organizzati

Tre terreni (**come** si dipinge) e quindici tavolozze (**con che colori**). Una
tappa nomina una tavolozza — `ambiente: 'bosco-guado'` — e da lì si risale al
terreno. Le tavolozze sono scritte **per differenza** dalla base della loro
campagna, quindi una tappa nuova costa cinque righe.

| terreno | tavolozze |
|---|---|
| `bosco.js` | `bosco-chiaro` (mezzogiorno) · `bosco-guado` (verde umido) · `bosco-radura` (il posto più chiaro) · `bosco-fitto` (cupo) · `bosco-notte` (quasi sera) |
| `sotterraneo.js` | `grotta` (arancio di fuoco) · `miniera` (giallo di lampada) · `fogne` (verde marcio) · `cripta` (menta fredda) · `gola` (azzurro: l'unica con un pezzo di cielo sopra) |
| `mura.js` | `cortile` (all'aperto) · `camminamento` (pietra sbiancata) · `corridoio` (chiuso, a torce) · `trono` (marmo e oro) · `bastione` (tramonto rosso) |

Un terreno espone: `via`, `maglia`, e le funzioni `fondo`, `strada`, `minuti`,
`sparso`, `piazzola`, `velo`.

### Tre cose imparate guardando il risultato

* **Il selciato delle mura si posa in diagonale.** Con i corsi orizzontali il
  pavimento leggeva come un muro di mattoni tirato su davanti alla telecamera,
  non come un cortile guardato dall'alto — perché i corsi orizzontali sono
  esattamente quello che fa un muro. Ruotato di mezzo radiante la cosa sparisce,
  e in più un cortile lastricato in diagonale è quello che si vede nei castelli
  veri. Nella stessa occasione la maglia è scesa a 19 unità: le pietre di un
  selciato sono corte.
* **Le lastre della via stanno due o tre per fila.** Una lastra sola larga
  quanto la strada, con il suo giunto davanti e dietro, fa una scala a pioli:
  le mura sembravano una ferrovia. A file sfalsate i giunti non si allineano mai.
* **Le torce si tengono lontane, ma la via resta accesa tutta.** Le pozze sono
  poche e distanti apposta — senza buio in mezzo la luce non si vede — ma il
  tracciato dev'essere leggibile dal primo all'ultimo metro, perché è l'unica
  informazione da cui dipende ogni decisione. Sotto la via corre quindi un filo
  di luce continuo, e il velo di buio lo smorza quanto smorza la roccia
  attorno: lo stacco resta.

---

## 4 · Che cosa manca per vederli in gioco

I terreni **non sono agganciati**: il campo dipinge ancora il prato unico di
`grafica/castello.js`. Il punto dove si ricuce non è più nella view — da quando
il riassetto ha spezzato il tower defense, chi dipinge il fondale è
`components/castello/CampoDiBattaglia.vue` — e appartiene a quel cantiere, non a
questo. Sono due righe.

La prima è l'import (**riga 22**): `campo` arriva da un altro posto, `PITTORI`
resta dov'è.

```js
// al posto di
import { PITTORI, campo as disegnaCampo } from '../../grafica/castello.js'
// due righe
import { PITTORI } from '../../grafica/castello.js'
import { campo as disegnaCampo } from '../../grafica/terreni/indice.js'
```

La seconda è la chiamata che dipinge il fondale (**righe 73-74**), dove si passa
l'ambiente della tappa. Il componente la tappa ce l'ha già in mano — è la sua
variabile `tappa`, quella che `apparecchia()` si tiene da parte:

```js
const dipingiFondale = () => campo.dipingiFondale(
  disegnaCampo({ via: motore.via, postazioni: motore.postazioni,
                 ambiente: tappa.ambiente, seme }))
```

`campo()` ha la stessa firma di quella di prima più `ambiente`, e un ambiente
che non esiste non rompe niente: `terrenoDi()` ripiega sul bosco di mezzogiorno,
perché uno sfondo sbagliato si gioca e uno sfondo assente no. La sola riga 22
basta quindi a far girare tutto — la 73 è quella che fa vedere le quindici
tavolozze invece di quindici volte la prima.

Una cosa che questo cantiere non può fare e va detta a chi tiene i dati: la
partita libera (`LIBERA` in `data/castello.js`) riusa la forma del *folto* ma non
dichiara nessun `ambiente`, e finirebbe quindi dipinta col bosco di mezzogiorno
sopra il tracciato di una tappa notturna. Le basta la riga `ambiente:
'bosco-fitto'`.
