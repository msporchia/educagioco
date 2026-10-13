/* I piani del sotterraneo: come nasce una stanza adesso (docs/sotterraneo/piani.md). Sale grandi con le colonne,
   stanze di forme diverse (L, T, croce, due rettangoli, caverna), una stanza che è la sua mappa di celle e non il
   riquadro, mostri a branchi vicini fra loro e qualcuno appostato in un angolo o dietro una colonna, l'anticamera con i
   caporali davanti al mostro grosso. Tutto dal seme: lo stesso seme, lo stesso piano.
   `node test/esegui.mjs sotterraneo-piani --niente-build`
   tempo: 30 */
import { CAMPAGNA, L_ABISSO, guardianoDi, formaDi, brancoDi, caporaleDi, tettoDelBrancoDi } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { grossoDi } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { CAPORALE } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Livello, generaPiano, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { costruisci, connessa, pezziDa, FORME } from '../../src/giochi/sotterraneo/motore/forme.js'
import { raggiungibili } from '../../src/motore/passi.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const RAGGIO_SCONTRO = 4.5

// i piani di tutte le discese (l'ultimo col grosso), con più semi
const PIANI = []
for (const t of CAMPAGNA) for (let seme = 1; seme <= 14; seme++) for (let p = 0; p < t.piani; p++) {
  const f = formaDi(t, p)
  PIANI.push({ t, p, seme, l: generaPiano({ seme: seme * 97, piano: p, largo: f.largo, alto: f.alto, giri: f.giri,
    guardiano: guardianoDi(t, p), grosso: grossoDi(t, p), branco: brancoDi(t, p), caporale: caporaleDi(t, p), tettoBranco: tettoDelBrancoDi(t, p) }) })
}
const tutti = PIANI.map(x => x.l)
const stanze = tutti.flatMap(l => l.stanze.map(s => ({ l, s })))
const mostriDi = l => l.robe.filter(r => r.che === 'mostro')
const vicini4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]

/* ══════════ 1. le forme ══════════ */
{
  const rnd = seminato(3)
  for (const f of FORME) {
    let n = 0
    for (let i = 0; i < 40; i++) {
      const r = costruisci(f, 18, 14, rnd)
      if (!r) continue
      n++
      if (!connessa(r.m, r.w, r.h)) { controlla(`${f}: in un pezzo solo`, false); break }
    }
    controlla(`la forma «${f}» si costruisce`, n > 30, `${n}/40`)
  }
  // i pezzi rifanno la maschera, senza sovrapposizioni
  const r = costruisci('elle', 12, 10, seminato(8))
  const celle = new Set()
  let doppie = 0
  for (const p of pezziDa(r.m, r.w, r.h, 0, 0)) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
    if (celle.has(x + ',' + y)) doppie++
    celle.add(x + ',' + y)
  }
  uguale('i pezzi di una L coprono le sue celle, una volta sola', JSON.stringify([celle.size, doppie]), JSON.stringify([r.m.reduce((a, b) => a + b, 0), 0]))

  const per = {}
  for (const { s } of stanze) per[s.forma] = (per[s.forma] || 0) + 1
  for (const f of ['elle', 'tu', 'croce', 'doppia', 'caverna', 'sala'])
    controlla(`nei piani ci sono stanze «${f}»`, per[f] > 20, `${per[f] || 0}`)
  nota(`stanze per forma in ${tutti.length} piani: ${Object.entries(per).map(([k, v]) => `${k} ${v}`).join(' · ')}`)
  const storti = PIANI.filter(x => x.l.storto)
  controlla('nessun piano storto', storti.length === 0, storti.slice(0, 3).map(x => `${x.t.chiave} seme ${x.seme} piano ${x.p}: ${x.l.storto}`).join(' · '))
}

