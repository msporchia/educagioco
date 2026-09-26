/* ═══════════════════════════════════════════════════════════════════
   QUANTO FA MALE UNA TORRE, DAVVERO

   Il modello di `data/castello.js` stima la forza di una torre con un
   conto sulla carta (`dpsDi`): danno × salve ÷ ricarica, più una
   maggiorazione per chi colpisce a zona. È il numero su cui si
   decidono prezzi e piani — e il figlio di chi l'ha scritto ha detto
   che «certe torri sono molto più forti di altre». Qui lo si misura.

   Si misura **col motore vero** (`motore/castello/`): una torre sola su
   una piazzola vera di una tappa vera, e un'ondata vera che le passa
   davanti — quanti nemici, ogni quanto escono, a che velocità — con la
   vita altissima, così nessuno muore e il danno si conta tutto. Contano
   tutti i bersagli presi: l'area delle bombe e dell'onda magica, i
   rimbalzi della catena, le due frecce della raffica, il veleno e il
   fuoco che continuano dopo il colpo.

   Tre numeri per torre, livello e ramo:

     singolo   il danno al secondo su **un nemico solo**: quello che il
               conto sulla carta crede di misurare
     efficace  il danno al secondo sull'ondata, contando tutti quelli
               presi: è la forza vera. Il secondo è quello in cui la
               torre ha qualcuno a tiro, quindi un raggio più lungo non
               gonfia questo numero — lo gonfia nel prossimo
     valore    quanta vita ferma a un'ondata con nemici **che muoiono**
               (vedi `tenuta`), diviso quella dell'arciere di livello 1:
               dentro c'è tutto — la gittata, il gruppo che si sfoltisce,
               il colpo grosso sprecato su chi era già quasi morto

   Il ghiaccio non fa danno: il suo valore è **la vita in più che
   fermano due arcieri dello stesso livello** con lui in mezzo, rispetto
   ai due arcieri da soli — perché i nemici gelati restano a tiro più a
   lungo (e la brina li rende fragili). Due e non uno: in campo il gelo
   lavora per chi gli sta intorno, e con un vicino solo si misurerebbe
   metà del suo mestiere. Lo si legge nella stessa unità degli altri.

   Accanto c'è la stima del modello (`dpsDi`, in arcieri di livello 1),
   e il rapporto fra valore misurato e stima: sopra 1 il modello
   sottovaluta la torre, sotto la sopravvaluta. E c'è la
   regola del listino (vedi `CARATTERE` in `data/castello.js`): quanto
   **dovrebbe** valere quella torre a quel livello, visto quello che
   costa — l'arciere misurato, per il rapporto dei prezzi, per la resa.
   `val/att` è il numero che conta: vicino a 1 la torre vale il suo
   prezzo, sopra è un affare, sotto è una fregatura.

     npm run dps                         # tutto (un minuto)
     npm run dps -- --livelli 1,5,10     # solo quei livelli
     npm run dps -- --onde 3,9           # su quelle ondate
     npm run dps -- --rapido             # un banco solo: per tarare a mano
     npm run dps -- --torri add,div      # solo quelle torri
   ═══════════════════════════════════════════════════════════════════ */
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

/* ── i banchi di prova ──
   Tre tappe a una strada sola, una per terreno di scuola, e le prime
   sei piazzole di ciascuna — quelle che si occupano per prime, dove si
   combatte davvero. Una strada sola perché con due bocche metà ondata
   passa dall'altra parte, e si misurerebbe la mappa invece della torre. */
const BANCHI = (RAPIDO ? ['La cripta'] : ['La radice', 'La cripta', 'Il corridoio'])
  .map(nome => TAPPE.find(t => t.nome === nome && !(t.forme && t.forme.length > 1)))
  .filter(Boolean)
  /* piazzole in abbondanza: servono le prime sei, più quelle accanto
     per il ghiaccio, e una tappa corta ne dichiara meno. E la durezza
     ferma a 1: muove la velocità dei nemici, e la calcola il modello —
     che è proprio quello che qui si sta mettendo alla prova; se la
     lasciassi a lui, ritoccare una torre cambierebbe il banco */
  .map(t => ({ ...t, posti: 12, durezza: 1 }))
