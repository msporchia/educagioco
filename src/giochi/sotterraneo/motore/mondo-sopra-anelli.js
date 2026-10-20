// TRANSITORIO: il motore di sopra sul mondo ad anelli, com'era prima del percorso (motore/mondo-sopra.js). Lo leggono solo la scena
// e i test non ancora migrati; si cancella con motore/mondo-aperto.js (docs/sotterraneo/mondo-sopra-contratto.md, «Cosa si cancella»).
// Il mondo di sopra del Sotterraneo 3D, senza disegno: il mondo generato (motore/mondo-aperto.js) tenuto una volta sola, dove si
// cammina coi passaggi aperti per la storia e per l'età, la nebbia in base64, le pietre del viaggio, il portale gemello nella
// città che serve quel dungeon, le frecce del cartello. Gira in Node (unita/sotterraneo-mondo-salva). La vista è
// viste/Mondo3d.vue; le regole stanno in docs/sotterraneo/terra-di-sopra.md («Il mondo in 3D»).
import { generaMondoAperto, mascheraDelMondo } from './mondo-aperto.js'
import { DUNGEON, CITTA, passaggioAperto } from '../dati/mondo-aperto.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { creaTerra, scopri, nebbiaNuova } from './terra.js'

export const VISTA_MONDO = 10         // il raggio di quello che si scopre camminando, in celle
export const PASSO_MONDO = 4.5        // celle al secondo
export const ACCANTO_PIETRA = 2.2     // da quanto vicino si usa una pietra accesa

// il generatore ci mette mezzo secondo: si fa una volta per pagina, e tornando dalla discesa il mondo è già pronto
let tenuto = null
export const ilMondo = () => tenuto || (tenuto = generaMondoAperto())
export const ilMondoAdAnelli = ilMondo

const DUNGEON_DI = Object.fromEntries(DUNGEON.map(d => [d.chiave, d]))
export const dungeonDi = chiave => DUNGEON_DI[chiave] || null
export const dungeonDellIndice = i => DUNGEON.find(d => d.indice === i) || null

/* ── i passaggi: aperti per la storia (le discese finite) ── */
// `tappe` come le dà Gioco.vue: [{ indice, fatta }]
export function aperturaDi(tappe = []) {
  const finite = tappe.filter(t => t.fatta).length
  return { finite, aperto: q => passaggioAperto(q, { finite }) }
}
// la terra dove si cammina con quei passaggi: l'A* e la lisciatura di motore/terra.js su una maschera di qualunque misura.
// Chi sta fermo è già un ingombro del generatore (`blocco`): niente ostacoli in più
export const terraDelMondo = (m, aperto) => creaTerra(mascheraDelMondo(m, aperto))

// perché un passaggio è chiuso, come la porta chiusa della storia
export function chiusoPerche(q, { finite }) {
  if (finite >= q.apre) return null
  const d = dungeonDellIndice(q.apre - 1)
  return d ? `Si apre quando finisci ${minuscolo(d.nome)}.` : 'Si apre più avanti nella storia.'
}
const minuscolo = s => s.charAt(0).toLowerCase() + s.slice(1)

/* ── i posti, come li legge la vista ── */
export const postiDi = (m, tipo) => m.posti.filter(p => p.tipo === tipo)
export const cittaDi = (m, chiave) => m.citta.find(c => c.chiave === chiave) || null
// la città di una cella (dentro la sua zona), o null
export const cittaInCella = (m, x, y) => { const z = m.zonaCitta[y * m.W + x]; return z ? m.citta[z - 1] : null }
// Il giro del mondo conta i ritorni in città (decisione del 16 ottobre), ma solo se prima ci si è allontanati: più di `raggio + 8` celle dal
// centro di ogni città. Passare il confine di una zona a ogni passo non fa girare la bacheca (docs/sotterraneo/mondo-aperto-fasi.md)
export const MARGINE_DEL_GIRO = 8
export const lontanoDalleCitta = (m, x, y) => m.citta.every(c => Math.hypot(x - c.centro.x, y - c.centro.y) > c.raggio + MARGINE_DEL_GIRO)
export const regioneInCella = (m, x, y) => m.regioni[m.reg[y * m.W + x]] || null

