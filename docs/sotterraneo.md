[← torna al README](../README.md)

# 🗺️ Il sotterraneo

*Un posto che si gira col dito, dove ogni cosa che vale ha un prezzo — e il
prezzo è rispondere.* È fra i **giochi in prova**: si accende dalla pagina
dei grandi, sotto «i giochi in prova».

## Cos'è, e cosa non è

Si cammina in un sotterraneo visto dall'alto: si tocca dove si vuole andare,
si entra nelle stanze, si toccano le cose. Non c'è nessuna azione
interessante che si compia senza rispondere, e nessuna risposta che non apra
qualcosa che si vede.

| cosa si tocca | cosa costa |
|---|---|
| 🚪 una porta chiusa | una domanda facile — sbagliando si riprova |
| 🎁 un forziere | **una domanda sola, tosta**: se la sbagli resta chiuso per sempre |
| 👹 un mostro | una domanda per colpo, finché non cade |
| ⛲ una fonte | una domanda, e ti ridà vita |
| 🏪 un mercante | niente domande: qui si **spende** quello che le domande hanno fruttato |

**Non è [il Dungeon](dungeon.md), e non lo sostituisce.** Quello è un gioco a
carte: una mappa a nodi, un bivio alla volta, non si torna indietro. Questo è
un posto invece che un diagramma. I due fanno cose diverse con gli stessi
esercizi; se un giorno se ne terrà uno solo, sarà perché i bambini avranno
detto quale.

## Perché l'esercizio non annoia

La tentazione, in un gioco di esplorazione, è mettere il quiz *accanto* al
gioco: cammina, e ogni tanto una domanda. Non funziona, perché quella domanda
diventa un pedaggio che interrompe la cosa bella. Qui è il contrario:
**l'esercizio è la chiave, la spada e il piede di porco**.

