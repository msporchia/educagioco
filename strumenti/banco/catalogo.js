/* ═══════════════════════════════════════════════════════════════════
   IL CATALOGO DELLE TESSITURE — ognuna da sola, con i suoi modi

   Il banco (`banco.js`) risponde a «come viene questa stanza». Questo
   risponde a un'altra domanda, che prima non aveva un posto dove farsi
   fare: **come viene questa tessitura**, da sola, in tutti i modi che
   sa fare e con qualche seme diverso.

   Serve perché da quando i disturbi stanno DENTRO al pittore — un muro
   di mattoni sa venire nuovo, vecchio o mezzo caduto — la varianza non
   si giudica più guardando una stanza: lì le tessiture si coprono a
   vicenda e quello che vedi è la loro mescolanza. Qui invece ogni
   riquadro è una tessitura sola, alla misura vera del gioco (una cella
   è 36 px), e si vede se un modo regge o se è solo rumore.

   Non c'è niente di finto: si chiamano gli stessi pittori che dipinge
   il fondale, con le stesse tinte dell'ambiente scelto.
   ═══════════════════════════════════════════════════════════════════ */
import { MURA, SUOLO } from '../../src/grafica/materiali/pattern.js'
import { AMBIENTI, NOMI_AMBIENTI } from '../../src/grafica/ambienti/indice.js'

const LATO = 36                  // la misura del gioco: si giudica lì
const LARGO = 6, ALTO = 3        // celle per riquadro
const SEMI = [0, 1, 2, 3]

const S = { ambiente: 'cripta', zoom: 1 }

/* Un pittore può chiedere una tinta che quell'ambiente non dichiara —
   il legno vuole `A.legno`, i cristalli `A.cristallo`. In una stanza
   non succede mai (chi usa quel pittore dichiara la sua tinta), ma il
   catalogo li disegna TUTTI con TUTTE le tavolozze: qui il ripiego è
   l'unione delle altre, così nessuna scheda resta bianca. */
const RIPIEGO = Object.assign({}, ...Object.values(AMBIENTI))

function riquadro(voce, famiglia, modo, seme) {
  const A = { ...RIPIEGO, ...AMBIENTI[S.ambiente] }
  const cv = document.createElement('canvas')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const lato = Math.round(LATO * S.zoom)
  const W = LARGO * lato, H = ALTO * lato
  cv.width = W * dpr; cv.height = H * dpr
  cv.style.width = W + 'px'; cv.style.height = H + 'px'
  const c = cv.getContext('2d')
  c.setTransform(dpr, 0, 0, dpr, 0, 0)

  /* il fondo dell'ambiente sotto, se no una tessitura con dei buchi si
     giudica sul bianco della pagina invece che sulla stanza */
  const g = c.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, A.fondo[0]); g.addColorStop(1, A.fondo[1])
  c.fillStyle = g; c.fillRect(0, 0, W, H)

  const v = voce({ modo, seme })
  try {
    // le due famiglie hanno la stessa firma da quando le pose non
    // pescano più `A.lastra` da sole: qui basta scegliere il ripiego
    // giusto quando la voce non porta le sue tinte
    const tinte = v.tinte || (famiglia === 'muro' ? A.muro : A.lastra)
    const reg = { x0: 0, y0: 0, x1: W, y1: H }
    v.dipingi(c, reg, A, lato, tinte, null, { modo, seme })
  } catch (e) {
    /* una tessitura che non regge queste tinte lo dice invece di
       fermare il catalogo: è un'informazione, non un guasto da nascondere */
    c.fillStyle = '#e0554d'; c.font = '11px ui-monospace, monospace'
    c.fillText(String(e.message).slice(0, 40), 8, 18)
  }
  return cv
}

function scheda(nome, voce, famiglia) {
  const modi = voce.modi || ['normale']
  const box = document.createElement('section')
  box.className = 'tessitura'
  const h = document.createElement('h3')
  h.innerHTML = `${nome} <span>${famiglia}</span>`
  box.appendChild(h)
  for (const modo of modi) {
    const riga = document.createElement('div')
    riga.className = 'riga'
    const et = document.createElement('div')
    et.className = 'modo'
    et.textContent = modo
    riga.appendChild(et)
    const strip = document.createElement('div')
    strip.className = 'strip'
    for (const seme of SEMI) {
      const cella = document.createElement('figure')
      cella.appendChild(riquadro(voce, famiglia, modo === 'normale' ? null : modo, seme))
      const cap = document.createElement('figcaption')
      cap.textContent = 'seme ' + seme
      cella.appendChild(cap)
      strip.appendChild(cella)
    }
    riga.appendChild(strip)
    box.appendChild(riga)
  }
  return box
}

function costruisci() {
  const dove = document.getElementById('elenco')
  dove.textContent = ''
  for (const [nome, voce] of Object.entries(MURA)) dove.appendChild(scheda(nome, voce, 'muro'))
  for (const [nome, voce] of Object.entries(SUOLO)) dove.appendChild(scheda(nome, voce, 'suolo'))
}

export function avvia() {
  const amb = document.getElementById('ambiente')
  for (const n of NOMI_AMBIENTI) {
    const o = document.createElement('option')
    o.value = n; o.textContent = n
    if (n === S.ambiente) o.selected = true
    amb.appendChild(o)
  }
  amb.addEventListener('change', e => { S.ambiente = e.target.value; costruisci() })
  document.getElementById('zoom').addEventListener('input', e => {
    S.zoom = +e.target.value
    document.getElementById('nota-zoom').textContent =
      `${S.zoom.toFixed(1)}× · cella ${Math.round(LATO * S.zoom)} px`
    costruisci()
  })
  costruisci()
}

window.__catalogo = { S, costruisci }
