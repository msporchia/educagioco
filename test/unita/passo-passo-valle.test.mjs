/* Le due valli di Passo passo, senza browser: la valle dei piccoli e le
   isole delle carte, ognuna vista da tutti e due i protagonisti. Il modulo
   di ognuna è quello del suo foglietto (se no si rilancia lo strumento), una
   casella per tappa delle sue isole, ogni casella sta su un sentiero e non
   tocca le altre dello stesso protagonista né i cartelli; per ogni
   protagonista ci sono solo le sue caselle, e a ogni punto della campagna
   ogni casella aperta si raggiunge, i ponti verso un'isola chiusa hanno il
   blocco e non si passano, l'animale è sempre lui e un viaggio lungo non
   dura di più. Da una tappa alla dopo non si ripassa mai da una casella già
   fatta: il coniglio dai massi va allo zaino per il pascolo, il cane fa
   tutta la sua strada nella valle. Ognuno ha il suo sentiero senza fine, in
   fondo alla sua strada.
   Vedi docs/passo-passo/mappa.md.
   `node test/esegui.mjs passo-passo-valle --niente-build` */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { CAMPAGNA, SCALINI, TAPPE_PICCOLE } from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE, aperture } from '../../src/giochi/passo-passo/motore/strade.js'
import { DATI, MONDI, quadroValle, chiusure, percorso, viaggio, vicinoA, mondoDellIsola, TEMPO_MAX }
  from '../../src/giochi/passo-passo/scena/valle.js'
import { ANIMALE, SENTIERO_CANE } from '../../src/giochi/passo-passo/scena/animale.js'
import { stendardo, stemma, stimaNome, insegnaTana } from '../../src/giochi/passo-passo/scena/stendardo.js'
import { STELLE, LARGO_STELLE } from '../../src/giochi/passo-passo/scena/tondo.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const S = STRADE
const FOGLIETTI = { valle: 'isole.json', zaino: 'zaino.json' }
const foglietto = mondo => new URL(`../../strumenti/sprite/sorgenti/passo-passo/${FOGLIETTI[mondo]}`, import.meta.url)
const fgDi = Object.fromEntries(MONDI.map(m => [m, JSON.parse(readFileSync(foglietto(m), 'utf8'))]))
const PROTAGONISTI = ['coniglio', 'cane']
const qDi = Object.fromEntries(MONDI.map(m => [m, Object.fromEntries(PROTAGONISTI.map(p => [p, quadroValle(S, { mondo: m, protagonista: p })]))]))
const q = qDi.valle.coniglio
const per = new Map(q.nodi.map(n => [n.id, n]))
const SPAZIO = 8
const nome = i => CAMPAGNA[i].chiave

const distanza = (p, punti) => {
  let d = Infinity
  for (let i = 1; i < punti.length; i++) {
    const [ax, ay] = punti[i - 1], [bx, by] = punti[i]
    const l2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1
    const t = Math.max(0, Math.min(1, ((p.x - ax) * (bx - ax) + (p.y - ay) * (by - ay)) / l2))
    d = Math.min(d, Math.hypot(ax + (bx - ax) * t - p.x, ay + (by - ay) * t - p.y))
  }
  return d
}
const distanzaRett = (p, r) => Math.hypot(Math.max(r.x - p[0], 0, p[0] - (r.x + r.w)), Math.max(r.y - p[1], 0, p[1] - (r.y + r.h)))
const distanzaStrada = (r, punti) => {
  let d = Infinity
  for (let i = 1; i < punti.length; i++) for (let t = 0; t <= 1; t += 0.02)
    d = Math.min(d, distanzaRett([punti[i - 1][0] + (punti[i][0] - punti[i - 1][0]) * t, punti[i - 1][1] + (punti[i][1] - punti[i - 1][1]) * t], r))
  return d
}
// le isole delle strade di un protagonista in un mondo
const isoleDi = (p, mondo) => S.isole.filter(s => s.animale === p && mondoDellIsola(s.chiave) === mondo)

