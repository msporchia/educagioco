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
   `veloci` è quante frecce, in testa alla fila, sono identiche al giro
   di prima e allora erano andate bene: quelle scorrono a tre volte la
   velocità. Senza, chi aggiunge una freccia in fondo a una fila di dieci
   si riguarda dieci passi già visti per vedere l'undicesimo — e a sei
   anni, dopo la terza volta, smette di guardare.
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
      const k = passo.i < veloci ? 1 / VELOCE : 1
      for (const e of passo.eventi) {
        const d = (DURATE[e.che] ?? 0.2) * k
        this.battute.push({ i: passo.i, e, t0: t, t1: t + d, veloce: k < 1 })
        t += d
      }
      if (n < ultimo) t += PAUSA * k
    }
    this.fineMosse = t
    this.errore = this.esito === 'sbatte' || this.esito === 'splash'
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
    for (const b of this.battute) {
      /* in mezzo a due battute — la pausa fra una freccia e l'altra — il
         fotogramma è quello che ha lasciato la battuta di prima, e basta:
         il «dopo l'ultima» qui sotto vale solo dopo l'ultima davvero */
      if (t < b.t0) return f
      const k = b.t1 > b.t0 ? Math.min(1, (t - b.t0) / (b.t1 - b.t0)) : 1
      applica(f, b, k)
      f.corrente = b.i
      if (k < 1) return f
    }

    /* ── dopo l'ultima battuta ── */
    if (this.errore) {
      if (t < this.tRitorno) {
        f.scenetta = this.esito
        if (this.esito === 'sbatte') {
          f.coniglio.posa = 'stordito'
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
      f.coniglio.alfa = 0
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
    effetti: [],
    corrente: -1,
    guasto: null,
    fumetto: null,
    scenetta: null,
    festa: false,
    tornato: false,
  }
}

const cercaMasso = (f, p) =>
  f.massi.find(m => m.alfa > 0 && Math.round(m.x) === p.x && Math.round(m.y) === p.y)

/* ── una battuta, a che punto è ──
   `k` va da 0 a 1; a 1 la battuta è finita e il fotogramma deve essere
   esattamente lo stato in cui l'ha lasciata. */
function applica(f, b, k) {
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
