/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA DI UN LIVELLO DEL GENERALE

   Uno solo, per tutti. Gli si passa **un livello** e lo mette alla
   prova giocandolo davvero col motore (`src/motore/generale.js`), senza
   sapere quale sia: niente script usa-e-getta, niente test scritto a
   mano per ogni scenario. Chi scrive uno scenario nuovo non scrive
   anche il suo test — lo eredita.

       import { provaLivello } from '../aiuto/livello.mjs'
       provaLivello(LIVELLO, 'fondi-1')

   ── I CONTROLLI STANDARD (girano su tutti, sempre) ─────────────────
     · la griglia è rettangolare e il bordo è chiuso;
     · unità, oggetti, posti e porte stanno su pavimento, in **ogni**
       scena (le varianti spostano le cose: una toppa storta si vede
       solo giocando quella scena);
     · ogni fazione dice chi la governa, e una è del giocatore;
     · ogni soluzione dichiarata NON fragile vince su **tutte** le scene;
     · una soluzione marcata `fragile` ne vince almeno una e ne perde
       almeno una (se vincesse sempre non dimostrerebbe niente, se non
       vincesse mai non sarebbe una tentazione);
     · una soluzione marcata `lunga` vince su tutte le scene ma costa
       più del par — è la strada lunga, quella che il par non premia e
       non vieta: da lì un ordine si può togliere, ed è il solo caso in
       cui è ammesso;
     · il piano vuoto non vince **mai**;
     · togliendo un ordine qualsiasi da una soluzione non fragile e non
       `lunga`, quel piano non è più una soluzione — cioè perde almeno
       una scena;
     · il par è raggiungibile (una soluzione ci sta dentro) e non è largo
       di manica (nessuna soluzione buona è più corta del par);
     · nessun ordine delle soluzioni viene rifiutato da `guaiDi`;
     · la **scenografia**, se c'è, è soltanto disegno: ogni voce nomina
       un pittore che esiste, sta su pavimento, e non siede sopra
       niente che sia in gioco — perché una cassa che si può prendere e
       una che è solo dipinta devono essere due cose distinguibili a
       occhio, e la seconda non deve nemmeno sfiorare la prima;
     · giocare non sporca i dati del livello.

   ── LE PROVE PARTICOLARI, DICHIARATE NELLO SCENARIO ────────────────
   Quello che un livello ha di suo non si scrive qui: si scrive **nel
   livello**, in un campo `verifiche`, e questo file lo esegue. Così la
   verifica e la scena cambiano insieme, e si sa sempre cosa è stato
   provato e cosa no.

   (Il campo si chiama `verifiche` e non `prove` perché `prove` esiste
   già nei livelli e vuol dire un'altra cosa: quante scene si giocano.)

       verifiche: {
         nonInFila: true,
         serveOgnuno: true,
         ordineConta: [['prendi chiavetta', 'apri cancelletto']],
         ordineLibero: true,
         senza: ['chiavetta'],
       }

     nonInFila: true
         Non si vince mandando tutti avanti a fare le cose una dietro
         l'altra. Si srotolano i «quando senti» (i loro ordini partono
         subito), i due rami di ogni condizione si mettono in fila (cioè
         si fa tutto, senza scegliere) e **spariscono le attese**
         (`aspetta`, `aspetta di vedere`): cioè si toglie di mezzo tutta
         la sincronizzazione e ognuno fa la sua fila da capo. Quel piano
         deve perdere almeno una scena. Vuole almeno un `quando`, una
         guardia o un'attesa in una soluzione: se non c'è niente da
         srotolare la regola non morde, e lo dice.

         Le attese sono entrate qui dopo il terzo capitolo di Bibi, dove
         la sincronizzazione non è fatta di segnali ma di due che si
         guardano: «Rosa aspetta di vedere il cane, Bibi aspetta di
         vedere Rosa». Se `nonInFila` non le togliesse, direbbe che lì
         non c'è niente da sincronizzare — e sarebbe falso.

     serveOgnuno: true
         Con una sola delle unità non si vince. Per ogni unità del
         giocatore si tiene la sua fila e si azzerano quelle degli
         altri: ogni volta si deve perdere almeno una scena. Vuole
         almeno due unità comandate dal giocatore.

     ordineConta: [[a, b], …]
         Quei due ordini non si possono scambiare. Ogni ordine si scrive
         come lo si legge — `'verbo complemento'`, per esempio
         `'apri cancelletto'` — e la coppia si cerca nelle soluzioni
         dichiarate: dove ci sono tutti e due nella stessa fila, si
         scambiano di posto e quel piano deve perdere almeno una scena.
         Una coppia che non si trova in nessuna soluzione è un guasto:
         vuol dire che la regola parla di un piano che non c'è più.

     ordineLibero: true
         Il contrario, e va detto quando è vero: qui l'ordine dei gesti
         NON conta. Si scambiano a due a due tutti gli ordini di ogni
         soluzione buona, e si deve vincere lo stesso su tutte le scene.

     senza: ['chiavetta', 'bibi']
         Senza quella cosa non si vince. Se è un oggetto o una porta, si
         tolgono dalle soluzioni tutti gli ordini che la nominano; se è
         un'unità del giocatore, si azzera la sua fila. Il piano che
         resta deve perdere almeno una scena.

   Un livello che non dichiara niente gira coi soli controlli standard.
   Una chiave che nessuno conosce è un guasto, non un commento: un
   `verifiche` scritto male non deve passare inosservato.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla } from './verifica.mjs'
