// Le regole dell'arena come dato puro: il campo, le truppe, i prezzi.
// Nessuna funzione che gioca (sta in `motore/`). Il perché di ogni numero e
// come si tara: docs/arena/.

/* Il campo, in unità del mondo (la scena lo scala). Una corsia sola, al
   centro: nessun nemico può finire «dietro» le linee di chi costruisce. */
export const CAMPO = {
  W: 360, H: 540,
  fiume: { alto: 245, basso: 295 },   // l'acqua; la strada la attraversa, larga quanto la corsia
  corsia: 180,                         // la x del ponte e della strada
  muro: 312,                           // la porta in fondo al ponte, metà di sotto (la sopra è specchiata)
  base: 520,                           // la y del castello, metà di sotto: sul bordo, se ne vede solo la cima
}

/* Le piazzole sulla metà di sotto; sopra sono specchiate in y. Sei, fisse e sempre visibili
   (una base stabile, come le piazzole del castello a torri), fra la porta del ponte e il
   castello, su tre file: chi assedia le trova prima del castello. Ci va una caserma o una
   miniera. Chi gioca la sceglie toccandola; il nemico la lascia al motore: prima il lato con
   meno edifici, e dentro il lato il posto più al sicuro (più lontano dal fiume). */
export const POSTI = [[86, 452], [274, 452], [98, 398], [262, 398], [110, 344], [250, 344]]

/* Le truppe. `op` è l'operazione che si risolve per costruire e potenziare la
   sua caserma; `costo` è quello della prima pietra, uguale per le due truppe di
   un edificio (si sceglie il mestiere, non il prezzo). Cambia la forma, non il
   valore: ogni truppa vale più o meno lo stesso per moneta, e le differenze sono
   di chi colpisce e chi no (`bers`: tutti, terra, torri). Chi colpisce da vicino ha il
   doppio della vita di chi tira da lontano, chi tira una volta e mezza il danno: non di
   più, perché sta nelle retrovie e muore meno (docs/arena/regole.md). */
export const TRUPPE = {
  scheletri:   { nome: 'Arcieri',     op: '+', costo: 6,  n: 4, hp: 45,   dmg: 18,   rate: 1.0, vel: 40, gitt: 84, bers: 'tutti', vola: false, splash: 0,
                 nota: 'Scheletri arcieri, in quattro: da lontano, e colpiscono anche chi vola.' },
  guardiano:   { nome: 'Opliti',      op: '+', costo: 6,  n: 2, hp: 300,  dmg: 22,   rate: 1.1, vel: 38, gitt: 14, bers: 'terra', vola: false, splash: 0,
                 nota: 'Scheletri con lo scudo, in due: solidi, ma non colpiscono chi vola.' },
  lupi:        { nome: 'Lupi',        op: '×', costo: 8,  n: 4, hp: 140,  dmg: 10,   rate: 0.8, vel: 72, gitt: 13, bers: 'terra', vola: false, splash: 0,
                 nota: 'In quattro, velocissimi. Non colpiscono chi vola.' },
  pipistrelli: { nome: 'Pipistrelli', op: '−', costo: 8,  n: 6, hp: 40,   dmg: 5.4,  rate: 0.9, vel: 82, gitt: 12, bers: 'tutti', vola: true,  splash: 0,
                 nota: 'In sei, volano sopra i muri e sono veloci. Deboli ai colpi ad area.' },
  negromante:  { nome: 'Negromanti',  op: '−', costo: 10, n: 2, hp: 90,   dmg: 20,   rate: 1.4, vel: 36, gitt: 90, bers: 'tutti', vola: false, splash: 14,
                 nota: 'Maghi, in due: da lontano, e il colpo scoppia. Ottimi contro i gruppi.' },
  diavoletto:  { nome: 'Diavoletti',  op: '÷', costo: 10, n: 2, hp: 90,   dmg: 24,   rate: 1.6, vel: 36, gitt: 70, bers: 'terra', vola: false, splash: 15,
                 nota: 'In due, lanciano bombe a terra che scoppiano. Non colpiscono chi vola.' },
  golem:       { nome: 'Golem',       op: '×', costo: 20, n: 1, hp: 1700, dmg: 120,  rate: 2.0, vel: 22, gitt: 16, bers: 'torri', vola: false, splash: 0,
                 nota: 'Lentissimo e resistente: va dritto alle costruzioni e ignora le truppe.' },
  drago:       { nome: 'Drago',       op: '÷', costo: 20, n: 1, hp: 195,  dmg: 25,   rate: 1.2, vel: 50, gitt: 42, bers: 'tutti', vola: true,  splash: 13,
                 nota: 'Vola sopra i muri e sputa fuoco ad area. Lo fermano gli arcieri.' },
}

