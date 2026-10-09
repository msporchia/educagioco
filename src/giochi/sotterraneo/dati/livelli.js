// L'eroe sale di livello: l'esperienza, le soglie, i punti da dare e le quattro caratteristiche
// (docs/sotterraneo/livelli.md). Dato puro: le regole che lo usano stanno in motore/crescita.js.
// L'esperienza viene solo dai mostri battuti, tanta quanto sono forti (il capo molta di più): niente per i piani
// nuovi né per le missioni (decisione dell'utente, 8 ottobre 2026).

// Le quattro caratteristiche (9 ottobre 2026: via scorza e fortuna, la fortuna resta sulla roba). Le prime tre danno
// l'attacco alle armi della loro famiglia (`armi`, dati/eroi.js) e ne sono il requisito; a tutti danno anche
// qualcos'altro (`fa`). `glifo` e `tinta`: il medaglione sulla pagina dell'eroe (viste/glifi.js)
export const CARATTERISTICHE = [
  { chiave: 'forza', nome: 'Forza', glifo: 'martello', tinta: '#c0583a', fa: 'colpi più forti con spade e asce, e più posto nello zaino' },
  { chiave: 'destrezza', nome: 'Destrezza', glifo: 'mira', tinta: '#4f9a5a', fa: 'archi, e schivi i graffi' },
  { chiave: 'intelligenza', nome: 'Intelligenza', glifo: 'sfera', tinta: '#6a62d8', fa: 'bacchette e bastoni, e più energia' },
  { chiave: 'tempra', nome: 'Tempra', glifo: 'cuore', tinta: '#c0393b', fa: 'più vita, e un po\' di difesa' },
]
export const CHIAVI_CARATTERISTICHE = CARATTERISTICHE.map(c => c.chiave)

// quanto vale un punto. L'attacco: un punto della caratteristica dell'arma in mano (a mani nude, la forza). La difesa
// entra in una sottrazione e vale il doppio dell'attacco: la tempra ne dà una ogni tre punti. Provata sulla forza: chi
// alza la forza per l'attacco prendeva anche la difesa, e il nano e l'elfa (dote: forza) vincevano tutto a 4/10
export const ATT_PER_PUNTO = 1            // ⚔️ con l'arma della sua famiglia
export const VITA_PER_TEMPRA = 3          // ❤️ vita
export const TEMPRA_PER_DIFESA = 3        // punti di tempra per un 🛡️
export const SCHIVATA_PER_DESTREZZA = 1   // 🌀 per cento a punto (a 2 le zone a 6/10 si vincevano troppo)
export const ENERGIA_PER_INTELLIGENZA = 1 // energia massima a punto
export const GEMME_PER_FORTUNA = 0.05     // la fortuna dei pezzi: ogni gemma vale un ventesimo in più a punto
export const RARITA_PER_FORTUNA = 0.08    // e la roba non comune un dodicesimo più spesso

// Riassegnare i punti (delle caratteristiche e dell'albero) si paga in gemme, tante quante i punti da rimettere: si
// può sempre rimediare a una scelta, ma non la si rifà a ogni discesa (l'utente, 9 ottobre)
export const GEMME_PER_RIASSEGNARE = 5

export const PUNTI_PER_LIVELLO = 1
// ogni tre livelli la classe cresce da sé nella sua caratteristica (la `dote` di dati/eroi.js)
export const DOTE_OGNI = 3

// L'esperienza che serve per arrivare al livello `n` (dal livello 1, a zero). Mai esponenziale
// (docs/apprendimento/calibrazione.md): un salto costa A·n + B, quindi il totale cresce col quadrato,
// e l'esperienza di un mostro cresce in linea retta con la profondità. Tarata col banco: chi va dritto
// arriva all'abisso verso il livello 11 (docs/sotterraneo/livelli.md, «Le misure»)
export const ESP_A = 14, ESP_B = 16
// Oltre la storia (dal livello 12) ogni livello costa in più ESP_R + ESP_Q · (2m + 1), con m quanti livelli si è sopra
// il 12: cresce in linea retta come l'esperienza di una zona, così una zona verde vinta vale più o meno un livello a
// ogni altezza (docs/sotterraneo/zone.md, «L'esperienza»). Provato: il cubo di m, messo per l'abisso; dal 18 una zona
// valeva 0,2 livelli e le zone non giravano mai
export const ESP_OLTRE = 12, ESP_Q = 10, ESP_R = 120
export const sogliaDi = n => {
  if (n <= 1) return 0
  const m = Math.max(0, n - ESP_OLTRE)
  return ESP_A * (n - 1) * n / 2 + ESP_B * (n - 1) + ESP_Q * m * m + ESP_R * m
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

// L'esperienza di un mostro battuto: tanta quanto è forte, cioè quanto è forte la sua specie (le ossa e quanto picchia
// nel bestiario, dati/mostri.js) e quanto è giù il posto (il livello del posto, dati/campagna.js); il mostro grosso
// tre volte tanto. Provato: contarla sulle ossa vere del mostro, già moltiplicate per la discesa. Si avvitava: mostri
// più grossi davano più esperienza, l'eroe saliva di livello a metà discesa, e la discesa diventava più facile quanto
// più la si induriva (misurato col banco)
export const ESP_DEL_CAPO = 3
export const ESP_PER_LIVELLO_DEL_POSTO = 0.3
export const espDi = (specie, livelloDelPosto = 1, grosso = false) =>
  Math.max(1, Math.round(((specie.ossa || 1) + 3 * (specie.att || 0)) / 3 *
    (1 + ESP_PER_LIVELLO_DEL_POSTO * (Math.max(1, livelloDelPosto) - 1)))) * (grosso ? ESP_DEL_CAPO : 1)

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
