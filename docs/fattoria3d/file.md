# Dove sta cosa in `src/giochi/fattoria3d/`

```
gioco.js             il manifesto: in prova, tappe 0, il blocco albo (cinque traguardi), il riassunto in home
Gioco.vue            il coordinatore: monete vere, contatori (anche `fattoria3dUova`/`…Latte`), salvataggio, le finestre
stile.css            tutto sotto il prefisso .f3-
stile-vicini.css    la mappa, il viaggio, la visita (`.f3-vic-`)
visite.js            il filo fra `Gioco.vue` e le visite (`usaVisite`): mappa, viaggio, la scena a richiesta, cassa e mercato
dati/
  mondo.js           la griglia, i 42 lotti, il quadrato di partenza, i due edifici di scena, le strade di serie, i lotti di un posto
  catalogo.js        i pezzi (ora anche passerella, ponte e tavolo; i primi due `calpestabile`, con `alzato`: regole.md) — dieci all'inizio:  (campo, recinto, pollaio, stalla, bancarella, bacheca, aiuola, panchina, fontana, pozzo, spaventapasseri) e i sette
                     edifici unici (pasticceria, mongolfiera, mulino, panificio, caseificio, conserviera, gelateria): prezzi, misure, `liv`, `slot`
  colture.js         le dieci colture: nome, emoji, tempo, `liv`
  ricette.js         le macchine e le loro ricette (`MACCHINE`, `RICETTE` a elenco unico con `dove`), i posti del forno
  animali.js         pollaio e stalla: bestie, tempi, capienza e prezzo di ogni bestia in più, cosa mangiano; `CORTILE` (anche il recinto) e `prezzoDellaBestia`; `uova` e `latte` (PRODOTTI_ANIMALI), i guasti
  compagni.js        Watson e i gatti: i dati, il livello a cui arrivano, le scelte pure (meta, cosa fare), `ASPETTO_ERO` ([compagni.md](compagni.md))
  livelli.js         le soglie, `roba(liv)`, i nomi dei livelli, i guasti dei livelli
  ordini.js          il banco: i clienti, i tempi, il premio (tetto 🪙6/min), `chiedibili(livello)`, i guasti
  regole.js          i costi (anche l'albero 🪙 3 e il sasso 🪙 1), le pecore, la mongolfiera
  alberi.js          gli alberi (sempre gli stessi: un caso col seme)
  ostacoli.js        i sassi e i cespugli (2–5 per lotto, sempre gli stessi; l'id è la cella), i guasti
  qualita.js         i preset di qualità, le scale, le ombre
  vicini.js          i villaggi dei vicini e il formato di una fattoria visitabile (snapshot, `normalizzaFattoriaVisitabile`, i numeri di prezzi, premi e doni), i guasti ([vicini.md](vicini.md))
motore/
  fattoria3d.js      le regole: la classe Fattoria3d (borsa e orologio da fuori)
  ordini.js          gli ordini: `nuovoOrdine` (puro, col caso da fuori) e `ordineInForma`
  stato.js           lo stato salvato (esperienza, `posseduti`, `macchine`, `ordini`, `bestie` di pollaio e stalla; la versione sta in `VERSIONE_STATO`), `statoIniziale()` e `normalizza()` (un salvataggio rotto si rimette in forma)
  percorso.js        Dijkstra sulla griglia, le strade costano meno
  vicini.js          i vicini: la classe `Vicini` (entra, aiuta la cassa, compra, vende), `normalizzaVicini` (lo stato a parte), `motoreDiVisita` (la scena di sola lettura da uno snapshot), `esportaLaMiaFattoria`
scena3d/             il disegno (vedi scena.md); `visita.js` è la visita a un vicino, una sottoclasse di `Mondo3d` su un motore di sola lettura ([vicini.md](vicini.md)); `modelli-colture.js` il campo e le dieci colture (ri-esportati da `modelli.js`); `compagni.js` e `modelli-compagni.js` per i compagni e il contadino ([compagni.md](compagni.md)); `detti.js` (senza three) traduce un rifiuto del motore in una riga, anche per la vista; `azioni.js` fa il gesto davanti a ogni cosa, pollaio e stalla compresi ([animali.md](animali.md))
  scena3d/modelli-passaggi.js   ponte, passerella e tavolo con le panche: presi dal Sotterraneo 3D e rifatti con i materiali della fattoria (scena.md)
viste/
  Hud.vue            il gettone del livello (⭐ N con la barra sottile, apre i livelli) e le scorte in alto; da livello 2 il tasto «🧺 Banco» col pallino degli ordini consegnabili
  BarraAzioni.vue    libero / semina / raccogli / costruisci, i numeri, «Tutti»
  Vassoio.vue        la barra del costruire: le carte (dai `PEZZI`, quelle non arrivate in grigio e non trascinabili; ogni carta si trascina anche se non è pagata: paga il rilascio), gli strumenti, la vista
  SceltaSeme.vue     «Cosa semini?»: le dieci colture dai dati, quelle non arrivate in grigio col livello
  Macchina.vue       il menu di una macchina (la sua, qualunque sia): l'insegna col suo colore (`[data-macchina]` in stile.css), il forno a tre vani con barra e timer, i pronti, le ricette come schede con i gettoni tondi degli ingredienti; le chiuse velate col lucchetto e il livello
  Banco.vue          il foglio «🧺 Il banco»: tre posti, ognuno col ritratto del cliente e un fumetto con i gettoni `emoji ×n` (`ha/n`), il premio in ⭐, «Consegna» e «Cambia», il conto alla rovescia di un posto in riposo
  Livelli.vue        il foglio «Livello N»: la scala, con la scatola aperta di ciò che è arrivato e quella chiusa (in grigio, col lucchetto) di ciò che arriva dopo, quanto manca
  Dialogo.vue        la conferma d'acquisto (non più per le bestie)
  Opzioni.vue        il pannello ⚙
  Mappa.vue          la mappa del trattore: i villaggi in fila lungo una strada, i grigi col livello
  Visita.vue         una visita: la testata con «Torna a casa», i tasti, la storia, i fogli della cassa e del mercato, il viaggio del trattore
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
| `[data-f3="dialogo"]`, `[data-scelta="0"]` | la conferma (solo lotti e edifici unici); la prima scelta è «Compra · 🪙 N» |
| `[data-f3="cartello-bestie"]` (`data-n`, `data-max`), `[data-f3="compra-bestia"]` (`aria-disabled`) | il cartello sopra recinto, pollaio e stalla e il suo «＋ 🪙 N»; si tocca con `dispatchEvent('click')` perché può stare fuori dallo schermo |
| `[data-f3="macchina"][data-macchina="<tipo>"]`, `[data-ricetta="pane"]`, `[data-f3="ritira"]` | il menu di una macchina; `[data-puoi="true|false"]` sulla ricetta (un tasto spento resta toccabile: dice perché in `[data-f3="macchina-msg"]`) |
| `[data-f3="pasticceria"]` | il corpo del menu, solo se la macchina è la pasticceria (un elemento ha un solo `data-f3`) |
| `[data-f3="livello"]`, `[data-f3="livello-nuovo"]`, `[data-f3="livelli"]`, `[data-f3="avviso-livello"]` | il gettone, il suo pallino, il foglio dei livelli, l'avviso che compare a ogni salita |
| `[data-carta].bloccata`, `[data-seme].bloccato`, `[data-f3="semi-msg"]` | una carta o una coltura non ancora arrivata, e la riga che dice il livello |
| `[data-f3="apri-opzioni"]`, `[data-f3="opzioni"]`, `[data-preset="basso"]` | le opzioni |
| `[data-f3="centra"]` | «⌖ Torna all'eroe» |
| `[data-chiudi]` | la ✕ di ogni foglio |
| `[data-senza-3d]`, `[data-azione="esci-3d"]` | il messaggio senza WebGL e il suo tasto |
| `window.__fattoria3d` | `{ motore, mondo, q }` |
