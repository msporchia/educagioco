# I rami dell'albero, classe per classe

Il perché di un albero più largo e le regole dei punti stanno in [abilita.md](abilita.md), gli elementi e il mago
guerriero in [abilita-elementi.md](abilita-elementi.md); le resistenze dei mostri in [mostri.md](mostri.md). Qui c'è **cosa sta dove**, e a chi serve
ogni ramo. I numeri (e la riga che legge il bambino) stanno in `dati/abilita.js`.

**La forma**: quattro rami per classe, **sette nodi per ramo in cinque righe** da uno, uno, due, due, uno
(`riga` sul nodo). Le righe si aprono ai livelli 2, 4, 6, 8 e 12 (`GRADINI`) e il costo in
energia viene dalla classe e dalla riga (`costoAl`: [abilita-energia.md](abilita-energia.md)). Nelle righe da due si **sceglie**: l'una, l'altra o tutte e due coi punti; una riga si apre
quando se n'è imparato almeno uno della riga sopra. Quattro classi per ventotto nodi: al livello 12 gli undici punti non
bastano a un ramo e mezzo, e cosa prendere è la scelta.

**Cosa si può dire dei nodi di prima**: gli id non si rinominano. I dodici nodi di ogni classe ci sono tutti, nello
stesso ramo; quelli del terzo e del quarto gradino sono scesi di una riga (il livello è lo stesso, 8 e 12, il costo anche).

**Un nodo nuovo non batte quelli di prima nel suo gradino**: l'abilità a più bersagli ha il colpo del singolo più basso
(una Spazzata ×1,2 contro un Affondo ×1,5), e la forza ([forza.md](forza.md)) conta solo il singolo.

### Cavaliere

| ramo | vuole | colpisce con | elemento |
|---|---|---|---|
| **Lama** | spada o ascia | l'attacco solito | fisico |
| **Scudo** | lo scudo nella mancina | l'attacco solito | fisico |
| **Giuramento** | niente | la forza | sacro |
| **Furia** | niente | la forza | fisico |

| liv. | Lama | Scudo | Giuramento | Furia |
|---|---|---|---|---|
| 2 | Fendente | Scudo alzato | Preghiera | Colpo furioso |
| 4 | Filo affilato *(passiva)* | Parata *(passiva)* | Cuore saldo *(passiva)* | Rabbia *(passiva)* |
| 6 | Taglio profondo **o** Spazzata | Spallata **o** Bordo a punte *(passiva)* | Luce sacra **o** Mano santa *(passiva)* | Carica **o** Ruggito |
| 8 | Affondo **o** Mulinello | Colpo di scudo **o** Fortezza | Grido di guerra **o** Giudizio | Macello **o** Passo di carica *(passiva)* |
| 12 | Colpo del campione | Muro | Ultimo fiato *(passiva)* | Tempesta di colpi |

La Lama è il colpo preciso (sanguina, spezza la difesa, spazza i vicini, gira su tutti); lo Scudo regge e rimanda (le
spine, il colpo che stordisce, la fortezza che cura); il Giuramento cura e colpisce di luce sacra contro i morti;
la Furia è il cavaliere che non ragiona: più forte con poca vita, più veloce, a più bersagli.

### Elfa

| ramo | vuole | colpisce con | elemento |
|---|---|---|---|
| **Arco** | l'arco | l'attacco solito | fisico (il dardo: veleno, la freccia di fuoco: fuoco) |
| **Lame** | la spada | l'attacco solito | fisico |
| **Bosco** | niente | la destrezza | veleno |
| **Luna** | niente | la destrezza | sacro (la notte gelida: gelo) |

| liv. | Arco | Lame | Bosco | Luna |
|---|---|---|---|---|
| 2 | Dardo avvelenato | Stoccata | Rovi | Raggio di luna |
| 4 | Primo tiro *(passiva)* | Passo leggero *(passiva)* | Linfa | Luce d'argento *(passiva)* |
| 6 | Freccia di fuoco **o** Freccia che trapassa | Ferita aperta **o** Piedi leggeri *(passiva)* | Spore **o** Silenzio del bosco *(passiva)* | Notte gelida **o** Ninna nanna |
| 8 | Freccia mirata **o** Volo di frecce | Danza delle lame **o** Passo d'ombra | Respiro del bosco *(passiva)* **o** Ortica | Falce di luna **o** Velo di luna *(passiva)* |
| 12 | Freccia del cacciatore | Alle spalle | Radici | Luna piena |

