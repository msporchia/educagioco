#!/usr/bin/env node
// Le tappe del castello, passate ai raggi X: node strumenti/valida-percorsi.mjs
// Guarda il campo su cui si gioca davvero — la carta a scacchiera che il
// motore prende da `sullaCarta` (src/motore/castello/carta.js), con le sue
// piazzole — e misura quello che a occhio non si vede: presidio, buchi,
// incroci, quanto stanno insieme due strade, immunità. Le regole della
// carta (celle, corsie che non si toccano, bocca e castello) le controlla
// già `unita/castello-carta`: qui non si ripetono. Le distanze sono in
// unità di disegno (`S`), non in pixel. Vedi docs/castello/campagne.md e
// mostri.md.
import { Percorso } from '../src/motore/castello/percorso.js'
import { sullaCarta } from '../src/motore/castello/carta.js'
import { CAMPAGNE, RACCONTO, LIBERE_RACCONTO } from '../src/data/campagne-castello.js'
import { guastiDelleImmunita, guastiDelleMiste } from '../src/data/mostri.js'
import { MONDO, LIBERE, TAPPE, coperturaApertura, APERTURA_COPRE, APERTURA_CORTA,
         ONDATE_TARATE, chiaveTappa }
  from '../src/data/castello.js'

// Le misure, in unità di disegno; il perché di ognuna è in
// docs/castello/campagne.md ("La difficoltà che sta nella mappa" e "Le
// tappe a più bocche").
const LONTANO = 200
const RAGGIO = 92                // il raggio dell'arciere di livello 1
const CORRIDOIO = 62
const CONFLUENZA = 0.2
const FUSE = 9
const COMUNE = 0.5
const IN_MEZZO = 0.18

// Le fasce per campagna di lunghezza e presidio non ci sono più: erano la
// misura con cui si disegnava lo schizzo curvo, e sulla carta ogni strada
// esce più lunga e più ripiegata (circa un sesto). Resta quello che dice
// come deve andare la campagna: un pavimento, e il presidio che scende da
// un mondo al prossimo.
const PRESIDIO_MINIMO = 1.85    // il pavimento, ovunque
const BUCO_INTERNO = 60          // tratto interno più lungo che nessuna torre vede
const SCALINO = 0.12             // quanto deve scendere il presidio da una campagna alla prossima

const { W, H, S } = MONDO

// Il campo, chiesto al motore vero: la carta e il `Percorso` che la gioca.
// La tappa deve avere le sue piazzole vere (`posti`, dall'economia):
// senza, questo strumento controllerebbe una mappa che non esiste.
function campoDi(t) {
  const { forme, posti } = sullaCarta(t)
  const p = new Percorso(forme, posti, { W, H, S })
  return { vie: p.vie, postazioni: p.postazioni }
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const dove = p => p ? `(${(p.x / W).toFixed(2)}, ${(p.y / H).toFixed(2)})` : '—'

// Un anello vero (la strada si attraversa da sé) è due tratti della stessa
// via che si tagliano: la tappa lo dichiara (`incroci`), qui si contano
// quelli veri. Sulla carta un incrocio è sempre ad angolo retto (la cella
// si attraversa dritta, lo pretende `cartaDi`): conta solo quanti sono.
function incrociDi(vie) {
  const trovati = []
  for (const via of vie) {
    const P = via.punti
    const cum = [0]
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + dist(P[i - 1], P[i]))
    for (let i = 0; i < P.length - 1; i++)
      for (let k = i + 2; k < P.length - 1; k++) {
        if ((cum[k] - cum[i + 1]) / S < LONTANO) continue
        const a = P[i], b = P[i + 1], c = P[k], e = P[k + 1]
        const den = (b.x - a.x) * (e.y - c.y) - (b.y - a.y) * (e.x - c.x)
        if (Math.abs(den) < 1e-9) continue
        const t = ((c.x - a.x) * (e.y - c.y) - (c.y - a.y) * (e.x - c.x)) / den
        const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den
        if (t < 0 || t > 1 || u < 0 || u > 1) continue
        const punto = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
        // lo stesso incrocio visto da due segmenti che si toccano in un vertice
        if (!trovati.some(q => dist(q, punto) < 1)) trovati.push(punto)
      }
  }
  return trovati
}

