/* ═══════════════════════════════════════════════════════════════════
   LA PISTA — il disegno, che di regole non sa niente

   Riceve una scena già decisa (`Partita.scena()`): questo cancello è
   d'oro, questo mostro è un boss, questi soldati sono di grado 2. Qui
   dentro non si sa cosa sia un esercizio, quanto valga un moltiplicatore
   o perché la truppa cresca — si sa solo dove va messo un pixel.

   ═══════════════════════════════════════════════════════════════════
   PERCHÉ LA STRADA È LARGA COSÌ

   Nel prototipo la strada occupava sì e no il quaranta per cento della
   vista: il resto era prato e cielo. È esattamente al contrario di dove
   guarda chi gioca — sul prato non succede niente, e i tre cancelli fra
   cui bisogna scegliere stavano schiacciati in una fascia stretta in
   mezzo allo schermo. Su un telefono in mano a un bambino quella fascia
   è larga quanto due dita.

   Tre leve, e vanno mosse insieme:

     ORIZZONTE   il cielo si prende un settimo dello schermo e basta.
                 È bello, ma non ci si gioca.
     LARGHEZZA   la corsia è larga più di un terzo dello schermo, quindi
                 la strada al piede del giocatore **esce dai bordi**. È
                 giusto che esca: la banchina non serve a niente, e i
                 pochi centimetri di prato che restano bastano agli
                 alberi che sfilano.
     STRETTA     quanto in fretta le cose rimpiccioliscono. Dimezzata
                 rispetto al prototipo. Non è solo estetica: una
                 prospettiva più dolce tiene la strada larga anche
                 lontano — e i cancelli restano **leggibili da
                 quaranta metri**, che è tutto il tempo che si ha per
                 decidere.

   Misurato sull'area davvero dipinta, su un telefono da 390×732: il
   prototipo arrivava al **44%** della vista, questi numeri la portano al
   **57%**, e i tre cancelli arrivano larghi un dito ciascuno. Oltre non
   si va allargando ancora la corsia — a `LARGHEZZA 0.42` i cancelli
   laterali cominciano a uscire dallo schermo, e una scelta che non si
   vede tutta non è una scelta.
   ═══════════════════════════════════════════════════════════════════ */
import { ORDINI } from '../dati/ordini.js'
import { veste as vestito } from '../dati/vesti.js'

const ORIZZONTE = 0.12      // dove finisce il cielo, in altezze di schermo
const PIEDI = 0.95          // dove tocca terra quello che ti sta addosso
/* Larghezza della corsia e larghezza della strada sono **due numeri
   diversi**, e tenerli separati serve: la strada deve uscire dai bordi
   dello schermo, ma la corsia di destra non deve arrivarci — se no la
   truppa schierata ci finisce sopra e l'ultima fila resta tagliata. Il
   prodotto dei due è quello che decide quanta vista prende l'asfalto. */
const LARGHEZZA = 0.335     // quanto è larga una corsia, in larghezze di schermo
const LARGA_MAX = 215       // ...ma su un tablet non oltre questo
/* Una prospettiva **dolce**. Non è un gusto: con la stretta del prototipo
   la strada a venti metri era già un terzo di quella sotto i piedi, e
   quello che restava ai lati era prato — cioè metà schermo dedicata a
   qualcosa dove non succede niente. Dimezzata due volte, a venti metri la
   strada è ancora larga più della metà, i cancelli si leggono da lontano,
   e il verde si riduce a due cunei che la foschia finisce di cancellare. */
const STRETTA = 0.034       // quanto in fretta si stringe con la distanza
const BORDO = 1.76          // dove finisce l'asfalto, in corsie
const BANCHINA = 1.15       // e dove finisce la terra battuta, in bordi
const FONDO = 900           // fin dove si disegna la strada: oltre è foschia

export class Pista {
  constructor(tela) {
    this.tela = tela
    this.ctx = tela.getContext('2d')
    this.brividi = []
    this.striscia = 0
    this.misura()
  }

  get larghezza() { return this.W }
  get altezza() { return this.H }

  misura() {
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1)
    const r = this.tela.getBoundingClientRect()
    this.W = Math.max(1, Math.round(r.width))
    this.H = Math.max(1, Math.round(r.height))
    this.tela.width = Math.round(this.W * dpr)
    this.tela.height = Math.round(this.H * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.oriz = this.H * ORIZZONTE
    this.piedi = this.H * PIEDI
    this.larg = Math.min(this.W * LARGHEZZA, LARGA_MAX)
  }