/* ══════════ i due mondi, uno per uno ══════════ */
controlla('ogni isola delle strade sta in un mondo', S.isole.every(s => mondoDellIsola(s.chiave) !== null),
          S.isole.filter(s => mondoDellIsola(s.chiave) === null).map(s => s.chiave).join(' '))
{
  const ids = m => new Set(PROTAGONISTI.flatMap(p => qDi[m][p].nodi.map(n => n.chiave)))
  const zaino = ids('zaino')
  uguale('i posti dei due mondi hanno id diversi (la mappa li riconosce da lì)', [...ids('valle')].filter(k => zaino.has(k)).join(' '), '')
}

for (const mondo of MONDI) {
  const D = DATI[mondo], fg = fgDi[mondo]

  /* ── il modulo è quello del foglietto ── */
  uguale(`${mondo}: il modulo è fatto dal foglietto di adesso (rilancia python3 strumenti/sprite/isole-passo-passo.py)`,
         D.FIRMA, createHash('sha1').update(readFileSync(foglietto(mondo))).digest('hex').slice(0, 12))
  uguale(`${mondo}: i punti senza nome del mondo hanno il suo prefisso, se ce l'ha`,
         D.NODI.filter(n => /^(z-)?(incrocio|sosta|capo):/.test(n.id)).filter(n => n.id.startsWith('z-') !== !!fg.prefisso).length, 0)

  for (const p of PROTAGONISTI) {
    const Q = qDi[mondo][p]
    const nome = m => `${mondo}, ${p}: ${m}`
    const isole = isoleDi(p, mondo)
    const caselle = Q.nodi.filter(n => n.tipo === 'casella')
    const tonde = Q.nodi.filter(n => n.tipo === 'casella' || n.tipo === 'sentiero')
      .map(n => ({ ...n, mezzo: n.tipo === 'casella' ? D.LATO / 2 : Math.round(D.LATO * 1.35) / 2 }))

    /* ── una casella per tappa ── */
    for (const s of isole) {
      const [k, d] = Object.entries(D.ISOLE).find(([k, d]) => (p === 'cane' ? d.cane && d.cane.isola === s.chiave : k === s.chiave))
      uguale(nome(`${s.chiave} (sull'isola ${k}): tante caselle quante tappe (se no si corregge il foglietto)`),
             p === 'cane' ? d.cane.caselle : d.caselle, s.tappe.length)
    }
    const tappe = isole.flatMap(s => s.tappe)
    uguale(nome('una casella per ogni sua tappa di questo mondo'), caselle.map(n => n.id).sort((a, b) => a - b).join(','),
           [...tappe].sort((a, b) => a - b).join(','))
    controlla(nome('ci sono solo le sue caselle, e l\'animale è sempre lui'),
              caselle.every(n => S.animale[n.id] === p) && Q.nodi.every(n => n.animale === p))

    /* ── le caselle sui sentieri ── */
    const fuoriStrada = tonde.filter(n => !fg.sentieri.some(s => s.isola === n.isola && !s.erba && distanza(n, s.punti) < 1.5))
    uguale(nome('ogni casella sta su un sentiero della sua isola'), fuoriStrada.map(n => n.chiave).join(' '), '')
    const toccano = []
    tonde.forEach((a, i) => tonde.slice(i + 1).forEach(b => {
      if (Math.abs(a.x - b.x) < a.mezzo + b.mezzo + SPAZIO - 0.05 && Math.abs(a.y - b.y) < a.mezzo + b.mezzo + SPAZIO - 0.05)
        toccano.push(`${a.chiave}/${b.chiave}`)
    }))
    uguale(nome('fra due caselle c\'è sempre posto per un dito'), toccano.join(' '), '')
    controlla(nome('le caselle stanno nel fondale'), tonde.every(n => n.x - n.mezzo >= 0 && n.y - n.mezzo >= 0 &&
      n.x + n.mezzo <= D.LARGO && n.y + n.mezzo <= D.ALTO))
    controlla(nome('il lato della casella lascia posto alle stelline (a cavallo del bordo)'),
              LARGO_STELLE <= D.LATO && STELLE.fuori < 8)

    /* ── gli stendardi non coprono niente ──
       né una casella (col suo tondo, le stelle e l'animale seduto sopra), né un sentiero, un ponte o una
       tana; col nome più largo che un carattere di riserva può dare */
    const coperte = [], suStrada = [], fuoriFondale = [], suTana = []
    const strade = [...fg.sentieri.filter(x => !x.erba), ...fg.ponti]
    const tane = Q.nodi.filter(n => n.tipo === 'tana' || n.tipo === 'passaggio')
    for (const [k, d] of Object.entries(Q.isole)) {
      const s = S.isole.find(x => x.chiave === k)
      const b = d.stemma ? stemma(s.animale) : stendardo(stimaNome(SCALINI.find(x => x.chiave === s.scalino).nome), s.animale)
      const r = { x: d.cartello[0] - b.w / 2, y: d.cartello[1] - b.h / 2, w: b.w, h: b.h }
      if (r.x < 0 || r.y < 0 || r.x + r.w > D.LARGO || r.y + r.h > D.ALTO) fuoriFondale.push(k)
      for (const n of tonde) {
        const su = n.mezzo + ANIMALE.alto - ANIMALE.piede
        if (Math.abs(n.x - d.cartello[0]) < b.w / 2 + n.mezzo && Math.abs(n.y - d.cartello[1]) < b.h / 2 + n.mezzo + 2 ||
            (n.y - su < r.y + r.h && n.y + n.mezzo > r.y && Math.abs(n.x - d.cartello[0]) < b.w / 2 + n.mezzo)) coperte.push(`${k}/${n.chiave}`)
      }
      for (const st of strade) if (distanzaStrada(r, st.punti) < 14) suStrada.push(`${k}/${st.isola || st.nome}`)
      for (const t of tane) if (distanzaRett([t.x, t.y], r) < 22) suTana.push(`${k}/${t.id}`)
    }
    uguale(nome('gli stendardi stanno nel fondale'), fuoriFondale.join(' '), '')
    uguale(nome('gli stendardi non coprono le caselle, né l\'animale seduto sopra'), [...new Set(coperte)].join(' '), '')
    uguale(nome('e non coprono un sentiero né un ponte'), [...new Set(suStrada)].join(' '), '')
    uguale(nome('né una tana'), [...new Set(suTana)].join(' '), '')
    // l'insegna della tana per l'altro mondo: sopra la bocca, con la punta giù, nel fondale e senza coprire
    // una casella; col nome e i numeri più larghi che possano capitare
    for (const t of Q.nodi.filter(n => n.tipo === 'passaggio')) {
      const insegna = insegnaTana(Math.max(stimaNome('I prossimi livelli'), stimaNome('dall\'99 al 99')), t.scosta || 0)
      const [fx, fy] = t.freccia
      const r = { x: fx - insegna.punta.x, y: fy - insegna.h, w: insegna.w, h: insegna.h }
      controlla(nome(`l'insegna della tana ${t.id} sta nel fondale`),
                r.x >= 0 && r.y >= 0 && r.x + r.w <= D.LARGO && r.y + r.h <= D.ALTO)
      controlla(nome(`e punta sulla bocca, da sopra`), Math.abs(fx - t.x) < 10 && fy < t.y && t.y - fy < 30, t.id)
      controlla(nome(`e non copre una casella né un sentiero`),
                tonde.every(n => distanzaRett([n.x, n.y], r) > n.mezzo) && strade.every(st => distanzaStrada(r, st.punti) > 6),
                t.id)
    }
    // una tana dipinta non sta sotto una casella: il buco si deve vedere
    const coperteTane = []
    for (const t of tane) for (const n of tonde)
      if (Math.abs(t.x - n.x) < n.mezzo + 6 && Math.abs(t.y - n.y) < n.mezzo + 6) coperteTane.push(`${t.id}/${n.chiave}`)
    uguale(nome('nessuna casella copre una tana'), coperteTane.join(' '), '')

    /* ── a ogni punto della campagna ── */
    const tutte = chiusure(Q, () => true)
    uguale(nome('tutto aperto, nessun blocco'), tutte.blocchi.length, 0)
    uguale(nome('e nessun arco chiuso'), tutte.bloccati.size, 0)
    // i punti: l'inizio e la fine di ogni isola della sua strada, e qualcuno in mezzo
    const sua = S[p]
    const punti = [...new Set([0, ...isole.flatMap(s => [s.tappe[0], s.tappe[1], s.tappe.at(-1)].map(i => sua.indexOf(i))), sua.length])]
    for (const fatte of punti) {
      // fatte le prime `fatte` della sua strada (e per il cane tutto il coniglio fino alla fine dei piccoli)
      const fatta = i => (S.animale[i] === p ? sua.indexOf(i) < fatte : p === 'cane' && i <= S.apreIlCane)
      const { aperta } = aperture(S, { fatta })
      const c = chiusure(Q, aperta)
      const aperteQui = caselle.filter(n => aperta(n.id))
      if (!aperteQui.length) continue
      const da = aperteQui.find(n => !fatta(n.id)) || aperteQui[0]
      const persi = aperteQui.filter(n => !percorso(Q, da.id, n.id, c.bloccati))
      uguale(nome(`fatte ${fatte}: ogni casella aperta si raggiunge`), persi.map(n => n.id).join(' '), '')
      const chiuse = caselle.filter(n => !c.aperte.has(n.isola))
      uguale(nome(`fatte ${fatte}: sulle isole chiuse non si arriva`),
             chiuse.filter(n => percorso(Q, da.id, n.id, c.bloccati)).map(n => n.id).join(' '), '')
      // un blocco per ogni ponte fra un'isola aperta e una chiusa, dalla parte della chiusa
      const attesi = Object.entries(Q.ponti).filter(([, p]) => c.aperte.has(p.isole[0]) !== c.aperte.has(p.isole[1]))
        .map(([nm, p]) => `${nm}>${c.aperte.has(p.isole[0]) ? p.isole[1] : p.isole[0]}`).sort().join(' ')
      uguale(nome(`fatte ${fatte}: i blocchi stanno sui ponti verso le isole chiuse`),
             c.blocchi.map(b => `${b.ponte}>${b.isola}`).sort().join(' '), attesi)
      const passati = aperteQui.flatMap(n => percorso(Q, da.id, n.id, c.bloccati) || []).filter(t => c.bloccati.has(t.arco))
      uguale(nome(`fatte ${fatte}: nessuna strada passa da un arco chiuso`), passati.length, 0)
      // sul ponte verso un'isola chiusa si va, ma ci si ferma prima del blocco
      const dove = new Set(Q.nodi.filter(n => percorso(Q, da.id, n.id, c.bloccati)).map(n => n.id))
      const oltre = []
      for (const b of c.blocchi) {
        const capo = Q.archi.filter(e => e.ponte === b.ponte).flatMap(e => [e.a, e.b]).map(id => Q.nodi.find(n => n.id === id))
          .find(n => n.isola === b.isola)
        const soglia = Math.hypot(b.x - capo.x, b.y - capo.y)
        for (const n of Q.nodi.filter(n => n.ponte === b.ponte && dove.has(n.id)))
          if (Math.hypot(n.x - capo.x, n.y - capo.y) < soglia + 20) oltre.push(`${b.ponte}:${n.id}`)
        if (dove.has(capo.id)) oltre.push(`${b.ponte}:${capo.id}`)
      }
      uguale(nome(`fatte ${fatte}: sui ponti chiusi ci si ferma prima del blocco`), oltre.join(' '), '')
    }

    /* ── il viaggio ── */
    const sbagli = [], lunghi = []
    for (const a of tonde) for (const b of tonde) {
      if (a.id === b.id) continue
      const v = viaggio(Q, a.id, b.id, tutte.bloccati)
      const ultimo = v.at(-1)
      if (!ultimo || ultimo.al !== b.id) sbagli.push(`${a.chiave}>${b.chiave}`)
      if (v.reduce((s, p) => s + (p.che === 'salto' ? p.dur : 0), 0) > TEMPO_MAX + 0.01) lunghi.push(`${a.chiave}>${b.chiave}`)
    }
    uguale(nome('da ogni casella a ogni altra si arriva'), sbagli.slice(0, 6).join(' '), '')
    uguale(nome('e nessun viaggio salta più a lungo di così'), lunghi.slice(0, 6).join(' '), '')
    controlla(nome('e l\'animale è sempre lui'), tonde.every(a => tonde.every(b => a.id === b.id ||
      viaggio(Q, a.id, b.id, tutte.bloccati).every(x => x.animale === p))))

    /* ── da una tappa alla dopo si va avanti: nessuna casella già fatta per strada ──
       la strada fra due tappe di fila, con la campagna fatta fino alla prima, non passa
       sopra una casella che sulla strada viene prima */
    const tornano = []
    const qui = sua.filter(i => caselle.some(n => n.id === i))
    for (let k = 1; k < qui.length; k++) {
      const a = qui[k - 1], b = qui[k]
      const fatta = i => (S.animale[i] === p ? S.numero[i] <= S.numero[a] : p === 'cane' && i <= S.apreIlCane)
      const c = chiusure(Q, aperture(S, { fatta }).aperta)
      const via = (percorso(Q, a, b, c.bloccati) || []).map(t => t.verso).filter(id => typeof id === 'number' && id !== b)
      if (via.length) tornano.push(`${S.numero[a]}>${S.numero[b]} per ${via.map(i => S.numero[i]).join(',')}`)
    }
    uguale(nome('da una tappa alla dopo non si ripassa da una casella già fatta'), tornano.join(' '), '')
  }
}

