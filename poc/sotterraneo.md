# Il sotterraneo — stato del lavoro

> **Il gioco esiste.** Da agosto 2026 sta in `src/giochi/sotterraneo/`,
> dietro «i giochi in prova», con le domande vere dei moduli di quiz e sei
> discese — la pagina è [`docs/sotterraneo.md`](../docs/sotterraneo.md), e
> quello che manca ancora sta in [`todo.md`](../todo.md). Questi due
> prototipi **restano**: sono il posto dove provare un'idea prima di
> metterla nel gioco, e l'atlante ce lo tiene allineato `atlante.py`, che
> scrive lo stesso PNG qui dentro e nel modulo del gioco. Le decisioni qui
> sotto sono quelle che il gioco ha ereditato; dove il gioco ha deciso
> diverso, è segnato.

*Aggiornato il 15 agosto 2026. Il prototipo è [`sotterraneo.html`](sotterraneo.html),
si apre col doppio click. Questo file dice cos'è, cosa è stato deciso e
cosa manca — così chi lo riprende in mano fra due settimane non deve
rileggere millecinquecento righe per capire a che punto era.*

## Cos'è, e cosa non è

Un sotterraneo che si **cammina**, dall'alto, col dito: si tocca dove si
vuole andare, si entra nelle stanze, si toccano le cose. Ogni cosa che
vale qualcosa ha un prezzo, e **il prezzo è rispondere**.

| cosa si tocca | cosa costa |
|---|---|
| 🚪 una porta chiusa | una domanda facile — sbagliando si riprova |
| 🎁 un forziere | **una domanda sola, tosta**: se la sbagli resta chiuso per sempre |
| 👹 un mostro | una domanda per colpo, finché non cade |
| ⛲ una fonte | una domanda, e ti ridà vita |
| 🏪 un mercante | niente domande: qui si **spende** quello che le domande hanno fruttato |

**Non è il Dungeon di `src/giochi/dungeon/`, e non lo sostituisce.**
Quello è un gioco a carte: una mappa a nodi, un bivio alla volta, non si
torna indietro. Questo è un posto invece che un diagramma. I due possono
convivere: fanno cose diverse con gli stessi esercizi. Se un giorno se ne
tiene uno solo, sarà perché i bambini avranno detto quale, non perché si
somigliano nel nome.

## Cosa c'è già

- **Una mappa vasta, generata tutta in una volta.** 52×52 celle, sedici
  stanze, corridoi, porte. Contenuti compresi: quando si entra in una
  stanza non si decide niente lì per lì, si accende la luce su cose già
  decise. È la differenza fra un posto e un distributore di sorprese —
  un posto lo si può *ricordare*, e tornarci dopo con l'ascia in mano.
- **Il seme.** Stesso seme, stesso sotterraneo:
  `sotterraneo.html#seme=812` riapre lo stesso identico piano. Serve a
  poter dire «guarda la stanza in basso a destra» invece di «fidati».
- **Un controllo che il piano sia giocabile** (`Livello.guasti()`), che
  cammina davvero dall'ingresso trattando le porte chiuse come muri, e
  chi genera riprova finché non torna. Su **600 piani generati, zero
  guasti**.
- **Le tre luci**: nero = non ci sei mai stato, scuro e freddo = te lo
  ricordi, pieno e caldo = lo stai guardando adesso. Un sotterraneo
  tutto illuminato è una piantina, e su una piantina non c'è niente da
  esplorare.
- **La mappina** in alto a destra: solo quello che si è visto, più i tre
  punti che servono — dove sei, dov'è la scala, chi ha la chiave.
- **I segni sopra le porte** — 💀 c'è una guardia, 💎 roba buona, 🏪 un
  mercante, ⛲ acqua. Si leggono **prima** di pagare, e non mentono mai.
  Sono il pezzo che rende sensato tornare indietro: si guarda cosa
  promette una porta, si va a vedere l'altra, si torna quando si è più
  forti.
