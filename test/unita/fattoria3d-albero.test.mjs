/* «Come si fa» della fattoria 3D: l'albero di una merce (dati/albero.js) e a cosa serve una merce (dati/usi.js). Puri: niente Vue, niente three.
   Ogni merce ha un albero che finisce in colture, bestie o «arriva più avanti»; le quantità scendono moltiplicate; la scorta si spartisce.
   Vedi docs/fattoria3d/guida.md. `node test/esegui.mjs fattoria3d-albero`
   tempo: 1 */
import { alberoDi, righeDi, foglieDi, profonditaDellAlbero, PROFONDITA } from '../../src/giochi/fattoria3d/dati/albero.js'
import { usiDi, serveA, guastiDegliUsi } from '../../src/giochi/fattoria3d/dati/usi.js'
import { comeAvere } from '../../src/giochi/fattoria3d/motore/consiglio.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { sogliaDi, ULTIMO } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { PRODOTTI_ANIMALI, LANA } from '../../src/giochi/fattoria3d/dati/animali.js'
import { controlla, uguale as ug, riassunto } from '../aiuto/verifica.mjs'
const uguale = (n, a, b) => ug(n, JSON.stringify(a), JSON.stringify(b))

function mondo({ monete = 1000, liv = 1 } = {}) {
  const b = { monete }, t = { ora: 1_000_000 }
  const f = new Fattoria3d({ borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora })
  f.s.esperienza = sogliaDi(liv)
  f.tick()
  return { f, t }
}

/* ══════════ 1. a cosa serve ══════════ */
controlla('niente guasti negli usi: ogni merce serve a qualcosa e ha nome e faccia', guastiDegliUsi().length === 0, guastiDegliUsi().join('; '))
controlla('la farina serve al pane e si dice dove', usiDi('farina').some(u => u.che === 'ricetta' && u.nome === 'Pane' && u.dove === 'Panificio'))
controlla('serveA dà i nomi delle ricette', serveA('farina').includes('Pane'))
controlla('il becchime lo mangiano le galline e non si consegna', usiDi('becchime').some(u => u.che === 'bestie' && /galline/.test(u.nome)) && !usiDi('becchime').some(u => u.che === 'banco'))
controlla('un prodotto finito si consegna al banco', usiDi('pane').some(u => u.che === 'banco'))
controlla('una merce che non c\'è non serve a niente', usiDi('boh').length === 0)

/* ══════════ 2. l'albero ══════════ */
{
  const { f } = mondo({ liv: ULTIMO })
  const pane = alberoDi(f, 'pane')
  uguale('il pane si fa nel panificio', [pane.via.che, pane.via.tipo], ['macchina', 'panificio'])
  uguale('…con due farine', [pane.rami[0].k, pane.rami[0].servono], ['farina', 2])
  uguale('…che vogliono quattro grani (2 per farina, e due farine)', foglieDi(pane).map(n => [n.k, n.servono]), [['grano', 4]])
  controlla('la radice dice di cosa è', pane.nome === 'Pane' && pane.emoji === '🍞')
  const lav = alberoDi(f, 'maglione_lavanda')
  controlla('una catena lunga si srotola: maglione alla lavanda ha 5 o più fasi', profonditaDellAlbero(lav) >= 5, String(profonditaDellAlbero(lav)))
  controlla('…ma mai più di PROFONDITA', profonditaDellAlbero(lav) <= PROFONDITA)
  controlla('le righe sono in fila con le rotaie', righeDi(lav).length > 5 && righeDi(lav)[0].livello === 0 && righeDi(lav).every(r => Array.isArray(r.guide)))
  const uova = alberoDi(f, 'uova')
  uguale('le uova vengono dal pollaio e vogliono il suo mangime', [uova.via.che, uova.via.tipo, uova.rami[0].k], ['bestie', 'pollaio', 'becchime'])
  uguale('…e il becchime viene dal grano', foglieDi(uova).map(n => n.k), ['grano'])
  uguale('il pesce si pesca dal molo', [alberoDi(f, 'pesce').via.che, alberoDi(f, 'pesce').rami.length], ['molo', 0])
  uguale('la lana viene dal recinto', alberoDi(f, 'lana').via.tipo, 'recinto')
  uguale('una merce che non esiste: niente albero', alberoDi(f, 'boh'), null)
  controlla('ogni merce ha un albero che finisce in colture, bestie o «arriva più avanti»', [...Object.keys(COLTURE), ...Object.keys(RICETTE), ...Object.keys(PRODOTTI_ANIMALI), ...Object.keys(LANA)].every(k => {
    const a = alberoDi(f, k)
    return a && foglieDi(a).every(n => n.stato === 'arriva' || (n.via && ['campo', 'bestie', 'molo'].includes(n.via.che)))
  }))
}

