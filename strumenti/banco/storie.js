/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DELLE STORIE DISEGNATE — «prima e dopo», in fila

   Nessun test guarda i pixel (CLAUDE.md è esplicito sul perché), e per
   un gioco il cui contenuto *è* il disegno quel silenzio pesa: una
   faccia triste che viene uguale a una serena non fa scattare niente di
   rosso, e la storia diventa muta senza che nessuno se ne accorga.
   Questa pagina non controlla, **mostra**.

   Tre riquadri, e sono tre domande diverse:

     1. LE STORIE      la striscia com'è in partita: si legge il verso
                       senza sapere niente, guardando solo i disegni?
     2. LE SCENE       ogni scheda da sola, grande, col suo nome — è qui
                       che si vede se una figura è storta
     3. LE FACCE       le cinque facce sulle tre persone, in griglia: è
                       il pezzo che porta l'informazione, e va confrontato
                       fianco a fianco o le differenze si perdono

   Si apre con `npm run storie` (da Vite: i moduli veri di `src/` da
   `file://` non si caricano, come già per `vetrina.html`), e con
   `npm run storie -- --host` si guarda dal telefono, che è l'unico posto
   dove si vede la taglia vera di una vignetta.
   ═══════════════════════════════════════════════════════════════════ */
import { SCENE, CHIAVI_SCENE, guastiDelleScene } from '../../src/giochi/prima-dopo/dati/scene.js'
import { STORIE } from '../../src/giochi/prima-dopo/dati/storie.js'
import { PITTORI, scena, LATO } from '../../src/giochi/prima-dopo/scena/tela.js'
import { LUOGHI } from '../../src/giochi/prima-dopo/scena/cose.js'
import { pennello } from '../../src/grafica/tela.js'

const FACCE = ['serena', 'contenta', 'triste', 'piange', 'spavento']
const CHI = ['bimba', 'bimbo', 'grande']

/* un canvas quadrato che dipinge una scheda: lo stesso patto della tela
   del gioco (mondo 100×100), rifatto qui in tre righe per non dipendere
   da Vue */
function riquadro(lato, disegna) {
  const cv = document.createElement('canvas')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  cv.width = Math.round(lato * dpr); cv.height = Math.round(lato * dpr)
  cv.style.width = lato + 'px'; cv.style.height = lato + 'px'
  const ctx = cv.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.scale(lato / LATO, lato / LATO)
  const p = pennello(ctx, { W: LATO, H: LATO, S: 1 })
  p.tempo = 0
  try {
    disegna(p)
  } catch (e) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#2a1414'; ctx.fillRect(0, 0, lato, lato)
    ctx.fillStyle = '#ff9a9a'; ctx.font = '600 10px ui-monospace, monospace'
    ctx.textAlign = 'center'; ctx.fillText('errore', lato / 2, lato / 2)
    console.error(e)
  }
  return cv
}

function figura(lato, etichetta, disegna) {
  const fig = document.createElement('figure')
  fig.appendChild(riquadro(lato, disegna))
  if (etichetta) {
    const cap = document.createElement('figcaption')
    cap.textContent = etichetta
    fig.appendChild(cap)
  }
  return fig
}

function sezione(titolo, dritta) {
  const box = document.createElement('section')
  box.className = 'riquadro'
  const h = document.createElement('h2')
  h.textContent = titolo
  box.appendChild(h)
  if (dritta) {
    const p = document.createElement('p')
    p.textContent = dritta
    box.appendChild(p)
  }
  return box
}

