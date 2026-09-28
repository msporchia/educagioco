// Quanto fa male una torre, davvero: misura col motore vero (non la stima
// sulla carta di `dpsDi`) singolo, efficace e valore (vita fermata con
// nemici che muoiono). Il ghiaccio, che non fa danno, si misura come vita
// in più fermata da due arcieri con lui in mezzo. Vedi docs/castello/torri.md.
//   npm run dps                         # tutto (un minuto)
//   npm run dps -- --livelli 1,5,10     # solo quei livelli
//   npm run dps -- --onde 3,9           # su quelle ondate
//   npm run dps -- --rapido             # un banco solo: per tarare a mano
//   npm run dps -- --torri add,div      # solo quelle torri
import { TAPPE, MONDO, nemiciDiOnda, intervalloDiOnda, velocitaNemico, dpsDi,
         costoNuovaTorre, costoSalita, RAMI_DA, resaDi } from '../src/data/castello.js'
import { TORRI, ramiDi } from '../src/data/ops.js'
import { Battaglia } from '../src/motore/castello/battaglia.js'
import { Torre } from '../src/motore/castello/torre.js'
import { Nemico } from '../src/motore/castello/nemico.js'
import { Colpo } from '../src/motore/castello/colpo.js'

const argv = process.argv.slice(2)
const opzione = (nome, difetto) => {
  const i = argv.indexOf(nome)
  return i >= 0 ? argv[i + 1].split(',').map(Number) : difetto
}
const RAPIDO = argv.includes('--rapido')
const LIVELLI = opzione('--livelli', [1, RAMI_DA, 7, 10])
const ONDE = opzione('--onde', RAPIDO ? [8] : [3, 8, 13])
const iT = argv.indexOf('--torri')
const SOLO = iT >= 0 ? argv[iT + 1].split(',') : null

// Tre tappe a una strada sola (con due bocche metà ondata passerebbe
// dall'altra parte), posti forzati a 12 e durezza a 1 (la calcolerebbe il
// modello, che è proprio quello sotto esame).
const BANCHI = (RAPIDO ? ['La cripta'] : ['La radice', 'La cripta', 'Il corridoio'])
  .map(nome => TAPPE.find(t => t.nome === nome && !(t.forme && t.forme.length > 1)))
  .filter(Boolean)
  .map(t => ({ ...t, posti: 12, durezza: 1 }))
const PIAZZOLE = RAPIDO ? 3 : 6
const PASSO = 1 / 30
const IMMORTALE = 1e9

// si ascolta l'impatto del colpo invece di rifarne il conto: il numero è
// quello del motore, non una stima di questo file
let colpiASegno = 0, bersagliPresi = 0
const impattoVero = Colpo.prototype.impatto
Colpo.prototype.impatto = function (...a) {
  const esito = impattoVero.apply(this, a)
  if (esito.colpiti) { colpiASegno++; bersagliPresi += esito.colpiti }
  return esito
}

