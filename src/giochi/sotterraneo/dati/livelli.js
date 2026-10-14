// L'eroe sale di livello: l'esperienza, le soglie, i punti da dare e le quattro caratteristiche
// (docs/sotterraneo/livelli.md). Dato puro: le regole che lo usano stanno in motore/crescita.js.
// L'esperienza viene solo dai mostri battuti, tanta quanto sono forti (il capo molta di più): niente per i piani
// nuovi né per le missioni (decisione dell'utente, 8 ottobre 2026).

// Le quattro caratteristiche (9 ottobre 2026: via scorza e fortuna, la fortuna resta sulla roba). Le prime tre danno
// l'attacco alle armi della loro famiglia (`armi`, dati/eroi.js) e ne sono il requisito; a tutti danno anche
// qualcos'altro (`fa`). `glifo` e `tinta`: il medaglione sulla pagina dell'eroe (viste/glifi.js)
export const CARATTERISTICHE = [
  { chiave: 'forza', nome: 'Forza', glifo: 'martello', tinta: '#c0583a', fa: 'colpi più forti con spade e asce, e un po\' di difesa' },
  { chiave: 'destrezza', nome: 'Destrezza', glifo: 'mira', tinta: '#4f9a5a', fa: 'archi, schivi i colpi e agisci prima' },
  { chiave: 'intelligenza', nome: 'Intelligenza', glifo: 'sfera', tinta: '#6a62d8', fa: 'bacchette e bastoni, e più energia' },
  { chiave: 'tempra', nome: 'Tempra', glifo: 'cuore', tinta: '#c0393b', fa: 'più vita' },
]
export const CHIAVI_CARATTERISTICHE = CARATTERISTICHE.map(c => c.chiave)

// quanto vale un punto. L'attacco: un punto della caratteristica dell'arma in mano (a mani nude, la forza). La difesa
// entra in una sottrazione e vale il doppio dell'attacco: la forza ne dà una ogni FORZA_PER_DIFESA punti («è la
// caratteristica di un tank», l'utente, 13 ottobre), la tempra solo vita. Provata a un passo veloce (la difesa ogni tre
// punti): chi alza la forza per l'attacco, il nano e l'elfa con la dote, vinceva tutto e il mago restava indietro
export const ATT_PER_PUNTO = 1            // ⚔️ con l'arma della sua famiglia
export const VITA_PER_TEMPRA = 5          // ❤️ vita
export const FORZA_PER_DIFESA = 4         // punti di forza per un 🛡️
export const SCHIVATA_PER_DESTREZZA = 1   // 🌀 per cento a punto (a 2 le zone a 6/10 si vincevano troppo)
export const ENERGIA_PER_INTELLIGENZA = 3 // energia massima a punto: il mago è il mago del mana (docs/sotterraneo/abilita.md, «L'energia»)
export const GEMME_PER_FORTUNA = 0.05     // la fortuna dei pezzi: ogni gemma vale un ventesimo in più a punto
export const RARITA_PER_FORTUNA = 0.08    // e la roba non comune un dodicesimo più spesso

// Riassegnare i punti (delle caratteristiche e dell'albero) si paga in gemme, tante quante i punti da rimettere: si
// può sempre rimediare a una scelta, ma non la si rifà a ogni discesa (l'utente, 9 ottobre)
export const GEMME_PER_RIASSEGNARE = 5

export const PUNTI_PER_LIVELLO = 1
// ogni tre livelli la classe cresce da sé nella sua caratteristica (la `dote` di dati/eroi.js)
export const DOTE_OGNI = 3

// Il bilanciamento (regola dell'utente, 8 ottobre 2026): il bambino sceglie, ma non può alzare troppo una caratteristica
// lasciando indietro le altre. Fra due caratteristiche, contando solo i punti DATI (non la partenza della classe, non la
// roba), va bene se la differenza è al più SCARTO_AMMESSO oppure se la più bassa è almeno la metà della più alta:
// 18 e 12 sì, 18 e 7 no, 50 e 30 sì
export const SCARTO_AMMESSO = 8
export function stannoInsieme(a, b) {
  const alto = Math.max(a, b), basso = Math.min(a, b)
  return alto - basso <= SCARTO_AMMESSO || basso * 2 >= alto
}

