/* ═══════════════════════════════════════════════════════════════════
   MISURE — lunghezze, pesi, capacità, e la stima del mondo vero.

   Un bambino sa fare 3 m → 300 cm come procedura, ma se gli chiedi
   quanto pesa un gatto risponde «40 kg» senza battere ciglio: gli
   manca l'unità di misura del mondo, non il calcolo. Per questo qui
   la STIMA (grado 2) conta quanto la conversione (grado 3): sapere
   che un chilo è mille grammi non serve a niente se non sai se un
   gatto pesa grammi, chili o quintali.

   CINQUE GRADI, e non sono un crescendo di un solo tipo di domanda:
     1. con che cosa si misura — la categoria giusta (cm o km? litri o
        chili?), prima ancora del numero;
     2. la stima — l'ordine di grandezza vero di una cosa reale;
     3. le conversioni facili — spostare la virgola sapendo perché;
     4. il confronto — due o tre misure in unità diverse, chi vince;
     5. i problemi corti — un conto vero con la conversione dentro.

   I FALSI SONO GLI ERRORI VERI di chi impara le misure: la virgola
   spostata di un posto, l'operazione fatta al contrario (3 m letti
   come 0,03 cm invece di 300 cm), il numero giusto con l'unità
   sbagliata perché ci si è dimenticati di convertire, il fattore 10
   scambiato per 100. Si vedono tutti nel generatore delle conversioni
   (`conversione`) — è lì che vale la pena guardare per capire lo
   stile del modulo.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, emoji } from '../nucleo/domanda.js'

/* ── le unità, dalla più piccola alla più grande ──
   L'ordine conta: è quello che usa `esprimi()` per scegliere l'unità
   più comoda, ed è la lista da cui pescano i distrattori «scala
   sbagliata». */
const UNITA = {
  lunghezza: ['mm', 'cm', 'm', 'km'],
  peso: ['g', 'kg', 'q', 't'],
  capacita: ['ml', 'cl', 'l'],
}

/* quanti «mm», «g» o «ml» (l'unità più piccola) vale un'unità */
const FATTORE_BASE = {
  lunghezza: { mm: 1, cm: 10, m: 1000, km: 1000000 },
  peso: { g: 1, kg: 1000, q: 100000, t: 1000000 },
  capacita: { ml: 1, cl: 10, l: 1000 },
}

const UNITA_BASE = { lunghezza: 'mm', peso: 'g', capacita: 'ml' }
const NOME_TIPO = { lunghezza: 'la lunghezza', peso: 'il peso', capacita: 'la capacità' }
const VERBO_STIMA = { lunghezza: 'misura', peso: 'pesa', capacita: 'contiene' }
const AGGETTIVO = { lunghezza: 'lungo', peso: 'pesante', capacita: 'capiente' }

/* a quale grandezza appartiene un'unità, per spiegare i falsi «categoria
   sbagliata» del grado 1 (es. i litri non sono la grandezza di un gatto) */
const TIPO_DI_UNITA = {}
for (const [t, us] of Object.entries(UNITA)) for (const u of us) TIPO_DI_UNITA[u] = t

/* ── gli oggetti veri, con la loro misura tipica ──
   Ogni voce controllata a mano: un gatto pesa 4 kg, una porta è alta
   2 m, un bicchiere tiene 200 ml. È la tabella da cui escono sia la
   domanda «con che cosa si misura» sia la stima. */
