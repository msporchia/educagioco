# Gli addobbi delle bestie

Le bestie si vestono come nella fattoria 2D (i dati in `da2d/dati/addobbi.js`): un cappello, gli occhiali,
qualcosa al collo e sulla schiena, che **si vede in scena** mentre la bestia gira: un vestito che si guarda solo aprendo una scheda non lo mette nessuno. Vale per le bestie comprate e per i compagni gratis
(Watson, Sherlock, Irene, Pepe). Codice: `dati/addobbi.js` (i dati), `motore/cura.js` (`vesti`, `spoglia`, `vestiarioDi`),
`dati/addobbi-colori.js` (la tavolozza, i colori di ognuno, gli addobbi di Natale), `scena3d/modelli-addobbi.js` (i modelli e gli agganci),
`viste/NegozioBestia.vue` (il negozio, che si apre dal tasto «🛍️ Negozio» del foglio della bestia, `viste/Bestia.vue`).

## Le regole (quelle della 2D)

- **I primi dodici sono quelli della 2D**, con gli stessi prezzi (🪙6–24, la fascia «una cosetta», uno-quattro minuti di esercizi: un cappello che costasse quanto
  un pollaio metterebbe una decorazione in concorrenza con la catena) e gli stessi agganci: fiorellino, cappellino, cilindro,
  coroncina e cappello da strega in testa; occhialini e occhiali da sole sul muso; fiocco, sciarpa e campanella al collo; mantellina e
  zainetto sulla schiena. Nella 2D gli ultimi cinque erano sospesi perché un'emoji non sta su una bestia a quattro zampe: **in 3D sono
  modelli, e sono tutti in vendita**.
- **Non tutti portano tutto**: la campanella è dei gatti (`per`), il pappagallo non ha la schiena (ha le ali).
- **Il cappello da strega si compra solo a Halloween**; comprato resta, e si rimette quando si vuole.
- **Comprare è mettere**: nel negozio il tasto ha il prezzo; toccato, l'addobbo si compra e va addosso in un gesto. **Si compra una volta e
  non si consuma**: «Togli» lo rimette nel **cassetto** (`stato.addobbi`), da dove va gratis a un'altra bestia. **Un aggancio tiene una cosa
  sola**: un secondo cappello cambia il primo, che torna nel cassetto.
- **Si compra in un colore, e quel colore resta tuo** (ogni addobbo ha 3–5 colori, `dati/addobbi-colori.js`): un altro colore si paga di nuovo, allo
  stesso prezzo. Il cassetto e l'aggancio tengono una *chiave* `<id>:<colore>` (`mantellina:blu`); l'id solo di un salvataggio di prima vale il **colore di
  base, il primo della lista** (quello che le bestie indossavano quando il colore era uno solo): nessuno perde niente, gli altri colori si pagano da ora.
  Per questo **non si riordina né si toglie un colore da una lista**. Un colore che non esiste si butta alla lettura.
- **Il livello**: ogni addobbo ha `liv` (1 per i dodici della 2D, che non lo avevano); sotto quel livello lo scaffale lo mostra «🔒 Livello N» e `vesti`
  dice `troppo-presto`. Un colore già tuo si mette sempre.
- **Gli addobbi di Natale** (cappello da elfo, di Babbo Natale, corna di renna, campanelli, sciarpa a righe, pacco regalo: 🪙10–22, livelli 1–8, solo 3D)
  si comprano solo a Natale (`stagione: 'natale'`, come il cappello da strega a Halloween); comprati restano, i colori che non hai ancora no.
- La spesa conta come esperienza, come ogni acquisto; niente monete indietro.
- Il traguardo **«Che eleganza»** (🎩, 1/4/8 addobbi addosso, un primato come nella 2D: `fattoria3dVestiti`).

## Il negozio

