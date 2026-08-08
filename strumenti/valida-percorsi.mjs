#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   LE QUINDICI TAPPE DEL CASTELLO, PASSATE AI RAGGI X

       node strumenti/valida-percorsi.mjs

   Una `forma` in `data/campagne-castello.js` è una spezzata di sei
   numeri per riga: si legge bene e non dice niente. Questo strumento
   la fa diventare quello che diventa in gioco — la smussa con lo
   stesso Chaikin del motore, ci dispone le postazioni con la stessa
   formula di `motore/battaglia.js` — e poi controlla le cose che a
   occhio non si vedono. Due volte, alle misure vere del riquadro:
   quelle del telefono (390×420) e quelle del computer (520×420, il
   massimo che `.campo` concede).

   Le distanze sono in **unità di disegno** (`S`), la stessa misura in
   cui sono scritti i raggi delle torri e le piazzole: in pixel non
   vorrebbero dire niente, perché il campo cambia taglia.

   ── che cosa guarda ──

     margini      il tracciato sta dentro il riquadro giocabile, entra
                  da sinistra ed esce a destra;

     gomito       quanto si avvicinano due parti del tracciato che
                  distano fino a 200 unità **di cammino**: è una curva
                  che torna su sé stessa, e va bene che si avvicini —
                  nell'incavo di un gomito la torre ci sta apposta. Il
                  minimo serve solo a escludere i tornanti a spillo;

     corridoio    la stessa cosa fra parti che distano più di 200
                  unità di cammino: lì sono due corsie diverse, e
                  devono starsi larghe. Il conto del minimo: 34
                  (quanto sta fuori una postazione) + 15 (la sua
                  piazzola) + 17 (mezza strada) = 66, tenuto a 62;

     piazzole     la distanza fra le due postazioni più vicine, **per
                  ogni numero di postazioni** fra 3 e 12 — quante ne
                  metterà davvero la tappa lo decide `data/castello.js`
                  e qui non lo si sa. Da 3 a 8 è la fascia che le
                  quindici tappe useranno per davvero;

     presidio     quanta strada tiene sotto tiro una postazione,
                  misurata in raggi d'arciere. Su un tracciato diritto
                  una torre ne batte due, uno per lato: presidio ~1,9.
                  Su un tracciato ripiegato la stessa torre ne batte
                  quattro, e la tappa perdona. È la difficoltà che sta
                  nella mappa invece che nei numeri, ed è per questo
                  che deve **scendere** dal bosco alle mura;

     scoperto     la stessa cosa guardata con **le postazioni che la
                  tappa ha davvero**, che da quando i calcoli sono
                  scesi sono tre o quattro, non otto. È un controllo
                  diverso dal presidio e serve a un'altra paura: il
                  presidio è una media, e una media alta si può fare
                  anche con due torri appiccicate e mezzo tracciato
                  senza nessuno. Quindi qui si guarda il **buco**: il
                  tratto continuo più lungo che nessuna torre vede.
                  Si contano solo i buchi **interni**, fra la prima e
                  l'ultima postazione: quelli in testa e in coda non
                  dipendono dal disegno ma dalla formula che dispone
                  le piazzole a `lunghezza/(n+1)`, che lascia sempre
                  un quarto di strada libero all'ingresso e uno
                  all'uscita, su qualunque mappa;

     debolezze    dove sono accese, ogni mostro deve essere debole a
                  una torre che la tappa mette a disposizione, e in un
                  elenco devono comparire almeno due debolezze diverse.
                  In più — ed è una richiesta di questo file, non una
                  regola del gioco — due ondate di fila non devono
                  chiedere la stessa torre.
   ═══════════════════════════════════════════════════════════════════ */
import { smussa, tracciato } from '../src/grafica/geometria.js'
import { CAMPAGNE, RACCONTO } from '../src/data/campagne-castello.js'
import { MOSTRI, torreDebole } from '../src/data/mostri.js'
/* Quante piazzole avrà davvero la tappa lo decide l'economia, che sta
   in un altro file e in un altro cantiere. La si legge — non la si
   scrive — perché senza quel numero questo strumento controllerebbe
   una mappa che non esiste: gli stessi tracciati con otto torri e con
   tre non sono la stessa difesa. */
import { postiDi } from '../src/data/castello.js'

/* ── i margini del campo ── */
const X0 = 0.03, X1 = 0.97, Y0 = 0.25, Y1 = 0.92
const INGRESSO = 0.035          // il primo punto sta sul bordo sinistro
const USCITA = 0.90             // l'ultimo arriva davvero a destra

