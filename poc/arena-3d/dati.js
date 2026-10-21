// L'arena di prova: le tabelle (elementi, mostri, effetti, mappe attacco→segno). Niente scena qui, solo dati e cataloghi.
import { MOSTRI } from '../mostri-3d/mostri.js'
import { MOSTRI_PRATI } from '../mostri-3d/prati.js'
import { MOSTRI_BOSCO } from '../mostri-3d/bosco.js'
import { creaDragoGrande, montaSoffio } from '../mostri-3d/draghi.js'
import { EFFETTI as LANCIO, ELEMENTO_PROVA } from '../effetti-3d/lancio.js'
import { EFFETTI as MISCHIA } from '../effetti-3d/mischia.js'
import { EFFETTI as AURE } from '../effetti-3d/aure.js'

export const COLORI = { fisico: 0xb9c2d4, fuoco: 0xe8742f, gelo: 0x58b4e6, fulmine: 0xb98af0, veleno: 0x7cc94a, sacro: 0xffe08a }
export const ELEMENTI = Object.keys(COLORI)
/** Gli elementi delle armi della collezione → quelli del gioco. */
export const ELEM_ARMA = { nessuno: 'fisico', fuoco: 'fuoco', ghiaccio: 'gelo', fulmine: 'fulmine', natura: 'veleno', arcano: 'fulmine', oro: 'sacro', luce: 'sacro' }

// ───────── i mostri ─────────
// elem: l'elemento col quale il mostro colpisce; scala: del Group (i draghi grandi sono enormi); tinta: colore libero per i proiettili
const EXTRA = {
  melma: { elem: 'veleno' }, 'melma-rosa': { tinta: 0xff7fb0 }, fantasma: { tinta: 0xbfd4ff, elem: 'gelo' },
  fungo: { elem: 'veleno', tinta: 0x7cc94a }, 'fungo-viola': { elem: 'veleno', tinta: 0x9b6cd6 },
  'ragno-nero': { elem: 'veleno', tinta: 0xcfd4da }, 'serpente-nero': { elem: 'veleno' },
  'drago-fiero': { elem: 'fuoco' },
}
export function elencoMostri () {
  const L = []
  const aggiungi = (gruppo, lista) => { for (const m of lista) L.push({ id: m.chiave, nome: m.nome, gruppo, crea: m.crea, elem: 'fisico', scala: 1, ...EXTRA[m.chiave] }) }
  aggiungi('Sotterraneo', MOSTRI); aggiungi('Prati', MOSTRI_PRATI); aggiungi('Bosco e brughiera', MOSTRI_BOSCO)
  const piccolo = L.find(m => m.id === 'drago')
  if (piccolo) {
    const crea0 = piccolo.crea
    piccolo.nome = 'Drago piccolo (soffia)'; piccolo.elem = 'fuoco'
    piccolo.crea = () => { const d = crea0(); montaSoffio(d); return d }
    piccolo.gruppo = 'Draghi'
  }
  const fiero = L.find(m => m.id === 'drago-fiero'); if (fiero) { fiero.gruppo = 'Draghi'; fiero.nome = 'Drago fiero (senza attacco proprio)' }
  const elemDrago = { verde: 'veleno', azzurro: 'gelo', rosso: 'fuoco', nero: 'fulmine', oro: 'sacro' }
  for (const c of Object.keys(elemDrago)) L.push({ id: 'drago-' + c, nome: `Drago grande ${c}`, gruppo: 'Draghi', crea: () => creaDragoGrande(c), elem: elemDrago[c], scala: 0.4 })
  // i draghi in fila nel loro gruppo
  const ordine = ['Sotterraneo', 'Prati', 'Bosco e brughiera', 'Draghi']
  return L.sort((a, b) => ordine.indexOf(a.gruppo) - ordine.indexOf(b.gruppo))
}

