# Due anelli e una collana

I gioielli addosso: i tre posti, dove va un gioiello, che cosa si sceglie, i salvataggi di prima, cosa ha cambiato per la forza e le gemme. La roba in
generale: [roba.md](roba.md). Il codice: `dati/cose.js` (`CASELLE`, `CASELLE_DEL_TIPO`), `motore/corredo.js` (`postoDelGioiello`, `seLoMetto`,
`rileggiRoba`), `viste/Addosso.vue`, `viste/Zaino.vue`, `viste/Confronto.vue`.

Regola dell'utente (14 ottobre 2026): *«aggiungerei all'eroe la possibilità di avere due anelli e una collana, giusto per dargli un po' di varietà e la
possibilità di fare un po' di strategia»*. Prima c'era un posto solo, `dito`, per anelli e amuleti insieme.

- **`dove` di un pezzo è il suo tipo di posto, la casella è un'altra cosa.** Gli anelli (`anello-ambra`, `anello-verde`, e le loro versioni con livello,
  rarità o nome) sono `dove: 'dito'`; gli amuleti, il medaglione e il teschio del cercatore (e i loro composti) sono `dove: 'collo'`. Le caselle addosso
  sono sei (`CASELLE` in `dati/cose.js`): `mano`, `mancina`, `corpo`, `collo`, `dito`, `dito2`; un tipo sa quali caselle accetta (`CASELLE_DEL_TIPO`: `dito`
  → `dito` e `dito2`). Un'abilità nata su `dito` nasce anche su `collo` (`dati/pezzi.js`).
- **Due anelli uguali si portano insieme e le abilità si sommano.** Niente tetti nuovi: la schivata ha già il suo (`SCHIVATA_MASSIMA`, 60); le gemme di
  due anelli verdi e del teschio sono ×3 su ogni gemma raccolta (prima il tetto era ×2), e la luce di due anelli d'ambra 5 invece di 2,5.
  Dove la somma pesa, quanto: [la taratura in fondo](#cosa-ha-cambiato).
- **Dove va un gioiello** (`postoDelGioiello`): sul primo posto libero del suo tipo; con tutti pieni, su quello dove il pezzo vecchio rende meno (a pari,
  il primo dito). Un gioiello si mette da sé solo se c'è un posto libero (`vaAddosso`); altrimenti va in tasca e si decide dallo zaino.
- **Con i due anelli pieni si sceglie quale togliere** (la cosa più semplice per un bambino: il gioco propone, un tasto ribalta). Il confronto dice a sinistra
  l'anello che sostituirebbe, quello che rende meno; sotto «Addosso» c'è il tasto **🔄 l'altro anello**, che mostra il confronto sull'altro dito e fa
  cambiare il verde della casella accesa. «Indossa» mette dove si sta guardando; quello che c'era torna in tasca (`seLoMetto().altro`,
  `indossaDallaTasca(i, dove)`, `usa(i, dove)`). Un amuleto non ha scelta: ha un posto solo.
- **I salvataggi di prima** hanno un solo `dito`. Rileggendoli (`rileggiRoba`) un amuleto, un medaglione o un teschio al dito vanno al collo, un anello resta
  dov'è; se il loro posto è occupato tornano in tasca. Niente si perde, la `v` della roba resta 1 e un salvataggio senza `collo` e `dito2` si legge com'è
  (`unita/sotterraneo-gioielli`).
- **I mercanti**: il rigattiere ha una linguetta «Gioielli» sola, con anelli e collane (`dove: ['dito', 'collo']`); le regole di sempre (salti, sogni, due da
  mettersi subito, livello) valgono sui tre posti ([bottega.md](bottega.md)). Il bottino pesca anelli e collane dalla stessa lista (`A_SORTE`), quindi si
  trovano come prima.
- **La roba attesa della storia** ha la collana di sempre (la quarta voce di ogni riga di `PASSI` è `collo`), e nelle ultime due righe l'anello verde
  (`dito`). L'ambra non c'è: la luce in più cambiava il racconto di qualche discesa e l'abisso, e un anello d'ambra messo in storia non vale quel disturbo.
  Il giocatore finto mette gli anelli e la collana dove c'è posto libero (`equipaggia`, `allaBottega`) e non li scambia mai.
