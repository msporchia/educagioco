# L'albero delle abilità

Perché i quattro eroi si giocano diversi: con le caratteristiche sole ogni
numero finiva in due conti (quante risposte per un mostro, quanto male a
risposta), e alzare la forza conveniva a tutti. L'utente, 9 ottobre 2026:
un albero da scegliere, abilità che danno qualcosa (veleno, gelo,
protezione, colpo migliore), da preparare prima di rispondere senza fermare
il ritmo, legate alle armi che si hanno in mano.

Il codice: `dati/abilita.js` (i rami, i nodi, l'energia), `dati/elementi.js` (gli
elementi e gli stati), `motore/abilita.js` (i punti, le caselle, cosa si può imparare e
perché no), `motore/scontro.js` (`prepara`, `perchéNonUsi`, `usaAbilita`, `descrizione`:
vedi [scontro.md](scontro.md)), `motore/corredo.js` (`sempre`, `ha`, `haLArma`,
`attDelRamo`, `energiaMax`), `viste/PaginaAbilita.vue`, `viste/CaselleAbilita.vue`,
`viste/Medaglione.vue`, `viste/Glifo.vue` e `viste/glifi.js` con `glifi-rami.js` (le icone).

**12 ottobre 2026, un albero più largo.** L'utente: «i bambini si divertono tantissimo con le
abilità», quindi un tech-tree più ricco dove si mischiano cose: tipi di attacco con mostri che
hanno forze e debolezze (resistente al fuoco, al veleno, che non si stordisce), più abilità fra
cui scegliere «per non fare tre colonnine risicate per ogni eroe», alcune a catena, la palla di
fuoco che prende il bersaglio e i vicini, e il mago che diventa **mago guerriero**. E: «solo il 30%
in più di danno con una passiva è significativo», quindi **più scelta, non più forza**. I rami
classe per classe: [abilita-rami.md](abilita-rami.md); le resistenze dei mostri: [mostri.md](mostri.md).

## L'albero

- **Quattro rami per classe, sette nodi per ramo in cinque righe** (uno, uno, due, due,
  uno), che si aprono ai livelli 2, 4, 6, 8 e 12 (`GRADINI`). **Nelle righe da due si
  sceglie**: due abilità diverse allo stesso livello, se ne prende una o l'altra o tutte e
  due coi punti. Una riga si apre quando si è imparato almeno un nodo di quella sopra: è
  quello che fa un albero.
- **Un punto per livello dal 2** (`PUNTI_ABILITA_PER_LIVELLO`), separato dai
  punti delle caratteristiche. Al 12, dove finisce la storia, undici punti
  per ventotto nodi: non si prende nemmeno un ramo e mezzo, e le zone dopo la storia hanno
  ancora qualcosa da comprare. **Non più forza, più varietà**: un nodo nuovo non batte i
  vecchi del suo gradino, e i colpi a più bersagli hanno il colpo del singolo più basso.
- **I gradi non hanno tetto** (l'utente: al livello 50 c'è ancora qualcosa
  da fare con le abilità). Ogni grado vuole due livelli sopra il gradino del
  nodo (`LIVELLI_PER_GRADO`) e alza i numeri, non cambia cosa fa. I primi tre
  sono scritti nel nodo; oltre si cresce a metà del passo fra il secondo e il
  terzo (`n` in `dati/abilita.js`), e gli scambi restano interi. Da
  analizzare perché non diventino troppo forti; sotto il nome, tre gemme e il
  numero quando si va oltre.
- **Due tipi di nodi.** Le abilità (quadrate) costano energia e vanno nelle
  caselle dello scontro; quelle che «valgono sempre» (tonde) non occupano
  caselle. Il primo gradino di ogni ramo è un'abilità: al livello 2 c'è
  qualcosa da toccare.
