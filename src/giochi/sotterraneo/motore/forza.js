// La forza dell'eroe (docs/sotterraneo/forza.md): quanto regge, con la roba e le abilità di adesso, contro i mostri di un
// livello. Una formula sui numeri veri, non una partita finta: dice a che livello «vale» l'eroe, e il colore delle discese
// (motore/zone.js) si legge da lì, non dal livello che ha scritto sulla barra. Funzioni pure sul Corredo: girano in Node.
import { NODI, aGrado, colpisce, inVita, costoAl } from '../dati/abilita.js'
import { MOSTRI } from '../dati/mostri.js'
import { COLPO_DEL_MOSTRO } from '../dati/mondo.js'
import { CAMPAGNA, OSSA_PER_PIANO } from '../dati/campagna.js'
import { LIVELLI_ATTESI } from '../dati/storia.js'
import { forzaDellaZona, spintaDellaZona } from '../dati/zone.js'
import { eroeDi } from '../dati/eroi.js'
import { caselleDella, gradoDi, conLaStrada } from './abilita.js'
import { Corredo } from './corredo.js'
import { robaAttesa } from './storia.js'
import { robaAttesaA, crescitaAttesaA } from './zone.js'
import { crescitaA } from './crescita.js'

// quante risposte su dieci sono giuste (il «patto a 8/10» delle misure, docs/apprendimento/calibrazione.md)
export const RISPOSTE_GIUSTE = 0.8
// quante abilità forti si contano a ogni scontro: l'utente, 12 ottobre 2026, «almeno 2 abilità forti a scontro»
export const ABILITA_A_SCONTRO = 2
// l'energia di partenza tipica di uno scontro (docs/sotterraneo/forza.md): i due terzi del globo, arrotondati per eccesso. Fra
// uno scontro e l'altro l'energia non torna piena (combattendo e camminando, piano: docs/sotterraneo/orologio.md), e il banco
// entra in uno scontro con il 40–60% del globo; un'abilità che costa più di così non si conta come fatta a ogni scontro
export const ENERGIA_TIPICA = 2 / 3
export const energiaTipica = c => Math.ceil(c.energiaMax * ENERGIA_TIPICA - 1e-9)
// il mostro di riferimento è lo scheletro (la fascia di mezzo del branco) al terzo piano di una zona
export const MOSTRO_TIPICO = 'scheletro'
export const PIANO_TIPICO = 3
// il livello di forza non va oltre
export const TETTO = 200

/* ═══════════ il mostro di riferimento al livello L ═══════════
   Quello che le zone mettono a quel livello: `forza` moltiplica le ossa, `spinta` aggiunge all'attacco (dati/zone.js).
   Dal 12 sono le formule delle zone; sotto, le discese della storia, ognuna al livello con cui ci si entra
   (dati/storia.js), e fra una e l'altra in linea retta. Le ossa non scendono mai: la botola e la miniera hanno la
   «forma» del loro posto, ma un livello più su non ha mai mostri più molli (si tiene il massimo fin lì) */
const PUNTI = [...CAMPAGNA.map((t, k) => ({ L: LIVELLI_ATTESI[k], forza: t.forza || 1, spinta: t.spinta || 0 })),
               { L: 12, forza: forzaDellaZona(12, null), spinta: spintaDellaZona(12) }]
function fraI(L, campo) {
  const prima = [...PUNTI].reverse().find(x => x.L <= L)
  const dopo = PUNTI.find(x => x.L >= L)
  if (!prima) return PUNTI[0][campo]
  if (!dopo || dopo.L === prima.L) return prima[campo]
  return prima[campo] + (dopo[campo] - prima[campo]) * (L - prima.L) / (dopo.L - prima.L)
}
const FORZE = [0]
for (let L = 1, massimo = 0; L <= TETTO + 1; L++) FORZE[L] = massimo = Math.max(massimo, L >= 12 ? forzaDellaZona(L, null) : fraI(L, 'forza'))
export const forzaDei = L => FORZE[Math.max(1, Math.min(TETTO + 1, Math.round(L)))]
export const spintaDei = L => (L >= 12 ? spintaDellaZona(L) : fraI(L, 'spinta'))
export function mostroDiRiferimento(L) {
  const m = MOSTRI[MOSTRO_TIPICO]
  const ossa = m.ossa * (1 + PIANO_TIPICO * OSSA_PER_PIANO) * forzaDei(L)
  return { ossa, att: m.att + Math.floor(PIANO_TIPICO / 2) + spintaDei(L), dif: m.dif, velocita: m.velocita }
}

/* ═══════════ l'offesa ═══════════
   Il colpo come lo conta Corsa.colpo (motore/corsa.js): attacco meno difesa, i bonus percentuali dei nodi «sempre», il
   fuoco dei pezzi; un'abilità lo moltiplica per `per`. `passa` è un numero da 0 a 1 (true vale 1): quanto della difesa
   del mostro non conta */
