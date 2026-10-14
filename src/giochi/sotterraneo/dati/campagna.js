// La campagna: sette discese in fila (docs/sotterraneo/la-grande-storia.md), stesso motore con altri numeri. La roba resta fra una discesa e l'altra, e le
// discese dopo la prima contano su di lei: `forza` moltiplica le ossa di tutti, `spinta` aggiunge al loro
// attacco, misurati col giocatore finto che si porta dietro lo zaino (docs/sotterraneo/regole.md). `dif` sono
// i due estremi 0..1, si sale in linea retta (durezzaDi) più il rincaro per stanza (motore/corsa.js). `giri`
// è il numero di tagli del BSP (2 → quattro stanze, 4 → sedici); `largo` e `alto`, se ci sono, danno la forma
// al posto del quadrato `misura` (la torre alta e stretta, la scala sommersa lunga). `dove` è il posto in mezzo
// a una frase («sotto la torre non duri», motore/storia.js). `densita`: quante stanze hanno qualcuno, 1 di difetto e di norma assente (una stanza ordinaria su cinque è vuota, di più sotto 1: docs/sotterraneo/piani.md, «I mostri»); `tettoBranco`: quanti, al più,
// in un branco di quella discesa (cresce scendendo: 2 alla cripta, che è dove si impara, 3 alla scalinata e alla torre, 5 alla botola, 6 alla miniera e alla fornace dell'abisso); `pianta`: la famiglia dei piani, `costruita` (stanze a pianta, colonnati,
// nicchie) o `caverna` (grotte e passaggi storti); `acqua`: pozze da aggirare (docs/sotterraneo/piani-caverne.md).
// `portata`: niente `scuola` qui, quello che insegna questa campagna non lo dà nessuna scuola.
import { MOSTRI, costoInRisposte } from './mostri.js'

