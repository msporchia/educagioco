/* ═══════════════════════════════════════════════════════════════════
   I SEGNI — quello che un personaggio dice senza parlare

   Gli occhi, i puntini di chi aspetta, le schegge di chi è stato
   colpito, la scintilla di una cosa da raccogliere, e soprattutto
   **la tavolozza degli stati**: il modo in cui un personaggio diventa
   rosso di errore o bianco di botta senza che nessuna delle sue
   trenta figure debba saperlo.

   Sta fuori da `corpo.js` perché non riguarda solo chi ha due gambe:
   un lupo lampeggia di rosso allo stesso modo, e un giorno lo farà
   anche una porta.
   ═══════════════════════════════════════════════════════════════════ */
import { tondo, tinge } from './comune.js'

/* ─────────── la luce della stanza ───────────
   Passa **tutto** di qui, e non è un caso: è l'unico punto che ogni
   personaggio attraversa prima di essere dipinto, quindi è l'unico
   posto dove si può dire «adesso siete tutti dentro la stessa
   stanza» senza aprire i tredici file di `personaggi/`.

   Due spinte, in ordine. Prima la notte, che toglie: un orco al buio
   non è un orco più scuro, è un orco che tende al blu della notte,
   perché è quello il colore che resta quando la luce se ne va.
   Poi il fuoco, che aggiunge: chi sta nella pozza di una torcia
   prende il caldo della fiamma sulla pelle e sul ferro.

   Le quantità sono volutamente forti. Timide non si vedevano, e il
   punto di questo lavoro era proprio smettere di fare cose che non si
   vedono. */
function illumina(p, pal, x, y) {
  if (!p.luce) return pal
  let C = pal
  const L = p.luce(x, y)
  if (L.buio > 0.01) C = tinge(C, L.notte, L.buio * 0.78)
  if (L.forza > 0.01) C = tinge(C, L.tinta, L.forza * 0.40)
  return C
}

/* ─────────── lo stato ───────────
   Lo stato non cambia il disegno: cambia la tavolozza. Un colore solo
   da spostare invece di trenta figure da riscrivere. */
export function tavolozzaStato(p, pal, stato, t, x, y, s) {
  /* la stanza tinge per prima, lo stato per ultimo: un personaggio
     rosso di errore deve restare rosso anche in fondo a una cripta,
     se no l'unica cosa che il bambino deve vedere è quella che il
     buio si mangia */
  let C = illumina(p, pal, x, y), velo = 1, giro = 0, scarto = 0
  if (stato === 'errore') {
    // sempre rosso, e a tratti rosso acceso: se il lampeggio scendeva
    // sotto la metà il personaggio diventava marrone, non «sbagliato»
    C = tinge(C, '#ff2020', 0.56 + 0.38 * Math.max(0, Math.sin(t * 14)))
    scarto = Math.sin(t * 26) * 0.5 * s
    p.velo(0.18 + 0.16 * Math.max(0, Math.sin(t * 14)),
           () => p.ellisse(x, y - 9 * s, 11 * s, 13 * s, '#ff2020'))
  } else if (stato === 'colpito') {
    C = tinge(C, '#ffffff', 0.55)
    scarto = Math.sin(t * 30) * 1.1 * s
  } else if (stato === 'ko') {
    C = tinge(C, '#6a6274', 0.45)
    velo = 0.75; giro = 1.35
  }
  return { C, velo, giro, scarto }
}

/* ─────────── occhi ───────────
   Due bianchi e due pupille: cambiano solo la distanza e la faccia
   che ci sta intorno. Da ko diventano due croci, che è la scorciatoia
   che capiscono anche i bambini di sei anni. */
export function occhi(p, s, dx, dy, r, stato, pupilla = '#20182e') {
  if (stato === 'ko') {
    p.ctx.strokeStyle = pupilla; p.ctx.lineWidth = 0.85 * s; p.ctx.lineCap = 'round'
    for (const v of [-1, 1]) {
      const cx = v * dx * s
      p.ctx.beginPath()
      p.ctx.moveTo(cx - r * 0.8 * s, dy * s - r * 0.8 * s); p.ctx.lineTo(cx + r * 0.8 * s, dy * s + r * 0.8 * s)
      p.ctx.moveTo(cx + r * 0.8 * s, dy * s - r * 0.8 * s); p.ctx.lineTo(cx - r * 0.8 * s, dy * s + r * 0.8 * s)
      p.ctx.stroke()
    }
    return
  }
  for (const v of [-1, 1]) {
    tondo(p, v * dx * s, dy * s, r * s, r * 1.15 * s, '#ffffff')
    tondo(p, (v * dx + 0.25) * s, (dy + 0.15) * s, r * 0.52 * s, r * 0.62 * s, pupilla)
  }
}

/* i tre puntini di chi aspetta un ordine: piccoli, sopra la testa, e
   si accendono a turno — è il modo più corto per dire «sono fermo
   apposta», che è diverso da «sono fermo perché non ho capito» */
export function pensiero(p, x, y, s, t) {
  p.ctx.beginPath()
  p.ctx.ellipse(x, y, 5 * s, 2.4 * s, 0, 0, 6.29)
  p.ctx.fillStyle = '#ffffffdd'; p.ctx.fill()
  p.ctx.strokeStyle = '#00000033'; p.ctx.lineWidth = 0.6 * s; p.ctx.stroke()
  p.figura([[x - 1.4 * s, y + 2 * s], [x + 1.4 * s, y + 2 * s], [x - 0.6 * s, y + 4.4 * s]], '#ffffffdd')
  for (let i = 0; i < 3; i++) {
    const acceso = (Math.floor(t * 3) % 3) === i
    p.cerchio(x + (i - 1) * 2.4 * s, y, 0.85 * s, acceso ? '#3a3350' : '#3a335055')
  }
}

/* la botta: sei schegge che scappano dal punto colpito */
export function botta(p, x, y, s, t) {
  const f = (t * 6) % 1
  p.velo(1 - f, () => {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * 6.29 + 0.4
      const r0 = (4 + f * 5) * s, r1 = (7 + f * 6) * s
      p.linea([{ x: x + Math.cos(a) * r0, y: y + Math.sin(a) * r0 },
               { x: x + Math.cos(a) * r1, y: y + Math.sin(a) * r1 }], '#fff0a0', 1.4 * s)
    }
  })
}

/* la scintilla a otto punte: serve alla chiave, al forziere e a ogni
   incantesimo che si rispetti */
export function scintilla(p, x, y, r, f) {
  if (f < 0 || f > 1) return
  const a = Math.sin(f * Math.PI)
  p.velo(a, () => {
    const R = r * (0.5 + a * 0.8)
    p.figura([[x, y - R], [x + R * 0.26, y - R * 0.26], [x + R, y],
              [x + R * 0.26, y + R * 0.26], [x, y + R],
              [x - R * 0.26, y + R * 0.26], [x - R, y],
              [x - R * 0.26, y - R * 0.26]], '#ffffff')
  })
}
