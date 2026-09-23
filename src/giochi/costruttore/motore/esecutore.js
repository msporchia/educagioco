/* ═══════════════════════════════════════════════════════════════════
   L'ESECUTORE — il programma del bambino, un passo alla volta

   Non esegue il programma d'un fiato: lo **srotola** in una fila di
   fatti, uno per chiamata di `prossimo()`, e chi lo guida decide quanto
   aspettare fra un fatto e l'altro. È tutto quello che serve per far
   *vedere la macchina che lavora*, che nel costruttore è metà della
   lezione:

     { tipo: 'riga',    id, progetto, profondita }   sta per eseguire questa riga
     { tipo: 'muovi',   da, a, come }                una cella: passo | sale | cade
     { tipo: 'metti',   x, y, colore, dove }
     { tipo: 'giro',    id, n, di }                  il giro n (da 1) di un ripeti
     { tipo: 'guarda',  id, esito, x?, y?, cosa? }   la risposta a una condizione
     { tipo: 'assegna', id, nome, valore }
     { tipo: 'entra',   id, progetto, misure }       si apre la carta di un progetto
     { tipo: 'esce',    progetto }
     { tipo: 'fine' }                                il programma è finito
     { tipo: 'errore',  motivo, id, ... }            il robot si è fermato, e perché

   Gli ultimi due chiudono: dopo, `prossimo()` li ripete per sempre.

   ── PERCHÉ UN GENERATORE ──────────────────────────────────────────
   La pila delle chiamate è quella di JavaScript (`yield*` dentro
   `yield*`), e la ricorsione del bambino è una ricorsione vera. La pila
   *da mostrare* invece la tiene l'esecutore (`this.pila`), perché è
   quella che la vista disegna: «principale › colonna (alta 3)».

   ── LE DUE RETI ────────────────────────────────────────────────────
   Un `ripeti` che non finisce mai e un progetto che chiama sé stesso
   senza fermarsi sono errori normali, non guasti del gioco: si contano
   i passi (`TETTO_PASSI`) e la profondità (`TETTO_PILA`), e al tetto il
   robot si ferma dicendolo. Senza, il telefono di un bambino si
   pianterebbe al primo `ripeti · smetti quando` sbagliato.
   ═══════════════════════════════════════════════════════════════════ */
import { SPOSTAMENTI } from './mondo.js'

export const TETTO_PASSI = 5000
export const TETTO_PILA = 40

/* il robot che si ferma: `motivo` è una chiave di `PERCHE`, e i dettagli
   servono a dirlo con le parole giuste («la lavagnetta h non esiste») */
export class Inciampo extends Error {
  constructor(motivo, id = null, dettagli = {}) {
    super(motivo)
    this.motivo = motivo
    this.id = id
    this.dettagli = dettagli
  }
}

/* Le frasi con cui il robot dice perché si è fermato. Stanno qui e non
   nella vista perché i test le controllano: un errore senza una frase è
   un robot che si ferma muto, e un bambino di nove anni non ha nessun
   altro posto dove leggerlo. */
export const PERCHE = {
  fuori: () => 'Il robot non può uscire dal cantiere.',
  muro: () => 'Davanti c\'è un muro troppo alto: il robot sale un gradino alla volta.',
  testa: () => 'Sopra la testa non c\'è posto: il robot non può salire sul mattone.',
  splash: () => 'Splash! Il robot è finito in acqua: lì non si cammina.',
  'gia-mattone': () => 'Lì c\'è già un mattone: il robot non ne mette due nella stessa casella.',
  terreno: () => 'Lì c\'è il terreno: sulla terra non si posa un mattone, ci si posa sopra.',
  'n-da-scegliere': () => 'Al posto di N ci va un numero: tocca la N e scegli quale.',
  'colore-da-scegliere': () => 'Di che colore è il mattone? Tocca il punto di domanda e scegli.',
  'condizione-da-scegliere': () => 'Manca la domanda: tocca i puntini e scegli cosa deve guardare il robot.',
  'verso-da-scegliere': () => 'Da che parte deve andare il robot? Scegli la freccia.',
  negativo: d => `«${d.quanto}» passi? Il robot conta solo in avanti: il numero è sotto zero.`,
  'ripeti-negativo': d => `Ripetere ${d.quanto} volte non si può: il numero è sotto zero.`,
  'lavagnetta-sconosciuta': d => `Il robot non trova la lavagnetta «${d.nome}».`,
  'non-un-numero': d => `«${d.nome}» è un colore: qui ci va un numero.`,
  'non-un-colore': d => `«${d.nome}» è un numero: qui ci va un colore.`,
  'lavagnetta-ordine': d => `«${d.nome}» la scrive l'ordine, non il robot: si può leggere ma non cambiare.`,
  'misura-fissa': d => `«${d.nome}» è una misura del progetto: dentro il progetto si legge, non si cambia.`,
  'progetto-sconosciuto': () => 'Questo progetto non esiste più.',
  'misure-sbagliate': d => `Il progetto «${d.nome}» vuole ${d.vuole} misure, e ne ha ricevute ${d.date}.`,
  'numero-mancante': () => 'Manca un numero in questa riga.',
  'lavagnetta-mancante': () => 'Manca la lavagnetta da scrivere in questa riga.',
  stanco: () => `Il robot si è stancato: più di ${TETTO_PASSI} mosse. Forse un «ripeti» non finisce mai?`,
  pila: () => `Troppi progetti uno dentro l'altro (più di ${TETTO_PILA}): forse un progetto chiama sé stesso senza fermarsi mai?`,
}