Le domande arrivano dai moduli di quiz come in tutti gli altri giochi — sono
di tutte le materie, non solo matematica — e si fanno più difficili in due
modi insieme: **scendendo** (ogni piano alza l'asticella) e **scegliendo**
(un forziere chiede più di una porta). Un bambino prudente vede domande più
facili di uno che va a caccia di scrigni, e le vede nella stessa discesa.

## La scelta, anche potendo tornare indietro

Si può girare tutto, e non è un difetto: il peso viene da un'altra parte. La
mappa contiene sempre **più roba di quanta ne farà un bambino in una
seduta**, e sbagliare costa vita — chi ripulisce tutto arriva alla scala con
mezzo cuore. La scelta non è «quale porta» ma **«dove spendo le risposte»**,
ed è una scelta che si fa *sapendo*.

I **segni sopra le porte** servono a questo: 💀 c'è una guardia, 💎 roba
buona, 🏪 un mercante, ⛲ acqua. Si leggono **prima** di pagare, e non
mentono mai — dietro un teschio c'è davvero una guardia. Se un segno
promettesse a vuoto diventerebbe una decorazione, e con lui se ne andrebbe
l'unico motivo per cui tornare indietro è una scelta e non una penitenza.

## La scala è chiusa, e la chiave ce l'ha un guardiano

È la regola che tiene in piedi tutto il resto, e si è vista solo misurando: i
mostri **si possono aggirare tutti**, quindi senza di lei un bambino sveglio
scenderebbe di piano in piano senza rispondere a una domanda sola. Adesso il
minimo assoluto per scendere è battere un guardiano, e tutto il resto resta
facoltativo — che è quello che si voleva.

## Quanto costa una discesa, in domande

Misurato dal banco di prova (`motore/banco.js`, un giocatore finto che scende
davvero), non a occhio:

| discesa | piani | solo il guardiano | tutto il piano |
|---|---|---|---|
| Le cantine | 2 | 11 | 29 |
| Il pozzo | 3 | 41 | 64 |
| Le gallerie | 3 | 28 | 64 |
| La cisterna | 4 | 44 | 111 |
| Il labirinto | 3 | 50 | 104 |
| Il fondo | 4 | 44 | 91 |

**La forbice è il punto.** Se «tutto» costasse quanto «il minimo», in mezzo
non ci sarebbe più niente da scegliere — e la scelta è il motivo per cui un
posto è un posto. Il tetto sopra è una seduta: oltre le ottanta risposte
obbligate non è più un gioco, è un compito, e il test diventa rosso.

## Le tre luci

Nero = non ci sei mai stato. Scuro e freddo = te lo ricordi. Pieno e caldo =
lo stai guardando adesso. Un sotterraneo tutto illuminato è una piantina, e
su una piantina non c'è niente da esplorare — la piantina c'è, ed è la
**mappina** in alto a destra, che mostra solo quello che si è visto più i tre
punti che servono: dove sei, dov'è la scala, chi ha la chiave.

## La stanza è il confine

I mostri dormono finché non entri nella **loro** stanza; da lì ti vengono
addosso, e smettono appena esci. Non è una gentilezza: un mostro che ti
insegue per tutto il piano trasformerebbe il sotterraneo in una fuga
continua, uno che sta fermo in un percorso a ostacoli. Così il corridoio
diventa il posto dove si è al sicuro e **la soglia diventa una decisione**.
Sono anche più lenti di te, perché scappare deve funzionare sempre: «scappo
via» non è un bottone, è uscire di lì.

**E scappare costa un graffio.** Girare le spalle a un mostro che ti sta
addosso ti fa prendere quello che prenderesti rispondendo bene — poco da
un goblin, tre punti dal gigante. Gratis era la mossa migliore che ci
fosse: tutta la fuga e nessuna domanda, e un tasto così accanto a una
domanda risponde a un'altra domanda, quella su cosa costa meno. Il
numero sta scritto **sul tasto**, prima di premerlo.

## Cosa resta fra una discesa e l'altra

**Niente.** Dentro una discesa l'equipaggiamento scende con te di piano in
piano, ed è l'arco che dà senso a cercare una spada; fra una discesa e
l'altra si riparte nudi. Quello che resta è la campagna — le discese
superate, le stelle — e le monete nel salvadanaio.

Non è pigrizia: un equipaggiamento che persiste vuole un'economia (dove si
ripara, cosa si rivende, come si evita che l'ultima discesa sia una
passeggiata per chi ha l'ascia), e quella economia è un altro gioco. Se un
giorno la si vorrà, si cambia in `dati/campagna.js`.

## 🕳️ L'abisso: sotto il fondo, e senza fondo

Finite tutte e sei le discese, in fondo alla mappa compare **l'abisso**: una
discesa sola che comincia al piano 1 e non finisce. Non è la settima tappa e
non deve sembrarlo — non ha stelle, non ha un «superata», non entra
nell'indice della campagna.

La ragione non è «più contenuto». Nasce da una frase precisa: *«ho trovato
un'arma super figa e ora ho finito la tappa e la butta».* Dentro una discesa
l'equipaggiamento è sempre sceso di piano in piano; quello che si buttava era
il confine fra una tappa e l'altra. **In una discesa che non finisce quel
momento non arriva mai**, e la regola qui sopra resta intatta.

Cosa cambia scendendo:

- **le domande smettono presto di diventare più difficili.** `dif` parte da
  0,92 — dove finisce la sesta discesa — e sale di 0,02 a piano: al **quinto
  piano** è a 1 e ci resta appiccicata. Non c'è niente oltre, e non è una
  mancanza: la finestra delle domande è quella dell'**età del bambino**, non
  della tappa, e un bambino di nove anni al piano 40 non deve trovarsi
  domande da quattordicenne. Da lì in giù l'abisso non è più difficile *da
  studiare*, solo da sopravvivere;
- **i mostri crescono, ma non come prima.** Le ossa salgono del 22% a piano —
  è la leva principale, quella che il bottino compensa — e l'attacco le segue
  a un terzo del ritmo (`+1 ogni tre piani` invece che ogni due). La difesa
  **non cresce mai**: entra in una sottrazione, e allunga la battaglia invece
  di indurirla. Il numero vecchio non si vedeva leggendo la tabella: al piano
  20 un orco picchiava 14 contro una difesa che arriva sì e no a 9, e la metà
  passava **anche rispondendo bene**, perché il graffio è metà del colpo;
- **la forma del piano gira invece di crescere** (34, 42, 52 celle a rotazione).
  Un sotterraneo più grande *sembra* più difficile ed è solo più lungo, e la
  noia non è difficoltà;
- **svenendo si perdono le tasche, mai il corredo.** L'arma, lo scudo,
  l'armatura e l'anello restano addosso; le sei tasche si svuotano e le gemme
  si dimezzano. Punisce senza umiliare: se ne va il margine accumulato, non il
  lavoro di dieci piani. Le occasioni sono **tre per piano e ripartono
  scendendo** — scendere è la cosa che si è guadagnata, accamparsi su un piano
  no;
- **e all'ultima occasione la discesa non si butta.** Si risale, e quello che
  finisce è la sera: la mappa offre in cima «l'abisso · piano 23 — torno giù
  da dove ero», con addosso quello che si aveva. Nessuno rifà ventitré piani
  a piedi.

Il record — il più giù dove si è arrivati — sta in `cfg.abisso`, accanto
all'eroe scelto, e non fra le stelle: quelle sono un oggetto dentro il
profilo, e una chiave per piano finirebbe in ogni salvataggio per sempre.

**Fin dove regge, oggi.** Il bottino non ha ancora gradi: l'eroe si ferma al
gradino 3 delle armi e i mostri no. Col migliore equipaggiamento che il gioco
sa produrre l'abisso si gioca per **una decina di piani** (misurato: 8–13 su
sei semi), che sono due o tre serate; partendo nudi si va dal piano 4 al 13 a
seconda di chi scende e di quanto si esplora. Il costo di un piano invece
**non cresce** — fra 6 e 25 domande obbligate dal primo all'undicesimo — ed è
il segno che ossa e braccio si muovono insieme. Il pezzo che manca per andare
più giù è il **bottino graduato** (`ascia#7`), che è il lavoro dopo.