import { creaMondo, esegui, guaiDi, contaOrdini, pianoVuoto, mieUnita, VERBI,
         eCondizione, ramoDi } from '../../src/motore/generale.js'
/* i nomi dei pittori: un disegno che non esiste è un buco nella mappa —
   la scenografia sparisce, e un'unità col `chi` sbagliato non si vede */
import { OGGETTI } from '../../src/grafica/oggetti/indice.js'
import { PERSONAGGI } from '../../src/grafica/personaggi/indice.js'

/* ── attrezzi ───────────────────────────────────────────────────── */
const scritta = x => JSON.stringify(x)
const clona = x => JSON.parse(JSON.stringify(x))
const scene = liv => (liv.varianti || []).map((_, i) => i)
const soluzioni = liv => liv.soluzioni || []
/* quelle che devono vincere sempre */
const buone = liv => soluzioni(liv).filter(s => !s.fragile)
/* quelle che devono anche essere STRETTE: nessun ordine di troppo. La
   strada lunga (`lunga: true`) vince uguale e costa di più — è dichiarata
   apposta per far vedere che il par premia senza vietare — e da lì un
   ordine si può togliere. */
const strette = liv => soluzioni(liv).filter(s => !s.fragile && !s.lunga)
/* come si nomina una voce di un piano: un ordine è «verbo complemento»,
   un blocco condizione è «condizione + la sua domanda» */
const chiaveOrdine = o => eCondizione(o)
  ? `condizione ${(o.cond && o.cond.cond) || ''} ${(o.cond && o.cond.complemento) || ''}`.trim()
  : `${o && o.verbo} ${(o && o.complemento) || ''}`.trim()

/* una partita: mondo nuovo ogni volta, e un'eccezione non porta via il
   resto del banco */
function gioca (liv, iv, piano) {
  try {
    const e = esegui(creaMondo(liv, iv), clona(piano))
    return { vinto: e.vinto === true, motivo: e.motivo, rifiutati: e.rifiutati || [] }
  } catch (err) {
    return { vinto: false, esploso: (err && err.stack || String(err)).split('\n')[0],
             motivo: 'esplosa', rifiutati: [] }
  }
}
const tutte = (liv, piano) => scene(liv).every(iv => gioca(liv, iv, piano).vinto)
const esiti = (liv, piano) => scene(liv).map(iv => gioca(liv, iv, piano))
const detto = e => e.map((r, k) => `${k + 1}:${r.esploso ? 'esplode ' + r.esploso
  : r.vinto ? 'vinta' : 'persa (' + r.motivo + ')'}`).join(' · ')

const RAMI = ['vero', 'falso']
/* ── ogni voce di un piano, anche quelle annidate ──
   La «via» è il cammino per ritrovarla: [unità, indice] e poi 'allora'
   per entrare in un «quando senti», 'vero'/'falso' per entrare in un ramo
   di un blocco condizione. */
