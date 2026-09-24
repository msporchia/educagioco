/* ═══════════════════════════════════════════════════════════════════
   LA FATTORIA TIPO — UNA FATTORIA GIÀ GIOCATA, DEL LIVELLO CHE SI CHIEDE

   Per guardare la fattoria del livello 30 bisognava arrivarci: comprare
   la terra, sgombrare il bosco, posare venti cose, aspettare il grano.
   `#fattoria=30` alza il livello e basta — il baule si apre, il prato
   resta vuoto — e le cose da provare davvero (una macchina con la fila
   piena, una bottega col suo cliente, la mongolfiera a terra) arrivavano
   solo dopo mezz'ora di gesti fatti a mano.

   Qui la fattoria si **costruisce giocando**: stesso motore, stesse
   porte (`compraPiazzola`, `sgombra`, `posa`, `seminaCampo`, `avvia`), con
   una borsa che non finisce. Non si scrive un salvataggio a mano, perché
   un salvataggio a mano non lo controlla nessuno — un campo sopra un
   recinto, o una merce che il livello non ha ancora aperto, passerebbero
   lisci e si vedrebbero solo a schermo.

   ── DOVE VA OGNI COSA ─────────────────────────────────────────────
   Dove la metterebbe chi gioca con un po' d'ordine, a fasce dall'alto:
     0. il giardino — le decorazioni, in cima, dove non stanno fra i
        piedi a nessuno;
     1. i campi e i silos — la roba cresce accanto a dove si conserva;
     2. le macchine — i mulini per primi, poi nell'ordine in cui
        arrivano;
     3. i recinti — col fienile in testa, che è quello che mangiano;
     4. il paese — il mercato, il vicino, le botteghe, la mongolfiera.
   Attorno a ogni cosa resta **una cella d'erba**: è lì che si cammina,
   e senza, una fattoria piena diventa un muro. La terra è larga tre
   piazzole finché la roba è poca, poi quattro e cinque, e cresce **in
   giù** — il telefono si tiene in verticale.

   ── GIÀ IN MOTO ───────────────────────────────────────────────────
   Una fattoria appena posata non è una fattoria giocata: i campi sono
   a stadi diversi (uno pronto, uno a metà, uno appena seminato), le
   macchine hanno qualcosa da ritirare e qualcosa che lavora, i silos
   sono pieni per metà o più, il banco e le botteghe hanno i loro
   clienti e la mongolfiera è a terra.

   ── IL LIVELLO È QUELLO CHIESTO, NON QUELLO SPESO ─────────────────
   Costruire spende, e spendere fa salire (`spendi`). Il livello si
   rimette **esatto** prima di ogni domanda che dipende da lui — quali
   merci sono aperte, cosa chiede il banco — e di nuovo in fondo: se no
   la dispensa di una fattoria al 20 conterrebbe roba del 24. I premi si
   prendono tutti, fino al livello chiesto: è una fattoria vissuta, non
   una appena salita.

   ── SEMPRE LA STESSA ──────────────────────────────────────────────
   Nessun `Math.random`: le scelte si ricavano con `caso()`, come il
   bosco, e la stessa ora dà la stessa fattoria. È quello che permette a
   `unita/fattoria-tipo` di dire «al 20 c'è la pasticceria» e restare
   vero.

   La usa il cheat `#fattoria-tipo=30` (`Gioco.vue`), che prima mette nel
   cestino il profilo com'era.
   ═══════════════════════════════════════════════════════════════════ */
import { Fattoria, borsaInfinita } from './fattoria.js'
import { CATALOGO, PER_ID, piedeDi, eCampo, eMercato, eMongolfiera, eVicino, macchinaDi }
  from '../dati/catalogo.js'
import { livelloDellaVoce, zonaDi, categoriaDi, sogliaDi } from '../dati/livelli.js'
import { COLTURE, MINUTO, SILI, ricetteDi } from '../dati/coltivazioni.js'
import { ANIMALI } from '../dati/animali.js'
import { CELLE, PRIMA, ULTIMA, caso, chiave } from '../dati/mondo.js'
import { aggiornaIlMercato } from './mercato.js'
import { aggiornaLeBotteghe } from './botteghe.js'
import { aggiornaLaMongolfiera } from './mongolfiera.js'