const passaDi = v => (v === true ? 1 : Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0)
function passaDelRamo(c, nodo) {
  let p = 0
  if (nodo) for (const x of c.nodiSempre())
    if (x.nodo.ramo === nodo.ramo && x.nodo.rami) p = Math.max(p, passaDi(aGrado(x.nodo.rami, 'passa', x.g)))
  return p
}
export function colpoContro(c, m, nodo = null, { rotto = false } = {}) {
  const g = nodo ? gradoDi(c.crescita, nodo.id) : 0
  const passa = rotto ? 1 : Math.max(passaDi(nodo && nodo.passa), passaDelRamo(c, nodo))
  const piu = c.sempre('colpoPiu') + (nodo ? c.delRamo(nodo, 'piu') : 0)
  const base = Math.max(1, Math.round((c.attDelRamo(nodo) - m.dif * (1 - passa)) * (1 + piu / 100)))
  let per = nodo ? (aGrado(nodo, 'per', g) || 1) : 1
  if (nodo && nodo.seStordito) per = nodo.altrimenti || 1   // su un mostro che nessuno ha ancora toccato
  return Math.round(base * per) + c.addosso('fuoco')
}

// le abilità che l'eroe porta nello scontro e può usare adesso: quelle delle caselle che hanno l'arma che vogliono (una
// casella con la Lama e il martello in mano non serve a niente) e che l'energia di partenza tipica paga (`energiaTipica`:
// il cavaliere con poca intelligenza conta le prime, il mago tutte); se le caselle sono vuote, quelle che sa
export function abilitaDelloScontro(c) {
  const tipica = energiaTipica(c)
  const usabile = id => NODI[id] && !NODI[id].sempre && gradoDi(c.crescita, id) > 0 && c.haLArma(NODI[id].arma) && costoAl(NODI[id], gradoDi(c.crescita, id)) <= tipica
  const incasella = caselleDella(c.crescita).filter(Boolean)
  const ids = incasella.length ? incasella : Object.keys(c.crescita.albero || {})
  return ids.filter(usabile).map(id => NODI[id])
}

// quanto toglie un'abilità a un mostro di passaggio: il colpo (`per` volte) più il veleno, che brucia metà del colpo solito
// a turno (Corsa.usaAbilita), `veleno` turni. Un'abilità che non colpisce toglie zero
export function dannoDell(c, nodo, m) {
  if (!colpisce(nodo)) return 0
  const g = gradoDi(c.crescita, nodo.id)
  const colpo = colpoContro(c, m, nodo, { rotto: !!nodo.rompe })
  const veleno = nodo.veleno ? Math.max(1, Math.ceil(colpoContro(c, m) / 2)) * (aGrado(nodo, 'veleno', g) || 0) : 0
  return colpo + veleno
}

// Quante risposte giuste costa il mostro `m`: le due abilità che rendono di più (una volta ciascuna), poi il colpo di
// sempre. Quanti turni sono: ogni turno è una risposta, e se ne sbagliano due su dieci. Torna anche cosa si è usato
export function offesa(c, m, { giuste = RISPOSTE_GIUSTE, quante = ABILITA_A_SCONTRO } = {}) {
  const colpo = colpoContro(c, m, null)
  // un'abilità che non toglie più del colpo di sempre non è «forte»: prende il posto di un colpo e non dà niente
  const forti = abilitaDelloScontro(c).map(nodo => ({ nodo, danno: dannoDell(c, nodo, m) }))
    .filter(x => x.danno > colpo).sort((a, b) => b.danno - a.danno).slice(0, quante)
  const rotto = forti.some(x => x.nodo.rompe)
  const dopo = rotto ? colpoContro(c, m, null, { rotto: true }) : colpo
  let resta = m.ossa, risposte = 0
  for (const x of forti) {
    if (resta <= 0) break
    resta -= x.danno
    risposte++
  }
  if (resta > 0) risposte += resta / dopo
  risposte = Math.max(1, risposte)
  return { colpo, forti: forti.map(x => x.nodo.id), risposte, turni: risposte / giuste }
}
export const ttk = (c, m, o) => offesa(c, m, o).turni

/* ═══════════ la resistenza ═══════════
   La vita massima con la roba, più quello che una cura o uno scudo delle abilità darebbe in uno scontro (la migliore, una
   sola); contro il colpo che il mostro dà a ogni suo turno, COLPO_DEL_MOSTRO × (attacco − difesa) qualunque sia la risposta
   (diminuito dalla Parata e dalla schivata, dimezzato per i primi dalla Testa dura); i suoi turni sono quelli che la sua
   velocità gli dà mentre l'eroe, con la sua, gioca i propri (docs/sotterraneo/scontro.md) */
export function riparo(c) {
  const vm = c.vitaConLaRoba
  let meglio = 0
  for (const nodo of abilitaDelloScontro(c)) {
    if (colpisce(nodo)) continue
    const g = gradoDi(c.crescita, nodo.id)
    let v = 0
    if (nodo.cura) v += inVita(aGrado(nodo, 'cura', g), vm)
    if (nodo.scudo) v += inVita(aGrado(nodo, 'scudo', g), vm)
    if (nodo.linfa) v += Math.max(1, Math.round(vm / 10)) * (aGrado(nodo, 'linfa', g) || 0)
    meglio = Math.max(meglio, v)
  }
  return meglio
}
export const resistenza = c => c.vitaConLaRoba + riparo(c)