const OGGETTI = [
  // ── lunghezza ──
  // `agg` è l'aggettivo giusto per «quanto è ___»: lungo o alto non sono
  // intercambiabili (una porta è alta, non lunga) e devono concordare
  // con l'articolo del nome (una porta → alta, un nastro → lungo).
  { emoji: '🐜', nome: 'una formica', tipo: 'lunghezza', valore: 5, unita: 'mm', agg: 'lunga' },
  { emoji: '🍚', nome: 'un chicco di riso', tipo: 'lunghezza', valore: 6, unita: 'mm', agg: 'lungo' },
  { emoji: '✏️', nome: 'una matita', tipo: 'lunghezza', valore: 15, unita: 'cm', agg: 'lunga' },
  { emoji: '🍌', nome: 'una banana', tipo: 'lunghezza', valore: 18, unita: 'cm', agg: 'lunga' },
  { emoji: '👟', nome: 'una scarpa da bambino', tipo: 'lunghezza', valore: 20, unita: 'cm', agg: 'lunga' },
  { emoji: '📓', nome: 'un quaderno', tipo: 'lunghezza', valore: 24, unita: 'cm', agg: 'alto' },
  { emoji: '🚪', nome: 'una porta di casa', tipo: 'lunghezza', valore: 2, unita: 'm', agg: 'alta' },
  { emoji: '🦒', nome: 'una giraffa', tipo: 'lunghezza', valore: 5, unita: 'm', agg: 'alta' },
  { emoji: '🏊', nome: 'una piscina olimpionica', tipo: 'lunghezza', valore: 50, unita: 'm', agg: 'lunga' },
  { emoji: '⚽', nome: 'un campo da calcio', tipo: 'lunghezza', valore: 100, unita: 'm', agg: 'lungo' },
  { emoji: '🏃', nome: 'una maratona', tipo: 'lunghezza', valore: 42, unita: 'km', agg: 'lunga' },
  { emoji: '🚗', nome: 'un viaggio da Roma a Milano', tipo: 'lunghezza', valore: 600, unita: 'km', agg: 'lungo' },
  // ── peso ──
  { emoji: '🪶', nome: 'una piuma', tipo: 'peso', valore: 1, unita: 'g' },
  { emoji: '🪙', nome: 'una moneta', tipo: 'peso', valore: 5, unita: 'g' },
  { emoji: '🍎', nome: 'una mela', tipo: 'peso', valore: 150, unita: 'g' },
  { emoji: '🍞', nome: 'un pane', tipo: 'peso', valore: 500, unita: 'g' },
  { emoji: '🐈', nome: 'un gatto', tipo: 'peso', valore: 4, unita: 'kg' },
  { emoji: '🐕', nome: 'un cane', tipo: 'peso', valore: 15, unita: 'kg' },
  { emoji: '🧒', nome: 'un bambino di otto anni', tipo: 'peso', valore: 25, unita: 'kg' },
  { emoji: '🧑', nome: 'un adulto', tipo: 'peso', valore: 70, unita: 'kg' },
  { emoji: '🚙', nome: 'un\'automobile', tipo: 'peso', valore: 1, unita: 't' },
  { emoji: '🐘', nome: 'un elefante', tipo: 'peso', valore: 5, unita: 't' },
  // ── capacità ──
  { emoji: '🥄', nome: 'un cucchiaino', tipo: 'capacita', valore: 5, unita: 'ml' },
  { emoji: '🥛', nome: 'un bicchiere', tipo: 'capacita', valore: 200, unita: 'ml' },
  { emoji: '🥤', nome: 'una lattina di bibita', tipo: 'capacita', valore: 330, unita: 'ml' },
  { emoji: '☕', nome: 'una tazza di tè', tipo: 'capacita', valore: 250, unita: 'ml' },
  { emoji: '🧴', nome: 'una bottiglia d\'acqua', tipo: 'capacita', valore: 1.5, unita: 'l' },
  { emoji: '🪣', nome: 'un secchio', tipo: 'capacita', valore: 10, unita: 'l' },
  { emoji: '🛁', nome: 'una vasca da bagno', tipo: 'capacita', valore: 150, unita: 'l' },
  { emoji: '🐠', nome: 'un acquario da tavolo', tipo: 'capacita', valore: 20, unita: 'l' },
  { emoji: '🏊', nome: 'una piscina da giardino', tipo: 'capacita', valore: 1000, unita: 'l' },
]

/* ── le conversioni facili di ogni grandezza ──
   Un salto solo per grandezza (il gradino più insegnato a scuola):
   la variazione viene dal numero e dal verso, non da altre coppie. */
