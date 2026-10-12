/* La luce a cono (docs/sotterraneo/luce.md): davanti all'eroe un cono, attorno un alone corto, alle spalle l'ombra.

   Il cono davanti e l'ombra dietro (con e senza torcia), la torcia che allunga il cono ma non accende la stanza, il cono
   che sfuma ai bordi e si ferma a una porta chiusa, il verso che segue il passo (da fermo resta, toccando una cosa si
   gira), il mostro fuori luce che punta alle spalle e quello in luce che va dritto, l'agguato che scatta da dietro e non
   da davanti.
   `node test/esegui.mjs sotterraneo-luce --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { RAGGIO, RAGGIO_TORCIA, RAGGIO_SGOCCIOLI, ALONE, ALONE_TORCIA, APERTURA_CONO, DIETRO, FIANCO, PASSO_EROE, PASSO_MOSTRO }
  from '../../src/giochi/sotterraneo/dati/mondo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const roba = { v: 1, gemme: 0, zaino: [], mano: 'spada', mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }

/* Una discesa della tappa 5 (seme 11) senza i mostri del piano. `torcia`: le stanze che le restano (0 = al buio, senza
   scorta). L'eroe sta dove si dice, e guarda dove si dice (`verso`). */
function scena({ qui, verso = { dx: 1, dy: 0 }, torcia = 0 } = {}) {
  const c = new Corsa(CAMPAGNA[5], { seme: 11, rnd: seminato(11), roba })
  for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true
  c.vitaPiu += 60; c.vita = c.vitaMax
  c.torciaResta = torcia; c.torceInScorta = 0
  c.eroe = { x: qui.x + 0.5, y: qui.y + 0.5 }
  c.verso = verso
  c.aggiornaLuce()
  return c
}
const accesa = (c, x, y) => c.luceDi(x, y) === 2

const prova = new Corsa(CAMPAGNA[5], { seme: 11, rnd: seminato(11) })
const lunga = prova.livello.stanze.find(s => s.w >= 10)         // dieci per quattro: una riga lunga
const larga = prova.livello.stanze.find(s => s.w >= 7 && s.h >= 7)   // sette per sette e più: lati da girare attorno
controlla('ci sono una stanza lunga e una larga', !!lunga && !!larga)
const riga = lunga.y + 1
const io = { x: lunga.x + 3, y: riga }   // tre celle di stanza dietro, sei davanti

/* ── il cono davanti, l'ombra dietro ── */
{
  const buio = scena({ qui: io }), torcia = scena({ qui: io, torcia: 8 })
  controlla('senza torcia il cono è corto, poco più di prima', buio.raggioDellaLuce > 3 && buio.raggioDellaLuce < 4, String(buio.raggioDellaLuce))
  uguale('la cella dell\'eroe è sempre accesa', accesa(buio, io.x, io.y) && accesa(torcia, io.x, io.y), true)
  uguale('senza torcia, due celle davanti si vede', accesa(buio, io.x + 2, riga), true)
  uguale('senza torcia, cinque celle davanti no', accesa(buio, io.x + 5, riga), false)
  uguale('senza torcia, due celle dietro è ombra', accesa(buio, io.x - 2, riga), false)
  controlla('senza torcia, la cella subito dietro è appena un alone', accesa(buio, io.x - 1, riga) && buio.forzaDi(io.x - 1, riga) < 0.7,
            String(buio.forzaDi(io.x - 1, riga)))
  uguale('con la torcia, cinque celle davanti si vede', accesa(torcia, io.x + 5, riga), true)
  uguale('con la torcia, tre celle dietro è ombra', accesa(torcia, io.x - 3, riga), false)
  controlla('con la torcia, la cella subito dietro è accesa piena (circa una cella di alone)', torcia.forzaDi(io.x - 1, riga) > 0.9,
            String(torcia.forzaDi(io.x - 1, riga)))
  controlla('la torcia allunga il cono: tanta luce in più davanti, quasi la stessa dietro',
            torcia.raggioDellaLuce === RAGGIO_TORCIA && RAGGIO_TORCIA > RAGGIO + 2 && ALONE_TORCIA - ALONE < 1, `${RAGGIO} → ${RAGGIO_TORCIA}`)
  const davanti = c => [...c.luce].filter(k => (k % c.livello.largo) > io.x).length
  controlla('e davanti si accendono più celle', davanti(torcia) > davanti(buio), `${davanti(buio)} → ${davanti(torcia)}`)
  const stanza = (c, st) => { let n = 0; for (let x = st.x; x < st.x + st.w; x++) for (let y = st.y; y < st.y + st.h; y++) if (accesa(c, x, y)) n++; return n }
  controlla('la stanza non si accende più tutta, nemmeno con la torcia', stanza(torcia, lunga) < lunga.w * lunga.h, `${stanza(torcia, lunga)} su ${lunga.w * lunga.h}`)
  uguale('e non resta più il campo «stanza intera»', torcia.stanzaIntera, undefined)
  // il cono si apre di 120 gradi: a 45° dall'asse, a tre celle, si vede; a 90°, no
  const largaIo = { x: larga.x + 1, y: larga.cy }
  const aperta = scena({ qui: largaIo, torcia: 8 })
  uguale('a 45° dall\'asse si vede', accesa(aperta, largaIo.x + 3, largaIo.y + 3), true)
  uguale('a 90° dall\'asse (di lato) è ombra, oltre l\'alone', accesa(aperta, largaIo.x, largaIo.y + 3), false)
  controlla('l\'apertura è di 120 gradi', APERTURA_CONO === 120)
}