export const fraseDi = errore =>
  (PERCHE[errore.motivo] || (() => 'Il robot si è fermato.'))(errore)

export class Esecuzione {
  /* `lavagnette` sono i numeri dell'ordine (`{ gradini: 5 }`): si
     leggono come le altre, ma non si scrivono. */
  constructor(programma, mondo, { lavagnette = {}, tettoPassi = TETTO_PASSI } = {}) {
    this.programma = programma
    this.mondo = mondo
    this.ordine = { ...lavagnette }
    this.valori = {}
    for (const n of programma.lavagnette || []) this.valori[n] = 0
    this.pila = [{ progetto: null, misure: {} }]
    this.passi = 0
    this.tettoPassi = tettoPassi
    this.fine = null
    this.giro = this.tutto()
  }

  get finita() { return !!this.fine }

  prossimo() {
    if (this.fine) return this.fine
    const r = this.giro.next()
    return r.done ? this.fine : r.value
  }

  /* per i test e per il banco: tutto d'un fiato, e l'ultimo fatto */
  finoInFondo() {
    let e
    do e = this.prossimo(); while (e.tipo !== 'fine' && e.tipo !== 'errore')
    return e
  }

  /* quello che la vista mostra accanto al programma: la pila delle carte
     aperte, con le misure di ognuna, e le lavagnette del bambino */
  fotografia() {
    return {
      pila: this.pila.slice(1).map(c => ({ progetto: c.progetto, misure: { ...c.misure } })),
      valori: { ...this.valori },
      robot: { ...this.mondo.robot },
    }
  }

  *tutto() {
    try {
      yield* this.corpo(this.programma.principale || [])
      this.fine = { tipo: 'fine' }
    } catch (e) {
      if (!(e instanceof Inciampo)) throw e
      this.fine = { tipo: 'errore', motivo: e.motivo, id: e.id, ...e.dettagli }
      this.fine.frase = fraseDi(this.fine)
    }
    yield this.fine
  }

  conta(id) {
    if (++this.passi > this.tettoPassi) throw new Inciampo('stanco', id)
  }

  *corpo(elenco) {
    for (const i of elenco || []) yield* this.istruzione(i)
  }

