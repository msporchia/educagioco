#!/usr/bin/env node
// Le tappe del castello, passate ai raggi X: node strumenti/valida-percorsi.mjs
// Rifà la geometria di una `forma` (smussa, dispone le postazioni) e
// controlla quello che a occhio non si vede — margini, distanze minime,
// presidio, buchi, immunità. Le distanze sono in unità di disegno (`S`), non
// in pixel. Vedi docs/castello/campagne.md e mostri.md.
import { Percorso } from '../src/motore/castello/percorso.js'
import { CAMPAGNE, RACCONTO, LIBERE_RACCONTO } from '../src/data/campagne-castello.js'
import { guastiDelleImmunita, guastiDelleMiste } from '../src/data/mostri.js'
// Quante piazzole avrà davvero la tappa lo decide l'economia (si legge, non
// si scrive): senza, questo strumento controllerebbe una mappa che non esiste.
import { postiDi, MONDO, LIBERE, TAPPE, coperturaApertura, APERTURA_COPRE, APERTURA_CORTA,
         ONDATE_TARATE, chiaveTappa }
  from '../src/data/castello.js'

const X0 = 0.05, X1 = 0.95, Y0 = 0.04, Y1 = 0.95
const INGRESSO = 0.05           // il primo punto sta sul bordo di sopra
const USCITA = 0.90             // l'ultimo arriva davvero in fondo

// Le distanze minime, in unità di disegno; il perché di ognuna è in
// docs/castello/campagne.md ("Le distanze minime" e "Le tappe a più bocche").
const GOMITO = 52
const CORRIDOIO = 62
const PIAZZOLE = 40
const PIAZZOLE_FITTE = 22
const VICINO = 80
const LONTANO = 200
const RAGGIO = 92                // il raggio dell'arciere di livello 1
const CONFLUENZA = 0.2
const FUSE = 9
const COMUNE = 0.5
const IN_MEZZO = 0.18

// Le fasce per campagna (lunghezza in unità, presidio in raggi): la Palude
// è fuori scala perché la sua difficoltà sta nei fronti, non nel presidio.
const FASCE = {
  bosco:       { lung: [780, 1000], presidio: [2.15, 2.70] },
  sotterraneo: { lung: [520, 950],  presidio: [1.95, 2.40] },
  mura:        { lung: [420, 800],  presidio: [1.80, 2.20] },
  palude:      { lung: [420, 720],  presidio: [1.80, 2.15] },
}
const PRESIDIO_MINIMO = 1.85    // il pavimento, ovunque

// Le postazioni che una tappa avrà davvero (l'economia le decide, si legge
// da `postiDi`, non si scrive un numero di comodo).
const postiVeri = t => t.posti ?? postiDi(t)
const MAGRO = 3                 // il minimo che postiDi possa dare: si avvisa, non si fallisce
const PRESIDIO_POCHI = 1.78
const BUCO_INTERNO = 60          // tratto interno più lungo che nessuna torre vede
const SCALINO = 0.12             // quanto deve scendere il presidio da una campagna alla prossima

const MISURE = [{ nome: 'campo', W: MONDO.W, H: MONDO.H }]
const scalaDi = () => MONDO.S

// Il campo, chiesto al motore vero (`Percorso`): non è più una copia a mano
// della geometria di `motore/battaglia.js`, che divergeva.
function campoDi(forme, W, H, S, quante) {
  const p = new Percorso(forme, quante, { W, H, S })
  return { via: p.via, vie: p.vie, postazioni: p.postazioni }
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const dove = (p, M) => p ? `(${(p.x / M.W).toFixed(2)}, ${(p.y / M.H).toFixed(2)})` : '—'

// Un anello vero (la strada si attraversa da sé) è due tratti della stessa
// via che si tagliano: la tappa lo dichiara (`incroci`), qui si contano
// quelli veri. Un incrocio va bene solo se è netto (sotto INCROCIO_NETTO
// gradi è una sbavata, non un incrocio).
const INCROCIO_NETTO = 60       // gradi: sotto, non è un incrocio ma una sbavata
const ATTORNO_ALL_INCROCIO = 80 // unità: fin dove il ravvicinamento è l'incrocio stesso
function incrociDi(vie, S) {
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
        const l1 = dist(a, b), l2 = dist(c, e)
        const cos = ((b.x - a.x) * (e.x - c.x) + (b.y - a.y) * (e.y - c.y)) / (l1 * l2 || 1)
        const angolo = Math.acos(Math.max(-1, Math.min(1, Math.abs(cos)))) * 180 / Math.PI
        trovati.push({ punto, angolo, cammino: (cum[k] - cum[i + 1]) / S })
      }
  }
  return trovati
}
const vicinoAUnIncrocio = (p, incroci, S) =>
  incroci.some(c => dist(p, c.punto) / S < ATTORNO_ALL_INCROCIO)

