# La cucina

Il gioco: una stanza in 3D dove si cammina e si cucina. Si tocca un posto, il cuoco ci va e
fa quello che lì è ovvio; le ordinazioni stanno in cima, si fanno in qualsiasi ordine e
scadono; ognuna finita si fa pagare col resto. `#bancarella=cucina&livello=28` porta dritto
a quel livello, `&aperte=1` apre tutti i livelli.

Il motore è `src/motore/bancarella/cucina.js`, i dati `src/data/bancarella-cucine.js`
(ingredienti, ricette, livelli) e `src/data/bancarella.js` (i soldi e le ordinazioni), la schermata `components/bancarella/Cucina.vue`
con `Ordini.vue`, `Ricetta.vue`, `LeCucine.vue`; la scena `src/grafica/cucina3d/`
(`indice.js`, `sala.js` stanza e banconi, `omino.js` il cuoco, `cibo.js` e `pezzi.js`).

## La stanza

**La stanza è grande quanto serve** (`pianta`): all'inizio quattro celle per cinque, poi si
allarga con quello che entra, fino a cinque per dieci, e la telecamera la inquadra tutta: chi ha
poche cose non corre, e le figure sono più grandi. Il lavello e gli appoggi la portano a cinque
di larghezza; in fondità si tengono almeno tre banconi liberi, finché ci stanno.

A zone: **in fondo si finisce** (lavello, piatti, consegna), **a sinistra si taglia** (i taglieri,
poi pomodoro, insalata, formaggio, pesce), **a destra si cuoce** (pentole, padelle, forni, poi
pasta, carne, uova), **davanti la dispensa** e il bidone. Quello che la cucina non usa non c'è.
**Negli angoli niente attrezzi**: ci si arriva solo di sbieco. Ci finisce una cassetta solo se non
ci sta altrove, nelle ultime cucine piene.
**Gli appoggi** stanno nella colonna di mezzo e ci si cammina attorno. Ci sono solo dai due piatti
a ordinazione in su: in tutti i livelli rimpicciolivano tutto.

## Si tocca dove si vuole andare

Niente levetta né tasti: provati, erano un di più. Il tocco cade su un posto (i banconi
sono scatole, quelle alte si toccano anche in alto) o sul pavimento. Il cuoco gira
attorno ai banconi (`via`, la strada più corta di casella in casella) e arrivato fa la
mossa di `decidi`:

| tocchi | con le mani vuote | con qualcosa in mano |
|---|---|---|
| una cassetta | prende (il sugo e il riso no: vogliono il piatto) | col piatto: se è pronta, ce la mette; con un'altra cosa: le unisce |
| la pila dei piatti | prende un piatto | quello che ha in mano finisce su un piatto; un piatto vuoto: lo rimette |
| un bancone libero | | posa |
| un bancone con un piatto | prende il piatto | ci deposita quello che ha in mano |
| un bancone con una cosa | prende | le unisce, e il piatto resta lì |
| il tagliere | riprende a tagliare; il formaggio tagliato si prende | posa e taglia; col piatto o con un'altra cosa prende il tagliato |
| un fuoco | prende solo il bruciato | ci mette il crudo; col piatto o con un'altra cosa prende quello che è pronto |
| il forno | prende la pizza | inforna la pizza condita |
| il lavello | lava | |
| il bidone | | butta |
| la consegna | | serve |

**Il bidone è un cestino nero** col coperchio aperto all'indietro e il cestino disegnato in bianco sotto il coperchio e sul davanti:
il secchio grigio di lamiera non si capiva cos'era. Sta nell'ultima fila, che il bordo dello schermo taglia: per questo il disegno è
anche sul coperchio.

Se non si può, un fumetto dice cosa manca («Prima si cuoce», «Prima si taglia»).

**L'ultimo tocco comanda**: un riquadro verde solo, sul posto dove sta andando. Mentre
taglia o lava finisce, e poi ci va; il pavimento invece lo porta via subito.

Il tocco vale al `pointerdown`. Il foglio del resto può aprirsi sotto il dito: il click
che resta si ingoia, se no preme una moneta ([../core/il-dito.md](../core/il-dito.md)).

