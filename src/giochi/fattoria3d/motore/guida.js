/* La guida del primo giro della fattoria 3D: una riga e un anello sull'unica cosa da toccare adesso (contratto in giochi/guida.js,
   regole in docs/core/guida.md). Pura: dal quadro di quello che c'è dice il passo `{ testo, dove, mano? }`, o null quando tace.
   Si legge lo schermo, non un copione: regge chi fa le cose in un altro ordine. Vedi docs/fattoria3d/guida.md. */

import { tempoBreve } from '../dati/tempo.js'

export const BERSAGLI = {
  costruisci: '[data-f3="az-costruisci"]',
  seme: '[data-f3="attrezzi"] [data-seme="grano"]',
  falce: '[data-f3="attrezzi"] [data-f3="falce"]',
  carta: '[data-f3="costruisci-qui"] [data-carta="campo"]',
}

/** Quanto si spende senza aver «giocato» già: raccogliere il grano costa 🪙1 (il gesto della 2D), e il primo raccolto è proprio il traguardo del primo giro. */
export const SPESA_DEL_PRIMO_GIRO = 2

/** Il primo giro serve solo a chi non ha ancora fatto niente qui: nessuna spesa vera, nessun raccolto in scorta, nessun prodotto. */
export function servePrimoGiro({ esperienza = 0, merci = {}, prodotti = {}, lana = 0 } = {}) {
  if (esperienza > SPESA_DEL_PRIMO_GIRO || lana > 0) return false
  return !Object.values(merci).some(n => n > 0) && !Object.values(prodotti).some(n => n > 0)
}

/**
 * Il passo di adesso. Il quadro (tutto numeri e sì/no, niente motore):
 *  - `campi`: quanti campi ci sono; `vuoti`, `maturi`, `crescono`: come stanno; `secondi`: fra quanto il primo matura
 *  - `attrezzo`: semi | falce, l'attrezzo accanto al campo, o null; `costruisci`: il menu «Compra» è aperto
 *  - `foglio`: un altro foglio (macchina, banco, livelli…) è aperto; `raccolto`: il primo raccolto è in scorta
 *  - `visto`: il menu «Compra» è già stato aperto una volta nel primo giro
 */
export function guidaDelPrimoGiro(q = {}) {
  const { campi = 0, vuoti = 0, maturi = 0, crescono = 0, secondi = 0, attrezzo = null, costruisci = false, foglio = false, raccolto = false, visto = false } = q
  if (foglio) return null                                   // un foglio di quelli che la guida non conosce: non gli si parla sopra
  if (attrezzo === 'semi') return { dove: BERSAGLI.seme, mano: true, testo: 'Trascina il grano sul campo: cresce da solo.' }
  if (attrezzo === 'falce') return { dove: BERSAGLI.falce, mano: true, testo: 'Trascina il falcetto sul campo pronto.' }
  if (costruisci) {
    if (!campi) return { dove: BERSAGLI.carta, mano: true, testo: 'Tocca il campo: ci crescono i raccolti.' }
    return null
  }
  if (!campi) return { dove: BERSAGLI.costruisci, mano: true, testo: 'Serve un campo: tocca 🛒 Compra.' }
  if (maturi) return { dove: null, testo: 'È pronto! Tocca il campo.' }
  /* il primo raccolto è il traguardo: il campo tornato vuoto può aspettare, il passo è spendere */
  if (raccolto && !visto) return { dove: BERSAGLI.costruisci, mano: true, testo: 'Bravo! Ora tocca 🛒 Compra e fai crescere la fattoria.' }
  if (vuoti) return { dove: null, testo: 'Tocca il campo vuoto.' }
  if (crescono) return { dove: null, testo: `Il grano cresce${secondi ? `: ancora ${tempoBreve(secondi * 1000)}` : ''}.` }
  return null
}

/** Il primo giro è finito: ha raccolto e ha visto il menu delle costruzioni (o ha già speso). Da lì la guida tace per sempre. */
export const primoGiroFinito = ({ raccolto = false, visto = false, esperienza = 0 } = {}) => esperienza > SPESA_DEL_PRIMO_GIRO || (raccolto && visto)
