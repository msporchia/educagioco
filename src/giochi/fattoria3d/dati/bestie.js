/* Le bestie di casa della fattoria 3D (G6): quelle che si COMPRANO e si CURANO, come nella fattoria di sempre. Beagle, gatto rosso,
   coniglio e pappagallo hanno i numeri della 2D (prezzo, livello, premio di benessere: `ANIMALI_2D` dal ponte `parita2d.js`), i bisogni
   (pancia, pelo, gioco), la ciotola, le coccole, il premio e il nome vengono da `src/giochi/fattoria3d/da2d/dati/bisogni.js` e si riusano, non si
   copiano. Watson, Sherlock, Irene e Pepe (`dati/compagni.js`) arrivano gratis col livello e si curano come loro (`CURATI`): nella 2D il
   bobtail e i gatti si compravano e si curavano.
   Qui: la tabella delle bestie, la ciotola nella lingua della 3D (dove sta la roba nelle scorte), lo stato che si salva (`stato.casa`) e le
   scelte pure. Il motore è `motore/cura.js`, il foglio `viste/Bestia.vue`, i corpi `scena3d/modelli-bestie.js`.
   Vedi docs/fattoria3d/bestie-di-casa.md. */
import { BISOGNI, CHIAVI, CIBI as CIBI_2D, COCCOLE, FONDO, nuovo, foto, scendi, riarma, BENISSIMO, BENE, tuttoAPosto, premiaSeStaBene, umore, comeSta, haBisogno } from '../da2d/dati/bisogni.js'
import { ANIMALI_2D, NOMI_2D, premioBenessere } from './parita2d.js'
import { COMPAGNI } from './compagni.js'
import { merceDi } from './ricette.js'
import { PER_ID as ADDOBBO_2D } from '../da2d/dati/addobbi.js'

export { BISOGNI, CHIAVI, FONDO, nuovo, foto, scendi, riarma, BENISSIMO, BENE, tuttoAPosto, premiaSeStaBene, umore, comeSta, haBisogno, COCCOLE }

/* ══════════ le bestie ══════════ */
// `chi`: la voce della 2D (prezzo e livello vengono da lì). `famiglia`: quella dei cibi (cane, gatto, coniglio, pappagallo). `tipo` e `variante`:
// il corpo (`scena3d/modelli-bestie.js`). `premio`: l'esperienza (mai monete) quando è rimessa a posto, un quindicesimo del prezzo come in 2D.
const voce = (chi, resto) => {
  const a = ANIMALI_2D[chi]
  return { chi, nome: a.nome, prezzo: a.prezzo, liv: a.liv, premio: premioBenessere(chi), ...resto }
}
export const BESTIE = {
  beagle:      voce('cane-beagle',  { famiglia: 'cane',       tipo: 'cane',       variante: 'beagle',  emoji: '🐶', verso: 'Bau!',  arrivo: 'Un beagle è arrivato!' }),
  coniglio:    voce('coniglio',     { famiglia: 'coniglio',   tipo: 'coniglio',   variante: 'bianco',  emoji: '🐰', verso: 'Fiuu…', arrivo: 'Un coniglio è arrivato!' }),
  gatto_rosso: voce('gatto-giallo', { famiglia: 'gatto',      tipo: 'gatto',      variante: 'rosso',   emoji: '🐈', verso: 'Prrr…', arrivo: 'Un gatto rosso è arrivato!' }),
  pappagallo:  voce('pappagallo',   { famiglia: 'pappagallo', tipo: 'pappagallo', variante: 'verde',   emoji: '🦜', verso: 'Ciao!', arrivo: 'Un pappagallo è arrivato!' }),
}
export const IDS_BESTIE = Object.keys(BESTIE)
export const bestia = id => BESTIE[id] || null

/** I compagni gratis (`dati/compagni.js`) si curano come le bestie di casa: hanno la famiglia dei cibi, il premio di benessere della bestia 2D
    che sostituiscono (Irene, che nella 2D non c'è, quello del gatto bianco e nero) e un nome vero che il bambino può cambiare. Non si comprano,
    non si spostano: girano col contadino. */
