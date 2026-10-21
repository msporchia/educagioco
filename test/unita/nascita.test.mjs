/* La data di nascita (`data/nascita.js`): mese e anno, l'età che ne esce, il compleanno, lo scarto. Docs: docs/genitori/riordino.md */
import { etaAnagrafica, etaVoluta, prossimoCompleanno, nascitaValida, dentroGliEstremi, inParole, ETA_MIN, ETA_MAX } from '../../src/data/nascita.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const OGGI = new Date(2026, 9, 21)               // 21 ottobre 2026
const marzo2018 = { m: 2, a: 2018 }
const e = etaAnagrafica(marzo2018, OGGI)
uguale('nato a marzo 2018, a ottobre 2026 ha 8 anni', e.anni, 8)
uguale('e 7 mesi', e.mesi, 7)
uguale('a dirlo', inParole(e), '8 anni e 7 mesi')
uguale('il mese del compleanno ha già un anno in più (si conta dal primo)', etaAnagrafica({ m: 9, a: 2018 }, OGGI).anni, 8)
uguale('e il mese dopo ancora no', etaAnagrafica({ m: 10, a: 2018 }, OGGI).anni, 7)
uguale('un anno solo si dice al singolare', inParole({ anni: 1, mesi: 1 }), '1 anno e 1 mese')
controlla('una data nel futuro non c\'è', etaAnagrafica({ m: 11, a: 2026 }, OGGI) === null)
controlla('né una senza senso', etaAnagrafica(null, OGGI) === null && etaAnagrafica({ m: 12, a: 2018 }, OGGI) === null && etaAnagrafica({ m: 2, a: 1900 }, OGGI) === null)
controlla('valida solo con mese e anno interi', nascitaValida(marzo2018, OGGI) && !nascitaValida({ m: '2', a: 2018 }, OGGI))

uguale('senza scarto si tara sui suoi anni', etaVoluta(marzo2018, 0, OGGI), 8)
uguale('un anno più avanti', etaVoluta(marzo2018, 1, OGGI), 9)
uguale('un anno più indietro', etaVoluta(marzo2018, -1, OGGI), 7)
uguale('mai sotto il minimo', etaVoluta({ m: 5, a: 2026 }, -2, OGGI), ETA_MIN)
uguale('né sopra il massimo', etaVoluta({ m: 0, a: 2008 }, 3, OGGI), ETA_MAX)
uguale('lo scarto che non è un numero intero si ignora', etaVoluta(marzo2018, 'x', OGGI), 8)
uguale('gli estremi', [dentroGliEstremi(1), dentroGliEstremi(20)].join(), `${ETA_MIN},${ETA_MAX}`)

const c = prossimoCompleanno(marzo2018, OGGI)
uguale('il prossimo compleanno: a 9 anni', c.anni, 9)
uguale('fra cinque mesi', c.fra, 5)
uguale('a marzo', c.mese, 'marzo')
uguale('il mese stesso del compleanno è già «cambiato»: il prossimo è fra un anno', prossimoCompleanno({ m: 9, a: 2018 }, OGGI).fra, 12 - 0)
riassunto('la data di nascita')
