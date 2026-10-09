// La taratura: tutti i numeri del gioco in un posto solo. Il motore non
// ne ha di suoi — chi vuole un gioco più gentile cambia una riga qui e
// rilancia il banco di prova. Le tre leve in fondo (nascite, vita,
// fretta) sono funzioni del tempo; una tappa le moltiplica per i propri
// `ritmo`, `vigore`, `fretta` (dati/campagna.js). Il perché dei numeri:
// docs/survivors/taratura.md.

export const CFG = {
  velocitaEroe: 152,        // pixel al secondo, prima degli stivali
  raggioEroe: 15,
  cuoriIniziali: 3,
  invulnerabilita: 1.7,     // secondi di lampeggio dopo un colpo preso

  cadenza: 0.50,            // secondi fra un tiro e l'altro: tira piano apposta
  gittata: 275,
  velocitaFreccia: 430,
  apertura: 0.16,           // quanto si aprono a ventaglio le frecce in più

  // una gemma si prende a contatto (raggioEroe + 12, in muoviGemme); la
  // calamita c'è solo con la carta omonima (`magnete` in mazzo.js). Le
  // copie si alternano: le dispari allargano il raggio (`prima`, poi
  // `inPiu` alla volta), le pari tirano più forte (`forza` in più alla
  // volta). Resta sempre più piccola di quella trovata a terra
  calamita: { prima: 70, inPiu: 55, forza: 0.5 },

  // i capi: ogni tanto un mostro molto più grosso e duro, col suo alone e
  // la corona. Il primo a `da` della tappa, poi uno ogni `ogni` secondi;
  // `taglia` moltiplica il raggio, `vita` la vita, `passo` la velocità,
  // `massa` quanto poco lo spostano le botte, `gelo` quanto meno del suo
  // peso lo rallenta il freddo; morendo lascia `gemme` gemme e un oggetto
  capo: { da: 0.4, ogni: 45, taglia: 2.4, vita: 14, passo: 0.8, massa: 12, gelo: 2, gemme: 6 },

  // gli oggetti a terra (dati/oggetti.js): compaiono a tempo, sempre
  // dentro lo schermo ma mai sotto i piedi (vicino..lontano, in pixel),
  // restano `durata` secondi e poi svaniscono
  oggetti: {
    primo: 7,                                   // secondi prima del primo
    ogni: m => Math.max(7, 15 - 3 * Math.max(0, m)),
    durata: 9,
    massimo: 5,                                 // in campo nello stesso momento
    vicino: 140, lontano: 260,
    grosso: 5,                                  // vita base da cui un mostro è «grosso»
    daiGrossi: 0.3,                             // quante volte su cento ne lascia uno
    // la cassa ha un tetto a parte (un conto, non un peso): mai nei
    // primi `primaDi` secondi, mai due in campo, non più di una ogni
    // `ogni` secondi — vedi docs/survivors/taratura.md
    cassa: { primaDi: 10, ogni: 45 },
  },

  // la bomba: si guadagna ogni `ogniLivelli` livelli, e di rado compare
  // a terra per conto suo (la prima dopo `prima` secondi, poi ogni
  // `ogni`); se ne tengono al massimo `tasca`, e lanciata toglie di mezzo
  // tutti i mostri entro `raggio` (i grossi compresi); fino a `onda`
  // volte il raggio li spinge via e basta
  bomba: { raggio: 220, tasca: 3, onda: 1.7, prima: 30, ogni: 60, ogniLivelli: 3 },

  // i muri: una fila di mostri deboli attraversa lo schermo da un lato a
  // caso, con un varco; con la marea arrivano più spesso, mai a raffica
  muro: {
    primo: 12,                                  // secondi prima del primo
    ogni: m => Math.max(7, 20 - 5 * Math.max(0, m)),
    passo: 44,                                  // fra un mostro e l'altro nella fila
    varco: 130,                                 // il buco, in pixel
  },

  // il tetto della folla sale col tempo: con un tetto fisso la partita
  // si decide appena l'arco supera le nascite — vedi docs/survivors/taratura.md
  maxNemici: m => Math.min(380, 60 + 150 * Math.max(0, m)),

  // la stazza: quanto la marea ha impastato i mostri (non la mole del
  // singolo). Dentro le nove tappe vale 1 e non cambia niente; oltre il
  // traguardo sale senza tetto — vedi docs/survivors/taratura.md
  stazza: mult => Math.max(1, Math.pow(Math.max(1, mult) / 5, 0.85)),

  // quanti nascono davanti a chi corre, e dentro che apertura: senza,
  // si vince scappando sempre dalla stessa parte
  nasconoAvanti: 0.42,
  aperturaNascita: 1.15,    // radianti a destra e a sinistra della corsa
  // chi resta indietro non sparisce (si toglie solo oltre tre
  // schermate): il codazzo di chi non hai ucciso è il conto che
  // presenta il gioco
  troppoLontano: 3.0,       // in schermate

  // il ritmo: `q` è la quota di tappa passata (0..1). Dentro la tappa
  // sale in linea retta; oltre il traguardo si moltiplica — vedi
  // docs/survivors/taratura.md
  // il riscaldamento: nei primi `secondi` di ogni partita nascono meno
  // mostri (da `nascite` a 1) e più lenti (da `fretta` a 1), perché
  // senza carte un colpo preso costa un cuore su tre — vedi docs/survivors/taratura.md
  avvio: { secondi: 30, nascite: 0.5, fretta: 0.65 },
  natePerSecondo: q => q <= 1 ? 1.2 + 2.8 * Math.max(0, q) : 4 * Math.pow(2.3, q - 1),
  vitaNemico: q => q <= 1 ? 1 + 1.35 * Math.max(0, q) : 2.35 * Math.pow(2.9, q - 1),
  frettaNemico: q => 1 + 0.35 * Math.min(q, 1) + 0.2 * Math.max(0, q - 1),

  // quanto dura una tappa «tipo»: l'orologio del gioco libero, e di chi
  // resta in campo dopo aver vinto
  tappaTipo: 175,

  // dove si va a finire oltre il traguardo: le leve della tappa si
  // spengono piano e lasciano il posto a queste, uguali per tutti
  oltre: { ritmo: 1.25, vigore: 1.95, fretta: 1.06 },
}