const curato = (id, chi, famiglia, emoji) => ({ chi, nome: COMPAGNI[id].nome, famiglia, emoji, premio: premioBenessere(chi), liv: COMPAGNI[id].liv, compagno: true })
export const CURATI = {
  watson:   curato('watson', 'cane-bobtail', 'cane', '🐶'),
  sherlock: curato('sherlock', 'gatto-tuxedo', 'gatto', '🐈'),
  irene:    curato('irene', 'gatto-tuxedo', 'gatto', '🐈'),
  pepe:     curato('pepe', 'gatto-nero', 'gatto', '🐈'),
}
/** Una bestia che si cura: una di casa (`BESTIE`) o un compagno gratis (`CURATI`), o null. */
export const curabile = id => BESTIE[id] || CURATI[id] || null
export const eCompagno = id => !!CURATI[id]

/** Le bestie della 2D che nella 3D sono già i compagni gratis (Watson, Sherlock, Pepe): chi le aveva comprate le ritrova in casa. Irene non ha un equivalente. */
export const COMPAGNO_DI = { 'cane-bobtail': 'watson', 'gatto-tuxedo': 'sherlock', 'gatto-nero': 'pepe' }
/** L'id 3D di una bestia della 2D (`chi`), o null se è un compagno (`COMPAGNO_DI`) o non c'è. */
export const idDa2D = chi => IDS_BESTIE.find(id => BESTIE[id].chi === chi) || null

/** Le bestie in vendita, per livello (poi per prezzo). */
export const inVendita = () => IDS_BESTIE.map(id => ({ id, ...BESTIE[id] })).sort((a, b) => a.liv - b.liv || a.prezzo - b.prezzo)
/** Quelle che si aprono proprio a questo livello (per il foglio dei livelli). */
export const bestieAl = (livello, soloQuesto = false) => inVendita().filter(b => (soloQuesto ? b.liv === livello : b.liv <= livello))

/* ══════════ i nomi (da toccare, non da scrivere) ══════════ */
export const nomiPer = id => (curabile(id) && NOMI_2D[curabile(id).famiglia]) || [...new Set(Object.values(NOMI_2D).flat())]
export const NOME_MAX = 16
export const pulisciNome = n => String(n ?? '').replace(/\s+/g, ' ').trim().slice(0, NOME_MAX)

/* ══════════ la ciotola e le coccole, nella lingua della 3D ══════════ */
// Gli otto cibi comprati e i sei del granaio sono quelli della 2D. Il granaio della 2D è la scorta della 3D: `da` dice QUALE scorta si
// scala (`motore/fattoria3d.js scortaDi`). Il fieno della 2D è il raccolto dell'erba (in 3D «Erba medica»); il resto ha lo stesso id.
const SCORTA_3D = { fieno: 'erba' }
export const scortaDi3D = da => SCORTA_3D[da] || da
export const CIBI = CIBI_2D.map(c => {
  if (!c.da) return { ...c }
  const da = scortaDi3D(c.da), m = merceDi(da)
  return { ...c, da, ...(c.da === 'fieno' && m ? { nome: m.nome, emoji: m.emoji } : {}) }
})
export const COCCOLE_3D = COCCOLE.map(c => (c.da ? { ...c, da: scortaDi3D(c.da) } : { ...c }))
export const cibiPer = famiglia => CIBI.filter(c => c.per.includes(famiglia))
export const gradisce = (cibo, famiglia) => !!cibo && cibo.per.includes(famiglia)
export const cibo = id => CIBI.find(c => c.id === id) || null
export const coccola = id => COCCOLE_3D.find(c => c.id === id) || null
/** I cibi da comprare di una famiglia (i suoi due, il piccolo e il buono). */
export const cibiComprati = famiglia => cibiPer(famiglia).filter(c => !c.da)
/** I gesti che riempiono un bisogno: per la pancia i cibi di quella famiglia, per gli altri le coccole. */
export function gestiPer(bisogno, famiglia) {
  if (bisogno === 'pancia') return cibiPer(famiglia).map(c => ({ che: 'cibo', ...c }))
  return COCCOLE_3D.filter(c => c.bisogno === bisogno).map(c => ({ che: 'coccola', ...c }))
}

