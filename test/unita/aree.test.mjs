/* Le aree di «Come va»: le materie raggruppate in cinque, dall'area alle materie (`areeDi` in quiz/comeva.js). Docs: docs/genitori/come-va.md */
import { AREE, areaDi, areeDi, DIFFERENZA } from '../../src/quiz/comeva.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

uguale('cinque aree', AREE.length, 5)
uguale('la matematica è nei numeri', areaDi('matematica'), 'numeri')
uguale('le tabelline pure', areaDi('mate'), 'numeri')
uguale('l\'inglese è nelle lingue', areaDi('inglese'), 'lingue')
uguale('il tempo sta con lo spazio', areaDi('tempo'), 'spazio')
uguale('una materia sconosciuta va in logica e scienze', areaDi('chissà'), 'logica')
controlla('nessuna materia è in due aree', new Set(AREE.flatMap(a => a.materie)).size === AREE.flatMap(a => a.materie).length)

/* una materia: `ok` giuste su `n` risposte; `prima` è la percentuale di giuste di due settimane fa */
const m = (id, ok, n, prima = null) => ({ id, nome: id, ok, err: n - ok, giuste: Math.round(ok / n * 100), risposte: n, prima, visti: 1 })
const a = areeDi({ viste: [m('matematica', 40, 50, 60), m('mate', 10, 20, 40), m('mente', 6, 10), m('tempo', 4, 10)], nonAncora: [m('torri', 0, 1), m('italiano', 0, 1)] })
uguale('sempre cinque aree, anche vuote', a.length, 5)
const numeri = a.find(x => x.id === 'numeri')
uguale('le giuste sulle risposte date, non la media delle percentuali', numeri.pct, 70)   // 56 su 80
uguale('quante risposte', numeri.risposte, 80)
uguale('e di com\'erano (solo dove c\'è la fotografia)', numeri.prima, 50)
uguale('la freccia sale', numeri.freccia, 'su')
uguale('la migliore materia dei numeri', numeri.materie.filter(x => x.meglio).map(x => x.id).join(), 'matematica')
uguale('la peggiore', numeri.materie.filter(x => x.peggio).map(x => x.id).join(), 'mate')
uguale('le mai giocate stanno a parte', numeri.nonAncora.map(x => x.id).join(), 'torri')
uguale('un\'area senza risposte non ha percentuale', a.find(x => x.id === 'italiano').pct, null)
uguale('e nessuna freccia', a.find(x => x.id === 'italiano').freccia, null)
uguale('con meno di otto risposte è «poche prove»', a.find(x => x.id === 'spazio').poche, false)
uguale('anche una sola risposta', areeDi({ viste: [m('tempo', 1, 3)] }).find(x => x.id === 'spazio').poche, true)
uguale('una materia sola non dice meglio o peggio', a.find(x => x.id === 'spazio').materie.some(x => x.meglio || x.peggio), false)
const vicine = areeDi({ viste: [m('matematica', 70, 100), m('mate', 70 - DIFFERENZA + 1, 100)] }).find(x => x.id === 'numeri')
uguale('sotto la differenza non si dice nulla', vicine.materie.some(x => x.meglio || x.peggio), false)
const poche = areeDi({ viste: [m('matematica', 5, 5), m('mate', 1, 3)] }).find(x => x.id === 'numeri')
uguale('con poche risposte per materia non si dice meglio o peggio', poche.materie.some(x => x.meglio || x.peggio), false)
riassunto('le aree di come va')
