# Dove sta cosa in `src/giochi/fattoria3d/`

```
gioco.js             il manifesto: in prova, tappe 0, il blocco albo (cinque traguardi), il riassunto in home
Gioco.vue            il coordinatore: monete vere, contatori, salvataggio, le finestre
stile.css            tutto sotto il prefisso .f3-
dati/
  mondo.js           la griglia, i 42 lotti, il quadrato di partenza, i due edifici di scena, le strade di serie, i lotti di un posto
  catalogo.js        gli otto pezzi (campo, recinto, bancarella, aiuola, panchina, fontana, pozzo, spaventapasseri) e i sei
                     edifici unici (pasticceria, mongolfiera, mulino, panificio, conserviera, gelateria): prezzi, misure, `liv`, `slot`
  colture.js         le dieci colture: nome, emoji, tempo, `liv`
  ricette.js         le macchine e le loro ricette (`MACCHINE`, `RICETTE` a elenco unico con `dove`), i posti del forno
  livelli.js         le soglie, `roba(liv)`, i nomi dei livelli, i guasti dei livelli
  ordini.js          il banco: i clienti, i tempi, il premio (tetto 🪙6/min), `chiedibili(livello)`, i guasti
  regole.js          i costi, la legna, le pecore, la mongolfiera
  alberi.js          gli alberi (sempre gli stessi: un caso col seme)
  qualita.js         i preset di qualità, le scale, le ombre
motore/
  fattoria3d.js      le regole: la classe Fattoria3d (borsa e orologio da fuori)
  ordini.js          gli ordini: `nuovoOrdine` (puro, col caso da fuori) e `ordineInForma`
  stato.js           lo stato salvato (versione 3: esperienza, `posseduti`, `macchine`, `ordini`), `statoIniziale()` e `normalizza()` (un salvataggio rotto si rimette in forma)
  percorso.js        Dijkstra sulla griglia, le strade costano meno
scena3d/             il disegno (vedi scena.md); `detti.js` (senza three) traduce un rifiuto del motore in una riga, anche per la vista
viste/
  Hud.vue            il gettone del livello (⭐ N con la barra sottile, apre i livelli) e le scorte in alto
  BarraAzioni.vue    libero / semina / raccogli / costruisci, i numeri, «Tutti»
  Vassoio.vue        la barra del costruire: le carte (dai `PEZZI`, quelle non arrivate in grigio e non trascinabili), gli strumenti, la vista, l'annulla
  SceltaSeme.vue     «Cosa semini?»: le dieci colture dai dati, quelle non arrivate in grigio col livello
  Macchina.vue       il menu di una macchina (la sua, qualunque sia): forno a tre posti, pronti, tutte le ricette, le chiuse col livello
  Livelli.vue        il foglio «⭐ Livello N»: cosa è arrivato, cosa arriva dopo (in grigio, col lucchetto), quanto manca
  Dialogo.vue        la conferma d'acquisto
  Opzioni.vue        il pannello ⚙
```

Registrazione: `src/giochi/indice.js` (il manifesto, in coda) e `src/giochi/schermate.js` (il `.vue`, caricato a richiesta).
`vite.config.js` sa del file del disegno (`scena3d/mondo3d.js`) per il sito spezzato.

## Nei test

`[data-f3="…"]` e qualche altro bersaglio, che i test (`integrazione/fattoria3d`) leggono:

| bersaglio | cosa |
|---|---|
| `[data-f3="campo"] canvas` | il contenitore e la tela |
| `[data-f3="az-libero|az-semina|az-raccogli|az-costruisci"]` | i tasti delle azioni (`.acceso` se armato); `.f3-n` è il numero rosso |
| `[data-f3="tutti"]` | «▶ Tutti», solo con semina o raccogli armati |
| `[data-f3="scorte|prodotti|lana"]` | il HUD |
| `[data-f3="semi"]`, `[data-seme="carota"]` | la scelta del seme |
| `[data-f3="vassoio"]`, `[data-carta="campo"]`, `[data-vista="vicino"]` | la barra del costruire, le carte, la vista |
| `[data-f3="annulla"]` | «↶ Annulla» |
| `[data-f3="dialogo"]`, `[data-scelta="0"]` | la conferma; la prima scelta è «Compra» |
| `[data-f3="macchina"][data-macchina="<tipo>"]`, `[data-ricetta="pane"]`, `[data-f3="ritira"]` | il menu di una macchina; `[data-puoi="true|false"]` sulla ricetta (un tasto spento resta toccabile: dice perché in `[data-f3="macchina-msg"]`) |
| `[data-f3="pasticceria"]` | il corpo del menu, solo se la macchina è la pasticceria (un elemento ha un solo `data-f3`) |
| `[data-f3="livello"]`, `[data-f3="livello-nuovo"]`, `[data-f3="livelli"]`, `[data-f3="avviso-livello"]` | il gettone, il suo pallino, il foglio dei livelli, l'avviso che compare a ogni salita |
| `[data-carta].bloccata`, `[data-seme].bloccato`, `[data-f3="semi-msg"]` | una carta o una coltura non ancora arrivata, e la riga che dice il livello |
| `[data-f3="apri-opzioni"]`, `[data-f3="opzioni"]`, `[data-preset="basso"]` | le opzioni |
| `[data-f3="centra"]` | «⌖ Torna all'eroe» |
| `[data-chiudi]` | la ✕ di ogni foglio |
| `[data-senza-3d]`, `[data-azione="esci-3d"]` | il messaggio senza WebGL e il suo tasto |
| `window.__fattoria3d` | `{ motore, mondo, q }` |