function voci (piano) {
  const out = []
  const giro = (lista, via) => (lista || []).forEach((o, i) => {
    const q = [...via, i]
    out.push({ via: q, ordine: o })
    if (eCondizione(o))
      for (const r of RAMI) giro(ramoDi(o, r), [...q, r])
    else if (o && o.allora) giro(o.allora, [...q, 'allora'])
  })
  for (const id in piano) giro(piano[id], [id])
  return out
}
function togli (piano, via) {
  const p = clona(piano)
  let dove = p[via[0]]
  let k = 1
  for (;;) {
    if (k === via.length - 1) { dove.splice(via[k], 1); return p }
    const o = dove[via[k]]
    dove = o[via[k + 1]]
    k += 2
  }
}
/* tutte le file di ordini di un piano: quella di ogni unità, quelle che
   stanno dentro un «quando senti» e i due rami di ogni condizione */
function file (piano) {
  const out = []
  const giro = l => {
    out.push(l)
    ;(l || []).forEach(o => {
      if (eCondizione(o)) RAMI.forEach(r => giro(ramoDi(o, r)))
      else if (o && o.allora) giro(o.allora)
    })
  }
  for (const id in piano) giro(piano[id])
  return out
}
const soloUno = (piano, id) =>
  Object.fromEntries(Object.keys(piano).map(k => [k, k === id ? clona(piano[k]) : []]))

/* ═══════════ il banco ═══════════ */
export function provaLivello (liv, nome) {
  const n = nome || liv.nome || liv.id || 'livello'
  const impronta = scritta(liv)

  if (!controlla(`${n}: è un livello (griglia, unità, fazioni, soluzioni)`,
                 !!liv && Array.isArray(liv.griglia) && Array.isArray(liv.unita) &&
                 !!liv.fazioni && soluzioni(liv).length > 0)) return

  forma(liv, n)
  vincono(liv, n)
  necessari(liv, n)
  ilPar(liv, n)
  particolari(liv, n)

  controlla(`${n}: giocare non sporca i dati del livello`, scritta(liv) === impronta)
}

/* ── 1. la forma: la mappa, le fazioni, le cose al loro posto ── */
function forma (liv, n) {
  const g = liv.griglia
  const w = g[0].length
  controlla(`${n}: la griglia è rettangolare`, g.every(r => typeof r === 'string' && r.length === w),
            `righe da ${[...new Set(g.map(r => r.length))].join(', ')}`)
  const bordo = g[0].split('').every(c => c === '#') &&
                g[g.length - 1].split('').every(c => c === '#') &&
                g.every(r => r[0] === '#' && r[w - 1] === '#')
  controlla(`${n}: il bordo è chiuso`, bordo)

  const fz = Object.values(liv.fazioni)
  controlla(`${n}: ogni fazione dice chi la governa`,
            fz.every(f => f.autore === 'giocatore' || f.autore === 'livello'))
  controlla(`${n}: una fazione è del giocatore`, fz.some(f => f.autore === 'giocatore'))
  controlla(`${n}: ogni unità sta in una fazione dichiarata`,
            liv.unita.every(u => !!liv.fazioni[u.fazione]))
  /* la faccia: `chi` è il nome di un pittore di `grafica/personaggi/`, e
     se non esiste sul campo si vede un orco al posto di quel qualcuno —
     cioè il livello racconta una cosa e ne disegna un'altra */
  const senzaFaccia = liv.unita.filter(u => !PERSONAGGI.includes(u.chi))
    .map(u => `${u.nome || u.id} (${u.chi || 'niente'})`)
  controlla(`${n}: ogni unità ha una faccia che esiste`, !senzaFaccia.length,
            `${senzaFaccia.join(', ')} — le facce sono: ${PERSONAGGI.join(', ')}`)
  controlla(`${n}: c'è almeno una scena`, scene(liv).length > 0)

  /* le varianti spostano le cose: una toppa storta si vede solo
     guardando la scena che la usa */
  for (const iv of scene(liv)) {
    let m = null
    try { m = creaMondo(liv, iv) } catch (err) { controlla(`${n} · scena ${iv + 1}: si costruisce`, false, String(err)); continue }
    const suolo = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.celle[y][x].muro
    const fuori = l => l.filter(c => !suolo(c.x, c.y)).map(c => `${c.nome || c.id} (${c.x},${c.y})`)
    const a = fuori(m.unita), b = fuori(m.oggetti)
    const c = fuori(Object.entries(m.posti).map(([k, p]) => ({ nome: k, x: p.x, y: p.y })))
    const d = fuori(Object.values(m.porte))
    controlla(`${n} · scena ${iv + 1}: le unità stanno su pavimento`, !a.length, a.join(', '))
    controlla(`${n} · scena ${iv + 1}: gli oggetti stanno su pavimento`, !b.length, b.join(', '))
    controlla(`${n} · scena ${iv + 1}: i posti stanno su pavimento`, !c.length, c.join(', '))
    controlla(`${n} · scena ${iv + 1}: le porte stanno su pavimento`, !d.length, d.join(', '))
    scenografia(liv, n, iv, m, suolo)
  }
}

