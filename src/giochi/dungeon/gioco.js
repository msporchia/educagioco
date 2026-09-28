// Il manifesto: dato puro, vedi docs/core/convenzione-giochi.md e docs/dungeon/regole.md.
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'dungeon'

export default {
  chiave: CHIAVE,
  nome: 'Il Dungeon',
  icona: '🗝️',
  che: 'scegli la strada, le domande aprono le porte',
  area: 'avventure',
  come: 'domande',
  // Passa dal mazzo di src/quiz/ tagliato per età (vedi data/quadro.js).
  quiz: true,
  tappe: QUANTE_TAPPE,
  tinta: '#e6dcf7',   // chiaro anche se il gioco è notturno: il testo in home è blu scuro per tutti

  riassunto(av = { tappa: 0, libera: false, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) return `discesa senza fondo ♾️${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  // I traguardi, raccolti da src/giochi/albo.js. I contatori (dungeonStanze,
  // dungeonBoss, dungeonInteri, dungeonTesori) li scrive Gioco.vue a fine discesa.
  albo: {
    area: { nome: 'Il Dungeon', emoji: '🗝️' },

    xp: m => m.tot('dungeonStanze') * 2 + m.tot('dungeonBoss') * 15 +
             m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('dungeonStanze') > 0,

    traguardi: [
      { id: 'dng-stanze', emoji: '🚪', nome: 'Esploratore',
        come: n => `Attraversa ${n} stanze del dungeon`,
        soglie: [15, 80, 300], valore: m => m.tot('dungeonStanze') },
      { id: 'dng-boss', emoji: '👑', nome: 'Ammazzaguardiani',
        come: n => n === 1 ? 'Batti il guardiano in fondo a un dungeon'
                           : `Batti ${n} guardiani`,
        soglie: [1, 5, 15], valore: m => m.tot('dungeonBoss') },
      { id: 'dng-interi', emoji: '❤️', nome: 'Nemmeno un graffio',
        come: n => n === 1 ? 'Finisci un dungeon senza perdere un cuore'
                           : `Finisci ${n} dungeon senza perdere un cuore`,
        soglie: [1, 3, 10], valore: m => m.tot('dungeonInteri') },
      { id: 'dng-tesori', emoji: '🎁', nome: 'Cercatore di tesori',
        come: n => `Trova ${n} tesori là sotto`,
        soglie: [3, 15, 50], valore: m => m.tot('dungeonTesori') },
      { id: 'dng-tappe', emoji: '🪜', nome: 'Sempre più giù',
        come: n => n === 1 ? 'Supera la prima discesa della campagna'
                           : `Supera ${n} discese della campagna`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'dng-campagna', emoji: '🏁', nome: 'Il covo del drago',
        come: () => 'Finisci tutte le discese della campagna',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}
