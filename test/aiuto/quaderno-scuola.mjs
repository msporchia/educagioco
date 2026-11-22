/* Un quaderno della maestra già fatto, una classe e una lezione: la pagina d'inizio mostra tutto solo con tutte e due
   (docs/scuola/quaderno.md, «I primi passi»). Per i test che guardano la pagina dei bambini o il quaderno, non i primi passi.
   Si scrive prima che la pagina parta e solo se manca, così un ricaricamento tiene quello che il test ha cambiato. */
export const QUADERNO = {
  'scuola:classi': [{ id: 'c1', nome: '3ª B', alunni: [{ id: 'a1', nome: 'Lorenzo' }, { id: 'a2', nome: 'Marta' }] }],
  'scuola:lezioni': [{ id: 'l1', nome: 'Il ripasso del 2', blocchi: [{ esercizio: { tipo: 'tabelline', tabelline: [2], modo: 'prodotto' }, passa: null }], inTondo: false }],
}

/** `dove`: una pagina o un contesto di Playwright. */
export const seminaQuaderno = dove => dove.addInitScript(q => {
  try { for (const [k, v] of Object.entries(q)) if (localStorage.getItem(k) == null) localStorage.setItem(k, JSON.stringify(v)) } catch { /* niente archivio: niente quaderno */ }
}, QUADERNO)
