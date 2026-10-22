/* La guida del primo giro della fattoria 3D: una riga e un anello sull'unica cosa da toccare adesso (contratto in giochi/guida.js,
   regole in docs/core/guida.md). Pura: dal quadro di quello che c'è dice il passo `{ testo, dove, mano? }`, o null quando tace.
   Si legge lo schermo, non un copione: regge chi fa le cose in un altro ordine. Vedi docs/fattoria3d/guida.md. */

import { tempoBreve } from '../dati/tempo.js'

export const BERSAGLI = {
  semina: '[data-f3="az-semina"]',
  raccogli: '[data-f3="az-raccogli"]',
  costruisci: '[data-f3="az-costruisci"]',
  seme: '[data-f3="semi"] [data-seme="grano"]',
  chiudiSemi: '[data-f3="semi"] [data-chiudi]',
  carta: '[data-f3="costruisci-qui"] [data-carta="campo"]',
}

/** Il primo giro serve solo a chi non ha ancora fatto niente qui: nessuna spesa, nessun raccolto in scorta, nessun prodotto. */
export function servePrimoGiro({ esperienza = 0, merci = {}, prodotti = {}, lana = 0 } = {}) {
  if (esperienza > 0 || lana > 0) return false
  return !Object.values(merci).some(n => n > 0) && !Object.values(prodotti).some(n => n > 0)
}

/**
 * Il passo di adesso. Il quadro (tutto numeri e sì/no, niente motore):
 *  - `campi`: quanti campi ci sono; `vuoti`, `maturi`, `crescono`: come stanno; `secondi`: fra quanto il primo matura
 *  - `modo`: libero | semina | raccogli; `semi`: il foglio «Cosa semini?» è aperto; `costruisci`: il menu «Costruisci qui» è aperto
 *  - `foglio`: un altro foglio (macchina, banco, livelli…) è aperto; `raccolto`: il primo raccolto è in scorta
 *  - `visto`: il menu «Costruisci qui» è già stato aperto una volta nel primo giro
 */
export function guidaDelPrimoGiro(q = {}) {
  const { campi = 0, vuoti = 0, maturi = 0, crescono = 0, secondi = 0, modo = 'libero', semi = false, costruisci = false, foglio = false, raccolto = false, visto = false } = q
  if (foglio) return null                                   // un foglio di quelli che la guida non conosce: non gli si parla sopra
  if (semi) return { dove: BERSAGLI.seme, mano: true, testo: 'Scegli il grano: si semina e cresce da solo.' }
  if (costruisci) {
    if (!campi) return { dove: BERSAGLI.carta, mano: true, testo: 'Tocca il campo: ci crescono i raccolti.' }
    return null
  }
  if (!campi) return { dove: BERSAGLI.costruisci, mano: true, testo: 'Serve un campo: tocca 🏗 Costruisci.' }
  if (maturi && modo !== 'raccogli') return { dove: BERSAGLI.raccogli, mano: true, testo: 'È pronto! Tocca ✂️ Raccogli.' }
  if (maturi && modo === 'raccogli') return { dove: null, testo: 'Tocca il campo pronto: il contadino lo taglia.' }
  /* il primo raccolto è il traguardo: il campo tornato vuoto può aspettare, il passo è spendere */
  if (raccolto && !visto) return { dove: BERSAGLI.costruisci, mano: true, testo: 'Bravo! Ora tocca 🏗 Costruisci e fai crescere la fattoria.' }
  if (vuoti && modo !== 'semina') return { dove: BERSAGLI.semina, mano: true, testo: 'Tocca 🌱 Semina e scegli cosa far crescere.' }
  if (vuoti && modo === 'semina') return { dove: null, testo: 'Tocca il campo vuoto: il contadino ci semina.' }
  if (crescono) return { dove: null, testo: `Il grano cresce${secondi ? `: ancora ${tempoBreve(secondi * 1000)}` : ''}.` }
  return null
}

/** Il primo giro è finito: ha raccolto e ha visto il menu delle costruzioni (o ha già speso). Da lì la guida tace per sempre. */
export const primoGiroFinito = ({ raccolto = false, visto = false, esperienza = 0 } = {}) => esperienza > 0 || (raccolto && visto)
