/* Il confine fra campo e programma: l'altezza che il campo prende quando
   il bambino sposta la striscia. La striscia si guarda col dito.

   `node test/esegui.mjs confine --niente-build` */
import { altezzaCampo, posto, sposta } from '../../src/giochi/confine.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

uguale('al posto di mezzo il campo resta com\'era', altezzaCampo(250, 700, 0), 250)
controlla('alzato il confine, il campo è più basso', altezzaCampo(250, 700, -1) < 250)
controlla('abbassato, è più alto', altezzaCampo(250, 700, 1) > 250)
uguale('ma mai sotto i 90 px', altezzaCampo(150, 500, -1), 90)
uguale('e mai oltre due terzi dello schermo', altezzaCampo(440, 600, 1), 396)

posto.value = 0
sposta(-1); sposta(-1)
uguale('il confine non sale oltre il primo posto', posto.value, -1)
sposta(1); sposta(1); sposta(1)
uguale('e non scende oltre l\'ultimo', posto.value, 1)
uguale('senza dire il posto vale quello scelto', altezzaCampo(200, 1000), 290)
posto.value = 0

riassunto('il confine fra campo e programma')