// il danno che il mostro `m` fa in un turno, in media, contro questo eroe; `turni` quanti ne dura lo scontro
export function dannoPerTurno(c, m, turni) {
  // il colpo del mostro, come Corsa.danno: COLPO_DEL_MOSTRO × (attacco − difesa), almeno 1, qualunque sia la risposta
  const colpo = Math.max(1, Math.round(COLPO_DEL_MOSTRO * (m.att - c.dif)))
  const schivata = c.schivata / 100
  // mentre l'eroe gioca `turni` turni il mostro ne gioca meno o più, secondo le velocità (motore/turni.js)
  const suoi = turni * (m.velocita || 8) / c.velocita
  // i primi colpi di ogni scontro fanno metà (Testa dura); la Parata ne toglie qualcuno a ognuno
  const dimezzati = Math.min(c.sempre('testaDura'), suoi)
  const ciascuno = Math.max(0, colpo - c.sempre('graffioMeno'))
  const risparmio = dimezzati * (colpo - Math.ceil(colpo / 2))
  const totale = suoi * (1 - schivata) * ciascuno - risparmio
  return Math.max(0, totale / Math.max(1, turni))
}
export const ttd = (c, m, turni) => {
  const d = dannoPerTurno(c, m, turni)
  return d > 0 ? resistenza(c) / d : Infinity
}

// Il rapporto: quanti turni regge per ogni turno che ci mette a batterne uno. Più alto è, più è forte
export function rapporto(c, L, o = {}) {
  const m = mostroDiRiferimento(L)
  const k = offesa(c, m, o)
  return ttd(c, m, k.turni, o) / k.turni
}

/* ═══════════ l'eroe atteso ═══════════
   Quello che il gioco si aspetta a livello L, con le abilità della strada della sua classe (è così che i mostri sono tarati:
   il banco di prova le usa, motore/banco.js): nella storia la roba con cui si entra nella discesa del livello atteso, oltre la
   roba attesa delle zone (motore/zone.js); la crescita come la dà il banco, coi punti dell'albero spesi (STRADA) e le caselle
   vuote, quindi vale quello che sa fare */
export function robaDelLivello(eroe, L) {
  if (L >= 12) return robaAttesaA(eroe, L, { pozioni: false })
  let k = 0
  LIVELLI_ATTESI.forEach((x, i) => { if (x <= L) k = i })
  return robaAttesa(eroe, k, { pozioni: false })
}
export function eroeAtteso(eroe, L) {
  const cr = L >= 12 ? crescitaAttesaA(eroe, L) : crescitaA(eroeDi(eroe), L)
  const c = new Corredo({ eroe, roba: robaDelLivello(eroe, L), crescita: { ...conLaStrada(cr, eroe), caselle: [null, null, null] } })
  c.sistemaIlCorredo()
  return c
}
const attesi = new Map()
function rapportoAtteso(eroe, L) {
  const chiave = `${eroe}|${L}`
  if (!attesi.has(chiave)) attesi.set(chiave, rapporto(eroeAtteso(eroe, L), L))
  return attesi.get(chiave)
}

/* ═══════════ il livello di forza ═══════════
   Il più alto L per cui l'eroe regge i mostri di L almeno come l'eroe atteso a L. Si sale finché ha senso guardare: quando
   il rapporto scende sotto uno (non regge neanche un mostro) nessun livello più su può andare bene. Un eroe mal vestito vale
   meno del suo livello, uno ben vestito di più; 1 se non regge neanche il primo */
export const RAPPORTO_MINIMO = 1
export function livelloDiForza(c) {
  let forza = 1
  for (let L = 2; L <= TETTO; L++) {
    const r = rapporto(c, L)
    if (r < RAPPORTO_MINIMO) break
    if (r >= rapportoAtteso(c.chiEro, L)) forza = L
  }
  return forza
}

// lo stesso, da quello che sta nell'avventura (eroe, roba, crescita), con l'ultimo risultato a memoria: la mappa lo chiede
// a ogni disegno
const memoria = new Map()
export function forzaDi(eroe, roba, crescita) {
  const c = new Corredo({ eroe, roba, crescita })
  c.sistemaIlCorredo()
  return forzaDelCorredo(c)
}
export function forzaDelCorredo(c) {
  const cr = c.crescita || {}
  const chiave = [c.chiEro, c.mano, c.mancina, c.corpo, c.dito, cr.esp, cr.forza, cr.destrezza, cr.intelligenza, cr.tempra,
                  JSON.stringify(cr.albero || {}), (cr.caselle || []).join(',')].join('|')
  if (memoria.has(chiave)) return memoria.get(chiave)
  if (memoria.size > 200) memoria.clear()
  const f = livelloDiForza(c)
  memoria.set(chiave, f)
  return f
}
