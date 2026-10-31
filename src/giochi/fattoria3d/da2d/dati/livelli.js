/* Il livello della fattoria: solo le soglie. Cosa arriva a ogni livello lo dicono le cose stesse
   (liv sulla voce, roba(liv) le raccoglie) — vedi docs/fattoria/livelli.md. */
import { CATEGORIE, CATALOGO } from './catalogo.js'
import { COLTURE, RICETTE, PROFONDITA } from './coltivazioni.js'
import { ANIMALI } from './animali.js'

// Quanta esperienza serve in tutto (spesa + consegne) per un livello: una formula, non una tabella,
// così non finiscono mai. Il passo minimo sta sopra tutta l'attrezzatura di partenza (SOGLIA_B),
// e ogni salto aggiunge il costo di quello che il livello apre (costoDelLivello) — vedi livelli.md.
export const SOGLIA_A = 8, SOGLIA_B = 200
export const ALLUNGA = 1.25

// Il passo di sempre, da solo.
const passiFinoA = livello =>
  ALLUNGA * (SOGLIA_A * (livello - 1) ** 2 + SOGLIA_B * (livello - 1))

// Quanto costa comprare una volta quello che il livello apre di produttivo; le decorazioni non contano.
export const costoDelLivello = livello =>
  livello < 2 ? 0 : premiDi(livello)
    .filter(p => p.tipo === 'bestia' || p.zona === 'lavoro')
    .reduce((n, p) => n + (p.prezzo || 0), 0)

// Tenuta da parte: i premi non cambiano mai durante una partita.
let costi = null
function costiFinoA(livello) {
  if (!costi) {
    costi = [0, 0]
    for (let l = 1; l <= ULTIMO; l++) costi[l + 1] = costi[l] + costoDelLivello(l)
  }
  return costi[Math.min(livello, costi.length - 1)]
}

export function sogliaDi(livello) {
  const l = Math.max(1, livello | 0)
  return Math.round(passiFinoA(l) / 10) * 10 + costiFinoA(l)
}

export function livelloPer(speso = 0) {
  const s = Math.max(0, speso || 0)
  // Non c'è più un'inversa scritta: si cerca a raddoppio e poi a bisezione.
  let giu = 1, su = 2
  while (sogliaDi(su) <= s) su *= 2
  while (su - giu > 1) {
    const m = (giu + su) >> 1
    if (sogliaDi(m) <= s) giu = m
    else su = m
  }
  return giu
}

// Servono solo a non far scendere una fattoria salvata prima che le soglie cambiassero.
export const SOGLIE_ORA = 2
const sogliaVecchia = l => Math.round((8 * (l - 1) ** 2 + 200 * (l - 1)) / 10) * 10
export function livelloVecchioPer(esperienza = 0) {
  let l = 1
  while (sogliaVecchia(l + 1) <= esperienza) l++
  return l
}

// Due o tre decorazioni per livello (mai di più), ordinate per prezzo; quello che lavora dichiara liv a mano.
export const DECORI_PER_LIVELLO = 3
// Il livello 1 è solo la fattoria: niente da abbellire finché non c'è niente da guardare.
export const PRIMO_DECORO = 2

const DOVE = Object.fromEntries(
  CATEGORIE.flatMap(c => c.voci.map(v => [v.id, c.chiave])))
export const categoriaDi = id => DOVE[id] || null

const PER_CHIAVE = Object.fromEntries(CATEGORIE.map(c => [c.chiave, c]))
export const zonaDi = id => (PER_CHIAVE[categoriaDi(id)] || {}).zona || 'bello'

