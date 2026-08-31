/* ═══════════════════════════════════════════════════════════════════
   LA SPINTA AL BORDO — trascinare una cosa oltre quello che si vede

   Il problema, detto dai bambini: si tiene premuta una panchina, la si
   trascina verso il bordo dello schermo, e lì il gesto finisce. Per
   portarla nel prato accanto bisogna posarla, scorrere la vista con un
   dito, riprenderla, e ricominciare — tre gesti per uno, e su un
   telefono in verticale succede continuamente, perché il mondo è più
   largo dello schermo quasi sempre.

   Il rimedio è quello di tutti i programmi che spostano roba: **finché
   il dito resta appoggiato dentro una fascia lungo il bordo, il mondo
   scorre da solo verso quel lato**, e la cosa in mano resta sotto il
   dito mentre il paesaggio le passa sotto.

   ── PERCHÉ STA IN UN FILE SUO, E PURO ─────────────────────────────
   Quello che si può sbagliare qui non è il disegno, è l'aritmetica:
   scorrere dalla parte sbagliata, scorrere oltre il bordo del mondo,
   scorrere quando non c'è più niente da vedere, o non scorrere affatto
   perché un arrotondamento si mangia mezzo pixel per fotogramma. Sono
   tutte cose che si provano senza browser, se il conto vive fuori da un
   gestore di eventi. Qui dentro non c'è nessun canvas, nessun
   `pointerevent` e nessuna telecamera: entrano il punto del dito, la
   misura del riquadro, dov'è la vista, quant'è grande il mondo e quanto
   tempo è passato; esce di quanti pixel spostare la vista.

   ── I DUE NUMERI, E PERCHÉ SONO QUELLI ────────────────────────────
   **La fascia** è larga un sesto del lato corto, e comunque mai meno di
   44 px né più di 90. I 44 sono la stessa misura del bersaglio minimo
   che il gioco usa già (`MINIMO_TOCCO` in `Gioco.vue`): sotto quella
   misura la fascia non si centra col dito, e lo scorrimento diventa una
   cosa che parte per caso. Il tetto serve al verso opposto: su un
   tablet un sesto dello schermo sarebbero 150 px per lato, e posare una
   panchina lungo il bordo del prato diventerebbe impossibile senza far
   partire una corsa.

   **La velocità** cresce col quadrato di quanto si è entrati nella
   fascia: 90 px/s appena dentro, 460 al bordo vero. Il minimo non è un
   dettaglio — una rampa che parte da zero rende metà della fascia una
   zona morta, dove il dito è dentro e sembra non succedere niente — e
   il quadrato serve a rendere il fondo della corsa docile: si sfiora la
   fascia per un aggiustamento di mezza cella, ci si appoggia contro il
   bordo per attraversare la mappa.

   ── E SI FERMA DOVE FINISCE IL MONDO ──────────────────────────────
   La spinta è già tagliata su quanto **spazio resta davvero** da quella
   parte: a fine corsa esce zero, non un numero che poi qualcun altro
   rimetterà a posto. Serve a due cose insieme — non far vibrare la
   vista contro un muro, e dare a chi chiama un modo semplice di sapere
   che non c'è più niente da fare (`dx` e `dy` a zero) senza rifare il
   conto per conto suo.
   ═══════════════════════════════════════════════════════════════════ */

/* la fascia sensibile lungo ogni bordo, in pixel di schermo */
export const FASCIA_QUOTA = 1 / 6
export const FASCIA_MIN = 44
export const FASCIA_MAX = 90

/* quanto corre il mondo, in pixel di schermo al secondo: appena dentro
   la fascia, e col dito sul bordo */
export const VELOCITA_MIN = 90
export const VELOCITA_MAX = 460

const fra = (min, v, max) => Math.max(min, Math.min(max, v))

export const fasciaPer = (L, A) =>
  fra(FASCIA_MIN, Math.min(L, A) * FASCIA_QUOTA, FASCIA_MAX)

/* Quanto si può ancora scorrere in ognuna delle quattro direzioni, in
   pixel. `mondo` è il riquadro del mondo in pixel di schermo
   (`Tela.riquadroMondo`), `vista` il suo angolo in alto a sinistra.

   Un mondo che ci sta tutto nello schermo non scorre in quella
   direzione, e non è un caso di scuola: la fattoria comincia con nove
   piazzole e allo zoom più largo ci stanno tutte in altezza. La Tela in
   quel caso centra il mondo (`limita()`), quindi «spazio zero» qui è la
   stessa cosa che dice lei, detta prima. */
