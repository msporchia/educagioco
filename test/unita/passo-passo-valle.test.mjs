/* La valle di Passo passo, senza browser: il modulo è quello del foglietto
   (se no si rilancia lo strumento), una casella per tappa delle isole della
   valle, ogni casella sta su un sentiero e non tocca le altre né i
   cartelli; a ogni punto della campagna ogni casella aperta si raggiunge, i
   ponti verso un'isola chiusa hanno il blocco e non si passano; il
   coniglio resta coniglio sulle sue isole, diventa cane nella tana o sul
   capo di un ponte del pascolo, e un viaggio lungo non dura di più.
   Vedi docs/passo-passo/mappa.md.
   `node test/esegui.mjs passo-passo-valle --niente-build` */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { CAMPAGNA } from '../../src/giochi/passo-passo/dati/campagna.js'
import { STRADE, aperture } from '../../src/giochi/passo-passo/motore/strade.js'
import { FIRMA, ISOLE, NODI, LATO, LARGO, ALTO } from '../../src/giochi/passo-passo/dati/isole-mappa.js'
import { quadroValle, chiusure, percorso, viaggio, vicinoA, nellaValle, TEMPO_MAX }
  from '../../src/giochi/passo-passo/scena/valle.js'
import { ANIMALE } from '../../src/giochi/passo-passo/scena/isole.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const S = STRADE
const FOGLIETTO = new URL('../../strumenti/sprite/sorgenti/passo-passo/isole.json', import.meta.url)
const fg = JSON.parse(readFileSync(FOGLIETTO, 'utf8'))
const q = quadroValle(S)
const per = new Map(q.nodi.map(n => [n.id, n]))

/* ══════════ il modulo è quello del foglietto ══════════ */
uguale('il modulo è fatto dal foglietto di adesso (rilancia python3 strumenti/sprite/isole-passo-passo.py)',
       FIRMA, createHash('sha1').update(readFileSync(FOGLIETTO)).digest('hex').slice(0, 12))
const valle = S.isole.filter(s => nellaValle(s.chiave))
controlla('le isole della valle sono quelle delle strade',
          Object.keys(ISOLE).every(k => S.isole.some(s => s.chiave === k)), Object.keys(ISOLE).join(' '))
for (const s of valle)
  uguale(`${s.chiave}: tante caselle quante tappe (se no si corregge "caselle" nel foglietto)`,
         ISOLE[s.chiave].caselle, s.tappe.length)
const tappe = valle.flatMap(s => s.tappe)
const caselle = q.nodi.filter(n => n.tipo === 'casella')
uguale('una casella per ogni tappa della valle', caselle.map(n => n.id).sort((a, b) => a - b).join(','),
       [...tappe].sort((a, b) => a - b).join(','))
uguale('e il sentiero senza fine', q.nodi.filter(n => n.tipo === 'sentiero').map(n => n.id).join(','), 'senza-fine')
controlla('il posto pronto per il sentiero del cane sta sul pascolo',
          q.nodi.some(n => n.id === 'sentiero-cane' && n.isola === 'pecore-cane'))
controlla('le tappe dello zaino non stanno nella valle', S.isole.filter(s => !nellaValle(s.chiave))
  .every(s => s.tappe.every(i => !per.has(i))))

/* ══════════ le caselle sui sentieri ══════════ */
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
const fuoriStrada = [...caselle, ...q.nodi.filter(n => n.tipo === 'sentiero' || n.tipo === 'riservato')]
  .filter(n => !fg.sentieri.some(s => s.isola === n.isola && !s.erba && distanza(n, s.punti) < 1.5))
uguale('ogni casella sta su un sentiero della sua isola', fuoriStrada.map(n => n.chiave).join(' '), '')
const tonde = q.nodi.filter(n => n.tipo === 'casella' || n.tipo === 'sentiero' || n.tipo === 'riservato')
  .map(n => ({ ...n, mezzo: n.tipo === 'casella' ? LATO / 2 : Math.round(LATO * 1.35) / 2 }))
