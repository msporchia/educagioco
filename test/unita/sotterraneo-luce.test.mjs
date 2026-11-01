/* La luce a cono (docs/sotterraneo/luce.md): davanti all'eroe un cono, attorno un alone corto, alle spalle l'ombra.

   Il cono davanti e l'ombra dietro (con e senza torcia), la torcia che allunga il cono ma non accende la stanza, il cono
   che sfuma ai bordi e si ferma a una porta chiusa, il verso che segue il passo (da fermo resta, toccando una cosa si
   gira), il mostro fuori luce che punta alle spalle e quello in luce che va dritto, l'agguato che scatta da dietro e non
   da davanti; con la torcia accesa il cono quasi gira attorno, l'alone copre le spalle e nessuno arriva da dietro (né
   agguato né giro largo), mentre la sorpresa dell'eroe resta. In fondo la torcia appesa da prendere.
   `node test/esegui.mjs sotterraneo-luce --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { RAGGIO, RAGGIO_TORCIA, RAGGIO_SGOCCIOLI, ALONE, ALONE_TORCIA, APERTURA_CONO, APERTURA_TORCIA, APERTURA_SGOCCIOLI, DIETRO, FIANCO, PASSO_EROE, PASSO_MOSTRO }
  from '../../src/giochi/sotterraneo/dati/mondo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Livello, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// qui servono stanze lisce: niente relitti né nicchie (hanno il loro test, `sotterraneo-piani`), o un ostacolo sulla riga dell'eroe cambia
// la strada dei mostri e la luce, che non è quello che si prova
Livello.prototype.piazzaIRelitti = function () {}
Livello.prototype.scavaLeNicchie = function () {}

const roba = { v: 1, gemme: 0, zaino: [], mano: 'spada', mancina: null, corpo: null, dito: null, torcia: 0, torce: 0 }

/* Una discesa della tappa 5 (un seme che ha una stanza lunga e una larga, vuote: SEME) senza i mostri del piano. `torcia`: le stanze che le restano (0 = al buio, senza
   scorta). L'eroe sta dove si dice, e guarda dove si dice (`verso`). */
function scena({ qui, verso = { dx: 1, dy: 0 }, torcia = 0 } = {}) {
  const c = new Corsa(CAMPAGNA[5], { seme: SEME, rnd: seminato(SEME), roba })
  for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true
  c.vitaPiu += 60; c.vita = c.vitaMax
  c.torciaResta = torcia; c.torceInScorta = 0
  c.eroe = { x: qui.x + 0.5, y: qui.y + 0.5 }
  c.verso = verso
  c.aggiornaLuce()
  return c
}
const accesa = (c, x, y) => c.luceDi(x, y) === 2