export function spazioAttorno(vista, mondo, L, A) {
  const largo = mondo.w > L, alto = mondo.h > A
  return {
    sinistra: largo ? Math.max(0, vista.x - mondo.x) : 0,
    destra: largo ? Math.max(0, mondo.x + mondo.w - L - vista.x) : 0,
    su: alto ? Math.max(0, vista.y - mondo.y) : 0,
    giu: alto ? Math.max(0, mondo.y + mondo.h - A - vista.y) : 0,
  }
}

/* Quanto è «dentro» il dito, da 0 (sul filo interno della fascia) a 1
   (sul bordo dello schermo o più in là). Oltre il bordo non si accelera
   oltre il massimo: un dito che esce dalla finestra non deve far
   partire un razzo. */
const quanto = (distanza, fascia) => fra(0, (fascia - distanza) / fascia, 1)

const velocitaPer = q => q <= 0 ? 0 : VELOCITA_MIN + (VELOCITA_MAX - VELOCITA_MIN) * q * q

/* La spinta di questo fotogramma, in pixel da sommare alla vista.
   `dx` positivo vuol dire che la vista va a destra, cioè che il mondo
   scorre verso sinistra sotto il dito — la stessa convenzione che usa
   `Tela.vista`, così chi chiama somma e basta.

     punto   dove sta il dito, in pixel del riquadro (0,0 in alto a sx)
     L, A    quanto è largo e alto il riquadro
     vista   l'angolo in alto a sinistra del mondo, in pixel schermo
     mondo   il riquadro del mondo, in pixel schermo ({x,y,w,h})
     dt      i secondi passati dal fotogramma prima

   Le due direzioni si sottraggono invece di vincere una sull'altra: su
   uno schermo così stretto che le due fasce si sovrappongono — non
   dovrebbe succedere, ma il tetto della fascia da solo non lo
   garantisce su ogni telefono — al centro le due spinte si annullano,
   che è l'unica cosa sensata. Con un `if` la vista partirebbe da sola
   col dito fermo in mezzo allo schermo. */
export function spintaAlBordo({ punto, L, A, vista, mondo, dt,
                                fascia = null, velocita = velocitaPer }) {
  if (!punto || !(L > 0) || !(A > 0) || !(dt > 0)) return { dx: 0, dy: 0 }
  const f = fascia == null ? fasciaPer(L, A) : fascia
  const spazio = spazioAttorno(vista, mondo, L, A)

  let dx = (velocita(quanto(L - punto.x, f)) - velocita(quanto(punto.x, f))) * dt
  let dy = (velocita(quanto(A - punto.y, f)) - velocita(quanto(punto.y, f))) * dt

  dx = dx > 0 ? Math.min(dx, spazio.destra) : Math.max(dx, -spazio.sinistra)
  dy = dy > 0 ? Math.min(dy, spazio.giu) : Math.max(dy, -spazio.su)
  /* `|| 0` non è cerimonia: tagliando una spinta negativa contro uno
     spazio zero esce **meno zero**, che vale zero in ogni conto ma è un
     altro valore per `Object.is` — cioè per chi lo prova. Chi legge
     `dx` per sapere se c'è ancora qualcosa da fare merita uno zero
     solo. */
  return { dx: dx || 0, dy: dy || 0 }
}

/* ── IL RESTO CHE NON SI BUTTA ────────────────────────────────────
   La vista della fattoria è in **pixel interi** (`limita()` arrotonda:
   la pixel art su mezzo pixel si sfrangia), e una spinta lenta vale
   frazioni di pixel per fotogramma. Buttando la frazione, tutta la metà
   docile della fascia non muoverebbe niente — il dito è dentro, il
   numero esce giusto, e a schermo non succede assolutamente nulla.
   Perciò la frazione si tiene da parte e si somma al giro dopo.

   `nuovo` torna il passo intero da applicare adesso e il resto da
   ricordare; è una funzione e non due variabili in un modulo perché
   così si prova, e perché due fattorie aperte insieme (il banco di
   prova ne apre) non si scambiano il resto. */
export function conIlResto(resto, dx, dy) {
  const rx = resto.x + dx, ry = resto.y + dy
  const ix = Math.trunc(rx), iy = Math.trunc(ry)
  return { dx: ix, dy: iy, resto: { x: rx - ix, y: ry - iy } }
}
