# La home

Sotto la fascia del livello, tre pezzi: **«riprendi da qui»**, il
**carosello** delle copertine e l'**indice** di tutti i giochi. Prima era
una lista di carte larghe, una per gioco: quindici giochi erano cinque
schermate da scorrere, e nessuna diceva «è un gioco». Il resto (nastri,
chi gioca, Impostazioni, Come funziona, versione) è rimasto com'era.

I file: `src/views/HomeView.vue` mette insieme, `src/components/home/`
disegna (`Riprendi.vue`, `Carosello.vue`, `Copertina.vue`, `scene.js`).

## Riprendi da qui

- **È l'ultimo gioco giocato**, letto dal registro delle sessioni
  (`store/sessioni.js`): la voce con l'inizio più recente, con
  `chiaveDelGioco` per i giochi che hanno più chiavi. Una visita sotto i
  cinque secondi non è una sessione, quindi non conta.
- **Un gioco spento non si ripropone**, e un bambino nuovo non ha il
  riquadro: senza partite la home parte dal carosello.
- Dice il nome, dove si era arrivati (la stessa riga della copertina) e ha
  un ▶ grande. Su un fondo chiaro il testo diventa scuro.

## Il carosello

- **Tutti i giochi accesi, nell'ordine delle aree** (`AREE` in
  `data/aree.js`). Uno spento non c'è e basta: niente buchi.
- **Apre solo la copertina in mezzo.** Toccare una vicina la porta in
  mezzo; strisciare di lato scorre, e un lancio veloce va un po' più in
  là; su e giù scorre la pagina (`touch-action: pan-y`).
- **Si apre al `click`, non al `pointerup`**: il click che il dito si
  lascia dietro atterrerebbe sulla schermata del gioco appena aperta
  ([il-dito.md](il-dito.md)). Dopo una strisciata quel click si ingoia.
- **La soglia è quella del dito, 16 px**: sotto, il dito è fermo.
- **Il gioco in vista si ricorda** andando e tornando da un gioco (una
  variabile del modulo, non l'archivio): chi esce trova il carosello dove
  l'aveva lasciato. Un ricaricamento riparte dal primo.
- **Il carosello è uno strato a sé** (`isolation: isolate` su `.giro`):
  le copertine hanno uno `z-index` loro, e senza coprivano il foglio
  «cerca aggiornamenti» (lo ha trovato `integrazione/aggiornamento`).

## L'indice

Un'icona per gioco, sul colore della sua area (`tinta` in `AREE`), quella
in mezzo bordata, l'ultimo giocato col pallino giallo. Serve a trovare un
gioco senza scorrere: la copertina fa riconoscere, l'indice fa arrivare.
Quindici giochi stanno su due righe a 375 px, e su tre a 320.

## Le copertine

Un gioco porta `copertina: { fondo, disegno, scena }` nel suo manifesto (i
giochi vecchi nella loro riga di `data/giochi.js`). `scena` è uno dei
disegni piatti di `components/home/scene.js` (`stelle`, `colline`, `tenda`, `bolle`,
`onde`, `griglia`, `mattoni`, `grotta`), sopra ci va l'icona grande. Senza
`copertina` il gioco uscirebbe grigio: `unita/aree` è rosso. Sono provvisorie: la copertina vera è un
disegno del gioco, ancora da fare.

## Nei test

- `.carte`: la home è pronta.
- `.carta.gioco[data-gioco="…"]`: la copertina di un gioco, con `.davanti`
  quella in mezzo; dentro, `b` è il nome e `i` cosa insegna.
- `[data-indice="…"]`: l'icona dell'indice, `.ultimo` sull'ultimo giocato.
- `[data-riprendi="…"]`: il riquadro «riprendi da qui».
- **Per aprire un gioco dalla home si usa `scegli(page, chiave)`**
  (`test/aiuto/browser.mjs`): indice, poi la copertina in mezzo. Un
  `page.click` su una copertina che non è in mezzo la sposta e basta.
- `integrazione/home` prova col dito vero (CDP): strisciata, vicina,
  indice, apertura, ritorno e «riprendi».
