# Le cucine (in prova)

Un prototipo: cinque cucine in 3D, ognuna con qualcosa in più. Non
stanno nella fila e non si salvano: si aprono da `#bancarella=cucina`, che mostra la
scelta (c'è anche il tasto in `#admin`; `&livello=5` porta dritto alla quinta). Il
motore è `src/motore/bancarella/cucina.js`, la schermata
`src/components/bancarella/Cucina.vue`, la scena `src/grafica/cucina3d/`,
le cucine `CUCINE` in `src/data/bancarella.js`.

## Le cucine

| # | nome | cosa aggiunge | stazioni | piatti |
|---|---|---|---|---|
| 1 | La trattoria | la pentola | pentola | 🍝 🥪 |
| 2 | L'orto in tavola | il tagliere: tre tocchi per tagliare | + tagliere | + 🥗 |
| 3 | La piastra | la padella: due fuochi da guardare, tre piatti sul banco | + padella | 🍝 🥗 🍔 🍳 |
| 4 | La pizzeria | il forno: la pizza si condisce e va infornata | + forno | + 🍕 |
| 5 | Il gran servizio | due piatti a cliente, il totale si batte, i fuochi non si fermano | tutte | tutti |

## La scena

Un bancone in 3D a camera fissa (three.js, solo qui e solo a richiesta: la bancarella
di sempre non lo scarica), come il banco delle pozioni. I fuochi in fondo, i piatti e
il bidone sulla lastra di marmo, la dispensa davanti. Senza WebGL lo dice e offre
«riprova». Il foglio del resto è HTML, sopra la tela.

- **Il cibo e la dispensa** (`cucina3d/cibo.js`) sono nella creta
  ([../fattoria3d/creta.md](../fattoria3d/creta.md)), gli spaghetti a tubi veri. Il
  piatto si compone come si è cucinato (`impiatta`): il panino si chiude da solo col
  coperchio al sesamo quando è finito.
- **Fuochi, forno, tagliere, piatti** (`cucina3d/pezzi.js`) sono a giro e a estrusione,
  con le trame disegnate in codice: il forno è a legna, coi mattoni.
- **Il muro è sfondo**: niente appeso che sembri una cosa da prendere.
- **Il peso**: ogni modello si fa una volta e poi si clona. Le maglie sono larghe
  (`MAGLIA`): più fini, la quinta cucina chiedeva cinque secondi di creta e 28.000
  triangoli a pezzo. Ora un paio di secondi su un computer, un fotogramma ~130.000
  triangoli e ~200 chiamate; prima di aprire si fa solo la dispensa, il cibo arriva
  dopo (`prepara`). Le ombre vere si rifanno solo se qualcosa si muove.

## Si lavora col dito

Niente tasti: tutto si trascina, e un tocco fermo dice solo cosa fare.

| gesto | cosa fa |
|---|---|
| dalla dispensa a una stazione o a un piatto | ci mette l'ingrediente, se è il suo posto |
| la pentola o la padella pronte su un piatto | si rovesciano sul piatto |
| il coltello avanti e indietro sul tagliere | tre passate tagliano l'insalata |
| l'insalata tagliata su un piatto | la posa |
| il piatto con la pizza cruda sul forno | la inforna; poi la pizza si tira fuori su un piatto vuoto |
| il piatto finito verso il cliente, sopra la tela | lo serve |
| quello che è bruciato, o un piatto, sul bidone | lo butta |

Il bersaglio si cerca sullo schermo, con un po' di largo, come nelle pozioni. Ogni
gesto è una mossa di `motore/bancarella/cucina.js` (`metti`, `svuota`, `taglia`,
`inforna`, `butta`, `buttaPiatto`, `servi`): la tela chiede e la vista risponde se è
riuscita; se no il pezzo torna al suo posto e un fumetto dice «Qui non va».

## Le regole

| piatto | i passi, in ordine | prezzo |
|---|---|---|
| 🍝 pasta al pomodoro | pasta cotta, sugo | 6,50 € |
| 🥪 panino al formaggio | pane, formaggio | 3,50 € |
| 🥗 insalata | insalata tagliata, formaggio | 4,00 € |
| 🍔 hamburger | pane, carne cotta, insalata tagliata | 7,50 € |
| 🍳 uovo col pane | uovo cotto, pane | 4,50 € |
| 🍕 pizza | impasto, sugo, formaggio, forno | 8,00 € |

- **Sul fuoco** (`INGREDIENTI`, `cuoce` e `tiene`): pasta 7 + 6 secondi, carne 5 + 5,
  uovo 3 + 4, pizza 8 + 7. Passato il tempo brucia e fuma: va nel bidone, e costa solo
  il tempo. La carne senza un pane che la aspetta resta sul fuoco.
- **La fila si vede**: sopra chi aspetta c'è cosa vuole, così si cucina in anticipo.
  Un piatto fatto resta lì finché arriva chi lo vuole.
- **Il piatto sbagliato costa due secondi** di pazienza, come la cesta sbagliata.
- **Finiti i suoi piatti il cliente va alla cassa di sempre**: giornata `resto`,
  prezzi al mezzo euro, tre banchi da tre clienti; nella quinta `tutto`, si paga con 20 €.
- **Paga come la sua giornata**, e l'incasso va nel banco.

## Il resto è un foglio

La cassa non prende lo schermo: è un foglio sotto le stazioni, che restano in vista.
La ✕ lo mette da parte e «dai il resto» lo riapre: il cliente aspetta, intanto si
cucina.

## La fretta

**Nelle prime quattro il fuoco è fermo col foglio aperto**: i conti si fanno da
fermi. **Nell'ultima non si ferma** (`fuocoAcceso`), quando il bambino è esperto:
scelta dell'utente. A foglio chiuso il fuoco va sempre.

## Se piace

Una città dopo Tokyo con queste giornate, forno e fuochi fra le cose da comprare
([banco.md](banco.md)), e la sosta, che adesso non c'è: uscendo la giornata si perde.

## Nei test

`unita/bancarella-cucina`, `integrazione/bancarella-cucina` (trascina davvero).
`window.__cucina3d.dove('pentola'|'cosa:pasta'|'piatto:0'|'coltello'|'bidone'|'cliente')`
dice dove sta sullo schermo. Bersagli: `[data-cucine]`, `[data-cucina-n]`, `[data-cucina]`,
`[data-tela]`, `[data-detto]`, `[data-cliente]`, `[data-vuole]`, `[data-azione="al-resto"]`.