**La difesa vale più dell'attacco, quaggiù**, ed è una conseguenza che non
era stata prevista: il graffio è `(attacco del mostro − la tua difesa) / 2`,
quindi un punto di difesa vale il doppio di un punto di vita a ogni scambio.
Fra i quattro eroi il nano arriva più giù di tutti e il cavaliere meno,
a parità di braccio.

## Una discesa si può lasciare a metà

Tre o quattro piani, quaranta domande, venti minuti buoni: una discesa dura
più di quello che un bambino ha davanti prima di cena. Prima, uscire voleva
dire buttarla via.

Adesso **si esce e si riprende**. Uscendo si scrive dove si era, e la mappa
delle discese lo offre in cima: «piano 2 di 3 · ❤️ 14 · 💎 37 — torno giù da
dove ero». Il piano non si salva, si **rifà dal seme**: sono le celle a
essere una funzione del numero. Quello che si salva è ciò che è *successo*
— chi è caduto, cosa si è aperto, cosa sta per terra, quanta mappa hai
girato — perché lì di mezzo c'è il caso, e il caso non si riavvolge. Un
salvataggio pesa un paio di chilobyte (`motore/sosta.js`).

Due scelte dentro questa:

- **Riprendendo, i mostri sono tornati al loro posto.** Riaprire il gioco
  con l'orco addosso e un colpo già partito è il modo più rapido di far
  pentire qualcuno di aver ripreso. È la stessa regola del risveglio dopo
  uno svenimento.
- **Si salva sempre**, anche dopo due passi e a mani vuote. La regola con
  l'eccezione — «solo se hai fatto abbastanza» — sembrava più pulita e non
  lo è: quello che si perde in una discesa appena cominciata non sono le
  gemme, è **la mappa già girata**, e girare al buio è metà del gioco.

