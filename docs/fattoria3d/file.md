# Dove sta cosa in `src/giochi/fattoria3d/`

```
gioco.js             il manifesto: in prova, tappe 0, il blocco albo (nove traguardi), il riassunto in home
Gioco.vue            il coordinatore: monete vere, contatori (anche `fattoria3dUova`/`…Latte`), salvataggio, le finestre
stile.css            tutto sotto il prefisso .f3-
stile-vicini.css    la mappa, il viaggio, la visita (`.f3-vic-`)
stile-guardaroba.css il foglio del guardaroba (`.f3-gua-`)
stile-macchina.css  il foglio di una macchina (`.fm-`): fila, pronti, carte, fantasma; i colori del tema restano in stile.css
visite.js            il filo fra `Gioco.vue` e le visite (`usaVisite`): mappa, viaggio, la scena a richiesta, cassa e mercato
dati/
  mondo.js           le coordinate (lotti `a_b` qualunque, chiavi di cella, id salvati), i 42 lotti storici, il quadrato di partenza, i due edifici di scena, le strade di serie
  lotti.js           `generaLotto(a, b, { vecchio })`: bioma, acqua, spiaggia, molo, alberi e sassi di un lotto (puro); `vecchio` per i lotti di un salvataggio di prima ([geografia-e-pesca.md](geografia-e-pesca.md))
  biomi.js           prato / bosco / laghetto e lo stagno ([laghi.md](laghi.md)), il mare a ovest, la costa e la spiaggia, i laghi grandi a est (`eMare`, `eSpiaggia`, `eLago`, `tipoAcqua`: funzioni della cella), `biomaVecchio`; semi.js: il caso del mondo
  pesca.js           i numeri della pesca (`PESCA`: 12 s, riposo 60 s, raggio 6), `resaDellaPesca`, il pesce (`PESCI`, in `PRODOTTI_ANIMALI`)
  carte.js           le carte del menu «Costruisci qui»: `carteDi(categoria, stato)`, `schedeDi`, `DISEGNI` (carta → pezzo dell'atlante 2D, ormai solo come dato: la carta mostra il modello 3D), `STRUMENTI`, i guasti
  catalogo.js        i pezzi (ora con la `categoria` di ogni pezzo e edificio, `CATEGORIE`; ora anche passerella, ponte e tavolo; i primi due `calpestabile`, con `alzato`: regole.md) — dieci all'inizio:  (campo, recinto, pollaio, stalla, bancarella, bacheca, aiuola, panchina, fontana, pozzo, spaventapasseri) e i dodici
                     edifici unici (fienile, pasticceria = il Pastificio, mongolfiera, mulino, panificio, caseificio, conserviera = la Cucina, gelateria, telaio, zuccherificio, sartoria, tintoria: gli id sono quelli dei salvataggi): prezzi, misure, `liv`, `slot`
  colture.js         le sedici colture (con l'erba medica, `mangime: true`): nome, emoji, `pezzo` (la faccia nell'atlante 2D), tempo, `liv`
  mangime.js         le tre ricette del fienile (foraggio di carote, becchime, foraggio d'erba), `prodottoDi`, `ricetteDelMangime`, `lavoroDelMangime` e `attesaDelMangime` (i tempi del mangime per ordini e scala): [mangime-e-catena.md](mangime-e-catena.md)
  ricette.js         le macchine e le loro ricette, quelle della 2D (`MACCHINE`, `RICETTE` a elenco unico con `dove`; `pezzo`/`aspetta`; `merceDi`, `pezzoDi`; `MERCI_VECCHIE`/`nuovoId` per i salvataggi di prima: merci-e-ricette.md), `LAVORAZIONE`/`dentroDi` (il nome della sezione dei posti di ogni macchina)
  posti.js           i posti delle macchine: uno di partenza, fino a sei, 🪙20·40·80·160·320 come la fila della 2D (`PREZZI_DEI_POSTI`, `prezzoDelPosto`, `postiInForma`, `guastiDeiPosti`; regole.md «Le macchine»)
  animali.js         pollaio e stalla: bestie, tempi, capienza e prezzo di ogni bestia in più, cosa mangiano (il mangime del fienile, non i raccolti); `CORTILE` (anche il recinto) e `prezzoDellaBestia`; `uova` e `latte` (PRODOTTI_ANIMALI), i guasti
  abiti.js           il guardaroba: i capi, i livelli dei pezzi speciali, la persona dal profilo, l'abito di serie e `normalizzaAbito`, `nomeDelContadino` ([guardaroba.md](guardaroba.md))
  compagni.js        Watson e i gatti: i dati, il livello a cui arrivano, le scelte pure (meta, cosa fare, le sequenze di «Quando ci premi»: richiamo, feste di Watson, risposte dei gatti, incontro), `ASPETTO_ERO` ([compagni.md](compagni.md))
  livelli.js         le soglie, `roba(liv)`, i nomi dei livelli, i guasti dei livelli
  ordini.js          il banco: i clienti, i tempi, il premio (tetto 🪙6/min), `chiedibili(livello)`, i guasti
  regole.js          i costi (anche l'albero 🪙 3 e il sasso 🪙 1, il prezzo dei lotti), le pecore
  mongolfiera.js     la nave: file, casse, pezzi, bonus, il riposo, la sorpresa (`SORPRESE`), `merceDaCassa`, `premioDellaCassa`, i guasti col tetto ([mongolfiera.md](mongolfiera.md))
  alberi.js          gli alberi storici (sempre gli stessi: un caso col seme) e quelli dei lotti nuovi
  ostacoli.js        i sassi e i cespugli di un lotto (2–5 sul prato; l'id è la cella), i guasti
  qualita.js         i preset di qualità, le scale, le ombre
  degrado.js         il degrado adattivo (senza three): fps → livello → risoluzione e cadenza dell'ombra
  vicini.js          i villaggi dei vicini e il formato di una fattoria visitabile (snapshot, `normalizzaFattoriaVisitabile`, i numeri di prezzi, premi e doni), i guasti ([vicini.md](vicini.md))
motore/
  fattoria3d.js      le regole: la classe Fattoria3d (borsa e orologio da fuori)
  mongolfiera.js     la nave: `nuovaStiva`, `stivaInForma`, `aggiornaMongolfiera` (atterra il carico, torna dal viaggio), `caricaLaCassa`, `partiLaMongolfiera`, `scegliLaSorpresa`, `vistaDellaMongolfiera`
  ordini.js          gli ordini: `nuovoOrdine` (puro, col caso da fuori) e `ordineInForma`; i posti crescono col livello (`POSTI(livello)` in `dati/ordini.js`)
  stato.js           lo stato salvato (esperienza, `posseduti` = edificio in mappa; gli edifici sono anche `cose`, il v8 si migra al posto di prima: [edifici-liberi.md](edifici-liberi.md); `macchine`, `ordini`, `bestie` di pollaio e stalla; la versione sta in `VERSIONE_STATO`), `statoIniziale()` e `normalizza()` (un salvataggio rotto si rimette in forma; un v6 passa dagli id vecchi ai nuovi, v7)
  tipo.js            la fattoria «tipo» (`fattoriaTipo(livello)`, borsa infinita, deterministica): il cheat `#fattoria3d-tipo=N` ([comandi](../core/comandi.md)); test `unita/fattoria3d-tipo`
  percorso.js        Dijkstra sulla griglia, le strade costano meno
  pesca.js           la pesca: `provaPesca`, `lanciaLenza`, `ritiraPesca`, `bancoDi`, `lenzeInAcqua`, `riesaminaPesca` (funzioni pure sulla `Fattoria3d`); `stato.pesca` per lotto d'acqua
  vicini.js          i vicini: la classe `Vicini` (entra, aiuta la cassa, compra, vende), `normalizzaVicini` (lo stato a parte), `motoreDiVisita` (la scena di sola lettura da uno snapshot), `esportaLaMiaFattoria`