- **Un ramo può volere un'arma** (`arma` del ramo): l'arco per le frecce, la
  bacchetta per il fuoco e il gelo, lo scudo nella mancina per il ramo dello
  scudo, la spada per la Lama arcana (che in più colpisce con l'intelligenza). Senza, l'abilità non si prepara e la casella dice cosa manca («ci
  vuole un arco»); i nodi «sempre» del ramo non valgono. L'elfa con la spada
  colpisce lo stesso: è il suo ramo dell'arco che resta fermo.
- **Ogni classe sa difendersi al livello 2 e curarsi entro il 4** (regola
  dell'utente, 9 ottobre): un'abilità di difesa nel primo gradino di un ramo
  che non vuole armi (Preghiera, Rovi, Scudo arcano, Pelle di pietra) e una
  cura nei primi due gradini (Preghiera, Linfa, Fonte arcana, Rune di
  guarigione). `guastiDelleAbilita` la controlla (`difende` e `cura` sui nodi).
- **Gli id dei nodi sono chiavi del salvataggio** (`crescita.albero`), come
  quelli dello SRS: non si rinominano.

| | ramo 1 | ramo 2 | ramo 3 | ramo 4 |
|---|---|---|---|---|
| Cavaliere | Lama (spada o ascia) | Scudo (scudo in mano) | Giuramento | Furia |
| Elfa | Arco | Lame (spada) | Bosco | Luna |
| Mago | Fuoco (bacchetta) | Gelo (bacchetta) | Arcano | **Lama arcana** (spada) |
| Nano | Ascia | Balestra (arco) | Pietra | Fucina |

I nodi uno per uno, coi numeri, stanno in `dati/abilita.js` e la loro mappa in
[abilita-rami.md](abilita-rami.md): la riga `fa(g)` di ogni nodo è anche quella che legge
il bambino, e non ha emoji. **Gli id non si rinominano**: sono chiavi del salvataggio, e i
dodici di prima ci sono tutti, nel loro ramo (quelli del terzo e del quarto gradino sono scesi di una riga, allo stesso livello).

## Le icone sono disegnate in codice

Niente emoji nell'albero (l'utente, 9 ottobre: «non sono per niente
adeguate»): ogni nodo e ogni ramo ha un `glifo`, un disegno vettoriale in
`viste/glifi.js` (pieni, tratti, ombre e riflessi in un quadrato 24×24), e
ogni ramo una `tinta`. Il **medaglione** (`Medaglione.vue`) mette il glifo su
un fondo del colore del ramo, dentro un anello d'oro: **gemma a otto lati**
per le abilità da usare, **tondo** per quelle che valgono sempre; chiuso è
ferro e grigio, pronto da imparare pulsa d'oro, preso è acceso del suo
colore. Gli stessi glifi fanno l'energia (il cristallo blu) e gli stati dello
scontro (la goccia del veleno, il fiocco, le stelle, il sangue). I nodi del 12 ottobre stanno in
`viste/glifi-rami.js`, i pezzi comuni (cerchio, stella, fiammella, `astro`, `poli`) in `glifi-base.js`.
Sono la prima mano (prima in codice, poi dipinto, come la cornice della
[barra](barra.md)): quando l'albero piace si fanno dipingere con la stessa forma.

## L'energia

**12 ottobre 2026, il mana costa davvero.** L'utente: *«le abilità costano poco mana: mio figlio è sempre a piena vita e pieno
mana. In particolare per quelle più avanzate, se decidi di usarle devi avere un cooldown naturale con il fatto che finisci il
mana (ricordati che il mago ovviamente predilige il mana)»*. Prima: energia 8 più l'intelligenza, un
punto ogni due risposte giuste **dovunque**, quindi fra uno scontro e l'altro (porte, forzieri, curiosità) il globo tornava
quasi pieno da sé. Adesso tre leve insieme:

- **Il mago è il mago del mana**: sette più **tre per punto di intelligenza** (`ENERGIA`, `ENERGIA_PER_INTELLIGENZA`,
  `energiaMax`). Il mago parte da ventidue, l'elfa da tredici, il cavaliere e il nano da dieci; al 12 il mago ha 41 e gli altri
  restano dove sono se non mettono punti in intelligenza, al 24 il mago 53, l'elfa 19, il cavaliere e il nano 16.
- **Il costo è a lanci, non a numeri** (l'utente, 13 ottobre: «il mago può avere costi diversi da quelli del cavaliere»; i
  potenti non devono costare poco): il costo di un nodo è il globo che la **sua classe** ha al livello del nodo, diviso per quante
  volte la classe deve poterlo lanciare col globo pieno (`costoAl`, `globoAtteso`, `lanci` in `dati/eroi.js`). Il mago 6 · 6 · 5 · 3 e
  l'ultima riga una volta sola, gli altri 3 · 3 · 2,5 · 2 e una. Il costo cresce con la riga e, per il mago, col grado (il globo
  cresce col livello). Le tabelle, il perché dei numeri e come si stampano: [abilita-energia.md](abilita-energia.md). Dove
  un'abilità non starebbe nel globo pieno la casella dice **«ti serve più energia (intelligenza)»** (`perchéNonUsi` torna `serve più
  energia`), e la pagina dell'albero lo scrive sotto il medaglione; quando manca soltanto per adesso dice **«ti manca energia»** (`poca energia`).
- **Si ricarica combattendo, e camminando piano** (13 ottobre: [orologio.md](orologio.md); prima solo combattendo): due punti ogni **cinque risposte giuste date a un mostro** (`RISPOSTE_PER_ENERGIA` 2,5, il resto passa al punto dopo; solo se il
  foglio è uno scontro, `Corsa.rispondi`). Porte, forzieri e curiosità non la ridanno più. Sbagliare non la toglie. La fonte la
  riempie tutta e la pozione blu (`pozione-blu`, dall'incantatrice e nei forzieri) ne dà otto; il Respiro del bosco la ridà
  battendo i mostri. **Salire di livello non la riempie** (come la vita: arriva solo la differenza di un punto d'intelligenza).
  Si scende con l'energia piena, e la sosta la tiene (`energia`).
- **Camminando, mai a secondi**: a ogni passo torna lo 0,1% del globo massimo (mille passi lo riempiono); sotto una domanda il tempo è fermo, e una ricarica a secondi premierebbe chi legge piano o posa il
  telefono. È la ragione per cui la torcia si conta a stanze ([roba.md](roba.md)).

**Le protezioni si lanciano anche dal campo** (Scudo alzato, Scudo arcano, Pelle di pietra, Montagna, Rovi, Grido…): restano addosso per un numero di
passi e lo scontro comincia con loro già attive ([orologio.md](orologio.md)).

Il banco spende come prima (due abilità forti a scontro quando c'è energia, solo se il colpo solito non chiude) e i costi li legge da
`perchéNonUsi`. Le misure, prima → dopo: [scontro-bilancio.md](scontro-bilancio.md#il-mana-costa-davvero) e [abilita-energia.md](abilita-energia.md).
La forza conta solo le abilità che l'energia di partenza tipica paga ([forza.md](forza.md)).

## Nello scontro

- **Lo scontro è in due fasi** (l'utente, 9 ottobre): prima si sceglie cosa fare, poi compare la domanda per quel colpo, a
  ogni turno dell'eroe ([scontro.md](scontro.md)). La scelta (`CaselleAbilita.vue`) è un elenco con bordi d'oro: «Attacco» in cima («fai 6 di danno»), le tre
  abilità col costo e quello che fanno **contro questo mostro, coi numeri veri** (`Corsa.descrizione`: «fai 6 di danno · poi 3 a turno
  per 3 turni»), poi **«Bevi una pozione»** e **«Scappa via»** col loro prezzo. Un tocco sceglie e va avanti; per i primi 320 ms il
  tocco non conta (il click lasciato dalla risposta). Un'abilità senza energia o senz'arma resta grigia e dice cosa manca («ti manca energia», «ti serve più energia», «ci vuole un arco»). Sopra la
  domanda resta la riga della scelta fatta. Chi non ha abilità vede comunque Attacco, bere e scappare. L'energia non si ripete:
  la dice il globo blu (che apre la scheda Abilità).
- **Come si vede** ([scontro-interfaccia.md](scontro-interfaccia.md)): i mostri in campo sul fondale vero, ognuno con la sua barra
  senza numeri (il brivido di non sapere quanto resiste), il bersaglio con l'anello d'oro e chi verrà colpito col contorno; un'abilità
  fa volare il suo glifo, del colore del suo ramo, verso ognuno dei colpiti; gli effetti che durano stanno addosso al mostro come
  pastiglie e ne cambiano il colore, lo scudo dà un alone all'eroe. **Scudo e cura non colpiscono**: niente scatto, solo l'alone.
  La cornice è quella delle finestre dell'eroe e del fabbro (`Cornice.vue`, senza ✕).
- **Una difesa prende il posto dell'attacco, e nel turno il mostro colpisce comunque**: per questo lo Scudo arcano e la Pelle
  di pietra parano la metà della vita massima al primo grado (due quarti, poi 2,6 e 3,2: `scudo` in `dati/abilita.js`; anche le cure sono raddoppiate, per lo stesso motivo), e non
  più un quarto (l'utente, 9 ottobre). La pozione blu si beve anche dal menu dello scontro («Bevi una pozione blu», senza
  perdere il turno) e il suo pannello dice «+8 energia», non vita.
- **Rispondendo giusto parte**, e si paga. **Sbagliando va a vuoto, resta
  pronta e non costa**: il turno è perso, ma un'abilità non è un modo di perdere
  di più. Non passa da uno scontro all'altro.
- **Ogni abilità è il colpo solito più qualcosa**: `per` volte il colpo, e
  l'effetto. Prima gli effetti, poi il colpo: Spaccaroccia toglie la difesa
  al colpo stesso che la toglie.
- **«Ignora la difesa» non è un bonus fisso, è un moltiplicatore** (l'utente,
  12 ottobre: il colpo è attacco meno difesa, quindi contro un mostro con
  attacco 8 e difesa 4 passava da 4 a 8, e contro difese alte anche di più).
  Perciò le attive con `passa` (Stoccata, Fulmine) ignorano **metà** della
  difesa (`passa: 0,5`, danno `att − dif/2`), e le passive di ramo (Fiamma viva,
  Punta d'acciaio: `rami.piu`) sono solo **+30%, +40%, +50%** di danno per le
  abilità del ramo, senza `passa`. Lo scudo spezzato (`rompe`, Spaccaroccia e
  Affondo) resta: azzera la difesa, ma costa un'abilità e un turno.
- **Gli effetti si contano nei turni di chi li porta** (docs: [scontro.md](scontro.md)). Sul mostro: veleno o fiamme (metà colpo
  quando tocca a lui, quindi anche se l'eroe sbaglia), gelato (colpisce a metà), stordito (salta i suoi
  prossimi N turni), **sanguina**, senza difesa. Sull'eroe: parato (i colpi presi fanno metà per N turni dell'eroe), scudo che
  assorbe, intoccabile, specchio, linfa. Si vedono come pastiglie sul mostro (glifo e turni che restano) e sotto il palco per l'eroe.
- **La forma** (`forma` in `dati/abilita.js`): `uno`, `vicini`, `catena`, `tutti`, con abilità vere: la Palla di fuoco e la
  Spazzata `vicini`, la Catena di fulmini e la Freccia che trapassa `catena`, il Mulinello e la Luna piena `tutti`. Gli
  effetti vanno a tutti i mostri presi, e **l'elemento si conta per ognuno**: la palla di fuoco fa di più alla melma accanto
  e meno a Fiammetta. Chi cade dà esperienza e bottino come sempre.
- **«ti colpisce 3»** dice quello che arriva davvero dal mostro, con gli effetti (`botta`). Lo stop del pericolo conta la
  somma dei colpi in arrivo.
- **Le parole** (l'utente, 9 ottobre): si parla di danno e di turni, mai di «scambi» o «mezzo colpo»: «fa il doppio del danno»,
  «il mostro arde: metà del tuo danno a ogni turno, per 3 turni», «protezione dai danni per 2 turni». Il nome dell'abilità sta già
  sopra la riga, quindi la riga dice solo l'effetto. Nello scontro i numeri sono quelli veri.
- **Il primo tiro** (elfa, con l'arco): agisce per prima in ogni scontro, prima anche della fila, e il suo primo colpo
  ha il bonus di danno.
- **L'ultimo fiato** (cavaliere): una volta per discesa, invece di svenire si
  resta a 1.
- **Le abilità servono solo negli scontri.** Provato a pensarle sul campo
  (frecce da lontano, mostri congelati per passare): sarebbero un modo di
  saltare le domande.

## Gli elementi, gli stati, il mago guerriero

Ogni abilità che colpisce ha un **elemento** (fisico, fuoco, gelo, fulmine, veleno, sacro); ogni mostro può resistere (metà),
temere (un danno e mezzo) o rifiutare uno stato ([mostri.md](mostri.md)); l'attacco solito non ha elemento. C'è un solo
stato nuovo, il sangue; il mago porta anche le spade e ha il ramo **Lama arcana**, che vuole la spada e colpisce con
l'intelligenza. Le regole, il perché e le parole dell'utente (12 ottobre 2026): [abilita-elementi.md](abilita-elementi.md).

## La barra e le pagine

La barra cambia così ([barra.md](barra.md)): l'esperienza diventa una riga
sopra le caselle col livello a sinistra (il tasto della pagina dell'eroe), e
il globo di destra è l'energia, blu. Il globo è un tasto: apre l'albero, e
porta il «+» d'oro quando ci sono punti da imparare (gli incantesimi da preparare hanno la loro casella nella barra: [orologio.md](orologio.md#come-si-vede-e-come-si-lancia)). L'albero è una delle
quattro schede della finestra dell'eroe, con lo Zaino, l'Eroe e le Missioni
([barra.md](barra.md#la-finestra-delleroe)).

Nella pagina dell'albero, che è epica e non una tabella (l'utente): in cima
«Nello scontro» con le tre caselle. **Una casella si tocca e si sceglie cosa
metterci**: sotto compaiono le abilità che si sanno (e «vuota»), oppure si
tocca il medaglione nell'albero; un'abilità che stava in un'altra casella si
scambia di posto (`metti`). Provato un tasto «Porta/Togli dallo scontro» nel
riquadro del nodo: poco epico. **Sette medaglioni a ramo, quattro rami, non starebbero in 390 px**
(provato: quattro colonne da sei righe, i nomi si spezzano a metà parola): si guarda **un ramo alla volta**. In cima
alla parte che scorre la **fila dei quattro stendardi** (il colore del ramo, il glifo, il nome, quanti nodi si hanno su sette e un
«+» d'oro se c'è qualcosa da imparare), che resta ferma mentre il ramo scorre; toccarne uno lo apre. Sotto, il ramo in
**cinque righe di uno o due medaglioni**: in cima l'arma che vuole, con cosa colpisce quando non è l'arma e l'elemento,
poi le **catene** che si accendono d'oro quando un nodo sopra è preso (dritte, o a forcella verso le righe da due, con una «o» in
mezzo ai due fra cui scegliere); i gradi sono tre gemme sotto il nome, e un nodo che
aspetta il livello lo dice («livello 8»). In fondo alla parte che scorre la legenda. Sotto il medaglione toccato con
cosa fa adesso e al grado dopo (senza «Fa:»: si è già nella pagina che lo dice), il suo elemento e chi prende il colpo («colpisce il mostro e i due accanto»),
e «Impara»/«Migliora». Le cure e gli scudi dicono il numero vero con la vita
dell'eroe: «cura 12 di vita», «uno scudo che para 10 danni, finché dura lo
scontro» (`inVita`, lo stesso conto del motore). Un
nodo imparato va da sé in una casella vuota: chi lo impara a metà discesa
se lo ritrova nello scontro.

## Cosa non è ancora fatto

- **La calibrazione è fatta** (12 ottobre 2026): il banco usa le abilità come un bambino che guarda cosa serve
  ([scontro-bilancio.md](scontro-bilancio.md)). Una **strada per classe** (`STRADA` in `motore/abilita.js`: i nodi in fila,
  una che colpisce, la difesa e la cura entro il livello 4, un'area; solo rami che non vogliono un'arma in mano, perché la
  roba attesa cambia l'arma da una discesa all'altra), tre caselle riempite (la migliore su un mostro solo, un'area, una cura
  o uno scudo), **due abilità forti a scontro** quando c'è energia, l'area quando i mostri sono tre o più, la cura o lo scudo
  sotto la metà della vita. Nessuna abilità è stata smorzata: si è mosso il resto (i mostri). Restano **fuori dalla strada**, quindi
  non misurati, il veleno dell'elfa e i rami che vogliono un'arma (Lama, Arco, Ascia, Balestra, Gelo): cosa valgano lo dice la
  forza ([forza.md](forza.md)), non il banco.
- **I pezzi che rinforzano un ramo** («Bastone del fulmine: +1 alle abilità
  arcane», alla Diablo): l'idea dell'utente perché il mago cerchi i
  bastoni. Non fatti. Oggi le abilità crescono con l'attacco, che viene
  dalla caratteristica dell'arma.

**Rifare l'albero** si paga in gemme, come riassegnare i punti
([livelli.md](livelli.md#riassegnare)): «Riassegna» accanto ai punti da
imparare, e le caselle si svuotano.

Nei test: `unita/sotterraneo-abilita` (i rami in piedi: quattro per classe, sette nodi in
cinque righe, difesa e cura per ogni classe, gli id di prima, ogni icona disegnata e nessuna
emoji, i punti e le loro regole, le righe da due, le caselle, la rilettura di un dato storto, l'energia dalle risposte,
dalla fonte e dalla pozione blu, il colpo doppio, l'abilità che sbagliando
resta pronta, il veleno che brucia al turno del mostro, gelato e stordito, la parata,
la stanza intera e il primo tiro, l'ultimo fiato, l'energia nella sosta);
`unita/sotterraneo-elementi` (le difese dei mostri, resistenza, debolezza e immunità applicate, il sangue, le forme a più
bersagli con abilità vere, le passive nuove, il mago guerriero); `integrazione/sotterraneo-albero` (la pagina a 390 px: gli
stendardi, le righe da due, la Lama arcana, nessun medaglione che sborda).
La pagina ha gli stendardi `[data-azione="ramo"][data-ramo-scheda="<chiave>"]` (`data-aperto`, `data-presi`) e un solo
`[data-ramo]` aperto con le sue `[data-riga="0..4"]`, `[data-car]`, `[data-elemento-ramo]`; il riquadro del nodo ha
`[data-natura]` con `[data-elemento]`, `[data-chi]`, `[data-con]`.
Sulla barra `[data-azione="abilita"]` con `data-punti-abilita` e il globo
`[data-globo="energia"]`; nello scontro `[data-caselle-abilita][data-energia]`,
`[data-azione="prepara"][data-abilita="<id>"]` con `data-pronta`, le pastiglie
`[data-mostro] [data-effetti] [data-stato]` e `[data-stati-eroe] [data-stato]` (i bersagli del palco:
[scontro-interfaccia.md](scontro-interfaccia.md#nei-test)); la pagina `[data-pagina-abilita]` coi
nodi `[data-azione="nodo"][data-nodo][data-grado][data-stato="preso|pronto|chiuso"]`,
`[data-nodo-dettaglio]`, `[data-azione="impara"]`, `[data-azione="dimentica"][data-costo]`, le caselle `[data-azione="zoccolo"][data-zoccolo="0..2"]`
e la scelta `[data-scelta-abilita] [data-azione="metti"][data-metti="<id>"]`,
`[data-caselle-albero] [data-casella]`, `[data-punti-abilita][data-n]`, i glifi `[data-glifo]`,
le schede `[data-scheda]` ([barra.md](barra.md#la-finestra-delleroe)).
