/* Il livello della fattoria 3D: le soglie sono quelle della fattoria di sempre (70 livelli, ~200 ore di esercizio contando solo la spesa),
   con un solo ritocco nella parte medio-alta: la pesca (molo e porticciolo, solo 3D) prende il posto della peschiera della 2D, allo stesso livello.
   Cosa arriva a ogni livello lo dicono le cose stesse (`liv` su pezzo, edificio, coltura, ricetta: tutti letti dalla 2D, dati/parita2d.js):
   `roba(liv)` le raccoglie girando i dati veri, così un elenco non si scrive due volte e non si scosta.
   Vedi docs/fattoria3d/livelli.md. */
import { PEZZI, EDIFICI } from './catalogo.js'
import { COLTURE } from './colture.js'
import { RICETTE } from './ricette.js'
import { PRODOTTI_ANIMALI, LANA, ANIMALI } from './animali.js'
import { PECORE } from './regole.js'
import { ricetteDelMangime } from './mangime.js'
import { compagniAl } from './compagni.js'
import { abitiAl } from './abiti.js'
import { sogliaDi2D, ULTIMO_2D, SOGLIA_A, SOGLIA_B, ALLUNGA, LIVELLO_PESCA, PESCHIERA_2D } from './parita2d.js'

// La formula del passo è quella della 2D (`8·(n-1)² + 200·(n-1)`, allungata di un quarto): i livelli non finiscono mai.
export { SOGLIA_A, SOGLIA_B, ALLUNGA, LIVELLO_PESCA }

// ── il livello di ogni cosa: lo scrive la cosa ──
export const livelloDelPezzo = tipo => (PEZZI[tipo] || EDIFICI[tipo] || {}).liv || 1
export const livelloDellaColtura = chiave => (COLTURE[chiave] || {}).liv || 1

// Quando una ricetta si fa per davvero: il più tardo fra il suo liv, la sua macchina e i suoi ingredienti.
export function livelloDellaRicetta(id, giri = 4) {
  const r = RICETTE[id]
  if (!r || giri <= 0) return Infinity
  const ing = Object.keys(r.ing).map(k => COLTURE[k] ? livelloDellaColtura(k) : PRODOTTI_ANIMALI[k] ? livelloDelPezzo(PRODOTTI_ANIMALI[k].dove) : LANA[k] ? livelloDelPezzo(LANA[k].dove) : livelloDellaRicetta(k, giri - 1))
  return Math.max(r.liv || 1, livelloDelPezzo(r.dove), ...ing)
}

/** Da che livello c'è un mangime (becchime, foraggio): la sua ricetta più precoce, cioè la strada che si apre per prima. */
export const livelloDelMangime = k => Math.min(...ricetteDelMangime(k).map(([id]) => livelloDellaRicetta(id)))

/** Quanto costa entrare nella pesca: un molo e il porticciolo. Non sono «produttivi» (un molo si cammina), ma al livello della pesca il salto li paga, come paga la peschiera nella 2D. */
export const COSTO_DELLA_PESCA = PEZZI.molo.prezzo + PEZZI.porticciolo.prezzo
/** Di quanto la pesca costa diversamente dalla peschiera della 2D (che qui non c'è): le soglie dal livello dopo si spostano di tanto, e solo quelle. */
export const SCARTO_DELLA_PESCA = COSTO_DELLA_PESCA - PESCHIERA_2D.prezzo

// Quanto costa comprare una volta ciò che il livello apre di produttivo; le decorazioni non contano.
export const costoDelLivello = livello =>
  livello < 2 ? 0 : [
    ...Object.values(PEZZI).filter(p => p.produttivo && p.liv === livello),
    ...Object.values(EDIFICI).filter(e => e.liv === livello),
  ].reduce((n, c) => n + c.prezzo, 0) + (livello === LIVELLO_PESCA ? COSTO_DELLA_PESCA : 0)

// Fin dove arriva la roba dichiarata: l'ultimo livello della 2D; oltre si continua a salire ma senza niente di nuovo da aprire.
export const ULTIMO = ULTIMO_2D

/** Quanta esperienza (monete spese qui dentro) serve in tutto per un livello: quella della 2D, più lo scarto della pesca dal livello dopo il suo. */
export function sogliaDi(livello) {
  const l = Math.max(1, livello | 0)
  return sogliaDi2D(l) + (l > LIVELLO_PESCA ? SCARTO_DELLA_PESCA : 0)
}

export function livelloPer(esperienza = 0) {
  const s = Math.max(0, esperienza || 0)
  let giu = 1, su = 2
  while (sogliaDi(su) <= s) su *= 2
  while (su - giu > 1) {
    const m = (giu + su) >> 1
    if (sogliaDi(m) <= s) giu = m
    else su = m
  }
  return giu
}

