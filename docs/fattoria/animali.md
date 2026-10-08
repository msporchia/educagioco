# Le bestie di casa, e vestirle

Cani, gatti, il coniglio e il pappagallo: i bisogni, la ciotola, il premio
per averle rimesse a posto e gli addobbi. I recinti del cortile sono un'altra
cosa e stanno in [macchine.md](macchine.md). Il codice è `dati/animali.js`,
`dati/bisogni.js`, `dati/addobbi.js`, `viste/Bestia.vue`,
`viste/Vestiario.vue`, `motore/camminata.js`.

## Le bestie

| bestia | 🪙 | liv | | bestia | 🪙 | liv |
|:--|--:|--:|:--|:--|--:|--:|
| 🐕 bobtail | 90 | 3 | | 🐈 gatto nero | 75 | 19 |
| 🐈 gatto bianco e nero | 75 | 10 | | 🐈 gatto rosso | 75 | 35 |
| 🐇 coniglio | 85 | 12 | | 🦜 pappagallo | 120 | 49 |
| 🐕 beagle | 90 | 15 | | | | |

- **Si vende solo quello che si sa disegnare**: `ANIMALI` incrociato con
  `BESTIE` dell'atlante. Una bestia già comprata che oggi non si disegna è
  ignorata, non cancellata. I prezzi sono alti apposta: una bestia si
  desidera per giorni.
- **Una per tipo**: due beagle identici sono due disegni uguali, non due
  cani.
- **Si prende e si sposta come una panchina, e gratis** (`spostaBestia`).
  Siccome non attraversa la staccionata, spostarla è il modo di metterla
  nel recinto. Provato «si compra e poi gira da sola»: il recinto
  costruito con pazienza restava vuoto. Non si mette via nel baule: è un
  impegno, non un oggetto.
- **Dove sta si salva** (`x`, `y` in celle): se rinascesse in mezzo al
  prato, quello che la bambina aveva chiuso nel recinto uscirebbe da solo
  di notte. Se il posto non c'è più, la cella buona più vicina (`dovEra`).
- **Cammina a celle, non in linea d'aria** (`motore/camminata.js`, con
  `percorso()` e `accanto()` di `src/motore/passi.js`): aggira le case
  invece di attraversarle, e si accosta quando sulla meta non si può
  stare. Chi gira per conto suo si sposta di poco (`RAGGIO_VAGO`, 4
  celle): più lontano sembra che scappi. Dove si può camminare lo dice
  solo `Fattoria.calpestabile`.

## I bisogni

- **Tre bisogni che calano con le ore vere**: pancia (14 ore), pelo (30),
  voglia di giocare (20). **Il fondo è 0,15 e non zero** (`FONDO`): ha fame
  ma non sta male, non si ammala, non muore. Un animale che fa sentire in
  colpa se non apri l'app è l'ennesimo compito.
- **Ogni gesto costa una monetina** (spazzola, pallina): una bestia deve
  costare qualcosa ogni giorno, se no conta solo il primo, e un gesto
  gratis in mezzo a gesti che costano diventa quello che si preme sempre.
  Chi è a zero monete non può fare niente finché non fa un esercizio, ed è
  una scelta fatta sapendolo.
- **Ogni famiglia ha i suoi cibi**: due da comprare (🪙5 riempie 0,30,
  🪙14 riempie 0,70) e quello sbagliato viene **rifiutato**, non pagato meno
  — un no si vede, mezza barretta in meno no. Il cibo buono rende un po'
  meno al pezzo: spendere tanto in una volta è una comodità.
- **Le pappe coltivate vanno bene per (quasi) tutti**: tre catene parallele
  per la stessa mossa sarebbero un lavoro d'ufficio. Un cibo dichiara *o*
  `prezzo` *o* `da` (il prodotto del granaio), mai tutti e due. La merenda
  vale per tutti apposta: una pappa da 3/4 di pancia che mangiasse solo il
  pappagallo sarebbe una catena chiusa dietro una bestia da 🪙120.
