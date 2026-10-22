/* Il giudizio in una frase di «Come va» (`giudizioDi` in quiz/comeva.js). Docs: docs/genitori/come-va.md */
import { giudizioDi, POCHE_RISPOSTE } from '../../src/quiz/comeva.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const riga = (tipo, quante, dove = 'medie', poche = false) => ({ tipo, quante, poche, classi: [{ dove }] })
const bene = n => Array.from({ length: n }, (_, i) => riga('b' + i, 10))

uguale('con poche risposte non si giudica', giudizioDi({ viste: [riga('a', 5), riga('b', 5), riga('c', 5)] }).tono, 'attesa')
uguale('e con meno di tre domande nemmeno', giudizioDi({ viste: [riga('a', 30), riga('b', 30)] }).tono, 'attesa')
uguale('senza difficili sta andando bene', giudizioDi({ viste: bene(5) }).tono, 'bene')
controlla('e dice che è migliorato', /migliorato su 2/.test(giudizioDi({ viste: bene(5), migliorate: 2 }).testo))

const duro = riga('d', 12, 'toste')
const g1 = giudizioDi({ viste: [...bene(5), duro], difficili: [duro] })
uguale('solo una difficile di un passo avanti: normale', g1.tono, 'normale')
uguale('e lo dice con le parole giuste', g1.titolo, 'Ha difficoltà con le domande più difficili')

const male = riga('m', 12, 'medie')
const g2 = giudizioDi({ viste: [...bene(9), male], difficili: [male] })
uguale('una del suo livello: alcune domande', g2.tono, 'alcune')
uguale('con il titolo che dice «alcune»', g2.titolo, 'Ha difficoltà con alcune domande')
controlla('e quante su quante, con il verbo giusto', /Una su 10 va male/.test(g2.testo), g2.testo)

const mix = giudizioDi({ viste: [...bene(5), male, duro], difficili: [male, duro] })
uguale('una del livello e una difficile: alcune domande', mix.tono, 'alcune')

const molte = Array.from({ length: 6 }, (_, i) => riga('x' + i, 12))
uguale('molte del suo livello: fa fatica con parecchie', giudizioDi({ viste: [...bene(8), ...molte], difficili: molte }).tono, 'tante')
controlla('e suggerisce di abbassare la taratura', /abbassare l'età/.test(giudizioDi({ viste: [...bene(8), ...molte], difficili: molte }).testo))
controlla(`la soglia delle risposte è ${POCHE_RISPOSTE}`, POCHE_RISPOSTE === 20)
riassunto('il giudizio di come va')