/* Gli edifici: quattro caserme, ognuna con due truppe. Quale delle due si sceglie
   costruendola; il livello è dell'edificio (una ricerca): crollata e rifatta, riparte da
   lì, anche se si sceglie l'altra truppa. Si parte senza caserme: la prima mossa è la
   cripta. Le chiavi non si rinominano: stanno nei salvataggi delle partite a metà. */
export const EDIFICI = {
  cripta: { nome: 'La cripta',       varianti: ['scheletri', 'guardiano'] },
  tana:   { nome: 'La tana',         varianti: ['lupi', 'pipistrelli'] },
  torre:  { nome: 'La torre oscura', varianti: ['negromante', 'diavoletto'] },
  antro:  { nome: "L'antro",         varianti: ['golem', 'drago'] },
}
export const EDIFICIO_DI = Object.fromEntries(Object.entries(EDIFICI).flatMap(([ed, e]) => e.varianti.map(id => [id, ed])))
export const OPERAZIONI = ['+', '−', '×', '÷']

/* Il castello: l'unica costruzione che spara e si potenzia, e quella che non
   deve cadere. Da solo tiene i primi minuti: il respiro che serve per decidere.
   Spara lontano (`gitt`) perché dal bordo deve coprire la porta in fondo al ponte; ad area
   (`splash`) e, dentro `difesa` (le piazzole, non la porta), `vicino` volte più forte: chi
   arriva sotto casa lo paga, e lo scontro torna al centro (docs/arena/regole.md). */
export const CASTELLO = { nome: 'Castello', hp: 4000, dmg: 52,   rate: 0.75, gitt: 215, r: 30, splash: 16, difesa: 195, vicino: 3 }
// niente tetto ai livelli (l'utente: «non c'è motivo di imporre un limite»): li ferma il prezzo, che cresce
export const LIV_MAX = Infinity

/* Il numero di truppe di una squadra sale a scatti, il resto della crescita no (l'utente: «chiaramente
   aumenti meno la potenza se aumenti anche il numero, è giusto per fare un po' di scena»).
   - una truppa in più ogni `OGNI_TRUPPA` livelli (3, 6, 9…), fino a `SQUADRA_MAX` truppe per squadra
     (una squadra di partenza già più grande del tetto non ne prende): dopo, sale solo la potenza;
   - il bilancio è lo stesso di prima: la potenza di una squadra (truppe × forza di una) segue
     `1 + 0.15·(liv−1)` volte `1 + (liv−1)/8` (la crescita smussata di quando le truppe in più erano un
     ottavo a livello). Quindi la forza di ogni truppa è quel totale diviso per quante sono: dove arriva una
     truppa in più il guadagno di ognuna è piccolo. Mai negativo, e mai sotto il +4% (`SALITA_MIN`): nelle
     squadre da una o due truppe il numero in più supera da solo il totale, e senza il minimo i livelli dopo
     lo scatto non migliorerebbero niente. docs/arena/regole.md. */
export const OGNI_TRUPPA = 3
export const SQUADRA_MAX = 12
const ominiDi = (liv, n) => Math.max(0, Math.min(Math.max(SQUADRA_MAX, n), n + Math.floor(Math.max(1, liv) / OGNI_TRUPPA)) - n)
const SALITA_MIN = 0.04
const totaleDi = liv => (1 + 0.15 * (liv - 1)) * (1 + (liv - 1) / 8)
const forze = new Map()                                  // per squadra di n truppe: la forza di una truppa a ogni livello
function forzaDi(liv, n = 1) {
  liv = Math.max(1, Math.floor(liv))
  let v = forze.get(n)
  if (!v) forze.set(n, v = [1, 1])
  for (let l = v.length; l <= liv; l++) v[l] = Math.max(v[l - 1] * (1 + SALITA_MIN), totaleDi(l) * n / (n + ominiDi(l, n)))
  return v[liv]
}

