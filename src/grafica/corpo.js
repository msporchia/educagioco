/* ═══════════════════════════════════════════════════════════════════
   LO SCHELETRO — quello che hanno in comune tutti i personaggi

   Uno scheletro solo per tutti — gambe, busto, braccia, testa nello
   stesso posto — e sopra ci si appende quello che cambia: il
   copricapo, la corazza, l'arma. È il motivo per cui camminano tutti
   allo stesso modo pur non somigliandosi per niente.

   Le quote (unità, i piedi a zero, l'alto è negativo):

       −20  cima della testa            ─┐  testa grossa, corpo corto:
       −15  centro della testa           │  la proporzione da pupazzo,
       −12  spalle                       │  quella che a 36 px si legge
       − 9  centro del busto             │  ancora
       − 5  cintura                     ─┘
         0  piedi

   ── la convenzione delle misure ──
   Tutto è in **unità**, non in pixel. Una cella della griglia vale 20
   unità: chi disegna passa `S = latoCella / 20` e la scena esce della
   taglia giusta su qualunque schermo. Un personaggio è alto 22 unità e
   sborda quindi un po' sopra la sua cella — è proprio quello che fa
   sembrare la griglia vista di tre quarti invece che dal cocuzzolo.

   ── la convenzione dei personaggi ──
   `dir` è uno di 'giu' (lo vedi in faccia), 'su' (di spalle), 'dx',
   'sx' (di profilo: il sinistro è il destro specchiato).
   `passo` è un intero che il gioco fa crescere di uno per cella: il
   ciclo di camminata è di quattro fotogrammi presi da tre pose.
   `stato` è 'normale' | 'attesa' | 'errore' | 'colpito' | 'ko' |
   'lancia' (quest'ultimo serve a chi tira incantesimi).

   ── la scheda di un personaggio ──
   Tutto quello che distingue un cavaliere da un orco sta in una voce
   di dati, e ogni voce ha il suo file in `personaggi/`:

     spalle   quanto è largo (unità dal centro)
     taglia   il moltiplicatore di scala: 0.68 il goblin, 1.12 il capitano
     arti     quanto sono grossi braccia e gambe (1 = normali, 0.6 stecchi)
     col      la tavolozza
     dietro?  quello che sta dietro a tutto (mantelli, faretre, scie)
     tronco   il busto
     testa    la testa
     arma?    quello che tiene in mano
     incanto? quello che succede in posa 'lancia'

   Chi aggiunge un personaggio scrive un file in `personaggi/` e una
   riga nel suo `indice.js`. Qui dentro non si tocca niente.
   ═══════════════════════════════════════════════════════════════════ */
import { capsula, tondo, mescola } from './comune.js'
import { tavolozzaStato, pensiero, botta } from './segni.js'
import { RESA } from './resa.js'

const CICLO = [0, 1, 0, -1]              // tre pose, quattro fotogrammi

/* ─────────── il dondolio della camminata ───────────
   `CICLO` sono quattro fotogrammi presi a numeri interi di celle, e
   per anni è stato il motivo per cui i personaggi **pattinavano**: la
   posizione scivola di continuo fra una casella e l'altra, la posa no,
   e le gambe scattavano solo nell'istante dell'arrivo. Da fermi non si
   notava; in movimento è la cosa che più di ogni altra diceva
   «prototipo».

   Il rimedio non costa niente, perché `[0, 1, 0, -1]` **è già** un
   seno campionato ai quarti: basta chiedergli la frazione di passo
   invece del numero di passi, e la stessa formula che dava quattro
   pose ne dà infinite. Chi disegna non cambia una riga: `sw` era un
   numero e resta un numero.

   `frazione` la mette in scena chi sa quanto manca all'arrivo — nel
   Generale è il campo, che è l'unico a sapere cos'è un pixel. */
function dondolio(passo, frazione) {
  if (!RESA.camminata) return CICLO[((passo | 0) % 4 + 4) % 4]
  return Math.sin(((passo | 0) + (frazione || 0)) * Math.PI / 2)
}

/* ─────────── l'ombra ───────────
   Era la stessa ellissi per tutti, sempre sotto i piedi, sempre della
   stessa opacità: un bollo grigio. Un'ombra però dice due cose che
   quel bollo non diceva — **da che parte viene la luce** e **quanto è
   attaccato al pavimento chi la fa** — ed è per questo che una figura
   con l'ombra giusta sembra posata e una senza sembra incollata.

   Quindi: si allunga dalla parte opposta alla fiamma più vicina, si
   accorcia e si scurisce quando la fiamma è addosso, e sfuma ai bordi
   invece di finire di netto. Al buio pesto non c'è ombra da fare: non
   c'è luce che la getti. */