Se il formato del salvataggio cambia, quello di ieri **non si legge**: si
ricomincia la discesa. Una partita persa è un dispiacere; una partita
ripresa con dei campi che non tornano è un gioco rotto in un modo che
nessuno sa spiegare.

## Quello che sta per terra si tocca

Le gemme si prendono camminandoci sopra — sono il conto in tasca, non una
scelta. **Tutto il resto va toccato**, e le sei tasche valgono qualcosa
solo per questo: una spada che entra nello zaino mentre passavo di lì è una
spada che non ho scelto.

Toccare un'arma o un'armatura **migliore di quella che si ha** la mette
addosso da sé, e la riga che compare dice quanto si è guadagnato: «Spada
⚔️ +2». Prima si apriva un foglio col confronto, e la ragione era buona —
è il solo numero che dice quanto vale un'arma — ma chiedeva *una
decisione che non è una decisione*: davanti a un'arma migliore di quella
in pugno non esiste un secondo tasto sensato. Erano tre tocchi per un sì
scontato, chiesti mentre si gira per una stanza.

Quello che è peggio o uguale finisce in tasca, e lo si confronta con
calma nello zaino, che è il posto dove si sceglie davvero. Vale anche
per quello che si **compra**: chi ha appena speso venti gemme per una
corazza migliore non sta scegliendo se metterla. Quello che si
aveva addosso **non si perde mai**: torna nello zaino, o prende il posto
per terra di quello che si è raccolto se le tasche sono piene. Uno
scambio, mai una perdita. I gioielli restano fuori dall'automatismo
quando il dito è già occupato: fra due anelli non c'è un «più forte»,
c'è un modo di giocare diverso, e quella è una scelta vera.

Nello zaino, una tasca toccata **sceglie** e basta: sotto compaiono cosa fa
quella cosa e due tasti larghi, «la bevo» e «la lascio per terra». Prima il
tocco faceva subito l'unica cosa sensata, e con sei tasche piene non c'era
nessun modo di liberarne una se non bere una pozione buona per fare posto.

Un **forziere già aperto è scenografia**: non si tocca più, e da lì in poi è
pavimento dipinto. Finché restava toccabile si mangiava il tocco destinato
alla roba che ci stava sopra — roba che, per giunta, nasceva *sulla sua
stessa cella*, dove il baule la copriva e dove l'eroe non arriva mai, perché
a un forziere ci si ferma accanto.

## Un mostro picchia sempre

Rispondendo bene si para il colpo e ne resta **un graffio** — metà del
danno pieno; sbagliando arriva tutto. Prima chi rispondeva bene usciva da
una battaglia senza un livido, e le pozioni si accumulavano in fondo allo
zaino senza che nessuno le bevesse mai: con loro spariva il motivo di
cercare una fonte, di spendere dal mercante, di decidere se scappare.

Il conto vero diventa quindi **la lunghezza della battaglia**: chi ha
l'arma buona fa fuori il gigante in quattro risposte e ne esce con otto
graffi, chi va a mani nude ne prende il doppio. È lo stesso motivo per
cui si va a cercare una spada, detto in vita invece che in domande. E si
dice **prima** di rispondere — «ti graffia 2 · se sbagli 4» sta scritto
sotto il mostro — perché è con quei due numeri che si decide se restare.

E si **racconta dopo**, con due numeri: «⚔️ gli hai tolto 8 · ti ha
graffiato 3». Il graffio c'era da sempre, ma non si vedeva — la propria
barra calava e partiva un rumore di botta, che per giunta era *lo stesso
suono dell'errore*: chi aveva appena risposto giusto ne concludeva di
aver sbagliato. Adesso il graffio ha un suono suo, sordo e breve, e una
riga che dice com'è andato lo scambio.

Il banco lo misura, e il risultato è quello che si voleva: chi corre
dritto alla scala sviene una o due volte per discesa, chi gira e
raccoglie quasi mai. La fretta si paga, l'esplorazione ripaga.

## E si può anche non tornare su

