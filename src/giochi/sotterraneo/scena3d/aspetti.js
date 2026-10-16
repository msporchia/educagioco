// Ogni paesaggio ha il suo aspetto in 3D: la forma delle pareti, il disegno del pavimento, i colori, la luce, la nebbia, l'aria,
// l'arredo fitto, l'acqua. La chiave è lo scenario vero del piano (`corsa.scenario`, dati/campagna.js `scenarioDi`: nell'abisso
// cambia coi tratti) o, se c'è, il `paesaggio` della discesa o del tratto: un paesaggio solo del 3D (la grotta, la neve, il
// ghiaccio…) porta in sé lo scenario del motore di cui usa i pezzi (`base`: porte, forzieri, arredo da toccare). Il colore della
// roccia viene dallo scenario. Dato puro, gira in Node: unita/sotterraneo-3d e unita/sotterraneo-paesaggi. Le regole e come se
// ne aggiunge uno: docs/sotterraneo/paesaggi-3d.md.
import { SCENARI, SCENARIO } from '../dati/tessere.js'
import { PAESAGGI, paesaggioDi } from '../dati/paesaggi.js'
import { STILI_PARETE } from './pareti.js'
import { PAVIMENTI, MURI } from './pitture.js'

// colori in [0..1] o '#rrggbb'. pav/trama: i disegni di pitture.js · parete: la forma (pareti.js) e `copre` la tinta della
// coperta · fusto: la forma delle colonne (terreno.js) · aria: le particelle (particelle.js) · arredo: [tipo, quanto fitto] (arredo3d.js) ·
// fiamma: il colore del fuoco delle torce · raggi: le lame di luce dall'alto · velo: l'acqua bassa su tutto il pavimento
export const ASPETTI_3D = {
  // le cantine: mattoni a cesto per terra, muri di mattoni dritti con i contrafforti, le botti da rompere (scena3d/botti.js), luce calda e polvere
  cantine: {
    nome: 'le cantine',
    pav: 'cesto', trama: 'mattoni', parete: { stile: 'blocchi', varia: 0.2 }, fusto: 'tonda',
    pietra: [1.0, 0.86, 0.72], fuga: [0.13, 0.12, 0.1], muschio: 0.06, braci: 0,
    muro: [1.0, 0.86, 0.72], cima: '#5a463a', parapetto: '#6a5f55', colonna: '#8a7462',
    cielo: '#b8a894', terra: '#3a3430', ambiente: 1,
    torcia: '#ff8a3c', nebbia: { colore: [1, 0.9, 0.75], densita: 0.05 }, aria: 'polvere',
    acqua: { fondo: [0.04, 0.14, 0.2], chiaro: [0.35, 0.75, 0.95], lava: 0 },
    arredo: [['contrafforti', 1], ['sacchi', 0.35], ['mensole', 0.6]],
  },
  // la cripta: lastroni incisi, pareti a blocchi grandi con pilastri e nicchie coi sarcofagi, ossa; fredda, nebbia fitta
  cripta: {
    nome: 'la cripta',
    pav: 'lastroni', trama: 'lastre', parete: { stile: 'lastroni', varia: 0.1 }, fusto: 'quadra',
    pietra: [0.8, 0.86, 0.95], fuga: [0.09, 0.11, 0.13], muschio: 0.1, braci: 0,
    muro: [0.78, 0.84, 0.95], cima: '#5a626e', parapetto: '#5e656b', colonna: '#9aa0a6',
    cielo: '#8a9ab6', terra: '#20262e', ambiente: 0.85,
    torcia: '#ffa860', nebbia: { colore: [0.65, 0.78, 1.0], densita: 0.11 }, aria: 'polvere',
    acqua: { fondo: [0.03, 0.1, 0.16], chiaro: [0.4, 0.7, 0.95], lava: 0 },
    arredo: [['pilastri', 1], ['nicchie', 0.55], ['ossa', 0.4], ['candele', 0.35]],
  },
  // la fornace: grate di ferro sopra il fuoco, pareti di lamiera con tubi e bocche accese, scintille
  fornace: {
    nome: 'la fornace',
    pav: 'grata', trama: 'lamiera', parete: { stile: 'lamiera', varia: 0.12 }, fusto: 'ferro',
    pietra: [0.82, 0.8, 0.8], fuga: [0.12, 0.07, 0.05], muschio: 0, braci: 0.8, metallo: 0.55,
    muro: [0.8, 0.76, 0.74], cima: '#3a3230', parapetto: '#4a3a34', colonna: '#5a524e',
    cielo: '#c08060', terra: '#2a1a14', ambiente: 0.8,
    torcia: '#ff6a20', nebbia: { colore: [1, 0.5, 0.3], densita: 0.05 }, aria: 'braci',
    acqua: { fondo: [0.06, 0.12, 0.16], chiaro: [0.35, 0.65, 0.85], lava: 0 },
    arredo: [['tubi', 1], ['bocche', 0.3], ['incudini', 0.25]],
  },
  // l'inferno: basalto a prismi con la lava nelle fessure, pareti di vetro nero a scaglie con le vene accese, spuntoni, ossa
  inferno: {
    nome: 'l\'inferno',
    pav: 'basalto', trama: 'ossidiana', parete: { stile: 'ossidiana', varia: 0.15 }, fusto: 'spina',
    pietra: [0.62, 0.55, 0.58], fuga: [0.1, 0.03, 0.02], muschio: 0, braci: 0.75, lucido: 0.6,
    muro: [0.55, 0.48, 0.52], cima: '#2a1614', parapetto: '#3e2a28', colonna: '#3a2a2a',
    cielo: '#b05040', terra: '#2a0c08', ambiente: 0.8,
    torcia: '#ff4a18', nebbia: { colore: [1, 0.35, 0.15], densita: 0.08 }, aria: 'braci',
    acqua: { fondo: [0.25, 0.04, 0.0], chiaro: [1.0, 0.55, 0.12], lava: 1 },
    arredo: [['spuntoni', 0.7], ['ossa', 0.35]],
  },

  // ── i paesaggi solo del 3D: `base` è lo scenario del motore da cui prendono porte, forzieri e arredo ──
  // la grotta: terra battuta coi sassi, pareti di roccia viva che strapiombano, stalagmiti, funghi azzurri che fanno luce, gocce
  grotta: {
    nome: 'la grotta',
    pav: 'terra', trama: 'roccia', parete: { stile: 'roccia', varia: 0.3, strati: 0.08 }, fusto: 'stalattite',
    pietra: [0.72, 0.6, 0.48], fuga: [0.1, 0.09, 0.08], muschio: 0, braci: 0, pozze: { colore: [0.04, 0.05, 0.06], quanto: 0.55 },
    muro: [0.78, 0.76, 0.74], cima: '#7a7066', parapetto: '#5a4e44', colonna: '#7a6c5e',
    cielo: '#8a9aac', terra: '#22262a', ambiente: 0.85,
    torcia: '#ff9040', nebbia: { colore: [0.7, 0.85, 1.0], densita: 0.08 }, aria: 'gocce',
    acqua: { fondo: [0.03, 0.1, 0.14], chiaro: [0.4, 0.8, 0.9], lava: 0 },
    arredo: [['stalagmiti', 0.8], ['funghi', 0.65], ['sassi', 0.6]],
  },
  // la neve: terra bianca con le orme, roccia scura sotto cumuli di neve, abeti spogli, fiocchi che cadono, luce fredda e chiara
  neve: {
    nome: 'le nevi',
    pav: 'neve', trama: 'roccia', parete: { stile: 'neve', varia: 0.2, coperta: 1, da: 0.5 }, copre: [0.92, 0.95, 1.0], fusto: 'stalattite',
    pietra: [0.74, 0.78, 0.86], fuga: [0.5, 0.55, 0.65], muschio: 0, braci: 0,
    muro: [0.42, 0.44, 0.5], cima: '#e8f0f8', parapetto: '#c8d4e0', colonna: '#5a5e68',
    cielo: '#a8bcd8', terra: '#4a5468', ambiente: 0.9,
    torcia: '#ffb070', nebbia: { colore: [0.85, 0.92, 1.0], densita: 0.07 }, aria: 'neve',
    acqua: { fondo: [0.08, 0.16, 0.24], chiaro: [0.6, 0.85, 1.0], lava: 0 },
    arredo: [['abeti', 0.45], ['cumuli', 0.9], ['sassi', 0.35]],
  },
  // il ghiaccio: pavimento lucido a crepe, pareti di cristallo azzurro a facce che brillano dentro, ghiaccioli, fuochi freddi
  ghiaccio: {
    nome: 'il ghiaccio',
    pav: 'ghiaccio', trama: 'ghiaccio', parete: { stile: 'cristallo', varia: 0.25, coperta: 0.3, da: 0.7 }, copre: [0.85, 0.95, 1.0], fusto: 'cristallo',
    pietra: [0.42, 0.62, 0.78], fuga: [0.6, 0.8, 0.9], muschio: 0, braci: 0, lucido: 0.15,
    muro: [0.55, 0.85, 1.0], cima: '#7ec0e4', parapetto: '#8cc4e4', colonna: '#9ad4f0',
    bagliore: [0.1, 0.35, 0.55],
    cielo: '#9ad0f0', terra: '#1a3a50', ambiente: 1.0,
    torcia: '#7ac8ff', fiamma: [0.3, 0.75, 1.0], nebbia: { colore: [0.6, 0.85, 1.0], densita: 0.06 }, aria: 'brina',
    acqua: { fondo: [0.05, 0.2, 0.3], chiaro: [0.6, 0.9, 1.0], lava: 0 },
    arredo: [['ghiaccioli', 1], ['cristalli', 0.5]],
  },
  // la palude: fango a solchi con le pozze, rive di terra e radici che franano verso il basso, canne, funghi verdi, lucciole
  palude: {
    nome: 'la palude',
    pav: 'fango', trama: 'terra', parete: { stile: 'zolla', varia: 0.25, coperta: 0.55, da: 0.4 }, copre: [0.1, 0.17, 0.05], fusto: 'tronco',
    pietra: [0.72, 0.68, 0.42], fuga: [0.08, 0.09, 0.05], muschio: 0, braci: 0, pozze: { colore: [0.02, 0.035, 0.02], quanto: 0.95 },
    muro: [0.7, 0.62, 0.44], cima: '#3a3420', parapetto: '#3a4426', colonna: '#4a3a28',
    cielo: '#7a9a6a', terra: '#1a2210', ambiente: 0.85,
    torcia: '#ffc060', fiamma: [0.55, 1.0, 0.35], nebbia: { colore: [0.6, 0.9, 0.45], densita: 0.13 }, aria: 'lucciole',
    acqua: { fondo: [0.01, 0.02, 0.01], chiaro: [0.07, 0.12, 0.05], lava: 0, riflesso: 0.5 },   // torbida: riflette poco
    arredo: [['canne', 0.9], ['radici', 0.8], ['funghi', 0.3], ['ninfee', 0.7]], funghi: '#a8ff40',
  },
  // il tempio sommerso: lastre scolpite sotto un velo d'acqua, colonnati e archi sulle pareti, lame di luce dall'alto, alghe, bolle
  tempio: {
    nome: 'il tempio sommerso',
    pav: 'anelli', trama: 'scolpita', parete: { stile: 'lastroni', varia: 0.12, coperta: 0.35, da: 0.6 }, copre: [0.15, 0.32, 0.22], fusto: 'scanalata',
    pietra: [0.7, 0.86, 0.82], fuga: [0.05, 0.1, 0.1], muschio: 0.1, braci: 0,
    muro: [0.66, 0.82, 0.8], cima: '#4a6a66', parapetto: '#4e6a68', colonna: '#9ab8b4',
    cielo: '#6ab0b8', terra: '#0a2028', ambiente: 1.0,
    torcia: '#70e0d0', fiamma: [0.35, 1.0, 0.85], nebbia: { colore: [0.4, 0.85, 0.9], densita: 0.1 }, aria: 'bolle',
    acqua: { fondo: [0.02, 0.12, 0.14], chiaro: [0.35, 0.85, 0.85], lava: 0 },
    velo: 0.5, raggi: { colore: [0.45, 1.0, 0.9], forza: 0.5 },
    arredo: [['archi', 1], ['alghe', 0.7], ['rocchi', 0.3]],
  },
  // la miniera: assi inchiodate, pareti di roccia coi puntelli e le travi, binari, lanterne gialle, polvere
  miniera: {
    nome: 'la miniera',
    pav: 'assi', trama: 'roccia', parete: { stile: 'roccia', varia: 0.22, strati: 0.12 }, fusto: 'puntello',
    pietra: [0.95, 0.75, 0.52], fuga: [0.1, 0.08, 0.06], muschio: 0, braci: 0,
    muro: [0.62, 0.56, 0.5], cima: '#5a4e44', parapetto: '#4a4038', colonna: '#6a4a2a',
    cielo: '#a09070', terra: '#2a2018', ambiente: 0.85,
    torcia: '#ffc050', fiamma: [1.0, 0.85, 0.4], nebbia: { colore: [1, 0.85, 0.6], densita: 0.07 }, aria: 'polvere',
    acqua: { fondo: [0.04, 0.1, 0.12], chiaro: [0.35, 0.65, 0.75], lava: 0 },
    arredo: [['travi', 1], ['binari', 0.8], ['sassi', 0.5], ['carrelli', 0.25]],
  },
}