/* ── la scenografia è soltanto disegno ──
   `scenografia: [{ che:'cassa', x, y }]` non passa dal motore: `creaMondo`
   non la guarda nemmeno, quindi non si prende, non si nomina in un ordine
   e non compare fra i bersagli. Qui si controllano le tre cose che la
   tengono onesta: che il pittore esista (se no si vede un buco), che stia
   su pavimento, e che **non sieda sopra niente che è in gioco** — una
   cassa dipinta appoggiata sulla cassa vera insegnerebbe al bambino che
   toccare le cose non serve. */
function scenografia (liv, n, iv, m, suolo) {
  const roba = liv.scenografia
  if (!roba) return
  const dove = `${n} · scena ${iv + 1}`
  if (!controlla(`${dove}: la scenografia è una lista di cose da disegnare`,
                 Array.isArray(roba) && roba.every(d => d && typeof d.che === 'string' &&
                   Number.isFinite(d.x) && Number.isFinite(d.y)))) return
  const senzaPittore = roba.filter(d => !OGGETTI.includes(d.che)).map(d => d.che)
  controlla(`${dove}: ogni cosa di scena ha il suo pittore`, !senzaPittore.length,
            `non c'è nessun pittore che si chiami «${[...new Set(senzaPittore)].join('», «')}»`)
  const fuori = roba.filter(d => !suolo(d.x, d.y)).map(d => `${d.che} (${d.x},${d.y})`)
  controlla(`${dove}: la scenografia sta su pavimento`, !fuori.length, fuori.join(', '))
  /* le caselle che il gioco usa davvero: lì la scenografia non va */
  const usate = new Set([
    ...m.unita.map(u => u.x + ',' + u.y),
    ...m.oggetti.map(o => o.x + ',' + o.y),
    ...Object.values(m.posti).map(p => p.x + ',' + p.y),
    ...Object.values(m.porte).map(p => p.x + ',' + p.y),
  ])
  const sopra = roba.filter(d => usate.has(d.x + ',' + d.y)).map(d => `${d.che} (${d.x},${d.y})`)
  controlla(`${dove}: nessuna cosa di scena sta sopra una cosa in gioco`, !sopra.length,
            sopra.join(', '))
  /* e non si nomina: se comparisse fra i complementi tornerebbe in gioco
     dalla finestra */
  const nominate = roba.filter(d => (liv.complementi || []).includes(d.che)).map(d => d.che)
  controlla(`${dove}: la scenografia non è nominabile`, !nominate.length,
            `«${[...new Set(nominate)].join('», «')}» sta anche fra i complementi`)
}

/* ── 2. le soluzioni dichiarate vincono davvero ── */
function vincono (liv, n) {
  for (const s of soluzioni(liv)) {
    const e = esiti(liv, s.piano)
    if (!s.fragile)
      controlla(`${n} · ${s.nome}: vince su tutte le scene`, e.every(r => r.vinto), detto(e))
    else
      controlla(`${n} · ${s.nome} (fragile): ne vince almeno una e ne perde almeno una`,
                e.some(r => r.vinto) && e.some(r => !r.vinto), detto(e))
    /* un ordine che il motore rifiuta non è mai stato giocato: una
       soluzione fatta di ordini rifiutati «perde» per il motivo
       sbagliato, e nessuno se ne accorgerebbe */
    const rifiutati = scene(liv).flatMap(iv => {
      try { return guaiDi(creaMondo(liv, iv), s.piano).map(g => g.motivo) } catch { return [] }
    })
    controlla(`${n} · ${s.nome}: nessun ordine viene rifiutato`, !rifiutati.length,
              rifiutati.slice(0, 2).join(' · '))
  }
}