export const CAMPAGNA = [
  { chiave: 'altare', nome: 'La cripta dell\'altare', icona: '🕯️', dove: 'nella cripta',
    scenario: 'cripta', pianta: 'costruita',
    portata: 25,
    dritta: 'due piani di tombe, e qualcuno che non dorme',
    piani: 2, misura: 34, giri: 2, dif: [0.05, 0.22], forza: 0.25, livello: 1, gradi: 0,
    mostri: ['scheletro', 'zombie', 'fantasma'], caporale: 'scheletro-scudo', tettoBranco: 2, capo: 'scheletro' },

  { chiave: 'cantine', nome: 'La scalinata antica', icona: '🪜', dove: 'giù per la scalinata',
    scenario: 'cantine', pianta: 'costruita',
    portata: 31,
    dritta: 'tante stanze, e tutte al buio',
    piani: 2, misura: 46, giri: 4, dif: [0.12, 0.32], forza: 0.5, spinta: 2, livello: 2, caporali: 6, grosso: 3.5,   // senza forza: il primo avvio si vince anche a mani nude (docs/sotterraneo/la-grande-storia.md, «Il primo avvio»)
    mostri: ['ratto', 'goblin', 'melma'], caporale: 'orco', tettoBranco: 3, capo: 'orco' },

  // alta e stretta come la torre: le stanze una sopra l'altra
  { chiave: 'torre', nome: 'La torre in rovina', icona: '🏰', dove: 'sotto la torre',
    scenario: 'fornace', pianta: 'costruita',
    portata: 37,
    dritta: 'stretta e alta: le scale non finiscono mai',
    piani: 3, misura: 40, largo: 26, alto: 54, giri: 3, dif: [0.2, 0.44], forza: 0.5, spinta: 4, livello: 3, caporali: 6.5, grosso: 3.5,
    mostri: ['pipistrello', 'diavoletto', 'vespa', 'spirito-fuoco'], caporale: 'golem-magma', tettoBranco: 3, capo: 'troll' },

  // tutta in profondità: piani piccoli, tanti
  { chiave: 'gallerie', nome: 'La grotta della scaletta', icona: '🪨', dove: 'nella grotta',
    scenario: 'cantine', pianta: 'caverna',
    portata: 43,
    dritta: 'piani piccoli, uno sotto l\'altro, sempre più giù',
    piani: 5, misura: 28, giri: 2, dif: [0.28, 0.54], forza: 0.8, spinta: 6.5, livello: 5, caporali: 7, grosso: 4,
    mostri: ['ragno', 'fungo', 'pianta', 'melma-rosa'], caporale: 'mostro-verde', tettoBranco: 4, capo: 'orco' },

  // lunga e stretta: un canale sott'acqua
  { chiave: 'cisterna', nome: 'La scala sommersa', icona: '💧', dove: 'nella scala sommersa',
    scenario: 'cripta', pianta: 'caverna', acqua: true,
    portata: 50,
    dritta: 'lunga e stretta, e in fondo gorgoglia qualcosa',
    piani: 3, misura: 40, largo: 64, alto: 24, giri: 3, dif: [0.36, 0.66], forza: 1.1, spinta: 7.7, livello: 6, caporali: 6.5, grosso: 4,
    mostri: ['granchio', 'piranha', 'polpo', 'fantasma-azzurro'], caporale: 'tartaruga', tettoBranco: 4, capo: 'gigante' },

  { chiave: 'labirinto', nome: 'La botola segreta', icona: '🌀', dove: 'sotto la botola',
    scenario: 'cantine', pianta: 'costruita',
    portata: 57,
    dritta: 'un labirinto: senza mappina ci si perde',
    piani: 3, misura: 50, giri: 4, dif: [0.44, 0.78], forza: 1.25, spinta: 8.7, livello: 8, caporali: 6, grosso: 4,
    mostri: ['lupo', 'cinghiale', 'serpente', 'ent'], caporale: 'golem-muschio', tettoBranco: 5, capo: 'troll' },

  { chiave: 'fondo', nome: 'La miniera abbandonata', icona: '⛏️', dove: 'nella miniera',
    scenario: 'fornace', pianta: 'caverna',
    portata: 64,
    dritta: 'stretta, profonda, e le pietre bruciano',
    piani: 4, misura: 40, giri: 3, dif: [0.52, 0.92], forza: 1.8, spinta: 9.5, livello: 10, caporali: 6.5, grosso: 3.5,
    mostri: ['scorpione', 'golem', 'spirito-elettrico'], caporale: 'golem-lava', tettoBranco: 6, capo: 'gigante' },
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
  // il guardiano è la specie più dura della coppia del piano, fatta caporale (guardianoDi); `capo` serve solo a chi lo chiede
  capo: 'gigante',
  // l'esperienza dei mostri un terzo: i suoi mostri sono molto più deboli di quelli di una zona dello stesso livello, e
  // per domanda rendeva tre volte una zona verde (docs/sotterraneo/zone.md, «L'esperienza»): ci si fanno le ossa nelle zone
  esp: 1 / 3,
  // la difesa dell'eroe ha un tetto (l'attacco dei mostri no): lasciando crescere il piano e basta ci si
  // ferma sempre fra il settimo e l'undicesimo, perché i mostri fanno troppo male (misurato dal banco)
  attOgni: 3,
  forza: 2.2, spinta: 9, ossaPerPiano: 0.12,   // misurati col banco (docs/sotterraneo/abisso.md): chi parte nudo regge tre piani, e poi i mostri crescono più dell'eroe
  // niente `portata`: il cancello non è l'età ma "hai finito le sei discese", dimostrato invece che stimato
}

