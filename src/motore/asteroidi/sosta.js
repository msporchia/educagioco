// La partita lasciata a metà (docs/asteroidi/sosta.md). La tappa, il cielo e
// i falsi si rifanno dal codice; si scrive quello che è successo: dove si
// era, vite, livello, punti, serie, i gettoni in tasca, le monete già prese
// e la domanda aperta con quanta strada aveva fatto il sasso giusto. I sassi
// no: il campo riprende vuoto e rinasce da quella domanda.
import { SCALETTA, VOLO } from '../../data/asteroidi.js'
import { TASCA_MAX } from '../../data/potenziamenti.js'

export const VERSIONE = 1

const VITE_MAX = 5                       // CFG.viteMax di MathGame.vue
const GETTONI = ['gelo', 'mirino']
const MAGAZZINI = ['tabelline', 'mente']

// «p3» è il pianeta 3 della campagna, «m5» la stazione 5: la chiave della
// voce, non la sua posizione nella fila (che si sposta con la scaletta)
export const chiaveDi = voce => (voce ? (voce.tipo === 'mente' ? 'm' : 'p') + voce.i : 'volo')

export const voceDi = chiave => SCALETTA.find(v => chiaveDi(v) === chiave) || null

const intero = (n, min, max) =>
  Number.isInteger(n) && n >= min && n <= max ? n : null
const numero = (n, min, max) =>
  typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max ? n : null
const tondo = n => Math.round(n * 1000) / 1000
const entro = (n, min, max) => Math.max(min, Math.min(max, n))

// la domanda aperta: o torna intera o non torna (e allora ne nasce una nuova)
function domandaDi(d) {
  if (!d || typeof d !== 'object') return null
  const a = numero(d.a, -1e6, 1e6), b = numero(d.b, -1e6, 1e6), ris = numero(d.ris, -1e6, 1e6)
  const peso = numero(d.peso, 1, 10), tolti = intero(d.tolti, 0, 5)
  const quota = numero(d.quota, -2, 1), ms = numero(d.ms, -60000, 60000)
  if ([a, b, ris, peso, tolti, quota, ms].some(x => x === null)) return null
  if (typeof d.chiave !== 'string' || !/^[a-z]+:/.test(d.chiave) || d.chiave.length > 80) return null
  if (typeof d.testo !== 'string' || !d.testo || d.testo.length > 60) return null
  const e = d.esercizio
  if (e !== null && (!e || typeof e !== 'object' || [e.a, e.b, e.ris].some(x => numero(x, -1e6, 1e6) === null)))
    return null
  return { chiave: d.chiave, a, b, ris, testo: d.testo, peso, difficile: !!d.difficile,
           esercizio: e ? JSON.parse(JSON.stringify(e)) : null,
           boss: !!d.boss, gelo: !!d.gelo, tolti, quota, ms }
}

// la nave madre: quanti pezzi le mancano, e se in questa tappa è già arrivata
const MADRE_VUOTA = { attiva: false, chiamata: false, attesa: false, colpi: 0 }
function madreDi(m) {
  if (!m || typeof m !== 'object') return { ...MADRE_VUOTA }
  const colpi = intero(m.colpi, 0, 2)
  if (colpi === null) return { ...MADRE_VUOTA }
  return { attiva: !!m.attiva, chiamata: !!m.chiamata, attesa: !!m.attesa, colpi }
}

/* Quello che la schermata sa. `p`: { chiave, finito, hud, tasca, ultimoGettone,
   chieste, magazzino, monete: { chiesto, dato, mostrate }, aperta }. Una
   partita finita non si scrive, e nemmeno una appena cominciata: senza una
   risposta data (giusta o sbagliata) non c'è niente da riprendere. */
export function scrivi(p) {
  if (!p || p.finito || !p.hud) return null
  const h = p.hud
  if (!(h.giuste > 0 || h.sbagliate > 0)) return null
  const aperta = p.aperta ? {
    chiave: p.aperta.chiave, a: p.aperta.a, b: p.aperta.b, ris: p.aperta.ris,
    testo: p.aperta.testo, peso: p.aperta.peso, difficile: !!p.aperta.difficile,
    esercizio: p.aperta.esercizio ? JSON.parse(JSON.stringify(p.aperta.esercizio)) : null,
    boss: !!p.aperta.boss, gelo: !!p.aperta.gelo,
    tolti: p.aperta.tolti, quota: tondo(entro(p.aperta.quota, -2, 1)),
    ms: Math.round(entro(p.aperta.ms, -60000, 60000)),
  } : null
  return {
    v: VERSIONE,
    chiave: p.chiave,
    hud: { vite: h.vite, punti: h.punti, giuste: h.giuste, mirate: h.mirate,
           sbagliate: h.sbagliate, livello: h.livello, partenza: h.partenza,
           serie: h.serie, serieMax: h.serieMax },
    tasca: { gelo: p.tasca.gelo, mirino: p.tasca.mirino },
    ultimoGettone: p.ultimoGettone || null,
    chieste: p.chieste,
    magazzino: p.magazzino,
    monete: { chiesto: p.monete.chiesto, dato: p.monete.dato, mostrate: p.monete.mostrate },
    madre: madreDi(p.madre),
    aperta,
  }
}