const CONVERSIONI = {
  lunghezza: [
    { du: 'm', a: 'cm', fattore: 100, aiuto: 'un metro sono cento centimetri: sposta la virgola di due posti' },
    { du: 'km', a: 'm', fattore: 1000, aiuto: 'un chilometro sono mille metri: sposta la virgola di tre posti' },
    { du: 'cm', a: 'mm', fattore: 10, aiuto: 'un centimetro sono dieci millimetri: sposta la virgola di un posto' },
  ],
  peso: [
    { du: 'kg', a: 'g', fattore: 1000, aiuto: 'un chilo sono mille grammi: sposta la virgola di tre posti' },
  ],
  capacita: [
    { du: 'l', a: 'ml', fattore: 1000, aiuto: 'un litro sono mille millilitri: sposta la virgola di tre posti' },
  ],
}

/* ═══════════ numeri e misure, scritti come si scrivono ═══════════ */

const arrotonda = (n, dec = 2) => Math.round(n * 10 ** dec) / 10 ** dec

/* niente 0.30000000000000004, e la virgola è quella italiana.
   Di solito bastano due decimali, ma il distrattore «operazione al
   contrario» (dividere quando si doveva moltiplicare) può produrre
   numeri piccoli come 0,004: con due decimali fissi sparirebbero in
   uno zero secco, che non insegna niente. Quattro decimali quando
   servono, comunque ripuliti degli zeri di coda. */
function formattaNumero(n) {
  const dec = Math.abs(n) > 0 && Math.abs(n) < 1 ? 4 : 2
  const s = arrotonda(n, dec).toFixed(dec).replace(/0+$/, '').replace(/\.$/, '')
  return s.replace('.', ',')
}
const formattaMisura = (v, u) => `${formattaNumero(v)} ${u}`
const capitalizza = s => s.charAt(0).toUpperCase() + s.slice(1)

/* il valore di una misura nell'unità più piccola della sua grandezza */
const inBase = (v, u, tipo) => arrotonda(v * FATTORE_BASE[tipo][u], 4)

/* la stessa misura, ma nell'unità più grande che resta almeno 1 —
   così 1200 g diventano 1,2 kg invece di restare grammi */
function esprimi(valoreBase, tipo) {
  let scelta = UNITA[tipo][0]
  for (const u of UNITA[tipo]) if (valoreBase / FATTORE_BASE[tipo][u] >= 1) scelta = u
  return { valore: arrotonda(valoreBase / FATTORE_BASE[tipo][scelta], 2), unita: scelta }
}

/* ═══════════ grado 1 — con che cosa si misura ═══════════ */
/* la domanda «con che cosa misuri X» da sola non basta: un secchio ha
   sia un'altezza sia una capacità, e senza dire quale delle due si
   chiede, cl, cm e l sono tutte risposte oneste. Ogni grandezza vuole
   il suo verbo — «quanto pesa», «quanta acqua ci sta», «quanto è
   lungo/alto» — che è anche quello che rende impossibile la domanda
   per l'altra categoria. */
const FRASE_UNITA = {
  lunghezza: ogg => `Con che cosa misuri quanto è ${ogg.agg} ${ogg.nome}?`,
  peso: ogg => `Con che cosa misuri quanto pesa ${ogg.nome}?`,
  capacita: ogg => `Con che cosa misuri quanta acqua ci sta in ${ogg.nome}?`,
}

function unita(sorte) {
  const ogg = sorte.uno(OGGETTI)
  const altraScala = sorte.uno(UNITA[ogg.tipo].filter(u => u !== ogg.unita)) || ogg.unita
  const altriTipi = Object.keys(UNITA).filter(t => t !== ogg.tipo)
  const altraCategoria = sorte.uno(UNITA[sorte.uno(altriTipi)])

  return domanda({
    testo: FRASE_UNITA[ogg.tipo](ogg),
    soggetto: emoji(ogg.emoji),
    buona: testo(ogg.unita),
    falsi: [
      testo(altraScala, `${capitalizza(ogg.nome)} si misura in ${ogg.unita}: ${altraScala} esiste ma è la scala sbagliata.`),
      testo(altraCategoria, `${altraCategoria} misura ${NOME_TIPO[TIPO_DI_UNITA[altraCategoria]]}, non ${NOME_TIPO[ogg.tipo]}: non è la grandezza giusta per ${ogg.nome}.`),
    ],
    chiave: 'mis:unita',
    aiuto: `${capitalizza(ogg.nome)} si misura in ${ogg.unita}.`,
    sorte,
  })
}

