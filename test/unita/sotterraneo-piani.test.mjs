/* I piani del sotterraneo: come nasce una stanza adesso (docs/sotterraneo/piani.md e piani-caverne.md). Due famiglie di piani,
   scelte dalla discesa: le costruite (sale con un colonnato, nicchie nei muri, stanze simmetriche e smussate, qualche corridoio
   largo due) e le grotte (masse organiche da un automa cellulare, passaggi storti, pozze d'acqua); in tutte e due i relitti da
   aggirare. Una stanza che è la sua mappa di celle e non il riquadro, mostri a branchi vicini fra loro e qualcuno appostato in un
   angolo o dietro una colonna o un relitto, l'anticamera con i caporali davanti al mostro grosso. Tutto dal seme: lo stesso seme,
   lo stesso piano.
   `node test/esegui.mjs sotterraneo-piani --niente-build`
   tempo: 30 */
import { CAMPAGNA, L_ABISSO, TRATTI_DELL_ABISSO, guardianoDi, formaDi, brancoDi, tettoDelBrancoDi, piantaDi, conAcquaDi, scenarioDi }
  from '../../src/giochi/sotterraneo/dati/campagna.js'
import { ROCCIA, PAVIMENTO, PORTA, RELITTO, ACQUA } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { CLASSI, ASPETTI, DISEGNI, guastiDeiRelitti } from '../../src/giochi/sotterraneo/dati/relitti.js'
import { DISEGNATI } from '../../src/giochi/sotterraneo/scena/relitti.js'
import { PEZZI } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { grossoDi } from '../../src/giochi/sotterraneo/dati/grossi.js'
import { CAPORALE, duraDellaCoppia } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { Livello, generaPiano, seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { costruisci, connessa, pezziDa, FORME, FORME_COSTRUITE, FORME_DI_GROTTA } from '../../src/giochi/sotterraneo/motore/forme.js'
import { raggiungibili, percorso } from '../../src/motore/passi.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const RAGGIO_SCONTRO = 4.5

// i piani di tutte le discese (l'ultimo col grosso), con più semi
const PIANI = []
for (const t of CAMPAGNA) for (let seme = 1; seme <= 14; seme++) for (let p = 0; p < t.piani; p++) {
  const f = formaDi(t, p)
  PIANI.push({ t, p, seme, l: generaPiano({ seme: seme * 97, piano: p, largo: f.largo, alto: f.alto, giri: f.giri,
    guardiano: guardianoDi(t, p), grosso: grossoDi(t, p), branco: brancoDi(t, p), tettoBranco: tettoDelBrancoDi(t, p),
    scenario: scenarioDi(t, p), pianta: piantaDi(t, p), acqua: conAcquaDi(t, p) }) })
}
const tutti = PIANI.map(x => x.l)
const stanze = tutti.flatMap(l => l.stanze.map(s => ({ l, s })))
const mostriDi = l => l.robe.filter(r => r.che === 'mostro')
const vicini4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]
// le celle che la stanza ha alla nascita: il suolo, le colonne e quello che ci si è messo sopra (relitti, acqua) meno le nicchie
const nateDi = s => s.suolo.length + s.colonne.length + s.relitti.length + s.acqua.length - s.nicchie.length

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
    controlla(`la forma «${f}» si costruisce`, n > (f === 'galleria' ? 8 : f === 'antro' ? 15 : 30), `${n}/40`)
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
  for (const f of [...FORME_COSTRUITE.filter(x => x !== 'rettangolo'), ...FORME_DI_GROTTA])
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
  const conSala = PIANI.filter(x => x.l.stanze.some(s => s.forma === 'sala' || s.forma === 'antro')).length
  controlla('quasi ogni piano ha una sala grande (una sala nelle costruite, un antro nelle grotte)', conSala >= PIANI.length * 0.9, `${conSala}/${PIANI.length}`)
  controlla('una sala è grande (da 70 celle) e larga almeno quanto la stanza più grande di una volta (10×8)',
            sale.every(({ s }) => nateDi(s) >= 70 && s.w * s.h >= 80), `minima ${Math.min(...sale.map(x => x.s.w * x.s.h))}`)
  controlla('e anche un antro è grande, e `grande` lo dice di tutti e due', stanze.filter(x => x.s.forma === 'antro').every(({ s }) => nateDi(s) >= 70) &&
            stanze.every(({ s }) => s.grande === (nateDi(s) >= 70)))
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
  let appostati = { angolo: 0, colonna: 0, relitto: 0 }, soli = 0, inGrandi = 0, inPiccole = 0
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
      if (m.appostato === 'relitto' && !vicini4.some(([dx, dy]) => l.a(m.x + dx, m.y + dy) === RELITTO))
        male.push('un appostato «dietro un relitto» non ha un relitto accanto')
      if (mostriDi(l).some(o => o !== m && !o.chiave && l.stanzaDi(o.x, o.y) === s && Math.hypot(o.x - m.x, o.y - m.y) < 4)) male.push('un appostato che non è solo')
    }
  }
  controlla('i branchi stanno in una stanza, entro 4,5 celle, da due a cinque', male.length === 0, [...new Set(male)].slice(0, 3).join(' · '))
  controlla('ci sono branchi da tre o più', Object.entries(grandezze).some(([n, c]) => n >= 3 && c > 20), JSON.stringify(grandezze))
  controlla('i branchi stanno soprattutto nelle sale grandi', inGrandi > inPiccole * 1.5, `${inGrandi} contro ${inPiccole}`)
  controlla('ci sono appostati, in un angolo, dietro una colonna e dietro un relitto', appostati.angolo > 20 && appostati.colonna > 10 && appostati.relitto > 10, JSON.stringify(appostati))
  nota(`branchi per grandezza: ${JSON.stringify(grandezze)}; appostati ${soli}: ${appostati.angolo} in un angolo, ${appostati.colonna} dietro una colonna, ${appostati.relitto} dietro un relitto`)

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
      const base = l.mostro(m.tipo, m.x, m.y)
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
  // senza il grosso: niente anticamera e nessun caporale, tranne chi porta la chiave, che è un caporale della specie più dura
  // della coppia del posto (docs/sotterraneo/mostri.md)
  controlla('i piani senza il grosso non hanno anticamera, e di caporale hanno solo il guardiano della chiave', PIANI.filter(x => !x.l.grosso).every(x =>
    !x.l.stanze.some(s => s.ruolo === 'anticamera') && !mostriDi(x.l).some(m => m.caporale && !m.chiave)))
  // quasi sempre sta accanto alla scala; se lì non c'è posto la chiave la porta il mostro più lontano dall'ingresso (un mostro di strada
  // della stessa coppia)
  const senzaGrosso = PIANI.filter(x => !x.l.grosso)
  const guardiani = senzaGrosso.map(x => mostriDi(x.l).find(m => m.chiave))
  controlla('il guardiano della chiave è della coppia del posto', guardiani.every((g, i) => g && senzaGrosso[i].l.branco.includes(g.tipo)))
  const caporali = guardiani.filter((g, i) => g.caporale && g.tipo === duraDellaCoppia(senzaGrosso[i].l.branco))
  controlla('ed è quasi sempre un caporale della specie più dura', caporali.length >= guardiani.length * 0.9, `${caporali.length} su ${guardiani.length}`)

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
  for (const pianta of ['costruita', 'caverna']) {
    const fa = () => new Livello({ seme: 777, piano: 1, largo: 50, alto: 50, giri: 4, grosso: 'ossuto', pianta, acqua: true, scenario: 'cripta' })
    const a = fa(), b = fa()
    uguale(`${pianta}: lo stesso seme fa le stesse celle`, a.celle.join(), b.celle.join())
    uguale('...le stesse stanze, forme, colonne, nicchie, relitti e acqua', JSON.stringify(a.stanze.map(s => [s.x, s.y, s.w, s.h, s.forma, s.pezzi, s.colonne, s.nicchie, s.relitti, s.acqua, s.ruolo])),
           JSON.stringify(b.stanze.map(s => [s.x, s.y, s.w, s.h, s.forma, s.pezzi, s.colonne, s.nicchie, s.relitti, s.acqua, s.ruolo])))
    uguale('...e la stessa roba, branchi e caporali compresi', JSON.stringify(a.robe), JSON.stringify(b.robe))
    uguale('...e gli stessi relitti, con gli stessi aspetti', JSON.stringify(a.relitti), JSON.stringify(b.relitti))
  }
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

