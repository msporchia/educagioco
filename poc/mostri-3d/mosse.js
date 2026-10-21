// Le mosse dei mostri: dati puri (niente three.js). Regola in poc/mostri-3d/MOSSE.md.
//   comuni 1 mossa · forti e boss 2 · super boss 3. Tipi: attacco, cura, incantesimo, urlo.
// MOSSE[chiave] = [{ id, nome, tipo, peso, ... }] scritte a mano; `mosseDi(voce)` le dà per qualunque voce di elenco
// (se la chiave non ha una riga, le ricava da ruolo, specie ed elemento). Le animazioni stanno in mosse-anim.js.

export const RUOLI = ['comune', 'forte', 'boss', 'superboss']
export const N_MOSSE = { comune: 1, forte: 2, boss: 2, superboss: 3 }

/** Cosa dice ogni tipo di mossa: aspetto sullo schermo (icona e colore dell'alone che avvisa) e numeri di gioco. */
export const TIPI = {
  attacco: { icona: 'spada', colore: 0xff5a4a, mod: 1, attesa: 1, nota: 'colpisce' },
  cura: { icona: 'croce', colore: 0x6ee06a, quota: 0.12, attesa: 1, nota: 'recupera poca vita' },
  incantesimo: { icona: 'stella', colore: 0xb27cf2, mod: 0.7, attesa: 1, ignoraScudo: true, nota: 'colpo magico a distanza' },
  urlo: { icona: 'urlo', colore: 0xffc83a, piu: 0.25, turni: 3, attesa: 1, nota: 'alza il suo attacco per qualche turno' },
}
/** Quanto pesa ciascun tipo di mossa nella scelta, e quante volte per scontro al massimo (il resto sta nelle singole mosse). */
export const PESI = { attacco: 4, 'attacco-forte': 2, incantesimo: 2, urlo: 2, cura: 6 }
export const MAX_CURE = { comune: 0, forte: 1, boss: 1, superboss: 2 }
export const COLORE_ELEMENTO = { fisico: 0xcdb8ff, fuoco: 0xe8742f, gelo: 0x58b4e6, fulmine: 0xb98af0, veleno: 0x7cc94a, sacro: 0xffe08a }
/** Elemento → effetto magico (poc/effetti-3d/lancio.js) e tinta. Il fisico, per un incantesimo, è arcano (viola). */
export const INCANTESIMO_DI = {
  fuoco: { effetto: 'palla', elemento: 'fuoco' }, gelo: { effetto: 'scheggia', elemento: 'gelo' }, fulmine: { effetto: 'fulmine', elemento: 'fulmine' },
  veleno: { effetto: 'dardo', elemento: 'veleno' }, sacro: { effetto: 'dardo', elemento: 'sacro' }, fisico: { effetto: 'dardo', elemento: 'fulmine' },
}
export const NOMI_ATTACCO = {
  morso: 'Morso', zampata: 'Zampata', 'colpo-arma': 'Colpo', schianto: 'Schianto', carica: 'Carica', pungiglione: 'Puntura', becco: 'Beccata',
  'volo-radente': 'Volo radente', tocco: 'Tocco', ala: 'Colpo d\'ala', coda: 'Colpo di coda', sputo: 'Sputo', soffio: 'Soffio', schizzo: 'Schizzo',
}

// ───────── le mosse scritte a mano ─────────
// via: 'principale' = l'attacco che il mostro ha già (userData.attacco/attacca); 'carica' 'balzo' 'impennata' 'scatto' 'schianto' = quell'attacco
// più un movimento di tutto il corpo; `attacca: 'coda'` = una variante del drago. `colpo`: il segno sull'eroe (SEGNO_COLPO di arena-3d/dati.js).
// peso = quanto spesso, condizione = quando è possibile, max = quante volte per scontro. `perche` = la ragione di specie (una riga).
const att = (id, nome, o = {}) => ({ id, nome, tipo: 'attacco', peso: 4, via: 'principale', ...o })
const forte = (id, nome, via, o = {}) => ({ id, nome, tipo: 'attacco', peso: 2, via, mod: 1.4, attesa: 1.5, ...o })
const cura = (id, nome, o = {}) => ({ id, nome, tipo: 'cura', peso: PESI.cura, condizione: 'sotto-meta', max: 1, ...o })
const inc = (id, nome, elemento, o = {}) => ({ id, nome, tipo: 'incantesimo', peso: PESI.incantesimo, elemento, ...INCANTESIMO_DI[elemento], ...o })
const urlo = (id, nome, o = {}) => ({ id, nome, tipo: 'urlo', peso: PESI.urlo, max: 2, condizione: 'non-rinforzato', ...o })

