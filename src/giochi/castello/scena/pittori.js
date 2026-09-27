/* ═══════════════════════════════════════════════════════════════════
   I PITTORI A SPRITE — torri e mostri presi da un foglio

   La stessa tabella di `grafica/castello/indice.js`, con quattro righe
   cambiate. Il campo manda la stessa scena di sempre
   (`views/castello/scena.js`) e non sa chi la dipinge:

     torre     la figura del foglio di agosto per tipo, stadio e ramo,
               appoggiata sulla piazzola, col gettone del livello e il ＋
               di sempre (`targhe`, lo stesso disegno del castello a
               poligoni: la figura cambia, quello che dice no)
     mostro    la creatura che fa le sue veci in questo vestito
               (`bestiario.js`): coi passi di lato o di fronte se il suo
               foglio del cammino c'è, se no coi fotogrammi del respiro,
               girata verso dove va, con la barra della vita, il gelo, il
               segno «immune» e la corona del capo di sempre — il capo è
               la stessa figura più grande, chi è a terra la stessa
               figura stesa
     ritratto  la stessa creatura ferma, grande quanto il riquadro: per
               il nastro di chi arriva e per la scheda del mostro in campo
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
import { segnoImmune, corona } from '../../../grafica/castello/mostro.js'
import { TORRI, stadioDi } from '../../../data/ops.js'
import { MONDO } from '../../../data/castello.js'
import { COLONNE } from '../motore/carta.js'
import { CELLA } from '../dati/vestiti.js'
import { IMMAGINE, PEZZI, CREATURE } from '../dati/figure.js'
import { figuraDi } from './bestiario.js'

/* quante unità del mondo vale un pixel del foglio */
export const UNITA = MONDO.W / COLONNE / CELLA

/* ── chi fa le veci di chi ──
   Lo dice il bestiario, vestito per vestito. Il vestito è quello della
   tappa che il campo sta giocando: lo scrive la pelle quando apparecchia
   (`usaVestito`), e da lì lo leggono il campo, il nastro e la scheda —
   di campi ce n'è uno alla volta. */
let vestito = 'bosco'
export function usaVestito(nome) { vestito = nome }
export const creaturaDi = bestia => {
  const chi = figuraDi(vestito, bestia)
  return CREATURE.includes(chi) ? chi : CREATURE[0]
}

/* le pose di ogni creatura, dai nomi dei pezzi: `mostro:<chi>:<n>` è il
   respiro, `mostro:<chi>:lato:<n>` e `…:fronte:<n>` i passi */
const pose = {}
for (const nome of Object.keys(PEZZI)) {
  const [fam, chi, verso, n] = nome.split(':')
  if (fam !== 'mostro') continue
  const p = (pose[chi] ||= { respiro: [], lato: [], fronte: [] })
  p[n === undefined ? 'respiro' : verso].push(nome)
}

/* quale fila di pose per chi cammina in quel verso: di lato se va a
   destra o a sinistra, di fronte se scende (o sale: di spalle non c'è),
   e il respiro dove i passi non ci sono */