/* ══════════ lo stato che si salva: stato.casa ══════════ */
// { <id>: { pancia, pelo, gioco, quando, premiato, nome?, i?, j?, addobbi? } } (`addobbi`: { aggancio: id }, dati/addobbi.js) — il record c'è se la bestia è tua (un compagno gratis l'ha da quando arriva). `i, j`: la cella dove l'hai messa
// (casa sua: ci gira intorno); senza, sta davanti alla casa.
export const casaIniziale = () => ({})

const numero01 = (v, d) => Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d
const oggetto = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {}

/** Un record di bestia letto da un salvataggio, rimesso in forma (mai un'eccezione). I bisogni non scendono sotto `FONDO`. */
export function bestiaInForma(letto, ora = Date.now()) {
  const l = oggetto(letto), n = nuovo(ora)
  const sopra = (v, d) => Math.max(FONDO, numero01(v, d))
  const r = { pancia: sopra(l.pancia, n.pancia), pelo: sopra(l.pelo, n.pelo), gioco: sopra(l.gioco, n.gioco),
              quando: Number.isFinite(l.quando) && l.quando > 0 ? l.quando : ora, premiato: !!l.premiato }
  const nome = pulisciNome(l.nome)
  if (nome) r.nome = nome
  if (Number.isInteger(l.i) && Number.isInteger(l.j) && Math.abs(l.i) < 1e6 && Math.abs(l.j) < 1e6) { r.i = l.i; r.j = l.j }
  const addosso = Object.entries(oggetto(l.addobbi)).filter(([dove, id]) => ADDOBBO_2D[id] && ADDOBBO_2D[id].dove === dove)
  if (addosso.length) r.addobbi = Object.fromEntries(addosso)
  return r
}

/** Tutta la casa letta da uno stato (o niente): solo le bestie che esistono. */
export function casaInForma(letta, ora = Date.now()) {
  const c = casaIniziale(), l = oggetto(letta)
  for (const [id, b] of Object.entries(l)) if (curabile(id) && b && typeof b === 'object') c[id] = bestiaInForma(b, ora)
  return c
}

/* ══════════ come gira la scena ══════════ */
/** Le bestie prese, nella forma di `COMPAGNI` (id, nome, tipo, variante, liv, verso, arrivo) per la scena. */
export const comeCompagno = (id, nome = '') => {
  const b = BESTIE[id]
  return { id, nome: nome || b.nome, tipo: b.tipo, variante: b.variante, liv: b.liv, verso: b.verso, arrivo: b.arrivo, daCurare: true }
}

// Il coniglio e il pappagallo non seguono né il cane né il gatto: stanno vicino a casa, ogni tanto fanno due passi, si siedono, annusano, dormono.
export function decidiPiccolo(s, rnd = Math.random) {
  const r = rnd()
  if (r < 0.28) return { stato: 'vaga', vai: 'attorno' }
  if (r < 0.50) return { stato: 'siede' }
  if (r < 0.72) return { stato: 'annusa' }
  if (r < 0.84) return { stato: 'sta' }
  return { stato: 'dorme' }
}
export const PICCOLI = ['coniglio', 'pappagallo']
export const ePiccolo = tipo => PICCOLI.includes(tipo)

/* ══════════ il perché di un cibo rifiutato ══════════ */
// Una bestia non mangia tutto: il rifiuto dice cosa le piace davvero e perché il resto no (docs/fattoria3d/bestie-di-casa.md, «La ciotola»).
const NON_PIACE = {
  cane:       'Il cane mangia ossi e carne, e un po\' di formaggio e uova: erba e semini non sono roba sua.',
  gatto:      'Il gatto vuole pesce e carne morbida, uova e pappa. Formaggio e minestrone gli fanno male al pancino, e l\'erba non la mangia.',
  coniglio:   'Il coniglio mangia solo verdura: erba, carote, insalata. Carne, uova e formaggio non li digerisce.',
  pappagallo: 'Il pappagallo becchetta semini e frutta. Ossi, erba e formaggio non fanno per lui.',
}
/** Perché quella bestia non vuole quel cibo (una frase per bambini). */
export const perche = (id, ciboId) => {
  const b = curabile(id), c = ciboId && CIBI.find(x => x.id === ciboId)
  return `${c ? c.nome + ': no' : 'No'}! ` + (b ? NON_PIACE[b.famiglia] : '')
}

