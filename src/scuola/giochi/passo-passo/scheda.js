/* Passo passo a scuola (docs/passo-passo/scuola.md): la maestra sceglie il protagonista e i gradini, il bambino gioca
   quei livelli in giro. La forma di una scheda: docs/scuola/giochi.md. Puro e senza import: lo legge anche la pagina
   della maestra, che non deve tirarsi dietro la campagna. Le chiavi sono quelle di SCALINI (dati/campagna.js), e
   unita/passo-passo-scuola controlla che gradini e livelli siano quelli delle strade */

export const PROTAGONISTI = [
  { id: 'coniglio', nome: 'Il coniglio', icona: '🐇', col: 'col coniglio',
    spiega: 'Da cominciare. Il coniglio va alla tana, prendendo la carota per strada: frecce, salti, ghiaccio e buche, poi le carte che ripetono.' },
  { id: 'cane', nome: 'Il cane', icona: '🐕', col: 'col cane',
    spiega: 'Dopo il coniglio. Il cane porta le pecore nel recinto senza toccarle: si scansano quando lui si ferma vicino, e bisogna prevedere dove vanno.' },
  { id: 'guerriero', nome: 'Il guerriero', icona: '⚔️', col: 'col guerriero',
    spiega: "Il più difficile. Il guerriero apre le grate coi pulsanti e affronta i nemici: conta l'ordine in cui si fanno le cose." },
]

// i gradini di ogni protagonista, nell'ordine della sua strada; `livelli` quanti ne ha
const CARTE = {
  ripeti: { chiave: 'ripeti', icona: '🔁', nome: 'Ripeti N volte', spiega: 'Lo zaino tiene poche carte: il ciclo ripete quello che ha dentro.' },
  fino: { chiave: 'fino', icona: '🚩', nome: 'Ripeti fino a', spiega: 'Il ciclo che non conta: ripete finché non arriva sul colore giusto.' },
  se: { chiave: 'se', icona: '❓', nome: 'Il se', spiega: 'La condizione: si fa solo se sotto i piedi c\'è quel colore.' },
  mondo: { chiave: 'mondo', icona: '🌍', nome: 'Tutto insieme', spiega: 'Ghiaccio, massi, salti e colori, con tutte le carte.' },
}
export const GRADINI = {
  coniglio: [
    { chiave: 'passi', icona: '🐾', nome: 'Le frecce', spiega: 'Solo frecce: contare le caselle, girare attorno.', livelli: 5 },
    { chiave: 'salto', icona: '🦘', nome: 'Il salto', spiega: 'Il salto scavalca una casella: l\'acqua e i tronchi sì, i sassi no.', livelli: 5 },
    { chiave: 'ghiaccio', icona: '❄️', nome: 'Il ghiaccio', spiega: 'Sul ghiaccio si scivola finché qualcosa non ferma.', livelli: 6 },
    { chiave: 'buche', icona: '🕳️', nome: 'Le buche', spiega: 'Si entra in una buca e si esce dalla gemella dello stesso colore.', livelli: 3 },
    { chiave: 'massi', icona: '🪨', nome: 'I massi', spiega: 'Un masso si spinge: sul ghiaccio scivola, nell\'acqua fa un ponte.', livelli: 5 },
    { ...CARTE.ripeti, livelli: 8 },
    { ...CARTE.fino, livelli: 4 },
    { ...CARTE.se, livelli: 2 },
    { ...CARTE.mondo, livelli: 4 },
  ],
  cane: [
    { chiave: 'pecore', icona: '🐑', nome: 'Le pecore', spiega: 'Le pecore scappano dal cane: bisogna spingerle nel recinto.', livelli: 11 },
    { ...CARTE.ripeti, livelli: 6 },
    { ...CARTE.fino, livelli: 6 },
    { ...CARTE.se, livelli: 6 },
    { ...CARTE.mondo, livelli: 6 },
  ],
  guerriero: [
    { chiave: 'grate', icona: '🔑', nome: 'Le grate', spiega: 'Un pulsante apre la grata del suo colore: conta l\'ordine.', livelli: 5 },
    { chiave: 'nemici', icona: '🗡️', nome: 'La spada', spiega: 'Alla larga dai nemici, o prima la spada e poi l\'attacco.', livelli: 5 },
    { chiave: 'due', icona: '⚔️', nome: 'Due alla volta', spiega: 'Contro due nemici non si vince: uno alla volta. Poi arrivano i cicli.', livelli: 7 },
    { chiave: 'castello', icona: '🏰', nome: 'Il castello', spiega: 'Il programma fa la strada: ripeti, fino a, se.', livelli: 7 },
    { chiave: 'lago', icona: '❄️', nome: 'Il lago', spiega: 'Il programma guarda dove mette i piedi: il se a ogni passo.', livelli: 5 },
    { chiave: 'mastio', icona: '👑', nome: 'Il mastio', spiega: 'Cicli dentro cicli, e tutte le carte insieme.', livelli: 5 },
  ],
}

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)
const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)
const inFila = l => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l.at(-1)}`)

// anche contro un link manomesso: niente chiavi in più, un protagonista che c'è, gradini suoi e senza doppioni
function valido(e) {
  if (!oggetto(e) || !Object.keys(e).every(k => ['tipo', 'protagonista', 'gradini'].includes(k))) return false
  if (e.tipo !== 'passo' || typeof e.protagonista !== 'string' || !Object.hasOwn(GRADINI, e.protagonista)) return false
  const suoi = GRADINI[e.protagonista].map(g => g.chiave)
  return Array.isArray(e.gradini) && e.gradini.length > 0 && new Set(e.gradini).size === e.gradini.length &&
    e.gradini.every(g => typeof g === 'string' && suoi.includes(g))
}

// «Passo passo · il ghiaccio e le buche · col coniglio», nell'ordine della strada
function descrivi(e) {
  const tutti = GRADINI[e.protagonista]
  const scelti = tutti.filter(g => e.gradini.includes(g.chiave)).map(g => minuscola(g.nome))
  const chi = PROTAGONISTI.find(p => p.id === e.protagonista).col
  return `Passo passo · ${scelti.length === tutti.length ? 'tutti i livelli' : inFila(scelti)} · ${chi}`
}

export default {
  id: 'passo-passo',
  nome: 'Passo passo',
  nei: 'in Passo passo',
  spiega: 'Il bambino mette in fila delle frecce (e poi dei cicli) e preme ▶: il personaggio le esegue e deve arrivare alla meta. È il primo passo verso la programmazione.',
  tred: false,
  conta: { tante: 'livelli', una: 'un livello', giuste: null },   // una risposta chiusa è un livello vinto
  // gli esercizi del catalogo no: solo il suo contenuto
  accetta: () => false,
  tipo: {
    id: 'passo',
    materia: 'programmazione',
    voce: {
      nome: 'Passo passo',
      icona: '🐇',
      spiega: 'Il bambino scrive una fila di frecce e il coniglio la esegue; più avanti i cicli e il se. Si scelgono i gradini, e i loro livelli si giocano in fila.',
      base: { tipo: 'passo', protagonista: 'coniglio', gradini: ['passi'] },
    },
    valido,
    descrivi,
  },
}