- **Lo zaino**: due caselle addosso (mano, corpo) e sei tasche. Le tasche
  sono un limite vero: quando sono piene, quello che c'è per terra resta
  per terra, e va scelto cosa lasciare.
- **I mostri inseguono, ma solo dentro la loro stanza.** Dormono (💤)
  finché non entri; da lì ti vengono addosso, e al contatto parte lo
  scontro. Escono dalla soglia mai: chi corre fuori se li lascia dietro,
  e quando torna li ritrova al loro posto, feriti com'erano. Sono più
  lenti di te — 3,1 celle al secondo contro 5,4 — perché scappare deve
  funzionare sempre, o la stanza è una trappola invece che una scelta.
- **Lo scontro**: il mostro ha ossa, attacco e difesa; quanto costa
  abbatterlo è **la sua vita diviso il tuo attacco**, cioè cambia con
  quello che hai trovato. Si può scappare a metà: il mostro resta
  ferito, si prende tre secondi di calma — il tempo di uscire dalla
  stanza — e poi torna addosso a chi è rimasto lì dentro.
- **Lo zoom**, a numeri interi da 2 a 5, col pizzico o la rotella. Si
  parte da 3: a 2 si vedeva mezzo piano per volta e la stanza si
  leggeva come una piantina — e una piantina ce l'abbiamo già in alto a
  destra, che è il suo posto.
- **I piani**: la scala scende, i mostri hanno più ossa, le domande si
  fanno più toste. Quello che hai addosso scende con te.

## Le decisioni prese, e perché

- **L'esercizio non sta accanto al gioco, è la chiave del gioco.** La
  tentazione era: cammina, e ogni tanto un quiz. Non funziona, perché
  quel quiz è un pedaggio che interrompe la cosa bella. Qui non c'è
  nessuna azione interessante che si compia senza rispondere, e nessuna
  risposta che non apra qualcosa che si vede.
- **La scala è chiusa, e la chiave ce l'ha un guardiano.** Questo è il
  buco che si è visto solo misurando: i mostri **si possono aggirare
  tutti**, quindi senza questa regola un bambino sveglio scende di piano
  in piano senza rispondere a una domanda sola. Adesso il minimo
  assoluto per scendere è battere un guardiano, e tutto il resto resta
  facoltativo — che è quello che si voleva.
- **Si può tornare indietro, e non è un difetto.** Nel Dungeon a carte
  il bivio pesa perché è irreversibile. Qui il peso viene da un'altra
  parte: la mappa contiene sempre **più roba di quanta ne farà un
  bambino in una seduta**, e sbagliare costa vita. Chi ripulisce tutto
  arriva alla scala con mezzo cuore. La scelta non è «quale porta» ma
  «dove spendo le risposte», ed è una scelta che si fa *sapendo*, il che
  per un bambino di sei anni è meglio.
- **Solo il forziere si perde per sempre.** Una porta sbagliata si
  riprova; un forziere no. Serve **una** cosa che faccia batticuore, e
  una sola: se si perdesse tutto per sempre, girare diventerebbe una
  partita a scacchi invece che un giro.
- **La stanza è il confine, e per questo è una stanza.** Un mostro che
  ti insegue per tutto il piano trasformerebbe il sotterraneo in una
  fuga continua; uno che sta fermo lo trasforma in un percorso a
  ostacoli. Inseguendo solo dentro la propria stanza, il corridoio
  diventa il posto dove si è al sicuro e **la soglia diventa una
  decisione** — che è esattamente dove volevamo che il bambino
  scegliesse. Anche «scappo via» cambia senso: non è un bottone, è
  uscire di lì.
- **Raccogliere non è una decisione.** Gemme e roba per terra si
  prendono camminandoci sopra. Chiedere di confermare trasformerebbe la
  ricompensa in una pratica da sbrigare.
- **«Prima ci va, poi si decide» — qui sì.** Nella fattoria è stato
  provato e buttato, perché fra il tocco e il pannello si metteva
  un'attesa inutile davanti a un menù. Qui il camminare *è* il gioco: il
  pannello arriva quando si è arrivati, e quel viaggio era la cosa che
  si stava facendo. Stessa meccanica, verdetto opposto, e la differenza
  non è di gusto.