export const MOSSE = {
  // ── forti (2) ──
  'scheletro-scudo': [
    att('fendente', 'Fendente', { perche: 'la spada del caporale, come prima' }),
    cura('ricompone', 'Si ricompone', { perche: 'le ossa tornano al loro posto: poca vita, ma lenta e ben visibile', colore: 0xe8e0c0 }),
  ],
  orco: [
    att('mazzata', 'Mazzata', { perche: 'la mazza chiodata, come prima' }),
    urlo('urlo-guerra', 'Urlo di guerra', { perche: 'l\'orco si carica urlando: il prossimo colpo pesa di più' }),
  ],
  'cinghiale-caporale': [
    att('zannata', 'Zannata', { perche: 'la zanna di sempre' }),
    forte('carica-testa', 'Carica a testa bassa', 'carica', { colpo: 'carica', durata: 1.0, arrivo: 0.55, perche: 'un cinghiale carica: più forte, ma ci mette il doppio a ripartire' }),
  ],
  'lupo-capo': [
    att('morso', 'Morso', { perche: 'il morso del capobranco' }),
    urlo('ululato', 'Ululato', { piu: 0.2, perche: 'chiama il branco con la voce: si rinforza, non arrivano rinforzi veri (lo scontro non ne ha)' }),
  ],
  'mostro-verde': [
    att('pugno', 'Pugno di muschio', { perche: 'il pugno di sempre' }),
    cura('radici', 'Radici rigeneranti', { colore: 0x8bd05a, elemento: 'veleno', perche: 'cura naturale: affonda le radici e ricresce' }),
  ],
  tartaruga: [
    att('morso', 'Morso', { perche: 'il becco di sempre' }),
    inc('getto', 'Getto d\'acqua', 'gelo', { perche: 'spruzza un getto gelido a distanza: il guscio non para un getto' }),
  ],
  // ── boss (2) ──
  orso: [
    att('zampata', 'Zampata', { perche: 'la zampata di sempre' }),
    urlo('ruggito', 'Ruggito', { piu: 0.3, perche: 'si rizza e ruggisce: spaventa, il colpo dopo pesa di più' }),
  ],
  'drago-fiero': [
    att('artigliata', 'Artigliata', { via: 'principale', perche: 'il balzo con gli artigli' }),
    inc('fiammata', 'Palla di fuoco', 'fuoco', { mod: 0.75, perche: 'il drago di lava sputa una palla di fuoco: lo scudo non la ferma' }),
  ],
}

// i draghi grandi: super boss, 3 mosse (soffio, colpo di coda, e una speciale a seconda del colore)
const DRAGHI = {
  rosso: { soffio: 'Soffio di fiamme', coda: 'Colpo di coda', speciale: inc('sfera-fuoco', 'Sfera infuocata', 'fuoco', { perche: 'un incantesimo di fiamma a distanza' }) },
  azzurro: { soffio: 'Soffio di gelo', coda: 'Colpo di coda', speciale: inc('scheggia-gelo', 'Schegge di ghiaccio', 'gelo', { perche: 'un incantesimo di gelo a distanza' }) },
  nero: { soffio: 'Soffio di tenebra', coda: 'Colpo di coda', speciale: inc('saetta', 'Saetta nera', 'fulmine', { perche: 'una saetta a distanza' }) },
  verde: { soffio: 'Soffio velenoso', coda: 'Colpo di coda', speciale: cura('linfa', 'Linfa del bosco', { quota: 0.15, max: 2, elemento: 'veleno', colore: 0x8bd05a, perche: 'il drago del bosco si cura con la linfa' }) },
  oro: { soffio: 'Soffio di luce', coda: 'Colpo di coda', speciale: cura('luce-risana', 'Luce che risana', { quota: 0.15, max: 2, elemento: 'sacro', colore: 0xffe08a, perche: 'il drago d\'oro si cura con la luce' }) },
}
for (const [c, d] of Object.entries(DRAGHI)) {
  MOSSE['drago-' + c] = [
    att('soffio', d.soffio, { attacca: 'soffio', peso: 4, perche: 'il soffio, l\'attacco di sempre' }),
    forte('coda', d.coda, 'principale', { attacca: 'coda', colpo: 'coda', area: true, mod: 1.2, attesa: 1.25, peso: 2, perche: 'la coda spazza tutto il davanti: più corta e più bassa del soffio' }),
    d.speciale,
  ]
}

// ───────── il ruolo ─────────
/** Chi non dichiara `ruolo` (i vecchi elenchi) si deduce: i caporali scritti qui, poi la taglia. */
const RUOLI_NOTI = {
  'scheletro-scudo': 'forte', orco: 'forte', 'cinghiale-caporale': 'forte', 'lupo-capo': 'forte', 'mostro-verde': 'forte', tartaruga: 'forte',
  orso: 'boss', 'drago-fiero': 'boss',
  'drago-rosso': 'superboss', 'drago-azzurro': 'superboss', 'drago-nero': 'superboss', 'drago-verde': 'superboss', 'drago-oro': 'superboss',
}
export function ruoloDi (voce) {
  if (voce.ruolo && RUOLI.includes(voce.ruolo)) return voce.ruolo
  if (RUOLI_NOTI[voce.chiave]) return RUOLI_NOTI[voce.chiave]
  if (voce.taglia === 'enorme') return 'boss'
  if (voce.taglia === 'grande' && (voce.forza || 0) >= 3) return 'forte'
  return 'comune'
}