// Dalla più economica alla più cara; l'id spareggia, se no l'ordine cambierebbe fra una build e l'altra.
const FILA = CATALOGO
  /* Le voci stagionali non stanno in fila: si comprano solo nella
     loro finestra (`dati/stagioni.js`) e non sono un premio di nessun
     livello — se ci stessero, una zucca comprabile due settimane
     l'anno occuperebbe uno dei due-tre posti di un livello. Le
     sorprese della fiera nemmeno: non si comprano, si vincono con la
     mongolfiera — e otto voci in più nella fila sposterebbero di
     livello tutte le decorazioni che vengono dopo. */
  .filter(v => !v.liv && !v.stagione && !v.fiera && zonaDi(v.id) === 'bello')
  .slice()
  .sort((a, b) => a.prezzo - b.prezzo || (a.id < b.id ? -1 : 1))
  .map(v => v.id)

const POSTO = Object.fromEntries(FILA.map((id, i) => [id, i]))

export function livelloDellaVoce(v) {
  if (!v) return 1
  if (v.liv) return Math.max(1, v.liv)
  if (zonaDi(v.id) === 'lavoro') return 1
  const i = POSTO[v.id]
  return i === undefined ? 1 : PRIMO_DECORO + Math.floor(i / DECORI_PER_LIVELLO)
}

// A che livello si vede comparire una linguetta: quando arriva la sua prima voce.
export const livelloDellaScheda = c =>
  Math.min(...c.voci.map(livelloDellaVoce))

// Fin dove arriva la roba dichiarata; oltre si continua a salire ma senza niente di nuovo da aprire.
export const ULTIMO = Math.max(
  ...CATALOGO.map(livelloDellaVoce),
  ...COLTURE.map(c => c.liv || 1),
  ...Object.values(ANIMALI).map(a => a.liv || 1))

// I nomi: solo per le cose che cambiano il gioco; gli altri livelli prendono il nome della cosa più bella.
export const NOMI = {
  orto: 'Il primo campo',
  mercato: 'Il mercato',
  'cane-bobtail': 'Il primo amico',
  mulino: 'Il mulino',
  carote: 'Le carote',
  fienile: 'Il fienile',
  conigliera: 'I conigli',
  carretto_mercato: 'Il vicino',
  pollaio: 'Le galline',
  mais: 'Il mais',
  erba: 'L\'erba medica',
  ovile: 'Le pecore',
  telaio: 'Il telaio',
  panificio: 'Il panificio',
  stalla: 'Le mucche',
  // Il caseificio arriva due livelli dopo le mucche: il latte dev'essere prima una cosa che si ha.
  caseificio: 'Il caseificio',
  pasticceria: 'La pasticceria',
  patate: 'Le patate e i cavolfiori',
  pentolone: 'Il pentolone',
  stagno_anatre: 'Le anatre',
  cucina: 'La cucina',
  mongolfiera: 'La mongolfiera',
  zucche: 'Le zucche',
  porcile: 'I maiali',
  osteria: 'L\'osteria',
  barbabietola: 'La barbabietola',
  zuccherificio: 'Lo zuccherificio',
  pomodori: 'La zuppa d\'orto',
  gelateria: 'La gelateria',
  mensa: 'La mensa',
  pastificio: 'Il pastificio',
  biscotti: 'I biscotti',
  melanzane: 'Le melanzane e i peperoni',
  recinto_capre: 'Le capre',
  sartoria: 'La sartoria',
  merceria: 'La merceria',
  cipolle: 'Le cipolle e l\'aglio',
  arnie: 'Le api',
  // La pizza vuole la salsa della cucina: primo livello in cui ci sono tutti e tre gli ingredienti.
  pizza: 'La pizza',
  recinto_alpaca: 'Gli alpaca',
  lasagne: 'Le lasagne',
  // La sciarpa di lana, anticipata rispetto al berretto.
  sciarpa_lana: 'La sciarpa',
  fragole: 'Le fragole',
  marmellata: 'La marmellata',
  recinto_asini: 'Gli asini',
  frullato: 'Il frullato',
  lavanda: 'La lavanda',
  tintoria: 'La tintoria',
  berretto: 'Il berretto',
  // La peschiera e la friggitoria una dopo l'altra: il pesce dell'una è il primo ingrediente dell'altra.
  peschiera: 'La peschiera',
  friggitoria: 'La friggitoria',
  riso: 'Il riso',
  arancini: 'Gli arancini',
  sushi_bar: 'Il sushi bar',
  maki: 'I maki',
}