/* I livelli che si nominano di solito — la documentazione li propone e
   la prova li gioca uno per uno. Il cheat ne accetta qualunque. */
export const LIVELLI_TIPO = [3, 10, 20, 30, 50, 80]
export const LIVELLO_MAX = 99

/* ── quanta roba, a che livello ── */
const larghezza = liv => liv < 10 ? 3 : liv < 30 ? 4 : 5          // in piazzole
const quantiCampi = liv => Math.max(3, Math.min(14, Math.round(3 + liv / 6)))
const quantiMulini = liv => liv >= 30 ? 2 : 1   // tante macchine vogliono farina
const ingrandimenti = liv => Math.min(6, Math.floor(liv / 10))
const quanteDecorazioni = liv => Math.min(24, 2 + Math.floor(liv / 3))
const BESTIE_MAX = 4

/* Il giardino in cima: due righe per le decorazioni e una d'erba sotto,
   prima dei campi. Una decorazione più alta di così va dove trova posto. */
const GIARDINO = 3

/* ── chi va in quale fascia ──
   Si decide guardando il catalogo, non un elenco scritto qui: una
   macchina nuova finisce da sola fra le macchine, un recinto nuovo fra
   i recinti. I recinti sono le macchine coi ritratti (`stati`). */
const LAVORO = CATALOGO.filter(v => zonaDi(v.id) === 'lavoro')
const cosa = v => ({ id: v.id })
const eRecinto = v => !!(v.macchina && v.stati)
const eDelPaese = v => !!(v.posto || eMercato(cosa(v)) || eMongolfiera(cosa(v)) || eVicino(cosa(v)))
const inOrdine = l => l.slice().sort((a, b) => livelloDellaVoce(a) - livelloDellaVoce(b))

/* Una sorte che non tira a caso: la stessa per lo stesso seme. */
function sorteDi(seme) {
  let n = 0
  return () => caso(seme, n++, 97)
}
const semeDi = s => [...String(s)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) | 0, 7)

/* ═══════════ la terra ═══════════ */

/* Il rettangolo di terra posseduta, in celle (la fine esclusa). */
function terraDi(f) {
  let px0 = Infinity, py0 = Infinity, px1 = -Infinity, py1 = -Infinity
  for (const k of Object.keys(f.piazzole)) {
    const [px, py] = k.split(',').map(Number)
    px0 = Math.min(px0, px); py0 = Math.min(py0, py)
    px1 = Math.max(px1, px); py1 = Math.max(py1, py)
  }
  return { px0, px1, py1, x0: px0 * CELLE, y0: py0 * CELLE,
           x1: (px1 + 1) * CELLE, y1: (py1 + 1) * CELLE }
}

/* Il bosco sulla terra propria se ne va tutto: chi gioca da un po' ha
   sgombrato quello che aveva fra i piedi, e il bosco che resta è quello
   del margine, da comprare. */
function sgombraTutto(f) {
  const t = terraDi(f)
  for (let cx = t.x0; cx < t.x1; cx++)
    for (let cy = t.y0; cy < t.y1; cy++)
      while (f.ostacoloSotto(cx, cy)) if (!f.sgombra(cx, cy).ok) break
}

/* Le colonne a destra delle tre piazzole di partenza, fino alla
   larghezza del livello. */
function allarga(f, larga) {
  for (let px = ULTIMA + 1; px < PRIMA + larga; px++)
    for (let py = PRIMA; py <= ULTIMA; py++) f.compraPiazzola(px, py)
  sgombraTutto(f)
}

/* Una fila di piazzole in più, in fondo: è così che la fattoria cresce
   quando una fascia non ci sta. */
function unaFilaInPiu(f) {
  const t = terraDi(f)
  for (let px = t.px0; px <= t.px1; px++) f.compraPiazzola(px, t.py1 + 1)
  sgombraTutto(f)
}

