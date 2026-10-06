// Il piano lasciato a metà, uno per livello (docs/generale/lasciare-a-meta.md).
// Si scrive quello che ha fatto il bambino: il piano, quale aiuto ci ha
// scritto dentro, chi stava comandando, quale battaglia guardava e i piani
// nemici già letti coi gettoni. La scena si rifà dal livello: ▶ riparte
// sempre dalla prima, quindi una scena a metà non vale niente da salvare.
import { creaMondo } from './mondo.js'
import { mieUnita, altruiUnita, altriInCampo, contaOrdini } from './piano.js'
import { VERBI, eBlocco, dentroA } from './vocabolario.js'

export const VERSIONE = 1
const PESI = ['', 'pezzo', 'forma', 'svela']

const clona = x => JSON.parse(JSON.stringify(x))
const visteDiBase = liv => (liv.mostraNemici === true ? altriInCampo(liv) : [])

// ogni voce del piano di un'unità, dentro rami, cicli, azioni e ascolti
function voci(lista, out = []) {
  if (!Array.isArray(lista)) return null
  for (const o of lista) {
    if (!o || typeof o !== 'object') return null
    out.push(o)
    const dentro = eBlocco(o) ? dentroA(o) : o.allora ? [o.allora] : []
    for (const l of dentro) if (l !== undefined && !voci(l, out)) return null
  }
  return out
}

// Una partita vinta, o in cui non è successo niente, non si scrive: torna
// null e il posto del livello si libera.
export function scrivi({ piano, svelato = '', unita, scena = 0, scoperte = [], vinto = false } = {}, liv) {
  if (vinto || !liv || !piano) return null
  const lette = scoperte.filter(id => !visteDiBase(liv).includes(id))
  if (!contaOrdini(piano) && !svelato && !lette.length) return null
  return { v: VERSIONE, id: liv.id, piano: clona(piano), svelato: svelato || '',
           unita: unita || '', scena: scena || 0, lette }
}

// Rimette la partita sul livello, o null se il salvataggio non torna
// (versione, livello cambiato, un'unità o una cosa che non c'è più): chi
// chiama lo butta e il livello ricomincia col piano vuoto.
export function leggi(dato, liv) {
  if (!dato || dato.v !== VERSIONE || !liv || dato.id !== liv.id) return null
  if (!dato.piano || typeof dato.piano !== 'object' || Array.isArray(dato.piano)) return null
  const mie = mieUnita(liv)
  if (Object.keys(dato.piano).some(id => !mie.includes(id))) return null
  if (!PESI.includes(dato.svelato || '')) return null
  // le cose nominate devono esserci in almeno una battaglia del livello
  const mondi = (liv.varianti && liv.varianti.length ? liv.varianti : [undefined])
    .map(v => creaMondo(liv, v))
  try {
    mondi.forEach(m => m.registraRoutine(dato.piano))
    for (const id in dato.piano) {
      const tutte = voci(dato.piano[id])
      if (!tutte) return null
      for (const o of tutte) {
        if (o.blocco ? !eBlocco(o) : !VERBI[o.verbo]) return null
        if (o.complemento && !mondi.some(m => m.laCosa(o.complemento))) return null
      }
    }
  } catch (e) { return null }
  const piano = Object.fromEntries(mie.map(id => [id, clona(dato.piano[id] || [])]))
  const nascosti = altruiUnita(liv)
  const lette = (Array.isArray(dato.lette) ? dato.lette : []).filter(id => nascosti.includes(id))
  const base = visteDiBase(liv)
  const quante = Math.max(1, (liv.varianti || []).length)
  return {
    piano, svelato: dato.svelato || '',
    unita: mie.includes(dato.unita) ? dato.unita : mie[0],
    scena: Number.isInteger(dato.scena) && dato.scena >= 0 && dato.scena < quante ? dato.scena : 0,
    scoperte: [...base, ...lette.filter(id => !base.includes(id))],
    // i gettoni spesi restano spesi: uscire non li ridà
    gettoni: Math.max(0, (liv.gettoni || 0) - lette.length),
  }
}

// cosa dice l'elenco delle prove accanto al livello, senza aprirlo
export function dice(dato) {
  if (!dato || dato.v !== VERSIONE || !dato.piano) return null
  const n = contaOrdini(dato.piano)
  return { ordini: n, testo: n === 1 ? '1 ordine scritto' : `${n} ordini scritti` }
}