- **Le coccole**: spazzola e pallina (🪙1), copertina (lana), festa (torta,
  riempie tutto il gioco), bagnetto (sapone, riempie tutto il pelo).
- **La scheda è a blocchi** (`viste/Bestia.vue`): ogni bisogno è la sua
  barra con sotto solo le cose che lo riempiono. La ciotola mostra **solo
  i cibi di quella bestia**, e un cibo che non hai non è un tasto morto:
  premuto dice come si ottiene («3 🌾 nel mulino (5 min)») e **solo lì**
  offre di comprarne uno. Prima come te lo fai, poi come lo compri.
- **A figure, come il baule**: il ritratto grande con l'ombra, e cibi,
  coccole e cappelli sono carte senza cornice (figura, nome, prezzo in una
  pastiglia). Alone **verde** per quello che le piace (o che porta), alone
  **dorato** per il cappello della festa. Niente frasi di spiegazione.
- **Si vede prima quello che serve**: quello che le piace e quello che puoi
  dare adesso. Il resto sta dietro **«Mostra altro»** (`[data-mostra-altro]`),
  una riga per bisogno; una volta aperto resta aperto finché la scheda non
  si chiude.
- La scheda riceve una **fotografia** dei bisogni (`foto`), non il record
  vivo del motore: un foglio con le prop identiche a prima non si
  ridisegna.

## Rimessa a posto, paga esperienza

Quando dopo un gesto **tutti e tre i bisogni stanno sopra «sta
benissimo»** (`BENISSIMO`, la stessa soglia della frase sulla scheda) la
bestia paga esperienza, mai monete. La riga in cima lo dice («🐕 Bobtail
sta benissimo! ⭐ +6 di esperienza») e dalla testa sale un «+6 ⭐» che
svanisce in due secondi e mezzo.

- **Un quindicesimo del prezzo** (`QUOTA_BENESSERE`, `premioBenessere`):
  cane ⭐6, gatto ⭐5, pappagallo ⭐8. Sta **sotto l'ordine più piccolo del
  mercato** (tre grano, ⭐12), che chiede un quarto d'ora di campo; ed è
  legato al prezzo così non è scritto due volte. Era un decimo, ed è sceso
  quando è sceso il premio del mercato: se no il pappagallo avrebbe reso
  quanto tre grano.
- **Per singola bestia**, non «quando stanno bene tutte»: chi ne ha una
  deve poter vincere qualcosa, chi ne ha sei non deve fare diciotto gesti.
- **Una volta per ciclo**: il premio torna solo dopo che un bisogno è
  risceso sotto «sta bene» (`BENE`), cioè dopo circa tre ore. Senza, tre
  spazzolate sarebbero una zecca di livelli. Con sei bestie e due giri al
  giorno sono una settantina di ⭐, un decimo del gradino a cui arriva la
  sesta.
- **La prima spazzolata a una bestia che stava già bene non paga**: il
  premio è per averla rimessa a posto (`premiaSeStaBene`, `tuttoAPosto`).
  Il ciclo sta nel record (`premiato`) e si riarma leggendo, dentro
  `scendi`; un salvataggio senza il campo si legge «non ancora premiata».
  Il motore ci mette solo il braccio (`premiaIlBenessere`). Le prove in
  `unita/fattoria`: una volta e non due, torna dopo il ciclo, due bisogni
  su tre non bastano, il livello può scattare.

## Vestirle

Dalla scheda, **🎩 Vestilo**: quello che le si mette **si vede in
fattoria**, mentre passa. Un vestito che si guarda solo aprendo una scheda
non lo mette nessuno.

