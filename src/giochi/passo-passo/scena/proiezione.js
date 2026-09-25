/* ═══════════════════════════════════════════════════════════════════
   LA PROIEZIONE — i fatti del motore messi in movimento

   Il motore (`motore/mondo.js`) dice cosa è successo: «passo da qui a
   lì», «il masso scivola fin là», «splash». Non dice quanto dura niente.
   Qui ogni fatto diventa una **battuta** con un inizio e una fine, e
   `fotogramma(t)` risponde a una domanda sola: al tempo `t`, dove sta
   ogni cosa e che faccia ha? La tela (`scena/tela.js`) disegna la
   risposta e basta.

   Non sa niente di regole — non sa perché il coniglio si ferma, sa che
   si ferma — e non tocca il canvas: gira anche in Node, e i test la
   possono interrogare.

   ── IL TEMPO È RIFATTO DA CAPO A OGNI FOTOGRAMMA ─────────────────
   Il fotogramma si ricostruisce ripercorrendo le battute dall'inizio
   fino a `t`: sono al più un paio di centinaia, e rifarle costa meno di
   un milionesimo di secondo. In cambio non c'è nessuno stato da tenere
   allineato — tornare indietro, saltare avanti, ripartire, è la stessa
   funzione chiamata con un altro numero.

   ── LA PARTE GIÀ VISTA VA VELOCE ─────────────────────────────────
   `veloci` è quanti passi, dall'inizio, sono identici al giro di prima
   e allora erano andati bene: quelli scorrono a tre volte la velocità.
   Senza, chi aggiunge una freccia in fondo a una fila di dieci si
   riguarda dieci passi già visti per vedere l'undicesimo — e a sei
   anni, dopo la terza volta, smette di guardare. Si contano i passi e
   non le carte perché coi cicli non sono la stessa cosa: portare un
   🔁 da 5 a 6 fa correre veloci i primi cinque giri, e lento il sesto.

   ── LE PECORE SCAPPANO TUTTE INSIEME ─────────────────────────────
   Le battute di solito vengono una dopo l'altra. Quelle delle pecore
   no: quando il cane si ferma accanto a due pecore, scappano insieme,
   ognuna dalla sua parte. Una battuta `fugge` che segue un'altra
   `fugge` della stessa freccia comincia quando comincia lei, e il
   fotogramma le applica tutte e due finché la più lunga non finisce.

   ── A CHE GIRO SIAMO ─────────────────────────────────────────────
   Ogni battuta si porta dietro il suo passo (`n`) e i giri dei cicli
   aperti (`giri`, da `esegui`): il fotogramma li ripete, e la regia li
   passa a chi disegna la fila, che li scrive sulla testa di ogni
   scatola. È la cosa che fa capire un ciclo guardandolo girare.
   ═══════════════════════════════════════════════════════════════════ */

/* quanto dura ogni battuta, in secondi, a velocità normale */
export const DURATE = {
  passo: 0.32,
  spinta: 0.5,
  masso: 0.1,
  affonda: 0.55,
  scivola: 0.11,
  frena: 0.16,
  salto: 0.5,
  carota: 0,
  buca: 0.85,
  sbatte: 0.45,
  tuffo: 0.36,
  tana: 0.6,
  gregge: 0.7,
  incastrata: 0.25,
}
/* la fuga di una pecora: un saltello, poi la scivolata (una cella alla
   volta, come il masso), e se è entrata nel recinto la camminata fino
   al suo posto. Una pecora che non può scappare trema e basta */
export const FUGA = { salto: 0.26, cella: 0.09, dentro: 0.4, ferma: 0.3 }
const durataDi = e => {
  if (e.che !== 'fugge') return DURATE[e.che] ?? 0.2
  if (e.ferma) return FUGA.ferma
  return FUGA.salto + FUGA.cella * Math.max(0, e.via.length - 1) + (e.dentro ? FUGA.dentro : 0)
}
export const PAUSA = 0.14      // fra una freccia e l'altra: la tessera accesa ha il tempo di cambiare
export const SCENETTA = 1.3    // la botta o lo splash: la parte buffa
export const RITORNO = 0.6     // si torna alla partenza
export const FESTA = 1.1       // dentro la tana, prima del cartello
export const VELOCE = 3        // quanto più svelta scorre la parte già vista
/* nell'acqua il coniglio resta a galla con la testa fuori: sparire del
   tutto sarebbe un dramma, e la scenetta deve far ridere */
export const A_GALLA = 0.4

