# Español a mondi — il percorso

Lo spagnolo usa lo stesso metodo dell'inglese ([mondi.md](mondi.md)): un
grafo di isole, tappe di parole e tappe di frasi che si alternano, **ogni
struttura si spiega prima** (la pagina del concetto), la 🏁 ripassa, il libro
racconta. Il **percorso è suo**, perché per un bambino italiano lo spagnolo è
difficile in punti diversi dall'inglese: la lingua è parente stretta
dell'italiano, quindi le parole somigliano (regalo) e le trappole sono
proprio le somiglianze che ingannano.

## Dove sbaglia chi parla italiano

| difficoltà | l'errore tipico | dove si insegna |
|---|---|---|
| **il genere** non coincide | *la leche* ma `el mar`, `la sal`; *el agua* | prima isola, e torna sempre |
| **l'aggettivo concorda** e sta dopo | *una casa blanco*, *un negro gato* | prima isola |
| **ser / estar** | *soy cansado*, *es en casa* | seconda e terza |
| **tener** per anni, fame, sete | *soy hambre*, *soy 8 años* | seconda |
| **gustar** al rovescio | *yo gusto el chocolate*, *me gusta las uvas* | seconda |
| **hay** (c'è, ci sono) | *es un gato en la mesa* | terza |
| **il soggetto si omette** | *yo tengo* sempre, *él juega* | quarta |
| **la coniugazione** (-ar, -er, -ir) | *yo juega*, *él como* | quarta |
| **i verbi con dittongo** | *yo querro*, *yo poder* | quinta |
| **contrazioni** al, del | *a el parque*, *de el perro* | quinta |
| **il passato** (indefinido) | *yo jugé* (accento), *yo hací* | sesta |
| **ir a + verbo** | *voy nadar* (senza a) | sesta |
| **la scrittura** | `¿…?` e `¡…!`, gli accenti (`qué`, `él`) | sempre |

## Un'isola per anno, come per l'inglese

Il percorso è quello dei libri di spagnolo A1–A2 delle medie, anticipato.
I nomi sono posti, mai l'anno (vedi [mondi.md](mondi.md#un-mondo-per-anno-di-scuola)).

| isola (anno) | le tappe in ordine (in corsivo le frasi) |
|---|---|
| **1** | i colori · gli animali · i giocattoli · *è un cane, è una mucca* · *il gatto, la mucca* · *un gatto nero* · le feste · *ciao! come ti chiami?* · a scuola · *questo è…* · i numeri fino a dieci |
| **2** | il cibo · *due gatti, i gatti* · a pranzo · *mi piace!* · la famiglia · i vestiti · *questo è mio* · come sono · *io sono, tu sei* · i numeri fino a venti · *ho un…, ho fame* · il corpo · *lei ha…* |
| **3** | la casa · i mobili · *dov’è?* · i numeri fino a cento · *c’è, ci sono* · *chi? che cosa? come?* · i giorni · le stagioni e i mesi · gli altri mesi · *oggi è lunedì* · che tempo fa · *fa freddo, piove* · come stai? · *essere o stare?* |
| **4** | la giornata · *che ore sono?* · ogni giorno · sport e musica · *io lavo, tu ascolti* · *il cinque di maggio* · *un po’ di…, alcuni* · i mestieri · *lei mangia, lui vive* · la mattina · *mi alzo alle sette* · i mezzi · *che cosa stai facendo?* |
| **5** | in città · *vado al parco* · per strada · *gira a sinistra* · i soldi · *quanto costa?* · *il cane di Tom* · i verbi che cambiano · *voglio, posso* |
| **6** | *ieri ero al parco* · fuori città · che cosa è successo · *sono andato al castello* · *ho giocato* · chi parla, chi ride · *ha detto ciao* · *quando fa freddo* · alto e veloce · *chi è più alto?* · *domani andrò* |

La tabella si rifà dai dati (`dati/mondi.js`): se i due divergono ha ragione il
codice. Il gioco di prima (`views/LinguaGame.vue`) resta come «Il gioco di
prima» in fondo alla mappa.

## Stato (1° ottobre 2026)

Sei isole, 77 tappe (le parole 35, le frasi 36, le 🏁 6), 610 frasi, 122
concetti, 26 storie (le prime cinque isole quattro ciascuna, la sesta tre più
una serie a puntate, «Il mercato della nonna»). Le chiavi delle parole sono
quelle di sempre (`es:perro`, `verbo-es:jugar`), le frasi `frase-es:`, le
strutture `forma-es:`; l'avanzamento sta in `profile.campagne.spagnolo`.
Il motore e il contratto per scrivere frasi, concetti e capitoli:
[spagnolo-motore.md](spagnolo-motore.md) e [spagnolo-trappole.md](spagnolo-trappole.md).
Cosa manca: [da-fare.md](da-fare.md#lo-spagnolo).