// la città che serve un dungeon: le terre vicine il villaggio, le marche del sud e dell'ovest il forte, quelle del nord e
// dell'est (l'abisso) il rifugio. Lì sta il portale gemello di chi sale dal portale (docs/sotterraneo/mondo-aperto-progetto.md)
const CITTA_DELLA_MARCA = { sud: 'forte', ovest: 'forte', nord: 'rifugio', est: 'rifugio' }
export function cittaDelDungeon(m, chiave) {
  const d = dungeonDi(chiave)
  const r = d && m.regioni.find(q => q.chiave === d.regione)
  return (r && r.marca && CITTA_DELLA_MARCA[r.marca]) || 'villaggio'
}
// il portale gemello della sosta lasciata dal portale (`tappa` della sosta: l'indice, −1 l'abisso). Se la sua città non si
// raggiunge (una sosta nata da un cheat), sta nel villaggio: il caso peggiore di mondo-aperto-dati.md
export function portaleDella(m, tappa, terra) {
  const d = dungeonDellIndice(tappa)
  const c = cittaDi(m, d ? cittaDelDungeon(m, d.chiave) : 'villaggio') || cittaDi(m, 'villaggio')
  const qui = c && c.portale
  if (qui && terra) {
    const dist = terra.raggiungibili(m.partenza)
    if (!dist.has(qui.accanto.y * m.W + qui.accanto.x)) return cittaDi(m, 'villaggio').portale
  }
  return qui
}
// il minatore sta nel villaggio, e sale al rifugio dopo la sesta porta (`dalla`)
export function minatoreDi(m, finite) {
  const tutti = postiDi(m, 'minatore').sort((a, b) => (b.dalla || 0) - (a.dalla || 0))
  return tutti.find(p => finite >= (p.dalla || 0)) || tutti[tutti.length - 1] || null
}

/* ── chi cura gratis in una città (docs/sotterraneo/chi-cura.md): la guaritrice la vita, l'incantatrice l'energia; dove manca una delle
   due c'è la fontana della piazza, che le cura tutte e due. Si deriva dai mercanti della città e dal pozzo che il generatore le ha
   già dato: il generatore non cambia ── */
