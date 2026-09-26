/* ═══════════════════════════════════════════════════════════════════
   I PITTORI A SPRITE — torri e mostri presi da un foglio

   La stessa tabella di `grafica/castello/indice.js`, con quattro righe
   cambiate. Il campo manda la stessa scena di sempre
   (`views/castello/scena.js`) e non sa chi la dipinge:

     torre     la figura del foglio di agosto per tipo, stadio e ramo,
               appoggiata sulla piazzola, col gettone del livello e il ＋
               di sempre (`targhe`, lo stesso disegno del castello a
               poligoni: la figura cambia, quello che dice no)
     mostro    la creatura del sotterraneo che fa le sue veci, coi
               quattro fotogrammi del respiro, girata verso dove va, con
               la barra della vita, il gelo e la resistenza di sempre
     castello  niente: è già nel fondale (`vestito.js`)
     piazzola, raggio, colpo, schizzo, ingresso   quelli di sempre. La
               freccia dell'ingresso resta anche se la bocca è dipinta:
               non dice dov'è la bocca, dice **da quale** scende
               l'ondata, e con due bocche è un fatto di gioco.

   Finché il foglio delle figure non è decodificato — il primo
   fotogramma, o poco più — torri e mostri li disegnano i pittori a
   poligoni: meglio una torre di un altro stile per un attimo che un
   campo vuoto su cui si è appena speso.

   ── le misure ──
   Un pixel del foglio vale quanto un pixel della carta vestita: una
   cella è 64 px lì e `MONDO.W / 12` unità qui. Le figure si prendono
   alla misura del loro foglio, come in `strumenti/sprite/prova-battaglia.py`,
   perché lì hanno la grana della scena.
   ═══════════════════════════════════════════════════════════════════ */
import { PITTORI } from '../../../grafica/castello.js'
import { targhe } from '../../../grafica/castello/torri.js'
import { TINTA } from '../../../grafica/castello/tinte.js'
import { TORRI, stadioDi } from '../../../data/ops.js'
import { MONDO } from '../../../data/castello.js'
import { COLONNE } from '../motore/carta.js'
import { CELLA } from '../dati/vestiti.js'
import { IMMAGINE, PEZZI, CREATURE } from '../dati/figure.js'

/* quante unità del mondo vale un pixel del foglio */
export const UNITA = MONDO.W / COLONNE / CELLA

/* ── chi fa le veci di chi ──
   I mostri del castello sono diciotto, le creature ritagliate sette. Un
   mostro vale l'altro (parole dell'utente), quindi quelli senza la loro
   figura ne prendono una che le somiglia almeno nel modo di muoversi —
   chi vola prende chi vola, perché l'ombra staccata da terra lo dice
   comunque.
   TODO: quando le altre undici creature sono ritagliate dai fogli del
   sotterraneo (la tabella è in `strumenti/sprite/DA-GENERARE.md`),
   ognuno la sua — e le righe col commento se ne vanno. */
export const FIGURA_DI = {
  slime: 'melma',
  pipistrello: 'pipistrello',
  fantasma: 'fantasma',
  golem: 'golem',
  lupo: 'lupo',
  verme: 'serpente',
  troll: 'troll',
  goblin: 'troll',          // lo scheletro con spada e scudo
  ragno: 'lupo',            // il ragno nero
  orco: 'troll',            // lo zombie verde
  scheletro: 'golem',       // lo scheletro
  arpia: 'fantasma',        // il grifone
  drago: 'pipistrello',     // il drago rosso
  corvo: 'pipistrello',     // il pipistrello con l'occhio
  rovo: 'serpente',         // la pianta carnivora
  blatta: 'melma',          // lo scorpione
  corazziere: 'golem',      // la tartaruga corazzata
  balestriere: 'troll',     // il diavoletto
}
const creaturaDi = bestia => (CREATURE.includes(FIGURA_DI[bestia]) ? FIGURA_DI[bestia] : CREATURE[0])
const fotogrammi = {}
for (const nome of Object.keys(PEZZI)) {
  const [fam, chi] = nome.split(':')
  if (fam === 'mostro') (fotogrammi[chi] ||= []).push(nome)
}

/* il nome della figura di una torre: il ramo conta dallo stadio di mezzo
   in su, e una torre salita senza ramo (le tappe senza rami) tiene la
   sua colonna */
export function figuraTorre(tipo, lv, ramo) {
  const aspetto = TORRI[tipo].aspetto
  const stadio = stadioDi(lv)
  const conRamo = `torre:${aspetto}:${stadio}:${stadio ? ramo || '' : ''}`
  return PEZZI[conRamo] ? conRamo : `torre:${aspetto}:${stadio}:`
}

/* ── il foglio ── */
let img = null
let attesa = null
export function caricaFigure() {
  if (attesa) return attesa
  attesa = new Promise((risolvi, rifiuta) => {
    const i = new Image()
    i.onload = () => { img = i; risolvi(i) }
    i.onerror = () => rifiuta(new Error('figure del castello non caricate'))
    i.src = IMMAGINE
  })
  return attesa
}

