/* ═══════════════════════════════════════════════════════════════════
   I PROBLEMI A PAROLE — che la storia e il conto dicano la stessa cosa.

   Il banco dei quiz (`unita/quiz`) prova già la forma di queste domande
   come prova quella di tutte le altre: risposte doppie, varietà, caso
   ripetibile. Quello che non può sapere è se **la storia racconta il
   conto che poi si fa**, ed è l'unico modo di sbagliare che conta
   davvero qui dentro: un problema che dice «ne perde 6» e sotto
   sottrae 8 è formalmente ineccepibile, il bambino ragiona giusto e
   sbaglia, e nessuno se ne accorge mai.

   Si prova dal lato opposto rispetto a come è costruito. Il modulo
   genera il testo *da* una catena (`{ base, passi }`); qui si rileggono
   le **cifre scritte nel testo** e si controlla che siano esattamente
   quelle della catena, più quelle che il modulo dichiara di aver messo
   lì per non farle usare (`inutili`). Se un giorno una frase venisse
   scritta a mano con un numero suo, questa è la rete che la prende.

   Le altre tre cose che si guardano, e che non si vedrebbero altrove:

     · **nessuna storia impossibile**: se in mezzo si passa da un numero
       negativo — «ne regala 9» quando ne ha 4 — quella non è una
       domanda difficile, è una domanda sbagliata;
     · **il dato che non serve non è mai la risposta**, se no sceglierlo
       per sbaglio sembrerebbe aver ragionato; e fra i falsi c'è sempre
       quello di chi l'ha usato lo stesso, che è il falso che vale tutta
       la domanda del grado 6;
     · **le concordanze**: «Quante mele» contro «Quanti pastelli», «le
       divide» contro «li divide». Sono le uniche cose che in questo
       modulo vanno accordate a mano, quindi sono le uniche che si
       possono sbagliare — e un genere storto in una consegna per
       bambini si vede subito a schermo e mai in un test di forma.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import problemi, { costruisci } from '../../src/quiz/moduli/problemi.js'

const TIRI = 300

/* le cifre scritte nella storia, in ordine: è quello che legge un
   bambino, non quello che il generatore crede di aver scritto */
const cifreDi = testo => (testo.match(/\d+/g) || []).map(Number).sort((a, b) => a - b)

/* il conto rifatto da capo sulla catena, senza chiedere niente al
   modulo: se `esito()` un giorno sbagliasse un segno, qui si vede */
function conto({ base, passi }) {
  let n = base
  for (const p of passi) {
    if (p.segno === '+') n += p.n
    else if (p.segno === '-') n -= p.n
    else if (p.segno === '×') n *= p.n
    else n /= p.n
  }
  return n
}
function intermedi({ base, passi }) {
  const fuori = []
  let n = base
  for (const p of passi) { n = conto({ base: n, passi: [p] }); fuori.push(n) }
  return fuori
}

const TIPI = problemi.tipi.map(t => t.chiave)
uguale('le nove tipologie sono tutte lì', TIPI.length, 9)

/* il grado a cui una tipologia esce davvero: `costruisci` lo usa per i
   tetti dei numeri, e chiederglielo storto proverebbe un'altra domanda */
const gradoDi = chiave => {
  const t = problemi.tipi.find(x => x.chiave === chiave)
  return Number(Object.keys(t.gradi)[0])
}

/* ══════════ 1. la storia racconta il conto ══════════ */
{
  const male = []
  const storie = []
  for (const tipo of TIPI) {
    const grado = gradoDi(tipo)
    for (let i = 0; i < TIRI; i++) {
      const p = costruisci(tipo, grado, new Sorte(i * 7717 + grado))
      storie.push(p)
      const attese = [p.catena.base, ...p.catena.passi.map(x => x.n), ...p.inutili]
        .sort((a, b) => a - b)
      const scritte = cifreDi(p.testo)
      if (JSON.stringify(scritte) !== JSON.stringify(attese))
        male.push(`${tipo}: «${p.testo}» racconta ${scritte.join(' ')} ma conta ${attese.join(' ')}`)
    }
  }
  controlla('ogni cifra scritta nella storia è una cifra del conto', male.length === 0,
            male.slice(0, 3).join(' · '))
  nota(`${storie.length} storie lette riga per riga, ${TIPI.length} tipologie`)
}