/* ── ai bordi sfuma, e una porta chiusa ferma la luce ── */
{
  const c = scena({ qui: io, torcia: 8 })
  const forze = [1, 2, 3, 4, 5, 6].map(i => c.forzaDi(io.x + i, riga))
  controlla('lungo il cono la luce scende piano: piena vicino, più fioca in fondo', forze[0] === 1 && forze[4] < forze[0] && forze[4] > 0,
            forze.map(f => f.toFixed(2)).join(' '))
  controlla('senza salti da una cella all\'altra più larghi di mezza luce', forze.slice(1).every((f, i) => forze[i] - f < 0.5),
            forze.map(f => f.toFixed(2)).join(' '))
  const porta = { che: 'porta', x: io.x + 2, y: riga, aperta: false }
  c.livello.robe.push(porta)
  c.aggiornaLuce()
  uguale('una porta chiusa si vede', accesa(c, porta.x, porta.y), true)
  uguale('e quello che c\'è dietro no', accesa(c, io.x + 4, riga), false)
  porta.aperta = true
  c.aggiornaLuce()
  uguale('aperta, la luce passa', accesa(c, io.x + 4, riga), true)
}

/* ── il verso: l'ultimo passo; da fermo resta; toccando una cosa ci si gira ── */
{
  const c = scena({ qui: io, torcia: 8, verso: null })
  uguale('prima del primo passo guarda dov\'è girato lo sprite (a destra)', c.versoEroe.dx, 1)
  c.guarda = 'sx'
  uguale('o a sinistra, se è girato così', c.versoEroe.dx, -1)
  c.guarda = 'dx'
  const passo = (dx, dy) => {
    c.strada = [{ x: Math.floor(c.eroe.x) + dx, y: Math.floor(c.eroe.y) + dy }]
    for (let i = 0; i < 20 && c.strada; i++) c.passo(0.05)
  }
  passo(-1, 0)
  uguale('un passo a sinistra: guarda a sinistra', `${c.verso.dx},${c.verso.dy}`, '-1,0')
  controlla('e la luce è andata con lui: davanti a sinistra si vede, a destra no',
            accesa(c, Math.floor(c.eroe.x) - 3, riga) && !accesa(c, Math.floor(c.eroe.x) + 3, riga))
  for (let i = 0; i < 30; i++) c.passo(0.05)
  uguale('da fermo il verso resta', `${c.verso.dx},${c.verso.dy}`, '-1,0')
  passo(1, 0)
  uguale('un passo a destra: guarda a destra', `${c.verso.dx},${c.verso.dy}`, '1,0')
  // toccare una cosa gira l'eroe verso di lei, anche prima di muoversi
  const f = { che: 'forziere', x: Math.floor(c.eroe.x) + 2, y: Math.floor(c.eroe.y) + 1, cosa: 'pozione' }
  c.livello.robe.push(f)
  c.aggiornaLuce()
  c.verso = { dx: 1, dy: 0 }
  c.vaiVerso({ x: f.x, y: f.y })
  controlla('toccando una cosa in basso a destra, ci si gira verso di lei', c.verso.dx > 0 && c.verso.dy > 0.3, `${c.verso.dx.toFixed(2)},${c.verso.dy.toFixed(2)}`)
}

