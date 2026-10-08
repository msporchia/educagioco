// Nove tappe in tre scalini: una tappa è lo stesso motore con altri
// numeri e un altro vestito. Le tre leve (ritmo, vigore, fretta)
// moltiplicano le curve di taratura.js e corrono sul tempo vero
// (Regole.marea): una tappa lunga è già più dura di una corta a parità
// di leve, quindi le leve delle ultime tappe sono più basse di quelle
// delle prime — chi le ritocca guarda la piena al traguardo (il
// validatore qui sotto), non il numero. Vedi docs/survivors/regole.md.
import { CFG } from './taratura.js'

export const SCALINI = [
  { chiave: 'prati',  nome: 'I primi passi', icona: '🌿',
    dritta: 'Poche melme lente: si impara a schivare.' },
  { chiave: 'fitto',  nome: 'Il bosco fitto', icona: '🌲',
    dritta: 'Arrivano i funghi duri e gli spettri veloci.' },
  { chiave: 'lontano', nome: 'Le terre lontane', icona: '🏔️',
    dritta: 'Tutte le bestie insieme, e tre minuti da resistere.' },
]

const TUTTI = ['melma', 'pipistrello', 'moscerino', 'fungo', 'ragno',
               'spettro', 'cinghiale', 'roccia', 'colosso']