// Le ricette che arrivano a un livello: servono solo al nome.
const ricetteAl = l => RICETTE.filter(r => livelloDellaRicetta(r) === l).map(r => r.id)

export function nomeDi(livello) {
  const l = Math.max(1, livello | 0)
  const qui = new Set([...premiDi(l).map(p => p.id), ...ricetteAl(l)])
  for (const [id, nome] of Object.entries(NOMI)) if (qui.has(id)) return nome
  const r = roba(l)
  if (r.animali.length) return r.animali[0].nome
  if (r.colture.length) return r.colture[0].nome
  // la più cara: è quella che si guarda per prima aprendo lo scaffale
  const cara = r.cose.slice().sort((a, b) => b.prezzo - a.prezzo)[0]
  return cara ? cara.nome : `Livello ${l}`
}

// A che punto si è verso il prossimo livello: quanto manca e quanto è fatto.
export function avanzamento(speso = 0) {
  const liv = livelloPer(speso)
  const da = sogliaDi(liv), a = sogliaDi(liv + 1)
  return {
    livello: liv, nome: nomeDi(liv), speso: Math.max(0, speso || 0),
    da, a, manca: Math.max(0, a - (speso || 0)),
    quanto: a > da ? Math.min(1, Math.max(0, ((speso || 0) - da) / (a - da))) : 1,
  }
}

// Cosa arriva esattamente a questo livello: l'anteprima del prossimo.
export function roba(livello) {
  const l = Math.max(1, livello | 0)
  return {
    // Una linguetta che si apre la prima volta è una notizia: le sue voci di quel livello si elencano lo stesso.
    schede: CATEGORIE.filter(c => !c.stagionale && !c.fiera && livelloDellaScheda(c) === l),
    // le stagionali e la fiera non arrivano con un livello: compaiono con la finestra o col pallone
    cose: CATALOGO.filter(v => !v.stagione && !v.fiera && livelloDellaVoce(v) === l),
    colture: COLTURE.filter(c => (c.liv || 1) === l),
    animali: Object.entries(ANIMALI).filter(([, a]) => (a.liv || 1) === l)
      .map(([chi, a]) => ({ chi, ...a })),
  }
}

export const vuoto = r => !r.schede.length && !r.cose.length &&
  !r.colture.length && !r.animali.length

// I premi si prendono premendoli (non arrivano più da soli): vedi docs/fattoria/livelli.md.
export const chiaveDi = (tipo, id) => `${tipo}:${id}`

// I premi di un livello, pronti da mostrare: figura vera (non un'emoji), nome, e che cosa è.
function componi(livello) {
  const l = Math.max(1, livello | 0)
  const r = roba(l)
  return [
    ...r.cose.map(c => ({
      chiave: chiaveDi('cosa', c.id), tipo: 'cosa', id: c.id, liv: l,
      nome: c.nome, pezzo: c.pezzo, prezzo: c.prezzo, zona: zonaDi(c.id),
      che: zonaDi(c.id) === 'lavoro' ? 'da costruire' : 'da mettere',
    })),
    ...r.colture.map(c => ({
      chiave: chiaveDi('coltura', c.id), tipo: 'coltura', id: c.id, liv: l,
      nome: c.nome, pezzo: c.stadi[c.stadi.length - 1], largo: true,
      che: 'da seminare',
    })),
    ...r.animali.map(a => ({
      chiave: chiaveDi('bestia', a.chi), tipo: 'bestia', id: a.chi, liv: l,
      nome: a.nome, pezzo: a.chi + '_giu0', prezzo: a.prezzo, che: 'un amico',
    })),
  ]
}

// Si compone una volta sola: girare tutto il catalogo a ogni fotogramma sarebbe lavoro buttato.
const PER_LIVELLO = Array.from({ length: ULTIMO + 1 }, (_, l) => l ? componi(l) : [])
export const premiDi = livello => PER_LIVELLO[Math.max(1, livello | 0)] || []

