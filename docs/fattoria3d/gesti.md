# Tenere premuto è spostare, il tocco dà le opzioni

La regola di tutti i gesti della fattoria, fuori e dentro casa (decisione dell'utente del 5/11/2026): **tenendo premuto qualcosa lo si sposta; toccandolo
si ha quello che si può fare con lui**, in base a quello che ha. Niente pannelli nuovi: le opzioni compaiono accanto alla cosa toccata e se ne vanno
con un tocco altrove. Il perché di ogni numero del dito sta in [../core/il-dito.md](../core/il-dito.md).

| cosa | tocco | tenere premuto |
|---|---|---|
| campo, ciotola, tinozza, recinto | l'attrezzo o i cibi ad arco ([campi.md](campi.md), [cura-sul-prato.md](cura-sul-prato.md)), e ↻ se si gira | si solleva |
| edificio, silo, bacheca | il contadino ci va e apre il suo foglio; chiuso il foglio, accanto c'è ↻ | si solleva |
| pollaio, stalla, recinto con le bestie | il contadino raccoglie o porta la nuvoletta, e ↻ | si solleva |
| decorazione senza gesto (panchina, tavolo) | ↻ accanto, subito: il contadino non ci va | si solleva |
| un animale di casa | ci si gioca, e accanto pappa, bagno, vestiti, come sta | segue il dito (gratis) |
| Watson e i gatti di casa | come sopra | dicono che girano col contadino: non si spostano |
| un mobile, anche l'armadio | il suo foglio: colore, trama, ↻, 📦 (l'armadio: «👕 Apri l'armadio», senza 📦) | segue il dito, gratis |
| il prato tuo | il contadino ci va | il menu «Compra» |

## Le opzioni accanto

Stanno nello stesso arco degli attrezzi: `viste/Attrezzi.vue` col tipo `opzioni`, o in coda agli altri gettoni (`opzioni` nell'oggetto di `Attrezzi.aperto`). Si toccano
e basta, non si trascinano. `Attrezzi._opzioniDi` dice cosa ha una cosa, `Attrezzi.bestia` cosa ha un animale (pappa se ha fame, bagno se è sporco, vestiti se ne ha), `Attrezzi.opzione` le fa.
**La pappa e il bagno mandano il contadino** alla ciotola o alla tinozza e lì si apre il loro arco. ↻ costa come spostare (🪙 1) e l'arco resta lì, per girare ancora.

Una cosa col gesto non chiede un tocco in più: il gesto parte subito e l'arco si apre quando il contadino arriva, sotto il foglio se ne apre uno (`Azioni.fai`).
`Azioni.haGesto` dice chi ha un gesto; la lista `CON_GESTO` va tenuta in pari con `fai`.

## Un mobile o un animale al dito

- **Un mobile** (`Casa3d.solleva`) si stacca e segue il dito tenendo il punto preso; staccando il dito si posa, senza tasti. Dove non ci sta torna dov'era e il contadino dice perché
  (`lasciaDalDito`). ↻ si preme con un altro dito, come fuori. Contro il bordo la vista scorre (`_scorriColMobile`). Un mobile dal catalogo o da «Messi via» resta invece in mano con «Metti qui» e ✖️.
- **Un animale** (`Mondo3d.sollevaBestia`) si alza (`Compagni.prendi`) e sta sotto il dito (`tieni`, che con `Costruzione.tieni` fa scorrere la vista al bordo). Staccando il dito, sulla cella tua e libera sta lì
  ed è la sua nuova casa; altrove torna dov'era e il contadino dice «Qui non ci sta».
- **Un secondo dito sulla tela** annulla: quello che si teneva torna dov'era, e le due dita zoomano. Sul tasto ↻ non è sulla tela, e gira.

## Nei test

`integrazione/fattoria3d` (blocco «ruotare»: il tocco su un tavolo, ↻), `integrazione/fattoria3d-casa` (l'armadio, un mobile al dito, il no), `integrazione/fattoria3d-bestie` (un animale al dito, le sue opzioni),
`unita/fattoria3d-attrezzi`. Bersagli: `[data-f3="attrezzi"][data-tipo="opzioni"]`, `[data-opzione="gira|pappa|bagno|vesti|come"]`.
