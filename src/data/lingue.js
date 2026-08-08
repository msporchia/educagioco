/* ═══════════════════════════════════════════════════════════════════
   LE LINGUE — tutto quello che distingue English da Spagnolo, in un
   posto solo.

   Il gioco è uno: `views/LinguaGame.vue`. Cambiano i contenuti, le
   chiavi con cui il motore di apprendimento se li ricorda, e il nome
   scritto sulla carta. Aggiungere una terza lingua domani vuol dire
   aggiungere i tre file di dati, la campagna e una voce qui — non
   toccare il gioco.

   `campo` è dove il profilo tiene a che tappa si è arrivati (`eng` per
   l'inglese, `esp` per lo spagnolo), `contatori` sono i nomi dei
   totali che salgono a ogni risposta giusta. Sono nomi storici: i
   profili salvati sui telefoni dei bambini li usano già così.
   ═══════════════════════════════════════════════════════════════════ */
import { PREFISSI } from './lessico.js'
import { CAMPAGNA as TAPPE_EN, LIBERO as LIBERO_EN, tappaEn } from './campagna-inglese.js'
import { CAMPAGNA as TAPPE_ES, LIBERO as LIBERO_ES, tappaEs } from './campagna-spagnolo.js'

export const LINGUE = {
  en: {
    id: 'en',
    nome: 'inglese',              // come finisce nell'etichetta della domanda
    titolo: 'English',            // come si chiama il gioco
    emoji: '🌐',
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