// Un'ondata che passa davanti a delle torri (chi fa il conto è la prima):
// il danno fatto, i secondi a tiro, quanti colpi e bersagli.
function passaggio(tappa, torri, onda, quanti = nemiciDiOnda(onda), vita = IMMORTALE) {
  const stato = { cuori: 99, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const b = new Battaglia({ tappa, misure: MONDO, stato })
  b.inizia()
  b.torri = torri.filter(t => t.tipo).map(t => {
    const p = b.postazioni[t.posto]
    return new Torre({ x: p.x, y: p.y, tipo: t.tipo, lv: t.lv, ramo: t.ramo || null })
  })
  const prima = b.torri[0]
  const via = b.percorso.viaN(0)
  const intervallo = intervalloDiOnda(onda)
  const vel = velocitaNemico(tappa, onda) * MONDO.S
  let usciti = 0, prossimo = 0, t = 0, aTiro = 0, danno = 0, passati = 0
  colpiASegno = 0; bersagliPresi = 0
  while (usciti < quanti || b.nemici.length) {
    if (usciti < quanti && (prossimo -= PASSO) <= 0) {
      b.nemici.push(new Nemico({ d: 0, vita, vel, bestia: 'prova' }))
      usciti++; prossimo = intervallo
    }
    const raggio = prima.raggio(MONDO.S)
    if (b.nemici.some(n => Math.hypot(via.puntoA(n.d).x - prima.x, via.puntoA(n.d).y - prima.y) <= raggio))
      aTiro += PASSO
    b.faiFuoco(PASSO)
    b.muoviColpi(PASSO)
    for (const n of b.nemici) {
      const prima = n.vita
      if (n.cammina(PASSO, via.lunghezza)) { danno += n.vitaMax - prima; passati++ }
    }
    b.nemici = b.nemici.filter(n => n.vivo)
    t += PASSO
    if (t > 900) break
  }
  return { danno, aTiro, colpi: colpiASegno, bersagli: bersagliPresi, passati }
}

// Quanta vita ferma: il danno su nemici immortali dice quanto potrebbe
// fare una torre, non quanto ne ferma (col gruppo che si sfoltisce). Si
// cerca per bisezione la vita più alta con cui l'ondata è fermata quasi
// tutta (al più un decimo passa).
const TENUTA = { onda: 8, posti: RAPIDO ? [0, 2] : [0, 2, 4], giri: 12, passano: 0.1 }
function tenuta(torri) {
  let somma = 0, n = 0
  const quanti = nemiciDiOnda(TENUTA.onda)
  for (const tappa of BANCHI)
    for (const posto of TENUTA.posti) {
      let tiene = 1, cede = 200000
      for (let g = 0; g < TENUTA.giri; g++) {
        const v = Math.sqrt(tiene * cede)
        const r = passaggio(tappa, torri.map((t, k) => ({ ...t, posto: posto + k })),
                            TENUTA.onda, quanti, v)
        if (r.passati <= quanti * TENUTA.passano) tiene = v; else cede = v
      }
      somma += tiene * quanti; n++
    }
  return somma / n
}

function misura(torri, { quanti = null } = {}) {
  let danno = 0, aTiro = 0, colpi = 0, bersagli = 0, n = 0
  for (const tappa of BANCHI)
    for (let posto = 0; posto < PIAZZOLE; posto++)
      for (const onda of ONDE) {
        const r = passaggio(tappa, torri.map((t, k) => ({ ...t, posto: posto + k })), onda,
                            quanti ?? nemiciDiOnda(onda))
        danno += r.danno; aTiro += r.aTiro; colpi += r.colpi; bersagli += r.bersagli; n++
      }
  return { danno: danno / n, aTiro: aTiro / n, dps: aTiro ? danno / aTiro : 0,
           bersagli: colpi ? bersagli / colpi : 0 }
}

const VUOTA = { tipo: null } // una piazzola vuota: serve al ghiaccio in mezzo a due arcieri

function prezzoDi(k, lv) {
  let e = costoNuovaTorre(0, k)
  for (let l = 1; l < lv; l++) e += costoSalita(l, k)
  return e
}

const f = (x, c = 1) => x.toFixed(c)
const riferimento = misura([{ tipo: 'add', lv: 1 }])
const tenutaBase = tenuta([{ tipo: 'add', lv: 1 }])

console.log(`banchi: ${BANCHI.map(t => t.nome).join(', ')} · ${PIAZZOLE} piazzole ciascuno · ` +
            `ondate ${ONDE.join(', ')}`)
console.log(`unità del valore: l'arciere di livello 1, che ferma ${f(tenutaBase, 0)} di vita ` +
            `all'ondata ${TENUTA.onda}\n`)
console.log('torre         ramo       lv | singolo efficace bersagli | modello  mis/mod |' +
            ' valore atteso val/att | prezzo')

const arciereA = {} // l'arciere di ogni livello, misurato una volta: il metro della regola
for (const lv of LIVELLI) arciereA[lv] = tenuta([{ tipo: 'add', lv }]) / tenutaBase

const righe = []
for (const [k, T] of Object.entries(TORRI)) {
  if (SOLO && !SOLO.includes(k)) continue
  const rami = [null, ...ramiDi(k).map(r => r.id)]
  for (const ramo of rami) {
    for (const lv of LIVELLI) {
      if (ramo && lv < RAMI_DA) continue
      let singolo = 0, efficace = 0, bersagli = 0, valore = 0
      if (T.danno) {
        const solo = misura([{ tipo: k, lv, ramo }], { quanti: 1 })
        const onda = misura([{ tipo: k, lv, ramo }])
        singolo = solo.dps; efficace = onda.dps; bersagli = onda.bersagli
        valore = tenuta([{ tipo: k, lv, ramo }]) / tenutaBase
      } else {
        const coppia = tenuta([{ tipo: 'add', lv }, VUOTA, { tipo: 'add', lv }])
        const insieme = tenuta([{ tipo: 'add', lv }, { tipo: k, lv, ramo }, { tipo: 'add', lv }])
        valore = (insieme - coppia) / tenutaBase
        efficace = misura([{ tipo: 'add', lv }]).dps * valore / arciereA[lv]
      }
      const modello = dpsDi(k, lv, ramo) / dpsDi('add', 1)
      const prezzo = prezzoDi(k, lv)
      const atteso = arciereA[lv] * (prezzo / prezzoDi('add', lv)) * resaDi(k)
      righe.push({ k, ramo, lv, singolo, efficace, bersagli, modello, valore, atteso, prezzo })
      console.log(`${(T.emoji + ' ' + T.nome).padEnd(13)} ${(ramo || '—').padEnd(9)} ${String(lv).padStart(3)} |` +
                  ` ${f(singolo).padStart(7)} ${f(efficace).padStart(8)} ${f(bersagli, 2).padStart(8)} |` +
                  ` ${f(modello, 2).padStart(7)} ${modello ? f(valore / modello, 2).padStart(8) : '       —'} |` +
                  ` ${f(valore, 2).padStart(6)} ${f(atteso, 2).padStart(6)} ${f(valore / atteso, 2).padStart(7)} |` +
                  ` ${String(Math.round(prezzo)).padStart(6)}`)
    }
  }
  console.log()
}

for (const lv of LIVELLI) {
  const tronchi = righe.filter(r => r.lv === lv && !r.ramo)
  console.log(`livello ${String(lv).padStart(2)}: ` + tronchi.map(r =>
    `${TORRI[r.k].emoji} vale ${f(r.valore / arciereA[lv], 2)}× l'arciere` +
    ` (per ⚡ ${f((r.valore / r.prezzo) / (arciereA[lv] / prezzoDi('add', lv)), 2)}×)`).join(' · '))
}
