/* ═══════════════════════════════════════════════════════════════════
   COM'È FATTO UN MURO — la regola, cella per cella

   Qui non c'è nessun canvas e nessun nome di sprite: c'è la domanda «che
   cosa si vede in questa cella?», e la risposta la danno i vicini. Chi
   disegna (`tela.js`) ci mette sopra i pezzi dello scenario. Gira in
   Node, e infatti si prova lì (`unita/muri-sotterraneo`).

   ── LA REGOLA, CHE È UNA SOLA ────────────────────────────────────
   - la roccia si vede **da sopra**: è il tetto dei muri, e dove confina
     con quello che si cammina ha un bordo di pietra chiara;
   - dove **sotto** una cella di roccia si cammina, di quella cella si
     vede **la faccia** del muro: alta una cella, col suo coronamento;
   - i muri di lato e quelli in basso non hanno faccia: solo il bordo.

   Con la faccia alta una cella **qualunque muro sta in una cella di
   spessore**, ed è il motivo di tutto. Il set di prima (0x72) disegnava
   la parete alta due celle — la faccia e il coronamento sopra — e fra
   due corridoi paralleli la roccia è spessa una cella sola: il
   coronamento non aveva dove stare, e per non lasciare buchi si
   dipingeva di mattoni tutta la roccia. Un mare di muro in cui non si
   capiva dove finisse una parete.

   ── I BORDI SONO STRISCE, GLI ANGOLI SONO BLOCCHI ─────────────────
   Il bordo sta **dentro la cella di tetto**, lungo il lato che guarda
   fuori: a nord se sopra si cammina, a ovest e a est se di lato si
   cammina **o c'è una faccia** — il muro laterale di una stanza sale
   accanto alla fila delle facce fino al coronamento, come in ogni
   stanza vista a tre quarti. A sud il bordo non c'è mai: una cella di
   roccia con del calpestabile sotto è una faccia, non un tetto.

   Dove due strisce si incontrano, o una gira, ci va un blocco d'angolo.
   Gli angoli si decidono per quarto di cella guardando tre vicini — il
   lato orizzontale, quello verticale, la diagonale — che è il modo in
   cui li compone da sempre chi fa i fogli a tessere (i «quarti» di RPG
   Maker): quattro casi per quarto invece di quarantasette figure.
   ═══════════════════════════════════════════════════════════════════ */

/* `pietra(x, y)` dice se in quella cella c'è roccia: fuori dal piano è
   roccia anche lei, ed è compito di chi la passa. */
export const faccia = (pietra, x, y) => pietra(x, y) && !pietra(x, y + 1)
export const tetto = (pietra, x, y) => pietra(x, y) && pietra(x, y + 1)

export function genere(pietra, x, y) {
  if (!pietra(x, y)) return 'pavimento'
  return pietra(x, y + 1) ? 'tetto' : 'faccia'
}

/* ── i bordi di una cella di tetto ──
   `n`, `o`, `e`: le tre strisce. `angoli`: i blocchi, per quarto —
   `no` e `ne` in cima, `so` e `se` in fondo.

   In cima un angolo c'è in due casi: dove le due strisce si incontrano
   (sopra e di lato si cammina: lo spigolo di un pilastro), e dove non
   ce n'è nessuna ma si cammina **in diagonale** (l'angolo di una stanza
   visto da dentro, dove il bordo del muro di lato gira in quello del
   muro di sotto).

   In fondo l'angolo c'è quando in diagonale sotto c'è **una faccia**: è
   il punto dove il coronamento di quella faccia, che sale di un filo
   sulla cella sopra di lei, incontra la striscia del muro che gli
   scende accanto. Senza, fra i due resta un dente. */
export function bordiDelTetto(pietra, x, y) {
  const passa = (a, b) => !pietra(a, b)
  const aperto = (a, b) => !pietra(a, b) || !pietra(a, b + 1)
  const n = passa(x, y - 1)
  const o = aperto(x - 1, y)
  const e = aperto(x + 1, y)
  const angoli = []
  if ((n && o) || (!n && !o && passa(x - 1, y - 1))) angoli.push('no')
  if ((n && e) || (!n && !e && passa(x + 1, y - 1))) angoli.push('ne')
  /* …e solo se sotto questa cella continua il tetto, cioè se lì scende
     davvero una striscia di lato: sopra una fila di facce che va avanti
     il coronamento è una riga sola, e un blocco in mezzo la spezzerebbe */
  const sottoTetto = tetto(pietra, x, y + 1)
  if (!o && sottoTetto && faccia(pietra, x - 1, y + 1)) angoli.push('so')
  if (!e && sottoTetto && faccia(pietra, x + 1, y + 1)) angoli.push('se')
  return { n, o, e, angoli }
}

/* ── i capi di una faccia ──
   Una fila di facce finisce con uno spigolo di pietra dove accanto **si
   cammina**: il moncone sopra una porta laterale, un pilastro in mezzo
   a una stanza. Dove accanto c'è del tetto lo spigolo non serve — lo fa
   già la striscia del muro di lato — e dove c'è una porta nella stessa
   fila nemmeno: la porta ha il suo arco. */
export function capiDellaFaccia(pietra, porta, x, y) {
  return {
    sx: !pietra(x - 1, y) && !porta(x - 1, y),
    dx: !pietra(x + 1, y) && !porta(x + 1, y),
  }
}

/* ── da che parte si vede una porta ──
   Dal muro in cui sta. Se il muro va dall'alto in basso — sopra e sotto
   la porta c'è roccia — la si vede da sopra, di taglio: di fianco. Se va
   da sinistra a destra, di fronte; e di fronte è anche il ripiego,
   quando non si capisce (un incrocio).

   `chiuso(x, y)` è roccia **oppure un'altra porta**, e non è un
   dettaglio: un corridoio che corre lungo il bordo di una stanza fa una
   colonna di porte una sotto l'altra, e sopra e sotto quella in mezzo
   c'è una porta, non un muro — contando solo la roccia, la colonna
   sarebbe venuta di taglio in cima e in fondo e di fronte in mezzo.
   Allo stesso modo, due porte accostate in un muro spesso due celle
   stanno di fianco tutte e due, anche se ognuna ha l'altra accanto. */
export function versoDellaPorta(chiuso, x, y) {
  const muroInPiedi = chiuso(x, y - 1) && chiuso(x, y + 1)
  const muroSteso = chiuso(x - 1, y) && chiuso(x + 1, y)
  return muroInPiedi && !muroSteso ? 'fianco' : 'davanti'
}

/* Un numero fisso per cella, da cui scegliere varianti senza che il
   disegno cambi da un fotogramma all'altro: lo stesso piano si rivede
   sempre uguale, che è quello che fa sembrare un posto un posto. */
export function sorteDi(x, y, sale = 0) {
  let h = (Math.imul(x + 101, 73856093) ^ Math.imul(y + 211, 19349663) ^ Math.imul(sale + 7, 83492791)) >>> 0
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15
  return h >>> 0
}