/* La voce del salvataggio, se c'è ancora e si può giocare: `aperta(voce)` è
   il lucchetto dell'età (sta nella schermata, che sa dov'è la fila). Il
   volo si apre a fila finita: `libera`. */
export function voceSalvata(dato, { aperta = () => true, libera = false } = {}) {
  if (!dato || dato.v !== VERSIONE || typeof dato.chiave !== 'string') return null
  if (dato.chiave === 'volo') return libera ? { volo: true, T: VOLO, pos: -1 } : null
  const v = voceDi(dato.chiave)
  return v && aperta(v) ? v : null
}

// cosa dice la mappa in cima: dove si era, senza aprire la partita
export function dice(dato, contesto) {
  const v = voceSalvata(dato, contesto)
  if (!v || !leggiHud(dato)) return null
  const h = dato.hud
  return { volo: !!v.volo, emoji: v.T.emoji, nome: v.T.nome, n: v.volo ? 0 : v.n,
           di: SCALETTA.length, livello: h.livello, vite: h.vite, punti: h.punti,
           giuste: h.giuste, bersaglio: v.volo ? 0 : v.T.bersaglio }
}

function leggiHud(dato) {
  const h = dato.hud
  if (!h || typeof h !== 'object') return null
  const r = {
    vite: intero(h.vite, 1, VITE_MAX), punti: intero(h.punti, 0, 1e7),
    giuste: intero(h.giuste, 0, 1e6), mirate: intero(h.mirate, 0, 1e6),
    sbagliate: intero(h.sbagliate, 0, 1e6), livello: intero(h.livello, 1, 1e4),
    partenza: intero(h.partenza, 1, 1e4), serie: intero(h.serie, 0, 1e6),
    serieMax: intero(h.serieMax, 0, 1e6),
  }
  if (Object.values(r).some(x => x === null)) return null
  if (r.partenza > r.livello || r.serie > r.serieMax) return null
  return r
}

/* La partita pronta da rimettere, o null se qualcosa non torna (e la tappa
   ricomincia). La domanda aperta che non torna non butta la partita: ne
   nasce una nuova. */
export function leggi(dato, contesto) {
  const v = voceSalvata(dato, contesto)
  const hud = v && leggiHud(dato)
  if (!hud) return null
  const t = dato.tasca
  const tasca = { gelo: intero(t && t.gelo, 0, TASCA_MAX), mirino: intero(t && t.mirino, 0, TASCA_MAX) }
  const m = dato.monete || {}
  const monete = { chiesto: numero(m.chiesto, 0, 1e6), dato: numero(m.dato, 0, 1e6),
                   mostrate: numero(m.mostrate, 0, 1e6) }
  const chieste = intero(dato.chieste, 0, 1e6)
  if (tasca.gelo === null || tasca.mirino === null || chieste === null) return null
  if (Object.values(monete).some(x => x === null)) return null
  if (dato.ultimoGettone !== null && !GETTONI.includes(dato.ultimoGettone)) return null
  if (!MAGAZZINI.includes(dato.magazzino)) return null
  return { voce: v, volo: !!v.volo, posizione: v.volo ? -1 : v.pos, hud, tasca,
           ultimoGettone: dato.ultimoGettone, chieste, magazzino: dato.magazzino, monete,
           madre: madreDi(dato.madre), aperta: domandaDi(dato.aperta) }
}

/* Il record di un volo lasciato a metà, letto senza badare alla versione:
   se il salvataggio non si rilegge più, i punti fatti restano buoni. Serve
   quando la sosta si butta («lascio perdere», una tappa nuova). */
export function recordDi(dato) {
  if (!dato || dato.chiave !== 'volo' || !dato.hud) return null
  const h = dato.hud
  const punti = numero(h.punti, 1, 1e7)
  if (punti === null) return null
  return { punti, dettagli: { livello: numero(h.livello, 1, 1e4) || 1, centri: numero(h.giuste, 0, 1e6) || 0,
                              serie: numero(h.serieMax, 0, 1e6) || 0 } }
}
