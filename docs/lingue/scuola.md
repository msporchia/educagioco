# English a scuola

A scuola il bambino gioca a English vero (`src/giochi/inglese/Gioco.vue`), limitato alle tappe che la maestra ha scelto e
**senza audio**. Il gioco non si storpia: si limita da fuori. Chi lo monta è la vista della scuola
(`src/scuola/giochi/inglese/`, il contratto è [../scuola/giochi.md](../scuola/giochi.md)); il modello più vicino è Passo
passo ([../passo-passo/scuola.md](../passo-passo/scuola.md)).

## Cosa sceglie la maestra

```js
{ tipo: 'inglese', isola: 'prima', tappe: ['prima-colori', 'prima-che-cose'] }
//   isola: l'id di un mondo di dati/mondi.js
//   tappe: gli id delle sue tappe, almeno uno; la 🏁 (`prima-bandiera`) è «Il ripasso di tutta l'isola»
```

- **Le chiavi sono gli id delle tappe e dei mondi** (`dati/mondi.js`), non gli indici: una tappa aggiunta a un'isola non
  sposta le lezioni salvate.
- **Un'isola sola per esercizio**: è un anno di scuola, e le sue tappe usano le parole delle tappe prima. Per mescolare
  due isole ci sono due blocchi della lezione ([../scuola/lezione.md](../scuola/lezione.md)).
- **Il ripasso dell'isola è la 🏁**, una tappa come le altre: pesca da tutto il mondo. Il 📦 cassetto e il libro restano a
  casa.
- **La scheda** (`scheda.js`) legge i mondi del gioco (dati puri, niente store) e dà all'editor `ISOLE`: per ognuna l'anno
  di scuola, cosa insegna e le tappe con la loro specie (parole, frasi, ripasso). `valido` rifiuta chiavi in più,
  un'isola che non c'è, tappe vuote, doppie, di un'altra isola o il cassetto; l'ordine no, perché si gioca sempre in
  quello dell'isola. **`descrivi`**: «English · Il prato in fiore · «I colori» e «Gli animali»», «tutte le tappe», e oltre
  tre «5 tappe».
- **L'editor** (`Parametri.vue`): le isole come tessere, col loro anno (per la maestra sì: il bambino non lo vede mai,
  [mondi.md](mondi.md)) e quello che insegnano; poi le tappe, quelle di frasi segnate, la 🏁 come «Il ripasso di tutta
  l'isola». Cambiando isola si parte dalla sua prima tappa; almeno una resta accesa.

## Il gioco col limite

`<IngleseAMondi :limite="{ isola, tappe }">`. **A casa manca** (`null` di difetto), e `tappeDelLimite`
(`motore/scuola.js`, puro) torna `null`: niente di quello che segue esiste.

- **Il giro**: le tappe scelte, nell'ordine dell'isola. Si parte dalla prima senza mappa; il cartello di fine porta alla
  tappa dopo del giro (anche la ✕), e finita l'ultima **si ricomincia**. Il titolo dice «2/3 · Che cos'è?».
- **La partita è quella di casa**: la `Sessione`, i formati che salgono con la forza, il perché e «Si fa così» dopo uno
  sbaglio, la pagina dei concetti. Il profilo è nuovo (in memoria, [../scuola/architettura.md](../scuola/architettura.md)):
  si parte dalle figure e da «riconosci». La pagina dei concetti si presenta la prima volta che la tappa si gioca nella
  lezione (`vinteNelGiro`), non a ogni giro.
- **Toccare una parola è sempre gratis**: senza monete non c'è niente da perdere, quindi niente bolla che chiede e niente
  «questa domanda non paga». Nel ripasso conta lo stesso come non saputa.

| Resta (è il gioco) | Si spegne con `limite` |
|---|---|
| le domande, le tessere, l'esito con il perché | la mappa (a scuola `viste/Mappa.vue` è un `Vuoto.vue`), il libro, il cassetto, il gioco di prima |
| la pagina dei concetti, la parola da toccare | le monete (`incassa`, l'indicatore), `segnaVinta`, i contatori (`segna`) |
| il cartello di fine col grado | la sosta: `salva` non scrive niente; sul cartello niente monete né «La mappa» |
| | l'audio (sotto) |

## Niente audio

Scelta dell'utente: in classe non c'è il suono. Le domande in ascolto (`ascoltoFigura`, `ascoltoIt`) non escono perché
la sessione riceve una voce che non c'è: con il limite `haVoceOra` è falso, qualunque cosa dica il profilo (che a scuola è
comunque muto). Da lì `scegliTipo` le scarta, il 🔊 accanto alla parola non compare e nemmeno «non posso ascoltare»
(`NonSiSente`). Con il limite il gioco non chiama `prepara` né `pronuncia`: nessun `AudioContext` nasce per la voce.

Il registro dell'audio (`src/audio-log.js`) scrive nel libretto dei guasti di casa (`incidenti.js`, vietato a scuola):
a scuola lo sostituisce `src/scuola/sostituti/inglese-audio-log.js`, con gli stessi nomi e niente dentro. Le voci incise
(`data/voci.js`) restano nel file: il peso non è un problema.

## I sostituti

`src/scuola/giochi/inglese/sostituti.js`: la mappa e `views/LinguaGame.vue` vuoti (non si aprono), il registro dell'audio
muto, e `dati/capitoli.js` con `CAPITOLI` vuoto: raccoglie le storie con `import.meta.glob`, che la guardia del pacchetto
vieta, e senza mappa il libro non si apre. Ammessa la cartella `src/giochi/inglese/`.

## L'evento `risposta`

Ogni risposta data è una risposta per la maestra (non il «salta» dei grandi, che a scuola non c'è):

```js
{ chiave: 'frase:m-pen', giusta: false, ultima: true, ms: 6400,
  fatto: 'Componi: Il mio gatto dorme sul letto.', data: 'The cat sleeps on my bed.', attesa: 'My cat sleeps on the bed.' }
```

- **`ultima: true` sempre**: dopo uno sbaglio la partita passa a un'altra domanda, quindi ogni risposta chiude la sua.
  La chiave è quella dello SRS (`en:dog`, `verbo:swim`, `frase:<id>`).
- `fatto` (`racconta` di `motore/scuola.js`): cosa chiede il formato e il testo che il bambino ha davanti — «La figura:
  dog», «Che vuol dire: dog», «In inglese: cane», «Che vuol dire: It is a dog», «In inglese: È un cane.», «Completa: …»,
  «In ordine: …», «Componi: …».
- `data`: l'opzione toccata (l'emoji per le figure), o per le tessere la fila composta come si legge a schermo.
- `attesa`: l'opzione giusta, o la frase giusta (`giustaEra`). Una risposta giusta ha `data` uguale ad `attesa`.
- Sopra i 40 caratteri si taglia **a una parola intera** coi puntini (`corto`); una parola sola troppo lunga si taglia
  senza spezzare un'emoji.
- `ms`: il tempo guardato dalla domanda (quello che va anche allo SRS), da quando è comparsa.

Nei test: `unita/inglese-scuola` (senza limite nessun giro; le isole e le tappe della scheda uguali ai mondi; `valido`
contro una ventina di forme storte; `descrivi`; il giro in ordine e da capo; `corto`; ogni frase in ogni formato,
giusta e sbagliata, raccontata nei 40; ogni tappa di ogni isola giocata da un profilo nuovo senza voce: nessuna domanda in
ascolto, e con la voce sì). Bersagli: la vista `[data-gioco="inglese"]`; nell'editor `[data-isola]` e
`[data-tappa-inglese]`; il cartello senza `[data-azione="mappa"]`.