function serieDi(chi, verso) {
  const p = pose[chi]
  const passi = verso ? p.lato : p.fronte
  if (passi.length) return { serie: passi, passi: true }
  return { serie: p.respiro.length ? p.respiro : p.fronte.length ? p.fronte : p.lato, passi: false }
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

/* una figura col piede in (x, y), larga e alta quanto nel foglio — per
   `scala`, che è 1 per tutti tranne il capo e i pezzi di chi si è diviso */
function figura(ctx, nome, x, y, { specchia = false, scala = 1 } = {}) {
  const [sx, sy, w, h] = PEZZI[nome]
  const lw = w * UNITA * scala, lh = h * UNITA * scala
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
   foglio a misura piena, 8 da quando i mostri stanno a metà: la
   strada è larga e un mostro
   che ci cammina esattamente in mezzo sembra appeso. */
const PIEDE_MOSTRO = 8 * UNITA
/* ── quanto grandi in campo ──
   I fogli delle creature sono dipinti alla grana delle scene, ma alla
   misura di un mostro del sotterraneo, dove una creatura è grande quanto
   l'eroe e riempie la sua cella. Qui la cella è di una torre: alla misura
   del foglio uno scorpione occupava tre volte la strada ed era grande
   quanto la torre che gli spara, e a vederlo non tornava. A metà si
   legge ancora bene, e la strada torna a essere una strada con dei
   mostri sopra. Vale per tutti: le proporzioni fra loro restano quelle
   del foglio (il golem più grosso della melma), e il capo è grande
   `taglia` volte questo. */
const MISURA_MOSTRI = 0.5
function mostro(p, cosa) {
  if (!img) return PITTORI.mostro(p, cosa)
  const { x, y, bestia, vita = 1, gelo = 0, vola = false, verso = 0,
          taglia = 1, capo = false, aTerra = false, respinto = 0 } = cosa
  const S = p.S
  const { serie, passi } = serieDi(creaturaDi(bestia), verso)
  /* il respiro a cinque fotogrammi al secondo, i passi a otto; sfasati
     per posto, così una fila di melme non respira all'unisono */
  const n = serie[Math.floor(p.tempo * (passi ? 8 : 5) + x * 0.07 + y * 0.05) % serie.length]
  const piede = y + PIEDE_MOSTRO
  const alto = vola && !aTerra ? -9 * S + Math.sin(p.tempo * 2.6 + x * 0.05) * 2.2 * S : 0
  p.velo(vola ? 0.5 : 1, () => p.ellisse(x, piede - 1 * S, 6 * S * taglia, 2 * S * taglia, '#00000033'))
  const scala = taglia * MISURA_MOSTRI
  if (aTerra) {
    /* a terra: stesa di fianco, sbiadita, e tre stelline che girano
       sopra — non è finita, fra un attimo si rialza. Stesa, la figura è
       alta quanto era larga: le stelline girano appena sopra quella
       misura, non a un'altezza fissa che a metà taglia le staccava */
    p.velo(0.55, () => p.in(x, piede - 4 * S, () =>
      figura(p.ctx, n, 0, 0, { scala }), Math.PI / 2))
    const sopra = piede - 4 * S - PEZZI[n][2] * UNITA * scala / 2 - 3 * S
    for (let i = 0; i < 3; i++) {
      const a = p.tempo * 4 + i * 2.09
      p.cerchio(x + Math.cos(a) * 8 * S, sopra + Math.sin(a) * 2.5 * S, 1.6 * S, '#ffe27a')
    }
    return
  }
  /* le figure del foglio guardano a destra (o chi guarda, quelle di
     fronte): chi va a sinistra si specchia */
  const { lh } = figura(p.ctx, n, x, piede + alto, { specchia: verso < 0, scala })
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
  /* la barra della vita sopra la testa, ferma anche se il mostro vola:
     si misura dalla testa senza l'ondeggio, e chi vola la tiene un filo
     più su perché ondeggiando non ci sbatta contro. Prima c'era un
     pavimento a sedici punti sopra il piede, che alla misura del foglio
     non scattava mai e a metà misura scattava sempre: la barra restava
     a mezz'aria sopra una melma alta la metà */
  const testa = piede + (vola ? -9 * S : 0) - lh
  const sopra = testa - (vola ? 4 : 2.5) * S
  const w = 15 * S * Math.min(taglia, 1.6), q = Math.max(0, Math.min(1, vita))
  p.rett(x - w / 2 - 0.7 * S, sopra - 0.7 * S, w + 1.4 * S, 2.6 * S + 1.4 * S, '#00000055')
  p.rett(x - w / 2, sopra, w * q, 2.6 * S, q > 0.5 ? '#38c172' : q > 0.25 ? '#ffc93c' : '#ff5c7a')
  /* il capo ha la corona, e chi è immune alla torre che gli ha appena
     sparato ha la sua pastiglia — gli stessi segni del castello a
     poligoni (`grafica/castello/mostro.js`) */
  if (capo) corona(p, x, sopra - 1.5 * S, S)
  segnoImmune(p, x, sopra - (capo ? 8 : 2) * S, respinto)
}

/* ── il ritratto ──
   Ferma o quasi: di fronte se c'è, se no il respiro, grande quanto il
   riquadro permette e centrata. La misura la dà il fotogramma più grande
   della serie, così respirando non cambia taglia. */
function ritratto(p, cosa) {
  if (!img) return PITTORI.ritratto ? PITTORI.ritratto(p, cosa) : null
  const chi = creaturaDi(cosa.bestia)
  const pp = pose[chi]
  const serie = pp.fronte.length ? pp.fronte : pp.respiro.length ? pp.respiro : pp.lato
  const W = Math.max(...serie.map(k => PEZZI[k][2])), H = Math.max(...serie.map(k => PEZZI[k][3]))
  const s = Math.min(p.W, p.H) * 0.94 / Math.max(W, H)
  const [sx, sy, w, h] = PEZZI[serie[Math.floor((p.tempo || 0) * 5) % serie.length]]
  p.ctx.imageSmoothingQuality = 'high'
  p.ctx.drawImage(img, sx, sy, w, h, p.W / 2 - w * s / 2, p.H / 2 + H * s / 2 - h * s, w * s, h * s)
}

/* ── il ritratto di una torre ──
   Nelle carte del foglio (cosa costruire, la scheda, il potenziamento, il
   riepilogo) la torre è la stessa figura del campo, grande quanto il
   riquadro lascia. La scala è **una per tutte le torri** — quella che fa
   stare nel riquadro la figura più grande del foglio — e non una per
   figura: fatte stare tutte a misura piena, la torre appena costruita e
   quella al massimo sembrerebbero grandi uguali, e crescere non si
   vedrebbe più. */
let piuGrande = null
function ritrattoTorre(p, cosa) {
  if (!img) return PITTORI.torre(p, { ...cosa, x: p.W / 2, y: p.H * 0.82 })
  if (!piuGrande) {
    const torri = Object.keys(PEZZI).filter(k => k.startsWith('torre:')).map(k => PEZZI[k])
    piuGrande = [Math.max(...torri.map(t => t[2])), Math.max(...torri.map(t => t[3]))]
  }
  const [sx, sy, w, h] = PEZZI[figuraTorre(cosa.tipo, cosa.lv, cosa.ramo)]
  const s = Math.min(p.W * 0.94 / piuGrande[0], p.H * 0.94 / piuGrande[1])
  p.ctx.imageSmoothingQuality = 'high'
  p.ctx.drawImage(img, sx, sy, w, h, p.W / 2 - w * s / 2, p.H * 0.97 - h * s, w * s, h * s)
}

/* `pronte` non è un pittore: è la promessa che chi dipinge una volta
   sola (il ritratto del nastro) aspetta per ridipingersi a foglio pronto */
export const PITTORI_SPRITE = { ...PITTORI, torre, mostro, ritratto, ritrattoTorre, castello: () => {},
                                pronte: () => caricaFigure() }