/* Tutto quello che cresce con il livello. */
export const CRESCITA = {
  squadraOgni: liv => Math.max(2.5, 9 / (1 + 0.12 * (liv - 1))),   // secondi fra due squadre di una caserma
  forza: (liv, n) => forzaDi(liv, n),                    // vita e danno di OGNI truppa: segue il bilancio totale, vedi sotto
  vitaCaserma: liv => 1100 + 160 * (liv - 1),            // il primo bersaglio dell'assedio: deve reggere, il castello la copre
  omini: (liv, n) => ominiDi(liv, n),                    // truppe in più per squadra: una ogni TRE livelli (3, 6, 9…), fino a SQUADRA_MAX
  salita: liv => Math.round(8 * 1.32 ** (liv - 1)),        // costo di liv → liv+1 per una caserma: 8, 11, 14, 18, 24, 32, 42, 55, 73
  castello: {
    prezzo: liv => Math.round(8 * 1.3 ** (liv - 1)),       // 8, 10, 14, 18, 23, 30, 39, 51, 66
    danno: liv => 1 + 0.3 * (liv - 1),
    cadenza: liv => 1 + 0.08 * (liv - 1),
    gittata: liv => 4 * (liv - 1),
    vita: 300,                                             // per livello: massimo e punti subito
  },
  /* la miniera è un edificio su una piazzola: costruirla e potenziarla costa `prezzo(liv)` (0 =
     costruirla), e il livello di miniera di una parte è 1 + la somma dei livelli delle sue miniere
     in piedi: `resa` lo fa diventare il moltiplicatore delle monete al secondo */
  miniera: {
    prezzo: liv => 8 + 6 * liv + liv * liv,                // 8 costruirla, poi 15, 24, 35, 48…
    resa: liv => 1 + 0.7 * (liv - 1),                      // +70% per ogni livello di miniera
    vita: liv => 800 + 150 * (liv - 1),                    // più fragile di una caserma: chi fa economia rischia
  },
}

/* Le scelte che non sono caserme. `op` decide il tipo di calcolo. */
export const AZIONI = {
  miniera:  { nome: 'Miniera', op: '×', prezzo: null,
              nota: 'Una miniera su una piazzola: le monete arrivano il 70% più in fretta per ogni suo livello, finché sta in piedi. Costa ora, rende dopo, e il nemico la può abbattere.' },
  ripara:   { nome: 'Ripara',     op: '+', prezzo: 6,
              nota: 'Rimette in sesto la costruzione messa peggio (anche il muro, anche crollato): +40% di vita.' },
  castello: { nome: 'Castello',   op: '÷', prezzo: null,
              nota: 'Il castello spara più forte e più spesso, e resiste di più.' },
  vendi:    { nome: 'Vendi',      op: '−', prezzo: 0,
              nota: 'Vendi la caserma: ti ridà metà di quello che ci hai speso, e la piazzola torna libera per un\'altra.' },
  bomba:    { nome: 'Bomba',      op: '÷', prezzo: 0,
              nota: 'Una bomba in regalo ogni tanto, per DIFENDERTI: scoppia dove le truppe nemiche arrivate nella tua metà sono più fitte, e le spazza via. Serve per ripartire quando ti schiacciano.' },
}
/* La bomba non si compra: si REGALA a intervalli, a tutti e due. È il «reset» per quando uno ha una
   forza schiacciante e va avanti per inerzia: una cosa da comprare non aiuta chi è già indietro (non
   ha le monete). Si usa con un calcolo, ma non costa monete. Spazza l'ammasso più fitto di truppe. */
export const BOMBA = { ogni: 40, max: 2, raggio: 95, dmg: 700 }