/* ═══════════ posare con l'erba attorno ═══════════ */

/* Dove sta già qualcosa, cella per cella: `f.cosaSotto` darebbe la
   stessa risposta scorrendo tutte le cose a ogni cella, e una fattoria
   al livello 80 ne chiederebbe qualche milione. */
function segna(piene, c) {
  const [w, h] = piedeDi(c)
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) piene.add(chiave(c.x + i, c.y + j))
}

/* Ci sta, e resta una cella d'erba tutt'attorno. La domanda è
   simmetrica: se attorno a questa non c'è niente, questa non è attorno
   a niente. Il bordo della terra resta d'erba anche lui, tranne che per
   le decorazioni (`bordo`). */
function ciSta(f, piene, t, x, y, w, h, bordo) {
  const m = bordo ? 0 : 1
  if (x < t.x0 + m || y < t.y0 + m || x + w > t.x1 - m || y + h > t.y1 - m) return false
  for (let i = -1; i <= w; i++)
    for (let j = -1; j <= h; j++) if (piene.has(chiave(x + i, y + j))) return false
  return f.libera(x, y, w, h)
}

/* La prima posizione buona da `cima` in giù, riga per riga. Se non ce
   n'è, si compra una fila di terra e si riprova — tranne per le
   decorazioni, che vanno dove c'è posto e se non c'è restano nel baule
   di nessuno. */
function piazza(f, piene, id, { cima, bordo = false, compra = true }) {
  const [w, h] = piedeDi({ id, g: 0 })
  const t0 = terraDi(f)
  if (w > t0.x1 - t0.x0 - 2) return null        // più larga della terra: non ci starà mai
  for (let giro = 0; giro < 30; giro++) {
    const t = terraDi(f)
    for (let y = Math.max(cima, t.y0); y + h <= t.y1; y++)
      for (let x = t.x0; x + w <= t.x1; x++) {
        if (!ciSta(f, piene, t, x, y, w, h, bordo)) continue
        const r = f.posa(id, x, y)
        if (!r.ok) continue
        segna(piene, r.cosa)
        return r.cosa
      }
    if (!compra) return null
    unaFilaInPiu(f)
  }
  return null
}

/* Una fascia: le sue cose una accanto all'altra, **a scaffali** — una
   riga finché ci stanno, poi la riga sotto, tutte partite dallo stesso
   punto. Cercando il primo buco libero, un recinto si infilava sotto il
   fienile (che è più basso) e la riga dopo veniva sfalsata di una
   cella: in un prato disegnato a mano si vede subito. Torna la prima
   riga libera sotto la fascia, dove comincia la prossima. */
function fascia(f, piene, ids, cima) {
  let riga = cima, alto = 0, x = null
  for (const id of ids) {
    const [w, h] = piedeDi({ id, g: 0 })
    for (let giro = 0; giro < 200; giro++) {
      const t = terraDi(f)
      if (x === null) x = t.x0 + 1
      if (w > t.x1 - t.x0 - 2) break                     // non ci starà mai
      if (x + w > t.x1 - 1) { riga += alto + 1; alto = 0; x = t.x0 + 1; continue }
      if (riga + h > t.y1 - 1) { unaFilaInPiu(f); continue }
      if (ciSta(f, piene, t, x, riga, w, h, false)) {
        const r = f.posa(id, x, riga)
        if (r.ok) {
          segna(piene, r.cosa)
          x += w + 1; alto = Math.max(alto, h)
          break
        }
      }
      x += 1                                             // qualcosa in mezzo: un passo più in là
    }
  }
  return riga + alto + 1
}

/* ═══════════ cosa c'è, a che livello ═══════════ */

/* Le decorazioni: poche per categoria, le più nuove prima, a giro fra
   le categorie — un giardino fatto di dodici sassi non è un giardino. */