/* ═══════════ grado 2 — la stima ═══════════
   Stesso numero, unità diverse: è l'errore più comune e il più
   rivelatore — chi lo sbaglia non ha idea dell'ordine di grandezza. */
function stima(sorte) {
  const ogg = sorte.uno(OGGETTI)
  const altre = sorte.distrattori(UNITA[ogg.tipo], 2, u => u === ogg.unita)
  const giusta = formattaMisura(ogg.valore, ogg.unita)

  return domanda({
    testo: `Quanto ${VERBO_STIMA[ogg.tipo]}, circa, ${ogg.nome}?`,
    soggetto: emoji(ogg.emoji),
    buona: testo(giusta),
    falsi: altre.map(u => testo(formattaMisura(ogg.valore, u),
      `${capitalizza(ogg.nome)} ${VERBO_STIMA[ogg.tipo]} circa ${giusta}, non ${formattaMisura(ogg.valore, u)}: sono ordini di grandezza diversi.`)),
    chiave: 'mis:stima',
    aiuto: `${capitalizza(ogg.nome)} ${VERBO_STIMA[ogg.tipo]} circa ${giusta}.`,
    sorte,
  })
}

/* ═══════════ grado 3 — le conversioni facili ═══════════ */
function conversione(sorte, quale) {
  const tipo = quale || sorte.uno(Object.keys(CONVERSIONI))
  const coppia = sorte.uno(CONVERSIONI[tipo])
  const giu = sorte.forse(0.6) // du → a (il verso più intuitivo)
  const frazionario = sorte.forse(0.3)
  const k = frazionario ? sorte.uno([0.5, 1.5, 2.5, 3.5]) : sorte.fra(1, 9)

  const unitaDa = giu ? coppia.du : coppia.a
  const unitaA = giu ? coppia.a : coppia.du
  const valoreOriginale = giu ? k : arrotonda(k * coppia.fattore, 2)
  const giustoNumero = giu ? arrotonda(k * coppia.fattore, 2) : k
  const giustaStr = formattaMisura(giustoNumero, unitaA)

  const altraScala = sorte.uno(UNITA[tipo].filter(u => u !== unitaA && u !== unitaDa)) || unitaDa
  const versoSu = sorte.forse(0.5)
  const contrario = giu ? arrotonda(k / coppia.fattore, 4) : arrotonda(valoreOriginale * coppia.fattore, 2)

  const candidati = [
    { v: giustoNumero, u: altraScala,
      perche: `il numero è giusto ma l'unità no: la risposta va data in ${unitaA}, non in ${altraScala}.` },
    { v: arrotonda(versoSu ? giustoNumero * 10 : giustoNumero / 10, 4), u: unitaA,
      perche: 'la virgola è finita nel posto sbagliato: qui il salto è di questa grandezza, non di dieci volte tanto o di dieci volte meno.' },
    { v: contrario, u: unitaA,
      perche: 'l\'operazione è andata al contrario: quando l\'unità diventa più piccola il numero cresce, non si rimpicciolisce.' },
  ]

  const viste = new Set([giustaStr])
  const falsi = []
  for (const c of sorte.mescola(candidati)) {
    const s = formattaMisura(c.v, c.u)
    if (viste.has(s)) continue
    viste.add(s)
    falsi.push(testo(s, c.perche))
  }
  let extra = 1
  while (falsi.length < 2) {
    const s = formattaMisura(arrotonda(giustoNumero + extra, 2), unitaA)
    if (!viste.has(s)) { viste.add(s); falsi.push(testo(s, 'controlla il calcolo: non torna.')) }
    extra++
  }

  return domanda({
    testo: `${formattaMisura(valoreOriginale, unitaDa)} quanti ${unitaA} sono?`,
    buona: testo(giustaStr),
    falsi,
    chiave: `mis:conversione-${tipo}`,
    aiuto: coppia.aiuto,
    sorte,
  })
}

/* ═══════════ grado 4 — il confronto ═══════════ */

/* due misure in unità diverse, chi è più grande — con «sono uguali»
   come terza scelta: è la trappola vera, perché due misure scritte
   diverse possono valere lo stesso (150 cm e 1,5 m) */
