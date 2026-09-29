// Il registro dei giochi nuovi: manifesti puri, niente .vue né store (le
// schermate stanno in schermate.js). Vedi docs/core/convenzione-giochi.md.
// L'ordine è quello delle carte in home.
import codiceSegreto from './codice-segreto/gioco.js'
import survivors from './survivors/gioco.js'
import dungeon from './dungeon/gioco.js'
import conta from './conta/gioco.js'
import primaDopo from './prima-dopo/gioco.js'
import corsa from './corsa/gioco.js'
import fattoria from './fattoria/gioco.js'
import sotterraneo from './sotterraneo/gioco.js'
import pozioni from './pozioni/gioco.js'
import passoPasso from './passo-passo/gioco.js'
import costruttore from './costruttore/gioco.js'
import inglese from './inglese/gioco.js'

export const GIOCHI_NUOVI = [codiceSegreto, survivors, dungeon, conta, primaDopo, corsa, fattoria,
                             sotterraneo, pozioni, passoPasso, costruttore, inglese]

export const gioco = chiave => GIOCHI_NUOVI.find(g => g.chiave === chiave) || null

export const CHIAVI_NUOVE = GIOCHI_NUOVI.map(g => g.chiave)