// l'abisso cambia posto ogni PIANI_PER_TRATTO piani, e l'ultimo resta per sempre: il posto dice lo scenario (SCENARI in
// dati/tessere.js) e chi si incontra per strada (`mostri`). Vedi docs/sotterraneo/abisso.md.
export const TRATTI_DELL_ABISSO = [
  { scenario: 'cantine', pianta: 'costruita', nome: 'le cantine', mostri: ['melma-viola', 'mostro-viola', 'pipistrello-occhio', 'ombra'], caporale: 'golem-ghiaccio', tettoBranco: 3 },
  { scenario: 'cripta', pianta: 'costruita', nome: 'la cripta', mostri: ['ghoul', 'teschio-azzurro', 'mummia'], caporale: 'mietitore', tettoBranco: 5 },
  { scenario: 'fornace', pianta: 'caverna', nome: 'la fornace', mostri: ['draghetto', 'occhio', 'golem-pietra', 'grifone'], caporale: 'drago', tettoBranco: 6 },
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

// la famiglia dei piani: nella storia quella dichiarata dalla discesa, nell'abisso quella del tratto (la fornace è una grotta)
export const piantaDi = (tappa, piano) => {
  const t = trattoDi(tappa, piano)
  return (t ? t.pianta : tappa && tappa.pianta) || 'costruita'
}
// quante stanze hanno qualcuno (`densita`): nella storia quello della discesa, nell'abisso quello del tratto
export const densitaDi = (tappa, piano) => {
  const t = trattoDi(tappa, piano)
  return (t ? t.densita : tappa && tappa.densita) || 1
}
// le pozze d'acqua: solo dove la discesa le dichiara (la scala sommersa)
export const conAcquaDi = (tappa, piano) => !trattoDi(tappa, piano) && !!(tappa && tappa.acqua)

// Gli abitanti del piano (docs/sotterraneo/mostri.md, «Gli abitanti»): da due a quattro creature scelte per ambientazione, come in
// Diablo, e sempre quelle: nella storia la lista `mostri` della discesa, nelle zone la stessa (una zona è la discesa con un volto
// nuovo), nell'abisso quella del tratto. Una creatura sta in un posto solo. Chi la legge ha sempre il suo posto: la grotta dei
// ragni e dei funghi, la scala dei granchi e dei polpi
export const brancoDi = (tappa, piano) => {
  const t = trattoDi(tappa, piano)
  return t ? t.mostri : tappa.mostri
}
// il caporale del posto: la creatura che fa da caporale nell'anticamera del grosso e da guardiano della chiave
export const caporaleDi = (tappa, piano) => {
  const t = trattoDi(tappa, piano)
  return t ? t.caporale : tappa.caporale
}
// quanti, al più, in un branco (un gruppo grande picchia tutto insieme: dove i mostri sono molti o veloci si tiene corto)
export const tettoDelBrancoDi = (tappa, piano) => {
  const t = trattoDi(tappa, piano)
  return (t ? t.tettoBranco : tappa.tettoBranco) || 4
}

// Il livello del posto (docs/sotterraneo/livelli.md): quello di partenza della discesa, uno in più ogni due piani;
// l'abisso comincia da LIVELLO_ABISSO e sale di uno a piano, senza tetto. Dice il livello del bottino (col livello
// dell'eroe, motore/bottino.js) e quanto valgono le gemme che si trovano
export const LIVELLO_ABISSO = 12
export const livelloDelPosto = (tappa, piano) => (!tappa ? 1
  : tappa.abisso ? LIVELLO_ABISSO + Math.max(0, piano)
    : (tappa.livello || 1) + Math.floor(Math.max(0, piano) / 2))

// `CAMPAGNA[-1]` è undefined, e un undefined dentro una Corsa non dà errore: dà una discesa senza numeri
export const tappaDi = indice => (indice === INDICE_ABISSO ? L_ABISSO : CAMPAGNA[indice])

// nella campagna è quella dichiarata dalla tappa (non cambia mai); nell'abisso gira fra le tre
export function formaDi(tappa, piano) {
  const f = tappa.forme
    ? tappa.forme[((piano % tappa.forme.length) + tappa.forme.length) % tappa.forme.length]
    : tappa
  return { misura: f.misura, giri: f.giri, largo: f.largo || f.misura, alto: f.alto || f.misura }
}

// ossa è la leva principale (il bottino la compensa); l'attacco segue più piano o diventa una lotteria
export const OSSA_PER_PIANO = 0.22
export const crescitaDi = tappa => ({
  ossa: (tappa && tappa.ossaPerPiano) || OSSA_PER_PIANO,   // l'abisso cresce più in fretta della campagna (ossaPerPiano)
  attOgni: tappa && tappa.attOgni ? tappa.attOgni : 2,   // la campagna resta a 2: sono 4 piani al massimo, non le arriva addosso
  forza: (tappa && tappa.forza) || 1,     // le ossa di tutti, per la roba che ci si porta giù (docs/sotterraneo/regole.md)
  spinta: (tappa && tappa.spinta) || 0,   // e quanto picchiano in più
  caporali: (tappa && tappa.caporali) || 0,   // le ossa di un caporale rispetto a quelle di strada (0: CAPORALE.ossa) e del grosso rispetto alla sua tabella (docs/sotterraneo/mostri.md, «Quanto chiede»)
  grosso: (tappa && tappa.grosso) || 0,
  gradi: tappa && tappa.gradi != null ? tappa.gradi : 1,   // quanto pesa il grado di un mostro (0 nella cripta, dove si impara)
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
// l'ultimo piano è il capo della tappa (nella storia lo sostituisce il mostro grosso), gli altri hanno il guardiano di tutti i
// giorni, l'unica cosa che non si può aggirare: il caporale del posto, fatto caporale (motore/livello.js)
export const guardianoDi = (tappa, piano) =>
  (piano >= tappa.piani - 1 ? tappa.capo : caporaleDi(tappa, piano))

export function stelleDella(esito) {
  if (!esito.vinta) return 0
  if (esito.svenimenti === 0) return 3
  if (esito.svenimenti === 1) return 2
  return 1
}

// gli abitanti di un posto: da due a quattro creature di strada (mai un capo) e un caporale che non sta anche per strada. Dentro il
// posto si costa uguale, entro il 15%, con gli attacchi che un eroe ha da quella discesa in poi (da 8 in su: sotto, la difesa di uno
// e non dell'altro pesa troppo); la cripta, che si scende a mani nude, ha tutti la stessa difesa
export function guastiDegliAbitanti(dove, mostri, caporale) {
  const g = []
  if (!Array.isArray(mostri) || mostri.length < 2 || mostri.length > 4) return [`${dove}: gli abitanti non ci sono, o non sono da due a quattro`]
  for (const k of [...mostri, caporale]) {
    if (!MOSTRI[k]) g.push(`${dove}: "${k}" non esiste`)
    else if (MOSTRI[k].capo) g.push(`${dove}: "${k}" è un capo e sta anche per strada`)
  }
  if (new Set(mostri).size !== mostri.length) g.push(`${dove}: un abitante due volte`)
  if (mostri.includes(caporale)) g.push(`${dove}: il caporale "${caporale}" sta anche per strada`)
  const veri = mostri.filter(k => MOSTRI[k])
  if (veri.length > 1)
    for (let att = 8; att <= 60; att++) {
      const c = veri.map(k => costoInRisposte(MOSTRI[k], att))
      if (Math.max(...c) / Math.min(...c) > 1.15) { g.push(`${dove}: ${veri.join(', ')} costano ${c.map(x => x.toFixed(2)).join(', ')} risposte con attacco ${att}`); break }
    }
  return g
}

// dove sta ogni creatura: chiave → i posti (abitante o caporale di una discesa o di un tratto dell'abisso)
export function postiDelleCreature() {
  const posti = {}
  const metti = (k, dove) => { (posti[k] = posti[k] || []).push(dove) }
  for (const t of CAMPAGNA) { for (const k of t.mostri) metti(k, t.chiave); metti(t.caporale, t.chiave) }
  for (const t of TRATTI_DELL_ABISSO) { for (const k of t.mostri) metti(k, `abisso: ${t.scenario}`); metti(t.caporale, `abisso: ${t.scenario}`) }
  return posti
}
export const guastiDeiDoppioni = () => Object.entries(postiDelleCreature())
  .filter(([, v]) => v.length > 1).map(([k, v]) => `${k} sta in più posti (${v.join(', ')})`)

export function guastiDellaCampagna() {
  const g = []
  const viste = new Set()
  for (const t of CAMPAGNA) {
    if (viste.has(t.chiave)) g.push(`due tappe con la chiave "${t.chiave}"`)
    viste.add(t.chiave)
    if (!t.nome || !t.icona || !t.dritta || !t.dove) g.push(`${t.chiave}: senza nome, icona, dritta o dove`)
    if (!['costruita', 'caverna'].includes(t.pianta)) g.push(`${t.chiave}: la pianta è «${t.pianta}», non costruita né caverna`)
    if (t.piani < 1) g.push(`${t.chiave}: zero piani`)
    const f = formaDi(t, 0)
    if (Math.min(f.largo, f.alto) < 22 || f.largo * f.alto < 24 * 24)
      g.push(`${t.chiave}: un piano ${f.largo}×${f.alto} non tiene le stanze`)
    if (t.giri < 2 || t.giri > 4) g.push(`${t.chiave}: ${t.giri} giri di taglio, fuori da 2..4`)
    const [da, a] = t.dif
    if (da < 0 || a > 1 || da > a) g.push(`${t.chiave}: difficoltà ${da}..${a} storta`)
    if (t.forza != null && !(t.forza >= 0.2 && t.forza <= 8)) g.push(`${t.chiave}: forza ${t.forza} fuori da 0.2..8`)
    if (t.spinta != null && !(t.spinta >= -3 && t.spinta <= 12)) g.push(`${t.chiave}: spinta ${t.spinta} fuori da -3..12`)
    if (t.densita != null && !(t.densita >= 0.5 && t.densita <= 2)) g.push(`${t.chiave}: densità ${t.densita} fuori da 0.5..2`)
    if (!(t.livello >= 1)) g.push(`${t.chiave}: senza livello, e il bottino non sa a che livello cadere`)
  }
  // la prima si comincia a mani nude: non può contare su una roba che nessuno ha ancora
  if ((CAMPAGNA[0].forza || 1) > 1 || (CAMPAGNA[0].spinta || 0) > 0)
    g.push(`${CAMPAGNA[0].chiave}: si scende a mani nude, niente spinta né forza sopra il bestiario`)
  for (const t of CAMPAGNA) g.push(...guastiDegliAbitanti(t.chiave, t.mostri, t.caporale))
  // una creatura sta in un posto solo (docs/sotterraneo/mostri.md): né in due discese né fra le discese e l'abisso
  g.push(...guastiDeiDoppioni())
  // la campagna deve salire: due tappe di fila alla stessa difficoltà sembrano una ripetizione
  for (let i = 1; i < CAMPAGNA.length; i++) if (CAMPAGNA[i].livello <= CAMPAGNA[i - 1].livello)
    g.push(`${CAMPAGNA[i].chiave}: livello ${CAMPAGNA[i].livello}, non sopra quello della discesa di prima`)
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
  if (a.attOgni < 3) g.push(`l'abisso: l'attacco cresce ogni ${a.attOgni} piani, troppo in fretta`)
  if (a.piani !== Infinity) g.push('l\'abisso ha un ultimo piano: non è più un abisso')
  if (!TRATTI_DELL_ABISSO.length) g.push('l\'abisso: nessun tratto')
  for (const t of TRATTI_DELL_ABISSO) {
    if (!t.scenario || !t.nome) g.push('l\'abisso: un tratto senza scenario o nome')
    if (!['costruita', 'caverna'].includes(t.pianta)) g.push(`l'abisso (${t.scenario}): la pianta è «${t.pianta}», non costruita né caverna`)
    g.push(...guastiDegliAbitanti(`l'abisso (${t.scenario})`, t.mostri, t.caporale))
  }
  if (PIANI_PER_TRATTO < 2) g.push(`l'abisso: ${PIANI_PER_TRATTO} piani per tratto, si cambia posto a ogni scala`)
  return g
}

