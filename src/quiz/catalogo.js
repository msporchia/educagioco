// il ponte fra i moduli e la schermata dei grandi: nucleo/catalogo.js fa il conto puro, qui si aggiunge il registro (import.meta.glob, solo sotto Vite) e profilo/giudizi. Usato da Manopola.vue, Prova.vue e ComeVa.vue; un gioco non lo tocca mai.

import { MODULI } from './nucleo/registro.js'
import { catalogoDi, giroDellaFascia, FASCE, fasciaDi, quantoEsce,
         FASCE_ETA, doveCadeCon } from './nucleo/catalogo.js'
import { classiAmmesse } from './scelta.js'
import { pescaClasse, finestraDi } from './nucleo/classi.js'
import { esempioDa } from './nucleo/esempi.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { saperiSpenti, regoleDomande, etaDelBambino, ritoccoSapere,
         state } from '../store/profile.js'
import { sapereDi } from '../data/saperi.js'
import { consiglioDa, contoDi } from './consiglio.js'
import { leggi as leggiGiudizi } from '../store/giudizi.js'

export { FASCE, fasciaDi, quantoEsce }

// i giudizi arrivano da fuori (async): senza, l'elenco si vede lo stesso e le faccine arrivano un istante dopo
export const catalogo = ({ giudizi = [] } = {}) =>
  catalogoDi(MODULI, { spenti: saperiSpenti(), giudizi })

// tutte le righe senza il profilo (nessuno spento): data/quadro.js le vuole per mostrare altre impostazioni
export const classiNude = () => catalogoDi(MODULI, {}).flatMap(m => m.classi)

// dove cade ogni classe per QUESTO bambino; i confini restano in nucleo/catalogo.js (li chiede anche il quadro)
export { FASCE_ETA }

export function fasceDelBambino({ eta = etaDelBambino(), giudizi = [] } = {}) {
  const dove = doveCadeCon(eta)

  // il gruppo più specifico fra quelli dichiarati (quello con meno domande, vedi docs/genitori/quadro.md)
  const quanteHa = {}
  const tutte = catalogoDi(MODULI, { spenti: saperiSpenti(), giudizi }).flatMap(m => m.classi)
  for (const c of tutte) for (const k of (c.sa || [])) quanteHa[k] = (quanteHa[k] || 0) + 1
  const gruppoDi = sa => (sa || []).slice()
    .sort((x, y) => (quanteHa[x] || 0) - (quanteHa[y] || 0))[0] || null

  const righe = tutte
    .map(c => {
      const ritocco = ritoccoSapere(c.tipo) + (c.sa || []).reduce((n, k) => n + ritoccoSapere(k), 0)
      const visto = c.livello - ritocco * 6
      const gruppo = gruppoDi(c.sa)
      return {
        ...c,
        ritocco,
        visto,
        dove: c.spenta ? 'spenta' : dove(visto),
        /* cosa spegnerebbe il ✕, detto con le parole del catalogo dei
           saperi: «Le divisioni», non «divisioni» */
        gruppo,
        gruppoNome: gruppo ? (sapereDi(gruppo)?.nome || gruppo) : '',
        gruppoQuante: gruppo ? quanteHa[gruppo] : 0,
        consiglio: consiglioDa(contoDi([c.tipo], state.profile.items || {}), ritocco),
      }
    })
    .sort((a, b) => a.visto - b.visto || a.modulo.localeCompare(b.modulo))

  return FASCE_ETA.map(f => ({ ...f, righe: righe.filter(r => r.dove === f.chiave) }))
    .concat([{ chiave: 'spenta', nome: 'Spente', righe: righe.filter(r => r.dove === 'spenta'),
               che: 'tolte a mano da «Cosa sa»' }])
}

export const giroDi = fascia =>
  giroDellaFascia(MODULI, fascia, { spenti: saperiSpenti() })

// lista vuota non è un guasto: l'interruttore dei giudizi può non essere mai stato acceso
export const giudiziDelQuaderno = () => leggiGiudizi().catch(() => [])

// come pescherebbe un gioco per `eta` (pesca a campana di nucleo/classi.js, spenti compresi), stessa forma di esempioDa
export function pescaComeUnGioco(eta, sorte = sorteQualunque(), difficolta = 0.5) {
  const spenti = saperiSpenti()
  // la finestra si rifà su QUESTA età, non su quella del bambino che sta giocando
  const regole = { ...regoleDomande(), eta, finestra: finestraDi(eta) }
  const classe = pescaClasse(sorte, classiAmmesse({ spenti, difficolta, regole }))
  if (!classe) return null
  const { modulo, grado } = classe
  const e = esempioDa({ modulo, grado, tipo: null, nome: '' }, sorte) // tipo null: la sceglie il modulo come in partita
  const t = modulo.tipi.find(x => x.chiave === e.domanda.chiave)
  return { ...e, dice: t?.nome || e.dice, eta }
}