/* ══════════ il sentiero senza fine: uno per animale, in fondo alla sua strada ══════════ */
{
  const atteso = { coniglio: 'zaino:senza-fine@mondo', cane: `valle:${SENTIERO_CANE}@passi` }
  for (const p of PROTAGONISTI) {
    const tutti = MONDI.flatMap(m => qDi[m][p].nodi.filter(n => n.tipo === 'sentiero').map(n => `${m}:${n.id}@${n.isola}`))
    uguale(`col ${p} un sentiero solo, il suo`, tutti.join(' '), atteso[p])
    const [m, id] = [atteso[p].split(':')[0], atteso[p].split(':')[1].split('@')[0]]
    const Q = qDi[m][p]
    const fatta = i => S.animale[i] === p || i <= S.apreIlCane
    const via = (percorso(Q, S[p].at(-1), id, chiusure(Q, aperture(S, { fatta }).aperta).bloccati) || null)
    controlla(`col ${p} ci si arriva dall'ultima tappa della sua strada, senza ripassare da una casella`,
              !!via && via.every(t => t.verso === id || typeof t.verso !== 'number'))
  }
}

/* ══════════ la valle dei piccoli ══════════ */
{
  const D = DATI.valle
  const tutte = chiusure(q, () => true)
  {
    // a metà del ghiaccio: i massi chiusi, e al prato si arriva solo dal ponte lungo
    const { aperta } = aperture(S, { fatta: i => i < 12 })
    const c = chiusure(q, aperta)
    controlla('a metà del ghiaccio il ponte dei massi ha il blocco dalla parte dei massi',
              c.blocchi.some(b => b.ponte === 'prato-massi' && b.isola === 'massi'))
    const via = percorso(q, 12, 0, c.bloccati).map(t => q.archi[t.arco].ponte).filter((p, k, l) => p && p !== l[k - 1])
    uguale('dal ghiaccio al prato: giù dal salto e sul ponte lungo', via.join(' '), 'salto-ghiaccio prato-salto')
  }
  {
    /* finiti i massi il coniglio va avanti: giù dai massi al prato, nel pascolo, e nella galleria per lo
       zaino; non torna indietro per i massi e le buche */
    const tutto = CAMPAGNA.findIndex(t => t.chiave === 'tutto')
    const c = chiusure(q, aperture(S, { fatta: i => i <= tutto }).aperta)
    const via = percorso(q, tutto, 'tana:zaino', c.bloccati)
    uguale('da «Tutto insieme» alla tana dello zaino: il ponte del prato, poi quello del pascolo',
           via.map(t => q.archi[t.arco].ponte).filter((p, k, l) => p && p !== l[k - 1]).join(' '), 'prato-massi prato-pascolo')
    uguale('e per strada nessuna casella', via.map(t => t.verso).filter(id => typeof id === 'number').join(' '), '')
    controlla('la tana dello zaino è la galleria del pascolo', per.get('tana:zaino').isola === 'pascolo')
  }
  controlla('col coniglio il pascolo è terra da attraversare: senza caselle né stendardo, sempre aperto',
            !q.nodi.some(n => n.isola === 'pascolo' && n.tipo === 'casella') && !Object.values(q.isole).some(d => d.isola === 'pascolo') &&
            chiusure(q, () => false).aperte.has('pascolo'))
  {
    // atterrato a metà di un ponte, si riparte da lì: indietro, se la meta è dietro
    const i = q.archi.findIndex(e => e.ponte === 'prato-salto')
    const e = q.archi[i]
    const indietro = viaggio(q, { arco: i, s: e.lungo * 0.3 }, 4, tutte.bloccati)
    controlla('a metà del ponte lungo si torna al prato senza arrivare al salto',
              indietro.length > 0 && indietro.at(-1).al === 4 && indietro.every(p => p.che !== 'salto' || p.a.x < 1000))
  }
  uguale('un tocco vicino a una casella porta a lei', vicinoA(q, per.get(7).x + 10, per.get(7).y + 20, 0, tutte.bloccati), 7)
  controlla('alla tana dello zaino si arriva dal prato', !!percorso(q, 0, 'tana:zaino', tutte.bloccati))
  controlla('e ha la sua insegna sul fondale', D.NODI.some(n => n.id === 'tana:zaino' && Array.isArray(n.freccia)))
  {
    // senza strada (il segnalino su un'isola chiusa) un balzo solo, e si arriva lo stesso
    const v = viaggio(q, 20, 0, chiusure(q, i => i === 0).bloccati)
    uguale('senza strada un balzo solo', v.length, 1)
  }
  uguale('col coniglio la valle ha una tana per l\'altro mondo', q.nodi.filter(n => n.tipo === 'passaggio').map(n => n.id).join(' '), 'tana:zaino')

  /* il cane: tutta la sua strada nella valle, di isola in isola */
  const Qc = qDi.valle.cane
  uguale('col cane la valle non ha la tana per lo zaino: di là non ha niente',
         Qc.nodi.filter(n => n.tipo === 'passaggio').map(n => n.id).join(' '), '')
  uguale('tutta la strada del cane sta nella valle', S.cane.filter(i => !Qc.nodi.some(n => n.id === i)).map(nome).join(' '), '')
  uguale('le isole del cane, in fila: il pascolo, il ghiaccio, le buche, i massi, il prato',
         S.isole.filter(s => s.animale === 'cane').map(s => Qc.isole[s.chiave].isola).join(' '), 'pascolo ghiaccio buche massi passi')
  controlla('il salto per il cane è terra da attraversare', chiusure(Qc, () => false).aperte.has('salto') && !Object.values(Qc.isole).some(d => d.isola === 'salto'))
  {
    // finito il pascolo, il cane va al ghiaccio passando dal salto; il ghiaccio ha il blocco finché è chiuso
    const ultimo = S.isole.find(s => s.chiave === 'pecore-cane').tappe.at(-1)
    const prima = chiusure(Qc, aperture(S, { fatta: i => S.animale[i] === 'coniglio' || S.numero[i] < S.numero[ultimo] }).aperta)
    controlla('col pascolo da finire, il ponte del ghiaccio ha il blocco', prima.blocchi.some(b => b.ponte === 'salto-ghiaccio' && b.isola === 'ghiaccio'))
    const ghiaccio = S.isole.find(s => s.chiave === 'ripeti-cane').tappe[0]
    const dopo = chiusure(Qc, aperture(S, { fatta: i => S.animale[i] === 'coniglio' || S.numero[i] <= S.numero[ultimo] }).aperta)
    uguale('finito il pascolo, al ghiaccio per il salto',
           percorso(Qc, ultimo, ghiaccio, dopo.bloccati).map(t => Qc.archi[t.arco].ponte).filter((p, k, l) => p && p !== l[k - 1]).join(' '),
           'salto-pascolo salto-ghiaccio')
  }
}

