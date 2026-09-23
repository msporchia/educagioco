/* ═══════════════════════════════════════════════════════════════════
   IL CANTIERE — una fetta di mondo vista di lato

   Una griglia di celle: ogni cella ha un **suolo** (aria, terreno,
   acqua) e al massimo **un mattone**. Poi ci sono tre personaggi, ognuno
   in una cella: il robot che costruisce, l'omino che prova la
   costruzione, e la bandiera dove l'omino deve arrivare. E il
   **disegno**: le celle dove un mattone *ci deve andare*, che il gioco
   mostra in trasparenza e che a fine programma si confrontano con quello
   che c'è davvero.

   Le coordinate sono quelle dello schermo: `x` cresce verso destra, `y`
   verso il basso. «Su» vuol dire `y - 1`.

   ── LE REGOLE DEL MONDO, CHE VALGONO SEMPRE ────────────────────────
   Sono poche apposta, e nessun livello ne ha una sua:

     · **il robot cammina e cade.** Un passo nel vuoto e scende finché
       trova qualcosa; sale un gradino alto uno, e davanti a un muro più
       alto si ferma. Era un drone che volava, ed è stato il primo
       difetto visto giocandolo: un robot che resta per aria non dà
       nessun ordine alle cose, e «vai a destra» a mezz'aria non
       significava niente di quello che si vedeva;
     · **per salire si mette un mattone sotto i piedi** e ci si sale
       sopra, come in Minecraft: una torre è «metti, metti, metti»;
     · un mattone si posa **sotto i piedi** o **in basso a destra / a
       sinistra**, cioè dove il piede appoggerà: è così che si fa un
       ponte e la chioma di un albero. Solo in una cella vuota o
       d'acqua — dove c'è già un mattone, o il terreno, il robot non lo
       fa e si ferma: è un errore che si legge, non un gesto che non fa
       niente, se no «metti un mattone ovunque» vincerebbe il livello
       dei buchi senza guardare;
     · i mattoni restano dove sono messi: cade il robot, non il muro;
     · nell'acqua non entra nessuno: né il robot né l'omino;
     · l'omino cammina verso la bandiera, sale un gradino alto uno, cade
       giù per tre al massimo.
   ═══════════════════════════════════════════════════════════════════ */
import { leggiSimbolo } from '../dati/legenda.js'

/* dove guarda una condizione, e dove si posa un mattone, rispetto al
   robot: `sotto` sono i piedi, `giu-destra` il posto dove andrà il piede
   facendo un passo a destra */
export const SPOSTAMENTI = {
  sotto: [0, 1], 'giu-destra': [1, 1], 'giu-sinistra': [-1, 1],
  destra: [1, 0], sinistra: [-1, 0], sopra: [0, -1],
}

export class Mondo {
  /* Una mappa ASCII (vedi `dati/legenda.js`) diventa un cantiere.
     `robot: [x, y]` serve ai livelli dove il robot parte sopra una
     cella del disegno, che nella mappa non può avere anche la `@`. */
  static daMappa(righe, { robot = null } = {}) {
    const h = righe.length
    const w = Math.max(...righe.map(r => r.length))
    const m = new Mondo(w, h)
    righe.forEach((riga, y) => {
      for (let x = 0; x < w; x++) {
        const s = leggiSimbolo(riga[x] ?? '.')
        if (!s) throw new Error(`mappa: il carattere «${riga[x]}» (riga ${y + 1}, colonna ${x + 1}) non è in legenda`)
        m.suolo[m.k(x, y)] = s.suolo
        if (s.robot) m.robot = { x, y }
        if (s.omino) m.omino = { x, y }
        if (s.bandiera) m.bandiera = { x, y }
        if (s.bersaglio) m.bersaglio.set(m.k(x, y), s.bersaglio)
        if (s.fisso) { m.mattoni.set(m.k(x, y), s.fisso); m.fissi.set(m.k(x, y), s.fisso) }
      }
    })
    if (robot) m.robot = { x: robot[0], y: robot[1] }
    if (!m.robot) m.robot = { x: 0, y: 0 }
    /* il robot parte coi piedi per terra: una mappa può metterlo più in
       alto, e scende prima che il programma cominci */
    m.cadutaIniziale = m.posaRobot()
    m.partenza = { ...m.robot }
    return m
  }

  /* La gravità del robot: scende finché ha qualcosa sotto. Torna le
     celle attraversate (per chi anima la caduta) e come è finita: `null`
     se è atterrato, `splash` se è finito in acqua, `fuori` se è caduto
     giù dal cantiere. */
  posaRobot() {
    const r = { ...this.robot }
    const celle = []
    while (!this.solido(r.x, r.y + 1)) {
      if (!this.dentro(r.x, r.y + 1)) { this.robot = r; return { celle, esito: 'fuori' } }
      r.y++
      celle.push({ ...r })
      if (this.suoloDi(r.x, r.y) === 'acqua' && !this.mattoneDi(r.x, r.y)) { this.robot = r; return { celle, esito: 'splash' } }
    }
    this.robot = r
    return { celle, esito: null }
  }

  libera(x, y) { return this.dentro(x, y) && !this.solido(x, y) }

  constructor(w, h) {
    this.w = w
    this.h = h
    this.suolo = new Array(w * h).fill('aria')
    this.mattoni = new Map()     // cella → colore, tutti: posati e già presenti
    this.fissi = new Map()       // cella → colore, quelli che c'erano all'inizio
    this.bersaglio = new Map()   // cella → colore, il disegno da costruire
    this.robot = null
    this.partenza = null
    this.omino = null
    this.bandiera = null
  }

