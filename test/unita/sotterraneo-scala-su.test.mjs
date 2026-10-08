/* La scala che sale, e il bersaglio di una missione lontano dall'arrivo.
   (docs/sotterraneo/scala-che-sale.md, docs/sotterraneo/missioni.md «Dove sta»)

   Si risale da dove si è comparsi: in ogni piano, sul punto esatto dove l'eroe arriva dall'alto c'è una scala che
   sale, e prenderla riporta al piano di sopra accanto alla scala che scende — com'era, coi mostri battuti, le
   cose prese e le porte aperte. Al primo piano la scala porta fuori, ma solo col foglio di «lascio perdere»: mai
   un modo gratis di saltare il portale. E la cosa che una missione cerca sta nella stanza più lontana da dove si
   arriva, mai accanto all'ingresso.
   `node test/esegui.mjs sotterraneo-scala-su --niente-build` */
import { CAMPAGNA, L_ABISSO } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MISSIONI } from '../../src/giochi/sotterraneo/dati/missioni.js'
import { VITA_PER_PIANO } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { presePer, PRESA, rotta } from '../../src/giochi/sotterraneo/motore/missioni.js'
import { scrivi, leggi, VERSIONE, PIANI_ALLE_SPALLE } from '../../src/giochi/sotterraneo/motore/sosta.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const cella = c => ({ x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) })
const su = c => c.livello.robe.find(r => r.che === 'scala-su')
const giu = c => c.livello.robe.find(r => r.che === 'scala')
// si scende davvero: la chiave in tasca, la scala toccata, il foglio che chiede, e si scende
function scendi(c) {
  c.chiaveDelPiano = true
  c.interagisci(giu(c))
  return c.scendi()
}
function sali(c) {
  c.interagisci(su(c))
  return c.sali()
}

/* ══════════ 1. in ogni piano, dove si compare, c'è la scala che sale ══════════ */
{
  let piani = 0
  for (const t of CAMPAGNA) {
    for (const seme of [3, 41]) {
      const c = new Corsa(t, { seme, rnd: seminato(seme) })
      for (let p = 0; p < t.piani; p++) {
        piani++
        const s = c.livello.robe.filter(r => r.che === 'scala-su')
        uguale(`${t.chiave} piano ${p + 1}: una scala che sale`, s.length, 1)
        const dove = cella(c)
        uguale(`${t.chiave} piano ${p + 1}: sta nel punto esatto dove si compare`, `${s[0].x},${s[0].y}`, `${dove.x},${dove.y}`)
        controlla(`${t.chiave} piano ${p + 1}: ci si cammina`, c.livello.calpestabile(s[0].x, s[0].y))
        controlla(`${t.chiave} piano ${p + 1}: non ci sta sotto un'altra cosa`,
                  c.livello.robe.filter(r => r.x === s[0].x && r.y === s[0].y).length === 1)
        if (p < t.piani - 1) scendi(c)
      }
    }
  }
  nota(`${piani} piani controllati nelle sette discese`)

  // nell'abisso il primo piano non ha da dove risalire (la strada su è il portale), gli altri sì
  const a = new Corsa(L_ABISSO, { seme: 5, rnd: seminato(5) })
  uguale('abisso, primo piano: niente scala che sale', a.livello.robe.filter(r => r.che === 'scala-su').length, 0)
  scendi(a)
  uguale('abisso, secondo piano: la scala che sale c\'è', a.livello.robe.filter(r => r.che === 'scala-su').length, 1)

  // generata dopo il seme, non cambia il caso: stesse stanze, stesse porte, stessi mostri di prima
  const x = new Corsa(CAMPAGNA[2], { seme: 8, rnd: seminato(8) })
  const senza = x.livello.robe.filter(r => r.che !== 'scala-su')
  uguale('la scala che sale è l\'unica cosa in più', senza.length + 1, x.livello.robe.length)
}