/* ── le distanze minime, in unità di disegno ── */
const GOMITO = 52               // dentro una curva che rientra
const CORRIDOIO = 62            // fra due corsie diverse
const PIAZZOLE = 40             // fra due postazioni, da 3 a 8
const PIAZZOLE_FITTE = 22       // fra due postazioni, da 9 a 12
const VICINO = 80               // sotto questo cammino due punti sono lo stesso tratto
const LONTANO = 200             // oltre questo cammino sono due corsie
const RAGGIO = 92               // il raggio dell'arciere di livello 1

/* ── le fasce per campagna: lunghezza in unità, presidio in raggi ──
   Valgono per il **telefono**, che è il campo vero: il manifest impone
   il verticale e `.campo` arriva a 520px solo su uno schermo largo.
   Sul computer lo stesso tracciato si allunga in orizzontale e il
   presidio cala — è noto, ed è il motivo per cui il riquadro è tappato
   a 520px (vedi il commento sul `.campo` in TowerDefense.vue). Là si
   controlla solo che non peggiori oltre un pavimento. */
const FASCE = {
  bosco:       { lung: [780, 1000], presidio: [2.15, 2.70] },
  sotterraneo: { lung: [520, 950],  presidio: [1.95, 2.40] },
  mura:        { lung: [420, 800],  presidio: [1.80, 2.20] },
}
const LARGO = 1.2               // quanto può allungarsi su uno schermo largo
const PRESIDIO_MINIMO = 1.85    // il pavimento, ovunque: sotto è un tiro al bersaglio

/* ── le postazioni che ci sono davvero ──
   `postiDi()` ne dà **tre o quattro** per tappa: sono scese da
   otto-dieci quando il numero di calcoli è sceso, e i percorsi qui
   dentro erano stati disegnati prima. Con tre torri al posto di otto
   un tracciato può lasciare scoperti tratti che con otto non si
   vedevano, e la fascia di presidio non se ne accorge — è una media, e
   le medie non hanno buchi.
   Si guarda il numero vero della tappa, non un numero di comodo: a tre
   e a quattro le piazzole non stanno negli stessi posti, e una mappa
   che regge a quattro può avere un buco a tre. Se un giorno l'economia
   cambia quel numero, questo controllo se ne accorge da solo. */
const postiVeri = t => postiDi(t)
/* In più si prova sempre il caso più magro — **tre** postazioni, il
   minimo che `postiDi` possa dare — anche se oggi nessuna tappa ci
   arriva. Non fa fallire niente: è un avvertimento, perché quanto
   spendere e quante piazzole aprire è una manopola che si gira spesso,
   e se domani una tappa scende a tre è meglio saperlo prima che dopo. */
const MAGRO = 3
/* Il pavimento del presidio si abbassa quando le postazioni sono
   poche: con tre torri su un rettifilo delle mura non si può chiedere
   la densità che ne fanno sei. Quello che non si sconta è il buco. */
const PRESIDIO_POCHI = 1.78
/* Quanto può essere lungo un tratto interno che nessuna torre vede.
   Sessanta unità sono due terzi scarsi di un raggio d'arciere: il
   nemico ci passa senza prendere niente, ma non fa in tempo a
   riprendere fiato. Oggi la peggiore delle quindici sta a 42. */
const BUCO_INTERNO = 60
/* e l'ordine fra le campagne, che è il punto di tutto: il bosco
   perdona più del sotterraneo, che perdona più delle mura */
const SCALINO = 0.12

/* le due misure vere del riquadro (`.campo` in TowerDefense.vue:
   height min(52vh,420px), width min(100%,520px)) */
const MISURE = [
  { nome: 'telefono', W: 390, H: 420 },
  { nome: 'computer', W: 520, H: 420 },
]
/* la stessa scala di `grafica/tela.js` */
const scalaDi = (W, H) => Math.max(0.62, Math.min(1.5, Math.min(W, H) / 420))

/* ── la copia fedele di `costruisciPercorso` in motore/battaglia.js ──
   Non si importa perché quella funzione vive dentro una chiusura, e
   riscriverla qui è il male minore: sono nove righe, tenute uguali
   apposta. Se un giorno divergono, questo strumento smette di dire la
   verità — ed è la prima cosa da guardare se i conti non tornano. */
