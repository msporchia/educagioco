/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DEI PAESAGGI — i dieci posti, alla taglia vera

   Nessun test guarda i pixel, e per un disegno che *è* il contenuto
   della domanda quel silenzio pesa: due paesaggi che si somigliano non
   fanno scattare niente di rosso, e il bambino sbaglia una domanda che
   sapeva. Questa pagina non controlla, **mostra**.

   Tre riquadri, e sono tre domande diverse:

     1. I DIECI POSTI     ognuno col suo nome, alla taglia del cursore —
                          si riconosce, e si riconosce *da solo*?
     2. COME IN PARTITA   quattro affiancati sotto un animale, che è
                          l'unico confronto che conta davvero: due che
                          si somigliano si vedono solo vicini
     3. IL CASO PEGGIORE  tutti e dieci a 52 px, la misura minima di un
                          tasto su un telefono stretto

   E il tasto «prova una domanda vera» monta la domanda col codice del
   gioco (`quiz/grafica/scheda.js`), per vedere figura e nome insieme
   come li vedrà un bambino.

       npm run ambienti              e si apre da solo
       npm run ambienti -- --host    e si guarda dal telefono
   ═══════════════════════════════════════════════════════════════════ */
import { AMBIENTI, PITTORI_AMBIENTI, scenaAmbiente } from '../../src/quiz/grafica/pittori/ambienti.js'
import { dipingi } from '../../src/quiz/grafica/riquadro.js'
import { sorteQualunque } from '../../src/quiz/nucleo/sorte.js'
import { mostra } from '../../src/quiz/grafica/scheda.js'
/* le domande le fa IL MODULO VERO, non una copia scritta qui: una
   seconda tabella di animali diventerebbe diversa dalla prima al primo
   ritocco, e questa pagina serve proprio a giudicare quella lì */
import animali from '../../src/quiz/moduli/animali.js'

let taglia = 118

/* un canvas dipinto col codice vero del gioco: `dipingi` legge la
   misura dal CSS, quindi la larghezza va messa prima di dipingere */
function riquadro(id, lato) {
  const cv = document.createElement('canvas')
  cv.style.width = lato + 'px'
  cv.style.height = lato + 'px'
  requestAnimationFrame(() => dipingi(cv, PITTORI_AMBIENTI, scenaAmbiente(id)))
  return cv
}

function figura(a, lato, conNomeSotto = true) {
  const fig = document.createElement('figure')
  fig.appendChild(riquadro(a.id, lato))
  if (conNomeSotto) {
    const cap = document.createElement('figcaption')
    cap.textContent = a.nome
    fig.appendChild(cap)
  }
  return fig
}

function riquadroPagina(titolo, spiega) {
  const box = document.createElement('section')
  box.className = 'riquadro'
  const h = document.createElement('h2')
  h.textContent = titolo
  const p = document.createElement('p')
  p.innerHTML = spiega
  box.append(h, p)
  return box
}

/* ── 1. i dieci posti ── */
function tuttiEDieci() {
  const box = riquadroPagina('I dieci posti',
    'Alla taglia del cursore. La prova è guardarne uno alla volta coprendo il nome: ' +
    'se serve leggerlo, il disegno non ha fatto il suo mestiere.')
  const g = document.createElement('div')
  g.className = 'griglia'
  g.id = 'tutti'
  for (const a of AMBIENTI) g.appendChild(figura(a, taglia))
  box.appendChild(g)
  return box
}

/* ── 2. quattro come in una domanda ── */
function comeInPartita() {
  const box = riquadroPagina('Come in partita',
    'Un animale e quattro posti, nella carta vera del quiz. È l\'unico confronto che conta: ' +
    'due paesaggi che si somigliano si vedono solo affiancati.')
  const d = document.createElement('div')
  d.className = 'domanda'
  d.id = 'partita'
  box.appendChild(d)
  return box
}

function riempiPartita() {
  const d = document.getElementById('partita')
  if (!d) return
  d.textContent = ''
  /* grado 2: i posti del mondo, cioè il caso in cui i quattro riquadri
     sono tutti paesaggi lontani — il confronto più difficile */
  const q = animali.chiedi(2, sorteQualunque())

  const consegna = document.createElement('div')
  consegna.className = 'consegna'
  consegna.textContent = q.testo
  const sogg = document.createElement('div')
  sogg.className = 'soggetto'
  sogg.textContent = q.soggetto?.emoji || ''
  const tasti = document.createElement('div')
  tasti.className = 'tasti'
  for (const r of q.risposte) {
    const t = document.createElement('div')
    t.className = 'tasto'
    if (r.scena) t.appendChild(riquadro(r.scena.dove, 118))
    const n = document.createElement('span')
    n.textContent = r.nome ?? r.testo ?? r.emoji
    t.append(n)
    tasti.appendChild(t)
  }
  d.append(consegna, sogg, tasti)
}

/* ── 3. il caso peggiore ── */
function casoPeggiore() {
  const box = riquadroPagina('Il caso peggiore — 52 px',
    'La misura minima di un tasto su un telefono stretto. Qui non esiste nessun dettaglio: ' +
    'restano la massa di colore e la silhouette, e se due si confondono si confondono qui.')
  const g = document.createElement('div')
  g.className = 'griglia'
  for (const a of AMBIENTI) g.appendChild(figura(a, 52))
  box.appendChild(g)
  return box
}

/* ── la domanda vera, col codice del gioco ──
   Il grado gira a ogni giro: così si vedono anche l'intruso e l'indizio
   nel corpo, che non sono domande su un paesaggio ma li usano. */
let giro = 0
function domandaVera() {
  const grado = (giro++ % animali.gradi) + 1
  const d = animali.chiedi(grado, sorteQualunque())
  mostra(d, animali.pittori, { titolo: `${animali.icona} <b>${animali.nome}</b> · grado ${grado}` })
    .then(() => setTimeout(domandaVera, 250))
}

export function avvia() {
  const tavola = document.getElementById('tavola')
  tavola.append(tuttiEDieci(), comeInPartita(), casoPeggiore())
  riempiPartita()

  const cursore = document.getElementById('taglia')
  const quanto = document.getElementById('quanto')
  cursore.addEventListener('input', () => {
    taglia = +cursore.value
    quanto.textContent = taglia + ' px'
    const g = document.getElementById('tutti')
    g.textContent = ''
    for (const a of AMBIENTI) g.appendChild(figura(a, taglia))
  })
  document.getElementById('mescola').addEventListener('click', riempiPartita)
  document.getElementById('prova').addEventListener('click', domandaVera)
}
