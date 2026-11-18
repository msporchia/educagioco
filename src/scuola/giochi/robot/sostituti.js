// Quello che il Robot porta con sé e a scuola non si apre (docs/costruttore/scuola.md). Percorsi dalla radice del repo.
export default {
  sostituti: {
    // la scheda dei livelli: col limite si parte dal cantiere, e senza di lei se ne vanno anche gli amici sui led
    'src/giochi/costruttore/viste/Scheda.vue': 'src/scuola/sostituti/Vuoto.vue',
  },
  // il gioco intero; il resto che usa (store, giochi/campagne.js, aiuti.js, guida.js) sta fuori dalle cartelle dei giochi
  ammessi: ['src/giochi/costruttore/'],
}