/* ══════════ 2. si risale, e il piano di sopra è com'era ══════════ */
{
  const c = new Corsa(CAMPAGNA[2], { seme: 8, rnd: seminato(8) })
  const robe = c.livello.robe
  // sul primo piano: un mostro battuto, una porta aperta, una cosa presa, due caselle viste in più
  const porta = robe.find(r => r.che === 'porta')
  const mostro = robe.find(r => r.che === 'mostro' && !r.chiave)
  const gemma = robe.find(r => r.che === 'gemme')
  controlla('il primo piano ha una porta, un mostro e delle gemme', !!(porta && mostro && gemma))
  porta.aperta = true; porta.presa = true
  mostro.morto = true
  gemma.presa = true
  const visti = c.visto.reduce((n, v) => n + v, 0)
  uguale('si scende, e la scala è chiusa finché non si ha la chiave', (c.interagisci(giu(c)), c.foglio.che), 'chiusa')
  c.chiudi()

  const vitaPrima = c.vita
  const e = scendi(c)
  uguale('sceso: piano 2', e.piano, 1)
  const dove = cella(c)
  uguale('si compare sulla scala che sale', `${su(c).x},${su(c).y}`, `${dove.x},${dove.y}`)
  uguale('il piano nuovo non ha la chiave', c.chiaveDelPiano, false)
  const vitaPiuGiu = c.vitaPiu, vitaGiu = c.vita, fatti = c.pianiFatti
  controlla('scendendo il piano ha dato la sua vita', vitaPiuGiu > 0 && c.vita >= vitaPrima)
  // sul secondo piano: un piccolo cambiamento, che deve restare
  const sua = c.livello.robe.find(r => r.che === 'gemme')
  if (sua) sua.presa = true

  c.interagisci(su(c))
  uguale('toccandola si apre il foglio della scala che sale', c.foglio.che, 'scala-su')
  uguale('che non è un\'uscita: c\'è un piano sopra', c.foglio.fuori, false)
  const s = c.sali()
  uguale('si sale', s && s.che, 'salito')
  uguale('al piano di sopra', c.piano, 0)
  uguale('il foglio si chiude', c.foglio, null)
  uguale('la discesa non è finita', c.finita, false)

  // si ricompare accanto alla scala che scende, non all'inizio del piano né sopra di lei
  const g = giu(c), q = cella(c)
  uguale('accanto alla scala che scende (non sopra)', Math.abs(q.x - g.x) + Math.abs(q.y - g.y), 1)
  controlla('su una cella dove si cammina', c.livello.calpestabile(q.x, q.y))
  controlla('lontano dall\'ingresso del piano', Math.hypot(q.x - c.livello.stanze[0].cx, q.y - c.livello.stanze[0].cy) > 3)
  controlla('e la scala chiusa non si è richiusa: la chiave è ancora la tua', c.chiaveDelPiano)

  // il piano è com'era
  const stesse = c.livello.robe
  controlla('il mostro battuto è ancora battuto', stesse.find(r => r === mostro).morto)
  controlla('la porta è ancora aperta', stesse.find(r => r === porta).aperta)
  controlla('la gemma presa non è tornata', stesse.find(r => r === gemma).presa)
  controlla('la mappa già girata c\'è ancora', c.visto.reduce((n, v) => n + v, 0) >= visti)
  uguale('niente vita regalata risalendo', c.vitaPiu, vitaPiuGiu)
  uguale('né il riposo di una scala', c.vita, vitaGiu)

  // e giù di nuovo: niente vita del piano di nuovo, niente piano contato due volte, e il piano di sotto è com'era
  const ancora = scendi(c)
  uguale('si riscende al piano 2', ancora.piano, 1)
  uguale('niente vita del piano una seconda volta', c.vitaPiu, vitaPiuGiu)
  uguale('né il riposo della scala', c.vita, vitaGiu)
  uguale('e il piano non conta due volte', c.pianiFatti, fatti)
  const dopo = cella(c)
  uguale('si ricompare di nuovo sulla scala che sale', `${su(c).x},${su(c).y}`, `${dopo.x},${dopo.y}`)
  if (sua) controlla('la gemma presa di sotto è ancora presa', sua.presa)
  uguale('il piano di sotto non ha la chiave, come l\'avevi lasciato', c.chiaveDelPiano, false)
}

