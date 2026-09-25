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
  { emoji: '💅', nome: 'un\'unghia', tipo: 'lunghezza', valore: 12, unita: 'mm', agg: 'lunga' },
  { emoji: '📎', nome: 'una graffetta', tipo: 'lunghezza', valore: 28, unita: 'mm', agg: 'lunga' },
  { emoji: '✏️', nome: 'una matita', tipo: 'lunghezza', valore: 15, unita: 'cm', agg: 'lunga' },
  { emoji: '🍌', nome: 'una banana', tipo: 'lunghezza', valore: 18, unita: 'cm', agg: 'lunga' },
  { emoji: '👟', nome: 'una scarpa da bambino', tipo: 'lunghezza', valore: 20, unita: 'cm', agg: 'lunga' },
  { emoji: '📓', nome: 'un quaderno', tipo: 'lunghezza', valore: 24, unita: 'cm', agg: 'alto' },
  { emoji: '🔑', nome: 'una chiave', tipo: 'lunghezza', valore: 5, unita: 'cm', agg: 'lunga' },
  { emoji: '🍴', nome: 'una forchetta', tipo: 'lunghezza', valore: 20, unita: 'cm', agg: 'lunga' },
  { emoji: '🖊️', nome: 'una penna', tipo: 'lunghezza', valore: 14, unita: 'cm', agg: 'lunga' },
  { emoji: '🎒', nome: 'uno zaino di scuola', tipo: 'lunghezza', valore: 45, unita: 'cm', agg: 'alto' },
  { emoji: '☂️', nome: 'un ombrello chiuso', tipo: 'lunghezza', valore: 60, unita: 'cm', agg: 'lungo' },
  { emoji: '🏓', nome: 'una racchetta da ping pong', tipo: 'lunghezza', valore: 25, unita: 'cm', agg: 'lunga' },
  { emoji: '🛹', nome: 'uno skateboard', tipo: 'lunghezza', valore: 80, unita: 'cm', agg: 'lungo' },
  { emoji: '🚪', nome: 'una porta di casa', tipo: 'lunghezza', valore: 2, unita: 'm', agg: 'alta' },
  { emoji: '🚲', nome: 'una bicicletta', tipo: 'lunghezza', valore: 1.7, unita: 'm', agg: 'lunga' },
  { emoji: '🚐', nome: 'un furgone', tipo: 'lunghezza', valore: 5, unita: 'm', agg: 'lungo' },
  { emoji: '🦒', nome: 'una giraffa', tipo: 'lunghezza', valore: 5, unita: 'm', agg: 'alta' },
  { emoji: '🏀', nome: 'un canestro da basket', tipo: 'lunghezza', valore: 3, unita: 'm', agg: 'alto' },
  { emoji: '⚽', nome: 'una porta da calcio', tipo: 'lunghezza', valore: 2.4, unita: 'm', agg: 'alta' },
  { emoji: '🏊', nome: 'una piscina olimpionica', tipo: 'lunghezza', valore: 50, unita: 'm', agg: 'lunga' },
  { emoji: '🚌', nome: 'un autobus', tipo: 'lunghezza', valore: 12, unita: 'm', agg: 'lungo' },
  { emoji: '⚽', nome: 'un campo da calcio', tipo: 'lunghezza', valore: 100, unita: 'm', agg: 'lungo' },
  { emoji: '✈️', nome: 'un aereo di linea', tipo: 'lunghezza', valore: 40, unita: 'm', agg: 'lungo' },
  { emoji: '🚢', nome: 'una nave da crociera', tipo: 'lunghezza', valore: 300, unita: 'm', agg: 'lunga' },
  { emoji: '🚶', nome: 'una passeggiata al parco', tipo: 'lunghezza', valore: 2, unita: 'km', agg: 'lunga' },
  { emoji: '🏫', nome: 'un tragitto casa-scuola', tipo: 'lunghezza', valore: 1, unita: 'km', agg: 'lungo' },
  { emoji: '🏃', nome: 'una maratona', tipo: 'lunghezza', valore: 42, unita: 'km', agg: 'lunga' },
  { emoji: '🚗', nome: 'un viaggio da Roma a Milano', tipo: 'lunghezza', valore: 600, unita: 'km', agg: 'lungo' },
  // ── peso ──
  { emoji: '🪶', nome: 'una piuma', tipo: 'peso', valore: 1, unita: 'g' },
  { emoji: '🪙', nome: 'una moneta', tipo: 'peso', valore: 5, unita: 'g' },
  { emoji: '🎾', nome: 'una pallina da tennis', tipo: 'peso', valore: 58, unita: 'g' },
  { emoji: '🍰', nome: 'una fetta di torta', tipo: 'peso', valore: 80, unita: 'g' },
  { emoji: '🍎', nome: 'una mela', tipo: 'peso', valore: 150, unita: 'g' },
  { emoji: '🍊', nome: 'un\'arancia', tipo: 'peso', valore: 200, unita: 'g' },
  { emoji: '📗', nome: 'un libro', tipo: 'peso', valore: 300, unita: 'g' },
  { emoji: '⚽', nome: 'un pallone da calcio', tipo: 'peso', valore: 450, unita: 'g' },
  { emoji: '🍞', nome: 'un pane', tipo: 'peso', valore: 500, unita: 'g' },
  { emoji: '🏀', nome: 'un pallone da basket', tipo: 'peso', valore: 600, unita: 'g' },
  { emoji: '🍚', nome: 'un pacco di riso', tipo: 'peso', valore: 1, unita: 'kg' },
  { emoji: '🎸', nome: 'una chitarra', tipo: 'peso', valore: 3, unita: 'kg' },
  { emoji: '🧳', nome: 'una valigia vuota', tipo: 'peso', valore: 3, unita: 'kg' },
  { emoji: '🐈', nome: 'un gatto', tipo: 'peso', valore: 4, unita: 'kg' },
  { emoji: '🎒', nome: 'uno zaino pieno di libri', tipo: 'peso', valore: 5, unita: 'kg' },
  { emoji: '🐕', nome: 'un cane', tipo: 'peso', valore: 15, unita: 'kg' },
  { emoji: '🎒', nome: 'uno zaino da montagna pieno', tipo: 'peso', valore: 12, unita: 'kg' },
  { emoji: '🧒', nome: 'un bambino di otto anni', tipo: 'peso', valore: 25, unita: 'kg' },
  { emoji: '🛋️', nome: 'un divano', tipo: 'peso', valore: 50, unita: 'kg' },
  { emoji: '🧳', nome: 'una valigia piena', tipo: 'peso', valore: 20, unita: 'kg' },
  { emoji: '🧑', nome: 'un adulto', tipo: 'peso', valore: 70, unita: 'kg' },
  { emoji: '🏍️', nome: 'una moto', tipo: 'peso', valore: 150, unita: 'kg' },
  { emoji: '🐴', nome: 'un cavallo', tipo: 'peso', valore: 500, unita: 'kg' },
  { emoji: '🚙', nome: 'un\'automobile', tipo: 'peso', valore: 1, unita: 't' },
  { emoji: '🦈', nome: 'uno squalo bianco', tipo: 'peso', valore: 1, unita: 't' },
  { emoji: '🐳', nome: 'una balena', tipo: 'peso', valore: 30, unita: 't' },
  { emoji: '🐘', nome: 'un elefante', tipo: 'peso', valore: 5, unita: 't' },
  // ── capacità ──
  { emoji: '🥄', nome: 'un cucchiaino', tipo: 'capacita', valore: 5, unita: 'ml' },
  { emoji: '🥄', nome: 'un cucchiaio', tipo: 'capacita', valore: 15, unita: 'ml' },
  { emoji: '☕', nome: 'una tazzina da caffè', tipo: 'capacita', valore: 60, unita: 'ml' },
  { emoji: '🥣', nome: 'un vasetto di yogurt', tipo: 'capacita', valore: 125, unita: 'ml' },
  { emoji: '🧃', nome: 'un tetrapak di succo', tipo: 'capacita', valore: 200, unita: 'ml' },
  { emoji: '🥛', nome: 'un bicchiere', tipo: 'capacita', valore: 200, unita: 'ml' },
  { emoji: '🍼', nome: 'un biberon', tipo: 'capacita', valore: 250, unita: 'ml' },
  { emoji: '☕', nome: 'una tazza di tè', tipo: 'capacita', valore: 250, unita: 'ml' },
  { emoji: '🥤', nome: 'una lattina di bibita', tipo: 'capacita', valore: 330, unita: 'ml' },
  { emoji: '🧴', nome: 'un thermos', tipo: 'capacita', valore: 500, unita: 'ml' },
  { emoji: '🧴', nome: 'una borraccia sportiva', tipo: 'capacita', valore: 750, unita: 'ml' },
  { emoji: '🫗', nome: 'una brocca d\'acqua', tipo: 'capacita', valore: 1, unita: 'l' },
  { emoji: '🧴', nome: 'una bottiglia d\'acqua', tipo: 'capacita', valore: 1.5, unita: 'l' },
  { emoji: '💧', nome: 'un annaffiatoio', tipo: 'capacita', valore: 5, unita: 'l' },
  { emoji: '🍲', nome: 'una pentola', tipo: 'capacita', valore: 4, unita: 'l' },
  { emoji: '🪣', nome: 'un secchio', tipo: 'capacita', valore: 10, unita: 'l' },
  { emoji: '🛢️', nome: 'una tanica d\'acqua', tipo: 'capacita', valore: 20, unita: 'l' },
  { emoji: '🐠', nome: 'un acquario da tavolo', tipo: 'capacita', valore: 20, unita: 'l' },
  { emoji: '🐠', nome: 'una vasca per i pesci', tipo: 'capacita', valore: 50, unita: 'l' },
  { emoji: '⛽', nome: 'un serbatoio d\'automobile', tipo: 'capacita', valore: 50, unita: 'l' },
  { emoji: '🛢️', nome: 'un barile', tipo: 'capacita', valore: 200, unita: 'l' },
  { emoji: '🏊', nome: 'una piscina gonfiabile', tipo: 'capacita', valore: 300, unita: 'l' },
  { emoji: '🛁', nome: 'una vasca da bagno', tipo: 'capacita', valore: 150, unita: 'l' },
  { emoji: '💧', nome: 'una cisterna per l\'acqua piovana', tipo: 'capacita', valore: 1000, unita: 'l' },
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
  /* due contesti in più oltre a kg→g: il quintale e la tonnellata sono
     le altre due tappe della stessa scala (`UNITA.peso`), e senza di
     loro «convertire i pesi» voleva dire sempre la stessa coppia. */
  peso: [
    { du: 'kg', a: 'g', fattore: 1000, aiuto: 'un chilo sono mille grammi: sposta la virgola di tre posti' },
    { du: 'q', a: 'kg', fattore: 100, aiuto: 'un quintale sono cento chili: sposta la virgola di due posti' },
    { du: 't', a: 'kg', fattore: 1000, aiuto: 'una tonnellata sono mille chili: sposta la virgola di tre posti' },
  ],
  /* stessa idea per la capacità: litro→centilitro e centilitro→
     millilitro sono i due gradini che restavano scoperti. */
  capacita: [
    { du: 'l', a: 'ml', fattore: 1000, aiuto: 'un litro sono mille millilitri: sposta la virgola di tre posti' },
    { du: 'l', a: 'cl', fattore: 100, aiuto: 'un litro sono cento centilitri: sposta la virgola di due posti' },
    { du: 'cl', a: 'ml', fattore: 10, aiuto: 'un centilitro sono dieci millilitri: sposta la virgola di un posto' },
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
  // più valori possibili di k: con una sola coppia per grandezza (com'era
  // prima per peso e capacità) 13 valori × 2 versi facevano esattamente
  // 26 domande diverse — adesso, con più coppie e più k, se ne superano 80.
  const k = frazionario ? sorte.uno([0.5, 1.5, 2.5, 3.5, 4.5, 5.5]) : sorte.fra(1, 12)

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
   Trenta storie, non una sola travestita da tanti numeri: le tre
   grandezze (capacità/lunghezza/peso) incrociate con due strutture di
   conto (quanto resta dopo aver tolto N porzioni uguali, quanto fa in
   tutto dopo aver moltiplicato e convertito) e vestite con le
   situazioni di ogni giorno — la merenda, lo sport, la cucina, i
   compiti, il giardino, il viaggio — così che chi gioca non impari uno
   schema solo e lo applichi a occhi chiusi riconoscendo la bottiglia
   coi bicchieri sotto ai numeri cambiati. */

/* ── struttura RESTO — una quantità grande da cui si toglie via, N
   volte, una porzione uguale: quanto avanza. Generica per le tre
   grandezze, perché il conto (sottrazione più eventuale riconversione)
   è sempre lo stesso: cambia solo il vestito che passa `cfg`. */
function storiaResto(sorte, cfg) {
  const grandeVal = sorte.uno(cfg.grandi)
  const piccoloVal = sorte.uno(cfg.piccoli)
  const n = sorte.fra(cfg.nMin, cfg.nMax)
  const totBase = arrotonda(grandeVal * 1000, 4) // grandi/kg/l sono sempre mille unità-base
  const piccoloBase = arrotonda(piccoloVal * (cfg.fattorePiccolo || 1), 4)
  let restoBase = totBase - n * piccoloBase
  let nUsato = n
  if (restoBase <= 0) { nUsato = 1; restoBase = totBase - piccoloBase }

  const buonaObj = esprimi(restoBase, cfg.tipo)
  const buonaStr = formattaMisura(buonaObj.valore, buonaObj.unita)

  const f1 = esprimi(totBase - piccoloBase, cfg.tipo) // dimentica le altre volte
  const f2 = esprimi(totBase + nUsato * piccoloBase, cfg.tipo) // somma invece di sottrarre
  const f3valore = buonaObj.unita === cfg.unitaGrande
    ? arrotonda(restoBase / 100, 2)
    : arrotonda(restoBase * 10, 2)

  const candidati = [
    { s: formattaMisura(f1.valore, f1.unita), perche: cfg.perche1(nUsato) },
    { s: formattaMisura(f2.valore, f2.unita), perche: cfg.percheAggiunta },
    { s: formattaMisura(f3valore, buonaObj.unita), perche: cfg.percheConversione },
  ]
  const viste = new Set([buonaStr])
  const falsi = []
  for (const c of candidati) { if (!viste.has(c.s)) { viste.add(c.s); falsi.push(testo(c.s, c.perche)) } }

  return domanda({
    testo: cfg.testo(grandeVal, nUsato, piccoloVal),
    buona: testo(buonaStr),
    falsi,
    chiave: 'mis:problema',
    aiuto: cfg.aiuto,
    sorte,
  })
}

const PERCHE_TOGLIE = 'Qui si toglie, non si aggiunge: il resto è quello che avanza.'
const PERCHE_BEVE = 'Qui si beve, non si aggiunge: il resto è quello che avanza.'
const PERCHE_TAGLIA = 'Qui si taglia via, non si aggiunge: il resto è quello che avanza.'
const PERCHE_CONV_L = 'La conversione è sbagliata: un litro sono mille millilitri, non cento.'
const PERCHE_CONV_KG = 'La conversione è sbagliata: un chilo sono mille grammi, non cento.'
const PERCHE_CONV_M = 'La conversione è sbagliata: un metro sono cento centimetri, non dieci.'
const AIUTO_ML = 'porta tutto in millilitri, sottrai, e poi riconverti se serve.'
const AIUTO_G = 'porta tutto in grammi, sottrai, e poi riconverti se serve.'
const AIUTO_CM = 'porta tutto in centimetri, sottrai, e poi riconverti se serve.'

/* i quindici vestiti della struttura RESTO — lunghezze, pesi e
   capacità, incrociati con la merenda, lo sport, la cucina, i compiti,
   il giardino e il viaggio. */
const SCENARI_RESTO = [
  { tipo: 'capacita', unitaGrande: 'l', grandi: [1, 1.5, 2, 2.5], piccoli: [200, 250, 330], nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai una bottiglia da ${formattaNumero(g)} l e versi ${n > 1 ? `${n} bicchieri da ${p} ml l'uno` : `un bicchiere da ${p} ml`}: quanta acqua resta?`,
    perche1: n => `Hai versato un solo bicchiere: sono ${n}, non uno.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_L, aiuto: AIUTO_ML },
  { tipo: 'lunghezza', unitaGrande: 'm', grandi: [2, 3, 4], piccoli: [30, 40, 50], fattorePiccolo: 10, nMin: 3, nMax: 5,
    testo: (g, n, p) => `Hai un rotolo di scotch lungo ${formattaNumero(g)} m: per foderare i quaderni ne usi ${n > 1 ? `${n} pezzi da ${p} cm l'uno` : `${p} cm`}. Quanto scotch resta?`,
    perche1: n => `Hai usato un solo pezzo: sono ${n}, non uno.`, percheAggiunta: PERCHE_TAGLIA, percheConversione: PERCHE_CONV_M, aiuto: AIUTO_CM },
  { tipo: 'peso', unitaGrande: 'kg', grandi: [1, 1.5, 2, 2.5, 3], piccoli: [200, 250, 300, 400, 500], nMin: 1, nMax: 3,
    testo: (g, n, p) => `Hai un sacco di riso da ${formattaNumero(g)} kg: ne usi ${n > 1 ? `${n} volte ${p} g` : `${p} g`} per la ricetta. Quanto ne resta?`,
    perche1: n => `Hai tolto una sola volta: sono ${n}, non una.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_KG, aiuto: AIUTO_G },
  { tipo: 'capacita', unitaGrande: 'l', grandi: [1, 1.5, 2], piccoli: [150, 200, 250], nMin: 3, nMax: 5,
    testo: (g, n, p) => `Hai una borraccia da ${formattaNumero(g)} l e durante l'allenamento bevi ${n > 1 ? `${n} sorsate da ${p} ml l'una` : `una sorsata da ${p} ml`}. Quanta acqua resta nella borraccia?`,
    perche1: n => `Hai bevuto una sola sorsata: sono ${n}, non una.`, percheAggiunta: PERCHE_BEVE, percheConversione: PERCHE_CONV_L, aiuto: AIUTO_ML },
  { tipo: 'lunghezza', unitaGrande: 'm', grandi: [8, 10, 12], piccoli: [60, 80, 100], fattorePiccolo: 10, nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai una corda per l'arrampicata lunga ${formattaNumero(g)} m: per fissare i nodi ne tagli ${n > 1 ? `${n} pezzi da ${p} cm l'uno` : `${p} cm`}. Quanta corda resta?`,
    perche1: n => `Hai tagliato un solo pezzo: sono ${n}, non uno.`, percheAggiunta: PERCHE_TAGLIA, percheConversione: PERCHE_CONV_M, aiuto: AIUTO_CM },
  { tipo: 'peso', unitaGrande: 'kg', grandi: [2, 3], piccoli: [400, 500, 600], nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai una scatola di pesetti da ${formattaNumero(g)} kg: per allenarti ne usi ${n > 1 ? `${n} da ${p} g l'uno` : `uno da ${p} g`}. Quanto resta nella scatola?`,
    perche1: n => `Ne hai usato uno solo: sono ${n}, non uno.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_KG, aiuto: AIUTO_G },
  { tipo: 'lunghezza', unitaGrande: 'm', grandi: [4, 5, 6], piccoli: [30, 40, 50], fattorePiccolo: 10, nMin: 4, nMax: 6,
    testo: (g, n, p) => `Hai un rotolo di spago lungo ${formattaNumero(g)} m: per legare le piante ne tagli ${n > 1 ? `${n} pezzi da ${p} cm l'uno` : `${p} cm`}. Quanto spago resta?`,
    perche1: n => `Hai tagliato un solo pezzo: sono ${n}, non uno.`, percheAggiunta: PERCHE_TAGLIA, percheConversione: PERCHE_CONV_M, aiuto: AIUTO_CM },
  { tipo: 'capacita', unitaGrande: 'l', grandi: [4, 5, 6], piccoli: [600, 800, 1000], nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai una tanica d'acqua da ${formattaNumero(g)} l per annaffiare: usi ${n > 1 ? `${n} annaffiatoi da ${p} ml l'uno` : `un annaffiatoio da ${p} ml`}. Quanta acqua resta nella tanica?`,
    perche1: n => `Hai usato un solo annaffiatoio: sono ${n}, non uno.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_L, aiuto: AIUTO_ML },
  { tipo: 'peso', unitaGrande: 'kg', grandi: [4, 5, 6], piccoli: [500, 600, 800], nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai un sacco di terriccio da ${formattaNumero(g)} kg: per i vasi ne usi ${n > 1 ? `${n} palate da ${p} g l'una` : `una palata da ${p} g`}. Quanto terriccio resta nel sacco?`,
    perche1: n => `Hai usato una sola palata: sono ${n}, non una.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_KG, aiuto: AIUTO_G },
  { tipo: 'peso', unitaGrande: 'kg', grandi: [3, 4, 5], piccoli: [300, 400, 500], nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai una scatola di provviste da ${formattaNumero(g)} kg per il viaggio: nel primo giorno mangi ${n > 1 ? `${n} pacchi da ${p} g l'uno` : `un pacco da ${p} g`}. Quanto ne resta per gli altri giorni?`,
    perche1: n => `Hai mangiato un solo pacco: sono ${n}, non uno.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_KG, aiuto: AIUTO_G },
  { tipo: 'capacita', unitaGrande: 'l', grandi: [2, 3, 4], piccoli: [250, 330], nMin: 3, nMax: 5,
    testo: (g, n, p) => `Hai una borsa frigo con ${formattaNumero(g)} l di bibite per il viaggio: fermata dopo fermata bevi ${n > 1 ? `${n} lattine da ${p} ml l'una` : `una lattina da ${p} ml`}. Quanta bibita resta?`,
    perche1: n => `Hai bevuto una sola lattina: sono ${n}, non una.`, percheAggiunta: PERCHE_BEVE, percheConversione: PERCHE_CONV_L, aiuto: AIUTO_ML },
  { tipo: 'peso', unitaGrande: 'kg', grandi: [1, 1.5], piccoli: [100, 150, 200], nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai una confezione di pongo da ${formattaNumero(g)} kg: per un lavoretto ne usi ${n > 1 ? `${n} palline da ${p} g l'una` : `una pallina da ${p} g`}. Quanto pongo resta?`,
    perche1: n => `Hai usato una sola pallina: sono ${n}, non una.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_KG, aiuto: AIUTO_G },
  { tipo: 'capacita', unitaGrande: 'l', grandi: [0.5, 0.75, 1], piccoli: [40, 60, 80], nMin: 3, nMax: 5,
    testo: (g, n, p) => `Hai un flacone di colla da ${formattaNumero(g)} l: durante i lavoretti ne usi ${n > 1 ? `${n} volte ${p} ml` : `${p} ml`}. Quanta colla resta?`,
    perche1: n => `Ne hai usata una volta sola: sono ${n}, non una.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_L, aiuto: AIUTO_ML },
  { tipo: 'peso', unitaGrande: 'kg', grandi: [0.4, 0.5, 0.6], piccoli: [50, 60, 80], nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai un sacchetto di biscotti da ${formattaNumero(g)} kg: per la merenda ne mangi ${n > 1 ? `${n} porzioni da ${p} g l'una` : `una porzione da ${p} g`}. Quanto ne resta?`,
    perche1: n => `Hai mangiato una sola porzione: sono ${n}, non una.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_KG, aiuto: AIUTO_G },
  { tipo: 'capacita', unitaGrande: 'l', grandi: [1.5, 2, 2.5], piccoli: [200, 250, 300], nMin: 2, nMax: 4,
    testo: (g, n, p) => `Hai una pentola con ${formattaNumero(g)} l di brodo: ne versi ${n > 1 ? `${n} mestoli da ${p} ml l'uno` : `un mestolo da ${p} ml`} nelle scodelle. Quanto brodo resta in pentola?`,
    perche1: n => `Hai versato un solo mestolo: sono ${n}, non uno.`, percheAggiunta: PERCHE_TOGLIE, percheConversione: PERCHE_CONV_L, aiuto: AIUTO_ML },
]

/* ── struttura TOTALE — tante copie uguali: quanto pesano, sono lunghe
   o contengono in tutto, con la conversione dentro. Generica come la
   struttura resto: cambia solo cosa si moltiplica e in che unità. */
function storiaTotale(sorte, cfg) {
  const pezzo = sorte.uno(cfg.pezzi)
  const n = sorte.fra(cfg.nMin, cfg.nMax)
  const tot = pezzo * n
  const buonaValore = arrotonda(tot / cfg.fattore, 2)
  const buonaStr = formattaMisura(buonaValore, cfg.unitaFinale)

  const dimenticato = formattaMisura(tot, cfg.unitaFinale) // numero giusto, unità sbagliata
  const fattoreSbagliato = formattaMisura(arrotonda(tot / (cfg.fattore / 10), 2), cfg.unitaFinale) // un ordine di grandezza in meno
  const nSbagliato = n > cfg.nMin ? n - 1 : n + 1
  const contoSbagliato = formattaMisura(arrotonda((pezzo * nSbagliato) / cfg.fattore, 2), cfg.unitaFinale)

  const candidati = [
    { s: dimenticato, perche: `Ti sei dimenticato di convertire: ${tot} ${cfg.unitaBase} non sono ${tot} ${cfg.unitaFinale}.` },
    { s: fattoreSbagliato, perche: cfg.percheFattore },
    { s: contoSbagliato, perche: `Sono ${n} ${cfg.pluraleOggetto}, non ${nSbagliato}: contali di nuovo.` },
  ]
  const viste = new Set([buonaStr])
  const falsi = []
  for (const c of candidati) { if (!viste.has(c.s)) { viste.add(c.s); falsi.push(testo(c.s, c.perche)) } }

  return domanda({
    testo: cfg.testo(n, pezzo),
    buona: testo(buonaStr),
    falsi,
    chiave: 'mis:problema',
    aiuto: 'moltiplica prima, converti dopo.',
    sorte,
  })
}

const PERCHE_FATTORE_MILLE_M = 'Si divide per mille, non per cento: mille metri fanno un chilometro.'
const PERCHE_FATTORE_MILLE_ML = 'Si divide per mille, non per cento: mille millilitri fanno un litro.'
const PERCHE_FATTORE_MILLE_G = 'Si divide per mille, non per cento: mille grammi fanno un chilo.'
const PERCHE_FATTORE_CENTO_CM = 'Si divide per cento, non per dieci: cento centimetri fanno un metro.'

/* i quindici vestiti della struttura TOTALE, sulle stesse sei
   situazioni di vita vera. */
const SCENARI_TOTALE = [
  { pezzi: [150, 200, 250, 300, 400], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'm', unitaFinale: 'km', pluraleOggetto: 'giri',
    testo: (n, p) => `Corri ${n} giri da ${p} m: quanti km fai in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_M },
  { pezzi: [250, 330, 500], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'ml', unitaFinale: 'l', pluraleOggetto: 'bottigliette',
    testo: (n, p) => `Per il viaggio porti ${n} bottigliette da ${p} ml l'una: quanti litri porti in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_ML },
  { pezzi: [50, 60, 75, 80, 90], nMin: 3, nMax: 8, fattore: 100, unitaBase: 'cm', unitaFinale: 'm', pluraleOggetto: 'file',
    testo: (n, p) => `Pianti ${n} file di fiori, ogni fila lunga ${p} cm: quanti metri di aiuola sono in tutto?`, percheFattore: PERCHE_FATTORE_CENTO_CM },
  { pezzi: [150, 200, 250, 300], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'g', unitaFinale: 'kg', pluraleOggetto: 'quaderni',
    testo: (n, p) => `Hai ${n} quaderni da ${p} g l'uno nello zaino: quanti kg pesano in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_G },
  { pezzi: [70, 80, 90, 100], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'g', unitaFinale: 'kg', pluraleOggetto: 'porzioni',
    testo: (n, p) => `Prepari ${n} porzioni di pasta da ${p} g l'una: quanti kg cucini in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_G },
  { pezzi: [250, 300, 350], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'g', unitaFinale: 'kg', pluraleOggetto: 'pacchetti',
    testo: (n, p) => `Compri ${n} pacchetti di biscotti da ${p} g l'uno per la festa: quanti kg sono in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_G },
  { pezzi: [500, 600, 700, 800], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'g', unitaFinale: 'kg', pluraleOggetto: 'pesetti',
    testo: (n, p) => `In palestra usi ${n} pesetti da ${p} g l'uno: quanti kg pesano tutti insieme?`, percheFattore: PERCHE_FATTORE_MILLE_G },
  { pezzi: [100, 150, 200], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'g', unitaFinale: 'kg', pluraleOggetto: 'sacchetti',
    testo: (n, p) => `Compri ${n} sacchetti di semi da ${p} g l'uno: quanti kg hai comprato in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_G },
  { pezzi: [200, 250, 300, 350], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'm', unitaFinale: 'km', pluraleOggetto: 'giri',
    testo: (n, p) => `Il trenino del parco fa ${n} giri di pista da ${p} m l'uno: quanti km percorre in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_M },
  { pezzi: [30, 40, 50], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'ml', unitaFinale: 'l', pluraleOggetto: 'provette',
    testo: (n, p) => `Per un esperimento di scienze usi ${n} provette da ${p} ml l'una: quanti litri usi in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_ML },
  { pezzi: [150, 200, 250], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'ml', unitaFinale: 'l', pluraleOggetto: 'tazze',
    testo: (n, p) => `Versi ${n} tazze da ${p} ml l'una in una pentola: quanti litri versi in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_ML },
  { pezzi: [200, 250, 300], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'ml', unitaFinale: 'l', pluraleOggetto: 'borracce',
    testo: (n, p) => `Riempi ${n} borracce da ${p} ml l'una per la gita: quanti litri porti in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_ML },
  { pezzi: [700, 800, 900], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'g', unitaFinale: 'kg', pluraleOggetto: 'sacchi a pelo',
    testo: (n, p) => `Per il campeggio porti ${n} sacchi a pelo da ${p} g l'uno: quanti kg pesano in tutto?`, percheFattore: PERCHE_FATTORE_MILLE_G },
  { pezzi: [200, 250, 300], nMin: 3, nMax: 8, fattore: 1000, unitaBase: 'ml', unitaFinale: 'l', pluraleOggetto: 'vasi',
    testo: (n, p) => `Riempi ${n} vasi con ${p} ml d'acqua l'uno: quanti litri usi in tutto per annaffiare?`, percheFattore: PERCHE_FATTORE_MILLE_ML },
  { pezzi: [30, 40, 50], nMin: 3, nMax: 8, fattore: 100, unitaBase: 'cm', unitaFinale: 'm', pluraleOggetto: 'nastri',
    testo: (n, p) => `Tagli ${n} nastri da ${p} cm l'uno per i lavoretti: quanti metri di nastro usi in tutto?`, percheFattore: PERCHE_FATTORE_CENTO_CM },
]

/* i trenta modi di chiedere un problema corto, pescati con pari
   probabilità: senza questo elenco esplicito il grado 5 rischia di
   somigliare sempre alla stessa bottiglia coi bicchieri, cambiati solo
   i numeri — e dopo tre partite si applica lo schema senza leggere.
   Nessuna storia pesa più di 1/30 dei tiri (circa il 3%): ben sotto il
   10% che farebbe risuonare sempre la stessa situazione. */
const PROBLEMI = [
  ...SCENARI_RESTO.map(cfg => s => storiaResto(s, cfg)),
  ...SCENARI_TOTALE.map(cfg => s => storiaTotale(s, cfg)),
]

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