/* ══════════ 2. una stanza è la sua mappa di celle ══════════ */
{
  let storte = []
  for (const { l, s } of stanze) {
    const L = l.largo
    // ogni cella del suolo è pavimento, sta nel riquadro e dice di essere dentro; il centro è una di loro
    if (!s.suolo.length) storte.push('stanza vuota')
    if (s.suolo.some(c => l.a(c.x, c.y) !== 1 || !l.dentro(s, c.x, c.y) || c.x < s.x || c.y < s.y || c.x >= s.x + s.w || c.y >= s.y + s.h))
      storte.push(`${s.forma}: una cella del suolo non è pavimento o è fuori dal riquadro`)
    if (!l.dentro(s, s.cx, s.cy)) storte.push(`${s.forma}: il centro non è dentro la stanza`)
    // i pezzi e il suolo più le colonne sono la stessa cosa
    const dai = new Set(s.pezzi.flatMap(p => { const o = []; for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) o.push(y * L + x); return o }))
    const mio = new Set([...s.suolo.map(c => c.y * L + c.x), ...s.colonne.map(c => c.y * L + c.x)])
    if (dai.size !== mio.size || [...dai].some(k => !mio.has(k))) storte.push(`${s.forma}: i pezzi non sono il suolo`)
    // dentro è esatto: lo dice di ogni cella del suolo e di nessun'altra (una colonna non è dentro)
    const suolo = new Set(s.suolo.map(c => c.y * L + c.x))
    for (let y = s.y - 1; y <= s.y + s.h; y++) for (let x = s.x - 1; x <= s.x + s.w; x++)
      if (l.dentro(s, x, y) !== suolo.has(y * L + x)) storte.push(`${s.forma}: «dentro» sbaglia in ${x},${y}`)
    // le porte stanno fuori dalla stanza, accanto a lei, e la stanza di una porta è la sua
    for (const p of s.porte) {
      if (l.dentro(s, p.x, p.y) || l.stanzaDi(p.x, p.y) !== s ||
          !vicini4.some(([dx, dy]) => l.dentro(s, p.x + dx, p.y + dy))) storte.push(`${s.forma}: una porta non sta sul bordo`)
    }
    if (storte.length > 5) break
  }
  controlla('ogni stanza è la sua mappa di celle (suolo, pezzi, centro, porte)', storte.length === 0, storte.slice(0, 3).join(' · '))

  const elle = stanze.filter(x => x.s.forma === 'elle').slice(0, 30)
  controlla('una L non riempie il suo riquadro', elle.every(({ s }) => s.suolo.length < s.w * s.h))
  controlla('e una L ha un angolo del riquadro che è roccia', elle.every(({ l, s }) =>
    [[s.x, s.y], [s.x + s.w - 1, s.y], [s.x, s.y + s.h - 1], [s.x + s.w - 1, s.y + s.h - 1]].some(([x, y]) => !l.dentro(s, x, y))))
  controlla('fuori dalle stanze («in un corridoio») stanzaDi non risponde',
            tutti.every(l => { for (let y = 0; y < l.alto; y++) for (let x = 0; x < l.largo; x++)
              if (l.stanzaDi(x, y) && !l.stanze.some(s => Math.abs(s.x + s.w / 2 - x) < s.w / 2 + 2 && Math.abs(s.y + s.h / 2 - y) < s.h / 2 + 2)) return false
              return true }))
  controlla('stanzaDi di una cella della stanza è la stanza', stanze.every(({ l, s }) => s.suolo.every(c => l.stanzaDi(c.x, c.y) === s)))
}

/* ══════════ 3. sale grandi con le colonne ══════════ */
{
  const sale = stanze.filter(x => x.s.forma === 'sala')
  const conSala = PIANI.filter(x => x.l.stanze.some(s => s.forma === 'sala')).length
  controlla('quasi ogni piano ha una sala grande', conSala >= PIANI.length * 0.9, `${conSala}/${PIANI.length}`)
  controlla('una sala è grande (da 70 celle) e larga almeno quanto la stanza più grande di una volta (10×8)',
            sale.every(({ s }) => s.suolo.length + s.colonne.length >= 70 && s.w * s.h >= 80), `minima ${Math.min(...sale.map(x => x.s.w * x.s.h))}`)
  controlla('almeno la metà delle sale misura 12×9 o più', sale.filter(({ s }) => s.w >= 12 && s.h >= 9).length >= sale.length * 0.5)
  const conColonne = sale.filter(x => x.s.colonne.length >= 2).length
  controlla('le sale hanno le colonne', conColonne >= sale.length * 0.9, `${conColonne}/${sale.length}`)
  // una colonna è roccia isolata, sola o a coppia, e non tocca il muro: tutt'attorno c'è stanza
  const male = []
  for (const { l, s } of stanze) for (const c of s.colonne) {
    if (l.a(c.x, c.y) !== 0) male.push('una colonna non è roccia')
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = c.x + dx, y = c.y + dy
      if (!l.dentro(s, x, y) && !s.colonne.some(o => o.x === x && o.y === y)) male.push(`una colonna tocca il muro in ${c.x},${c.y}`)
    }
    const gruppo = s.colonne.filter(o => Math.abs(o.x - c.x) <= 1 && Math.abs(o.y - c.y) <= 1)
    if (gruppo.length > 2) male.push('più di due colonne attaccate')
    if (l.robeSu(c.x, c.y).length) male.push('roba sopra una colonna')
  }
  controlla('le colonne sono celle di roccia sole o a coppie, mai attaccate al muro, mai con roba sopra', male.length === 0, male.slice(0, 3).join(' · '))
  // e non chiudono mai una strada: ogni cosa del piano si raggiunge
  const chiusi = tutti.filter(l => {
    const v = raggiungibili((x, y) => l.calpestabile(x, y), { x: l.stanze[0].cx, y: l.stanze[0].cy })
    return l.robe.some(r => !v.has(r.x + ',' + r.y))
  })
  controlla('con le colonne ogni cosa del piano si raggiunge', chiusi.length === 0, `${chiusi.length} piani`)
  nota(`sale grandi: ${sale.length} in ${PIANI.length} piani, ${(sale.reduce((n, x) => n + x.s.colonne.length, 0) / sale.length).toFixed(1)} celle di colonna per sala`)
}

