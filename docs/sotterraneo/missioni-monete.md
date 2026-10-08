# Le monete come regalo di una missione

Il conto del premio in monete delle missioni dei personaggi ([missioni.md](missioni.md)). Il codice: `premio.monete` in
`dati/missioni.js`, `consegna` in `motore/missioni.js`.

Decise dall'utente l'8 ottobre: *«come regalo di una missione possono anche
esserci le monete, volendo»*. Alla [calibrazione](../apprendimento/calibrazione.md)
(🪙1 = dieci secondi di esercizio, una domanda del sotterraneo vale 🪙1) un
premio aggiuntivo è un'eccezione, quindi piccolo e misurabile: **il regalo vale
le domande che la missione chiede in più**, non di più.

- Per un mostro col nome: i colpi in più, cioè le risposte giuste in più
  (`colpiPer`) rispetto a un mostro comune di quel tipo allo stesso piano,
  con la roba attesa (`dati/storia.js`), media dei quattro eroi, arrotondata.
  Il mostro della missione è più duro per costruzione (`PIU_DURO`).

| missione | colpi del mostro col nome | colpi di uno comune | in più | 🪙 |
|---|---|---|---|---|
| Dama Grigia (fantasma) | 4 · 3 · 2 · 4 | 2 · 2 · 2 · 2 | 1,25 | 1 |
| Rosicchione (ratto) | 3 · 3 · 2 · 3 | 1 · 1 · 1 · 1 | 1,75 | 2 |
| Grattanaso (goblin) | 3 · 2 · 2 · 3 | 1 · 1 · 1 · 1 | 1,5 | 2 |
| Chela (granchio) | 7 · 5 · 5 · 7 | 6 · 4 · 4 · 6 | 1,0 | 1 |
| Zannagrigia (lupo) | 11 · 8 · 8 · 11 | 9 · 7 · 7 · 9 | 1,5 | 2 |

(cavaliere · elfa · mago · nano, con la roba e il livello attesi;
`unita/sotterraneo-missioni` rifà il conto e fallisce se `premio.monete` non
torna). Coi livelli dell'eroe (8 ottobre) `PIU_DURO` è sceso da 1,6 a 1,25
volte le ossa: in fondo chiedeva venti risposte di fila. Chela è passata da
2 a 1, Grattanaso da 1 a 2, Zannagrigia da 4 a 2.

- **Chi cerca non ha monete**: un forziere è una sola domanda, già pagata, e
  il giro per arrivarci non si misura. Quindi 5 missioni su 12 danno monete,
  da 🪙1 a 🪙2: otto monete in tutto, meno di due minuti di esercizio, per chi
  le fa tutte.
- **Niente premio per una risposta sbagliata**: il regalo arriva alla
  consegna, dopo che la cosa è stata trovata o il mostro battuto, e un
  forziere sbagliato non fa niente (si riprova).
- **Le domande in più sono già pagate una per una** (🪙1 a risposta giusta,
  `PAGA.mossa`): il regalo ne raddoppia il valore. È voluto, e per questo
  resta di una o due monete.
- Le monete non toccano la roba: `consegna` le torna in `monete` e le paga
  `Gioco.vue` dalla borsa del gioco (`borsa(CHIAVE).paga`), quindi passano
  dal salvadanaio della varietà come ogni altra; quel che resta si legge nella
  scritta «Missione compiuta! 🪙 2».