const PREMI = PER_LIVELLO.flat()
const PREMIO_PER_CHIAVE = Object.fromEntries(PREMI.map(p => [p.chiave, p]))
// Una chiave che nessun premio dichiara non esiste: un id tolto dal catalogo non lascia un premio fantasma.
export const premioDi = chiave => PREMIO_PER_CHIAVE[chiave] || null

export function guastiDeiLivelli() {
  const g = []
  for (let l = 2; l <= ULTIMO + 2; l++)
    if (!(sogliaDi(l) > sogliaDi(l - 1))) g.push(`la soglia del livello ${l} non sale`)
  // Un nome dichiarato per una cosa che non arriva mai è un nome che nessuno vede.
  {
    const arrivano = new Set()
    for (let l = 1; l <= ULTIMO; l++) {
      for (const p of premiDi(l)) arrivano.add(p.id)
      for (const id of ricetteAl(l)) arrivano.add(id)
    }
    for (const id of Object.keys(NOMI))
      if (!arrivano.has(id)) g.push(`c'è un nome per «${id}», che non arriva a nessun livello`)
  }
  // Se l'inversa e la diretta si scostano, uno spende e non sale — o sale senza spendere.
  for (let l = 1; l <= ULTIMO + 2; l++) {
    if (livelloPer(sogliaDi(l)) !== l) g.push(`chi ha speso la soglia del ${l} non è al ${l}`)
    if (l > 1 && livelloPer(sogliaDi(l) - 1) !== l - 1)
      g.push(`una moneta prima della soglia del ${l} si è già al ${l}`)
  }
  // La roba di un livello non paga il livello dopo: comprarla tutta deve lasciare almeno il passo di sempre.
  for (let l = 2; l <= ULTIMO; l++) {
    const salto = sogliaDi(l + 1) - sogliaDi(l)
    const resta = salto - costoDelLivello(l)
    if (resta < SOGLIA_B)
      g.push(`al livello ${l} comprare quello che arriva (🪙${costoDelLivello(l)}) ` +
             `lascia solo ${resta} del salto di ${salto}: il livello si paga da sé`)
  }
  // Un livello che non porta niente si presenta come "hai fatto qualcosa, ecco: niente".
  for (let l = 1; l <= ULTIMO; l++)
    if (vuoto(roba(l))) g.push(`al livello ${l} non arriva niente`)
  // Tutto quello che esiste deve arrivare entro l'ultimo livello.
  for (const v of CATALOGO)
    if (livelloDellaVoce(v) > ULTIMO) g.push(`${v.id}: arriva al livello ${livelloDellaVoce(v)}, che non esiste`)
  // Due o tre per livello, mai di più: si rompe da sola se una linguetta nuova dichiara liv per venti voci.
  for (let l = PRIMO_DECORO; l <= ULTIMO; l++) {
    const quante = roba(l).cose.filter(v => zonaDi(v.id) === 'bello').length
    if (quante > DECORI_PER_LIVELLO)
      g.push(`al livello ${l} arrivano ${quante} decorazioni: sono troppe`)
  }
  // Ogni linguetta deve aprirsi prima o poi, e con qualcosa dentro.
  for (const c of CATEGORIE)
    if (!c.stagionale && !(livelloDellaScheda(c) <= ULTIMO))
      g.push(`la linguetta «${c.chiave}» non si apre mai`)
  for (const c of COLTURE)
    if ((c.liv || 1) > ULTIMO) g.push(`la coltura ${c.id} arriva a un livello che non esiste`)
  // Al primo livello ci dev'essere di che cominciare la catena.
  const primo = CATALOGO.filter(v => livelloDellaVoce(v) === 1)
  if (!primo.some(v => v.campo)) g.push('al livello 1 non c\'è nessun campo: la catena non comincia')
  if (!primo.some(v => v.silo === 'terra')) g.push('al livello 1 non c\'è il silo del raccolto')
  if (!COLTURE.some(c => (c.liv || 1) === 1)) g.push('al livello 1 non c\'è niente da seminare')
  // Ogni premio deve potersi mostrare: una figura, un nome, e una chiave unica.
  {
    const viste = new Set()
    for (let l = 1; l <= ULTIMO; l++)
      for (const p of premiDi(l)) {
        if (!p.pezzo) g.push(`il premio ${p.chiave} non ha una figura da mostrare`)
        if (!p.nome) g.push(`il premio ${p.chiave} non ha un nome`)
        if (viste.has(p.chiave)) g.push(`il premio ${p.chiave} c'è due volte`)
        viste.add(p.chiave)
      }
  }
  g.push(...guastiDegliSblocchi())
  return g
}