- **Niente sprite, apposta.** È disegnato a codice: rettangoli, un po'
  di rumore stabile per i ciottoli, e le facce dei muri più chiare dove
  danno sul pavimento. Il prototipo serve a decidere se **il modo di
  giocare** regge, prima di andare a cercare un foglio di tessere. Se
  regge, la grafica vera si aggancia in un posto solo (`class Tela`).

## Quanto costa un piano, in domande

Misurato dal banco, non a occhio (`tmp/prova-sotterraneo.mjs`):

| | minimo (solo il guardiano) | tutto il piano |
|---|---|---|
| piano 1, eroe nudo | **5** | 58 |
| piano 3, con spada e corazza | **4** | 42 |
| piano 6, ben equipaggiato | **7** | 68 |

La forbice è il punto: **cinque domande per scendere, sessanta per non
lasciare niente indietro**, e in mezzo c'è tutto quello che si sceglie.
Il primo giro di numeri era da buttare — ventiquattro risposte di fila
contro un solo guardiano al piano 1 — e il difetto non si vedeva
leggendo la tabella dei mostri: si vedeva solo contando. La difesa dei
mostri è la manopola velenosa (con attacco 3 e difesa 2 il colpo scende
a 1, e le ossa vanno divise per uno).

## Cosa mancava, e cosa ne è stato

1. **Le domande vere.** ✅ *Nel gioco*: arrivano da `domandaPerGioco()`, e
   il motore dice soltanto quanto devono essere difficili. Qui nel
   prototipo resta il banchetto finto di conti, ed è giusto così: serve a
   provare il ritmo senza tirarsi dietro mezzo repo.
2. **La telecamera non si stringe quando sale un pannello.** ✅ *Nel
   gioco*: col foglio aperto la telecamera **alza l'eroe** di un quarto
   di schermo, che costa una riga e risolve la stessa cosa che il
   castello risolve stringendo il campo.
3. **Le due manopole dell'inseguimento** — quanto sono più lenti (3,1
   contro 5,4) e i tre secondi di calma dopo la fuga. **Ancora da
   guardare in mano a un bambino**: sono i numeri che decidono se una
   stanza fa paura o fa arrabbiare. Da provare anche se un mostro debba
   svegliarsi pure in corridoio — adesso no, e il corridoio è
   completamente sicuro.
4. **Sedici stanze sono forse troppe per una seduta.** ✅ *Nel gioco* è
   diventata una manopola della campagna (`giri`, i tagli del BSP): si
   comincia da quattro stanze e si arriva a sedici solo al labirinto.
   Quanto sia giusta la scala, lo dirà un bambino che gioca.
5. **Cosa resta fra una discesa e l'altra.** ✅ *Deciso*: niente. Dentro
   una discesa l'equipaggiamento scende con te di piano in piano — è
   l'arco che dà senso a cercare una spada — e fra una discesa e l'altra
   si riparte nudi; quello che resta è la campagna. Il perché per esteso
   sta in testa a `src/giochi/sotterraneo/dati/campagna.js`.
6. **Gli sprite: fatti**, e stanno in un secondo file affiancato —
   [`sotterraneo-gfx.html`](sotterraneo-gfx.html), come `fattoria.html`
   e `fattoria-gfx.html`. Cosa si è imparato montandoli sta più sotto.
7. **Il suono**, che qui non c'è per niente. Nel gioco c'è il minimo — un
   colpo, un passo, una moneta — e resta la cosa più indietro di tutte.

## La versione con gli sprite