/* ══════════ 8. due famiglie di piani, scelte dalla discesa ══════════ */
const costruiti = PIANI.filter(x => x.l.pianta === 'costruita'), grotte = PIANI.filter(x => x.l.pianta === 'caverna')
const maschera = s => new Set([...s.suolo, ...s.colonne, ...s.relitti, ...s.acqua].map(c => c.x + ',' + c.y).filter(k => !s.nicchie.some(n => n.x + ',' + n.y === k)))
const camminabile = (l, x, y) => l.a(x, y) === PAVIMENTO || l.a(x, y) === PORTA
{
  const attese = { altare: 'costruita', cantine: 'costruita', torre: 'costruita', gallerie: 'caverna', cisterna: 'caverna', labirinto: 'costruita', fondo: 'caverna' }
  for (const t of CAMPAGNA) uguale(`${t.chiave}: la famiglia dei piani`, piantaDi(t, 0), attese[t.chiave])
  uguale('l\'abisso: cantine e cripta costruite, la fornace una grotta', TRATTI_DELL_ABISSO.map(x => `${x.scenario}:${x.pianta}`).join(), 'cantine:costruita,cripta:costruita,fornace:caverna')
  uguale('...e ogni piano dell\'abisso lo sa', [0, 4, 8, 12, 30].map(p => piantaDi(L_ABISSO, p)).join(), 'costruita,costruita,caverna,caverna,caverna')
  uguale('l\'acqua c\'è solo nella scala sommersa', CAMPAGNA.filter(t => conAcquaDi(t, 0)).map(t => t.chiave).join(), 'cisterna')
  controlla('...e non nell\'abisso', !conAcquaDi(L_ABISSO, 9))
  controlla('i piani fatti sanno la loro famiglia', PIANI.every(x => x.l.pianta === piantaDi(x.t, x.p)))
  controlla('le costruite hanno solo forme costruite', costruiti.every(x => x.l.stanze.every(s => FORME_COSTRUITE.includes(s.forma))))
  const stanzeGrotta = grotte.flatMap(x => x.l.stanze)
  const dellaGrotta = stanzeGrotta.filter(s => FORME_DI_GROTTA.includes(s.forma)).length
  controlla('le grotte hanno forme di grotta, salvo un rettangolo dove la foglia è troppo stretta', dellaGrotta >= stanzeGrotta.length * 0.97, `${dellaGrotta}/${stanzeGrotta.length}`)
  const stanzeCostruite = costruiti.flatMap(x => x.l.stanze)
  controlla('le costruite non sono tutte rettangoli: almeno il 40% delle stanze ha una forma', stanzeCostruite.filter(s => s.forma !== 'rettangolo' && s.forma !== 'sala').length >=
            stanzeCostruite.length * 0.4)
  // lo scenario non sposta il piano: altro scenario, stesse celle e stessi ostacoli (cambia solo il vestito)
  for (const pianta of ['costruita', 'caverna']) {
    const fa = scenario => new Livello({ seme: 31, piano: 1, largo: 46, alto: 46, giri: 4, pianta, acqua: true, scenario })
    const a = fa('cripta'), b = fa('fornace')
    uguale(`${pianta}: con un altro scenario le celle sono le stesse`, a.celle.join(), b.celle.join())
    uguale('...e i relitti stanno negli stessi posti', JSON.stringify(a.relitti.map(r => [r.x, r.y, r.w, r.h, r.classe])), JSON.stringify(b.relitti.map(r => [r.x, r.y, r.w, r.h, r.classe])))
    controlla('...vestiti d\'altro', a.relitti.length > 3 && a.relitti.some((r, i) => r.id !== b.relitti[i].id))
  }
}

