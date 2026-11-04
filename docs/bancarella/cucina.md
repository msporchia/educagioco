# La cucina (in prova)

Un prototipo: una giornata, un fornello, due piatti, disegnati in codice. Non
sta nella fila e non si salva: si apre da `#bancarella=cucina` (c'è anche il tasto
in `#admin`). Il motore è `src/motore/bancarella/cucina.js`, la schermata
`src/components/bancarella/Cucina.vue`, i disegni `src/grafica/bancarella-cucina.js`,
la giornata `CUCINA` in `src/data/bancarella.js`.

## Come si gioca

| piatto | i passi | prezzo |
|---|---|---|
| 🍝 pasta al pomodoro | pasta sul fuoco, scolala quando è pronta, sugo | 6,50 € |
| 🥪 panino al formaggio | pane, formaggio | 3,50 € |

- **La pentola** cuoce 7 secondi (`COTTURA`), poi resta buona 6 (`TIENE`), poi
  scuoce: si butta e si ricomincia. Costa solo il tempo.
- **Due piatti sul banco**: mentre la pasta bolle si prepara il panino. Sopra
  la testa di chi è in fila si vede cosa vuole, così si cucina in anticipo; un
  piatto fatto resta lì finché arriva chi lo vuole.
- **Il piatto sbagliato costa due secondi** di pazienza, come la cesta sbagliata.
- **Servito il piatto si va alla cassa di sempre**: giornata `resto`, si paga con
  10 €, prezzi al mezzo euro. Tre banchi da tre clienti.
- **Paga come una giornata del resto**: 🪙3 a cliente, e l'incasso va nel banco.

## La fretta

**Nei primi livelli alla cassa il fornello è fermo** (`ciclo`, solo in `raccolta`):
la fretta sta ai fuochi e i conti si fanno da fermi. **Verso la fine, quando il
bambino è esperto, il fornello potrà continuare a cuocere mentre si conta**:
scelta dell'utente, non ancora fatta.

## Se piace

Una città dopo Tokyo con le sue giornate (una leva per volta: piatti, fuochi,
clienti), il forno e i fuochi in più fra le cose da comprare
([banco.md](banco.md)), e la sosta, che adesso non c'è: uscendo la giornata si perde.

## Nei test

`unita/bancarella-cucina`, `integrazione/bancarella-cucina`. Bersagli:
`[data-cucina]`, `[data-pentola]` (`data-fase`), `[data-piatto]` (`data-pronto`),
`[data-cosa]`, `[data-vuole]`.