/* una figura col piede in (x, y), larga e alta quanto nel foglio */
function figura(ctx, nome, x, y, { specchia = false } = {}) {
  const [sx, sy, w, h] = PEZZI[nome]
  const lw = w * UNITA, lh = h * UNITA
  if (specchia) {
    ctx.save(); ctx.translate(x, y - lh); ctx.scale(-1, 1)
    ctx.drawImage(img, sx, sy, w, h, -lw / 2, 0, lw, lh); ctx.restore()
  } else ctx.drawImage(img, sx, sy, w, h, x - lw / 2, y - lh, lw, lh)
  return { lw, lh }
}

/* ── la torre ──
   Il piede sta un po' sotto il centro della piazzola, come nella
   battaglia finta: la base della figura copre la metà bassa della
   pietra, e la torre sembra piantata lì invece che appoggiata sopra. */
const PIEDE_TORRE = 22 * UNITA
function torre(p, cosa) {
  if (!img) return PITTORI.torre(p, cosa)
  const { x, y, tipo, lv, ramo, potenziabile, posso } = cosa
  const base = y + PIEDE_TORRE
  p.ellisse(x, base - 1.5 * p.S, 14 * p.S, 4.5 * p.S, '#00000033')
  figura(p.ctx, figuraTorre(tipo, lv, ramo), x, base)
  targhe(p, x, y, lv, potenziabile, posso)
}

/* ── il mostro ──
   Il piede sulla strada, un filo sotto la sua mezzeria (10 px del
   foglio, come nella battaglia finta): la strada è larga e un mostro
   che ci cammina esattamente in mezzo sembra appeso. */
const PIEDE_MOSTRO = 10 * UNITA
function mostro(p, cosa) {
  if (!img) return PITTORI.mostro(p, cosa)
  const { x, y, bestia, vita = 1, gelo = 0, vola = false, resiste = null, verso = 0 } = cosa
  const S = p.S
  const chi = creaturaDi(bestia)
  const pose = fotogrammi[chi]
  /* il respiro: cinque fotogrammi al secondo, sfasati per posto così una
     fila di melme non respira all'unisono */
  const n = pose[Math.floor(p.tempo * 5 + x * 0.07 + y * 0.05) % pose.length]
  const piede = y + PIEDE_MOSTRO
  const alto = vola ? -9 * S + Math.sin(p.tempo * 2.6 + x * 0.05) * 2.2 * S : 0
  p.velo(vola ? 0.5 : 1, () => p.ellisse(x, piede - 1 * S, 9 * S, 3 * S, '#00000033'))
  /* le figure del foglio guardano a destra: chi va a sinistra si specchia */
  const { lh } = figura(p.ctx, n, x, piede + alto, { specchia: verso < 0 })
  const cima = piede + alto - lh
  if (gelo > 0) {
    // il gelo: un velo azzurro sul corpo e tre schegge, come nel castello a poligoni
    const cy = piede + alto - lh * 0.45, r = Math.max(9 * S, lh * 0.45)
    p.velo(0.4, () => p.ellisse(x, cy, r * 0.9, r, '#bfe6ff'))
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * 6.29 + 0.6
      p.figura([[x + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7],
                [x + Math.cos(a + 0.5) * r * 0.95, cy + Math.sin(a + 0.5) * r * 0.95],
                [x + Math.cos(a - 0.3) * r, cy + Math.sin(a - 0.3) * r]], '#e8f7ff')
    }
  }
  // la barra della vita sopra la testa, ferma anche se il mostro vola
  const sopra = Math.min(cima, piede - 16 * S) - 4 * S
  const w = 15 * S, q = Math.max(0, Math.min(1, vita))
  p.rett(x - w / 2 - 0.7 * S, sopra - 0.7 * S, w + 1.4 * S, 2.6 * S + 1.4 * S, '#00000055')
  p.rett(x - w / 2, sopra, w * q, 2.6 * S, q > 0.5 ? '#38c172' : q > 0.25 ? '#ffc93c' : '#ff5c7a')
  /* la resistenza: il pallino sbarrato del colore della torre che non gli
     fa male — lo stesso segno del castello a poligoni (`grafica/castello/mostro.js`) */
  if (resiste && TINTA[resiste]) {
    const cx = x + w / 2 + 3 * S, cy = sopra + 1.3 * S, r = 2.6 * S
    p.cerchio(cx, cy, r, '#ffffffcc')
    p.cerchio(cx, cy, 1.8 * S, TINTA[resiste].chiaro)
    p.linea([{ x: cx - 1.9 * S, y: cy + 1.9 * S }, { x: cx + 1.9 * S, y: cy - 1.9 * S }], '#3a3348', 0.9 * S)
  }
}

export const PITTORI_SPRITE = { ...PITTORI, torre, mostro, castello: () => {} }
