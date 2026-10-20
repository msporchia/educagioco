// Il mondo di sopra del Sotterraneo 3D, senza disegno, sul mondo a percorso (motore/mondo-percorso.js): il mondo tenuto una volta
// sola con le zone caricate attorno all'eroe, la terra dove si cammina, la nebbia in base64, la firma salvata e il travaso di chi
// ha già giocato, le pietre (una per zona e quella del villaggio), il villaggio unico, il cartello. Gira in Node
// (unita/sotterraneo-mondo-salva). Il contratto per la scena: docs/sotterraneo/mondo-sopra-contratto.md.
import { scheletroDelMondo, tieniAttorno, zonaDi, livelloDi, zoneAttorno, caricaTutto, baseDi, listaDi, mascheraDelMondo } from './mondo-percorso.js'
import { MONDO_PERCORSO, ZONE_DEL_MONDO, INGRESSI_DEL_MONDO, VILLAGGIO, cittaDiOggi, pietraDiOggi } from '../dati/mondo-aperto.js'
import { creaTerra, scopri, nebbiaNuova } from './terra.js'

export { tieniAttorno, zonaDi, livelloDi, zoneAttorno, caricaTutto, baseDi, listaDi }

export const VISTA_MONDO = 10         // il raggio di quello che si scopre camminando, in celle
export const PASSO_MONDO = 4.5        // celle al secondo
export const ACCANTO_PIETRA = 2.2     // da quanto vicino si usa una pietra accesa

/* ── il mondo, tenuto una volta: lo scheletro intero e le zone attorno all'eroe (all'inizio il villaggio, i prati e il bosco) ── */
let tenuto = null
export function ilMondo({ terra = 1 } = {}) {
  if (tenuto && tenuto.terra === terra) return tenuto
  const m = scheletroDelMondo(MONDO_PERCORSO.seme, { terra })
  tieniAttorno(m, m.partenza.x, m.partenza.y)
  return (tenuto = m)
}
// le zone seguono l'eroe: si carica la sua e le due accanto, si buttano le altre. Torna cosa è cambiato (la scena rifà i pezzi, la
// terra e i mostri di quelle zone). Costa solo quando una zona si carica (0,1–0,5 s sul telefono): si chiama a ogni cella nuova
export function seguiLEroe(m, x, y) {
  const prima = m.zonaCaricata.slice()
  const zona = tieniAttorno(m, Math.floor(x), Math.floor(y))
  const caricate = [], scaricate = []
  m.zonaCaricata.forEach((c, k) => { if (c && !prima[k]) caricate.push(k); if (!c && prima[k]) scaricate.push(k) })
  return { zona, caricate, scaricate }
}

// La terra dove si cammina (l'A* e la lisciatura di motore/terra.js). Una zona mai caricata è roccia; una scaricata resta scritta, quindi
// la terra cambia solo quando si carica una zona per la prima volta: fino ad allora torna la stessa. Il secondo parametro di prima
// (i passaggi aperti) non c'è più: niente si chiude
const TERRE = new WeakMap()
export function terraDelMondo(m) {
  const chiave = m.zone.map(z => (z.area != null ? 1 : 0)).join('')
  const t = TERRE.get(m)
  if (t && t.chiave === chiave) return t.terra
  const terra = creaTerra(mascheraDelMondo(m))
  TERRE.set(m, { chiave, terra })
  return terra
}

/* ── i posti, come li legge la vista ── */
export const postiDi = (m, tipo) => m.posti.filter(p => p.tipo === tipo)
export const pietreDi = m => m.pietre
export const ingressoDi = (m, chiave) => m.ingressi.find(p => p.chiave === chiave) || null
// le chiavi delle città di prima (forte, rifugio) sono il villaggio
export const cittaDi = (m, chiave) => m.citta.find(c => c.chiave === cittaDiOggi(chiave)) || null
export const cittaInCella = (m, x, y) => { const z = m.zonaCitta[Math.floor(y) * m.W + Math.floor(x)]; return z ? m.citta[z - 1] : null }
export const regioneInCella = (m, x, y) => m.regioni[m.reg[Math.floor(y) * m.W + Math.floor(x)]] || null
export const zonaInCella = (m, x, y) => m.zone[zonaDi(m, Math.floor(x), Math.floor(y))] || null
// Il giro del mondo conta i ritorni in città (decisione del 16 ottobre), ma solo se prima ci si è allontanati: più di `raggio + 8` celle dal
// centro del villaggio (docs/sotterraneo/mondo-aperto-fasi.md)
export const MARGINE_DEL_GIRO = 8
export const lontanoDalleCitta = (m, x, y) => m.citta.every(c => Math.hypot(x - c.centro.x, y - c.centro.y) > c.raggio + MARGINE_DEL_GIRO)

