# I ritocchi: la ✎ su una riga, e il tasto che rimette tutto

L'età è la manopola grossa ([manopola.md](manopola.md)); la ✎ su ogni riga
del quadro è la correzione piccola — «le stagioni le davamo per sapute, e a
scuola sono indietro di mezzo anno». Qui le tre tacche, come si riconosce una
riga messa a mano e come si torna indietro.

## Pezzo di scuola e domanda: `Taratura.vue`

`src/components/eta/Taratura.vue`, aperta dalla ✎.

- **Mezzi anni, non blocchi.** Per un bambino di otto anni i blocchi sono
  larghi 2,5 · 1,5 · 1,5 anni: saltarne uno sarebbe due anni, mentre la
  correzione vera è un semestre.
- **Sette scatti**, tre per parte, col cerchietto vuoto sulla taratura di
  casa. Il nome grande è il blocco dove la riga va a finire (gli stessi nomi
  del quadro, `src/components/eta/gruppi.js`, nella forma corta: «Nel
  segno»); sotto lo scarto, «mezzo anno più difficile · vale otto anni».
  Spostando un pezzo di scuola si spostano **tutte le sue domande**, e la
  tacca dice quante attraversano il confine.
- **L'ottavo, oltre una tacchetta, solo sui pezzi di scuola**: «Non ancora
  spiegate», che non è un ritocco ma `settings.sa` (il tasto diventa
  «Toglila»). Oltre un anno e mezzo non si sta più ritoccando, si sta
  dicendo un'altra cosa. Su una domanda non c'è: una domanda non ha un
  gruppo da spegnere, e spegnere il suo gruppo ne toglierebbe otto.
- «rimettila com'era» riporta la riga alla taratura di casa.

## Un gioco: `InCasa.vue`

`src/components/eta/InCasa.vue` non sposta di mezzo anno: sceglie **chi
decide** — «Non ce l'ha» · «Come dice l'età» · «Ce l'ha».

- «Ce l'ha» scrive `settings.giochi[k] === true`: tienilo **contro la
  portata** (`fissaGioco`, [interruttori.md](interruttori.md)). Non contro i
  saperi spenti, che non sono una questione di età: un gioco fatto tutto di
  un pezzo di scuola spento non si può tenere in casa, e quella posizione
  resta chiusa.
- La posizione di mezzo è **il ripristino di una riga sola**.

## Un pezzo di scuola appeso a un gioco: `Scuola.vue`

Quello che un gioco `chiede:` e nessuna domanda cita
([quadro.md](quadro.md)) ha la stessa tacca a tre posizioni di `InCasa.vue`
(`src/components/eta/Tre.vue`), non quella dei mezzi anni: lì non c'è una
taratura da spostare, c'è un sì/no. `Tre.vue` è un componente solo perché
due tacche uguali a vedersi che scrivono cose diverse fanno premere
«Conferma» a chi credeva di fare l'altra cosa; le parole le porta chi la usa.

**Un estremo è sempre chiuso**: un sapere ha due stati veri nel profilo e il
terzo è l'assenza, quindi l'estremo che coincide col difetto dell'età
scriverebbe lo stesso profilo della posizione di mezzo, e la riga tornerebbe
indietro subito dopo.

## Il paragone è l'atteso, non «nessuna eccezione»

Una riga messa a mano **resta ambra** anche a tacca chiusa: il contatore
dice quante, il colore dice quali. Ma le partenze *scrivono* delle eccezioni
(a nove anni «Prima e dopo» nasce spento): confrontate con un profilo vuoto
risulterebbero messe a mano da un grande che non ha toccato niente, e il
tasto «rimetti tutto» non riuscirebbe a toglierle.

- `aMano` e la posizione della tacca si misurano su `eccezioniPerEta(eta)`.
- `fissaGioco(k, 'difetto')` **scrive l'eccezione attesa** invece di
  cancellare: «rimetti questa riga» e «rimetti tutto» devono lasciare lo
  stesso profilo.
- Vale per le tre specie di riga — i giochi, i pezzi di scuola dei blocchi
  (`manoSu` in `src/data/quadro.js`; la «casa» di `Taratura.vue` è l'ultimo
  scatto quando l'età li spegne) e quelli appesi a un gioco — **e per il
  conto del tasto** (`messeAMano` in `src/data/partenze.js`).
  `unita/quadro` pretende che contatore e colore dicano le stesse righe.
- **Asimmetria voluta**: per un gioco l'assenza vale quello che l'età
  scriverebbe (un profilo nato prima di quel gioco non ha detto niente); per
  un pezzo di scuola l'assenza dove l'età scrive `false` è la mano stessa,
  perché riaccenderlo cancella la voce (`accendiSapere`).

## Il tasto che rimette tutto

In fondo al quadro, **rimette tutto ai valori di quell'età**
(`rimettendoLEta` in `src/data/partenze.js`, `rimettiAiDifetti` in
`src/store/profile.js`): non tocca l'età né i progressi, e compare solo se
c'è qualcosa di suo da buttare, dicendo *cosa* con la stessa frase del
cartello dell'età (`perdeInParole`, `src/components/eta/lettere.js`).

## Niente ritocchi con l'età in sospeso

Cambiando fascia `spostandoLEta` porta via tutti i ritocchi, quindi la ✎
sparisce finché la bozza è diversa. Prima si decide l'età, poi si correggono
le eccezioni.

Nei test: `[data-tara-apri="<chiave>"]`; `[data-taratura]` coi suoi
`[data-tara="giu"|"su"|"applica"|"lascia"|"rimetti"]` e `[data-tara-ora]`;
`[data-in-casa]` coi `[data-gioco-tara=…]`; per un pezzo appeso a un gioco
`[data-sapere-tara="<chiave>"]`,
`[data-sapere-tara-verso="giu"|"su"|"applica"|"lascia"]`, `[data-sapere-ora]`;
`[data-azione="rimetti-difetti"]` con `[data-perde-tutto]`.
