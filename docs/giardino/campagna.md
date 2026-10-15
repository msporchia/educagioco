# La campagna

Nove tappe in tre scalini (`dati/campagna.js`). **Ogni tappa parte da zero**:
campo vuoto, i soli di partenza, le piante che dichiara. Tarata una tappa,
è tarata: se ne aggiunge o se ne sposta una senza toccare le altre. (Il
Castello no: lì le torri comprate prima si portano dietro.)

| scalino | tappe | piante | conti |
|---|---|---|---|
| 🌱 il prato | la prima aiuola (3 corsie) · il vialetto (4) · il cancello (5) | girasole, tiratore, poi noce | + poi − |
| 🏡 il cortile | il pozzo · la legnaia · il pollaio | + doppio | + − × |
| 🪦 il cimitero | i cipressi · le lapidi · la cripta | + gelo | tutti, la cripta ha il gigante |

- **Una tappa dichiara** `piante`, `soli`, `corsie`, `zombi: { n, durata, tipi }`,
  `capo`, `portata` (0-100: `docs/apprendimento/eta-e-portata.md`), `racconto`.
- **Si vince** quando sono arrivati e morti tutti; **si perde** quando uno
  zombi arriva in casa in una corsia senza più carretto.
- **Le stelle**: nessun carretto partito → 3, uno → 2, di più → 1. Si salva
  il primato (`profile.campagne.giardino.stelle`), non la somma.
- **Perdere non toglie niente**: la tappa aspetta.
- **Uscire a metà non butta la partita**: la sosta (`motore/sosta.js`) salva
  soli, piante, zombi e quelli che devono ancora arrivare; non salva il caso
  (la fila degli zombi è già scritta, quindi la partita ripresa è la stessa).
  Vedi [`../core/ripresa.md`](../core/ripresa.md).