Svenire riportava all'ingresso con metà gemme e mezza vita, e si poteva
riprovare all'infinito: il banco diceva che **la discesa si vinceva
comunque** — dodici su dodici anche rispondendo giusto quattro volte su
dieci. Una tappa che si supera a caso non misura niente, e la stella in
meno non è una risposta: si vede a cose fatte, e chi tira a caso non la
stava guardando.

Adesso le occasioni sono contate: **quattro più una per piano** (sei
nelle cantine, otto nel fondo). All'ultima si risale, la tappa non è
superata e si rigioca da capo — la stessa fine di chi decide di
smettere, raccontata per quello che è. Il cartello dello svenimento dice
sempre quante ne restano: un fondo che non si vede arrivare è una
partita che finisce senza motivo.

Nell'abisso il conto è un altro — tre per piano, e riparte scendendo — e
all'ultima non si ricomincia da capo: si risale e si rientra da lì. Là
sotto non c'è nessuna tappa da fallire, quindi il contatore serve a
rendere leggibile la serata e non a difendere l'economia (vedi sopra).

Insieme a questo la vita di partenza è scesa di un quarto (il cavaliere
da 24 a 18). I numeri non sono a occhio: venti discese per tappa, nei
due modi di giocare. A otto risposte giuste su dieci si arriva in fondo
diciotto volte su venti o più — il patto del banco, e resta intero; a
sei su dieci circa metà delle volte; a quattro su dieci, cioè premendo a
caso, quasi mai — salvo nelle cantine, che sono la tappa dove si impara
la strada e devono perdonare.

## La torcia non si accende: si ha

Era una cosa da usare: la raccoglievi, occupava una tasca, e poi
bisognava aprire lo zaino e premere «l'accendo». Ma quella non è una
scelta — non esiste il momento in cui uno preferisce restare al buio —
ed era per giunta l'unico modo di scoprire che la torcia serviva a
qualcosa. Adesso si accende **appena la prendi**, e non entra nemmeno
nello zaino: una tasca in meno spesa per una cosa che non si può
sbagliare. Averla accesa conta come averla, quindi il mercante non te ne
offre una seconda.

## Due mani, e chi ne occupa due

Le armi leggere — spade corte, accette, il pugnale — **si portano due
alla volta**, una per mano; quelle grosse (spadoni, asce, archi,
bastoni) vogliono tutte e due le mani e dichiarano `mani: 2` in
[`dati/cose.js`](../src/giochi/sotterraneo/dati/cose.js).

La mano debole colpisce **la metà, arrotondata per eccesso**, ed è il
numero che tiene in piedi tutte e due le strade: due armi di secondo
gradino valgono un terzo gradino, quindi lo spadone non diventa mai una
scelta sbagliata e portarne due non è la sola cosa sensata da fare. I
tratti invece valgono pieni anche a sinistra — la luce di una lama che
brucia illumina uguale in qualunque mano, perché è una copia sola
dell'oggetto.

Nel corredo la casella di sinistra, quando in pugno c'è un'arma a due
mani, **non è vuota: porta la stessa arma in ombra e girata**. Lasciarla
vuota diceva il contrario di quello che succede — che ci si poteva
mettere qualcosa — e non c'era modo di scoprire perché non funzionava.
Nel campo, chi ne porta due le porta una per lato; un'arma a due mani
si posa invece **in mezzo, davanti al corpo**, che è come si tiene
un'asta. La prima idea era posarne una copia sbiadita anche dall'altro
lato, come fa il corredo con l'ombra nella casella: a schermo si vedono
due armi, non una tenuta in due — l'ombra funziona in un elenco di
caselle, dove il posto vuoto ha un significato, non addosso a una
figura.

Dove finisce un'arma raccolta lo decide `postoDellArma`, che prova le
sistemazioni possibili e tiene la migliore: col pugno pieno di un'arma
leggera, una seconda leggera vale più nella sinistra che al posto di
quella che c'è. Un'arma a due mani sfratta la sinistra, e quello che
c'era **torna in tasca**, o per terra se le tasche sono piene.