// i dungeon della scheda, senza il mondo: il nome, l'indice della storia (null i sei nuovi), il livello, la zona
const ZONA_DEL_DUNGEON = Object.fromEntries(ZONE_DEL_MONDO.flatMap(z => z.dungeon.map(d => [d.chiave, z.chiave])))
export const dungeonDi = chiave => (INGRESSI_DEL_MONDO[chiave] ? { chiave, ...INGRESSI_DEL_MONDO[chiave], zona: ZONA_DEL_DUNGEON[chiave] } : null)
export const dungeonDellIndice = i => { const k = Object.keys(INGRESSI_DEL_MONDO).find(c => INGRESSI_DEL_MONDO[c].indice === i); return k ? dungeonDi(k) : null }

// una città sola: il villaggio serve ogni dungeon, e il portale gemello di chi sale dal portale sta sempre lì. Il minatore e il
// capitano stanno nel villaggio
export const cittaDelDungeon = () => 'villaggio'
export const portaleDella = m => m.villaggio.portale
export const minatoreDi = m => m.villaggio.minatore
export const capitanoDi = m => m.villaggio.persone.find(p => p.chiave === 'capitano') || null

/* ── chi cura gratis in una città (docs/sotterraneo/chi-cura.md): la guaritrice la vita, l'incantatrice l'energia; dove manca una delle
   due c'è la fontana della piazza, che le cura tutte e due. Il villaggio le ha tutte e due: oggi nessuna fontana ── */
