# I moduli di quiz

Il contratto di un modulo di `src/quiz/`, come se ne aggiunge uno, come si
prova e come lo usa un gioco. Difficoltà, ripasso e messa in scena hanno un
file loro (vedi [README.md](README.md)).

Servono a far *pagare* un potenziamento con un esercizio, in tanti giochi e
non in uno: la pausa amara del castello («vuoi la torre, paghi i calcoli»)
portata dappertutto, con domande che non si imparano a memoria. La regola che
tiene su tutto:

> un modulo consegna una **domanda**, e non sa chi gliel'ha chiesta;
> un gioco chiede una domanda, e non sa di che materia sia.

## La forma

- `nucleo/domanda.js` — la forma di una domanda: consegna, soggetto
  facoltativo, da 2 a 6 risposte, l'indice della buona, la chiave del
  concetto, `aiuto` (il metodo) e un `perche` per ogni falso. Le risposte
  sono testo, emoji o una scena disegnata (`testo`, `emoji`, `scena`).
  - **`conNome`** mette il nome sotto una figura solo quando figura e
    parola dicono la stessa cosa e la domanda ne chiede un'altra: in una
    domanda di lingua regalerebbe la risposta, e nessun controllo se ne
    accorge. Il perché per esteso sta in testa al file.
  - **Un soggetto può essere una frase con una parola in rilievo**
    (`{ testo: 'Metto lo zaino in spalla.', evidenzia: 'lo' }`), per le
    parole che da sole non hanno risposta («lo» è articolo o pronome). Nel
    dato **mai HTML**: il grassetto lo mettono `Domanda.vue` e
    `grafica/scheda.js` con `evidenziando`. La parola dev'esserci
    esattamente una volta come parola intera, e `guastiDi` lo controlla.
- `nucleo/modulo.js` — la classe base. Un modulo è `genera(grado, sorte,
  tipo)` e basta: nessuno stato, nessuna memoria, nessun punteggio. Le
  tipologie le dichiara (`tipi`), e quale tirare glielo dice chi chiama.
- `nucleo/sorte.js` — il caso **ripetibile**. Un generatore non chiama mai
  `Math.random()`: senza seme le domande non si provano.

Da copiare: `moduli/ortografia.js` (il **testuale**: dati in cima, classe
sotto, tre modi di chiedere la stessa regola) e `moduli/orologio.js` +
`grafica/pittori/orologio.js` (il **disegnato**: il modulo decide i fatti,
`{ che:'orologio', ore, minuti }`, il pittore li disegna in un quadrato
100×100 e non sa niente di difficoltà o risposte giuste).

## Le tipologie (`tipi`)

Un modulo dichiara le classi di domande che sa fare, una per una, col peso
a ogni grado; il nucleo pesca il tipo fra quelli accesi e lo passa a
`genera`, che diventa uno switch:

```js
super({ …,
  scaletta: ['le ore intere', 'le mezze ore', "i quarti d'ora", …],
  livelli: [25, 38, 44, 56, 75],                  // vedi quiz-livelli.md
  tipi: [
    { chiave: 'ora:intere', nome: 'Le ore intere', sa: 'orologio',
      gradi: { 1: 1, 2: 0.55, 3: 0.2, 4: 0.03 } },
    { chiave: 'ora:quarti', nome: "I quarti d'ora", sa: 'orologio',
      gradi: { 2: 0.45, 3: 0.5, 4: 0.1 } },
  ],
})
genera(grado, sorte, tipo) { switch (tipo) { … } }
```

- **Dichiarate e non sparse negli `if`**: così le proporzioni si
  controllano, i grandi spengono una tipologia e non un grado intero, e la
  chiave si conosce prima della domanda (serve al ripasso).
- **La chiave emessa dev'essere quella del tipo chiesto.** `unita/saperi`
  gioca trecento domande per grado e fallisce su una chiave non dichiarata
  a quel grado, o su un tipo dichiarato che non esce mai.
- `sa` dice quale pezzo di scuola la tipologia dà per scontato (vedi
  [saperi.md](saperi.md)). Un modulo senza `tipi` funziona ancora con
  `genera(grado, sorte)` e `saperi:` per grado (o una stringa per tutto il
  modulo).

## Aggiungere un modulo

Un file in `moduli/`, più uno in `grafica/pittori/` se disegna. Nient'altro:
il registro (`nucleo/registro.js`) e il banco raccolgono dalla cartella, e il
modulo compare **in tutti i giochi** la sera stessa.

1. **La chiave è il concetto, non l'istanza**: `orto:gn`, non «lavagna». Il
   prefisso nuovo si sceglie guardando quelli presi in `store/progressi.js`
   (`verbo:` era già dei verbi inglesi) — vedi [quiz-ripasso.md](quiz-ripasso.md).