export const STILI_COLONNA = ['tonda', 'quadra', 'ferro', 'spina', 'stalattite', 'cristallo', 'tronco', 'scanalata', 'puntello']
export const ARIE = ['polvere', 'braci', 'gocce', 'neve', 'brina', 'lucciole', 'bolle']
export const ARREDI = ['contrafforti', 'sacchi', 'mensole', 'pilastri', 'nicchie', 'ossa', 'candele', 'tubi', 'bocche', 'incudini', 'spuntoni',
  'stalagmiti', 'funghi', 'sassi', 'abeti', 'cumuli', 'ghiaccioli', 'cristalli', 'canne', 'radici', 'archi', 'alghe', 'rocchi', 'travi',
  'binari', 'carrelli', 'ninfee']

const CAMPI = ['nome', 'pav', 'trama', 'parete', 'fusto', 'colonna', 'pietra', 'fuga', 'muro', 'cima', 'parapetto', 'cielo', 'terra',
  'torcia', 'nebbia', 'aria', 'acqua', 'arredo']

// lo scenario del motore di un paesaggio (se stesso, per i quattro del motore): dati/paesaggi.js
export const baseDi = k => (PAESAGGI[k] && PAESAGGI[k].base) || k

// l'aspetto di un paesaggio (quello di ripiego se non lo dichiara), con la roccia del suo scenario e il nome
export function aspettoDi(scenario) {
  const chiave = ASPETTI_3D[scenario] ? scenario : SCENARIO
  const sc = SCENARI[baseDi(chiave)] || SCENARI[SCENARIO]
  return { chiave, ...PAESAGGI[chiave], ...ASPETTI_3D[chiave], roccia: (sc.colori && sc.colori.roccia) || '#202020' }
}