const verso = (da, a) =>
  a.x > da.x ? 'destra' : a.x < da.x ? 'sinistra' : a.y > da.y ? 'giu' : 'su'
const lerp = (a, b, k) => a + (b - a) * k
const morbido = k => k * k * (3 - 2 * k)

export class Proiezione {
  /* `esito` è quello che torna `esegui()`; `veloci` quante frecce in
     testa scorrono veloci */
  constructor(liv, esito, { veloci = 0 } = {}) {
    this.liv = liv
    this.esito = esito.esito
    this.battute = []
    let t = 0
    const ultimo = esito.passi.length - 1
    for (const [n, passo] of esito.passi.entries()) {
      const k = n < veloci ? 1 / VELOCE : 1
      let fuga = null
      for (const e of passo.eventi) {
        const d = durataDi(e) * k
        /* le pecore della stessa freccia scappano insieme */
        const t0 = e.che === 'fugge' && fuga != null ? fuga : t
        if (e.che === 'fugge' && fuga == null) fuga = t
        this.battute.push({ i: passo.i, n, giri: passo.giri || null, e, t0, t1: t0 + d, veloce: k < 1 })
        t = Math.max(t, t0 + d)
      }
      if (n < ultimo) t += PAUSA * k
    }
    this.fineMosse = t
    /* `stanco` è la fila che si ferma perché al coniglio gira la testa
       (troppi passi: `PASSI_MAX` in `motore/mondo.js`). Si racconta come
       una botta, con le stelline, ma senza niente contro cui sbattere.
       `persa` è una pecora incastrata: la scenetta è sua, non del cane —
       trema nel suo angolo e dice «bee», e la sua cella pulsa */
    this.errore = this.esito === 'sbatte' || this.esito === 'splash' || this.esito === 'stanco' ||
                  this.esito === 'persa'
    const ultima = this.battute.at(-1)
    this.incastrata = this.esito === 'persa' && ultima && ultima.e.che === 'incastrata' ? ultima.e.dove : null
    if (this.errore) {
      this.tScenetta = t
      t += SCENETTA
      this.tRitorno = t
      t += RITORNO
    } else if (this.esito === 'tana') {
      t += FESTA
    }
    this.durata = t
  }

  fotogramma(t) {
    const f = fotogrammaIniziale(this.liv)
    f.t = t
    let aperta = false
    for (const b of this.battute) {
      /* in mezzo a due battute — la pausa fra una freccia e l'altra — il
         fotogramma è quello che ha lasciato la battuta di prima, e basta:
         il «dopo l'ultima» qui sotto vale solo dopo l'ultima davvero */
      if (t < b.t0) return f
      const k = b.t1 > b.t0 ? Math.min(1, (t - b.t0) / (b.t1 - b.t0)) : 1
      applica(f, b, k, this.liv)
      f.corrente = b.i
      f.passo = b.n
      f.giri = b.giri
      /* una battuta non finita ferma il racconto, a meno che quella dopo
         sia già cominciata (le pecore che scappano insieme) */
      aperta = aperta || k < 1
    }
    if (aperta) return f

    /* ── dopo l'ultima battuta ── */
    if (this.errore) {
      if (t < this.tRitorno) {
        f.scenetta = this.esito
        if (this.esito === 'sbatte' || this.esito === 'stanco') {
          f.coniglio.posa = 'stordito'
        } else if (this.esito === 'persa') {
          f.coniglio.posa = 'fermo'
          const d = this.incastrata
          const p = d && cercaPecora(f, d)
          if (p) {
            const q = t - this.tScenetta
            p.x = d.x + Math.sin(q * 30) * 0.04
            f.guasto = { x: d.x, y: d.y, fuori: false }
            f.effetti.push({ che: 'bee', x: d.x, y: d.y, t0: this.tScenetta + Math.floor(q / 0.55) * 0.55 })
          }
        } else {
          /* a galla, girato verso chi guarda: si vede la faccia */
          f.coniglio.immerso = A_GALLA
          f.coniglio.verso = 'giu'
          f.coniglio.posa = 'fermo'
          f.coniglio.su = Math.sin((t - this.tScenetta) * 7) * 0.8
        }
        return f
      }
      const r = Math.min(1, (t - this.tRitorno) / RITORNO)
      if (r < 0.5) {
        /* il mondo com'era alla fine sfuma… */
        f.coniglio.alfa = 1 - r * 2
        if (this.esito === 'splash') { f.coniglio.immerso = A_GALLA; f.coniglio.verso = 'giu' }
        f.guasto = null
        return f
      }
      /* …e al suo posto torna quello di partenza */
      const g = fotogrammaIniziale(this.liv)
      g.t = t
      g.coniglio.alfa = Math.min(1, (r - 0.5) * 2)
      g.effetti.push({ che: 'sbuffo', x: g.coniglio.x, y: g.coniglio.y, t0: this.tRitorno + RITORNO / 2 })
      g.corrente = -1
      g.tornato = true
      return g
    }
    if (this.esito === 'tana') {
      /* il coniglio è entrato nella tana; il cane resta fuori a fare la
         guardia al recinto, e scodinzola */
      if (!this.liv.cane) f.coniglio.alfa = 0
      else f.coniglio.su = Math.abs(Math.sin((t - this.fineMosse) * 9)) * 2
      f.festa = true
      return f
    }
    /* la fila è finita prima della tana: non è un errore, è un programma
       non finito. Il coniglio resta dov'è e si chiede cosa viene dopo. */
    if (this.esito === 'finita') f.fumetto = { t0: this.fineMosse }
    return f
  }
}

