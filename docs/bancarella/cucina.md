# La cucina

La parte avanzata della bancarella: una stanza in 3D dove si cammina e si cucina. Si
tocca un posto, il cuoco ci va e fa quello che lì è ovvio; le ordinazioni stanno in
cima, si fanno in qualsiasi ordine e scadono; ogni piatto finito si fa pagare col
resto di sempre. In prova: si apre da `#bancarella=cucina` (c'è anche il tasto in
`#admin`), `&livello=28` porta dritto a quel livello, `&aperte=1` apre tutti i livelli.

Il motore è `src/motore/bancarella/cucina.js`, i dati `src/data/bancarella-cucine.js`
(ingredienti, ricette, livelli, attrezzi), la schermata `components/bancarella/Cucina.vue`
con `Ordini.vue`, `Ricettario.vue`, `LeCucine.vue`; la scena `src/grafica/cucina3d/`
(`indice.js`, `sala.js` stanza e banconi, `omino.js` il cuoco, `cibo.js` e `pezzi.js`).

## La stanza

Sette celle per nove, banconi tutto intorno e due isole in mezzo. In fondo la consegna
coi fuochi ai lati, ai fianchi le cassette, davanti bidone, piatti, lavello, taglieri.
Una cucina mostra solo quello che le serve: il resto è bancone libero.

## Si tocca dove si vuole andare

Niente levetta né tasti: provati, erano un di più. Il tocco cade su un posto (i banconi
sono scatole, quelle alte si toccano anche in alto) o sul pavimento. Il cuoco gira
attorno ai banconi (`via`, la strada più corta di casella in casella) e arrivato fa la
mossa di `decidi`:

| tocchi | con le mani vuote | con qualcosa in mano |
|---|---|---|
| una cassetta | prende | col piatto: se è pronta, ce la mette; con un'altra cosa: le unisce |
| la pila dei piatti | prende un piatto | un piatto vuoto: lo rimette |
| un bancone libero | | posa |
| un bancone con un piatto | prende il piatto | ci deposita quello che ha in mano |
| un bancone con una cosa | prende | le unisce, e il piatto resta lì |
| il tagliere | riprende a tagliare; tagliato, prende | posa e taglia; col piatto o con un'altra cosa unisce il tagliato |
| un fuoco | prende quello che è pronto | ci mette il crudo; col piatto o con un'altra cosa unisce quello che è pronto |
| il forno | prende la pizza | inforna la pizza condita |
| il lavello | lava | |
| il bidone | | butta |
| la consegna | | serve |

Se non si può, un fumetto dice cosa manca («Prima si cuoce», «Prima si taglia»).

**I tocchi si mettono in fila** (`fila`, al massimo sei): pasta e poi pentola si toccano
di seguito, e il cuoco li fa uno dopo l'altro. Ogni posto in fila ha il suo riquadro
verde. Il pavimento butta la fila e va lì.

Il tocco vale al `pointerdown`. Il foglio del resto può aprirsi sotto il dito: il click
che resta si ingoia, se no preme una moneta ([../core/il-dito.md](../core/il-dito.md)).

## Le regole

- **Le mani tengono una cosa**: un ingrediente o un piatto. Ogni bancone ne tiene una.
- **Il piatto si riempie in qualunque ordine** e si dispone da solo. Va bene sia
  l'ingrediente portato al piatto, sia il piatto portato all'ingrediente.
- **Due cose pronte della stessa ricetta si uniscono da sole**: con l'impasto in mano si
  tocca il sugo, e il piatto ce lo mette il cuoco (`unisci`).
- **Il piatto pronto può crescere**: alla pasta al pomodoro si aggiunge il formaggio, e
  diventa l'altra ricetta. Per questo una ricetta può contenerne un'altra.
- **Crudo non va sul piatto**: pasta, carne e uovo passano dal fuoco; insalata, formaggio
  e pesce dal tagliere: un tocco e il cuoco taglia da sé fino alla fine, un secondo e
  mezzo (`TAGLI`, `COLPO`). Intanto la fila aspetta; il pavimento lo porta via, e un tocco
  lo fa riprendere. Il pane è già tagliato: nella cassetta c'è il panino aperto, una
  pagnotta intera chiederebbe il tagliere.
- **La pizza entra in forno col piatto** ed esce pronta, a mani libere.
- **A bruciare ci si deve impegnare**: una cosa resta buona 45 secondi dopo la cottura
  (`tiene`). Il bruciato si prende a mani libere e va nel bidone.

## Le ordinazioni

Niente persone: in cima c'è la lista (`Ordini.vue`), una scheda per ordinazione con la
foto dei piatti e la barra del tempo. La lista è la coda di sempre: tre per tappa, tre
tappe. Scadono una dopo l'altra (`STACCO_ORDINI`), tutte alla stessa velocità, e la tenda
del banco dà gli stessi secondi in più. Il piatto va alla prima ordinazione della lista che
lo aspetta; quello che nessuno ha ordinato resta in mano.

