// La campagna: sei discese, stesso motore con altri numeri. La roba resta fra una discesa e l'altra, e le
// discese dopo la prima contano su di lei: `forza` moltiplica le ossa di tutti, `spinta` aggiunge al loro
// attacco, misurati col giocatore finto che si porta dietro lo zaino (docs/sotterraneo/regole.md). `dif` sono
// i due estremi 0..1, si sale in linea retta (durezzaDi) più il rincaro per stanza (motore/corsa.js). `giri`
// è il numero di tagli del BSP (2 → quattro stanze, 4 → sedici).
// `portata`: niente `scuola` qui, quello che insegna questa campagna non lo dà nessuna scuola.
import { BRANCO, BRANCHI } from './mostri.js'

export const CAMPAGNA = [
  { chiave: 'cantine', nome: 'La scalinata antica', icona: '🕯️',
    scenario: 'cantine',
    portata: 25,
    dritta: 'due piani corti: si impara la strada',
    piani: 2, misura: 30, giri: 2, dif: [0.05, 0.22],
    guardiano: 'scheletro', capo: 'scheletro' },

  { chiave: 'pozzo', nome: 'Il pozzo dal tetto rosso', icona: '🪣',
    scenario: 'cantine',
    portata: 32,
    dritta: 'più stanze, e qualcuno che vende',
    piani: 3, misura: 34, giri: 3, dif: [0.12, 0.34], forza: 1.3, spinta: 1,
    guardiano: 'scheletro', capo: 'orco' },

  { chiave: 'gallerie', nome: 'La grotta della scaletta', icona: '🪨',
    scenario: 'cripta',
    portata: 40,
    dritta: 'ci si picchia sul serio',
    piani: 3, misura: 40, giri: 3, dif: [0.22, 0.5], forza: 1.6, spinta: 2,
    guardiano: 'orco', capo: 'orco' },

  { chiave: 'cisterna', nome: 'La scala sommersa', icona: '💧',
    scenario: 'cripta',
    portata: 48,
    dritta: 'larga, e in fondo c\'è qualcosa di grosso',
    piani: 4, misura: 44, giri: 3, dif: [0.32, 0.62], forza: 1.3, spinta: 2,
    // guardiano un granchio (non l'orco di sempre): stessa fascia (dati/mostri.js), ma nel posto giusto
    guardiano: 'granchio', capo: 'gigante' },

  { chiave: 'labirinto', nome: 'La botola segreta', icona: '🌀',
    scenario: 'fornace',
    portata: 56,
    dritta: 'un labirinto di sedici stanze: senza mappina ci si perde',
    piani: 3, misura: 52, giri: 4, dif: [0.42, 0.76], forza: 1.8, spinta: 2,
    guardiano: 'lupo', capo: 'troll' },   // troll e non gigante: le ultime tre finivano con la stessa faccia

  { chiave: 'fondo', nome: 'La miniera abbandonata', icona: '🕳️',
    scenario: 'fornace',
    portata: 64,
    dritta: 'stretta, profonda, e le domande non perdonano',
    piani: 4, misura: 42, giri: 3, dif: [0.52, 0.92], forza: 2.1, spinta: 2,   // stretto: più largo supererebbe le risposte obbligate di una seduta
    // il gigante solo in fondo (a ogni piano: 96 risposte obbligate, misurato dal banco); il serpente ai piani, non l'orco
    guardiano: 'serpente', capo: 'gigante' },
]

export const QUANTE_TAPPE = CAMPAGNA.length

// L'abisso: sotto il fondo, senza fondo. Non è la settima discesa (docs/sotterraneo/abisso.md): non entra
// in CAMPAGNA/QUANTE_TAPPE, non cresce `stelle`, si apre su `libera` (già scritto da giochi/campagne.js).
// L'indice è −1 (non un settimo posto): una fila che cresce sposterebbe l'avanzamento di tutti.
export const INDICE_ABISSO = -1

// la difficoltà sale scendendo e si ferma al tetto (2 anni sopra l'età, il tetto dell'ammissione) al quinto
// piano (0.92 · 0.94 · 0.96 · 0.98 · 1.00): da lì l'abisso non è più difficile da studiare, solo da sopravvivere
export const DIF_ABISSO = 0.92, DIF_PER_PIANO = 0.02
export const PIANO_DEL_TETTO = Math.ceil((1 - DIF_ABISSO) / DIF_PER_PIANO)  // 4, cioè il quinto

// tre per piano, riparte scendendo (non 2 + piani, che non ha senso senza un numero di piani); il freno
// vero sono le tasche, che svenendo si svuotano: chi sviene di continuo resta senza pozioni e si ferma da sé
export const SVENIMENTI_PER_PIANO = 3

// cicla invece di crescere: quello che allunga un piano non lo indurisce, o un sotterraneo grande sembra
// più difficile mentre è solo più lungo
const FORME_DELL_ABISSO = [
  { misura: 34, giri: 3 },
  { misura: 42, giri: 3 },
  { misura: 52, giri: 4 },
]

