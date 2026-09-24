/* ═══════════════════════════════════════════════════════════════════
   IL PORTO — un mondo visto dall'alto, che lavora anche da solo

   È la seconda metà del costruttore. Il cantiere di lato era fatto di
   materia: mattoni e forme. Il porto è fatto di **lavoro che arriva**:
   la gru cala una cassa, il nastro la porta verso il mare, un cliente
   al bancone chiede un colore. Il bambino programma un robot solo, e il
   programma non sa cosa arriverà né quando: deve guardare, aspettare e
   decidere. Là gli ordini cambiavano fra una prova e l'altra, qui
   arrivano mentre il programma gira.

   Le coordinate sono quelle dello schermo, viste dall'alto: `x` verso
   destra, `y` verso il basso. «Su» è la cima dello schermo.

   ── LE REGOLE DEL MONDO, CHE VALGONO SEMPRE ────────────────────────
     · **l'orologio.** Il mondo va a turni. Ogni gesto del robot — un
       passo, prendere, posare, un turno d'attesa — costa un turno, e a
       ogni turno tutti gli attori fanno la loro mossa. Pensare è
       gratis: guardare, leggere, decidere, fare i conti non fanno
       passare il tempo. Se no un programma giusto ma pieno di «se»
       sarebbe lento senza che nessuno capisca perché;
     · il robot va ↑ ↓ ← → un passo alla volta. Non entra nel mare, non
       passa i muri, non sale sugli scaffali, sul bancone, sui cassoni e
       sui nastri, e **non passa sopra le cose**: una cassa per terra è
       un ingombro, si prende o si gira intorno;
     · ha due mani e **porta una cosa alla volta**. Prende e posa **di
       fianco a sé**, verso una delle quattro frecce — come nel cantiere
       il mattone andava sotto i piedi o dove sarebbe andato il piede;
     · per terra, su uno scaffale, sul bancone e su un nastro ci sta
       **una cosa sola**; un cassone ne tiene tante, fino alla sua
       capienza, e se ha un colore prende solo casse di quel colore;
     · **legge** quello che c'è di fianco: il colore di una cassa, il
       numero di un biglietto, quello che chiede il cliente al bancone,
       quante casse ci sono in un cassone;
     · il nastro sposta di una casella quello che ci sta sopra, ogni
       `passoNastro` turni; in fondo al molo la cosa cade in mare, e la
       giornata è persa;
     · la gru cala una cassa ogni tot turni nel suo punto, **se è
       libero**: se no aspetta;
     · i clienti si mettono in fila e vengono al bancone uno per volta;
       chiedono una cassa di un colore e aspettano finché hanno
       pazienza. Chi riceve quello che voleva se ne va contento; chi
       riceve un'altra cosa, o aspetta troppo, fa perdere la giornata;
     · un nastro che finisce contro un cassone ci scarica dentro, finché
       c'è posto: è così che il porto lavora anche da solo, e la gru
       riempie il magazzino senza che nessuno la aiuti;
     · i camion arrivano alla loro ora sulla piazzola, vogliono un certo
       numero di casse (a volte di un colore) e **ripartono appena sono
       pieni**; un camion che aspetta troppo riparte mezzo vuoto, e la
       giornata è persa. Sulla strada il robot non ci va;
     · un cassone con un `numero` è una buca delle lettere: prende solo
       i biglietti con quel numero.

   ── LA GIORNATA ──────────────────────────────────────────────────
   Finisce quando l'orologio arriva a `durata`, oppure quando il robot
   aspetta e **non può più succedere niente** (la gru è vuota, sui nastri
   non si muove niente, nessun cliente in arrivo). Un programma che
   finisce prima non ferma il mondo: la gru cala lo stesso e i clienti
   arrivano lo stesso (`finoASera`), ed è così che si vede che il lavoro
   non è finito.

   Qui non c'è niente di disegnato e niente di Vue: gira in Node, e i
   test giocano giornate intere.
   ═══════════════════════════════════════════════════════════════════ */