/* ══════════ le isole delle carte ══════════ */
{
  const D = DATI.zaino
  const coniglioZ = isoleDi('coniglio', 'zaino')
  uguale('quattro isole del coniglio, nell\'ordine degli scalini', coniglioZ.map(s => s.chiave).join(' '), 'ripeti fino se mondo')
  uguale('quante tappe: 8, 4, 2, 4', coniglioZ.map(s => s.tappe.length).join(' '), '8 4 2 4')
  uguale('del cane nessuna: la sua strada sta tutta nella valle', isoleDi('cane', 'zaino').length, 0)
  controlla('le isole del coniglio hanno il nome per esteso', coniglioZ.every(s => !D.ISOLE[s.chiave].stemma))
  const Q = qDi.zaino.coniglio, tutte = chiusure(Q, () => true)
  // la riva da cui si arriva: libera, con la tana per la valle
  controlla('la riva dell\'arrivo è sempre aperta', D.LIBERE.includes('riva') && chiusure(Q, () => false).aperte.has('riva'))
  controlla('ci sta la tana per la valle, con la sua insegna', Q.nodi.some(n => n.id === 'tana:valle' && n.tipo === 'passaggio' &&
            n.isola === 'riva' && Array.isArray(n.freccia)))
  controlla('dalla tana si arriva a ogni casella',
            Q.nodi.filter(n => n.tipo === 'casella').every(n => !!percorso(Q, 'tana:valle', n.id, tutte.bloccati)))
  uguale('al viale il coniglio va saltando',
         viaggio(Q, 'tana:valle', TAPPE_PICCOLE, tutte.bloccati).map(p => `${p.che}:${p.animale}`).filter((x, k, l) => x !== l[k - 1]).join(' '),
         'salto:coniglio')
  // gli scalini si aprono uno dopo l'altro: il ponte verso quello dopo ha il blocco finché è chiuso
  const fatta = i => i < S.isole.find(s => s.chiave === 'fino').tappe[0]
  uguale('finito il ripeti, con "fino a" appena aperto: i ponti per il se hanno il blocco',
         chiusure(Q, aperture(S, { fatta }).aperta).blocchi.map(b => `${b.ponte}>${b.isola}`).sort().join(' '), 'fino-se>se ripeti-mondo>mondo se-casetta>se')
  uguale('il ripeti aperto, il resto chiuso: i ponti verso il fino a, tutto il mondo e il se hanno il blocco',
         chiusure(Q, aperture(S, { fatta: i => i < 35 }).aperta).blocchi.map(b => `${b.ponte}>${b.isola}`).sort().join(' '),
         'ripeti-fino>fino ripeti-mondo>mondo se-casetta>se')
  controlla('il ponte fra il fino a e la sua isoletta di passaggio non ha mai il blocco',
            !chiusure(Q, () => false).blocchi.some(b => b.ponte === 'fino-nel-passaggio'))
}

riassunto('passo passo — le due valli')
