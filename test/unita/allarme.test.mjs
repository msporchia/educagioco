/* Quando si avvisa un grande che una domanda va male (`quiz/allarme.js`). Docs: docs/apprendimento/la-domanda.md */
import { chiAvvisare, testoAvviso, persiste, ABBASTANZA, PAUSA } from '../../src/quiz/allarme.js'
import { SETTIMANA } from '../../src/quiz/alleggerire.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const ORA = Date.UTC(2026, 9, 22)
const riga = (tipo, quante, dove = 'medie', nome = tipo) => ({ tipo, nome, quante, poche: false, classi: [{ dove }] })
const buone = n => Array.from({ length: n }, (_, i) => riga('b' + i, 10))
// una domanda che va male: 4 giuste su 14, dopo la settimana di aiuto del gioco ne sono arrivate 10 nuove, 3 giuste
const segnoVecchio = { quando: ORA - SETTIMANA - 1000, ok: 1, err: 3 }
const items = { m: { ok: 4, err: 10 } }

const m = riga('m', 14, 'medie', 'Mettere un numero al suo posto')
uguale('con la settimana di aiuto passata e ancora al muro, persiste', persiste(m, segnoVecchio, items, ORA), true)
uguale('ma durante la settimana no: il gioco sta ancora provando', persiste(m, { ...segnoVecchio, quando: ORA - 1000 }, items, ORA), false)
uguale('e senza un segno non c\'è stata nessuna settimana di aiuto', persiste(m, undefined, items, ORA), false)

const viste = [...buone(9), m]
const a = chiAvvisare({ viste, difficili: [m], alleggerite: { m: segnoVecchio }, items, now: ORA })
uguale('una domanda ostinata dopo l\'aiuto: si avvisa', a?.motivo, 'persistono')
controlla('e il testo dice quale, e cosa fare', /Mettere un numero al suo posto/.test(testoAvviso('Leonardo', a)) && /Come va/.test(testoAvviso('Leonardo', a)))
controlla('senza dare un giudizio sul bambino', !/(non ci arriva|è indietro|sbaglia sempre)/i.test(testoAvviso('Leonardo', a)))

uguale('la prima volta che va male no: prima c\'è la settimana di aiuto', chiAvvisare({ viste, difficili: [m], alleggerite: {}, items, now: ORA }), null)
uguale('una domanda un passo avanti non conta', chiAvvisare({ viste, difficili: [riga('m', 14, 'toste')], alleggerite: { m: segnoVecchio }, items, now: ORA }), null)
uguale('con meno risposte di ABBASTANZA no', chiAvvisare({ viste, difficili: [riga('m', ABBASTANZA - 1)], alleggerite: { m: segnoVecchio }, items, now: ORA }), null)
uguale('se l\'ha detto da meno di due settimane no', chiAvvisare({ viste, difficili: [m], alleggerite: { m: segnoVecchio }, items, ultimo: ORA - PAUSA + 1000, now: ORA }), null)
uguale('passate le due settimane sì', chiAvvisare({ viste, difficili: [m], alleggerite: { m: segnoVecchio }, items, ultimo: ORA - PAUSA - 1000, now: ORA })?.motivo, 'persistono')
uguale('«Non avvertirmi più»: mai', chiAvvisare({ viste, difficili: [m], alleggerite: { m: segnoVecchio }, items, now: ORA, attivo: false }), null)

const molte = Array.from({ length: 6 }, (_, i) => riga('x' + i, 14, 'medie', 'X' + i))
const t = chiAvvisare({ viste: [...buone(8), ...molte], difficili: molte, alleggerite: {}, items: {}, now: ORA })
uguale('parecchie insieme: si avvisa anche senza la settimana', t?.motivo, 'tante')
uguale('in un solo messaggio, con le prime due e quante altre', `${t.quali.length}+${t.altre}`, '2+4')
controlla('e non spaventa', /un po' troppo avanti/.test(testoAvviso('Leonardo', t)))
uguale('senza nome dice «Il bambino»', testoAvviso('', t).startsWith('Il bambino'), true)
riassunto('quando si avvisa un grande')