/* ══════════ 4. i mostri vanno a branchi ══════════ */
{
  const male = [], grandezze = {}
  let appostati = { angolo: 0, colonna: 0 }, soli = 0, inGrandi = 0, inPiccole = 0
  for (const l of tutti) {
    const gruppi = new Map()
    for (const m of mostriDi(l)) if (m.branco) (gruppi.get(m.branco) || gruppi.set(m.branco, []).get(m.branco)).push(m)
    for (const [, g] of gruppi) {
      grandezze[g.length] = (grandezze[g.length] || 0) + 1
      if (g.length > 5) male.push(`un branco di ${g.length}`)
      const stanza = l.stanzaDi(g[0].x, g[0].y)
      for (const a of g) for (const b of g) {
        if (Math.hypot(a.x - b.x, a.y - b.y) > RAGGIO_SCONTRO) male.push('un branco più largo di 4,5 celle')
        if (l.stanzaDi(a.x, a.y) !== stanza || !l.dentro(stanza, a.x, a.y)) male.push('un branco fra due stanze')
      }
      if (g.length >= 2) { if (stanza.grande) inGrandi += g.length; else inPiccole += g.length }
      if (g.length > 2 && !stanza.grande && !stanza.ruolo) male.push('un branco da tre in una stanza piccola')
    }
    for (const m of mostriDi(l)) {
      const s = l.stanzaDi(m.x, m.y)
      if (!m.grosso && !l.dentro(s, m.x, m.y) && m.che === 'mostro') male.push('un mostro fuori dalla stanza')
      if (l.a(m.x, m.y) !== 1) male.push('un mostro non sta sul pavimento')
      if (!m.appostato) continue
      soli++
      appostati[m.appostato]++
      const roccia = (x, y) => l.a(x, y) === 0
      if (m.appostato === 'angolo' && !((roccia(m.x - 1, m.y) || roccia(m.x + 1, m.y)) && (roccia(m.x, m.y - 1) || roccia(m.x, m.y + 1))))
        male.push('un appostato «in un angolo» non è in un angolo')
      if (m.appostato === 'colonna' && !vicini4.some(([dx, dy]) => s.colonne.some(c => c.x === m.x + dx && c.y === m.y + dy)))
        male.push('un appostato «dietro una colonna» non ha una colonna accanto')
      if (mostriDi(l).some(o => o !== m && !o.chiave && l.stanzaDi(o.x, o.y) === s && Math.hypot(o.x - m.x, o.y - m.y) < 4)) male.push('un appostato che non è solo')
    }
  }
  controlla('i branchi stanno in una stanza, entro 4,5 celle, da due a cinque', male.length === 0, [...new Set(male)].slice(0, 3).join(' · '))
  controlla('ci sono branchi da tre o più', Object.entries(grandezze).some(([n, c]) => n >= 3 && c > 20), JSON.stringify(grandezze))
  controlla('i branchi stanno soprattutto nelle sale grandi', inGrandi > inPiccole * 1.5, `${inGrandi} contro ${inPiccole}`)
  controlla('ci sono appostati, in un angolo e dietro una colonna', appostati.angolo > 20 && appostati.colonna > 10, JSON.stringify(appostati))
  nota(`branchi per grandezza: ${JSON.stringify(grandezze)}; appostati ${soli}: ${appostati.angolo} in un angolo, ${appostati.colonna} dietro una colonna`)

  // il numero di mostri non cresce: tre quarti per stanza, o meno
  const media = tutti.reduce((n, l) => n + mostriDi(l).length, 0) / tutti.reduce((n, l) => n + l.stanze.length, 0)
  controlla('i mostri per stanza sono quelli di prima (meno di uno)', media < 0.95, media.toFixed(2))
  nota(`mostri per stanza: ${media.toFixed(2)}`)
}