/* ══════════ 9. le costruite: colonnati, nicchie, simmetrie, corridoi larghi ══════════ */
{
  const sale = costruiti.flatMap(x => x.l.stanze.filter(s => s.forma === 'sala').map(s => ({ l: x.l, s })))
  const conColonnato = sale.filter(({ s }) => s.colonnato)
  controlla('quasi tutte le sale hanno un colonnato', conColonnato.length >= sale.length * 0.8, `${conColonnato.length}/${sale.length}`)
  const male = []
  for (const { s } of conColonnato) {
    const { lungoX } = s.colonnato
    const file = new Map()
    for (const c of s.colonne) { const k = lungoX ? c.y : c.x; (file.get(k) || file.set(k, []).get(k)).push(lungoX ? c.x : c.y) }
    if (file.size !== 2) male.push(`${file.size} file di pilastri`)
    for (const [, lista] of file) {
      lista.sort((a, b) => a - b)
      if (lista.some(v => (v - lista[0]) % 3)) male.push('pilastri non a tre celle uno dall\'altro')
    }
    const [A, B] = [...file.values()]
    if (A && B && A.filter(v => B.includes(v)).length < Math.min(A.length, B.length) * 0.8) male.push('le due file non si specchiano')
    if (s.colonne.length < 4) male.push('un colonnato con meno di quattro pilastri')
  }
  controlla('un colonnato sono due file di pilastri, uno ogni tre celle, e le file si specchiano', male.length === 0, [...new Set(male)].slice(0, 3).join(' · '))

  // le nicchie: una cella scavata nel muro, spessa una, a tre lati di roccia con il muro dietro di due celle
  const nicchie = costruiti.flatMap(x => x.l.stanze.flatMap(s => s.nicchie.map(n => ({ l: x.l, s, n }))))
  controlla('le costruite hanno nicchie', nicchie.length > 150, `${nicchie.length}`)
  const storte = []
  for (const { l, s, n } of nicchie) {
    const aperte = vicini4.filter(([dx, dy]) => l.dentro(s, n.x + dx, n.y + dy))
    if (l.a(n.x, n.y) !== PAVIMENTO || !l.dentro(s, n.x, n.y)) storte.push('una nicchia non è pavimento della stanza')
    if (aperte.length !== 1) { storte.push(`una nicchia con ${aperte.length} aperture`); continue }
    const [dx, dy] = [-aperte[0][0], -aperte[0][1]], px = -dy, py = dx   // verso il fondo, e lungo la parete
    for (const [a, b] of [[px, py], [-px, -py], [dx, dy], [dx + px, dy + py], [dx - px, dy - py], [2 * dx, 2 * dy]])
      if (l.a(n.x + a, n.y + b) !== ROCCIA) storte.push('una nicchia senza il suo muro attorno e dietro')
    if (l.robeSu(n.x, n.y).some(r => r.che === 'porta')) storte.push('una porta dentro una nicchia')
  }
  controlla('ogni nicchia è una cella della stanza con una sola apertura e il muro spesso due attorno e dietro', storte.length === 0, [...new Set(storte)].slice(0, 3).join(' · '))
  const allineate = conColonnato.flatMap(({ s }) => s.nicchie.map(n => ({ s, n })))
  controlla('nelle sale col colonnato le nicchie stanno in linea coi pilastri', allineate.length > 40 &&
            allineate.every(({ s, n }) => s.colonnato.pos.includes(s.colonnato.lungoX ? n.x : n.y)), `${allineate.length} nicchie`)

  // le forme squadrate sono simmetriche; la smussata ha i quattro angoli tagliati
  const maschereDi = forma => costruiti.flatMap(x => x.l.stanze.filter(s => s.forma === forma).map(s => ({ l: x.l, s })))
  // la maschera della stanza com'è nata (con relitti e acqua, senza nicchie), riflessa nel suo riquadro
  const riflessa = (s, oriz, vert) => {
    const m = maschera(s), celle = [...m].map(k => k.split(',').map(Number))
    const x0 = Math.min(...celle.map(c => c[0])), x1 = Math.max(...celle.map(c => c[0])), y0 = Math.min(...celle.map(c => c[1])), y1 = Math.max(...celle.map(c => c[1]))
    return celle.every(([x, y]) => m.has(`${oriz ? x0 + x1 - x : x},${vert ? y0 + y1 - y : y}`))
  }
  for (const f of ['smussata', 'croce']) {
    const l = maschereDi(f)
    controlla(`la «${f}» è simmetrica da tutte e due le parti`, l.length > 20 && l.every(({ s }) => riflessa(s, true, false) && riflessa(s, false, true)), `${l.length} stanze`)
  }
  for (const f of ['tu', 'cappella']) {
    const l = maschereDi(f)
    controlla(`la «${f}» è simmetrica da una parte`, l.length > 20 && l.every(({ s }) => riflessa(s, true, false) || riflessa(s, false, true)), `${l.length} stanze`)
  }
  const sm = maschereDi('smussata').filter(({ s }) => !s.nicchie.length)
  controlla('la smussata ha i quattro angoli del riquadro di roccia', sm.length > 20 && sm.every(({ l, s }) =>
    [[s.x, s.y], [s.x + s.w - 1, s.y], [s.x, s.y + s.h - 1], [s.x + s.w - 1, s.y + s.h - 1]].every(([x, y]) => !l.dentro(s, x, y))))

  // i corridoi larghi due: celle di passaggio in blocchi di 2×2
  const largo = l => { for (let y = 0; y < l.alto - 1; y++) for (let x = 0; x < l.largo - 1; x++)
    if ([[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => camminabile(l, x + dx, y + dy) && l.nelle[(y + dy) * l.largo + x + dx] < 0)) return true
    return false }
  const conLargo = costruiti.filter(x => largo(x.l)).length
  controlla('qualche corridoio è largo due celle', conLargo >= costruiti.length * 0.25, `${conLargo}/${costruiti.length} piani`)
  nota(`sale con colonnato ${conColonnato.length}/${sale.length}, nicchie ${nicchie.length}, piani con un corridoio largo ${conLargo}/${costruiti.length}`)
}

/* ══════════ 10. le grotte: slarghi che sono stanze, passaggi storti ══════════ */
{
  const stanzeG = grotte.flatMap(x => x.l.stanze.map(s => ({ l: x.l, s })))
  controlla('una grotta non ha colonne né nicchie', stanzeG.every(({ s }) => !s.colonne.length && !s.nicchie.length))
  controlla('i suoi slarghi sono stanze vere: ognuna con la sua mappa (suolo, centro) e un\'uscita (una cella di passaggio accanto)', stanzeG.every(({ l, s }) =>
    s.suolo.length >= 14 && l.dentro(s, s.cx, s.cy) && s.suolo.every(c => l.stanzaDi(c.x, c.y) === s) &&
    s.suolo.some(c => vicini4.some(([dx, dy]) => camminabile(l, c.x + dx, c.y + dy) && !l.dentro(s, c.x + dx, c.y + dy)))))
  controlla('le grotte hanno antri grandi, e mai stanze sotto le 14 celle', stanzeG.filter(({ s }) => s.forma === 'antro').length > 100 && stanzeG.every(({ s }) => nateDi(s) >= 14))
  controlla('il numero di stanze regge: da quattro a sedici', grotte.every(x => x.l.stanze.length >= x.l.stanzeMin && x.l.stanze.length <= 16))
  // i passaggi: celle fuori dalle stanze; larghi due o tre in qualche tratto, stretti uno altrove
  const passaggio = (l, x, y) => camminabile(l, x, y) && l.nelle[y * l.largo + x] < 0
  const larghi = [], stretti = []
  for (const { l } of grotte) {
    let due = false, uno = false
    for (let y = 1; y < l.alto - 1; y++) for (let x = 1; x < l.largo - 1; x++) {
      if (!passaggio(l, x, y)) continue
      if (passaggio(l, x + 1, y) && passaggio(l, x, y + 1) && passaggio(l, x + 1, y + 1)) due = true
      if ((!camminabile(l, x - 1, y) && !camminabile(l, x + 1, y)) || (!camminabile(l, x, y - 1) && !camminabile(l, x, y + 1))) uno = true
    }
    larghi.push(due); stretti.push(uno)
  }
  controlla('nelle grotte i passaggi cambiano larghezza: larghi in quasi tutti i piani, stretti in tutti', larghi.filter(Boolean).length >= grotte.length * 0.85 &&
            stretti.every(Boolean), `${larghi.filter(Boolean).length}/${grotte.length} con un tratto largo`)
  // serpeggiano: fra due stanze collegate la strada è più lunga della linea retta (Manhattan) in una buona parte dei casi
  let storti = 0, totale = 0
  for (const { l } of grotte) for (const s of l.stanze) for (const id of s.vicine) if (id > s.id) {
    const t = l.stanze[id]
    const strada = percorso((x, y) => l.calpestabile(x, y), { x: s.cx, y: s.cy }, { x: t.cx, y: t.cy })
    totale++
    if (strada && strada.length > Math.abs(s.cx - t.cx) + Math.abs(s.cy - t.cy) + 2) storti++
  }
  controlla('i passaggi non vanno dritti: una strada su tre fra due stanze è più lunga della linea', storti >= totale * 0.3, `${storti}/${totale}`)
}

/* ══════════ 11. i relitti ══════════ */
{
  const conRelitti = PIANI.map(x => x.l)
  const male = []
  let celleRelitti = 0, celleStanze = 0
  for (const l of conRelitti) {
    const nelRelitto = new Set()
    for (const r of l.relitti) {
      const classe = CLASSI[r.classe]
      if (!classe) { male.push('una classe che non esiste'); continue }
      if (!((r.w === classe.w && r.h === classe.h) || (classe.orienta === 'entrambe' && r.w === classe.h && r.h === classe.w))) male.push(`${r.classe} con le misure storte`)
      if (!ASPETTI[l.scenario || 'cantine'][l.pianta][r.classe].some(a => a.id === r.id)) male.push(`${r.id} non è un aspetto di ${r.classe} in quella famiglia`)
      if (!r.dice || !(r.pezzo || r.disegno)) male.push('un relitto senza frase o senza figura')
      for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
        const x = r.x + i, y = r.y + j
        nelRelitto.add(x + ',' + y)
        if (l.a(x, y) !== RELITTO || l.calpestabile(x, y) || l.nelle[y * l.largo + x] !== -1) male.push('una cella di relitto non è chiusa')
      }
    }
    celleRelitti += nelRelitto.size
    for (const s of l.stanze) {
      celleStanze += s.suolo.length
      for (const c of s.relitti) if (!nelRelitto.has(c.x + ',' + c.y)) male.push('un relitto della stanza che non è nell\'elenco')
    }
    for (const r of l.relitti) {
      const celle = []
      for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) celle.push([r.x + i, r.y + j])
      for (const [x, y] of celle) {
        const stanza = l.stanze.find(s => s.relitti.some(c => c.x === x && c.y === y))
        if (!stanza) { male.push('un relitto fuori da ogni stanza'); continue }
        // a due celle dal centro (le scale, i forzieri, i corridoi) e da ogni porta
        if (Math.max(Math.abs(x - stanza.cx), Math.abs(y - stanza.cy)) < 2) male.push('un relitto a meno di due celle dal centro')
        for (const s2 of l.stanze) for (const p of s2.porte) if (Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2) male.push('un relitto vicino a una porta')
        // mai accanto a un altro ingombro
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const q = [x + dx, y + dy]
          if (l.a(...q) === RELITTO && !celle.some(([a, b]) => a === q[0] && b === q[1])) male.push('due relitti attaccati')
          if (l.a(...q) === ACQUA) male.push('un relitto accanto all\'acqua')
          if (stanza.colonne.some(c => c.x === q[0] && c.y === q[1])) male.push('un relitto accanto a una colonna')
        }
      }
      // la posa della sua classe: «pesante» sta contro un muro, «isolato» è staccato da tutto
      if (r.classe === 'pesante' && !celle.some(([x, y]) => vicini4.some(([dx, dy]) => l.a(x + dx, y + dy) === ROCCIA))) male.push('uno «pesante» non sta contro un muro')
      if (r.classe === 'isolato' && !celle.every(([x, y]) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = l.a(x + dx, y + dy); if (c !== PAVIMENTO && c !== PORTA && c !== RELITTO) return false }
        return true })) male.push('un «isolato» che tocca un muro')
    }
  }
  controlla('ogni relitto occupa celle chiuse, a due celle dal centro e dalle porte, non attaccato a un altro ingombro, e sta nella posa della sua classe',
            male.length === 0, [...new Set(male)].slice(0, 4).join(' · '))
  controlla('i relitti ci sono in quasi tutti i piani, e non soffocano le stanze', conRelitti.filter(l => l.relitti.length).length >= conRelitti.length * 0.95 && celleRelitti < celleStanze * 0.12,
            `${(celleRelitti / celleStanze * 100).toFixed(1)}% delle celle`)
  controlla('l\'ingresso ne ha pochi', conRelitti.every(l => l.stanze[0].relitti.length <= 2))
  nota(`relitti: ${conRelitti.reduce((n, l) => n + l.relitti.length, 0)} in ${conRelitti.length} piani, ${(celleRelitti / celleStanze * 100).toFixed(1)}% delle celle di stanza`)

  // la strada non si chiude mai: ogni cella calpestabile si raggiunge dall'ingresso (non solo le cose del piano)
  const chiusi = conRelitti.filter(l => {
    let n = 0
    for (let y = 0; y < l.alto; y++) for (let x = 0; x < l.largo; x++) if (camminabile(l, x, y)) n++
    return raggiungibili((x, y) => l.calpestabile(x, y), { x: l.stanze[0].cx, y: l.stanze[0].cy }).size !== n
  })
  controlla('con i relitti e l\'acqua ogni cella del piano si raggiunge: nessuna tasca isolata', chiusi.length === 0, `${chiusi.length} piani`)
  controlla('...e ogni porta è libera: nessun relitto né pozza accanto a una porta', conRelitti.every(l => l.stanze.every(s => s.porte.every(p =>
    [[0, 0], ...vicini4].every(([dx, dy]) => { const c = l.a(p.x + dx, p.y + dy); return c !== RELITTO && c !== ACQUA })))))

  // un relitto alto fa ombra come un muro (uno basso no: la luce gli passa sopra), e si tocca per sapere cos'è
  const t = CAMPAGNA[5]
  let trovato = null
  for (let seme = 11; seme < 40 && !trovato; seme++) {
    const cc = new Corsa(t, { seme, rnd: seminato(seme) }), l = cc.livello
    for (const r of l.relitti) if (r.w === 1 && r.h === 1 && !l.bassi.has(r.y * l.largo + r.x) && [-2, -1, 1, 2].every(d => l.calpestabile(r.x + d, r.y))) { trovato = { cc, l, r }; break }
  }
  controlla('c\'è un relitto con strada libera da una parte e dall\'altra, per provare l\'ombra', !!trovato)
  if (trovato) {
    const { cc, l, r } = trovato
    for (const o of l.robe) if (o.che === 'mostro') o.morto = true
    cc.torciaResta = 8; cc.torceInScorta = 0
    cc.eroe = { x: r.x - 2 + 0.5, y: r.y + 0.5 }; cc.verso = { dx: 1, dy: 0 }
    cc.aggiornaLuce()
    uguale('il relitto si vede (si accende lui)', cc.luceDi(r.x, r.y), 2)
    controlla('...e dietro il relitto è ombra', cc.luceDi(r.x + 1, r.y) !== 2 && cc.luceDi(r.x + 2, r.y) !== 2)
    l.celle[r.y * l.largo + r.x] = PAVIMENTO
    cc.aggiornaLuce()
    uguale('senza il relitto la stessa cella è accesa', cc.luceDi(r.x + 2, r.y), 2)
    l.celle[r.y * l.largo + r.x] = RELITTO
    // toccarlo dice cos'è, ogni volta (un ostacolo non è rumore)
    cc.avvisi.length = 0
    cc.vaiVerso({ x: r.x, y: r.y })
    uguale('toccare un relitto dice cos\'è', cc.avvisi[cc.avvisi.length - 1], r.dice)
    cc.avvisi.length = 0
    cc.vaiVerso({ x: r.x, y: r.y })
    uguale('...anche la seconda volta', cc.avvisi[cc.avvisi.length - 1], r.dice)
  }
}