const PIAZZOLE = RAPIDO ? 3 : 6
const PASSO = 1 / 30
const IMMORTALE = 1e9

/* quanti colpi vanno a segno e su quanti bersagli: si ascolta l'impatto
   del colpo invece di rifarne il conto, così il numero è quello del
   motore e non una stima di questo file */
let colpiASegno = 0, bersagliPresi = 0
const impattoVero = Colpo.prototype.impatto
Colpo.prototype.impatto = function (...a) {
  const esito = impattoVero.apply(this, a)
  if (esito.colpiti) { colpiASegno++; bersagliPresi += esito.colpiti }
  return esito
}

/* ── un'ondata che passa davanti a delle torri ──
   `torri` è [{ tipo, lv, ramo, posto }]; chi fa il conto è la prima.
   Torna il danno fatto (tutto, veleno compreso), i secondi in cui la
   prima torre aveva qualcuno a tiro, e quanti colpi e bersagli. */
function passaggio(tappa, torri, onda, quanti = nemiciDiOnda(onda), vita = IMMORTALE) {
  const stato = { cuori: 99, onda: 0, uccisi: 0, torri: 0, energia: 0 }
  const b = new Battaglia({ tappa, misure: MONDO, stato, caso: () => 0.5 })
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

/* ── quanta vita ferma ──
   Il danno contato su nemici immortali dice quanto **potrebbe** fare una
   torre, non quanto ne ferma: quando i nemici muoiono, chi colpisce a
   zona trova il gruppo già sfoltito, il colpo grosso del cecchino si
   spreca su chi aveva due punti di vita, e il ghiaccio — che su un
   immortale non aggiunge niente, perché una torre che ha sempre qualcuno
   a tiro spara già a tutta cadenza — diventa quello che è: tempo in più
   per ammazzare.
   Quindi la misura che decide è questa: la vita più alta per nemico con
   cui l'ondata viene fermata quasi tutta (ne passa al più uno su dieci),
   per bisezione, moltiplicata per quanti sono. È la «vita fermata a
   ondata», nella stessa unità in cui la taratura misura le tappe. */
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

/* la media su tutti i banchi, le piazzole e le ondate */
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

/* `{ tipo: null }` in una lista di torri è una piazzola lasciata vuota:
   serve al ghiaccio, che si misura in mezzo a due arcieri */
const VUOTA = { tipo: null }

/* quanto costa arrivare a quel livello, se fosse la prima torre in campo */
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

/* l'arciere di ogni livello, misurato una volta: è il metro della regola */
const arciereA = {}
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
        /* il ghiaccio: la vita in più che fermano due arcieri pari
           livello con lui in mezzo, rispetto ai due arcieri da soli — e
           la si legge anche come danno al secondo, in proporzione a
           quello di un arciere */
        const coppia = tenuta([{ tipo: 'add', lv }, VUOTA, { tipo: 'add', lv }])
        const insieme = tenuta([{ tipo: 'add', lv }, { tipo: k, lv, ramo }, { tipo: 'add', lv }])
        valore = (insieme - coppia) / tenutaBase
        efficace = misura([{ tipo: 'add', lv }]).dps * valore / arciereA[lv]
      }
      const modello = dpsDi(k, lv, ramo) / dpsDi('add', 1)
      const prezzo = prezzoDi(k, lv)
      /* la regola: l'arciere di quel livello, per quanto costa di più o
         di meno, per la resa che il listino promette */
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

/* ── il riassunto che risponde alla domanda ──
   A parità di livello, quanto vale ogni torre rispetto all'arciere — e
   rispetto a quanto costa. */
for (const lv of LIVELLI) {
  const tronchi = righe.filter(r => r.lv === lv && !r.ramo)
  console.log(`livello ${String(lv).padStart(2)}: ` + tronchi.map(r =>
    `${TORRI[r.k].emoji} vale ${f(r.valore / arciereA[lv], 2)}× l'arciere` +
    ` (per ⚡ ${f((r.valore / r.prezzo) / (arciereA[lv] / prezzoDi('add', lv)), 2)}×)`).join(' · '))
}