## Le regole

- **Le mani tengono una cosa**: un ingrediente o un piatto. Ogni bancone ne tiene una.
- **Il piatto si riempie in qualunque ordine** e si dispone da solo. Va bene sia
  l'ingrediente portato al piatto, sia il piatto portato all'ingrediente.
- **Due cose pronte della stessa ricetta si uniscono da sole**: con l'impasto in mano si
  tocca il sugo (`unisci`). **Il piatto non compare da solo**: restano in mano senza
  (`nudo`), e per servire o infornare si passa dalla pila, o da un piatto posato.
- **Due piatti si uniscono**: toccando un piatto posato con un altro piatto in mano, quello in mano si vuota sull'altro e va a
  lavare (`travaso`). Così ogni ricetta si mette insieme in qualunque ordine, anche partita da due piatti (un test le prova tutte);
  prima diceva «Le mani sono piene». Un piatto vuoto in mano non si vuota.
- **Il piatto pronto può crescere**: alla pasta al pomodoro si aggiunge il formaggio, e
  diventa l'altra ricetta. Per questo una ricetta può contenerne un'altra.
- **Con le mani si tiene quello che si terrebbe**: il cotto, il tagliato, il sugo e il riso
  vogliono un piatto, tranne il formaggio, che è a fette. Il bruciato si prende a mani libere,
  per buttarlo.
- **Crudo non va sul piatto**: pasta, carne e uovo passano dal fuoco; insalata, formaggio
  e pesce dal tagliere: un tocco e il cuoco taglia da sé fino alla fine, un secondo e
  mezzo (`TAGLI`, `COLPO`). Il pavimento lo porta via, e un tocco lo fa riprendere. Il pane è già a fette, tipo toast: una pagnotta intera chiederebbe il
  tagliere, e un panino tondo sembrava una pizzetta. Il pane tondo resta all'hamburger.
- **La pizza entra in forno col piatto** ed esce pronta, a mani libere.
- **A bruciare ci si deve impegnare**: una cosa resta buona 45 secondi dopo la cottura
  (`tiene`). Il bruciato si prende a mani libere e va nel bidone.

## Le ordinazioni

Niente persone: in cima c'è la lista (`Ordini.vue`), una scheda per ordinazione con la
foto dei piatti e la barra del tempo. La lista è la coda di sempre: tre per tappa, tre
tappe. Scadono una dopo l'altra (`STACCO_ORDINI`), tutte alla stessa velocità, e la tenda
del banco dà gli stessi secondi in più. Il piatto va alla prima ordinazione della lista che
lo aspetta, e senza piatto non si serve. Quello che non va resta in mano, e il fumetto dice cosa
manca rispetto all'ordinazione più simile («Manca l'alga», «Manca la pasta, da cuocere», `cheManca`);
«non l'ha ordinato nessuno» resta per quando non somiglia a niente.

Un'ordinazione scaduta costa un cuore e sparisce, ma **non conta come conto sbagliato**:
il ripasso del resto misura il resto, non la cucina.

**Il tempo totale c'è solo nell'ultimo livello**, Cinque minuti: l'orologio sta in cima al posto
dei cuori (`hud.resta`), un'ordinazione scaduta sparisce e basta, e a zero la partita finisce
col record. Così dura sempre cinque minuti: coi cuori chi sbaglia presto avrebbe giocato meno.
Negli altri livelli il tempo è solo quello delle ordinazioni. Nei primi sei (`CALMA`) è lo stesso,
e nei primi cinque tre ordinazioni della ricetta più lunga, fatte di fila da chi pensa quattro
secondi a ogni tocco, stanno dentro l'ultimo giro. Dal settimo al diciannovesimo scende un po' a
ogni livello (`scende`), da 170–150 secondi a 78–62; coi due piatti risale perché il lavoro
raddoppia. Il metro è il margine, il tempo dell'ultimo giro diviso per la ricetta più lunga fatta
con calma: da un livello all'altro non cala mai più del 40 % (`quantoCi`, in un test).

## Il resto è un foglio

