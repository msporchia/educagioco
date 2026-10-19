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
  regole.js          i costi, la legna, le pecore, la mongolfiera
  alberi.js          gli alberi (sempre gli stessi: un caso col seme)
  qualita.js         i preset di qualità, le scale, le ombre
motore/
  fattoria3d.js      le regole: la classe Fattoria3d (borsa e orologio da fuori)
  stato.js           lo stato salvato (versione 2: esperienza, `posseduti`, `macchine`), `statoIniziale()` e `normalizza()` (un salvataggio rotto si rimette in forma)
  percorso.js        Dijkstra sulla griglia, le strade costano meno
scena3d/             il disegno (vedi scena.md)
viste/
  Hud.vue            le scorte in alto
  BarraAzioni.vue    libero / semina / raccogli / costruisci, i numeri, «Tutti»
  Vassoio.vue        la barra del costruire: le carte, gli strumenti, la vista, l'annulla
  SceltaSeme.vue     «Cosa semini?»
  Pasticceria.vue    il menu della pasticceria
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
| `[data-f3="pasticceria"]`, `[data-ricetta="pane"]`, `[data-f3="ritira"]` | il menu della pasticceria |
| `[data-f3="apri-opzioni"]`, `[data-f3="opzioni"]`, `[data-preset="basso"]` | le opzioni |
| `[data-f3="centra"]` | «⌖ Torna all'eroe» |
| `[data-chiudi]` | la ✕ di ogni foglio |
| `[data-senza-3d]`, `[data-azione="esci-3d"]` | il messaggio senza WebGL e il suo tasto |
| `window.__fattoria3d` | `{ motore, mondo, q }` |