  /* L'unica funzione che sa dove finisce un punto della pista sullo
     schermo. Tutto il resto del disegno passa da qui, così la strada e
     le cose sopra non possono mai andare fuori registro. */
  punto(corsia, z) {
    const s = 1 / (1 + Math.max(z, -0.9) * STRETTA)
    return { s, x: this.W / 2 + corsia * this.larg * s, y: this.oriz + (this.piedi - this.oriz) * s }
  }

  /* i coriandoli: li chiede chi coordina quando succede qualcosa, e non
     sanno perché — sanno solo di che colore sono */
  scoppio(corsia, colore, quanti = 18) {
    const p = this.punto(corsia, 0)
    for (let i = 0; i < quanti; i++)
      this.brividi.push({
        x: p.x, y: p.y - this.H * 0.06, c: colore,
        vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 480 - 60,
        vita: 0.5 + Math.random() * 0.4,
      })
  }

  disegna(s, dt = 0) {
    const { ctx } = this
    /* la scena porta il **nome** del vestito, non le sue tinte: chi gioca
       non deve conoscere un colore, e qui i colori si vanno a prendere */
    const v = vestito(s.veste)
    const scossa = s.scossa || 0
    ctx.save()
    if (scossa) ctx.translate((Math.random() - 0.5) * scossa * 0.6, (Math.random() - 0.5) * scossa * 0.4)

    this.cielo(v, s.dist)
    this.strada(v, s.dist)
    this.contorno(v, s.dist)

    for (const c of s.cose) {
      if (c.che === 'cancelli') this.cancelli(c)
      else if (c.che === 'nemici') this.nemici(c, v)
      else if (c.che === 'traguardo') this.traguardo(c)
      else if (c.che === 'cono') this.cosetta(c, '🚧')
      else if (c.che === 'cassa') this.cassa(c)
    }
    this.colpi(s.colpi)
    this.truppa(s)
    this.corsa(s.spinta || 0)

    this.particelle(dt)
    ctx.restore()
  }

  /* ═══════════ il fondale ═══════════
     Tre piani a velocità diverse — nuvole lentissime, colline lente,
     alberi a bordo strada veloci: è la parallasse a dire «stai
     correndo», più della strada stessa. */
  cielo(v, dist) {
    const { ctx, W } = this
    const o = this.oriz
    const g = ctx.createLinearGradient(0, 0, 0, o * 1.06)
    g.addColorStop(0, v.cielo[0]); g.addColorStop(0.55, v.cielo[1]); g.addColorStop(1, v.cielo[2])
    ctx.fillStyle = g
    ctx.fillRect(-40, -40, W + 80, o + 42)

    if (!v.buio) {
      ctx.fillStyle = '#fff6c0'
      ctx.beginPath(); ctx.arc(W * 0.8, o - this.H * 0.075, Math.min(W, this.H) * 0.042, 0, 7); ctx.fill()
    }
    for (let i = 0; i < 3; i++) {
      const larg = W * 1.9
      const x = W * 1.35 - ((dist * 2.2 + i * 430) % larg)
      this.nuvola(x, o * (0.22 + i * 0.2), Math.min(W, this.H) * (0.045 + i * 0.013), v.buio)
    }

    // due creste: la lontana più chiara, come si vede davvero la distanza
    for (const [i, colore] of v.colline.entries()) {
      ctx.fillStyle = colore
      ctx.beginPath(); ctx.moveTo(-40, o + 2)
      ctx.quadraticCurveTo(W * (0.18 + i * 0.12), o - this.H * (0.075 - i * 0.03), W * (0.46 + i * 0.16), o + 2)
      ctx.quadraticCurveTo(W * (0.72 + i * 0.12), o - this.H * (0.095 - i * 0.035), W + 40, o + 2)
      ctx.closePath(); ctx.fill()
    }
  }

