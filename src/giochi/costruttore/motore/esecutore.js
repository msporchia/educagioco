/* ═══════════════════════════════════════════════════════════════════
   L'ESECUTORE — il programma del bambino, un passo alla volta

   Non esegue il programma d'un fiato: lo **srotola** in una fila di
   fatti, uno per chiamata di `prossimo()`, e chi lo guida decide quanto
   aspettare fra un fatto e l'altro. È tutto quello che serve per far
   *vedere la macchina che lavora*, che nel costruttore è metà della
   lezione:

     { tipo: 'riga',    id, progetto, profondita }   sta per eseguire questa riga
     { tipo: 'giro',    id, n, di }                  il giro n (da 1) di un ripeti
     { tipo: 'guarda',  id, esito, x?, y?, cosa? }   la risposta a una condizione
     { tipo: 'legge',   id, x, y, valore }           il robot ha letto qualcosa
     { tipo: 'assegna', id, nome, valore }
     { tipo: 'entra',   id, progetto, misure }       si apre la carta di un progetto
     { tipo: 'esce',    progetto }
     { tipo: 'fine', sera? }                         il programma (o la giornata) è finito
     { tipo: 'errore',  motivo, id, ... }            il robot si è fermato, e perché

   più i fatti **del mondo**, che li decide lui: nel cantiere di lato
   `muovi` e `metti`, nel porto anche `prendi`, `posa` e `turno` (quello
   che il mondo ha fatto da sé mentre il robot lavorava).

   Gli ultimi due della lista chiudono: dopo, `prossimo()` li ripete per
   sempre.

   ── IL MONDO E L'ESECUTORE ──────────────────────────────────────────
   Qui c'è quello che vale in tutti i mondi: ripetere, decidere, i
   progetti e le loro misure, le lavagnette, i conti. **Camminare,
   mettere, prendere e guardare li sa il mondo** (`mondo.fai`,
   `mondo.guarda`, `mondo.leggi`): il cantiere di lato con la sua
   gravità, il porto dall'alto col suo orologio. Un mondo con un
   orologio ha anche `attendi` (un turno che passa senza fare niente) e
   `finoASera` (quello che succede dopo che il programma è finito: i
   clienti arrivano lo stesso).

   ── PERCHÉ UN GENERATORE ──────────────────────────────────────────
   La pila delle chiamate è quella di JavaScript (`yield*` dentro
   `yield*`), e la ricorsione del bambino è una ricorsione vera. La pila
   *da mostrare* invece la tiene l'esecutore (`this.pila`), perché è
   quella che la vista disegna: «principale › colonna (alta 3)».

   ── LE RETI ────────────────────────────────────────────────────────
   Un `ripeti` che non finisce mai e un progetto che chiama sé stesso
   senza fermarsi sono errori normali, non guasti del gioco: si contano
   i passi (`TETTO_PASSI`) e la profondità (`TETTO_PILA`), e al tetto il
   robot si ferma dicendolo. Senza, il telefono di un bambino si
   pianterebbe al primo `ripeti · smetti quando` sbagliato. Dove c'è un
   orologio c'è una terza rete: tante righe di fila **senza che passi
   un turno** vogliono dire un giro che pensa a vuoto (`TETTO_PENSIERI`).
   ═══════════════════════════════════════════════════════════════════ */
import { Inciampo, Sera } from './inciampo.js'

export { Inciampo }

export const TETTO_PASSI = 5000
export const TETTO_PILA = 40
/* righe di fila senza che il mondo faccia un turno: un giro del porto
   ne esegue una ventina fra un gesto e l'altro, trecento è un giro vuoto */
export const TETTO_PENSIERI = 300