function confrontoDue(sorte) {
  const tipo = sorte.uno(Object.keys(UNITA))
  const [duA, duB] = sorte.alcuni(UNITA[tipo], 2)
  const num = () => sorte.fra(1, 9) * (sorte.forse(0.3) ? 0.5 : 1)
  let valA = num(), valB = num()
  let baseA = inBase(valA, duA, tipo), baseB = inBase(valB, duB, tipo)
  if (baseA === baseB) { valB = arrotonda(valB + 1, 2); baseB = inBase(valB, duB, tipo) }

  const labelA = formattaMisura(valA, duA)
  const labelB = formattaMisura(valB, duB)
  const maggiore = baseA > baseB ? labelA : labelB
  const minore = baseA > baseB ? labelB : labelA
  const spiega = `${labelA} sono ${formattaNumero(baseA)} ${UNITA_BASE[tipo]}, ${labelB} sono ${formattaNumero(baseB)} ${UNITA_BASE[tipo]}.`

  return domanda({
    testo: `Chi è più ${AGGETTIVO[tipo]}: ${labelA} o ${labelB}?`,
    buona: testo(maggiore),
    falsi: [
      testo(minore, `${spiega} Guarda quale numero è più grande in questa unità.`),
      testo('Sono uguali', `Non sono uguali: ${spiega}`),
    ],
    chiave: 'mis:confronto',
    aiuto: 'converti tutte e due nella stessa unità, poi confronta i numeri.',
    sorte,
  })
}

/* tre misure in unità diverse, da mettere in ordine — la risposta è
   l'ordinamento giusto scritto per esteso, fra quello e due sbagliati */
function confrontoTre(sorte) {
  const tipo = sorte.uno(Object.keys(UNITA))
  const scelte = sorte.alcuni(UNITA[tipo], Math.min(3, UNITA[tipo].length))
  while (scelte.length < 3) scelte.push(sorte.uno(UNITA[tipo]))
  const num = () => sorte.fra(1, 9) * (sorte.forse(0.3) ? 0.5 : 1)

  const misure = scelte.map(u => {
    const v = num()
    return { v, u, base: inBase(v, u, tipo) }
  })
  // se due basi coincidono si sposta la seconda, per non avere un pari-merito
  for (let i = 1; i < misure.length; i++)
    for (let j = 0; j < i; j++)
      if (misure[i].base === misure[j].base) {
        misure[i].v = arrotonda(misure[i].v + 1, 2)
        misure[i].base = inBase(misure[i].v, misure[i].u, tipo)
      }
  for (const m of misure) m.label = formattaMisura(m.v, m.u)

  const [a, b, c] = misure
  const permutazioni = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]]
    .map(p => p.map(m => m.label).join(' < '))
  const buonaStr = [...misure].sort((x, y) => x.base - y.base).map(m => m.label).join(' < ')
  const sbagliate = sorte.mescola([...new Set(permutazioni.filter(p => p !== buonaStr))]).slice(0, 2)

  return domanda({
    testo: `Metti in ordine dal più piccolo al più grande: ${sorte.mescola(misure).map(m => m.label).join(', ')}`,
    buona: testo(buonaStr),
    falsi: sbagliate.map(s => testo(s, `L'ordine giusto è ${buonaStr}: converti tutto nella stessa unità per confrontare.`)),
    chiave: 'mis:confronto',
    aiuto: 'converti tutte le misure nella stessa unità, poi confronta i numeri.',
    sorte,
  })
}

/* ═══════════ grado 5 — i problemi corti ═══════════
   Cinque forme diverse, non una sola travestita da tanti numeri: due
   grandezze (capacità/lunghezza/peso) incrociate con due operazioni
   (quanto resta dopo aver tolto, quanto fa in tutto dopo aver
   moltiplicato) — chi gioca non può imparare uno schema solo e
   applicarlo a occhi chiusi. */