// stanze di prova: un rettangolo pieno (le stanze dei piani nuovi sono anche L, croci, grotte, sale con le colonne e relitti: lì il
// percorso di un mostro gira attorno a un ostacolo, e non è quello che la prova guarda)
const piena = s => s.colonne.length === 0 && s.relitti.length === 0 && s.nicchie.length === 0 && s.suolo.length === s.w * s.h
const lungaDi = l => l.stanze.find(s => s.w >= 10 && piena(s))              // dieci per quattro: una riga lunga
const largaDi = l => l.stanze.find(s => s.w >= 7 && s.h >= 7 && piena(s))   // sette per sette e più: lati da girare attorno
let SEME = 11
while (SEME < 400) {
  const l = new Corsa(CAMPAGNA[5], { seme: SEME, rnd: seminato(SEME) }).livello
  if (lungaDi(l) && largaDi(l)) break
  SEME++
}
const prova = new Corsa(CAMPAGNA[5], { seme: SEME, rnd: seminato(SEME) })
const lunga = lungaDi(prova.livello)
const larga = largaDi(prova.livello)
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
  controlla('con la torcia, tre celle dietro si vede ancora: l\'alone copre le spalle', accesa(torcia, io.x - 3, riga) && torcia.forzaDi(io.x - 3, riga) > 0.5,
            String(torcia.forzaDi(io.x - 3, riga)))
  controlla('con la torcia, la cella subito dietro è accesa piena (circa una cella di alone)', torcia.forzaDi(io.x - 1, riga) > 0.9,
            String(torcia.forzaDi(io.x - 1, riga)))
  controlla('la torcia allunga il cono di molto e allarga l\'alone di due celle e più',
            torcia.raggioDellaLuce === RAGGIO_TORCIA && RAGGIO_TORCIA > RAGGIO + 5 && ALONE_TORCIA - ALONE >= 2, `${RAGGIO} → ${RAGGIO_TORCIA}, ${ALONE} → ${ALONE_TORCIA}`)
  const davanti = c => [...c.luce].filter(k => (k % c.livello.largo) > io.x).length
  controlla('e davanti si accendono più celle', davanti(torcia) > davanti(buio), `${davanti(buio)} → ${davanti(torcia)}`)
  const stanza = (c, st) => { let n = 0; for (let x = st.x; x < st.x + st.w; x++) for (let y = st.y; y < st.y + st.h; y++) if (accesa(c, x, y)) n++; return n }
  controlla('la stanza non si accende più tutta, nemmeno con la torcia', stanza(torcia, lunga) < lunga.w * lunga.h, `${stanza(torcia, lunga)} su ${lunga.w * lunga.h}`)
  uguale('e non resta più il campo «stanza intera»', torcia.stanzaIntera, undefined)
  // il cono si apre di 120 gradi: a 45° dall'asse, a tre celle, si vede; a 90°, no
  const largaIo = { x: larga.x + 1, y: larga.cy }
  const aperta = scena({ qui: largaIo, torcia: 8 })
  uguale('a 45° dall\'asse si vede', accesa(aperta, largaIo.x + 3, largaIo.y + 3), true)
  uguale('a 90° dall\'asse (di lato) è luce: il buio è solo alle spalle', accesa(aperta, largaIo.x, largaIo.y + 3), true)
  controlla('l\'apertura è di 220 gradi: buio solo alle spalle', APERTURA_CONO === 220)
  // con la torcia i fianchi sono pieni, e alle spalle resta solo un'ombra lontana
  controlla('con la torcia il cono si apre di più (sgoccioli in mezzo), e un poco d\'ombra dietro resta',
            APERTURA_CONO < APERTURA_SGOCCIOLI && APERTURA_SGOCCIOLI < APERTURA_TORCIA && APERTURA_TORCIA < 360, `${APERTURA_CONO} ${APERTURA_SGOCCIOLI} ${APERTURA_TORCIA}`)
  // dall'angolo, guardando a destra: la cella cinque sotto è di lato (90°), oltre l'alone
  const angolo = { x: larga.x, y: larga.y }, fianco = c => c.forzaDi(angolo.x, angolo.y + 5)
  const fiancoTorcia = fianco(scena({ qui: angolo, torcia: 8 }))
  controlla('con la torcia, di lato a cinque celle è luce quasi piena (quanto davanti alla stessa distanza)',
            fiancoTorcia > 0.7 && Math.abs(fiancoTorcia - scena({ qui: angolo, torcia: 8 }).forzaDi(angolo.x + 5, angolo.y)) < 0.01, String(fiancoTorcia))
  uguale('senza torcia, di lato a cinque celle è buio', accesa(scena({ qui: angolo }), angolo.x, angolo.y + 5), false)
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
            accesa(c, Math.floor(c.eroe.x) - 3, riga) && !accesa(c, Math.floor(c.eroe.x) + 5, riga))
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
  // un mostro nell'ombra, dietro di sbieco: gira e ti prende alle spalle (di lato ormai è luce: il cono è di 220°)
  {
    const c = scena({ qui: centro, torcia: 0 }), m = mostro(c, -2, 3)
    uguale('un mostro dietro di sbieco a tre celle è nell\'ombra', accesa(c, m.x, m.y), false)
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

/* ── con la torcia accesa nessuno arriva alle spalle: né agguato, né giro largo; la sorpresa resta ── */
{
  const centro = { x: larga.cx, y: larga.cy }
  const prove = (torcia, sgoccioli = false) => {
    let scontri = 0, agguati = 0, dritti = 0
    for (let seme = 1; seme <= 60; seme++) {
      const rnd = seminato(seme)
      const c = scena({ qui: centro, torcia, verso: [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0.6, dy: -0.8 }][seme % 4] })
      if (sgoccioli) c.torciaResta = 1
      // dove sta il mostro: dietro, di sbieco o di lato, a tre celle e più, dentro la stanza
      const ang = Math.PI * (0.5 + rnd()), dist = 3 + rnd() * 2
      const v = c.versoEroe
      const ax = v.dx * Math.cos(ang) - v.dy * Math.sin(ang), ay = v.dx * Math.sin(ang) + v.dy * Math.cos(ang)
      const mx = Math.max(larga.x, Math.min(larga.x + larga.w - 1, Math.round(centro.x + ax * dist)))
      const my = Math.max(larga.y, Math.min(larga.y + larga.h - 1, Math.round(centro.y + ay * dist)))
      if (mx === centro.x && my === centro.y) continue
      const m = c.livello.mostro('goblin', mx, my)
      Object.assign(m, { ossa: 40, ossaMax: 40, att: 5, dif: 0, velocita: c.velocita, sveglio: true, stati: null })
      c.livello.robe.push(m)
      let giro = false
      for (let i = 0; i < 400 && !c.foglio; i++) {
        const e = c.eroe, prima = Math.hypot(m.fx != null ? m.fx - e.x : mx + 0.5 - e.x, m.fy != null ? m.fy - e.y : my + 0.5 - e.y)
        c.muoviMostri(1 / 30)
        if (Math.hypot(m.fx - e.x, m.fy - e.y) > prima + 1e-6) giro = true   // si allontana: sta girando largo
      }
      if (!c.foglio) continue
      scontri++
      if (c.foglio.agguato) agguati++
      if (!giro) dritti++
    }
    return { scontri, agguati, dritti }
  }
  const conTorcia = prove(8), agliSgoccioli = prove(1, true), alBuio = prove(0)
  controlla('con la torcia, sessanta mostri da dietro e di lato: tutti arrivano', conTorcia.scontri >= 55, JSON.stringify(conTorcia))
  uguale('con la torcia accesa, nessun agguato', conTorcia.agguati, 0)
  uguale('e nessuno gira largo per le spalle: vanno dritti', conTorcia.dritti, conTorcia.scontri)
  uguale('agli sgoccioli è ancora accesa: nessun agguato', agliSgoccioli.agguati, 0)
  controlla('al buio, dagli stessi posti, gli agguati ci sono come prima', alBuio.agguati > alBuio.scontri / 3, JSON.stringify(alBuio))
  // la sorpresa: è l'eroe a toccare un mostro che dorme, con la torcia o senza
  for (const torcia of [8, 0]) {
    const c = scena({ qui: centro, torcia })
    const m = c.livello.mostro('goblin', centro.x + 1, centro.y)
    Object.assign(m, { ossa: 40, ossaMax: 40, att: 5, dif: 0, velocita: c.velocita, sveglio: false, stati: null, fx: m.x + 0.5, fy: m.y + 0.5 })
    c.livello.robe.push(m)
    c.scontro(m, { tocco: true })
    uguale(`la sorpresa dell'eroe resta (${torcia ? 'con' : 'senza'} torcia)`, c.foglio.sorpresa, true)
  }
}