// Cosa arriva esattamente a questo livello: pezzi, edifici, colture, ricette (anche l'anteprima del prossimo).
export function roba(livello) {
  const l = Math.max(1, livello | 0)
  const con = (tabella, chiave) => Object.entries(tabella).map(([id, v]) => ({ id, ...v })).filter(v => chiave(v.id) === l)
  return {
    pezzi: con(PEZZI, livelloDelPezzo).filter(p => !p.stagione),          // le feste vengono e vanno: non sono «roba» del livello
    edifici: con(EDIFICI, livelloDelPezzo),
    colture: con(COLTURE, livelloDellaColtura),
    ricette: con(RICETTE, id => livelloDellaRicetta(id)),
    compagni: compagniAl(l, true),                       // chi arriva a girare per la fattoria: non conta come «roba» (vedi `vuoto`)
    abiti: abitiAl(l, true),                             // i pezzi speciali del guardaroba: nemmeno questi contano come «roba»
  }
}
export const vuoto = r => !r.pezzi.length && !r.edifici.length && !r.colture.length && !r.ricette.length

// I nomi stanno sulla cosa, non sul numero: lo spostamento di un livello non li costringe a riscriverli. L'ordine è la
// precedenza quando due cose arrivano insieme.
export const NOMI = {
  campo: 'Il primo campo',
  bancarella: 'Il mercato',
  mulino: 'Il mulino',
  carota: 'Le carote',
  fienile: 'Il fienile',
  trattore: 'Il vicino',
  mais: 'Il mais',
  erba: 'L\'erba medica',
  recinto: 'Le pecore',
  pomodoro: 'I pomodori',
  pasticceria: 'Il pastificio',
  pollaio: 'Il pollaio',
  patata: 'Le patate',
  panificio: 'Il panificio',
  telaio: 'Il telaio',
  zucca: 'Le zucche',
  stalla: 'La stalla',
  cipolla: 'Le cipolle',
  mongolfiera: 'La mongolfiera',
  caseificio: 'Il caseificio',
  fragola: 'Le fragole',
  conserviera: 'La cucina',
  zuccherificio: 'Lo zuccherificio',
  melanzana: 'Le melanzane',
  gelateria: 'La gelateria',
  sartoria: 'La sartoria',
  lavanda: 'La lavanda',
  tintoria: 'La tintoria',
  friggitoria: 'La friggitoria',
  sushi_bar: 'Il sushi bar',
  molo: 'La pesca',
  barbabietola: 'La barbabietola',
  riso: 'Il riso',
  biscotti: 'I biscotti',
  pizza: 'La pizza',
  lasagne: 'Le lasagne',
  sciarpa_lana: 'La sciarpa',
  marmellata: 'La marmellata',
  frullato: 'Il frullato',
  berretto: 'Il berretto',
  arancini: 'Gli arancini',
  maki: 'I maki',
  pentolone: 'Il pentolone',
  anatre: 'Lo stagno delle anatre',
  porcile: 'Il porcile',
  capre: 'Le capre',
  bottega_pasticceria: 'La pasticceria',
  bottega_osteria: 'L\'osteria',
  bottega_mensa: 'La mensa',
  bottega_merceria: 'La merceria',
}

export function nomeDi(livello) {
  const l = Math.max(1, livello | 0)
  const r = roba(l)
  const qui = new Set([...r.pezzi, ...r.edifici, ...r.colture, ...r.ricette].map(c => c.id))
  for (const [id, nome] of Object.entries(NOMI)) if (qui.has(id)) return nome
  const prima = r.edifici[0] || r.colture[0] || r.pezzi.slice().sort((a, b) => b.prezzo - a.prezzo)[0] || r.ricette[0]
  return prima ? prima.nome : `Livello ${l}`
}

// A che punto si è verso il prossimo livello: quanto manca e quanto è fatto.
export function avanzamento(esperienza = 0) {
  const e = Math.max(0, esperienza || 0), liv = livelloPer(e)
  const da = sogliaDi(liv), a = sogliaDi(liv + 1)
  return { livello: liv, nome: nomeDi(liv), esperienza: e, da, a, manca: Math.max(0, a - e), quanto: a > da ? Math.min(1, Math.max(0, (e - da) / (a - da))) : 1 }
}

