/* ═══════════════════════════════════════════════════════════════════
   LA SCHEDA — la modale che fa la domanda, uguale per tutti i moduli.

   Il gioco si ferma, esce un cartello, il bambino tocca una risposta,
   il cartello dice com'è andata e sparisce. Una riga sola, da dovunque:

     const esito = await chiedi(ortografia, { grado: 3 })
     if (esito.giusto) …

   Chi la apre non sa che materia sia, e il modulo non sa che esiste uno
   schermo: in mezzo passa solo l'oggetto `domanda`. È il motivo per cui
   un modulo nuovo non costa una riga di interfaccia — e per cui questa
   scheda si può innestare in Survivors, nel dungeon e nel castello
   senza portarsi dietro nient'altro.

   LE RISPOSTE SI DISPONGONO DA SÉ: due grandi affiancate, tre o quattro
   in griglia, sei piccole. Testo, emoji o disegno cambiano solo cosa
   c'è dentro il tasto, mai la disposizione.

   DOPO L'ERRORE si vede la risposta giusta accesa di verde, e — se il
   modulo l'ha scritta — la riga `perche` di quella sbagliata o l'aiuto
   della domanda. Un secondo e mezzo di lettura, non un rimprovero:
   niente ✗ rossi che sbattono, nessun punteggio, si torna a giocare.

   Il CSS sta qui dentro come stringa e si inietta una volta sola. Non è
   pigrizia: il prodotto finale è un HTML unico e questa scheda deve
   funzionare tale e quale dentro una pagina di prova aperta a mano e
   dentro il build di Vite.
   ═══════════════════════════════════════════════════════════════════ */

import { dipingi } from './riquadro.js'
import { sorteQualunque } from '../nucleo/sorte.js'

/* Le misure sono quelle di `Domanda.vue`, e per lo stesso motivo: i
   disegni fissi a 148 e 118 pixel mandavano metà scheda fuori da uno
   schermo piccolo. `--qz-h` è l'unità di altezza utile — di regola tutto
   lo schermo, e chi apre la domanda in un pannello più corto la stringe. */
