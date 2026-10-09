/* I semi dei test a giocatore finto: `SEMI=17 node test/esegui.mjs survivors`
   sposta di 17 tutti i semi del file, e serve a vedere se un controllo
   passa per la taratura o per fortuna — vedi docs/core/test.md */
export const spostaSemi = caso => {
  const di = Number(process.env.SEMI) || 0
  return seme => caso(seme + di)
}
