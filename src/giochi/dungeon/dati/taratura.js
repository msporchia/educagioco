// Le manopole dell'equilibrio, tutte qui (non nel castello, sparse in cinque
// file): chi le tocca rilancia il banco (motore/banco.js). ATTESE è la parte
// che conta: le soglie non si abbassano per far passare il test.
export const TARATURA = {
  // ricchezza × (base + fondo × profondità), ballerino intorno. Base bassa
  // apposta: con le discese triplicate, i numeri di prima svuotavano la vetrina al secondo mercante
  bottino: { base: 3.4, fondo: 3, ballerino: 0.25 },

  // quanto spesso un mostro lascia equipaggiamento oltre alle gemme; il capo lo lascia sempre
  lascia: { mostro: 0.18, grosso: 0.6, scrigno: 0.65, capo: 1 },

  // cura in punti vita; l'allenamento vale un punto solo, o batterebbe qualunque arma trovata
  cura: 20,
  allenamento: 1,

  curaPrimaDelCapo: true,   // si arriva a un capo sempre interi, o prima è una lotteria

  // la frazione di vita rimasta (non punti fissi: la vita massima cresce con la campagna)
  stelle: [
    { restaAlmeno: 0.7, stelle: 3 },
    { restaAlmeno: 0.35, stelle: 2 },
    { restaAlmeno: 0, stelle: 1 },
  ],

  vista: 2,   // file visibili senza lanterna; il capo di piano si vede sempre
  mercantiPerPiano: 1,
}

export function bottinoDi(ricchezza, profondita, rnd = Math.random) {
  if (!ricchezza) return 0
  const { base, fondo, ballerino } = TARATURA.bottino
  const medio = ricchezza * (base + fondo * profondita)
  const scarto = 1 + (rnd() * 2 - 1) * ballerino
  return Math.max(1, Math.round(medio * scarto))
}

export function stellePerVita(rimasta, massima) {
  const q = massima > 0 ? Math.max(0, rimasta) / massima : 0
  return (TARATURA.stelle.find(s => q >= s.restaAlmeno) || { stelle: 1 }).stelle
}

// tre giocatori finti, tre soglie: perché la soglia del bambino è 0,6 e non
// 0,7, docs/dungeon/regole.md
export const ATTESE = [
  { chiave: 'sicuro', nome: 'chi risponde sempre giusto', bravura: 1, minimo: 0.95 },
  { chiave: 'bambino', nome: 'chi ne sbaglia una su quattro', bravura: 0.75, minimo: 0.6 },
  { chiave: 'a caso', nome: 'chi tira a indovinare', bravura: 0.3, massimo: 0.4 },
]

// il numero di domande è il RISULTATO (non l'input come nel castello): vedi
// docs/dungeon/regole.md. Se una tappa sfonda il massimo, la domanda giusta
// è «perché costa così» (di solito `lascia` o le ossa in mostri.js), non
// alzare il tetto. Il minimo conta più del massimo: sotto, è un corridoio.
export const DOMANDE = { minimo: 20, massimo: 130 }

export function guastiDellaTaratura(t = TARATURA, attese = ATTESE, domande = DOMANDE) {
  const guasti = []
  const { base, fondo, ballerino } = t.bottino || {}
  if (!(base > 0)) guasti.push(`bottino di partenza ${base}`)
  if (!(fondo >= 0)) guasti.push(`la crescita col fondo è ${fondo}`)
  if (!(ballerino >= 0 && ballerino < 1)) guasti.push(`il ballerino ${ballerino} è fuori scala`)
  if (!(t.cura >= 1)) guasti.push('un fuoco da campo che non cura niente non è un riposo')
  if (!(t.allenamento >= 1)) guasti.push('un allenamento che non allena niente non è una scelta')
  for (const [tipo, quanto] of Object.entries(t.lascia || {}))
    if (!(quanto >= 0 && quanto <= 1)) guasti.push(`lascia.${tipo} ${quanto} non è una frequenza`)
  // chi è più grosso deve lasciare più spesso, o "lascia roba migliore" promette e non mantiene
  if (!(t.lascia.capo >= t.lascia.grosso && t.lascia.grosso > t.lascia.mostro))
    guasti.push('un mostro piccolo lascia equipaggiamento spesso quanto uno grosso')
  if (!(t.vista >= 1)) guasti.push('senza vista non si sceglie niente: si cammina al buio')
  if (!(t.mercantiPerPiano >= 1)) guasti.push('senza mercanti le gemme sono un numero che sale')

  const s = t.stelle || []
  if (!s.length || s.at(-1).restaAlmeno !== 0) guasti.push('le stelle non coprono tutti i casi')
  for (let i = 1; i < s.length; i++)
    if (!(s[i].restaAlmeno < s[i - 1].restaAlmeno && s[i].stelle < s[i - 1].stelle))
      guasti.push('le stelle non scendono man mano che si arriva conciati male')

  for (let i = 1; i < attese.length; i++)
    if (!(attese[i].bravura < attese[i - 1].bravura))
      guasti.push('le attese non sono in ordine di bravura')
  if (!attese.some(a => a.massimo !== undefined))
    guasti.push('nessuna attesa dice chi NON deve farcela: il test non proverebbe niente')
  if (!attese.some(a => a.minimo !== undefined))
    guasti.push('nessuna attesa dice chi deve farcela')

  if (!(domande.minimo >= 15)) guasti.push('una discesa a tre piani che costa meno di quindici domande è un corridoio')
  if (!(domande.massimo > domande.minimo)) guasti.push('la forbice delle domande è chiusa')
  return guasti
}
