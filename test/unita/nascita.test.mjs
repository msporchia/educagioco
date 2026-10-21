/* La data di nascita (`data/nascita.js`): mese e anno, l'età che ne esce, il compleanno, lo scarto. Docs: docs/genitori/riordino.md */
import { etaAnagrafica, etaVoluta, etaDiClasse, annoScolastico, inClasse, nomeClasse, prossimaClasse, nascitaValida, dentroGliEstremi, inParole, ETA_MIN, ETA_MAX } from '../../src/data/nascita.js'
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

/* la scuola: si cambia classe a settembre, non al compleanno */
uguale('l\'anno scolastico di ottobre 2026 è il 2026/27', annoScolastico(OGGI), 2026)
uguale('e quello di maggio 2026 il 2025/26', annoScolastico(new Date(2026, 4, 10)), 2025)
uguale('nato a marzo 2018 è in terza (si tara sugli 8 anni)', etaDiClasse(marzo2018, OGGI), 8)
uguale('nato a novembre 2018, a 7 anni e 11 mesi, è comunque in terza: 8, non 7', etaDiClasse({ m: 10, a: 2018 }, OGGI), 8)
uguale('nato a dicembre 2018 è in terza lo stesso: la classe dipende dall\'anno', etaDiClasse({ m: 11, a: 2018 }, OGGI), 8)
uguale('a luglio non cambia: la classe nuova comincia a settembre', etaDiClasse(marzo2018, new Date(2026, 6, 1)), 7)
uguale('e a settembre cambia', etaDiClasse(marzo2018, new Date(2026, 8, 1)), 8)
uguale('terza elementare', nomeClasse(8), 'terza elementare')
uguale('prima media', nomeClasse(11), 'prima media')
uguale('prima superiore', nomeClasse(14), 'prima superiore')
uguale('a ottobre è appena cominciata', inClasse(marzo2018, OGGI), 'è in terza elementare, da poco cominciata')
uguale('a febbraio è a metà', inClasse(marzo2018, new Date(2027, 1, 10)), 'è in terza elementare, a metà anno')
uguale('a maggio verso la fine', inClasse(marzo2018, new Date(2027, 4, 10)), 'è in terza elementare, verso la fine')
uguale('a luglio ha finito', inClasse(marzo2018, new Date(2027, 6, 10)), 'ha finito la terza elementare')
uguale('senza scarto si tara sulla classe', etaVoluta(marzo2018, 0, OGGI), 8)
uguale('un anno più avanti', etaVoluta(marzo2018, 1, OGGI), 9)
uguale('un anno più indietro', etaVoluta(marzo2018, -1, OGGI), 7)
uguale('mai sotto il minimo', etaVoluta({ m: 5, a: 2026 }, -2, OGGI), ETA_MIN)
uguale('né sopra il massimo', etaVoluta({ m: 0, a: 2008 }, 3, OGGI), ETA_MAX)
uguale('lo scarto che non è un numero intero si ignora', etaVoluta(marzo2018, 'x', OGGI), 8)
uguale('gli estremi', [dentroGliEstremi(1), dentroGliEstremi(20)].join(), `${ETA_MIN},${ETA_MAX}`)

const c = prossimaClasse(marzo2018, OGGI)
uguale('la prossima classe è la quarta', c.nome, 'quarta elementare')
uguale('fra undici mesi (a settembre)', c.fra, 11)
uguale('da gennaio mancano otto mesi', prossimaClasse(marzo2018, new Date(2027, 0, 5)).fra, 8)
riassunto('la data di nascita')