/* ══════════ 3. dal primo piano si esce, e solo col foglio di «lascio perdere» ══════════
   Mai un modo gratis di saltare il portale: sopra il primo piano c'è la terra, e si risale come sempre
   (docs/sotterraneo/portale-e-sosta.md). Il motore non sa uscire da sé: dice che è un'uscita e il gioco chiede. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 4, rnd: seminato(4) })
  c.interagisci(su(c))
  uguale('al primo piano il foglio dice che è un\'uscita', c.foglio.fuori, true)
  uguale('sali() non porta da nessuna parte', c.sali(), null)
  uguale('si è ancora al primo piano', c.piano, 0)
  controlla('e la discesa va avanti', !c.finita)
  c.chiudi()
  controlla('«resto» chiude il foglio senza lasciare niente', c.foglio === null && !c.finita)
  // e si esce davvero solo con risali(), cioè con la strada di «lascio perdere» (Gioco.vue)
  c.risali()
  controlla('risalire la finisce senza vincerla', c.finita && !c.vinta)
  uguale('niente scala che sale se la discesa è finita: `sali` non fa nulla', c.sali(), null)
}

/* ══════════ 4. la sosta ricorda su quale piano e dove si è, e i piani alle spalle ══════════ */
{
  const c = new Corsa(CAMPAGNA[2], { seme: 8, rnd: seminato(8) })
  const mostro = c.livello.robe.find(r => r.che === 'mostro' && !r.chiave)
  const porta = c.livello.robe.find(r => r.che === 'porta')
  mostro.morto = true; porta.aperta = true; porta.presa = true
  c.visto[7] = 1
  const i0 = c.livello.robe.indexOf(mostro), j0 = c.livello.robe.indexOf(porta)
  scendi(c)
  c.livello.robe.find(r => r.che === 'gemme').presa = true

  const dato = scrivi(c, 2)
  uguale('la sosta è della versione nuova', dato.v, VERSIONE)
  uguale('ricorda il piano', dato.piano, 1)
  uguale('e il più profondo toccato', dato.fondo, 1)
  uguale('e un piano alle spalle', dato.dietro.length, 1)
  uguale('che è il primo', dato.dietro[0].p, 0)
  controlla('con la scala aperta com\'era', dato.dietro[0].chiave === true)

  const b = leggi(dato, CAMPAGNA[2], c.roba)
  controlla('si rilegge', !!b)
  uguale('al piano di prima', b.piano, 1)
  uguale('nel punto esatto', `${b.eroe.x},${b.eroe.y}`, `${c.eroe.x},${c.eroe.y}`)
  uguale('col piano alle spalle ricordato', b.piani.size, 1)
  const alle = b.piani.get(0)
  controlla('il mostro battuto lassù è ancora battuto', alle.livello.robe[i0].morto)
  controlla('la porta aperta lassù è ancora aperta', alle.livello.robe[j0].aperta && alle.livello.robe[j0].presa)
  controlla('la mappa già girata lassù c\'è ancora', alle.visto[7] === 1)
  controlla('e la sua scala era aperta', alle.chiave === true)

  // si risale dopo la ripresa, come se non si fosse mai usciti
  const s = sali(b)
  uguale('dopo la ripresa si risale', s && s.che, 'salito')
  controlla('il mostro battuto è ancora battuto', b.livello.robe[i0].morto)
  const g = giu(b), q = cella(b)
  uguale('accanto alla scala che scende', Math.abs(q.x - g.x) + Math.abs(q.y - g.y), 1)

  // e una sosta scritta da lassù ricorda il piano di sotto, ora alle spalle
  const risal = scrivi(b, 2)
  uguale('scritta dal piano di sopra: piano 1', risal.piano, 0)
  uguale('il più profondo resta 2', risal.fondo, 1)
  uguale('e il piano di sotto è alle spalle', risal.dietro[0].p, 1)
  controlla('e rileggendola si scende di nuovo senza regalare vita',
            (() => { const z = leggi(risal, CAMPAGNA[2], c.roba); const v = z.vitaPiu; scendi(z); return z.vitaPiu === v })())

  // una sosta di prima (versione 4) non si legge: il piano ha una cosa in più
  uguale('una sosta della versione di prima non si legge', leggi({ ...dato, v: VERSIONE - 1 }, CAMPAGNA[2], c.roba), null)
  // senza `dietro`: «nessun piano alle spalle», e si sale comunque rifacendo il piano dal seme
  const nuda = { ...dato }; delete nuda.dietro
  const n = leggi(nuda, CAMPAGNA[2], c.roba)
  controlla('una sosta senza piani alle spalle si legge', !!n && n.piani.size === 0)
  uguale('e salendo il piano di sopra si rifà dal seme', (sali(n), n.piano), 0)
  controlla('con la scala già aperta (ci si è scesi)', n.chiaveDelPiano)
}

/* ══════════ 5. l'abisso: i piani alle spalle sono pochi, e la sosta non gonfia ══════════ */
{
  const c = new Corsa(L_ABISSO, { seme: 17, rnd: seminato(17) })
  for (let i = 0; i < 20; i++) {
    c.livello.robe.filter(r => r.che === 'mostro' && !r.chiave).forEach(r => { r.morto = true })
    scendi(c)
    for (let k = 0; k < 400; k += 7) c.visto[k] = 1
  }
  uguale('venti piani sotto', c.piano, 20)
  uguale('tutti ricordati mentre si gioca', c.piani.size, 20)
  const dato = scrivi(c, -1)
  uguale('la sosta ne salva solo i più vicini', dato.dietro.length, PIANI_ALLE_SPALLE)
  const piani = dato.dietro.map(d => d.p)
  controlla('quelli più vicini a dove si è', Math.min(...piani) === 20 - PIANI_ALLE_SPALLE, piani.join())
  const peso = JSON.stringify(dato).length
  controlla('e pesa meno di dieci chilobyte', peso < 10240, `${peso} byte`)
  nota(`la sosta dell'abisso al piano 21, con ${PIANI_ALLE_SPALLE} piani alle spalle, pesa ${peso} byte`)

  const b = leggi(dato, L_ABISSO, c.roba)
  controlla('si rilegge', !!b)
  uguale('i piani alle spalle ricordati sono gli stessi', b.piani.size, PIANI_ALLE_SPALLE)
  // si risale oltre quelli ricordati: il piano si rifà dal seme, e la scala è aperta (ci si è scesi)
  for (let i = 0; i < PIANI_ALLE_SPALLE + 2; i++) sali(b)
  uguale('si risale anche oltre quelli ricordati', b.piano, 20 - PIANI_ALLE_SPALLE - 2)
  controlla('e il piano rifatto ha la sua scala che sale', !!su(b) || b.piano === 0)
  controlla('con la scala che scende aperta', b.chiaveDelPiano)
}