const STILE = `
.quiz-velo {
  --qz-h: 1vh;
  position: fixed; inset: 0; z-index: 90; display: flex;
  align-items: flex-start; justify-content: center;
  padding: clamp(6px, calc(2 * var(--qz-h)), 16px);
  overflow-y: auto; overscroll-behavior: contain;
  background: rgba(6, 9, 18, .82); backdrop-filter: blur(3px);
  animation: quiz-entra .18s ease;
  font: 16px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
@keyframes quiz-entra { from { opacity: 0 } to { opacity: 1 } }
.quiz-carta {
  margin: auto;
  width: 100%; max-width: 430px;
  padding: clamp(10px, calc(2 * var(--qz-h)), 20px)
           clamp(12px, 4vw, 18px)
           clamp(10px, calc(1.8 * var(--qz-h)), 18px);
  border-radius: 24px; color: #eaf0ff;
  background: linear-gradient(180deg, #223055 0%, #141c33 100%);
  border: 1px solid rgba(255,255,255,.13);
  box-shadow: 0 24px 60px rgba(0,0,0,.55);
}
.quiz-testa { display: flex; align-items: center; gap: 8px;
  margin-bottom: clamp(5px, calc(1.2 * var(--qz-h)), 12px);
  font-size: 12.5px; letter-spacing: .06em; text-transform: uppercase; color: #8fa2cc; }
.quiz-testa b { font-weight: 700; color: #ffd58a; letter-spacing: .04em; }
.quiz-consegna { font-size: clamp(15px, 4.4vw, 20px); font-weight: 650; line-height: 1.3;
  margin-bottom: clamp(7px, calc(1.5 * var(--qz-h)), 14px); white-space: pre-line; }
.quiz-soggetto {
  display: flex; align-items: center; justify-content: center;
  margin: 0 0 clamp(8px, calc(1.7 * var(--qz-h)), 16px);
  padding: clamp(7px, calc(1.4 * var(--qz-h)), 14px);
  min-height: clamp(46px, calc(8 * var(--qz-h)), 74px);
  border-radius: 18px; background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  font-size: clamp(24px, 6.5vw, 34px); font-weight: 750; text-align: center; letter-spacing: .01em;
}
.quiz-soggetto canvas {
  width: clamp(76px, calc(17 * var(--qz-h)), 148px); height: auto; aspect-ratio: 1;
}
.quiz-risposte { display: grid; gap: clamp(6px, calc(1.1 * var(--qz-h)), 10px); }
.quiz-risposte.due   { grid-template-columns: 1fr 1fr; }
.quiz-risposte.tre   { grid-template-columns: 1fr 1fr 1fr; }
.quiz-risposte.molte { grid-template-columns: 1fr 1fr; }
.quiz-risposte.lunghe { grid-template-columns: 1fr; }
.quiz-tasto {
  display: flex; align-items: center; justify-content: center;
  min-height: clamp(42px, calc(7 * var(--qz-h)), 62px);
  padding: clamp(6px, calc(1.1 * var(--qz-h)), 12px) 8px; cursor: pointer;
  border-radius: 16px; border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.075); color: inherit;
  font: inherit; font-size: clamp(16px, 4.4vw, 19px); font-weight: 650; text-align: center;
  transition: transform .1s ease, background .12s ease, border-color .12s ease;
}
.quiz-tasto.emoji { font-size: clamp(28px, 7.5vw, 40px); }
.quiz-tasto canvas {
  width: 100%; max-width: clamp(52px, calc(13.5 * var(--qz-h)), 118px);
  aspect-ratio: 1; height: auto;
}
.quiz-tasto:active { transform: scale(.97); background: rgba(255,255,255,.13); }
/* figura sopra, parola sotto: il corpo del carattere è dichiarato e non
   ereditato, se no su un tasto a emoji il nome uscirebbe di quaranta
   pixel — grande quanto la risposta invece che la sua didascalia */
.quiz-tasto.nominata, .quiz-soggetto.nominata { flex-direction: column; gap: 4px; }
.quiz-nome { font-size: clamp(11px, 3.2vw, 14px); font-weight: 650; line-height: 1.2; opacity: .93; }
.quiz-soggetto .quiz-nome { font-size: clamp(13px, 3.8vw, 16px); }
.quiz-tasto.giusta { background: rgba(78, 214, 128, .24); border-color: #4ed680; }
.quiz-tasto.sbagliata { background: rgba(255, 105, 105, .2); border-color: #ff6969; }
.quiz-tasto.spenta { opacity: .38; }
.quiz-esito { margin-top: clamp(7px, calc(1.4 * var(--qz-h)), 14px); min-height: 20px;
  font-size: clamp(13px, 3.8vw, 15px); line-height: 1.4; color: #b9c6e6; }
.quiz-esito .bene { color: #7ee6a4; font-weight: 700; }
.quiz-esito .male { color: #ffb0b0; font-weight: 700; }
`

function stile() {
  if (typeof document === 'undefined') return
  if (document.getElementById('quiz-stile')) return
  const s = document.createElement('style')
  s.id = 'quiz-stile'
  s.textContent = STILE
  document.head.appendChild(s)
}

/* Il contenuto di un tasto (o del soggetto): testo, emoji o disegno —
   e sotto, se c'è, il nome della figura. Il gemello Vue è `Domanda.vue`
   e le due rese devono restare la stessa cosa: una domanda che qui esce
   senza la parola sotto è una domanda che a un bambino insegna
   un'immagine e non un vocabolo. */