/* ── i mostri: nella luce vanno dritti, nell'ombra cercano le spalle ── */
{
  const centro = { x: larga.cx, y: larga.cy }
  const mostro = (c, dx, dy) => {
    const m = c.livello.mostro('goblin', centro.x + dx, centro.y + dy)
    Object.assign(m, { ossa: 40, ossaMax: 40, att: 5, dif: 0, velocita: c.velocita, sveglio: true, stati: null })
    c.livello.robe.push(m)
    return m
  }
  const arriva = (c, m) => {
    const alle = []
    for (let i = 0; i < 400 && !c.foglio; i++) { c.muoviMostri(1 / 30); alle.push([m.fx, m.fy]) }
    return alle
  }
  // l'eroe guarda a destra: un mostro davanti, nella luce, va dritto e non arriva alle spalle
  {
    const c = scena({ qui: centro, torcia: 0 }), m = mostro(c, 2, 0)
    uguale('un mostro davanti a due celle è nella luce', accesa(c, m.x, m.y), true)
    const strada = arriva(c, m)
    controlla('dritto: non esce dalla riga dell\'eroe', strada.every(([, y]) => Math.abs(y - (centro.y + 0.5)) < 0.05))
    uguale('ti raggiunge', c.foglio && c.foglio.che, 'scontro')
    uguale('e davanti non è un agguato', c.foglio.agguato, false)
  }
  // un mostro nell'ombra, di lato: gira largo e ti prende alle spalle
  {
    const c = scena({ qui: centro, torcia: 0 }), m = mostro(c, 0, 3)
    uguale('un mostro di lato a tre celle è nell\'ombra', accesa(c, m.x, m.y), false)
    const strada = arriva(c, m)
    uguale('ti raggiunge', c.foglio && c.foglio.che, 'scontro')
    uguale('dalle spalle: è un agguato', c.foglio.agguato, true)
    const [fx, fy] = strada.at(-1)
    controlla('e sta dietro l\'eroe (opposto al verso)', (fx - c.eroe.x) * c.verso.dx + (fy - c.eroe.y) * c.verso.dy < 0)
    controlla('il tragitto non passa dal davanti: sempre da lato o da dietro, mai oltre la sua altezza',
              strada.every(([x]) => x <= c.eroe.x + 0.7))
    controlla('ci mette più che dritto (è un giro), ma meno di quanto l\'eroe corre via', strada.length / 30 > 2 / PASSO_MOSTRO)
  }
  // un mostro nell'ombra, dietro: punta dritto alle spalle
  {
    const c = scena({ qui: centro, torcia: 0 }), m = mostro(c, -3, 0)
    uguale('un mostro dietro a tre celle è nell\'ombra', accesa(c, m.x, m.y), false)
    arriva(c, m)
    uguale('agguato', c.foglio && c.foglio.agguato, true)
  }
  // un mostro oltre il cono, davanti: gira largo sul fianco (a FIANCO celle), non va dritto nella luce
  {
    const c = scena({ qui: { x: larga.x, y: larga.cy }, torcia: 0 })
    const m = c.livello.mostro('goblin', larga.x + larga.w - 1, larga.cy)
    Object.assign(m, { sveglio: true, fx: m.x + 0.5, fy: m.y + 0.5 })
    const meta = c.versoLeSpalle(m, larga)
    controlla('oltre il cono, davanti, punta al fianco (a FIANCO celle di lato) e non all\'eroe',
              Math.abs(Math.abs(meta.y - c.eroe.y) - FIANCO) < 0.05 && Math.abs(meta.x - c.eroe.x) < 0.5, JSON.stringify(meta))
  }
  // le spalle: la cella dietro l'eroe, a DIETRO celle (meno del tocco), per chi è già dietro
  {
    const c = scena({ qui: centro, torcia: 0 })
    const m = c.livello.mostro('goblin', centro.x - 3, centro.y)
    Object.assign(m, { fx: m.x + 0.5, fy: m.y + 0.5 })
    const meta = c.versoLeSpalle(m, larga)
    controlla('chi sta dietro punta alla cella subito dietro l\'eroe', Math.abs(meta.x - (c.eroe.x - DIETRO)) < 1e-9 && Math.abs(meta.y - c.eroe.y) < 1e-9)
  }
}

/* ── i mostri restano più lenti, e il verso resta l'ultimo passo ── */
controlla('i mostri restano più lenti dell\'eroe', PASSO_MOSTRO < PASSO_EROE)
controlla('lunghezze in ordine: senza torcia, agli sgoccioli, con la torcia', RAGGIO < RAGGIO_SGOCCIOLI && RAGGIO_SGOCCIOLI < RAGGIO_TORCIA)

riassunto('la luce a cono')