function decorazioni(f, quante) {
  const per = new Map()
  for (const v of CATALOGO) {
    if (zonaDi(v.id) !== 'bello' || v.stagione || v.fiera || !f.sbloccata(v.id)) continue
    const k = categoriaDi(v.id)
    if (!per.has(k)) per.set(k, [])
    per.get(k).push(v)
  }
  for (const l of per.values())
    l.sort((a, b) => livelloDellaVoce(b) - livelloDellaVoce(a) || (a.id < b.id ? -1 : 1))
  const scelte = []
  for (let giro = 0; scelte.length < quante; giro++) {
    let presa = false
    for (const l of per.values())
      if (l[giro] && scelte.length < quante) { scelte.push(l[giro].id); presa = true }
    if (!presa) break
  }
  return scelte
}

/* Il livello rimesso a quello chiesto: vedi in testa, «il livello è
   quello chiesto, non quello speso». */
const rimetti = (f, liv) => { f.speso = Math.max(0, sogliaDi(liv) - (f.guadagnato || 0)) }

/* I silos pieni per metà o più: la roba cruda un po' di più, quella
   lavorata un po' di meno, e ogni merce la sua dose — un granaio con
   tutto a 12 sembra un inventario, non un granaio. Si rabbocca, non si
   toglie: chiamata due volte rimette solo quello che è stato usato. */
function riempi(f, liv) {
  for (const fam of Object.keys(SILI)) {
    if (!f.eCostruito(fam)) continue
    const posti = f.capienzaDi(fam)
    for (const p of f.merciAperte(fam)) {
      const cruda = COLTURE.some(c => c.da === p)
      const quota = (cruda ? 0.55 : 0.35) + 0.35 * caso(semeDi(p), liv, 11)
      const vuole = Math.max(1, Math.min(posti, Math.round(posti * quota)))
      if (f.quantoHo(p) < vuole) f.metti(p, vuole - f.quantoHo(p))
    }
  }
}

/* I campi a tre stadi: pronto, a metà, appena seminato. Il grano c'è
   sempre — è la base di tutta la catena — e poi le colture più nuove,
   che sono quelle che chi arriva a quel livello ha voglia di vedere. */
function semina(f, ora) {
  const aperte = COLTURE.filter(c => f.colturaAperta(c.id))
  const grano = aperte.filter(c => c.id === 'grano')
  const altre = aperte.filter(c => c.id !== 'grano')
    .sort((a, b) => (b.liv || 1) - (a.liv || 1) || (a.id < b.id ? -1 : 1))
  const giro = [...grano, ...altre]
  if (!giro.length) return
  f.cose.filter(c => eCampo(c)).forEach((campo, i) => {
    const c = giro[i % giro.length]
    const stadio = [1.25, 0.55, 0.15][i % 3]
    f.seminaCampo(campo, c.id, ora - Math.round(stadio * c.minuti * MINUTO))
  })
}

/* Le macchine a tre modi, a giro: qualcosa da ritirare e qualcosa che
   lavora · solo al lavoro · solo da ritirare. Il pezzo pronto è finito
   da mezza giornata (niente marcisce), così quello al lavoro parte
   quando si vuole e non quando finisce l'altro: è davvero a metà, e
   non appena partito. Una ricetta si sceglie fra quelle che il livello
   ha aperto e la dispensa sa già fare.

   Le macchine del primo modo hanno **un posto comprato**: una macchina
   nasce con un posto solo (`dati/coda.js`), e senza il secondo il pezzo
   al lavoro non entrerebbe dietro a quello da ritirare. Chi arriva a
   quel livello un posto l'ha comprato di sicuro — il primo costa tre
   minuti di esercizi — e una fila di due è la cosa da guardare. */