/* ── 3. niente è di troppo, e niente si vince stando a guardare ── */
function necessari (liv, n) {
  const modello = soluzioni(liv)[0].piano
  const vuoto = { ...pianoVuoto(liv), ...Object.fromEntries(Object.keys(modello).map(k => [k, []])) }
  const e = esiti(liv, vuoto)
  controlla(`${n}: il piano vuoto non vince nessuna scena`, !e.some(r => r.vinto), detto(e))

  for (const s of strette(liv))
    for (const v of voci(s.piano)) {
      const monco = togli(s.piano, v.via)
      controlla(`${n} · ${s.nome}: senza «${chiaveOrdine(v.ordine)}» non è più una soluzione`,
                !tutte(liv, monco), 'vince lo stesso su tutte le scene: quell\'ordine non serve')
    }
}

/* ── 4. il par: una promessa, non un numero di bellezza ── */
function ilPar (liv, n) {
  controlla(`${n}: il par è un numero di ordini`, Number.isInteger(liv.par) && liv.par > 0, `par ${liv.par}`)
  const corte = strette(liv).map(s => contaOrdini(s.piano))
  if (!controlla(`${n}: c'è una soluzione stretta, non solo strade lunghe`, corte.length > 0)) return
  const min = Math.min(...corte)
  controlla(`${n}: il par è raggiungibile`, min <= liv.par,
            `par ${liv.par}, soluzioni da ${corte.join(', ')} ordini`)
  controlla(`${n}: il par non è largo di manica`, min >= liv.par,
            `par ${liv.par}, ma si vince con ${min} ordini`)
  /* e una strada lunga dev'essere davvero lunga: se ci sta nel par,
     quella marca è una scusa per saltare il controllo di sopra */
  for (const s of soluzioni(liv).filter(x => x.lunga && !x.fragile))
    controlla(`${n} · ${s.nome} (lunga): costa più del par`, contaOrdini(s.piano) > liv.par,
              `par ${liv.par}, e questa ne conta ${contaOrdini(s.piano)}`)
}

/* ── 5. quello che questo livello ha di suo ── */
function particolari (liv, n) {
  const v = liv.verifiche
  if (!v) return
  const conosciute = Object.keys(REGOLE)
  const ignote = Object.keys(v).filter(k => !conosciute.includes(k))
  controlla(`${n}: le prove dichiarate esistono tutte`, !ignote.length,
            `non so cosa sia «${ignote.join('», «')}» — le prove sono: ${conosciute.join(', ')}`)
  for (const k of conosciute) if (v[k] !== undefined && v[k] !== false) REGOLE[k](liv, n, v[k])
}