/* ══════════ 12. l'acqua ══════════ */
{
  const cisterne = PIANI.filter(x => x.t.chiave === 'cisterna')
  const conAcqua = cisterne.filter(x => x.l.stanze.some(s => s.acqua.length))
  controlla('nella scala sommersa c\'è acqua in quasi ogni piano', conAcqua.length >= cisterne.length * 0.95, `${conAcqua.length}/${cisterne.length}`)
  controlla('e solo lì', PIANI.filter(x => x.t.chiave !== 'cisterna').every(x => !x.l.stanze.some(s => s.acqua.length)))
  const male = []
  for (const { l } of cisterne) for (const s of l.stanze) for (const c of s.acqua) {
    if (l.a(c.x, c.y) !== ACQUA || l.calpestabile(c.x, c.y) || l.nelle[c.y * l.largo + c.x] !== -1) male.push('una cella d\'acqua non è chiusa')
    if (Math.max(Math.abs(c.x - s.cx), Math.abs(c.y - s.cy)) < 2) male.push('acqua a meno di due celle dal centro')
    if (l.stanze.some(r => r.porte.some(p => Math.abs(p.x - c.x) < 2 && Math.abs(p.y - c.y) < 2))) male.push('acqua vicino a una porta')
    if (l.robeSu(c.x, c.y).length) male.push('roba sull\'acqua')
  }
  controlla('ogni cella d\'acqua è chiusa al passo, lontana dal centro e dalle porte, senza roba sopra', male.length === 0, [...new Set(male)].slice(0, 3).join(' · '))
  const acquaTotale = cisterne.reduce((n, { l }) => n + l.stanze.reduce((m, s) => m + s.acqua.length, 0), 0)
  const celleTotali = cisterne.reduce((n, { l }) => n + l.stanze.reduce((m, s) => m + nateDi(s), 0), 0)
  const quota = acquaTotale / celleTotali
  controlla('l\'acqua è una parte delle stanze, non tutta', quota > 0.04 && quota < 0.25, `${(quota * 100).toFixed(1)}%`)

  // si vede di là dell'acqua: non ferma la luce
  const t = CAMPAGNA[4]
  let trovato = null
  for (let seme = 11; seme < 60 && !trovato; seme++) {
    const cc = new Corsa(t, { seme, rnd: seminato(seme) }), l = cc.livello
    for (const s of l.stanze) for (const c of s.acqua) if ([-1, 1].every(d => l.calpestabile(c.x + d, c.y) && l.calpestabile(c.x + 2 * d, c.y))) { trovato = { cc, l, c }; break }
  }
  controlla('c\'è una pozza con terra da una parte e dall\'altra, per provare la luce', !!trovato)
  if (trovato) {
    const { cc, l, c } = trovato
    for (const o of l.robe) if (o.che === 'mostro') o.morto = true
    cc.torciaResta = 8; cc.torceInScorta = 0
    cc.eroe = { x: c.x - 1 + 0.5, y: c.y + 0.5 }; cc.verso = { dx: 1, dy: 0 }
    cc.aggiornaLuce()
    uguale('l\'acqua si vede', cc.luceDi(c.x, c.y), 2)
    uguale('...e di là dell\'acqua si vede ancora (non ferma la luce)', cc.luceDi(c.x + 1, c.y), 2)
    controlla('...ma non ci si cammina sopra', !l.calpestabile(c.x, c.y) && !cc.buona()(c.x, c.y))
    cc.avvisi.length = 0
    cc.vaiVerso({ x: c.x, y: c.y })
    controlla('toccare l\'acqua dice che non si passa', /Acqua/.test(cc.avvisi[cc.avvisi.length - 1] || ''), String(cc.avvisi[cc.avvisi.length - 1]))
  }
}

/* ══════════ 13. i dati dei relitti ══════════ */
{
  const g = guastiDeiRelitti(Object.keys(PEZZI))
  controlla('relitti: nessun guasto (sprite nell\'atlante, disegni in codice, niente da spostare)', g.length === 0, g.slice(0, 3).join(' · '))
  uguale('ogni disegno in codice ha il suo pittore e viceversa', DISEGNATI.slice().sort().join(), DISEGNI.slice().sort().join())
  controlla('i dati reggono anche senza l\'atlante', guastiDeiRelitti(null).length === 0)
}

riassunto('i piani del sotterraneo')