export const CURA_DEL_MERCANTE = { erborista: 'vita', incantatrice: 'energia' }
export const hoLaFontana = chiaveDellaCitta => {
  const c = CITTA.find(x => x.chiave === chiaveDellaCitta)
  return !!c && Object.keys(CURA_DEL_MERCANTE).some(k => !c.mercanti.includes(k))
}
// le fontane del mondo: un posto per città che ne ha bisogno, al posto del pozzo (il suo 2×2, già un ingombro); `accanto` è la
// cella dove ci si ferma a berne, sulla piazza sotto di lei (la prima che si cammina, se si dà la `terra`)
export function fontaneDi(m, terra = null) {
  return m.citta.filter(c => hoLaFontana(c.chiave)).map(c => {
    const p = c.pozzo, piede = { x: p.x + 1, y: p.y + 1 }
    const prove = [[1, 3], [0, 3], [2, 3], [-1, 2], [3, 2], [1, 4]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
    const accanto = (terra && prove.find(q => terra.passa(q.x, q.y))) || prove[0]
    return { tipo: 'fontana', chiave: `fontana:${c.chiave}`, citta: c.chiave, regione: c.regione, x: p.x, y: p.y, w: 2, h: 2, piede, accanto }
  })
}
// cosa serve a chi è salito dal portale: quanta vita e quanta energia mancano (forze di Gioco.vue, o null), e cosa dice il fumetto
export function curaDellaFontana(forze) {
  if (!forze) return { vita: 0, energia: 0, serve: false }
  const vita = Math.max(0, forze.vitaMax - forze.vita), energia = Math.max(0, forze.energiaMax - forze.energia)
  return { vita, energia, serve: vita > 0 || energia > 0 }
}

/* ── le pietre del viaggio: una per città e una davanti a ogni dungeon. Si accendono una volta con una domanda ── */
export function nomeDellaPietra(chiave) {
  const c = CITTA.find(x => x.chiave === chiave)
  if (c) return `La pietra ${c.chiave === 'villaggio' ? 'del villaggio' : c.chiave === 'forte' ? 'del forte' : 'del rifugio'}`
  const d = dungeonDi(chiave)
  return d ? `La pietra ${davantiA(d.nome)}` : 'La pietra'
}
const davantiA = nome => { const n = minuscolo(nome); return n.replace(/^(la|le|il|i|lo|gli|l')\s*/, (a, art) => ({ la: 'della ', le: 'delle ', il: 'del ', i: 'dei ', lo: 'dello ', gli: 'degli ', "l'": "dell'" })[art] || 'di ') }
// le domande di una pietra: quelle del posto, l'inizio del dungeon che ha davanti (o della regione della città)
export function difDellaPietra(m, chiave) {
  const d = dungeonDi(chiave)
  if (d) return d.indice >= 0 ? CAMPAGNA[d.indice].dif[0] : CAMPAGNA[CAMPAGNA.length - 1].dif[0]
  const c = cittaDi(m, chiave), r = c && m.regioni.find(q => q.chiave === c.regione)
  return (r && r.dif) || CAMPAGNA[0].dif[0]
}
// la pietra a cui si sta accanto (entro ACCANTO_PIETRA dal posto dove ci si ferma), o null
export function pietraAccanto(m, x, y) {
  let meglio = null, d0 = ACCANTO_PIETRA
  for (const p of postiDi(m, 'pietra')) {
    const d = Math.hypot(x - (p.accanto.x + 0.5), y - (p.accanto.y + 0.5))
    if (d <= d0) { d0 = d; meglio = p }
  }
  return meglio
}
// dove si può andare da `da` (una pietra accesa): le altre accese, coi nomi. Il viaggio è gratis e immediato
export function meteDelViaggio(m, da, accese) {
  if (!da || !accese.includes(da)) return []
  return postiDi(m, 'pietra').filter(p => p.chiave !== da && accese.includes(p.chiave))
    .map(p => ({ chiave: p.chiave, nome: nomeDellaPietra(p.chiave), arrivo: { ...p.accanto } }))
}

/* ── la nebbia: un bit per cella, in base64 (160×140 celle sono 2 800 byte, 3 734 caratteri). Un codice che non torna
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

// La prima volta: si vede attorno alla piazza, e chi ha già finito delle discese (la stessa avventura del Sotterraneo di sempre)
// ritrova scoperte le strade fino a quei dungeon e accese le loro pietre (la tabella del travaso di mondo-aperto-dati.md)
export function mondoNuovo(m, terra, tappe = []) {
  const n = nebbiaNuova(m.W, m.H)
  scopri(n, m.W, m.H, m.partenza.x + 0.5, m.partenza.y + 0.5, VISTA_MONDO)
  const pietre = []
  for (const t of tappe) {
    if (!(t.fatta || t.stelle > 0)) continue
    const ing = postiDi(m, 'ingresso').find(p => p.chiave === t.chiave)
    if (!ing) continue
    const via = terra.strada(m.partenza, ing.accanto) || []
    for (let i = 0; i < via.length; i += 2) scopri(n, m.W, m.H, via[i].x + 0.5, via[i].y + 0.5, 3)
    scopri(n, m.W, m.H, ing.accanto.x + 0.5, ing.accanto.y + 0.5, VISTA_MONDO)
    pietre.push(t.chiave)
  }
  return { nebbia: n, pietre }
}

/* ── il cartello di una città: una freccia per ogni passaggio della sua regione, coi posti che ci stanno oltre ── */
const FRECCE = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗']
export function frecceDelCartello(m, chiaveCitta) {
  const c = cittaDi(m, chiaveCitta), cart = c && c.cartello
  if (!cart) return []
  const R = c.regione, primo = new Map([[R, null]]), coda = [R]
  const lati = q => [q.da, q.a]
  for (let i = 0; i < coda.length; i++) {
    const r = coda[i]
    for (const q of m.passaggi) {
      if (!lati(q).includes(r)) continue
      const altra = q.da === r ? q.a : q.da
      if (primo.has(altra)) continue
      primo.set(altra, r === R ? q : primo.get(r))
      coda.push(altra)
    }
  }
  return m.passaggi.filter(q => lati(q).includes(R)).map(q => {
    const celle = q.celle || [], cx = celle.reduce((s, p) => s + p.x, 0) / (celle.length || 1), cy = celle.reduce((s, p) => s + p.y, 0) / (celle.length || 1)
    const a = Math.atan2(cy - cart.y, cx - cart.x)
    const regioni = [...primo].filter(([, v]) => v === q).map(([k]) => k)
    return { verso: FRECCE[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8], passaggio: q.id, regioni,
             posti: DUNGEON.filter(d => regioni.includes(d.regione)).map(d => d.chiave),
             citta: CITTA.filter(x => regioni.includes(x.regione)).map(x => x.chiave) }
  })
}
