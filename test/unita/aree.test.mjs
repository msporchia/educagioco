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

const m = (id, pct, prima = null) => ({ id, nome: id, pct, prima, visti: 1 })
const a = areeDi({ viste: [m('matematica', 80, 60), m('mate', 50, 40), m('mente', 78), m('tempo', 40)], nonAncora: [m('torri', 0), m('italiano', 0)] })
uguale('sempre cinque aree, anche vuote', a.length, 5)
const numeri = a.find(x => x.id === 'numeri')
uguale('la media dei numeri', numeri.pct, 69)
uguale('e di com\'erano (solo dove c\'è la fotografia)', numeri.prima, 50)
uguale('la freccia sale', numeri.freccia, 'su')
uguale('la migliore materia dei numeri', numeri.materie.filter(x => x.meglio).map(x => x.id).join(), 'matematica')
uguale('la peggiore', numeri.materie.filter(x => x.peggio).map(x => x.id).join(), 'mate')
uguale('le mai giocate stanno a parte', numeri.nonAncora.map(x => x.id).join(), 'torri')
uguale('un\'area senza materie giocate non ha percentuale', a.find(x => x.id === 'italiano').pct, null)
uguale('e nessuna freccia', a.find(x => x.id === 'italiano').freccia, null)
uguale('una materia sola non dice meglio o peggio', a.find(x => x.id === 'spazio').materie.some(x => x.meglio || x.peggio), false)
const vicine = areeDi({ viste: [m('matematica', 70), m('mate', 70 - DIFFERENZA + 1)] }).find(x => x.id === 'numeri')
uguale('sotto la differenza non si dice nulla', vicine.materie.some(x => x.meglio || x.peggio), false)
riassunto('le aree di come va')
