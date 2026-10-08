# La nave madre

Il boss degli asteroidi è una nave madre che resta in alto e tira bombe col
numero. Arriva **in fondo a ogni tappa**, a bersaglio fatto, e **ogni tre
livelli del volo** (`BOSS_VOLO_OGNI` in `src/data/hangar.js`). Abbattuta,
lascia un pacco per l'hangar ([hangar.md](hangar.md)).

## Come si combatte

- **Tre domande**: ogni bomba giusta rimbalza sulla nave madre e le stacca
  un pezzo, prima il cannone sinistro, poi il destro (e la cupola si crepa,
  il comandante ha paura), al terzo salta (`CFG.colpiMadre`). Il danno si
  legge sulla nave, senza numeri, come quello della nave del bambino.
- **Le bombe sono sassi come gli altri**: un numero per bomba, una giusta,
  scendono dritte un po' più lente (`bossLento` 1,45). Una bomba sbagliata
  toccata o una giusta che arriva in fondo costano una vita, come un sasso.
- **Le domande sono della tappa**, scelte dal picker e segnate sul motore
  come tutte le altre. Prima il boss arrivava ogni otto domande ed era un
  assaggio della tappa dopo, non segnato: è stato tolto quando il boss è
  diventato raro e il pacco ha avuto bisogno di uno che lo regala.
- **Il disegno sta in `src/grafica/nave-madre.js`**: `disegnaNaveMadre` riceve
  i pezzi che le restano (`sx`, `dx`, `cupola`, `paura`), `cannoneDi` e
  `cupolaDi` dicono dove mandare il raggio che rimbalza.

## In una tappa

- **La stella si scrive quando arriva la nave madre**, non quando cade: il
  bersaglio è fatto, e la tappa è superata.
- **Perdere con la nave madre costa solo il pacco**: finite le vite, la tappa
  resta superata e il cartello dice che la nave madre è scappata e il pacco
  aspetta lì.
- **Ogni tappa ha due pacchi** ([hangar.md](hangar.md)): alla terza vittoria la
  nave madre arriva lo stesso, ma il cartello dice che qui i regali sono
  finiti. Sulla rotta, sotto il nome della tappa, si vedono i pacchi che
  restano (quanti, non cosa), e il fumetto lo dice.

## Nel volo

- **Arriva al livello 3, 6, 9…**, cioè ogni quindici centri; abbattuta dà una
  vita e un gettone, come prima il boss. Non arriva al livello da cui si parte:
  chi riparte dal 15 la incontra al 18.
- **Regala solo più in alto di prima**: un pacco per ogni nave madre
  abbattuta a un livello più alto di tutte quelle di prima (`voloMax`), e il
  pezzo è il più alto che il suo livello può dare (`REGALI_VOLO`, ognuno col
  suo `da`). Rifare i primi livelli finché sono facili non dà niente: i pezzi
  migliori li danno solo le navi madri alte. L'hangar dice da che livello
  arriva il prossimo, se no un volo senza pacchi sembra un guasto.
- **Il pacco ferma il cielo** finché non si preme «Avanti» (`regaloVolo` è
  una delle condizioni della pausa).

## Nella sosta

Uscendo durante la nave madre si salva quanti colpi ha preso (`madre` in
`src/motore/asteroidi/sosta.js`): rientrando torna con i pezzi che le
mancavano. Un salvataggio di prima non ha la nave madre, e si legge lo stesso.

Nei test: `window.__mate.madre()` (`attiva`, `colpi`, `chiamata`),
`regaloVolo`, `hangar()`; nell'hangar `[data-volo-oltre]`; il pacco `[data-regalo]` con `[data-pezzo]`, il
velo del volo `[data-regalo-volo]` con `[data-azione="avanti"]`,
`[data-madre-scappata]`, `[data-pacchi-finiti]`; sulla rotta
`[data-pacchi]` con `[data-pacchi-di="<pos>"]` e `[data-quanti]` e nel fumetto `[data-pacchi-fumetto]`.
