# Le feste: costumi e zucche a Halloween, neve a Natale

La fattoria cambia faccia in due periodi dell'anno. Il codice è
`dati/stagioni.js` (puro) e la scena `scena/tela.js`.

La fattoria è il posto dove si torna tutti i giorni, e tutti i giorni è
uguale a ieri: aprire il gioco a dicembre e trovare la neve, o a ottobre
e trovare i recinti in costume, è **una cosa che succede** senza che nessuno
l'abbia comprata. Le cose da mettere (zucche, cappello) invece si comprano.

## Le finestre

- **Halloween dal 1 al 31 ottobre, Natale dal 1 novembre al 6 gennaio**,
  estremi compresi (`FINESTRE`, `[mese, giorno]`): si ritoccano lì e in
  nessun altro posto, e i test provano i bordi leggendo quella tabella.
  Le due feste si toccano: Natale parte il giorno dopo Halloween, e non
  c'è nessun giorno «vuoto» tra l'una e l'altra.
- **In ora locale** (`stagioneDi(data)`, `getMonth`/`getDate`): la vigilia
  alle 23:30 è ancora la vigilia anche se a Greenwich è domani. Natale
  scavalca l'anno, ed è il caso che una finestra scritta «da ≤ giorno ≤ a»
  sbaglia. `guastiDelleStagioni` è rosso su una data impossibile o su due
  finestre che si accavallano.
- **`#stagione=natale`** (o `halloween`) nell'indirizzo le accende fuori
  stagione, per guardarle a settembre.

## Halloween: i recinti in costume, i cappelli e le zucche

- **Solo sprite, niente emoji**: i recinti hanno un foglio vestito per ogni
  foglio normale (`animali_halloween_1.png` per i primi cinque,
  `_2` per anatre, capre, api, alpaca e asini; `animali_halloween_*.png` in `strumenti/sprite/sorgenti/fattoria/generati/`),
  e i suoi pezzi si chiamano come gli altri con il suffisso `_halloween`
  (`recinto_mucche_dorme_halloween`). Un fatto dell'atlante, non del
  catalogo: il recinto è lo stesso, cambia il disegno.
- **Chi sceglie è la tela**: se `quadro.stagione === 'halloween'` e il
  pezzo `<nome>_halloween` esiste, lo disegna; se non esiste (una specie
  non ancora vestita) resta il disegno di sempre. Per vestire una specie
  nuova basta il suo foglio e `python3 strumenti/sprite/atlante.py fattoria`.
- **Si guarda soltanto**: nessuna voce nel baule, nessun prezzo, e il
  salvataggio non sa niente (finita la festa i recinti tornano com'erano).
- Il foglio 2 ha l'alfa vera ma mai piena (250-253): `alone` 128 la porta a 255, e le `toppa` che tolgono i fumetti dipinti sono quelle di `animali_2.json`.
- Il foglio 1 è RGB su fondo nero: nel foglietto `fondo: auto` e `colori: 0`
  (coi 12 colori di ripiego i recinti viravano al rosso).
- **Niente spunta da solo, lo decide la bimba.** Le zucche e il cappello da
  strega si comprano e si posano o si mettono; finita la festa quello che si
  è comprato resta (la regola «niente si perde»).
- **Le zucche** sono due voci della linguetta **Feste** del baule, solo a
  Halloween: Zucca intagliata (🪙6) e Due zucche (🪙10), con la candela che
  tremola.
- **Il cappello da strega** è un addobbo (`dati/addobbi.js`, `stagione:
  'halloween'`, 🪙8): in vendita solo a Halloween, e comprato resta. Nel
  guardaroba è in evidenza e primo (`addobbiPer`).
- **Zucche e cappello sono disegnati in pixel, nel codice**
  (`scena/pixel-festa.js`): un carattere è un pixel. Le zucche diventano un
  foglio dell'atlante con `node strumenti/sprite/festa.mjs` e poi
  `python3 strumenti/sprite/atlante.py fattoria`; il cappello lo disegna la
  scena (`viste/Pixel.vue` nel guardaroba). Provate e tolte le emoji 🎃 🕸️
  🦇: emoji Apple in mezzo alla pixel art. Un disegno nuovo della festa si
  aggiunge lì, non come emoji.
- **Farle sapere che esistono**, senza metterle da sé: finché non ha nessun
  cappello le bestie di casa hanno un fumetto «lo vorrei» col cappello
  disegnato (`Attore.desidera`); «Vestilo» ha il segnalino 🎃, e il 🌸 del
  baule ha il segnalino della festa finché non ha posato nessuna voce
  della festa ([baule.md](baule.md)). I bambini chiedevano il cappello ai
  loro gatti: così lo trovano da soli.

## Natale: gli addobbi che compaiono da soli

- A Natale i fiocchi che cadono, una crosta bianca sui tetti e sulle chiome,
  chiazze di neve sull'erba, lucine gialle e rosse sotto le grondaie, ⭐ e
  🔔 sui tetti e un 🎄 accanto agli edifici.
- **Niente si tinge e non c'è nessuno sprite nuovo**: è un velo sopra il
  disegno di sempre, più qualche emoji posata dove c'è posto.
- **La scena non sa che giorno è.** `addobbiStagionali(stagione, { libere,
  edifici, seme })` riceve le celle libere e le cose posate e torna
  `[{ testo, x, y, misura, ondeggia? }]`; la tela riceve
  `quadro.stagione` e quella lista, e disegna. È la regola «chi gioca non
  disegna» applicata al calendario.
- **Effimeri**: non si salvano, non si posano, non occupano niente (una
  bestia ci cammina attraverso, una cosa posata li copre). **Il seme è il
  giorno** (`semeDelGiorno`): la stessa giornata è uguale a sé stessa, e
  domani le celle cambiano.
- Solo le cose alte almeno due celle hanno un tetto da addobbare: una
  panchina addobbata è una panchina coperta.

## Le voci della festa nel baule

- La linguetta **Feste** compare solo in una festa: a Natale l'albero con
  le lucine (🪙24), a Halloween le zucche (`unita/stagioni-fattoria`).
- **Quello che si è comprato resta**, posato tutto l'anno o nel baule:
  un albero pagato a dicembre che si dissolve a marzo romperebbe la
  regola «niente si perde».
- **Non sono premi di livello** e non entrano nella fila del livello: si
  aprono con la finestra, non spendendo.

Nei test: `unita/stagioni-fattoria`, `integrazione/fattoria-stagioni`
(`window.__fattoria.desideri()` e `.cappelli()`: si contano, non si
guardano; `[data-strada]` e `[data-festa]` per i segnalini).