export const L_ABISSO = {
  chiave: 'abisso', nome: 'L\'abisso', icona: '🕳️',
  abisso: true,
  dritta: 'si scende finché si regge',
  piani: Infinity,   // rende allaScala() e scendi() incapaci di chiudere la discesa da soli
  misura: FORME_DELL_ABISSO[0].misura, giri: FORME_DELL_ABISSO[0].giri,
  forme: FORME_DELL_ABISSO,
  dif: [DIF_ABISSO, 1],
  // i primi due piani li guarda lo scheletro (misurato): si entra nudi, un orco subito vorrebbe dire
  // svenire due volte prima di trovare un'arma. Dopo la scaletta c'è un capo per sempre (guardianoDi)
  guardiani: ['scheletro', 'scheletro', 'orco', 'granchio', 'orco', 'golem', 'golem'],
  capo: 'gigante',
  // la difesa dell'eroe ha un tetto (l'attacco dei mostri no): lasciando crescere il piano e basta ci si
  // ferma sempre fra il settimo e l'undicesimo, perché i mostri fanno troppo male (misurato dal banco)
  attOgni: 3,
  // niente `portata`: il cancello non è l'età ma "hai finito le sei discese", dimostrato invece che stimato
}

// l'abisso cambia posto ogni PIANI_PER_TRATTO piani, e l'ultimo resta per sempre: il posto dice lo scenario (SCENARI in
// dati/tessere.js) e chi si incontra per strada (BRANCHI in dati/mostri.js); i guardiani restano la scaletta
// misurata. Vedi docs/sotterraneo/abisso.md.
export const TRATTI_DELL_ABISSO = [
  { scenario: 'cantine', nome: 'le cantine' },
  { scenario: 'cripta', nome: 'la cripta' },
  { scenario: 'fornace', nome: 'la fornace' },
]
export const PIANI_PER_TRATTO = 4

// il tratto del piano `piano` (da 0); null fuori dall'abisso
export const trattoDi = (tappa, piano) => (tappa && tappa.abisso
  ? TRATTI_DELL_ABISSO[Math.min(Math.floor(Math.max(0, piano) / PIANI_PER_TRATTO), TRATTI_DELL_ABISSO.length - 1)]
  : null)

// quale scenario si indossa: null è quello di ripiego (SCENARIO)
export const scenarioDi = (tappa, piano) => {
  const t = trattoDi(tappa, piano)
  return t ? t.scenario : (tappa && tappa.scenario) || null
}

// chi si incontra per strada: la campagna tutto il bestiario
export const brancoDi = (tappa, piano) => {
  const t = trattoDi(tappa, piano)
  return t ? BRANCHI[t.scenario] : BRANCO
}

// `CAMPAGNA[-1]` è undefined, e un undefined dentro una Corsa non dà errore: dà una discesa senza numeri
export const tappaDi = indice => (indice === INDICE_ABISSO ? L_ABISSO : CAMPAGNA[indice])

// nella campagna è quella dichiarata dalla tappa (non cambia mai); nell'abisso gira fra le tre
export function formaDi(tappa, piano) {
  if (!tappa.forme) return { misura: tappa.misura, giri: tappa.giri }
  return tappa.forme[((piano % tappa.forme.length) + tappa.forme.length) % tappa.forme.length]
}

// ossa è la leva principale (il bottino la compensa); l'attacco segue più piano o diventa una lotteria
export const OSSA_PER_PIANO = 0.22
export const crescitaDi = tappa => ({
  ossa: OSSA_PER_PIANO,
  attOgni: tappa && tappa.attOgni ? tappa.attOgni : 2,   // la campagna resta a 2: sono 4 piani al massimo, non le arriva addosso
  forza: (tappa && tappa.forza) || 1,     // le ossa di tutti, per la roba che ci si porta giù (docs/sotterraneo/regole.md)
  spinta: (tappa && tappa.spinta) || 0,   // e quanto picchiano in più
})

// un solo piano vuol dire un solo numero: il primo, non la media, perché è quello che il bambino vede appena entra
export function durezzaDi(tappa, piano) {
  const [da, a] = tappa.dif
  if (tappa.abisso) return Math.min(a, da + DIF_PER_PIANO * Math.max(0, piano))
  if (tappa.piani <= 1) return da
  const q = Math.max(0, Math.min(1, piano / (tappa.piani - 1)))
  return da + (a - da) * q
}

// due in regalo più uno per piano (da quattro nella scalinata a sei nella miniera): erano quattro, ma con la roba
// che resta chi risponde male si rialzava troppe volte con lo zaino pieno. Misurato su venti file per tappa
// (docs/sotterraneo/regole.md, "Svenire", e misure/sotterraneo)
export const SVENIMENTI_IN_REGALO = 2
// nell'abisso il conto si azzera scendendo: qui torna quante occasioni ha QUESTO piano (Corsa.svenimentiSpesi)
export const svenimentiDi = tappa =>
  tappa.abisso ? SVENIMENTI_PER_PIANO : SVENIMENTI_IN_REGALO + tappa.piani