[`sotterraneo-gfx.html`](sotterraneo-gfx.html) è lo **stesso gioco**
disegnato con un foglio di tessere vero: **0x72, «16×16 DungeonTileset
II», CC-0** — pavimenti, muri, porte ad arco, forzieri a tre stadi,
monete che girano, e personaggi animati (un cavaliere, goblin,
scheletri, orchi, un mostro grosso). L'atlante ritagliato su misura pesa
**10 KB per 106 pezzi**, incorporato in base64: il file resta uno solo e
si apre col doppio click. Lo monta `strumenti/sprite/dungeon.py`
partendo da `strumenti/sprite/sorgenti/0x72/pezzi.json`.

Le cose che valgono anche per il prossimo set:

- **Del gioco non è cambiata una riga.** Generazione, scontri,
  inseguimento, inventario: identici. È stata riscritta solo la classe
  `Tela`, che è dove doveva stare il confine. Per questo **cambiare
  foglio di tessere costa un JSON di coordinate**, non un pomeriggio —
  finché non cambia la *geometria*.
- **E la geometria qui cambia.** Questo set disegna la parete come la si
  vede di fronte: una fascia di mattoni con sopra il suo coronamento,
  quindi **il muro a nord di una stanza occupa due celle**, non una. Un
  set con i muri visti dall'alto vorrebbe un altro disegno. È il costo
  vero di un cambio di famiglia, ed è nella `Tela` e in nessun altro
  posto.
- **Prima si riempie, poi si rifinisce.** Il primo tentativo metteva
  solo i pezzi «giusti» per ogni bordo, e le pareti venivano bucate: le
  celle che toccano il pavimento solo in diagonale restavano nere. Una
  parete bucata non sembra uno stile, sembra un guasto. Adesso ogni
  roccia che tocca il pavimento — anche per un angolo solo — si dipinge
  di mattoni, e sopra ci vanno le rifiniture.
- **Meglio semplice e giusto che ricco e storto.** Il set ha delle
  colonne per i fianchi est e ovest, pensate per essere impilate in
  un'altra geometria: infilate qui lasciavano strisce che non
  combaciavano con niente. Sono state tolte, e i fianchi sono mattoni
  come il resto. La tentazione di usare tutti i pezzi che un foglio
  offre è forte, e va tenuta a bada.
- **Le bordature le sceglie il motore**, non il disegno: `bordoOtto()`
  di `src/grafica/tessere.js` — potenziato apposta per questo, con i
  suoi test in `unita/tessere` — dà una chiave («il pavimento sta sotto»,
  «sotto e a destra», «manca solo l'angolo») e una tavola dice quale
  pezzo mettere. Aggiungere una forma è aggiungere una riga alla tavola,
  mai un `if` in mezzo al disegno.
- **Quello che il foglio non ha, non si inventa.** 0x72 **non ha torce**
  (cercate in tutti e 370 i nomi dello zip: ci sono fontane e bracieri,
  torce no), non ha topi né pipistrelli, e soprattutto **non ha
  armature, scudi o elmi**: equipaggia solo le mani. Quindi i mostri del
  gioco sono diventati quelli che il foglio sa disegnare — goblin,
  scheletro, orco, gigante — mentre le tre armature restano emoji, e si
  vede che stonano. È esattamente il tipo di buco che decide se un set
  basta: va guardato **prima** di innamorarsene.
- **Col foglio aperto la telecamera alza l'eroe.** Da quando i mostri ti
  vengono addosso, lo scontro parte dove sei: se la telecamera lascia
  l'eroe in mezzo allo schermo, finisce sotto il pannello e si risponde
  a domande su un mostro che non si vede.

## Come si prova

```bash
node poc/prova.mjs sotterraneo          # Chrome, tocchi a caso, errori di console
node tmp/prova-sotterraneo.mjs          # il banco: genera 600 piani, conta le domande,
                                        # tocca mostro/porta/forziere/mercante/scala
```

Il secondo non è versionato (`tmp/` è ignorato da git): è lo strumento
con cui sono stati trovati i due difetti veri di questa versione — la
scala che si raggiungeva senza rispondere a niente, e i numeri dei
mostri. Gli scatti finiscono in `poc/scatti/sotterraneo*.png` e **vanno
guardati**: è il modo più rapido di accorgersi che «funziona» ma è tutto
nero.
