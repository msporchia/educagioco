/* ═══════════════════════════════════════════════════════════════════
   LA MONGOLFIERA: QUANTE CASSE, E QUANTO RENDONO

   Dato puro, come `dati/mercato.js` di cui è la sorella: i numeri
   stanno qui, le regole — cosa si chiede, cosa succede consegnando,
   quando riparte — in `motore/mongolfiera.js`. Il progetto è in
   `docs/fattoria-albero.md` §8.3, «La mongolfiera».

   ── PERCHÉ È DIVERSA DAL BANCO ────────────────────────────────────
   Il banco è il camion di Hay Day: ordini piccoli, sempre, che si
   consegnano tutti interi. La mongolfiera è **la nave**: un ordine
   grosso — tre file di casse, una merce per fila — che **si riempie un
   po' alla volta**. Ogni cassa si consegna da sola e rende subito, e
   quello che la rende diversa da un ordine è che non serve avere
   tutto: serve tornare.

   Chiede solo **prodotti finiti**: merci con due fasi o più
   (`profonditaDi`) che **non sono mangime** (`mangime: true` in
   `dati/coltivazioni.js`). Il grano crudo lo chiede già il banco, e una
   fila di casse di grano sarebbe un ordine grosso fatto di niente; il
   foraggio e la zuppa della stalla sono roba che serve dentro la
   fattoria, e caricarli su un pallone è come mandare in viaggio il
   fieno delle mucche — Hay Day non lo fa, e qui la prima versione lo
   faceva. Qui si portano le cose che si mangiano, si vestono, si
   regalano.

   ── IL PREMIO ─────────────────────────────────────────────────────
   Una cassa rende **quello che renderebbero i suoi pezzi al banco**,
   senza la base dell'ordine (`premioDelPezzo`, §8.2): la base al banco
   paga il gesto di consegnare un ordine intero, e qui i gesti sono
   tanti e piccoli. Sopra ci sono due bonus, che sono la ragione per
   riempirla davvero invece di mandarla via a metà:

     una fila piena        +25% del premio delle sue casse
     tutto pieno           +50% del premio di tutte le casse,
                           e una sorpresa della fiera

   **Il bonus è esperienza, mai monete**, come tutto quello che la
   fattoria dà (`dati/mercato.js`, «E PERCHÉ NON PAGA MONETE»). La
   sorpresa è una decorazione che non si compra (`fiera: true` in
   `dati/catalogo.js`): il premio che si colleziona, e che non è una
   moneta travestita — non si rivende, non si spende.

   ── IL TETTO ──────────────────────────────────────────────────────
   Lo stesso del banco: **quello che una merce rende non supera mai
   `MONETE_AL_MINUTO` per ogni minuto che costa farla**, contato sul
   caso peggiore — tutte le casse di quella merce, tutti i bonus. Il
   conto sta in `guastiDellaMongolfiera`, e oggi non morde: il più
   stretto sta a un terzo del tetto.
   ═══════════════════════════════════════════════════════════════════ */
import { PRODOTTI, profonditaDi } from './coltivazioni.js'
import { premioDelPezzo, minutiDi, MONETE_AL_MINUTO } from './mercato.js'

/* Le file: tre, e **quattro dal livello 66** — «la mongolfiera
   grande». Non si compra: è il pallone che cresce col livello, e
   chiude il buco fra il sushi (63) e la fine del catalogo. */
export const FILE = 3
export const FILE_GRANDE = 4
export const LIVELLO_GRANDE = 66

/* Le casse di una fila, e i pezzi di una cassa. Nove casse al massimo
   con tre file, come la nave; dodici con la grande. */
export const CASSE_MIN = 2
export const CASSE_MAX = 3
export const PEZZI_MIN = 1
export const PEZZI_MAX = 3

/* Le fasi minime di una merce per salire in una cassa. */
export const FASI_MIN = 2

export const BONUS_FILA = 0.25
export const BONUS_TUTTO = 0.5

/* Quanto resta vuoto il cielo dopo una partenza. Un'ora: il tempo di
   rifare una scorta, non di dimenticarsene. */
export const CIELO_VUOTO_MIN = 60

/* Quante file ha il pallone che atterra a questo livello. */
export const fileAl = livello => (livello | 0) >= LIVELLO_GRANDE ? FILE_GRANDE : FILE

/* Se una merce può salire in una cassa: si produce, e passa da almeno
   una macchina. */
export const merceDaCassa = p =>
  !!PRODOTTI[p] && !PRODOTTI[p].mangime &&
  Number.isFinite(profonditaDi(p)) && profonditaDi(p) >= FASI_MIN

/* Quanto rende una cassa di `pezzi` pezzi di questa merce. Si arrotonda
   **per cassa**, perché è per cassa che si consegna e si legge. */
export const premioDellaCassa = (merce, pezzi) => Math.round(premioDelPezzo(merce) * pezzi)

/* I due bonus, dato il premio delle casse che riguardano. */
export const bonusDellaFila = premioCasse => Math.round(BONUS_FILA * premioCasse)
export const bonusDelTutto = premioCasse => Math.round(BONUS_TUTTO * premioCasse)

export function guastiDellaMongolfiera() {
  const g = []
  if (!(CASSE_MIN >= 1 && CASSE_MAX >= CASSE_MIN)) g.push('le casse di una fila non stanno in piedi')
  if (!(PEZZI_MIN >= 1 && PEZZI_MAX >= PEZZI_MIN)) g.push('i pezzi di una cassa non stanno in piedi')
  /* Otto è `SCOMPARTO_BASE`: una cassa che chiede più di quanto tenga
     uno scomparto appena costruito non si riempirebbe mai. */
  if (PEZZI_MAX > 8) g.push('una cassa chiede più di quanto tenga uno scomparto')
  if (!(FILE_GRANDE > FILE)) g.push('la mongolfiera grande non è più grande')
  if (!(CIELO_VUOTO_MIN > 0)) g.push('il cielo non resta mai vuoto: «Parti!» diventa un rimescola')
  /* ── IL TETTO, SUL CASO PEGGIORE ────────────────────────────────
     Per ogni merce da cassa: una fila intera di quella merce, casse
     piene fino in cima, e tutti e due i bonus. Il bonus del tutto è la
     metà di **tutte** le casse, quindi per merce vale la metà delle
     sue: contarlo così è esatto, non una stima. */
  for (const p of Object.keys(PRODOTTI)) {
    if (!merceDaCassa(p)) continue
    const m = minutiDi(p)
    if (!Number.isFinite(m) || !(m > 0)) { g.push(`${p}: non ha un tempo, il tetto non tiene`); continue }
    const casse = CASSE_MAX * premioDellaCassa(p, PEZZI_MAX)
    const reso = casse + bonusDellaFila(casse) + bonusDelTutto(casse)
    const tempo = MONETE_AL_MINUTO * m * CASSE_MAX * PEZZI_MAX
    if (reso > tempo)
      g.push(`una fila di ${p} rende ${reso} e costa ${tempo} di tempo: troppo`)
  }
  return g
}