// quanta esperienza serve dal livello `l` al successivo: cresce col
// quadrato (i primi arrivano subito, gli ultimi si sudano). Il perché
// dei coefficienti: docs/survivors/taratura.md.
export const soglia = l => Math.round(2 + 0.6 * l + 0.08 * l * l)

// quante stelle vale una tappa: si contano le ferite, non i cuori
// rimasti (le carte cambiano i cuori massimi)
export const STELLE = [
  { ferite: 0, stelle: 3 },
  { ferite: 2, stelle: 2 },
  { ferite: Infinity, stelle: 1 },
]

export const stellePerFerite = ferite =>
  (STELLE.find(s => ferite <= s.ferite) || { stelle: 1 }).stelle

export function guastiDellaTaratura(cfg = CFG) {
  const guasti = []
  const positivi = ['velocitaEroe', 'raggioEroe', 'cuoriIniziali', 'invulnerabilita',
                    'cadenza', 'gittata', 'velocitaFreccia']
  for (const k of positivi)
    if (!(cfg[k] > 0)) guasti.push(`CFG.${k} vale ${cfg[k]}`)

  const cal = cfg.calamita || {}
  if (!(cal.prima > cfg.raggioEroe + 12 && cal.prima <= 80))
    guasti.push(`la prima Calamita tira da ${cal.prima} pixel: o non si sente o è già il gioco da fermi`)
  if (!(cal.inPiu >= 20 && cal.inPiu <= 60))
    guasti.push(`ogni copia di Calamita in più allarga di ${cal.inPiu} pixel`)
  // le copie si alternano: a cinque, tre hanno allargato il raggio
  if (!(cal.prima + 2 * cal.inPiu <= 200))
    guasti.push(`a cinque copie la Calamita tira da ${cal.prima + 2 * cal.inPiu} pixel: più di mezzo schermo`)

  if (!(cfg.velocitaFreccia > cfg.velocitaEroe))
    guasti.push('le frecce non sono più veloci dell\'eroe')
  if (!(cfg.gittata > 120)) guasti.push(`gittata ${cfg.gittata}: troppo corta per vedere l'effetto`)

  for (const q of [0, 0.5, 1]) {
    if (!(cfg.natePerSecondo(q) > 0)) guasti.push(`natePerSecondo(${q}) non è positiva`)
    if (!(cfg.vitaNemico(q) >= 1)) guasti.push(`vitaNemico(${q}) è sotto 1`)
    if (!(cfg.frettaNemico(q) >= 1)) guasti.push(`frettaNemico(${q}) è sotto 1`)
  }
  if (!(cfg.natePerSecondo(1) > cfg.natePerSecondo(0)))
    guasti.push('i mostri non diventano più fitti col passare del tempo')
  if (!(cfg.vitaNemico(1) > cfg.vitaNemico(0)))
    guasti.push('i mostri non diventano più duri col passare del tempo')

  const av = cfg.avvio || {}
  if (!(av.secondi >= 10 && av.secondi <= 45))
    guasti.push(`il riscaldamento dura ${av.secondi} secondi: o non si sente o è la prima tappa intera`)
  if (!(av.nascite > 0 && av.nascite <= 1 && av.fretta >= 0.5 && av.fretta <= 1))
    guasti.push(`il riscaldamento parte da ${av.nascite} nascite e ${av.fretta} di fretta`)

  if (!(cfg.maxNemici(0) >= 40)) guasti.push(`il campo comincia con ${cfg.maxNemici(0)} posti`)
  if (!(cfg.maxNemici(2) > cfg.maxNemici(0.5)))
    guasti.push('il tetto della folla non sale col tempo')
  if (!(cfg.maxNemici(50) <= 400))
    guasti.push(`a partita lunghissima il campo tiene ${cfg.maxNemici(50)} mostri: un telefono non li disegna`)

  for (const [k, quanto] of [['natePerSecondo', 1], ['vitaNemico', 0.5], ['frettaNemico', 0.05]]) {
    if (!(cfg[k](3) - cfg[k](2) >= quanto * 0.5))
      guasti.push(`${k} si appiattisce dopo il traguardo: da q=2 a q=3 sale di ${(cfg[k](3) - cfg[k](2)).toFixed(2)}`)
    if (!(cfg[k](10) > cfg[k](3)))
      guasti.push(`${k} ha un tetto: a q=10 vale come a q=3`)
  }
  // la vita deve essere la leva più ripida (cento mostri molli si
  // spazzano con una magia, dieci mostri duri no) ma non triplicare
  // in una tappa tipo, o si passa dal star bene al morire senza aver
  // visto arrivare niente
  for (const q of [1.5, 3, 6]) {
    const raddoppio = cfg.vitaNemico(q + 1) / cfg.vitaNemico(q)
    if (!(raddoppio <= 3))
      guasti.push(`la vita si moltiplica per ${raddoppio.toFixed(2)} in una tappa tipo (a q=${q}): ` +
                  'travolge invece di far perdere terreno')
  }
  if (!(cfg.vitaNemico(4) / cfg.vitaNemico(2) > cfg.natePerSecondo(4) / cfg.natePerSecondo(2)))
    guasti.push('dopo il traguardo la vita non cresce più della folla: la ghigliottina non taglia')

  // dentro la campagna la stazza deve valere 1 (le tappe sono tarate
  // così); oltre, deve salire senza tetto
  if (cfg.stazza(cfg.vitaNemico(1) * 2.1) !== 1)
    guasti.push('la stazza si sente già dentro la campagna')
  if (!(cfg.stazza(cfg.vitaNemico(4)) > 2))
    guasti.push(`oltre il traguardo i mostri pesano ${cfg.stazza(cfg.vitaNemico(4)).toFixed(2)}: le botte li spazzano ancora`)
  if (!(cfg.stazza(cfg.vitaNemico(9)) > cfg.stazza(cfg.vitaNemico(6))))
    guasti.push('la stazza ha un tetto')

  const o = cfg.oggetti || {}
  if (!(o.vicino >= 100 && o.lontano > o.vicino && o.lontano <= 280))
    guasti.push(`gli oggetti compaiono fra ${o.vicino} e ${o.lontano} pixel: o sotto i piedi o fuori dallo schermo`)
  if (!(o.durata >= 6 && o.durata <= 15))
    guasti.push(`un oggetto resta a terra ${o.durata} secondi: o non si arriva o non svanisce mai`)
  if (!(o.ogni?.(0) > 0 && o.ogni(3) < o.ogni(0) && o.ogni(50) >= 5))
    guasti.push('gli oggetti non arrivano più spesso con la marea, o arrivano a raffica')
  if (!(o.massimo >= 2 && o.massimo <= 8)) guasti.push(`al massimo ${o.massimo} oggetti in campo`)
  if (!(o.daiGrossi > 0 && o.daiGrossi <= 0.6)) guasti.push(`i grossi lasciano un oggetto ${o.daiGrossi} volte`)
  const ca = o.cassa || {}
  if (!(ca.primaDi >= 8 && ca.primaDi <= 20))
    guasti.push(`la prima cassa può uscire dopo ${ca.primaDi} secondi`)
  if (!(ca.ogni >= 40 && ca.ogni <= 60))
    guasti.push(`una cassa ogni ${ca.ogni} secondi: o troppo fitte o non si vedono mai`)

  const mu = cfg.muro || {}
  if (!(mu.varco >= cfg.raggioEroe * 4 && mu.varco <= 180))
    guasti.push(`il varco del muro è largo ${mu.varco} pixel`)
  if (!(mu.passo >= 30 && mu.passo < mu.varco))
    guasti.push(`la fila del muro ha un passo di ${mu.passo} pixel`)
  if (!(mu.primo >= 8 && mu.ogni?.(0) > 0 && mu.ogni(3) < mu.ogni(0) && mu.ogni(50) >= 5))
    guasti.push('i muri non arrivano più spesso con la marea, o arrivano a raffica')

  for (let l = 1; l < 20; l++)
    if (!(soglia(l + 1) > soglia(l))) { guasti.push(`la soglia del livello ${l + 1} non sale`); break }

  if (stellePerFerite(0) !== 3) guasti.push('senza ferite non si prendono tre stelle')
  if (stellePerFerite(99) !== 1) guasti.push('sopravvivere conciati male non vale una stella')
  return guasti
}