function ombra(p, x, y, s, largo) {
  const L = (RESA.ombra && p.luce) ? p.luce(x, y) : null
  if (!L || !L.fuoco || L.forza < 0.03) {
    p.ellisse(x, y, largo * s, largo * 0.37 * s, '#00000032')
    return
  }
  const dx = x - L.fuoco.x, dy = (y - L.fuoco.y) / 0.82
  const d = Math.hypot(dx, dy) || 1
  // vicino alla fiamma l'ombra è corta e dura, lontano lunga e molle
  const tira = 0.5 + (1 - L.forza) * 1.5
  const cx = x + dx / d * largo * 0.42 * s * tira
  const cy = y + dy / d * largo * 0.16 * s * tira
  const c = p.ctx
  c.save()
  c.translate(cx, cy); c.rotate(Math.atan2(dy, dx)); c.scale(1, 0.37)
  const R = largo * s * (1 + tira * 0.35)
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R)
  const nero = Math.round((0.20 + L.forza * 0.34) * 255).toString(16).padStart(2, '0')
  g.addColorStop(0, '#000000' + nero)
  g.addColorStop(0.65, '#00000028')
  g.addColorStop(1, '#00000000')
  c.fillStyle = g
  c.beginPath(); c.arc(0, 0, R, 0, 6.29); c.fill()
  c.restore()
}

/* ─────────── lo stivale ───────────
   Era un'ellissi. Non «una forma semplificata»: proprio un ovale
   pieno di colore, che è il motivo per cui a guardarlo veniva da dire
   «i piedi sono un'ellisse» — è esattamente quello che erano.

   Uno stivale invece è tre cose sovrapposte, e sono poche righe: il
   gambale che scende dalla gamba, il collo del piede che sporge in
   avanti, e la **suola**, che è il pezzo che conta più di tutti
   perché è quello che appoggia per terra e dà alla figura il suo peso.
   Sopra, il risvolto in cima e un filo di luce sulla punta. */
function stivale(q, x, y, r, s, colore, scuro, bordo, sp, verso, materia) {
  if (!RESA.dettaglio) { tondo(q, x, y, r * 2.4 * s, r * 1.3 * s, colore, bordo, sp, materia); return }
  const l = r * s
  // il collo del piede, allungato nel verso in cui si guarda
  capsula(q, x + verso * l * 0.5, y - l * 0.5, l * 1.7, l * 0.95, l * 0.6, colore, bordo, sp, materia)
  // il gambale
  capsula(q, x - verso * l * 0.35, y - l * 1.25, l * 1.15, l * 1.2, l * 0.45, scuro, bordo, sp, materia)
  // la suola: piatta sotto, e sborda davanti
  capsula(q, x + verso * l * 0.55, y + l * 0.25, l * 1.8, l * 0.34, l * 0.3,
          mescola(scuro, '#000000', 0.45), bordo, sp * 0.8)
  // il risvolto in cima allo stivale
  capsula(q, x - verso * l * 0.3, y - l * 2.1, l * 1.3, l * 0.4, l * 0.3,
          mescola(colore, '#ffffff', 0.22))
  // la luce sulla punta, che è dove il cuoio si lucida
  tondo(q, x + verso * l * 1.0, y - l * 0.75, l * 0.4, l * 0.28, '#ffffff30')
}

