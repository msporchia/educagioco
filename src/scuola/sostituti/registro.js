// Il registro della scuola: gli stessi nomi di quiz/nucleo/registro.js, coi soli moduli del catalogo (docs/scuola/esercizi.md).
import analogie from '../../quiz/moduli/analogie.js'
import animali from '../../quiz/moduli/animali.js'
import bilance from '../../quiz/moduli/bilance.js'
import calendario from '../../quiz/moduli/calendario.js'
import capire from '../../quiz/moduli/capire.js'
import coniugazione from '../../quiz/moduli/coniugazione.js'
import connettivi from '../../quiz/moduli/connettivi.js'
import conti from '../../quiz/moduli/conti.js'
import frazioni from '../../quiz/moduli/frazioni.js'
import geometria from '../../quiz/moduli/geometria.js'
import grafici from '../../quiz/moduli/grafici.js'
import grammatica from '../../quiz/moduli/grammatica.js'
import griglia from '../../quiz/moduli/griglia.js'
import indizi from '../../quiz/moduli/indizi.js'
import lessico from '../../quiz/moduli/lessico.js'
import lettere from '../../quiz/moduli/lettere.js'
import logica from '../../quiz/moduli/logica.js'
import misure from '../../quiz/moduli/misure.js'
import numero from '../../quiz/moduli/numero.js'
import orologio from '../../quiz/moduli/orologio.js'
import ortografia from '../../quiz/moduli/ortografia.js'
import problemi from '../../quiz/moduli/problemi.js'
import sequenze from '../../quiz/moduli/sequenze.js'
import sillabe from '../../quiz/moduli/sillabe.js'
import soldi from '../../quiz/moduli/soldi.js'
import tabelline from '../../quiz/moduli/tabelline.js'

const ORDINE = ['italiano', 'matematica', 'spazio', 'tempo', 'logica', 'scienze', 'inglese']

export const MODULI = [analogie, animali, bilance, calendario, capire, coniugazione, connettivi, conti,
  frazioni, geometria, grafici, grammatica, griglia, indizi, lessico, lettere, logica, misure, numero,
  orologio, ortografia, problemi, sequenze, sillabe, soldi, tabelline]
  .sort((a, b) =>
    (ORDINE.indexOf(a.materia) - ORDINE.indexOf(b.materia)) || a.nome.localeCompare(b.nome))

export const MODULI_DEI_MAZZI = MODULI.filter(m => !m.soloSuRichiesta)

export const perId = id => MODULI.find(m => m.id === id)

export const perMateria = materia => MODULI.filter(m => m.materia === materia)

export function qualunque(sorte, { materie } = {}) {
  const buoni = materie ? MODULI.filter(m => materie.includes(m.materia)) : MODULI
  return sorte.uno(buoni)
}
