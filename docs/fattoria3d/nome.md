# Il nome della fattoria

Il bambino può dare un nome alla fattoria (su richiesta di una bambina: «La fattoria» non le basta), e lo stesso vale per ogni fattoria in
comune con un amico ([in-comune.md](in-comune.md)).

- **Dove sta**: `stato.nome` dentro lo stato di ogni fattoria, quindi la propria ha il suo e la fattoria in comune di ogni amicizia il
  suo. Vuoto = nessuno: la barra dice «La fattoria» (o «Con <amico>» nella fattoria in comune). Un salvataggio di prima non lo ha e si
  legge lo stesso, senza cambiare `VERSIONE_STATO`.
- **Regole** (`pulisciNomeFattoria` in `motore/stato.js`): spazi ripuliti, niente `<` `>` né caratteri di controllo, al massimo 24
  lettere. Gratis e sempre, come il nome delle bestie.
- **Si cambia** col ✏️ nella barra in cima (anche nella fattoria in comune): un foglio con la casella e «Lascia “La fattoria”» per
  toglierlo (`viste/NomeFattoria.vue`).
- **In comune** `rinomina` è una mossa (`MOSSE` in `motore/registro.js`): chi cambia il nome lo cambia a tutti e due, ultimo vince, e
  finisce anche nella fotografia.
- **Non c'è ancora** nelle visite: il nome che un vicino vede è quello del villaggio (`dati/vicini.js`), non quello scelto dal bambino.

## Nei test

`unita/fattoria3d-nome`. Bersagli: `[data-f3="apri-nome"]` (il ✏️), `[data-f3="nome-fattoria"]` (il foglio), `[data-f3="nome-scrivi"]`
(la casella), `[data-azione="scrivi"]` e `[data-azione="lascia"]`.