// la caratteristica che resta troppo indietro se si dà un punto a `k` (la più bassa fra quelle che romperebbero la
// regola), o null se il punto si può dare. La più bassa di tutte si può sempre alzare: un «+» acceso c'è sempre.
// `dati`: i punti dati, caratteristica per caratteristica (la crescita dell'avventura va bene com'è)
export function chiTrattiene(dati, k) {
  const dopo = ((dati && dati[k]) || 0) + 1
  let chi = null
  for (const c of CHIAVI_CARATTERISTICHE) {
    if (c === k) continue
    const v = (dati && dati[c]) || 0
    if (!stannoInsieme(dopo, v) && (chi == null || v < ((dati && dati[chi]) || 0))) chi = c
  }
  return chi
}

// Il giocatore finto (motore/banco.js), la misura della storia e i costi dell'energia (dati/abilita.js) danno i punti così,
// classe per classe: dove la classe è debole prima, poi un po' di tutto. Un bambino li dà come vuole, e la misura dice anche
// cosa succede a chi li mette tutti in una caratteristica sola (docs/sotterraneo/livelli.md)
// (dal 9 ottobre: metà nella caratteristica dell'arma della storia, che dà l'attacco e tiene i requisiti; la tempra
// dà la vita e la difesa che era della scorza)
export const COME_LI_DA = {
  cavaliere: ['forza', 'destrezza', 'forza', 'tempra'],
  elfa: ['forza', 'destrezza', 'forza', 'tempra'],
  mago: ['intelligenza', 'destrezza', 'intelligenza', 'tempra'],
  nano: ['forza', 'destrezza', 'forza', 'tempra'],
}
// dove va il prossimo punto: quello del giro, o se la regola non lo lascia la caratteristica più indietro
export function prossimaCaratteristica(dati, giro) {
  const d = dati || {}
  const k = giro[CHIAVI_CARATTERISTICHE.reduce((n, c) => n + (d[c] || 0), 0) % giro.length]
  return chiTrattiene(d, k) ? CHIAVI_CARATTERISTICHE.reduce((a, b) => ((d[b] || 0) < (d[a] || 0) ? b : a)) : k
}
// i punti dati di chi è arrivato al livello `livello` e li ha dati come li dà il banco (`come`: un altro giro)
export function puntiAttesi(chiave, livello, come = null) {
  const giro = come || COME_LI_DA[chiave] || COME_LI_DA.cavaliere
  const dati = Object.fromEntries(CHIAVI_CARATTERISTICHE.map(k => [k, 0]))
  for (let n = (Math.max(1, livello) - 1) * PUNTI_PER_LIVELLO; n > 0; n--) dati[prossimaCaratteristica(dati, giro)]++
  return dati
}

// L'esperienza che serve per arrivare al livello `n` (dal livello 1, a zero). Mai esponenziale
// (docs/apprendimento/calibrazione.md): un salto costa A·n + B, quindi il totale cresce col quadrato,
// e l'esperienza di un mostro cresce in linea retta con la profondità. Tarata col banco: chi va dritto
// arriva all'abisso verso il livello 11 (docs/sotterraneo/livelli.md, «Le misure»)
// (un oggetto e non quattro costanti: `npm run taratura -- --tara livelli.A=30` ne prova un valore senza toccare il file)
// Oltre la storia (dal livello 12) ogni livello costa in più ESP_R + ESP_Q · (2m + 1), con m quanti livelli si è sopra
// il 12: cresce in linea retta come l'esperienza di una zona, così una zona verde vinta vale più o meno un livello a
// ogni altezza (docs/sotterraneo/zone.md, «L'esperienza»). Provato: il cubo di m, messo per l'abisso; dal 18 una zona
// valeva 0,2 livelli e le zone non giravano mai
export const ESP_OLTRE = 12
export const CURVA_DELL_ESPERIENZA = { A: 50, B: 56, Q: 20, R: 200 }
export const sogliaDi = n => {
  if (n <= 1) return 0
  const m = Math.max(0, n - ESP_OLTRE)
  const c = CURVA_DELL_ESPERIENZA
  return c.A * (n - 1) * n / 2 + c.B * (n - 1) + c.Q * m * m + c.R * m
}

