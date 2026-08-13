/* ═══════════════════════════════════════════════════════════════════
   LA MAPPA PIENA — dalla forma compressa ai fatti della stanza

   Un livello scrive **una forma compressa**: una griglia di token e una
   legenda. Da lì al disegno c'era un salto, e ogni pezzo che aveva
   bisogno di sapere qualcosa sulla forma della stanza se lo ricavava da
   sé — o non se lo ricavava affatto. È il motivo per cui è finita una
   botte disegnata sopra un muro: non perché la regola fosse sbagliata,
   ma perché non c'era nessuno che sapesse cos'è un muro.

   Questo file è quel passo, ed è **una funzione pura**: stessa griglia,
   stessi fatti. Nessun canvas, nessuna regola di gioco, nessuno stato —
   quindi si prova guardandoci dentro invece di guardare cosa esce
   dipinto.

   ── COSA RISPONDE ────────────────────────────────────────────────
     stanza(i,k)      in che stanza sta questa cella
     soglia(i,k)      è un passaggio: una strozzatura fra due aperti
     bordo(i,k)       pavimento con un muro accanto
     angolo(i,k)      pavimento con due muri su lati diversi
     obbligata(i,k)   toglierla spezzerebbe il pavimento in due
     faccia(i,k)      questo muro dà su un pavimento (e da che parte)

   ── PERCHÉ SERVE ─────────────────────────────────────────────────
   Perché tutte le scelte che riguardano *dove mettere qualcosa* sono
   scelte informate, non lotterie: una torcia sta sulla faccia di un
   muro che dà su un passaggio, una botte sta contro una parete e mai
   in una strozzatura, il terreno sotto una chiave è quello dei suoi
   vicini. Il seme serve alle imperfezioni — una macchia d'usura può
   nascere da un rumore, sbagliarla non vuol dire niente — non alle
   scelte, che sbagliate si vedono subito.
   ═══════════════════════════════════════════════════════════════════ */

const K = (i, k) => i + ',' + k
const PASSI = [[0, -1], [1, 0], [0, 1], [-1, 0]]

