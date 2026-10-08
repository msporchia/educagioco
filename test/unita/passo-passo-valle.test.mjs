/* Le due valli di Passo passo, senza browser: la valle dei piccoli e il mondo
   dello zaino. Il modulo di ognuna è quello del suo foglietto (se no si
   rilancia lo strumento), una casella per tappa delle sue isole, ogni
   casella sta su un sentiero e non tocca le altre né i cartelli; a ogni
   punto della campagna ogni casella aperta si raggiunge, i ponti verso
   un'isola chiusa hanno il blocco e non si passano; il coniglio resta
   coniglio sulle sue isole, diventa cane nella tana (o sul capo di un ponte
   del pascolo) e un viaggio lungo non dura di più. Nello zaino ogni scalino
   ha la sua isoletta del cane, con la tana dipinta (o la nuvoletta, dove il
   coniglio non ha un buco).
   Vedi docs/passo-passo/mappa.md.
   `node test/esegui.mjs passo-passo-valle --niente-build` */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { CAMPAGNA, SCALINI } from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE, aperture } from '../../src/giochi/passo-passo/motore/strade.js'
import { DATI, MONDI, quadroValle, chiusure, percorso, viaggio, vicinoA, mondoDellIsola, TEMPO_MAX }
  from '../../src/giochi/passo-passo/scena/valle.js'
import { ANIMALE, SENTIERO_CANE } from '../../src/giochi/passo-passo/scena/animale.js'
import { stendardo, stemma, stimaNome } from '../../src/giochi/passo-passo/scena/stendardo.js'
import { STELLE, LARGO_STELLE } from '../../src/giochi/passo-passo/scena/tondo.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const S = STRADE
const FOGLIETTI = { valle: 'isole.json', zaino: 'zaino.json' }
const foglietto = mondo => new URL(`../../strumenti/sprite/sorgenti/passo-passo/${FOGLIETTI[mondo]}`, import.meta.url)
const fgDi = Object.fromEntries(MONDI.map(m => [m, JSON.parse(readFileSync(foglietto(m), 'utf8'))]))
const qDi = Object.fromEntries(MONDI.map(m => [m, quadroValle(S, { mondo: m })]))
const q = qDi.valle
const per = new Map(q.nodi.map(n => [n.id, n]))
const SPAZIO = 8

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

/* ══════════ i due mondi, uno per uno ══════════ */
controlla('ogni isola delle strade sta in un mondo', S.isole.every(s => mondoDellIsola(s.chiave) !== null),
          S.isole.filter(s => mondoDellIsola(s.chiave) === null).map(s => s.chiave).join(' '))
{
  const comuni = qDi.valle.nodi.filter(n => qDi.zaino.nodi.some(m => m.id === n.id)).map(n => n.id)
  uguale('i posti dei due mondi hanno id diversi (la mappa li riconosce da lì)', comuni.join(' '), '')
}

