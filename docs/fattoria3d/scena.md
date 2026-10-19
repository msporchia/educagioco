# La scena 3D della fattoria

Come è fatto il disegno in `src/giochi/fattoria3d/scena3d/`: un modulo per cosa, e nessuno sa le regole (sono del
motore). three.js è l'eccezione alle «niente dipendenze oltre Vue» ([../../CLAUDE.md](../../CLAUDE.md)), accettata come per
gli Asteroidi 3D e il Sotterraneo 3D: il 3D non si scrive a mano.

## I moduli

| file | cosa tiene |
|---|---|
| `mondo3d.js` | **compone** tutto e fa il battito: renderer, luci, il tocco (`tocca`, `bersaglioSotto`), la coda di semina/raccolta, le opzioni (`applica`), le statistiche. L'unico che usa il renderer |
| `terreno.js` | erba, strade, griglia, lotti non comprati, recinto, alberi, nuvole, i due edifici di scena |
| `pezzi.js` | un gruppo per ogni cosa del motore e per i sette edifici unici (fantasmi finché non si comprano); li tiene allineati (`sincronizza`) e li anima (grano che cresce, pecore, galline e mucche, fontana, fumo, il pallone); i cartelli sugli edifici: prezzo o «🔒 Livello N» sul fantasma, pronti o cottura su ogni macchina, uova o latte pronti sul pollaio e sulla stalla |
| `eroe.js` | il movimento (a piedi, o di corsa), il percorso, la posa del gesto (semina, falcia, abbatte, esulta) |
| `azioni.js` | cosa fa l'eroe davanti a ogni cosa: anima il gesto e **a metà gesto chiede al motore di farlo davvero**; un edificio posseduto apre il menu della sua macchina, uno no offre l'acquisto (`offriEdificio`: livello, terreno da comprare prima, prezzo) |
| `detti.js` | `dettoDi` / `dettoDiRifiuto`: un rifiuto del motore in una riga che dice cosa fare. Senza three: lo usa anche `Gioco.vue` |
| `costruzione.js` | il trascinamento dei pezzi (dalla barra o riprendendone uno), il fantasma, le strade a pennello, l'annulla |
| `dito.js` | i pointer sulla tela: tocco, mappa che scorre, pizzico, tenere premuto, riprendere un pezzo |
| `camera.js` | la telecamera: segue, libera, in costruzione |
| `effetti.js` | scintille e fumo, i testi che volano, il fumetto dell'eroe, i cartelli, l'albero che cade |
| `modelli.js` | tutti i pezzi in codice (niente sprite, niente immagini: le trame sono canvas): campo a istanze con dieci colture, i sette edifici (pasticceria, mongolfiera, mulino, panificio, caseificio, conserviera, gelateria), le quattro decorazioni (aiuola, panchina, pozzo, spaventapasseri), bancarella, fontana, recinto e pecore con le loro fasi, pollaio con le galline, stalla con le mucche ([animali.md](animali.md)), fienile, casa, l'eroe |
| `webgl.js` | `haWebGL2()`: si chiede senza caricare three |

La **vista** (`Gioco.vue` e `viste/`) apre le finestre e dice cosa si vuole; la scena la chiama attraverso `ui`
(`cambio`, `chiedi`, `scegliSeme`, `apriMacchina`, `apriBanco` (un tocco sulla bancarella), `avviso`, `fogliAperti`, `zonaDrop`, `trascinando`).

**Un tocco su un edificio non tuo** che non si può comprare adesso (livello o terreno che mancano) non fa camminare l'eroe, che sta fuori
dal suo terreno: apre subito l'offerta, che dice il livello o manda al lotto da comprare prima (`_edificioDaLontano` in `mondo3d.js`).

## Costruire trascinando

Si **trascina una carta dalla barra fino alla mappa** (verso l'alto; di lato scorre la barra) e al rilascio si
costruisce. Il fantasma sta 1,6 celle sopra il dito, verde se ci sta (`puoMettere` del motore), rosso se no. **Un pezzo
non pagato chiede la conferma appena si comincia a trascinarlo**; pagato sta nel magazzino (`📦 ×1`) e si trascina quando
si vuole. Rilasciato sulla barra torna nel magazzino (🪙 1); un rilascio non valido non perde niente. Un pezzo già
messo si riprende **trascinandolo** (in costruzione) o **tenendolo premuto mezzo secondo** (fuori: vibra, compaiono la
griglia e la fascia «📦 metti via»). Dopo ogni mossa «↶ Annulla».

## Qualità e peso

Il pannello ⚙ (`viste/Opzioni.vue`, dati in `dati/qualita.js`) ha tre preset (basso / medio / alto), gli interruttori che
pesano (risoluzione 0,75×…nativa, ombre e loro qualità, ondeggio del grano, particelle, alberi, ciuffi, nuvole, nebbia), la
distanza della telecamera, le prove di stress (+10 campi, +3 recinti, non si salvano) e le statistiche vive: fps, il
fotogramma peggiore degli ultimi due secondi, il lavoro del JS (non la GPU: quella si deduce dal peggiore), draw call,
triangoli, geometrie, texture. «Mostra il rapporto» scrive dispositivo, GPU, fps e impostazioni da incollare.
**Il punto di partenza lo dà la fascia grafica del telefono** (`fasciaAttiva()` di `store/qualita.js`: bassa → basso,
media e alta → medio); le scelte si ricordano in `store/storage.js` (`fattoria3d-opz`).

- Il motore sta in piedi con **molte cose** perché campi, alberi, strade e recinto sono a istanze: ~100–260 draw call
  e ~20–50k triangoli con una sola ombra a 1024 (misurato in Chrome senza schermo, SwiftShader: i ms non dicono niente
  del telefono). **Da misurare su un telefono vero.**
- **Il peso nel sito spezzato**: `fattoria3d-3d-*.js` (~50 kB, il disegno) e `gioco-fattoria3d-*.js` (~40 kB) stanno nel
  gruppo `fattoria3d`; **three sta in `asteroidi-3d` (640 kB, gruppo `mate`)** e lo prende anche questo gioco. Il file
  del 3D si chiede a richiesta, quindi senza WebGL 2 o senza entrarci non si scarica (e `vite.config.js` lo sa, come per
  il Sotterraneo 3D).
- Il tempo è del tempo, non dei fotogrammi: `dt` capato a 0,05 s, le animazioni dal tempo, la crescita dall'orologio.

## Per provarlo

`#fattoria3d` apre il gioco. `&tela=niente` prova il messaggio senza WebGL. Dalla console, `window.__fattoria3d` dà
`motore`, `mondo` e le opzioni `q` (i test lo usano: un orologio spostato con `motore.ora = () => Date.now() + 60000` fa
passare il tempo dei campi). `node test/esegui.mjs fattoria3d --scatti` lascia le foto in
`test/scatti/`.