export const CURA_DEL_MERCANTE = { erborista: 'vita', incantatrice: 'energia' }
const MERCANTI_DEL_VILLAGGIO = VILLAGGIO.lotti.filter(l => l.tipo === 'mercante').map(l => l.chiave)
export const hoLaFontana = chiaveDellaCitta => cittaDiOggi(chiaveDellaCitta) === 'villaggio' && Object.keys(CURA_DEL_MERCANTE).some(k => !MERCANTI_DEL_VILLAGGIO.includes(k))
// le fontane del mondo: al posto del pozzo (il suo 2×2, già un ingombro); `accanto` è la cella dove ci si ferma a berne
export function fontaneDi(m, terra = null) {
  return m.citta.filter(c => hoLaFontana(c.chiave) && c.pozzo).map(c => {
    const p = c.pozzo, piede = { x: p.x + 1, y: p.y + 1 }
    const prove = [[1, 3], [0, 3], [2, 3], [-1, 2], [3, 2], [1, 4]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
    const accanto = (terra && prove.find(q => terra.passa(q.x, q.y))) || prove[0]
    return { tipo: 'fontana', chiave: `fontana:${c.chiave}`, citta: c.chiave, regione: 'villaggio', x: p.x, y: p.y, w: 2, h: 2, piede, accanto }
  })
}
// cosa serve a chi è salito dal portale: quanta vita e quanta energia mancano (forze di Gioco.vue, o null), e cosa dice il fumetto
export function curaDellaFontana(forze) {
  if (!forze) return { vita: 0, energia: 0, serve: false }
  const vita = Math.max(0, forze.vitaMax - forze.vita), energia = Math.max(0, forze.energiaMax - forze.energia)
  return { vita, energia, serve: vita > 0 || energia > 0 }
}

/* ── le pietre del viaggio: una al mezzo di ogni zona (`zona:<chiave>`) e quella del villaggio. Si accendono una volta con una domanda;
   da una accesa si va al villaggio sempre e alle altre accese, e da quella del villaggio alle accese delle zone (il «tornare avanti») ── */
const minuscolo = s => s.charAt(0).toLowerCase() + s.slice(1)
const ARTICOLATE = { la: 'della ', le: 'delle ', il: 'del ', i: 'dei ', lo: 'dello ', gli: 'degli ', "l'": "dell'" }
const di = nome => { const n = minuscolo(nome); return n.replace(/^(la|le|il|i|lo|gli|l')\s*/, (a, art) => ARTICOLATE[art] || 'di ') }
const ZONA_DELLA_PIETRA = Object.fromEntries(ZONE_DEL_MONDO.map(z => [`zona:${z.chiave}`, z]))
export const CHIAVI_DELLE_PIETRE = ['villaggio', ...Object.keys(ZONA_DELLA_PIETRA)]
// le pietre accese salvate, nelle chiavi di oggi (`altare` → `zona:prati`, `forte` → `villaggio`), senza doppioni né chiavi che non ci sono
export const pietreDiOggi = lista => [...new Set((Array.isArray(lista) ? lista : []).map(pietraDiOggi))].filter(k => CHIAVI_DELLE_PIETRE.includes(k))

export function nomeDellaPietra(chiave) {
  const k = pietraDiOggi(chiave)
  if (k === 'villaggio') return 'La pietra del villaggio'
  const z = ZONA_DELLA_PIETRA[k]
  return z ? `La pietra ${di(z.nome)}` : 'La pietra'
}
// le domande di una pietra: quelle della sua zona (il villaggio, quelle dei prati)
export function difDellaPietra(m, chiave) {
  const k = pietraDiOggi(chiave)
  const p = m.pietre.find(q => q.chiave === k)
  return (p && p.dif) || m.zone[0].dif
}
// la pietra a cui si sta accanto (entro ACCANTO_PIETRA dal posto dove ci si ferma), o null
export function pietraAccanto(m, x, y) {
  let meglio = null, d0 = ACCANTO_PIETRA
  for (const p of m.pietre) {
    const d = Math.hypot(x - (p.accanto.x + 0.5), y - (p.accanto.y + 0.5))
    if (d <= d0) { d0 = d; meglio = p }
  }
  return meglio
}
// dove si può andare da `da` (una pietra accesa): il villaggio sempre, le altre accese, coi nomi. Il viaggio è gratis e immediato
export function meteDelViaggio(m, da, accese) {
  const A = new Set(pietreDiOggi(accese)), d = pietraDiOggi(da)
  if (!da || !A.has(d)) return []
  return m.pietre.filter(p => p.chiave !== d && (A.has(p.chiave) || p.chiave === 'villaggio'))
    .map(p => ({ chiave: p.chiave, nome: nomeDellaPietra(p.chiave), zona: p.zona || null, arrivo: { ...p.accanto } }))
}

/* ── la nebbia: un bit per cella, in base64 (504×300 celle sono 18 900 byte, 25 200 caratteri). Un codice che non torna
   (altra mappa, altra misura) è nebbia nuova, non un errore ── */
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
export function nebbiaInBase64(n) {
  const byte = new Uint8Array(Math.ceil(n.length / 8))
  for (let k = 0; k < n.length; k++) if (n[k]) byte[k >> 3] |= 128 >> (k & 7)
  let s = ''
  for (let i = 0; i < byte.length; i += 3) {
    const v = (byte[i] << 16) | ((byte[i + 1] || 0) << 8) | (byte[i + 2] || 0), resto = byte.length - i
    s += ABC[v >> 18 & 63] + ABC[v >> 12 & 63] + (resto > 1 ? ABC[v >> 6 & 63] : '') + (resto > 2 ? ABC[v & 63] : '')
  }
  return s
}
export function nebbiaDaBase64(s, W, H) {
  const N = W * H, byte = Math.ceil(N / 8)
  if (typeof s !== 'string' || s.length !== Math.ceil(byte * 4 / 3) || /[^A-Za-z0-9+/]/.test(s)) return null
  const n = nebbiaNuova(W, H)
  for (let i = 0, b = 0; i < s.length; i += 4) {
    const v = (ABC.indexOf(s[i]) << 18) | (ABC.indexOf(s[i + 1]) << 12) | ((i + 2 < s.length ? ABC.indexOf(s[i + 2]) : 0) << 6) | (i + 3 < s.length ? ABC.indexOf(s[i + 3]) : 0)
    for (const x of [v >> 16 & 255, v >> 8 & 255, v & 255]) {
      if (b >= byte) break
      for (let j = 0; j < 8; j++) { const k = b * 8 + j; if (k < N && x & (128 >> j)) n[k] = 1 }
      b++
    }
  }
  return n
}

// La prima volta: si vede attorno alla piazza, e chi ha già finito delle discese (la stessa avventura del Sotterraneo di sempre) ritrova
// scoperta la strada maestra fino a ognuna, la sua stradina e il suo ingresso, e accesa la pietra della sua zona (la tabella del travaso
// di mondo-aperto-dati.md). Non vuole zone caricate: la strada è quella del tracciato. `tappe` come le dà Gioco.vue; la firma di prima,
// (m, terra, tappe), vale ancora
export function mondoNuovo(m, ...args) {
  const tappe = (Array.isArray(args[0]) ? args[0] : args[1]) || []
  const n = nebbiaNuova(m.W, m.H)
  const vedi = (x, y, r) => scopri(n, m.W, m.H, x + 0.5, y + 0.5, r)
  vedi(m.partenza.x, m.partenza.y, VISTA_MONDO)
  const pietre = []
  let fin = -1
  const verso = []
  for (const t of tappe) {
    if (!(t.fatta || t.stelle > 0)) continue
    const ing = ingressoDi(m, t.chiave)
    if (!ing || !ing.storia) continue
    const s = baseDi(m, ing.accanto.x, ing.accanto.y).arco
    fin = Math.max(fin, s)
    verso.push({ ing, s })
    pietre.push(pietraDiOggi(t.chiave))
  }
  if (fin >= 0) {
    // dalla piazza al cancello e alla strada maestra, poi lungo il tracciato fino all'ultimo dungeon finito
    const v = m.villaggio, t0 = m.tracciato[0]
    linea(vedi, v.partenza, v.cancello, 3); linea(vedi, v.cancello, { x: Math.round(t0.x), y: Math.round(t0.y) }, 3)
    for (const p of m.tracciato) { if (p.s > fin + 2) break; vedi(Math.round(p.x), Math.round(p.y), 3) }
    for (const { ing, s } of verso) {
      // la stradina: dal punto della strada maestra al suo arco fino all'ingresso, e attorno all'ingresso
      const p = m.tracciato[Math.min(m.tracciato.length - 1, Math.round(s / 2))]
      linea(vedi, { x: Math.round(p.x), y: Math.round(p.y) }, ing.accanto, 3)
      vedi(ing.accanto.x, ing.accanto.y, VISTA_MONDO)
    }
    for (const k of new Set(pietre)) { const q = m.pietre.find(x => x.chiave === k); if (q) vedi(q.accanto.x, q.accanto.y, 4) }
  }
  return { nebbia: n, pietre: [...new Set(pietre)] }
}
function linea(vedi, a, b, r) {
  const l = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y))
  for (let i = 0; i <= l; i++) vedi(Math.round(a.x + (b.x - a.x) * i / (l || 1)), Math.round(a.y + (b.y - a.y) * i / (l || 1)), r)
}

// Il mondo salvato (`mondo` dell'avventura) rimesso in forma per questa mappa. Stessa firma: com'era, con le pietre nelle chiavi di oggi.
// Firma diversa o assente (i salvataggi di prima del percorso, docs/sotterraneo/mondo-a-percorso-lavori.md): il travaso, cioè nebbia,
// `dove` e `sopra` si rifanno (mondoNuovo dalle discese finite), le pietre vecchie diventano quelle delle zone, il resto (giro, parlato,
// divieti, novità, taglie) resta. Torna la nebbia già letta (Uint8Array), `nuovo` (mai salvato) e `travasato`
export function mondoDaSalvato(m, salvato, tappe = []) {
  const s = salvato && typeof salvato === 'object' && !Array.isArray(salvato) ? salvato : null
  const stesso = !!s && s.firma === m.firma
  const letta = stesso ? nebbiaDaBase64(s.nebbia, m.W, m.H) : null
  if (letta) return { ...s, nebbia: letta, pietre: pietreDiOggi(s.pietre), nuovo: false, travasato: false }
  const n = mondoNuovo(m, tappe)
  const resto = stesso ? { dove: s.dove || null, sopra: s.sopra || null } : { dove: null, sopra: null }
  return { ...(s || {}), ...resto, firma: m.firma, nebbia: n.nebbia,
           pietre: pietreDiOggi([...(s ? s.pietre || [] : []), ...n.pietre]), nuovo: !s, travasato: !!s && !stesso }
}
// quello che si scrive nell'avventura: la firma della mappa e la nebbia in base64, accanto al resto
export const mondoDaSalvare = (m, { nebbia, ...resto }) => ({ ...resto, firma: m.firma, nebbia: nebbiaInBase64(nebbia) })

/* ── il cartello del villaggio: la strada maestra che esce dal cancello, con le zone e i dungeon che ci stanno lungo ── */
const FRECCE = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗']
export function frecceDelCartello(m, chiaveCitta) {
  const c = cittaDi(m, chiaveCitta), cart = c && c.cartello
  if (!cart) return []
  const p = m.tracciato.find(q => Math.hypot(q.x - cart.x, q.y - cart.y) > 10) || m.tracciato[m.tracciato.length - 1]
  const a = Math.atan2(p.y - cart.y, p.x - cart.x)
  return [{ verso: FRECCE[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8], strada: 'maestra', nome: 'La strada maestra', passaggio: null,
            zone: m.zone.map(z => z.chiave), regioni: m.regioni.filter(r => r.chiave !== 'villaggio').map(r => r.chiave),
            posti: m.ingressi.map(i => i.chiave), citta: [] }]
}

/* ── TRANSITORIO: le grate non ci sono più. Restano finché viste/Mondo3d.vue le chiama (compito D), e non chiudono niente ── */
export const aperturaDi = (tappe = []) => ({ finite: tappe.filter(t => t.fatta).length, aperto: () => true })
export const chiusoPerche = () => null

// per gli strumenti e i test: il mondo intero, tutte le zone caricate (in Node, ~1 s)
export function ilMondoIntero(opz) { return caricaTutto(ilMondo(opz)) }
