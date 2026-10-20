/* I codici brevi con cui due amici si abbinano (docs/core/amici.md): cinque lettere, uso singolo, scadenza. Qui solo le regole;
   i Durable Object che le tengono sono in index.js. */
export const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ'      // senza la I e la O: si confondono con 1 e 0 a voce
export const CODICE = /^[A-Z]{5}$/
export const DURATA = 2 * 60 * 60 * 1000                 // un codice vale due ore
export const ERRORI_AL_MINUTO = 10                       // codici sbagliati da uno stesso indirizzo prima di fermarlo
export const CODICI_ORA = 30                             // codici creati all'ora da uno stesso indirizzo

export function nuovoCodice(casuali) {
  return Array.from(casuali, n => ALFABETO[n % ALFABETO.length]).join('')
}

/* conta un codice sbagliato: `stato` = { n, da } (da = inizio della finestra, ms); la finestra è di un minuto */
export function contaErrore(stato, ora) {
  let { n = 0, da = ora } = stato || {}
  if (ora - da > 60 * 1000) { n = 0; da = ora }
  n++
  return { n, da }
}

/* chi ha già sbagliato troppo nell'ultimo minuto non prova più, nemmeno col codice giusto */
export const bloccato = (stato, ora) => !!stato && ora - stato.da <= 60 * 1000 && stato.n >= ERRORI_AL_MINUTO