/* il mondo com'è prima della prima freccia: serve anche da fermo, fra
   un giro e l'altro */
export function fotogrammaIniziale(liv) {
  const p = liv.xy(liv.partenza)
  return {
    t: 0,
    coniglio: { x: p.x, y: p.y, verso: 'giu', posa: 'fermo', fase: 0, su: 0,
                alfa: 1, immerso: 0 },
    massi: liv.massi.map(i => ({ ...liv.xy(i), alfa: 1, affonda: 0 })),
    ponti: [],
    carota: liv.carota >= 0 ? { ...liv.xy(liv.carota), presa: false, t0: 0 } : null,
    /* le pecore fuori, e quelle già nel recinto (al loro posto, a brucare) */
    pecore: (liv.pecore || []).map(i => {
      const { x, y } = liv.xy(i)
      return { x, y, verso: (x + y) % 2 ? 'destra' : 'sinistra', su: 0, alfa: 1, trema: 0 }
    }),
    recinto: [],
    effetti: [],
    corrente: -1,
    passo: -1,
    giri: null,
    guasto: null,
    fumetto: null,
    scenetta: null,
    festa: false,
    tornato: false,
  }
}

const cercaMasso = (f, p) =>
  f.massi.find(m => m.alfa > 0 && Math.round(m.x) === p.x && Math.round(m.y) === p.y)
const cercaPecora = (f, p) =>
  f.pecore.find(m => m.alfa > 0 && Math.round(m.x) === p.x && Math.round(m.y) === p.y)

/* il posto dove una pecora entrata nel recinto va a brucare: la cella
   del recinto più vicina a dove è entrata, fra quelle ancora libere. Se
   sono tutte prese si stringe accanto a un'altra */
function postoNelRecinto(liv, f, a) {
  const celle = []
  for (let i = 0; i < liv.n; i++) if (liv.terreno[i] === 'recinto') celle.push(liv.xy(i))
  const occupata = c => f.recinto.some(r => Math.round(r.x) === c.x && Math.round(r.y) === c.y)
  const lontano = c => Math.abs(c.x - a.x) + Math.abs(c.y - a.y)
  /* di preferenza lontano dall'ingresso di un passo: il primo posto
     libero dopo la soglia, non la soglia stessa */
  const libere = celle.filter(c => !occupata(c)).sort((p, q) => {
    const dp = lontano(p), dq = lontano(q)
    return (dp === 0) - (dq === 0) || dp - dq
  })
  if (libere.length) return libere[0]
  const n = f.recinto.length
  return { x: a.x + (n % 2 ? 0.3 : -0.3), y: a.y }
}

/* ── una battuta, a che punto è ──
   `k` va da 0 a 1; a 1 la battuta è finita e il fotogramma deve essere
   esattamente lo stato in cui l'ha lasciata. */