const toccano = []
tonde.forEach((a, i) => tonde.slice(i + 1).forEach(b => {
  if (Math.abs(a.x - b.x) < a.mezzo + b.mezzo + 8 && Math.abs(a.y - b.y) < a.mezzo + b.mezzo + 8) toccano.push(`${a.chiave}/${b.chiave}`)
}))
uguale('fra due caselle c\'è sempre posto per un dito', toccano.join(' '), '')
controlla('le caselle stanno nel fondale', tonde.every(n => n.x - n.mezzo >= 0 && n.y - n.mezzo >= 0 &&
  n.x + n.mezzo <= LARGO && n.y + n.mezzo <= ALTO))
// un cartello non copre una casella, né l'animale seduto sopra
const NOMI = Object.fromEntries(valle.map(s => [s.chiave, s.animale === 'cane' ? 'Il cane pastore'
  : ({ passi: 'Primi passi', salto: 'Il salto', ghiaccio: 'Il ghiaccio', massi: 'I massi', buche: 'Le buche' })[s.chiave] || 'xxxxxxxxxxxx']))
const coperte = []
for (const [k, d] of Object.entries(ISOLE)) {
  const w = 60 + 8.6 * NOMI[k].length, h = 32
  const [cx, cy] = d.cartello
  for (const n of tonde) {
    const su = n.mezzo + ANIMALE.alto - ANIMALE.piede
    if (Math.abs(n.x - cx) < w / 2 + n.mezzo && cy + h / 2 > n.y - su && cy - h / 2 < n.y + n.mezzo) coperte.push(`${k}/${n.chiave}`)
  }
}
uguale('i cartelli delle isole non coprono le caselle', coperte.join(' '), '')

/* ══════════ a ogni punto della campagna ══════════ */
const tutte = chiusure(q, () => true)
uguale('tutto aperto, nessun blocco', tutte.blocchi.length, 0)
uguale('e nessun arco chiuso', tutte.bloccati.size, 0)
for (const fatte of [0, 1, 4, 5, 9, 10, 14, 15, 16, 19, 20, 23, 24, 30, 35, CAMPAGNA.length]) {
  const fatta = i => i < fatte
  const { aperta } = aperture(S, { fatta })
  const c = chiusure(q, aperta)
  const aperteQui = caselle.filter(n => aperta(n.id))
  const da = aperteQui.find(n => !fatta(n.id)) || aperteQui[0]
  const persi = aperteQui.filter(n => !percorso(q, da.id, n.id, c.bloccati))
  uguale(`fatte ${fatte}: ogni casella aperta si raggiunge`, persi.map(n => n.id).join(' '), '')
  const chiuse = caselle.filter(n => !c.aperte.has(n.isola))
  uguale(`fatte ${fatte}: sulle isole chiuse non si arriva`,
         chiuse.filter(n => percorso(q, da.id, n.id, c.bloccati)).map(n => n.id).join(' '), '')
  // un blocco per ogni ponte fra un'isola aperta e una chiusa, dalla parte della chiusa
  const attesi = Object.entries(q.ponti).filter(([, p]) => c.aperte.has(p.isole[0]) !== c.aperte.has(p.isole[1]))
    .map(([nome, p]) => `${nome}>${c.aperte.has(p.isole[0]) ? p.isole[1] : p.isole[0]}`).sort().join(' ')
  uguale(`fatte ${fatte}: i blocchi stanno sui ponti verso le isole chiuse`,
         c.blocchi.map(b => `${b.ponte}>${b.isola}`).sort().join(' '), attesi)
  const passati = aperteQui.flatMap(n => percorso(q, da.id, n.id, c.bloccati) || []).filter(t => c.bloccati.has(t.arco))
  uguale(`fatte ${fatte}: nessuna strada passa da un arco chiuso`, passati.length, 0)
}
{
  // a metà del ghiaccio: i massi chiusi, e al prato si arriva solo dal ponte lungo
  const { aperta } = aperture(S, { fatta: i => i < 12 })
  const c = chiusure(q, aperta)
  controlla('a metà del ghiaccio il ponte dei massi ha il blocco dalla parte dei massi',
            c.blocchi.some(b => b.ponte === 'prato-massi' && b.isola === 'massi'))
  const via = percorso(q, 12, 0, c.bloccati).map(t => q.archi[t.arco].ponte).filter((p, k, l) => p && p !== l[k - 1])
  uguale('dal ghiaccio al prato: giù dal salto e sul ponte lungo', via.join(' '), 'salto-ghiaccio prato-salto')
}
for (const fatte of [0, 5, 10, 16]) {
  // sul ponte verso un'isola chiusa si va, ma ci si ferma prima del blocco
  const { aperta } = aperture(S, { fatta: i => i < fatte })
  const c = chiusure(q, aperta)
  const dove = new Set(q.nodi.filter(n => percorso(q, 0, n.id, c.bloccati)).map(n => n.id))
  const oltre = []
  for (const b of c.blocchi) {
    const capo = q.archi.filter(e => e.ponte === b.ponte).flatMap(e => [e.a, e.b]).map(id => per.get(id)).find(n => n.isola === b.isola)
    const soglia = Math.hypot(b.x - capo.x, b.y - capo.y)
    for (const n of q.nodi.filter(n => n.ponte === b.ponte && dove.has(n.id)))
      if (Math.hypot(n.x - capo.x, n.y - capo.y) < soglia + 20) oltre.push(`${b.ponte}:${n.id}`)
    if (dove.has(capo.id)) oltre.push(`${b.ponte}:${capo.id}`)
  }
  uguale(`fatte ${fatte}: sui ponti chiusi ci si ferma prima del blocco`, oltre.join(' '), '')
}

