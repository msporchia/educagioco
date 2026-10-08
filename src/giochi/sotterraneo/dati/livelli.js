// L'eroe sale di livello: l'esperienza, le soglie, i punti da dare e le quattro caratteristiche
// (docs/sotterraneo/livelli.md). Dato puro: le regole che lo usano stanno in motore/crescita.js.
// L'esperienza viene solo dai mostri battuti, tanta quanto sono forti (il capo molta di più): niente per i piani
// nuovi né per le missioni (decisione dell'utente, 8 ottobre 2026).

// le quattro caratteristiche, coi nomi che un bambino capisce; `fa` è la riga corta sulla pagina dell'eroe
export const CARATTERISTICHE = [
  { chiave: 'forza', nome: 'Forza', em: '⚔️', fa: 'colpi più forti' },
  { chiave: 'tempra', nome: 'Tempra', em: '❤️', fa: 'più vita' },
  { chiave: 'scorza', nome: 'Scorza', em: '🛡️', fa: 'meno danni' },
  { chiave: 'fortuna', nome: 'Fortuna', em: '🍀', fa: 'più gemme e roba migliore' },
]
export const CHIAVI_CARATTERISTICHE = CARATTERISTICHE.map(c => c.chiave)

// quanto vale un punto: la scorza ne vuole due per un punto di difesa (la difesa entra in una sottrazione e
// vale il doppio dell'attacco: con un punto a punto, tutto in scorza voleva dire non farsi più male)
export const FORZA_PER_PUNTO = 1          // ⚔️ attacco
export const VITA_PER_TEMPRA = 3          // ❤️ vita
export const SCORZA_PER_DIFESA = 2        // punti di scorza per un 🛡️
export const GEMME_PER_FORTUNA = 0.05     // ogni punto: ogni gemma vale un ventesimo in più
export const RARITA_PER_FORTUNA = 0.08    // ogni punto: la roba non comune un dodicesimo più spesso

export const PUNTI_PER_LIVELLO = 1
// ogni tre livelli la classe cresce da sé nella sua caratteristica (la `dote` di dati/eroi.js)
export const DOTE_OGNI = 3

// L'esperienza che serve per arrivare al livello `n` (dal livello 1, a zero). Mai esponenziale
// (docs/apprendimento/calibrazione.md): un salto costa A·n + B, quindi il totale cresce col quadrato,
// e l'esperienza di un mostro cresce in linea retta con la profondità. Tarata col banco: chi va dritto
// arriva all'abisso verso il livello 11 (docs/sotterraneo/livelli.md, «Le misure»)
export const ESP_A = 14, ESP_B = 16
// oltre la storia (l'abisso: mostri sempre più grossi, e quindi sempre più esperienza) ogni livello costa anche il cubo
// di quanto si è sopra il livello 12: senza, l'eroe dell'abisso cresceva più in fretta dei mostri (misurato)
export const ESP_OLTRE = 12, ESP_C = 20
export const sogliaDi = n => (n <= 1 ? 0
  : ESP_A * (n - 1) * n / 2 + ESP_B * (n - 1) + ESP_C * Math.max(0, n - ESP_OLTRE) ** 3)

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
  if (new Set(CARATTERISTICHE.map(c => c.em)).size !== CARATTERISTICHE.length) g.push('due caratteristiche con la stessa icona')
  if (PUNTI_PER_LIVELLO < 1) g.push('un livello che non porta punti')
  return g
}