// ───────── specie ed elemento (per ricavare le mosse di chi non ha una riga) ─────────
const SPECIE = [
  ['drago', /drago|viverna|lucertola|wyvern/], ['vegetale', /muschio|ent\b|albero|pianta|fungo|rovo|golem-?(di-)?(muschio|legno)|barbamuschio/],
  ['bestia', /lupo|orso|cinghiale|toro|bestia|cornut|minot|tigre|leone|cane|iena|gatt|felin|grifone|yeti|troll/], ['acqua', /tartaruga|granchio|polpo|rana|rospo|coccodrillo|idra|gorgo|sanguisuga|airone|squal|pesce/],
  ['morto', /fantasma|spettro|ombra|mummia|ghoul|teschio|mietitore|negromante|lich|vampir/], ['umanoide', /orco|goblin|scheletro|zombie|gigante|cavalier|mago|re-|brigante|ladro|nano|elfo/],
]
export function specieDi (voce) {
  const s = `${voce.chiave || ''} ${voce.nome || ''}`.toLowerCase().replace(/\s+/g, '-')
  for (const [n, re] of SPECIE) if (re.test(s)) return n
  return 'bestia'
}
const ELEMENTI_RE = [['fuoco', /lava|fuoco|fiamm|cener|magma|brace|diavol|rosso/], ['gelo', /gelo|ghiacc|neve|brina|yeti|azzurr/], ['fulmine', /fulmin|tempest|elettric|saetta|nero/],
  ['veleno', /veleno|serpent|ragno|fungo|palude|rospo|rana|verde|muschio|linfa/], ['sacro', /sacro|angel|oro\b|luce|santo/]]
export function elementoDi (voce) {
  if (voce.elemento && INCANTESIMO_DI[voce.elemento]) return voce.elemento
  if (voce.elem && INCANTESIMO_DI[voce.elem]) return voce.elem
  const s = `${voce.chiave || ''} ${voce.nome || ''}`.toLowerCase()
  for (const [e, re] of ELEMENTI_RE) if (re.test(s)) return e
  return 'fisico'
}

/** La mossa generica di un tipo per una voce: serve alla pagina (`mossa=cura`) e per ricavare le mosse mancanti. */
export function mossaGenerica (tipo, voce, id) {
  const e = elementoDi(voce)
  switch (tipo) {
    case 'cura': return cura(id || 'cura', 'Si cura', { elemento: e === 'fisico' ? 'sacro' : e, perche: 'generica' })
    case 'incantesimo': return inc(id || 'incantesimo', e === 'fuoco' ? 'Palla di fuoco' : e === 'gelo' ? 'Schegge di gelo' : e === 'fulmine' ? 'Saetta' : e === 'veleno' ? 'Dardo velenoso' : e === 'sacro' ? 'Dardo di luce' : 'Dardo arcano', e, { perche: 'generica' })
    case 'urlo': return urlo(id || 'urlo', 'Urlo', { perche: 'generica' })
    case 'attacco-forte': return forte(id || 'colpo-forte', 'Colpo pesante', 'schianto', { colpo: 'schianto', area: false, perche: 'generica' })
    default: return att(id || 'attacco', null)
  }
}

/** Le mosse di una voce di elenco, nell'ordine in cui compaiono nei pulsanti (la prima è sempre l'attacco di sempre). */
export function mosseDi (voce) {
  if (MOSSE[voce.chiave]) return MOSSE[voce.chiave].map(m => ({ ...TIPI[m.tipo], ...m }))
  const ruolo = ruoloDi(voce), sp = specieDi(voce), e = elementoDi(voce)
  const L = [att('attacco', null)]
  if (ruolo === 'comune') return L.map(m => ({ ...TIPI[m.tipo], ...m }))
  if (ruolo === 'forte') {
    L.push(sp === 'vegetale' ? { ...mossaGenerica('cura', voce, 'rigenera'), nome: 'Rigenera' }
      : sp === 'umanoide' ? mossaGenerica('urlo', voce, 'urlo')
      : sp === 'acqua' || sp === 'morto' || sp === 'drago' ? mossaGenerica('incantesimo', voce, 'incanto')
      : forte('carica', 'Carica', 'carica', { colpo: 'carica', durata: 1.0, arrivo: 0.55 }))
  } else if (ruolo === 'boss') {
    L.push(sp === 'vegetale' ? mossaGenerica('cura', voce, 'rigenera') : sp === 'bestia' ? { ...mossaGenerica('urlo', voce, 'ruggito'), nome: 'Ruggito', piu: 0.3 } : mossaGenerica('incantesimo', voce, 'incanto'))
  } else {   // super boss: l'attacco, un secondo colpo ravvicinato (in area) e una speciale: incantesimo, o cura per sacro e veleno
    L.push(forte('schianto', 'Schianto', 'schianto', { colpo: 'schianto', area: true, mod: 1.2, attesa: 1.25 }))
    L.push(e === 'sacro' || e === 'veleno' ? { ...mossaGenerica('cura', voce, 'cura'), quota: 0.15, max: 2 } : mossaGenerica('incantesimo', voce, 'incanto'))
  }
  return L.map(m => ({ ...TIPI[m.tipo], ...m }))
}

