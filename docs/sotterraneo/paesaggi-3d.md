# I paesaggi del Sotterraneo 3D

Dieci posti, e ognuno si deve riconoscere **dalla sola forma e trama di muri e pavimento**, anche in piccolo e in grigio:
non basta una tinta diversa sulla stessa stanza di mattoni (l'utente, 16 ottobre 2026: «servono pattern completamente
diversi»; «il problema si trova nelle pareti… se sono lisce e perfette»). Il disegno è del 3D: il motore, le regole e le
discese non cambiano. La mappa dei moduli sta in [grafica-3d.md](grafica-3d.md).

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `dati/paesaggi.js` | i paesaggi: lo scenario del motore di cui usano i pezzi (`base`), la famiglia di piante, l'acqua; `inPaesaggio` (il cheat). Senza three: lo legge anche Gioco.vue |
| `scena3d/aspetti.js` | l'aspetto di ognuno (dato puro): stili di parete, pavimento e colonne, colori, luce, nebbia, aria, arredo, acqua; `paesaggioDi(corsa)`; `guastiDegliAspetti` |
| `scena3d/pareti.js` | le pareti scolpite (puro): `STILI_PARETE`, `scolpisciPareti` |
| `scena3d/pitture.js` | i disegni (puro): `PAVIMENTI`, `MURI` |
| `scena3d/arredo3d.js` | l'arredo modellato: `POSE_ARREDO`, `postiDellArredo` (puro), `creaArredo3d` |
| `scena3d/raggi.js` | le lame di luce dall'alto (il tempio) |
| `particelle.js` (`ARIA`), `acqua.js` (velo, rive, `riflesso`), `segni.js` (la tinta delle fiamme), `terreno.js` (pozzanghere e macchie larghe) | il resto dell'atmosfera |

## I dieci paesaggi

| paesaggio | pareti (forma · trama) | pavimento | colonne | luce e aria | arredo |
|---|---|---|---|---|---|
| `cantine` | blocchi diritti · mattoni | mattoni a cesto, arancio | tonde | calda, polvere | contrafforti, mensole coi vasi, sacchi, botti |
| `cripta` | lastroni a filo · blocchi incisi | lastroni lunghi con la cornice e le croci | quadre con basamento | fredda, nebbia fitta | pilastri, nicchie coi sarcofagi, ossa, candele |
| `fornace` | lamiera · lamiere chiodate e ruggine | lamiera nera e grate sopra il fuoco (ardono) | di ferro ad anelli | rossa, braci che salgono | tubi, bocche accese, incudini |
| `inferno` | ossidiana a scaglie · vetro nero con vene di lava | basalto a prismi con la lava nelle fessure | spine | rossa, braci | spuntoni, ossa |
| `grotta` | roccia viva che strapiomba, smussata · roccia a strati | terra battuta coi sassi, pozzanghere | stalattite e stalagmite saldate | fredda, gocce che cadono | stalagmiti, funghi azzurri (fanno luce), sassi |
| `neve` | roccia scura coi cumuli in cima · roccia | neve con le orme | di roccia | chiara e fredda, fiocchi | abeti innevati, cumuli, sassi |
| `ghiaccio` | cristallo a facce che brilla dentro · ghiaccio | ghiaccio lucido e profondo, crepe e bolle | di cristallo | azzurra, fuochi freddi, brina | ghiaccioli, cristalli (fanno luce) |
| `palude` | zolle che franano, coperte di muschio · terra con le radici | fango a solchi, pozzanghere lucide, acqua torbida | tronchi | verde, nebbia fitta, lucciole | canne, radici sulle pareti, ninfee, funghi verdi |
| `tempio` | lastroni · pietra scolpita con la greca, alghe al piede | lastre ad anelli sotto un velo d'acqua con le caustiche | scanalate | verde acqua, lame di luce, bolle | archi sulle pareti, alghe, rocchi caduti |
| `miniera` | roccia viva · roccia a strati | assi inchiodate | puntelli con la trave | gialla, polvere | travi con le lanterne (fanno luce), binari nei corridoi, carrelli, sassi |

