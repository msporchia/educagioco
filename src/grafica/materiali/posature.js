/* ═══════════════════════════════════════════════════════════════════
   LE POSATURE — otto modi di stare per terra

   Il compagno di `varianti.js`: là si decide **dove** il pavimento
   cambia (un reticolo di macchie larghe cinque celle), qui che cosa
   vuol dire cambiare. Una posatura è una funzione

       (c, cx, cy, raggio, A, lato, r)

   che dipinge dentro una macchia e non sa niente del resto: né dove
   sono i muri (arrivano dopo e la coprono), né chi ci camminerà sopra.
   Aggiungerne una è una voce in `POSATURE` più il suo nome nel
   sacchetto di un ambiente, e nient'altro.

   ── perché le macchie non hanno un colore proprio ──
   La prima versione tingeva col `chiazze[0]` dell'ambiente, e nelle
   stanze chiare non si vedeva niente: schiarire un pavimento già
   chiaro non è un contrasto, è la stessa tinta. Quello che si vede è
   sempre uno **scostamento**, e chi scurisce lo fa moltiplicando, chi
   schiarisce sommando: così vale uguale nella cripta e nel cortile.

   L'alone largo abbassa o alza il tono di un dieci-venti per cento; i
   segni piccoli sopra stanno sotto il mezzo di velo. Si deve vedere
   che *lì è diverso*, non che lì c'è qualcosa.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, ell, velo } from '../comune.js'
import { crepa } from './semina.js'

/* roba sparsa dentro un disco schiacciato, più fitta verso il centro.
   Il quarto argomento è **quanto si è vicini al cuore** (1 al centro,
   0 sul bordo): moltiplicandoci il velo, la macchia si spegne da sola
   e non ha un contorno. Senza, una chiazza di ghiaia finisce con una
   linea netta e sembra un tappetino appoggiato lì. */
function sparso(cx, cy, raggio, quanti, r, fn) {
  for (let k = 0; k < quanti; k++) {
    const a = r(k, 1) * 6.2832
    const q = Math.pow(r(k, 2), 0.62)
    const d = raggio * q
    fn(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.78,
       m => r(k, 10 + m), Math.min(1, (1 - q) * 2.2))
  }
}

/* l'alone morbido: il velo largo che dice «qui la stanza cambia».

   Due scelte, e sono tutte e due state pagate a caro prezzo:

   · è un **gradiente**, non un'ellisse a velo. Un'ellisse piena al
     dieci per cento ha comunque un bordo, e il bordo si vede più
     della macchia.
   · si posa in `multiply` o in `screen`, non in `source-over`. Un
     velo grigio sopra un pavimento a lastroni **spegne il lastrone**:
     smorza il filo di luce e l'ombra di ogni pietra insieme al fondo,
     e la macchia si vede solo se la si tira così forte che diventa
     una nuvola. Moltiplicato, invece, il pavimento *si abbassa di
     tono* tenendosi tutto il suo rilievo — è la differenza fra una
     zona in ombra e una macchia di vernice.

   Il colore arriva come '#rrggbb' e l'opacità gli si attacca in coda
   in esadecimale. Per `multiply` è un grigio chiaro (quanto scurisce),
   per `screen` un grigio scuro (quanto schiarisce). */
function alone(c, cx, cy, R, col, a, modo = 'multiply') {
  const q = v => col + Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')
  const prima = c.globalCompositeOperation
  c.save()
  c.globalCompositeOperation = modo
  c.translate(cx, cy); c.scale(1, 0.72)
  const g = c.createRadialGradient(0, 0, R * 0.08, 0, 0, R)
  g.addColorStop(0, q(a)); g.addColorStop(0.5, q(a * 0.8))
  g.addColorStop(0.84, q(a * 0.3)); g.addColorStop(1, q(0))
  c.fillStyle = g
  c.beginPath(); c.arc(0, 0, R, 0, 6.29); c.fill()
  c.restore()
  c.globalCompositeOperation = prima
}

const NOTTE = '#151220'                       // lo scuro comune a tutte

/* quanto è chiara una tinta, da 0 a 1 */
const luce = c => (parseInt(c.slice(1, 3), 16) * 0.3 + parseInt(c.slice(3, 5), 16) * 0.59 +
                   parseInt(c.slice(5, 7), 16) * 0.11) / 255

/* Quanto tirare una macchia. **Non è un numero fisso**, e la grotta è
   il motivo: scurire una stanza già scura la affoga — due macchie
   sovrapposte e il pavimento diventa un buco nero in cui il rilievo
   dei massi sparisce — mentre schiarire una stanza già chiara non si
   vede per niente. La forza è quindi *quanto margine c'è da quella
   parte*: si scurisce tanto dove il pavimento è chiaro, si schiarisce
   tanto dove è scuro. */
const giu = (A, q) => 0.18 + luce(A.lastra[0]) * q
const su = (A, q) => 0.18 + (1 - luce(A.lastra[0])) * q