scena3d/             il disegno (vedi scena.md); `facce.js` la faccia di una merce su una tela per i pezzi di HTML sopra la scena (il «+1» di `fx.volo`); `visita.js` è la visita a un vicino, una sottoclasse di `Mondo3d` su un motore di sola lettura ([vicini.md](vicini.md)); `anteprime.js` e `anteprime-pura.js` le foto dei modelli per le carte (senza three: l'inquadratura e la cache; [scena.md](scena.md) «Le anteprime»); `modelli-colture.js` il campo e le sedici colture (ri-esportati da `modelli.js`); `compagni.js` e `modelli-compagni.js` per i compagni e il contadino ([compagni.md](compagni.md)); `detti.js` (senza three) traduce un rifiuto del motore in una riga, anche per la vista; `ottimizza.js` spegne l'ombra alle mesh piccole di un modello appena creato ([scena.md](scena.md) «Qualità e peso»); `fondi.js` fonde le mesh statiche di un modello per materiale; `cache-modelli.js` costruisce (e fonde) un modello una volta per tipo e poi consegna cloni che ne condividono geometrie e materiali; `bestie-puro.js` (senza three) i tre stadi di gallina, mucca e pecora come numeri (stato, progresso, profilo: [animali.md](animali.md) «I tre stadi»); `scaldo-puro.js` (senza three) è la coda del riscaldamento: i modelli che servono presto costruiti in tempo morto, un compito per fotogramma (tutto in «Qualità e peso»); `azioni.js` fa il gesto davanti a ogni cosa, pollaio e stalla compresi ([animali.md](animali.md))
  scena3d/modelli-passaggi.js   ponte, passerella e tavolo con le panche: presi dal Sotterraneo 3D e rifatti con i materiali della fattoria (scena.md)
  scena3d/modelli-acqua.js      lo stagno (3×3) e il laghetto (5×4) costruiti dal bambino, e i materiali dell'acqua (`materialeAcqua`, `materialeMare`, `uTAcqua`) che usa anche il terreno ([laghi.md](laghi.md))
  scena3d/modelli-pesca.js      il molo (3×1 e 1×3) e il porticciolo (4×3, la barca dondola); friggitoria e sushi bar stanno in `modelli-macchine.js` ([geografia-e-pesca.md](geografia-e-pesca.md))
  scena3d/pesci.js              i pesciolini: una `InstancedMesh` sola, tutta nello shader (`uTPesci`), nell'acqua dei laghi, del mare e degli stagni
  scena3d/pesca3d.js            il galleggiante (tre stadi: calma, attesa, «Abbocca!»), il filo dalla canna, il ritiro da sé se il contadino è lì
viste/
  Faccia.vue         la faccia di una merce (`k` la chiave, `n` il numerino): il pezzo dell'atlante 2D con `Provino.vue`, l'emoji come ripiego; la usano inventario, banco, macchina, semi, livelli, visita
  Hud.vue            il gettone del livello (⭐ N con la barra sottile, apre i livelli), il tasto «🎒 Inventario» (pallino se è entrata roba dall'ultima apertura) e, da livello 2, «🧺 Banco» col pallino degli ordini consegnabili. Niente liste di scorte sul prato
  Inventario.vue     il foglio delle scorte a schede (🌾 raccolti, 🧺 prodotti, 🧶 lana e altro): gettoni con faccia e numero, un tocco dice nome e a cosa serve; solo lettura, niente vendere. Il conto sta in `inventario-puro.js` (stile: `stile-inventario.css`)
  Guardaroba.vue     il foglio dell'abito ([guardaroba.md](guardaroba.md)): il ritratto 3D (anteprima `contadino:<abito>`), chi si è (la scelta del profilo, `SceltaAspetto`), le schede dei capi e i gettoni col lucchetto

  BarraAzioni.vue    libero / semina / raccogli / costruisci, i numeri
  CostruisciQui.vue  il foglio «Cosa costruiamo?» (si apre tenendo premuto su un posto libero): le schede per categoria e la griglia di carte con l'anteprima 3D del modello (`anteprima(tipo)`, emoji come segnaposto), il prezzo o «📦 ×N», le chiuse col lucchetto che tremano e dicono il livello ([scena.md](scena.md))
  BarraStrade.vue    il pennello delle strade: strada, gomma, «Fatto»
  SceltaSeme.vue     «Cosa semini?»: le sedici colture dai dati (la griglia scorre), quelle non arrivate in grigio col livello
  Macchina.vue       il foglio di una macchina (la sua, qualunque sia), come in Hay Day e nella 2D: l'insegna col suo colore (`[data-macchina]` in stile.css), i **posti della fila** col nome della macchina (`dentro`: «Nel forno», «Al telaio»…: libero, cuoce con barra e tempo, aspetta) seguiti dai **vani chiusi col prezzo** da comprare (`bloccati`, evento `compra`), la **pila dei pronti** con «Ritira tutto», le ricette come **carte** con la faccia del prodotto e il numero di quante se ne fanno con le scorte (ingredienti con ✓/✗ e `ha/serve`); le chiuse velate col lucchetto e il livello. Una carta si **trascina** su un posto o sulla fila, o si **tocca** e va in fila (vedi sotto). Stile in `stile-macchina.css`
  macchina-pura.js   il conto del foglio senza DOM: `quanteNePuoiFare`, `ordinaRicette`, `statoDelPosto`, `bersaglioSotto`, `gestoDelDito` (`unita/fattoria3d-macchina`)
  Bacheca.vue        il foglio «Gli ordini» a bacheca ([ordini.md](ordini.md)): i biglietti colorati sulla tavola (3–8, uno per posto), il dettaglio di quello scelto con le merci, il cestino e «Consegna», l'indicatore delle consegne; stile in `stile-bacheca.css`
  MerceBacheca.vue   una merce in un cerchio (`k`, `emoji`, `n`): provvisoria, stessa API di `Faccia.vue`
  Mongolfiera.vue    il foglio della mongolfiera ([mongolfiera.md](mongolfiera.md)): l'insegna col cielo e il pallone, la stiva con tre file di cassette di legno (la faccia, `ha/serve`, «Metti sulla mongolfiera»), i bonus, «Parti subito»; stile in `stile-mongolfiera.css`
  Banco.vue          il vecchio foglio del banco (tre posti con fumetto): non più agganciato, da togliere
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
| `[data-f3="apri-inventario"]`, `inventario-nuovo` (il pallino) | il tasto nell'HUD |
| `[data-f3="apri-guardaroba"]` | il tasto «👕» nell'HUD (si apre anche toccando il contadino fermo) |
| `[data-f3="guardaroba"]`, `[data-scheda-abito="cappello|maglia|pantalone|stivali|collo|capelli|pelle"]`, i gettoni `button[data-capo="<categoria>:<id>"]` (`aria-pressed`), `guardaroba-chi`, `guardaroba-riga`, `guardaroba-ritratto`; chi si è: `[data-aspetto="bambina|bimbo"]` | il foglio del guardaroba |
| `[data-f3="inventario"]`, `[data-scheda-inv="raccolti|prodotti|altro"]`, `inventario-riga`, `inventario-vuoto`; i gettoni `button[data-merce="<id>"]` con `data-n` | il foglio dell'inventario (le colture arrivate al livello, le vuote velate) |
| `[data-f3="semi"]`, `[data-seme="carota"]` | la scelta del seme |
| `[data-f3="costruisci-qui"]`, `[data-f3="costruisci-velo"]`, `[data-scheda="campi"]`, `[data-carta="campo"]` | il foglio «Costruisci qui» (si apre con `premuto` ~0,45 s su un posto libero, o col tasto 🏗️), il velo che si tocca per chiuderlo, una scheda (`campi`, `animali`, `edifici`, `decori`, `passaggi`; `.acceso`) e una carta (anche `strada` e `gomma`; `data-cat` la scheda) |
| `[data-f3="costruisci-msg"]`, `[data-carta].trema` | la riga sotto le carte (livello che manca, «Servono 🪙 N») e la carta chiusa che trema |
| `[data-f3="zona-via"]` | la fascia in basso mentre un pezzo è sollevato o il fantasma aspetta un posto (toccarla annulla il fantasma) |
| `[data-f3="barra-strade"]`, `[data-strumento="strada"]`, `[data-f3="strade-fatto"]` | la barra del pennello |
| `[data-f3="dialogo"]`, `[data-scelta="0"]` | la conferma (solo i lotti di terreno); la prima scelta è «Compra · 🪙 N» |
| `[data-f3="costruisci-esclama"]`, `[data-f3="scheda-esclama"]`, `[data-f3="carta-esclama"]` | il «!» pulsante: un edificio aperto dal livello e non costruito (sul tasto 🏗️, sulla linguetta Edifici, sulla carta); `[data-f3="ordine-esclama"]`/`[data-f3="ordine-serve"]` nel banco: [edifici-liberi.md](edifici-liberi.md) |
| `[data-f3="cartello-bestie"]` (`data-pezzo`: recinto, pollaio, stalla), `[data-f3="compra-bestia"]` (`aria-disabled`) | il cartello sopra recinto, pollaio e stalla e il suo «＋ 🪙 N»; si tocca con `dispatchEvent('click')` perché può stare fuori dallo schermo |
| `[data-f3="macchina"][data-macchina="<tipo>"]`, `[data-ricetta="pane"]`, `[data-f3="ritira"]` | il foglio di una macchina; la carta di ogni ricetta porta `[data-puoi="true|false"]` e `[data-n]` (quante se ne fanno); una carta spenta resta toccabile e dice perché in `[data-f3="macchina-msg"]` |
| `[data-f3="posto"][data-posto="<n>"][data-stato="libero|cuoce|aspetta"]`, `[data-f3="pronti"]`, `[data-pronto="<k>"]`, `[data-ing="<k>"]` | un posto della fila, la pila dei pronti (ogni pronto, toccato, ritira), l'ingrediente sulla carta |
| `[data-f3="trascina-fantasma"]` | la faccia della carta in mano, solo mentre si trascina |
| `[data-f3="pasticceria"]` | il corpo del menu, solo se la macchina è la pasticceria (il Pastificio; un elemento ha un solo `data-f3`) |
| `[data-f3="mongolfiera"]` (`data-stato`), `[data-f3="mongolfiera-cassa"]` (`data-fila`, `data-cassa`, `data-piena`, `data-pronta`), `[data-f3="mongolfiera-carica"]` (`data-puoi`), `[data-f3="mongolfiera-parti"]`, `-piene`, `-tutto`, `-fila-bonus`, `-msg`, `-viaggio`, `-chiusa` | il foglio della mongolfiera ([mongolfiera.md](mongolfiera.md)) |
| `window.__fattoria3d.motore.provaPesca(i, j)`, `.lenze()`, `.bancoDi(lotto)`, `mondo.azioni.pescaSu(i, j)`, `mondo.pesca3d`, `mondo.terreno.pesci.mesh` | la pesca senza dito: cosa succederebbe, le lenze in acqua, lo stato di un banco, il gesto, i galleggianti, i pesciolini; il tempo si sposta con `motore.ora = () => Date.now() + N` |
| `[data-merce="<id>"]` | la faccia di una merce (`viste/Faccia.vue`; anche il gettone dell'inventario ha lo stesso attributo: per il gettone `button[data-merce]`): inventario, banco, macchina, scelta del seme, livelli, cassa e mercato; il volo «+1» sopra la scena |
| `[data-f3="livello"]`, `[data-f3="livello-nuovo"]`, `[data-f3="livelli"]`, `[data-f3="avviso-livello"]` | il gettone, il suo pallino, il foglio dei livelli, l'avviso che compare a ogni salita |
| `[data-carta].bloccata`, `[data-seme].bloccato`, `[data-f3="semi-msg"]` | una carta o una coltura non ancora arrivata, e la riga che dice il livello (la scelta dei semi) |
| `[data-f3="apri-opzioni"]`, `[data-f3="opzioni"]`, `[data-preset="basso"]` | le opzioni |
| `[data-f3="centra"]` | «⌖ Torna al contadino» |
| `[data-chiudi]` | la ✕ di ogni foglio |
| `[data-senza-3d]`, `[data-azione="esci-3d"]` | il messaggio senza WebGL e il suo tasto |
| `window.__fattoria3d` | `{ motore, mondo, q }` |

## Il foglio della macchina: il gesto

La 2D non ha un foglio per le macchine (i gettoni stanno sul prato, [../fattoria/come-si-tocca.md](../fattoria/come-si-tocca.md)): qui il foglio c'è,
ma il gesto è lo stesso, «si porta la ricetta dove serve».

- **Tocco = in fila** (una ricetta, subito: è la scorciatoia); **trascinata = su un posto o sulla fila**. Lasciata sull'insegna, sulla fila, sui pronti o su un
  posto (anche occupato: il motore la mette nel primo libero) va in fila; **lasciata altrove non succede niente** (niente ingredienti persi, il fantasma sparisce).
  I posti liberi si accendono mentre si trascina e quello sotto il dito si alza. Un no (posti occupati, mancano ingredienti, livello, monete per il posto) lo dice `macchina-msg`. Un tocco su un vano chiuso compra il posto (`compraPosto`), non è un bersaglio di trascinata.
- **Il bersaglio è il punto sotto il dito**, non il fantasma, che sta 40 px sopra perché il dito non lo copra.
- **Soglia ~16 px col dito, 6 col mouse** (`SCARTO_DITO`/`SCARTO_MOUSE` di `fattoria/scena/dito.js`, [../core/il-dito.md](../core/il-dito.md)). Le carte hanno
  `touch-action: none` (se no il browser si prende il dito e manda `pointercancel`) e lo scorrimento del foglio lo fa il codice: **su e giù svelto scorre**
  (solo se il foglio scorre davvero), **di lato, o tenuto fermo 160 ms e poi mosso in qualunque verso, trascina**. Se il foglio non scorre, ogni verso trascina:
  la fila sta *sopra* le carte e un bambino trascina in su. Una carta chiusa non si porta in giro.
- **Niente `click` sulla carta**: agisce al `pointerup` (un `click` mandato dopo l'ultimo tocco sulla scena non può metterla in fila); da tastiera Invio e spazio.
- **Provato: la lista di schede con «＋ Prepara»** (il foglio di prima): a ogni tocco un tasto grande, niente fila a vista, nessuno vedeva *dove* andava la ricetta.
- **Non c'è «accelera»**: il motore non ha un modo di anticipare una cottura. **Il ritiro è tutto insieme** (`ritiraDa`): toccare un solo pronto li prende tutti.