- **Quattro punti di attacco**: testa, muso, collo, schiena. **Dove cade un
  cappello lo dice il foglietto dello sprite di quella bestia** (`agganci`
  in `strumenti/sprite/sorgenti/…/<bestia>.json`, frazioni del riquadro e
  non pixel), che `atlante.py` copia in `AGGANCI` dell'atlante; `puntiDi`
  legge foglietto → scheda → ripiego. Provata una tabella sola per tutte le
  specie: un pappagallo e un bobtail hanno la testa in posti diversi. Il
  ripiego resta per una bestia non calibrata, e `guastiDegliAnimali` lo
  segnala. Come si calibra: [sprite.md](sprite.md).
- **Lo specchio è una trasformazione sola**: l'addobbo sta dentro la stessa
  trasformazione dello sprite, e girando a sinistra ci finisce da solo.
- **Segue il passo**: camminando la testa si abbassa su due fotogrammi su
  quattro — un pixel di fronte, due di spalle, niente di lato, misurato sul
  foglio (`BOB`).
- **Quello che un verso non conosce non si disegna**: di spalle il muso non
  c'è, e gli occhialini spariscono.
- **Non tutti portano tutto**, e i due rifiuti stanno in due posti: il
  pappagallo non ha la schiena (ha le ali) ed è un fatto del disegno
  (`porta` nella scheda dell'animale); la campanella è dei gatti ed è
  gusto (`per` nella riga dell'addobbo). Insieme sarebbero un elenco di
  eccezioni da allineare a mano.
- **Prezzi da 🪙6 a 🪙24**, la fascia «una cosetta» (uno-quattro minuti di
  esercizi): un cappello che costasse quanto un pollaio metterebbe una
  decorazione in concorrenza con la catena. `guastiDegliAddobbi()` rifiuta
  un prezzo fuori fascia.
- **Si compra una volta e non si consuma**: toglierlo lo rimette nel
  guardaroba. **Un aggancio tiene una cosa sola**, e un secondo cappello
  cambia il primo invece di dire di no. **Comprare è premere**, col prezzo
  sul tasto e quanto manca a chi non ce l'ha.

### Solo cappelli e occhiali, per ora

Gli addobbi sono per lo più **emoji**, e il ragionamento dei mostri (le emoji le
disegna il telefono, stile Apple in mezzo alla pixel art) qui pesa meno: un
cappello si ridimensiona, si specchia e segue il passo con lo sprite.
Regge in testa e sul muso, **non al collo e sulla schiena**: un'emoji di
fiocco o di zainetto è disegnata per una persona vista di fronte, e su una
bestia a quattro zampe non si aggancia.

- Fiocco, sciarpa, campanella, mantellina e zainetto portano **`sospeso:
  true`** in `dati/addobbi.js`: fuori dal negozio (`IN_VENDITA`, e
  `compraAddobbo` rifiuta con `'sospeso'`) ma **non cancellati**, perché gli
  id sono chiavi del salvataggio e chi li ha comprati li tiene, li mette e
  li toglie (`vestiarioDi` nel motore mostra i sospesi solo a chi li ha).
- Gli agganci `collo` e `schiena` restano nei foglietti e in `atlante.py`:
  serviranno quando quegli addobbi arriveranno come sprite.
- Un addobbo può essere **un disegno in pixel** (`disegno`, e `misura` è la
  larghezza in pixel dello sprite) invece di un'emoji, e può avere una
  **`stagione`**: in vendita solo allora, e comprato resta (il cappello da
  strega, [stagioni.md](stagioni.md)).
- Una riga può già dichiarare `pezzo` invece di `emoji`, come le merci; il
  pezzo che manca è la scena: oggi `addosso()` in `scena/tela.js` sa
  posare solo un'emoji (vedi [da-fare.md](da-fare.md)).
- Per lo stesso motivo il maglione della sartoria non è più un addobbo
  pagato col granaio (`da: 'maglione'`): è una merce, e va alla sarta.

Nei test: `unita/addobbi` (si compra, si mette, si toglie, cosa non gli
sta; un punto per ogni aggancio), `unita/fattoria`.