export const POSATURE = {

  /* la più importante di tutte: il pavimento com'è, e basta */
  liscio() {},

  /* consumato dal passaggio: la lastra spianata e un po' sporca, con
     gli aloni lisci di chi ci ha camminato sopra per anni */
  usura(c, cx, cy, R, A, lato, r) {
    const s = lato / 20, col = mescola(A.chiazze[0], '#fff3d8', 0.4)
    alone(c, cx, cy, R, '#4a4438', su(A, 0.5), 'screen')
    sparso(cx, cy, R * 0.86, 26, r, (x, y, d, v) => {
      const rx = (1.6 + d(1) * 3.4) * s
      velo(c, (0.08 + d(2) * 0.1) * v, () =>
        ell(c, x, y, rx, rx * (0.4 + d(3) * 0.3), col))
    })
  },

  /* la zona d'ombra: bagnata, sporca, o solo più bassa */
  ombra(c, cx, cy, R, A, lato, r) {
    const s = lato / 20, col = mescola(A.chiazze[1], NOTTE, 0.4)
    alone(c, cx, cy, R, '#7f7a94', giu(A, 0.52))
    sparso(cx, cy, R * 0.84, 24, r, (x, y, d, v) => {
      const rx = (1.8 + d(1) * 3.6) * s
      velo(c, (0.09 + d(2) * 0.11) * v, () =>
        ell(c, x, y, rx, rx * (0.35 + d(3) * 0.3), col))
    })
  },

  /* il ghiaino: tanti granelli grandi un pixel o due. È il modo più
     economico di dire «qui il pavimento è rotto» senza rompere niente */
  detriti(c, cx, cy, R, A, lato, r) {
    const s = lato / 20
    alone(c, cx, cy, R * 0.9, '#9b958c', giu(A, 0.42))
    sparso(cx, cy, R * 0.92, 150, r, (x, y, d, v) => {
      const rx = (0.32 + d(1) * 0.7) * s
      velo(c, (0.32 + d(2) * 0.44) * v, () => {
        ell(c, x, y, rx, rx * 0.8, mescola(A.sasso, NOTTE, 0.12 + d(3) * 0.4))
        if (d(4) > 0.62) ell(c, x - rx * 0.3, y - rx * 0.3, rx * 0.42, rx * 0.3,
                             mescola(A.sasso, '#ffffff', 0.35))
      })
    })
  },

  /* le screpolature: fini, corte, mai una rete */
  screpolato(c, cx, cy, R, A, lato, r) {
    const s = lato / 20
    alone(c, cx, cy, R * 0.95, '#9892a0', giu(A, 0.4))
    sparso(cx, cy, R * 0.88, 20, r, (x, y, d, v) => {
      velo(c, (0.34 + d(1) * 0.32) * v, () =>
        crepa(c, x, y, (3 + d(2) * 4) * s, A.giunto, d))
    })
  },

  /* i licheni: verde tenue a chiazzette, mai un prato */
  licheni(c, cx, cy, R, A, lato, r) {
    const s = lato / 20
    alone(c, cx, cy, R * 0.92, A.muschio, 0.22, 'source-over')
    sparso(cx, cy, R * 0.88, 110, r, (x, y, d, v) => {
      const rx = (0.55 + d(1) * 1.25) * s
      velo(c, (0.2 + d(2) * 0.28) * v, () =>
        ell(c, x, y, rx, rx * (0.5 + d(3) * 0.4),
            d(4) > 0.55 ? A.muschio : mescola(A.muschio, NOTTE, 0.3)))
    })
  },

  /* la polvere: velo neutro e puntini finissimi. È la variante dei
     posti nobili — non si sporcano, si impolverano */
  polvere(c, cx, cy, R, A, lato, r) {
    const s = lato / 20, col = mescola(A.chiazze[0], '#fff3d8', 0.55)
    alone(c, cx, cy, R, '#554c3c', su(A, 0.5), 'screen')
    sparso(cx, cy, R * 0.92, 90, r, (x, y, d, v) => {
      const rx = (0.28 + d(1) * 0.52) * s
      velo(c, (0.2 + d(2) * 0.26) * v, () => ell(c, x, y, rx, rx * 0.85, col))
    })
  },

  /* il bagnato: pozzette scure con un filo di riflesso sopra */
  umidiccio(c, cx, cy, R, A, lato, r) {
    const s = lato / 20
    alone(c, cx, cy, R, '#6f7c8e', giu(A, 0.6))
    sparso(cx, cy, R * 0.88, 40, r, (x, y, d, v) => {
      const rx = (0.9 + d(1) * 2.1) * s
      velo(c, (0.22 + d(2) * 0.22) * v, () => {
        ell(c, x, y, rx, rx * 0.42, '#0d1418')
        ell(c, x - rx * 0.2, y - rx * 0.1, rx * 0.5, rx * 0.14, '#9fd8ff')
      })
    })
  },
}

