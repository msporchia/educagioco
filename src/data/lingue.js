// Tutto quello che distingue English da Spagnolo: il gioco è uno solo
// (views/LinguaGame.vue). Vedi docs/lingue/README.md e vocaboli.md.
// `contatori` sono nomi storici: i profili salvati li usano già così.
import { PREFISSI } from './lessico.js'
import { CAMPAGNA as TAPPE_EN, LIBERO as LIBERO_EN, tappaEn } from './campagna-inglese.js'
import { CAMPAGNA as TAPPE_ES, LIBERO as LIBERO_ES, tappaEs } from './campagna-spagnolo.js'

export const LINGUE = {
  en: {
    id: 'en',
    nome: 'inglese',              // come finisce nell'etichetta della domanda
    titolo: 'English',            // come si chiama il gioco
    emoji: '🇬🇧',
    classe: 'eng',                // la carta in home e il colore
    campo: 'eng',                 // dove sta la campagna dentro il profilo
    vista: 'inglese',             // il nome della schermata in App.vue
    prefissi: PREFISSI.en,
    contatori: { parola: 'en', verbo: 'verbi', frase: 'frasi' },
    CAMPAGNA: TAPPE_EN, LIBERO: LIBERO_EN, tappaDi: tappaEn,
  },
  es: {
    id: 'es',
    nome: 'spagnolo',
    titolo: 'Español',
    emoji: '🇪🇸',
    classe: 'esp',
    campo: 'esp',
    vista: 'spagnolo',
    prefissi: PREFISSI.es,
    contatori: { parola: 'es', verbo: 'verbiEs', frase: 'frasiEs' },
    CAMPAGNA: TAPPE_ES, LIBERO: LIBERO_ES, tappaDi: tappaEs,
  },
}

export const linguaDi = id => LINGUE[id] || LINGUE.en
export const TUTTE_LINGUE = Object.values(LINGUE)