function applica(f, b, k, liv) {
  const e = b.e
  const c = f.coniglio
  const dur = b.t1 - b.t0
  switch (e.che) {
    case 'passo':
    case 'scivola': {
      c.verso = verso(e.da, e.a)
      c.x = lerp(e.da.x, e.a.x, k)
      c.y = lerp(e.da.y, e.a.y, k)
      c.posa = k >= 1 ? 'fermo' : e.che === 'passo' ? 'cammina' : 'scivola'
      c.fase = k
      if (e.che === 'scivola' && k < 1) f.effetti.push({ che: 'brina', x: c.x, y: c.y, t0: b.t0 })
      break
    }
    case 'spinta': {
      c.verso = verso(e.da, e.a)
      c.x = lerp(e.da.x, e.a.x, k)
      c.y = lerp(e.da.y, e.a.y, k)
      c.posa = k >= 1 ? 'fermo' : 'spinge'
      c.fase = k
      const m = cercaMasso(f, e.masso.da) || cercaMasso(f, e.masso.a)
      if (m) { m.x = lerp(e.masso.da.x, e.masso.a.x, k); m.y = lerp(e.masso.da.y, e.masso.a.y, k) }
      break
    }
    case 'masso': {
      const m = cercaMasso(f, e.da) || cercaMasso(f, e.a)
      if (m) { m.x = lerp(e.da.x, e.a.x, k); m.y = lerp(e.da.y, e.a.y, k) }
      c.posa = 'fermo'
      break
    }
    case 'affonda': {
      const m = cercaMasso(f, e.dove)
      if (m) {
        m.affonda = k
        m.alfa = k >= 1 ? 0 : 1
      }
      f.effetti.push({ che: 'anelli', x: e.dove.x, y: e.dove.y, t0: b.t0 })
      if (k >= 0.55) f.ponti.push({ x: e.dove.x, y: e.dove.y, t0: b.t0 + dur * 0.55 })
      break
    }
    case 'frena': {
      /* un colpetto contro quello che ferma: non è una botta, il
         coniglio si appoggia e basta */
      const v = { x: e.verso.x - e.dove.x, y: e.verso.y - e.dove.y }
      const s = Math.sin(Math.PI * k) * 0.08
      c.x = e.dove.x + v.x * s
      c.y = e.dove.y + v.y * s
      c.posa = 'fermo'
      break
    }
    case 'salto': {
      c.verso = verso(e.da, e.a)
      c.x = lerp(e.da.x, e.a.x, morbido(k))
      c.y = lerp(e.da.y, e.a.y, morbido(k))
      c.su = Math.sin(Math.PI * k) * 10
      c.posa = k >= 1 ? 'fermo' : 'salta'
      break
    }
    case 'carota': {
      if (f.carota) { f.carota.presa = true; f.carota.t0 = b.t0 }
      f.effetti.push({ che: 'carota', x: e.dove.x, y: e.dove.y, t0: b.t0 })
      break
    }
    case 'buca': {
      /* si scende nella buca, un attimo di niente, e si risale dall'altra:
         il coniglio entra dal basso come in un'acqua, non si rimpicciolisce
         (un disegno in pixel ridotto a mezza misura si sfrangia) */
      const giu = 0.4, su = 0.6
      if (k < giu) {
        c.x = e.da.x; c.y = e.da.y
        c.immerso = morbido(k / giu)
      } else if (k < su) {
        c.x = e.a.x; c.y = e.a.y
        c.immerso = 1
      } else {
        c.x = e.a.x; c.y = e.a.y
        c.immerso = k >= 1 ? 0 : 1 - morbido((k - su) / (1 - su))
      }
      c.posa = 'fermo'
      c.su = 0
      f.effetti.push({ che: 'buca', x: e.da.x, y: e.da.y, coppia: e.coppia, t0: b.t0 })
      if (k >= su) f.effetti.push({ che: 'buca', x: e.a.x, y: e.a.y, coppia: e.coppia, t0: b.t0 + dur * su })
      break
    }
    case 'sbatte': {
      /* si va incontro a quello che ferma, e si rimbalza indietro. Col
         salto ci si arriva più vicino, e in volo */
      const v = { x: e.verso.x - e.da.x, y: e.verso.y - e.da.y }
      const lungo = Math.max(Math.abs(v.x), Math.abs(v.y))
      c.verso = verso(e.da, e.verso)
      const quanto = e.salto ? (lungo - 0.55) / lungo : 0.34
      const arrivo = 0.42
      const s = k < arrivo ? morbido(k / arrivo) * quanto
                           : quanto * (1 - morbido((k - arrivo) / (1 - arrivo)))
      c.x = e.da.x + v.x * s
      c.y = e.da.y + v.y * s
      c.su = e.salto ? Math.sin(Math.PI * k) * 6 : 0
      c.posa = k < arrivo ? (e.salto ? 'salta' : 'cammina') : 'stordito'
      c.fase = k
      if (k >= arrivo)
        f.effetti.push({ che: 'botta', x: e.da.x + v.x * (quanto + 0.14),
                         y: e.da.y + v.y * (quanto + 0.14), t0: b.t0 + dur * arrivo })
      f.guasto = { x: e.verso.x, y: e.verso.y, fuori: e.contro === 'bordo' }
      break
    }
    case 'tuffo': {
      c.verso = verso(e.da, e.a)
      const kk = e.come === 'salto' ? morbido(k) : k
      c.x = lerp(e.da.x, e.a.x, kk)
      c.y = lerp(e.da.y, e.a.y, kk)
      c.su = e.come === 'salto' ? Math.sin(Math.PI * k) * 10 : 0
      c.posa = e.come === 'salto' ? 'salta' : e.come === 'scivola' ? 'scivola' : 'cammina'
      c.fase = k
      if (k >= 1) {
        c.immerso = A_GALLA
        f.effetti.push({ che: 'splash', x: e.a.x, y: e.a.y, t0: b.t1 })
      }
      f.guasto = { x: e.a.x, y: e.a.y, fuori: false }
      break
    }
    case 'fugge': {
      const p = cercaPecora(f, e.da)
      if (!p) break
      if (e.verso.dx) p.verso = e.verso.dx > 0 ? 'destra' : 'sinistra'
      if (e.ferma) {
        /* non può scappare: trema sul posto, e dice «bee» */
        p.trema = k < 1 ? Math.sin(k * Math.PI * 6) * 0.07 : 0
        p.x = e.da.x + e.verso.dx * Math.abs(p.trema)
        p.y = e.da.y + e.verso.dy * Math.abs(p.trema)
        if (k > 0.1) f.effetti.push({ che: 'bee', x: e.da.x, y: e.da.y, t0: b.t0 })
        break
      }
      const dur = b.t1 - b.t0
      const tt = k * dur
      const strada = [e.da, ...e.via]
      const tSalto = FUGA.salto * (dur / durataDi(e))
      const tCella = FUGA.cella * (dur / durataDi(e))
      const tScivola = tCella * (strada.length - 2)
      if (tt < tSalto) {
        const q = tt / tSalto
        p.x = lerp(strada[0].x, strada[1].x, morbido(q))
        p.y = lerp(strada[0].y, strada[1].y, morbido(q))
        p.su = Math.sin(Math.PI * q) * 4
      } else if (tt < tSalto + tScivola) {
        const q = (tt - tSalto) / tCella
        const j = Math.min(strada.length - 2, Math.floor(q))
        p.x = lerp(strada[j + 1].x, strada[j + 2].x, q - j)
        p.y = lerp(strada[j + 1].y, strada[j + 2].y, q - j)
        p.su = 0
        f.effetti.push({ che: 'brina', x: p.x, y: p.y, t0: b.t0 })
      } else {
        p.x = e.a.x; p.y = e.a.y; p.su = 0
      }
      if (!e.dentro) break
      /* nel recinto: va al suo posto, e da lì in poi bruca */
      const posto = postoNelRecinto(liv, f, e.a)
      if (k >= 1) {
        p.alfa = 0
        f.recinto.push({ x: posto.x, y: posto.y, verso: p.verso, t0: b.t1 })
        f.effetti.push({ che: 'cuore', x: posto.x, y: posto.y, t0: b.t1 })
      } else if (tt > tSalto + tScivola) {
        const q = morbido(Math.min(1, (tt - tSalto - tScivola) / (dur - tSalto - tScivola)))
        p.x = lerp(e.a.x, posto.x, q)
        p.y = lerp(e.a.y, posto.y, q)
        if (posto.x !== e.a.x) p.verso = posto.x > e.a.x ? 'destra' : 'sinistra'
      }
      break
    }
    case 'incastrata': {
      /* la pecora è finita dove non si recupera: la sua cella comincia a
         pulsare, e la fila si ferma */
      f.guasto = { x: e.dove.x, y: e.dove.y, fuori: false }
      break
    }
    case 'gregge': {
      /* l'ultima pecora è dentro: dal recinto escono i cuori */
      if (k >= 0.2) for (const r of f.recinto)
        f.effetti.push({ che: 'cuori', x: r.x, y: r.y, t0: b.t0 + (b.t1 - b.t0) * 0.2 })
      c.posa = 'fermo'
      break
    }
    case 'tana': {
      /* dentro la porta: si scende piano, e dalla tana escono i cuori */
      c.x = e.dove.x; c.y = e.dove.y - 0.12 * k
      c.immerso = morbido(k) * 0.9
      c.alfa = k >= 1 ? 0 : 1
      c.posa = 'fermo'
      c.verso = 'su'
      if (k >= 0.6) f.effetti.push({ che: 'cuori', x: e.dove.x, y: e.dove.y, t0: b.t0 + dur * 0.6 })
      break
    }
    default: break
  }
}
