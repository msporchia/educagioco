# I mostri e gli effetti 3D nel sotterraneo

Nel sotterraneo ([grafica-3d.md](grafica-3d.md)) i mostri non sono più sprite ma i modelli in codice dei
prototipi approvati (`poc/mostri-3d/`, `poc/mostri-3d.html` e le pagine per zona), con il loro respiro e il loro attacco; le
abilità dell'eroe, i colpi dei mostri e gli stati addosso sono gli effetti 3D di `poc/effetti-3d/` (provati in `poc/arena-3d.html`).
L'eroe era già passato al 3D (`scena3d/eroe3d.js`, dai prototipi di eroi, armi, armature e copricapi); la roba che porta è la
figura del suo oggetto, con l'alone della rarità ([roba-3d.md](roba-3d.md)).

## Prototipi e copie: `npm run promuovi3d`

I prototipi in `poc/` restano autonomi e non si toccano per il gioco. Il gioco usa una **copia generata** in `src/`:

| cartella | da dove | cosa |
|---|---|---|
| `scena3d/eroi3d/` | `poc/eroi-3d`, `armi-3d`, `armature-3d`, `copricapi-3d` | i quattro eroi, le armi della collezione, le armature, i copricapi |
| `scena3d/mostri3d/` | `poc/mostri-3d` (mostri, prati, bosco, palude, ceneri, draghi, monte, landa, varie) | i mostri, più `elenchi.js` (generato) con gli elenchi per zona |
| `scena3d/effetti3d/` | `poc/effetti-3d` (lancio, mischia, aure) | gli effetti delle abilità e degli stati |
| `scena3d/persone3d/` | `poc/persone-3d` | le persone del mondo di sopra ([persone-3d.md](persone-3d.md)) |
| `scena3d/roba3d/` | `poc/roba-3d` (aloni, e lame, bastoni, scudi, vesti, gioielli se pronti) | le figure della roba e gli aloni della rarità, più `moduli.js` e `catalogo-roba.js` (generati): [roba-3d.md](roba-3d.md) |

`strumenti/promuovi-3d.mjs` parte dalle radici di ogni gruppo, segue gli import (solo il referenziato: `mosse*.js` e le pagine
non entrano), mette tutto in una cartella per gruppo riscrivendo gli import, premette la riga «Generato da…» e mette
`"Emoji Gioco"` in testa ai font delle tele ([../core/emoji.md](../core/emoji.md)). **Le copie non si toccano a mano**: si cambia
il prototipo e si rilancia. Una zona di mostri che non si importa ancora (un agente la sta finendo) resta fuori da `elenchi.js` e
le sue specie restano sprite; entra al rilancio. `-- --controlla` non scrive ed esce con 1 se una copia è vecchia (lo fa anche
`unita/sotterraneo-mostri-3d`). Scritti a mano, accanto alle copie: `mostri3d/registro.js` ed `effetti3d/gestore.js` (il
comando cancella solo i file col suo segno).

## Il registro: specie → modello