export function guastiDeiLivelli() {
  const g = []
  for (let l = 2; l <= ULTIMO + 2; l++) if (!(sogliaDi(l) > sogliaDi(l - 1))) g.push(`la soglia del livello ${l} non sale`)
  if (ULTIMO !== ULTIMO_2D) g.push(`i livelli sono ${ULTIMO} e quelli della 2D ${ULTIMO_2D}`)
  // l'inversa e la diretta devono combaciare, se no uno spende e non sale, o sale senza spendere
  for (let l = 1; l <= ULTIMO + 2; l++) {
    if (livelloPer(sogliaDi(l)) !== l) g.push(`chi ha speso la soglia del ${l} non è al ${l}`)
    if (l > 1 && livelloPer(sogliaDi(l) - 1) !== l - 1) g.push(`una moneta prima della soglia del ${l} si è già al ${l}`)
  }
  // la roba di un livello non paga il livello dopo
  for (let l = 2; l <= ULTIMO; l++) {
    const resta = sogliaDi(l + 1) - sogliaDi(l) - costoDelLivello(l)
    if (resta < SOGLIA_B) g.push(`al livello ${l} comprare ciò che arriva (${costoDelLivello(l)}) lascia solo ${resta} del salto: il livello si paga da sé`)
  }
  // i livelli sono quelli della 2D (70) e la 3D ha meno cose della 2D (niente bestie di casa, solo dieci decorazioni): un livello può non aprire niente, e il foglio lo dice.
  // Ma il primo no, e una cosa produttiva per livello al massimo, più le decorazioni
  for (let l = 1; l <= ULTIMO; l++) {
    const r = roba(l)
    if (l === 1 && vuoto(r)) g.push('al livello 1 non arriva niente')
    const prod = r.edifici.length + r.pezzi.filter(p => p.produttivo).length
    if (l > 1 && prod > 1) g.push(`al livello ${l} arrivano ${prod} cose produttive: una sola`)
  }
  // niente arriva oltre l'ultimo livello, e la pesca sta dove la 2D ha la peschiera
  for (const [t, p] of [...Object.entries(PEZZI), ...Object.entries(EDIFICI)]) if (p.liv > ULTIMO) g.push(`${t}: arriva al livello ${p.liv}, che non esiste`)
  for (const t of ['molo', 'molo_v', 'porticciolo']) if (PEZZI[t].liv !== LIVELLO_PESCA) g.push(`${t}: la pesca arriva al ${LIVELLO_PESCA}, non al ${PEZZI[t].liv}`)
  // uova e latte nascono dove il livello li apre: il pezzo che li fa
  for (const [k, p] of Object.entries(PRODOTTI_ANIMALI)) if (!PEZZI[p.dove]) g.push(`${k}: il pezzo ${p.dove} non esiste`)
  if (!roba(1).pezzi.some(p => p.id === 'campo')) g.push('al livello 1 non c\'è il campo')
  if (!roba(1).colture.length) g.push('al livello 1 non c\'è niente da seminare')
  // i nomi: solo di cose che arrivano
  const arrivano = new Set()
  for (let l = 1; l <= ULTIMO; l++) { const r = roba(l); for (const c of [...r.pezzi, ...r.edifici, ...r.colture, ...r.ricette]) arrivano.add(c.id) }
  for (const id of Object.keys(NOMI)) if (!arrivano.has(id)) g.push(`c'è un nome per «${id}», che non arriva a nessun livello`)
  // gli id non si confondono fra gli elenchi
  const tutti = [...Object.keys(PEZZI), ...Object.keys(EDIFICI), ...Object.keys(COLTURE), ...Object.keys(RICETTE), ...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(LANA)]
  if (new Set(tutti).size !== tutti.length) g.push('un id compare in due elenchi (pezzi, edifici, colture, ricette, prodotti delle bestie)')
  // il mangime c'è prima del recinto che lo chiede, o insieme (docs/fattoria3d/mangime-e-catena.md)
  const mangia = { recinto: PECORE.mangia, ...Object.fromEntries(Object.entries(ANIMALI).map(([t, a]) => [t, a.mangia])) }
  for (const [tipo, cibi] of Object.entries(mangia)) for (const k of cibi) {
    if (!(livelloDelMangime(k) <= livelloDelPezzo(tipo))) g.push(`${tipo}: si compra al ${livelloDelPezzo(tipo)} e il suo ${k} arriva al ${livelloDelMangime(k)}`)
  }
  // una ricetta dichiara il livello vero: né prima della macchina, né prima dei suoi ingredienti
  for (const [id, r] of Object.entries(RICETTE)) {
    const vero = livelloDellaRicetta(id)
    if (!Number.isFinite(vero)) g.push(`${id}: ingredienti circolari o troppo profondi`)
    else if (vero !== r.liv) g.push(`${id}: dichiara il livello ${r.liv} ma si fa dal ${vero} (macchina o ingredienti)`)
  }
  // una macchina non arriva prima della sua prima ricetta, e ogni edificio tranne la mongolfiera e le botteghe è una macchina
  for (const [tipo, e] of Object.entries(EDIFICI)) {
    const sue = Object.entries(RICETTE).filter(([, r]) => r.dove === tipo)
    if (tipo === 'mongolfiera' || e.bottega) continue          // la nave e le botteghe non lavorano: non hanno ricette
    if (!sue.length) { g.push(`${tipo}: edificio senza ricette`); continue }
    const prima = Math.min(...sue.map(([id]) => livelloDellaRicetta(id)))
    if (prima > e.liv) g.push(`${tipo}: si compra al ${e.liv} e la sua prima ricetta arriva al ${prima}`)
  }
  return g
}
