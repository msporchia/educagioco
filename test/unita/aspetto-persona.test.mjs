/* ═══════════════════════════════════════════════════════════════════
   L'ASPETTO IN COMUNE — src/grafica/persona/aspetto.js

   I toni della pelle e i colori dei capelli che usano la fattoria e il
   sotterraneo: ids unici, colori veri, e le due funzioni che li cercano.
   ═══════════════════════════════════════════════════════════════════ */
import { PELLI, COLORI_CAPELLI, pelleDi, capelliDi, soloNaturali, sfuma, guastiDellAspetto } from '../../src/grafica/persona/aspetto.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const guasti = guastiDellAspetto()
controlla('i dati non hanno guasti', guasti.length === 0, guasti.join(' | '))
uguale('cinque toni di pelle', PELLI.length, 5)
uguale('la pelle dorata è quella di serie della fattoria', pelleDi('dorata').css, '#f5c9a2')
uguale('un id che non c\'è non è niente', pelleDi('zzz'), null)
uguale('i castani', capelliDi('castani').c, 0x6b4423)
controlla('i naturali non hanno colori di fantasia', soloNaturali().every(c => !c.fantasia) && soloNaturali().length < COLORI_CAPELLI.length)
uguale('scurire un tono', sfuma(0xffffff, 0.5), 0x808080)
uguale('schiarire non sborda', sfuma(0xf0f0f0, 2), 0xffffff)
riassunto('l\'aspetto in comune')