export function mappaPiena (griglia, { suoli: detti = {}, muri = {}, arredi = {},
                                       riempi = [] } = {}) {
  const h = griglia.length
  const w = h ? griglia[0].length : 0
  const dentro = (i, k) => i >= 0 && k >= 0 && i < w && k < h
  const muro = (i, k) => !dentro(i, k) || griglia[k][i] === '#'

  /* ── IL TERRENO SOTTO LE COSE ──
     Un token dice **una cosa sola**: la cella che ospita una chiave non
     può dichiarare anche il pavimento, e restava con quello
     dell'ambiente — una macchia d'erba sotto ogni oggetto in mezzo al
     lastricato. Nessuno lo vuole scrivere a mano, e non deve: **si
     guarda intorno**. Chi ha qualcosa sopra prende il suolo più diffuso
     fra i quattro vicini; le celle nude no, se no il lastricato
     colerebbe nel cortile attraverso il passaggio. Tre passate, perché
     due cose vicine si passano il testimone. */
  const suoli = { ...detti }
  for (let giro = 0; giro < 3; giro++)
    for (const c of riempi) {
      if (suoli[c]) continue
      const [x, y] = c.split(',').map(Number)
      const conto = {}
      for (const [a, b] of PASSI) {
        const q = suoli[K(x + a, y + b)]
        if (q) conto[q] = (conto[q] || 0) + 1
      }
      const vinta = Object.keys(conto).sort((p, q) => conto[q] - conto[p])[0]
      if (vinta) suoli[c] = vinta
    }
  const suolo = (i, k) => suoli[K(i, k)] || null

  /* ── LE SOGLIE ──
     Una strozzatura: pavimento con i muri sui due lati opposti. È
     quello che a occhio si legge come «di qui si passa», ed è anche il
     posto dove non va messo niente — chi ci mette una botte chiude la
     stanza. Non serve sapere se è una porta: la forma basta. */
  const soglia = (i, k) => {
    if (muro(i, k)) return false
    const su = muro(i, k - 1), giu = muro(i, k + 1)
    const sx = muro(i - 1, k), dx = muro(i + 1, k)
    return (su && giu && !sx && !dx) || (sx && dx && !su && !giu)
  }

  const bordo = (i, k) => !muro(i, k) && PASSI.some(([a, b]) => muro(i + a, k + b))
  const angolo = (i, k) => {
    if (muro(i, k)) return false
    const su = muro(i, k - 1), giu = muro(i, k + 1)
    const sx = muro(i - 1, k), dx = muro(i + 1, k)
    return (su || giu) && (sx || dx)
  }

  /* ── LE STANZE ──
     Si allagano i pavimenti **senza attraversare le soglie**: quello
     che resta separato è una stanza. È la definizione più semplice che
     funzioni, e non ha bisogno di sapere cosa sia una porta — un
     corridoio largo uno è una soglia lunga, e infatti non è una stanza:
     è quello che le unisce. */
  const diChi = {}
  const stanze = []
  for (let k = 0; k < h; k++) for (let i = 0; i < w; i++) {
    if (muro(i, k) || soglia(i, k) || diChi[K(i, k)] != null) continue
    const id = stanze.length
    const celle = []
    const coda = [[i, k]]
    diChi[K(i, k)] = id
    while (coda.length) {
      const [x, y] = coda.pop()
      celle.push({ x, y })
      for (const [a, b] of PASSI) {
        const nx = x + a, ny = y + b
        if (muro(nx, ny) || soglia(nx, ny) || diChi[K(nx, ny)] != null) continue
        diChi[K(nx, ny)] = id
        coda.push([nx, ny])
      }
    }
    stanze.push({ id, celle, area: celle.length })
  }

  /* ── I PASSI OBBLIGATI ──
     Una cella che, tolta, spezza il pavimento in due: chi ci mette
     sopra qualcosa chiude una strada che a qualcuno serviva.

     Si potrebbe fare alla maniera stupida — togli una cella, riconta i
     pezzi, ripeti per tutte — ed è il primo modo in cui è stato
     scritto. Su una mappa di duecento celle sono quarantamila conti, e
     si pagano **a ogni apertura di livello, sul telefono**, per una
     risposta che si può avere in una visita sola. Questa è quella
     visita: si scende in profondità e ci si segna, per ogni cella, la
     più alta a cui si riesce a risalire senza ripassare da chi ci ha
     portati lì. Se da un figlio non si risale più su del padre, quel
     padre è l'unica strada. La radice fa storia a sé: è obbligata solo
     se da lì partono due rami che non si ritrovano.
     Il ciclo è scritto a mano invece che a ricorsione perché una
     stanza lunga darebbe una pila profonda quanto il pavimento. */
  const obbligate = {}
  const quando = {}, risale = {}
  let orologio = 0
  for (let k0 = 0; k0 < h; k0++) for (let i0 = 0; i0 < w; i0++) {
    if (muro(i0, k0) || quando[K(i0, k0)] != null) continue
    quando[K(i0, k0)] = risale[K(i0, k0)] = orologio++
    let rami = 0
    const pila = [[i0, k0, null, 0]]
    while (pila.length) {
      const nodo = pila[pila.length - 1]
      const [x, y, padre] = nodo
      if (nodo[3] < PASSI.length) {
        const [a, b] = PASSI[nodo[3]++]
        const nx = x + a, ny = y + b
        if (muro(nx, ny) || K(nx, ny) === padre) continue
        if (quando[K(nx, ny)] != null) {
          risale[K(x, y)] = Math.min(risale[K(x, y)], quando[K(nx, ny)])
          continue
        }
        if (K(x, y) === K(i0, k0)) rami++
        quando[K(nx, ny)] = risale[K(nx, ny)] = orologio++
        pila.push([nx, ny, K(x, y), 0])
        continue
      }
      pila.pop()
      if (!padre) continue
      risale[padre] = Math.min(risale[padre], risale[K(x, y)])
      if (padre !== K(i0, k0) && risale[K(x, y)] >= quando[padre])
        obbligate[padre] = true
    }
    if (rami > 1) obbligate[K(i0, k0)] = true
  }

  /* ── LE FACCE DEI MURI ──
     Un muro che dà su un pavimento, e da che parte: è dove si appende
     una torcia o una ragnatela. Il verso conta — una torcia sulla
     faccia sbagliata è una torcia dentro la roccia. */
  const facce = []
  for (let k = 0; k < h; k++) for (let i = 0; i < w; i++) {
    if (!muro(i, k) || !dentro(i, k)) continue
    for (const [a, b] of PASSI)
      if (!muro(i + a, k + b) && dentro(i + a, k + b))
        facce.push({ x: i, y: k, versoX: a, versoY: b, stanza: diChi[K(i + a, k + b)] ?? null })
  }

  return {
    w, h, dentro, muro,
    suoli, suolo,
    muratura: (i, k) => muri[K(i, k)] || null,
    arredo: (i, k) => arredi[K(i, k)] || null,
    soglia, bordo, angolo,
    obbligata: (i, k) => !!obbligate[K(i, k)],
    stanza: (i, k) => diChi[K(i, k)] ?? null,
    stanze, facce,
  }
}