I quattro del motore (`cantine`, `cripta`, `fornace`, `inferno`) sono quelli delle discese di oggi, rifatti con forma e disegno
propri; gli altri sei sono **solo del 3D**: si vedono col cheat ([../core/comandi.md](../core/comandi.md), `#scenario=`) e
prendono porte, forzieri e arredo da toccare dalla loro `base` (la grotta, la neve e la palude dalle cantine, il ghiaccio e il
tempio dalla cripta, la miniera dalla fornace). La famiglia di piante va col posto: `caverna` (grotte a bolle, passaggi storti)
per grotta, neve, ghiaccio, palude, miniera; `costruita` (stanze, colonnati, nicchie) per gli altri. Palude e tempio vogliono
l'acqua.

## Le regole e il perché

- **Le pareti vengono da un campo continuo nel mondo**, non da un pezzo per cella: due celle vicine spostano lo stesso punto
  allo stesso modo, quindi niente crepe fra i blocchi, e la parete si può piegare quanto si vuole. La geometria è una per piano
  (quattro chiamate: facce e cime dei muri alti e dei parapetti).
- **Gli spigoli della griglia si smussano** (`smussa`): la parete va verso la linea a metà fra roccia e vuoto, così una grotta
  non ha i gradini delle celle. Per le costruite no: lì il dritto è giusto.
- **La telecamera guarda quasi dall'alto**: del muro si vedono soprattutto la cima e il contorno, la faccia di fondo è una
  striscia. Per questo la cima ha un colore pieno suo (la neve bianca, il cristallo azzurro, la roccia chiara) e si perde nel
  buio lontano dal vuoto, e il contorno dice il posto (dritto, a scaglie, morbido).
- **Il pavimento sta anche sotto i muri**: una parete che rientra non apre il nero.
- **Quello che si ripete si vede**: le pozzanghere nella trama facevano una griglia di macchie; ora le fa lo shader del pavimento,
  larghe nel mondo, e una macchia lenta cambia la tinta di tutte le trame.
- **Il decoro non sembra bottino** né roba da prendere: le foglie del fango erano tondini gialli come monete, ora sono scure.
- **L'arredo che fa luce dà una sorgente alla riserva fissa** dei fuochi: le luci restano sei, e si danno alle più vicine che si
  vedono. Le cose piccole non fanno ombra (raddoppierebbero i triangoli).
- **L'aria è uno shader solo** coi suoi uniform (`ARIA`): cambiare paesaggio non ricompila niente.
- Provato e non funziona: le canne sottili (da sopra non si vedono: servono ciuffi larghi e le ninfee, piatte); le crepe del
  ghiaccio fitte (sembravano piastrelle); l'aberrazione di base del passaggio finale (sui retini chiari del buco faceva frange
  viola, ora è più bassa).

## Quanto costa

Dalla tavola (390×844, discesa 1, seme 11, la stanza più grande accesa tutta, senza mostri; SwiftShader, quindi le chiamate e
i triangoli contano, i millisecondi no). I triangoli contano anche la passata dell'ombra.

| | cantine | cripta | fornace | inferno | grotta | neve | ghiaccio | palude | tempio | miniera |
|---|---|---|---|---|---|---|---|---|---|---|
| chiamate | 42 | 36 | 34 | 31 | 35 | 38 | 29 | 37 | 36 | 41 |
| triangoli | 78k | 52k | 80k | 97k | 150k | 115k | 63k | 157k | 70k | 75k |

Prima di questo lavoro una sala accesa costava 34–43 chiamate e 13–45k triangoli: le chiamate sono le stesse, i triangoli
crescono nelle grotte (le pareti di roccia sono ~17k per piano, i parapetti con una fila sola; la palude ha canne e radici). Le pareti si fanno in 30–100 ms
alla nascita del piano, le trame una volta per paesaggio.

## Come si aggiunge un paesaggio