/* ══════════ i guasti ══════════ */
export function guastiDelleBestie() {
  const g = []
  const nomi = new Set()
  for (const [id, b] of Object.entries(BESTIE)) {
    const a = ANIMALI_2D[b.chi]
    if (!a) { g.push(`${id}: nella 2D «${b.chi}» non c'è`); continue }
    if (b.prezzo !== a.prezzo || b.liv !== a.liv) g.push(`${id}: prezzo o livello diversi dalla 2D (vale la 2D)`)
    if (b.premio !== premioBenessere(b.chi) || !(b.premio >= 1)) g.push(`${id}: il premio dev'essere quello della 2D`)
    if (COMPAGNI[id]) g.push(`${id}: è anche un compagno gratis`)
    if (!b.verso || !b.arrivo || !b.emoji) g.push(`${id}: manca verso, arrivo o emoji`)
    if (cibiPer(b.famiglia).filter(c => !c.da).length < 2) g.push(`${id}: ${b.famiglia} ha meno di due cibi da comprare`)
    if (!nomiPer(id).length) g.push(`${id}: nessun nome da toccare`)
    for (const n of nomiPer(id)) if (pulisciNome(n) !== n) g.push(`${id}: il nome «${n}» non sta in ${NOME_MAX} lettere`)
    nomi.add(`${b.tipo}:${b.variante}`)
  }
  if (nomi.size !== IDS_BESTIE.length) g.push('due bestie con lo stesso corpo')
  for (const c of CIBI) {
    if (c.da && c.prezzo) g.push(`${c.id}: costa monete e roba insieme`)
    if (c.da && !merceDi(c.da)) g.push(`${c.id}: «${c.da}» non è una scorta della 3D`)
    if (!c.da && !(c.prezzo > 0)) g.push(`${c.id}: prezzo impossibile`)
  }
  for (const c of COCCOLE_3D) if (c.da && !merceDi(c.da)) g.push(`${c.id}: «${c.da}» non è una scorta della 3D`)
  // le due sempre disponibili costano una monetina al più (spazzola e gioca); la carezza (`Cura.carezza`) è gratis sempre: chi è a zero monete non ha un animale intoccabile
  if (COCCOLE_3D.filter(c => !c.da && c.prezzo > 1).length || !COCCOLE_3D.some(c => !c.da)) g.push('le coccole sempre disponibili devono costare al più 🪙1')
  if (!(FONDO > 0)) g.push('il fondo dei bisogni dev\'essere sopra zero: una bestia non sta mai male')
  for (const chi of Object.keys(COMPAGNO_DI)) if (!ANIMALI_2D[chi] || !COMPAGNI[COMPAGNO_DI[chi]]) g.push(`${chi}: il compagno gratis che lo sostituisce non c'è`)
  for (const id of Object.keys(COMPAGNI)) {
    const c = CURATI[id]
    if (!c) { g.push(`${id}: il compagno non si cura (manca in CURATI)`); continue }
    if (!ANIMALI_2D[c.chi] || !(c.premio >= 1)) g.push(`${id}: il premio viene da una bestia 2D che non c'è`)
    if (!NOMI_2D[c.famiglia]) g.push(`${id}: nessun nome da toccare per la famiglia ${c.famiglia}`)
    if (pulisciNome(c.nome) !== c.nome) g.push(`${id}: il nome vero non sta in ${NOME_MAX} lettere`)
    if (BESTIE[id]) g.push(`${id}: è anche una bestia da comprare`)
  }
  return g
}