/* ══════════ 3. a che punto si è ══════════ */
{
  const { f } = mondo({ liv: 17 })
  const farina = alberoDi(f, 'farina')
  controlla('senza il mulino: «compra» col prezzo', farina.via.stato === 'compra' && farina.via.prezzo > 0, JSON.stringify(farina.via))
  controlla('il grano dice come sta il campo', ['nessuno', 'libero', 'cresce', 'pronto', 'occupati'].includes(farina.rami[0].via.stato))
  f.s.merci.grano = 1
  const dopo = alberoDi(f, 'farina')
  uguale('con 1 grano contro 2 che ne servono: ne hai 1, manca', [dopo.rami[0].ho, dopo.rami[0].servono, dopo.rami[0].stato], [1, 2, 'manca'])
}
{
  // la scorta si spartisce: due rami che vogliono grano non dicono tutti e due «ne hai 3»
  const { f } = mondo({ liv: ULTIMO })
  f.s.merci.grano = 3
  const pasta = alberoDi(f, 'biscotti')   // farina + burro + zucchero: solo la farina vuole grano, il resto no
  controlla('biscotti: la farina prende i grani', pasta.rami.find(r => r.k === 'farina').rami[0].ho === 3)
  const lasagne = alberoDi(f, 'lasagne')   // pasta (farina, uova) + salsa + formaggio
  const grani = righeDi(lasagne).filter(r => r.k === 'grano')
  controlla('lasagne: i grani non si contano due volte', grani.length > 1 ? grani.reduce((n, r) => n + Math.min(r.ho, r.servono), 0) <= 3 : true, JSON.stringify(grani.map(r => [r.ho, r.servono])))
}
{
  const { f, t } = mondo({ liv: 1 })
  const c = f.s.cose.find(x => x.tipo === 'campo')
  let g = alberoDi(f, 'grano')
  uguale('un campo vuoto: libero', g.via.stato, 'libero')
  f.semina(c.id, 'grano')
  g = alberoDi(f, 'grano')
  controlla('seminato: cresce, coi secondi che restano', g.via.stato === 'cresce' && g.via.manca > 0, JSON.stringify(g.via))
  t.ora += 301_000
  uguale('maturo: pronto', alberoDi(f, 'grano').via.stato, 'pronto')
  uguale('il livello che non c\'è ancora: arriva', [alberoDi(f, 'riso').stato, alberoDi(f, 'riso').arriva > 1], ['arriva', true])
}

/* ══════════ 4. il tasto: la frase e l'azione sono quelle del consiglio ══════════ */
{
  const { f } = mondo({ liv: 17 })
  const a = alberoDi(f, 'farina', k => comeAvere(f, k))
  controlla('un nodo che manca porta il tasto del consiglio', a.azione && a.azione.che === comeAvere(f, 'farina').azione.che && !!a.testo, JSON.stringify(a.azione))
  f.s.merci.grano = 9
  f.s.posseduti.mulino = true
  const b = alberoDi(f, 'grano', k => comeAvere(f, k))
  uguale('un nodo che c\'è non ha tasto', b.azione, null)
}

riassunto()