/* ══════════ 5. l'anticamera coi caporali ══════════ */
{
  const conGrosso = PIANI.filter(x => x.l.grosso)
  controlla('i piani col mostro grosso sono quelli in fondo a ogni discesa', conGrosso.length === CAMPAGNA.length * 14)
  const male = []
  const lunghezze = {}
  for (const { l } of conGrosso) {
    const anti = l.stanze.find(s => s.ruolo === 'anticamera')
    const uscita = l.stanze.find(s => s.ruolo === 'uscita')
    if (!anti) { male.push('niente anticamera'); continue }
    if (anti === l.stanze[0] || anti === uscita) male.push('l\'anticamera è l\'ingresso o la stanza della scala')
    const cap = mostriDi(l).filter(m => m.caporale)
    lunghezze[cap.length] = (lunghezze[cap.length] || 0) + 1
    if (cap.length < 2 || cap.length > 3) male.push(`${cap.length} caporali`)
    for (const m of cap) {
      if (l.stanzaDi(m.x, m.y) !== anti) male.push('un caporale fuori dall\'anticamera')
      const base = l.mostro(m.tipo, m.x, m.y, { variante: m.variante || null, grado: m.grado || 'comune' })   // la stessa variante: l'arciere picchia un po' meno
      if (m.ossa !== Math.round(base.ossa * CAPORALE.ossa) || m.att !== base.att + CAPORALE.att) male.push('un caporale non è più duro')
      if (!/caporale$/.test(m.nome)) male.push('un caporale senza il nome')
      for (const o of cap) if (Math.hypot(o.x - m.x, o.y - m.y) > RAGGIO_SCONTRO) male.push('i caporali non stanno insieme')
    }
    // i caporali stanno soli in mezzo alla stanza: nessun altro mostro li affianca
    if (mostriDi(l).filter(m => m.caporale).length && mostriDi(l).some(m => !m.caporale && !m.grosso && l.stanzaDi(m.x, m.y) === anti))
      male.push('mostri qualunque in mezzo ai caporali')
  }
  controlla('ogni piano col grosso ha la sua anticamera con due o tre caporali, più duri, con un nome, vicini fra loro', male.length === 0, [...new Set(male)].slice(0, 3).join(' · '))
  nota(`caporali per anticamera: ${JSON.stringify(lunghezze)}`)
  // senza il grosso: niente anticamera e nessun caporale, tranne chi porta la chiave, che è il caporale del posto
  // del posto (docs/sotterraneo/mostri.md)
  controlla('i piani senza il grosso non hanno anticamera, e di caporale hanno solo il guardiano della chiave', PIANI.filter(x => !x.l.grosso).every(x =>
    !x.l.stanze.some(s => s.ruolo === 'anticamera') && !mostriDi(x.l).some(m => m.caporale && !m.chiave)))
  // quasi sempre sta accanto alla scala; se lì non c'è posto la chiave la porta il mostro più lontano dall'ingresso (un mostro di strada
  // della stessa coppia)
  const senzaGrosso = PIANI.filter(x => !x.l.grosso)
  const guardiani = senzaGrosso.map(x => mostriDi(x.l).find(m => m.chiave))
  controlla('il guardiano della chiave è del posto', guardiani.every((g, i) => g && senzaGrosso[i].l.branco.includes(g.tipo) || g.tipo === senzaGrosso[i].l.caporale))
  const caporali = guardiani.filter((g, i) => g.caporale && g.tipo === senzaGrosso[i].l.caporale)
  controlla('ed è quasi sempre il caporale del posto, fatto caporale', caporali.length >= guardiani.length * 0.9, `${caporali.length} su ${guardiani.length}`)

  // la strada va dall'ingresso alla scala passando dall'anticamera quando c'è una strada sola (l'ultima stanza prima della scala)
  let sulla = 0
  for (const { l } of conGrosso) {
    const anti = l.stanze.find(s => s.ruolo === 'anticamera'), scala = l.robe.find(r => r.che === 'scala')
    const uscita = l.stanze.find(s => s.ruolo === 'uscita')
    // tolta l'anticamera (le sue celle) la scala si raggiunge ancora? se no, ci si passa per forza
    const v = raggiungibili((x, y) => l.calpestabile(x, y) && !l.dentro(anti, x, y), { x: l.stanze[0].cx, y: l.stanze[0].cy })
    if (!v.has(scala.x + ',' + scala.y)) sulla++
    else if (anti.vicine.includes(uscita.id)) sulla += 0.5
  }
  controlla('l\'anticamera sta quasi sempre sulla strada dall\'ingresso alla scala', sulla >= conGrosso.length * 0.5, `${sulla}/${conGrosso.length}`)

  // l'abisso ha il suo grosso ma non l'anticamera: davanti a un eroe nudo sarebbe un muro (docs/sotterraneo/piani.md)
  const c = new Corsa(L_ABISSO, { seme: 41 })
  for (let p = 0; p < 6; p++) { c.piano = p; c.nuovoPiano() }
  uguale('l\'abisso non ha anticamere', c.livello.stanze.some(s => s.ruolo === 'anticamera'), false)
}