- **Nei test**: `unita/sotterraneo-gioielli` (il catalogo, il salvataggio di prima, la somma, dove va un gioiello e quale anello si toglie, il banco),
  `integrazione/sotterraneo-gioielli` (col dito: le sei caselle a 390 px, il tasto «🔄 l'altro anello», il rigattiere); `[data-casella="collo|dito|dito2"]`.
- **Cosa non c'è**: nuovi anelli. Il catalogo ne ha due (luce, gemme), e le versioni magiche e rare danno gli altri effetti; i dipinti sono pochi
  ([figure.md](figure.md)). Un terzo anello base (difesa, schivata) chiederebbe un disegno.

## Cosa ha cambiato

`npm run taratura` (30 storie per eroe), prima → dopo, il curioso (a ogni discesa dalla scalinata alla miniera) e il bravo. Non si è ritarato niente.

| il curioso | scalinata | torre | grotta | scala sommersa | botola | miniera |
|---|---|---|---|---|---|---|
| forza sul livello atteso, mediana | −1 → −1 | −1 → **+1** | +1 → +1 | 0 → **+1** | +1 → +1 | −1 → **0** |
| discese vinte alla prima | 93 → 95 | 99 → 99 | 96 → 100 | 99 → 96 | 93 → 98 | 98 → 98 |
| con uno svenimento | 13 → 12 | 21 → 8 | 18 → 6 | 8 → 3 | 13 → 6 | 8 → 6 |
| pozioni bevute a discesa | 4,1 → 3,8 | 4,5 → 3,4 | 3,5 → 2,3 | 2,6 → 1,6 | 9,3 → 6,3 | 6,4 → 4,2 |
| gemme prese | 97 → 97 | 154 → 147 | 193 → 211 | 270 → 343 | 395 → 670 | 638 → 1067 |
| gemme avanzate, mediana | 3 → 3 | 50 → 24 | 64 → 60 | 76 → 95 | 97 → 158 | 272 → 552 |

Il bravo: vinte alla prima nella scala sommersa 88 → 91, nella botola 92 → 94, nella miniera 81 → 93; le altre non si muovono.

- **La forza non cambia di molto** (da zero a due livelli, in tre discese su sette, e le vittorie non si muovono): gli anelli di base non danno braccio né difesa, e
  quelli magici e rari sono pochi. Il curioso beve però un quarto o un terzo di pozioni in meno e sviene meno: più gemme, più spese.
- **Quello che sale davvero sono le gemme**: con il teschio del cercatore al collo e due anelli verdi una gemma vale ×3 (1 + 1 + 0,5 + 0,5), prima al massimo ×2. Il
  curioso prende il 70% di gemme in più nelle ultime due discese e ne avanza il doppio. Se è troppo, la leva è un tetto al moltiplicatore (come la schivata al 60%)
  o il valore del teschio e dell'anello verde: nessuno dei due è stato toccato.
- **I bersagli che si spostano** (di quelli già fuori, e quelli nuovi): gli svenimenti del curioso, già sotto il 20% in cinque discese su sette, scendono ancora (torre
  21 → 8); la vita dopo lo scontro grosso sale di due-otto punti (gallerie 65 → 70, fuori da 40–70); fra i fortunati gli scontri finiti sopra il 90% passano il 55% nelle
  gallerie (46 → 62) e nella scala sommersa (34 → 57). Gli scostamenti sono 27, erano 28: la taratura dei mostri li rimette in fila.
- **`npm run test:misure` (sotterraneo)**: i guasti salgono da 12 a 21, i nuovi sono tutti delle zone (altare al 12, 16, 20 e 30 e «zone al 20»: si vince il 93–100%
  dove il bersaglio è «non sempre»); la scala sommersa due livelli sotto torna in bersaglio. L'anello verde nelle righe della storia non c'entra (tolto, restano 22):
  è il giocatore finto che con tre gioielli diventa più forte nelle zone. Le unità restano come prima (`unita/sotterraneo-roba`, la sola rossa, è «torre 3/6» di sempre).
