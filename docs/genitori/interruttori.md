# Cosa possono spegnere i genitori

I tre interruttori per bambino — un gioco, un pezzo di scuola, i giochi in
prova — e perché non ce n'è un quarto. La differenza fra i tre conta.

## 1. Un gioco (`settings.giochi`)

Sparisce la carta in home, i progressi restano.

- **È un elenco di eccezioni**, per bambino: `{ torri: false }`. Un gioco
  che l'elenco non nomina **vale quello che la partenza di quell'età
  scriverebbe oggi** (`spentoDallEta` in `src/data/portata-giochi.js`; il
  quadro fa la stessa lettura). Così un gioco nuovo arriva come dice l'età
  anche a chi ha il profilo di ieri, e due bambini della stessa età hanno la
  stessa home qualunque sia il giorno in cui sono nati.
- **Un gioco già aperto non sparisce** per età (`giaProvato`, vedi
  [eta-e-portata](../apprendimento/eta-e-portata.md)).
- **Si dice anche il contrario**: `{ sotterraneo: true }` lo tiene in casa
  contro l'età (`fissaGioco` in `src/store/profile.js`), e la home lo
  rispetta (`giocoForzato` vince su `giocoDaVedere`). Vince sull'età, non
  sui saperi spenti.
- **Un gioco può nascere spento per tutte le età** (`spentoDiBase: true` nel
  manifesto, letto da `eccezioniDi` in `src/data/partenze.js`): oggi solo i
  giochi in prova, qui sotto. Il genitore lo accende dalla ✎; chi l'ha già
  giocato lo vede comunque. Provato con lo spagnolo: tolto, resta acceso come
  gli altri e chi non lo vuole lo spegne.
- Si sceglie dalla ✎ della sua riga nel quadro ([ritocchi.md](ritocchi.md)),
  non da una fila di interruttori.

## 2. Un pezzo di scuola (`settings.sa`)

Spariscono le *domande* che lo danno per scontato, in tutti i giochi; i
giochi degradano invece di sbarrare. Chi dichiara il bisogno, le due specie
di chiavi, `chiede:` nel manifesto e il criterio per decidere cosa si spegne
stanno in [../apprendimento/saperi.md](../apprendimento/saperi.md).

## 3. I giochi in prova (`spentoDiBase` + `nota`)

Non c'è un interruttore a parte (c'era `settings.sperimentali`, tolto): un
gioco ancora a metà ha nel manifesto `spentoDiBase: true` e una `nota` che lo
dice («è a metà, può cambiare»). Nasce spento per tutte le età come tutti i
`spentoDiBase`, il genitore lo accende dalla ✎, e lì sopra legge la nota.
Con `nota` resta fuori dalle guide in app; il quadro lo mostra come spento.
Per farlo uscire basta togliere `spentoDiBase` e `nota` dal manifesto.
Oggi in prova c'è **Il giardino**.

## Il quarto non si rifà

Niente interruttore per *metà di un gioco* (`settings.varianti`, tolto):
un gioco che a seconda di un flag ne è uno o due è due giochi, e si porta
dietro file filtrate e numerazioni doppie. Chi vuole meno di qualcosa usa
l'età o il pezzo di scuola, che valgono per tutti i giochi insieme.

Nei test: `.carta.gioco[data-gioco="…"]` (per aprirla, `scegli`: vedi
[../core/home.md](../core/home.md#nei-test)), `.carta[data-flag="…"]`
(`tuttoAperto`, `giudizi`), `.carta[data-azione="…"]`.