/* un contenitore grande, alcune porzioni tolte: quanto resta */
function problemaRestaCapacita(sorte) {
  const grandeL = sorte.uno([1, 1.5, 2, 2.5])
  const piccoloMl = sorte.uno([200, 250, 330])
  const n = sorte.fra(2, 4)
  const totMl = grandeL * 1000
  let restoMl = totMl - n * piccoloMl
  let nUsato = n
  if (restoMl <= 0) { nUsato = 1; restoMl = totMl - piccoloMl }

  const buonaObj = esprimi(restoMl, 'capacita')
  const buonaStr = formattaMisura(buonaObj.valore, buonaObj.unita)

  const f1 = esprimi(totMl - piccoloMl, 'capacita') // dimentica di moltiplicare per n
  const f2 = esprimi(totMl + nUsato * piccoloMl, 'capacita') // somma invece di sottrarre
  const f3valore = buonaObj.unita === 'l' ? arrotonda(restoMl / 100, 2) : arrotonda(restoMl * 10, 2)

  const candidati = [
    { s: formattaMisura(f1.valore, f1.unita), perche: `Hai tolto un solo bicchiere: sono ${nUsato}, non uno.` },
    { s: formattaMisura(f2.valore, f2.unita), perche: 'Qui si toglie, non si aggiunge: il resto è quello che avanza.' },
    { s: formattaMisura(f3valore, buonaObj.unita), perche: 'La conversione è sbagliata: un litro sono mille millilitri, non cento.' },
  ]
  const viste = new Set([buonaStr])
  const falsi = []
  for (const c of candidati) { if (!viste.has(c.s)) { viste.add(c.s); falsi.push(testo(c.s, c.perche)) } }

  const bicchieri = nUsato > 1 ? `${nUsato} bicchieri da ${piccoloMl} ml l'uno` : `un bicchiere da ${piccoloMl} ml`
  return domanda({
    testo: `Hai una bottiglia da ${formattaNumero(grandeL)} l e versi ${bicchieri}: quanta acqua resta?`,
    buona: testo(buonaStr),
    falsi,
    chiave: 'mis:problema',
    aiuto: 'porta tutto in millilitri, sottrai, e poi riconverti se serve.',
    sorte,
  })
}

/* un nastro, un pezzo tagliato via: quanto resta — stessa domanda
   della bottiglia, ma sottrazione di lunghezza invece che di capacità */
function problemaRestaLunghezza(sorte) {
  const totM = sorte.uno([1, 1.5, 2, 2.5, 3, 4])
  const tagliCm = sorte.uno([20, 25, 40, 50, 75, 100])
  const n = sorte.fra(1, 3)
  // `esprimi()` vuole il valore nell'unità più piccola della grandezza
  // (mm per la lunghezza, non cm): lavorare in cm e passarlo diretto
  // era il bug che faceva uscire «0,1 m» invece di «1 m».
  const totMm = totM * 1000
  const tagliMm = tagliCm * 10
  let restoMm = totMm - n * tagliMm
  let nUsato = n
  if (restoMm <= 0) { nUsato = 1; restoMm = totMm - tagliMm }

  const buonaObj = esprimi(restoMm, 'lunghezza')
  const buonaStr = formattaMisura(buonaObj.valore, buonaObj.unita)

  const f1 = esprimi(totMm - tagliMm, 'lunghezza') // dimentica gli altri tagli
  const f2 = esprimi(totMm + nUsato * tagliMm, 'lunghezza') // somma invece di sottrarre
  const f3valore = buonaObj.unita === 'm' ? arrotonda(restoMm / 100, 2) : arrotonda(restoMm * 10, 2)

  const candidati = [
    { s: formattaMisura(f1.valore, f1.unita), perche: `Hai tagliato un solo pezzo: sono ${nUsato}, non uno.` },
    { s: formattaMisura(f2.valore, f2.unita), perche: 'Qui si taglia via, non si aggiunge: il resto è quello che avanza.' },
    { s: formattaMisura(f3valore, buonaObj.unita), perche: 'La conversione è sbagliata: un metro sono cento centimetri, non dieci.' },
  ]
  const viste = new Set([buonaStr])
  const falsi = []
  for (const c of candidati) { if (!viste.has(c.s)) { viste.add(c.s); falsi.push(testo(c.s, c.perche)) } }

  const tagli = nUsato > 1 ? `${nUsato} pezzi da ${tagliCm} cm l'uno` : `${tagliCm} cm`
  return domanda({
    testo: `Hai un nastro lungo ${formattaNumero(totM)} m: ne tagli ${tagli}. Quanto ne resta?`,
    buona: testo(buonaStr),
    falsi,
    chiave: 'mis:problema',
    aiuto: 'porta tutto in centimetri, sottrai, e poi riconverti se serve.',
    sorte,
  })
}

