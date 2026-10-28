# Il Sotterraneo 3D: quanto costa

Misurato in Chrome senza schermo (SwiftShader: la CPU fa la GPU, i ms non
dicono niente del telefono), 390×844, sullo stesso inizio della prima discesa
(seme 7):

| | chiamate | triangoli |
|---|---|---|
| prototipo | 164 | 29k |
| gioco, all'arrivo | 34 | 13k |
| gioco, una sala accesa tutta (fontana, colonne, botti; `luce=stanza`) | 34–43 | 13–41k |
| gioco, nello scontro (tre mostri, la sala) | 33–48 | 40–44k |
| i dieci paesaggi, la stanza più grande accesa tutta | 29–42 | 52–157k |

Il JS che prepara un fotogramma sta sotto il mezzo millisecondo, le chiamate
a WebGL sotto il millisecondo. Le figure sono una chiamata sola (prima una
per figura), i muri due, le colonne due, le fiamme una, la nebbia una; una
sola passata d'ombra (il cono); luci a numero fisso. Il pixel ratio parte da
1,5 e scende fino a 0,6 se una quarantina di fotogrammi costano più di 26 ms
in media (non nella fascia bassa, che sta a 1: sul Note 7 a 0,6 si guadagnava
il 7% con l'immagine sfocata), risale piano sotto i 15 (cambia prima del disegno, mai dopo: la
tela cambiata si svuota). **Il degrado a scalini non c'è** (l'utente vuole
prima provare): se un telefono non regge, i pezzi si spengono in `ACCESI`.
`window.__sotterraneo3d.grafica()` dice chiamate, triangoli, figure, pixel
ratio, `pixelSprite` (quanti pixel del disegno fa un pixel dello sprite) e i
ms; il cheat `&spegni=nebbia,post` spegne pezzi di `ACCESI` per misurare
quanto costa ognuno.

**Dove va il tempo** (SwiftShader, lo scontro della fornace a pixel ratio 1,5,
ms a fotogramma): tutto acceso 160; senza nebbia 98, senza ombre 148, senza
arredo 147, senza post 153; tutto spento 52. La nebbia (cinque fette a tutto
schermo col rumore) era il pezzo più caro: ora i pixel che non si vedono
saltano rumore e luci (sono zero comunque), e lo scontro è sceso a 112 (in
esplorazione 62). Il passaggio finale prende la scena una volta sola invece
di tre.

## La fascia bassa (il Redmi Note 7)

Sul Note 7, in fascia bassa (pixel ratio 1, due fette di nebbia, niente passaggio finale), lo scontro fermo stava a ~48 fps con
cali a 30, e a ~15 durante un attacco. **Ogni luce puntiforme costa a ogni pixel di ogni materiale anche spenta**: three le conta
tutte quelle in scena e lo shader le gira tutte, e la scena ne aveva undici (sei fuochi, l'alone, lampo, magia, palco, rimbalzo)
più il cono con l'ombra; la Fattoria 3D, che lì sta a 60, ha un sole e l'emisferica. Il banco della tela
([../core/vecchio-telefono.md](../core/vecchio-telefono.md), «Lo scontro»; scontro fermo con tre scheletri, 4 core e CPU ×5,
pixel ratio 1, ms a fotogramma; tutto acceso ~100), un pezzo tolto alla volta:

| tolto | ms | | tolto | ms |
|---|---|---|---|---|
| quattro fuochi (ne restano 2) | −14 | | la nebbia (2 fette) | −20 |
| lampo e magia in una, niente rimbalzo | −7 | | l'arredo | −10 |
| la luce del palco | −5 | | ombra a 512 | −4 |
| le ombre (da sole) | −1 | | luci e ombre insieme | −37 |
| polvere, botti | −3, −4 | | scintille, fiamme, acqua (fermo) | ~0 |

Tutto spento resta ~43: pavimento, muri e figure con l'emisferica, l'alone e il cono. Nel racconto il banco cresce solo del 5-20%:
le scintille sono una chiamata, ~8 px l'una, senza luci (la polvere sì, ma ha punti di 2 px). **Nella bassa si tolgono**
(`SPEGNI_BASSA` in `store/qualita.js`, con i nomi di `ACCESI`): quattro dei sei fuochi (illuminano i due più vicini che si vedono;
le fiamme degli altri restano), il rimbalzo e la luce del palco (al suo posto l'emisferica cresce del 35% nello scontro, `LUCE.palcoAmbiente`),
la magia che diventa il lampo, l'ombra a 512 ridisegnata a fotogrammi alterni (va un fotogramma indietro), due strati di rumore nella
nebbia invece di quattro (riscalati: la nebbia non si dirada), metà scintille. Si vede: le torce lontane non schiariscono più il
pavimento e la nebbia è più liscia; il resto è uguale. **Prima → dopo** (banco, ms): scontro fermo 102-107 → 78, racconto 105-129
→ ~80 (fps del simulatore 6 → 8), esplorazione 64-66 → 51-55 (14 → 17 fps); l'alta resta com'era (94 → 92). In tutte le fasce, senza
cambiare niente a schermo: la maschera torna in GPU solo se un texel è cambiato (prima a ogni fotogramma), e delle figure va in GPU
solo la parte usata (prima 70 kB a fotogramma per 700 posti).

Dal 23/10 nella bassa il piano ha la luce per vertice e la nebbia nei vertici (`lucePerVertice`): [appiattimento-3d.md](appiattimento-3d.md), «Nel gioco».

- provato due strati di rumore nella nebbia da soli: −2% nel simulatore (lì pesa la sfumatura, che il simulatore sovrastima); restano nella bassa perché il telefono è debole proprio sui calcoli (la prova «shader pesante»).
- provato l'ombra a fotogrammi alterni da sola: −2%; pesa di più il leggerla in ogni pixel che il disegnarla.
- provato a spegnere l'ombra solo nello scontro: no, cambiarla ricompila tutti gli shader (sull'Adreno un fermo di 50-300 ms a ogni scontro).
- non provato: disegnare solo la parte sopra il pannello (sotto c'è il 20-50% dei pixel): il pannello misurato ogni sei fotogrammi lascerebbe vedere il nero quando si abbassa.

**Il peso**: `dist/index.html` da 29 190 a 29 289 kB (+99 kB: il codice di
`scena3d/` e delle viste nuove; three c'era già per gli Asteroidi 3D). Nel sito
spezzato three resta in `asteroidi-3d` (640 kB), `scena3d/` sta in
`sotterraneo-3d` (81 kB), chiesto solo scendendo nel Sotterraneo 3D: il
Sotterraneo di sempre non lo carica, né carica three. Il 3D non ha un
`manualChunks`: è il confine dell'import a richiesta (con un `manualChunks` si
tirava dentro i dati in comune col 2D, e il 2D finiva per caricare three)
([../core/avvio-e-memoria.md](../core/avvio-e-memoria.md)).

Le scene più pesanti con la CPU rallentata (eroe, mostri, persone, anteprime): [prestazioni-3d.md](prestazioni-3d.md). Quanti personaggi
prima dei 30 e dei 20 fps, e chi pesa di più: [limiti-3d.md](limiti-3d.md).

Torna a [grafica-3d.md](grafica-3d.md).
