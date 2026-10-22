/* Il consiglio della fattoria 3D: «cosa faccio adesso?» e «come l'ho?». Puro (niente Vue, niente three): legge il motore e torna
   { testo, azione, etichetta }. `azione` è una delle forme che Gioco.vue sa eseguire (`FORME`), o null se c'è solo da aspettare.
   Un «non si può» per mancanza di roba risale la catena da solo (`comeAvere`) finché trova un passo possibile oggi.
   Vedi docs/fattoria3d/guida.md. */
import { COLTURE } from '../dati/colture.js'
import { RICETTE, merceDi } from '../dati/ricette.js'
import { PEZZI, EDIFICI } from '../dati/catalogo.js'
import { ANIMALI, PRODOTTI_ANIMALI, LANA, CORTILE } from '../dati/animali.js'
import { PESCI } from '../dati/pesca.js'
import { livelloDellaColtura, livelloDellaRicetta, livelloDelPezzo } from '../dati/livelli.js'
import { MACCHINE } from '../dati/ricette.js'
import { tempoBreve } from '../dati/tempo.js'

/** Le azioni che il consiglio sa chiedere alla vista: `che` e i campi che servono. */
export const FORME = ['semina', 'raccogli', 'macchina', 'costruisci', 'banco', 'livelli', 'home', 'inventario']

const GIRI = 6
const nomeDi = k => ((merceDi(k) || {}).nome || k).toLowerCase()
const emojiDi = k => (merceDi(k) || {}).emoji || ''
const dove = t => EDIFICI[t] || PEZZI[t] || { nome: t, emoji: '' }
// «il mulino», «l'erba», «la stalla»: l'articolo sta nel dato degli edifici; per i pezzi si indovina (nomi in -a: la)
const il = t => {
  const d = dove(t), n = d.nome.toLowerCase(), art = d.art || (/a$/.test(n) ? 'la' : 'il')
  return art === 'le' ? `le ${n}` : /^[aeiou]/.test(n) ? `l'${n}` : `${art} ${n}`      // «le arnie»: un plurale non vuole l'apostrofo
}

const ETICHETTE = {
  semina: () => '🌱 Semina', raccogli: () => '✂️ Raccogli', banco: () => '🧺 Apri il banco', livelli: () => '⭐ I livelli', home: () => '🎮 Vai ai giochi',
  macchina: a => `${dove(a.tipo).emoji} Apri ${il(a.tipo)}`, costruisci: () => '🏗 Costruisci', inventario: () => '🎒 Apri la dispensa',
}
const dai = (testo, azione = null) => ({ testo, azione, etichetta: azione ? ETICHETTE[azione.che](azione) : '' })

const campi = m => m.s.cose.filter(c => c.tipo === 'campo')
const salire = (liv, cosa) => dai(`${cosa} arriva al livello ${liv}: spendi monete qui e il livello sale`, { che: 'livelli' })

/** Un campo è maturo ma non si può raccogliere: raccogliere costa il gesto della 2D (🪙1–2) e lo scomparto del raccolto ha un tetto. Il consiglio lo dice, non finge. */
function fermoPerIlRaccolto(m, campo) {
  const r = m.provaRaccolta(campo.id)
  if (r.motivo === 'poche-monete') return dai(`Raccogliere costa 🪙 ${r.costo}: guadagna monete negli altri giochi`, { che: 'home' })
  return dai(`${emojiDi(r.k)} ${nomeDi(r.k)}: lo scomparto è pieno (${r.max}). Usa un po' di roba, o ingrandisci il magazzino`, { che: 'inventario' })
}

