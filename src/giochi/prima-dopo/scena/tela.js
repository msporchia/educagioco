/* ═══════════════════════════════════════════════════════════════════
   LA TELA DI UNA VIGNETTA — un quadrato, una scheda, un disegno

   Riceve una **scheda** (`dati/scene.js`) e la dipinge. Di regole non sa
   niente: non sa cos'è una storia, non sa che quella vignetta è la
   risposta giusta, non sa nemmeno che esista una domanda.

   Il patto con chi disegna è quello dei quiz
   (`quiz/grafica/riquadro.js`, che fa la stessa cosa per le loro
   risposte disegnate): si lavora sempre in un quadrato di 100×100 e
   nessun pittore legge `canvas.width`. Le due copie sono volutamente
   separate finché questo è un prototipo — il giorno che il cassetto
   disegnato diventa di due giochi, è quella la funzione che resta e
   questa sparisce.

   ── LA SCALA STA IN UN POSTO SOLO ──
   `ctx.setTransform(dpr…)` una volta, poi `ctx.scale(lato/100)` una
   volta, e da lì in poi tutto è in unità del mondo. Chi moltiplica per
   la scala riga per riga prima o poi la moltiplica due volte, ed è
   invisibile a figura piccola (è il difetto che il bestiario ha già
   pagato una volta).

   ── PERCHÉ NON C'È NESSUNA ANIMAZIONE ──
   Una vignetta è ferma, come il ritratto di un mostro nel nastro del
   castello. `p.tempo` resta a zero, e gli stati che pulsano (l'errore
   rosso, il lampo bianco) qui non si usano: quello che deve dire una
   vignetta lo dice la posa.
   ═══════════════════════════════════════════════════════════════════ */
import { pennello } from '../../../grafica/tela.js'
import { persona } from '../../../grafica/corpo.js'
import { PERSONE, ginocchio } from './persone.js'
import { COSE } from './cose.js'
import { LUOGHI, LATO, SUOLO } from './luoghi.js'
/* il gatto non è di questo gioco: è quello del Generale e del dungeon,
   chiamato con una taglia diversa. È il primo pezzo del cassetto vecchio
   che serve qui dentro, e mostra da che parte va la strada — le figure
   si condividono, le *schede* di scena no. */
import { PITTORI_PERSONE } from '../../../grafica/personaggi/indice.js'

/* Quanto è grande una persona in una vignetta: un bambino viene alto
   circa 44 unità su 100, cioè poco meno di metà riquadro. Più grande
   sbatteva contro il bordo di sopra nelle scene con due figure, più
   piccolo perdeva la faccia — che è tutto il motivo per cui si disegna. */
const SCALA_PERSONA = 2.55

/* ─────────── una persona in scena ───────────
   Traduce la voce della scheda in quello che `corpo.js` si aspetta, e
   niente di più: `dir`, `passo`, `stato` sono i suoi, `faccia` la legge
   solo la testa di `persone.js`, e il ginocchio si posa dopo, addosso. */
function mettiPersona(p, c, cfg) {
  const s = SCALA_PERSONA * (cfg.taglia || 1) * (c.taglia || 1)
  const y = c.y === undefined ? SUOLO : c.y
  const cosa = {
    x: 0, y: 0,
    dir: c.dir || 'giu',
    passo: c.passo || 0,
    stato: c.stato || 'normale',
    faccia: c.faccia,
    taglia: c.taglia,
    /* `tinta` mescola un colore in tutta la tavolozza (`corpo.js`): nel
       castello distingue due squadre, qui dice che uno ha freddo */
    tinta: c.tinta,
    mano: c.mano,
  }
  p.in(c.x, y, q => {
    persona(q, cosa, SCALA_PERSONA, cfg)
    if (c.ginocchio) ginocchio(q, s, c.ginocchio)
  }, c.inclina || 0)
}

/* la tabella: nome → come si mette in scena. Le persone e le cose
   stanno nello stesso elenco apposta — chi scrive una scheda non deve
   sapere quali delle due sta mettendo, solo dove va. */
export const PITTORI = {}
for (const [nome, cfg] of Object.entries(PERSONE))
  PITTORI[nome] = (p, c) => mettiPersona(p, c, cfg)
for (const [nome, fn] of Object.entries(COSE))
  PITTORI[nome] = fn

/* le bestie prese in prestito dal cassetto grande. Il gatto è l'unica
   per ora, e serve a una storia sola (un gattino che diventa gatto):
   ridisegnarlo qui sarebbe stato un secondo gatto da tenere allineato
   al primo per sempre. */
for (const nome of ['gatto'])
  PITTORI[nome] = (p, c) => p.in(c.x, c.y === undefined ? SUOLO : c.y,
    q => PITTORI_PERSONE[nome](q, {
      x: 0, y: 0, dir: c.dir || 'giu', passo: c.passo || 0,
      stato: c.stato || 'normale', taglia: c.taglia, manto: c.manto,
    }, SCALA_PERSONA))

/* Dipinge una scheda su un pennello già pronto. Sta staccata da
   `dipingiScena` perché il banco di prova disegna molte vignette su una
   tela sola, e non deve rifare il canvas ogni volta. */
export function scena(p, scheda) {
  if (!scheda) return
  const dipingi = q => {
    const luogo = LUOGHI[scheda.luogo]
    if (luogo) luogo(q)
    for (const c of scheda.cose || []) {
      const pittore = PITTORI[c.che]
      /* una cosa senza pittore lascia la vignetta com'è invece di far
         esplodere la pagina: una figura mancante è meglio di un gioco
         morto, e `guastiDelleScene` la trova comunque a freddo */
      if (pittore) pittore(q, c)
    }
  }

  /* ── LA TELECAMERA ──
     Il primo giro disegnava la figura intera in mezzo al paesaggio, e a
     settanta pixel di vignetta il risultato era una macchia colorata con
     sopra una faccia di quattro pixel — cioè esattamente l'informazione
     per cui si è smesso di usare le emoji, buttata via nell'inquadratura.
     Una vignetta è un fumetto, non una fotografia: si sta addosso.

     Chi scrive una scheda continua a ragionare in coordinate normali
     (i piedi a `SUOLO`, il riquadro da 0 a 100) e poi dichiara **da
     dove si guarda**: `inquadra: { zoom, x, y }`. Senza, si vede tutto
     il riquadro come prima. */
  const inq = scheda.inquadra
  if (!inq) return dipingi(p)
  const z = inq.zoom || 1
  const cx = inq.x === undefined ? LATO / 2 : inq.x
  const cy = inq.y === undefined ? 55 : inq.y
  p.in(LATO / 2, LATO / 2, q => {
    q.ctx.scale(z, z)
    q.ctx.translate(-cx, -cy)
    dipingi(q)
  })
}

/* Dipinge una scheda dentro un canvas quadrato. */
export function dipingiScena(canvas, scheda) {
  const lato = Math.max(1, Math.round(canvas.clientWidth || canvas.width || 96))
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
  canvas.width = Math.round(lato * dpr)
  canvas.height = Math.round(lato * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, lato, lato)
  ctx.save()
  ctx.scale(lato / LATO, lato / LATO)
  const p = pennello(ctx, { W: LATO, H: LATO, S: 1 })
  p.tempo = 0
  scena(p, scheda)
  ctx.restore()
  return p
}

export { LATO, SUOLO }