/* ══════════ 6. dal seme, sempre uguale ══════════ */
{
  const fa = () => new Livello({ seme: 777, piano: 1, largo: 50, alto: 50, giri: 4, grosso: 'ossuto' })
  const a = fa(), b = fa()
  uguale('lo stesso seme fa le stesse celle', a.celle.join(), b.celle.join())
  uguale('...le stesse stanze, forme e colonne', JSON.stringify(a.stanze.map(s => [s.x, s.y, s.w, s.h, s.forma, s.pezzi, s.colonne, s.ruolo])),
         JSON.stringify(b.stanze.map(s => [s.x, s.y, s.w, s.h, s.forma, s.pezzi, s.colonne, s.ruolo])))
  uguale('...e la stessa roba, branchi e caporali compresi', JSON.stringify(a.robe), JSON.stringify(b.robe))
}

/* ══════════ 7. nella corsa ══════════ */
{
  // un mostro non esce mai dalla sua stanza, né entra in una colonna, anche in una stanza che non è un rettangolo
  let provati = 0, fuori = 0
  for (const seme of [3, 8, 15, 22, 40]) {
    const c = new Corsa(CAMPAGNA[1], { seme })
    const l = c.livello
    for (const s of l.stanze.filter(r => r.forma !== 'rettangolo' && r.ruolo !== 'ingresso')) {
      const m = mostriDi(l).find(o => l.stanzaDi(o.x, o.y) === s)
      if (!m) continue
      provati++
      // l'eroe sta in un'altra cella della stessa stanza, da lontano: il mostro si sveglia e va verso di lui
      const dove = s.suolo.reduce((b, r) => (Math.hypot(r.x - m.x, r.y - m.y) > Math.hypot(b.x - m.x, b.y - m.y) ? r : b), s.suolo[0])
      c.eroe = { x: dove.x + 0.5, y: dove.y + 0.5 }
      for (let i = 0; i < 400 && !c.foglio; i++) {
        c.muoviMostri(0.05)
        for (const o of mostriDi(l)) {
          if (o.fx == null || o.morto) continue
          const so = l.stanzaDi(o.casa.x, o.casa.y)
          if (!l.dentro(so, Math.floor(o.fx), Math.floor(o.fy))) fuori++
        }
      }
      c.foglio = null
      for (const o of mostriDi(l)) { o.fx = null; o.sveglio = false }
    }
  }
  controlla('provate stanze L, T, croce, caverna con un mostro che insegue', provati >= 5, `${provati}`)
  uguale('un mostro non esce mai dalla sua stanza', fuori, 0)

  // con la torcia la stanza si accende com'è fatta: tutte le sue celle e il muro attorno, non il riquadro
  const l = tutti.find(x => x.stanze.some(s => s.forma === 'elle'))
  const s = l.stanze.find(r => r.forma === 'elle')
  const luce = new Set(l.celleDellaLuce(s).map(([x, y]) => x + ',' + y))
  controlla('la luce di una stanza copre tutto il suo suolo', s.suolo.every(c => luce.has(c.x + ',' + c.y)))
  controlla('...e non le celle lontane del riquadro', luce.size < (s.w + 2) * (s.h + 2))
}

riassunto('i piani del sotterraneo')