// `portata` (0-100, docs/apprendimento/eta-e-portata.md): niente
// `scuola` qui, si taglia solo in alto.
export const CAMPAGNA = [
  { chiave: 'prato', nome: 'Il prato verde', scenario: 'prato', scalino: 'prati',
    portata: 12,
    durata: 45, ritmo: 1.44, vigore: 1.15, fretta: 1.20, rincaro: 0,
    squadra: ['melma'],
    racconto: 'Melme lente e niente altro. Basta non farsi toccare.' },
  { chiave: 'radura', nome: 'La radura', scenario: 'bosco', scalino: 'prati',
    portata: 15,
    durata: 60, ritmo: 1.30, vigore: 1.21, fretta: 0.95, rincaro: 0,
    squadra: ['melma', 'pipistrello'],
    racconto: 'I pipistrelli sono svelti, ma vanno giù con una freccia.' },
  { chiave: 'lucciole', nome: 'La notte delle lucciole', scenario: 'notte', scalino: 'prati',
    portata: 18,
    durata: 75, ritmo: 1.30, vigore: 1.31, fretta: 0.97, rincaro: 0.03,
    squadra: ['melma', 'pipistrello', 'moscerino'],
    racconto: 'Al buio arrivano gli sciami. Non stare fermo.' },

  { chiave: 'pantano', nome: 'Il pantano', scenario: 'palude', scalino: 'fitto',
    portata: 30,
    durata: 90, ritmo: 1.24, vigore: 1.43, fretta: 0.99, rincaro: 0.05,
    squadra: ['melma', 'pipistrello', 'moscerino', 'fungo'],
    racconto: 'I funghi hanno la pelle dura: serve qualcosa che picchi.' },
  { chiave: 'grotta', nome: 'La grotta', scenario: 'grotta', scalino: 'fitto',
    portata: 35,
    // il vigore era 1.70 (come le dune): coi ragni a 37s la grotta era un
    // avvallamento misurato al banco (63% contro l'80% delle due tappe dopo)
    durata: 105, ritmo: 1.14, vigore: 1.58, fretta: 1.00, rincaro: 0.05,
    squadra: ['melma', 'pipistrello', 'moscerino', 'fungo', 'ragno', 'spettro'],
    racconto: 'I ragni ti raggiungono: scappare dritto non basta più.' },
  { chiave: 'dune', nome: 'Le dune', scenario: 'deserto', scalino: 'fitto',
    portata: 40,
    durata: 125, ritmo: 1.04, vigore: 1.70, fretta: 1.01, rincaro: 0.08,
    squadra: ['melma', 'pipistrello', 'moscerino', 'fungo', 'ragno', 'spettro', 'cinghiale'],
   
    racconto: 'Due minuti e mezzo sotto il sole, e arrivano i cinghiali.' },

  { chiave: 'ghiacciaio', nome: 'Il ghiacciaio', scenario: 'neve', scalino: 'lontano',
    portata: 55,
    // il vigore era 1.82: col riscaldamento (CFG.avvio) il ghiacciaio
    // perdeva una manciata di vittorie al banco, le altre tappe no
    durata: 145, ritmo: 0.97, vigore: 1.76, fretta: 1.02, rincaro: 0.10,
    squadra: TUTTI, cuori: 4,
    racconto: 'Le rocce camminano piano ma non muoiono quasi mai.' },
  { chiave: 'fonda', nome: 'La palude fonda', scenario: 'palude', scalino: 'lontano',
    portata: 60,
    durata: 165, ritmo: 0.90, vigore: 1.98, fretta: 1.03, rincaro: 0.12,
    squadra: TUTTI, cuori: 4,
    racconto: 'Qui non basta scappare: bisogna aver scelto bene le carte.' },
  { chiave: 'tana', nome: 'La tana', scenario: 'grotta', scalino: 'lontano',
    portata: 65,
    durata: 185, ritmo: 0.85, vigore: 2.06, fretta: 1.04, rincaro: 0.15,
    squadra: TUTTI, cuori: 4,
    racconto: 'Quasi quattro minuti, e in fondo c\'è il colosso.' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

export const tappa = indice =>
  CAMPAGNA[Math.max(0, Math.min(indice, CAMPAGNA.length - 1))]

// Il gioco libero: non finisce, e ha tutto dentro dal primo minuto.
// `durata: Infinity` è la riga che il motore legge (Regole.infinita) per
// sapere che qui il mazzo delle carte non ha tetto (vedi mazzo.js, `resa`).
export const LIBERO = {
  chiave: 'libero', nome: 'Sopravvivenza', scenario: 'notte', scalino: null,
  durata: Infinity, ritmo: 1.20, vigore: 1.90, fretta: 1.05, rincaro: 0.08,
  squadra: TUTTI,
  racconto: 'Non finisce: si va avanti finché si resiste.',
}

export const tappeDelloScalino = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.scalino === chiave)

export function guastiDellaCampagna(campagna = CAMPAGNA, scenari, mostri) {
  const guasti = []
  const viste = new Set()
  for (const [i, t] of campagna.entries()) {
    const dove = `tappa ${i + 1} ("${t.chiave}")`
    if (viste.has(t.chiave)) guasti.push(`${dove}: chiave ripetuta`)
    viste.add(t.chiave)
    if (!t.nome || !t.racconto) guasti.push(`${dove}: senza nome o senza racconto`)
    if (scenari && !scenari[t.scenario]) guasti.push(`${dove}: lo scenario "${t.scenario}" non esiste`)
    if (!SCALINI.some(s => s.chiave === t.scalino)) guasti.push(`${dove}: scalino "${t.scalino}" sconosciuto`)
    if (!(t.durata >= 20 && t.durata <= 240))
      guasti.push(`${dove}: ${t.durata} secondi non sono una partita per un bambino`)
    for (const k of ['ritmo', 'vigore', 'fretta'])
      if (!(t[k] > 0)) guasti.push(`${dove}: ${k} vale ${t[k]}`)
    if (!(t.rincaro >= 0 && t.rincaro <= 0.3))
      guasti.push(`${dove}: rincaro ${t.rincaro} — le domande diventano un'altra cosa`)
    if (!(t.squadra?.length)) guasti.push(`${dove}: nessun mostro in squadra`)
    if (mostri) for (const k of t.squadra || [])
      if (!mostri[k]) guasti.push(`${dove}: il mostro "${k}" non esiste`)
    if (mostri && !(t.squadra || []).some(k => mostri[k]?.da === 0))
      guasti.push(`${dove}: nessun mostro comincia insieme alla tappa`)
  }
  // quello che deve crescere è la piena al traguardo (quanti nascono e
  // quanto sono duri), non i moltiplicatori uno per uno
  const marea = t => t.durata / CFG.tappaTipo
  const piena = t => CFG.natePerSecondo(marea(t)) * t.ritmo
  const durezza = t => CFG.vitaNemico(marea(t)) * t.vigore
  for (let i = 1; i < campagna.length; i++) {
    if (campagna[i].durata < campagna[i - 1].durata)
      guasti.push(`tappa ${i + 1}: dura meno della precedente`)
    if (piena(campagna[i]) <= piena(campagna[i - 1]))
      guasti.push(`tappa ${i + 1}: al traguardo ne nascono ${piena(campagna[i]).toFixed(2)} al secondo, ` +
                  `meno della precedente (${piena(campagna[i - 1]).toFixed(2)})`)
    if (durezza(campagna[i]) <= durezza(campagna[i - 1]))
      guasti.push(`tappa ${i + 1}: al traguardo i mostri sono più molli della tappa prima`)
    if (campagna[i].scenario === campagna[i - 1].scenario)
      guasti.push(`tappa ${i + 1}: stesso vestito della precedente ("${campagna[i].scenario}")`)
    if ((campagna[i].squadra || []).length < (campagna[i - 1].squadra || []).length)
      guasti.push(`tappa ${i + 1}: la squadra dei mostri si è ristretta`)
  }
  const ordine = SCALINI.map(s => s.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.scalino))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1]))
    guasti.push('gli scalini non sono in fila')
  for (const s of SCALINI)
    if (!campagna.some(t => t.scalino === s.chiave))
      guasti.push(`lo scalino "${s.chiave}" non ha nemmeno una tappa`)
  if (campagna[0].squadra.length > 1)
    guasti.push('la prima tappa comincia già con due mostri diversi')
  return guasti
}