/** Come si ha una cosa che c'è nelle ricette o nei campi: il prossimo passo, risalendo la catena. */
export function comeAvere(m, k, giri = GIRI) {
  const nome = nomeDi(k)
  if (giri <= 0) return dai(`${nome} si fa in fattoria.`)
  if (COLTURE[k]) return comeAvereRaccolto(m, k, nome)
  if (LANA[k]) return comeAvereDaBestie(m, k, nome, LANA[k].dove, 'recinto', giri)
  if (PESCI[k]) return dai(`${emojiDi(k)} ${nome}: si pesca dal molo, vicino all'acqua`, { che: 'costruisci', tipo: 'molo' })
  if (PRODOTTI_ANIMALI[k]) return comeAvereDaBestie(m, k, nome, PRODOTTI_ANIMALI[k].dove, k, giri)
  const ric = Object.entries(RICETTE).filter(([id, r]) => (r.da || id) === k).sort((a, b) => livelloDellaRicetta(a[0]) - livelloDellaRicetta(b[0]))
  if (!ric.length) return dai(`${nome} si fa in fattoria.`)
  return comeAvereDaMacchina(m, k, nome, ric, giri)
}

function comeAvereRaccolto(m, k, nome) {
  const liv = livelloDellaColtura(k)
  if (liv > m.livello()) return salire(liv, `${emojiDi(k)} ${nome}`)
  const tutti = campi(m)
  if (!tutti.length) return dai(`${emojiDi(k)} ${nome} cresce nei campi: costruisci un campo`, { che: 'costruisci', tipo: 'campo' })
  const maturi = tutti.filter(c => m.campoMaturo(c))
  if (maturi.some(c => m.provaRaccolta(c.id).ok)) return dai(`Un campo è pronto: raccogli, e ${nome} arriva`, { che: 'raccogli' })
  if (maturi.length) return fermoPerIlRaccolto(m, maturi[0])
  const libero = tutti.find(c => m.campoVuoto(c))
  if (libero) return dai(`Semina ${emojiDi(k)} ${nome} in un campo vuoto: poi si aspetta che cresca`, { che: 'semina', seme: k })
  const ancora = tutti.map(c => m.restoSecondi(c)).filter(x => x > 0)
  if (ancora.length) return dai(`I campi stanno crescendo: ${nome} arriva fra ${tempoBreve(Math.min(...ancora) * 1000)}`)
  return dai('Serve un campo libero: costruiscine un altro', { che: 'costruisci', tipo: 'campo' })
}

function comeAvereDaBestie(m, k, nome, pezzo, prodotto, giri) {
  const d = PEZZI[pezzo], liv = livelloDelPezzo(pezzo)
  if (liv > m.livello()) return salire(liv, `${emojiDi(k)} ${nome} (${d.nome.toLowerCase()})`)
  const cosa = m.s.cose.find(c => c.tipo === pezzo)
  if (!cosa) return dai(`${emojiDi(k)} ${nome} lo fa ${il(pezzo)}: costruiscilo`, { che: 'costruisci', tipo: pezzo })
  if (cosa.bestie && m.bestiePronte(cosa).length) return dai(`${emojiDi(k)} ${nome} è pronto: raccoglilo toccando ${il(pezzo)}`, { che: 'raccogli' })
  if (pezzo === 'recinto' && m.lanaPronta(cosa).length) return dai(`La lana è pronta: raccoglila toccando il recinto`, { che: 'raccogli' })
  const A = CORTILE[pezzo]
  const mangia = (ANIMALI[pezzo] || {}).mangia || ['foraggio']
  const manca = mangia.every(x => m.scortaDi(x) < ((ANIMALI[pezzo] || {}).pasti || 1))
  if (manca) return comeAvere(m, mangia[0], giri - 1)
  return dai(`${A.emoji} Tocca ${il(pezzo)} per dar da mangiare: poi ${nome} arriva`)
}

function comeAvereDaMacchina(m, k, nome, ric, giri) {
  const [id, r] = ric.find(([i]) => livelloDellaRicetta(i) <= m.livello()) || ric[0]
  const tipo = r.dove, liv = livelloDellaRicetta(id)
  if (liv > m.livello()) return salire(liv, `${emojiDi(k)} ${nome}`)
  if (!m.s.posseduti[tipo]) {
    if (m.nelMagazzino(tipo) > 0) return dai(`${emojiDi(k)} ${nome} lo fa ${il(tipo)}: ce l'hai nel magazzino, mettilo in mappa`, { che: 'costruisci', tipo })
    return dai(`${emojiDi(k)} ${nome} lo fa ${il(tipo)}: costruiscilo`, { che: 'costruisci', tipo })
  }
  const Q = m.macchina(tipo)
  if ((Q.pronti[k] || 0) > 0) return dai(`${emojiDi(k)} ${nome} è pronto: ritiralo da ${il(tipo)}`, { che: 'macchina', tipo })
  if (Q.coda.some(x => (RICETTE[x.ric].da || x.ric) === k)) return dai(`${emojiDi(k)} ${nome} si sta facendo: aspetta un attimo`)
  const manca = Object.keys(m.mancano(id))
  if (manca.length) return comeAvere(m, manca[0], giri - 1)
  return dai(`Prepara ${emojiDi(k)} ${nome} in ${il(tipo)}`, { che: 'macchina', tipo })
}