Un'ordinazione scaduta costa un cuore e sparisce, ma **non conta come conto sbagliato**:
il ripasso del resto misura il resto, non la cucina.

## Il resto è un foglio

Finita un'ordinazione, passa in cima alla coda e si apre il foglio: i soldi che danno, lo
scontrino, le monete. La ✕ lo mette da parte e «dai il resto» lo riapre, intanto si
cucina. **Col foglio aperto tutto è fermo**, fuochi e ordinazioni: i conti si fanno da
fermi. **Negli ultimi livelli no** (`fuocoAcceso`), quando il bambino è esperto: scelta
dell'utente. Si paga come la sua giornata, e l'incasso va nel banco.

## I piatti da lavare

Dal sesto livello i piatti sono contati (`piatti` del livello, più quelli comprati). Un
piatto servito torna sporco nel lavello dopo sei secondi (`RITORNO`); un tocco sul lavello,
a mani libere, e il cuoco lava finché ce n'è, poco più di un secondo a piatto (`LAVATA`), e
li rimette in pila. Anche unire due cose consuma un piatto. Un piatto buttato, o quello di
una pizza bruciata, torna nel lavello: i piatti non si perdono mai.

## I livelli e gli attrezzi

Ventotto livelli (`CUCINE`), ognuno con qualcosa in più; si aprono vincendo quello prima
(`banco.cucina.fatte`). Gli attrezzi di un livello si leggono dalle sue ricette.

| livelli | cosa cambia |
|---|---|
| 1–5 | **a crudo**, con tempo da vendere: si impara a muoversi senza fretta. Panini, insalate, sushi |
| 6 | il lavello |
| 7–8 | la pentola |
| 9–15 | la padella: uova, carne, hamburger, ragù |
| 16–19 | il forno |
| 20–24 | due piatti a ordinazione: il totale si batte, si paga coi 20 € |
| 25–28 | i fuochi non si fermano mentre si conta |

Nella scelta dei livelli si comprano gli attrezzi con l'incasso, lo stesso del banco
([banco.md](banco.md)): il secondo tagliere 25 €, la seconda pentola 30 €, la seconda padella
40 €, il secondo forno 70 €, un piatto in più 15 € (fino a quattro). Si vedono dal livello
dove servono, stanno in `banco.cucina` e compaiono nella stanza su celle fisse (`:2`).

## Il ricettario

Il libretto in alto a destra. Si apre sul primo piatto ordinato; in cima ci sono tutti i
piatti della cucina, si sfogliano toccandoli, e un pallino segna quelli ordinati. Per ogni
cosa dice dove passa (`passiRicetta`). Copre la stanza, e intanto tutto sta fermo: è un
aiuto, leggerlo non deve costare.

## Le figure sono i modelli

Niente emoji per piatti e ingredienti: ordinazioni, ricettario, scontrino, livelli e
attrezzi mostrano la **foto del modello 3D**, così a schermo si riconosce quello che sta
nella stanza. Le fa `npm run anteprime cucina` (`strumenti/anteprime-cucina.mjs` e
`strumenti/banco/foto-cucina.html`) in `src/data/bancarella-foto.js`, generato, e un test
dice se un modello è cambiato. `emoji` di una ricetta è solo la sua chiave.

## La scena

Camera fissa dall'alto, la stanza intera dentro; sullo schermo lungo scende in fondo e
sopra resta il muro. Il cibo è nella creta ([../fattoria3d/creta.md](../fattoria3d/creta.md)),
ogni modello si fa una volta e poi si clona; le maglie sono larghe (`MAGLIA`), prima di
aprire si fa solo la dispensa e il cibo arriva dopo (`prepara`). In mano la roba è nuda:
la tavola dell'impasto o la carta della carne sembrerebbero un piatto. Il cuoco ha
un'ombra finta e la testa inclinata verso la telecamera; le ombre vere si rifanno solo se
cambia cosa c'è sui banchi. I banconi sono tre geometrie unite. Senza WebGL lo dice e offre
«riprova».

## Quello che manca

La cucina non sta ancora nella fila delle giornate, e uscendo a metà il livello si perde:
la sosta non c'è ([../core/ripresa.md](../core/ripresa.md)).

## Nei test

`unita/bancarella-cucina`, `unita/bancarella-foto`, `integrazione/bancarella-cucina` (tocchi
veri). `window.__cucina3d.dove('3,0')` dice dove sta sullo schermo una cella o il pavimento.
Bersagli: `[data-cucine]`, `[data-cucina-n]`, `[data-attrezzo]`, `[data-cucina]`, `[data-tela]`,
`[data-detto]`, `[data-ordini]`, `[data-ordine]`, `[data-ordinato]`, `[data-apri-ricettario]`,
`[data-ricettario]`, `[data-ricetta]`, `[data-chiesto]`, `[data-chiudi-ricettario]`,
`[data-azione="al-resto"]`, `[data-porge]`.
