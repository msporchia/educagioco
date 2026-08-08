/* ═══════════════════════════════════════════════════════════════════
   IL RIQUADRO — dove finiscono i disegni di una domanda.

   Una risposta disegnata (un orologio, una figura da specchiare, una
   griglia) sta dentro un quadrato e basta. Qui c'è l'unica cosa che
   serve a farcela stare: un canvas alla risoluzione vera dello schermo,
   con il sistema di coordinate portato a un mondo fisso di 100×100.

   È QUESTO IL PATTO CON CHI DISEGNA: un pittore lavora sempre in un
   quadrato 100×100 con l'origine in alto a sinistra, e non sa quanto
   sarà grande davvero. `p.testo('3', 50, 50, '#fff', 14)` scrive un 3
   al centro, alto un settimo del riquadro, sul telefono come sul
   computer. Nessun pittore deve leggere `canvas.width`.

   Il pennello è quello di `grafica/tela.js` — cerchio, rett, figura,
   linea, testo, in, velo — perché i pittori dei quiz e quelli del
   castello devono restare la stessa cosa il giorno che si fondono.
   ═══════════════════════════════════════════════════════════════════ */

import { pennello } from '../../grafica/tela.js'

export const LATO = 100        // il mondo dei pittori, sempre questo

/* Dipinge una scena in un canvas quadrato. `pittori` è la tabella del
   modulo; una scena senza pittore lascia il riquadro vuoto invece di
   far esplodere la pagina (una domanda mancante è meglio di un gioco
   morto — il banco di prova la prende comunque). */
export function dipingi(canvas, pittori, scena, { fondo = null } = {}) {
  const lato = Math.max(1, Math.round(canvas.clientWidth || canvas.width || 120))
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1
  canvas.width = Math.floor(lato * dpr)
  canvas.height = Math.floor(lato * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, lato, lato)
  if (fondo) { ctx.fillStyle = fondo; ctx.fillRect(0, 0, lato, lato) }

  const s = lato / LATO
  ctx.scale(s, s)
  const p = pennello(ctx, { W: LATO, H: LATO, S: 1 })
  const pittore = pittori?.[scena?.che]
  if (pittore) pittore(p, scena)
  return p
}
