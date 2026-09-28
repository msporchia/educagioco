/* La spinta al bordo: tenendo una cosa in mano contro il bordo dello schermo, il mondo scorre da solo
   verso quel lato — vedi docs/fattoria/come-si-tocca.md. Puro: prende punto, riquadro, vista, mondo,
   dt, e torna solo di quanti pixel spostare la vista, così si prova senza canvas né browser. */

// la fascia sensibile lungo ogni bordo, in pixel di schermo
export const FASCIA_QUOTA = 1 / 6
export const FASCIA_MIN = 44
export const FASCIA_MAX = 90

// quanto corre il mondo, in pixel di schermo al secondo
export const VELOCITA_MIN = 90
export const VELOCITA_MAX = 460

const fra = (min, v, max) => Math.max(min, Math.min(max, v))

export const fasciaPer = (L, A) =>
  fra(FASCIA_MIN, Math.min(L, A) * FASCIA_QUOTA, FASCIA_MAX)

// Quanto si può ancora scorrere per lato, in pixel; un mondo che ci sta tutto non scorre in quella direzione.
export function spazioAttorno(vista, mondo, L, A) {
  const largo = mondo.w > L, alto = mondo.h > A
  return {
    sinistra: largo ? Math.max(0, vista.x - mondo.x) : 0,
    destra: largo ? Math.max(0, mondo.x + mondo.w - L - vista.x) : 0,
    su: alto ? Math.max(0, vista.y - mondo.y) : 0,
    giu: alto ? Math.max(0, mondo.y + mondo.h - A - vista.y) : 0,
  }
}

// Quanto è "dentro" il dito, da 0 a 1; oltre il bordo non si accelera oltre il massimo.
const quanto = (distanza, fascia) => fra(0, (fascia - distanza) / fascia, 1)

const velocitaPer = q => q <= 0 ? 0 : VELOCITA_MIN + (VELOCITA_MAX - VELOCITA_MIN) * q * q

// La spinta di questo fotogramma, in pixel da sommare alla vista (dx positivo = vista a destra).
// Le due direzioni si sottraggono (non un if), se no su uno schermo stretto la vista partirebbe da sola.
export function spintaAlBordo({ punto, L, A, vista, mondo, dt,
                                fascia = null, velocita = velocitaPer }) {
  if (!punto || !(L > 0) || !(A > 0) || !(dt > 0)) return { dx: 0, dy: 0 }
  const f = fascia == null ? fasciaPer(L, A) : fascia
  const spazio = spazioAttorno(vista, mondo, L, A)

  let dx = (velocita(quanto(L - punto.x, f)) - velocita(quanto(punto.x, f))) * dt
  let dy = (velocita(quanto(A - punto.y, f)) - velocita(quanto(punto.y, f))) * dt

  dx = dx > 0 ? Math.min(dx, spazio.destra) : Math.max(dx, -spazio.sinistra)
  dy = dy > 0 ? Math.min(dy, spazio.giu) : Math.max(dy, -spazio.su)
  // || 0 non è cerimonia: tagliare una spinta contro uno spazio zero dà -0, un altro valore per Object.is.
  return { dx: dx || 0, dy: dy || 0 }
}

// Il resto non si butta: una spinta lenta vale frazioni di pixel, e senza tenerle da parte metà della
// fascia non muoverebbe niente. nuovo torna il passo intero e il resto da ricordare.
export function conIlResto(resto, dx, dy) {
  const rx = resto.x + dx, ry = resto.y + dy
  const ix = Math.trunc(rx), iy = Math.trunc(ry)
  return { dx: ix, dy: iy, resto: { x: rx - ix, y: ry - iy } }
}