// Il primo livello in cui un prodotto è ottenibile davvero (coltura o ricetta, macchina e ingredienti inclusi).
export function livelloDelProdotto(prodotto, giri = PROFONDITA) {
  if (giri <= 0) return Infinity
  let min = Infinity
  for (const c of COLTURE) if (c.da === prodotto) min = Math.min(min, c.liv || 1)
  for (const r of RICETTE) if (r.da === prodotto) min = Math.min(min, livelloDellaRicetta(r, giri))
  return min
}

// Quando una ricetta si può fare per davvero: il più tardo fra il suo liv, la macchina e gli ingredienti.
export function livelloDellaRicetta(r, giri = PROFONDITA) {
  const macchina = CATALOGO.find(v => v.macchina === r.dove)
  const ing = Object.keys(r.prende || {}).map(k => livelloDelProdotto(k, giri - 1))
  return Math.max(r.liv || 1, macchina ? livelloDellaVoce(macchina) : 1,
                  ...(ing.length ? ing : [1]))
}

// Una ricetta non compare prima dei suoi ingredienti: un tasto spento è indistinguibile da uno rotto.
export function guastiDegliSblocchi() {
  const g = []
  // E una macchina non arriva prima del suo primo lavoro: esiste una ricetta il giorno stesso in cui compare?
  for (const v of CATALOGO) {
    if (!v.macchina) continue
    const sue = RICETTE.filter(r => r.dove === v.macchina)
    if (!sue.length) continue          // lo dice già il catalogo
    const quando = livelloDellaVoce(v)
    const prima = Math.min(...sue.map(r => livelloDellaRicetta(r)))
    if (prima > quando)
      g.push(`${v.id}: si compra al livello ${quando} e la sua prima ricetta ` +
             `arriva al ${prima} — sarebbe una macchina vuota per ` +
             `${prima - quando} livell${prima - quando === 1 ? 'o' : 'i'}`)
  }
  // E una bottega non arriva prima di avere almeno tre merci del suo elenco consegnabili.
  for (const v of CATALOGO) {
    if (!v.posto) continue
    const quando = livelloDellaVoce(v)
    const chiede = v.posto.chiede || []
    for (const p of chiede)
      if (!Number.isFinite(livelloDelProdotto(p)))
        g.push(`${v.id}: chiede «${p}», che non è una merce che si produca`)
    const subito = chiede.filter(p => livelloDelProdotto(p) <= quando)
    if (subito.length < 3)
      g.push(`${v.id}: arriva al livello ${quando} e ha solo ${subito.length} ` +
             `merc${subito.length === 1 ? 'e' : 'i'} da chiedere (${subito.join(', ') || 'nessuna'})`)
  }
  for (const r of RICETTE) {
    const quando = r.liv || 1
    for (const k of Object.keys(r.prende || {})) {
      const serve = livelloDelProdotto(k)
      const macchina = CATALOGO.find(v => v.macchina === r.dove)
      const compare = Math.max(quando, macchina ? livelloDellaVoce(macchina) : 1)
      if (serve > compare)
        g.push(`${r.id}: compare al livello ${compare}, ma ${k} arriva al ${serve}` +
               ` — sarebbe un tasto spento per ${serve - compare} livelli`)
    }
  }
  return g
}