/* ══════════ 2. il conto torna, e nessun passaggio è impossibile ══════════ */
{
  const male = []
  const impossibili = []
  const spicci = []
  for (const tipo of TIPI) {
    const grado = gradoDi(tipo)
    for (let i = 0; i < TIRI; i++) {
      const p = costruisci(tipo, grado, new Sorte(i * 313 + grado * 11))
      if (p.buona !== conto(p.catena)) male.push(`${tipo}: dice ${p.buona}, il conto fa ${conto(p.catena)}`)
      if (!Number.isInteger(p.buona) || p.buona < 0) male.push(`${tipo}: risposta ${p.buona}`)
      if (intermedi(p.catena).some(n => n < 0)) impossibili.push(`${tipo}: «${p.testo}»`)
      /* una divisione con il resto non si può raccontare così: «le
         divide in parti uguali» promette che non ne avanzi nessuna */
      for (const passo of p.catena.passi)
        if (passo.segno === '÷' && p.catena.base % passo.n !== 0)
          spicci.push(`${tipo}: ${p.catena.base} : ${passo.n}`)
    }
  }
  controlla('la risposta è sempre l\'esito della catena', male.length === 0, male.slice(0, 3).join(' · '))
  controlla('nessuna storia passa da un numero negativo', impossibili.length === 0,
            impossibili.slice(0, 3).join(' · '))
  controlla('le parti uguali sono davvero uguali: mai un resto', spicci.length === 0,
            spicci.slice(0, 3).join(' · '))
}

/* ══════════ 3. il dato che non serve ══════════ */
{
  const dentroIlConto = []
  const uguali = []
  const senzaTrappola = []
  const senzaDato = []
  for (let i = 0; i < TIRI * 3; i++) {
    const p = costruisci('prob:inutili', 6, new Sorte(i * 977 + 5))
    if (p.inutili.length !== 1) { senzaDato.push(`«${p.testo}»`); continue }
    const [in_] = p.inutili
    if (p.catena.base === in_ || p.catena.passi.some(x => x.n === in_))
      dentroIlConto.push(`${in_} in «${p.testo}»`)
    if (in_ === p.buona) uguali.push(`«${p.testo}» → ${p.buona}`)
    /* il falso che vale la domanda: quello di chi il numero in più
       l'ha usato lo stesso */
    const usa = p.candidati.some(c => c.n === p.buona + in_ || c.n === p.buona - in_ ||
                                      c.n === in_ || c.n === p.buona * in_)
    if (!usa) senzaTrappola.push(`«${p.testo}»`)
  }
  controlla('ogni storia dell\'ultimo grado porta un dato in più', senzaDato.length === 0,
            senzaDato.slice(0, 2).join(' · '))
  controlla('il dato in più non entra mai nel conto', dentroIlConto.length === 0,
            dentroIlConto.slice(0, 3).join(' · '))
  controlla('e non è mai uguale alla risposta giusta', uguali.length === 0, uguali.slice(0, 3).join(' · '))
  controlla('fra i falsi c\'è sempre quello di chi l\'ha usato lo stesso',
            senzaTrappola.length === 0, senzaTrappola.slice(0, 2).join(' · '))
}

/* ══════════ 4. le concordanze, che sono l'unica cosa accordata a mano ══════════
   Si guarda quello che esce, non come è scritto: la parola subito dopo
   «Quante»/«Quanti» e quella prima di «le divide»/«li tiene» devono
   avere il genere che la tabella delle cose dichiara. */
{
  /* il genere non si riscrive qui: si legge da `cosa`, che è il dato
     che il modulo stesso ha usato per comporre la frase. Una lista di
     plurali femminili tenuta a mano in un test è la stessa cosa che
     dover ricordarsi di aggiornare due file — e il giorno che ci si
     dimentica, il test non se ne accorge e il genere storto va a
     schermo. Quello che si controlla è che la frase concordi con il
     dato: se il generatore chiedesse il genere al contenitore invece
     che alla cosa («Quanti mele ci sono in ogni cesto»), qui si vede. */
  const storti = []
  const pronomi = []
  for (const tipo of TIPI) {
    const grado = gradoDi(tipo)
    for (let i = 0; i < TIRI; i++) {
      const p = costruisci(tipo, grado, new Sorte(i * 1493 + grado * 7))
      const giusto = p.cosa.f ? 'Quante' : 'Quanti'

      for (const [, come, chi] of p.testo.matchAll(/\b(Quante|Quanti) ([a-zà-ù]+)/g)) {
        /* «Quante mele», «Quante ne riceve», «Quanti gliene restano»:
           il pronome sta al posto della cosa, e concorda con lei */
        const parlaDiLei = chi === p.cosa.tanti || chi === 'ne' || chi === 'gliene'
        if (!parlaDiLei) storti.push(`«${come} ${chi}» non parla di ${p.cosa.tanti}`)
        else if (come !== giusto) storti.push(`«${come} ${chi}» per ${p.cosa.tanti}`)
      }
      for (const [, pron] of p.testo.matchAll(/ e (le|li) (?:divide|tiene)/g))
        if (pron !== (p.cosa.f ? 'le' : 'li')) pronomi.push(`«${pron}» per ${p.cosa.tanti}`)
    }
  }
  controlla('«Quante mele» e «Quanti pastelli»: mai scambiati', storti.length === 0,
            [...new Set(storti)].slice(0, 4).join(' · '))
  controlla('«le divide» e «li divide» seguono la cosa che nominano', pronomi.length === 0,
            [...new Set(pronomi)].slice(0, 4).join(' · '))
}