export const MURO = { hp: 1400, r: 26 }             // uno per parte, la porta in fondo al ponte: non si costruisce, si ripara
export const RIPARA = 0.4                            // la quota di vita che rimette
export const RIPOSO = 6                              // secondi di caserma ferma dopo un calcolo sbagliato
export const CALCOLANDO = 0.5                        // la velocità del campo mentre si calcola: rallenta, non si ferma
export const COSTRUZIONE = 6                         // secondi prima della prima squadra di una caserma nuova

/* Un nemico: quanto ricarica, quanto pensa, e come gioca. Una sfida ne sceglie
   uno e lo ritocca (`forza` per le sue truppe, `monete` per quelle di partenza). */
export const NEMICI = {
  calmo:   { moneteAlSecondo: 1 / 1.9,  pensa: 1.2, forza: 1 },
  normale: { moneteAlSecondo: 1 / 1.45, pensa: 1.2, forza: 1 },
  tosto:   { moneteAlSecondo: 1 / 1.1,  pensa: 1.2, forza: 1 },
}
export const GIOCATORE = { moneteAlSecondo: 1 / 1.2, iniziali: 14 }
export const DURATA = 300                            // secondi di partita se nessuno cade prima: la miniera deve fare in tempo a rendere

/* Il dato si controlla da sé: un numero sbagliato è un test rosso in un
   secondo, non una partita storta su un telefono. */
export function guastiDelleRegole() {
  const g = []
  for (const [k, t] of Object.entries(TRUPPE)) {
    if (!OPERAZIONI.includes(t.op)) g.push(`${k}: operazione ${t.op}`)
    if (!Number.isInteger(t.costo) || t.costo < 0) g.push(`${k}: costo ${t.costo}`)
    if (!Number.isInteger(t.n) || t.n < 1) g.push(`${k}: n ${t.n}`)
    if (!['tutti', 'terra', 'torri'].includes(t.bers)) g.push(`${k}: bers ${t.bers}`)
    for (const c of ['hp', 'dmg', 'rate', 'vel', 'gitt']) if (!(t[c] > 0)) g.push(`${k}: ${c} ${t[c]}`)
  }
  for (const [ed, e] of Object.entries(EDIFICI)) {
    if (e.varianti.length !== 2 || e.varianti.some(id => !TRUPPE[id])) g.push(`${ed}: le truppe non sono due`)
    else if (TRUPPE[e.varianti[0]].costo !== TRUPPE[e.varianti[1]].costo) g.push(`${ed}: le due truppe costano diverso`)
  }
  if (Object.keys(EDIFICIO_DI).length !== Object.keys(TRUPPE).length) g.push('una truppa non sta in nessun edificio, o sta in due')
  if (GIOCATORE.iniziali < TRUPPE[EDIFICI.cripta.varianti[0]].costo) g.push('con le monete di partenza non si costruisce la cripta')
  // una truppa che vola e non colpisce chi vola non c'è: i volanti e chi li ferma sono i due lati della scelta
  if (!Object.values(TRUPPE).some(t => t.vola)) g.push('nessuno vola')
  if (!Object.values(TRUPPE).some(t => t.bers === 'tutti' && !t.vola)) g.push('nessuno da terra ferisce chi vola')
  for (const op of OPERAZIONI) if (!Object.values(TRUPPE).some(t => t.op === op)) g.push(`nessuna truppa per ${op}`)
  if (!(BOMBA.ogni > 0 && BOMBA.max >= 1 && BOMBA.raggio > 0 && BOMBA.dmg > 0)) g.push('la bomba non sta in piedi')
  for (let l = 1; l < 30; l++) {
    if (!(CRESCITA.salita(l) > CRESCITA.salita(l - 1 || 1) - 1)) g.push(`salita ${l}`)
    if (!(CRESCITA.castello.prezzo(l) > 0)) g.push(`castello ${l}`)
    if (!(CRESCITA.miniera.prezzo(l) > CRESCITA.miniera.prezzo(l - 1))) g.push(`miniera ${l}`)
  }
  if (POSTI.length < Object.keys(EDIFICI).length) g.push('meno posti che edifici')
  return g
}