/* ── i mostri restano più lenti, e il verso resta l'ultimo passo ── */
controlla('i mostri restano più lenti dell\'eroe', PASSO_MOSTRO < PASSO_EROE)
controlla('lunghezze in ordine: senza torcia, agli sgoccioli, con la torcia', RAGGIO < RAGGIO_SGOCCIOLI && RAGGIO_SGOCCIOLI < RAGGIO_TORCIA)

/* ── la torcia appesa (docs/sotterraneo/luce.md, «Le torce appese»): ogni tanto una torcia a muro si prende. Accesa fa luce attorno a sé
   per chi è nella sua stanza, così la si trova; non si consuma finché è appesa; passandoci sotto (o toccandola) diventa la propria,
   piena; non torna, nemmeno riprendendo la sosta; e sta dove il disegno mette le torce a muro ── */
{
  const { torceAMuroDi, PIANI_CON_LA_TORCIA, NON_NELLE_STANZE } = await import('../../src/giochi/sotterraneo/motore/torce-a-muro.js')
  const { piantaDi } = await import('../../src/giochi/sotterraneo/scena3d/pianta.js')
  const { scrivi, leggi } = await import('../../src/giochi/sotterraneo/motore/sosta.js')
  let con = 0, una = true, fuori = true, pari = true, c = null
  for (let s = 1; s <= 60; s++) {
    const k = new Corsa(CAMPAGNA[1], { seme: s, rnd: seminato(s), roba })
    const prese = (k.livello.torce || []).filter(t => t.prendi)
    if (prese.length) con++
    if (prese.length > 1) una = false
    for (const t of prese) if (NON_NELLE_STANZE.includes(k.livello.stanze.find(r => r.id === t.stanza).ruolo)) fuori = false
    if (JSON.stringify(torceAMuroDi(k.livello).map(t => [t.x, t.y])) !== JSON.stringify(piantaDi(k.livello).torce.map(t => [t.x, t.y]))) pari = false
    if (!c && prese.length) c = k
  }
  controlla('una torcia da prendere in molti piani, non in tutti', con > 60 * (PIANI_CON_LA_TORCIA - 0.2) && con < 60, `${con}/60`)
  controlla('al più una per piano', una)
  controlla('mai nella stanza d\'ingresso né in quella della scala', fuori)
  controlla('il disegno mette le torce a muro dove le sa il motore', pari)
  const t = c.torciaAppesa, L = c.livello.largo
  for (const r of c.livello.robe) if (r.che === 'mostro') r.morto = true
  const st = c.livello.stanze.find(r => r.id === t.stanza)
  const dentro = st.suolo.find(q => Math.abs(q.x - t.x) + Math.abs(q.y - t.y - 1) >= 3) || st.suolo[0]
  c.eroe = { x: dentro.x + 0.5, y: dentro.y + 0.5 }; c.segnaLaStanza(); c.aggiornaLuce()
  controlla('nella sua stanza la torcia appesa fa luce: il suo muro e la cella sotto', c.luce.has(t.y * L + t.x) && c.luce.has((t.y + 1) * L + t.x))
  uguale('e l\'eroe resta al buio: appesa non è sua', c.torciaAccesa, false)
  // da un'altra stanza non si vede (la stanza è il confine)
  const altra = c.livello.stanze.find(r => r.id !== t.stanza && Math.abs(r.cx - t.x) + Math.abs(r.cy - t.y) > 12)
  c.eroe = { x: altra.cx + 0.5, y: altra.cy + 0.5 }; c.segnaLaStanza(); c.aggiornaLuce()
  uguale('da un\'altra stanza la sua luce non c\'è', c.luce.has((t.y + 1) * L + t.x), false)
  // un tocco sul muro della torcia porta l'eroe sotto, e passandoci la stacca
  c.eroe = { x: dentro.x + 0.5, y: dentro.y + 0.5 }; c.segnaLaStanza(); c.aggiornaLuce()
  c.vaiVerso({ x: t.x, y: t.y }, false)
  for (let i = 0; i < 400 && c.strada; i++) c.passo(0.05)
  uguale('toccata, l\'eroe ci va sotto e la stacca', c.torciaAppesa, null)
  uguale('è la sua: accesa e piena', c.torciaResta, c.stanzeTorcia)
  const giu = leggi(scrivi(c, 1), CAMPAGNA[1], c.roba)
  uguale('riprendendo la sosta non torna sul muro', giu.torciaAppesa, null)
  const sul = new Corsa(CAMPAGNA[1], { seme: c.seme, rnd: seminato(c.seme), roba })
  uguale('e in una discesa nuova dallo stesso seme è al suo posto', !!sul.torciaAppesa, true)
}

riassunto('la luce a cono')
