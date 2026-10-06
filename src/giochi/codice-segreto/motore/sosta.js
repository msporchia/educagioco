// La partita lasciata a metà: uscire non butta via niente. Si scrive solo
// quello che è successo (i codici già vinti, il codice in corso con le
// righe già giocate, la serie del libero); le regole si rifanno dalla
// tappa. Il codice segreto è quello stesso: se uscendo se ne pescasse un
// altro, uscire diventerebbe ripescare. Perché e cosa si perde:
// docs/codice-segreto/sosta.md.
import { CAMPAGNA } from '../dati/campagna.js'
import { SCAGLIONI } from '../dati/difficolta.js'
import { TEMI } from '../dati/temi.js'
import { Partita, Regole, Prova } from './partita.js'
import { Corsa } from './corsa.js'
import { confronta } from './indizi.js'

// sale quando un campo cambia significato: un salvataggio di un'altra
// versione si butta e la tappa ricomincia
export const VERSIONE = 1

const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max

// `contesto` dice dove si gioca: `chiave` della tappa, oppure '' nel gioco
// libero (e allora `difficolta` e `tema` sono quelli scelti), più la
// serie in corso (`fila` per il record, `serie` per l'albo).
// Torna `null` quando non c'è niente da ritrovare: tappa finita, o ancora
// niente fatto, o libero senza serie e col codice appena nato.
export function scrivi(corsa, { chiave = '', difficolta = '', tema = '', fila = 0, serie = 0 } = {}) {
  if (!corsa || corsa.finita) return null
  const p = corsa.partita
  const inCorso = !!p && !p.finita
  const toccato = inCorso && (p.prove.length > 0 || p.corrente.some(s => s != null))
  const libero = !chiave
  // un codice da guardare prima di cominciare non è una partita a metà;
  // una serie del libero sì, anche fra un codice e l'altro
  if (libero ? !toccato && !fila : !toccato && corsa.giocate === 0) return null
  return {
    v: VERSIONE,
    chiave,
    ...(libero ? { difficolta, tema } : {}),
    vinte: corsa.vinte,
    giocate: corsa.giocate,
    monete: corsa.monete,
    peggiore: corsa.peggiore,
    fila,
    serie,
    // fra un codice e l'altro (cartello di fine) non c'è un codice da
    // salvare: al rientro se ne pesca uno nuovo, che nessuno ha visto
    partita: inCorso ? {
      codice: p.codice.slice(),
      prove: p.prove.map(x => x.simboli.slice()),
      corrente: p.corrente.slice(),
    } : null,
  }
}

// Torna `{ corsa, indice, chiave, difficolta, tema, fila, serie }` pronti
// da mettere in tavola, o `null` se il salvataggio non si può leggere:
// chi chiama, in quel caso, butta la sosta e la mappa resta com'è.
export function leggi(dato, { campagna = CAMPAGNA, rnd = Math.random } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  try {
    const libero = !dato.chiave
    let regole, richieste, indice = -1
    if (libero) {
      if (!SCAGLIONI.some(s => s.chiave === dato.difficolta) || !TEMI[dato.tema]) return null
      regole = Regole.libere(dato.difficolta, dato.tema)
      richieste = Infinity
    } else {
      indice = campagna.findIndex(t => t.chiave === dato.chiave)
      if (indice < 0) return null
      regole = Regole.perTappa(campagna[indice])
      richieste = campagna[indice].partite
    }

    if (!intero(dato.vinte, 0, richieste - 1) || !intero(dato.giocate, dato.vinte, 999) ||
        !intero(dato.monete, 0, 1e6) || !intero(dato.peggiore, 0, 3) ||
        !intero(dato.fila || 0, 0, 1e6) || !intero(dato.serie || 0, 0, 1e6)) return null

    const corsa = new Corsa(regole, richieste, { rnd })
    corsa.vinte = dato.vinte
    corsa.giocate = dato.giocate
    corsa.monete = dato.monete
    corsa.peggiore = dato.peggiore

    if (dato.partita) {
      const p = leggiPartita(dato.partita, regole)
      if (!p) return null
      corsa.partita = p
    }                      // senza: il codice nuovo l'ha già pescato Corsa
    return { corsa, indice, chiave: dato.chiave, difficolta: dato.difficolta, tema: dato.tema,
             fila: dato.fila || 0, serie: dato.serie || 0 }
  } catch {
    // un salvataggio storto non porta giù il gioco
    return null
  }
}

// Ogni simbolo deve essere uno di quelli in gioco, ogni riga lunga quanto
// il codice, e i pallini si rifanno con `confronta`: non si fidano dei
// numeri scritti, così non ci si inventa un indizio.
function leggiPartita(d, regole) {
  const buono = s => regole.pool.includes(s)
  const riga = r => Array.isArray(r) && r.length === regole.caselle && r.every(buono)
  if (!riga(d.codice)) return null
  if (!regole.ripetizioni && new Set(d.codice).size !== d.codice.length) return null
  if (!Array.isArray(d.prove) || d.prove.length >= regole.prove || !d.prove.every(riga)) return null
  if (!Array.isArray(d.corrente) || d.corrente.length !== regole.caselle ||
      !d.corrente.every(s => s === null || buono(s))) return null
  // le caselle piene stanno a sinistra, come le lascia posa()
  const primoVuoto = d.corrente.indexOf(null)
  if (primoVuoto >= 0 && d.corrente.slice(primoVuoto).some(s => s !== null)) return null

  const p = new Partita(regole, { codice: d.codice })
  for (const simboli of d.prove) {
    const { pieni, vuoti } = confronta(p.codice, simboli)
    p.prove.push(new Prova(simboli.slice(), pieni, vuoti))
  }
  p.corrente = d.corrente.slice()
  return p
}

// Cosa scrive la carta in cima alla mappa, senza aprire la partita.
export function dice(dato, { campagna = CAMPAGNA } = {}) {
  if (!dato || dato.v !== VERSIONE) return null
  const libero = !dato.chiave
  const t = libero ? null : campagna.find(x => x.chiave === dato.chiave)
  if (!libero && !t) return null
  if (libero && !TEMI[dato.tema]) return null
  return {
    libero,
    nome: libero ? 'Il gioco libero' : t.nome,
    tema: libero ? dato.tema : t.tema,
    codice: dato.vinte + 1,                    // il codice che si sta giocando
    di: libero ? 0 : t.partite,
    righe: dato.partita ? dato.partita.prove.length : 0,
    fila: dato.fila || 0,
  }
}