// il livello di chi ha `esp` di esperienza; nessun tetto
export function livelloDi(esp) {
  let n = 1
  while (sogliaDi(n + 1) <= (esp || 0)) n++
  return n
}

// quanto manca e quanto è fatto del livello di adesso: il globo dell'esperienza (0..1)
export function quotaDi(esp) {
  const n = livelloDi(esp)
  const da = sogliaDi(n), a = sogliaDi(n + 1)
  return { livello: n, fatto: (esp || 0) - da, serve: a - da, quota: Math.max(0, Math.min(1, ((esp || 0) - da) / (a - da))) }
}

// Il mostro porta quello che è (docs/sotterraneo/livelli.md, «Il mostro porta quello che è»): l'esperienza e le gemme vengono da una
// potenza sola, fatta delle sue caratteristiche vere. La sostanza è la media fra la vita (le ossa), tre volte l'attacco e tre volte la
// difesa: un punto di attacco o di difesa pesa tre ossa, come un colpo in meno o in più nello scontro. I poteri la gonfiano di una
// quota: ogni protezione (resistenza o immunità), l'arma di una variante, l'incanto del mago; il grado la moltiplica
// (PREMIO_DEL_GRADO). Un caporale e il grosso valgono tanto perché hanno più ossa e più attacco, non per un moltiplicatore.
// La curva dell'esperienza (CURVA_DELL_ESPERIENZA qui sopra) frena i livelli: è lei da tarare, non la potenza
export const PESO_DELL_ATTACCO = 3, PESO_DELLA_DIFESA_DEL_MOSTRO = 3
export const PIU_PER_PROTEZIONE = 0.08, PIU_PER_ARMA = 0.15, PIU_PER_INCANTO = 0.25
// quanto rende una potenza (un oggetto: `npm run taratura -- --tara potenza.gemme=0.3` ne prova un valore senza toccare il file)
export const VALORE_DELLA_POTENZA = { esp: 1, gemme: 1 }
export function potenzaDi({ ossa, att, dif = 0, protezioni = 0, arma = false, incanto = false, premio = 1 }) {
  const sostanza = (Math.max(1, ossa) + PESO_DELL_ATTACCO * Math.max(0, att) + PESO_DELLA_DIFESA_DEL_MOSTRO * Math.max(0, dif)) / 3
  return sostanza * (1 + PIU_PER_PROTEZIONE * protezioni + (arma ? PIU_PER_ARMA : 0) + (incanto ? PIU_PER_INCANTO : 0)) * premio
}
export const esperienzaDi = potenza => Math.max(1, Math.round(potenza * VALORE_DELLA_POTENZA.esp))
export const gemmeDi = potenza => Math.max(1, Math.round(potenza * VALORE_DELLA_POTENZA.gemme))

export function guastiDeiLivelli() {
  const g = []
  for (let n = 2; n < 60; n++) {
    if (sogliaDi(n) <= sogliaDi(n - 1)) g.push(`il livello ${n} non costa più del ${n - 1}`)
    if (livelloDi(sogliaDi(n)) !== n) g.push(`livelloDi non torna sulla soglia del ${n}`)
  }
  if (new Set(CARATTERISTICHE.map(c => c.glifo)).size !== CARATTERISTICHE.length) g.push('due caratteristiche con la stessa icona')
  if (PUNTI_PER_LIVELLO < 1) g.push('un livello che non porta punti')
  return g
}
