// Gli elementi dei colpi e gli stati che i mostri possono rifiutare (docs/sotterraneo/abilita.md, «Gli elementi»).
// Dato puro, senza import: lo leggono dati/abilita.js (l'elemento di un'abilità), dati/mostri.js e dati/grossi.js
// (resistenze, debolezze, immunità) e motore/scontro.js (il conto).
//
// Un'abilità che colpisce ha un elemento (`elemento` sul nodo o sul ramo; senza, `fisico`). Un mostro può:
//   resiste   un elemento: fa metà danno         teme    un elemento: fa un danno e mezzo
//   immune    uno stato: non lo prende (il colpo fa il suo danno, ma l'effetto non parte)
// L'attacco solito non ha elemento: nessuno gli resiste, nessuno lo teme (così il banco di prova e le misure non cambiano).

// `il`/`a`: come si dice in una frase («il fuoco», «al fuoco»), per le righe dello scontro
export const ELEMENTI = {
  fisico: { nome: 'fisico', il: 'i colpi fisici', a: 'ai colpi fisici', glifo: 'spada', tinta: '#b9c2d4' },
  fuoco: { nome: 'fuoco', il: 'il fuoco', a: 'al fuoco', glifo: 'fiamma', tinta: '#e8742f' },
  gelo: { nome: 'gelo', il: 'il gelo', a: 'al gelo', glifo: 'fiocco', tinta: '#58b4e6' },
  fulmine: { nome: 'fulmine', il: 'il fulmine', a: 'al fulmine', glifo: 'fulmine', tinta: '#b98af0' },
  veleno: { nome: 'veleno', il: 'il veleno', a: 'al veleno', glifo: 'veleno', tinta: '#7cc94a' },
  sacro: { nome: 'sacro', il: 'la luce sacra', a: 'alla luce sacra', glifo: 'sole', tinta: '#ffe08a' },
}
export const CHIAVI_ELEMENTI = Object.keys(ELEMENTI)

// Gli stati che un'abilità mette addosso a un mostro e che un mostro può rifiutare. `non`: la frase che lo dice
//   avvelena   il veleno (l'elemento veleno)           brucia    le fiamme (l'elemento fuoco)
//   gela       il gelo: chi gela colpisce a metà; un gelo che blocca (fermo) è anche stordimento
//   stordisce  salta i suoi turni                      sanguina  il taglio che si aggrava
export const STATI = {
  avvelena: { non: 'non si avvelena', glifo: 'veleno' },
  brucia: { non: 'non brucia', glifo: 'fiamma' },
  gela: { non: 'non gela', glifo: 'fiocco' },
  stordisce: { non: 'non si stordisce', glifo: 'stelle' },
  sanguina: { non: 'non sanguina', glifo: 'sangue' },
}
export const CHIAVI_STATI = Object.keys(STATI)

// Quali stati metterebbe un nodo, secondo cosa fa e di che elemento è: serve a sapere cosa rifiuta un mostro immune.
// Il fermo del gelo (una prigione di ghiaccio) è gelo e stordimento insieme; il veleno di un'abilità di fuoco è fiamma.
// Il `debole` che non è di gelo (Rovi, Muro, Grido: «fa metà del danno») non si rifiuta: non è uno stato del mostro
export function statiDelNodo(nodo, elemento = nodo && nodo.elemento) {
  if (!nodo) return []
  const s = []
  if (nodo.veleno) s.push(elemento === 'fuoco' ? 'brucia' : 'avvelena')
  if (nodo.debole && elemento === 'gelo') s.push('gela')
  if (nodo.fermo || nodo.quieto) {
    if (elemento === 'gelo') s.push('gela')
    s.push('stordisce')
  }
  if (nodo.sanguina) s.push('sanguina')
  return [...new Set(s)]
}

// il fattore dell'elemento contro un mostro: 0,5 se resiste, 1,5 se teme, 1 altrimenti
export const FATTORE_RESISTE = 0.5
export const FATTORE_TEME = 1.5
export function fattoreDi(difese, elemento) {
  if (!difese || !elemento) return 1
  if ((difese.resiste || []).includes(elemento)) return FATTORE_RESISTE
  if ((difese.teme || []).includes(elemento)) return FATTORE_TEME
  return 1
}

// I guasti di una scheda di difese (`resiste`, `teme`, `immune`) di chi la possiede
export function guastiDelleDifese(chi, d) {
  const g = []
  if (!d) return g
  for (const e of [...(d.resiste || []), ...(d.teme || [])]) if (!ELEMENTI[e]) g.push(`${chi}: l'elemento "${e}" non esiste`)
  for (const s of d.immune || []) if (!STATI[s]) g.push(`${chi}: lo stato "${s}" non esiste`)
  for (const e of d.resiste || []) if ((d.teme || []).includes(e)) g.push(`${chi}: resiste e teme ${e}`)
  if ((d.resiste || []).length + (d.teme || []).length + (d.immune || []).length > 6) g.push(`${chi}: troppe difese, non si leggono più`)
  return g
}