Finita un'ordinazione, passa in cima alla coda e si apre il foglio: i soldi che danno, lo
scontrino, le monete. **Finché il resto non è dato tutto è fermo**, fuochi e ordinazioni, in
ogni livello, e con loro l'orologio dell'ultimo: la fretta sta nello spostare le cose, i conti si fanno da fermi. Il foglio non ha
la ✕: si consegna, si dà il resto e si torna a cucinare. Si paga come il suo livello.

## I piatti da lavare

Dal sesto livello i piatti sono contati (`piatti` del livello). Un
piatto servito torna sporco nel lavello dopo sei secondi (`RITORNO`); un tocco sul lavello,
a mani libere, e il cuoco ne lava uno, poco più di un secondo (`LAVATA`), e lo rimette in
pila: un tocco, un piatto. Un piatto buttato, o quello di
una pizza bruciata, torna nel lavello: i piatti non si perdono mai.

## I livelli

Ventotto livelli (`CUCINE`), ognuno con qualcosa in più, e in fondo **Cinque minuti**; si aprono vincendo quello prima
(`banco.cucina.fatte`, in `profile.campagne.bancarella`), con i lucchetti di tutti (`tappaApertaQui`: «tutte le tappe aperte» e l'età). Gli attrezzi di un livello si leggono
dalle sue ricette, e quanti sono lo dice il livello: **non si compra niente**, provato e tolto
perché confondeva. La `portata` va dritta da 32 a 72 lungo la fila (`FILA`).

| livelli | in cucina | alla cassa |
|---|---|---|
| 1–5 | **a crudo**, con tempo da vendere: panini, insalate, sushi | la cassa dice il resto, euro tondi |
| 6 | il lavello | |
| 7–12 | la pentola, la padella, uova, carne, hamburger | **il resto lo conti tu**, euro tondi |
| 13–15 | il ragù, il secondo | prezzi al mezzo euro |
| 16–19 | il forno | prezzi ai dieci centesimi, banconote fino a 20 € |
| 20–22 | sempre due piatti a ordinazione: tutti gli attrezzi doppi (`copie`) e due appoggi (`appoggi`) | **anche il totale da chiedere lo batti tu**, che è una somma; di nuovo euro tondi |
| 23–25 | | prezzi al mezzo euro |
| 26–28 | le ordinazioni scadono prima | prezzi ai dieci centesimi, banconote fino a 50 € |
| ⏱️ | Cinque minuti: tutte le ricette, giri finché dura l'orologio (`durata`), il tempo delle ordinazioni si stringe fino a un tetto | come gli ultimi; conta il record delle ordinazioni servite (`senzaFine`) |

La cassa sale a gradini (`SCALA_CASSA`), come nel vecchio mercato: chi fa i conti non torna mai
indietro, e quando entra un conto nuovo si torna agli euro tondi. I cinque centesimi non ci sono:
sommare 6,35 € e 4,25 € è fatica senza niente di vero. **Ogni cucina ha il suo listino** (`prezzoDi`,
`listino`): dentro un livello un piatto costa sempre uguale, così i conti si prevedono, ma da un
livello all'altro cambia, se no la pasta era 6,70 € dappertutto. Sugli euro e sui mezzi il menù si
sposta tutto insieme (chi ha più roba resta più caro), coi centesimi ogni piatto ha il suo. Due
piatti della stessa cucina non costano mai uguale (`listinoDi`): arrotondando, 3,50 € e 4 € facevano
4 € tutti e due, e un livello aveva una cifra sola.

Si paga come farebbe una persona (`comeSiPaga`): la banconota più piccola che basta, ogni tanto
quella dopo, mai cinquanta euro per un panino; oppure due banconote, 10 € + 5 € per 12 €, e il resto
torna in moneta; oppure, se il conto ha i centesimi, l'euro tondo sopra il totale, 5 € + 2 € + 2 €
per 8,50 €. **Ogni pezzo deve servire** (`serveTutto`): il resto è sempre meno del pezzo più piccolo
che ti danno. Si può non avere i soldi contati, ma nessuno dà il totale giusto più una moneta per
riaverla indietro (10 + 2 + 1 per 12 €).

I conti non devono essere difficili: devono sembrare veri. `node strumenti/cassa-cucina.mjs` mette in
fila listini, totali e modi di pagare di ogni livello. Nel cassetto i soldi sono a pile: le monete una sull'altra, le banconote a
mazzetta.

Fino al livello 19 c'è un attrezzo per tipo: un'ordinazione è un piatto, e il secondo allargherebbe
la stanza per niente. Da 20 un'ordinazione può volere due volte la stessa cosa, e il doppio (`:2`)
sta sulla sua cella fissa. I piatti sono quattro fino al 19 e cinque dopo, tranne «Meno piatti».
L'incasso non si spende e non si tiene: si vede a fine livello, e va nei conti del profilo (`totals.incasso`).

## La ricetta

Toccando un piatto nella lista delle ordinazioni si apre la sua ricetta
(`Ricetta.vue`): per ogni cosa dice dove passa (`passiRicetta`). Intanto tutto sta fermo: è
un aiuto, leggerlo non deve costare.

## Le figure sono i modelli

Niente emoji per piatti e ingredienti: ordinazioni, ricette, scontrino e livelli
mostrano la **foto del modello 3D**, così a schermo si riconosce quello che sta
nella stanza. Le fa `npm run anteprime cucina` (`strumenti/anteprime-cucina.mjs` e
`strumenti/banco/foto-cucina.html`) in `src/data/bancarella-foto.js`, generato, e un test
dice se un modello è cambiato. `emoji` di una ricetta è solo la sua chiave.

## Il sushi a stadi

Riso, pesce e alga si riconoscono a ogni passo senza leggere (`impiatta` in `cibo.js`): il riso da solo è un mucchio, col pesce sono
i **nigiri**, con l'alga gli **onigiri** a triangolo (appoggiati all'indietro: in piedi, dall'alto se ne vedeva lo spigolo), con
tutti e tre i **maki** arrotolati. Il pesce con l'alga è il pesce sul foglio d'alga, l'alga da sola il foglio. Prima il riso da solo
sembrava già sushi, e l'alga da sola sul piatto rompeva la cucina (non aveva un modello).

## La scena

Camera fissa dall'alto, la stanza intera dentro, ma diversa a ogni cucina; quello che avanza sullo schermo resta sopra,
col muro. Il cibo è nella creta ([../fattoria3d/creta.md](../fattoria3d/creta.md)),
ogni modello si fa una volta e poi si clona; le maglie sono larghe (`MAGLIA`), prima di
aprire si fa solo la dispensa e il cibo arriva dopo (`prepara`). In mano la roba è nuda:
la tavola dell'impasto o la carta della carne sembrerebbero un piatto. Il cuoco ha
un'ombra finta e la testa inclinata verso la telecamera; le ombre vere si rifanno solo se
cambia cosa c'è sui banchi. I banconi sono tre geometrie unite. Senza WebGL lo dice e offre
«riprova».

## Lasciare a metà

Uscire non butta il livello: `motore/bancarella/sosta.js` scrive tutto, stanza compresa, e la
carta in cima ai livelli lo offre ([../core/ripresa.md](../core/ripresa.md)). Le soste del
mercato di prima non si leggono, e al primo avvio spariscono. I dati di quel mercato
(`profile.mercato`, stelle e giornate) non si caricano più.

## Nei test

`unita/bancarella-cucina`, `unita/bancarella-foto`, `integrazione/bancarella-cucina` (tocchi
veri). `window.__cucina3d.dove('1,3')` dice dove sta sullo schermo una cella o il pavimento: le celle cambiano con la cucina, si cercano in `celle`.
Bersagli: `[data-cucine]`, `[data-cucina-n]`, `[data-cucina]`, `[data-tela]`,
`[data-detto]`, `[data-resta]`, `[data-ordini]`, `[data-ordine]`, `[data-ordinato]`, `[data-ricetta]`, `[data-chiudi-ricetta]`,
`[data-porge]`, `[data-senza3d]` (la cucina che non si disegna).