Un foglio quasi a schermo intero (`NegozioBestia.vue`, stile `stile-negozio-bestie.css`) per le comprate, i compagni gratis e Watson: **la bestia fa da modello**,
grande (384 px veri) in cima, e si gira col dito (o con ◀ ▶) di 30° per volta; sotto gli scaffali per aggancio (In testa · Occhi · Al collo · Sulla schiena),
le schede degli addobbi (prezzo «da 🪙N», «✓ addosso», 🔒 livello, 🎄 se di Natale) e, per quello scelto, i colori con «tuo» o il prezzo. **Toccare una scheda
o un colore lo prova sulla bestia, senza pagare**; il tasto in fondo compra e mette, mette gratis un colore che hai, oppure toglie.

**Le schede mostrano il modello dell'addobbo, mai un'emoji** (l'emoji è solo il segnaposto finché la foto non arriva): una foto per ogni addobbo in ogni colore (`addobbo:<id>:<colore>`, senza disco d'ombra), fatta sul computer da `npm run anteprime fattoria` come quelle dei pezzi e delle bestie, in `dati/anteprime.js` (il budget del test sale a 1,5 MB).

Il modello grande è una foto fatta dal renderer della scena (`anteprime.js`, tipo `vestita:<bestia>|<gradi>|<aggancio>=<chiave>;…`, `Mondo3d.modelloVestita`): un angolo per
volta e in cache, nessun contesto WebGL in più. La bestia sta in una scatola invisibile e ferma, così girando l'inquadratura non balla. Fuori dal negozio la bestia
resta piccola com'è. Provato e scartato: un canvas WebGL vivo nel foglio (un contesto in più su un telefono già in affanno).

## Gli agganci

Ogni addobbo è disegnato in codice per una testa di raggio ~0,15, con l'origine dove tocca la bestia. `AGGANCI` dice, per ogni forma
(`cane` = Watson, `beagle`, `gatto`, `coniglio`, `pappagallo`), su quale perno va (`testa` o `corpo`, così segue le pose: annusa, si
rotola, dorme), dove e con che scala. Le misure sono lette dai volumi dei corpi; provato a misurare la scatola della testa: le orecchie del
gatto e la frangia di Watson la allungano, e il cappello finiva per aria. Si guardano tutti nel catalogo 3D (`npm run catalogo3d:scheda --
--gioco fattoria --q vestita`).

## Salvataggi

`stato.addobbi` (il cassetto, `{ 'id:colore': quanti }`) e `stato.casa[<bestia>].addobbi` (`{ aggancio: 'id:colore' }`): letti da `normalizza` senza cambiare
`VERSIONE_STATO` (l'id solo diventa il colore di base), un id o un colore che non esistono o sull'aggancio sbagliato si buttano. Per questo **un addobbo non si toglie dall'elenco** (`da2d/dati/addobbi.js`, da cui `dati/addobbi.js`
prende i suoi): chi l'ha comprato lo perderebbe al primo caricamento. La conversione dalla 2D porta il guardaroba nel cassetto e gli addobbi addosso alle bestie (se
le stanno, se no nel cassetto); chi era stato convertito prima li riceve dal «da regalare» (`MIGRAZIONE` 3, [parita/migrazione.md](parita/migrazione.md)).

## Nei test

`unita/fattoria3d-addobbi` (i dati come la 2D, un modello per addobbo, un punto per aggancio per forma, comprare e mettere, cambiare,
togliere, i colori, il livello, Natale, il salvataggio, la conversione); `integrazione/fattoria3d-bestie` il negozio col dito. Bersagli: `[data-azione="negozio"]`
(il tasto del foglio e quello del negozio), `[data-f3="negozio-bestia"]`, `[data-f3="negozio-palco"] img`, `[data-scaffale="<aggancio>"]`,
`[data-addobbo="<id>"]`, `[data-colore="<colore>"]`, `[data-gira="±1"]`.

## Da fare

- Non visti in scena dalla camera di gioco né su un telefono: a ~22 m un occhiale è pochi pixel.
- La foto del foglio (`anteprime.js`) è la bestia senza addobbi.
- I costumi di Natale e di Halloween dei recinti (W17, W21) sono un'altra cosa: vestono le bestie del cortile.
