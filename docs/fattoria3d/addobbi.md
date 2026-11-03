# Gli addobbi delle bestie

Le bestie si vestono: un cappello, gli occhiali,
qualcosa al collo e sulla schiena, che **si vede in scena** mentre la bestia gira: un vestito che si guarda solo aprendo una scheda non lo mette nessuno. Vale per le bestie comprate e per i compagni gratis
(Watson, Sherlock, Irene, Pepe). Codice: `dati/addobbi.js` (i dati), `motore/cura.js` (`vesti`, `spoglia`, `vestiarioDi`),
`scena3d/modelli-addobbi.js` (i modelli, ritinti, e gli agganci), `viste/Addobbi.vue` (si apre da «🎩 Vestilo» in `viste/Bestia.vue`).

## Le regole

- **Dodici addobbi, il catalogo è di questo gioco** (`dati/addobbi.js`, non importa dalla 2D; gli id sono nei salvataggi, anche convertiti), con i prezzi (🪙6–24, la fascia «una cosetta», uno-quattro minuti di esercizi: un cappello che costasse quanto
  un pollaio metterebbe una decorazione in concorrenza con la catena) e gli stessi agganci: fiorellino, cappellino, cilindro,
  coroncina e cappello da strega in testa; occhialini e occhiali da sole sul muso; fiocco, sciarpa e campanella al collo; mantellina e
  zainetto sulla schiena. Sono tutti modelli 3D, tutti in vendita.
- **Non tutti portano tutto**: la campanella è dei gatti (`per`), il pappagallo non ha la schiena (ha le ali).
- **Il cappello da strega si compra solo a Halloween**; comprato resta, e si rimette quando si vuole.
- **Si veste nell'interfaccia unica** ([../core/personalizza.md](../core/personalizza.md), tema `animali`): «🎩 Vestilo» nel foglio della
  bestia apre `viste/Addobbi.vue` (la ✕ torna al foglio). Una scheda per aggancio (In testa, Sul muso, Al collo, Sulla schiena) e Set; in
  ognuna «Niente» e gli addobbi che le stanno. Il ritratto è la bestia vestita, girata a scatti (`bestia:<id>:r<n>:<aggancio>=<addobbo@tinta>`,
  `modelloBestia`); i gettoni sono gli addobbi fotografati (`addobbo:<id>[@tinta]`).
- **Si prova, poi si compra**: un addobbo da comprare resta in prova finché non si preme «Acquista e indossa». Quelli che hai (nel cassetto) si
  mettono con un tocco. **Si compra una volta e non si consuma**: «Niente» lo toglie e lo rimette nel **cassetto** (`stato.addobbi`), da dove va
  gratis a un'altra bestia. **Un aggancio tiene una cosa sola**: un secondo cappello cambia il primo, che torna nel cassetto.
- **I colori**: un addobbo ha una forma sola e i quindici colori della tavolozza (`grafica/persona/tinte.js`, ritinti da `tinge3d.js`) più il suo.
  Il colore che si prova comprandolo viene con lui; un'altra tinta si compra una volta per addobbo (`PREZZO_TINTA`, **5 🪙, provvisorio: da
  confermare**) e poi è tua per tutte le bestie. Si salvano `stato.tinteAddobbi` (`{ id: [tinte] }`) e la tinta addosso,
  `stato.casa[<bestia>].tinte` (`{ aggancio: tinta }`); un salvataggio di prima non le ha e tutto resta del suo colore. In scena l'addobbo è
  `id@tinta` (`conTinta`, `Cura.addossoTintoA`).
- **I set**: sei posti per bestia, `stato.casa[<bestia>].vestiti` (`[{ posto, nome, addobbi, tinte }]`, `vestitiBestiaInForma`); rimetterlo mette
  quello che hai e salta il resto.
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
prende i suoi, ora autonomo): chi l'ha comprato lo perderebbe al primo caricamento. La conversione dalla 2D porta il guardaroba nel cassetto e gli addobbi addosso alle bestie (se
le stanno, se no nel cassetto); chi era stato convertito prima li riceve dal «da regalare» (`MIGRAZIONE` 3, [parita/migrazione.md](parita/migrazione.md)).

## Nei test

`unita/fattoria3d-addobbi` (i dodici con prezzi e agganci fissi, un modello per addobbo, un punto per aggancio per forma, comprare e mettere, cambiare,
togliere, la stagione, il salvataggio, la conversione, le tinte e i set) e `integrazione/fattoria3d-bestie` («Vestilo», un addobbo in prova e comprato
già tinto, un'altra tinta, un set, la ✕ che torna al foglio). Bersagli: quelli del componente più `[data-f3="bestia-vestilo"]`, `[data-f3="addobbi"]`,
`[data-addobbo="<id>|niente-<aggancio>"]`, `[data-tinta="<id>"]`.

## Da fare

- Non visti in scena dalla camera di gioco né su un telefono: a ~22 m un occhiale è pochi pixel.
- I costumi di Natale e di Halloween dei recinti (W17, W21) sono un'altra cosa: vestono le bestie del cortile.