const MEZZA_GIORNATA = 12 * 60 * MINUTO
function accendi(f, liv, ora) {
  const buone = m => ricetteDi(macchinaDi(m), liv).filter(r => !f.cheMancaPer(r.id).manca.length)
  const una = (m, k) => { const l = buone(m); return l.length ? l[k % l.length] : null }
  f.cose.filter(c => macchinaDi(c)).forEach((m, i) => {
    const modo = i % 3
    if (modo === 0) f.ingrandisciLaFila(m)
    const r1 = modo !== 1 ? una(m, i) : null
    if (r1) f.avvia(m, r1.id, ora - MEZZA_GIORNATA - r1.minuti * MINUTO)
    const r2 = modo !== 2 ? una(m, i + 1) : null
    if (r2) f.avvia(m, r2.id, ora - Math.round(r2.minuti * MINUTO * 0.4))
  })
}

/* ═══════════ la fattoria ═══════════ */
export function fattoriaTipo(livello, { ora = Date.now() } = {}) {
  const liv = Math.max(1, Math.min(LIVELLO_MAX, Math.floor(Number(livello)) || 1))
  const f = new Fattoria({ borsa: borsaInfinita() })

  /* 1. il livello, e tutto quello che ha aperto, preso */
  rimetti(f, liv)
  f.reclamaTutto()
  const aperto = v => f.sbloccata(v.id) && livelloDellaVoce(v) <= liv
  const di = pred => inOrdine(LAVORO.filter(v => aperto(v) && pred(v))).map(v => v.id)

  /* 2. la terra */
  allarga(f, larghezza(liv))
  const piene = new Set()
  const t0 = terraDi(f)
  let cima = t0.y0 + 1 + GIARDINO

  /* 3. le fasce */
  const campi = Array(quantiCampi(liv)).fill(di(v => eCampo(cosa(v)))[0]).filter(Boolean)
  const silos = di(v => !!v.silo)
  const mulini = Array(quantiMulini(liv)).fill('mulino').filter(id => aperto(PER_ID[id]))
  const fienile = di(v => v.id === 'fienile')
  const macchine = di(v => v.macchina && !eRecinto(v) && !['mulino', 'fienile'].includes(v.id))
  cima = fascia(f, piene, [...campi, ...silos], cima)
  cima = fascia(f, piene, [...mulini, ...macchine], cima)
  cima = fascia(f, piene, [...fienile, ...di(eRecinto)], cima)
  fascia(f, piene, di(eDelPaese), cima)

  /* 4. il giardino in cima, e quello che non ci sta dove c'è posto */
  for (const id of decorazioni(f, quanteDecorazioni(liv)))
    piazza(f, piene, id, { cima: t0.y0, bordo: true, compra: false })

  /* 5. le bestie di casa, nel giardino */
  const t = terraDi(f)
  const casa = { x: Math.floor((t.x0 + t.x1) / 2), y: t0.y0 + 2 }
  /* i bisogni nascono all'ora vera (`bisogni.js`, `nuovo()`): qui si
     rimettono all'ora della fattoria, se no la stessa ora non darebbe
     più la stessa fattoria */
  Object.entries(ANIMALI)
    .filter(([chi]) => f.bestiaAperta(chi))
    .sort(([, a], [, b]) => (a.liv || 1) - (b.liv || 1))
    .slice(0, BESTIE_MAX)
    .forEach(([chi, a]) => {
      const r = f.compraBestia(chi, a.prezzo || 0, '', casa)
      if (r.ok) r.bestia.quando = ora
    })

  /* 6. i silos ingranditi e riempiti, i campi seminati, le macchine al
     lavoro — e la dispensa rabboccata di quello che le macchine hanno
     preso. Il livello si rimette prima di ogni domanda che lo guarda. */
  for (const fam of Object.keys(SILI))
    for (let i = 0; i < ingrandimenti(liv); i++) f.ingrandisci(fam)
  rimetti(f, liv)
  riempi(f, liv)
  semina(f, ora)
  rimetti(f, liv)
  accendi(f, liv, ora)
  rimetti(f, liv)
  riempi(f, liv)

  /* 7. chi chiede: il banco, le botteghe, la mongolfiera */
  const sorte = sorteDi(liv)
  aggiornaIlMercato(f, ora, sorte)
  aggiornaLeBotteghe(f, ora, sorte)
  aggiornaLaMongolfiera(f, ora, sorte)

  rimetti(f, liv)
  return f
}