// Quanto si sfiorano due parti del tracciato: il gomito (poco cammino in
// mezzo) dalla corsia parallela (molto cammino). `sfiorano` è la corsia
// parallela della stessa strada sotto CORRIDOIO senza essere un incrocio.
function ravvicinamenti(vie, S, incroci = []) {
  const passo = 4 * S
  let gomito = Infinity, corridoio = Infinity, dg = null, dc = null
  let sfiorano = Infinity, ds = null, ds2 = null
  let comune = 0                  // quanta parte di strada due vie fanno insieme
  let inMezzo = 0                 // e quanta ne fanno né insieme né larghe
  for (const via of vie) {
    const camp = via.campiona(passo)
    for (let i = 0; i < camp.length; i++)
      for (let k = i + 1; k < camp.length; k++) {
        const cammino = (k - i) * passo / S
        if (cammino < VICINO) continue
        const d = dist(camp[i], camp[k]) / S
        if (cammino < LONTANO) { if (d < gomito) { gomito = d; dg = camp[i] } }
        else {
          if (d < corridoio) { corridoio = d; dc = camp[i] }
          if (d < sfiorano && !vicinoAUnIncrocio(camp[i], incroci, S) &&
              !vicinoAUnIncrocio(camp[k], incroci, S)) { sfiorano = d; ds = camp[i]; ds2 = camp[k] }
        }
      }
  }
  // fra due strade diverse: in fondo si toccano per forza (la porta è una
  // sola), quindi l'ultimo pezzo di ciascuna è fuori dal conto
  for (let a = 0; a < vie.length; a++)
    for (let b = a + 1; b < vie.length; b++) {
      const ca = vie[a].campiona(passo), cb = vie[b].campiona(passo)
      const fineA = Math.floor(ca.length * (1 - CONFLUENZA))
      const fineB = Math.floor(cb.length * (1 - CONFLUENZA))
      let fusi = 0, mezzo = 0
      for (let i = 0; i < fineA; i++) {
        let vicino = Infinity
        for (let k = 0; k < fineB; k++) vicino = Math.min(vicino, dist(ca[i], cb[k]) / S)
        if (vicino <= FUSE) { fusi++; continue }    // qui sono la stessa strada
        if (vicino < CORRIDOIO) { mezzo++; if (vicino < corridoio) { corridoio = vicino; dc = ca[i] } }
      }
      comune = Math.max(comune, fusi / ca.length)
      inMezzo = Math.max(inMezzo, mezzo / ca.length)
    }
  return { gomito, corridoio, dg, dc, sfiorano, ds, ds2, comune, inMezzo }
}

// Le due postazioni più vicine, da tre fino a quante ne avrà davvero questa
// tappa (`fino`): si controlla quello che il gioco fa, non un numero fisso
// che nessuna mappa raggiunge.
function piazzoleStrette(forme, W, H, S, fino = 8) {
  let larga = Infinity, fitta = Infinity, quante = 0
  for (let q = 3; q <= fino + 2; q++) {
    const { postazioni } = campoDi(forme, W, H, S, q)
    for (let i = 0; i < postazioni.length; i++)
      for (let k = i + 1; k < postazioni.length; k++) {
        const d = dist(postazioni[i], postazioni[k]) / S
        if (q <= fino) { if (d < larga) { larga = d; quante = q } }
        else if (d < fitta) fitta = d
      }
  }
  return { larga, fitta, quante }
}

// Il presidio: sei postazioni (il numero di mezzo), così tutte le mappe si
// confrontano con lo stesso metro. Con due ingressi si misura strada per
// strada, o il numero verrebbe fuori più alto solo perché le strade sono corte.
function presidioDi(forme, W, H, S, quante = 6) {
  const strade = Array.isArray(forme[0][0]) ? forme : [forme]
  const presidi = strade.map(f => {
    const { via, postazioni } = campoDi(f, W, H, S, quante)
    const passo = 3 * S
    const camp = via.campiona(passo)
    const R = RAGGIO * S
    let totale = 0
    for (const t of postazioni)
      for (const c of camp) if (dist(c, t) <= R) totale += passo
    return totale / postazioni.length / R
  })
  return presidi.reduce((s, p) => s + p, 0) / presidi.length
}

