/* L'iniziativa dell'eroe (docs/sotterraneo/scontro.md, «L'iniziativa»): 7 più un punto di destrezza, quindi il doppio
   turno è dell'agile (l'elfa) e il mago, coi mostri normali della sua discesa, non gioca mai due volte di fila.
   `node test/esegui.mjs sotterraneo-iniziativa --niente-build` (la stampa per classe e discesa: `npm run sotterraneo -- --turni`) */
import { fileGiocata, VELOCITA_BASE_EROE, VELOCITA_PER_DESTREZZA } from '../../src/giochi/sotterraneo/motore/turni.js'
import { eroeAtteso } from '../../src/giochi/sotterraneo/motore/forza.js'
import { LIVELLI_ATTESI } from '../../src/giochi/sotterraneo/dati/storia.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

uguale('la base è 7', VELOCITA_BASE_EROE, 7)
uguale('e un punto di velocità a punto di destrezza', VELOCITA_PER_DESTREZZA, 1)
const parte = e => eroeAtteso(e, 1).velocita
uguale('il mago parte da 9', parte('mago'), 9)
uguale('l\'elfa da 11', parte('elfa'), 11)
uguale('il cavaliere e il nano da 9', `${parte('cavaliere')} ${parte('nano')}`, '9 9')

// i mostri normali (veloci almeno quanto lui) non gli lasciano mai due turni di fila, in nessuna discesa e al livello atteso
for (const [k, t] of CAMPAGNA.entries()) {
  const mago = eroeAtteso('mago', LIVELLI_ATTESI[k]).velocita
  for (const specie of t.mostri.filter(s => MOSTRI[s].velocita >= mago))
    uguale(`${t.chiave}: il mago contro ${specie} (${MOSTRI[specie].velocita}) da solo non ha doppi turni`, fileGiocata(mago, [MOSTRI[specie].velocita]).doppi, 0)
}
// l'agile sì, ogni tanto: l'elfa della torre (12, con un punto di destrezza in più) contro un mostro da 10, e di rado in un branco; alla partenza (11) quasi mai
const elfa = eroeAtteso('elfa', LIVELLI_ATTESI[2]).velocita

uguale('l\'elfa della torre è a 12', elfa, 12)
controlla('l\'elfa ha il doppio turno ogni tanto contro un mostro da 10', fileGiocata(elfa, [10]).doppi > 0.1 && fileGiocata(elfa, [10]).doppi < 0.5, `${fileGiocata(elfa, [10]).doppi}`)
controlla('e in un branco di tre, più di rado', fileGiocata(elfa, [10, 9, 8]).doppi < fileGiocata(elfa, [10]).doppi, fileGiocata(elfa, [10, 9, 8]).fila)
controlla('il mago contro un branco di tre da 9 non ha doppi turni', fileGiocata(9, [9, 9, 9]).doppi === 0, fileGiocata(9, [9, 9, 9]).fila)

riassunto('l\'iniziativa dell\'eroe')