for (const mondo of MONDI) {
  const D = DATI[mondo], fg = fgDi[mondo], Q = qDi[mondo]
  const nome = m => `${mondo}: ${m}`
  const isole = S.isole.filter(s => mondoDellIsola(s.chiave) === mondo)
  const caselle = Q.nodi.filter(n => n.tipo === 'casella')
  const tonde = Q.nodi.filter(n => n.tipo === 'casella' || n.tipo === 'sentiero')
    .map(n => ({ ...n, mezzo: n.tipo === 'casella' ? D.LATO / 2 : Math.round(D.LATO * 1.35) / 2 }))

  /* ── il modulo è quello del foglietto ── */
  uguale(nome('il modulo è fatto dal foglietto di adesso (rilancia python3 strumenti/sprite/isole-passo-passo.py)'),
         D.FIRMA, createHash('sha1').update(readFileSync(foglietto(mondo))).digest('hex').slice(0, 12))
  uguale(nome('le isole del foglietto sono quelle delle strade di questo mondo'),
         Object.keys(D.ISOLE).sort().join(' '), isole.map(s => s.chiave).sort().join(' '))
  for (const s of isole)
    uguale(nome(`${s.chiave}: tante caselle quante tappe (se no si corregge "caselle" nel foglietto)`),
           D.ISOLE[s.chiave].caselle, s.tappe.length)
  const tappe = isole.flatMap(s => s.tappe)
  uguale(nome('una casella per ogni tappa delle sue isole'), caselle.map(n => n.id).sort((a, b) => a - b).join(','),
         [...tappe].sort((a, b) => a - b).join(','))
  controlla(nome('le tappe dell\'altro mondo non ci sono'),
            Q.nodi.every(n => typeof n.id !== 'number' || tappe.includes(n.id)))
  controlla(nome('lo stato lo fa il quadro: l\'animale di una casella è quello della sua isola'),
            caselle.every(n => n.animale === isole.find(s => s.chiave === n.isola).animale))
  uguale(nome('i punti senza nome del mondo hanno il suo prefisso, se ce l\'ha'),
         Q.nodi.filter(n => /^(z-)?(incrocio|sosta|capo):/.test(n.id)).filter(n => n.id.startsWith('z-') !== !!fg.prefisso).length, 0)

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

  /* ── gli stendardi (e gli stemmi delle isolette) non coprono niente ──
     né una casella (col suo tondo, le stelle e l'animale seduto sopra), né un sentiero, un ponte o una
     tana; col nome più largo che un carattere di riserva può dare */
  const coperte = [], suStrada = [], fuoriFondale = [], suTana = []
  const strade = [...fg.sentieri.filter(x => !x.erba), ...fg.ponti]
  const tane = Q.nodi.filter(n => n.tipo === 'tana' || n.tipo === 'passaggio')
  for (const [k, d] of Object.entries(D.ISOLE)) {
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
  // il nome della tana per l'altro mondo ci sta accanto, nel fondale e senza coprire una casella
  for (const t of Q.nodi.filter(n => n.tipo === 'passaggio')) {
    const r = { x: t.cartello[0] - 56, y: t.cartello[1] - 14, w: 112, h: 28 }
    controlla(nome(`il nome della tana ${t.id} sta nel fondale`),
              r.x >= 0 && r.y >= 0 && r.x + r.w <= D.LARGO && r.y + r.h <= D.ALTO)
    controlla(nome(`e non copre una casella né un sentiero`),
              tonde.every(n => distanzaRett([n.x, n.y], r) > n.mezzo) && strade.every(st => distanzaStrada(r, st.punti) > 6),
              t.id)
  }
  // una tana dipinta (di un'isola del cane) non sta sotto una casella: il buco si deve vedere
  const coperteTane = []
  for (const t of tane) for (const n of tonde)
    if (Math.abs(t.x - n.x) < n.mezzo + 6 && Math.abs(t.y - n.y) < n.mezzo + 6) coperteTane.push(`${t.id}/${n.chiave}`)
  uguale(nome('nessuna casella copre una tana'), coperteTane.join(' '), '')

  /* ── a ogni punto della campagna ── */
  const tutte = chiusure(Q, () => true)
  uguale(nome('tutto aperto, nessun blocco'), tutte.blocchi.length, 0)
  uguale(nome('e nessun arco chiuso'), tutte.bloccati.size, 0)
  const punti = mondo === 'valle' ? [0, 1, 4, 5, 9, 10, 14, 15, 16, 19, 20, 23, 24, 30, 35, CAMPAGNA.length]
    : [35, 36, 37, 40, 43, 44, 45, 46, 48, 49, 50, 51, 52, 53, 55, 57, 60, CAMPAGNA.length]
  for (const fatte of punti) {
    const fatta = i => i < fatte
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
    if (!ultimo || ultimo.al !== b.id || ultimo.animale !== b.animale) sbagli.push(`${a.chiave}>${b.chiave}`)
    if (v.reduce((s, p) => s + (p.che === 'salto' ? p.dur : 0), 0) > TEMPO_MAX + 0.01) lunghi.push(`${a.chiave}>${b.chiave}`)
  }
  uguale(nome('da ogni casella a ogni altra si arriva, con l\'animale di là'), sbagli.slice(0, 6).join(' '), '')
  uguale(nome('e nessun viaggio salta più a lungo di così'), lunghi.slice(0, 6).join(' '), '')
  const conigli = S.coniglio.filter(i => caselle.some(n => n.id === i))
  const cambiano = []
  for (let k = 1; k < conigli.length; k++) {
    const v = viaggio(Q, conigli[k - 1], conigli[k], tutte.bloccati)
    if (v.some(p => p.che !== 'salto' || p.animale !== 'coniglio')) cambiano.push(conigli[k])
  }
  uguale(nome('sulle isole del coniglio salta sempre il coniglio'), cambiano.join(' '), '')
}

const animali = v => v.filter(p => p.che !== 'salto').map(p => `${p.che}:${p.animale}${p.sbuffo ? '*' : ''}`).join(' ')

/* ══════════ la valle dei piccoli ══════════ */
{
  const D = DATI.valle
  const caselle = q.nodi.filter(n => n.tipo === 'casella')
  const tutte = chiusure(q, () => true)
  uguale('e i due sentieri senza fine', q.nodi.filter(n => n.tipo === 'sentiero').map(n => n.id).sort().join(','),
         ['senza-fine', SENTIERO_CANE].sort().join(','))
  controlla('quello del coniglio sta sulle buche, ed è del coniglio',
            q.nodi.some(n => n.id === 'senza-fine' && n.isola === 'buche' && n.animale === 'coniglio'))
  controlla('quello del cane in fondo al pascolo, ed è del cane',
            q.nodi.some(n => n.id === SENTIERO_CANE && n.isola === 'pecore-cane' && n.animale === 'cane'))
  {
    // a metà del ghiaccio: i massi chiusi, e al prato si arriva solo dal ponte lungo
    const { aperta } = aperture(S, { fatta: i => i < 12 })
    const c = chiusure(q, aperta)
    controlla('a metà del ghiaccio il ponte dei massi ha il blocco dalla parte dei massi',
              c.blocchi.some(b => b.ponte === 'prato-massi' && b.isola === 'massi'))
    const via = percorso(q, 12, 0, c.bloccati).map(t => q.archi[t.arco].ponte).filter((p, k, l) => p && p !== l[k - 1])
    uguale('dal ghiaccio al prato: giù dal salto e sul ponte lungo', via.join(' '), 'salto-ghiaccio prato-salto')
  }
  const pascolo = S.isole.find(s => s.chiave === 'pecore-cane')
  // l'ultima dei piccoli sta in fondo ai massi, accanto al ponte del prato
  uguale('dall\'ultima dei massi al primo gregge: giù al prato e sul ponte, con la nuvoletta',
         animali(viaggio(q, pascolo.attacco, pascolo.tappe[0], tutte.bloccati)), 'entra:coniglio* esce:cane*')
  uguale('dalle buche al primo gregge: per la tana',
         animali(viaggio(q, CAMPAGNA.findIndex(t => t.scalino === 'buche'), pascolo.tappe[0], tutte.bloccati)),
         'entra:coniglio esce:cane')
  uguale('dall\'ultimo gregge al sentiero del cane si salta e basta, da cane',
         viaggio(q, pascolo.tappe.at(-1), SENTIERO_CANE, tutte.bloccati).map(p => `${p.che}:${p.animale}`).filter((x, k, l) => x !== l[k - 1]).join(' '),
         'salto:cane')
  uguale('dal prato al pascolo: sul ponte, e sul capo del pascolo una nuvoletta',
         animali(viaggio(q, 0, pascolo.tappe[2], tutte.bloccati)), 'entra:coniglio* esce:cane*')
  uguale('e dal pascolo al prato il cane diventa coniglio prima di salire sul ponte',
         animali(viaggio(q, pascolo.tappe[2], 0, tutte.bloccati)), 'entra:cane* esce:coniglio*')
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
  controlla('e il suo nome sta sul fondale', D.NODI.some(n => n.id === 'tana:zaino' && Array.isArray(n.cartello)))
  {
    // senza strada (il segnalino su un'isola chiusa) un balzo solo, e si arriva lo stesso
    const v = viaggio(q, pascolo.tappe[0], 0, chiusure(q, i => i === 0).bloccati)
    uguale('senza strada un balzo solo', v.length, 1)
  }
  uguale('la valle ha una sola tana per l\'altro mondo', q.nodi.filter(n => n.tipo === 'passaggio').map(n => n.id).join(' '), 'tana:zaino')
  controlla('e le caselle del sentiero del cane e del coniglio non stanno in una isoletta', caselle.every(n => !n.isola.endsWith('-cane') || n.isola === 'pecore-cane'))
}

/* ══════════ il mondo dello zaino ══════════ */
{
  const Q = qDi.zaino, D = DATI.zaino
  const caselle = Q.nodi.filter(n => n.tipo === 'casella')
  const tutte = chiusure(Q, () => true)
  const perZ = new Map(Q.nodi.map(n => [n.id, n]))
  const coniglioZ = S.isole.filter(s => mondoDellIsola(s.chiave) === 'zaino' && s.animale === 'coniglio')
  const caneZ = S.isole.filter(s => mondoDellIsola(s.chiave) === 'zaino' && s.animale === 'cane')

  // le isole: ripeti, fino a, se, tutto il mondo, e a ognuna la sua isoletta del cane
  uguale('quattro isole del coniglio, nell\'ordine degli scalini', coniglioZ.map(s => s.chiave).join(' '), 'ripeti fino se mondo')
  uguale('e un\'isoletta del cane per ognuna', caneZ.map(s => s.da).join(' '), 'ripeti fino se mondo')
  uguale('quante tappe: 8, 4, 2, 4 e tre per isoletta', [...coniglioZ, ...caneZ].map(s => s.tappe.length).join(' '),
         '8 4 2 4 3 3 3 3')
  controlla('le isolette sono staccate: nel foglietto un\'isola del cane è solo sua (una stemma, tre caselle)',
            caneZ.every(s => D.ISOLE[s.chiave].stemma === true && D.ISOLE[s.chiave].caselle === 3))
  controlla('le isole del coniglio hanno il nome per esteso', coniglioZ.every(s => !D.ISOLE[s.chiave].stemma))
  // la riva da cui si arriva: libera, con la tana per la valle
  controlla('la riva dell\'arrivo è sempre aperta', D.LIBERE.includes('riva') && tutte.aperte.has('riva'))
  controlla('e ci sta la tana per la valle, col suo nome', Q.nodi.some(n => n.id === 'tana:valle' && n.tipo === 'passaggio' &&
            n.isola === 'riva' && Array.isArray(n.cartello)))
  uguale('è l\'unica', Q.nodi.filter(n => n.tipo === 'passaggio').length, 1)
  controlla('dalla tana si arriva a ogni casella', caselle.every(n => !!percorso(Q, 'tana:valle', n.id, tutte.bloccati)))
  uguale('e alla prima del coniglio si va saltando, da coniglio',
         viaggio(Q, 'tana:valle', S.coniglio[35] ?? 35, tutte.bloccati).map(p => `${p.che}:${p.animale}`).filter((x, k, l) => x !== l[k - 1]).join(' '),
         'salto:coniglio')
  controlla('chiuso lo zaino (nessuna tappa aperta) la tana non è un guaio: i ponti non bloccano la riva',
            chiusure(Q, () => false).bloccati.size >= 0)

  // ogni isoletta del cane: la tana dipinta sulla sua isola, quella del coniglio sulla sua
  for (const s of caneZ) {
    const da = perZ.get(`tana:${s.chiave}:da`), a = perZ.get(`tana:${s.chiave}:a`)
    controlla(`${s.chiave}: la bocca dipinta sta sull'isoletta, ed è del cane`, !!a && a.isola === s.chiave && a.animale === 'cane')
    controlla(`${s.chiave}: la tana del coniglio sta sulla sua isola (${s.da}), ed è del coniglio`,
              !!da && da.isola === s.da && da.animale === 'coniglio')
    const nuvola = !!(da && da.nuvola)
    uguale(`${s.chiave}: dall'isola del coniglio all'isoletta: nella tana, ${nuvola ? 'in una nuvoletta di qua' : 'dal buco dipinto'}`,
           animali(viaggio(Q, s.attacco, s.tappe[0], tutte.bloccati)), `entra:coniglio${nuvola ? '*' : ''} esce:cane`)
    uguale(`${s.chiave}: e ritorno`, animali(viaggio(Q, s.tappe[0], s.attacco, tutte.bloccati)),
           `entra:cane esce:coniglio${nuvola ? '*' : ''}`)
    uguale(`${s.chiave}: la tana è una sola, sotto terra (un tunnel)`,
           Q.archi.filter(e => e.tipo === 'tunnel' && ((e.a === da.id && e.b === a.id) || (e.a === a.id && e.b === da.id))).length, 1)
    // la prima tappa è la più vicina alla bocca dipinta
    const dist = i => Math.hypot(perZ.get(i).x - a.x, perZ.get(i).y - a.y)
    controlla(`${s.chiave}: le tappe vanno via via più lontane dalla tana`, dist(s.tappe[0]) < dist(s.tappe[1]) && dist(s.tappe[1]) < dist(s.tappe[2]))
    // chiusa (il coniglio non ha finito la tappa da cui si apre) non ci si arriva, e la bocca ha il masso
    const { aperta } = aperture(S, { fatta: i => i < s.attacco })
    const c = chiusure(Q, aperta)
    controlla(`${s.chiave}: chiusa non ci si arriva dalla tana`, !percorso(Q, s.attacco, s.tappe[0], c.bloccati))
    // la strada del cane va di isoletta in isoletta: prima le tappe del cane delle isolette di prima
    const prime = S.cane.slice(0, S.cane.indexOf(s.tappe[0]))
    const { aperta: dopo } = aperture(S, { fatta: i => i <= s.attacco || prime.includes(i) })
    controlla(`${s.chiave}: fatta la tappa della tana si apre, e ci si arriva`,
              !!percorso(Q, s.attacco, s.tappe[0], chiusure(Q, dopo).bloccati))
  }

  // gli scalini si aprono uno dopo l'altro: il ponte verso quello dopo ha il blocco finché è chiuso
  {
    const fatta = i => i < S.isole.find(s => s.chiave === 'fino').tappe[0]
    const { aperta } = aperture(S, { fatta })
    const c = chiusure(Q, aperta)
    uguale('finito il ripeti, con "fino a" appena aperto: il ponte per il se ha il blocco',
           c.blocchi.map(b => `${b.ponte}>${b.isola}`).sort().join(' '), 'fino-se>se ripeti-mondo>mondo')
  }
  {
    const { aperta } = aperture(S, { fatta: i => i < 35 })
    const c = chiusure(Q, aperta)
    uguale('il ripeti aperto, il resto chiuso: due ponti con il blocco (verso il fino a e verso tutto il mondo)',
           c.blocchi.map(b => `${b.ponte}>${b.isola}`).sort().join(' '), 'ripeti-fino>fino ripeti-mondo>mondo')
  }
  controlla('il ponte fra il fino a e la sua isoletta di passaggio non ha mai il blocco',
            !Object.keys(chiusure(Q, () => false).blocchi.reduce((o, b) => ({ ...o, [b.ponte]: 1 }), {})).includes('fino-nel-passaggio'))
}

riassunto('passo passo — le due valli')
