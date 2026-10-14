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

/* I posti delle caserme sulla metà di sotto; sopra sono specchiati in y. Quattro, fissi e
   sempre visibili (una base stabile, come le piazzole del castello a torri), fra la porta del
   ponte e il castello: chi assedia li trova prima del castello. Lo ordina il motore: prima il
   lato con meno caserme, e dentro il lato il posto più al sicuro (più lontano dal fiume). */
export const POSTI = [[88, 440], [272, 440], [102, 372], [258, 372]]

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
  golem:       { nome: 'Golem',       op: '×', costo: 14, n: 1, hp: 1300, dmg: 95,   rate: 2.0, vel: 22, gitt: 16, bers: 'torri', vola: false, splash: 0,
                 nota: 'Lentissimo e resistente: va dritto alle costruzioni e ignora le truppe.' },
  drago:       { nome: 'Drago',       op: '÷', costo: 14, n: 1, hp: 170,  dmg: 22,   rate: 1.2, vel: 50, gitt: 42, bers: 'tutti', vola: true,  splash: 13,
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
   Spara lontano (`gitt`) perché dal bordo deve coprire la porta in fondo al ponte. */
export const CASTELLO = { nome: 'Castello', hp: 4000, dmg: 52,   rate: 0.75, gitt: 215, r: 30 }
export const LIV_MAX = 10              // caserme e torretta
export const MINIERA_MAX = 6

/* Tutto quello che cresce con il livello. */
export const CRESCITA = {
  squadraOgni: liv => 9 / (1 + 0.12 * (liv - 1)),          // secondi fra due squadre di una caserma
  forza: liv => 1 + 0.25 * (liv - 1),                      // vita e danno delle sue truppe
  vitaCaserma: liv => 700 + 120 * (liv - 1),             // il primo bersaglio dell'assedio: deve reggere
  omini: (liv, n) => Math.round(Math.floor((liv - 1) / 2) * n / 4),   // truppe in più per squadra: crescono ogni due livelli, in proporzione alla squadra
  salita: liv => Math.round(6 * 1.28 ** (liv - 1)),        // costo di liv → liv+1 per una caserma: 6, 8, 10, 13, 16, 21, 27, 34, 44
  castello: {
    prezzo: liv => Math.round(8 * 1.3 ** (liv - 1)),       // 8, 10, 14, 18, 23, 30, 39, 51, 66
    danno: liv => 1 + 0.3 * (liv - 1),
    cadenza: liv => 1 + 0.08 * (liv - 1),
    gittata: liv => 4 * (liv - 1),
    vita: 300,                                             // per livello: massimo e punti subito
  },
  miniera: {
    prezzo: [0, 10, 16, 24, 34, 46],                       // prezzo[liv] = liv → liv+1
    resa: liv => 1 + 0.5 * (liv - 1),                      // moltiplica le monete al secondo: +50% per livello
  },
}

/* Le scelte che non sono caserme. `op` decide il tipo di calcolo. */
export const AZIONI = {
  miniera:  { nome: 'Più monete', op: '×', prezzo: null,
              nota: 'Le monete arrivano il 50% più in fretta per ogni livello, per sempre. Costa ora, rende dopo.' },
  ripara:   { nome: 'Ripara',     op: '+', prezzo: 6,
              nota: 'Rimette in sesto la costruzione messa peggio (anche il muro, anche crollato): +40% di vita.' },
  castello: { nome: 'Castello',   op: '÷', prezzo: null,
              nota: 'Il castello spara più forte e più spesso, e resiste di più.' },
  bomba:    { nome: 'Bomba',      op: '÷', prezzo: 0,
              nota: 'Una bomba in regalo ogni tanto, per DIFENDERTI: scoppia dove le truppe nemiche arrivate nella tua metà sono più fitte, e le spazza via. Serve per ripartire quando ti schiacciano.' },
}
/* La bomba non si compra: si REGALA a intervalli, a tutti e due. È il «reset» per quando uno ha una
   forza schiacciante e va avanti per inerzia: una cosa da comprare non aiuta chi è già indietro (non
   ha le monete). Si usa con un calcolo, ma non costa monete. Spazza l'ammasso più fitto di truppe. */
export const BOMBA = { ogni: 40, max: 2, raggio: 95, dmg: 700 }

export const MURO = { hp: 1000, r: 26 }             // uno per parte, la porta in fondo al ponte: non si costruisce, si ripara
export const RIPARA = 0.4                            // la quota di vita che rimette
export const RIPOSO = 6                              // secondi di caserma ferma dopo un calcolo sbagliato
export const COSTRUZIONE = 6                         // secondi prima della prima squadra di una caserma nuova

/* Un nemico: quanto ricarica, quanto pensa, e come gioca. Una sfida ne sceglie
   uno e lo ritocca (`forza` per le sue truppe, `monete` per quelle di partenza). */
export const NEMICI = {
  calmo:   { moneteAlSecondo: 1 / 1.9,  pensa: 1.2, forza: 1 },
  normale: { moneteAlSecondo: 1 / 1.45, pensa: 1.2, forza: 1 },
  tosto:   { moneteAlSecondo: 1 / 1.1,  pensa: 1.2, forza: 1 },
}
export const GIOCATORE = { moneteAlSecondo: 1 / 1.2, iniziali: 14 }
export const DURATA = 180                            // secondi di partita se nessuno cade prima

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
  if (CRESCITA.miniera.prezzo.length !== MINIERA_MAX) g.push('i prezzi della miniera non coprono i livelli')
  if (!(BOMBA.ogni > 0 && BOMBA.max >= 1 && BOMBA.raggio > 0 && BOMBA.dmg > 0)) g.push('la bomba non sta in piedi')
  for (let l = 1; l < LIV_MAX; l++) {
    if (!(CRESCITA.salita(l) > 0)) g.push(`salita ${l}`)
    if (!(CRESCITA.castello.prezzo(l) > 0)) g.push(`castello ${l}`)
  }
  if (POSTI.length < Object.keys(EDIFICI).length) g.push('meno posti che edifici')
  return g
}
