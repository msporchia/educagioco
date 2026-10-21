# I giochi nelle impostazioni dei grandi

**Stato: fatta la sezione «I giochi di <bambino>»** (scheda «Giochi», in cima). Il riordino intorno (barra in basso, data di
nascita, tendine per le cose delicate) è in [riordino.md](riordino.md).

L'idea (dell'utente): le impostazioni di un gioco si trovano **dove un genitore lo cerca**, cioè nel gioco, e il gioco è fatto come lo
vede il bambino. Il bambino dice «questo gioco mi chiede le divisioni»: il genitore apre quel gioco e le trova.

## Com'è fatta (`components/genitori/Giochi.vue`)

- **Il carosello della home** (`components/home/Carosello.vue`, con `imposta`, `spenti` e `in-mezzo`): senza il «▶ gioca», una carta più
  bassa, l'indice in una fila sola. Elenca **tutti** i giochi di `data/giochi.js`; quelli che in casa non ci sono (`!inCasa`) sono **in grigio**.
- **Sotto, le impostazioni del gioco in mezzo**:
  1. **«In casa» a tre posizioni**: *come dice l'età* · *acceso* · *spento*. Sono le tre posizioni che `settings.giochi` ha sempre avuto
     (`fissaGioco(chiave, 'difetto' | 'si' | 'no')`, vedi [interruttori.md](interruttori.md) e [ritocchi.md](ritocchi.md)): `true` = acceso comunque,
     `false` che l'età non si aspetta = spento da un grande, il resto = come dice l'età. Una riga dice cosa succede («A 8 anni è in casa»,
     «gli serve X, che è spento», «è un gioco in prova»).
  2. **Il tempo che ci passa**: gli ultimi 7 giorni (barre, anche i giorni vuoti), «da quando gioca», giorno più lungo, giorni su 7. I conti
     sono `perGiornoDi` in `store/sessioni.js` (stessa forma di `perGiorno`, stesse sessioni di [../core/sessioni.md](../core/sessioni.md)).
  3. **Le domande di questo gioco**: i saperi che chiede (o di cui ha bisogno: le pozioni, «senza questa il gioco non c'è in home»), ognuno con nome, esempio,
     **«vale anche in: …»**, un interruttore e **la difficoltà a tacche** (`ritocca`: mezzo anno sopra o sotto la taratura, al massimo tre per parte, come la ✎ del quadro).

## Le domande: da dove le sa

`data/domande-dei-giochi.js` dice da dove pesca ogni gioco: `{ moduli: ['conti'] }` (Castle Battle, il giardino: i saperi sono le tipologie
che quei moduli dichiarano, il primo `sa` è il gruppo), `'tutte'` (sotterraneo, survivors: pescano dal mazzo intero, e la pagina rimanda a
«Le domande dei quiz»), oppure niente (nessuna domanda di scuola, o non ancora elencata: `chiede:` del manifesto, se c'è). Lo
ricava `saperiDelGioco` in `quiz/saperi.js`. Un test (`unita/domande-dei-giochi`) pretende che ogni gioco con `quiz: true` sia nominato.

**Un sapere resta di tutti i giochi.** Spegnere «Divisioni» dalla pagina di Castle Battle le toglie anche dalla bancarella: è com'è fatto il
motore ([../apprendimento/saperi.md](../apprendimento/saperi.md)) e non si cambia (un gioco con un interruttore per metà sarebbe due giochi, vedi
«Il quarto non si rifà» in [interruttori.md](interruttori.md)). Per questo ogni domanda dice dove altro vale (`giochiCheChiedono`).

## Cosa manca (voci aperte)

- Elencare le domande degli altri giochi (inglese, spagnolo, bancarella, asteroidi…): oggi li dice «non le ha ancora elencate».
- «Come funziona questo gioco» (la guida) nella pagina del gioco.
- «Ricomincia questo gioco» in una tendina.
- Togliere dalla scheda sotto («Interruttori», «Le domande dei quiz») quello che questa sezione già fa.

Nei test: `[data-giochi-impostazioni]`, `[data-pannello-gioco]`, `[data-gioco-modo="segui"|"acceso"|"spento"]`, `[data-gioco-esito]`,
`[data-gioco-tempo]`, `[data-gioco-domande]`, `[data-gioco-sapere="<chiave>"]` con `[data-gioco-sapere-tasto]`; il carosello `.carta.gioco.spenta`
e `[data-indice="<gioco>"]`. `integrazione/giochi-impostazioni`, `unita/domande-dei-giochi`, `unita/sessioni`.