// La tappa vista con le postazioni che ha davvero: presidio e buco interno
// più lungo (il raggio è quello dell'arciere, la torre che si compra per prima).
function conPochePostazioni(forme, W, H, S, quante) {
  const { vie, postazioni } = campoDi(forme, W, H, S, quante)
  const passo = 3 * S
  // con due strade il buco si cerca su tutte e due, ma una per volta
  const camp = vie.flatMap(v => v.campiona(passo))
  const confini = []
  let acc = 0
  for (const v of vie) { acc += v.campiona(passo).length; confini.push(acc) }
  const R = RAGGIO * S
  const visto = camp.map(c => postazioni.some(t => dist(c, t) <= R))
  const primo = visto.indexOf(true), ultimo = visto.lastIndexOf(true)
  let totale = 0
  for (const t of postazioni)
    for (const c of camp) if (dist(c, t) <= R) totale += passo
  let buco = 0, peggiore = 0, punto = null
  for (let i = primo; i <= ultimo; i++) {
    if (visto[i] || confini.includes(i)) { buco = 0; continue }
    buco += passo
    if (buco > peggiore) { peggiore = buco; punto = camp[i] }
  }
  return { presidio: totale / postazioni.length / R, buco: peggiore / S, punto }
}

function esaminaForma(t) {
  const guasti = [], avvisi = []
  // una strada o due (`forme`); una spezzata nuda va letta lo stesso
  const dichiarate = t.forme || [t.forma]
  const forme = Array.isArray(dichiarate[0][0]) ? dichiarate : [dichiarate]
  const f = forme[0]

  forme.forEach((g, k) => {
    const chi = forme.length > 1 ? `strada ${k + 1}: ` : ''
    if (!g || g.length < 4) guasti.push(`${chi}solo ${g ? g.length : 0} punti: non è un percorso`)
    for (const [i, [x, y]] of g.entries())
      if (x < X0 - 1e-9 || x > X1 + 1e-9 || y < Y0 - 1e-9 || y > Y1 + 1e-9)
        guasti.push(`${chi}punto ${i} (${x}, ${y}) fuori dal riquadro [${X0}–${X1}] × [${Y0}–${Y1}]`)
    if (g[0][1] > INGRESSO) guasti.push(`${chi}non entra dal bordo di sopra (y = ${g[0][1]})`)
    if (g[g.length - 1][1] < USCITA) guasti.push(`${chi}non arriva in fondo (y = ${g[g.length - 1][1]})`)
  })
  /* e tutte devono finire nello stesso punto: il castello è uno solo, e
     due strade che arrivano in due posti diversi sono due partite */
  if (forme.length > 1) {
    const porta = forme[0][forme[0].length - 1]
    for (const g of forme.slice(1)) {
      const suo = g[g.length - 1]
      if (Math.hypot(suo[0] - porta[0], suo[1] - porta[1]) > 0.02)
        guasti.push(`due strade e due porte: ${JSON.stringify(suo)} invece di ${JSON.stringify(porta)}`)
    }
  }

  const misure = []
  for (const M of MISURE) {
    const S = scalaDi(M.W, M.H)
    const { vie } = campoDi(forme, M.W, M.H, S, 6)
    const incroci = incrociDi(vie, S)
    const r = ravvicinamenti(vie, S, incroci)
    const p = piazzoleStrette(forme, M.W, M.H, S, postiVeri(t))
    const presidio = presidioDi(forme, M.W, M.H, S)
    // la lunghezza si guarda strada per strada, non sommata: un mostro ne
    // percorre una sola
    const lunghe = vie.map(v => v.lunghezza / S)
    const lung = Math.max(...lunghe)
    // le libere stanno fuori dalla fascia della loro campagna: sono i
    // tracciati più intricati di ogni mondo
    const fascia = t.libera ? null : FASCE[t.campagna]

    if (r.gomito < GOMITO)
      guasti.push(`${M.nome}: tornante a spillo, ${r.gomito.toFixed(0)}u ` +
                  `(minimo ${GOMITO}) attorno a ${dove(r.dg, M)}`)
    const attesi = t.incroci || 0
    if (incroci.length !== attesi)
      guasti.push(`${M.nome}: la strada si attraversa ${incroci.length} volte ` +
                  `(ne dichiara ${attesi})` +
                  (incroci.length ? ` — a ${incroci.map(c => dove(c.punto, M)).join(', ')}` : ''))
    for (const c of incroci)
      if (c.angolo < INCROCIO_NETTO)
        guasti.push(`${M.nome}: incrocio di sbieco a ${dove(c.punto, M)}, ` +
                    `${c.angolo.toFixed(0)}° (minimo ${INCROCIO_NETTO}): non si attraversa, si sfiora`)
    if (r.sfiorano < CORRIDOIO)
      guasti.push(`${M.nome}: la stessa strada si sfiora a ${r.sfiorano.toFixed(0)}u ` +
                  `(minimo ${CORRIDOIO}) senza incrociarsi, fra ${dove(r.ds, M)} e ${dove(r.ds2, M)}`)
    if (r.inMezzo > IN_MEZZO)
      guasti.push(`${M.nome}: due strade restano nella via di mezzo per il ` +
                  `${(r.inMezzo * 100).toFixed(0)}% (massimo ${IN_MEZZO * 100}%): ` +
                  `né larghe ${CORRIDOIO}u né la stessa strada, attorno a ${dove(r.dc, M)}`)
    if (r.comune > COMUNE)
      guasti.push(`${M.nome}: le strade stanno insieme per il ` +
                  `${(r.comune * 100).toFixed(0)}% (massimo ${COMUNE * 100}%): ` +
                  `gli ingressi non contano più`)
    if (p.larga < PIAZZOLE)
      guasti.push(`${M.nome}: due piazzole a ${p.larga.toFixed(0)}u ` +
                  `(minimo ${PIAZZOLE}) con ${p.quante} postazioni`)
    if (p.fitta < PIAZZOLE_FITTE)
      guasti.push(`${M.nome}: due piazzole a ${p.fitta.toFixed(0)}u ` +
                  `(minimo ${PIAZZOLE_FITTE}) con qualche postazione in più`)
    lunghe.forEach((l, k) => {
      if (fascia && (l < fascia.lung[0] || l > fascia.lung[1]))
        guasti.push(`${M.nome}: ${vie.length > 1 ? `strada ${k + 1} ` : ''}lunga ` +
                    `${l.toFixed(0)}u, fuori dalla fascia ` +
                    `${fascia.lung[0]}–${fascia.lung[1]} della campagna`)
    })
    if (fascia && (presidio < fascia.presidio[0] || presidio > fascia.presidio[1]))
      guasti.push(`${M.nome}: presidio ${presidio.toFixed(2)}, fuori dalla fascia ` +
                  `${fascia.presidio[0]}–${fascia.presidio[1]} della campagna`)
    if (presidio < PRESIDIO_MINIMO)
      guasti.push(`${M.nome}: presidio ${presidio.toFixed(2)}, sotto il pavimento ` +
                  `di ${PRESIDIO_MINIMO}: non c'è tempo di tirare`)

    // e la stessa mappa con le postazioni che avrà davvero
    const q = postiVeri(t)
    const poche = conPochePostazioni(forme, M.W, M.H, S, q)
    if (poche.presidio < PRESIDIO_POCHI)
      guasti.push(`${M.nome}: con le sue ${q} postazioni il presidio scende a ` +
                  `${poche.presidio.toFixed(2)}, sotto ${PRESIDIO_POCHI}`)
    if (poche.buco > BUCO_INTERNO)
      guasti.push(`${M.nome}: con le sue ${q} postazioni restano ${poche.buco.toFixed(0)}u ` +
                  `di strada che nessuna torre vede (massimo ${BUCO_INTERNO}) ` +
                  `attorno a ${dove(poche.punto, M)}`)

    // e il caso più magro, che non fa fallire ma si dice
    if (q > MAGRO) {
      const v = conPochePostazioni(forme, M.W, M.H, S, MAGRO)
      if (v.buco > BUCO_INTERNO)
        avvisi.push(`${M.nome}: se scendesse a ${MAGRO} postazioni resterebbero ` +
                    `${v.buco.toFixed(0)}u scoperti attorno a ${dove(v.punto, M)}`)
      if (v.presidio < PRESIDIO_POCHI)
        avvisi.push(`${M.nome}: se scendesse a ${MAGRO} postazioni il presidio ` +
                    `sarebbe ${v.presidio.toFixed(2)}`)
    }

    misure.push({ ...M, S, lung, ...r, ...p, presidio, poche, posti: q, vie: vie.length,
                  incroci: incroci.length })
  }
  return { guasti, avvisi, misure }
}

