// Le misure del sotterraneo: dato puro, nessuna funzione che gioca, nessun canvas.

// 16px: la misura degli eroi di 0x72 ("16×16 DungeonTileset II"), a cui si riducono tutti i fogli generati
export const T = 16                               // la tessera, in pixel
export const SCALA_MIN = 2, SCALA_MAX = 5, SCALA_INIZIALE = 3   // interi: a 2,3 i pixel sarebbero larghi due e altri tre

export const ROCCIA = 0, PAVIMENTO = 1, PORTA = 2

// vita/attacco/difesa di partenza: valgono dentro una discesa e non crescono con le tappe fatte (dati/campagna.js)
export const EROE = { vita: 18, att: 3, dif: 1 }

export const TASCHE = 6   // un limite vero: piene, quello per terra resta per terra

// quanto si vede attorno all'eroe, in celle: senza torcia due e poco più, anche dentro le stanze; con la torcia sei,
// e una stanza si accende tutta; all'ultima stanza della torcia il raggio si stringe (docs/sotterraneo/regole.md, «La luce»)
export const RAGGIO = 2.3, RAGGIO_TORCIA = 6.2, RAGGIO_SGOCCIOLI = 4.2
// un mostro si sveglia quando ti avvicini a meno di SVEGLIA celle nella sua stanza, con la luce o senza: è quasi la
// stanza di prima (la sveglia non dipende dalla luce, o la torcia cambierebbe l'equilibrio), ma da sveglio si vede sempre,
// e al buio il raggio (2,3) è molto meno di sette: lo vedi arrivare, non lo vedi dormire (docs/sotterraneo/regole.md, «La luce»)
export const SVEGLIA = 7

// il mostro è più lento apposta: scappare deve funzionare sempre, o la stanza è una trappola
export const PASSO_EROE = 5.4, PASSO_MOSTRO = 3.1, PASSO_RIENTRO = 2.2
export const CALMA = 3   // il tempo di uscire dalla stanza, o lo scontro si riaprirebbe nel fotogramma dopo

// arredo (barili, casse...): non toccabile, disegnato più spento delle cose che rispondono (scena/tela.js).
// I tre generi decidono dove possono stare: appeso contro la parete di fondo, posato su un bordo, fuoco cambia la vista.
export const ARREDI = {
  appeso: ['stendardo', 'candelabro'],
  posato: ['barile', 'cassa', 'ossa', 'teschio-scena'],
  fuoco: ['braciere', 'lanterna'],
}

export const ARREDO_DICE = {
  barile: 'Un barile vuoto.',
  cassa: 'Una cassa sfondata: dentro non c\'è più niente.',
  ossa: 'Vecchie ossa. Meglio non chiedersi di chi.',
  'teschio-scena': 'Un teschio. Ti guarda male e basta.',
  braciere: 'Un braciere acceso. Scalda, e fa luce.',
  lanterna: 'Una lanterna appesa. La luce ce l\'hai già.',
  stendardo: 'Uno stendardo scolorito, di nessuno.',
  candelabro: 'Un candelabro con tre candele storte.',
}
export const ARREDO_LA_PRIMA_VOLTA =
  'Questo non si tocca: è arredamento, per questo è più spento.'

export const SORSO = 8, RIPOSO_SCALA = 4, VITA_PER_PIANO = 2

// il bersaglio di una missione (il mostro col nome, il forziere della cosa) si distingue dai suoi simili: più grande,
// con un'aura che pulsa piano di un colore solo suo (lo stesso del punto sulla mappina), e il nome sopra la testa
// quando è in vista (scena/tela.js, docs/sotterraneo/missioni.md)
export const BERSAGLIO = { scala: 1.4, colore: '#ff7ad9', luce: '255,122,217' }

export function guastiDelMondo() {
  const g = []
  if (SCALA_MIN >= SCALA_MAX) g.push('lo zoom non ha spazio fra minimo e massimo')
  if (SCALA_INIZIALE < SCALA_MIN || SCALA_INIZIALE > SCALA_MAX)
    g.push('la scala iniziale sta fuori dai suoi estremi')
  if (PASSO_MOSTRO >= PASSO_EROE)
    g.push('i mostri corrono quanto o più dell\'eroe: scappare non funziona più')
  if (TASCHE < 3) g.push('meno di tre tasche: lo zaino non è una scelta, è un intoppo')
  if (RAGGIO_TORCIA <= RAGGIO) g.push('la torcia non fa vedere più lontano')
  if (RAGGIO_SGOCCIOLI <= RAGGIO || RAGGIO_SGOCCIOLI >= RAGGIO_TORCIA) g.push('la torcia agli sgoccioli deve stare fra il buio e la torcia piena')
  for (const quali of Object.values(ARREDI))
    for (const k of quali)
      if (!ARREDO_DICE[k]) g.push(`l'arredo "${k}" non dice niente a chi lo tocca`)
  return g
}