// l'ultimo piano è il capo della tappa, gli altri il guardiano di tutti i giorni: l'unica cosa che non si può aggirare
export const guardianoDi = (tappa, piano) =>
  tappa.guardiani ? (tappa.guardiani[piano] || tappa.capo)
                  : (piano >= tappa.piani - 1 ? tappa.capo : tappa.guardiano)

export function stelleDella(esito) {
  if (!esito.vinta) return 0
  if (esito.svenimenti === 0) return 3
  if (esito.svenimenti === 1) return 2
  return 1
}

export function guastiDellaCampagna() {
  const g = []
  const viste = new Set()
  for (const t of CAMPAGNA) {
    if (viste.has(t.chiave)) g.push(`due tappe con la chiave "${t.chiave}"`)
    viste.add(t.chiave)
    if (!t.nome || !t.icona || !t.dritta) g.push(`${t.chiave}: senza nome, icona o dritta`)
    if (t.piani < 1) g.push(`${t.chiave}: zero piani`)
    if (t.misura < 24) g.push(`${t.chiave}: un piano ${t.misura}×${t.misura} non tiene le stanze`)
    if (t.giri < 2 || t.giri > 4) g.push(`${t.chiave}: ${t.giri} giri di taglio, fuori da 2..4`)
    const [da, a] = t.dif
    if (da < 0 || a > 1 || da > a) g.push(`${t.chiave}: difficoltà ${da}..${a} storta`)
    if (t.forza != null && !(t.forza >= 1 && t.forza <= 3)) g.push(`${t.chiave}: forza ${t.forza} fuori da 1..3`)
    if (t.spinta != null && !(t.spinta >= 0 && t.spinta <= 3)) g.push(`${t.chiave}: spinta ${t.spinta} fuori da 0..3`)
  }
  // la prima si comincia a mani nude: non può contare su una roba che nessuno ha ancora
  if ((CAMPAGNA[0].forza || 1) !== 1 || (CAMPAGNA[0].spinta || 0) !== 0)
    g.push(`${CAMPAGNA[0].chiave}: si scende a mani nude, niente forza né spinta`)
  // la campagna deve salire: due tappe di fila alla stessa difficoltà sembrano una ripetizione
  for (let i = 1; i < CAMPAGNA.length; i++)
    if (CAMPAGNA[i].dif[1] <= CAMPAGNA[i - 1].dif[1])
      g.push(`${CAMPAGNA[i].chiave} non chiede più di ${CAMPAGNA[i - 1].chiave}`)
  return g.concat(guastiDellAbisso())
}

// l'abisso non passa dal controllo delle tappe, ma una forma che il generatore non sa fare o una
// difficoltà fuori scala lo romperebbero in silenzio comunque
export function guastiDellAbisso() {
  const g = []
  const a = L_ABISSO
  if (!a.nome || !a.icona || !a.dritta) g.push('l\'abisso: senza nome, icona o dritta')
  for (const f of a.forme || []) {
    if (f.misura < 24) g.push(`l'abisso: un piano ${f.misura}×${f.misura} non tiene le stanze`)
    if (f.giri < 2 || f.giri > 4) g.push(`l'abisso: ${f.giri} giri di taglio, fuori da 2..4`)
  }
  if (!a.forme || !a.forme.length) g.push('l\'abisso: nessuna forma di piano')
  if (a.dif[0] < 0 || a.dif[1] > 1 || a.dif[0] > a.dif[1])
    g.push(`l'abisso: difficoltà ${a.dif[0]}..${a.dif[1]} storta`)
  // il tetto va toccato, e presto: se il passo fosse troppo piccolo la promessa qui sopra sarebbe falsa
  if (durezzaDi(a, PIANO_DEL_TETTO) < a.dif[1])
    g.push(`l'abisso: al piano ${PIANO_DEL_TETTO + 1} la difficoltà non è ancora al tetto`)
  if (!(a.guardiani || []).length || !a.guardiani.every(k => typeof k === 'string' && k))
    g.push('l\'abisso: la scaletta dei guardiani è vuota o storta')
  if (!a.capo) g.push('l\'abisso: nessun capo dopo la scaletta')
  if (a.attOgni < 3) g.push(`l'abisso: l'attacco cresce ogni ${a.attOgni} piani, troppo in fretta`)
  if (a.piani !== Infinity) g.push('l\'abisso ha un ultimo piano: non è più un abisso')
  if (!TRATTI_DELL_ABISSO.length) g.push('l\'abisso: nessun tratto')
  for (const t of TRATTI_DELL_ABISSO) {
    if (!t.scenario || !t.nome) g.push('l\'abisso: un tratto senza scenario o nome')
    else if (!BRANCHI[t.scenario]) g.push(`l'abisso: il tratto ${t.scenario} non ha un branco`)
  }
  if (PIANI_PER_TRATTO < 2) g.push(`l'abisso: ${PIANI_PER_TRATTO} piani per tratto, si cambia posto a ogni scala`)
  return g
}

