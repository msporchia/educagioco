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
in media, risale piano sotto i 15 (cambia prima del disegno, mai dopo: la
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

**Il peso**: `dist/index.html` da 29 190 a 29 289 kB (+99 kB: il codice di
`scena3d/` e delle viste nuove; three c'era già per gli Asteroidi 3D). Nel sito
spezzato three resta in `asteroidi-3d` (640 kB), `scena3d/` sta in
`sotterraneo-3d` (81 kB), chiesto solo scendendo nel Sotterraneo 3D: il
Sotterraneo di sempre non lo carica, né carica three. Il 3D non ha un
`manualChunks`: è il confine dell'import a richiesta (con un `manualChunks` si
tirava dentro i dati in comune col 2D, e il 2D finiva per caricare three)
([../core/avvio-e-memoria.md](../core/avvio-e-memoria.md)).

Torna a [grafica-3d.md](grafica-3d.md).