  k(x, y) { return y * this.w + x }
  xy(k) { return { x: k % this.w, y: Math.floor(k / this.w) } }
  dentro(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h }
  suoloDi(x, y) { return this.dentro(x, y) ? this.suolo[this.k(x, y)] : null }
  mattoneDi(x, y) { return this.dentro(x, y) ? (this.mattoni.get(this.k(x, y)) || null) : null }
  solido(x, y) { return this.suoloDi(x, y) === 'terreno' || !!this.mattoneDi(x, y) }

  /* Quello che il robot «vede» in una cella: la risposta alle condizioni.
     Fuori dal cantiere c'è il bordo, che è una cosa e non un errore:
     «ripeti · smetti quando [a destra] c'è [il bordo]» è una domanda
     lecita. */
  cosaC(x, y) {
    if (!this.dentro(x, y)) return 'bordo'
    if (this.mattoneDi(x, y)) return 'mattone'
    const s = this.suoloDi(x, y)
    if (s === 'terreno') return 'terreno'
    if (s === 'acqua') return 'acqua'
    return 'vuoto'
  }

  /* Mettere un mattone: torna `null` se è andato, o il motivo per cui no. */
  metti(x, y, colore) {
    if (!this.dentro(x, y)) return 'fuori'
    if (this.mattoneDi(x, y)) return 'gia-mattone'
    if (this.suoloDi(x, y) === 'terreno') return 'terreno'
    this.mattoni.set(this.k(x, y), colore)
    return null
  }

  copia() {
    const m = new Mondo(this.w, this.h)
    m.suolo = this.suolo.slice()
    m.mattoni = new Map(this.mattoni)
    m.fissi = new Map(this.fissi)
    m.bersaglio = new Map(this.bersaglio)
    m.robot = this.robot && { ...this.robot }
    m.partenza = this.partenza && { ...this.partenza }
    m.omino = this.omino && { ...this.omino }
    m.bandiera = this.bandiera && { ...this.bandiera }
    return m
  }

  /* ── il disegno è venuto giusto? ──
     Ogni cella deve avere esattamente il mattone atteso: quello del
     disegno, o quello che c'era già (che non va tolto), o niente. Tre
     elenchi, perché a schermo si dicono in tre modi diversi: il mattone
     che manca lampeggia in trasparenza, quello di troppo prende una
     croce, quello del colore sbagliato tutte e due. */
  confronta() {
    const mancano = [], troppi = [], sbagliati = []
    const atteso = new Map([...this.fissi, ...this.bersaglio])
    for (const [k, c] of atteso) {
      const ce = this.mattoni.get(k)
      if (!ce) mancano.push(this.xy(k))
      else if (ce !== c) sbagliati.push({ ...this.xy(k), atteso: c, trovato: ce })
    }
    for (const [k] of this.mattoni) if (!atteso.has(k)) troppi.push(this.xy(k))
    return { giusto: !mancano.length && !troppi.length && !sbagliati.length, mancano, troppi, sbagliati }
  }
}

/* ═══════════ l'omino che prova la costruzione ═══════════
   Cammina verso la bandiera, un passo per volta. Le sue regole sono
   quelle di un bambino con le gambe corte:

     · davanti c'è posto: avanza, e se sotto non c'è niente cade;
     · davanti c'è un gradino alto uno, e sopra la testa c'è posto: sale;
     · davanti c'è un muro più alto: si ferma, e la prova è persa;
     · cadere per più di `cadutaMassima` celle fa male: persa;
     · l'acqua non regge: splash, persa.

   Arriva quando sta nella colonna della bandiera, a qualunque altezza:
   un ponte un gradino più alto del previsto è un ponte lo stesso.

   Torna `{ esito, passi }`, e i passi sono le posizioni una per una,
   con come ci è arrivato (`cammina`, `sale`, `cade`): la scena li
   rigioca, il test li conta. */
export function camminaOmino(mondo, { massimo = 400, cadutaMassima = 3 } = {}) {
  if (!mondo.omino || !mondo.bandiera) return { esito: 'niente', passi: [] }
  const o = { ...mondo.omino }
  const passi = []
  const verso = mondo.bandiera.x >= o.x ? 1 : -1
  const bagnato = () => mondo.suoloDi(o.x, o.y) === 'acqua' && !mondo.mattoneDi(o.x, o.y)

  const cadi = () => {
    let giu = 0
    while (!mondo.solido(o.x, o.y + 1)) {
      if (!mondo.dentro(o.x, o.y + 1)) return 'fuori'
      o.y++
      giu++
      passi.push({ ...o, come: 'cade' })
      if (bagnato()) return 'splash'
    }
    return giu > cadutaMassima ? 'caduta' : null
  }

  const prima = cadi()
  if (prima) return { esito: prima, passi }
  for (let n = 0; n < massimo; n++) {
    if (o.x === mondo.bandiera.x) return { esito: 'arrivato', passi }
    const nx = o.x + verso
    if (!mondo.dentro(nx, o.y)) return { esito: 'fuori', passi }
    if (!mondo.solido(nx, o.y)) {
      o.x = nx
      passi.push({ ...o, come: 'cammina' })
      if (bagnato()) return { esito: 'splash', passi }
      const dopo = cadi()
      if (dopo) return { esito: dopo, passi }
    } else if (mondo.dentro(nx, o.y - 1) && !mondo.solido(nx, o.y - 1) && !mondo.solido(o.x, o.y - 1)) {
      o.x = nx
      o.y--
      passi.push({ ...o, come: 'sale' })
    } else {
      return { esito: 'muro', passi }
    }
  }
  return { esito: 'perso', passi }
}
