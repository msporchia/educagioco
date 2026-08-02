# I giochi di Leonardo e Melody

## Per giocare
Apri **`giochi.html`** con doppio click. È un file solo, funziona offline su
telefono, tablet e computer. Non serve installare niente.

I dati (monete, oggetti, progressi) restano nel browser del dispositivo su cui
si gioca. Aprendolo dentro un'anteprima o un iframe il salvataggio non è
possibile: il gioco lo rileva e lo dice, continuando a funzionare per la sessione.

## Per sviluppare
```
npm install
npm run dev      # server di sviluppo con ricarica automatica
npm run build    # produce dist/index.html, il file unico da distribuire
```

## Com'è fatto
```
src/
  store/storage.js   archivio a tre livelli: IndexedDB → localStorage → memoria
  store/srs.js       motore di apprendimento: forza, decadimento, distanza minima
  store/profile.js   profilo condiviso: monete, cameretta, stato di ogni elemento
  data/words.js      188 vocaboli inglesi con emoji
  data/shop.js       30 oggetti della cameretta
  data/ops.js        operazioni in colonna: riporti, prestiti, divisione
  components/ColumnOp.vue   tastierino e caselle, cifra per cifra
  views/             HomeView, RoomView, EnglishGame, MathGame, TowerDefense
  audio.js           suoni sintetizzati, nessun file audio
```

### Il motore di apprendimento
Un "elemento" è indifferentemente una tabellina (`math:7x8`) o un vocabolo
(`en:butterfly`). Ogni elemento ha una **forza** da 0 a 6; l'intervallo di
ripasso raddoppia a ogni livello (10 minuti → 3 settimane). Superata la
scadenza la forza *efficace* cala da sola col passare dei giorni: quello che
non si vede da troppo tempo torna a farsi vedere, senza bisogno di sbagliarlo.

Dentro una sessione nessun elemento può ricomparire prima di 6 altri elementi.

### Difendi il Castello
Schermo diviso: sopra i nemici avanzano lungo il percorso, sotto si sceglie la
torre e si risolve l'operazione che la costruisce.

| torre | operazione | effetto |
|---|---|---|
| 🏹 Arciere | addizione | colpi rapidi su un nemico |
| ❄️ Ghiaccio | sottrazione | non fa danno, congela chi passa vicino |
| 🔮 Magica | moltiplicazione | onda che colpisce a zona |
| 💣 Bombe | divisione | colpo lento e devastante |

Si scrivono **solo le cifre del risultato**, da destra: i riporti si tengono a
mente, perché scriverli sarebbe una stampella. Unica eccezione la
moltiplicazione con moltiplicatore a due cifre, dove i due prodotti parziali
sono passaggi veri del procedimento: si scrive `a × unità`, poi `a × decine`
incolonnato uno spazio più a sinistra, e infine la somma delle due righe.

Senza errori la torre nasce potenziata (★): raggio e danno maggiorati.
La taglia dei numeri sale e scende con la forza dell'abilità, e la torre
magica pesca il moltiplicatore fra le tabelline che gli asteroidi hanno
trovato deboli.

### Verifiche
`node test.mjs` prova l'applicazione nel browser (navigazione, gioco, monete
condivise, riordino della cameretta, persistenza, profili separati).
`node srs-test.mjs` prova il motore: salita della forza, decadimento nel tempo,
distanza minima sotto stress.
`node td-test.mjs` genera 16 000 operazioni e verifica che ogni colonna torni,
poi gioca una partita costruendo una torre per tipo.
