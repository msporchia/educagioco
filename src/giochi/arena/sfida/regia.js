// Castle Battle in due, quello che il gioco dà al pezzo comune (src/insieme/, docs/core/insieme.md): la regola della trattativa
// (versione, proposta, cosa si accetta) e il motore del lockstep (un tick, una mossa, l'impronta, la fotografia). Non sa di rete
// né di schermi (docs/arena/multigiocatore.md).
import { Partita, PASSO } from '../motore/partita.js'
import { caso } from '../motore/banco.js'
import { firmaEquilibrio } from '../motore/firma.js'
import { TERRENI, truppeDelTerreno } from '../dati/regole.js'
import { VERSIONE_SFIDA, mossaValida, improntaDi, impronteSimili, proponi, accetta, ritmoPer } from './protocollo.js'
import { fotoDi, applicaFoto } from './foto.js'

/* chi ospita è `io` (in basso), l'ospite è `nem` (in alto): il mondo è uno solo */
export const latoDi = ruolo => (ruolo === 'host' ? 'io' : 'nem')

/* il motore del lockstep attorno a una partita */
export function motoreDi(partita) {
  return {
    partita,
    passo: PASSO,
    avanza: () => partita.avanza(PASSO),
    applica(ruolo, [azione, chi, dove]) {
      const lato = latoDi(ruolo)
      if (azione === 'sbagliata') partita.sbagliata(lato, chi ?? undefined)
      else partita.fai(lato, azione, chi ?? undefined, dove ?? undefined)
    },
    valida: mossaValida,
    impronta: () => improntaDi(partita),
    simili: impronteSimili,
    foto: () => fotoDi(partita),
    rimetti: f => applicaFoto(partita, f),
    fine: () => partita.fine,
    finisci: f => { if (['vinto', 'perso', 'pari'].includes(f)) partita.fine = f },
  }
}

export const partitaDi = ({ seme, terreno, ritmoMonete }) =>
  new Partita({ rnd: caso(seme), registra: true, sfida: { truppe: truppeDelTerreno(terreno), umano: true, durata: Infinity, ritmoMonete } })

/* la regola per l'Incontro: chi crea sceglie `{ terreno, secondiARisposta }` */
export const regolaArena = ({ firma = firmaEquilibrio() } = {}) => ({
  versione: `arena:${VERSIONE_SFIDA}:${firma}`,
  proponi: ({ terreno, secondiARisposta, seme = (Math.random() * 2 ** 31) | 0 }) => proponi({ seme, terreno, ritmoMonete: ritmoPer(secondiARisposta) }),
  accetta: proposta => accetta(proposta, { terreni: TERRENI }),
  crea: proposta => motoreDi(partitaDi(proposta)),
})