`mostri3d/registro.js`. Per ogni specie (`dati/mostri.js`) un id `zona/chiave` degli elenchi, o un elenco per grado (comune,
magico, raro, leggendario: l'ultimo vale per i gradi più alti), o `null` = resta lo sprite. I grossi (`dati/grossi.js`) hanno il
loro modello; le varianti armate dello scheletro: l'arciere ha il suo modello, guerriero e mago impugnano un'arma della
collezione più ricca col grado (`userData.impugna`). La tabella:

| specie del gioco | modello |
|---|---|
| goblin, ratto, orco, fantasma (e fantasma azzurro), vespa, zombie, scheletro con scudo, melma rosa, cinghiale | prati (goblin rosso dal magico, cinghiale caporale dal magico) |
| scheletro, melma, draghetto | mostri.js (il draghetto è il drago carino); melma viola = la melma tinta di viola |
| lupo, ragno, fungo, granchio, serpente, pipistrello, mostro verde, tartaruga | bosco (col grado: lupo nero, bianco, capobranco; ragno nero; fungo viola…) |
| polpo | palude |
| diavoletto, spirito di fuoco, golem di magma, ghoul, teschio azzurro, mietitore, bestia cornuta, drago di lava | ceneri |
| golem e golem di pietra, golem di lava, golem di ghiaccio, spirito elettrico, grifone, troll e troll con la clava, gigante | monte |
| ent, ombra, mummia (antica dal raro), occhio, negromante | landa |
| drago | il drago grande: verde, azzurro, rosso, oro col grado |
| pianta (verde che frusta, viola che sputa spore), piranha (blu, rosso, nero), golem di muschio (anche fiorito e antico), scorpione (viola, di brace, regale), mostro viola (e scuro), pipistrello occhio (e gelido) | varie (`poc/mostri-3d/varie.js`, `poc/mostri-varie-3d.html`): il colore e la taglia crescono col grado |

I grossi: Re Ossuto → re non morto, Grumo → orco, Fiammetta → spirito di fuoco, Zannaverde → ragno, Gorgo e Sibilla → i loro
della palude, Minotto → minotauro, Carbonchio → drago di lava, Roccaverde → ent, Piumanera → grifone, Vulcanor → golem di
magma, Gelomagno → golem di ghiaccio, Falcenera → mietitore.

**Il gioco non si rompe mai**: un id che non c'è, una `crea` che si rompe o un'`anima` che si rompe mettono quel modello da parte
e torna lo sprite (`console.warn`). `&spegni=mostri3d` nell'indirizzo li spegne tutti; l'eroe non ha uno sprite di ripiego ([anteprime-3d.md](anteprime-3d.md)).

## Il contratto dei modelli

Dai prototipi (`poc/mostri-3d/prati.js`, in testa): `crea…()` → Group coi piedi a y = 0 e il davanti verso +z;
`userData.anima(t)` l'idle vivo, funzione del tempo; `userData.attacco = { tipo, durata (s), arrivo (frazione), proiettile:
{ tipo, origine } | null }` e `userData.attacca(p)`, p da 0 a 1, puro, da chiamare **dopo** `anima` (a p = 0 e 1 è la posa
di riposo); `userData.origine` l'Object3D da cui partono i colpi a distanza.

## In scena (`scena3d/mostro3d.js`, `cose.js`)

- **Una riserva per modello**: le istanze si riusano; lo stato di disegno del mostro (`cose.js`) tiene la sua finché si vede, a
  fotogramma finito chi non è stato preso si nasconde. Niente allocato a fotogramma oltre la prima volta.
- **Chi ha il modello**: i mostri visibili si ordinano (lo scontro per primo, poi i più vicini all'eroe) e i primi
  `ACCESI.mostri3d` (12) hanno il modello; gli altri restano sprite. Le regole di luce non cambiano: un mostro si vede solo nella
  luce di adesso ([luce.md](luce.md)); il modello prende le luci della scena come l'eroe 3D, e non fa ombra.
- **Misura**: alto quanto lo sprite che sostituisce × 0,72 (lo stesso rapporto dell'eroe), mai più largo di 1,5 celle (di più
  per i grossi); `ALTEZZA` corregge chi si misura male (il drago grande). `s.alto` diventa l'altezza vera: nomi, barre e
  galloni stanno sopra; `s.nome` resta lo sprite che sarebbe (per le prove).
- **Dove guarda**: l'eroe (sveglio o nello scontro), un poco girato verso la telecamera; chi cammina dove va; chi dorme di tre
  quarti come lo sprite. Gira col tempo (`verso`), mai coi fotogrammi.
- **Il lampo, la tinta, lo svanire**: su copie dei materiali per istanza accese solo quando servono, coi valori vivi
  dell'originale (così il respiro che pulsa resta). Chi cade si rovescia all'indietro, si ferma e svanisce coi tempi dello sprite.
- **Il dito**: i modelli sono «modellati» per `dito.js` (il raggio li prende); nello scontro vale il più vicino entro 44 px.
- **I pezzi fermi saldati** (`scena3d/salda3d.js`): le mesh che non si muovono rispetto al loro perno, con lo stesso materiale,
  diventano una. Chi si muove lo dice il modello: 64 istanti d'idle e l'attacco intero, chi cambia resta a sé. Si calcola una
  volta per modello. Da 8170 a 4354 mesh sui 72 modelli.
- **La pelle** (`salda3d.js`, `pelle`): quello che resta, anche ciò che si muove, diventa una SkinnedMesh per materiale con le
  mesh stesse per ossa; 642 mesh sugli 87 modelli ([prestazioni-3d.md](prestazioni-3d.md), «Meno chiamate»). `&spegni=pelle` la toglie.

## Gli attacchi e gli effetti (`racconto.js`, `effetti3d/gestore.js`)

- **Le chiavi coincidono**: gli effetti dei prototipi hanno le chiavi di `dati/effetti.js` (`palla`, `taglio`, `fulmine`, `nube`…);
  la famiglia (`via`) dice in quale gruppo cercare (le chiavi doppie `luce`, `nube`, `rogo` stanno in due). Ogni effetto e ogni
  segno del gioco ha il suo 3D (il segno `arco` è la spazzata).
- **L'abilità dell'eroe**: Gioco.vue annuncia le azioni del turno (`colpo`) quando il racconto si costruisce; il 3D le mette in
  fila e ognuna parte quando l'eroe si muove per lei (`scatta`, `tira`, `gira`, `protegge`, `cura` per bere, `vuoto`). Parte
  l'effetto intero su tutti i presi, il bersaglio per primo, con la tinta dell'elemento (`tintaDelColpo`): i suoi tempi
  (`arrivo`, `passo`, `durata`) sono quelli del gioco. Le scene del racconto che l'effetto disegna già (il corpo, il segno) si
  saltano; le aure sull'eroe (scudo, sfera, pietra, cura, specchio, muro, la preghiera) e i segni in più (lo teme, resiste)
  sono effetti 3D a sé. Se un effetto 3D non c'è o non parte, resta quello di prima (scintille, luci, la bolla).
- **Il mostro attacca**: col modello, `attacca(p)` per la sua durata; la carica è stretta nel passo del racconto (170 ms) perché
  l'arrivo cada quando l'eroe incassa, il resto va coi suoi tempi. Chi ha un proiettile fa un passo appena e lancia l'effetto
  (`PROIETTILE`: freccia, spore, ragnatela, veleno, sputo, onda, masso, fuoco, fulmine, raggio, teschio, luce) dalla sua
  `origine`; il soffio dei draghi lo disegna il drago. Da vicino, sull'eroe colpito compare il segno della sua posa
  (`SEGNO_COLPO`: morso, zampata, fendente…). Prima di questo lavoro lo scatto dei mostri non si muoveva affatto
  (`muoviAssalto` era chiamato solo per l'eroe): ora scattano anche gli sprite.
- **Gli stati addosso**: quelli che il racconto mostra (o la verità del motore, `statiDel`) diventano gli stati 3D (`statoDi`:
  veleno → avvelenato o in fiamme, debole → fiacco o gelato, fermo → stordito o gelato, sanguina, esposto → bloccato, rotto →
  senza difesa), accesi finché ci sono e spenti sfumando; la loro `tintaCorpo` tinge il modello. Le aure si compilano la prima
  volta che serve uno stato (`PREPARA`).
- **L'eroe** scatta ancora come prima (assalto in tre tempi con `posaColpo`): le pose d'arco e di staffa dell'arena
  (`poc/arena-3d/principale.js`, `eroeAgisce`) non sono portate.

## Le mosse multiple

Nel gioco ([mosse.md](mosse.md)). `mosse-anim.js` è fra le radici del gruppo `mostri` (con `mosse.js`, che porta con sé: i dati
veri però stanno in `dati/mosse.js`). Chi ha più mosse ha una riserva sua (modello + elenco delle mosse), preparata con
`conMosse(g, voce, { scala, mosse, icona: false })` alla prima `metti`; `metti` riceve `mossa: { id, p }` (al posto di `attacco`)
e `annuncio` (l'anello a terra mentre l'eroe sceglie); `racconto.js` (`mossaDelMostro`) fa partire l'animazione coi tempi del
racconto, le croci della cura, il proiettile dell'incantesimo. `prova('mossa:<id>', i)` per gli scatti.

## Quanto costa

Misurato con SwiftShader (`&dpr=1`, 390×844, le cantine, `luce=stanza`; i ms non dicono niente del telefono, le chiamate sì):

| | chiamate | triangoli | `banco(20)` |
|---|---|---|---|
| 8 mostri sprite (`&spegni=mostri3d`) | 101 | 72k | 48 ms |
| 8 mostri 3D, senza saldare | 801 | 104k | 56 ms |
| 8 mostri 3D, saldati | 458 | 104k | 53 ms |
| scontro con 3 mostri (6 modelli in vista) | 257 | 39k | — |

Un mostro costa da 8 (il fantasma) a 141 (il drago grande) chiamate, in media una cinquantina; dal 22/10 la saldatura passa oltre
i perni fermi (uno scheletro ~80 → ~45) e anche l'eroe 3D si salda, con le sue pose ([prestazioni-3d.md](prestazioni-3d.md)). Per questo `integrazione/sotterraneo-3d` misura i
paesaggi con `&spegni=mostri3d,eroe` e lo scontro fino a 260 chiamate (con gli sprite stava sotto 140). `&spegni=mostri3d:6` ne tiene sei,
`&spegni=mostri3d` nessuno, `&spegni=effetti3d` toglie gli effetti 3D. Le copie pesano nel file unico (eroi, mostri, effetti).

## Cosa manca

- Nessuna specie resta allo sprite (le sei di `varie.js` sono entrate il 22 ottobre); i modelli di `varie.js` sono al primo giro: da guardare nel gioco.
- Le pose d'attacco dell'eroe con arco e staffa.
- Il cammino: i modelli scorrono col loro idle, non hanno passi.
- Gli shader compilano la prima volta che un modello o un effetto compare (uno scatto al primo incontro).
- Le chiamate: oltre gli otto mostri vicini un telefono vecchio va misurato col dito ([grafica-3d-costi.md](grafica-3d-costi.md)).

Nei test: `unita/sotterraneo-mostri-3d` (il registro copre specie e grossi, nessuna chiave orfana, ogni modello si costruisce,
si anima, attacca e si salda in Node; ogni effetto, segno, proiettile e stato del gioco ha il 3D; ogni modello è nel catalogo 3D;
le copie uguali ai prototipi), `integrazione/sotterraneo-3d-mostri` (lo scontro coi modelli, la palla di fuoco e la cura 3D, gli
attacchi senza errori, `&spegni=mostri3d`). Per le prove: `window.__sotterraneo3d.prova(chiave, i, tinta)` fa usare all'eroe l'effetto
`chiave` sul mostro `i` dello scontro, `prova('mostro', i)` fa attaccare il mostro `i` (solo il disegno, i numeri non cambiano);
`grafica()` dice `mostri3d` (in vista), `modelli3d` (costruiti), `effetti3d` (attivi).