/* un sacco, una parte usata: quanto resta — la stessa sottrazione, in peso */
function problemaRestaPeso(sorte) {
  const totKg = sorte.uno([1, 1.5, 2, 2.5, 3])
  const usoG = sorte.uno([200, 250, 300, 400, 500])
  const n = sorte.fra(1, 3)
  const totG = totKg * 1000
  let restoG = totG - n * usoG
  let nUsato = n
  if (restoG <= 0) { nUsato = 1; restoG = totG - usoG }

  const buonaObj = esprimi(restoG, 'peso')
  const buonaStr = formattaMisura(buonaObj.valore, buonaObj.unita)

  const f1 = esprimi(totG - usoG, 'peso') // dimentica le altre volte
  const f2 = esprimi(totG + nUsato * usoG, 'peso') // somma invece di sottrarre
  const f3valore = buonaObj.unita === 'kg' ? arrotonda(restoG / 100, 2) : arrotonda(restoG * 10, 2)

  const candidati = [
    { s: formattaMisura(f1.valore, f1.unita), perche: `Hai tolto una sola volta: sono ${nUsato}, non una.` },
    { s: formattaMisura(f2.valore, f2.unita), perche: 'Qui si toglie, non si aggiunge: il resto è quello che avanza.' },
    { s: formattaMisura(f3valore, buonaObj.unita), perche: 'La conversione è sbagliata: un chilo sono mille grammi, non cento.' },
  ]
  const viste = new Set([buonaStr])
  const falsi = []
  for (const c of candidati) { if (!viste.has(c.s)) { viste.add(c.s); falsi.push(testo(c.s, c.perche)) } }

  const volte = nUsato > 1 ? `${nUsato} volte ${usoG} g` : `${usoG} g`
  return domanda({
    testo: `Hai un sacco di riso da ${formattaNumero(totKg)} kg: ne usi ${volte} per la ricetta. Quanto ne resta?`,
    buona: testo(buonaStr),
    falsi,
    chiave: 'mis:problema',
    aiuto: 'porta tutto in grammi, sottrai, e poi riconverti se serve.',
    sorte,
  })
}

/* tante copie uguali: quanto pesano o sono lunghe in tutto */
function problemaTotale(sorte) {
  const peso = sorte.forse(0.5)
  const pezzo = peso ? sorte.uno([200, 250, 300, 400, 500, 600]) : sorte.uno([25, 50, 75, 100])
  const n = sorte.fra(2, 6)
  const tot = pezzo * n
  const unitaFinale = peso ? 'kg' : 'm'
  const fattore = peso ? 1000 : 100 // g→kg è mille, cm→m è cento: non sono lo stesso salto
  const buonaValore = arrotonda(tot / fattore, 2)
  const buonaStr = formattaMisura(buonaValore, unitaFinale)

  const dimenticato = formattaMisura(tot, unitaFinale) // numero giusto, unità sbagliata
  const fattoreSbagliato = formattaMisura(arrotonda(tot / (fattore / 10), 2), unitaFinale) // un ordine di grandezza in meno
  const nSbagliato = n > 2 ? n - 1 : n + 1
  const contoSbagliato = formattaMisura(arrotonda((pezzo * nSbagliato) / fattore, 2), unitaFinale)
  const perecheFattore = peso
    ? 'Si divide per mille, non per cento: mille grammi fanno un chilo.'
    : 'Si divide per cento, non per dieci: cento centimetri fanno un metro.'

  const candidati = [
    { s: dimenticato, perche: `Ti sei dimenticato di convertire: ${tot} ${peso ? 'g' : 'cm'} non sono ${tot} ${unitaFinale}.` },
    { s: fattoreSbagliato, perche: perecheFattore },
    { s: contoSbagliato, perche: `Sono ${n} pezzi, non ${nSbagliato}: contali di nuovo.` },
  ]
  const viste = new Set([buonaStr])
  const falsi = []
  for (const c of candidati) { if (!viste.has(c.s)) { viste.add(c.s); falsi.push(testo(c.s, c.perche)) } }

  const testoDomanda = peso
    ? `${n} pacchi da ${pezzo} g: quanti kg pesano in tutto?`
    : `${n} nastri da ${pezzo} cm: quanto sono lunghi in tutto, in metri?`

  return domanda({
    testo: testoDomanda,
    buona: testo(buonaStr),
    falsi,
    chiave: 'mis:problema',
    aiuto: 'moltiplica prima, converti dopo.',
    sorte,
  })
}