2. **I falsi sono gli errori veri** (*ho andato*, la lancetta scambiata, il
   perimetro contato come area), ognuno col suo `perche`. Un distrattore a
   caso si scarta a occhio.
3. **La varietà è un requisito**: il banco fallisce sotto le 25 domande
   diverse per grado, e va puntato molto più in alto.
4. **Un `aiuto` che insegna il metodo in una riga** (vedi
   [la-domanda.md](la-domanda.md)).
5. **Un livello per grado** (`livelli:`): chi tace ricade su una scaletta
   stesa fra sei e undici anni, e `unita/catalogo` lo elenca.

## Provarli

```bash
npm run quiz:banco                       # tutti, senza browser
npm run quiz:banco orologio --mostra 3
npm run quiz:eta                         # chi vede cosa per età → chi-vede-cosa.md
npm run quiz:livelli                     # rigenera livelli-delle-domande.md
node test/esegui.mjs quiz --niente-build
```

Il banco (`strumenti/quiz/banco.mjs`) dice se un modulo è **giusto**: forma,
risposte doppie, scene senza pittore, caso ripetibile, varietà, la buona che
non sta sempre nello stesso posto. Se è **bello** lo dice solo un occhio,
nel gioco vero: dal ▶ di una riga nella schermata dei grandi (`Prova.vue`),
che mette in scena le domande con lo stesso `Domanda.vue` del bambino.

Due difetti che nessun controllo trova:

- **Due risposte difendibili** («con che cosa misuri un secchio»: litri o
  centimetri) superano ogni controllo di forma: si vedono solo leggendo.
- **Le domande che si possono solo ricordare** («quando comincia
  l'inverno?») non insegnano niente, perché fra domanda e risposta non c'è
  un passo. Si chiede *in che stagione cade dicembre*; le date esatte
  stanno nell'`aiuto`; a memoria solo quello che ha una filastrocca (i
  giorni dei mesi) o che è la materia stessa (contrari, participi).

## Usarli in un gioco

**Un gioco non nomina mai un modulo.** Chiede una domanda con una manopola
da 0 a 1 e riceve quello da mostrare:

```js
import { domandaPerGioco } from '../quiz/scelta.js'
import Domanda from '../quiz/Domanda.vue'
const q = ref(domandaPerGioco({ difficolta: 0.6, evita: ultimoModulo }))
```
```vue
<Domanda v-if="q" :domanda="q.domanda" :pittori="q.pittori"
         :titolo="`${q.icona} ${q.nome}`" @risposto="incassa" />
```

`risposto` porta `{ giusto, indice, chiave, tempo }`; il gioco decide cosa
vale e non sa la materia. Un gioco può restringere le materie
(`materie: ['matematica', 'spazio']`, elenco in `MATERIE` di `scelta.js`).
Chi sa del profilo (età, saperi spenti, ripasso) è **solo `scelta.js`**.
Fuori da Vue c'è il gemello imperativo: `await chiedi(ortografia, { grado: 3 })`
(`grafica/scheda.js`). Oggi passano da qui Survivors, Dungeon, sotterraneo e
corsa, e lo dichiarano con `quiz: true` nel manifesto.

## Il disegno si guarda grande

Toccando il disegno del soggetto si apre a tutto schermo (`.qz-zoom`), e si
chiude toccando ovunque: in 148 pixel una griglia a sei colonne diventa una
domanda sulla vista.

- **La lente è appesa al `body` con un `Teleport`**: dentro il pannello un
  `position: fixed` si ritaglia sul primo antenato con una `transform`, e i
  fogli del sotterraneo ne hanno una.
- **Si ingrandisce solo il soggetto**, mai le risposte: lì il tocco *è* la
  risposta.
- **Si chiude sul `click`**, non sul `pointerup`, se no il click fantasma
  atterra sul tasto sotto e risponde da solo.

Il gemello imperativo non ha la lente: lì guarda un grande, su uno schermo
grande.

## Provati e scartati

- **Catene alimentari**: proposte, non convincono.
- **Classi degli animali** (mammifero, uccello… dagli indizi): scritte e
  tolte, non convincono (`git log -- src/quiz/moduli/classi-animali.js`).
- **Spaziale** (poliomini girati): lo fa già `geometria` grado 4, meglio.
- **Percorsi**: li copre `griglia`.
- **Memoria** (figure coperte dopo due secondi): vuole due tempi, non entra
  nella forma di una domanda; semmai è una meccanica di gioco.
- **Lo scienziato** (`poc/la-regola.html`): è un gioco a più mosse, va in
  `src/giochi/`, non qui.
- **`poc/compagno.html`**: è un tamagotchi che si nutre di ripasso, non un
  quiz.
