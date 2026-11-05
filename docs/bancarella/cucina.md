# Le cucine (in prova)

Un prototipo, disegnato in codice: cinque cucine, ognuna con qualcosa in più. Non
stanno nella fila e non si salvano: si aprono da `#bancarella=cucina`, che mostra la
scelta (c'è anche il tasto in `#admin`; `&livello=5` porta dritto alla quinta). Il
motore è `src/motore/bancarella/cucina.js`, la schermata
`src/components/bancarella/Cucina.vue`, i disegni `src/grafica/bancarella-cucina.js`,
le cucine `CUCINE` in `src/data/bancarella.js`.

## Le cucine

| # | nome | cosa aggiunge | stazioni | piatti |
|---|---|---|---|---|
| 1 | La trattoria | la pentola | pentola | 🍝 🥪 |
| 2 | L'orto in tavola | il tagliere: tre tocchi per tagliare | + tagliere | + 🥗 |
| 3 | La piastra | la padella: due fuochi da guardare, tre piatti sul banco | + padella | 🍝 🥗 🍔 🍳 |
| 4 | La pizzeria | il forno: la pizza si condisce e va infornata | + forno | + 🍕 |
| 5 | Il gran servizio | due piatti a cliente, il totale si batte, i fuochi non si fermano | tutte | tutti |

## Come si gioca

| piatto | i passi, in ordine | prezzo |
|---|---|---|
| 🍝 pasta al pomodoro | pasta cotta, sugo | 6,50 € |
| 🥪 panino al formaggio | pane, formaggio | 3,50 € |
| 🥗 insalata | insalata tagliata, formaggio | 4,00 € |
| 🍔 hamburger | pane, carne cotta, insalata tagliata | 7,50 € |
| 🍳 uovo col pane | uovo cotto, pane | 4,50 € |
| 🍕 pizza | impasto, sugo, formaggio, forno | 8,00 € |

- **Un ingrediente va da solo dove serve** (`posa`): sul piatto che lo aspetta, se
  no su uno libero se comincia una ricetta. Se non ha posto non succede niente.
- **Sul fuoco** (`INGREDIENTI`, `cuoce` e `tiene`): pasta 7 + 6 secondi, carne 5 + 5,
  uovo 3 + 4, pizza 8 + 7. Passato il tempo brucia: si butta e si ricomincia, e
  costa solo il tempo. La carne senza un pane che la aspetta resta sul fuoco.
- **La fila si vede**: sopra chi aspetta c'è cosa vuole, così si cucina in anticipo.
  Un piatto fatto resta lì finché arriva chi lo vuole.
- **Il piatto sbagliato costa due secondi** di pazienza, come la cesta sbagliata.
- **Finiti i suoi piatti il cliente va alla cassa di sempre**: giornata `resto`,
  prezzi al mezzo euro, tre banchi da tre clienti; nella quinta `tutto`, si paga con 20 €.
- **Paga come la sua giornata**, e l'incasso va nel banco.

## Il resto è un foglio

La cassa non prende lo schermo: è un foglio sotto le stazioni, che restano tutte in
vista (`.cassa.foglio`; l'altezza delle stazioni è ferma per questo). La ✕ lo mette
da parte e «dai il resto» lo riapre: il cliente aspetta, intanto si cucina. Le
stazioni si toccano anche a foglio aperto.

## La fretta

**Nelle prime quattro il fuoco è fermo col foglio aperto**: i conti si fanno da
fermi. **Nell'ultima non si ferma** (`fuocoAcceso`), quando il bambino è esperto:
scelta dell'utente. A foglio chiuso il fuoco va sempre.

## Se piace

Una città dopo Tokyo con queste giornate, forno e fuochi fra le cose da comprare
([banco.md](banco.md)), e la sosta, che adesso non c'è: uscendo la giornata si perde.

## Nei test

`unita/bancarella-cucina`, `integrazione/bancarella-cucina`. Bersagli: `[data-cucine]`,
`[data-cucina-n]`, `[data-cucina]`, `[data-stazione]` (`data-fase`), `[data-piatto]`
(`data-pronto`), `[data-cosa]`, `[data-vuole]`, `[data-azione="al-resto"]`.