/* Le frasi con cui il robot dice perché si è fermato. Stanno qui e non
   nella vista perché i test le controllano: un errore senza una frase è
   un robot che si ferma muto, e un bambino di nove anni non ha nessun
   altro posto dove leggerlo. Ci sono anche quelle del porto: sono poche,
   e un posto solo si controlla meglio di due. */
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
  'a-vuoto': () => 'Il robot gira a vuoto: ripete e ripete senza fare niente, e il tempo non passa. Forse manca un «aspetta che»?',
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
  /* `lavagnette` sono i numeri dell'ordine (`{ gradini: 5 }`): si
     leggono come le altre, ma non si scrivono. */
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
    /* le letture fatte mentre si calcola un valore: si raccontano dopo */
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
      /* il programma è finito, la giornata forse no: dove c'è un
         orologio, il mondo va avanti da solo fino a sera */
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

  /* le letture fatte calcolando un valore, raccontate una per una */
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
      /* «ripeti per sempre»: finisce quando il mondo dice che è sera, o
         quando il robot si ferma. Senza orologio sarebbe il «ripeti» che
         non finisce mai, e la rete dei passi lo ferma lo stesso. */
      case 'sempre': {
        for (let k = 0; ; k++) {
          if (k > 0) this.conta(i.id)
          yield { tipo: 'giro', id: i.id, n: k + 1, di: null }
          yield* this.corpo(i.corpo)
        }
        // eslint-disable-next-line no-unreachable
        break
      }
      /* «aspetta che [domanda]»: si guarda, e se la risposta è no passa
         un turno. Ogni turno d'attesa è un turno del mondo: la gru cala,
         il nastro scorre, i clienti arrivano. */
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
      /* «aspetta un turno»: il robot sta fermo, il mondo va avanti. Serve
         a chi ha due lavori e in quel momento non ce n'è nessuno: un
         «ripeti per sempre» che guarda e basta girerebbe a vuoto */
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
        /* le misure si calcolano **prima** di aprire la carta, con le
           lavagnette di chi chiama: `colonna(h)` vuol dire «il valore di
           h adesso», non «la h del progetto» */
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
      /* il resto lo sa il mondo: camminare, mettere, prendere, posare */
      default:
        if (this.mondo.fai) yield* this.mondo.fai(i, this)
        break
    }
  }

  /* ── i valori ──
     Tre specie girano nel programma: i numeri, i colori (una misura di
     tipo colore, una lavagnetta dell'ordine delle bandiere, quello che il
     robot legge su una cassa) e — per chi li legge — quello che dice il
     mondo. Una al posto dell'altra ferma il robot, e la frase dice quale
     ci voleva. */
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
      /* il diviso della scuola: senza virgola, e il resto si lascia */
      if (e.op === '÷') {
        if (b === 0) throw new Inciampo('diviso-zero', id)
        return Math.trunc(a / b)
      }
    }
    throw new Inciampo('numero-mancante', id)
  }

  /* un colore: scritto per esteso, il nome di chi lo porta, o letto */
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

  /* un valore di qualunque specie: è quello che scrive una lavagnetta.
     «voglio diventa [quello che chiede il cliente]» ci mette un colore,
     «h diventa [h + 1]» un numero. I conti si fanno solo coi numeri. */
  valore(e, id) {
    if (!e) throw new Inciampo('numero-mancante', id)
    if (typeof e === 'string') return e
    if (e.vuoto) throw new Inciampo('n-da-scegliere', id)
    if (typeof e.v === 'string') return this.leggi(e.v, id)
    if (e.leggi) return this.dalMondo(e.leggi, id)
    return this.valuta(e, id)
  }

  /* quello che il robot legge nel mondo: la chiede al mondo, e la
     ricorda per raccontarla (l'occhio sulla cella che ha letto) */
  dalMondo(lato, id) {
    if (!this.mondo.leggi) throw new Inciampo('niente-da-leggere', id)
    const l = this.mondo.leggi(lato, this, id)
    this.letture.push(l)
    return l.valore
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

  /* ── le condizioni ──
     Il confronto è dell'esecutore (due valori, un segno); guardare è
     del mondo, che sa cosa c'è da vedere. */
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