/* le gambe: l'unica parte che si muove insieme alle braccia */
function arti(q, s, C, dir, sw, cfg) {
  const lat = dir === 'dx' || dir === 'sx'
  const bordo = C.bordo, sp = 0.7 * s
  /* di che è fatto: lo dichiara la scheda del personaggio, e chi non
     lo dice non ha materia — che per un ferro o un osso è la scelta
     giusta, non una mancanza */
  const mGambe = (cfg.materie && cfg.materie.gambe) || null
  const mScarpe = (cfg.materie && cfg.materie.scarpe) || null
  const bob = -Math.abs(sw) * 0.7 * s
  const g = cfg.arti || 1                  // stecchi da scheletro o zampe da orco

  if (lat) {
    /* di profilo le gambe non si sovrappongono mai del tutto: a piedi
       uniti il personaggio diventava un fuso, e la camminata spariva.
       Una resta indietro, l'altra avanti, e a ogni passo si scambiano. */
    const dietro = (sw * 2.2 - 1.3) * s, avanti = (-sw * 2.2 + 1.3) * s
    capsula(q, dietro, -3 * s + bob, 1.7 * s * g, 3.2 * s, 1.5 * s * g, C.gambeS, bordo, sp, mGambe)
    stivale(q, dietro - 0.6 * s, 0.1 * s + bob, 0.96 * g, s, C.scarpeS,
            mescola(C.scarpeS, '#000000', 0.2), bordo, sp, 1, mScarpe)
    capsula(q, avanti, -3 * s + bob, 1.8 * s * g, 3.2 * s, 1.5 * s * g, C.gambe, bordo, sp, mGambe)
    stivale(q, avanti + 0.6 * s, 0.1 * s + bob, 1 * g, s, C.scarpe,
            mescola(C.scarpe, '#000000', 0.2), bordo, sp, 1, mScarpe)
  } else {
    // di fronte o di spalle: chi alza il piede è più corto e sta più su
    for (const v of [-1, 1]) {
      const alza = (v < 0 ? sw : -sw) > 0 ? 1.2 * s : 0
      capsula(q, v * 2.5 * s, -3 * s - alza * 0.5 + bob, 1.8 * s * g, (3.2 * s - alza * 0.5), 1.5 * s * g,
              v < 0 ? C.gambe : C.gambeS, bordo, sp, mGambe)
      const col = v < 0 ? C.scarpe : C.scarpeS
      stivale(q, v * 2.5 * s, 0.1 * s - alza + bob, 1 * g, s, col,
              mescola(col, '#000000', 0.2), bordo, sp, v, mScarpe)
    }
  }
}

/* le braccia stanno sopra al busto: le disegna `persona` dopo il
   tronco, e torna dove sono finite le mani perché l'arma le segua.
   `alza` da 0 a 1 è la posa di chi tira un incantesimo: il braccio si
   solleva sopra la spalla, e la mano — cioè l'arma — lo segue. */
function braccia(q, s, C, dir, sw, cfg, alza = 0) {
  const lat = dir === 'dx' || dir === 'sx'
  const bordo = C.bordo, sp = 0.7 * s
  const mManica = (cfg.materie && cfg.materie.manica) || null
  const bob = -Math.abs(sw) * 0.7 * s
  const sp2 = cfg.spalle
  const g = cfg.arti || 1
  const mani = {}

  /* un braccio alzato: una capsula incernierata alla spalla e girata
     all'indietro, e la mano in cima. Torna dov'è finita la mano. */
  const alzato = (sx, sy, ang, manica, pelle) => {
    q.in(sx, sy, r => {
      capsula(r, 0, -3 * s, 1.35 * s * g, 3.4 * s, 1.2 * s * g, manica, bordo, sp)
      tondo(r, 0, -6 * s, 1.55 * s * g, 1.55 * s * g, pelle, bordo, sp)
    }, ang)
    // dove è finita la mano: il punto (0, −6) girato di `ang`
    return { x: sx + Math.sin(ang) * 6 * s, y: sy - Math.cos(ang) * 6 * s }
  }

  if (lat) {
    // il braccio dietro e quello davanti, sempre staccati fra loro
    const bx = (-1.9 - sw * 1.4) * s, fx = (2.4 + sw * 1.4) * s
    capsula(q, bx, -9 * s + bob, 1.3 * s * g, 3 * s, 1.2 * s * g, C.manicaS, bordo, sp, mManica)
    tondo(q, bx, -5.8 * s + bob, 1.5 * s * g, 1.5 * s * g, C.pelleS, bordo, sp)
    if (alza > 0) {
      mani.dx = alzato(1.8 * s, -12 * s + bob, 0.8 * alza, C.manica, C.pelle)
      mani.sx = { x: bx, y: -5.8 * s + bob }
      return mani
    }
    capsula(q, fx, -9 * s + bob, 1.4 * s * g, 3 * s, 1.3 * s * g, C.manica, bordo, sp, mManica)
    tondo(q, fx, -5.8 * s + bob, 1.6 * s * g, 1.6 * s * g, C.pelle, bordo, sp)
    mani.dx = { x: fx, y: -5.8 * s + bob }
    mani.sx = { x: bx, y: -5.8 * s + bob }
  } else if (alza > 0) {
    for (const v of [-1, 1]) {
      const m = alzato(v * (sp2 + 0.4) * s, -12 * s + bob, v * 0.55 * alza, C.manica, C.pelle)
      mani[v > 0 ? 'dx' : 'sx'] = m
    }
  } else {
    for (const v of [-1, 1]) {
      const ondeggia = v * sw * 1.1 * s
      const x = v * (sp2 + 1.3) * s
      capsula(q, x, -9 * s + bob + ondeggia * 0.3, 1.4 * s * g, 3 * s, 1.3 * s * g, C.manica, bordo, sp, mManica)
      tondo(q, x, -5.9 * s + bob + ondeggia * 0.6, 1.6 * s * g, 1.6 * s * g, C.pelle, bordo, sp)
    }
    mani.dx = { x: (sp2 + 1.3) * s, y: -5.9 * s + bob }
    mani.sx = { x: -(sp2 + 1.3) * s, y: -5.9 * s + bob }
  }
  return mani
}

