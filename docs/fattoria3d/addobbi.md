# Gli addobbi delle bestie

Le bestie si vestono come nella fattoria 2D (i dati in `da2d/dati/addobbi.js`): un cappello, gli occhiali,
qualcosa al collo e sulla schiena, che **si vede in scena** mentre la bestia gira: un vestito che si guarda solo aprendo una scheda non lo mette nessuno. Vale per le bestie comprate e per i compagni gratis
(Watson, Sherlock, Irene, Pepe). Codice: `dati/addobbi.js` (i dati), `motore/cura.js` (`vesti`, `spoglia`, `vestiarioDi`),
`scena3d/modelli-addobbi.js` (i modelli e gli agganci), `viste/Bestia.vue` (la sezione «🎩 Vestilo»).

## Le regole (quelle della 2D)

- **Gli stessi dodici della 2D**, con gli stessi prezzi (🪙6–24, la fascia «una cosetta», uno-quattro minuti di esercizi: un cappello che costasse quanto
  un pollaio metterebbe una decorazione in concorrenza con la catena) e gli stessi agganci: fiorellino, cappellino, cilindro,
  coroncina e cappello da strega in testa; occhialini e occhiali da sole sul muso; fiocco, sciarpa e campanella al collo; mantellina e
  zainetto sulla schiena. Nella 2D gli ultimi cinque erano sospesi perché un'emoji non sta su una bestia a quattro zampe: **in 3D sono
  modelli, e sono tutti in vendita**.
- **Non tutti portano tutto**: la campanella è dei gatti (`per`), il pappagallo non ha la schiena (ha le ali).
- **Il cappello da strega si compra solo a Halloween**; comprato resta, e si rimette quando si vuole.
- **Comprare è mettere**: nel foglio il tasto ha il prezzo; toccato, l'addobbo si compra e va addosso in un gesto. **Si compra una volta e
  non si consuma**: toccare quello che porta lo toglie e lo rimette nel **cassetto** (`stato.addobbi`), da dove va gratis a un'altra
  bestia. **Un aggancio tiene una cosa sola**: un secondo cappello cambia il primo, che torna nel cassetto.
- La spesa conta come esperienza, come ogni acquisto; niente monete indietro.
- Il traguardo **«Che eleganza»** (🎩, 1/4/8 addobbi addosso, un primato come nella 2D: `fattoria3dVestiti`).

## Gli agganci

Ogni addobbo è disegnato in codice per una testa di raggio ~0,15, con l'origine dove tocca la bestia. `AGGANCI` dice, per ogni forma
(`cane` = Watson, `beagle`, `gatto`, `coniglio`, `pappagallo`), su quale perno va (`testa` o `corpo`, così segue le pose: annusa, si
rotola, dorme), dove e con che scala. Le misure sono lette dai volumi dei corpi; provato a misurare la scatola della testa: le orecchie del
gatto e la frangia di Watson la allungano, e il cappello finiva per aria. Si guardano tutti nel catalogo 3D (`npm run catalogo3d:scheda --
--gioco fattoria --q vestita`).

## Salvataggi

`stato.addobbi` (il cassetto, `{ id: quanti }`) e `stato.casa[<bestia>].addobbi` (`{ aggancio: id }`): letti da `normalizza`, un id che non
esiste o sull'aggancio sbagliato si butta. Per questo **un addobbo non si toglie dall'elenco** (`da2d/dati/addobbi.js`, da cui `dati/addobbi.js`
prende i suoi): chi l'ha comprato lo perderebbe al primo caricamento. La conversione dalla 2D porta il guardaroba nel cassetto e gli addobbi addosso alle bestie (se
le stanno, se no nel cassetto); chi era stato convertito prima li riceve dal «da regalare» (`MIGRAZIONE` 3, [parita/migrazione.md](parita/migrazione.md)).

## Nei test

`unita/fattoria3d-addobbi` (i dati come la 2D, un modello per addobbo, un punto per aggancio per forma, comprare e mettere, cambiare,
togliere, la stagione, il salvataggio, la conversione). Bersagli: `[data-f3="bestia-vestiario"]`, `[data-addobbo="<id>"]` (`aria-pressed`
se lo porta).

## Da fare

- Non visti in scena dalla camera di gioco né su un telefono: a ~22 m un occhiale è pochi pixel.
- La foto del foglio (`anteprime.js`) è la bestia senza addobbi.
- I costumi di Natale e di Halloween dei recinti (W17, W21) sono un'altra cosa: vestono le bestie del cortile.