function campoDi(forma, W, H, S, quante) {
  const via = tracciato(smussa(forma.map(([x, y]) => ({ x: x * W, y: y * H }))))
  const postazioni = []
  const passo = via.lunghezza / (quante + 1)
  for (let i = 1; i <= quante; i++) {
    const p = via.puntoA(passo * i)
    const n = via.normaleA(passo * i)
    const off = 34 * S * (i % 2 ? 1 : -1)
    const m = 22 * S
    postazioni.push({ x: Math.max(m, Math.min(W - m, p.x + n.x * off)),
                      y: Math.max(m, Math.min(H - m, p.y + n.y * off)) })
  }
  postazioni.reverse()
  return { via, postazioni }
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const dove = (p, M) => p ? `(${(p.x / M.W).toFixed(2)}, ${(p.y / M.H).toFixed(2)})` : '—'

/* quanto si sfiorano due parti del tracciato, distinguendo il gomito
   (poco cammino in mezzo) dalla corsia parallela (molto cammino) */
function ravvicinamenti(via, S) {
  const passo = 4 * S
  const camp = via.campiona(passo)
  let gomito = Infinity, corridoio = Infinity, dg = null, dc = null
  for (let i = 0; i < camp.length; i++)
    for (let k = i + 1; k < camp.length; k++) {
      const cammino = (k - i) * passo / S
      if (cammino < VICINO) continue
      const d = dist(camp[i], camp[k]) / S
      if (cammino < LONTANO) { if (d < gomito) { gomito = d; dg = camp[i] } }
      else if (d < corridoio) { corridoio = d; dc = camp[i] }
    }
  return { gomito, corridoio, dg, dc }
}

/* le due postazioni più vicine, nella fascia di postazioni che conta e
   in quella che conterebbe se un giorno l'economia ne chiedesse tante */
function piazzoleStrette(forma, W, H, S) {
  let larga = Infinity, fitta = Infinity, quante = 0
  for (let q = 3; q <= 12; q++) {
    const { postazioni } = campoDi(forma, W, H, S, q)
    for (let i = 0; i < postazioni.length; i++)
      for (let k = i + 1; k < postazioni.length; k++) {
        const d = dist(postazioni[i], postazioni[k]) / S
        if (q <= 8) { if (d < larga) { larga = d; quante = q } }
        else if (d < fitta) fitta = d
      }
  }
  return { larga, fitta, quante }
}

/* Il presidio. Si misura con sei postazioni — il numero di mezzo fra
   quelli che una tappa può avere — così le quindici mappe si
   confrontano fra loro con lo stesso metro. */
function presidioDi(forma, W, H, S, quante = 6) {
  const { via, postazioni } = campoDi(forma, W, H, S, quante)
  const passo = 3 * S
  const camp = via.campiona(passo)
  const R = RAGGIO * S
  let totale = 0
  for (const t of postazioni)
    for (const c of camp) if (dist(c, t) <= R) totale += passo
  return totale / postazioni.length / R
}

/* La tappa vista con le postazioni che ha davvero. Torna il presidio e
   il buco interno più lungo — il tratto continuo che nessuna delle
   `quante` torri raggiunge, contato solo fra la prima e l'ultima
   piazzola. Il raggio è quello dell'arciere: è la torre che si compra
   per prima e quella con cui si copre, non il ghiaccio a 86 né le
   bombe a 132. */
function conPochePostazioni(forma, W, H, S, quante) {
  const { via, postazioni } = campoDi(forma, W, H, S, quante)
  const passo = 3 * S
  const camp = via.campiona(passo)
  const R = RAGGIO * S
  const visto = camp.map(c => postazioni.some(t => dist(c, t) <= R))
  const primo = visto.indexOf(true), ultimo = visto.lastIndexOf(true)
  let totale = 0
  for (const t of postazioni)
    for (const c of camp) if (dist(c, t) <= R) totale += passo
  let buco = 0, peggiore = 0, punto = null
  for (let i = primo; i <= ultimo; i++) {
    if (visto[i]) { buco = 0; continue }
    buco += passo
    if (buco > peggiore) { peggiore = buco; punto = camp[i] }
  }
  return { presidio: totale / postazioni.length / R, buco: peggiore / S, punto }
}

/* ═══════════ la geometria di una tappa ═══════════ */
function esaminaForma(t) {
  const guasti = [], avvisi = []
  const f = t.forma

  if (!f || f.length < 4) guasti.push(`solo ${f ? f.length : 0} punti: non è un percorso`)
  for (const [i, [x, y]] of f.entries())
    if (x < X0 - 1e-9 || x > X1 + 1e-9 || y < Y0 - 1e-9 || y > Y1 + 1e-9)
      guasti.push(`punto ${i} (${x}, ${y}) fuori dal riquadro [${X0}–${X1}] × [${Y0}–${Y1}]`)
  if (f[0][0] > INGRESSO) guasti.push(`non entra dal bordo sinistro (x = ${f[0][0]})`)
  if (f[f.length - 1][0] < USCITA) guasti.push(`non arriva a destra (x = ${f[f.length - 1][0]})`)

  const misure = []
  for (const M of MISURE) {
    const S = scalaDi(M.W, M.H)
    const { via } = campoDi(f, M.W, M.H, S, 6)
    const r = ravvicinamenti(via, S)
    const p = piazzoleStrette(f, M.W, M.H, S)
    const presidio = presidioDi(f, M.W, M.H, S)
    const lung = via.lunghezza / S
    const fascia = FASCE[t.campagna]

    if (r.gomito < GOMITO)
      guasti.push(`${M.nome}: tornante a spillo, ${r.gomito.toFixed(0)}u ` +
                  `(minimo ${GOMITO}) attorno a ${dove(r.dg, M)}`)
    if (r.corridoio < CORRIDOIO)
      guasti.push(`${M.nome}: due corsie a ${r.corridoio.toFixed(0)}u ` +
                  `(minimo ${CORRIDOIO}) attorno a ${dove(r.dc, M)}`)
    if (p.larga < PIAZZOLE)
      guasti.push(`${M.nome}: due piazzole a ${p.larga.toFixed(0)}u ` +
                  `(minimo ${PIAZZOLE}) con ${p.quante} postazioni`)
    if (p.fitta < PIAZZOLE_FITTE)
      guasti.push(`${M.nome}: due piazzole a ${p.fitta.toFixed(0)}u ` +
                  `(minimo ${PIAZZOLE_FITTE}) fra 9 e 12 postazioni`)
    const stretto = M.nome === 'telefono'
    const tetto = stretto ? fascia.lung[1] : fascia.lung[1] * LARGO
    if (lung < fascia.lung[0] || lung > tetto)
      guasti.push(`${M.nome}: lunga ${lung.toFixed(0)}u, fuori dalla fascia ` +
                  `${fascia.lung[0]}–${tetto.toFixed(0)} della campagna`)
    if (stretto && (presidio < fascia.presidio[0] || presidio > fascia.presidio[1]))
      guasti.push(`telefono: presidio ${presidio.toFixed(2)}, fuori dalla fascia ` +
                  `${fascia.presidio[0]}–${fascia.presidio[1]} della campagna`)
    if (presidio < PRESIDIO_MINIMO)
      guasti.push(`${M.nome}: presidio ${presidio.toFixed(2)}, sotto il pavimento ` +
                  `di ${PRESIDIO_MINIMO}: non c'è tempo di tirare`)

    /* e la stessa mappa con le postazioni che avrà davvero */
    const q = postiVeri(t)
    const poche = conPochePostazioni(f, M.W, M.H, S, q)
    if (poche.presidio < PRESIDIO_POCHI)
      guasti.push(`${M.nome}: con le sue ${q} postazioni il presidio scende a ` +
                  `${poche.presidio.toFixed(2)}, sotto ${PRESIDIO_POCHI}`)
    if (poche.buco > BUCO_INTERNO)
      guasti.push(`${M.nome}: con le sue ${q} postazioni restano ${poche.buco.toFixed(0)}u ` +
                  `di strada che nessuna torre vede (massimo ${BUCO_INTERNO}) ` +
                  `attorno a ${dove(poche.punto, M)}`)

    /* e il caso più magro, che non fa fallire ma si dice */
    if (q > MAGRO) {
      const v = conPochePostazioni(f, M.W, M.H, S, MAGRO)
      if (v.buco > BUCO_INTERNO)
        avvisi.push(`${M.nome}: se scendesse a ${MAGRO} postazioni resterebbero ` +
                    `${v.buco.toFixed(0)}u scoperti attorno a ${dove(v.punto, M)}`)
      if (v.presidio < PRESIDIO_POCHI)
        avvisi.push(`${M.nome}: se scendesse a ${MAGRO} postazioni il presidio ` +
                    `sarebbe ${v.presidio.toFixed(2)}`)
    }

    misure.push({ ...M, S, lung, ...r, ...p, presidio, poche, posti: q })
  }
  return { guasti, avvisi, misure }
}

/* ═══════════ chi arriva, e a che cosa è debole ═══════════ */
function esaminaMostri(t) {
  const guasti = []
  if (!t.mostri || !t.mostri.length) return ['nessun mostro']
  for (const m of t.mostri) if (!MOSTRI[m]) guasti.push(`mostro sconosciuto: ${m}`)
  if (!t.debolezze) {
    if (t.torri.length > 1)
      guasti.push(`ha ${t.torri.length} torri ma le debolezze spente: la scelta non conta`)
    return guasti
  }
  const deboli = t.mostri.map(m => torreDebole(m))
  for (const [i, d] of deboli.entries()) {
    if (!d) { guasti.push(`${t.mostri[i]} non ha una debolezza`); continue }
    if (!t.torri.includes(d))
      guasti.push(`${t.mostri[i]} è debole a «${d}», che questa tappa non mette a disposizione`)
  }
  if (new Set(deboli).size < 2)
    guasti.push('una sola debolezza in tutto l\'elenco: la risposta è sempre la stessa')
  if (deboli.length > 1)
    for (const [i, d] of deboli.entries())
      if (d && d === deboli[(i + 1) % deboli.length])
        guasti.push(`${t.mostri[i]} e ${t.mostri[(i + 1) % deboli.length]} ` +
                    `chiedono la stessa torre in due ondate di fila (${d})`)
  return guasti
}

/* ═══════════ la stampa ═══════════ */
let rotti = 0
const medie = {}
const avvertimenti = []

console.log('\n  ═══ LE QUINDICI TAPPE DEL CASTELLO ═══════════════════════════════════\n')
console.log('      tappa                  lung   presidio  gomito corsie  piazzole 3-8 9-12  post: presidio  buco')
console.log('      ' + '─'.repeat(88))

for (const c of CAMPAGNE) {
  console.log(`\n      ${c.emoji} ${c.nome.toUpperCase()}`)
  const presidi = []
  for (const tappa of c.tappe) {
    const t = { ...tappa, campagna: c.id, debolezze: !!tappa.debolezze }
    const { guasti, avvisi, misure } = esaminaForma(t)
    const tutti = [...guasti, ...esaminaMostri(t)]
    for (const a of avvisi) avvertimenti.push(`${t.nome}: ${a}`)
    const [m, d] = misure
    presidi.push(m.presidio)
    console.log(`    ${tutti.length ? '✗' : ' '} ${(t.nome + ' ' + t.emoji).padEnd(21)}` +
      `${m.lung.toFixed(0).padStart(4)}/${d.lung.toFixed(0).padStart(4)} ` +
      `${m.presidio.toFixed(2)}/${d.presidio.toFixed(2)} ` +
      `${m.gomito.toFixed(0).padStart(4)}/${d.gomito.toFixed(0).padStart(3)} ` +
      `${m.corridoio.toFixed(0).padStart(4)}/${d.corridoio.toFixed(0).padStart(3)} ` +
      `${m.larga.toFixed(0).padStart(5)}/${d.larga.toFixed(0).padStart(3)} ` +
      `${m.fitta.toFixed(0).padStart(3)}/${d.fitta.toFixed(0).padStart(3)}  ` +
      `${m.posti}: ${m.poche.presidio.toFixed(2)}/${d.poche.presidio.toFixed(2)} ` +
      `buco ${m.poche.buco.toFixed(0).padStart(2)}/${d.poche.buco.toFixed(0).padStart(2)}u`)
    if (tutti.length) { rotti++; for (const g of tutti) console.log(`        ✗ ${g}`) }
  }
  medie[c.id] = presidi.reduce((s, v) => s + v, 0) / presidi.length
}

console.log('\n      ' + '─'.repeat(88))
console.log('      (telefono 390×420 / computer 520×420 · distanze in unità di disegno)')
console.log(`      minimi: gomito ${GOMITO}u · corsie ${CORRIDOIO}u · ` +
            `piazzole ${PIAZZOLE}u (3-8) e ${PIAZZOLE_FITTE}u (9-12)`)
console.log(`      con le postazioni vere della tappa: presidio almeno ${PRESIDIO_POCHI} · ` +
            `buco interno al massimo ${BUCO_INTERNO}u`)

/* l'ordine fra le campagne: il presidio medio deve scendere, e di un
   passo che si senta */
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

if (rotti) { console.log(`\n  ✗ ${rotti} cose da sistemare su ${RACCONTO.length} tappe\n`); process.exit(1) }
console.log(`\n  ✓ tutte e ${RACCONTO.length} in regola\n`)
