// English a scuola (docs/lingue/scuola.md): la maestra sceglie un'isola e le sue tappe, il bambino le gioca in fila, senza
// audio. La forma di una scheda e del suo `tipo`: docs/scuola/giochi.md. Puro: i dati dei mondi e niente store.
import { MONDI, specieDi } from '../../../giochi/inglese/dati/mondi.js'

// la 🏁 di ogni isola ripassa tutta l'isola: per la maestra si chiama così
const RIPASSO = 'Il ripasso di tutta l’isola'

// le isole per l'editor della maestra: l'anno di scuola (6 = dopo la quinta) e le tappe con le loro chiavi
export const ISOLE = MONDI.filter(m => m.tappe.length).map(m => ({
  id: m.id, nome: m.nome, anno: m.anno, insegna: m.insegna,
  tappe: m.tappe.map(t => ({ id: t.id, nome: t.bandiera ? RIPASSO : t.nome, specie: specieDi(t) })),
}))
const isolaDi = id => (typeof id === 'string' ? ISOLE.find(i => i.id === id) : null) || null

const oggetto = x => !!x && typeof x === 'object' && !Array.isArray(x)

// { tipo: 'inglese', isola, tappe: [id delle tappe di quell'isola] }: almeno una, senza doppioni; si giocano nell'ordine dell'isola
function valido(e) {
  if (!oggetto(e) || e.tipo !== 'inglese') return false
  if (!Object.keys(e).every(k => ['tipo', 'isola', 'tappe'].includes(k))) return false
  const isola = isolaDi(e.isola)
  if (!isola || !Array.isArray(e.tappe) || !e.tappe.length || new Set(e.tappe).size !== e.tappe.length) return false
  return e.tappe.every(id => typeof id === 'string' && isola.tappe.some(t => t.id === id))
}

// «English · Il prato in fiore · «I colori» e «Gli animali»», nell'ordine dell'isola; oltre tre, quante sono
function descrivi(e) {
  if (!valido(e)) return 'Esercizio non valido'
  const isola = isolaDi(e.isola)
  const scelte = isola.tappe.filter(t => e.tappe.includes(t.id)).map(t => `«${t.nome}»`)
  const cosa = scelte.length === isola.tappe.length ? 'tutte le tappe'
    : scelte.length > 3 ? `${scelte.length} tappe`
    : scelte.length > 1 ? `${scelte.slice(0, -1).join(', ')} e ${scelte.at(-1)}` : scelte[0]
  return `English · ${isola.nome} · ${cosa}`
}

export default {
  id: 'inglese',
  nome: 'English',
  nei: 'in English',
  spiega: 'La mappa del tesoro dell’inglese: le tappe scelte di un’isola, una dopo l’altra, senza audio.',
  tred: false,
  // gli esercizi del catalogo no: solo il suo contenuto
  accetta: () => false,
  tipo: {
    id: 'inglese',
    materia: 'inglese',
    voce: {
      nome: 'English',
      icona: '🇬🇧',
      spiega: 'Le tappe di un’isola della mappa del tesoro: le parole (con la figura o fra italiano e inglese) e le frasi da capire e da comporre. Senza audio. Le tappe scelte si fanno in fila; finite, si ricomincia.',
      base: { tipo: 'inglese', isola: 'prima', tappe: ['prima-colori'] },
    },
    valido,
    descrivi,
  },
}