import { Inciampo, Sera } from '../inciampo.js'
import { leggiCasella, cosaDaLettera } from '../../dati/porto/legenda.js'
import { colore as coloreDi } from '../../dati/colori.js'

export const LATI = { su: [0, -1], giu: [0, 1], destra: [1, 0], sinistra: [-1, 0] }
export const DURATA = 300
/* una giornata lunga esegue tante righe: il tetto dei passi del cantiere
   (cinquemila) fermerebbe un programma giusto a metà pomeriggio */
export const TETTO_PASSI_PORTO = 60000

const NOMI_ARREDI = { scaffale: 'lo scaffale', bancone: 'il bancone', cassone: 'il cassone', nastro: 'il nastro' }

/* un cassone prende questa cosa? il colore di una cassa, il numero di
   una lettera: quello che dice di prendere, e basta */
const accetta = (a, cosa) =>
  (!a.colore || (cosa.tipo === 'cassa' && cosa.colore === a.colore)) &&
  (a.numero == null || (cosa.tipo === 'biglietto' && cosa.numero === a.numero))

/* «una cassa rossa»: i colori stanno scritti al maschile (il rosso), la
   cassa è femmina; e «prende solo casse rosse», al plurale */
const AL_FEMMINILE = { rosso: 'rossa', giallo: 'gialla', bianco: 'bianca', grigio: 'grigia', nero: 'nera' }
const AL_PLURALE = { rosso: 'rosse', giallo: 'gialle', verde: 'verdi', bianco: 'bianche', grigio: 'grigie',
                     nero: 'nere', marrone: 'marroni' }
export const coloreAlFemminile = c => AL_FEMMINILE[c] || (coloreDi(c) || {}).nome || c
export const coloreAlPlurale = c => AL_PLURALE[c] || (coloreDi(c) || {}).nome || c

/* i nomi dei cassoni hanno l'articolo («il camion», «la stiva»): le
   frasi ci costruiscono sopra, e «in il camion» non si dice */
