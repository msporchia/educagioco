// L'esecutore: il programma del bambino srotolato un fatto alla volta. Vedi docs/costruttore/linguaggio.md.
import { Inciampo, Sera } from './inciampo.js'

export { Inciampo }

export const TETTO_PASSI = 5000
export const TETTO_PILA = 40
export const TETTO_PENSIERI = 300 // un giro del porto ne fa una ventina fra un gesto e l'altro

// Le frasi con cui il robot dice perché si è fermato (anche quelle del porto). Stanno qui perché i test le controllano.
export const PERCHE = {
  fuori: () => 'Il robot non può uscire dal cantiere.',
  muro: () => 'Davanti c\'è un muro troppo alto: il robot sale un gradino alla volta.',
  testa: () => 'Sopra la testa non c\'è posto: il robot non può salire sul mattone.',
  splash: () => 'Splash! Il robot è finito in acqua: lì non si cammina.',
  'gia-mattone': () => 'Lì c\'è già un mattone: il robot non ne mette due nella stessa casella.',
  terreno: () => 'Lì c\'è il terreno: sulla terra non si posa un mattone, ci si posa sopra.',
  'n-da-scegliere': () => 'Al posto di N ci va un numero: tocca la N e scegli quale.',
  'colore-da-scegliere': () => 'Di che colore? Tocca il punto di domanda e scegli.',
  'condizione-da-scegliere': () => 'Manca la domanda: tocca i puntini e scegli cosa deve guardare il robot.',
  'verso-da-scegliere': () => 'Da che parte? Scegli la freccia.',
  'posto-da-scegliere': () => 'Dove va il mattone? Tocca il punto di domanda e scegli.',
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
  'a-vuoto': () => 'Il robot ripete e ripete senza fare niente, e il tempo non passa. Forse manca un «aspetta che»?',
  'confronto-colori': () => 'Due colori si confrontano solo con «è uguale a»: uno non è più grande dell\'altro.',
  'diviso-zero': () => 'Diviso zero non si può fare: in zero parti uguali non si divide niente.',
  'niente-tempo': () => 'Qui non c\'è niente da aspettare: questo cantiere non ha un orologio.',
  /* ── il porto ── */
  'porto-fuori': () => 'Il robot non può uscire dal porto.',
  'porto-muro': () => 'Davanti c\'è un muro: il robot ci deve girare intorno.',
  'porto-mare': () => 'Davanti c\'è il mare: il robot non ci va.',
  'porto-cassa': () => 'Davanti c\'è una cassa: il robot non ci passa sopra. Prendila, o girale intorno.',
  'porto-arredo': d => `Davanti c'è ${d.nome}: il robot non ci passa.`,
  'porto-clienti': () => 'Lì aspettano i clienti: il robot resta dalla sua parte del bancone.',
  'mani-piene': () => 'Il robot ha già le mani piene: prima deve posare quello che porta.',
  'mani-vuote': () => 'Il robot non ha niente in mano da posare.',
  'niente-da-prendere': () => 'Lì non c\'è niente da prendere.',
  'posto-occupato': () => 'Lì c\'è già qualcosa: il robot non ci posa sopra un\'altra cosa.',
  'nel-mare': () => 'Nel mare la cassa affonderebbe: il robot non ce la butta.',
  'contro-il-muro': () => 'Lì c\'è il muro: non ci si posa niente.',
  pieno: d => `${maiuscola(d.nome)} è ${d.femminile ? 'piena' : 'pieno'}: non ci sta più niente.`,
  'colore-sbagliato': d => `${maiuscola(d.nome)} prende solo casse ${d.colore}.`,
  'nessun-cliente': () => 'Al bancone non c\'è nessuno a cui darla: prima aspetta che arrivi un cliente.',
  'cliente-sbagliato': d => `Il cliente voleva ${d.chiede}, e gli hai dato ${d.dato}.`,
  'niente-da-leggere': () => 'Lì non c\'è niente da leggere.',
  'letto-colore': () => 'Il robot ha letto un colore, e qui ci va un numero.',
  'letto-numero': () => 'Il robot ha letto un numero, e qui ci va un colore.',
  'in-mare': () => 'Splash! Una cassa è arrivata in fondo al nastro ed è caduta in mare.',
  'cliente-arrabbiato': d => `Il cliente ha aspettato troppo, e se n'è andato arrabbiato: voleva ${d.chiede}.`,
  'porto-strada': () => 'Lì passano i camion: il robot resta sul marciapiede.',
  'niente-camion': () => 'Lì non c\'è nessun camion da caricare: prima aspetta che arrivi.',
  'numero-sbagliato': d => `${maiuscola(d.nome)} prende solo le lettere per il ${d.numero}: ${d.dato}.`,
  'solo-forme': () => 'Sulla pila ci vanno solo le forme di formaggio.',
  schiaccia: d => `Una forma grande sopra una più piccola la schiaccia: sulla pila c'è la ${d.sotto}, e la ${d.sopra} è più grande.`,
  'tentativi-finiti': d => `Il cliente ha guardato ${d.tentativi} lettere e nessuna era la sua: se n'è andato arrabbiato. Voleva il ${d.chiede}.`,
  'richiesta-segreta': () => 'Il cliente non dice quale lettera vuole: dagliene una, e ti dirà «di più!» o «di meno!».',
  'richiesta-qualita': d => `Il cliente non chiede un numero: vuole ${d.chiede}. Quale sia, lo devi scoprire tu.`,
  'camion-vuoto': d => `Il camion ha aspettato troppo ed è ripartito ${d.dentro === 0 ? 'vuoto' : `con ${d.dentro === 1 ? 'una cassa sola' : `${d.dentro} casse`}`}: ne voleva ${d.vuole}.`,
}