/* i cinque modi di chiedere un problema corto, pescati con pari
   probabilità: senza questo elenco esplicito il grado 5 rischia di
   somigliare sempre alla stessa bottiglia coi bicchieri, cambiati solo
   i numeri — e dopo tre partite si applica lo schema senza leggere */
const PROBLEMI = [problemaRestaCapacita, problemaTotale, problemaRestaLunghezza, problemaRestaPeso]

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  'con che cosa si misura',
  'la stima',
  'le conversioni facili',
  'il confronto',
  'i problemi corti',
]

/* Le tipologie. Le tre conversioni sono separate perché a scuola si
   fanno in momenti diversi — i metri prima, i litri e i grammi dopo — e
   perché sono tre tabelle diverse da ricordare: chi sa che un metro è
   cento centimetri non per questo sa quanti millilitri stanno in un
   litro. Tutto il modulo vuole `misure`; dalle conversioni in su serve
   anche saper spostare la virgola. */
const TIPI = [
  { chiave: 'mis:unita', nome: 'Con che cosa si misura', sa: 'misure', gradi: { 1: 1 } },
  { chiave: 'mis:stima', nome: 'Quanto è grande davvero', sa: 'misure', gradi: { 2: 1 } },
  { chiave: 'mis:conversione-lunghezza', nome: 'Convertire le lunghezze (km, m, cm)', sa: ['misure', 'conversioni'], gradi: { 3: 0.34 } },
  { chiave: 'mis:conversione-capacita', nome: 'Convertire le capacità (l, cl, ml)', sa: ['misure', 'conversioni'], gradi: { 3: 0.33 } },
  { chiave: 'mis:conversione-peso', nome: 'Convertire i pesi (kg, g)', sa: ['misure', 'conversioni'], gradi: { 3: 0.33 } },
  { chiave: 'mis:confronto', nome: 'Quale misura è più grande', sa: ['misure', 'conversioni'], gradi: { 4: 1 } },
  { chiave: 'mis:problema', nome: 'I problemi con le misure', sa: ['misure', 'conversioni'], gradi: { 5: 1 } },
]

class Misure extends Modulo {
  constructor() {
    super({
      id: 'misure',
      nome: 'Misure',
      icona: '📏',
      materia: 'matematica',
      chiaro: 'lunghezze, pesi, capacità: con che cosa si misurano e quanto valgono davvero',
      scaletta: SCALETTA,
      /* QUANTO È COMPLICATO OGNI GRADO, da 0 a 100 — la scala è una
         sola per tutte le materie, e serve a confrontare questa riga
         con quelle di tutti gli altri moduli. Zero è il primo giorno
         di materna, cento la fine della primaria: dodici punti e mezzo
         per anno di scuola. Non dice a chi arriva — quello lo decide
         la finestra dell'età di chi gioca (`nucleo/classi.js`). */
      livelli: [38, 56, 63, 75, 81],
      /* Tutto questo modulo dà per scontato che un litro e un chilo
         vogliano dire qualcosa; dalle conversioni in su serve anche
         saper spostare la virgola. Chi non l'ha ancora fatto a scuola
         non sbaglia queste domande: le tira a indovinare. */
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    if (tipo?.startsWith('mis:conversione-'))
      return conversione(sorte, tipo.slice('mis:conversione-'.length))
    switch (tipo) {
      case 'mis:stima': return stima(sorte)
      case 'mis:confronto': return sorte.forse(0.55) ? confrontoDue(sorte) : confrontoTre(sorte)
      case 'mis:problema': return sorte.uno(PROBLEMI)(sorte)
      default: return unita(sorte)
    }
  }
}

export default new Misure()
