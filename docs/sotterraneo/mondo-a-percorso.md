# Il mondo a percorso

Il progetto della forma nuova del mondo di sopra del Sotterraneo 3D: **il generatore c'è** (compito A,
[mondo-aperto-generatore.md](mondo-aperto-generatore.md)), il gioco ci arriva coi compiti B–E. L'utente, 20 ottobre 2026: «darei un
po' più di forma al mondo e non lo farei così a cerchio, lascia che ci sia un po' di strada da fare che giustifica un cambio di
terreno», una pietra runica al centro di ogni zona per tornare alla base, i dungeon legati alla forza della zona e rigenerati dopo il
boss, nessun passaggio chiuso, il villaggio con una forma standard e tutti quasi di fronte. Lo stesso giorno ha approvato lo schizzo
della **serpentina a sette zone** e ha chiesto le **terre successive**. La spartizione del lavoro, il salvataggio e la migrazione:
[mondo-a-percorso-lavori.md](mondo-a-percorso-lavori.md).

**Cosa supera.** Di [mondo-aperto-progetto.md](mondo-aperto-progetto.md) e del generatore ad anelli (`motore/mondo-aperto.js`):
la griglia 5×5 ad anelli, le marche, le grate e `regolaDi` (via tutte), il seme 19, i passi 7–9 dell'algoritmo per il villaggio,
gli antri (ne prende il posto il secondo dungeon di ogni zona), le pietre davanti a ogni ingresso. Di
[mondo-aperto-mostri.md](mondo-aperto-mostri.md): le fasce per anello (ora per zona) e la cintura (ora un dato del generatore).
Di [mondo-3d.md](mondo-3d.md): le grate modellate e i campi del villaggio. Di [zone.md](zone.md), solo nel 3D: le zone che rinascono
in cima (il loro posto lo prendono le terre successive). Il resto (motore dello scontro, nebbia, pezzi, figure, taglie) resta.

## La forma

Una **serpentina** dal villaggio, come il percorso di un gioco dell'oca: la fila bassa va verso est (villaggio, 1, 2), si sale a
est, la fila di mezzo torna verso ovest (3, 4, 5), si sale a ovest, la fila alta va verso est (6, 7) fino alla porta delle terre.

- **Perché così**: c'è sempre un «avanti» (la strada maestra, una sola) e un «indietro» (il villaggio), e andare avanti è andare
  più forte. Il cerchio di oggi metteva ogni posto a pochi passi dal villaggio in una direzione diversa: niente cambiava camminando.
  Le due salite sono la svolta di terreno più forte (dal bosco alla brughiera, dalle ceneri al monte).