// Chi arriva, e a che cosa è immune (vedi docs/castello/mostri.md).
function esaminaMostri(t) {
  if (!t.mostri || !t.mostri.length) return ['nessun mostro']
  const guasti = guastiDelleImmunita(t)
  // la copertura dell'apertura vuole la tappa coi suoi numeri veri
  const vera = t.libera ? t : TAPPE.find(x => x.campagna === t.campagna && x.nome === t.nome) || t
  guasti.push(...guastiDelleMiste(vera, Number.isFinite(vera.ondate) ? vera.ondate : ONDATE_TARATE))
  const copre = coperturaApertura(vera)
  const serve = Math.min(APERTURA_COPRE, Number.isFinite(vera.ondate) ? vera.ondate : APERTURA_COPRE)
  const corta = APERTURA_CORTA[vera.chiave || chiaveTappa(vera)]
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
const avvertimenti = []

console.log('\n  ═══ LE TAPPE DEL CASTELLO, E LE QUATTRO LIBERE ═══════════════════════\n')
console.log('      tappa                  lung   presidio  gomito corsie  piazzole 3-8 9-12  post: presidio  buco')
console.log('      ' + '─'.repeat(88))

for (const c of CAMPAGNE) {
  console.log(`\n      ${c.emoji} ${c.nome.toUpperCase()}`)
  const presidi = []
  for (const tappa of c.tappe) {
    const t = { ...tappa, campagna: c.id }
    const { guasti, avvisi, misure } = esaminaForma(t)
    const tutti = [...guasti, ...esaminaMostri(t)]
    for (const a of avvisi) avvertimenti.push(`${t.nome}: ${a}`)
    const [m] = misure
    presidi.push(m.presidio)
    console.log(`    ${tutti.length ? '✗' : ' '} ${(t.nome + ' ' + t.emoji).padEnd(21)}` +
      `${m.lung.toFixed(0).padStart(5)} ` +
      `${m.presidio.toFixed(2).padStart(7)} ` +
      `${m.gomito.toFixed(0).padStart(7)} ` +
      `${m.corridoio.toFixed(0).padStart(6)} ` +
      `${m.larga.toFixed(0).padStart(8)} ` +
      `${m.fitta.toFixed(0).padStart(4)}  ` +
      `${m.posti}: ${m.poche.presidio.toFixed(2)} ` +
      `buco ${m.poche.buco.toFixed(0).padStart(3)}u`)
    if (tutti.length) { rotti++; for (const g of tutti) console.log(`        ✗ ${g}`) }
  }
  medie[c.id] = presidi.reduce((s, v) => s + v, 0) / presidi.length
}

console.log('\n      ♾️ LE PARTITE LIBERE')
for (const l of LIBERE) {
  const t = { ...l, libera: true }
  const { guasti, avvisi, misure } = esaminaForma(t)
  const tutti = [...guasti, ...esaminaMostri(t)]
  for (const a of avvisi) avvertimenti.push(`${t.nome}: ${a}`)
  const [m] = misure
  console.log(`    ${tutti.length ? '✗' : ' '} ${(t.nome + ' ' + t.emoji).padEnd(21)}` +
    `${m.lung.toFixed(0).padStart(5)} ` +
    `${m.presidio.toFixed(2).padStart(7)} ` +
    `${m.gomito.toFixed(0).padStart(7)} ` +
    `${m.corridoio.toFixed(0).padStart(6)} ` +
    `${m.larga.toFixed(0).padStart(8)} ` +
    `${m.fitta.toFixed(0).padStart(4)}  ` +
    `${m.posti}: ${m.poche.presidio.toFixed(2)} ` +
    `buco ${m.poche.buco.toFixed(0).padStart(3)}u` +
    `  comune ${(m.comune * 100).toFixed(0)}%` +
    (m.incroci ? `  incroci ${m.incroci}` : ''))
  if (tutti.length) { rotti++; for (const g of tutti) console.log(`        ✗ ${g}`) }
}

console.log('\n      ' + '─'.repeat(88))
console.log(`      (campo ${MONDO.W}×${MONDO.H} · distanze in unità di disegno)`)
console.log(`      minimi: gomito ${GOMITO}u · corsie ${CORRIDOIO}u · ` +
            `piazzole ${PIAZZOLE}u (fino alle sue) e ${PIAZZOLE_FITTE}u (due in più)`)
console.log(`      con le postazioni vere della tappa: presidio almeno ${PRESIDIO_POCHI} · ` +
            `buco interno al massimo ${BUCO_INTERNO}u`)

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

if (avvertimenti.length) {
  console.log(`\n      ⚠ se le postazioni scendessero a ${MAGRO} (oggi sono ` +
              `${[...new Set(RACCONTO.map(postiVeri))].join(', ')}):`)
  for (const a of avvertimenti) console.log(`        ⚠ ${a}`)
}

const QUANTE = RACCONTO.length + LIBERE_RACCONTO.length
if (rotti) { console.log(`\n  ✗ ${rotti} cose da sistemare su ${QUANTE} tappe e libere\n`); process.exit(1) }
console.log(`\n  ✓ tutte e ${QUANTE} in regola\n`)