/* ═══════════ 1. le storie, come si vedono in partita ═══════════ */
function disegnaStorie(dove, lato) {
  const box = sezione('Le storie',
    'La striscia com\'è nel gioco. La domanda da farsi guardandola: il verso si capisce senza sapere cosa racconta?')
  for (const s of STORIE.filter(s => s.passi.some(p => SCENE[p]))) {
    const riga = document.createElement('div')
    riga.className = 'storia'
    const nome = document.createElement('h3')
    nome.innerHTML = `${s.nome} <code>${s.chiave}</code> <span class="tenue">${s.categoria}</span>`
    riga.appendChild(nome)
    const striscia = document.createElement('div')
    striscia.className = 'striscia'
    s.passi.forEach((passo, i) => {
      if (SCENE[passo]) {
        striscia.appendChild(figura(lato, `${i + 1}. ${passo}`, p => scena(p, SCENE[passo])))
      } else {
        const fig = document.createElement('figure')
        fig.className = 'emoji'
        fig.innerHTML = `<div style="width:${lato}px;height:${lato}px">${passo}</div>` +
          `<figcaption>${i + 1}. emoji</figcaption>`
        striscia.appendChild(fig)
      }
    })
    riga.appendChild(striscia)
    box.appendChild(riga)
  }
  dove.appendChild(box)
}

/* ═══════════ 2. ogni scena da sola ═══════════ */
function disegnaScene(dove, lato) {
  const box = sezione('Le scene', `${CHIAVI_SCENE.length} schede, una per una, col nome con cui le chiama una storia.`)
  const griglia = document.createElement('div')
  griglia.className = 'griglia'
  for (const chiave of CHIAVI_SCENE)
    griglia.appendChild(figura(lato * 1.6, chiave, p => scena(p, SCENE[chiave])))
  box.appendChild(griglia)
  dove.appendChild(box)
}

/* ═══════════ 3. le facce, fianco a fianco ═══════════ */
function disegnaFacce(dove, lato) {
  const box = sezione('Le facce',
    'La stessa persona, cinque facce. Se due si somigliano troppo, la storia che le usa non si legge.')
  for (const chi of CHI) {
    const riga = document.createElement('div')
    riga.className = 'storia'
    const nome = document.createElement('h3')
    nome.innerHTML = `<code>${chi}</code>`
    riga.appendChild(nome)
    const striscia = document.createElement('div')
    striscia.className = 'striscia'
    for (const faccia of FACCE)
      striscia.appendChild(figura(lato * 1.4, faccia, p => {
        LUOGHI.bagno(p)
        PITTORI[chi](p, { che: chi, x: 50, dir: 'giu', faccia })
      }))
    // e di profilo, che è come stanno quando si parlano
    striscia.appendChild(figura(lato * 1.4, 'di profilo', p => {
      LUOGHI.bagno(p)
      PITTORI[chi](p, { che: chi, x: 50, dir: 'dx', faccia: 'contenta' })
    }))
    striscia.appendChild(figura(lato * 1.4, 'cammina', p => {
      LUOGHI.bagno(p)
      PITTORI[chi](p, { che: chi, x: 50, dir: 'dx', passo: 1, faccia: 'serena' })
    }))
    riga.appendChild(striscia)
    box.appendChild(riga)
  }
  dove.appendChild(box)
}

/* ═══════════ i guasti a freddo, in cima ═══════════ */
function disegnaGuasti(dove) {
  const guasti = guastiDelleScene(SCENE, LUOGHI, PITTORI)
  if (!guasti.length) return
  const box = sezione('Guasti', 'Quello che i controlli a freddo hanno trovato senza guardare i pixel.')
  const ul = document.createElement('ul')
  ul.className = 'guasti'
  for (const g of guasti) {
    const li = document.createElement('li')
    li.textContent = g
    ul.appendChild(li)
  }
  box.appendChild(ul)
  dove.appendChild(box)
}

export function avvia() {
  const dove = document.getElementById('tavola')
  const misura = document.getElementById('taglia')
  const ridisegna = () => {
    const lato = Number(misura.value)
    dove.textContent = ''
    document.getElementById('quanto').textContent = lato + ' px'
    disegnaGuasti(dove)
    disegnaStorie(dove, lato)
    disegnaScene(dove, lato)
    disegnaFacce(dove, lato)
  }
  misura.addEventListener('input', ridisegna)
  ridisegna()
}
