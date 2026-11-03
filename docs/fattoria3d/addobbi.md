# Gli addobbi delle bestie

Le bestie si vestono come nella fattoria 2D (i dati in `da2d/dati/addobbi.js`): un cappello, gli occhiali,
qualcosa al collo e sulla schiena, che **si vede in scena** mentre la bestia gira: un vestito che si guarda solo aprendo una scheda non lo mette nessuno. Vale per le bestie comprate e per i compagni gratis
(Watson, Sherlock, Irene, Pepe). Codice: `dati/addobbi.js` (i dati), `motore/cura.js` (`vesti`, `spoglia`, `vestiarioDi`),
`dati/addobbi-colori.js` (la tavolozza, i colori di ognuno, gli addobbi di Natale), `scena3d/modelli-addobbi.js` (i modelli e gli agganci),
`viste/Addobbi.vue` (il negozio, sull'interfaccia unica: si apre dal tasto «🛍️ Negozio» del foglio della bestia, `viste/Bestia.vue`).

## Le regole (quelle della 2D)

- **I primi dodici sono quelli della 2D**, con gli stessi prezzi (🪙6–24, la fascia «una cosetta», uno-quattro minuti di esercizi: un cappello che costasse quanto
  un pollaio metterebbe una decorazione in concorrenza con la catena) e gli stessi agganci: fiorellino, cappellino, cilindro,
  coroncina e cappello da strega in testa; occhialini e occhiali da sole sul muso; fiocco, sciarpa e campanella al collo; mantellina e
  zainetto sulla schiena. Nella 2D gli ultimi cinque erano sospesi perché un'emoji non sta su una bestia a quattro zampe: **in 3D sono
  modelli, e sono tutti in vendita**.
- **Non tutti portano tutto**: la campanella è dei gatti (`per`), il pappagallo non ha la schiena (ha le ali).
- **Il cappello da strega si compra solo a Halloween**; comprato resta, e si rimette quando si vuole.
- **Si prova, poi si compra**: un colore che non hai resta in prova sulla bestia finché non si preme «Acquista e indossa», che lo compra e lo mette in un
  gesto; un colore che hai si mette subito. **Si compra una volta e
  non si consuma**: «Niente» (su quell'aggancio) lo rimette nel **cassetto** (`stato.addobbi`), da dove va gratis a un'altra bestia. **Un aggancio tiene una cosa
  sola**: un secondo cappello cambia il primo, che torna nel cassetto.
- **Si compra in un colore, e quel colore resta tuo** (ogni addobbo ha 3–5 colori, `dati/addobbi-colori.js`): un altro colore si paga di nuovo, allo
  stesso prezzo. Il cassetto e l'aggancio tengono una *chiave* `<id>:<colore>` (`mantellina:blu`); l'id solo di un salvataggio di prima vale il **colore di
  base, il primo della lista** (quello che le bestie indossavano quando il colore era uno solo): nessuno perde niente, gli altri colori si pagano da ora.
  Per questo **non si riordina né si toglie un colore da una lista**. Un colore che non esiste si butta alla lettura.
- **Il livello**: ogni addobbo ha `liv` (1 per i dodici della 2D, che non lo avevano); sotto quel livello il gettone si vede chiuso, «liv. N», si prova ma il tasto dice «Dal livello N», e `vesti`
  dice `troppo-presto`. Un colore già tuo si mette sempre.
- **Gli addobbi di Natale** (cappello da elfo, di Babbo Natale, corna di renna, campanelli, sciarpa a righe, pacco regalo: 🪙10–22, livelli 1–8, solo 3D)
  si comprano solo a Natale (`stagione: 'natale'`, come il cappello da strega a Halloween); comprati restano, i colori che non hai ancora no: fuori dalla festa
  il colore si prova ma il tasto dice «Solo a Natale» (o «Solo a Halloween»).
- La spesa conta come esperienza, come ogni acquisto; niente monete indietro.
- Il traguardo **«Che eleganza»** (🎩, 1/4/8 addobbi addosso, un primato come nella 2D: `fattoria3dVestiti`).

## Il negozio

Sta sopra l'interfaccia unica ([../core/personalizza.md](../core/personalizza.md), tema `animali`), come il guardaroba del contadino e il tintore:
`viste/Addobbi.vue` tiene solo i dati di qui e le foto. Dall'alto: **la bestia fa da modello**, grande, e si gira col dito o con ‹ › a scatti di
45° (si comincia di tre quarti, 40°: di faccia una bestia a quattro zampe è una macchia); le schede per aggancio (In testa · Sul muso · Al collo · Sulla
schiena · Set); gli addobbi con «Niente» in testa (il prezzo «da 🪙N» finché non ne hai un colore, «liv. N» se manca il livello, la festa se è finita); sotto,
per quello scelto, i suoi colori (con il prezzo, o niente se è tuo); in fondo «Acquista e indossa». La ✕ in alto a destra torna al foglio della bestia.

**I gettoni mostrano il modello dell'addobbo, mai un'emoji**: una foto per ogni addobbo in ogni colore (`addobbo:<id>:<colore>`, senza disco d'ombra), fatta sul
computer da `npm run anteprime fattoria` come quelle dei pezzi e delle bestie, in `dati/anteprime.js` (il budget del test sale a 1,5 MB).

Il modello grande è una foto fatta dal renderer della scena (`anteprime.js`, tipo `vestita:<bestia>|<gradi>|<aggancio>=<chiave>;…`, `Mondo3d.modelloVestita`): un angolo per
volta e in cache, nessun contesto WebGL in più. La bestia sta in una scatola invisibile e ferma, così girando l'inquadratura non balla. Fuori dal negozio la bestia
resta piccola com'è. Provato e scartato: un canvas WebGL vivo nel foglio (un contesto in più su un telefono già in affanno).

## I set

Sei posti per bestia (la scheda Set): «Salva questo set» tiene quello che porta adesso, col nome che si sceglie (sedici lettere); toccarlo lo rimette, gratis,
con quello che hai ancora (un colore non più tuo si salta, e il gettone lo dice). `stato.casa[<bestia>].vestiti` = `[{ posto, nome, addobbi: { aggancio: 'id:colore' } }]`
(`vestitiBestiaInForma` in `dati/bestie.js`, `Cura.salvaVestito`/`rinominaVestito`/`togliVestito`); un set storto si butta, un addobbo che non c'è più si toglie dal set.

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
togliere, i colori, il livello, Natale, il salvataggio, la conversione, i set); `integrazione/fattoria3d-bestie` il negozio col dito (provare non costa, «Acquista e
indossa», un altro colore si paga, uno tuo si rimette gratis, un set, la ✕ che torna al foglio). Bersagli: `[data-azione="negozio"]` (il tasto del foglio),
`[data-f3="addobbi"]`, `[data-f3="addobbi-ritratto"] img`, `[data-addobbo="<id>|niente-<aggancio>"]`, `[data-colore="<colore>"]`, e quelli del componente
(`[data-prs-scheda]`, `[data-prs="paga|gira-sx|gira-dx|salva-set|…"]`).

## Da fare

- Non visti in scena dalla camera di gioco né su un telefono: a ~22 m un occhiale è pochi pixel.
- I costumi di Natale e di Halloween dei recinti (W17, W21) sono un'altra cosa: vestono le bestie del cortile.