// ───────── come il mostro sceglie ─────────
/** Lo stato che serve alla scelta: tutto quello che il gioco sa a inizio turno del mostro. */
export const statoIniziale = () => ({ vita: 1, vitaMax: 1, usate: {}, ultima: null, rinforzo: 0, protetto: false, cure: 0 })
const OK = {
  'sotto-meta': s => s.vita < s.vitaMax * 0.5 && s.vita > 0,
  'non-rinforzato': s => !(s.rinforzo > 0),
}
/** Il peso di una mossa adesso (0 = non si può). `mosse` serve per i tetti per ruolo. */
export function pesoMossa (m, s, ruolo = 'forte') {
  if (m.condizione && !(OK[m.condizione] || (() => true))(s)) return 0
  const fatte = s.usate[m.id] || 0
  if (m.tipo === 'cura' && (fatte >= (m.max ?? 1) || (s.cure || 0) >= MAX_CURE[ruolo])) return 0
  if (m.max != null && fatte >= m.max) return 0
  let w = m.peso ?? 1
  if (m.tipo === 'incantesimo' && s.protetto) w *= 2.5   // l'eroe ha lo scudo o la parata: l'incantesimo li ignora
  return w
}
/** Sceglie. Mai due volte di fila la stessa se ce ne sono altre possibili; se non si può nient'altro, l'attacco. `rnd` ∈ [0,1). */
export function scegliMossa (mosse, s, rnd = Math.random, ruolo = 'forte') {
  if (mosse.length === 1) return mosse[0]
  let pesi = mosse.map(m => pesoMossa(m, s, ruolo))
  // mai due volte di fila la stessa, ma l'attacco semplice può ripetersi: senza, un mostro con due mosse alternerebbe a rigore e dimezzerebbe il suo colpo
  const ripetibile = m => m.tipo === 'attacco' && (m.via || 'principale') === 'principale' && (m.mod ?? 1) <= 1
  const blocca = (m, i) => m.id === s.ultima && !ripetibile(m) && pesi[i] > 0
  if (mosse.some((m, i) => !blocca(m, i) && pesi[i] > 0)) pesi = pesi.map((w, i) => (blocca(mosse[i], i) ? 0 : w))
  const tot = pesi.reduce((a, b) => a + b, 0)
  if (tot <= 0) return mosse[0]
  let r = rnd() * tot
  for (let i = 0; i < mosse.length; i++) { r -= pesi[i]; if (r < 0) return mosse[i] }
  return mosse[0]
}
/** Registra la scelta nello stato (le volte usate, l'ultima, il rinforzo che cala di un turno a ogni mossa del mostro). */
export function registra (s, m) {
  s.usate[m.id] = (s.usate[m.id] || 0) + 1; s.ultima = m.id
  if (s.rinforzo > 0) s.rinforzo--
  if (m.tipo === 'cura') s.cure = (s.cure || 0) + 1
  if (m.tipo === 'urlo') s.rinforzo = m.turni ?? 3
  return s
}
/** I numeri di una mossa per il gioco: moltiplicatore del colpo, vita recuperata (in ossa), quanto aspetta dopo. `att` = colpo base del mostro. */
export function numeriDi (m, { att = 3, vitaMax = 8, rinforzo = 0 } = {}) {
  const piu = rinforzo > 0 ? 1.25 : 1
  if (m.tipo === 'cura') return { colpo: 0, recupero: Math.max(1, Math.round(vitaMax * (m.quota ?? 0.12))), attesa: m.attesa ?? 1, ignoraScudo: false }
  if (m.tipo === 'urlo') return { colpo: 0, recupero: 0, attesa: m.attesa ?? 1, ignoraScudo: false, rinforza: m.piu ?? 0.25, turni: m.turni ?? 3 }
  return { colpo: att * (m.mod ?? 1) * piu, recupero: 0, attesa: m.attesa ?? 1, ignoraScudo: !!m.ignoraScudo, area: !!m.area }
}