  nuvola(x, y, r, buio) {
    const { ctx } = this
    ctx.fillStyle = buio ? '#ffffff22' : '#ffffffdd'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 7); ctx.arc(x + r * 0.9, y + r * 0.2, r * 0.75, 0, 7)
    ctx.arc(x - r * 0.9, y + r * 0.25, r * 0.6, 0, 7); ctx.arc(x + r * 0.1, y + r * 0.5, r * 0.8, 0, 7)
    ctx.fill()
  }

  /* ═══════════ la strada ═══════════
     Si disegna fino a molto lontano (`FONDO`) e non fino a dove arrivano
     i cancelli: con una prospettiva dolce, fermarla a quaranta metri
     lascerebbe un moncone largo un dito appeso in mezzo al cielo. Quello
     che resta lo cancella la foschia, che è anche l'unica cosa che dà
     profondità a un fondale disegnato con quattro poligoni. */
  strada(v, dist) {
    const { ctx, W, H } = this
    const o = this.oriz
    const g = ctx.createLinearGradient(0, o, 0, H)
    g.addColorStop(0, v.terra[0]); g.addColorStop(1, v.terra[1])
    ctx.fillStyle = g
    ctx.fillRect(-40, o - 1, W + 80, H - o + 40)

    const bordo = (c, p) => W / 2 + c * this.larg * BORDO * p.s
    const nastro = (larghezza, colore) => {
      const a = this.punto(0, FONDO), b = this.punto(0, -1)
      ctx.fillStyle = colore
      ctx.beginPath()
      ctx.moveTo(bordo(-larghezza, a), a.y); ctx.lineTo(bordo(larghezza, a), a.y)
      ctx.lineTo(bordo(larghezza, b), b.y); ctx.lineTo(bordo(-larghezza, b), b.y)
      ctx.closePath(); ctx.fill()
    }

    nastro(BANCHINA, v.banchina)
    nastro(1, v.strada)

    /* ── niente fasce a tutta larghezza ──
       C'erano, e sfarfallavano. Una campitura che copre l'intera strada
       ha un bordo lungo quanto la strada è larga, e in prospettiva quel
       bordo finisce sotto il pixel man mano che si allontana: il browser
       lo arrotonda a un lato o all'altro un fotogramma sì e uno no, e su
       una superficie grande quel salto si legge come un lampeggio.

       Sono state tolte e non sostituite. La velocità la dicono già i
       tratteggi fra le corsie e gli alberi che sfilano a bordo strada, e
       quelli sono figure **strette**: quando diventano sub-pixel
       sbiadiscono e basta, invece di far battere le palpebre a tutto lo
       schermo. */

    // le due righe fra le corsie: dicono dove finisce una scelta e dove
    // comincia l'altra, ed è l'unica cosa che le separa
    for (let i = 0; i < 24; i++) {
      const z0 = i * 4 - (dist % 8), z1 = z0 + 2
      if (z1 < -1 || z0 > 70) continue
      /* i tratteggi lontani si spengono invece di ridursi a un puntino
         che tremola: sotto una certa scala non dicono più niente */
      ctx.fillStyle = v.righe + 'bb'
      ctx.globalAlpha = Math.min(1, Math.max(0, (70 - z0) / 26))
      for (const c of [-0.5, 0.5]) {
        const a = this.punto(0, Math.max(z0, -1)), b = this.punto(0, Math.max(z1, -1))
        const xa = W / 2 + c * this.larg * a.s, xb = W / 2 + c * this.larg * b.s
        ctx.beginPath()
        ctx.moveTo(xa - 2 * a.s, a.y); ctx.lineTo(xa + 2 * a.s, a.y)
        ctx.lineTo(xb + 2 * b.s, b.y); ctx.lineTo(xb - 2 * b.s, b.y)
        ctx.closePath(); ctx.fill()
      }
    }
    ctx.globalAlpha = 1

    ctx.strokeStyle = v.righe + 'cc'
    ctx.lineWidth = 2.5
    const lontano = this.punto(0, 120), vicino = this.punto(0, -1)
    for (const c of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(bordo(c, lontano), lontano.y); ctx.lineTo(bordo(c, vicino), vicino.y)
      ctx.stroke()
    }

    /* ── la foschia, che fa due mestieri ──
       Nasconde il punto in cui la strada finisce, e **si mangia il prato
       lontano**. Il secondo è quello che conta: sotto l'orizzonte, dove
       la strada è ancora stretta, restano due cunei di verde che l'occhio
       legge come «il gioco è un nastrino in mezzo a un campo». La
       prospettiva da sola non li può togliere — è geometria, non una
       scelta — ma sfumati nel colore dell'aria smettono di esistere. */
    const f = ctx.createLinearGradient(0, o - 2, 0, o + H * 0.17)
    f.addColorStop(0, v.cielo[2]); f.addColorStop(0.45, v.cielo[2] + '90')
    f.addColorStop(1, v.cielo[2] + '00')
    ctx.fillStyle = f
    ctx.fillRect(-40, o - 2, W + 80, H * 0.18)
  }

  /* Quello che sfila a lato. Non decora: è la cosa che *si vede* passare,
     e senza qualcosa che passa vicino la velocità non si sente — il
     fondale lontano si muove troppo poco per dirla. */
  contorno(v, dist) {
    /* Si arriva **fino all'orizzonte**, non a centocinquanta metri. Con
       la prospettiva dolce la fila di alberi finiva a mezza altezza e
       sopra restava una fascia di prato vuota larga tutto lo schermo —
       quella «montagna» che si vedeva sotto il cielo. Portata fino in
       fondo, la fila si chiude in una macchia di bosco e il verde piatto
       sparisce: costa una quarantina di figure, quasi tutte grandi come
       un'unghia. */
    const PASSO = 7
    const FIN_LA = 300
    const primo = Math.ceil((dist - 1) / PASSO) * PASSO
    for (let z = primo + FIN_LA; z >= primo - PASSO; z -= PASSO) {
      const zr = z - dist
      if (zr < -1.5 || zr > FIN_LA) continue
      const n = Math.round(z / PASSO)
      const lato = n % 2 ? 1 : -1
      const fuori = BORDO * BANCHINA + 0.25 + ((n * 7) % 5) * 0.16
      this.aLato(v, this.punto(lato * fuori, zr), n)
    }
  }

  aLato(v, p, seme) {
    const { ctx } = this
    const h = this.H * 0.28 * p.s
    if (h < 1.5 || p.x < -this.W * 0.4 || p.x > this.W * 1.4) return
    ctx.globalAlpha = Math.min(1, Math.max(0, (300 - (1 / p.s - 1) / STRETTA) / 90))
    ctx.fillStyle = '#00000018'
    ctx.beginPath(); ctx.ellipse(p.x, p.y, h * 0.22, h * 0.06, 0, 0, 7); ctx.fill()
    const chioma = v.chioma[seme % v.chioma.length]

    if (v.bordo === 'lampione') {
      ctx.fillStyle = '#5a5f70'
      ctx.fillRect(p.x - h * 0.035, p.y - h, h * 0.07, h)
      ctx.fillStyle = chioma
      ctx.beginPath(); ctx.arc(p.x, p.y - h * 1.02, h * 0.11, 0, 7); ctx.fill()
      ctx.globalAlpha *= 0.35
      ctx.beginPath(); ctx.arc(p.x, p.y - h * 1.02, h * 0.26, 0, 7); ctx.fill()
    } else if (v.bordo === 'pino') {
      ctx.fillStyle = '#6b4a2c'
      ctx.fillRect(p.x - h * 0.04, p.y - h * 0.3, h * 0.08, h * 0.3)
      ctx.fillStyle = chioma
      for (let i = 0; i < 3; i++) {
        const q = p.y - h * (0.24 + i * 0.24), l = h * (0.3 - i * 0.07)
        ctx.beginPath()
        ctx.moveTo(p.x, q - h * 0.36); ctx.lineTo(p.x + l, q); ctx.lineTo(p.x - l, q)
        ctx.closePath(); ctx.fill()
      }
    } else if (v.bordo === 'covone') {
      ctx.fillStyle = chioma
      ctx.beginPath(); ctx.ellipse(p.x, p.y - h * 0.24, h * 0.26, h * 0.24, 0, 0, 7); ctx.fill()
      ctx.fillStyle = '#00000022'
      ctx.beginPath(); ctx.ellipse(p.x, p.y - h * 0.24, h * 0.26, h * 0.05, 0, 0, 7); ctx.fill()
    } else if (v.bordo === 'cactus') {
      ctx.fillStyle = chioma
      ctx.beginPath(); ctx.roundRect(p.x - h * 0.08, p.y - h * 0.72, h * 0.16, h * 0.72, h * 0.08); ctx.fill()
      ctx.beginPath(); ctx.roundRect(p.x - h * 0.28, p.y - h * 0.56, h * 0.2, h * 0.1, h * 0.05); ctx.fill()
      ctx.beginPath(); ctx.roundRect(p.x - h * 0.28, p.y - h * 0.56, h * 0.1, h * 0.3, h * 0.05); ctx.fill()
    } else if (v.bordo === 'roccia') {
      ctx.fillStyle = chioma
      ctx.beginPath()
      ctx.moveTo(p.x - h * 0.3, p.y); ctx.lineTo(p.x - h * 0.12, p.y - h * 0.5)
      ctx.lineTo(p.x + h * 0.14, p.y - h * 0.42); ctx.lineTo(p.x + h * 0.3, p.y)
      ctx.closePath(); ctx.fill()
    } else if (v.bordo === 'totem') {
      ctx.fillStyle = chioma
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha *= 0.92
        ctx.beginPath()
        ctx.roundRect(p.x - h * (0.18 - i * 0.04), p.y - h * (0.3 + i * 0.28),
                      h * (0.36 - i * 0.08), h * 0.26, h * 0.05)
        ctx.fill()
      }
    } else {
      ctx.fillStyle = '#8b6039'
      ctx.fillRect(p.x - h * 0.045, p.y - h * 0.42, h * 0.09, h * 0.42)
      ctx.fillStyle = chioma
      ctx.beginPath()
      ctx.arc(p.x, p.y - h * 0.58, h * 0.27, 0, 7)
      ctx.arc(p.x - h * 0.2, p.y - h * 0.44, h * 0.2, 0, 7)
      ctx.arc(p.x + h * 0.19, p.y - h * 0.46, h * 0.21, 0, 7)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  /* ═══════════ i cancelli ═══════════
     Solo quello su cui si sta decidendo è leggibile: il successivo si
     intravede appena. Sei numeri in fila non sono una decisione più
     ricca, sono confusione. */
  cancelli(c) {
    const { ctx, H } = this
    /* Tre fattori, e il terzo è quello che si scopre solo giocando: un
       cancello alto un terzo di schermo, nell'istante in cui gli si passa
       dentro, **copre la truppa** — cioè l'unica cosa che il bambino vuole
       guardare proprio in quel momento, per vedere quanto è cresciuta. Si
       dissolve negli ultimi due metri, che è anche quello che fa sembrare
       di attraversarlo invece di sbatterci contro. */
    const alfa = Math.min(1, Math.max(0, (46 - c.z) / 10))
                 * (c.attivo ? 1 : 0.22)
                 * Math.min(1, Math.max(0, (c.z + 1) / 3))
    for (let i = 0; i < 3; i++) {
      const op = c.ops[i]
      const p = this.punto(i - 1, c.z)
      /* la scala si ferma: da vicinissimo un «×5» alto mezzo schermo non
         si legge meglio, copre solo la strada e il cancello dopo */
      const s = Math.min(p.s, 0.62)
      const w = this.larg * 0.86 * s, h = H * 0.2 * s
      ctx.globalAlpha = alfa
      /* Tre cancelli **uguali**, e un solo colore per tutti: quello che
         cambia è il numero scritto sopra, che è l'unica cosa da leggere.
         Il verde e il rosso di prima rispondevano alla domanda da soli —
         due corsie rosse su tre e non c'era più niente da calcolare.
         L'oro resta, perché non dice quanto vale: dice che lì ci si
         ferma. */
      if (op.oro) this.riquadro(p.x, p.y, w, h, '#7a5a12', '#ffd24a')
      else this.riquadro(p.x, p.y, w, h, '#33405e', '#93a8d4')
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const righe = op.testo.split(' ')
      if (righe.length > 1) {
        // «÷5» sopra e «+80» sotto: su una riga sola diventa una stringa
        // lunga che il ridimensionamento riduce a niente
        this.dentro(righe[0], p.x, p.y - h * 0.74, w * 0.74, Math.max(8, h * 0.3))
        this.dentro(righe[1], p.x, p.y - h * 0.46, w * 0.74, Math.max(8, h * 0.3))
      } else {
        this.dentro(op.testo, p.x, p.y - h * 0.6, w * 0.78, Math.max(9, h * 0.44))
      }
      if (op.oro) {
        ctx.font = `${Math.max(9, h * 0.24)}px system-ui, sans-serif`
        ctx.fillText('📚', p.x, p.y - h * 0.2)
      }
    }
    ctx.globalAlpha = 1
  }

  /* Il mostro: una barra della vita che scende mentre gli si spara
     addosso, e il numero che resta. Fa vedere in un colpo d'occhio la
     cosa che tiene in piedi tutto il gioco — che la truppa **è** la
     potenza di fuoco. */
  nemici(c, v) {
    const { ctx } = this
    const p = this.punto(0, c.z)
    const s = Math.min(p.s, 0.7)
    const largo = this.larg * 2.2 * s
    ctx.globalAlpha = Math.min(1, Math.max(0, (46 - c.z) / 10))

    // tanti mostri quanti ne restano, fino a cinque: di più si
    // sovrappongono e diventano una macchia senza facce. Il boss è uno
    // solo e grosso — si vede da lontano che quello è un altro affare.
    const quanti = c.boss ? 1 : Math.max(1, Math.min(5, Math.ceil(c.quota * 5)))
    const d = Math.max(10, (c.boss ? 150 : 78) * s)
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    for (let i = 0; i < quanti; i++) {
      const dx = (i - (quanti - 1) / 2) * largo / 4.2
      const su = Math.abs(Math.sin(c.z * 0.6 + i)) * d * 0.1
      ctx.fillStyle = '#00000022'
      ctx.beginPath(); ctx.ellipse(p.x + dx, p.y, d * 0.3, d * 0.08, 0, 0, 7); ctx.fill()
      ctx.font = `${d}px system-ui, sans-serif`
      ctx.fillText(c.boss ? '👹' : '👾', p.x + dx, p.y - su)
    }

    const bw = largo * 1.2, bh = Math.max(5, 16 * s), by = p.y - d * 1.3
    ctx.fillStyle = '#00000088'
    ctx.beginPath(); ctx.roundRect(p.x - bw / 2, by, bw, bh, bh / 2); ctx.fill()
    ctx.fillStyle = c.quota > 0.5 ? '#ff8080' : '#ffd24a'
    ctx.beginPath(); ctx.roundRect(p.x - bw / 2, by, bw * c.quota, bh, bh / 2); ctx.fill()
    ctx.fillStyle = v.buio ? '#ffffff' : '#ffffff'
    ctx.textBaseline = 'bottom'
    this.dentro(String(c.resta), p.x, by - bh * 0.35, bw * 0.55, Math.max(11, 34 * s))
    ctx.globalAlpha = 1
  }

  /* Il traguardo: una fascia a scacchi larga tutta la strada. Non è
     decorazione — è l'unica cosa che dice «ci sei quasi», e quando
     compare all'orizzonte cambia come si sceglie l'ultimo cancello. */
  /* Il traguardo è **un arco**, non una riga per terra: una fascia a
     scacchi dipinta sull'asfalto, vista di scorcio, è alta tre pixel e
     non la vede nessuno. Un arco si legge da settanta metri, e sapere
     che manca poco cambia come si sceglie l'ultimo cancello — che è
     tutta la ragione per cui sta lì. */
  traguardo(c) {
    const { ctx } = this
    const p = this.punto(0, c.z), q = this.punto(0, Math.max(c.z - 2.5, -0.9))
    const larg = this.larg * BORDO
    ctx.globalAlpha = Math.min(1, Math.max(0, (70 - c.z) / 24))

    // la fascia a terra, che dice esattamente dove finisce
    const passi = 12
    for (let i = 0; i < passi; i++) {
      const a = -larg + (2 * larg * i) / passi, b = -larg + (2 * larg * (i + 1)) / passi
      ctx.fillStyle = i % 2 ? '#1b1b1b' : '#fdfdfd'
      ctx.beginPath()
      ctx.moveTo(this.W / 2 + a * p.s, p.y); ctx.lineTo(this.W / 2 + b * p.s, p.y)
      ctx.lineTo(this.W / 2 + b * q.s, q.y); ctx.lineTo(this.W / 2 + a * q.s, q.y)
      ctx.closePath(); ctx.fill()
    }

    // i due pali e lo striscione fra loro
    const alto = this.H * 0.34 * p.s
    const spesso = Math.max(2, this.larg * 0.06 * p.s)
    const sx = this.W / 2 - larg * p.s, dx = this.W / 2 + larg * p.s
    ctx.fillStyle = '#c8462f'
    ctx.fillRect(sx - spesso / 2, p.y - alto, spesso, alto)
    ctx.fillRect(dx - spesso / 2, p.y - alto, spesso, alto)
    const hs = Math.max(6, alto * 0.2)
    ctx.fillStyle = '#fdfdfd'
    ctx.fillRect(sx, p.y - alto, dx - sx, hs)
    ctx.fillStyle = '#1b1b1b'
    const celle = 10, cw = (dx - sx) / celle
    for (let i = 0; i < celle; i++)
      for (let r = 0; r < 2; r++)
        if ((i + r) % 2) ctx.fillRect(sx + i * cw, p.y - alto + r * hs / 2, cw, hs / 2)

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = `${Math.max(12, 56 * p.s)}px system-ui, sans-serif`
    ctx.fillText('🏁', this.W / 2, p.y - alto - Math.max(8, 30 * p.s))
    ctx.globalAlpha = 1
  }

  cosetta(c, emoji, scala = 1) {
    const { ctx } = this
    const p = this.punto(c.corsia, c.z)
    const d = Math.max(7, 54 * Math.min(p.s, 0.7) * scala)
    ctx.globalAlpha = Math.min(1, Math.max(0, (46 - c.z) / 10))
    ctx.font = `${d}px system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillText(emoji, p.x, p.y)
    ctx.globalAlpha = 1
  }

  /* La cassa dice quanti soldati porta. Un premio che non si sa quanto
     vale non è un premio: è una sorpresa, e una sorpresa non si può
     scegliere di andarsela a prendere. */
  cassa(c) {
    const { ctx } = this
    const p = this.punto(c.corsia, c.z)
    const d = Math.max(7, 54 * Math.min(p.s, 0.7))
    ctx.globalAlpha = Math.min(1, Math.max(0, (46 - c.z) / 10))
    const g = ctx.createRadialGradient(p.x, p.y - d * 0.35, 0, p.x, p.y - d * 0.35, d)
    g.addColorStop(0, '#9fffb488'); g.addColorStop(1, '#9fffb400')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(p.x, p.y - d * 0.35, d, 0, 7); ctx.fill()
    ctx.font = `${d}px system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillText('📦', p.x, p.y)
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    this.dentro('+' + c.quanti, p.x, p.y - d * 1.05, d * 1.1, Math.max(9, d * 0.42))
    ctx.globalAlpha = 1
  }

  /* i colpi in volo: sono la ragione per cui si capisce, senza una riga
     di spiegazione, che più soldati vuol dire più fuoco */
  colpi(elenco) {
    const { ctx } = this
    ctx.globalAlpha = 0.9
    ctx.fillStyle = '#ffe9a3'
    for (const c of elenco) {
      const p = this.punto(c.corsia, c.z)
      ctx.beginPath()
      ctx.ellipse(p.x, p.y - 26 * p.s, Math.max(1.5, 5 * p.s), Math.max(3, 11 * p.s), 0, 0, 7)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  /* ═══════════ la truppa ═══════════
     I più forti **al centro**, come in una formazione vera: il giallo in
     mezzo e i verdi ai lati. In fila per grado sembrava una coda al
     supermercato invece di una squadra schierata. Cinque per riga, e il
     posto si assegna per distanza dal centro dello schieramento. */
  truppa(s) {
    const { ctx } = this
    const p = this.punto(s.corsia, 0)
    const d = Math.min(this.W * 0.19, 86)
    const fila = s.soldati
    const righe = Math.max(1, Math.ceil(fila.length / 5))
    /* Si costruisce la griglia **intera** e poi si prendono le caselle più
       centrali, invece di riempirla da sinistra: con tre soldati soli, il
       riempimento in ordine li metteva tutti nella colonna di bordo e la
       truppa correva mezza fuori dalla corsia. Le caselle si ordinano per
       distanza dal centro dello schieramento — i gialli in mezzo,
       circondati, i verdi sui bordi — che è come si guarda una formazione
       ed è infatti dove l'occhio li cerca. */
    const mezzo = (righe - 1) / 2
    const distanza = c => Math.abs(c.col - 2) * 1.15 + Math.abs(c.riga - mezzo)
    const griglia = []
    for (let r = 0; r < righe; r++)
      for (let col = 0; col < 5; col++) griglia.push({ riga: r, col })
    griglia.sort((a, b) => distanza(a) - distanza(b))
    const caselle = griglia.slice(0, fila.length)
    /* Ogni riga si centra sulle colonne che ha davvero, non sulla colonna
       di mezzo della griglia: con quattro soldati la fila occupa le
       colonne 0..3, e centrandola sulla 2 lo schieramento uscirebbe di
       sbieco — visibile subito nella corsia di destra, dove l'ultimo
       soldato finiva mezzo fuori dallo schermo. */
    const centro = []
    for (const c of caselle) {
      const r = centro[c.riga] || (centro[c.riga] = { min: c.col, max: c.col })
      r.min = Math.min(r.min, c.col); r.max = Math.max(r.max, c.col)
    }

    // si disegna dal fondo in avanti, o chi sta dietro finisce sopra chi
    // gli sta davanti e la formazione si sfalda
    fila
      .map((g, i) => ({ ...caselle[i], g, i }))
      .sort((a, b) => b.riga - a.riga)
      .forEach(({ riga, col, g, i }) => {
        const mezzoRiga = (centro[riga].min + centro[riga].max) / 2
        const lato = (col - mezzoRiga) * 0.18 + Math.sin(i * 2.1) * 0.025
        const q = this.punto(s.corsia + lato, 0.2 + riga * 0.5)
        this.soldato(q.x, q.y + Math.sin(s.dist * 3.4 + i) * 3,
                     d * 0.62 * q.s / p.s * (1 + g * 0.15), g)
      })

    // la polvere sotto i piedi
    for (let i = 0; i < 2; i++) {
      const t = ((s.dist * 1.6 + i * 0.5) % 1)
      ctx.globalAlpha = (1 - t) * 0.18
      ctx.fillStyle = '#fff3d8'
      ctx.beginPath(); ctx.arc(p.x - t * 30 * (i ? 1 : -1), p.y + 4, 5 + t * 14, 0, 7); ctx.fill()
    }
    ctx.globalAlpha = 1

    /* Il conto di quanti sono, **attaccato a loro**: il numero in cima
       allo schermo è lontano dall'occhio proprio nell'istante in cui si
       sceglie il cancello, che è quando serve. */
    const t = this.punto(s.corsia, 0.2)
    const testo = String(s.truppa)
    ctx.font = `900 ${Math.max(14, d * 0.34)}px system-ui, sans-serif`
    const largo = ctx.measureText(testo).width + d * 0.34
    ctx.fillStyle = '#00000088'
    ctx.beginPath(); ctx.roundRect(t.x - largo / 2, t.y - d * 1.24, largo, d * 0.44, d * 0.22); ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(testo, t.x, t.y - d * 1.02)
  }

  /* Un soldatino: corpo, testa, elmetto del suo colore e un'arma che
     cresce col grado. Disegnato e non emoji, perché il colore deve dire
     quanto vale — ed è l'unica cosa che questo gioco chiede di leggere
     guardando per terra. */
  soldato(x, y, h, g) {
    if (h < 2.5) return
    const { ctx } = this
    const o = ORDINI[g]
    ctx.fillStyle = '#00000022'
    ctx.beginPath(); ctx.ellipse(x, y, h * 0.3, h * 0.09, 0, 0, 7); ctx.fill()
    ctx.fillStyle = '#3b3b46'
    ctx.fillRect(x + h * 0.16, y - h * 0.56, h * (0.26 + g * 0.07), h * (0.08 + g * 0.02))
    ctx.fillStyle = o.colore
    ctx.beginPath(); ctx.roundRect(x - h * 0.22, y - h * 0.62, h * 0.44, h * 0.5, h * 0.16); ctx.fill()
    ctx.beginPath(); ctx.arc(x, y - h * 0.74, h * 0.19, 0, 7); ctx.fill()
    ctx.fillStyle = o.ombra
    ctx.beginPath(); ctx.arc(x, y - h * 0.77, h * 0.2, Math.PI, 0); ctx.fill()
    if (g >= 2) {
      ctx.fillStyle = '#ffffff66'
      ctx.fillRect(x - h * 0.22, y - h * 0.38, h * 0.44, h * 0.07)
    }
  }

  /* Le righe di corsa: dicono che la spinta **sta funzionando adesso**, e
     spariscono da sole nei metri prima di un cancello — che è esattamente
     dove il motore la spegne. Senza, il bambino continuerebbe a martellare
     lo schermo senza capire perché non succede più niente. */
  corsa(spinta) {
    if (spinta < 0.1) return
    const { ctx, W, H } = this
    ctx.globalAlpha = Math.min(0.5, spinta * 0.34)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 7; i++) {
      const lato = i % 2 ? 1 : -1
      const t = ((i * 0.37 + this.striscia) % 1)
      const x = W / 2 + lato * (W * 0.3 + W * 0.2 * ((i * 3) % 4) / 4)
      const y = this.oriz + (H - this.oriz) * (0.2 + t * 0.85)
      ctx.fillRect(x - 2, y, 4, H * 0.05 * (0.5 + t))
    }
    ctx.globalAlpha = 1
  }

  particelle(dt) {
    this.striscia = ((this.striscia || 0) + dt * 2.2) % 1
    const { ctx } = this
    for (const p of this.brividi) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.vita -= dt
      ctx.globalAlpha = Math.max(0, p.vita * 1.6)
      ctx.fillStyle = p.c
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6)
    }
    this.brividi = this.brividi.filter(p => p.vita > 0)
    ctx.globalAlpha = 1
  }

  /* Una scritta che sta dentro la sua scatola, sempre. Il corpo si
     sceglieva dall'altezza del riquadro, e «+22» e «×5» sono due e tre
     caratteri: il primo sbordava di netto. Qui si misura e, se non ci
     sta, si rimpicciolisce — costa una `measureText` per cancello. */
  dentro(testo, x, y, largoMax, corpo) {
    const { ctx } = this
    ctx.font = `900 ${corpo}px system-ui, sans-serif`
    const w = ctx.measureText(testo).width
    if (w > largoMax) ctx.font = `900 ${Math.max(7, corpo * largoMax / w)}px system-ui, sans-serif`
    ctx.fillText(testo, x, y)
  }

  riquadro(x, y, w, h, dentro, bordo) {
    const { ctx } = this
    // l'ombra a terra: senza, un cancello sembra appeso al cielo e non si
    // capisce in che corsia sia piantato
    ctx.fillStyle = '#00000026'
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.52, h * 0.07, 0, 0, 7); ctx.fill()
    ctx.fillStyle = dentro
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, Math.max(2, h * 0.12)); ctx.fill()
    ctx.strokeStyle = bordo
    ctx.lineWidth = Math.max(1.5, h * 0.05)
    ctx.stroke()
    ctx.fillStyle = '#ffffff1a'
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h * 0.16, Math.max(2, h * 0.1)); ctx.fill()
  }
}