  *istruzione(i) {
    this.conta(i.id)
    const cornice = this.pila[this.pila.length - 1]
    yield { tipo: 'riga', id: i.id, progetto: cornice.progetto, profondita: this.pila.length - 1 }

    switch (i.tipo) {
      case 'vai': {
        if (i.verso !== 'destra' && i.verso !== 'sinistra') throw new Inciampo('verso-da-scegliere', i.id)
        const n = this.valuta(i.quanto, i.id)
        if (n < 0) throw new Inciampo('negativo', i.id, { quanto: n })
        for (let k = 0; k < n; k++) {
          if (k > 0) this.conta(i.id)
          yield* this.passo(i.verso === 'destra' ? 1 : -1, i.id)
        }
        break
      }
      case 'metti': {
        const colore = this.valutaColore(i.colore, i.id)
        const m = this.mondo
        const r = m.robot
        const dove = i.dove || 'sotto'
        if (dove === 'sotto') {
          /* il mattone va dove il robot ha i piedi, e il robot ci sale
             sopra: serve posto sopra la testa */
          if (!m.libera(r.x, r.y - 1)) throw new Inciampo('testa', i.id, { x: r.x, y: r.y - 1 })
          const no = m.metti(r.x, r.y, colore)
          if (no) throw new Inciampo(no, i.id, { x: r.x, y: r.y })
          yield { tipo: 'metti', x: r.x, y: r.y, colore, dove }
          const a = { x: r.x, y: r.y - 1 }
          m.robot = a
          yield { tipo: 'muovi', da: { ...r }, a: { ...a }, come: 'sale' }
        } else {
          const [dx, dy] = SPOSTAMENTI[dove] || [0, 1]
          const x = r.x + dx, y = r.y + dy
          const no = m.metti(x, y, colore)
          if (no) throw new Inciampo(no, i.id, { x, y })
          yield { tipo: 'metti', x, y, colore, dove }
        }
        break
      }
      case 'ripeti': {
        const n = this.valuta(i.volte, i.id)
        if (n < 0) throw new Inciampo('ripeti-negativo', i.id, { quanto: n })
        for (let k = 0; k < n; k++) {
          if (k > 0) this.conta(i.id)
          yield { tipo: 'giro', id: i.id, n: k + 1, di: n }
          yield* this.corpo(i.corpo)
        }
        break
      }
      case 'finche': {
        for (let k = 0; ; k++) {
          if (k > 0) this.conta(i.id)
          const g = this.prova(i.cond, i.id)
          yield { tipo: 'guarda', id: i.id, ...g }
          if (g.esito) break
          yield { tipo: 'giro', id: i.id, n: k + 1, di: null }
          yield* this.corpo(i.corpo)
        }
        break
      }
      case 'se': {
        const g = this.prova(i.cond, i.id)
        yield { tipo: 'guarda', id: i.id, ...g }
        yield* this.corpo(g.esito ? i.allora : (i.altrimenti || []))
        break
      }
      case 'assegna': {
        if (!i.nome) throw new Inciampo('lavagnetta-mancante', i.id)
        const v = this.valuta(i.valore, i.id)
        this.scrivi(i.nome, v, i.id)
        yield { tipo: 'assegna', id: i.id, nome: i.nome, valore: v }
        break
      }
      case 'chiama': {
        const p = (this.programma.progetti || []).find(q => q.id === i.progetto)
        if (!p) throw new Inciampo('progetto-sconosciuto', i.id)
        const argomenti = i.argomenti || []
        if (argomenti.length !== (p.misure || []).length)
          throw new Inciampo('misure-sbagliate', i.id,
                             { nome: p.nome, vuole: (p.misure || []).length, date: argomenti.length })
        if (this.pila.length > TETTO_PILA) throw new Inciampo('pila', i.id)
        /* le misure si calcolano **prima** di aprire la carta, con le
           lavagnette di chi chiama: `colonna(h)` vuol dire «il valore di
           h adesso», non «la h del progetto» */
        const misure = {}
        const tipi = p.tipi || {}
        ;(p.misure || []).forEach((m, k) => {
          misure[m] = tipi[m] === 'colore' ? this.valutaColore(argomenti[k], i.id) : this.valuta(argomenti[k], i.id)
        })
        this.pila.push({ progetto: p.id, misure })
        yield { tipo: 'entra', id: i.id, progetto: p.id, misure: { ...misure } }
        yield* this.corpo(p.corpo)
        this.pila.pop()
        yield { tipo: 'esce', progetto: p.id }
        break
      }
      default:
        break
    }
  }

  /* ── camminare, salire, cadere ──
     Un passo: se davanti c'è posto si va, e poi si cade finché si ha
     qualcosa sotto; se davanti c'è un gradino alto uno (e sopra la testa
     c'è posto) si sale; se no è un muro. È la stessa regola dell'omino,
     tranne che il robot da qualunque altezza cade senza farsi male. */
  *passo(dx, id) {
    const m = this.mondo
    const r = m.robot
    const nx = r.x + dx
    if (!m.dentro(nx, r.y)) throw new Inciampo('fuori', id, { x: nx, y: r.y })
    if (!m.solido(nx, r.y)) {
      const a = { x: nx, y: r.y }
      m.robot = a
      yield { tipo: 'muovi', da: { ...r }, a: { ...a }, come: 'passo' }
      if (m.suoloDi(a.x, a.y) === 'acqua' && !m.mattoneDi(a.x, a.y)) throw new Inciampo('splash', id, a)
      yield* this.cadi(id)
    } else if (m.libera(nx, r.y - 1) && m.libera(r.x, r.y - 1)) {
      const a = { x: nx, y: r.y - 1 }
      m.robot = a
      yield { tipo: 'muovi', da: { ...r }, a: { ...a }, come: 'sale' }
    } else throw new Inciampo('muro', id, { x: nx, y: r.y })
  }