const REGOLE = {
  /* non si vince mandandoli avanti tutti insieme, ognuno per la sua
     strada: senza la sincronizzazione il piano cade */
  nonInFila (liv, n) {
    /* un'attesa non è un gesto: è il QUANDO di quello dopo. Toglierla
       è esattamente «partire subito», che è quello che questa prova
       vuole far fallire. */
    const attesa = o => ((VERBI[o && o.verbo] || {}).cl === 'attesa')
    const srotola = lista => (lista || []).flatMap(o => {
      if (o.verbo === 'quando') return srotola(o.allora)
      /* un bivio srotolato è «fai tutto, senza scegliere»: i due rami
         uno dietro l'altro, che è esattamente quello che un piano senza
         decisioni sarebbe costretto a fare */
      if (eCondizione(o)) return RAMI.flatMap(r => srotola(ramoDi(o, r)))
      if (attesa(o)) return []
      return [{ ...o }]
    })
    for (const s of buone(liv)) {
      const fila = Object.fromEntries(Object.keys(s.piano).map(id => [id, srotola(s.piano[id])]))
      if (!controlla(`${n} · ${s.nome}: «nonInFila» ha qualcosa da srotolare`,
                     scritta(fila) !== scritta(s.piano),
                     'nessun «quando senti», nessuna guardia, nessuna attesa: ' +
                     'qui non c\'è niente da sincronizzare')) continue
      const e = esiti(liv, fila)
      controlla(`${n} · ${s.nome}: in fila, tutti insieme, non si vince`, !e.every(r => r.vinto), detto(e))
    }
  },

  /* servono tutti: con una fila sola non si arriva in fondo */
  serveOgnuno (liv, n) {
    const miei = mieUnita(liv)
    if (!controlla(`${n}: «serveOgnuno» vuole almeno due unità del giocatore`, miei.length > 1,
                   `il giocatore comanda ${miei.length}`)) return
    for (const s of buone(liv))
      for (const id of miei) {
        const e = esiti(liv, soloUno(s.piano, id))
        controlla(`${n} · ${s.nome}: con ${id} da solo non si vince`, !e.every(r => r.vinto), detto(e))
      }
  },

  /* due ordini che non si possono scambiare */
  ordineConta (liv, n, coppie) {
    for (const [a, b] of coppie) {
      let trovata = 0
      for (const s of buone(liv)) {
        const p = scambia(s.piano, a, b)
        if (!p) continue
        trovata++
        const e = esiti(liv, p)
        controlla(`${n} · ${s.nome}: «${a}» prima di «${b}», e non viceversa`,
                  !e.every(r => r.vinto), detto(e))
      }
      controlla(`${n}: la coppia «${a}» / «${b}» sta in una soluzione`, trovata > 0,
                'nessuna soluzione dichiarata ha tutti e due quegli ordini nella stessa fila')
    }
  },

  /* e il contrario, dove è vero: qui l'ordine dei gesti non conta */
  ordineLibero (liv, n) {
    let coppie = 0
    for (const s of buone(liv)) {
      const quanti = file(s.piano).map(l => l.length)
      for (let k = 0; k < quanti.length; k++)
        for (let i = 0; i < quanti[k]; i++) for (let j = i + 1; j < quanti[k]; j++) {
          const p = clona(s.piano)
          const l = file(p)[k]
          const t = l[i]; l[i] = l[j]; l[j] = t
          coppie++
          const e = esiti(liv, p)
          controlla(`${n} · ${s.nome}: «${chiaveOrdine(l[j])}» e «${chiaveOrdine(l[i])}» si scambiano senza danno`,
                    e.every(r => r.vinto), detto(e))
        }
    }
    controlla(`${n}: «ordineLibero» ha almeno una coppia da scambiare`, coppie > 0)
  },

  /* senza quella cosa non si vince */
  senza (liv, n, cose) {
    const miei = mieUnita(liv)
    for (const cosa of cose)
      for (const s of buone(liv)) {
        let p
        if (miei.includes(cosa)) p = { ...clona(s.piano), [cosa]: [] }
        else {
          p = clona(s.piano)
          for (const l of file(p)) {
            for (let i = l.length - 1; i >= 0; i--) if (nomina(l[i], cosa)) l.splice(i, 1)
          }
          if (!controlla(`${n} · ${s.nome}: «senza ${cosa}» toglie qualcosa`,
                         scritta(p) !== scritta(s.piano),
                         `nessun ordine nomina «${cosa}»`)) continue
        }
        const e = esiti(liv, p)
        controlla(`${n} · ${s.nome}: senza «${cosa}» non si vince`, !e.every(r => r.vinto), detto(e))
      }
  },
}

/* una voce nomina una cosa se ci punta, se ne parla in una condizione, o
   se la nomina qualcosa che ha dentro */
const nomina = (o, cosa) => !!o && (o.complemento === cosa ||
  (o.punti || []).includes(cosa) ||
  [o.cond, o.finche].some(c => c && c.complemento === cosa) ||
  (eCondizione(o) && RAMI.some(r => ramoDi(o, r).some(q => nomina(q, cosa)))) ||
  (o.allora || []).some(q => nomina(q, cosa)))

function scambia (piano, a, b) {
  const p = clona(piano)
  for (const l of file(p)) {
    const i = l.findIndex(o => chiaveOrdine(o) === a)
    const j = l.findIndex(o => chiaveOrdine(o) === b)
    if (i >= 0 && j >= 0 && i !== j) { const t = l[i]; l[i] = l[j]; l[j] = t; return p }
  }
  return null
}
