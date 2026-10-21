/* Quali domande fa un gioco: dato puro, per la pagina del gioco nelle impostazioni dei grandi (docs/genitori/giochi.md).
   Chi fa la domanda dichiara (`sa:` nei moduli, `chiede:` nel manifesto), ma un gioco che pesca da un modulo lo sa solo nel suo codice
   (`domandaPerGioco({ moduli: ['conti'], … })`): qui lo si ripete, e `unita/domande-dei-giochi` controlla che ogni gioco con `quiz: true`
   sia nominato. Tre forme:
   - `{ moduli: [...] }`  pesca da quei moduli: i saperi sono le tipologie che dichiarano;
   - `'tutte'`            pesca dal mazzo intero (sotterraneo, survivors): le domande sono quelle dei quiz, tutte;
   - nessuna riga         il gioco non fa domande di scuola, o non le ha ancora elencate (`chiede:` del manifesto, se c'è). */
export const DOMANDE = {
  arena: { moduli: ['conti'] },
  giardino: { moduli: ['conti'] },
  sotterraneo: 'tutte',
  sotterraneo3d: 'tutte',
  survivors: 'tutte',
}

export const pescaDaTutte = chiave => DOMANDE[chiave] === 'tutte'
export const moduliDi = chiave => (DOMANDE[chiave] && DOMANDE[chiave].moduli) || []