function maiuscola(s) { return s ? s[0].toUpperCase() + s.slice(1) : s }

export const fraseDi = errore =>
  (PERCHE[errore.motivo] || (() => 'Il robot si è fermato.'))(errore)

export class Esecuzione {
  // `lavagnette` sono i numeri dell'ordine: si leggono come le altre, ma non si scrivono.
  constructor(programma, mondo, { lavagnette = {}, tettoPassi = null } = {}) {
    this.programma = programma
    this.mondo = mondo
    this.ordine = { ...lavagnette }
    this.valori = {}
    for (const n of programma.lavagnette || []) this.valori[n] = 0
    this.pila = [{ progetto: null, misure: {} }]
    this.passi = 0
    this.tettoPassi = tettoPassi || mondo.tettoPassi || TETTO_PASSI
    this.pensieri = 0
    this.tVisto = null
    this.letture = []
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

  // Quello che la vista mostra accanto al programma: la pila delle carte aperte e le lavagnette del bambino.
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
      // Il programma è finito, la giornata forse no: dove c'è un orologio il mondo va avanti da solo fino a sera.
      if (this.mondo.finoASera) yield* this.mondo.finoASera(this)
      this.fine = { tipo: 'fine' }
    } catch (e) {
      if (e instanceof Sera) this.fine = { tipo: 'fine', sera: true, perche: e.perche }
      else if (e instanceof Inciampo) {
        this.fine = { tipo: 'errore', motivo: e.motivo, id: e.id, ...e.dettagli }
        this.fine.frase = fraseDi(this.fine)
      } else throw e
    }
    yield this.fine
  }

  conta(id) {
    if (++this.passi > this.tettoPassi) throw new Inciampo('stanco', id)
    /* dove c'è un orologio: tante righe e nessun turno è un giro vuoto */
    if (this.mondo.orologio) {
      if (this.mondo.t !== this.tVisto) { this.tVisto = this.mondo.t; this.pensieri = 0 }
      else if (++this.pensieri > TETTO_PENSIERI) throw new Inciampo('a-vuoto', id)
    }
  }

  *corpo(elenco) {
    for (const i of elenco || []) yield* this.istruzione(i)
  }

  *letto(id) {
    const tutte = this.letture.splice(0)
    for (const l of tutte) yield { tipo: 'legge', id, ...l }
  }

  *istruzione(i) {
    this.conta(i.id)
    const cornice = this.pila[this.pila.length - 1]
    yield { tipo: 'riga', id: i.id, progetto: cornice.progetto, profondita: this.pila.length - 1 }

    switch (i.tipo) {
      case 'ripeti': {
        const n = this.valuta(i.volte, i.id)
        yield* this.letto(i.id)
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
          yield* this.letto(i.id)
          yield { tipo: 'guarda', id: i.id, ...g }
          if (g.esito) break
          yield { tipo: 'giro', id: i.id, n: k + 1, di: null }
          yield* this.corpo(i.corpo)
        }
        break
      }
      // Finisce quando il mondo dice che è sera; senza orologio è la rete dei passi a fermarlo.
      case 'sempre': {
        for (let k = 0; ; k++) {
          if (k > 0) this.conta(i.id)
          yield { tipo: 'giro', id: i.id, n: k + 1, di: null }
          yield* this.corpo(i.corpo)
        }
        // eslint-disable-next-line no-unreachable
        break
      }
      // Ogni turno d'attesa è un turno del mondo: la gru cala, il nastro scorre, i clienti arrivano.
      case 'aspetta': {
        if (!this.mondo.attendi) throw new Inciampo('niente-tempo', i.id)
        for (let k = 0; ; k++) {
          if (k > 0) this.conta(i.id)
          const g = this.prova(i.cond, i.id)
          yield* this.letto(i.id)
          yield { tipo: 'guarda', id: i.id, ...g, attesa: k }
          if (g.esito) break
          yield* this.mondo.attendi(this, i.id)
        }
        break
      }
      case 'pausa': {
        if (!this.mondo.attendi) throw new Inciampo('niente-tempo', i.id)
        yield* this.mondo.attendi(this, i.id)
        break
      }
      case 'se': {
        const g = this.prova(i.cond, i.id)
        yield* this.letto(i.id)
        yield { tipo: 'guarda', id: i.id, ...g }
        yield* this.corpo(g.esito ? i.allora : (i.altrimenti || []))
        break
      }
      case 'assegna': {
        if (!i.nome) throw new Inciampo('lavagnetta-mancante', i.id)
        const v = this.valore(i.valore, i.id)
        yield* this.letto(i.id)
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
        const misure = {}
        const tipi = p.tipi || {}
        ;(p.misure || []).forEach((m, k) => {
          misure[m] = tipi[m] === 'colore' ? this.valutaColore(argomenti[k], i.id) : this.valuta(argomenti[k], i.id)
        })
        yield* this.letto(i.id)
        this.pila.push({ progetto: p.id, misure })
        yield { tipo: 'entra', id: i.id, progetto: p.id, misure: { ...misure } }
        yield* this.corpo(p.corpo)
        this.pila.pop()
        yield { tipo: 'esce', progetto: p.id }
        break
      }
      // Il resto lo sa il mondo: camminare, mettere, prendere, posare.
      default:
        if (this.mondo.fai) yield* this.mondo.fai(i, this)
        break
    }
  }

  // Un numero: letterale, lavagnetta, letto dal mondo, o un conto. Una specie sbagliata ferma il robot.
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
    if (e.leggi) {
      const v = this.dalMondo(e.leggi, id)
      if (typeof v !== 'number') throw new Inciampo('letto-colore', id)
      return v
    }
    if (e.op) {
      const a = this.valuta(e.a, id)
      const b = this.valuta(e.b, id)
      if (e.op === '+') return a + b
      if (e.op === '-') return a - b
      if (e.op === '×') return a * b
      if (e.op === '÷') {
        if (b === 0) throw new Inciampo('diviso-zero', id)
        return Math.trunc(a / b)
      }
    }
    throw new Inciampo('numero-mancante', id)
  }

  // Un colore: scritto per esteso, il nome di chi lo porta, o letto.
  valutaColore(e, id) {
    if (!e || (typeof e === 'object' && e.vuoto)) throw new Inciampo('colore-da-scegliere', id)
    if (typeof e === 'string') return e
    if (typeof e.v === 'string') {
      const v = this.leggi(e.v, id)
      if (typeof v !== 'string') throw new Inciampo('non-un-colore', id, { nome: e.v })
      return v
    }
    if (e.leggi) {
      const v = this.dalMondo(e.leggi, id)
      if (typeof v !== 'string') throw new Inciampo('letto-numero', id)
      return v
    }
    throw new Inciampo('colore-da-scegliere', id)
  }

  // Un valore di qualunque specie, quello che scrive una lavagnetta: i conti restano solo per i numeri.
  valore(e, id) {
    if (!e) throw new Inciampo('numero-mancante', id)
    if (typeof e === 'string') return e
    if (e.vuoto) throw new Inciampo('n-da-scegliere', id)
    if (typeof e.v === 'string') return this.leggi(e.v, id)
    if (e.leggi) return this.dalMondo(e.leggi, id)
    return this.valuta(e, id)
  }

  // La chiede al mondo, e ricorda la lettura per raccontarla (l'occhio sulla cella letta).
  dalMondo(lato, id) {
    if (!this.mondo.leggi) throw new Inciampo('niente-da-leggere', id)
    const l = this.mondo.leggi(lato, this, id)
    this.letture.push(l)
    return l.valore
  }

  // Cerca prima fra le misure della carta aperta, poi il bambino, poi l'ordine: vedi docs/costruttore/linguaggio.md.
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

  // Il confronto è dell'esecutore; guardare è del mondo, che sa cosa c'è da vedere.
  prova(c, id) {
    if (!c) throw new Inciampo('condizione-da-scegliere', id)
    if (c.tipo === 'confronta') {
      const a = this.valore(c.a, id), b = this.valore(c.b, id)
      if (typeof a === 'string' || typeof b === 'string') {
        if (c.cmp !== '=') throw new Inciampo('confronto-colori', id)
        return { esito: a === b, a, b }
      }
      const esito = c.cmp === '<' ? a < b : c.cmp === '>' ? a > b : a === b
      return { esito, a, b }
    }
    return this.mondo.guarda(c, this, id)
  }
}
