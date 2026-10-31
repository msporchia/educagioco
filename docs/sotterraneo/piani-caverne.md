# Due famiglie di piani: le costruite e le grotte

Richiesta dell'utente, 12 ottobre 2026, guardando le piante: «tendono ad
essere ancora un po' troppo quadratose, sono prive di un po' di fantasia»; e:
«altri modi per rendere più interessanti le stanze penso sia mettere dei
relitti o altre cose da aggirare». Si è proposto, e va bene: **la forma segue
l'ambientazione**, come in Diablo (la cattedrale costruita, le caverne
organiche). Come nasce un piano in generale: [piani.md](piani.md); questa
pagina dice cosa cambia fra le due famiglie, i relitti e l'acqua.

Il codice: `motore/livello.js` (il piano), `motore/forme.js` (le forme e
l'automa cellulare, pura), `dati/relitti.js` (classi e aspetti dei relitti),
`scena3d/relitti.js` (i disegni in codice) e `scena3d/acqua.js` (l'acqua).

## Chi è quale

La discesa dichiara `pianta: 'costruita' | 'caverna'` in `dati/campagna.js`
(`piantaDi(tappa, piano)`, che nell'abisso guarda il tratto); `acqua: true`
solo alla scala sommersa (`conAcquaDi`).

| famiglia | discese | abisso |
|---|---|---|
| costruita | la cripta dell'altare, la scalinata antica, la torre in rovina, la botola segreta | i tratti cantine e cripta (piani 1–8) |
| caverna | la grotta della scaletta, la scala sommersa (con l'acqua), la miniera abbandonata | il tratto fornace (dal piano 9, per sempre) |

Lo scenario (cantine, cripta, fornace) resta indipendente: veste i muri e dice
com'è fatto un relitto, ma **non sposta niente del piano** (stesso seme e
famiglia, altro scenario: stesse celle, stessi ostacoli negli stessi posti).

## La costruita

Il generatore di sempre (BSP, una stanza per foglia), con più carattere. Tutto
quello che segue sembra costruito: niente forme a caso.

- **Le forme**, tirate per foglia (se non ci stanno si ritira fino a tre
  volte, o in una foglia piccola il piano tornerebbe tutto rettangoli):
  rettangolo 18%, **smussata** 20 (gli angoli tagliati di una o due celle, uguali
  ai quattro), elle 12, tu 10, croce 12, **cappella** 14 (un corpo e
  un'abside in mezzo a un lato corto, tondeggiante), doppia 14. **La T e la
  croce sono esattamente simmetriche** (misure dispari, il gambo e l'incrocio al
  centro); smussata e cappella lo sono. L'ingresso resta un rettangolo. La sala
  (una ogni quattro stanze) ha gli angoli tagliati una volta su tre, se resta
  grande.
- **Il colonnato** (`colonnato`): nelle sale due file di pilastri a due celle
  dalle pareti lunghe, uno ogni tre celle, centrati: una navata col suo
  corridoio in mezzo. Meno di quattro pilastri al loro posto e la sala ricade
  sulle colonne a caso di prima. Le altre stanze non hanno colonne.
- **Le nicchie** (`scavaLeNicchie`): una cella scavata nel muro, spessa una, con
  la roccia attorno e dietro (due celle di muro), aperta su un tratto dritto di
  parete. Nelle sale col colonnato stanno **in linea coi pilastri**, sulle due
  pareti lunghe; altrove una stanza su due ne ha da una a tre (di più la cappella
  e la croce), distanti fra loro. Sono celle della stanza: ci si appostano i
  mostri e ci sta una gemma. **Una nicchia non resta mai vuota** (`arredaLeNicchie`, l'utente il 14 ottobre: «mi sembra banalmente un bug»; prima 3457 su 4241
  nicchie di 30 semi erano un buco nel muro): quella senza mostro né gemma riceve un pezzo del suo scenario (`NICCHIE` in `dati/orpelli.js`: la statua o il cavaliere
  di pietra nella cripta, la botte o il teschio nelle cantine, l'incudine o il carbone nella fornace), scelto dalla cella, mai acceso. `npm run pianta -- --conta`
  ha la colonna «nicchie vuote».
- **I corridoi**: uno su tre è largo due celle (la seconda corsia accanto alla
  prima). Dove tocca una stanza il varco largo si stringe alla porta di sempre.

## La grotta

Non ci sono né colonne né nicchie. Le stanze si chiamano ancora stanze (porte,
ruoli, mostri che restano nella loro, la sveglia, le missioni, la luce non
cambiano), ma sono masse organiche, e i collegamenti sono passaggi storti.

- **Gli slarghi** (`blobCA` in `forme.js`): celle piene vicino al centro e rade ai
  bordi dentro un riquadro, con il contorno gonfio e storto (tre armoniche
  sull'angolo) e un rumore a macchie di tre celle che scava baie e spinge
  penisole; poi **due giri di automa cellulare** (una cella è vuota con meno di
  quattro vicine piene, piena con cinque o più) e si tiene la massa più grande
  in un pezzo solo. Quattro forme: `grotta` (compatta, 40%), `bilobata`
  (due slarghi uniti da un'imboccatura, 30%), `galleria` (un budello largo,
  30%) e l'**antro**, che fa da sala: da 70 celle, ci stanno i branchi. In una
  foglia stretta l'automa mangerebbe tutto e si scava un tondo con il bordo
  mosso (`tondo`). Il riquadro di un antro è la foglia intera: il bordo di una
  massa è sempre vuoto, quindi il margine c'è già.
- **I passaggi** (`passaggio`, `camminaStorto`): dal centro di una stanza a quello
  dell'altra, un passo alla volta verso la meta ma con sbandate di lato da una
  a quattro celle; se la strada è lunga passa da una tappa fuori linea e
  curva. La sezione cambia ogni tanto (una cella il 50%, due il 38, tre il 12),
  **vicino alle stanze è sempre una**: un'imboccatura stretta.
- **Le porte** stanno alle imboccature, dove un passaggio tocca la massa: la stessa
  regola delle costruite (`scavaPorte`: la cella di passaggio accanto a una cella
  della stanza). Perciò il pedaggio delle stanze premio (la guardia, la fonte,
  il tesoro) non cambia: la porta chiusa sta sull'imboccatura e `chiudiPorte`
  la sbarra come prima; dove un varco largo non si può stringere senza isolare
  qualcosa, la stanza resta aperta e senza segno (come già succedeva).
- **L'arredo** perde le pose grandi: un altare, un trono o due cavalieri di
  guardia non stanno in una caverna (`fondo` e `coppia`, [arredo.md](arredo.md)).
- **Le pozze d'acqua** (la scala sommersa, `piazzaLAcqua`): celle che non si
  calpestano e **non fermano la luce**, da aggirare. Da un decimo a poco più
  di un quinto delle celle di ogni stanza (da venti celle in su), in una o più
  pozze con il contorno mosso; mai a meno di due celle dal centro o da una porta,
  mai accanto a un relitto, mai a chiudere una strada. Toccarle dice «Acqua
  profonda: di qua non si passa». **Il disegno è in codice** (azzurro scuro, onde
  chiare che scorrono, riva più scura dove c'è terra, a nord tre righe) e **va
  dipinto**: nelle scene dipinte dello scenario cripta non c'è la tessera
  dell'acqua.

## I relitti

Roba ferma, rotta e pesante: macerie, blocchi caduti, colonne spezzate, statue
cadute, sarcofagi, rocce, stalagmiti, travi, un carro da miniera rovesciato,
binari divelti. **Bloccano il passo e fermano la luce del cono come un muro**
(sono celle `RELITTO` del piano, non roba: `calpestabile` dice no, `fermaLaLuce`
dice sì), e fanno angoli dove si appostano i mostri (`m.appostato = 'relitto'`,
accanto a un relitto dalla parte lontana dalle porte). **Nessun relitto sembra da
spostare o da raccogliere** (regola dell'utente): niente casse, sacchi, barili;
`guastiDeiRelitti` lo cerca anche nelle frasi.

- **Classe e aspetto** (`dati/relitti.js`). La classe è la geometria, uguale per
  tutti i piani: `cumulo` (1×1, dove capita), `pesante` (1×1, contro un muro),
  `isolato` (1×1, staccato da tutto: si gira attorno), `lungo` (2×1, anche in
  piedi). L'aspetto è come è fatto e cosa risponde, per scenario e famiglia, una
  lista per classe; si sceglie **dalla cella** (un numero fisso), non da un tiro,
  perché lo scenario non sposti il piano.
- **Dove stanno** (`piazzaIRelitti`, dopo le porte): tre ogni cento celle sopra le
  dodici, e il resto a sorte (una stanza di venti ne ha uno una volta su cinque,
  una sala da cento tre o quattro, al più sei; nell'ingresso al più uno). Mai a
  meno di due celle dal centro della stanza (scale, forzieri, corridoi partono da
  lì) né da una porta, mai attaccati a un altro ingombro (relitto, pilastro, acqua),
  mai in una nicchia. **Mai a chiudere una strada**: si prova, si conta quante celle
  si raggiungono dall'ingresso (`occupa`) e, se una sola si è persa (anche una
  tasca fra un relitto e il muro), si toglie. Il caso è suo (`rndRelitti`): non
  sposta mostri e arredo oltre a quello che le celle occupate toglieranno.
- **Da dove vengono**:

  | scenario, famiglia | pezzi dell'atlante | disegnati in codice (da dipingere) |
  |---|---|---|
  | cripta, costruita | sarcofagi (liscio, spada, stemma, croce, crepato, aperto), lastra funeraria, pilastro con la grata, cavalieri di pietra (spada, scudo, inginocchiato, seduto, mani giunte, caduto), colonne (intera, doppia, spezzata, inclinata, moncone), blocchi caduti, **macerie** (`cripta-macerie`, `sotterraneo_4_3.png`) | crollo, trave |
  | cripta, grotta | blocchi caduti, moncone, lastra funeraria, colonna inclinata, cavaliere caduto, **macerie e rocce** (`cripta-macerie`, `cripta-rocce`: mucchi bassi, la luce ci passa) | crollo, stalagmite |
  | fornace, costruita | i due gargoyle | macerie, crollo, trave, roccia |
  | fornace, grotta (la miniera) | – | roccia, macerie, crollo, trave, stalagmite, **carro rovesciato, binari divelti** |
  | cantine, costruita e grotta | – | macerie, crollo, roccia, trave, stalagmite |

  I disegni in codice (`scena3d/relitti.js`: una forma per disegno, istanziata, nei colori
  di pietra dello scenario in `TINTE_RELITTI`) **sono provvisori e vanno dipinti**; per le
  cantine non c'è nessun pezzo dipinto. Quando ci saranno, si mette il pezzo
  nell'atlante e lo si nomina nell'aspetto al posto del `disegno`.
- **Come si vedono**: sono terreno, non roba: fanno ombra e la maschera del visto li spegne come il
  pavimento; sulla mappina sono quasi roccia, l'acqua azzurra.
- **Toccarli** dice cos'è, ogni volta (un ostacolo non è rumore).

## Le domande per discesa

Il giocatore finto (cavaliere, seme del banco, `unita/sotterraneo`): minimo /
tutto il piano, **prima → dopo**.

| discesa (famiglia) | minimo, prima → dopo | tutto il piano, prima → dopo |
|---|---|---|
| La cripta dell'altare (costruita) | 9 → 9 | 16 → 16 |
| La scalinata antica (costruita) | 6 → 12 | 50 → 41 |
| La torre in rovina (costruita) | 21 → 24 | 55 → 41 |
| La grotta della scaletta (grotta) | 31 → 28 | 40 → 42 |
| La scala sommersa (grotta, acqua) | 26 → 18 | 65 → 66 |
| La botola segreta (costruita) | 24 → 34 | 98 → 106 |
| La miniera abbandonata (grotta) | 25 → 40 | 98 → 106 |

(«prima» è la sera del 12 ottobre dopo la taratura dello scontro, [piani.md](piani.md#il-costo-in-domande); il tetto è 85
risposte obbligate a seduta: il minimo più alto è 40.) L'abisso, un seme, dal primo all'undicesimo piano: 5·4·12·12·12·10·5·10·17·16·25
→ 8·7·8·9·8·6·17·5·24 (`npm run sotterraneo -- --abisso --contro <commit>`).

**Cosa si è dovuto ritoccare.** I piani nuovi cambiano il campione su cui la taratura era stata fatta: stesse regole, altri piani, e
alcune celle di `misure/sotterraneo` uscivano dalla banda (la scalinata a mani nude, la torre e la scala sommersa troppo facili a 4 e 6
su 10, le zone a 4 su 10). Prima si è provato a fare a meno di ogni novità, una alla volta (senza relitti, senza nicchie, senza
colonnato): la differenza non stava in nessuna, stava nel campione. Le leve usate sono quelle che il documento della taratura
dice, più una nuova:

- **`densita`** (`dati/campagna.js`, anche per tratto dell'abisso; dal 13 ottobre sera ora dice quante stanze sono vuote e nessuna discesa
  la dichiara più, [piani.md](piani.md#i-mostri-branchi-appostati-caporali)): quanti mostri in più o in meno del solito (1 di difetto,
  si moltiplicava per `MOSTRI_PER_STANZA`). Scalinata 1,6 (e `tettoBranco` 1: con più mostri a gruppi la scalinata o si vinceva
  nuda o si perdeva a 4 su 10, mai tutte e due; uno alla volta separa le due misure), torre 0,7, scala sommersa 1,3, botola 0,8;
  abisso: cantine 0,7, cripta 0,8, fornace 0,8.
- **`forza` e `spinta`**: scalinata 0,8 e 4,5 → 0,55 e 6,5; torre 0,9 e 5,5 → 0,9 e 6,8; grotta 1,5 e 8 → 1,4 e 9,6; scala sommersa
  2,25 e 9,5 → 2,25 e 9,8. La spinta non scende mai da una discesa alla successiva (il mostro di riferimento di `unita/sotterraneo-forza`).
- **La cripta passa da 30 a 34 di lato**: il suo minimo per scendere, col seme del banco, era 5 domande, sotto la soglia di 6.
- **Le zone** (`FORMA_DELLA_ZONA`): cripta 1,7 → 1,85, scalinata 0,8 → 0,72, torre 0,8 → 0,95, botola 0,85 → 1,1, miniera 1,3 → 1,4.
- **I mostri ora girano attorno agli ostacoli**: un mostro sveglio fermo contro un pilastro o un relitto cerca la strada più corta
  dentro la sua stanza (`stradaDelMostro`), invece di scivolare di lato a caso.
- Le missioni e l'albero non si sono toccati.

**Provato e scartato**: lo stesso numero di mostri (`MOSTRI_PER_STANZA` 0,99 invece di 0,9: chi gira tutto, il mago, perdeva
nella scalinata, nella torre e nella botola); più mostri per branco alla scalinata; abbassare la spinta della scalinata
per i mani nude (il 4 su 10 saliva al 69%).

I bersagli di `misure/sotterraneo` (le discese che si vincono a 8, 6 e 4 su 10, il primo avvio, chi gira tutto, le zone)
sono tutti verdi, e `npm test` pure.

## Nei test

`unita/sotterraneo-piani` (§ 8–13): la famiglia di ogni discesa e di ogni
tratto dell'abisso, solo forme costruite o di grotta, lo scenario che non
sposta il piano; il colonnato (due file, uno ogni tre celle, che si specchiano),
le nicchie (una apertura, il muro attorno e dietro, in linea coi pilastri), la
simmetria di smussata, croce, T e cappella, i corridoi larghi; gli slarghi che sono
stanze, i passaggi larghi e stretti e storti; ogni relitto (celle chiuse, a due
celle dal centro e dalle porte, mai attaccato a un altro ingombro, nella posa
della sua classe), nessuna tasca isolata, l'ombra di un relitto, il tocco che dice
cos'è; l'acqua (chiusa al passo, lontana da centro e porte, la luce che passa);
`guastiDeiRelitti` (atlante, disegni in codice, niente da spostare). Tutto
deterministico dal seme. Per guardare: `npm run pianta -- --png`, e
`#stanza=relitto|acqua|nicchia|antro` ([../core/comandi.md](../core/comandi.md)).
