// Il passato irregolare dei verbi che le tappe (e le forme) insegnano:
// passato → base.
// Ci sono tutti gli irregolari noti, non solo quelli che un capitolo usa:
// un verbo che manca da qui accetterebbe il passato in -ed («swimmed»).
// Lo usano il libro (motore/flessioni.js) e la trappola `passato-in-ed`.
// Vedi docs/lingue/libro.md («Le forme dei verbi»).
export const PASSATI = {
  went: 'go', saw: 'see', came: 'come', made: 'make', bought: 'buy', found: 'find',
  gave: 'give', took: 'take', won: 'win', caught: 'catch', threw: 'throw',
  ate: 'eat', drank: 'drink', slept: 'sleep', ran: 'run', swam: 'swim', flew: 'fly',
  sang: 'sing', wrote: 'write', had: 'have', did: 'do',
  said: 'say', told: 'tell', spoke: 'speak', knew: 'know', fell: 'fall', sat: 'sit', stood: 'stand',
  wore: 'wear', drew: 'draw', built: 'build',
  // i verbi del cassetto che le storie possono usare (docs/lingue/libro-racconti.md)
  heard: 'hear', drove: 'drive',
}

// i verbi il cui passato è uguale alla base: niente -ed, e niente da cercare
export const PASSATO_UGUALE = new Set(['read'])