/* ══════════ 6. il bersaglio di una missione sta lontano dall'arrivo ══════════ */
{
  // quanti passi dal punto d'arrivo a ogni cella, camminando davvero (le porte si aprono rispondendo)
  const passi = (L, da) => {
    const d = new Map([[`${da.x},${da.y}`, 0]]), coda = [da]
    for (let i = 0; i < coda.length; i++) {
      const q = coda[i]
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = q.x + dx, y = q.y + dy, k = `${x},${y}`
        if (d.has(k) || !L.calpestabile(x, y)) continue
        d.set(k, d.get(`${q.x},${q.y}`) + 1)
        coda.push({ x, y })
      }
    }
    return d
  }
  let provati = 0, soloPerGrado = 0
  for (const m of MISSIONI) {
    const t = CAMPAGNA.find(x => x.chiave === m.discesa)
    for (const seme of [2, 9, 31, 77, 120, 205]) {
      const c = new Corsa(t, { seme, rnd: seminato(seme), missioni: presePer({ [m.id]: PRESA }, t.chiave) })
      // si scende fino al piano della missione
      while (c.piano < m.piano) scendi(c)
      const r = c.livello.robe.find(x => x.missione === m.id)
      controlla(`${m.id} (seme ${seme}): la cosa c'è nel suo piano`, !!r)
      if (!r) continue
      provati++
      const L = c.livello, ingresso = L.stanze[0]
      const d = passi(L, { x: ingresso.cx, y: ingresso.cy })
      const sua = L.stanzaDi(r.x, r.y)
      const lontano = s => d.get(`${s.cx},${s.cy}`)
      controlla(`${m.id} (${seme}): non nella stanza d'arrivo`, sua && sua !== ingresso)
      // se il piano ha una stanza che non è accanto all'arrivo (uno di quattro stanze le può avere tutte accanto)
      const nonAccanto = L.stanze.filter(s => s !== ingresso && !ingresso.vicine.includes(s.id) && lontano(s) != null)
      if (nonAccanto.length) controlla(`${m.id} (${seme}): né in quella accanto`, sua && !ingresso.vicine.includes(sua.id), `stanza ${sua && sua.id}`)
      // fra le stanze che si potrebbero scegliere (non d'arrivo, non accanto, non della scala né del portale) è la più lontana
      const buone = L.stanze.filter(s => s !== ingresso && !ingresso.vicine.includes(s.id) &&
                                         !['uscita', 'portale'].includes(s.ruolo) && lontano(s) != null)
      if (buone.length) {
        soloPerGrado++
        controlla(`${m.id} (${seme}): nella stanza più lontana in passi`,
                  sua && !['uscita', 'portale'].includes(sua.ruolo) && lontano(sua) === Math.max(...buone.map(lontano)),
                  `${sua && lontano(sua)} su ${Math.max(...buone.map(lontano))}`)
      }
      // sempre lo stesso posto: rifacendo la discesa col seme, la cosa è dov'era
      const c2 = new Corsa(t, { seme, rnd: seminato(seme), missioni: presePer({ [m.id]: PRESA }, t.chiave) })
      while (c2.piano < m.piano) scendi(c2)
      const r2 = c2.livello.robe.find(x => x.missione === m.id)
      uguale(`${m.id} (${seme}): rifatta, sta nello stesso posto`, `${r2.x},${r2.y}`, `${r.x},${r.y}`)
      // la freccina continua a indicarla
      const f = rotta(c)
      controlla(`${m.id} (${seme}): la freccina la indica`, f && f.verso === 'qui' && f.id === m.id &&
                Math.abs(f.x - (r.x + 0.5)) < 0.01 && Math.abs(f.y - (r.y + 0.5)) < 0.01, JSON.stringify(f))
    }
  }
  nota(`${provati} bersagli piazzati, ${soloPerGrado} con una stanza lontana e libera da scegliere`)
}

riassunto('la scala che sale e il bersaglio lontano')