L'Arco è la distanza (la freccia che trapassa è una catena); le Lame il taglio che si aggrava e la schivata; il Bosco
avvelena e cura (le spore e l'ortica sono veleni a più bersagli); la Luna è la luce che ferisce, il gelo che rallenta e
il sonno che ferma, per chi non vuole armi.

### Mago

| ramo | vuole | colpisce con | elemento |
|---|---|---|---|
| **Fuoco** | la bacchetta (anche nella mancina) | quella della bacchetta | fuoco |
| **Gelo** | la bacchetta (anche nella mancina) | quella della bacchetta | gelo |
| **Arcano** | niente | l'intelligenza | fulmine |
| **Lama arcana** | la spada (anche nella mancina) | **l'intelligenza** | fulmine, fuoco, gelo |

| liv. | Fuoco | Gelo | Arcano | Lama arcana |
|---|---|---|---|---|
| 2 | Dardo di fuoco | Raggio di gelo | Scudo arcano | Lama incantata |
| 4 | Fiamma viva *(passiva)* | Gelo profondo *(passiva)* | Fonte arcana | Incanto *(passiva)* |
| 6 | Palla di fuoco **o** Pioggia di scintille | Scheggia di ghiaccio **o** Nevicata | Mente lucida *(passiva)* **o** Raggio arcano | Lama di fuoco **o** Lama di gelo |
| 8 | Brucia **o** Esplosione | Lancia di ghiaccio **o** Prigione di ghiaccio | Fulmine **o** Catena di fulmini | Falciata arcana **o** Danza arcana |
| 12 | Meteora | Gelo eterno | Specchio | Spada del mago |

La Palla di fuoco prende il bersaglio e i due accanto (`vicini`), la Catena di fulmini salta su altri due (`catena`, ×0,7 a
salto), la Pioggia di scintille colpisce tutti (`tutti`, poco a testa). Il nome «Meteora» è quello di sempre (`palla-di-fuoco`
è il suo id e non si rinomina); la Palla di fuoco nuova è `sfera-di-fuoco`.

### Nano

| ramo | vuole | colpisce con | elemento |
|---|---|---|---|
| **Ascia** | l'ascia | l'attacco solito | fisico |
| **Balestra** | l'arco | l'attacco solito | fisico (la polvere e i chiodi: fuoco) |
| **Pietra** | niente | la forza | fisico |
| **Fucina** | niente | la forza | fuoco |

| liv. | Ascia | Balestra | Pietra | Fucina |
|---|---|---|---|---|
| 2 | Spaccaroccia | Quadrello | Pelle di pietra | Martello caldo |
| 4 | Mani pesanti *(passiva)* | Punta d'acciaio *(passiva)* | Rune di guarigione | Fornace *(passiva)* |
| 6 | Ascia lanciata **o** Ira del nano *(passiva)* | Tiro perforante **o** Mira del nano *(passiva)* | Frana **o** Cuore di pietra *(passiva)* | Scintille di fucina **o** Ferro rovente |
| 8 | Martellata **o** Mietitrice | Chiodi roventi **o** Salva di quadrelli | Testa dura *(passiva)* **o** Pugno di pietra | Fiamma della fucina **o** Grembiule di cuoio *(passiva)* |
| 12 | Colpo del titano | Carica di polvere | Montagna | Colata incandescente |

L'Ascia rompe e stordisce (e rimbalza); la Balestra spara da lontano, ignora la difesa e fa piovere sui vicini; la Pietra regge
e dà un pugno solo, pesante; la Fucina è il fuoco da fabbro, a un bersaglio, a tre o a tutti.

## Le passive nuove

| passiva | effetto | dove |
|---|---|---|
| `furia` | + percentuale di danno con meno di metà vita (anche l'attacco solito) | Rabbia, Ira del nano |
| `ruba` | una percentuale del danno fatto guarisce chi lo fa | Mano santa |
| `spine` | una percentuale del danno preso (almeno 1) torna a chi colpisce; col ramo dello scudo | Bordo a punte |
| `velocitaPiu` | punti di velocità: la fila dei turni lo sa, e la forza | Passo di carica, Piedi leggeri |
| `energiaPiu`, `primoTiro`, `graffioMeno`, `vitaPiu`, `schivata`, `rami.piu` | già c'erano: nodi nuovi con effetti di prima | Silenzio del bosco, Mente lucida, Mira del nano, Grembiule di cuoio, Cuore di pietra, Velo di luna, Luce d'argento, Incanto, Fornace |

Il **sangue** è l'unico stato nuovo ([abilita-elementi.md](abilita-elementi.md#gli-stati)); le fiamme erano già `veleno` con `fuoco: true`.

Nei test: `unita/sotterraneo-abilita` (la forma, le righe da due, gli id di prima),
`unita/sotterraneo-elementi` (le abilità vere a più bersagli, le passive nuove, il mago guerriero).