/* ══════════ 5. la consegna è una domanda, e non ha buchi ══════════
   I template sono il posto dove nasce «Nina ha undefined mele»: non
   lancia niente, passa ogni controllo di forma, e si legge solo a
   schermo. */
{
  const rotte = []
  for (const tipo of TIPI) {
    const grado = gradoDi(tipo)
    for (let i = 0; i < TIRI; i++) {
      const t = costruisci(tipo, grado, new Sorte(i * 601 + grado * 3)).testo
      if (!t.trim().endsWith('?')) rotte.push(`${tipo}: non finisce con una domanda`)
      if (/undefined|NaN|null/.test(t)) rotte.push(`${tipo}: «${t}»`)
      if (/ {2}| \.|\s,/.test(t)) rotte.push(`${tipo}: spaziatura — «${t}»`)
    }
  }
  controlla('nessuna consegna con un buco dentro', rotte.length === 0,
            [...new Set(rotte)].slice(0, 3).join(' · '))
}

/* ══════════ 6. e nel gioco vero arriva una domanda intera ══════════ */
{
  const male = []
  for (let g = 1; g <= problemi.gradi; g++) {
    for (let i = 0; i < 120; i++) {
      const d = problemi.chiedi(g, new Sorte(i * 89 + g))
      const numeri = d.risposte.map(r => Number(r.testo))
      if (numeri.some(n => !Number.isInteger(n) || n < 0)) male.push(`g${g}: risposte ${numeri.join(' ')}`)
      if (new Set(numeri).size !== numeri.length) male.push(`g${g}: due risposte uguali`)
      if (d.risposte.length !== 4) male.push(`g${g}: ${d.risposte.length} risposte invece di 4`)
      /* nessuna figura sopra la storia: in `Domanda.vue` un soggetto
         sta in un riquadro largo come i tasti delle risposte, e sopra
         quattro numeri si legge come un quinto tasto. Qui la domanda è
         tutta nel testo, e la figura non porterebbe niente. */
      if (d.soggetto) male.push(`g${g} ${d.chiave}: ha un soggetto sopra la storia`)
    }
  }
  controlla('quattro numeri interi, tutti diversi, e niente figure sopra', male.length === 0,
            [...new Set(male)].slice(0, 3).join(' · '))
}

/* ══════════ 7. i saperi: chi non legge ancora non riceve problemi ══════════ */
{
  uguale('spento «problemi», il modulo esce dal mazzo',
         problemi.gradiLiberi(['problemi']).length, 0)
  uguale('spente le moltiplicazioni, il grado dei gruppi resta aperto a metà',
         problemi.tipiLiberi(3, ['moltiplicazioni']).map(t => t.chiave).join(), 'prob:parti')
  uguale('e spente le divisioni resta l\'altra metà',
         problemi.tipiLiberi(3, ['divisioni']).map(t => t.chiave).join(), 'prob:volte')
  controlla('spente tutte e due, il grado dei gruppi si chiude',
            !problemi.puo(3, ['moltiplicazioni', 'divisioni']))
  uguale('ma gli altri gradi restano', problemi.gradiLiberi(['moltiplicazioni', 'divisioni']).join(),
         '1,2,4,5,6')
}

riassunto('i problemi a parole')
