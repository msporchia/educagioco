# La manopola dell'età

Come si sceglie l'età di un bambino, perché il componente è uno solo, e cosa
succede quando la si sposta. Cosa l'età decide poi (portata delle tappe,
partenze, fasce) sta in [../apprendimento/eta-e-portata.md](../apprendimento/eta-e-portata.md);
il quadro che compare sotto in [quadro.md](quadro.md).

## Un componente solo, in anni

`src/components/eta/`:

- `Manopola.vue` — la manopola intera, col quadro sotto;
- `Tacca.vue` — il `◀ 8 anni e mezzo ▶`, a mezzi anni;
- `bozza.js` — il numero che si muove **senza toccare il profilo**;
- `Conferma.vue` — il cartello che applica;
- `Blocco.vue`, `Riga.vue` — il quadro.

**È lo stesso in tutti i posti dove si sceglie un'età**: il primo avvio, la
carta del bambino, la scheda delle domande. Provato averne una seconda
(`− +`, che scriveva `settings.eta` e basta): portava un bambino da quattro a
dieci anni lasciandogli in casa i giochi di quattro, e niente lo diceva.

Gli anni sono l'unità vera del sistema — 12,5 punti per anno, la stessa
scala di `portata` e dei `livelli:` delle domande — e da lì dipendono tre
cose: quali giochi si vedono, cosa si dà per scontato, fin dove pescano le
domande. Le quattro fasce di `src/data/partenze.js` sono una conseguenza:
`partenzaPerEta` prende la più vicina.

**La tacca deve dire cosa fa.** «Terza elementare» dice a chi è rivolta la
scelta, non cosa cambia: per questo sotto c'è il quadro di quell'età, che si
muove mentre si muove la tacca.

## Muovere non è applicare

La tacca muove una **bozza**: il quadro diventa l'anteprima di quell'età, e
si scrive solo premendo «Applica» nel cartello (`Conferma.vue`), che resta
**appiccicato in fondo allo schermo** finché la bozza è diversa. Una conferma
in coda a una colonna alta due schermate non si vede, e da sopra sembra un
tasto rotto. Attraversare tre fasce è **una scrittura sola**.

## I tre casi dello spostamento

Li decide `spostandoLEta`, che è **la stessa funzione** che poi scrive
(`spostaLEta` in `src/store/profile.js`) e che calcola l'anteprima: un
riassunto rifatto per conto suo direbbe una cosa e il salvataggio ne farebbe
un'altra.

- **Stessa fascia** — si sposta l'età e basta. Il cartello lo dice («si
  sposta solo la mira delle domande»), se no «Applica» sembrerebbe
  pericoloso quanto l'altro caso.
- **Fascia diversa, profilo sui difetti** — si riscrive: non c'è niente di
  suo da perdere.
- **Fascia diversa, con roba a mano** — il cartello conta *cosa* si perde
  (`mossa.perde`: giochi, saperi, domande ritoccate). «2 giochi messi a
  mano, 1 domanda ritoccata» è una domanda a cui si risponde; «sei sicuro?»
  no.

Monete, animali, campagne e traguardi non si toccano mai.

## Il primo avvio

Si chiede **al primo avvio e a ogni bambino aggiunto**: `src/components/Benvenuto.vue`
è un wizard solo per i due casi, e finisce **entrando in partita col bambino
nuovo**. Al primo avvio non si chiede il codice: nessuno l'ha ancora scelto.

**La manopola nasce sui quattro anni**, in fondo alla scala: chi aggiunge un
bambino aggiunge quasi sempre il più piccolo di casa, e premere senza leggere
sbaglia **dalla parte giusta** — la casa più piccola e la taratura più
prudente. Un valore di partenza a metà scala sbagliava nell'altro verso.

Nei test: `[data-manopola]`, `[data-eta="su"|"giu"]`, `[data-eta-ora]`,
`[data-conferma="eta"]` col suo `[data-perde]`,
`[data-azione="eta-applica"|"eta-annulla"]`. Le guide del primo avvio:
`[data-azione="cos-e"]` ([guide.md](guide.md)).
