/* ═══════════════════════════════════════════════════════════════════
   LA PALESTRA — la pagina di prova di un modulo, sempre la stessa.

   Serve a una cosa sola: aprire un modulo e giocarci per due minuti,
   per capire se le domande sono belle, se il grado 4 è più duro del 2 e
   se un disegno si legge sul telefono. Il banco (`strumenti/quiz/`)
   dice se un modulo è *giusto*; questa dice se è *bello*, e quello lo
   sa solo un occhio.

   Una pagina di prova è quindi tutta qui:

     import modulo from '../src/quiz/moduli/orologio.js'
     import { palestra } from '../src/quiz/grafica/palestra.js'
     palestra(modulo)

   Il grado si cambia coi tasti in fondo, e la domanda dopo arriva da
   sola: chi prova un modulo deve poter fare venti domande di fila senza
   toccare altro.

   E DEVE POTER SMETTERE. Le domande si rincorrono da sole e la scheda
   copre lo schermo, quindi finché il giro gira non c'è niente da
   toccare che non sia una risposta: per tornare ai conti — quante
   giuste, quali chiavi sono uscite, quanto ci si mette — l'unica strada
   era ricaricare la pagina, che i conti se li porta via. Per questo il
   tasto per fermarsi sta **sopra** la scheda e non sotto: da sotto non
   si potrebbe premere mai. Fermarsi lascia a metà la domanda a schermo,
   ed è giusto così — chi si ferma ha già visto quello che voleva.
   ═══════════════════════════════════════════════════════════════════ */

import { chiedi } from './scheda.js'
import { sorteQualunque } from '../nucleo/sorte.js'

const STILE = `
body.palestra {
  margin: 0; min-height: 100vh; padding: 22px 16px 34px;
  background: radial-gradient(120% 80% at 50% 0%, #1d2a4a 0%, #0d1220 60%, #080b14 100%);
  color: #e8edf7; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.pal { max-width: 460px; margin: 0 auto; }
.pal h1 { font-size: 24px; margin: 0 0 4px; letter-spacing: -.02em; }
.pal .chiaro { color: #93a0bd; font-size: 14px; margin: 0 0 20px; }
.pal .gradi { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.pal .gradi button {
  flex: 1 1 auto; min-width: 46px; min-height: 44px; cursor: pointer;
  border-radius: 12px; border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.06); color: #e8edf7; font: inherit; font-weight: 700;
}
.pal .gradi button.ora { background: #ffd58a; color: #23272f; border-color: #ffd58a; }
.pal .dice { color: #b9c6e6; font-size: 14.5px; min-height: 22px; margin-bottom: 18px; }
.pal .via {
  width: 100%; min-height: 56px; cursor: pointer; margin-bottom: 18px;
  border-radius: 16px; border: none; background: #4ed680; color: #0d1a12;
  font: inherit; font-size: 18px; font-weight: 750;
}
.pal .conto { display: flex; gap: 10px; margin-bottom: 14px; }
.pal .conto div {
  flex: 1; padding: 12px; border-radius: 14px; text-align: center;
  background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.09);
}
.pal .conto b { display: block; font-size: 22px; }
.pal .conto span { font-size: 12px; color: #93a0bd; text-transform: uppercase; letter-spacing: .06em; }
.pal .chiavi { color: #6f7c98; font-size: 12.5px; line-height: 1.7; word-break: break-word; }
.pal .chiavi code { background: rgba(255,255,255,.07); padding: 1px 6px; border-radius: 6px; }
/* il tasto per smettere: sopra il velo della scheda (che sta a 90)
   perché è l'unico momento in cui serve, ed è anche l'unico in cui
   tutto il resto della pagina è coperto */
.pal-basta {
  position: fixed; z-index: 100; top: 10px; right: 10px;
  min-height: 40px; padding: 0 15px; cursor: pointer;
  border-radius: 12px; border: 1px solid rgba(255,255,255,.22);
  background: rgba(12,16,28,.82); color: #e8edf7; font: inherit; font-weight: 700;
  backdrop-filter: blur(3px);
}
`

export function palestra(modulo, { grado = 1, dove = document.body } = {}) {
  const s = document.createElement('style')
  s.textContent = STILE
  document.head.appendChild(s)
  document.body.classList.add('palestra')
  document.title = `${modulo.icona} ${modulo.nome} — prova`

  const box = document.createElement('div')
  box.className = 'pal'
  box.innerHTML = `
    <h1>${modulo.icona} ${modulo.nome}</h1>
    <p class="chiaro">${modulo.chiaro}</p>
    <div class="gradi"></div>
    <div class="dice"></div>
    <button class="via" type="button">Fammi una domanda</button>
    <div class="conto">
      <div><b class="ok">0</b><span>giuste</span></div>
      <div><b class="no">0</b><span>sbagliate</span></div>
      <div><b class="sec">—</b><span>secondi</span></div>
    </div>
    <div class="chiavi"></div>`
  dove.appendChild(box)

  const gradi = box.querySelector('.gradi')
  const dice = box.querySelector('.dice')
  const via = box.querySelector('.via')
  const chiavi = new Map()
  let ok = 0, no = 0, secondi = 0, fatte = 0
  let ora = grado
  let gira = false          // il giro è in corso: il tasto per fermarlo è a schermo

  /* vive solo mentre le domande si rincorrono, perché è l'unico momento
     in cui il resto della pagina è sotto un velo */
  const basta = document.createElement('button')
  basta.type = 'button'
  basta.className = 'pal-basta'
  basta.textContent = 'Basta ✕'
  basta.hidden = true
  basta.addEventListener('click', ferma)
  document.body.appendChild(basta)

  for (let g = 1; g <= modulo.gradi; g++) {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = g
    b.addEventListener('click', () => { ora = g; segna() })
    gradi.appendChild(b)
  }

  function segna() {
    [...gradi.children].forEach((b, i) => b.classList.toggle('ora', i + 1 === ora))
    dice.textContent = `grado ${ora} — ${modulo.scaletta[ora - 1]}`
    box.querySelector('.ok').textContent = ok
    box.querySelector('.no').textContent = no
    box.querySelector('.sec').textContent = fatte ? (secondi / fatte).toFixed(1) : '—'
    box.querySelector('.chiavi').innerHTML = [...chiavi.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `<code>${k}</code>&nbsp;${n}`).join(' · ')
  }

  async function unGiro() {
    const esito = await chiedi(modulo, { grado: ora, sorte: sorteQualunque() })
    /* fermato mentre questa era a schermo: la risposta è arrivata dopo,
       e non deve entrare nei conti che il tasto ha appena chiuso */
    if (!gira) return
    esito.giusto ? ok++ : no++
    secondi += esito.tempo
    fatte++
    chiavi.set(esito.chiave, (chiavi.get(esito.chiave) || 0) + 1)
    segna()
    if (gira) setTimeout(() => { if (gira) unGiro() }, 250)   // a raffica: si prova, non si gioca
  }

  function parti() {
    if (gira) return
    gira = true
    basta.hidden = false
    via.textContent = 'Sta girando…'
    unGiro()
  }

  /* La domanda a schermo la sta aspettando una promessa che non
     risolverà più: si toglie il velo a mano, o resterebbe lì sopra i
     conti che si è venuti a leggere. */
  function ferma() {
    gira = false
    basta.hidden = true
    via.textContent = fatte ? 'Riprendi' : 'Fammi una domanda'
    document.querySelectorAll('.quiz-velo').forEach(v => v.remove())
    segna()
  }

  via.addEventListener('click', parti)
  segna()
}