- **Le file non si toccano**: fra una fila e l'altra c'è una cresta di roccia, e il generatore lo prova (nessuna scorciatoia: da una
  pietra alla seconda dopo non si va in meno dell'80% della strada che passa da quella in mezzo). Dentro una zona il corridoio è
  largo 40–55 celle: c'è spazio per uscire di strada a cercare i mostri.
- **Fra due zone un confine di traverso**, un fiume col suo ponte o una cresta col suo valico, **sempre aperto**: è il segno che il
  terreno cambia, non una porta. Chi è troppo debole resta di qua perché di là i mostri sono più forti, non perché è chiuso.
- **Le misure** (seme 8): 504×300 celle (6,75 volte il mondo ad anelli), strada maestra di 1 548 celle, da una pietra alla dopo
  **202–227 passi**, cioè 45–50 secondi a piedi senza fermarsi (`PASSO_MONDO` 4,5) e due o tre minuti giocando; la cripta a 76
  passi dalla piazza, l'ultimo dungeon a 1 362. Ogni zona ha 11 000–14 000 celle d'erba.
- **La strada resta leggibile**: una strada maestra larga due celle che attraversa tutte le zone, una stradina per ogni dungeon, la
  pietra della zona accanto alla strada a metà zona. «Portami lì» e la bussola (un altro lavoro) seguono la strada maestra.

## Le zone

| | zona | luoghi (le chiavi di oggi) | habitat | mostri | dungeon | verso la dopo |
|---|---|---|---|---|---|---|
| 1 | I prati del cimitero | campi, mulino, cimitero, frutteto | prato, campi, cimitero | 1–3 | la cripta dei re, le cantine dei goblin | il ponte del mulino (arco) |
| 2 | Il bosco vecchio | lago, bosco, lupi | lago, bosco, foresta | 3–5 | la torre bruciata, la tana dei ragni | la salita della brughiera (valico) |
| 3 | La brughiera | colle, brughiera, corvi, rovine | rovine, brughiera | 5–7 | il cerchio di pietre, il pozzo dei corvi | il ponte del guado (arco) |
| 4 | La palude | guado, accampamento, palude, secco | prato, palude, secco | 7–9 | le sale allagate, la palafitta | la passerella delle ceneri |
| 5 | La piana delle ceneri | ceneri, ossa, colline | ceneri, roccia | 9–11 | la porta dell'inferno, la fornace | il valico del passo |
| 6 | Il monte | passo, gola, vetta, monte | monte, roccia | 11–13 | le miniere di brace, la cava gelata | il ponte sulla gola (passerella) |
| 7 | La landa vecchia | foresta, landa | foresta, landa | 13–15 | il pozzo senza fondo, le tombe del vento | la porta delle terre |

- **I luoghi sono le venticinque regioni di oggi** messe in fila dentro la zona: tengono la chiave (le taglie la nominano), il nome
  per l'annuncio, i loro abitanti (`ABITANTI_DI_SOPRA`), la tana col signore. Si attraversano senza confine.
- **Il livello dei mostri sale con la strada**: all'entrata della zona l'inizio della fascia, in fondo la fine; dentro un luogo
  come oggi dai passi. La curva della forza (`CURVA_DI_SOPRA`) arriva al 15 con la curva delle zone (`CURVA_DELLE_ZONE`).
- **La cintura** resta (12 celle attorno al villaggio, alla strada fino alla cripta e alla pietra dei prati): il generatore la
  scrive come maschera (`m.cintura`), la legge `aperta.js`.
- **Le pietre runiche**: una al centro di ogni zona, accanto alla strada, più quella del villaggio (otto). Si accendono con la domanda
  come oggi (il `dif` della zona); da una accesa si va al villaggio sempre, e alle altre accese. Toccata quella del villaggio, si
  va alle pietre accese delle zone: è il «tornare avanti» dopo la spesa.
- **Una città sola, il villaggio**, all'inizio (decisione del 20 ottobre): il forte e il rifugio non ci sono più, il capitano sta
  nel villaggio, il portale gemello è sempre lì. Le pietre di zona riportano al villaggio.

## I dungeon

Due per zona, quattordici. **Un po' più forti dei mostri della zona**: il livello è quello dei mostri dove sta, più uno.

| zona | dungeon | chiave | livello | paesaggio | boss | sopra |
|---|---|---|---|---|---|---|
| 1 | La cripta dei re | `altare` | 1 | cripta | Re Ossuto | l'altare |
| 1 | Le cantine dei goblin | `cantine` | 2 | cantine | Grumo | l'arco |
| 2 | La torre bruciata | `torre` | 4 | fornace | Fiammetta | la torre |
| 2 | La tana dei ragni | `gallerie` | 5 | grotta | Zannaverde | la grotta |
| 3 | Il cerchio di pietre | `cerchio` | 6 | cripta | nuovo: il golem di muschio | i menhir e una botola |
| 3 | Il pozzo dei corvi | `corvaia` | 7 | grotta | nuovo: il grifone | il pozzo |
| 4 | Le sale allagate | `cisterna` | 8 | tempio | Gorgo | lo stagno |
| 4 | La palafitta | `palafitta` | 9 | palude | nuovo: il serpente | la palafitta e una botola |
| 5 | La porta dell'inferno | `labirinto` | 10 | inferno | Minotto | la botola |
| 5 | La fornace | `fornace` | 11 | fornace | nuovo: il golem di magma | le fumarole e i bracieri |
| 6 | Le miniere di brace | `fondo` | 12 | miniera | Carbonchio | la miniera |
| 6 | La cava gelata | `cava` | 13 | ghiaccio | nuovo: il golem di ghiaccio | la miniera con la brina |
| 7 | Il pozzo senza fondo | `abisso` | il suo | i tre tratti | uno ogni cinque piani | il pozzo |
| 7 | Le tombe del vento | `tombe` | 15 | tempio | nuovo: il mietitore (il boss della terra) | la tomba |

- **Le chiavi della storia non cambiano** (`altare` … `fondo`, l'abisso −1), né l'ordine: le sette porte in fila sono in fila anche
  sulla strada. Per questo le cantine stanno nei prati e la torre nel bosco (lo schizzo le aveva nel bosco e nella brughiera, dopo la
  tana): così la terza porta viene prima della quarta anche a piedi, e i primi quattro livelli attesi (1, 2, 3, 5) cadono nelle
  fasce delle prime due zone. Domanda 1.
- **I sei nuovi non hanno indice**: si salvano per chiave, come una zona di oggi (`zonaDi` con la `potenza`: non toccano storia,
  stelle né medaglie). Le chiavi nuove si scelgono adesso e poi non cambiano più.
- **Il pozzo senza fondo è l'abisso di sempre**: comincia al 12 e scende senza fine, il primato resta uno; sta nella zona 7 perché è
  il posto più lontano, ma non segue la zona. Si apre a storia finita, come oggi (è il divieto di un ingresso, non una grata).
- **Una porta della storia si apre finita quella prima**, come oggi (il divieto «si apre quando batti…»); i nuovi sono aperti da
  subito. È l'unico cancello che resta, e non chiude nessuna strada.

### Cosa c'è già e cosa manca, onestamente

- **C'è**: i dieci paesaggi del 3D ([paesaggi-3d.md](paesaggi-3d.md); tre ancora senza discesa: palude, ghiaccio, neve), i sette
  grossi, la figura dei grossi (una creatura del catalogo ingrandita con la corona, come sono tutti i grossi di oggi: un boss nuovo
  è una riga di dati, non un'immagine), le 238 figure da indossare per i pezzi col nome dei boss nuovi ([figure.md](figure.md)), i
  props per i monumenti nuovi (menhir, palafitte, fumarole, carrelli, brina da fare in codice), i volti delle rigenerazioni dei sette
  ([zone.md](zone.md), `VOLTI`).
- **Manca**: le creature. Il bestiario ha 52 specie e nei dungeon ne restano libere cinque (lupo, serpente, cinghiale, ent, golem di
  muschio), mentre la regola vuole «una creatura in un posto solo». Proposta (domanda 5): nei sei nuovi la regola diventa **una
  creatura in una zona sola**, cioè scendono le specie che vivono sopra in quella zona più le cinque libere, coi gradi e le varianti a
  distinguerle, finché non c'è il foglio delle creature d'aperta campagna ([mondo-aperto-mostri.md](mondo-aperto-mostri.md#gli-abitanti-da-dipingere):
  il corvo, l'orso, il coccodrillo, lo yeti, l'avvoltoio…). Mancano anche, ma si scrivono: tre volti per ognuno dei sei, i nomi
  e le schede dei sei boss, i sei monumenti in codice, le quattordici icone fotografate (`npm run scatti icone-mondo`, da sé).

## I dungeon che si rigenerano

- **Ripulito vuol dire**: battuto il boss, si esce dalla scala dell'ultimo piano (la discesa è `vinta`). Chi sale dal portale lascia
  la sosta e ritrova tutto com'era (non è ripulito); chi lascia perdere, sviene o esce con la ✕ ritrova **la stessa forma**, coi
  mostri tornati: non è ripulito nemmeno lui.
- **Ripulito, rientrando è un altro**: un'altra forma, altri abitanti, lo stesso boss col volto nuovo, la stessa zona e lo stesso
  tema. Il seme è `(eroe, chiave, rifatti, terra)`: si impara la mappa di sopra, non quella di sotto. Oggi il seme è a caso a ogni
  entrata nuova: diventa fisso finché non lo si ripulisce.
- **Altri abitanti**: tre presi dal mazzo della zona (gli abitanti del dungeon e quelli di sopra della zona) secondo `rifatti`, il
  caporale a giro fra i caporali della zona; il nome di chi comanda dal volto (`VOLTI[chiave][rifatti % 3]`).
- **La storia resta la prima volta**: la prima ripulitura di una delle sette è il capitolo (stelle, `completa`, medaglie e
  `XP_AREA`, il minatore, la missione principale, i pezzi della fila), come oggi. Dalla seconda è **ripetibile**: esperienza, gemme e
  bottino della zona, niente stelle né storia, come una zona vinta oggi. Le missioni («sconfiggi N», la cosa da trovare) valgono
  in ogni forma: chiedono la chiave del dungeon, non il seme.
- **Si salva** in `mondo.dungeon[chiave] = { rifatti }` dell'avventura (e per terra, sotto); niente nel profilo.
- **I numeri**: livello, forza e spinta dalla zona (`forzaDellaZona`, `spintaDellaZona` già fanno questo per le zone), piani come
  le zone di oggi (`PIANI_DELLA_ZONA` 5) per i sette e tre per i sei nuovi, che sono più corti: una seduta ne fa uno con la strada.
  I livelli attesi della storia nel 3D diventano 1, 2, 4, 5, 8, 10, 12 (oggi 1, 2, 3, 5, 7, 8, 10): da ritarare col banco.

## Il villaggio

Una forma fissa, la stessa per tutti i semi: **un ferro di cavallo aperto a sud**, verso la telecamera. Tutti stanno sul davanti
della loro bottega, in fila, col banco o la porta verso la piazza: dal centro della piazza si vedono tutti senza girare. Niente
campi, niente orti: quattro case senza porta dietro le botteghe (il fondale) e qualche albero agli angoli. Dal cancello a est parte
la strada maestra, dritta verso i prati. La pianta, uscita da `npm run pianta -- --percorso` (40×26 celle, la riga 0 a nord):

```
     0         1         2         3
     0123456789012345678901234567890123456789
  2  .t....####..........####................     #: le case del fondale
  8  .....###..................####..........
  9  .....###..#E#..###...#R#..####..W#......     E erborista e R rigattiere dietro il banco
 10  .....###..###..###...###..####..##......
 11  .......I..........M..........A....@.....     I incantatrice, M minatore, A armaiolo davanti alla porta, @ la ragazza
 12  ....ooooooooooooooooooooooooooooooooB#..     B la bacheca
 15  ..O.oooooooooooooo*ooooooooooooooooo++++     O il portale gemello, * la partenza, ++ il cancello e la strada
 18  ....oooooooooooooooooooooooooooooooo.T..     T il cartello
 21  ...............................##.......
 22  ...............................#P.......     P la pietra del villaggio
```

- **L'ordine da ovest a est**: chi cura (incantatrice, erborista) accanto al portale, perché chi sale dal portale si cura subito;
  al centro il minatore (la storia), davanti alla partenza; poi chi vende (rigattiere, armaiolo); il pozzo con la ragazza, la
  bacheca, il cartello e la pietra verso il cancello, cioè sulla strada per uscire.
- **I vincoli per il generatore** (al posto dei passi 7a e 9): la pianta si stampa dalla scheda (`VILLAGGIO`: piazza, lotti con
  `piede`, `accanto` e il verso, case, alberi), non si sceglie a punteggio; il terreno sotto si spiana; nessun campo nella zona
  della città; `props-citta.js` non mette orti, bucato né carretti sul davanti (solo ai fianchi e dietro); `accanto` sta sempre a
  sud del `piede`, sulla piazza; nessun lotto fra la piazza e la telecamera. Nel villaggio la telecamera si allontana un poco
  (vede la fila intera, 26 celle, dal centro della piazza).

## Le terre successive

Ripulite **le tombe del vento** (il boss della terra), in fondo alla strada si apre **la porta delle terre**: un arco di pietra
con le rune, che il capitano e il minatore annunciano al villaggio («laggiù, in fondo alla landa, si è aperta una porta»).
Attraversarla porta al villaggio di **un'altra terra: la stessa mappa, le stesse zone e gli stessi dungeon, i mostri più forti**.

- **`livelloDellaTerra`** (1 la prima, 2 la seconda…) è un parametro del generatore che non cambia la mappa: sposta le fasce dei
  mostri, dei dungeon e dei boss di **14 livelli a terra** (`salto`: la zona 1 della seconda terra comincia al 15, subito sopra la
  landa), fino a cinque terre (al 71). Proposta: la curva vera e il tetto si misurano col banco (`--terra 2` dà già le fasce).
- **Non sembra la stessa partita**: un nome per terra e per villaggio (la terra d'autunno e Borgo d'autunno, la terra della neve e
  Borgo bianco, del tramonto, della notte), una tinta del terreno e del cielo (`TERRE` della scheda, un uniforme in `vesti.js`),
  gli stessi volti delle rigenerazioni ruotati di uno.
- **Si porta dietro**: l'eroe intero (livello, punti, abilità, roba addosso e nello zaino, gemme, pozioni). **Ricomincia da capo**:
  la nebbia, le pietre accese (si riaccendono: ognuna è una domanda), le missioni dei personaggi e le taglie, i dungeon ripuliti.
- **Si salva** nell'avventura: `terra` (dove si è adesso, 1 se manca) e `mondi: { 2: {…}, 3: {…} }` con lo stesso contenuto di
  `mondo`, che resta quello della prima terra (nessuna migrazione). Niente nel profilo.
- **Si torna indietro**: la porta delle terre va nei due versi, e la pietra di ogni villaggio porta ai villaggi delle terre già
  viste. Ogni terra tiene i suoi progressi; l'eroe è uno.
- **Storia e medaglie**: le sette porte sono un capitolo solo, nella prima terra; nelle altre il minatore racconta i volti nuovi e
  le porte sono ripetibili dal primo giro. `XP_AREA` e le medaglie leggono quello di oggi; una terra nuova raggiunta si segna con
  `segnaBest('sotTerra', t)`, e se debba valere una medaglia lo decide l'utente.

## Decisioni del 20 ottobre

Viste le piante del prototipo, l'utente ha deciso (dove contrasta, vale questo e non il resto del documento):

1. **Il mondo era ancora un po' piccolo**: ora 504×300 (il tracciato stirato di 1,43), da una pietra alla dopo 202–227 passi,
   45–50 s a piedi.
2. **Si genera a blocchi**: lo scheletro di tutto il mondo e le zone una per una (quella dove si è e le accanto), le lontane si
   buttano. Il contratto: [mondo-aperto-generatore.md](mondo-aperto-generatore.md).
3. **Una città sola, il villaggio**: niente forte né rifugio, quindi niente avamposti. Nel villaggio i quattro mercanti, la ragazza,
   il minatore, la bacheca, il capitano (venuto dal forte), il portale gemello, la pietra. Le pietre di zona portano al villaggio e
   alle altre accese. Le taglie salvate col forte o il rifugio si rileggono sul villaggio (`cittaDiOggi`). La domanda 4 è chiusa.
4. **Nessuna grata**: le zone si attraversano sempre (era già il progetto).
5. **Quattordici ingressi**, due per zona, coi nomi e le chiavi della tabella sopra.
6. **Le terre** col parametro `terra`: la stessa mappa e la stessa firma, +14 livelli a terra fino alla quinta.
7. **La taratura dopo**, a lavoro finito: i numeri restano quelli di questo documento.

## L'anteprima

`npm run pianta -- --percorso` (`--seme N`, `--semi 1-12` per sceglierlo, `--terra 2`, `--scala 5`) genera il mondo col
generatore vero (`motore/mondo-percorso.js`) e scrive `tmp/scatti/percorso-<seme>.png`: le zone colorate col numero e la fascia,
la strada maestra, i ponti e i valichi, la cintura a puntini, le pietre, i dungeon col livello (rossi quelli della storia col
capitolo, arancio i nuovi), il villaggio, le tane, campi e case, la porta delle terre, e accanto il villaggio ingrandito. Sul
terminale la pianta del villaggio, i passi, i ms di ogni zona e i guasti ([mondo-aperto-generatore.md](mondo-aperto-generatore.md#i-guasti)).
Il prototipo che l'aveva disegnata la prima volta (`strumenti/sotterraneo-percorso/`) è stato tolto.

## Domande aperte

1. **Le cantine nei prati e la torre nel bosco?** Raccomando sì: le porte della storia restano in fila anche a piedi e coi livelli
   di oggi. L'alternativa (lo schizzo: la tana prima della torre) vuole l'ordine della storia cambiato, e con lui `tappa`, stelle e
   `completa` che oggi contano le porte in fila.
2. ~~La strada fra due pietre~~ **decisa**: più lunga, 202–227 passi su 504×300 (le decisioni del 20 ottobre).
3. **Nel 3D anche la prima volta delle sette porte con i livelli della zona** (4, 8, 10, 12 invece di 3, 7, 8, 10)? Raccomando sì,
   perché è la regola «legati alla forza della zona» e i mostri di sopra fanno salire l'eroe; costa una taratura della storia col
   banco. L'alternativa è tenere i numeri di oggi per la prima volta e la zona dalla seconda.
4. ~~Il forte e il rifugio come avamposti~~ **decisa**: il solo villaggio, con le pietre per tornarci.
5. **I sei dungeon nuovi con «una creatura in una zona sola»**, cioè le specie di sopra della zona finché non c'è il foglio delle
   creature d'aperta campagna? Raccomando sì; se no i sei aspettano quel foglio.