function riempi(el, cosa, pittori) {
  if (cosa.emoji !== undefined) {
    el.classList.add('emoji')
    el.appendChild(document.createTextNode(cosa.emoji))
  } else if (cosa.testo !== undefined) {
    el.appendChild(document.createTextNode(cosa.testo))
  } else {
    const cv = document.createElement('canvas')
    el.appendChild(cv)
    /* il canvas prende la misura dal riquadro solo dopo il layout */
    requestAnimationFrame(() => dipingi(cv, pittori, cosa.scena))
  }
  if (cosa.nome) {
    el.classList.add('nominata')
    const n = document.createElement('span')
    n.className = 'quiz-nome'
    n.textContent = cosa.nome
    el.appendChild(n)
  }
}

/* ── mostra una domanda già generata ──
   Torna una promessa con { giusto, indice, tempo, domanda }. */
export function mostra(domanda, pittori = {}, { dove = document.body, titolo = '', attesa = 1500 } = {}) {
  stile()
  return new Promise(risolvi => {
    const velo = document.createElement('div')
    velo.className = 'quiz-velo'
    const carta = document.createElement('div')
    carta.className = 'quiz-carta'
    velo.appendChild(carta)

    if (titolo) {
      const t = document.createElement('div')
      t.className = 'quiz-testa'
      t.innerHTML = titolo
      carta.appendChild(t)
    }

    const consegna = document.createElement('div')
    consegna.className = 'quiz-consegna'
    consegna.textContent = domanda.testo
    carta.appendChild(consegna)

    if (domanda.soggetto) {
      const s = document.createElement('div')
      s.className = 'quiz-soggetto'
      riempi(s, domanda.soggetto, pittori)
      carta.appendChild(s)
    }

    const n = domanda.risposte.length
    const lunghe = domanda.risposte.some(r => (r.testo || '').length > 13)
    const griglia = document.createElement('div')
    griglia.className = 'quiz-risposte ' +
      (lunghe ? 'lunghe' : n === 2 ? 'due' : n === 3 ? 'tre' : 'molte')
    carta.appendChild(griglia)

    const esito = document.createElement('div')
    esito.className = 'quiz-esito'
    carta.appendChild(esito)

    const partenza = (typeof performance !== 'undefined' ? performance.now() : 0)
    const tasti = domanda.risposte.map((r, i) => {
      const b = document.createElement('button')
      b.className = 'quiz-tasto'
      b.type = 'button'
      b.dataset.i = String(i)
      riempi(b, r, pittori)
      b.addEventListener('click', () => scegli(i))
      griglia.appendChild(b)
      return b
    })

    let chiuso = false
    function scegli(i) {
      if (chiuso) return
      chiuso = true
      const giusto = i === domanda.giusta
      tasti.forEach((b, k) => {
        if (k === domanda.giusta) b.classList.add('giusta')
        else if (k === i) b.classList.add('sbagliata')
        else b.classList.add('spenta')
      })
      const perche = domanda.risposte[i]?.perche
      esito.innerHTML = giusto
        ? '<span class="bene">Giusto!</span>'
        : `<span class="male">Era questa.</span> ${perche || domanda.aiuto || ''}`
      const pausa = giusto ? Math.min(attesa, 700) : attesa + (perche || domanda.aiuto ? 900 : 0)
      setTimeout(() => {
        velo.remove()
        risolvi({
          giusto, indice: i, domanda,
          chiave: domanda.chiave,
          tempo: ((typeof performance !== 'undefined' ? performance.now() : 0) - partenza) / 1000,
        })
      }, pausa)
    }

    dove.appendChild(velo)
  })
}

/* ── la scorciatoia buona per i giochi ──
   Genera e mostra in un colpo solo. Il titolo di serie dice materia e
   grado, che nel gioco è quello che serve sapere. */
export function chiedi(modulo, { grado = 1, sorte = sorteQualunque(), dove, attesa } = {}) {
  const d = modulo.chiedi(grado, sorte)
  const titolo = `${modulo.icona} <b>${modulo.nome}</b> · grado ${Math.min(grado, modulo.gradi)}`
  return mostra(d, modulo.pittori, { dove, titolo, attesa })
}
