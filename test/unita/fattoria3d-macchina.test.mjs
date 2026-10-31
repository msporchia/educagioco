/* Il foglio di una macchina della fattoria 3D, la parte pura (viste/macchina-pura.js): quante ricette si possono fare, l'ordine delle
   carte, i posti della fila, dove cade il dito e che gesto è. Vedi docs/fattoria3d/file.md. `node test/esegui.mjs fattoria3d-macchina`
   tempo: 1 */
import { quanteNePuoiFare, ordinaRicette, statoDelPosto, primoLibero, bersaglioSotto, gestoDelDito, TENUTO_MS } from '../../src/giochi/fattoria3d/viste/macchina-pura.js'
import { SCARTO_DITO, SCARTO_MOUSE } from '../../src/giochi/fattoria3d/viste/dito-soglie.js'
import { uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

// quante se ne possono fare
uguale('niente ingredienti: zero', quanteNePuoiFare([]), 0)
uguale('ne manca uno: zero', quanteNePuoiFare([{ ha: 5, serve: 2 }, { ha: 0, serve: 1 }]), 0)
uguale('vale il più scarso, arrotondato per difetto', quanteNePuoiFare([{ ha: 7, serve: 2 }, { ha: 9, serve: 3 }]), 3)
uguale('un solo ingrediente', quanteNePuoiFare([{ ha: 4, serve: 4 }]), 1)
uguale('una quantità zero non fa una scorta infinita', quanteNePuoiFare([{ ha: 4, serve: 0 }]), 0)

// l'ordine delle carte: aperte come stanno, poi le chiuse dalla più vicina
const R = [{ k: 'a', liv: 1, sbloccata: true }, { k: 'x', liv: 30, sbloccata: false }, { k: 'b', liv: 3, sbloccata: true }, { k: 'y', liv: 8, sbloccata: false }]
stessaLista('aperte nell\'ordine dei dati, poi le chiuse per livello', ordinaRicette(R).map(r => r.k), ['a', 'b', 'y', 'x'])
stessaLista('non cambia la lista che riceve', R.map(r => r.k), ['a', 'x', 'b', 'y'])

// la fila
uguale('un posto vuoto è libero', statoDelPosto(null), 'libero')
uguale('«in coda» aspetta', statoDelPosto({ k: 'pane', testo: 'in coda', barra: 0 }), 'aspetta')
uguale('con un tempo cuoce', statoDelPosto({ k: 'pane', testo: '12s', barra: 40 }), 'cuoce')
uguale('il primo libero', primoLibero([{ k: 'a' }, null, null]), 1)
uguale('nessun libero', primoLibero([{ k: 'a' }, { k: 'b' }]), -1)

// sotto il dito
const r = (left, top, w, h) => ({ left, top, right: left + w, bottom: top + h })
const posti = [r(10, 100, 80, 80), r(100, 100, 80, 80), r(190, 100, 80, 80)], zone = [r(0, 0, 300, 90), r(0, 90, 300, 140)]
stessaLista('dentro un posto', Object.values(bersaglioSotto(50, 140, posti, zone)), ['posto', 0])
stessaLista('il terzo', Object.values(bersaglioSotto(230, 170, posti, zone)), ['posto', 2])
stessaLista('appena fuori ma nel margine', Object.values(bersaglioSotto(95, 140, posti, zone)), ['posto', 0])
uguale('fra un posto e l\'altro, ma nella zona: la fila', bersaglioSotto(95, 220, posti, zone).tipo, 'fila')
uguale('sull\'insegna: la fila', bersaglioSotto(150, 40, posti, zone).tipo, 'fila')
uguale('più giù, sulle carte: niente', bersaglioSotto(150, 400, posti, zone), null)

// che gesto è
uguale('il dito fermo è un tocco', gestoDelDito({ dx: 3, dy: 5 }), 'fermo')
uguale('la soglia del dito è ~16 px: a 15 è ancora fermo', gestoDelDito({ dx: 0, dy: SCARTO_DITO - 1 }), 'fermo')
uguale('il mouse comincia prima', gestoDelDito({ dx: SCARTO_MOUSE + 1, dy: 0, mouse: true }), 'trascina')
uguale('il mouse con la soglia del dito sarebbe ancora fermo', gestoDelDito({ dx: SCARTO_MOUSE + 1, dy: 0 }), 'fermo')
uguale('di lato il dito trascina', gestoDelDito({ dx: 30, dy: 5, ms: 50 }), 'trascina')
uguale('su e giù svelto scorre il foglio', gestoDelDito({ dx: 4, dy: -40, ms: 80 }), 'scorri')
uguale('su e giù dopo averla tenuta trascina', gestoDelDito({ dx: 4, dy: -40, ms: TENUTO_MS + 10 }), 'trascina')
uguale('se il foglio non scorre, su e giù trascina', gestoDelDito({ dx: 0, dy: -40, ms: 50, puoScorrere: false }), 'trascina')

riassunto('foglio della macchina 3D')