// quale paesaggio si disegna in questo piano (dati/paesaggi.js: lo legge anche il motore, per le botti)
export { paesaggioDi }

// ogni scenario del gioco ha il suo aspetto, con tutti i campi; ogni nome di stile esiste: un nome sbagliato è rosso nei test,
// non un piano grigio
export function guastiDegliAspetti() {
  const g = []
  for (const k of Object.keys(SCENARI)) if (!ASPETTI_3D[k]) g.push(`lo scenario ${k} non ha l'aspetto in 3D`)
  for (const [k, a] of Object.entries(ASPETTI_3D)) {
    for (const c of CAMPI) if (a[c] == null) g.push(`l'aspetto 3D di ${k} non ha «${c}»`)
    const p = PAESAGGI[k]
    if (!p) { g.push(`l'aspetto 3D «${k}» non è in dati/paesaggi.js`); continue }
    if (!SCENARI[p.base] || (SCENARI[k] && p.base !== k)) g.push(`il paesaggio «${k}» non ha uno scenario del motore di base`)
    if (!['costruita', 'caverna'].includes(p.pianta)) g.push(`${k}: la pianta «${p.pianta}» non è costruita né caverna`)
    if (!PAVIMENTI[a.pav]) g.push(`${k}: il pavimento «${a.pav}» non è in pitture.js`)
    if (!MURI[a.trama]) g.push(`${k}: la parete «${a.trama}» non è in pitture.js`)
    if (!a.parete || !STILI_PARETE[a.parete.stile]) g.push(`${k}: la forma di parete «${a.parete && a.parete.stile}» non è in pareti.js`)
    if (!STILI_COLONNA.includes(a.fusto)) g.push(`${k}: la colonna «${a.fusto}» non esiste`)
    if (!ARIE.includes(a.aria)) g.push(`${k}: l'aria «${a.aria}» non esiste`)
    for (const [tipo, q] of a.arredo || []) if (!ARREDI.includes(tipo) || !(q > 0 && q <= 1)) g.push(`${k}: l'arredo «${tipo}» (${q}) non va`)
  }
  for (const k of Object.keys(PAESAGGI)) if (!ASPETTI_3D[k]) g.push(`il paesaggio «${k}» non ha l'aspetto in 3D`)
  // due paesaggi con lo stesso disegno per terra o la stessa forma e trama di parete si confonderebbero
  const visti = new Map()
  for (const [k, a] of Object.entries(ASPETTI_3D)) {
    const firma = `${a.pav}`
    if (visti.has(firma)) g.push(`${k} e ${visti.get(firma)} hanno lo stesso pavimento (${a.pav})`)
    visti.set(firma, k)
  }
  return g
}