Gli scudi e le armature ci sono, e sono arrivati in due giri: né 0x72 né
il primo foglio degli oggetti li disegnavano — si equipaggiavano solo le
mani — e per un pezzo panciotto, corazza e manto sono rimasti emoji, un
giubbotto da cantiere in mezzo a uno schermo disegnato a mano. Adesso i
sei scudi vengono da `items2.png` e le vesti da `item3.png`.

Quello che **non** c'è, e non ci sarà con questo set, è l'armatura
*addosso*: 0x72 non ha un fotogramma in cui il personaggio impugni o
indossi qualcosa, l'arma si disegna accanto a lui, e la figura di ogni
classe è fissa. Un'armatura vive quindi solo come icona — nello zaino,
per terra, al banco — ed è il patto del set, non una svista.

## Le curiosità: le cose che si toccano per vedere che succede

Un libro polveroso, una sfera di cristallo, una clessidra ferma, un
calice pieno di qualcosa. Non servono a niente, e sono lì per quello: un
sotterraneo fatto solo di mostri da abbattere e porte da aprire è **una
fila di esercizi con un tema sopra**, e dopo tre discese si vede
benissimo che è quello.

Una domanda, e poi una frase. Quello che un bambino racconta a tavola non
è «ho preso otto gemme»: è che ha starnutito così forte da spegnere una
torcia in fondo al corridoio, o che ha bevuto una roba che sapeva di
calzino di orco. Perciò qui il grosso del lavoro sono **le frasi** —
quaranta per quando va bene, quaranta per quando va male — e il foglio
non si chiude da sé: la battuta resta finché non si è letta.

Rispondendo giusto arriva un premio (gemme, vita, un punto di vita
massima, la torcia). Rispondendo storto, **metà delle volte non succede
niente**: hai starnutito, e basta. Quando succede è mite — due punti di
vita o qualche gemma — perché in un gioco dove uno svenimento ti riporta
all'ingresso un malus vero è una punizione che fa chiudere il gioco, e
perché se ogni risposta storta costasse qualcosa toccare le cose
diventerebbe una cosa da evitare: tanto varrebbe non metterle. Il costo
lo dichiara la singola frase, così chi ne scrive una nuova decide lì se
pesa o se fa solo ridere.

L'invito dice sempre che può andare male, prima di rispondere: una
sorpresa cattiva non annunciata è la cosa che i bambini ricordano
peggio, e la scommessa è tutto il gioco.

**Ce ne sono più di prima.** Erano una o due per piano, cioè meno di una
stanza su quattro; guardando giocare, quello che un bambino cerca non è
il mostro seguente ma *cosa fa quel libro* — e trovarne uno ogni due
piani vuol dire mandarlo a caccia di una cosa che quasi non c'è. Adesso
sono due o tre, e sui piani grandi tre o quattro: una ogni tre stanze
circa, la stessa densità dei forzieri. Il costo della discesa non cambia
— una curiosità non è un pedaggio, si passa oltre — cambia quello che
c'è da guardare.

## Quello che non si tocca lo dice

Barili, casse, ossa, bracieri: arredo, cioè cose che stanno lì per far
sembrare che qui sotto ci abbia vissuto qualcuno. Il gioco sapeva già
che non sono toccabili, e le cose vere hanno un filo di luce dorato
intorno — ma i bambini le toccavano lo stesso e chiedevano a cosa
servissero. La domanda è ragionevole: sono disegnate dallo stesso foglio
di un forziere, e un filo che respira piano è una convenzione che
nessuno ha mai spiegato loro.

Due risposte, e servono tutte e due. L'arredo adesso è disegnato **più
spento** delle cose che rispondono (non sparisce: una stanza senza
arredo è una stanza vuota, che è il difetto opposto), e toccandolo si
ottiene una riga — la prima volta la regola, «quello che si può toccare
ha la luce intorno», dopo la battuta: *una cassa sfondata: dentro non
c'è più niente*. Una cosa che non fa niente e non dice niente non si
legge come «non fa niente»: si legge come rotta.