/* Il personaggio intero. */
export function persona(p, cosa, S, cfg) {
  const s = S * (cfg.taglia || 1)
  const { x, y, dir = 'giu', passo = 0 } = cosa
  const stato = cosa.stato === 'sconfitto' ? 'ko' : (cosa.stato || 'normale')
  const t = p.tempo || 0
  const sw = stato === 'lancia' ? 0 : dondolio(passo, cosa.frazione)

  const { C, velo, giro, scarto } = tavolozzaStato(p, cfg.col, stato, t, x, y, s)
  const respiro = stato === 'attesa' ? Math.sin(t * 2.2) * 0.5 * s : 0
  // chi lancia si carica: le braccia salgono e restano su, con un
  // fremito lento — fermo del tutto sembrava una statua
  const alza = stato === 'lancia' ? 0.85 + 0.15 * Math.sin(t * 5) : 0

  // l'ombra resta per terra anche quando il personaggio è steso
  ombra(p, x, y, s, 6)

  const dipingi = q => {
    // steso: girato sul fianco e riportato al centro della cella, se no
    // il corpo finisce due caselle più in là di dov'è caduto
    if (giro) { q.ctx.translate(-10.5 * s, -1 * s); q.ctx.rotate(giro) }
    if (dir === 'sx') q.ctx.scale(-1, 1)
    q.ctx.translate(0, respiro)
    const d = dir === 'sx' ? 'dx' : dir
    if (cfg.dietro) cfg.dietro(q, s, C, d, sw, cfg, stato)
    arti(q, s, C, d, sw, cfg)
    cfg.tronco(q, s, C, d, sw, cfg, stato)
    const mani = braccia(q, s, C, d, sw, cfg, alza)
    if (cfg.arma) cfg.arma(q, s, C, d, sw, mani, stato)
    // di profilo la testa sta un dito più avanti del busto: è il segno
    // che dice «sta guardando di là» prima ancora della faccia
    q.in(d === 'dx' ? 0.9 * s : 0, (-15.4 - Math.abs(sw) * 0.7) * s,
         r => cfg.testa(r, s, C, d, stato))
    if (alza && cfg.incanto) cfg.incanto(q, s, C, d, mani, t)
  }

  p.velo(velo, () => p.in(x + scarto, y, dipingi))

  if (stato === 'attesa') pensiero(p, x, y - 23 * s, s, t)
  if (stato === 'colpito') botta(p, x, y - 12 * s, s, t)
}

/* ═══════════════════════════════════════════════════════════════════
   L'ALTRO SCHELETRO: QUATTRO ZAMPE

   Un cane non è un omino più basso: ha il corpo per il lungo, la testa
   davanti e non sopra, e cammina a due tempi incrociati. Vale la pena
   di un secondo scheletro — ma **gli stati sono gli stessi**, e per
   questo passano tutti e due da `tavolozzaStato`.

   Le quote (unità, le zampe a zero):
       −13  orecchie
       − 9  testa
       − 6  groppa
       − 3  pancia
         0  zampe
   ═══════════════════════════════════════════════════════════════════ */
export function bestia(p, cosa, S, cfg) {
  const s = S * (cfg.taglia || 1)
  const { x, y, dir = 'giu', passo = 0 } = cosa
  const stato = cosa.stato === 'sconfitto' ? 'ko' : (cosa.stato || 'normale')
  const t = p.tempo || 0
  const sw = dondolio(passo, cosa.frazione)

  const { C, velo, giro, scarto } = tavolozzaStato(p, cfg.col, stato, t, x, y, s)
  const respiro = stato === 'attesa' ? Math.sin(t * 2.4) * 0.4 * s : 0

  ombra(p, x, y, s, 6.5)
  p.velo(velo, () => p.in(x + scarto, y, q => {
    if (giro) { q.ctx.translate(-7 * s, -1 * s); q.ctx.rotate(giro) }
    if (dir === 'sx') q.ctx.scale(-1, 1)
    q.ctx.translate(0, respiro)
    cfg.disegna(q, s, C, dir === 'sx' ? 'dx' : dir, sw, stato)
  }))

  if (stato === 'attesa') pensiero(p, x, y - 17 * s, s, t)
  if (stato === 'colpito') botta(p, x, y - 8 * s, s, t)
}