export const eFemminile = nome => /^(la|una) /.test(nome || '')
export function nel(nome) {
  const m = /^(il|lo|la) (.*)$/.exec(nome || '')
  if (m) return { il: 'nel', lo: 'nello', la: 'nella' }[m[1]] + ' ' + m[2]
  if (/^l'/.test(nome || '')) return 'nell\'' + nome.slice(2)
  return `in ${nome}`
}

export function cosaInParole(x) {
  if (x === null || x === undefined) return 'niente'
  if (typeof x === 'string') return `una cassa ${coloreAlFemminile(x)}`
  if (typeof x === 'number') return `il numero ${x}`
  if (x.tipo === 'cassa') return `una cassa ${coloreAlFemminile(x.colore)}`
  if (x.tipo === 'biglietto') return `un biglietto col ${x.numero}`
  return 'qualcosa'
}

/* quello che si legge su una cosa: il colore di una cassa, il numero di
   un biglietto */
export const valoreDi = cosa => (cosa.tipo === 'cassa' ? cosa.colore : cosa.numero)

/* quello che il cliente voleva è quello che ha ricevuto? */
const combacia = (cosa, chiede) =>
  typeof chiede === 'string' ? cosa.tipo === 'cassa' && cosa.colore === chiede
    : cosa.tipo === 'biglietto' && cosa.numero === chiede

export class Porto {
  /* Un ordine (una giornata) diventa un porto: la mappa a coppie di
     caratteri (`dati/porto/legenda.js`), i cassoni, e gli attori. */
  static daOrdine(ordine, livello = {}) {
    const righe = ordine.mappa
    const h = righe.length
    const w = Math.max(...righe.map(r => Math.ceil(r.length / 2)))
    const p = new Porto(w, h)
    p.durata = ordine.durata || livello.durata || DURATA
    p.passoNastro = (ordine.nastro && ordine.nastro.passo) || 2
    p.obiettivo = { ...(livello.obiettivo || {}), ...(ordine.obiettivo || {}) }
    const cassoni = ordine.cassoni || {}
    righe.forEach((riga, y) => {
      for (let x = 0; x < w; x++) {
        const coppia = (riga.slice(2 * x, 2 * x + 2) || '..').padEnd(2, '.')
        const c = leggiCasella(coppia, ordine.legenda)
        if (!c) throw new Error(`porto: la casella «${coppia}» (riga ${y + 1}, colonna ${x + 1}) non è in legenda`)
        const k = p.k(x, y)
        p.suolo[k] = c.suolo
        if (c.arredo) {
          const a = { ...c.arredo }
          if (a.tipo === 'cassone') {
            const spec = cassoni[a.id]
            if (!spec) throw new Error(`porto: il cassone «${a.id}» non è descritto nei \`cassoni\` dell'ordine`)
            a.nome = spec.nome || 'il cassone'
            a.capienza = spec.capienza ?? 99
            a.colore = spec.colore || null
            a.figura = spec.figura || 'cassone'
            a.numero = spec.numero ?? null
            for (const l of spec.dentro || '') {
              const cosa = cosaDaLettera(l)
              if (!cosa) throw new Error(`porto: nel cassone «${a.id}» la lettera «${l}» non è una cassa né un biglietto`)
              p.pile[k].push(p.nuovaCosa(cosa))
            }
          }
          if (a.tipo === 'nastro') p.celleNastro.push(k)
          p.arredo[k] = a
        }
        if (c.cosa) p.pile[k].push(p.nuovaCosa(c.cosa))
        if (c.bersaglio) p.bersaglio.set(k, c.bersaglio)
        if (c.robot) p.robot = { x, y }
        if (c.gru) p.puntoGru = { x, y }
        if (c.clienti) p.puntoClienti = { x, y }
        if (c.piazzola) p.piazzole.push(k)
      }
    })
    if (!p.robot) throw new Error('porto: nella mappa manca il robot (@)')
    p.partenza = { ...p.robot }

    if (ordine.gru) {
      if (!p.puntoGru) throw new Error('porto: c\'è la gru ma nella mappa manca il suo punto (*)')
      const casse = [...(ordine.gru.casse || '')].map(l => {
        const cosa = cosaDaLettera(l)
        if (!cosa) throw new Error(`porto: la gru ha una lettera «${l}» che non è una cassa né un biglietto`)
        return p.nuovaCosa(cosa)
      })
      p.gru = { ...p.puntoGru, casse, ogni: ordine.gru.ogni || 6, prossimo: ordine.gru.primo ?? 1, calate: 0 }
    }
    if (ordine.clienti) {
      if (!p.puntoClienti) throw new Error('porto: ci sono i clienti ma nella mappa manca il loro posto (%)')
      if (!p.arredi('bancone').length) throw new Error('porto: ci sono i clienti ma non c\'è il bancone (B)')
      const fila = (ordine.clienti.fila || []).map(([arriva, chiede], n) => ({ id: n + 1, arriva, chiede }))
      p.clienti = { fila, alBancone: null, pazienza: ordine.clienti.pazienza || 120,
                    serviti: 0, arrabbiati: 0, totale: fila.length }
    }
    /* i camion: `fila` è [[arriva, vuole, colore?], …] */
    if (ordine.camion) {
      if (!p.piazzole.length) throw new Error('porto: ci sono i camion ma nella mappa manca la piazzola (&)')
      const fila = (ordine.camion.fila || []).map(([arriva, vuole, colore = null], n) => ({ id: n + 1, arriva, vuole, colore }))
      p.camion = { fila, pazienza: ordine.camion.pazienza || 120, partiti: 0, totale: fila.length }
    }
    return p
  }

  constructor(w, h) {
    this.w = w
    this.h = h
    this.suolo = new Array(w * h).fill('pavimento')
    this.arredo = new Array(w * h).fill(null)
    /* le cose di ogni casella, dal basso in alto: una sola quasi
       dappertutto, tante in un cassone (si prende quella in cima) */
    this.pile = Array.from({ length: w * h }, () => [])
    this.bersaglio = new Map()       // casella → colore della cassa che ci deve finire
    this.celleNastro = []
    this.robot = null
    this.partenza = null
    this.verso = 'destra'            // da che parte guarda: serve solo a chi disegna
    this.mano = null
    this.gru = null
    this.clienti = null
    this.puntoGru = null
    this.puntoClienti = null
    this.camion = null
    this.piazzole = []
    this.t = 0
    this.durata = DURATA
    this.passoNastro = 2
    this.obiettivo = {}
    this.ultimaCosa = 0
    /* per l'esecutore: il porto ha un orologio, e le giornate sono lunghe */
    this.orologio = true
    this.tettoPassi = TETTO_PASSI_PORTO
  }

  k(x, y) { return y * this.w + x }
  xy(k) { return { x: k % this.w, y: Math.floor(k / this.w) } }
  dentro(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h }
  cimaDi(k) { const p = this.pile[k]; return p.length ? p[p.length - 1] : null }
  arredi(tipo) { return this.arredo.map((a, k) => (a && a.tipo === tipo ? k : -1)).filter(k => k >= 0) }
  cassone(id) { return this.arredo.findIndex(a => a && a.tipo === 'cassone' && a.id === String(id)) }
  nuovaCosa(spec) { return { id: ++this.ultimaCosa, ...spec } }
  eClienti(x, y) { return !!this.puntoClienti && this.puntoClienti.x === x && this.puntoClienti.y === y }

  /* Perché il robot non può mettere piede in una casella: `null` se può.
     Il motivo è una chiave di `PERCHE`, e i dettagli servono alla frase. */
  ostacolo(x, y) {
    if (!this.dentro(x, y)) return { motivo: 'porto-fuori' }
    const k = this.k(x, y)
    if (this.suolo[k] === 'muro') return { motivo: 'porto-muro' }
    if (this.suolo[k] === 'mare') return { motivo: 'porto-mare' }
    const a = this.arredo[k]
    if (a) return { motivo: 'porto-arredo', nome: a.tipo === 'cassone' ? a.nome : NOMI_ARREDI[a.tipo] }
    if (this.suolo[k] === 'strada') return { motivo: 'porto-strada' }
    if (this.eClienti(x, y)) return { motivo: 'porto-clienti' }
    if (this.pile[k].length) return { motivo: 'porto-cassa', cosa: this.pile[k][0].tipo }
    return null
  }

  /* la casella di fianco al robot, verso una freccia */
  diFianco(lato, id) {
    if (!LATI[lato]) throw new Inciampo('verso-da-scegliere', id)
    const [dx, dy] = LATI[lato]
    return { x: this.robot.x + dx, y: this.robot.y + dy }
  }

  /* ═══════════ quello che il robot fa ═══════════ */
  *fai(i, es) {
    switch (i.tipo) {
      case 'vai': {
        if (!LATI[i.verso]) throw new Inciampo('verso-da-scegliere', i.id)
        const n = es.valuta(i.quanto, i.id)
        yield* es.letto(i.id)
        if (n < 0) throw new Inciampo('negativo', i.id, { quanto: n })
        const [dx, dy] = LATI[i.verso]
        for (let k = 0; k < n; k++) {
          if (k > 0) es.conta(i.id)
          const r = this.robot
          const x = r.x + dx, y = r.y + dy
          const no = this.ostacolo(x, y)
          if (no) throw new Inciampo(no.motivo, i.id, { x, y, ...no })
          this.robot = { x, y }
          this.verso = i.verso
          yield { tipo: 'muovi', da: { ...r }, a: { x, y }, come: 'passo', verso: i.verso }
          yield* this.turno('gesto')
        }
        break
      }
      case 'prendi': {
        const { x, y } = this.diFianco(i.lato, i.id)
        this.verso = i.lato
        if (this.mano) throw new Inciampo('mani-piene', i.id, { x, y })
        if (!this.dentro(x, y) || !this.pile[this.k(x, y)].length) throw new Inciampo('niente-da-prendere', i.id, { x, y })
        const k = this.k(x, y)
        const cosa = this.pile[k].pop()
        this.mano = cosa
        yield { tipo: 'prendi', x, y, cosa: { ...cosa }, da: this.arredo[k] ? this.arredo[k].tipo : 'pavimento' }
        yield* this.turno('gesto')
        break
      }
      case 'posa': {
        const { x, y } = this.diFianco(i.lato, i.id)
        this.verso = i.lato
        if (!this.mano) throw new Inciampo('mani-vuote', i.id, { x, y })
        if (!this.dentro(x, y)) throw new Inciampo('porto-fuori', i.id, { x, y })
        const k = this.k(x, y)
        if (this.suolo[k] === 'muro') throw new Inciampo('contro-il-muro', i.id, { x, y })
        if (this.suolo[k] === 'mare') throw new Inciampo('nel-mare', i.id, { x, y })
        if (this.eClienti(x, y)) throw new Inciampo('porto-clienti', i.id, { x, y })
        const a = this.arredo[k]
        if (!a && this.suolo[k] === 'strada') throw new Inciampo('niente-camion', i.id, { x, y })
        const cosa = this.mano
        let servito = null
        if (a && a.tipo === 'bancone') {
          servito = this.servi(cosa, i.id)
        } else if (a && a.tipo === 'cassone') {
          if (a.colore && !(cosa.tipo === 'cassa' && cosa.colore === a.colore))
            throw new Inciampo('colore-sbagliato', i.id, { x, y, nome: a.nome, colore: coloreAlPlurale(a.colore) })
          if (a.numero != null && !(cosa.tipo === 'biglietto' && cosa.numero === a.numero))
            throw new Inciampo('numero-sbagliato', i.id, { x, y, nome: a.nome, numero: a.numero,
                                                          dato: cosa.tipo === 'biglietto' ? `questa è per il ${cosa.numero}` : `questa è ${cosaInParole(cosa)}` })
          if (this.pile[k].length >= a.capienza)
            throw new Inciampo('pieno', i.id, { x, y, nome: a.nome, femminile: eFemminile(a.nome) })
          this.pile[k].push(cosa)
        } else {
          if (this.pile[k].length) throw new Inciampo('posto-occupato', i.id, { x, y })
          this.pile[k].push(cosa)
        }
        this.mano = null
        yield { tipo: 'posa', x, y, cosa: { ...cosa }, su: a ? a.tipo : 'pavimento', servito }
        yield* this.turno('gesto')
        break
      }
      default:
        break
    }
  }

  /* il cliente al bancone riceve una cosa: se è quella che voleva se ne
     va contento, se no la giornata è persa — sbagliare un cliente non è
     un dettaglio da scoprire a sera */
  servi(cosa, id) {
    const c = this.clienti && this.clienti.alBancone
    if (!c) throw new Inciampo('nessun-cliente', id)
    if (!combacia(cosa, c.chiede))
      throw new Inciampo('cliente-sbagliato', id, { chiede: cosaInParole(c.chiede), dato: cosaInParole(cosa) })
    this.clienti.alBancone = null
    this.clienti.serviti++
    return { ...c }
  }

  /* ═══════════ quello che il robot guarda, e legge ═══════════ */
  guarda(c, es, id) {
    if (c.dove === 'mano') {
      const trovato = this.eCosa(this.mano, c, es, id)
      return { esito: c.c === false ? !trovato : trovato, mano: true, cosa: this.mano ? this.mano.tipo : 'niente' }
    }
    if (!LATI[c.dove]) throw new Inciampo('condizione-da-scegliere', id)
    const [dx, dy] = LATI[c.dove]
    const x = this.robot.x + dx, y = this.robot.y + dy
    const trovato = this.eQui(x, y, c, es, id)
    return { esito: c.c === false ? !trovato : trovato, x, y, cosa: this.cosaC(x, y) }
  }

  /* la cosa in mano, o in cima a una casella, è quella della domanda? */
  eCosa(cosa, c, es, id) {
    if (c.cosa === 'niente') return !cosa
    if (!cosa) return false
    if (c.cosa === 'cassa') return cosa.tipo === 'cassa' && (!c.colore || cosa.colore === es.valutaColore(c.colore, id))
    if (c.cosa === 'biglietto') return cosa.tipo === 'biglietto'
    return false
  }

  eQui(x, y, c, es, id) {
    if (c.cosa === 'bordo') return !this.dentro(x, y)
    if (!this.dentro(x, y)) return false
    const k = this.k(x, y)
    switch (c.cosa) {
      case 'cassa': case 'biglietto': case 'niente': return this.eCosa(this.cimaDi(k), c, es, id)
      case 'libero': return !this.ostacolo(x, y)
      case 'cliente': return !!(this.arredo[k] && this.arredo[k].tipo === 'bancone' && this.clienti && this.clienti.alBancone)
      case 'muro': return this.suolo[k] === 'muro'
      case 'mare': return this.suolo[k] === 'mare'
      case 'strada': return this.suolo[k] === 'strada'
      /* «↓ c'è un camion»: un cassone che viaggia, fermo sulla piazzola */
      case 'camion': {
        const a = this.arredo[k]
        return !!(a && a.tipo === 'cassone' && a.figura === 'camion') && (!c.colore || a.colore === es.valutaColore(c.colore, id))
      }
      /* «un cassone rosso»: quello che prende solo casse rosse */
      case 'cassone': {
        const a = this.arredo[k]
        return !!(a && a.tipo === 'cassone') && (!c.colore || a.colore === es.valutaColore(c.colore, id))
      }
      default: return !!(this.arredo[k] && this.arredo[k].tipo === c.cosa)
    }
  }

  /* quello che c'è in una casella, in una parola: la regia lo mostra */
  cosaC(x, y) {
    if (!this.dentro(x, y)) return 'bordo'
    const k = this.k(x, y)
    const cima = this.cimaDi(k)
    if (cima) return cima.tipo
    if (this.arredo[k]) return this.arredo[k].tipo
    return this.suolo[k]
  }

  /* Leggere: torna `{ x, y, valore }` (o `{ mano: true, valore }`). Un
     cassone si legge come **quante** casse tiene: è una quantità, non
     una cassa sola. Un bancone vuoto con un cliente davanti si legge
     come quello che il cliente chiede. */
  leggi(lato, es, id) {
    if (lato === 'mano') {
      if (!this.mano) throw new Inciampo('niente-da-leggere', id)
      return { mano: true, valore: valoreDi(this.mano) }
    }
    const { x, y } = this.diFianco(lato, id)
    if (!this.dentro(x, y)) throw new Inciampo('niente-da-leggere', id, { x, y })
    const k = this.k(x, y)
    const a = this.arredo[k]
    if (a && a.tipo === 'cassone') return { x, y, valore: this.pile[k].length }
    const cima = this.cimaDi(k)
    if (cima) return { x, y, valore: valoreDi(cima) }
    if (a && a.tipo === 'bancone' && this.clienti && this.clienti.alBancone)
      return { x, y, valore: this.clienti.alBancone.chiede }
    throw new Inciampo('niente-da-leggere', id, { x, y })
  }

  /* ═══════════ l'orologio ═══════════
     Un turno: prima i nastri, poi la gru (così una cassa calata sul
     nastro non scorre nello stesso turno), poi i clienti. Il fatto
     `turno` racconta alla regia cosa è successo; un guaio (una cassa in
     mare, un cliente arrabbiato) ferma la giornata. `come` dice alla
     regia che turno era: un gesto del robot, un'attesa, o il mondo che
     va avanti da solo a programma finito. */
  *turno(come = 'gesto') {
    this.t++
    const eventi = []
    this.nastri(eventi)
    this.lavoroDellaGru(eventi)
    this.lavoroDeiClienti(eventi)
    this.lavoroDeiCamion(eventi)
    yield { tipo: 'turno', t: this.t, come, eventi }
    const guaio = eventi.find(e => e.guaio)
    if (guaio) throw new Inciampo(guaio.guaio, null, guaio)
    if (this.t >= this.durata) throw new Sera('orologio')
  }

  /* un turno d'attesa: se non può più succedere niente, aspettare non
     serve — è sera */
  *attendi() {
    if (this.quieto()) throw new Sera('quiete')
    yield* this.turno('attesa')
  }

  /* il programma è finito, il porto no */
  *finoASera() {
    while (!this.quieto()) yield* this.turno('da-solo')
  }

  /* niente può più cambiare da solo: la gru è vuota, sui nastri non si
     muove niente, nessun cliente al bancone o in arrivo */
  quieto() {
    if (this.gru && this.gru.casse.length) return false
    if (this.clienti && (this.clienti.alBancone || this.clienti.fila.length)) return false
    if (this.camion && (this.camion.fila.length || this.piazzole.some(k => this.arredo[k]))) return false
    return !this.celleNastro.some(k => this.pile[k].length && this.puoScorrere(k))
  }

  /* dove andrebbe la cosa sul nastro `k`, e se ci può andare */
  destinoSulNastro(k) {
    const { x, y } = this.xy(k)
    const [dx, dy] = LATI[this.arredo[k].verso]
    const nx = x + dx, ny = y + dy
    if (!this.dentro(nx, ny) || this.suolo[this.k(nx, ny)] === 'mare') return { x: nx, y: ny, mare: true }
    const nk = this.k(nx, ny)
    const na = this.arredo[nk]
    if (na && na.tipo === 'nastro' && !this.pile[nk].length) return { x: nx, y: ny, k: nk }
    /* in fondo al nastro un cassone: ci scarica dentro, se c'è posto e
       se la cosa è di quelle che prende */
    if (na && na.tipo === 'cassone' && this.pile[nk].length < na.capienza && accetta(na, this.cimaDi(k)))
      return { x: nx, y: ny, k: nk, dentro: true }
    return null
  }
  puoScorrere(k) { return !!this.destinoSulNastro(k) }

  /* i nastri: ogni `passoNastro` turni ogni cosa va avanti di una
     casella, se davanti c'è posto; in fondo al molo cade in mare. Si
     rifà il giro finché qualcosa si muove, perché una cassa si sposta
     solo se quella davanti si è già spostata — e mai due volte */
  nastri(eventi) {
    if (!this.celleNastro.length || this.t % this.passoNastro !== 0) return
    /* lo scatto si racconta anche a nastro vuoto: la macchina gira, e chi
       disegna fa scorrere i listelli */
    eventi.push({ che: 'nastri' })
    const mosse = new Set()
    let cambiato = true
    while (cambiato) {
      cambiato = false
      for (const k of this.celleNastro) {
        const cosa = this.cimaDi(k)
        if (!cosa || mosse.has(cosa.id)) continue
        const d = this.destinoSulNastro(k)
        if (!d) continue
        this.pile[k].pop()
        mosse.add(cosa.id)
        cambiato = true
        const da = this.xy(k)
        if (d.mare) {
          eventi.push({ che: 'in-mare', id: cosa.id, cosa: { ...cosa }, da, a: { x: d.x, y: d.y }, guaio: 'in-mare' })
          continue
        }
        this.pile[d.k].push(cosa)
        eventi.push({ che: 'scorre', id: cosa.id, cosa: { ...cosa }, da, a: { x: d.x, y: d.y } })
      }
    }
  }

  /* la gru: una cassa ogni `ogni` turni, nel suo punto, se è libero */
  lavoroDellaGru(eventi) {
    const g = this.gru
    if (!g || !g.casse.length || this.t < g.prossimo) return
    const k = this.k(g.x, g.y)
    if (this.pile[k].length) return
    if (this.robot.x === g.x && this.robot.y === g.y) return
    const cosa = g.casse.shift()
    this.pile[k].push(cosa)
    g.calate++
    g.prossimo = this.t + g.ogni
    eventi.push({ che: 'cala', id: cosa.id, x: g.x, y: g.y, cosa: { ...cosa } })
  }

  /* i clienti: uno alla volta al bancone; la pazienza cala solo lì */
  lavoroDeiClienti(eventi) {
    const c = this.clienti
    if (!c) return
    if (c.alBancone) {
      c.alBancone.pazienza--
      if (c.alBancone.pazienza <= 0) {
        const via = c.alBancone
        c.alBancone = null
        c.arrabbiati++
        eventi.push({ che: 'arrabbiato', cliente: via.id, chiede: cosaInParole(via.chiede), guaio: 'cliente-arrabbiato' })
        return
      }
    }
    if (!c.alBancone && c.fila.length && c.fila[0].arriva <= this.t) {
      const nuovo = c.fila.shift()
      c.alBancone = { ...nuovo, pazienza: c.pazienza, max: c.pazienza }
      eventi.push({ che: 'cliente', cliente: nuovo.id, chiede: nuovo.chiede })
    }
  }

  /* I camion: arrivano alla loro ora sulla prima piazzola libera,
     vogliono `vuole` casse (di un colore, se lo dicono) e ripartono
     appena sono pieni. Si guarda prima chi arriva e poi chi parte: un
     camion appena arrivato è vuoto, e una piazzola lasciata libera in
     questo turno si riempie al prossimo — due camion nello stesso
     istante nella stessa casella non si vedrebbero. */
  lavoroDeiCamion(eventi) {
    const c = this.camion
    if (!c) return
    const liberate = new Set()
    for (const k of this.piazzole) {
      const a = this.arredo[k]
      if (!a) continue
      const { x, y } = this.xy(k)
      if (this.pile[k].length >= a.capienza) {
        eventi.push({ che: 'camion-parte', x, y, contento: true, colore: a.colore, carico: this.pile[k].map(q => ({ ...q })) })
        this.arredo[k] = null
        this.pile[k] = []
        c.partiti++
        liberate.add(k)
        continue
      }
      if (--a.pazienza <= 0) {
        eventi.push({ che: 'camion-parte', x, y, contento: false, colore: a.colore, carico: this.pile[k].map(q => ({ ...q })),
                      guaio: 'camion-vuoto', dentro: this.pile[k].length, vuole: a.capienza })
        this.arredo[k] = null
        this.pile[k] = []
        liberate.add(k)
      }
    }
    for (const k of this.piazzole) {
      if (this.arredo[k] || liberate.has(k) || !c.fila.length || c.fila[0].arriva > this.t) continue
      const m = c.fila.shift()
      this.arredo[k] = { tipo: 'cassone', figura: 'camion', nome: 'il camion', id: `camion-${m.id}`,
                         capienza: m.vuole, colore: m.colore, numero: null, pazienza: c.pazienza, max: c.pazienza, mezzo: m.id }
      const { x, y } = this.xy(k)
      eventi.push({ che: 'camion-arriva', x, y, vuole: m.vuole, colore: m.colore })
    }
  }

  /* quanti clienti sono già arrivati e aspettano in fila, dietro a chi
     sta al bancone: li disegna la scena */
  inFila() {
    return this.clienti ? this.clienti.fila.filter(f => f.arriva <= this.t).length : 0
  }
}