## Il banco del mercante: si compra, e adesso si vende

È l'unica stanza senza domande: qui si **spende** quello che le domande
hanno fruttato, ed è la ragione per cui un gioco in cui ogni cosa costa
un esercizio non diventa un compito. Ogni riga dice cosa fa l'oggetto,
non solo come si chiama — «Sbagliare fa meno male» è un motivo per
comprare, «Corazza 💎18» è un listino — e quello che non ci si può
permettere resta visibile e spento: sapere cosa c'era è il motivo per
tornare.

Sotto il banco ci sono **le proprie tasche**, a metà prezzo. Non è un
modo di fare gemme (comprare e rivendere perde metà del valore), ma è la
risposta a due cose che succedevano di continuo: sei tasche piene, con
l'unico modo di liberarne una che era buttare per terra quello che c'era
dentro; e la spada di ieri che restava in fondo allo zaino per sempre,
adesso che se ne ha una migliore.

Il catalogo è lungo una quarantina di voci, e il mercante ne tiene cinque per volta:
con tre, pescate a caso, capitava di continuo un banco in cui non c'era
niente che servisse — e un mercante da cui non si compra mai è una stanza
attraversata.

Fra quelle ce ne sono **quattro che hanno un nome proprio** — la bipenne
solare, la spada del ladro, il pugnale vampiro, la spada di ghiaccio.
Non rompono la regola delle quattro famiglie (a parità di gradino
valgono tutte lo stesso): stanno *fuori* dalla scala, e quello che le
distingue non è quanto fanno male ma un tratto che di solito sta
altrove — fanno luce, fruttano di più, tengono in piedi, parano.
Nessuna batte lo spadone sul suo terreno, o la scala non servirebbe più
a niente.

## Le porte chiudono la stanza, non il varco

Una stanza ha due o tre aperture. Prima se ne chiudeva **una sola**, per
non far pagare due volte lo stesso posto: il ragionamento era giusto e la
cura sbagliata, perché il segno 💀 sopra la porta prometteva una guardia
che si scavalcava passando dall'altra parte. Peggio ancora dove due
corridoi paralleli si affiancano — capita — e lì il varco è largo due
celle: la porta ne copriva una, e si passava letteralmente accanto al
battente.

Adesso si chiudono **tutti** i varchi di una stanza, e rispondere ne apre
una e con lei tutte le altre: il pedaggio resta uno solo. Perché questo
non trasformi il premio in un casello, le stanze che valgono qualcosa —
mercante, fonte, forzieri — si pescano **fra le foglie**, quelle con un
solo collegamento, dove non si passa per andare altrove; e prima di
sbarrarne una si cammina fino alla scala per controllare che ci si arrivi
lo stesso. Se non ci si arriva, quella stanza resta aperta e senza segno:
meglio una stanza che si visita gratis di una promessa che è in realtà un
obbligo.

## Chi scende, e cosa si porta

Quattro eroi — cavaliere, elfa, mago, nano — e la differenza sta in **due
numeri soli**: quanto reggi e quanto fai male. Niente tratti nascosti,
niente abilità da ricordare: sono le due colonne che compaiono nella
scelta, e un bambino di sette anni le confronta da solo.

| | vita | braccio | com'è |
|---|---|---|---|
| 🛡️ Cavaliere | 24 | 3 | tiene botta |
| 🧝 Elfa | 20 | 4 | colpisce più forte, regge meno |
| 🧙 Mago | 16 | 5 | i mostri cadono in metà risposte, ma ogni sbaglio fa malissimo |
| 🧔 Nano | 26 | 3 (difesa 2) | sbagliare gli fa quasi il solletico |

Il costo di un mostro è le sue ossa diviso il tuo braccio, quindi
l'attacco è la manopola **velenosa**: la stessa campagna costa 13–33
domande al cavaliere e 8–21 al mago, che però sviene molto più spesso.
Nessuno scende sotto braccio 3 — con 2 l'orco costerebbe dodici risposte
di fila, che non è difficile: è lungo. I numeri li misura il banco
(`unita/sotterraneo` gioca la campagna con tutti e quattro), non l'occhio.