/* ══════════ il viaggio ══════════ */
const animali = v => v.filter(p => p.che !== 'salto').map(p => `${p.che}:${p.animale}${p.sbuffo ? '*' : ''}`).join(' ')
const conigliValle = S.coniglio.filter(i => per.has(i))
const cambiano = []
for (let k = 1; k < conigliValle.length; k++) {
  const v = viaggio(q, conigliValle[k - 1], conigliValle[k], tutte.bloccati)
  if (v.some(p => p.che !== 'salto' || p.animale !== 'coniglio')) cambiano.push(conigliValle[k])
}
uguale('sulle isole del coniglio salta sempre il coniglio', cambiano.join(' '), '')
const pascolo = S.isole.find(s => s.chiave === 'pecore-cane')
uguale('dall\'ultima delle buche al primo gregge: per la tana',
       animali(viaggio(q, pascolo.attacco, pascolo.tappe[0], tutte.bloccati)), 'entra:coniglio esce:cane')
uguale('dal prato al pascolo: sul ponte, e sul capo del pascolo una nuvoletta',
       animali(viaggio(q, 0, pascolo.tappe[2], tutte.bloccati)), 'entra:coniglio* esce:cane*')
uguale('e dal pascolo al prato il cane diventa coniglio prima di salire sul ponte',
       animali(viaggio(q, pascolo.tappe[2], 0, tutte.bloccati)), 'entra:cane* esce:coniglio*')
{
  const sbagli = [], lunghi = []
  for (const a of tonde) for (const b of tonde) {
    if (a.id === b.id) continue
    const v = viaggio(q, a.id, b.id, tutte.bloccati)
    const ultimo = v.at(-1)
    if (!ultimo || ultimo.al !== b.id || ultimo.animale !== b.animale) sbagli.push(`${a.chiave}>${b.chiave}`)
    if (v.reduce((s, p) => s + (p.che === 'salto' ? p.dur : 0), 0) > TEMPO_MAX + 0.01) lunghi.push(`${a.chiave}>${b.chiave}`)
  }
  uguale('da ogni casella a ogni altra si arriva, con l\'animale di là', sbagli.slice(0, 6).join(' '), '')
  uguale('e nessun viaggio salta più a lungo di così', lunghi.slice(0, 6).join(' '), '')
}
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
controlla('e il suo nome sta sul fondale', NODI.some(n => n.id === 'tana:zaino' && Array.isArray(n.cartello)))
{
  // senza strada (il segnalino su un'isola chiusa) un balzo solo, e si arriva lo stesso
  const v = viaggio(q, pascolo.tappe[0], 0, chiusure(q, i => i === 0).bloccati)
  uguale('senza strada un balzo solo', v.length, 1)
}

riassunto('passo passo — la valle')