// Due strade diverse: quanta parte fanno insieme (fuse, sotto FUSE) e quanta
// ne fanno né insieme né larghe (sotto CORRIDOIO), fuori dall'ultimo quinto
// dove si toccano per forza — la porta è una sola.
function insieme(vie) {
  const passo = 4 * S
  let comune = 0, inMezzo = 0, dc = null
  for (let a = 0; a < vie.length; a++)
    for (let b = a + 1; b < vie.length; b++) {
      const ca = vie[a].campiona(passo), cb = vie[b].campiona(passo)
      const fineA = Math.floor(ca.length * (1 - CONFLUENZA))
      const fineB = Math.floor(cb.length * (1 - CONFLUENZA))
      let fusi = 0, mezzo = 0
      for (let i = 0; i < fineA; i++) {
        let vicino = Infinity
        for (let k = 0; k < fineB; k++) vicino = Math.min(vicino, dist(ca[i], cb[k]) / S)
        if (vicino <= FUSE) { fusi++; continue }
        if (vicino < CORRIDOIO) { mezzo++; dc = dc || ca[i] }
      }
      comune = Math.max(comune, fusi / ca.length)
      inMezzo = Math.max(inMezzo, mezzo / ca.length)
    }
  return { comune, inMezzo, dc }
}

// Il presidio (strada tenuta sotto tiro per postazione, in raggi d'arciere)
// e il buco interno più lungo che nessuna torre vede, con le postazioni che
// la tappa ha davvero. Con due strade si misurano una per volta: un mostro
// ne percorre una sola.
function presidioEBuco(vie, postazioni) {
  const passo = 3 * S, R = RAGGIO * S
  let presidio = 0, peggiore = 0, punto = null
  for (const [k, via] of vie.entries()) {
    const camp = via.campiona(passo)
    const sue = vie.length > 1 ? postazioni.filter(p => p.via === k) : postazioni
    let totale = 0
    for (const t of sue) for (const c of camp) if (dist(c, t) <= R) totale += passo
    presidio += totale / Math.max(1, sue.length) / R / vie.length
    // il buco guarda tutte le torri (anche quelle dell'altra strada: dove
    // le strade si fondono, sparano su tutte e due), ma solo fra la prima
    // e l'ultima cella vista: testa e coda non contano
    const visto = camp.map(c => postazioni.some(t => dist(c, t) <= R))
    const primo = visto.indexOf(true), ultimo = visto.lastIndexOf(true)
    let buco = 0
    for (let i = primo; i <= ultimo; i++) {
      if (visto[i]) { buco = 0; continue }
      buco += passo
      if (buco > peggiore) { peggiore = buco; punto = camp[i] }
    }
  }
  return { presidio, buco: peggiore / S, punto }
}

function esaminaCampo(t) {
  const guasti = []
  const { vie, postazioni } = campoDi(t)
  const incroci = incrociDi(vie)
  const r = insieme(vie)
  const { presidio, buco, punto } = presidioEBuco(vie, postazioni)
  const lunghe = vie.map(v => v.lunghezza / S)

  const attesi = t.incroci || 0
  if (incroci.length !== attesi)
    guasti.push(`la strada si attraversa ${incroci.length} volte (ne dichiara ${attesi})` +
                (incroci.length ? ` — a ${incroci.map(dove).join(', ')}` : ''))
  if (r.inMezzo > IN_MEZZO)
    guasti.push(`due strade restano nella via di mezzo per il ` +
                `${(r.inMezzo * 100).toFixed(0)}% (massimo ${IN_MEZZO * 100}%): ` +
                `né larghe ${CORRIDOIO}u né la stessa strada, attorno a ${dove(r.dc)}`)
  if (r.comune > COMUNE)
    guasti.push(`le strade stanno insieme per il ${(r.comune * 100).toFixed(0)}% ` +
                `(massimo ${COMUNE * 100}%): gli ingressi non contano più`)
  if (presidio < PRESIDIO_MINIMO)
    guasti.push(`presidio ${presidio.toFixed(2)}, sotto il pavimento di ${PRESIDIO_MINIMO}: ` +
                `non c'è tempo di tirare`)
  if (buco > BUCO_INTERNO)
    guasti.push(`con le sue ${postazioni.length} postazioni restano ${buco.toFixed(0)}u di ` +
                `strada che nessuna torre vede (massimo ${BUCO_INTERNO}) attorno a ${dove(punto)}`)
  return { guasti, lung: Math.max(...lunghe), presidio, buco, posti: postazioni.length,
           comune: r.comune, incroci: incroci.length }
}