/** Il seme migliore da seminare adesso: fra quelli aperti, quello di cui c'è meno in scorta (a parità il primo). */
function semeDaSeminare(m) {
  const aperti = Object.keys(COLTURE).filter(k => livelloDellaColtura(k) <= m.livello())
  return aperti.sort((a, b) => m.scortaDi(a) - m.scortaDi(b))[0] || 'grano'
}

/** Il consiglio del momento, per chi non sa cosa fare: la prima cosa che serve davvero, dal più utile al meno. */
export function cosaFaccioAdesso(m) {
  const tutti = campi(m)
  const maturi = tutti.filter(c => m.campoMaturo(c)), pronti = maturi.filter(c => m.provaRaccolta(c.id).ok)
  if (pronti.length) return dai(pronti.length === 1 ? 'Un campo è pronto! Raccogli' : `${pronti.length} campi sono pronti! Raccogli`, { che: 'raccogli' })
  if (maturi.length) return fermoPerIlRaccolto(m, maturi[0])
  for (const tipo of Object.keys(MACCHINE)) {
    if (!m.s.posseduti[tipo]) continue
    const pronti = Object.values(m.macchina(tipo).pronti).reduce((n, x) => n + x, 0)
    if (pronti) return dai(`C'è roba pronta in ${il(tipo)}: ritirala`, { che: 'macchina', tipo })
  }
  if (m.bancoAperto && m.bancoAperto() && m.ordini().some(o => o.pronto)) return dai('Un cliente aspetta e hai quello che chiede: consegna', { che: 'banco' })
  if (m.prodottiDelCortile() > 0) return dai('Le bestie hanno qualcosa di pronto: raccogli', { che: 'raccogli' })
  if (tutti.some(c => m.campoVuoto(c))) {
    const seme = semeDaSeminare(m)
    return dai(`Un campo è vuoto: semina ${emojiDi(seme)} ${nomeDi(seme)}`, { che: 'semina', seme })
  }
  const costruibili = m.edificiDaCostruire().filter(t => m.nelMagazzino(t) > 0 || m.prezzoPezzo(t) <= m.monete())
  if (costruibili.length) return dai(`${il(costruibili[0]).replace(/^./, c => c.toUpperCase())} è aperto: costruiscilo`, { che: 'costruisci', tipo: costruibili[0] })
  if (tutti.length < 2 && m.monete() >= m.prezzoPezzo('campo')) return dai('Un secondo campo ti dà più raccolto: costruiscilo', { che: 'costruisci', tipo: 'campo' })
  for (const tipo of Object.keys(MACCHINE)) {
    if (!m.s.posseduti[tipo]) continue
    const Q = m.macchina(tipo)
    if (Q.coda.length >= Q.posti) continue
    const buona = m.ricetteDi(tipo).find(r => r.sbloccata && r.ingredienti && !RICETTE[r.id].mangime)
    if (buona) return dai(`Prepara ${buona.emoji} ${buona.nome.toLowerCase()} in ${il(tipo)}`, { che: 'macchina', tipo })
  }
  const ancora = tutti.map(c => (m.campoVuoto(c) ? 0 : m.restoSecondi(c))).filter(x => x > 0)
  if (ancora.length) return dai(`Si aspetta: il prossimo campo è pronto fra ${tempoBreve(Math.min(...ancora) * 1000)}`)
  return dai('Le monete si guadagnano esercitandosi negli altri giochi: poi torni qui a spenderle', { che: 'home' })
}
