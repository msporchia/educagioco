# La cucina

Il gioco: una stanza in 3D dove si cammina e si cucina. Si tocca un posto, il cuoco ci va e
fa quello che lì è ovvio; le ordinazioni stanno in cima, si fanno in qualsiasi ordine e
scadono; ognuna finita si fa pagare col resto. `#bancarella=cucina&livello=28` porta dritto
a quel livello, `&aperte=1` apre tutti i livelli.

Il motore è `src/motore/bancarella/cucina.js`, i dati `src/data/bancarella-cucine.js`
(ingredienti, ricette, livelli, attrezzi) e `src/data/bancarella.js` (i soldi e le ordinazioni), la schermata `components/bancarella/Cucina.vue`
con `Ordini.vue`, `Ricetta.vue`, `LeCucine.vue`; la scena `src/grafica/cucina3d/`
(`indice.js`, `sala.js` stanza e banconi, `omino.js` il cuoco, `cibo.js` e `pezzi.js`).

## La stanza

Cinque celle per dieci, stretta e alta come un telefono: banconi tutto intorno, in mezzo solo
pavimento, e le figure restano grandi. **In fondo si finisce**: lavello, piatti, consegna.
**A sinistra si taglia**: i taglieri, con sotto insalata, formaggio, pesce. **A destra si
cuoce**: pentole, padelle, forni, con carne e impasto. **Davanti la dispensa** e il bidone. Una
cucina mostra solo quello che le serve: il resto è bancone libero. **Gli appoggi in più** (`ISOLE`)
si comprano e stanno in mezzo, due per due, e ci si cammina attorno: fissi rimpicciolivano
tutto.

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
| il tagliere | riprende a tagliare | posa e taglia; col piatto o con un'altra cosa prende il tagliato |
| un fuoco | prende solo il bruciato | ci mette il crudo; col piatto o con un'altra cosa prende quello che è pronto |
| il forno | prende la pizza | inforna la pizza condita |
| il lavello | lava | |
| il bidone | | butta |
| la consegna | | serve |

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
- **Il piatto pronto può crescere**: alla pasta al pomodoro si aggiunge il formaggio, e
  diventa l'altra ricetta. Per questo una ricetta può contenerne un'altra.
- **Con le mani si tiene quello che si terrebbe**: il cotto, il tagliato, il sugo e il riso
  vogliono un piatto. Il bruciato si prende a mani libere, per buttarlo.
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

## Il resto è un foglio

Finita un'ordinazione, passa in cima alla coda e si apre il foglio: i soldi che danno, lo
scontrino, le monete. **Finché il resto non è dato tutto è fermo**, fuochi e ordinazioni, in
ogni livello: la fretta sta nello spostare le cose, i conti si fanno da fermi. Il foglio non ha
la ✕: si consegna, si dà il resto e si torna a cucinare. Si paga come il suo livello, e
l'incasso va nel banco.

## I piatti da lavare

Dal sesto livello i piatti sono contati (`piatti` del livello, più quelli comprati). Un
piatto servito torna sporco nel lavello dopo sei secondi (`RITORNO`); un tocco sul lavello,
a mani libere, e il cuoco ne lava uno, poco più di un secondo (`LAVATA`), e lo rimette in
pila: un tocco, un piatto. Un piatto buttato, o quello di
una pizza bruciata, torna nel lavello: i piatti non si perdono mai.

## I livelli e gli attrezzi

Ventotto livelli (`CUCINE`), ognuno con qualcosa in più; si aprono vincendo quello prima
(`banco.cucina.fatte`, in `profile.campagne.bancarella`). Gli attrezzi di un livello si leggono
dalle sue ricette. La `portata` va dritta da 32 a 72 lungo la fila (`FILA`).

| livelli | in cucina | alla cassa |
|---|---|---|
| 1–5 | **a crudo**, con tempo da vendere: panini, insalate, sushi | la cassa dice il resto, euro tondi |
| 6 | il lavello | |
| 7–9 | la pentola, poi la padella | **il resto lo conti tu**, euro tondi |
| 10–15 | uova, carne, hamburger, ragù | prezzi al mezzo euro |
| 16–19 | il forno | prezzi ai dieci centesimi, si paga anche coi 20 € |
| 20–22 | due piatti a ordinazione | **anche il totale da chiedere lo batti tu**; prezzi di nuovo al mezzo euro |
| 23–25 | | prezzi ai dieci centesimi |
| 26–28 | le ordinazioni scadono prima | prezzi ai cinque centesimi, si paga anche coi 50 € |

La cassa sale a gradini (`SCALA_CASSA`), come nel vecchio mercato: chi fa i conti non torna mai
indietro, e quando entra un conto nuovo i prezzi tornano più facili. Il prezzo di un piatto è
quello del menù arrotondato o col suo di più in centesimi (`prezzoDi`).

Nella scelta dei livelli si comprano gli attrezzi con l'incasso, a uno a uno:

| attrezzo | prezzi |
|---|---|
| un appoggio in più, fino a quattro | 40, 60, 80, 100 € |
| un tagliere in più, fino a tre | 80, 160, 240 € |
| un piatto in più, fino a quattro | 60, 90, 120, 150 € |
| la seconda pentola | 250 € |
| la seconda padella | 300 € |
| il secondo forno | 600 € |

Un livello incassa una trentina di euro all'inizio e un centinaio alla fine: il primo tagliere
costa un paio di livelli, il forno sei o sette degli ultimi. Tutto insieme fa 2.330 €, più
dei circa 1.750 € che si incassano finendo la fila una volta: qualcosa si sceglie, o si rigioca. Si vedono
dal livello dove servono, stanno in `banco.cucina` e compaiono nella stanza su celle fisse
(`:2`, `:3`…).

## La ricetta

Toccando un piatto nella lista delle ordinazioni si apre la sua ricetta
(`Ricetta.vue`): per ogni cosa dice dove passa (`passiRicetta`). Intanto tutto sta fermo: è
un aiuto, leggerlo non deve costare.

## Le figure sono i modelli

Niente emoji per piatti e ingredienti: ordinazioni, ricette, scontrino, livelli e
attrezzi mostrano la **foto del modello 3D**, così a schermo si riconosce quello che sta
nella stanza. Le fa `npm run anteprime cucina` (`strumenti/anteprime-cucina.mjs` e
`strumenti/banco/foto-cucina.html`) in `src/data/bancarella-foto.js`, generato, e un test
dice se un modello è cambiato. `emoji` di una ricetta è solo la sua chiave.

## La scena

Camera fissa dall'alto, la stanza intera dentro; quello che avanza sullo schermo resta sopra,
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
(`profile.mercato`, stelle e giornate) non si caricano più; l'incasso resta in cassa.

## Nei test

`unita/bancarella-cucina`, `unita/bancarella-foto`, `integrazione/bancarella-cucina` (tocchi
veri). `window.__cucina3d.dove('3,0')` dice dove sta sullo schermo una cella o il pavimento.
Bersagli: `[data-cucine]`, `[data-cucina-n]`, `[data-attrezzo]`, `[data-cucina]`, `[data-tela]`,
`[data-detto]`, `[data-ordini]`, `[data-ordine]`, `[data-ordinato]`, `[data-ricetta]`, `[data-chiudi-ricetta]`,
`[data-porge]`.