  *cadi(id) {
    const m = this.mondo
    while (!m.solido(m.robot.x, m.robot.y + 1)) {
      const r = m.robot
      if (!m.dentro(r.x, r.y + 1)) throw new Inciampo('fuori', id, { x: r.x, y: r.y + 1 })
      const a = { x: r.x, y: r.y + 1 }
      m.robot = a
      yield { tipo: 'muovi', da: { ...r }, a: { ...a }, come: 'cade' }
      if (m.suoloDi(a.x, a.y) === 'acqua' && !m.mattoneDi(a.x, a.y)) throw new Inciampo('splash', id, a)
    }
  }

  /* ── i numeri ──
     Due specie di valori girano nel programma: i numeri e i colori (le
     misure di tipo colore, le lavagnette dell'ordine delle bandiere). Una
     al posto dell'altra ferma il robot, e la frase dice quale ci voleva. */
  valuta(e, id) {
    if (!e) throw new Inciampo('numero-mancante', id)
    if (e.vuoto) throw new Inciampo('n-da-scegliere', id)
    if (typeof e === 'string') throw new Inciampo('non-un-numero', id, { nome: e })
    if (typeof e.n === 'number') return e.n
    if (typeof e.v === 'string') {
      const v = this.leggi(e.v, id)
      if (typeof v !== 'number') throw new Inciampo('non-un-numero', id, { nome: e.v })
      return v
    }
    if (e.op) {
      const a = this.valuta(e.a, id)
      const b = this.valuta(e.b, id)
      if (e.op === '+') return a + b
      if (e.op === '-') return a - b
      if (e.op === '×') return a * b
    }
    throw new Inciampo('numero-mancante', id)
  }

  /* un colore: scritto per esteso, o il nome di chi lo porta */
  valutaColore(e, id) {
    if (!e || (typeof e === 'object' && e.vuoto)) throw new Inciampo('colore-da-scegliere', id)
    if (typeof e === 'string') return e
    if (typeof e.v === 'string') {
      const v = this.leggi(e.v, id)
      if (typeof v !== 'string') throw new Inciampo('non-un-colore', id, { nome: e.v })
      return v
    }
    throw new Inciampo('colore-da-scegliere', id)
  }

  /* Chi cerca una lavagnetta la cerca prima fra le misure della carta
     aperta, poi fra quelle del bambino, poi fra i numeri dell'ordine. È
     l'ordine di un linguaggio vero, e serve: dentro `colonna`, «alta» è
     la misura di questa colonna e non un'altra cosa con lo stesso nome. */
  leggi(nome, id) {
    const cornice = this.pila[this.pila.length - 1]
    if (Object.prototype.hasOwnProperty.call(cornice.misure, nome)) return cornice.misure[nome]
    if (Object.prototype.hasOwnProperty.call(this.valori, nome)) return this.valori[nome]
    if (Object.prototype.hasOwnProperty.call(this.ordine, nome)) return this.ordine[nome]
    throw new Inciampo('lavagnetta-sconosciuta', id, { nome })
  }

  scrivi(nome, v, id) {
    const cornice = this.pila[this.pila.length - 1]
    if (Object.prototype.hasOwnProperty.call(cornice.misure, nome)) throw new Inciampo('misura-fissa', id, { nome })
    if (Object.prototype.hasOwnProperty.call(this.ordine, nome)) throw new Inciampo('lavagnetta-ordine', id, { nome })
    this.valori[nome] = v
  }

  /* ── le condizioni ── */
  prova(c, id) {
    if (!c) throw new Inciampo('condizione-da-scegliere', id)
    if (c.tipo === 'confronta') {
      const a = this.valuta(c.a, id), b = this.valuta(c.b, id)
      const esito = c.cmp === '<' ? a < b : c.cmp === '>' ? a > b : a === b
      return { esito, a, b }
    }
    const [dx, dy] = SPOSTAMENTI[c.dove] || [0, 0]
    const x = this.mondo.robot.x + dx, y = this.mondo.robot.y + dy
    const cosa = this.mondo.cosaC(x, y)
    let trovato = c.cosa === 'pieno' ? (cosa === 'mattone' || cosa === 'terreno') : cosa === c.cosa
    /* «un mattone rosso»: il mattone c'è, ed è di quel colore */
    if (trovato && c.cosa === 'mattone' && c.colore) trovato = this.mondo.mattoneDi(x, y) === c.colore
    return { esito: c.c === false ? !trovato : trovato, x, y, cosa }
  }
}
