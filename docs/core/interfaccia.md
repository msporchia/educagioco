# L'interfaccia comune

Le regole che valgono in ogni schermata: la barra, i fogli, la pausa,
l'orientamento, i tempi dei tocchi e due guasti invisibili. Il dito ha la
sua pagina: [il-dito.md](il-dito.md).

## La barra e i fogli

- **Come si torna indietro è una cosa sola**: la barra
  (`src/components/Barra.vue`), con `←` sempre primo a sinistra, unico
  tasto pieno e colorato — il solo che un bambino deve trovare senza
  cercarlo. Accanto il nome del posto, a destra monete e audio, in mezzo
  gli indicatori del gioco (❤️ 🌊 ⚡ nel castello). `?` e ⏸ compaiono solo
  dove il gioco li chiede.
- **Un foglio si chiude con la ✕ in alto a destra, sempre visibile**
  (`src/giochi/fattoria/viste/Chiudi.vue`, `sticky`: in un baule da
  duecento voci l'uscita non sta due schermate più giù). Il tasto in fondo
  resta solo dove è una scelta («Lascia stare / Compra»).
- **Lo scorrimento è uno solo**: il foglio è una colonna (`display: flex`),
  titolo e tasti fermi, l'elenco in mezzo si stringe e scorre
  (`flex: 0 1 auto; min-height: 0`). **Niente altezze in `vh`**: sono prese
  su un telefono solo, e sopra e sotto l'elenco c'è altro che in `vh` non
  si conta — un foglio che sborda ha i tasti irraggiungibili, e non si
  chiude più.
- `unita/fattoria` legge i `.vue` e pretende la ✕ da ogni vista che
  dichiara `'chiudi'` negli `emits`, anche da un foglio che ancora non
  esiste.

Nei test: `button[aria-label="indietro"]` (mai il carattere),
`[data-chiudi]`.

## La pausa, una sola

`src/giochi/pausa.js` (contratto in testa al file) e
`src/giochi/VeloPausa.vue`. A pagina nascosta un gioco a orologio si
congela da sé; il guasto è **la ripresa**, istantanea, in faccia a chi ha
appena riacceso il telefono — e senza pausa l'unico modo di fermarsi era
«indietro», che nella corsa butta la gara.

```js
const { inPausa, fermo, metti, togli, aiuto } = usaPausa()
```
```html
<Barra … pausa @pausa="metti()" @aiuto="aiuto" />
<VeloPausa v-if="inPausa" @riprendi="togli" />
```

e nel battito `if (!fermo.value) p.avanza(dt)`.

- **Non si riprende mai da soli**: tornare allo schermo mette in pausa, si
  riparte al tocco (in Survivors ha preso il posto di `inAttesa`).
- **`fermo` non è `inPausa`**: `fermo` è tutto quello che tiene ferma la
  partita (pausa, cartello di un traguardo, foglio del `?`, quello che il
  gioco aggiunge con `anche:`), `inPausa` solo quello che merita il velo.
- **`anche:` vuole roba reattiva** (`fermo` è un `computed`): i campi di un
  motore in `shallowRef` (`p.finita`, `p.inPausa`) si guardano nel battito.
- **Si toglie anche in `avvia()` e nell'uscita alla mappa**, se no la
  partita nuova nasce dietro un velo.
- **Senza pausa**: chi non ha orologio (la fattoria: sarebbe un tasto che
  non fa niente); il Generale (ha Via/Stop, e fermare il tempo lì è una
  mossa); il Dungeon (a turni: da fermare ci sono solo i `setTimeout`); la
  domanda di quiz, che è già un velo — il ⏸ sparisce e rispondere *è* il
  tocco che riprende.

Nei test: `button[aria-label="pausa"]`, `[data-pausa]`,
`[data-azione="riprendi"]`.

## I tempi

- **Gli orologi che non sono fotogrammi si fermano a mano.** Un
  `setTimeout` scatta a schermo spento e `performance.now()` misura il
  tempo di parete: un telefono posato annotava in `src/store/srs.js`
  quaranta minuti, e con `it.t` media pesata al 45% un campione solo diceva
  «ci mette venti minuti» per sempre. Si conta il tempo **davanti agli
  occhi**, col tetto `TEMPO_MAX` (`src/quiz/nucleo/domanda.js`), e l'attesa
  dell'esito si congela e riparte da quello che restava.
- **Una schermata appena comparsa non si tocca subito, e l'attesa si
  vede.** Due secondi muti dopo uno sbaglio sembrano un tasto rotto, il dito
  ripreme e il tocco atterra sulla schermata dopo, nello stesso punto.
  Perciò 320 ms ciechi al montaggio (`CIECA` in `src/quiz/Domanda.vue`) e
  una riga che si riempie per dire quanto manca.

## Un `v-if` che non si spegne mai non rimonta niente

Il guasto più costoso trovato finora. `src/quiz/Domanda.vue` (una sola per
sotterraneo, Dungeon, Corsa e Survivors) passa dalla domanda A alla B nello
stesso giro di aggiornamento: Vue non smonta e **riusa l'istanza** con lo
stato di prima. La domanda nuova nasce con un tasto già colorato e il gioco
si ferma, senza nessun errore.

- **Il rimedio sta dentro il componente**: un `watch` sulla prop che
  rimette tutto a zero. Non un `:key` a carico di chi lo monta: va
  ricordato ogni volta, e se lo ricordava uno su cinque.
- Test: `integrazione/domanda`, due domande vere in fila nel sotterraneo,
  dove la seconda arriva nella stessa istanza comunque si risponda.

## Il resto

- **I giochi sono verticali**: il manifest della PWA chiede `portrait` e
  l'app installata parte bloccata; dal browser non si può imporre, e
  girando il telefono esce il cartello «Gira il telefono» (`.gira` in
  `src/App.vue`), mai su tablet e computer.
- **Un errore non resta muto**: Vue scrive in console e lascia la
  schermata com'era, cioè un tasto che non fa niente. `src/incidenti.js` lo
  scrive in archivio e lo dice a schermo.