Si sceglie **una volta e resta**, dalla mappa delle discese: chiederlo
prima di ogni discesa sarebbero due tocchi in più ogni volta, e la
risposta sarebbe la stessa di ieri.

Addosso ci sono **tre caselle**: la mano, il corpo, il dito. Le armi sono
quattro famiglie in tre gradini — spade, asce, archi, bacchette — e a
parità di gradino **valgono lo stesso**: è la regola dei due rami di una
torre nel castello, cambia la forma e mai la quantità, perché altrimenti
ci sarebbe una famiglia giusta e tre da evitare. Al dito ci va l'unica
cosa che non picchia: vedere più lontano, tornare su con più gemme,
reggere un colpo in più. Ce n'è uno solo, quindi si sceglie.

Nello zaino le caselle stanno **intorno alla figura** di chi le porta,
con in pugno l'arma vera: guardando si vede come si è messi, senza
leggere una riga.

## Come è disegnato

Con due fogli: **0x72, «16×16 DungeonTileset II», CC-0** per il mondo, i
mostri e i quattro eroi, e un foglio di oggetti per quello che si
raccoglie — armi, pozioni, gioielli, e l'arredo delle stanze. L'atlante
ritagliato su misura pesa 34 KB per 162 pezzi, incorporato in base64 —
il build resta un file solo.

Il foglio degli oggetti arriva **senza canale alfa e a tripla
grandezza**: il fondo nero lo toglie `atlante.py` allagando dai bordi
(`"fondo": "auto"`), e la scala è dichiarata `3` — misurata per
proporzione contro le armi 0x72 che già c'erano, non indovinata (una
spada ridotta deve stare fra i 13 e i 37 px del set, e 1254 diviso 3 fa
418 esatto). Una scala sbagliata non dà nessun errore: dà un'arma alta
il doppio dell'eroe.

**L'arma si posa accanto al pugno**, staccata, e respira col passo: è
quello che permette a dodici armi di andare bene per quattro
personaggi senza disegnarne quarantotto.

Le stanze hanno un po' d'arredo — barili, casse, ossa, uno stendardo
appeso, un braciere che arde e fa luce. Non si tocca, non blocca, non
vale niente: serve solo a far sembrare che qui sotto ci abbia vissuto
qualcuno. Un sotterraneo di stanze vuote e mostri si legge come un
diagramma, e un diagramma non fa venire voglia di girare l'angolo. Lo monta `strumenti/sprite/atlante.py`
(vedi il suo `FORMATO.md`), che genera lo stesso PNG anche dentro il
banco `strumenti/banco/mondo.html`, che legge lo stesso modulo: se i due si scollassero, quello che si
prova sul prototipo non direbbe più niente sul gioco.

Quello che i fogli **non hanno** resta emoji: la fontana e il mercante.
Le tre armature ci sono state a lungo, e stonavano — è il tipo di buco
che va guardato *prima* di innamorarsi di un set — finché non è arrivato
un terzo foglio dello stesso autore (`item3.png`) che le disegna. Di
quel foglio si ritagliano **sette figure su centotrentasei**: l'atlante
viaggia in base64 dentro il file unico, quindi si porta dentro solo
quello che qualcuno nomina, e il suo foglietto scrive cosa è rimasto lì.

## Da guardare in mano a un bambino

Tre numeri sono tarati a occhio e vanno visti giocare:

- **quanto sono più lenti i mostri** (3,1 celle al secondo contro 5,4) e i
  **tre secondi di calma** dopo una fuga: sono i numeri che decidono se una
  stanza fa paura o fa arrabbiare;
- **quante stanze per piano** — si comincia da quattro e si arriva a sedici,
  ma se un piano non si finisce mai la scala smette di essere un traguardo;
- **il suono**, che qui dentro c'è appena.