// Chi arriva, e a che cosa è immune (vedi docs/castello/mostri.md).
function esaminaMostri(t) {
  if (!t.mostri || !t.mostri.length) return ['nessun mostro']
  const guasti = guastiDelleImmunita(t)
  guasti.push(...guastiDelleMiste(t, Number.isFinite(t.ondate) ? t.ondate : ONDATE_TARATE))
  const copre = coperturaApertura(t)
  const serve = Math.min(APERTURA_COPRE, Number.isFinite(t.ondate) ? t.ondate : APERTURA_COPRE)
  const corta = APERTURA_CORTA[t.chiave || chiaveTappa(t)]
  if (copre < serve && !corta)
    guasti.push(`l'apertura ferisce solo le prime ${copre} ondate, dalla loro strada: ` +
                `ne servono ${serve}, perché all'inizio le risorse non bastano per essere variegati`)
  if (corta && copre >= serve)
    guasti.push(`copre le sue ${serve} ondate: va tolta da APERTURA_CORTA`)
  return guasti
}

/* ═══════════ la stampa ═══════════ */
let rotti = 0
const medie = {}

const riga = (t, m, tutti, altro = '') =>
  console.log(`    ${tutti.length ? '✗' : ' '} ${(t.nome + ' ' + t.emoji).padEnd(21)}` +
    `${m.lung.toFixed(0).padStart(5)} ${m.presidio.toFixed(2).padStart(9)} ` +
    `${String(m.posti).padStart(7)} ${m.buco.toFixed(0).padStart(6)}u${altro}`)

console.log('\n  ═══ LE TAPPE DEL CASTELLO, E LE QUATTRO LIBERE, SULLA CARTA ═══════════\n')
console.log('      tappa                  lung  presidio  piazzole   buco')
console.log('      ' + '─'.repeat(60))

for (const c of CAMPAGNE) {
  console.log(`\n      ${c.emoji} ${c.nome.toUpperCase()}`)
  const presidi = []
  for (const tappa of TAPPE.filter(t => t.campagna === c.id)) {
    const m = esaminaCampo(tappa)
    const tutti = [...m.guasti, ...esaminaMostri(tappa)]
    presidi.push(m.presidio)
    riga(tappa, m, tutti)
    if (tutti.length) { rotti++; for (const g of tutti) console.log(`        ✗ ${g}`) }
  }
  medie[c.id] = presidi.reduce((s, v) => s + v, 0) / presidi.length
}

console.log('\n      ♾️ LE PARTITE LIBERE')
for (const l of LIBERE) {
  const t = { ...l, libera: true }
  const m = esaminaCampo(t)
  const tutti = [...m.guasti, ...esaminaMostri(t)]
  riga(t, m, tutti, `  comune ${(m.comune * 100).toFixed(0)}%` + (m.incroci ? `  incroci ${m.incroci}` : ''))
  if (tutti.length) { rotti++; for (const g of tutti) console.log(`        ✗ ${g}`) }
}

console.log('\n      ' + '─'.repeat(60))
console.log(`      (campo ${W}×${H} · distanze in unità di disegno · raggio d'arciere ${RAGGIO}u)`)
console.log(`      presidio almeno ${PRESIDIO_MINIMO} · buco interno al massimo ${BUCO_INTERNO}u`)

// Il presidio deve scendere lungo i primi tre archi (la Palude non c'entra:
// lì a crescere sono gli ingressi).
const ordine = ['bosco', 'sotterraneo', 'mura']
console.log('\n      presidio medio: ' +
  ordine.map(k => `${k} ${medie[k].toFixed(2)}`).join('  >  '))
for (let i = 1; i < ordine.length; i++)
  if (medie[ordine[i - 1]] - medie[ordine[i]] < SCALINO) {
    console.log(`      ✗ fra ${ordine[i - 1]} e ${ordine[i]} il presidio scende di ` +
      `${(medie[ordine[i - 1]] - medie[ordine[i]]).toFixed(2)}, meno di ${SCALINO}`)
    rotti++
  }

const QUANTE = RACCONTO.length + LIBERE_RACCONTO.length
if (rotti) { console.log(`\n  ✗ ${rotti} cose da sistemare su ${QUANTE} tappe e libere\n`); process.exit(1) }
console.log(`\n  ✓ tutte e ${QUANTE} in regola\n`)