1. Una riga in `dati/paesaggi.js` (la base del motore, la pianta, l'acqua).
2. La voce in `ASPETTI_3D`: si scelgono una forma di parete, una trama, un pavimento, una colonna, un'aria e l'arredo; il test
   vuole che la terna parete/trama/pavimento non sia di nessun altro.
3. `node strumenti/tavola-paesaggi.mjs` (e `--grigio`): se si confonde con un altro, si cambia forma o disegno, non la tinta.

**Una forma di parete nuova** è una riga in `STILI_PARETE` (quanto sposta, la cima, lo sbalzo, il piede, lo smusso, le facce);
**un disegno nuovo** una funzione in `PAVIMENTI` o `MURI` che dà colore, altezza, rugosità e luce propria; **un arredo nuovo** una
posa in `POSE_ARREDO`, il nome in `ARREDI` e la sua forma in `forma()` (una geometria coi gruppi, un materiale per gruppo).

## Cosa non regge ancora

- **Il ghiaccio non è trasparente**: brilla da dentro (un bagliore che cresce ai bordi) e le facce sono a cristallo, ma non c'è
  rifrazione; le cime chiare pesano più delle facce.
- **L'acqua è piatta**: increspata e accesa dalle luci, senza un riflesso vero (costerebbe una passata in più).
- **Le facce di fondo delle stanze costruite** si vedono poco dalla telecamera: contrafforti, pilastri, nicchie e archi ci sono
  ma piccoli. Lo stacco fra le costruite lo fanno il pavimento e le colonne.
- **I pezzi del motore restano quelli della base**: nel ghiaccio i sarcofagi e i cavalieri di pietra della cripta, nella palude il
  tavolo delle cantine. Un paesaggio vero nel gioco vorrà il suo arredo da toccare.
- Le alghe e le canne stanno ferme; nelle grotte i triangoli sono tanti (da provare su un telefono vero).

## Proposta per il gioco (da decidere, non fatto)

Oggi le discese scelgono lo scenario del motore; un `paesaggio:` sulla discesa o sul tratto dell'abisso (già letto da
`paesaggioDi`) vestirebbe il 3D senza toccare il 2D né l'equilibrio:

- la grotta della scaletta (`gallerie`, cantine in caverna) → **grotta**; la scala sommersa (`cisterna`, cripta con l'acqua) →
  **tempio**; la miniera abbandonata (`fondo`, fornace in caverna) → **miniera**;
- l'abisso, che cambia posto ogni quattro piani: dopo i tre tratti di oggi, **neve**, **ghiaccio** e **palude** come tratti nuovi,
  ognuno coi suoi abitanti; il mondo aperto (che nel repo non ha ancora un documento) potrebbe usare gli stessi dieci come zone.

Gli abitanti che starebbero bene (catalogo in [mostri.md](mostri.md), da non cambiare finché non si decide): nella grotta ragno,
fungo, pipistrello, serpente; nella neve lupo e golem di ghiaccio; nel ghiaccio golem di ghiaccio e spirito elettrico; nella
palude pianta, melma, serpente, granchio; nel tempio polpo, piranha, granchio, tartaruga; nella miniera scorpione, golem, ragno.

## Nei test

`unita/sotterraneo-paesaggi` (i dati senza guasti, ogni nome esiste, nessuna terna uguale; il cheat veste la discesa con gli
stessi numeri; le pareti senza crepe, nei limiti, con le facce girate fuori, la roccia irregolare e i blocchi a filo; i
pavimenti diversi nel disegno in grigio; l'arredo fitto, mai sulla roba, sulle porte o fuori dal pavimento; le lame del tempio),
`unita/sotterraneo-3d` (gli aspetti dei quattro del motore), `integrazione/sotterraneo-3d` (il ghiaccio e il tempio aperti col
cheat: il paesaggio, la famiglia di piante, le chiamate). Bersaglio: `window.__sotterraneo3d.grafica().scenario` (il paesaggio
disegnato).