// ───────── gli effetti, tutti e tre i gruppi ─────────
export const MODULI = { lancio: LANCIO, mischia: MISCHIA, aure: AURE }
/** id → { id, modulo, chiave, def }: la chiave semplice, o `chiave@modulo` quando due gruppi la usano. */
export const ABILITA = (() => {
  const conta = {}
  for (const E of Object.values(MODULI)) for (const k of Object.keys(E)) conta[k] = (conta[k] || 0) + 1
  const m = new Map()
  for (const [modulo, E] of Object.entries(MODULI)) for (const [chiave, def] of Object.entries(E)) {
    const id = conta[chiave] > 1 ? `${chiave}@${modulo}` : chiave
    m.set(id, { id, modulo, chiave, def })
  }
  return m
})()
/** Risolve `taglio`, `luce@mischia` o anche `mischia/taglio`. */
export function trovaAbilita (id) {
  if (ABILITA.has(id)) return ABILITA.get(id)
  const [a, b] = id.split('/'); if (b) return [...ABILITA.values()].find(x => x.modulo === a && x.chiave === b) || null
  return [...ABILITA.values()].find(x => x.chiave === id) || null
}
export const VIE_ORDINE = ['vicino', 'attorno', 'terra', 'onda', 'segno', 'lancio', 'fascio', 'catena', 'cielo', 'su-chi', 'su-me', 'stato']
export const NOME_VIA = {
  vicino: 'Da vicino (sull\'avversario)', attorno: 'Attorno all\'eroe', terra: 'Dal suolo', onda: 'Onda in avanti', segno: 'Segni d\'impatto',
  lancio: 'Proiettili', fascio: 'Fasci', catena: 'Catene', cielo: 'Dal cielo', 'su-chi': 'Addosso al mostro', 'su-me': 'Addosso all\'eroe', stato: 'Stati (restano)',
}
const STD_AURE = {
  nube: 'veleno', esplode: 'fuoco', rogo: 'fuoco', blocco: 'gelo', sonno: 'fulmine', scudo: 'fisico', sfera: 'fulmine', pietra: 'fisico', cura: 'sacro', preghiera: 'sacro', specchio: 'fisico', muro: 'fisico',
  stordito: 'sacro', avvelenato: 'veleno', 'in-fiamme': 'fuoco', gelato: 'gelo', sanguina: 'fisico', bloccato: 'veleno', 'senza-difesa': 'fisico', fiacco: 'fisico',
}
const STD_MISCHIA = { fiammata: 'fuoco', brina: 'gelo', scossa: 'fulmine', luce: 'sacro', scintilla: 'fulmine', rogo: 'fuoco', nube: 'veleno', radici: 'veleno', terremoto: 'fisico', scoppio: 'fuoco' }
export const elementoStandard = a => (a.modulo === 'lancio' ? ELEMENTO_PROVA[a.chiave] : a.modulo === 'aure' ? STD_AURE[a.chiave] : STD_MISCHIA[a.chiave]) || 'fisico'

// ───────── cosa fa il mostro quando colpisce ─────────
/** attacco.tipo senza proiettile → il segno che compare sull'eroe */
export const SEGNO_COLPO = {
  'colpo-arma': ['mischia', 'taglio'], morso: ['mischia', 'colpo'], zampata: ['mischia', 'croce'], schianto: ['mischia', 'urto'], carica: ['mischia', 'urto'],
  pungiglione: ['mischia', 'affondo'], becco: ['mischia', 'affondo'], 'volo-radente': ['mischia', 'spazzata'], tocco: ['mischia', 'scintilla'],
  ala: ['mischia', 'spazzata'], coda: ['mischia', 'spazzata'],
}
/** proiettile.tipo → l'effetto (nel modulo), se parte dall'origine o cade addosso all'eroe, e la tinta (null = quella del mostro) */
export const PROIETTILE = {
  freccia: { modulo: 'lancio', chiave: 'freccia', elem: 'fisico' },
  spore: { modulo: 'aure', chiave: 'nube', su: true },
  ragnatela: { modulo: 'lancio', chiave: 'scheggia', tinta: 0xd5d9de },
  veleno: { modulo: 'lancio', chiave: 'freccia-veleno', elem: 'veleno' },
  sputo: { modulo: 'lancio', chiave: 'palla' },
  onda: { modulo: 'mischia', chiave: 'onda', tinta: 0xbfd4ff },
  sasso: { modulo: 'lancio', chiave: 'massi', elem: 'fisico' },
}
